import { useState, useEffect, useCallback } from 'react';
import { listBriefings } from '../services/api';
import { normalizeBriefing } from '../utils/normalizeBriefing';

export function useBriefings() {
  const [briefings, setBriefings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBriefings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rawList = await listBriefings();
      const normalized = (rawList || []).map((b) => normalizeBriefing(b));
      setBriefings(normalized);
    } catch (err) {
      setError(err?.message || 'Failed to load briefings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefings();
  }, [fetchBriefings]);

  return {
    briefings,
    loading,
    error,
    refetch: fetchBriefings
  };
}
