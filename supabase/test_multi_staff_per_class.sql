-- ============================================================
-- TEST: 1 lớp có thể gán NHIỀU trợ giảng trong class_staff, và
-- điều kiện dùng trong RLS sessions.staff_own_class (EXISTS theo
-- class_id + staff_id) nhận diện đúng TỪNG người trong số đó.
--
-- An toàn: 1 câu lệnh DO $$ ... $$ duy nhất, luôn RAISE EXCEPTION ở
-- cuối để Postgres tự rollback — nếu class_staff đã có sẵn 2 dòng
-- test này từ trước (do trùng lặp thật) thì không bị xoá mất, vì
-- rollback chỉ hoàn tác đúng những gì xảy ra TRONG khối lệnh này.
--
-- Yêu cầu: cần có ít nhất 2 profile role='staff' trong DB.
-- ============================================================

DO $$
DECLARE
  v_class_id uuid;
  v_staff1   uuid;
  v_staff2   uuid;
  v_match1   boolean;
  v_match2   boolean;
  v_count    int;
BEGIN
  SELECT id INTO v_class_id FROM classes LIMIT 1;

  SELECT id INTO v_staff1 FROM profiles WHERE role = 'staff' ORDER BY id LIMIT 1;
  SELECT id INTO v_staff2 FROM profiles WHERE role = 'staff' AND id <> v_staff1 ORDER BY id LIMIT 1;

  IF v_staff1 IS NULL OR v_staff2 IS NULL THEN
    RAISE EXCEPTION 'KET QUA TEST: BO QUA - can it nhat 2 profile role=staff de test, hien co khong du.';
  END IF;

  -- Gán CẢ 2 người vào cùng 1 lớp (mô phỏng giáo viên chính + trợ giảng)
  INSERT INTO class_staff (class_id, staff_id) VALUES (v_class_id, v_staff1) ON CONFLICT DO NOTHING;
  INSERT INTO class_staff (class_id, staff_id) VALUES (v_class_id, v_staff2) ON CONFLICT DO NOTHING;

  SELECT count(*) INTO v_count FROM class_staff WHERE class_id = v_class_id AND staff_id IN (v_staff1, v_staff2);

  -- Đúng logic EXISTS mà policy staff_own_class trên sessions dùng
  SELECT EXISTS(SELECT 1 FROM class_staff WHERE class_id = v_class_id AND staff_id = v_staff1) INTO v_match1;
  SELECT EXISTS(SELECT 1 FROM class_staff WHERE class_id = v_class_id AND staff_id = v_staff2) INTO v_match2;

  RAISE EXCEPTION 'KET QUA TEST: so_dong_gan(ky_vong=2)=% | staff1_duoc_nhan_dien(ky_vong=true)=% | staff2_duoc_nhan_dien(ky_vong=true)=% | %',
    v_count, v_match1, v_match2,
    CASE WHEN v_count = 2 AND v_match1 AND v_match2
         THEN 'PASS - ca 2 tro giang cung duoc nhan dien dung tren 1 lop'
         ELSE 'FAIL - can xem lai' END;
END $$;
