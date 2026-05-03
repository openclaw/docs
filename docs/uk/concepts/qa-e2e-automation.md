---
read_when:
    - Розуміння того, як взаємодіє QA-стек
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Створення реалістичнішої автоматизації QA навколо панелі керування Gateway
summary: 'Огляд стека QA: qa-lab, qa-channel, сценарії на основі репозиторію, live-лінії транспорту, транспортні адаптери та звітування.'
title: Огляд QA
x-i18n:
    generated_at: "2026-05-03T20:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw реалістичнішим,
канально-орієнтованим способом, ніж це може зробити один модульний тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, гілки,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI відлагоджувача та шина QA для спостереження за транскриптом,
  ін'єкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери live-транспортів, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до і після наживо для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають псевдоніми скриптів `pnpm qa:*`;
підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                     |
| `qa suite`                                          | Запустити сценарії з репозиторію проти lane QA gateway. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                              |
| `qa coverage`                                       | Надрукувати Markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                      |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентний звіт про паритет.                                                                                      |
| `qa character-eval`                                 | Запустити character QA scenario на кількох live-моделях зі звітом із судженням. Див. [Звітування](#reporting).                                                        |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраного lane провайдера/моделі.                                                                                                   |
| `qa ui`                                             | Запустити UI відлагоджувача QA та локальну шину QA (псевдонім: `pnpm qa:lab:ui`).                                                                                      |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                      |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA dashboard + gateway lane.                                                                                                      |
| `qa up`                                             | Зібрати QA site, запустити стек на Docker і надрукувати URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Запустити лише сервер AIMock provider.                                                                                                                                 |
| `qa mock-openai`                                    | Запустити лише сервер scenario-aware `mock-openai` provider.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                        |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                           |
| `qa discord`                                        | Live transport lane проти реального приватного каналу guild Discord.                                                                                                   |
| `qa mantis`                                         | Runner для перевірки до і після для помилок live-транспорту, з першим сценарієм Discord status-reactions. Див. [Mantis](/uk/concepts/mantis).                            |

## Потік оператора

Поточний операторський потік QA — це двопанельний QA site:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує транскрипт у стилі Slack і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA site, запускає gateway lane на Docker і відкриває сторінку
QA Lab, де оператор або automation loop може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без перезбирання Docker-образу щоразу
запустіть стек із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mounts
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при змінах, а браузер автоматично перезавантажується, коли змінюється
хеш ресурсів QA Lab.

Для локального smoke OpenTelemetry trace запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не мають експортувати `StreamAbandoned` на успішних ходах; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається лише для source checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не виконують команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для lane transport-real Matrix smoke запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цього lane містяться в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він provision одноразовий Tuwunel homeserver у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix Plugin усередині дочірнього QA gateway, обмеженого цим transport (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, артефакт observed-events і комбінований output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram і Discord smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Обидва націлені на вже наявний реальний канал із двома ботами (driver + SUT). Обов'язкові env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані в [довіднику QA для Telegram і Discord](#telegram-and-discord-qa-reference) нижче.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує endpoint settings і перевіряє доступність admin/list, коли maintainer secret присутній. Для secrets він повідомляє лише статус set/missing.

## Покриття live transport

Live transport lanes мають один спільний контракт замість того, щоб кожен вигадував власну форму списку сценаріїв. `qa-channel` — це широка синтетична suite поведінки продукту й не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Це зберігає `qa-channel` як широку suite поведінки продукту, тоді як Matrix,
Telegram і майбутні live transports мають один явний checklist транспортного контракту.

Для одноразового lane Linux VM без внесення Docker у шлях QA запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий Multipass, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA report і
summary назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Host і Multipass suite runs за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість workers, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду завершення з помилкою.
Live runs передають підтримувані QA auth inputs, практичні для
guest: provider keys на основі env, шлях до QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest
міг записувати назад через mounted workspace.

## Довідник QA для Telegram і Discord

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і provisioning homeserver на Docker. Telegram і Discord менші — кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхній довідник міститься тут.

### Спільні CLI flags

Обидва lanes реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові flags:

| Прапор                               | Типове значення                                           | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи розв'язуються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                     | Тимчасовий id облікового запису всередині конфігурації QA gateway.                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                             |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                                | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                  | Швидкий режим провайдера там, де підтримується.                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                     | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                            | Роль, що використовується, коли `--credential-source convex`.                                                         |

Обидва завершуються з ненульовим кодом виходу за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу як помилкового.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома окремими ботами (драйвер + SUT). SUT-бот повинен мати ім'я користувача Telegram; спостереження bot-to-bot працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов'язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий id чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов'язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень (типово редагує).

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
- `telegram-qa-summary.json` — включає RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал guild Discord із двома ботами: бот-драйвер, керований harness, і SUT-бот, запущений дочірнім OpenClaw gateway через вбудований Discord plugin. Перевіряє обробку згадок каналу, те, що SUT-бот зареєстрував нативну команду `/help` у Discord, і opt-in сценарії доказів Mantis.

Обов'язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з id користувача SUT-бота, який повертає Discord (інакше lane швидко завершується з помилкою).

Необов'язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на завжди ввімкнені відповіді guild лише через tools із `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу реакцій REST плюс візуальний артефакт HTML/PNG.

Запустити сценарій реакцій статусу Mantis явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Вихідні артефакти:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій реакцій статусу.

### Пул облікових даних Convex

Lane Telegram і Discord можуть орендувати облікові дані зі спільного пулу Convex замість читання env vars вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї Heartbeat протягом виконання та звільняє її під час завершення. Типи пулу — `"telegram"` і `"discord"`.

Форми payload, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні env vars і контракт endpoint брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика брокера однакова для обох типів).

## Seeds на основі репозиторію

Seed-активи розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимим і для людей, і для
агента.

`qa-lab` має залишатися універсальним runner для markdown. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов'язкові метадані категорії, capability, lane і ризику
- посилання на docs і code
- необов'язкові вимоги до plugin
- необов'язковий patch конфігурації gateway
- виконуваний `qa-flow`

Повторно використовувана runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, markdown-сценарії можуть поєднувати helpers транспортної сторони
з helpers браузерної сторони, які керують вбудованим Control UI через
Gateway `browser.request` seam без додавання runner для спеціального випадку.

Файли сценаріїв слід групувати за capability продукту, а не за папкою дерева
джерел. Зберігайте ID сценаріїв стабільними, коли файли переміщуються; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб покривати:

- DM і чат каналу
- поведінку thread
- життєвий цикл дій із повідомленнями
- callbacks Cron
- пригадування пам'яті
- перемикання моделей
- передавання subagent
- читання репозиторію та читання docs
- одне невелике завдання збірки, як-от Lobster Invaders

## Mock lanes провайдера

`qa suite` має дві локальні mock lanes провайдера:

- `mock-openai` — сценарно-обізнаний mock OpenClaw. Він залишається типовою
  детермінованою mock lane для QA на основі репозиторію та parity gates.
- `aimock` запускає сервер провайдера на базі AIMock для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює диспетчер сценаріїв `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделі gateway,
потребами staged auth-profile і прапорами capability live/mock. Спільний код suite і
gateway має маршрутизувати через registry провайдера замість розгалуження за
іменами провайдерів.

## Транспортні адаптери

`qa-lab` володіє універсальним transport seam для markdown QA-сценаріїв. `qa-channel` — перший адаптер на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання транспортно-специфічного QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, concurrency worker, записом артефактів і звітністю.
- Транспортний адаптер володіє конфігурацією gateway, готовністю, inbound і outbound спостереженням, транспортними діями та нормалізованим транспортним станом.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає повторно використовувану runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий QA command верхнього рівня, коли спільний хост `qa-lab` може володіти flow.

`qa-lab` володіє спільною механікою хоста:

- корінь команди `openclaw qa`
- запуск і teardown suite
- concurrency worker
- запис артефактів
- генерація звіту
- виконання сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway конфігурується для цього транспорту
- як перевіряється готовність
- як вводяться inbound-події
- як спостерігаються outbound-повідомлення
- як transcripts і нормалізований транспортний стан надаються назовні
- як виконуються дії, підтримувані транспортом
- як обробляється транспортно-специфічне скидання або очищення

Мінімальна планка adoption для нового каналу:

1. Зберігайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте транспортно-специфічну механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root command. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних директоріях `qa/scenarios/`.
6. Використовуйте універсальні helpers сценаріїв для нових сценаріїв.
7. Зберігайте наявні compatibility aliases робочими, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішень суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більше ніж один канал, додайте універсальний helper замість гілки, специфічної для каналу, у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій транспортно-специфічним і зробіть це явним у контракті сценарію.

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

Сумісні псевдоніми залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але для написання нових сценаріїв слід використовувати загальні назви. Псевдоніми існують, щоб уникнути міграції в один день, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує протокольний Markdown-звіт зі спостережуваної часової шкали шини.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Щоб отримати інвентар доступних сценаріїв — корисний під час оцінювання обсягу подальшої роботи або підключення нового транспорту — виконайте `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).

