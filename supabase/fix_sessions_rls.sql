-- ============================================================
-- Cập nhật RLS policy cho sessions
-- Bỏ giới hạn session_date = CURRENT_DATE để cho phép điểm danh
-- ngày trong quá khứ (cần thiết cho data cũ / test)
-- Chạy file này trên Supabase SQL Editor
-- ============================================================

DROP POLICY IF EXISTS "staff_own_class" ON sessions;

CREATE POLICY "staff_own_class" ON sessions
  FOR ALL TO authenticated
  USING (
    auth_role() = 'staff' AND
    class_id IN (
      SELECT id FROM classes WHERE assigned_staff_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth_role() = 'staff' AND
    class_id IN (
      SELECT id FROM classes WHERE assigned_staff_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );
