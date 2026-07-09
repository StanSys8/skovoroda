import { useEffect, useState } from 'react';
import { useT } from '../i18n';

/**
 * GitHub-style destructive confirmation: the user must type the exact
 * project name before the delete button unlocks.
 */
export default function DeleteProjectModal(props: {
  projectName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const { projectName, onCancel, onConfirm } = props;
  const t = useT();
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const matches = typed.trim() === projectName;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const confirm = async () => {
    if (!matches || busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        className="modal danger"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{t('deleteProject')}</h2>
        <p className="modal-warning">{t('deleteProjectWarning')}</p>
        <p className="modal-prompt">
          {t('deleteConfirmPrompt')} <code>{projectName}</code>
        </p>
        <input
          autoFocus
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm();
          }}
        />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            {t('cancel')}
          </button>
          <button
            className="btn-danger"
            onClick={confirm}
            disabled={!matches || busy}
          >
            {busy ? t('deleting') : t('deleteConfirmButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
