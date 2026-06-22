-- ============================================================
-- Fix RLS để staff có thể xem và điểm danh TẤT CẢ lớp
-- (không chỉ lớp được phân công)
-- Chạy file này trên Supabase SQL Editor
-- ============================================================

-- packages: staff đọc được package của tất cả học sinh
DROP POLICY IF EXISTS "staff_read" ON packages;
CREATE POLICY "staff_read" ON packages
  FOR SELECT TO authenticated
  USING (auth_role() = 'staff');

-- sessions: staff ghi/đọc session của tất cả lớp
DROP POLICY IF EXISTS "staff_own_class" ON sessions;
CREATE POLICY "staff_all_classes" ON sessions
  FOR ALL TO authenticated
  USING (auth_role() = 'staff')
  WITH CHECK (auth_role() = 'staff');

-- parents: staff đọc được thông tin phụ huynh của tất cả học sinh
DROP POLICY IF EXISTS "staff_read_own_class_parents" ON parents;
CREATE POLICY "staff_read_all_parents" ON parents
  FOR SELECT TO authenticated
  USING (auth_role() = 'staff');
