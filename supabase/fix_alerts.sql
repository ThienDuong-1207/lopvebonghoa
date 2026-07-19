-- ============================================================
-- Fix hệ thống cảnh báo — chạy toàn bộ file này 1 lần
-- ============================================================


-- ── 1. fn_update_used_sessions ───────────────────────────────
-- Đếm cả 'makeup' vào used_sessions (SECURITY DEFINER để ghi vào packages)

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_used_sessions
AFTER INSERT OR UPDATE OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_used_sessions();


-- ── 2. fn_check_package_alerts ───────────────────────────────
-- near_end: khi còn <= CEIL(total/4) buổi
-- package_ended: tự resolve near_end cũ + tạo package_ended

DROP TRIGGER IF EXISTS trg_check_package_alerts ON packages;

CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_threshold integer;
BEGIN
  v_threshold := CEIL(NEW.total_sessions::numeric / 4);

  IF NEW.used_sessions >= (NEW.total_sessions - v_threshold)
     AND OLD.used_sessions < (NEW.total_sessions - v_threshold)
     AND NEW.used_sessions < NEW.total_sessions THEN
    IF NOT EXISTS (
      SELECT 1 FROM alerts
      WHERE student_id = NEW.student_id AND type = 'near_end' AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type) VALUES (NEW.student_id, 'near_end');
    END IF;
  END IF;

  IF NEW.used_sessions >= NEW.total_sessions
     AND OLD.used_sessions < NEW.total_sessions THEN
    UPDATE packages SET status = 'completed' WHERE id = NEW.id;
    UPDATE alerts SET resolved = true, resolved_at = now()
      WHERE student_id = NEW.student_id AND type = 'near_end' AND resolved = false;
    IF NOT EXISTS (
      SELECT 1 FROM alerts
      WHERE student_id = NEW.student_id AND type = 'package_ended' AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type) VALUES (NEW.student_id, 'package_ended');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_package_alerts
AFTER UPDATE OF used_sessions ON packages
FOR EACH ROW EXECUTE FUNCTION fn_check_package_alerts();


-- ── 3. Unique index ──────────────────────────────────────────
-- Mỗi học sinh chỉ có 1 alert chưa resolve cho mỗi loại

CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_unresolved
ON alerts (student_id, type)
WHERE resolved = false;


-- ── 4. fn_refresh_inactive_alerts ────────────────────────────
-- Gọi mỗi khi admin vào trang Cảnh báo để tạo/resolve inactive alerts

CREATE OR REPLACE FUNCTION fn_refresh_inactive_alerts()
RETURNS void AS $$
BEGIN
  UPDATE alerts SET resolved = true, resolved_at = now()
  WHERE type = 'inactive' AND resolved = false
    AND student_id IN (
      SELECT id FROM students WHERE last_seen_at >= now() - interval '14 days'
    );

  INSERT INTO alerts (student_id, type)
  SELECT DISTINCT s.id, 'inactive'
  FROM students s
  INNER JOIN packages p ON p.student_id = s.id AND p.status = 'active'
  WHERE s.status = 'active'
    AND (s.last_seen_at IS NULL OR s.last_seen_at < now() - interval '14 days')
    AND NOT EXISTS (
      SELECT 1 FROM alerts a
      WHERE a.student_id = s.id AND a.type = 'inactive' AND a.resolved = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fn_refresh_inactive_alerts() TO authenticated;
