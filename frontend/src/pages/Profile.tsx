import React, { useState, useEffect } from 'react';
import { User, Target, Clock, Save, CheckCircle, Award } from 'lucide-react';
import { api } from '../api';
import { UserProfile } from '../types';

export const Profile: React.FC = () => {
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

  useEffect(() => {
    loadProfileAndTodayStats();
  }, []);

  const loadProfileAndTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [p, sum] = await Promise.all([api.getProfile(), api.getSummary(today, today)]);
      if (p) setProfile(p);
      if (sum) setTodayActiveSeconds(sum.totalActiveSeconds || 0);
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          User Profile &amp; Goals
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Customize your daily productivity objectives, working schedules, and personal settings
        </p>
      </div>

      {/* Goal Progress Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(30, 41, 59, 1) 100%)', borderColor: '#3b82f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={24} color="#3b82f6" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today's Focus Goal Progress</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Target: {profile.dailyGoalHours} hours active time
              </p>
            </div>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>{progressPct}%</span>
        </div>

        <div style={{ height: '10px', width: '100%', background: 'var(--bg-surface-hover)', borderRadius: '5px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: progressPct >= 100 ? '#10b981' : '#3b82f6',
              borderRadius: '5px',
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{activeHours} hrs logged today</span>
          <span>{profile.dailyGoalHours} hrs target</span>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>Full Name</label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>Email Address</label>
              <input
                type="email"
                className="input"
                style={{ width: '100%' }}
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>Role / Title</label>
              <input
                type="text"
                className="input"
                style={{ width: '100%' }}
                value={profile.roleTitle || ''}
                onChange={(e) => setProfile({ ...profile, roleTitle: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Daily Active Work Goal (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="16"
                className="input"
                style={{ width: '100%' }}
                value={profile.dailyGoalHours || 6.0}
                onChange={(e) => setProfile({ ...profile, dailyGoalHours: parseFloat(e.target.value) || 6.0 })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Working Hours Start (24h format)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                className="input"
                style={{ width: '100%' }}
                value={profile.workStartHour || 9}
                onChange={(e) => setProfile({ ...profile, workStartHour: parseInt(e.target.value) || 9 })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Working Hours End (24h format)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                className="input"
                style={{ width: '100%' }}
                value={profile.workEndHour || 18}
                onChange={(e) => setProfile({ ...profile, workEndHour: parseInt(e.target.value) || 18 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Profile</span>
            </button>
            {saved && (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                <CheckCircle size={16} />
                <span>Profile updated successfully!</span>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};