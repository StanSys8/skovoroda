import { useEffect, useState } from 'react';
import { api, AppNotification } from '../api';
import { useT } from '../i18n';

export default function NotificationsFeed(props: {
  projectId?: string;
  refreshKey: number;
  onChanged: () => void;
}) {
  const { projectId, refreshKey, onChanged } = props;
  const t = useT();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    api.notifications
      .list(projectId)
      .then(setItems)
      .catch(() => setItems([]));
  }, [projectId, refreshKey]);

  if (items.length === 0) {
    return <p className="empty">{t('noNotifications')}</p>;
  }

  return (
    <div>
      {items.map((n) => (
        <div
          key={n.id}
          className={`notif ${n.read ? '' : 'unread'} ${
            n.level === 'security' ? 'security' : ''
          }`}
        >
          <span className={`dot ${n.level}`}>
            {n.level === 'security' ? '⚠' : '●'}
          </span>
          <div className="notif-body">
            <strong>{n.title}</strong>
            {n.body && <p>{n.body}</p>}
          </div>
          <time>
            {new Date(n.createdAt).toLocaleString(undefined, {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
          {!n.read && (
            <button
              onClick={async () => {
                await api.notifications.markRead(n.id);
                onChanged();
              }}
            >
              {t('markRead')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
