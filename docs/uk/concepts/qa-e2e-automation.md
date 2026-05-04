---
read_when:
    - Розуміння того, як компоненти стеку забезпечення якості поєднуються між собою
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Створення реалістичнішої QA-автоматизації навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії живого транспорту, транспортні адаптери та звітність.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-04T02:51:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у реалістичнішому,
канально-орієнтованому режимі, ніж це може зробити один модульний тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування й видалення.
- `extensions/qa-lab`: інтерфейс налагоджувача й QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень та експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner plugins: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до й після live-валідації для багів, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази для PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                             |
| `qa suite`                                          | Запускає сценарії з репозиторію проти lane QA Gateway. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                       |
| `qa coverage`                                       | Друкує Markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний звіт про паритет.                                                                                                               |
| `qa character-eval`                                 | Запускає QA-сценарій персонажа на кількох live-моделях із оціненим звітом. Див. [Звітування](#reporting).                                                                                 |
| `qa manual`                                         | Запускає одноразовий prompt проти вибраного lane провайдера/моделі.                                                                                                                               |
| `qa ui`                                             | Запускає інтерфейс QA-нóлагоджувача та локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Збирає попередньо підготовлений QA Docker-образ.                                                                                                                                                          |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для QA-панелі + lane Gateway.                                                                                                                         |
| `qa up`                                             | Збирає QA-сайт, запускає стек на Docker, друкує URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Запускає лише сервер провайдера AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Запускає лише scenario-aware сервер провайдера `mock-openai`.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                    |
| `qa matrix`                                         | Lane живого транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Lane живого транспорту проти реальної приватної групи Telegram.                                                                                                                                   |
| `qa discord`                                        | Lane живого транспорту проти реального приватного каналу guild Discord.                                                                                                                            |
| `qa slack`                                          | Lane живого транспорту проти реального приватного каналу Slack.                                                                                                                                    |
| `qa mantis`                                         | Runner перевірки до й після для багів живого транспорту, з доказами Discord status-reactions, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis). |

## Операторський потік

Поточний операторський QA-потік — це двопанельний QA-сайт:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає lane Gateway на Docker і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записувати, що спрацювало, що не вдалося
або що залишилося заблокованим.

Для швидшої ітерації QA Lab UI без перезбирання Docker-образу щоразу
запустіть стек із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle під час змін, а браузер автоматично перезавантажується, коли змінюється hash
asset-ів QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, запускає
QA-сценарій `otel-trace-smoke` з увімкненим plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
виклики моделі не повинні експортувати `StreamAbandoned` на успішних turns; сирі діагностичні ID та
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA лишається тільки для source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` зі зібраного source checkout під час зміни instrumentation
діагностики.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний CLI-довідник, каталог профілів/сценаріїв, env vars і структура артефактів для цього lane описані в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він створює одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix plugin усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-підсумок, артефакт observed-events і комбінований output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома ботами (driver + SUT). Обов’язкові env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані в [довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного Slack desktop VM запуску з VNC rescue запустіть:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser машину Crabbox, запускає Slack live lane
усередині VM, відкриває Slack Web у VNC-браузері, захоплює desktop і
копіює `slack-qa/` плюс `slack-desktop-smoke.png` назад у директорію артефактів
Mantis. Повторно використовуйте `--lease-id <cbx_...>` після ручного входу в Slack Web
через VNC. З `--gateway-setup` Mantis залишає постійний OpenClaw Slack
Gateway запущеним усередині VM на порту `38973`; без нього команда запускає
звичайний bot-to-bot Slack QA lane і завершується після захоплення артефактів.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідує налаштування endpoint і перевіряє досяжність admin/list, коли присутній секрет maintainer. Він повідомляє лише статус set/missing для секретів.

## Покриття live-транспортів

Live transport lanes спільно використовують один контракт, а не кожен винаходить власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний suite поведінки продукту, і він не є частиною матриці покриття live-транспортів.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Це залишає `qa-channel` широким suite поведінки продукту, тоді як Matrix,
Telegram і майбутні live-транспорти спільно використовують один явний checklist
контракту транспорту.

Для одноразового Linux VM lane без залучення Docker до QA-шляху запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий екземпляр Multipass, встановлює залежності, збирає OpenClaw
усередині гостьового середовища, запускає `qa suite`, а потім копіює звичайний звіт QA та
зведення назад у `.artifacts/qa-e2e/...` на хості.
Використовується така сама поведінка вибору сценаріїв, як і для `qa suite` на хості.
Запуски набору на хості та в Multipass типово виконують кілька вибраних сценаріїв паралельно
з ізольованими працівниками Gateway. `qa-channel` типово має паралельність
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість працівників, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, якщо будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду завершення помилки.
Live-запуски передають підтримувані вхідні дані автентифікації QA, практичні для
гостьового середовища: ключі провайдерів на основі env, шлях до конфігурації QA live provider і
`CODEX_HOME`, якщо він присутній. Тримайте `--output-dir` у корені репозиторію, щоб гостьове середовище
могло записувати назад через змонтований робочий простір.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку Docker-backed homeserver. Telegram, Discord і Slack менші — по кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхній довідник розміщено тут.

### Спільні прапорці CLI

Ці напрямки реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                             | Типово                                                          | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/зведення/спостережені повідомлення та журнал виводу. Відносні шляхи розв’язуються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                           | Тимчасовий id облікового запису в конфігурації QA Gateway.                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` все ще працює).                                           |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | Основні/альтернативні refs моделей.                                                                                   |
| `--fast`                              | вимкнено                                                        | Швидкий режим провайдера там, де підтримується.                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                           | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                  | Роль, яку використовують, коли `--credential-source convex`.                                                          |

