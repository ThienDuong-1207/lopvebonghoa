-- ============================================================
-- Lop Ve Sang Tao — Full SQL Migration v2
-- Chay toan bo file nay tren Supabase SQL Editor
-- Thu tu: Drop → Extensions → Enums → Tables → FK → Triggers → RLS
-- ============================================================

-- ============================================================
-- 0. DROP OLD SCHEMA
-- ============================================================

-- Drop triggers truoc
DROP TRIGGER IF EXISTS trg_update_used_sessions ON sessions;
DROP TRIGGER IF EXISTS trg_check_package_alerts ON packages;
DROP TRIGGER IF EXISTS trg_update_last_seen ON sessions;
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS fn_update_used_sessions() CASCADE;
DROP FUNCTION IF EXISTS fn_check_package_alerts() CASCADE;
DROP FUNCTION IF EXISTS fn_update_last_seen() CASCADE;
DROP FUNCTION IF EXISTS fn_handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth_role() CASCADE;

-- Drop tables theo thu tu FK
DROP TABLE IF EXISTS sessions    CASCADE;
DROP TABLE IF EXISTS packages    CASCADE;
DROP TABLE IF EXISTS alerts      CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS students    CASCADE;
DROP TABLE IF EXISTS slots       CASCADE;  -- bảng cũ
DROP TABLE IF EXISTS classes     CASCADE;  -- bảng mới (nếu đã có)
DROP TABLE IF EXISTS parents     CASCADE;
DROP TABLE IF EXISTS profiles    CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS alert_type          CASCADE;
DROP TYPE IF EXISTS registration_status CASCADE;
DROP TYPE IF EXISTS session_status      CASCADE;
DROP TYPE IF EXISTS package_status      CASCADE;
DROP TYPE IF EXISTS student_status      CASCADE;
DROP TYPE IF EXISTS user_role           CASCADE;

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Enum types
-- ============================================================
CREATE TYPE user_role           AS ENUM ('admin', 'staff');
CREATE TYPE student_status      AS ENUM ('active', 'paused', 'inactive');
CREATE TYPE package_status      AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE session_status      AS ENUM ('present', 'absent', 'makeup');
CREATE TYPE registration_status AS ENUM ('pending', 'contacted', 'converted', 'rejected');
CREATE TYPE alert_type          AS ENUM ('near_end', 'package_ended', 'inactive', 'new_registration');

-- ============================================================
-- 3. Tables
-- ============================================================

