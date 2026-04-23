---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресійних тестів для багів моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: набори unit/e2e/live, Docker-ранери та те, що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-23T20:05:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 28472f335f77c8e1d126b64b38b4841867aff2edd5f87438fcd904d421ec37cf
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір Docker-ранерів. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресійні тести для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний гейт (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Прямий таргетинг файлів тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Якщо ви ітеруєтеся над одним збоєм, спочатку віддавайте перевагу цільовим запускам.
- QA-сайт на базі Docker: `pnpm qa:lab:up`
- QA-лінія на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете більше впевненості:

- Гейт покриття: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + перевірки інструментів/зображень Gateway): `pnpm test:live`
- Тихий запуск одного live-файлу: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live sweep моделей: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер виконує текстовий хід плюс невелику перевірку у стилі читання файлу.
    Моделі, чиї метадані оголошують вхід `image`, також виконують маленький хід із зображенням.
    Вимкніть додаткові перевірки за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття CI: щоденні `OpenClaw Scheduled Live And E2E Checks` і ручні
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі Docker live matrix job-и
    із шардингом за провайдером.
  - Для точкових повторних запусків у CI викликайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові high-signal секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів для scheduled/release.
- Коштовнісний smoke-тест Moonshot/Kimi: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, потім запустіть ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  для `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6 і що
  транскрипт асистента зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env-змінні allowlist, описані нижче.

## QA-специфічні ранери

Ці команди працюють поряд з основними наборами тестів, коли вам потрібен реалізм qa-lab:

CI запускає QA Lab у виділених workflow. `Parity gate` запускається для відповідних PR і
з ручного dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і з ручного dispatch із mock parity gate, live Matrix lane та
live Telegram lane під керуванням Convex як паралельні job-и. `OpenClaw Release Checks`
запускає ті самі лінії перед затвердженням релізу.

- `pnpm openclaw qa suite`
  - Запускає QA-сценарії з репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    Gateway-воркерами. `qa-channel` за замовчуванням має concurrency 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість воркерів, або `--concurrency 1` для старої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстур і моків протоколу, не замінюючи при цьому сценарно-орієнтовану
    лінію `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий QA-набір усередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски пересилають підтримувані вхідні дані автентифікації QA, які практичні для гостьової системи:
    ключі провайдера на основі env, шлях до конфігурації QA live-провайдера та `CODEX_HOME`,
    якщо присутній.
  - Каталоги виводу мають залишатися в межах кореня репозиторію, щоб гостьова система могла записувати назад через
    змонтований workspace.
  - Записує звичайний QA-звіт і зведення, а також логи Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає QA-сайт на базі Docker для QA-роботи в операторському стилі.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний онбординг OpenAI API key, за замовчуванням
    налаштовує Telegram, перевіряє, що ввімкнення Plugin встановлює runtime-залежності на вимогу,
    запускає doctor і виконує один локальний хід агента проти замоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму
    лінію встановлення з пакета для Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує і встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, потім вмикає вбудовані channel/Plugin-и через
    редагування конфігурації.
  - Перевіряє, що виявлення налаштування залишає runtime-залежності
    неналаштованих Plugin-ів відсутніми, що перший налаштований запуск Gateway або doctor
    встановлює runtime-залежності кожного вбудованого Plugin на вимогу, і що другий
    перезапуск не перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>` і перевіряє, що doctor кандидата після оновлення
    відновлює runtime-залежності вбудованих channel без postinstall-відновлення
    з боку harness.
- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування
    протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA-лінію Matrix проти тимчасового Tuwunel homeserver на базі Docker.
  - Цей QA-хост наразі призначений лише для репозиторію/розробки. Паковані встановлення OpenClaw не постачають
    `qa-lab`, тому вони не надають `openclaw qa`.
  - Checkout-и репозиторію завантажують вбудований раннер напряму; окремий крок
    встановлення Plugin не потрібен.
  - Створює трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, потім запускає дочірній QA Gateway із реальним Plugin Matrix як транспортом SUT.
  - За замовчуванням використовує зафіксований стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, якщо потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки лінія локально створює тимчасових користувачів.
  - Записує QA-звіт Matrix, зведення, артефакт observed-events і комбінований лог виводу stdout/stderr у `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Запускає live QA-лінію Telegram проти реальної приватної групи з використанням токенів ботів driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулових облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути орендовані спільні облікові дані.
  - Завершується з ненульовим кодом, якщо будь-який сценарій не вдався. Використовуйте `--allow-failures`, якщо
    вам потрібні артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, при цьому бот SUT має надавати Telegram username.
  - Для стабільного спостереження bot-to-bot увімкніть Bot-to-Bot Communication Mode у `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує QA-звіт Telegram, зведення та артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на відправлення driver до спостереженої відповіді SUT.

Live-транспортні лінії мають один спільний стандартний контракт, щоб нові транспорти не дрейфували:

`qa-channel` залишається широким синтетичним QA-набором і не входить до матриці покриття live-транспорту.

| Лінія    | Canary | Gating згадувань | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальші дії в треді | Ізоляція тредів | Спостереження реакцій | Команда help |
| -------- | ------ | ---------------- | -------------------- | ------------------------- | ----------------------------- | -------------------- | --------------- | --------------------- | ------------ |
| Matrix   | x      | x                | x                    | x                         | x                             | x                    | x               | x                     |              |
| Telegram | x      |                  |                      |                           |                               |                      |                 |                       | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки лінія працює, і звільняє оренду під час завершення роботи.

Еталонний scaffold проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (за замовчуванням `ci` у CI, інакше `maintainer`)

Необов’язкові env-змінні:

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
  - Захист від активної оренди: `{ status: "error", code: "LEASE_ACTIVE", ... }`
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
володіти цим потоком.

`qa-lab` відповідає за спільну механіку хоста:

- кореневий простір команд `openclaw qa`
- запуск і завершення набору
- concurrency воркерів
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- alias-и сумісності для старіших сценаріїв `qa-channel`

Runner Plugin-и відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектяться вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії на базі транспорту
- як обробляється transport-specific reset або cleanup

Мінімальний поріг впровадження для нового channel:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному seam хоста `qa-lab`.
3. Залишайте transport-specific механіку всередині runner Plugin або harness channel.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди.
   Runner Plugin-и мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; ліниве виконання CLI й runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic helper-и для нових сценаріїв.
7. Зберігайте працездатність наявних alias-ів сумісності, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, залишайте її в runner Plugin або harness цього plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один channel, додавайте generic helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій transport-specific і явно відображайте це в контракті сценарію.

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

Alias-и сумісності залишаються доступними для наявних сценаріїв, зокрема:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Нова робота з channel має використовувати generic назви helper-ів.
Alias-и сумісності існують, щоб уникнути міграції в один день, а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростаючий реалізм» (і зростаючу flaky/cost):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфіг: нетаргетовані запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати багатопроєктні шарди в конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і whitelist-нуті node-тести `ui`, що покриваються `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - Внутрішньопроцесні integration-тести (автентифікація Gateway, маршрутизація, tooling, парсинг, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним
    <AccordionGroup>
    <Accordion title="Проєкти, шарди та scope-нуті лінії"> - Нетаргетований `pnpm test` запускає дванадцять менших конфігурацій шардів (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного гігантського процесу root project. Це зменшує піковий RSS на навантажених машинах і не дає роботі auto-reply/extension виснажувати не пов’язані набори. - `pnpm test --watch` як і раніше використовує native граф проєктів root `vitest.config.ts`, оскільки цикл watch із багатьма шардами непрактичний. - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scope-нуті лінії, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project. - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scope-нуті лінії, коли diff торкається лише маршрутованих файлів source/test; редагування config/setup як і раніше повертаються до широкого перезапуску root project. - `pnpm check:changed` — це звичайний розумний локальний гейт для вузької роботи. Він класифікує diff на core, тести core, extensions, тести extension, apps, docs, release metadata і tooling, а потім запускає відповідні лінії typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають валідацію extension, оскільки extensions залежать від цих core-контрактів. Version bump-и лише в release metadata запускають цільові перевірки version/config/root-dependency замість повного набору, із guard, який відхиляє зміни пакетів поза полем version верхнього рівня. - Unit-тести з малими import із agents, commands, plugins, helper-ів auto-reply, `plugin-sdk` та подібних чистих utility-областей маршрутизуються через лінію `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних лініях. - Вибрані helper source-файли `plugin-sdk` і `commands` також маплять запуски в режимі changed на явні sibling-тести в цих легких лініях, тож редагування helper-ів не змушують повторно запускати повний важкий набір для цього каталогу. - `auto-reply` має три виділені бакети: helper-и core верхнього рівня, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це утримує найважчу роботу harness reply поза дешевими тестами status/chunk/token.
    </Accordion>

      <Accordion title="Покриття embedded runner">
        - Коли ви змінюєте входи виявлення message-tool або runtime-контекст compaction, зберігайте обидва рівні покриття.
        - Додавайте сфокусовані helper-регресії для чистих меж маршрутизації та нормалізації.
        - Підтримуйте інтеграційні набори embedded runner у здоровому стані:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Ці набори перевіряють, що scope-нуті id і поведінка Compaction як і раніше проходять
          через реальні шляхи `run.ts` / `compact.ts`; helper-only тести не є
          достатньою заміною для цих integration-шляхів.
      </Accordion>

      <Accordion title="Значення за замовчуванням для пулу Vitest та ізоляції">
        - Базовий конфіг Vitest за замовчуванням використовує `threads`.
        - Спільний конфіг Vitest фіксує `isolate: false` і використовує
          неізольований runner у root project, e2e і live-конфігах.
        - Root-лінія UI зберігає свій setup `jsdom` і optimizer, але також працює на
          спільному неізольованому runner.
        - Кожен shard `pnpm test` успадковує ті самі значення за замовчуванням `threads` + `isolate: false`
          зі спільного конфігу Vitest.
        - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів Vitest,
          щоб зменшити churn компіляції V8 під час великих локальних запусків.
          Встановіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти з типовою поведінкою V8.
      </Accordion>

      <Accordion title="Швидка локальна ітерація">
        - `pnpm changed:lanes` показує, які архітектурні лінії запускає diff.
        - Pre-commit hook запускає `pnpm check:changed --staged` після staged
          formatting/linting, тож commit-и лише для core не сплачують вартість тестів extension,
          якщо вони не торкаються публічних контрактів, орієнтованих на extension. Commit-и лише з
          release metadata залишаються на цільовій лінії
          version/config/root-dependency.
        - Якщо точний staged набір змін уже був перевірений
          рівними або сильнішими гейтами, використовуйте
          `scripts/committer --fast "<message>" <files...>`, щоб пропустити лише повторний запуск changed-scope hook.
          Staged format/lint усе одно запускаються. Згадайте
          виконані гейти у своєму handoff. Це також припустимо після повторного запуску
          ізольованого flaky hook failure, якщо він проходить із scope-нутим доказом.
        - `pnpm test:changed` маршрутизується через scope-нуті лінії, коли змінені шляхи
          чисто мапляться на менший набір.
        - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
          лише з вищим лімітом воркерів.
        - Автомасштабування локальних воркерів навмисно консервативне й відступає,
          коли середнє навантаження хоста вже високе, тож кілька одночасних
          запусків Vitest за замовчуванням завдають менше шкоди.
        - Базовий конфіг Vitest позначає проєкти/конфіг-файли як
          `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється wiring тестів.
        - Конфіг зберігає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
          хостах; встановіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
          одну явну локацію кешу для прямого профілювання.
      </Accordion>

      <Accordion title="Налагодження продуктивності">
        - `pnpm test:perf:imports` вмикає звітність Vitest щодо тривалості import плюс
          вивід деталізації import.
        - `pnpm test:perf:imports:changed` обмежує той самий вигляд профілювання
          файлами, зміненими від `origin/main`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутований
          `test:changed` із native шляхом root project для цього закоміченого diff і виводить wall time плюс max RSS на macOS.
        - `pnpm test:perf:changed:bench -- --worktree` бенчмаркає поточне брудне дерево,
          маршрутизуючи список змінених файлів через
          `scripts/test-projects.mjs` і root-конфіг Vitest.
        - `pnpm test:perf:profile:main` записує CPU profile основного потоку для
          накладних витрат запуску й transform у Vitest/Vite.
        - `pnpm test:perf:profile:runner` записує CPU+heap profile runner для
          unit-набору з вимкненим файловим паралелізмом.
      </Accordion>
    </AccordionGroup>

### Stability (Gateway)

- Команда: `pnpm test:stability:gateway`
- Конфіг: `vitest.gateway.config.ts`, примусово один воркер
- Обсяг:
  - Запускає реальний loopback Gateway з diagnostics, увімкненими за замовчуванням
  - Проганяє синтетичне churn повідомлень Gateway, пам’яті та великих payload через шлях діагностичних подій
  - Запитує `diagnostics.stability` через Gateway WS RPC
  - Покриває helper-и persistence для diagnostic stability bundle
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS лишаються в межах бюджету тиску, а глибина черг на сесію зменшується назад до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька лінія для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (Gateway smoke)

- Команда: `pnpm test:e2e`
- Конфіг: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і E2E-тести вбудованих Plugin-ів у `extensions/`
- Значення runtime за замовчуванням:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує адаптивну кількість воркерів (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent-режимі, щоб зменшити накладні витрати на console I/O.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>` щоб примусово задати кількість воркерів (обмежено 16).
  - `OPENCLAW_E2E_VERBOSE=1` щоб знову ввімкнути докладний console output.
- Обсяг:
  - Поведінка multi-instance Gateway end-to-end
  - Поверхні WebSocket/HTTP, pairing Node і важчий networking
- Очікування:
  - Запускається в CI (коли ввімкнено в pipeline)
  - Реальні ключі не потрібні
  - Має більше рухомих частин, ніж unit-тести (може бути повільнішим)

### E2E: smoke-тест бекенда OpenShell

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований Gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє бекенд OpenShell у OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє поведінку remote-canonical файлової системи через sandbox fs bridge
- Очікування:
  - Лише opt-in; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і робочого Docker daemon
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий Gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1` щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` щоб вказати нестандартний CLI-бінарник або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфіг: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і live-тести вбудованих Plugin-ів у `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику tool, проблем автентифікації та поведінки rate limit
- Очікування:
  - За задумом не є CI-stable (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / використовує rate limit
  - Переважно запускайте звужені підмножини, а не «все»
- Live-запуски використовують `~/.profile`, щоб підхопити відсутні API key.
- За замовчуванням live-запуски все одно ізолюють `HOME` і копіюють config/auth-матеріали до тимчасового test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Встановлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням працює в тихішому режимі: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення `~/.profile` і приглушує логи bootstrap Gateway / chatter Bonjour. Встановіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете знову бачити повні стартові логи.
- Ротація API key (залежно від провайдера): встановіть `*_API_KEYS` у форматі через кому/крапку з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або override для конкретного live-запуску через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід progress/Heartbeat:
  - Live-набори тепер виводять рядки прогресу до stderr, тож під час довгих викликів провайдера помітно, що робота триває, навіть коли console capture у Vitest тихий.
  - `vitest.live.config.ts` вимикає перехоплення console у Vitest, тому рядки прогресу провайдера/Gateway одразу транслюються під час live-запусків.
  - Налаштовуйте Heartbeat direct-model через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагуєте логіку/тести: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Торкаєтеся networking Gateway / протоколу WS / pairing: додайте `pnpm test:e2e`
- Налагоджуєте «мій бот не працює» / збої конкретного провайдера / виклик tool: запускайте звужений `pnpm test:live`

## Live: sweep можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яку наразі оголошує** підключений Android Node, і перевірити поведінку контракту команди.
- Обсяг:
  - Попередньо підготовлений / ручний setup (набір не встановлює, не запускає і не pair-ить app).
  - Перевірка `node.invoke` Gateway для вибраного Android Node, команда за командою.
- Необхідне попереднє налаштування:
  - Android app уже підключено і pair-ено до Gateway.
  - App має залишатися на передньому плані.
  - Для можливостей, які ви очікуєте як успішні, мають бути надані permissions / capture consent.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні деталі налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-тест моделі (profile keys)

Live-тести поділено на два рівні, щоб можна було ізолювати збої:

- «Direct model» показує, чи провайдер/модель узагалі може відповісти з наданим ключем.
- «Gateway smoke» показує, чи працює повний pipeline gateway+agent для цієї моделі (сесії, history, tools, policy sandbox тощо).

### Рівень 1: Direct model completion (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Виконати невелике completion для кожної моделі (і цільові регресії, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, alias для modern), щоб справді запустити цей набір; інакше він буде пропущений, щоб `pnpm test:live` залишався сфокусованим на gateway smoke
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern` щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це alias для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для sweep modern/all за замовчуванням застосовується curated high-signal cap; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного sweep modern або додатне число для меншого cap.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: profile store і env fallback-и
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише profile store**
- Для чого це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «pipeline gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: replay reasoning OpenAI Responses/Codex Responses + потоки tool-call)

### Рівень 2: smoke-тест Gateway + dev agent (що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти Gateway in-process
  - Створити/оновити сесію `agent:dev:*` (override моделі на кожен запуск)
  - Ітерувати за моделями з ключами й перевіряти:
    - «змістовну» відповідь (без tools)
    - що реальний виклик tool працює (read probe)
    - необов’язкові додаткові probe tool (exec+read probe)
    - що регресійні шляхи OpenAI (лише tool-call → follow-up) продовжують працювати
- Деталі probe (щоб можна було швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у workspace і просить agent виконати `read` цього файлу та повернути nonce.
  - `exec+read` probe: тест просить agent через `exec` записати nonce у temp-файл, а потім виконати `read` цього файлу.
  - image probe: тест прикріплює згенерований PNG (cat + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це alias для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для gateway sweep modern/all за замовчуванням застосовується curated high-signal cap; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного sweep modern або додатне число для меншого cap.
- Як вибирати провайдерів (уникайте «усе OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Probe tool + image у цьому live-тесті завжди увімкнені:
  - `read` probe + `exec+read` probe (навантаження на tool)
  - image probe запускається, коли модель оголошує підтримку вводу зображень
  - Потік (високорівнево):
    - Тест генерує крихітний PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway парсить attachments у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що можна тестувати на вашій машині (і точні id `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke-тест CLI-бекенда (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити pipeline Gateway + agent, використовуючи локальний CLI-бекенд, не торкаючись вашого config за замовчуванням.
- Значення smoke за замовчуванням, специфічні для бекенда, зберігаються у визначенні `cli-backend.ts` extension-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо запускаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image береться з метаданих Plugin CLI-бекенда-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` щоб надіслати реальне вкладення-зображення (шляхи інжектяться в prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` щоб передавати шляхи до файлів зображень як аргументи CLI замість інжекції в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`) щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` щоб надіслати другий хід і перевірити flow відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` щоб вимкнути стандартний probe безперервності тієї самої сесії Claude Sonnet -> Opus (встановіть `1`, щоб примусово ввімкнути його, коли вибрана модель підтримує ціль перемикання).

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.5" \
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

- Docker-ранер розміщено в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-тест CLI-бекенда всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає smoke-метадані CLI з extension-власника, а потім встановлює відповідний Linux CLI-пакет (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований каталог запису за префіксом `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує portable Claude Code subscription OAuth через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він перевіряє прямий `claude -p` у Docker, а потім запускає два ходи Gateway CLI-бекенда без збереження env-змінних API key Anthropic. Ця subscription-лінія за замовчуванням вимикає MCP/tool та image probe Claude, тому що Claude наразі маршрутизує використання сторонніх застосунків через тарифікацію extra-usage замість звичайних лімітів subscription plan.
- Live smoke-тест CLI-бекенда тепер перевіряє той самий end-to-end flow для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через Gateway CLI.
- Стандартний smoke-тест Claude також оновлює сесію з Sonnet до Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Live: smoke-тест прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний flow прив’язки розмови ACP з live ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову message-channel на місці
  - надіслати звичайне follow-up у тій самій розмові
  - перевірити, що follow-up потрапляє до транскрипту прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значення за замовчуванням:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний channel: контекст розмови у стилі Slack DM
  - Бекенд ACP: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.5`
- Примітки:
  - Ця лінія використовує поверхню Gateway `chat.send` з admin-only synthetic полями `originating-route`, щоб тести могли додавати контекст message-channel без імітації зовнішньої доставки.
  - Якщо `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр агентів Plugin `acpx` для вибраного ACP harness agent.

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

- Docker-ранер розміщено в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає smoke-тест прив’язки ACP послідовно для всіх підтримуваних live CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він використовує `~/.profile`, переносить відповідний auth-матеріал CLI в контейнер, встановлює `acpx` у npm-префікс із правом запису, а потім встановлює потрібний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker раннер встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з підключеного profile доступними для дочірнього harness CLI.

## Live: smoke-тест harness app-server Codex

- Мета: перевірити Plugin-власний harness Codex через звичайний Gateway
  метод `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.5` з примусово вибраним harness Codex
  - надіслати другий хід у ту саму сесію OpenClaw і перевірити, що thread
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий командний шлях
    Gateway
  - за бажанням виконати дві shell-перевірки з ескалацією, переглянуті Guardian: одну нешкідливу
    команду, яку слід дозволити, і одну фальшиву відправку секрету, яку слід
    заборонити, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Модель за замовчуванням: `openai/gpt-5.5`
- Необов’язковий image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язковий MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язковий probe Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-тест встановлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний
  harness Codex не міг пройти тест тихо переключившись на Pi.
- Автентифікація: `OPENAI_API_KEY` з shell/profile, а також необов’язково скопійовані
  `~/.codex/auth.json` і `~/.codex/config.toml`

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.5 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розміщено в `scripts/test-live-codex-harness-docker.sh`.
- Він використовує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації CLI Codex, якщо вони є, встановлює `@openai/codex` у змонтований npm-префікс
  із правом запису, переносить дерево source, а потім запускає лише live-тест harness Codex.
- Docker за замовчуванням вмикає image, MCP/tool і Guardian probe. Встановіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий
  діагностичний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і live-конфіг
  тесту, щоб legacy alias-и або fallback на Pi не могли приховати регресію
  harness Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist — найшвидші й найменш flaky:

- Одна модель, direct (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.5" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик tool для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API key).
- `google-antigravity/...` використовує міст Antigravity OAuth (endpoint агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості tooling).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація через API key / profile); саме це більшість користувачів мають на увазі під “Gemini”.
  - CLI: OpenClaw звертається до локального бінарника `gemini`; він має власну автентифікацію та може поводитися інакше (streaming/support tools/version skew).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» не існує (live — це opt-in), але це **рекомендовані** моделі для регулярного покриття на dev-машині з ключами.

### Сучасний набір smoke (виклик tool + image)

Це запуск «поширених моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не Codex): `openai/gpt-5.5` (необов’язково: `openai/gpt-5.4-mini`)
- OpenAI Codex OAuth: `openai/gpt-5.5` (`openai-codex/gpt-*` залишається legacy alias)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск gateway smoke з tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.5,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик tool (Read + необов’язковий Exec)

Виберіть принаймні одну модель на кожну сім’ю провайдерів:

- OpenAI: `openai/gpt-5.5` (або `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою `tools`, яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклик tool залежить від режиму API)

### Vision: надсилання image (вкладення → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Aggregator-и / альтернативні Gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, яких можна включити до live-матриці (якщо у вас є облікові дані/config):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (custom endpoint): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «усі моделі». Авторитетним списком є те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, live-тести мають знаходити ті самі ключі.
- Якщо live-тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих агентів: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це означає “profile keys” у live-тестах)
- Config: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Legacy-каталог стану: `~/.openclaw/credentials/` (копіюється до staged live home, якщо присутній, але це не основне сховище profile key)
- Локальні live-запуски за замовчуванням копіюють активний config, файли `auth-profiles.json` для окремих агентів, legacy `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового test home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probe не торкалися вашого реального workspace хоста.

Якщо ви хочете покладатися на env-ключі (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть змонтувати `~/.profile` у контейнер).

## Live Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live для coding plan BytePlus

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live для workflow media ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для image, video і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, polling, завантаженнях або реєстрації plugin

## Live для генерації зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований provider Plugin генерації зображень
  - Завантажує відсутні env-змінні provider із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API key раніше за збережені auth profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає provider-ів без придатної автентифікації/profile/model
  - Проганяє стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Поточні вбудовані provider-и, які покриваються:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через profile-store та ігнорувати перевизначення лише через env

## Live для генерації музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний шлях вбудованих provider-ів генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує env-змінні provider із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API key раніше за збережені auth profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає provider-ів без придатної автентифікації/profile/model
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з input лише у вигляді prompt
    - `edit`, коли provider оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної лінії:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, а не цей спільний sweep
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через profile-store та ігнорувати перевизначення лише через env

## Live для генерації відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний шлях вбудованих provider-ів генерації відео
  - За замовчуванням використовує безпечний для релізу smoke-шлях: provider-и без FAL, один запит text-to-video на provider, односекундний lobster prompt і обмеження операції на provider через `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці provider може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні provider із вашого login shell (`~/.profile`) перед probe
  - За замовчуванням використовує live/env API key раніше за збережені auth profile, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає provider-ів без придатної автентифікації/profile/model
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими transform, коли вони доступні:
    - `imageToVideo`, коли provider оголошує `capabilities.imageToVideo.enabled` і вибраний provider/model приймає локальний image input на основі buffer у спільному sweep
    - `videoToVideo`, коли provider оголошує `capabilities.videoToVideo.enabled` і вибраний provider/model приймає локальний video input на основі buffer у спільному sweep
  - Поточні provider-и `imageToVideo`, що оголошені, але пропускаються у спільному sweep:
    - `vydra`, тому що вбудований `veo3` є лише текстовим, а вбудований `kling` потребує віддаленого URL зображення
  - Provider-specific покриття Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс лінію `kling`, яка за замовчуванням використовує фікстуру з віддаленим URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні provider-и `videoToVideo`, що оголошені, але пропускаються у спільному sweep:
    - `alibaba`, `qwen`, `xai`, тому що ці шляхи наразі потребують віддалених еталонних URL `http(s)` / MP4
    - `google`, тому що поточна спільна лінія Gemini/Veo використовує локальний input на основі buffer, а цей шлях не приймається у спільному sweep
    - `openai`, тому що поточній спільній лінії бракує гарантій org-specific доступу до video inpaint/remix
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного provider у стандартний sweep, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції на кожен provider для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію через profile-store та ігнорувати перевизначення лише через env

## Live media harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для image, music і video через одну repo-native точку входу
  - Автоматично завантажує відсутні env-змінні provider із `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до provider-ів, які зараз мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тож поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-ранери (необов’язкові перевірки «працює в Linux»)

Ці Docker-ранери поділено на дві категорії:

- Live-model ранери: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл profile-key всередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний config-dir і workspace (і використовують `~/.profile`, якщо його змонтовано). Відповідні локальні точки входу — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live-ранери за замовчуванням використовують менший smoke-cap, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням встановлює `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` за замовчуванням встановлює `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  вам явно потрібне більше, вичерпне сканування.
- `test:docker:all` один раз збирає live Docker-образ через `test:docker:live-build`, а потім повторно використовує його для двох Docker-ліній live. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для container smoke-ранерів E2E, які перевіряють зібраний app.
- Container smoke-ранери: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` піднімають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Docker-ранери live-model також bind-mount-ять лише потрібні каталоги автентифікації CLI (або всі підтримувані, коли запуск не звужений), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб OAuth зовнішнього CLI міг оновлювати токени без зміни сховища автентифікації хоста:

- Direct model: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke-тест прив’язки ACP: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke-тест CLI-бекенда: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke-тест harness app-server Codex: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Майстер онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke-тест онбордингу/channel/agent через npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через онбординг env-ref і за замовчуванням Telegram, перевіряє, що ввімкнення Plugin встановлює його runtime-залежності на вимогу, запускає doctor і виконує один замоканий хід агента OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host rebuild через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть channel через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-тест глобального встановлення Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольованому home і перевіряє, що `openclaw infer image providers --json` повертає вбудовані provider-и зображень замість зависання. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть host build через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker-образу через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke-тест інсталятора в Docker: `bash scripts/test-install-sh-docker.sh` використовує спільний npm-кеш для root-, update-, direct-npm- і non-root-контейнерів. Встановіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати цей кеш між локальними повторними запусками.
- Мережа Gateway (два контейнери, автентифікація WS + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Мінімальна регресія reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає замоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово змушує схему provider відхилити дані й перевіряє, що сирі деталі з’являються в логах Gateway.
- Міст каналу MCP (seeded Gateway + stdio bridge + сирий smoke notification-frame у стилі Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP у комплекті Pi (реальний stdio MCP-сервер + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і one-shot subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin-и (smoke встановлення + alias `/plugin` + семантика перезапуску набору Claude): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime-залежності вбудованого Plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker-образ раннера, один раз збирає й пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій Linux-інсталяції. Повторно використовуйте образ через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропускайте host rebuild після свіжого локального build через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть на наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Звужуйте runtime-залежності вбудованого Plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати й повторно використовувати спільний образ built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення образів, як-от `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, як і раніше мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний образ, скрипти завантажують його, якщо його ще немає локально. Тести QR та інсталятора в Docker зберігають власні Dockerfile, оскільки вони перевіряють поведінку пакування/встановлення, а не спільне runtime зібраного app.

Docker-ранери live-model також монтують поточний checkout лише для читання і
переносять його до тимчасового workdir усередині контейнера. Це дозволяє
зберігати runtime-образ компактним і водночас запускати Vitest проти вашого
точного локального source/config.
Крок staging пропускає великі локальні кеші та результати збірки app, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, а також локальні для app каталоги `.build` або
виводу Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання
специфічних для машини артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні воркери channel Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити live-покриття
Gateway із цієї Docker-лінії.
`test:docker:openwebui` — це smoke сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-сумісними HTTP-endpoint, запускає
закріплений контейнер Open WebUI проти цього Gateway, виконує вхід через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний запит чату через проксі `/api/chat/completions` Open WebUI.
Перший запуск може бути помітно повільнішим, оскільки Docker може потребувати завантаження
образу Open WebUI, а Open WebUI може потребувати завершення власного cold-start setup.
Ця лінія потребує придатного ключа live-моделі, а `OPENCLAW_PROFILE_FILE`
(за замовчуванням `~/.profile`) — основний спосіб надати його в Dockerized-запусках.
Успішні запуски виводять невеликий JSON-payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно детермінований і не потребує
реального облікового запису Telegram, Discord чи iMessage. Він піднімає seeded
контейнер Gateway, запускає другий контейнер, який виконує `openclaw mcp serve`, а потім
перевіряє виявлення маршрутованих розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію outbound send і сповіщення у стилі Claude про channel +
permissions через реальний міст stdio MCP. Перевірка сповіщень
безпосередньо інспектує сирі кадри stdio MCP, тож smoke перевіряє те, що міст
справді відправляє, а не лише те, що трапляється відображати конкретний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` детермінований і не потребує ключа
live-моделі. Він збирає Docker-образ репозиторію, запускає реальний stdio MCP probe-сервер
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP комплекту Pi,
виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` детермінований і не потребує ключа
live-моделі. Він запускає seeded Gateway з реальним stdio MCP probe-сервером, виконує
ізольований хід cron і one-shot дочірній хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language для thread ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Залишайте цей скрипт для workflow регресії/налагодження. Він може знову знадобитися для перевірки маршрутизації ACP thread, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і використовується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, підключені з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без зовнішніх монтувань автентифікації CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI всередині Docker
- Зовнішні каталоги/файли автентифікації CLI під `$HOME` монтуються лише для читання в `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски provider монтують лише потрібні каталоги/файли, визначені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати provider-ів у контейнері
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використовувати наявний образ `openclaw:local-live` для повторних запусків, яким не потрібне перевизначення збірки
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб переконатися, що облікові дані беруться з profile store (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку Gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити prompt для перевірки nonce, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег образу Open WebUI

## Перевірка документації

Після редагування документації запускайте перевірки docs: `pnpm check:docs`.
Запускайте повну валідацію anchor у Mintlify, коли вам також потрібні перевірки заголовків у межах сторінки: `pnpm docs:check-links:anchors`.

## Offline-регресія (безпечна для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик tool у Gateway (замоканий OpenAI, реальний цикл Gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Майстер Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

У нас уже є кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Замоканий виклик tool через реальний цикл Gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end-потоки майстра, які перевіряють wiring сесії та вплив config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Вибір рішення:** коли Skills перелічено в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Дотримання вимог:** чи читає агент `SKILL.md` перед використанням і чи виконує потрібні кроки/args?
- **Контракти workflow:** багатокрокові сценарії, які перевіряють порядок tool, перенесення history сесії та межі sandbox.

Майбутні eval-и мають насамперед залишатися детермінованими:

- Runner сценаріїв, який використовує mock provider-и для перевірки викликів tool + їхнього порядку, читання skill-файлів і wiring сесії.
- Невеликий набір сценаріїв, зосереджених на Skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live eval-и (opt-in, з керуванням через env) лише після того, як буде готовий безпечний для CI набір.

## Контрактні тести (форма Plugin і channel)

Контрактні тести перевіряють, що кожен зареєстрований Plugin і channel відповідає своєму
контракту інтерфейсу. Вони ітеруються по всіх виявлених Plugin-ах і запускають набір
перевірок форми та поведінки. Лінія unit за замовчуванням `pnpm test` навмисно
пропускає ці спільні seam- і smoke-файли; запускайте контрактні команди явно,
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
- **threading** - Обробка ID thread
- **directory** - API каталогу/складу
- **group-policy** - Застосування групової policy

### Контракти status provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Форма registry Plugin

### Контракти provider

Розташовані в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку автентифікації
- **auth-choice** - Вибір/selection автентифікації
- **catalog** - API каталогу моделей
- **discovery** - Виявлення Plugin
- **loader** - Завантаження Plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс Plugin
- **wizard** - Майстер налаштування

### Коли запускати

- Після зміни export-ів або subpath у plugin-sdk
- Після додавання або зміни channel чи provider Plugin
- Після рефакторингу реєстрації або виявлення Plugin

Контрактні тести запускаються в CI і не потребують реальних API key.

## Додавання регресій (настанови)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Якщо можливо, додайте безпечну для CI регресію (mock/stub provider або зафіксуйте точну трансформацію форми запиту)
- Якщо це за своєю природою лише live-проблема (rate limit, policy автентифікації), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому рівню, який ловить баг:
  - баг перетворення/повтору запиту provider → direct models test
  - баг pipeline Gateway session/history/tool → live gateway smoke або безпечний для CI mock-тест Gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef із метаданих registry (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову сім’ю цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно завершується помилкою для некласифікованих target id, щоб нові класи не могли бути тихо пропущені.
