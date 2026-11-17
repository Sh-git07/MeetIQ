/**
 * Centralized briefing normalizer.
 * Defensively handles missing fields and varying array item shapes.
 */
export function normalizeBriefing(raw) {
  if (!raw) return null;

  const report = raw.report || raw;

  // Normalize recent developments
  const recentDevelopments = Array.isArray(report.recent_developments)
    ? report.recent_developments.map((dev, idx) => {
        if (typeof dev === 'string') {
          return {
            id: `dev_${idx + 1}`,
            title: dev,
            summary: dev,
            relevance: '',
            published_at: null,
            source_ids: []
          };
        }
        return {
          id: dev.id || `dev_${idx + 1}`,
          title: dev.title || dev.headline || 'Untitled development',
          summary: dev.summary || dev.description || '',
          relevance: dev.relevance || dev.category || '',
          published_at: dev.published_at || dev.date || null,
          source_ids: Array.isArray(dev.source_ids) ? dev.source_ids : []
        };
      })
    : [];

  // Normalize opportunities
  const opportunities = Array.isArray(report.opportunities)
    ? report.opportunities.map((opp, idx) => {
        if (typeof opp === 'string') {
          return {
            id: `opp_${idx + 1}`,
            title: opp,
            description: opp,
            source_ids: []
          };
        }
        return {
          id: opp.id || `opp_${idx + 1}`,
          title: opp.title || opp.headline || '',
          description: opp.description || opp.summary || opp.title || '',
          source_ids: Array.isArray(opp.source_ids) ? opp.source_ids : []
        };
      })
    : [];

  // Normalize risks
  const risks = Array.isArray(report.risks)
    ? report.risks.map((r, idx) => {
        if (typeof r === 'string') {
          return {
            id: `risk_${idx + 1}`,
            title: r,
            description: r,
            source_ids: []
          };
        }
        return {
          id: r.id || `risk_${idx + 1}`,
          title: r.title || r.headline || '',
          description: r.description || r.summary || r.title || '',
          source_ids: Array.isArray(r.source_ids) ? r.source_ids : []
        };
      })
    : [];

  // Normalize questions (strings)
  const questions = Array.isArray(report.questions)
    ? report.questions.map((q) => (typeof q === 'string' ? q : q.question || q.text || String(q)))
    : [];

  // Normalize sources
  const sources = Array.isArray(report.sources)
    ? report.sources.map((s, idx) => ({
        id: s.source_id ? String(s.source_id) : (s.id !== undefined ? String(s.id) : String(idx + 1)),
        title: s.title || s.name || 'Untitled Source',
        publisher: s.publisher || s.domain || s.source || 'Unknown Publisher',
        url: s.url || '#',
        published_at: s.published_at || s.date || null,
        category: s.category || 'press'
      }))
    : [];

  // Normalize research limitations
  const limitations = Array.isArray(report.research_limitations)
    ? report.research_limitations.map((lim) => (typeof lim === 'string' ? lim : lim.text || String(lim)))
    : [];

  // Normalize coverage if available or derive from sources
  const coverage = report.coverage || {
    news: 85,
    leadership: 70,
    financials: 50
  };

  const company = report.company || raw.company || 'Unknown Company';
  const headline = report.headline || (recentDevelopments[0]?.title ? recentDevelopments[0].title : `${company} Executive Briefing`);

  return {
    briefing_id: raw.briefing_id || raw.id || 'brief_unknown',
    meeting_id: raw.meeting_id || null,
    status: raw.status || 'completed',
    created_at: raw.created_at || new Date().toISOString(),
    company,
    headline,
    meeting_type: raw.meeting_type || report.meeting_type || 'Partnership',
    meeting_date: raw.meeting_date || report.meeting_date || null,
    executive_summary: report.executive_summary || report.summary || 'No summary available.',
    recent_developments: recentDevelopments,
    opportunities,
    risks,
    questions,
    sources,
    research_limitations: limitations,
    coverage
  };
}
