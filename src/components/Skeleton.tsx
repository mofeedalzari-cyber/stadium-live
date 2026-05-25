import { cn } from "../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-black/10 dark:bg-white/5 rounded-2xl", className)} />
  );
}

export function MatchSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-4 sm:p-6 border border-black/5 dark:border-white/5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mt-6">
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className="w-12 h-12 sm:w-16 rounded-2xl" />
          <Skeleton className="w-16 h-3" />
        </div>
        <Skeleton className="w-12 h-6 rounded-xl" />
        <div className="flex flex-col items-center gap-2 flex-1">
          <Skeleton className="w-12 h-12 sm:w-16 rounded-2xl" />
          <Skeleton className="w-16 h-3" />
        </div>
      </div>
      <Skeleton className="h-8 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  );
}
