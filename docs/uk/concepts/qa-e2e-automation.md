---
read_when:
    - Розуміння того, як узгоджено працює стек QA
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Створення QA-автоматизації з вищим рівнем реалістичності для панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії на основі репозиторію, live-смуги транспорту, транспортні адаптери та звітування.'
title: Огляд QA
x-i18n:
    generated_at: "2026-05-05T19:03:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cc6dcfd3614fc0f923398ec85ffe5c1cc76d810f22ae395ee465c9c70dd0c00
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний стек QA призначений для перевірки OpenClaw реалістичніше,
у форматі каналів, ніж це може зробити один модульний тест.

Поточні складники:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, треду,
  реакцій, редагування й видалення.
- `extensions/qa-lab`: UI налагоджувача й QA-шина для спостереження за транскриптом,
  ін’єкції вхідних повідомлень та експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні плагіни запуску: адаптери live-транспортів, які
  керують реальним каналом усередині дочірнього QA Gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до й після наживо для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають псевдоніми
скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                                             |
| `qa suite`                                          | Запустити сценарії з репозиторію проти смуги QA Gateway. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                                                       |
| `qa coverage`                                       | Вивести Markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                                                |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати agentic-звіт паритету.                                                                                                               |
| `qa character-eval`                                 | Запустити QA-сценарій персонажа на кількох live-моделях зі звітом із суддівською оцінкою. Див. [Звітування](#reporting).                                                                                 |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраної смуги провайдера/моделі.                                                                                                                               |
| `qa ui`                                             | Запустити UI налагоджувача QA та локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений Docker-образ QA.                                                                                                                                                          |
| `qa docker-scaffold`                                | Записати docker-compose scaffold для QA-дашборда + смуги Gateway.                                                                                                                         |
| `qa up`                                             | Зібрати QA-сайт, запустити Docker-backed стек, вивести URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Запустити лише сервер провайдера AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Запустити лише сервер провайдера `mock-openai`, обізнаний зі сценаріями.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                                                    |
| `qa matrix`                                         | Смуга live-транспорту проти одноразового homeserver Tuwunel. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Смуга live-транспорту проти реальної приватної групи Telegram.                                                                                                                                   |
| `qa discord`                                        | Смуга live-транспорту проти реального приватного каналу гільдії Discord.                                                                                                                            |
| `qa slack`                                          | Смуга live-транспорту проти реального приватного каналу Slack.                                                                                                                                    |
| `qa mantis`                                         | Runner перевірки до й після для помилок live-транспорту, з доказами Discord status-reactions, Crabbox desktop/browser smoke і Slack-in-VNC smoke. Див. [Mantis](/uk/concepts/mantis). |

## Потік оператора

Поточний потік оператора QA — це двопанельний QA-сайт:

- Ліворуч: дашборд Gateway (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-backed смугу Gateway і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA-місію,
спостерігати реальну поведінку каналу й записати, що спрацювало, що не вдалося або
що залишилося заблокованим.

Для швидшої ітерації UI QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted бандлом QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mount-ить
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей бандл при зміні, а браузер автоматично перезавантажується, коли змінюється
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
виклики моделі не повинні експортувати `StreamAbandoned` на успішних ходах; сирі діагностичні ID та
атрибути `openclaw.content.*` мають залишатися поза трасою. Він записує
`otel-smoke-summary.json` поруч з артефактами QA suite.

Observability QA лишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому Docker-смуги релізу пакета не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` зі зібраного source-checkout під час зміни інструментації
діагностики.

Для transport-real Matrix smoke-смуги запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повна довідка CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цієї смуги описані в [Matrix QA](/uk/concepts/qa-matrix). Коротко: вона створює одноразовий homeserver Tuwunel у Docker, реєструє тимчасових користувачів driver/SUT/observer, запускає реальний плагін Matrix усередині дочірнього QA Gateway, обмеженого цим транспортом (без `qa-channel`), а потім записує Markdown-звіт, JSON summary, артефакт observed-events і комбінований output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram, Discord і Slack smoke-смуг:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Вони націлені на вже наявний реальний канал із двома ботами (driver + SUT). Обов’язкові env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані в [довідці QA для Telegram, Discord і Slack](#telegram-discord-and-slack-qa-reference) нижче.

Для повного запуску Slack desktop VM з VNC rescue виконайте:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ця команда орендує desktop/browser машину Crabbox, запускає Slack live-смугу
всередині VM, відкриває Slack Web у браузері VNC, захоплює desktop і
копіює `slack-qa/`, `slack-desktop-smoke.png` та `slack-desktop-smoke.mp4`,
коли доступний відеозапис, назад у директорію артефактів Mantis. Оренди Crabbox
desktop/browser наперед надають інструменти захоплення та допоміжні пакети
browser/native-build, тому сценарій має встановлювати fallback-и лише на старіших
орендах. Повторно використовуйте `--lease-id <cbx_...>` після ручного входу в Slack Web
через VNC; повторно використані оренди також зберігають cache pnpm store Crabbox теплим. З
`--gateway-setup` Mantis залишає постійний OpenClaw Slack Gateway запущеним
усередині VM на порту `38973`; без нього команда запускає звичайну
bot-to-bot смугу Slack QA і виходить після захоплення артефактів.

Для agent/CV стилю desktop-завдання запустіть:

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
Коли встановлено `--expect-text`, vision prompt просить структурований JSON
verdict і проходить лише тоді, коли модель повідомляє позитивний видимий доказ; 
негативна відповідь, яка лише цитує цільовий текст, не проходить assertion.
Використовуйте `--vision-mode metadata` для no-model smoke, який доводить працездатність desktop,
браузера, знімка екрана та відео plumbing без виклику провайдера image-understanding.
Запис є обов’язковим артефактом для `visual-task`; якщо Crabbox не записує
непорожній `visual-task.mp4`, завдання завершується помилкою, навіть коли visual driver
пройшов. У разі помилки Mantis зберігає оренду для VNC, якщо завдання вже не
пройшло і `--keep-lease` не було встановлено.

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env брокера Convex, валідовує налаштування endpoint і перевіряє досяжність admin/list, коли присутній секрет maintainer. Для секретів він повідомляє лише статус set/missing.

## Покриття live-транспорту

Смуги live-транспорту спільно використовують один контракт замість того, щоб кожна вигадувала власну форму списку сценаріїв. `qa-channel` — це широкий синтетичний набір перевірок поведінки продукту і він не є частиною матриці покриття live-транспорту.

| Лінія    | Канарковий тест | Обмеження за згадкою | Бот-до-бота | Блокування списком дозволених | Відповідь верхнього рівня | Відновлення після перезапуску | Подальша відповідь у треді | Ізоляція треду | Спостереження за реакціями | Команда довідки | Нативна реєстрація команд |
| -------- | --------------- | -------------------- | ----------- | ----------------------------- | ------------------------- | ----------------------------- | -------------------------- | --------------- | -------------------------- | --------------- | -------------------------- |
| Matrix   | x               | x                    | x           | x                             | x                         | x                             | x                          | x               | x                          |                 |                            |
| Telegram | x               | x                    | x           |                               |                           |                               |                            |                 |                            | x               |                            |
| Discord  | x               | x                    | x           |                               |                           |                               |                            |                 |                            |                 | x                          |
| Slack    | x               | x                    | x           |                               |                           |                               |                            |                 |                            |                 |                            |

Це зберігає `qa-channel` як широкий набір тестів поведінки продукту, тоді як Matrix,
Telegram і майбутні живі транспорти спільно використовують один явний контрольний
список контрактів транспорту.

Для одноразової лінії Linux VM без додавання Docker до QA-шляху запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий гостьовий екземпляр Multipass, встановлює залежності, збирає OpenClaw
усередині гостя, запускає `qa suite`, а потім копіює звичайний QA-звіт і
підсумок назад у `.artifacts/qa-e2e/...` на хості.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на хості.
Запуски набору на хості та в Multipass типово виконують кілька вибраних сценаріїв паралельно
з ізольованими працівниками Gateway. Для `qa-channel` типова паралельність
4, обмежена кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість працівників, або `--concurrency 1` для послідовного виконання.
Команда завершується з ненульовим кодом, якщо будь-який сценарій не проходить. Використовуйте `--allow-failures`, коли
потрібні артефакти без коду завершення помилки.
Живі запуски передають підтримувані QA-вхідні дані автентифікації, практичні для
гостя: ключі провайдера на основі env, шлях до конфігурації QA live provider і
`CODEX_HOME`, якщо він наявний. Тримайте `--output-dir` під коренем репозиторію, щоб гість
міг записувати назад через змонтований робочий простір.

## Довідник QA для Telegram, Discord і Slack

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і підготовку homeserver на базі Docker. Telegram, Discord і Slack менші — по кілька сценаріїв кожен, без системи профілів, проти вже наявних реальних каналів — тому їхній довідник розміщено тут.

### Спільні прапорці CLI

Ці лінії реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають однакові прапорці:

| Прапорець                            | Типово                                                         | Опис                                                                                                               |
| ------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                    | —                                                              | Запустити лише цей сценарій. Можна повторювати.                                                                    |
| `--output-dir <path>`                | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи розв’язуються відносно `--repo-root`. |
| `--repo-root <path>`                 | `process.cwd()`                                                | Корінь репозиторію під час виклику з нейтрального cwd.                                                             |
| `--sut-account <id>`                 | `sut`                                                          | Тимчасовий ідентифікатор облікового запису всередині QA-конфігурації Gateway.                                      |
| `--provider-mode <mode>`             | `live-frontier`                                                | `mock-openai` або `live-frontier` (застарілий `live-openai` досі працює).                                          |
| `--model <ref>` / `--alt-model <ref>` | типово для провайдера                                         | Посилання на основну/альтернативну модель.                                                                         |
| `--fast`                             | вимкнено                                                       | Швидкий режим провайдера, де підтримується.                                                                        |
| `--credential-source <env\|convex>`  | `env`                                                          | Див. [пул облікових даних Convex](#convex-credential-pool).                                                        |
| `--credential-role <maintainer\|ci>` | `ci` у CI, інакше `maintainer`                                 | Роль, що використовується, коли `--credential-source convex`.                                                      |

Кожна лінія завершується з ненульовим кодом за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду завершення помилки.

### QA для Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну реальну приватну групу Telegram із двома різними ботами (драйвер + SUT). SUT-бот повинен мати ім’я користувача Telegram; спостереження бот-до-бота найкраще працює, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** в `@BotFather`.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий ідентифікатор чату (рядок).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Необов’язково:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень (типово редагує).

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
- `telegram-qa-summary.json` — містить RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з канаркового тесту.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA для Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один реальний приватний канал guild Discord із двома ботами: ботом-драйвером, яким керує harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Discord Plugin. Перевіряє обробку згадок у каналі, що SUT-бот зареєстрував нативну команду `/help` у Discord, і opt-in сценарії доказів Mantis.

Обов’язкові env, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача SUT-бота, який повертає Discord (інакше лінія швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Запускається самостійно, бо перемикає SUT на завжди ввімкнені відповіді guild лише через tools з `messages.statusReactions.enabled=true`, потім фіксує REST-хронологію реакцій і візуальні артефакти HTML/PNG. Звіти Mantis до/після також зберігають надані сценарієм MP4-артефакти як `baseline.mp4` і `candidate.mp4`.

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

Націлюється на один реальний приватний канал Slack із двома різними ботами: ботом-драйвером, яким керує harness, і SUT-ботом, запущеним дочірнім OpenClaw Gateway через вбудований Slack Plugin.

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

Лінії потрібні дві різні Slack apps в одному робочому просторі, а також канал, учасниками якого є обидва боти:

- `channelId` — ідентифікатор `Cxxxxxxxxxx` каналу, до якого запрошено обох ботів. Використовуйте окремий канал; лінія публікує повідомлення під час кожного запуску.
- `driverBotToken` — токен бота (`xoxb-...`) застосунку **Driver**.
- `sutBotToken` — токен бота (`xoxb-...`) застосунку **SUT**, який має бути окремим застосунком Slack від драйвера, щоб його ідентифікатор користувача-бота був іншим.
- `sutAppToken` — токен рівня застосунку (`xapp-...`) застосунку SUT з `connections:write`, який використовується Socket Mode, щоб застосунок SUT міг отримувати події.

Віддавайте перевагу робочому простору Slack, виділеному для QA, замість повторного використання production workspace.

Наведений нижче маніфест SUT віддзеркалює production-встановлення вбудованого Slack Plugin (`extensions/slack/src/setup-shared.ts:10`). Налаштування production-каналу таким, як його бачать користувачі, див. у [швидкому налаштуванні каналу Slack](/uk/channels/slack#quick-setup); пара QA Driver/SUT навмисно окрема, бо лінії потрібні два різні ідентифікатори користувачів-ботів в одному робочому просторі.

**1. Створіть застосунок Driver**

Перейдіть до [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → виберіть QA workspace, вставте наведений нижче маніфест, потім _Install to Workspace_:

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

**2. Створіть застосунок SUT**

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

Після того як Slack створить застосунок, виконайте дві дії на його сторінці налаштувань:

- _Install to Workspace_ → скопіюйте _Bot User OAuth Token_ → це стане `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → додайте scope `connections:write` → збережіть → скопіюйте значення `xapp-...` → це стане `sutAppToken`.

Перевірте, що два боти мають різні ідентифікатори користувачів, викликавши `auth.test` для кожного токена. Середовище виконання розрізняє драйвер і SUT за ідентифікатором користувача; повторне використання одного застосунку для обох одразу провалить фільтрацію згадок.

**3. Створіть канал**

У робочому просторі QA створіть канал (наприклад, `#openclaw-qa`) і запросіть обох ботів зсередини каналу:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопіюйте ідентифікатор `Cxxxxxxxxxx` з _channel info → About → Channel ID_ — це стане `channelId`. Публічний канал підходить; якщо ви використовуєте приватний канал, обидва застосунки вже мають `groups:history`, тому читання історії в тестовому каркасі все одно успішно працюватиме.

**4. Зареєструйте облікові дані**

Є два варіанти. Використовуйте env vars для налагодження на одній машині (задайте чотири змінні `OPENCLAW_QA_SLACK_*` і передайте `--credential-source env`) або засійте спільний пул Convex, щоб CI та інші супровідники могли брати їх в оренду.

Для пулу Convex запишіть чотири поля у JSON-файл:

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

**5. Перевірте наскрізно**

Запустіть lane локально, щоб підтвердити, що обидва боти можуть спілкуватися один з одним через broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успішний запуск завершується значно швидше ніж за 30 секунд, а `slack-qa-report.md` показує і `slack-canary`, і `slack-mention-gating` зі статусом `pass`. Якщо lane зависає приблизно на 90 секунд і завершується з `Convex credential pool exhausted for kind "slack"`, то або пул порожній, або всі рядки орендовано — `qa credentials list --kind slack --status all --json` покаже, що саме.

### Пул облікових даних Convex

Lane Telegram, Discord і Slack можуть брати облікові дані зі спільного пулу Convex замість читання env vars вище. Передайте `--credential-source convex` (або задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом запуску та звільняє її під час завершення. Види пулу: `"telegram"`, `"discord"` і `"slack"`.

Форми payload, які broker перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком chat-id.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` має відповідати `^[A-Z][A-Z0-9]+$` (ідентифікатор Slack на кшталт `Cxxxxxxxxxx`). Див. [Налаштування робочого простору Slack](#setting-up-the-slack-workspace) щодо підготовки застосунку та scope.

Операційні env vars і контракт endpoint broker Convex описано в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу з’явилася до підтримки Discord; семантика broker однакова для обох видів).

## Сіди з репозиторію

Seed assets розміщено в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися універсальним runner Markdown. Кожен markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane і ризику
- посилання на документацію та код
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації Gateway
- виконуваний `qa-flow`

Багаторазова runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, markdown-сценарії можуть поєднувати helper-и транспортного боку
з helper-ами браузерного боку, які керують вбудованим Control UI через
шов Gateway `browser.request`, не додаючи runner для спеціального випадку.

Файли сценаріїв слід групувати за можливостями продукту, а не за папкою
дерева вихідного коду. Зберігайте стабільні ідентифікатори сценаріїв під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для простежуваності реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- чат у DM і каналі
- поведінку thread
- життєвий цикл message action
- зворотні виклики Cron
- згадування з пам’яті
- перемикання моделей
- передавання subagent
- читання репозиторію та читання документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Mock lane провайдера

`qa suite` має два локальні mock lane провайдера:

- `mock-openai` — це сценарно-орієнтований mock OpenClaw. Він залишається стандартним
  детермінованим mock lane для QA з репозиторію та parity gates.
- `aimock` запускає provider server на базі AIMock для експериментального protocol,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює dispatcher сценаріїв `mock-openai`.

Реалізація provider-lane міститься в `extensions/qa-lab/src/providers/`.
Кожен provider володіє своїми defaults, запуском локального server, конфігурацією gateway model,
потребами staging auth-profile, а також прапорцями live/mock capability. Спільний код suite і
gateway має маршрутизуватися через provider registry замість branching за
іменами provider.

## Транспортні адаптери

`qa-lab` володіє універсальним транспортним швом для markdown-сценаріїв QA. `qa-channel` є першим адаптером на цьому шві, але ціль дизайну ширша: майбутні реальні або синтетичні канали мають підключатися до того самого suite runner замість додавання транспортно-специфічного QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, конкурентністю worker, записом артефактів і звітуванням.
- Транспортний адаптер володіє конфігурацією gateway, готовністю, вхідним і вихідним спостереженням, транспортними діями та нормалізованим транспортним станом.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазову runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до markdown-системи QA вимагає рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий top-level корінь команди QA, коли спільний host `qa-lab` може володіти flow.

`qa-lab` володіє механікою спільного host:

- коренем команди `openclaw qa`
- запуском і teardown suite
- конкурентністю worker
- записом артефактів
- генерацією звіту
- виконанням сценаріїв
- alias сумісності для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway налаштовується для цього транспорту
- як перевіряється готовність
- як впроваджуються вхідні події
- як спостерігаються вихідні повідомлення
- як надаються transcripts і нормалізований транспортний стан
- як виконуються transport-backed actions
- як обробляється транспортно-специфічне reset або cleanup

Мінімальний поріг прийняття для нового каналу:

1. Залиште `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте транспортно-специфічну механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої root command. Runner plugins мають оголошувати `qaRunners` в `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` з `runtime-api.ts`. Тримайте `runtime-api.ts` легким; lazy CLI і виконання runner мають залишатися за окремими entrypoints.
5. Напишіть або адаптуйте markdown-сценарії в тематичних каталогах `qa/scenarios/`.
6. Використовуйте універсальні helper-и сценаріїв для нових сценаріїв.
7. Підтримуйте роботу наявних alias сумісності, якщо репозиторій не виконує навмисну міграцію.

Правило рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, помістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку можуть використовувати кілька каналів, додайте універсальний helper замість channel-specific branch у `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій транспортно-специфічним і явно зазначте це в контракті сценарію.

### Назви helper-ів сценаріїв

Бажані універсальні helper-и для нових сценаріїв:

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

Alias сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але нові сценарії слід писати з універсальними назвами. Alias існують, щоб уникнути одночасної примусової міграції, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт protocol зі спостережуваного timeline bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які follow-up сценарії варто додати

Для інвентарю доступних сценаріїв — корисного під час оцінювання follow-up work або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машиночитного виводу).

Для перевірок характеру та стилю запустіть той самий сценарій на кількох live model
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

Команда запускає локальні дочірні процеси QA Gateway, а не Docker. Сценарії оцінювання характеру мають задавати персону через `SOUL.md`, а потім виконувати звичайні користувацькі ходи, як-от чат, допомогу з робочою областю та невеликі файлові завдання. Моделі-кандидату не слід повідомляти, що її оцінюють. Команда зберігає кожен повний транскрипт, записує базову статистику запуску, а потім просить моделі-судді у швидкому режимі з міркуванням `xhigh`, де це підтримується, ранжувати запуски за природністю, настроєм і гумором.
Використовуйте `--blind-judge-models` під час порівняння провайдерів: промпт судді все одно отримує кожен транскрипт і статус запуску, але посилання на кандидатів замінюються нейтральними мітками, як-от `candidate-01`; після розбору звіт зіставляє рейтинги з реальними посиланнями.
Запуски кандидатів за замовчуванням використовують рівень мислення `high`, з `medium` для GPT-5.5 і `xhigh` для старіших оцінювальних посилань OpenAI, які це підтримують. Перевизначте окремого кандидата безпосередньо через `--model provider/model,thinking=<level>`. `--thinking <level>` все ще задає глобальний резервний варіант, а старіша форма `--model-thinking <provider/model=level>` збережена для сумісності.
Посилання на кандидатів OpenAI за замовчуванням використовують швидкий режим, щоб пріоритетна обробка застосовувалася там, де провайдер її підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` безпосередньо, коли окремому кандидату чи судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете примусово ввімкнути швидкий режим для кожної моделі-кандидата. Тривалості роботи кандидатів і суддів записуються у звіт для аналізу бенчмарків, але промпти суддів явно вказують не ранжувати за швидкістю.
Запуски моделей-кандидатів і моделей-суддів за замовчуванням обидва мають паралельність 16. Зменште `--concurrency` або `--judge-concurrency`, коли обмеження провайдера чи навантаження на локальний Gateway роблять запуск надто шумним.
Коли не передано жодного кандидата через `--model`, оцінювання характеру за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли `--judge-model` не передано, судді за замовчуванням:
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язана документація

- [Матриця QA](/uk/concepts/qa-matrix)
- [Канал QA](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Панель керування](/uk/web/dashboard)
