import { useCallback, useEffect, useState } from 'react';
import { api, Project } from './api';
import {
  detectLang, Lang, LangContext, persistLang, useLang, useT,
} from './i18n';
import { applyTheme, detectTheme, Theme } from './theme';
import Dashboard from './components/Dashboard';
import ProjectPage from './components/ProjectPage';

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {(['en', 'uk'] as Lang[]).map((l) => (
        <button
          key={l}
          className={lang === l ? 'active' : ''}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle(props: { theme: Theme; onToggle: () => void }) {
  const t = useT();
  const { theme, onToggle } = props;
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      aria-label={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
      title={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
    >
      <span className="horizon" />
      <span className="disc" />
    </button>
  );
}

function Shell(props: { theme: Theme; onToggleTheme: () => void }) {
  const t = useT();
  const [projects, setProjects] = useState<Project[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [available, setAvailable] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(async () => {
    try {
      const [p, u, s] = await Promise.all([
        api.projects.list(),
        api.notifications.unreadCounts(),
        api.sync.status(),
      ]);
      setProjects(p);
      setUnread(u);
      setAvailable(s.available);
      setError(null);
    } catch {
      setError(t('backendDown'));
    }
  }, [t]);

  useEffect(() => {
    reload();
  }, [reload, refreshKey]);

  const runSync = async () => {
    setSyncing(true);
    try {
      await api.sync.run();
      setRefreshKey((k) => k + 1);
    } catch {
      setError(t('syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="app">
      <header className="header">
        <div className="brand" onClick={() => setSelectedId(null)}>
          <img
            className="portrait"
            src="/skovoroda.webp"
            alt="Hryhorii Skovoroda"
          />
          <div>
            <div className="wordmark">Skovoroda</div>
            <p className="epigraph">{t('tagline')}</p>
          </div>
        </div>
        <div className="header-actions">
          <LangToggle />
          <ThemeToggle theme={props.theme} onToggle={props.onToggleTheme} />
          <span className="tooltip-wrap">
            <button
              className={`sync-btn ${syncing ? 'running' : ''} ${
                available === 0 ? 'blocked' : ''
              }`}
              onClick={runSync}
              disabled={syncing || available === 0}
            >
              <span className="sun">☉</span>
              {syncing ? t('syncing') : t('sync')}
            </button>
            <span className="tooltip" role="tooltip">
              {available === 0 ? t('syncNoRoutines') : t('syncTooltip')}
            </span>
          </span>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {selected ? (
        <ProjectPage
          project={selected}
          onBack={() => {
            setSelectedId(null);
            setRefreshKey((k) => k + 1);
          }}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      ) : (
        <Dashboard
          projects={projects}
          unread={unread}
          refreshKey={refreshKey}
          onOpen={(id) => setSelectedId(id)}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

export default function App() {
  const [lang, setLangState] = useState<Lang>(detectLang);
  const [theme, setTheme] = useState<Theme>(detectTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setLang = (l: Lang) => {
    persistLang(l);
    setLangState(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <Shell
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    </LangContext.Provider>
  );
}
