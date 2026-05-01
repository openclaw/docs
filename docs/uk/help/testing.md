---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні/e2e/live-набори, Docker-ранери та те, що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-01T20:49:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3fb72ec57b41f776663f83380df89550e918887d96b7f420e4c9ebf53a57cdb8
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником "як ми тестуємо":

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, для налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, командна поверхня, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовується сценаріями з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і відсилає до наведених вище довідників.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на просторій машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над одиничною помилкою спочатку віддавайте перевагу таргетованим запускам.
- Docker-backed QA-сайт: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + gateway tool/image probes): `pnpm test:live`
- Таргетувати один live-файл тихо: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn плюс невелику probe у стилі читання файлу.
    Моделі, чиї метадані оголошують input `image`, також виконують крихітний image turn.
    Вимкніть додаткові probes через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розшардовані за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release callers.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив'язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і image attachment
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує probes для image,
    cron MCP, sub-agent і Guardian. Вимкніть sub-agent probe через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders перевірка для поверхні команди rescue message-channel.
    Вона виконує `/crestodian status`, ставить у чергу persistent model
    change, відповідає `/crestodian yes` і перевіряє шлях audit/config write.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього state dir OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + SecretRef writes,
    валідує конфігурацію та перевіряє audit entries. Той самий шлях Ring 0 setup
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один failing case, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у dedicated workflows. `Parity gate` запускається на відповідних PR і
з ручного dispatch із mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch із mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
parallel jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і manual workflow input default залишаються
`all`; manual dispatch може шардити `all` на jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед release approval, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
та уникали звичайного старту provider-plugin. Ці live transport gateways вимикають
memory search; поведінка memory залишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
image `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, потім витягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість rebuild
усередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати worker
    count, або `--concurrency 1` для старішого serial lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій падає. Використовуйте `--allow-failures`, коли вам
    потрібні artifacts без failing exit code.
  - Підтримує provider modes `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний AIMock-backed provider server для experimental
    fixture і protocol-mock coverage без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує combined CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише sustained hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі startup bursts записуються як metrics
    без вигляду minutes-long gateway peg regression.
  - Використовує зібрані artifacts `dist`; спочатку запустіть build, коли checkout ще не
    має свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині одноразової Multipass Linux VM.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на host.
  - Повторно використовує ті самі provider/model selection flags, що й `qa suite`.
  - Live runs передають підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають залишатися під repo root, щоб guest міг записувати назад через
    mounted workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один local agent turn проти
    mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що hidden OpenClaw runtime context зберігається як
    non-display custom message замість витоку у visible user turn,
    потім засіває affected broken session JSONL і перевіряє, що
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
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions відкриває цей lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    environment `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також відкриває `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  normalized `openclaw-current.tgz` як `package-under-test`, потім запускає
  existing Docker E2E scheduler з lane profiles smoke, package, product, full або custom.
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

- Exact tarball URL proof вимагає digest:

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

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/плагіни через
    зміни конфігурації.
  - Перевіряє, що виявлення налаштування не показує неналаштовані завантажувані плагіни,
    перше налаштоване виправлення doctor явно встановлює кожен відсутній завантажуваний
    плагін, а другий перезапуск не запускає приховане
    виправлення залежностей.
  - Також встановлює відому старішу npm-базу, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що doctor кандидата після
    оновлення очищає залишки застарілих залежностей плагінів без
    postinstall-виправлення з боку тестового оточення.
