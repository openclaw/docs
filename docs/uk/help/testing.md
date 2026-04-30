---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Комплект тестування: набори модульних, наскрізних і живих тестів, Docker-ранери й те, що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-30T23:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f663a4476a59e4ccc2a6ea5b43eb0079534945eac37374bec891d6cccb1e941c
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідка для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовують сценарії на основі репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідкових матеріалів.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл Vitest у режимі watch: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над окремою помилкою спершу віддавайте перевагу цільовим запускам.
- QA-сайт на Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + проби інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live-перевірка моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику пробу в стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують крихітний хід із зображенням.
    Вимкніть додаткові проби за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix-завдання, розбиті за провайдером.
  - Для сфокусованих повторних запусків CI dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і вкладення із зображенням
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness app-server Codex, яким володіє plugin,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує проби image,
    cron MCP, sub-agent і Guardian. Вимкніть пробу sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої
    app-server Codex. Для сфокусованої перевірки sub-agent вимкніть інші проби:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після проби sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders перевірка поверхні rescue-команди message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    запис конфігурації.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef записи,
    валідує конфігурацію та перевіряє audit-записи. Той самий шлях Ring 0 setup також
    покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у виділених workflow. `Parity gate` запускається на відповідних PR і
з ручного dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch із mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні завдання. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і ручне workflow input за замовчуванням залишаються
`all`; ручний dispatch може розбити `all` на `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед release approval, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
й уникали звичайного startup provider-plugin. Ці live transport Gateway вимикають
memory search; поведінка пам’яті лишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім витягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на основі репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого serial lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій падає. Використовуйте `--allow-failures`, коли
    потрібні артефакти без збійного exit code.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний AIMock-backed provider server для експериментального
    fixture і protocol-mock покриття без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведений CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як metrics
    без вигляду minutes-long gateway peg regression.
  - Використовує зібрані `dist` artifacts; спершу запустіть build, коли checkout ще не має
    свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині disposable Multipass Linux VM.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на host.
  - Повторно використовує ті самі прапорці вибору provider/model, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, практичні для guest:
    provider keys на основі env, шлях QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають лишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайні QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на Docker для operator-style QA роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime dependencies на
    вимогу, запускає doctor і виконує один local agent turn проти mocked OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім засіває affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
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
  - GitHub Actions відкриває цей lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також відкриває `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler із профілями lane smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Latest beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exact tarball URL proof requires a digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Доказ артефакта завантажує tarball-артефакт з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає неналаштовані runtime-залежності plugin
    відсутніми, перший налаштований запуск Gateway або doctor встановлює runtime-залежності кожного вбудованого
    plugin на вимогу, а другий перезапуск не перевстановлює залежності,
    які вже були активовані.
  - Також встановлює відому старішу npm-базу, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що doctor кандидата
    після оновлення відновлює runtime-залежності вбудованого каналу без
    postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає smoke-тест оновлення нативного packaged-install у гостях Parallels. Кожна
    вибрана платформа спершу встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тому самому гості та перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один хід локального агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному гості. Використовуйте `--json` для шляху до підсумкового артефакта та
    статусу кожної лінії.
  - Лінія OpenAI типово використовує `openai/gpt-5.5` для доказу живого agent-turn.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не могли
    витратити решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перевірте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витратити від 10 до 15 хвилин на post-update doctor/runtime
    відновлення залежностей на холодному гості; це все ще справний стан, коли вкладений
    npm debug log просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-лініями Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакета або стану guest gateway.
  - Доказ після оновлення запускає звичайну поверхню вбудованого plugin, тому що
    capability-фасади, такі як мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лінію Matrix проти одноразового Tuwunel homeserver на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA-лінію Telegram проти справжньої приватної групи з використанням токенів driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулованих облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пуловані leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли ви
    хочете отримати артефакти без коду виходу з помилкою.
  - Потребує двох окремих ботів в одній приватній групі, причому SUT bot має показувати Telegram username.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати груповий bot traffic.
  - Записує Telegram QA-звіт, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії відповідей містять RTT від запиту driver send до спостереженої відповіді SUT.