-- profiles
CREATE TABLE profiles (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text UNIQUE,
  full_name     text NOT NULL,
  role          user_role NOT NULL,
  phone         text,
  avatar_url    text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- parents
CREATE TABLE parents (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   text NOT NULL,
  phone       text NOT NULL,
  phone_2     text,
  address     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- classes  (thay thế slots — một lớp dạy nhiều ngày / tuần)
CREATE TABLE classes (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              text NOT NULL,
  -- Mảng ngày trong tuần: 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
  -- Ví dụ: Tối 2-4-6 → [1,3,5] | Tối 3-5-7 → [2,4,6] | Sáng T7 → [6] | Sáng CN → [0]
  days_of_week      int[] NOT NULL,
  time_start        time NOT NULL,
  time_end          time NOT NULL,
  max_capacity      integer NOT NULL DEFAULT 10,
  assigned_staff_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- students
CREATE TABLE students (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     text NOT NULL,
  nickname      text,
  age           integer CHECK (age BETWEEN 4 AND 12),
  parent_id     uuid NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
  class_id      uuid REFERENCES classes(id) ON DELETE SET NULL,
  notes         text,
  status        student_status NOT NULL DEFAULT 'active',
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz,
  attend_days   int[]               -- ngày học trong tuần (subset của class.days_of_week); NULL = tất cả ngày
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- packages
CREATE TABLE packages (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id       uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  total_sessions   integer NOT NULL DEFAULT 8,
  used_sessions    integer NOT NULL DEFAULT 0 CHECK (used_sessions >= 0),
  amount_paid      integer NOT NULL,
  paid_at          date NOT NULL,
  marked_paid_by   uuid REFERENCES profiles(id),
  status           package_status NOT NULL DEFAULT 'active',
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- sessions  (mỗi record = 1 buổi điểm danh)
CREATE TABLE sessions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id      uuid NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  student_id      uuid NOT NULL REFERENCES students(id),
  class_id        uuid NOT NULL REFERENCES classes(id),
  session_date    date NOT NULL,
  checked_in_at   timestamptz NOT NULL DEFAULT now(),
  checked_in_by   uuid NOT NULL REFERENCES profiles(id),
  status          session_status NOT NULL DEFAULT 'present',
  note            text
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- registrations  (đơn đăng ký từ trang public)
CREATE TABLE registrations (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_name            text NOT NULL,
  child_age             integer,
  parent_name           text NOT NULL,
  phone                 text NOT NULL,
  preferred_slot        text,   -- free text, phụ huynh tự nhập lịch mong muốn
  message               text,
  status                registration_status NOT NULL DEFAULT 'pending',
  converted_student_id  uuid REFERENCES students(id),
  submitted_at          timestamptz NOT NULL DEFAULT now(),
  contacted_at          timestamptz
);
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- alerts
CREATE TABLE alerts (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    uuid NOT NULL REFERENCES students(id),
  type          alert_type NOT NULL,
  triggered_at  timestamptz NOT NULL DEFAULT now(),
  zalo_sent_at  timestamptz,
  resolved      boolean NOT NULL DEFAULT false,
  resolved_at   timestamptz,
  resolved_by   uuid REFERENCES profiles(id)
);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Indexes
-- ============================================================
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_sessions_class_id ON sessions(class_id);
CREATE INDEX idx_sessions_student_date ON sessions(student_id, session_date);
-- Array contains index for days_of_week lookup
CREATE INDEX idx_classes_days ON classes USING gin(days_of_week);

-- ============================================================
-- 5. Triggers & Functions
-- ============================================================

-- 5.1 Cập nhật used_sessions sau điểm danh
CREATE OR REPLACE FUNCTION fn_update_used_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE packages
  SET used_sessions = (
    SELECT COUNT(*) FROM sessions
    WHERE package_id = COALESCE(NEW.package_id, OLD.package_id)
      AND status = 'present'
  )
  WHERE id = COALESCE(NEW.package_id, OLD.package_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_used_sessions
AFTER INSERT OR DELETE ON sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_used_sessions();

-- 5.2 Tạo alert khi gói sắp hết hoặc hết
CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Sắp hết: còn đúng 1 buổi
  IF NEW.used_sessions = (NEW.total_sessions - 1)
     AND OLD.used_sessions < (NEW.total_sessions - 1) THEN
    INSERT INTO alerts (student_id, type)
    SELECT student_id, 'near_end' FROM packages WHERE id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  -- Hết gói
  IF NEW.used_sessions >= NEW.total_sessions
     AND OLD.used_sessions < NEW.total_sessions THEN
    UPDATE packages SET status = 'completed' WHERE id = NEW.id;
    INSERT INTO alerts (student_id, type)
    SELECT student_id, 'package_ended' FROM packages WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_package_alerts
AFTER UPDATE OF used_sessions ON packages
FOR EACH ROW EXECUTE FUNCTION fn_check_package_alerts();

-- 5.3 Cập nhật last_seen_at
CREATE OR REPLACE FUNCTION fn_update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE students SET last_seen_at = now() WHERE id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_last_seen
AFTER INSERT ON sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_last_seen();

-- 5.4 Liên kết auth.users với profiles khi đăng nhập Google lần đầu
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    auth_user_id = NEW.id,
    full_name    = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    avatar_url   = NEW.raw_user_meta_data->>'avatar_url'
  WHERE auth_user_id IS NULL
    AND email = NEW.email
    AND is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- ============================================================
-- 6. RLS Policies
-- ============================================================

CREATE OR REPLACE FUNCTION auth_role()
RETURNS text AS $$
  SELECT role::text FROM profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "admin_all" ON profiles
  FOR ALL TO authenticated USING (auth_role() = 'admin');
CREATE POLICY "staff_self" ON profiles
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- parents
CREATE POLICY "admin_all" ON parents
  FOR ALL TO authenticated USING (auth_role() = 'admin');
CREATE POLICY "staff_read_own_class_parents" ON parents
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    id IN (
      SELECT parent_id FROM students WHERE class_id IN (
        SELECT id FROM classes WHERE assigned_staff_id IN (
          SELECT id FROM profiles WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- classes
CREATE POLICY "admin_all" ON classes
  FOR ALL TO authenticated USING (auth_role() = 'admin');
CREATE POLICY "staff_read_own" ON classes
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    assigned_staff_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- students
CREATE POLICY "admin_all" ON students
  FOR ALL TO authenticated USING (auth_role() = 'admin');
CREATE POLICY "staff_read_own_class" ON students
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    class_id IN (
      SELECT id FROM classes WHERE assigned_staff_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- packages
CREATE POLICY "admin_all" ON packages
  FOR ALL TO authenticated USING (auth_role() = 'admin');
CREATE POLICY "staff_read" ON packages
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    student_id IN (
      SELECT id FROM students WHERE class_id IN (
        SELECT id FROM classes WHERE assigned_staff_id IN (
          SELECT id FROM profiles WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- sessions
CREATE POLICY "admin_all" ON sessions
  FOR ALL TO authenticated USING (auth_role() = 'admin');
CREATE POLICY "staff_own_class" ON sessions
  FOR ALL TO authenticated
  USING (
    auth_role() = 'staff' AND
    class_id IN (
      SELECT id FROM classes WHERE assigned_staff_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    ) AND
    session_date = CURRENT_DATE
  );

-- registrations
CREATE POLICY "admin_all" ON registrations
  FOR ALL TO authenticated USING (auth_role() = 'admin');
CREATE POLICY "public_insert" ON registrations
  FOR INSERT TO anon WITH CHECK (true);

-- alerts
CREATE POLICY "admin_all" ON alerts
  FOR ALL TO authenticated USING (auth_role() = 'admin');

-- ============================================================
-- 7. Seed data mẫu (chỉnh lại trước khi dùng)
-- ============================================================
-- Thêm admin:
-- INSERT INTO profiles (email, full_name, role, is_active)
-- VALUES ('dctthien1201@gmail.com', 'Admin', 'admin', true);
--
-- Thêm lớp học mẫu:
-- INSERT INTO classes (name, days_of_week, time_start, time_end, max_capacity)
-- VALUES
--   ('Tối 2-4-6 A', ARRAY[1,3,5], '17:00', '19:00', 10),
--   ('Tối 3-5-7 B', ARRAY[2,4,6], '17:00', '19:00', 10),
--   ('Sáng Thứ 7',  ARRAY[6],     '08:00', '10:00', 10),
--   ('Sáng Chủ nhật', ARRAY[0],   '08:00', '10:00', 10);
