---
read_when:
    - Розуміння того, як стек QA працює як єдине ціле
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова автоматизації QA з підвищеною реалістичністю навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії реального транспорту, транспортні адаптери та звітування.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-04T00:35:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b376767b967a51cc8a45ca5ce420f78067b52e6368d2abe921ffed533f6f9ba
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw реалістичнішим,
схожим на канали способом, ніж це може зробити один модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача й QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні плагіни запуску: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для початкового завдання та базових QA-сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до й після наживо для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                          |
| `qa suite`                                          | Запустити сценарії з репозиторію проти QA gateway lane. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                    |
| `qa coverage`                                       | Вивести markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                             |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати agentic parity-звіт.                                                                                            |
| `qa character-eval`                                 | Запустити character QA-сценарій на кількох live-моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                              |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної provider/model lane.                                                                                                            |
| `qa ui`                                             | Запустити UI налагоджувача QA та локальну QA-шину (аліас: `pnpm qa:lab:ui`).                                                                                                      |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений QA Docker-образ.                                                                                                                                       |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA-дашборда + gateway lane.                                                                                                      |
| `qa up`                                             | Зібрати QA-сайт, запустити стек на Docker, вивести URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).    |
| `qa aimock`                                         | Запустити лише сервер AIMock provider.                                                                                                                                    |
| `qa mock-openai`                                    | Запустити лише scenario-aware сервер provider `mock-openai`.                                                                                                              |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                 |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                        |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                         |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                 |
| `qa mantis`                                         | Runner перевірки до й після для помилок live transport, з доказами status-reactions у Discord і desktop/browser smoke у Crabbox. Див. [Mantis](/uk/concepts/mantis). |

## Потік оператора

Поточний потік QA-оператора — це двопанельний QA-сайт:

