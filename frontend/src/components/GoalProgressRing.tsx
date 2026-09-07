import React from 'react';
import { Target } from 'lucide-react';

interface GoalProgressRingProps {
  activeSeconds: number;
  targetHours?: number;
}

export const GoalProgressRing: React.FC<GoalProgressRingProps> = ({
  activeSeconds,
  targetHours = 6,
}) => {
  const targetSeconds = targetHours * 3600;
  const percentage = Math.min(100, Math.round((activeSeconds / targetSeconds) * 100));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const formatHours = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-glass)',
        userSelect: 'none',
      }}
      title={`Daily Focus Target: ${formatHours(activeSeconds)} of ${targetHours}h (${percentage}%)`}
    >
      <div style={{ position: 'relative', width: 36, height: 36 }}>
        <svg width="36" height="36" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="var(--border-subtle)"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={percentage >= 100 ? '#10b981' : '#38bdf8'}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {percentage}%
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          <Target size={11} color="#38bdf8" />
          <span>Goal</span>
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
          {formatHours(activeSeconds)}{' '}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            /{targetHours}h
          </span>
        </div>
      </div>
    </div>
  );
};

