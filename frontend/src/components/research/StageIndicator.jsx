import React from 'react';

const STAGE_LABELS = {
  planning: 'Planning',
  searching: 'Searching',
  verifying: 'Verifying',
  generating: 'Writing',
  completed: 'Ready',
  failed: 'Paused'
};

export function StageIndicator({ stage, progress, message }) {
  const displayStage = STAGE_LABELS[stage] || 'Researching';

  return (
    <div>
      <h1 className="text-[clamp(54px,7vw,100px)] tracking-tight leading-none text-[#1B1630] font-heading font-extrabold my-2">
        <span key={displayStage} className="inline-block animate-[reveal-up-anim_0.5s_cubic-bezier(0.2,0.8,0.2,1)]">
          {displayStage}
        </span>
      </h1>

      <div className="text-[clamp(52px,6.5vw,94px)] font-heading font-extrabold leading-none my-1">
        <span className="text-gradient">{progress}%</span>
      </div>

      <div className="h-[3px] bg-[rgba(27,22,48,0.15)] rounded-full overflow-hidden my-3">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
            background: 'var(--g)'
          }}
        />
      </div>

      <p className="text-[clamp(16px,1.5vw,19px)] text-[#665F75] mt-2 mb-3 leading-snug">
        {message}
      </p>
    </div>
  );
}
