---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і що перевіряє кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-28T23:48:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c1fdadf65674bb5ce6a9503fbb7f92cc05a9a7e89557367a73469417c44b5f
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-засобів запуску. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live-лінії транспорту)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [Канал QA](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовують сценарії з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-засобів запуску. Розділ про спеціальні засоби запуску QA нижче ([Спеціальні засоби запуску QA](#qa-specific-runners)) перелічує конкретні виклики `qa` і посилається назад на наведені вище довідники.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Надавайте перевагу таргетованим запускам, коли ітеруєте над окремою помилкою.
- Docker-підкріплений QA-сайт: `pnpm qa:lab:up`
- QA-лінія на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Коли налагоджуєте реальних провайдерів/моделі (потрібні справжні облікові дані):

- Live-набір (моделі + gateway-перевірки інструментів/зображень): `pnpm test:live`
- Тихо таргетувати один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live-перебір моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn плюс невелику перевірку в стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують маленький turn із зображенням.
    Вимикайте додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розбиті за провайдерами.
  - Для сфокусованих повторних запусків CI dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-лінію проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає agent turns Gateway через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимикайте sub-agent probe через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не задано
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова подвійна перевірка поверхні команди порятунку message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    валідує конфігурацію та перевіряє audit entries. Та саму Ring 0 setup path
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: із заданим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один failing case, надавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## Спеціальні засоби запуску QA

Ці команди розташовані поруч з основними наборами тестів, коли потрібен реалізм QA-lab:

CI запускає QA Lab у dedicated workflows. `Parity gate` запускається на відповідних PR і
через manual dispatch з mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і через manual dispatch з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
parallel jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і default ручного workflow input залишаються
`all`; manual dispatch може розбити `all` на `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед release approval.

- `pnpm openclaw qa suite`
  - Запускає repo-backed QA scenarios безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість
    workers, або `--concurrency 1` для старішої serial lane.
  - Завершується з non-zero, якщо будь-який сценарій падає. Використовуйте `--allow-failures`, коли
    хочете артефакти без failing exit code.
  - Підтримує provider modes `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає local AIMock-backed provider server для experimental
    fixture і protocol-mock coverage без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує combined CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише sustained hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як metrics
    і не виглядають як minutes-long gateway peg regression.
  - Використовує зібрані `dist` artifacts; спершу запустіть build, якщо checkout ще не
    має свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині disposable Multipass Linux VM.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
  - Повторно використовує ті самі provider/model selection flags, що й `qa suite`.
  - Live-запуски forward supported QA auth inputs, практичні для guest:
    env-based provider keys, QA live provider config path і `CODEX_HOME`,
    коли присутній.
  - Output dirs мають залишатися під repo root, щоб guest міг записувати назад через
    mounted workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Створює npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що enabling plugin встановлює runtime dependencies on
    demand, запускає doctor і виконує один local agent turn проти mocked OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у visible user turn,
    потім seed affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch з backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions exposes this lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також exposes `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL plus SHA-256 або tarball artifact з іншого run, uploads
  normalized `openclaw-current.tgz` як `package-under-test`, потім запускає
  existing Docker E2E scheduler зі smoke, package, product, full або custom
  lane profiles. Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
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

- Artifact proof downloads a tarball artifact from another Actions run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує й установлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудований канал/plugins через
    зміни конфігурації.
  - Перевіряє, що виявлення налаштування залишає відсутніми неналаштовані
    runtime-залежності plugin, що перший налаштований запуск Gateway або doctor
    установлює runtime-залежності кожного вбудованого plugin на вимогу, а
    другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також установлює відому старішу базову npm-версію, вмикає Telegram перед
    запуском `openclaw update --tag <candidate>` і перевіряє, що post-update
    doctor кандидата відновлює runtime-залежності вбудованого каналу без
    postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає smoke-тест оновлення нативної packaged-install інсталяції в гостях
    Parallels. Кожна вибрана платформа спершу встановлює запитаний базовий
    пакет, потім запускає встановлену команду `openclaw update` у тому самому
    гості й перевіряє встановлену версію, статус оновлення, готовність gateway
    і один хід локального агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`
    під час ітерацій на одному гості. Використовуйте `--json` для шляху до
    артефакту підсумку й статусу кожної lane.
  - Lane OpenAI типово використовує `openai/gpt-5.5` для live-перевірки ходу
    агента. Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу модель
    OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту
    Parallels не спожили решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали lane у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витратити 10-15 хвилин на post-update doctor/runtime
    відновлення залежностей на холодному гості; це все ще нормальний стан,
    якщо вкладений npm debug log просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-lane
    Parallels для macOS, Windows або Linux. Вони спільно використовують стан VM
    і можуть конфліктувати під час відновлення snapshot, роздавання пакетів або
    стану guest gateway.
  - Post-update перевірка запускає звичайну поверхню вбудованого plugin, бо
    capability facade, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти одноразового Docker-backed homeserver Tuwunel. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи, використовуючи токени бота-драйвера та SUT-бота з env.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим id чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. Типово використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулові lease.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох окремих ботів в одній приватній групі, причому SUT-бот має мати Telegram username.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох ботів і переконайтеся, що бот-драйвер може спостерігати груповий трафік ботів.
  - Записує Telegram QA звіт, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями містять RTT від запиту надсилання драйвером до спостереженої відповіді SUT.

Live transport lanes мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття для кожної lane міститься в [огляді QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease із пулу на базі Convex, надсилає heartbeats
для цього lease, доки lane виконується, і звільняє lease під час завершення.

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

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
значень secrets. Використовуйте `--json` для machine-readable виводу в скриптах і CI
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

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Архітектура та назви scenario-helper для нових адаптерів каналів містяться в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як “зростання реалістичності” (і зростання flaky/cost):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Обсяг:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Не потребує реальних ключів
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших shard configs (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного root-project процесу. Це зменшує піковий RSS на навантажених машинах і не дає auto-reply/extension роботі виснажувати непов’язані набори.
    - `pnpm test --watch` все ще використовує нативний граф проєкту root `vitest.config.ts`, бо multi-shard watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` типово розгортає змінені git paths у дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні source mappings і локальні залежні елементи import-graph. Зміни config/setup/package не запускають широкі тести, якщо явно не використати `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest tests; викликайте `pnpm test:changed` або явний `pnpm test <target>` для тестового доказу. Version bumps лише для release metadata запускають цільові перевірки version/config/root-dependency з guard, який відхиляє зміни package поза полем version верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependency, export, version та інших package-surface все ще використовують ширші guards.
    - Import-light unit tests з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані helper source files `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих light lanes, тож зміни helpers уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має виділені buckets для core helpers верхнього рівня, integration tests `reply.*` верхнього рівня і subtree `src/auto-reply/reply/**`. CI додатково розбиває reply subtree на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів повним хвостом Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення інструментів повідомлень або runtime
      контекст Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресійні тести допоміжних функцій для меж чистої маршрутизації та нормалізації.
    - Підтримуйте справність інтеграційних наборів вбудованого runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише допоміжних функцій
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Пул Vitest і типові параметри ізоляції">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проектах, e2e та live-конфігураціях.
    - Коренева UI-лінія зберігає своє налаштування `jsdom` і оптимізатор, але теж працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові параметри `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх процесів Node
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Задайте `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі штатною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні лінії запускає diff.
    - Хук pre-commit виконує лише форматування. Він повторно додає відформатовані файли до stage і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` за замовчуванням маршрутизується через дешеві scoped-лінії. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, конфігурації, пакета або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом worker.
    - Локальне автомасштабування worker навмисно консервативне й зменшує навантаження,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли проектів/конфігурації як
      `forceRerunTriggers`, щоб повторні запуски в changed-режимі залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів, а також
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий профілювальний перегляд
      файлами, зміненими відносно `origin/main`.
    - Дані таймінгів shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; CI-shard з include-pattern
      додають назву shard, щоб відфільтровані shard можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на startup-імпорти,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      mock-айте цей шов напряму замість того, щоб робити deep-import runtime helper лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним шляхом root-project для цього закоміченого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      брудне дерево, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль main-thread для
      накладних витрат запуску та transform у Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap-профілі runner для
      unit-набору з вимкненим файловим паралелізмом.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичні gateway-повідомлення, memory та churn великих payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває допоміжні функції збереження діагностичного stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS-зразки залишаються нижче бюджету тиску, а глибини черг на сесію знову спадають до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька лінія для подальшої роботи над регресіями стабільності, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові runtime-параметри:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує адаптивні worker (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent-режимі, щоб зменшити накладні витрати console I/O.
- Корисні override:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Обсяг:
  - End-to-end поведінка multi-instance gateway
  - WebSocket/HTTP-поверхні, pairing node і важчий networking
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж в unit-тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не частина типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні override:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання не типового CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?»
  - Виявляти зміни формату провайдерів, особливості tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - За задумом не стабільно для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Надавайте перевагу запуску звужених підмножин замість «усього»
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає gateway bootstrap logs/Bonjour chatter. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API keys (специфічно для провайдера): задайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для окремого live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу на відповідях rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки progress у stderr, щоб довгі виклики провайдера були видимо активними навіть коли console capture Vitest тихий.
  - `vitest.live.config.ts` вимикає console interception Vitest, щоб рядки progress провайдера/gateway стрімилися негайно під час live-запусків.
  - Налаштовуйте direct-model Heartbeat через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте gateway/probe Heartbeat через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся gateway networking / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / provider-specific failures / tool calling: запускайте звужений `pnpm test:live`

## Live (тести, що торкаються мережі)

Про live model matrix, CLI backend smokes, ACP smokes, harness Codex app-server
і всі live-тести media-provider (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), а також credential handling для live-запусків див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker runners (необов’язкові перевірки "works in Linux")

Ці Docker runners поділяються на дві групи:

- Засоби запуску live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Live-засоби запуску Docker за замовчуванням використовують меншу межу smoke-перевірки, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли ви
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише Node/Git-засобом запуску для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як обмеження ресурсів не дають важким live-, npm-install- і багатосервісним напрямам стартувати одночасно. Якщо окремий напрям важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, і далі тримає його єдиним активним, доки знову не з’явиться місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Засіб запуску за замовчуванням виконує попередню Docker-перевірку, видаляє застарілі E2E-контейнери OpenClaw, друкує статус кожні 30 секунд, зберігає часи успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці часи, щоб у наступних прогонах спершу запускати довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб пакета/образу та облікових даних.
- `Package Acceptance` — це нативний для GitHub пакетний шлюз на питання «чи працює цей встановлюваний tarball як продукт?». Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-напрями проти саме цього tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірений workflow/скрипти harness, тоді як `package_ref` вибирає source commit/branch/tag для пакування, коли `source=ref`; це дає змогу поточній логіці приймання перевіряти старіші довірені коміти. Профілі впорядковано за широтою: `smoke` — це швидкі install/channel/agent плюс gateway/config, `package` — це контракт package/update/plugin і типова нативна заміна для більшості покриття package/update у Parallels, `product` додає MCP-канали, очищення cron/субагента, OpenAI web search і OpenWebUI, а `full` запускає Docker-фрагменти release-path з OpenWebUI. Валідація релізу запускає користувацьку дельту пакета (`bundled-channel-deps-compat plugins-offline`) плюс QA пакета Telegram, бо Docker-фрагменти release-path уже покривають напрями package/update/plugin, що перетинаються. Цільові команди повторного запуску GitHub Docker, згенеровані з артефактів, включають попередній артефакт пакета та підготовлені вхідні образи, коли вони доступні, тож невдалі напрями можуть уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується помилкою, якщо стартові імпорти до диспетчеризації команди підтягують залежності пакета, як-от Commander, prompt UI, undici або логування, до диспетчеризації команди; він також утримує зібраний gateway run chunk у межах бюджету та відхиляє статичні імпорти відомих холодних шляхів Gateway. Packaged CLI smoke також покриває кореневу довідку, onboard-довідку, doctor-довідку, статус, схему конфігурації та команду списку моделей.
- Сумісність Package Acceptance із legacy обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини метаданих доставлених пакетів: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із tarball, відсутній збережений `update.channel`, legacy-розташування записів встановлення Plugin, відсутнє збереження записів встановлення marketplace та міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Контейнерні smoke-засоби запуску: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker-засоби запуску також bind-mount лише потрібні домашні каталоги CLI-автентифікації (або всі підтримувані, коли прогін не звужено), а потім копіюють їх у домашній каталог контейнера перед прогоном, щоб external-CLI OAuth міг оновлювати токени без змінення auth-сховища хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke-тест: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-тест бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-тест Codex app-server harness: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент для розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-тест спостережуваності: `pnpm qa:otel:smoke` — це приватна лінія QA для checkout із вихідним кодом. Вона навмисно не входить до Docker-ліній релізу пакета, бо npm-архів не містить QA Lab.
- Live smoke-тест Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест онбордингу/каналу/агента npm-архіву: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований архів OpenClaw у Docker, налаштовує OpenAI через онбординг із посиланням на env і за замовчуванням Telegram, перевіряє, що doctor відремонтував runtime-залежності активованого Plugin, і виконує один змокований хід агента OpenAI. Повторно використовуйте попередньо зібраний архів із `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює запакований архів OpenClaw у Docker, перемикає з пакетного `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикає назад на пакетний `stable` і перевіряє стан оновлення.
- Smoke-тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту транскрипта та ремонт doctor для зачеплених дубльованих гілок переписування prompt.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому домашньому каталозі й перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використовуйте попередньо зібраний архів із `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke-тест інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш для root-, update- і direct-npm-контейнерів. Smoke-тест оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до кандидатного архіву. Локально перевизначте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або на GitHub через вхідний параметр `update_baseline_version` workflow Install Smoke. Перевірки інсталятора без root тримають ізольований npm-кеш, щоб записи кешу, що належать root, не маскували поведінку встановлення для локального користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm-кеш під час локальних повторних запусків.
- Install Smoke CI пропускає дубльоване глобальне direct-npm-оновлення через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-тест CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає кореневий образ Dockerfile, засіває двох агентів з одним workspace в ізольованому домашньому каталозі контейнера, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереження workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS-автентифікація + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ і шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP покривають URL посилань, клікабельні елементи, підвищені курсором, iframe-посилання й метадані фреймів.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) пропускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово спричиняє відхилення схеми провайдером і перевіряє, що сирі деталі з'являються в логах Gateway.
- Міст MCP-каналів (засіяний Gateway + stdio-міст + smoke-тест raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi bundle (реальний stdio MCP-сервер + smoke-тест allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованого cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke-тест, ClawHub kitchen-sink install/uninstall, оновлення marketplace та ввімкнення/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture-сервер ClawHub.
- Smoke-тест незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованого Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий образ Docker-runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей архів у кожний сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть на наявний архів через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегат і release-path chunks bundled-channel попередньо пакують цей архів один раз, а потім розбивають перевірки вбудованих каналів на незалежні лінії, включно з окремими лініями оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Release chunks розділяють smoke-тести каналів, цілі оновлення та контракти setup/runtime на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; агрегатний chunk `bundled-channels` лишається доступним для ручних повторних запусків. Release workflow також розділяє chunks інсталяторів провайдерів і chunks install/uninstall вбудованого Plugin; застарілі chunks `package-update`, `plugins-runtime` і `plugins-integrations` лишаються агрегатними псевдонімами для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled-лінії, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують ремонт doctor/runtime-залежностей.
- Звужуйте runtime-залежності вбудованого Plugin під час ітерацій, вимикаючи непов'язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, все одно мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти витягують його, якщо він ще не локальний. QR- і Docker-тести інсталятора зберігають власні Dockerfile, бо вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Docker-runner-и live-model також монтують поточний checkout у режимі read-only і
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime
образ легким, але все ще запускає Vitest проти саме вашого локального source/config.
Крок staging пропускає великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків `.build` або
каталоги результатів Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки gateway не запускали
реальні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття gateway
з цієї Docker-лінії.
`test:docker:openwebui` — це суміснісний smoke-тест вищого рівня: він запускає
контейнер gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoint,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися витягнути
образ Open WebUI, а Open WebUI може знадобитися завершити власне cold-start налаштування.
Ця лінія очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний Gateway
контейнер, запускає другий контейнер, який породжує `openclaw mcp serve`, потім
перевіряє маршрутизоване виявлення розмов, читання транскриптів, метадані вкладень,
поведінку live event queue, маршрутизацію outbound send і Claude-style channel +
permission notifications через реальний stdio MCP-міст. Перевірка notification
інспектує сирі stdio MCP frames напряму, щоб smoke-тест валідовував те, що
міст фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає Docker-образ repo, запускає реальний probe-сервер stdio MCP
усередині контейнера, матеріалізує цей сервер через runtime embedded Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway з реальним probe-сервером stdio MCP, виконує
ізольований cron-хід і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke-тест thread plain-language (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для валідації маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочого простору й без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих установок CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, які не потребують повторного збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища профілю (а не із середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування документів: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклик інструментів Gateway (мок OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + примусова автентифікація): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Мокований виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють зв’язування сесії та вплив конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи дотримується потрібних кроків/аргументів?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінювання спершу мають лишатися детермінованими:

- Ранер сценаріїв із мокованими провайдерами для перевірки викликів інструментів + порядку, читання файлів skill і зв’язування сесій.
- Невеликий набір сценаріїв, зосереджених на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-оцінювання (opt-in, керовані змінними середовища) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
контракту інтерфейсу. Вони проходять усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit-смуга `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, назва, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка зв’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID потоку
- **directory** - API каталогу/списку
- **group-policy** - Застосування групової політики

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу каналу
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або змінення каналу чи provider plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену наживо:

- Додайте безпечну для CI регресію, якщо можливо (мок/стаб провайдера або фіксація точної трансформації форми запиту)
- Якщо це за своєю суттю лише live-випадок (ліміти швидкості, політики автентифікації), зробіть live-тест вузьким і opt-in через змінні середовища
- Віддавайте перевагу найменшому шару, який ловить баг:
  - помилка конвертації/відтворення запиту провайдера → прямий тест моделей
  - помилка конвеєра сесії/історії/інструментів Gateway → live smoke Gateway або безпечний для CI мок-тест Gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментами обходу відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було мовчки пропустити.

## Пов’язане

- [Live-тестування](/uk/help/testing-live)
- [CI](/uk/ci)