Кожен напрямок завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення помилки.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома окремими ботами (driver + SUT). SUT-бот повинен мати ім’я користувача Telegram; спостереження бот-до-бота працює найкраще, коли обидва боти мають увімкнений **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий id чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

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
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання driver → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла відредаговано, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал guild у Discord із двома ботами: driver-бот, керований harness, і SUT-бот, запущений дочірнім OpenClaw Gateway через вбудований Discord Plugin. Перевіряє обробку згадок каналу, те, що SUT-бот зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з id користувача SUT-бота, який повертає Discord (інакше напрямок швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається окремо, бо перемикає SUT на always-on, tool-only відповіді guild з `messages.statusReactions.enabled=true`, а потім захоплює REST-хронологію реакцій і візуальний артефакт HTML/PNG.

Запустіть сценарій Mantis для status-reaction явно:

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
- `discord-qa-observed-messages.json` — тіла відредаговано, якщо не задано `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій status-reaction.

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлено на один реальний приватний канал Slack із двома окремими ботами: driver-бот, керований harness, і SUT-бот, запущений дочірнім OpenClaw Gateway через вбудований Slack Plugin.

Обов’язкові env, коли `--credential-source env`:

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
- `slack-qa-observed-messages.json` — тіла відредаговано, якщо не задано `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Пул облікових даних Convex

Напрямки Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання env vars вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, підтримує її Heartbeat протягом запуску та звільняє під час завершення. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє в `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні env vars і контракт endpoint broker Convex наведено в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика broker однакова для обох типів).

## Seeds на основі репозиторію

Seed-ресурси розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися generic markdown runner. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane і risk
- docs і code refs
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися generic
і cross-cutting. Наприклад, markdown-сценарії можуть поєднувати transport-side
helpers із browser-side helpers, які керують вбудованим Control UI через
Gateway `browser.request` seam без додавання runner для спеціального випадку.

Файли сценаріїв слід групувати за product capability, а не за папкою дерева
джерел. Зберігайте стабільні ID сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для трасування реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- DM і channel chat
- поведінку thread
- життєвий цикл message action
- callbacks Cron
- memory recall
- перемикання моделей
- handoff subagent
- читання репозиторію та документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Mock-напрямки провайдерів

`qa suite` має два локальні mock-напрямки провайдерів:

- `mock-openai` — це scenario-aware mock OpenClaw. Він залишається типовим
  детермінованим mock-напрямком для repo-backed QA і parity gates.
- `aimock` запускає AIMock-backed provider server для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює scenario dispatcher `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен provider володіє своїми defaults, запуском локального сервера, конфігурацією моделей Gateway,
потребами staging auth-profile і прапорцями live/mock capability. Спільний код suite і
Gateway має маршрутизувати через provider registry замість branching on
provider names.

## Transport adapters

`qa-lab` володіє generic transport seam для markdown-сценаріїв QA. `qa-channel` — перший adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або synthetic channels мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На архітектурному рівні поділ такий:

- `qa-lab` володіє generic виконанням сценаріїв, паралельністю працівників, записом артефактів і звітністю.
- Transport adapter володіє конфігурацією Gateway, readiness, inbound and outbound observation, transport actions і normalized transport state.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA вимагає рівно двох речей:

1. Transport adapter для каналу.
2. Scenario pack, який перевіряє contract каналу.

Не додавайте новий top-level root команди QA, коли спільний хост `qa-lab` може володіти flow.

`qa-lab` володіє спільними механіками хоста:

- корінь команди `openclaw qa`
- запуск і завершення suite
- конкурентність worker
- запис артефактів
- генерація звітів
- виконання сценаріїв
- сумісні псевдоніми для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як впроваджуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти й нормалізований стан транспорту
- як виконуються дії, підтримані транспортом
- як обробляється транспортно-специфічне скидання або очищення

Мінімальна планка впровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте транспортно-специфічні механіки всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; відкладені CLI та виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте роботу наявних псевдонімів сумісності, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використати більше ніж один канал, додайте загальну допоміжну функцію замість гілки, специфічної для каналу, у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій транспортно-специфічним і явно зазначте це в контракті сценарію.

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати загальні назви. Псевдоніми існують, щоб уникнути одночасної міграції всього коду, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостереженої часової шкали bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Для інвентаризації доступних сценаріїв — корисної під час оцінювання обсягу подальшої роботи або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машиночитного виводу).

Для перевірок характеру й стилю запустіть той самий сценарій на кількох live model
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

Команда запускає дочірні процеси локального QA gateway, а не Docker. Сценарії character eval
мають задавати persona через `SOUL.md`, а потім виконувати звичайні user turns,
такі як чат, допомога з робочим простором і невеликі файлові завдання. Candidate model не слід
повідомляти, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить judge models у fast mode з
міркуванням `xhigh`, де воно підтримується, ранжувати запуски за природністю, vibe і гумором.
Використовуйте `--blind-judge-models` під час порівняння providers: judge prompt усе одно отримує
кожен транскрипт і статус запуску, але candidate refs замінюються нейтральними
мітками, як-от `candidate-01`; звіт зіставляє рейтинги з реальними refs після
парсингу.
Candidate runs за замовчуванням використовують thinking `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` збережена
для сумісності.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб priority processing застосовувався там,
де provider це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у звіті для benchmark analysis, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски candidate і judge model за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти provider або навантаження локального gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли `--model` не передано.
Коли `--judge-model` не передано, judges за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
