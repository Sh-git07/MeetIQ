import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBriefing } from '../hooks/useBriefing';
import { useToast } from '../hooks/useToast';
import { CitationMarker } from '../components/briefing/CitationMarker';
import { SourceCard } from '../components/briefing/SourceCard';
import { CoveragePanel } from '../components/briefing/CoveragePanel';
import { LimitationsBox } from '../components/briefing/LimitationsBox';
import { BriefingSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { formatFreshness, formatMeetingTime } from '../utils/formatters';
import { Download, ArrowLeft } from 'lucide-react';

export function Briefing() {
  const { briefingId } = useParams();
  const { briefing, loading, error, downloadPdf, refetch } = useBriefing(briefingId);
  const { showToast } = useToast();

  const [activeSourceId, setActiveSourceId] = useState(null);
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState(null);

  const handleCopyQuestion = (question, index) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(question).catch(() => {});
    }
    setCopiedQuestionIdx(index);
    showToast('Question copied to clipboard');
    setTimeout(() => {
      setCopiedQuestionIdx(null);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="page-container">
        <BriefingSkeleton />
      </div>
    );
  }

  if (error || !briefing) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-3xl font-heading font-extrabold text-[#1B1630] mb-4">
          Briefing Not Found
        </h2>
        <p className="text-[#665F75] mb-6">
          {error || 'The requested executive briefing could not be retrieved.'}
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="primary" onClick={refetch}>
            Retry
          </Button>
          <Button to="/dashboard" variant="ghost">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const {
    company,
    meeting_type,
    meeting_date,
    status,
    executive_summary,
    recent_developments,
    opportunities,
    risks,
    questions,
    sources,
    research_limitations,
    coverage
  } = briefing;

  return (
    <div className="page-container">
      {/* Editorial Header */}
      <div className="flex justify-between items-end gap-6 flex-wrap mb-10 pb-6 border-b border-[rgba(27,22,48,0.15)] reveal-up" style={{ '--stagger': 0 }}>
        <div className="max-w-[850px]">
          <p className="font-mono-meta mb-2 lowercase">
            {company} · {meeting_type} · {formatMeetingTime(meeting_date)} · {status}
          </p>
          <h1 className="text-[clamp(36px,5vw,72px)] text-[#1B1630] font-heading font-extrabold tracking-tight leading-[0.98]">
            {briefing.headline || (recent_developments && recent_developments[0]?.title) || `${company} Executive Briefing`}
          </h1>
        </div>

        <div className="no-print shrink-0">
          <Button variant="ghost" onClick={downloadPdf} className="flex items-center gap-2">
            <Download size={16} />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Three Editorial Columns on Desktop (Stacked on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_0.8fr] gap-8 lg:gap-12">
        {/* Column 1: Summary, What Changed, Limitations */}
        <div className="reveal-up space-y-7" style={{ '--stagger': 1 }}>
          {/* Summary */}
          <section>
            <h3 className="font-heading font-extrabold text-[22px] text-[#1B1630] mb-2.5">
              Summary
            </h3>
            <p className="text-[#665F75] text-[15.5px] leading-relaxed m-0">
              {executive_summary}
              {sources && sources.length > 0 && sources.slice(0, 2).map((s) => (
                <CitationMarker
                  key={s.id}
                  sourceId={s.id}
                  activeSourceId={activeSourceId}
                  onHover={setActiveSourceId}
                />
              ))}
            </p>
          </section>

          {/* What changed */}
          <section>
            <h3 className="font-heading font-extrabold text-[22px] text-[#1B1630] mb-2.5">
              What changed
            </h3>
            <div className="divide-y divide-[rgba(27,22,48,0.15)]">
              {recent_developments.map((dev) => (
                <div key={dev.id} className="py-3">
                  <div className="font-mono text-[12px] text-[#665F75] mb-1">
                    {formatFreshness(dev.published_at)} · {dev.relevance || 'development'}
                  </div>
                  <p className="text-[15px] text-[#1B1630] m-0 leading-snug">
                    <b className="font-semibold">{dev.title}.</b> {dev.summary}
                    {dev.source_ids.map((sid) => (
                      <CitationMarker
                        key={sid}
                        sourceId={sid}
                        activeSourceId={activeSourceId}
                        onHover={setActiveSourceId}
                      />
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Research limitations (Always visible amber note) */}
          <LimitationsBox limitations={research_limitations} />
        </div>

        {/* Column 2: Where you align, Watch out, Ask them */}
        <div className="reveal-up space-y-7" style={{ '--stagger': 2 }}>
          {/* Where you align */}
          <section>
            <h3 className="font-heading font-extrabold text-[22px] text-[#1B1630] mb-2.5">
              Where you align
            </h3>
            <div className="divide-y divide-[rgba(27,22,48,0.15)]">
              {opportunities.map((opp) => (
                <div key={opp.id} className="py-3">
                  <p className="text-[15px] text-[#1B1630] m-0 leading-snug">
                    <b className="font-semibold block mb-0.5">{opp.title}</b>
                    {opp.description}
                    {opp.source_ids.map((sid) => (
                      <CitationMarker
                        key={sid}
                        sourceId={sid}
                        activeSourceId={activeSourceId}
                        onHover={setActiveSourceId}
                      />
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Watch out (Risks) */}
          <section>
            <h3 className="font-heading font-extrabold text-[22px] text-[#1B1630] mb-2.5">
              Watch out
            </h3>
            <div className="divide-y divide-[rgba(27,22,48,0.15)]">
              {risks.map((risk) => (
                <div key={risk.id} className="py-3">
                  <p className="text-[15px] text-[#1B1630] m-0 leading-snug">
                    <b className="font-semibold block mb-0.5">{risk.title}</b>
                    {risk.description}
                    {risk.source_ids.map((sid) => (
                      <CitationMarker
                        key={sid}
                        sourceId={sid}
                        activeSourceId={activeSourceId}
                        onHover={setActiveSourceId}
                      />
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Ask them (Questions with copy button) */}
          <section>
            <h3 className="font-heading font-extrabold text-[22px] text-[#1B1630] mb-2.5">
              Ask them
            </h3>
            <div className="divide-y divide-[rgba(27,22,48,0.15)]">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-start justify-between gap-3 text-[14.5px] text-[#1B1630] leading-snug"
                >
                  <span>{q}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyQuestion(q, idx)}
                    className="font-mono text-[12px] text-[#E60B09] hover:underline cursor-pointer shrink-0 py-0.5 px-1 font-medium select-none"
                  >
                    {copiedQuestionIdx === idx ? 'copied' : 'copy'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Column 3: Sources Cards & Coverage */}
        <div className="reveal-up" style={{ '--stagger': 3 }}>
          <h3 className="font-heading font-extrabold text-[22px] text-[#1B1630] mb-3">
            Sources
          </h3>

          <div className="space-y-2">
            {sources.map((s) => (
              <SourceCard
                key={s.id}
                source={s}
                isActive={String(activeSourceId) === String(s.id)}
                onHover={setActiveSourceId}
              />
            ))}
          </div>

          {/* Coverage Panel (No invented confidence score) */}
          <CoveragePanel coverage={coverage} />
        </div>
      </div>
    </div>
  );
}
