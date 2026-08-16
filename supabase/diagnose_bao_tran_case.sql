-- ============================================================
-- KIỂM TRA ca Bảo Trân (buổi 09/08 bị gắn vào gói cũ đã hết) +
-- quét lại toàn hệ thống xem còn ca nào tương tự phát sinh từ lần
-- dọn dữ liệu trước tới nay. Toàn bộ SELECT, an toàn tuyệt đối.
-- ============================================================


-- ── 1. Thông tin gói + buổi của Bảo Trân ─────────────────────────
-- Xem rõ: gói cũ, gói mới, và buổi 09/08 đang gắn vào gói nào

SELECT p.id AS package_id, p.start_date, p.status, p.used_sessions, p.total_sessions
FROM packages p
JOIN students s ON s.id = p.student_id
WHERE s.full_name = 'Bảo Trân'
ORDER BY p.start_date;

SELECT se.id AS session_id, se.session_date, se.status, se.checked_in_at, se.checked_in_by,
       se.package_id, p.start_date AS start_date_goi_dang_gan, p.status AS status_goi_dang_gan
FROM sessions se
JOIN students s ON s.id = se.student_id
JOIN packages p ON p.id = se.package_id
WHERE s.full_name = 'Bảo Trân'
ORDER BY se.session_date DESC
LIMIT 15;


-- ── 2. Buổi 09/08 có bị hệ thống nhận diện "gán sai gói" không? ──
-- Dùng đúng logic đang chạy ở trang Cảnh báo (mục "Buổi điểm danh
-- nghi gán sai gói"). Kỳ vọng: buổi 09/08 của Bảo Trân xuất hiện ở
-- đây nếu logic phát hiện đúng.

SELECT
  s.full_name,
  se.session_date,
  se.status AS trang_thai_diem_danh,
  se.package_id AS dang_gan_vao_goi_cu,
  p_old.start_date AS start_date_goi_cu,
  p_new.id AS le_ra_phai_la_goi,
  p_new.start_date AS start_date_goi_dung
FROM sessions se
JOIN students s ON s.id = se.student_id
JOIN packages p_old ON p_old.id = se.package_id AND p_old.status = 'completed'
JOIN packages p_new ON p_new.student_id = se.student_id
  AND p_new.id <> p_old.id
  AND p_new.status <> 'cancelled'
  AND p_new.start_date <= se.session_date
  AND (p_new.start_date > p_old.start_date OR p_old.start_date IS NULL)
ORDER BY s.full_name, se.session_date;


-- ── 3. Kiểm tra thời điểm checked_in_at của buổi 09/08 so với thời
--      điểm gói mới được tạo (created_at) — xác nhận buổi đó điểm
--      danh TRƯỚC hay SAU khi gói mới đã tồn tại trong DB ──

SELECT
  se.session_date,
  se.checked_in_at AS luc_diem_danh,
  p_new.created_at AS luc_tao_goi_moi,
  se.checked_in_at < p_new.created_at AS diem_danh_truoc_khi_co_goi_moi
FROM sessions se
JOIN students s ON s.id = se.student_id
JOIN packages p_new ON p_new.student_id = se.student_id AND p_new.status = 'active'
WHERE s.full_name = 'Bảo Trân' AND se.session_date = '2026-08-09';
