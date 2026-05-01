---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway й агента
summary: 'Набір для тестування: набори модульних/e2e/live-тестів, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-01T03:00:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker runners. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він свідомо _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, для налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовується сценаріями з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels runners. Розділ про QA-specific runners нижче ([QA-specific runners](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над окремим падінням спершу віддавайте перевагу цільовим запускам.
- Docker-backed QA site: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + Gateway tool/image probes): `pnpm test:live`
- Цільовий запуск одного live-файлу без зайвого виводу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає текстовий turn плюс невеликий probe у стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також запускають крихітний image turn.
    Вимкніть додаткові probes за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розшардовані за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal provider secrets до `scripts/ci-hydrate-live-auth.sh`
    разом із `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM за допомогою `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення із зображенням
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через harness Codex app-server, яким володіє Plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probes. Вимкніть sub-agent probe за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова перевірка belt-and-suspenders для поверхні rescue command у message-channel.
    Вона виконує `/crestodian status`, ставить у чергу persistent model
    change, відповідає `/crestodian yes` і перевіряє шлях audit/config write.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    перевіряє конфігурацію і перевіряє audit entries. Той самий шлях Ring 0 setup
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізоване `usage.cost`.

<Tip>
Коли потрібен лише один випадок, що падає, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-specific runners

Ці команди стоять поруч із головними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab в окремих workflows. `Parity gate` запускається на відповідних PRs і
з ручного dispatch із mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch із mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Scheduled QA та release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і manual workflow input за замовчуванням залишаються
`all`; manual dispatch може шардити `all` на `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед схваленням релізу, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися deterministic
і уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; поведінка memory залишається покритою наборами QA parity.

Повні release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім отримують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість перебудови
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішої serial lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій падає. Використовуйте `--allow-failures`, коли
    хочете artifacts без коду виходу з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний AIMock-backed provider server для експериментального
    покриття fixture і protocol-mock без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий пакет mock QA Lab scenarios
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі спостереження hot CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як metrics
    без вигляду регресії gateway peg, що триває хвилинами.
  - Використовує зібрані артефакти `dist`; спершу запустіть build, якщо checkout ще не має
    свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір всередині disposable Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
  - Повторно використовує ті самі provider/model selection flags, що й `qa suite`.
  - Live-запуски forward підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, встановлює його глобально в
    Docker, запускає non-interactive onboarding з OpenAI API-key, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення Plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один local agent turn проти mock OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім додає affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює OpenClaw package candidate у Docker, запускає installed-package
    onboarding, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; установіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation установіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions надає цю lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler із профілями lanes smoke, package, product, full або custom.
  Установіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof вимагає digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Підтвердження через артефакт завантажує tarball-артефакт з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/Plugin-и через
    зміни конфігурації.
  - Перевіряє, що виявлення налаштування залишає неналаштовані runtime-залежності Plugin
    відсутніми, перший налаштований запуск Gateway або doctor встановлює runtime-залежності кожного вбудованого
    Plugin на вимогу, а другий перезапуск не
    перевстановлює залежності, які вже були активовані.
  - Також встановлює відомий старіший npm-базис, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    post-update doctor кандидата відновлює runtime-залежності вбудованого каналу без
    postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає нативний smoke-тест оновлення packaged-install у гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі та перевіряє
    встановлену версію, статус оновлення, готовність gateway і один turn локального агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до summary-артефакта та
    статусу кожної lane.
  - Lane OpenAI за замовчуванням використовує `openai/gpt-5.5` для live-підтвердження agent-turn.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не
    використали решту тестового вікна:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені lane-журнали в `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішній wrapper завис.
  - Оновлення Windows може витратити 10-15 хвилин на post-update doctor/runtime
    відновлення залежностей на холодній гостьовій системі; це все ще нормально, якщо вкладений
    npm debug log просувається.
  - Не запускайте цей агрегований wrapper паралельно з окремими smoke-lane Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, подавання пакета або стану guest gateway.
  - Post-update proof запускає звичайну поверхню вбудованого Plugin, оскільки
    capability facade-и, такі як мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API, навіть коли сам agent turn
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер AIMock provider для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти одноразового homeserver Tuwunel на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і розкладка артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти справжньої приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних bot-ів в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot-ів і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від driver send request до observed SUT reply.

