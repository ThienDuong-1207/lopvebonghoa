import { Skeleton } from '@/components/ui/skeleton'

export default function StaffHomeLoading() {
  return (
    <div className="p-4">
      {/* Hero row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="relative col-span-1 overflow-hidden rounded-2xl bg-[#C9A84C]/20 p-4">
          <Skeleton className="mb-3 h-5 w-5 rounded-full bg-[#C9A84C]/30" />
          <Skeleton className="mb-1 h-8 w-12 bg-[#C9A84C]/30" />
          <Skeleton className="h-3 w-16 bg-[#C9A84C]/30" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-800">
            <Skeleton className="mb-1.5 h-4 w-4 rounded-full" />
            <Skeleton className="mb-1 h-6 w-8" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <div className="flex-1 rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-800">
            <Skeleton className="mb-1.5 h-4 w-4 rounded-full" />
            <Skeleton className="mb-1 h-6 w-8" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm dark:bg-gray-800">
          <Skeleton className="mb-2 h-3 w-16" />
          <div className="grid grid-cols-4 gap-1">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-8 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Slot cards */}
      <Skeleton className="mb-2 h-4 w-40" />
      <div className="space-y-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 shadow-sm dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
