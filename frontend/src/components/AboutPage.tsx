import { useT } from '../i18n';

const LINKEDIN_URL = 'https://www.linkedin.com/in/stanislav-sysoiev/';

export default function AboutPage(props: { onBack: () => void }) {
  const t = useT();
  return (
    <>
      <button className="back" onClick={props.onBack}>
        {t('backToProjects')}
      </button>

      <div className="about-card">
        <h1>{t('aboutTitle')}</h1>
        <p className="about-text">{t('aboutText')}</p>
        <div className="about-actions">
          <a
            className="about-linkedin"
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
          >
            in&nbsp;·&nbsp;LinkedIn — Stanislav Sysoiev
          </a>
          {/* Заглушка: підключимо справжню сторінку Buy Me a Coffee пізніше */}
          <button className="about-bmc" disabled title={t('comingSoon')}>
            ☕ Buy me a coffee
            <span className="soon">{t('comingSoon')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
