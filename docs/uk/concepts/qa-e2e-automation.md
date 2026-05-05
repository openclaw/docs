---
read_when:
    - Розуміння того, як QA-стек поєднується в єдине ціле
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова реалістичнішої QA-автоматизації навколо панелі Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, живі транспортні доріжки, транспортні адаптери та звітність.'
title: Огляд QA
x-i18n:
    generated_at: "2026-05-05T23:16:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9faad6f8386114bbaa21897e076a68dcbf00f9d85a3f6e227d847e94e3ab9c01
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у реалістичнішому,
канально-орієнтованому режимі, ніж це може зробити один модульний тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, потоку,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача і QA-шина для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні плагіни runner: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання і базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до і після наживо для багів, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і PR-докази.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                                                                                                        |
| `qa suite`                                          | Запустити сценарії з репозиторію проти QA gateway lane. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Надрукувати markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                           |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати agentic-звіт паритету.                                                                                                                                                                                          |
| `qa character-eval`                                 | Запустити QA-сценарій персонажа на кількох live-моделях зі звітом із суддівською оцінкою. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраного provider/model lane.                                                                                                                                                                                                          |
| `qa ui`                                             | Запустити UI налагоджувача QA і локальну QA-шину (аліас: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                    |
| `qa up`                                             | Зібрати QA-сайт, запустити Docker-backed стек, надрукувати URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запустити лише сервер AIMock provider.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише scenario-aware сервер `mock-openai` provider.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live transport lane проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner перевірки до і після для багів live transport, із доказами Discord status-reactions, Crabbox desktop/browser smoke і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook). |

## Потік оператора

