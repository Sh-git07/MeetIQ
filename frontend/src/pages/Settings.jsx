import React, { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/Button';

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();

  const [name, setName] = useState(settings.profile.name || '');
  const [email, setEmail] = useState(settings.profile.email || '');
  const [role, setRole] = useState(settings.profile.role || '');

  const [defaultMeetingType, setDefaultMeetingType] = useState(
    settings.preferences.defaultMeetingType || 'Partnership'
  );
  const [researchWindowDays, setResearchWindowDays] = useState(
    settings.preferences.researchWindowDays || '30'
  );

  const [reducedMotion, setReducedMotion] = useState(
    settings.app.reducedMotion || false
  );
  const [compactMode, setCompactMode] = useState(
    settings.app.compactMode || false
  );

  const [errors, setErrors] = useState({});

  const handleSave = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!name.trim()) newErrors.name = 'Name cannot be empty';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Valid email is required';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    updateSettings({
      profile: { name: name.trim(), email: email.trim(), role: role.trim() },
      preferences: { defaultMeetingType, researchWindowDays },
      app: { reducedMotion, compactMode }
    });

    showToast('Preferences saved successfully');
  };

  return (
    <div className="page-container max-w-[880px]">
      <p className="font-mono-meta mb-2 reveal-up" style={{ '--stagger': 0 }}>
        preferences & account
      </p>

      <h2 className="text-[#1B1630] font-heading font-extrabold tracking-tight leading-[0.94] mb-10 reveal-up" style={{ '--stagger': 1 }}>
        Settings
      </h2>

      <form onSubmit={handleSave} className="space-y-12">
        {/* Section 1: Executive Profile */}
        <div className="reveal-up" style={{ '--stagger': 2 }}>
          <h3 className="font-heading font-extrabold text-[24px] text-[#1B1630] mb-4 pb-2 border-b border-[rgba(27,22,48,0.15)]">
            Executive Profile
          </h3>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block font-mono text-xs text-[#665F75] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full sm:w-[380px] bg-transparent border-0 border-b-2 border-[rgba(27,22,48,0.2)] focus:border-[#E60B09] font-sans text-[18px] text-[#1B1630] py-1 outline-none transition-colors"
              />
              {errors.name && (
                <p className="text-xs text-[#C21A12] mt-1 font-mono">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs text-[#665F75] mb-1">
                Executive Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:w-[380px] bg-transparent border-0 border-b-2 border-[rgba(27,22,48,0.2)] focus:border-[#E60B09] font-mono text-[16px] text-[#1B1630] py-1 outline-none transition-colors"
              />
              {errors.email && (
                <p className="text-xs text-[#C21A12] mt-1 font-mono">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs text-[#665F75] mb-1">
                Title / Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full sm:w-[380px] bg-transparent border-0 border-b-2 border-[rgba(27,22,48,0.2)] focus:border-[#E60B09] font-sans text-[18px] text-[#1B1630] py-1 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Research Preferences */}
        <div className="reveal-up" style={{ '--stagger': 3 }}>
          <h3 className="font-heading font-extrabold text-[24px] text-[#1B1630] mb-4 pb-2 border-b border-[rgba(27,22,48,0.15)]">
            Research Preferences
          </h3>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block font-mono text-xs text-[#665F75] mb-1">
                Default Meeting Objective Archetype
              </label>
              <select
                value={defaultMeetingType}
                onChange={(e) => setDefaultMeetingType(e.target.value)}
                className="bg-transparent border-0 border-b-2 border-[rgba(27,22,48,0.2)] focus:border-[#E60B09] font-sans text-[17px] text-[#1B1630] py-1 outline-none cursor-pointer"
              >
                <option value="Partnership">Partnership (Strategic fit & leadership)</option>
                <option value="Sales">Sales (Budgets, pain points, enterprise hires)</option>
                <option value="Investor meeting">Investor meeting (Financials, CAPEX, growth)</option>
                <option value="Client meeting">Client meeting (Recent wins & org changes)</option>
                <option value="Business development">Business development (Market expansion)</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs text-[#665F75] mb-1">
                Standard Signal Horizon
              </label>
              <div className="flex items-center gap-2 font-mono text-sm text-[#1B1630]">
                <span>Last</span>
                <input
                  type="number"
                  value={researchWindowDays}
                  onChange={(e) => setResearchWindowDays(e.target.value)}
                  min="7"
                  max="90"
                  className="w-16 bg-transparent border-0 border-b-2 border-[rgba(27,22,48,0.2)] text-center text-[#E60B09] font-bold outline-none"
                />
                <span>days (30-day temporal verification window)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: App & Display Preferences */}
        <div className="reveal-up" style={{ '--stagger': 4 }}>
          <h3 className="font-heading font-extrabold text-[24px] text-[#1B1630] mb-4 pb-2 border-b border-[rgba(27,22,48,0.15)]">
            App Experience
          </h3>

          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-4 h-4 accent-[#E60B09] rounded cursor-pointer"
              />
              <div>
                <b className="block text-sm font-sans text-[#1B1630]">
                  Force Reduced Motion
                </b>
                <small className="text-xs text-[#665F75] font-mono">
                  Disables scanner field lens reaction, text magnifier, and orbit loops.
                </small>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={compactMode}
                onChange={(e) => setCompactMode(e.target.checked)}
                className="w-4 h-4 accent-[#E60B09] rounded cursor-pointer"
              />
              <div>
                <b className="block text-sm font-sans text-[#1B1630]">
                  Compact Briefing Mode
                </b>
                <small className="text-xs text-[#665F75] font-mono">
                  Uses denser typography suitable for smaller tablet screens and prints.
                </small>
              </div>
            </label>
          </div>
        </div>

        {/* Save Actions */}
        <div className="pt-4 border-t border-[rgba(27,22,48,0.15)] flex items-center gap-4 reveal-up" style={{ '--stagger': 5 }}>
          <Button type="submit" variant="primary">
            Save Preferences
          </Button>
          <Button to="/dashboard" variant="ghost">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
