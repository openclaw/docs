---
read_when:
    - Розуміння того, як складові QA-стека працюють разом
    - Розширення qa-lab, qa-channel або транспортного адаптера
    - Додавання QA-сценаріїв на основі репозиторію
    - Створення реалістичнішої QA-автоматизації навколо панелі керування Gateway
summary: 'Огляд стеку QA: qa-lab, qa-channel, сценарії, підтримувані репозиторієм, лінії живого транспорту, транспортні адаптери та звітність.'
title: Огляд забезпечення якості
x-i18n:
    generated_at: "2026-05-03T16:04:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b4fd8107a4f46e394c9de74d07947310de210e8bff2b4daaea57d0f3644fd60
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватний QA-стек призначений для перевірки OpenClaw у більш реалістичний
канально-орієнтований спосіб, ніж це може зробити один модульний тест.

Поточні компоненти:

- `extensions/qa-channel`: синтетичний канал повідомлень із поверхнями DM, каналу, потоку,
  реакції, редагування та видалення.
- `extensions/qa-lab`: UI налагоджувача та QA-шина для спостереження за транскриптом,
  інʼєкції вхідних повідомлень і експорту Markdown-звіту.
- `extensions/qa-matrix`, майбутні runner plugins: адаптери live-транспортів, які
  керують реальним каналом усередині дочірнього QA gateway.
- `qa/`: seed-ресурси з репозиторію для стартового завдання та базових QA
  сценаріїв.
- [Mantis](/uk/concepts/mantis): перевірка до і після live-верифікації для помилок, яким
  потрібні реальні транспорти, знімки екрана браузера, стан VM і докази PR.

## Поверхня команд

Кожен QA-потік запускається через `pnpm openclaw qa <subcommand>`. Багато з них мають
псевдоніми скриптів `pnpm qa:*`; підтримуються обидві форми.

