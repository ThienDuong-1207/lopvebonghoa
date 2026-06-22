'use client'

import { Trash2 } from 'lucide-react'
import Btn from './Btn'

interface Props {
  action: () => Promise<void>
  name: string
}

export default function DeleteClassButton({ action, name }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Xóa lớp "${name}"? Không thể hoàn tác.`)) e.preventDefault()
      }}
    >
      <Btn type="submit" variant="danger" size="icon-md">
        <Trash2 className="h-3.5 w-3.5" />
      </Btn>
    </form>
  )
}
