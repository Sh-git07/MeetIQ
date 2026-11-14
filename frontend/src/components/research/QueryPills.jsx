import React from 'react';

export function QueryPills({ queries = [] }) {
  if (!queries || queries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5 min-h-[28px]">
      {queries.map((q, idx) => (
        <span
          key={idx}
          className="border-b-2 border-[#E60B09] text-[13.5px] font-mono text-[#1B1630] py-0.5 animate-[reveal-up-anim_0.4s_ease-out]"
        >
          {q}
        </span>
      ))}
    </div>
  );
}
