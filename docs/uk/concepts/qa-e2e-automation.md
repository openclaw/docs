---
read_when:
    - Розуміння того, як компоненти QA-стека працюють разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на базі репозиторію
    - Створення QA-автоматизації з вищим рівнем реалістичності навколо панелі Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на базі репозиторію, живі транспортні лінії, транспортні адаптери та звітність.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-06T00:26:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5556e440063386f3c6c54d986648bcebc0a49ce152815f3bc262b701526c4537
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у більш реалістичний,
схожий на канал спосіб, ніж це може зробити один модульний тест.

Поточні складові:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача і QA-шина для спостереження за транскриптом,
  інʼєкції вхідних повідомлень та експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner Plugin-и: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA-сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до і після наживо для багів, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                                                                                                        |
| `qa suite`                                          | Запустити сценарії з репозиторію проти лінії QA Gateway. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Вивести Markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                           |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати agentic-звіт паритету.                                                                                                                                                                                          |
| `qa character-eval`                                 | Запустити QA-сценарій характеру на кількох живих моделях зі звітом після оцінювання. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної лінії provider/model.                                                                                                                                                                                                          |
| `qa ui`                                             | Запустити UI QA-нaлагоджувача і локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений QA Docker-образ.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA-дашборда + лінії Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Зібрати QA-сайт, запустити стек на Docker і вивести URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запустити лише сервер AIMock-провайдера.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише сервер провайдера `mock-openai`, обізнаний зі сценаріями.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Жива транспортна лінія проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Жива транспортна лінія проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Жива транспортна лінія проти реального приватного каналу гільдії Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Жива транспортна лінія проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner перевірки до і після для багів живого транспорту, з доказами статус-реакцій Discord, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook). |

## Потік оператора

Поточний потік QA-оператора — це двопанельний QA-сайт:

- Ліворуч: дашборд Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає лінію Gateway на Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу та записувати, що спрацювало, не спрацювало або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторної збірки Docker-образу щоразу
запустіть стек із bind-mounted QA Lab bundle:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle при зміні, а браузер автоматично перезавантажується, коли змінюється
asset hash QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не повинні експортувати `StreamAbandoned` на успішних turns; сирі diagnostic IDs і
атрибути `openclaw.content.*` мають лишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається лише для source-checkout. Npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час зміни diagnostics
instrumentation.

