-- ============================================================
-- CHỈ chạy file này SAU KHI:
--   1. Đã chạy fix_multi_staff_per_class.sql và xác nhận kết quả
--      backfill đúng (mỗi lớp có tro_giang_hien_tai khớp với
--      truoc_day_la trước đó).
--   2. Code mới (đọc/ghi qua bảng class_staff) đã deploy lên
--      production — không còn nơi nào trong code đọc/ghi
--      classes.assigned_staff_id nữa.
-- ============================================================

ALTER TABLE classes DROP COLUMN IF EXISTS assigned_staff_id;

-- Kiểm tra: cột đã biến mất khỏi danh sách
SELECT column_name FROM information_schema.columns WHERE table_name = 'classes' ORDER BY ordinal_position;
