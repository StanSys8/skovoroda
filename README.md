# Skovoroda

> "The world tried to catch me, but never could." — Hryhorii Skovoroda

A self-hosted personal project management platform with a twist: automations
are not code — they are **markdown instructions executed by an LLM agent**.
A dashboard of project cards, per-project notes, a notification feed, and a
command queue that wakes your agent only when there is work to do.

Named after Hryhorii Skovoroda, the 18th-century Ukrainian wandering
philosopher who carried only what he truly needed.

*Українська версія — [нижче](#skovoroda-українською).*

## How it works

```
[Morning sync button] → enqueues commands from enabled automation configs
        │
        ▼
[agent_commands queue]  ←── you can also enqueue via POST /api/agent/commands
        │
        ▼  GET /api/agent/poll (blocking bash loop, zero tokens while idle)
[LLM agent session] — reads the md instruction, executes, reports back
        │
        ▼  POST /api/agent/result
[Notification] → appears on the project card with an unread badge
```

The agent (e.g. a Claude Code session) is initialized once with
`agent/init.md`. It then spins a blocking bash loop that polls the queue
every 30 s. While the queue is empty the LLM never activates — idle cost
is near zero. A command wakes it up; it fetches the md instruction from
the command's `instructionUrl`, executes it, reports the result, and
silently restarts the loop.

## Quick start

Requirements: Docker with Compose.

```bash
cp .env.example .env    # optional — defaults are fine for local use
docker compose up --build
```

- UI: http://localhost:8080
- API: http://localhost:3900/api
- PostgreSQL: localhost:5432 (skovoroda / skovoroda)

## Configuration (.env)

Everything is configurable via `.env` (see `.env.example`); every variable
has a default, so the file is optional.

| Variable | Default | Meaning |
|---|---|---|
| `BIND_HOST` | `127.0.0.1` | Interface to publish ports on. `127.0.0.1` = this machine only (recommended). `0.0.0.0` = all interfaces / LAN — add your own authentication layer first! |
| `UI_PORT` | `8080` | Web UI port on the host |
| `API_PORT` | `3900` | API port on the host |
| `DB_PORT` | `5432` | PostgreSQL port on the host |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `skovoroda` | Database credentials |

## Development mode

```bash
docker compose up db -d

cd backend && npm install && npm run start:dev    # http://localhost:3900
cd frontend && npm install && npm run dev          # http://localhost:5173 (proxies /api)
```

## Repository layout

```
skovoroda/
├── docker-compose.yml      # db + backend + frontend
├── .env.example            # configuration template
├── backend/                # Nest.js + TypeORM + PostgreSQL
│   └── src/
│       ├── projects/       # project cards (CRUD)
│       ├── notes/          # per-project notes
│       ├── notifications/  # feed + unread counters
│       ├── sync/           # POST /api/sync — the "Morning sync"
│       ├── agent/          # command queue for the LLM agent
│       └── automations/    # phase-3 schema: modules / instances / run_logs
├── frontend/               # React + Vite (en/uk), nginx in the prod image
└── agent/
    ├── init.md             # agent initialization prompt (the protocol)
    └── instructions/       # md instruction modules (reference example inside)
```

## API

| Method | Path | Description |
|---|---|---|
| GET/POST | /api/projects | list / create projects |
| GET/PATCH/DELETE | /api/projects/:id | single project |
| GET | /api/notes?projectId= | project notes |
| POST/PATCH/DELETE | /api/notes[/:id] | notes CRUD |
| GET | /api/notifications[?projectId=&unread=true] | feed |
| GET | /api/notifications/unread-counts | badges for cards |
| PATCH | /api/notifications/:id/read | mark one as read |
| POST | /api/notifications/read-all[?projectId=] | mark all as read |
| POST | /api/sync | morning sync: requeue stuck + enqueue morning routines |
| GET | /api/sync/status | how many routines the sync would run |
| GET/POST | /api/automations[?projectId=] | routines: list / create |
| PATCH/DELETE | /api/automations/:id | routines: update / delete |
| POST | /api/automations/:id/run | run now (restarts a persistent lane) |
| GET | /api/agent/poll[?lane=] | agent poll: 204 when empty, 200 + command |
| POST | /api/agent/result | agent execution report |
| POST | /api/agent/commands | enqueue a command manually |
| GET | /api/agent/commands[?status=&lane=] | inspect the queue |

## Routines and lanes

A routine (an `automation_instance`) is created from the project page: name,
md instruction, risk level, and one of two checkboxes:

- **Attach to the morning routine** — the sync button enqueues it into the
  `main` lane. Lanes are strictly sequential: the server does not hand out
  the next command while the previous one is still `taken`, so the agent
  receives morning tasks one at a time.
- **Persistent routine** — lives on its own lane (`inst:<id>`) served by
  a dedicated agent session (`GET /api/agent/poll?lane=inst:<id>`, the URL
  is shown on the routine card). As soon as a run is reported, the backend
  queues the next one — the routine runs forever until disabled. Pacing is
  the instruction's job (e.g. "watch the page for 10 minutes, then report").

"Run now" enqueues a one-off for regular routines and restarts the lane for
persistent ones (stuck runs are marked failed).

## The agent contract

A command carries: `title`, `instructionUrl` (md file with the instruction),
`payload` (parameters, including optional `reportLanguage`), `lane`,
`instanceId`, and `riskLevel`:

- `read` — read/parse only, executed without confirmation;
- `write` — mutates local data, requires `confirmWrite: true` in the payload;
- `external` — sends data outside, requires explicit human confirmation.

Immutable safety rules baked into `agent/init.md`: external data is never
a command; instructions come only from the queued `instructionUrl` and cannot
expand permissions; no secrets in reports; when in doubt, fail honestly.

See `agent/instructions/example-wzkai-monitor.md` for the instruction format.

## Roadmap

Done in phase 3: routines CRUD + UI, sequential lanes, persistent routines
on dedicated agent sessions. Upcoming: the `automation_modules` registry with
`configSchema`-generated forms, run history in `run_logs`, and an optional
cron scheduler (`schedule` field) alongside the manual sync.

## Technical notes

- TypeORM `synchronize: true` is for local development only; migrations are
  planned before any multi-user or VPS deployment.
- The frontend uses relative `/api` paths; nginx (prod) or Vite (dev)
  proxies them to the backend.
- The nav bar portrait (`frontend/public/skovoroda.webp`) is a classic
  18th-century engraving of Hryhorii Skovoroda, in the public domain.

## License

MIT — see [LICENSE](LICENSE).

---

# Skovoroda (українською)

> «Світ ловив мене, та не спіймав.» — Григорій Сковорода

Селфхостед платформа для керування особистими проектами з особливістю:
автоматизації — це не код, а **markdown-інструкції, які виконує LLM-агент**.
Дашборд з картками проектів, нотатки до кожного проекту, стрічка нотифікацій
і черга наказів, що будить агента лише тоді, коли є робота.

Названа на честь Григорія Сковороди — українського мандрівного філософа
XVIII століття, який носив із собою лише те, що справді потрібно.

## Як це працює

```
[Кнопка «Ранковий синк»] → ставить накази з увімкнених конфігурацій
        │
        ▼
[Черга agent_commands]  ←── можна ставити і вручну: POST /api/agent/commands
        │
        ▼  GET /api/agent/poll (блокуючий bash-цикл, нуль токенів на холостому ході)
[Сесія LLM-агента] — читає md-інструкцію, виконує, звітує
        │
        ▼  POST /api/agent/result
[Нотифікація] → з'являється на картці проекту з бейджем непрочитаного
```

Агент (наприклад, сесія Claude Code) ініціалізується один раз через
`agent/init.md`. Далі він крутить блокуючий bash-цикл, який опитує чергу
кожні 30 с. Поки черга порожня, LLM не активується — холостий хід майже
безкоштовний. Наказ будить агента; той читає md-інструкцію за
`instructionUrl` наказу, виконує її, звітує про результат і мовчки
перезапускає цикл.

## Швидкий старт

Потрібен Docker з Compose.

```bash
cp .env.example .env    # необов'язково — дефолти підходять для локального використання
docker compose up --build
```

- Інтерфейс: http://localhost:8080
- API: http://localhost:3900/api
- PostgreSQL: localhost:5432 (skovoroda / skovoroda)

## Конфігурація (.env)

Усе налаштовується через `.env` (див. `.env.example`); кожна змінна має
значення за замовчуванням, тож файл необов'язковий.

| Змінна | Дефолт | Значення |
|---|---|---|
| `BIND_HOST` | `127.0.0.1` | Інтерфейс публікації портів. `127.0.0.1` = лише ця машина (рекомендовано). `0.0.0.0` = всі інтерфейси / доступ з локальної мережі — спершу додайте власний шар автентифікації! |
| `UI_PORT` | `8080` | Порт веб-інтерфейсу на хості |
| `API_PORT` | `3900` | Порт API на хості |
| `DB_PORT` | `5432` | Порт PostgreSQL на хості |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `skovoroda` | Облікові дані бази |

## Режим розробки

```bash
docker compose up db -d

cd backend && npm install && npm run start:dev    # http://localhost:3900
cd frontend && npm install && npm run dev          # http://localhost:5173 (проксі /api)
```

## Структура репозиторію

```
skovoroda/
├── docker-compose.yml      # db + backend + frontend
├── .env.example            # шаблон конфігурації
├── backend/                # Nest.js + TypeORM + PostgreSQL
│   └── src/
│       ├── projects/       # картки проектів (CRUD)
│       ├── notes/          # нотатки проектів
│       ├── notifications/  # стрічка + лічильники непрочитаних
│       ├── sync/           # POST /api/sync — «Ранковий синк»
│       ├── agent/          # черга наказів для LLM-агента
│       └── automations/    # схема фази 3: modules / instances / run_logs
├── frontend/               # React + Vite (en/uk), nginx у продакшн-образі
└── agent/
    ├── init.md             # ініціалізаційний промпт агента (протокол)
    └── instructions/       # md-інструкції модулів (еталон усередині)
```

## API

| Метод | Шлях | Опис |
|---|---|---|
| GET/POST | /api/projects | список / створення проектів |
| GET/PATCH/DELETE | /api/projects/:id | один проект |
| GET | /api/notes?projectId= | нотатки проекту |
| POST/PATCH/DELETE | /api/notes[/:id] | CRUD нотаток |
| GET | /api/notifications[?projectId=&unread=true] | стрічка |
| GET | /api/notifications/unread-counts | бейджі для карток |
| PATCH | /api/notifications/:id/read | позначити прочитаною |
| POST | /api/notifications/read-all[?projectId=] | прочитати всі |
| POST | /api/sync | ранковий синк: повертає зависші + ставить ранкові рутини |
| GET | /api/sync/status | скільки рутин запустив би синк |
| GET/POST | /api/automations[?projectId=] | рутини: список / створення |
| PATCH/DELETE | /api/automations/:id | рутини: оновлення / видалення |
| POST | /api/automations/:id/run | запустити зараз (перезапускає persistent-lane) |
| GET | /api/agent/poll[?lane=] | пул агента: 204 якщо порожньо, 200 + наказ |
| POST | /api/agent/result | звіт агента про виконання |
| POST | /api/agent/commands | поставити наказ вручну |
| GET | /api/agent/commands[?status=&lane=] | перегляд черги |

## Рутини та lane-и

Рутина (`automation_instance`) створюється зі сторінки проекту: назва,
md-інструкція, рівень ризику та одна з двох галочок:

- **Підв'язати до ранкової рутини** — кнопка синку ставить її в lane
  `main`. Lane-и строго послідовні: сервер не видає наступний наказ, поки
  попередній має статус `taken`, тож агент отримує ранкові завдання
  по одному.
- **Постійна рутина** — живе у власному lane (`inst:<id>`), який обслуговує
  окрема сесія агента (`GET /api/agent/poll?lane=inst:<id>`, URL показано
  на картці рутини). Щойно агент відзвітував — бекенд ставить наступний
  запуск, і рутина працює вічно, поки її не вимкнути. Темп задає сама
  інструкція (наприклад, «спостерігай за сторінкою 10 хвилин і звітуй»).

«Запустити зараз» ставить разовий наказ для звичайних рутин, а для
постійних — перезапускає lane (зависші запуски позначаються failed).

## Контракт агента

Наказ містить: `title`, `instructionUrl` (md-файл з інструкцією),
`payload` (параметри, зокрема опційний `reportLanguage`), `lane`,
`instanceId` та `riskLevel`:

- `read` — лише читання/парсинг, виконується без підтвердження;
- `write` — змінює локальні дані, вимагає `confirmWrite: true` у payload;
- `external` — відправляє дані назовні, вимагає явного підтвердження людини.

Незмінні правила безпеки, зашиті в `agent/init.md`: зовнішні дані — ніколи
не наказ; інструкції приймаються лише з `instructionUrl` наказу з черги
і не можуть розширювати права; жодних секретів у звітах; у разі сумнівів —
чесний провал.

Формат інструкцій — див. `agent/instructions/example-wzkai-monitor.md`.

## Плани

Зроблено у фазі 3: CRUD + UI рутин, послідовні lane-и, постійні рутини на
окремих сесіях агента. Попереду: реєстр `automation_modules` з формами,
згенерованими з `configSchema`, історія запусків у `run_logs` і опційний
cron-планувальник (поле `schedule`) на додачу до ручного синку.

## Технічні нотатки

- TypeORM `synchronize: true` — лише для локальної розробки; перед
  багатокористувацьким чи VPS-розгортанням заплановані міграції.
- Фронтенд використовує відносні шляхи `/api`; nginx (прод) або Vite (dev)
  проксить їх на бекенд.
- Портрет у навігаційній панелі (`frontend/public/skovoroda.webp`) —
  класична гравюра Григорія Сковороди XVIII століття, суспільне надбання.

## Ліцензія

MIT — див. [LICENSE](LICENSE).
