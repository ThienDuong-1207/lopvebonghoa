-- ============================================================
-- SỬA SỐ LIỆU HIỆN TẠI: tính lại used_sessions cho TẤT CẢ gói,
-- trực tiếp từ sessions thật — để khắc phục các gói cũ bị "quên"
-- tính lại sau khi script dọn dữ liệu gán lại package_id vừa chạy.
-- An toàn: chỉ là recount, cùng công thức trigger đang dùng, không
-- đụng gì khác. Chạy 1 lần, có thể chạy lại nhiều lần không sao
-- (idempotent).
-- ============================================================

UPDATE packages p
SET used_sessions = (
  SELECT COUNT(*) FROM sessions se
  WHERE se.package_id = p.id AND se.status IN ('present', 'makeup')
);

-- Kiểm tra: liệt kê lại các gói liên quan đến các học sinh đã dọn,
-- xác nhận số used_sessions đã đúng (gói cũ giảm xuống, gói mới giữ
-- nguyên số vừa tăng ở lần chạy trước)
SELECT p.id, s.full_name, p.start_date, p.status, p.used_sessions, p.total_sessions
FROM packages p
JOIN students s ON s.id = p.student_id
WHERE s.full_name IN ('An Nhiên', 'Bảo Trân', 'Linh Đan', 'Minh Khang', 'Mỹ Thy', 'Nhật Hào', 'Phạm Nguyên Khang', 'Sashimi', 'Thiên Bảo', 'Trần Khánh Ly')
ORDER BY s.full_name, p.start_date;
