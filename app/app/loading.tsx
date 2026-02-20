export default function AppLoading() {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header skeleton */}
      <div className="flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-6 sticky top-0 z-50">
        <div className="shimmer h-7 w-7 rounded-md" />
        <div className="w-px h-6 bg-border/50" />
        <div className="shimmer h-5 w-36 rounded-md" />
      </div>

      {/* Content */}
      <div className="p-4 lg:p-6 flex flex-col gap-6">
        {/* Period label area */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <div className="shimmer h-5 w-32 rounded-md" />
            <div className="shimmer h-3.5 w-56 rounded-md" />
          </div>
          <div className="shimmer h-9 w-44 rounded-lg" />
        </div>

        {/* KPI cards row — 4 cols */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5 flex justify-between gap-3"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="shimmer h-3 w-20 rounded" />
                <div className="shimmer h-7 w-16 rounded-md" />
                <div className="shimmer h-3 w-24 rounded" />
              </div>
              <div className="shimmer h-11 w-11 rounded-xl shrink-0" />
            </div>
          ))}
        </div>

        {/* KPI cards row — 3 cols */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/50 bg-card p-5 flex justify-between gap-3"
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="shimmer h-3 w-16 rounded" />
                <div className="shimmer h-7 w-12 rounded-md" />
                <div className="shimmer h-3 w-20 rounded" />
              </div>
              <div className="shimmer h-11 w-11 rounded-xl shrink-0" />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-5 flex flex-col gap-4">
              <div className="shimmer h-5 w-48 rounded-md" />
              <div className="shimmer h-[280px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