| Команда                                             | Призначення                                                                                                                                                             |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Вбудована самоперевірка QA; записує Markdown-звіт.                                                                                                                      |
| `qa suite`                                          | Запустити сценарії з репозиторію проти QA gateway lane. Псевдоніми: `pnpm openclaw qa suite --runner multipass` для одноразової Linux VM.                              |
| `qa coverage`                                       | Вивести markdown-інвентар покриття сценаріїв (`--json` для машинного виводу).                                                                                          |
| `qa parity-report`                                  | Порівняти два файли `qa-suite-summary.json` і записати agentic-звіт про паритет.                                                                                        |
| `qa character-eval`                                 | Запустити character QA-сценарій на кількох live-моделях зі звітом оцінювання. Див. [Звітування](#reporting).                                                           |
| `qa manual`                                         | Запустити одноразовий prompt проти вибраного provider/model lane.                                                                                                       |
| `qa ui`                                             | Запустити UI налагоджувача QA і локальну QA-шину (псевдонім: `pnpm qa:lab:ui`).                                                                                         |
| `qa docker-build-image`                             | Зібрати попередньо підготовлений QA Docker-образ.                                                                                                                       |
| `qa docker-scaffold`                                | Записати docker-compose каркас для QA dashboard + gateway lane.                                                                                                         |
| `qa up`                                             | Зібрати QA-сайт, запустити Docker-backed стек, вивести URL (псевдонім: `pnpm qa:lab:up`; варіант `:fast` додає `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Запустити лише сервер AIMock provider.                                                                                                                                  |
| `qa mock-openai`                                    | Запустити лише scenario-aware сервер `mock-openai` provider.                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Керувати спільним пулом облікових даних Convex.                                                                                                                         |
| `qa matrix`                                         | Live transport lane проти одноразового Tuwunel homeserver. Див. [Matrix QA](/uk/concepts/qa-matrix).                                                                       |
| `qa telegram`                                       | Live transport lane проти реальної приватної групи Telegram.                                                                                                            |
| `qa discord`                                        | Live transport lane проти реального приватного каналу Discord guild.                                                                                                    |
| `qa mantis`                                         | Запланований runner для перевірки до і після для помилок live transport. Див. [Mantis](/uk/concepts/mantis).                                                              |

## Потік оператора

Поточний потік QA-оператора — це QA-сайт із двома панелями:

- Ліворуч: Gateway dashboard (Control UI) з агентом.
- Праворуч: QA Lab, що показує Slack-подібний транскрипт і план сценарію.

Запустіть його так:

```bash
pnpm qa:lab:up
```

Це збирає QA-сайт, запускає Docker-backed gateway lane і відкриває сторінку
QA Lab, де оператор або цикл автоматизації може дати агенту QA
місію, спостерігати реальну поведінку каналу та зафіксувати, що спрацювало, що не вдалося або
залишилося заблокованим.

Для швидшої ітерації UI QA Lab без перебудови Docker-образу щоразу
запустіть стек із bind-mounted бандлом QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` тримає Docker-сервіси на попередньо зібраному образі та bind-mounts
`extensions/qa-lab/web/dist` у контейнер `qa-lab`. `qa:lab:watch`
перезбирає цей бандл при зміні, а браузер автоматично перезавантажується, коли змінюється
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
model calls не повинні експортувати `StreamAbandoned` на успішних turns; raw diagnostic IDs і
атрибути `openclaw.content.*` мають лишатися поза trace. Він записує
`otel-smoke-summary.json` поруч із артефактами QA suite.

Observability QA лишається доступним лише з source-checkout. npm tarball навмисно не містить
QA Lab, тому package Docker release lanes не запускають команди `qa`. Використовуйте
`pnpm qa:otel:smoke` із зібраного source checkout під час зміни diagnostics
instrumentation.

Для transport-real Matrix smoke lane запустіть:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Повний довідник CLI, каталог профілів/сценаріїв, env vars і структура артефактів для цього lane містяться в [Matrix QA](/uk/concepts/qa-matrix). Коротко: він створює одноразовий Tuwunel homeserver у Docker, реєструє тимчасових driver/SUT/observer користувачів, запускає реальний Matrix Plugin усередині дочірнього QA gateway, обмеженого цим transport (без `qa-channel`), а потім записує Markdown-звіт, JSON-summary, observed-events artifact і combined output log у `.artifacts/qa-e2e/matrix-<timestamp>/`.

Для transport-real Telegram і Discord smoke lanes:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Обидва націлені на наявний реальний канал із двома ботами (driver + SUT). Обовʼязкові env vars, списки сценаріїв, вихідні артефакти та пул облікових даних Convex задокументовані нижче в [Довіднику QA для Telegram і Discord](#telegram-and-discord-qa-reference).

Перед використанням pooled live credentials запустіть:

```bash
pnpm openclaw qa credentials doctor
```

Doctor перевіряє env Convex broker, валідовує налаштування endpoint і перевіряє admin/list reachability, коли наявний maintainer secret. Для secrets він повідомляє лише статус set/missing.

## Покриття live transport

Live transport lanes спільно використовують один контракт, замість того щоб кожен вигадував власну форму списку сценаріїв. `qa-channel` — це широка синтетична suite для product-behavior і вона не є частиною матриці покриття live transport.

| Lane     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Це зберігає `qa-channel` як широку suite для product-behavior, тоді як Matrix,
Telegram і майбутні live transports спільно використовують один явний checklist
transport-contract.

Для одноразового Linux VM lane без залучення Docker у QA-шлях запустіть:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Це завантажує свіжий Multipass guest, встановлює залежності, збирає OpenClaw
усередині guest, запускає `qa suite`, а потім копіює звичайний QA-звіт і
summary назад у `.artifacts/qa-e2e/...` на host.
Він повторно використовує ту саму поведінку вибору сценаріїв, що й `qa suite` на host.
Host і Multipass suite runs за замовчуванням виконують кілька вибраних сценаріїв паралельно
з ізольованими gateway workers. `qa-channel` за замовчуванням має concurrency
4, обмежену кількістю вибраних сценаріїв. Використовуйте `--concurrency <count>`, щоб налаштувати
кількість workers, або `--concurrency 1` для serial execution.
Команда завершується з ненульовим кодом, коли будь-який сценарій зазнає невдачі. Використовуйте `--allow-failures`, коли
потрібні артефакти без failing exit code.
Live runs передають підтримувані QA auth inputs, практичні для
guest: env-based provider keys, шлях до QA live provider config і
`CODEX_HOME`, коли він наявний. Тримайте `--output-dir` під коренем репозиторію, щоб guest
міг записувати назад через змонтований workspace.

## Довідник QA для Telegram і Discord

Matrix має [окрему сторінку](/uk/concepts/qa-matrix) через кількість сценаріїв і Docker-backed homeserver provisioning. Telegram і Discord менші — кілька сценаріїв кожен, без profile system, проти наявних реальних каналів — тому їхній довідник міститься тут.

### Спільні прапорці CLI

Обидва lanes реєструються через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` і приймають ті самі прапорці:

| Прапор                               | Типове значення                                           | Опис                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Запустити лише цей сценарій. Можна повторювати.                                                                       |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Куди записуються звіти/підсумок/спостережені повідомлення та вихідний журнал. Відносні шляхи обчислюються відносно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Корінь репозиторію під час виклику з нейтрального cwd.                                                                |
| `--sut-account <id>`                  | `sut`                                                     | Тимчасовий ідентифікатор облікового запису в конфігурації QA gateway.                                                |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` або `live-frontier` (застарілий `live-openai` також працює).                                           |
| `--model <ref>` / `--alt-model <ref>` | типовий для провайдера                                    | Посилання на основну/альтернативну модель.                                                                            |
| `--fast`                              | вимкнено                                                  | Швидкий режим провайдера, де підтримується.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                     | Див. [пул облікових даних Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` у CI, інакше `maintainer`                            | Роль, що використовується, коли `--credential-source convex`.                                                        |

Обидві команди завершуються з ненульовим кодом виходу за будь-якого невдалого сценарію. `--allow-failures` записує артефакти без встановлення коду виходу, що позначає помилку.

### QA для Telegram

```bash
pnpm openclaw qa telegram
```

Націлюється на одну справжню приватну групу Telegram із двома окремими ботами (драйвер + SUT). SUT-бот має мати ім’я користувача Telegram; спостереження бот-до-бота працює найкраще, коли в обох ботів увімкнено **Bot-to-Bot Communication Mode** у `@BotFather`.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — числовий ідентифікатор чату (рядок).
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

Вихідні артефакти:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — включає RTT для кожної відповіді (надсилання драйвером → спостережена відповідь SUT), починаючи з канаркового сценарію.
- `telegram-qa-observed-messages.json` — тіла редагуються, якщо не встановлено `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA для Discord

```bash
pnpm openclaw qa discord
```

Націлюється на один справжній приватний канал гільдії Discord із двома ботами: ботом-драйвером, яким керує harness, і SUT-ботом, запущеним дочірнім OpenClaw gateway через вбудований Plugin Discord. Перевіряє обробку згадок каналу, що SUT-бот зареєстрував нативну команду `/help` у Discord, а також opt-in сценарії доказів Mantis.

Обов’язкові змінні середовища, коли `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — має збігатися з ідентифікатором користувача SUT-бота, який повертає Discord (інакше lane швидко завершується помилкою).

Необов’язково:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` зберігає тіла повідомлень в артефактах спостережених повідомлень.

Сценарії (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — opt-in сценарій Mantis. Виконується окремо, бо перемикає SUT у режим постійно ввімкнених, лише інструментальних відповідей гільдії з `messages.statusReactions.enabled=true`, а потім фіксує часову шкалу реакцій REST плюс візуальний артефакт HTML/PNG.

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
- `discord-qa-reaction-timelines.json` і `discord-status-reactions-tool-only-timeline.png`, коли виконується сценарій реакцій статусу.

### Пул облікових даних Convex

І Telegram, і Discord lanes можуть брати облікові дані з пулу спільного Convex замість читання наведених вище змінних середовища. Передайте `--credential-source convex` (або встановіть `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab отримує ексклюзивну оренду, надсилає Heartbeat протягом виконання та звільняє її під час завершення. Типи пулу: `"telegram"` і `"discord"`.

Форми payload, які брокер перевіряє на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` має бути числовим рядком ідентифікатора чату.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Операційні змінні середовища та контракт endpoint брокера Convex наведені в [Тестування → Спільні облікові дані Telegram через Convex](/uk/help/testing#shared-telegram-credentials-via-convex-v1) (назва розділу передує підтримці Discord; семантика брокера ідентична для обох типів).

## Seeds із репозиторію

Seed-активи розміщені в `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Вони навмисно зберігаються в git, щоб план QA був видимий і людям, і
агенту.

`qa-lab` має залишатися універсальним runner для Markdown. Кожен Markdown-файл сценарію є
джерелом істини для одного тестового запуску й має визначати:

- метадані сценарію
- необов’язкові метадані категорії, capability, lane і ризику
- посилання на документацію та код
- необов’язкові вимоги до Plugin
- необов’язковий patch конфігурації gateway
- виконуваний `qa-flow`

Багаторазово використовувана runtime-поверхня, що підтримує `qa-flow`, може залишатися універсальною
та наскрізною. Наприклад, Markdown-сценарії можуть поєднувати помічники транспортної сторони
з помічниками браузерної сторони, які керують вбудованим Control UI через
Gateway `browser.request` seam без додавання runner для спеціального випадку.

Файли сценаріїв слід групувати за capability продукту, а не за папкою дерева
джерел. Зберігайте ідентифікатори сценаріїв стабільними під час переміщення файлів; використовуйте `docsRefs` і `codeRefs`
для трасованості реалізації.

Базовий список має залишатися достатньо широким, щоб охоплювати:

- DM і чат каналу
- поведінку thread
- життєвий цикл дій повідомлення
- callback-и cron
- пригадування пам’яті
- перемикання моделей
- передавання subagent
- читання репозиторію та читання документації
- одне невелике завдання збірки, наприклад Lobster Invaders

## Mock lanes провайдера

`qa suite` має дві локальні mock lanes провайдера:

- `mock-openai` — scenario-aware mock OpenClaw. Він залишається типовим
  детермінованим mock lane для QA з репозиторію та parity gates.
- `aimock` запускає сервер провайдера на базі AIMock для експериментального протоколу,
  fixture, record/replay і chaos coverage. Він є додатковим і не
  замінює диспетчер сценаріїв `mock-openai`.

Реалізація provider-lane розміщена в `extensions/qa-lab/src/providers/`.
Кожен провайдер володіє своїми типовими значеннями, запуском локального сервера, конфігурацією моделей gateway,
потребами staging auth-profile і прапорами live/mock capability. Спільний код suite і
gateway має проходити через registry провайдерів замість розгалуження за
іменами провайдерів.

## Транспортні адаптери

`qa-lab` володіє універсальним транспортним seam для Markdown QA-сценаріїв. `qa-channel` — перший адаптер на цьому seam, але ціль дизайну ширша: майбутні справжні або синтетичні канали мають підключатися до того самого suite runner замість додавання transport-specific QA runner.

На рівні архітектури поділ такий:

- `qa-lab` володіє універсальним виконанням сценаріїв, concurrency worker-ів, записом артефактів і звітуванням.
- Транспортний адаптер володіє конфігурацією gateway, readiness, вхідним і вихідним спостереженням, транспортними діями та нормалізованим станом транспорту.
- Markdown-файли сценаріїв у `qa/scenarios/` визначають тестовий запуск; `qa-lab` надає багаторазово використовувану runtime-поверхню, яка їх виконує.

### Додавання каналу

Додавання каналу до системи Markdown QA потребує рівно двох речей:

1. Транспортного адаптера для каналу.
2. Пакета сценаріїв, який перевіряє контракт каналу.

Не додавайте новий top-level корінь команди QA, коли спільний хост `qa-lab` може володіти потоком.

`qa-lab` володіє спільною механікою хоста:

- коренем команди `openclaw qa`
- запуском і teardown suite
- concurrency worker-ів
- записом артефактів
- генерацією звітів
- виконанням сценаріїв
- compatibility aliases для старіших сценаріїв `qa-channel`

Runner plugins володіють транспортним контрактом:

- як `openclaw qa <runner>` монтується під спільним коренем `qa`
- як gateway конфігурується для цього транспорту
- як перевіряється readiness
- як інжектуються вхідні події
- як спостерігаються вихідні повідомлення
- як експонуються transcripts і нормалізований стан транспорту
- як виконуються transport-backed дії
- як обробляється transport-specific reset або cleanup

Мінімальна планка прийняття для нового каналу:

1. Зберігайте `qa-lab` власником спільного кореня `qa`.
2. Реалізуйте transport runner на спільному host seam `qa-lab`.
3. Тримайте transport-specific механіку всередині runner plugin або channel harness.
4. Монтуйте runner як `openclaw qa <runner>` замість реєстрації конкуруючої кореневої команди. Runner plugins мають оголошувати `qaRunners` у `openclaw.plugin.json` і експортувати відповідний масив `qaRunnerCliRegistrations` із `runtime-api.ts`. Зберігайте `runtime-api.ts` легким; lazy CLI та виконання runner мають залишатися за окремими entrypoints.
5. Напишіть або адаптуйте Markdown-сценарії в тематичних директоріях `qa/scenarios/`.
6. Використовуйте універсальні помічники сценаріїв для нових сценаріїв.
7. Зберігайте наявні compatibility aliases робочими, якщо репозиторій не виконує навмисну міграцію.

Правило ухвалення рішення суворе:

- Якщо поведінку можна виразити один раз у `qa-lab`, розмістіть її в `qa-lab`.
- Якщо поведінка залежить від одного транспорту каналу, тримайте її в цьому runner plugin або plugin harness.
- Якщо сценарію потрібна нова capability, яку може використовувати більше ніж один канал, додайте універсальний помічник замість channel-specific гілки в `suite.ts`.
- Якщо поведінка має сенс лише для одного транспорту, залиште сценарій transport-specific і явно вкажіть це в контракті сценарію.

### Назви помічників сценаріїв

Бажані універсальні помічники для нових сценаріїв:

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

Аліаси сумісності залишаються доступними для наявних сценаріїв — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — але під час створення нових сценаріїв слід використовувати загальні назви. Аліаси існують, щоб уникнути одноразової примусової міграції, а не як модель на майбутнє.

## Звітування

`qa-lab` експортує Markdown-звіт протоколу зі спостереженої часової шкали bus.
Звіт має відповідати на такі питання:

- Що спрацювало
- Що не спрацювало
- Що залишилося заблокованим
- Які подальші сценарії варто додати

Для інвентаризації доступних сценаріїв — корисної під час оцінювання обсягу подальшої роботи або підключення нового транспорту — запустіть `pnpm openclaw qa coverage` (додайте `--json` для машиночитаного виводу).

Для перевірок характеру й стилю запустіть той самий сценарій для кількох live refs моделей
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

Команда запускає локальні дочірні процеси QA gateway, а не Docker. Сценарії оцінювання характеру
мають задавати persona через `SOUL.md`, а потім виконувати звичайні ходи користувача,
як-от чат, допомога з workspace і невеликі файлові завдання. Кандидатській моделі
не слід повідомляти, що її оцінюють. Команда зберігає кожен повний
транскрипт, записує базову статистику запуску, а потім просить judge models у fast mode з
`xhigh` reasoning, де це підтримується, ранжувати запуски за природністю, vibe та гумором.
Використовуйте `--blind-judge-models`, коли порівнюєте провайдерів: judge prompt усе одно отримує
кожен транскрипт і статус запуску, але candidate refs замінюються нейтральними
мітками на кшталт `candidate-01`; після парсингу звіт зіставляє рейтинги з реальними refs.
Запуски кандидатів за замовчуванням використовують `high` thinking, з `medium` для GPT-5.5 і `xhigh`
для старіших OpenAI eval refs, які це підтримують. Перевизначте конкретного кандидата inline за допомогою
`--model provider/model,thinking=<level>`. `--thinking <level>` усе ще задає
глобальний fallback, а старіша форма `--model-thinking <provider/model=level>` зберігається
для сумісності.
OpenAI candidate refs за замовчуванням використовують fast mode, щоб priority processing застосовувався там, де
провайдер це підтримує. Додайте `,fast`, `,no-fast` або `,fast=false` inline, коли
окремому кандидату або судді потрібне перевизначення. Передавайте `--fast` лише тоді, коли хочете
примусово ввімкнути fast mode для кожної кандидатської моделі. Тривалості запусків кандидатів і суддів
записуються у звіт для аналізу benchmark, але judge prompts явно вказують
не ранжувати за швидкістю.
Запуски кандидатських і суддівських моделей обидва за замовчуванням використовують concurrency 16. Зменшіть
`--concurrency` або `--judge-concurrency`, коли ліміти провайдера або навантаження на локальний Gateway
роблять запуск надто шумним.
Коли candidate `--model` не передано, character eval за замовчуванням використовує
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` і
`google/gemini-3.1-pro-preview`, якщо `--model` не передано.
Коли `--judge-model` не передано, judges за замовчуванням використовують
`openai/gpt-5.5,thinking=xhigh,fast` і
`anthropic/claude-opus-4-6,thinking=high`.

## Пов’язані документи

- [Matrix QA](/uk/concepts/qa-matrix)
- [QA Channel](/uk/channels/qa-channel)
- [Тестування](/uk/help/testing)
- [Dashboard](/uk/web/dashboard)
