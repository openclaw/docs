---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні/e2e/live набори, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-11T20:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником "як ми тестуємо":

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, для налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) - архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) - довідка для `pnpm openclaw qa matrix`.
- [QA-канал](/uk/channels/qa-channel) - синтетичний транспортний плагін, який використовується сценаріями з репозиторію.

Ця сторінка описує запуск звичайних тестових наборів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і посилається на наведені вище довідкові матеріали.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на просторій машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extensions/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над окремим збоєм спочатку надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність рантайму: запустіть `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для CPU/heap/trace-артефактів Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також включає показники завантаження Gateway на рівні джерел, пам'яті,
  plugin-pressure, повторюваного fake-model hello-loop і старту CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невеликий probe у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують крихітний image turn.
    Вимикайте додаткові probes через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розділені за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив'язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи gateway agent через harness Codex app-server, яким володіє плагін,
    перевіряє `/codex status` і `/codex models` та за замовчуванням виконує probes для image,
    cron MCP, sub-agent і Guardian. Вимикайте sub-agent probe через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Codex on-demand install smoke: `pnpm test:docker:codex-on-demand`
  - Встановлює запакований tarball OpenClaw у Docker, запускає onboarding з OpenAI API-key
    і перевіряє, що плагін Codex плюс залежність `@openai/codex`
    було завантажено до managed npm root на вимогу.
- Live plugin tool dependency smoke: `pnpm test:docker:live-plugin-tool`
  - Пакує fixture-плагін із реальною залежністю `slugify`, встановлює його через
    `npm-pack:`, перевіряє залежність під managed npm root, а потім просить
    live-модель OpenAI викликати plugin tool і повернути прихований slug.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in перевірка belt-and-suspenders для поверхні rescue command каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях audit/config write.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з fake Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожньої OpenClaw state dir, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    перевіряє конфігурацію та audit entries. Той самий шлях Ring 0 setup
    також покритий у QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізоване `usage.cost`.

<Tip>
Коли вам потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч із основними тестовими наборами, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у спеціальних workflow. Agentic parity вкладено в
`QA-Lab - All Lanes` і release validation, а не в окремий PR workflow.
Для широкої валідації слід використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. Stable/default release
checks тримають exhaustive live/Docker soak за `run_release_soak=true`; профіль
`full` примусово вмикає soak. `QA-Lab - All Lanes`
запускається щоночі на `main` і вручну через dispatch із mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельними jobs. Scheduled QA і release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і manual workflow input
за замовчуванням лишаються `all`; manual dispatch може розбити `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед approval релізу,
використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони лишалися
детермінованими та уникали звичайного запуску provider-plugin. Ці live transport
gateways вимикають memory search; поведінка пам'яті лишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA, підтримані репозиторієм, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. `qa-channel` за замовчуванням має паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної гілки.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на основі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни гілки `mock-openai`, обізнаної про сценарії.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає живий випробувальний прогін Plugin OpenAI Kitchen Sink через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє інвентар поверхні SDK Plugin,
    зондує `/healthz` і `/readyz`, записує докази CPU/RSS Gateway,
    запускає живий хід OpenAI і перевіряє змагальну діагностику.
    Потребує живої автентифікації OpenAI, наприклад `OPENAI_API_KEY`. У гідрованих сесіях Testbox
    автоматично підтягує профіль live-auth Testbox, коли наявний помічник
    `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенч запуску Gateway плюс невеликий пакет сценаріїв mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тож короткі сплески запуску записуються як метрики
    без вигляду хвилинної регресії навантаження Gateway.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, коли checkout ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий пакет QA всередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Живі запуски передають підтримувані вхідні дані автентифікації QA, практичні для гостя:
    ключі провайдерів на основі env, шлях до конфігурації живого провайдера QA і `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб гість міг записувати назад через
    змонтований робочий простір.
  - Записує звичайний звіт QA і підсумок плюс журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає сайт QA на основі Docker для операторської роботи QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm-архів із поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding ключа OpenAI API, налаштовує Telegram
    за замовчуванням, перевіряє, що runtime упакованого Plugin завантажується без ремонту
    залежностей під час запуску, запускає doctor і виконує один локальний хід агента проти
    змокованої кінцевої точки OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму гілку
    упакованого встановлення з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke зібраного застосунку для вбудованих транскриптів runtime-контексту.
    Він перевіряє, що прихований runtime-контекст OpenClaw зберігається як
    невідображуване користувацьке повідомлення, а не витікає у видимий хід користувача,
    потім засіває пошкоджений JSONL ураженої сесії і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює пакет-кандидат OpenClaw у Docker, запускає onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    живу гілку QA Telegram з цим встановленим пакетом як SUT Gateway.
  - Wrapper монтує лише вихідний код harness `qa-lab` із checkout; встановлений
    пакет володіє `dist`, `openclaw/plugin-sdk` і runtime bundled Plugin,
    тому гілка не змішує Plugin з поточного checkout у пакет
    під тестом.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати вирішений локальний tarball замість
    встановлення з реєстру.
  - Використовує ті самі Telegram env credentials або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізів задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex наявні в CI,
    Docker wrapper автоматично вибирає Convex.
  - Wrapper перевіряє env облікових даних Telegram або Convex на хості перед
    роботою Docker build/install. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише під час навмисного налагодження налаштування перед обліковими даними.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї гілки.
  - GitHub Actions надає цю гілку як ручний workflow для maintainer
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренди облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для побічного продуктового proof
  проти одного пакета-кандидата. Він приймає довірений ref, опубліковану npm spec,
  HTTPS URL tarball плюс SHA-256 або артефакт tarball з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний планувальник Docker E2E з профілями гілок smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  workflow QA Telegram проти того самого артефакту `package-under-test`.
  - Product proof останньої beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Proof точного URL tarball потребує дайджесту:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує і встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/Plugin через редагування
    config.
  - Перевіряє, що виявлення setup залишає неналаштовані завантажувані Plugin відсутніми,
    перший налаштований repair doctor явно встановлює кожен відсутній завантажуваний
    Plugin, а другий restart не запускає прихований repair залежностей.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає залишки legacy-залежностей Plugin без postinstall repair з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає нативний smoke оновлення упакованого встановлення на гостях Parallels. Кожна
    вибрана платформа спершу встановлює запитаний baseline-пакет, потім запускає
    встановлену команду `openclaw update` у тому самому гості і перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному гості. Використовуйте `--json` для шляху до артефакту підсумку і
    статусу кожної гілки.
  - Гілка OpenAI за замовчуванням використовує `openai/gpt-5.5` для live proof ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не
    спожили решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали гілок у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішній wrapper завис.
  - Оновлення Windows може витрачати 10-15 хвилин на post-update doctor і роботу
    з оновлення пакетів на холодному гості; це все ще нормально, коли вкладений журнал npm
    debug просувається.
  - Не запускайте цей агрегований wrapper паралельно з окремими smoke-гілками Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, подавання пакетів або стану гостьового Gateway.
  - Post-update proof запускає звичайну поверхню bundled Plugin, тому що
    capability facades, такі як speech, image generation і media
    understanding, завантажуються через bundled runtime APIs навіть тоді, коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає живу гілку QA Matrix проти одноразового homeserver Tuwunel на основі Docker. Лише source-checkout - упаковані встановлення не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і макет артефактів: [QA Matrix](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає живу гілку QA Telegram проти реальної приватної групи з використанням токенів driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Значення за замовчуванням покривають canary, mention gating, command addressing, `/status`, bot-to-bot mentioned replies і core native command replies. Значення за замовчуванням `mock-openai` також покривають deterministic reply-chain і регресії Telegram final-message streaming. Використовуйте `--list-scenarios` для optional probes, таких як `session_status`.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли потрібні артефакти без коду виходу з помилкою.
  - Потребує двох окремих bot в одній приватній групі, причому SUT bot має відкривати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати груповий bot traffic.
  - Записує звіт QA Telegram, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від запиту driver send до observed SUT reply.

`Mantis Telegram Live` — це PR-evidence wrapper навколо цієї гілки. Він запускає
candidate ref з орендованими через Convex обліковими даними Telegram, рендерить відредагований
transcript observed-message у desktop browser Crabbox, записує MP4 evidence,
генерує motion-trimmed GIF, завантажує bundle артефактів і публікує inline PR
evidence через Mantis GitHub App, коли задано `pr_number`. Maintainers можуть
запустити його з Actions UI через `Mantis Scenario` (`scenario_id:
telegram-live`) або безпосередньо з коментаря pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` — це agentic native Telegram Desktop
before/after wrapper для візуального proof у PR. Запускайте його з Actions UI з
довільними `instructions`, через `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`) або з коментаря PR:

```text
@Mantis telegram desktop proof
```

Агент Mantis читає PR, визначає, яка видима в Telegram поведінка доводить
зміну, запускає лінію доказу real-user Crabbox Telegram Desktop на базових і
кандидатних refs, ітерує, доки нативні GIF не стануть корисними, записує парний
маніфест `motionPreview` і публікує ту саму двоколонкову таблицю GIF через
Mantis GitHub App, коли задано `pr_number`.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Орендує або повторно використовує Linux-десктоп Crabbox, встановлює нативний Telegram Desktop, налаштовує OpenClaw з орендованим токеном Telegram SUT-бота, запускає gateway і записує screenshot/MP4-докази з видимого VNC-десктопа.
  - За замовчуванням використовує `--credential-source convex`, тож workflows потребують лише broker secret Convex. Використовуйте `--credential-source env` з тими самими змінними `OPENCLAW_QA_TELEGRAM_*`, що й `pnpm openclaw qa telegram`.
  - Telegram Desktop все ще потребує входу користувача/профілю. Токен бота налаштовує лише OpenClaw. Використовуйте `--telegram-profile-archive-env <name>` для base64-архіву профілю `.tgz`, або використовуйте `--keep-lease` і один раз увійдіть вручну через VNC.
  - Записує `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png` і `telegram-desktop-builder.mp4` у вихідний каталог.

Лінії live-транспорту мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття для кожної лінії міститься в [Огляд QA → Покриття live-транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким синтетичним набором і не входить до цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
QA live-транспорту, QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat для цієї
оренди, поки лінія виконується, і звільняє оренду під час завершення роботи. Назва розділу з’явилася раніше за
підтримку Discord, Slack і WhatsApp; контракт оренди спільний для всіх типів.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI типово `ci`, інакше `maintainer`)

Необов’язкові змінні env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Команди адміністратора maintainer (додавання/видалення/список пулу) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
префікс endpoint, HTTP timeout і доступність admin/list без друку
значень secrets. Використовуйте `--json` для machine-readable виводу в скриптах і CI
утилітах.

Типовий контракт endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Вичерпано/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Успіх: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Запит: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Успіх: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише maintainer secret)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише maintainer secret)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payloads.

Форма payload для real-user типу Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId` і `telegramApiId` мають бути числовими рядками.
- `tdlibArchiveSha256` і `desktopTdataArchiveSha256` мають бути SHA-256 hex-рядками.
- `kind: "telegram-user"` представляє один одноразовий акаунт Telegram. Розглядайте оренду як таку, що охоплює весь акаунт: TDLib CLI driver і візуальний свідок Telegram Desktop відновлюються з одного payload, і лише одна задача має утримувати оренду одночасно.

Відновлення real-user оренди Telegram:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Використовуйте відновлений профіль Desktop з `Telegram -workdir "$tmp/desktop"`, коли потрібен візуальний запис. У локальних середовищах оператора `scripts/e2e/telegram-user-credential.ts` типово читає `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env`, якщо змінні env процесу відсутні.

Керована агентом сесія Crabbox:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` орендує облікові дані `telegram-user`, відновлює той самий акаунт у
TDLib і Telegram Desktop на Linux-десктопі Crabbox, запускає локальний mock SUT
gateway з поточного checkout, відкриває видимий чат Telegram, запускає
запис desktop і записує приватний `session.json`. Поки сесія
активна, агент може продовжувати тестування, доки не буде задоволений:

- `send --session <file> --text <message>` надсилає через реального користувача TDLib і чекає на відповідь SUT.
- `run --session <file> -- <remote command>` запускає довільну команду на Crabbox і зберігає її вивід, наприклад `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` захоплює поточний видимий desktop.
- `status --session <file>` друкує оренду та команду WebVNC.
- `finish --session <file>` зупиняє recorder, захоплює screenshot/video/motion-trim artifacts, звільняє облікові дані Convex, зупиняє локальні процеси SUT і зупиняє оренду Crabbox, якщо не передано `--keep-box`.
- `publish --session <file> --pr <number>` типово публікує PR-коментар лише з GIF. Передавайте `--full-artifacts` тільки коли logs або JSON artifacts навмисно потрібні.

Для детермінованих візуальних repros передайте `--mock-response-file <path>` у `start`
або в скорочення однієї команди `probe`. Runner типово використовує стандартний
клас Crabbox, запис 24fps, GIF-прев’ю руху 24fps і ширину GIF
1920px. Перевизначайте через `--class`, `--record-fps`, `--preview-fps` і
`--preview-width` лише коли proof потребує інших налаштувань захоплення.

Доказ Crabbox однією командою:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Типова команда `probe` є скороченням для одного циклу start/send/finish. Використовуйте
її для швидкого smoke `/status`. Використовуйте session-команди для PR review,
роботи з відтворення багів або будь-якого випадку, коли агенту потрібні хвилини довільного
експериментування перед рішенням, що proof завершено. Використовуйте `--id <cbx_...>` для
повторного використання теплої desktop-оренди, `--keep-box`, щоб залишити VNC відкритим після finish,
`--desktop-chat-title <name>`, щоб вибрати видимий чат, і `--tdlib-url <tgz>`,
коли використовується попередньо зібраний Linux-архів `libtdjson.so` замість побудови TDLib на
свіжій box. Runner перевіряє `--tdlib-url` за допомогою `--tdlib-sha256 <hex>` або,
типово, sibling-файлу `<url>.sha256`.

Broker-validated payloads для кількох каналів:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Лінії Slack також можуть орендувати з пулу, але валідація payload Slack наразі
живе в Slack QA runner, а не в broker. Використовуйте
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
для рядків Slack.

### Додавання каналу до QA

Архітектура та назви scenario-helper для нових адаптерів каналів містяться в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у manifest Plugin, змонтувати як `openclaw qa <runner>` і створити scenarios у `qa/scenarios/`.

## Тестові набори (що де виконується)

Думайте про набори як про «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Config: нецільові запуски використовують shard-набір `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests виконуються у виділеному shard `unit-ui`
- Scope:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих bugs
- Очікування:
  - Виконується в CI
  - Не потребує реальних keys
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити fallback-поведінку широких `api.js` і
    `runtime-api.js` за допомогою згенерованих крихітних plugin fixtures, а не
    реальних bundled plugin source APIs. Реальні plugin API loads належать до
    contract/integration suites, якими володіє plugin.

Політика нативних залежностей:

- Типові тестові встановлення пропускають необов’язкові нативні збірки Discord opus. Отримання голосу Discord використовує чистий JS-декодер `opusscript`, а `@discordjs/opus` лишається вимкненим у `allowBuilds`, щоб локальні тести й лінії Testbox не компілювали нативний адон.
- Використовуйте окрему лінію продуктивності або live-лінію для голосу Discord, якщо вам навмисно потрібно порівняти нативну збірку opus. Не встановлюйте `@discordjs/opus` у `true` в типовому `allowBuilds`; це змусить непов’язані цикли встановлення/тестування компілювати нативний код.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного нативного процесу кореневого проєкту. Це зменшує пікове RSS на завантажених машинах і не дає роботі auto-reply/розширень виснажувати ресурси непов’язаних наборів тестів.
    - `pnpm test --watch` усе ще використовує нативний кореневий граф проєктів `vitest.config.ts`, бо багато-шардовий цикл спостереження непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped-лінії, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped-лінії: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні елементи графа імпортів. Зміни конфігурації/налаштування/пакетів не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним контрольним шлюзом для вузької роботи. Він класифікує diff на ядро, тести ядра, розширення, тести розширень, застосунки, документацію, релізні метадані, live Docker-інструменти та інструменти, а потім запускає відповідні команди перевірки типів, lint і guard. Він не запускає тести Vitest; викликайте `pnpm test:changed` або явний `pnpm test <target>` для тестового доказу. Підвищення версії лише в релізних метаданих запускають цільові перевірки версії/конфігурації/кореневих залежностей із guard, який відхиляє зміни пакетів поза верхньорівневим полем версії.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth-скриптів і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, export, версій та іншої поверхні пакетів усе ще використовують ширші guard-перевірки.
    - Легкі щодо імпортів unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних суто утилітарних областей спрямовуються через лінію `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важкі щодо runtime лишаються на наявних лініях.
    - Вибрані вихідні файли helper з `plugin-sdk` і `commands` також зіставляють запуски в changed-режимі з явними сусідніми тестами в цих легких лініях, тож зміни helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі кошики для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розбиває піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими імпортами не володів усім Node-хвостом.
    - Звичайний CI для PR/main навмисно пропускає batch sweep розширень і релізний шард `agentic-plugins`. Повна Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих важких щодо plugin/розширень наборів тестів на кандидатах релізу.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для меж чистої маршрутизації та нормалізації.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction усе ще проходять через реальні шляхи `run.ts` / `compact.ts`; самих лише helper-тестів недостатньо як заміни для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Коренева UI-лінія зберігає своє налаштування `jsdom` і optimizer, але також працює на спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні лінії запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staging і не запускає lint, перевірку типів або тести.
    - Запускайте `pnpm check:changed` явно перед передачею або push, коли вам потрібен розумний локальний контрольний шлюз.
    - `pnpm test:changed` типово спрямовується через дешеві scoped-лінії. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент вирішує, що зміна harness, конфігурації, пакета або контракту справді потребує ширшого покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом worker.
    - Автомасштабування локальних worker навмисно консервативне й відступає, коли середнє навантаження хоста вже високе, тому кілька паралельних запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як `forceRerunTriggers`, щоб повторні запуски в changed-режимі лишалися коректними, коли змінюється тестова проводка.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний перегляд файлами, зміненими відносно `origin/main`.
    - Дані часу шардів записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; CI-шарди з include-pattern додають назву шарда, щоб відфільтровані шарди можна було відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на імпорти під час запуску, тримайте важкі залежності за вузькою локальною межею `*.runtime.ts` і мокайте цю межу напряму замість deep-import runtime helpers лише для того, щоб пропустити їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із нативним шляхом кореневого проєкту для цього закоміченого diff і виводить wall time плюс максимальне RSS на macOS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне dirty tree, спрямовуючи список змінених файлів через `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для startup Vitest/Vite і накладних витрат transform.
    - `pnpm test:perf:profile:runner` записує CPU+heap-профілі runner для unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway із діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичний churn gateway-повідомлень, пам’яті та великих payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helper-и збереження diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, синтетичні RSS-зразки лишаються нижче бюджету тиску, а глибини черг для кожної сесії повертаються до нуля
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Вузька лінія для подальшого розслідування регресій стабільності, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові значення runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує адаптивних worker (CI: до 2, локально: типово 1).
  - Типово працює в silent-режимі, щоб зменшити накладні витрати console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Область:
  - Наскрізна поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing node і важча мережна взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нетипового CLI-бінарника або wrapper-скрипту

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести комплектних плагінів у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - "Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?"
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки обмежень швидкості
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує обмеження швидкості
  - Надавайте перевагу запуску звужених підмножин замість "усього"
- Live-запуски зчитують `~/.profile`, щоб підхопити відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють конфігурацію/матеріали автентифікації в тимчасовий тестовий домашній каталог, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає прогрес-вивід `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає журнали початкового завантаження Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (специфічна для провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для окремого live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на обмеження швидкості.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдера були помітно активними навіть тоді, коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway транслювалися негайно під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для Gateway/проб через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни мережевої взаємодії Gateway / протоколу WS / спарювання: додайте `pnpm test:e2e`
- Налагодження "мій бот не працює" / специфічних для провайдера збоїв / виклику інструментів: запустіть звужений `pnpm test:live`

## Live-тести (звертаються до мережі)

Для live-матриці моделей, smoke-перевірок бекенда CLI, smoke-перевірок ACP, застосункового серверного
harness Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, медіа-harness), а також обробки облікових даних для live-запусків, див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального контрольного списку оновлення та
валідації плагінів див.
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins).

## Docker-запускачі (необов’язкові перевірки "працює в Linux")

Ці Docker-запускачі поділяються на дві групи:

- Запускачі live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл ключа профілю в Docker-образі репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і зчитують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-запускачі типово мають меншу межу smoke-перевірок, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово встановлює `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово встановлює `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначте ці змінні середовища, коли
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-тарбол через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише запусковим середовищем Node/Git для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний тарбол. Функціональний образ встановлює той самий тарбол у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а ресурсні обмеження не дають важким live-, npm-install- і multi-service-напрямам стартувати одночасно. Якщо один напрям важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, а потім тримає його єдиним запущеним, доки знову не з’явиться місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Запускач типово виконує Docker-передперевірку, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках спочатку стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб у пакетах/образах і облікових даних.
- `Package Acceptance` — це GitHub-native пакетний gate для "чи цей інстальований тарбол працює як продукт?" Він розв’язує один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-напрями проти саме цього тарболу замість перепакування вибраного ref. Профілі впорядковані за шириною охоплення: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins) щодо контракту пакетів/оновлень/плагінів, матриці виживання опублікованих оновлень, типових налаштувань релізу та тріажу збоїв.
- Перевірки збірки й релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо запуск перед диспетчеризацією команд імпортує залежності пакета, як-от Commander, UI підказок, undici або журналювання, до диспетчеризації команди; він також утримує комплектний chunk запуску Gateway у межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Smoke-перевірка запакованого CLI також охоплює кореневу довідку, довідку onboard, довідку doctor, status, схему config і команду списку моделей.
- Застаріла сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини метаданих відвантаженого пакета: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із тарболу, відсутній збережений `update.channel`, застарілі розташування записів встановлення плагінів, відсутня сталість записів встановлення marketplace і міграція метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є строгими збоями.
- Container smoke-запускачі: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-запускачі live-моделей також bind-mount’ять лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін сховища автентифікації хоста:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Димовий тест прив’язування ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Димовий тест бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Димовий тест app-server harness Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Димовий тест спостережуваності: `pnpm qa:otel:smoke` є приватною QA-доріжкою з checkout вихідного коду. Його навмисно не включено до Docker-доріжок релізу пакета, оскільки npm-тарбол не містить QA Lab.
- Димовий тест Open WebUI наживо: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Димовий тест онбордингу/каналу/агента з npm-тарбола: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований тарбол OpenClaw у Docker, налаштовує OpenAI через онбординг із посиланням на env і Telegram за замовчуванням, запускає doctor і виконує один мокований хід агента OpenAI. Повторно використовуйте попередньо зібраний тарбол із `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості з `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Димовий тест встановлення Skills: `pnpm test:docker:skill-install` глобально встановлює запакований тарбол OpenClaw у Docker, вимикає встановлення завантажених архівів у конфігурації, знаходить поточний slug Skills із живого ClawHub через пошук, встановлює його через `openclaw skills install` і перевіряє встановлений Skills плюс метадані походження/блокування `.clawhub`.
- Димовий тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований тарбол OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Димовий тест стійкості після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований тарбол OpenClaw поверх забрудненого фікстура старого користувача з агентами, конфігурацією каналу, allowlist для plugin, застарілим станом залежностей plugin і наявними файлами workspace/session. Він запускає оновлення пакета плюс неінтерактивний doctor без живих ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Димовий тест стійкості після оновлення опублікованої версії: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює цю опубліковану інсталяцію до кандидатного тарбола, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований scheduler розгорнути точні локальні baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, як-от `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, і розгорніть фікстури у формі issues через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, як-от `reported-issues`; набір reported-issues включає `configured-plugin-installs` для автоматичного ремонту встановлення зовнішнього OpenClaw plugin. Package Acceptance експонує їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, розв’язує meta baseline tokens, як-от `last-stable-4` або `all-since-2026.4.23`, а Full Release Validation розгортає package gate для release-soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Димовий тест контексту runtime сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту в транскрипті плюс ремонт через doctor для зачеплених дубльованих гілок prompt-rewrite.
- Димовий тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використовуйте попередньо зібраний тарбол через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Димовий тест Docker-інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш для контейнерів root, update і direct-npm. Димовий тест оновлення за замовчуванням використовує npm `latest` як стабільний baseline перед оновленням до кандидатного тарбола. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm-кеш, щоб записи кешу, що належать root, не маскували поведінку встановлення в локальному середовищі користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm під час локальних повторних запусків.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Димовий тест CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Димовий тест snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP охоплюють URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) проганяє мокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє schema провайдера і перевіряє, що raw detail з’являється в логах Gateway.
- Міст MCP-каналів (засіяний Gateway + stdio bridge + димовий тест raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi bundle (реальний stdio MCP server + вбудований димовий тест allow/deny для Pi profile): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + демонтаж stdio MCP child після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (димовий тест встановлення/оновлення для локального path, `file:`, npm registry з hoisted dependencies, рухомих refs git, ClawHub kitchen-sink, marketplace updates і вмикання/інспектування Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару package/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстур ClawHub.
- Димовий тест незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Димовий тест матриці lifecycle Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований тарбол OpenClaw у порожній контейнер, встановлює npm plugin, перемикає enable/disable, оновлює та відкочує його через локальний npm registry, видаляє встановлений код, а потім перевіряє, що uninstall все ще видаляє застарілий стан, логуючи RSS/CPU-метрики для кожної фази lifecycle.
- Димовий тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює димовий тест встановлення/оновлення для локального path, `file:`, npm registry з hoisted dependencies, рухомих refs git, фікстур ClawHub, marketplace updates і вмикання/інспектування Claude-bundle. `pnpm test:docker:plugin-update` охоплює поведінку незміненого оновлення для встановлених plugin. `pnpm test:docker:plugin-lifecycle-matrix` охоплює resource-tracked встановлення npm plugin, enable, disable, upgrade, downgrade і uninstall за відсутності коду.

Щоб вручну попередньо зібрати й повторно використати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для окремих suites, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не є локальним. Docker-тести QR та інсталятора зберігають власні Dockerfile, бо вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker-ранери живих моделей також підмонтовують поточний checkout лише для читання та
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime-
образ компактним, водночас запускаючи Vitest саме проти вашого локального source/config.
Крок розгортання пропускає великі локальні кеші та вихідні артефакти збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків каталоги виводу `.build` або
Gradle, щоб Docker-запуски live не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб Gateway live-проби не запускали
справжні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому передавайте також
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити Gateway
live-покриття з цього Docker-ланцюга.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер OpenClaw Gateway з увімкненими OpenAI-сумісними HTTP endpoint-ами,
запускає закріплений контейнер Open WebUI проти цього Gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
справжній chat-запит через проксі `/api/chat/completions` Open WebUI.
Задайте `OPENWEBUI_SMOKE_MODE=models` для release-path CI-перевірок, які мають зупинятися
після входу в Open WebUI та виявлення моделей, не очікуючи завершення live model
completion.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
образ Open WebUI, а Open WebUI може знадобитися завершити власний cold-start setup.
Цей ланцюг очікує придатний ключ live model, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerизованих запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
справжнього облікового запису Telegram, Discord або iMessage. Він завантажує seeded Gateway
container, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, читання transcript, metadata вкладень,
поведінку live event queue, маршрутизацію outbound send і Claude-стильові сповіщення channel +
permission через справжній stdio MCP bridge. Перевірка сповіщень
безпосередньо інспектує raw stdio MCP frames, щоб smoke-тест валідував те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає Docker-образ repo, запускає справжній stdio MCP probe server
усередині контейнера, матеріалізує цей server через вбудований Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і одноразовий child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей script для regression/debug workflow. Він може знову знадобитися для валідації ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) mounted to `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) mounted to `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) mounted to `/home/node/.profile` and sourced before running tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` to verify only env vars sourced from `OPENCLAW_PROFILE_FILE`, using temporary config/workspace dirs and no external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) mounted to `/home/node/.npm-global` for cached CLI installs inside Docker
- External CLI auth dirs/files under `$HOME` are mounted read-only under `/host-auth...`, then copied into `/home/node/...` before tests start
  - Default dirs: `.minimax`
  - Default files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Narrowed provider runs mount only the needed dirs/files inferred from `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manually with `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, or a comma list like `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` to narrow the run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` to filter providers in-container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` to reuse an existing `openclaw:local-live` image for reruns that do not need a rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` to ensure creds come from the profile store (not env)
