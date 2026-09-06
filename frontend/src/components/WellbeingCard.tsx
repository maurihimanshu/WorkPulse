import React from 'react';
import { HeartPulse, Sun, Moon, AlertTriangle, Coffee } from 'lucide-react';
import { WellbeingStats } from '../types';

interface WellbeingCardProps {
  stats: WellbeingStats | null;
}

export const WellbeingCard: React.FC<WellbeingCardProps> = ({ stats }) => {
  if (!stats) return null;

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const totalActive = stats.coreHoursSeconds + stats.overtimeSeconds;
  const corePct = totalActive > 0 ? Math.round((stats.coreHoursSeconds / totalActive) * 100) : 100;
  const overtimePct = 100 - corePct;

  const getRiskStyle = (risk: string) => {
    if (risk.includes('Low') || risk.includes('Healthy')) {
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (risk.includes('Moderate')) {
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
    }
    return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
  };

  const riskStyle = getRiskStyle(stats.burnoutRisk);

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
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
            }}
          >
            <HeartPulse size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Digital Well-Being &amp; Work-Life Balance
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Core working hours vs overtime &amp; rest intervals
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: riskStyle.bg,
            color: riskStyle.color,
            border: `1px solid ${riskStyle.border}`,
          }}
        >
          {stats.burnoutRisk}
        </span>
      </div>

      {stats.fatigueWarning && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            fontSize: '0.8rem',
            color: '#f59e0b',
          }}
        >
          <AlertTriangle size={15} />
          <span>Extended screen time: longest continuous stretch was {formatSeconds(stats.longestStretchWithoutBreakSeconds)}. Remember to take short rest breaks.</span>
        </div>
      )}

      {/* Core vs Overtime Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
            <Sun size={14} />
            <span>Core Hours (9 AM - 6 PM): {formatSeconds(stats.coreHoursSeconds)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: stats.overtimeSeconds > 0 ? '#f59e0b' : 'var(--text-secondary)' }}>
            <Moon size={14} />
            <span>After-Hours / Overtime: {formatSeconds(stats.overtimeSeconds)}</span>
          </div>
        </div>

        {/* Proportional bar */}
        <div
          style={{
            height: '8px',
            borderRadius: '4px',
            backgroundColor: 'var(--border)',
            display: 'flex',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${corePct}%`,
              backgroundColor: '#10b981',
              transition: 'width 0.4s ease',
            }}
            title={`Core Hours: ${corePct}%`}
          />
          <div
            style={{
              width: `${overtimePct}%`,
              backgroundColor: '#f59e0b',
              transition: 'width 0.4s ease',
            }}
            title={`Overtime: ${overtimePct}%`}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <Coffee size={13} color="#10b981" />
            <span>Rest Breaks</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {stats.breakCount} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>breaks taken</span>
          </div>
        </div>

        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: '0.5rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <AlertTriangle size={13} color={stats.fatigueWarning ? '#f59e0b' : '#10b981'} />
            <span>Longest Stretch</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {formatSeconds(stats.longestStretchWithoutBreakSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
};
