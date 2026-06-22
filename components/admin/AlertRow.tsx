'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { buildZaloContent, openZalo } from '@/lib/utils/zalo'
import type { AlertType } from '@/lib/types/database'
import Btn from '@/components/admin/Btn'

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
  nextSessionDate: string | null
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
  nextSessionDate,
  zaloSentAt,
  resolved,
}: Props) {
  const [sent, setSent] = useState(!!zaloSentAt)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(resolved)

  const content = buildZaloContent({
    phone: parentPhone,
    parentName,
    childName: studentName,
    sessionsUsed,
    sessionsTotal,
    sessionsLeft,
    lastSessionDate,
    nextSessionDate,
    alertType: type as 'package_ended' | 'near_end' | 'inactive',
  })

  function handleZalo() {
    openZalo(parentPhone, content)
    setConfirming(true)   // chờ admin xác nhận đã gửi
  }

  async function handleConfirmSent() {
    await fetch(`/api/alerts/${alertId}/zalo-sent`, { method: 'PATCH' })
    setSent(true)
    setConfirming(false)
  }

  function handleCancelConfirm() {
    setConfirming(false)
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
        {confirming ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-center text-[11px] text-gray-400">Đã gửi chưa?</p>
            <Btn size="xs" variant="success" onClick={handleConfirmSent}>✓ Đã gửi</Btn>
            <Btn size="xs" variant="outline" onClick={handleCancelConfirm}>Hủy</Btn>
          </div>
        ) : (
          <Btn
            size="xs"
            onClick={handleZalo}
            className={sent ? 'bg-blue-300 hover:bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'}
          >
            {sent ? '📱 Gửi lại' : '📱 Zalo'}
          </Btn>
        )}
        <Btn size="xs" variant="outline" onClick={handleResolve}>✓ Xong</Btn>
      </div>
    </div>
  )
}
