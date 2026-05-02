---
read_when:
    - Розуміння того, як складові QA-стека поєднуються між собою
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова QA-автоматизації з вищим рівнем реалістичності навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, живі транспортні лінії, транспортні адаптери та звітування.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-02T20:01:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичніший,
канально-орієнтований спосіб, ніж це може зробити один модульний тест.

Поточні частини:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, ланцюжка,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача та QA-шина для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner plugins: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                     |
| `qa suite`                                          | Запускає сценарії з репозиторію проти QA Gateway lane. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                               |
| `qa coverage`                                       | Друкує markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                           |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний звіт про паритет.                                                                                        |
| `qa character-eval`                                 | Запускає сценарій QA персонажа на кількох live-моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                     |
| `qa manual`                                         | Запускає одноразовий prompt проти вибраної provider/model lane.                                                                                                        |
| `qa ui`                                             | Запускає UI налагоджувача QA та локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                        |
| `qa docker-build-image`                             | Збирає попередньо підготовлений Docker-образ QA.                                                                                                                       |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для QA dashboard + gateway lane.                                                                                                       |
| `qa up`                                             | Збирає QA-сайт, запускає Docker-backed стек, друкує URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).     |
| `qa aimock`                                         | Запускає лише сервер AIMock provider.                                                                                                                                  |
| `qa mock-openai`                                    | Запускає лише scenario-aware сервер provider `mock-openai`.                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                           |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                           |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                   |

## Потік оператора

Поточний потік оператора QA — це двопанельний QA-сайт:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-backed gateway lane і відкриває сторінку
QA Lab, де оператор або automation loop може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записати, що спрацювало, що не вдалося або
що залишилося заблокованим.

