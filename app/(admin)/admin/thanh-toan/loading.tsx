import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-7 w-28" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-3 w-16" />)}
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
