---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T14:11:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fab083a99c11505d592a4dfab627edf0704cf31e8820f35ad370583fa3caca12
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір раннерів Docker.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем моделей/провайдерів

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Якщо ви ітеруєте над однією помилкою, спочатку надавайте перевагу цільовим запускам.
- Сайт QA на базі Docker: `pnpm qa:lab:up`
- Лінія QA на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потребує реальних облікових даних):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Цільовий запуск одного live-файлу без зайвого виводу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Для кожної вибраної моделі тепер виконується текстовий хід, а також невелика
    перевірка текстового блока у стилі читання файлу. Для моделей, чиї метадані
    вказують на вхід `image`, також виконується невеликий хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0`
    або `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний
    робочий процес live/E2E з `include_live_suites: true`, що включає окремі
    матричні завдання Docker live model із шардингом за провайдером.
  - Для точкових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    запланованих/release-викликів.
- Cost smoke для Moonshot/Kimi: якщо задано `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6 і що
  транскрипт асистента зберігає нормалізований `usage.cost`.

Порада: якщо вам потрібен лише один проблемний випадок, краще звужуйте live-тести через змінні середовища allowlist, описані нижче.

## Спеціальні раннери QA

Ці команді розташовані поруч з основними наборами тестів, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab в окремих робочих процесах. `Parity gate` виконується для відповідних PR
і з ручного виклику з mock-провайдерами. `QA-Lab - All Lanes` виконується щоночі на
`main` і з ручного виклику з mock parity gate, live Matrix lane та live Telegram lane
під керуванням Convex як паралельні завдання. `OpenClaw Release Checks`
запускає ті самі лінії перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно в ізольованих
    воркерах Gateway. `qa-channel` за замовчуванням використовує concurrency 4
    (обмежено кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`,
    щоб налаштувати кількість воркерів, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою.
    Використовуйте `--allow-failures`, якщо вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і mock-протоколів без заміни сценарійно-орієнтованої
    лінії `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA у тимчасовій Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані входи автентифікації QA, які практично
    використовувати в гостьовій системі:
    ключі провайдерів на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він заданий.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла
    записувати назад через змонтовану робочу область.
  - Записує звичайний звіт QA + підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає сайт QA на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний онбординг з API-ключем OpenAI, за замовчуванням
    налаштовує Telegram, перевіряє, що ввімкнення plugin встановлює залежності виконання на вимогу,
    запускає doctor і виконує один локальний хід агента проти mock-ендпоінта OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму
    лінію встановлення з пакета для Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugin через редагування config.
  - Перевіряє, що виявлення налаштування залишає відсутніми залежності виконання
    для неналаштованих plugin, що перший налаштований запуск Gateway або doctor
    встановлює залежності виконання кожного вбудованого plugin на вимогу, і що
    другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що `doctor` кандидата після оновлення
    відновлює залежності виконання вбудованого channel без postinstall-відновлення
    з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для безпосереднього
    smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-лінію Matrix QA проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей хост QA наразі призначений лише для репозиторію/розробки. Пакетні інсталяції OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують вбудований раннер безпосередньо; окремий етап
    встановлення plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, після чого запускає дочірній QA Gateway з реальним Matrix plugin як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Замінюйте його через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця лінія локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live-лінію Telegram QA проти реальної приватної групи з токенами ботів driver і SUT із env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. За замовчуванням використовуйте режим env або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання від driver до спостережуваної відповіді SUT.

Live-лінії транспорту використовують один стандартний контракт, щоб нові транспорти не розходилися в поведінці:

`qa-channel` залишається широким синтетичним набором QA і не є частиною матриці покриття live transport.

| Лінія    | Канарка | Обмеження за згадками | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша дія в гілці | Ізоляція гілки | Спостереження за реакціями | Команда help |
| -------- | ------- | --------------------- | -------------------- | ------------------------- | ----------------------------- | -------------------- | -------------- | -------------------------- | ------------ |
| Matrix   | x       | x                     | x                    | x                         | x                             | x                    | x              | x                          |              |
| Telegram | x       |                       |                      |                           |                               |                      |                |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), qa-lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat цієї оренди, поки лінія виконується, і звільняє оренду під час завершення роботи.

Каркас еталонного проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI за замовчуванням `ci`, в іншому разі `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Команди адміністратора для maintainers (додавання/видалення/перелік пулу) потребують саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні команди CLI для maintainers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

