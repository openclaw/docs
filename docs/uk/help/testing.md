---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway та агента
summary: 'Набір для тестування: набори тестів unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-05-01T22:37:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f9f9731281267faa880da7c8b4dff27b05d9656c412b25e912fa464ed7d5472
    source_path: help/testing.md
    workflow: 16
---

OpenClaw має три набори Vitest (модульний/інтеграційний, e2e, із реальними сервісами) і невеликий набір
ранерів Docker. Цей документ є посібником «як ми тестуємо»:

- Що охоплює кожен набір (і що він свідомо _не_ охоплює).
- Які команди запускати для типових робочих процесів (локально, перед надсиланням змін, під час налагодження).
- Як тести з реальними сервісами знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

<Note>
**Стек QA (qa-lab, qa-channel, маршрути транспорту з реальними сервісами)** задокументовано окремо:

- [Огляд QA](/uk/concepts/qa-e2e-automation) — архітектура, поверхня команд, створення сценаріїв.
- [Matrix QA](/uk/concepts/qa-matrix) — довідка для `pnpm openclaw qa matrix`.
- [Канал QA](/uk/channels/qa-channel) — синтетичний транспортний плагін, який використовують сценарії, що спираються на репозиторій.

Ця сторінка описує запуск звичайних наборів тестів і ранерів Docker/Parallels. Розділ нижче зі спеціальними ранeрами QA ([спеціальні ранери QA](#qa-specific-runners)) перелічує конкретні виклики `qa` і відсилає до наведених вище довідок.
</Note>

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед надсиланням змін): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на машині з достатніми ресурсами: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Прямий вибір файлу тепер також обробляє шляхи розширень/каналів: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Коли ітеруєте над однією помилкою, спершу надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-маршрут на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли змінюєте тести або хочете додаткової впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потребує реальних облікових даних):

