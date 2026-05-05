---
read_when:
    - Розуміння того, як компоненти стеку QA працюють разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова реалістичнішої QA-автоматизації навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії живого транспорту, транспортні адаптери та звітування.'
title: Огляд контролю якості
x-i18n:
    generated_at: "2026-05-05T20:12:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82edd3e64521c2d314c8cded2fdf695bf92e08ea019ff602899d5e3468aa82aa
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичніший спосіб,
схожий на канали, ніж це може зробити один модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: інтерфейс налагоджувача та шина QA для спостереження за транскриптом,
  ін’єкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових
  QA-сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до й після в реальному середовищі для помилок, які
  потребують реальних транспортів, скриншотів браузера, стану VM і доказів PR.

## Поверхня команд

Кожен QA-процес виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають псевдоніми скриптів `pnpm qa:*`;
підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                  |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                           |
| `qa suite`                                          | Запускає сценарії з репозиторію проти QA gateway lane. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                     |
| `qa coverage`                                       | Виводить Markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                              |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний звіт про паритет.                                                                                                             |
| `qa character-eval`                                 | Запускає QA-сценарій персонажа на кількох живих моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                                          |
| `qa manual`                                         | Запускає одноразовий промпт проти вибраної lane провайдера/моделі.                                                                                                                          |
| `qa ui`                                             | Запускає UI налагоджувача QA та локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                                             |
| `qa docker-build-image`                             | Збирає попередньо підготовлений Docker-образ QA.                                                                                                                                             |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для панелі QA + gateway lane.                                                                                                                               |
| `qa up`                                             | Збирає QA-сайт, запускає стек на базі Docker, виводить URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Запускає лише сервер провайдера AIMock.                                                                                                                                                      |
| `qa mock-openai`                                    | Запускає лише сервер провайдера `mock-openai`, обізнаний зі сценаріями.                                                                                                                     |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                |
| `qa matrix`                                         | Lane живого транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                        |
| `qa telegram`                                       | Lane живого транспорту проти реальної приватної групи Telegram.                                                                                                                             |
| `qa discord`                                        | Lane живого транспорту проти реального приватного каналу Discord guild.                                                                                                                     |
| `qa slack`                                          | Lane живого транспорту проти реального приватного каналу Slack.                                                                                                                             |
| `qa mantis`                                         | Runner перевірки до й після для помилок живого транспорту, з доказами Discord status-reactions, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis).     |

## Робочий процес оператора

Поточний робочий процес QA-оператора — це двопанельний QA-сайт:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає gateway lane на базі Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту QA-
місію, спостерігати реальну поведінку каналу та записувати, що спрацювало, що
зазнало збою або залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторної збірки Docker-образу щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` утримує Docker-сервіси на попередньо зібраному образі та bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при зміні, а браузер автоматично перезавантажується, коли змінюється
хеш ресурсів QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний приймач трас OTLP/HTTP, виконує
QA-сценарій `otel-trace-smoke` з увімкненим плагіном `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
виклики моделі не мають експортувати `StreamAbandoned` під час успішних ходів; raw diagnostic IDs і
атрибути `openclaw.content.*` мають не потрапляти до trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається доступним лише з source checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не виконують команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте instrumentation діагностики.