Контракт ендпоінта за замовчуванням (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Запит: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Успіх: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Ресурс вичерпано/можна повторити: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання channel до QA

Додавання channel до markdown-системи QA потребує рівно двох речей:

1. Адаптера транспорту для channel.
2. Набору сценаріїв, який перевіряє контракт channel.

Не додавайте новий кореневий QA-командний шлях верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим процесом.

`qa-lab` керує спільною механікою хоста:

- кореневий шлях команди `openclaw qa`
- запуском і завершенням suite
- паралелізмом воркерів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- аліасами сумісності для старіших сценаріїв `qa-channel`

Runner plugins керують контрактом транспорту:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії через транспорт
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг прийняття для нового channel:

1. Залишити `qa-lab` власником спільного кореня `qa`.
2. Реалізувати transport runner на спільному шві хоста `qa-lab`.
3. Зберігати специфічну для транспорту механіку всередині runner plugin або harness channel.
4. Монтувати runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Зберігайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створити або адаптувати markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовувати узагальнені допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігати робочими наявні аліаси сумісності, якщо лише репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту channel, зберігайте її в цьому runner plugin або harness plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один channel, додайте узагальнену допоміжну функцію замість специфічної для channel гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, зберігайте сценарій специфічним для транспорту і явно позначайте це в контракті сценарію.

Бажані назви узагальнених допоміжних функцій для нових сценаріїв:

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

Аліаси сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над channel має використовувати узагальнені назви допоміжних функцій.
Аліаси сумісності існують, щоб уникнути міграції в один день, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: ненаправлені запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати шарди multi-project у конфігурації per-project для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, які охоплює `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація Gateway, маршрутизація, інструменти, парсинг, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка щодо проєктів:
  - Ненаправлений `pnpm test` тепер запускає дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project процесу. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` усе ще використовує native root-граф проєкту `vitest.config.ts`, оскільки цикл спостереження multi-shard непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через обмежені лінії, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` не сплачує повну вартість запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі обмежені лінії, коли diff торкається лише маршрутизованих файлів source/test; зміни config/setup усе ще повертаються до широкого повторного запуску root project.
  - `pnpm check:changed` — це звичайна розумна локальна перевірка для вузької роботи. Вона класифікує diff на core, core tests, extensions, extension tests, apps, docs, метадані релізу та tooling, а потім запускає відповідні лінії typecheck/lint/test. Зміни в публічному Plugin SDK і контрактах plugin включають валідацію extensions, оскільки extensions залежать від цих контрактів core. Лише зміни версії в метаданих релізу запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, що відхиляє зміни package поза полем версії верхнього рівня.
  - Легкі з погляду імпорту unit-тести з agents, commands, plugins, допоміжних функцій auto-reply, `plugin-sdk` та подібних чистих утилітних ділянок маршрутизуються через лінію `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних лініях.
  - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling-тестами в цих легких лініях, тому редагування helper не змушують повторно запускати весь важкий набір для цього каталогу.
  - `auto-reply` тепер має три окремі кошики: допоміжні функції core верхнього рівня, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій harness-роботі reply потрапляти на дешеві тести status/chunk/token.
- Примітка щодо вбудованого runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime-контекст Compaction,
    зберігайте обидва рівні покриття.
  - Додавайте цільові helper-регресії для чистих меж маршрутизації/нормалізації.
  - Також підтримуйте здоровими integration-набори вбудованого runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id і поведінка Compaction, як і раніше, проходять
    через реальні шляхи `run.ts` / `compact.ts`; helper-only тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка щодо пулу:
  - Базова конфігурація Vitest тепер за замовчуванням використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує неізольований runner у root projects, конфігураціях e2e та live.
  - Root UI lane зберігає своє налаштування `jsdom` та optimizer, але тепер також працює на спільному неізольованому runner.
  - Кожен shard `pnpm test` успадковує ті самі параметри за замовчуванням `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також за замовчуванням додає `--no-maglev` для дочірніх процесів Node Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка щодо швидкої локальної ітерації:
  - `pnpm changed:lanes` показує, які архітектурні лінії запускає diff.
  - Хук pre-commit запускає `pnpm check:changed --staged` після staged formatting/linting, тому коміти лише core не оплачують вартість тестів extensions, якщо тільки не торкаються публічних контрактів для extensions. Коміти лише з метаданими релізу залишаються на цільовій лінії version/config/root-dependency.
  - Якщо точний staged-набір змін уже було перевірено рівноцінними або суворішими перевірками, використовуйте `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише повторний запуск хука changed-scope. Staged format/lint усе ще запускаються. Згадайте виконані перевірки у вашому handoff. Це також прийнятно після ізольованого flaky-збою хука, який повторно запущено і який проходить із обмеженим доказом.
  - `pnpm test:changed` маршрутизує через обмежені лінії, коли змінені шляхи чисто зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом воркерів.
  - Автомасштабування локальних воркерів тепер навмисно консервативне і також зменшує навантаження, коли середнє навантаження хоста вже високе, тому кілька паралельних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється wiring тестів.
  - Конфігурація залишає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка щодо налагодження продуктивності:
  - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту плюс вивід розбивки імпорту.
  - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання файлами, зміненими від `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native root-project шляхом для цього зафіксованого diff і виводить wall time плюс macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для накладних витрат запуску та трансформації Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap профілі runner для unit-набору з вимкненим файловим паралелізмом.

### Stability (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один воркер
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичне churn повідомлень Gateway, пам’яті та великих payload через шлях діагностичних подій
  - Опитує `diagnostics.stability` через WS RPC Gateway
  - Охоплює допоміжні функції збереження пакета діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS залишаються в межах бюджету тиску, а глибини черг на сесію зменшуються назад до нуля
- Очікування:
  - Безпечно для CI і не потребує ключів
  - Вузька лінія для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (smoke Gateway)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих plugin у `extensions/`
- Параметри виконання за замовчуванням:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість воркерів (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати на консольний I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` для примусового задання кількості воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний консольний вивід.
- Обсяг:
  - End-to-end поведінка Gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing Node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + виконання SSH
  - Перевіряє канонічну для віддаленого середовища поведінку файлової системи через bridge fs sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працюючого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний бінарний файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки при rate limit
- Очікування:
  - Навмисно нестабільно для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені піднабори, а не «все»
- Live-запуски читають `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення про `~/.profile` і вимикає журнали bootstrap Gateway / шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API-ключів (залежно від провайдера): задавайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб під час довгих викликів провайдера було видно активність навіть тоді, коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway одразу передавалися під час live-запусків.
  - Налаштовуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії Gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live: прогін можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка наразі оголошена** підключеним Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає і не виконує pairing застосунку).
  - Перевірка `node.invoke` Gateway команда за командою для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android app уже підключений і спарений із Gateway.
  - App має залишатися на передньому плані.
  - Для можливостей, які ви очікуєте успішними, мають бути надані дозволи/згода на захоплення.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи взагалі провайдер/модель може відповісти з наданим ключем.
- «Gateway smoke» показує, чи працює повний pipeline Gateway+агент для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб фактично запустити цей набір; інакше він буде пропущений, щоб `pnpm test:live` залишався зосередженим на smoke Gateway
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` для запуску modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Прогони modern/all за замовчуванням мають curated high-signal ліміт; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншого ліміту.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні варіанти env
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «pipeline агента Gateway зламаний»
  - Містить невеликі ізольовані регресії (приклад: повтор reasoning у OpenAI Responses/Codex Responses + потоки tool-call)

### Шар 2: smoke Gateway + dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти Gateway in-process
  - Створити/оновити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами і перевірити:
    - «змістовну» відповідь (без інструментів)
    - що реальний виклик інструмента працює (probe читання)
    - необов’язкові додаткові probe інструментів (probe exec+read)
    - що регресійні шляхи OpenAI (лише tool-call → наступний хід) продовжують працювати
- Деталі probe (щоб можна було швидко пояснити збої):
  - probe `read`: тест записує файл nonce у робочу область і просить агента `read` його та повернути nonce у відповіді.
  - probe `exec+read`: тест просить агента записати nonce через `exec` у тимчасовий файл, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
- Як вибирати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити набір
  - Прогони gateway modern/all за замовчуванням мають curated high-signal ліміт; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншого ліміту.
- Як вибирати провайдерів (уникайте «усе через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Probe інструментів і зображень у цьому live-тесті завжди ввімкнені:
  - probe `read` + probe `exec+read` (навантаження на інструменти)
  - image probe виконується, коли модель оголошує підтримку входу зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded агент пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що ви можете тестувати на своїй машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + агент із використанням локального CLI backend, не торкаючись вашої типової config.
- Типові smoke-параметри, специфічні для backend, розміщені у визначенні `cli-backend.ts` plugin, яка ним володіє.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Команда/аргументи/поведінка зображень беруться з метаданих plugin CLI backend, яка ним володіє.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типовий probe безперервності тієї самої сесії Claude Sonnet -> Opus (встановіть `1`, щоб примусово ввімкнути його, коли вибрана модель підтримує ціль перемикання).

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Рецепти Docker для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Раннер Docker розміщено в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke CLI з extension, якій належить backend, а потім встановлює відповідний Linux CLI-пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований каталог запису за префіксом `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable OAuth підписки Claude Code через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він перевіряє прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-backend без збереження змінних середовища Anthropic API-key. Ця лінія підписки за замовчуванням вимикає probe Claude MCP/tool і image probe, тому що Claude зараз маршрутизує використання сторонніх застосунків через тарифікацію extra-usage замість звичайних лімітів плану підписки.
- Live smoke CLI-backend тепер перевіряє той самий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через Gateway CLI.
- Типовий smoke для Claude також оновлює сесію із Sonnet до Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: ACP bind smoke (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язки розмови ACP з live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel безпосередньо на місці
  - надіслати звичайне подальше повідомлення в цій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипту прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний channel: контекст розмови у стилі Slack DM
  - ACP-backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Примітки:
  - Ця лінія використовує поверхню Gateway `chat.send` з синтетичними полями originating-route, доступними лише адміністратору, щоб тести могли приєднати контекст message-channel без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів plugin `acpx` для вибраного ACP harness agent.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-acp-bind
```

Рецепти Docker для одного агента:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Раннер Docker розміщено в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke послідовно для всіх підтримуваних live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він читає `~/.profile`, переносить відповідні матеріали автентифікації CLI в контейнер, встановлює `acpx` у npm-префікс із правом запису, а потім встановлює запитаний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його бракує.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав змінні середовища провайдера з прочитаного профілю доступними для дочірнього harness CLI.

## Live: smoke harness Codex app-server

- Мета: перевірити harness Codex, яким володіє plugin, через звичайний
  метод Gateway `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід агента Gateway до `codex/gpt-5.4`
  - надіслати другий хід у ту саму сесію OpenClaw і перевірити, що потік
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях
    команди Gateway
  - за потреби виконати дві Guardian-рецензовані probe підвищеного shell-доступу: одну нешкідливу
    команду, яку слід схвалити, і одне фіктивне вивантаження секрету, яке має бути
    відхилене, щоб агент поставив уточнювальне запитання
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.4`
- Необов’язкова image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти, непомітно переключившись на PI.
- Автентифікація: `OPENAI_API_KEY` із shell/profile, плюс за потреби скопійовані
  `~/.codex/auth.json` і `~/.codex/config.toml`

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Раннер Docker розміщено в `scripts/test-live-codex-harness-docker.sh`.
- Він читає змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації CLI Codex, якщо вони є, встановлює `@openai/codex` у змонтований npm-префікс
  із правом запису, переносить дерево source, а потім запускає лише live-тест Codex-harness.
- У Docker за замовчуванням увімкнено image, MCP/tool і Guardian probe. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`, або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і конфігурація live-тесту, щоб fallback на `openai-codex/*` або PI не міг приховати регресію harness Codex.

### Рекомендовані live-рецепти

Вузькі явні allowlist — найшвидші й найменш нестабільні:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів через кілька провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст OAuth Antigravity (ендпоінт агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація через API-ключ / профіль); це те, що більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний бінарний файл `gemini`; він має власну автентифікацію і може поводитися по-іншому (streaming/підтримка інструментів/відмінність версій).

## Live: матриця моделей (що ми охоплюємо)

Фіксованого «списку моделей CI» немає (live — opt-in), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний smoke-набір (виклик інструментів + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати працездатним:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск smoke Gateway з інструментами + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель на сімейство провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою інструментів, яка у вас увімкнена)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання image (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні шлюзи

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Додаткові провайдери, які можна включити в live-матрицю (якщо у вас є облікові дані/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні ендпоінти): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс ті ключі, які доступні.

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це у live-тестах означає «ключі профілів»)
- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється у staged live home, якщо існує, але не є основним сховищем ключів профілів)
- Локальні live-запуски за замовчуванням копіюють активну config, файли `auth-profiles.json` для кожного агента, застарілий каталог `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового test home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probe не працювали у вашій реальній робочій області хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте наведені нижче раннери Docker (вони можуть змонтувати `~/.profile` у контейнер).

## Live Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live workflow media ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації plugin

## Live генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує всі зареєстровані provider plugins для генерації зображень
  - Завантажує відсутні env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Проганяє стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери в покритті:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Live генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, якщо вони доступні:
    - `generate` з input лише через prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної лінії:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний прогін
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Live генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованих провайдерів генерації відео
  - За замовчуванням використовує безпечний для релізу smoke-шлях: провайдери без FAL, один запит text-to-video на провайдера, one-second lobster prompt і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, тому що затримка черги на боці провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб явно його запустити
  - Завантажує env-змінні провайдерів із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені auth-профілі, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, якщо вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальний input зображення на основі буфера у спільному прогоні
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальний input відео на основі буфера у спільному прогоні
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному прогоні:
    - `vydra`, тому що вбудований `veo3` є лише text-only, а вбудований `kling` вимагає віддалений URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс лінію `kling`, яка за замовчуванням використовує фікстуру віддаленого URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному прогоні:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі вимагають віддалені еталонні URL `http(s)` / MP4
    - `google`, тому що поточна спільна лінія Gemini/Veo використовує локальний input на основі буфера, і цей шлях не приймається у спільному прогоні
    - `openai`, тому що поточна спільна лінія не гарантує доступу до video inpaint/remix, специфічного для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера у типовий прогін, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції для кожного провайдера під час агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише через env

## Live media harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори зображень, музики та відео через одну стандартну точку входу репозиторію
  - Автоматично завантажує відсутні env-змінні провайдерів із `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Раннери Docker (необов’язкові перевірки «працює в Linux»)

Ці раннери Docker поділяються на дві групи:

- Раннери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключами профілів усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і робочу область (і читаючи `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Live-раннери Docker за замовчуванням використовують менший smoke-ліміт, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` за замовчуванням встановлює `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням встановлює `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох live Docker lanes. Він також збирає один спільний image `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних smoke-раннерів E2E, які перевіряють зібраний застосунок.
- Контейнерні smoke-раннери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Раннери Docker для live-моделей також bind-mount лише потрібні домашні каталоги автентифікації CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени, не змінюючи сховище автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Codex app-server harness smoke: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffold-налаштування): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke онбордингу/channel/агента через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через env-ref онбординг і Telegram за замовчуванням, перевіряє, що ввімкнення plugin встановлює її runtime-залежності на вимогу, запускає doctor і виконує один mock-хід агента OpenAI. Щоб повторно використати заздалегідь зібраний tarball, задайте `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, щоб пропустити перебудову на хості — `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, або щоб змінити channel — `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна регресія reasoning для OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mock-сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера й перевіряє, що необроблена деталь з’являється в журналах Gateway.
- Міст MCP channel (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення Cron/subagent MCP (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика перезапуску пакета Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованих plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий runner image Docker, один раз збирає і пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій Linux-інсталяції. Щоб повторно використати image, задайте `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб пропустити перебудову хоста після свіжої локальної збірки — `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, або щоб вказати на наявний tarball — `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Під час ітерації звужуйте перевірку runtime-залежностей вбудованих plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний image built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для наборів перевизначення image, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, тому що вони перевіряють поведінку пакування/інсталяції, а не спільний runtime built-app.

Раннери Docker для live-моделей також bind-mount поточний checkout лише для читання і
переносять його у тимчасовий робочий каталог усередині контейнера. Це зберігає runtime
image компактним, водночас даючи змогу запускати Vitest точно на вашому локальному source/config.
Етап перенесення пропускає великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
вивід Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні воркери channel Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live із цієї Docker-лінії.
`test:docker:openwebui` — це smoke вищого рівня для перевірки сумісності: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP-ендпоінтами, сумісними з OpenAI,
запускає pinned-контейнер Open WebUI проти цього Gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може потребувати завантаження
image Open WebUI, а сам Open WebUI може завершувати власне cold-start налаштування.
Ця лінія очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) — основний спосіб надати його у Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord чи iMessage. Він запускає seeded-контейнер Gateway,
потім запускає другий контейнер, який піднімає `openclaw mcp serve`, і далі
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та повідомлення
про channel + дозволи у стилі Claude через реальний stdio MCP bridge. Перевірка notification
безпосередньо досліджує сирі stdio MCP-кадри, тому smoke перевіряє те, що міст
справді випромінює, а не лише те, що випадково показує певний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує ключа live-моделі.
Він збирає Docker image репозиторію, запускає в контейнері реальний stdio MCP probe server,
матеріалізує цей server через runtime вбудованого пакета Pi MCP,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і one-shot дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language для ACP thread (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для регресійних/налагоджувальних workflow. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і читається перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевірити лише env-змінні, прочитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих установок CLI у Docker
- Зовнішні каталоги/файли автентифікації CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані беруться зі сховища профілів, а не з env
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовується у smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити pinned-тег image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку якірних посилань Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + примусово застосовує auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Mock-виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють wiring сесій і вплив config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills перелічені в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Compliance:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії і межі sandbox.

Майбутні evals спочатку мають залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + їхнього порядку, читання skill-файлів і wiring сесій.
- Невеликий набір сценаріїв, зосереджених на Skills (використати чи уникати, gating, prompt injection).
- Необов’язкові live-evals (opt-in, із захистом через env) — лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму interface-контракту. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit-лінія `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API каталогу/списку учасників
- **group-policy** - Застосування групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe статусу channel
- **registry** - Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/селектор автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/interface plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації plugin або виявлення

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додавайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точної трансформації форми запиту)
- Якщо це за своєю природою лише live-проблема (rate limit, політики автентифікації), зберігайте live-тест вузьким і opt-in через env-змінні
- Надавайте перевагу найменшому шару, який ловить помилку:
  - помилка перетворення/повтору запиту provider → тест прямих моделей
  - помилка pipeline сесії/історії/інструментів Gateway → live smoke Gateway або безпечний для CI mock-тест Gateway
- Захист обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою для некласифікованих target id, щоб нові класи не можна було тихо пропустити.
