---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні, наскрізні та live-набори, Docker runners і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-04T21:16:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fec86c0e3843a3ad0dcc686f2b942c202af7dd23c33cf55ba384a9643702030
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він свідомо _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем із моделями/провайдерами.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовують сценарії, підкріплені репозиторієм.

Ця сторінка описує запуск звичайних тестових наборів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і відсилає до наведених вище довідників.
</Note>

## Швидкий старт

Більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на просторій машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Коли ви ітеруєте над одним збоєм, спочатку віддавайте перевагу таргетованим запускам.
- Docker-підтримуваний QA-сайт: `pnpm qa:lab:up`
- QA lane, підтримуваний Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більшої впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + Gateway-зонди інструментів/зображень): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність runtime: запустіть `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить показники завантаження Gateway на рівні джерел, пам’яті,
  plugin-pressure, повторюваного hello-loop fake-model і запуску CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невеликий зонд у стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний хід із зображенням.
    Вимикайте додаткові зонди за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають багаторазовий live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix-завдання, розбиті за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    запланованих/release-викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через нативну прив’язку Plugin замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness Codex app-server, що належить Plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує зонди image,
    cron MCP, sub-agent і Guardian. Вимикайте зонд sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші зонди:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після зонда sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Опціональна додаткова перевірка поверхні команди порятунку message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на аудитований типізований
    запис конфігурації.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + SecretRef-записи,
    перевіряє конфігурацію та audit-записи. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: із встановленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env allowlist vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч із головними тестовими наборами, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у виділених workflow. Agentic parity вкладено під
`QA-Lab - All Lanes` і release validation, а не окремий PR workflow.
Широка перевірка має використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. `QA-Lab - All Lanes`
запускається щоночі на `main` і з ручного dispatch з mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельними завданнями. Заплановані QA та release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і manual workflow input
за замовчуванням залишаються `all`; ручний dispatch може розбити `all` на `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli` завдання. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими й уникали звичайного запуску provider-plugin. Ці live transport
gateways вимикають пошук у пам’яті; поведінка пам’яті лишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім витягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії, прив’язані до репозиторію, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway-воркерами. `qa-channel` за замовчуванням має паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість воркерів, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу, не замінюючи сценарно-орієнтовану
    лінію `mock-openai`.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає живий набір випробувань Plugin OpenAI Kitchen Sink через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє інвентар поверхні SDK Plugin,
    зондує `/healthz` і `/readyz`, записує докази CPU/RSS Gateway,
    запускає живий хід OpenAI і перевіряє змагальну діагностику.
    Потребує живої автентифікації OpenAI, наприклад `OPENAI_API_KEY`. У гідратованих сесіях Testbox
    автоматично підтягує профіль живої автентифікації Testbox, коли наявний
    помічник `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенч запуску Gateway разом із невеликим пакетом мок-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    і не виглядають як регресія Gateway із багатохвилинним завантаженням CPU.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, якщо checkout ще не має
    свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у одноразовій Linux-VM Multipass.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Живі запуски переспрямовують підтримувані QA-вхідні дані автентифікації, практичні для гостьової системи:
    ключі провайдерів на базі env, шлях до конфігурації живого QA-провайдера та `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися в корені репозиторію, щоб гостьова система могла записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA-звіт і підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm-tarball із поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний онбординг із ключем OpenAI API, налаштовує Telegram
    за замовчуванням, перевіряє, що запакований runtime Plugin завантажується без startup
    dependency repair, запускає doctor і виконує один локальний хід агента проти
    змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію packaged-install
    з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke для зібраного застосунку для transcript-ів вбудованого runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    невідображуване кастомне повідомлення замість витоку у видимий хід користувача,
    потім засіває уражений зламаний session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидат пакета OpenClaw у Docker, запускає онбординг встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    живу QA-лінію Telegram із цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв’язаний локальний tarball замість
    встановлення з registry.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/автоматизації релізу задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет Convex наявні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - Обгортка перевіряє env облікових даних Telegram або Convex на хості перед
    роботою Docker build/install. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише під час навмисного налагодження підготовки до облікових даних.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions надає цю лінію як ручний maintainer-workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і lease-и облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для побічного продуктового доказу
  проти одного кандидата пакета. Він приймає довірений ref, опубліковану npm-специфікацію,
  HTTPS-URL tarball плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler із профілями ліній smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  QA-workflow Telegram проти того самого артефакта `package-under-test`.
  - Доказ останньої beta для продукту:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказ точного URL tarball потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Доказ артефакта завантажує tarball artifact з іншого run Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що setup discovery залишає неналаштовані завантажувані plugins відсутніми,
    перший налаштований doctor repair явно встановлює кожен відсутній завантажуваний
    plugin, а другий restart не запускає прихований dependency
    repair.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає сміття legacy-залежностей Plugin без
    postinstall repair з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke у гостьових системах Parallels. Кожна
    вибрана платформа спершу встановлює запитаний baseline package, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі й перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний
    хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до summary artifact і
    статусу кожної лінії.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для живого proof ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не могли
    забрати решту тестового вікна:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед припущенням, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10-15 хвилин на post-update doctor і package
    update work у холодній гостьовій системі; це все ще справний стан, коли вкладений npm
    debug log просувається.
  - Не запускайте цю агрегатну обгортку паралельно з окремими smoke-лініями Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, serving package або стану Gateway у гостьовій системі.
  - Post-update proof запускає звичайну поверхню bundled Plugin, оскільки
    capability facades, такі як мовлення, генерація зображень і розуміння media,
    завантажуються через bundled runtime APIs, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає живу QA-лінію Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і layout артефактів: [QA Matrix](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає живу QA-лінію Telegram проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних pooled credentials. Використовуйте env mode за замовчуванням або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому SUT bot має мати Telegram username.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios містять RTT від driver send request до спостереженої відповіді SUT.

Живі транспортні лінії спільно використовують один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття кожної лінії міститься в [огляд QA → Покриття живого транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким синтетичним набором і не входить до цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з пулу на базі Convex, виконує Heartbeat
цього lease, поки лінія працює, і звільняє lease під час shutdown.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір credential role:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайній роботі має використовувати `https://`.