- `OPENCLAW_OPENWEBUI_MODEL=...` to choose the model exposed by the gateway for the Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` to override the nonce-check prompt used by the Open WebUI smoke
- `OPENWEBUI_IMAGE=...` to override the pinned Open WebUI image tag

## Перевірка docs

Запускайте перевірки docs після редагування docs: `pnpm check:docs`.
Запускайте повну Mintlify валідацію anchors, коли також потрібні перевірки in-page headings: `pnpm docs:check-links:anchors`.

## Offline-регресія (CI-safe)

Це регресії "real pipeline" без справжніх провайдерів:

- Gateway tool calling (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, writes config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Оцінювання надійності agent (Skills)

У нас уже є кілька CI-safe tests, що поводяться як "agent reliability evals":

- Mock tool-calling через справжній gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які валідують session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills перелічено в prompt, чи agent вибирає правильний skill (або уникає нерелевантних)?
- **Compliance:** чи agent читає `SKILL.md` перед використанням і виконує required steps/args?
- **Workflow contracts:** multi-turn сценарії, які перевіряють tool order, session history carryover і sandbox boundaries.

Майбутні evals мають насамперед залишатися детермінованими:

- Scenario runner з mock providers для перевірки tool calls + order, читання skill file і session wiring.
- Невеликий набір skill-focused сценаріїв (use vs avoid, gating, prompt injection).
- Опційні live evals (opt-in, env-gated) лише після того, як CI-safe suite буде готовий.

## Contract tests (форма Plugin і каналу)

Contract tests перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
interface contract. Вони ітерують усі виявлені plugins і запускають набір
shape та behavior assertions. Типовий unit lane `pnpm test` навмисно
пропускає ці shared seam і smoke files; запускайте contract commands явно,
коли торкаєтеся shared channel або provider surfaces.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Contract setup wizard
- **session-binding** - Поведінка session binding
- **outbound-payload** - Структура message payload
- **inbound** - Обробка inbound message
- **actions** - Channel action handlers
- **threading** - Обробка Thread ID
- **directory** - Directory/roster API
- **group-policy** - Застосування group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма Plugin registry

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Форма/interface Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання чи модифікації channel або provider Plugin
- Після рефакторингу Plugin registration або discovery

Contract tests запускаються в CI і не потребують справжніх API keys.

## Додавання регресій (настанови)

Коли ви виправляєте provider/model issue, виявлений у live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або capture exact request-shape transformation)
- Якщо це inherently live-only (rate limits, auth policies), зробіть live test вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derives one sampled target per SecretRef class from registry metadata (`listSecretTargetRegistryEntries()`), then asserts traversal-segment exec ids are rejected.
  - If you add a new `includeInPlan` SecretRef target family in `src/secrets/target-registry-data.ts`, update `classifyTargetClass` in that test. The test intentionally fails on unclassified target ids so new classes cannot be skipped silently.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
