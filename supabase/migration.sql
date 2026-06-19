-- ============================================================
-- Lop Ve Sang Tao — Full SQL Migration
-- Chay toan bo file nay tren Supabase SQL Editor
-- Thu tu: Extensions → Enums → Tables → FK → Triggers → RLS
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enum types
CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE student_status AS ENUM ('active', 'paused', 'inactive');
CREATE TYPE package_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE session_status AS ENUM ('present', 'absent', 'makeup');
CREATE TYPE registration_status AS ENUM ('pending', 'contacted', 'converted', 'rejected');
CREATE TYPE alert_type AS ENUM ('near_end', 'package_ended', 'inactive', 'new_registration');

-- 3. Tables

-- profiles (id rieng, auth_user_id lien ket voi auth.users sau khi dang nhap)
CREATE TABLE profiles (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text UNIQUE,   -- email trang trang thai, dung de khop khi login lan dau
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
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- students
CREATE TABLE students (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name         text NOT NULL,
  nickname          text,
  age               integer CHECK (age BETWEEN 4 AND 12),
  parent_id         uuid NOT NULL REFERENCES parents(id) ON DELETE RESTRICT,
  preferred_slot_id uuid,
  notes             text,
  status            student_status NOT NULL DEFAULT 'active',
  enrolled_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- slots
CREATE TABLE slots (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              text NOT NULL,
  day_of_week       integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_start        time NOT NULL,
  time_end          time NOT NULL,
  max_capacity      integer NOT NULL DEFAULT 10,
  assigned_staff_id uuid REFERENCES profiles(id),
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

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

-- sessions
CREATE TABLE sessions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id      uuid NOT NULL REFERENCES packages(id) ON DELETE RESTRICT,
  student_id      uuid NOT NULL REFERENCES students(id),
  slot_id         uuid NOT NULL REFERENCES slots(id),
  session_date    date NOT NULL,
  checked_in_at   timestamptz NOT NULL DEFAULT now(),
  checked_in_by   uuid NOT NULL REFERENCES profiles(id),
  status          session_status NOT NULL DEFAULT 'present',
  note            text
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- registrations
CREATE TABLE registrations (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_name            text NOT NULL,
  child_age             integer,
  parent_name           text NOT NULL,
  phone                 text NOT NULL,
  preferred_slot        text,
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

-- 4. Foreign key bổ sung
ALTER TABLE students ADD CONSTRAINT fk_preferred_slot
  FOREIGN KEY (preferred_slot_id) REFERENCES slots(id) ON DELETE SET NULL;

-- ============================================================
-- 5. Triggers & Functions
-- ============================================================

-- 5.1 Cap nhat used_sessions sau diem danh
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

-- 5.2 Tao alert khi goi sap het hoac het
CREATE OR REPLACE FUNCTION fn_check_package_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Con 1 buoi (buoi thu 7/8)
  IF NEW.used_sessions = 7 AND OLD.used_sessions < 7 THEN
    INSERT INTO alerts (student_id, type)
    SELECT student_id, 'near_end' FROM packages WHERE id = NEW.id
    ON CONFLICT DO NOTHING;
  END IF;
  -- Het goi
  IF NEW.used_sessions >= NEW.total_sessions AND OLD.used_sessions < NEW.total_sessions THEN
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

-- 5.3 Cap nhat last_seen_at
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

-- 5.4 Lien ket auth.users voi profiles khi dang nhap Google lan dau
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

-- Helper function lay role hien tai
CREATE OR REPLACE FUNCTION auth_role()
RETURNS text AS $$
  SELECT role::text FROM profiles WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles
CREATE POLICY "admin_all" ON profiles
  FOR ALL TO authenticated
  USING (auth_role() = 'admin');

CREATE POLICY "staff_self" ON profiles
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- parents
CREATE POLICY "admin_all" ON parents
  FOR ALL TO authenticated USING (auth_role() = 'admin');

CREATE POLICY "staff_read_own_slot_parents" ON parents
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    id IN (
      SELECT parent_id FROM students WHERE preferred_slot_id IN (
        SELECT id FROM slots WHERE assigned_staff_id IN (
          SELECT id FROM profiles WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- students
CREATE POLICY "admin_all" ON students
  FOR ALL TO authenticated USING (auth_role() = 'admin');

CREATE POLICY "staff_read_own_slot" ON students
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    preferred_slot_id IN (
      SELECT id FROM slots WHERE assigned_staff_id IN (
        SELECT id FROM profiles WHERE auth_user_id = auth.uid()
      )
    )
  );

-- slots
CREATE POLICY "admin_all" ON slots
  FOR ALL TO authenticated USING (auth_role() = 'admin');

CREATE POLICY "staff_read_own" ON slots
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    assigned_staff_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  );

-- packages
CREATE POLICY "admin_all" ON packages
  FOR ALL TO authenticated USING (auth_role() = 'admin');

CREATE POLICY "staff_read" ON packages
  FOR SELECT TO authenticated
  USING (
    auth_role() = 'staff' AND
    student_id IN (
      SELECT id FROM students WHERE preferred_slot_id IN (
        SELECT id FROM slots WHERE assigned_staff_id IN (
          SELECT id FROM profiles WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- sessions
CREATE POLICY "admin_all" ON sessions
  FOR ALL TO authenticated USING (auth_role() = 'admin');

CREATE POLICY "staff_own_slot" ON sessions
  FOR ALL TO authenticated
  USING (
    auth_role() = 'staff' AND
    slot_id IN (
      SELECT id FROM slots WHERE assigned_staff_id IN (
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
-- 7. Seed data mau (chinh lai truoc khi dung)
-- ============================================================
-- Them admin (thay full_name sau khi biet ten hien thi Google):
-- INSERT INTO profiles (email, full_name, role, is_active)
-- VALUES ('dctthien1201@gmail.com', 'Admin 1', 'admin', true),
--        ('lopvebonghoa@gmail.com',  'Admin 2', 'admin', true);
--
-- Them staff (Huyen, Huong):
-- INSERT INTO profiles (email, full_name, role, is_active)
-- VALUES ('email-huyen@gmail.com', 'Huyền', 'staff', true),
--        ('email-huong@gmail.com', 'Hương', 'staff', true);
--
-- Vi du them phu huynh co 2 con:
-- INSERT INTO parents (full_name, phone)
-- VALUES ('Nguyễn Thị B', '0901234567')
-- RETURNING id;
-- -- Dung id tra ve o tren cho ca 2 hoc sinh:
-- INSERT INTO students (full_name, age, parent_id, status)
-- VALUES ('Bé An', 6, '<parent_id>', 'active'),
--        ('Bé Bình', 8, '<parent_id>', 'active');
