---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-21T20:52:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f890d6aa69925e09c5847b7fa082f3076b3bc79aae3e72445c750633a2451fa
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресійні тести для реальних проблем моделей/провайдерів

## Швидкий старт

У більшості випадків:

- Повний контрольний прогін (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку віддавайте перевагу точковим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-набір у Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Контрольний прогін покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Точково запустити один live-файл у тихому режимі: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Перевірка вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON показує Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізований `usage.cost`.

Порада: коли вам потрібен лише один проблемний випадок, звужуйте live-тести через змінні середовища allowlist, описані нижче.

## QA-ранери для окремих сценаріїв

Ці команди доповнюють основні набори тестів, коли вам потрібен реалістичний QA-lab:

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими Gateway-воркерами. Для `qa-channel` типовий рівень паралельності — 4 (обмежений кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість воркерів, або `--concurrency 1` для старого послідовного режиму.
  - Завершується з ненульовим кодом, якщо будь-який сценарій падає. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без аварійного коду завершення.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального покриття фікстур і моків протоколу без заміни сценарно-орієнтованого режиму `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір у тимчасовій Linux VM через Multipass.
  - Використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - У live-запусках передає підтримувані QA-входи автентифікації, які практично використовувати в гостьовій системі:
    ключі провайдерів із env, шлях до конфігурації QA live provider та `CODEX_HOME`, якщо він є.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через змонтовану робочу область.
  - Записує стандартний QA-звіт і підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, потім вмикає Telegram і Discord через редагування конфігурації.
  - Перевіряє, що перший перезапуск Gateway встановлює runtime-залежності кожного вбудованого channel Plugin на вимогу, а другий перезапуск не перевстановлює залежності, які вже були активовані.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Пакетні інсталяції OpenClaw не постачають `qa-lab`, тому не надають `openclaw qa`.
  - Чекаути репозиторію завантажують вбудований ранер напряму; окремий крок встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, потім запускає дочірній QA Gateway із реальним Matrix Plugin як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Замініть через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки цей lane локально створює тимчасових користувачів.
  - Записує Matrix QA-звіт, підсумок, артефакт observed-events і комбінований лог stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. Типово використовуйте режим env, або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій падає. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без аварійного коду завершення.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує Telegram QA-звіт, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`.

Live transport lanes мають спільний стандартний контракт, щоб нові транспорти не розходилися в поведінці:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live transport.

| Lane     | Canary | Блокування згадок | Блок allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | ----------------- | -------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x                 | x              | x                         | x                             | x                          | x               | x                          |              |
| Telegram | x      |                   |                |                           |                               |                            |                 |                            | x            |

### Спільні Telegram-облікові дані через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки lane працює, і звільняє оренду під час завершення.

Каркас еталонного проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL-адреси Convex `http://` лише для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Адміністраторські команди maintainer (додавання/видалення/перелік пулу) вимагають саме
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

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

### Додавання каналу до QA

Щоб додати канал до markdown-системи QA, потрібні рівно дві речі:

1. Транспортний адаптер для каналу.
2. Набір сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab`
може керувати цим процесом.

`qa-lab` відповідає за спільну хостову механіку:

- кореневу команду `openclaw qa`
- запуск і зупинку наборів
- паралельність воркерів
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Runner Plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як конфігурується Gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, що спираються на транспорт
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг впровадження нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному хостовому seam `qa-lab`.
3. Залишайте транспортно-специфічну механіку всередині runner Plugin або channel harness.
4. Монтуйте ранер як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner Plugins повинні оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Підтримуйте `runtime-api.ts` легким; ліниве виконання CLI і раннера має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте узагальнені хелпери сценаріїв для нових сценаріїв.
7. Зберігайте наявні alias сумісності робочими, якщо в репозиторії не виконується навмисна міграція.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, залишайте її в цьому runner Plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте узагальнений хелпер замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій transport-specific і явно зазначайте це в контракті сценарію.

Бажані назви узагальнених хелперів для нових сценаріїв:

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

Для наявних сценаріїв залишаються доступними alias сумісності, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над каналами має використовувати узагальнені назви хелперів.
Alias сумісності існують, щоб уникнути міграції одним днем, а не як зразок для
авторингу нових сценаріїв.

## Набори тестів (що і де запускається)

Сприймайте набори як «зростання реалістичності» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: десять послідовних shard-запусків (`vitest.full-*.config.ts`) поверх наявних scoped Vitest project
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelisted node-тести `ui`, охоплені `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка про projects:
  - `pnpm test` без цільового файлу тепер запускає одинадцять менших shard-конфігурацій (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати нерелевантні набори.
  - `pnpm test --watch` усе ще використовує граф project із native root `vitest.config.ts`, оскільки цикл watch із кількома shard непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test-файлів; редагування config/setup все ще повертаються до широкого повторного запуску root-project.
  - `pnpm check:changed` — це звичайний розумний локальний контрольний прогін для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs і tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають перевірку extension, оскільки extensions залежать від цих core-контрактів.
  - Import-light unit-тести з agents, commands, plugins, helper auto-reply, `plugin-sdk` та подібних чистих утилітних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
  - Окремі helper source-файли `plugin-sdk` і `commands` також зіставляють запуски в changed-режимі з явними sibling-тестами в цих легких lanes, тому редагування helper уникають повторного запуску повного важкого набору для цього каталогу.
  - `auto-reply` тепер має три окремі bucket: top-level core helper, top-level integration-тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це прибирає найважчу роботу harness reply з дешевих тестів status/chunk/token.
- Примітка про embedded runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime-контекст compaction,
    зберігайте обидва рівні покриття.
  - Додавайте точкові helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте в доброму стані integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id і поведінка compaction усе ще проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка про pool:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує non-isolated runner для root projects, e2e і live configs.
  - Кореневий lane UI зберігає свій `jsdom` setup та optimizer, але тепер також працює на спільному non-isolated runner.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-процесів Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидку локальну ітерацію:
  - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
  - Pre-commit hook запускає `pnpm check:changed --staged` після staged formatting/linting, тому core-only commits не платять ціну extension-тестів, якщо не торкаються публічних контрактів для extensions.
  - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи чисто зіставляються з меншим набором.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим лімітом воркерів.
  - Автоматичне масштабування локальних воркерів тепер навмисно консервативне й також знижує навантаження, коли host load average вже високе, тому кілька одночасних запусків Vitest типово завдають менше шкоди.
  - Базова конфігурація Vitest позначає files projects/config як `forceRerunTriggers`, щоб rerun у changed-режимі залишалися коректними, коли змінюється test wiring.
  - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну локацію кешу для прямого профілювання.
- Примітка про perf-debug:
  - `pnpm test:perf:imports` вмикає звітність Vitest про тривалість import плюс вивід деталізації import.
  - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання файлами, зміненими від `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native шляхом root-project для цього committed diff і виводить wall time плюс macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного брудного дерева, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує main-thread CPU profile для накладних витрат запуску і transform у Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для unit-набору з вимкненим file parallelism.

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість воркерів (CI: до 2, локально: 1 за замовчуванням).
  - Типово запускається в тихому режимі, щоб зменшити накладні витрати на console I/O.
- Корисні override:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість воркерів (максимум 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - End-to-end поведінка gateway із кількома екземплярами
  - Поверхні WebSocket/HTTP, спарювання вузлів і складніша мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, потім знищує тестові gateway і sandbox
- Корисні override:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний CLI-бінарник або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом нестабільний у CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені піднабори, а не «все»
- Live-запуски підвантажують `~/.profile`, щоб отримати відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам свідомо потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово використовує тихіший режим: він зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає логи bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові логи.
- Ротація API-ключів (залежно від провайдера): встановіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюються у відповідь на rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб довгі виклики провайдера було видно як активні, навіть коли перехоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі у Vitest, тому рядки progress провайдера/gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтесь мережевої взаємодії gateway / протоколу WS / спарювання: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої конкретного провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі оголошує** підключений Android Node, і перевірити поведінку контракту команд.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає і не спаровує застосунок).
  - Перевірка `node.invoke` у Gateway команда за командою для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключений і спарений із Gateway.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові override цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділено на два шари, щоб можна було ізолювати збої:

- «Direct model» показує, чи взагалі провайдер/модель може відповідати з наданим ключем.
- «Gateway smoke» показує, що повний конвеєр gateway+agent працює для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Шар 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, alias для modern), щоб справді запустити цей набір; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це alias для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Прогони modern/all типово мають підібрану межу з високим сигналом; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншої межі.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - Типово: зі сховища профілів і резервних env-джерел
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб вимагати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: replay reasoning у OpenAI Responses/Codex Responses + потоки tool-call)

### Шар 2: Gateway + smoke dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process Gateway
  - Створити/оновити сесію `agent:dev:*` (override моделі для кожного запуску)
  - Ітеруватися по моделях із ключами та перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що реальний виклик інструмента працює (перевірка `read`)
    - необов’язкові додаткові перевірки інструментів (перевірка `exec+read`)
    - що шляхи регресій OpenAI (лише tool-call → наступний крок) і далі працюють
- Деталі перевірок probe (щоб можна було швидко пояснювати збої):
  - probe `read`: тест записує файл із nonce у workspace і просить агента `read` його та повернути nonce.
  - probe `exec+read`: тест просить агента через `exec` записати nonce у тимчасовий файл, а потім прочитати його назад через `read`.
  - image probe: тест додає згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це alias для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Прогони modern/all для gateway типово мають підібрану межу з високим сигналом; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern-прогону або додатне число для меншої межі.
- Як вибирати провайдерів (уникнути «все з OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки tool + image завжди увімкнені в цьому live-тесті:
  - probe `read` + probe `exec+read` (навантаження на інструменти)
  - image probe запускається, коли модель оголошує підтримку image input
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway парсить attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (OCR tolerance: незначні помилки дозволені)

Порада: щоб побачити, що можна протестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent за допомогою локального CLI backend, не торкаючись вашої типової конфігурації.
- Типові значення smoke для конкретного backend живуть у визначенні `cli-backend.ts` extension-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий provider/model: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих Plugin CLI backend-власника.
- Override (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне image-вкладення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи файлів зображень як CLI args замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання image args, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типову перевірку безперервності тієї самої сесії Claude Sonnet -> Opus (встановіть `1`, щоб примусово ввімкнути її, коли вибрана модель підтримує ціль перемикання).

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker-рецепт:

```bash
pnpm test:docker:live-cli-backend
```

Docker-рецепти для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-ранер розташовано в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані CLI smoke із extension-власника, а потім встановлює відповідний Linux CLI-пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable Claude Code subscription OAuth через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, потім запускає два ходи Gateway CLI-backend без збереження env-змінних ключа Anthropic API. Цей lane підписки типово вимикає probe Claude MCP/tool та image, оскільки Claude зараз маршрутизує використання сторонніх застосунків через додаткове usage billing замість звичайних лімітів плану підписки.
- Live smoke CLI-backend тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід із класифікацією зображення, потім виклик інструмента MCP `cron`, перевірений через Gateway CLI.
- Типовий smoke для Claude також оновлює сесію із Sonnet до Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік conversation-bind ACP із live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайне подальше повідомлення в тій самій розмові
  - перевірити, що подальше повідомлення потрапляє до транскрипту прив’язаної ACP session
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови в стилі Slack DM
  - ACP backend: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Цей lane використовує поверхню gateway `chat.send` з admin-only synthetic originating-route fields, щоб тести могли прикріплювати контекст message-channel, не вдаючи зовнішню доставку.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів Plugin `acpx` для вибраного ACP harness agent.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker-рецепт:

```bash
pnpm test:docker:live-acp-bind
```

Docker-рецепти для одного агента:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker-ранер розташовано в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає smoke ACP bind послідовно для всіх підтримуваних live CLI agents: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, переносить відповідні матеріали CLI auth у контейнер, встановлює `acpx` у записуваний npm-префікс, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його бракує.
- Усередині Docker ранер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з підвантаженого профілю доступними для дочірнього harness CLI.

## Live: smoke harness app-server Codex

- Мета: перевірити Codex harness, яким володіє Plugin, через звичайний метод gateway
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.4`
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік
    app-server може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях gateway
    command
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.4`
- Необов’язковий image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke-тест встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти, тихо переключившись назад на PI.
- Автентифікація: `OPENAI_API_KEY` із shell/profile, плюс необов’язково скопійовані
  `~/.codex/auth.json` і `~/.codex/config.toml`

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-рецепт:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розташовано в `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm
  префікс, готує дерево вихідного коду, а потім запускає лише live-тест Codex-harness.
- Docker типово вмикає image і MCP/tool probes. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, коли вам потрібен вужчий налагоджувальний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і live
  конфігурація тесту, тому fallback `openai-codex/*` або PI не може приховати регресію
  Codex harness.

### Рекомендовані live-рецепти

Вузькі, явні allowlist найшвидші й найменш нестабільні:

- Одна модель, direct (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (ключ API).
- `google-antigravity/...` використовує міст OAuth Antigravity (endpoint агента в стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація ключем API / профілем); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний бінарник `gemini`; він має власну автентифікацію та може поводитися інакше (streaming/підтримка інструментів/розсинхрон версій).

## Live: матриця моделей (що ми охоплюємо)

Фіксованого «списку моделей CI» немає (live — це opt-in), але це **рекомендовані** моделі, які варто регулярно покривати на dev-машині з ключами.

### Сучасний smoke-набір (виклик інструментів + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати в робочому стані:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустіть gateway smoke з інструментами + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Оберіть щонайменше одну модель для кожного сімейства провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (оберіть одну модель із підтримкою інструментів, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання image (вкладення → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою image у `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI із підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів та image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (кастомні endpoint): `minimax` (cloud/API), а також будь-який сумісний із OpenAI/Anthropic proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко прописати в документації «усі моделі». Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині, плюс ті ключі, які доступні.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Застарілий каталог стану: `~/.openclaw/credentials/` (копіюється до staged live home, якщо існує, але це не основне сховище ключів профілів)
- Локальні live-запуски типово копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий каталог `credentials/` і підтримувані зовнішні каталоги CLI auth у тимчасовий test home; staged live home пропускають `workspace/` і `sandboxes/`, а override шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probes не працювали у вашому реальному host workspace.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live: Deepgram (транскрипція аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live: планування кодування BytePlus

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язковий override моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: медіа workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо `models.providers.comfy.<capability>` не налаштовано
  - Корисно після змін у надсиланні workflow comfy, polling, завантаженнях або реєстрації Plugin

## Live: генерація зображень

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований Plugin провайдера генерації зображень
  - Завантажує відсутні env-змінні провайдера з вашого login shell (`~/.profile`) перед виконанням probe
  - Типово використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, які покриваються:
  - `openai`
  - `google`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати override лише з env

## Live: генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдерів генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдера з вашого login shell (`~/.profile`) перед виконанням probe
  - Типово використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільного lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не цей спільний прогін
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати override лише з env

## Live: генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдерів генерації відео
  - Типово використовує безпечний для релізу шлях smoke: провайдери без FAL, один запит text-to-video на провайдера, односекундний prompt про лобстера та обмеження операції для кожного провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (типово `180000`)
  - Типово пропускає FAL, тому що затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдера з вашого login shell (`~/.profile`) перед виконанням probe
  - Типово використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/profile/model
  - Типово запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled`, а вибраний провайдер/модель приймає локальний image input на основі buffer у спільному прогоні
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled`, а вибраний провайдер/модель приймає локальний video input на основі buffer у спільному прогоні
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному прогоні:
    - `vydra`, тому що вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалений image URL
  - Покриття Vydra для конкретного провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс lane `kling`, який типово використовує фікстуру віддаленого image URL
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному прогоні:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи зараз вимагають віддалені URL-адреси посилань `http(s)` / MP4
    - `google`, тому що поточний спільний lane Gemini/Veo використовує локальний input на основі buffer, і цей шлях не приймається у спільному прогоні
    - `openai`, тому що поточний спільний lane не має гарантій доступу до специфічних для org можливостей video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера в типовий прогін, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції для кожного провайдера під час агресивного smoke-прогону
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати override лише з env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для image, music і video через один native entrypoint репозиторію
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - Типово автоматично звужує кожен набір до провайдерів, які зараз мають придатну auth
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Ранери live-model: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключами профілів усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог конфігурації та workspace (і підвантажують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово використовують меншу межу smoke, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Замінюйте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох Docker live-lane.
- Ранери smoke контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-model також bind-mount лише потрібні CLI auth home (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змінення сховища auth на хості:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke app-server harness Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережева взаємодія Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст каналу MCP (ініціалізований Gateway + stdio bridge + smoke сирого notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke встановлення + alias `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Docker-ранери live-model також bind-mount поточний checkout лише для читання та
готують його у тимчасовий workdir усередині контейнера. Це зберігає runtime-образ
компактним, водночас дозволяючи запускати Vitest точно на вашому локальному вихідному коді/конфігурації.
Етап підготовки пропускає великі локальні кеші та вихідні дані збірки застосунків, як-от
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунку каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні воркери каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити live-покриття gateway з цього Docker lane.
`test:docker:openwebui` — це smoke вищого рівня на сумісність: він запускає
контейнер Gateway OpenClaw з увімкненими сумісними з OpenAI HTTP endpoint,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може потребувати завантаження
образу Open WebUI, а Open WebUI може потребувати завершення власного cold-start налаштування.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він піднімає ініціалізований контейнер Gateway,
запускає другий контейнер, який виконує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення в стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує сирі stdio MCP frames, тож smoke перевіряє те, що
міст справді випромінює, а не лише те, що випадково показує конкретний клієнтський SDK.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Залишайте цей скрипт для регресійних робочих процесів і налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і підвантажується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace та без зовнішніх mount для CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих CLI-інсталяцій усередині Docker
- Зовнішні каталоги/файли CLI auth у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway відкриває для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб override nonce-check prompt, використаний smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб override закріплений тег образу Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайнова регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис конфігурації + примусова auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють wiring сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Що ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи дотримується обов’язкових кроків/args?
- **Контракти робочих процесів:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval мають насамперед залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live eval (opt-in, з обмеженням через env) лише після того, як безпечний для CI набір буде готовий.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
контракту інтерфейсу. Вони ітеруються по всіх виявлених Plugin і запускають набір
перевірок форми та поведінки. Типовий unit lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

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
- **auth-choice** - Вибір/селектор автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдер або фіксація точної трансформації форми запиту)
- Якщо це за своєю природою лише live-випадок (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому шару, який виявляє баг:
  - баг перетворення/повторення запиту провайдера → direct models test
  - баг у конвеєрі session/history/tool gateway → gateway live smoke або безпечний для CI gateway mock test
- Захисна межа traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль для кожного класу SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів traversal відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.