Live transport-лінії спільно використовують один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття для кожної лінії міститься в [огляді QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з пулу на базі Convex, надсилає Heartbeat
для цього lease, поки лінія працює, і звільняє lease під час завершення роботи.

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди maintainer (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без виведення
значень secrets. Використовуйте `--json` для машинно-читаного виводу в скриптах і CI
utilities.

Типовий endpoint contract (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Захист активного lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для Telegram kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє malformed payloads.

### Додавання каналу до QA

Архітектура та імена scenario-helper для нових channel adapters містяться в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і написати сценарії в `qa/scenarios/`.

## Тестові набори (що де запускається)

Думайте про набори як про “зростання реалістичності” (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують shard-набір `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Не потребує реальних ключів
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити broad `api.js` і
    fallback-поведінку `runtime-api.js` з generated tiny plugin fixtures, а не
    real bundled plugin source APIs. Real plugin API loads належать до
    plugin-owned contract/integration suites.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших shard-конфігів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує пікове RSS на завантажених машинах і запобігає тому, щоб робота auto-reply/extensions витісняла непов’язані набори тестів.
    - `pnpm test --watch` все ще використовує нативний кореневий граф проєктів `vitest.config.ts`, бо multi-shard цикл спостереження непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу маршрутизують явні цілі файлів/директорій через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні мапінги джерел і локальні залежні елементи import-графа. Зміни config/setup/package не запускають широкі набори тестів, якщо явно не використати `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового доказу викличте `pnpm test:changed` або явний `pnpm test <target>`. Підняття версій лише для release metadata запускає цільові перевірки version/config/root-dependency, із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell-синтаксис для live Docker auth-скриптів і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependency, export, version та іншої package-поверхні все ще використовують ширші guards.
    - Import-light unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих utility-зон маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані допоміжні вихідні файли `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих легких lanes, тож зміни helpers уникають повторного запуску всього важкого набору для цієї директорії.
    - `auto-reply` має окремі buckets для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє reply-піддерево на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім Node-хвостом.
    - Звичайний PR/main CI навмисно пропускає batch sweep extensions і release-only shard `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте вхідні дані message-tool discovery або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для меж чистої маршрутизації та нормалізації.
    - Підтримуйте здоровими інтеграційні набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction все ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helpers
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базовий конфіг Vitest за замовчуванням використовує `threads`.
    - Спільний конфіг Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e і live-конфігах.
    - Кореневий UI lane зберігає свої `jsdom` setup і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі defaults `threads` + `isolate: false`
      зі спільного конфіга Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити V8 compile churn під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед handoff або push, коли вам
      потрібен розумний локальний check gate.
    - `pnpm test:changed` за замовчуванням маршрутизується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Локальне автоскейлення workers навмисно консервативне й відступає,
      коли load average хоста вже високий, тож кілька паралельних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базовий конфіг Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб reruns у changed-mode залишалися коректними, коли змінюється
      тестова проводка.
    - Конфіг тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну локацію cache для прямого profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами,
      зміненими від `origin/main`.
    - Дані shard timing записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всього конфіга використовують шлях конфіга як ключ; include-pattern CI
      shards додають назву shard, щоб відфільтровані shards можна було відстежувати
      окремо.
    - Коли один гарячий тест все ще витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузькою локальною межею `*.runtime.ts` і
      мокайте цю межу напряму замість deep-importing runtime helpers лише
      для передачі їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом кореневого проєкту для цього закоміченого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      брудне дерево, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневий конфіг Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit-набору з вимкненою файловою паралельністю.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфіг: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway із diagnostics, увімкненими за замовчуванням
  - Проганяє синтетичне навантаження gateway message, memory і large-payload churn через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers персистентності diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS samples лишаються нижче pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечний для CI і не потребує ключів
  - Вузький lane для follow-up stability-regression, а не заміна повного набору Gateway

### E2E (димовий тест Gateway)

- Команда: `pnpm test:e2e`
- Конфіг: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin під `extensions/`
- Runtime defaults:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням запускається в silent mode, щоб зменшити overhead console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового worker count (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Область:
  - End-to-end поведінка multi-instance gateway
  - WebSocket/HTTP поверхні, node pairing і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільнішим)

### E2E: димовий тест бекенду OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Тестує бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує test gateway і sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфіг: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin під `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - “Чи цей provider/model справді працює _сьогодні_ з реальними creds?”
  - Виявляє зміни форматів provider, особливості tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені піднабори замість “усього”
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували вашу реальну home directory.
- `pnpm test:live` тепер за замовчуванням працює тихіше: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає gateway bootstrap logs/Bonjour chatter. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API keys (специфічно для provider): установіть `*_API_KEYS` у форматі comma/semicolon або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу на rate limit responses.
- Вивід progress/heartbeat:
  - Live-набори тепер виводять progress lines у stderr, щоб довгі provider calls були видимо активними навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб provider/gateway progress lines стрімилися негайно під час live-запусків.
  - Налаштовуйте direct-model heartbeats через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте gateway/probe heartbeats через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір слід запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в мережевій частині Gateway / протоколі WS / сполученні: додайте `pnpm test:e2e`
- Налагодження “мій бот не працює” / збоїв, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Живі тести (що звертаються до мережі)

Про живу матрицю моделей, швидкі перевірки бекенду CLI, швидкі перевірки ACP, тестовий
контур сервера застосунку Codex і всі живі тести медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, медіаконтур), а також про обробку облікових даних для живих запусків див.
[Тестування — живі набори](/uk/help/testing-live).

## Docker-запускачі (необов’язкові перевірки "працює в Linux")

Ці Docker-запускачі поділяються на дві групи:

- Запускачі живих моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний живий файл ключа профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочий простір (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Живі Docker-запускачі за замовчуванням мають меншу межу для швидких перевірок, щоб повний Docker-прохід залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли ви
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає живий Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-архів tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/перевикористовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише Node/Git-запускачем для напрямків встановлення/оновлення/залежностей Plugin; ці напрямки монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для напрямків функціональності зібраного застосунку. Визначення Docker-напрямків містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегований запуск використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким живим, npm-встановлювальним і багатосервісним напрямкам стартувати всім одночасно. Якщо один напрямок важчий за активні обмеження, планувальник все одно може запустити його, коли пул порожній, а потім тримає його як єдиний запущений, доки знову не з’явиться місткість. Значення за замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. Запускач за замовчуванням виконує попередню перевірку Docker, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає часи успішних напрямків у `.artifacts/docker-tests/lane-timings.json` і використовує ці часи, щоб у подальших запусках спершу стартували довші напрямки. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямків без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямків, потреб пакета/образу та облікових даних.
- `Package Acceptance` — це нативний для GitHub шлюз пакета для запитання "чи працює цей встановлюваний tarball як продукт?" Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-напрямки проти саме цього tarball замість повторного пакування вибраного посилання. `workflow_ref` вибирає довірені скрипти workflow/тестового контуру, а `package_ref` вибирає вихідний коміт/гілку/тег для пакування, коли `source=ref`; це дає поточній логіці приймання змогу перевіряти старіші довірені коміти. Профілі впорядковано за широтою: `smoke` — це швидке встановлення/канал/агент плюс Gateway/конфігурація, `package` — це контракт пакета/оновлення/Plugin плюс фікстура keyless upgrade-survivor, напрямок published-baseline upgrade survivor і стандартна нативна заміна для більшої частини покриття пакета/оновлення в Parallels, `product` додає MCP-канали, очищення cron/субагентів, вебпошук OpenAI і OpenWebUI, а `full` запускає Docker-фрагменти шляху релізу з OpenWebUI. Перевірка релізу запускає власну дельту пакета (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, тому що Docker-фрагменти шляху релізу вже покривають напрямки пакета/оновлення/Plugin, що перетинаються. Цільові команди повторного запуску Docker у GitHub, згенеровані з артефактів, за наявності включають попередній артефакт пакета та підготовлені вхідні дані образів, щоб невдалі напрямки могли уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо старт до диспетчеризації імпортує залежності пакета, як-от Commander, інтерфейс підказок, undici або логування, до диспетчеризації команди; він також утримує зібраний фрагмент запуску Gateway в межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Швидка перевірка запакованого CLI також покриває кореневу довідку, довідку onboard, довідку doctor, статус, схему конфігурації та команду списку моделей.
- Сумісність із застарілими версіями в Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі тестовий контур терпить лише прогалини метаданих відвантаженого пакета: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, застарілі розташування записів встановлення Plugin, відсутнє збереження записів встановлення marketplace і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Запускачі швидких перевірок контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-запускачі живих моделей також монтують лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` — це приватна QA-лінія для перевірки source checkout. Її навмисно не включено до Docker-ліній випуску пакетів, оскільки npm tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне створення scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований OpenClaw tarball у Docker, налаштовує OpenAI через onboarding з env-ref і типово Telegram, перевіряє, що doctor repairs активували runtime deps Plugin, і запускає один змокований хід агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` глобально встановлює запакований OpenClaw tarball у Docker, перемикає з package `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикає назад на package `stable` і перевіряє статус оновлення.
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` встановлює запакований OpenClaw tarball поверх забрудненого fixture старого користувача з агентами, конфігурацією каналів, allowlists Plugin, застарілим станом runtime-deps Plugin і наявними файлами workspace/session. Він запускає оновлення пакета та неінтерактивний doctor без live provider або ключів каналів, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest` поверх того самого забрудненого fixture старого користувача, оновлює це опубліковане встановлення до candidate tarball, запускає неінтерактивний doctor, потім запускає loopback Gateway і перевіряє те саме збереження config/state, а також бюджети startup/status. Перевизначте baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime context, а також doctor repair для зачеплених дубльованих гілок prompt-rewrite.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache для своїх root, update і direct-npm containers. Update smoke типово використовує npm `latest` як stable baseline перед оновленням до candidate tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Non-root installer checks зберігають ізольований npm cache, щоб записи cache, власником яких є root, не маскували поведінку user-local install. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття direct `npm install -g`.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ root Dockerfile, створює два агенти з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON та поведінку зі збереженим workspace. Повторно використайте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image разом із шаром Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення provider schema і перевіряє, що raw detail з’являється в логах Gateway.
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + вбудований Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (реальний Gateway + teardown stdio MCP child після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, ClawHub kitchen-sink install/uninstall, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture-сервер ClawHub.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Bundled plugin runtime deps: `pnpm test:docker:bundled-channel-deps` типово збирає малий Docker runner image, один раз збирає та пакує OpenClaw на хості, потім монтує цей tarball у кожен сценарій Linux install. Повторно використайте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть host rebuild після свіжого локального build через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate і release-path bundled-channel chunks один раз попередньо пакують цей tarball, потім ділять bundled channel checks на незалежні лінії, включно з окремими update lanes для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Release chunks розділяють channel smokes, update targets і setup/runtime contracts на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; aggregate chunk `bundled-channels` залишається доступним для ручних повторних запусків. Release workflow також розділяє provider installer chunks і bundled plugin install/uninstall chunks; legacy chunks `package-update`, `plugins-runtime` і `plugins-integrations` залишаються aggregate aliases для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити channel matrix під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити update scenario. Per-scenario Docker runs типово мають `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; multi-target update scenario типово має `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують repair для doctor/runtime-dependency.
- Звужуйте bundled plugin runtime deps під час ітерацій, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific image overrides, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` указує на віддалений shared image, скрипти завантажують його, якщо його ще немає локально. Тести QR і installer Docker зберігають власні Dockerfiles, оскільки вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Ранери Docker для live-моделей також монтують поточний checkout лише для читання та
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime-образ
легким, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок розгортання пропускає великі локальні кеші та вихідні дані збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків `.build` або
каталоги вихідних даних Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-зонди Gateway не запускали
справжні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож передавайте також
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття Gateway
з цієї Docker-доріжки.
`test:docker:openwebui` — це суміснісний smoke-тест вищого рівня: він запускає контейнер
Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP-ендпоінтами,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
справжній chat-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися стягнути
образ Open WebUI, а Open WebUI може знадобитися завершити власне налаштування холодного старту.
Ця доріжка очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
справжнього облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed виявлення розмов, читання transcript, метадані attachment,
поведінку live event queue, маршрутизацію outbound send, а також channel +
permission-сповіщення у стилі Claude через справжній stdio MCP bridge. Перевірка сповіщень
інспектує сирі stdio MCP frames напряму, щоб smoke-тест валідовував те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live-ключа
моделі. Він збирає Docker-образ repo, запускає справжній stdio MCP probe server
усередині контейнера, materializes цей server через вбудований Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live-ключа моделі.
Він запускає засіяний Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і одноразовий child turn `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke-тест plain-language thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для валідації маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується до `/home/node/.profile` і source-иться перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, source-нутих із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових каталогів config/workspace і без зовнішніх монтувань CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider-запуски монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб гарантувати, що creds надходять зі сховища profile (а не env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку Gateway надає для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого tag образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагувань docs: `pnpm check:docs`.
Запускайте повну валідацію anchors Mintlify, коли також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (CI-safe)

Це регресії “справжнього pipeline” без справжніх providers:

- Gateway tool calling (mock OpenAI, справжній gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Agent reliability evals (skills)

У нас уже є кілька CI-safe тестів, які поводяться як “agent reliability evals”:

- Mock tool-calling через справжній gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які валідовують session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого досі бракує для skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли skills перелічені в prompt, чи agent вибирає правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи agent читає `SKILL.md` перед використанням і виконує потрібні кроки/args?
- **Контракти workflow:** multi-turn сценарії, які перевіряють порядок tool, перенесення session history і межі sandbox.

Майбутні evals мають передусім залишатися детермінованими:

- Scenario runner із mock providers для перевірки tool calls + order, читання skill-файлів і session wiring.
- Невеликий набір skill-focused сценаріїв (use vs avoid, gating, prompt injection).
- Опційні live evals (opt-in, env-gated) лише після появи CI-safe набору.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі виявлені plugins і запускають набір
shape та behavior assertions. Стандартна unit-доріжка `pnpm test` навмисно
пропускає ці спільні seam і smoke-файли; запускайте contract-команди явно,
коли торкаєтеся спільних channel або provider surfaces.

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
- **inbound** - Обробка inbound messages
- **actions** - Channel action handlers
- **threading** - Обробка Thread ID
- **directory** - API directory/roster
- **group-policy** - Застосування group policy

### Provider status contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма Plugin registry

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт auth flow
- **auth-choice** - Вибір auth/selection
- **catalog** - API model catalog
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Форма/interface Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни exports або subpaths plugin-sdk
- Після додавання або модифікації channel чи provider plugin
- Після рефакторингу реєстрації або discovery plugin

Контрактні тести запускаються в CI і не потребують справжніх API keys.

## Додавання регресій (настанови)

Коли ви виправляєте provider/model issue, виявлену в live:

- Додайте CI-safe регресію, якщо можливо (mock/stub provider або захопіть точну трансформацію request-shape)
- Якщо це за своєю суттю лише live-only (rate limits, auth policies), тримайте live test вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить один sampled target на клас SecretRef із registry metadata (`listSecretTargetRegistryEntries()`), а потім перевіряє, що traversal-segment exec ids відхиляються.
  - Якщо додаєте нову сім'ю target `includeInPlan` SecretRef у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [CI](/uk/ci)
