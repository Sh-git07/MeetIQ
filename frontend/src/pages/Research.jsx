import React from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useResearchStream } from '../hooks/useResearchStream';
import { Constellation } from '../components/effects/Constellation';
import { StageIndicator } from '../components/research/StageIndicator';
import { ActivityLog } from '../components/research/ActivityLog';
import { QueryPills } from '../components/research/QueryPills';
import { Button } from '../components/ui/Button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { getResearchStatus, getBriefing } from '../services/api';

export function Research() {
  const { researchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const meetingMeta = location.state || {
    company: 'Microsoft',
    meeting_type: 'Partnership',
    meeting_date: 'briefing for 15 Nov, 3:00 pm'
  };

  const {
    events,
    stage,
    progress,
    latestMessage,
    status,
    error,
    queries,
    sources,
    verifiedIds,
    briefingId,
    reconnect
  } = useResearchStream(researchId, meetingMeta);

  const [resolvedBriefingId, setResolvedBriefingId] = React.useState(briefingId);
  const [activeSources, setActiveSources] = React.useState(sources);
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    if (sources && sources.length > 0) {
      setActiveSources(sources);
    }
  }, [sources]);

  React.useEffect(() => {
    if (briefingId) {
      setResolvedBriefingId(briefingId);
      return;
    }

    if (stage === 'completed' && researchId && !resolvedBriefingId) {
      let isSubscribed = true;
      const pollStatus = async () => {
        try {
          const res = await getResearchStatus(researchId);
          if (isSubscribed && res?.briefing_id) {
            setResolvedBriefingId(res.briefing_id);
          }
        } catch (e) {}
      };

      pollStatus();
      const interval = setInterval(pollStatus, 1000);
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    }
  }, [briefingId, stage, researchId, resolvedBriefingId]);

  const targetBriefingId = resolvedBriefingId || briefingId;

  const handleOpenBriefing = async () => {
    if (targetBriefingId) {
      navigate(`/briefings/${targetBriefingId}`);
      return;
    }
    setIsNavigating(true);
    try {
      for (let i = 0; i < 6; i++) {
        const res = await getResearchStatus(researchId);
        if (res?.briefing_id) {
          navigate(`/briefings/${res.briefing_id}`);
          return;
        }
        await new Promise((r) => setTimeout(r, 800));
      }
    } catch (err) {
      console.error('Error resolving briefing:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  React.useEffect(() => {
    if (stage === 'completed' && targetBriefingId && (!activeSources || activeSources.length === 0)) {
      getBriefing(targetBriefingId)
        .then((b) => {
          const reportSources = b?.report?.sources || b?.sources || [];
          if (reportSources.length > 0) {
            setActiveSources(
              reportSources.map((s) => ({
                id: s.source_id || s.id,
                title: s.title,
                publisher: s.publisher,
                url: s.url,
                published_at: s.published_at,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [stage, targetBriefingId, activeSources]);

  return (
    <div className="page-container relative min-h-screen flex flex-col justify-between !pt-14">
      {/* Top Left Exit Link */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 font-mono text-[13px] text-[#665F75] hover:text-[#C21A12] transition-colors mb-4 no-underline select-none"
      >
        ← stop research
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-12 items-center my-auto">
        {/* Left Column: Stage, percentage, log, queries */}
        <div className="max-w-[580px]">
          <p className="font-mono-meta mb-1 uppercase tracking-wider">
            {meetingMeta.company} · {meetingMeta.meeting_type}
          </p>

          <StageIndicator
            stage={stage}
            progress={progress}
            message={latestMessage}
          />

          {/* Connection / Reconnecting Notice */}
          {status === 'reconnecting' && (
            <div className="flex items-center gap-2 text-sm text-[#D4A300] font-mono my-2 animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              <span>reconnecting to stream… recovering research state</span>
            </div>
          )}

          {/* Error / FailTest State with Retry */}
          {error && (
            <div className="bg-[#C21A12]/10 border border-[#C21A12]/30 rounded-xl p-4 my-4 animate-[reveal-up-anim_0.3s_ease-out]">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-[#C21A12] shrink-0 mt-0.5" />
                <div>
                  <b className="block text-sm font-semibold text-[#C21A12] font-sans">
                    Research Interrupted
                  </b>
                  <p className="text-xs text-[#1B1630] font-mono mt-1 mb-3">
                    {error}
                  </p>
                  <Button
                    variant="ghost"
                    onClick={reconnect}
                    className="text-xs py-1.5 px-3 bg-[#FAF3E8]"
                  >
                    Retry research
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Plain-text Mono Activity Log */}
          <ActivityLog events={events} />

          {/* Underlined Search Queries */}
          <QueryPills queries={queries} />

          {/* Completed State Button */}
          {stage === 'completed' && (
            <div className="pt-2 animate-[reveal-up-anim_0.5s_cubic-bezier(0.2,0.8,0.2,1)]">
              <Button
                onClick={handleOpenBriefing}
                variant="primary"
                disabled={isNavigating}
                className="py-3.5 px-7 text-[16px]"
              >
                {isNavigating
                  ? 'Finalizing briefing…'
                  : targetBriefingId
                  ? 'Open the briefing →'
                  : 'Preparing briefing…'}
              </Button>
            </div>
          )}
        </div>

        {/* Right Column: Research Constellation */}
        <div className="w-full">
          <Constellation
            mode="research"
            company={meetingMeta.company}
            meetingType={meetingMeta.meeting_type}
            meetingDate={meetingMeta.meeting_date || 'briefing in progress'}
            sources={activeSources}
            verifiedIds={verifiedIds}
            stage={stage}
            status={status}
          />
        </div>
      </div>

      <div className="text-xs font-mono text-[#665F75]/60 pt-6">
        live intelligence pipeline · Tavily search · Bifrost agent · 30-day temporal filter
      </div>
    </div>
  );
}
