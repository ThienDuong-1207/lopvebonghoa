-- Cho phép staff đọc TẤT CẢ lớp (không chỉ lớp được phân công)
-- Cần thiết để trang điểm danh và lịch ca hiển thị toàn bộ lịch

DROP POLICY IF EXISTS "staff_read_own" ON classes;
CREATE POLICY "staff_read_all" ON classes
  FOR SELECT TO authenticated
  USING (auth_role() = 'staff');

-- Cho phép staff đọc học sinh của TẤT CẢ lớp (không chỉ lớp của mình)
DROP POLICY IF EXISTS "staff_read_own_class" ON students;
CREATE POLICY "staff_read_all_students" ON students
  FOR SELECT TO authenticated
  USING (auth_role() = 'staff');