Команди адміністратора для супровідників (додати/видалити/перелічити пул) вимагають саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для супровідників:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу у скриптах і CI
утилітах.

Типовий контракт endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Вичерпано/можна повторити: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише секрет супровідника)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет супровідника)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет супровідника)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє неправильно сформовані payload.

### Додавання каналу до QA

Архітектура й назви допоміжних сценарних функцій для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як “зростання реалістичності” (і зростання нестабільності/вартості):

### Модульні / інтеграційні (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в попроєктні конфігурації для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні тести UI запускаються у виділеному шарді `unit-ui`
- Обсяг:
  - Чисті модульні тести
  - Внутрішньопроцесні інтеграційні тести (автентифікація Gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` зі згенерованими малими фікстурами Plugin, а не
    реальними API джерел вбудованих Plugin. Завантаження API реальних Plugin належать до
    contract/integration наборів, якими володіє Plugin.

<AccordionGroup>
  <Accordion title="Проєкти, шарди й scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного нативного процесу root-project. Це зменшує пікове RSS на завантажених машинах і не дає роботі auto-reply/extension витісняти непов’язані набори.
    - `pnpm test --watch` і далі використовує нативний граф проєктів кореневого `vitest.config.ts`, бо багатоshardовий watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі правки тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні з import-graph. Правки config/setup/package не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним check gate для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для доказу тестами викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підняття версій лише в release metadata запускає цільові перевірки version/config/root-dependency із guard, який відхиляє зміни package поза верхньорівневим полем версії.
    - Правки live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для скриптів live Docker auth і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші правки package-surface і далі використовують ширші guard.
    - Import-light модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і схожих чистих utility-ділянок спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані файли джерел helpers `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих light lanes, тож правки helpers не перезапускають увесь важкий набір для цього каталогу.
    - `auto-reply` має виділені buckets для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім хвостом Node.
    - Звичайний PR/main CI навмисно пропускає пакетний sweep extension і release-only шард `agentic-plugins`. Full Release Validation dispatch окремо запускає дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли змінюєте вхідні дані discovery message-tool або runtime-контекст Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії helpers для чистих меж маршрутизації та нормалізації.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helpers
      не є достатньою заміною цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Пул Vitest і типові налаштування ізоляції">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e і live config.
    - Коренева UI lane зберігає свій setup `jsdom` і optimizer, але теж працює на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх процесів Node
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен розумний локальний check gate.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що правка harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим worker cap.
    - Локальне auto-scaling workers навмисно консервативне й відступає,
      коли середнє навантаження host уже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/config файли як
      `forceRerunTriggers`, щоб reruns у changed-mode залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування cache для прямого profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість import плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими після `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях config як ключ; include-pattern CI
      шарди додають назву шарда, щоб відфільтровані шарди можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на startup imports,
      тримайте важкі dependencies за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-import runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом root-project для цього закоміченого
      diff і виводить wall time плюс max RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточне
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile головного потоку для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із типово ввімкненою diagnostics
  - Проганяє синтетичний churn повідомлень gateway, memory і large-payload через diagnostic event path
  - Опитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається bounded, синтетичні RSS samples лишаються нижче pressure budget, а глибини per-session queue повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для подальшої stability-regression, не заміна повному набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` та E2E-тести вбудованих plugin під `extensions/`
- Типові параметри середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивні workers (CI: до 2, локально: типово 1).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати консольного I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного консольного виводу.
- Область:
  - Наскрізна поведінка Gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, сполучення вузлів і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke-перевірка бекенду OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований OpenShell Gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального `openshell` CLI та робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI-бінарника або wrapper-скрипта

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` та live-тести вбудованих plugin під `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - “Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?”
  - Виявлення змін формату провайдера, особливостей tool calling, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не “все”
- Live-запуски завантажують `~/.profile`, щоб підхопити відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють конфігурацію/матеріали автентифікації в тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували вашу реальну домашню директорію.
- `pnpm test:live` тепер типово працює тихіше: зберігає progress-вивід `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи bootstrap Gateway/повідомлення Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API-ключів (залежить від провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live перевизначення через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби на відповідях rate limit.
- Вивід progress/heartbeat:
  - Live-набори тепер виводять progress-рядки в stderr, щоб довгі виклики провайдера були помітно активними навіть тоді, коли консольне захоплення Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб progress-рядки провайдера/Gateway одразу транслювалися під час live-запусків.
  - Налаштовуйте heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeat для Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої частини Gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “мій bot не працює” / помилки, специфічні для провайдера / tool calling: запустіть звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live model matrix, smoke-перевірок CLI-бекенду, smoke-перевірок ACP, harness Codex app-server
та всіх live-тестів media-provider (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального чекліста оновлень і
перевірки plugin див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують вашу локальну директорію конфігурації та workspace (і завантажують `~/.profile`, якщо змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово використовують менший smoke-ліміт, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  явно хочете більший вичерпний scan.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/перевикористовує два образи `scripts/e2e/Dockerfile`. Bare image — це лише Node/Git runner для install/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball. Functional image встановлює той самий tarball у `/app` для built-app functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`; planner-логіка — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. Агрегат використовує weighted local scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує process slots, а resource caps не дають важким live, npm-install і multi-service lanes запускатися одночасно. Якщо один lane важчий за активні caps, scheduler усе ще може запустити його, коли pool порожній, і тримає його єдиним запущеним, доки capacity знову не стане доступною. Типові значення: 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише коли Docker host має більше запасу. Runner типово виконує Docker preflight, видаляє застарілі OpenClaw E2E containers, друкує статус кожні 30 секунд, зберігає timings успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці timings, щоб у наступних запусках стартувати довші lanes першими. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати weighted lane manifest без складання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI plan для вибраних lanes, потреб package/image і облікових даних.
- `Package Acceptance` — це GitHub-native package gate для "чи працює цей installable tarball як продукт?" Він визначає один candidate package з `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковані за шириною: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) щодо contract package/update/plugin, матриці published-upgrade survivor, release defaults і failure triage.
- Build and release checks запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить статичний built graph від `dist/entry.js` і `dist/cli/run-main.js` та падає, якщо startup до dispatch імпортує package dependencies, як-от Commander, prompt UI, undici або logging, до command dispatch; він також утримує bundled gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і model-list command.
- Legacy-сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цього cutoff harness допускає лише прогалини metadata shipped-package: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived git fixture, відсутній persisted `update.channel`, legacy plugin install-record locations, відсутня persistence marketplace install-record і міграція config metadata під час `plugins update`. Для packages після `2026.4.25` ці шляхи є strict failures.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` завантажують один або кілька реальних containers і перевіряють high-level integration paths.

Live-model Docker runners також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у container home перед запуском, щоб external-CLI OAuth міг оновлювати tokens без зміни host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-перевірка прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-перевірка бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-перевірка harness сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-перевірка спостережуваності: `pnpm qa:otel:smoke` — це приватна QA-гілка перевірки вихідного checkout. Її навмисно не включено до пакетних Docker-гілок релізу, бо npm tarball не містить QA Lab.
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-перевірка npm tarball onboarding/каналу/агента: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через env-ref onboarding і типово Telegram, запускає doctor та виконує один мокований хід агента OpenAI. Повторно використайте попередньо зібраний tarball із `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-перевірка перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакета `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Smoke-перевірка збереження після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненого фікстурного стану старого користувача з агентами, конфігурацією каналу, allowlist Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/сесій. Вона запускає оновлення пакета та неінтерактивний doctor без live ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Smoke-перевірка збереження після опублікованого оновлення: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей базовий стан за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до tarball кандидата, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один базовий стан через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть aggregate scheduler розгорнути точні базові стани через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `all-since-2026.4.23`, і розгорніть фікстури у формі issue через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту встановлення зовнішніх OpenClaw Plugin. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Smoke-перевірка runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження transcript прихованого runtime-контексту та ремонт doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke-перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використайте попередньо зібраний tarball із `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` зі зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-перевірка Docker інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між root, update і direct-npm контейнерами. Update smoke типово використовує npm `latest` як стабільний базовий стан перед оновленням до tarball кандидата. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, власником яких є root, не маскували поведінку встановлення в локальному середовищі користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-перевірка CLI видалення спільного workspace агентів: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає image з кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого workspace. Повторно використайте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, auth WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-перевірка browser CDP snapshot: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image разом із шаром Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP охоплюють URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Регресія OpenAI Responses web_search minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає мокований сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає reject схеми провайдера й перевіряє, що raw detail з’являється в логах Gateway.
- Міст MCP каналу (засіяний Gateway + stdio bridge + smoke-перевірка raw notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP інструменти Pi bundle (реальний stdio MCP server + smoke-перевірка allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованого cron і one-shot запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-перевірка install/update для local path, `file:`, npm registry з hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates і enable/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару package/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстури ClawHub.
- Smoke-перевірка незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-перевірка матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований tarball OpenClaw у порожньому контейнері, встановлює npm Plugin, перемикає enable/disable, оновлює й відкотить його через локальний npm registry, видаляє встановлений код, потім перевіряє, що uninstall все одно видаляє застарілий стан, одночасно логуючи метрики RSS/CPU для кожної фази життєвого циклу.
- Smoke-перевірка metadata перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює smoke-перевірку install/update для local path, `file:`, npm registry з hoisted dependencies, git moving refs, фікстур ClawHub, marketplace updates і enable/inspect Claude-bundle. `pnpm test:docker:plugin-update` охоплює поведінку незмінного оновлення встановлених Plugin. `pnpm test:docker:plugin-lifecycle-matrix` охоплює відстежувані за ресурсами встановлення, enable, disable, upgrade, downgrade npm Plugin і uninstall за відсутнього коду.

Щоб вручну попередньо зібрати й повторно використати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для suite перевизначення image, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо він ще не локальний. Docker тести QR та інсталятора зберігають власні Dockerfile, бо вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker-ранери для live-моделей також bind-mount-ять поточний checkout у режимі лише для читання та
розгортають його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок розгортання пропускає великі локальні кеші та вихідні файли збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також app-local `.build` або
каталоги виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
machine-specific артефактів.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні Telegram/Discord тощо channel workers усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цієї Docker lane.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoints,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
реальний chat request через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися завантажити
image Open WebUI, а Open WebUI може знадобитися завершити власне налаштування cold-start.
Ця lane очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує seeded контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення routed conversation, читання transcript, metadata attachment,
поведінку live event queue, outbound send routing і channel +
permission notifications у стилі Claude через реальний stdio MCP bridge. Перевірка notifications
безпосередньо інспектує сирі stdio MCP frames, тому smoke-тест перевіряє те, що
bridge фактично видає, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke-тест (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей script для regression/debug workflows. Він може знову знадобитися для валідації ACP thread routing, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) mounted до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) mounted до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) mounted до `/home/node/.profile` і sourced перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, sourced з `OPENCLAW_PROFILE_FILE`, з використанням тимчасових config/workspace dirs і без external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) mounted до `/home/node/.npm-global` для кешованих CLI installs усередині Docker
- External CLI auth dirs/files у `$HOME` mounted у режимі read-only під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком tests
  - Default dirs: `.minimax`
  - Default files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Narrowed provider runs монтують лише потрібні dirs/files, inferred з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers in-container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного image `openclaw:local-live` для reruns, яким не потрібна повторна збірка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` для гарантії, що creds надходять із profile store (а не env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору model, яку Gateway відкриває для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, що використовується smoke-тестом Open WebUI
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого image tag Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну валідацію anchors Mintlify, коли також потрібні перевірки in-page headings: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (CI-safe)

Це регресії «real pipeline» без реальних providers:

- Gateway tool calling (mock OpenAI, реальний Gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (Skills)

У нас уже є кілька CI-safe tests, які поводяться як «agent reliability evals»:

- Mock tool-calling через реальний Gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які перевіряють session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли skills перелічені в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає agent `SKILL.md` перед використанням і чи виконує required steps/args?
- **Workflow contracts:** multi-turn scenarios, які assert-ять tool order, session history carryover і sandbox boundaries.

Майбутні evals мають спочатку лишатися детермінованими:

- Scenario runner з mock providers для assert tool calls + order, skill file reads і session wiring.
- Невеликий suite skill-focused scenarios (use vs avoid, gating, prompt injection).
- Optional live evals (opt-in, env-gated) лише після того, як CI-safe suite буде на місці.

## Contract tests (plugin and channel shape)

Contract tests перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
interface contract. Вони ітерують усі виявлені plugins і запускають suite
assertions для shape і behavior. Default unit lane `pnpm test` навмисно
пропускає ці shared seam і smoke files; запускайте contract commands явно,
коли змінюєте shared channel або provider surfaces.

### Commands

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова shape Plugin (id, name, capabilities)
- **setup** - Contract setup wizard
- **session-binding** - Поведінка session binding
- **outbound-payload** - Структура message payload
- **inbound** - Обробка inbound message
- **actions** - Channel action handlers
- **threading** - Обробка Thread ID
- **directory** - API directory/roster
- **group-policy** - Застосування group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Shape registry Plugin

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - API model catalog
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Shape/interface Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни exports або subpaths plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після refactoring реєстрації або виявлення Plugin

Contract tests запускаються в CI і не потребують реальних API keys.

## Додавання регресій (настанови)

Коли ви виправляєте provider/model issue, виявлену live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або зафіксуйте точну request-shape transformation)
- Якщо це inherently live-only (rate limits, auth policies), тримайте live test вузьким і opt-in через env vars
- Віддавайте перевагу найменшому layer, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derives one sampled target per SecretRef class з registry metadata (`listSecretTargetRegistryEntries()`), а потім asserts, що traversal-segment exec ids відхиляються.
  - Якщо ви додаєте нову `includeInPlan` SecretRef target family у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно fails на unclassified target ids, щоб нові classes не могли бути skipped silently.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
