import { cache } from 'react'
import { createClient } from './server'

// React.cache() deduplicates calls within a single server render pass.
// Topbar + page body both calling getProfile() = only 1 DB round trip.

export const getAuthUser = cache(async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async () => {
  const user = await getAuthUser()
  if (!user) return null
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, is_active')
    .eq('auth_user_id', user.id)
    .single()
  return data
})

// ID các lớp mà 1 trợ giảng được phân công phụ trách (1 lớp có thể
// có nhiều trợ giảng — xem bảng class_staff)
export const getAssignedClassIds = cache(async (staffId: string) => {
  if (!staffId) return []
  const supabase = createClient()
  const { data } = await supabase
    .from('class_staff')
    .select('class_id')
    .eq('staff_id', staffId)
  return (data ?? []).map((r) => r.class_id)
})
