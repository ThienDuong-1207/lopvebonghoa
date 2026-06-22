'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { buildZaloContent, openZalo } from '@/lib/utils/zalo'
import type { AlertType } from '@/lib/types/database'

interface Props {
  alertId: string
  type: AlertType
  studentName: string
  parentName: string
  parentPhone: string
  sessionsUsed: number
  sessionsTotal: number
  sessionsLeft: number
  lastSessionDate: string | null
  zaloSentAt: string | null
  resolved: boolean
}

const ALERT_LABEL: Record<string, string> = {
  near_end: 'Sắp hết gói',
  package_ended: 'Hết gói',
  inactive: 'Nghỉ >14 ngày',
  new_registration: 'Đăng ký mới',
}
const ALERT_COLOR: Record<string, 'destructive' | 'default' | 'secondary'> = {
  package_ended: 'destructive',
  near_end: 'default',
  inactive: 'secondary',
  new_registration: 'secondary',
}

export default function AlertRow({
  alertId,
  type,
  studentName,
  parentName,
  parentPhone,
  sessionsUsed,
  sessionsTotal,
  sessionsLeft,
  lastSessionDate,
  zaloSentAt,
  resolved,
}: Props) {
  const [sent, setSent] = useState(!!zaloSentAt)
  const [done, setDone] = useState(resolved)

  const content = buildZaloContent({
    phone: parentPhone,
    parentName,
    childName: studentName,
    sessionsUsed,
    sessionsTotal,
    sessionsLeft,
    lastSessionDate,
    alertType: type as 'package_ended' | 'near_end' | 'inactive',
  })

  async function handleZalo() {
    await openZalo(parentPhone, content)
    await fetch(`/api/alerts/${alertId}/zalo-sent`, { method: 'PATCH' })
    setSent(true)
  }

  async function handleResolve() {
    await fetch(`/api/alerts/${alertId}/resolve`, { method: 'PATCH' })
    setDone(true)
  }

  if (done) return null

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{studentName}</span>
          <Badge variant={ALERT_COLOR[type]}>{ALERT_LABEL[type]}</Badge>
          {sent && <Badge variant="outline" className="text-green-600">Đã nhắn Zalo</Badge>}
        </div>
        <div className="text-sm text-gray-500">PH: {parentName} — {parentPhone}</div>
        <div className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">{content}</div>
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <button
          onClick={handleZalo}
          className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
        >
          📱 Zalo
        </button>
        <button
          onClick={handleResolve}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
        >
          ✓ Xong
        </button>
      </div>
    </div>
  )
}
