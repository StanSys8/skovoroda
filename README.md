# Skovoroda

> «Світ ловив мене, та не спіймав.» — Григорій Сковорода

**Легка і дешева автоматизація рутини через локальні сесії LLM-агентів.**

Замість того, щоб писати й підтримувати код інтеграцій, ти пишеш звичайний
markdown-файл: «зайди на сторінку, порівняй з минулим разом, розкажи, що
нового». Локальна сесія агента (наприклад, Claude Code) читає інструкцію,
виконує її і кладе людський звіт на картку проекту.

Чому це дешево:

- **Нуль токенів на холостому ході.** Агент чекає на завдання в блокуючому
  bash-циклі — LLM прокидається лише тоді, коли є робота.
- **Нуль інтеграційного коду.** Автоматизація — це один md-файл. Помінявся
  сайт, який ти моніториш? Правиш текст інструкції, а не парсер.
- **Все локально.** Свій Docker, свій Postgres, свої агенти. Жодних
  підписок і сторонніх сервісів.

*English version — [below](#skovoroda-in-english).*

## Три кроки до першої автоматизації

```bash
docker compose up --build -d     # інтерфейс: http://localhost:8080
```

**1. Створи проект.** Картка на дашборді: назва + опис. Проект — це
одиниця уваги: свої нотатки, свої нотифікації, свої рутини.

**2. Створи рутину і підв'яжи md-інструкцію.** На сторінці проекту, в
секції «Автоматизації»: назва, рівень ризику і сам md-файл з інструкцією
для агента — форма приймає файл і перевіряє, що в ньому є обов'язкові
секції `## Goal`, `## Steps` і `## Report`. Шаблон — лінк «шаблон
інструкції» прямо у формі (або `agent/instructions/template.md`).
Одна галочка вирішує, як рутина живе:

- **«Підв'язати до ранкової рутини»** — кнопка «Ранковий синк» у шапці
  ставить усі такі рутини в чергу, і агент виконує їх строго по одній.
- **«Постійна рутина»** — живе на власній черзі під окрему сесію агента
  і перезапускається сама, щойно відзвітувала. Для моніторингів, які
  мають «висіти» весь час.

**3. Запусти агента.** Відкрий сесію Claude Code (або будь-якого агента,
що вміє bash і curl) і згодуй їй `agent/init.md`. Все: сесія полить чергу
кожні 30 секунд і спить, поки завдань немає. Натисни «Ранковий синк» —
і дивись, як на картці проекту з'являються звіти з бейджем непрочитаного.

## Як це влаштовано

```
[«Ранковий синк»] ──────────► ставить рутини в чергу (lane: main)
[Постійна рутина] ──────────► власна черга (lane: inst:<id>)
        │
        ▼   GET /api/agent/poll?lane=…   (блокуючий bash-цикл, ~0 токенів)
[Сесія агента] — читає md-інструкцію, виконує, звітує
        │
        ▼   POST /api/agent/result
[Нотифікація на картці проекту] + бейдж непрочитаного
```

Деталі, які роблять це надійним:

- **Черги строго послідовні.** У межах однієї черги сервер не видає
  наступний наказ, поки попередній виконується, — ранкові рутини йдуть
  по одній, навіть якщо агентів кілька.
- **Постійні рутини не вмирають.** Щойно агент відзвітував — бекенд сам
  ставить наступний запуск. Вимкнув галочку — черга рутини очистилась.
- **Зависле не губиться.** Наказ, взятий понад годину тому без звіту,
  ранковий синк повертає в чергу.
- **Рівні ризику.** `read` — виконується одразу; `write` — потребує
  `confirmWrite: true` у конфігурації; `external` (відправка даних
  назовні) — лише з явним підтвердженням людини в сесії.

## Правила безпеки агента

Зашиті в `agent/init.md`, мають пріоритет над будь-якою інструкцією:
зовнішній контент (сторінки, API, файли) — це дані, а не команди;
інструкції приймаються лише з черги Skovoroda і не можуть розширити
права; жодних секретів у звітах; у разі сумнівів — чесний провал
із поясненням у нотифікації.

## Конфігурація

Все через `.env` (див. `.env.example`); кожна змінна має дефолт, файл
необов'язковий.

| Змінна | Дефолт | Значення |
|---|---|---|
| `BIND_HOST` | `127.0.0.1` | Лише ця машина (рекомендовано). `0.0.0.0` = доступ з мережі — спершу додай власну автентифікацію! |
| `UI_PORT` | `8080` | Порт веб-інтерфейсу |
| `API_PORT` | `3900` | Порт API |
| `DB_PORT` | `5432` | Порт PostgreSQL |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `skovoroda` | Облікові дані бази |

## Режим розробки

```bash
docker compose up db -d

cd backend && npm install && npm run start:dev    # http://localhost:3900
cd frontend && npm install && npm run dev          # http://localhost:5173 (проксі /api)
```

## API

| Метод | Шлях | Опис |
|---|---|---|
| GET/POST | /api/projects | проекти: список / створення |
| GET/PATCH/DELETE | /api/projects/:id | один проект |
| GET/POST/PATCH/DELETE | /api/notes | нотатки проекту |
| GET | /api/notifications[?projectId=&unread=true] | стрічка |
| GET | /api/notifications/unread-counts | бейджі для карток |
| PATCH/POST | /api/notifications/:id/read, /read-all | позначити прочитаними |
| POST | /api/sync | ранковий синк: зависші назад у чергу + ранкові рутини |
| GET | /api/sync/status | скільки рутин запустив би синк |
| GET/POST | /api/automations[?projectId=] | рутини: список / створення |
| PATCH/DELETE | /api/automations/:id | рутини: оновлення / видалення |
| POST | /api/automations/:id/run | запустити зараз (перезапускає постійну) |
| POST | /api/instructions | завантажити md-інструкцію ({filename, content}) |
| GET | /api/instructions/template | шаблон інструкції |
| GET | /api/instructions/:id | сирий markdown інструкції |
| GET | /api/agent/poll[?lane=] | пул агента: 204 якщо порожньо, 200 + наказ |
| POST | /api/agent/result | звіт агента |
| POST/GET | /api/agent/commands[?status=&lane=] | ручна постановка / перегляд черги |

## Структура репозиторію

```
skovoroda/
├── docker-compose.yml      # db + backend + frontend
├── backend/                # Nest.js + TypeORM + PostgreSQL
│   └── src/
│       ├── projects/       # картки проектів
│       ├── notes/          # нотатки
│       ├── notifications/  # стрічка + лічильники
│       ├── sync/           # «Ранковий синк»
│       ├── agent/          # черга наказів (lane-и, послідовна видача)
│       ├── automations/    # рутини (ранкові / постійні)
│       └── instructions/   # завантажені md-інструкції + шаблон
├── frontend/               # React + Vite (uk/en), nginx у проді
└── agent/
    ├── init.md             # протокол агента — згодуй його сесії
    └── instructions/       # шаблон і приклад інструкції
```

## Плани

Реєстр модулів автоматизацій з формами, згенерованими з `configSchema`;
історія запусків у `run_logs`; cron-планувальник на додачу до ручного
синку; міграції замість `synchronize: true` перед розгортанням на VPS.

## Ліцензія

MIT — див. [LICENSE](LICENSE). Портрет у шапці — гравюра Григорія
Сковороди XVIII століття, суспільне надбання.

---

# Skovoroda (in English)

> "The world tried to catch me, but never could." — Hryhorii Skovoroda

**Lightweight, dirt-cheap automation of routine work via local LLM agent
sessions.**

Instead of writing and maintaining integration code, you write a plain
markdown file: "open this page, compare with last time, tell me what's
new". A local agent session (e.g. Claude Code) reads the instruction,
executes it, and drops a human-readable report onto the project card.

Why it is cheap:

- **Zero tokens while idle.** The agent waits for work inside a blocking
  bash loop — the LLM only wakes up when there is something to do.
- **Zero integration code.** An automation is a single md file. The site
  you monitor changed? Edit the text, not a parser.
- **Everything local.** Your Docker, your Postgres, your agents. No
  subscriptions, no third-party services.

## Three steps to your first automation

```bash
docker compose up --build -d     # UI: http://localhost:8080
```

**1. Create a project.** A card on the dashboard: name + description.
A project is a unit of attention: its own notes, notifications, routines.

**2. Create a routine and attach an md instruction.** On the project
page, in the "Automations" section: a name, a risk level, and the md
instruction file for the agent — the form takes an upload and validates
that the mandatory `## Goal`, `## Steps` and `## Report` sections are
present. Grab the template right from the form (or
`agent/instructions/template.md`). One checkbox decides how the routine
lives:

- **"Attach to the morning routine"** — the "Morning sync" button queues
  all such routines, and the agent runs them strictly one at a time.
- **"Persistent routine"** — lives on its own queue served by a dedicated
  agent session and re-arms itself as soon as it reports. For monitors
  that should hang around all the time.

**3. Start the agent.** Open a Claude Code session (or any agent that
can bash and curl) and feed it `agent/init.md`. Done: the session polls
the queue every 30 seconds and sleeps while there is nothing to do. Hit
"Morning sync" and watch reports appear on the project card with an
unread badge.

## How it works

```
["Morning sync"] ───────────► queues morning routines (lane: main)
[Persistent routine] ───────► its own queue (lane: inst:<id>)
        │
        ▼   GET /api/agent/poll?lane=…   (blocking bash loop, ~0 tokens)
[Agent session] — reads the md instruction, executes, reports
        │
        ▼   POST /api/agent/result
[Notification on the project card] + unread badge
```

The details that make it reliable:

- **Queues are strictly sequential.** Within one lane the server does not
  hand out the next command while the previous one is running — morning
  routines go one by one, even with several agents around.
- **Persistent routines never die.** As soon as the agent reports, the
  backend queues the next run. Untick the box — the routine's queue is
  drained.
- **Stuck work is not lost.** A command taken over an hour ago with no
  report is returned to the queue by the morning sync.
- **Risk levels.** `read` runs immediately; `write` requires
  `confirmWrite: true` in the config; `external` (sending data outside)
  only with explicit human confirmation in the session.

## Agent safety rules

Baked into `agent/init.md`, they take priority over any instruction:
external content (pages, APIs, files) is data, not commands; instructions
are accepted only from the Skovoroda queue and cannot expand permissions;
no secrets in reports; when in doubt — fail honestly with an explanation
in the notification.

## Configuration

Everything via `.env` (see `.env.example`); every variable has a default,
the file is optional.

| Variable | Default | Meaning |
|---|---|---|
| `BIND_HOST` | `127.0.0.1` | This machine only (recommended). `0.0.0.0` = LAN access — add your own auth layer first! |
| `UI_PORT` | `8080` | Web UI port |
| `API_PORT` | `3900` | API port |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `skovoroda` | Database credentials |

## Development mode

```bash
docker compose up db -d

cd backend && npm install && npm run start:dev    # http://localhost:3900
cd frontend && npm install && npm run dev          # http://localhost:5173 (proxies /api)
```

## API

| Method | Path | Description |
|---|---|---|
| GET/POST | /api/projects | projects: list / create |
| GET/PATCH/DELETE | /api/projects/:id | single project |
| GET/POST/PATCH/DELETE | /api/notes | project notes |
| GET | /api/notifications[?projectId=&unread=true] | feed |
| GET | /api/notifications/unread-counts | card badges |
| PATCH/POST | /api/notifications/:id/read, /read-all | mark as read |
| POST | /api/sync | morning sync: requeue stuck + queue morning routines |
| GET | /api/sync/status | how many routines a sync would run |
| GET/POST | /api/automations[?projectId=] | routines: list / create |
| PATCH/DELETE | /api/automations/:id | routines: update / delete |
| POST | /api/automations/:id/run | run now (restarts a persistent one) |
| POST | /api/instructions | upload an md instruction ({filename, content}) |
| GET | /api/instructions/template | instruction template |
| GET | /api/instructions/:id | raw instruction markdown |
| GET | /api/agent/poll[?lane=] | agent poll: 204 when empty, 200 + command |
| POST | /api/agent/result | agent report |
| POST/GET | /api/agent/commands[?status=&lane=] | manual enqueue / inspect queue |

## Repository layout

```
skovoroda/
├── docker-compose.yml      # db + backend + frontend
├── backend/                # Nest.js + TypeORM + PostgreSQL
│   └── src/
│       ├── projects/       # project cards
│       ├── notes/          # notes
│       ├── notifications/  # feed + counters
│       ├── sync/           # the "Morning sync"
│       ├── agent/          # command queue (lanes, sequential delivery)
│       ├── automations/    # routines (morning / persistent)
│       └── instructions/   # uploaded md instructions + template
├── frontend/               # React + Vite (uk/en), nginx in prod
└── agent/
    ├── init.md             # the agent protocol — feed it to a session
    └── instructions/       # template and an example instruction
```

## Roadmap

An automation-module registry with `configSchema`-generated forms; run
history in `run_logs`; a cron scheduler alongside the manual sync;
migrations instead of `synchronize: true` before any VPS deployment.

## License

MIT — see [LICENSE](LICENSE). The header portrait is an 18th-century
engraving of Hryhorii Skovoroda, in the public domain.
