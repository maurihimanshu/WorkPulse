import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Timeline } from './pages/Timeline';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { api } from './api';
import { Heartbeat } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
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
    <div className="app-container">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isMonitoring={isMonitoring}
        onToggleMonitoring={handleToggleMonitoring}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentApp={heartbeat?.appName || ''}
      />

      <main className="main-content">
        {currentTab === 'dashboard' && <Dashboard heartbeat={heartbeat} />}
        {currentTab === 'timeline' && <Timeline />}
        {currentTab === 'settings' && <Settings />}
        {currentTab === 'profile' && <Profile />}
      </main>
    </div>
  );
};

export default App;