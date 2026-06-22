'use client'

import { Trash2 } from 'lucide-react'

interface Props {
  action: () => Promise<void>
  name: string
}

export default function DeleteSlotButton({ action, name }: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Xóa ca "${name}"?\nThao tác không thể hoàn tác.`)) e.preventDefault()
      }}
    >
      <button
        type="submit"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  )
}
