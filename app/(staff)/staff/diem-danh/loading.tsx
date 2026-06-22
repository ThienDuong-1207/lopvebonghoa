import { Skeleton } from '@/components/ui/skeleton'

export default function DiemDanhLoading() {
  return (
    <div className="p-4">
      {/* Summary bar */}
      <div className="mb-4 flex gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 rounded-xl bg-gray-50 py-3 text-center dark:bg-gray-800">
            <Skeleton className="mx-auto mb-1 h-6 w-8" />
            <Skeleton className="mx-auto h-3 w-12" />
          </div>
        ))}
      </div>
      {/* Student cards */}
      {[...Array(6)].map((_, i) => (
        <div key={i} className="mb-3 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
