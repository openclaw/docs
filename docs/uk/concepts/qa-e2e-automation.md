---
read_when:
    - Розуміння того, як стек контролю якості поєднується в єдине ціле
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на базі репозиторію
    - Створення реалістичнішої автоматизації контролю якості для панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, живі транспортні лінії, транспортні адаптери та звітування.'
title: Огляд контролю якості
x-i18n:
    generated_at: "2026-05-07T13:16:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw реалістичнішим,
канально-орієнтованим способом, ніж це може зробити один модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, гілки,
  реакції, редагування та видалення.
- `extensions/qa-lab`: інтерфейс налагоджувача та QA-шина для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні Plugin запуску: адаптери live-транспортів, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до й після наживо для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік виконується через `pnpm openclaw qa <subcommand>`. Багато з них мають псевдоніми сценаріїв `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                                                                                                        |
| `qa suite`                                          | Запускає сценарії з репозиторію проти QA Gateway lane. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Друкує markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                           |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний звіт про паритет.                                                                                                                                                                                          |
| `qa character-eval`                                 | Запускає сценарій QA персонажа на кількох live-моделях із оціненим звітом. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запускає одноразовий prompt проти вибраної lane провайдера/моделі.                                                                                                                                                                                                          |
| `qa ui`                                             | Запускає інтерфейс налагоджувача QA та локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Збирає попередньо підготовлений Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для QA dashboard + Gateway lane.                                                                                                                                                                                                    |
| `qa up`                                             | Збирає QA-сайт, запускає стек на Docker, друкує URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запускає лише сервер провайдера AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запускає лише сценарно-обізнаний сервер провайдера `mock-openai`.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport lane проти реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner перевірки до й після для помилок live-транспорту, з доказами status-reactions у Discord, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [Mantis Slack Desktop Runbook](/uk/concepts/mantis-slack-desktop-runbook). |

## Потік оператора

Поточний потік QA-оператора — це двопанельний QA-сайт:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Gateway lane на Docker і відкриває
сторінку QA Lab, де оператор або цикл автоматизації може дати агенту QA
місію, спостерігати реальну поведінку каналу та записувати, що спрацювало, не
спрацювало або залишилося заблокованим.

Для швидшої ітерації інтерфейсу QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle після змін, а браузер автоматично перезавантажується, коли змінюється
хеш asset QA Lab.

Для локального OpenTelemetry trace smoke виконайте:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний OTLP/HTTP trace receiver, виконує
QA-сценарій `otel-trace-smoke` з увімкненим Plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критично важливу для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
виклики моделі не повинні експортувати `StreamAbandoned` на успішних ходах; сирі діагностичні ID та
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA залишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не виконують команди `qa`. Використовуйте
`pnpm qa:otel:smoke` зі зібраного source checkout під час змін інструментації
diagnostics.

Для transport-real Matrix smoke lane виконайте:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повна довідка CLI, каталог профілів/сценаріїв, змінні середовища та структура артефактів для цієї lane наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона provision-ить одноразовий Tuwunel homeserver у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix Plugin усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-зведення, артефакт observed-events і комбінований журнал виводу в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії охоплюють поведінку транспорту, яку модульні тести не можуть довести наскрізно: mention gating, allow-bot policies, allowlists, top-level і threaded replies, DM routing, reaction handling, inbound edit suppression, restart replay dedupe, homeserver interruption recovery, approval metadata delivery, media handling, а також потоки Matrix E2EE bootstrap/recovery/verification. Профіль CLI для E2EE також проганяє `openclaw matrix encryption setup` і команди verification через той самий одноразовий homeserver перед перевіркою відповідей Gateway.

Discord також має opt-in сценарії лише для Mantis для відтворення помилок. Використовуйте
`--scenario discord-status-reactions-tool-only` для явної timeline status reaction
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
реальну гілку Discord і перевірити, що `message.thread-reply` зберігає
вкладення `filePath`. Ці сценарії не входять до типової live Discord lane,
оскільки це probes відтворення до/після, а не широке smoke-покриття.
Workflow Mantis для thread-attachment також може додати відео-свідчення з Discord Web
з авторизованим входом, коли `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` або
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` налаштовано в QA
середовищі. Цей профіль переглядача призначений лише для візуального запису; рішення
pass/fail і далі надходить від Discord REST oracle.

