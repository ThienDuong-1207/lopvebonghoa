-- ============================================================
-- fn_check_package_alerts trước giờ chỉ xử lý CHIỀU TĂNG
-- (used_sessions vượt ngưỡng). Từ khi có công cụ "Sửa buổi điểm
-- danh" (đổi trạng thái / gán lại gói cho 1 buổi đã có), used_sessions
-- có thể GIẢM trở lại — trigger cũ không xử lý chiều này:
--   - Gói đã "Hết gói" (completed) bị sửa tụt xuống dưới total ->
--     status vẫn kẹt ở completed mãi mãi, KHÔNG điểm danh được nữa
--     (trang điểm danh chỉ chọn gói status='active').
--   - Alert near_end/package_ended vẫn treo dù điều kiện không còn
--     đúng nữa.
--
-- Fix: viết lại theo hướng "đồng bộ lại đúng trạng thái mong muốn"
-- dựa trên used_sessions HIỆN TẠI, thay vì chỉ dò điểm vượt ngưỡng
-- theo 1 chiều — xử lý đúng cả 2 chiều tăng/giảm.
--
-- Riêng việc MỞ LẠI status completed -> active: chỉ làm nếu học
-- sinh CHƯA có gói active nào khác (tránh 2 gói active cùng lúc).
-- Không đụng tới gói đã 'cancelled'.
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold integer;
  v_is_completed boolean;
  v_is_near_end  boolean;
BEGIN
  -- Không đụng gói đã huỷ
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Bỏ qua nếu gói không có buổi điểm danh nào trong 7 ngày gần đây
  -- (tránh cảnh báo dồn dập khi chạy dọn/backfill dữ liệu quá khứ)
  IF NOT EXISTS (
    SELECT 1 FROM sessions
    WHERE package_id = NEW.id
      AND session_date >= CURRENT_DATE - 7
      AND status IN ('present', 'makeup')
  ) THEN
    RETURN NEW;
  END IF;

  v_threshold    := CEIL(NEW.total_sessions::numeric / 4);
  v_is_completed := NEW.used_sessions >= NEW.total_sessions;
  v_is_near_end  := NEW.used_sessions >= (NEW.total_sessions - v_threshold) AND NOT v_is_completed;

  -- ── near_end: đồng bộ theo đúng trạng thái hiện tại ──
  IF v_is_near_end THEN
    IF NOT EXISTS (
      SELECT 1 FROM alerts WHERE student_id = NEW.student_id AND type = 'near_end' AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type) VALUES (NEW.student_id, 'near_end');
    END IF;
  ELSE
    UPDATE alerts SET resolved = true, resolved_at = now()
      WHERE student_id = NEW.student_id AND type = 'near_end' AND resolved = false;
  END IF;

  -- ── package_ended + status: đồng bộ theo đúng trạng thái hiện tại ──
  IF v_is_completed THEN
    IF NEW.status <> 'completed' THEN
      UPDATE packages SET status = 'completed' WHERE id = NEW.id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM alerts WHERE student_id = NEW.student_id AND type = 'package_ended' AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type) VALUES (NEW.student_id, 'package_ended');
    ELSIF NEW.used_sessions > NEW.total_sessions
       AND FLOOR((OLD.used_sessions - NEW.total_sessions)::numeric / 2)
         < FLOOR((NEW.used_sessions - NEW.total_sessions)::numeric / 2) THEN
      -- Đã có alert mở, vượt thêm 1 mốc 2 buổi nữa -> làm mới (nổi lên đầu ds)
      UPDATE alerts SET triggered_at = now()
        WHERE student_id = NEW.student_id AND type = 'package_ended' AND resolved = false;
    END IF;
  ELSE
    -- Không còn "hết gói" -> đóng alert package_ended nếu đang mở
    UPDATE alerts SET resolved = true, resolved_at = now()
      WHERE student_id = NEW.student_id AND type = 'package_ended' AND resolved = false;

    -- Gói đang bị kẹt ở completed nhưng thực ra không còn hết nữa
    -- (do vừa sửa/gán lại buổi) -> mở lại active, NẾU học sinh chưa
    -- có gói active nào khác (tránh tạo 2 gói active cùng lúc)
    IF NEW.status = 'completed' AND NOT EXISTS (
      SELECT 1 FROM packages
      WHERE student_id = NEW.student_id AND status = 'active' AND id <> NEW.id
    ) THEN
      UPDATE packages SET status = 'active' WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Kiểm tra: xác nhận function đã cập nhật
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'fn_check_package_alerts';
