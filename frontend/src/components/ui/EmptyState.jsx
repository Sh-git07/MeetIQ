import React from 'react';
import { Button } from './Button';

export function EmptyState({
  title = 'No items found',
  description = 'There are no records to display.',
  actionLabel,
  actionTo,
  onAction
}) {
  return (
    <div className="py-16 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full border border-[rgba(27,22,48,0.2)] mx-auto mb-4 flex items-center justify-center font-mono text-sm text-[#665F75]">
        0
      </div>
      <h3 className="text-xl font-bold font-heading tracking-tight mb-2 text-[#1B1630]">
        {title}
      </h3>
      <p className="text-[#665F75] text-sm mb-6 leading-relaxed">
        {description}
      </p>
      {(actionLabel && (actionTo || onAction)) && (
        <Button to={actionTo} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