CI використовує ту саму поверхню команд у `.github/workflows/qa-live-transports-convex.yml`. Заплановані та типові ручні запуски виконують швидкий профіль Matrix з live frontier обліковими даними, `--fast` і `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручний `matrix_profile=all` розгортається у пʼять profile shards, щоб вичерпний каталог міг виконуватися паралельно, зберігаючи один каталог артефактів на shard.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на попередньо наявний реальний канал із двома ботами (driver + SUT). Обовʼязкові змінні середовища, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані в [довідці QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM із відновленням через VNC виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser-машину Crabbox, запускає живу гілку Slack
усередині VM, відкриває Slack Web у браузері VNC, захоплює знімок desktop і
копіює `slack-qa/`, `slack-desktop-smoke.png` та `slack-desktop-smoke.mp4`,
коли доступне захоплення відео, назад до каталогу артефактів Mantis. Оренди
desktop/browser Crabbox надають інструменти захоплення та допоміжні пакети
browser/native-build заздалегідь, тому сценарій має встановлювати резервні
залежності лише на старіших орендах. Mantis повідомляє загальні та пофазні
тривалості в `mantis-slack-desktop-smoke-report.md`, щоб у повільних запусках
було видно, куди пішов час: на прогрів оренди, отримання облікових даних,
віддалене налаштування чи копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC; повторно
використані оренди також зберігають кеш pnpm store Crabbox прогрітим. Типовий
`--hydrate-mode source` перевіряє з вихідного checkout і запускає install/build
усередині VM. Використовуйте `--hydrate-mode prehydrated` лише коли повторно
використовуваний віддалений workspace уже має `node_modules` і зібраний `dist/`;
цей режим пропускає дорогий крок install/build і завершується невдачею, якщо
workspace не готовий. З `--gateway-setup` Mantis залишає постійний OpenClaw Slack
Gateway запущеним усередині VM на порту `38973`; без нього команда запускає
звичайну bot-to-bot Slack QA-гілку та завершується після захоплення артефактів.

Контрольний список оператора, команда dispatch для GitHub workflow, контракт
evidence-comment, таблиця вибору hydrate-mode, інтерпретація тривалостей і кроки
обробки збоїв описані в [Runbook Mantis Slack Desktop](/uk/concepts/mantis-slack-desktop-runbook).

Для desktop-завдання в стилі agent/CV виконайте:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` орендує або повторно використовує desktop/browser-машину Crabbox,
запускає `crabbox record --while`, керує видимим браузером через вкладений
`visual-driver`, захоплює `visual-task.png`, запускає
`openclaw infer image describe` для знімка екрана, коли вибрано
`--vision-mode image-describe`, і записує `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` та
`mantis-visual-task-report.md`. Коли задано `--expect-text`, vision prompt
просить структурований JSON-вердикт і проходить лише тоді, коли модель
повідомляє про позитивний видимий доказ; негативна відповідь, яка лише цитує
цільовий текст, не проходить перевірку. Використовуйте `--vision-mode metadata`
для smoke без моделі, який підтверджує роботу desktop, браузера, знімка екрана
та відео-конвеєра без виклику провайдера розуміння зображень. Запис є
обов'язковим артефактом для `visual-task`; якщо Crabbox не записує непорожній
`visual-task.mp4`, завдання завершується невдачею, навіть якщо visual driver
пройшов. У разі збою Mantis зберігає оренду для VNC, якщо завдання ще не
пройшло і `--keep-lease` не було задано.

Перед використанням спільних живих облікових даних виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідує налаштування endpoint і перевіряє доступність admin/list, коли присутній секрет maintainer. Він повідомляє для секретів лише стан set/missing.