Поточний потік QA-оператора — це двопанельний QA-сайт:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-backed gateway lane і відкриває
сторінку QA Lab, де оператор або automation loop може дати агенту QA
місію, спостерігати за реальною поведінкою каналу та записувати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторного збирання Docker-образу щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при зміні, а браузер автоматично перезавантажується, коли змінюється
asset hash QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, запускає
QA-сценарій `otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не мають експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається лише для source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і layout артефактів для цього lane наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він створює одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix Plugin усередині дочірнього QA gateway, scoped до цього transport (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, observed-events artifact і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії покривають поведінку transport, яку модульні тести не можуть довести end to end: mention gating, allow-bot policies, allowlists, top-level і threaded replies, DM routing, reaction handling, inbound edit suppression, restart replay dedupe, homeserver interruption recovery, approval metadata delivery, media handling і Matrix E2EE bootstrap/recovery/verification flows. Профіль E2EE CLI також проганяє `openclaw matrix encryption setup` і команди verification через той самий одноразовий homeserver перед перевіркою gateway replies.

CI використовує ту саму поверхню команд у `.github/workflows/qa-live-transports-convex.yml`. Заплановані та стандартні ручні запуски виконують fast Matrix profile з live frontier credentials, `--fast` і `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручний `matrix_profile=all` розгортається у пʼять profile shards, щоб exhaustive catalog міг виконуватися паралельно, зберігаючи одну директорію артефактів на shard.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на наявний реальний канал із двома ботами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані в [довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM з VNC rescue виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує настільну/браузерну машину Crabbox, запускає live-лан Slack
усередині VM, відкриває Slack Web у браузері VNC, захоплює робочий стіл і
копіює `slack-qa/`, `slack-desktop-smoke.png` та `slack-desktop-smoke.mp4`,
коли доступне захоплення відео, назад до каталогу артефактів Mantis. Оренди
настільних/браузерних машин Crabbox одразу надають інструменти захоплення та
допоміжні пакети для браузера/нативного складання, тому сценарій має
встановлювати резервні варіанти лише на старіших орендах. Mantis звітує про
загальні та пофазові таймінги в
`mantis-slack-desktop-smoke-report.md`, тож у повільних запусках видно, куди
пішов час: на прогрівання оренди, отримання облікових даних, віддалене
налаштування чи копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC; повторно
використані оренди також зберігають прогрітим кеш pnpm store Crabbox. Типовий
режим `--hydrate-mode source` перевіряє з вихідного checkout і запускає install/build
усередині VM. Використовуйте `--hydrate-mode prehydrated` лише коли повторно
використаний віддалений робочий простір уже має `node_modules` і зібраний
`dist/`; цей режим пропускає дорогий крок install/build і завершується
помилкою, якщо робочий простір не готовий. З `--gateway-setup` Mantis залишає
постійний OpenClaw Slack gateway запущеним усередині VM на порту `38973`; без
нього команда запускає звичайний bot-to-bot QA-лан Slack і завершується після
захоплення артефактів.

Операторський чекліст, команда dispatch для GitHub workflow, контракт
evidence-comment, таблиця вибору hydrate-mode, інтерпретація таймінгів і кроки
обробки збоїв містяться в [Runbook настільного запуску Mantis Slack](/uk/concepts/mantis-slack-desktop-runbook).

Для настільного завдання в стилі агент/CV виконайте:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` орендує або повторно використовує настільну/браузерну машину
Crabbox, запускає `crabbox record --while`, керує видимим браузером через
вкладений `visual-driver`, захоплює `visual-task.png`, запускає
`openclaw infer image describe` для знімка екрана, коли вибрано
`--vision-mode image-describe`, і записує `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` та
`mantis-visual-task-report.md`. Коли встановлено `--expect-text`, vision-запит
просить структурований JSON-вердикт і проходить лише тоді, коли модель повідомляє
про позитивні видимі докази; негативна відповідь, яка лише цитує цільовий текст,
провалює перевірку. Використовуйте `--vision-mode metadata` для smoke без моделі,
який доводить роботу настільного середовища, браузера, знімка екрана та
відео-пайплайна без виклику провайдера розуміння зображень. Запис є обов’язковим
артефактом для `visual-task`; якщо Crabbox не записує непорожній
`visual-task.mp4`, завдання завершується помилкою навіть тоді, коли
visual driver пройшов. У разі збою Mantis зберігає оренду для VNC, якщо тільки
завдання вже не пройшло і `--keep-lease` не було встановлено.

Перед використанням спільних live-облікових даних виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє broker env Convex, валідує налаштування endpoint і перевіряє досяжність admin/list, коли присутній maintainer secret. Для секретів він повідомляє лише статус set/missing.

## Покриття live-транспортів

Лани live-транспортів мають спільний контракт замість того, щоб кожен винаходив власну форму списку сценаріїв. `qa-channel` є широким синтетичним набором product-behavior і не входить до матриці покриття live-транспортів.

| Лан      | Canary | Mention gating | Bot-to-bot | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція тредів | Спостереження за reaction | Help command | Реєстрація нативної команди |
| -------- | ------ | -------------- | ---------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | ------------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x                    | x                         | x                             | x                          | x               | x                         |              |                             |
| Telegram | x      | x              | x          |                      |                           |                               |                            |                 |                           | x            |                             |
| Discord  | x      | x              | x          |                      |                           |                               |                            |                 |                           |              | x                           |
| Slack    | x      | x              | x          | x                    | x                         | x                             | x                          | x               |                           |              |                             |

Це зберігає `qa-channel` як широкий набір product-behavior, тоді як Matrix,
Telegram і майбутні live-транспорти спільно використовують один явний
чекліст transport-contract.

Для disposable Linux VM-лану без залучення Docker до QA-шляху виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий екземпляр Multipass, встановлює залежності,
збирає OpenClaw усередині гостя, запускає `qa suite`, а потім копіює звичайний
QA-звіт і summary назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite`
на хості. Запуски suite на хості та в Multipass типово виконують кілька вибраних
сценаріїв паралельно з ізольованими gateway worker. `qa-channel` типово має
concurrency 4, обмежену кількістю вибраних сценаріїв. Використовуйте
`--concurrency <count>`, щоб налаштувати кількість worker, або
`--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій зазнає збою.
Використовуйте `--allow-failures`, коли потрібні артефакти без коду виходу, що
позначає помилку.
Live-запуски передають підтримувані QA auth inputs, практичні для гостя:
provider keys на основі env, шлях до QA live provider config і `CODEX_HOME`,
коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований робочий простір.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed homeserver provisioning. Telegram, Discord і Slack менші — по кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхній довідник міститься тут.

### Спільні прапорці CLI

Ці лани реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі прапорці:

| Прапорець                            | Типово                                                          | Опис                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | —                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                           |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/summary/спостережені повідомлення та вихідний лог. Відносні шляхи обчислюються від `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                    |
| `--sut-account <id>`                 | `sut`                                                           | Тимчасовий account id у конфігурації QA gateway.                                                                          |
| `--provider-mode <mode>`             | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                               |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | Refs основної/альтернативної моделі.                                                                                      |
| `--fast`                             | вимкнено                                                        | Швидкий режим провайдера там, де підтримується.                                                                           |
| `--credential-source <env\|convex>`  | `env`                                                           | Див. [пул облікових даних Convex](#convex-credential-pool).                                                              |
| `--credential-role <maintainer\|ci>` | `ci` в CI, інакше `maintainer`                                  | Роль, що використовується, коли `--credential-source convex`.                                                            |

Кожен лан завершується з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу, що позначає помилку.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома різними ботами (driver + SUT). SUT-бот має мати ім’я користувача Telegram; bot-to-bot observation найкраще працює, коли обидва боти мають увімкнений **режим взаємодії між ботами** в `@BotFather`.

Обов’язковий env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий chat id (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message (типово редагує).

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
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний канал приватної guild Discord із двома ботами: driver bot, керований harness, і SUT bot, запущений дочірнім OpenClaw gateway через bundled Discord plugin. Перевіряє обробку channel mention, те, що SUT bot зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язковий env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з SUT bot user id, поверненим Discord (інакше лан швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається окремо, бо перемикає SUT на always-on, tool-only guild replies з `messages.statusReactions.enabled=true`, а потім захоплює REST reaction timeline плюс візуальні артефакти HTML/PNG. Звіти Mantis before/after також зберігають MP4-артефакти, надані сценарієм, як `baseline.mp4` і `candidate.mp4`.

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
- `discord-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли виконується сценарій реакцій статусу.

### Slack QA

```bash
pnpm openclaw qa slack
```

Націлюється на один реальний приватний канал Slack із двома окремими ботами: ботом-драйвером, яким керує harness, і ботом SUT, запущеним дочірнім OpenClaw gateway через вбудований Slack plugin.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необов’язково:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message.

Сценарії (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Вихідні артефакти:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування робочого простору Slack

Для цієї смуги потрібні дві окремі Slack apps в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; смуга публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) застосунку **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) застосунку **SUT**, який має бути окремим Slack app від драйвера, щоб його bot user id був іншим.
- `sutAppToken` — app-level token (`xapp-...`) застосунку SUT із `connections:write`, який використовується Socket Mode, щоб застосунок SUT міг отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання production-робочого простору.

Наведений нижче маніфест SUT навмисно звужує production-встановлення вбудованого Slack plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених live Slack QA suite. Налаштування production-каналу, як його бачать користувачі, див. у [швидкому налаштуванні каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно відокремлена, бо смузі потрібні два різні bot user ids в одному робочому просторі.

**1. Створіть застосунок Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть QA workspace, вставте наведений нижче маніфест, а потім _Install to Workspace_:

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) — він стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення та ідентифікувати себе; без подій і без Socket Mode.

**2. Створіть застосунок SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Цей QA-застосунок навмисно використовує вужчу версію production-маніфесту вбудованого Slack plugin (`extensions/slack/src/setup-shared.ts:10`): scopes і події реакцій опущено, бо live Slack QA suite ще не охоплює обробку реакцій.

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
        "pin_removed"
      ]
    }
  }
}
```

Після того як Slack створить застосунок, виконайте дві дії на сторінці його налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні user ids, викликавши `auth.test` для кожного токена. Runtime розрізняє driver і SUT за user id; повторне використання одного застосунку для обох одразу призведе до збою mention-gating.

**3. Створіть канал**

У QA workspace створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте id `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — він стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тому читання історії harness усе одно працюватиме.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте env vars для налагодження на одній машині (установіть чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або заповніть спільний пул Convex, щоб CI та інші maintainers могли їх орендувати.

Для пулу Convex запишіть чотири поля у JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Коли `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` експортовано у вашій shell, зареєструйте та перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте end to end**

Запустіть смугу локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Зелений запуск завершується значно менш ніж за 30 секунд, а `slack-qa-report.md` показує `slack-canary` і `slack-mention-gating` зі статусом `pass`. Якщо смуга зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок орендовано — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Смуги Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище env vars. Передайте `--credential-source convex` (або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом усього запуску та звільняє її під час завершення. Типи пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (Slack id на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки застосунку й scopes.

Операційні env vars і контракт endpoint broker Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика broker однакова для обох типів).

## Seeds на основі репозиторію

Seed-ресурси розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має залишатися загальним markdown runner. Кожен markdown-файл сценарію є джерелом істини для одного тестового запуску й має визначати:

- metadata сценарію
- необов’язкові metadata category, capability, lane і risk
- посилання на docs і code
- необов’язкові вимоги до plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися загальною й наскрізною. Наприклад, markdown-сценарії можуть поєднувати helpers на боці transport із helpers на боці браузера, які керують вбудованим Control UI через seam Gateway `browser.request`, без додавання спеціалізованого runner.

Файли сценаріїв слід групувати за продуктною capability, а не за папкою source tree. Зберігайте scenario IDs стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для traceability реалізації.

Baseline-список має залишатися достатньо широким, щоб охоплювати:

- DM і channel chat
- поведінку thread
- життєвий цикл message action
- callbacks Cron
- memory recall
- перемикання model
- handoff subagent
- читання repo і docs
- одне невелике завдання build, наприклад Lobster Invaders

## Mock-смуги provider

`qa suite` має дві локальні mock-смуги provider:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається типовою детермінованою mock-смугою для repo-backed QA і parity gates.
- `aimock` запускає AIMock-backed provider server для експериментального protocol, fixture, record/replay і chaos coverage. Він є додатковим і не замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен provider володіє своїми defaults, запуском local server, конфігурацією gateway model, потребами staging auth-profile та прапорцями live/mock capability. Спільний код suite і gateway має маршрутизувати через provider registry замість branching за назвами providers.

## Transport adapters

`qa-lab` володіє загальним transport seam для markdown QA scenarios. `qa-channel` є першим adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або synthetic channels мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє загальним виконанням сценаріїв, worker concurrency, записом artifact і reporting.
- Transport adapter володіє конфігурацією Gateway, readiness, inbound і outbound observation, transport actions і normalized transport state.
- Markdown scenario files у `qa/scenarios/` визначають test run; `qa-lab` надає reusable runtime surface, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown QA system потребує рівно двох речей:

1. Transport adapter для каналу.
2. Scenario pack, який перевіряє channel contract.

Не додавайте новий top-level QA command root, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє shared host mechanics:

- command root `openclaw qa`
- startup і teardown suite
- worker concurrency
- запис artifact
- generation report
- виконання scenario
- aliases compatibility для старіших сценаріїв `qa-channel`

Plugin-и ранерів володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інʼєктуються вхідні події
- як спостерігаються вихідні повідомлення
- як експонуються транскрипти та нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляється специфічне для транспорту скидання або очищення

Мінімальна планка впровадження для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний ранер на спільному хостовому шві `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині Plugin ранера або обвʼязки каналу.
4. Монтуйте ранер як `openclaw qa <runner>`, а не реєструйте конкурувальну кореневу команду. Plugin-и ранерів мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ліниві CLI та виконання ранерів мають лишатися за окремими точками входу.
5. Створюйте або адаптуйте markdown-сценарії у тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте наявні псевдоніми сумісності робочими, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна один раз виразити в `qa-lab`, розміщуйте її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, тримайте її в цьому Plugin ранера або обвʼязці Plugin.
- Якщо сценарію потрібна нова можливість, яку може використовувати більш ніж один канал, додайте загальну допоміжну функцію замість специфічної для каналу гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для транспорту й чітко вказуйте це в контракті сценарію.

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати загальні назви. Псевдоніми існують, щоб уникнути одномоментної міграції, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостережуваної часової шкали шини.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Для інвентаризації доступних сценаріїв — корисної під час оцінювання обсягу подальшої роботи або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машиночитного виводу).

Для перевірок характеру та стилю запустіть той самий сценарій на кількох живих референсах моделей
і запишіть оцінений Markdown-звіт:

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
мають задавати персону через `SOUL.md`, а потім виконувати звичайні ходи користувача,
як-от чат, допомога з робочим простором і невеликі файлові завдання. Модель-кандидат
не має знати, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить моделі-суддів у швидкому режимі з
міркуванням `xhigh`, де воно підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: підказка судді все ще отримує
кожен транскрипт і статус запуску, але референси кандидатів замінюються нейтральними
мітками, як-от `candidate-01`; після розбору звіт зіставляє рейтинги назад із реальними референсами.
Запуски кандидатів за замовчуванням використовують `high` thinking, з `medium` для GPT-5.5 і `xhigh`
для старіших оцінювальних референсів OpenAI, які це підтримують. Перевизначте конкретного кандидата inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>`
збережена для сумісності.
Референси кандидатів OpenAI за замовчуванням використовують швидкий режим, щоб застосовувалася пріоритетна обробка там,
де провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
одному кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості кандидатів і суддів
записуються у звіт для аналізу бенчмарків, але підказки суддям явно кажуть
не ранжувати за швидкістю.
Запуски моделей-кандидатів і суддів за замовчуванням мають concurrency 16. Знижуйте
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження на локальний Gateway
роблять запуск надто шумним.
Коли не передано жодного кандидата `--model`, оцінювання характеру за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо не передано жодного `--model`.
Коли не передано `--judge-model`, судді за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Повʼязані документи

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
