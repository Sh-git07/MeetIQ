import { useState, useEffect, useCallback } from 'react';
import { listMeetings, createMeeting, startResearch } from '../services/api';

export function useMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMeetings();
      setMeetings(data);
    } catch (err) {
      setError(err?.message || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const scheduleMeetingAndResearch = async (meetingFormData) => {
    // Step 1: POST /api/meetings
    const created = await createMeeting(meetingFormData);
    const meetingId = created.meeting_id;

    // Step 2: POST /api/meetings/{id}/research
    const research = await startResearch(meetingId);
    return {
      meetingId,
      researchId: research.research_id
    };
  };

  return {
    meetings,
    loading,
    error,
    refetch: fetchMeetings,
    scheduleMeetingAndResearch
  };
}
