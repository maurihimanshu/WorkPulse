import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Trash2, Database, Save, CheckCircle } from 'lucide-react';
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
    if (confirm('Delete this category rule?')) {
      await api.deleteCategory(id);
      loadSettingsAndCategories();
    }
  };

  const handleClearDatabase = async () => {
    if (confirm('DANGER: This will delete ALL logged activities permanently. Are you sure?')) {
      await api.clearAllActivities();
      alert('Activity history cleared successfully.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          System Settings &amp; Rules
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure idle detection heuristics, categorization patterns, and storage policies
        </p>
      </div>

      {/* Monitoring Thresholds Form */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={20} color="#3b82f6" />
          <span>Activity Monitoring Parameters</span>
        </h2>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Idle Inactivity Threshold: {settings.idleThresholdSeconds || 60} seconds
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Seconds without mouse/keyboard movement before user is declared idle.
            </p>
            <input
              type="range"
              min="15"
              max="600"
              step="5"
              value={settings.idleThresholdSeconds || 60}
              onChange={(e) => setSettings({ ...settings, idleThresholdSeconds: e.target.value })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Sampling Poll Interval: {settings.pollIntervalSeconds || '1.0'} seconds
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Frequency at which the background collector samples the active OS window.
            </p>
            <select
              className="select"
              value={settings.pollIntervalSeconds || '1.0'}
              onChange={(e) => setSettings({ ...settings, pollIntervalSeconds: e.target.value })}
              style={{ width: '200px' }}
            >
              <option value="0.5">0.5s (High Precision)</option>
              <option value="1.0">1.0s (Recommended)</option>
              <option value="2.0">2.0s (Low Resource)</option>
              <option value="5.0">5.0s (Battery Saver)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Configuration</span>
            </button>
            {savedSuccess && (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                <CheckCircle size={16} />
                <span>Settings saved successfully!</span>
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Category Rules Management */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Categorization Rules
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Map executable and window title keywords to automatic productivity categories.
        </p>

        {/* Existing Categories Table */}
        <div className="table-container" style={{ marginBottom: '1.5rem' }}>
          <table>
            <thead>
              <tr>
                <th>Color</th>
                <th>Category Name</th>
                <th>Match Keywords</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: c.color }}></span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.matchPattern}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.35rem' }}
                      onClick={() => handleDeleteCategory(c.id)}
                      title="Delete category"
                    >
                      <Trash2 size={14} />
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Design"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Color</label>
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              style={{ width: '45px', height: '38px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Match Keywords (comma separated)</label>
            <input
              type="text"
              className="input"
              style={{ width: '100%' }}
              placeholder="figma,photoshop,illustrator,canva"
              value={newCatPattern}
              onChange={(e) => setNewCatPattern(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            <Plus size={16} />
            <span>Add Rule</span>
          </button>
        </form>
      </div>

      {/* Database Storage Management */}
      <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
          <Database size={20} />
          <span>Local SQLite Storage Management</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          Database file: <code style={{ color: '#60a5fa' }}>data/workpulse.db</code>. All records are stored locally with zero cloud telemetry.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-danger" onClick={handleClearDatabase}>
            <Trash2 size={16} />
            <span>Clear All Activity Logs</span>
          </button>
        </div>
      </div>
    </div>
  );
};