Для транспортно-реальної Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і схема артефактів для цієї лінії наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона provision-ить одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix Plugin усередині дочірнього QA Gateway, scoped до цього транспорту (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, observed-events artifact і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії покривають транспортну поведінку, яку модульні тести не можуть довести end to end: mention gating, allow-bot policies, allowlists, top-level and threaded replies, DM routing, reaction handling, inbound edit suppression, restart replay dedupe, homeserver interruption recovery, approval metadata delivery, media handling, а також Matrix E2EE bootstrap/recovery/verification flows. Профіль E2EE CLI також виконує `openclaw matrix encryption setup` і команди verification через той самий одноразовий homeserver перед перевіркою відповідей Gateway.

Discord також має Mantis-only opt-in сценарії для відтворення багів. Використовуйте
`--scenario discord-status-reactions-tool-only` для явної timeline статус-реакцій
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
реальний тред Discord і перевірити, що `message.thread-reply` зберігає
вкладення `filePath`. Ці сценарії не входять до default live Discord lane,
оскільки це repro probes до/після, а не широке smoke-покриття.

CI використовує ту саму поверхню команд у `.github/workflows/qa-live-transports-convex.yml`. Заплановані й default ручні запуски виконують fast Matrix profile з live frontier credentials, `--fast` і `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручний `matrix_profile=all` розгалужується на пʼять profile shards, щоб exhaustive catalog міг працювати паралельно, зберігаючи один каталог артефактів на shard.

Для транспортно-реальних Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома bot-ами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, вихідні артефакти і пул облікових даних Convex задокументовані в [довіднику Telegram, Discord і Slack QA](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM із VNC rescue виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує настільну/browser-машину Crabbox, запускає живу лінію Slack
усередині VM, відкриває Slack Web у VNC-браузері, захоплює робочий стіл і
копіює `slack-qa/`, `slack-desktop-smoke.png` та `slack-desktop-smoke.mp4`,
коли відеозахоплення доступне, назад у каталог артефактів Mantis. Оренди
настільних/browser-машин Crabbox одразу надають інструменти захоплення та
допоміжні пакети для браузера/нативного складання, тож сценарій має встановлювати
резервні варіанти лише на старіших орендах. Mantis повідомляє загальні та
пофазові таймінги в `mantis-slack-desktop-smoke-report.md`, щоб повільні запуски
показували, куди пішов час: на прогрів оренди, отримання облікових даних,
віддалене налаштування чи копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC; повторно
використані оренди також зберігають теплим кеш pnpm store Crabbox. Типовий режим
`--hydrate-mode source` перевіряє з вихідного checkout і запускає install/build
усередині VM. Використовуйте `--hydrate-mode prehydrated` лише тоді, коли повторно
використаний віддалений workspace вже має `node_modules` і зібраний `dist/`; цей
режим пропускає дорогий крок install/build і завершується помилкою, якщо
workspace не готовий. З `--gateway-setup` Mantis залишає постійний OpenClaw Slack
Gateway запущеним усередині VM на порту `38973`; без цього команда запускає
звичайну лінію Slack QA bot-to-bot і виходить після захоплення артефактів.

Операторський checklist, команда dispatch для GitHub workflow, контракт коментаря
з доказами, таблиця вибору hydrate-mode, інтерпретація таймінгів і кроки обробки
збоїв наведені в [runbook Mantis Slack Desktop](/uk/concepts/mantis-slack-desktop-runbook).

Для настільного завдання в стилі agent/CV запустіть:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` орендує або повторно використовує настільну/browser-машину Crabbox,
запускає `crabbox record --while`, керує видимим браузером через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає
`openclaw infer image describe` для знімка екрана, коли вибрано
`--vision-mode image-describe`, і записує `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` та
`mantis-visual-task-report.md`. Коли задано `--expect-text`, vision prompt просить
структурований JSON-вердикт і проходить лише тоді, коли модель повідомляє про
позитивний видимий доказ; негативна відповідь, яка лише цитує цільовий текст, не
проходить перевірку. Використовуйте `--vision-mode metadata` для no-model smoke,
який підтверджує роботу настільного середовища, браузера, знімка екрана та
відеоканалу без виклику провайдера розпізнавання зображень. Запис є обов'язковим
артефактом для `visual-task`; якщо Crabbox не записує непорожній
`visual-task.mp4`, завдання завершується помилкою, навіть коли visual driver
пройшов. У разі збою Mantis зберігає оренду для VNC, якщо завдання ще не пройшло
і `--keep-lease` не було задано.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє доступність admin/list, коли присутній секрет maintainer. Для секретів він повідомляє лише статус set/missing.

## Покриття живих транспортів

Лінії живих транспортів спільно використовують один контракт замість того, щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` є широким синтетичним набором product-behavior і не входить до матриці покриття живих транспортів.

| Лінія    | Контрольний тест | Фільтрація згадок | Bot-to-bot | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у thread | Ізоляція thread | Спостереження реакцій | Команда help | Реєстрація нативної команди |
| -------- | ---------------- | ----------------- | ---------- | -------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | --------------------- | ------------ | --------------------------- |
| Matrix   | x                | x                 | x          | x                    | x                         | x                             | x                          | x               | x                     |              |                             |
| Telegram | x                | x                 | x          |                      |                           |                               |                            |                 |                       | x            |                             |
| Discord  | x                | x                 | x          |                      |                           |                               |                            |                 |                       |              | x                           |
| Slack    | x                | x                 | x          | x                    | x                         | x                             | x                          | x               |                       |              |                             |

Це зберігає `qa-channel` як широкий набір product-behavior, тоді як Matrix,
Telegram і майбутні живі транспорти спільно використовують один явний checklist
transport-contract.

Для одноразової лінії Linux VM без внесення Docker у шлях QA запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і summary
назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски suite на host і в Multipass типово виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` типово має concurrency 4,
обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб
налаштувати кількість workers, або `--concurrency 1` для serial виконання.
Команда виходить із ненульовим кодом, коли будь-який сценарій завершується збоєм. Використовуйте `--allow-failures`, коли
вам потрібні артефакти без коду виходу, що позначає збій.
Живі запуски передають підтримувані QA auth inputs, практичні для
гостя: provider keys на основі env, шлях до конфігу QA live provider і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed підготовку homeserver. Telegram, Discord і Slack менші — кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхній довідник наведено тут.

### Спільні CLI flags

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові flags:

| Flag                                  | Типове значення                                               | Опис                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                             | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/summary/observed messages і вихідний log. Відносні шляхи розв'язуються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                               | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                         | Тимчасовий account id усередині QA gateway config.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                               | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                             |
| `--model <ref>` / `--alt-model <ref>` | provider default                                              | Refs основної/альтернативної моделі.                                                                                  |
| `--fast`                              | off                                                           | Provider fast mode, де підтримується.                                                                                 |
| `--credential-source <env\|convex>`   | `env`                                                         | Див. [credential pool Convex](#convex-credential-pool).                                                               |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна лінія виходить із ненульовим кодом за будь-якого сценарію, що завершився збоєм. `--allow-failures` записує артефакти без встановлення коду виходу, що позначає збій.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Орієнтується на одну реальну приватну групу Telegram із двома різними ботами (driver + SUT). SUT-бот має мати Telegram username; bot-to-bot observation працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов'язковий env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий chat id (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов'язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в observed-message artifacts (типово редагуються).

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
- `telegram-qa-summary.json` — містить per-reply RTT (driver send → observed SUT reply), починаючи з canary.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Орієнтується на один реальний приватний канал Discord guild із двома ботами: driver bot, керований harness, і SUT bot, запущений дочірнім OpenClaw Gateway через bundled Discord plugin. Перевіряє обробку channel mention, що SUT bot зареєстрував нативну команду `/help` у Discord, і opt-in сценарії Mantis evidence.

Обов'язковий env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з SUT bot user id, повернутим Discord (інакше лінія швидко завершується помилкою).

Необов'язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в observed-message artifacts.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається окремо, бо перемикає SUT на always-on, tool-only guild replies з `messages.statusReactions.enabled=true`, а потім захоплює REST reaction timeline плюс HTML/PNG visual artifacts. Звіти Mantis before/after також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

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
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій реакцій статусу.

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлюється на один реальний приватний канал Slack із двома різними ботами: ботом-драйвером, яким керує тестовий стенд, і ботом SUT, запущеним дочірнім Gateway OpenClaw через вбудований Plugin Slack.

Обов’язкові змінні середовища, коли використовується `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необов’язково:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

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

Лінії потрібні дві окремі програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — ідентифікатор `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від драйвера, щоб її ідентифікатор користувача-бота був іншим.
- `sutAppToken` — токен рівня програми (`xapp-...`) програми SUT із `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання робочого простору production.

Наведений нижче маніфест SUT навмисно звужує production-встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених живим набором QA Slack. Для налаштування production-каналу таким, яким його бачать користувачі, див. [Швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо лінії потрібні два різні ідентифікатори користувачів-ботів в одному робочому просторі.

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

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Ця програма QA навмисно використовує вужчу версію production-маніфесту вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`): області доступу й події реакцій опущено, бо живий набір QA Slack ще не охоплює обробку реакцій.

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

Після того як Slack створить програму, зробіть дві речі на її сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте область доступу `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання однієї програми для обох одразу спричинить збій перевірки згадок.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — він стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидві програми вже мають `groups:history`, тож читання історії тестовим стендом усе одно буде успішним.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (встановіть чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші супровідники могли орендувати їх.

Для пулу Convex запишіть чотири поля у файл JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Коли `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` експортовано у вашій оболонці, зареєструйте й перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте end to end**

Запустіть лінію локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо лінія зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок орендовано — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Лінії Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом запуску й звільняє її під час завершення. Види пулів: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки програми й областей доступу.

Операційні змінні середовища й контракт endpoint брокера Convex описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика брокера однакова для обох видів).

## Засівання з репозиторію

Ресурси засівання містяться в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має залишатися універсальним runner для markdown. Кожен markdown-файл сценарію є джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, можливості, лінії й ризику
- посилання на документацію й код
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною й наскрізною. Наприклад, markdown-сценарії можуть поєднувати допоміжні засоби на боці транспорту з допоміжними засобами на боці браузера, які керують вбудованим Control UI через стик Gateway `browser.request`, без додавання runner для особливого випадку.

Файли сценаріїв слід групувати за можливостями продукту, а не за папками дерева джерел. Зберігайте стабільні ідентифікатори сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чати в DM і каналах
- поведінку тредів
- життєвий цикл дій із повідомленнями
- callback-и Cron
- пригадування пам’яті
- перемикання моделей
- передавання підлеглому агенту
- читання репозиторію й документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Лінії моків провайдерів

`qa suite` має дві локальні лінії моків провайдерів:

- `mock-openai` — сценарно-обізнаний мок OpenClaw. Він залишається стандартною детермінованою лінією моків для QA з репозиторію й parity gates.
- `aimock` запускає сервер провайдера на основі AIMock для експериментального protocol, fixture, record/replay і chaos-покриття. Він є додатковим і не замінює диспетчер сценаріїв `mock-openai`.

Реалізація лінії провайдера міститься в `extensions/qa-lab/src/providers/`. Кожен провайдер володіє своїми стандартними значеннями, запуском локального сервера, конфігурацією моделі Gateway, потребами staging для auth-profile і прапорцями live/mock можливостей. Спільний код suite і Gateway має маршрутизувати через реєстр провайдерів, а не розгалужуватися за назвами провайдерів.

## Транспортні адаптери

`qa-lab` володіє універсальним стиком транспорту для markdown-сценаріїв QA. `qa-channel` — перший адаптер на цьому стику, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання transport-specific runner для QA.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, конкурентністю worker-ів, записом артефактів і звітністю.
- Транспортний адаптер володіє конфігурацією Gateway, готовністю, inbound і outbound спостереженням, транспортними діями й нормалізованим станом транспорту.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий top-level корінь команди QA, коли спільний host `qa-lab` може володіти потоком.

`qa-lab` володіє спільними механіками host:

- корінь команди `openclaw qa`
- запуск і teardown suite
- конкурентність worker-ів
- запис артефактів
- генерація звіту
- виконання сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Плагіни runner володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як впроваджуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляються специфічні для транспорту скидання або очищення

Мінімальна планка впровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному host seam `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині плагіна runner або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Плагіни runner мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ледаче виконання CLI та runner має залишатися за окремими entrypoints.
5. Створіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте загальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте наявні псевдоніми сумісності робочими, якщо в репозиторії не виконується навмисна міграція.

Правило прийняття рішень суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від транспорту одного каналу, тримайте її в цьому плагіні runner або plugin harness.
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
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Для інвентарю доступних сценаріїв — корисного під час оцінювання обсягу подальшої роботи або підключення нового транспорту — виконайте `pnpm openclaw qa coverage` (додайте `--json` для машиночитного виводу).

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

Команда запускає локальні дочірні процеси QA gateway, а не Docker. Сценарії character eval
мають задавати persona через `SOUL.md`, а потім виконувати звичайні ходи користувача,
такі як чат, допомога з workspace і невеликі файлові завдання. Candidate model не слід
повідомляти, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить judge models у fast mode з
reasoning `xhigh`, де це підтримується, ранжувати запуски за природністю, vibe і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: judge prompt усе ще отримує
кожен transcript і run status, але candidate refs замінюються нейтральними
мітками, такими як `candidate-01`; після parsing звіт відображає ранжування назад на реальні refs.
Candidate runs за замовчуванням використовують thinking `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` зберігається
для сумісності.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб priority processing застосовувалася там, де
провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у звіті для benchmark analysis, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски candidate і judge model обидва за замовчуванням мають concurrency 16. Зменште
`--concurrency` або `--judge-concurrency`, коли provider limits або навантаження на local gateway
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
- [Dashboard](/uk/web/dashboard)
