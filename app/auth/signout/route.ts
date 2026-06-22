import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  await supabase.auth.signOut()
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.delete('lvst_role')
  return response
}
