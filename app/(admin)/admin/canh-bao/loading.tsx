import { Skeleton } from '@/components/ui/skeleton'

function TopbarSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-5 dark:border-gray-800 dark:bg-gray-900">
      <Skeleton className="h-7 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <>
      <TopbarSkeleton />
      <div className="p-6 space-y-6">
        {[...Array(3)].map((_, g) => (
          <div key={g}>
            <Skeleton className="mb-3 h-4 w-28" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
