---
read_when:
    - Розуміння того, як компоненти QA-стека працюють разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Створення QA-автоматизації з вищим рівнем реалістичності навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії реального транспорту, транспортні адаптери та звітування.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-03T22:25:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7553094890e20eb760df149ac8bd598048c023dc072743ffe2a8dd60d17382de
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у реалістичніший,
канально-орієнтований спосіб, ніж це може зробити один unit-тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI відлагоджувача й QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні плагіни-ранери: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-активи з репозиторію для стартового завдання й базових QA-сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до та після live-верифікації для помилок, яким
  потрібні реальні транспорти, скриншоти браузера, стан VM і докази для PR.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                        |
| `qa suite`                                          | Запустити сценарії з репозиторію проти лінії QA Gateway. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                    |
| `qa coverage`                                       | Вивести markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                              |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентський звіт про паритет.                                                                                        |
| `qa character-eval`                                 | Запустити character QA-сценарій на кількох live-моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                       |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної лінії провайдера/моделі.                                                                                                      |
| `qa ui`                                             | Запустити UI відлагоджувача QA та локальну QA-шину (аліас: `pnpm qa:lab:ui`).                                                                                              |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                          |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA-панелі + лінії Gateway.                                                                                                           |
| `qa up`                                             | Зібрати QA-сайт, запустити Docker-стек і вивести URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).              |
| `qa aimock`                                         | Запустити лише сервер провайдера AIMock.                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише сценарно-обізнаний сервер провайдера `mock-openai`.                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                           |
| `qa matrix`                                         | Лінія live-транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                       |
| `qa telegram`                                       | Лінія live-транспорту проти реальної приватної групи Telegram.                                                                                                            |
| `qa discord`                                        | Лінія live-транспорту проти реального приватного каналу guild Discord.                                                                                                    |
| `qa slack`                                          | Лінія live-транспорту проти реального приватного каналу Slack.                                                                                                            |
| `qa mantis`                                         | Ранер перевірки до та після для помилок live-транспорту з першим сценарієм статусних реакцій Discord. Див. [Mantis](/uk/concepts/mantis).                                   |

## Потік оператора

Поточний QA-потік оператора — це QA-сайт із двома панелями:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-лінію Gateway і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу й записати, що спрацювало, що
зламалося або що лишилося заблокованим.

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
перезбирає цей bundle за змін, а браузер автоматично перезавантажується, коли змінюється
asset hash QA Lab.

Для локального smoke OpenTelemetry trace запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим плагіном `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
виклики моделі не мають експортувати `StreamAbandoned` на успішних turns; сирі діагностичні ID та
атрибути `openclaw.content.*` мають лишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA лишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для транспортно-реальної smoke-лінії Matrix запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і layout артефактів для цієї лінії описані в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона provision-ить одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний плагін Matrix усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, артефакт observed-events і комбінований output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для транспортно-реальних smoke-ліній Telegram, Discord і Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома ботами (driver + SUT). Обов’язкові env vars, списки сценаріїв, output artifacts і пул облікових даних Convex задокументовані нижче в [Довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference).

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє доступність admin/list, коли присутній maintainer secret. Для secrets він повідомляє лише статус set/missing.

## Покриття live-транспорту

Лінії live-транспорту мають один спільний контракт, а не кожна винаходить власну форму списку сценаріїв. `qa-channel` — це ширший синтетичний suite поведінки продукту, і він не є частиною матриці покриття live-транспорту.

| Лінія    | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Це зберігає `qa-channel` як широкий suite поведінки продукту, тоді як Matrix,
Telegram і майбутні live-транспорти мають спільний явний checklist
транспортного контракту.

Для одноразової Linux VM-лінії без залучення Docker у QA-шлях запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
summary назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Host- і Multipass-запуски suite за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>` для налаштування
кількості workers або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій падає. Використовуйте `--allow-failures`, коли
потрібні артефакти без failing exit code.
Live-запуски передають підтримувані QA auth inputs, практичні для
гостя: env-based provider keys, шлях до QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed homeserver provisioning. Telegram, Discord і Slack менші — по кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхній довідник наведено тут.

### Спільні CLI flags

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі flags:

| Прапор                               | Типово                                                          | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та журнал виводу. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                           | Тимчасовий ідентифікатор облікового запису в конфігурації QA gateway.                                                |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                            |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                                      | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                        | Швидкий режим провайдера там, де він підтримується.                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                  | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна смуга завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу, що означає помилку.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома різними ботами (драйвер + SUT). SUT-бот повинен мати імʼя користувача Telegram; спостереження бот-бот найкраще працює, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обовʼязкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий ідентифікатор чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необовʼязково:

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

Артефакти виводу:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал гільдії Discord із двома ботами: ботом-драйвером, яким керує harness, і SUT-ботом, запущеним дочірнім OpenClaw gateway через вбудований Discord plugin. Перевіряє обробку згадок у каналі, що SUT-бот зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обовʼязкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача SUT-бота, який повертає Discord (інакше смуга швидко завершується помилкою).

Необовʼязково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Виконується самостійно, бо перемикає SUT на завжди ввімкнені відповіді гільдії лише через інструменти з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу REST-реакцій і візуальний артефакт HTML/PNG.

Запустіть сценарій status-reaction Mantis явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Артефакти виводу:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли виконується сценарій status-reaction.

### Slack QA

```bash
pnpm openclaw qa slack
```

Націлюється на один реальний приватний канал Slack із двома різними ботами: ботом-драйвером, яким керує harness, і SUT-ботом, запущеним дочірнім OpenClaw gateway через вбудований Slack plugin.

