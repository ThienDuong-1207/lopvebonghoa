-- Fix 1: Trigger cũ chỉ AFTER INSERT OR DELETE, bỏ sót UPDATE
-- (khi staff đổi trạng thái absent→present qua .update(), used_sessions không thay đổi)
DROP TRIGGER IF EXISTS trg_update_used_sessions ON sessions;

-- Fix 2: Đếm cả 'makeup' vào used_sessions
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
