---
read_when:
    - Розуміння того, як складові QA-стека поєднуються між собою
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Створення реалістичнішої QA-автоматизації навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, живі транспортні лінії, транспортні адаптери та звітування.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-05T00:42:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01cc3543a10a8ea3a7ea3a135e95ae0ea0c6e983e6b30c35aab1f74c13d7f4a3
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw у більш реалістичний,
каналоподібний спосіб, ніж це може зробити один модульний тест.

Поточні частини:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача і QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень та експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні плагіни запуску: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до і після наживо для багів, яким
  потрібні реальні транспорти, скриншоти браузера, стан VM і докази для PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси сценаріїв `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                             |
| `qa suite`                                          | Запускає сценарії з репозиторію проти QA gateway lane. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                       |
| `qa coverage`                                       | Друкує markdown-інвентар покриття сценаріями (`--json` для машинного виводу).                                                                                                                |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний звіт про паритет.                                                                                                               |
| `qa character-eval`                                 | Запускає QA-сценарій персонажа на кількох живих моделях зі звітом оцінювання. Див. [Звітування](#reporting).                                                                                 |
| `qa manual`                                         | Запускає одноразовий prompt проти вибраної provider/model lane.                                                                                                                               |
| `qa ui`                                             | Запускає UI налагоджувача QA і локальну QA-шину (аліас: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Збирає попередньо підготовлений QA Docker image.                                                                                                                                                          |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                         |
| `qa up`                                             | Збирає QA site, запускає Docker-backed stack, друкує URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Запускає лише server provider AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Запускає лише server provider `mock-openai`, обізнаний зі сценаріями.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                    |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                   |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                                            |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                    |
| `qa mantis`                                         | Runner перевірки до і після для багів live transport, із доказами status-reactions у Discord, desktop/browser smoke у Crabbox та Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis). |

## Потік оператора

Поточний потік оператора QA — це двопанельний QA site:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA site, запускає Docker-backed gateway lane і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA
місію, спостерігати реальну поведінку каналу та записати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторного збирання Docker image щоразу
запустіть стек із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker services на попередньо зібраному image і bind-mount-ить
`extensions/qa-lab/web/dist` у container `qa-lab`. `qa:lab:watch`
перезбирає цей bundle під час змін, а браузер автоматично перезавантажується, коли hash ресурсу QA Lab
змінюється.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей script запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не мають експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з artifacts QA suite.

Observability QA залишається лише для source checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час зміни diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог profiles/scenarios, env vars і layout artifacts для цієї lane наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він provision-ить одноразовий Tuwunel homeserver у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix plugin усередині дочірнього QA gateway, scoped до цього транспорту (без `qa-channel`), потім записує Markdown-звіт, JSON summary, artifact observed-events і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

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

Ця команда орендує desktop/browser machine Crabbox, запускає Slack live lane
усередині VM, відкриває Slack Web у VNC browser, захоплює desktop і
копіює `slack-qa/` разом із `slack-desktop-smoke.png` назад до artifact
directory Mantis. Повторно використовуйте `--lease-id <cbx_...>` після ручного входу в Slack Web
через VNC. З `--gateway-setup` Mantis залишає persistent OpenClaw Slack
gateway, що працює всередині VM на port `38973`; без нього команда запускає
звичайну bot-to-bot Slack QA lane і завершується після захоплення artifacts.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідує endpoint settings і перевіряє admin/list reachability, коли присутній maintainer secret. Для secrets він повідомляє лише статус set/missing.

## Покриття live transport

Live transport lanes мають один спільний contract замість того, щоб кожна винаходила власну форму списку сценаріїв. `qa-channel` — це широкий synthetic product-behavior suite і не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

Це зберігає `qa-channel` як широкий product-behavior suite, тоді як Matrix,
Telegram і майбутні live transports мають один явний transport-contract
checklist.

Для одноразової Linux VM lane без залучення Docker у QA path запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжого guest Multipass, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA-звіт і
зведення назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски наборів на host і Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими працівниками Gateway. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість працівників, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, якщо будь-який сценарій не вдається. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду завершення з помилкою.
Live-запуски передають підтримувані вхідні дані автентифікації QA, практичні для
guest: ключі провайдерів на основі env, шлях до конфігурації QA live provider і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку homeserver на базі Docker. Telegram, Discord і Slack менші — по кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхній довідник розміщено тут.

### Спільні прапорці CLI

Ці lanes реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                             | За замовчуванням                                             | Опис                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                            |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/зведення/спостережені повідомлення та журнал виводу. Відносні шляхи визначаються від `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | Тимчасовий id облікового запису в конфігурації QA Gateway.                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                                  |
| `--model <ref>` / `--alt-model <ref>` | провайдер за замовчуванням                                      | Посилання на основну/альтернативну модель.                                                                                 |
| `--fast`                              | вимкнено                                                        | Швидкий режим провайдера, де підтримується.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                           | Див. [пул облікових даних Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                  | Роль, що використовується, коли `--credential-source convex`.                                                              |

Кожна lane завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення з помилкою.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома окремими ботами (driver + SUT). SUT bot повинен мати ім’я користувача Telegram; спостереження bot-to-bot працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий chat id (рядок).
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

Вихідні артефакти:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання driver → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал guild Discord із двома ботами: driver bot, керований harness, і SUT bot, запущений дочірнім OpenClaw Gateway через вбудований Discord Plugin. Перевіряє обробку згадок каналу, що SUT bot зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з id користувача SUT bot, повернутим Discord (інакше lane швидко завершується з помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на always-on, tool-only відповіді guild з `messages.statusReactions.enabled=true`, а потім захоплює timeline реакцій REST плюс візуальний артефакт HTML/PNG.

Запустіть сценарій status-reaction Mantis явно:

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
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій status-reaction.

### Slack QA

```bash
pnpm openclaw qa slack
```

Націлено на один реальний приватний канал Slack із двома окремими ботами: driver bot, керований harness, і SUT bot, запущений дочірнім OpenClaw Gateway через вбудований Slack Plugin.

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

#### Налаштування workspace Slack

Lane потребує двох окремих застосунків Slack в одному workspace, а також канал, учасниками якого є обидва боти:

- `channelId` — id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; lane публікує повідомлення під час кожного запуску.
- `driverBotToken` — token бота (`xoxb-...`) застосунку **Driver**.
- `sutBotToken` — token бота (`xoxb-...`) застосунку **SUT**, який має бути окремим застосунком Slack від driver, щоб його id користувача бота був іншим.
- `sutAppToken` — token рівня застосунку (`xapp-...`) застосунку SUT з `connections:write`, який використовується Socket Mode, щоб застосунок SUT міг отримувати події.

Віддавайте перевагу workspace Slack, виділеному для QA, замість повторного використання production workspace.

**1. Створіть застосунок Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть QA workspace, вставте наведений нижче manifest, а потім _Install to Workspace_:

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

**2. Створіть застосунок SUT**

Повторіть _Create New App → From a manifest_ у тому самому workspace. Набір scope віддзеркалює production install вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`):

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

Після того як Slack створить застосунок, зробіть дві речі на його сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні user ids, викликавши `auth.test` для кожного token. Runtime розрізняє driver і SUT за user id; повторне використання одного застосунку для обох одразу провалить mention-gating.

**3. Створіть канал**

У QA workspace створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів зсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _інформація про канал → Про канал → ID каналу_ — він стане `channelId`. Публічний канал працює; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тож читання історії в harness все одно успішно виконуватиметься.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші maintainers могли їх орендувати.

Для пулу Convex запишіть чотири поля у файл JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Коли `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` експортовані у вашій оболонці, зареєструйте та перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте повний цикл**

Запустіть lane локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує обидва `slack-canary` і `slack-mention-gating` зі статусом `pass`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок орендований — `qa credentials list --kind slack --status all --json` покаже, який саме випадок.

### Пул облікових даних Convex

Lanes Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом усього запуску та звільняє її під час завершення. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки застосунків і scopes.

Операційні змінні середовища та контракт endpoint broker Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу з’явилася до підтримки Discord; семантика broker однакова для обох типів).

## Seeds, підкріплені репозиторієм

Seed assets розташовані в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і agent.

`qa-lab` має залишатися generic markdown runner. Кожен markdown-файл scenario є джерелом істини для одного тестового запуску й має визначати:

- метадані scenario
- необов’язкові метадані категорії, capability, lane і risk
- посилання на документацію та код
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися generic і наскрізною. Наприклад, markdown scenarios можуть поєднувати helpers транспортного боку з helpers браузерного боку, які керують вбудованим Control UI через seam Gateway `browser.request` без додавання runner для спеціального випадку.

Файли scenario слід групувати за product capability, а не за папкою дерева джерел. Зберігайте ідентифікатори scenario стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб покривати:

- чат у DM і каналі
- поведінку threads
- життєвий цикл message action
- callbacks Cron
- memory recall
- перемикання моделей
- передавання subagent
- читання репозиторію та документації
- невелике build-завдання, наприклад Lobster Invaders

## Mock lanes провайдера

`qa suite` має два локальні mock lanes провайдера:

- `mock-openai` — це scenario-aware mock OpenClaw. Він залишається стандартним детермінованим mock lane для repo-backed QA і parity gates.
- `aimock` запускає сервер провайдера на базі AIMock для експериментального покриття protocol, fixture, record/replay і chaos. Він є додатковим і не замінює dispatcher scenario `mock-openai`.

Реалізація provider-lane розташована в `extensions/qa-lab/src/providers/`. Кожен провайдер володіє своїми defaults, запуском локального сервера, конфігурацією моделі Gateway, потребами staging auth-profile і flags live/mock capability. Спільний код suite і gateway має маршрутизуватися через provider registry замість розгалуження за назвами провайдерів.

## Transport adapters

`qa-lab` володіє generic transport seam для markdown QA scenarios. `qa-channel` — перший adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На рівні архітектури розподіл такий:

- `qa-lab` володіє generic виконанням scenario, concurrency workers, записом artifacts і reporting.
- Transport adapter володіє конфігурацією gateway, readiness, inbound і outbound observation, transport actions і normalized transport state.
- Markdown-файли scenario в `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown QA system потребує рівно двох речей:

1. Transport adapter для каналу.
2. Scenario pack, який перевіряє контракт каналу.

Не додавайте новий top-level корінь команди QA, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільною механікою host:

- корінь команди `openclaw qa`
- запуск і teardown suite
- concurrency workers
- запис artifacts
- генерація report
- виконання scenario
- compatibility aliases для старіших scenarios `qa-channel`

Runner plugins володіють transport contract:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway конфігурується для цього transport
- як перевіряється readiness
- як вводяться inbound events
- як спостерігаються outbound messages
- як надаються transcripts і normalized transport state
- як виконуються transport-backed actions
- як обробляється transport-specific reset або cleanup

Мінімальна планка adoption для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Залиште transport-specific механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root command. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown scenarios у тематичних директоріях `qa/scenarios/`.
6. Використовуйте generic scenario helpers для нових scenarios.
7. Зберігайте наявні compatibility aliases робочими, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного channel transport, залиште її в цьому runner plugin або plugin harness.
- Якщо scenario потребує нової capability, яку може використовувати більше ніж один канал, додайте generic helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного transport, залиште scenario transport-specific і зробіть це явним у контракті scenario.

### Назви scenario helpers

Бажані generic helpers для нових scenarios:

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

Compatibility aliases залишаються доступними для наявних scenarios — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових scenarios слід використовувати generic names. Aliases існують, щоб уникнути flag-day migration, а не як модель на майбутнє.

## Reporting

`qa-lab` експортує Markdown protocol report зі спостереженої bus timeline.
Report має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up scenarios варто додати

Для inventory доступних scenarios — корисного під час оцінювання follow-up work або підключення нового transport — запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).

Для перевірок характеру та стилю запустіть той самий scenario на кількох live model
refs і запишіть judged Markdown report:

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

Команда запускає дочірні процеси локального QA gateway, а не Docker. Character eval
scenarios мають задавати persona через `SOUL.md`, а потім виконувати звичайні user turns,
такі як чат, допомога з workspace і невеликі file tasks. Candidate model не слід
повідомляти, що її оцінюють. Команда зберігає кожен повний
transcript, записує базову статистику запуску, а потім просить judge models у fast mode з
reasoning `xhigh`, де це підтримується, ранжувати запуски за naturalness, vibe і humor.
Використовуйте `--blind-judge-models` під час порівняння providers: judge prompt усе ще отримує
кожен transcript і run status, але candidate refs замінюються нейтральними
labels, такими як `candidate-01`; report зіставляє rankings назад із реальними refs після
parsing.
Candidate runs за замовчуванням використовують thinking `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
global fallback, а старішу форму `--model-thinking <provider/model=level>` збережено
для compatibility.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб priority processing застосовувався там,
де провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються в report для benchmark analysis, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски candidate і judge model обидва за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли provider limits або навантаження локального gateway
роблять запуск надто шумним.
Якщо candidate `--model` не передано, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли `--model` не передано.
Якщо `--judge-model` не передано, judges за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Матриця QA](/uk/concepts/qa-matrix)
- [Канал QA](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
