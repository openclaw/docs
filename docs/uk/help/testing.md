---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження Gateway + поведінки агента
summary: 'Набір для тестування: набори тестів unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-29T05:57:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b06c2e7905ca930f0cac92d43c5902d38b9513968a68d2077ff4ef7a5a345ce
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він свідомо _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, під час налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовується сценаріями на базі репозиторію.

Ця сторінка описує запуск звичайних тестових наборів і Docker/Parallels-ранерів. Розділ нижче, присвячений QA-специфічним ранерам ([QA-специфічні ранери](#qa-specific-runners)), перелічує конкретні виклики `qa` і посилається назад на наведені вище довідники.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над одним збоєм спочатку віддавайте перевагу цільовим запускам.
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- E2E-набір: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний image-хід.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розбиті за провайдерами.
  - Для сфокусованих повторних запусків CI dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal provider secrets до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через Codex app-server harness, яким володіє plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probes. Вимкніть sub-agent probe за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої sub-agent перевірки вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders перевірка для поверхні rescue command каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу persistent model
    change, відповідає `/crestodian yes` і перевіряє шлях audit/config write.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    перевіряє конфігурацію та audit entries. Той самий шлях Ring 0 setup також
    покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: із встановленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  assistant transcript зберігає нормалізоване `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч з основними тестовими наборами, коли потрібен реалізм QA-lab:

CI запускає QA Lab у виділених workflow. `Parity gate` запускається на відповідних PR і
з manual dispatch із mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і з manual dispatch з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
parallel jobs. Scheduled QA і release checks передають Matrix `--profile fast`
явно, тоді як Matrix CLI і manual workflow input default залишаються
`all`; manual dispatch може розбити `all` на `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед release approval, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони лишалися детермінованими
і уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; поведінка пам’яті лишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім тягнуть його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторного збирання
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає repo-backed QA scenarios безпосередньо на хості.
  - Запускає кілька вибраних scenarios паралельно за замовчуванням з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних scenarios). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого serial lane.
  - Завершується з ненульовим кодом, коли будь-який scenario зазнає невдачі. Використовуйте `--allow-failures`, коли
    потрібні артефакти без failing exit code.
  - Підтримує provider modes `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний AIMock-backed provider server для експериментального
    fixture і protocol-mock coverage без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише sustained hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як metrics
    без вигляду minutes-long gateway peg regression.
  - Використовує зібрані `dist` artifacts; спочатку запустіть build, коли checkout не
    має свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Multipass Linux VM.
  - Зберігає ту саму поведінку scenario-selection, що й `qa suite` на хості.
  - Повторно використовує ті самі provider/model selection flags, що й `qa suite`.
  - Live-запуски пересилають підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають лишатися в межах кореня репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один локальний agent turn проти mocked OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім сіє affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions надає цей lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  existing Docker E2E scheduler зі smoke, package, product, full або custom
  lane profiles. Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
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

- Доказ артефакту завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/Plugin через зміни
    конфігурації.
  - Перевіряє, що виявлення налаштування залишає відсутніми неналаштовані runtime-залежності Plugin, перший налаштований запуск Gateway або doctor встановлює runtime-залежності кожного вбудованого
    Plugin на вимогу, а другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата відновлює runtime-залежності вбудованого каналу без
    postinstall-відновлення на стороні harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення packaged-install у гостях Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тому самому гості та перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій з одним гостем. Використовуйте `--json` для шляху до підсумкового артефакту та
    статусу по кожній лінії.
  - Лінія OpenAI типово використовує `openai/gpt-5.5` для live-доказу ходу агента. Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в timeout хоста, щоб зависання транспорту Parallels не
    використали решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витратити 10-15 хвилин на post-update doctor/runtime
    відновлення залежностей на холодному гості; це все ще нормальний стан, якщо вкладений
    debug-журнал npm просувається.
  - Не запускайте цю агрегатну обгортку паралельно з окремими smoke-лініями Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакета або стану Gateway у гості.
  - Post-update-доказ запускає звичайну поверхню вбудованого Plugin, оскільки
    фасади можливостей, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-лінію QA Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live-лінію QA Telegram проти справжньої приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних pooled credentials. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних bot в одній приватній групі, причому SUT bot має надавати username Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати груповий bot traffic.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії відповідей містять RTT від запиту надсилання driver до спостереженої відповіді SUT.

Live transport lines мають спільний стандартний контракт, щоб нові транспорти не відхилялися; матриця покриття по кожній лінії міститься в [Огляд QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і він не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивну lease зі спільного пулу на базі Convex, надсилає Heartbeat
для цієї lease, поки лінія виконується, і звільняє lease під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex для суто локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайній роботі має використовувати `https://`.

Admin-команди maintainer (додати/видалити/перелічити пул) вимагають
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
префікс endpoint, HTTP timeout і доступність admin/list без друку
secret values. Використовуйте `--json` для машинно-читаного виводу в скриптах і CI
utilities.

Типовий контракт endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Вичерпано/retryable: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
  - Захист активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком chat id Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payloads.

### Додавання каналу до QA

Архітектура та імена scenario-helper для нових адаптерів каналів описані в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання flaky/cost):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують shard set `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit tests
  - In-process integration tests (автентифікація Gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих bugs
- Очікування:
  - Запускається в CI
  - Не потребує справжніх ключів
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` з generated tiny plugin fixtures, а не
    реальними bundled plugin source APIs. Реальні завантаження plugin API належать до
    contract/integration suites, власником яких є Plugin.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати ресурси для непов’язаних наборів тестів.
    - `pnpm test --watch` і далі використовує нативний кореневий граф проєкту `vitest.config.ts`, бо цикл спостереження з кількома шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через обмежені за областю доріжки, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної стартової вартості кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві обмежені за областю доріжки: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні елементи графа імпортів. Зміни config/setup/package не запускають тести широко, якщо явно не використати `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний контрольний gate для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, застосунки, docs, метадані release, інструменти live Docker і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Зміни версій лише в метаданих release запускають цільові перевірки версії/config/кореневих залежностей із guard, який відхиляє зміни package за межами поля версії верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell-синтаксис для скриптів live Docker auth і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, експорту, версії та інших поверхонь package і далі використовують ширші guards.
    - Легкі щодо імпортів unit-тести з agents, commands, plugins, допоміжних засобів auto-reply, `plugin-sdk` і подібних ділянок чистих утиліт проходять через доріжку `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом або важкі щодо runtime залишаються на наявних доріжках.
    - Вибрані вихідні файли допоміжних засобів `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких доріжках, тож зміни допоміжних засобів уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має окремі групи для високорівневих допоміжних засобів core, високорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб одна група, важка щодо імпортів, не займала весь Node-хвіст.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep extension і shard `agentic-plugins`, призначений лише для release. Full Release Validation запускає дочірній CI з `full_release_validation=true`, що знову вмикає ці важкі щодо plugin/extension набори для кандидатів у release.

  </Accordion>

  <Accordion title="Покриття вбудованого runner">

    - Коли змінюєте вхідні дані виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресійні перевірки допоміжних засобів для чистих меж
      маршрутизації та нормалізації.
    - Підтримуйте справність інтеграційних наборів вбудованого runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише допоміжних засобів
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові значення pool та ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Коренева UI-доріжка зберігає свій setup і optimizer `jsdom`, але також працює
      на спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні доріжки активує diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staged
      і не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед передаванням роботи або push, коли вам
      потрібен розумний локальний контрольний gate.
    - `pnpm test:changed` типово проходить через дешеві обмежені за областю доріжки. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішить, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим обмеженням worker.
    - Локальне автомасштабування worker навмисно консервативне й відступає,
      коли середнє навантаження host уже високе, тому кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/config-файли як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється
      підключення тестів.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів, а також
      вивід розбивки імпортів.
    - `pnpm test:perf:imports:changed` обмежує той самий профільний перегляд
      файлами, зміненими від `origin/main`.
    - Дані часу шардів записуються до `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; CI-шарди
      з include-патернами додають назву шарда, щоб відфільтровані шарди можна було
      відстежувати окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      мокайте цей шов напряму, замість глибоко імпортувати runtime-хелпери лише
      для того, щоб пропустити їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом кореневого проєкту для цього закоміченого
      diff і виводить wall time, а також macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      брудне дерево, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для
      накладних витрат запуску та трансформацій Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap-профілі runner для
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає справжній loopback Gateway із діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичний gateway-повідомлення, пам'ять і churn великих payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває хелпери збереження пакета діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS-семпли лишаються нижче бюджету тиску, а глибини черг для кожної сесії знову спадають до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька лінія для подальшої роботи над регресіями стабільності, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Runtime-типові значення:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного виводу консолі.
- Область:
  - Наскрізна поведінка gateway з кількома інстансами
  - WebSocket/HTTP-поверхні, pairing Node і важча мережева взаємодія
