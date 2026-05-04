---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: unit/e2e/live-набори, Docker-ранери та що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-04T23:56:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d051bf6a01f6caf7755ad1d7107f21ae2d440b55a65bb7f18ee4a81f5f0e3b2
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір тестів (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, під час налагодження).
- Як live-тести виявляють облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовується сценаріями з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ про QA-специфічні ранери нижче ([QA-специфічні ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору тестів на просторій машині: `pnpm test:max`
- Прямий цикл Vitest watch: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи розширень/каналів: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спершу надавайте перевагу цільовим запускам, коли ітеруєте над одним падінням.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-смуга на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви торкаєтеся тестів або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність під час виконання: запустіть `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти смуг mock-provider, deep-profile і GPT 5.4 до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також включає показники завантаження Gateway на рівні джерел, пам’яті,
  Plugin-pressure, повторюваного fake-model hello-loop і старту CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невелику перевірку в стилі читання файлу.
    Моделі, метадані яких оголошують вхід `image`, також виконують крихітний хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте падіння провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають багаторазовий live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model matrix jobs,
    розбиті за провайдером.
  - Для сфокусованих повторних запусків CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додайте нові високосигнальні секрети провайдера до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    запланованих/release-викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через нативну прив’язку Plugin замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через harness app-server Codex, який належить Plugin,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимкніть перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші падіння Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова ретельна перевірка поверхні rescue-команди каналу повідомлень.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI у `PATH`
    і перевіряє, що нечіткий fallback планувальника перетворюється на аудитований типізований
    запис конфігурації.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord Plugin + SecretRef,
    перевіряє конфігурацію й перевіряє audit entries. Той самий шлях налаштування Ring 0
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізований `usage.cost`.

<Tip>
Коли вам потрібен лише один випадок падіння, надавайте перевагу звуженню live-тестів через env vars allowlist, описані нижче.
</Tip>

## QA-специфічні ранери

Ці команди розташовані поруч із головними наборами тестів, коли потрібен реалізм QA-lab:

CI запускає QA Lab у dedicated workflows. Agentic parity вкладено під
`QA-Lab - All Lanes` і release validation, а не в окремий PR workflow.
Для широкої валідації слід використовувати `Full Release Validation` з
`rerun_group=qa-parity` або групу QA release-checks. Стабільні/типові release
checks тримають exhaustive live/Docker soak за `run_release_soak=true`; профіль
`full` примусово вмикає soak. `QA-Lab - All Lanes`
запускається щоночі на `main` і з ручного dispatch із mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельними jobs. Заплановані QA та release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і manual workflow input
за замовчуванням лишаються `all`; ручний dispatch може розбити `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони лишалися
детермінованими та уникали звичайного запуску provider-plugin. Ці live transport
gateways вимикають memory search; поведінка пам’яті лишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
коміту, а потім отримують його через `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії, підтримані репозиторієм, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway-працівниками. `qa-channel` за замовчуванням має паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної гілки.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу, що позначає помилку.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни гілки `mock-openai`, обізнаної зі сценаріями.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає живий набір випробувань OpenAI Kitchen Sink Plugin через QA Lab. Він
    установлює зовнішній пакет Kitchen Sink, перевіряє інвентар поверхні SDK Plugin,
    зондує `/healthz` і `/readyz`, записує докази CPU/RSS Gateway,
    виконує живий хід OpenAI і перевіряє змагальну діагностику.
    Потребує живої автентифікації OpenAI, наприклад `OPENAI_API_KEY`. У гідратованих сеансах Testbox
    він автоматично підвантажує профіль live-auth Testbox, коли наявний
    помічник `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенч запуску Gateway плюс невеликий пакет мок-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведений підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    і не виглядають як регресія з багатохвилинним навантаженням Gateway.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, якщо checkout ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux-VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Живі запуски передають підтримувані вхідні дані автентифікації QA, практичні для гостя:
    ключі провайдера на базі env, шлях до конфігурації живого провайдера QA та `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися в корені репозиторію, щоб гість міг записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA-звіт + підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає Docker-підтриманий QA-сайт для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, установлює його глобально в
    Docker, запускає неінтерактивний onboarding із API-ключем OpenAI, за замовчуванням налаштовує Telegram,
    перевіряє, що запакований Plugin runtime завантажується без відновлення залежностей під час запуску,
    запускає doctor і виконує один локальний хід агента проти
    замоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму гілку packaged-install
    з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker smoke зібраного застосунку для вбудованих транскриптів runtime-контексту.
    Він перевіряє, що прихований runtime-контекст OpenClaw зберігається як
    custom message, який не відображається, замість витоку у видимий хід користувача,
    потім засіває зачеплений зламаний session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Установлює candidate-пакет OpenClaw у Docker, запускає onboarding установленого пакета,
    налаштовує Telegram через установлений CLI, а потім повторно використовує
    живу Telegram QA-гілку з цим установленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв’язаний локальний tarball замість
    установлення з registry.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/release-автоматизації задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex наявні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - Обгортка перевіряє env облікових даних Telegram або Convex на хості перед
    роботою Docker build/install. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише під час навмисного налагодження підготовки до облікових даних.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї гілки.
  - GitHub Actions надає цю гілку як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і lease-и CI-облікових даних Convex.
- GitHub Actions також надає `Package Acceptance` для побічного product proof
  проти одного candidate-пакета. Він приймає довірений ref, опубліковану npm spec,
  HTTPS tarball URL плюс SHA-256 або tarball artifact з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler із профілями гілок smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
  - Доказ останньої beta продукту:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Доказ точного tarball URL потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Доказ артефакту завантажує tarball artifact з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через
    редагування конфігурації.
  - Перевіряє, що setup discovery залишає неналаштовані downloadable plugins відсутніми,
    перше налаштоване відновлення doctor явно встановлює кожен відсутній downloadable
    plugin, а другий перезапуск не виконує прихованого відновлення
    залежностей.
  - Також установлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor candidate
    очищає залишки застарілих залежностей Plugin без
    postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke на гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний baseline-пакет, потім запускає
    встановлену команду `openclaw update` у тому самому гості та перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний хід
    агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному гості. Використовуйте `--json` для шляху артефакту підсумку та
    статусу кожної гілки.
  - Гілка OpenAI за замовчуванням використовує `openai/gpt-5.5` для живого доказу ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски timeout на хості, щоб зависання транспорту Parallels не могли
    витратити решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали гілок у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Windows update може витрачати 10-15 хвилин на post-update doctor і роботу
    оновлення пакета на cold guest; це все ще нормально, коли вкладений npm
    debug log просувається.
  - Не запускайте цю агрегатну обгортку паралельно з окремими Parallels
    macOS, Windows або Linux smoke-гілками. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакета або стану гостьового Gateway.
  - Post-update proof запускає звичайну поверхню bundled Plugin, тому що
    фасади можливостей, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime APIs, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    testing.
- `pnpm openclaw qa matrix`
  - Запускає живу QA-гілку Matrix проти одноразового Docker-підтриманого Tuwunel homeserver. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог profile/scenario, env vars і layout артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає живу QA-гілку Telegram проти реальної приватної групи з використанням токенів driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли потрібні
    артефакти без коду виходу, що позначає помилку.
  - Потребує двох окремих bot в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати груповий bot traffic.
  - Записує Telegram QA report, summary і артефакт observed-messages у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від driver send request до observed SUT reply.

Живі транспортні гілки мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття кожної гілки міститься в [огляді QA → Покриття живого транспорту](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким синтетичним набором і не входить до цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивний lease з pool на базі Convex, надсилає heartbeats
для цього lease, поки гілка виконується, і звільняє lease під час shutdown.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` Convex URLs лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди супровідників (pool add/remove/list) вимагають саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для супровідників:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети брокера,
префікс endpoint, HTTP-тайм-аут і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах та CI
утилітах.

Стандартний контракт endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `groupId` має бути рядком із числовим id чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Архітектура й назви scenario-helper для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізуйте transport runner на спільному host seam `qa-lab`, оголосіть `qaRunners` у маніфесті Plugin, змонтуйте як `openclaw qa <runner>` і створіть сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як “зростання реалістичності” (і зростання нестабільності/вартості):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфіг: нецільові запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в окремі конфіги проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; unit-тести UI запускаються у виділеному шарді `unit-ui`
- Область:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація Gateway, маршрутизація, інструменти, парсинг, конфіг)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести резолвера й завантажувача публічної поверхні мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` згенерованими крихітними Plugin fixture, а не
    реальними API вихідного коду bundled Plugin. Реальні завантаження API Plugin належать до
    contract/integration-наборів, якими володіє Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігів шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного величезного native root-project процесу. Це зменшує піковий RSS на навантажених машинах і не дає auto-reply/extension роботі виснажувати непов’язані набори.
    - `pnpm test --watch` і далі використовує native root граф проєктів `vitest.config.ts`, бо multi-shard watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/директорій через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` за замовчуванням розгортає змінені git-шляхи в дешеві scoped lanes: прямі правки тестів, сусідні файли `*.test.ts`, явні мапінги source і локальні залежні вузли import-graph. Правки config/setup/package не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` є звичайним розумним локальним check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; викликайте `pnpm test:changed` або явний `pnpm test <target>` для тестового доказу. Зміни версій лише в release metadata запускають цільові перевірки version/config/root-dependency із guard, який відхиляє package-зміни поза верхньорівневим полем version.
    - Правки live Docker ACP harness запускають фокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші правки package-surface і далі використовують ширші guards.
    - Import-light unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих utility-зон спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих light lanes, тож правки helper не перезапускають повний важкий набір для цієї директорії.
    - `auto-reply` має виділені buckets для top-level core helpers, top-level integration-тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів повним Node tail.
    - Звичайний PR/main CI навмисно пропускає пакетний sweep extension і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих важких plugin/extension-наборів на release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime
      context compaction, зберігайте обидва рівні покриття.
    - Додайте фокусовані helper-регресії для меж чистої маршрутизації та нормалізації.
    - Підтримуйте здоровими integration-набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only тести не є
      достатньою заміною цих integration-шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базовий конфіг Vitest за замовчуванням використовує `threads`.
    - Спільний конфіг Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e і live configs.
    - Root UI lane зберігає свій setup і optimizer `jsdom`, але також запускається на
      спільному non-isolated runner.
    - Кожен шард `pnpm test` успадковує ті самі стандартні значення `threads` + `isolate: false`
      зі спільного конфіга Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node
      процесів Vitest, щоб зменшити V8 compile churn під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли й
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` за замовчуванням проходить через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що правка harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом worker.
    - Автомасштабування локальних worker навмисно консервативне й відступає,
      коли середнє навантаження host уже високе, тож кілька паралельних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базовий конфіг Vitest позначає проєкти/config files як
      `forceRerunTriggers`, щоб changed-mode перезапуски залишалися коректними, коли змінюється
      test wiring.
    - Конфіг залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      hosts; задайте `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одну явну cache location для прямого profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration плюс
      import-breakdown output.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими відносно `origin/main`.
    - Дані shard timing записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config запуски використовують шлях config як key; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test і далі витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      мокайте цей seam напряму, замість deep-importing runtime helpers лише
      для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із native root-project path для цього committed
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      dirty tree, спрямовуючи список змінених файлів через
      `scripts/test-projects.mjs` і root конфіг Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфіг: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway із diagnostics, увімкненими за замовчуванням
  - Проганяє synthetic gateway message, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває diagnostic stability bundle persistence helpers
  - Перевіряє, що recorder залишається обмеженим, synthetic RSS samples лишаються нижче pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для stability-regression follow-up, не заміна повного Gateway suite

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфіг: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих Plugin у `extensions/`
- Типові налаштування середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивні воркери (CI: до 2, локально: типово 1).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового встановлення кількості воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного виводу в консоль.
- Обсяг:
  - End-to-end поведінка Gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, сполучення Node і важчі мережеві сценарії
- Очікування:
  - Запускається в CI (коли ввімкнено в пайплайні)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: димовий тест бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell Gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI-бінарника або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфіг: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих Plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?”
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Надавайте перевагу запуску звужених піднаборів замість “усього”
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- Типово live-запуски все ще ізолюють `HOME` і копіюють конфігурацію/автентифікаційні матеріали в тимчасову тестову домашню директорію, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували вашу реальну домашню директорію.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає прогрес-вивід `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи bootstrap Gateway/Bonjour chatter. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або per-live перевизначення через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів видимо активні навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway одразу транслювалися під час live-запусків.
  - Налаштовуйте direct-model Heartbeat через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни мережевої частини Gateway / протоколу WS / сполучення: додайте `pnpm test:e2e`
- Налагодження “мій бот не працює” / провайдер-специфічних збоїв / виклику інструментів: запускайте звужений `pnpm test:live`

## Live (мережеві) тести

Для live-матриці моделей, димових тестів CLI-бекенда, димових тестів ACP, harness сервера застосунку Codex
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального чекліста оновлень і
перевірки Plugin див.
[Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують вашу локальну директорію конфігурації та робочу область (і підвантажують `~/.profile`, якщо змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово мають менший smoke-ліміт, щоб повний Docker sweep лишався практичним:
  `test:docker:live-models` типово встановлює `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово встановлює `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли ви
  явно хочете більший вичерпний scan.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare image є лише Node/Git runner для install/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball. Functional image встановлює той самий tarball у `/app` для built-app functionality lanes. Визначення Docker lane містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. Агрегат використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує process slots, а resource caps не дають важким live, npm-install і multi-service lanes стартувати одночасно. Якщо окрема lane важча за активні caps, scheduler усе ще може запустити її, коли pool порожній, а потім тримає її самостійно, доки знову не буде доступна ємність. Типові значення: 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише коли Docker host має більше запасу. Runner типово виконує Docker preflight, видаляє застарілі OpenClaw E2E containers, друкує статус кожні 30 секунд, зберігає timings успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці timings, щоб у наступних запусках спершу стартували довші lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати weighted lane manifest без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI plan для вибраних lanes, потреб package/image та облікових даних.
- `Package Acceptance` — це GitHub-native package gate для "чи цей installable tarball працює як продукт?" Він визначає один candidate package із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins) щодо package/update/plugin contract, матриці published-upgrade survivor, release defaults і triage збоїв.
- Перевірки build і release запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить static built graph від `dist/entry.js` і `dist/cli/run-main.js` і завершується з помилкою, якщо pre-dispatch startup імпортує package dependencies, як-от Commander, prompt UI, undici або logging, до dispatch команди; він також утримує bundled gateway run chunk у межах бюджету і відхиляє static imports відомих cold gateway paths. Packaged CLI smoke також охоплює root help, onboard help, doctor help, status, config schema і команду model-list.
- Legacy-сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цього cutoff harness допускає лише прогалини metadata shipped-package: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived git fixture, відсутній persisted `update.channel`, застарілі plugin install-record locations, відсутня marketplace install-record persistence і міграція config metadata під час `plugins update`. Для пакетів після `2026.4.25` ці paths є строгими помилками.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або кілька реальних containers і перевіряють інтеграційні paths вищого рівня.

Live-model Docker runners також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у домашню директорію контейнера перед запуском, щоб external-CLI OAuth міг оновлювати tokens без зміни auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Димовий тест прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Димовий тест бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Димовий тест обв’язки сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Димовий тест спостережуваності: `pnpm qa:otel:smoke` — це приватна QA-смуга для перевірки checkout із вихідного коду. Її навмисно не включено до Docker-смуг релізу пакета, оскільки npm-архів не містить QA Lab.
- Димовий тест Open WebUI наживо: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне риштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Димовий тест онбордингу/каналу/агента для npm-архіву: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований архів OpenClaw у Docker, налаштовує OpenAI через онбординг із посиланням на змінну середовища та Telegram за замовчуванням, запускає doctor і виконує один змокований хід агента OpenAI. Повторно використовуйте попередньо зібраний архів за допомогою `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Димовий тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований архів OpenClaw у Docker, перемикає з пакета `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикає назад на пакет `stable` і перевіряє статус оновлення.
- Димовий тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований архів OpenClaw поверх забрудненого фікстура старого користувача з агентами, конфігурацією каналу, allowlist Plugin, застарілим станом залежностей Plugin і наявними файлами робочого простору/сесій. Він запускає оновлення пакета й неінтерактивний doctor без live-ключів провайдера або каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану та бюджети запуску/статусу.
- Димовий тест виживання після оновлення опублікованої версії: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цю базову версію за вбудованим рецептом команд, перевіряє отриману конфігурацію, оновлює цю опубліковану інсталяцію до кандидатного архіву, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані наміри, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте одну базову версію через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні базові версії через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `all-since-2026.4.23`, і розгорніть фікстури у формі issue через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного виправлення встановлення зовнішнього OpenClaw Plugin. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`; Full Release Validation використовує стандартну базову версію latest у блокувальному шляху й розгортає до all-since/reported-issues лише для `run_release_soak=true` або `release_profile=full`.
- Димовий тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту в транскрипті та repair від doctor для зачеплених дубльованих гілок переписування prompt.
- Димовий тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому домашньому каталозі й перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використовуйте попередньо зібраний архів через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` зі зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Димовий тест інсталятора Docker: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш для своїх root-, update- і direct-npm-контейнерів. Димовий тест оновлення за замовчуванням використовує npm `latest` як стабільну базу перед оновленням до кандидатного архіву. Перевизначте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` локально або через вхід `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm-кеш, щоб записи кешу, власником яких є root, не приховували поведінку встановлення в локальному просторі користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цієї змінної середовища, коли потрібне покриття прямого `npm install -g`.
- Димовий тест CLI видалення агентами спільного робочого простору: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ root Dockerfile, засіває двох агентів з одним робочим простором в ізольованому домашньому каталозі контейнера, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого робочого простору. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS-автентифікація + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Димовий тест знімка Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ і шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що знімки ролей CDP охоплюють URL посилань, клікабельні елементи, підвищені курсором, iframe-посилання та метадані фреймів.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово спричиняє відхилення схеми провайдером і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст MCP-каналів (засіяний Gateway + stdio-міст + димовий тест raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi-бандла (реальний stdio MCP-сервер + димовий тест allow/deny для вбудованого Pi-профілю): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + демонтаж stdio MCP-дочірнього процесу після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (димовий тест встановлення/оновлення для локального шляху, `file:`, npm-реєстру з hoisted-залежностями, рухомих git-посилань, ClawHub kitchen-sink, оновлень marketplace і ввімкнення/інспектування Claude-бандла): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару пакета/runtime kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний фікстурний сервер ClawHub.
- Димовий тест незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Димовий тест матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює запакований архів OpenClaw у порожній контейнер, встановлює npm Plugin, перемикає ввімкнення/вимкнення, оновлює та понижує його через локальний npm-реєстр, видаляє встановлений код, а потім перевіряє, що uninstall усе ще прибирає застарілий стан, одночасно логуючи метрики RSS/CPU для кожної фази життєвого циклу.
- Димовий тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює димовий тест встановлення/оновлення для локального шляху, `file:`, npm-реєстру з hoisted-залежностями, рухомих git-посилань, фікстур ClawHub, оновлень marketplace і ввімкнення/інспектування Claude-бандла. `pnpm test:docker:plugin-update` охоплює поведінку незмінного оновлення для встановлених plugins. `pnpm test:docker:plugin-lifecycle-matrix` охоплює встановлення npm Plugin із відстеженням ресурсів, увімкнення, вимкнення, оновлення, пониження версії та uninstall за відсутнього коду.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли їх задано. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не є локальним. QR- і Docker-тести інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Запускачі Docker з live-моделями також монтують поточний checkout лише для читання та
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime-образ
компактним, водночас запускаючи Vitest саме з вашим локальним source/config.
Крок розгортання пропускає великі локальні кеші та вихідні дані складання застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків `.build` або
каталоги виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки Gateway не запускали
реальні воркери каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття Gateway
з цієї Docker-лінії.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP-ендпоїнтами,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
реальний chat-запит через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися отримати
образ Open WebUI, а Open WebUI може знадобитися завершити власне налаштування холодного старту.
Ця лінія очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerизованих запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення розмов, читання transcript, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та Claude-style channel +
сповіщення про дозволи через реальний stdio MCP bridge. Перевірка сповіщень
інспектує сирі stdio MCP frames напряму, щоб smoke перевіряв те, що
bridge фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live-ключа
моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через вбудований Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live-ключа моделі.
Він запускає засіяний Gateway з реальним stdio MCP probe server, виконує
ізольований cron turn і одноразовий child turn `/subagents spawn`, а потім перевіряє,
що child-процес MCP завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей script для workflow регресії/debug. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і source-иться перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` для перевірки лише env vars, отриманих із `OPENCLAW_PROFILE_FILE`, з використанням тимчасових каталогів config/workspace і без зовнішніх монтувань CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установлень CLI всередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються лише для читання під `/host-auth...`, потім копіюються в `/home/node/...` перед стартом tests
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider-запуски монтують лише потрібні dirs/files, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` для звуження запуску
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` для фільтрації providers у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1` для повторного використання наявного образу `openclaw:local-live` у reruns, які не потребують повторного build
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` щоб гарантувати, що creds надходять із profile store (а не env)
- `OPENCLAW_OPENWEBUI_MODEL=...` для вибору моделі, яку Gateway відкриває для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` для перевизначення nonce-check prompt, що використовується smoke Open WebUI
- `OPENWEBUI_IMAGE=...` для перевизначення закріпленого image tag Open WebUI

## Перевірка документації

Запускайте перевірки docs після редагувань документації: `pnpm check:docs`.
Запускайте повну перевірку anchors Mintlify, коли також потрібні перевірки in-page headings: `pnpm docs:check-links:anchors`.

## Offline-регресія (CI-safe)

Це регресії “real pipeline” без реальних providers:

- Gateway tool calling (mock OpenAI, реальний gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Evals надійності agent (skills)

У нас уже є кілька CI-safe tests, які поводяться як “agent reliability evals”:

- Mock tool-calling через реальний gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які перевіряють session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого ще бракує для skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills перелічені в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає agent `SKILL.md` перед використанням і чи дотримується required steps/args?
- **Workflow contracts:** multi-turn scenarios, які перевіряють tool order, session history carryover і sandbox boundaries.

Майбутні evals мають насамперед залишатися детермінованими:

- Scenario runner з mock providers для перевірки tool calls + order, читання skill file і session wiring.
- Невеликий suite сценаріїв, сфокусованих на skills (use vs avoid, gating, prompt injection).
- Необов’язкові live evals (opt-in, env-gated) лише після того, як CI-safe suite буде готовий.

## Contract tests (plugin і shape каналу)

Contract tests перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
interface contract. Вони проходять усі виявлені plugins і запускають suite
перевірок shape і behavior. Стандартна unit-лінія `pnpm test` навмисно
пропускає ці спільні seam і smoke files; запускайте contract-команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базовий shape plugin (id, name, capabilities)
- **setup** - Contract setup wizard
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
- **registry** - Shape Plugin registry

### Provider contracts

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Provider runtime
- **shape** - Shape/interface Plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни exports або subpaths plugin-sdk
- Після додавання або модифікації channel чи provider plugin
- Після рефакторингу plugin registration або discovery

Contract tests запускаються в CI і не потребують реальних API keys.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або зафіксуйте точну request-shape transformation)
- Якщо вона за своєю суттю лише live-only (rate limits, auth policies), тримайте live test вузьким і opt-in через env vars
- Надавайте перевагу таргетуванню найменшого шару, який ловить bug:
  - bug перетворення/відтворення provider request → direct models test
  - bug gateway session/history/tool pipeline → gateway live smoke або CI-safe gateway mock test
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну sampled target для кожного класу SecretRef з registry metadata (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-segment відхиляються.
  - Якщо ви додаєте нову target family SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно падає на некласифікованих target ids, щоб нові classes не можна було мовчки пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
