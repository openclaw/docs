---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні/e2e/живі набори, ранери Docker і що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-02T18:57:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 723d4769d13a83482bd4afcd1878579ba2b245c8e49cefc2794e865da1ab7dc7
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-запускачів. Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем із моделями/провайдерами.

<Note>
**QA-стек (qa-lab, qa-channel, live транспортні лінії)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA-канал](/uk/channels/qa-channel) — синтетичний транспортний plugin, який використовується сценаріями на основі репозиторію.

Ця сторінка описує запуск звичайних тестових наборів і Docker/Parallels-запускачів. Розділ про специфічні для QA запускачі нижче ([Специфічні для QA запускачі](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/каналу: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спершу віддавайте перевагу цільовим запускам, коли ітеруєте над одним збоєм.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-лінія на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки Gateway tool/image): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти продуктивності runtime: dispatch `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти ліній mock-provider, deep-profile і GPT 5.4 до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить показники завантаження Gateway на рівні джерел, пам’яті,
  plugin-pressure, повторюваного hello-loop фейкової моделі та запуску CLI.
- Docker live sweep моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невелику перевірку в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний хід із зображенням.
    Вимикайте додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають багаторазовий live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live matrix-завдання моделей,
    розбиті за провайдером.
  - Для сфокусованих повторних запусків CI dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдера до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    заплановані/release викликачі.
- Нативний smoke Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-лінію проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, перевіряє `/codex fast` і
    `/codex permissions`, а потім верифікує звичайну відповідь і маршрут вкладення зображення
    через нативне прив’язування plugin замість ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Запускає ходи Gateway-агента через належний plugin harness app-server Codex,
    перевіряє `/codex status` і `/codex models` та за замовчуванням виконує перевірки image,
    Cron MCP, sub-agent і Guardian. Вимикайте перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server Codex.
    Для сфокусованої перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke rescue-команди Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова перевірка «про всяк випадок» для поверхні rescue-команди каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фейковим Claude CLI у `PATH`
    і перевіряє, що нечіткий fallback планувальника перетворюється на аудитований типізований
    запис конфігурації.
- Docker smoke першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    валідує конфігурацію та перевіряє записи аудиту. Той самий шлях налаштування Ring 0
    також покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke вартості Moonshot/Kimi: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  transcript асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один випадок збою, віддавайте перевагу звуженню live-тестів через env-змінні allowlist, описані нижче.
</Tip>

## Специфічні для QA запускачі

Ці команди розміщені поруч з основними тестовими наборами, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у виділених workflow. `Parity gate` запускається на відповідних PR і
через ручний dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch із mock parity gate, live Matrix-лінією,
керованою Convex live Telegram-лінією та керованою Convex live Discord-лінією як
паралельними завданнями. Заплановані QA та release-перевірки передають Matrix `--profile fast`
явно, тоді як Matrix CLI і ручний workflow input за замовчуванням лишаються
`all`; ручний dispatch може shard-ити `all` на завдання `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` запускає parity плюс
швидкі Matrix і Telegram-лінії перед release approval, використовуючи
`mock-openai/gpt-5.5` для release transport-перевірок, щоб вони лишалися детермінованими
і уникали звичайного запуску provider-plugin. Ці live transport Gateway вимикають
пошук пам’яті; поведінка пам’яті лишається покритою QA parity-наборами.

Повні release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
коміту, а потім підтягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість перебудови
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway-воркерами. `qa-channel` за замовчуванням використовує паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість воркерів, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу, що означає помилку.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний провайдерський сервер на базі AIMock для експериментального
    покриття фікстур і protocol-mock без заміни лінії
    `mock-openai`, що враховує сценарії.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенч запуску Gateway разом із невеликим пакетом мокових сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведений підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    і не виглядають як регресія Gateway із навантаженням на кілька хвилин.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, якщо checkout ще не має
    свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux-VM Multipass.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані автентифікації QA, практичні для гостьової системи:
    ключі провайдерів на основі env, шлях до live-конфігурації QA-провайдера та `CODEX_HOME`,
    коли він присутній.
  - Каталоги виводу мають залишатися в корені репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт і підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm-tarball з поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний onboarding з OpenAI API-key, за замовчуванням налаштовує Telegram,
    перевіряє, що packaged plugin runtime завантажується без startup
    dependency repair, запускає doctor і виконує один локальний agent turn проти
    мокового OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію packaged-install
    з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke з built-app для транскриптів embedded runtime context.
    Він перевіряє, що прихований OpenClaw runtime context зберігається як
    non-display custom message замість витоку у видимий user turn,
    потім додає affected broken session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидатний пакет OpenClaw у Docker, запускає onboarding для installed-package,
    налаштовує Telegram через installed CLI, а потім повторно використовує
    live Telegram QA lane з цим installed package як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або Convex credential source, що й
    `pnpm openclaw qa telegram`. Для CI/release automation задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret присутні в CI,
    Docker wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions надає цю лінію як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Вона не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного кандидатного пакета. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого run, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler із профілями ліній smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
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

- Artifact proof завантажує tarball artifact з іншого Actions run:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через правки
    конфігурації.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перший configured doctor repair явно встановлює кожен відсутній downloadable
    plugin, а другий restart не запускає hidden dependency
    repair.
  - Також встановлює відомий старіший npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що candidate's
    post-update doctor очищає legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke у Parallels guests. Кожна
    вибрана платформа спершу встановлює запитаний baseline package, потім запускає
    installed команду `openclaw update` у тій самій гостьовій системі та перевіряє
    installed version, update status, gateway readiness і один локальний agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій з однією гостьовою системою. Використовуйте `--json` для шляху summary artifact і
    per-lane status.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб збої транспорту Parallels не могли
    використати решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед припущенням, що зовнішній wrapper завис.
  - Windows update може витрачати 10-15 хвилин на post-update doctor і package
    update work у холодній гостьовій системі; це все ще нормально, коли вкладений npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони ділять стан VM і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну поверхню bundled plugin, оскільки
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам agent
    turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний провайдерський сервер AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти одноразового Tuwunel homeserver на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, profile/scenario catalog, env vars і artifact layout: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти справжньої приватної групи, використовуючи driver і SUT bot tokens з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу, що означає помилку.
  - Потребує двох різних ботів в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від driver send request до observed SUT reply.

Live transport lanes використовують один стандартний contract, щоб нові транспорти не розходилися; per-lane coverage matrix розміщена в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий synthetic suite і не є частиною цієї матриці.

### Спільні Telegram credentials через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує exclusive lease з пулу на базі Convex, надсилає heartbeats
для цієї lease, поки лінія виконується, і звільняє lease під час shutdown.

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної role:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір credential role:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optional trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs для local-only development.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Maintainer admin commands (pool add/remove/list) вимагають
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI helpers для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live runs, щоб перевірити Convex site URL, broker secrets,
endpoint prefix, HTTP timeout і admin/list reachability без виведення
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

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє payload з неправильною структурою.

### Додавання каналу до QA

Архітектура та назви scenario-helper для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному шві хоста `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як “зростання реалістичності” (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: незвужені запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в поконфігураційні проєкти для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit-тести запускаються у виділеному шарді `unit-ui`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (автентифікація Gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Справжні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і loader публічної поверхні мають доводити fallback-поведінку широких `api.js` і
    `runtime-api.js` за допомогою згенерованих мінімальних fixtures Plugin, а не
    API справжнього вбудованого Plugin. Завантаження API справжніх Plugin належать до
    контрактних/integration-наборів, якими володіє Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Незвужений `pnpm test` запускає дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного native-процесу кореневого проєкту. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension витісняти непов’язані набори.
    - `pnpm test --watch` і далі використовує native-граф проєктів кореневого `vitest.config.ts`, бо цикл watch із багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної плати за запуск кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення джерел і локальні залежні вузли графа імпортів. Зміни конфігурації/налаштування/package не запускають тести широко, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підняття версій лише в release metadata запускає цільові перевірки version/config/root-dependency із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell-синтаксис для live Docker auth-скриптів і dry-run live Docker scheduler. Зміни `package.json` включаються лише коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependency, export, version та іншої package-поверхні все ще використовують ширші guards.
    - Import-light unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих utility-зон спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли лишаються на наявних lanes.
    - Вибрані допоміжні source-файли `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними сусідніми тестами в цих light lanes, тому зміни helper уникають повторного запуску всього важкого набору для цього каталогу.
    - `auto-reply` має виділені buckets для верхньорівневих core helpers, верхньорівневих integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім Node-хвостом.
    - Звичайний PR/main CI навмисно пропускає пакетний extension sweep і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих Plugin/extension-heavy наборів на реліз-кандидатах.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані регресії helper для меж чистої маршрутизації та нормалізації.
    - Підтримуйте integration-набори embedded runner справними:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction все ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper
      не є достатньою заміною цих integration-шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у кореневих проєктах, e2e та live-конфігураціях.
    - Кореневий UI lane зберігає своє налаштування `jsdom` і optimizer, але також працює на
      спільному неізольованому runner.
    - Кожен шард `pnpm test` успадковує ті самі типові `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли і
      не запускає lint, typecheck або tests.
    - Запускайте `pnpm check:changed` явно перед передаванням або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` типово спрямовується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише коли agent
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають таку саму поведінку маршрутизації,
      лише з вищою межею worker.
    - Локальне auto-scaling worker навмисно консервативне і знижує інтенсивність,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/config-файли як
      `forceRerunTriggers`, щоб rerun у changed-mode залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування кешу для прямого profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс
      output import-breakdown.
    - `pnpm test:perf:imports:changed` звужує той самий profiling view до
      файлів, змінених від `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях конфігурації як ключ; include-pattern CI
      shards додають назву шарда, щоб відфільтровані шарди можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      mock-айте цей шов напряму замість deep-import runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native-шляхом кореневого проєкту для цього committed
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточне
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile головного потоку для
      накладних витрат запуску й transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає справжній loopback Gateway із diagnostics, увімкненою типово
  - Проганяє synthetic gateway message, memory і large-payload churn через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, synthetic RSS samples лишаються нижче pressure budget, а глибини per-session queue повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для follow-up регресій стабільності, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Runtime defaults:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, локально: типово 1).
  - Типово запускається в silent mode, щоб зменшити накладні витрати console I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Обсяг:
  - Наскрізна поведінка Gateway з кількома інстансами
  - WebSocket/HTTP-поверхні, pairing вузлів і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Справжні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільнішим)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Перевіряє віддалено-канонічну поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Тільки за явним увімкненням; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI-бінарник або script-обгортку

### Живі (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і живі тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Область:
  - “Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?”
  - Виявляє зміни формату провайдера, особливості виклику інструментів, проблеми автентифікації та поведінку обмеження частоти
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти частоти
  - Краще запускати звужені піднабори замість “усього”
- Живі запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- Типово живі запуски все ще ізолюють `HOME` і копіюють конфігураційні/автентифікаційні матеріали в тимчасову тестову home-директорію, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб живі тести використовували вашу реальну home-директорію.
- `pnpm test:live` тепер типово працює в тихішому режимі: залишає progress-вивід `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи bootstrap gateway/шум Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API-ключів (специфічна для провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live перевизначення через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу на відповідях про rate limit.
- Progress/heartbeat-вивід:
  - Живі набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдерів було видно як активні навіть коли перехоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway транслювалися негайно під час живих запусків.
  - Налаштовуйте direct-model heartbeats через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте gateway/probe heartbeats через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Чіпаєте gateway networking / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “мій бот недоступний” / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Живі (мережеві) тести

Для живої матриці моделей, CLI backend smoke-тестів, ACP smoke-тестів, Codex app-server
harness і всіх живих тестів media-provider (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), а також обробки облікових даних для живих запусків, див.
[Тестування живих наборів](/uk/help/testing-live). Для спеціального checklist оновлень і
перевірки Plugin див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки "works in Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують вашу локальну config-директорію й workspace (і підвантажують `~/.profile`, якщо змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово мають меншу межу smoke-перевірки, щоб повний Docker sweep лишався практичним:
  `test:docker:live-models` типово задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли ви
  явно хочете більший вичерпний scan.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ є лише runner Node/Git для lanes install/update/plugin-dependency; ці lanes монтують попередньо зібраний tarball. Functional-образ встановлює той самий tarball у `/app` для lanes функціональності built-app. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`; planner-логіка міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. Агрегат використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує process slots, тоді як resource caps не дають важким live, npm-install і multi-service lanes стартувати всім одночасно. Якщо окремий lane важчий за активні caps, scheduler все одно може запустити його, коли pool порожній, а потім залишає його єдиним запущеним, доки capacity знову не стане доступною. Типові значення: 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише коли Docker host має більший запас ресурсів. Runner типово виконує Docker preflight, видаляє застарілі OpenClaw E2E containers, друкує статус кожні 30 секунд, зберігає timings успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці timings, щоб у наступних запусках першими стартували довші lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений lane manifest без збірки або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI plan для вибраних lanes, package/image needs і credentials.
- `Package Acceptance` — це GitHub-native package gate для "чи цей installable tarball працює як продукт?" Він визначає один candidate package із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість перепакування вибраного ref. Профілі упорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) щодо package/update/plugin contract, published-upgrade survivor matrix, release defaults і failure triage.
- Build і release checks запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить статичний built graph від `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо pre-dispatch startup імпортує package dependencies, як-от Commander, prompt UI, undici або logging, до command dispatch; він також утримує bundled gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Сумісність Package Acceptance legacy обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини metadata shipped-package: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у tarball-derived git fixture, відсутній persisted `update.channel`, legacy plugin install-record locations, відсутня marketplace install-record persistence і config metadata migration під час `plugins update`. Для packages після `2026.4.25` ці paths є суворими failures.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` завантажують один або кілька реальних containers і перевіряють higher-level integration paths.

