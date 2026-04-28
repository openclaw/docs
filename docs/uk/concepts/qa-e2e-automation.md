---
read_when:
    - Розуміння того, як працюють разом компоненти QA-стека
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова QA-автоматизації з вищим рівнем реалістичності навколо панелі керування Gateway
summary: 'Огляд QA-стеку: qa-lab, qa-channel, сценарії на основі репозиторію, транспортні лінії в реальному часі, транспортні адаптери та звітування.'
title: Огляд QA
x-i18n:
    generated_at: "2026-04-28T11:09:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичніший,
канально-подібний спосіб, ніж це може зробити один модульний тест.

Поточні частини:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, потоку,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача й шина QA для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових
  QA-сценаріїв.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                       |
| `qa suite`                                          | Запустити сценарії з репозиторію проти смуги QA Gateway. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                 |
| `qa coverage`                                       | Надрукувати markdown-інвентар покриття сценаріями (`--json` для машинного виводу).                                                                                          |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентний звіт parity-gate.                                                                                    |
| `qa character-eval`                                 | Запустити character QA-сценарій на кількох live-моделях із оціненим звітом. Див. [Звітування](#reporting).                                                           |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної смуги провайдера/моделі.                                                                                                         |
| `qa ui`                                             | Запустити UI налагоджувача QA та локальну шину QA (аліас: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                                    |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA-панелі + смуги Gateway.                                                                                                   |
| `qa up`                                             | Зібрати QA-сайт, запустити стек на Docker, надрукувати URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Запустити лише сервер провайдера AIMock.                                                                                                                                 |
| `qa mock-openai`                                    | Запустити лише scenario-aware сервер провайдера `mock-openai`.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                              |
| `qa matrix`                                         | Смуга live-транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                     |
| `qa telegram`                                       | Смуга live-транспорту проти реальної приватної групи Telegram.                                                                                                             |
| `qa discord`                                        | Смуга live-транспорту проти реального приватного каналу гільдії Discord.                                                                                                      |

## Потік оператора

Поточний потік оператора QA — це двопанельний QA-сайт:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає смугу Gateway на Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту
QA-місію, спостерігати реальну поведінку каналу й записувати, що спрацювало, що не вдалося або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при змінах, а браузер автоматично перезавантажується, коли змінюється hash ресурсів QA Lab.

Для локального smoke-тесту OpenTelemetry trace запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний приймач trace OTLP/HTTP, виконує
QA-сценарій `otel-trace-smoke` з увімкненим plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критичну для релізу форму:
мають бути присутні `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery`;
виклики моделі не мають експортувати `StreamAbandoned` на успішних ходах; сирі діагностичні ID та
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається лише для source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release-смуги не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час зміни diagnostics
instrumentation.

Для transport-real smoke-смуги Matrix запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і схема артефактів для цієї смуги наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона provision-ить одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix plugin усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-зведення, артефакт observed-events і обʼєднаний output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real smoke-смуг Telegram і Discord:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Обидві націлені на попередньо наявний реальний канал із двома ботами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, output artifacts і пул облікових даних Convex задокументовані в [довіднику QA для Telegram і Discord](#telegram-and-discord-qa-reference) нижче.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє доступність admin/list, коли присутній maintainer secret. Для secrets він повідомляє лише статус set/missing.

## Покриття live-транспорту

Смуги live-транспорту мають спільний контракт замість того, щоб кожна винаходила власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний suite продуктової поведінки, і він не входить до матриці покриття live-транспорту.

| Смуга     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Це зберігає `qa-channel` як широкий suite продуктової поведінки, тоді як Matrix,
Telegram і майбутні live-транспорти мають спільний явний checklist транспортного контракту.

Для одноразової смуги Linux VM без залучення Docker у QA-шлях запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий guest Multipass, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA-звіт і
зведення назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски suite на host і Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими worker-ами Gateway. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість worker-ів, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, якщо будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
потрібні артефакти без failing exit code.
Live-запуски передають підтримувані QA auth inputs, практичні для
guest: provider keys з env, шлях до QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` у межах кореня репозиторію, щоб guest
міг записувати назад через mounted workspace.

## Довідник QA для Telegram і Discord

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed provision homeserver. Telegram і Discord менші — кілька сценаріїв кожен, без системи профілів, проти попередньо наявних реальних каналів — тому їхній довідник наведено тут.

### Спільні CLI flags

Обидві смуги реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові flags:

| Прапорець                             | Типове значення                                           | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи розв’язуються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Корінь репозиторію під час виклику з нейтрального поточного робочого каталогу.                                       |
| `--sut-account <id>`                  | `sut`                                                     | Тимчасовий ідентифікатор облікового запису в конфігурації QA Gateway.                                                |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                            |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                                | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                  | Швидкий режим провайдера, де підтримується.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                     | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                            | Роль, що використовується, коли `--credential-source convex`.                                                         |

Обидві команди завершуються з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення як помилкового.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома різними ботами (драйвер + SUT). Бот SUT повинен мати ім’я користувача Telegram; спостереження між ботами працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий ідентифікатор чату (рядок).
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
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал гільдії Discord із двома ботами: ботом-драйвером, керованим harness, і ботом SUT, запущеним дочірнім Gateway OpenClaw через вбудований Plugin Discord. Перевіряє обробку згадок каналу та те, що бот SUT зареєстрував нативну команду `/help` у Discord.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача бота SUT, поверненим Discord (інакше lane швидко завершується помилкою).

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

Обидві lane, Telegram і Discord, можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом виконання й звільняє її під час завершення. Типи пулу: `"telegram"` і `"discord"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути рядком числового chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні змінні середовища та контракт endpoint broker Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу з’явилася до підтримки Discord; семантика broker однакова для обох типів).

## Seeds з репозиторію

Seed-ресурси розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має лишатися універсальним runner для Markdown. Кожен файл сценарію Markdown є джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane і ризику
- посилання на документацію та код
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Повторно використовувана runtime-поверхня, що підтримує `qa-flow`, може лишатися універсальною та наскрізною. Наприклад, сценарії Markdown можуть поєднувати transport-side helpers із browser-side helpers, які керують вбудованим Control UI через шов Gateway `browser.request` без додавання спеціального runner.

Файли сценаріїв слід групувати за продуктовою capability, а не за папкою дерева вихідного коду. Зберігайте стабільні ідентифікатори сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для простежуваності реалізації.

Базовий список має лишатися достатньо широким, щоб покривати:

- DM і чат каналу
- поведінку thread
- життєвий цикл дій із повідомленнями
- callback-и Cron
- згадування з пам’яті
- перемикання моделей
- передачу subagent
- читання репозиторію та документації
- одне невелике build-завдання, наприклад Lobster Invaders

## Lane моків провайдерів

`qa suite` має дві локальні lane моків провайдерів:

- `mock-openai` — сценарно-обізнаний мок OpenClaw. Він лишається типовою детермінованою lane моків для QA з репозиторію та parity gates.
- `aimock` запускає сервер провайдера на базі AIMock для експериментального протоколу, fixture, record/replay і chaos-покриття. Він є додатковим і не замінює диспетчер сценаріїв `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`. Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделі Gateway, потребами staging для auth-profile і прапорцями live/mock capability. Спільний код suite і gateway має маршрутизувати через реєстр провайдерів, а не розгалужуватися за назвами провайдерів.

## Transport adapters

`qa-lab` володіє універсальним transport seam для сценаріїв QA Markdown. `qa-channel` є першим adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, паралельністю worker, записом артефактів і звітуванням.
- Transport adapter володіє конфігурацією Gateway, готовністю, вхідним і вихідним спостереженням, transport actions і нормалізованим transport state.
- Файли сценаріїв Markdown у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає повторно використовувану runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до системи QA Markdown потребує рівно двох речей:

1. Transport adapter для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA-командний root верхнього рівня, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільними механіками host:

- коренем команди `openclaw qa`
- запуском і teardown suite
- паралельністю worker
- записом артефактів
- генеруванням звіту
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють transport contract:

- як `openclaw qa <runner>` монтується під спільним root `qa`
- як Gateway налаштовується для цього transport
- як перевіряється готовність
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований transport state
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальна планка впровадження для нового каналу:

1. Залишити `qa-lab` власником спільного root `qa`.
2. Реалізувати transport runner на спільному host seam `qa-lab`.
3. Тримати transport-specific механіки всередині runner plugin або channel harness.
4. Монтувати runner як `openclaw qa <runner>` замість реєстрації конкурентної root command. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI та виконання runner мають лишатися за окремими entrypoints.
5. Створити або адаптувати сценарії Markdown у тематичних директоріях `qa/scenarios/`.
6. Використовувати універсальні helpers сценаріїв для нових сценаріїв.
7. Зберігати наявні compatibility aliases робочими, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більш ніж один канал, додайте універсальний helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного transport, тримайте сценарій transport-specific і зробіть це явним у контракті сценарію.

### Назви helpers сценаріїв

Бажані універсальні helpers для нових сценаріїв:

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

Compatibility aliases лишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати універсальні назви. Ці aliases існують, щоб уникнути одночасної міграції всього, а не як модель надалі.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостереженої timeline bus.
Звіт має відповідати:

- Що спрацювало
- Що не спрацювало
- Що лишилося заблокованим
- Які follow-up сценарії варто додати

Щоб отримати інвентар доступних сценаріїв — корисний, коли оцінюєте обсяг подальшої роботи або підключаєте новий транспорт, — виконайте `pnpm openclaw qa coverage` (додайте `--json` для машиночитаного виводу).

Для перевірок характеру й стилю запустіть той самий сценарій на кількох live-посиланнях моделей
і запишіть оцінений Markdown-звіт:

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
мають задавати персону через `SOUL.md`, а потім виконувати звичайні ходи користувача,
як-от чат, допомога з робочою областю та невеликі файлові завдання. Моделі-кандидату
не слід повідомляти, що її оцінюють. Команда зберігає кожну повну
стенограму, записує базову статистику запуску, а потім просить моделі-суддів у fast-режимі з
`xhigh` reasoning, де це підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: підказка судді все одно отримує
кожну стенограму та статус запуску, але посилання кандидатів замінюються нейтральними
мітками на кшталт `candidate-01`; після розбору звіт зіставляє ранжування назад із реальними посиланнями.
Запуски кандидатів за замовчуванням використовують `high` thinking, з `medium` для GPT-5.5 і `xhigh`
для старіших eval-посилань OpenAI, які це підтримують. Перевизначте конкретного кандидата inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` і надалі задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` збережена
для сумісності.
Посилання кандидатів OpenAI за замовчуванням використовують fast-режим, щоб priority processing застосовувався там,
де провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово увімкнути fast-режим для кожної моделі-кандидата. Тривалості виконання кандидатів і суддів
записуються у звіті для бенчмарк-аналізу, але підказки суддям явно вказують
не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера чи навантаження на локальний Gateway
роблять запуск надто шумним.
Коли жоден кандидат `--model` не передано, оцінювання характеру за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли `--judge-model` не передано, судді за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
