---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для багів моделей/провайдерів
    - Налагодження поведінки gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker-ранери та що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-06T15:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2c8af6ff9cbef3d148f9d51016d9bc35b069a4467fb72874be265872ca13da1
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває)
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем із моделями/провайдерами

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Прямий таргетинг файлу тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Коли налагоджуєте реальні провайдери/моделі (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо запустити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Порада: якщо вам потрібен лише один збійний випадок, краще звузити live-тести через змінні середовища allowlist, описані нижче.

## Набори тестів (що де запускається)

Сприймайте набори як «зростаючий реалізм» (і зростаючу флейковість/вартість):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нативні Vitest `projects` через `vitest.config.ts`
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і включені до allowlist node-тести `ui`, що покриваються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка щодо projects:
  - Нетаргетований `pnpm test` усе ще використовує конфігурацію root `projects` Vitest.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped lanes, коли diff торкається лише маршрутизованих source/test файлів; зміни config/setup усе ще повертаються до широкого повторного запуску root project.
  - Вибрані тести `plugin-sdk` і `commands` також маршрутизуються через окремі легкі lanes, що пропускають `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
  - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих легких lanes, щоб зміни helper-файлів не спричиняли повторний запуск усього важкого набору для цього каталогу.
- Примітка щодо embedded runner:
  - Коли ви змінюєте вхідні дані для виявлення message-tool або контекст виконання compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте інтеграційні набори embedded runner у справному стані:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped ids і поведінка compaction як і раніше проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих інтеграційних шляхів.
- Примітка щодо pool:
  - Базова конфігурація Vitest тепер за замовчуванням використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує non-isolated runner для root projects, e2e і live config.
  - Root UI lane зберігає свій `jsdom` setup та optimizer, але тепер також працює на спільному non-isolated runner.
  - `pnpm test` успадковує ті самі значення `threads` + `isolate: false` з конфігурації root `projects` у `vitest.config.ts`.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також за замовчуванням додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо вам потрібно порівняти з типовою поведінкою V8.
- Примітка щодо швидкої локальної ітерації:
  - `pnpm test:changed` маршрутизується через scoped lanes, коли змінені шляхи однозначно зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищою межею кількості worker-ів.
  - Автомасштабування локальних worker-ів тепер навмисно консервативне і також зменшує навантаження, коли середнє навантаження хоста вже високе, тому кілька одночасних запусків Vitest за замовчуванням менше шкодять.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб changed-mode повторні запуски залишалися коректними, коли змінюється wiring тестів.
  - Конфігурація зберігає ввімкненим `OPENCLAW_VITEST_FS_MODULE_CACHE` на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете мати одне явне місце кешу для прямого профілювання.
- Примітка щодо perf-debug:
  - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту, а також вивід import-breakdown.
  - `pnpm test:perf:imports:changed` обмежує той самий профільний вигляд файлами, зміненими відносно `origin/main`.
  - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для накладних витрат запуску та трансформації Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner-а для unit-набору з вимкненим паралелізмом файлів.

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Значення runtime за замовчуванням:
  - Використовує Vitest `threads` з `isolate: false`, узгоджено з рештою репозиторію.
  - Використовує адаптивну кількість worker-ів (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в тихому режимі, щоб зменшити накладні витрати на I/O консолі.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово встановити кількість worker-ів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, прив’язка вузлів і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестів (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через fs bridge sandbox-а
- Очікування:
  - Лише opt-in; не входить до стандартного запуску `pnpm test:e2e`
  - Потрібні локальний CLI `openshell` і справний Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб указати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей tool-calling, проблем auth і поведінки rate limit
- Очікування:
  - Не є стабільним для CI за своєю природою (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limits
  - Краще запускати звужені піднабори, а не «все»
- Live-запуски зчитують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють config/auth-матеріали у тимчасовий test home, щоб unit-fixtures не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує логи завантаження gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову бачити повні стартові логи.
- Ротація API-ключів (специфічно для провайдера): установіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або використайте перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на rate limit.
- Вивід прогресу/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб було видно активність навіть під час довгих викликів провайдера, коли перехоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/gateway одразу передаються під час live-запусків.
  - Налаштовуйте heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте таку таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато що змінили)
- Зміни в gateway networking / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / специфічних для провайдера збоїв / tool calling: запускайте звужений `pnpm test:live`

## Live: sweep можливостей Android node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі рекламує** підключений Android node, і перевірити поведінку контракту команд.
- Обсяг:
  - Передумови/ручне налаштування (набір не встановлює/не запускає/не прив’язує застосунок).
  - Перевірка `node.invoke` gateway для вибраного Android node по кожній команді.
- Потрібне попереднє налаштування:
  - Android app уже підключено та прив’язано до gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте успішними.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи здатні провайдер/модель взагалі відповісти з наданим ключем.
- «Gateway smoke» показує, що повний pipeline gateway+agent працює для цієї моделі (sessions, history, tools, sandbox policy тощо).

### Шар 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Запустити невелике completion для кожної моделі (і таргетовані регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб цей набір справді запускався; інакше він буде пропущений, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` є псевдонімом для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: зі сховища профілів і резервних env-значень
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «pipeline агента gateway зламаний»
  - Містить невеликі, ізольовані регресії (наприклад, reasoning replay + tool-call flows для OpenAI Responses/Codex Responses)

### Шар 2: Gateway + dev agent smoke (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/змінити сесію `agent:dev:*` (перевизначення моделі на кожен запуск)
  - Ітеруватися по моделях із ключами й перевіряти:
    - «змістовну» відповідь (без tools)
    - що працює реальний виклик tool (read probe)
    - додаткові probes tools за потреби (exec+read probe)
    - що шляхи регресій OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі probe-ів (щоб ви могли швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce.
  - `exec+read` probe: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` є псевдонімом для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
- Як вибрати провайдерів (уникайте «усе OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probes у цьому live-тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (навантаження на tools)
  - image probe запускається, коли модель рекламує підтримку image input
  - Потік (на високому рівні):
    - Тест генерує маленький PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent передає моделі multimodal user message
    - Перевірка: відповідь містить `cat` + код (OCR tolerance: незначні помилки допустимі)

Порада: щоб побачити, що саме можна протестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Codex CLI або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent з використанням локального CLI backend, не торкаючись вашої стандартної конфігурації.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Модель: `codex-cli/gpt-5.4`
  - Команда: `codex`
  - Аргументи: `["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- Перевизначення (необов’язкові):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` щоб надіслати реальне image attachment (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` щоб передавати шляхи до image-файлів як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`) щоб керувати передаванням image-аргументів, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` щоб надіслати другий хід і перевірити resume flow.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Примітки:

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Для `codex-cli` він установлює Linux-пакет `@openai/codex` у кешований доступний для запису префікс за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний conversation-bind flow ACP із live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати synthetic message-channel conversation на місці
  - надіслати звичайне follow-up у тій самій conversation
  - перевірити, що follow-up потрапляє в transcript прив’язаної ACP session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значення за замовчуванням:
  - ACP agent: `claude`
  - Synthetic channel: контекст conversation у стилі Slack DM
  - ACP backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Цей lane використовує поверхню gateway `chat.send` з admin-only synthetic originating-route полями, щоб тести могли прикріпити контекст message-channel, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів плагіна `acpx` для вибраного ACP harness agent.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-acp-bind
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- Він зчитує `~/.profile`, підготовлює відповідні auth-матеріали CLI в контейнері, установлює `acpx` у доступний для запису npm prefix, а потім установлює потрібний live CLI (`@anthropic-ai/claude-code` або `@openai/codex`), якщо його немає.
- Усередині Docker раннер установлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера із завантаженого profile доступними для дочірнього harness CLI.

### Рекомендовані live-рецепти

Вузькі, явні allowlist-и є найшвидшими та найменш флейковими:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling через кілька провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує OAuth-міст Antigravity (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API key / auth профілю); це те, що більшість користувачів має на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний binary `gemini`; він має власну auth-модель і може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live є opt-in), але це **рекомендовані** моделі, які слід регулярно покривати на робочій машині з ключами.

### Сучасний smoke-набір (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати в робочому стані:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запускати gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Виберіть принаймні одну модель з кожного сімейства провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновішу доступну)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання image (attachment → multimodal message)

Додайте принаймні одну модель із підтримкою image у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI vision-capable variants тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використайте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні endpoint-и): `minimax` (cloud/API), а також будь-який сумісний з OpenAI/Anthropic proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко зафіксувати «всі моделі» в документації. Авторитетний список — це все, що повертає `discoverModels(...)` на вашій машині, плюс усі доступні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі auth для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється у staged live home, якщо присутній, але це не основне сховище ключів профілю)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий каталог `credentials/` і підтримувані зовнішні каталоги auth CLI у тимчасовий test home; перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються в цій staged-конфігурації, щоб probes не торкалися вашого реального робочого середовища хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Deepgram live (транскрибування аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy image, video і `music_generate`
  - Пропускає кожну можливість, якщо `models.providers.comfy.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflow comfy, polling, downloads або реєстрації плагіна

## Live для генерації зображень

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin генерації зображень
  - Завантажує відсутні env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдери без придатних auth/profile/model
  - Запускає стандартні варіанти генерації зображень через спільну runtime capability:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, що покриваються:
  - `openai`
  - `google`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати перевизначення лише через env

## Live для генерації музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Обсяг:
  - Перевіряє спільний вбудований шлях provider для генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдери без придатних auth/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з input лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної лінії:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати перевизначення лише через env

## Live для генерації відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Обсяг:
  - Перевіряє спільний вбудований шлях provider для генерації відео
  - Завантажує env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдери без придатних auth/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з input лише у вигляді prompt
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled`
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний відеовхід на основі буфера в межах спільного sweep
  - Поточне live-покриття `videoToVideo`:
    - `google`
    - `openai`
    - `runway` лише коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі потребують віддалених URL-посилань `http(s)` / MP4
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати перевизначення лише через env

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключами профілів усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та workspace (і зчитують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint-и: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням використовують меншу межу smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам навмисно потрібен більший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох live Docker lanes.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-mount-ять лише потрібні auth-home каталогів CLI (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішніх CLI міг оновлювати токени, не змінюючи host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережа gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст MCP channel (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Плагіни (smoke встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Docker-ранери live-моделей також монтують поточний checkout лише для читання і
підготовлюють його в тимчасовому workdir усередині контейнера. Це зберігає runtime
image компактним, але водночас дає змогу запускати Vitest саме на вашому локальному source/config.
Етап підготовки пропускає великі локальні кеші та результати збирання застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні каталоги виходу `.build` або
Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probes gateway не запускали
реальні channel worker-и Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити gateway
live-покриття з цього Docker lane.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoint-ами,
запускає закріплений контейнер Open WebUI проти цього gateway, входить
через Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
реальний chat request через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися завантажити
образ Open WebUI, а самому Open WebUI — завершити власне холодне початкове налаштування.
Цей lane очікує придатний live-ключ моделі, і `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він піднімає seeded Gateway
container, запускає другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих conversation, читання transcript, metadata attachment-ів,
поведінку черги live-подій, маршрутизацію вихідного надсилання, а також сповіщення каналу +
дозволів у стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо інспектує сирі stdio MCP frame-и, тому smoke перевіряє те, що
міст фактично видає, а не лише те, що трапляється на поверхню певного SDK клієнта.

Ручний smoke plain-language thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для перевірки ACP thread routing, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і зчитується перед запуском тестів
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установок CLI усередині Docker
- Зовнішні auth-каталоги/файли CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Для звужених запусків провайдерів монтуються лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Ручне перевизначення: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` щоб вибрати модель, яку gateway відкриває для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` щоб перевизначити prompt перевірки nonce, використаний у smoke Open WebUI
- `OPENWEBUI_IMAGE=...` щоб перевизначити закріплений тег образу Open WebUI

## Базова перевірка документації

Запускайте перевірки docs після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку anchor-ів Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Gateway tool calling (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки wizard, що перевіряють wiring сесій і ефекти конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, що перевіряють порядок tools, перенесення history сесії та межі sandbox.

Майбутні eval-и мають насамперед залишатися детермінованими:

- Scenario runner з mock-провайдерами для перевірки викликів tools + їхнього порядку, читання skill-файлів і wiring сесій.
- Невеликий набір сценаріїв, зосереджених на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live eval-и (opt-in, із керуванням через env) лише після того, як безпечний для CI набір буде готовий.

## Contract-тести (форма plugin і channel)

Contract-тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Unit lane `pnpm test` за замовчуванням навмисно
пропускає ці спільні seam- і smoke-файли; запускайте contract-команди явно,
коли ви змінюєте спільні поверхні channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin-а (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Застосування group policy

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probes статусу channel
- **registry** - Форма registry plugin-ів

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/відбір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin-ів
- **loader** - Завантаження plugin-ів
- **runtime** - Runtime provider-а
- **shape** - Форма/інтерфейс plugin-а
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export-ів або subpath-ів plugin-sdk
- Після додавання або зміни channel чи provider plugin-а
- Після рефакторингу реєстрації або виявлення plugin-ів

Contract-тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо це можливо (mock/stub провайдера або фіксація точної трансформації форми запиту)
- Якщо це за своєю природою лише live-проблема (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому шару, який ловить баг:
  - баг перетворення/відтворення запиту провайдера → тест прямих моделей
  - баг pipeline gateway session/history/tool → gateway live smoke або безпечний для CI gateway mock-тест
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить по одній sampled-цілі для кожного класу SecretRef з metadata registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec ids відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не могли бути тихо пропущені.
