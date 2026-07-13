import { useState } from 'react';
import { api, Project } from '../api';
import { useT } from '../i18n';
import NotificationsFeed from './NotificationsFeed';

export default function Dashboard(props: {
  projects: Project[];
  unread: Record<string, number>;
  refreshKey: number;
  onOpen: (id: string) => void;
  onChanged: () => void;
}) {
  const { projects, unread, refreshKey, onOpen, onChanged } = props;
  const t = useT();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pruneMsg, setPruneMsg] = useState<string | null>(null);
  const [pruning, setPruning] = useState(false);

  const pruneInstructions = async () => {
    if (pruning) return;
    setPruning(true);
    try {
      const { deleted } = await api.instructions.prune();
      setPruneMsg(
        deleted > 0
          ? t('prunedSome').replace('{n}', String(deleted))
          : t('prunedNone'),
      );
    } finally {
      setPruning(false);
    }
  };

  const statusLabel: Record<Project['status'], string> = {
    active: t('statusActive'),
    paused: t('statusPaused'),
    archived: t('statusArchived'),
  };

  const createProject = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await api.projects.create({
      name: trimmed,
      description: description.trim(),
    });
    setName('');
    setDescription('');
    onChanged();
  };

  return (
    <>
      {projects.length === 0 && <p className="empty">{t('emptyDashboard')}</p>}

      <div className="grid">
        {projects.map((p) => (
          <div
            key={p.id}
            className="card"
            onClick={() => onOpen(p.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpen(p.id)}
          >
            <div className="card-top">
              <h2>{p.name}</h2>
              {unread[p.id] ? <span className="badge">{unread[p.id]}</span> : null}
            </div>
            <p>{p.description || '—'}</p>
            <div className="card-meta">
              <span className={`status ${p.status}`}>{statusLabel[p.status]}</span>
              <span>
                {t('updated')} {new Date(p.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        <div className="card new-project">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('newProjectName')}
            onKeyDown={(e) => e.key === 'Enter' && createProject()}
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('newProjectDescription')}
            onKeyDown={(e) => e.key === 'Enter' && createProject()}
          />
          <button onClick={createProject} disabled={!name.trim()}>
            {t('createProject')}
          </button>
        </div>
      </div>

      <div className="section-title">
        {t('notifications')} <span className="rule" />
        <button
          className="link-btn"
          onClick={async () => {
            await api.notifications.markAllRead();
            onChanged();
          }}
        >
          {t('markAllRead')}
        </button>
        <button
          className="link-btn danger"
          onClick={async () => {
            if (!window.confirm(t('confirmClearNotifications'))) return;
            await api.notifications.clear();
            onChanged();
          }}
        >
          {t('clearAll')}
        </button>
      </div>
      <NotificationsFeed refreshKey={refreshKey} onChanged={onChanged} />

      <div className="maintenance">
        <button
          className="link-btn"
          onClick={pruneInstructions}
          disabled={pruning}
        >
          {t('pruneInstructions')}
        </button>
        {pruneMsg && <span className="maintenance-msg">{pruneMsg}</span>}
      </div>
    </>
  );
}
