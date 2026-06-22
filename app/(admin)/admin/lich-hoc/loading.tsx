import { Skeleton } from '@/components/ui/skeleton'

export default function LichHocLoading() {
  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-7 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-5">
            {[...Array(5)].map((_, d) => (
              <div key={d}>
                <Skeleton className="mb-2 h-4 w-20" />
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-7 w-12 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 space-y-3">
            <Skeleton className="h-5 w-32" />
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
            <Skeleton className="h-9 w-full rounded-md" />
          </div>
        </div>
      </div>
    </>
  )
}
