---
read_when:
    - Перенесення даних середовища виконання OpenClaw, кешу, транскриптів, стану завдань або робочих файлів у SQLite
    - Розроблення міграцій doctor зі застарілих файлів JSON або JSONL
    - Зміна поведінки резервного копіювання, відновлення, VFS або сховища воркера
    - Видалення блокувань сеансів, очищення, усічення або шляхів сумісності з JSON
summary: План міграції для того, щоб зробити SQLite основним рівнем довготривалого стану та кешу, залишивши конфігурацію файловою
title: Рефакторинг стану з пріоритетом бази даних
x-i18n:
    generated_at: "2026-06-27T18:15:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Рефакторинг стану з пріоритетом бази даних

## Рішення

Використовувати дворівневу структуру SQLite:

- Глобальна база даних: `~/.openclaw/state/openclaw.sqlite`
- База даних агента: одна база даних SQLite на кожного агента для робочого простору,
  транскрипту, VFS, артефакта та великого стану виконання, що належить агенту
- Конфігурація залишається файловою: `openclaw.json` лишається поза
  базою даних. Профілі автентифікації runtime переходять у SQLite; зовнішні файли
  облікових даних провайдера або CLI залишаються керованими власником поза базою даних OpenClaw.

Глобальна база даних є базою даних площини керування. Вона відповідає за виявлення агентів,
спільний стан Gateway, сполучення, стан пристрою/вузла, журнали завдань і потоків, стан plugin,
стан виконання планувальника, метадані резервних копій і стан міграцій.

База даних агента є базою даних площини даних. Вона відповідає за метадані сесії агента,
потік подій транскрипту, робочий простір VFS або scratch-простір імен, артефакти інструментів,
артефакти запусків і придатні для пошуку/індексації локальні кеш-дані агента.

Це дає одне довговічне глобальне представлення без примусового розміщення великих робочих просторів агентів,
транскриптів і двійкових scratch-даних у спільній смузі запису Gateway.

## Жорсткий контракт

Ця міграція має одну канонічну форму runtime:

- Рядки сесій зберігають лише метадані сесії. Вони не повинні зберігати
  `transcriptLocator`, шляхи до файлів транскриптів, сусідні шляхи JSONL, шляхи блокувань,
  метадані pruning або вказівники сумісності файлової епохи.
- Ідентичність транскрипту завжди є ідентичністю SQLite: `{agentId, sessionId}` плюс
  необов’язкові метадані теми там, де це потрібно протоколу.
- `sqlite-transcript://...` не є runtime- або протокольною ідентичністю. Новий код не повинен
  виводити, зберігати, передавати, розбирати або мігрувати локатори транскриптів. Runtime і
  тести взагалі не повинні містити псевдолокаторів; документація може згадувати цей рядок
  лише щоб його заборонити.
- Застарілі `sessions.json`, JSONL транскриптів, `.jsonl.lock`, pruning, truncation
  і стара логіка шляхів сесій належать лише до шляху міграції/імпорту doctor.
- Застарілі псевдоніми конфігурації сесій належать лише до міграції doctor. Runtime не
  інтерпретує `session.idleMinutes`, `session.resetByType.dm` або
  міжагентські псевдоніми основної сесії `agent:main:*` для іншого налаштованого агента.
- Ідентичність маршрутизації сесій є типізованим реляційним станом. Гарячі шляхи runtime та UI
  мають читати `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` і
  `session_conversations`; вони не повинні розбирати `session_key` або добувати
  `session_entries.entry_json` для ідентичності провайдера, окрім як сумісну
  тінь, поки старі місця виклику видаляються.
- Маркери прямих повідомлень на рівні каналу, як-от `dm` проти `direct`, є словником
  маршрутизації, а не локаторами транскриптів чи compatibility handles файлового сховища.
- Застаріла конфігурація обробника hooks належить лише до поверхонь попереджень/міграції doctor.
  Runtime не повинен завантажувати `hooks.internal.handlers`; hooks виконуються лише через виявлені
  каталоги hooks і метадані `HOOK.md`.
- Запуск runtime, гарячі шляхи відповіді, Compaction, reset, recovery, diagnostics,
  TTS, memory hooks, subagents, маршрутизація команд plugin, межі протоколу та
  hooks повинні передавати `{agentId, sessionId}` через runtime.
- Тести мають засівати й перевіряти рядки транскриптів SQLite через
  `{agentId, sessionId}`. Тести, які лише доводять пересилання шляху JSONL,
  збереження наданого викликачем локатора або сумісність файлів транскриптів, слід
  видалити, якщо вони не покривають імпорт doctor, не-сесійне допоміжне/налагоджувальне
  матеріалізування або форму протоколу.
- `runEmbeddedPiAgent(...)`, підготовлені запускі worker і внутрішня вбудована
  спроба не повинні приймати локатори транскриптів. Вони відкривають менеджер транскриптів
  SQLite за `{agentId, sessionId}` і передають цей менеджер до інтерналізованої
  Pi-сумісної сесії агента, щоб застарілі викликачі не могли змусити runner записувати
  транскрипти JSON/JSONL.
- Діагностика runner повинна зберігати записи трас runtime/cache/payload у SQLite.
  Діагностика runtime не повинна відкривати knobs перевизначення файлів JSONL або загальні
  helpers експорту JSONL транскриптів; користувацькі експорти можуть матеріалізувати явні
  артефакти з рядків бази даних без повернення імен файлів у runtime.
- Журналювання raw stream використовує `OPENCLAW_RAW_STREAM=1` плюс діагностичні рядки SQLite.
  Старий файловий контракт logger pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` і
  `raw-openai-completions.jsonl` не є частиною runtime або тестів OpenClaw.
- Індексація пам’яті QMD не повинна експортувати транскрипти SQLite у markdown-файли.
  QMD індексує лише налаштовані файли пам’яті; пошук транскриптів сесій залишається
  підтриманим SQLite.
- Підшлях SDK QMD є лише QMD-only для нового коду. Helpers індексації транскриптів
  сесій SQLite живуть у `memory-core-host-engine-session-transcripts`; будь-який
  реекспорт QMD є лише сумісністю і не повинен використовуватися кодом runtime.
- Вбудовані індекси пам’яті живуть у базі даних агента-власника. Конфігурація runtime і
  resolved runtime contracts не повинні відкривати `memorySearch.store.path`; doctor
  видаляє цей застарілий ключ конфігурації, а поточний код передає агентський
  `databasePath` внутрішньо.

Реалізація має продовжувати видаляти код, доки ці твердження не стануть істинними
без винятків поза межами doctor/import/export/debug.

## Цільовий стан і прогрес

### Жорстка ціль

- Одна глобальна база даних SQLite відповідає за стан площини керування:
  `state/openclaw.sqlite`.
- Одна база даних SQLite на агента відповідає за стан площини даних:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Конфігурація залишається файловою. `openclaw.json` не є частиною цього
  рефакторингу бази даних.
- Застарілі файли є лише вхідними даними міграції doctor.
- Runtime ніколи не записує й не читає JSONL сесій або транскриптів як активний стан.

### Цільові стани

- `not-started`: runtime-код файлової епохи все ще записує активний стан.
- `migrating`: код doctor/import може переносити файлові дані в SQLite.
- `dual-read`: тимчасовий міст читає і SQLite, і застарілі файли. Цей стан
  заборонений для цього рефакторингу, якщо він явно не задокументований як
  doctor-only.
- `sqlite-runtime`: runtime читає й записує лише SQLite.
- `clean`: застарілі runtime API й тести видалені, а guard запобігає
  регресіям.
- `done`: документація, тести, резервні копії, міграція doctor і changed checks доводять
  чистий стан.

### Поточний стан

- Сесії: `clean` для runtime. Рядки сесій живуть у базі даних на агента,
  runtime API використовують `{agentId, sessionId}` або `{agentId, sessionKey}`, а
  `sessions.json` є застарілим входом лише для doctor.
- Транскрипти: `clean` для runtime. Події транскриптів, ідентичності, snapshots
  і runtime-події trajectory живуть у базі даних на агента. Runtime більше
  не приймає локатори транскриптів або шляхи JSONL транскриптів.
- Вбудований runner PI: `clean`. Вбудовані PI-запуски, підготовлені workers, Compaction
  і цикли повторів використовують session scope SQLite та відхиляють застарілі handles транскриптів.
- Cron: `clean` для runtime. Runtime використовує `cron_jobs` і `cron_run_logs`;
  runtime-тести використовують іменування SQLite `storeKey`, а cron-шляхи файлової епохи залишаються
  лише в тестах застарілої міграції doctor.
- Реєстр завдань: `clean`. Runtime-рядки завдань і Task Flow живуть у
  `state/openclaw.sqlite`; непоставлені sidecar-імпортери SQLite видалені.
- Стан Plugin: `clean`. Рядки стану/blob Plugin живуть у спільній глобальній
  базі даних; старі sidecar SQLite helpers для plugin-state захищені guard.
- Пам’ять: `sqlite-runtime` для вбудованої пам’яті й індексації транскриптів сесій.
  Таблиці індексів пам’яті живуть у базі даних на агента, стан пам’яті plugin використовує
  спільні рядки plugin-state, а застарілі файли пам’яті є вхідними даними міграції doctor
  або вмістом робочого простору користувача.
- Резервне копіювання: `sqlite-runtime`. Етапи резервного копіювання compact snapshots SQLite, пропускають живі
  WAL/SHM sidecars, перевіряють цілісність SQLite і записують backup runs у
  глобальну базу даних.
- Міграція doctor: `migrating`, навмисно. Doctor імпортує застарілі JSON,
  JSONL і retired sidecar stores у SQLite, записує migration runs/sources
  і видаляє успішні джерела.
- E2E-скрипти: `clean` для покриття runtime. Docker MCP seeding записує рядки SQLite.
  Docker-скрипт runtime-context створює застарілий JSONL лише всередині seed міграції
  doctor і явно називає шлях застарілого індексу сесій.

### Залишкова робота

- [x] Перейменувати змінні store у cron runtime-тестах подалі від `storePath`, якщо
      вони не є застарілими входами doctor.
      Файли: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Доказ: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Видалити або перейменувати застарілі моки тестів експорту файлової епохи.
      Файл: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Доказ: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Зробити legacy JSONL seed у Docker runtime-context очевидно doctor-only.
      Файл: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Доказ: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` показує лише
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Підтримувати згенеровані типи Kysely узгодженими після будь-якої зміни схеми.
      Файли: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Доказ: у цьому проході немає зміни схеми; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Повторно запустити сфокусовані тести для змінених stores, команд і скриптів.
      Доказ: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Перед оголошенням `done` запустити changed gate або віддалений broad proof.
      Доказ: `pnpm check:changed --timed -- <changed extension paths>` пройшов на
      Hetzner Crabbox run `run_3f1cabf6b25c` після тимчасового налаштування Node 24/pnpm і
      явної маршрутизації шляхів для синхронізованого workspace без `.git`.

### Не допускати регресій

- Жодних локаторів транскриптів.
- Жодних активних файлів сесій.
- Жодних фальшивих JSONL test fixtures, окрім тестів застарілої міграції doctor.
- Жодного raw SQLite access там, де очікується Kysely.
- Жодних нових застарілих міграцій БД. Ця структура не була поставлена; тримати версію схеми
  на `1`, якщо немає вагомої причини.

## Припущення після читання коду

Немає подальших продуктових рішень, що блокують цей план. Реалізація має
продовжуватися з такими припущеннями:

- Використовуйте `node:sqlite` напряму й вимагайте середовище виконання Node 22+ для цього шляху
  сховища.
- Залиште рівно один звичайний конфігураційний файл. Не переносіть конфігурацію, маніфести plugin
  або робочі простори Git у SQLite в межах цього рефакторингу.
- Файли сумісності runtime не потрібні. Застарілі файли JSON і JSONL є
  лише вхідними даними міграції. Локальні для гілки SQLite-сайдкари ніколи не постачалися й
  видаляються замість імпорту.
- `openclaw doctor --fix` відповідає за крок міграції застарілих файлів у базу даних.
  Запуск runtime і `openclaw migrate` не повинні містити застарілі шляхи
  оновлення бази даних OpenClaw.
- Сумісність облікових даних працює за тим самим правилом: runtime-облікові дані зберігаються в
  SQLite. Старі файли `auth-profiles.json`, агентні `auth.json` і спільні
  `credentials/oauth.json` є вхідними даними міграції doctor, а потім видаляються
  після імпорту.
- Стан згенерованого каталогу моделей підтримується базою даних. Runtime-код не повинен записувати
  `agents/<agentId>/agent/models.json`; наявні файли `models.json` є застарілими
  вхідними даними doctor і видаляються після імпорту в `agent_model_catalogs`.
- Runtime не повинен мігрувати, нормалізувати або з’єднувати локатори транскриптів. Активна
  ідентичність транскрипту — це `{agentId, sessionId}` у SQLite. Шляхи до файлів є
  лише застарілими вхідними даними doctor, а `sqlite-transcript://...` має зникнути з
  runtime, protocol, hook і plugin-поверхонь замість того, щоб трактуватися як
  boundary handle.
- Runtime-читання SQLite-транскриптів не запускають старі міграції форми записів JSONL і
  не перезаписують цілі транскрипти заради сумісності. Нормалізація застарілих записів залишається в
  явних утилітах doctor/import. Doctor нормалізує застарілі файли транскриптів JSONL
  перед вставленням рядків SQLite; поточні runtime-рядки вже записуються
  в поточній схемі транскриптів. Експорт trajectory/session читає ці рядки як є
  й не повинен виконувати застарілі міграції під час експорту.
- Допоміжні засоби парсингу/міграції застарілих транскриптів JSONL призначені лише для doctor. Runtime-код
  формату транскриптів будує лише поточний контекст SQLite-транскриптів; doctor
  відповідає за оновлення старих записів JSONL перед вставленням рядків.
- Старий runtime-керований допоміжний засіб потокового читання JSONL-транскриптів видалено. Код імпорту
  doctor відповідає за явні читання застарілих файлів; runtime-історія сесій читає
  рядки SQLite.
- Прив’язки Codex app-server використовують OpenClaw `sessionId` як канонічний
  ключ у просторі імен стану Codex plugin. `sessionKey` — це метадані для
  маршрутизації/відображення, і він не повинен замінювати довговічний ідентифікатор сесії або відновлювати
  файлову ідентичність транскрипту.
- Контекстні рушії отримують поточний runtime-контракт напряму. Реєстр
  не повинен обгортати рушії retry-shim’ами, які видаляють `sessionKey`,
  `transcriptScope` або `prompt`; рушії, що не можуть прийняти поточні
  параметри з пріоритетом бази даних, мають явно падати, а не з’єднуватися через міст.
- Вивід резервної копії має залишатися одним архівним файлом. Вміст бази даних має потрапляти
  в цей архів як компактні SQLite-знімки, а не як сирі live WAL-сайдкари.
- Пошук транскриптів корисний, але не обов’язковий для першого переходу на пріоритет бази даних.
  Спроєктуйте схему так, щоб FTS можна було додати пізніше.
- Виконання worker має залишатися експериментальним за налаштуваннями, доки межа бази даних
  стабілізується.

## Висновки Після Читання Коду

Поточна гілка вже вийшла за межі етапу proof-of-concept. Спільна
база даних існує, Node `node:sqlite` підключено через невеликий runtime-допоміжний засіб, а
колишні сховища тепер записують у `state/openclaw.sqlite` або в належну
базу даних `openclaw-agent.sqlite`.

Решта роботи полягає не у виборі SQLite, а в тому, щоб утримати нову межу чистою
й видалити всі інтерфейси, схожі на сумісність, які досі виглядають як старий
файловий світ:

- Session `storePath` більше не є runtime-ідентичністю, формою тестової фікстури або
  полем payload статусу. Runtime і bridge-тести більше не містять
  контрактну назву `storePath`; код doctor/migration володіє цією застарілою лексикою.
- Записи session більше не проходять через стару внутрішньопроцесну чергу `store-writer.ts`.
  SQLite patch-записи натомість використовують виявлення конфліктів і обмежені повторні спроби.
- Виявлення застарілих шляхів досі має коректні міграційні застосування, але runtime-код має
  припинити трактувати `sessions.json` і файли транскриптів JSONL як можливі цілі запису.
- Таблиці, що належать агенту, живуть у per-agent SQLite-базах даних. Глобальна БД зберігає
  рядки registry/control-plane; ідентичність транскрипту — це `{agentId, sessionId}` у
  per-agent рядках транскриптів. Runtime-код не повинен зберігати шляхи файлів транскриптів
  або мігрувати локатори транскриптів.
- Doctor уже імпортує кілька застарілих файлів. Очищення полягає в тому, щоб зробити це
  єдиною явною реалізацією міграції, яку викликає doctor, із довговічним
  звітом міграції.

Жодні додаткові продуктові питання не блокують реалізацію.

## Поточна Форма Коду

Гілка вже має справжню спільну SQLite-основу:

- Мінімальна версія runtime тепер Node 22+: `package.json`, захист runtime CLI,
  типові налаштування інсталятора, локатор runtime для macOS, CI та публічна документація з інсталяції
  узгоджені між собою. Стару лінію сумісності з Node 22 видалено.
