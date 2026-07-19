-- ============================================================
-- Fix: ngăn điểm danh trùng — 1 học sinh chỉ có 1 session/ngày/lớp
-- Chạy file này trên Supabase SQL Editor
-- ============================================================

-- Xóa các session bị trùng trước (giữ cái cũ nhất)
DELETE FROM sessions s
WHERE s.id NOT IN (
  SELECT DISTINCT ON (student_id, class_id, session_date) id
  FROM sessions
  ORDER BY student_id, class_id, session_date, checked_in_at ASC
);

-- Thêm unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_student_class_date
ON sessions (student_id, class_id, session_date);
