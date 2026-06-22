import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <>
      {/* Topbar skeleton */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="p-8">
        {/* Row 1: metric cards */}
        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
              <Skeleton className="mb-4 h-4 w-28" />
              <Skeleton className="mb-2 h-9 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>

        {/* Row 2: chart + alerts */}
        <div className="mb-5 grid gap-4 xl:grid-cols-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 xl:col-span-3">
            <Skeleton className="mb-4 h-5 w-40" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 xl:col-span-2">
            <Skeleton className="mb-4 h-5 w-24" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="mb-3 flex items-center gap-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: revenue + slots */}
        <div className="grid gap-4 xl:grid-cols-5">
          <div className="rounded-2xl bg-gray-200 p-6 dark:bg-gray-700 xl:col-span-2">
            <Skeleton className="mb-2 h-4 w-32 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="mb-4 h-10 w-24 bg-gray-300 dark:bg-gray-600" />
            <Skeleton className="h-28 w-full rounded-xl bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 xl:col-span-3">
            <Skeleton className="mb-4 h-5 w-32" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-3 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3.5 dark:border-gray-700 dark:bg-gray-700/30">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
