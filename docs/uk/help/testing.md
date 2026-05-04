---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: unit/e2e/live набори, Docker runner-и та що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-04T06:33:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest-тестів (unit/integration, e2e, live) і невеликий набір
Docker runner-ів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він свідомо _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідка для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовують сценарії з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels runner-ів. Розділ про QA-специфічні runner-и нижче ([QA-специфічні runner-и](#qa-specific-runners)) перелічує конкретні виклики `qa` і посилається назад на наведені вище довідкові матеріали.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extensions/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спершу надавайте перевагу таргетованим запускам, коли ітеруєте над одним збоєм.
- Docker-backed QA-сайт: `pnpm qa:lab:up`
- QA-lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Таргетувати один live-файл у тихому режимі: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти продуктивності runtime: запустіть `OpenClaw Performance` з
  `live_gpt54=true` для реального agent turn `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти lane mock-provider, deep-profile і GPT 5.4 у
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить показники завантаження Gateway на рівні джерел, пам’яті,
  plugin-pressure, повторюваного fake-model hello-loop і запуску CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn і невелику перевірку в стилі читання файлу.
    Моделі, чиї метадані заявляють вхід `image`, також виконують маленький image turn.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розділені за провайдерами.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає agent turns Gateway через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова belt-and-suspenders перевірка поверхні команди rescue для message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    валідовує конфігурацію та перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: коли встановлено `MOONSHOT_API_KEY`, запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.
</Tip>

## QA-специфічні runner-и

Ці команди стоять поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у виділених workflow. Agentic parity вкладено в
`QA-Lab - All Lanes` і release validation, а не в окремий PR workflow.
Для широкої валідації слід використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. `QA-Lab - All Lanes`
запускається щоночі на `main` і через manual dispatch з mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельні jobs. Scheduled QA і release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і manual workflow input
за замовчуванням залишаються `all`; manual dispatch може розбити `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими й уникали звичайного запуску provider-plugin. Ці live transport
gateways вимикають memory search; поведінка пам’яті залишається покритою QA parity
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
    Gateway workers. `qa-channel` за замовчуванням використовує паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість worker, або `--concurrency 1` для старішої послідовної lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни scenario-aware
    lane `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає bench запуску Gateway плюс невеликий пакет mock-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об'єднаний підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише стійкі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески запуску записуються як метрики
    без вигляду регресії тривалого, на хвилини, завантаження Gateway.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, коли checkout ще не
    має свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, практичні для guest:
    ключі провайдерів на основі env, шлях до live provider config QA, і `CODEX_HOME`
    за наявності.
  - Output dirs мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary плюс логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для QA роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding з OpenAI API key, налаштовує Telegram
    за замовчуванням, перевіряє, що packaged Plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один local agent turn проти
    mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для вбудованих runtime context
    transcripts. Він перевіряє, що прихований runtime context OpenClaw зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім seed-ить affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, а потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі облікові дані Telegram з env або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/release automation задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - Wrapper перевіряє env облікових даних Telegram або Convex на хості перед
    Docker build/install роботою. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише коли навмисно налагоджуєте pre-credential setup.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions відкриває цю lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також відкриває `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler з smoke, package, product, full або custom
  lane profiles. Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof завантажує tarball artifact з іншого Actions run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує і встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через config
    edits.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перший configured doctor repair явно встановлює кожен відсутній downloadable
    Plugin, а другий restart не запускає hidden dependency
    repair.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor candidate
    прибирає legacy Plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke у Parallels guests. Кожна
    вибрана platform спершу встановлює запитаний baseline package, потім запускає
    installed command `openclaw update` у тому самому guest і перевіряє
    installed version, update status, gateway readiness і один local agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному guest. Використовуйте `--json` для summary artifact path і
    per-lane status.
  - OpenAI lane за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски host timeout, щоб зупинки Parallels transport не могли
    спожити решту testing window:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені lane logs у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед тим, як припускати, що outer wrapper завис.
  - Windows update може витратити 10-15 хвилин на post-update doctor і package
    update work на холодному guest; це все ще здоровий стан, коли вкладений npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони спільно використовують VM state і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну bundled Plugin surface, оскільки
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs навіть тоді, коли agent
    turn сам лише перевіряє просту text response.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний AIMock provider server для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти одноразового Docker-backed Tuwunel homeserver. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, profile/scenario catalog, env vars і artifact layout: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти справжньої приватної групи з driver і SUT bot tokens з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для shared pooled credentials. Використовуйте env mode за замовчуванням або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних bot в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від driver send request до observed SUT reply.

Live transport lanes мають один стандартний contract, щоб нові transports не розходилися; per-lane coverage matrix міститься в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це broad synthetic suite і не є частиною цієї matrix.

### Shared Telegram credentials via Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує exclusive lease з Convex-backed pool, надсилає heartbeats
для цього lease, поки lane виконується, і звільняє lease під час shutdown.

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

Required env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної role:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Optional env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов'язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs для local-only development.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у normal operation.

Maintainer admin commands (pool add/remove/list) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers for maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети брокера,
префікс кінцевої точки, HTTP-тайм-аут і доступність admin/list без виведення
секретних значень. Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI
утилітах.

Типовий контракт кінцевої точки (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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

Форма payload для kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Архітектура й назви scenario-helper для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному seam хоста `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Тестові набори (що де запускається)

Сприймайте набори як “зростання реалістичності” (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventory у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; unit-тести UI запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit-тести
  - In-process integration тести (автентифікація Gateway, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` з generated tiny plugin fixtures, а не з реальними API джерел bundled plugin.
    Реальні завантаження API Plugin належать до
    contract/integration наборів, якими володіє Plugin.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Нецiльовий `pnpm test` запускає дванадцять менших shard configs (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного native root-project процесу. Це зменшує peak RSS на завантажених машинах і не дає auto-reply/extension роботі виснажувати непов’язані набори.
    - `pnpm test --watch` і далі використовує native root `vitest.config.ts` project graph, бо multi-shard watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явні file/directory targets через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної ціни старту root project.
    - `pnpm test:changed` типово розгортає змінені git paths у дешеві scoped lanes: прямі правки тестів, сусідні файли `*.test.ts`, явні source mappings і локальні import-graph dependents. Правки config/setup/package не запускають broad tests, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним smart local check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; викликайте `pnpm test:changed` або явний `pnpm test <target>` для тестового доказу. Version bumps лише release metadata запускають цільові перевірки version/config/root-dependency з guard, який відхиляє package changes поза top-level version field.
    - Правки live Docker ACP harness запускають сфокусовані перевірки: shell syntax для live Docker auth scripts і live Docker scheduler dry-run. Зміни `package.json` включаються лише коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші package-surface edits і далі використовують ширші guards.
    - Import-light unit tests з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних pure utility areas спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють changed-mode runs з явними sibling tests у цих light lanes, тож helper edits уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має виділені buckets для top-level core helpers, top-level `reply.*` integration tests і subtree `src/auto-reply/reply/**`. CI додатково розділяє reply subtree на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів повним хвостом Node.
    - Звичайний PR/main CI навмисно пропускає extension batch sweep і release-only shard `agentic-plugins`. Full Release Validation запускає окремий child workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте inputs для message-tool discovery або runtime
      context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper regressions для чистих меж routing і normalization.
    - Підтримуйте справність integration-наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction і далі проходять
      реальними шляхами `run.ts` / `compact.ts`; helper-only tests
      не є достатньою заміною цих integration paths.

  </Accordion>

  <Accordion title="Типові значення pool та isolation у Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e і live configs.
    - Root UI lane зберігає свій `jsdom` setup і optimizer, але також працює на
      спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх процесів Node
      Vitest, щоб зменшити compile churn V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які architectural lanes запускає diff.
    - Pre-commit hook відповідає лише за форматування. Він повторно stage-ить formatted files і
      не запускає lint, typecheck або tests.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли agent
      вирішує, що правка harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      просто з вищим worker cap.
    - Локальне worker auto-scaling навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб changed-mode reruns залишалися коректними, коли змінюється test
      wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну cache location для direct profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest import-duration плюс
      import-breakdown output.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими від `origin/main`.
    - Дані shard timing записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config runs використовують шлях конфігурації як ключ; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test і далі витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-importing runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` з native root-project path для цього committed
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarks поточне
      dirty tree, маршрутизуючи список changed file через
      `scripts/test-projects.mjs` і root Vitest config.
    - `pnpm test:perf:profile:main` записує main-thread CPU profile для
      overhead старту й transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує runner CPU+heap profiles для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway з diagnostics, типово ввімкненими
  - Проганяє synthetic gateway message, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers для persistence diagnostic stability bundle
  - Перевіряє, що recorder залишається bounded, synthetic RSS samples лишаються нижче pressure budget, а per-session queue depths спадають назад до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для stability-regression follow-up, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести комплектних Plugin у `extensions/`
- Типові параметри середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивні воркери (CI: до 2, локально: типово 1).
  - Типово працює в тихому режимі, щоб зменшити накладні витрати консольного I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного консольного виводу.
- Область:
  - Наскрізна поведінка Gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, сполучення вузлів і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в конвеєрі)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у модульних тестах (може бути повільніше)

### E2E: швидка перевірка бекенду OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює пісочницю з тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє віддалено-канонічну поведінку файлової системи через міст fs пісочниці
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і пісочницю
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного бінарного файла CLI або скрипта-обгортки

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести комплектних Plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки обмежень частоти
- Очікування:
  - Навмисно не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти частоти
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні ключі API.
- Типово live-запуски все одно ізолюють `HOME` і копіюють матеріали конфігурації/автентифікації в тимчасовий тестовий домашній каталог, щоб модульні фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово використовує тихіший режим: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає журнали початкового завантаження Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація ключів API (залежить від провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для окремого live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях з обмеженням частоти.
- Вивід прогресу/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів було видно як активні навіть тоді, коли перехоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway транслювалися негайно під час live-запусків.
  - Налаштовуйте heartbeats прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте heartbeats Gateway/зондів через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в мережевій взаємодії Gateway / протоколі WS / сполученні: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / збоїв, специфічних для провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Live-тести (які торкаються мережі)

Для live-матриці моделей, швидких перевірок бекенду CLI, швидких перевірок ACP, тестового стенда сервера застосунку Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення, музика, відео, медіастенд), а також обробки облікових даних для live-запусків див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального контрольного списку оновлень і перевірки Plugin див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл ключів профілю в Docker-образі репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і підвантажують `~/.profile`, якщо змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово використовують менший ліміт швидкої перевірки, щоб повний Docker-прохід лишався практичним:
  `test:docker:live-models` типово задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли ви
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише Node/Git runner для смуг install/update/plugin-dependency; ці смуги монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для смуг функціональності зібраного застосунку. Визначення Docker-смуг містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а ресурсні ліміти не дають важким live-, npm-install- і multi-service-смугам стартувати всім одночасно. Якщо одна смуга важча за активні ліміти, планувальник усе одно може запустити її, коли пул порожній, а потім тримає її окремо, доки знову не з’явиться місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Runner типово виконує попередню перевірку Docker, видаляє застарілі контейнери OpenClaw E2E, друкує статус кожні 30 секунд, зберігає таймінги успішних смуг у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках стартувати довші смуги першими. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест смуг без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних смуг, потреб пакета/образу та облікових даних.
- `Package Acceptance` є нативним для GitHub шлюзом пакета для питання «чи працює цей інстальований tarball як продукт?» Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-смуги проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковано за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) щодо контракту пакета/оновлення/Plugin, матриці виживання опублікованих оновлень, типових параметрів релізу та розбору збоїв.
- Перевірки збірки та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захисна перевірка обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо імпорти запуску до диспетчеризації завантажують залежності пакета, як-от Commander, prompt UI, undici або logging, до диспетчеризації команди; вона також утримує комплектний фрагмент запуску Gateway в межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Швидка перевірка запакованого CLI також охоплює кореневу довідку, довідку onboard, довідку doctor, status, схему config і команду списку моделей.
- Сумісність застарілого `Package Acceptance` обмежено `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі тестовий стенд допускає лише прогалини метаданих відвантаженого пакета: пропущені приватні записи інвентарю QA, відсутній `gateway install --wrapper`, відсутні файли патчів у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, застарілі місця записів встановлення Plugin, відсутнє збереження запису встановлення marketplace і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є строгими збоями.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker runners також bind-mount лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-перевірка прив’язування ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-перевірка бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-перевірка harness сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-перевірка спостережуваності: `pnpm qa:otel:smoke` — це приватний напрям перевірки вихідного checkout QA. Його навмисно не включено до напрямів пакетного релізу Docker, бо npm tarball не містить QA Lab.
- Live smoke-перевірка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-перевірка onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з env-ref і Telegram за замовчуванням, запускає doctor і виконує один mocked turn агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте channel через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-перевірка перемикання update channel: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений channel і роботу plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Smoke-перевірка survivor після upgrade: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх брудної фікстури старого користувача з agents, channel config, plugin allowlists, застарілим станом залежностей plugin і наявними файлами workspace/session. Вона запускає оновлення пакета та неінтерактивний doctor без live provider або channel keys, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Smoke-перевірка survivor після опублікованого upgrade: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого command recipe, валідує отриману config, оновлює цю опубліковану інсталяцію до candidate tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє configured intents, збереження state, startup, `/healthz`, `/readyz` і бюджети RPC status. Перевизначайте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, просіть aggregate scheduler розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, як-от `all-since-2026.4.23`, і розгортайте issue-shaped fixtures через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, як-от `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного repair встановлення зовнішніх OpenClaw plugin. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Smoke-перевірка runtime context сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження transcript прихованого runtime context, а також repair через doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke-перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers, а не зависає. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного образу Docker через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-перевірка Installer Docker: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між своїми root, update і direct-npm контейнерами. Update smoke за замовчуванням використовує npm `latest` як stable baseline перед upgrade до candidate tarball. Перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` локально або через input `update_baseline_version` workflow Install Smoke на GitHub. Non-root installer checks зберігають ізольований npm cache, щоб root-owned cache entries не маскували поведінку встановлення в user-local. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-перевірка CLI для видалення agents shared workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ root Dockerfile, засіває двох agents з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-перевірка Browser CDP snapshot: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із raw CDP, запускає `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URL посилань, cursor-promoted clickables, iframe refs і frame metadata.
- Регресійна перевірка OpenAI Responses web_search з мінімальним reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mocked сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema і перевіряє, що raw detail з’являється в Gateway logs.
- MCP channel bridge (засіяний Gateway + stdio bridge + raw smoke-перевірка Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + smoke-перевірка allow/deny вбудованого Pi profile): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (реальний Gateway + демонтаж stdio MCP child після ізольованих запусків cron і one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-перевірка install/update для local path, `file:`, npm registry з hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture server ClawHub.
- Smoke-перевірка незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-перевірка матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований tarball OpenClaw у порожньому контейнері, встановлює npm plugin, перемикає enable/disable, upgrade і downgrade через локальний npm registry, видаляє встановлений код, потім перевіряє, що uninstall все одно видаляє застарілий state, водночас логуючи RSS/CPU metrics для кожної фази життєвого циклу.
- Smoke-перевірка metadata перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює smoke-перевірку install/update для local path, `file:`, npm registry з hoisted dependencies, git moving refs, ClawHub fixtures, marketplace updates і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` охоплює unchanged update behavior для встановлених plugins. `pnpm test:docker:plugin-lifecycle-matrix` охоплює resource-tracked встановлення, enable, disable, upgrade, downgrade та missing-code uninstall для npm plugin.

Щоб вручну попередньо зібрати та повторно використовувати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific image overrides, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` указує на віддалений shared image, скрипти завантажують його, якщо він ще не локальний. QR і installer Docker tests зберігають власні Dockerfiles, бо вони перевіряють package/install behavior, а не shared built-app runtime.

Live-model Docker runner-и також bind-mount-ять поточний checkout у режимі лише читання та
розгортають його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок staging пропускає великі локальні-only кеші та build outputs застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, і app-local `.build` або
каталоги Gradle output, щоб Docker live runs не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
справжні Telegram/Discord/тощо channel workers усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож передавайте також
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage із цієї Docker lane.
`test:docker:openwebui` — це higher-level compatibility smoke: він запускає
контейнер OpenClaw gateway з увімкненими OpenAI-compatible HTTP endpoints,
запускає pinned контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
справжній chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися витягнути
image Open WebUI, а Open WebUI може знадобитися завершити власний cold-start setup.
Ця lane очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно deterministic і не потребує
справжнього акаунта Telegram, Discord або iMessage. Він завантажує seeded Gateway
container, запускає другий контейнер, який породжує `openclaw mcp serve`, потім
перевіряє routed conversation discovery, transcript reads, attachment metadata,
live event queue behavior, outbound send routing і Claude-style channel +
permission notifications через справжній stdio MCP bridge. Перевірка notification
інспектує raw stdio MCP frames напряму, тож smoke валідує те, що
bridge фактично emits, а не лише те, що певний client SDK випадково surface-ить.
`test:docker:pi-bundle-mcp-tools` deterministic і не потребує live
model key. Він збирає repo Docker image, запускає справжній stdio MCP probe server
усередині контейнера, materializes цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` deterministic і не потребує live model
key. Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і `/subagents spawn` one-shot child turn, а потім перевіряє,
що child process MCP завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей script для regression/debug workflows. Він може знову знадобитися для валідації ACP thread routing, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) mounted до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) mounted до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) mounted до `/home/node/.profile` і sourced перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, sourced з `OPENCLAW_PROFILE_FILE`, з використанням тимчасових config/workspace dirs і без external CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) mounted до `/home/node/.npm-global` для cached CLI installs усередині Docker
- External CLI auth dirs/files під `$HOME` mounted read-only під `/host-auth...`, потім copied до `/home/node/...` перед стартом tests
  - Default dirs: `.minimax`
  - Default files: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Narrowed provider runs mount only потрібні dirs/files, inferred from `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manually with `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, or a comma list like `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` щоб звузити run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` щоб фільтрувати providers in-container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` щоб повторно використати наявний image `openclaw:local-live` для reruns, які не потребують rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб забезпечити, що creds надходять із profile store (не env)
