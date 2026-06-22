import { Skeleton } from '@/components/ui/skeleton'

export default function LichCaLoading() {
  return (
    <div className="p-4">
      {/* Week strip */}
      <div className="mb-5 grid grid-cols-7 gap-1.5">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl" />
        ))}
      </div>
      {/* Day groups */}
      {[...Array(4)].map((_, d) => (
        <div key={d} className="mb-5">
          <Skeleton className="mb-2 h-4 w-20" />
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-6 w-12 ml-auto" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
