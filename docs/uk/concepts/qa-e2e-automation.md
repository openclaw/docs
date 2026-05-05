---
read_when:
    - Розуміння того, як компоненти QA-стеку працюють разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Створення реалістичнішої автоматизації QA навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, live-транспортні лінії, транспортні адаптери та звітність.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-05T22:54:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 243940e8ddb54d22b1e787de34cd17d6f5f7d1beb8e1a7985c99fc9b0520742a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у реалістичніший спосіб, наближений до каналів, ніж це може зробити окремий модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача та QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до і після live-перевірки для помилок, яким
  потрібні реальні транспорти, скриншоти браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                                                                                                      |
| `qa suite`                                          | Запустити сценарії з репозиторію проти QA gateway lane. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                              |
| `qa coverage`                                       | Вивести markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                           |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентний звіт про паритет.                                                                                                                                                                                        |
| `qa character-eval`                                 | Запустити character QA сценарій на кількох live-моделях зі звітом, оціненим суддею. Див. [Звітування](#reporting).                                                                                                                                                      |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраного provider/model lane.                                                                                                                                                                                                       |
| `qa ui`                                             | Запустити UI налагоджувача QA та локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                                                                                                                        |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений QA Docker image.                                                                                                                                                                                                                       |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                       |
| `qa up`                                             | Зібрати QA-сайт, запустити стек на Docker і вивести URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                    |
| `qa aimock`                                         | Запустити лише server provider AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише server provider `mock-openai`, обізнаний зі сценаріями.                                                                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                                                                                        |
| `qa matrix`                                         | Live transport lane проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                                                                                            |
| `qa discord`                                        | Live transport lane проти реального приватного каналу guild Discord.                                                                                                                                                                                                    |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                                                                                            |
| `qa mantis`                                         | Runner перевірки до і після для помилок live transport, з доказами status-reactions у Discord, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook). |

## Потік оператора

Поточний QA-потік оператора — це двопанельний QA-сайт:

- Ліворуч: dashboard Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає gateway lane на Docker і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записувати, що спрацювало, що
не вдалося або що залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторного збирання Docker image щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному image і bind-mount
`extensions/qa-lab/web/dist` у container `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при змінах, а браузер автоматично перезавантажується,
коли змінюється hash ресурсу QA Lab.

Для локального OpenTelemetry trace smoke виконайте:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує QA-сценарій
`otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім декодує
експортовані protobuf spans і перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не повинні експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч із артефактами QA suite.

Observability QA залишається лише для source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час змін instrumentation
діагностики.