Live transport lane-и використовують один стандартний контракт, щоб нові transport-и не розходилися; матриця покриття для кожної lane міститься в [Огляд QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний suite і не є частиною цієї матриці.

### Спільні Telegram credentials через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з pool на базі Convex, надсилає heartbeat
для цього lease, поки lane виконується, і звільняє lease під час shutdown.

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один secret для вибраної role:
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URL-и лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Admin commands для maintainer-ів (pool add/remove/list) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainer-ів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і досяжність admin/list без друку
secret values. Використовуйте `--json` для machine-readable output у scripts і CI
utilities.

Default endpoint contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Success: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Exhausted/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Success: `{ status: "ok" }` (або порожній `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Success: `{ status: "ok" }` (або порожній `2xx`)
- `POST /admin/add` (лише maintainer secret)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Success: `{ status: "ok", credential }`
- `POST /admin/remove` (лише maintainer secret)
  - Request: `{ credentialId, actorId }`
  - Success: `{ status: "ok", changed, credential }`
  - Active lease guard: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Success: `{ status: "ok", credentials, count }`

Payload shape для Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком Telegram chat id.
- `admin/add` перевіряє цю shape для `kind: "telegram"` і відхиляє malformed payloads.

### Додавання каналу до QA

Архітектура й назви scenario-helper для нових channel adapter-ів містяться в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити scenarios у `qa/scenarios/`.

## Test suites (що де запускається)

Думайте про suites як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (за замовчуванням)

- Command: `pnpm test`
- Config: untargeted runs використовують shard set `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для parallel scheduling
- Files: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Scope:
  - Pure unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Deterministic regressions для відомих bugs
- Expectations:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Resolver і public-surface loader tests мають доводити broad `api.js` і
    fallback-поведінку `runtime-api.js` з generated tiny plugin fixtures, а не
    реальні bundled plugin source APIs. Real plugin API loads належать до
    plugin-owned contract/integration suites.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного велетенського нативного процесу кореневого проєкту. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/розширень виснажувати ресурси для непов’язаних наборів тестів.
    - `pnpm test --watch` і далі використовує нативний кореневий граф проєктів `vitest.config.ts`, бо цикл спостереження з багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні мапінги джерел і локальні залежні елементи графа імпортів. Зміни конфігурації/налаштування/пакетів не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний контрольний gate для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового підтвердження викликайте `pnpm test:changed` або явний `pnpm test <target>`. Version bumps лише для release metadata запускають цільові перевірки версії/конфігурації/кореневих залежностей із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell-синтаксис для live Docker auth scripts і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, експортів, версії та інших package-surface і далі використовують ширші guards.
    - Легкі щодо імпортів модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних областей чистих утиліт спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важким runtime залишаються на наявних lanes.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також маплять запуски changed-mode на явні сусідні тести в цих легких lanes, тож зміни helper не перезапускають повний важкий набір для цього каталогу.
    - `auto-reply` має окремі кошики для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розбиває піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими імпортами не володів усім Node-хвостом.
    - Звичайний PR/main CI навмисно пропускає batch sweep для extensions і лише release-шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на реліз-кандидатах.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли змінюєте вхідні дані discovery message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресійні helper-тести для меж чистої маршрутизації та нормалізації.
    - Підтримуйте справними інтеграційні набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Пули Vitest і типові параметри ізоляції">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e і live-конфігураціях.
    - Кореневий UI lane зберігає своє налаштування `jsdom` і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові параметри `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook відповідає лише за форматування. Він повторно додає відформатовані файли до stage і
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен розумний локальний контрольний gate.
    - `pnpm test:changed` типово маршрутизує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішить, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею workers.
    - Локальне автоматичне масштабування workers навмисно консервативне й зменшується,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб повторні запуски changed-mode залишалися коректними, коли змінюється
      тестова проводка.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий вид профілювання
      файлами, зміненими відносно `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; CI-шарди
      з include-pattern додають назву шарда, щоб відфільтровані шарди можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      mock-айте цей шов напряму, замість deep-importing runtime helpers лише
      для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом кореневого проєкту для цього зафіксованого
      diff і друкує wall time плюс max RSS на macOS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для
      накладних витрат запуску й трансформацій Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap профілі runner для
      unit suite з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Scope:
  - Запускає реальний loopback Gateway із типово ввімкненою діагностикою
  - Проганяє синтетичний churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS-зразки лишаються нижче pressure budget, а глибини черг на сесію повертаються до нуля
- Очікування:
  - Безпечно для CI й без ключів
  - Вузький lane для follow-up щодо регресій стабільності, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові runtime-параметри:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує адаптивних workers (CI: до 2, локально: типово 1).
  - Типово працює в silent mode, щоб зменшити накладні витрати console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний console output.
- Scope:
  - Наскрізна поведінка багатьох екземплярів gateway
  - WebSocket/HTTP surfaces, node pairing і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit tests (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локальний `openshell` CLI плюс робочий Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує тестовий gateway і sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI binary або wrapper script

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - «Чи цей provider/model справді працює _сьогодні_ з реальними creds?»
  - Виявляти зміни формату provider, особливості tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - Не є CI-stable за задумом (реальні мережі, реальні політики provider, quotas, outages)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені subsets замість «усього»
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API keys.
- Типово live-запуски все одно ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви навмисно хочете, щоб live-тести використовували ваш реальний home directory.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає gateway bootstrap logs/Bonjour chatter. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API key (специфічно для provider): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби на відповідях rate limit.
- Progress/heartbeat output:
  - Live suites тепер виводять progress lines у stderr, щоб довгі provider calls були видимо активні навіть тоді, коли console capture Vitest тихий.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб progress lines provider/gateway транслювалися негайно під час live-запусків.
  - Налаштовуйте direct-model heartbeats через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте gateway/probe heartbeats через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який suite запускати?

Використовуйте цю таблицю рішень:

- Логіка/тести редагування: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Робота з мережею Gateway / протоколом WS / спарюванням: додайте `pnpm test:e2e`
- Налагодження “мій бот недоступний” / помилок конкретного провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Живі (з доступом до мережі) тести

Про живу матрицю моделей, смоук-тести бекенда CLI, смоук-тести ACP, обв’язку
app-server Codex і всі живі тести медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, медіаобв’язка), а також обробку облікових даних для живих запусків див.
[Тестування — живі набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки "працює в Linux")

Ці Docker-ранери поділяються на дві групи:

- Ранери живих моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний живий файл ключа профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочий простір (і завантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово використовують менший ліміт смоук-перевірок, щоб повний Docker-прохід залишався практичним:
  `test:docker:live-models` типово має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли
  вам явно потрібне ширше вичерпне сканування.
- `test:docker:all` один раз збирає живий Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-архів через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише раннером Node/Git для напрямків install/update/plugin-dependency; ці напрямки монтують попередньо зібраний архів. Функціональний образ встановлює той самий архів у `/app` для напрямків функціональності зібраного застосунку. Визначення Docker-напрямків зберігаються в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а ліміти ресурсів не дають важким live-, npm-install- і multi-service-напрямкам стартувати всім одночасно. Якщо один напрямок важчий за активні ліміти, планувальник усе одно може запустити його, коли пул порожній, і триматиме його єдиним запущеним, доки знову не з’явиться доступна місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. Ранер типово виконує Docker-попередню перевірку, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає часи успішних напрямків у `.artifacts/docker-tests/lane-timings.json` і використовує ці часи, щоб у наступних запусках першими стартували довші напрямки. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямків без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямків, потреб пакета/образу та облікових даних.
- `Package Acceptance` — це нативний для GitHub пакетний гейт для питання "чи працює цей інстальований архів як продукт?" Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-напрямки проти саме цього архіву замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені workflow/скрипти обв’язки, а `package_ref` вибирає вихідний коміт/гілку/тег для пакування, коли `source=ref`; це дає поточній логіці acceptance змогу перевіряти старіші довірені коміти. Профілі впорядковано за шириною охоплення: `smoke` — це швидкі install/channel/agent плюс gateway/config, `package` — контракт package/update/plugin плюс fixture keyless upgrade-survivor, напрямок published-baseline upgrade survivor і типова нативна заміна для більшості покриття Parallels package/update, `product` додає MCP-канали, очищення cron/subagent, вебпошук OpenAI і OpenWebUI, а `full` запускає Docker-фрагменти шляху релізу з OpenWebUI. Для `published-upgrade-survivor` Package Acceptance завжди використовує `package-under-test` як кандидата і `published_upgrade_survivor_baseline` як опублікований baseline, типово `openclaw@latest`; розбивайте ширше покриття на шарди, запускаючи кілька прогонів із точними baseline-значеннями. Опублікований напрямок налаштовує свій baseline за допомогою вбудованого рецепта команди `openclaw config set`, а потім записує кроки рецепта у зведення напрямку. Перевірка релізу запускає власну різницю пакета (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, бо Docker-фрагменти шляху релізу вже покривають суміжні напрямки package/update/plugin. Цільові команди GitHub Docker rerun, згенеровані з артефактів, містять попередній артефакт пакета, підготовлені вхідні дані образів і baseline published upgrade-survivor, якщо він доступний, щоб невдалі напрямки могли не перебудовувати пакет і образи.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захисна перевірка проходить статичним зібраним графом від `dist/entry.js` і `dist/cli/run-main.js` і завершується з помилкою, якщо старт перед dispatch імпортує залежності пакета, як-от Commander, prompt UI, undici або логування, до dispatch команди; вона також утримує зібраний gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих холодних gateway-шляхів. Смоук-тести упакованого CLI також покривають root help, onboard help, doctor help, status, config schema і команду списку моделей.
- Застаріла сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цього граничного значення обв’язка допускає лише прогалини метаданих у вже випущених пакетах: пропущені приватні записи QA inventory, відсутній `gateway install --wrapper`, відсутні patch-файли у git fixture, отриманому з архіву, відсутній збережений `update.channel`, застарілі розташування install-record для plugin, відсутня персистентність marketplace install-record і міграція метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Ранери контейнерних смоук-тестів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери живих моделей також bind-монтують лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у сховищі auth на хості:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Перевірка ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Перевірка бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Перевірка harness сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Перевірка спостережуваності: `pnpm qa:otel:smoke` — це приватна QA-смуга перевірки вихідного checkout. Вона навмисно не входить до Docker-смуг релізу пакета, тому що npm tarball не містить QA Lab.
- Жива перевірка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Перевірка npm tarball для onboarding/каналу/агента: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з посиланням на env і Telegram за замовчуванням, перевіряє, що doctor відновив активовані runtime-залежності plugin, і виконує один змодельований хід агента OpenAI. Повторно використайте попередньо зібраний tarball із `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості за допомогою `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Перевірка перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакета `stable` на git `dev`, перевіряє збережений канал і роботу plugin після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Перевірка збереження після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненого fixture старого користувача з агентами, конфігурацією каналу, allowlist plugin, застарілим станом runtime-deps plugin і наявними файлами workspace/session. Вона запускає оновлення пакета та неінтерактивний doctor без live-ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Перевірка збереження після оновлення з опублікованої версії: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює цю опубліковану інсталяцію до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, startup і бюджети status. Перевизначте baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`; Package Acceptance надає те саме значення як `published_upgrade_survivor_baseline`.
- Перевірка runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime-контексту та відновлення doctor для зачеплених дубльованих гілок prompt-rewrite.
- Перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використайте попередньо зібраний tarball із `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker-перевірка інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між root, update і direct-npm контейнерами. Перевірка оновлення за замовчуванням використовує npm `latest` як stable baseline перед оновленням до кандидатного tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root тримають ізольований npm cache, щоб записи cache, власником яких є root, не маскували поведінку встановлення в локальному середовищі користувача. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm за допомогою `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Перевірка CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого workspace. Повторно використайте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева перевірка Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Перевірка snapshot браузерного CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ і шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP охоплюють URL посилань, clickables, підвищені cursor, iframe refs і метадані frame.
- Регресія OpenAI Responses web_search з minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змодельований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово спричиняє reject схеми провайдера й перевіряє, що raw detail з’являється в логах Gateway.
- Міст MCP-каналів (засіяний Gateway + stdio bridge + raw перевірка notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi bundle (реальний stdio MCP server + вбудована перевірка allow/deny профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + демонтаж stdio MCP child після ізольованого cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Плагіни (перевірка встановлення, ClawHub kitchen-sink install/uninstall, оновлення marketplace та enable/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару package/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture-сервер ClawHub.
- Перевірка незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Перевірка метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованих plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker-образ runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використайте образ із `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегат і bundled-channel chunks release-path попередньо пакують цей tarball один раз, а потім розбивають перевірки вбудованих каналів на незалежні смуги, зокрема окремі смуги оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Release chunks розділяють перевірки каналів, цілі оновлення та setup/runtime-контракти на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; aggregate chunk `bundled-channels` лишається доступним для ручних повторних запусків. Release workflow також розділяє provider installer chunks і bundled plugin install/uninstall chunks; застарілі chunks `package-update`, `plugins-runtime` і `plugins-integrations` лишаються aggregate aliases для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Docker-запуски для окремих сценаріїв за замовчуванням мають `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; сценарій оновлення з кількома цілями за замовчуванням має `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Ця смуга також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують doctor/runtime-dependency repair.
- Звужуйте runtime-залежності вбудованих plugin під час ітерацій, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не локальний. Docker-тести QR та інсталятора зберігають власні Dockerfile, тому що вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Docker-ранери для живих моделей також монтують поточний checkout у режимі лише для читання і
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime-образ
компактним, водночас запускаючи Vitest на вашому точному локальному source/config.
Крок розгортання пропускає великі локальні кеші та вихідні артефакти збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків каталоги `.build` або
вихідні каталоги Gradle, щоб живі Docker-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб живі проби Gateway не запускали
реальні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити живе покриття Gateway
із цієї Docker-гілки.
`test:docker:openwebui` — це суміснісний smoke-тест вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP-ендпойнтами,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` expose-ить `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися витягнути
образ Open WebUI, а Open WebUI може знадобитися завершити власне холодне налаштування.
Ця гілка очікує придатний ключ живої моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Docker-запусках.
Успішні запуски друкують невелике JSON-навантаження на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує seeded-контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed discovery розмов, читання transcript, метадані вкладень,
поведінку live event queue, маршрутизацію outbound send і Claude-style channel +
permission notifications через справжній stdio MCP bridge. Перевірка сповіщень
інспектує сирі stdio MCP frames напряму, щоб smoke-тест валідував те, що
bridge фактично випромінює, а не лише те, що конкретний client SDK випадково показує.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує ключа живої
моделі. Він збирає Docker-образ репозиторію, запускає справжній stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа живої моделі.
Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і одноразовий дочірній turn `/subagents spawn`, а потім перевіряє,
що дочірній MCP-процес завершується після кожного запуску.

Ручний ACP smoke-тест потоків природною мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей script для regression/debug workflow. Він може знову знадобитися для ACP thread routing validation, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і source-иться перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, отриманих із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових config/workspace dirs і без зовнішніх CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для cached CLI installs усередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються read-only під `/host-auth...`, а потім копіюються в `/home/node/...` перед запуском tests
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider-запуски монтують лише потрібні dirs/files, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` для reruns, які не потребують rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` для гарантії, що creds надходять із profile store (а не env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, expose-нутої Gateway для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, який використовує Open WebUI smoke
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого тегу образу Open WebUI

## Перевірка коректності документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну валідацію anchors Mintlify, коли також потрібні перевірки in-page headings: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (CI-safe)

Це регресії “real pipeline” без реальних providers:

- Gateway tool calling (mock OpenAI, справжній gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, writes config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

Ми вже маємо кілька CI-safe tests, які поводяться як “agent reliability evals”:

- Mock tool-calling через справжній gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які валідують session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills перелічені в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає agent `SKILL.md` перед використанням і чи виконує required steps/args?
- **Workflow contracts:** multi-turn scenarios, які перевіряють tool order, session history carryover і sandbox boundaries.

Майбутні evals спершу мають залишатися детермінованими:

- Scenario runner із mock providers для перевірки tool calls + order, skill file reads і session wiring.
- Невеликий suite skill-focused scenarios (use vs avoid, gating, prompt injection).
- Необов’язкові live evals (opt-in, env-gated) лише після появи CI-safe suite.

## Contract tests (plugin and channel shape)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі знайдені plugins і запускають suite
assertions щодо shape and behavior. Стандартна unit-гілка `pnpm test` навмисно
пропускає ці shared seam і smoke files; запускайте contract commands явно,
коли торкаєтеся shared channel або provider surfaces.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Setup wizard contract
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

- **auth** - Auth flow contract
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання чи модифікації channel або provider plugin
- Після рефакторингу plugin registration або discovery

Contract tests запускаються в CI і не потребують реальних API keys.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену наживо:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або capture точного request-shape transformation)
- Якщо це за своєю природою live-only (rate limits, auth policies), залишайте live test вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну sampled target для кожного SecretRef class із registry metadata (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec ids відхиляються.
  - Якщо ви додаєте нову `includeInPlan` SecretRef target family у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно падає на unclassified target ids, щоб нові classes не могли бути тихо пропущені.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [CI](/uk/ci)
