import { useState, useEffect } from 'react';

const SETTINGS_KEY = 'meetiq_user_settings';

const defaultSettings = {
  profile: {
    name: 'Alex Vance',
    email: 'alex.vance@executive.ai',
    role: 'VP Partnerships & Alliances'
  },
  preferences: {
    defaultMeetingType: 'Partnership',
    researchWindowDays: '30'
  },
  app: {
    reducedMotion: false,
    compactMode: false
  }
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to parse settings from localStorage', e);
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
        profile: { ...prev.profile, ...(newSettings.profile || {}) },
        preferences: { ...prev.preferences, ...(newSettings.preferences || {}) },
        app: { ...prev.app, ...(newSettings.app || {}) }
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save settings to localStorage', e);
      }
      return updated;
    });
  };

  return {
    settings,
    updateSettings
  };
}
