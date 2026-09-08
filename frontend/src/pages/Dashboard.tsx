import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  Zap,
  Coffee,
  TrendingUp,
  Monitor,
  Layers,
  LayoutGrid,
  BarChart3,
  BrainCircuit,
  Cpu,
} from 'lucide-react';
import { api } from '../api';
import {
  StatsSummary,
  TopApp,
  HourlyStat,
  CategoryStat,
  Heartbeat,
  DeepWorkStats,
  ProjectBreakdown,
  WellbeingStats,
} from '../types';
import { CommandHeader } from '../components/CommandHeader';
import { DeepWorkCard } from '../components/DeepWorkCard';
import { ProjectBreakdownCard } from '../components/ProjectBreakdownCard';
import { WellbeingCard } from '../components/WellbeingCard';
import { ProcessResourceMonitor } from '../components/ProcessResourceMonitor';
import { CategoryDistributionCard } from '../components/CategoryDistributionCard';
import { useLiveStream } from '../hooks/useLiveStream';
import { formatLocalDate } from '../utils/dateUtils';

interface DashboardProps {
  heartbeat?: Heartbeat | null;
  liveStream?: ReturnType<typeof useLiveStream>;
  targetHours?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ heartbeat, liveStream: propLiveStream, targetHours = 6 }) => {
  const fallbackLiveStream = useLiveStream();
  const liveStream = propLiveStream || fallbackLiveStream;
  const currentHeartbeat = liveStream.heartbeat || heartbeat;

  const [range, setRange] = useState<'today' | 'yesterday' | '7days' | 'month'>('today');
  const [activeTab, setActiveTab] = useState<'all' | 'analytics' | 'focus' | 'resources'>('all');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [topApps, setTopApps] = useState<TopApp[]>([]);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [deepWork, setDeepWork] = useState<DeepWorkStats | null>(null);
  const [projects, setProjects] = useState<ProjectBreakdown[]>([]);
  const [wellbeing, setWellbeing] = useState<WellbeingStats | null>(null);
  const [exporting, setExporting] = useState(false);

  const cacheRef = useRef<Record<string, { time: number; data: any }>>({});

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (range === 'today') {
      const today = formatLocalDate(now);
      return { start: today, end: today };
    } else if (range === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatLocalDate(y);
      return { start: yStr, end: yStr };
    } else if (range === '7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      return { start: formatLocalDate(past), end: formatLocalDate(now) };
    } else {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      return { start: formatLocalDate(past), end: formatLocalDate(now) };
    }
  }, [range]);

  const loadData = useCallback(async (force = false) => {
    const { start, end } = getDateRange();
    const cacheKey = `${range}_${start}_${end}`;
    const cached = cacheRef.current[cacheKey];
    const now = Date.now();

    if (!force && cached && now - cached.time < 30000) {
      const d = cached.data;
      setSummary(d.summary);
      setTopApps(d.topApps);
      setHourly(d.hourly);
      setCategories(d.categories);
      setDeepWork(d.deepWork);
      setProjects(d.projects);
      setWellbeing(d.wellbeing);
      return;
    }

    try {
      const [sumRes, appsRes, hourlyRes, catRes, dwRes, projRes, wbRes] = await Promise.all([
        api.getSummary(start, end),
        api.getTopApps(start, end, 8),
        api.getHourly(start, end),
        api.getCategoryStats(start, end),
        api.getDeepWork(start, end),
        api.getProjects(start, end, 6),
        api.getWellbeing(start, end),
      ]);
      setSummary(sumRes);
      setTopApps(appsRes);
      setHourly(hourlyRes);
      setCategories(catRes);
      setDeepWork(dwRes);
      setProjects(projRes);
      setWellbeing(wbRes);

      cacheRef.current[cacheKey] = {
        time: now,
        data: {
          summary: sumRes,
          topApps: appsRes,
          hourly: hourlyRes,
          categories: catRes,
          deepWork: dwRes,
          projects: projRes,
          wellbeing: wbRes,
        },
      };
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  }, [getDateRange, range]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const { start, end } = getDateRange();
      await api.downloadCsvExport(start, end);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const maxHourlyVal = Math.max(
    ...hourly.map((h) => (h.activeSeconds || 0) + (h.idleSeconds || 0)),
    3600
  );

  return (
    <>
      <CommandHeader
        range={range}
        setRange={setRange}
        onExport={handleExport}
        exporting={exporting}
        activeSeconds={summary?.totalActiveSeconds || 0}
        targetHours={targetHours}
        connectionStatus={liveStream.connectionStatus}
        lastSeen={liveStream.lastSeen}
      />

      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Real-time Cyber Foreground Beacon Card */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-surface) 100%)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
              <span className="live-beacon" />
              <span style={{ textTransform: 'uppercase' }}>Active Foreground Telemetry</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                PID: <span style={{ color: 'var(--text-primary)' }}>{currentHeartbeat?.processId || 'Idle'}</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '65%' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {currentHeartbeat?.appName || 'System Idle'}
              </h2>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={currentHeartbeat?.windowTitle || 'No active foreground window'}
              >
                {currentHeartbeat?.windowTitle || 'No foreground application window focused'}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Current Session
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {formatSeconds(currentHeartbeat?.currentSessionActiveSeconds || 0)}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Status
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: currentHeartbeat?.isIdle ? '#f59e0b' : '#10b981',
                  }}
                >
                  {currentHeartbeat?.isIdle ? `Idle (${Math.round(currentHeartbeat?.idleSeconds || 0)}s)` : 'Engaged'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 KPI Metric Bento Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {/* Active Time Card */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Screen Time</span>
              <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
                <Zap size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              {formatSeconds(summary?.totalActiveSeconds || 0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Focused computer engagement</div>
          </div>

          {/* Idle Duration Card */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Idle Duration</span>
              <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <Coffee size={16} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              {formatSeconds(summary?.totalIdleSeconds || 0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Away or restorative interval</div>
          </div>

          {/* Productivity Score Card */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Productivity Ratio</span>
              <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: (summary?.productivityScore || 0) >= 70 ? '#10b981' : '#f59e0b',
                letterSpacing: '-0.02em',
              }}
            >
              {summary?.productivityScore || 0}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Classified productive workflow</div>
          </div>

          {/* Top Application Card */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Top Primary App</span>
              <div style={{ padding: '0.35rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
                <Monitor size={16} />
              </div>
            </div>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.35,
              }}
              title={summary?.topAppName || 'None'}
            >
              {summary?.topAppName || 'None'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {summary?.activitiesCount || 0} telemetry heartbeats
            </div>
          </div>
        </div>

        {/* Sub-View Navigation Segmented Control */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'all' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'all' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: activeTab === 'all' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <LayoutGrid size={15} color={activeTab === 'all' ? '#3b82f6' : 'currentColor'} />
              <span>All-in-One</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'analytics' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'analytics' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === 'analytics' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: activeTab === 'analytics' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <BarChart3 size={15} color={activeTab === 'analytics' ? '#06b6d4' : 'currentColor'} />
              <span>Analytics &amp; Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('focus')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'focus' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'focus' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === 'focus' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: activeTab === 'focus' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <BrainCircuit size={15} color={activeTab === 'focus' ? '#10b981' : 'currentColor'} />
              <span>Focus &amp; Balance</span>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: activeTab === 'resources' ? '1px solid var(--border-highlight)' : '1px solid transparent',
                background: activeTab === 'resources' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === 'resources' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: activeTab === 'resources' ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              <Cpu size={15} color={activeTab === 'resources' ? '#a855f7' : 'currentColor'} />
              <span>Hardware &amp; Processes</span>
            </button>
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Auto-refresh: 5s
          </span>
        </div>

        {/* Section 1: Analytics & Hourly Trends */}
        {(activeTab === 'all' || activeTab === 'analytics') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            {/* Hourly Activity Chart */}
            <div className="glass-panel" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, letterSpacing: '-0.01em' }}>
                  <Clock size={17} color="#3b82f6" />
                  <span>Hourly Activity Distribution</span>
                </h3>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%' }} /> Active
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: '50%' }} /> Idle
                  </span>
                </div>
              </div>

              <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '6px', paddingTop: '10px' }}>
                {hourly.map((h) => {
                  const activeH = maxHourlyVal > 0 ? (h.activeSeconds / maxHourlyVal) * 170 : 0;
                  const idleH = maxHourlyVal > 0 ? (h.idleSeconds / maxHourlyVal) * 170 : 0;

                  return (
                    <div
                      key={h.hour}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        height: '100%',
                        justifyContent: 'flex-end',
                      }}
                      title={`${h.hour}:00 - Active: ${Math.round(h.activeSeconds / 60)}m, Idle: ${Math.round(h.idleSeconds / 60)}m`}
                    >
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column-reverse', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '100%',
                            height: `${Math.max(activeH, 2)}px`,
                            background: h.activeSeconds > 0 ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)' : 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '3px 3px 0 0',
                          }}
                        />
                        {idleH > 0 && (
                          <div
                            style={{
                              width: '100%',
                              height: `${idleH}px`,
                              backgroundColor: '#f59e0b',
                              opacity: 0.85,
                              marginBottom: '1px',
                              borderRadius: '2px 2px 0 0',
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {h.hour % 3 === 0 ? `${h.hour}h` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Applications Breakdown */}
            <div className="glass-panel" style={{ padding: '1.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, letterSpacing: '-0.01em' }}>
                  <Layers size={17} color="#a855f7" />
                  <span>Top Applications</span>
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  By Active Time
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {topApps.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
                    No application activity logged for this period yet.
                  </p>
                ) : (
                  topApps.map((app, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.appName}</span>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                          {formatSeconds(app.activeSeconds)}{' '}
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>({app.percentage}%)</span>
                        </span>
                      </div>
                      <div style={{ height: '6px', width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(app.percentage, 2))}%`,
                            background: i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : i === 2 ? '#a855f7' : '#f59e0b',
                            borderRadius: '9999px',
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Projects and Category Split */}
        {(activeTab === 'all' || activeTab === 'analytics') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            <ProjectBreakdownCard projects={projects} />
            <CategoryDistributionCard categories={categories} />
          </div>
        )}

        {/* Section 3: Focus & Well-being */}
        {(activeTab === 'all' || activeTab === 'focus') && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            <DeepWorkCard stats={deepWork} />
            <WellbeingCard stats={wellbeing} />
          </div>
        )}

        {/* Section 4: Live SSE Hardware & Process Telemetry */}
        {(activeTab === 'all' || activeTab === 'resources') && (
          <ProcessResourceMonitor liveResources={liveStream.resources} />
        )}
      </div>
    </>
  );
};