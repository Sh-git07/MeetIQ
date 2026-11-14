import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMeetings } from '../hooks/useMeetings';
import { useToast } from '../hooks/useToast';
import { downloadBriefingPdf } from '../services/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDateFull } from '../utils/formatters';
import { Search, Download, ArrowUpDown } from 'lucide-react';

export function History() {
  const { meetings, loading, error, refetch } = useMeetings();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  const handleDownloadPdf = async (e, meetingId) => {
    e.stopPropagation();
    try {
      const res = await downloadBriefingPdf(meetingId);
      if (res?.mock) {
        showToast('PDF export works once the backend is connected');
      } else {
        showToast('PDF downloaded successfully');
      }
    } catch (err) {
      showToast('Failed to download PDF briefing');
    }
  };

  const filteredMeetings = useMemo(() => {
    return meetings
      .filter((m) => {
        const matchesSearch =
          m.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.objective.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' ? true : m.status === statusFilter;
        const matchesType =
          typeFilter === 'all' ? true : m.meeting_type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.meeting_date).getTime();
        const dateB = new Date(b.created_at || b.meeting_date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [meetings, searchTerm, statusFilter, typeFilter, sortOrder]);

  return (
    <div className="page-container">
      <p className="font-mono-meta mb-2 reveal-up" style={{ '--stagger': 0 }}>
        research history
      </p>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 reveal-up" style={{ '--stagger': 1 }}>
        <h2 className="text-[#1B1630] font-heading font-extrabold tracking-tight leading-[0.94]">
          Past Briefings
        </h2>
        <Button to="/new" variant="primary" className="py-2.5 px-5 text-sm">
          + New briefing
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 py-4 border-b border-[rgba(27,22,48,0.15)] mb-6 reveal-up" style={{ '--stagger': 2 }}>
        {/* Underlined Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={16} className="text-[#665F75]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company or objective…"
            className="w-full bg-transparent border-0 border-b border-[rgba(27,22,48,0.2)] focus:border-[#E60B09] font-mono text-[13.5px] py-1 text-[#1B1630] outline-none placeholder:text-[#665F75]/60 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#665F75]">
          <span>status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-0 border-b border-[rgba(27,22,48,0.2)] py-1 font-mono text-xs text-[#1B1630] outline-none cursor-pointer"
          >
            <option value="all">all</option>
            <option value="completed">completed</option>
            <option value="in_progress">in progress</option>
            <option value="failed">failed</option>
            <option value="pending">pending</option>
          </select>
        </div>

        {/* Meeting Type Filter */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#665F75]">
          <span>type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent border-0 border-b border-[rgba(27,22,48,0.2)] py-1 font-mono text-xs text-[#1B1630] outline-none cursor-pointer"
          >
            <option value="all">all types</option>
            <option value="Partnership">Partnership</option>
            <option value="Sales">Sales</option>
            <option value="Investor meeting">Investor meeting</option>
            <option value="Client meeting">Client meeting</option>
            <option value="Business development">Business development</option>
          </select>
        </div>

        {/* Sort Toggle */}
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 font-mono text-xs text-[#665F75] hover:text-[#1B1630] transition-colors py-1 px-2 cursor-pointer"
        >
          <ArrowUpDown size={13} />
          <span>{sortOrder === 'desc' ? 'newest first' : 'oldest first'}</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4 py-6">
          <Skeleton height="50px" />
          <Skeleton height="50px" />
          <Skeleton height="50px" />
          <Skeleton height="50px" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-[#C21A12]/10 border border-[#C21A12]/30 rounded-xl my-6 flex items-center justify-between">
          <p className="text-[#C21A12] text-sm font-medium">{error}</p>
          <Button variant="ghost" onClick={refetch} className="text-xs py-1 px-3">
            Retry
          </Button>
        </div>
      )}

      {/* Empty State when no meetings exist */}
      {!loading && !error && meetings.length === 0 && (
        <EmptyState
          title="No research history"
          description="You haven't conducted any executive briefings yet. Start your first research task."
          actionLabel="Prepare for a meeting →"
          actionTo="/new"
        />
      )}

      {/* No results match search/filter */}
      {!loading && !error && meetings.length > 0 && filteredMeetings.length === 0 && (
        <EmptyState
          title="No matches found"
          description="Try adjusting your keyword search or resetting active filters."
          actionLabel="Reset filters"
          onAction={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setTypeFilter('all');
          }}
        />
      )}

      {/* Ruled List (No Cards) */}
      {!loading && !error && filteredMeetings.length > 0 && (
        <div className="divide-y divide-[rgba(27,22,48,0.15)] reveal-up" style={{ '--stagger': 3 }}>
          {filteredMeetings.map((m) => {
            const briefingId = m.briefing_id || 'brief_001';
            const targetUrl =
              m.status === 'completed'
                ? `/briefings/${briefingId}`
                : `/research/research_${m.meeting_id.replace('meet_', '')}`;

            return (
              <div
                key={m.meeting_id}
                className="group py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:pl-2.5 transition-all duration-300 relative"
              >
                {/* Left: Company & Objective */}
                <div className="max-w-xl">
                  <div className="flex items-center gap-3">
                    <Link
                      to={targetUrl}
                      className="font-heading font-extrabold text-[19px] text-[#1B1630] hover:text-[#E60B09] transition-colors no-underline"
                    >
                      {m.company}
                    </Link>
                    <span className="font-mono text-xs text-[#665F75]">
                      · {m.meeting_type}
                    </span>
                  </div>
                  <p className="text-sm text-[#665F75] line-clamp-1 mt-0.5 m-0 font-sans">
                    {m.objective}
                  </p>
                </div>

                {/* Right: Date, Status, Actions */}
                <div className="flex items-center gap-6 shrink-0 font-mono text-xs">
                  <span className="text-[#665F75]">
                    {formatDateFull(m.created_at || m.meeting_date)}
                  </span>

                  <Badge status={m.status} />

                  <div className="flex items-center gap-3">
                    <Link
                      to={targetUrl}
                      className="text-[#E60B09] hover:underline font-medium text-[12.5px] select-none"
                    >
                      {m.status === 'completed' ? 'Open report →' : 'Resume →'}
                    </Link>

                    {m.status === 'completed' && (
                      <button
                        type="button"
                        onClick={(e) => handleDownloadPdf(e, briefingId)}
                        title="Download PDF briefing"
                        className="p-1 text-[#665F75] hover:text-[#E60B09] transition-colors"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Hover Sweep Underline */}
                <span
                  className="absolute left-0 bottom-[-1px] h-[2px] w-0 transition-all duration-500 group-hover:w-full"
                  style={{ background: 'var(--g)' }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
