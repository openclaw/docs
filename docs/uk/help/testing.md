---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway та агента
summary: 'Набір для тестування: набори модульних, e2e і live-тестів, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-05T04:27:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-засобів запуску. Цей документ є посібником "як ми тестуємо":

- Що покриває кожен набір (і що він свідомо _не_ покриває).
- Які команди запускати для поширених робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний transport plugin, який використовують сценарії на базі репозиторію.

Ця сторінка описує запуск звичайних тестових наборів і Docker/Parallels-засобів запуску. Розділ про специфічні для QA засоби запуску нижче ([Специфічні для QA засоби запуску](#qa-specific-runners)) перелічує конкретні виклики `qa` і посилається назад на наведені вище довідники.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий watch-цикл Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над окремим збоєм спершу віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + проби інструментів/зображень Gateway): `pnpm test:live`
- Тихо запустити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність runtime: dispatch `OpenClaw Performance` з
  `live_gpt54=true` для реального agent turn `openai/gpt-5.4` або
  `deep_profile=true` для CPU/heap/trace-артефактів Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить показники завантаження Gateway на рівні джерел, пам'яті,
  plugin-pressure, повторюваного fake-model hello-loop і старту CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn і невелику пробу в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний image turn.
    Вимикайте додаткові проби за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають перевикористовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model matrix jobs,
    поділені за провайдерами.
  - Для сфокусованих повторних запусків CI запускайте dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні provider secrets до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив'язує синтетичний
    Slack DM через `/codex bind`, перевіряє `/codex fast` і
    `/codex permissions`, а потім верифікує звичайну відповідь і маршрут вкладення зображення
    через native Plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає Gateway agent turns через належний Plugin Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує проби image,
    cron MCP, sub-agent і Guardian. Вимикайте sub-agent probe за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші проби:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова belt-and-suspenders перевірка поверхні команди rescue для message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і верифікує шлях audit/config write.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з fake Claude CLI у `PATH`
    і верифікує, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього state dir OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + SecretRef writes,
    валідує конфігурацію та верифікує audit entries. Той самий Ring 0 setup path
    також покритий у QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: із встановленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  assistant transcript зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## Специфічні для QA засоби запуску

Ці команди розташовані поруч із головними тестовими наборами, коли потрібен реалізм QA-lab:

CI запускає QA Lab у виділених workflow. Agentic parity вкладено під
`QA-Lab - All Lanes` і release validation, а не в окремий PR workflow.
Для широкої валідації слід використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. Stable/default release
checks тримають вичерпний live/Docker soak за `run_release_soak=true`; профіль
`full` примусово вмикає soak. `QA-Lab - All Lanes`
запускається щоночі на `main` і з ручного dispatch з mock parity lane, live
Matrix lane, live Telegram lane під керуванням Convex і live Discord
lane під керуванням Convex як паралельними jobs. Scheduled QA і release checks передають Matrix
`--profile fast` явно, тоді як Matrix CLI і ручний workflow input
за замовчуванням залишаються `all`; ручний dispatch може шардувати `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими та уникали звичайного startup provider-plugin. Ці live transport
Gateways вимикають пошук пам'яті; поведінка пам'яті й далі покривається QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії, прив’язані до репозиторію, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення, що означає помилку.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на основі AIMock для експериментального
    покриття фікстур і protocol-mock без заміни лінії `mock-openai`, обізнаної про сценарії.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає живий прогін OpenAI Kitchen Sink Plugin через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє інвентар поверхні plugin SDK,
    перевіряє `/healthz` і `/readyz`, записує докази CPU/RSS для Gateway,
    запускає живий хід OpenAI і перевіряє змагальну діагностику.
    Потребує живої авторизації OpenAI, наприклад `OPENAI_API_KEY`. У гідратованих сесіях Testbox
    автоматично підвантажує профіль live-auth Testbox, коли наявний
    помічник `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенч запуску Gateway плюс невеликий пакет mock-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведення комбінованих спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тож короткі сплески під час запуску записуються як метрики
    і не виглядають як регресія з Gateway, навантаженим на кілька хвилин.
  - Використовує зібрані артефакти `dist`; спочатку запустіть збірку, коли робоча копія ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у одноразовій Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Живі запуски пересилають підтримувані QA-входи авторизації, практичні для гостя:
    ключі провайдера на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб гість міг записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA-звіт і зведення плюс журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA-сайт для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm-tarball із поточної робочої копії, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding з API-ключем OpenAI, за замовчуванням налаштовує Telegram,
    перевіряє, що упакований plugin runtime завантажується без startup
    dependency repair, запускає doctor і запускає один локальний agent turn проти
    замоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію packaged-install
    з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований built-app Docker smoke для транскриптів embedded runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім засіває уражений зламаний session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидат пакета OpenClaw у Docker, запускає onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, потім повторно використовує
    живу Telegram QA-лінію з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв’язаний локальний tarball замість
    встановлення з реєстру.
  - Використовує ті самі Telegram env-облікові дані або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/release automation задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex наявні в CI,
    Docker-wrapper автоматично вибирає Convex.
  - Wrapper перевіряє env облікових даних Telegram або Convex на хості перед
    роботою Docker build/install. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише під час навмисного налагодження setup перед обліковими даними.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` тільки для цієї лінії.
  - GitHub Actions показує цю лінію як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і leases облікових даних Convex CI.
- GitHub Actions також показує `Package Acceptance` для side-run product proof
  проти одного кандидатського пакета. Він приймає довірений ref, опубліковану npm-специфікацію,
  HTTPS URL tarball плюс SHA-256 або tarball artifact з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler із профілями ліній smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Найсвіжіший beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказ exact tarball URL потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof завантажує tarball artifact з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує і встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перший налаштований doctor repair явно встановлює кожен відсутній downloadable
    plugin, а другий restart не запускає hidden dependency
    repair.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke у Parallels guests. Кожна
    вибрана платформа спочатку встановлює запитаний baseline package, потім запускає
    встановлену команду `openclaw update` у тому самому guest і перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерації на одному guest. Використовуйте `--json` для шляху summary artifact і
    статусу кожної лінії.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не могли
    забрати решту тестового вікна:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед припущенням, що зовнішній wrapper завис.
  - Windows update може витрачати від 10 до 15 хвилин на post-update doctor і package
    update work на холодному guest; це все ще нормально, коли вкладений npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони спільно використовують стан VM і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну поверхню bundled plugin, тому що
    capability facades, такі як speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам agent
    turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний AIMock provider server для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лінію Matrix проти одноразового Docker-backed Tuwunel homeserver. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і layout артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA-лінію Telegram проти справжньої приватної групи, використовуючи driver і SUT bot tokens з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення, що означає помилку.
  - Потребує двох різних bots в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bots і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від driver send request до observed SUT reply.

Live transport lanes мають один стандартний contract, щоб нові transports не розходилися; матриця покриття для кожної лінії міститься в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким synthetic suite і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує exclusive lease з Convex-backed pool, надсилає heartbeats
для цього lease, поки лінія працює, і звільняє lease під час shutdown.

Reference Convex project scaffold:

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs для local-only development.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайній роботі має використовувати `https://`.

Адміністративні команди мейнтейнера (pool add/remove/list) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для мейнтейнерів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети брокера,
префікс endpoint, тайм-аут HTTP і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинно-читаного виводу у скриптах і CI
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
- `POST /admin/add` (лише секрет мейнтейнера)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет мейнтейнера)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Запобіжник активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет мейнтейнера)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для виду Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Назви архітектури й scenario-helper для нових адаптерів каналів наведені в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати багато-проєктні shard у конфіги окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; unit-тести UI запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація Gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і loader публічної поверхні мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` із згенерованими крихітними фікстурами Plugin, а не
    реальними API джерел вбудованих Plugin. Реальні завантаження API Plugin належать до
    contract/integration-наборів, якими володіє Plugin.

<AccordionGroup>
  <Accordion title="Проєкти, shard і scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших shard-конфігів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного великого процесу native root-project. Це зменшує піковий RSS на завантажених машинах і не дає auto-reply/extension роботі виснажувати непов’язані набори.
    - `pnpm test --watch` усе ще використовує native root граф проєкту `vitest.config.ts`, бо багато-shard watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі правки тестів, сусідні файли `*.test.ts`, явні мапінги джерел і локальні залежні елементи import-graph. Правки config/setup/package не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним check gate для вузьких змін. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Version bumps лише для release metadata запускають цільові перевірки version/config/root-dependency із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Правки live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші правки package-surface й далі використовують ширші guard.
    - Легкі щодо імпортів unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних зон чистих утиліт маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли лишаються на наявних lanes.
    - Вибрані helper-файли джерел `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих легких lanes, тож правки helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має виділені buckets для верхньорівневих core helpers, верхньорівневих integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на shards agent-runner, dispatch і commands/state-routing, щоб один важкий на імпорти bucket не володів усім Node tail.
    - Звичайний PR/main CI навмисно пропускає пакетний sweep extension і release-only shard `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих важких щодо Plugin/extension наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані discovery для message-tool або runtime
      context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації й нормалізації.
    - Підтримуйте справними integration-набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction досі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper
      не є достатньою заміною цим integration-шляхам.

  </Accordion>

  <Accordion title="Типові значення Vitest pool та ізоляції">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root projects, e2e і live configs.
    - Root UI lane зберігає свій setup `jsdom` і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node
      процесів Vitest, щоб зменшити V8 compile churn під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook лише форматує. Він повторно додає відформатовані файли до staged і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед передачею або push, коли вам
      потрібен розумний локальний check gate.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли агент
      вирішує, що правка harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку
      маршрутизації, лише з вищим лімітом workers.
    - Локальне auto-scaling workers навмисно консервативне й зменшує навантаження,
      коли load average хоста вже високий, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб reruns у changed-mode лишалися коректними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      import-breakdown output.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами,
      зміненими відносно `origin/main`.
    - Дані часу shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски whole-config використовують шлях config як ключ; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam напряму замість deep-import runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із native root-project шляхом для цього committed
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root Vitest config.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      накладних витрат запуску й transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit-набору з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway із diagnostics, увімкненою типово
  - Проганяє synthetic gateway message, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers persistence для diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, synthetic RSS samples не перевищують pressure budget, а глибини черг per-session повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для stability-regression follow-up, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і тести E2E для вбудованих plugins у `extensions/`
- Типові параметри середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивні воркери (CI: до 2, локально: типово 1).
  - Типово працює в тихому режимі, щоб зменшити накладні витрати на консольне введення-виведення.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний консольний вивід.
- Область:
  - Наскрізна поведінка Gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, сполучення вузлів і важче мережеве навантаження
- Очікування:
  - Виконується в CI (коли ввімкнено в конвеєрі)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: перевірка бекенду OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює пісочницю з тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Перевіряє поведінку файлової системи з віддаленим канонічним шляхом через міст fs пісочниці
- Очікування:
  - Лише за явним увімкненням; не є частиною типового запуску `pnpm test:e2e`
  - Потрібні локальний CLI `openshell` і робочий демон Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і пісочницю
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нетиповий двійковий файл CLI або скрипт-обгортку

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести для вбудованих plugins у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдерів, особливостей виклику інструментів, проблем автентифікації та поведінки лімітів частоти
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти частоти
  - Краще запускати звужені піднабори замість «усього»
- Live-запуски підключають `~/.profile`, щоб отримати відсутні API-ключі.
- Типово live-запуски все ще ізолюють `HOME` і копіюють конфігурацію/матеріали автентифікації в тимчасову тестову домашню теку, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює тихіше: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи завантаження Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): задайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для окремого live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на ліміти частоти.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тому довгі виклики провайдерів помітно активні навіть тоді, коли консольне захоплення Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway транслювалися негайно під час live-запусків.
  - Налаштуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте Heartbeat Gateway/проб через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни мережевої взаємодії Gateway / протоколу WS / сполучення: додайте `pnpm test:e2e`
- Налагодження «мій бот недоступний» / збоїв, специфічних для провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, перевірок бекенду CLI, перевірок ACP, harness сервера застосунку Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення, музика, відео, media harness), а також обробки облікових даних для live-запусків, див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального контрольного списку оновлень і перевірки plugins див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділено на дві групи:

- Live-ранери моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочий простір (і підключають `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово використовують меншу межу перевірок, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Чистий образ є лише раннером Node/Git для ліній install/update/plugin-dependency; ці лінії монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для ліній функціональності зібраного застосунку. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким live-, npm-install- і multi-service-лініям стартувати всім одночасно. Якщо одна лінія важча за активні обмеження, планувальник усе одно може запустити її, коли пул порожній, а потім залишає її працювати окремо, доки знову не з’явиться ємність. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Раннер типово виконує попередню перевірку Docker, видаляє застарілі E2E-контейнери OpenClaw, друкує статус кожні 30 секунд, зберігає таймінги успішних ліній у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у пізніших запусках спершу стартували довші лінії. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест ліній без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних ліній, потреб пакетів/образів і облікових даних.
- `Package Acceptance` — це нативний для GitHub пакетний gate для питання «чи цей установний tarball працює як продукт?» Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-лінії проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковано за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) щодо контракту package/update/plugin, матриці збереження після опублікованого оновлення, типових параметрів релізу та triage збоїв.
- Перевірки збірки та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо імпорти запуску до диспетчеризації підтягують залежності пакетів, такі як Commander, prompt UI, undici або логування, до диспетчеризації команди; він також утримує зібраний gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Пакетована перевірка CLI також покриває root help, onboard help, doctor help, status, схему конфігурації та команду списку моделей.
- Зворотна сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини метаданих у відвантажених пакетах: пропущені приватні записи інвентарю QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, застарілі розташування записів установлення plugins, відсутнє збереження записів установлення marketplace і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Ранери перевірок контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker-ранери також bind-монтують лише потрібні домашні теки автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашню теку контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени, не змінюючи сховище автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-перевірка прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-перевірка бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-перевірка harness сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-перевірка спостережуваності: `pnpm qa:otel:smoke` — приватна QA-доріжка для checkout вихідного коду. Її навмисно не включено до Docker-доріжок релізу пакета, бо npm tarball не містить QA Lab.
- Жива smoke-перевірка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне створення scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-перевірка onboarding/каналу/агента з npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding із посиланням на змінні середовища та типово Telegram, запускає doctor і виконує один змоканий хід агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke-перевірка перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke-перевірка стійкості після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненого fixture старого користувача з агентами, конфігурацією каналу, allowlist plugin, застарілим станом залежностей plugin і наявними файлами workspace/session. Вона запускає оновлення пакета та неінтерактивний doctor без live-ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Smoke-перевірка стійкості після оновлення з опублікованої версії: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цю базову версію за вбудованим рецептом команд, перевіряє отриману конфігурацію, оновлює цю опубліковану інсталяцію до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні локальні базові версії через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, і розгорніть issue-подібні fixtures через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного repair встановлення зовнішніх Plugin OpenClaw. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, розв’язує мета-токени базових версій, як-от `last-stable-4` або `all-since-2026.4.23`, а Full Release Validation розгортає package gate release-soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Smoke-перевірка runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту transcript та repair через doctor для зачеплених дубльованих гілок prompt-rewrite.
- Smoke-перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke встановлювача: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між своїми root, update і direct-npm контейнерами. Update smoke типово використовує npm `latest` як стабільну базову версію перед оновленням до кандидатного tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки встановлювача без root тримають ізольований npm cache, щоб записи cache, власником яких є root, не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm під час локальних повторних запусків.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цієї змінної середовища, коли потрібне покриття прямого `npm install -g`.
- Smoke-перевірка CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON та поведінку збереження workspace. Повторно використайте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-перевірка snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP покривають URL посилань, clickables, підвищені курсором, refs iframe і метадані frame.
- Регресія мінімального reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає reject схеми провайдера й перевіряє, що raw detail з’являється в логах Gateway.
- Міст MCP каналу (засіяний Gateway + stdio bridge + smoke-перевірка raw notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP tools Pi bundle (реальний stdio MCP server + smoke-перевірка allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + teardown дочірнього stdio MCP після ізольованого cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-перевірка встановлення/оновлення для локального шляху, `file:`, npm registry з hoisted залежностями, git moving refs, ClawHub kitchen-sink, оновлень marketplace і ввімкнення/інспекції Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару package/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture-сервер ClawHub.
- Smoke-перевірка незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-перевірка матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований tarball OpenClaw у порожньому контейнері, встановлює npm plugin, перемикає enable/disable, оновлює та відкочує його через локальний npm registry, видаляє встановлений код, потім перевіряє, що uninstall все ще видаляє застарілий стан, водночас логуючи RSS/CPU метрики для кожної фази життєвого циклу.
- Smoke-перевірка метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` покриває smoke-перевірку встановлення/оновлення для локального шляху, `file:`, npm registry з hoisted залежностями, git moving refs, fixtures ClawHub, оновлень marketplace і ввімкнення/інспекції Claude-bundle. `pnpm test:docker:plugin-update` покриває поведінку незміненого оновлення для встановлених plugins. `pnpm test:docker:plugin-lifecycle-matrix` покриває встановлення npm plugin з відстеженням ресурсів, enable, disable, upgrade, downgrade і uninstall за відсутнього коду.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для suite перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти pull-ять його, якщо він ще не локальний. QR і installer Docker tests зберігають власні Dockerfiles, бо вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker-запускачі live-model також монтують поточний checkout лише для читання та
розміщують його в тимчасовому робочому каталозі всередині контейнера. Це зберігає runtime
образ компактним, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок розміщення пропускає великі локальні кеші й вихідні дані збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків `.build` або
каталоги вихідних даних Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки gateway не запускали
справжні воркери каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття gateway
з цієї Docker-доріжки.
`test:docker:openwebui` — це compatibility smoke вищого рівня: він запускає контейнер
OpenClaw gateway з увімкненими OpenAI-сумісними HTTP endpoint-ами,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` експонує `openclaw/default`, а потім надсилає
справжній chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
образ Open WebUI, а Open WebUI може знадобитися завершити власне cold-start налаштування.
Ця доріжка очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує справжнього
облікового запису Telegram, Discord або iMessage. Він завантажує seeded Gateway
контейнер, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, читання transcript-ів, attachment metadata,
поведінку live event queue, outbound send routing і Claude-style channel +
permission notifications через справжній stdio MCP bridge. Перевірка notification
інспектує raw stdio MCP frames напряму, тож smoke перевіряє те, що
bridge фактично емітує, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає Docker образ репозиторію, запускає справжній stdio MCP probe server
усередині контейнера, матеріалізує цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для regression/debug workflow-ів. Він може знову знадобитися для перевірки ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і source-иться перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, source-нутих із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових каталогів config/workspace і без зовнішніх CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для cached CLI installs усередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються read-only під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом tests
  - Типові dirs: `.minimax`
  - Типові files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider runs монтують лише потрібні dirs/files, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб переконатися, що creds надходять зі сховища профілю (не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` щоб вибрати model, яку gateway експонує для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` щоб перевизначити nonce-check prompt, який використовує Open WebUI smoke
- `OPENWEBUI_IMAGE=...` щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагувань docs: `pnpm check:docs`.
Запускайте повну валідацію anchor-ів Mintlify, коли також потрібні перевірки in-page heading: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

Це “real pipeline” regressions без справжніх providers:

- Gateway tool calling (mock OpenAI, справжній gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

У нас уже є кілька CI-safe tests, які поводяться як “agent reliability evals”:

- Mock tool-calling через справжній gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, що перевіряють session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого все ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills наведені в prompt, чи агент вибирає правильний skill (або уникає нерелевантних)?
- **Compliance:** чи агент читає `SKILL.md` перед використанням і виконує required steps/args?
- **Workflow contracts:** multi-turn scenarios, які assert-ять tool order, перенесення session history і sandbox boundaries.

Майбутні evals мають насамперед залишатися детермінованими:

- Scenario runner із mock providers, щоб assert-ити tool calls + order, читання skill file і session wiring.
- Невеликий suite skill-focused scenarios (use vs avoid, gating, prompt injection).
- Optional live evals (opt-in, env-gated) лише після того, як CI-safe suite буде на місці.

## Contract tests (форма plugin і channel)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі знайдені plugins і запускають suite
shape та behavior assertions. Типова unit-доріжка `pnpm test` навмисно
пропускає ці shared seam і smoke files; запускайте contract commands явно,
коли змінюєте shared channel або provider surfaces.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт setup wizard
- **session-binding** - Поведінка session binding
- **outbound-payload** - Структура message payload
- **inbound** - Обробка inbound message
- **actions** - Channel action handlers
- **threading** - Обробка thread ID
- **directory** - Directory/roster API
- **group-policy** - Застосування group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма Plugin registry

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання або модифікації channel чи provider plugin
- Після рефакторингу plugin registration або discovery

Contract tests запускаються в CI й не потребують справжніх API keys.

## Додавання regressions (настанови)

Коли ви виправляєте provider/model issue, виявлену в live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або зафіксуйте точну request-shape transformation)
- Якщо це за своєю природою лише live-only (rate limits, auth policies), залишайте live test вузьким і opt-in через env vars
- Надавайте перевагу таргетуванню найменшого шару, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один sampled target для кожного SecretRef class з registry metadata (`listSecretTargetRegistryEntries()`), а потім assert-ить, що traversal-segment exec ids відхиляються.
  - Якщо ви додаєте нову family SecretRef target з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно падає на unclassified target ids, щоб нові classes не можна було тихо пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
