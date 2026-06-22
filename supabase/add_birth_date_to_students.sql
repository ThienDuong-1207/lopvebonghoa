-- Thêm ngày sinh vào bảng students
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date date;

-- Nới rộng constraint tuổi (sinh viên nhỏ 1 tuổi vẫn có thể học)
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_age_check;
ALTER TABLE students ADD CONSTRAINT students_age_check CHECK (age BETWEEN 1 AND 99);
