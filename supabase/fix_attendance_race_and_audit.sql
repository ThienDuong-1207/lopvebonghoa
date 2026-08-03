-- ============================================================
-- Vá lỗi "giáo viên đánh vắng nhưng admin thấy có mặt"
-- Chạy file này trên Supabase SQL Editor (sau khi đã chạy
-- diagnose_attendance.sql để xác nhận hiện trạng)
--
-- Nguyên nhân đã xác định:
--   1. RLS "staff_all_classes" cho phép MỌI staff ghi đè session
--      của BẤT KỲ lớp nào (không chỉ lớp được gán) — không khớp
--      thiết kế ban đầu (staff_own_class trong fix_sessions_rls.sql).
--   2. AdminCheckinButton.tsx khi UPDATE không ghi checked_in_by
--      → không biết ai thực sự sửa lần cuối.
--   3. Bảng sessions không có cột theo dõi lần sửa cuối
--      → không truy vết được ai/khi nào ghi đè status.
--   4. Không có cơ chế chống ghi đè khi 2 người sửa cùng 1 session
--      gần như đồng thời (staff vs admin, hoặc 2 thiết bị).
--
-- File này xử lý (1) và (3). Việc (2) và (4) được xử lý ở code
-- (AdminCheckinButton.tsx, AttendanceRow.tsx) — không phụ thuộc
-- vào các cột mới nên có thể deploy độc lập với migration này.
-- ============================================================


-- ── 1. Audit trail: ai/khi nào sửa session lần cuối ─────────────

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES profiles(id);

CREATE OR REPLACE FUNCTION fn_sessions_set_updated_meta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := (SELECT id FROM profiles WHERE auth_user_id = auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sessions_set_updated_meta ON sessions;
CREATE TRIGGER trg_sessions_set_updated_meta
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION fn_sessions_set_updated_meta();


-- ── 2. Siết RLS: staff chỉ ghi được session của lớp mình phụ trách ──
-- Thay "staff_all_classes" (đang cho ghi mọi lớp) bằng "staff_own_class"
-- (giống ý định ban đầu trong fix_sessions_rls.sql). UI staff cũng đã
-- được cập nhật (StaffAttendanceSection.tsx) để khoá nút bấm ở các
-- lớp không được gán, tránh lỗi "bấm nhưng bị RLS chặn âm thầm".

DROP POLICY IF EXISTS "staff_all_classes" ON sessions;
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

-- admin_all giữ nguyên, không đổi.


-- ── 3. Kiểm tra sau khi chạy ─────────────────────────────────────

SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'sessions';
SELECT column_name FROM information_schema.columns WHERE table_name = 'sessions' ORDER BY ordinal_position;
