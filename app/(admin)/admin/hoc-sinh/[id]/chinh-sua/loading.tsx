import { Skeleton } from '@/components/ui/skeleton'
import Topbar from '@/components/admin/Topbar'

export default function ChinhSuaLoading() {
  return (
    <>
      <Topbar title="Chỉnh sửa học sinh" />
      <div className="p-6">
        <div className="mx-auto max-w-xl space-y-4">
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <Skeleton className="mb-4 h-5 w-36" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>
    </>
  )
}