## Покриття live transport

Гілки live transport мають один спільний контракт замість того, щоб кожна винаходила власну форму списку сценаріїв. `qa-channel` є широким синтетичним набором product-behavior і не входить до матриці покриття live transport.

| Гілка    | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

Це зберігає `qa-channel` як широкий набір product-behavior, тоді як Matrix,
Telegram і майбутні live transports спільно використовують один явний
контрольний список transport-contract.

Для одноразової гілки Linux VM без залучення Docker до QA-шляху виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
підсумок назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Запуски набору на host і Multipass типово виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` типово має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість workers, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, якщо будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду завершення з помилкою.
Live runs передають підтримувані QA auth inputs, практичні для
гостя: env-based provider keys, шлях до QA live provider config і
`CODEX_HOME`, коли він присутній. Тримайте `--output-dir` під коренем репозиторію, щоб guest
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed підготовку homeserver. Telegram, Discord і Slack менші - по кілька сценаріїв кожен, без системи profile, проти вже наявних реальних channels - тому їхній довідник наведено тут.

### Спільні CLI flags

Ці гілки реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі flags:

| Flag                                  | Типове значення                                                | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та output log. Відносні шляхи обчислюються від `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                               |
| `--sut-account <id>`                  | `sut`                                                           | Тимчасовий account id усередині QA gateway config.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                             |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | Основні/альтернативні model refs.                                                                                     |
| `--fast`                              | off                                                             | Provider fast mode, де підтримується.                                                                                 |
| `--credential-source <env\|convex>`   | `env`                                                           | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                  | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна гілка завершується з ненульовим кодом у разі будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення з помилкою.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома різними ботами (driver + SUT). SUT bot повинен мати Telegram username; bot-to-bot observation найкраще працює, коли обидва боти мають увімкнений **Режим комунікації між ботами** в `@BotFather`.

Обов'язковий env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - числовий chat id (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов'язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message (типово редагуються).

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
- `telegram-qa-summary.json` - містить RTT для кожної відповіді (надсилання driver → спостережена відповідь SUT), починаючи з canary.
- `telegram-qa-observed-messages.json` - тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний channel Discord guild із двома ботами: driver bot, яким керує harness, і SUT bot, запущений дочірнім OpenClaw gateway через вбудований Discord Plugin. Перевіряє обробку channel mention, що SUT bot зареєстрував native команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов'язковий env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - має збігатися з SUT bot user id, поверненим Discord (інакше гілка швидко завершується невдачею).

Необов'язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах observed-message.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` вибирає voice/stage channel для `discord-voice-autojoin`; без нього сценарій вибирає перший видимий voice/stage channel для SUT bot.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - голосовий сценарій з явним увімкненням. Запускається самостійно, вмикає `channels.discord.voice.autoJoin` і перевіряє, що поточний голосовий стан бота SUT у Discord є цільовим голосовим/сценічним каналом. Облікові дані Convex для Discord можуть містити необов’язковий `voiceChannelId`; інакше runner знаходить перший видимий голосовий/сценічний канал у guild.
- `discord-status-reactions-tool-only` - сценарій Mantis з явним увімкненням. Запускається самостійно, бо перемикає SUT на постійно ввімкнені відповіді guild лише через інструменти з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу REST-реакцій разом із візуальними артефактами HTML/PNG. Звіти Mantis до/після також зберігають MP4-артефакти, надані сценарієм, як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій автоматичного приєднання до голосового каналу Discord явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - тіла редагуються, якщо не задано `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли запускається сценарій статусних реакцій.

### QA для Slack

```bash
pnpm openclaw qa slack
```

Націлено на один справжній приватний канал Slack із двома різними ботами: бот driver, керований harness, і бот SUT, запущений дочірнім OpenClaw Gateway через bundled Slack Plugin.

Обов’язкові змінні середовища, коли `--credential-source env`:

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
- `slack-qa-observed-messages.json` - тіла редагуються, якщо не задано `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Налаштування робочого простору Slack