Для transport-real Matrix smoke lane виконайте:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний CLI-довідник, каталог профілів/сценаріїв, env vars і layout артефактів для цієї lane містяться в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він provision одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Plugin Matrix усередині дочірнього QA gateway, обмеженого цим transport (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, artifact observed-events і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома ботами (driver + SUT). Необхідні env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовано в [довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM з VNC rescue виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser машину Crabbox, запускає Slack live lane
усередині VM, відкриває Slack Web у VNC browser, захоплює desktop і
копіює `slack-qa/`, `slack-desktop-smoke.png` і `slack-desktop-smoke.mp4`,
коли video capture доступний, назад до каталогу артефактів Mantis. Crabbox
desktop/browser leases надають capture tools і browser/native-build helper
packages заздалегідь, тому сценарій має встановлювати fallbacks лише на старіших
leases. Mantis звітує про загальний і пофазний timings у
`mantis-slack-desktop-smoke-report.md`, щоб повільні запуски показували, куди пішов час:
lease warmup, отримання облікових даних, remote setup чи artifact copy. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC;
повторно використані leases також зберігають теплим pnpm store cache Crabbox. Типовий
`--hydrate-mode source` перевіряє з source checkout і виконує install/build
усередині VM. Використовуйте `--hydrate-mode prehydrated` лише тоді, коли повторно використаний remote
workspace вже має `node_modules` і зібраний `dist/`; цей режим пропускає
дорогий крок install/build і завершується помилкою, якщо workspace не готовий.
З `--gateway-setup` Mantis залишає persistent OpenClaw Slack gateway
запущеним усередині VM на порті `38973`; без нього команда запускає звичайну
bot-to-bot Slack QA lane і завершується після захоплення артефактів.

Чеклист оператора, команда dispatch GitHub workflow, contract для evidence-comment,
таблиця рішень hydrate-mode, інтерпретація timings і кроки обробки failures
містяться в [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook).

Для desktop-завдання в стилі агента/CV виконайте:

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
`mantis-visual-task-driver-result.json` та `mantis-visual-task-report.md`.
Коли задано `--expect-text`, vision-запит просить структурований JSON-
вердикт і проходить лише тоді, коли модель повідомляє про позитивні видимі докази; 
негативна відповідь, яка лише цитує цільовий текст, не проходить перевірку.
Використовуйте `--vision-mode metadata` для smoke-перевірки без моделі, яка доводить роботу desktop,
браузера, знімка екрана та відео-пайплайна без виклику провайдера
розуміння зображень. Запис є обов’язковим артефактом для `visual-task`; якщо Crabbox не записує
непорожній `visual-task.mp4`, завдання завершується помилкою навіть тоді, коли visual driver
пройшов. У разі помилки Mantis зберігає оренду для VNC, якщо завдання ще не
пройшло і `--keep-lease` не було задано.

Перед використанням спільних live-облікових даних виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє доступність admin/list, коли присутній секрет супровідника. Для секретів він повідомляє лише статус set/missing.

## Покриття live-транспортів

Live-транспортні лінії спільно використовують один контракт замість того, щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний набір перевірок продуктової поведінки, і він не є частиною матриці покриття live-транспортів.

| Лінія    | Canary | Mention gating | Bot-to-bot | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Продовження thread | Ізоляція thread | Спостереження за reaction | Команда help | Реєстрація нативної команди |
| -------- | ------ | -------------- | ---------- | -------------------- | -------------------------- | ----------------------------- | ------------------ | --------------- | -------------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x                    | x                          | x                             | x                  | x               | x                          |              |                             |
| Telegram | x      | x              | x          |                      |                            |                               |                    |                 |                            | x            |                             |
| Discord  | x      | x              | x          |                      |                            |                               |                    |                 |                            |              | x                           |
| Slack    | x      | x              | x          |                      |                            |                               |                    |                 |                            |              |                             |

Це залишає `qa-channel` широким набором перевірок продуктової поведінки, тоді як Matrix,
Telegram і майбутні live-транспорти спільно використовують один явний
checklist транспортного контракту.

Для одноразової лінії Linux VM без залучення Docker у QA-шлях виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжого гостя Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
summary назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
Запуски наборів на хості та Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість workers, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли
потрібні артефакти без помилкового коду завершення.
Live-запуски передають підтримувані QA auth inputs, практичні для
гостя: env-based provider keys, шлях до QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed підготовку homeserver. Telegram, Discord і Slack менші — по кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів, тому їхній довідник розміщено тут.

### Спільні CLI flags

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові flags:

| Flag                                  | За замовчуванням                                               | Опис                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                              | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/summary/спостережені повідомлення та output log. Відносні шляхи розв’язуються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                          | Тимчасовий account id у конфігурації QA gateway.                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                             |
| `--model <ref>` / `--alt-model <ref>` | provider default                                               | Основні/альтернативні model refs.                                                                                     |
| `--fast`                              | off                                                            | Швидкий режим провайдера, де підтримується.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                          | Див. [пул облікових даних Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                 | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна лінія завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення помилкового коду завершення.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Цілиться в одну реальну приватну групу Telegram із двома окремими ботами (driver + SUT). SUT bot повинен мати username Telegram; спостереження bot-to-bot найкраще працює, коли обидва боти мають увімкнений **Bot-to-Bot Communication Mode** у `@BotFather`.

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
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (driver send → observed SUT reply), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Цілиться в один реальний приватний канал Discord guild із двома ботами: driver bot, яким керує harness, і SUT bot, запущений дочірнім OpenClaw gateway через вбудований Discord plugin. Перевіряє обробку згадок каналу, що SUT bot зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має відповідати SUT bot user id, поверненому Discord (інакше лінія швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на always-on, tool-only guild replies з `messages.statusReactions.enabled=true`, потім захоплює REST reaction timeline плюс HTML/PNG visual artifacts. Звіти Mantis before/after також зберігають MP4-артефакти, надані сценарієм, як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій Mantis status-reaction явно:

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
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій status-reaction.

### Slack QA

```bash
pnpm openclaw qa slack
```

Цілиться в один реальний приватний канал Slack із двома окремими ботами: driver bot, яким керує harness, і SUT bot, запущений дочірнім OpenClaw gateway через вбудований Slack plugin.

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
- `slack-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування workspace Slack

Лінії потрібні дві окремі Slack apps в одному workspace, а також канал, учасниками якого є обидва боти:

- `channelId` — ідентифікатор `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте окремий канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) застосунку **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) застосунку **SUT**, який має бути окремим застосунком Slack від драйвера, щоб ідентифікатор користувача його бота відрізнявся.
- `sutAppToken` — токен рівня застосунку (`xapp-...`) застосунку SUT з `connections:write`, який використовується Socket Mode, щоб застосунок SUT міг отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання виробничого робочого простору.

Наведений нижче маніфест SUT віддзеркалює виробниче встановлення комплектного Slack Plugin (`extensions/slack/src/setup-shared.ts:10`). Для налаштування виробничого каналу так, як його бачать користувачі, див. [Швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно відокремлена, оскільки лінії потрібні два різні ідентифікатори користувачів-ботів в одному робочому просторі.

**1. Створіть застосунок Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть робочий простір QA, вставте наведений нижче маніфест, а потім натисніть _Install to Workspace_:

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

**2. Створіть застосунок SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Набір дозволів віддзеркалює виробниче встановлення комплектного Slack Plugin (`extensions/slack/src/setup-shared.ts:10`):

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

Після того як Slack створить застосунок, виконайте дві дії на сторінці його налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте дозвіл `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Середовище виконання розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох негайно призведе до збою фільтрації згадок.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів із самого каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — він стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тому читання історії в тестовій обв’язці й далі працюватиме.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або заповніть спільний пул Convex, щоб CI та інші супровідники могли брати їх в оренду.

Для пулу Convex запишіть чотири поля у файл JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Експортувавши `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` у вашій оболонці, зареєструйте й перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте наскрізно**

Запустіть лінію локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує статус `pass` для `slack-canary` і `slack-mention-gating`. Якщо лінія зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або всі рядки орендовані — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Лінії Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом запуску та звільняє її під час завершення роботи. Види пулів: `"telegram"`, `"discord"` і `"slack"`.

Форми корисного навантаження, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком ідентифікатора чату.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки застосунків і дозволів.

Операційні змінні середовища й контракт кінцевої точки брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу з’явилася до підтримки Discord; семантика брокера ідентична для обох видів).

## Сіди з репозиторію

Ресурси для сидів розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися універсальним рушієм Markdown. Кожен файл сценарію Markdown є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, можливості, лінії та ризику
- посилання на документацію й код
- необов’язкові вимоги до Plugin
- необов’язковий патч конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова поверхня середовища виконання, на якій базується `qa-flow`, може залишатися універсальною
і наскрізною. Наприклад, сценарії Markdown можуть поєднувати допоміжні засоби
транспортного боку з допоміжними засобами браузерного боку, які керують вбудованим Control UI через
шов Gateway `browser.request` без додавання спеціалізованого рушія.

Файли сценаріїв слід групувати за можливістю продукту, а не за папкою дерева
джерел. Зберігайте ідентифікатори сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для відстежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чат у DM і каналі
- поведінку тредів
- життєвий цикл дій із повідомленнями
- зворотні виклики Cron
- пригадування пам’яті
- перемикання моделей
- передачу підлеглому агенту
- читання репозиторію та документації
- невелике завдання збирання, наприклад Lobster Invaders

## Лінії імітації провайдера

`qa suite` має дві локальні лінії імітації провайдера:

- `mock-openai` — це сценарно-обізнана імітація OpenClaw. Вона залишається типовою
  детермінованою лінією імітації для QA на основі репозиторію та перевірок паритету.
- `aimock` запускає сервер провайдера на основі AIMock для експериментального протоколу,
  фікстур, запису/відтворення та хаос-покриття. Вона є додатковою й не
  замінює диспетчер сценаріїв `mock-openai`.

Реалізація ліній провайдера розміщена в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделі Gateway,
потребами підготовки профілю автентифікації та прапорцями можливостей live/імітації. Спільний код suite і
Gateway має маршрутизувати через реєстр провайдерів замість розгалуження за
назвами провайдерів.

## Транспортні адаптери

`qa-lab` володіє універсальним транспортним швом для сценаріїв QA Markdown. `qa-channel` — перший адаптер на цьому шві, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого рушія suite замість додавання транспортно-специфічного рушія QA.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, паралельністю воркерів, записом артефактів і звітністю.
- Транспортний адаптер володіє конфігурацією Gateway, готовністю, спостереженням за вхідними й вихідними подіями, транспортними діями та нормалізованим станом транспорту.
- Файли сценаріїв Markdown у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову поверхню середовища виконання, яка їх виконує.

### Додавання каналу

Додавання каналу до системи QA Markdown потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий корінь команди QA верхнього рівня, коли спільний хост `qa-lab` може володіти потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням suite
- паралельністю воркерів
- записом артефактів
- генеруванням звіту
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Plugin-и рушія володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як вхідні події ін’єктуються
- як спостерігаються вихідні повідомлення
- як експонуються транскрипти й нормалізований стан транспорту
- як виконуються дії на основі транспорту
- як обробляється транспортно-специфічне скидання або очищення

Мінімальна планка впровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний рушій на спільному шві хоста `qa-lab`.
3. Тримайте транспортно-специфічну механіку всередині Plugin-а рушія або обв’язки каналу.
4. Монтуйте рушій як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Plugin-и рушія мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ліниве виконання CLI та рушія має залишатися за окремими точками входу.
5. Створіть або адаптуйте сценарії Markdown у тематичних каталогах `qa/scenarios/`.
6. Використовуйте універсальні допоміжні засоби сценаріїв для нових сценаріїв.
7. Зберігайте чинні псевдоніми сумісності працездатними, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного канального транспорту, залиште її в цьому runner Plugin або в Plugin harness.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте універсальний helper замість канально-специфічної гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій специфічним для транспорту й чітко вкажіть це в контракті сценарію.

### Назви helper сценаріїв

Бажані універсальні helper для нових сценаріїв:

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати універсальні назви. Ці псевдоніми існують, щоб уникнути одночасної міграції всього коду, а не як майбутня модель.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостережуваної часової шкали bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Щоб отримати інвентар доступних сценаріїв — корисний під час оцінювання обсягу подальшої роботи або підключення нового транспорту — виконайте `pnpm openclaw qa coverage` (додайте `--json` для машинозчитуваного виводу).

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

Команда запускає дочірні процеси локального QA Gateway, а не Docker. Сценарії character eval
мають задавати persona через `SOUL.md`, а потім виконувати звичайні user turns,
як-от чат, допомога з робочим простором і невеликі файлові завдання. Candidate model не слід
повідомляти, що її оцінюють. Команда зберігає кожен повний
transcript, записує базову статистику запуску, а потім просить judge models у fast mode з
`xhigh` reasoning там, де це підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: judge prompt усе ще отримує
кожен transcript і run status, але candidate refs замінюються нейтральними
мітками, як-от `candidate-01`; після parsing звіт зіставляє ranking із реальними refs.
Candidate runs за замовчуванням використовують `high` thinking, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline через
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` збережена
для сумісності.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб застосовувалося priority processing там,
де провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у звіті для benchmark analysis, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски candidate і judge model за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження локального Gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли `--judge-model` не передано, judges за замовчуванням використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Testing](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
