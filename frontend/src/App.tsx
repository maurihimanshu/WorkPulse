import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Timeline } from './pages/Timeline';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { api } from './api';
import { Heartbeat } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [heartbeat, setHeartbeat] = useState<Heartbeat | null>(null);

  // Poll heartbeat and control status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const hb = await api.getHeartbeat();
        setHeartbeat(hb);
      } catch (e) {
        // Backend not ready yet
      }

      try {
        const ctrl = await api.getControlStatus();
        setIsMonitoring(ctrl.isMonitoring);
      } catch (e) {
        // Backend not ready yet
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard shortcuts: Ctrl+1..4 for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setCurrentTab('dashboard');
        } else if (e.key === '2') {
          e.preventDefault();
          setCurrentTab('timeline');
        } else if (e.key === '3') {
          e.preventDefault();
          setCurrentTab('settings');
        } else if (e.key === '4') {
          e.preventDefault();
          setCurrentTab('profile');
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          setSidebarCollapsed((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleMonitoring = async () => {
    try {
      const res = await api.toggleMonitoring();
      setIsMonitoring(res.isMonitoring);
    } catch (e) {
      console.error('Failed to toggle monitoring:', e);
    }
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        isMonitoring={isMonitoring}
        onToggleMonitoring={handleToggleMonitoring}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentApp={heartbeat?.appName || ''}
      />

      <div className="main-viewport">
        {currentTab === 'dashboard' && <Dashboard heartbeat={heartbeat} />}
        {currentTab === 'timeline' && <Timeline />}
        {currentTab === 'settings' && <Settings />}
        {currentTab === 'profile' && <Profile />}
      </div>
    </div>
  );
};

export default App;