---
read_when:
    - Розуміння того, як складові QA-стека поєднуються між собою
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання сценаріїв QA на основі репозиторію
    - Побудова реалістичнішої QA-автоматизації для панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії живого транспорту, транспортні адаптери та звітність.'
title: Огляд QA
x-i18n:
    generated_at: "2026-05-03T14:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34f7fe679845af5b9aca182b880ff4e797496ef1c4c56c23993d5e63f3035156
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw реалістичніше, у форматі каналів,
ніж це може зробити один модульний тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування й видалення.
- `extensions/qa-lab`: інтерфейс налагодження й шина QA для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні плагіни-запускачі: адаптери live-транспортів, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання й базових
  сценаріїв QA.
- [Mantis](/uk/concepts/mantis): перевірка до й після в live-середовищі для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази для PR.

## Поверхня команд

Кожен потік QA виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                     |
| `qa suite`                                          | Запустити сценарії з репозиторію проти смуги QA Gateway. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                 |
| `qa coverage`                                       | Вивести Markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                          |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентний звіт про паритет.                                                                                      |
| `qa character-eval`                                 | Запустити сценарій character QA на кількох live-моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                     |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної смуги провайдера/моделі.                                                                                                   |
| `qa ui`                                             | Запустити інтерфейс налагодження QA й локальну шину QA (аліас: `pnpm qa:lab:ui`).                                                                                       |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                       |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для панелі QA + смуги Gateway.                                                                                                        |
| `qa up`                                             | Зібрати сайт QA, запустити стек на базі Docker, вивести URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Запустити лише сервер провайдера AIMock.                                                                                                                               |
| `qa mock-openai`                                    | Запустити лише сценарно-обізнаний сервер провайдера `mock-openai`.                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                        |
| `qa matrix`                                         | Live-транспортна смуга проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                   |
| `qa telegram`                                       | Live-транспортна смуга проти реальної приватної групи Telegram.                                                                                                        |
| `qa discord`                                        | Live-транспортна смуга проти реального приватного каналу гільдії Discord.                                                                                              |
| `qa mantis`                                         | Запланований runner перевірки до й після для помилок live-транспортів. Див. [Mantis](/uk/concepts/mantis).                                                                |

## Потік оператора

Поточний операторський потік QA — це двопанельний QA-сайт:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає смугу Gateway на базі Docker і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу й зафіксувати, що спрацювало, що не вдалося або
що залишилося заблокованим.

Для швидшої ітерації інтерфейсу QA Lab без повторної збірки Docker-образу щоразу
запустіть стек із bind-mounted бандлом QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` залишає Docker-сервіси на попередньо зібраному образі й bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей бандл за зміни, а браузер автоматично перезавантажується, коли змінюється
хеш ресурсів QA Lab.

Для локального smoke-тесту трасування OpenTelemetry запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP-приймач трас, виконує
QA-сценарій `otel-trace-smoke` з увімкненим плагіном `diagnostics-otel`, потім
декодує експортовані protobuf span-и й перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
виклики моделі не повинні експортувати `StreamAbandoned` на успішних ходах; сирі діагностичні ID та
атрибути `openclaw.content.*` мають залишатися поза трасою. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому смуги пакетного Docker-релізу не виконують команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source-checkout, коли змінюєте інструментацію
діагностики.

Для transport-real smoke-смуги Matrix запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повна довідка CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цієї смуги містяться в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона provision-ить одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Plugin Matrix усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-зведення, артефакт observed-events і обʼєднаний журнал виводу в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real smoke-смуг Telegram і Discord:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Обидві націлені на вже наявний реальний канал із двома ботами (driver + SUT). Потрібні env vars, списки сценаріїв, вихідні артефакти й пул облікових даних Convex задокументовані в [довідці Telegram і Discord QA](#telegram-and-discord-qa-reference) нижче.

Перед використанням обʼєднаних у пул live-облікових даних запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє доступність admin/list, коли присутній secret супровідника. Для секретів він повідомляє лише статус set/missing.

## Покриття live-транспортів

Live-транспортні смуги спільно використовують один контракт, а не кожна вигадує власну форму списку сценаріїв. `qa-channel` — це широка синтетична suite для поведінки продукту, і вона не входить до матриці покриття live-транспортів.

| Смуга    | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Це зберігає `qa-channel` як широку suite поведінки продукту, тоді як Matrix,
Telegram і майбутні live-транспорти спільно використовують один явний checklist
транспортного контракту.

Для одноразової Linux VM-смуги без залучення Docker до QA-шляху запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжого гостя Multipass, установлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
зведення назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски suite на host і Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими worker-ами Gateway. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість worker-ів, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду виходу з помилкою.
Live-запуски передають підтримувані вхідні дані автентифікації QA, практичні для
гостя: provider keys на базі env, шлях до QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований workspace.

## Довідка Telegram і Discord QA

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і provisioning homeserver на базі Docker. Telegram і Discord менші — кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхня довідка розміщена тут.

### Спільні прапорці CLI

Обидві смуги реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапор                               | Типове значення                                           | Опис                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | —                                                         | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний лог. Відносні шляхи розв’язуються відносно `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                           | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                 | `sut`                                                     | Тимчасовий ідентифікатор облікового запису в конфігурації QA gateway.                                                 |
| `--provider-mode <mode>`             | `live-frontier`                                           | `mock-openai` або `live-frontier` (застарілий `live-openai` також працює).                                            |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                               | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                             | вимкнено                                                  | Швидкий режим провайдера там, де підтримується.                                                                       |
| `--credential-source <env\|convex>`  | `env`                                                     | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>` | `ci` у CI, інакше `maintainer`                            | Роль, що використовується, коли `--credential-source convex`.                                                         |

Обидва завершуються з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу з помилкою.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома різними ботами (driver + SUT). Бот SUT повинен мати ім’я користувача Telegram; спостереження bot-to-bot працює найкраще, коли для обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий chat id (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень (типово редагуються).

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
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання driver → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал guild Discord із двома ботами: ботом driver, керованим harness, і ботом SUT, який запускається дочірнім OpenClaw gateway через вбудований Plugin Discord. Перевіряє обробку згадок каналу та те, що бот SUT зареєстрував власну команду `/help` у Discord.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача бота SUT, поверненим Discord (інакше lane швидко завершується з помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Вихідні артефакти:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Обидві lane, Telegram і Discord, можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом виконання та звільняє її під час завершення роботи. Види пулу: `"telegram"` і `"discord"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні змінні середовища та контракт endpoint broker Convex наведені в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика broker однакова для обох видів).

