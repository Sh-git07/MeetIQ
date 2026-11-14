import React from 'react';

export function CitationMarker({ sourceId, activeSourceId, onHover }) {
  const isActive = String(activeSourceId) === String(sourceId);

  return (
    <sup
      data-source-id={sourceId}
      onMouseEnter={() => onHover(sourceId)}
      onMouseLeave={() => onHover(null)}
      className={`font-mono font-medium text-[11px] px-1.5 py-0.5 rounded-[7px] ml-1 cursor-pointer transition-all duration-200 select-none ${
        isActive
          ? 'bg-[#E60B09] text-[#FAF3E8] shadow-sm'
          : 'bg-[#F5E8A8] text-[#1B1630] hover:bg-[#E60B09] hover:text-[#FAF3E8]'
      }`}
      title={`Source #${sourceId}`}
    >
      {sourceId}
    </sup>
  );
}
