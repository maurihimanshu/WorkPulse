import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Award } from 'lucide-react';
import { api } from '../api';
import { UserProfile } from '../types';
import { formatLocalDate } from '../utils/dateUtils';

interface ProfileProps {
  onProfileUpdated?: (profile: UserProfile) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onProfileUpdated }) => {
  const [profile, setProfile] = useState<UserProfile>({
    id: 'default',
    name: 'WorkPulse User',
    email: 'user@workpulse.local',
    roleTitle: 'Productivity Champion',
    dailyGoalHours: 6.0,
    workStartHour: 9,
    workEndHour: 18,
    theme: 'dark',
  });
  const [todayActiveSeconds, setTodayActiveSeconds] = useState(0);
  const [saved, setSaved] = useState(false);

  const loadProfileAndTodayStats = async () => {
    try {
      const today = formatLocalDate(new Date());
      const [p, sum] = await Promise.all([api.getProfile(), api.getSummary(today, today)]);
      if (p) setProfile(p);
      if (sum) setTodayActiveSeconds(sum.totalActiveSeconds || 0);
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  useEffect(() => {
    loadProfileAndTodayStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated);
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save profile:', e);
    }
  };

  const goalSeconds = (profile.dailyGoalHours || 6.0) * 3600;
  const progressPct = Math.min(100, Math.round((todayActiveSeconds / Math.max(goalSeconds, 1)) * 100));
  const activeHours = (todayActiveSeconds / 3600).toFixed(1);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '860px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
          User Profile &amp; Objectives
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
          Customize your daily focus targets, core working intervals, and executive identity
        </p>
      </div>

      {/* Goal Progress Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, var(--bg-surface) 100%)',
          borderColor: 'rgba(59, 130, 246, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Today's Focus Goal Alignment
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                Target: {profile.dailyGoalHours} hours of engagement
              </p>
            </div>
          </div>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
            {progressPct}%
          </span>
        </div>

        <div style={{ height: '8px', width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: progressPct >= 100 ? 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)' : 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
              borderRadius: '9999px',
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <span>{activeHours} hrs logged today</span>
          <span>{profile.dailyGoalHours} hrs target</span>
        </div>
      </div>

      {/* Profile Form */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Full Name</label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Email Address</label>
              <input
                type="email"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Role / Professional Designation</label>
              <input
                type="text"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={profile.roleTitle || ''}
                onChange={(e) => setProfile({ ...profile, roleTitle: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Daily Active Focus Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="16"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={profile.dailyGoalHours || 6.0}
                onChange={(e) => setProfile({ ...profile, dailyGoalHours: parseFloat(e.target.value) || 6.0 })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Core Work Start (24h clock)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={profile.workStartHour || 9}
                onChange={(e) => setProfile({ ...profile, workStartHour: parseInt(e.target.value) || 9 })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Core Work End (24h clock)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                className="input"
                style={{ width: '100%', fontSize: '0.85rem' }}
                value={profile.workEndHour || 18}
                onChange={(e) => setProfile({ ...profile, workEndHour: parseInt(e.target.value) || 18 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>Update Profile</span>
            </button>
            {saved && (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle size={15} />
                <span>Profile updated successfully!</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};