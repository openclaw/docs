---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделей/провайдерів
    - Налагодження поведінки gateway і агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker-ранери та що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-06T16:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d90ff6e00c3e03c480922529cdf77e508add1ca5fc1bdded3d0e4e16aa43d10
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває)
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем із моделями/провайдерами

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- QA-сайт на основі Docker: `pnpm qa:lab:up`

Коли ви змінюєте тести або хочете більше впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо запустити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Порада: коли вам потрібен лише один збійний випадок, краще звужувати live-тести через allowlist-змінні середовища, описані нижче.

## Набори тестів (що де запускається)

Думайте про ці набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: п’ять послідовних shard-запусків (`vitest.full-*.config.ts`) поверх наявних scoped-проєктів Vitest
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` та дозволені node-тести `ui`, які покриває `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидко й стабільно
- Примітка щодо проєктів:
  - Ненацілений `pnpm test` тепер запускає п’ять менших shard-конфігурацій (`core-unit`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного великого native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` усе ще використовує native root `vitest.config.ts` project graph, оскільки цикл watch із кількома shard-ами непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише маршрутованих source/test файлів; зміни config/setup усе ще повертаються до широкого повторного запуску root-project.
  - Вибрані тести `plugin-sdk` і `commands` також маршрутизуються через виділені легкі lanes, які пропускають `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
  - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними sibling-тестами в цих легких lanes, щоб редагування helper-ів не перезапускали весь важкий набір для цього каталогу.
  - `auto-reply` тепер має три виділені buckets: top-level core helper-и, top-level integration-тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це утримує найважчу роботу harness reply поза дешевими status/chunk/token тестами.
- Примітка щодо embedded runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime context compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте здоровими integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id та поведінка compaction як і раніше проходять
    через реальні шляхи `run.ts` / `compact.ts`; тести лише на helper-и не є
    достатньою заміною для цих integration-шляхів.
- Примітка щодо pool:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує неізольований раннер для root projects, e2e та live config-ів.
  - Коренева UI-lane зберігає своє налаштування `jsdom` і optimizer, але тепер також працює на спільному неізольованому раннері.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо вам потрібно порівняти зі стандартною поведінкою V8.
- Примітка щодо швидкої локальної ітерації:
  - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи чисто зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищою межею для worker-ів.
  - Автоматичне масштабування локальних worker-ів тепер навмисно консервативне і також зменшує навантаження, коли середнє навантаження хоста вже високе, тому кілька одночасних запусків Vitest за замовчуванням менше шкодять.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється wiring тестів.
  - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка щодо perf-debug:
  - `pnpm test:perf:imports` вмикає звітність про тривалість імпортів у Vitest плюс вивід розбивки імпортів.
  - `pnpm test:perf:imports:changed` обмежує той самий вид профілювання файлами, зміненими відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутований `test:changed` з native root-project шляхом для цього зафіксованого diff-а та друкує wall time плюс macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточне dirty tree, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує CPU-профіль main-thread для накладних витрат запуску й трансформації Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує профілі CPU+heap раннера для unit-набору з вимкненим файловим parallelism.

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, узгоджено з рештою репозиторію.
  - Використовує адаптивну кількість worker-ів (CI: до 2, локально: 1 за замовчуванням).
  - Типово запускається в silent mode, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість worker-ів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути детальний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pair-ing вузлів і важче мережеве навантаження
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: backend smoke OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Обсяг:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell у OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за бажанням; не входить до типового запуску `pnpm test:e2e`
  - Потрібен локальний CLI `openshell` і робочий Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний двійковий файл CLI або wrapper-script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін форматів провайдера, особливостей виклику tool-ів, проблем auth і поведінки rate limit
- Очікування:
  - За задумом нестабільні для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштують грошей / використовують ліміти запитів
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють config/auth матеріали в тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви свідомо хочете, щоб live-тести використовували ваш реальний home directory.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але прибирає додаткове повідомлення про `~/.profile` і заглушує логи bootstrap gateway / шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях із rate limit.
- Вивід прогресу/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тому довгі виклики провайдера помітно активні навіть тоді, коли перехоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/gateway відразу транслюються під час live-запусків.
  - Налаштовуйте heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви багато змінили)
- Торкаєтесь мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик tool-ів: запустіть звужений `pnpm test:live`

## Live: огляд можливостей Android-вузла

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка зараз оголошується** підключеним Android-вузлом, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене / ручне налаштування (набір не встановлює, не запускає і не pair-ить застосунок).
  - Перевірка `node.invoke` gateway команда за командою для вибраного Android-вузла.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключений і спарений із gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи / згода на захоплення надані для можливостей, які ви очікуєте пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні подробиці налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два рівні, щоб можна було ізолювати збої:

