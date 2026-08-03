-- ============================================================
-- Cho phép 1 lớp có NHIỀU trợ giảng phụ trách (many-to-many)
-- thay vì classes.assigned_staff_id (chỉ 1 người/lớp).
--
-- File này CHƯA xoá cột assigned_staff_id cũ (an toàn, có thể chạy
-- trước hoặc sau khi deploy code — cột cũ chỉ nằm im, không ai đọc
-- nữa sau khi code mới lên). Sau khi xác nhận kết quả bước 4 đúng
-- VÀ code mới đã deploy, chạy tiếp file
-- drop_assigned_staff_id_column.sql để dọn cột cũ.
-- ============================================================


-- ── 1. Bảng trung gian class_staff ──────────────────────────────

CREATE TABLE IF NOT EXISTS class_staff (
  class_id   uuid NOT NULL REFERENCES classes(id)  ON DELETE CASCADE,
  staff_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, staff_id)
);

ALTER TABLE class_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all" ON class_staff;
CREATE POLICY "admin_all" ON class_staff
  FOR ALL TO authenticated USING (auth_role() = 'admin');

-- Staff cần đọc được class_staff để hệ thống xác định "lớp của tôi"
-- (khớp với việc staff đã được đọc toàn bộ classes/students/packages/
-- parents theo fix_staff_read_all_classes.sql / fix_staff_rls_all_classes.sql)
DROP POLICY IF EXISTS "staff_read_all" ON class_staff;
CREATE POLICY "staff_read_all" ON class_staff
  FOR SELECT TO authenticated USING (auth_role() = 'staff');


-- ── 2. Backfill dữ liệu cũ từ classes.assigned_staff_id ─────────

INSERT INTO class_staff (class_id, staff_id)
SELECT id, assigned_staff_id FROM classes
WHERE assigned_staff_id IS NOT NULL
ON CONFLICT DO NOTHING;


-- ── 3. Cập nhật RLS sessions.staff_own_class dùng class_staff ───
-- (thay vì classes.assigned_staff_id — để trợ giảng phụ cũng ghi
-- điểm danh được cho lớp mình phụ trách, không chỉ 1 người duy nhất)

DROP POLICY IF EXISTS "staff_own_class" ON sessions;

CREATE POLICY "staff_own_class" ON sessions
  FOR ALL TO authenticated
  USING (
    auth_role() = 'staff' AND
    EXISTS (
      SELECT 1 FROM class_staff cs
      JOIN profiles p ON p.id = cs.staff_id
      WHERE cs.class_id = sessions.class_id AND p.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth_role() = 'staff' AND
    EXISTS (
      SELECT 1 FROM class_staff cs
      JOIN profiles p ON p.id = cs.staff_id
      WHERE cs.class_id = sessions.class_id AND p.auth_user_id = auth.uid()
    )
  );


-- ── 4. Kiểm tra sau khi chạy ─────────────────────────────────────
-- So khớp: mỗi lớp trước đây có assigned_staff_id phải xuất hiện
-- đúng người đó trong cột tro_giang bên dưới. Nếu khớp hết và code
-- mới (đọc/ghi qua class_staff) đã deploy xong, mới chạy tiếp file
-- drop_assigned_staff_id_column.sql để dọn cột cũ.

SELECT c.id, c.name, c.assigned_staff_id AS truoc_day_la, array_agg(p.full_name) AS tro_giang_hien_tai
FROM classes c
LEFT JOIN class_staff cs ON cs.class_id = c.id
LEFT JOIN profiles p ON p.id = cs.staff_id
GROUP BY c.id, c.name, c.assigned_staff_id
ORDER BY c.name;

SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('sessions', 'class_staff');
