---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для помилок моделей/провайдерів
    - Налагодження поведінки Gateway + агентів
summary: 'Набір для тестування: набори unit/e2e/live, Docker-раннери та що саме охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-24T16:12:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d4f837faddc458509702b2a315d71d35740c01810ca76e40d652df54b09f38e
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-раннерів. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв роботи (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем із моделями/провайдерами.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлення на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над окремим збоєм спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на основі Docker: `pnpm qa:lab:up`
- QA-lane на основі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Gate покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихо націлитися на один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker sweep live-моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку в стилі читання файла.
    Моделі, чиї метадані оголошують вхід `image`, також виконують невеликий хід із зображенням.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний live/E2E workflow з
    `include_live_suites: true`, що включає окремі matrix jobs Docker live-моделей,
    розшардовані за провайдером.
  - Для цільових повторних запусків у CI запустіть `OpenClaw Live And E2E Checks (Reusable)` з
    `include_live_suites: true` і `live_models_only: true`.
  - Додайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`
    плюс `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    scheduled/release викликачів.
- Smoke native Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live-lane проти шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, а потім перевіряє, що звичайна відповідь і вкладення-зображення
    проходять через native binding плагіна, а не через ACP.
- Smoke вартості Moonshot/Kimi: коли встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє про Moonshot/K2.6 і що
  transcript асистента зберігає нормалізоване `usage.cost`.

Порада: коли потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env-змінні allowlist, описані нижче.

## QA-специфічні раннери

Ці команди використовуються поруч з основними наборами тестів, коли вам потрібен реалізм QA-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається на відповідних PR і
через ручний запуск із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний запуск із mock parity gate, live Matrix lane та
live Telegram lane під керуванням Convex як паралельними job. `OpenClaw Release Checks`
запускає ті самі lane перед погодженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на основі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker Gateway. `qa-channel` за замовчуванням використовує concurrency 4 (обмежено
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>` для налаштування
    кількості worker, або `--concurrency 1` для старішого послідовного lane.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдера `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на основі AIMock для експериментального
    покриття фікстурами та mock протоколу, не замінюючи сценарно-орієнтований
    lane `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині одноразової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, практичні для гостьової системи:
    ключі провайдера на основі env, шлях конфігурації live-провайдера QA і `CODEX_HOME`,
    якщо він присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт + підсумок, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на основі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball з поточного checkout, встановлює його глобально в
    Docker, виконує неінтерактивний onboarding з API-ключем OpenAI, налаштовує Telegram
    за замовчуванням, перевіряє, що ввімкнення Plugin встановлює runtime-залежності за потреби,
    запускає doctor і виконує один локальний хід агента проти mock endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити той самий
    lane пакетного встановлення з Discord.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding
    встановленого пакета, налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA-lane з цим встановленим пакетом як Gateway SUT.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для CI/автоматизації релізів установіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` плюс
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і рольовий секрет Convex присутні в CI,
    Docker-обгортка автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цього lane.
  - GitHub Actions надає цей lane як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Він не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду CI-облікових даних Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає bundled channel/Plugins через
    редагування config.
  - Перевіряє, що виявлення налаштування залишає відсутніми runtime-залежності
    неналаштованих plugin, що перший налаштований запуск Gateway або doctor
    встановлює runtime-залежності кожного bundled plugin за потреби, і що другий перезапуск
    не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm-базову версію, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що
    doctor після оновлення в кандидаті відновлює runtime-залежності bundled channel
    без postinstall-відновлення з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-lane Matrix проти одноразового homeserver Tuwunel на основі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Пакетні встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout репозиторію завантажують bundled runner безпосередньо; окремий крок встановлення plugin не потрібен.
  - Підготовлює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, після чого запускає дочірній процес QA gateway з реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки lane локально створює одноразових користувачів.
  - Записує звіт Matrix QA, підсумок, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA-lane Telegram проти реальної приватної групи з використанням токенів ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим ідентифікатором чату Telegram.
  - Підтримує `--credential-source convex` для спільних пулінгових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути pooled leases.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати за трафіком ботів у групі.
  - Записує звіт Telegram QA, підсумок і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостереженої відповіді SUT.

Live transport lane мають спільний стандартний контракт, щоб нові транспорти не розходилися:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live transport.

| Lane     | Канарейка | Контроль згадувань | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальше повідомлення в потоці | Ізоляція потоку | Спостереження за реакціями | Команда довідки |
| -------- | --------- | ------------------ | -------------------- | ------------------------- | ----------------------------- | ------------------------------ | --------------- | -------------------------- | --------------- |
| Matrix   | x         | x                  | x                    | x                         | x                             | x                              | x               | x                          |                 |
| Telegram | x         |                    |                      |                           |                               |                                |                 |                            | x               |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на основі Convex, надсилає Heartbeat цієї
оренди, поки lane виконується, і звільняє оренду під час завершення роботи.

Довідкова структура проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Типове значення env: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI за замовчуванням `ci`, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback `http://` URL Convex лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди мейнтейнера (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-хелпери для мейнтейнерів:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `--json` для машинозчитуваного виводу в скриптах і утилітах CI.

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
- `groupId` має бути рядком із числовим ідентифікатором чату Telegram.
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання channel до QA

Додавання channel до markdown-системи QA вимагає рівно двох речей:

1. Транспортного адаптера для channel.
2. Набору сценаріїв, що перевіряє контракт channel.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
керувати цим потоком.

`qa-lab` керує спільною механікою хоста:

- кореневий простір команд `openclaw qa`
- запуск і завершення набору
- concurrency worker
- запис артефактів
- генерація звітів
- виконання сценаріїв
- aliases сумісності для старіших сценаріїв `qa-channel`

Runner-плагіни керують транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcript і нормалізований стан транспорту
- як виконуються дії на основі транспорту
- як обробляється скидання або очищення, специфічні для транспорту

Мінімальна планка впровадження для нового channel:

1. Залишити `qa-lab` власником спільного кореня `qa`.
2. Реалізувати транспортний runner на шві спільного хоста `qa-lab`.
3. Тримати транспортно-специфічну механіку всередині runner-плагіна або harness channel.
4. Монтувати runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner-плагіни повинні оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Тримайте `runtime-api.ts` легким; лінивий CLI і виконання runner мають залишатися за окремими entrypoint.
5. Створювати або адаптувати markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовувати узагальнені helper для нових сценаріїв.
7. Зберігати робочими наявні aliases сумісності, якщо в репозиторії не виконується навмисна міграція.

Правило прийняття рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, залишайте її в цьому runner-плагіні або harness плагіна.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один channel, додайте узагальнений helper замість channel-специфічної гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій транспортно-специфічним і явно зазначайте це в контракті сценарію.

Бажані назви узагальнених helper для нових сценаріїв:

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

Нова робота з channel повинна використовувати узагальнені назви helper.
Aliases сумісності існують, щоб уникнути міграції одним днем, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростання реалізму» (і зростання нестабільності/вартості):

### Unit / integration (типово)

- Команда: `pnpm test`
- Конфігурація: ненаправлені запуски використовують набір shard `vitest.full-*.config.ts` і можуть розгортати multi-project shard у конфігурації per-project для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, що покриваються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Інтеграційні тести в межах процесу (автентифікація gateway, маршрутизація, інструментарій, парсинг, config)
  - Детерміновані регресії для відомих помилок
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
    <AccordionGroup>
    <Accordion title="Проєкти, shard і scoped lane"> - Ненаправлений `pnpm test` запускає дванадцять менших конфігурацій shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу native root-project. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори. - `pnpm test --watch` усе ще використовує native граф проєктів root `vitest.config.ts`, оскільки цикл watch із multi-shard непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lane, тому `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project. - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lane, коли diff зачіпає лише source/test-файли, які можна маршрутизувати; редагування config/setup все ще повертаються до широкого повторного запуску root-project. - `pnpm check:changed` — звичайний розумний локальний gate для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, метадані релізу та tooling, а потім запускає відповідні lane typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають один прохід валідації extension, тому що extensions залежать від цих контрактів core. Підвищення версії лише в метаданих релізу запускають цільові перевірки version/config/root-dependency замість повного набору, із guard, що відхиляє зміни пакета поза полем версії верхнього рівня. - Легкі щодо імпорту unit-тести з agents, commands, plugins, helper auto-reply, `plugin-sdk` і подібних чистих утилітних зон маршрутизуються через lane `unit-fast`, який пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних lane. - Вибрані helper source у `plugin-sdk` і `commands` також відображають changed-mode запуски на явні sibling-тести в цих легких lane, тож зміни helper уникають повторного запуску повного важкого набору для цього каталогу. - `auto-reply` має три виділені buckets: helper core верхнього рівня, інтеграційні тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це не дає найважчій роботі harness reply потрапляти на дешеві тести status/chunk/token.
    </Accordion>

      <Accordion title="Покриття embedded runner">
        - Коли ви змінюєте вхідні дані виявлення message-tool або runtime
          context Compaction, зберігайте обидва рівні покриття.
        - Додавайте сфокусовані helper-регресії для чистих меж
          маршрутизації та нормалізації.
        - Підтримуйте інтеграційні набори embedded runner у здоровому стані:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці набори перевіряють, що scoped id і поведінка Compaction, як і раніше, проходять
          через реальні шляхи `run.ts` / `compact.ts`; тести лише для helper
          не є достатньою заміною цим інтеграційним шляхам.
      </Accordion>

      <Accordion title="Типові налаштування pool та ізоляції Vitest">
        - Базова конфігурація Vitest типово використовує `threads`.
        - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
          неізольований runner у root project, а також у конфігураціях e2e і live.
        - Lane root UI зберігає своє налаштування `jsdom` і optimizer, але теж працює на
          спільному неізольованому runner.
        - Кожен shard `pnpm test` успадковує ті самі типові значення `threads` + `isolate: false`
          зі спільної конфігурації Vitest.
        - `scripts/run-vitest.mjs` типово додає `--no-maglev` для дочірніх Node-процесів Vitest,
          щоб зменшити churn компіляції V8 під час великих локальних запусків.
          Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні lane запускає diff.
        - Хук pre-commit відповідає лише за форматування. Він повторно додає відформатовані файли до stage і
          не запускає lint, typecheck або тести.
        - Явно запускайте `pnpm check:changed` перед передачею роботи або push, коли вам
          потрібен розумний локальний gate. Зміни в публічному Plugin SDK і plugin-contract
          включають один прохід валідації extension.
        - `pnpm test:changed` маршрутизує через scoped lane, коли змінені шляхи
          однозначно відповідають меншому набору.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
          лише з вищою межею worker.
        - Автомасштабування локальних worker навмисно консервативне і зменшує навантаження,
          коли середнє навантаження хоста вже високе, тому кілька одночасних
          запусків Vitest типово завдають менше шкоди.
        - Базова конфігурація Vitest позначає файли projects/config як
          `forceRerunTriggers`, щоб повторні запуски в changed-mode залишалися коректними, коли змінюється зв’язування тестів.
        - Конфігурація зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на
          підтримуваних хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо
          хочете один явний шлях кешу для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження perf">
        - `pnpm test:perf:imports` вмикає звітування Vitest про тривалість імпорту плюс
          вивід import-breakdown.
        - `pnpm test:perf:imports:changed` обмежує той самий режим профілювання
          файлами, зміненими від `origin/main`.
        - Коли один гарячий тест усе ще витрачає більшість часу на стартові імпорти,
          тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
          мокуйте цей шов безпосередньо замість глибокого імпорту runtime-helper лише
          для того, щоб передати їх через `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
          `test:changed` із native шляхом root-project для цього закоміченого
          diff і виводить wall time плюс максимальний RSS на macOS.
        - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
          брудного дерева, маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і root-конфігурацію Vitest.
        - `pnpm test:perf:profile:main` записує профіль CPU головного потоку для
          накладних витрат запуску та трансформації Vitest/Vite.
        - `pnpm test:perf:profile:runner` записує профілі CPU+heap runner для
          unit-набору з вимкненим файловим паралелізмом.
      </Accordion>
    </AccordionGroup>

### Стабільність (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з diagnostics, увімкненими за замовчуванням
  - Проганяє синтетичне churn повідомлень gateway, пам’яті та великих payload через діагностичний шлях подій
  - Виконує запити до `diagnostics.stability` через WS RPC Gateway
  - Покриває helper збереження пакета діагностичної стабільності
  - Перевіряє, що recorder залишається обмеженим, синтетичні зразки RSS залишаються в межах бюджету тиску, а глибини черг на рівні сесії повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузький lane для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести bundled-plugin у `extensions/`
- Типові параметри runtime:
  - Використовує `threads` у Vitest з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивних worker (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в тихому режимі, щоб зменшити накладні витрати на I/O консолі.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість worker (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - Наскрізна поведінка gateway з кількома інстансами
  - Поверхні WebSocket/HTTP, pairing Node і важча мережева взаємодія
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє backend OpenShell в OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку файлової системи remote-canonical через міст fs sandbox
- Очікування:
  - Лише opt-in; не входить до типового запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працюючого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, після чого знищує тестові gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого набору e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб указати нестандартний бінарний файл CLI або wrapper-скрипт

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести bundled-plugin у `extensions/`
- Типово: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику інструментів, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є стабільним для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски читають `~/.profile`, щоб підхопити відсутні API-ключі.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють config/auth-матеріали до тимчасового тестового home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли вам навмисно потрібно, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: зберігає вивід прогресу `[live] ...`, але приглушує додаткове повідомлення `~/.profile` і вимикає журнали bootstrap Gateway/шум Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні стартові журнали.
- Ротація API-ключів (специфічно для провайдера): установіть `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад, `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або використовуйте перевизначення per-live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спроби при відповідях rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер виводять рядки прогресу в stderr, тому довгі виклики провайдерів видно як активні, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тому рядки прогресу провайдера/Gateway транслюються негайно під час live-запусків.
  - Налаштовуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запустіть `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни в мережевій взаємодії gateway / WS protocol / pairing: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / специфічних збоїв провайдера / виклику інструментів: запускайте звужений `pnpm test:live`

## Live-тести (що торкаються мережі)

Для live-матриці моделей, smoke backend CLI, smoke ACP, harness app-server Codex
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також обробки облікових даних для live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Docker-раннери (необов’язкові перевірки «працює в Linux»)

Ці Docker-раннери поділяються на дві категорії:

- Раннери live-моделей: `test:docker:live-models` і `test:docker:live-gateway` запускають лише свій відповідний live-файл із ключем профілю всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і читають `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint: `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker-раннери live за замовчуванням мають меншу межу smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше вичерпне сканування.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для двох Docker lane live. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для smoke-раннерів контейнерів E2E, що перевіряють зібраний застосунок.
- Smoke-раннери контейнерів: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` запускають один або більше реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-раннери live-моделей також bind-mount лише потрібні auth-home CLI (або всі підтримувані, коли запуск не звужено), а потім копіюють їх у home контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни auth-store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер onboarding (TTY, повне scaffold): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agent для npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding із посиланням на env плюс Telegram за замовчуванням, перевіряє, що doctor відновлює runtime-залежності активованого plugin, і виконує один mock-хід агента OpenAI. Щоб повторно використати попередньо зібраний tarball, установіть `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, щоб пропустити перебудову на хості — `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, а щоб змінити channel — `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає bundled image-провайдерів замість зависання. Щоб повторно використати попередньо зібраний tarball, установіть `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, щоб пропустити збірку на хості — `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Docker smoke інсталятора: `bash scripts/test-install-sh-docker.sh` використовує спільний npm cache для контейнерів root, update і direct-npm. Smoke оновлення за замовчуванням використовує npm `latest` як стабільну базову версію перед оновленням до tarball-кандидата. Перевірки інсталятора без root зберігають ізольований npm cache, щоб записи cache, якими володіє root, не маскували поведінку локального встановлення користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати cache root/update/direct-npm між локальними повторними запусками.
- Install Smoke у CI пропускає дубльоване direct-npm global update через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Мережева взаємодія Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Регресія мінімального reasoning для `web_search` в OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає mock-сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що сирі деталі з’являються в журналах Gateway.
- Міст channel MCP (seeded Gateway + stdio bridge + raw smoke notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у Pi bundle (реальний stdio MCP-сервер + smoke allow/deny для вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke встановлення + alias `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності bundled plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий runner image Docker, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій встановлення Linux. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть перебудову на хості після свіжої локальної збірки через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний агрегат Docker попередньо пакує цей tarball один раз, а потім розшардовує перевірки bundled channel на незалежні lane; використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю channel під час прямого запуску bundled lane.
- Під час ітерацій звужуйте перевірки runtime-залежностей bundled plugin, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати та повторно використати спільний image built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Перевизначення image для конкретних наборів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе ще мають пріоритет, якщо встановлені. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` указує на віддалений спільний image, скрипти завантажують його, якщо він ще не доступний локально. Docker-тести QR і інсталятора зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакета/встановлення, а не runtime спільного built-app.

Docker-раннери live-моделей також bind-mount поточний checkout лише для читання і
розгортають його в тимчасовий workdir усередині контейнера. Це зберігає runtime
image компактним, але водночас дозволяє запускати Vitest точно на вашому локальному source/config.
Крок розгортання пропускає великі локальні cache і результати збірки застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для app каталоги `.build` або
виводу Gradle, щоб Docker live-запуски не витрачали хвилини на копіювання
артефактів, специфічних для машини.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні worker channel Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли потрібно звузити або виключити live-покриття
Gateway з цього Docker lane.
`test:docker:openwebui` — це smoke-перевірка сумісності вищого рівня: вона запускає
контейнер gateway OpenClaw з увімкненими HTTP-endpoint, сумісними з OpenAI,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` надає `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
image Open WebUI, а самому Open WebUI може знадобитися завершити власне холодне стартове налаштування.
Цей lane очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(за замовчуванням `~/.profile`) є основним способом надати його в Docker-запусках.
Успішні запуски виводять невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає seeded Gateway
контейнер, запускає другий контейнер, який піднімає `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення conversation, читання transcript, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання та сповіщення channel +
permission у стилі Claude через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо аналізує сирі кадри stdio MCP, тож smoke перевіряє те, що
міст справді видає, а не лише те, що випадково показує конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує ключа live-моделі.
Він збирає Docker image репозиторію, запускає реальний stdio MCP probe-сервер
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP Pi bundle,
виконує інструмент, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх відфільтровують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа live-моделі.
Він запускає seeded Gateway з реальним stdio MCP probe-сервером, виконує
ізольований хід Cron і одноразовий дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не для CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для робочих процесів регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації thread в ACP, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і зчитується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, зчитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування auth зовнішнього CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Зовнішні каталоги/файли auth CLI під `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Типові каталоги: `.minimax`
  - Типові файли: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Для ручного перевизначення використовуйте `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб відфільтрувати провайдерів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків без перебудови
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані надходять зі сховища профілю (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway надає для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка коректності документації

Запускайте перевірки docs після редагування документації: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Офлайн-регресії (безпечні для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик інструментів Gateway (mock OpenAI, реальний gateway + цикл агента): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, записує config + примусово застосовану auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агентів (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агентів»:

- Mock-виклик інструментів через реальний gateway + цикл агента (`src/gateway/gateway.test.ts`).
- Наскрізні потоки майстра, які перевіряють wiring сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого все ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Прийняття рішень:** коли в prompt перелічено Skills, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Відповідність вимогам:** чи читає агент `SKILL.md` перед використанням і чи виконує обов’язкові кроки/аргументи?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок інструментів, перенесення історії сесії та межі sandbox.

Майбутні eval слід насамперед залишати детермінованими:

- Runner сценаріїв із mock-провайдерами для перевірки викликів інструментів + їх порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на Skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live eval (opt-in, керовані через env) — лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
контракту інтерфейсу. Вони ітеруються по всіх виявлених plugin і запускають набір
перевірок форми та поведінки. Типовий unit-lane `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
коли змінюєте спільні поверхні channel або провайдера.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти провайдерів: `pnpm test:contracts:plugins`

### Контракти channel

Розташовані в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт майстра налаштування
- **session-binding** - Поведінка прив’язки сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID thread
- **directory** - API directory/roster
- **group-policy** - Застосування group policy

### Контракти статусу провайдера

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Перевірки статусу channel
- **registry** - Форма реєстру Plugin

### Контракти провайдерів

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/добір auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime провайдера
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни експортів або subpath у plugin-sdk
- Після додавання або зміни channel чи plugin провайдера
- Після рефакторингу реєстрації plugin або виявлення

Контрактні тести запускаються в CI і не потребують реальних API-ключів.

## Додавання регресій (настанови)

Коли ви виправляєте проблему провайдера/моделі, виявлену в live:

- Додайте безпечну для CI регресію, якщо це можливо (mock/stub провайдера або фіксація точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому шару, який виявляє помилку:
  - помилка конвертації/відтворення запиту провайдера → тест прямих моделей
  - помилка в pipeline сесії/історії/інструментів gateway → live smoke Gateway або безпечний для CI mock-тест gateway
- Guardrail обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef з `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не могли бути тихо пропущені.

## Пов’язане

- [Тестування live](/uk/help/testing-live)
- [CI](/uk/ci)
