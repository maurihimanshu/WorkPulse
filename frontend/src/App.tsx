import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Timeline } from './pages/Timeline';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { UpdateModal } from './components/UpdateModal';
import { api } from './api';
import { UserProfile, UpdateInfo } from './types';
import { useLiveStream } from './hooks/useLiveStream';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const liveStream = useLiveStream();

  // Load user profile and check for updates on startup
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const p = await api.getProfile();
        setUserProfile(p);
        if (p?.theme === 'light' || p?.theme === 'dark') {
          setTheme(p.theme);
        }
      } catch (err) {
        console.debug('Could not load user profile on boot:', err);
      }
    };
    fetchProfile();

    // Check for software updates on initial boot
    const checkUpdates = async () => {
      try {
        const info = await api.checkUpdate(false);
        setUpdateInfo(info);
      } catch (err) {
        console.debug('Could not check for software updates on boot:', err);
      }
    };
    checkUpdates();
  }, []);

  // Global Keyboard shortcuts: Ctrl+1..4 for navigation, Ctrl+B for sidebar
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
      await api.toggleMonitoring();
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
        isMonitoring={liveStream.isMonitoring}
        onToggleMonitoring={handleToggleMonitoring}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        currentApp={liveStream.heartbeat?.appName || ''}
        updateInfo={updateInfo}
        onOpenUpdateModal={() => setShowUpdateModal(true)}
      />

      <div className="main-viewport">
        {currentTab === 'dashboard' && (
          <Dashboard
            heartbeat={liveStream.heartbeat}
            liveStream={liveStream}
            targetHours={userProfile?.dailyGoalHours || 6}
          />
        )}
        {currentTab === 'timeline' && <Timeline />}
        {currentTab === 'settings' && <Settings />}
        {currentTab === 'profile' && <Profile onProfileUpdated={setUserProfile} />}
      </div>

      <UpdateModal
        updateInfo={updateInfo}
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </div>
  );
};

export default App;