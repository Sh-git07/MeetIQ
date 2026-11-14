import React from 'react';
import { formatDateFull, categoryColor } from '../../utils/formatters';
import { ExternalLink } from 'lucide-react';

export function SourceCard({ source, isActive, onHover }) {
  const edgeColor = categoryColor(source.category);

  return (
    <div
      data-source-card-id={source.id}
      onMouseEnter={() => onHover(source.id)}
      onMouseLeave={() => onHover(null)}
      className={`bg-[#F0E6D4] rounded-xl p-3 mb-2.5 transition-all duration-300 relative border-l-[3.5px] ${
        isActive
          ? '-translate-x-1.5 shadow-[0_4px_16px_rgba(230,11,9,0.15)] ring-2 ring-[#E60B09]'
          : 'hover:-translate-x-1 shadow-sm'
      }`}
      style={{ borderLeftColor: edgeColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <b className="block text-[14px] leading-snug text-[#1B1630] font-sans font-semibold">
          {source.title}
        </b>
        {source.url && source.url !== '#' && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#665F75] hover:text-[#E60B09] transition-colors p-0.5 shrink-0"
            title="Open original source"
          >
            <ExternalLink size={13} />
          </a>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5 font-mono text-[11.5px] text-[#665F75]">
        <span className="truncate">{source.publisher}</span>
        <span>·</span>
        <span className="shrink-0">{formatDateFull(source.published_at)}</span>
      </div>
    </div>
  );
}
