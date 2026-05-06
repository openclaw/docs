---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні, наскрізні та живі набори, Docker-ранери й те, що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-06T02:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab32451166f7d0b372b618bb409606bf371f291a1fc848e3d3e717db43dc939
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, під час налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документується окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) - архітектура, поверхня команд, написання сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) - довідник для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) - синтетичний transport plugin, який використовується сценаріями, підтриманими репозиторієм.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-ранерів. Розділ нижче зі специфічними для QA ранерами ([Специфічні для QA ранери](#qa-specific-runners)) перелічує конкретні виклики `qa` і посилається назад на наведені вище довідники.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий watch-цикл Vitest: `pnpm test:watch`
- Пряме націлення на файли тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спершу віддавайте перевагу цільовим запускам, коли ітеруєтеся над одним збоєм.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + Gateway-перевірки tool/image): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність runtime: dispatch `OpenClaw Performance` з
  `live_gpt54=true` для реального agent turn `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить source-level показники завантаження Gateway, пам’яті,
  plugin-pressure, повторюваного fake-model hello-loop і запуску CLI.
- Docker live-перебір моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає text turn плюс невелику file-read-style перевірку.
    Моделі, чиї metadata оголошують вхід `image`, також запускають tiny image turn.
    Вимикайте додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають перевикористовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розбиті за провайдером.
  - Для сфокусованих повторних запусків CI dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликачів.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і image attachment
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає gateway agent turns через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимикайте перевірку sub-agent через
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in belt-and-suspenders перевірка поверхні message-channel rescue command.
    Вона виконує `/crestodian status`, ставить у чергу persistent model
    change, відповідає `/crestodian yes` і перевіряє шлях audit/config write.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у configless container з fake Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef writes,
    валідовує config і перевіряє audit entries. Той самий шлях налаштування Ring 0 також
    покривається в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: з установленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6 і
  assistant transcript зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один failing case, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## Специфічні для QA ранери

Ці команди розташовані поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у dedicated workflows. Agentic parity вкладена під
`QA-Lab - All Lanes` і release validation, а не є standalone PR workflow.
Для широкої валідації слід використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. Stable/default release
checks тримають exhaustive live/Docker soak за `run_release_soak=true`; профіль
`full` примусово вмикає soak. `QA-Lab - All Lanes`
запускається щоночі на `main` і з manual dispatch з mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельні jobs. Scheduled QA і release checks передають Matrix
`--profile fast` явно, тоді як Matrix CLI і manual workflow input
за замовчуванням залишаються `all`; manual dispatch може shard `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися
детермінованими й уникали звичайного запуску provider-plugin. Ці live transport
gateways вимикають memory search; поведінка memory залишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім pull його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість rebuilding
усередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії, підкріплені репозиторієм, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками gateway. `qa-channel` за замовчуванням має паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не проходить. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і протокольних моків без заміни лінії
    `mock-openai`, що враховує сценарії.
- `pnpm test:plugins:kitchen-sink-live`
  - Запускає живий набір випробувань OpenAI Kitchen Sink plugin через QA Lab. Він
    встановлює зовнішній пакет Kitchen Sink, перевіряє інвентар поверхні plugin SDK,
    перевіряє `/healthz` і `/readyz`, записує докази CPU/RSS gateway,
    запускає живий хід OpenAI і перевіряє змагальну діагностику.
    Потребує живої автентифікації OpenAI, наприклад `OPENAI_API_KEY`. У гідратованих сесіях Testbox
    автоматично підвантажує профіль живої автентифікації Testbox, коли наявний
    помічник `openclaw-testbox-env`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенч запуску gateway плюс невеликий пакет мок-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    без вигляду регресії gateway, що триває хвилинами.
  - Використовує зібрані артефакти `dist`; спочатку запустіть збірку, якщо checkout ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у одноразовій Linux-VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Живі запуски передають підтримувані QA-входи автентифікації, практичні для гостя:
    ключі провайдера на основі env, шлях до конфігурації живого QA-провайдера і `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб гість міг записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA-звіт + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm-тарбол із поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний онбординг із ключем OpenAI API, налаштовує Telegram
    за замовчуванням, перевіряє, що запакований plugin runtime завантажується без стартового
    ремонту залежностей, запускає doctor і виконує один локальний хід агента проти
    змокованого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію
    запакованого встановлення з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker-smoke зібраного застосунку для транскриптів embedded runtime context.
    Він перевіряє, що прихований runtime context OpenClaw зберігається як
    кастомне повідомлення не для відображення, а не витікає у видимий хід користувача,
    потім засіває уражений зламаний JSONL сесії та перевіряє, що
    `openclaw doctor --fix` переписує його в активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидатний пакет OpenClaw у Docker, запускає онбординг установленого пакета,
    налаштовує Telegram через установлений CLI, а потім повторно використовує
    живу Telegram QA-лінію з цим установленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв’язаний локальний тарбол замість
    встановлення з registry.
  - Використовує ті самі Telegram env-облікові дані або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/релізної автоматизації задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex наявні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - Обгортка перевіряє Telegram або Convex credential env на хості перед
    роботою Docker build/install. Задавайте `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    лише коли навмисно налагоджуєте підготовку до облікових даних.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions надає цю лінію як ручний maintainer workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і leases облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для побічного proof продукту
  проти одного кандидатного пакета. Він приймає довірений ref, опубліковану npm-специфікацію,
  HTTPS URL тарбола плюс SHA-256 або артефакт тарбола з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler із профілями ліній smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
  - Proof останньої beta-версії продукту:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Proof точного URL тарбола потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof завантажує артефакт тарбола з іншого запуску Actions:

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
    перший налаштований doctor repair явно встановлює кожен відсутній downloadable
    plugin, а другий restart не запускає прихований ремонт залежностей.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає legacy plugin dependency debris без
    harness-side postinstall repair.
- `pnpm test:parallels:npm-update`
  - Запускає native packaged-install update smoke на гостях Parallels. Кожна
    вибрана платформа спочатку встановлює потрібний baseline package, потім запускає
    встановлену команду `openclaw update` у тому самому гості та перевіряє
    встановлену версію, статус оновлення, готовність gateway і один локальний
    хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одному гості. Використовуйте `--json` для шляху артефакту підсумку та
    статусу за лініями.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для proof живого ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не
    спожили решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені логи ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витратити 10-15 хвилин на post-update doctor і роботу
    з оновлення пакета на холодному гості; це все ще здоровий стан, коли вкладений npm
    debug log просувається.
  - Не запускайте цю агрегатну обгортку паралельно з окремими Parallels
    smoke-лініями macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, подання пакетів або стану guest gateway.
  - Post-update proof запускає звичайну bundled plugin surface, оскільки
    capability facades, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через bundled runtime APIs, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого protocol smoke
    тестування.
- `pnpm openclaw qa matrix`
  - Запускає живу Matrix QA-лінію проти одноразового Docker-backed homeserver Tuwunel. Лише source-checkout - packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і layout артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає живу Telegram QA-лінію проти справжньої приватної групи, використовуючи driver і SUT bot tokens з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте env mode або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не проходить. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому SUT bot має expose Telegram username.
  - Для стабільного bot-to-bot observation увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох ботів і переконайтеся, що driver bot може observe group bot traffic.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Replying scenarios включають RTT від driver send request до observed SUT reply.

Live transport lanes мають один стандартний контракт, щоб нові transports не розходилися; per-lane coverage matrix розміщена в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким synthetic suite і не є частиною цієї matrix.

### Спільні Telegram credentials через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з пулу на базі Convex, heartbeats
цей lease, доки лінія працює, і releases lease під час shutdown.

Reference Convex project scaffold:

- `qa/convex-credential-broker/`

Required env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один secret для вибраної role:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Credential role selection:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Optional env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex для local-only development.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди мейнтейнера (pool add/remove/list) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для мейнтейнерів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети брокера,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
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
- `POST /admin/add` (лише секрет мейнтейнера)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет мейнтейнера)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активного lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет мейнтейнера)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Архітектура та назви scenario-helper для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному seam хоста `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як "зростання реалістичності" (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` згенерованими крихітними фікстурами plugin, а не
    реальними source APIs bundled plugin. Реальні завантаження plugin API належать до
    contract/integration suites, якими володіє plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших shard configs (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує пікове RSS на навантажених машинах і не дає роботі auto-reply/extension виснажувати непов’язані набори.
    - `pnpm test --watch` все ще використовує граф проєкту native root `vitest.config.ts`, бо multi-shard watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу спрямовують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні source mappings і локальні залежні елементи import-graph. Зміни config/setup/package не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — це звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest tests; викликайте `pnpm test:changed` або явний `pnpm test <target>` для тестового доказу. Version bumps лише для release metadata запускають цільові перевірки version/config/root-dependency, із guard, що відхиляє зміни package поза top-level полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: shell syntax для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші package-surface edits усе ще використовують ширші guards.
    - Import-light unit tests з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних pure utility областей спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy files залишаються на наявних lanes.
    - Вибрані source files помічників `plugin-sdk` і `commands` також зіставляють changed-mode runs з явними сусідніми тестами в цих light lanes, тому зміни helper уникають повторного запуску повного heavy suite для цього каталогу.
    - `auto-reply` має виділені buckets для top-level core helpers, top-level `reply.*` integration tests і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім Node tail.
    - Звичайний PR/main CI навмисно пропускає batch sweep extension і release-only shard `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy suites на release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте inputs виявлення message-tool або runtime-контекст compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper regressions для чистих меж routing і normalization.
    - Підтримуйте справність integration suites embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці suites перевіряють, що scoped ids і поведінка compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only tests
      не є достатньою заміною для цих integration paths.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e і live configs.
    - Root UI lane зберігає свій `jsdom` setup і optimizer, але також працює на
      спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів
      Vitest, щоб зменшити V8 compile churn під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до staged і
      не запускає lint, typecheck або tests.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` типово спрямовується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли агент
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing,
      лише з вищим worker cap.
    - Локальне авто-масштабування workers навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest типово завдають меншої шкоди.
    - Базова конфігурація Vitest позначає проєкти/config files як
      `forceRerunTriggers`, щоб changed-mode reruns залишалися коректними, коли змінюється
      wiring тестів.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо вам потрібне
      одне явне розташування cache для direct profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration плюс
      import-breakdown output.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view файлами,
      зміненими від `origin/main`.
    - Shard timing data записуються до `.artifacts/vitest-shard-timings.json`.
      Whole-config runs використовують шлях config як ключ; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      mock цього seam напряму замість deep-importing runtime helpers лише
      щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із native root-project path для цього committed
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      dirty tree, спрямовуючи список changed file через
      `scripts/test-projects.mjs` і root Vitest config.
    - `pnpm test:perf:profile:main` записує CPU profile main-thread для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Stability (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний local loopback Gateway з діагностикою, увімкненою типово
  - Проганяє синтетичний gateway message, memory і large-payload churn через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers persistence для diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS samples залишаються в межах pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька lane для stability-regression follow-up, не заміна повного Gateway suite

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих плагінів у `extensions/`
- Типові налаштування середовища виконання:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивні workers (CI: до 2, локально: типово 1).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати консольного I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення докладного консольного виводу.
- Область:
  - Наскрізна поведінка Gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, сполучення node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у модульних тестах (може бути повільніше)

### E2E: smoke-тест бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI-бінарника або wrapper-скрипта

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих плагінів у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - "Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?"
  - Виявляти зміни форматів провайдерів, особливості tool-calling, проблеми автентифікації та поведінку rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Надавайте перевагу запуску звужених піднаборів замість "усього"
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- Типово live-запуски все одно ізолюють `HOME` і копіюють конфігурацію/автентифікаційні матеріали в тимчасовий тестовий home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово використовує тихіший режим: він зберігає прогрес-вивід `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні логи запуску.
- Ротація API-ключів (залежно від провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live перевизначення через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу на відповідях rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів видимо активні, навіть коли перехоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway одразу транслювалися під час live-запусків.
  - Налаштуйте Heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте Heartbeat Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни мережевої взаємодії Gateway / протоколу WS / сполучення: додайте `pnpm test:e2e`
- Налагодження "мій бот не працює" / збоїв, специфічних для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke-тестів CLI-бекенда, smoke-тестів ACP, тестового стенда Codex app-server
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness), а також обробки облікових даних для live-запусків див.
[Тестування live-наборів](/uk/help/testing-live). Для окремого контрольного списку оновлень і
перевірки плагінів див.
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins).

## Docker runners (необов'язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог конфігурації та workspace (і підвантажуючи `~/.profile`, якщо змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners типово мають менший smoke-ліміт, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово задає `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово задає `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли ви
  явно хочете більший вичерпний скан.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ є лише Node/Git runner для lanes install/update/plugin-dependency; ці lanes монтують попередньо зібраний tarball. Functional-образ встановлює той самий tarball у `/app` для lanes функціональності зібраного застосунку. Визначення Docker lanes розташовані в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника розташована в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як resource caps не дають важким live, npm-install і multi-service lanes стартувати всім одночасно. Якщо окремий lane важчий за активні caps, планувальник усе одно може запустити його, коли pool порожній, і потім триматиме його окремо, доки знову не буде доступна місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Runner типово виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає таймінги успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках першими стартували довші lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений lane manifest без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних lanes, потреб package/image і облікових даних.
- `Package Acceptance` — це GitHub-native package gate для "чи працює цей інстальований tarball як продукт?" Він визначає один кандидатний package із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість повторного пакування вибраного ref. Профілі впорядковані за шириною охоплення: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins) для контракту package/update/plugin, матриці published-upgrade survivor, типових параметрів релізу та triage збоїв.
- Перевірки збірки й релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard проходить статичний зібраний граф від `dist/entry.js` і `dist/cli/run-main.js` і завершується помилкою, якщо pre-dispatch startup імпортує залежності package, як-от Commander, prompt UI, undici або logging, до dispatch команди; він також утримує bundled gateway run chunk у межах бюджету й відхиляє статичні імпорти відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і команду model-list.
- Legacy-сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі тестовий стенд допускає лише прогалини metadata shipped-package: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у git fixture, похідній від tarball, відсутній persisted `update.channel`, legacy locations записів встановлення плагінів, відсутня persistence записів встановлення marketplace і міграція config metadata під час `plugins update`. Для packages після `2026.4.25` ці шляхи є суворими збоями.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker runners також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у container home перед запуском, щоб OAuth зовнішнього CLI міг оновлювати tokens без зміни auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Смоук-тест прив’язування ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Смоук-тест CLI бекенда: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Смоук-тест обв’язки сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Смоук-тест спостережуваності: `pnpm qa:otel:smoke` — це приватна QA-гілка з checkout вихідного коду. Вона навмисно не є частиною Docker-гілок релізу пакета, бо npm tarball не містить QA Lab.
- Live-смоук-тест Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер початкового налаштування (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Смоук-тест початкового налаштування/каналу/агента з npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює упакований tarball OpenClaw у Docker, налаштовує OpenAI через початкове налаштування з посиланням на env і типово Telegram, запускає doctor і виконує один мокований хід агента OpenAI. Повторно використайте попередньо зібраний tarball із `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості з `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал за допомогою `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` чи `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Смоук-тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює упакований tarball OpenClaw у Docker, перемикає з пакета `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикає назад на пакет `stable` і перевіряє статус оновлення.
- Смоук-тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює упакований tarball OpenClaw поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналу, allowlist-ами Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він запускає оновлення пакета плюс неінтерактивний doctor без live-ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Опублікований смоук-тест виживання після оновлення: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, заповнює реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегувальний планувальник розгорнути точні локальні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, і розгорніть фікстури у формі issue через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту встановлення зовнішніх OpenClaw Plugin. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`, розв’язує мета-токени baseline, як-от `last-stable-4` або `all-since-2026.4.23`, а Full Release Validation розгортає package gate релізного soak до `last-stable-4 2026.4.23 2026.5.2 2026.4.15` плюс `reported-issues`.
- Смоук-тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження транскрипту прихованого runtime-контексту плюс ремонт через doctor для зачеплених дубльованих гілок prompt-rewrite.
- Смоук-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використайте попередньо зібраний tarball із `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості з `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker-смоук-тест інсталятора: `bash scripts/test-install-sh-docker.sh` використовує один npm cache для своїх root-, update- і direct-npm-контейнерів. Update-смоук типово використовує npm `latest` як stable baseline перед оновленням до кандидатного tarball. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm cache, щоб root-owned cache entries не приховували поведінку user-local встановлення. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними перезапусками.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm за допомогою `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Смоук-тест CLI видалення агентів зі спільним workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає root Dockerfile image, засіває двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє валідний JSON плюс поведінку збереженого workspace. Повторно використайте install-smoke image через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Смоук-тест CDP-знімка браузера: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає мокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає reject схеми провайдера й перевіряє, що raw detail з’являється в логах Gateway.
- MCP-міст каналу (засіяний Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти пакета Pi (реальний stdio MCP server + вбудований смоук-тест allow/deny профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown stdio MCP child після isolated cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin-и (смоук-тест install/update для local path, `file:`, npm registry з hoisted dependencies, git moving refs, ClawHub kitchen-sink, marketplace updates і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime за допомогою `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстури ClawHub.
- Смоук-тест незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Смоук-тест матриці життєвого циклу Plugin: `pnpm test:docker:plugin-lifecycle-matrix` встановлює упакований tarball OpenClaw у порожній контейнер, встановлює npm Plugin, перемикає enable/disable, оновлює й понижує його через локальний npm registry, видаляє встановлений код, а потім перевіряє, що uninstall усе ще прибирає застарілий стан, водночас логуючи метрики RSS/CPU для кожної фази життєвого циклу.
- Смоук-тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin-и: `pnpm test:docker:plugins` охоплює смоук-тест install/update для local path, `file:`, npm registry з hoisted dependencies, git moving refs, фікстур ClawHub, marketplace updates і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` охоплює поведінку незміненого оновлення для встановлених Plugin. `pnpm test:docker:plugin-lifecycle-matrix` охоплює install, enable, disable, upgrade, downgrade і missing-code uninstall npm Plugin з відстеженням ресурсів.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо він ще не локальний. QR- і installer Docker-тести зберігають власні Dockerfile, бо вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Ранери Docker для live-моделей також монтують поточний checkout лише для читання та
розгортають його в тимчасовий робочий каталог усередині контейнера. Це зберігає runtime
image компактним, водночас запускаючи Vitest саме на вашому локальному source/config.
Крок розгортання пропускає великі локальні кеші та build outputs застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку каталоги `.build` або
вихідні каталоги Gradle, щоб Docker live runs не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
справжні воркери каналів Telegram/Discord/тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage із цієї Docker lane.
`test:docker:openwebui` — це суміснісний smoke вищого рівня: він запускає
контейнер OpenClaw gateway з увімкненими HTTP endpoints, сумісними з OpenAI,
запускає pinned контейнер Open WebUI для цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
справжній chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
image Open WebUI, а Open WebUI може знадобитися завершити власне налаштування cold-start.
Ця lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
справжнього облікового запису Telegram, Discord або iMessage. Він завантажує seeded Gateway
container, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє routed conversation discovery, читання transcript, metadata вкладень,
поведінку live event queue, outbound send routing і channel +
permission notifications у стилі Claude через справжній stdio MCP bridge. Перевірка сповіщень
інспектує raw stdio MCP frames безпосередньо, щоб smoke валідував те, що
bridge справді emitted, а не лише те, що випадково surface конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає repo Docker image, запускає справжній stdio MCP probe server
усередині контейнера, матеріалізує цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає seeded Gateway зі справжнім stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей script для regression/debug workflows. Він може знову знадобитися для валідації ACP thread routing, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і source перед запуском tests
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, sourced з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові config/workspace dirs і без зовнішніх CLI auth mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для cached CLI installs усередині Docker
- Зовнішні CLI auth dirs/files під `$HOME` монтуються read-only під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком tests
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені provider runs монтують лише потрібні dirs/files, inferred з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або comma list на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати providers in-container
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для reruns, які не потребують rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що creds надходять із profile store (а не env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати model, exposed gateway для Open WebUI smoke
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує Open WebUI smoke
- `OPENWEBUI_IMAGE=...`, щоб перевизначити pinned Open WebUI image tag

## Перевірка документації

Запускайте docs checks після edits документації: `pnpm check:docs`.
Запускайте повну валідацію anchors Mintlify, коли також потрібні перевірки in-page headings: `pnpm docs:check-links:anchors`.

## Offline regression (CI-safe)

Це regressions "real pipeline" без справжніх providers:

- Gateway tool calling (mock OpenAI, справжній gateway + agent loop): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway wizard (WS `wizard.start`/`wizard.next`, записує config + auth enforced): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька CI-safe tests, що поводяться як "agent reliability evals":

- Mock tool-calling через справжній gateway + agent loop (`src/gateway/gateway.test.ts`).
- End-to-end wizard flows, які валідують session wiring і config effects (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли skills listed у prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає agent `SKILL.md` перед використанням і чи виконує required steps/args?
- **Workflow contracts:** multi-turn scenarios, які assert tool order, session history carryover і sandbox boundaries.

Майбутні evals мають насамперед залишатися детермінованими:

- Scenario runner із mock providers, щоб assert tool calls + order, skill file reads і session wiring.
- Невеликий suite skill-focused scenarios (use vs avoid, gating, prompt injection).
- Необов’язкові live evals (opt-in, env-gated) лише після появи CI-safe suite.

## Contract tests (форма plugin і channel)

Contract tests перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
interface contract. Вони ітерують усі виявлені plugins і запускають suite
shape and behavior assertions. Unit lane `pnpm test` за замовчуванням навмисно
пропускає ці shared seam and smoke files; запускайте contract commands явно,
коли торкаєтеся shared channel або provider surfaces.

### Commands

- Усі contracts: `pnpm test:contracts`
- Лише channel contracts: `pnpm test:contracts:channels`
- Лише provider contracts: `pnpm test:contracts:plugins`

### Channel contracts

Розташовано в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Contract setup wizard
- **session-binding** - Поведінка session binding
- **outbound-payload** - Структура message payload
- **inbound** - Обробка inbound message
- **actions** - Channel action handlers
- **threading** - Обробка Thread ID
- **directory** - Directory/roster API
- **group-policy** - Застосування group policy

### Provider status contracts

Розташовано в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel status probes
- **registry** - Форма plugin registry

### Provider contracts

Розташовано в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contract auth flow
- **auth-choice** - Auth choice/selection
- **catalog** - Model catalog API
- **discovery** - Plugin discovery
- **loader** - Завантаження plugin
- **runtime** - Provider runtime
- **shape** - Форма/інтерфейс plugin
- **wizard** - Setup wizard

### Коли запускати

- Після зміни plugin-sdk exports або subpaths
- Після додавання або модифікації channel чи provider plugin
- Після refactoring plugin registration або discovery

Contract tests запускаються в CI і не потребують справжніх API keys.

## Додавання regressions (guidance)

Коли ви виправляєте provider/model issue, виявлену в live:

- Додайте CI-safe regression, якщо можливо (mock/stub provider або capture точної request-shape transformation)
- Якщо це за своєю суттю лише live-only (rate limits, auth policies), тримайте live test вузьким і opt-in через env vars
- Віддавайте перевагу націлюванню на найменший layer, який ловить bug:
  - provider request conversion/replay bug → direct models test
  - gateway session/history/tool pipeline bug → gateway live smoke або CI-safe gateway mock test
- SecretRef traversal guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` derives one sampled target per SecretRef class from registry metadata (`listSecretTargetRegistryEntries()`), then asserts traversal-segment exec ids are rejected.
  - Якщо ви додаєте нову `includeInPlan` SecretRef target family у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому test. Test навмисно fails on unclassified target ids, щоб new classes не могли бути silently skipped.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [Testing updates and plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
