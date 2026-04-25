---
read_when:
    - Запуск тестів локально або в CI
    - Додавання регресій для помилок моделі/провайдера
    - Налагодження поведінки Gateway + агента
summary: 'Набір для тестування: модульні/e2e/live набори, ранери Docker і що охоплює кожен тест'
title: Тестування
x-i18n:
    generated_at: "2026-04-25T00:01:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3bd1ab654b43a380c6eecb3ba53e74442bad9374be4eea2d9ce368d8b89b7c2
    source_path: help/testing.md
    workflow: 15
---

OpenClaw має три набори Vitest (unit/integration, e2e, live) і невеликий набір
ранерів Docker. Цей документ — посібник «як ми тестуємо»:

- Що охоплює кожен набір (і що він навмисно _не_ охоплює).
- Які команди запускати для типових сценаріїв (локально, перед push, налагодження).
- Як live-тести знаходять облікові дані та вибирають моделі/провайдерів.
- Як додавати регресії для реальних проблем моделей/провайдерів.

## Швидкий старт

У більшості випадків:

- Повний gate (очікується перед push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Швидший локальний запуск повного набору на потужній машині: `pnpm test:max`
- Прямий цикл спостереження Vitest: `pnpm test:watch`
- Пряме націлювання на файл тепер також маршрутизує шляхи extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Під час ітерації над однією помилкою спочатку віддавайте перевагу цільовим запускам.
- Сайт QA на базі Docker: `pnpm qa:lab:up`
- Лінія QA на базі Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Коли ви змінюєте тести або хочете додаткової впевненості:

- Перевірка coverage: `pnpm test:coverage`
- Набір E2E: `pnpm test:e2e`

Під час налагодження реальних провайдерів/моделей (потрібні реальні облікові дані):

- Live-набір (моделі + Gateway tool/image probes): `pnpm test:live`
- Тихо запустити один live-файл: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker live model sweep: `pnpm test:docker:live-models`
  - Кожна вибрана модель тепер запускає текстовий хід плюс невеликий probe у стилі читання файла.
    Моделі, метадані яких оголошують вхід `image`, також запускають невеликий хід із зображенням.
    Вимкніть додаткові probe за допомогою `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` або
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, коли ізолюєте збої провайдера.
  - Покриття в CI: щоденний `OpenClaw Scheduled Live And E2E Checks` і ручний
    `OpenClaw Release Checks` обидва викликають повторно використовуваний workflow live/E2E з
    `include_live_suites: true`, який включає окремі Docker live model
    matrix jobs, розшардовані за провайдером.
  - Для цільових повторних запусків у CI запускайте `OpenClaw Live And E2E Checks (Reusable)`
    з `include_live_suites: true` і `live_models_only: true`.
  - Додавайте нові високосигнальні секрети провайдерів до `scripts/ci-hydrate-live-auth.sh`,
    а також до `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` і його
    викликів для scheduled/release.
- Native Codex bound-chat smoke: `pnpm test:docker:live-codex-bind`
  - Запускає Docker live lane для шляху Codex app-server, прив’язує синтетичний
    Slack DM через `/codex bind`, виконує `/codex fast` і
    `/codex permissions`, потім перевіряє, що звичайна відповідь і вкладення
    зображення проходять через native plugin binding, а не через ACP.
- Moonshot/Kimi cost smoke: якщо встановлено `MOONSHOT_API_KEY`, виконайте
  `openclaw models list --provider moonshot --json`, а потім виконайте ізольований
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  проти `moonshot/kimi-k2.6`. Переконайтеся, що JSON повідомляє Moonshot/K2.6, а
  транскрипт асистента зберігає нормалізоване `usage.cost`.

Порада: коли вам потрібен лише один збійний випадок, віддавайте перевагу звуженню live-тестів через env-змінні allowlist, описані нижче.

## Спеціальні ранери QA

Ці команди розташовані поруч з основними тестовими наборами, коли вам потрібна реалістичність qa-lab:

CI запускає QA Lab в окремих workflow. `Parity gate` запускається для відповідних PR і
через ручний dispatch із mock-провайдерами. `QA-Lab - All Lanes` запускається щоночі на
`main` і через ручний dispatch із mock parity gate, live Matrix lane і
керованою Convex live Telegram lane як паралельними jobs. `OpenClaw Release Checks`
запускає ті самі лінії перед погодженням релізу.

- `pnpm openclaw qa suite`
  - Запускає сценарії QA на базі репозиторію безпосередньо на хості.
  - За замовчуванням запускає кілька вибраних сценаріїв паралельно з ізольованими
    worker Gateway. `qa-channel` за замовчуванням має concurrency 4 (обмежується
    кількістю вибраних сценаріїв). Використовуйте `--concurrency <count>`, щоб налаштувати
    кількість worker, або `--concurrency 1` для старішої послідовної лінії.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Підтримує режими провайдерів `live-frontier`, `mock-openai` і `aimock`.
    `aimock` запускає локальний сервер провайдера на базі AIMock для експериментального
    покриття фікстурами та protocol-mock, не замінюючи сценарно-орієнтовану
    лінію `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Запускає той самий набір QA всередині тимчасової Linux VM Multipass.
  - Зберігає ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
  - Повторно використовує ті самі прапорці вибору провайдера/моделі, що й `qa suite`.
  - Live-запуски передають підтримувані вхідні дані автентифікації QA, практичні для guest:
    ключі провайдера на основі env, шлях конфігурації QA live provider і `CODEX_HOME`,
    якщо він присутній.
  - Каталоги виводу мають залишатися під коренем репозиторію, щоб guest міг записувати назад через
    змонтований workspace.
  - Записує звичайний звіт QA + summary, а також журнали Multipass у
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Запускає сайт QA на базі Docker для операторського QA.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Збирає npm tarball із поточного checkout, глобально встановлює його в
    Docker, виконує неінтерактивний onboarding з OpenAI API key, за замовчуванням налаштовує Telegram,
    перевіряє, що ввімкнення plugin встановлює runtime dependencies на вимогу,
    запускає doctor і виконує один локальний agent turn проти змоканого endpoint OpenAI.
  - Використовуйте `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, щоб запустити ту саму
    лінію інсталяції з пакета з Discord.
- `pnpm test:docker:npm-telegram-live`
  - Встановлює опублікований пакет OpenClaw у Docker, виконує onboarding встановленого пакета,
    налаштовує Telegram через встановлений CLI, а потім повторно використовує
    live Telegram QA lane з цим встановленим пакетом як Gateway SUT.
  - За замовчуванням використовується `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Використовує ті самі env-облікові дані Telegram або джерело облікових даних Convex, що й
    `pnpm openclaw qa telegram`. Для автоматизації CI/release встановіть
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` разом із
    `OPENCLAW_QA_CONVEX_SITE_URL` і секретом ролі. Якщо
    `OPENCLAW_QA_CONVEX_SITE_URL` і секрет ролі Convex присутні в CI,
    обгортка Docker автоматично вибирає Convex.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` перевизначає спільний
    `OPENCLAW_QA_CREDENTIAL_ROLE` лише для цієї лінії.
  - GitHub Actions надає цю лінію як ручний workflow для мейнтейнерів
    `NPM Telegram Beta E2E`. Вона не запускається при merge. Workflow використовує
    середовище `qa-live-shared` і оренду облікових даних Convex CI.
- `pnpm test:docker:bundled-channel-deps`
  - Пакує та встановлює поточну збірку OpenClaw у Docker, запускає Gateway
    з налаштованим OpenAI, а потім вмикає вбудовані channel/plugins через редагування config.
  - Перевіряє, що виявлення setup залишає runtime dependencies
    неналаштованого plugin відсутніми, перший налаштований запуск Gateway або doctor встановлює
    runtime dependencies кожного вбудованого plugin на вимогу, а другий перезапуск не
    перевстановлює залежності, які вже були активовані.
  - Також встановлює відому старішу npm baseline, вмикає Telegram перед запуском
    `openclaw update --tag <candidate>`, і перевіряє, що doctor кандидата
    після оновлення відновлює runtime dependencies вбудованих channel без
    відновлення postinstall з боку harness.
- `pnpm test:parallels:npm-update`
  - Запускає native smoke оновлення встановленого пакета в гостьових системах Parallels. Кожна
    вибрана платформа спочатку встановлює потрібний baseline package, потім запускає
    встановлену команду `openclaw update` у тій самій guest-системі та перевіряє встановлену
    версію, стан оновлення, готовність gateway і один локальний agent turn.
  - Використовуйте `--platform macos`, `--platform windows` або `--platform linux`, коли
    ітеруєте лише на одній guest-системі. Використовуйте `--json` для шляху до summary artifact і
    стану кожної лінії.
  - Обгорніть довгі локальні запуски в timeout на хості, щоб зависання транспорту Parallels не
    поглинало решту вікна тестування:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Скрипт записує вкладені журнали ліній у `/tmp/openclaw-parallels-npm-update.*`.
    Перегляньте `windows-update.log`, `macos-update.log` або `linux-update.log`,
    перш ніж вважати, що зовнішня обгортка зависла.
  - Оновлення Windows може витрачати 10–15 хвилин на post-update doctor/runtime
    dependency repair на холодній guest-системі; це все ще нормально, якщо вкладений
    журнал npm debug просувається.
  - Не запускайте цю агреговану обгортку паралельно з окремими smoke-лініями Parallels
    для macOS, Windows або Linux. Вони спільно використовують стан VM і можуть конфліктувати під час
    відновлення snapshot, роздачі package або стану guest gateway.
  - Доказ після оновлення запускає звичайну поверхню вбудованого plugin, оскільки
    capability facades, такі як мовлення, генерація зображень і
    розуміння медіа, завантажуються через вбудовані runtime API, навіть коли сам
    agent turn перевіряє лише просту текстову відповідь.

- `pnpm openclaw qa aimock`
  - Запускає лише локальний сервер провайдера AIMock для прямого smoke-тестування протоколу.
- `pnpm openclaw qa matrix`
  - Запускає live QA lane Matrix проти тимчасового homeserver Tuwunel на базі Docker.
  - Цей QA host наразі призначений лише для репозиторію/розробки. Встановлені пакети OpenClaw не постачають
    `qa-lab`, тож вони не надають `openclaw qa`.
  - Checkout репозиторію безпосередньо завантажують вбудований runner; окремий крок встановлення plugin не потрібен.
  - Піднімає трьох тимчасових користувачів Matrix (`driver`, `sut`, `observer`) плюс одну приватну кімнату, а потім запускає дочірній QA gateway з реальним plugin Matrix як транспортом SUT.
  - За замовчуванням використовує закріплений стабільний образ Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Перевизначайте через `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, коли потрібно протестувати інший образ.
  - Matrix не надає спільних прапорців джерела облікових даних, оскільки лінія локально створює тимчасових користувачів.
  - Записує звіт Matrix QA, summary, артефакт observed-events і комбінований журнал виводу stdout/stderr у `.artifacts/qa-e2e/...`.
  - За замовчуванням виводить прогрес і застосовує жорсткий timeout запуску через `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (за замовчуванням 30 хвилин). Очищення обмежується `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS`, а збої включають команду відновлення `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Запускає live Telegram QA lane проти реальної приватної групи, використовуючи токени бота driver і SUT з env.
  - Потребує `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` і `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Ідентифікатор групи має бути числовим Telegram chat id.
  - Підтримує `--credential-source convex` для спільних пулів облікових даних. За замовчуванням використовуйте режим env або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, щоб увімкнути орендовані спільні облікові дані.
  - Завершується з ненульовим кодом, якщо будь-який сценарій зазнає збою. Використовуйте `--allow-failures`, коли
    хочете отримати артефакти без коду завершення з помилкою.
  - Потребує двох різних ботів в одній приватній групі, причому бот SUT має мати Telegram username.
  - Для стабільного спостереження бот-до-бота увімкніть режим Bot-to-Bot Communication Mode в `@BotFather` для обох ботів і переконайтеся, що бот driver може спостерігати трафік ботів у групі.
  - Записує звіт Telegram QA, summary і артефакт observed-messages у `.artifacts/qa-e2e/...`. Сценарії з відповідями включають RTT від запиту на надсилання driver до спостережуваної відповіді SUT.

Live transport lanes мають один стандартний контракт, щоб нові транспорти не розходилися в поведінці:

`qa-channel` залишається широким синтетичним набором QA і не є частиною матриці покриття live transport.

| Лінія    | Canary | Обмеження згадок | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за реакціями | Команда help |
| -------- | ------ | ---------------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | ------------ |
| Matrix   | x      | x                | x                    | x                         | x                             | x                          | x               | x                          |              |
| Telegram | x      |                  |                      |                           |                               |                            |                 |                            | x            |

### Спільні облікові дані Telegram через Convex (v1)

Коли для `openclaw qa telegram` увімкнено `--credential-source convex` (або `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
qa-lab отримує ексклюзивну оренду з пулу на базі Convex, надсилає Heartbeat
для цієї оренди, поки лінія виконується, і звільняє оренду під час завершення роботи.

Еталонний каркас проєкту Convex:

- `qa/convex-credential-broker/`

Обов’язкові env-змінні:

- `OPENCLAW_QA_CONVEX_SITE_URL` (наприклад, `https://your-deployment.convex.site`)
- Один секрет для вибраної ролі:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` для `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` для `ci`
- Вибір ролі облікових даних:
  - CLI: `--credential-role maintainer|ci`
  - Значення env за замовчуванням: `OPENCLAW_QA_CREDENTIAL_ROLE` (у CI за замовчуванням `ci`, інакше `maintainer`)

Необов’язкові env-змінні:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (за замовчуванням `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (за замовчуванням `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (за замовчуванням `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (за замовчуванням `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (за замовчуванням `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (необов’язковий trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` дозволяє loopback URL Convex `http://` лише для локальної розробки.

`OPENCLAW_QA_CONVEX_SITE_URL` у звичайному режимі роботи має використовувати `https://`.

Адміністративні команди для мейнтейнерів (додавання/видалення/перелік пулу) потребують
саме `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Допоміжні CLI-команди для мейнтейнерів:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Використовуйте `doctor` перед live-запусками, щоб перевірити URL сайту Convex, секрети broker,
префікс endpoint, HTTP timeout і досяжність admin/list без виведення
значень секретів. Використовуйте `--json` для машиночитного виводу в скриптах і
утилітах CI.

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
- `admin/add` перевіряє цю форму для `kind: "telegram"` і відхиляє некоректні payload.

### Додавання каналу до QA

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Адаптер транспорту для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний простір верхнього рівня, якщо спільний хост `qa-lab` може
обслуговувати цей потік.

`qa-lab` відповідає за спільну хостову механіку:

- кореневий простір команд `openclaw qa`
- запуск і завершення набору
- concurrency worker
- запис артефактів
- генерацію звітів
- виконання сценаріїв
- сумісні alias для старіших сценаріїв `qa-channel`

Runner plugins відповідають за транспортний контракт:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як налаштовується gateway для цього транспорту
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії на основі транспорту
- як обробляються специфічні для транспорту скидання або очищення

Мінімальний поріг прийняття для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному хостовому шві `qa-lab`.
3. Залишайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Монтуйте runner як `openclaw qa <runner>`, а не реєструйте конкуруючу кореневу команду.
   Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`.
   Залишайте `runtime-api.ts` легким; ліниве виконання CLI і runner має залишатися за окремими entrypoint.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте наявні alias сумісності працездатними, якщо тільки репозиторій не виконує навмисну міграцію.

Правило прийняття рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, залишайте її в цьому runner plugin або harness plugin.
- Якщо сценарію потрібна нова можливість, яку можуть використовувати кілька каналів, додайте загальний helper замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для цього транспорту й явно позначайте це в контракті сценарію.

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

Нова робота над каналами має використовувати загальні назви helper.
Alias сумісності існують, щоб уникнути міграції «в один день», а не як модель для
створення нових сценаріїв.

## Набори тестів (що де запускається)

Сприймайте набори як «зростаючий реалізм» (і зростаючу нестабільність/вартість):

### Unit / integration (за замовчуванням)

- Команда: `pnpm test`
- Конфігурація: нетаргетовані запуски використовують набір шардів `vitest.full-*.config.ts` і можуть розгортати multi-project shards у конфігурації для окремих проєктів для паралельного планування
- Файли: інвентарі core/unit у `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` і дозволені node-тести `ui`, охоплені `vitest.unit.config.ts`
- Обсяг:
  - Чисті unit-тести
  - In-process integration-тести (автентифікація gateway, маршрутизація, tooling, парсинг, config)
  - Детерміновані регресії для відомих багів
- Очікування:
  - Запускається в CI
  - Реальні ключі не потрібні
  - Має бути швидким і стабільним

<AccordionGroup>
  <Accordion title="Проєкти, шарди та scoped lanes">

    - Нетаргетований `pnpm test` запускає дванадцять менших конфігурацій shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) замість одного великого native root-project process. Це зменшує піковий RSS на завантажених машинах і не дає роботі auto-reply/extension витісняти інші набори.
    - `pnpm test --watch` усе ще використовує native root `vitest.config.ts` project graph, оскільки цикл спостереження multi-shard непрактичний.
    - `pnpm test`, `pnpm test:watch` і `pnpm test:perf:imports` спочатку маршрутизують явні цілі файлів/каталогів через scoped lanes, тож `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` уникає повної вартості запуску root project.
    - `pnpm test:changed` розгортає змінені git-шляхи в ті самі scoped lanes, коли diff торкається лише routable файлів source/test; редагування config/setup усе ще повертаються до широкого повторного запуску root-project.
    - `pnpm check:changed` — це звичайний розумний локальний gate для вузької роботи. Він класифікує diff на core, core tests, extensions, extension tests, apps, docs, метадані release і tooling, а потім запускає відповідні лінії typecheck/lint/test. Зміни в публічному Plugin SDK і plugin-contract включають один прохід валідації extension, оскільки extensions залежать від цих контрактів core. Версійні зміни лише в метаданих release запускають цільові перевірки version/config/root-dependency замість повного набору, із захистом, який відхиляє зміни package поза полем версії верхнього рівня.
    - Легкі за імпортом unit-тести з agents, commands, plugins, helper auto-reply, `plugin-sdk` та подібних чистих службових ділянок маршрутизуються через lane `unit-fast`, яка пропускає `test/setup-openclaw-runtime.ts`; stateful/runtime-heavy файли залишаються на наявних лініях.
    - Вибрані helper source-файли `plugin-sdk` і `commands` також зіставляють запуски в режимі changed з явними sibling tests у цих легких lanes, тож редагування helper уникають повторного запуску повного важкого набору для цього каталогу.
    - `auto-reply` має три окремі кошики: helper верхнього рівня core, integration-тести верхнього рівня `reply.*` і піддерево `src/auto-reply/reply/**`. Це утримує найважчу роботу harness reply подалі від дешевих тестів status/chunk/token.

  </Accordion>

  <Accordion title="Покриття embedded runner">

    - Коли ви змінюєте входи виявлення message-tool або runtime-контекст Compaction,
      зберігайте обидва рівні покриття.
    - Додавайте цільові регресії helper для чистих меж маршрутизації та
      нормалізації.
    - Підтримуйте інтеграційні набори embedded runner у здоровому стані:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` і
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Ці набори перевіряють, що scoped ids і поведінка compaction і надалі проходять
      через реальні шляхи `run.ts` / `compact.ts`; тести лише helper
      не є достатньою заміною для цих integration-шляхів.

  </Accordion>

  <Accordion title="Значення за замовчуванням для Vitest pool та isolation">

    - Базова конфігурація Vitest за замовчуванням використовує `threads`.
    - Спільна конфігурація Vitest фіксує `isolate: false` і використовує
      non-isolated runner у root projects, e2e та live config.
    - Коренева лінія UI зберігає свої `jsdom` setup і optimizer, але також працює на
      спільному non-isolated runner.
    - Кожен shard `pnpm test` успадковує ті самі значення за замовчуванням `threads` + `isolate: false` зі спільної конфігурації Vitest.
    - `scripts/run-vitest.mjs` за замовчуванням додає `--no-maglev` для дочірніх Node-процесів Vitest,
      щоб зменшити churn компіляції V8 під час великих локальних запусків.
      Установіть `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, щоб порівняти зі стандартною
      поведінкою V8.

  </Accordion>

  <Accordion title="Швидка локальна ітерація">

    - `pnpm changed:lanes` показує, які архітектурні лінії зачіпає diff.
    - Хук pre-commit виконує лише форматування. Він повторно індексує відформатовані файли і
      не запускає lint, typecheck або тести.
    - Явно запускайте `pnpm check:changed` перед передачею роботи або push, коли вам
      потрібен розумний локальний gate. Зміни в публічному Plugin SDK і plugin-contract
      включають один прохід валідації extension.
    - `pnpm test:changed` маршрутизує через scoped lanes, коли змінені шляхи
      однозначно відповідають меншому набору.
    - `pnpm test:max` і `pnpm test:changed:max` зберігають ту саму поведінку маршрутизації,
      лише з вищою межею кількості worker.
    - Автомасштабування локальних worker навмисно консервативне і зменшує навантаження,
      коли середнє навантаження хоста вже високе, тож кілька одночасних
      запусків Vitest за замовчуванням завдають менше шкоди.
    - Базова конфігурація Vitest позначає проєкти/конфігураційні файли як
      `forceRerunTriggers`, щоб повторні запуски в режимі changed залишалися коректними, коли змінюється зв’язування тестів.
    - Конфігурація тримає `OPENCLAW_VITEST_FS_MODULE_CACHE` увімкненим на підтримуваних
      хостах; установіть `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, якщо хочете
      мати одну явну локацію кешу для прямого профілювання.

  </Accordion>

  <Accordion title="Налагодження продуктивності">

    - `pnpm test:perf:imports` вмикає звіти Vitest про тривалість імпорту плюс
      вивід деталізації імпорту.
    - `pnpm test:perf:imports:changed` звужує той самий профілювальний вигляд до
      файлів, змінених відносно `origin/main`.
    - Якщо один «гарячий» тест усе ще витрачає більшість часу на стартові імпорти,
      тримайте важкі залежності за вузьким локальним швом `*.runtime.ts` і
      мокайте цей шов безпосередньо замість глибоких імпортів runtime helper лише
      для того, щоб передати їх через `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` порівнює маршрутизований
      `test:changed` із native root-project шляхом для цього зафіксованого
      diff і виводить wall time плюс macOS max RSS.
    - `pnpm test:perf:changed:bench -- --worktree` виконує benchmark поточного
      брудного дерева, маршрутизуючи список змінених файлів через
      `scripts/test-projects.mjs` і кореневу конфігурацію Vitest.
    - `pnpm test:perf:profile:main` записує профіль CPU основного потоку для
      накладних витрат запуску та трансформації Vitest/Vite.
    - `pnpm test:perf:profile:runner` записує профілі CPU+heap раннера для
      unit-набору з вимкненим паралелізмом файлів.

  </Accordion>
</AccordionGroup>

### Стабільність (gateway)

- Команда: `pnpm test:stability:gateway`
- Конфігурація: `vitest.gateway.config.ts`, примусово один worker
- Обсяг:
  - Запускає реальний loopback Gateway з увімкненою діагностикою за замовчуванням
  - Проганяє синтетичне churn повідомлень gateway, пам’яті та великих payload через шлях діагностичних подій
  - Виконує запити до `diagnostics.stability` через WS RPC Gateway
  - Охоплює helper збереження пакета стабільності діагностики
  - Перевіряє, що recorder залишається обмеженим, синтетичні вибірки RSS залишаються в межах бюджету тиску, а глибини черг по сесіях повертаються до нуля
- Очікування:
  - Безпечно для CI і без ключів
  - Вузька лінія для подальшої роботи над регресіями стабільності, а не заміна повного набору Gateway

### E2E (gateway smoke)

- Команда: `pnpm test:e2e`
- Конфігурація: `vitest.e2e.config.ts`
- Файли: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` і bundled-plugin E2E-тести в `extensions/`
- Значення runtime за замовчуванням:
  - Використовує Vitest `threads` з `isolate: false`, як і решта репозиторію.
  - Використовує adaptive workers (CI: до 2, локально: 1 за замовчуванням).
  - За замовчуванням працює в silent mode, щоб зменшити накладні витрати на I/O консолі.
- Корисні перевизначення:
  - `OPENCLAW_E2E_WORKERS=<n>`, щоб примусово задати кількість worker (не більше 16).
  - `OPENCLAW_E2E_VERBOSE=1`, щоб знову ввімкнути докладний вивід у консоль.
- Обсяг:
  - End-to-end поведінка gateway з кількома екземплярами
  - Поверхні WebSocket/HTTP, pairинг Node і важче мережеве навантаження
- Очікування:
  - Запускається в CI (коли увімкнено в pipeline)
  - Реальні ключі не потрібні
  - Більше рухомих частин, ніж у unit-тестах (може бути повільніше)

### E2E: smoke OpenShell backend

- Команда: `pnpm test:e2e:openshell`
- Файл: `extensions/openshell/src/backend.e2e.test.ts`
- Обсяг:
  - Запускає ізольований gateway OpenShell на хості через Docker
  - Створює sandbox із тимчасового локального Dockerfile
  - Перевіряє OpenShell backend OpenClaw через реальні `sandbox ssh-config` + SSH exec
  - Перевіряє remote-canonical поведінку файлової системи через sandbox fs bridge
- Очікування:
  - Лише за явним увімкненням; не входить до стандартного запуску `pnpm test:e2e`
  - Потребує локального CLI `openshell` і працездатного демона Docker
  - Використовує ізольовані `HOME` / `XDG_CONFIG_HOME`, а потім знищує тестовий gateway і sandbox
- Корисні перевизначення:
  - `OPENCLAW_E2E_OPENSHELL=1`, щоб увімкнути тест під час ручного запуску ширшого e2e-набору
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, щоб вказати нестандартний двійковий файл CLI або wrapper script

### Live (реальні провайдери + реальні моделі)

- Команда: `pnpm test:live`
- Конфігурація: `vitest.live.config.ts`
- Файли: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` і bundled-plugin live-тести в `extensions/`
- За замовчуванням: **увімкнено** через `pnpm test:live` (встановлює `OPENCLAW_LIVE_TEST=1`)
- Обсяг:
  - «Чи справді цей провайдер/модель працює _сьогодні_ з реальними обліковими даними?»
  - Виявлення змін формату провайдера, особливостей виклику tool, проблем автентифікації та поведінки rate limit
- Очікування:
  - Навмисно нестабільно для CI (реальні мережі, реальні політики провайдерів, квоти, збої)
  - Коштує грошей / витрачає rate limit
  - Краще запускати звужені підмножини, а не «все»
- Live-запуски зчитують `~/.profile`, щоб підхопити відсутні API key.
- За замовчуванням live-запуски все ще ізолюють `HOME` і копіюють config/auth матеріали в тимчасовий test home, щоб unit-фікстури не могли змінити ваш реальний `~/.openclaw`.
- Установлюйте `OPENCLAW_LIVE_USE_REAL_HOME=1` лише тоді, коли навмисно хочете, щоб live-тести використовували ваш реальний домашній каталог.
- `pnpm test:live` тепер за замовчуванням використовує тихіший режим: він зберігає вивід прогресу `[live] ...`, але приховує додаткове повідомлення `~/.profile` і приглушує журнали bootstrap Gateway/шум Bonjour. Установіть `OPENCLAW_LIVE_TEST_QUIET=0`, якщо хочете повернути повні журнали запуску.
- Ротація API key (залежно від провайдера): установлюйте `*_API_KEYS` у форматі з комами/крапками з комою або `*_API_KEY_1`, `*_API_KEY_2` (наприклад `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) або перевизначення для live через `OPENCLAW_LIVE_*_KEY`; тести повторюють спробу у відповідь на rate limit.
- Вивід прогресу/Heartbeat:
  - Live-набори тепер надсилають рядки прогресу в stderr, щоб було видно, що довгі виклики провайдера активні, навіть коли захоплення консолі Vitest тихе.
  - `vitest.live.config.ts` вимикає перехоплення консолі Vitest, тож рядки прогресу провайдера/Gateway одразу передаються під час live-запусків.
  - Налаштовуйте Heartbeat прямих моделей через `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Налаштовуйте Heartbeat Gateway/probe через `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Який набір мені запускати?

Використовуйте цю таблицю рішень:

- Редагування логіки/тестів: запускайте `pnpm test` (і `pnpm test:coverage`, якщо змінили багато)
- Зміни в мережевій взаємодії gateway / WS protocol / pairинг: додайте `pnpm test:e2e`
- Налагодження «мій бот не працює» / збоїв, специфічних для провайдера / виклику tool: запускайте звужений `pnpm test:live`

## Live (мережеві) тести

Для live model matrix, smoke CLI backend, smoke ACP, harness Codex app-server
і всіх live-тестів медіапровайдерів (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — а також для обробки облікових даних під час live-запусків — див.
[Тестування — live-набори](/uk/help/testing-live).

## Ранери Docker (необов’язкові перевірки «працює в Linux»)

Ці ранери Docker поділяються на дві групи:

- Ранери live-model: `test:docker:live-models` і `test:docker:live-gateway` запускають лише відповідний live-файл з profile-key усередині Docker-образу репозиторію (`src/agents/models.profiles.live.test.ts` і `src/gateway/gateway-models.profiles.live.test.ts`), монтують ваш локальний каталог config і workspace (і зчитують `~/.profile`, якщо його змонтовано). Відповідні локальні entrypoint — `test:live:models-profiles` і `test:live:gateway-profiles`.
- Docker live runners за замовчуванням мають меншу межу smoke, щоб повний Docker sweep залишався практичним:
  `test:docker:live-models` за замовчуванням використовує `OPENCLAW_LIVE_MAX_MODELS=12`, а
  `test:docker:live-gateway` — `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` і
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Перевизначайте ці env-змінні, коли
  явно хочете ширший вичерпний прогін.
- `test:docker:all` один раз збирає live Docker image через `test:docker:live-build`, а потім повторно використовує його для live Docker lanes. Він також збирає один спільний образ `scripts/e2e/Dockerfile` через `test:docker:e2e-build` і повторно використовує його для контейнерних E2E smoke runners, які перевіряють зібраний застосунок. Агрегат використовує зважений локальний планувальник: `OPENCLAW_DOCKER_ALL_PARALLELISM` керує слотами процесів, тоді як обмеження ресурсів не дають важким live-, npm-install- і multi-service-лініям стартувати одночасно. Значення за замовчуванням: 10 слотів, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` і `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; налаштовуйте `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` або `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` лише тоді, коли хост Docker має більший запас ресурсів. За замовчуванням раннер виконує preflight Docker, видаляє застарілі контейнери OpenClaw E2E, друкує стан кожні 30 секунд, зберігає час успішних ліній у `.artifacts/docker-tests/lane-timings.json` і використовує ці значення часу, щоб на наступних запусках стартувати довші лінії раніше. Використовуйте `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, щоб надрукувати зважений маніфест ліній без збирання або запуску Docker.
- Контейнерні smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` і `test:docker:config-reload` підіймають один або кілька реальних контейнерів і перевіряють інтеграційні шляхи вищого рівня.

Ранери Docker для live-model також монтують лише потрібні auth home зовнішнього CLI (або всі підтримувані, якщо запуск не звужено), а потім копіюють їх у домашній каталог контейнера перед запуском, щоб зовнішній CLI OAuth міг оновлювати токени, не змінюючи auth store хоста:

- Прямі моделі: `pnpm test:docker:live-models` (скрипт: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (скрипт: `scripts/test-live-acp-bind-docker.sh`)
- Smoke CLI backend: `pnpm test:docker:live-cli-backend` (скрипт: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness Codex app-server: `pnpm test:docker:live-codex-harness` (скрипт: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + dev agent: `pnpm test:docker:live-gateway` (скрипт: `scripts/test-live-gateway-models-docker.sh`)
- Smoke Open WebUI live: `pnpm test:docker:openwebui` (скрипт: `scripts/e2e/openwebui-docker.sh`)
- Wizard онбордингу (TTY, повне scaffolding): `pnpm test:docker:onboard` (скрипт: `scripts/e2e/onboard-docker.sh`)
- Smoke онбордингу/channel/agent з npm tarball: `pnpm test:docker:npm-onboard-channel-agent` глобально встановлює запакований tarball OpenClaw у Docker, налаштовує OpenAI через onboarding на основі env-ref плюс Telegram за замовчуванням, перевіряє, що doctor відновлює runtime deps активованого plugin, і виконує один змоканий agent turn OpenAI. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть повторне збирання на хості через `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` або перемкніть канал через `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke глобальної інсталяції Bun: `bash scripts/e2e/bun-global-install-smoke.sh` пакує поточне дерево, встановлює його через `bun install -g` в ізольований home і перевіряє, що `openclaw infer image providers --json` повертає вбудованих image-провайдерів, а не зависає. Повторно використовуйте попередньо зібраний tarball через `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, пропустіть збирання на хості через `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` або скопіюйте `dist/` із зібраного Docker image через `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke інсталятора Docker: `bash scripts/test-install-sh-docker.sh` використовує один спільний кеш npm для своїх контейнерів root, update і direct-npm. Smoke оновлення за замовчуванням бере npm `latest` як стабільний baseline перед оновленням до tarball-кандидата. Перевірки інсталятора без root зберігають ізольований кеш npm, щоб записи кешу, що належать root, не маскували поведінку локальної інсталяції користувача. Установіть `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, щоб повторно використовувати кеш root/update/direct-npm між локальними повторними запусками.
- Install Smoke у CI пропускає дубльоване пряме глобальне оновлення npm через `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; запускайте скрипт локально без цього env, коли потрібне покриття прямого `npm install -g`.
- Мережа Gateway (два контейнери, WS auth + health): `pnpm test:docker:gateway-network` (скрипт: `scripts/e2e/gateway-network-docker.sh`)
- Регресія мінімального reasoning для OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (скрипт: `scripts/e2e/openai-web-search-minimal-docker.sh`) запускає змоканий сервер OpenAI через Gateway, перевіряє, що `web_search` підвищує `reasoning.effort` з `minimal` до `low`, потім примусово викликає відхилення схеми провайдера і перевіряє, що необроблені деталі з’являються в журналах Gateway.
- Міст каналу MCP (засіяний Gateway + stdio bridge + smoke необробленого notification-frame Claude): `pnpm test:docker:mcp-channels` (скрипт: `scripts/e2e/mcp-channels-docker.sh`)
- Інструменти MCP пакета Pi (реальний stdio MCP server + smoke allow/deny вбудованого профілю Pi): `pnpm test:docker:pi-bundle-mcp-tools` (скрипт: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Очищення MCP Cron/subagent (реальний Gateway + завершення дочірнього stdio MCP після ізольованих запусків cron і одноразового subagent): `pnpm test:docker:cron-mcp-cleanup` (скрипт: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke інсталяції + alias `/plugin` + семантика перезапуску Claude-bundle): `pnpm test:docker:plugins` (скрипт: `scripts/e2e/plugins-docker.sh`)
- Smoke незмінного оновлення Plugin: `pnpm test:docker:plugin-update` (скрипт: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke метаданих перезавантаження config: `pnpm test:docker:config-reload` (скрипт: `scripts/e2e/config-reload-source-docker.sh`)
- Runtime deps вбудованого plugin: `pnpm test:docker:bundled-channel-deps` за замовчуванням збирає невеликий Docker runner image, один раз збирає і пакує OpenClaw на хості, а потім монтує цей tarball у кожен сценарій Linux install. Повторно використовуйте image через `OPENCLAW_SKIP_DOCKER_BUILD=1`, пропустіть повторне збирання на хості після свіжого локального збирання через `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` або вкажіть наявний tarball через `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Повний Docker-агрегат попередньо пакує цей tarball один раз, а потім розшардовує перевірки вбудованих каналів у незалежні лінії, зокрема окремі лінії оновлення для Telegram, Discord, Slack, Feishu, memory-lancedb і ACPX. Використовуйте `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, щоб звузити матрицю каналів під час прямого запуску лінії вбудованих каналів, або `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, щоб звузити сценарій оновлення. Лінія також перевіряє, що `channels.<id>.enabled=false` і `plugins.entries.<id>.enabled=false` пригнічують відновлення doctor/runtime-dependency.
- Звужуйте runtime deps вбудованого plugin під час ітерацій, вимикаючи не пов’язані сценарії, наприклад:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Щоб вручну попередньо зібрати і повторно використати спільний образ built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Специфічні для набору перевизначення image, такі як `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, усе одно мають пріоритет, якщо задані. Коли `OPENCLAW_SKIP_DOCKER_BUILD=1` вказує на віддалений спільний image, скрипти завантажують його, якщо його ще немає локально. Docker-тести QR та installer зберігають власні Dockerfile, тому що вони перевіряють поведінку package/install, а не спільний runtime built-app.

Ранери Docker для live-model також монтують поточний checkout лише для читання і
розміщують його в тимчасовий робочий каталог усередині контейнера. Це дозволяє
зберігати runtime image компактним, але водночас запускати Vitest проти ваших точних локальних source/config.
Етап розміщення пропускає великі локальні кеші та результати збирання застосунків, такі як
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` і локальні для застосунків каталоги `.build` або
результати Gradle, щоб live-запуски Docker не витрачали хвилини на копіювання
машинно-специфічних артефактів.
Вони також встановлюють `OPENCLAW_SKIP_CHANNELS=1`, щоб live-probe Gateway не запускали
реальні worker каналів Telegram/Discord тощо всередині контейнера.
`test:docker:live-models` усе ще запускає `pnpm test:live`, тож також передавайте
`OPENCLAW_LIVE_GATEWAY_*`, коли вам потрібно звузити або виключити coverage Gateway
live з цієї Docker-лінії.
`test:docker:openwebui` — це smoke сумісності вищого рівня: він запускає
контейнер Gateway OpenClaw з увімкненими OpenAI-compatible HTTP endpoint,
запускає закріплений контейнер Open WebUI проти цього gateway, входить через
Open WebUI, перевіряє, що `/api/models` показує `openclaw/default`, а потім надсилає
реальний chat-запит через проксі Open WebUI `/api/chat/completions`.
Перший запуск може бути помітно повільнішим, оскільки Docker може знадобитися завантажити
image Open WebUI, а Open WebUI може потребувати завершення власного холодного запуску.
Ця лінія очікує придатний ключ live-моделі, а `OPENCLAW_PROFILE_FILE`
(за замовчуванням `~/.profile`) є основним способом передати його в Dockerized-запусках.
Успішні запуски друкують невеликий JSON payload на кшталт `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` навмисно є детермінованим і не потребує
реального облікового запису Telegram, Discord або iMessage. Він запускає засіяний контейнер Gateway,
стартує другий контейнер, який запускає `openclaw mcp serve`, а потім
перевіряє маршрутизоване виявлення розмов, читання транскриптів, метадані вкладень,
поведінку черги live-подій, маршрутизацію вихідного надсилання, а також сповіщення у стилі Claude про канал +
дозволи через реальний stdio MCP bridge. Перевірка сповіщень
безпосередньо інспектує необроблені кадри stdio MCP, тож smoke перевіряє те, що
міст насправді надсилає, а не лише те, що випадково показує певний SDK клієнта.
`test:docker:pi-bundle-mcp-tools` є детермінованим і не потребує
реального ключа live-моделі. Він збирає Docker image репозиторію, запускає реальний stdio MCP probe server
усередині контейнера, матеріалізує цей сервер через вбудований runtime MCP пакета Pi,
виконує tool, а потім перевіряє, що `coding` і `messaging` зберігають
інструменти `bundle-mcp`, тоді як `minimal` і `tools.deny: ["bundle-mcp"]` їх фільтрують.
`test:docker:cron-mcp-cleanup` є детермінованим і не потребує реального
ключа live-моделі. Він запускає засіяний Gateway з реальним stdio MCP probe server, виконує
ізольований хід cron і дочірній одноразовий хід `/subagents spawn`, а потім перевіряє,
що дочірній процес MCP завершується після кожного запуску.

Ручний smoke plain-language thread для ACP (не CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Зберігайте цей скрипт для регресійних сценаріїв/налагодження. Він може знову знадобитися для перевірки маршрутизації тредів ACP, тож не видаляйте його.

Корисні env-змінні:

- `OPENCLAW_CONFIG_DIR=...` (за замовчуванням: `~/.openclaw`) монтується в `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (за замовчуванням: `~/.openclaw/workspace`) монтується в `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (за замовчуванням: `~/.profile`) монтується в `/home/node/.profile` і зчитується перед запуском тестів
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, щоб перевіряти лише env-змінні, зчитані з `OPENCLAW_PROFILE_FILE`, використовуючи тимчасові каталоги config/workspace і без монтування зовнішньої auth зовнішніх CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`) монтується в `/home/node/.npm-global` для кешованих встановлень CLI усередині Docker
- Каталоги/файли auth зовнішніх CLI у `$HOME` монтуються лише для читання під `/host-auth...`, а потім копіюються в `/home/node/...` перед стартом тестів
  - Каталоги за замовчуванням: `.minimax`
  - Файли за замовчуванням: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Звужені запуски провайдерів монтують лише потрібні каталоги/файли, виведені з `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Перевизначайте вручну через `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` або список через кому, наприклад `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, щоб звузити запуск
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, щоб фільтрувати провайдерів усередині контейнера
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, щоб повторно використати наявний image `openclaw:local-live` для повторних запусків, які не потребують нового збирання
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб гарантувати, що облікові дані беруться зі сховища profile (а не з env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, щоб вибрати модель, яку gateway показує для smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, щоб перевизначити nonce-check prompt, який використовує smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, щоб перевизначити закріплений тег image Open WebUI

## Перевірка документації

Запускайте перевірки документації після редагування docs: `pnpm check:docs`.
Запускайте повну перевірку anchor у Mintlify, коли вам також потрібні перевірки заголовків усередині сторінки: `pnpm docs:check-links:anchors`.

## Офлайнова регресія (безпечно для CI)

Це регресії «реального pipeline» без реальних провайдерів:

- Виклик tool через Gateway (змоканий OpenAI, реальний цикл gateway + agent): `src/gateway/gateway.test.ts` (випадок: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, примусовий запис config + auth): `src/gateway/gateway.test.ts` (випадок: "runs wizard over ws and writes auth token config")

## Оцінювання надійності агента (Skills)

Ми вже маємо кілька безпечних для CI тестів, які поводяться як «оцінювання надійності агента»:

- Моканий виклик tool через реальний цикл gateway + agent (`src/gateway/gateway.test.ts`).
- End-to-end потоки wizard, які перевіряють зв’язування сесії та ефекти config (`src/gateway/gateway.test.ts`).

Чого ще бракує для Skills (див. [Skills](/uk/tools/skills)):

- **Decisioning:** коли Skills перелічені в prompt, чи вибирає агент правильний Skill (або уникає нерелевантних)?
- **Compliance:** чи читає агент `SKILL.md` перед використанням і чи виконує обов’язкові кроки/args?
- **Workflow contracts:** multi-turn сценарії, які перевіряють порядок tool, перенесення історії сесії та межі sandbox.

Майбутні eval насамперед мають залишатися детермінованими:

- Runner сценаріїв, що використовує mock-провайдерів для перевірки викликів tool + їх порядку, читання файлів skill і зв’язування сесій.
- Невеликий набір сценаріїв, зосереджених на Skills (використовувати чи уникати, gating, prompt injection).
- Необов’язкові live eval (opt-in, із керуванням через env) лише після того, як буде готовий набір, безпечний для CI.

## Contract-тести (форма plugin і channel)

Contract-тести перевіряють, що кожен зареєстрований plugin і channel відповідає своєму
інтерфейсному контракту. Вони проходять по всіх виявлених plugin і запускають набір
перевірок форми та поведінки. Лінія unit за замовчуванням `pnpm test`
навмисно пропускає ці файли спільних seam і smoke; явно запускайте команди contract,
коли торкаєтесь спільних поверхонь channel або provider.

### Команди

- Усі контракти: `pnpm test:contracts`
- Лише контракти channel: `pnpm test:contracts:channels`
- Лише контракти provider: `pnpm test:contracts:plugins`

### Контракти channel

Розміщені в `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Базова форма plugin (id, name, capabilities)
- **setup** - Контракт wizard налаштування
- **session-binding** - Поведінка прив’язування сесії
- **outbound-payload** - Структура payload повідомлення
- **inbound** - Обробка вхідних повідомлень
- **actions** - Обробники дій channel
- **threading** - Обробка ID тредів
- **directory** - API каталогу/реєстру
- **group-policy** - Забезпечення групової політики

### Контракти статусу provider

Розміщені в `src/plugins/contracts/*.contract.test.ts`.

- **status** - Проби статусу channel
- **registry** - Форма реєстру plugin

### Контракти provider

Розміщені в `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Контракт потоку auth
- **auth-choice** - Вибір/селектор auth
- **catalog** - API каталогу моделей
- **discovery** - Виявлення plugin
- **loader** - Завантаження plugin
- **runtime** - Runtime provider
- **shape** - Форма/інтерфейс plugin
- **wizard** - Wizard налаштування

### Коли запускати

- Після зміни експортів або підшляхів plugin-sdk
- Після додавання або зміни channel чи provider plugin
- Після рефакторингу реєстрації або виявлення plugin

Contract-тести запускаються в CI і не потребують реальних API key.

## Додавання регресій (рекомендації)

Коли ви виправляєте проблему provider/model, виявлену в live:

- Додайте безпечну для CI регресію, якщо це можливо (mock/stub provider або фіксація точної трансформації форми запиту)
- Якщо проблема за своєю природою лише live (rate limit, політики auth), залишайте live-тест вузьким і opt-in через env-змінні
- Віддавайте перевагу найменшому рівню, який виявляє баг:
  - баг перетворення/повторення запиту provider → direct models test
  - баг у pipeline сесії/історії/tool gateway → gateway live smoke або безпечний для CI mock-тест gateway
- Захисне обмеження обходу SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` виводить одну вибіркову ціль на клас SecretRef з метаданих реєстру (`listSecretTargetRegistryEntries()`), а потім перевіряє, що exec id сегментів обходу відхиляються.
  - Якщо ви додаєте нову родину цілей SecretRef `includeInPlan` у `src/secrets/target-registry-data.ts`, оновіть `classifyTargetClass` у цьому тесті. Тест навмисно падає на некласифікованих target id, щоб нові класи не можна було тихо пропустити.

## Пов’язане

- [Testing live](/uk/help/testing-live)
- [CI](/uk/ci)
