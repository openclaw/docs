---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Комплект для тестування: набори модульних/e2e/живих тестів, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-04T21:07:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2c4210847ca14db8aebd17e3a5cf84cf09190ead1d34e8c3068eab20557dbf6
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (модульний/інтеграційний, e2e, live) і невеликий набір
ранерів Docker. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він свідомо _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, live транспортні лінії)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, написання сценаріїв.
- [Матричний QA](/uk/concepts/qa-matrix) — довідка для `pnpm openclaw qa matrix`.
- [Канал QA](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовується сценаріями на основі репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і ранерів Docker/Parallels. Розділ нижче про специфічні для QA ранери ([Специфічні для QA ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і відсилає до наведених вище довідкових матеріалів.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи розширень/каналів: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерацій над одним збоєм спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на основі Docker: `pnpm qa:lab:up`
- QA-лінія на основі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли змінюєте тести або хочете мати більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + проби інструментів/зображень Gateway): `pnpm test:live`
- Тихий запуск одного live-файла: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність runtime: запустіть `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти ліній mock-provider, deep-profile і GPT 5.4 до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить показники запуску Gateway на рівні вихідного коду, пам’яті,
  plugin-навантаження, повторюваного fake-model hello-loop і запуску CLI.
- Docker live-перебір моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невелику пробу в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний хід із зображенням.
    Вимкніть додаткові проби за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають багаторазовий workflow live/E2E з
    `include_live_suites: true`, що включає окремі Docker live matrix-завдання моделей,
    розбиті за провайдерами.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    запланованих/release викликачів.
- Native Codex smoke-тест прив’язаного чату: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-лінію проти шляху app-server Codex, прив’язує синтетичне
    Slack DM за допомогою `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native прив’язку Plugin замість ACP.
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через належний Plugin harness app-server Codex,
    перевіряє `/codex status` і `/codex models` і за замовчуванням виконує проби image,
    cron MCP, sub-agent і Guardian. Вимкніть пробу sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої app-server
    Codex. Для сфокусованої перевірки sub-agent вимкніть інші проби:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після проби sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Smoke-тест команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова перевірка з подвійним захистом для поверхні команди порятунку message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker smoke-тест планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що нечіткий fallback планувальника перетворюється на аудитований типізований
    запис конфігурації.
- Docker smoke-тест першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + записи SecretRef,
    перевіряє конфігурацію та записи аудиту. Той самий шлях налаштування Ring 0 також
    покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke-тест вартості Moonshot/Kimi: із встановленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт помічника зберігає нормалізоване `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.
</Tip>

## Специфічні для QA ранери

Ці команди розташовані поруч з основними наборами тестів, коли потрібен реалізм QA-lab:

CI запускає QA Lab у спеціальних workflow. Agentic parity вкладено в
`QA-Lab - All Lanes` і release validation, а не в окремий PR workflow.
Широка валідація має використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. `QA-Lab - All Lanes`
запускається щоночі на `main` і з ручного dispatch з mock parity-лінією, live
Matrix-лінією, керованою Convex live Telegram-лінією і керованою Convex live Discord
лінією як паралельними завданнями. Запланований QA і release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і вхід ручного workflow за замовчуванням
залишаються `all`; ручний dispatch може розбити `all` на завдання `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс швидкі лінії Matrix і Telegram перед затвердженням релізу,
використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими та уникали звичайного запуску provider-plugin. Ці live transport
Gateway вимикають пошук пам’яті; поведінка пам’яті залишається покритою QA parity
наборами.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний образ
`ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
коміту, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA, підкріплені репозиторієм, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками gateway. `qa-channel` за замовчуванням має паралельність 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, коли будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення, що позначає помилку.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу, не замінюючи лінію `mock-openai`, обізнану зі сценаріями.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає живий випробувальний комплекс OpenAI Kitchen Sink plugin через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє інвентар поверхні plugin SDK,
    перевіряє `/healthz` і `/readyz`, записує докази CPU/RSS gateway,
    запускає живий хід OpenAI і перевіряє діагностику для ворожих сценаріїв.
    Потребує живої автентифікації OpenAI, наприклад `OPENAI_API_KEY`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенчмарк запуску gateway плюс невеликий пакет мок-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі спостереження високого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    без вигляду регресії, де gateway був завантажений хвилинами.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, якщо checkout ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Живі запуски передають підтримувані входи автентифікації QA, практичні для гостьової системи:
    ключі провайдера з env, шлях до конфігурації живого провайдера QA і `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний звіт QA + підсумок і журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-підкріплений сайт QA для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding із ключем OpenAI API, за замовчуванням налаштовує Telegram,
    перевіряє, що запакований runtime plugin завантажується без стартового
    ремонту залежностей, запускає doctor і виконує один локальний agent turn проти
    mocked OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію
    packaged-install із Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke для зібраного застосунку щодо вбудованих transcript runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    custom message без відображення, а не витікає у видимий user turn,
    потім засіває уражений зламаний session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його до active branch із backup.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидат пакета OpenClaw у Docker, запускає onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб протестувати resolved local tarball замість
    встановлення з registry.
  - Використовує ті самі Telegram env credentials або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/release automation задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і role secret. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і Convex role secret наявні в CI,
    Docker wrapper автоматично вибирає Convex.
  - Wrapper перевіряє env облікових даних Telegram або Convex на хості перед
    роботою Docker build/install. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише тоді, коли навмисно налагоджуєте pre-credential setup.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions надає цю лінію як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і Convex CI credential leases.
- GitHub Actions також надає `Package Acceptance` для side-run product proof
  проти одного candidate package. Він приймає trusted ref, published npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, потім запускає
  наявний Docker E2E scheduler із smoke, package, product, full або custom
  lane profiles. Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого artifact `package-under-test`.
  - Останній beta product proof:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказ exact tarball URL потребує digest:

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
  - Пакує й встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, потім вмикає bundled channel/plugins через config
    edits.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перший налаштований doctor repair явно встановлює кожен missing downloadable
    plugin, а другий restart не запускає hidden dependency
    repair.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає debris legacy plugin dependency без harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke на гостях Parallels. Кожна
    вибрана платформа спершу встановлює запитаний baseline package, потім запускає
    встановлену команду `openclaw update` у тому самому guest і перевіряє
    installed version, update status, gateway readiness і один local agent
    turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерації на одному guest. Використовуйте `--json` для summary artifact path і
    per-lane status.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для live agent-turn proof.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгорніть довгі локальні запуски timeout на хості, щоб зависання транспорту Parallels не
    спожили решту testing window:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені lane logs у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`
    перед припущенням, що outer wrapper завис.
  - Windows update може витрачати 10-15 хвилин на post-update doctor і package
    update work на cold guest; це все ще нормально, коли nested npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke lanes. Вони ділять VM state і можуть конфліктувати під час
    snapshot restore, package serving або guest gateway state.
  - Post-update proof запускає звичайну bundled plugin surface, оскільки
    capability facades, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам agent
    turn перевіряє лише просту text response.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний provider server AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти одноразового Docker-backed Tuwunel homeserver. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, profile/scenario catalog, env vars і artifact layout: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення, що позначає помилку.
  - Потребує двох різних bots в одній приватній групі, причому SUT bot має відкривати Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох bots і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios містять RTT від driver send request до observed SUT reply.

Live transport lanes мають один стандартний контракт, щоб нові transports не розходилися; per-lane coverage matrix розміщено в [Огляд QA → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий synthetic suite і не є частиною цієї matrix.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує exclusive lease із Convex-backed pool, надсилає heartbeats
для цього lease, доки lane виконується, і звільняє lease під час shutdown.

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs для local-only development.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди супровідника (pool add/remove/list) вимагають саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-допоміжні команди для супровідників:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети брокера,
префікс endpoint, HTTP-таймаут і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI
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

Форма payload для виду Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє неправильно сформовані payload.

### Додавання каналу до QA

Архітектура та назви допоміжних сценарних компонентів для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати транспортний runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалістичності» (і зростання нестабільності/вартості):

### Модульні / інтеграційні (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в поконфігураційні проєкти для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні тести UI запускаються в окремому шарді `unit-ui`
- Обсяг:
  - Чисті модульні тести
  - Внутрішньопроцесні інтеграційні тести (автентифікація gateway, маршрутизація, інструменти, parsing, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести резолвера та завантажувача публічної поверхні мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` за допомогою згенерованих крихітних plugin-фікстур, а не
    реальних source API вбудованого plugin. Реальні завантаження API plugin належать до
    contract/integration-наборів, власником яких є plugin.

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це знижує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension витісняти непов’язані набори.
    - `pnpm test --watch` і далі використовує native root граф проєктів `vitest.config.ts`, бо multi-shard watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явні цілі файлів/директорій через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості старту root project.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі редагування тестів, сусідні файли `*.test.ts`, явні source-мапінги та локальні залежні елементи import graph. Редагування config/setup/package не запускають широкі тести, якщо явно не використати `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Version bump лише для release metadata запускають цільові перевірки version/config/root-dependency з guard, який відхиляє package-зміни поза верхньорівневим полем version.
    - Редагування live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для скриптів live Docker auth і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependency, export, version та інші package-surface редагування й далі використовують ширші guards.
    - Import-light модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-зон спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані source-файли helpers у `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих легких lanes, тож редагування helpers уникають повторного запуску повного важкого набору для цієї директорії.
    - `auto-reply` має окремі кошики для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy кошик не володів усім хвостом Node.
    - Звичайний PR/main CI навмисно пропускає batch sweep extension і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли змінюєте вхідні дані discovery для message-tool або runtime
      context compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж routing і normalization.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only тести
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Пул Vitest і типові налаштування isolation">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e і live configs.
    - Root UI lane зберігає свій setup `jsdom` і optimizer, але також працює на
      спільному non-isolated runner.
    - Кожен шард `pnpm test` успадковує ті самі типові налаштування `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node
      процесів Vitest, щоб зменшити V8 compile churn під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно staged відформатовані файли й
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` типово проходить через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішує, що редагування harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      лише з вищою межею workers.
    - Локальне auto-scaling workers навмисно консервативне й знижує активність,
      коли load average хоста вже високий, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config файли як
      `forceRerunTriggers`, щоб changed-mode reruns залишалися коректними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну cache location для прямого profiling.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration разом із
      import-breakdown output.
    - `pnpm test:perf:imports:changed` звужує той самий profiling view до
      файлів, змінених від `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config runs використовують шлях config як ключ; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test і далі витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam напряму замість deep-importing runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із native root-project path для цього committed
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточне
      dirty tree, спрямовуючи список changed file через
      `scripts/test-projects.mjs` і root конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує runner CPU+heap profiles для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway із діагностикою, увімкненою типово
  - Проганяє synthetic gateway message, memory і large-payload churn через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers для persistence diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, synthetic RSS samples не перевищують pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для stability-regression follow-up, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` та E2E-тести вбудованих plugins у `extensions/`
- Типові параметри середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість воркерів (CI: до 2, локально: типово 1).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати консольного вводу-виводу.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного консольного виводу.
- Область:
  - Наскрізна поведінка Gateway у кількох екземплярах
  - Поверхні WebSocket/HTTP, сполучення вузлів і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли ввімкнено в конвеєрі)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у модульних тестах (може бути повільніше)

### E2E: базова перевірка backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює пісочницю з тимчасового локального Dockerfile
  - Перевіряє backend OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє канонічну поведінку віддаленої файлової системи через sandbox fs bridge
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує тестовий Gateway і пісочницю
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нетипового CLI-бінарника або wrapper-скрипта

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` та live-тести вбудованих plugins у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (задає `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?»
  - Виявляти зміни форматів провайдерів, особливості виклику інструментів, проблеми автентифікації та поведінку обмежень швидкості
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти швидкості
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски підключають `~/.profile`, щоб отримати відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють матеріали конфігурації/автентифікації в тимчасовий тестовий home, щоб модульні фікстури не могли змінити ваш реальний `~/.openclaw`.
- Задавайте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає прогрес-вивід `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи початкового запуску Gateway/повідомлення Bonjour. Задайте `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні логи запуску.
- Ротація API-ключів (залежно від провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях про обмеження швидкості.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів видимо активні навіть тоді, коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway одразу транслювалися під час live-запусків.
  - Налаштовуйте Heartbeat для прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для Gateway/проб через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни мережевої взаємодії Gateway / протоколу WS / сполучення: додайте `pnpm test:e2e`
- Діагностика «мій бот не працює» / відмов, специфічних для провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Live-тести (з мережевою взаємодією)

Для live-матриці моделей, базових перевірок CLI backend, базових перевірок ACP, harness Codex app-server
та всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), а також обробки облікових даних для live-запусків, див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального контрольного списку оновлень і
перевірки plugins див.
[Тестування оновлень і plugins](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і підключають `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово мають менший smoke-ліміт, щоб повна Docker-перевірка залишалася практичною:
  `test:docker:live-models` типово задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли ви
  явно хочете більший повний scan.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ є лише Node/Git runner для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний tarball. Functional-образ встановлює той самий tarball у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як ліміти ресурсів не дають важким live-, npm-install- і multi-service-напрямам стартувати всім одночасно. Якщо один напрям важчий за активні ліміти, планувальник усе одно може запустити його, коли пул порожній, а потім тримає його запущеним наодинці, доки місткість знову не стане доступною. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу ресурсів. Runner типово виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках першими стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб пакетів/образів і облікових даних.
- `Package Acceptance` — це нативний для GitHub package gate для питання "чи цей інстальований tarball працює як продукт?" Він визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E-напрями проти саме цього tarball замість перепакування вибраного ref. Профілі впорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і plugins](/uk/help/testing-updates-plugins) щодо контракту package/update/plugin, матриці published-upgrade survivor, типових параметрів релізу та triage відмов.
- Перевірки збірки й релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист обходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо pre-dispatch startup імпортує залежності пакетів, як-от Commander, prompt UI, undici або logging, до dispatch команди; він також утримує bundled gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також охоплює root help, onboard help, doctor help, status, config schema і команду списку моделей.
- Legacy compatibility Package Acceptance обмежено версією `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише прогалини метаданих shipped-package: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у tarball-derived git fixture, відсутній persisted `update.channel`, legacy plugin install-record locations, відсутня marketplace install-record persistence і config metadata migration під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є strict failures.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker runners також bind-mount лише потрібні домівки автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у container home перед запуском, щоб external-CLI OAuth міг оновлювати tokens без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-перевірка прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі суворим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-перевірка бекенда CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-перевірка обв’язки сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-перевірка спостережуваності: `pnpm qa:otel:smoke` — це приватна гілка перевірки QA для checkout вихідного коду. Вона навмисно не входить до гілок Docker-релізу пакета, оскільки npm-архів не містить QA Lab.
- Жива smoke-перевірка Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-перевірка онбордингу/каналу/агента npm-архіву: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює упакований архів OpenClaw у Docker, налаштовує OpenAI через онбординг із посиланням на env і типово Telegram, запускає doctor і виконує один змодельований хід агента OpenAI. Повторно використовуйте попередньо зібраний архів через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-перевірка перемикання каналу оновлення: `pnpm test:docker:update-channel-switch` глобально встановлює упакований архів OpenClaw у Docker, перемикається з пакета `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на пакет `stable` і перевіряє статус оновлення.
- Smoke-перевірка виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює упакований архів OpenClaw поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналу, allowlist плагінів, застарілим станом залежностей Plugin і наявними файлами workspace/session. Вона запускає оновлення пакета плюс неінтерактивний doctor без ключів live-провайдера або каналу, потім запускає loopback Gateway і перевіряє збереження config/state, а також бюджети запуску/статусу.
- Smoke-перевірка виживання після опублікованого оновлення: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює цю опубліковану інсталяцію до кандидатного архіву, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегувальний планувальник розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `all-since-2026.4.23`, і розгорнути фікстури у формі issues через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту інсталяції зовнішнього OpenClaw Plugin. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Smoke-перевірка runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту в transcript, а також repair через doctor для зачеплених дубльованих гілок переписування prompt.
- Smoke-перевірка глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих image providers замість зависання. Повторно використовуйте попередньо зібраний архів через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-перевірка Docker-інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш між контейнерами root, update і direct-npm. Smoke-перевірка оновлення типово використовує npm `latest` як stable baseline перед оновленням до кандидатного архіву. Локально перевизначте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` у workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm-кеш, щоб записи кешу, що належать root, не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm під час локальних повторних запусків.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Smoke-перевірка CLI видалення агентами спільного workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає root Dockerfile image, засіває двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє коректний JSON та поведінку зі збереженим workspace. Повторно використовуйте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережева взаємодія Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-перевірка snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що snapshots ролей CDP охоплюють URL посилань, clickables, підвищені курсором, iframe refs і frame metadata.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змодельований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення schema провайдером і перевіряє, що raw detail з’являється в логах Gateway.
- Міст каналу MCP (засіяний Gateway + stdio bridge + smoke-перевірка raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP Pi bundle (реальний stdio MCP server + smoke-перевірка вбудованого Pi profile allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Плагіни (smoke-перевірка install/update для локального path, `file:`, npm registry з hoisted dependencies, рухомих git refs, ClawHub kitchen-sink, marketplace updates і enable/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний fixture server ClawHub.
- Smoke-перевірка незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-перевірка матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює упакований архів OpenClaw у порожній контейнер, встановлює npm-плагін, перемикає enable/disable, підвищує та знижує його версію через локальний npm registry, видаляє встановлений код, потім перевіряє, що uninstall все одно видаляє застарілий стан, одночасно логуючи метрики RSS/CPU для кожної фази життєвого циклу.
- Smoke-перевірка metadata перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Плагіни: `pnpm test:docker:plugins` охоплює smoke-перевірку install/update для локального path, `file:`, npm registry з hoisted dependencies, рухомих git refs, фікстур ClawHub, marketplace updates і enable/inspect Claude-bundle. `pnpm test:docker:plugin-update` охоплює поведінку незміненого оновлення для встановлених плагінів. `pnpm test:docker:plugin-lifecycle-matrix` охоплює встановлення npm-плагіна з відстеженням ресурсів, enable, disable, upgrade, downgrade і uninstall за відсутнього коду.

Щоб вручну попередньо зібрати й повторно використати спільний функціональний image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних suites, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти pull його, якщо він ще не доступний локально. QR і Docker-тести інсталятора зберігають власні Dockerfiles, оскільки вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Запускачі Docker для live-моделей також монтують поточний checkout лише для читання і
розгортають його в тимчасову робочу директорію всередині контейнера. Це зберігає runtime-образ
компактним, водночас запускаючи Vitest саме з вашим локальним вихідним кодом/конфігурацією.
Етап розгортання пропускає великі локальні кеші та вихідні артефакти збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку `.build` або
директорії виводу Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки Gateway не запускали
реальні воркери каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття Gateway
з цієї Docker-смуги.
`test:docker:openwebui` — це вищорівневий smoke-тест сумісності: він запускає контейнер
Gateway OpenClaw з увімкненими HTTP-ендпойнтами, сумісними з OpenAI,
запускає контейнер Open WebUI із зафіксованою версією проти цього Gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
реальний чат-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
образ Open WebUI, а Open WebUI може знадобитися завершити власне налаштування холодного старту.
Ця смуга очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerизованих запусках.
Успішні запуски виводять невелике JSON-навантаження на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded-контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення каналів +
дозволів у стилі Claude через реальний stdio-міст MCP. Перевірка сповіщень
безпосередньо інспектує сирі stdio-кадри MCP, тому smoke-тест перевіряє те, що
міст фактично випромінює, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live-ключа
моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio-пробний сервер MCP
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP пакета Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live-ключа моделі.
Він запускає seeded Gateway з реальним stdio-пробним сервером MCP, виконує
ізольований Cron-turn і одноразовий дочірній turn `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний ACP smoke-тест тредів простою мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для регресійних/налагоджувальних workflow. Він може знову знадобитися для перевірки маршрутизації ACP-тредів, тому не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові директорії конфігурації/робочого простору та без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується до `/home/node/.npm-global` для кешованих установлень CLI всередині Docker
- Зовнішні директорії/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед початком тестів
  - Директорії за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні директорії/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб забезпечити надходження облікових даних зі сховища профілю (не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway відкриває для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити зафіксований тег образу Open WebUI

## Санітарна перевірка документації

Запускайте перевірки документації після редагувань документації: `pnpm check:docs`.
Запускайте повну перевірку anchors Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Offline-регресія (безпечна для CI)

Це регресії “реального pipeline” без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальні gateway + agent loop): `src/gateway/gateway.test.ts` (кейс: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + автентифікація enforced): `src/gateway/gateway.test.ts` (кейс: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як “оцінювання надійності агента”:

- Mock-виклик інструментів через реальні Gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard-потоки, які перевіряють wiring сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічені в prompt, чи агент вибирає правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи агент читає `SKILL.md` перед використанням і виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають передусім залишатися детермінованими:

- Scenario runner із mock-провайдерами для перевірки викликів інструментів + порядку, читання файлів skill і wiring сесії.
- Невеликий набір сценаріїв, сфокусованих на skill (використати чи уникнути, gating, prompt injection).
- Необов’язкові live-оцінювання (opt-in, env-gated) лише після появи безпечного для CI набору.

## Контрактні тести (форма Plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
контракту інтерфейсу. Вони ітерують усі виявлені Plugins і запускають набір
перевірок форми та поведінки. Стандартна unit-смуга `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - базова форма Plugin (id, name, capabilities)
- **setup** - контракт setup wizard
- **session-binding** - поведінка прив’язування сесії
- **outbound-payload** - структура payload повідомлення
- **inbound** - обробка вхідних повідомлень
- **actions** - обробники дій каналу
- **threading** - обробка ID тредів
- **directory** - API директорії/списку учасників
- **group-policy** - застосування групової політики

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - probes статусу каналу
- **registry** - форма registry Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - контракт auth flow
- **auth-choice** - вибір/selection auth
- **catalog** - API каталогу моделей
- **discovery** - виявлення Plugin
- **loader** - завантаження Plugin
- **runtime** - runtime провайдера
- **shape** - форма/інтерфейс Plugin
- **wizard** - setup wizard

### Коли запускати

- Після зміни exports або subpaths plugin-sdk
- Після додавання або змінення каналу чи провайдерського Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести виконуються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену наживо:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub провайдера або захопіть точне перетворення форми запиту)
- Якщо це за своєю природою лише live-випадок (rate limits, auth policies), тримайте live-тест вузьким і opt-in через змінні середовища
- Віддавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/відтворення запиту провайдера → прямий тест моделей
  - помилка pipeline сесії/історії/інструментів Gateway → live-smoke Gateway або безпечний для CI mock-тест Gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить по одній sampled-цілі на клас SecretRef з метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-сегментами відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було мовчки пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
