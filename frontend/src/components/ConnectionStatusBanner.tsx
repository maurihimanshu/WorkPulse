import React from 'react';
import { ConnectionStatus } from '../hooks/useLiveStream';
import { Radio, RefreshCw, AlertCircle } from 'lucide-react';

interface ConnectionStatusBannerProps {
  status: ConnectionStatus;
  lastSeen: Date | null;
}

export const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({ status, lastSeen }) => {
  if (status === 'connected') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#10b981',
        }}
        title={`Live stream connected. Last heartbeat: ${lastSeen ? lastSeen.toLocaleTimeString() : 'now'}`}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        <span>Live Stream</span>
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#f59e0b',
        }}
      >
        <RefreshCw size={12} className="animate-spin" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#ef4444',
      }}
      title="Backend connection lost. Retrying automatically..."
    >
      <AlertCircle size={12} />
      <span>Backend Offline</span>
    </div>
  );
};
