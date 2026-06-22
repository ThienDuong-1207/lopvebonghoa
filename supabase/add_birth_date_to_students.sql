-- Thêm năm sinh vào bảng students (chỉ lưu năm, không cần ngày tháng)
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_year integer;

-- Nới rộng constraint tuổi
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_age_check;
ALTER TABLE students ADD CONSTRAINT students_age_check CHECK (age BETWEEN 1 AND 99);