- `src/state/openclaw-state-db.ts` відкриває `openclaw.sqlite`, задає WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` і застосовує
  згенерований модуль схеми, похідний від
  `src/state/openclaw-state-schema.sql`.
- Типи таблиць Kysely і модулі runtime-схеми генеруються з одноразових
  баз даних SQLite, створених із закомічених файлів `.sql`; runtime-код більше
  не зберігає скопійовані вручну рядки схем для глобальних, поагентних або proxy
  capture баз даних.
- Runtime-сховища виводять типи вибраних і вставлених рядків із цих згенерованих
  інтерфейсів Kysely `DB`, замість вручну дублювати форми рядків SQLite. Сирий SQL
  лишається обмеженим застосуванням схеми, pragmas і DDL лише для міграцій.
- Схеми SQLite зведено до `user_version = 1`, бо цей макет бази даних
  ще не постачався. Runtime-відкривачі створюють лише поточну схему;
  імпорт із файлів у базу даних лишається в коді doctor, а локальні для гілки
  помічники оновлення бази даних видалено.
- Реляційне володіння забезпечується там, де межа володіння є канонічною:
  рядки міграції джерела каскадують від `migration_runs`, стан доставки задач
  каскадує від `task_runs`, а рядки ідентичності transcript каскадують від
  подій transcript.
- Поточні спільні таблиці включають `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` і `backup_runs`.
- Довільний стан, яким володіє plugin, не отримує типізованих таблиць, якими володіє host. Установлені
  plugins використовують `plugin_state_entries` для версійованих JSON-навантажень і
  `plugin_blob_entries` для байтів, із володінням namespace/key, очищенням за TTL,
  backup і записами міграцій plugin. Стан оркестрації plugin, яким володіє host, усе ще може
  мати типізовані таблиці, коли host володіє контрактом запиту, наприклад
  `plugin_binding_approvals`.
- Міграції plugin є міграціями даних над namespace, якими володіє plugin, а не міграціями
  схеми host. Plugin може мігрувати власні версійовані записи state/blob
  через провайдер міграцій, а host записує стан source/run у
  звичайному журналі міграцій. Нові інсталяції plugin не потребують зміни
  `openclaw-state-schema.sql`, якщо сам host не бере на себе володіння
  новим міжплагінним контрактом.
- `src/state/openclaw-agent-db.ts` відкриває
  `agents/<agentId>/agent/openclaw-agent.sqlite`, реєструє базу даних у
  глобальній DB і володіє локальними для агента таблицями session, transcript, VFS, artifact, cache
  та memory-index. Спільне runtime-виявлення тепер читає згенеровано-типізований
  реєстр `agent_databases` замість повторної реалізації цього запиту в кожному місці виклику.
- Глобальні й поагентні бази даних записують рядок `schema_meta` з роллю бази даних,
  версією схеми, часовими позначками та id агента для агентних баз даних. Макет усе ще
  лишається на `user_version = 1`, бо ця схема SQLite ще не постачалася.
- Поагентна ідентичність session тепер має канонічну кореневу таблицю `sessions` із ключем
  `session_id`, з `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, часовими позначками, полями відображення, метаданими моделі,
  id harness і зв’язком parent/spawn як колонками, доступними для запитів. `session_routes`
  є унікальним активним індексом маршруту від `session_key` до поточного
  `session_id`, тож ключ маршруту може перейти до свіжої довговічної session без
  необхідності для гарячих читань вибирати між дубльованими рядками `sessions.session_key`. Старе
  суміснісне навантаження `session_entries.entry_json` висить на
  довговічному корені `session_id` через foreign key; воно більше не є єдиним
  представленням session на рівні схеми.
- Поагентна зовнішня ідентичність conversation теж реляційна:
  `conversations` зберігає нормалізовану ідентичність provider/account/conversation, а
  `session_conversations` зв’язує одну OpenClaw session з однією або кількома зовнішніми
  conversations. Це покриває shared-main DM sessions, де кілька peers можуть
  навмисно відповідати одній session без неправди в `session_key`. SQLite також
  забезпечує унікальність природної ідентичності provider, щоб той самий
  tuple channel/account/kind/peer/thread не міг розгалужуватися між conversation ids.
  Shared-main direct peers зв’язуються з роллю `participant`, тож одна
  OpenClaw session може представляти кількох зовнішніх DM peers без пониження
  старіших peers до нечітких related rows. `sessions.primary_conversation_id` усе ще
  вказує на поточну типізовану ціль доставки. Закриті колонки routing/status
  забезпечуються SQLite-обмеженнями `CHECK`, а не лише TypeScript unions.
  Runtime-проєкція session очищає суміснісні тіні routing із
  `session_entries.entry_json` перед застосуванням типізованих колонок session/conversation,
  тож застарілі JSON-навантаження не можуть воскресити цілі доставки.
  Маршрутизація оголошень subagent так само вимагає типізованого контексту доставки SQLite;
  вона більше не повертається до суміснісних полів маршруту `SessionEntry`.
  Явне успадкування доставки Gateway `chat.send` читає типізований контекст доставки SQLite
  замість суміснісних полів `origin`/`last*`.
  `tools.effective` так само виводить контекст provider/account/thread із типізованих
  рядків доставки/routing SQLite, а не із застарілих тіней `last*` у session-entry.
  Контекст prompt для system-event перебудовує поля channel/to/account/thread із
  типізованих полів доставки замість тіней `origin`.
  Спільний helper `deliveryContextFromSession` і mapper session-to-conversation
  тепер повністю ігнорують `SessionEntry.origin`; лише типізовані поля доставки
  та реляційні рядки conversation можуть створювати ідентичність гарячого маршруту.
  Нормалізація runtime session entry видаляє `origin` перед збереженням або
  проєктуванням `entry_json`, а вхідні metadata записують типізовані поля channel/chat
  плюс реляційні рядки conversation замість створення нових тіней origin.
- Події transcript, snapshots transcript і runtime-події trajectory тепер
  посилаються на канонічний поагентний корінь `sessions` і каскадують під час видалення session.
  Рядки ідентичності/idempotency transcript і далі каскадують від
  точного рядка події transcript.
- Індекси memory-core тепер використовують явні таблиці агентної бази даних
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` і
  `memory_embedding_cache`, а `memory_index_state` відстежує зміни revision.
  Необов’язкові побічні індекси FTS/vector названі `memory_index_chunks_fts` і
  `memory_index_chunks_vec` замість загальних таблиць `meta`, `files`, `chunks`,
  `chunks_fts` або `chunks_vec`. Канонічні назви зберігають поточну
  форму рядків path/source і сумісність серіалізованих embeddings. Ці таблиці
  є похідним/search cache, а не канонічним сховищем transcript; їх можна
  видалити й перебудувати з файлів memory workspace і налаштованих sources.
  Відкриття поставленого memory index із загальними назвами мігрує його metadata, sources,
  chunks і embedding cache у канонічні таблиці; похідні таблиці FTS/vector
  перебудовуються під канонічними назвами.
- Стан відновлення запусків subagent тепер живе в типізованих спільних рядках `subagent_runs`
  з індексованими ключами child, requester і controller session. Старий
  файл `subagents/runs.json` є лише входом для міграції doctor.
- Поточні прив’язки conversation тепер живуть у типізованих спільних
  рядках `current_conversation_bindings` із ключем за нормалізованим conversation id, з
  колонками цільового agent/session, kind conversation, status, expiry та metadata,
  збереженими як реляційні колонки замість дубльованого непрозорого запису binding.
  Довговічний ключ binding включає нормалізований kind conversation, щоб
  refs direct/group/channel не могли конфліктувати, а SQLite відхиляє недійсні значення
  kind/status binding. Старий
  файл `bindings/current-conversations.json` є лише входом для міграції doctor.
- Відновлення delivery queue тепер накладає типізовані колонки queue для channel, target,
  account, session, retry, error, platform-send і recovery state на
  replay JSON. `entry_json` зберігає replay payloads, hooks і formatting
  payload, але типізовані колонки є авторитетними для гарячої маршрутизації/стану queue.
- Вказівники відновлення останньої session TUI тепер живуть у типізованих спільних
  рядках `tui_last_sessions` із ключем за хешованим scope connection/session TUI.
  Старий JSON-файл TUI є лише входом для міграції doctor.
- Типові TTS prefs тепер живуть у спільних SQLite-рядках plugin-state з ключем під
  plugin `speech-core`. Старий файл `settings/tts.json` є лише входом для міграції
  doctor; runtime більше не читає й не записує JSON-файли TTS prefs, а
  застарілий path resolver живе в модулі міграції doctor.
- Метадані secret target тепер говорять про stores, а не вдають, що кожна
  credential target є config file. `openclaw.json` лишається config store;
  auth-profile targets використовують типізовані SQLite-рядки `auth_profile_stores` з
  provider-shaped credentials, збереженими як JSON payloads.
- Secret audit більше не сканує вилучені поагентні файли `auth.json`. Doctor володіє
  попередженням про цей legacy file, його імпортом і видаленням.
- Застарілі helpers для шляхів auth profile тепер живуть у застарілому коді doctor. Helpers для шляхів core auth
  profile expose ідентичність SQLite auth-store і locations відображення,
  а не runtime-шляхи `auth-profiles.json` або `auth-state.json`.
- Runtime-модулі відновлення запусків subagent і cache можливостей моделей OpenRouter
  тепер тримають SQLite snapshot readers/writers окремо від helpers імпорту legacy JSON,
  призначених лише для doctor. Можливості OpenRouter використовують типізовані загальні
  рядки `model_capability_cache` під `provider_id = "openrouter"` замість
  одного непрозорого cache blob або provider-specific host table. Subagent run
  `taskName` зберігається в типізованій колонці `subagent_runs.task_name`;
  копія `payload_json` є replay/debug data, а не джерелом для гарячих display або
  lookup fields.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` реалізує SQLite VFS
  поверх таблиці `vfs_entries` агентної бази даних. Читання директорій, recursive
  exports, deletes і renames використовують індексовані prefix ranges `(namespace, path)`
  замість сканування цілого namespace або покладання на path matching через `LIKE`.
- `src/agents/runtime-worker.entry.ts` створює поранові SQLite VFS, tool artifact,
  run artifact і scoped cache stores для workers.
- Маркери завершення workspace bootstrap тепер живуть у типізованих спільних
  рядках `workspace_setup_state` із ключем за resolved workspace path замість
  `.openclaw/workspace-state.json`; runtime більше не читає й не переписує
  legacy workspace marker, а helper APIs більше не передають фальшивий
  шлях `.openclaw/setup-state` лише для виведення storage identity.
- Exec approvals тепер живуть у типізованому singleton-рядку спільної SQLite `exec_approvals_config`.
  Doctor імпортує legacy `~/.openclaw/exec-approvals.json`;
  runtime-записи більше не створюють, не переписують і не повідомляють цей файл як його active
  store location. macOS companion читає й пише той самий
  рядок таблиці `state/openclaw.sqlite`; на диску він зберігає лише Unix prompt socket,
  бо це IPC, а не довговічний runtime state.
- Модулі runtime device identity, device auth і bootstrap тепер тримають свої
  SQLite snapshot readers/writers окремо від helpers імпорту legacy JSON,
  призначених лише для doctor. Device identity використовує типізовані рядки `device_identities`,
  а device auth tokens використовують типізовані рядки `device_auth_tokens`. Записи device auth узгоджують рядки
  за device/role замість обрізати таблицю token, а runtime більше не
  проводить single-token updates через старий whole-store adapter. Застарілий
  JSON-навантаження версії 1 існують лише як форми імпорту/експорту doctor.
- Кеш обміну токенів GitHub Copilot використовує спільну SQLite-таблицю стану Plugin
  у `github-copilot/token-cache/default`. Це кешований стан, що належить провайдеру,
  тому він навмисно не додає таблицю схеми хоста.
- GitHub Copilot Compaction більше не записує побічні файли робочого простору
  `openclaw-compaction-*.json`. Harness викликає RPC Compaction історії SDK для
  відстежуваної SDK-сесії, а OpenClaw зберігає довговічний стан сесії/транскрипту в
  SQLite замість файлів-маркерів сумісності.
- Спільне середовище виконання Swift (`OpenClawKit`) використовує ті самі рядки
  `state/openclaw.sqlite` для ідентичності пристрою та автентифікації пристрою. Допоміжні
  засоби застосунку macOS імпортують спільні SQLite-допоміжні засоби замість володіння
  другим JSON- або SQLite-шляхом. Залишковий застарілий `identity/device.json` блокує
  створення ідентичності, доки doctor не імпортує його в SQLite, відповідно до стартового
  шлюзу TypeScript і Android.
- Ідентичність пристрою Android використовує той самий сумісний із TypeScript ключовий
  матеріал, збережений у типізованих рядках `state/openclaw.sqlite#table/device_identities`.
  Вона ніколи не читає й не записує `openclaw/identity/device.json`; залишковий застарілий
  файл блокує запуск, доки doctor не імпортує його в SQLite.
- Кешовані токени автентифікації пристрою Android також використовують типізовані рядки
  `state/openclaw.sqlite#table/device_auth_tokens` і мають ті самі семантики токенів
  версії 1, що й TypeScript та Swift. Середовище виконання більше не читає ключі сумісності
  `SecurePrefs` `gateway.deviceToken*`; вони належать лише логіці міграції/doctor.
- Історія нещодавніх пакетів сповіщень Android використовує типізовані рядки
  `android_notification_recent_packages`. Середовище виконання більше не мігрує й не
  читає старі CSV-ключі SharedPreferences.
- Створення ідентичності пристрою завершується закритою відмовою, коли існує застарілий
  `identity/device.json`, коли рядок ідентичності SQLite недійсний або коли сховище
  ідентичності SQLite не можна відкрити. Doctor спершу імпортує й видаляє цей файл, тому
  запуск середовища виконання не може тихо змінити ідентичність pairing до міграції.
- Вибір ідентичності пристрою є ключем рядка SQLite, а не локатором JSON-файлу. Тести та
  допоміжні засоби Gateway передають явні ключі ідентичності; лише міграція doctor і
  стартовий шлюз із закритою відмовою знають назву вилученого файлу `identity/device.json`.
- Сумісність скидання сесії тепер живе в міграції конфігурації doctor:
  `session.idleMinutes` переміщується в `session.reset.idleMinutes`,
  `session.resetByType.dm` переміщується в `session.resetByType.direct`, а політика
  скидання середовища виконання читає лише канонічні ключі скидання.
- Сумісність застарілої конфігурації тепер живе в `src/commands/doctor/`. Звичайна
  валідація `readConfigFileSnapshot()` не імпортує застарілі детектори doctor і не
  анотує застарілі проблеми; `runDoctorConfigPreflight()` додає ці проблеми для
  відновлення/звітування doctor. Потік конфігурації doctor імпортує
  `src/commands/doctor/legacy-config.ts`, а старе відновлення OAuth profile-id живе
  в
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Команди не-doctor не запускають автоматично відновлення застарілої конфігурації.
  Наприклад, `openclaw update --channel` тепер завершується помилкою на недійсній
  застарілій конфігурації та просить користувача запустити doctor, замість тихого
  імпорту коду міграції doctor.
- Web push, APNs, Voice Wake, перевірки оновлень і стан конфігурації тепер використовують
  типізовані спільні SQLite-таблиці для підписок, VAPID-ключів, реєстрацій Node, рядків
  тригерів, рядків маршрутизації, стану сповіщень про оновлення та записів стану
  конфігурації замість цілих непрозорих JSON-блобів. Записи знімків Web push і APNs
  тепер узгоджують підписки/реєстрації за первинним ключем замість очищення їхніх таблиць;
  стан конфігурації робить те саме за шляхом конфігурації.
  Їхні модулі середовища виконання тримають читачі/записувачі SQLite-знімків окремо від
  допоміжних засобів імпорту застарілого JSON, призначених лише для doctor.
- Конфігурація Node-хоста тепер використовує типізований singleton-рядок у спільній
  базі даних SQLite; doctor імпортує старий файл `node.json` перед звичайним використанням
  середовищем виконання.
- Pairing пристрою/Node, pairing каналу, allowlist каналів і стан bootstrap тепер
  використовують типізовані SQLite-рядки замість цілих непрозорих JSON-блобів. Схвалення
  прив’язування Plugin і стан завдань Cron використовують той самий поділ: модулі
  середовища виконання надають операції на базі SQLite та нейтральні допоміжні засоби
  знімків, а записи знімків pairing/bootstrap плюс схвалень прив’язування Plugin
  узгоджують рядки за первинним ключем замість усікання таблиць, тоді як doctor
  імпортує/видаляє старі JSON-файли через модулі
  `src/commands/doctor/legacy/*`.
- Записи встановлених Plugin тепер живуть в SQLite-індексі встановлених Plugin.
  Читання/запис конфігурації середовища виконання більше не мігрує й не зберігає старі
  authored-config дані `plugins.installs`; doctor імпортує цю застарілу форму конфігурації
  в SQLite перед звичайним використанням середовищем виконання.
- Знімки відновлення облікових даних QQBot тепер живуть у стані Plugin SQLite під
  `qqbot/credential-backups`. Середовище виконання більше не записує
  `qqbot/data/credential-backup*.json`; doctor імпортує й видаляє ці застарілі файли
  резервних копій разом з іншими вхідними даними стану QQBot.
- Планування перезавантаження Gateway порівнює знімки SQLite-індексу встановлених Plugin
  у внутрішньому просторі імен diff `installedPluginIndex.installRecords.*`. Рішення
  перезавантаження середовища виконання більше не загортають ці рядки у фальшиві об’єкти
  конфігурації `plugins.installs`.
- Оновлення облікових даних іменованого облікового запису Matrix більше не відбувається
  під час читань середовища виконання. Doctor володіє перейменуванням старого верхньорівневого
  `credentials/matrix/credentials.json`, коли можна визначити один/default обліковий запис
  Matrix.
- Модулі середовища виконання core pairing і Cron більше не експортують побудовники
  застарілих JSON-шляхів. Застарілі модулі, що належать doctor, створюють вихідні шляхи
  `pending.json`, `paired.json`, `bootstrap.json` і `cron/jobs.json` лише для тестів
  імпорту та міграції. Нормалізація застарілої форми завдань Cron і імпорт журналу
  запусків Cron живуть у `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` імпортує застарілі JSON-файли стану,
  зокрема конфігурацію Node-хоста, у SQLite з doctor. Нові імпортери застарілих файлів
  залишаються в `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` імпортує застарілі транскрипти `sessions.json`
  і `*.jsonl` безпосередньо в SQLite та видаляє успішно оброблені джерела. Він більше
  не проміжно розміщує кореневі застарілі транскрипти через
  `agents/<agentId>/sessions/*.jsonl` і не створює канонічну ціль JSONL перед імпортом.
