-- ============================================================
-- CHẨN ĐOÁN: session bị gắn nhầm vào gói cũ (đã completed) thay vì
-- gói mới, do query chọn gói điểm danh chỉ loại status='cancelled'
-- mà không loại 'completed'.
-- Toàn bộ là SELECT (read-only) — an toàn tuyệt đối, không sửa gì.
-- ============================================================


-- ── 1. Các gói của Đan và Khánh Ly, theo thứ tự thời gian ───────

SELECT s.full_name, p.id AS package_id, p.start_date, p.paid_at, p.status,
       p.used_sessions, p.total_sessions, p.created_at
FROM packages p
JOIN students s ON s.id = p.student_id
WHERE p.student_id IN (
  '428422a1-58f5-4cd5-bec1-64bee436a577', -- Đan
  '1c9f9aef-df8c-428b-8d16-da713ff46e25'  -- Khánh Ly
)
ORDER BY s.full_name, p.start_date;


-- ── 2. Từng session của 2 bé, xem đang gắn vào gói nào ──────────
-- Cột "goi_dung_ra_phai_la" = gói có start_date muộn nhất mà vẫn
-- <= ngày điểm danh đó (tức gói ĐÁNG LẼ được chọn tại thời điểm
-- điểm danh, theo đúng logic .order(start_date desc) hiện tại)

SELECT
  s.full_name,
  se.session_date,
  se.status,
  se.package_id AS goi_dang_gan,
  p_actual.start_date AS start_date_goi_dang_gan,
  p_actual.status AS status_goi_dang_gan,
  (
    SELECT p2.id FROM packages p2
    WHERE p2.student_id = se.student_id
      AND p2.status <> 'cancelled'
      AND (p2.start_date IS NULL OR p2.start_date <= se.session_date)
    ORDER BY p2.start_date DESC NULLS LAST
    LIMIT 1
  ) AS goi_dung_ra_phai_la,
  CASE WHEN se.package_id <> (
    SELECT p2.id FROM packages p2
    WHERE p2.student_id = se.student_id
      AND p2.status <> 'cancelled'
      AND (p2.start_date IS NULL OR p2.start_date <= se.session_date)
    ORDER BY p2.start_date DESC NULLS LAST
    LIMIT 1
  ) THEN '❌ GAN SAI GOI' ELSE 'ok' END AS ket_luan
FROM sessions se
JOIN students s ON s.id = se.student_id
JOIN packages p_actual ON p_actual.id = se.package_id
WHERE se.student_id IN (
  '428422a1-58f5-4cd5-bec1-64bee436a577',
  '1c9f9aef-df8c-428b-8d16-da713ff46e25'
)
ORDER BY s.full_name, se.session_date;


-- ── 3. Quét TOÀN BỘ hệ thống: session nào đang bị gắn vào gói đã
--      'completed' trong khi có 1 gói MỚI HƠN của cùng học sinh
--      cũng đủ điều kiện tại ngày điểm danh đó (tức bị lỗi y hệt) ──

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
