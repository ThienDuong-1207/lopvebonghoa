-- Thêm trạng thái thanh toán vào packages
-- 'paid'    = đã thu tiền (mặc định cho data cũ)
-- 'pending' = học trước trả sau / chưa thu tiền

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'paid'
    CHECK (payment_status IN ('paid', 'pending'));

-- Cho phép paid_at = NULL (học sinh chưa đóng tiền thì chưa có ngày đóng)
ALTER TABLE packages ALTER COLUMN paid_at DROP NOT NULL;

-- Cho phép amount_paid = 0 (mặc định khi tạo gói nợ)
ALTER TABLE packages ALTER COLUMN amount_paid SET DEFAULT 0;