Обовʼязкові env, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необовʼязково:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Артефакти виводу:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Смуги Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання env vars вище. Передайте `--credential-source convex` (або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає heartbeat протягом виконання й звільняє її під час завершення роботи. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути рядком числового chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні env vars і контракт endpoint брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу зʼявилася до підтримки Discord; семантика брокера ідентична для обох типів).

## Seeds, підкріплені репозиторієм

Seed-ресурси розташовані в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися універсальним markdown runner. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необовʼязкові метадані категорії, можливості, смуги та ризику
- посилання на docs і code
- необовʼязкові вимоги до plugin
- необовʼязковий patch конфігурації gateway
- виконуваний `qa-flow`

Багаторазово використовувана runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, markdown-сценарії можуть поєднувати transport-side
помічники з browser-side помічниками, які керують вбудованим Control UI через
шов Gateway `browser.request` без додавання runner для спеціального випадку.

Файли сценаріїв слід групувати за продуктовою можливістю, а не за папкою
дерева джерел. Зберігайте ідентифікатори сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для трасованості реалізації.

Базовий список має залишатися достатньо широким, щоб покривати:

- DM і чат каналу
- поведінку thread
- життєвий цикл message action
- callbacks cron
- пригадування памʼяті
- перемикання моделей
- передавання subagent
- читання репозиторію та читання docs
- одне невелике build-завдання, наприклад Lobster Invaders

## Mock-смуги провайдерів

`qa suite` має дві локальні mock-смуги провайдерів:

- `mock-openai` — це scenario-aware OpenClaw mock. Він залишається типовою
  детермінованою mock-смугою для repo-backed QA і parity gates.
- `aimock` запускає AIMock-backed сервер провайдера для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює диспетчер сценаріїв `mock-openai`.

Реалізація provider-lane розташована в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделі gateway,
потребами staged auth-profile, а також live/mock capability flags. Спільний suite і
код gateway мають маршрутизуватися через registry провайдерів замість розгалуження за
іменами провайдерів.

## Transport adapters

`qa-lab` володіє універсальним transport seam для markdown QA сценаріїв. `qa-channel` є першим adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або synthetic channels мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На рівні архітектури розподіл такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, паралельністю worker, записом артефактів і звітністю.
- Transport adapter володіє конфігурацією gateway, readiness, inbound and outbound observation, transport actions і normalized transport state.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазово використовувану runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown QA system вимагає рівно двох речей:

1. Transport adapter для каналу.
2. Scenario pack, який перевіряє контракт каналу.

Не додавайте новий top-level QA command root, коли спільний хост `qa-lab` може володіти потоком.

`qa-lab` володіє спільною механікою хоста:

- command root `openclaw qa`
- запуск і teardown suite
- паралельність worker
- запис артефактів
- генерування звіту
- виконання сценаріїв
- aliases сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють transport contract:

- як `openclaw qa <runner>` монтується під спільним root `qa`
- як gateway налаштовується для цього transport
- як перевіряється readiness
- як injected inbound events
- як спостерігаються outbound messages
- як transcripts і normalized transport state доступні назовні
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальна планка впровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте виконавець транспорту на спільному стику хоста `qa-lab`.
3. Тримайте механіку, специфічну для транспорту, всередині Plugin виконавця або обв’язки каналу.
4. Змонтуйте виконавець як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Plugin-и виконавців мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ліниве виконання CLI і виконавця має лишатися за окремими точками входу.
5. Створіть або адаптуйте markdown-сценарії у тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте роботу наявних псевдонімів сумісності, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому Plugin виконавця або обв’язці Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більш ніж один канал, додайте загальну допоміжну функцію замість гілки, специфічної для каналу, у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій специфічним для транспорту й явно вкажіть це в контракті сценарію.

### Назви допоміжних функцій сценаріїв

Бажані загальні допоміжні функції для нових сценаріїв:

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

Псевдоніми сумісності лишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але для створення нових сценаріїв слід використовувати загальні назви. Псевдоніми існують, щоб уникнути одночасної міграції всього коду, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостережуваної часової шкали шини.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Для інвентаризації доступних сценаріїв — корисної під час оцінювання обсягу подальшої роботи або підключення нового транспорту — виконайте `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).

Для перевірок характеру та стилю виконайте той самий сценарій на кількох live model
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

Команда запускає дочірні процеси локального QA Gateway, а не Docker. Сценарії оцінювання характеру
мають задавати персону через `SOUL.md`, а потім виконувати звичайні ходи користувача,
як-от чат, допомогу з робочим простором і невеликі файлові завдання. Моделі-кандидату
не слід повідомляти, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з
міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: підказка судді все одно отримує
кожен транскрипт і статус запуску, але refs кандидатів замінюються нейтральними
мітками, як-от `candidate-01`; звіт зіставляє рейтинги назад із реальними refs після
розбору.
Запуски кандидатів за замовчуванням використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших refs оцінювання OpenAI, які це підтримують. Перевизначте конкретного кандидата inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` все ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` зберігається
для сумісності.
Refs кандидатів OpenAI за замовчуванням використовують швидкий режим, щоб пріоритетна обробка застосовувалась там, де
провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремий кандидат або суддя потребує перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості для кандидатів і суддів
записуються у звіті для аналізу бенчмарків, але підказки суддів явно вказують
не ранжувати за швидкістю.
Запуски моделей-кандидатів і суддів за замовчуванням обидва використовують concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження на локальний Gateway
роблять запуск занадто шумним.
Коли кандидатський `--model` не передано, оцінювання характеру за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли `--model` не передано.
Коли `--judge-model` не передано, судді за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Матрична QA](/uk/concepts/qa-matrix)
- [Канал QA](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
