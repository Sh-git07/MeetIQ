import { useState, useEffect, useCallback } from 'react';
import { getBriefing, downloadBriefingPdf } from '../services/api';
import { normalizeBriefing } from '../utils/normalizeBriefing';
import { useToast } from './useToast';

export function useBriefing(briefingId) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchBriefing = useCallback(async () => {
    if (!briefingId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const raw = await getBriefing(briefingId);
      const normalized = normalizeBriefing(raw);
      setBriefing(normalized);
    } catch (err) {
      setError(err?.message || 'Failed to load executive briefing.');
    } finally {
      setLoading(false);
    }
  }, [briefingId]);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const handleDownloadPdf = async () => {
    try {
      const res = await downloadBriefingPdf(briefingId);
      if (res?.mock) {
        showToast('PDF export works once the backend is connected');
      } else {
        showToast('PDF downloaded successfully');
      }
    } catch (err) {
      showToast(err?.message || 'Failed to download PDF briefing');
    }
  };

  return {
    briefing,
    loading,
    error,
    refetch: fetchBriefing,
    downloadPdf: handleDownloadPdf
  };
}
