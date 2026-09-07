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
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' };
      case 'Balanced':
        return { bg: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.25)' };
      default:
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' };
    }
  };

  const badge = getRatingBadgeStyle(stats.focusRating);

  return (
    <div className="glass-panel" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <Flame size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Deep Work &amp; Focus Flow
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
              Uninterrupted concentration sessions &amp; attention switches
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {stats.focusRating}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Award size={13} color="#f59e0b" />
            <span>Deep Work</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            {formatSeconds(stats.deepWorkSeconds)}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Flow Score: <span style={{ color: '#f59e0b', fontWeight: 600 }}>{stats.flowScore}/100</span>
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <Compass size={13} color="#10b981" />
            <span>Longest Streak</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            {formatSeconds(stats.longestStreakSeconds)}
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              color: '#10b981',
              marginTop: '0.15rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: 500,
            }}
          >
            {stats.longestStreakApp || 'None'}
          </div>
        </div>

        <div
          style={{
            padding: '0.85rem',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={13} color="#06b6d4" />
            <span>Switches / Hr</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>
            {stats.contextSwitchesPerHour}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}> /h</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: stats.contextSwitchesPerHour < 20 ? '#10b981' : '#f59e0b', marginTop: '0.15rem', fontWeight: 500 }}>
            {stats.contextSwitchesPerHour < 20 ? 'Focused Flow' : 'High Multitasking'}
          </div>
        </div>
      </div>
    </div>
  );
};

