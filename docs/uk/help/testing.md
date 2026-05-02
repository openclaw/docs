---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори модульних, e2e та live-тестів, ранери Docker і те, що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-02T20:01:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a5bfbd2ea78b05ca23e97318943e0043645814d2aa4ccb7540a2bf7c601d0d09
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (модульні/інтеграційні, e2e, live) і невеликий набір
Docker-запускачів. Цей документ є посібником "як ми тестуємо":

- Що покриває кожен набір (і що він навмисно _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** документовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, командна поверхня, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідник для `pnpm openclaw qa matrix`.
- [QA-канал](/uk/channels/qa-channel) — синтетичний транспортний Plugin, який використовується сценаріями з репозиторію.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels-запускачів. Розділ нижче, присвячений QA ([QA-специфічні запускачі](#qa-specific-runners)), перелічує конкретні виклики `qa` і повертає до наведених вище довідників.
</Note>

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на просторій машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи розширень/каналів: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спочатку віддавайте перевагу таргетованим запускам, коли ітеруєте над окремим збоєм.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + перевірки gateway tool/image): `pnpm test:live`
- Тихо таргетувати один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти продуктивності runtime: dispatch `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для артефактів CPU/heap/trace Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`. Звіт
  mock-provider також містить показники gateway boot на рівні джерела, пам’яті,
  plugin-pressure, повторюваного hello-loop фейкової моделі та startup CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід і невелику перевірку в стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують крихітний image-хід.
    Вимикайте додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розділені за провайдером.
  - Для сфокусованих повторних запусків CI виконайте dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release викликачі.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, перевіряє `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і image attachment
    проходять через native Plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи gateway agent через Plugin-власний Codex app-server harness,
    перевіряє `/codex status` і `/codex models`, і за замовчуванням виконує перевірки image,
    cron MCP, sub-agent і Guardian. Вимикайте перевірку sub-agent за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки sub-agent, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова belt-and-suspenders перевірка поверхні rescue command для message-channel.
    Вона перевіряє `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без config із фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback перетворюється на audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord Plugin + SecretRef writes,
    валідовує config і перевіряє audit entries. Той самий шлях Ring 0 setup
    також покрито в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi cost smoke: із встановленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  assistant transcript зберігає нормалізований `usage.cost`.

<Tip>
Коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через allowlist env vars, описані нижче.
</Tip>

## QA-специфічні запускачі

Ці команди розташовані поруч з основними наборами тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у виділених workflows. Agentic parity вкладено під
`QA-Lab - All Lanes` і release validation, а не окремий PR workflow.
Для широкої валідації слід використовувати `Full Release Validation` з
`rerun_group=qa-parity` або QA-групу release-checks. `QA-Lab - All Lanes`
запускається щоночі на `main` і через ручний dispatch із mock parity lane, live
Matrix lane, Convex-managed live Telegram lane і Convex-managed live Discord
lane як паралельними jobs. Scheduled QA і release checks явно передають Matrix
`--profile fast`, тоді як Matrix CLI і manual workflow input
за замовчуванням лишаються `all`; ручний dispatch може розбити `all` на jobs
`transport`, `media`, `e2ee-smoke`, `e2ee-deep` і `e2ee-cli`. `OpenClaw Release
Checks` запускає parity плюс fast Matrix і Telegram lanes перед release
approval, використовуючи `mock-openai/gpt-5.5` для release transport checks, щоб вони лишалися
детермінованими й уникали звичайного startup provider-plugin. Ці live transport
gateways вимикають memory search; поведінка пам’яті лишається покритою QA parity
suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, потім витягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії, що спираються на репозиторій, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. `qa-channel` за замовчуванням має паралельність 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної доріжки.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу, що позначає помилку.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни доріжки `mock-openai`, що враховує сценарії.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенчмарк запуску Gateway плюс невеликий пакет мок-сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведений підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише стійкі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    і не виглядають як регресія з багатохвилинним піковим навантаженням Gateway.
  - Використовує зібрані артефакти `dist`; спочатку запустіть збірку, якщо checkout ще не має
    свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux-VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA-вхідні дані автентифікації, практичні для гостьової системи:
    ключі провайдерів на основі env, шлях до конфігурації QA live-провайдера та `CODEX_HOME`,
    коли він присутній.
  - Каталоги виводу мають залишатися в корені репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт і підсумок плюс журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm-тарбол із поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний onboarding з ключем OpenAI API, за замовчуванням налаштовує Telegram,
    перевіряє, що упакований runtime Plugin завантажується без repair залежностей під час запуску,
    запускає doctor і виконує один локальний хід агента проти
    замоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму доріжку
    встановлення з пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker-smoke зібраного застосунку для transcript вбудованого runtime-контексту.
    Він перевіряє, що прихований runtime-контекст OpenClaw зберігається як
    custom-повідомлення без показу, а не витікає у видимий хід користувача,
    потім додає уражений зламаний session JSONL і перевіряє, що
    `openclaw doctor --fix` переписує його до активної гілки з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидатний пакет OpenClaw у Docker, запускає onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live-доріжку Telegram QA з цим встановленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв’язаний локальний тарбол замість
    встановлення з реєстру.
  - Використовує ті самі Telegram env-облікові дані або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/release-автоматизації задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    Docker-wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї доріжки.
  - GitHub Actions надає цю доріжку як ручний maintainer-workflow
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і lease облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для паралельного product-підтвердження
  щодо одного кандидатного пакета. Він приймає довірений ref, опублікований npm spec,
  HTTPS URL тарбола плюс SHA-256 або артефакт тарбола з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler із профілями доріжок smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  workflow Telegram QA проти того самого артефакта `package-under-test`.
  - Підтвердження продукту для останньої beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Підтвердження точного URL тарбола потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Підтвердження артефакта завантажує артефакт тарбола з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування конфігурації.
  - Перевіряє, що setup discovery залишає неналаштовані завантажувані plugins відсутніми,
    перший налаштований doctor repair явно встановлює кожен відсутній завантажуваний
    plugin, а другий restart не запускає прихований repair залежностей.
  - Також встановлює відому старішу npm baseline-версію, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає сміття залежностей legacy plugin без repair після встановлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення packaged-install на гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний baseline-пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі й перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до артефакта підсумку та
    статусу кожної доріжки.
  - Доріжка OpenAI за замовчуванням використовує `openai/gpt-5.5` для live-підтвердження ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте тривалі локальні запуски в host timeout, щоб зависання транспорту Parallels не могли
    використати решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали доріжок у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішній wrapper завис.
  - Оновлення Windows може витрачати 10-15 хвилин на post-update doctor і роботу
    з оновлення пакета на холодній гостьовій системі; це все ще справний стан, коли вкладений npm
    debug log просувається.
  - Не запускайте цей aggregate wrapper паралельно з окремими Parallels
    macOS, Windows або Linux smoke-доріжками. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, надання пакета або стану гостьового Gateway.
  - Post-update-підтвердження запускає звичайну bundled plugin-поверхню, тому що
    capability facade, як-от мовлення, генерація зображень і розуміння медіа,
    завантажуються через bundled runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-доріжку Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA-доріжку Telegram проти реальної приватної групи з використанням токенів driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. group id має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних pooled облікових даних. Використовуйте режим env за замовчуванням або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу, що позначає помилку.
  - Потребує двох різних ботів у тій самій приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати group bot traffic.
  - Записує Telegram QA-звіт, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від driver send request до observed SUT reply.

Live transport-доріжки мають спільний стандартний контракт, щоб нові транспорти не розходилися; матриця покриття для кожної доріжки міститься в [огляді QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` є широким синтетичним набором і не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивний lease з pool на базі Convex, надсилає heartbeats
для цього lease, поки доріжка виконується, і звільняє lease під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Env default: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` в CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє Convex URL `http://` для loopback лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Admin-команди maintainer (pool add/remove/list) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для machine-readable виводу в скриптах і CI
утилітах.

Контракт типового endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `POST /admin/add` (лише секрет супроводжувача)
  - Запит: `{ kind, actorId, payload, note?, status? }`
  - Успіх: `{ status: "ok", credential }`
- `POST /admin/remove` (лише секрет супроводжувача)
  - Запит: `{ credentialId, actorId }`
  - Успіх: `{ status: "ok", changed, credential }`
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет супроводжувача)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Архітектура й назви scenario-helper для нових адаптерів каналів описані в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна планка: реалізувати transport runner на спільному seam хоста `qa-lab`, оголосити `qaRunners` у маніфесті Plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалістичності» (а також зростання нестабільності/вартості):

### Модульні / інтеграційні (типові)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні UI-тести запускаються у виділеному shard `unit-ui`
- Охоплення:
  - Чисті модульні тести
  - In-process інтеграційні тести (автентифікація Gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускаються в CI
  - Не потребують справжніх ключів
  - Мають бути швидкими й стабільними
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` зі згенерованими крихітними фікстурами Plugin, а не
    справжніми API вихідного коду bundled Plugin. Реальні завантаження API Plugin належать до
    contract/integration наборів, якими володіє Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension виснажувати непов’язані набори.
    - `pnpm test --watch` усе ще використовує нативний граф проєкту root `vitest.config.ts`, бо multi-shard watch loop непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу маршрутизують явні цілі файлів/директорій через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі правки тестів, сусідні файли `*.test.ts`, явні мапінги source і локальні залежні елементи import graph. Правки config/setup/package не запускають широкі тести, якщо явно не використати `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Version bumps лише для release metadata запускають цільові перевірки version/config/root-dependency із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Правки live Docker ACP harness запускають сфокусовані перевірки: shell syntax для live Docker auth scripts і dry-run планувальника live Docker. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; dependency, export, version та інші правки package-surface досі використовують ширші guards.
    - Import-light модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані вихідні файли helpers `plugin-sdk` і `commands` також маплять запуски changed-mode на явні сусідні тести в цих легких lanes, щоб правки helpers не перезапускали весь важкий набір для цієї директорії.
    - `auto-reply` має виділені buckets для top-level core helpers, top-level інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не займав увесь хвіст Node.
    - Звичайний PR/main CI навмисно пропускає batch sweep extension і release-only shard `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли змінюєте вхідні дані discovery message-tool або runtime-контекст compaction,
      зберігайте обидва рівні coverage.
    - Додавайте сфокусовані helper-регресії для меж чистої маршрутизації та нормалізації.
    - Підтримуйте здоровими інтеграційні набори embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction досі проходять
      реальними шляхами `run.ts` / `compact.ts`; helper-only тести
      не є достатньою заміною цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e і live configs.
    - Root UI lane зберігає свої `jsdom` setup і optimizer, але також працює на
      спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі типові `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх процесів Node
      Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли й
      не запускає lint, typecheck або тести.
    - Запускайте `pnpm check:changed` явно перед передачею або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` типово маршрутизується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішує, що правка harness, config, package або contract справді потребує ширшого
      coverage Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Автомасштабування локальних workers навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тому кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб повторні запуски changed-mode залишалися правильними, коли змінюється
      test wiring.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування cache для direct profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration плюс
      import-breakdown output.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими після `origin/main`.
    - Дані timing для shards записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config запуски використовують шлях config як ключ; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test досі витрачає більшу частину часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-importing runtime helpers лише
      щоб пропустити їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed
      `test:changed` із native root-project шляхом для цього committed
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` benchmark-ить поточне
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root Vitest config.
    - `pnpm test:perf:profile:main` записує CPU profile головного потоку для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для
      unit suite з вимкненою паралельністю файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Охоплення:
  - Запускає справжній loopback Gateway із diagnostics, увімкненими за замовчуванням
  - Проганяє синтетичний churn повідомлень gateway, пам’яті й великих payload через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers persistence для diagnostic stability bundle
  - Перевіряє, що recorder лишається обмеженим, синтетичні RSS samples лишаються нижче pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI й без ключів
  - Вузька lane для подальшої роботи зі stability-regression, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові runtime-значення:
  - Використовує Vitest `threads` з `isolate: false`, відповідно до решти репозиторію.
  - Використовує adaptive workers (CI: до 2, локально: типово 1).
  - Типово працює в silent mode, щоб зменшити overhead console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового worker count (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Охоплення:
  - End-to-end поведінка multi-instance gateway
  - WebSocket/HTTP surfaces, node pairing і важча networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Не потребує справжніх ключів
  - Більше рухомих частин, ніж у модульних тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за явним увімкненням; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локальний `openshell` CLI і робочий Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестові gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI binary або wrapper script

### Живі тести (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і живі тести bundled-plugin у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - “Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?”
  - Виявляє зміни форматів провайдерів, особливості tool-calling, проблеми автентифікації та поведінку rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені піднабори, а не “все”
- Живі запуски підвантажують `~/.profile`, щоб отримати відсутні API keys.
- За замовчуванням живі запуски все одно ізолюють `HOME` і копіюють конфігураційні/автентифікаційні матеріали в тимчасовий тестовий home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно потрібно, щоб live-тести використовували ваш реальний home directory.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: зберігає progress output `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає bootstrap logs Gateway/Bonjour chatter. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API key (специфічно для провайдера): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби на відповідях rate limit.
- Вивід progress/heartbeat:
  - Live suites тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдера були явно активними, навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає console interception Vitest, щоб рядки прогресу провайдера/Gateway транслювалися негайно під час живих запусків.
  - Налаштовуйте direct-model heartbeats через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте gateway/probe heartbeats через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір тестів запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся gateway networking / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте “мій бот недоступний” / provider-specific failures / tool calling: запустіть звужений `pnpm test:live`

## Живі тести (з доступом до мережі)

Для live model matrix, CLI backend smokes, ACP smokes, Codex app-server
harness і всіх media-provider live tests (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для живих запусків — див.
[Testing live suites](/uk/help/testing-live). Для окремого checklist оновлень і
валідації Plugin див.
[Testing updates and plugins](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки "працює в Linux")

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний profile-key live file всередині Docker image репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний config dir і workspace (і підвантажують `~/.profile`, якщо змонтовано). Відповідні локальні entrypoints: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням мають менший smoke cap, щоб повний Docker sweep лишався практичним:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  явно хочете більший вичерпний scan.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare image — це лише Node/Git runner для install/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball. Functional image встановлює той самий tarball у `/app` для built-app functionality lanes. Визначення Docker lanes розміщені в `scripts/lib/docker-e2e-scenarios.mjs`; planner logic — у `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний plan. Aggregate використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує process slots, тоді як resource caps не дають важким live, npm-install і multi-service lanes стартувати одночасно. Якщо один lane важчий за активні caps, scheduler усе одно може запустити його, коли pool порожній, а потім тримає його наодинці, доки capacity знову не стане доступною. Значення за замовчуванням: 10 slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker host має більше запасу. Runner за замовчуванням виконує Docker preflight, видаляє застарілі OpenClaw E2E containers, друкує status кожні 30 секунд, зберігає timing успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці timings, щоб у наступних запусках стартувати довші lanes першими. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений lane manifest без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI plan для вибраних lanes, package/image needs і credentials.
- `Package Acceptance` — це GitHub-native package gate для "чи цей installable tarball працює як продукт?" Він визначає один candidate package із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість повторного пакування вибраного ref. Profiles упорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Testing updates and plugins](/uk/help/testing-updates-plugins) для package/update/plugin contract, published-upgrade survivor matrix, release defaults і failure triage.
- Перевірки build і release запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить статичний built graph від `dist/entry.js` і `dist/cli/run-main.js` і завершується з помилкою, якщо pre-dispatch startup імпортує package dependencies, такі як Commander, prompt UI, undici або logging, до dispatch команди; він також тримає bundled gateway run chunk у межах budget і відхиляє static imports відомих cold gateway paths. Packaged CLI smoke також покриває root help, onboard help, doctor help, status, config schema і model-list command.
- Package Acceptance legacy compatibility обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі harness допускає лише shipped-package metadata gaps: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch files у tarball-derived git fixture, відсутній persisted `update.channel`, legacy plugin install-record locations, відсутня marketplace install-record persistence і config metadata migration під час `plugins update`. Для packages після `2026.4.25` ці paths є strict failures.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних containers і перевіряють higher-level integration paths.

Live-model Docker runners також bind-mount лише потрібні CLI auth homes (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у container home перед запуском, щоб external-CLI OAuth міг оновлювати tokens без зміни host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Димовий тест ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Димовий тест бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Димовий тест обв’язки сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Димовий тест спостережуваності: `pnpm qa:otel:smoke` — це приватна лінія перевірки вихідного checkout для QA. Її навмисно не включено до ліній пакетного Docker-релізу, бо npm tarball не містить QA Lab.
- Живий димовий тест Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне риштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Димовий тест онбордингу/каналу/агента npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref і типово Telegram, запускає doctor і виконує один мокований хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте перебудову хоста через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемикайте канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Димовий тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований tarball OpenClaw у Docker, перемикається з пакетного `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикається назад на пакетний `stable` і перевіряє статус оновлення.
- Димовий тест переживання оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований tarball OpenClaw поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналів, allowlist Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він запускає пакетне оновлення та неінтерактивний doctor без живих ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Опублікований димовий тест переживання оновлення: `pnpm test:docker:published-upgrade-survivor` типово встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до кандидатного tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один baseline через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегатний планувальник розгорнути точні baselines через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, наприклад `all-since-2026.4.23`, і розгорніть фікстури у формі issue через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту встановлення зовнішнього OpenClaw Plugin. Package Acceptance надає їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Димовий тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту в transcript, а також ремонт doctor для зачеплених дубльованих гілок prompt-rewrite.
- Димовий тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих провайдерів зображень замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропускайте збірку хоста через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або копіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Димовий тест Docker-інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш між root, update і direct-npm контейнерами. Димовий тест update типово використовує npm `latest` як стабільний baseline перед оновленням до кандидатного tarball. Перевизначте через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` локально або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root зберігають ізольований npm-кеш, щоб записи кешу з root-власником не приховували поведінку встановлення для локального користувача. Задайте `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване пряме глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Димовий тест CLI видалення агентів зі спільним workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає образ кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє валідний JSON та поведінку збереженого workspace. Повторно використовуйте образ install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Димовий тест snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає вихідний E2E-образ плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshot ролей CDP охоплюють URL посилань, clickables, підвищені курсором, iframe refs і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) проганяє мокований сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє provider schema і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст MCP каналів (засіяний Gateway + stdio-міст + сирий димовий тест notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-інструменти Pi bundle (реальний stdio MCP server + вбудований димовий тест allow/deny профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + teardown дочірнього stdio MCP після ізольованого cron і one-shot запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (димовий тест install/update для локального шляху, `file:`, npm registry з hoisted dependencies, рухомих git refs, кухонного ClawHub, marketplace updates і enable/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Задайте `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте типову пару kitchen-sink package/runtime через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстур ClawHub.
- Димовий тест незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Димовий тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює димовий тест install/update для локального шляху, `file:`, npm registry з hoisted dependencies, рухомих git refs, фікстур ClawHub, marketplace updates і enable/inspect Claude-bundle. `pnpm test:docker:plugin-update` охоплює поведінку незміненого оновлення для встановлених plugins.

Щоб вручну попередньо зібрати й повторно використовувати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення образів для конкретних suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. QR і Docker-тести інсталятора зберігають власні Dockerfile, бо вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker-runner-и live-model також bind-mount поточний checkout у режимі read-only і
стейджать його в тимчасовий workdir усередині контейнера. Це зберігає runtime
образ компактним, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок стейджингу пропускає великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунків `.build` або
каталоги виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
специфічних для машини артефактів.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб живі probe gateway не запускали
реальні worker-и каналів Telegram/Discord/etc. усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live-покриття з цієї Docker-лінії.
`test:docker:openwebui` — це димовий тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoint-ами,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може потребувати завантаження
образу Open WebUI, а Open WebUI може потребувати завершення власного cold-start налаштування.
Ця лінія очікує придатний ключ живої моделі, і `OPENCLAW_PROFILE_FILE`
(`~/.profile` типово) є основним способом надати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний Gateway
контейнер, запускає другий контейнер, який spawn-ить `openclaw mcp serve`, потім
перевіряє routed conversation discovery, читання transcript, metadata вкладень,
поведінку черги live events, outbound send routing і channel +
permission notifications у стилі Claude через реальний stdio MCP bridge. Перевірка notification
безпосередньо інспектує сирі stdio MCP frames, тож димовий тест валідує те, що
bridge фактично emits, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає Docker-образ repo, запускає реальний stdio MCP probe server
усередині контейнера, materializes цей server через вбудований Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає засіяний Gateway із реальним stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, а потім перевіряє,
що дочірній MCP-процес завершується після кожного запуску.

Ручний димовий тест ACP thread природною мовою (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Збережіть цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для валідації ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) змонтовано до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) змонтовано до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) змонтовано до `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочого простору й без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) змонтовано до `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне перескладання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілів (а не з середовища)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway відкриває для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагувань документації: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії “реального конвеєра” без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (кейс: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + примусова автентифікація): `src/gateway/gateway.test.ts` (кейс: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як “оцінювання надійності агента”:

- Mock-виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють зв’язування сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого досі бракує для skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/аргументів?
- **Контракти робочого процесу:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінювання мають насамперед залишатися детермінованими:

- Виконавець сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і зв’язування сесій.
- Невеликий набір сценаріїв, сфокусованих на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-оцінювання (opt-in, обмежені env) лише після того, як набір, безпечний для CI, буде готовий.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму контракту інтерфейсу. Вони проходять усі виявлені plugins і запускають набір перевірок форми та поведінки. Типова unit lane `pnpm test` навмисно пропускає ці спільні файли seam і smoke; запускайте контрактні команди явно, коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID треду
- **directory** - API каталогу/списку учасників
- **group-policy** - Забезпечення групової політики

### Контракти статусу провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу каналу
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/обрання автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни каналу чи provider plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести виконуються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- За можливості додайте регресію, безпечну для CI (mock/stub provider або зафіксуйте точне перетворення форми запиту)
- Якщо це за своєю природою лише live-випадок (ліміти швидкості, політики автентифікації), тримайте live-тест вузьким і opt-in через змінні середовища
- Надавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/відтворення запиту провайдера → прямий тест моделей
  - помилка конвеєра сесії/історії/інструментів Gateway → live smoke Gateway або безпечний для CI mock-тест Gateway
- Запобіжник обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із сегментами обходу відхиляються.
  - Якщо ви додаєте нову цільову сім’ю SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було мовчки пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
