---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні, e2e та живі набори тестів, Docker-запускачі й те, що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-30T18:11:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 470a96c6b47c2708950d05adc4a4efba5fe290f0675a131e2888d2d0032d5953
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір тестів (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [Канал QA](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовують сценарії на основі репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ про специфічні для QA ранери нижче ([специфічні для QA ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і відсилає до наведених вище довідників.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/каналів: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над одним збоєм спочатку віддавайте перевагу цільовим запускам.
- Docker-backed сайт QA: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + Gateway tool/image probes): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий turn плюс невеликий probe у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують крихітний image turn.
    Вимкніть додаткові probes за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розбиті за провайдерами.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додайте нові high-signal секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probes. Вимкніть sub-agent probe за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in перевірка з додатковим захистом для поверхні команди відновлення message-channel.
    Вона виконує `/crestodian status`, ставить у чергу persistent зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    перевіряє конфігурацію та audit entries. Той самий шлях налаштування Ring 0
    також покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6 і що
  транскрипт асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один проблемний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## Специфічні для QA ранери

Ці команди стоять поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у dedicated workflows. `Parity gate` запускається на відповідних PR і
через manual dispatch з mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і через manual dispatch із mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Scheduled QA і release checks передають Matrix `--profile fast`
явно, тоді як Matrix CLI і manual workflow input за замовчуванням залишаються
`all`; manual dispatch може розбити `all` на `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед схваленням релізу, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
і уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; поведінка пам’яті залишається покритою parity-наборами QA.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
в кожному shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на основі репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішої serial lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
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
  - Використовує зібрані artifacts `dist`; спочатку запустіть build, якщо checkout ще не має
    свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині disposable Multipass Linux VM.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на host.
  - Повторно використовує ті самі прапорці вибору provider/model, що й `qa suite`.
  - Live-запуски forward підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він присутній.
  - Output dirs мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    mounted workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його globally у
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що увімкнення plugin встановлює runtime dependencies на вимогу,
    запускає doctor і один local agent turn проти mocked OpenAI
    endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що hidden OpenClaw runtime context зберігається як
    non-display custom message замість витоку у visible user turn,
    потім засіває affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, а потім повторно використовує
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
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї lane.
  - GitHub Actions expose цю lane як manual maintainer workflow
    `NPM Telegram Beta E2E`. Вона не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також expose `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler із smoke, package, product, full або custom
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

- Exact tarball URL proof requires a digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Доказ артефакту завантажує tarball-артефакт з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/Plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає відсутніми неналаштовані runtime-залежності Plugin, перший налаштований запуск Gateway або doctor встановлює runtime-залежності кожного вбудованого
    Plugin на вимогу, а другий перезапуск не перевстановлює залежності, які вже було активовано.
  - Також встановлює відомий старіший базовий npm-реліз, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    виправляє runtime-залежності вбудованого каналу без
    postinstall-виправлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає smoke-перевірку оновлення нативного пакетного встановлення на гостях Parallels. Кожна
    вибрана платформа спершу встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тому самому гості та перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один хід локального агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному гості. Використовуйте `--json` для шляху до підсумкового артефакту та
    статусу кожного лану.
  - Лан OpenAI типово використовує `openai/gpt-5.5` для live-доказу ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host-timeout, щоб зависання транспорту Parallels не
    споживали решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ланів у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витратити 10-15 хвилин на post-update doctor/runtime
    виправлення залежностей на холодному гості; це все ще нормально, якщо вкладений
    npm debug log просувається.
  - Не запускайте цю агрегатну обгортку паралельно з окремими smoke-ланами Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакета або стану Gateway гостя.
  - Post-update доказ запускає звичайну поверхню вбудованих Plugin, бо
    capability facade, як-от speech, image generation і media
    understanding, завантажуються через вбудовані runtime API навіть тоді, коли сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-лан QA Matrix проти disposable Tuwunel homeserver на базі Docker. Лише source-checkout — пакетні встановлення не постачають `qa-lab`.
  - Повна CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live-лан QA Telegram проти справжньої приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних pooled credentials. Типово використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних bot в одній приватній групі, причому SUT bot має expose username Telegram.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує звіт QA Telegram, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії відповідей включають RTT від запиту надсилання driver до спостереженої відповіді SUT.

Live-транспортні лани мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття кожного лану розміщена в [Огляд QA → Покриття live-транспортів](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким synthetic-набором і не є частиною цієї матриці.

### Спільні credentials Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з пулу на базі Convex, надсилає Heartbeat
для цього lease під час роботи лану та звільняє lease під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі credential:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` під час звичайної роботи.

Адміністративні команди maintainers (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без друку
секретних значень. Використовуйте `--json` для machine-readable виводу в скриптах і CI
утилітах.

Типовий endpoint-контракт (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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

Форма payload для kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком chat id Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє malformed payloads.

### Додавання каналу до QA

Архітектура та імена scenario-helper для нових channel adapters розміщені в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації кожного проєкту для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих bugs
- Очікування:
  - Запускається в CI
  - Не потребує справжніх keys
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широке fallback-поведінку `api.js` і
    `runtime-api.js` за допомогою generated tiny plugin fixtures, а не
    справжніх source APIs вбудованих Plugin. Справжні завантаження API Plugin належать до
    контрактних/інтеграційних наборів, що належать Plugin.

<AccordionGroup>
  <Accordion title="Проєкти, shards і scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших конфігурацій шард (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного native процесу кореневого проєкту. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension виснажувати непов’язані набори тестів.
    - `pnpm test --watch` досі використовує native граф проєктів кореневого `vitest.config.ts`, бо цикл спостереження з кількома шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі редагування тестів, сусідні файли `*.test.ts`, явні мапінги джерел і локальні залежні елементи графа імпортів. Редагування config/setup/package не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового підтвердження викликайте `pnpm test:changed` або явний `pnpm test <target>`. Версійні підняття лише release metadata запускають цільові перевірки version/config/root-dependency, із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Редагування live Docker ACP harness запускають сфокусовані перевірки: shell-синтаксис для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші редагування package-surface досі використовують ширші guards.
    - Легкі за імпортами unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-зон спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли лишаються на наявних lanes.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих легких lanes, тож редагування helpers уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має окремі buckets для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не утримував весь Node tail.
    - Звичайний PR/main CI навмисно пропускає batch sweep extensions і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані discovery для message-tool або runtime
      context Compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для меж чистого routing і normalization.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction досі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helpers
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові параметри пулу Vitest та ізоляції">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live configs.
    - Кореневий UI lane зберігає свій setup і optimizer `jsdom`, але також працює
      на спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node
      процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes викликає diff.
    - Pre-commit hook лише форматує. Він повторно stage-ить відформатовані файли і
      не запускає lint, typecheck або tests.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` типово спрямовується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішить, що редагування harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      лише з вищим лімітом workers.
    - Автомасштабування локальних workers навмисно консервативне і зменшується,
      коли load average хоста вже високий, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/config-файли як
      `forceRerunTriggers`, щоб changed-mode повторні запуски лишалися коректними, коли змінюється
      тестове wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне місце cache для прямого profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      output import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами,
      зміненими відносно `origin/main`.
    - Дані timing шард записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config запуски використовують шлях config як key; include-pattern CI
      шарди додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test досі витрачає більшу частину часу на startup imports,
      тримайте важкі dependencies за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-importing runtime helpers лише
      для передачі їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із native root-project path для цього committed
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточне
      dirty tree, спрямовуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує main-thread CPU profile для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із diagnostics, типово увімкненими
  - Проганяє synthetic gateway message, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers persistence для diagnostic stability bundle
  - Перевіряє, що recorder лишається bounded, synthetic RSS samples лишаються нижче pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - CI-safe і без ключів
  - Вузький lane для follow-up щодо stability-regression, не заміна повного набору Gateway

### E2E (Gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові runtime параметри:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, локально: типово 1).
  - Типово працює в silent mode, щоб зменшити overhead console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути verbose console output.
- Обсяг:
  - End-to-end поведінка multi-instance gateway
  - WebSocket/HTTP surfaces, node pairing і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше moving parts, ніж у unit tests (може бути повільнішим)

### E2E: smoke-перевірка backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical filesystem behavior через sandbox fs bridge
- Очікування:
  - Лише opt-in; не частина типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує test gateway і sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний CLI binary або wrapper script

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи цей provider/model справді працює _сьогодні_ з реальними creds?»
  - Виявляє зміни формату provider, quirks tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - За задумом не CI-stable (реальні networks, реальні provider policies, quotas, outages)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені subsets замість «усього»
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API keys.
- Типово live-запуски все ще ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли мутувати ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live tests використовували ваш реальний home directory.
- `pnpm test:live` тепер типово переходить у тихіший режим: він зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає gateway bootstrap logs/Bonjour chatter. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API key (provider-specific): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу на rate limit responses.
- Progress/Heartbeat output:
  - Live suites тепер виводять progress lines у stderr, щоб довгі provider calls були видимо активними навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає Vitest console interception, щоб provider/gateway progress lines стримилися негайно під час live runs.
  - Налаштуйте direct-model heartbeats через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте gateway/probe heartbeats через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який suite мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни Gateway-мережі / протоколу WS / сполучення: додайте `pnpm test:e2e`
- Налагодження “мій бот недоступний” / збоїв, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Тести з реальною мережею (що торкаються мережі)

Для матриці реальних моделей, перевірок CLI-бекенду, перевірок ACP, стенда
Codex app-server і всіх реальних тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, медіастенд) — а також обробки облікових даних для реальних запусків — див.
[Тестування — реальні набори](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки "чи працює в Linux")

Ці Docker-ранери поділяються на два кошики:

- Ранери реальних моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний реальний файл profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і завантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker-ранери реальних тестів за замовчуванням мають меншу межу smoke-перевірки, щоб повний Docker-прохід залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли ви
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає реальний Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-тарбол через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише Node/Git-ранер для ліній встановлення/оновлення/залежностей Plugin; ці лінії монтують попередньо зібраний тарбол. Функціональний образ встановлює той самий тарбол у `/app` для ліній функціональності зібраного застосунку. Визначення Docker-ліній містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а ресурсні обмеження не дають важким реальним, npm-install і мультисервісним лініям запускатися всім одночасно. Якщо окрема лінія важча за активні обмеження, планувальник усе одно може запустити її, коли пул порожній, а потім тримає її єдиною активною, доки місткість знову не стане доступною. Значення за замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Ранер за замовчуванням виконує попередню перевірку Docker, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних ліній у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у пізніших запусках починати з довших ліній. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест ліній без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних ліній, потреб у пакеті/образі та облікових даних.
- `Package Acceptance` — це GitHub-native гейт пакета для відповіді на питання "чи працює цей встановлюваний тарбол як продукт?" Він визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-лінії проти саме цього тарбола замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені скрипти workflow/стенда, а `package_ref` вибирає вихідний коміт/гілку/тег для пакування, коли `source=ref`; це дає змогу поточній логіці приймання перевіряти старіші довірені коміти. Профілі впорядковані за широтою: `smoke` — швидкі встановлення/канал/агент плюс Gateway/config, `package` — контракт пакета/оновлення/Plugin плюс фікстура keyless upgrade-survivor і стандартна нативна заміна для більшості покриття пакетів/оновлень Parallels, `product` додає MCP-канали, очищення cron/subagent, вебпошук OpenAI та OpenWebUI, а `full` запускає Docker-фрагменти release-path з OpenWebUI. Валідація релізу запускає власну дельту пакета (`bundled-channel-deps-compat plugins-offline`) плюс Telegram package QA, бо Docker-фрагменти release-path уже покривають перехресні лінії пакета/оновлення/Plugin. Цільові команди повторного запуску GitHub Docker, згенеровані з артефактів, включають попередній артефакт пакета та підготовлені вхідні образи, коли вони доступні, тож збійні лінії можуть уникнути повторного збирання пакета й образів.
- Перевірки збирання та релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та падає, якщо запуск до диспетчеризації імпортує залежності пакета, як-от Commander, prompt UI, undici або logging, до диспетчеризації команди; він також утримує зібраний фрагмент запуску Gateway у межах бюджету й відхиляє статичні імпорти відомих холодних шляхів Gateway. Smoke-перевірка запакованого CLI також покриває root-довідку, onboard-довідку, doctor-довідку, status, схему config і команду списку моделей.
- Сумісність Package Acceptance зі застарілими версіями обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі стенд терпить лише прогалини в метаданих уже випущених пакетів: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні patch-файли у git-фікстурі, отриманій із тарбола, відсутній збережений `update.channel`, застарілі розташування install-record для Plugin, відсутнє збереження marketplace install-record і міграцію метаданих config під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є строгими збоями.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери реальних моделей також bind-mount лише потрібні домівки автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у домівку контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени, не змінюючи сховище автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Димовий тест прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Димовий тест бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Димовий тест стенда Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Димовий тест спостережуваності: `pnpm qa:otel:smoke` — це приватна гілка QA для перевірки вихідного checkout. Вона навмисно не входить до Docker-гілок релізу пакета, бо npm tarball не містить QA Lab.
- Живий димовий тест Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Димовий тест онбордингу/channel/агента npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновив активовані runtime-залежності Plugin, і запускає один змокований хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на host через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Димовий тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикає з пакета `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Димовий тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх брудної фікстури старого користувача з агентами, конфігурацією каналу, allowlist-ами Plugin, застарілим станом runtime-deps Plugin і наявними файлами workspace/session. Він запускає оновлення пакета плюс неінтерактивний doctor без живого провайдера чи ключів каналу, потім запускає loopback Gateway і перевіряє збереження config/state плюс бюджети startup/status.
- Димовий тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime-контексту плюс відновлення doctor для зачеплених дубльованих гілок prompt-rewrite.
- Димовий тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень, а не зависає. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на host через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Димовий тест інсталятора Docker: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між своїми контейнерами root, update і direct-npm. Димовий тест оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до candidate tarball. Перевизначайте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, що належать root, не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Димовий тест CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає кореневий образ Dockerfile, створює seed для двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Димовий тест CDP-знімка браузера: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що знімки CDP-ролей охоплюють URL посилань, clickables, підвищені курсором, iframe refs і metadata frame.
- Регресія OpenAI Responses web_search з мінімальним reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово викликає reject schema провайдера і перевіряє, що raw detail з’являється в логах Gateway.
- Міст MCP channel (seeded Gateway + stdio bridge + димовий тест raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi bundle (реальний stdio MCP server + димовий тест вбудованого профілю Pi allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованого cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (димовий тест встановлення, встановлення/видалення ClawHub kitchen-sink, оновлення marketplace і ввімкнення/інспекція Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture server ClawHub.
- Димовий тест незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Димовий тест metadata перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованого Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий образ Docker runner, один раз збирає й пакує OpenClaw на host, потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте перебудову на host після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate і release-path chunks bundled-channel попередньо пакують цей tarball один раз, потім shard-ять перевірки bundled channel на незалежні lanes, зокрема окремі lanes оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Release chunks розділяють channel smokes, update targets і setup/runtime contracts на `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` і `bundled-channels-contracts`; aggregate chunk `bundled-channels` залишається доступним для ручних повторних запусків. Release workflow також розділяє provider installer chunks і chunks встановлення/видалення вбудованих Plugin; legacy chunks `package-update`, `plugins-runtime` і `plugins-integrations` залишаються aggregate aliases для ручних повторних запусків. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю channel під час прямого запуску bundled lane, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Docker-запуски для окремих сценаріїв за замовчуванням використовують `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; multi-target update scenario за замовчуванням використовує `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Lane також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime-залежності вбудованого Plugin під час ітерацій, вимикаючи нерелевантні сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для конкретних suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не локальний. QR- і installer Docker-тести зберігають власні Dockerfiles, бо вони перевіряють поведінку package/install, а не спільний runtime зібраного app.

Docker-запускачі live-model також монтують поточний checkout лише для читання та
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime-
образ компактним, але все одно запускає Vitest проти вашого точного локального джерельного коду/конфігурації.
Крок розгортання пропускає великі локальні кеші та вихідні файли збірок застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків `.build` або
каталоги вихідних файлів Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-зонди Gateway не запускали
реальних працівників каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття Gateway
із цього Docker lane.
`test:docker:openwebui` — це суміснісний smoke-тест вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP-ендпоїнтами, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
реальний чат-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися завантажити
образ Open WebUI, а Open WebUI може знадобитися завершити власне налаштування холодного старту.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Docker-запусках.
Успішні запуски виводять невелике JSON-навантаження на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку live-черги подій, маршрутизацію вихідного надсилання та сповіщення каналів +
дозволів у стилі Claude через справжній stdio MCP-міст. Перевірка сповіщень
безпосередньо інспектує сирі stdio MCP-фрейми, тож smoke-тест підтверджує те, що
міст фактично випромінює, а не лише те, що випадково показує певний клієнтський SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live-ключа
моделі. Він збирає Docker-образ репозиторію, запускає справжній stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований Pi bundle
MCP runtime, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live-ключа моделі.
Він запускає засіяний Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і одноразовий дочірній turn `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke-тест ACP plain-language thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для валідації маршрутизації ACP thread, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише змінних середовища, підвантажених із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових каталогів конфігурації/робочого простору і без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, як-от `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` у перезапусках, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб гарантувати, що облікові дані надходять зі сховища профілю (не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку Gateway відкриває для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого тегу образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагувань документації: `pnpm check:docs`.
Запускайте повну валідацію anchor у Mintlify, коли також потрібні перевірки внутрішньосторінкових заголовків: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії “реального pipeline” без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, справжній gateway + agent loop): `src/gateway/gateway.test.ts` (кейс: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + забезпечується auth): `src/gateway/gateway.test.ts` (кейс: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька CI-безпечних тестів, які поводяться як “оцінювання надійності агента”:

- Mock tool-calling через справжній gateway + agent loop (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які валідують wiring сесій і ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого все ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals мають насамперед лишатися детермінованими:

- Scenario runner із mock-провайдерами для перевірки викликів інструментів + порядку, читання файлів skill і wiring сесії.
- Невеликий набір сценаріїв, сфокусованих на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live evals (opt-in, env-gated) лише після того, як CI-безпечний набір буде готовий.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
інтерфейсному контракту. Вони ітерують усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці shared seam і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся shared channel або provider surfaces.

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
- **threading** - Обробка Thread ID
- **directory** - API каталогу/реєстру
- **group-policy** - Застосування групової політики

### Контракти статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Проби статусу каналу
- **registry** - Форма registry Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/селекція auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або subpaths plugin-sdk
- Після додавання або модифікації каналу чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену live:

- Додайте CI-безпечну регресію, якщо можливо (mock/stub provider або capture точного перетворення форми запиту)
- Якщо це за своєю суттю лише live (rate limits, auth policies), тримайте live-тест вузьким і opt-in через змінні середовища
- Віддавайте перевагу найменшому шару, який ловить баг:
  - баг конвертації/відтворення запиту провайдера → прямий тест моделей
  - баг pipeline сесії/історії/інструментів gateway → gateway live smoke або CI-безпечний mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить по одній sampled target для кожного класу SecretRef з метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-сегментом відхиляються.
  - Якщо ви додаєте нову target family SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було мовчки пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
