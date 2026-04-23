---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, ранери Docker і те, що покриває кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T01:48:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 67b9751c5811f8cbc9f0826e42f2e4fc234b3c635c564ec2c31afeffb034ec4f
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір раннерів Docker.

Цей документ — посібник «як ми тестуємо»:

- Що покриває кожен набір (і що він навмисно _не_ покриває)
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами

## Швидкий старт

У більшості випадків:

- Повний бар’єр перевірок (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Коли ітеруєтеся над однією помилкою, спершу віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-ланка на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Бар’єр покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (зонди моделей + інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke-перевірка вартості Moonshot/Kimi: якщо задано `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6 і що
  транскрипт помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один проблемний випадок, краще звузити live-тести через змінні середовища allowlist, описані нижче.

## QA-специфічні ранери

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими worker Gateway. Для `qa-channel` типово використовується concurrency 4 (обмежується кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість worker, або `--concurrency 1` для старішої послідовної ланки.
  - Завершується з ненульовим кодом, якщо хоч один сценарій завершується помилкою. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без коду виходу з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і mock-покриття протоколу, не замінюючи сценаріє-орієнтовану
    ланку `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані QA-входи автентифікації, які практично передати в гостьову систему:
    ключі провайдерів через env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через змонтований workspace.
  - Записує звичайний QA-звіт + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, а потім вмикає Telegram і Discord через редагування конфігурації.
  - Перевіряє, що перший перезапуск Gateway встановлює runtime-залежності кожного bundled channel plugin за потреби, а другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базову версію, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor у кандидаті
    виправляє runtime-залежності bundled channel без postinstall-виправлення з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-QA-ланку Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для repo/dev. Пакетні інсталяції OpenClaw не постачають `qa-lab`, тому вони не надають `openclaw qa`.
  - Копії репозиторію завантажують bundled runner напряму; окремий крок встановлення plugin не потрібен.
  - Підготовлює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, а потім запускає дочірній QA gateway із реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Замініть через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця ланка локально створює тимчасових користувачів.
  - Записує QA-звіт Matrix, підсумок, артефакт observed-events і комбінований журнал stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live-QA-ланку Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT із env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на пулінгові lease.
  - Завершується з ненульовим кодом, якщо хоч один сценарій завершується помилкою. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без коду виходу з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує QA-звіт Telegram, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`.

Live-транспортні ланки мають спільний стандартний контракт, щоб нові транспорти не розходилися в поведінці:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці покриття live-транспорту.

| Ланка    | Canary | Керування згадками | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | ------------------ | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x                  | x                    | x                         | x                             | x                          | x               | x                          |              |
| Telegram | x      |                    |                      |                           |                               |                            |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивний lease із пулу на базі Convex, надсилає Heartbeat
цього lease, поки ланка виконується, і звільняє lease під час завершення роботи.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення з env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

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
  - Захист активного lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий корінь top-level-команди QA, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` керує спільною хост-механікою:

- коренем команди `openclaw qa`
- запуском і завершенням наборів
- паралелізмом worker
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- aliases сумісності для старіших сценаріїв `qa-channel`

Runner plugins керують транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектяться вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, що підтримуються транспортом
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг прийняття для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному host seam `qa-lab`.
3. Тримайте транспорт-специфічну механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; ліниве виконання CLI і runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic helper для нових сценаріїв.
7. Зберігайте роботу наявних aliases сумісності, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, тримайте її в тому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку можуть використовувати більше ніж один канал, додайте generic helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій transport-specific і явно вказуйте це в контракті сценарію.

Бажані назви generic helper для нових сценаріїв:

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

Aliases сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати generic helper names.
Aliases сумісності існують, щоб уникнути міграції одним днем, а не як модель для
створення нових сценаріїв.

## Набори тестів (що і де запускається)

Сприймайте набори як «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: десять послідовних запусків shard (`vitest.full-*.config.ts`) поверх наявних scoped Vitest project
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, які покриває `vitest.unit.config.ts`
- Охоплення:
  - Чисті unit-тести
  - Integration-тести в межах процесу (автентифікація gateway, маршрутизація, tooling, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка про projects:
  - Нетаргетований `pnpm test` тепер запускає одинадцять менших shard-конфігурацій (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати нерелевантні набори.
  - `pnpm test --watch` і далі використовує граф project у native root `vitest.config.ts`, оскільки multi-shard цикл watch непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі file/directory через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff зачіпає лише маршрутизовані source/test files; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
  - `pnpm check:changed` — звичайний розумний локальний бар’єр для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні ланки typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають валідацію extensions, тому що extensions залежать від цих core-контрактів. Підвищення версії лише в метаданих release запускають цільові перевірки version/config/root-dependency замість повного набору, із guard, що відхиляє зміни package поза полем версії верхнього рівня.
  - Полегшені за імпортами unit-тести з agents, commands, plugins, helper auto-reply, `plugin-sdk` та подібних чистих утилітних ділянок маршрутизуються через ланку `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy files лишаються на наявних lanes.
  - Вибрані source-файли helper з `plugin-sdk` і `commands` також зіставляють запуски changed-mode з явними sibling tests у цих легких lanes, тож редагування helper уникають повторного запуску всього важкого набору для цього каталогу.
  - `auto-reply` тепер має три окремі кошики: helper верхнього рівня core, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це прибирає найважчу роботу harness reply з дешевих тестів status/chunk/token.
- Примітка про embedded runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime-контекст compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації/нормалізації.
  - Також підтримуйте здоровими integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id і поведінка Compaction як і раніше проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка про pool:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує non-isolated runner у root projects, e2e і live configs.
  - Коренева ланка UI зберігає своє налаштування `jsdom` і optimizer, але тепер теж працює на спільному non-isolated runner.
  - Кожен shard `pnpm test` успадковує ті самі типові `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх процесів Node Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидку локальну ітерацію:
  - `pnpm changed:lanes` показує, які архітектурні ланки запускає diff.
  - Pre-commit hook запускає `pnpm check:changed --staged` після staged formatting/linting, тож commit лише для core не сплачує вартість тестів extension, якщо не зачіпає публічні контракти для extensions. Коміти лише з метаданими release залишаються на цільовій ланці version/config/root-dependency.
  - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи чисто відображаються на менший набір.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищою межею worker.
  - Автомасштабування локальних worker тепер навмисно консервативне й також відступає, коли середнє навантаження хоста вже високе, тож кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється wiring тестів.
  - Конфігурація зберігає увімкнений `OPENCLAW_VITEST_FS_MODULE_CACHE` на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка про налагодження продуктивності:
  - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість імпорту плюс вивід розбивки імпорту.
  - `pnpm test:perf:imports:changed` обмежує той самий профілювальний перегляд файлами, зміненими від `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` з native root-project path для цього зафіксованого diff і виводить wall time плюс macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує CPU-профіль головного потоку для накладних витрат запуску й трансформації Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує CPU+heap-профілі runner для unit-набору з вимкненим файловим паралелізмом.

### Stability (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Охоплення:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Пропускає синтетичне навантаження повідомленнями gateway, пам’яттю й великими payload через шлях діагностичних подій
  - Опитує `diagnostics.stability` через WS RPC Gateway
  - Покриває helper збереження diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS залишаються в межах бюджету тиску, а глибина черг на сесію повертається до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька ланка для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (smoke Gateway)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові налаштування runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних worker (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати на консольний I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний консольний вивід.
- Охоплення:
  - Наскрізна поведінка багатьох екземплярів gateway
  - Поверхні WebSocket/HTTP, pairing вузлів і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в пайплайні)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Охоплення:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через міст fs sandbox
- Очікування:
  - Лише за явного ввімкнення; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і справного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестові gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний CLI-бінарник або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Охоплення:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату у провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки при rate limit
- Очікування:
  - Навмисно не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам свідомо потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає bootstrap-логи Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову бачити повні стартові логи.
- Ротація API key (залежно від провайдера): задайте `*_API_KEYS` у форматі comma/semicolon або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення на рівні live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу при відповідях із rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож тривалі виклики провайдерів залишаються видимо активними, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/Gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/зондів через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змін було багато)
- Торкаєтесь мережевої взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live: огляд можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі рекламує** підключений Android Node, і перевірити поведінку контракту команд.
- Охоплення:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/не запускає/не pair-ить застосунок).
  - Перевірка gateway `node.invoke` команда за командою для вибраного Android Node.
- Потрібне попереднє налаштування:
  - Android-застосунок уже підключений і спарений із gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделі (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи провайдер/модель взагалі може відповісти з наданим ключем.
- «Gateway smoke» показує, чи працює для цієї моделі повний конвеєр gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: Пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Запустити невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, alias для modern), щоб справді запустити цей набір; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це alias для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (comma allowlist)
  - Огляди modern/all за замовчуванням обмежені підібраною high-signal межею; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern-огляду або додатне число для меншої межі.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (comma allowlist)
- Звідки беруться ключі:
  - За замовчуванням: profile store і резервні env
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише profile store**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ невалідний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: відтворення reasoning replay + потоки tool-call для OpenAI Responses/Codex Responses)

### Шар 2: smoke Gateway + dev agent (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process Gateway
  - Створити/пропатчити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітеруватися по моделях-із-ключами і перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (зонд читання)
    - необов’язкові додаткові зонди інструментів (зонд exec+read)
    - що шляхи регресій OpenAI (лише tool-call → follow-up) і далі працюють
- Деталі зондів (щоб можна було швидко пояснювати збої):
  - зонд `read`: тест записує nonce-файл у workspace і просить агента `read` його та повернути nonce.
  - зонд `exec+read`: тест просить агента через `exec` записати nonce в тимчасовий файл, а потім через `read` прочитати його назад.
  - зонд зображення: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це alias для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або comma list), щоб звузити вибір
  - Огляди modern/all для Gateway за замовчуванням обмежені підібраною high-signal межею; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern-огляду або додатне число для меншої межі.
