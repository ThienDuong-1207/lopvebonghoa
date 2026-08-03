-- ============================================================
-- CHẨN ĐOÁN lỗi "giáo viên đánh vắng nhưng admin thấy có mặt"
-- Chỉ chứa SELECT (read-only) — an toàn để chạy trên production.
-- Chạy từng block trên Supabase SQL Editor, đọc kết quả trước khi
-- kết luận / sửa gì thêm.
-- ============================================================


-- ── 1. Có session nào bị TRÙNG (student_id, class_id, session_date)? ──
-- Nếu trả về dòng nào → xác nhận giả thuyết (a): 2 người ghi đè nhau
-- tạo ra 2 dòng cùng ngày/lớp cho 1 học sinh (do thiếu unique index
-- hoặc do 1 dòng bị xoá rồi tạo lại race với dòng khác).

SELECT student_id, class_id, session_date, COUNT(*) AS so_dong,
       array_agg(status ORDER BY checked_in_at) AS cac_status,
       array_agg(id ORDER BY checked_in_at)     AS session_ids,
       array_agg(checked_in_at ORDER BY checked_in_at) AS thoi_gian
FROM sessions
GROUP BY student_id, class_id, session_date
HAVING COUNT(*) > 1
ORDER BY session_date DESC;


-- ── 2. Unique index chống trùng đã tồn tại trên production chưa? ──
-- Kỳ vọng thấy 'uq_sessions_student_class_date'. Nếu KHÔNG có →
-- fix_sessions_unique.sql chưa từng được chạy trên DB thật.

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'sessions';


-- ── 3. Trigger nào đang THỰC SỰ chạy trên bảng sessions/packages? ──
-- So sánh tên function với nội dung fix_trigger_security.sql (bản
-- mới nhất trong repo) để biết bản nào đang sống trên production.

SELECT event_object_table AS bang,
       trigger_name,
       action_timing,
       event_manipulation,
       action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('sessions', 'packages')
ORDER BY event_object_table, trigger_name;

-- Xem toàn bộ định nghĩa function đang chạy (copy ra so sánh với
-- fix_trigger_security.sql — đặc biệt chú ý có SECURITY DEFINER
-- hay không, và có đoạn "skip nếu không có session 7 ngày gần đây"
-- trong fn_check_package_alerts hay không).

SELECT proname, prosecdef AS la_security_definer, prosrc
FROM pg_proc
WHERE proname IN ('fn_update_used_sessions', 'fn_check_package_alerts', 'fn_update_last_seen');


-- ── 4. packages.used_sessions có KHỚP với số session present/makeup thật không? ──
-- Nếu lệch → trigger không chạy đúng lúc ghi, hoặc có session bị gắn
-- sai package_id, hoặc trigger đang chạy là bản cũ/lỗi.

SELECT p.id AS package_id, p.student_id, p.used_sessions AS used_sessions_luu,
       COUNT(s.id) FILTER (WHERE s.status IN ('present','makeup')) AS dem_lai_tu_sessions,
       p.used_sessions - COUNT(s.id) FILTER (WHERE s.status IN ('present','makeup')) AS lech
FROM packages p
LEFT JOIN sessions s ON s.package_id = p.id
WHERE p.status <> 'cancelled'
GROUP BY p.id, p.student_id, p.used_sessions
HAVING p.used_sessions <> COUNT(s.id) FILTER (WHERE s.status IN ('present','makeup'))
ORDER BY lech DESC;


-- ── 5. Học sinh có nhiều hơn 1 gói đang "active" cùng lúc? ──
-- Nếu có → 2 lượt điểm danh khác nhau (staff/admin, hoặc 2 ngày
-- khác nhau) có thể gắn session vào 2 package_id khác nhau cho
-- cùng 1 học sinh → used_sessions bị chia lệch giữa 2 gói.

SELECT student_id, COUNT(*) AS so_goi_active, array_agg(id) AS package_ids
FROM packages
WHERE status = 'active'
GROUP BY student_id
HAVING COUNT(*) > 1;


-- ── 6. Session bị điểm danh trong khung giờ 00:00–06:59 giờ VN ──
-- (tức 17:00–23:59 UTC hôm trước / 00:00–06:59 UTC hôm sau tuỳ giờ) —
-- nghi vấn session_date bị lệch ngày do server tính giờ UTC thay vì
-- giờ Việt Nam (giả thuyết d). Xem session_date có "hợp lý" so với
-- checked_in_at (giờ VN) không.

SELECT id, student_id, class_id, session_date,
       checked_in_at,
       checked_in_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS gio_vn,
       (checked_in_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS ngay_vn_thuc_te,
       session_date - (checked_in_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS lech_ngay
FROM sessions
WHERE session_date <> (checked_in_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
ORDER BY checked_in_at DESC;


-- ── 7. Session bị sửa nhiều lần trong thời gian ngắn (nghi race 2 người) ──
-- Cột updated_at có thể không tồn tại tuỳ schema — nếu lỗi "column
-- does not exist" thì bỏ qua block này (nghĩa là bảng sessions
-- không track updated_at, cũng là điều nên bổ sung).

-- SELECT id, student_id, class_id, session_date, status, checked_in_by, updated_at
-- FROM sessions
-- ORDER BY updated_at DESC
-- LIMIT 50;


-- ── 8. Policy RLS hiện tại trên bảng sessions ──
-- Đối chiếu với UI: staff có thấy TẤT CẢ lớp trong ngày (kể cả lớp
-- không được gán) trong khi RLS chỉ cho ghi lớp được gán → xác nhận
-- giả thuyết (b).

SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'sessions';