Лінії потрібні дві різні програми Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` - id `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` - токен бота (`xoxb-...`) програми **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) програми **SUT**, яка має бути окремою програмою Slack від driver, щоб її id користувача-бота був іншим.
- `sutAppToken` - токен рівня програми (`xapp-...`) програми SUT з `connections:write`, який використовується Socket Mode, щоб програма SUT могла отримувати події.

Віддавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання production-робочого простору.

Наведений нижче manifest SUT навмисно звужує production-встановлення bundled Slack Plugin (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених live-набором QA для Slack. Для налаштування production-каналу так, як його бачать користувачі, див. [швидке налаштування каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо лінії потрібні два різні id користувачів-ботів в одному робочому просторі.

**1. Створіть програму Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть QA-робочий простір, вставте такий manifest, потім _Install to Workspace_:

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) - він стане `driverBotToken`. Driver потребує лише публікувати повідомлення та ідентифікувати себе; без подій, без Socket Mode.

**2. Створіть програму SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Ця QA-програма навмисно використовує вужчу версію production-manifest bundled Slack Plugin (`extensions/slack/src/setup-shared.ts:10`): scopes і події реакцій пропущено, бо live-набір QA для Slack ще не охоплює обробку реакцій.

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

Після того як Slack створить програму, виконайте дві дії на сторінці її налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні id користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє driver і SUT за id користувача; повторне використання однієї програми для обох відразу провалить mention-gating.

**3. Створіть канал**

У QA-робочому просторі створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів зсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте id `Cxxxxxxxxxx` з _channel info → About → Channel ID_ - він стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидві програми вже мають `groups:history`, тому читання історії harness однаково буде успішним.

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

З експортованими у вашій оболонці `OPENCLAW_QA_CONVEX_SITE_URL` і `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` зареєструйте та перевірте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Очікуйте `count: 1`, `status: "active"`, без поля `lease`.

**5. Перевірте end to end**

Запустіть лінію локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо лінія зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або кожен рядок орендовано - `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Лінії Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання змінних середовища вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає для неї Heartbeat протягом запуску та звільняє її під час завершення. Види пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (id Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки програм і scopes.

Операційні змінні середовища та контракт endpoint broker Convex описано в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу з’явилася до підтримки Discord; семантика broker однакова для обох видів).

## Сіди з репозиторія

Seed-активи розміщено в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб QA-план був видимий і людям, і
agent.

`qa-lab` має залишатися generic markdown runner. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane і risk
- посилання на docs і code
- необов’язкові вимоги до Plugin
- необов’язковий патч конфігурації Gateway
- виконуваний `qa-flow`

Багаторазово використовувана runtime-поверхня, що підтримує `qa-flow`, може залишатися generic
і cross-cutting. Наприклад, markdown-сценарії можуть поєднувати transport-side
helpers із browser-side helpers, які керують вбудованим Control UI через
Gateway `browser.request` seam без додавання спеціалізованого runner.

Файли сценаріїв слід групувати за capability продукту, а не за папкою source tree.
Зберігайте стабільні id сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чат у DM і каналі
- поведінку тредів
- життєвий цикл message action
- зворотні виклики cron
- memory recall
- перемикання моделей
- передачу subagent
- читання репозиторія та документації
- одне невелике завдання збірки, як-от Lobster Invaders

## Лінії імітаційних провайдерів

`qa suite` має дві локальні лінії імітаційних провайдерів:

- `mock-openai` - scenario-aware mock OpenClaw. Він залишається стандартною
  детермінованою mock-лінією для QA з репозиторія та parity gates.
- `aimock` запускає AIMock-backed provider server для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен provider володіє своїми defaults, запуском local server, конфігурацією моделі Gateway,
потребами auth-profile staging і прапорцями live/mock capability. Спільний код suite і
Gateway має маршрутизуватися через provider registry замість розгалуження за
іменами providers.

## Транспортні адаптери

