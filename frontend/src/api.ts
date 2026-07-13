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
  intervalMinutes: number;
  config: { instructionUrl?: string; riskLevel?: RiskLevel } & Record<
    string,
    unknown
  >;
  schedule: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationLevel =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'security';

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

// Shared secret baked in at build time (VITE_API_KEY). Sent on every
// request so the backend guard accepts us; a cross-origin page cannot read
// this bundle, so it cannot forge the header. Empty in unauthenticated dev.
const API_KEY = (import.meta.env.VITE_API_KEY as string | undefined) ?? '';

function authHeaders(): Record<string, string> {
  return API_KEY ? { 'X-API-Key': API_KEY } : {};
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let message = text || res.statusText;
    try {
      const body = JSON.parse(text);
      if (typeof body.message === 'string') message = body.message;
      else if (Array.isArray(body.message)) message = body.message.join('; ');
    } catch {
      // не JSON — лишаємо як є
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// Downloads must carry the API key too, so we fetch with headers and save
// a blob — a plain <a download> navigation cannot set request headers and
// would be rejected by the guard.
export async function downloadFile(url: string, filename: string) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
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
    remove: (id: string) =>
      http<{ deleted: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
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
    remove: (id: string) =>
      http<{ deleted: boolean }>(`/api/notifications/${id}`, {
        method: 'DELETE',
      }),
    clear: (projectId?: string) =>
      http<{ deleted: number }>(
        projectId
          ? `/api/notifications/clear?projectId=${projectId}`
          : '/api/notifications/clear',
        { method: 'POST' },
      ),
  },
  instructions: {
    upload: (filename: string, content: string) =>
      http<{ id: string; filename: string; url: string }>(
        '/api/instructions',
        { method: 'POST', body: JSON.stringify({ filename, content }) },
      ),
    templateUrl: '/api/instructions/template',
    prune: () =>
      http<{ deleted: number }>('/api/instructions/prune', { method: 'POST' }),
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
      intervalMinutes?: number;
      payload?: Record<string, unknown>;
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
        intervalMinutes: number;
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
    initUrl: (id: string) => `/api/automations/${id}/init`,
    defaultInitUrl: '/api/agent/init',
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
