---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні/e2e/live-набори, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-02T16:50:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99e7db2ab0069aaa129bed303419b76bb9276f3f53a4ac6bb292120c3a327b7b
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори тестів Vitest (unit/integration, e2e, live) і невеликий набір
Docker runner. Цей документ є посібником «як ми тестуємо»:

- Що покриває кожен набір (і що він свідомо _не_ покриває).
- Які команди запускати для типових робочих процесів (локально, перед push, для налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

<Note>
**QA-стек (qa-lab, qa-channel, live transport lanes)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідка для `pnpm openclaw qa matrix`.
- [QA channel](/uk/channels/qa-channel) — синтетичний transport plugin, який використовується сценаріями, підтриманими репозиторієм.

Ця сторінка описує запуск звичайних наборів тестів і Docker/Parallels runner. Розділ про спеціальні QA runner нижче ([QA-specific runners](#qa-specific-runners)) перелічує конкретні виклики `qa` і повертає до наведених вище довідкових матеріалів.
</Note>

## Швидкий старт

У більшість днів:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий watch-цикл Vitest: `pnpm test:watch`
- Пряме таргетування файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Спершу віддавайте перевагу таргетованим запускам, коли ітеруєте над одним збоєм.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA lane на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Coverage gate: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + Gateway tool/image probes): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Звіти про продуктивність runtime: dispatch `OpenClaw Performance` з
  `live_gpt54=true` для реального ходу агента `openai/gpt-5.4` або
  `deep_profile=true` для CPU/heap/trace артефактів Kova. Щоденні заплановані запуски
  публікують артефакти mock-provider, deep-profile і GPT 5.4 lane до
  `openclaw/clawgrit-reports`, коли налаштовано `CLAWGRIT_REPORTS_TOKEN`.
  Звіт mock-provider також містить source-level показники запуску Gateway, пам’яті,
  plugin-pressure, повторюваного fake-model hello-loop і старту CLI.
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику file-read-style probe.
    Моделі, чиї метадані оголошують вхід `image`, також виконують крихітний image-хід.
    Вимкніть додаткові probe за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають reusable live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker live model
    matrix jobs, розбиті за провайдерами.
  - Для сфокусованих CI rerun виконайте dispatch `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додайте нові high-signal секрети провайдера до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    scheduled/release caller.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через native plugin binding замість ACP.
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через plugin-owned Codex app-server harness,
    перевіряє `/codex status` і `/codex models` та за замовчуванням виконує image,
    cron MCP, sub-agent і Guardian probe. Вимкніть sub-agent probe за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої Codex
    app-server. Для сфокусованої перевірки sub-agent вимкніть інші probe:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після sub-agent probe, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Crestodian rescue command smoke: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова belt-and-suspenders перевірка поверхні rescue-команди message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Crestodian planner Docker smoke: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без config з фейковим Claude CLI у `PATH`
    і перевіряє, що fuzzy planner fallback транслюється в audited typed
    config write.
- Crestodian first-run Docker smoke: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього OpenClaw state dir, маршрутизує bare `openclaw` до
    Crestodian, застосовує setup/model/agent/Discord plugin + SecretRef записи,
    валідує config і перевіряє audit entries. Той самий шлях Ring 0 setup
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

## QA-specific runners

Ці команди розташовані поруч з основними наборами тестів, коли потрібен реалізм QA-lab:

CI запускає QA Lab у dedicated workflows. `Parity gate` запускається на відповідних PR і
з manual dispatch з mock providers. `QA-Lab - All Lanes` запускається щоночі на
`main` і з manual dispatch з mock parity gate, live Matrix lane,
Convex-managed live Telegram lane і Convex-managed live Discord lane як
паралельні jobs. Scheduled QA і release checks явно передають Matrix `--profile fast`,
тоді як Matrix CLI і manual workflow input за замовчуванням залишаються
`all`; manual dispatch може розбивати `all` на `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli` jobs. `OpenClaw Release Checks` запускає parity плюс
fast Matrix і Telegram lanes перед release approval, використовуючи
`mock-openai/gpt-5.5` для release transport checks, щоб вони залишалися детермінованими
та уникали звичайного запуску provider-plugin. Ці live transport gateways вимикають
memory search; поведінка пам’яті залишається покритою QA parity suites.

Full release live media shards використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, який уже має
`ffmpeg` і `ffprobe`. Docker live model/backend shards використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
commit, а потім завантажують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
в кожному shard.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії, підтримані репозиторієм, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway-працівниками. Для `qa-channel` стандартна паралельність становить 4 (обмежена
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість
    працівників, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, коли будь-який сценарій не проходить. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни сценарно-обізнаної
    лінії `mock-openai`.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає бенч запуску Gateway плюс невеликий пакет мокових сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує об’єднаний підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише сталі спостереження гарячого CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тому короткі сплески під час запуску записуються як метрики
    без вигляду регресії, коли Gateway на кілька хвилин притискає CPU.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, якщо checkout ще не
    має свіжого runtime-виводу.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Живі запуски передають підтримувані QA-входи автентифікації, практичні для гостьової системи:
    ключі провайдера на основі env, шлях до конфігурації живого QA-провайдера та `CODEX_HOME`,
    коли він наявний.
  - Каталоги виводу мають залишатися в корені репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт і підсумок плюс журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, встановлює його глобально в
    Docker, запускає неінтерактивний onboarding з ключем OpenAI API, за замовчуванням налаштовує Telegram,
    перевіряє, що runtime запакованого Plugin завантажується без виправлення залежностей
    під час запуску, запускає doctor і виконує один локальний хід агента проти
    мокового endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму лінію
    запакованого встановлення з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детермінований Docker-smoke зібраного застосунку для транскриптів вбудованого runtime-контексту.
    Він перевіряє, що прихований runtime-контекст OpenClaw зберігається як
    невідображуване користувацьке повідомлення, а не просочується у видимий хід користувача,
    потім засіває уражений зламаний session JSONL і перевіряє,
    що `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює пакет-кандидат OpenClaw у Docker, запускає onboarding установленого пакета,
    налаштовує Telegram через установлений CLI, а потім повторно використовує
    живу QA-лінію Telegram з цим установленим пакетом як SUT Gateway.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; задайте
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв’язаний локальний tarball замість
    встановлення з реєстру.
  - Використовує ті самі Telegram env-облікові дані або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізів задайте
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    Docker-wrapper автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільну
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions надає цю лінію як ручний workflow для maintainers
    `NPM Telegram Beta E2E`. Він не запускається під час merge. Workflow використовує
    середовище `qa-live-shared` і оренди облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для побічного продуктового proof
  проти одного пакета-кандидата. Він приймає довірений ref, опубліковану npm-специфікацію,
  HTTPS URL tarball плюс SHA-256 або артефакт tarball з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний Docker E2E scheduler із профілями ліній smoke, package, product, full або custom.
  Задайте `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  Telegram QA workflow проти того самого артефакту `package-under-test`.
  - Proof для останньої beta-версії продукту:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Proof для точного URL tarball потребує digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artifact proof завантажує артефакт tarball з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/плагіни через редагування конфігурації.
  - Перевіряє, що discovery налаштування залишає неналаштовані завантажувані плагіни відсутніми,
    перше налаштоване doctor-виправлення явно встановлює кожен відсутній завантажуваний
    Plugin, а другий restart не запускає приховане
    виправлення залежностей.
  - Також встановлює відому старішу npm-базу, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає залишки залежностей legacy Plugin без postinstall-виправлення
    з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає нативний smoke оновлення запакованого встановлення на гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі та перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний
    хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до артефакту підсумку та
    статусу кожної лінії.
  - Лінія OpenAI за замовчуванням використовує `openai/gpt-5.5` для proof живого ходу агента.
    Передайте `--model <provider/model>` або задайте
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не могли
    використати решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішній wrapper завис.
  - Оновлення Windows може витратити 10–15 хвилин на post-update doctor і роботу з
    оновленням пакетів на холодній гостьовій системі; це все ще нормальний стан, коли вкладений npm
    debug log просувається.
  - Не запускайте цей агрегований wrapper паралельно з окремими smoke-лініями Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, подавання пакетів або стану Gateway у гостьовій системі.
  - Post-update proof запускає звичайну поверхню вбудованих Plugin, бо
    фасади можливостей, як-от speech, image generation і media
    understanding, завантажуються через вбудовані runtime API, навіть коли сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає живу QA-лінію Matrix проти одноразового homeserver Tuwunel на базі Docker. Лише source-checkout — запаковані встановлення не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає живу QA-лінію Telegram проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Group id має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних pooled облікових даних. За замовчуванням використовуйте env-режим або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій не проходить. Використовуйте `--allow-failures`, коли вам
    потрібні артефакти без коду завершення з помилкою.
  - Потребує двох окремих ботів в одній приватній групі, причому SUT bot має надавати Telegram username.
  - Для стабільного bot-to-bot спостереження увімкніть Bot-to-Bot Communication Mode в `@BotFather` для обох ботів і переконайтеся, що driver bot може спостерігати груповий bot traffic.
  - Записує Telegram QA-звіт, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту надсилання driver до спостереженої відповіді SUT.

Живі транспортні лінії мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття для кожної лінії міститься в [QA overview → Live transport coverage](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий синтетичний набір і не є частиною цієї матриці.

### Спільні Telegram-облікові дані через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивну оренду з pool на базі Convex, надсилає heartbeats
для цієї оренди, поки лінія працює, і звільняє оренду під час shutdown.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайній роботі має використовувати `https://`.

Адмін-команди maintainer (pool add/remove/list) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-помічники для maintainers:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед живими запусками, щоб перевірити URL сайту Convex, broker secrets,
endpoint prefix, HTTP timeout і доступність admin/list без друку
значень секретів. Використовуйте `--json` для machine-readable виводу в скриптах і CI
утилітах.

Контракт стандартної кінцевої точки (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
- `groupId` має бути числовим рядком ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє неправильно сформовані payload.

### Додавання каналу до QA

Архітектура й назви допоміжних сценарних модулів для нових адаптерів каналів описані в [огляді QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати транспортний runner на спільному seam хоста `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Набори тестів (що де запускається)

Думайте про ці набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Модульні / інтеграційні (стандартно)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфіги окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; модульні тести UI запускаються у спеціальному шарді `unit-ui`
- Область:
  - Чисті модульні тести
  - Внутрішньопроцесні інтеграційні тести (автентифікація gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити fallback-поведінку широких `api.js` і
    `runtime-api.js` за допомогою згенерованих малих фікстур plugin, а не
    реальних API вихідного коду bundled plugin. Завантаження API реальних plugin належать до
    contract/integration наборів, якими володіють plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Нецільовий `pnpm test` запускає дванадцять менших конфігів шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати непов’язані набори.
    - `pnpm test --watch` усе ще використовує нативний граф проєкту root `vitest.config.ts`, бо watch-цикл із багатьма шардами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спершу маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` стандартно розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні зіставлення source і локальні залежні елементи import-graph. Зміни config/setup/package не запускають широкі тести, якщо явно не використати `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає тести Vitest; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Зміни версій лише в release metadata запускають цільові перевірки version/config/root-dependency із guard, який відхиляє зміни package поза верхньорівневим полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для скриптів live Docker auth і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни dependency, export, version та іншої package-surface все ще використовують ширші guards.
    - Легкі за імпортами модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` і подібних чистих utility-областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють changed-mode запуски з явними сусідніми тестами в цих легких lanes, тож зміни helper не перезапускають повний важкий набір для цього каталогу.
    - `auto-reply` має окремі buckets для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на шарди agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів усім хвостом Node.
    - Звичайний PR/main CI навмисно пропускає пакетний sweep extensions і release-only шард `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли змінюєте вхідні дані discovery message-tool або runtime-контекст Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для меж чистої маршрутизації та нормалізації.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка Compaction усе ще проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only тести
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базовий конфіг Vitest стандартно використовує `threads`.
    - Спільний конфіг Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e та live config.
    - Root UI lane зберігає свій `jsdom` setup і optimizer, але також працює на
      спільному non-isolated runner.
    - Кожен шард `pnpm test` успадковує ті самі стандартні значення `threads` + `isolate: false`
      зі спільного конфіга Vitest.
    - `scripts/run-vitest.mjs` стандартно додає `--no-maglev` для дочірніх процесів Vitest Node,
      щоб зменшити compile churn V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook виконує лише форматування. Він повторно stage-ить відформатовані файли й
      не запускає lint, typecheck або tests.
    - Запускайте `pnpm check:changed` явно перед handoff або push, коли вам
      потрібен smart local check gate.
    - `pnpm test:changed` стандартно маршрутизується через дешеві scoped lanes. Використовуйте
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent
      вирішує, що зміна harness, config, package або contract справді потребує ширшого
      покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Локальне auto-scaling workers навмисно консервативне й зменшує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest стандартно завдають менше шкоди.
    - Базовий конфіг Vitest позначає projects/config files як
      `forceRerunTriggers`, щоб reruns у changed-mode залишалися коректними, коли змінюється
      wiring тестів.
    - Конфіг залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      одне явне розташування cache для прямого профілювання.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про import-duration плюс
      вивід import-breakdown.
    - `pnpm test:perf:imports:changed` обмежує той самий profiling view
      файлами, зміненими з `origin/main`.
    - Дані часу шардів записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config запуски використовують шлях config як ключ; include-pattern CI
      shards додають назву shard, щоб filtered shards можна було відстежувати
      окремо.
    - Коли один hot test усе ще витрачає більшість часу на startup imports,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      mock-айте цей seam напряму замість deep-importing runtime helpers лише
      для передачі їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із нативним root-project path для цього committed
      diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` бенчмаркить поточне
      dirty tree, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root Vitest config.
    - `pnpm test:perf:profile:main` записує main-thread CPU profile для
      startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує runner CPU+heap profiles для
      unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Запускає реальний loopback Gateway із diagnostics, увімкненими стандартно
  - Проганяє синтетичний churn gateway message, memory і large-payload через diagnostic event path
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває допоміжні модулі збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS samples лишаються нижче pressure budget, а глибини per-session queue повертаються до нуля
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Вузький lane для подальшої роботи зі stability-regression, не заміна повному набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E tests у `extensions/`
- Стандартні runtime-значення:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивні workers (CI: до 2, локально: стандартно 1).
  - Стандартно запускається в silent mode, щоб зменшити overhead console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Область:
  - End-to-end поведінка multi-instance gateway
  - Поверхні WebSocket/HTTP, node pairing і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у модульних тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через справжні `sandbox ssh-config` + виконання SSH
  - Перевіряє віддалено-канонічну поведінку файлової системи через міст fs sandbox
- Очікування:
  - Лише за явним увімкненням; не є частиною стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого daemon Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарний файл CLI або wrapper script

### Live (справжні провайдери + справжні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи цей провайдер/модель справді працює _сьогодні_ зі справжніми обліковими даними?»
  - Виявляє зміни форматів провайдерів, особливості виклику інструментів, проблеми автентифікації та поведінку обмежень швидкості
- Очікування:
  - За задумом не є стабільним для CI (справжні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує ліміти швидкості
  - Віддавайте перевагу запуску звужених підмножин замість «усього»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють конфігурацію/матеріали автентифікації в тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш справжній `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви навмисно хочете, щоб live-тести використовували ваш справжній домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює тихіше: зберігає прогрес-вивід `[live] ...`, але приховує додаткове повідомлення `~/.profile` і вимикає bootstrap-логи gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні логи запуску.
- Ротація API-ключів (залежить від провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи перевизначення для окремого live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях з обмеженням швидкості.
- Вивід прогресу/heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тому довгі виклики провайдера помітно активні навіть тоді, коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/gateway транслювалися негайно під час live-запусків.
  - Налаштуйте heartbeats прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте heartbeats gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевого шару gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запустіть звужений `pnpm test:live`

## Live-тести (з доступом до мережі)

Для live-матриці моделей, smoke-тестів backend CLI, smoke-тестів ACP, harness app-server Codex
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, media harness), а також обробки облікових даних для live-запусків, див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального контрольного списку оновлень і
валідації Plugin див.
[Тестування оновлень і Plugin](/uk/help/testing-updates-plugins).

## Docker runners (необов’язкові перевірки «працює в Linux»)

Ці Docker runners поділяються на дві групи:

- Live-model runners: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням мають менший smoke-ліміт, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли ви
  явно хочете більший вичерпний scan.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm tarball через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Bare-образ є лише Node/Git runner для install/update/plugin-dependency lanes; ці lanes монтують попередньо зібраний tarball. Functional-образ встановлює той самий tarball у `/app` для built-app functionality lanes. Визначення Docker lanes містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка planner міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегатор використовує зважений локальний scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким live-, npm-install- і multi-service lanes стартувати всім одночасно. Якщо окремий lane важчий за активні обмеження, scheduler все одно може запустити його, коли pool порожній, а потім тримає його єдиним запущеним, доки знову не стане доступною capacity. За замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більше запасу. Runner за замовчуванням виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, друкує статус кожні 30 секунд, зберігає таймінги успішних lanes у `.artifacts/docker-tests/lane-timings.json` і використовує ці таймінги, щоб у наступних запусках першими стартували довші lanes. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест lanes без збирання чи запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних lanes, потреб package/image і облікових даних.
- `Package Acceptance` — це нативний для GitHub package gate для питання «чи працює цей installable tarball як продукт?». Він визначає один candidate package із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає reusable Docker E2E lanes проти саме цього tarball замість перепакування вибраного ref. Профілі впорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і Plugin](/uk/help/testing-updates-plugins) щодо контракту package/update/plugin, матриці published-upgrade survivor, стандартних налаштувань release і triage збоїв.
- Перевірки build і release запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Guard обходить статичний built graph від `dist/entry.js` і `dist/cli/run-main.js` та завершується з помилкою, якщо startup imports до dispatch команди імпортують package dependencies, як-от Commander, prompt UI, undici або logging; він також утримує bundled gateway run chunk у межах бюджету та відхиляє статичні імпорти відомих холодних gateway paths. Packaged CLI smoke також охоплює root help, onboard help, doctor help, status, config schema і команду model-list.
- Застаріла сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цього cutoff harness допускає лише прогалини shipped-package metadata: пропущені private QA inventory entries, відсутній `gateway install --wrapper`, відсутні patch-файли у tarball-derived git fixture, відсутній persisted `update.channel`, застарілі розташування plugin install-record, відсутня marketplace install-record persistence і міграція config metadata під час `plugins update`. Для package після `2026.4.25` ці шляхи є strict failures.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker runners також bind-mount лише потрібні auth homes CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати tokens без зміни auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, зі строгим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Observability smoke: `pnpm qa:otel:smoke` є приватною QA-лінією перевірки вихідного checkout. Її навмисно не включено до Docker-ліній випуску пакета, оскільки npm tarball не містить QA Lab.
- Open WebUI live smoke: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Npm tarball onboarding/channel/agent smoke: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований OpenClaw tarball у Docker, налаштовує OpenAI через env-ref онбординг і Telegram за замовчуванням, запускає doctor і виконує один змоканий хід агента OpenAI. Повторно використайте попередньо зібраний tarball з `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на host за допомогою `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал за допомогою `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Update channel switch smoke: `pnpm test:docker:update-channel-switch` глобально встановлює запакований OpenClaw tarball у Docker, перемикається з пакетного `stable` на git `dev`, перевіряє збережений канал і роботу плагіна після оновлення, потім перемикається назад на пакетний `stable` і перевіряє статус оновлення.
- Upgrade survivor smoke: `pnpm test:docker:upgrade-survivor` встановлює запакований OpenClaw tarball поверх забрудненої фікстури старого користувача з агентами, конфігурацією каналу, allowlist плагінів, застарілим станом залежностей плагінів і наявними файлами workspace/session. Він запускає оновлення пакета плюс неінтерактивний doctor без live provider або ключів каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети startup/status.
- Published upgrade survivor smoke: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, сідує реалістичні файли наявного користувача, налаштовує цей baseline за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до candidate tarball, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, startup, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один baseline за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований scheduler розгорнути точні baseline за допомогою `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` і розгорніть фікстури у формі issue за допомогою `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; набір reported-issues містить `configured-plugin-installs` для автоматичного ремонту встановлення зовнішнього плагіна OpenClaw. Package Acceptance експонує їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Session runtime context smoke: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого transcript runtime context плюс ремонт doctor для зачеплених дубльованих гілок prompt-rewrite.
- Bun global install smoke: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих provider зображень замість зависання. Повторно використайте попередньо зібраний tarball з `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image за допомогою `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm cache для своїх root, update і direct-npm контейнерів. Update smoke за замовчуванням використовує npm `latest` як stable baseline перед оновленням до candidate tarball. Перевизначте локально за допомогою `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Non-root перевірки інсталятора тримають ізольований npm cache, щоб записи cache, що належать root, не маскували поведінку user-local встановлення. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними повторними запусками.
- Install Smoke CI пропускає дубльоване direct-npm глобальне оновлення за допомогою `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Agents delete shared workspace CLI smoke: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає root Dockerfile image, сідує двох агентів з одним workspace в ізольованому container home, запускає `agents delete --json` і перевіряє коректний JSON плюс поведінку збереженого workspace. Повторно використайте install-smoke image за допомогою `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway networking (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Browser CDP snapshot smoke: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E image плюс шар Chromium, запускає Chromium із raw CDP, виконує `browser doctor --deep` і перевіряє, що CDP role snapshots охоплюють URL посилань, clickables, підвищені cursor, iframe refs і metadata frame.
- OpenAI Responses web_search minimal reasoning regression: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` з `minimal` до `low`, потім примусово відхиляє provider schema і перевіряє, що raw detail з’являється в логах Gateway.
- MCP channel bridge (seeded Gateway + stdio bridge + raw Claude notification-frame smoke): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Pi bundle MCP tools (реальний stdio MCP server + embedded Pi profile allow/deny smoke): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/subagent MCP cleanup (реальний Gateway + демонтаж stdio MCP child після ізольованого cron і one-shot subagent запусків): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install/update smoke для локального шляху, `file:`, npm registry з hoisted залежностями, git moving refs, ClawHub kitchen-sink, оновлень marketplace і Claude-bundle enable/inspect): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару kitchen-sink package/runtime за допомогою `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстури ClawHub.
- Plugin update unchanged smoke: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Config reload metadata smoke: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює install/update smoke для локального шляху, `file:`, npm registry з hoisted залежностями, git moving refs, фікстур ClawHub, оновлень marketplace і Claude-bundle enable/inspect. `pnpm test:docker:plugin-update` охоплює поведінку unchanged update для встановлених плагінів.

Щоб вручну попередньо зібрати й повторно використовувати спільний functional image:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних suite, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, коли їх задано. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо він ще не є локальним. QR і installer Docker тести зберігають власні Dockerfile, бо вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Docker runners для live-model також монтують поточний checkout лише для читання і
розгортають його у тимчасовий workdir всередині контейнера. Це зберігає runtime
image компактним, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок staging пропускає великі локальні cache і build outputs застосунку, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також app-local `.build` або
директорії output Gradle, щоб Docker live runs не витрачали хвилини на копіювання
machine-specific artifacts.
Вони також задають `OPENCLAW_SKIP_CHANNELS=1`, щоб gateway live probes не запускали
реальні worker каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити gateway
live coverage із цієї Docker lane.
`test:docker:openwebui` є вищорівневим compatibility smoke: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoints,
запускає pinned контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` експонує `openclaw/default`, а потім надсилає
реальний chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може знадобитися завантажити
image Open WebUI, а Open WebUI може знадобитися завершити власне cold-start setup.
Ця lane очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального акаунта Telegram, Discord або iMessage. Він завантажує seeded Gateway
container, запускає другий контейнер, який створює `openclaw mcp serve`, потім
перевіряє routed conversation discovery, transcript reads, attachment metadata,
поведінку live event queue, outbound send routing і Claude-style channel +
permission notifications через реальний stdio MCP bridge. Перевірка notification
інспектує raw stdio MCP frames напряму, тож smoke перевіряє те, що
bridge фактично emit, а не лише те, що випадково surface конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live
model key. Він збирає repo Docker image, запускає реальний stdio MCP probe server
всередині контейнера, матеріалізує цей server через embedded Pi bundle
MCP runtime, виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
tools `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live model
key. Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований cron turn і one-shot child turn `/subagents spawn`, а потім перевіряє,
що MCP child process завершується після кожного запуску.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для regression/debug workflows. Він може знову знадобитися для валідації ACP thread routing, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) змонтовано до `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) змонтовано до `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) змонтовано до `/home/node/.profile` і завантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевірити лише змінні середовища, завантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочого простору та без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) змонтовано до `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються до `/home/node/...` перед запуском тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, які не потребують повторного збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілю (не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway відкриває для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує smoke-тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування документів: `pnpm check:docs`.
Запускайте повну перевірку anchors Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії “реального pipeline” без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальні gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "запускає наскрізний виклик інструмента mock OpenAI через цикл агента gateway")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + застосовується автентифікація): `src/gateway/gateway.test.ts` (випадок: "запускає майстер через ws і записує конфігурацію токена автентифікації")

## Eval-и надійності агента (skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як “eval-и надійності агента”:

- Mock-виклик інструментів через реальні gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють зв’язування сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого досі бракує для skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval-и мають передусім залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання файлів skill і зв’язування сесії.
- Невеликий набір сценаріїв, сфокусованих на skill (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live eval-и (opt-in, gated через env) лише після появи безпечного для CI набору.

## Контрактні тести (форма plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований plugin і канал відповідає своєму
інтерфейсному контракту. Вони проходять по всіх виявлених plugins і запускають набір
перевірок форми та поведінки. Стандартна unit-lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка зв’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID thread
- **directory** - API каталогу/roster
- **group-policy** - Застосування групової політики

### Контракти статусу провайдера

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

- Після зміни експортів або subpaths plugin-sdk
- Після додавання або зміни каналу чи provider plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub провайдера або зафіксуйте точне перетворення форми запиту)
- Якщо це за своєю суттю лише live-проблема (обмеження частоти, політики автентифікації), тримайте live-тест вузьким і opt-in через env vars
- Надавайте перевагу найменшому шару, який ловить баг:
  - баг перетворення/відтворення запиту провайдера → прямий тест моделей
  - баг pipeline сесії/історії/інструментів gateway → live smoke gateway або безпечний для CI mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id із traversal-сегментами відхиляються.
  - Якщо ви додаєте нову цільову родину SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
