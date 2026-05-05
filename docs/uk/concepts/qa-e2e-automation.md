---
read_when:
    - Розуміння того, як стек QA працює разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв із підтримкою репозиторію
    - Побудова QA-автоматизації з вищим рівнем реалістичності для панелі керування Gateway
summary: 'Огляд QA-стека: qa-lab, qa-channel, сценарії, підтримувані репозиторієм, лінії live-транспорту, транспортні адаптери та звітування.'
title: Огляд QA
x-i18n:
    generated_at: "2026-05-05T01:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичніший,
канально-орієнтований спосіб, ніж це може зробити один unit test.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакцій, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача й шина QA для спостереження за транскриптом,
  ін’єкції вхідних повідомлень та експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner plugins: адаптери live-transport, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для kickoff-завдання та базових
  сценаріїв QA.
- [Mantis](/uk/concepts/mantis): перевірка до й після live-верифікації для багів, яким
  потрібні реальні транспорти, скриншоти браузера, стан VM і докази для PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
script aliases `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                             |
| `qa suite`                                          | Запускає сценарії з репозиторію проти QA gateway lane. Aliases: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                       |
| `qa coverage`                                       | Друкує markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний parity report.                                                                                                               |
| `qa character-eval`                                 | Запускає character QA scenario на кількох live models зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                                                 |
| `qa manual`                                         | Запускає одноразовий prompt проти вибраного provider/model lane.                                                                                                                               |
| `qa ui`                                             | Запускає QA debugger UI і локальну QA bus (alias: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Збирає попередньо підготовлений QA Docker image.                                                                                                                                                          |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                         |
| `qa up`                                             | Збирає QA site, запускає Docker-backed stack, друкує URL (alias: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Запускає лише AIMock provider server.                                                                                                                                                       |
| `qa mock-openai`                                    | Запускає лише scenario-aware `mock-openai` provider server.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                    |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Live transport lane проти реальної приватної Telegram group.                                                                                                                                   |
| `qa discord`                                        | Live transport lane проти реального приватного Discord guild channel.                                                                                                                            |
| `qa slack`                                          | Live transport lane проти реального приватного Slack channel.                                                                                                                                    |
| `qa mantis`                                         | Runner перевірки до й після для багів live transport, із доказами Discord status-reactions, Crabbox desktop/browser smoke та Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis). |

## Операторський потік

Поточний операторський потік QA — це двопанельний QA site:

- Ліворуч: Gateway dashboard (Control UI) з agent.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA site, запускає Docker-backed gateway lane і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати agent QA
місію, спостерігати за реальною поведінкою каналу та записувати, що спрацювало, що не вдалося або
що залишилося заблокованим.

Для швидшої ітерації QA Lab UI без перебудови Docker image щоразу,
запустіть stack із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker services на попередньо зібраному image і bind-mounts
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle після змін, а браузер автоматично перезавантажується, коли змінюється
asset hash QA Lab.

Для локального OpenTelemetry trace smoke виконайте:

```bash
pnpm qa:otel:smoke
```

Цей script запускає локальний OTLP/HTTP trace receiver, виконує
QA scenario `otel-trace-smoke` з увімкненим plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical shape:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не мають експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з artifacts QA suite.

Observability QA залишається доступним лише з source checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` зі зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для transport-real Matrix smoke lane виконайте:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний CLI reference, catalog профілів/сценаріїв, env vars і layout artifacts для цього lane описані в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він provision одноразовий Tuwunel homeserver у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix plugin усередині дочірнього QA gateway, scoped до цього transport (без `qa-channel`), потім записує Markdown report, JSON summary, observed-events artifact і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома bots (driver + SUT). Required env vars, списки сценаріїв, output artifacts і Convex credential pool задокументовані в [довідці QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного Slack desktop VM run із VNC rescue виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує Crabbox desktop/browser machine, запускає Slack live lane
усередині VM, відкриває Slack Web у VNC browser, захоплює desktop і
копіює `slack-qa/` плюс `slack-desktop-smoke.png` назад до artifact
directory Mantis. Повторно використовуйте `--lease-id <cbx_...>` після ручного входу в Slack Web
через VNC. З `--gateway-setup` Mantis залишає постійний OpenClaw Slack
gateway, що працює всередині VM на порту `38973`; без нього команда запускає
звичайний bot-to-bot Slack QA lane і завершується після захоплення artifacts.

Перед використанням pooled live credentials виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє Convex broker env, валідовує endpoint settings і перевіряє reachability admin/list, коли присутній maintainer secret. Для secrets він повідомляє лише статус set/missing.

## Покриття live transport

Live transport lanes мають спільний контракт замість того, щоб кожен винаходив власну форму списку сценаріїв. `qa-channel` — це широкий synthetic product-behavior suite і він не є частиною матриці live transport coverage.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Це зберігає `qa-channel` як широкий product-behavior suite, тоді як Matrix,
Telegram і майбутні live transports мають один явний transport-contract
checklist.

Для одноразового Linux VM lane без залучення Docker у QA path виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий екземпляр Multipass, установлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний звіт QA та
підсумок назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
Запуски набору на хості й у Multipass виконують кілька вибраних сценаріїв паралельно
з ізольованими працівниками Gateway за замовчуванням. `qa-channel` за замовчуванням використовує паралельність
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість працівників, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду завершення з помилкою.
Живі запуски передають підтримувані вхідні дані автентифікації QA, практичні для
гостя: ключі провайдерів на основі env, шлях до конфігурації живого провайдера QA та
`CODEX_HOME`, коли він наявний. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований робочий простір.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку homeserver на базі Docker. Telegram, Discord і Slack менші — кілька сценаріїв кожен, без системи профілів, для вже наявних реальних каналів — тому їхній довідник наведено тут.

### Спільні прапорці CLI

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі прапорці:

| Прапорець                             | За замовчуванням                                            | Опис                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                           | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та журнал виводу. Відносні шляхи визначаються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                             | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                       | Тимчасовий id облікового запису в конфігурації Gateway QA.                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                             | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                           |
| `--model <ref>` / `--alt-model <ref>` | стандарт провайдера                                         | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                    | Швидкий режим провайдера, де підтримується.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                       | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                              | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна лінія завершується з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення з помилкою.

### QA для Telegram

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома окремими ботами (driver + SUT). Бот SUT повинен мати ім’я користувача Telegram; спостереження бот-бот працює найкраще, коли обидва боти мають увімкнений **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий id чату (рядок).
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

Артефакти виводу:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання driver → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA для Discord

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал гільдії Discord із двома ботами: ботом driver, яким керує harness, і ботом SUT, запущеним дочірнім Gateway OpenClaw через вбудований Discord plugin. Перевіряє обробку згадок у каналі, те, що бот SUT зареєстрував нативну команду `/help` у Discord, і opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з id користувача бота SUT, який повертає Discord (інакше лінія швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на постійно ввімкнені відповіді гільдії лише через інструменти з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу реакцій REST і візуальний артефакт HTML/PNG.

Запустіть сценарій реакцій статусу Mantis явно:

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
- `discord-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій реакцій статусу.

### QA для Slack

```bash
pnpm openclaw qa slack
```

Націлено на один реальний приватний канал Slack із двома окремими ботами: ботом driver, яким керує harness, і ботом SUT, запущеним дочірнім Gateway OpenClaw через вбудований Slack plugin.

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

Артефакти виводу:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування робочого простору Slack

Лінії потрібні дві окремі програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте спеціальний канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від driver, щоб її id користувача бота був окремим.
- `sutAppToken` — токен рівня програми (`xapp-...`) програми SUT з `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Віддавайте перевагу робочому простору Slack, призначеному для QA, замість повторного використання виробничого робочого простору.

Наведений нижче маніфест SUT віддзеркалює виробниче встановлення вбудованого Slack plugin (`extensions/slack/src/setup-shared.ts:10`). Налаштування виробничого каналу, як його бачать користувачі, див. у [швидкому налаштуванні каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо лінії потрібні два окремі id користувачів ботів в одному робочому просторі.

**1. Створіть програму Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть робочий простір QA, вставте наведений нижче маніфест, потім _Install to Workspace_:

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) — він стане `driverBotToken`. Driver потрібен лише для публікації повідомлень і самоідентифікації; без подій, без Socket Mode.

**2. Створіть програму SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Набір scope віддзеркалює виробниче встановлення вбудованого Slack plugin (`extensions/slack/src/setup-shared.ts:10`):

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

Після того як Slack створить програму, зробіть дві речі на її сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє driver і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох ролей одразу призведе до помилки mention-gating.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — він стане `channelId`. Публічний канал підійде; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тож читання історії у harness все одно буде успішним.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або заповніть спільний пул Convex, щоб CI та інші maintainers могли брати їх в оренду.

Для пулу Convex запишіть чотири поля у JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Коли `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` експортовано у вашій оболонці, зареєструйте та перевірте:

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

Успішний запуск завершується значно менш ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, то або пул порожній, або всі рядки взято в оренду — `qa credentials list --kind slack --status all --json` покаже, який саме випадок.

### Пул облікових даних Convex

Lane-и Telegram, Discord і Slack можуть брати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом виконання запуску та звільняє її під час завершення. Види пулів: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (Slack id на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) для підготовки застосунків і scopes.

Операційні змінні середовища та контракт endpoint broker Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика broker однакова для обох видів).

## Seeds із repo-backed

Seed assets розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Їх навмисно збережено в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має залишатися універсальним runner для Markdown. Кожен Markdown-файл сценарію є джерелом істини для одного тестового запуску та має визначати:

- метадані сценарію
- необов’язкові метадані категорії, можливості, lane і ризику
- посилання на docs і code
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Повторно використовувана runtime-поверхня, яка підтримує `qa-flow`, може залишатися універсальною та наскрізною. Наприклад, Markdown-сценарії можуть поєднувати helpers транспортного боку з helpers браузерного боку, які керують вбудованим Control UI через Gateway seam `browser.request`, без додавання спеціального runner.

Файли сценаріїв слід групувати за можливістю продукту, а не за папкою дерева джерел. Зберігайте стабільні ідентифікатори сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для відстежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- DM і чат у каналі
- поведінку thread
- життєвий цикл дії з повідомленням
- зворотні виклики Cron
- пригадування пам’яті
- перемикання моделей
- передачу subagent
- читання repo і docs
- одне невелике build-завдання, наприклад Lobster Invaders

## Mock lanes провайдерів

`qa suite` має два локальні mock lanes провайдерів:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається стандартним детермінованим mock lane для repo-backed QA і parity gates.
- `aimock` запускає provider server на базі AIMock для експериментального protocol, fixture, record/replay і chaos coverage. Він є додатковим і не замінює scenario dispatcher `mock-openai`.

Реалізація provider-lane міститься в `extensions/qa-lab/src/providers/`. Кожен провайдер володіє своїми defaults, запуском локального сервера, конфігурацією моделі Gateway, потребами staging auth-profile і flags можливостей live/mock. Спільний suite і код Gateway мають маршрутизувати через реєстр провайдерів замість розгалуження за іменами провайдерів.

## Транспортні адаптери

`qa-lab` володіє універсальним transport seam для Markdown-сценаріїв QA. `qa-channel` — перший адаптер на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання транспортно-специфічного runner QA.

На архітектурному рівні поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, concurrency worker-ів, записом artifacts і reporting.
- Транспортний адаптер володіє конфігурацією gateway, готовністю, inbound і outbound observation, transport actions і нормалізованим transport state.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає повторно використовувану runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до Markdown-системи QA вимагає рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий top-level root команди QA, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільною механікою host:

- root команди `openclaw qa`
- запуском і teardown suite
- concurrency worker-ів
- записом artifacts
- генерацією report
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним root `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як впроваджуються inbound events
- як спостерігаються outbound messages
- як надаються transcripts і normalized transport state
- як виконуються transport-backed actions
- як обробляється транспортно-специфічний reset або cleanup

Мінімальний поріг упровадження для нового каналу:

1. Залиште `qa-lab` власником спільного root `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте транспортно-специфічну механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root-команди. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте Markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте універсальні helpers сценаріїв для нових сценаріїв.
7. Зберігайте наявні compatibility aliases працездатними, якщо repo не виконує навмисну міграцію.

Правило ухвалення рішень суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте універсальний helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій транспортно-специфічним і явно вкажіть це в контракті сценарію.

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

Compatibility aliases залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але для створення нових сценаріїв слід використовувати універсальні назви. Aliases існують, щоб уникнути flag-day migration, а не як модель на майбутнє.

## Reporting

`qa-lab` експортує Markdown protocol report зі спостереженої timeline bus.
Report має відповідати на такі питання:

- Що спрацювало
- Що не вдалося
- Що залишилося заблокованим
- Які follow-up scenarios варто додати

Щоб отримати inventory доступних сценаріїв — корисно під час оцінювання follow-up work або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).

