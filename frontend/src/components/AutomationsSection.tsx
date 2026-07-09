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
  const [file, setFile] = useState<{ name: string; content: string } | null>(
    null,
  );
  const [fileKey, setFileKey] = useState(0);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('read');
  const [morningSync, setMorningSync] = useState(true);
  const [persistent, setPersistent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.automations.list(projectId).then(setItems).catch(() => setItems([]));
  }, [projectId]);

  useEffect(load, [load]);

  const pickFile = (f: File | undefined) => {
    setError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setFile({ name: f.name, content: String(reader.result ?? '') });
    reader.readAsText(f);
  };

  const create = async () => {
    if (!name.trim() || !file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await api.instructions.upload(file.name, file.content);
      await api.automations.create({
        projectId,
        name: name.trim(),
        instructionUrl: uploaded.url,
        riskLevel,
        morningSync,
        persistent,
        payload: { instructionName: uploaded.filename },
      });
      setName('');
      setFile(null);
      setFileKey((k) => k + 1); // скидає <input type="file">
      setRiskLevel('read');
      setMorningSync(true);
      setPersistent(false);
      load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
          <label className="file-label grow">
            <input
              key={fileKey}
              type="file"
              accept=".md,text/markdown"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            <span className={file ? 'file-name' : 'file-placeholder'}>
              {file ? file.name : t('instructionFile')}
            </span>
          </label>
          <a
            className="template-link"
            href={api.instructions.templateUrl}
            download="skovoroda-instruction-template.md"
          >
            {t('downloadTemplate')}
          </a>
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
          <button onClick={create} disabled={busy || !name.trim() || !file}>
            {t('createAutomation')}
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
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
              <code>
                {typeof a.config.instructionName === 'string'
                  ? a.config.instructionName
                  : a.config.instructionUrl}
              </code>
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
            {a.persistent ? (
              <a
                className="init-dl"
                href={api.automations.initUrl(a.id)}
                download={`skovoroda-init-${a.id}.md`}
                title={t('downloadInitTitle')}
              >
                {t('downloadInit')}
              </a>
            ) : (
              <a
                className="init-dl"
                href={api.automations.defaultInitUrl}
                download="skovoroda-init.md"
                title={t('downloadDefaultInitTitle')}
              >
                {t('downloadDefaultInit')}
              </a>
            )}
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
