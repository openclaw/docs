---
read_when:
    - Розуміння того, як взаємодіють компоненти стеку QA
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова реалістичнішої QA-автоматизації навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії живого транспорту, транспортні адаптери та звітність.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-05T04:39:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичнішому,
каналоподібному режимі, ніж це може зробити один модульний тест.

Поточні частини:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM,
  каналу, треду, реакцій, редагування та видалення.
- `extensions/qa-lab`: інтерфейс налагодження та шина QA для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту звіту Markdown.
- `extensions/qa-matrix`, майбутні Plugin-и запуску: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: початкові ресурси з репозиторію для стартового завдання та базових
  сценаріїв QA.
- [Mantis](/uk/concepts/mantis): перевірка до і після в живому середовищі для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази для PR.

## Поверхня команд

Кожен потік QA виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує звіт Markdown.                                                                                                                                             |
| `qa suite`                                          | Запускає сценарії з репозиторію проти лінії QA Gateway. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                       |
| `qa coverage`                                       | Друкує інвентар покриття сценаріїв у markdown (`--json` для машинного виводу).                                                                                                                |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний звіт про паритет.                                                                                                               |
| `qa character-eval`                                 | Запускає сценарій QA персонажа на кількох живих моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                                                 |
| `qa manual`                                         | Запускає одноразовий prompt проти вибраної лінії провайдера/моделі.                                                                                                                               |
| `qa ui`                                             | Запускає інтерфейс налагодження QA та локальну шину QA (псевдонім: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Збирає попередньо підготовлений Docker-образ QA.                                                                                                                                                          |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для панелі QA + лінії Gateway.                                                                                                                         |
| `qa up`                                             | Збирає сайт QA, запускає стек на базі Docker, друкує URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Запускає лише сервер провайдера AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Запускає лише сервер провайдера `mock-openai`, обізнаний зі сценаріями.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                    |
| `qa matrix`                                         | Лінія живого транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Лінія живого транспорту проти реальної приватної групи Telegram.                                                                                                                                   |
| `qa discord`                                        | Лінія живого транспорту проти реального приватного каналу Discord guild.                                                                                                                            |
| `qa slack`                                          | Лінія живого транспорту проти реального приватного каналу Slack.                                                                                                                                    |
| `qa mantis`                                         | Runner перевірки до і після для помилок живого транспорту, з доказами status-reactions у Discord, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis). |

## Потік оператора

Поточний потік оператора QA — це двопанельний сайт QA:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає сайт QA, запускає лінію Gateway на базі Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту місію QA,
спостерігати реальну поведінку каналу та записати, що спрацювало, що не вдалося або
що залишилося заблокованим.

Для швидшої ітерації інтерфейсу QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted збіркою QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цю збірку при зміні, а браузер автоматично перезавантажується, коли змінюється
хеш ресурсів QA Lab.