Live-model Docker runners також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб external-CLI OAuth міг оновлювати tokens без зміни host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово покриває Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` — приватна QA-лінія source-checkout. Вона навмисно не входить до package Docker release lanes, тому що npm tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює упакований tarball OpenClaw у Docker, налаштовує OpenAI через env-ref онбординг і типово Telegram, запускає doctor і виконує один змоканий хід агента OpenAI. Повторно використайте попередньо зібраний tarball з `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості з `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` глобально встановлює упакований tarball OpenClaw у Docker, перемикається з package `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на package `stable` і перевіряє статус оновлення.
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` встановлює упакований tarball OpenClaw поверх брудного fixture старого користувача з агентами, конфігурацією каналів, allowlists Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він запускає package update і неінтерактивний doctor без live provider або ключів каналів, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети startup/status.
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, сіє реалістичні файли наявного користувача, налаштовує цей baseline через вбудований рецепт команд, перевіряє отриману конфігурацію, оновлює цю опубліковану інсталяцію до tarball-кандидата, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, startup, `/healthz`, `/readyz` і бюджети RPC status. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `all-since-2026.4.23`, і розгорніть issue-подібні fixtures через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту встановлення зовнішніх OpenClaw Plugin. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime context і ремонт doctor для зачеплених дубльованих гілок prompt-rewrite.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих image providers замість зависання. Повторно використайте попередньо зібраний tarball з `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості з `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache між контейнерами root, update і direct-npm. Update smoke типово використовує npm `latest` як stable baseline перед оновленням до tarball-кандидата. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки non-root installer тримають ізольований npm cache, щоб записи cache, які належать root, не маскували поведінку user-local install. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає root Dockerfile image, сіє двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого workspace. Повторно використайте install-smoke image з `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image і шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots покривають link URLs, cursor-promoted clickables, iframe refs і frame metadata.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово спричиняє відхилення provider schema і перевіряє, що сирі деталі з’являються в логах Gateway.
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (реальний Gateway + демонтаж stdio MCP child після ізольованого cron і one-shot subagent run): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update smoke для локального path, `file:`, npm registry з hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture server ClawHub.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` покриває install/update smoke для локального path, `file:`, npm registry з hoisted dependencies, git moving refs, fixtures ClawHub, marketplace updates і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` покриває поведінку unchanged update для встановлених plugins.

Щоб попередньо зібрати й повторно використати спільний functional image вручну:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо він ще не локальний. Docker-тести QR та installer зберігають власні Dockerfiles, тому що вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker runners для live-model також монтують поточний checkout лише для читання і
стейджать його у тимчасовий workdir всередині контейнера. Це зберігає runtime
image компактним, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок staging пропускає великі локальні cache і outputs збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також app-local `.build` або
output directories Gradle, щоб Docker live runs не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні Telegram/Discord/тощо channel workers всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage з цієї Docker-лінії.
`test:docker:openwebui` — це високорівневий compatibility smoke: він запускає
контейнер OpenClaw gateway з увімкненими OpenAI-compatible HTTP endpoints,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat request через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися завантажити
image Open WebUI, а Open WebUI може знадобитися завершити власне cold-start setup.
Ця лінія очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload, як-от `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального акаунта Telegram, Discord або iMessage. Він завантажує seeded Gateway
container, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, transcript reads, attachment metadata,
поведінку live event queue, outbound send routing і Claude-style channel +
permission notifications через реальний stdio MCP bridge. Перевірка notification
інспектує сирі stdio MCP frames напряму, тому smoke перевіряє те, що
bridge справді випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає repo Docker image, запускає реальний stdio MCP probe server
всередині контейнера, матеріалізує цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для regression/debug workflows. Він може знову знадобитися для перевірки ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) змонтовано до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) змонтовано до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) змонтовано до `/home/node/.profile` і зчитується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, зчитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочого простору та без монтування зовнішньої автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) змонтовано до `/home/node/.npm-global` для кешованих інсталяцій CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне повторне збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілю (а не з середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke-перевірки Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити запит перевірки nonce, який використовує smoke-перевірка Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування документації: `pnpm check:docs`.
Запускайте повну валідацію якорів Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «справжнього конвеєра» без справжніх провайдерів:

- Виклики інструментів Gateway (макет OpenAI, справжній gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + примусова автентифікація): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Макет виклику інструментів через справжній gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють з’єднання сеансів і вплив конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли Skills перелічені в запиті, чи вибирає агент правильну skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти робочих процесів:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сеансу та межі пісочниці.

Майбутні оцінювання мають насамперед залишатися детермінованими:

- Runner сценаріїв із макетами провайдерів для перевірки викликів інструментів + порядку, читання файлів skill і з’єднання сеансів.
- Невеликий набір сценаріїв, сфокусованих на skill (використати або уникнути, gating, prompt injection).
- Опціональні live-оцінювання (за явним увімкненням, обмежені змінними середовища) лише після появи безпечного для CI набору.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
інтерфейсному контракту. Вони проходять усі виявлені plugins і запускають набір
перевірок форми та поведінки. Стандартна unit-смуга `pnpm test` навмисно
пропускає ці файли спільних seams і smoke-перевірок; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язування сеансу
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID потоку
- **directory** - API каталогу/реєстру учасників
- **group-policy** - Примусове застосування групової політики

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Проби статусу каналу
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
- Після додавання або змінення каналу чи провайдерського plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести виконуються в CI і не потребують справжніх API-ключів.

## Додавання регресій (настанови)

Коли виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub провайдер або захоплення точної трансформації форми запиту)
- Якщо це за своєю суттю лише live (обмеження частоти, політики автентифікації), залиште live-тест вузьким і ввімкненим лише явно через змінні середовища
- Надавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/відтворення запиту провайдера → прямий тест моделей
  - помилка конвеєра gateway сеанс/історія/інструмент → gateway live smoke або безпечний для CI gateway mock test
- Запобіжник обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із сегментами обходу відхиляються.
  - Якщо додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було пропустити непомітно.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
