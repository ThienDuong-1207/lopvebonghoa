export type UserRole = 'admin' | 'staff'
export type StudentStatus = 'active' | 'paused' | 'inactive'
export type PackageStatus = 'active' | 'completed' | 'cancelled'
export type SessionStatus = 'present' | 'absent' | 'makeup'
export type RegistrationStatus = 'pending' | 'contacted' | 'converted' | 'rejected'
export type AlertType = 'near_end' | 'package_ended' | 'inactive' | 'new_registration'

export interface Profile {
  id: string
  auth_user_id: string | null
  email: string | null
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface Parent {
  id: string
  full_name: string
  phone: string
  phone_2: string | null
  address: string | null
  created_at: string
}

export interface Student {
  id: string
  full_name: string
  nickname: string | null
  age: number | null
  parent_id: string
  preferred_slot_id: string | null
  notes: string | null
  status: StudentStatus
  enrolled_at: string
  last_seen_at: string | null
}

export interface Slot {
  id: string
  name: string
  day_of_week: number
  time_start: string
  time_end: string
  max_capacity: number
  assigned_staff_id: string | null
  is_active: boolean
  created_at: string
}

export interface Package {
  id: string
  student_id: string
  total_sessions: number
  used_sessions: number
  amount_paid: number
  paid_at: string
  marked_paid_by: string | null
  status: PackageStatus
  note: string | null
  created_at: string
}

export interface Session {
  id: string
  package_id: string
  student_id: string
  slot_id: string
  session_date: string
  checked_in_at: string
  checked_in_by: string
  status: SessionStatus
  note: string | null
}

export interface Registration {
  id: string
  child_name: string
  child_age: number | null
  parent_name: string
  phone: string
  preferred_slot: string | null
  message: string | null
  status: RegistrationStatus
  converted_student_id: string | null
  submitted_at: string
  contacted_at: string | null
}

export interface Alert {
  id: string
  student_id: string
  type: AlertType
  triggered_at: string
  zalo_sent_at: string | null
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
}

// Extended types with joins
export interface StudentWithRelations extends Student {
  parents: Parent
  slots: Slot | null
}

export interface PackageWithSessions extends Package {
  sessions: Session[]
}

export interface StudentDetail extends Student {
  parents: Parent
  packages: PackageWithSessions[]
  slots: Slot | null
}

export interface AlertWithStudent extends Alert {
  students: Pick<Student, 'full_name'> & {
    parents: Pick<Parent, 'full_name' | 'phone'>
    packages: Pick<Package, 'used_sessions' | 'total_sessions' | 'status'>[]
  }
}
