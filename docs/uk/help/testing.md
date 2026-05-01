---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори модульних/e2e/живих тестів, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-01T20:38:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2d214c011572b21eb0bc03206627d6381216a30fcd0d4b213a52fb31f27d2e8
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником "як ми тестуємо":

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовують сценарії на основі репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ QA-specific runners нижче ([QA-specific runners](#qa-specific-runners)) перелічує конкретні виклики `qa` і відсилає до наведених вище довідників.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над окремим збоєм спочатку віддавайте перевагу таргетованим запускам.
- Docker-backed QA site: `pnpm qa:lab:up`
- Linux VM-backed QA lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки Gateway tool/image): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку в стилі читання файлу.
    Моделі, метадані яких оголошують підтримку введення `image`, також виконують невеликий image-хід.
    Вимикайте додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix-завдання, розбиті за провайдером.
  - Для сфокусованих повторних запусків CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness Codex app-server, який належить Plugin,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимикайте перевірку sub-agent за допомогою
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
    і перевіряє, що нечіткий planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожньої директорії стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + записи SecretRef,
    валідовує конфігурацію та перевіряє записи audit. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-specific runners

Ці команди розташовані поруч з основними наборами тестів, коли потрібен реалізм QA-lab:

CI запускає QA Lab у dedicated workflows. `Parity gate` запускається на відповідних PR і
через manual dispatch з mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і через manual dispatch з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і manual workflow input за замовчуванням залишаються
`all`; manual dispatch може розбити `all` на jobs `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед approval релізу, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
й уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; поведінка memory залишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім отримують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість перебудови
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на основі репозиторію безпосередньо на host.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    gateway workers. `qa-channel` за замовчуванням має concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішого serial lane.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, коли
    потрібні artifacts без failing exit code.
  - Підтримує provider modes `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний provider server на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни scenario-aware
    `mock-openai` lane.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає gateway startup bench плюс невеликий mock QA Lab scenario pack
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує combined CPU observation
    summary у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише sustained hot CPU observations (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тож короткі startup bursts записуються як metrics
    і не виглядають як регресія minutes-long gateway peg.
  - Використовує зібрані artifacts `dist`; спершу запустіть build, якщо checkout ще не
    має свіжого runtime output.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA suite всередині одноразової Multipass Linux VM.
  - Зберігає ту саму поведінку scenario-selection, що й `qa suite` на host.
  - Повторно використовує ті самі прапорці provider/model selection, що й `qa suite`.
  - Live-запуски передають підтримувані QA auth inputs, практичні для guest:
    env-based provider keys, шлях QA live provider config і `CODEX_HOME`,
    коли він наявний.
  - Output dirs мають залишатися в межах repo root, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний QA report + summary плюс Multipass logs у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-backed QA site для operator-style QA work.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, запускає non-interactive OpenAI API-key onboarding, за замовчуванням налаштовує Telegram,
    перевіряє, що packaged Plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один локальний agent turn проти
    mock OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий packaged-install
    lane з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає deterministic built-app Docker smoke для embedded runtime context
    transcripts. Він перевіряє, що hidden OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім засіває affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на active branch з backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює candidate package OpenClaw у Docker, запускає installed-package
    onboarding, налаштовує Telegram через installed CLI, а потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret наявні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає shared
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions виставляє цей lane як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також виставляє `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler з профілями lane smoke, package, product, full або custom.
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

- Exact tarball URL proof потребує digest:

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
    з налаштованим OpenAI, а потім вмикає вбудований канал/Plugin через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування не залишає неналаштованих завантажуваних plugins,
    перше налаштоване виправлення doctor явно встановлює кожен відсутній завантажуваний
    plugin, а другий перезапуск не запускає приховане
    виправлення залежностей.
  - Також встановлює відомий старіший базовий варіант npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що doctor кандидата
    після оновлення очищає залишки застарілих залежностей plugin без
    виправлення postinstall з боку тестового обв’язування.
- `pnpm test:parallels:npm-update`
  - Запускає нативну димову перевірку оновлення пакетного встановлення на гостях Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тому самому гості й перевіряє
    встановлену версію, статус оновлення, готовність gateway та один локальний
    хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному гості. Використовуйте `--json` для шляху до підсумкового артефакта та
    статусу кожної лінії.
  - Лінія OpenAI типово використовує `openai/gpt-5.4` для доказу живого ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли свідомо перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в таймаут хоста, щоб зависання транспорту Parallels не могли
    використати решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати від 10 до 15 хвилин на post-update doctor та роботу з
    оновленням пакетів на холодному гості; це все ще нормально, коли вкладений журнал налагодження npm
    просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими димовими лініями Parallels
    macOS, Windows або Linux. Вони спільно використовують стан ВМ і можуть конфліктувати під час
    відновлення знімка, обслуговування пакетів або стану gateway гостя.
  - Доказ після оновлення запускає звичайну поверхню вбудованих plugin, оскільки
    фасади можливостей, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через вбудовані runtime API навіть тоді, коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого димового
    тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає живу лінію QA Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише вихідний checkout — пакетні встановлення не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, змінні середовища та структура артефактів: [QA Matrix](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає живу лінію QA Telegram проти реальної приватної групи, використовуючи токени бота-драйвера та SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим id чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. Типово використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулові оренди.
  - Завершується з ненульовим кодом, коли будь-який сценарій завершується невдачею. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу, що позначає помилку.
  - Потребує двох різних ботів в одній приватній групі, причому SUT-бот має надавати ім’я користувача Telegram.
  - Для стабільного спостереження бот-до-бота увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот-драйвер може спостерігати трафік ботів у групі.
  - Записує звіт QA Telegram, підсумок і артефакт спостережених повідомлень у `.artifacts/qa-e2e/...`. Сценарії з відповідями містять RTT від запиту надсилання драйвера до спостереженої відповіді SUT.

Живі транспортні лінії мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття за лініями міститься в [Огляд QA → Покриття живих транспортів](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, лабораторія QA отримує ексклюзивну оренду з пулу на базі Convex, надсилає heartbeats
для цієї оренди, поки лінія виконується, і звільняє оренду під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI типово `ci`, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий id трасування)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL-адреси Convex `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди maintainer (додавання/видалення/список пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед живими запусками, щоб перевірити URL сайту Convex, secrets брокера,
префікс endpoint, HTTP-таймаут і доступність admin/list без друку
секретних значень. Використовуйте `--json` для машинозчитуваного виводу в скриптах і
утилітах CI.

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
- `POST /admin/add` (лише secret maintainer)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише secret maintainer)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише secret maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для виду Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Назви архітектури та scenario-helper для нових адаптерів каналів містяться в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Думайте про набори як про “зростання реалістичності” (і зростання нестабільності/вартості):

### Модульні / інтеграційні (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shards `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації за проєктами для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні тести UI запускаються у виділеному shard `unit-ui`
- Обсяг:
  - Чисті модульні тести
  - Внутрішньопроцесні інтеграційні тести (автентифікація gateway, маршрутизація, інструменти, parsing, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Не потребує реальних ключів
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` згенерованими крихітними фікстурами plugin, а не
    реальними API вихідного коду вбудованих plugin. Реальні завантаження API plugin належать до
    contract/integration наборів, якими володіє plugin.

<AccordionGroup>
  <Accordion title="Проєкти, shards і лінії з областю дії">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного нативного процесу кореневого проєкту. Це зменшує піковий RSS на навантажених машинах і не дає auto-reply/extension роботі витісняти непов’язані набори тестів.
    - `pnpm test --watch` усе ще використовує нативний граф проєктів кореневого `vitest.config.ts`, бо цикл спостереження з кількома шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не платить повну ціну запуску кореневого проєкту.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі правки тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні елементи графа імпортів. Правки config/setup/package не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового підтвердження викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версій лише в release metadata запускають цільові перевірки version/config/root-dependency з guard, який відхиляє package-зміни поза полем версії верхнього рівня.
    - Правки live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші правки package-surface усе ще використовують ширші guards.
    - Import-light unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-ділянок спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли лишаються на наявних lanes.
    - Вибрані helper source files `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих light lanes, тож helper-правки не перезапускають увесь важкий набір для цього каталогу.
    - `auto-reply` має окремі buckets для top-level core helpers, top-level `reply.*` integration tests і піддерева `src/auto-reply/reply/**`. CI додатково ділить reply-піддерево на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім хвостом Node.
    - Звичайний PR/main CI навмисно пропускає extension batch sweep і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте вхідні дані для виявлення message-tool або runtime
      контекст compaction, підтримуйте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для меж чистого routing і
      normalization.
    - Підтримуйте справність embedded runner integration suites:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction усе ще
      проходять через справжні шляхи `run.ts` / `compact.ts`; helper-only тести
      не є достатньою заміною для цих integration paths.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner для кореневих проєктів, e2e і live configs.
    - Кореневий UI lane зберігає свої `jsdom` setup і optimizer, але також
      працює на спільному non-isolated runner.
    - Кожен шард `pnpm test` успадковує ті самі стандартні `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node
      процесів Vitest, щоб зменшити V8 compile churn під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які architectural lanes запускає diff.
    - Pre-commit hook лише форматує. Він повторно додає відформатовані файли в stage і
      не запускає lint, typecheck або tests.
    - Явно запускайте `pnpm check:changed` перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` за замовчуванням спрямовує через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішує, що правка harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      лише з вищою межею workers.
    - Локальне auto-scaling workers навмисно консервативне й зменшує навантаження,
      коли load average хоста вже високий, тож кілька одночасних
      запусків Vitest за замовчуванням завдають меншої шкоди.
    - Базова конфігурація Vitest позначає проєкти/config files як
      `forceRerunTriggers`, щоб changed-mode reruns лишалися коректними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну cache location для прямого profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration плюс
      import-breakdown output.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами,
      зміненими відносно `origin/main`.
    - Дані shard timing записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config runs використовують config path як ключ; include-pattern CI
      shards додають назву шарда, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшість часу на startup imports,
      тримайте важкі dependencies за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-importing runtime helpers лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` з нативним шляхом root-project для цього committed
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      dirty tree, спрямовуючи список changed file через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує main-thread CPU profile для
      startup і transform overhead Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує runner CPU+heap profiles для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає справжній loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичний gateway message, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers для збереження diagnostic stability bundle
  - Перевіряє, що recorder лишається bounded, synthetic RSS samples лишаються нижче pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Вузький lane для stability-regression follow-up, а не заміна повного Gateway suite

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E tests у `extensions/`
- Runtime defaults:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, локально: за замовчуванням 1).
  - За замовчуванням працює в silent mode, щоб зменшити overhead console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати worker count (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути verbose console output.
- Обсяг:
  - End-to-end поведінка multi-instance gateway
  - WebSocket/HTTP surfaces, node pairing і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit tests (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через справжні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical filesystem behavior через sandbox fs bridge
- Очікування:
  - Лише opt-in; не є частиною стандартного запуску `pnpm test:e2e`
  - Потребує локального `openshell` CLI і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI binary або wrapper script

### Live (real providers + real models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live tests у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи цей provider/model справді працює _сьогодні_ з реальними creds?”
  - Виявляє зміни provider format, tool-calling quirks, auth issues і rate limit behavior
- Очікування:
  - Навмисно не є CI-stable (реальні мережі, реальні provider policies, quotas, outages)
  - Коштує грошей / використовує rate limits
  - Віддавайте перевагу запуску звужених subsets замість “усього”
- Live runs завантажують `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live runs усе ще ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли змінити ваш справжній `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live tests використовували ваш справжній home directory.
- `pnpm test:live` тепер за замовчуванням працює тихіше: він зберігає progress output `[live] ...`, але приховує додаткове повідомлення `~/.profile` і приглушує gateway bootstrap logs/Bonjour chatter. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API key (provider-specific): установіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live override через `OPENCLAW_LIVE_*_KEY`; tests повторюють спробу на rate limit responses.
- Progress/heartbeat output:
  - Live suites тепер виводять progress lines у stderr, щоб довгі provider calls були видимо активними, навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає Vitest console interception, щоб provider/gateway progress lines одразу транслювалися під час live runs.
  - Налаштовуйте direct-model heartbeats через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте gateway/probe heartbeats через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який suite мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в мережевій частині Gateway / WS-протоколі / сполученні: додайте `pnpm test:e2e`
- Налагодження “мій бот не працює” / помилок, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Live (тести, що торкаються мережі)

Для live-матриці моделей, smoke-тестів бекенда CLI, smoke-тестів ACP, harness app-server
Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, media harness), а також обробки облікових даних для live-запусків див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker runners (необов’язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл ключа профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочий простір (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням використовують менший ліміт smoke-перевірок, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли ви
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-тарбол через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ є лише Node/Git runner для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний тарбол. Функціональний образ встановлює той самий тарбол у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегований запуск використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як ліміти ресурсів не дають важким live-, npm-install- і multi-service-напрямам стартувати одночасно. Якщо один напрям важчий за активні ліміти, планувальник усе одно може стартувати його, коли пул порожній, і потім тримає його єдиним запущеним, доки місткість знову не стане доступною. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Runner за замовчуванням виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках спершу стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без складання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб у пакеті/образі та облікових даних.
- `Package Acceptance` — це GitHub-native шлюз пакета для питання "чи працює цей встановлюваний тарбол як продукт?" Він визначає один кандидатний пакет із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає багаторазові Docker E2E-напрями проти саме цього тарбола замість повторного пакування вибраного ref. `workflow_ref` вибирає довірені скрипти workflow/harness, тоді як `package_ref` вибирає source commit/branch/tag для пакування, коли `source=ref`; це дає поточній acceptance-логіці змогу перевіряти старіші довірені коміти. Профілі впорядковано за широтою: `smoke` — це швидка перевірка install/channel/agent плюс gateway/config, `package` — це контракт package/update/plugin плюс keyless upgrade-survivor fixture, напрям published-baseline upgrade survivor і типова нативна заміна більшості покриття package/update у Parallels, `product` додає MCP-канали, очищення cron/subagent, OpenAI web search і OpenWebUI, а `full` запускає Docker-частини release-path з OpenWebUI. Для `published-upgrade-survivor` Package Acceptance завжди використовує `package-under-test` як кандидата і `published_upgrade_survivor_baseline` як fallback published baseline, за замовчуванням `openclaw@latest`; задайте `published_upgrade_survivor_baselines=release-history`, щоб розбити напрям на дедупліковану матрицю з останніх шести stable-релізів, `2026.4.23` і останнього stable-релізу перед `2026-03-15`. Опублікований напрям налаштовує свій baseline за допомогою вбудованого рецепта команди `openclaw config set`, а потім записує кроки рецепта в підсумок напряму. Release validation запускає custom package delta (`plugins-offline plugin-update`) плюс Telegram package QA, тому що Docker-частини release-path уже покривають суміжні напрями package/update/plugin. Цільові GitHub-команди повторного запуску Docker, згенеровані з артефактів, містять попередній артефакт пакета, підготовлені вхідні образи та список baseline для published upgrade-survivor, коли він доступний, щоб невдалі напрями могли уникнути повторної збірки пакета й образів.
- Перевірки складання й релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та падає, якщо startup до dispatch імпортує залежності пакета, як-от Commander, prompt UI, undici або logging, до dispatch команди; він також утримує зібраний gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Застаріла сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness толерує лише прогалини метаданих уже випущених пакетів: пропущені приватні записи QA inventory, відсутній `gateway install --wrapper`, відсутні patch-файли у git fixture, отриманому з тарбола, відсутній збережений `update.channel`, застарілі розташування install-record для plugin, відсутню persistence install-record marketplace і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є суворими помилками.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker runners також bind-mount лише потрібні домівки автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб external-CLI OAuth міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observability: `pnpm qa:otel:smoke` — це приватний lane перевірки source checkout для QA. Його навмисно не включено до package Docker release lanes, бо npm tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` встановлює запакований OpenClaw tarball глобально в Docker, налаштовує OpenAI через onboarding з env-ref і типово Telegram, запускає doctor і виконує один замоканий хід агента OpenAI. Повторно використайте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke перемикання update channel: `pnpm test:docker:update-channel-switch` встановлює запакований OpenClaw tarball глобально в Docker, перемикає з package `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикає назад на package `stable` і перевіряє статус оновлення.
- Smoke upgrade survivor: `pnpm test:docker:upgrade-survivor` встановлює запакований OpenClaw tarball поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналів, allowlists Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він запускає оновлення package плюс неінтерактивний doctor без live provider або ключів каналів, потім запускає loopback Gateway і перевіряє збереження config/state, а також startup/status budgets.
- Smoke published upgrade survivor: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, сіє реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого command recipe, перевіряє отриманий config, оновлює опубліковане встановлення до candidate tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, startup, `/healthz`, `/readyz` і RPC status budgets. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть aggregate scheduler розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` і розгорніть фікстури у формі issue через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, як-от `reported-issues`; Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Smoke session runtime context: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime context transcript плюс repair через doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використайте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke installer Docker: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache для своїх root, update і direct-npm контейнерів. Update smoke типово використовує npm `latest` як stable baseline перед оновленням до candidate tarball. Перевизначте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` локально або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки non-root installer зберігають ізольований npm cache, щоб cache entries, власником яких є root, не маскували поведінку user-local install. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає image з кореневого Dockerfile, сіє двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку retained workspace. Повторно використайте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshots ролей CDP охоплюють URL посилань, clickables, підвищені cursor, iframe refs і frame metadata.
- Регресія OpenAI Responses web_search minimal reasoning: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає замоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє provider schema і перевіряє, що raw detail з’являється в логах Gateway.
- MCP channel bridge (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP Pi bundle (справжній stdio MCP server + smoke embedded Pi profile allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (справжній Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, ClawHub kitchen-sink install/uninstall, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстури ClawHub.
- Smoke незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadata перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює install smoke, встановлення локальних фікстур ClawHub, marketplace updates, встановлення залежностей npm package і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` охоплює поведінку незміненого оновлення для встановлених plugins.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для окремих suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на remote shared image, скрипти завантажують його, якщо він ще не є локальним. QR і installer Docker tests зберігають власні Dockerfiles, бо вони перевіряють поведінку package/install, а не спільний built-app runtime.

Docker runner-и live-model також монтують поточний checkout лише для читання і
stage його в тимчасовий workdir всередині контейнера. Це зберігає runtime
image компактним, водночас усе ще запускаючи Vitest проти вашого точного локального source/config.
Крок staging пропускає великі локальні-only caches і app build outputs, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також app-local `.build` або
каталоги output Gradle, щоб Docker live runs не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live probes Gateway не запускали
справжніх workers каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live coverage Gateway
із цього Docker lane.
`test:docker:openwebui` — це вищорівневий compatibility smoke: він запускає
контейнер OpenClaw gateway з увімкненими OpenAI-сумісними HTTP endpoints,
запускає pinned контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
справжній chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися завантажити
image Open WebUI, а Open WebUI може знадобитися завершити власне cold-start setup.
Цей lane очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно deterministic і не потребує
справжнього облікового запису Telegram, Discord або iMessage. Він завантажує засіяний Gateway
container, запускає другий container, який породжує `openclaw mcp serve`, потім
перевіряє routed conversation discovery, transcript reads, attachment metadata,
поведінку live event queue, outbound send routing і channel +
permission notifications у стилі Claude через справжній stdio MCP bridge. Перевірка notification
інспектує raw stdio MCP frames напряму, тож smoke перевіряє те, що
bridge справді emits, а не лише те, що конкретний client SDK випадково expose.
`test:docker:pi-bundle-mcp-tools` deterministic і не потребує live
model key. Він збирає repo Docker image, запускає справжній stdio MCP probe server
всередині container, materializes цей server через embedded Pi bundle
MCP runtime, виконує tool, потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` deterministic і не потребує live model
key. Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
isolated cron turn і one-shot child turn `/subagents spawn`, потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke потоку plain-language (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для regression/debug workflow. Він може знову знадобитися для перевірки ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується до `/home/node/.profile` і завантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, завантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочої області та без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI у `$HOME` монтуються лише для читання у `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, як-от `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне повторне збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілю (не з середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити запит перевірки nonce, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний Gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + примусова автентифікація): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

Ми вже маємо кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Mock-виклик інструментів через реальний Gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють зв’язування сеансу та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли Skills перелічені в запиті, чи агент обирає правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи агент читає `SKILL.md` перед використанням і виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сеансу та межі sandbox.

Майбутні оцінювання мають передусім залишатися детермінованими:

- Виконавець сценаріїв, що використовує mock-провайдерів для перевірки викликів інструментів + порядку, читання файлів skill і зв’язування сеансу.
- Невеликий набір сценаріїв, сфокусованих на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-оцінювання (opt-in, з gate через змінні середовища) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
контракту інтерфейсу. Вони ітеруються всіма виявленими Plugin і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні файли швів і smoke-тестів; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналу або провайдера.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка зв’язування сеансу
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID тредів
- **directory** - API каталогу/реєстру
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
- Після додавання або модифікації каналу чи Plugin провайдера
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести виконуються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub провайдера або захоплення точної трансформації форми запиту)
- Якщо це за своєю природою лише live (ліміти частоти, політики автентифікації), тримайте live-тест вузьким і opt-in через змінні середовища
- Віддавайте перевагу націлюванню на найменший шар, який ловить помилку:
  - помилка конвертації/відтворення запиту провайдера → прямий тест моделей
  - помилка pipeline сеансу/історії/інструментів Gateway → live smoke Gateway або безпечний для CI mock-тест Gateway
- Захисний бар’єр обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із сегментами обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
