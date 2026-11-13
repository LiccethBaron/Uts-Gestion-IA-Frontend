import React from 'react';

export const SearchSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden="true">
      {[1, 2, 3].map((index) => (
        <div key={index} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-24 rounded bg-slate-200" />
              <div className="h-5 w-28 rounded bg-slate-100" />
            </div>
            <div className="h-5 w-12 rounded bg-slate-200" />
          </div>

          <div className="mt-3 space-y-2">
            <div className="h-5 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-100" />
          </div>

          <div className="mt-4 rounded-lg bg-blue-50/50 p-3">
            <div className="h-4 w-1/3 rounded bg-blue-100 mb-1" />
            <div className="h-3 w-4/5 rounded bg-blue-50" />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex gap-4">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded bg-slate-100" />
              <div className="h-7 w-20 rounded bg-emerald-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

