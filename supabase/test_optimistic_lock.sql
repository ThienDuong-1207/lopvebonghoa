-- ============================================================
-- TEST optimistic-lock cho sessions (mô phỏng đúng pattern
-- AttendanceRow.tsx / AdminCheckinButton.tsx đang dùng:
--   UPDATE sessions SET status = X WHERE id = ? AND status = <status UI đang thấy>
-- )
--
-- An toàn tuyệt đối: TOÀN BỘ nằm trong 1 câu lệnh DO $$ ... $$ duy
-- nhất (không phụ thuộc BEGIN/ROLLBACK hay bảng tạm trải dài nhiều
-- câu lệnh — tránh rủi ro SQL Editor chạy mỗi câu trên 1 kết nối
-- khác nhau như lần trước). Khối này CHỦ ĐỘNG raise exception ở
-- cuối để Postgres tự rollback toàn bộ thay đổi test, đồng thời
-- đảm bảo bạn luôn thấy kết quả (lỗi luôn hiển thị rõ, khác NOTICE
-- có thể bị ẩn).
--
-- Đọc dòng "KET QUA TEST: ..." trong thông báo lỗi màu đỏ sau khi
-- chạy — đây LÀ KẾT QUẢ TEST, không phải lỗi thật, an tâm.
-- ============================================================

DO $$
DECLARE
  v_package_id    uuid;
  v_student_id    uuid;
  v_class_id      uuid;
  v_checked_in_by uuid;
  v_test_id       uuid;
  v_rows1         int;
  v_rows2         int;
BEGIN
  -- Mượn tạm 1 bộ id hợp lệ từ dữ liệu thật (chỉ đọc, không sửa)
  SELECT package_id, student_id, class_id, checked_in_by
  INTO v_package_id, v_student_id, v_class_id, v_checked_in_by
  FROM sessions WHERE checked_in_by IS NOT NULL LIMIT 1;

  -- Tạo 1 session TEST với ngày giả (1999-01-01, không đụng dữ liệu thật)
  INSERT INTO sessions (package_id, student_id, class_id, session_date, status, checked_in_by, note)
  VALUES (v_package_id, v_student_id, v_class_id, '1999-01-01', 'absent', v_checked_in_by, 'TEST_OPTIMISTIC_LOCK')
  RETURNING id INTO v_test_id;

  -- Kịch bản 1: UI đang thấy đúng status hiện tại ('absent') -> phải
  -- ghi đè thành công
  UPDATE sessions SET status = 'present' WHERE id = v_test_id AND status = 'absent';
  GET DIAGNOSTICS v_rows1 = ROW_COUNT;

  -- Giả lập "người khác" (VD: giáo viên) vừa đổi status thành 'absent'
  UPDATE sessions SET status = 'absent' WHERE id = v_test_id;

  -- Kịch bản 2: admin vẫn tưởng status là 'present' (dữ liệu cũ) và cố
  -- ghi đè lại 'present' -> PHẢI bị chặn vì status thật đã đổi
  UPDATE sessions SET status = 'present' WHERE id = v_test_id AND status = 'present';
  GET DIAGNOSTICS v_rows2 = ROW_COUNT;

  -- Raise exception để (1) chắc chắn thấy kết quả, (2) tự rollback
  -- toàn bộ INSERT/UPDATE test ở trên — không để lại dữ liệu test.
  RAISE EXCEPTION 'KET QUA TEST: kich_ban_1(ky_vong=1)=% | kich_ban_2(ky_vong=0)=% | %',
    v_rows1, v_rows2,
    CASE WHEN v_rows1 = 1 AND v_rows2 = 0 THEN 'PASS - optimistic lock hoat dong dung'
         ELSE 'FAIL - can xem lai code' END;
END $$;
