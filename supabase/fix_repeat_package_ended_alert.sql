-- ============================================================
-- Cảnh báo "hết gói" hiện chỉ bắn ĐÚNG 1 LẦN tại thời điểm vượt
-- ngưỡng (OLD.used_sessions < total AND NEW.used_sessions >= total).
-- Sau đó dù học sinh học thêm bao nhiêu buổi nữa trên gói đã hết,
-- cảnh báo cũ vẫn nằm yên, không "nổi" lên lại — dễ bị admin bỏ sót
-- nếu lỡ bỏ qua lần đầu.
--
-- Fix: mỗi khi vượt thêm 1 mốc 2 buổi nữa (used_sessions - total
-- tăng thêm 2), "làm mới" alert package_ended đang mở bằng cách cập
-- nhật triggered_at = now() — alert cũ nổi lên đầu danh sách ở
-- /admin/canh-bao (đang ORDER BY triggered_at DESC) thay vì nằm im.
-- Không tạo thêm dòng alert mới (vẫn giữ đúng 1 alert
-- chưa-resolved/loại/học-sinh như unique index uq_alerts_unresolved).
-- ============================================================

CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_threshold integer;
BEGIN
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

  v_threshold := CEIL(NEW.total_sessions::numeric / 4);

  -- Sắp hết: lần đầu vượt ngưỡng (chưa hết gói)
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

  -- Hết gói: lần đầu vượt total
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

  -- Đã hết gói từ trước, giờ vượt thêm 1 mốc 2 buổi nữa -> làm mới
  -- alert package_ended hiện có (đẩy lên đầu danh sách Cảnh báo)
  ELSIF NEW.used_sessions > NEW.total_sessions
     AND FLOOR((OLD.used_sessions - NEW.total_sessions)::numeric / 2)
       < FLOOR((NEW.used_sessions - NEW.total_sessions)::numeric / 2) THEN
    UPDATE alerts SET triggered_at = now()
      WHERE student_id = NEW.student_id AND type = 'package_ended' AND resolved = false;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger trg_check_package_alerts đã tồn tại (AFTER UPDATE OF
-- used_sessions ON packages) → tự dùng bản function mới này.

-- Kiểm tra: xác nhận function đã cập nhật
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'fn_check_package_alerts';


-- ── Kiểm tra logic "mốc 2 buổi" (thuần số học, không đụng dữ liệu
--    thật — tránh xung đột với alert thật đang mở của học sinh nào
--    đó do ràng buộc unique uq_alerts_unresolved) ──
-- total_sessions giả định = 8. Kỳ vọng: bucket đổi ở 10 và 12 (làm
-- mới alert), giữ nguyên ở 9, 11 (không làm mới).
SELECT
  used_sessions,
  FLOOR((used_sessions - 8)::numeric / 2) AS bucket,
  FLOOR((used_sessions - 8)::numeric / 2) > FLOOR((used_sessions - 1 - 8)::numeric / 2) AS lam_moi_alert
FROM generate_series(8, 13) AS used_sessions
ORDER BY used_sessions;
