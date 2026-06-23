'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type MakeupStatus = 'makeup' | 'absent' | null

interface MakeupEntry {
  id: string
  full_name: string
  nickname: string | null
  home_class_name: string | null
  package_id: string
  used_sessions: number
  total_sessions: number
  payment_status: 'paid' | 'pending'
  sessionId?: string
  status: MakeupStatus
  targetClassId: string
  loading: boolean
}

interface SearchResult extends MakeupEntry {
  selectedClassId: string
}

interface ClassInfo { id: string; name: string }

interface Props {
  classesForDay: ClassInfo[]
  sessionDate: string
  profileId: string
  onStatsChange: (totalDelta: number, presentDelta: number, absentDelta: number) => void
}

const cp = (s: MakeupStatus) => (s === 'makeup' ? 1 : 0)
const ca = (s: MakeupStatus) => (s === 'absent' ? 1 : 0)

export default function StaffMakeupSearchBox({
  classesForDay,
  sessionDate,
  profileId,
  onStatsChange,
}: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const [added, setAdded] = useState<MakeupEntry[]>([])
  const supabase = createClient()
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const boxRef = useRef<HTMLDivElement>(null)
  const addedRef = useRef<MakeupEntry[]>([])
  addedRef.current = added

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
      const classIds = classesForDay.map((c) => c.id)
      const addedIds = addedRef.current.map((a) => a.id)

      let q = supabase
        .from('students')
        .select('id, full_name, nickname, classes(name)')
        .eq('status', 'active')
        .ilike('full_name', `%${query}%`)
        .limit(8)

      // Loại sinh viên của các lớp đang hiện (họ đã có trong danh sách chính)
      if (classIds.length > 0) {
        q = q.not('class_id', 'in', `(${classIds.join(',')})`)
      }
      // Loại sinh viên đã thêm rồi
      if (addedIds.length > 0) {
        q = q.not('id', 'in', `(${addedIds.join(',')})`)
      }

      const { data: students } = await q
      if (!students || students.length === 0) {
        setResults([])
        setSearching(false)
        setShowDrop(true)
        return
      }

      const ids = students.map((s) => s.id)
      const [{ data: pkgs }, { data: sessions }] = await Promise.all([
        supabase
          .from('packages')
          .select('id, student_id, used_sessions, total_sessions, payment_status, start_date')
          .in('student_id', ids)
          .neq('status', 'cancelled')
          .lte('start_date', sessionDate)
          .order('start_date', { ascending: false }),
        supabase
          .from('sessions')
          .select('id, student_id, status')
          .in('class_id', classIds)
          .eq('session_date', sessionDate)
          .in('student_id', ids),
      ])

      const seen = new Set<string>()
      const merged: SearchResult[] = students
        .map((s) => {
          if (seen.has(s.id)) return null
          const pkg = pkgs?.find((p) => p.student_id === s.id)
          if (!pkg) return null
          seen.add(s.id)
          const sess = sessions?.find((ss) => ss.student_id === s.id)
          return {
            id: s.id,
            full_name: s.full_name,
            nickname: s.nickname,
            home_class_name: (s.classes as unknown as { name: string } | null)?.name ?? null,
            package_id: pkg.id,
            used_sessions: pkg.used_sessions,
            total_sessions: pkg.total_sessions,
            payment_status: pkg.payment_status as 'paid' | 'pending',
            sessionId: sess?.id,
            status: (sess?.status === 'present' ? 'makeup' : sess?.status ?? null) as MakeupStatus,
            targetClassId: classIds[0] ?? '',
            selectedClassId: classIds[0] ?? '',
            loading: false,
          }
        })
        .filter(Boolean) as SearchResult[]

      setResults(merged)
      setShowDrop(true)
      setSearching(false)
    }, 300)

    return () => clearTimeout(timer.current)
  }, [query])

  function updateResultClass(studentId: string, classId: string) {
    setResults((prev) => prev.map((r) => (r.id === studentId ? { ...r, selectedClassId: classId } : r)))
  }

  function addStudent(r: SearchResult) {
    const entry: MakeupEntry = {
      id: r.id,
      full_name: r.full_name,
      nickname: r.nickname,
      home_class_name: r.home_class_name,
      package_id: r.package_id,
      used_sessions: r.used_sessions,
      total_sessions: r.total_sessions,
      payment_status: r.payment_status,
      sessionId: r.sessionId,
      status: r.status,
      targetClassId: r.selectedClassId,
      loading: false,
    }
    setAdded((prev) => [...prev, entry])
    onStatsChange(+1, cp(r.status), ca(r.status))
    setQuery('')
    setResults([])
    setShowDrop(false)
  }

  function removeStudent(id: string) {
    const entry = added.find((a) => a.id === id)
    if (!entry) return
    setAdded((prev) => prev.filter((a) => a.id !== id))
    onStatsChange(-1, -cp(entry.status), -ca(entry.status))
  }

  async function markStudent(id: string, next: 'makeup' | 'absent') {
    const entry = added.find((a) => a.id === id)
    if (!entry || entry.loading || entry.status === next) return

    const prevStatus = entry.status
    setAdded((entries) => entries.map((a) => (a.id === id ? { ...a, loading: true } : a)))

    try {
      let newSessionId = entry.sessionId
      if (entry.sessionId) {
        const { error } = await supabase.from('sessions').update({ status: next }).eq('id', entry.sessionId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('sessions')
          .insert({
            package_id: entry.package_id,
            student_id: entry.id,
            class_id: entry.targetClassId,
            session_date: sessionDate,
            checked_in_by: profileId,
            status: next,
          })
          .select('id')
          .single()
        if (error) throw error
        newSessionId = data?.id
      }

      setAdded((entries) =>
        entries.map((a) =>
          a.id === id
            ? {
                ...a,
                status: next,
                sessionId: newSessionId,
                loading: false,
                used_sessions: a.used_sessions + cp(next) - cp(prevStatus),
              }
            : a
        )
      )
      onStatsChange(0, cp(next) - cp(prevStatus), ca(next) - ca(prevStatus))
      if (next === 'makeup') toast.success('Có mặt ✓')
      else toast('Vắng', { icon: '✗' })
    } catch {
      setAdded((entries) => entries.map((a) => (a.id === id ? { ...a, loading: false } : a)))
      toast.error('Có lỗi, thử lại.')
    }
  }

  const btnBase =
    'flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40'

  return (
    <div className="mb-3">
      <div className="relative" ref={boxRef}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDrop(true)}
          placeholder="Tìm học sinh học bù..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm shadow-sm focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">...</span>
        )}

        {showDrop && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            {results.length > 0 ? (
              results.map((r) => (
                <div key={r.id} className="border-b border-gray-50 px-4 py-3 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-gray-800">
                        {r.nickname ?? r.full_name}
                        {r.nickname && (
                          <span className="text-xs font-normal text-gray-400">({r.full_name})</span>
                        )}
                        {r.payment_status === 'pending' && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            Chờ thu
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {r.home_class_name ?? '—'} · Buổi {r.used_sessions}/{r.total_sessions}
                      </div>
                      {classesForDay.length > 1 && (
                        <select
                          value={r.selectedClassId}
                          onChange={(e) => updateResultClass(r.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600"
                        >
                          {classesForDay.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <button
                      onClick={() => addStudent(r)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C9A84C]/15 text-[#C9A84C] active:scale-95"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-400">
                Không tìm thấy (chưa có gói hoặc đã trong lớp này)
              </div>
            )}
          </div>
        )}
      </div>

      {added.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="bg-amber-50/70 px-4 py-2">
            <span className="text-xs font-semibold text-amber-600">
              Học bù · {added.length} học sinh
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {added.map((m) => {
              const initials = m.full_name
                .split(' ')
                .map((w) => w[0])
                .slice(-2)
                .join('')
                .toUpperCase()
              return (
                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-gray-800">{m.nickname ?? m.full_name}</span>
                        {m.payment_status === 'pending' && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            Chờ thu
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        Buổi {m.used_sessions}/{m.total_sessions}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => markStudent(m.id, 'makeup')}
                      disabled={m.loading}
                      className={`${btnBase} ${
                        m.status === 'makeup'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-400 active:bg-emerald-100 active:text-emerald-600'
                      }`}
                    >
                      <Check className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => markStudent(m.id, 'absent')}
                      disabled={m.loading}
                      className={`${btnBase} ${
                        m.status === 'absent'
                          ? 'bg-red-400 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-400 active:bg-red-100 active:text-red-400'
                      }`}
                    >
                      <X className="h-5 w-5" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => removeStudent(m.id)}
                      title="Xóa khỏi danh sách"
                      className="ml-1 text-gray-300 hover:text-red-400 active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