- `OPENCLAW_OPENWEBUI_MODEL=...` щоб вибрати model, exposed by gateway для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` щоб override nonce-check prompt, used by Open WebUI smoke
- `OPENWEBUI_IMAGE=...` щоб override pinned Open WebUI image tag

## Перевірка документації

Запускайте docs checks після редагувань doc: `pnpm check:docs`.
Запускайте full Mintlify anchor validation, коли також потрібні in-page heading checks: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

Це “real pipeline” regressions без справжніх providers:

- Gateway tool calling (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, writes config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

У нас уже є кілька CI-safe tests, які поводяться як “agent reliability evals”:

- Mock tool-calling через real gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які валідують session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills перелічені в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає agent `SKILL.md` перед use і чи дотримується required steps/args?
- **Workflow contracts:** multi-turn scenarios, які assert tool order, session history carryover і sandbox boundaries.

Future evals мають спершу залишатися deterministic:

- Scenario runner із mock providers для assert tool calls + order, skill file reads і session wiring.
- Невеликий suite skill-focused scenarios (use vs avoid, gating, prompt injection).
- Optional live evals (opt-in, env-gated) лише після появи CI-safe suite.

## Контрактні тести (Plugin і форма каналу)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
interface contract. Вони ітерують усі discovered plugins і запускають suite
shape and behavior assertions. Default `pnpm test` unit lane навмисно
пропускає ці shared seam і smoke files; запускайте contract commands explicitly,
коли торкаєтеся shared channel або provider surfaces.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовано в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Basic plugin shape (id, name, capabilities)
- **setup** - Setup wizard contract
- **session-binding** - Session binding behavior
- **outbound-payload** - Message payload structure
- **inbound** - Inbound message handling
- **actions** - Channel action handlers
- **threading** - Thread ID handling
- **directory** - Directory/roster API
- **group-policy** - Group policy enforcement

### Provider status contracts

Розташовано в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Plugin registry shape

### Provider contracts

Розташовано в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Plugin loading
- **runtime** - Provider runtime
- **shape** - Plugin shape/interface
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання чи модифікації channel або provider Plugin
- Після refactoring Plugin registration або discovery

Contract tests запускаються в CI й не потребують справжніх API keys.

## Додавання regressions (guidance)

Коли ви виправляєте provider/model issue, виявлену live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або capture exact request-shape transformation)
- Якщо це inherently live-only (rate limits, auth policies), залиште live test вузьким і opt-in через env vars
- Надавайте перевагу targeting smallest layer, який catches bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derives one sampled target per SecretRef class from registry metadata (`listSecretTargetRegistryEntries()`), then asserts traversal-segment exec ids are rejected.
  - Якщо ви додаєте нову `includeInPlan` SecretRef target family у `src/secrets/target-registry-data.ts`, update `classifyTargetClass` in that test. Тест навмисно fails on unclassified target ids, щоб new classes cannot be skipped silently.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