- «Direct model» показує, чи може провайдер/модель взагалі відповісти з указаним ключем.
- «Gateway smoke» показує, чи працює повний pipeline gateway+agent для цієї моделі (sessions, history, tools, sandbox policy тощо).

### Рівень 1: Direct model completion (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб реально запустити цей набір; інакше він буде пропущений, щоб `pnpm test:live` лишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні env-значення
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «pipeline gateway agent зламаний»
  - Містить маленькі ізольовані регресії (приклад: reasoning replay + tool-call flows для OpenAI Responses/Codex Responses)

### Рівень 2: Gateway + smoke dev agent-а (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process gateway
  - Створити/оновити session `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі-з-ключами й перевіряти:
    - «змістовну» відповідь (без tool-ів)
    - що реальний виклик tool-а працює (read probe)
    - необов’язкові додаткові tool probes (exec+read probe)
    - що шляхи регресії OpenAI (лише tool-call → follow-up) і далі працюють
- Деталі probe-ів (щоб можна було швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read` його та повторити nonce назад.
  - `exec+read` probe: тест просить агента записати nonce через `exec` у тимчасовий файл, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити
- Як вибирати провайдерів (уникати «усе OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Tool + image probes у цьому live-тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (навантаження на tool-и)
  - image probe запускається, коли модель оголошує підтримку image input
  - Потік (високорівнево):
    - Тест генерує маленький PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent передає моделі мультимодальне повідомлення користувача
    - Перевірка: відповідь містить `cat` + код (допуск OCR: дрібні помилки дозволені)

Порада: щоб побачити, що ви можете тестувати на своїй машині (і точні id `provider/model`), запустіть:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI-backend-а (Codex CLI або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent з використанням локального CLI-backend-а, не торкаючись вашої типової конфігурації.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Модель: `codex-cli/gpt-5.4`
  - Команда: `codex`
  - Аргументи: `["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]`
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне image-вкладення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до image-файлів як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання image-аргументів, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  
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
- Він запускає live smoke CLI-backend-а всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Для `codex-cli` він встановлює Linux-пакет `@openai/codex` у кешований записуваний префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік conversation-bind ACP з live ACP agent-ом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати synthetic conversation message-channel на місці
  - надіслати звичайний follow-up у тій самій conversation
  - перевірити, що follow-up потрапляє в transcript прив’язаної ACP-session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агент: `claude`
  - Synthetic channel: контекст розмови на кшталт Slack DM
  - ACP-backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Ця lane використовує поверхню gateway `chat.send` з admin-only synthetic originating-route fields, щоб тести могли прикріплювати контекст message-channel без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів плагіна `acpx` для вибраного ACP harness agent-а.

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
- Він підвантажує `~/.profile`, переносить відповідні матеріали auth CLI в контейнер, встановлює `acpx` у записуваний npm-префікс, а потім встановлює запитаний live CLI (`@anthropic-ai/claude-code` або `@openai/codex`), якщо його немає.
- Усередині Docker раннер установлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з підвантаженого профілю доступними для дочірнього harness CLI.

### Рекомендовані live-рецепти

Вузькі явні allowlist-и — найшвидші й найменш нестабільні:

- Одна модель, direct (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик tool-ів через кілька провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст OAuth Antigravity (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API-ключ / auth профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний двійковий файл `gemini`; він має власну auth і може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми покриваємо)

Немає фіксованого «списку моделей CI» (live запускається за бажанням), але ось **рекомендовані** моделі, які варто регулярно покривати на dev-машині з ключами.

### Сучасний smoke-набір (виклик tool-ів + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати працездатним:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустити gateway smoke з tool-ами + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик tool-ів (Read + необов’язковий Exec)

Виберіть принаймні одну модель на родину провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик tool-ів залежить від режиму API)

### Vision: надсилання image (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою image до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/OpenAI vision-capable variants тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoints): `minimax` (cloud/API), плюс будь-який OpenAI/Anthropic-compatible proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко фіксувати «всі моделі» в документації. Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині + доступні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі auth для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це мається на увазі під «ключами профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється в staged live home, якщо існує, але це не основне сховище ключів профілів)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні CLI auth-каталоги в тимчасовий test home; перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються з цього staged config, щоб probes не торкалися вашого реального workspace хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` в контейнер).

## Live Deepgram (транскрибування аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live медіапотоку ComfyUI workflow

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для image, video і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, polling, завантаженнях або реєстрації plugin-а

## Live генерації image

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin для генерації image
  - Завантажує відсутні env-змінні провайдерів із вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної auth/profile/model
  - Проганяє стандартні варіанти генерації image через спільну runtime capability:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, які покриваються:
  - `openai`
  - `google`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

## Live генерації музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні провайдерів із вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` із вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

## Live генерації відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - Завантажує env-змінні провайдерів із вашої login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні shell-облікові дані
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` із вхідними даними лише у вигляді prompt
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled`
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний відеовхід на основі buffer у спільному sweep
  - Поточне live-покриття `videoToVideo`:
    - `google`
    - `openai`
    - `runway` лише коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному sweep:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалених reference URL `http(s)` / MP4
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл з ключами профілів усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і workspace (та підвантажуючи `~/.profile`, якщо змонтовано). Відповідні локальні entrypoint-и — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням використовують меншу межу smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  ви явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох Docker-live lanes.
- Container smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker-ранери також bind-монтують лише потрібні home-каталоги auth CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішніх CLI міг оновлювати токени, не змінюючи сховище auth на хості:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboard-ing (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережа gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика restart для Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Live-model Docker-ранери також bind-монтують поточний checkout лише для читання й
переносять його в тимчасову workdir усередині контейнера. Це зберігає runtime-
образ компактним, але водночас дозволяє запускати Vitest точно на ваших локальних source/config.
Етап staging пропускає великі локальні кеші й результати збірок застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги
`.build` або результати Gradle, тому Docker live-запуски не витрачають хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні channel worker-и Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе одно запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити gateway
live-покриття з цієї Docker-lane.
`test:docker:openwebui` — це compatibility smoke вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими HTTP-endpoint-ами, сумісними з OpenAI,
запускає прив’язаний контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися витягнути
образ Open WebUI, а самому Open WebUI — завершити власне cold-start налаштування.
Ця lane очікує придатний live-ключ моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невелике JSON-повідомлення на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він піднімає seeded Gateway-
контейнер, запускає другий контейнер, який стартує `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, читання transcript-ів, метадані вкладень,
поведінку черги live-подій, outbound send routing і сповіщення про channel +
дозволи в стилі Claude через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо інспектує raw stdio MCP-фрейми, тому smoke перевіряє саме те, що
міст реально випромінює, а не лише те, що випадково показує конкретний client SDK.

Ручний smoke plain-language thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflows регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`), монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`), монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`), монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`), монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли auth CLI у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів у контейнері
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити прив’язаний тег образу Open WebUI

## Перевірка документації

Після редагування документів запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку Mintlify anchors, коли вам також потрібна перевірка заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик tool-ів gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер gateway (WS `wizard.start`/`wizard.next`, записує config + примусове застосування auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals на надійність агентів (Skills)

У нас уже є кілька CI-safe тестів, які поводяться як «evals на надійність агентів»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні wizard-flow, які перевіряють wiring session і ефекти config (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills наведено в prompt, чи вибирає агент правильний skill (або уникає неважливих)?
- **Compliance:** чи читає агент `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/аргументів?
- **Workflow contracts:** багатокрокові сценарії, які перевіряють порядок tool-ів, перенесення history між сесіями та межі sandbox.

Майбутні evals повинні спершу залишатися детермінованими:

- Сценарний раннер із mock-провайдерами для перевірки викликів tool-ів + їх порядку, читання skill-файлів і wiring session.
- Невеликий набір сценаріїв, сфокусованих на skills (використовувати чи уникати, gate-ing, prompt injection).
- Необов’язкові live-evals (за бажанням, під контролем env) лише після того, як буде готовий CI-safe набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму контракту інтерфейсу. Вони перебирають усі виявлені plugin-и й запускають набір
перевірок форми та поведінки. Типова unit-lane `pnpm test` навмисно
пропускає ці спільні seam- та smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin-а (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язування session
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API каталогу/списку учасників
- **group-policy** - Забезпечення групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки status provider-а
- **registry** - Форма registry plugin-ів

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/вибирання auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin-ів
- **loader** - Завантаження plugin-ів
- **runtime** - Runtime provider-а
- **shape** - Форма/інтерфейс plugin-а
- **wizard** - Майстер налаштування

### Коли запускати

- Після змін у `plugin-sdk` exports або subpath-ах
- Після додавання або зміни channel- чи provider-plugin-а
- Після рефакторингу реєстрації або виявлення plugin-ів

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- За можливості додайте CI-safe регресію (mock/stub provider або зафіксуйте точне перетворення форми запиту)
- Якщо вона за своєю природою лише live (rate limits, політики auth), тримайте live-тест вузьким і за бажанням через env-змінні
- Віддавайте перевагу найменшому рівню, який ловить помилку:
  - помилка конвертації/відтворення запиту провайдера → direct models test
  - помилка pipeline gateway session/history/tool → gateway live smoke або CI-safe gateway mock test
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один вибраний target на клас SecretRef із метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec id відхиляються.
  - Якщо ви додаєте нове сімейство target-ів SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.
