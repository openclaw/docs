---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори тестів unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-02T15:57:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 217ee866c7e5043c20c09c677e8717e3c8fb836d9016ae3391ecf9058393b2d9
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-запускачів. Цей документ є посібником «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових робочих процесів (локально, перед push, для налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний плагін, який використовується сценаріями, підтриманими репозиторієм.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-запускачів. Розділ про QA-специфічні запускачі нижче ([QA-специфічні запускачі](#qa-specific-runners)) перелічує конкретні виклики `qa` і посилається назад на наведені вище довідники.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи розширень/каналів: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спершу віддавайте перевагу цільовим запускам, коли ітеруєте над одним збоєм.
- Docker-backed QA-сайт: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність виконання: запустіть `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невеликий probe у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують крихітний image-хід.
    Вимкніть додаткові probes за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають багаторазовий live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розділені за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    запланованих/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    маршрутизуються через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи gateway agent через harness Codex app-server, яким володіє плагін,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probes. Вимкніть sub-agent probe за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова перевірка «ремінь і підтяжки» для поверхні rescue command каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що нечіткий fallback планувальника транслюється в audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    перевіряє конфігурацію та audit entries. Той самий шлях Ring 0 setup
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні запускачі

Ці команди стоять поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у dedicated workflows. `Parity gate` запускається на відповідних PR і
з ручного запуску з mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного запуску з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і manual workflow input за замовчуванням залишаються
`all`; ручний запуск може розбити `all` на jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед release approval, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
і уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; behavior memory залишається покритим наборами QA parity.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
коміту, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість перебудови
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway-працівниками. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і protocol-mock без заміни scenario-aware
    lane `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає startup bench для Gateway плюс невеликий пакет mock-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об'єднане резюме CPU-спостережень
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески запуску записуються як метрики
    без вигляду регресії Gateway peg тривалістю в хвилини.
  - Використовує зібрані артефакти `dist`; спершу запустіть build, коли checkout ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині одноразової Linux VM Multipass.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані QA auth, практичні для guest:
    env-ключі провайдера, шлях до QA live provider config і `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт + резюме та логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA-сайт для operator-style QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний onboarding API-ключа OpenAI, за замовчуванням налаштовує Telegram,
    перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один локальний agent turn проти
    mock-ендпоінта OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований built-app Docker smoke для вбудованих runtime context
    transcripts. Він перевіряє, що прихований runtime context OpenClaw зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім додає affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate пакета OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через встановлений CLI, потім повторно використовує
    live Telegram QA lane з цим установленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв'язаний локальний tarball замість
    встановлення з registry.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/release automation задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret наявні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions надає цю lane як manual maintainer workflow
    `NPM Telegram Beta E2E`. Вона не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для побічного product proof
  проти одного candidate package. Він приймає trusted ref, опубліковану npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler із профілями lane smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
  - Product proof для останньої beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Proof для точного tarball URL потребує digest:

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
  - Пакує та встановлює поточний build OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, потім вмикає bundled channel/plugins через config
    edits.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перший configured doctor repair встановлює кожен відсутній downloadable
    plugin явно, а другий restart не запускає hidden dependency
    repair.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor candidate
    очищає legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke у гостях Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний baseline package, потім запускає
    встановлену команду `openclaw update` у тому самому guest і перевіряє
    встановлену версію, статус оновлення, готовність gateway і один локальний agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному guest. Використовуйте `--json` для шляху до summary artifact і
    статусу кожної lane.
  - OpenAI lane за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски у host timeout, щоб збої транспорту Parallels не
    спожили решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед припущенням, що зовнішній wrapper завис.
  - Windows update може витратити 10-15 хвилин на post-update doctor і package
    update work на cold guest; це все ще справний стан, коли вкладений npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими smoke lanes Parallels
    macOS, Windows або Linux. Вони спільно використовують VM state і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну bundled plugin surface, тому що
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs навіть тоді, коли сам agent
    turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти одноразового Docker-backed homeserver Tuwunel. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог profile/scenario, env vars і макет артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи з використанням driver і SUT bot tokens з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних bot в одній приватній групі, причому SUT bot має відкривати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Сценарії відповіді включають RTT від driver send request до observed SUT reply.

Live transport lanes мають один стандартний contract, щоб нові transports не розходилися; per-lane coverage matrix розміщено в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий synthetic suite і не є частиною цієї матриці.

### Спільні Telegram credentials через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує exclusive lease з Convex-backed pool, виконує heartbeats
цього lease, поки lane працює, і звільняє lease під час shutdown.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов'язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один secret для вибраної role:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір credential role:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов'язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов'язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Admin commands для maintainer (pool add/remove/list) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити Convex site URL, broker secrets,
endpoint prefix, HTTP timeout і admin/list reachability без друку
secret values. Використовуйте `--json` для machine-readable output у scripts і CI
utilities.

Стандартний контракт кінцевої точки (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет супровідника)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма корисного навантаження для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє неправильно сформовані корисні навантаження.

### Додавання каналу до QA

Архітектура й назви допоміжних сценарних компонентів для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати транспортний runner на спільному шві хоста `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і написати сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалістичності» (і зростання нестабільності/вартості):

### Модульні / інтеграційні (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардiв `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфігурації окремих проєктів для паралельного планування
- Файли: інвентарі core/модульних тестів у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні тести UI запускаються у виділеному шарді `unit-ui`
- Обсяг:
  - Чисті модульні тести
  - Внутрішньопроцесні інтеграційні тести (автентифікація Gateway, маршрутизація, інструменти, розбір, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести розпізнавача й завантажувача публічної поверхні мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` за допомогою згенерованих мінімальних фікстур plugin, а не
    реальних API вихідного коду вбудованого plugin. Реальні завантаження API plugin належать до
    контрактних/інтеграційних наборів, якими володіє plugin.

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардiв (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension позбавляти ресурсів непов’язані набори.
    - `pnpm test --watch` і далі використовує нативний граф проєкту кореневого `vitest.config.ts`, бо цикл спостереження з багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі правки тестів, сусідні файли `*.test.ts`, явні мапінги вихідного коду й локальні залежні елементи графа імпортів. Правки конфігурації/налаштування/пакетів не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, метадані release, live Docker tooling та tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; викликайте `pnpm test:changed` або явний `pnpm test <target>` для тестового доказу. Зміни версії лише в метаданих release запускають цільові перевірки version/config/root-dependency із guard, який відхиляє зміни package за межами верхньорівневого поля version.
    - Правки live Docker ACP harness запускають сфокусовані перевірки: shell-синтаксис для live Docker auth-скриптів і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; правки dependency, export, version та іншої package-surface і далі використовують ширші guards.
    - Import-light модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-зон спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані вихідні файли helpers `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих легких lanes, щоб правки helpers не перезапускали повний важкий набір для цього каталогу.
    - `auto-reply` має виділені buckets для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не займав увесь хвіст Node.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep extension і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте входи виявлення message-tool або runtime-контекст Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії helpers для меж чистої маршрутизації та нормалізації.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helpers
      не є достатньою заміною цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові значення pool та ізоляції Vitest">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Коренева UI lane зберігає своє налаштування `jsdom` та optimizer, але також запускається на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх процесів Node
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно індексує відформатовані файли й
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед передаванням або push, коли вам
      потрібен розумний локальний check gate.
    - `pnpm test:changed` за замовчуванням проходить через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішить, що правка harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею workers.
    - Автомасштабування локальних workers навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб reruns у changed-mode залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний вигляд
      файлами, зміненими з `origin/main`.
    - Дані таймінгів шардiв записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; include-pattern CI
      шарди додають назву шарду, щоб відфільтровані шарди можна було відстежувати
      окремо.
    - Коли один гарячий тест і далі витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      мокайте цей шов напряму, замість deep-import runtime helpers лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом кореневого проєкту для цього закоміченого
      diff і друкує wall time плюс максимальний RSS macOS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      брудне дерево, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль main-thread для
      накладних витрат запуску Vitest/Vite і transform.
    - `pnpm test:perf:profile:runner` записує CPU+heap профілі runner для
      unit suite з вимкненою файловою паралельністю.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із діагностикою, увімкненою за замовчуванням
  - Проганяє synthetic gateway message, memory і large-payload churn через шлях діагностичної події
  - Опитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, synthetic RSS samples залишаються нижче pressure budget, а глибини черг по сесіях спадають назад до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для подальшого опрацювання stability-regression, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих plugin у `extensions/`
- Runtime-типові значення:
  - Використовує Vitest `threads` з `isolate: false`, відповідно до решти repo.
  - Використовує адаптивних workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в silent mode, щоб зменшити накладні витрати console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного виводу console.
- Обсяг:
  - Наскрізна поведінка багатьох екземплярів Gateway
  - Поверхні WebSocket/HTTP, сполучення node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у модульних тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через справжні `sandbox ssh-config` + виконання SSH
  - Перевіряє поведінку файлової системи з віддаленим канонічним шляхом через міст fs sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарний файл CLI або wrapper-скрипт

### Live (справжні провайдери + справжні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Стандартно: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - “Чи цей провайдер/модель справді працює _сьогодні_ зі справжніми обліковими даними?”
  - Виявляє зміни форматів провайдерів, особливості виклику інструментів, проблеми автентифікації та поведінку обмежень швидкості
- Очікування:
  - За задумом не є стабільним для CI (справжні мережі, справжні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти швидкості
  - Краще запускати звужені підмножини замість “усього”
- Live-запуски завантажують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють матеріали конфігурації/автентифікації в тимчасовий тестовий домашній каталог, щоб unit-фікстури не могли змінити ваш справжній `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви навмисно хочете, щоб live-тести використовували ваш справжній домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: зберігає прогрес-вивід `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає логи bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи live-перевизначення для окремого провайдера через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на ліміти швидкості.
- Вивід прогресу/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів були помітно активними навіть тоді, коли перехоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/Gateway одразу передаються під час live-запусків.
  - Налаштуйте heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте heartbeat для Gateway/перевірок через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії Gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “мій бот не працює” / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live (тести, що торкаються мережі)

Про live-матрицю моделей, smoke-тести бекенда CLI, smoke-тести ACP, harness app-server Codex
і всі live-тести медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, media harness), а також обробку облікових даних для live-запусків див.
[Тестування live-наборів](/uk/help/testing-live). Для окремого контрольного списку оновлення та
перевірки Plugin див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і завантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням мають меншу межу smoke, щоб повний Docker sweep лишався практичним:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  явно хочете більший вичерпний scan.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише runner Node/Git для напрямків install/update/plugin-dependency; ці напрями монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для напрямків функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким live-, npm-install- і multi-service-напрямам стартувати всім одночасно. Якщо один напрям важчий за активні обмеження, планувальник усе одно може запустити його, коли pool порожній, і потім тримає його єдиним активним, доки знову не з’явиться доступна ємність. Стандартні значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Runner за замовчуванням виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, друкує статус кожні 30 секунд, зберігає таймінги успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках спочатку стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб у package/image та облікових даних.
- `Package Acceptance` — це нативний для GitHub package gate для питання "чи цей installable tarball працює як продукт?" Він розв’язує один кандидатний package з `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E-напрями проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) щодо контракту package/update/plugin, матриці виживання published-upgrade, стандартів release і triage збоїв.
- Перевірки build і release запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захисна перевірка обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо startup до dispatch імпортує package-залежності, як-от Commander, prompt UI, undici або logging, до dispatch команди; вона також тримає зібраний gateway run chunk у межах бюджету та відхиляє статичні імпорти відомих холодних шляхів Gateway. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду списку моделей.
- Сумісність Package Acceptance legacy обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цього cutoff harness допускає лише metadata-прогалини shipped-package: пропущені приватні записи інвентарю QA, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій з tarball, відсутній збережений `update.channel`, legacy-розташування записів встановлення Plugin, відсутнє збереження записів встановлення marketplace і міграцію metadata конфігурації під час `plugins update`. Для packages після `2026.4.25` ці шляхи є суворими помилками.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька справжніх контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker runners також монтують лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-тест бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-тест Codex app-server harness: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev-агент: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-тест спостережуваності: `pnpm qa:otel:smoke` — приватна QA-доріжка перевірки source-checkout. Її навмисно не включено до Docker-доріжок випуску пакета, оскільки npm tarball не містить QA Lab.
- Live smoke для Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест npm tarball для онбордингу/каналу/агента: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг з посиланням на змінні середовища та Telegram за замовчуванням, запускає doctor і виконує один мокований хід агента OpenAI. Повторно використовуйте заздалегідь зібраний tarball з `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості з `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал з `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикає з пакета `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, потім перемикає назад на пакет `stable` і перевіряє статус оновлення.
- Smoke-тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналу, allowlist-ами plugin, застарілим станом залежностей plugin і наявними файлами workspace/сесій. Він запускає оновлення пакета та неінтерактивний doctor без live-ключів провайдера або каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Опублікований smoke-тест виживання після оновлення: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цю базову версію вбудованим рецептом команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети RPC-статусу. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні базові версії через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` і розгорніть issue-подібні фікстури через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту встановлення зовнішнього OpenClaw plugin. Package Acceptance показує їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Smoke-тест runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context у transcript, а також ремонт doctor для зачеплених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень, а не зависає. Повторно використовуйте заздалегідь зібраний tarball з `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості з `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу з `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-тест Docker-інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache для root-, update- і direct-npm-контейнерів. Smoke-тест оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до кандидатного tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхідний параметр `update_baseline_version` workflow Install Smoke на GitHub. Перевірки non-root інсталятора використовують ізольований npm cache, щоб записи cache з root-власником не приховували поведінку встановлення в користувацькому середовищі. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm з `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цієї env, коли потрібне покриття прямого `npm install -g`.
- Smoke-тест CLI видалення агентів зі спільним workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого workspace. Повторно використовуйте образ install-smoke з `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ із шаром Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshot-и ролей CDP охоплюють URL посилань, clickable-елементи, підвищені cursor-ом, iframe-посилання та метадані frame.
- Регресія OpenAI Responses web_search з мінімальним reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає мокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє schema провайдера і перевіряє, що сирі деталі з’являються в логах Gateway.
- MCP-міст каналу (засіяний Gateway + stdio-міст + сирий smoke-тест Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi bundle (реальний stdio MCP server + smoke-тест allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update smoke для локального шляху, `file:`, npm registry з hoisted-залежностями, рухомих git refs, ClawHub kitchen-sink, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару package/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture-сервер ClawHub.
- Smoke-тест незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест metadata перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює install/update smoke для локального шляху, `file:`, npm registry з hoisted-залежностями, рухомих git refs, фікстур ClawHub, marketplace updates і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` охоплює поведінку незміненого оновлення для встановлених plugins.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення образу, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. QR- і installer-Docker-тести зберігають власні Dockerfile, бо вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Docker-ранери live-model також монтують поточний checkout у режимі read-only і
переносять його в тимчасовий workdir всередині контейнера. Це зберігає runtime
образ легким, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок staging пропускає великі локальні cache та build output застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку `.build` або
каталоги output Gradle, щоб Docker live runs не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні Telegram/Discord/тощо channel workers всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цієї Docker-доріжки.
`test:docker:openwebui` — це вищорівневий smoke-тест сумісності: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoints,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, потім надсилає
реальний chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може потребувати завантажити
образ Open WebUI, а Open WebUI може потребувати завершити власне cold-start setup.
Ця доріжка очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски виводять невелике JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає засіяний Gateway
container, запускає другий контейнер, який породжує `openclaw mcp serve`, потім
перевіряє routed conversation discovery, читання transcript, metadata attachment,
поведінку live event queue, outbound send routing і Claude-style channel +
permission notifications через реальний stdio MCP bridge. Перевірка notification
безпосередньо інспектує сирі stdio MCP frames, щоб smoke-тест перевіряв те, що
bridge фактично emits, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає repo Docker image, запускає реальний stdio MCP probe server
всередині контейнера, матеріалізує цей server через вбудований Pi bundle
MCP runtime, виконує tool, потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway із реальним stdio MCP probe server, виконує
ізольований cron turn і одноразовий child turn `/subagents spawn`, потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke-тест ACP plain-language thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflows регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) змонтовано до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) змонтовано до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) змонтовано до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) змонтовано до `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски provider монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне повторне збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну перевірку anchors Mintlify, коли також потрібні перевірки заголовків усередині сторінок: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії “справжнього pipeline” без реальних providers:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + забезпечує auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька безпечних для CI тестів, що поводяться як “оцінювання надійності агента”:

- Mock-виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, що перевіряють зв’язування сесій і ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, що перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають насамперед залишатися детермінованими:

- Runner сценаріїв із mock providers для перевірки викликів інструментів + порядку, читання skill-файлів і зв’язування сесій.
- Невеликий набір сценаріїв, зосереджених на skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live evals (opt-in, через env-gate) лише після появи безпечного для CI набору.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка зв’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - Directory/roster API
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Проби статусу channel
- **registry** - Форма registry plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/selection auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/interface plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни exports або subpaths plugin-sdk
- Після додавання або змінення channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API keys.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену наживо:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub provider або зафіксуйте точну трансформацію request-shape)
- Якщо це невіддільно live-only (обмеження rate limits, політики auth), тримайте live test вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить bug:
  - bug конвертації/відтворення запиту provider → прямий тест models
  - bug pipeline сесії/історії/інструментів gateway → gateway live smoke або безпечний для CI mock-тест gateway
- Запобіжник обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль на клас SecretRef із metadata registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-сегментами відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
