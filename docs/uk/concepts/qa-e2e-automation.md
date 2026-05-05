---
read_when:
    - Розуміння того, як компоненти QA-стека поєднуються між собою
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова QA-автоматизації з підвищеною реалістичністю для панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, живі транспортні лінії, транспортні адаптери та звітування.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-05T04:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: dac200f60fd6215ddee44a55cff947f0bfc09df51720710db4a5d1045b01f714
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у реалістичніший,
каналоподібний спосіб, ніж це може зробити один unit test.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: інтерфейс налагодження та шина QA для спостереження за transcript,
  інʼєкції вхідних повідомлень та експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner plugins: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до та після наживо для багів, яким
  потрібні реальні транспорти, знімки браузера, стан VM та докази для PR.

## Командний інтерфейс

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають псевдоніми сценаріїв `pnpm qa:*`;
обидві форми підтримуються.

| Команда                                             | Призначення                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                             |
| `qa suite`                                          | Запустити сценарії з репозиторію проти QA gateway lane. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                       |
| `qa coverage`                                       | Вивести markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати agentic-звіт про parity.                                                                                                               |
| `qa character-eval`                                 | Запустити character QA scenario на кількох живих моделях зі звітом, оціненим judge. Див. [Звітність](#reporting).                                                                                 |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраного provider/model lane.                                                                                                                               |
| `qa ui`                                             | Запустити інтерфейс налагодження QA та локальну шину QA (псевдонім: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений QA Docker image.                                                                                                                                                          |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                         |
| `qa up`                                             | Зібрати QA site, запустити стек на Docker і вивести URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Запустити лише сервер AIMock provider.                                                                                                                                                       |
| `qa mock-openai`                                    | Запустити лише сценарно-обізнаний сервер provider `mock-openai`.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                    |
| `qa matrix`                                         | Live transport lane проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                   |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                                            |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                    |
| `qa mantis`                                         | Runner перевірки до та після для багів живого транспорту, з доказами Discord status-reactions, Crabbox desktop/browser smoke та Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis). |

## Потік оператора

Поточний потік оператора QA — це двопанельний QA site:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний transcript і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA site, запускає gateway lane на Docker і відкриває
сторінку QA Lab, де оператор або automation loop може дати агенту QA
місію, спостерігати реальну поведінку каналу та записувати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації QA Lab UI без перебудови Docker image щоразу
запустіть стек із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` утримує Docker services на попередньо зібраному image і bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перебудовує цей bundle під час змін, а браузер автоматично перезавантажується, коли змінюється
asset hash QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей сценарій запускає локальний OTLP/HTTP trace receiver, виконує
QA scenario `otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критично важливу для release форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не мають експортувати `StreamAbandoned` на успішних turns; сирі diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з artifacts QA suite.

Observability QA залишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час зміни diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повна довідка CLI, каталог профілів/сценаріїв, env vars і структура artifacts для цього lane описані в [Matrix QA](/uk/concepts/qa-matrix). Стисло: він provision-ить одноразовий Tuwunel homeserver у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix Plugin усередині дочірнього QA gateway, обмеженого цим transport (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, artifact observed-events і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома ботами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, output artifacts і пул облікових даних Convex описані в [довідці QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM з VNC rescue запустіть:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser машину Crabbox, запускає Slack live lane
усередині VM, відкриває Slack Web у VNC-браузері, захоплює desktop і
копіює `slack-qa/` плюс `slack-desktop-smoke.png` назад до директорії artifact
Mantis. Повторно використовуйте `--lease-id <cbx_...>` після ручного входу в Slack Web
через VNC. З `--gateway-setup` Mantis залишає постійний OpenClaw Slack
gateway, що працює всередині VM на порту `38973`; без цього команда запускає
звичайний bot-to-bot Slack QA lane і завершується після захоплення artifact.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env Convex broker, валідовує endpoint settings і перевіряє доступність admin/list, коли maintainer secret присутній. Він повідомляє лише статус set/missing для secrets.

## Покриття живого транспорту

Live transport lanes використовують один спільний контракт замість того, щоб кожен вигадував власну форму списку сценаріїв. `qa-channel` — це широка синтетична suite для product-behavior і не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Це залишає `qa-channel` широкою suite для product-behavior, тоді як Matrix,
Telegram і майбутні live transports використовують один явний checklist
transport-contract.

Для одноразового Linux VM lane без залучення Docker у QA path запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це запускає свіжий гостьовий екземпляр Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний звіт QA та
підсумок назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
Запуски наборів на хості та в Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими Gateway-працівниками. `qa-channel` за замовчуванням використовує паралельність
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість працівників, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду виходу з помилкою.
Живі запуски пересилають підтримувані вхідні дані автентифікації QA, практичні для
гостя: ключі провайдерів на основі env, шлях до конфігурації живого провайдера QA та
`CODEX_HOME`, якщо він наявний. Тримайте `--output-dir` у корені репозиторію, щоб гість
міг записувати назад через змонтований робочий простір.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку homeserver на основі Docker. Telegram, Discord і Slack менші — по кілька сценаріїв для кожного, без системи профілів, із попередньо наявними реальними каналами — тому їхній довідник розміщено тут.

### Спільні прапорці CLI

Ці напрямки реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                             | Типове значення                                               | Опис                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                             | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                               | Корінь репозиторію під час запуску з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                         | Тимчасовий id облікового запису в конфігурації QA Gateway.                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                               | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                             |
| `--model <ref>` / `--alt-model <ref>` | типове значення провайдера                                    | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                      | Швидкий режим провайдера, де підтримується.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                         | Див. [пул облікових даних Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожен напрямок завершується з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу з помилкою.

### QA для Telegram

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома окремими ботами (драйвер + SUT). SUT-бот повинен мати ім’я користувача Telegram; спостереження бот-до-бота працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий id чату (рядок).
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
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA для Discord

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал guild у Discord із двома ботами: драйвер-ботом, яким керує harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Discord Plugin. Перевіряє обробку згадок каналу, те, що SUT-бот зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з id користувача SUT-бота, повернутим Discord (інакше напрямок швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається окремо, оскільки перемикає SUT на постійно ввімкнені, лише інструментальні відповіді guild з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу реакцій REST плюс візуальний артефакт HTML/PNG.

Запустіть сценарій реакцій статусу Mantis явно:

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
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій реакцій статусу.

### QA для Slack

```bash
pnpm openclaw qa slack
```

Націлено на один реальний приватний канал Slack із двома окремими ботами: драйвер-ботом, яким керує harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Slack Plugin.

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

Напрямку потрібні дві окремі програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте окремий канал; напрямок публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від драйвера, щоб id її користувача-бота був окремим.
- `sutAppToken` — токен рівня програми (`xapp-...`) програми SUT зі `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Віддавайте перевагу робочому простору Slack, призначеному для QA, замість повторного використання production-робочого простору.

Наведений нижче маніфест SUT віддзеркалює production-встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`). Для налаштування production-каналу так, як його бачать користувачі, див. [швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, оскільки напрямку потрібні два окремі id користувачів-ботів в одному робочому просторі.

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) — він стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення й ідентифікувати себе; без подій, без Socket Mode.

**2. Створіть програму SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Набір scope віддзеркалює production-встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`):

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

Після того як Slack створить програму, виконайте дві дії на її сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє driver і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох одразу призведе до збою mention-gating.

**3. Створіть канал**

У QA workspace створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — він стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тож читання історії в harness усе одно будуть успішними.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші мейнтейнери могли орендувати їх.

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

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок орендовано — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Lane для Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання змінних середовища вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, підтримує для неї Heartbeat протягом запуску й звільняє її під час завершення. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє в `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування Slack workspace](#setting-up-the-slack-workspace) щодо підготовки застосунку та scope.

Операційні змінні середовища й контракт endpoint broker Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика broker ідентична для обох типів).

## Seeds із repo

Seed-ресурси розміщено в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб QA-план був видимий і людям, і
agent.

`qa-lab` має залишатися універсальним markdown runner. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane та risk
- посилання на docs і code
- необов’язкові вимоги Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Поверхня багаторазового runtime, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, markdown-сценарії можуть поєднувати transport-side
helpers із browser-side helpers, які керують вбудованим Control UI через
шов Gateway `browser.request`, без додавання спеціалізованого runner.

Файли сценаріїв слід групувати за product capability, а не за папкою source tree.
Зберігайте стабільні ID сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Baseline-список має залишатися достатньо широким, щоб охоплювати:

- DM і channel chat
- поведінку thread
- життєвий цикл message action
- callback Cron
- відтворення memory
- перемикання model
- передавання subagent
- читання repo та docs
- одне невелике build-завдання, наприклад Lobster Invaders

## Mock lanes провайдера

`qa suite` має дві локальні mock lanes провайдера:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається типовою
  детермінованою mock lane для repo-backed QA та parity gates.
- `aimock` запускає provider server на базі AIMock для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює scenario dispatcher `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми defaults, запуском local server, конфігурацією Gateway model,
потребами staging auth-profile та прапорцями live/mock capability. Спільний suite і
код Gateway мають маршрутизуватися через provider registry замість розгалуження за
іменами провайдерів.

## Transport adapters

`qa-lab` володіє універсальним transport seam для markdown QA-сценаріїв. `qa-channel` — перший adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, concurrency workers, записом артефактів і звітністю.
- Transport adapter володіє конфігурацією Gateway, readiness, inbound і outbound observation, transport actions та normalized transport state.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime surface, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown QA-системи вимагає рівно двох речей:

1. Transport adapter для каналу.
2. Scenario pack, який перевіряє контракт каналу.

Не додавайте новий top-level QA command root, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільною host mechanics:

- command root `openclaw qa`
- startup і teardown suite
- concurrency workers
- запис артефактів
- генерація звіту
- виконання сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner Plugins володіють transport contract:

- як `openclaw qa <runner>` монтується під спільним root `qa`
- як Gateway налаштовується для цього transport
- як перевіряється readiness
- як injected inbound events
- як спостерігаються outbound messages
- як експонуються transcripts і normalized transport state
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальна планка adoption для нового каналу:

1. Залиште `qa-lab` власником спільного root `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте transport-specific mechanics всередині runner Plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root command. Runner Plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI та виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних директоріях `qa/scenarios/`.
6. Використовуйте універсальні scenario helpers для нових сценаріїв.
7. Зберігайте працездатність наявних compatibility aliases, якщо repo не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, тримайте її в цьому runner Plugin або Plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більше ніж один канал, додайте універсальний helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного transport, залиште сценарій transport-specific і явно зазначте це в контракті сценарію.

### Назви scenario helper

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

Compatibility aliases залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але для написання нових сценаріїв слід використовувати універсальні назви. Aliases існують, щоб уникнути flag-day migration, а не як модель на майбутнє.

## Звітність

`qa-lab` експортує Markdown protocol report зі спостережуваної bus timeline.
Звіт має відповідати:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up scenarios варто додати

Для inventory доступних сценаріїв — корисного під час оцінювання follow-up work або підключення нового transport — запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).

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

Команда запускає локальні дочірні процеси QA gateway, а не Docker. Сценарії оцінювання персонажа мають задавати персону через `SOUL.md`, а потім виконувати звичайні користувацькі ходи, як-от чат, допомога з робочою областю та невеликі файлові завдання. Моделі-кандидату не слід повідомляти, що її оцінюють. Команда зберігає кожну повну стенограму, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, настроєм і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: підказка для судді й далі отримує кожну стенограму та стан запуску, але посилання на кандидатів замінюються нейтральними мітками, такими як `candidate-01`; звіт зіставляє рейтинги з реальними посиланнями після розбору.
Запуски кандидатів за замовчуванням використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh` для старіших оцінювальних посилань OpenAI, які це підтримують. Перевизначте конкретного кандидата в рядку за допомогою `--model provider/model,thinking=<level>`. `--thinking <level>` і надалі задає глобальний резервний варіант, а старіша форма `--model-thinking <provider/model=level>` збережена для сумісності.
Посилання на кандидатів OpenAI за замовчуванням використовують швидкий режим, щоб пріоритетна обробка застосовувалася там, де провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` у рядку, коли окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості кандидатів і суддів записуються у звіт для аналізу бенчмарків, але підказки для суддів явно вказують не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів за замовчуванням мають конкурентність 16. Зменште `--concurrency` або `--judge-concurrency`, коли обмеження провайдера або навантаження на локальний gateway роблять запуск занадто шумним.
Якщо не передано жодного кандидата `--model`, оцінювання персонажа за замовчуванням використовує `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` і `google/gemini-3.1-pro-preview`, коли не передано `--model`.
Якщо не передано `--judge-model`, судді за замовчуванням використовують `openai/gpt-5.5,thinking=xhigh,fast` і `anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
