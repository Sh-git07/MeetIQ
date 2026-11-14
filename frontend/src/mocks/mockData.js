/**
 * Realistic Mock Data for MeetIQ
 * All dates are calculated relative to Date.now() so freshness labels stay evergreen.
 */

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const mockMeetings = [
  {
    meeting_id: 'meet_001',
    company: 'Microsoft',
    website: 'https://microsoft.com',
    meeting_date: new Date(now + day).toISOString(),
    meeting_type: 'Partnership',
    objective: 'Explore a strategic partnership around agent tools and enterprise developer ecosystem',
    additional_context: 'Focus on recent AI platform openings, revenue share model and developer tiers',
    status: 'completed',
    created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    briefing_id: 'brief_001'
  },
  {
    meeting_id: 'meet_002',
    company: 'Stripe',
    website: 'https://stripe.com',
    meeting_date: new Date(now + 2 * day).toISOString(),
    meeting_type: 'Sales',
    objective: 'Pitch executive intelligence integrations for high-volume enterprise billing teams',
    additional_context: 'Look for buying signals, budget changes, new product lines and VP of billing hires',
    status: 'pending',
    created_at: new Date(now - day).toISOString(),
    briefing_id: null
  },
  {
    meeting_id: 'meet_003',
    company: 'Nvidia',
    website: 'https://nvidia.com',
    meeting_date: new Date(now + 4 * day).toISOString(),
    meeting_type: 'Investor meeting',
    objective: 'Assess data center CAPEX guidance, custom silicon roadmap and inference software margins',
    additional_context: 'Check recent earnings call transcripts and partner hardware announcements',
    status: 'pending',
    created_at: new Date(now - 3 * day).toISOString(),
    briefing_id: null
  },
  {
    meeting_id: 'meet_004',
    company: 'Snowflake',
    website: 'https://snowflake.com',
    meeting_date: new Date(now - day).toISOString(),
    meeting_type: 'Client meeting',
    objective: 'Review quarterly consumption benchmarks, Cortex AI adoption and telemetry pipelines',
    additional_context: 'Focus on enterprise customer retention and warehouse optimization',
    status: 'completed',
    created_at: new Date(now - 2 * day).toISOString(),
    briefing_id: 'brief_002'
  },
  {
    meeting_id: 'meet_005',
    company: 'Salesforce',
    website: 'https://salesforce.com',
    meeting_date: new Date(now + 5 * day).toISOString(),
    meeting_type: 'Business development',
    objective: 'Explore distribution for Agentforce apps and co-selling opportunities in EMEA',
    additional_context: 'Verify partner margin structures and AppExchange certified tiers',
    status: 'failed',
    created_at: new Date(now - 3 * day).toISOString(),
    briefing_id: null
  },
  {
    meeting_id: 'meet_006',
    company: 'Databricks',
    website: 'https://databricks.com',
    meeting_date: new Date(now + 6 * day).toISOString(),
    meeting_type: 'Partnership',
    objective: 'Evaluate integration with Unity Catalog and Lakehouse AI governance framework',
    additional_context: 'Recent acquisitions and open-source models',
    status: 'completed',
    created_at: new Date(now - 4 * day).toISOString(),
    briefing_id: 'brief_003'
  },
  {
    meeting_id: 'meet_007',
    company: 'CrowdStrike',
    website: 'https://crowdstrike.com',
    meeting_date: new Date(now + 7 * day).toISOString(),
    meeting_type: 'Client meeting',
    objective: 'Discuss incident response SLAs, Falcon platform agent telemetry and multi-cloud coverage',
    additional_context: 'Post-outage resilience commitments and executive hires',
    status: 'completed',
    created_at: new Date(now - 5 * day).toISOString(),
    briefing_id: 'brief_004'
  },
  {
    meeting_id: 'meet_008',
    company: 'Anthropic',
    website: 'https://anthropic.com',
    meeting_date: new Date(now + 8 * day).toISOString(),
    meeting_type: 'Partnership',
    objective: 'Discuss API rate limit tiers, dedicated capacity reservations and Claude 3.7 enterprise pilot',
    additional_context: 'Compute partnerships with AWS and Google Cloud',
    status: 'completed',
    created_at: new Date(now - 6 * day).toISOString(),
    briefing_id: 'brief_005'
  },
  {
    meeting_id: 'meet_009',
    company: 'Figma',
    website: 'https://figma.com',
    meeting_date: new Date(now + 10 * day).toISOString(),
    meeting_type: 'Sales',
    objective: 'Present automated research tooling for product design leads and UX research teams',
    additional_context: 'Recent Dev Mode upgrades and AI prototyping tools',
    status: 'in_progress',
    created_at: new Date(now - 30 * 60 * 1000).toISOString(),
    briefing_id: null
  }
];

