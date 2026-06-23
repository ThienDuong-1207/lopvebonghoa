-- ============================================================
-- CRITICAL FIX: Trigger functions cần SECURITY DEFINER
-- ============================================================
-- Vấn đề: Khi staff (role authenticated) insert session,
--   trigger chạy dưới quyền authenticated → cố UPDATE packages/students
--   → RLS block (staff chỉ có SELECT) → trigger lỗi → session INSERT bị rollback
--   → staff không thể điểm danh
-- Fix: SECURITY DEFINER → trigger chạy với quyền của postgres (owner)
--   → bypass RLS → UPDATE packages + students thành công
-- ============================================================

-- ── fn_update_used_sessions ──────────────────────────────────
-- Trigger: AFTER INSERT OR UPDATE OR DELETE ON sessions
-- Cập nhật packages.used_sessions (đếm lại từ sessions)
-- Cần UPDATE packages → cần SECURITY DEFINER

DROP TRIGGER IF EXISTS trg_update_used_sessions ON sessions;

CREATE OR REPLACE FUNCTION fn_update_used_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE TRIGGER trg_update_used_sessions
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_used_sessions();


-- ── fn_update_last_seen ──────────────────────────────────────
-- Trigger: AFTER INSERT ON sessions
-- Cập nhật students.last_seen_at (dùng GREATEST để tránh điểm danh bù ghi đè)
-- Cần UPDATE students → cần SECURITY DEFINER

CREATE OR REPLACE FUNCTION fn_update_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE students
  SET last_seen_at = GREATEST(
    COALESCE(last_seen_at, '-infinity'::timestamptz),
    NEW.session_date::timestamptz
  )
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;
-- Trigger trg_update_last_seen đã tồn tại → function cập nhật tự động


-- ── fn_check_package_alerts ──────────────────────────────────
-- Trigger: AFTER UPDATE OF used_sessions ON packages
-- Tạo/resolve alerts + UPDATE packages.status
-- Cần INSERT alerts, UPDATE packages, SELECT sessions → SECURITY DEFINER

DROP TRIGGER IF EXISTS trg_check_package_alerts ON packages;

CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold integer;
BEGIN
  -- Bỏ qua nếu không có buổi trong 7 ngày gần đây (điểm danh bù cũ)
  IF NOT EXISTS (
    SELECT 1 FROM sessions
    WHERE package_id = NEW.id
      AND session_date >= CURRENT_DATE - 7
      AND status IN ('present', 'makeup')
  ) THEN
    RETURN NEW;
  END IF;

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
    UPDATE packages SET status = 'completed' WHERE id = NEW.id;
    UPDATE alerts
    SET resolved = true, resolved_at = now()
    WHERE student_id = NEW.student_id
      AND type = 'near_end'
      AND resolved = false;
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
$$;

CREATE TRIGGER trg_check_package_alerts
AFTER UPDATE OF used_sessions ON packages
FOR EACH ROW EXECUTE FUNCTION fn_check_package_alerts();