- `pnpm test:parallels:npm-update`
  - Запускає нативний smoke-тест оновлення пакетного встановлення на гостях Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тому самому гості та перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний
    хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному гості. Використовуйте `--json` для шляху до підсумкового артефакта та
    статусу кожної лінії.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для живого доказу
    ходу агента. Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски в тайм-аут хоста, щоб зависання транспорту Parallels не
    забрало решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед тим, як припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витратити 10-15 хвилин на post-update doctor і
    роботу з оновлення пакетів на холодному гості; це все ще справний стан, якщо вкладений
    журнал налагодження npm просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-лініями Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакетів або стану гостьового gateway.
  - Доказ після оновлення запускає звичайну поверхню вбудованих плагінів, оскільки
    фасади можливостей, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лінію Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише source-checkout — пакетні встановлення не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, змінні середовища та структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA-лінію Telegram проти реальної приватної групи, використовуючи токени driver і SUT-бота з середовища.
  - Потрібні `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим id чату Telegram.
  - Підтримує `--credential-source convex` для спільних pooled-облікових даних. За замовчуванням використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без коду виходу з помилкою.
  - Потрібні два різні боти в одній приватній групі, причому SUT-бот має надавати ім'я користувача Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver-бот може спостерігати груповий bot-трафік.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостереженої відповіді SUT.

Live transport-лінії мають один стандартний контракт, щоб нові транспорти не відхилялися; матриця покриття кожної лінії розміщена в [Огляд QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або
`OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab отримує ексклюзивну lease з pool на базі Convex, надсилає heartbeats
для цієї lease під час виконання лінії та звільняє lease під час завершення.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов'язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов'язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов'язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди maintainer (додавання/видалення/список pool) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker-секрети,
префікс endpoint, HTTP-тайм-аут і доступність admin/list без друку
секретних значень. Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI
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
- `POST /admin/add` (лише секрет maintainer)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет maintainer)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Запобіжник активної lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для виду Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Архітектура й назви scenario-helper для нових адаптерів каналів описані в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізуйте transport runner на спільному seam хоста `qa-lab`, оголосіть `qaRunners` у маніфесті плагіна, змонтуйте як `openclaw qa <runner>` і створіть сценарії в `qa/scenarios/`.

## Тестові набори (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shards `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації окремих проєктів для паралельного планування
- Файли: core/unit-інвентарі в `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit-тести запускаються у виділеному shard `unit-ui`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Не потребує реальних ключів
  - Має бути швидким і стабільним
  - Тести resolver і loader публічної поверхні мають доводити broad fallback-поведінку `api.js` і
    `runtime-api.js` за допомогою згенерованих крихітних plugin fixtures, а не
    API вихідного коду реальних вбудованих плагінів. Завантаження API реальних плагінів належать до
    contract/integration-наборів, якими володіють плагіни.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілені запуски `pnpm test` виконують дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує пікове RSS на навантажених машинах і не дає роботі auto-reply/розширень виснажувати ресурси для непов’язаних наборів.
    - `pnpm test --watch` усе ще використовує нативний граф проєктів кореневого `vitest.config.ts`, бо цикл watch із багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явні цілі файлів/каталогів через обмежені смуги, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві обмежені смуги: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні елементи графа імпортів. Зміни конфігурації/налаштувань/пакетів не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний контрольний шлюз для вузьких змін. Він класифікує diff на core, тести core, розширення, тести розширень, застосунки, docs, метадані релізу, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового підтвердження викликайте `pnpm test:changed` або явний `pnpm test <target>`. Version bump лише для метаданих релізу запускає націлені перевірки версії/конфігурації/кореневих залежностей із guard, який відхиляє зміни пакетів поза полем версії верхнього рівня.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, export, версії та іншої поверхні пакета все ще використовують ширші guards.
    - Легкі за імпортами unit-тести з agents, commands, plugins, helpers auto-reply, `plugin-sdk` і подібних областей чистих утиліт спрямовуються через смугу `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних смугах.
    - Вибрані вихідні файли helper у `plugin-sdk` і `commands` також зіставляють запуски в changed-mode з явними сусідніми тестами в цих легких смугах, тож зміни helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має окремі buckets для top-level core helpers, top-level інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів повним Node-хвостом.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep розширень і релізний шард `agentic-plugins`. Повна Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих suite, важких на plugins/розширення, на реліз-кандидатах.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте inputs для виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресійні тести helper для меж чистої маршрутизації та нормалізації.
    - Підтримуйте працездатність інтеграційних suite embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці suite перевіряють, що scoped ids і поведінка compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Коренева UI-смуга зберігає свої `jsdom` setup і optimizer, але також працює
      на спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі значення за замовчуванням
      `threads` + `isolate: false` зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити компіляційний churn V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні смуги запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли й
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен розумний локальний контрольний шлюз.
    - `pnpm test:changed` за замовчуванням спрямовується через дешеві обмежені смуги. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішить, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею workers.
    - Локальне автоматичне масштабування workers навмисно консервативне й відступає,
      коли середнє навантаження host уже високе, тож кілька одночасних запусків
      Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб повторні запуски changed-mode залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      host; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування cache для прямого профілювання.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      import-breakdown output.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими після `origin/main`.
    - Дані timing шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config запуски використовують шлях конфігурації як key; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшу частину часу на startup imports,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      mock-айте цей шов напряму замість deep-importing runtime helpers лише
      щоб пропустити їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із нативним шляхом root-project для цього committed
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      dirty tree, маршрутизуючи changed file list через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує main-thread CPU profile для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує runner CPU+heap profiles для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із diagnostics, увімкненими за замовчуванням
  - Проганяє synthetic gateway message, memory і large-payload churn через шлях diagnostic event
  - Опитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається bounded, synthetic RSS samples залишаються нижче pressure budget, а depths per-session queue повертаються до нуля
