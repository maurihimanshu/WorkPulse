import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Trash2, Database, Save, CheckCircle, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '../api';
import { Category } from '../types';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatPattern, setNewCatPattern] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSettingsAndCategories();
  }, []);

  const loadSettingsAndCategories = async () => {
    try {
      const [s, c] = await Promise.all([api.getSettings(), api.getCategories()]);
      setSettings(s || {});
      setCategories(c || []);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Error updating settings:', e);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.saveCategory({
        name: newCatName.trim(),
        color: newCatColor,
        matchPattern: newCatPattern.trim(),
        productive: true,
        weight: 1.0,
      });
      setNewCatName('');
      setNewCatPattern('');
      loadSettingsAndCategories();
    } catch (e) {
      console.error('Error adding category:', e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this classification rule?')) {
      await api.deleteCategory(id);
      loadSettingsAndCategories();
    }
  };

  const handleClearDatabase = async () => {
    if (confirm('DANGER: This will permanently wipe ALL historical telemetry activities from local SQLite. Are you sure?')) {
      await api.clearAllActivities();
      alert('Local activity history cleared successfully.');
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
          System Heuristics &amp; Rule Engine
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
          Configure idle detection heuristics, process categorization patterns, and storage policies
        </p>
      </div>

      {/* Monitoring Thresholds Form */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Sliders size={18} color="#3b82f6" />
          <span>Activity Sampling Parameters</span>
        </h2>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Idle Detection Inactivity Threshold
              </label>
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#3b82f6' }}>
                {settings.idleThresholdSeconds || 60} seconds
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Elapsed interval without mouse or keyboard inputs before declaring state as idle.
            </p>
            <input
              type="range"
              min="15"
              max="600"
              step="5"
              value={settings.idleThresholdSeconds || 60}
              onChange={(e) => setSettings({ ...settings, idleThresholdSeconds: e.target.value })}
              style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Sampling Poll Frequency
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Rate at which the Win32 daemon collects foreground and background process metrics.
            </p>
            <select
              className="select"
              value={settings.pollIntervalSeconds || '1.0'}
              onChange={(e) => setSettings({ ...settings, pollIntervalSeconds: e.target.value })}
              style={{ width: '220px' }}
            >
              <option value="0.5">0.5s (High Precision Telemetry)</option>
              <option value="1.0">1.0s (Enterprise Recommended)</option>
              <option value="2.0">2.0s (Low CPU Footprint)</option>
              <option value="5.0">5.0s (Battery Saver Mode)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>Save Configuration</span>
            </button>
            {savedSuccess && (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 600 }}>
                <CheckCircle size={15} />
                <span>Configuration committed successfully!</span>
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Category Rules Management */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          Categorization &amp; Classification Rules
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          Map executable names and window titles to automatic productivity categories.
        </p>

        {/* Existing Categories Table */}
        <div style={{ overflowX: 'auto', marginBottom: '1.25rem', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Color</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Domain Name</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Matching Keywords</th>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.65rem 1rem' }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                  </td>
                  <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td style={{ padding: '0.65rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.matchPattern}</td>
                  <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.3rem', borderRadius: '6px' }}
                      onClick={() => handleDeleteCategory(c.id)}
                      title="Delete category rule"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Category Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Design"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
              style={{ fontSize: '0.82rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Badge Color</label>
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              style={{ width: '42px', height: '36px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Match Keywords (comma separated)</label>
            <input
              type="text"
              className="input"
              style={{ width: '100%', fontSize: '0.82rem' }}
              placeholder="figma,photoshop,illustrator,canva"
              value={newCatPattern}
              onChange={(e) => setNewCatPattern(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
            <Plus size={15} />
            <span>Add Rule</span>
          </button>
        </form>
      </div>

      {/* Database Storage Management */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderColor: 'rgba(244, 63, 94, 0.25)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)' }}>
          <Database size={18} />
          <span>Local SQLite Storage Management</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          Database file: <code style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>data/workpulse.db</code> (WAL Mode). All telemetry is strictly stored locally with zero network egress.
        </p>

        <div>
          <button className="btn btn-danger" onClick={handleClearDatabase}>
            <Trash2 size={15} />
            <span>Clear Historical Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};