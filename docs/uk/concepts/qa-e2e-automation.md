---
read_when:
    - Розуміння того, як компоненти стеку QA працюють разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова реалістичнішої QA-автоматизації навколо панелі Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, транспортні лінії в реальному середовищі, транспортні адаптери та звітність.'
title: Огляд QA
x-i18n:
    generated_at: "2026-05-06T02:40:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у реалістичніший,
канально-орієнтований спосіб, ніж це може зробити окремий модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагодження та QA-шина для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери живого транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для kickoff-завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): live-перевірка до й після для багів, яким
  потрібні реальні транспорти, знімки браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають
аліаси скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                                                                                                        |
| `qa suite`                                          | Запустити сценарії з репозиторію проти QA gateway lane. Аліаси: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Вивести markdown-інвентар покриття сценаріями (`--json` для машинного виводу).                                                                                                                                                                                           |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати агентний parity-звіт.                                                                                                                                                                                          |
| `qa character-eval`                                 | Запустити QA-сценарій персонажа на кількох живих моделях зі звітом оцінювання. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної provider/model lane.                                                                                                                                                                                                          |
| `qa ui`                                             | Запустити UI налагодження QA та локальну QA-шину (аліас: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений QA Docker image.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                    |
| `qa up`                                             | Зібрати QA-сайт, запустити Docker-backed стек, вивести URL (аліас: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запустити лише AIMock provider server.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише scenario-aware `mock-openai` provider server.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live transport lane проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner перевірки до й після для багів живого транспорту, з доказами статус-реакцій Discord, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook). |

## Потік оператора

Поточний QA-потік оператора — це двопанельний QA-сайт:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-backed gateway lane і відкриває сторінку
QA Lab, де оператор або automation loop може дати агенту QA-місію,
спостерігати реальну поведінку каналу й записувати, що спрацювало, що не
спрацювало або що залишилося заблокованим.

Для швидшої ітерації UI QA Lab без перебудови Docker image щоразу
запустіть стек із bind-mounted пакетом QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному image і bind-mounts
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей пакет при зміні, а браузер автоматично перезавантажується, коли
змінюється asset hash QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим плагіном `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє release-critical форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
model calls не повинні експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають лишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається лише для source checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не виконують команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повна CLI-довідка, каталог profile/scenario, env vars і layout артефактів для цієї lane містяться в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він provision-ить одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix plugin усередині дочірнього QA gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, артефакт observed-events і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії охоплюють транспортну поведінку, яку модульні тести не можуть довести end to end: mention gating, allow-bot policies, allowlists, top-level і threaded replies, DM routing, reaction handling, inbound edit suppression, restart replay dedupe, homeserver interruption recovery, approval metadata delivery, media handling і потоки Matrix E2EE bootstrap/recovery/verification. Профіль E2EE CLI також проводить `openclaw matrix encryption setup` і команди verification через той самий одноразовий homeserver перед перевіркою відповідей gateway.

Discord також має Mantis-only opt-in сценарії для відтворення багів. Використовуйте
`--scenario discord-status-reactions-tool-only` для явної timeline статус-реакцій
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
реальний тред Discord і перевірити, що `message.thread-reply` зберігає
attachment `filePath`. Ці сценарії не входять до стандартної live Discord lane,
бо вони є before/after repro probes, а не широким smoke coverage.
Workflow Mantis для thread-attachment також може додати logged-in Discord Web
witness video, коли `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` або
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` налаштовано в QA
environment. Цей viewer profile призначений лише для visual capture; рішення pass/fail
усе одно надходить від Discord REST oracle.

CI використовує ту саму command surface у `.github/workflows/qa-live-transports-convex.yml`. Заплановані й стандартні ручні запуски виконують fast Matrix profile з live frontier credentials, `--fast` і `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручний `matrix_profile=all` розгортається у пʼять profile shards, щоб exhaustive catalog міг виконуватися паралельно, зберігаючи один artifact directory на shard.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома ботами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, output artifacts і пул облікових даних Convex задокументовані в [довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack у настільній VM з аварійним доступом через VNC виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує настільну/browser машину Crabbox, запускає live-лан Slack
усередині VM, відкриває Slack Web у браузері VNC, захоплює робочий стіл і
копіює `slack-qa/`, `slack-desktop-smoke.png` та `slack-desktop-smoke.mp4`,
коли доступне захоплення відео, назад до каталогу артефактів Mantis. Оренди
настільних/browser машин Crabbox заздалегідь надають інструменти захоплення та
допоміжні пакети браузера/native-build, тому сценарій має встановлювати
резервні варіанти лише на старіших орендах. Mantis звітує про загальні й
пофазові таймінги в `mantis-slack-desktop-smoke-report.md`, тож повільні
запуски показують, чи час пішов на прогрів оренди, отримання облікових даних,
віддалене налаштування або копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC; повторно
використані оренди також зберігають кеш сховища pnpm Crabbox теплим. Типовий
`--hydrate-mode source` перевіряє зі source checkout і запускає install/build
усередині VM. Використовуйте `--hydrate-mode prehydrated` лише тоді, коли
повторно використаний віддалений робочий простір уже має `node_modules` і
зібраний `dist/`; цей режим пропускає дорогий крок install/build і безпечно
завершується з помилкою, коли робочий простір не готовий. З `--gateway-setup`
Mantis залишає постійний OpenClaw Slack gateway запущеним усередині VM на порту
`38973`; без нього команда запускає звичайний QA-лан Slack від бота до бота й
завершується після захоплення артефактів.

Операторський контрольний список, команда dispatch для GitHub workflow, контракт
evidence-comment, таблиця вибору hydrate-mode, тлумачення таймінгів і кроки
обробки збоїв описані в [runbook для Mantis Slack Desktop](/uk/concepts/mantis-slack-desktop-runbook).

Для настільного завдання у стилі agent/CV виконайте:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` орендує або повторно використовує настільну/browser машину
Crabbox, запускає `crabbox record --while`, керує видимим браузером через
вкладений `visual-driver`, захоплює `visual-task.png`, запускає
`openclaw infer image describe` для знімка екрана, коли вибрано
`--vision-mode image-describe`, і записує `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` та
`mantis-visual-task-report.md`. Коли задано `--expect-text`, vision-підказка
просить структурований JSON-вердикт і проходить лише тоді, коли модель повідомляє
про позитивний видимий доказ; негативна відповідь, яка лише цитує цільовий
текст, не проходить перевірку. Використовуйте `--vision-mode metadata` для
smoke-перевірки без моделі, яка доводить роботу настільного середовища, браузера,
знімка екрана й відеоканалу без виклику провайдера розуміння зображень. Запис є
обов’язковим артефактом для `visual-task`; якщо Crabbox не записує непорожній
`visual-task.mp4`, завдання завершується з помилкою, навіть якщо visual driver
пройшов. У разі збою Mantis зберігає оренду для VNC, якщо завдання ще не пройшло
і `--keep-lease` не було задано.

Перед використанням спільних live-облікових даних виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідує налаштування endpoint і перевіряє доступність admin/list, коли наявний maintainer secret. Він звітує лише про стан set/missing для секретів.

## Покриття live-транспорту

Live-лани транспорту мають спільний контракт замість того, щоб кожен винаходив власну форму списку сценаріїв. `qa-channel` є широким синтетичним набором product-behavior і не входить до матриці покриття live-транспорту.

| Лан      | Канарка | Фільтрація за згадкою | Бот-бот | Блокування allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Продовження thread | Ізоляція thread | Спостереження реакцій | Команда help | Реєстрація native-команди |
| -------- | ------- | --------------------- | ------- | -------------------- | ------------------------- | ----------------------------- | ------------------ | --------------- | --------------------- | ------------ | ------------------------- |
| Matrix   | x       | x                     | x       | x                    | x                         | x                             | x                  | x               | x                     |              |                           |
| Telegram | x       | x                     | x       |                      |                           |                               |                    |                 |                       | x            |                           |
| Discord  | x       | x                     | x       |                      |                           |                               |                    |                 |                       |              | x                         |
| Slack    | x       | x                     | x       | x                    | x                         | x                             | x                  | x               |                       |              |                           |

Це залишає `qa-channel` широким набором product-behavior, тоді як Matrix,
Telegram і майбутні live-транспорти мають один явний контрольний список
transport-contract.

Для одноразового лану Linux VM без додавання Docker у QA-шлях виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
summary назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
Запуски suite на хості та в Multipass за замовчуванням виконують кілька вибраних сценаріїв паралельно з ізольованими gateway workers. `qa-channel` типово має concurrency 4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати кількість worker, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій завершується помилкою. Використовуйте `--allow-failures`, коли потрібні артефакти без помилкового exit code.
Live-запуски передають підтримувані QA auth inputs, практичні для гостя: provider keys на основі env, шлях до QA live provider config і `CODEX_HOME`, коли він наявний. Тримайте `--output-dir` під коренем репозиторію, щоб гість міг записувати назад через змонтований робочий простір.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed provisioning homeserver. Telegram, Discord і Slack менші - по кілька сценаріїв кожен, без profile system, проти вже наявних реальних каналів - тому їхній довідник розміщено тут.

### Спільні CLI прапорці

Ці лани реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі прапорці:

| Прапорець                            | Типово                                                          | Опис                                                                                                                  |
| ------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | -                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/summary/observed messages і output log. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                 | `sut`                                                           | Тимчасовий account id усередині QA gateway config.                                                                    |
| `--provider-mode <mode>`             | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                             |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | Refs основної/альтернативної моделі.                                                                                  |
| `--fast`                             | off                                                             | Provider fast mode, де підтримується.                                                                                 |
| `--credential-source <env\|convex>`  | `env`                                                           | Див. [credential pool Convex](#convex-credential-pool).                                                               |
| `--credential-role <maintainer\|ci>` | `ci` у CI, інакше `maintainer`                                  | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожен лан завершується з ненульовим кодом при будь-якому невдалому сценарії. `--allow-failures` записує артефакти без встановлення помилкового exit code.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Цілиться в одну реальну приватну групу Telegram із двома різними ботами (driver + SUT). SUT bot повинен мати Telegram username; спостереження bot-to-bot працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - числовий chat id (рядок).
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
- `telegram-qa-summary.json` - містить RTT для кожної відповіді (driver send → observed SUT reply), починаючи з canary.
- `telegram-qa-observed-messages.json` - тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Цілиться в один реальний приватний channel Discord guild із двома ботами: driver bot, керованим harness, і SUT bot, запущеним дочірнім OpenClaw gateway через bundled Discord plugin. Перевіряє обробку згадок channel, що SUT bot зареєстрував native-команду `/help` у Discord, і opt-in сценарії Mantis evidence.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - має збігатися з SUT bot user id, який повертає Discord (інакше лан швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - opt-in сценарій Mantis. Запускається окремо, бо перемикає SUT на always-on, tool-only guild replies з `messages.statusReactions.enabled=true`, а потім захоплює REST reaction timeline плюс візуальні артефакти HTML/PNG. Звіти Mantis before/after також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

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
- `discord-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли виконується сценарій реакцій статусу.

### Slack QA

```bash
pnpm openclaw qa slack
```

Націлено на один реальний приватний канал Slack із двома окремими ботами: ботом-драйвером, керованим harness, і ботом SUT, запущеним дочірнім OpenClaw gateway через вбудований Slack Plugin.

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
- `slack-qa-observed-messages.json` - тіла редагуються, якщо не встановлено `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування робочого простору Slack

Лінії потрібні дві окремі програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` - ідентифікатор `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` - токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від драйвера, щоб її ідентифікатор користувача-бота був окремим.
- `sutAppToken` - токен рівня програми (`xapp-...`) програми SUT із `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Надавайте перевагу робочому простору Slack, призначеному для QA, замість повторного використання production-робочого простору.

Наведений нижче маніфест SUT навмисно звужує production-встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених живим набором Slack QA. Для налаштування production-каналу так, як його бачать користувачі, див. [Швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно відокремлена, оскільки лінії потрібні два окремі ідентифікатори користувачів-ботів в одному робочому просторі.

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) - він стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення та ідентифікувати себе; без подій, без Socket Mode.

**2. Створіть програму SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Ця QA-програма навмисно використовує вужчу версію production-маніфесту вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`): scopes і події реакцій пропущені, оскільки живий набір Slack QA ще не охоплює обробку реакцій.

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

Після того як Slack створить програму, виконайте дві дії на її сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання однієї програми для обох одразу призведе до збою mention-gating.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів ізсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ - він стане `channelId`. Підійде публічний канал; якщо ви використовуєте приватний канал, обидві програми вже мають `groups:history`, тож читання історії harness усе одно буде успішним.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте змінні середовища для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші maintainers могли їх орендувати.

Для пулу Convex запишіть чотири поля у JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

З експортованими у вашій оболонці `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` зареєструйте й перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте наскрізно**

Запустіть лінію локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно менш ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо лінія зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок орендовано - `qa credentials list --kind slack --status all --json` покаже, який саме випадок.

### Пул облікових даних Convex

Лінії Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї Heartbeat протягом усього запуску та звільняє її під час завершення роботи. Види пулів: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) для підготовки програми та scope.

Операційні змінні середовища та контракт endpoint Convex broker описані в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика broker ідентична для обох видів).

## Seeds із репозиторію

Seed-ресурси містяться в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має залишатися загальним markdown-runner. Кожен markdown-файл сценарію є джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані category, capability, lane і risk
- посилання на документацію та код
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися загальною та наскрізною. Наприклад, markdown-сценарії можуть поєднувати transport-side helpers із browser-side helpers, які керують вбудованим Control UI через шов Gateway `browser.request` без додавання runner для спеціального випадку.

Файли сценаріїв слід групувати за можливістю продукту, а не за папкою дерева вихідного коду. Зберігайте стабільні ідентифікатори сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чат у DM і каналі
- поведінку thread
- життєвий цикл дії повідомлення
- callback-функції cron
- пригадування пам’яті
- перемикання моделі
- передавання subagent
- читання репозиторію та документації
- одне невелике завдання збірки, як-от Lobster Invaders

## Лінії mock-провайдерів

`qa suite` має дві локальні лінії mock-провайдерів:

- `mock-openai` - це сценарно-обізнаний mock OpenClaw. Він залишається стандартною детермінованою mock-лінією для QA з репозиторію та parity gates.
- `aimock` запускає provider server на базі AIMock для експериментального protocol, fixture, record/replay і chaos-покриття. Він є додатковим і не замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane міститься в `extensions/qa-lab/src/providers/`. Кожен провайдер володіє своїми defaults, запуском локального сервера, конфігурацією моделі Gateway, потребами staging для auth-profile та прапорцями можливостей live/mock. Спільний код suite і gateway має маршрутизувати через registry провайдерів, а не розгалужуватися за іменами провайдерів.

## Transport adapters

`qa-lab` володіє загальним transport seam для markdown-сценаріїв QA. `qa-channel` є першим adapter на цьому seam, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє загальним виконанням сценаріїв, паралельністю workers, записом артефактів і звітністю.
- Transport adapter володіє конфігурацією Gateway, готовністю, вхідним і вихідним спостереженням, transport actions і нормалізованим transport state.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Transport adapter для каналу.
2. Пак сценаріїв, який перевіряє контракт каналу.

Не додавайте новий top-level корінь команд QA, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє спільними механіками host:

- корінь команди `openclaw qa`
- запуск і завершення suite
- конкурентність worker
- запис артефактів
- генерація звіту
- виконання сценаріїв
- псевдоніми сумісності для старіших сценаріїв `qa-channel`

Плагіни runner відповідають за контракт транспорту:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як інʼєктуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляється специфічне для транспорту скидання або очищення

Мінімальний поріг упровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному шві хоста `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Залишайте `runtime-api.ts` легким; ліниве виконання CLI і runner має залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних директоріях `qa/scenarios/`.
6. Використовуйте generic scenario helpers для нових сценаріїв.
7. Зберігайте роботу наявних псевдонімів сумісності, якщо repo не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова можливість, яку можуть використовувати кілька каналів, додайте generic helper замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій transport-specific і явно зафіксуйте це в контракті сценарію.

### Назви scenario helper

Бажані generic helpers для нових сценаріїв:

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - але нові сценарії слід писати з використанням generic назв. Псевдоніми існують, щоб уникнути міграції flag-day, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостережуваної timeline bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up сценарії варто додати

Для інвентаризації доступних сценаріїв - корисно під час оцінювання обсягу follow-up роботи або підключення нового транспорту - запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable виводу).

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

Команда запускає дочірні процеси локального QA gateway, а не Docker. Character eval
scenarios мають задавати persona через `SOUL.md`, а потім виконувати звичайні user turns
на кшталт chat, workspace help і small file tasks. Candidate model не має
знати, що її оцінюють. Команда зберігає кожен повний
transcript, записує базову статистику запуску, а потім просить judge models у fast mode з
reasoning `xhigh`, де це підтримується, ранжувати запуски за naturalness, vibe і humor.
Використовуйте `--blind-judge-models`, коли порівнюєте providers: judge prompt усе ще отримує
кожен transcript і статус запуску, але candidate refs замінюються нейтральними
мітками на кшталт `candidate-01`; після parsing звіт відображає rankings назад до реальних refs.
Candidate runs за замовчуванням використовують thinking `high`, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` збережена
для сумісності.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб priority processing застосовувався там,
де provider це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремий candidate або judge потребує перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у звіт для benchmark analysis, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски candidate і judge model обидва за замовчуванням мають concurrency 16. Зменшуйте
`--concurrency` або `--judge-concurrency`, коли provider limits або тиск на local gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли `--model` не передано.
Коли `--judge-model` не передано, judges за замовчуванням використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Повʼязані docs

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Testing](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
