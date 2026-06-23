-- ============================================================
-- Thêm start_date vào packages + sửa trigger retroactive
-- Chạy file này trên Supabase SQL Editor
-- ============================================================

-- ── 1. Thêm cột start_date ──────────────────────────────────
-- start_date: ngày học sinh BẮT ĐẦU dùng gói (≠ paid_at là ngày đóng tiền)
-- Dùng để tìm đúng gói khi điểm danh lùi thời gian

ALTER TABLE packages ADD COLUMN IF NOT EXISTS start_date date;

-- Backfill: dùng paid_at nếu có, fallback về ngày tạo gói
UPDATE packages
SET start_date = COALESCE(paid_at, created_at::date)
WHERE start_date IS NULL;

-- Đặt NOT NULL + default sau khi backfill xong
ALTER TABLE packages ALTER COLUMN start_date SET NOT NULL;
ALTER TABLE packages ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_packages_student_start ON packages(student_id, start_date DESC);


-- ── 2. Sửa fn_update_last_seen ──────────────────────────────
-- Vấn đề cũ: retroactive insert luôn set last_seen_at = now()
-- Fix: chỉ cập nhật nếu session_date mới hơn last_seen_at hiện tại

CREATE OR REPLACE FUNCTION fn_update_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE students
  SET last_seen_at = GREATEST(
    COALESCE(last_seen_at, '-infinity'::timestamptz),
    NEW.session_date::timestamptz
  )
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$;
-- Trigger trg_update_last_seen đã tồn tại → function được cập nhật tự động


-- ── 3. Sửa fn_check_package_alerts ──────────────────────────
-- Vấn đề cũ: điểm danh bù tháng trước vẫn bắn alert "hết gói" hôm nay
-- Fix: chỉ tạo alert khi có session thực tế trong 7 ngày gần đây

DROP TRIGGER IF EXISTS trg_check_package_alerts ON packages;

CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_threshold integer;
BEGIN
  -- Bỏ qua nếu không có buổi nào trong 7 ngày gần đây (điểm danh bù cũ)
  IF NOT EXISTS (
    SELECT 1 FROM sessions
    WHERE package_id = NEW.id
      AND session_date >= CURRENT_DATE - 7
      AND status IN ('present', 'makeup')
  ) THEN
    RETURN NEW;
  END IF;

  v_threshold := CEIL(NEW.total_sessions::numeric / 4);

  -- Sắp hết: lần đầu vượt ngưỡng (chưa hết gói)
  IF NEW.used_sessions >= (NEW.total_sessions - v_threshold)
     AND OLD.used_sessions < (NEW.total_sessions - v_threshold)
     AND NEW.used_sessions < NEW.total_sessions THEN
    IF NOT EXISTS (
      SELECT 1 FROM alerts
      WHERE student_id = NEW.student_id
        AND type = 'near_end'
        AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type)
      VALUES (NEW.student_id, 'near_end');
    END IF;
  END IF;

  -- Hết gói
  IF NEW.used_sessions >= NEW.total_sessions
     AND OLD.used_sessions < NEW.total_sessions THEN
    UPDATE packages SET status = 'completed' WHERE id = NEW.id;
    UPDATE alerts
    SET resolved = true, resolved_at = now()
    WHERE student_id = NEW.student_id
      AND type = 'near_end'
      AND resolved = false;
    IF NOT EXISTS (
      SELECT 1 FROM alerts
      WHERE student_id = NEW.student_id
        AND type = 'package_ended'
        AND resolved = false
    ) THEN
      INSERT INTO alerts (student_id, type)
      VALUES (NEW.student_id, 'package_ended');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_package_alerts
AFTER UPDATE OF used_sessions ON packages
FOR EACH ROW EXECUTE FUNCTION fn_check_package_alerts();
