import React from 'react';
import {
  Activity,
  LayoutDashboard,
  Clock,
  Settings as SettingsIcon,
  User,
  Moon,
  Sun,
  Pause,
  Play,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  theme: string;
  onToggleTheme: () => void;
  currentApp: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isMonitoring,
  onToggleMonitoring,
  theme,
  onToggleTheme,
  currentApp,
}) => {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#3b82f6', borderRadius: '8px', padding: '6px' }}>
          <Activity size={20} color="#ffffff" />
        </div>
        <span>WorkPulse</span>
        <span className="nav-brand-badge">v0.2.0</span>
      </div>

      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setCurrentTab('timeline')}
        >
          <Clock size={18} />
          <span>Timeline</span>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentTab('settings')}
        >
          <SettingsIcon size={18} />
          <span>Settings</span>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentTab('profile')}
        >
          <User size={18} />
          <span>Profile</span>
        </button>
      </nav>

      <div className="nav-actions">
        <div className={`monitor-badge ${!isMonitoring ? 'paused' : ''}`}>
          <span className={isMonitoring ? 'live-beacon' : 'paused-beacon'}></span>
          <span>{isMonitoring ? `Recording (${currentApp || 'Idle'})` : 'Monitoring Paused'}</span>
        </div>

        <button
          className={`btn ${isMonitoring ? 'btn-secondary' : 'btn-primary'}`}
          onClick={onToggleMonitoring}
          title={isMonitoring ? 'Pause monitoring' : 'Resume monitoring'}
        >
          {isMonitoring ? <Pause size={16} /> : <Play size={16} />}
          <span>{isMonitoring ? 'Pause' : 'Resume'}</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onToggleTheme}
          title="Toggle Light/Dark Theme"
          style={{ padding: '0.55rem' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};