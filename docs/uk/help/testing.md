---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделі/провайдера
    - Налагодження поведінки Gateway та агента
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-26T00:52:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef1760772a9732e6a0cd82614b20acef99d4d765f44380fecf4b53cbfca34451
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
ранерів Docker. Цей документ — це посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані й вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний контрольний набір перевірок (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку надавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-смуга на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Контрольне покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні справжні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-перевірка live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку в стилі читання файла.
    Моделі, чиї метадані оголошують вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, що включає окремі матричні завдання Docker для live-моделей,
    розбиті за провайдером.
  - Для цільових повторних запусків у CI запустіть `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів за розкладом/релізом.
- Native Codex перевірка bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускає live-смугу Docker проти шляху app-server Codex, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення-зображення
    проходять через native-прив’язку Plugin, а не через ACP.
- Перевірка rescue-команди Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Додаткова опціональна перевірка поверхні rescue-команди message-channel.
    Вона виконує `/crestodian status`, ставить у чергу постійну зміну моделі,
    відповідає `/crestodian yes` і перевіряє шлях запису audit/config.
- Docker-перевірка planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Запускає Crestodian у контейнері без конфігурації з підробленим Claude CLI в `PATH`
    і перевіряє, що нечіткий planner fallback перетворюється на auditований типовий запис у config.
- Docker-перевірка першого запуску Crestodian: `pnpm test:docker:crestodian-first-run`
  - Стартує з порожнього каталогу стану OpenClaw, маршрутизує голий `openclaw` до
    Crestodian, застосовує записи setup/model/agent/Discord plugin + SecretRef,
    перевіряє config і перевіряє записи audit. Той самий шлях налаштування Ring 0
    також охоплюється в QA Lab через
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Перевірка вартості Moonshot/Kimi: коли встановлено `MOONSHOT_API_KEY`, запустіть
  `openclaw models list --provider moonshot --json`, а потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Перевірте, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, надавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## Ранери, специфічні для QA

Ці команди використовуються поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
з ручного запуску з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного запуску з mock parity gate, live Matrix lane і live Telegram lane
під керуванням Convex як паралельні завдання. `OpenClaw Release Checks`
запускає ті самі смуги перед схваленням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    workers Gateway. Для `qa-channel` типове значення concurrency — 4 (обмежене
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість workers, або `--concurrency 1` для старішої послідовної смуги.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення зі збоєм.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття fixture і protocol-mock без заміни сценарно-орієнтованої смуги
    `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, практичні для гостьової системи:
    ключі провайдера на основі env, шлях до конфігурації QA live-провайдера і `CODEX_HOME`, якщо він є.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт і підсумок, а також журнали Multipass до
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської роботи в QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, встановлює його глобально в
    Docker, виконує неінтерактивне onboarding з API-ключем OpenAI, за замовчуванням налаштовує
    Telegram, перевіряє, що ввімкнення Plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний хід агента проти змокованого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму смугу
    встановлення пакета з Discord.
- `pnpm test:docker:session-runtime-context`
  - Запускає детерміновану Docker-перевірку built-app для вбудованих транскриптів runtime context.
    Вона перевіряє, що прихований runtime context OpenClaw зберігається як
    спеціальне повідомлення без відображення, а не витікає у видимий хід користувача,
    потім засіває порушений JSONL сесії й перевіряє, що
    `openclaw doctor --fix` переписує його на активну гілку з резервною копією.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    QA-смугу live Telegram з цим встановленим пакетом як Gateway SUT.
  - За замовчуванням використовує `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/релізу встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет Convex присутні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї смуги.
  - GitHub Actions надає цю смугу як ручний workflow для супровідників
    `NPM Telegram Beta E2E`. Вона не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує й встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/plugins через редагування config.
  - Перевіряє, що виявлення setup залишає runtime-залежності неконфігурованого Plugin
    відсутніми, що перший налаштований запуск Gateway або doctor встановлює runtime-залежності
    кожного bundled Plugin на вимогу, і що другий перезапуск не перевстановлює залежності,
    які вже були активовані.
  - Також встановлює відому старішу npm-базу, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата
    відновлює runtime-залежності bundled channel без postinstall-відновлення з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native-перевірку оновлення встановленого пакета у гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює запитаний базовий пакет, потім виконує
    встановлену команду `openclaw update` у тій самій гостьовій системі й перевіряє встановлену версію,
    статус оновлення, готовність gateway і один локальний хід агента.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux` під час
    ітерації над однією гостьовою системою. Використовуйте `--json` для шляху до підсумкового артефакту й
    статусу кожної смуги.
  - Обгортайте довгі локальні запуски в host timeout, щоб зависання транспорту Parallels не
    поглинало решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали смуг у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10–15 хвилин на post-update doctor/runtime
    відновлення залежностей на холодній гостьовій системі; це все ще нормальна поведінка, якщо вкладений
    журнал налагодження npm продовжує оновлюватися.
  - Не запускайте цю агреговану обгортку паралельно з окремими перевірками Parallels
    для macOS, Windows або Linux. Вони використовують спільний стан VM і можуть конфліктувати під час
    відновлення snapshot, видачі пакетів або стану guest gateway.
  - Доказ після оновлення запускає звичайну поверхню bundled Plugin, оскільки
    фасади можливостей, як-от speech, image generation і media
    understanding, завантажуються через bundled runtime API, навіть якщо сам
    хід агента перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-смугу QA Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Упаковані встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout репозиторію завантажують bundled-ранер безпосередньо; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначте його через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця смуга локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
  - За замовчуванням показує прогрес і примусово застосовує жорсткий тайм-аут виконання через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (типово 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а помилки містять команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live-смугу QA Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пулові оренди.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, коли
    вам потрібні артефакти без коду завершення зі збоєм.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати відкритий username Telegram.
  - Для стабільного спостереження бот-до-бота увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live-смуги транспорту мають один спільний стандартний контракт, щоб нові транспорти не розходилися в поведінці:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live-транспорту.

| Смуга    | Canary | Перевірка mention | Блок allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція треду | Спостереження реакцій | Команда help |
| -------- | ------ | ----------------- | -------------- | ------------------------- | ----------------------------- | -------------------------- | -------------- | --------------------- | ------------ |
| Matrix   | x      | x                 | x              | x                         | x                             | x                          | x              | x                     |              |
| Telegram | x      |                   |                |                           |                               |                            |                |                       | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
цієї оренди, поки смуга виконується, і звільняє оренду під час завершення роботи.

Базовий scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI типово `ci`, інакше `maintainer`)

Необов’язкові змінні env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL Convex `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди для супровідників (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для супровідників:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, HTTP timeout і доступність admin/list без виведення
значень секретів. Використовуйте `--json` для машинозчитуваного виводу в скриптах і CI-
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
  - Захист активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
володіти цим процесом.

`qa-lab` володіє спільною механікою хоста:

- кореневою командою `openclaw qa`
- запуском і завершенням набору
- паралелізмом workers
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Plugin ранери володіють контрактом транспорту:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як відкриваються транскрипти й нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляються специфічні для транспорту reset або cleanup

Мінімальний поріг впровадження для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Залишайте специфічну для транспорту механіку всередині runner Plugin або harness каналу.
4. Монтуйте ранер як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Plugin ранери мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Робіть `runtime-api.ts` легким; ледаче виконання CLI і раннера має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні helper-функції сценаріїв для нових сценаріїв.
7. Зберігайте наявні псевдоніми сумісності робочими, якщо в репозиторії не виконується навмисна міграція.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, залишайте її в цьому runner Plugin або harness Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додавайте загальний helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно відображайте це в контракті сценарію.

Бажані назви загальних helper-функцій для нових сценаріїв:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Псевдоніми сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати загальні назви helper-функцій.
Псевдоніми сумісності існують, щоб уникнути міграції одним днем, а не як модель
для написання нових сценаріїв.

## Набори тестів (що й де запускається)

Думайте про набори як про «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: ненаправлені запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shard у конфігурації для кожного проєкту для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelisted node-тести `ui`, охоплені `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Інтеграційні тести в межах процесу (автентифікація gateway, маршрутизація, інструменти, парсинг, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, shard і scoped-смуги">

    - Ненаправлені запуски `pnpm test` використовують дванадцять менших конфігурацій shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native-процесу root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
    - `pnpm test --watch` усе ще використовує native-граф проєктів root `vitest.config.ts`, тому що цикл watch із кількома shard непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped-смуги, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені шляхи git у ті самі scoped-смуги, коли diff торкається лише маршрутизованих вихідних/тестових файлів; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
    - `pnpm check:changed` — це звичайний розумний локальний контрольний набір перевірок для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, метадані релізу, live Docker tooling і tooling, а потім запускає відповідні смуги typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають один прохід перевірки extension, тому що extensions залежать від цих контрактів core. Підвищення версії лише в метаданих релізу запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем версії верхнього рівня.
    - Зміни harness live Docker ACP запускають сфокусований локальний контрольний набір перевірок: синтаксис shell для скриптів live Docker auth, dry-run планувальника live Docker, unit-тести ACP bind і тести extension ACPX. Вони не запускають повну матрицю Vitest, якщо diff також не торкається root/global-поверхні, як-от залежності або спільний setup Vitest.
    - Unit-тести з легкими імпортами з agents, commands, plugins, helper-функцій auto-reply, `plugin-sdk` і подібних чистих утилітних ділянок маршрутизуються через смугу `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних смугах.
    - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними сусідніми тестами в цих легких смугах, тому редагування helper-функцій уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має виділені кошики для helper-функцій core верхнього рівня, інтеграційних тестів верхнього рівня `reply.*` і піддерева `src/auto-reply/reply/**`. CI додатково ділить піддерево reply на shard agent-runner, dispatch і commands/state-routing, щоб один кошик із важкими імпортами не володів усім хвостом Node.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації й нормалізації.
    - Підтримуйте інтеграційні набори embedded runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped id і поведінка Compaction і далі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише на helper-функції
      не є достатньою заміною для цих інтеграційних шляхів.

  </Accordion>

  <Accordion title="Типові параметри пулу й ізоляції Vitest">

    - Базова конфігурація Vitest типово використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      неізольований runner у root project, конфігураціях e2e і live.
    - Root-смуга UI зберігає свій setup і optimizer `jsdom`, але також працює на
      спільному неізольованому runner.
    - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
      зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні смуги запускає diff.
    - Хук pre-commit виконує лише форматування. Він повторно додає до staging відформатовані файли й
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею роботи або push, коли
      вам потрібен розумний локальний контрольний набір перевірок. Зміни публічного Plugin SDK і plugin-contract
      включають один прохід перевірки extension.
    - `pnpm test:changed` маршрутизується через scoped-смуги, коли змінені шляхи
      чітко відповідають меншому набору.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищим лімітом workers.
    - Автоматичне масштабування локальних workers навмисно консервативне й відступає,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest типово завдають менше шкоди.
    - Базова конфігурація Vitest позначає файли projects/config як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється
      зв’язування тестів.
    - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо вам потрібне
      одне явне розташування кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту плюс
      вивід розбивки імпорту.
    - `pnpm test:perf:imports:changed` обмежує той самий профільний огляд
      файлами, зміненими відносно `origin/main`.
    - Дані про час виконання shard записуються в `.artifacts/vitest-shard-timings.json`.
      Запуски всієї конфігурації використовують шлях до конфігурації як ключ; CI-shard із include-pattern
      додають ім’я shard, щоб відфільтровані shard можна було відстежувати
      окремо.
    - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
      напряму мокайте цей seam замість deep-import runtime helper-функцій лише
      для того, щоб передати їх у `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native-шляхом root-project для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і root-конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує CPU-профіль main thread для
      накладних витрат запуску й трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує CPU+heap профілі runner для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Проганяє синтетичне навантаження повідомленнями gateway, пам’яттю й великими payload через шлях діагностичних подій
  - Виконує запити до `diagnostics.stability` через WS RPC Gateway
  - Охоплює helper-функції збереження пакетів діагностики стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS лишаються в межах бюджету тиску, а глибина черг для кожної сесії зменшується назад до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька смуга для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled Plugin у `extensions/`
- Типові параметри runtime:
  - Використовує `threads` Vitest з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних workers (CI: до 2, локально: типово 1).
  - Працює в тихому режимі за замовчуванням, щоб зменшити накладні витрати на консольний I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову увімкнути докладний консольний вивід.
- Обсяг:
  - End-to-end поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing вузлів і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke-тест backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку файлової системи remote-canonical через міст fs sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарний файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled Plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - Не є стабільним для CI за задумом (реальні мережі, реальні політики провайдерів, квоти, відмови)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- Типово live-запуски все ще ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли ви навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає журнали bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (специфічно для провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або використайте перевизначення для конкретного live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу до stderr, щоб було видно активність під час довгих викликів провайдера, навіть коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/gateway передаються негайно під час live-запусків.
  - Налаштовуйте Heartbeat для прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви змінили багато)
- Торкаєтеся мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / специфічні для провайдера збої / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke-тестів backend CLI, smoke-тестів ACP, harness app-server Codex
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Ранери Docker (необов’язкові перевірки «працює в Linux»)

Ці ранери Docker поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із matching profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і workspace (і використовуючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Live-ранери Docker типово використовують менший smoke-ліміт, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для live Docker lane. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних smoke-ранерів E2E, які перевіряють зібрану програму. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як ліміти ресурсів не дають усім важким live-, npm-install- і multi-service-смугам стартувати одночасно. Типові значення: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли Docker-хост має більший запас ресурсів. Ранер типово виконує Docker preflight, видаляє застарілі контейнери OpenClaw E2E, виводить статус кожні 30 секунд, зберігає час успішних смуг у `.artifacts/docker-tests/lane-timings.json` і використовує ці дані часу, щоб у наступних запусках спочатку запускати довші смуги. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб вивести зважений маніфест смуг без збирання або запуску Docker.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Ранери Docker для live-моделей також bind-mount лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`; типово охоплює Claude, Codex і Gemini, із суворим покриттям Droid/OpenCode через `pnpm test:docker:live-acp-bind:droid` і `pnpm test:docker:live-acp-bind:opencode`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест onboarding/channel/agent із npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює упакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює активовані runtime deps Plugin, і виконує один змокований хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест session runtime context: `pnpm test:docker:session-runtime-context` перевіряє збереження прихованого транскрипту runtime context плюс відновлення doctor для уражених дубльованих гілок prompt-rewrite.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image-провайдерів замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збирання на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-тест інсталятора Docker: `bash scripts/test-install-sh-docker.sh` використовує спільний кеш npm для своїх контейнерів root, update і direct-npm. Smoke-тест update типово використовує npm `latest` як стабільну базу перед оновленням до tarball-кандидата. Перевірки інсталятора без root зберігають ізольований кеш npm, щоб записи кешу, що належать root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm у локальних повторних запусках.
- CI Install Smoke пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- CLI smoke-тест agents delete shared workspace: `pnpm test:docker:agents-delete-shared-workspace` (скрипт: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) типово збирає root Dockerfile image, засіває двох агентів із одним workspace в ізольованому home контейнера, запускає `agents delete --json` і перевіряє коректний JSON плюс збереження workspace. Повторно використовуйте image install-smoke через `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змокований сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` із `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі деталі з’являються в журналах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків Cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke-тест встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke-тест незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-тест метаданих reload config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps bundled Plugin: `pnpm test:docker:bundled-channel-deps` типово збирає невеликий Docker runner image, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker aggregate попередньо пакує цей tarball один раз, а потім ділить перевірки bundled channel на незалежні смуги, включно з окремими смугами оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску bundled-смуги, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Смуга також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення runtime-dependency через doctor.
- Під час ітерації звужуйте runtime deps bundled Plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати і повторно використати спільний image built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення image, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку package/install, а не спільний runtime built-app.

Ранери Docker для live-моделей також bind-mount поточний checkout у режимі лише читання і
переносять його в тимчасовий workdir усередині контейнера. Це зберігає runtime-
image компактним, водночас усе ще запускаючи Vitest точно на вашому локальному source/config.
Крок перенесення пропускає великі локальні кеші й результати збирання застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунку каталоги `.build` або
виводу Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні workers каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити gateway
live-покриття з цієї Docker-смуги.
`test:docker:openwebui` — це smoke-тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP-endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, бо Docker може потребувати завантаження
image Open WebUI, а Open WebUI може завершувати власне холодне початкове налаштування.
Ця смуга очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — це основний спосіб надати його в контейнеризованих запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway-
контейнер, запускає другий контейнер, який породжує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання і сповіщення в стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
напряму аналізує сирі кадри stdio MCP, тож smoke-тест перевіряє те, що
міст реально виводить, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує
ключа live-моделі. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP пакета Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає seeded Gateway із реальним stdio MCP probe server, виконує
ізольований хід Cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke-тест plain-language thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації тредів ACP, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, отримані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI в `$HOME` монтуються в режимі лише читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, яким не потрібне перевибирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані беруться зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt для перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка коректності документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якірних посилань Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечно для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (змокований OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінки надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінки надійності агента»:

- Змокований виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють зв’язування сесії та ефекти config (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Ухвалення рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти робочого процесу:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні оцінки мають насамперед залишатися детермінованими:

- Ранер сценаріїв зі змокованими провайдерами для перевірки викликів інструментів + порядку, читання файлів Skill і зв’язування сесії.
- Невеликий набір сценаріїв, сфокусованих на Skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live-оцінки (за явним увімкненням, із керуванням через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і каналу)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і канал відповідає своєму
контракту інтерфейсу. Вони перебирають усі знайдені Plugin і запускають набір
перевірок форми та поведінки. Типова unit-смуга `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь каналу або провайдера.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти каналів: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти каналів

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій каналу
- **threading** - Обробка ID тредів
- **directory** - API каталогу/ростеру
- **group-policy** - Застосування групової політики

### Контракти статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу каналу
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/добір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни каналу чи Plugin провайдера
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (змокований/заглушений провайдер або захоплення точної трансформації форми запиту)
- Якщо це за своєю природою лише live-проблема (rate limit, політики auth), залишайте live-тест вузьким і за явним увімкненням через env vars
- Надавайте перевагу найменшому рівню, який виявляє помилку:
  - помилка перетворення/відтворення запиту провайдера → тест прямих моделей
  - помилка pipeline сесії/історії/інструментів gateway → gateway live smoke або безпечний для CI змокований тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується з помилкою для некласифікованих target id, щоб нові класи не можна було непомітно пропустити.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
