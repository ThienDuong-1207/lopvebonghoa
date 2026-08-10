-- ============================================================
-- DỌN DỮ LIỆU: gán lại package_id đúng cho các buổi điểm danh đang
-- bị "kẹt" ở gói cũ đã completed trong khi có gói mới hơn hợp lệ.
--
-- Chạy theo thứ tự: BƯỚC 1 (xem trước) → đọc kỹ → BƯỚC 2 (áp dụng)
-- → BƯỚC 3 (xác nhận). Chỉ chạy BƯỚC 2 sau khi đã đọc kỹ BƯỚC 1.
-- ============================================================


-- ── BƯỚC 1: XEM TRƯỚC — chưa sửa gì, chỉ liệt kê ────────────────
-- Đọc kỹ danh sách này trước khi chạy Bước 2. Đây là toàn bộ buổi
-- hệ thống hiện phát hiện bị gán sai (không chỉ 3 ca cũ đã tìm, vì
-- có thể phát sinh thêm từ đó tới nay).

SELECT
  s.full_name,
  se.id AS session_id,
  se.session_date,
  se.status,
  se.package_id AS goi_cu_dang_gan,
  p_old.start_date AS start_date_goi_cu,
  (
    SELECT p2.id FROM packages p2
    WHERE p2.student_id = se.student_id
      AND p2.status <> 'cancelled'
      AND p2.start_date <= se.session_date
      AND p2.start_date > p_old.start_date
    ORDER BY p2.start_date DESC
    LIMIT 1
  ) AS goi_moi_se_gan_lai,
  (
    SELECT p2.start_date FROM packages p2
    WHERE p2.student_id = se.student_id
      AND p2.status <> 'cancelled'
      AND p2.start_date <= se.session_date
      AND p2.start_date > p_old.start_date
    ORDER BY p2.start_date DESC
    LIMIT 1
  ) AS start_date_goi_moi
FROM sessions se
JOIN students s ON s.id = se.student_id
JOIN packages p_old ON p_old.id = se.package_id AND p_old.status = 'completed'
WHERE se.status IN ('present', 'makeup')
  AND EXISTS (
    SELECT 1 FROM packages p2
    WHERE p2.student_id = se.student_id
      AND p2.status <> 'cancelled'
      AND p2.start_date <= se.session_date
      AND p2.start_date > p_old.start_date
  )
ORDER BY s.full_name, se.session_date;


-- ── BƯỚC 2: ÁP DỤNG — gán lại package_id đúng ────────────────────
-- Chỉ chạy sau khi đã xem kỹ Bước 1. Đây là 1 câu lệnh duy nhất,
-- chạy đúng logic y hệt Bước 1 (không tự ý đoán thêm).

WITH fix AS (
  SELECT se.id AS session_id,
    (
      SELECT p2.id FROM packages p2
      WHERE p2.student_id = se.student_id
        AND p2.status <> 'cancelled'
        AND p2.start_date <= se.session_date
        AND p2.start_date > p_old.start_date
      ORDER BY p2.start_date DESC
      LIMIT 1
    ) AS new_package_id
  FROM sessions se
  JOIN packages p_old ON p_old.id = se.package_id AND p_old.status = 'completed'
  WHERE se.status IN ('present', 'makeup')
)
UPDATE sessions
SET package_id = fix.new_package_id
FROM fix
WHERE sessions.id = fix.session_id AND fix.new_package_id IS NOT NULL;


-- ── BƯỚC 3: XÁC NHẬN SAU KHI SỬA ─────────────────────────────────
-- Kỳ vọng: câu này không còn trả về dòng nào (không còn ca nào bị
-- gán sai theo đúng logic Bước 1 nữa).

SELECT count(*) AS con_lai_bao_nhieu_ca_sai
FROM sessions se
JOIN packages p_old ON p_old.id = se.package_id AND p_old.status = 'completed'
WHERE se.status IN ('present', 'makeup')
  AND EXISTS (
    SELECT 1 FROM packages p2
    WHERE p2.student_id = se.student_id
      AND p2.status <> 'cancelled'
      AND p2.start_date <= se.session_date
      AND p2.start_date > p_old.start_date
  );

-- Đối chiếu lại số buổi đã học của các gói liên quan (used_sessions
-- sẽ tự động được trigger tính lại đúng sau UPDATE ở Bước 2, không
-- cần làm gì thêm).
SELECT p.id, s.full_name, p.start_date, p.status, p.used_sessions, p.total_sessions
FROM packages p
JOIN students s ON s.id = p.student_id
WHERE p.student_id IN (
  SELECT DISTINCT student_id FROM sessions
  WHERE package_id IN (SELECT id FROM packages WHERE status = 'completed')
)
ORDER BY s.full_name, p.start_date;
