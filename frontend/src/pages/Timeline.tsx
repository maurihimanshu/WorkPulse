import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { api } from '../api';
import { Activity } from '../types';
import { formatLocalDate } from '../utils/dateUtils';

export const Timeline: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'all'>('today');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (dateFilter === 'today') {
      const today = formatLocalDate(now);
      return { start: today, end: today };
    } else if (dateFilter === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatLocalDate(y);
      return { start: yStr, end: yStr };
    } else if (dateFilter === '7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      return { start: formatLocalDate(past), end: formatLocalDate(now) };
    }
    return { start: undefined, end: undefined };
  }, [dateFilter]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const res = await api.getActivities(start, end, activeSearch, page, 20);
      setActivities(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (e) {
      console.error('Error fetching activities:', e);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, activeSearch, page]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveSearch(search.trim());
  };

  const handleClearSearch = () => {
    setSearch('');
    setActiveSearch('');
    setPage(0);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this activity telemetry record?')) {
      await api.deleteActivity(id);
      loadActivities();
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    if (dateFilter === '7days' || dateFilter === 'all') {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
            Activity Log &amp; Audit Trail
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Historical session telemetry with exact time intervals and active application focus
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
            }}
          >
            {totalElements} total entries
          </span>
          <button className="btn btn-secondary" onClick={loadActivities} title="Refresh logs">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Glass Search and Date Range Control */}
      <div className="glass-panel" style={{ padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                style={{ width: '100%', paddingLeft: '2.4rem', paddingRight: search ? '2.4rem' : '1rem', fontSize: '0.82rem' }}
                placeholder="Search by application or window title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
              Search
            </button>
          </form>

          {/* Date Segmented Control */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-glass)',
              padding: '3px',
              borderRadius: '9px',
            }}
          >
            {(['today', 'yesterday', '7days', 'all'] as const).map((f) => {
              const isSelected = dateFilter === f;
              return (
                <button
                  key={f}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 600 : 500,
                    borderRadius: '7px',
                    border: 'none',
                    background: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => {
                    setDateFilter(f);
                    setPage(0);
                  }}
                >
                  {f === 'today' ? 'Today' : f === 'yesterday' ? 'Yesterday' : f === '7days' ? '7 Days' : 'All Time'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activities Glass Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Application
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Window Title
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Domain Category
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Start Time
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Focus
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Idle
                </th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading telemetry entries...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No activity logs recorded for this timeframe.
                  </td>
                </tr>
              ) : (
                activities.map((a) => (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.8rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {a.appName}
                    </td>
                    <td
                      style={{
                        padding: '0.8rem 1rem',
                        maxWidth: '360px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                      }}
                      title={a.windowTitle}
                    >
                      {a.windowTitle || 'Foreground focus'}
                    </td>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                        }}
                      >
                        {a.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                      {formatDateTime(a.startTime)}
                    </td>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        {formatDuration(a.activeTime)}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 1rem' }}>
                      <span style={{ color: a.idleTime > 0 ? '#f59e0b' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatDuration(a.idleTime)}
                      </span>
                    </td>
                    <td style={{ padding: '0.8rem 1.25rem', textAlign: 'center' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.35rem', borderRadius: '6px' }}
                        title="Delete log entry"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border-glass)',
            background: 'var(--bg-surface-elevated)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total entries)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{ opacity: page <= 0 ? 0.4 : 1, cursor: page <= 0 ? 'not-allowed' : 'pointer', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{ opacity: page >= totalPages - 1 ? 0.4 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};