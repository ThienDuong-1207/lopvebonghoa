-- ============================================================
-- VÁ TRIGGER: fn_update_used_sessions hiện chỉ tính lại 1 gói khi
-- session.package_id bị đổi (COALESCE(NEW.package_id, OLD.package_id)
-- luôn chọn gói mới, bỏ quên gói cũ). Sửa để tính lại CẢ 2 gói khi
-- package_id thay đổi (đổi gói) hoặc dòng bị xoá.
-- Không đổi hành vi INSERT/DELETE/đổi status như cũ.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_used_sessions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tính lại gói hiện tại của dòng (gói mới nếu INSERT/UPDATE)
  IF NEW.package_id IS NOT NULL THEN
    UPDATE packages
    SET used_sessions = (
      SELECT COUNT(*) FROM sessions
      WHERE package_id = NEW.package_id AND status IN ('present', 'makeup')
    )
    WHERE id = NEW.package_id;
  END IF;

  -- Tính lại gói CŨ nếu package_id vừa bị đổi sang gói khác, hoặc
  -- dòng session vừa bị xoá
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.package_id IS DISTINCT FROM NEW.package_id) THEN
    UPDATE packages
    SET used_sessions = (
      SELECT COUNT(*) FROM sessions
      WHERE package_id = OLD.package_id AND status IN ('present', 'makeup')
    )
    WHERE id = OLD.package_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger trg_update_used_sessions đã tồn tại (AFTER INSERT OR UPDATE
-- OR DELETE ON sessions) → tự dùng bản function mới này, không cần
-- tạo lại trigger.

-- Kiểm tra: xác nhận function đã cập nhật
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'fn_update_used_sessions';