Для локального trace smoke OpenTelemetry запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
сценарій QA `otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
виклики моделі не повинні експортувати `StreamAbandoned` на успішних ходах; сирі діагностичні ID та
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч із артефактами QA suite.

QA спостережуваності залишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому лінії Docker-релізу пакета не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час зміни інструментації
діагностики.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повна довідка CLI, каталог профілів/сценаріїв, змінні середовища та схема артефактів для цієї лінії описані в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона provision одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix Plugin усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує звіт Markdown, JSON-зведення, артефакт observed-events і обʼєднаний output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на попередньо наявний реальний канал із двома ботами (driver + SUT). Необхідні змінні середовища, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані в [довідці QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM із VNC rescue запустіть:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser машину Crabbox, запускає живу лінію Slack
усередині VM, відкриває Slack Web у браузері VNC, захоплює робочий стіл і
копіює `slack-qa/`, `slack-desktop-smoke.png` і `slack-desktop-smoke.mp4`,
коли відеозахоплення доступне, назад у каталог артефактів Mantis. Повторно використовуйте `--lease-id <cbx_...>` після ручного входу в Slack Web
через VNC. З `--gateway-setup` Mantis залишає постійний OpenClaw Slack
Gateway, що працює всередині VM на порту `38973`; без нього команда запускає
звичайну bot-to-bot лінію Slack QA й завершується після захоплення артефактів.

Для desktop-завдання в стилі агент/CV запустіть:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` орендує або повторно використовує desktop/browser машину Crabbox, запускає
`crabbox record --while`, керує видимим браузером через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає `openclaw infer image describe`
для знімка екрана, коли вибрано `--vision-mode image-describe`, і
записує `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` і `mantis-visual-task-report.md`.
Коли встановлено `--expect-text`, vision prompt просить структурований JSON
вердикт і проходить лише тоді, коли модель повідомляє позитивні видимі докази; 
негативна відповідь, яка лише цитує цільовий текст, не проходить перевірку.
Використовуйте `--vision-mode metadata` для no-model smoke, що підтверджує роботу desktop,
браузера, знімка екрана та відеопровідності без виклику провайдера розуміння зображень.
Запис є обовʼязковим артефактом для `visual-task`; якщо Crabbox не записує
непорожній `visual-task.mp4`, завдання завершується невдачею навіть тоді, коли visual driver
пройшов. У разі збою Mantis зберігає lease для VNC, якщо завдання ще не
пройшло і `--keep-lease` не було встановлено.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє доступність admin/list, коли присутній maintainer secret. Для secret він повідомляє лише стан set/missing.

## Покриття живого транспорту

Лінії живого транспорту мають один спільний контракт замість того, щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний suite поведінки продукту і не є частиною матриці покриття живого транспорту.

| Смуга    | Канарка | Гейтинг згадок | Бот-до-бота | Блокування списком дозволених | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша дія в потоці | Ізоляція потоку | Спостереження за реакціями | Команда довідки | Реєстрація нативної команди |
| -------- | ------- | -------------- | ----------- | ----------------------------- | ------------------------- | ----------------------------- | --------------------- | --------------- | -------------------------- | --------------- | --------------------------- |
| Matrix   | x       | x              | x           | x                             | x                         | x                             | x                     | x               | x                          |                 |                             |
| Telegram | x       | x              | x           |                               |                           |                               |                       |                 |                            | x               |                             |
| Discord  | x       | x              | x           |                               |                           |                               |                       |                 |                            |                 | x                           |
| Slack    | x       | x              | x           |                               |                           |                               |                       |                 |                            |                 |                             |

Це залишає `qa-channel` широким набором тестів поведінки продукту, тоді як Matrix,
Telegram і майбутні live-транспорти мають один явний контрольний список
транспортного контракту.

Для одноразової смуги Linux VM без додавання Docker до QA-шляху запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це запускає нового гостя Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
підсумок назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
Запуски набору на хості та Multipass виконують кілька вибраних сценаріїв паралельно
з ізольованими Gateway-працівниками за замовчуванням. `qa-channel` за замовчуванням має паралельність
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість працівників, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду завершення з помилкою.
Live-запуски передають підтримувані QA-вхідні дані автентифікації, практичні для
гостя: ключі провайдерів на основі env, шлях до QA live-конфігурації провайдера та
`CODEX_HOME`, коли він наявний. Тримайте `--output-dir` у корені репозиторію, щоб гість
міг записувати назад через змонтований робочий простір.

## Довідка QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-забезпечення homeserver. Telegram, Discord і Slack менші — кілька сценаріїв для кожного, без системи профілів, проти вже наявних реальних каналів — тому їхня довідка розміщена тут.

### Спільні CLI-прапорці

Ці смуги реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі прапорці:

| Прапорець                            | За замовчуванням                                             | Опис                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | —                                                            | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                              | Корінь репозиторію під час запуску з нейтрального cwd.                                                                |
| `--sut-account <id>`                 | `sut`                                                        | Тимчасовий id облікового запису всередині QA Gateway-конфігурації.                                                    |
| `--provider-mode <mode>`             | `live-frontier`                                              | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                           |
| `--model <ref>` / `--alt-model <ref>` | стандарт провайдера                                          | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                             | вимкнено                                                     | Швидкий режим провайдера, де підтримується.                                                                           |
| `--credential-source <env\|convex>`  | `env`                                                        | Див. [пул облікових даних Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>` | `ci` у CI, інакше `maintainer`                               | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна смуга завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення з помилкою.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Орієнтується на одну реальну приватну групу Telegram із двома окремими ботами (драйвер + SUT). SUT-бот має мати ім'я користувача Telegram; спостереження бот-до-бота найкраще працює, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** в `@BotFather`.

Обов'язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий id чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов'язково:

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
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Вихідні артефакти:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з канарки.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Орієнтується на один реальний приватний канал Discord guild із двома ботами: драйвер-ботом, керованим тестовим стендом, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Discord Plugin. Перевіряє обробку згадок у каналі, що SUT-бот зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов'язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має відповідати id користувача SUT-бота, який повертає Discord (інакше смуга швидко завершується з помилкою).

Необов'язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається окремо, бо перемикає SUT на постійно ввімкнені відповіді guild лише інструментами з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу REST-реакцій плюс візуальні артефакти HTML/PNG. Звіти Mantis до/після також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій Mantis для статусних реакцій явно:

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

### Slack QA

```bash
pnpm openclaw qa slack
```

Орієнтується на один реальний приватний канал Slack із двома окремими ботами: драйвер-ботом, керованим тестовим стендом, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Slack Plugin.

Обов'язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необов'язково:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Вихідні артефакти:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування робочого простору Slack

Смузі потрібні дві окремі програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте окремий канал; смуга публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від драйвера, щоб її id користувача-бота був відмінним.
- `sutAppToken` — токен рівня програми (`xapp-...`) програми SUT із `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання виробничого робочого простору.

Маніфест SUT нижче віддзеркалює виробниче встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`). Налаштування виробничого каналу таким, як його бачать користувачі, див. у [швидкому налаштуванні каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо смузі потрібні два різні id користувачів-ботів в одному робочому просторі.

**1. Створіть програму Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть QA-робочий простір, вставте наведений нижче маніфест, потім _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) — він стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення та ідентифікувати себе; без подій, без Socket Mode.

**2. Створіть програму SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Набір scope віддзеркалює виробниче встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`):

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Після того як Slack створить застосунок, виконайте дві дії на його сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → це стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → це стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Середовище виконання розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох негайно зламає фільтрацію згадок.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів із самого каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — це стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тож читання історії в harness усе одно успішно працюватиме.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші супровідники могли орендувати їх.

Для пулу Convex запишіть чотири поля у файл JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Експортувавши `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` у своїй оболонці, зареєструйте та перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте наскрізно**

Запустіть lane локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або всі рядки орендовані — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Lane для Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання змінних середовища вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом запуску й звільняє її під час завершення роботи. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком ідентифікатора чату.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки застосунків і scope.

Операційні змінні середовища та контракт endpoint брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу з’явилася до підтримки Discord; семантика брокера ідентична для обох типів).

## Seeds з репозиторію

Ресурси seed розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має залишатися загальним markdown runner. Кожен markdown-файл сценарію є джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane та ризику
- посилання на документацію й код
- необов’язкові вимоги до plugin
- необов’язковий патч конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова поверхня runtime, що підтримує `qa-flow`, може залишатися загальною та наскрізною. Наприклад, markdown-сценарії можуть поєднувати helpers транспортної сторони з helpers браузерної сторони, які керують вбудованим Control UI через seam `browser.request` Gateway без додавання спеціалізованого runner.

Файли сценаріїв слід групувати за продуктовою capability, а не за папкою дерева джерел. Зберігайте ідентифікатори сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для трасованості реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чати DM і каналу
- поведінку thread
- життєвий цикл дії з повідомленням
- зворотні виклики Cron
- пригадування пам’яті
- перемикання моделей
- передавання subagent
- читання репозиторію та документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Mock lane провайдера

