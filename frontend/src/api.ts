export type ProjectStatus = 'active' | 'paused' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  repoUrl: string | null;
  prodUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  projectId: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RiskLevel = 'read' | 'write' | 'external';

export interface Automation {
  id: string;
  projectId: string;
  name: string;
  enabled: boolean;
  morningSync: boolean;
  persistent: boolean;
  config: { instructionUrl?: string; riskLevel?: RiskLevel } & Record<
    string,
    unknown
  >;
  schedule: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  level: NotificationLevel;
  read: boolean;
  source: string;
  projectId: string | null;
  createdAt: string;
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  projects: {
    list: () => http<Project[]>('/api/projects'),
    create: (data: { name: string; description?: string }) =>
      http<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) => http<Project>(`/api/projects/${id}`),
    update: (id: string, patch: Partial<Project>) =>
      http<Project>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
  },
  notes: {
    list: (projectId: string) =>
      http<Note[]>(`/api/notes?projectId=${projectId}`),
    create: (projectId: string, content: string) =>
      http<Note>('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ projectId, content }),
      }),
    update: (id: string, patch: Partial<Pick<Note, 'content' | 'pinned'>>) =>
      http<Note>(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    remove: (id: string) =>
      http<{ deleted: boolean }>(`/api/notes/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list: (projectId?: string) =>
      http<AppNotification[]>(
        projectId
          ? `/api/notifications?projectId=${projectId}`
          : '/api/notifications',
      ),
    unreadCounts: () =>
      http<Record<string, number>>('/api/notifications/unread-counts'),
    markRead: (id: string) =>
      http<AppNotification>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllRead: (projectId?: string) =>
      http<{ ok: boolean }>(
        projectId
          ? `/api/notifications/read-all?projectId=${projectId}`
          : '/api/notifications/read-all',
        { method: 'POST' },
      ),
  },
  automations: {
    list: (projectId: string) =>
      http<Automation[]>(`/api/automations?projectId=${projectId}`),
    create: (data: {
      projectId: string;
      name: string;
      instructionUrl: string;
      riskLevel?: RiskLevel;
      morningSync?: boolean;
      persistent?: boolean;
    }) =>
      http<Automation>('/api/automations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      patch: Partial<{
        name: string;
        instructionUrl: string;
        riskLevel: RiskLevel;
        morningSync: boolean;
        persistent: boolean;
        enabled: boolean;
      }>,
    ) =>
      http<Automation>(`/api/automations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    remove: (id: string) =>
      http<{ deleted: boolean }>(`/api/automations/${id}`, {
        method: 'DELETE',
      }),
    run: (id: string) =>
      http<unknown>(`/api/automations/${id}/run`, { method: 'POST' }),
  },
  sync: {
    run: () =>
      http<{ enqueued: number; requeued: number; skipped: number }>(
        '/api/sync',
        { method: 'POST' },
      ),
    status: () => http<{ available: number }>('/api/sync/status'),
  },
};
