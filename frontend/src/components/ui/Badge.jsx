import React from 'react';

export function Badge({ status, label, className = '' }) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#12A37A';
      case 'failed':
        return '#C21A12';
      case 'in_progress':
      case 'running':
        return '#E60B09';
      case 'created':
      case 'pending':
      default:
        return '#665F75';
    }
  };

  const color = getStatusColor();

  return (
    <span
      className={`font-mono text-[12px] font-medium tracking-wide flex items-center gap-2 ${className}`}
      style={{ color: '#665F75' }}
    >
      <i
        className="w-2 h-2 rounded-full inline-block"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label || status}
    </span>
  );
}