- Очікування:
  - Безпечно для CI й не потребує ключів
  - Вузька смуга для подальшої роботи зі stability-regression, не заміна повного suite Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Runtime defaults:
  - Використовує Vitest `threads` із `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, local: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити overhead console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового worker count (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Обсяг:
  - End-to-end поведінка багатьох екземплярів Gateway
  - WebSocket/HTTP surfaces, pairing node і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на host через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Випробовує OpenClaw OpenShell backend через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не є частиною стандартного запуску `pnpm test:e2e`
  - Потребує локального `openshell` CLI і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання на нестандартний CLI binary або wrapper script

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи цей provider/model справді працює _сьогодні_ з реальними creds?”
  - Виявляє зміни format у provider, особливості tool-calling, auth issues і поведінку rate limit
- Очікування:
  - За задумом не стабільний для CI (реальні мережі, реальні політики providers, quotas, outages)
  - Коштує грошей / використовує rate limits
  - Надавайте перевагу запуску звужених subsets замість “усього”
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний home directory.
- `pnpm test:live` тепер за замовчуванням використовує тихіший режим: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і mutes gateway bootstrap logs/Bonjour chatter. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Rotation API keys (provider-specific): задайте `*_API_KEYS` у форматі з comma/semicolon або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу на rate limit responses.
- Progress/heartbeat output:
  - Live suite тепер виводять progress lines у stderr, щоб довгі provider calls були видимо активними навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає Vitest console interception, тож provider/gateway progress lines stream-яться негайно під час live-запусків.
  - Налаштуйте direct-model heartbeats за допомогою `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте gateway/probe heartbeats за допомогою `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який suite запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в gateway-мережі / протоколі WS / спарюванні: додайте `pnpm test:e2e`
- Налагодження “мій бот не працює” / збоїв, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Live-тести (які торкаються мережі)

Для live-матриці моделей, smoke-тестів бекенда CLI, smoke-тестів ACP, harness Codex app-server
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker runner-и (необов’язкові перевірки "працює в Linux")

Ці Docker runner-и поділяються на дві групи:

- Runner-и live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runner-и за замовчуванням мають меншу межу smoke-тестів, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли ви
  явно хочете більший вичерпний scan.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ — це лише Node/Git runner для ліній install/update/plugin-dependency; ці лінії монтують попередньо зібраний tarball. Функціональний образ встановлює той самий tarball у `/app` для ліній функціональності зібраного застосунку. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а ресурсні обмеження не дають важким live-, npm-install- і multi-service-лініям стартувати всім одночасно. Якщо окрема лінія важча за активні обмеження, планувальник усе одно може запустити її, коли пул порожній, і потім тримає її єдиною запущеною, доки знову не з’явиться місткість. Значення за замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Runner за замовчуванням виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає часи успішних ліній у `.artifacts/docker-tests/lane-timings.json` і використовує ці часи, щоб у наступних запусках спочатку стартували довші лінії. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест ліній без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних ліній, потреб пакетів/образів і облікових даних.
- `Package Acceptance` — це GitHub-native gate пакета для перевірки "чи працює цей встановлюваний tarball як продукт?" Він визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-лінії проти саме цього tarball замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені workflow/harness-скрипти, а `package_ref` вибирає source commit/branch/tag для пакування, коли `source=ref`; це дає змогу поточній логіці acceptance перевіряти старіші довірені коміти. Профілі впорядковані за шириною охоплення: `smoke` — це швидкі install/channel/agent плюс gateway/config, `package` — це package/update/plugin contract плюс keyless upgrade-survivor fixture, published-baseline upgrade survivor lane і стандартна native-заміна для більшості Parallels package/update-покриття, `product` додає MCP-канали, очищення cron/subagent, OpenAI web search і OpenWebUI, а `full` запускає Docker-фрагменти release-path з OpenWebUI. Для `published-upgrade-survivor` Package Acceptance завжди використовує `package-under-test` як кандидата і `published_upgrade_survivor_baseline` як fallback published baseline, за замовчуванням `openclaw@latest`; задайте `published_upgrade_survivor_baselines=release-history`, щоб розбити лінію на deduped-матрицю з останніх шести стабільних релізів, `2026.4.23` і останнього стабільного релізу перед `2026-03-15`. Published-лінія налаштовує свій baseline за допомогою вбудованого рецепта команди `openclaw config set`, а потім записує кроки рецепта в підсумок лінії. Release validation запускає custom package delta (`plugins-offline plugin-update`) плюс Telegram package QA, бо release-path Docker-фрагменти вже покривають лінії package/update/plugin, що перетинаються. Цільові команди GitHub Docker rerun, згенеровані з артефактів, містять попередній package artifact, підготовлені image inputs і список baseline для published upgrade-survivor, коли він доступний, щоб невдалі лінії могли уникати повторного збирання пакета й образів.
- Перевірки build і release запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та падає, якщо startup до dispatch імпортує залежності пакета, такі як Commander, prompt UI, undici або logging, до dispatch команди; він також утримує bundled gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Legacy-сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини metadata вже випущених пакетів: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у git fixture, отриманому з tarball, відсутній збережений `update.channel`, старі місця install-record для plugin, відсутнє збереження marketplace install-record і міграція config metadata під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є строгими збоями.
- Container smoke runner-и: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють високорівневі інтеграційні шляхи.

Live-model Docker runner-и також bind-mount-ять лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб external-CLI OAuth міг оновлювати токени без змін у host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` — приватна QA-доріжка з source-checkout. Її навмисно не включено до Docker-доріжок релізу пакета, бо npm-архів не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding з env-ref і типово Telegram, запускає doctor і виконує один змодельований хід агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть rebuild на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикає пакет із `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикає назад на пакет `stable` і перевіряє статус оновлення.
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненого fixture старого користувача з агентами, конфігурацією каналу, allowlist Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він виконує оновлення пакета плюс неінтерактивний doctor без живих ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цю базову версію за вбудованим рецептом команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до candidate tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, startup, `/healthz`, `/readyz` і бюджети RPC status. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть aggregate scheduler розгорнути точні базові версії через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` і розгорніть issue-подібні fixtures через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; Package Acceptance відкриває їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` перевіряє збереження transcript прихованого runtime context плюс doctor repair для зачеплених дубльованих гілок prompt-rewrite.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache для своїх root, update і direct-npm контейнерів. Update smoke типово використовує npm `latest` як stable baseline перед оновленням до candidate tarball. Перевизначте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` локально або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки non-root installer тримають ізольований npm cache, щоб cache entries, власником яких є root, не маскували поведінку встановлення user-local. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використати root/update/direct-npm cache між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття direct `npm install -g`.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово будує root Dockerfile image, засіває двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використайте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) будує source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змодельований OpenAI server через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає reject provider schema і перевіряє, що raw detail зʼявляється в логах Gateway.
- MCP channel bridge (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + вбудований Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, встановлення/видалення kitchen-sink із ClawHub, marketplace updates і enable/inspect для Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture server ClawHub.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює install smoke, встановлення з локального fixture ClawHub, marketplace updates, встановлення залежностей npm package і enable/inspect для Claude-bundle. `pnpm test:docker:plugin-update` охоплює поведінку unchanged update для встановлених plugins.

Щоб вручну попередньо зібрати та повторно використати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-specific image overrides, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на remote shared image, скрипти pull його, якщо він ще не є локальним. Docker-тести QR та installer тримають власні Dockerfiles, бо вони перевіряють поведінку package/install, а не спільний runtime built-app.

Docker runners для live-model також bind-mount поточний checkout у режимі read-only і
розгортають його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, водночас запускаючи Vitest проти саме вашого локального source/config.
Крок staging пропускає великі локальні-only caches і app build outputs, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також app-local `.build` або
Gradle output directories, щоб Docker live runs не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні Telegram/Discord/etc. channel workers усередині контейнера.
`test:docker:live-models` усе одно запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage із цієї Docker lane.
`test:docker:openwebui` — це вищорівневий compatibility smoke: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoints,
запускає pinned контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, потім надсилає
реальний chat request через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, бо Docker може потребувати pull
image Open WebUI, а Open WebUI може потребувати завершення власного cold-start setup.
Ця lane очікує придатний live model key, і `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний Gateway
container, запускає другий контейнер, що spawn `openclaw mcp serve`, потім
перевіряє routed conversation discovery, transcript reads, attachment metadata,
поведінку live event queue, outbound send routing і Claude-style channel +
permission notifications через реальний stdio MCP bridge. Перевірка notification
інспектує raw stdio MCP frames напряму, щоб smoke перевіряв те, що
bridge фактично emit, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він будує repo Docker image, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через вбудований Pi bundle
MCP runtime, виконує tool, потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway із реальним stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для regression/debug workflow. Він може знову знадобитися для перевірки ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`), змонтовано до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`), змонтовано до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`), змонтовано до `/home/node/.profile` і підвантажено перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні env, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`), змонтовано до `/home/node/.npm-global` для кешованих інсталяцій CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI у `$HOME` монтуються лише для читання у `/host-auth...`, а потім копіюються до `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне повторне складання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовується Open WebUI smoke
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування документів: `pnpm check:docs`.
Запускайте повну перевірку anchors Mintlify, коли також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Offline-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + enforced auth): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «agent reliability evals»:

