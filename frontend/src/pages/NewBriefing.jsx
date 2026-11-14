import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeetings } from '../hooks/useMeetings';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { getTomorrowDefaultISO } from '../utils/formatters';

const MEETING_TYPE_HINTS = {
  Partnership: "I'll look for product launches, leadership moves and signs of strategic fit.",
  Sales: "I'll look for buying signals, budget news, hires and pain points.",
  'Investor meeting': "I'll look for funding, financials, growth metrics and risks.",
  'Client meeting': "I'll look for recent wins, org changes and priorities.",
  'Business development': "I'll look for expansion, new markets and partner activity.",
  Other: "I'll build the research plan directly from your objective."
};

const MEETING_TYPES = [
  'Partnership',
  'Sales',
  'Investor meeting',
  'Client meeting',
  'Business development',
  'Other'
];

export function NewBriefing() {
  const navigate = useNavigate();
  const { scheduleMeetingAndResearch } = useMeetings();

  const [company, setCompany] = useState('Microsoft');
  const [website, setWebsite] = useState('');
  const [meetingDate, setMeetingDate] = useState(getTomorrowDefaultISO());
  const [meetingType, setMeetingType] = useState('Partnership');
  const [objective, setObjective] = useState('explore a strategic partnership');
  const [additionalContext, setAdditionalContext] = useState('');

  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const newErrors = {};

    // 1. Validate company
    if (!company.trim()) {
      newErrors.company = true;
      setErrorMessage('Add a company name.');
    }

    // 2. Validate website if provided
    if (website.trim() && !/^https?:\/\/\S+\.\S+/.test(website.trim())) {
      newErrors.website = true;
      if (!newErrors.company) setErrorMessage('Website should start with https://');
    }

    // 3. Validate date/time
    if (!meetingDate || new Date(meetingDate) < new Date()) {
      newErrors.meetingDate = true;
      if (!errorMessage && Object.keys(newErrors).length === 1) {
        setErrorMessage('Pick a meeting time in the future.');
      }
    }

    // 4. Validate objective
    if (!objective.trim() || objective.trim().length < 10) {
      newErrors.objective = true;
      if (!errorMessage && Object.keys(newErrors).length <= 2) {
        setErrorMessage('Say a bit more about your goal (10+ characters).');
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const meetingPayload = {
        company: company.trim(),
        website: website.trim() || undefined,
        meeting_date: new Date(meetingDate).toISOString(),
        meeting_type: meetingType,
        objective: objective.trim(),
        additional_context: additionalContext.trim() || undefined
      };

      const result = await scheduleMeetingAndResearch(meetingPayload);
      
      // Store state in navigation for immediate access on /research/:researchId
      navigate(`/research/${result.researchId}`, {
        state: {
          company: company.trim(),
          meeting_type: meetingType,
          meeting_date: meetingDate,
          objective: objective.trim()
        }
      });
    } catch (err) {
      setErrorMessage(err?.message || 'Failed to start research task. Please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <p className="font-mono-meta mb-2 reveal-up" style={{ '--stagger': 0 }}>
        new briefing
      </p>

      <form onSubmit={handleSubmit} noValidate className="max-w-[1040px]">
        {/* Large Sentence Form */}
        <p
          className="font-heading font-extrabold text-[clamp(28px,4.2vw,56px)] tracking-tight leading-[1.3] text-[#1B1630] my-4 reveal-up"
          style={{ '--stagger': 1 }}
        >
          I’m meeting{' '}
          <Input
            id="fco"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="a company"
            autoSize
            error={errors.company}
            aria-label="Company name"
            required
          />{' '}
          <Input
            id="fwb"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="(website, optional)"
            autoSize
            error={errors.website}
            aria-label="Company website"
          />{' '}
          on{' '}
          <Input
            id="fdt"
            type="datetime-local"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            error={errors.meetingDate}
            aria-label="Meeting date and time"
            className="!text-[clamp(20px,2.8vw,36px)] font-mono text-[#E60B09]"
            required
          />{' '}
          for a{' '}
          <Select
            id="fty"
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            options={MEETING_TYPES}
            aria-label="Meeting type"
          />{' '}
          meeting. I want to{' '}
          <Input
            id="fob"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="explore a strategic partnership"
            autoSize
            error={errors.objective}
            aria-label="Meeting objective"
            required
          />
          .
        </p>

        {/* Additional Context Mono Field */}
        <p
          className="font-mono text-[14px] text-[#665F75] my-4 reveal-up"
          style={{ '--stagger': 2 }}
        >
          anything else worth knowing?{' '}
          <input
            id="fcx"
            type="text"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="e.g. focus on AI products and dev platform"
            aria-label="Additional context"
            className="font-mono text-[14px] text-[#1B1630] bg-transparent border-0 border-b border-[rgba(27,22,48,0.2)] focus:border-[#E60B09] px-2 py-0.5 outline-none w-full sm:w-[380px] transition-colors"
          />
        </p>

        {/* Dynamic Hint that fades with type */}
        <p
          key={meetingType}
          className="text-[#665F75] text-[15px] max-w-[34em] min-h-[46px] my-3 animate-[reveal-up-anim_0.3s_ease-out] reveal-up"
          style={{ '--stagger': 3 }}
        >
          {MEETING_TYPE_HINTS[meetingType]}
        </p>

        {/* Error Alert Box */}
        {errorMessage && (
          <p
            id="er"
            role="alert"
            className="text-[#C21A12] font-medium text-[15px] my-2 min-h-[24px]"
          >
            {errorMessage}
          </p>
        )}

        {/* Action Buttons */}
        <div
          className="flex items-center gap-4 mt-8 reveal-up"
          style={{ '--stagger': 4 }}
        >
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="min-w-[180px]"
          >
            {isSubmitting ? 'Creating meeting…' : 'Start research →'}
          </Button>

          <Button
            to="/dashboard"
            variant="ghost"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
