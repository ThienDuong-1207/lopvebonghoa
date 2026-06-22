import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-44" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800 space-y-4">
            <Skeleton className="h-5 w-32" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
          <div className="xl:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
                <Skeleton className="mb-3 h-5 w-24" />
                <div className="grid grid-cols-3 gap-3">
                  {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