- Перевірки цілісності стану doctor більше не сканують застарілі каталоги сесій і не
  пропонують видалення осиротілих JSONL. Застарілі файли транскриптів є лише вхідними
  даними міграції, а крок міграції володіє імпортом і видаленням джерел.
- Імпорт застарілого реєстру sandbox живе в
  `src/commands/doctor/legacy/sandbox-registry.ts`; активні читання й записи реєстру
  sandbox залишаються лише SQLite.
- Відновлення стану/імпорту застарілих транскриптів сесій живе в
  `src/commands/doctor/legacy/session-transcript-health.ts`; модулі команд середовища
  виконання більше не несуть парсинг транскриптів JSONL або код відновлення active-branch.

Основні моменти завершеної консолідації/видалення:

- Стан Plugin тепер використовує спільну базу даних `state/openclaw.sqlite`. Старий
  імпортер супровідного файла `plugin-state/state.sqlite`, локального для гілки, вилучено, тому що
  ця SQLite-структура ніколи не постачалася. Допоміжні засоби проб/тестів повідомляють спільний
  `databasePath` замість того, щоб відкривати шлях SQLite, специфічний для стану plugin.
- Таблиці середовища виконання завдань і Task Flow тепер розміщені у спільній
  базі даних `state/openclaw.sqlite` замість `tasks/runs.sqlite` і
  `tasks/flows/registry.sqlite`; старі імпортери супровідних файлів вилучено з тієї
  самої причини непостаченої структури.
- `src/config/sessions/store.ts` більше не потребує `storePath` для вхідних
  метаданих, оновлень маршрутів або читання updated-at. Збереження команд, очищення
  сесій CLI, глибина підagentів, перевизначення автентифікації та ідентичність сесії
  транскрипта використовують API рядків agent/session. Записи застосовуються як патчі
  рядків SQLite з оптимістичною повторною спробою в разі конфлікту.
- Розв’язання цільової сесії тепер відкриває цілі баз даних для кожного agent, а не застарілі
  шляхи `sessions.json`. Спільний gateway, метадані ACP, виправлення маршрутів doctor і
  `openclaw sessions` перелічують `agent_databases` разом із налаштованими agents.
- Маршрутизація сесій Gateway тепер використовує `resolveGatewaySessionDatabaseTarget`; повернена
  ціль містить `databasePath` і кандидатні ключі рядків SQLite замість застарілого шляху
  файла сховища сесій.
- Типи середовища виконання сесій каналів тепер відкривають `{agentId, sessionKey}` для
  читання updated-at, вхідних метаданих і оновлень last-route. Старий
  тип сумісності `saveSessionStore(storePath, store)` вилучено.
- Середовище виконання Plugin, API розширень і barrel-поверхні `config/sessions` тепер спрямовують
  код plugin до допоміжних засобів рядків сесій на базі SQLite. Експорти сумісності кореневої
  бібліотеки (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) залишаються
  застарілими shim для наявних споживачів. Старий
  допоміжний засіб `resolveLegacySessionStorePath` вилучено; побудова застарілого шляху
  `sessions.json` тепер локальна для міграції та тестових fixtures.
- `src/config/sessions/session-entries.sqlite.ts` тепер зберігає канонічні записи сесій
  у базі даних кожного agent і має підтримку читання/upsert/delete patch на рівні рядків.
  Runtime upsert/patch/delete більше не сканує варіанти регістру й не обрізає
  застарілі alias-ключі; doctor відповідає за канонізацію. Окремий допоміжний засіб
  імпорту JSON вилучено, а міграція merge upsert додає новіші рядки замість заміни
  всієї таблиці сесій. Публічні допоміжні засоби read/list/load проєктують гарячі
  метадані сесій із типізованих рядків `sessions` і `conversations`;
  `entry_json` є тінню сумісності/налагодження й може бути застарілим або недійсним
  без втрати типізованої ідентичності сесії чи контексту доставлення.
- `src/config/sessions/delivery-info.ts` тепер розв’язує контекст доставлення з
  типізованих рядків `sessions` + `conversations` + `session_conversations` для кожного agent.
  Він більше не реконструює ідентичність доставлення runtime з
  `session_entries.entry_json`; відсутній типізований рядок розмови є проблемою
  міграції/виправлення doctor, а не runtime fallback.
- Рішення щодо скидання збережених сесій тепер віддають перевагу типізованим метаданим
  `sessions.session_scope`, `sessions.chat_type` і `sessions.channel`. Розбір `sessionKey`
  залишається лише для явних суфіксів thread/topic у цілях команд; класифікація скидання
  group проти direct більше не походить із форми ключа.
- Класифікація відображення списку/стану сесій тепер використовує типізовані метадані чату
  й тип сесії gateway. Вона більше не трактує підрядки `:group:` або `:channel:`
  всередині `session_key` як сталу істину group/direct.
- Вибір політики silent-reply тепер використовує лише явний тип розмови або метадані surface.
  Він більше не вгадує політику direct/group із підрядків `session_key`.
- Розв’язання моделі відображення сесії тепер отримує id agent із цілі бази даних сесій SQLite
  замість витягування його з `session_key`.
- Гідратація цілі оголошення agent-to-agent тепер використовує лише типізований
  `deliveryContext` із `sessions.list`. Вона більше не відновлює маршрутизацію
  channel/account/thread із застарілих `origin`, дзеркальних полів `last*` або форми `session_key`.
- Відхилення thread-target у `sessions_send` тепер читає типізовані метадані маршрутизації SQLite.
  Воно більше не відхиляє й не приймає цілі, розбираючи суфікси thread із цільового ключа.
- Перевірка політики інструментів із областю group тепер читає типізовану маршрутизацію
  розмови SQLite для поточної або породженої сесії. Вона більше не довіряє ідентичності
  group/channel через декодування `sessionKey`; надані викликачем group ids відкидаються,
  коли немає типізованого рядка сесії, який їх підтверджує.
- Зіставлення перевизначень моделі каналу тепер використовує явні метадані group і parent
  conversation. Воно більше не декодує ids батьківських розмов із `parentSessionKey`.
- Успадкування збережених перевизначень моделі тепер вимагає явний ключ батьківської сесії
  з типізованого контексту сесії. Воно більше не виводить батьківські перевизначення з
  суфіксів `:thread:` або `:topic:` у `sessionKey`.
- Старий wrapper thread-info сесії та parser thread завантаженого plugin вилучено;
  жоден runtime-код не імпортує `config/sessions/thread-info`.
- Допоміжний засіб розмов каналу більше не відкриває мостів розбору повного ключа сесії.
  Core і далі нормалізує raw ids розмов, якими володіє provider, через
  `resolveSessionConversation(...)`, але не реконструює факти маршруту
  з `sessionKey`.
- Доставлення завершень, політика надсилання й обслуговування завдань більше не виводять
  тип чату з форми `session_key`. Старий parser ключа типу чату видалено;
  ці шляхи потребують типізованих метаданих сесії, типізованого контексту доставлення або
  явної лексики цілі доставлення.
- Відображення списку/стану сесій, діагностика, прив’язка облікового запису схвалення,
  фільтрація heartbeat у TUI і підсумки використання більше не видобувають із
  `SessionEntry.origin` маршрутизацію provider/account/thread/display. Єдині рештки
  runtime-читань `origin` — це несесійні концепції або об’єкти доставлення поточного ходу.
- Пошук нативної розмови для запиту схвалення тепер читає типізовані рядки маршрутизації
  сесій для кожного agent. Він більше не розбирає ідентичність розмови channel/group/thread
  із `sessionKey`; відсутні типізовані метадані є проблемою міграції/виправлення.
- Payload подій Gateway session changed/chat/session більше не дублюють
  `SessionEntry.origin` або тіні маршрутів `last*`; клієнти отримують типізовані
  `channel`, `chatType` і `deliveryContext`.
- Розв’язання доставлення Heartbeat тепер може отримувати типізований SQLite
  `deliveryContext` напряму, а runtime heartbeat передає рядок доставлення сесії
  для кожного agent замість покладатися на тіні сумісності `session_entries`
  для поточної маршрутизації.
- Розв’язання цілі доставлення ізольованого agent Cron також гідратує свій поточний
  маршрут із типізованого рядка доставлення сесії для кожного agent перед fallback до
  payload запису сумісності.
- Розв’язання походження оголошення підagentа тепер проводить типізований контекст
  доставлення сесії запитувача через `loadRequesterSessionEntry` і віддає перевагу цьому
  рядку над тінями сумісності `last*`/`deliveryContext`.
- Оновлення метаданих вхідної сесії тепер спочатку зливаються з типізованим рядком
  доставлення для кожного agent; старі поля доставлення `SessionEntry` є лише fallback,
  коли немає типізованого рядка розмови.
- Витяг доставлення restart/update тепер дозволяє типізованому SQLite delivery
  `threadId` мати пріоритет над фрагментами topic/thread, розібраними з `sessionKey`; розбір
  є лише fallback для застарілих ключів у формі thread.
- Ids каналу контексту hook agent тепер віддають перевагу типізованій ідентичності розмови SQLite,
  потім явним метаданим повідомлення. Вони більше не розбирають фрагменти provider/group/channel
  із `sessionKey`.
- Успадкування зовнішнього маршруту Gateway `chat.send` тепер читає типізовані метадані
  маршрутизації сесії SQLite замість виводити область channel/direct/group із частин
  `sessionKey`. Сесії з областю channel успадковують лише тоді, коли типізований
  канал сесії та тип чату збігаються зі збереженим контекстом доставлення; shared-main
  сесії зберігають суворіше правило CLI/no-client-metadata.
- Пробудження restart-sentinel і маршрутизація продовження тепер читають типізовані
  рядки доставлення/маршрутизації SQLite перед додаванням heartbeat wake або routed agent-turn
  continuations у чергу. Вони більше не реконструюють контекст доставлення з
  JSON-тіні запису сесії.
- Розв’язання контексту Gateway `tools.effective` тепер читає типізовані рядки
  доставлення/маршрутизації SQLite для input provider, account, target, thread і reply-mode.
  Воно більше не відновлює ці гарячі поля маршрутизації із застарілих тіней origin
  `session_entries.entry_json`.
- Маршрутизація realtime voice consult тепер розв’язує доставлення parent/call із типізованих
  рядків сесії SQLite для кожного agent. Вона більше не використовує fallback до тіней
  сумісності `SessionEntry.deliveryContext` під час вибору маршруту повідомлення embedded agent.
- Relay heartbeat породження ACP і маршрутизація parent-stream тепер читають доставлення parent
  з типізованих рядків сесії SQLite. Вони більше не реконструюють контекст доставлення parent
  із тіней записів сесії сумісності.
- Збереження маршруту доставлення сесії тепер відповідає типізованим метаданим чату й
  збереженим стовпцям доставлення. Воно більше не витягує підказки channel, маркери
  direct/main або форму thread із `sessionKey`; внутрішні маршрути webchat успадковують
  зовнішню ціль лише тоді, коли SQLite вже має типізовану/збережену ідентичність доставлення
  для сесії.
- Загальне витягання доставлення сесії тепер читає лише точний типізований рядок
  доставлення сесії SQLite. Воно більше не розбирає суфікси thread/topic і не fallback
  від ключа у формі thread до базового ключа сесії.
- Dispatch відповіді, відновлення restart sentinel і маршрутизація realtime voice consult
  тепер використовують точні типізовані рядки сесій/розмов SQLite для маршрутизації thread.
  Вони більше не відновлюють ids thread або контекст доставлення базової сесії, розбираючи
  ключі сесій у формі thread.
- Обмеження історії embedded PI тепер використовує типізовану проєкцію маршрутизації сесії
  SQLite (`sessions` + основні `conversations`) для provider, типу чату та ідентичності peer.
  Воно більше не розбирає форму provider, DM, group або thread із `sessionKey`.
- Виведення доставлення інструментів Cron тепер використовує лише явне доставлення або поточний
  типізований контекст доставлення. Воно більше не декодує цілі channel, peer, account або thread
  з `agentSessionKey`.
- Рядки runtime-сесій більше не містять старий alias маршруту `lastProvider`.
  Допоміжні засоби й тести використовують типізовані поля `lastChannel` і `deliveryContext`;
  міграція doctor є єдиним місцем, яке має перекладати старіші alias маршрутів
  або збережені тіні `origin`.
- Події транскриптів, рядки VFS і рядки артефактів інструментів тепер записуються до бази даних
  кожного agent. Непостачена глобальна таблиця зіставлення файлів транскриптів вилучена; doctor
  натомість записує застарілі вихідні шляхи в довговічні рядки міграції.
- Пошук транскриптів runtime більше не сканує byte offsets JSONL і не перевіряє застарілі
  файли транскриптів. Шляхи Gateway chat/media/history читають рядки транскриптів із
  SQLite; JSONL сесії тепер є лише застарілим input для doctor, а не runtime state
  чи форматом export.
- Батьківські та гілкові зв’язки транскриптів використовують структуровані
  метадані `parentTranscriptScope: {agentId, sessionId}` у заголовках транскриптів SQLite,
  а не рядки-локатори, схожі на шляхи `agent-db:...transcript_events...`.
- Контракт менеджера транскриптів більше не відкриває неявні збережені
  конструктори `create(cwd)` або `continueRecent(cwd)`. Збережені менеджери транскриптів
  відкриваються з явною областю `{agentId, sessionId}`; лише in-memory менеджери
  залишаються без області для тестів і чистих перетворень транскриптів.
- API сховища транскриптів runtime розв’язують область SQLite, а не шляхи файлової системи. Старий
  допоміжний засіб `resolve...ForPath` і невикористані параметри запису `transcriptPath`
  вилучено з runtime-викликачів.
- Розв’язання сесії runtime тепер використовує `{agentId, sessionId}` і не повинно виводити
  рядки `sqlite-transcript://<agent>/<session>` для зовнішніх меж.
  Застарілі абсолютні шляхи JSONL є лише input для міграції doctor.
- Записи direct-bridge relay нативних hooks тепер живуть у типізованих спільних
  рядках `native_hook_relay_bridges`, keyed by relay id. Runtime більше не пише
  JSON-реєстр `/tmp` або непрозорі generic records для цих короткоживучих bridge records.
- `runEmbeddedPiAgent(...)` більше не має параметра transcript-locator.
  Підготовлені дескриптори worker також не містять локаторів транскрипта. Стан
  runtime-сесії та заплановані наступні запуски переносять `{agentId, sessionId}` замість
  похідних ідентифікаторів транскрипта.
- Вбудована Compaction тепер бере область SQLite з `agentId` і `sessionId`.
  Хуки Compaction, виклики context-engine, делегування CLI та відповіді протоколу
  не повинні отримувати похідні ідентифікатори `sqlite-transcript://...`. Код
  експорту/налагодження може матеріалізувати явні користувацькі артефакти з рядків,
  але він не надає загальний шлях експорту JSONL сесії і не передає імена файлів
  назад у runtime-ідентичність.
- `/export-session` читає рядки транскрипта з SQLite і записує лише запитане
  автономне HTML-представлення. Вбудований переглядач більше не реконструює і не
  завантажує JSONL сесії з цих рядків.
- Делегування context-engine більше не розбирає локатор транскрипта, щоб відновити
  ідентичність агента. Підготовлений runtime-контекст переносить визначений `agentId`
  у вбудований адаптер Compaction.
- Перезапис транскрипта та live-скорочення результатів інструментів тепер читають і
  зберігають стан транскрипта за `{agentId, sessionId}` і не виводять тимчасові
  локатори для payload-подій оновлення транскрипта.
- Поверхня допоміжних засобів стану транскрипта більше не має варіантів
  `readTranscriptState`, `replaceTranscriptStateEvents` або
  `persistTranscriptStateMutation` на основі локаторів. Runtime-викликачі повинні
  використовувати API `{agentId, sessionId}`. Імпорт doctor читає застарілі файли
  за явним шляхом до файлу і записує рядки SQLite; він не мігрує рядки локаторів.
- Контракт runtime-менеджера сесій більше не надає `open(locator)`,
  `forkFrom(locator)` або `setTranscriptLocator(...)`. Персистентні менеджери
  сесій відкриваються лише за `{agentId, sessionId}`; допоміжні засоби list/fork
  живуть у рядково-орієнтованих API сесій і checkpoint замість фасаду менеджера
  транскриптів.
- API читача транскриптів Gateway спершу приймають область. Вони беруть
  `{agentId, sessionId}` і не приймають позиційний локатор транскрипта, який міг би
  випадково стати runtime-ідентичністю. Розбір активного локатора транскрипта
  вилучено; застарілі шляхи джерел читаються лише кодом імпорту doctor.
- Події оновлення транскрипта також спершу приймають область.
  `emitSessionTranscriptUpdate` більше не приймає голий рядок локатора, а слухачі
  маршрутизують за `{agentId, sessionId}` без розбору ідентифікатора.
- Трансляція session-message у Gateway визначає ключі сесії з області
  агента/сесії, а не з локатора транскрипта. Старий resolver/cache для перетворення
  локатора транскрипта на ключ сесії вилучено.
- SSE session-history у Gateway фільтрує live-оновлення за областю агента/сесії.
  Він більше не канонікалізує кандидатів локатора транскрипта, realpath або
  файлові ідентичності транскрипта, щоб вирішити, чи має потік отримати оновлення.
- Хуки життєвого циклу сесії більше не виводять і не надають локатори транскрипта
  на `session_end`. Споживачі хуків отримують `sessionId`, `sessionKey`,
  ідентифікатори наступної сесії та контекст агента; файли транскриптів не є
  частиною контракту життєвого циклу.