- Очікування:
  - Працює в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: smoke бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через справжній `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального `openshell` CLI і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI-бінарника або wrapper-скрипта

### Live (реальні providers + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - “Чи цей provider/model справді працює _сьогодні_ з реальними creds?”
  - Ловить зміни форматів provider, особливості tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики provider, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Надавайте перевагу запуску звужених піднаборів замість “усього”
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють config/auth-матеріали в тимчасовий тестовий home, щоб unit-fixtures не могли змінити ваш справжній `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш справжній домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює тихіше: він залишає progress-вивід `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і mute-ить логи bootstrap Gateway/Bonjour chatter. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API-ключів (provider-specific): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби на відповідях rate limit.
- Вивід progress/heartbeat:
  - Live-набори тепер виводять progress-рядки до stderr, щоб довгі provider-виклики були видимо активними навіть тоді, коли capture консолі Vitest тихий.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб progress-рядки provider/gateway стрімилися негайно під час live-запусків.
  - Налаштовуйте Heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в мережевій частині Gateway / WS-протоколі / сполученні: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / збоїв, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Про live-матрицю моделей, smoke-тести бекенда CLI, smoke-тести ACP, тестовий
harness сервера застосунку Codex і всі live-тести медіапровайдерів (Deepgram,
BytePlus, ComfyUI, зображення, музика, відео, медіа-harness) — а також обробку
облікових даних для live-запусків — дивіться в
[Тестування — live-набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл ключа профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням використовують меншу межу smoke-перевірок, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне ширше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ — це лише Node/Git-ранер для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегований запуск використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як обмеження ресурсів не дають важким live-, npm-install- і multi-service-напрямам стартувати одночасно. Якщо окремий напрям важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, а потім тримає його єдиним запущеним, доки знову не з’явиться місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Ранер за замовчуванням виконує Docker-перевірку preflight, видаляє застарілі E2E-контейнери OpenClaw, друкує статус кожні 30 секунд, зберігає часи успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці часи, щоб у наступних запусках спершу стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб пакета/образу та облікових даних.
- `Package Acceptance` — це нативний для GitHub пакетний gate для питання «чи працює цей installable tarball як продукт?» Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-напрями проти саме цього tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені workflow/harness-скрипти, тоді як `package_ref` вибирає коміт/гілку/тег джерела для пакування, коли `source=ref`; це дає змогу поточній логіці acceptance перевіряти старіші довірені коміти. Профілі впорядковано за широтою: `smoke` — швидкі install/channel/agent плюс gateway/config, `package` — контракт package/update/plugin і типовий нативний замінник більшості покриття Parallels для package/update, `product` додає MCP-канали, очищення cron/subagent, вебпошук OpenAI і OpenWebUI, а `full` запускає Docker-фрагменти release-path з OpenWebUI. Перевірка релізу запускає користувацьку дельту пакета (`bundled-channel-deps-compat plugins-offline`) плюс QA пакета Telegram, бо Docker-фрагменти release-path уже покривають перетинні напрями package/update/plugin. Цільові команди повторного запуску GitHub Docker, згенеровані з артефактів, містять попередній артефакт пакета та підготовлені вхідні дані образів, коли вони доступні, тож невдалі напрями можуть уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф із `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо запуск до диспетчеризації команд імпортує пакетні залежності, як-от Commander, prompt UI, undici або логування, до диспетчеризації команди; він також утримує зібраний gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Smoke-перевірка упакованого CLI також покриває кореневу довідку, довідку onboard, довідку doctor, status, схему config і команду списку моделей.
- Сумісність Package Acceptance зі спадковими версіями обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness терпить лише прогалини метаданих відвантаженого пакета: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, спадкові розташування install-record Plugin, відсутнє збереження marketplace install-record і міграцію метаданих config під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-mount-ять лише потрібні домівки CLI-автентифікації (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домівку контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без мутації сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` є приватною QA-гілкою перевірки source-checkout. Вона навмисно не входить до Docker-гілок випуску пакета, тому що npm tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер початкового налаштування (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований OpenClaw tarball у Docker, налаштовує OpenAI через env-ref onboarding плюс Telegram за замовчуванням, перевіряє, що doctor відновлює активовані runtime-залежності Plugin, і запускає один змокований хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` глобально встановлює запакований OpenClaw tarball у Docker, перемикається з пакетного `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на пакетний `stable` і перевіряє статус оновлення.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту в транскрипті плюс doctor-відновлення зачеплених дубльованих гілок prompt-rewrite.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш між своїми root, update і direct-npm контейнерами. Update smoke за замовчуванням використовує npm `latest` як стабільний baseline перед оновленням до кандидатного tarball. Перевизначайте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` локально або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки встановлювача без root зберігають ізольований npm-кеш, щоб записи кешу, що належать root, не маскували поведінку локального для користувача встановлення. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає кореневий образ Dockerfile, засіває двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереження workspace. Повторно використовуйте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshot-и CDP-ролей охоплюють URL посилань, clickables, підвищені з курсора, iframe refs і метадані frame.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово спричиняє reject схеми провайдера й перевіряє, що raw detail з’являється в логах Gateway.
- MCP channel bridge (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (реальний Gateway + stdio MCP child teardown після ізольованого cron і одноразових subagent-запусків): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Плагіни (install smoke, ClawHub kitchen-sink install/uninstall, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Встановіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture-сервер ClawHub.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий образ Docker runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate і release-path bundled-channel chunks попередньо пакують цей tarball один раз, а потім шардують перевірки bundled channel в незалежні гілки, включно з окремими update lanes для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Release chunks розділяють channel smokes, update targets і setup/runtime contracts на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; aggregate chunk `bundled-channels` залишається доступним для ручних повторних запусків. Release workflow також розділяє provider installer chunks і bundled plugin install/uninstall chunks; застарілі chunks `package-update`, `plugins-runtime` і `plugins-integrations` залишаються aggregate aliases для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити channel matrix під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити update scenario. Docker-запуски для окремих сценаріїв за замовчуванням мають `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; multi-target update scenario за замовчуванням має `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують doctor/runtime-dependency repair.
- Звужуйте bundled plugin runtime deps під час ітерацій, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для конкретних suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають перевагу, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти pull-ять його, якщо він ще не локальний. QR і Docker-тести встановлювача зберігають власні Dockerfile, тому що вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Live-model Docker runners також bind-mount-ять поточний checkout лише для читання і
стейджать його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно запускає Vitest проти вашого точного локального source/config.
Крок staging пропускає великі локальні кеші та build outputs застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку `.build` або
каталоги виводу Gradle, щоб Docker live runs не витрачали хвилини на копіювання
машинно-специфічних artifacts.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальних Telegram/Discord/тощо channel workers усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage із цієї Docker lane.
`test:docker:openwebui` є compatibility smoke вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP endpoints, сумісними з OpenAI,
запускає pinned Open WebUI container проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` expose-ить `openclaw/default`, потім надсилає
реальний chat request через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, бо Docker може потребувати pull
образу Open WebUI, а Open WebUI може потребувати завершення власного cold-start setup.
Ця lane очікує придатний live model key, і `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який spawn-ить `openclaw mcp serve`, потім
перевіряє routed conversation discovery, transcript reads, attachment metadata,
live event queue behavior, outbound send routing і Claude-style channel +
permission notifications через реальний stdio MCP bridge. Notification check
напряму інспектує raw stdio MCP frames, щоб smoke перевіряв те, що
bridge фактично emits, а не лише те, що випадково surface-ить конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає repo Docker image, запускає реальний stdio MCP probe server
усередині контейнера, materializes цей сервер через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway з реальним stdio MCP probe server, виконує
ізольований cron turn і одноразовий child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Залиште цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації потоків ACP, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і завантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, завантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочої області та без монтування зовнішньої автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI у Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдера монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне повторне збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілів (а не зі змінних середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити запит перевірки nonce, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити зафіксований тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклики інструментів Gateway (імітація OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + примусово застосовує автентифікацію): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Імітація виклику інструментів через реальний Gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють підключення сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли skills перелічені в запиті, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти робочих процесів:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі пісочниці.

Майбутні оцінювання мають спершу залишатися детермінованими:

- Виконувач сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання файлів skills і підключення сесії.
- Невеликий набір сценаріїв, зосереджених на skills (використання проти уникнення, gating, інʼєкція запиту).
- Необовʼязкові live-оцінювання (за явним увімкненням, керовані змінними середовища) лише після появи безпечного для CI набору.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
інтерфейсному контракту. Вони проходять по всіх виявлених plugins і запускають набір
перевірок форми та поведінки. Типова unit-доріжка `pnpm test` навмисно
пропускає ці спільні файли seam і smoke; запускайте контрактні команди явно,
коли змінюєте спільні поверхні channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка привʼязки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID потоку
- **directory** - API каталогу/списку учасників
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Проби статусу channel
- **registry** - Форма реєстру Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену наживо:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub provider або зафіксуйте точне перетворення форми запиту)
- Якщо це за своєю суттю лише live-випадок (обмеження частоти, політики автентифікації), залиште live-тест вузьким і вмикайте його явно через змінні середовища
- Віддавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/відтворення запиту provider → прямий тест моделей
  - помилка конвеєра сесії/історії/інструментів Gateway → live smoke Gateway або безпечний для CI mock-тест Gateway
- Запобіжник обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із сегментами обходу відхиляються.
  - Якщо ви додаєте нову сімʼю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було мовчки пропустити.

## Повʼязане

- [Тестування наживо](/uk/help/testing-live)
- [CI](/uk/ci)