Для перевірок character і style запустіть той самий сценарій на кількох live model refs і запишіть judged Markdown report:

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

Команда запускає дочірні процеси локального QA Gateway, а не Docker. Сценарії оцінювання персонажа
мають задавати персону через `SOUL.md`, а потім виконувати звичайні користувацькі ходи,
як-от чат, допомога з робочим простором і невеликі файлові завдання. Модель-кандидат
не повинна знати, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з
режимом міркування `xhigh`, де він підтримується, ранжувати запуски за природністю, загальним враженням і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: підказка для судді все одно отримує
кожен транскрипт і статус запуску, але посилання на кандидатів замінюються нейтральними
мітками, такими як `candidate-01`; після розбору звіт зіставляє рейтинги з реальними
посиланнями.
Запуски кандидатів типово використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших eval-посилань OpenAI, які це підтримують. Перевизначте конкретного кандидата вбудовано за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний резервний варіант, а старіша форма `--model-thinking <provider/model=level>`
збережена для сумісності.
Посилання на кандидатів OpenAI типово використовують швидкий режим, щоб пріоритетна обробка застосовувалася там, де
провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` вбудовано, коли
окремий кандидат або суддя потребує перевизначення. Передавайте `--fast` лише тоді, коли потрібно
примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості роботи кандидатів і суддів
записуються у звіт для аналізу бенчмарків, але підказки суддям явно вказують
не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів типово мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження на локальний Gateway
роблять запуск надто шумним.
Коли не передано жодної кандидатської `--model`, оцінювання персонажа типово використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли не передано жодної `--model`.
Коли не передано жодної `--judge-model`, судді типово використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
