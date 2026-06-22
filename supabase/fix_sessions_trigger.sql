-- ============================================================
-- Fix toàn bộ trigger logic cho sessions và package alerts
-- Chạy file này trên Supabase SQL Editor
-- ============================================================

-- ── Fix 1: fn_update_used_sessions ──────────────────────────
-- Đếm cả 'makeup' vào used_sessions (không chỉ 'present')
-- Trigger AFTER INSERT OR UPDATE OR DELETE (không bỏ UPDATE)

DROP TRIGGER IF EXISTS trg_update_used_sessions ON sessions;

CREATE OR REPLACE FUNCTION fn_update_used_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE packages
  SET used_sessions = (
    SELECT COUNT(*) FROM sessions
    WHERE package_id = COALESCE(NEW.package_id, OLD.package_id)
      AND status IN ('present', 'makeup')
  )
  WHERE id = COALESCE(NEW.package_id, OLD.package_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_used_sessions
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_used_sessions();


-- ── Fix 2: fn_check_package_alerts ──────────────────────────
-- Ngưỡng cảnh báo "sắp hết": còn CEIL(total/4) buổi
--   Gói 4  buổi → cảnh báo khi dùng 3/4  (còn 1)
--   Gói 8  buổi → cảnh báo khi dùng 6/8  (còn 2)
--   Gói 12 buổi → cảnh báo khi dùng 9/12 (còn 3)
-- Tránh tạo alert trùng bằng EXISTS check
-- Khi hết gói: tự resolve near_end cũ trước khi tạo package_ended

DROP TRIGGER IF EXISTS trg_check_package_alerts ON packages;

CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_threshold integer;
BEGIN
  v_threshold := CEIL(NEW.total_sessions::numeric / 4);

  -- Sắp hết: lần đầu vượt ngưỡng (chưa hết gói)
  IF NEW.used_sessions >= (NEW.total_sessions - v_threshold)
     AND OLD.used_sessions < (NEW.total_sessions - v_threshold)
     AND NEW.used_sessions < NEW.total_sessions THEN
    IF NOT EXISTS (
      SELECT 1 FROM alerts
      WHERE student_id = NEW.student_id
        AND type = 'near_end'
        AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type)
      VALUES (NEW.student_id, 'near_end');
    END IF;
  END IF;

  -- Hết gói
  IF NEW.used_sessions >= NEW.total_sessions
     AND OLD.used_sessions < NEW.total_sessions THEN
    -- Đánh dấu gói completed
    UPDATE packages SET status = 'completed' WHERE id = NEW.id;
    -- Resolve near_end cũ (không cần nhắc nữa)
    UPDATE alerts
    SET resolved = true, resolved_at = now()
    WHERE student_id = NEW.student_id
      AND type = 'near_end'
      AND resolved = false;
    -- Tạo package_ended nếu chưa có
    IF NOT EXISTS (
      SELECT 1 FROM alerts
      WHERE student_id = NEW.student_id
        AND type = 'package_ended'
        AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type)
      VALUES (NEW.student_id, 'package_ended');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_package_alerts
AFTER UPDATE OF used_sessions ON packages
FOR EACH ROW EXECUTE FUNCTION fn_check_package_alerts();
