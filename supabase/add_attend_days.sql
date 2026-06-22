-- Thêm cột attend_days: ngày học trong tuần của học sinh (subset của class.days_of_week)
-- NULL = học tất cả ngày của lớp (backward compatible)
ALTER TABLE students ADD COLUMN IF NOT EXISTS attend_days int[] DEFAULT NULL;
