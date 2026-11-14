import React, { useEffect, useRef } from 'react';

export function ActivityLog({ events = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  return (
    <div
      ref={scrollRef}
      className="log-box font-mono text-[12.5px] leading-relaxed text-[#665F75] my-4 min-h-[110px] max-h-[180px] overflow-y-auto space-y-1 pr-2"
    >
      {events.map((ev, i) => {
        const timeStr = `00:${String(i * 2).padStart(2, '0')}`;
        return (
          <div key={i} className="animate-[reveal-up-anim_0.4s_ease-out]">
            <b className="text-[#1B1630] font-medium mr-2">{timeStr}</b>
            <span>{ev.message}</span>
          </div>
        );
      })}
    </div>
  );
}