Для швидшої ітерації UI QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle під час змін, а браузер автоматично перезавантажується, коли змінюється хеш
ресурсів QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не повинні експортувати `StreamAbandoned` на успішних ходах; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час зміни diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог profile/scenario, env vars і схема артефактів для цієї lane описані в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він provision-ить одноразовий Tuwunel homeserver у Docker, реєструє тимчасових driver/SUT/observer users, запускає реальний Matrix Plugin усередині дочірнього QA Gateway, обмеженого цим transport (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, артефакт observed-events і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram і Discord smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Обидві працюють із наявним реальним каналом із двома ботами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані в [довіднику QA для Telegram і Discord](#telegram-and-discord-qa-reference) нижче.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env Convex broker, validates endpoint settings і verifies admin/list reachability, коли присутній maintainer secret. Для секретів він повідомляє лише статус set/missing.

## Покриття live transport

Live transport lanes використовують один спільний контракт замість того, щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний suite product behavior і він не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Це залишає `qa-channel` широким suite для product behavior, тоді як Matrix,
Telegram і майбутні live transports мають один явний checklist transport-contract.

Для disposable Linux VM lane без включення Docker у QA path запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий Multipass guest, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA-звіт і
summary назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски suite на host і Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість workers, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
вам потрібні артефакти без failing exit code.
Live runs передають підтримувані QA auth inputs, практичні для
guest: provider keys на основі env, path до QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest
міг записувати назад через mounted workspace.

## Довідник QA для Telegram і Discord

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed homeserver provisioning. Telegram і Discord менші — по кілька сценаріїв кожен, без profile system, проти наявних реальних каналів — тому їхній довідник міститься тут.

### Спільні CLI flags

Обидві lanes реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі flags:

| Прапорець                             | За замовчуванням                                          | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Куди записуються звіти, зведення, спостережені повідомлення та вихідний журнал. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Корінь репозиторію під час запуску з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                     | Тимчасовий ідентифікатор облікового запису в конфігурації QA Gateway.                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                           |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                                | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                  | Швидкий режим провайдера там, де підтримується.                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                     | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                            | Роль, що використовується, коли `--credential-source convex`.                                                         |

Обидві команди завершуються з ненульовим кодом виходу за будь-якого невдалого сценарію. `--allow-failures` записує артефакти, не встановлюючи код виходу помилки.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома різними ботами (драйвер + SUT). Бот SUT повинен мати ім’я користувача Telegram; спостереження «бот-до-бота» працює найкраще, коли для обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий ідентифікатор чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень (за замовчуванням редагує).

Сценарії (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Вихідні артефакти:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з канаркового сценарію.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал гільдії Discord із двома ботами: драйвер-ботом, яким керує тестовий каркас, і ботом SUT, запущеним дочірнім OpenClaw Gateway через вбудований Discord Plugin. Перевіряє обробку згадок у каналі та те, що бот SUT зареєстрував власну команду `/help` у Discord.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача бота SUT, який повертає Discord (інакше лінія швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Вихідні артефакти:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Лінії Telegram і Discord можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом усього запуску та звільняє її під час завершення. Типи пулу: `"telegram"` і `"discord"`.

Форми корисного навантаження, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні змінні середовища та контракт кінцевої точки брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика брокера однакова для обох типів).

## Початкові дані з репозиторію

Ресурси початкових даних містяться в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися універсальним виконувачем markdown. Кожен файл сценарію markdown є
джерелом істини для одного тестового запуску та має визначати:

- метадані сценарію
- необов’язкові метадані категорії, можливості, лінії та ризику
- посилання на документацію й код
- необов’язкові вимоги до Plugin
- необов’язковий патч конфігурації Gateway
- виконуваний `qa-flow`

Поверхня багаторазового runtime, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, сценарії markdown можуть поєднувати помічники на боці транспорту
з помічниками на боці браузера, які керують вбудованим Control UI через
шов Gateway `browser.request` без додавання спеціалізованого виконувача.

Файли сценаріїв слід групувати за можливістю продукту, а не за папкою дерева
джерел. Зберігайте стабільні ідентифікатори сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- приватний чат і чат каналу
- поведінку тредів
- життєвий цикл дії з повідомленням
- зворотні виклики Cron
- пригадування пам’яті
- перемикання моделей
- передавання підпорядкованому агенту
- читання репозиторію та читання документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Лінії моків провайдера

`qa suite` має дві локальні лінії моків провайдера:

- `mock-openai` — це сценарно-обізнаний мок OpenClaw. Він залишається типовою
  детермінованою мок-лінією для QA з репозиторію та гейтів паритету.
- `aimock` запускає сервер провайдера на базі AIMock для експериментального покриття
  протоколу, фікстур, запису/відтворення та chaos. Він є додатковим і не
  замінює диспетчер сценаріїв `mock-openai`.

Реалізація ліній провайдера розміщена в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделей Gateway,
потребами підготовки auth-profile та прапорцями можливостей live/mock. Спільний код набору та
Gateway має маршрутизуватися через реєстр провайдерів, а не розгалужуватися за
іменами провайдерів.

## Адаптери транспорту

`qa-lab` володіє універсальним транспортним швом для markdown-сценаріїв QA. `qa-channel` — перший адаптер на цьому шві, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають під’єднуватися до того самого виконувача набору, а не додавати виконувач QA, специфічний для транспорту.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, конкурентністю воркерів, записом артефактів і звітуванням.
- Транспортний адаптер володіє конфігурацією Gateway, готовністю, спостереженням вхідних і вихідних подій, транспортними діями та нормалізованим станом транспорту.
- Файли сценаріїв markdown у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий корінь команди QA верхнього рівня, коли спільний хост `qa-lab` може володіти потоком.

`qa-lab` володіє спільною механікою хоста:

- корінь команди `openclaw qa`
- запуск і завершення набору
- конкурентність воркерів
- запис артефактів
- створення звітів
- виконання сценаріїв
- сумісні псевдоніми для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як ін’єктуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, підтримані транспортом
- як обробляється скидання або очищення, специфічне для транспорту

Мінімальна планка прийняття для нового каналу:

1. Зберігайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному хост-шві `qa-lab`.
3. Тримайте механіку, специфічну для транспорту, всередині runner plugin або каркаса каналу.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ліниве виконання CLI та runner має залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте універсальні помічники сценаріїв для нових сценаріїв.
7. Зберігайте роботу наявних сумісних псевдонімів, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, тримайте її в цьому runner plugin або каркасі Plugin.
- Якщо сценарій потребує нової можливості, яку може використовувати більше ніж один канал, додайте універсальний помічник замість розгалуження, специфічного для каналу, у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, тримайте сценарій специфічним для транспорту та зробіть це явним у контракті сценарію.

### Назви помічників сценаріїв

Бажані універсальні помічники для нових сценаріїв:

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

Сумісні псевдоніми залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати універсальні назви. Псевдоніми існують, щоб уникнути одномоментної міграції, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостереженої часової лінії шини.
Звіт має відповідати:

- Що спрацювало
- Що не вдалося
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Щоб отримати інвентар доступних сценаріїв — корисний під час оцінювання обсягу подальшої роботи або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).

Для перевірок характеру та стилю запустіть той самий сценарій на кількох робочих референсах моделей
і запишіть оцінений звіт Markdown:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Команда запускає дочірні процеси локального QA Gateway, а не Docker. Сценарії оцінювання характеру
мають задавати персону через `SOUL.md`, а потім виконувати звичайні користувацькі ходи,
як-от чат, допомогу з робочим простором і невеликі файлові завдання. Модель-кандидат
не має знати, що її оцінюють. Команда зберігає кожну повну
стенограму, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з
міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, атмосферою та гумором.
Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: підказка для судді все одно отримує
кожну стенограму й статус запуску, але референси кандидатів замінюються нейтральними
мітками, такими як `candidate-01`; після розбору звіт зіставляє ранжування з реальними
референсами.
Запуски кандидатів типово використовують рівень мислення `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших оцінювальних референсів OpenAI, які його підтримують. Перевизначте окремого кандидата вбудовано за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` і далі задає
глобальний запасний варіант, а старішу форму `--model-thinking <provider/model=level>`
збережено для сумісності.
Референси кандидатів OpenAI типово використовують швидкий режим, щоб пріоритетна обробка застосовувалася там, де
провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` вбудовано, коли
окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли потрібно
примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалість роботи кандидатів і суддів
записується у звіт для аналізу бенчмарків, але підказки для суддів явно вказують
не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів типово використовують паралельність 16. Зменште
`--concurrency` або `--judge-concurrency`, коли обмеження провайдера чи навантаження на локальний Gateway
роблять запуск надто шумним.
Коли не передано жодного кандидата `--model`, оцінювання характеру типово використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли не передано жодного `--model`.
Коли не передано жодного `--judge-model`, суддями типово є
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Матричне QA](/uk/concepts/qa-matrix)
- [Канал QA](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
