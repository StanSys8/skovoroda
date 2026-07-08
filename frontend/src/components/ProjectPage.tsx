import { useCallback, useEffect, useState } from 'react';
import { api, Note, Project } from '../api';
import { useT } from '../i18n';
import NotificationsFeed from './NotificationsFeed';
import AutomationsSection from './AutomationsSection';

export default function ProjectPage(props: {
  project: Project;
  refreshKey?: number;
  onBack: () => void;
  onChanged?: () => void;
}) {
  const { project, onBack, onChanged } = props;
  const t = useT();
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadNotes = useCallback(() => {
    api.notes.list(project.id).then(setNotes).catch(() => setNotes([]));
  }, [project.id]);

  useEffect(loadNotes, [loadNotes]);

  const addNote = async () => {
    const content = draft.trim();
    if (!content) return;
    await api.notes.create(project.id, content);
    setDraft('');
    loadNotes();
  };

  const saveEdit = async (id: string) => {
    const content = editText.trim();
    if (content) await api.notes.update(id, { content });
    setEditingId(null);
    loadNotes();
  };

  return (
    <>
      <button className="back" onClick={onBack}>{t('backToProjects')}</button>

      <div className="project-head">
        <h1>{project.name}</h1>
        <p>{project.description}</p>
        <div className="project-links">
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              {t('repository')}
            </a>
          )}
          {project.prodUrl && (
            <a href={project.prodUrl} target="_blank" rel="noreferrer">
              {t('production')}
            </a>
          )}
        </div>
      </div>

      <div className="section-title">{t('notes')} <span className="rule" /></div>

      <div className="note-form">
        <textarea
          placeholder={t('notePlaceholder')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addNote();
          }}
        />
        <button onClick={addNote}>{t('add')}</button>
      </div>

      {notes.length === 0 && <p className="empty">{t('noNotes')}</p>}
      {notes.map((n) => (
        <div key={n.id} className={`note ${n.pinned ? 'pinned' : ''}`}>
          {editingId === n.id ? (
            <textarea
              className="note-content note-edit"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="note-content">{n.content}</div>
          )}
          <div className="note-actions">
            {editingId === n.id ? (
              <>
                <button onClick={() => saveEdit(n.id)}>{t('save')}</button>
                <button onClick={() => setEditingId(null)}>{t('cancel')}</button>
              </>
            ) : (
              <>
                <button
                  onClick={async () => {
                    await api.notes.update(n.id, { pinned: !n.pinned });
                    loadNotes();
                  }}
                  title={n.pinned ? t('unpin') : t('pin')}
                >
                  {n.pinned ? '★' : '☆'}
                </button>
                <button
                  onClick={() => {
                    setEditingId(n.id);
                    setEditText(n.content);
                  }}
                >
                  {t('edit')}
                </button>
                <button
                  onClick={async () => {
                    await api.notes.remove(n.id);
                    loadNotes();
                  }}
                >
                  {t('delete')}
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      <AutomationsSection projectId={project.id} onChanged={onChanged} />

      <div className="section-title">
        {t('projectNotifications')} <span className="rule" />
        <button
          className="link-btn"
          onClick={async () => {
            await api.notifications.markAllRead(project.id);
            setRefreshKey((k) => k + 1);
          }}
        >
          {t('markAllRead')}
        </button>
      </div>
      <NotificationsFeed
        projectId={project.id}
        refreshKey={refreshKey + (props.refreshKey ?? 0)}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </>
  );
}