- Хуки reset також більше не виводять і не надають локатори транскрипта.
  Payload `before_reset` переносить відновлені повідомлення SQLite плюс причину
  reset, тоді як ідентичність сесії залишається в контексті хука.
- Reset harness агента більше не приймає локатор транскрипта. Диспетчеризація reset
  обмежена `sessionId`/`sessionKey` плюс причиною.
- Типи сесій розширень агента більше не надають `transcriptLocator`; розширенням
  слід використовувати контекст сесії та runtime API, а не звертатися до файлової
  ідентичності транскрипта.
- Хуки Compaction Plugin більше не надають локатори транскрипта. Контекст хука вже
  переносить ідентичність сесії, а читання транскрипта повинні проходити через
  API SQLite, що враховують область, замість файлових ідентифікаторів.
- Хуки `before_agent_finalize` більше не надають `transcriptPath`, включно з
  payload нативного ретранслятора хуків. Хуки фіналізації використовують лише
  контекст сесії.
- Відповіді reset Gateway більше не синтезують локатор транскрипта в поверненому
  записі. Reset створює рядки транскрипта SQLite, повертає чистий запис сесії і
  залишає доступ до транскрипта читачам, що враховують область.
- Результати вбудованого запуску та Compaction більше не показують локатори
  транскрипта для обліку сесій. Автоматична Compaction оновлює лише активний
  `sessionId`, лічильники Compaction і метадані токенів.
- Результати вбудованих спроб більше не повертають `transcriptLocatorUsed`, а
  результати `compact()` context-engine більше не повертають локатори транскрипта.
  Runtime-цикли повторних спроб приймають лише наступний `sessionId`.
- Результати додавання транскрипта delivery-mirror більше не повертають локатори
  транскрипта. Викликачі отримують доданий `messageId`; сигнали оновлення
  транскрипта використовують область SQLite.
- Допоміжні засоби fork батьківської сесії повертають лише fork-нутий `sessionId`.
  Підготовка субагента передає область дочірнього агента/сесії в engine.
- Параметри runner CLI та повторне заповнення історії більше не приймають локатори
  транскрипта. Читання історії CLI визначають область транскрипта SQLite з
  `{agentId, sessionId}` і контексту ключа сесії.
- Тестові фікстури CLI та embedded-runner тепер засівають і читають рядки
  транскрипта SQLite за id сесії, замість удавання, що активні сесії є файлами
  `*.jsonl`, або передачі рядка `sqlite-transcript://...` через runtime-параметри.
- Події guard для результатів інструментів сесії випромінюються з відомої області
  сесії навіть тоді, коли in-memory manager не має похідного локатора. Його тести
  більше не підробляють активні файли транскриптів `/tmp/*.jsonl`.
- Допоміжні засоби BTW і compaction-checkpoint тепер читають і fork-ають рядки
  транскрипта за областю SQLite. Метадані checkpoint тепер зберігають лише id сесій
  і id leaf/entry; похідні локатори більше не записуються в payload checkpoint.
- Пошук transcript-key Gateway використовує область транскрипта SQLite на межах
  протоколу і більше не виконує realpath або stat для імен файлів транскриптів.
- Автоматична ротація транскрипта Compaction записує наступні рядки транскрипта
  безпосередньо через сховище транскриптів SQLite. Рядки сесій зберігають лише
  ідентичність наступної сесії, а не довготривалий шлях JSONL чи збережений локатор.
- Вбудована Compaction context-engine використовує допоміжні засоби ротації
  транскриптів з іменами SQLite. Тести ротації більше не конструюють наступні шляхи
  JSONL і не моделюють активні сесії як файли.
- Кероване збереження вихідних зображень ключує свій кеш transcript-message зі
  статистики транскриптів SQLite замість викликів stat файлової системи.
- Runtime-блокування сесій і автономну застарілу doctor-смугу `.jsonl.lock`
  вилучено.
- Runtime barrel Microsoft Teams і публічний Plugin SDK більше не реекспортують
  старий допоміжний засіб файлового блокування; довготривалі шляхи стану Plugin
  підтримуються SQLite.
- Обрізання сесій за віком/кількістю і явне очищення сесій вилучено. Doctor володіє
  застарілим імпортом; застарілі сесії скидаються або видаляються явно.
- Перевірки цілісності doctor більше не рахують застарілий файл JSONL як дійсний
  активний транскрипт для рядка сесії SQLite. Стан активного транскрипта є лише
  SQLite; застарілі файли JSONL повідомляються як вхідні дані для міграції або
  очищення orphan.
- Doctor більше не вважає `agents/<agent>/sessions/` обов'язковим runtime-станом.
  Він сканує цей каталог лише тоді, коли він уже існує, як вхідні дані застарілого
  імпорту або очищення orphan.
- `sessions.resolve` у Gateway, шляхи patch/reset/compact сесій, spawning субагентів,
  fast abort, метадані ACP, ізольовані Heartbeat сесії та patching TUI більше не
  мігрують і не обрізають застарілі ключі сесій як побічний ефект звичайної
  runtime-роботи.
- Визначення сесії команди CLI тепер повертає власника `agentId` замість
  `storePath`, і більше не копіює застарілі рядки main-session під час звичайного
  визначення `--to` або `--session-id`. Канонікалізація застарілих main-row належить
  лише doctor.
- Визначення глибини runtime-субагента більше не читає `sessions.json` або сховища
  сесій JSON5. Воно читає SQLite `session_entries` за id агента, а застарілі метадані
  глибини/сесій можуть потрапити лише через шлях імпорту doctor.
- Перевизначення сесій auth-профілю зберігаються через прямі upsert рядків
  `{agentId, sessionKey}` замість lazy-loading файлового runtime-сховища сесій.
- Verbose gating auto-reply і допоміжні засоби оновлення сесій тепер читають/upsert
  рядки сесій SQLite за ідентичністю сесії і більше не потребують застарілого шляху
  сховища перед зміною збереженого стану рядків.
- Допоміжні засоби метаданих command-run сесії тепер використовують entry-oriented
  назви та шляхи модулів; стару поверхню допоміжних засобів команд `session-store`
  вилучено.
- Засівання bootstrap header і посилення межі manual compaction тепер змінюють
  рядки транскрипта SQLite напряму. Runtime-викликачі передають ідентичність сесії,
  а не записувані шляхи `.jsonl`.
- Silent replay ротації сесії копіює останні ходи користувача/асистента за
  `{agentId, sessionId}` з рядків транскрипта SQLite. Він більше не приймає локатори
  вихідного або цільового транскрипта.
- Нові рядки runtime-сесій більше не зберігають локатори транскрипта. Викликачі
  використовують `{agentId, sessionId}` напряму; команди експорту/налагодження можуть
  вибирати імена вихідних файлів під час матеріалізації рядків.
- Запуск нової персистентної сесії транскрипта тепер завжди відкриває рядки SQLite
  за областю. Менеджер сесій більше не перевикористовує попередній шлях або локатор
  транскрипта файлової епохи як ідентичність для нової сесії.
- Персистентні сесії транскриптів використовують явний API
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Старі статичні
  фасади `SessionManager.create/openForSession/list/forkFromSession` вилучено, щоб
  тести й runtime-код не могли випадково відтворити виявлення сесій файлової епохи.
