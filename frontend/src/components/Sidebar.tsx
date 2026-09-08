import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Settings as SettingsIcon,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { UpdateInfo } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentApp: string;
  updateInfo?: UpdateInfo | null;
  onOpenUpdateModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  isMonitoring,
  onToggleMonitoring,
  theme,
  onToggleTheme,
  currentApp,
  updateInfo,
  onOpenUpdateModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'Ctrl+1' },
    { id: 'timeline', label: 'Timeline', icon: Clock, shortcut: 'Ctrl+2' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, shortcut: 'Ctrl+3' },
    { id: 'profile', label: 'Profile', icon: User, shortcut: 'Ctrl+4' },
  ];

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        minWidth: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRight: '1px solid var(--border-glass)',
        padding: collapsed ? '1.25rem 0.6rem' : '1.25rem 1rem',
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), padding 0.25s ease',
        zIndex: 40,
        userSelect: 'none',
      }}
    >
      {/* Top Header & Logo */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            marginBottom: '1.75rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                flexShrink: 0,
                position: 'relative',
                cursor: collapsed && updateInfo?.hasUpdate ? 'pointer' : 'default',
              }}
              onClick={collapsed && updateInfo?.hasUpdate ? onOpenUpdateModal : undefined}
              title={collapsed && updateInfo?.hasUpdate ? `Update available: v${updateInfo.latestVersion}` : undefined}
            >
              <Activity size={20} color="#ffffff" />
              {collapsed && updateInfo?.hasUpdate && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    border: '2px solid var(--bg-surface)',
                  }}
                />
              )}
            </div>

            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                    WorkPulse
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      fontWeight: 600,
                    }}
                  >
                    v0.2.1
                  </span>
                  {updateInfo?.hasUpdate && (
                    <button
                      onClick={onOpenUpdateModal}
                      title={`Update available: v${updateInfo.latestVersion}. Click to view details.`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.18)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '999px',
                        padding: '0.1rem 0.4rem',
                        cursor: 'pointer',
                        lineHeight: 1,
                      }}
                    >
                      <Sparkles size={9} />
                      <span>Update</span>
                    </button>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Enterprise Telemetry</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: collapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem',
              borderRadius: '6px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Collapsed Expand Trigger */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setCollapsed(false)}
              title="Expand Sidebar"
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.4rem',
                borderRadius: '8px',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: collapsed ? '0.65rem' : '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  background: isActive ? 'var(--bg-surface-active)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-surface-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <Icon size={19} color={isActive ? '#3b82f6' : 'currentColor'} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                        padding: '0.1rem 0.3rem',
                        borderRadius: '4px',
                        background: 'var(--border-subtle)',
                      }}
                    >
                      {item.shortcut}
                    </span>
                  </>
                )}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: '3px',
                      borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, #3b82f6 0%, #06b6d4 100%)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer & System Controls */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {/* Monitoring Switch */}
        <div
          onClick={onToggleMonitoring}
          title={isMonitoring ? 'Click to pause monitoring' : 'Click to resume monitoring'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '0.6rem' : '0.6rem 0.8rem',
            borderRadius: '10px',
            background: isMonitoring ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: isMonitoring ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span className={isMonitoring ? 'live-beacon' : 'paused-beacon'} />
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isMonitoring ? '#10b981' : '#f59e0b' }}>
                  {isMonitoring ? 'Recording Active' : 'Paused'}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                  {currentApp ? currentApp : 'Telemetry daemon'}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <div style={{ color: isMonitoring ? '#10b981' : '#f59e0b' }}>
              {isMonitoring ? <Pause size={14} /> : <Play size={14} />}
            </div>
          )}
        </div>

        {/* Theme and Security Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Daemon Verified</span>
            </div>
          )}

          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Glass' : 'Switch to Dark Obsidian'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface-elevated)')}
          >
            {theme === 'dark' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
