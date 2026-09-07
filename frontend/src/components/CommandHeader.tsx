import React from 'react';
import { Download, Calendar, Sparkles } from 'lucide-react';
import { ConnectionStatusBanner } from './ConnectionStatusBanner';
import { GoalProgressRing } from './GoalProgressRing';
import { ConnectionStatus } from '../hooks/useLiveStream';

interface CommandHeaderProps {
  range: 'today' | 'yesterday' | '7days' | 'month';
  setRange: (range: 'today' | 'yesterday' | '7days' | 'month') => void;
  onExport: () => void;
  exporting: boolean;
  activeSeconds: number;
  connectionStatus: ConnectionStatus;
  lastSeen: Date | null;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  range,
  setRange,
  onExport,
  exporting,
  activeSeconds,
  connectionStatus,
  lastSeen,
}) => {
  const rangeOptions: Array<{ id: 'today' | 'yesterday' | '7days' | 'month'; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: '7 Days' },
    { id: 'month', label: '30 Days' },
  ];

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--bg-surface)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        gap: '1rem',
      }}
    >
      {/* Title & Live Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div>
          <h1
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Executive Command Center</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <Sparkles size={11} />
              AI Telemetry
            </span>
          </h1>
        </div>

        <ConnectionStatusBanner status={connectionStatus} lastSeen={lastSeen} />
      </div>

      {/* Actions: Goal Ring + Date Range Selector + Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <GoalProgressRing activeSeconds={activeSeconds} />

        {/* Date Filter Segmented Switch */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            padding: '3px',
            gap: '2px',
          }}
        >
          {rangeOptions.map((opt) => {
            const isSelected = range === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setRange(opt.id)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 600 : 500,
                  borderRadius: '7px',
                  border: 'none',
                  background: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Export Timesheet CSV Button */}
        <button
          className="btn btn-secondary"
          onClick={onExport}
          disabled={exporting}
          title="Download detailed timesheet report as CSV"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <Download size={14} />
          <span>{exporting ? 'Exporting...' : 'Export'}</span>
        </button>
      </div>
    </header>
  );
};