- Набір тестів із реальними сервісами (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо запустити один файл із тестами реальних сервісів: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін реальних моделей: `pnpm test:docker:live-models`
  - Для кожної вибраної моделі тепер запускається текстовий хід і невелика перевірка у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують короткий хід із зображенням.
    Вимикайте додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають багаторазовий workflow live/E2E з
    `include_live_suites: true`, що включає окремі Docker-завдання матриці реальних моделей,
    розбиті за провайдерами.
  - Для сфокусованих повторних запусків у CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові інформативні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` та його
    запланованих/релізних викликачів.
- Базова перевірка нативного прив’язаного чату Codex: `pnpm test:docker:live-codex-bind`
  - Запускає Docker-маршрут із реальними сервісами проти шляху app-server Codex, прив’язує синтетичний
    Slack DM за допомогою `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення зображення
    проходять через нативну прив’язку плагіна замість ACP.
- Базова перевірка тестового стенда app-server Codex: `pnpm test:docker:live-codex-harness`
  - Запускає ходи агента Gateway через тестовий стенд app-server Codex, яким володіє плагін,
    перевіряє `/codex status` і `/codex models`, а за замовчуванням виконує перевірки зображення,
    Cron MCP, дочірнього агента та Guardian. Вимикайте перевірку дочірнього агента за допомогою
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, коли ізолюєте інші збої
    app-server Codex. Для сфокусованої перевірки дочірнього агента вимкніть інші перевірки:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Це завершується після перевірки дочірнього агента, якщо не встановлено
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0`.
- Базова перевірка команди порятунку Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова захисна перевірка за явним увімкненням для поверхні команди порятунку
    каналу повідомлень. Вона виконує `/crestodian status`, ставить у чергу збережувану зміну
    моделі, відповідає `/crestodian yes` і перевіряє шлях запису аудиту/конфігурації.
- Базова Docker-перевірка планувальника Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з фальшивим Claude CLI у `PATH`
    і перевіряє, що нечіткий резервний механізм планувальника перетворюється на аудитований типізований
    запис конфігурації.
- Базова Docker-перевірка першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Починає з порожнього каталогу стану OpenClaw, спрямовує чистий `openclaw` до
    Crestodian, застосовує записи налаштування/моделі/агента/плагіна Discord + SecretRef,
    перевіряє конфігурацію та записи аудиту. Той самий шлях налаштування Ring 0
    також покрито в QA Lab за допомогою
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Базова перевірка вартості Moonshot/Kimi: зі встановленим `MOONSHOT_API_KEY` запустіть
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізоване `usage.cost`.

<Tip>
Коли потрібен лише один проблемний випадок, звужуйте тести з реальними сервісами через змінні середовища списку дозволених, описані нижче.
</Tip>

## Спеціальні ранери QA

Ці команди доповнюють основні набори тестів, коли потрібна реалістичність QA-lab:

CI запускає QA Lab у спеціальних робочих процесах. `Parity gate` запускається для відповідних PR і
з ручного запуску з моковими провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного запуску з моковою перевіркою паритету, маршрутом Matrix із реальними сервісами,
керованим Convex маршрутом Telegram із реальними сервісами та керованим Convex маршрутом Discord із реальними сервісами як
паралельними завданнями. Заплановані перевірки QA і релізні перевірки явно передають Matrix `--profile fast`,
тоді як типове значення в Matrix CLI та ручному введенні workflow залишається
`all`; ручний запуск може розбити `all` на завдання `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` і `e2ee-cli`. `OpenClaw Release Checks` перед затвердженням релізу запускає перевірку паритету плюс
швидкі маршрути Matrix і Telegram, використовуючи
`mock-openai/gpt-5.5` для релізних перевірок транспорту, щоб вони залишалися детермінованими
й уникали звичайного запуску плагіна провайдера. Ці Gateway-и транспорту з реальними сервісами вимикають
пошук у пам’яті; поведінка пам’яті залишається покритою наборами паритету QA.

Повні релізні шарди медіа з реальними сервісами використовують
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, де вже є
`ffmpeg` і `ffprobe`. Docker-шарди реальних моделей/бекендів використовують спільний
образ `ghcr.io/openclaw/openclaw-live-test:<sha>`, зібраний один раз для вибраного
коміту, а потім витягують його з `OPENCLAW_SKIP_DOCKER_BUILD=1` замість повторної збірки
всередині кожного шарду.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії, що спираються на репозиторій, безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    воркерами Gateway. Типова конкурентність `qa-channel` дорівнює 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість воркерів, або `--concurrency 1` для старішого послідовного маршруту.
  - Завершується з ненульовим кодом, коли будь-який сценарій падає. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу, не замінюючи маршрут `mock-openai`,
    обізнаний зі сценаріями.
- `pnpm test:gateway:cpu-scenarios`
  - Запускає тест продуктивності запуску Gateway плюс невеликий пакет мокових сценаріїв QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) і записує зведений підсумок спостережень CPU
    у `.artifacts/gateway-cpu-scenarios/`.
  - За замовчуванням позначає лише тривалі спостереження високого завантаження CPU (`--cpu-core-warn`
    плюс `--hot-wall-warn-ms`), тож короткі сплески під час запуску записуються як метрики
    і не виглядають як регресія, де Gateway на кілька хвилин завантажує CPU до межі.
  - Використовує зібрані артефакти `dist`; спершу запустіть збірку, якщо робоча копія ще не
    має актуальних артефактів виконання.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині одноразової Linux VM Multipass.
  - Зберігає таку саму поведінку вибору сценаріїв, як `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Запуски з реальними сервісами передають підтримувані автентифікаційні входи QA, практичні для гостьової системи:
    ключі провайдера зі змінних середовища, шлях до live-конфігурації провайдера QA та `CODEX_HOME`,
    коли він присутній.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб гостьова система могла записувати назад через
    змонтований робочий простір.
  - Записує звичайний звіт QA + підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає tarball npm з поточної робочої копії, встановлює його глобально в
    Docker, виконує неінтерактивне первинне налаштування з API-ключем OpenAI, за замовчуванням налаштовує Telegram,
    перевіряє, що упакований runtime плагіна завантажується без виправлення залежностей під час запуску,
    запускає doctor і виконує один локальний хід агента проти мокової
    кінцевої точки OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий маршрут встановлення пакета
    з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детерміновану Docker-перевірку зібраного застосунку для транскриптів із вбудованим контекстом виконання.
    Вона перевіряє, що прихований контекст виконання OpenClaw зберігається як
    нестандартне повідомлення без відображення замість потрапляння у видимий хід користувача,
    потім додає як початкові дані уражений пошкоджений JSONL сесії та перевіряє, що
    `openclaw doctor --fix` переписує його до активної гілки з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює кандидат пакета OpenClaw у Docker, виконує первинне налаштування встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    маршрут QA Telegram із реальними сервісами з цим установленим пакетом як Gateway системи під тестуванням.
  - Типове значення: `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; встановіть
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` або
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, щоб тестувати розв’язаний локальний tarball замість
    встановлення з реєстру.
  - Використовує ті самі облікові дані Telegram зі змінних середовища або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізу встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього маршруту.
  - GitHub Actions надає цей маршрут як ручний workflow мейнтейнера
    `NPM Telegram Beta E2E`. Він не запускається під час злиття. Workflow використовує
    середовище `qa-live-shared` і оренди облікових даних Convex CI.
- GitHub Actions також надає `Package Acceptance` для окремої продуктової перевірки
  одного кандидата пакета. Він приймає довірений ref, опубліковану специфікацію npm,
  HTTPS-URL tarball плюс SHA-256 або артефакт tarball з іншого запуску, завантажує
  нормалізований `openclaw-current.tgz` як `package-under-test`, а потім запускає
  наявний планувальник Docker E2E з профілями маршрутів smoke, package, product, full або custom.
  Встановіть `telegram_mode=mock-openai` або `live-frontier`, щоб запустити
  workflow QA Telegram проти того самого артефакту `package-under-test`.
  - Продуктова перевірка останньої beta:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Перевірка за точною URL-адресою tarball потребує хешу:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Підтвердження артефактом завантажує tarball-артефакт з іншого запуску Actions:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Пакує й установлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані канали/plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає неналаштовані завантажувані plugins відсутніми,
    перше налаштоване виправлення doctor явно встановлює кожен відсутній завантажуваний
    plugin, а другий перезапуск не запускає приховане виправлення
    залежностей.
  - Також установлює відомий старіший базовий варіант npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    очищає залишки застарілих залежностей plugin без
    postinstall-виправлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke для оновлення packaged-install у гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім запускає
    встановлену команду `openclaw update` у тій самій гостьовій системі та перевіряє
    встановлену версію, статус оновлення, готовність Gateway і один локальний хід
    агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерацій на одній гостьовій системі. Використовуйте `--json` для шляху до підсумкового артефакта та
    статусу кожної смуги.
  - Смуга OpenAI за замовчуванням використовує `openai/gpt-5.5` для підтвердження live agent-turn.
    Передайте `--model <provider/model>` або встановіть
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, коли навмисно перевіряєте іншу
    модель OpenAI.
  - Обгортайте довгі локальні запуски в timeout на хості, щоб зависання транспорту Parallels не могли
    спожити решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали смуг у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж припускати, що зовнішня обгортка зависла.
  - Оновлення Windows може витратити від 10 до 15 хвилин на post-update doctor і роботу з
    оновленням пакетів на холодній гостьовій системі; це все ще нормально, якщо вкладений npm
    debug-журнал просувається.
  - Не запускайте цю агрегатну обгортку паралельно з окремими smoke-смугами Parallels
    macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, обслуговування пакетів або стану Gateway у гостьовій системі.
  - Post-update proof запускає звичайну вбудовану поверхню plugin, оскільки
    capability facades, такі як speech, image generation і media
    understanding, завантажуються через вбудовані runtime API, навіть коли сам хід агента
    перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-смугу Matrix проти disposable Docker-backed homeserver Tuwunel. Лише source-checkout — packaged installs не постачають `qa-lab`.
  - Повний CLI, каталог профілів/сценаріїв, env vars і структура артефактів: [Matrix QA](/uk/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Запускає live QA-смугу Telegram проти реальної приватної групи, використовуючи токени driver і SUT bot з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних pooled credentials. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
    потрібні артефакти без коду виходу, що означає невдачу.
  - Потребує двох різних bot в одній приватній групі, причому SUT bot має відкривати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot і переконайтеся, що driver bot може спостерігати груповий bot-трафік.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії відповідей містять RTT від запиту надсилання driver до спостереженої відповіді SUT.

Live transport lanes мають один стандартний контракт, щоб нові транспорти не розходилися; матриця покриття для кожної смуги розміщена в [Огляд QA → Покриття live transport](/uk/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` — це широкий synthetic suite, і він не є частиною цієї матриці.

### Спільні облікові дані Telegram через Convex (v1)

Коли `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) увімкнено для
`openclaw qa telegram`, QA lab отримує ексклюзивну lease з пулу на базі Convex, надсилає heartbeats
для цієї lease, поки смуга виконується, і звільняє lease під час завершення.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один secret для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex для розробки лише локально.

`OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://` у звичайній роботі.

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують
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
значень secret. Використовуйте `--json` для машинно-читаного виводу в scripts і CI
utilities.

Контракт endpoint за замовчуванням (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Захист active lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише maintainer secret)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для kind Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком числового ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payloads.

### Додавання каналу до QA

Архітектура та імена scenario-helper для нових адаптерів каналів описані в [Огляд QA → Додавання каналу](/uk/concepts/qa-e2e-automation#adding-a-channel). Мінімальна вимога: реалізувати transport runner на спільному host seam `qa-lab`, оголосити `qaRunners` у маніфесті plugin, змонтувати як `openclaw qa <runner>` і створити сценарії в `qa/scenarios/`.

## Тестові набори (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують shard-набір `vitest.full-*.config.ts` і можуть розгортати multi-project shards у per-project configs для паралельного планування
- Файли: core/unit inventories у `src/**/*.test.ts`, `packages/**/*.test.ts` і `test/**/*.test.ts`; UI unit tests запускаються у виділеному shard `unit-ui`
- Область:
  - Чисті unit tests
  - In-process integration tests (gateway auth, routing, tooling, parsing, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні keys не потрібні
  - Має бути швидким і стабільним
  - Тести resolver і public-surface loader мають доводити широку fallback-поведінку `api.js` і
    `runtime-api.js` за допомогою згенерованих малих fixtures plugin, а не
    справжніх bundled plugin source APIs. Завантаження справжніх plugin API належать до
    contract/integration suites, що належать plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - Ненацілений `pnpm test` запускає дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського нативного процесу кореневого проєкту. Це зменшує піковий RSS на завантажених машинах і запобігає тому, щоб робота auto-reply/extensions виснажувала непов’язані набори тестів.
    - `pnpm test --watch` досі використовує нативний кореневий граф проєкту `vitest.config.ts`, бо цикл спостереження з кількома shard-ами непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку спрямовують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не сплачує повну вартість запуску кореневого проєкту.
    - `pnpm test:changed` типово розгортає змінені git-шляхи в дешеві scoped lanes: прямі зміни тестів, сусідні файли `*.test.ts`, явні мапінги джерел і локальні залежні елементи import-graph. Зміни конфігурації/налаштувань/пакунків не запускають широкі тести, якщо ви явно не використаєте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` — звичайний розумний локальний check gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata, live Docker tooling і tooling, а потім запускає відповідні команди typecheck, lint і guard. Він не запускає Vitest-тести; для тестового доказу викликайте `pnpm test:changed` або явний `pnpm test <target>`. Підвищення версій лише в release metadata запускають цільові перевірки версії/конфігурації/кореневих залежностей із guard, який відхиляє зміни пакунків поза верхньорівневим полем version.
    - Зміни live Docker ACP harness запускають сфокусовані перевірки: синтаксис shell для live Docker auth scripts і dry-run live Docker scheduler. Зміни `package.json` включаються лише тоді, коли diff обмежений `scripts["test:docker:live-*"]`; зміни залежностей, export, version та іншої поверхні пакунка досі використовують ширші guards.
    - Легкі щодо імпортів модульні тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих utility-зон спрямовуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також маплять changed-mode запуски на явні сусідні тести в цих легких lanes, тому зміни helpers не перезапускають повний важкий набір для цього каталогу.
    - `auto-reply` має окремі buckets для верхньорівневих core helpers, верхньорівневих інтеграційних тестів `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково розділяє піддерево reply на shards agent-runner, dispatch і commands/state-routing, щоб один import-heavy bucket не володів повним Node-хвостом.
    - Звичайний CI для PR/main навмисно пропускає пакетний sweep extensions і release-only shard `agentic-plugins`. Full Release Validation запускає окремий дочірній workflow `Plugin Prerelease` для цих plugin/extension-heavy наборів на release candidates.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Коли ви змінюєте вхідні дані discovery для message-tool або runtime-контекст compaction, зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для меж чистого routing і normalization.
    - Підтримуйте справність інтеграційних наборів embedded runner:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction досі проходять
      через реальні шляхи `run.ts` / `compact.ts`; helper-only тести не є
      достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у кореневих проєктах, e2e та live-конфігураціях.
    - Кореневий UI lane зберігає своє налаштування `jsdom` та optimizer, але також працює на спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
    - Pre-commit hook відповідає лише за форматування. Він повторно stage-ить відформатовані файли та не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передаванням або push, коли вам потрібен розумний локальний check gate.
    - `pnpm test:changed` типово спрямовується через дешеві scoped lanes. Використовуйте `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` лише тоді, коли agent вирішує, що зміна harness, config, package або contract справді потребує ширшого покриття Vitest.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку routing, лише з вищим обмеженням workers.
    - Локальне auto-scaling workers навмисно консервативне й зменшує навантаження, коли load average хоста вже високий, тому кілька паралельних запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як `forceRerunTriggers`, щоб rerun у changed-mode залишалися коректними, коли змінюється test wiring.
    - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одне явне розташування cache для прямого profiling.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпортів плюс вивід import-breakdown.
    - `pnpm test:perf:imports:changed` звужує той самий profiling view до файлів, змінених відносно `origin/main`.
    - Дані часу shard записуються в `.artifacts/vitest-shard-timings.json`.
      Whole-config запуски використовують шлях конфігурації як ключ; include-pattern CI shards додають назву shard, щоб filtered shards можна було відстежувати окремо.
    - Коли один hot test досі витрачає більшість часу на startup imports, тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і mock-айте цей seam напряму замість deep-importing runtime helpers лише для передавання їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює routed `test:changed` із нативним шляхом root-project для цього committed diff і друкує wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` вимірює поточне dirty tree, спрямовуючи список змінених файлів через `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU profile головного потоку для startup Vitest/Vite і transform overhead.
    - `pnpm test:perf:profile:runner` записує CPU+heap profiles runner для unit suite з вимкненим file parallelism.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Область:
  - Типово запускає реальний loopback Gateway з увімкненою diagnostics
  - Проганяє синтетичний churn gateway message, memory і large-payload через шлях diagnostic event
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helpers збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні RSS samples залишаються нижче pressure budget, а per-session queue depths повертаються до нуля
- Очікування:
  - Безпечно для CI й без ключів
  - Вузький lane для подальшої роботи над stability-regression, не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E тести в `extensions/`
- Runtime defaults:
  - Використовує Vitest `threads` з `isolate: false`, як і решта repo.
  - Використовує adaptive workers (CI: до 2, локально: типово 1).
  - Типово працює в silent mode, щоб зменшити overhead консольного I/O.
- Корисні overrides:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового worker count (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` для повторного ввімкнення verbose console output.
- Область:
  - End-to-end поведінка multi-instance gateway
  - WebSocket/HTTP surfaces, node pairing і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit tests (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Область:
  - Запускає ізольований OpenShell gateway на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenClaw OpenShell backend через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку filesystem через sandbox fs bridge
- Очікування:
  - Лише opt-in; не є частиною типового запуску `pnpm test:e2e`
  - Потребує локального `openshell` CLI та робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні overrides:
  - `OPENCLAW_E2E_OPENSHELL=1` для ввімкнення тесту під час ручного запуску ширшого e2e suite
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` для вказання нестандартного CLI binary або wrapper script

### Live (реальні providers + реальні models)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live tests bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (установлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - “Чи цей provider/model справді працює _сьогодні_ з реальними creds?”
  - Виявляє зміни format provider-ів, quirks tool-calling, проблеми auth і поведінку rate limit
- Очікування:
  - Навмисно не CI-stable (реальні мережі, реальні policies providers, quotas, outages)
  - Коштує грошей / використовує rate limits
  - Віддавайте перевагу запуску звужених subsets замість “усього”
- Live-запуски source-ять `~/.profile`, щоб підхопити відсутні API keys.
- Типово live-запуски все ще ізолюють `HOME` і копіюють config/auth material у тимчасовий test home, щоб unit fixtures не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live tests використовували ваш реальний home directory.
- `pnpm test:live` тепер типово працює в тихішому режимі: зберігає progress output `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає gateway bootstrap logs/Bonjour chatter. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API key (provider-specific): задайте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) чи per-live override через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при rate limit responses.
- Progress/heartbeat output:
  - Live suites тепер виводять progress lines у stderr, щоб довгі provider calls були помітно активними навіть коли Vitest console capture тихий.
  - `vitest.live.config.ts` вимикає Vitest console interception, щоб provider/gateway progress lines одразу транслювалися під час live runs.
  - Налаштуйте direct-model heartbeats через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштуйте gateway/probe heartbeats через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який suite запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Зміни в мережевій частині Gateway / протоколі WS / спарюванні: додайте `pnpm test:e2e`
- Налагодження “мій бот не працює” / збоїв, специфічних для провайдера / виклику інструментів: запустіть звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke-тестів бекенду CLI, smoke-тестів ACP, стенда
app-server Codex і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, зображення,
музика, відео, медіастенд) — а також обробки облікових даних для live-запусків — див.
[Тестування live-наборів](/uk/help/testing-live). Для спеціального контрольного списку оновлень і
валідації плагінів див.
[Тестування оновлень і плагінів](/uk/help/testing-updates-plugins).

## Docker-ранери (необов’язкові перевірки "працює в Linux")

Ці Docker-ранери поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та робочу область (і виконують `~/.profile`, якщо він змонтований). Відповідні локальні точки входу: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням мають менше обмеження для smoke-тестів, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці змінні середовища, коли
  явно потрібне ширше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, один раз пакує OpenClaw як npm-тарбол через `scripts/package-openclaw-for-docker.mjs`, а потім збирає/повторно використовує два образи `scripts/e2e/Dockerfile`. Базовий образ — це лише Node/Git-ранер для напрямів install/update/plugin-dependency; ці напрями монтують попередньо зібраний тарбол. Функціональний образ встановлює той самий тарбол у `/app` для напрямів функціональності зібраного застосунку. Визначення Docker-напрямів містяться в `scripts/lib/docker-e2e-scenarios.mjs`; логіка планувальника міститься в `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` виконує вибраний план. Агрегований запуск використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, а обмеження ресурсів не дають важким live-, npm-install- і multi-service-напрямам запускатися одночасно. Якщо один напрям важчий за активні обмеження, планувальник усе одно може запустити його, коли пул порожній, і потім тримає його єдиним запущеним, доки знову не з’явиться місткість. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. Ранер за замовчуванням виконує Docker preflight, видаляє застарілі OpenClaw E2E-контейнери, друкує статус кожні 30 секунд, зберігає тривалості успішних напрямів у `.artifacts/docker-tests/lane-timings.json` і використовує ці тривалості, щоб у наступних запусках першими стартували довші напрями. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест напрямів без збирання або запуску Docker, або `node scripts/test-docker-all.mjs --plan-json`, щоб надрукувати CI-план для вибраних напрямів, потреб у пакеті/образі та облікових даних.
- `Package Acceptance` — це нативний для GitHub пакетний gate для перевірки "чи працює цей установний тарбол як продукт?" Він визначає один пакет-кандидат із `source=npm`, `source=ref`, `source=url` або `source=artifact`, завантажує його як `package-under-test`, а потім запускає повторно використовувані Docker E2E-напрями саме проти цього тарбола замість повторного пакування вибраного ref. Профілі впорядковані за широтою: `smoke`, `package`, `product` і `full`. Див. [Тестування оновлень і плагінів](/uk/help/testing-updates-plugins) щодо контракту пакета/оновлення/плагіна, матриці виживання опублікованих оновлень, типових значень релізу та тріажу збоїв.
- Перевірки збірки й релізу запускають `scripts/check-cli-bootstrap-imports.mjs` після tsdown. Захист проходить статичним зібраним графом від `dist/entry.js` і `dist/cli/run-main.js` і завершується помилкою, якщо запуск до диспетчеризації команд імпортує залежності пакета, як-от Commander, prompt UI, undici або logging, до диспетчеризації команд; він також утримує зібраний chunk запуску Gateway в межах бюджету та відхиляє статичні імпорти відомих холодних шляхів Gateway. Smoke-тест упакованого CLI також охоплює кореневу довідку, довідку onboarding, довідку doctor, status, config schema і команду списку моделей.
- Зворотна сумісність Package Acceptance обмежена `2026.4.25` (включно з `2026.4.25-beta.*`). До цієї межі стенд допускає лише прогалини метаданих уже випущених пакетів: пропущені приватні записи QA-інвентарю, відсутній `gateway install --wrapper`, відсутні файли patch у git-фікстурі, отриманій із тарбола, відсутній збережений `update.channel`, застарілі розташування install-record плагінів, відсутнє збереження marketplace install-record і міграцію метаданих конфігурації під час `plugins update`. Для пакетів після `2026.4.25` ці шляхи є строгими збоями.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-моделей також bind-mount лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-тест прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; за замовчуванням охоплює Claude, Codex і Gemini, із суворим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- Smoke-тест бекенду CLI: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-тест тестового каркаса сервера застосунку Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + агент розробки: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke-тест спостережуваності: `pnpm qa:otel:smoke` є приватною лінією QA для перевірки вихідного checkout. Він навмисно не входить до ліній Docker-релізу пакета, оскільки npm-тарбол не містить QA Lab.
- Live smoke-тест Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне створення каркаса): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест онбордингу/каналу/агента для npm-тарбола: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований тарбол OpenClaw у Docker, налаштовує OpenAI через env-ref онбординг і Telegram за замовчуванням, запускає doctor і виконує один змокований хід агента OpenAI. Повторно використайте попередньо зібраний тарбол із `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості з `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал за допомогою `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест перемикання каналу оновлень: `pnpm test:docker:update-channel-switch` глобально встановлює запакований тарбол OpenClaw у Docker, перемикає з пакета `stable` на git `dev`, перевіряє збережений канал і роботу Plugin після оновлення, потім перемикає назад на пакет `stable` і перевіряє статус оновлення.
- Smoke-тест виживання після оновлення: `pnpm test:docker:upgrade-survivor` встановлює запакований тарбол OpenClaw поверх брудної фікстури старого користувача з агентами, конфігурацією каналу, allowlist Plugin, застарілим станом залежностей Plugin і наявними файлами workspace/session. Він запускає оновлення пакета та неінтерактивний doctor без живих ключів провайдера чи каналу, потім запускає loopback Gateway і перевіряє збереження конфігурації/стану, а також бюджети запуску/статусу.
- Smoke-тест виживання після оновлення опублікованої версії: `pnpm test:docker:published-upgrade-survivor` за замовчуванням встановлює `openclaw@latest`, засіває реалістичні файли наявного користувача, налаштовує цей базовий стан за допомогою вбудованого рецепта команд, перевіряє отриману конфігурацію, оновлює це опубліковане встановлення до тарбола-кандидата, запускає неінтерактивний doctor, записує `.artifacts/upgrade-survivor/summary.json`, потім запускає loopback Gateway і перевіряє налаштовані intents, збереження стану, запуск, `/healthz`, `/readyz` і бюджети статусу RPC. Перевизначте один базовий стан через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, попросіть агрегований планувальник розгорнути точні базові стани через `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` і розгорніть фікстури у формі issue через `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS`, наприклад `reported-issues`; Package Acceptance відкриває їх як `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` і `published_upgrade_survivor_scenarios`.
- Smoke-тест runtime-контексту сесії: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого runtime-контексту в transcript, а також repair через doctor для зачеплених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image providers замість зависання. Повторно використайте попередньо зібраний тарбол із `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke-тест інсталятора: `bash scripts/test-install-sh-docker.sh` спільно використовує один npm-кеш для своїх root, update і direct-npm контейнерів. Smoke-тест оновлення за замовчуванням використовує npm `latest` як стабільний базовий стан перед оновленням до тарбола-кандидата. Перевизначте локально через `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` або через input `update_baseline_version` workflow Install Smoke на GitHub. Перевірки інсталятора без root використовують ізольований npm-кеш, щоб записи кешу, власником яких є root, не маскували поведінку встановлення у користувацькому просторі. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm під час локальних повторних запусків.
- Install Smoke CI пропускає дубльоване глобальне оновлення direct-npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цієї змінної середовища, коли потрібне покриття прямого `npm install -g`.
- Smoke-тест CLI видалення спільного workspace агентами: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) за замовчуванням збирає образ із кореневого Dockerfile, засіває двох агентів з одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє валідний JSON та поведінку зі збереженим workspace. Повторно використайте install-smoke образ із `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Smoke-тест snapshot браузерного CDP: `pnpm test:docker:browser-cdp-snapshot` (скрипт: `scripts/e2e/browser-cdp-snapshot-docker.sh`) збирає source E2E образ плюс шар Chromium, запускає Chromium із сирим CDP, виконує `browser doctor --deep` і перевіряє, що snapshots ролей CDP охоплюють URL посилань, clickables, підвищені курсором, refs iframe і метадані frame.
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення schema провайдера й перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст MCP каналів (засіяний Gateway + stdio-міст + сирий smoke-тест notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- MCP tools бандла Pi (реальний stdio MCP server + smoke-тест allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron/subagent (реальний Gateway + демонтаж дочірнього stdio MCP після ізольованого cron і одноразових запусків subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (install smoke, встановлення/видалення ClawHub kitchen-sink, оновлення marketplace і ввімкнення/inspect Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
  Установіть `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, щоб пропустити блок ClawHub, або перевизначте стандартну пару package/runtime для kitchen-sink через `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` і `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Без `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` тест використовує герметичний локальний сервер фікстури ClawHub.
- Smoke-тест незміненого оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест метаданих перезавантаження конфігурації: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` охоплює install smoke, встановлення з локальної фікстури ClawHub, оновлення marketplace, встановлення залежностей npm-пакетів і ввімкнення/inspect Claude-bundle. `pnpm test:docker:plugin-update` охоплює поведінку незміненого оновлення для встановлених plugins.

Щоб вручну попередньо зібрати та повторно використати спільний функціональний образ:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для suite перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо він ще не є локальним. QR і Docker-тести інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime зібраного застосунку.

Docker runner-и live-model також монтують поточний checkout лише для читання та
розміщують його в тимчасовому workdir усередині контейнера. Це зберігає runtime
образ компактним, водночас запускаючи Vitest проти вашого точного локального source/config.
Крок staging пропускає великі локальні кеші та вихідні дані збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для застосунку `.build` або
каталоги вихідних даних Gradle, щоб Docker live runs не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також установлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live probes Gateway не запускали
реальні workers каналів Telegram/Discord/etc. усередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття Gateway
із цієї Docker lane.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP endpoints,
запускає pinned контейнер Open WebUI проти цього Gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` відкриває `openclaw/default`, а потім надсилає
реальний chat request через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
образу Open WebUI, а Open WebUI може потребувати завершення власного cold-start налаштування.
Ця lane очікує придатний live model key, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized runs.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він завантажує засіяний контейнер Gateway,
запускає другий контейнер, який породжує `openclaw mcp serve`, потім
перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень,
поведінку live event queue, маршрутизацію вихідного надсилання та Claude-style channel +
permission notifications через реальний stdio MCP bridge. Перевірка notification
інспектує сирі stdio MCP frames напряму, щоб smoke-тест перевіряв те, що
міст фактично емітує, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує live
model key. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей server через вбудований MCP runtime бандла Pi,
виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
`bundle-mcp` tools, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує live model
key. Він запускає засіяний Gateway із реальним stdio MCP probe server, виконує
ізольований cron turn і одноразовий дочірній turn `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke-тест plain-language thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для регресійних/debug workflow. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні змінні середовища:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і завантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише змінні середовища, завантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги конфігурації/робочої області та без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установок CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед запуском тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдера монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначте вручну за допомогою `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або списку через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані надходять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway надає для smoke-тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовується smoke-тестом Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагувань документації: `pnpm check:docs`.
Запускайте повну перевірку anchors Mintlify, коли також потрібні перевірки заголовків на сторінці: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує конфігурацію + забезпечує автентифікацію): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock-виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють зв’язування сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals насамперед мають залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання файлів skill і зв’язування сесії.
- Невеликий набір сценаріїв, сфокусованих на skill (використати чи уникнути, gating, prompt injection).
- Необов’язкові live evals (opt-in, керовані env) лише після того, як буде створено безпечний для CI набір.

## Контрактні тести (форма Plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
контракту інтерфейсу. Вони проходять по всіх виявлених plugins і запускають набір
перевірок форми та поведінки. Типова unit-лінія `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні каналів або провайдерів.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - базова форма Plugin (id, назва, можливості)
- **setup** - контракт майстра налаштування
- **session-binding** - поведінка зв’язування сесії
- **outbound-payload** - структура payload повідомлення
- **inbound** - обробка вхідних повідомлень
- **actions** - обробники дій каналу
- **threading** - обробка ID thread
- **directory** - API каталогу/roster
- **group-policy** - застосування політики груп

### Контракти статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - проби статусу каналу
- **registry** - форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - контракт потоку автентифікації
- **auth-choice** - вибір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - виявлення Plugin
- **loader** - завантаження Plugin
- **runtime** - runtime провайдера
- **shape** - форма/інтерфейс Plugin
- **wizard** - майстер налаштування

### Коли запускати

- Після зміни експортів або subpaths plugin-sdk
- Після додавання або змінення каналу чи provider plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI й не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо можливо (mock/stub провайдер або зафіксуйте точне перетворення форми запиту)
- Якщо це за своєю суттю лише live-випадок (rate limits, політики автентифікації), залишайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/відтворення запиту провайдера → прямий тест моделей
  - помилка pipeline сесії/історії/інструментів Gateway → gateway live smoke або безпечний для CI mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибрану ціль для кожного класу SecretRef з metadata реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec ids із traversal-сегментами відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target ids, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [Тестування оновлень і plugins](/uk/help/testing-updates-plugins)
- [CI](/uk/ci)