Для lane transport-real Matrix smoke запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цієї lane описані в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона створює одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний плагін Matrix усередині дочірнього QA gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-зведення, артефакт observed-events і об’єднаний output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома ботами (driver + SUT). Обов’язкові env vars, списки сценаріїв, output artifacts і пул облікових даних Convex задокументовані в [довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM із VNC rescue запустіть:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує Crabbox desktop/browser machine, запускає live lane Slack
усередині VM, відкриває Slack Web у VNC-браузері, захоплює desktop і
копіює `slack-qa/`, `slack-desktop-smoke.png` і `slack-desktop-smoke.mp4`,
коли відеозахоплення доступне, назад у директорію артефактів Mantis. Crabbox
desktop/browser leases надають capture tools і пакети browser/native-build helper
заздалегідь, тому сценарій має встановлювати fallback-и лише на старіших
leases. Mantis звітує загальний час і час по фазах у
`mantis-slack-desktop-smoke-report.md`, щоб повільні запуски показували, куди пішов час:
на lease warmup, отримання облікових даних, remote setup або копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC;
повторно використані leases також зберігають cache pnpm store Crabbox теплим. Типовий
`--hydrate-mode source` перевіряє із source checkout і виконує install/build
усередині VM. Використовуйте `--hydrate-mode prehydrated` лише коли повторно використаний remote
workspace уже має `node_modules` і зібраний `dist/`; цей режим пропускає
дорогий крок install/build і fail-closed, якщо workspace не готовий.
З `--gateway-setup` Mantis залишає постійний OpenClaw Slack gateway
запущеним усередині VM на порту `38973`; без цього команда запускає звичайну
bot-to-bot Slack QA lane і завершується після захоплення артефактів.

Для desktop task у стилі agent/CV запустіть:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` орендує або повторно використовує Crabbox desktop/browser machine, запускає
`crabbox record --while`, керує видимим браузером через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає `openclaw infer image describe`
на скриншоті, коли вибрано `--vision-mode image-describe`, і
записує `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` і `mantis-visual-task-report.md`.
Коли встановлено `--expect-text`, vision prompt просить структурований JSON-
вердикт і проходить лише тоді, коли модель повідомляє про позитивні видимі докази; негативна
відповідь, яка лише цитує цільовий текст, провалює assertion.
Використовуйте `--vision-mode metadata` для no-model smoke, який підтверджує desktop,
browser, screenshot і video plumbing без виклику провайдера image-understanding.
Запис є обов’язковим артефактом для `visual-task`; якщо Crabbox не записує
непорожній `visual-task.mp4`, завдання зазнає збою, навіть коли visual driver
пройшов. У разі збою Mantis зберігає lease для VNC, якщо завдання вже не
пройшло і `--keep-lease` не було встановлено.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє broker env Convex, валідує налаштування endpoint і перевіряє доступність admin/list, коли присутній maintainer secret. Він повідомляє лише статус set/missing для secrets.

## Покриття живого транспорту

Живі транспортні напрями мають спільний контракт замість того, щоб кожен вигадував власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний набір перевірок поведінки продукту, і він не є частиною матриці покриття живого транспорту.

| Напрям   | Canary | Відсікання за згадкою | Бот-до-бота | Блокування списком дозволених | Відповідь верхнього рівня | Відновлення після перезапуску | Продовження в треді | Ізоляція тредів | Спостереження за реакціями | Команда довідки | Реєстрація нативних команд |
| -------- | ------ | --------------------- | ----------- | ----------------------------- | ------------------------- | ----------------------------- | ------------------- | --------------- | -------------------------- | --------------- | -------------------------- |
| Matrix   | x      | x                     | x           | x                             | x                         | x                             | x                   | x               | x                          |                 |                            |
| Telegram | x      | x                     | x           |                               |                           |                               |                     |                 |                            | x               |                            |
| Discord  | x      | x                     | x           |                               |                           |                               |                     |                 |                            |                 | x                          |
| Slack    | x      | x                     | x           |                               |                           |                               |                     |                 |                            |                 |                            |

Це залишає `qa-channel` широким набором перевірок поведінки продукту, тоді як Matrix,
Telegram і майбутні живі транспорти мають один явний контрольний список
транспортного контракту.

Для одноразового напряму Linux VM без залучення Docker до QA-шляху виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжого гостя Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
зведення назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
Запуски набору на хості та в Multipass виконують кілька вибраних сценаріїв паралельно
з ізольованими працівниками gateway за замовчуванням. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість працівників, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій завершується невдало. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду виходу з помилкою.
Живі запуски передають підтримувані вхідні дані QA auth, практичні для
гостя: ключі провайдерів на основі env, шлях до конфігурації QA live provider і
`CODEX_HOME`, якщо він наявний. Тримайте `--output-dir` у корені репозиторію, щоб гість
міг записувати назад через змонтований робочий простір.

## Довідка QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed підготовку homeserver. Telegram, Discord і Slack менші — кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхня довідка розміщена тут.

### Спільні прапорці CLI

Ці напрями реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі прапорці:

| Прапорець                             | За замовчуванням                                             | Опис                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                            | Запустити лише цей сценарій. Можна повторювати.                                                                                 |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/зведення/спостережені повідомлення та вихідний журнал. Відносні шляхи обчислюються від `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                              | Корінь репозиторію під час виклику з нейтрального cwd.                                                                          |
| `--sut-account <id>`                  | `sut`                                                        | Тимчасовий id облікового запису всередині QA gateway config.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                              | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                                     |
| `--model <ref>` / `--alt-model <ref>` | значення провайдера за замовчуванням                         | Посилання на основну/альтернативну модель.                                                                                      |
| `--fast`                              | вимкнено                                                     | Швидкий режим провайдера, де підтримується.                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                                        | Див. [пул облікових даних Convex](#convex-credential-pool).                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                               | Роль, що використовується, коли `--credential-source convex`.                                                                   |

Кожен напрям завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу з помилкою.

### QA для Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома різними ботами (driver + SUT). Бот SUT повинен мати ім’я користувача Telegram; спостереження бот-до-бота найкраще працює, коли обидва боти мають увімкнений **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий chat id (рядок).
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
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Вихідні артефакти:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — включає RTT для кожної відповіді (driver send → observed SUT reply), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA для Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал guild Discord із двома ботами: бот driver, керований harness, і бот SUT, запущений дочірнім gateway OpenClaw через вбудований Plugin Discord. Перевіряє обробку згадок у каналі, що бот SUT зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з id користувача бота SUT, поверненим Discord (інакше напрям швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на always-on, tool-only відповіді guild із `messages.statusReactions.enabled=true`, а потім захоплює REST-таймлайн реакцій плюс візуальні артефакти HTML/PNG. Звіти Mantis до/після також зберігають MP4-артефакти, надані сценарієм, як `baseline.mp4` і `candidate.mp4`.

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

### QA для Slack

```bash
pnpm openclaw qa slack
```

Націлюється на один реальний приватний канал Slack із двома різними ботами: бот driver, керований harness, і бот SUT, запущений дочірнім gateway OpenClaw через вбудований Plugin Slack.

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
- `slack-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування робочого простору Slack

Напряму потрібні дві різні програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; напрям публікує дописи під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від driver, щоб її id користувача бота був окремим.
- `sutAppToken` — app-level токен (`xapp-...`) програми SUT із `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Віддавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання production робочого простору.

Маніфест SUT нижче віддзеркалює production установку вбудованого Plugin Slack (`extensions/slack/src/setup-shared.ts:10`). Для налаштування production-каналу, як його бачать користувачі, див. [швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо напряму потрібні два різні id користувачів-ботів в одному робочому просторі.

**1. Створіть програму Driver**

Перейдіть на [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть робочий простір QA, вставте такий маніфест, а потім _Install to Workspace_:

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) — він стане `driverBotToken`. Driver має лише публікувати повідомлення та ідентифікувати себе; без подій, без Socket Mode.

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

Після того як Slack створить застосунок, зробіть дві дії на його сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → це стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → це стане `sutAppToken`.

Перевірте, що два боти мають різні user id, викликавши `auth.test` для кожного token. Runtime розрізняє драйвер і SUT за user id; повторне використання одного застосунку для обох одразу зламає фільтрацію згадок.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте id `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — це стане `channelId`. Публічний канал підходить; якщо використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тому читання історії у harness усе одно буде успішним.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте env vars для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або заповніть спільний пул Convex, щоб CI та інші maintainers могли брати їх в оренду.

Для пулу Convex запишіть чотири поля в JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Коли `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` експортовані у вашій shell, зареєструйте й перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте end to end**

Запустіть lane локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує status `pass` і для `slack-canary`, і для `slack-mention-gating`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок уже в оренді — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Lane для Telegram, Discord і Slack можуть брати облікові дані в оренду зі спільного пулу Convex замість читання env vars вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї heartbeats протягом виконання й звільняє її під час shutdown. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (Slack id на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) для provisioning застосунку та scope.

Операційні env vars і контракт endpoint брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу з’явилася до підтримки Discord; семантика broker однакова для обох типів).

## Seed-дані з репозиторію

Seed-ресурси містяться в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб QA-план був видимий і людям, і
агенту.

`qa-lab` має залишатися універсальним runner для Markdown. Кожен scenario markdown-файл є
джерелом істини для одного тестового запуску й має визначати:

- metadata сценарію
- необов’язкові metadata category, capability, lane і risk
- посилання на docs і code
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Повторно використовувана runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, markdown-сценарії можуть поєднувати transport-side
helpers із browser-side helpers, які керують вбудованим Control UI через
Gateway `browser.request` seam без додавання спеціального runner.

Файли сценаріїв слід групувати за можливостями продукту, а не за папками source tree.
Зберігайте ID сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Baseline-список має залишатися достатньо широким, щоб покривати:

- DM і channel chat
- поведінку threads
- життєвий цикл message action
- callback-и cron
- відтворення memory
- перемикання model
- handoff subagent
- читання repo і docs
- одне невелике build-завдання, наприклад Lobster Invaders

## Mock-lanes провайдерів

`qa suite` має два локальні mock-lanes провайдерів:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається стандартним
  deterministic mock lane для QA з репозиторію та parity gates.
- `aimock` запускає provider server на основі AIMock для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane міститься в `extensions/qa-lab/src/providers/`.
Кожен provider відповідає за свої defaults, запуск локального server, config model Gateway,
потреби staging auth-profile і flags можливостей live/mock. Спільний suite і
gateway code мають маршрутизувати через provider registry замість branching за
іменами providers.

## Transport adapters

`qa-lab` володіє універсальним transport seam для markdown QA-сценаріїв. `qa-channel` — перший adapter на цьому seam, але ціль дизайну ширша: майбутні real або synthetic channels мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На архітектурному рівні поділ такий:

- `qa-lab` відповідає за універсальне виконання сценаріїв, concurrency workers, запис artifacts і reporting.
- Transport adapter відповідає за config Gateway, readiness, inbound і outbound observation, transport actions і normalized transport state.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає повторно використовувану runtime-поверхню, що їх виконує.

### Додавання каналу

Додавання каналу до markdown QA-системи потребує рівно двох речей:

1. Transport adapter для каналу.
2. Scenario pack, який перевіряє контракт каналу.

Не додавайте новий top-level root QA-команд, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільними mechanics host:

- root команди `openclaw qa`
- startup і teardown suite
- concurrency workers
- запис artifacts
- генерація report
- виконання scenarios
- compatibility aliases для старіших scenarios `qa-channel`

Runner Plugin-и володіють transport contract:

- як `openclaw qa <runner>` монтується під спільним root `qa`
- як Gateway налаштовується для цього transport
- як перевіряється readiness
- як впроваджуються inbound events
- як спостерігаються outbound messages
- як надаються transcripts і normalized transport state
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальний поріг adoption для нового каналу:

1. Залиште `qa-lab` власником спільного root `qa`.
2. Реалізуйте transport runner на спільному seam host `qa-lab`.
3. Тримайте transport-specific mechanics усередині runner Plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root command. Runner Plugin-и мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних директоріях `qa/scenarios/`.
6. Використовуйте універсальні helpers сценаріїв для нових сценаріїв.
7. Зберігайте наявні compatibility aliases робочими, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо behavior можна виразити один раз у `qa-lab`, помістіть його в `qa-lab`.
- Якщо behavior залежить від одного channel transport, тримайте його в цьому runner Plugin або Plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більше ніж один канал, додайте універсальний helper замість channel-specific branch у `suite.ts`.
- Якщо behavior має сенс лише для одного transport, залиште сценарій transport-specific і явно зазначте це в контракті сценарію.

### Назви helper-ів сценаріїв

Рекомендовані універсальні helpers для нових сценаріїв:

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

Compatibility aliases залишаються доступними для наявних scenarios — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати універсальні назви. Aliases існують, щоб уникнути одноразової міграції, а не як майбутня модель.

## Звітність

`qa-lab` експортує Markdown protocol report зі спостереженої timeline bus.
Report має відповідати:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up сценарії варто додати

Для інвентарю доступних сценаріїв — корисно під час оцінювання follow-up work або підключення нового transport — запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).

Для перевірок character і style запустіть той самий сценарій на кількох live model
refs і запишіть оцінений Markdown report:

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

Команда запускає локальні дочірні процеси QA Gateway, а не Docker. Сценарії оцінювання персонажа мають задавати персону через `SOUL.md`, а потім запускати звичайні користувацькі ходи, як-от чат, допомогу з робочим простором і невеликі файлові завдання. Кандидатній моделі не слід повідомляти, що її оцінюють. Команда зберігає кожен повний транскрипт, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: промпт судді все одно отримує кожен транскрипт і статус запуску, але посилання на кандидатів замінюються нейтральними мітками, як-от `candidate-01`; після парсингу звіт зіставляє рейтинги назад із реальними посиланнями.
Кандидатні запуски за замовчуванням використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh` для старіших оцінювальних посилань OpenAI, які це підтримують. Перевизначайте конкретного кандидата вбудовано через `--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає глобальний запасний варіант, а старішу форму `--model-thinking <provider/model=level>` збережено для сумісності.
Кандидатні посилання OpenAI за замовчуванням використовують швидкий режим, щоб застосовувалася пріоритетна обробка там, де провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` вбудовано, коли одному кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете примусово ввімкнути швидкий режим для кожної кандидатної моделі. Тривалості запусків кандидатів і суддів записуються у звіт для аналізу бенчмарків, але промпти суддів явно вказують не ранжувати за швидкістю.
Запуски кандидатних і суддівських моделей за замовчуванням використовують паралельність 16. Зменшуйте `--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження на локальний Gateway роблять запуск надто шумним.
Коли не передано жодної кандидатної `--model`, оцінювання персонажа за замовчуванням використовує `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` і `google/gemini-3.1-pro-preview`, якщо не передано жодної `--model`.
Коли не передано жодної `--judge-model`, судді за замовчуванням використовують `openai/gpt-5.5,thinking=xhigh,fast` і `anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Матриця QA](/uk/concepts/qa-matrix)
- [Канал QA](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
