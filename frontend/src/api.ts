import {
  Activity,
  Heartbeat,
  StatsSummary,
  HourlyStat,
  TopApp,
  CategoryStat,
  Category,
  UserProfile,
} from './types';

const API_BASE = window.location.port === '5173' ? 'http://localhost:9876/api' : '/api';

export const api = {
  async getHeartbeat(): Promise<Heartbeat> {
    const res = await fetch(`${API_BASE}/ingest/heartbeat`);
    if (!res.ok) throw new Error('Failed to fetch heartbeat');
    return res.json();
  },

  async getControlStatus(): Promise<{ isMonitoring: boolean }> {
    const res = await fetch(`${API_BASE}/control/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async toggleMonitoring(): Promise<{ isMonitoring: boolean }> {
    const res = await fetch(`${API_BASE}/control/toggle`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle monitoring');
    return res.json();
  },

  async getSummary(startDate?: string, endDate?: string): Promise<StatsSummary> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`${API_BASE}/stats/summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  async getTopApps(startDate?: string, endDate?: string, limit = 8): Promise<TopApp[]> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('limit', limit.toString());
    const res = await fetch(`${API_BASE}/stats/top-apps?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch top apps');
    return res.json();
  },

  async getHourly(date?: string): Promise<HourlyStat[]> {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    const res = await fetch(`${API_BASE}/stats/hourly?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch hourly stats');
    return res.json();
  },

  async getCategoryStats(startDate?: string, endDate?: string): Promise<CategoryStat[]> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`${API_BASE}/stats/categories?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch category stats');
    return res.json();
  },

  async getDeepWork(startDate?: string, endDate?: string): Promise<import('./types').DeepWorkStats> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`${API_BASE}/stats/deep-work?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch deep work stats');
    return res.json();
  },

  async getProjects(startDate?: string, endDate?: string, limit = 6): Promise<import('./types').ProjectBreakdown[]> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('limit', limit.toString());
    const res = await fetch(`${API_BASE}/stats/projects?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch project breakdown');
    return res.json();
  },

  async getWellbeing(startDate?: string, endDate?: string): Promise<import('./types').WellbeingStats> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`${API_BASE}/stats/wellbeing?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch wellbeing stats');
    return res.json();
  },

  async downloadCsvExport(startDate?: string, endDate?: string): Promise<void> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const res = await fetch(`${API_BASE}/stats/export?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workpulse-report-${startDate || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async getActivities(
    startDate?: string,
    endDate?: string,
    search?: string,
    page = 0,
    size = 20
  ): Promise<{ content: Activity[]; totalPages: number; totalElements: number }> {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (search) params.set('search', search);
    params.set('page', page.toString());
    params.set('size', size.toString());
    const res = await fetch(`${API_BASE}/activities?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch activities');
    return res.json();
  },

  async deleteActivity(id: string): Promise<void> {
    await fetch(`${API_BASE}/activities/${id}`, { method: 'DELETE' });
  },

  async clearAllActivities(): Promise<void> {
    await fetch(`${API_BASE}/activities`, { method: 'DELETE' });
  },

  async getProfile(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async getSettings(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settings: Record<string, string>): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/settings/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async saveCategory(cat: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/settings/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat),
    });
    if (!res.ok) throw new Error('Failed to save category');
    return res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    await fetch(`${API_BASE}/settings/categories/${id}`, { method: 'DELETE' });
  },

  async getCurrentResources(): Promise<import('./types').SystemResourceSummary> {
    const res = await fetch(`${API_BASE}/stats/resources/current`);
    if (!res.ok) throw new Error('Failed to fetch current resources');
    return res.json();
  },

  async getResourceHogs(): Promise<import('./types').ProcessResource[]> {
    const res = await fetch(`${API_BASE}/stats/resources/hogs`);
    if (!res.ok) throw new Error('Failed to fetch resource hogs');
    return res.json();
  },
};