export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="flex items-end justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted/70 rounded-md" />
          <div className="h-3.5 w-72 bg-muted/40 rounded-md" />
        </div>
        <div className="h-8 w-32 bg-muted/40 rounded-lg" />
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="h-3 w-20 bg-muted/50 rounded" />
            <div className="h-7 w-16 bg-muted/70 rounded" />
            <div className="h-3 w-24 bg-muted/30 rounded" />
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-4 py-3 flex gap-6">
          <div className="h-3 w-16 bg-muted/50 rounded" />
          <div className="h-3 w-32 bg-muted/50 rounded" />
          <div className="h-3 w-24 bg-muted/50 rounded" />
          <div className="h-3 w-20 bg-muted/50 rounded ml-auto" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border/40 last:border-0 px-4 py-3.5 flex items-center gap-6"
          >
            <div className="h-3 w-14 bg-muted/40 rounded" />
            <div className="h-3 flex-1 max-w-[280px] bg-muted/50 rounded" />
            <div className="h-3 w-24 bg-muted/40 rounded" />
            <div className="h-5 w-20 bg-muted/30 rounded-full ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
