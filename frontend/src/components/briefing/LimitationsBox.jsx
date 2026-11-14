import React from 'react';
import { AlertCircle } from 'lucide-react';

export function LimitationsBox({ limitations = [] }) {
  if (!limitations || limitations.length === 0) {
    return (
      <div className="bg-[#F2DDA0] rounded-xl p-4 text-[14px] text-[#1B1630] leading-relaxed">
        <b className="block font-bold mb-1 flex items-center gap-1.5 font-sans">
          <AlertCircle size={15} className="text-[#C21A12] shrink-0" />
          Research limitations
        </b>
        Public sources were cross-referenced within the 30-day window. Some internal executive decisions and unannounced roadmaps remain confidential.
      </div>
    );
  }

  return (
    <div className="bg-[#F2DDA0] rounded-xl p-4 text-[14px] text-[#1B1630] leading-relaxed">
      <b className="block font-bold mb-1.5 flex items-center gap-1.5 font-sans">
        <AlertCircle size={15} className="text-[#C21A12] shrink-0" />
        Research limitations
      </b>
      <div className="space-y-1.5">
        {limitations.map((lim, idx) => (
          <p key={idx} className="m-0 text-[#1B1630]/90">
            {lim}
          </p>
        ))}
      </div>
    </div>
  );
}
