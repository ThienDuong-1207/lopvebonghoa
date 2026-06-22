'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ImportResult {
  created: number
  updated: number
  errors: string[]
  total: number
}

export default function ImportExportButtons() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const router = useRouter()

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setResult(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/students/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lỗi không xác định')
      setResult(data)
      router.refresh()
    } catch (err: unknown) {
      setResult({ created: 0, updated: 0, errors: [(err as Error).message], total: 0 })
    } finally {
      setImporting(false)
      // reset file input so same file can be uploaded again
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Export */}
      <a href="/api/students/export">
        <Button variant="outline" className="gap-2 text-sm">
          <Download className="h-4 w-4" />
          Xuất Excel
        </Button>
      </a>

      {/* Template */}
      <a href="/api/students/template">
        <Button variant="outline" className="gap-2 text-sm text-[#C9A84C] border-[#C9A84C]/40 hover:bg-[#C9A84C]/5">
          <FileSpreadsheet className="h-4 w-4" />
          Tải template
        </Button>
      </a>

      {/* Import */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImport}
      />
      <Button
        variant="outline"
        className="gap-2 text-sm"
        disabled={importing}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {importing ? 'Đang nhập...' : 'Nhập từ Excel'}
      </Button>

      {/* Result modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Kết quả import</h3>
              <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.created}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Tạo mới</div>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.updated}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Cập nhật</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {result.errors.length} lỗi
                </div>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-500 dark:text-red-400">• {e}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors.length === 0 && result.total > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Import thành công {result.total} học sinh!
              </div>
            )}

            <Button onClick={() => setResult(null)} className="w-full bg-[#0D2545] text-white hover:bg-[#0D2545]/90">
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
