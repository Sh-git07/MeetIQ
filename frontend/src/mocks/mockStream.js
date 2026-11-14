/**
 * Mock SSE Stream Emitter for MeetIQ
 * Implements the exact stage progression, iterative research,
 * optional data for constellation nodes, and the FailTest failure scenario.
 */

export function createMockResearchStream(researchId, meetingMeta, onEvent, onError) {
  const company = meetingMeta?.company || 'Microsoft';
  const meetingType = meetingMeta?.meeting_type || 'Partnership';
  const isFailTest = company.toLowerCase() === 'failtest';

  let timerIds = [];
  let isCancelled = false;

  const sampleSources = [
    { id: '1', title: `${company} Official Blog`, publisher: `${company} Blog`, published_at: '4d ago', url: 'https://example.com/blog', category: 'product' },
    { id: '2', title: 'Reuters Technology News', publisher: 'Reuters', published_at: '21d ago', url: 'https://reuters.com', category: 'people' },
    { id: '3', title: 'Bloomberg Intelligence', publisher: 'Bloomberg', published_at: '9d ago', url: 'https://bloomberg.com', category: 'financial' },
    { id: '4', title: 'SEC 10-Q Filing', publisher: 'SEC EDGAR', published_at: '12d ago', url: 'https://sec.gov', category: 'financial' },
    { id: '5', title: 'TechCrunch Enterprise', publisher: 'TechCrunch', published_at: '2d ago', url: 'https://techcrunch.com', category: 'product' },
    { id: '6', title: 'Executive Announcements', publisher: 'LinkedIn', published_at: '6d ago', url: 'https://linkedin.com', category: 'people' },
    { id: '7', title: 'Corporate Press Release', publisher: 'PR Newswire', published_at: '4d ago', url: 'https://prnewswire.com', category: 'press' },
    { id: '8', title: 'Industry Deep Dive', publisher: 'The Verge', published_at: '15d ago', url: 'https://theverge.com', category: 'press' },
    { id: '9', title: 'Quarterly Earnings Transcript', publisher: 'Earnings Call', published_at: '27d ago', url: 'https://seekingalpha.com', category: 'financial' },
    { id: '10', title: 'Developer Portal Update', publisher: 'Partner Portal', published_at: '8d ago', url: 'https://example.com/partners', category: 'product' }
  ];

  if (isFailTest) {
    // Failure script
    const failureTimeline = [
      {
        delay: 500,
        event: {
          stage: 'planning',
          message: 'Planning research strategy',
          progress: 10,
          data: {
            queries: [`"${company.toLowerCase()} recent news"`]
          }
        }
      },
      {
        delay: 2000,
        event: {
          stage: 'searching',
          message: 'Querying external news wire…',
          progress: 35,
          data: {
            queries: [`"${company.toLowerCase()} leadership announcements"`]
          }
        }
      },
      {
        delay: 3800,
        isError: true,
        event: {
          stage: 'failed',
          message: 'External news search rate limit exceeded (Simulated FailTest).',
          progress: 35
        }
      }
    ];

    failureTimeline.forEach(({ delay, event, isError }) => {
      const tid = setTimeout(() => {
        if (isCancelled) return;
        if (isError) {
          onError(new Error(event.message));
          onEvent(event);
        } else {
          onEvent(event);
        }
      }, delay);
      timerIds.push(tid);
    });

    return () => {
      isCancelled = true;
      timerIds.forEach(clearTimeout);
    };
  }

  // Normal successful timeline
  const timeline = [
    {
      delay: 400,
      event: {
        stage: 'planning',
        message: 'Planning around your goal',
        progress: 8,
        data: {
          queries: [
            `"${company.toLowerCase()} ${meetingType.toLowerCase()} news"`,
            `"${company.toLowerCase()} leadership changes"`,
            `"${company.toLowerCase()} 30-day product launches"`
          ]
        }
      }
    },
    {
      delay: 2000,
      event: {
        stage: 'searching',
        message: 'Searching recent developments',
        progress: 30,
        data: {
          sources: sampleSources.slice(0, 4)
        }
      }
    },
    {
      delay: 3800,
      event: {
        stage: 'searching',
        message: 'Searching again: evidence is thin on commercial terms',
        progress: 52,
        data: {
          queries: [`"${company.toLowerCase()} partner revenue share and margin schedule"`],
          sources: sampleSources.slice(0, 8)
        }
      }
    },
    {
      delay: 5600,
      event: {
        stage: 'searching',
        message: 'Searching filings and earnings calls',
        progress: 68,
        data: {
          sources: sampleSources.slice(0, 10)
        }
      }
    },
    {
      delay: 7400,
      event: {
        stage: 'verifying',
        message: 'Verifying 12 claims against sources',
        progress: 84,
        data: {
          verification: {
            verified_ids: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
          }
        }
      }
    },
    {
      delay: 9200,
      event: {
        stage: 'generating',
        message: 'Writing your executive briefing',
        progress: 95
      }
    },
    {
      delay: 11000,
      event: {
        stage: 'completed',
        message: 'Briefing ready',
        progress: 100,
        data: {
          briefing_id: 'brief_001'
        }
      }
    }
  ];

  timeline.forEach(({ delay, event }) => {
    const tid = setTimeout(() => {
      if (isCancelled) return;
      onEvent(event);
    }, delay);
    timerIds.push(tid);
  });

  return () => {
    isCancelled = true;
    timerIds.forEach(clearTimeout);
  };
}
