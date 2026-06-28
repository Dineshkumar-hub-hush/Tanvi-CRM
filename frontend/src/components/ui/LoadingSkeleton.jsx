function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3" aria-live="polite" aria-busy="true" aria-label="Loading content">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-shimmer h-12 rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export default LoadingSkeleton;
