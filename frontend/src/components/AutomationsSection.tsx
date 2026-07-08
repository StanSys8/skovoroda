import { useCallback, useEffect, useState } from 'react';
import { api, Automation, RiskLevel } from '../api';
import { useT } from '../i18n';

export default function AutomationsSection(props: {
  projectId: string;
  onChanged?: () => void;
}) {
  const { projectId, onChanged } = props;
  const t = useT();
  const [items, setItems] = useState<Automation[]>([]);
  const [name, setName] = useState('');
  const [instructionUrl, setInstructionUrl] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('read');
  const [morningSync, setMorningSync] = useState(true);
  const [persistent, setPersistent] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.automations.list(projectId).then(setItems).catch(() => setItems([]));
  }, [projectId]);

  useEffect(load, [load]);

  const create = async () => {
    if (!name.trim() || !instructionUrl.trim() || busy) return;
    setBusy(true);
    try {
      await api.automations.create({
        projectId,
        name: name.trim(),
        instructionUrl: instructionUrl.trim(),
        riskLevel,
        morningSync,
        persistent,
      });
      setName('');
      setInstructionUrl('');
      setRiskLevel('read');
      setMorningSync(true);
      setPersistent(false);
      load();
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const badge = (a: Automation) => {
    if (!a.enabled) return t('badgeDisabled');
    if (a.persistent) return t('badgePersistent');
    if (a.morningSync) return t('badgeMorning');
    return t('badgeManual');
  };

  return (
    <>
      <div className="section-title">
        {t('automations')} <span className="rule" />
      </div>

      <div className="automation-form">
        <div className="automation-form-row">
          <input
            placeholder={t('automationName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="grow"
            placeholder={t('instructionUrl')}
            value={instructionUrl}
            onChange={(e) => setInstructionUrl(e.target.value)}
          />
        </div>
        <div className="automation-form-row">
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
          >
            <option value="read">{t('riskRead')}</option>
            <option value="write">{t('riskWrite')}</option>
            <option value="external">{t('riskExternal')}</option>
          </select>
          <label className="check">
            <input
              type="checkbox"
              checked={morningSync}
              onChange={(e) => {
                setMorningSync(e.target.checked);
                if (e.target.checked) setPersistent(false);
              }}
            />
            {t('attachMorning')}
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={persistent}
              onChange={(e) => {
                setPersistent(e.target.checked);
                if (e.target.checked) setMorningSync(false);
              }}
            />
            {t('persistentRoutine')}
          </label>
          <button
            onClick={create}
            disabled={busy || !name.trim() || !instructionUrl.trim()}
          >
            {t('createAutomation')}
          </button>
        </div>
      </div>

      {items.length === 0 && <p className="empty">{t('noAutomations')}</p>}
      {items.map((a) => (
        <div key={a.id} className={`automation ${a.enabled ? '' : 'off'}`}>
          <div className="automation-main">
            <div className="automation-title">
              <strong>{a.name}</strong>
              <span className={`badge ${a.persistent ? 'persistent' : ''}`}>
                {badge(a)}
              </span>
            </div>
            <div className="automation-meta">
              <code>{a.config.instructionUrl}</code>
              <span className="risk">{a.config.riskLevel ?? 'read'}</span>
            </div>
            {a.persistent && a.enabled && (
              <div className="automation-lane">
                {t('persistentLaneHint')}{' '}
                <code>/api/agent/poll?lane=inst:{a.id}</code>
              </div>
            )}
          </div>
          <div className="automation-actions">
            <button
              onClick={async () => {
                await api.automations.run(a.id).catch(() => {});
                onChanged?.();
              }}
            >
              {t('runNow')}
            </button>
            <button
              onClick={async () => {
                await api.automations.update(a.id, { enabled: !a.enabled });
                load();
                onChanged?.();
              }}
            >
              {a.enabled ? t('disable') : t('enable')}
            </button>
            <button
              onClick={async () => {
                if (!window.confirm(t('confirmDeleteAutomation'))) return;
                await api.automations.remove(a.id);
                load();
                onChanged?.();
              }}
            >
              {t('delete')}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
