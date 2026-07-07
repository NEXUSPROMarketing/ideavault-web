import { Skeleton } from "@/components/skeleton";

export default function LoadingIdea() {
  return (
    <div className="shell py-10" role="status" aria-label="Loading idea report">
      <Skeleton className="h-4 w-24" />
      <div className="card mt-4 p-6 sm:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-4 h-9 w-4/5" />
            <Skeleton className="mt-3 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-2/3" />
            <div className="mt-5 flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-6 lg:flex-col">
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-24 w-48" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-card" />
          ))}
        </div>
        <div className="space-y-5">
          <Skeleton className="h-48 w-full rounded-card" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