## Seeds на основі репозиторію

Активи seed розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися універсальним runner для markdown. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane і ризику
- посилання на документацію та код
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, markdown-сценарії можуть поєднувати helper на боці транспорту
з helper на боці браузера, які керують вбудованим Control UI через
seam Gateway `browser.request` без додавання спеціалізованого runner.

Файли сценаріїв слід групувати за capability продукту, а не за папкою дерева
джерел. Зберігайте ідентифікатори сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для трасованості реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чат у DM і каналі
- поведінку thread
- життєвий цикл дій повідомлення
- callback Cron
- відтворення пам’яті
- перемикання моделей
- передавання subagent
- читання репозиторію та документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Mock-lane провайдера

`qa suite` має дві локальні mock-lane провайдера:

- `mock-openai` — це scenario-aware mock OpenClaw. Він залишається типовою
  детермінованою mock-lane для QA на основі репозиторію та parity gates.
- `aimock` запускає provider server на основі AIMock для експериментального покриття protocol,
  fixture, record/replay і chaos. Він є додатковим і не
  замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделі gateway,
потребами staging auth-profile та прапорами capability live/mock. Спільний suite і
код gateway мають маршрутизувати через provider registry замість розгалуження за
іменами провайдерів.

## Транспортні адаптери

`qa-lab` володіє універсальним транспортним seam для markdown-сценаріїв QA. `qa-channel` є першим адаптером на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого runner suite замість додавання transport-specific runner QA.

На архітектурному рівні поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, concurrency worker, записом артефактів і звітністю.
- Транспортний адаптер володіє конфігурацією gateway, готовністю, вхідним і вихідним спостереженням, транспортними діями та нормалізованим станом транспорту.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортний адаптер для каналу.
2. Пакет сценаріїв, що перевіряє контракт каналу.

Не додавайте новий верхньорівневий корінь команди QA, коли спільний хост `qa-lab` може володіти flow.

`qa-lab` володіє механікою спільного хоста:

- корінь команди `openclaw qa`
- запуск і teardown suite
- concurrency worker
- запис артефактів
- генерування звіту
- виконання сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway конфігурується для цього транспорту
- як перевіряється готовність
- як ін’єктуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований стан транспорту
- як виконуються дії на основі транспорту
- як обробляється transport-specific reset або cleanup

Мінімальний поріг adoption для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте transport-specific механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Зберігайте `runtime-api.ts` легким; lazy CLI та виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте універсальні helper сценаріїв для нових сценаріїв.
7. Підтримуйте наявні compatibility aliases, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більше ніж один канал, додайте універсальний helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій transport-specific і явно зазначте це в контракті сценарію.

### Назви helper сценаріїв

Бажані універсальні helper для нових сценаріїв:

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

Compatibility aliases залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але нове авторство сценаріїв має використовувати універсальні назви. Aliases існують, щоб уникнути flag-day міграції, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує markdown-звіт protocol зі спостереженої timeline bus.
Звіт має відповідати:

- Що спрацювало
- Що не вдалося
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Щоб отримати інвентар доступних сценаріїв — корисно для оцінювання обсягу подальшої роботи або під’єднання нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).

Для перевірок характеру та стилю запустіть той самий сценарій з кількома live model
refs і запишіть оцінений Markdown-звіт:

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

Команда запускає локальні дочірні процеси QA Gateway, а не Docker. Сценарії оцінювання характеру
мають задавати persona через `SOUL.md`, а потім виконувати звичайні ходи користувача,
як-от чат, допомога з робочим простором і невеликі файлові завдання. Моделі-кандидату не слід
повідомляти, що її оцінюють. Команда зберігає кожну повну
транскрипцію, записує базову статистику виконання, а потім просить моделі-суддів у fast mode з
міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, тональністю і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: підказка судді все одно отримує
кожну транскрипцію та статус запуску, але candidate refs замінюються нейтральними
мітками, як-от `candidate-01`; звіт після розбору зіставляє ранжування з реальними refs.
Запуски кандидатів типово використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які його підтримують. Перевизначте конкретного кандидата inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` досі задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` збережена
для сумісності.
OpenAI candidate refs типово використовують fast mode, щоб priority processing застосовувався там,
де провайдер його підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної моделі-кандидата. Тривалості виконання кандидатів і суддів
записуються у звіті для аналізу benchmark, але підказки суддям явно вказують
не ранжувати за швидкістю.
Запуски моделей-кандидатів і суддів типово використовують concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження на локальний Gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval типово використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли `--judge-model` не передано, судді типово використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Matrix QA](/uk/concepts/qa-matrix)
- [Канал QA](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
