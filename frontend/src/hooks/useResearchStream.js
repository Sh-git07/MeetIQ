import { useState, useEffect, useCallback, useRef } from 'react';
import { createMockResearchStream } from '../mocks/mockStream';
import { getResearchStatus } from '../services/api';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function useResearchStream(researchId, meetingMeta = {}) {
  const [events, setEvents] = useState([]);
  const [stage, setStage] = useState('planning');
  const [progress, setProgress] = useState(0);
  const [latestMessage, setLatestMessage] = useState('Initiating research plan…');
  const [status, setStatus] = useState('running'); // 'running' | 'completed' | 'failed' | 'reconnecting'
  const [error, setError] = useState(null);
  
  // Accumulated data from events (optional additive data)
  const [queries, setQueries] = useState([]);
  const [sources, setSources] = useState([]);
  const [verifiedIds, setVerifiedIds] = useState([]);
  const [briefingId, setBriefingId] = useState(null);

  const cleanupRef = useRef(null);
  const eventSourceRef = useRef(null);

  const handleEvent = useCallback((event) => {
    setEvents((prev) => [...prev, { ...event, timestamp: new Date() }]);

    if (event.stage) setStage(event.stage);
    if (typeof event.progress === 'number') setProgress(event.progress);
    if (event.message) setLatestMessage(event.message);

    if (event.stage === 'completed') {
      setStatus('completed');
      if (event.data?.briefing_id) {
        setBriefingId(event.data.briefing_id);
      } else {
        setBriefingId('brief_001');
      }
    } else if (event.stage === 'failed') {
      setStatus('failed');
      setError(event.message || 'Research failed');
    }

    // Process additive optional data if present
    if (event.data?.queries && Array.isArray(event.data.queries)) {
      setQueries((prev) => Array.from(new Set([...prev, ...event.data.queries])));
    }
    if (event.data?.sources && Array.isArray(event.data.sources)) {
      setSources((prev) => {
        const map = new Map(prev.map((s) => [s.id, s]));
        event.data.sources.forEach((s) => map.set(s.id, s));
        return Array.from(map.values());
      });
    }
    if (event.data?.verification?.verified_ids) {
      setVerifiedIds((prev) =>
        Array.from(new Set([...prev, ...event.data.verification.verified_ids]))
      );
    }
  }, []);

  const handleError = useCallback((err) => {
    setStatus('failed');
    setError(err?.message || 'Connection lost to research stream.');
  }, []);

  const startStream = useCallback(() => {
    // Reset state on start/retry
    setEvents([]);
    setStage('planning');
    setProgress(0);
    setLatestMessage('Initiating research plan…');
    setStatus('running');
    setError(null);
    setQueries([]);
    setSources([]);
    setVerifiedIds([]);
    setBriefingId(null);

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (USE_MOCKS) {
      cleanupRef.current = createMockResearchStream(
        researchId,
        meetingMeta,
        handleEvent,
        handleError
      );
      return;
    }

    // Real SSE Mode
    const sseUrl = `${API_BASE_URL}/api/research/${researchId}/events`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setStatus('running');
    };

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        handleEvent(parsed);
      } catch (err) {
        console.error('Failed to parse SSE payload:', err, e.data);
      }
    };

    es.onerror = async () => {
      es.close();
      setStatus('reconnecting');
      setLatestMessage('Connection dropped, attempting to recover state…');
      
      // Try to recover state via GET /api/research/{id}/status
      try {
        const currentStatus = await getResearchStatus(researchId);
        if (currentStatus.status === 'completed') {
          setStage('completed');
          setProgress(100);
          setStatus('completed');
          setLatestMessage('Briefing ready');
        } else if (currentStatus.status === 'failed') {
          setStage('failed');
          setStatus('failed');
          setError('Research task terminated with error.');
        } else {
          // Retry connecting after 2 seconds
          setTimeout(() => {
            if (status !== 'completed' && status !== 'failed') {
              startStream();
            }
          }, 2000);
        }
      } catch (recoveryErr) {
        setStatus('failed');
        setError('Unable to recover research stream status.');
      }
    };
  }, [researchId, meetingMeta, handleEvent, handleError, status]);

  useEffect(() => {
    startStream();
    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [researchId]);

  return {
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
    reconnect: startStream
  };
}