Для перевірок характеру й стилю запустіть той самий сценарій для кількох живих
референсів моделей і запишіть оцінений Markdown-звіт:

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

Команда запускає локальні дочірні процеси QA Gateway, а не Docker. Сценарії оцінювання
характеру мають задавати персону через `SOUL.md`, а потім виконувати звичайні ходи
користувача, як-от чат, допомога з робочою областю та невеликі файлові завдання. Моделі-кандидату
не слід повідомляти, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить моделі-судді в швидкому режимі з
міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: промпт судді все одно отримує
кожен транскрипт і статус запуску, але референси кандидатів замінюються нейтральними
мітками, як-от `candidate-01`; після парсингу звіт зіставляє рейтинги назад із реальними референсами.
Запуски кандидатів за замовчуванням використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших оцінювальних референсів OpenAI, які це підтримують. Перевизначте конкретного кандидата вбудовано за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` досі задає
глобальний резервний варіант, а старіша форма `--model-thinking <provider/model=level>`
збережена для сумісності.
Референси кандидатів OpenAI за замовчуванням використовують швидкий режим, щоб там,
де провайдер це підтримує, застосовувалася пріоритетна обробка. Додайте `,fast`, `,no-fast` або `,fast=false` вбудовано, коли
окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості кандидатів і суддів
записуються у звіт для бенчмарк-аналізу, але промпти суддів явно вказують
не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера чи навантаження на локальний Gateway
роблять запуск надто шумним.
Коли не передано жодного кандидата `--model`, оцінювання характеру за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли не передано `--judge-model`, судді за замовчуванням такі:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Матричне QA](/uk/concepts/qa-matrix)
- [Канал QA](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
