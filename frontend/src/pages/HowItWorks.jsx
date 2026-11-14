import React, { useState } from 'react';
import { Button } from '../components/ui/Button';

export function HowItWorks() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const steps = [
    {
      num: '01',
      title: 'Plan',
      desc: 'Your goal decides what to look for. A partnership and a sales call need completely different news and signals.',
      tag: 'objective-aware'
    },
    {
      num: '02',
      title: 'Search',
      desc: 'Live deep search for launches, executive hires, deals, and regulatory filings from the past 30 days.',
      tag: '30-day window'
    },
    {
      num: '03',
      title: 'Verify',
      desc: 'Cross-checks dates and support for every claim. Runs iterative follow-up queries when evidence is thin.',
      tag: 'source-backed'
    },
    {
      num: '04',
      title: 'Brief',
      desc: 'One concise executive page with sources, opportunities, risks, and high-leverage questions to ask.',
      tag: 'one page'
    }
  ];

  return (
    <div className="page-container flex flex-col justify-between">
      <div>
        <p className="font-mono-meta mb-3 reveal-up" style={{ '--stagger': 0 }}>
          how it thinks
        </p>
        <h2
          className="text-[#1B1630] font-heading font-extrabold tracking-tight leading-[0.94] mb-8 reveal-up"
          style={{ '--stagger': 1 }}
        >
          It reads so you<br />don’t have to.
        </h2>

        {/* Steps track with travelling glowing dot */}
        <div className="relative mt-16 pt-8 reveal-up" style={{ '--stagger': 2 }}>
          {/* Track line */}
          <div className="absolute left-0 right-0 top-0 h-[2px] bg-[rgba(27,22,48,0.15)] overflow-hidden">
            <span
              className="absolute -top-[5px] w-3 h-3 rounded-full shadow-[0_0_18px_#E60B09] animate-[track-travel_5.5s_linear_infinite]"
              style={{ background: 'var(--g)' }}
            />
          </div>

          <style>{`
            @keyframes track-travel {
              from { left: 0%; }
              to { left: 100%; }
            }
            .step-outlined-num {
              -webkit-text-stroke: 1.5px #1B1630;
              color: transparent;
              transition: all 0.4s ease;
            }
            .step-card:hover .step-outlined-num {
              -webkit-text-stroke: 0;
              background: var(--gt);
              -webkit-background-clip: text;
              background-clip: text;
              transform: translateY(-3px);
            }
          `}</style>

          {/* Steps Grid with Hover Dims */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((st, i) => {
              const isOtherHovered = hoveredIndex !== null && hoveredIndex !== i;
              return (
                <div
                  key={st.num}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`step-card relative transition-opacity duration-300 ${
                    isOtherHovered ? 'opacity-35' : 'opacity-100'
                  }`}
                >
                  {/* Indicator pin on track */}
                  <span
                    className={`absolute -top-[37px] left-0 w-2.5 h-2.5 rounded-full border-2 border-[#1B1630] bg-[#FAF3E8] transition-all duration-300 ${
                      hoveredIndex === i ? 'scale-150 !border-transparent !bg-[#E60B09]' : ''
                    }`}
                  />

                  {/* Outlined Numeral */}
                  <div className="step-outlined-num font-heading font-extrabold text-[clamp(65px,8vw,130px)] leading-none select-none mb-2">
                    {st.num}
                  </div>

                  <h3 className="font-heading font-extrabold text-[28px] text-[#1B1630] mb-2">
                    {st.title}
                  </h3>

                  <p className="text-[#665F75] text-[15.5px] leading-relaxed mb-4 max-w-[22em]">
                    {st.desc}
                  </p>

                  <p className="font-mono text-[12px] text-[#E60B09] font-medium tracking-wide">
                    {st.tag}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div
          className="flex flex-wrap items-center gap-4 mt-16 pt-4 reveal-up"
          style={{ '--stagger': 4 }}
        >
          <Button to="/new" variant="primary">
            Try it →
          </Button>
          <Button to="/briefings/brief_001" variant="ghost">
            See a sample briefing
          </Button>
        </div>
      </div>
    </div>
  );
}