- Mock tool-calling через реальний gateway + agent loop (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють wiring сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли skills перелічені в prompt, чи агент вибирає правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи агент читає `SKILL.md` перед використанням і дотримується потрібних кроків/аргументів?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals спершу мають залишатися детермінованими:

- Runner сценаріїв із mock providers для перевірки tool calls + order, читання skill files і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на skills (use vs avoid, gating, prompt injection).
- Необов’язкові live evals (opt-in, через env gate) лише після того, як буде створено безпечний для CI набір.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
інтерфейсному контракту. Вони проходять усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit lane `pnpm test` навмисно
пропускає ці спільні файли seam і smoke; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID thread
- **directory** - Directory/roster API
- **group-policy** - Застосування групової політики

### Контракти статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу каналу
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір автентифікації
- **catalog** - Model catalog API
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни exports або subpaths plugin-sdk
- Після додавання або змінення каналу чи provider plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API keys.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub provider або зафіксуйте точне перетворення request-shape)
- Якщо це за своєю суттю лише live-only (rate limits, auth policies), зробіть live test вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить bug:
  - bug перетворення/відтворення provider request → прямий models test
  - bug pipeline Gateway session/history/tool → gateway live smoke або безпечний для CI gateway mock test
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль для кожного класу SecretRef з metadata реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal segment відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було пропустити непомітно.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