export const mockBriefings = {
  brief_001: {
    briefing_id: 'brief_001',
    meeting_id: 'meet_001',
    status: 'completed',
    created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    company: 'Microsoft',
    meeting_type: 'Partnership',
    meeting_date: new Date(now + day).toISOString(),
    report: {
      company: 'Microsoft',
      executive_summary:
        'Microsoft is aggressively opening its AI platform to partners. Two major product announcements and an executive leadership change in the past 30 days point to a shift toward an open agent ecosystem. This significantly strengthens your pitch for third-party developer integrations, though an unresolved question remains regarding how revenue share is partitioned across cloud consumption versus licensing.',
      recent_developments: [
        {
          id: 'dev_1',
          title: 'New agent tools open to third-party developers',
          summary:
            'Microsoft unveiled new Copilot Studio extension APIs and autonomous agent runtimes, drastically lowering the integration friction and onboarding overhead for external enterprise tools.',
          relevance: 'product',
          published_at: new Date(now - 4 * day).toISOString(),
          source_ids: ['1', '4']
        },
        {
          id: 'dev_2',
          title: 'New Head of Partner Ecosystem named',
          summary:
            'A former cloud executive with an aggressive developer-first track record took over partner strategy, signaling a clean break from legacy multi-tier reseller programs.',
          relevance: 'leadership',
          published_at: new Date(now - 21 * day).toISOString(),
          source_ids: ['2', '6']
        },
        {
          id: 'dev_3',
          title: 'Reported restructuring of partner revenue share',
          summary:
            'Leaked partner memo suggests a tiered rev-share model shifting from fixed 80/20 to variable performance tiers tied to Azure usage. One source reported it, but it remains unconfirmed by corporate PR.',
          relevance: 'pricing',
          published_at: null, // undated intentional test case
          source_ids: ['3']
        },
        {
          id: 'dev_4',
          title: 'Quarterly enterprise cloud acceleration reported',
          summary:
            'Recent SEC 10-Q filing notes a 29% YoY jump in intelligent cloud revenue, driven heavily by AI services and cross-selling within existing enterprise agreements.',
          relevance: 'financial',
          published_at: new Date(now - 12 * day).toISOString(),
          source_ids: ['5', '7']
        }
      ],
      opportunities: [
        {
          id: 'opp_1',
          title: 'Native Agent Runtime integration',
          description:
            'Their revamped developer portal now directly supports third-party tool manifests without requiring separate Azure Marketplace certification.',
          source_ids: ['1']
        },
        {
          id: 'opp_2',
          title: 'Receptive new leadership',
          description:
            'The newly appointed ecosystem lead has explicitly signaled a mandate to announce 5 flagship enterprise partnerships before end of quarter.',
          source_ids: ['2']
        },
        {
          id: 'opp_3',
          title: 'Joint GTM co-selling incentives',
          description:
            'Field sellers now receive quota retirement credit for qualifying partner integrations that drive Azure token consumption.',
          source_ids: ['5']
        }
      ],
      risks: [
        {
          id: 'risk_1',
          title: 'Revenue share uncertainty',
          description:
            'Conflicting reports exist regarding whether the new tiering applies retroactively to existing agreements or only to new AI catalog listings.',
          source_ids: ['3']
        },
        {
          id: 'risk_2',
          title: 'Native feature overlap',
          description:
            'The Copilot Studio roadmap may introduce first-party pre-meeting summarization within 6 months, potentially competing with standalone agents.',
          source_ids: ['4']
        }
      ],
      questions: [
        'What does the new partner revenue share structure look like in practice for API-first agent products?',
        'Who owns tier-1 enterprise support and SLA escalation after joint deployment?',
        'Which partner tier would our solution start in under the revised ecosystem hierarchy?',
        'How does your field sales team get credited for third-party agent activations?',
        'What does measurable success look like in the first 90 days of an integration rollout?'
      ],
      sources: [
        {
          id: '1',
          title: 'Agent toolkit opens to third-party developers across Copilot ecosystem',
          publisher: 'Microsoft Official Blog',
          url: 'https://blogs.microsoft.com/ai/agent-ecosystem-2026',
          published_at: new Date(now - 4 * day).toISOString(),
          category: 'product'
        },
        {
          id: '2',
          title: 'Microsoft appoints veteran cloud strategist to lead global partner ecosystem',
          publisher: 'Reuters',
          url: 'https://reuters.com/technology/microsoft-names-partner-lead-2026',
          published_at: new Date(now - 21 * day).toISOString(),
          category: 'people'
        },
        {
          id: '3',
          title: 'Internal memo hints at overhauled partner margin schedule for AI catalog',
          publisher: 'Tech Industry Wire',
          url: 'https://techindustrywire.example.com/msft-partner-margins',
          published_at: null, // intentional missing date
          category: 'financial'
        },
        {
          id: '4',
          title: 'Inside Microsoft Copilot Studio roadmap and developer primitives',
          publisher: 'The Verge',
          url: 'https://theverge.com/tech/microsoft-copilot-studio-deep-dive',
          published_at: new Date(now - 15 * day).toISOString(),
          category: 'product'
        },
        {
          id: '5',
          title: 'Form 10-Q Quarterly Report: Intelligent Cloud Segment Performance',
          publisher: 'SEC EDGAR',
          url: 'https://sec.gov/edgar/data/789019/msft-10q',
          published_at: new Date(now - 12 * day).toISOString(),
          category: 'financial'
        },
        {
          id: '6',
          title: 'Partner Strategy & Alliances Executive Profile',
          publisher: 'LinkedIn Executive Insights',
          url: 'https://linkedin.com/pulse/microsoft-partnership-shift',
          published_at: new Date(now - 6 * day).toISOString(),
          category: 'people'
        },
        {
          id: '7',
          title: 'Enterprise AI Cloud Spend Analysis & Hyperscaler Rankings',
          publisher: 'Bloomberg Technology',
          url: 'https://bloomberg.com/news/articles/2026-azure-cloud-growth',
          published_at: new Date(now - 9 * day).toISOString(),
          category: 'financial'
        }
      ],
      research_limitations: [
        'Two industry reports conflict on when the revised revenue share schedule takes effect. Treat commercial terms as unconfirmed until discussed in the room.',
        'Technical details on the Copilot Studio extension sandbox are derived from preview developer documentation that remains subject to change before general availability.',
        'No direct executive statements on pricing protections for third-party agents were identified in the 30-day research window.'
      ],
      coverage: {
        news: 92,
        leadership: 78,
        financials: 65
      }
    }
  },

  brief_002: {
    briefing_id: 'brief_002',
    meeting_id: 'meet_004',
    status: 'completed',
    created_at: new Date(now - 2 * day).toISOString(),
    company: 'Snowflake',
    meeting_type: 'Client meeting',
    meeting_date: new Date(now - day).toISOString(),
    report: {
      company: 'Snowflake',
      executive_summary:
        'Snowflake has accelerated its enterprise Cortex AI rollout while tightening data governance guarantees. Recent customer testimonials highlight workload migration from legacy data warehouses to Iceberg tables, creating an opening to pitch optimization tools.',
      recent_developments: [
        {
          id: 'dev_1',
          title: 'Apache Iceberg table support general availability',
          summary: 'Snowflake customers can now query external data lakes with native governance, lowering migration lock-in barriers.',
          relevance: 'product',
          published_at: new Date(now - 10 * day).toISOString(),
          source_ids: ['1', '2']
        },
        {
          id: 'dev_2',
          title: 'Enterprise Cortex AI adoption surges in FQ3',
          summary: 'Over 3,400 enterprise accounts actively run generative AI workloads on Snowflake managed clusters.',
          relevance: 'financial',
          published_at: new Date(now - 18 * day).toISOString(),
          source_ids: ['3']
        }
      ],
      opportunities: [
        {
          id: 'opp_1',
          title: 'Iceberg integration synergy',
          description: 'Help enterprise clients monitor performance tradeoffs between internal and external tables.',
          source_ids: ['1']
        }
      ],
      risks: [
        {
          id: 'risk_1',
          title: 'Margin pressure on AI queries',
          description: 'Customers are monitoring credit consumption closely for generative workflows.',
          source_ids: ['3']
        }
      ],
      questions: [
        'How are your largest accounts managing compute credit volatility with Cortex models?',
        'What governance guardrails are required for third-party telemetry collectors?'
      ],
      sources: [
        {
          id: '1',
          title: 'Iceberg Tables GA Release Notes',
          publisher: 'Snowflake Docs',
          url: 'https://docs.snowflake.com/en/release-notes/iceberg',
          published_at: new Date(now - 10 * day).toISOString(),
          category: 'product'
        },
        {
          id: '2',
          title: 'Data Lakehouse Architecture Shifts',
          publisher: 'InfoWorld',
          url: 'https://infoworld.com/article/snowflake-iceberg',
          published_at: new Date(now - 14 * day).toISOString(),
          category: 'press'
        },
        {
          id: '3',
          title: 'Quarterly Earnings Call Transcript',
          publisher: 'Seeking Alpha',
          url: 'https://seekingalpha.com/article/snowflake-q3',
          published_at: new Date(now - 18 * day).toISOString(),
          category: 'financial'
        }
      ],
      research_limitations: [
        'Detailed tier-by-tier credit consumption numbers are NDA-restricted and not available from public sources.'
      ],
      coverage: {
        news: 88,
        leadership: 60,
        financials: 82
      }
    }
  },

  brief_003: {
    briefing_id: 'brief_003',
    meeting_id: 'meet_006',
    status: 'completed',
    created_at: new Date(now - 4 * day).toISOString(),
    company: 'Databricks',
    meeting_type: 'Partnership',
    meeting_date: new Date(now + 6 * day).toISOString(),
    report: {
      company: 'Databricks',
      executive_summary:
        'Databricks continues its unification around Unity Catalog while aggressively positioning DBRX and open-source models against proprietary hyperscalers. An integration that aligns with their open-lakehouse thesis has high strategic alignment.',
      recent_developments: [
        {
          id: 'dev_1',
          title: 'Open sourcing of Unity Catalog completed',
          summary: 'Full governance specification is now governed by an open foundation.',
          relevance: 'product',
          published_at: new Date(now - 16 * day).toISOString(),
          source_ids: ['1']
        }
      ],
      opportunities: [
        {
          id: 'opp_1',
          title: 'Unity Catalog native plugin certification',
          description: 'Leverage their newly launched partner ecosystem directory for catalog extensions.',
          source_ids: ['1']
        }
      ],
      risks: [
        {
          id: 'risk_1',
          title: 'Co-opetition with internal engineering teams',
          description: 'Databricks Labs regularly develops internal open-source tooling in adjacent spaces.',
          source_ids: ['1']
        }
      ],
      questions: [
        'What are the primary criteria for featured showcase status in Unity Catalog documentation?',
        'How does Databricks evaluate telemetry partners that straddle both AWS and Azure instances?'
      ],
      sources: [
        {
          id: '1',
          title: 'Unity Catalog Open Source Milestone',
          publisher: 'Databricks Blog',
          url: 'https://databricks.com/blog/unity-catalog-open',
          published_at: new Date(now - 16 * day).toISOString(),
          category: 'product'
        }
      ],
      research_limitations: [
        'Private valuation metrics and enterprise pipeline metrics remain estimates derived from secondary market reports.'
      ],
      coverage: {
        news: 80,
        leadership: 65,
        financials: 40
      }
    }
  }
};
