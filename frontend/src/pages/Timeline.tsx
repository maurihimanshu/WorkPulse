import React, { useState, useEffect } from 'react';
import { Search, Trash2, Calendar, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { Activity } from '../types';

export const Timeline: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'all'>('today');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const getDateRange = () => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      const today = formatDate(now);
      return { start: today, end: today };
    } else if (dateFilter === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDate(y);
      return { start: yStr, end: yStr };
    } else if (dateFilter === '7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      return { start: formatDate(past), end: formatDate(now) };
    }
    return { start: undefined, end: undefined };
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const res = await api.getActivities(start, end, search, page, 20);
      setActivities(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
    } catch (e) {
      console.error('Error fetching activities:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [page, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadActivities();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this activity log?')) {
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
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Activity Timeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {totalElements} recorded application sessions in database
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={loadActivities} title="Refresh logs">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                placeholder="Search by application or window title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface-hover)', padding: '0.25rem', borderRadius: '8px' }}>
            {(['today', 'yesterday', '7days', 'all'] as const).map((f) => (
              <button
                key={f}
                className={`btn ${dateFilter === f ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', border: 'none' }}
                onClick={() => {
                  setDateFilter(f);
                  setPage(0);
                }}
              >
                {f === 'today' ? 'Today' : f === 'yesterday' ? 'Yesterday' : f === '7days' ? 'Last 7 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="card" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Application</th>
                <th>Window Title</th>
                <th>Category</th>
                <th>Start Time</th>
                <th>Active Duration</th>
                <th>Idle Duration</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading activities...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No activities found matching your criteria.
                  </td>
                </tr>
              ) : (
                activities.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.appName}</td>
                    <td style={{ maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }} title={a.windowTitle}>
                      {a.windowTitle}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                        {a.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {formatDateTime(a.startTime)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#10b981' }}>
                        {formatDuration(a.activeTime)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: a.idleTime > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                        {formatDuration(a.idleTime)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.35rem', borderRadius: '6px' }}
                        title="Delete log"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total entries)
          </span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              style={{ opacity: page <= 0 ? 0.5 : 1, cursor: page <= 0 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{ opacity: page >= totalPages - 1 ? 0.5 : 1, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};