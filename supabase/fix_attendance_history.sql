-- ============================================================
-- Fix lịch sử điểm danh — chạy file này trên Supabase SQL Editor
-- ============================================================


-- ── 1. Backfill start_date cho các gói cũ có NULL ───────────
-- Nếu add_package_start_date.sql chưa được chạy, các gói cũ
-- sẽ có start_date = NULL và bị lọc ra khỏi trang điểm danh

UPDATE packages
SET start_date = COALESCE(paid_at, created_at::date)
WHERE start_date IS NULL;


-- ── 2. Đảm bảo NOT NULL + default ───────────────────────────

ALTER TABLE packages ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;


-- ── 3. Backfill last_seen_at từ sessions đã có ──────────────
-- Học sinh cũ có sessions nhưng last_seen_at = NULL vì trigger
-- chưa tồn tại khi sessions đó được tạo

UPDATE students s
SET last_seen_at = (
  SELECT MAX(se.session_date::timestamptz)
  FROM sessions se
  WHERE se.student_id = s.id
    AND se.status IN ('present', 'makeup')
)
WHERE s.last_seen_at IS NULL
  AND EXISTS (
    SELECT 1 FROM sessions se
    WHERE se.student_id = s.id AND se.status IN ('present', 'makeup')
  );


-- ── Kiểm tra kết quả ────────────────────────────────────────

-- Số gói có start_date NULL còn lại (nên = 0)
SELECT COUNT(*) AS packages_with_null_start FROM packages WHERE start_date IS NULL;

-- Số học sinh active không có gói học nào
SELECT COUNT(*) AS students_without_package
FROM students s
WHERE s.status = 'active'
  AND NOT EXISTS (SELECT 1 FROM packages p WHERE p.student_id = s.id AND p.status != 'cancelled');
