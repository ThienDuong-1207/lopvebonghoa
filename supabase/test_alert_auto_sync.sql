-- ============================================================
-- TEST: fn_check_package_alerts đồng bộ đúng cả 2 chiều
-- (tăng: active -> near_end -> completed; giảm: completed -> active
-- trở lại + tự đóng alert) khi used_sessions bị sửa qua lại.
--
-- An toàn: 1 câu DO $$ ... $$ duy nhất, luôn RAISE EXCEPTION ở cuối
-- để Postgres tự rollback toàn bộ (gói test, session test, mọi
-- alert phát sinh trong lúc test).
--
-- Chọn 1 học sinh HIỆN KHÔNG có alert near_end/package_ended đang
-- mở để tránh đụng unique index uq_alerts_unresolved của học sinh
-- đó (không ảnh hưởng gì tới alert thật của họ vì cuối cùng rollback
-- hết).
-- ============================================================

DO $$
DECLARE
  v_student_id    uuid;
  v_class_id      uuid;
  v_checked_in_by uuid;
  v_test_pkg_id   uuid;
  v_status1 text; v_near_end_1 boolean;
  v_status2 text; v_package_ended_2 boolean;
  v_status3 text; v_package_ended_3 boolean; v_near_end_3 boolean;
BEGIN
  SELECT id INTO v_student_id FROM students s
  WHERE NOT EXISTS (
    SELECT 1 FROM alerts a
    WHERE a.student_id = s.id AND a.type IN ('near_end','package_ended') AND a.resolved = false
  )
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'KET QUA TEST: BO QUA - khong co hoc sinh nao ranh alert de test an toan.';
  END IF;

  SELECT class_id, checked_in_by INTO v_class_id, v_checked_in_by
  FROM sessions WHERE checked_in_by IS NOT NULL LIMIT 1;

  -- Gói test: total=8, bắt đầu used=5 (chưa sắp hết)
  INSERT INTO packages (student_id, total_sessions, used_sessions, amount_paid, start_date, status, payment_status)
  VALUES (v_student_id, 8, 5, 0, CURRENT_DATE, 'active', 'paid')
  RETURNING id INTO v_test_pkg_id;

  -- 1 session giả để qua guard "phải có buổi trong 7 ngày gần đây"
  INSERT INTO sessions (package_id, student_id, class_id, session_date, status, checked_in_by)
  VALUES (v_test_pkg_id, v_student_id, v_class_id, CURRENT_DATE, 'present', v_checked_in_by);

  -- Bước 1: tăng lên 7/8 (vùng "sắp hết", threshold=2 -> từ 6 trở lên)
  UPDATE packages SET used_sessions = 7 WHERE id = v_test_pkg_id;
  SELECT status INTO v_status1 FROM packages WHERE id = v_test_pkg_id;
  SELECT EXISTS(SELECT 1 FROM alerts WHERE student_id=v_student_id AND type='near_end' AND resolved=false) INTO v_near_end_1;

  -- Bước 2: tăng lên 9/8 (vượt total -> completed)
  UPDATE packages SET used_sessions = 9 WHERE id = v_test_pkg_id;
  SELECT status INTO v_status2 FROM packages WHERE id = v_test_pkg_id;
  SELECT EXISTS(SELECT 1 FROM alerts WHERE student_id=v_student_id AND type='package_ended' AND resolved=false) INTO v_package_ended_2;

  -- Bước 3: admin sửa buổi (VD đổi Có mặt -> Vắng), used_sessions lùi về 5/8
  UPDATE packages SET used_sessions = 5 WHERE id = v_test_pkg_id;
  SELECT status INTO v_status3 FROM packages WHERE id = v_test_pkg_id;
  SELECT EXISTS(SELECT 1 FROM alerts WHERE student_id=v_student_id AND type='package_ended' AND resolved=false) INTO v_package_ended_3;
  SELECT EXISTS(SELECT 1 FROM alerts WHERE student_id=v_student_id AND type='near_end' AND resolved=false) INTO v_near_end_3;

  RAISE EXCEPTION 'KET QUA TEST: B1(7/8)=%/near_end_mo=%(ky_vong active/true) | B2(9/8)=%/package_ended_mo=%(ky_vong completed/true) | B3(5/8,sua_lui)=%/package_ended_mo=%/near_end_mo=%(ky_vong active/false/false) | %',
    v_status1, v_near_end_1,
    v_status2, v_package_ended_2,
    v_status3, v_package_ended_3, v_near_end_3,
    CASE WHEN v_status1 = 'active' AND v_near_end_1
      AND v_status2 = 'completed' AND v_package_ended_2
      AND v_status3 = 'active' AND NOT v_package_ended_3 AND NOT v_near_end_3
    THEN 'PASS - dong bo dung ca chieu tang va giam'
    ELSE 'FAIL - can xem lai' END;
END $$;
