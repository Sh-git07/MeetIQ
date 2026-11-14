import React from 'react';

export function Skeleton({ className = '', height = '20px', width = '100%' }) {
  return (
    <div
      style={{ height, width }}
      className={`bg-[rgba(27,22,48,0.06)] rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function BriefingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-4 w-48 bg-[rgba(27,22,48,0.07)] rounded" />
      <div className="h-14 w-3/4 bg-[rgba(27,22,48,0.09)] rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <div className="space-y-4">
          <div className="h-6 w-28 bg-[rgba(27,22,48,0.08)] rounded" />
          <div className="h-24 bg-[rgba(27,22,48,0.05)] rounded-xl" />
          <div className="h-32 bg-[rgba(27,22,48,0.05)] rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 bg-[rgba(27,22,48,0.08)] rounded" />
          <div className="h-28 bg-[rgba(27,22,48,0.05)] rounded-xl" />
          <div className="h-28 bg-[rgba(27,22,48,0.05)] rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-24 bg-[rgba(27,22,48,0.08)] rounded" />
          <div className="h-20 bg-[rgba(27,22,48,0.06)] rounded-xl" />
          <div className="h-20 bg-[rgba(27,22,48,0.06)] rounded-xl" />
          <div className="h-20 bg-[rgba(27,22,48,0.06)] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
