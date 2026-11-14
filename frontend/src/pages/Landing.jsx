import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Constellation } from '../components/effects/Constellation';

export function Landing() {
  const [typedCommand, setTypedCommand] = useState('');
  const [typedOutput, setTypedOutput] = useState(false);

  const commandText = '$ meetiq prepare "Microsoft" --window 30d';

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setTypedCommand(commandText);
      setTypedOutput(true);
      return;
    }

    let i = 0;
    let timer;

    function typeChar() {
      if (i <= commandText.length) {
        setTypedCommand(commandText.slice(0, i));
        i++;
        timer = setTimeout(typeChar, 50);
      } else {
        timer = setTimeout(() => {
          setTypedOutput(true);
        }, 600);
      }
    }

    timer = setTimeout(typeChar, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-container flex flex-col justify-between">
      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-12 items-center my-auto">
        {/* Left Editorial Content */}
        <div className="max-w-[620px]">
          <p className="font-mono-meta mb-4 reveal-up" style={{ '--stagger': 0 }}>
            meetiq / pre-meeting intelligence
          </p>

          <h1
            className="text-[#1B1630] font-heading font-extrabold tracking-tight leading-[0.94] mb-5 reveal-up"
            style={{ '--stagger': 1 }}
          >
            Walk into every meeting{' '}
            <span className="marker-highlight">prepared.</span>
          </h1>

          <p
            className="text-[clamp(17px,1.7vw,21px)] text-[#665F75] max-w-[30em] leading-relaxed mb-7 reveal-up"
            style={{ '--stagger': 2 }}
          >
            Tell MeetIQ who you are meeting and why. It reads the last 30 days, checks every claim,
            and hands you one page: what changed, what it means, what to ask.
          </p>

          <div
            className="flex flex-wrap items-center gap-3.5 mb-7 reveal-up"
            style={{ '--stagger': 3 }}
          >
            <Button to="/new" variant="primary">
              Prepare for a meeting →
            </Button>
            <Button to="/how" variant="ghost">
              How it thinks
            </Button>
          </div>

          {/* Micro-copy Terminal Line */}
          <div
            className="terminal-box font-mono text-[13.5px] text-[#1B1630] min-h-[50px] mb-6 reveal-up"
            style={{ '--stagger': 4 }}
          >
            <div>
              {typedCommand}
              {!typedOutput && <span className="terminal-caret ml-1" />}
            </div>
            {typedOutput && (
              <div className="mt-1 font-semibold text-gradient animate-[reveal-up-anim_0.4s_ease-out]">
                ✓ 10 sources · 12 claims checked · 1 page
                <span className="terminal-caret ml-1" />
              </div>
            )}
          </div>

          {/* Three Stats Separated by Hairline */}
          <div
            className="flex items-center gap-8 sm:gap-12 pt-6 border-t border-[rgba(27,22,48,0.15)] reveal-up flex-wrap"
            style={{ '--stagger': 5 }}
          >
            <div>
              <b className="font-heading font-extrabold text-[36px] sm:text-[42px] leading-none block text-gradient">
                30
              </b>
              <small className="text-[#665F75] text-[13.5px] font-sans">days scanned</small>
            </div>
            <div>
              <b className="font-heading font-extrabold text-[36px] sm:text-[42px] leading-none block text-gradient">
                100%
              </b>
              <small className="text-[#665F75] text-[13.5px] font-sans">claims sourced</small>
            </div>
            <div>
              <b className="font-heading font-extrabold text-[36px] sm:text-[42px] leading-none block text-gradient">
                1
              </b>
              <small className="text-[#665F75] text-[13.5px] font-sans">page, not a pile of links</small>
            </div>
          </div>
        </div>

        {/* Right Hero Constellation */}
        <div className="reveal-up w-full" style={{ '--stagger': 2 }}>
          <Constellation
            mode="hero"
            company="Microsoft"
            meetingType="Partnership"
            meetingDate="briefing for 15 Nov, 3:00 pm"
          />
        </div>
      </div>

      {/* Footer Minimal Notice */}
      <footer className="pt-8 pb-2 text-center text-xs font-mono text-[#665F75]/70 border-t border-[rgba(27,22,48,0.08)] mt-12">
        MeetIQ · Global AI Hackathon 2026 · Problem 05: Pre-Meeting Briefing Agent
      </footer>
    </div>
  );
}