`qa suite` має два локальні mock lane провайдера:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається типовим детермінованим mock lane для QA з репозиторію та parity gate.
- `aimock` запускає сервер провайдера на основі AIMock для експериментального покриття протоколу, fixture, record/replay і chaos. Він є додатковим і не замінює scenario dispatcher `mock-openai`.

Реалізація provider-lane розташована в `extensions/qa-lab/src/providers/`. Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделі Gateway, потребами staging auth-profile та прапорцями capability для live/mock. Спільний код suite і Gateway має маршрутизувати через реєстр провайдерів замість розгалуження за назвами провайдерів.

## Транспортні адаптери

`qa-lab` володіє загальним транспортним seam для markdown-сценаріїв QA. `qa-channel` — перший адаптер на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання транспортно-специфічного QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє загальним виконанням сценаріїв, concurrency worker, записом артефактів і звітністю.
- Транспортний адаптер володіє конфігурацією Gateway, готовністю, спостереженням inbound і outbound, транспортними діями та нормалізованим транспортним станом.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортний адаптер для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий top-level корінь команди QA, коли спільний хост `qa-lab` може володіти потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням suite
- concurrency worker
- записом артефактів
- генеруванням звітів
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інжектяться inbound-події
- як спостерігаються outbound-повідомлення
- як надаються transcripts і нормалізований транспортний стан
- як виконуються дії, підкріплені транспортом
- як обробляється транспортно-специфічне скидання або очищення

Мінімальна планка прийняття для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на seam спільного хоста `qa-lab`.
3. Тримайте транспортно-специфічну механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI та виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні helpers сценаріїв для нових сценаріїв.
7. Підтримуйте наявні псевдоніми сумісності, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішень суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку можуть використовувати кілька каналів, додайте загальний helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій транспортно-специфічним і явно зазначте це в контракті сценарію.

### Назви helper сценаріїв

Бажані загальні helpers для нових сценаріїв:

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати загальні назви. Псевдоніми існують, щоб уникнути одномоментної міграції, а не як майбутня модель.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостереженої timeline bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не вдалося
- Що залишилося заблокованим
- Які наступні сценарії варто додати

Щоб отримати інвентар доступних сценаріїв — корисно під час оцінювання наступної роботи або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).

Для перевірок характеру й стилю запустіть той самий сценарій на кількох live ref моделей і запишіть оцінений Markdown-звіт:

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

Команда запускає локальні дочірні процеси QA Gateway, а не Docker. Сценарії оцінювання персонажа мають задавати персону через `SOUL.md`, а потім виконувати звичайні ходи користувача, як-от чат, допомога з робочою областю та невеликі файлові завдання. Модель-кандидат не повинна знати, що її оцінюють. Команда зберігає кожен повний транскрипт, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, вайбом і гумором. Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: підказка для судді все одно отримує кожен транскрипт і статус запуску, але посилання на кандидатів замінюються нейтральними мітками, як-от `candidate-01`; після розбору звіт зіставляє рейтинги назад із реальними посиланнями.
Запуски кандидатів за замовчуванням використовують рівень мислення `high`, із `medium` для GPT-5.5 та `xhigh` для старіших оцінювальних посилань OpenAI, які це підтримують. Перевизначте конкретного кандидата вбудовано через `--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає глобальний резервний варіант, а старіша форма `--model-thinking <provider/model=level>` збережена для сумісності.
Посилання на кандидатів OpenAI за замовчуванням використовують швидкий режим, тож пріоритетна обробка застосовується там, де провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` вбудовано, коли окремий кандидат або суддя потребує перевизначення. Передавайте `--fast` лише тоді, коли хочете примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості запусків кандидатів і суддів записуються у звіті для аналізу бенчмарків, але підказки для суддів явно вказують не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів за замовчуванням мають concurrency 16. Зменште `--concurrency` або `--judge-concurrency`, коли обмеження провайдера або навантаження на локальний Gateway роблять запуск надто шумним.
Коли не передано жодної кандидатської `--model`, оцінювання персонажа за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли не передано жодної `--judge-model`, судді за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Матрична QA](/uk/concepts/qa-matrix)
- [QA-канал](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
