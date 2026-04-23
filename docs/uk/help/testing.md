---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T05:53:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e4eabad0d4b899569336aa3d895c7be178455c9ad93927cb627c66d0f3df21d
    source_path: help/testing.md
    workflow: 15
---

# Тестування

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів.

Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює)
- Які команди запускати для поширених сценаріїв роботи (локально, перед push, налагодження)
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-ланка на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Перевірка вартості Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON показує Moonshot/K2.6, а
  транскрипт помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, краще звузити live-тести через змінні середовища allowlist, описані нижче.

## Спеціальні QA-ранери

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і
при ручному запуску з mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і при ручному запуску з mock parity gate, live-ланкою Matrix і
live-ланкою Telegram під керуванням Convex як паралельні jobs. `OpenClaw Release Checks`
запускає ті самі ланки перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    workers Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежену
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати кількість
    workers, або `--concurrency 1` для старішої послідовної ланки.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдачею. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і протокольних mock-ів без заміни ланки `mock-openai`,
    обізнаної про сценарії.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані входи автентифікації QA, які практичні для guest:
    ключі провайдерів через env, шлях до конфігурації live-провайдера QA та `CODEX_HOME`,
    якщо він наявний.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб guest міг записувати назад через
    змонтовану робочу область.
  - Записує звичайний QA-звіт + підсумок, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для операторської QA-роботи.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний onboarding з API-ключем OpenAI, за замовчуванням налаштовує Telegram,
    перевіряє, що вмикання plugin встановлює залежності runtime на вимогу,
    запускає doctor і виконує один локальний хід агента проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму ланку
    інсталяції з пакета з Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugins через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає залежності runtime
    неналаштованих plugins відсутніми, перший налаштований запуск Gateway або doctor встановлює залежності runtime
    кожного вбудованого plugin на вимогу, а другий перезапуск не перевстановлює
    залежності, які вже були активовані.
  - Також встановлює відому старішу базову версію npm, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що
    post-update doctor кандидата відновлює залежності runtime вбудованих channel
    без postinstall-відновлення з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live-ланку QA Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для repo/dev. Пакетні інсталяції OpenClaw не постачають
    `qa-lab`, тож не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують вбудований runner безпосередньо; окремий крок
    встановлення plugin не потрібен.
  - Надає трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, після чого запускає дочірній QA gateway із реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця ланка локально створює тимчасових користувачів.
  - Записує QA-звіт Matrix, підсумок, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live-ланку QA Telegram проти реальної приватної групи, використовуючи токени bot driver і SUT із env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим chat id Telegram.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб перейти на пулові lease.
  - Завершується з ненульовим кодом, якщо будь-який сценарій завершується невдачею. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних bot-ів в одній приватній групі, при цьому bot SUT має надавати ім’я користувача Telegram.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох bot-ів і переконайтеся, що bot driver може спостерігати трафік bot-ів у групі.
  - Записує QA-звіт Telegram, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`.

Live-транспортні ланки поділяють один стандартний контракт, щоб нові транспорти не відхилялися від нього:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці live-транспортного покриття.

| Ланка    | Canary | Згадування-gating | Блок allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | ----------------- | -------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x                 | x              | x                         | x                             | x                          | x               | x                          |              |
| Telegram | x      |                   |                |                           |                               |                            |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивний lease із пулу на базі Convex, надсилає Heartbeat
цього lease під час виконання ланки та звільняє lease під час завершення роботи.

Каркас еталонного проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові змінні середовища:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI за замовчуванням `ci`, інакше `maintainer`)

Необов’язкові змінні середовища:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди maintainer (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для maintainer-ів:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитного виводу у скриптах і утилітах CI.

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
  - Захист активного lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (лише секрет maintainer)
  - Запит: `{ kind?, status?, includePayload?, limit? }`
  - Успіх: `{ status: "ok", credentials, count }`

Форма payload для типу Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` має бути рядком із числовим chat id Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректний payload.

### Додавання каналу до QA

Щоб додати канал до markdown-системи QA, потрібні рівно дві речі:

1. Транспортний адаптер для каналу.
2. Пакет сценаріїв, що перевіряє контракт каналу.

