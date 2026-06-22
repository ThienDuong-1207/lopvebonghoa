'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AdminCheckinButton from './AdminCheckinButton'

interface MakeupEntry {
  id: string
  full_name: string
  nickname: string | null
  class_name: string | null
  package_id: string
  used_sessions: number
  total_sessions: number
  payment_status: 'paid' | 'pending'
  sessionId?: string
  sessionStatus: 'present' | 'absent' | 'makeup' | null
}

interface Props {
  classId: string
  sessionDate: string
  profileId: string
  excludeIds: string[]   // IDs học sinh đã có trong lớp chính thức
}

export default function MakeupSearchBox({ classId, sessionDate, profileId, excludeIds }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MakeupEntry[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const [added, setAdded] = useState<MakeupEntry[]>([])
  const supabase = createClient()
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const boxRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDrop(false); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true)

      let studentsQ = supabase
        .from('students')
        .select('id, full_name, nickname, classes(name)')
        .eq('status', 'active')
        .ilike('full_name', `%${query}%`)
        .neq('class_id', classId)
        .limit(8)

      // Loại ra học sinh đã trong lớp chính thức và đã được add rồi
      const allExclude = [...excludeIds, ...added.map((a) => a.id)]
      if (allExclude.length > 0) {
        studentsQ = studentsQ.not('id', 'in', `(${allExclude.join(',')})`)
      }

      const { data: students } = await studentsQ
      if (!students || students.length === 0) {
        setResults([])
        setSearching(false)
        setShowDrop(true)
        return
      }

      const ids = students.map((s) => s.id)
      const [{ data: pkgs }, { data: sessions }] = await Promise.all([
        supabase.from('packages')
          .select('id, student_id, used_sessions, total_sessions, payment_status')
          .in('student_id', ids)
          .eq('status', 'active'),
        supabase.from('sessions')
          .select('id, student_id, status')
          .eq('class_id', classId)
          .eq('session_date', sessionDate)
          .in('student_id', ids),
      ])

      const merged: MakeupEntry[] = students
        .map((s) => {
          const pkg = pkgs?.find((p) => p.student_id === s.id)
          if (!pkg) return null
          const sess = sessions?.find((ss) => ss.student_id === s.id)
          return {
            id:             s.id,
            full_name:      s.full_name,
            nickname:       s.nickname,
            class_name:     (s.classes as unknown as { name: string } | null)?.name ?? null,
            package_id:     pkg.id,
            used_sessions:  pkg.used_sessions,
            total_sessions: pkg.total_sessions,
            payment_status: pkg.payment_status as 'paid' | 'pending',
            sessionId:      sess?.id,
            sessionStatus:  (sess?.status ?? null) as MakeupEntry['sessionStatus'],
          }
        })
        .filter(Boolean) as MakeupEntry[]

      setResults(merged)
      setShowDrop(true)
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer.current)
  }, [query])

  function addStudent(s: MakeupEntry) {
    setAdded((prev) => [...prev, s])
    setQuery('')
    setResults([])
    setShowDrop(false)
  }

  function removeStudent(id: string) {
    setAdded((prev) => prev.filter((a) => a.id !== id))
  }

  const statusLabel: Record<string, string> = {
    present: '✓ Có mặt', makeup: '↩ Học bù', absent: '✗ Vắng',
  }
  const statusColor: Record<string, string> = {
    present: 'text-emerald-600', makeup: 'text-amber-600', absent: 'text-red-400',
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-800/40 dark:bg-gray-800">
      {/* Header */}
      <div className="rounded-t-2xl border-b border-amber-100 bg-amber-50 px-5 py-3 dark:border-amber-800/30 dark:bg-amber-900/20">
        <h3 className="font-semibold text-amber-700 dark:text-amber-400">Học bù tại buổi này</h3>
        <p className="text-xs text-amber-600/70 dark:text-amber-500/70">
          Tìm học sinh lớp khác đến học bù — buổi sẽ được tính vào gói của học sinh đó
        </p>
      </div>

      {/* Search */}
      <div className="px-5 py-4" ref={boxRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder="Nhập tên học sinh cần học bù..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm focus:border-amber-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              Đang tìm...
            </span>
          )}

          {/* Dropdown */}
          {showDrop && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
              {results.length > 0 ? results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => addStudent(r)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-100">
                      {r.nickname ?? r.full_name}
                      {r.nickname && <span className="text-xs font-normal text-gray-400">({r.full_name})</span>}
                      {r.payment_status === 'pending' && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Nợ</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Lớp: {r.class_name ?? '—'} · Buổi {r.used_sessions}/{r.total_sessions}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.sessionStatus && (
                      <span className={`text-xs font-medium ${statusColor[r.sessionStatus]}`}>
                        {statusLabel[r.sessionStatus]}
                      </span>
                    )}
                    <Plus className="h-4 w-4 text-amber-500" />
                  </div>
                </button>
              )) : (
                <div className="px-4 py-3 text-sm text-gray-400">
                  Không tìm thấy học sinh phù hợp (chưa có gói hoặc đã trong lớp này)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Added list */}
      {added.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {added.map((m) => {
            const initials = m.full_name.split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase()
            return (
              <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {m.nickname ?? m.full_name}
                      </span>
                      {m.nickname && <span className="text-xs text-gray-400">({m.full_name})</span>}
                      {m.payment_status === 'pending' && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Nợ</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Lớp: {m.class_name ?? '—'} · Buổi {m.used_sessions}/{m.total_sessions}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AdminCheckinButton
                    studentId={m.id}
                    packageId={m.package_id}
                    classId={classId}
                    sessionDate={sessionDate}
                    profileId={profileId}
                    initialStatus={m.sessionStatus}
                    sessionId={m.sessionId}
                  />
                  <button
                    onClick={() => removeStudent(m.id)}
                    title="Xóa khỏi danh sách"
                    className="ml-0.5 text-gray-300 transition-colors hover:text-red-400 dark:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="pb-5 text-center text-xs text-gray-400">Chưa có học sinh học bù nào được thêm</p>
      )}
    </div>
  )
}
