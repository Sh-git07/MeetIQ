import React from 'react';

export function CoveragePanel({ coverage }) {
  const metrics = [
    { label: 'news', width: `${coverage?.news || 85}%`, color: '#3F7D58' },
    { label: 'leadership', width: `${coverage?.leadership || 70}%`, color: '#1B1630' },
    { label: 'financials', width: `${coverage?.financials || 50}%`, color: '#D4A300' }
  ];

  return (
    <div className="mt-5 pt-4 border-t border-[rgba(27,22,48,0.15)]">
      <div className="font-mono text-[11px] uppercase tracking-wider text-[#665F75] mb-2.5">
        Signal Coverage
      </div>
      <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-2 items-center font-mono text-[12px] text-[#665F75]">
        {metrics.map((m) => (
          <React.Fragment key={m.label}>
            <span>{m.label}</span>
            <div className="h-[5px] rounded-full bg-[#F0E6D4] overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: m.width,
                  backgroundColor: m.color
                }}
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
