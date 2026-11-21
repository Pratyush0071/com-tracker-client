export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl p-4">
            <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
            <div className="h-6 w-32 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-10 bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
