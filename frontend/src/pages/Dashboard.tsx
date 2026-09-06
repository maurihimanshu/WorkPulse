import React, { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Coffee,
  TrendingUp,
  Monitor,
  Activity as ActivityIcon,
  Layers,
  Calendar,
} from 'lucide-react';
import { api } from '../api';
import { StatsSummary, TopApp, HourlyStat, CategoryStat, Heartbeat } from '../types';

interface DashboardProps {
  heartbeat: Heartbeat | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ heartbeat }) => {
  const [range, setRange] = useState<'today' | 'yesterday' | '7days' | 'month'>('today');
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [topApps, setTopApps] = useState<TopApp[]>([]);
  const [hourly, setHourly] = useState<HourlyStat[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = () => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (range === 'today') {
      const today = formatDate(now);
      return { start: today, end: today };
    } else if (range === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      return { start: yStr, end: yStr };
    } else if (range === '7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      return { start: formatDate(past), end: formatDate(now) };
    } else {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      return { start: formatDate(past), end: formatDate(now) };
    }
  };

  const loadData = async () => {
    try {
      const { start, end } = getDateRange();
      const [sumRes, appsRes, hourlyRes, catRes] = await Promise.all([
        api.getSummary(start, end),
        api.getTopApps(start, end, 8),
        api.getHourly(start),
        api.getCategoryStats(start, end),
      ]);
      setSummary(sumRes);
      setTopApps(appsRes);
      setHourly(hourlyRes);
      setCategories(catRes);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [range]);

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Find max hourly value for SVG chart scaling
  const maxHourlyVal = Math.max(
    ...hourly.map((h) => (h.activeSeconds || 0) + (h.idleSeconds || 0)),
    3600
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Range Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Productivity Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time activity telemetry &amp; intelligent work metrics
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.35rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {(['today', 'yesterday', '7days', 'month'] as const).map((r) => (
            <button
              key={r}
              className={`btn ${range === r ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', border: 'none' }}
              onClick={() => setRange(r)}
            >
              {r === 'today' ? 'Today' : r === 'yesterday' ? 'Yesterday' : r === '7days' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Live Activity Telemetry Card */}
      <div className="card live-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
            <span className="live-beacon"></span>
            <span>CURRENT FOREGROUND WINDOW</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Process ID: {heartbeat?.processId || 'N/A'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              {heartbeat?.appName || 'System Idle'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '700px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {heartbeat?.windowTitle || 'No active foreground window'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Session</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatSeconds(heartbeat?.currentSessionActiveSeconds || 0)}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Idle Status</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: heartbeat?.isIdle ? '#f59e0b' : '#10b981' }}>
                {heartbeat?.isIdle ? `Idle (${Math.round(heartbeat?.idleSeconds || 0)}s)` : 'Active'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="metric-grid">
        <div className="card metric-card">
          <div className="metric-header">
            <span>Total Active Time</span>
            <Zap size={18} color="#3b82f6" />
          </div>
          <div className="metric-value">{formatSeconds(summary?.totalActiveSeconds || 0)}</div>
          <div className="metric-sub">Focus &amp; engaged computer time</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <span>Total Idle Time</span>
            <Coffee size={18} color="#f59e0b" />
          </div>
          <div className="metric-value">{formatSeconds(summary?.totalIdleSeconds || 0)}</div>
          <div className="metric-sub">Away or inactive duration</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <span>Productivity Score</span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div className="metric-value" style={{ color: (summary?.productivityScore || 0) >= 70 ? '#10b981' : '#f59e0b' }}>
            {summary?.productivityScore || 0}%
          </div>
          <div className="metric-sub">Ratio of productive active usage</div>
        </div>

        <div className="card metric-card">
          <div className="metric-header">
            <span>Top Application</span>
            <Monitor size={18} color="#8b5cf6" />
          </div>
          <div className="metric-value" style={{ fontSize: '1.4rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {summary?.topAppName || 'None'}
          </div>
          <div className="metric-sub">{summary?.activitiesCount || 0} recorded sessions</div>
        </div>
      </div>

      {/* Middle Section: Hourly Chart & Top Apps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Hourly Distribution Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="#3b82f6" />
              <span>Hourly Activity Distribution</span>
            </h3>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2 }}></span> Active
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: 2 }}></span> Idle
              </span>
            </div>
          </div>

          <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '6px', paddingTop: '10px' }}>
            {hourly.map((h) => {
              const activeH = maxHourlyVal > 0 ? (h.activeSeconds / maxHourlyVal) * 180 : 0;
              const idleH = maxHourlyVal > 0 ? (h.idleSeconds / maxHourlyVal) * 180 : 0;
              const totalMins = Math.round((h.activeSeconds + h.idleSeconds) / 60);

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
                        backgroundColor: h.activeSeconds > 0 ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '2px 2px 0 0',
                      }}
                    />
                    {idleH > 0 && (
                      <div
                        style={{
                          width: '100%',
                          height: `${idleH}px`,
                          backgroundColor: '#f59e0b',
                          opacity: 0.8,
                          marginBottom: '1px',
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {h.hour % 3 === 0 ? `${h.hour}h` : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Applications Breakdown */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#8b5cf6" />
              <span>Top Applications</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By Active Duration</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {topApps.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No activity data logged for this period yet.</p>
            ) : (
              topApps.map((app, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.appName}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatSeconds(app.activeSeconds)} ({app.percentage}%)
                    </span>
                  </div>
                  <div style={{ height: '7px', width: '100%', background: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(app.percentage, 2))}%`,
                        background: i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : i === 2 ? '#8b5cf6' : '#f59e0b',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Categories Breakdown Cards */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Category Distribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {categories.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No categories recorded yet.</p>
          ) : (
            categories.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{c.category}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{formatSeconds(c.activeSeconds)}</div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{c.percentage}% of time</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};