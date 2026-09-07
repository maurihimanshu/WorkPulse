import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  AlertTriangle,
  Activity,
  Search,
  RefreshCw,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../api';
import { SystemResourceSummary, ProcessResource } from '../types';

interface ProcessResourceMonitorProps {
  liveResources?: SystemResourceSummary | null;
}

export const ProcessResourceMonitor: React.FC<ProcessResourceMonitorProps> = ({ liveResources }) => {
  const [data, setData] = useState<SystemResourceSummary | null>(liveResources || null);
  const [loading, setLoading] = useState<boolean>(!liveResources);
  const [filterType, setFilterType] = useState<'all' | 'foreground' | 'background' | 'hogs'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (liveResources) {
      setData(liveResources);
      setLastUpdated(new Date());
      setLoading(false);
    }
  }, [liveResources]);

  const fetchResources = async () => {
    try {
      const res = await api.getCurrentResources();
      setData(res);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to load process resources:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!liveResources) {
      fetchResources();
      const interval = setInterval(fetchResources, 8000);
      return () => clearInterval(interval);
    }
  }, [liveResources]);

  const formatMemory = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const getFilteredProcesses = (): ProcessResource[] => {
    if (!data || !data.topProcesses) return [];
    let list = data.topProcesses.filter(
      (p) => p.pid !== 0 && !p.name.toLowerCase().includes('idle')
    );

    if (filterType === 'foreground') {
      list = list.filter((p) => p.isForeground);
    } else if (filterType === 'background') {
      list = list.filter((p) => !p.isForeground);
    } else if (filterType === 'hogs') {
      list = list.filter((p) => p.cpuPercent >= 15 || p.memoryMb >= 1500);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.pid.toString().includes(query)
      );
    }

    return list;
  };

  const filtered = getFilteredProcesses();

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              padding: '0.45rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
            }}
          >
            <Activity size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              System &amp; Process Resource Monitor
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Real-time foreground attribution, background drain &amp; resource consumption
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchResources}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '0.4rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.05))',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            title="Refresh now"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total CPU */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Cpu size={14} color="#3b82f6" /> CPU Load
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.25rem',
                backgroundColor: (data?.totalCpuPercent || 0) > 80 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: (data?.totalCpuPercent || 0) > 80 ? '#ef4444' : '#3b82f6',
                fontWeight: 600,
              }}
            >
              {data?.totalCpuPercent ?? 0}%
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data?.totalCpuPercent ?? 0}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>FG: {data?.foregroundCpuPercent ?? 0}%</span>
            <span>BG: {data?.backgroundCpuPercent ?? 0}%</span>
          </div>
        </div>

        {/* Total RAM */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <HardDrive size={14} color="#10b981" /> Memory Usage
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.25rem',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              {data?.totalMemoryPercent ?? 0}%
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatMemory(data?.usedMemoryMb ?? 0)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            of {formatMemory(data?.totalMemoryMb ?? 0)} Total RAM
          </div>
        </div>

        {/* Background Drain Ratio */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Zap size={14} color="#f59e0b" /> Background Drain
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.25rem',
                backgroundColor:
                  (data?.backgroundDrainRatio || 0) > 50
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                color: (data?.backgroundDrainRatio || 0) > 50 ? '#ef4444' : '#f59e0b',
                fontWeight: 600,
              }}
            >
              {(data?.backgroundDrainRatio || 0) > 50 ? 'Heavy Drain' : 'Normal'}
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data?.backgroundDrainRatio ?? 0}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            of active process CPU drawn by background tasks
          </div>
        </div>

        {/* Resource Hogs Indicator */}
        <div
          style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.03))',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={14} color="#ec4899" /> Resource Hogs
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.25rem',
                backgroundColor: (data?.resourceHogsCount || 0) > 0 ? 'rgba(236, 72, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: (data?.resourceHogsCount || 0) > 0 ? '#ec4899' : '#10b981',
                fontWeight: 600,
              }}
            >
              {data?.resourceHogsCount ?? 0} High
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {data?.resourceHogsCount ?? 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Processes consuming &gt;25% CPU or &gt;1.5 GB RAM
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(
            [
              { key: 'all', label: `All (${data?.topProcesses?.length ?? 0})` },
              {
                key: 'foreground',
                label: `Foreground (${data?.topProcesses?.filter((p) => p.isForeground).length ?? 0})`,
              },
              {
                key: 'background',
                label: `Background (${data?.topProcesses?.filter((p) => !p.isForeground).length ?? 0})`,
              },
              {
                key: 'hogs',
                label: `Hogs (${data?.resourceHogsCount ?? 0})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: filterType === tab.key ? 600 : 400,
                border: filterType === tab.key ? '1px solid #3b82f6' : '1px solid transparent',
                backgroundColor:
                  filterType === tab.key ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: filterType === tab.key ? '#3b82f6' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '180px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '0.6rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }}
          />
          <input
            type="text"
            placeholder="Search process or PID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.35rem 0.65rem 0.35rem 2rem',
              borderRadius: '0.4rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.05))',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Process Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Process</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>PID</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, minWidth: '130px' }}>CPU Usage</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600, minWidth: '130px' }}>Memory (RAM)</th>
              <th style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                  {loading ? 'Collecting process telemetry...' : 'No processes matching filter.'}
                </td>
              </tr>
            ) : (
              filtered.map((proc) => {
                const isHeavy = proc.cpuPercent >= 15 || proc.memoryMb >= 1500;
                const isModerate = !isHeavy && (proc.cpuPercent >= 5 || proc.memoryMb >= 500);
                return (
                  <tr
                    key={proc.pid}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: proc.isForeground ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
                    }}
                  >
                    {/* Name */}
                    <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {proc.isForeground && (
                          <span
                            title="Active foreground window"
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              display: 'inline-block',
                            }}
                          />
                        )}
                        <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={proc.name}>
                          {proc.name}
                        </span>
                      </div>
                    </td>

                    {/* PID */}
                    <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {proc.pid}
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      {proc.isForeground ? (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontWeight: 600,
                          }}
                        >
                          Foreground
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            backgroundColor: 'rgba(100, 116, 139, 0.15)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          Background
                        </span>
                      )}
                    </td>

                    {/* CPU Usage */}
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: isHeavy ? '#ef4444' : isModerate ? '#f59e0b' : 'var(--text-primary)' }}>
                            {proc.cpuPercent}%
                          </span>
                        </div>
                        <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.max(proc.cpuPercent, 2))}%`,
                              backgroundColor: isHeavy ? '#ef4444' : isModerate ? '#f59e0b' : '#3b82f6',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Memory (RAM) */}
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: isHeavy ? '#ef4444' : isModerate ? '#f59e0b' : 'var(--text-primary)' }}>
                            {formatMemory(proc.memoryMb)}
                          </span>
                        </div>
                        <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.max((proc.memoryMb / ((data?.totalMemoryMb || 16000)) * 100), 2))}%`,
                              backgroundColor: isHeavy ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      {isHeavy ? (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            fontWeight: 600,
                          }}
                        >
                          Heavy Drain
                        </span>
                      ) : isModerate ? (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            fontWeight: 600,
                          }}
                        >
                          Moderate
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '0.35rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            fontWeight: 500,
                          }}
                        >
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