Не додавайте новий top-level корінь команди QA, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` відповідає за спільну механіку хоста:

- корінь команди `openclaw qa`
- запуск і завершення набору
- паралелізм workers
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- псевдоніми сумісності для старіших сценаріїв `qa-channel`

Runner plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інʼєктуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії з опорою на транспорт
- як обробляються скидання або очищення, специфічні для транспорту

Мінімальний поріг прийняття для нового каналу такий:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному seam хоста `qa-lab`.
3. Залишайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючий кореневий command.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; ледаче виконання CLI і runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте узагальнені допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте працездатність наявних псевдонімів сумісності, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, поміщайте її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, залишайте її в цьому runner plugin або harness plugin.
- Якщо сценарію потрібна нова можливість, якою може скористатися більше ніж один канал, додайте узагальнену допоміжну функцію замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для транспорту і явно зазначайте це в контракті сценарію.

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота з каналами має використовувати узагальнені назви допоміжних функцій.
Псевдоніми сумісності існують, щоб уникнути міграції за принципом flag day, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: десять послідовних shard-запусків (`vitest.full-*.config.ts`) поверх наявних scoped-проєктів Vitest
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, які охоплює `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація Gateway, маршрутизація, інструментарій, парсинг, конфігурація)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
- Примітка щодо проєктів:
  - Ненацілений `pnpm test` тепер запускає одинадцять менших shard-конфігурацій (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори.
  - `pnpm test --watch` і далі використовує граф проєктів native root `vitest.config.ts`, оскільки цикл watch із кількома shard непрактичний.
  - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped-ланки, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
  - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped-ланки, коли diff зачіпає лише маршрутизовані файли source/test; редагування config/setup, як і раніше, відкочуються до широкого повторного запуску root project.
  - `pnpm check:changed` — це звичайний розумний локальний gate для вузької роботи. Він класифікує diff у core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні ланки typecheck/lint/test. Зміни публічного Plugin SDK і plugin-contract включають перевірку extension, бо extensions залежать від цих контрактів core. Оновлення версій лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із запобіжником, що відхиляє зміни package поза полем version верхнього рівня.
  - Unit-тести з легкими import із agents, commands, plugins, допоміжних функцій auto-reply, `plugin-sdk` та подібних зон чистих утиліт маршрутизуються через ланку `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних ланках.
  - Вибрані вихідні helper-файли `plugin-sdk` і `commands` також відображають запуски в changed-mode на явні sibling-тести в цих легких ланках, тож редагування helper уникають повторного запуску повного важкого набору для цього каталогу.
  - `auto-reply` тепер має три окремі buckets: top-level helper-и core, top-level integration-тести `reply.*` і піддерево `src/auto-reply/reply/**`. Це тримає найважчу роботу harness reply подалі від дешевих тестів status/chunk/token.
- Примітка про вбудований runner:
  - Коли ви змінюєте входи виявлення message-tool або runtime-контекст Compaction,
    зберігайте обидва рівні покриття.
  - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації/нормалізації.
  - Також підтримуйте здоровими integration-набори вбудованого runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Ці набори перевіряють, що scoped id та поведінка Compaction як і раніше проходять
    через реальні шляхи `run.ts` / `compact.ts`; лише helper-тести не є
    достатньою заміною для цих integration-шляхів.
- Примітка про pool:
  - Базова конфігурація Vitest тепер за замовчуванням використовує `threads`.
  - Спільна конфігурація Vitest також фіксує `isolate: false` і використовує неізольований runner у root projects, e2e та live-конфігураціях.
  - Коренева ланка UI зберігає своє налаштування `jsdom` і optimizer, але тепер теж працює на спільному неізольованому runner.
  - Кожен shard `pnpm test` успадковує ті самі значення `threads` + `isolate: false` за замовчуванням зі спільної конфігурації Vitest.
  - Спільний launcher `scripts/run-vitest.mjs` тепер також за замовчуванням додає `--no-maglev` для дочірніх Node-process Vitest, щоб зменшити churn компіляції V8 під час великих локальних запусків. Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, якщо потрібно порівняти зі стандартною поведінкою V8.
- Примітка про швидку локальну ітерацію:
  - `pnpm changed:lanes` показує, які архітектурні ланки активує diff.
  - Хук pre-commit запускає `pnpm check:changed --staged` після staged formatting/linting, тому коміти лише для core не сплачують вартість тестів extension, якщо не торкаються публічних контрактів для extensions. Коміти лише з release metadata залишаються на цільовій ланці version/config/root-dependency.
  - Якщо точний staged-набір змін уже було перевірено рівнозначними або сильнішими gate, використовуйте `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише повторний запуск changed-scope hook. Staged format/lint однаково запускаються. Згадайте завершені gate у вашому handoff. Це також прийнятно після повторного запуску ізольованого нестабільного hook-збою з підтвердженням у вузькому обсязі.
  - `pnpm test:changed` маршрутизується через scoped-ланки, коли змінені шляхи чисто відображаються на менший набір.
  - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації, лише з вищим обмеженням workers.
  - Автоматичне масштабування локальних workers тепер навмисно консервативне і також зменшує навантаження, коли середнє навантаження хоста вже високе, тож кілька одночасних запусків Vitest за замовчуванням завдають менше шкоди.
  - Базова конфігурація Vitest позначає файли проєктів/конфігурації як `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється підключення тестів.
  - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете одну явну адресу кешу для прямого профілювання.
- Примітка про налагодження продуктивності:
  - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість import, а також вивід розбивки import.
  - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання файлами, зміненими відносно `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований `test:changed` із native root-project шляхом для цього закоміченого diff і виводить wall time плюс max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` вимірює поточне брудне дерево, маршрутизуючи список змінених файлів через `scripts/test-projects.mjs` і root-конфігурацію Vitest.
  - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для накладних витрат запуску та трансформації Vitest/Vite.
  - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для unit-набору з вимкненим паралелізмом файлів.

### Stability (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з diagnostics, увімкненими за замовчуванням
  - Пропускає синтетичні churn-и повідомлень, пам’яті та великих payload Gateway через шлях подій diagnostics
  - Запитує `diagnostics.stability` через WS RPC Gateway
  - Охоплює helper-и збереження stability bundle diagnostics
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS лишаються в межах бюджету тиску, а глибина черг на рівні сесій повертається до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька ланка для подальшої роботи над регресіями stability, а не заміна повного набору Gateway

### E2E (Gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість workers (CI: до 2, локально: за замовчуванням 1).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати консолі I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість workers (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка Gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pairing Node і важча мережна взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: OpenShell backend smoke

- Команда: `pnpm test:e2e:openshell`
- Файл: `test/openshell-sandbox.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку файлової системи remote-canonical через fs bridge sandbox
- Очікування:
  - Лише за явним увімкненням; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний двійковий файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей tool calling, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно нестабільний для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий тестовий home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і приглушує bootstrap-логи Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні startup-логи.
- Ротація API-ключів (специфічно для провайдера): задавайте `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу до stderr, тож довгі виклики провайдерів помітно активні, навіть коли захоплення консолі Vitest працює тихо.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/Gateway транслюються негайно під час live-запусків.
  - Налаштовуйте Heartbeat прямої моделі через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Скористайтеся цією таблицею рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся мережевої взаємодії Gateway / WS-протоколу / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій bot не працює» / збої, специфічні для провайдера / tool calling: запускайте звужений `pnpm test:live`

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка зараз оголошена** підключеним Android Node, і перевірити поведінку контракту команд.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір не встановлює, не запускає й не pair-ить app).
  - Перевірка `node.invoke` Gateway команда за командою для вибраного Android Node.
- Обов’язкова попередня підготовка:
  - Android app уже підключено й спарено з Gateway.
  - App тримається на передньому плані.
  - Для можливостей, які ви очікуєте як успішні, надано дозволи/згоду на capture.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke моделей (ключі профілів)

Live-тести поділені на два рівні, щоб ми могли ізолювати збої:

- «Пряма модель» показує, чи провайдер/модель взагалі може відповісти з цим ключем.
- «Gateway smoke» показує, чи повний конвеєр gateway+agent працює для цієї моделі (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: Пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використовувати `getApiKeyForModel`, щоб вибирати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресії там, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб цей набір справді запускався; інакше він буде пропущений, щоб `pnpm test:live` залишався сфокусованим на Gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запускати сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Перевірки modern/all за замовчуванням мають підібраний ліміт із високим сигналом; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні env-значення
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «конвеєр агента Gateway зламаний»
  - Містить малі ізольовані регресії (приклад: повторне відтворення міркування OpenAI Responses/Codex Responses + потоки tool-call)

### Рівень 2: Gateway + smoke dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти in-process Gateway
  - Створити/пропатчити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі-з-ключами й перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (read probe)
    - необов’язкові додаткові перевірки інструментів (exec+read probe)
    - що шляхи регресій OpenAI (лише tool-call → follow-up) і далі працюють
- Деталі probe (щоб ви могли швидко пояснювати збої):
  - `read` probe: тест записує nonce-файл у workspace і просить агента `read`-нути його та повернути nonce назад.
  - `exec+read` probe: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
- Як вибирати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для сучасного allowlist
  - Або задайте `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Перевірки Gateway modern/all за замовчуванням мають підібраний ліміт із високим сигналом; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого ліміту.
- Як вибирати провайдерів (уникати «все через OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Перевірки tools + image у цьому live-тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (stress-тестування інструментів)
  - image probe запускається, коли модель оголошує підтримку image input
  - Потік (на високому рівні):
    - Тест генерує маленький PNG із “CAT” + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway парсить attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент передає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що саме ви можете тестувати на своїй машині (і точні id `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke CLI backend (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent, використовуючи локальний CLI backend, не торкаючись вашої типової конфігурації.
- Типові smoke-параметри для конкретного backend розміщені у визначенні `cli-backend.ts` extension-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest безпосередньо)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих plugin backend CLI-власника.
- Перевизначення (необов’язкові):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне image-вкладення (шляхи інʼєктуються в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до image-файлів як аргументи CLI замість інʼєкції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати передачею аргументів image, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити flow відновлення.
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

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke CLI-backend усередині Docker-образу репозиторію від непривілейованого користувача `node`.
- Він визначає метадані smoke CLI з extension-власника, а потім встановлює відповідний Linux CLI package (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (типово: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної OAuth-підписки Claude Code через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-backend без збереження env-змінних API-ключа Anthropic. Ця ланка підписки за замовчуванням вимикає перевірки Claude MCP/tool та image, тому що Claude зараз маршрутизує використання сторонніх app через billing додаткового використання замість звичайних лімітів плану підписки.
- Live smoke CLI-backend тепер перевіряє той самий наскрізний flow для Claude, Codex і Gemini: текстовий хід, хід класифікації image, потім виклик MCP-інструмента `cron`, перевірений через Gateway CLI.
- Типовий smoke для Claude також патчить сесію з Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає ранішу нотатку.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний flow прив’язування розмови ACP з live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайне follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє в транскрипт прив’язаної сесії ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP-backend: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Примітки:
  - Ця ланка використовує поверхню Gateway `chat.send` з admin-only синтетичними полями originating-route, щоб тести могли прикріплювати контекст message-channel без імітації зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів plugin `acpx` для вибраного harness-агента ACP.

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

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає smoke ACP bind для всіх підтримуваних live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він використовує `~/.profile`, переносить відповідні матеріали автентифікації CLI в контейнер, встановлює `acpx` у записуваний npm-префікс, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його бракує.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з підключеного профілю доступними для дочірнього harness CLI.

## Live: smoke harness app-server Codex

- Мета: перевірити harness Codex, який належить plugin, через звичайний
  метод Gateway `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `codex/gpt-5.4`
  - надіслати другий хід у ту саму сесію OpenClaw і перевірити, що тред app-server
    може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях команд
    Gateway
  - за бажанням виконати дві перевірки shell із підвищенням прав, переглянуті Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фіктивне вивантаження секрету, яке має бути
    відхилене, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `codex/gpt-5.4`
- Необов’язкова image-probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова MCP/tool-probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова probe Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг пройти, непомітно переключившись назад на PI.
- Автентифікація: `OPENAI_API_KEY` із shell/profile, плюс за бажанням скопійовані
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

Docker-рецепт:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він використовує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm
  префікс, переносить вихідне дерево, а потім запускає лише live-тест Codex-harness.
- Docker за замовчуванням вмикає image-, MCP/tool- і Guardian-probe. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий запуск
  для налагодження.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і конфігурація live-
  тесту, щоб fallback `openai-codex/*` або PI не міг приховати регресію harness
  Codex.

### Рекомендовані live-рецепти

Вузькі явні allowlist-и — найшвидші та найменш нестабільні:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, Gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує міст OAuth Antigravity (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментарію).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація через API key / profile); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний двійковий файл `gemini`; він має власну автентифікацію і може поводитися інакше (streaming/tool support/version skew).

## Live: матриця моделей (що ми охоплюємо)

Немає фіксованого «списку моделей CI» (live — це opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний smoke-набір (tool calling + image)

Це запуск «поширених моделей», який ми очікуємо підтримувати в робочому стані:

- OpenAI (не-Codex): `openai/gpt-5.4` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустити Gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: tool calling (Read + необов’язковий Exec)

Вибирайте щонайменше одну модель на кожне сімейство провайдерів:

- OpenAI: `openai/gpt-5.4` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або останню доступну)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою `tools`, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; tool calling залежить від режиму API)

### Vision: надсилання image (вкладення → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою image до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Aggregators / альтернативні Gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (користувацькі endpoint): `minimax` (cloud/API), а також будь-який сумісний із OpenAI/Anthropic proxy (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «всі моделі». Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині + які ключі доступні.

## Облікові дані (ніколи не комітьте)

Live-тести знаходять облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації на рівні агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає «ключі профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється у staged live home, якщо наявний, але це не основне сховище ключів профілів)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI у тимчасовий тестовий home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` прибираються, щоб probe не торкалися вашого реального workspace хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Live Deepgram (аудіотранскрипція)

- Тест: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Тест: `src/agents/byteplus.live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live медіа workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для image, video і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, polling, завантаженнях або реєстрації plugin

## Live генерація image

- Тест: `src/image-generation/runtime.live.test.ts`
- Команда: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований plugin провайдера генерації image
  - Завантажує відсутні env-змінні провайдера з вашого shell входу (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Проганяє стандартні варіанти генерації image через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані провайдери в покритті:
  - `openai`
  - `google`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Live генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдера з вашого shell входу (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної ланки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Live генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - За замовчуванням використовує безпечний для релізу smoke-шлях: провайдери не-FAL, один запит text-to-video на провайдера, односекундний lobster-prompt і ліміт операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб явно запустити його
  - Завантажує env-змінні провайдера з вашого shell входу (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення image на основі buffer у спільній перевірці
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення video на основі buffer у спільній перевірці
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільній перевірці:
    - `vydra`, тому що вбудований `veo3` підтримує лише текст, а вбудований `kling` вимагає віддалений URL image
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс ланку `kling`, яка за замовчуванням використовує фікстуру з віддаленим URL image
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільній перевірці:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі вимагають віддалені референсні URL `http(s)` / MP4
    - `google`, тому що поточна спільна ланка Gemini/Veo використовує локальне введення на основі buffer, і цей шлях не приймається у спільній перевірці
    - `openai`, тому що поточна спільна ланка не має гарантій доступу до org-specific функцій video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типової перевірки, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції для кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Media live harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори image, music і video через один native-entrypoint репозиторію
  - Автоматично завантажує відсутні env-змінні провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві категорії:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл із ключами профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Live Docker-ранери за замовчуванням використовують менший smoke-ліміт, щоб повна Docker-перевірка залишалася практичною:
  `test:docker:live-models` за замовчуванням має `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням має `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  ви явно хочете більшу вичерпну перевірку.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох live Docker-ланок. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для smoke-ранерів E2E-контейнерів, які перевіряють зібрану app.
- Smoke-ранери контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Live-model Docker-ранери також bind-mount-ять лише потрібні home-каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб зовнішній OAuth CLI міг оновлювати токени без змін у сховищі автентифікації хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding за env-ref плюс Telegram за замовчуванням, перевіряє, що ввімкнення plugin встановлює його runtime-залежності на вимогу, запускає doctor і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову хоста через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Мережна взаємодія Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна регресія reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` піднімає `reasoning.effort` із `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналу MCP (seeded Gateway + stdio міст + smoke сирого notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти Pi bundle MCP (реальний stdio MCP-сервер + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків Cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + псевдонім `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованого plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає малий Docker-образ раннера, один раз збирає і пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій інсталяції Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте перебудову хоста після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вказуйте на наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Під час ітерації звужуйте runtime-залежності вбудованого plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати та повторно використати спільний образ зібраної app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретного набору, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо їх задано. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакування/інсталяції, а не спільний runtime зібраної app.

Live-model Docker-ранери також bind-mount-ять поточний checkout лише для читання та
переносять його у тимчасовий workdir усередині контейнера. Це зберігає runtime-
образ компактним, водночас усе ще запускаючи Vitest точно на ваших локальних source/config.
Крок staging пропускає великі локальні кеші та результати збірки app, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для app каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
машинозалежних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб Gateway live-probe не запускали
реальні workers каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити Gateway
live-покриття з цієї Docker-ланки.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP-endpoint,
запускає закріплений контейнер Open WebUI проти цього Gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через proxy `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
образ Open WebUI, а самому Open WebUI — завершити власне cold-start налаштування.
Ця ланка очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(`~/.profile` за замовчуванням) є основним способом надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON-payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway-
контейнер, запускає другий контейнер, який піднімає `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку live-черги подій, маршрутизацію вихідних надсилань і channel + 
permission-сповіщення у стилі Claude через реальний stdio MCP-міст. Перевірка сповіщень
напряму інспектує сирі stdio MCP-фрейми, тож smoke перевіряє те, що міст
справді випромінює, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує live-
ключа моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe-сервер
усередині контейнера, матеріалізує цей сервер через вбудований runtime Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує live-ключа моделі.
Він запускає seeded Gateway з реальним stdio MCP probe-сервером, виконує ізольований
хід Cron і один дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна ACP smoke-перевірка plain-language thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для workflow регресій/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, використані з `OPENCLAW_PROFILE_FILE`, з тимчасовими каталогами config/workspace і без монтування зовнішньої автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих інсталяцій CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища профілів (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt із перевіркою nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресія (безпечна для CI)

Це регресії «реального конвеєра» без реальних провайдерів:

- Tool calling Gateway (mock OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, запис config + auth примусово забезпечено): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Mock tool-calling через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють wiring сесії та ефекти конфігурації (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічено в prompt, чи вибирає агент правильний Skills (або уникає нерелевантних)?
- **Відповідність:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, що перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval-и мають насамперед залишатися детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на Skills (використати vs уникнути, gating, prompt injection).
- Необов’язкові live eval-и (opt-in, з gating через env) лише після того, як безпечний для CI набір буде готовий.

## Контрактні тести (форма plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований plugin і channel відповідає
своєму інтерфейсному контракту. Вони перебирають усі виявлені plugins і запускають набір
перевірок форми та поведінки. Типова unit-ланка `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди окремо,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язування сесії
- **outbound-payload** - Структура payload вихідного повідомлення
- **inbound** - Обробка вхідного повідомлення
- **actions** - Обробники дій каналу
- **threading** - Обробка id thread
- **directory** - API каталогу/складу
- **group-policy** - Забезпечення групової політики

### Контракти статусу provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма реєстру plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/добір автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або subpath Plugin SDK
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Якщо можливо, додавайте безпечну для CI регресію (mock/stub провайдера або захоплення точної трансформації форми запиту)
- Якщо це за своєю природою лише live-проблема (rate limit, політики автентифікації), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому рівню, який виявляє баг:
  - баг перетворення/повторення запиту провайдера → тест прямих моделей
  - баг конвеєра сесії/історії/інструментів Gateway → live smoke Gateway або безпечний для CI mock-тест Gateway
- Запобіжник обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нове сімейство цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих id цілей, щоб нові класи не можна було тихо пропустити.
