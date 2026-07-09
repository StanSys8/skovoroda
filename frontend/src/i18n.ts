import { createContext, useCallback, useContext } from 'react';

export type Lang = 'en' | 'uk';

const dict = {
  en: {
    tagline: 'The world tried to catch me, but never could.',
    sync: 'Morning sync',
    syncing: 'Syncing…',
    syncTooltip: 'Runs all available routines one by one',
    syncNoRoutines: 'No routines available yet — nothing to run',
    backendDown: 'Backend unreachable. Check that docker compose is running.',
    syncFailed: 'Sync failed. Check the backend.',
    notifications: 'Notifications',
    projectNotifications: 'Project notifications',
    markAllRead: 'mark all read',
    markRead: 'read',
    clearAll: 'clear',
    deleteNotification: 'delete',
    confirmClearNotifications: 'Delete all notifications shown here?',
    noNotifications: 'Silence. No news — which is news too.',
    backToProjects: '← all projects',
    dangerZone: 'Danger zone',
    deleteProject: 'Delete this project',
    deleteProjectWarning:
      'This permanently deletes the project along with its notes, ' +
      'automations, and notifications. This cannot be undone.',
    deleteConfirmPrompt: 'To confirm, type the project name below:',
    deleteConfirmButton: 'I understand, delete this project',
    deleting: 'Deleting…',
    notes: 'Notes',
    notePlaceholder: 'What must not be forgotten about this project…',
    add: 'Add',
    noNotes: 'Empty so far. Write down the first thought.',
    save: 'save',
    cancel: 'cancel',
    edit: 'edit',
    delete: 'delete',
    pin: 'Pin',
    unpin: 'Unpin',
    repository: 'repository',
    production: 'production',
    updated: 'updated',
    statusActive: 'active',
    statusPaused: 'paused',
    statusArchived: 'archived',
    emptyDashboard: 'No projects yet. Create the first one.',
    newProjectName: 'Project name',
    newProjectDescription: 'Short description (optional)',
    createProject: 'Create project',
    switchToLight: 'Switch to light theme (noon)',
    switchToDark: 'Switch to dark theme (pre-dawn)',
    automations: 'Automations',
    noAutomations: 'No routines yet. Create the first one.',
    automationName: 'Routine name',
    instructionFile: 'Instruction (.md file)',
    downloadTemplate: 'instruction template',
    riskRead: 'read — read only',
    riskWrite: 'write — mutates local data',
    riskExternal: 'external — sends data outside',
    attachMorning: 'Attach to the morning routine',
    persistentRoutine: 'Persistent routine (dedicated agent session)',
    intervalLabel: 'every',
    intervalMinutes: 'min',
    intervalHint: 'gap between runs (0 = back-to-back)',
    everyMinutes: 'every {n} min',
    createAutomation: 'Create routine',
    runNow: 'run now',
    enable: 'enable',
    disable: 'disable',
    badgeMorning: 'morning sync',
    badgePersistent: 'persistent',
    badgeManual: 'manual',
    badgeDisabled: 'disabled',
    downloadInit: '↓ init.md',
    downloadInitTitle: 'Download a ready-to-run init.md for this routine',
    downloadDefaultInit: '↓ default init.md',
    downloadDefaultInitTitle: 'Download the default init.md (main lane)',
    persistentLaneHint: 'Agent session lane:',
    confirmDeleteAutomation: 'Delete this routine?',
    aboutAuthor: 'about',
    aboutTitle: 'About the author',
    aboutText:
      'My name is Stanislav Sysoiev. Skovoroda is my pet project: ' +
      'lightweight, near-zero-cost automation of routine work via local ' +
      'LLM agent sessions. If it proves useful to you — reach out, ' +
      'I would love the feedback.',
  },
  uk: {
    tagline: 'Світ ловив мене, та не спіймав.',
    sync: 'Ранковий синк',
    syncing: 'Синхронізую…',
    syncTooltip: 'Запускає всі доступні рутини по черзі',
    syncNoRoutines: 'Немає доступних рутин — нічого запускати',
    backendDown: 'Бекенд недоступний. Перевір, чи запущено docker compose.',
    syncFailed: 'Синк не вдався. Перевір бекенд.',
    notifications: 'Нотифікації',
    projectNotifications: 'Нотифікації проекту',
    markAllRead: 'прочитати всі',
    markRead: 'прочитано',
    clearAll: 'очистити',
    deleteNotification: 'видалити',
    confirmClearNotifications: 'Видалити всі показані тут нотифікації?',
    noNotifications: 'Тиша. Жодних новин — і це теж новина.',
    backToProjects: '← до всіх проектів',
    dangerZone: 'Небезпечна зона',
    deleteProject: 'Видалити цей проект',
    deleteProjectWarning:
      'Проект буде видалено назавжди разом з нотатками, автоматизаціями ' +
      'та нотифікаціями. Це не можна відмінити.',
    deleteConfirmPrompt: 'Для підтвердження введи назву проекту нижче:',
    deleteConfirmButton: 'Розумію, видалити цей проект',
    deleting: 'Видаляю…',
    notes: 'Нотатки',
    notePlaceholder: 'Що не можна забути про цей проект…',
    add: 'Додати',
    noNotes: 'Поки порожньо. Запиши першу думку.',
    save: 'зберегти',
    cancel: 'скасувати',
    edit: 'редагувати',
    delete: 'видалити',
    pin: 'Закріпити',
    unpin: 'Відкріпити',
    repository: 'репозиторій',
    production: 'продакшн',
    updated: 'оновлено',
    statusActive: 'активний',
    statusPaused: 'на паузі',
    statusArchived: 'архів',
    emptyDashboard: 'Проектів ще немає. Створи перший.',
    newProjectName: 'Назва проекту',
    newProjectDescription: 'Короткий опис (необов’язково)',
    createProject: 'Створити проект',
    switchToLight: 'Перемкнути на світлу тему (полудень)',
    switchToDark: 'Перемкнути на темну тему (передсвітанок)',
    automations: 'Автоматизації',
    noAutomations: 'Рутин ще немає. Створи першу.',
    automationName: 'Назва рутини',
    instructionFile: 'Інструкція (.md файл)',
    downloadTemplate: 'шаблон інструкції',
    riskRead: 'read — лише читання',
    riskWrite: 'write — змінює локальні дані',
    riskExternal: 'external — відправляє дані назовні',
    attachMorning: 'Підв’язати до ранкової рутини',
    persistentRoutine: 'Постійна рутина (окрема сесія агента)',
    intervalLabel: 'кожні',
    intervalMinutes: 'хв',
    intervalHint: 'пауза між запусками (0 = без паузи)',
    everyMinutes: 'кожні {n} хв',
    createAutomation: 'Створити рутину',
    runNow: 'запустити',
    enable: 'увімкнути',
    disable: 'вимкнути',
    badgeMorning: 'ранковий синк',
    badgePersistent: 'постійна',
    badgeManual: 'вручну',
    badgeDisabled: 'вимкнена',
    downloadInit: '↓ init.md',
    downloadInitTitle: 'Завантажити готовий init.md для цієї рутини',
    downloadDefaultInit: '↓ дефолтний init.md',
    downloadDefaultInitTitle: 'Завантажити дефолтний init.md (lane main)',
    persistentLaneHint: 'Lane сесії агента:',
    confirmDeleteAutomation: 'Видалити цю рутину?',
    aboutAuthor: 'про автора',
    aboutTitle: 'Про автора',
    aboutText:
      'Мене звати Станіслав Сисоєв. Skovoroda — мій пет-проєкт: легка ' +
      'і майже безкоштовна автоматизація рутини через локальні сесії ' +
      'LLM-агентів. Якщо проєкт став вам у пригоді — напишіть, буду ' +
      'радий фідбеку.',
  },
} as const;

export type TKey = keyof (typeof dict)['en'];

export const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: 'en', setLang: () => {} });

export function useT() {
  const { lang } = useContext(LangContext);
  // Stable per language: components hang effects off `t` (e.g. App's
  // reload), so a fresh function every render would refetch in a loop.
  return useCallback((key: TKey) => dict[lang][key], [lang]);
}

export function useLang() {
  return useContext(LangContext);
}

export function detectLang(): Lang {
  const saved = localStorage.getItem('skovoroda.lang');
  if (saved === 'en' || saved === 'uk') return saved;
  return 'uk';
}

export function persistLang(lang: Lang) {
  localStorage.setItem('skovoroda.lang', lang);
}