- Як вибирати провайдерів (уникати «усе OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (comma allowlist)
- Зонди інструментів і зображень у цьому live-тесті завжди увімкнені:
  - зонд `read` + зонд `exec+read` (навантаження на інструменти)
  - зонд зображення запускається, коли модель рекламує підтримку вхідних зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway парсить attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що ви можете тестувати на своїй машині (і точні id `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent, використовуючи локальний CLI backend, не торкаючись вашої типової конфігурації.
- Типові smoke-налаштування для конкретного backend розташовані у визначенні `cli-backend.ts` extension, яка ним володіє.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий provider/model: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих plugin CLI backend, яка ним володіє.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи інжектяться в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як CLI args замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання args зображень, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типову перевірку безперервності тієї самої сесії Claude Sonnet -> Opus (встановіть `1`, щоб примусово ввімкнути її, коли вибрана модель підтримує ціль переключення).

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

- Docker runner розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині образу Docker репозиторію як користувач `node` без root.
- Він визначає метадані smoke CLI з extension, якій це належить, а потім встановлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної підписної OAuth Claude Code через або `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-backend без збереження змінних середовища Anthropic API key. Ця підписна ланка типово вимикає зонди Claude MCP/tool і зображень, тому що Claude наразі маршрутизує використання сторонніх застосунків через тарифікацію додаткового використання замість звичайних лімітів підписного плану.
- Live smoke CLI-backend тепер перевіряє той самий end-to-end потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через CLI Gateway.
- Типовий smoke для Claude також патчить сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік conversation-bind ACP з live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайне follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє в transcript прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Ця ланка використовує поверхню gateway `chat.send` із синтетичними полями originating-route лише для admin, щоб тести могли прикріплювати контекст message-channel, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр agent plugin `acpx` для вибраного harness agent ACP.

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

Рецепти Docker для одного agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає smoke ACP bind для всіх підтримуваних live CLI agent: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він використовує `~/.profile`, переносить відповідні auth-матеріали CLI до контейнера, встановлює `acpx` у записуваний npm-префікс, а потім встановлює запитаний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його бракує.
- Усередині Docker runner встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб `acpx` зберігав змінні середовища провайдера із завантаженого profile доступними для дочірнього harness CLI.

## Live: smoke harness app-server Codex

- Мета: перевірити plugin-owned harness Codex через звичайний gateway
  метод `agent`:
  - завантажити bundled plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.4`
  - надіслати другий хід у ту саму сесію OpenClaw і перевірити, що thread
    app-server може відновитися
  - запустити `/codex status` і `/codex models` через той самий gateway command
    path
  - за потреби виконати два escalated shell probe, перевірені Guardian: одну безпечну
    команду, яку слід дозволити, і одне фальшиве вивантаження секрету, яке має бути
    відхилене, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.4`
- Необов’язковий зонд зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий зонд MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язковий зонд Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти, тихо переключившись назад на PI.
- Auth: `OPENAI_API_KEY` з shell/profile, плюс за потреби скопійовані
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

- Docker runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він використовує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  auth CLI Codex за наявності, встановлює `@openai/codex` у записуваний змонтований npm
  префікс, переносить source tree, а потім запускає лише live-тест harness Codex.
- Docker типово вмикає зонди зображення, MCP/tool і Guardian. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий запуск
  налагодження.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, узгоджуючись із live
  test config, щоб fallback `openai-codex/*` або PI не міг приховати регресію
  harness Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist є найшвидшими й найменш нестабільними:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів у кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (Gemini API key + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує міст OAuth Antigravity (endpoint agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (API key / profile auth); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний бінарник `gemini`; він має власну auth і може поводитися інакше (streaming/підтримка інструментів/розсинхрон версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» не існує (live — opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний smoke-набір (виклик інструментів + зображення)

Це запуск «поширених моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не-Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запускати gateway smoke з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Вибирайте щонайменше одну модель на сімейство провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або останню доступну)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою інструментів, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додавайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI із підтримкою vision тощо), щоб перевіряти зонд зображення.

### Агрегатори / альтернативні Gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoint): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-compatible proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко прописати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс ті ключі, які доступні.

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі auth для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (це і є «ключі профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється в staged live home, якщо присутній, але це не основне сховище ключів профілів)
- Локальні live-запуски типово копіюють активну конфігурацію, файли `auth-profiles.json` для кожного agent, застарілий `credentials/` і підтримувані зовнішні каталоги auth CLI у тимчасовий test home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` прибираються, щоб зонди не торкалися вашого реального host workspace.

Якщо ви хочете покладатися на ключі з env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker runners нижче (вони можуть монтувати `~/.profile` у контейнер).

## Deepgram live (транскрибування аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus live для coding plan

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Охоплення:
  - Перевіряє bundled-шляхи comfy для зображень, відео і `music_generate`
  - Пропускає кожну можливість, якщо `models.providers.comfy.<capability>` не налаштовано
  - Корисно після змін у поданні workflow comfy, polling, downloads або реєстрації plugin

## Live для генерації зображень

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Охоплення:
  - Перелічує кожен зареєстрований provider plugin для генерації зображень
  - Завантажує відсутні змінні середовища provider з вашого login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API keys раніше за збережені auth-profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає provider без придатних auth/profile/model
  - Проганяє стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні bundled providers у покритті:
  - `openai`
  - `google`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати перевизначення лише через env

## Live для генерації музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Охоплення:
  - Перевіряє спільний bundled-шлях provider для генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує змінні середовища provider з вашого login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API keys раніше за збережені auth-profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає provider без придатних auth/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` із вхідними даними лише prompt
    - `edit`, коли provider оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної ланки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний прогін
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати перевизначення лише через env

## Live для генерації відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Охоплення:
  - Перевіряє спільний bundled-шлях provider для генерації відео
  - За замовчуванням використовує release-safe smoke-шлях: providers без FAL, один запит text-to-video на provider, односекундний prompt про лобстера і обмеження операції на provider з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` типово)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці provider може домінувати над часом release; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує змінні середовища provider з вашого login shell (`~/.profile`) перед перевіркою
  - За замовчуванням використовує live/env API keys раніше за збережені auth-profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає provider без придатних auth/profile/model
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, коли вони доступні:
    - `imageToVideo`, коли provider оголошує `capabilities.imageToVideo.enabled` і вибраний provider/model приймає локальні вхідні дані зображень на основі buffer у спільному прогоні
    - `videoToVideo`, коли provider оголошує `capabilities.videoToVideo.enabled` і вибраний provider/model приймає локальні вхідні дані відео на основі buffer у спільному прогоні
  - Поточні provider `imageToVideo`, оголошені, але пропущені в спільному прогоні:
    - `vydra`, тому що bundled `veo3` підтримує лише text, а bundled `kling` потребує віддалений image URL
  - Покриття Vydra, специфічне для provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс ланку `kling`, яка типово використовує фікстуру з віддаленим image URL
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні provider `videoToVideo`, оголошені, але пропущені в спільному прогоні:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі потребують віддалені URL-посилання `http(s)` / MP4
    - `google`, тому що поточна спільна ланка Gemini/Veo використовує локальні вхідні дані на основі buffer, і цей шлях не приймається в спільному прогоні
    - `openai`, тому що поточна спільна ланка не гарантує доступ до org-specific video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожен provider до типового прогону, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження часу операції для кожного provider в агресивному smoke-запуску
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів і ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через один природний для репозиторію entrypoint
  - Автоматично завантажує відсутні змінні середовища provider з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до provider, які наразі мають придатну auth
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Ранери Docker (необов’язкові перевірки «працює в Linux»)

Ці ранери Docker поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний їм live-файл із profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Live-ранери Docker за замовчуванням використовують меншу smoke-межу, щоб повний прогін у Docker залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам свідомо потрібен більший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох live Docker lanes.
- Контейнерні smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Ранери Docker для live-моделей також bind-mount лише потрібні CLI auth home (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени, не змінюючи host auth store:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст MCP channel (ініціалізований Gateway + stdio-міст + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + вбудований smoke allow/deny профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke інсталяції + alias `/plugin` + семантика перезапуску bundle Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Runtime-залежності bundled plugin: `pnpm test:docker:bundled-channel-deps` типово збирає малий образ Docker runner, один раз збирає і пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій інсталяції Linux. Повторно використовуйте образ із `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть повторну збірку на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime-залежності bundled plugin під час ітерацій, вимикаючи нерелевантні сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Ранери Docker для live-моделей також bind-mount поточний checkout у режимі лише читання і
переносять його в тимчасовий workdir усередині контейнера. Це дозволяє зберігати runtime
image компактним, водночас запускаючи Vitest точно на ваших локальних source/config.
Під час перенесення пропускаються великі локальні кеші та результати збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-зонди gateway не запускали
реальні worker каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити live-покриття gateway з цієї Docker-ланки.
`test:docker:openwebui` — це compatibility smoke вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP-endpoint, сумісними з OpenAI,
запускає pinned-контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, тому що Docker може знадобитися витягнути
image Open WebUI, а самому Open WebUI може знадобитися завершити власне cold-start-налаштування.
Ця ланка очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає ініціалізований
контейнер Gateway, запускає другий контейнер, який піднімає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання transcript, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та channel +
сповіщення про дозволи в стилі Claude через реальний міст stdio MCP. Перевірка сповіщень
напряму аналізує сирі кадри stdio MCP, тож smoke перевіряє те, що міст
справді надсилає, а не лише те, що випадково надає певний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує ключа
live-моделі. Він збирає Docker image репозиторію, запускає реальний probe server stdio MCP
всередині контейнера, матеріалізує цей server через вбудований runtime MCP пакета Pi,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає ініціалізований Gateway з реальним probe server stdio MCP, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflow регресій/налагодження. Він може знову знадобитися для перевірки маршрутизації thread ACP, тож не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і завантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, завантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх mount для auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих інсталяцій CLI всередині Docker
- Зовнішні каталоги/файли auth CLI під `$HOME` монтуються в режимі лише читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски provider монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати provider усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, яким не потрібна нова збірка
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити pinned tag image Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну перевірку якорів Mintlify, коли вам також потрібна перевірка заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайнова регресія (безпечно для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис конфігурації + примусове застосування auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності agent (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності agent»:

- Mock-виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end потоки майстра, які перевіряють wiring сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішення:** коли Skills перелічені в prompt, чи вибирає agent правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає agent `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/args?
- **Контракти workflow:** багатокрокові сценарії, що перевіряють порядок інструментів, перенесення історії сесії між ходами та межі sandbox.

Майбутні eval спершу мають залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на skill (використати чи уникнути, керування доступом, prompt injection).
- Необов’язкові live eval (opt-in, під керуванням env) лише після того, як з’явиться безпечний для CI набір.

## Contract-тести (форма plugin і channel)

Contract-тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони проходять по всіх виявлених plugin і виконують набір
перевірок форми та поведінки. Типова unit-ланка `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте contract-команди явно,
коли торкаєтесь спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** — Базова форма plugin (id, name, capabilities)
- **setup** — Контракт майстра налаштування
- **session-binding** — Поведінка прив’язки сесії
- **outbound-payload** — Структура payload повідомлення
- **inbound** — Обробка вхідних повідомлень
- **actions** — Обробники дій channel
- **threading** — Обробка id thread
- **directory** — API каталогу/складу
- **group-policy** — Примусове застосування групової політики

### Status-контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** — Зонди статусу channel
- **registry** — Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** — Контракт потоку auth
- **auth-choice** — Вибір/підбір auth
- **catalog** — API каталогу моделей
- **discovery** — Виявлення plugin
- **loader** — Завантаження plugin
- **runtime** — Runtime provider
- **shape** — Форма/інтерфейс plugin
- **wizard** — Майстер налаштування

### Коли запускати

- Після зміни експортів або subpath у plugin-sdk
- Після додавання або зміни plugin channel чи provider
- Після рефакторингу реєстрації або виявлення plugin

Contract-тести запускаються в CI й не потребують реальних API keys.

## Додавання регресій (вказівки)

Коли ви виправляєте проблему provider/model, виявлену в live:

- За можливості додавайте безпечну для CI регресію (mock/stub provider або фіксацію точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), зберігайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який ловить баг:
  - баг перетворення/відтворення запиту provider → тест прямих моделей
  - баг конвеєра gateway session/history/tool → gateway live smoke або безпечний для CI gateway mock-тест
- Guardrail для обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою на некласифікованих id цілей, щоб нові класи не можна було тихо пропустити.