- Runtime Plugin більше не надає `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  код Plugin використовує допоміжні засоби рядків SQLite і значення області.
- Публічна поверхня SDK `session-store-runtime` тепер експортує лише допоміжні
  засоби рядків сесій і рядків транскриптів. Сфокусовані допоміжні засоби
  схеми/шляху/транзакцій SQLite живуть у `sqlite-runtime`; сирі допоміжні засоби
  open/close/reset залишаються лише локальними для first-party тестів.
- Застарілі класифікатори імен файлів траєкторій/checkpoint `.jsonl` тепер живуть у
  модулі застарілих session-file doctor. Валідація core сесій більше не імпортує
  допоміжні засоби файлових артефактів, щоб вирішувати нормальні id сесій SQLite.
- Блокувальні запуски субагентів Active Memory використовують рядки транскрипта
  SQLite замість створення тимчасових або збережених файлів `session.jsonl` під
  станом Plugin. Стару опцію `transcriptDir` вилучено.
- Одноразова генерація slug і запуски planner Crestodian використовують рядки
  транскрипта SQLite замість створення тимчасових файлів `session.jsonl`.
- Запуски допоміжного засобу `llm-task` і приховане витягання commitment також
  використовують рядки транскрипта SQLite, тому ці model-only допоміжні сесії більше
  не створюють тимчасові файли транскриптів JSON/JSONL.
- `TranscriptSessionManager` тепер є лише відкритою областю транскрипта SQLite.
  Runtime-код відкриває його через `openTranscriptSessionManagerForSession({agentId,
sessionId})`; потоки create, branch, continue, list і fork живуть у власних
  допоміжних засобах рядків SQLite, а не в статичних фасадах менеджера.
  Код doctor/import/debug обробляє явні застарілі вихідні файли поза runtime
  менеджером сесій.
- Застарілі фасадні методи `SessionManager.newSession()` і
  `SessionManager.createBranchedSession()` вилучено. Нові сесії та нащадки
  транскриптів створюються власним workflow SQLite замість перетворення вже
  відкритого менеджера на іншу персистентну сесію.
- Рішення fork батьківського транскрипта і створення fork більше не приймають
  `storePath` або `sessionsDir`; вони використовують область транскрипта SQLite
  `{agentId, sessionId}` замість збережених метаданих шляхів файлової системи.
- Memory-host більше не експортує no-op допоміжні засоби класифікації транскриптів
  session-directory; фільтрація транскриптів тепер виводиться з метаданих рядків
  SQLite під час побудови entry.
- Тести експорту сесій memory-host і QMD використовують області транскриптів SQLite.
  Старі шляхи `agents/<agentId>/sessions/*.jsonl` залишаються покритими лише там,
  де тест навмисно доводить сумісність doctor/import/export.
- Сире інспектування сесій QA-lab тепер використовує `sessions.list` через Gateway
  замість читання `agents/qa/sessions/sessions.json`; відгуки MSteams
  додаються безпосередньо до транскриптів SQLite без створення штучного шляху JSONL.
- Спільні вхідні звернення каналів тепер передають `{agentId, sessionKey}`, а не
  застарілий `storePath`. Шляхи запису LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch і QQBot тепер читають метадані updated-at і записують
  вхідні рядки сесій через ідентичність SQLite.
- Збереження локатора транскрипту видалено з активних рядків сесій.
  `resolveSessionTranscriptTarget` повертає `agentId`, `sessionId` і необов’язкові
  метадані теми; doctor — єдиний код, який імпортує застарілі назви файлів
  транскриптів.
- Заголовки транскриптів runtime починаються з версії SQLite `1`. Оновлення старих форм JSONL V1/V2/V3
  існують лише в імпорті doctor і нормалізують імпортовані заголовки до
  поточної версії транскриптів SQLite перед збереженням рядків.
- Захист database-first тепер забороняє `SessionManager.listAll` і
  `SessionManager.forkFromSession`; списки сесій і робочі процеси fork/restore
  мають залишатися на row/scoped API SQLite.
- Захист також забороняє назви застарілих допоміжних функцій розбору JSONL транскриптів/виправлення active-branch
  поза кодом doctor/import, щоб runtime не міг отримати другий застарілий
  шлях міграції транскриптів.
- Вбудовані запуски PI відхиляють вхідні дескриптори транскриптів. Вони використовують ідентичність SQLite
  `{agentId, sessionId}` перед запуском worker і знову перед тим, як
  спроба торкнеться стану транскрипту. Застарілий вхід `/tmp/*.jsonl` не може вибрати
  runtime-ціль запису.
- Записи трасування кешу, Anthropic payload, raw stream і часової шкали діагностики
  тепер записуються в типізовані рядки SQLite `diagnostic_events`. Пакети стабільності Gateway
  тепер записуються в типізовані рядки SQLite `diagnostic_stability_bundles`. Старі
  шляхи перевизначення JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` і
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` видалено, а звичайне захоплення стабільності
  більше не записує файли `logs/stability/*.json`.
- Збереження Cron тепер узгоджує рядки SQLite `cron_jobs` замість
  видалення й повторного вставлення всієї таблиці завдань під час кожного збереження. Зворотні записи цілей Plugin
  оновлюють відповідні рядки cron безпосередньо й утримують runtime-стан cron у
  тій самій транзакції бази даних стану.
- Runtime-викликачі Cron тепер використовують стабільний ключ сховища cron SQLite. Застарілі
  шляхи `cron.store` є лише вхідними даними імпорту doctor; виробничі шляхи gateway, обслуговування завдань,
  статусу, run-log і зворотного запису цілі Telegram використовують
  `resolveCronStoreKey` і більше не path-normalize ключ. Статус Cron тепер
  повідомляє `storeKey`, а не старе file-shaped поле `storePath`.
- Runtime-завантаження й планування Cron більше не нормалізують застарілі збережені форми завдань,
  як-от `jobId`, `schedule.cron`, числовий `atMs`, рядкові булеві значення або
  відсутній `sessionTarget`. Застарілий імпорт doctor володіє цими виправленнями до
  вставлення рядків у SQLite.
- ACP spawn більше не визначає й не зберігає шляхи файлів JSONL транскриптів. Налаштування spawn
  і thread-bind зберігають рядок сесії SQLite безпосередньо та утримують
  ідентифікатор сесії як збережену ідентичність транскрипту.
- API метаданих сесій ACP тепер читають/перелічують/upsert рядки SQLite за `agentId` і
  більше не виставляють `storePath` як частину контракту запису сесії ACP.
- Облік використання сесій і агрегація використання gateway тепер визначають транскрипти
  лише за `{agentId, sessionId}`. Кеш cost/usage і підсумки discovered-session
  більше не синтезують і не повертають рядки локатора транскрипту.
- Додавання чату Gateway, збереження abort-partial, `/sessions.send` і
  записи транскриптів webchat media додаються безпосередньо через область транскриптів SQLite.
  Допоміжна функція gateway transcript-injection більше не приймає параметр
  `transcriptLocator`.
- Виявлення транскриптів SQLite тепер перелічує лише області та статистику транскриптів:
  `{agentId, sessionId, updatedAt, eventCount}`. Мертву
  compatibility helper `listSqliteSessionTranscriptLocators` і per-row
  поле `locator` видалено.
- Runtime виправлення транскриптів тепер виставляє лише
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Стару
  helper виправлення на основі locator видалено; код doctor/debug читає явні
  шляхи вихідних файлів і ніколи не мігрує рядки locator.
- Runtime replay ledger ACP тепер зберігає per-session replay rows у спільній
  базі даних стану SQLite замість `acp/event-ledger.json`; doctor імпортує й
  видаляє застарілий файл.
- Допоміжні функції читання транскриптів Gateway тепер розміщені в
  `src/gateway/session-transcript-readers.ts` замість старої
  назви модуля `session-utils.fs`. Перевірку fallback retry history названо за
  вмістом транскриптів SQLite, а не за старою поверхнею file-helper.
- Допоміжні функції Gateway injected-chat і compaction тепер передають область транскриптів SQLite
  через внутрішні helper API замість того, щоб називати значення шляхами транскриптів або
  вихідними файлами.
- Виявлення продовження bootstrap тепер перевіряє рядки транскриптів SQLite через
  `hasCompletedBootstrapTranscriptTurn`; воно більше не виставляє file-shaped
  назву helper.
- Тести embedded-runner тепер використовують ідентичність транскриптів SQLite, а відкриття нового
  менеджера транскриптів завжди вимагає явного `sessionId`.
- Допоміжні функції індексації пам’яті тепер використовують термінологію транскриптів SQLite end to end:
  host експортує `listSessionTranscriptScopesForAgent` і
  `sessionTranscriptKeyForScope`, targeted sync queues `sessionTranscripts`,
  публічні результати session-search виставляють непрозорі шляхи `transcript:<agent>:<session>`,
  а внутрішній DB source key — це `session:<session>` під
  `source_kind='sessions'` замість фальшивого шляху файлу.
- Загальна persistent-dedupe helper SDK Plugin більше не виставляє file-shaped
  опції. Викликачі надають ключі області SQLite, а durable dedupe rows живуть у
  спільному стані Plugin.
- Токени SSO Microsoft Teams перенесено із заблокованих JSON-файлів до стану Plugin SQLite.
  Doctor імпортує `msteams-sso-tokens.json`, перебудовує канонічні ключі токенів SSO
  з payload і видаляє вихідний файл. Делеговані токени OAuth залишаються
  на своїй наявній межі приватного credential-file.
- Стан кешу синхронізації Matrix перенесено з `bot-storage.json` до стану Plugin SQLite.
  Doctor імпортує застарілі raw або wrapped sync payloads і видаляє
  вихідний файл. Активні клієнти Matrix і QA Matrix передають root directory SQLite sync-store,
  а не фальшивий шлях `sync-store.json` або `bot-storage.json`.
- Стан застарілої міграції crypto Matrix перенесено з
  `legacy-crypto-migration.json` до стану Plugin SQLite. Doctor імпортує
  старий файл стану; snapshots IndexedDB Matrix SDK перенесено з
  `crypto-idb-snapshot.json` до blobs Plugin SQLite. Ключі відновлення Matrix і
  credentials є рядками plugin-state SQLite; їхні старі JSON-файли є лише
  вхідними даними міграції doctor.
- Журнали активності Memory Wiki тепер використовують стан Plugin SQLite замість
  `.openclaw-wiki/log.jsonl`. Постачальник міграції Memory Wiki імпортує старі
  журнали JSONL; wiki markdown і вміст user vault залишаються file-backed як
  workspace content.
- Memory Wiki більше не створює `.openclaw-wiki/state.json` або невикористаний
  каталог `.openclaw-wiki/locks`. Постачальник міграції видаляє ці retired
  файли метаданих Plugin, якщо старіший vault усе ще має їх.
- Записи аудиту Crestodian тепер використовують core SQLite plugin state замість
  `audit/crestodian.jsonl`. Doctor імпортує застарілий JSONL audit log і
  видаляє його після успішного імпорту.
- Записи аудиту запису/спостереження конфігурації тепер використовують core SQLite plugin state
  замість `logs/config-audit.jsonl`. Doctor імпортує застарілий JSONL audit log і
  видаляє його після успішного імпорту.
- macOS companion більше не записує app-local sidecars `logs/config-audit.jsonl` або
  `logs/config-health.json` під час редагування `openclaw.json`. Файл конфігурації
  залишається file-backed, recovery snapshots залишаються поруч із файлом конфігурації,
  а durable config audit/health state належить до SQLite store Gateway.
- Очікувані схвалення rescue Crestodian тепер використовують core SQLite plugin state замість
  `crestodian/rescue-pending/*.json`. Doctor імпортує застарілі файли pending approval
  і видаляє їх після успішного імпорту.
- Тимчасовий arm state Phone Control тепер використовує стан Plugin SQLite замість
  `plugins/phone-control/armed.json`. Doctor імпортує застарілий файл armed-state
  у namespace `phone-control/arm-state` і видаляє файл.
- Doctor більше не виправляє JSONL транскрипти на місці й не створює резервні JSONL
  файли. Він імпортує active branch у SQLite і видаляє застаріле джерело.
- Пошук транскриптів session-memory hook використовує scope-only читання SQLite `{agentId, sessionId}`.
  Його helper більше не приймає й не виводить transcript locators,
  legacy file reads або file-rewrite options.
- Прив’язки розмов Codex app-server тепер ключують стан Plugin SQLite за
  ключем сесії OpenClaw або явною областю `{agentId, sessionId}`. Вони не повинні
  зберігати fallback bindings на основі transcript-path.
- Читання mirrored-history Codex app-server використовують лише область транскриптів SQLite;
  вони не повинні відновлювати ідентичність зі шляхів файлів транскриптів.
- Шляхи role-ordering і compaction reset більше не unlink старі файли транскриптів;
  reset лише ротатує рядок сесії SQLite та ідентичність транскрипту.
- Відповіді Gateway reset і checkpoint повертають чисті рядки сесій плюс ідентифікатори сесій.
  Вони більше не синтезують локатори транскриптів SQLite для клієнтів.
- Dreaming memory-core більше не обрізає рядки сесій через probing на відсутні
  JSONL файли. Очищення subagent проходить через runtime API сесій замість
  перевірок існування у файловій системі. Його тести transcript-ingestion засівають рядки SQLite
  безпосередньо замість створення fixtures `agents/<id>/sessions` або locator
  placeholders.
- Індексація транскриптів пам’яті може виставляти `transcript:<agentId>:<sessionId>` як
  віртуальний шлях search-hit для citation/read helpers. Durable index source є
  реляційним (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), тому значення не є runtime transcript locator,
  не є шляхом файлової системи й ніколи не має передаватися назад у runtime API сесій.
- Статус пам’яті Gateway doctor читає short-term recall і phase-signal counts
  з рядків plugin-state SQLite замість `memory/.dreams/*.json`; вивід CLI і
  doctor тепер позначає це сховище як SQLite store, а не як шлях.
- Runtime memory-core, статус CLI, методи Gateway doctor і фасади SDK Plugin
  більше не аудіюють і не архівують застарілі файли `.dreams/session-corpus`.
  Ці файли є лише вхідними даними міграції; doctor імпортує їх у SQLite і
  видаляє джерело після перевірки. Активні evidence rows session-ingestion
  тепер використовують віртуальний шлях SQLite `memory/session-ingestion/<day>.txt`; runtime
  ніколи не записує й не виводить стан з `.dreams/session-corpus`.
- Публічні артефакти memory-core виставляють host events SQLite як віртуальний JSON
  артефакт `memory/events/memory-host-events.json`; вони більше не повторно використовують
  застарілий source path `.dreams/events.jsonl`.
- Реєстри sandbox container/browser тепер використовують спільну
  таблицю SQLite `sandbox_registry_entries` із типізованими стовпцями session, image, timestamp,
  backend/config і browser port. Doctor імпортує застарілі монолітні та
  sharded JSON registry files і видаляє успішні джерела. Runtime reads використовують
  типізовані стовпці рядків як source of truth; `entry_json` є лише replay/debug
  копією.
- Commitments тепер використовують типізовану спільну таблицю `commitments` замість
  whole-store JSON blob. Snapshot saves виконують upsert за commitment id і видаляють лише
  відсутні рядки замість очищення й повторного вставлення таблиці. Runtime loads
  commitments з типізованих стовпців scope, delivery-window, status, attempt і text;
  `record_json` є лише replay/debug копією. Doctor імпортує застарілий
  `commitments.json` і видаляє його після успішного імпорту.
- Визначення cron-завдань, стан розкладу та історія запусків більше не мають runtime
  JSON writers або readers. Runtime використовує рядки `cron_jobs` із типізованим schedule,
  payload, delivery, failure-alert, session, status і runtime-state, а також типізовані
  метадані `cron_run_logs` для статусу, підсумку діагностики, статусу/помилки доставлення,
  session/run, model і загальних token totals. `job_json` є лише копією для повторного відтворення/налагодження; `state_json` зберігає вкладені
  runtime-діагностичні дані, які ще не мають гарячих полів для запитів, тоді як runtime
  відновлює гарячі поля стану з типізованих стовпців. Doctor імпортує
  застарілі файли `jobs.json`, `jobs-state.json` і `runs/*.jsonl` та видаляє
  імпортовані джерела. Зворотні записи цілей Plugin оновлюють відповідні рядки `cron_jobs`
  замість завантаження й заміни всього cron-сховища.
- Запуск Gateway ігнорує застарілі маркери `notify: true` у runtime-проекції. Doctor перетворює їх на явне доставлення SQLite, коли
  `cron.webhook` є дійсним, видаляє інертні маркери, коли його не задано, і зберігає
  їх із попередженням, коли налаштований webhook недійсний.
- Черги вихідного доставлення та доставлення сеансів тепер зберігають статус черги, тип запису,
  ключ сеансу, канал, ціль, id облікового запису, кількість повторних спроб, останню спробу/помилку,
  стан відновлення та маркери platform-send як типізовані стовпці у спільній
  таблиці `delivery_queue_entries`. Runtime-відновлення читає ці гарячі поля з
  типізованих стовпців, а мутації повторних спроб/відновлення оновлюють ці стовпці напряму
  без переписування replay JSON. Повний JSON payload залишається лише як
  replay/debug blob для тіл повідомлень та інших холодних даних replay.
- Керовані записи вихідних зображень тепер використовують типізовані спільні
  рядки `managed_outgoing_image_records`, а байти медіа й далі зберігаються в
  `media_blobs`. JSON-запис залишається лише копією для повторного відтворення/налагодження.
- Налаштування Discord model-picker, хеші command-deploy і прив’язки потоків
  тепер використовують спільний стан Plugin у SQLite. Їхні застарілі плани імпорту JSON живуть у
  поверхні setup/doctor migration Plugin Discord, а не в core migration code.
- Детектори застарілого імпорту Plugin використовують модулі з назвами doctor, як-от
  `doctor-legacy-state.ts` або `doctor-state-imports.ts`; звичайні runtime-модулі каналів
  не повинні імпортувати застарілі JSON-детектори.
- Курсори BlueBubbles catchup і вхідні dedupe-маркери тепер використовують спільний стан Plugin у SQLite. Їхні застарілі плани імпорту JSON живуть у поверхні BlueBubbles Plugin
  setup/doctor migration, а не в core migration code.
- Зсуви оновлень Telegram, рядки кешу стікерів, рядки кешу надісланих повідомлень,
  рядки кешу назв topics і прив’язки потоків тепер використовують спільний стан Plugin у SQLite. Їхні застарілі плани імпорту JSON живуть у Telegram Plugin
  setup/doctor migration surface, а не в core migration code.
- Курсори iMessage catchup, зіставлення reply short-id і sent-echo dedupe rows
  тепер використовують спільний стан Plugin у SQLite. Старі файли `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` і `imessage/sent-echoes.jsonl` є
  лише вхідними даними doctor.
- Рядки Feishu message dedupe тепер використовують спільний стан Plugin у SQLite замість
  файлів `feishu/dedup/*.json`. Його застарілий план імпорту JSON живе у Feishu
  Plugin setup/doctor migration surface, а не в core migration code.
- Розмови, опитування, буфери очікуваних завантажень і feedback
  learnings Microsoft Teams тепер використовують спільні таблиці стану/blob Plugin у SQLite. Шлях очікуваних завантажень
  використовує `plugin_blob_entries`, тому медіабуфери зберігаються як SQLite BLOB-и
  замість base64 JSON. Назви runtime-допоміжників тепер використовують іменування SQLite/state,
  а не файлове іменування `*-fs`, а старий shim `storePath` вилучено
  з цих сховищ. Його застарілий план імпорту JSON живе в Microsoft Teams
  Plugin setup/doctor migration surface.
- Хостовані вихідні медіа Zalo тепер використовують спільні SQLite `plugin_blob_entries`
  замість тимчасових JSON/bin sidecar-файлів `openclaw-zalo-outbound-media`.
- HTML і метадані переглядача diff-ів тепер використовують спільні SQLite `plugin_blob_entries`
  замість тимчасових файлів `meta.json`/`viewer.html`. Відрендерені PNG/PDF outputs залишаються
  тимчасовими materializations, бо доставленню каналами й далі потрібен шлях до файла.
- Керовані документи Canvas тепер використовують спільні SQLite `plugin_blob_entries` замість
  типового каталогу `state/canvas/documents`. Хост Canvas віддає ці
  blob-и напряму; локальні файли створюються лише для явного операторського вмісту `host.root`
  або тимчасової materialization, коли downstream media reader
  вимагає шлях.
- Рішення аудиту File Transfer тепер використовують спільні SQLite `plugin_state_entries`
  замість необмеженого runtime-журналу `audit/file-transfer.jsonl`. Doctor
  імпортує застарілий JSONL audit file у стан Plugin і видаляє джерело
  після чистого імпорту.
- Оренди процесів ACPX і ідентичність екземпляра Gateway тепер використовують спільний стан Plugin у SQLite. Doctor імпортує застарілий файл `gateway-instance-id` у стан Plugin
  і видаляє джерело.
- Згенеровані wrapper scripts ACPX і ізольований Codex home є тимчасовою
  materialization під temp root OpenClaw, а не довговічним станом OpenClaw. Довговічні runtime-записи ACPX — це SQLite lease і рядки gateway-instance;
  стару config surface `stateDir` ACPX вилучено, бо runtime state
  туди більше не записується.
- Медіавкладення Gateway тепер використовують спільну таблицю SQLite `media_blobs` як
  канонічне сховище байтів. Локальні шляхи, що повертаються на поверхні сумісності каналів і sandbox,
  є тимчасовими materializations рядка бази даних, а не
  довговічним медіасховищем. Runtime allowlists для медіа більше не містять застарілі
  корені `$OPENCLAW_STATE_DIR/media` або config-dir `media`; ці каталоги є
  лише джерелами імпорту doctor.
- Shell completion більше не записує cache-файли `$OPENCLAW_STATE_DIR/completions/*`.
  Шляхи install, doctor, update і release smoke використовують згенерований
  completion output або profile sourcing замість довговічних файлів completion cache.
- Staging завантаження Skills у Gateway тепер використовує спільні рядки `skill_uploads`. Метадані завантаження,
  idempotency keys і байти архіву живуть у SQLite; installer
  отримує лише тимчасовий materialized archive path, поки install
  виконується.
- Вбудовані вкладення subagent більше не матеріалізуються у workspace
  `.openclaw/attachments/*`. Spawn path готує SQLite VFS seed entries,
  inline runs засівають ці entries у per-agent runtime scratch namespace,
  а disk-backed tools накладають цей SQLite scratch для attachment paths. Старі
  registry columns і cleanup hooks attachment-dir для subagent-run вилучено.
- CLI image hydration більше не підтримує стабільні cache-файли `openclaw-cli-images`.
  Зовнішні CLI backends усе ще отримують file paths, але ці шляхи є
  per-run temp materializations із cleanup.
- Cache-trace diagnostics, Anthropic payload diagnostics, raw model stream
  diagnostics, diagnostics timeline events і Gateway stability bundles тепер
  записують рядки SQLite замість файлів `logs/*.jsonl` або
  `logs/stability/*.json`.
  Runtime path override flags і env vars вилучено; export/debug
  commands можуть явно матеріалізувати файли з рядків бази даних.
- macOS companion більше не має rolling writer `diagnostics.jsonl`. App
  logs йдуть в unified logging, а довговічна діагностика Gateway залишається SQLite-backed.
- Список записів macOS port-guardian тепер використовує типізовані спільні SQLite
  рядки `macos_port_guardian_records` замість JSON-файла Application Support
  або opaque singleton blob.
- Singleton locks Gateway тепер використовують типізовані спільні SQLite `state_leases` rows у
  scope `gateway_locks` замість lock-файлів temp-dir. Документація з усунення проблем Fly і OAuth
  тепер вказує на SQLite lease/auth refresh lock замість застарілого file-lock cleanup.
- Стан restart sentinel Gateway тепер використовує типізовані спільні SQLite
  рядки `gateway_restart_sentinel` замість `restart-sentinel.json`; runtime
  читає kind, status, routing, message, continuation і stats sentinel з
  типізованих стовпців. `payload_json` є лише копією replay/debug. Runtime code очищує
  рядок SQLite напряму й більше не містить file cleanup plumbing.
- Стан restart intent і supervisor handoff Gateway тепер використовує типізовані спільні
  SQLite рядки `gateway_restart_intent` і `gateway_restart_handoff` замість
  sidecar-файлів `gateway-restart-intent.json` і
  `gateway-supervisor-restart-handoff.json`.
- Координація singleton Gateway тепер використовує типізовані рядки `state_leases` у
  `gateway_locks` замість запису файлів `gateway.<hash>.lock`. Lease row
  володіє lock owner, expiry, heartbeat і debug payload; SQLite володіє
  атомарною межею acquire/release. Retired file-lock directory option
  вилучено; тести використовують ідентичність SQLite row напряму.
- Старий невикористовуваний helper cron usage-report, який сканував файли `cron/runs/*.jsonl`,
  видалено. Звіти історії Cron run повинні читати типізовані
  SQLite rows `cron_run_logs`.
- Main-session restart recovery тепер знаходить candidate agents через
  SQLite registry `agent_databases` замість сканування каталогів `agents/*/sessions`.
- Gemini session-corruption recovery тепер видаляє лише SQLite session row;
  йому більше не потрібен застарілий gate `storePath` і він не намагається unlink derived
  transcript JSONL path.
- Обробка path override тепер трактує буквальні значення середовища `undefined`/`null`
  як unset, запобігаючи випадковим repo-root базам даних `undefined/state/*.sqlite`
  під час тестів або shell handoffs.
- Config health fingerprints тепер використовують типізовані спільні SQLite рядки `config_health_entries`
  замість `logs/config-health.json`, залишаючи звичайний config file
  єдиним non-credential configuration document. macOS companion зберігає лише
  process-local health state і не відтворює старий JSON sidecar.
- Auth profile runtime більше не імпортує і не записує credential JSON files. Канонічним
  credential store є SQLite; `auth-profiles.json`, per-agent
  `auth.json` і shared `credentials/oauth.json` є doctor migration inputs,
  які видаляються після імпорту.
- Auth profile save/state tests тепер напряму перевіряють типізовані SQLite auth tables
  і використовують застарілі filenames auth-profile лише для doctor migration inputs.
- `openclaw secrets apply` очищує лише config file, env file і SQLite
  auth-profile store. Він більше не містить compatibility logic, яка редагує
  retired per-agent `auth.json`; doctor володіє імпортом і видаленням цього файла.
- Плани й застосування Hermes secret migration імпортували API-key profiles напряму
  в SQLite auth-profile store. Він більше не записує і не перевіряє
  `auth-profiles.json` як intermediate target.
- User-facing auth docs тепер описують
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` замість
  вказівок користувачам перевіряти або копіювати `auth-profiles.json`; застарілі імена OAuth/auth JSON
  залишаються задокументованими лише як doctor-import inputs.
- Core state-path helpers більше не expose retired файл `credentials/oauth.json`.
  Застаріле filename є локальним для doctor auth import path.
- Документація install, security, onboarding, model-auth і SecretRef тепер описує
  SQLite auth-profile rows і whole-state backup/migration замість
  per-agent auth-profile JSON files.
- PI model discovery тепер передає канонічні credentials у in-memory
  auth storage `pi-coding-agent`. Він більше не створює, не очищує й не записує
  per-agent `auth.json` під час discovery.
- Trigger і routing settings Voice Wake тепер використовують типізовані спільні SQLite tables
  замість `settings/voicewake.json`, `settings/voicewake-routing.json` або
  opaque generic rows; doctor імпортує застарілі JSON files і видаляє їх після
  successful migration.
- Update-check state тепер використовує типізований спільний рядок `update_check_state` замість
  `update-check.json` або opaque generic blob; doctor імпортує
  застарілий JSON file і видаляє його після successful migration.
- Config health state тепер використовує типізовані спільні рядки `config_health_entries` замість
  `logs/config-health.json` або opaque generic blob; doctor
  імпортує застарілий JSON file і видаляє його після successful migration.
- Схвалення прив’язок Plugin conversations тепер використовують типізовані
  рядки `plugin_binding_approvals` замість opaque shared SQLite state або
  `plugin-binding-approvals.json`; застарілий файл є вхідними даними для міграції doctor.
- Узагальнені прив’язки поточної розмови тепер зберігають типізовані рядки
  `current_conversation_bindings` замість перезапису
  `bindings/current-conversations.json`; doctor імпортує застарілий JSON-файл і
  видаляє його після успішної міграції.
- Журнали синхронізації імпортованих джерел Memory Wiki тепер зберігають один рядок стану Plugin SQLite
  для кожного ключа сховища/джерела замість перезапису `.openclaw-wiki/source-sync.json`;
  постачальник міграції імпортує та видаляє застарілий JSON-журнал.
- Записи запусків імпорту ChatGPT у Memory Wiki тепер зберігають один рядок стану Plugin SQLite
  для кожного сховища/ідентифікатора запуску замість запису `.openclaw-wiki/import-runs/*.json`.
  Знімки відкату залишаються явними файлами сховища, доки архівування знімків
  запусків імпорту не буде перенесено до сховища blob-об’єктів.
- Скомпільовані дайджести Memory Wiki тепер зберігають рядки blob-об’єктів Plugin SQLite замість
  запису `.openclaw-wiki/cache/agent-digest.json` і
  `.openclaw-wiki/cache/claims.jsonl`. Постачальник міграції імпортує старі файли кешу
  й видаляє каталог кешу, коли він стає порожнім.
- Відстеження встановлення Skills у ClawHub тепер зберігає один рядок стану Plugin SQLite для кожного
  робочого простору/skill замість запису або читання допоміжних файлів `.clawhub/lock.json` і
  `.clawhub/origin.json` під час виконання. Код середовища виконання використовує об’єкти стану
  відстежених встановлень, а не файлові абстракції lockfile/origin. Doctor
  імпортує застарілі допоміжні файли з налаштованих робочих просторів агентів і видаляє їх
  після чистого імпорту.
- Індекс установлених Plugin тепер читає й записує типізований спільний singleton-рядок SQLite
  `installed_plugin_index` замість `plugins/installs.json`; застарілий JSON-файл
  є лише вхідними даними для міграції doctor і видаляється після імпорту.
- Допоміжник шляху застарілого `plugins/installs.json` тепер живе в застарілому коді doctor.
  Модулі індексу Plugin у середовищі виконання надають лише параметри збереження
  на базі SQLite, а не шлях до JSON-файлу.
- Сентинел перезапуску Gateway, намір перезапуску та стан передавання супервізору тепер використовують
  типізовані спільні рядки SQLite (`gateway_restart_sentinel`,
  `gateway_restart_intent` і `gateway_restart_handoff`) замість узагальнених
  непрозорих blob-об’єктів. Код перезапуску середовища виконання не має файлового контракту
  sentinel/intent/handoff.
- Кеш синхронізації Matrix, метадані сховища, прив’язки потоків, вхідні маркери дедуплікації,
  стан cooldown для перевірки запуску, криптографічні знімки SDK IndexedDB,
  облікові дані та ключі відновлення тепер використовують спільні таблиці стану/blob Plugin SQLite.
  Структури шляхів середовища виконання більше не експонують шлях метаданих `storage-meta.json`;
  ця назва файлу є лише вхідними даними застарілої міграції. Їхній план імпорту застарілого JSON
  живе в поверхні налаштування/міграції doctor для Matrix Plugin.
- Запуск Matrix більше не сканує, не звітує та не завершує застарілий файловий стан Matrix.
  Виявлення файлів Matrix, створення застарілого криптографічного знімка, стан міграції
  відновлення ключів кімнат, імпорт і видалення джерела повністю належать doctor.
- Runtime-barrel модулі міграції Matrix було видалено. Допоміжники виявлення
  та зміни застарілого стану/криптографії імпортуються Matrix doctor напряму, а не є
  частиною API поверхні середовища виконання.
- Маркери повторного використання знімків міграції Matrix тепер живуть у стані Plugin SQLite
  замість `matrix/migration-snapshot.json`; doctor усе ще може повторно використати той самий
  перевірений передміграційний архів без запису допоміжного файла стану.
- Курсори шини Nostr і стан публікації профілю тепер використовують спільний стан Plugin SQLite.
  Їхній план імпорту застарілого JSON живе в поверхні налаштування/міграції doctor для Nostr Plugin.
- Перемикачі сесій Active Memory тепер використовують спільний стан Plugin SQLite замість
  `session-toggles.json`; повторне ввімкнення пам’яті видаляє рядок замість
  перезапису JSON-об’єкта.
- Пропозиції Skill Workshop і лічильники переглядів тепер використовують спільний стан Plugin SQLite
  замість сховищ `skill-workshop/<workspace>.json` для кожного робочого простору. Кожна
  пропозиція є окремим рядком під `skill-workshop/proposals`, а лічильник переглядів
  є окремим рядком під `skill-workshop/reviews`.
- Запуски під-агентів рецензентів Skill Workshop тепер використовують resolver транскриптів сесій
  середовища виконання замість створення допоміжних шляхів сесій
  `skill-workshop/<sessionId>.json`.
- Оренди процесів ACPX тепер використовують спільний стан Plugin SQLite під
  `acpx/process-leases` замість реєстру цілого файла `process-leases.json`.
  Кожна оренда зберігається як власний рядок, зберігаючи очищення застарілих процесів під час запуску
  без runtime-шляху перезапису JSON.
- Скрипти-обгортки ACPX та ізольований домашній каталог Codex генеруються в
  тимчасовому корені OpenClaw. Вони повторно створюються за потреби й не є вхідними даними
  для резервного копіювання або міграції.
- Збереження реєстру запусків під-агентів використовує типізовані спільні рядки `subagent_runs`. Старий
  шлях `subagents/runs.json` тепер є лише вхідними даними для міграції doctor, а
  назви runtime-допоміжників більше не описують шар стану як дисковий.
  Runtime-тести більше не створюють невалідні або порожні фікстури `runs.json`, щоб довести
  поведінку реєстру; вони напряму засівають/читають рядки SQLite.
- Резервне копіювання готує каталог стану перед архівуванням, копіює не-базові файли,
  створює знімки баз даних `*.sqlite` через `VACUUM INTO`, пропускає live-допоміжні файли WAL/SHM,
  записує метадані знімків у маніфест архіву та записує
  завершені запуски резервного копіювання в SQLite разом із маніфестом архіву. `openclaw backup
create` перевіряє записаний архів за замовчуванням; `--no-verify` є
  явним швидким шляхом.
- `openclaw backup restore` перевіряє архів перед розпакуванням, повторно використовує
  нормалізований маніфест verifier і відновлює перевірені ресурси маніфесту до їхніх
  записаних вихідних шляхів. Для записів потрібен `--yes`, а `--dry-run`
  підтримується для плану відновлення.
- Старий фільтр volatile-шляхів резервного копіювання видалено. Резервному копіюванню більше не потрібен
  live-tar skip list для застарілих JSON/JSONL-файлів сесій або cron, оскільки знімки SQLite
  готуються перед створенням архіву.
- Звичайне налаштування та підготовка робочого простору onboarding більше не створюють
  каталоги `agents/<agentId>/sessions/`. Вони створюють лише config/workspace;
  рядки сесій SQLite і рядки транскриптів створюються на вимогу в
  базі даних конкретного агента.
- Виправлення дозволів безпеки тепер націлюється на глобальні та агентні бази даних SQLite
  плюс допоміжні файли WAL/SHM замість `sessions.json` і JSONL-файлів транскриптів.
- Runtime-назви реєстру sandbox тепер напряму описують види реєстру SQLite
  замість перенесення застарілої термінології JSON-реєстру через активне сховище.
- `openclaw reset --scope config+creds+sessions` видаляє агентні
  бази даних `openclaw-agent.sqlite` плюс допоміжні файли WAL/SHM, а не лише застарілі
  каталоги `sessions/`.
- Агреговані допоміжники сесій Gateway тепер використовують назви, орієнтовані на записи:
  `loadCombinedSessionEntriesForGateway` повертає `{ databasePath, entries }`.
  Стару термінологію combined-store видалено з runtime-викликачів.
- Початкове засівання Docker MCP channel тепер записує основний рядок сесії та події транскрипта
  в агентну базу даних SQLite замість створення
  `sessions.json` і JSONL-транскрипта.
- Вбудований hook session-memory тепер визначає контекст попередньої сесії з
  SQLite за `{agentId, sessionId}`. Він більше не сканує, не зберігає та не синтезує
  шляхи транскриптів або каталоги `workspace/sessions`.
- Вбудований hook command-logger тепер записує рядки аудиту команд до спільної
  таблиці SQLite `command_log_entries` замість додавання до
  `logs/commands.log`.
- Allowlist прив’язки каналів тепер експонують лише допоміжники читання/запису на базі SQLite
  під час виконання та в Plugin SDK. Старий resolver шляху `*-allowFrom.json` і
  файловий reader живуть лише в застарілому коді імпорту doctor.
- `migration_runs` записує виконання міграцій застарілого стану зі статусом,
  часовими мітками та JSON-звітами.
- `migration_sources` записує кожне імпортоване застаріле файлове джерело з хешем, розміром,
  кількістю записів, цільовою таблицею, ідентифікатором запуску, статусом і станом видалення джерела.
- `backup_runs` записує шляхи архівів резервного копіювання, статус і JSON-маніфести.
- Глобальна схема не зберігає невикористану таблицю реєстру `agents`. Виявлення
  баз даних агентів є канонічним реєстром `agent_databases`, доки середовище виконання
  не матиме реального власника записів агентів.
- Згенерована config каталогу моделей зберігається в типізованих глобальних рядках SQLite
  `agent_model_catalogs`, ключованих за каталогом агента. Runtime-викликачі використовують
  `ensureOpenClawModelCatalog`; у runtime-коді немає API сумісності `models.json`.
  Реалізація записує SQLite, а вбудований реєстр PI гідратується з цього збереженого payload
  без створення файла `models.json`.
- Markdown-експорт транскриптів сесій QMD і config `memory.qmd.sessions` було
  видалено. Немає колекції транскриптів QMD, runtime-шляху `qmd/sessions*`
  і файлового bridge для пам’яті сесій.
- Runtime memory-core імпортує допоміжники індексації транскриптів SQLite з
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, а не з
  підшляху QMD SDK. Підшлях QMD зберігає реекспорт сумісності лише для
  зовнішніх викликачів, доки major-очищення SDK не зможе його видалити.
- Власний `index.sqlite` QMD тепер є тимчасовою runtime-матеріалізацією, підкріпленою
  основною таблицею SQLite `plugin_blob_entries`. Середовище виконання більше не створює довговічний
  допоміжний каталог `~/.openclaw/agents/<agentId>/qmd`.
- Опційний Plugin `memory-lancedb` більше не створює
  `~/.openclaw/memory/lancedb` як неявне сховище, кероване OpenClaw. Це
  зовнішній бекенд LanceDB, і він залишається вимкненим, доки оператор не налаштує
  явний `dbPath`.
- `check:database-first-legacy-stores` провалює нове runtime-джерело, яке поєднує
  назви застарілих сховищ із файловими API стилю запису. Він також провалює runtime-джерело,
  яке повторно вводить вилучені маркери bridge транскриптів
  `transcriptLocator` або `sqlite-transcript://...`. Код міграції, doctor, імпорту
  та явного не-сесійного експорту залишається дозволеним. Ширші назви застарілих контрактів,
  як-от `sessionFile`, `storePath` і старі файлово-епохальні фасади `SessionManager`,
  усе ще мають поточних власників і потребують окремої роботи над guard міграції,
  перш ніж вони зможуть стати обов’язковою preflight-перевіркою. Тепер guard також охоплює
  runtime-сховища `cache/*.json`, узагальнені допоміжні файли
  `thread-bindings.json`, JSON стану cron/журналу запусків, JSON стану здоров’я config,
  допоміжні файли перезапуску та lock, налаштування Voice Wake, схвалення прив’язок Plugin,
  JSON індексу встановлених Plugin, JSONL аудиту File Transfer, журнали активності Memory Wiki,
  старий текстовий журнал вбудованого `command-logger` і діагностичні перемикачі raw-stream JSONL pi-mono.
  Він також забороняє старі назви застарілих модулів doctor на кореневому рівні, щоб
  код сумісності залишався під `src/commands/doctor/`. Обробники налагодження Android
  також використовують logcat/in-memory output замість staging файлів кешу `camera_debug.log` або
  `debug_logs.txt`.

## Цільова форма схеми

Зберігайте схеми явними. Стан виконання, яким володіє хост, використовує типізовані таблиці. Непрозорий стан, яким володіє Plugin, використовує `plugin_state_entries` / `plugin_blob_entries`; загальної хостової таблиці `kv` немає.

Глобальна база даних:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

База даних агента:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

Майбутній пошук може додати таблиці FTS без зміни канонічних таблиць подій:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Великі значення мають використовувати стовпці `blob`, а не кодування рядків JSON. Зберігайте `value_json` для невеликих структурованих даних, які мають лишатися доступними для перегляду звичайними інструментами SQLite.

`agent_databases` є канонічним реєстром для цієї гілки. Не додавайте таблицю `agents`, доки не зʼявиться реальний власник запису агента; конфігурація агента залишається в `openclaw.json`.

## Форма міграції Doctor

Doctor має викликати один явний крок міграції, який можна звітувати й безпечно запускати повторно:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` викликає реалізацію міграції стану після звичайної попередньої перевірки конфігурації та створює перевірену резервну копію перед імпортом. Запуск runtime і `openclaw migrate` не повинні імпортувати застарілі файли стану OpenClaw.

Властивості міграції:

- Один прохід міграції знаходить усі застарілі файлові джерела й створює план перед будь-якими змінами.
- Doctor створює перевірений архів резервної копії перед міграцією до імпорту застарілих файлів.
- Імпорти є ідемпотентними та привʼязаними до шляху джерела, mtime, розміру, хешу й цільової таблиці.
- Успішно оброблені файли джерел видаляються або архівуються після commit цільової бази даних.
- Невдалі імпорти залишають джерело без змін і записують попередження в `migration_runs`.
- Код runtime читає лише SQLite після появи міграції.
- Шлях downgrade/export-to-runtime-files не потрібен.

## Інвентар міграції

Перемістіть це в глобальну базу даних:

- Записи середовища виконання реєстру завдань тепер використовують спільну
  базу даних; невипущений імпортер супровідної бази `tasks/runs.sqlite`
  видалено. Збереження знімків оновлює або вставляє за id завдання і видаляє
  лише відсутні рядки завдань/доставки.
- Записи середовища виконання Task Flow тепер використовують спільну базу
  даних; невипущений імпортер супровідної бази
  `tasks/flows/registry.sqlite` видалено. Збереження знімків оновлює або
  вставляє за id потоку і видаляє лише відсутні рядки потоків.
- Записи стану Plugin під час виконання тепер використовують спільну базу
  даних; невипущений імпортер супровідної бази
  `plugin-state/state.sqlite` видалено.
- Вбудований пошук у памʼяті більше не використовує за замовчуванням
  `memory/<agentId>.sqlite`; його індексні таблиці живуть у базі даних
  відповідного агента, а явне додаткове ввімкнення супровідного сховища
  `memorySearch.store.path` перенесено до міграції конфігурації doctor.
- Вбудована переіндексація памʼяті скидає лише таблиці памʼяті в базі даних
  агента. Вона не повинна замінювати весь файл SQLite, бо та сама база даних
  містить сеанси, транскрипти, рядки VFS, артефакти й кеші середовища виконання.
- Реєстри контейнерів/браузерів пісочниці з монолітного та шардованого JSON.
  Записи середовища виконання тепер використовують спільну базу даних;
  імпорт застарілого JSON збережено.
- Визначення Cron-завдань, стан розкладу та історія запусків тепер
  використовують спільний SQLite; doctor імпортує/видаляє застарілі файли
  `jobs.json`, `jobs-state.json` і `cron/runs/*.jsonl`
- Ідентичність/автентифікація пристрою, push, перевірка оновлень, зобовʼязання,
  кеш моделей OpenRouter, індекс установлених Plugin і привʼязки app-server
- Записи сполучення пристрою/вузла та початкового завантаження тепер
  використовують типізовані таблиці SQLite
- Підписники сповіщень про сполучення пристрою та маркери доставлених запитів
  тепер використовують спільну таблицю SQLite plugin-state замість
  `device-pair-notify.json`.
- Записи голосових викликів тепер використовують спільну таблицю SQLite
  plugin-state у просторі імен `voice-call` / `calls` замість `calls.jsonl`;
  CLI Plugin відстежує й підсумовує історію викликів, підтриману SQLite.
- Сеанси QQBot Gateway, записи відомих користувачів і кеш цитат ref-index
  тепер використовують стан SQLite Plugin у просторах імен `qqbot`
  (`sessions`, `known-users`, `ref-index`) замість `session-*.json`,
  `known-users.json` і `ref-index.jsonl`; міграція QQBot doctor/setup
  імпортує й видаляє застарілі файли.
- Налаштування вибору моделей Discord, хеші розгортання команд і привʼязки
  потоків тепер використовують стан SQLite Plugin у просторах імен `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  замість `model-picker-preferences.json`, `command-deploy-cache.json` і
  `thread-bindings.json`; міграція Discord doctor/setup імпортує й видаляє
  застарілі файли.
- Курсори catchup BlueBubbles і маркери дедуплікації вхідних повідомлень тепер
  використовують стан SQLite Plugin у просторах імен `bluebubbles`
  (`catchup-cursors`, `inbound-dedupe`) замість `bluebubbles/catchup/*.json` і
  `bluebubbles/inbound-dedupe/*.json`; міграція BlueBubbles doctor/setup
  імпортує й видаляє застарілі файли.
- Зсуви оновлень Telegram, записи кешу стікерів, записи кешу ланцюжків
  відповідей, записи кешу надісланих повідомлень, записи кешу назв тем і
  привʼязки потоків тепер використовують стан SQLite Plugin у просторах імен
  `telegram` (`update-offsets`, `sticker-cache`, `message-cache`,
  `sent-messages`, `topic-names`, `thread-bindings`) замість
  `update-offset-*.json`, `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` і
  `thread-bindings-*.json`; міграція Telegram doctor/setup імпортує й видаляє
  застарілі файли.
- Курсори catchup iMessage, зіставлення коротких id відповідей і рядки
  дедуплікації sent-echo тепер використовують стан SQLite Plugin у просторах
  імен `imessage` (`catchup-cursors`, `reply-cache`, `sent-echoes`) замість
  `imessage/catchup/*.json`, `imessage/reply-cache.jsonl` і
  `imessage/sent-echoes.jsonl`; міграція iMessage doctor/setup імпортує й
  видаляє застарілі файли.
- Розмови, опитування, токени SSO і вивчені дані зворотного звʼязку
  Microsoft Teams тепер використовують простори імен стану SQLite Plugin
  (`conversations`, `polls`, `sso-tokens`, `feedback-learnings`) замість
  `msteams-conversations.json`, `msteams-polls.json`,
  `msteams-sso-tokens.json` і `*.learnings.json`; міграція Microsoft Teams
  doctor/setup імпортує й архівує застарілі файли. Очікувані завантаження є
  короткочасним кешем SQLite, а старі файли кешу JSON не мігруються.
- Кеш синхронізації Matrix, метадані сховища, привʼязки потоків, маркери
  дедуплікації вхідних повідомлень, стан cooldown для перевірки запуску,
  облікові дані, ключі відновлення та криптографічні знімки SDK IndexedDB
  тепер використовують простори імен стану/blob SQLite Plugin під `matrix`
  (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  замість `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` і `crypto-idb-snapshot.json`; міграція Matrix
  doctor/setup імпортує й видаляє ці застарілі файли з коренів сховища Matrix,
  scoped за обліковим записом.
- Курсори шини Nostr і стан публікації профілю тепер використовують стан
  SQLite Plugin у просторах імен `nostr` (`bus-state`, `profile-state`) замість
  `bus-state-*.json` і `profile-state-*.json`; міграція Nostr doctor/setup
  імпортує й видаляє застарілі файли.
- Перемикачі сеансів Active Memory тепер використовують стан SQLite Plugin під
  `active-memory/session-toggles` замість `session-toggles.json`.
- Черги пропозицій Skill Workshop і лічильники перевірок тепер використовують
  стан SQLite Plugin під `skill-workshop/proposals` і
  `skill-workshop/reviews` замість файлів `skill-workshop/<workspace>.json`
  для кожного робочого простору.
- Черги вихідної доставки й доставки сеансів тепер спільно використовують
  глобальну таблицю SQLite `delivery_queue_entries` під окремими назвами черг
  (`outbound-delivery`, `session-delivery`) замість довговічних файлів
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` і
  `session-delivery-queue/*.json`. Крок doctor legacy-state імпортує очікувані
  та невдалі рядки, видаляє застарілі маркери доставлення і видаляє старі файли
  JSON після імпорту. Поля гарячої маршрутизації та повторів є типізованими
  стовпцями; payload JSON збережено лише для повторного відтворення/debug.
- Оренди процесів ACPX тепер використовують стан SQLite Plugin під
  `acpx/process-leases` замість `process-leases.json`.
- Метадані запусків резервного копіювання та міграції

Перемістити це в бази даних агентів:

- Корені сеансів агента та payload записів сеансів у формі сумісності.
  Виконано для записів середовища виконання: гарячі метадані сеансів доступні
  для запитів у `sessions`, а повний payload `SessionEntry` у застарілій формі
  лишається в `session_entries`.
- Події транскриптів агента. Виконано для записів середовища виконання.
- Контрольні точки Compaction і знімки транскриптів. Виконано для записів
  середовища виконання: копії транскриптів контрольних точок є рядками
  транскриптів SQLite, а метадані контрольних точок записуються в
  `transcript_snapshots`. Допоміжні функції контрольних точок Gateway тепер
  називають ці значення знімками транскриптів, а не вихідними файлами.
- Scratch/workspace простори імен VFS агента. Виконано для записів VFS
  середовища виконання.
- Payload вкладень субагентів. Виконано для записів середовища виконання: це
  початкові записи SQLite VFS і ніколи не довговічні файли робочого простору.
- Артефакти інструментів. Виконано для записів середовища виконання.
- Артефакти запусків. Виконано для записів середовища виконання worker через
  таблицю `run_artifacts` для кожного агента.
- Локальні кеші середовища виконання агента. Виконано для записів scoped cache
  середовища виконання worker через таблицю `cache_entries` для кожного агента.
  Загальні кеші моделей Gateway лишаються в глобальній базі даних, якщо вони
  не стають специфічними для агента.
- Журнали батьківських потоків ACP. Виконано для записів середовища виконання.
- Сеанси ledger повторного відтворення ACP. Виконано для записів середовища
  виконання через `acp_replay_sessions` і `acp_replay_events`; застарілий
  `acp/event-ledger.json` лишається лише вхідними даними для doctor.
- Метадані сеансів ACP. Виконано для записів середовища виконання через
  `acp_sessions`; застарілі блоки `entry.acp` у `sessions.json` є лише вхідними
  даними міграції doctor.
- Супровідні файли траєкторій, коли вони не є явними файлами експорту. Виконано
  для записів середовища виконання: захоплення траєкторії пише рядки
  `trajectory_runtime_events` у базу даних агента й дзеркалить артефакти,
  scoped за запуском, у SQLite. Застарілі супровідні файли є лише вхідними
  даними імпорту doctor; експорт може матеріалізувати нові вихідні файли JSONL
  support-bundle, але не читає і не мігрує старі супровідні файли
  траєкторій/транскриптів під час виконання. Захоплення траєкторії під час
  виконання надає scope SQLite; допоміжні функції шляхів JSONL ізольовані для
  підтримки експорту/debug і не реекспортуються з модуля середовища виконання.
  Метадані траєкторії embedded-runner записують ідентичність
  `{agentId, sessionId, sessionKey}` замість збереження локатора транскрипту.

Поки що залишити файлово підтриманими:

- `openclaw.json`
- файли облікових даних провайдера або CLI
- маніфести Plugin/пакетів
- робочі простори користувача та Git-репозиторії, коли вибрано дисковий режим
- журнали, призначені для операторського tailing, якщо конкретну поверхню
  журналів не переміщено

## План міграції

### Фаза 0: Заморозити межу

Зробити межу довговічного стану явною перед переміщенням більшої кількості рядків:

- Додати таблицю `migration_runs` до глобальної бази даних.
  Виконано для звітів виконання міграції застарілого стану.
- Додати єдиний сервіс міграції стану, що належить doctor, для імпорту з файлів
  у базу даних. Виконано: `openclaw doctor --fix` використовує реалізацію
  міграції застарілого стану.
- Зробити `plan` лише для читання, а `apply` таким, що створює резервну копію,
  імпортує, перевіряє, а потім видаляє або карантинує старі файли.
  Виконано: doctor створює перевірену резервну копію перед міграцією, передає
  шлях резервної копії в `migration_runs` і повторно використовує шляхи
  імпортера/видалення.
- Додати статичні заборони, щоб новий код середовища виконання не міг записувати
  застарілі файли стану, тоді як код міграції й тести все ще можуть їх
  засівати/читати. Виконано для поточних мігрованих застарілих сховищ; захист
  також сканує вкладені тести на заборонені контракти локатора транскрипту
  середовища виконання.

### Фаза 1: Завершити глобальну площину керування

Тримати спільний координаційний стан у `state/openclaw.sqlite`:

- Агенти та реєстр баз даних агентів
- Журнали завдань і Task Flow
- Стан Plugin
- Реєстр контейнерів/браузерів пісочниці
- Історія запусків Cron/планувальника
- Сполучення, пристрій, push, перевірка оновлень, TUI, кеші OpenRouter/моделей
  та інший малий runtime-стан, scoped за Gateway
- Метадані резервного копіювання та міграції
- Байти медіавкладень Gateway. Виконано для записів середовища виконання;
  прямі файлові шляхи є тимчасовими матеріалізаціями для сумісності з
  відправниками каналів і staging пісочниці. Allowlist середовища виконання
  приймають шляхи матеріалізації SQLite, а не застарілі корені media
  state/config. Doctor імпортує застарілі медіафайли в `media_blobs` і видаляє
  вихідні файли після успішного запису рядків.
- Сеанси, події та payload blob захоплення debug proxy. Виконано: захоплення
  живуть у спільній базі даних стану та відкриваються через спільні bootstrap,
  схему, WAL і налаштування busy-timeout бази даних стану. Байти payload
  стискаються gzip у `capture_blobs.data`; немає runtime-перевизначення
  супровідної БД debug proxy, каталогу blob або згенерованої схеми/цілі codegen
  лише для proxy-capture. Міграція doctor/startup імпортує рядки випущеного
  `debug-proxy/capture.sqlite` і посилані payload blob, включно з активними
  застарілими перевизначеннями середовища DB/blob, а потім архівує ці джерела,
  лишаючи CA-сертифікати без змін.

Ця фаза також видаляє дублікати відкривачів супровідних сховищ, допоміжні
функції дозволів, налаштування WAL, очищення файлової системи та записувачі
сумісності з цих підсистем.

### Фаза 2: Запровадити бази даних для кожного агента

Створити одну базу даних на агента й зареєструвати її з глобальної БД:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

Глобальний рядок `agent_databases` зберігає шлях, версію схеми, часову мітку
останнього спостереження та базові метадані розміру/цілісності. Код середовища
виконання запитує реєстр про БД агента замість прямого виведення файлових
шляхів.

БД агента містить:

- `sessions` як канонічний корінь сеансу, із `session_entries` як таблицею корисного навантаження форми сумісності, прикріпленою до цього кореня, і
  `session_routes` як унікальним пошуком активного `session_key`
- `conversations` і `session_conversations` як нормалізована ідентичність маршрутизації провайдера,
  прикріплена до сеансів
- `transcript_events`
- знімки транскриптів і контрольні точки Compaction. Виконано для записів runtime.
- `vfs_entries`
- `tool_artifacts` і артефакти запусків
- локальні для агента рядки runtime/кешу. Виконано для кешів в області worker.
- події батьківського потоку ACP
- події runtime траєкторії, коли вони не є явними артефактами експорту

### Фаза 3: Замінити API сховища сеансів

Виконано для runtime. Поверхня сховища сеансів у файловій формі не є активним
контрактом runtime:

- Runtime більше не викликає `loadSessionStore(storePath)` і не розглядає `storePath` як
  ідентичність сеансу.
- Операції runtime з рядками: `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` і `listSessionEntries`.
- Помічники повного перезапису сховища, файлові записувачі, тести черг, обрізання псевдонімів і
  параметри видалення застарілих ключів прибрано з runtime.
- Застарілі експорти сумісності кореневого пакета досі адаптують канонічні
  шляхи `sessions.json` до API рядків SQLite.
- Розбір `sessions.json` залишається лише в коді міграції/імпорту doctor і
  тестах doctor.
- Резервне читання життєвого циклу runtime читає заголовки транскриптів SQLite, а не перші
  рядки JSONL.

Продовжуйте видаляти все, що повторно вводить параметри файлових блокувань,
лексику обрізання/усікання як файлового обслуговування, ідентичність шляху сховища або тести,
єдиним твердженням яких є збереження JSON.

### Фаза 4: Перенести транскрипти, потоки ACP, траєкторії та VFS

Зробіть кожен потік даних агента нативним для бази даних:

- Записи додавання транскриптів проходять через одну транзакцію SQLite, яка забезпечує
  заголовок сеансу, перевіряє ідемпотентність повідомлення, вибирає батьківський хвіст, вставляє
  у `transcript_events` і записує доступні для запитів метадані ідентичності в
  `transcript_event_identities`. Виконано для прямих додавань повідомлень транскриптів і
  звичайних збережених додавань `TranscriptSessionManager`; явні операції гілок
  зберігають свій явний вибір батька і все ще записують рядки SQLite
  без виведення будь-якого файлового локатора.
- Журнали батьківського потоку ACP стають рядками, а не файлами `.acp-stream.jsonl`. Виконано.
- Налаштування породження ACP більше не зберігає шляхи JSONL транскриптів. Виконано.
- Захоплення траєкторій runtime записує рядки подій/артефакти напряму. Явна
  команда підтримки/експорту все ще може створювати артефакти JSONL пакета підтримки як
  формат експорту, але експорт сеансу не відтворює JSONL сеансу. Виконано.
- Дискові робочі простори залишаються на диску, коли налаштовано дисковий режим.
- Чернетковий VFS і експериментальний режим робочого простору лише VFS використовують БД агента.

Міграція один раз імпортує старі файли JSONL, записує лічильники/хеші в
`migration_runs` і видаляє імпортовані файли після перевірок цілісності.

### Фаза 5: Резервне копіювання, відновлення, Vacuum і перевірка

Резервні копії залишаються одним архівним файлом:

- Створіть контрольну точку для кожної глобальної та агентської бази даних.
- Зніміть знімок кожної БД із семантикою резервного копіювання SQLite або `VACUUM INTO`.
- Заархівуйте компактні знімки БД, конфігурацію, зовнішні облікові дані та запитані
  експорти робочих просторів.
- Не включайте сирі активні файли `*.sqlite-wal` і `*.sqlite-shm`.
- Перевіряйте, відкриваючи кожен знімок БД і виконуючи `PRAGMA integrity_check`.
  `openclaw backup create` виконує цю перевірку архіву за замовчуванням;
  `--no-verify` пропускає лише прохід архіву після запису, а не перевірку цілісності
  створення знімка.
- Відновлення копіює знімки назад до їхніх цільових шляхів. Ця гілка скидає
  невипущену розкладку SQLite до `user_version = 1`; майбутні випущені зміни схеми
  можуть додати явні міграції, коли вони знадобляться.

### Фаза 6: Runtime worker

Тримайте режим worker експериментальним, поки впроваджується розділення баз даних:

- Worker отримують ідентифікатор агента, ідентифікатор запуску, режим файлової системи та ідентичність реєстру БД.
- Кожен worker відкриває власне підключення SQLite.
- Батько зберігає повноваження доставки каналу, схвалень, конфігурації та скасування.
- Почніть з одного worker на активний запуск; додайте пулінг лише після того, як життєвий цикл і
  володіння підключенням БД стануть стабільними.

### Фаза 7: Видалити старий світ

Виконано для керування сеансами runtime. Старий світ дозволений лише як явне
вхідне значення doctor або вихід підтримки/експорту:

- Жодних записів runtime `sessions.json`, JSONL транскриптів, JSON реєстру sandbox, бічної SQLite для task
  або бічної SQLite стану plugin.
- Жодного обрізання файлів JSON/сеансів, усікання файлових транскриптів, блокувань файлів сеансів
  або тестів сеансів у формі блокувань.
- Жодних експортів сумісності runtime, метою яких є підтримання старих файлів сеансів
  актуальними.
- Явні експорти підтримки залишаються запитуваними користувачем форматами архіву/матеріалізації
  і не повинні подавати імена файлів назад в ідентичність runtime.

## Резервне копіювання та відновлення

Резервні копії мають бути одним архівним файлом, але захоплення бази даних має бути
нативним для SQLite:

1. Зупиніть довготривалу активність запису або увійдіть у короткий бар’єр резервного копіювання.
2. Для кожної глобальної та агентської бази даних виконайте контрольну точку.
3. Зніміть знімок кожної бази даних за допомогою семантики резервного копіювання SQLite або `VACUUM INTO` у
   тимчасовий каталог резервної копії.
4. Заархівуйте стиснені знімки баз даних, файл конфігурації, каталог облікових даних,
   вибрані робочі простори та маніфест.
5. Перевірте архів, відкривши кожен включений знімок SQLite і виконавши
   `PRAGMA integrity_check`.
   `openclaw backup create` робить це за замовчуванням; `--no-verify` призначений лише для
   навмисного пропуску проходу архіву після запису.

Не покладайтеся на сирі активні копії `*.sqlite`, `*.sqlite-wal` і `*.sqlite-shm` як
основний формат резервної копії. Маніфест архіву має записувати роль бази даних,
ідентифікатор агента, версію схеми, шлях джерела, шлях знімка, розмір у байтах і статус
цілісності.

Відновлення має перебудовувати глобальну базу даних і файли баз даних агентів зі
знімків архіву. Оскільки розкладка SQLite ще не випускалася, цей рефакторинг
зберігає лише схему версії 1 плюс імпорт файлів у базу даних doctor. Команда відновлення
спочатку перевіряє архів, а потім замінює кожен ресурс маніфесту з
перевіреного розпакованого корисного навантаження.

## План рефакторингу runtime

1. Додати API реєстру баз даних.
   - Визначати шляхи глобальної БД і БД для кожного агента.
   - Зберігати невипущені схеми на `user_version = 1`; не додавати код виконавця
     міграцій схеми, доки випущеній схемі це не знадобиться.
   - Додати помічники закриття/контрольної точки/цілісності, які використовують тести, резервне копіювання та doctor.

2. Згорнути бічні сховища SQLite.
   - Перенести таблиці стану plugin у глобальну базу даних. Виконано для записів runtime;
     невипущений імпортер застарілої бічної бази видалено.
   - Перенести таблиці реєстру task у глобальну базу даних. Виконано для записів runtime;
     невипущений імпортер застарілої бічної бази видалено.
   - Перенести таблиці Task Flow у глобальну базу даних. Виконано для записів runtime;
     невипущений імпортер застарілої бічної бази видалено.
   - Перенести вбудовані таблиці пошуку в пам’яті в кожну базу даних агента. Виконано; явний
     користувацький `memorySearch.store.path` тепер видаляється міграцією конфігурації doctor.
     Повне переіндексування виконується на місці лише проти таблиць пам’яті; старий шлях
     заміни всього файла і помічник заміни бічного індексу видалено.
   - Видалити дубльовані відкривачі баз даних, налаштування WAL, помічники дозволів і
     шляхи закриття з цих підсистем.

3. Перенести таблиці, якими володіє агент, у бази даних для кожного агента.
   - Створювати БД агента на вимогу через глобальний реєстр баз даних. Виконано.
   - Перенести записи сеансів runtime, події транскриптів, рядки VFS і артефакти інструментів
     у БД агентів. Виконано.
   - Не мігрувати локальні для гілки записи сеансів спільної БД, події транскриптів,
     рядки VFS або артефакти інструментів; ця розкладка ніколи не випускалася. Зберігати лише застарілий
     імпорт файлів у базу даних у doctor.

4. Замінити API сховища сеансів.
   - Прибрати `storePath` як ідентичність runtime. Виконано для runtime і захищено
     `check:database-first-legacy-stores`: метадані сеансів, оновлення маршрутів,
     збереження команд, очищення сеансів CLI, попередні перегляди міркувань Feishu,
     збереження стану транскрипту, глибина subagent, перевизначення сеансів профілю auth,
     логіка батьківського fork і перевірка QA-lab тепер визначають
     базу даних із канонічних ключів агента/сеансу.
     Відповіді списків сеансів Gateway/TUI/UI/macOS тепер показують `databasePath`
     замість застарілого `path`; налагоджувальні поверхні macOS показують базу даних для кожного агента
     як стан лише для читання замість запису конфігурації `session.store`.
     `/status`, керований чатом експорт траєкторій і проксі залежностей CLI більше
     не поширюють застарілі шляхи сховища; резервний облік використання транскриптів читає
     SQLite за ідентичністю агента/сеансу. Тести runtime і bridge більше не показують
     `storePath`; вхідні значення doctor/міграції володіють цією застарілою назвою поля.
     Комбіноване завантаження сеансів Gateway більше не має спеціальної гілки runtime для
     нетемплейтних значень `session.store`; воно агрегує рядки SQLite для кожного агента.
     Застарілу lane doctor для блокувань сеансів і її помічник очищення `.jsonl.lock`
     видалено; SQLite тепер є межею конкурентності сеансів.
     Гарячі місця виклику runtime використовують орієнтовані на рядки назви помічників, як-от
     `resolveSessionRowEntry`; старий псевдонім сумісності `resolveSessionStoreEntry`
     прибрано з runtime і експортів SDK plugin.

- Використовувати операції рядків `{ agentId, sessionKey }`.
  Виконано: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` і `listSessionEntries` є API насамперед SQLite, які не
  потребують шляху сховища сеансів. Підсумок статусу, статус локального агента, health
  і команда списку `openclaw sessions` тепер читають рядки для кожного агента напряму
  і показують шляхи баз даних SQLite для кожного агента замість шляхів `sessions.json`.
- Замінити видалення/вставлення всього сховища на `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` і запити очищення SQL.
  Виконано для runtime: гарячі шляхи тепер використовують API рядків і повторювані після конфлікту виправлення рядків;
  решта помічників імпорту/заміни всього сховища обмежені кодом імпорту міграцій
  і тестами бекенда SQLite.
  - Видалити `store-writer.ts` і тести черги записувача. Виконано.
  - Видалити runtime-обрізання застарілих ключів і параметри видалення псевдонімів з upsert/patch
    рядків сеансів. Виконано.

5. Видалити поведінку runtime для JSON-реєстру.
   - Зробити читання і записи реєстру sandbox лише SQLite. Виконано.
   - Імпортувати монолітний і шардований JSON лише з кроку міграції. Виконано.
   - Видалити блокування шардованого реєстру і записи JSON. Виконано.

- Зберігати одну типізовану таблицю реєстру замість збереження рядків реєстру як загального
  непрозорого JSON, якщо форма залишається операційним станом гарячого шляху. Виконано.

6. Видалити мутацію сеансів у формі файлового блокування.
   - Виконано для створення блокувань runtime і API блокувань runtime.
   - Окрему lane очищення застарілих `.jsonl.lock` doctor видалено.
   - `session.writeLock` є застарілою конфігурацією, мігрованою doctor, а не типізованим runtime
     налаштуванням.
   - Цілісність стану більше не має окремого шляху обрізання сирітських файлів транскриптів;
     міграція doctor імпортує/видаляє застарілі джерела JSONL в одному місці.
   - Координація singleton Gateway використовує типізовані рядки SQLite `state_leases` під
     `gateway_locks` і більше не відкриває шов каталогу файлових блокувань.
   - Загальне збереження дедуплікації SDK plugin більше не використовує файлові блокування або JSON
     файли; воно записує спільні рядки стану plugin SQLite. Виконано.
   - Координація вбудовування QMD використовує lease стану SQLite замість
     `qmd/embed.lock`. Виконано.

7. Зробити worker обізнаними про базу даних.
   - Worker відкривають власні підключення SQLite.
   - Батько володіє доставкою, callback каналів і конфігурацією.
   - Worker отримує ідентифікатор агента, ідентифікатор запуску, режим файлової системи та ідентичність реєстру БД,
     а не активні дескриптори.
   - `vfs-only` залишається експериментальним і використовує базу даних агента як корінь
     свого сховища.
   - Спочатку зберігати один worker на активний запуск. Пулінг може зачекати, доки життєвий цикл
     підключення БД і поведінка скасування не стануть буденними.

8. Інтеграція резервного копіювання.
   - Навчити резервне копіювання створювати знімки глобальних баз даних і баз даних агентів через резервне копіювання SQLite або
     `VACUUM INTO`. Виконано для виявлених файлів `*.sqlite` під ресурсом стану.
   - Додати перевірку резервної копії на цілісність SQLite і версію схеми. Виконано для
     створення резервної копії та типових перевірок цілісності архіву.
   - Записувати метадані запуску резервного копіювання в SQLite. Виконано через спільну таблицю `backup_runs`
     зі шляхом до архіву, статусом і JSON маніфесту.
   - Додати відновлення з перевірених знімків архіву. Виконано: `openclaw backup
restore` перевіряє перед розпакуванням, використовує нормалізований
     маніфест верифікатора, підтримує `--dry-run` і вимагає `--yes` перед заміною
     записаних вихідних шляхів.
   - Включати експорт VFS/робочої області лише за запитом; не експортувати внутрішні дані сесій
     як JSON або JSONL.

9. Видалити застарілі тести й код. Виконано для відомих поверхонь сесій часу виконання.

- Видалити тести, які перевіряють створення під час виконання `sessions.json` або файлів transcript
  JSONL. Виконано для основного сховища сесій, чату, подій transcript Gateway,
  попереднього перегляду, життєвого циклу, оновлень session-entry команд, скидання/трасування автовідповіді та
  фікстур Dreaming memory-core, маршрутизації цілі схвалення, відновлення transcript сесії,
  відновлення дозволів безпеки, експорту trajectory та експорту сесії.
  Тести transcript Active Memory тепер перевіряють області SQLite і відсутність створення тимчасових або
  збережених файлів JSONL.
  Стару регресію обрізання transcript Heartbeat видалено, оскільки
  runtime більше не обрізає transcript JSONL.
  Тести інструмента списку сесій агента більше не моделюють застарілі шляхи `sessions.json`
  як форму відповіді Gateway; тести app/UI/macOS використовують `databasePath`.
  Тести використання transcript `/status` тепер безпосередньо засівають рядки transcript SQLite
  замість запису файлів JSONL.
  Тести життєвого циклу сесії Gateway тепер безпосередньо використовують допоміжні засоби засівання transcript SQLite;
  стара форма фікстури одно-рядкового файлу сесії зникла з покриття скидання
  й видалення.
  `sessions.delete` більше не повертає поле файлової епохи `archived: []`; видалення
  звітує лише результат мутації рядка. Старої опції `deleteTranscript`
  також більше немає: видалення сесії видаляє канонічний корінь `sessions` і дає
  SQLite каскадно видалити належні сесії рядки transcript, snapshot і trajectory, тож жоден
  викликач не може залишити осиротілі transcript або забути гілку очищення.
  Тести захоплення trajectory context-engine тепер читають рядки `trajectory_runtime_events`
  з ізольованої бази даних агента замість читання
  `session.trajectory.jsonl`.
  Скрипти засівання каналу Docker MCP тепер безпосередньо засівають рядки SQLite. Прямі
  записи `sessions.json` обмежені фікстурами doctor.
  Tool Search Gateway E2E читає докази tool-call з рядків transcript SQLite
  замість сканування файлів `agents/<agentId>/sessions/*.jsonl`.
  Події хоста memory-core і чорнові рядки session-corpus тепер живуть у спільному
  plugin-state SQLite; `events.jsonl` і `session-corpus/*.txt` є лише застарілими
  вхідними даними міграції doctor. Активні рядки використовують віртуальні шляхи
  `memory/session-ingestion/`, а не `.dreams/session-corpus`. Старий модуль відновлення Dreaming
  memory-core і його тести CLI/Gateway видалено, оскільки runtime більше не
  володіє відновленням файлового архіву для цього корпусу. Тести bridge/public-artifact
  memory-core більше не показують `.dreams/events.jsonl`; вони
  використовують віртуальну назву JSON-артефакту на базі SQLite.
  Публічна документація тестування SDK/Codex тепер говорить про стан сесії SQLite замість файлів сесії, а приклад channel-turn більше не відкриває аргумент `storePath`.
  Стан синхронізації Matrix тепер безпосередньо використовує сховище plugin-state SQLite. Активні
  контракти клієнта/runtime передають корінь сховища облікового запису, а не шлях `bot-storage.json`,
  а doctor імпортує застарілий `bot-storage.json` у SQLite перед видаленням
  джерела. Сценарії перезапуску/руйнівних дій QA Matrix тепер безпосередньо змінюють рядок синхронізації SQLite
  замість створення або видалення фальшивих файлів `bot-storage.json`, а
  підкладка E2EE передає корінь sync-store замість фальшивого
  шляху `sync-store.json`.
  Вибір storage-root Matrix більше не оцінює корені за застарілими JSON-файлами синхронізації/thread;
  він використовує довговічні метадані кореня плюс реальний crypto state.
  Набір тестів runtime SQLite session backend більше не фабрикує
  `sessions.json`; застарілі вихідні фікстури тепер живуть у тестах doctor,
  які їх імпортують.
  Тести сесій Gateway більше не відкривають допоміжний засіб `createSessionStoreDir` або
  невикористане налаштування тимчасового шляху session-store; каталоги фікстур явні, а пряме
  налаштування рядків використовує іменування session-row SQLite.
  Покриття парсера session-store JSON5 лише для doctor перенесено з infra-тестів
  у тести міграції doctor, тож набори runtime-тестів більше не володіють застарілим
  парсингом файлів сесій.
  Runtime-тести Microsoft Teams SSO/pending-upload більше не містять JSON sidecar
  фікстур або парсерів; парсинг застарілих SSO token живе лише в модулі міграції
  Plugin. Тести Telegram більше не засівають фальшиві шляхи сховища `/tmp/*.json`;
  вони безпосередньо скидають кеш повідомлень на базі SQLite. Загальний
  допоміжний засіб test-state OpenClaw більше не відкриває застарілий записувач `auth-profiles.json`;
  тести міграції авторизації doctor локально володіють цією фікстурою.
  Runtime-тести для вказівників останньої сесії TUI, схвалень exec, перемикачів Active Memory,
  дедуплікації/перевірки запуску Matrix, синхронізації джерела Memory Wiki,
  прив’язок current-conversation, авторизації onboarding і імпорту секретів Hermes більше не
  створюють старі sidecar-файли або перевіряють відсутність старих імен файлів. Вони
  доводять поведінку через рядки SQLite і публічні API сховища; тести doctor/міграції
  є єдиним місцем, де мають бути застарілі імена вихідних файлів.
  Runtime-тести для сполучення пристрою/node, channel allowFrom, намірів перезапуску,
  handoff перезапуску, записів черги доставки сесії, здоров’я конфігурації, кешів iMessage,
  cron jobs, заголовків transcript PI, реєстрів subagent і керованих
  вкладень зображень також більше не створюють вилучені файли JSON/JSONL лише для доведення,
  що їх ігнорують або що вони відсутні.
  Відновлення переповнення PI більше не має fallback переписування/обрізання SessionManager:
  обрізання tool-result і переписування transcript context-engine змінюють
  рядки transcript SQLite, а потім оновлюють активний prompt state з бази даних.
  Збережені додавання повідомлень SessionManager делегують атомарному допоміжному засобу додавання
  transcript SQLite для вибору parent та ідемпотентності. Звичайні
  додавання metadata/custom entry також вибирають поточного parent всередині SQLite, тож
  застарілі екземпляри manager не відроджують pre-SQLite перегони parent-chain.
  Синтетичне очищення tail PI для mid-turn prechecks і `sessions_yield` тепер
  безпосередньо обрізає стан transcript SQLite; старий міст tail-removal SessionManager
  і його тести видалено.
  Захоплення checkpoint Compaction також створює знімки лише з SQLite; викликачі більше
  не передають живий SessionManager як альтернативне джерело transcript.
- Залишити тести, які засівають застарілі файли лише для міграції.
- Докази JSON-файлів замінено доказами SQL-рядків для активних поверхонь
  runtime.

- Додати статичні заборони для runtime-записів у застарілі шляхи JSON сесій/кешу.
  Виконано для repo guard.

10. Зробити звіт міграції придатним для аудиту.
    - Записувати запуски міграції в SQLite із часовими позначками початку/завершення, вихідними
      шляхами, хешами джерел, лічильниками, попередженнями та шляхом резервної копії.
      Виконано: виконання міграції legacy-state тепер зберігають звіт `migration_runs`
      з інвентарем вихідних шляхів/таблиць, SHA-256 вихідного файлу, розмірами,
      кількістю записів, попередженнями та шляхом резервної копії.
      Виконано: виконання міграції legacy-state також зберігають рядки `migration_sources`
      для аудиту на рівні джерел і майбутніх рішень skip/backfill.
    - Зробити apply ідемпотентним. Повторний запуск після часткового імпорту має або
      пропускати вже імпортоване джерело, або зливати за стабільним ключем.
      Виконано: індекси сесій, transcript, черги доставки, plugin state, task
      ledgers і глобальні рядки SQLite, що належать агенту, імпортуються через стабільні ключі або
      семантику upsert/replace, тож повторні запуски зливаються без дублювання довговічних
      рядків.
    - Невдалі імпорти повинні залишати оригінальний вихідний файл на місці.
      Виконано: невдалі імпорти transcript тепер залишають оригінальне джерело JSONL за
      його виявленим шляхом, а `migration_sources` записує джерело як
      `warning` з `removed_source=0` для наступного запуску doctor.

## Правила продуктивності

- Одне з’єднання на thread/process прийнятне; не спільно використовуйте handles між
  workers.
- Використовуйте WAL, `foreign_keys=ON`, 30-секундний busy timeout і короткі транзакції запису `BEGIN IMMEDIATE`.
- Залишайте допоміжні засоби write transaction синхронними, доки/якщо async transaction
  API не додасть явну семантику mutex/backpressure.
- Тримайте записи parent delivery малими й транзакційними.
- Уникайте переписування всього сховища; використовуйте upsert/delete на рівні рядків.
- Додайте індекси для list-by-agent, list-by-session, updated-at, run id і
  шляхів expiration перед перенесенням гарячого коду.
- Зберігайте великі артефакти, медіа та вектори як BLOB або chunked BLOB rows, а не
  base64 чи numeric-array JSON.
- Тримайте opaque plugin-state entries малими й scoped.
- Додайте SQL-очищення для TTL/expiration замість pruning файлової системи.
  Виконано для database-owned runtime stores: media, plugin state, plugin blobs,
  persistent dedupe і agent cache всі вичерпуються через рядки SQLite. Решта
  очищення файлової системи обмежена тимчасовими materializations або явними
  командами видалення.

## Статичні заборони

Додайте перевірку repo, яка провалює нові runtime-записи в застарілі шляхи стану:

- `sessions.json`
- `*.trajectory.jsonl`, крім матеріалізованих виходів support-bundle
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- файли кешу виконання `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` і `recovery-key.json`
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- JSON-файли сегментів реєстру пісочниці
- JSON-файли моста native hook relay у `/tmp`
- `plugin-state/state.sqlite`
- спеціальні супровідні файли виконання `openclaw-state.sqlite`
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- оздоблення профілю браузера `.openclaw-profile-decorated`
- відкривачі сеансів із файловим сховищем `SessionManager.open(...)`
- фасади списку транскриптів `SessionManager.listAll(...)` і `TranscriptSessionManager.listAll(...)`
- фасади відгалуження транскриптів `SessionManager.forkFromSession(...)` і
  `TranscriptSessionManager.forkFromSession(...)`
- фасади заміни змінних сеансів `SessionManager.newSession(...)` і `TranscriptSessionManager.newSession(...)`
- фасади сеансів-гілок `SessionManager.createBranchedSession(...)` і
  `TranscriptSessionManager.createBranchedSession(...)`

Заборона має дозволяти тестам створювати застарілі фікстури й дозволяти коду міграції
читати/імпортувати/видаляти застарілі файлові джерела. Невипущені супровідні SQLite-файли залишаються забороненими
й не отримують дозволів на імпорт для doctor.

## Критерії готовності

- Записи даних виконання й кешу спрямовуються до глобальної або агентської бази даних SQLite.
- Виконання більше не записує індекси сеансів, JSONL транскриптів, JSON реєстру пісочниці,
  супровідні SQLite-файли завдань або супровідні SQLite-файли plugin-state. Імпортери невипущених супровідних SQLite-файлів завдань
  і plugin-state видалено.
- Імпорт застарілих файлів доступний лише через doctor.
- Резервне копіювання створює один архів із компактними знімками SQLite та доказом цілісності.
- Агентські працівники можуть запускатися зі сховищем на диску, чернетковим VFS або експериментальним сховищем лише VFS.
- Конфігурація та явні файли облікових даних залишаються єдиними очікуваними постійними
  керівними файлами не баз даних.
- Перевірки репозиторію запобігають повторному введенню застарілих файлових сховищ виконання.