- Ліворуч: Gateway-дашборд (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає gateway lane на Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу й записати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted бандлом QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей бандл при зміні, а браузер автоматично перезавантажується, коли змінюється
хеш ресурсу QA Lab.

Для локального OpenTelemetry trace smoke виконайте:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний приймач трас OTLP/HTTP, виконує
QA-сценарій `otel-trace-smoke` з увімкненим плагіном `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не мають експортувати `StreamAbandoned` на успішних turns; сирі diagnostic IDs і
атрибути `openclaw.content.*` мають не потрапляти в trace. Він записує
`otel-smoke-summary.json` поруч із артефактами QA suite.

Observability QA залишається лише для source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не виконують команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для transport-real Matrix smoke lane виконайте:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цієї lane містяться в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він provision-ить одноразовий Tuwunel homeserver у Docker, реєструє тимчасових driver/SUT/observer users, запускає реальний Matrix-плагін усередині дочірнього QA gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, артефакт observed-events і об’єднаний output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на попередньо наявний реальний канал із двома ботами (driver + SUT). Обов’язкові env vars, списки сценаріїв, output artifacts і пул облікових даних Convex задокументовані в [довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Перед використанням pooled live credentials виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env Convex broker, валідує налаштування endpoint і перевіряє доступність admin/list, коли присутній maintainer secret. Для секретів він повідомляє лише статус set/missing.

## Покриття live transport

Live transport lanes мають один спільний контракт замість того, щоб кожна з них вигадувала власну форму списку сценаріїв. `qa-channel` — це широка синтетична suite поведінки продукту, і вона не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Це зберігає `qa-channel` як широку suite поведінки продукту, тоді як Matrix,
Telegram і майбутні live transports мають спільний явний checklist
transport-contract.

Для одноразової Linux VM lane без залучення Docker у QA path виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий Multipass guest, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA-звіт і
summary назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Host і Multipass suite runs за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість workers, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій падає. Використовуйте `--allow-failures`, коли
потрібні артефакти без failing exit code.
Live runs передають підтримувані QA auth inputs, практичні для
guest: provider keys на основі env, шлях QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed homeserver provisioning. Telegram, Discord і Slack менші — по кілька сценаріїв, без системи профілів, проти попередньо наявних реальних каналів — тому їхній довідник міститься тут.

### Спільні CLI flags

Ці lanes реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі flags:

| Прапорець                             | Типове значення                                                | Опис                                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                 |
| `--sut-account <id>`                  | `sut`                                                           | Тимчасовий ідентифікатор облікового запису в конфігурації QA gateway.                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` також працює).                                            |
| `--model <ref>` / `--alt-model <ref>` | типове значення постачальника                                   | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                        | Швидкий режим постачальника, де підтримується.                                                                         |
| `--credential-source <env\|convex>`   | `env`                                                           | Див. [Пул облікових даних Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                  | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна смуга завершується з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу з помилкою.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну справжню приватну групу Telegram із двома окремими ботами (драйвер + SUT). Бот SUT повинен мати ім’я користувача Telegram; спостереження бот-до-бота працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий ідентифікатор чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень (за замовчуванням редагуються).

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
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один справжній приватний канал гільдії Discord із двома ботами: драйверним ботом, керованим тестовим стендом, і ботом SUT, запущеним дочірнім Gateway OpenClaw через вбудований Discord plugin. Перевіряє обробку згадок каналу, те, що бот SUT зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача бота SUT, поверненим Discord (інакше смуга швидко завершується з помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається окремо, оскільки перемикає SUT на постійно ввімкнені відповіді гільдії лише інструментами з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу REST-реакцій плюс візуальний артефакт HTML/PNG.

Запустіть сценарій статусних реакцій Mantis явно:

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
- `discord-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій статусних реакцій.

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлюється на один справжній приватний канал Slack із двома окремими ботами: драйверним ботом, керованим тестовим стендом, і ботом SUT, запущеним дочірнім Gateway OpenClaw через вбудований Slack plugin.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необов’язково:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Вихідні артефакти:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Смуги Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання змінних середовища вище. Передайте `--credential-source convex` (або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї Heartbeat протягом виконання та звільняє її під час завершення роботи. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути рядком числового chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні змінні середовища та контракт endpoint broker Convex описані в [Testing → Shared Telegram credentials via Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика broker однакова для обох типів).

## Seeds із репозиторію

Seed-ресурси розташовані в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися generic markdown runner. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску та має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, смуги та ризику
- посилання на документацію та код
- необов’язкові вимоги до plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися generic
і наскрізною. Наприклад, markdown-сценарії можуть поєднувати помічники на боці
транспорту з помічниками на боці браузера, які керують вбудованим Control UI через
шов Gateway `browser.request`, без додавання спеціалізованого runner.

Файли сценаріїв слід групувати за продуктовою capability, а не за папкою дерева
джерел. Зберігайте ідентифікатори сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб покривати:

- DM і чат каналу
- поведінку thread
- життєвий цикл дій із повідомленнями
- Cron callbacks
- пригадування пам’яті
- перемикання моделей
- передавання subagent
- читання репозиторію та читання документації
- одне невелике завдання збірки, як-от Lobster Invaders

## Смуги mock-постачальника

`qa suite` має дві локальні смуги mock-постачальника:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається типовою
  детермінованою mock-смугою для QA з репозиторію та parity gates.
- `aimock` запускає сервер постачальника на базі AIMock для експериментального protocol,
  fixture, record/replay і chaos-покриття. Він є додатковим і не
  замінює scenario dispatcher `mock-openai`.

Реалізація смуг постачальників розташована в `extensions/qa-lab/src/providers/`.
Кожен постачальник володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделі Gateway,
потребами staging auth-profile і прапорцями live/mock capability. Спільний код suite і
Gateway має маршрутизувати через реєстр постачальників замість розгалуження за
іменами постачальників.

## Транспортні адаптери

`qa-lab` володіє generic транспортним швом для markdown QA-сценаріїв. `qa-channel` є першим адаптером на цьому шві, але ціль дизайну ширша: майбутні справжні або синтетичні канали мають підключатися до того самого suite runner замість додавання транспортно-специфічного QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє generic виконанням сценаріїв, конкурентністю worker, записом артефактів і звітуванням.
- Транспортний адаптер володіє конфігурацією Gateway, готовністю, спостереженням inbound і outbound, транспортними діями та нормалізованим транспортним станом.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown QA-системи потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, що перевіряє контракт каналу.

Не додавайте новий верхньорівневий корінь команди QA, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільною механікою host:

- корінь команди `openclaw qa`
- запуск і teardown suite
- конкурентність worker
- запис артефактів
- генерація звіту
- виконання сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway конфігурується для цього транспорту
- як перевіряється готовність
- як впроваджуються inbound events
- як спостерігаються outbound messages
- як надаються transcripts і нормалізований транспортний стан
- як виконуються transport-backed actions
- як обробляється транспортно-специфічне скидання або очищення

Мінімальний поріг прийняття для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте runner транспорту на спільному host seam `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin або harness каналу.
4. Змонтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ліниві CLI та виконання runner мають залишатися за окремими точками входу.
5. Створіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Залишайте наявні псевдоніми сумісності робочими, якщо repo не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте загальну допоміжну функцію замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій специфічним для транспорту й явно зазначте це в контракті сценарію.

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати загальні назви. Псевдоніми існують, щоб уникнути одночасної примусової міграції, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостережуваної часової лінії bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не вдалося
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Для інвентаризації доступних сценаріїв — корисної під час оцінювання обсягу подальшої роботи або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).

Для перевірок характеру й стилю запустіть той самий сценарій на кількох живих model
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
мають задавати persona через `SOUL.md`, а потім виконувати звичайні звернення користувача,
як-от чат, допомога з workspace і невеликі файлові завдання. Моделі-кандидату
не слід повідомляти, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить judge models у fast mode з
міркуванням `xhigh`, де воно підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: judge prompt усе ще отримує
кожен транскрипт і статус запуску, але refs кандидатів замінюються нейтральними
мітками, як-от `candidate-01`; звіт зіставляє рейтинги назад із реальними refs після
розбору.
Запуски кандидатів за замовчуванням використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте окремого кандидата inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` зберігається
для сумісності.
OpenAI refs кандидатів за замовчуванням використовують fast mode, щоб priority processing застосовувалася там, де
провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної моделі-кандидата. Тривалості кандидатів і суддів
записуються у звіт для аналізу benchmark, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски моделей-кандидатів і суддів за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера чи навантаження на локальний Gateway
роблять запуск надто шумним.
Коли не передано candidate `--model`, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли не передано `--model`.
Коли не передано `--judge-model`, судді за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
