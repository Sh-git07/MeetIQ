import axios from 'axios';
import { mockMeetings, mockBriefings } from '../mocks/mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

// Central Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Interceptor for normalizing errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'An unexpected network error occurred.',
      status: error.response?.status,
      data: error.response?.data
    };
    return Promise.reject(customError);
  }
);

// Simulated latency helper (300ms - 800ms)
const simulateLatency = (ms = 400 + Math.random() * 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Local in-memory meeting store for mock mode so newly created meetings persist in session
let localMeetings = [...mockMeetings];

/**
 * API Methods
 */

export async function createMeeting(meetingData) {
  if (USE_MOCKS) {
    await simulateLatency();
    const newId = `meet_${String(localMeetings.length + 1).padStart(3, '0')}`;
    const newMeeting = {
      meeting_id: newId,
      company: meetingData.company,
      website: meetingData.website || '',
      meeting_date: meetingData.meeting_date,
      meeting_type: meetingData.meeting_type || 'Partnership',
      objective: meetingData.objective,
      additional_context: meetingData.additional_context || '',
      status: 'created',
      created_at: new Date().toISOString(),
      briefing_id: null
    };
    localMeetings.unshift(newMeeting);
    return {
      meeting_id: newId,
      status: 'created',
      message: 'Meeting created successfully'
    };
  }

  const res = await apiClient.post('/api/meetings', meetingData);
  return res.data;
}

export async function listMeetings() {
  if (USE_MOCKS) {
    await simulateLatency(350);
    return localMeetings;
  }

  const res = await apiClient.get('/api/meetings');
  return res.data;
}

export async function getMeeting(id) {
  if (USE_MOCKS) {
    await simulateLatency(250);
    const found = localMeetings.find((m) => m.meeting_id === id);
    if (!found) {
      throw { status: 404, message: `Meeting ${id} not found.` };
    }
    return found;
  }

  const res = await apiClient.get(`/api/meetings/${id}`);
  return res.data;
}

export async function startResearch(meetingId) {
  if (USE_MOCKS) {
    await simulateLatency(450);
    const researchId = `research_${meetingId.replace('meet_', '') || Date.now()}`;
    const meeting = localMeetings.find((m) => m.meeting_id === meetingId);
    if (meeting) {
      meeting.status = 'in_progress';
    }
    return {
      research_id: researchId,
      status: 'started',
      message: 'Research started'
    };
  }

  const res = await apiClient.post(`/api/meetings/${meetingId}/research`);
  return res.data;
}

export async function getResearchStatus(researchId) {
  if (USE_MOCKS) {
    await simulateLatency(200);
    return {
      research_id: researchId,
      stage: 'completed',
      progress: 100,
      status: 'completed'
    };
  }

  const res = await apiClient.get(`/api/research/${researchId}/status`);
  return res.data;
}

export async function listBriefings() {
  if (USE_MOCKS) {
    await simulateLatency(350);
    return Object.values(mockBriefings);
  }

  const res = await apiClient.get('/api/briefings');
  return res.data;
}

export async function getBriefing(briefingId) {
  if (USE_MOCKS) {
    await simulateLatency(300);
    const briefing = mockBriefings[briefingId] || mockBriefings['brief_001'];
    if (!briefing) {
      throw { status: 404, message: `Briefing ${briefingId} not found.` };
    }
    return briefing;
  }

  const res = await apiClient.get(`/api/briefings/${briefingId}`);
  return res.data;
}

export async function downloadBriefingPdf(briefingId) {
  if (USE_MOCKS) {
    await simulateLatency(500);
    // In mock mode, resolve successfully so hook/UI can show toast
    return { mock: true, message: 'PDF export works once the backend is connected' };
  }

  const res = await apiClient.get(`/api/briefings/${briefingId}/pdf`, {
    responseType: 'blob'
  });
  
  // Trigger browser download of PDF blob
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meetiq-briefing-${briefingId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return { success: true };
}
