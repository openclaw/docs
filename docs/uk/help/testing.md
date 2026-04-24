---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделей/провайдерів
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-24T06:14:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b825d25da0eb504dfc19e5dcf18b50e8c3bf07e616d0be82d096f3973dbbd785
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
Docker-ранерів. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для поширених сценаріїв (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повна перевірка (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час роботи над окремим збоєм спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-ланка на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Перевірка покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-прогін live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові перевірки через `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі Docker matrix jobs для live-моделей,
    розбиті за провайдером.
  - Для цільових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів у `scripts/ci-hydrate-live-auth.sh`,
    а також у `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    заплановані/релізні виклики.
- Native Codex bind-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-ланку проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення-зображення
    маршрутизуються через native Plugin binding, а не через ACP.
- Moonshot/Kimi перевірка вартості: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6 і що
  транскрипт помічника зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через змінні середовища allowlist, описані нижче.

## QA-специфічні ранери

Ці команди розташовані поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR
і через ручний запуск із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний запуск із mock parity gate, live Matrix lane та
live Telegram lane під керуванням Convex як паралельні jobs. `OpenClaw Release Checks`
запускає ті самі ланки перед погодженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії на основі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    працівниками Gateway. Для `qa-channel` типовою є конкуренція 4 (обмежена
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість працівників, або `--concurrency 1` для старішої послідовної ланки.
  - Завершується з ненульовим кодом, якщо збій трапляється в будь-якому сценарії. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу без заміни сценарно-орієнтованої
    ланки `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, які практичні для гостьової системи:
    ключі провайдера на основі env, шлях до конфігурації QA live provider і `CODEX_HOME`, якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований робочий простір.
  - Записує звичайний QA-звіт + підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, глобально встановлює його в
    Docker, запускає неінтерактивний онбординг OpenAI API key, типово налаштовує Telegram,
    перевіряє, що ввімкнення Plugin встановлює runtime-залежності за потреби,
    запускає doctor і виконує один локальний хід агента проти змоканого OpenAI endpoint.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму
    ланку встановлення з пакета з Discord.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує онбординг
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    Telegram live QA lane з цим встановленим пакетом як SUT Gateway.
  - Типове значення: `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі облікові дані Telegram із env або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway з налаштованим OpenAI,
    а потім вмикає вбудовані channel/Plugins через редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає відсутніми runtime-залежності
    неналаштованих Plugins, що перший налаштований запуск Gateway або doctor встановлює
    runtime-залежності кожного вбудованого Plugin за потреби, і що другий перезапуск не
    перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базову версію, вмикає Telegram перед виконанням
    `openclaw update --tag <candidate>` і перевіряє, що
    `doctor` кандидата після оновлення відновлює runtime-залежності вбудованого channel без
    відновлення postinstall на боці harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає Matrix live QA lane проти одноразового homeserver Tuwunel на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Пакетні встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout репозиторію завантажують вбудований раннер безпосередньо; окремий крок встановлення Plugin не потрібен.
  - Надає три тимчасові користувачі Matrix (`driver`, `sut`, `observer`) і одну приватну кімнату, а потім запускає дочірній QA gateway з реальним Matrix Plugin як транспортом SUT.
  - Типово використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки ця ланка локально надає одноразових користувачів.
  - Записує Matrix QA report, summary, observed-events artifact і об’єднаний журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає Telegram live QA lane проти реальної приватної групи, використовуючи токени ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. Типово використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути спільні оренди.
  - Завершується з ненульовим кодом, якщо збій трапляється в будь-якому сценарії. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має надавати Telegram username.
  - Для стабільного спостереження бот-за-ботом увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує Telegram QA report, summary і observed-messages artifact у `.artifacts/qa-e2e/...`. Сценарії відповіді включають RTT від запиту надсилання driver до спостережуваної відповіді SUT.

Live transport lanes використовують один стандартний контракт, щоб нові транспорти не дрейфували:

`qa-channel` залишається широким синтетичним QA-набором і не є частиною матриці покриття live transport.

| Ланка    | Canary | Mention gating | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Команда help |
| -------- | ------ | -------------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x               | x              | x                | x                | x                    |              |
| Telegram | x      |                |                 |                 |                |                  |                  |                      | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки ланка виконується, і звільняє оренду під час завершення роботи.

Еталонний каркас проєкту Convex:

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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL-адреси Convex лише для локальної розробки.

У звичайному режимі `OPENCLAW_QA_CONVEX_SITE_URL` має використовувати `https://`.

Команди адміністрування для maintainers (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для maintainers:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машиночитного виводу в скриптах і утилітах CI.

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
- `groupId` має бути рядком із числовим Telegram chat id.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання channel до QA

Додавання channel до markdown-системи QA потребує рівно двох речей:

1. Транспортного адаптера для channel.
2. Пакета сценаріїв, який перевіряє контракт channel.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` керує спільною механікою хоста:

- коренем команд `openclaw qa`
- запуском і завершенням набору
- конкуренцією працівників
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Runner Plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляється специфічний для транспорту reset або cleanup

Мінімальний поріг впровадження для нового channel:

1. Залишити `qa-lab` власником спільного кореня `qa`.
2. Реалізувати transport runner на спільному хостовому seam `qa-lab`.
3. Зберігати специфічну для транспорту механіку всередині runner Plugin або harness channel.
4. Монтувати runner як `openclaw qa <runner>`, а не реєструвати конкуруючу кореневу команду.
   Runner Plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; ліниве виконання CLI і runner має залишатися за окремими entrypoint.
5. Створювати або адаптувати markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовувати загальні хелпери сценаріїв для нових сценаріїв.
7. Зберігати наявні alias сумісності працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення є суворим:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту channel, залишайте її в цьому runner Plugin або harness Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один channel, додайте загальний helper замість branch, специфічного для channel, у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту і явно вказуйте це в контракті сценарію.

Бажані назви загальних helper для нових сценаріїв:

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

Alias сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота над channel має використовувати загальні назви helper.
Alias сумісності існують, щоб уникнути міграції одним днем, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Думайте про набори як про «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: нецільові запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати multi-project шарди в конфігурації на рівні окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і внесені до allowlist node-тести `ui`, охоплені `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, tooling, parsing, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
    <AccordionGroup>
    <Accordion title="Проєкти, шарди та scoped lanes"> - Нецільовий `pnpm test` запускає дванадцять менших shard-конфігурацій (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного великого native root-project process. Це зменшує піковий RSS на завантажених машинах і запобігає тому, щоб робота auto-reply/extension витісняла непов’язані набори. - `pnpm test --watch` усе ще використовує native root `vitest.config.ts` project graph, оскільки multi-shard цикл watch непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project. - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable source/test файлів; редагування config/setup все ще повертаються до широкого повторного запуску root project. - `pnpm check:changed` — це звичайна розумна локальна перевірка для вузької роботи. Вона класифікує diff на core, core tests, extensions, extension tests, apps, docs, release metadata і tooling, а потім запускає відповідні ланки typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають один прохід валідації extension, оскільки extensions залежать від цих core-контрактів. Підвищення версії лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем версії верхнього рівня. - Легкі щодо імпорту unit-тести з agents, commands, plugins, auto-reply helpers, `plugin-sdk` та подібних чистих утилітних областей маршрутизуються через ланку `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; файли зі станом/важким runtime залишаються на наявних ланках. - Вибрані файли вихідного коду helper у `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling-тестами в цих легких ланках, тож зміни helper уникають повторного запуску повного важкого набору для цього каталогу. - `auto-reply` має три окремі кошики: helper верхнього рівня core, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це утримує найважчу роботу harness reply подалі від дешевих тестів status/chunk/token.
    </Accordion>

      <Accordion title="Покриття embedded runner">
        - Коли ви змінюєте вхідні дані виявлення message-tool або runtime-контекст compaction,
          зберігайте обидва рівні покриття.
        - Додавайте цільові регресії helper для чистих меж маршрутизації та нормалізації.
        - Підтримуйте здоровий стан integration-наборів embedded runner:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці набори перевіряють, що scoped id і поведінка compaction, як і раніше, проходять
          через реальні шляхи `run.ts` / `compact.ts`; helper-only тести не є
          достатньою заміною для цих integration-шляхів.
      </Accordion>

      <Accordion title="Типові значення Vitest pool та ізоляції">
        - Базова конфігурація Vitest типово використовує `threads`.
        - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
          неізольований runner у root projects, конфігураціях e2e та live.
        - Коренева ланка UI зберігає свій `jsdom` setup і optimizer, але теж працює на
          спільному неізольованому runner.
        - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
          зі спільної конфігурації Vitest.
        - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
          щоб зменшити churn компіляції V8 під час великих локальних запусків.
          Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні ланки запускає diff.
        - Pre-commit hook виконує лише форматування. Він повторно додає відформатовані файли до stage і
          не запускає lint, typecheck або тести.
        - Явно запускайте `pnpm check:changed` перед передачею або push, коли
          вам потрібна розумна локальна перевірка. Зміни в публічному Plugin SDK і plugin-contract
          включають один прохід валідації extension.
        - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи
          чітко відповідають меншому набору.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
          лише з вищою межею кількості працівників.
        - Автомасштабування локальних працівників навмисно є консервативним і зменшується,
          коли середнє навантаження хоста вже високе, тож кілька одночасних
          запусків Vitest за замовчуванням завдають менше шкоди.
        - Базова конфігурація Vitest позначає файли projects/config як
          `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється
          зв’язування тестів.
        - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
          хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
          одну явну локацію кешу для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження продуктивності">
        - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту, а також
          вивід розбивки імпорту.
        - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання
          файлами, зміненими від `origin/main`.
        - Коли один гарячий тест усе ще витрачає більшість часу на імпорти під час запуску,
          тримайте важкі залежності за вузьким локальним seam `*.runtime.ts` і
          мокуйте цей seam безпосередньо, а не deep-import runtime helper лише
          для того, щоб передати їх через `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
          `test:changed` із native root-project path для цього закоміченого diff і виводить wall time та macOS max RSS.
        - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
          брудного дерева, маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
        - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для
          накладних витрат запуску і трансформації Vitest/Vite.
        - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
          unit-набору з вимкненим паралелізмом файлів.
      </Accordion>
    </AccordionGroup>

### Stability (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один працівник
- Обсяг:
  - Запускає реальний loopback Gateway з діагностикою, увімкненою за замовчуванням
  - Проганяє синтетичне навантаження повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запити до `diagnostics.stability` через Gateway WS RPC
  - Охоплює helper збереження набору діагностики стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS лишаються в межах бюджету тиску, а глибина черг для кожної сесії повертається до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька ланка для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих Plugins у `extensions/`
- Типові параметри runtime:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість працівників (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість працівників (не більше 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у console.
- Обсяг:
  - End-to-end поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing вузлів і складніша мережева взаємодія
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke для backend OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + виконання через SSH
  - Перевіряє поведінку файлової системи в remote-canonical режимі через sandbox fs bridge
- Очікування:
  - Лише за запитом; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує test gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб указати нестандартний CLI binary або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих Plugins у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи цей провайдер/модель справді працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, відмови)
  - Коштує грошей / витрачає rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API key.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють матеріали config/auth у тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення про `~/.profile` і вимикає журнали bootstrap gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову бачити повні журнали запуску.
- Ротація API key (залежно від провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тож довгі виклики провайдерів помітно активні, навіть коли захоплення console у Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення console у Vitest, щоб рядки прогресу провайдера/gateway відразу передавалися під час live-запусків.
  - Налаштовуйте Heartbeat для direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat для gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо ви багато що змінили)
- Торкаєтесь мережевої взаємодії gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої, специфічні для провайдера / виклик інструментів: запускайте звужений `pnpm test:live`

## Live-тести (із доступом до мережі)

Для live-матриці моделей, smoke-тестів CLI backend, smoke-тестів ACP, harness
Codex app-server і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Testing — live suites](/uk/help/testing-live).

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділяються на дві групи:

- Ранери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл профілю-ключа всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker-ранери live за замовчуванням мають меншу межу smoke, щоб повний Docker-прогін залишався практичним:
  `test:docker:live-models` типово використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` типово використовує `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env vars, коли
  вам явно потрібне більше, вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох Docker-ланок live. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для smoke-ранерів E2E у контейнерах, які перевіряють зібраний застосунок.
- Container smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють шляхи інтеграції вищого рівня.

Docker-ранери live-моделей також bind-mount лише потрібні CLI auth home (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх до home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без змін у host auth store:

- Direct models: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke для ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke для CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke для harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke для онбордингу/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює активовані runtime deps Plugin, і виконує один змоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть перебудову на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або змініть channel через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke для глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих image-провайдерів замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збірку на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer Docker smoke: `bash scripts/test-install-sh-docker.sh` використовує спільний npm cache для своїх контейнерів root, update і direct-npm. Smoke оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до tarball кандидата. Перевірки installer без root зберігають ізольований npm cache, щоб записи кешу, створені root, не маскували поведінку локального встановлення користувача. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати root/update/direct-npm cache між локальними повторними запусками.
- CI для Install Smoke пропускає дубльований direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна регресія reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що необроблені деталі з’являються в журналах Gateway.
- Міст каналу MCP (ініціалізований Gateway + stdio bridge + необроблений smoke фрейма сповіщення Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у Pi bundle (реальний stdio MCP server + smoke allow/deny для вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP для Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + alias `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих reload config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps вбудованих Plugins: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий образ Docker runner, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime deps вбудованих Plugins під час ітерації, вимикаючи непов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний образ built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення образів, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо їх задано. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакета/встановлення, а не спільний runtime зібраного застосунку.

Docker-ранери live-моделей також bind-mount поточний checkout у режимі лише для читання та
розміщують його в тимчасовому workdir усередині контейнера. Це зберігає runtime-образ
легким, але водночас дозволяє запускати Vitest точно проти ваших локальних source/config.
Крок staging пропускає великі локальні кеші та вихідні дані збірки застосунку, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунку каталоги
`.build` або вивід Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-перевірки gateway не запускали
реальні channel workers Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тому також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття gateway із цієї Docker-ланки.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими HTTP-endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний запит чату через proxy Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
образ Open WebUI, а самому Open WebUI — завершити власне cold-start налаштування.
Ця ланка очікує придатний ключ live-моделі, і `OPENCLAW_PROFILE_FILE`
(типово `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає ініціалізований контейнер Gateway,
запускає другий контейнер, який створює `openclaw mcp serve`, а потім
перевіряє виявлення маршрутизованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення у стилі Claude про channel +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо аналізує необроблені stdio MCP frame, тож smoke-перевірка валідовує те, що
міст фактично випромінює, а не лише те, що випадково показує конкретний client SDK.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
ключа live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований runtime Pi bundle
MCP, виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує ключа live-моделі.
Він запускає ініціалізований Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручна smoke-перевірка ACP plain-language thread (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для сценаріїв регресії/налагодження. Він може знову знадобитися для валідації маршрутизації ACP thread, тому не видаляйте його.

Корисні env vars:

- `OPENCLAW_CONFIG_DIR=...` (типово: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (типово: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (типово: `~/.profile`) монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env vars, отримані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх mount для CLI auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (типово: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли CLI auth у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед початком тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібна перебудова
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані походять зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібна перевірка заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайнова регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (змоканий OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + примусово застосовує auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Evals надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «evals надійності агентів»:

- Моканий виклик інструментів через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють wiring сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли Skills перелічені в prompt, чи вибирає агент правильний Skills (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, що перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні evals насамперед мають залишатися детермінованими:

- Ранер сценаріїв із mock-провайдерами для перевірки викликів інструментів + їхнього порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на Skills (використати чи уникнути, gating, prompt injection).
- Необов’язкові live-evals (opt-in, із gating через env) лише після того, як безпечний для CI набір буде реалізовано.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
інтерфейсному контракту. Вони проходять по всіх виявлених Plugins і запускають набір
перевірок форми та поведінки. Типова unit-ланка `pnpm test` навмисно
пропускає ці спільні seam- та smoke-файли; запускайте контрактні команди явно,
коли торкаєтеся спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма Plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка Thread ID
- **directory** - API каталогу/списку учасників
- **group-policy** - Застосування групової політики

### Контракти status провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки status channel
- **registry** - Форма registry Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/підбір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API key.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub провайдер або захопіть точну трансформацію форми запиту)
- Якщо це властиво лише live-середовищу (rate limit, політики auth), залишайте live-тест вузьким і opt-in через env vars
- Віддавайте перевагу найменшому шару, який виявляє баг:
  - баг конвертації/повторення запиту провайдера → direct models test
  - баг сесії/history/tool pipeline у gateway → smoke для gateway live або безпечний для CI gateway mock test
- Захист обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується з помилкою для некласифікованих target id, щоб нові класи не можна було пропустити непомітно.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [CI](/uk/ci)
