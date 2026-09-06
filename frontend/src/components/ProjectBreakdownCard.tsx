import React from 'react';
import { FolderGit2, Code, MessageSquare, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { ProjectBreakdown } from '../types';

interface ProjectBreakdownCardProps {
  projects: ProjectBreakdown[];
}

export const ProjectBreakdownCard: React.FC<ProjectBreakdownCardProps> = ({ projects }) => {
  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0m';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getProjectIcon = (name: string, category: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('meet') || lower.includes('collab') || lower.includes('slack')) {
      return <MessageSquare size={15} color="#38bdf8" />;
    }
    if (lower.includes('github') || lower.includes('review') || lower.includes('repo')) {
      return <FolderGit2 size={15} color="#a855f7" />;
    }
    if (lower.includes('task') || lower.includes('jira') || lower.includes('linear')) {
      return <CheckCircle2 size={15} color="#10b981" />;
    }
    if (lower.includes('doc') || lower.includes('notion') || lower.includes('note')) {
      return <FileText size={15} color="#f59e0b" />;
    }
    if (lower.includes('research') || lower.includes('web')) {
      return <Globe size={15} color="#06b6d4" />;
    }
    return <Code size={15} color="#6366f1" />;
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '1rem',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              padding: '0.4rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: '#6366f1',
              display: 'flex',
            }}
          >
            <FolderGit2 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Top Projects &amp; Workspaces
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Context-aware time allocation parsed from window activity
            </p>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          No active project data recorded for this period.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {projects.map((proj, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                  {getProjectIcon(proj.projectName, proj.category)}
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '220px',
                    }}
                    title={proj.projectName}
                  >
                    {proj.projectName}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '0.35rem',
                      backgroundColor: 'var(--bg-card-secondary, rgba(255,255,255,0.05))',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {proj.primaryApp}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatSeconds(proj.activeSeconds)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '35px', textAlign: 'right' }}>
                    {proj.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--border)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(3, proj.percentage))}%`,
                    borderRadius: '3px',
                    backgroundColor:
                      idx === 0
                        ? '#6366f1'
                        : idx === 1
                        ? '#38bdf8'
                        : idx === 2
                        ? '#10b981'
                        : idx === 3
                        ? '#a855f7'
                        : '#f59e0b',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
