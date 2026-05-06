---
read_when:
    - Розуміння того, як стек QA працює разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Побудова реалістичнішої автоматизації контролю якості для панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, лінії живого транспорту, транспортні адаптери та звітність.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-06T01:51:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 106fcd224e7a13e2f7fafeb928622f3849ab341b1ee37a5a128b62c8f03d814c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw реалістичніше, у спосіб,
схожий на канали, ніж це може зробити один модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, потоку,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача і шина QA для спостереження за транскриптом,
  інʼєкції вхідних повідомлень та експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner-плагіни: адаптери live-транспорту, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: підтримувані репозиторієм початкові ресурси для kickoff-завдання та базових
  сценаріїв QA.
- [Mantis](/uk/concepts/mantis): перевірка до і після наживо для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                                                                                                        |
| `qa suite`                                          | Запускає підтримувані репозиторієм сценарії в lane QA gateway. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Виводить markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                                                                                           |
| `qa parity-report`                                  | Порівнює два файли `qa-suite-summary.json` і записує агентний звіт паритету.                                                                                                                                                                                          |
| `qa character-eval`                                 | Запускає сценарій QA персонажа на кількох live-моделях зі звітом оцінювання. Див. [Звітування](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запускає одноразовий prompt у вибраному lane провайдера/моделі.                                                                                                                                                                                                          |
| `qa ui`                                             | Запускає UI налагоджувача QA і локальну шину QA (псевдонім: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Збирає попередньо підготовлений Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записує docker-compose scaffold для панелі QA + lane gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Збирає сайт QA, запускає стек на базі Docker, виводить URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запускає лише сервер провайдера AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запускає лише сервер провайдера `mock-openai`, обізнаний зі сценаріями.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керує спільним пулом облікових даних Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live transport lane для одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane для реальної приватної групи Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport lane для реального приватного каналу гільдії Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport lane для реального приватного каналу Slack.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner перевірки до і після для помилок live-транспорту, з доказами status-reactions у Discord, desktop/browser smoke у Crabbox і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis) і [регламент запуску Mantis Slack Desktop](/uk/concepts/mantis-slack-desktop-runbook). |

## Потік оператора

Поточний потік оператора QA — це двопанельний QA-сайт:

- Ліворуч: панель Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає сайт QA, запускає lane gateway на базі Docker і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу і записати, що спрацювало, що не
спрацювало або що залишилося заблокованим.

Для швидшої ітерації UI QA Lab без повторної збірки Docker-образу щоразу
запустіть стек із bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mounts
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей bundle під час змін, а браузер автоматично перезавантажується, коли
змінюється хеш ресурсу QA Lab.

Для локального OpenTelemetry trace smoke запустіть:

```bash
pnpm qa:otel:smoke
```

Цей скрипт запускає локальний приймач OTLP/HTTP trace, виконує
QA-сценарій `otel-trace-smoke` з увімкненим plugin `diagnostics-otel`, потім
декодує експортовані protobuf spans і перевіряє критичну для релізу форму:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` і `openclaw.message.delivery` мають бути присутні;
виклики моделі не мають експортувати `StreamAbandoned` на успішних turn; сирі діагностичні ID і
атрибути `openclaw.content.*` мають залишатися поза trace. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

QA спостережуваності лишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout, коли змінюєте diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і схема артефактів для цього lane наведені в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він піднімає одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний Matrix plugin усередині дочірнього QA gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON-зведення, артефакт observed-events і обʼєднаний output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарії покривають транспортну поведінку, яку модульні тести не можуть довести end to end: mention gating, політики allow-bot, allowlists, відповіді верхнього рівня і в потоках, маршрутизацію DM, обробку реакцій, придушення вхідних редагувань, дедуплікацію restart replay, відновлення після переривання homeserver, доставку approval metadata, обробку медіа та потоки bootstrap/recovery/verification для Matrix E2EE. Профіль CLI E2EE також проводить команди `openclaw matrix encryption setup` і verification через той самий одноразовий homeserver перед перевіркою відповідей gateway.

Discord також має Mantis-only opt-in сценарії для відтворення помилок. Використовуйте
`--scenario discord-status-reactions-tool-only` для явної timeline status reaction
або `--scenario discord-thread-reply-filepath-attachment`, щоб створити
реальний потік Discord і перевірити, що `message.thread-reply` зберігає
вкладення `filePath`. Ці сценарії не входять до стандартного live Discord lane,
бо вони є пробами before/after repro, а не широким smoke-покриттям.
Workflow Mantis для вкладення в потоці також може додати відео witness із залогіненого Discord Web,
коли `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` або
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` налаштовано в середовищі QA.
Цей профіль переглядача призначений лише для візуального захоплення; рішення pass/fail
усе одно надходить від Discord REST oracle.

CI використовує ту саму поверхню команд у `.github/workflows/qa-live-transports-convex.yml`. Заплановані та стандартні ручні запуски виконують швидкий профіль Matrix із live frontier credentials, `--fast` і `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручний `matrix_profile=all` розгалужується на пʼять profile shards, щоб вичерпний каталог міг виконуватися паралельно, зберігаючи один каталог артефактів на shard.

Для transport-real Telegram, Discord і Slack smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на наявний реальний канал із двома ботами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, вихідні артефакти і пул облікових даних Convex задокументовані нижче в [довіднику QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference).

Для повного запуску Slack desktop VM із резервним доступом через VNC виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує настільну/браузерну машину Crabbox, запускає живу лінію Slack
усередині VM, відкриває Slack Web у браузері VNC, захоплює робочий стіл і
копіює `slack-qa/`, `slack-desktop-smoke.png` і `slack-desktop-smoke.mp4`,
коли відеозахоплення доступне, назад у каталог артефактів Mantis. Оренди
настільних/браузерних машин Crabbox заздалегідь надають інструменти захоплення
та допоміжні пакети для браузера/нативної збірки, тож сценарій має встановлювати
резервні залежності лише на старіших орендах. Mantis звітує про загальні та
пофазові тривалості в `mantis-slack-desktop-smoke-report.md`, щоб повільні
запуски показували, куди пішов час: на прогрів оренди, отримання облікових
даних, віддалене налаштування чи копіювання артефактів. Повторно використовуйте
`--lease-id <cbx_...>` після ручного входу в Slack Web через VNC; повторно
використані оренди також зберігають кеш сховища pnpm у Crabbox прогрітим.
Типовий режим `--hydrate-mode source` перевіряє з вихідного checkout і запускає
встановлення/збірку всередині VM. Використовуйте `--hydrate-mode prehydrated`
лише коли повторно використаний віддалений робочий простір уже має `node_modules`
і зібраний `dist/`; цей режим пропускає дорогий крок встановлення/збірки та
завершується із закритою помилкою, коли робочий простір не готовий. З
`--gateway-setup` Mantis залишає постійний OpenClaw Slack Gateway, що працює
всередині VM на порту `38973`; без цього прапорця команда запускає звичайну
лінію Slack QA бот-до-бота й виходить після захоплення артефактів.

Контрольний список оператора, команда запуску GitHub workflow, контракт
коментаря з доказами, таблиця вибору hydrate-mode, інтерпретація тривалостей і
кроки обробки відмов наведені в [Runbook Mantis Slack Desktop](/uk/concepts/mantis-slack-desktop-runbook).

Для настільного завдання в стилі агента/CV виконайте:

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
`mantis-visual-task-report.md`. Коли задано `--expect-text`, візуальна підказка
просить структурований JSON-вердикт і проходить лише тоді, коли модель повідомляє
про позитивний видимий доказ; негативна відповідь, яка лише цитує цільовий текст,
не проходить перевірку. Використовуйте `--vision-mode metadata` для smoke без
моделі, який доводить роботу настільного середовища, браузера, знімка екрана та
відеоканалу без виклику провайдера розуміння зображень. Запис є обов’язковим
артефактом для `visual-task`; якщо Crabbox не записує непорожній
`visual-task.mp4`, завдання завершується помилкою, навіть якщо візуальний драйвер
пройшов. У разі відмови Mantis зберігає оренду для VNC, якщо завдання ще не
пройшло і `--keep-lease` не було задано.

Перед використанням спільних живих облікових даних виконайте:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, перевіряє налаштування endpoint і перевіряє досяжність admin/list, коли наявний секрет супровідника. Для секретів він повідомляє лише стан set/missing.

## Покриття живого транспорту

Живі транспортні лінії спільно використовують один контракт, замість того щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний набір поведінки продукту, і він не є частиною матриці покриття живого транспорту.

| Лінія    | Canary | Гейтинг згадок | Бот-до-бота | Блок allowlist | Відповідь верхнього рівня | Відновлення після перезапуску | Продовження треду | Ізоляція треду | Спостереження реакцій | Команда help | Реєстрація нативної команди |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

Це залишає `qa-channel` широким набором поведінки продукту, тоді як Matrix,
Telegram і майбутні живі транспорти спільно використовують один явний
контрольний список транспортного контракту.

Для одноразової лінії Linux VM без додавання Docker у шлях QA виконайте:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий екземпляр Multipass, встановлює залежності,
збирає OpenClaw усередині гостя, запускає `qa suite`, а потім копіює звичайний
звіт QA і підсумок назад у `.artifacts/qa-e2e/...` на хості.
Вона повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite`
на хості. Запуски набору на хості й у Multipass типово виконують кілька вибраних
сценаріїв паралельно з ізольованими робітниками Gateway. `qa-channel` типово
має concurrency 4, обмежену кількістю вибраних сценаріїв. Використовуйте
`--concurrency <count>`, щоб налаштувати кількість робітників, або
`--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, коли будь-який сценарій не проходить.
Використовуйте `--allow-failures`, коли потрібні артефакти без коду виходу
помилки. Живі запуски передають підтримувані вхідні дані автентифікації QA,
які практичні для гостя: ключі провайдерів на основі env, шлях конфігурації
живого провайдера QA і `CODEX_HOME`, коли він наявний. Тримайте `--output-dir`
під коренем репозиторію, щоб гість міг записувати назад через змонтований
робочий простір.

## Довідка QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку homeserver на базі Docker. Telegram, Discord і Slack менші — по кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів, — тому їхня довідка наведена тут.

### Спільні прапорці CLI

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі прапорці:

| Прапорець                             | Типове значення                                                | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи визначаються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                           | Тимчасовий ідентифікатор акаунта всередині конфігурації QA Gateway.                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` або `live-frontier` (застарілий `live-openai` усе ще працює).                                           |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                        | Швидкий режим провайдера там, де підтримується.                                                                       |
| `--credential-source <env\|convex>`   | `env`                                                           | Див. [пул облікових даних Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                                  | Роль, що використовується, коли `--credential-source convex`.                                                         |

Кожна лінія завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу помилки.

### Telegram QA

```bash
pnpm openclaw qa telegram
```

Націлено на одну реальну приватну групу Telegram із двома різними ботами (драйвер + SUT). Бот SUT повинен мати username Telegram; спостереження бот-до-бота працює найкраще, коли в обох ботів увімкнено **Режим взаємодії бот-до-бота** в `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий chat id (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень (типово редагуються).

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
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не задано `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### Discord QA

```bash
pnpm openclaw qa discord
```

Націлено на один реальний приватний канал гільдії Discord із двома ботами: бот-драйвер, яким керує harness, і бот SUT, запущений дочірнім OpenClaw Gateway через пакетний Discord Plugin. Перевіряє обробку згадок каналу, що бот SUT зареєстрував нативну команду `/help` у Discord, і opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача бота SUT, поверненим Discord (інакше лінія швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на постійно ввімкнені, лише інструментальні відповіді гільдії з `messages.statusReactions.enabled=true`, а потім захоплює часову шкалу REST-реакцій плюс візуальні артефакти HTML/PNG. Звіти Mantis до/після також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

Запустіть сценарій Mantis для status-reaction явно:

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

### QA Slack

```bash
pnpm openclaw qa slack
```

Націлено на один справжній приватний канал Slack із двома різними ботами: ботом-драйвером, яким керує обв'язка, і ботом SUT, запущеним дочірнім OpenClaw Gateway через комплектний Plugin Slack.

Обов'язкові змінні середовища, коли використовується `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необов'язково:

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

Для цієї лінії потрібні два різні додатки Slack в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — ідентифікатор `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте виділений канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) додатка **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) додатка **SUT**, який має бути окремим додатком Slack від драйвера, щоб його ідентифікатор користувача-бота був іншим.
- `sutAppToken` — токен рівня додатка (`xapp-...`) додатка SUT із `connections:write`, який використовується Socket Mode, щоб додаток SUT міг отримувати події.

Надавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання робочого простору production.

Маніфест SUT нижче навмисно звужує production-встановлення комплектного Plugin Slack (`extensions/slack/src/setup-shared.ts:10`) до дозволів і подій, охоплених live-набором QA Slack. Налаштування production-каналу так, як його бачать користувачі, див. у [швидкому налаштуванні каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, оскільки лінії потрібні два різні ідентифікатори користувачів-ботів в одному робочому просторі.

**1. Створіть додаток Driver**

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

Скопіюйте _Bot User OAuth Token_ (`xoxb-...`) — він стане `driverBotToken`. Драйверу потрібно лише публікувати повідомлення та ідентифікувати себе; без подій, без Socket Mode.

**2. Створіть додаток SUT**

Повторіть _Create New App → From a manifest_ у тому самому робочому просторі. Цей додаток QA навмисно використовує звужену версію production-маніфесту комплектного Plugin Slack (`extensions/slack/src/setup-shared.ts:10`): дозволи й події реакцій опущено, бо live-набір QA Slack ще не охоплює обробку реакцій.

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

Після того як Slack створить додаток, зробіть дві дії на сторінці його налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → він стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → воно стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Runtime розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання одного додатка для обох одразу зламає фільтрацію згадок.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів зсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — він стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва додатки вже мають `groups:history`, тому читання історії обв'язкою все одно буде успішним.

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

**5. Перевірте повністю**

Запустіть лінію локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно менше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо лінія зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, пул або порожній, або всі рядки орендовано — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Лінії Telegram, Discord і Slack можуть орендувати облікові дані зі спільного пулу Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом виконання запуску та звільняє її під час завершення. Види пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки додатка та scope.

Операційні змінні середовища й контракт кінцевої точки брокера Convex описано в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика брокера однакова для обох видів).

## Засівання з репозиторію

Ресурси засівання розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і агенту.

`qa-lab` має залишатися універсальним markdown-виконавцем. Кожен markdown-файл сценарію є джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов'язкові метадані категорії, capability, лінії та ризику
- посилання на документацію й код
- необов'язкові вимоги до Plugin
- необов'язковий патч конфігурації Gateway
- виконуваний `qa-flow`

Повторно використовувана runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною і наскрізною. Наприклад, markdown-сценарії можуть поєднувати допоміжні засоби на боці транспорту з допоміжними засобами на боці браузера, які керують вбудованим Control UI через seam `browser.request` Gateway без додавання спеціального runner.

Файли сценаріїв слід групувати за capability продукту, а не за папкою дерева вихідного коду. Зберігайте ідентифікатори сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs` для відстежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чат DM і каналу
- поведінку thread
- життєвий цикл дії з повідомленням
- зворотні виклики cron
- відтворення пам'яті
- перемикання моделі
- передачу subagent
- читання репозиторію й читання документації
- невелике завдання збірки, наприклад Lobster Invaders

## Мок-лінії провайдерів

`qa suite` має дві локальні мок-лінії провайдерів:

- `mock-openai` — сценарно обізнаний мок OpenClaw. Він залишається типовою детермінованою мок-лінією для QA з репозиторію та parity gates.
- `aimock` запускає сервер провайдера на базі AIMock для експериментального покриття протоколу, fixture, record/replay і chaos. Він є додатковим і не замінює диспетчер сценаріїв `mock-openai`.

Реалізація ліній провайдерів розміщена в `extensions/qa-lab/src/providers/`. Кожен провайдер володіє своїми типовими параметрами, запуском локального сервера, конфігурацією моделі Gateway, потребами підготовки auth-profile та прапорцями live/mock capability. Спільний код suite і Gateway має маршрутизуватися через реєстр провайдерів, а не розгалужуватися за назвами провайдерів.

## Транспортні адаптери

`qa-lab` володіє універсальним транспортним seam для markdown-сценаріїв QA. `qa-channel` — перший адаптер на цьому seam, але ціль дизайну ширша: майбутні справжні або синтетичні канали мають підключатися до того самого runner набору замість додавання транспортно-специфічного runner QA.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, конкурентністю worker, записом артефактів і звітуванням.
- Транспортний адаптер володіє конфігурацією Gateway, готовністю, спостереженням за вхідними та вихідними даними, транспортними діями й нормалізованим станом транспорту.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає повторно використовувану runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA потребує рівно двох речей:

1. Транспортний адаптер для каналу.
2. Пакет сценаріїв, який перевіряє контракт каналу.

Не додавайте новий кореневий командний розділ QA верхнього рівня, коли спільний хост `qa-lab` може володіти потоком.

`qa-lab` володіє механікою спільного хоста:

- корінь команди `openclaw qa`
- запуск і завершення suite
- конкурентність worker-ів
- запис артефактів
- генерування звітів
- виконання сценаріїв
- псевдоніми сумісності для старіших сценаріїв `qa-channel`

Plugin-и runner-а володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як вхідні події інʼєктуються
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований стан транспорту
- як виконуються дії, підкріплені транспортом
- як обробляється скидання або очищення, специфічне для транспорту

Мінімальна планка впровадження для нового каналу:

1. Залишайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте транспортний runner на спільному host seam `qa-lab`.
3. Тримайте специфічну для транспорту механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; ліниві CLI та виконання runner-а мають залишатися за окремими entrypoints.
5. Створюйте або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте generic scenario helpers для нових сценаріїв.
7. Зберігайте працездатність наявних псевдонімів сумісності, якщо repo не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більше ніж один канал, додайте generic helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залишайте сценарій специфічним для транспорту й зробіть це явним у контракті сценарію.

### Імена scenario helper-ів

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

Псевдоніми сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але для написання нових сценаріїв слід використовувати generic names. Псевдоніми існують, щоб уникнути flag-day migration, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown protocol report зі спостереженої bus timeline.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up scenarios варто додати

Для inventory доступних сценаріїв — корисного під час оцінювання follow-up work або підʼєднання нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для machine-readable output).

Для перевірок характеру й стилю запустіть той самий сценарій на кількох live model
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

Команда запускає локальні child processes QA gateway, а не Docker. Сценарії character eval
мають задавати persona через `SOUL.md`, а потім виконувати звичайні user turns,
як-от chat, workspace help і small file tasks. Candidate model не має
знати, що її оцінюють. Команда зберігає кожен повний
transcript, записує basic run stats, а потім просить judge models у fast mode з
`xhigh` reasoning, де це підтримується, ранжувати запуски за naturalness, vibe і humor.
Використовуйте `--blind-judge-models`, коли порівнюєте providers: judge prompt усе одно отримує
кожен transcript і run status, але candidate refs замінюються нейтральними
labels, як-от `candidate-01`; звіт зіставляє rankings із реальними refs після
парсингу.
Candidate runs за замовчуванням використовують `high` thinking, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного candidate inline через
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
global fallback, а старішу форму `--model-thinking <provider/model=level>` збережено
для сумісності.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб priority processing застосовувався там,
де provider це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремий candidate або judge потребує override. Передавайте `--fast` лише тоді, коли потрібно
примусово ввімкнути fast mode для кожної candidate model. Тривалості candidate і judge
записуються у звіті для benchmark analysis, але judge prompts прямо вказують
не ранжувати за швидкістю.
Запуски candidate і judge model обидва за замовчуванням мають concurrency 16. Зменшуйте
`--concurrency` або `--judge-concurrency`, коли provider limits або навантаження на local gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли `--judge-model` не передано, judges за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Повʼязані docs

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
