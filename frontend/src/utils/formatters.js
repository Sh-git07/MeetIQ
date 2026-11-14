/**
 * Date and time formatters for MeetIQ
 */

export function formatFreshness(dateInput) {
  if (!dateInput) return 'date unavailable';
  
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'date unavailable';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

export function formatDateFull(dateInput) {
  if (!dateInput) return 'date unavailable';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'date unavailable';

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatMeetingTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const dayStr = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase();

  return `${dayStr}, ${timeStr}`;
}

export function getTomorrowDefaultISO() {
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setHours(15, 0, 0, 0);
  const offset = tomorrow.getTimezoneOffset() * 60000;
  return new Date(tomorrow.getTime() - offset).toISOString().slice(0, 16);
}

export function categoryColor(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'product':
      return '#E60B09';
    case 'people':
    case 'leadership':
      return '#1B1630';
    case 'financial':
    case 'financials':
    case 'pricing':
      return '#D4A300';
    case 'press':
    case 'news':
    default:
      return '#3F7D58';
  }
}
