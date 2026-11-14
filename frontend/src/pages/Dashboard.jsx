import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMeetings } from '../hooks/useMeetings';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatMeetingTime } from '../utils/formatters';

export function Dashboard() {
  const navigate = useNavigate();
  const { meetings, loading, error, refetch } = useMeetings();

  // Split into Coming Up and Recent Briefings
  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'pending' || m.status === 'created' || !m.briefing_id
  );

  const recentBriefings = meetings.filter(
    (m) => m.status === 'completed' || m.status === 'in_progress' || m.status === 'failed'
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 18) return 'Good afternoon.';
    return 'Good evening.';
  };

  return (
    <div className="page-container">
      {/* Header Greeting */}
      <p className="font-mono-meta mb-2 reveal-up" style={{ '--stagger': 0 }}>
        dashboard
      </p>

      <h2
        className="text-[#1B1630] font-heading font-extrabold tracking-tight leading-[0.94] mb-8 reveal-up"
        style={{ '--stagger': 1 }}
      >
        {getGreeting()}
        <br />
        <span className="text-gradient">
          {upcomingMeetings.length > 0
            ? `${upcomingMeetings.length} meetings ahead.`
            : 'Ready for your next briefing.'}
        </span>
      </h2>

      {/* Top 3 Stats in Readable Gradient */}
      <div
        className="flex flex-wrap items-baseline gap-12 sm:gap-20 my-10 reveal-up"
        style={{ '--stagger': 2 }}
      >
        <div>
          <b className="font-heading font-extrabold text-[clamp(48px,6vw,88px)] leading-none block text-gradient">
            14
          </b>
          <small className="text-[#665F75] text-sm font-sans mt-1 block">
            briefings made
          </small>
        </div>
        <div>
          <b className="font-heading font-extrabold text-[clamp(48px,6vw,88px)] leading-none block text-gradient">
            126
          </b>
          <small className="text-[#665F75] text-sm font-sans mt-1 block">
            sources checked
          </small>
        </div>
        <div>
          <b className="font-heading font-extrabold text-[clamp(48px,6vw,88px)] leading-none block text-gradient">
            3m 40s
          </b>
          <small className="text-[#665F75] text-sm font-sans mt-1 block">
            average research time
          </small>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="my-8 p-4 bg-[#C21A12]/10 border border-[#C21A12]/30 rounded-xl flex items-center justify-between">
          <p className="text-[#C21A12] text-sm font-medium">{error}</p>
          <Button variant="ghost" onClick={refetch} className="text-xs py-1.5 px-3">
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !meetings.length && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12">
          <div className="space-y-4">
            <Skeleton height="32px" width="160px" />
            <Skeleton height="60px" />
            <Skeleton height="60px" />
          </div>
          <div className="space-y-4">
            <Skeleton height="32px" width="180px" />
            <Skeleton height="60px" />
            <Skeleton height="60px" />
          </div>
        </div>
      )}

      {/* Two Ruled Columns (No Cards) */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mt-8 reveal-up" style={{ '--stagger': 3 }}>
          {/* Coming Up */}
          <div>
            <h3 className="font-heading font-extrabold text-[24px] text-[#1B1630] mb-3">
              Coming up
            </h3>

            {upcomingMeetings.length === 0 ? (
              <p className="text-[#665F75] text-sm py-6 border-b border-[rgba(27,22,48,0.15)] font-mono">
                No upcoming meetings scheduled.
              </p>
            ) : (
              upcomingMeetings.map((m) => (
                <div
                  key={m.meeting_id}
                  onClick={() => navigate('/new')}
                  className="group relative flex items-center justify-between py-4 border-b border-[rgba(27,22,48,0.15)] cursor-pointer transition-all duration-300 hover:pl-2.5"
                >
                  <div>
                    <b className="block font-heading text-[18px] text-[#1B1630] group-hover:text-[#E60B09] transition-colors">
                      {m.company}
                    </b>
                    <small className="text-[#665F75] text-xs font-mono">
                      {m.meeting_type} · {formatMeetingTime(m.meeting_date)}
                    </small>
                  </div>
                  <span className="font-mono text-[12.5px] text-[#E60B09] font-medium tracking-wide">
                    Prepare →
                  </span>
                  {/* Hover Sweep Underline */}
                  <span
                    className="absolute left-0 bottom-[-1px] h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                    style={{ background: 'var(--g)' }}
                  />
                </div>
              ))
            )}
          </div>

          {/* Recent Briefings */}
          <div>
            <h3 className="font-heading font-extrabold text-[24px] text-[#1B1630] mb-3">
              Recent briefings
            </h3>

            {recentBriefings.length === 0 ? (
              <p className="text-[#665F75] text-sm py-6 border-b border-[rgba(27,22,48,0.15)] font-mono">
                No briefings generated yet.
              </p>
            ) : (
              recentBriefings.map((m) => {
                const targetUrl =
                  m.status === 'failed'
                    ? `/research/research_${m.meeting_id.replace('meet_', '')}`
                    : m.briefing_id
                    ? `/briefings/${m.briefing_id}`
                    : `/research/research_${m.meeting_id.replace('meet_', '')}`;

                return (
                  <div
                    key={m.meeting_id}
                    onClick={() => navigate(targetUrl)}
                    className="group relative flex items-center justify-between py-4 border-b border-[rgba(27,22,48,0.15)] cursor-pointer transition-all duration-300 hover:pl-2.5"
                  >
                    <div>
                      <b className="block font-heading text-[18px] text-[#1B1630] group-hover:text-[#E60B09] transition-colors">
                        {m.company}
                      </b>
                      <small className="text-[#665F75] text-xs font-mono">
                        {m.meeting_type} · {formatMeetingTime(m.meeting_date)}
                      </small>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        status={m.status}
                        label={
                          m.status === 'failed'
                            ? 'failed · retry'
                            : m.status === 'in_progress'
                            ? 'researching'
                            : 'completed'
                        }
                      />
                    </div>

                    {/* Hover Sweep Underline */}
                    <span
                      className="absolute left-0 bottom-[-1px] h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                      style={{ background: 'var(--g)' }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
