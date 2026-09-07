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
      return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: 'rgba(16, 185, 129, 0.25)' };
    }
    if (risk.includes('Moderate')) {
      return { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' };
    }
    return { bg: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.25)' };
  };

  const riskStyle = getRiskStyle(stats.burnoutRisk);

  return (
    <div className="glass-panel" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              padding: '0.5rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <HeartPulse size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>
              Digital Well-Being &amp; Balance
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
              Core schedule adherence vs overtime &amp; restorative intervals
            </p>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: riskStyle.bg,
            color: riskStyle.color,
            border: `1px solid ${riskStyle.border}`,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
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
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: '0.78rem',
            color: '#f59e0b',
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>Continuous stretch exceeded {formatSeconds(stats.longestStretchWithoutBreakSeconds)}. Take a micro-break to sustain cognitive flow.</span>
        </div>
      )}

      {/* Core vs Overtime Breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 500 }}>
            <Sun size={13} />
            <span>Core Hours: {formatSeconds(stats.coreHoursSeconds)} ({corePct}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: stats.overtimeSeconds > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 500 }}>
            <Moon size={13} />
            <span>Overtime: {formatSeconds(stats.overtimeSeconds)} ({overtimePct}%)</span>
          </div>
        </div>

        {/* Proportional bar */}
        <div
          style={{
            height: '7px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
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
            <Coffee size={13} color="#10b981" />
            <span>Rest Breaks</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
            {stats.breakCount} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>completed</span>
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
            <AlertTriangle size={13} color={stats.fatigueWarning ? '#f59e0b' : '#10b981'} />
            <span>Max Continuous Stretch</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
            {formatSeconds(stats.longestStretchWithoutBreakSeconds)}
          </div>
        </div>
      </div>
    </div>
  );
};

