import React from 'react';
import { Flame, Compass, RefreshCw, Award } from 'lucide-react';
import { DeepWorkStats } from '../types';

interface DeepWorkCardProps {
  stats: DeepWorkStats | null;
}

export const DeepWorkCard: React.FC<DeepWorkCardProps> = ({ stats }) => {
  if (!stats) return null;

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getRatingBadgeStyle = (rating: string) => {
    switch (rating) {
      case 'Flow State':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Balanced':
        return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    }
  };

  const badge = getRatingBadgeStyle(stats.focusRating);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
            }}
          >
            <Flame size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Deep Work &amp; Focus Flow
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Uninterrupted concentration sessions &amp; attention switches
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
          }}
        >
          {stats.focusRating}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Award size={13} color="#f59e0b" />
            <span>Deep Work</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {formatSeconds(stats.deepWorkSeconds)}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            Flow Score: {stats.flowScore}/100
          </div>
        </div>

        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Compass size={13} color="#10b981" />
            <span>Longest Streak</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {formatSeconds(stats.longestStreakSeconds)}
          </div>
          <div
            style={{
              fontSize: '0.7rem',
              color: '#10b981',
              marginTop: '0.1rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {stats.longestStreakApp || 'None'}
          </div>
        </div>

        <div
          style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={13} color="#38bdf8" />
            <span>Context Switches</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {stats.contextSwitchesPerHour}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}> / hr</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: stats.contextSwitchesPerHour < 20 ? '#10b981' : '#f59e0b', marginTop: '0.1rem' }}>
            {stats.contextSwitchesPerHour < 20 ? 'Low Distraction' : 'High Multitasking'}
          </div>
        </div>
      </div>
    </div>
  );
};