`qa-lab` володіє універсальним транспортним стиком для markdown-сценаріїв QA. `qa-channel` є першим адаптером на цьому стику, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого запускальника наборів, а не додавати транспортно-специфічний запускальник QA.

На архітектурному рівні поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, паралельністю worker-ів, записом артефактів і звітністю.
- Транспортний адаптер володіє конфігурацією Gateway, готовністю, спостереженням за вхідними й вихідними подіями, транспортними діями та нормалізованим станом транспорту.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає повторно використовувану runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий верхньорівневий корінь команди QA, коли спільний хост `qa-lab` може володіти потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і завершенням набору
- паралельністю worker-ів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- псевдонімами сумісності для старіших сценаріїв `qa-channel`

Plugin-и запускальника володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як Gateway налаштовується для цього транспорту
- як перевіряється готовність
- як впроваджуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються транскрипти та нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляється транспортно-специфічне скидання або очищення

Мінімальна планка впровадження для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний запускальник на спільному хост-стику `qa-lab`.
3. Тримайте транспортно-специфічну механіку всередині Plugin-а запускальника або harness-а каналу.
4. Монтуйте запускальник як `openclaw qa <runner>`, а не реєструйте конкурентну кореневу команду. Plugin-и запускальника мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ледаче виконання CLI та запускальника має залишатися за окремими точками входу.
5. Створіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте універсальні допоміжні функції сценаріїв для нових сценаріїв.
7. Зберігайте працездатність наявних псевдонімів сумісності, якщо repo не виконує навмисну міграцію.

Правило ухвалення рішень суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому Plugin-і запускальника або harness-і Plugin-а.
- Якщо сценарію потрібна нова можливість, яку може використовувати більше ніж один канал, додайте універсальну допоміжну функцію замість канало-специфічного відгалуження в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій транспортно-специфічним і зробіть це явним у контракті сценарію.

### Назви допоміжних функцій сценаріїв

Бажані універсальні допоміжні функції для нових сценаріїв:

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - але нові сценарії слід писати з універсальними назвами. Псевдоніми існують, щоб уникнути одномоментної міграції, а не як модель на майбутнє.

## Звітність

`qa-lab` експортує Markdown-звіт протоколу зі спостережуваної часової лінії bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Для інвентаризації доступних сценаріїв - корисної під час оцінювання обсягу подальшої роботи або підключення нового транспорту - запустіть `pnpm openclaw qa coverage` (додайте `--json` для машинно-читаного виводу).

Для перевірок характеру й стилю запустіть той самий сценарій на кількох живих model refs і запишіть оцінений Markdown-звіт:

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

Команда запускає локальні дочірні процеси QA Gateway, а не Docker. Сценарії character eval мають задавати персону через `SOUL.md`, а потім виконувати звичайні ходи користувача, як-от чат, допомога з workspace і невеликі файлові завдання. Candidate model не має знати, що її оцінюють. Команда зберігає кожен повний транскрипт, записує базову статистику запуску, а потім просить judge models у fast mode з reasoning `xhigh`, де це підтримується, ранжувати запуски за природністю, вайбом і гумором.
Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: judge prompt все одно отримує кожен транскрипт і статус запуску, але candidate refs замінюються нейтральними мітками на кшталт `candidate-01`; звіт після парсингу зіставляє рейтинги назад із реальними refs.
Candidate runs типово використовують мислення `high`, з `medium` для GPT-5.5 і `xhigh` для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного кандидата inline через `--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` зберігається для сумісності.
OpenAI candidate refs типово використовують fast mode, щоб priority processing застосовувалася там, де провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли окремому candidate або judge потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете примусово увімкнути fast mode для кожної candidate model. Тривалості candidate і judge записуються у звіт для benchmark-аналізу, але judge prompts явно вказують не ранжувати за швидкістю.
Запуски candidate і judge model обидва типово мають concurrency 16. Зменшуйте `--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження локального Gateway роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval типово використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, коли `--model` не передано.
Коли `--judge-model` не передано, судді типово використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
