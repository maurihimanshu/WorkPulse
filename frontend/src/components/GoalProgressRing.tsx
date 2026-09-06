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
  const radius = 32;
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
        gap: '0.85rem',
        padding: '0.6rem 1rem',
        borderRadius: '0.75rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ position: 'relative', width: 44, height: 44 }}>
        <svg width="44" height="44" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="38"
            cy="38"
            r={radius}
            stroke="var(--border)"
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="38"
            cy="38"
            r={radius}
            stroke={percentage >= 100 ? '#10b981' : '#38bdf8'}
            strokeWidth="7"
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
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {percentage}%
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Target size={12} color="#38bdf8" />
          <span>Daily Focus Target</span>
        </div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {formatHours(activeSeconds)}{' '}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            / {targetHours}h
          </span>
        </div>
      </div>
    </div>
  );
};
