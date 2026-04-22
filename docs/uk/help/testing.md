---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-22T23:11:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73da7ae34464cf08d337e53670ceed538fe90d9622fac13b649f9d11aa2d1df7
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для типових робочих процесів (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресії для реальних проблем моделей/провайдерів

## Швидкий старт

У більшості випадків:

- Повний контрольний прогін (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи plugin/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-ланка на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Контрольний прогін покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Димовий тест вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6 і що
  транскрипт асистента зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## QA-специфічні ранери

Ці команди використовуються поряд з основними наборами тестів, коли вам потрібен реалізм qa-lab:

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими воркерами Gateway. Для `qa-channel` типовим є рівень паралелізму 4 (обмежений кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість воркерів, або `--concurrency 1` для старішої послідовної ланки.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального покриття фікстур і mock-протоколу без заміни сценаріє-орієнтованої ланки `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані QA-входи автентифікації, які практичні для guest:
    ключі провайдерів через env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб guest міг записувати назад через змонтований робочий простір.
  - Записує звичайний QA-звіт + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    зі сконфігурованим OpenAI, а потім вмикає Telegram і Discord через редагування конфігурації.
  - Перевіряє, що перезапуск Gateway уперше встановлює runtime-залежності кожного вбудованого channel plugin за потреби, а другий перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що post-update doctor кандидата відновлює runtime-залежності вбудованих channel без відновлення postinstall з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого димового тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-ланку Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост сьогодні призначений лише для repo/dev. Паковані встановлення OpenClaw не постачають `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують вбудований раннер безпосередньо; окремий крок встановлення plugin не потрібен.
  - Надає три тимчасові користувачі Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця ланка локально створює тимчасових користувачів.
  - Записує QA-звіт Matrix, підсумок, артефакт observed-events і комбінований журнал stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA-ланку Telegram проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулованих облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути пуловані оренди.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, якщо вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів у тій самій приватній групі, при цьому бот SUT має мати доступне ім’я користувача Telegram.
  - Для стабільного спостереження бот-за-ботом увімкніть режим Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує QA-звіт Telegram, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`.

Live-транспортні ланки поділяють один стандартний контракт, щоб нові транспорти не дрейфували:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці покриття live-транспортів.

| Ланка    | Canary | Гейтінг згадок | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | -------------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x              | x                    | x                         | x                             | x                          | x               | x                          |              |
| Telegram | x      |                |                      |                           |                               |                            |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки ланка працює, і звільняє оренду під час завершення роботи.

Шаблон еталонного проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (типово `ci` у CI, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (типово `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (типово `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (типово `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (типово `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (типово `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Команди адміністрування для maintainers (додавання/видалення/список пулу) вимагають
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитаного виводу в скриптах і утилітах CI.

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
- `groupId` має бути рядком числового ідентифікатора чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання channel до QA

Додавання channel до markdown QA system вимагає рівно двох речей:

1. Транспортного адаптера для channel.
2. Пакета сценаріїв, який перевіряє контракт channel.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab`
може володіти цим потоком.

`qa-lab` володіє спільною хост-механікою:

- коренем команди `openclaw qa`
- запуском і завершенням набору
- паралелізмом воркерів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway конфігурується для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії з транспортною підтримкою
- як обробляються скидання або очищення, специфічні для транспорту

Мінімальна планка для впровадження нового channel:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний раннер на спільному хост-сімі `qa-lab`.
3. Зберігайте транспортно-специфічну механіку всередині runner plugin або harness channel.
4. Монтуйте раннер як `openclaw qa <runner>`, а не реєструйте конкуруючий кореневий простір команд.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; відкладене виконання CLI і раннера має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте узагальнені хелпери сценаріїв для нових сценаріїв.
7. Зберігайте робочими наявні псевдоніми сумісності, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, зберігайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використати більше ніж один channel, додайте узагальнений хелпер замість channel-специфічної гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного transport, залишайте сценарій transport-специфічним і явно вказуйте це в контракті сценарію.

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота з channel має використовувати узагальнені назви хелперів.
Псевдоніми сумісності існують, щоб уникнути міграції «в один день», а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типовий)

- Команда: `pnpm test`
- Конфігурація: десять послідовних shard-запусків (`vitest.full-*.config.ts`) по наявних scoped Vitest projects
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і внесені до allowlist node-тести `ui`, охоплені `vitest.unit.config.ts`
- Область:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація Gateway, маршрутизація, інструменти, парсинг, конфігурація)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка про projects:
  - Ненаправлений `pnpm test` тепер запускає одинадцять менших shard-конфігурацій (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського root-project native process. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` досі використовує native root `vitest.config.ts` project graph, оскільки цикл спостереження з багатьма shard непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі file/directory через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff зачіпає лише routable source/test files; редагування config/setup досі повертаються до широкого повторного запуску root-project.
  - `pnpm check:changed` — це звичайний розумний локальний контрольний прогін для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні lanes typecheck/lint/test. Зміни у публічному Plugin SDK і plugin-contract включають перевірку extension, бо extensions залежать від цих контрактів core. Оновлення версій лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, що відхиляє зміни package поза полем version верхнього рівня.
  - Unit-тести з легкими import із agents, commands, plugins, хелперів auto-reply, `plugin-sdk` та подібних чистих утилітних областей маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lanes.
  - Вибрані вихідні файли хелперів `plugin-sdk` і `commands` також відображають changed-mode запуски на явні sibling-тести в цих легких lanes, тож редагування хелперів уникають повторного запуску всього важкого набору для цього каталогу.
  - `auto-reply` тепер має три окремі bucket: top-level core helpers, top-level integration-тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це прибирає найважчу роботу harness reply із дешевих тестів status/chunk/token.
- Примітка про embedded runner:
  - Коли ви змінюєте вхідні дані виявлення message-tool або runtime context Compaction,
    зберігайте обидва рівні покриття.
  - Додавайте цільові helper-регресії для чистих меж routing/normalization.
  - Також підтримуйте здоровими integration-набори embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped ids і поведінка Compaction досі проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка про пул:
  - Базова конфігурація Vitest тепер типово використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує неізольований runner у root projects, e2e і live configs.
  - Коренева lane UI зберігає свій `jsdom` setup і optimizer, але тепер також працює на спільному неізольованому runner.
  - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false` зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також типово додає `--no-maglev` для дочірніх Node-process Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо вам потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидку локальну ітерацію:
  - `pnpm changed:lanes` показує, які архітектурні lanes запускає diff.
  - Pre-commit hook запускає `pnpm check:changed --staged` після staged formatting/linting, тож core-only commits не оплачують вартість extension tests, якщо вони не зачіпають публічні extension-facing contracts. Коміти лише з release metadata залишаються в цільовій lane version/config/root-dependency.
  - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи чисто відображаються на менший набір.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим обмеженням воркерів.
  - Автомасштабування локальних воркерів тепер навмисно консервативне і також зменшується, коли середнє навантаження хоста вже високе, тому кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає файли projects/config як `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється wiring тестів.
  - Конфігурація зберігає увімкненим `OPENCLAW_VITEST_FS_MODULE_CACHE` на підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо вам потрібне одне явне розташування кешу для прямого профілювання.
- Примітка про Perf-debug:
  - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість import разом із виводом деталізації import.
  - `pnpm test:perf:imports:changed` обмежує той самий вид профілювання файлами, зміненими відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native root-project path для цього закоміченого diff і виводить wall time плюс macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного dirty tree, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує main-thread CPU-profile для overhead запуску і transform у Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для unit-набору з вимкненим file parallelism.

### E2E (димовий тест Gateway)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість воркерів (CI: до 2, локально: 1 за замовчуванням).
  - Типово працює в silent mode, щоб зменшити overhead консольного I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний консольний вивід.
- Область:
  - Наскрізна поведінка кількох екземплярів Gateway
  - Поверхні WebSocket/HTTP, pairing вузлів і складніша мережна взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: димовий тест бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Область:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє канонічну поведінку віддаленої файлової системи через міст fs sandbox
- Очікування:
  - Лише opt-in; не є частиною типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний бінарний файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** командою `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Область:
  - «Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей tool-calling, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limits
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API keys.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер типово працює в тихішому режимі: воно зберігає вивід прогресу `[live] ...`, але пригнічує додаткове повідомлення `~/.profile` і вимикає логи bootstrap Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup logs.
- Ротація API keys (специфічно для провайдера): установіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення на рівні live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, щоб під час довгих викликів провайдера було видно, що робота триває, навіть коли Vitest працює з тихим перехопленням консолі.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, щоб рядки прогресу провайдера/Gateway одразу транслювалися під час live-запусків.
  - Налаштовуйте Heartbeat прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато чого змінили)
- Якщо зачіпаєте мережну взаємодію Gateway / протокол WS / pairing: додайте `pnpm test:e2e`
- Під час налагодження «мій бот не працює» / збоїв, специфічних для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку зараз оголошує** підключений Android node, і перевірити поведінку контракту команди.
- Область:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює/не запускає/не виконує pairing застосунку).
  - Перевірка `node.invoke` Gateway для вибраного Android node, команда за командою.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено й виконано pairing із Gateway.
  - Застосунок має залишатися на передньому плані.
  - Для можливостей, які мають проходити перевірку, надано дозволи/згоду на захоплення.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Live: димовий тест моделі (ключі профілів)

Live-тести поділено на два рівні, щоб ми могли ізолювати збої:

- «Пряма модель» показує, що провайдер/модель взагалі може відповісти з наданим ключем.
- «Димовий тест Gateway» показує, що повний конвеєр gateway+agent працює для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використовувати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запускати цей набір; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на димовому тесті Gateway
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` для запуску modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для modern/all sweeps типово використовується curated high-signal cap; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого cap.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - Типово: сховище профілів і резервні варіанти з env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: повторення reasoning у OpenAI Responses/Codex Responses + потоки tool-call)

### Рівень 2: димовий тест Gateway + dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process Gateway
  - Створити/пропатчити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі-з-ключами й перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (probe читання)
    - необов’язкові додаткові probe інструментів (probe exec+read)
    - що шляхи регресії OpenAI (лише tool-call → подальший виклик) і далі працюють
- Подробиці probe (щоб ви могли швидко пояснювати збої):
  - probe `read`: тест записує nonce-файл у робочому просторі й просить агента `read` його та повернути nonce назад.
  - probe `exec+read`: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - Типово: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для modern/all gateway sweeps типово використовується curated high-signal cap; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern sweep або додатне число для меншого cap.
- Як вибирати провайдерів (уникаючи «все через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Probe інструментів і зображень у цьому live-тесті завжди увімкнені:
  - probe `read` + probe `exec+read` (навантаження на інструменти)
  - image probe запускається, коли модель оголошує підтримку вхідних зображень
  - Потік (високий рівень):
    - Тест генерує крихітний PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент передає multimodal-повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що ви можете тестувати на своїй машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: димовий тест CLI-бекенда (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent, використовуючи локальний CLI-бекенд, не зачіпаючи вашу типову конфігурацію.
- Типові параметри димового тесту, специфічні для бекенда, зберігаються у визначенні `cli-backend.ts` extension, яка ним володіє.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові параметри:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих plugin CLI backend, яка ним володіє.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи інжектуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типовий probe безперервності тієї самої сесії Claude Sonnet -> Opus (установіть `1`, щоб примусово ввімкнути його, коли вибрана модель підтримує ціль переключення).

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

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає димовий тест live CLI-backend усередині Docker-образу репозиторію як непривілейований користувач `node`.
- Він визначає метадані димового тесту CLI з extension, яка ним володіє, а потім встановлює відповідний пакет Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс за адресою `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` вимагає portable Claude Code subscription OAuth через `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку він перевіряє прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-backend без збереження змінних середовища Anthropic API-key. Ця subscription-ланка за замовчуванням вимикає probe Claude MCP/tool і зображень, оскільки Claude наразі маршрутизує використання сторонніх застосунків через додаткове billing за використання замість звичайних лімітів subscription plan.
- Димовий тест live CLI-backend тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через Gateway CLI.
- Типовий димовий тест Claude також патчить сесію із Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: димовий тест прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язки розмови ACP із live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайне подальше повідомлення в цій самій розмові
  - перевірити, що подальше повідомлення потрапляє в транскрипт прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові параметри:
  - ACP agents у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний channel: контекст розмови в стилі Slack DM
  - Бекенд ACP: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Примітки:
  - Ця ланка використовує поверхню gateway `chat.send` з admin-only синтетичними полями originating-route, щоб тести могли приєднувати контекст message-channel без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів plugin `acpx` для вибраного ACP harness agent.

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

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає димовий тест прив’язки ACP послідовно для всіх підтримуваних live CLI agents: `claude`, `codex`, а потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він використовує `~/.profile`, переносить відповідні auth-матеріали CLI в контейнер, встановлює `acpx` у записуваний npm-префікс, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав змінні середовища провайдера зі sourced profile доступними для дочірнього harness CLI.

## Live: димовий тест harness app-server Codex

- Мета: перевірити harness Codex, яким володіє plugin, через звичайний gateway
  метод `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.4`
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що thread
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий командний шлях
    gateway
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.4`
- Необов’язковий image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Димовий тест встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти перевірку, тихо переключившись на PI.
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

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він використовує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI, якщо вони присутні, встановлює `@openai/codex` у записуваний змонтований npm
  префікс, готує дерево вихідного коду, а потім запускає лише live-тест Codex-harness.
- Docker типово вмикає image і MCP/tool probes. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, коли потрібен вужчий налагоджувальний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і live
  конфігурація тесту, щоб fallback `openai-codex/*` або PI не міг приховати регресію
  Codex harness.

### Рекомендовані live-рецепти

Вузькі, явні allowlist — найшвидші та найменш нестабільні:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, димовий тест Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling через кілька провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує OAuth-міст Antigravity (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений у Google Gemini API через HTTP (автентифікація через API key / profile); це те, що більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний бінарний файл `gemini`; він має власну автентифікацію й може поводитися інакше (streaming/підтримка інструментів/розходження версій).

## Live: матриця моделей (що ми охоплюємо)

Фіксованого «списку моделей CI» не існує (live — це opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний набір димових тестів (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск димового тесту Gateway з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Виберіть щонайменше одну модель на сімейство провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання зображення (вкладення → multimodal-повідомлення)

Включіть щонайменше одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб задіяти image probe.

### Агрегатори / альтернативні Gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tool+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, які можна включити в live-матрицю (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoints): `minimax` (хмара/API), а також будь-який сумісний із OpenAI/Anthropic proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко прописати в документації «усі моделі». Авторитетним списком є те, що `discoverModels(...)` повертає на вашій машині, плюс ті ключі, які доступні.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знайти ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це в live-тестах означає «ключі профілів»)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється в staged live home, якщо присутній, але не в основне сховище ключів профілів)
- Локальні live-запуски типово копіюють активну конфігурацію, файли `auth-profiles.json` для окремих агентів, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI в тимчасовий test home; staged live homes пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probes не працювали у вашому реальному робочому просторі хоста.

Якщо ви хочете покладатися на env keys (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live: Deepgram (транскрипція аудіо)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live: план кодування BytePlus

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: медіа workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у поданні workflow comfy, опитуванні, завантаженнях або реєстрації plugin

## Live: генерація зображень

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Область:
  - Перелічує кожен зареєстрований plugin провайдера генерації зображень
  - Завантажує відсутні env vars провайдера з вашого shell входу (`~/.profile`) перед probe
  - Типово використовує live/env API keys раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/profile/model
  - Запускає стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери, що охоплюються:
  - `openai`
  - `google`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише з env

## Live: генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Область:
  - Перевіряє спільний вбудований шлях провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env vars провайдера з вашого shell входу (`~/.profile`) перед probe
  - Типово використовує live/env API keys раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` із введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної ланки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише з env

## Live: генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Область:
  - Перевіряє спільний вбудований шлях провайдера генерації відео
  - Типово використовує безпечний для релізу шлях димового тесту: провайдери без FAL, один запит text-to-video на провайдера, односекундний lobster-prompt і обмеження операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (типово `180000`)
  - Типово пропускає FAL, оскільки затримка черги на боці провайдера може домінувати над часом релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env vars провайдера з вашого shell входу (`~/.profile`) перед probe
  - Типово використовує live/env API keys раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/profile/model
  - Типово запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне buffer-backed введення зображення у спільному sweep
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне buffer-backed введення відео у спільному sweep
  - Поточні провайдери `imageToVideo`, оголошені, але пропущені у спільному sweep:
    - `vydra`, бо вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалений URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс ланку `kling`, яка типово використовує фікстуру віддаленого URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, оголошені, але пропущені у спільному sweep:
    - `alibaba`, `qwen`, `xai`, бо ці шляхи наразі вимагають віддалені референсні URL `http(s)` / MP4
    - `google`, бо поточна спільна ланка Gemini/Veo використовує локальне buffer-backed введення, а цей шлях не приймається у спільному sweep
    - `openai`, бо поточна спільна ланка не гарантує доступ до video inpaint/remix, специфічний для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типового sweep, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції для кожного провайдера в агресивному димовому запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через сховище профілів і ігнорувати перевизначення лише з env

## Live media harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для зображень, музики та відео через один native-entrypoint репозиторію
  - Автоматично завантажує відсутні env vars провайдера з `~/.profile`
  - Типово автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Ранери live-model: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл для profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтуючи ваш локальний каталог config і workspace (а також використовуючи `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери типово використовують менший smoke-cap, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох live Docker lanes.
- Ранери димових тестів контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` і `test:docker:plugins` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-model також bind-монтують лише потрібні домівки автентифікації CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени, не змінюючи auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Димовий тест прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Димовий тест CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Димовий тест harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Димовий тест live Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повний scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Мережева взаємодія Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Міст channel MCP (seeded Gateway + stdio bridge + димовий тест raw Claude notification-frame): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (димовий тест встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)

Docker-ранери live-model також bind-монтують поточний checkout лише для читання і
готують його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але все одно запускає Vitest точно проти ваших локальних source/config.
Етап підготовки пропускає великі локальні кеші та виводи збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
вивід Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машиноспецифічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probes Gateway не запускали
реальні воркери channel Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити покриття gateway
live із цієї Docker-ланки.
`test:docker:openwebui` — це димовий тест сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими HTTP-endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, тому що Docker може потребувати завантаження
image Open WebUI, а сам Open WebUI може потребувати завершення власного cold-start налаштування.
Ця ланка очікує придатний ключ live model, а `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
container, запускає другий container, який піднімає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live event, маршрутизацію outbound send і повідомлення channel +
дозволів у стилі Claude через реальний stdio MCP bridge. Перевірка повідомлень
безпосередньо аналізує raw stdio MCP frames, тому димовий тест перевіряє те, що міст
справді випромінює, а не лише те, що випадково показує певний SDK клієнта.

Ручний ACP plain-language thread smoke (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, підвантажені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли автентифікації CLI в `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому на кшталт `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, які не потребують перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані походять зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для димового тесту Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt перевірки nonce, який використовує димовий тест Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки документації: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайнова регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Tool calling Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис config + примусова auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють прив’язку сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір рішення:** коли в prompt перелічено Skills, чи вибирає агент правильний skill (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує обов’язкові кроки/аргументи?
- **Контракти робочих процесів:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals мають насамперед залишатися детермінованими:

- Runner сценаріїв, який використовує mock-провайдерів для перевірки викликів інструментів + порядку, читання skill-файлів і прив’язки сесії.
- Невеликий набір сценаріїв, зосереджених на skills (використовувати чи уникати, гейтінг, prompt injection).
- Необов’язкові live evals (opt-in, із гейтінгом через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
контракту інтерфейсу. Вони ітерують усі виявлені plugins і запускають набір перевірок
форми та поведінки. Типова unit-ланка `pnpm test` навмисно
пропускає ці файли спільних seam і smoke; запускайте контрактні команди явно,
коли зачіпаєте спільні поверхні channel або provider.

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
- **threading** - Обробка thread ID
- **directory** - API каталогу/списку учасників
- **group-policy** - Застосування group policy

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe статусу channel
- **registry** - Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/визначення автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export або subpath у plugin-sdk
- Після додавання або зміни plugin channel або provider
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI й не потребують реальних API keys.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub provider або захопіть точну трансформацію форми запиту)
- Якщо проблема за своєю природою лише live (rate limits, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу найменшому рівню, який ловить помилку:
  - помилка перетворення/повтору запиту provider → тест прямих моделей
  - помилка конвеєра gateway session/history/tool → live smoke Gateway або безпечний для CI gateway mock-тест
- Захисний механізм обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується з помилкою на некласифікованих target id, щоб нові класи не можна було тихо пропустити.
