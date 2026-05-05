---
read_when:
    - Створення або запуск візуальної QA-перевірки в реальному середовищі для помилок OpenClaw
    - Додавання перевірки перед і після для запиту на злиття
    - Додавання сценаріїв із реальним транспортом для Discord, Slack, WhatsApp або інших сервісів
    - Налагодження прогонів QA, яким потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це візуальна система наскрізної перевірки для відтворення помилок OpenClaw на реальних транспортних каналах, збирання доказів до й після змін і прикріплення артефактів до пул-реквестів.
title: Богомол
x-i18n:
    generated_at: "2026-05-05T05:35:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні справжнє
середовище виконання, справжній транспорт і видимі докази. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які мейнтейнер може переглянути з PR або
з локальної команди.

Mantis починається з Discord, бо Discord дає нам першу смугу високої цінності:
справжню автентифікацію бота, справжні канали гільдії, реакції, треди, нативні команди та
браузерний UI, де люди можуть візуально підтвердити те, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку
  бачать користувачі.
- Зафіксувати артефакт **before** на базовому ref перед застосуванням виправлення.
- Зафіксувати артефакт **after** на кандидатному ref після застосування виправлення.
- За можливості використовувати детермінований оракул, наприклад читання реакції через Discord REST
  або перевірку транскрипту каналу.
- Захоплювати знімки екрана, коли помилка має видиму поверхню UI.
- Запускатися локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-рятування, коли вхід, автоматизація браузера або
  автентифікація провайдера застрягають.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблокований,
  потребує ручної допомоги VNC або завершується.

## Нецілі

- Mantis не є заміною модульних тестів. Запуск Mantis зазвичай має ставати
  меншим регресійним тестом після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI-гейтом. Він повільніший, використовує живі облікові дані та
  призначений для помилок, де має значення живе середовище.
- Mantis не має вимагати людини для нормальної роботи. Ручний VNC — це шлях
  відновлення, а не штатний шлях.
- Mantis не зберігає необроблені секрети в артефактах, логах, знімках екрана, Markdown
  звітах або коментарях PR.

## Власність

Mantis живе у стеку QA OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними адаптерами, схемою доказів і
  локальним CLI у `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live транспортного стенда, помічниками захоплення браузера та
  записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow і зберіганням артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: розбором команд мейнтейнерів,
  запуском workflow і публікацією фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні агентне налаштування,
  налагодження або звітування про застряглий стан.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у
Crabbox, а клей робочих процесів мейнтейнерів у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє бота Discord, гільдію, канал, надсилання повідомлення,
надсилання реакції та шлях артефактів:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний runner before і after приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює відокремлені worktree baseline і candidate у вихідному
каталозі, встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка
означає, що статус baseline — `fail`, а статус candidate — `pass`.

Перший примітив VM/браузера — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер усередині
VNC-сесії, захоплює desktop, витягує артефакти назад у локальний вихідний
каталог і записує команду повторного підключення у звіт. Команда за замовчуванням
використовує провайдера Hetzner, бо це перший провайдер з робочим покриттям desktop/VNC
у смузі Mantis. Перевизначайте його через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, коли запускаєтеся проти іншого флоту Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` відтворює локальний HTML-артефакт репозиторію у видимому браузері. Mantis використовує це, щоб захопити згенеровану хронологію status-reaction Discord через справжній desktop Crabbox.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` тримає новостворену успішну оренду відкритою для VNC-інспекції. Невдалі запуски за замовчуванням зберігають оренду, якщо її було створено, щоб оператор міг повторно підключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та час життя оренди.

Перший повний desktop-примітив транспорту — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Він орендує або повторно використовує desktop-машину Crabbox, синхронізує поточний checkout у
VM, запускає `pnpm openclaw qa slack` усередині цієї VM, відкриває Slack Web у VNC
браузері, захоплює видимий desktop і копіює як артефакти Slack QA, так і
VNC-знімок екрана назад у локальний вихідний каталог. Це перша форма Mantis,
де SUT OpenClaw gateway і браузер обидва живуть в одній
Linux desktop VM.

З `--gateway-setup` команда готує постійний одноразовий home OpenClaw
у `$HOME/.openclaw-mantis/slack-openclaw`, патчить конфігурацію Slack Socket Mode
для вибраного каналу, запускає `openclaw gateway run` на порту
`38973` і залишає Chrome запущеним у VNC-сесії. Це режим "залиш мені
Linux desktop зі Slack і запущеним claw"; bot-to-bot смуга Slack QA
залишається стандартною, коли `--gateway-setup` пропущено.

Обов'язкові вхідні дані для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленої модельної смуги. Якщо локально задано лише
  `OPENAI_API_KEY`, Mantis відображає його на `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб forwarding env `OPENCLAW_*` у Crabbox міг перенести його
  у VM.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже ввійшов у Slack Web через VNC.
- `--gateway-setup` запускає постійний Slack gateway OpenClaw у VM замість лише запуску bot-to-bot смуги QA.
- `--slack-url <url>` відкриває конкретний URL Slack Web. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний token SUT bot.
- `--slack-channel-id <id>` керує allowlist каналу Slack, яку використовує gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome усередині VM. За замовчуванням це `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний вхід у Slack Web переживає повторні запуски на тій самій оренді.
- `--credential-source convex --credential-role ci` використовує спільний пул облікових даних замість прямих env token Slack.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються у live смугу Slack.

GitHub smoke workflow — це `Mantis Discord Smoke`. GitHub workflow before і after
для першого справжнього сценарію — це `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який очікувано відтворює поведінку лише queued.
- `candidate_ref`: ref, який очікувано показує `queued -> thinking -> done`.

Він checkout-ить ref workflow-стенда, збирає окремі worktree baseline і candidate,
запускає `discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
артефакти Actions. Він також відтворює timeline HTML кожної смуги у desktop-браузері
Crabbox і публікує ці VNC-знімки екрана поруч із детермінованими
timeline PNG у коментарі PR. Той самий коментар PR посилається на desktop MP4
записи, захоплені під час відтворення VNC-браузера, тоді як знімки екрана лишаються
inline для швидкого перегляду. Workflow збирає Crabbox CLI з
`openclaw/crabbox` main, щоб він міг використовувати поточні прапорці оренди desktop/browser
до виходу наступного бінарного релізу Crabbox.

Ви також можете запустити status-reactions run напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише для коментарів pull request
від користувачів із доступом write, maintain або admin, і розпізнає лише
запити status-reaction Discord. За замовчуванням він використовує відомий поганий baseline ref
і поточний PR head SHA як candidate. Мейнтейнери можуть перевизначити будь-який
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis на основі labels, змінених файлів і
знахідок рев'ю ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати профіль desktop/browser, коли сценарію потрібні докази UI.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати live транспорт, провайдера, модель і профіль браузера.
8. Запустити сценарій і захопити докази baseline.
9. Зупинити gateway і зберегти логи.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і захопити докази candidate.
12. Порівняти результати оракула та візуальні докази.
13. Записати Markdown, JSON, логи, знімки екрана та додаткові артефакти трасування.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статусний коментар PR або повідомлення Discord.

Сценарій має вміти падати двома різними способами:

- **Помилку відтворено**: baseline впав очікуваним способом.
- **Збій стенда**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер зазнали збою до того, як оракул помилки став значущим.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## Discord MVP

Перший сценарій має націлюватися на status reactions Discord у каналах гільдії, де
режим доставки вихідної відповіді — `message_tool_only`.

Чому це хороший seed для Mantis:

- Це видно в Discord як реакції на тригерне повідомлення.
- Він має сильний REST-оракул через стан реакцій повідомлення Discord.
- Він проходить через справжній OpenClaw Gateway, автентифікацію бота Discord, dispatch повідомлень,
  режим доставки вихідної відповіді, стан status reaction і життєвий цикл model turn.
- Він достатньо вузький, щоб перша реалізація була чесною.

Очікувана форма сценарію:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

Докази baseline мають показувати реакцію підтвердження queued, але без
lifecycle transition у режимі tool-only. Докази candidate мають показувати, що lifecycle
status reactions працюють, коли `messages.statusReactions.enabled` явно
дорівнює true.

Перший виконуваний зріз — це opt-in Discord live QA сценарій:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Вона налаштовує SUT з постійно ввімкненою обробкою гільдій, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` і явними реакціями статусу. Оракул
опитує реальне повідомлення-тригер у Discord і очікує спостережувану послідовність
`👀 -> 🤔 -> 👍`. Артефакти містять `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні компоненти QA

Mantis має будуватися на наявному приватному стеку QA, а не починати з
нуля:

- `pnpm openclaw qa discord` вже запускає живу лінію Discord з ботами-драйвером і
  SUT.
- Живий транспортний runner уже записує звіти й артефакти спостережуваних
  повідомлень у `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних живих
  транспортних облікових даних.
- Сервіс керування браузером уже підтримує знімки екрана, snapshots,
  headless керовані профілі й віддалені CDP-профілі.
- QA Lab уже має UI налагоджувача й шину для тестування у формі транспорту.

Перша реалізація Mantis може бути тонким runner до/після поверх цих
компонентів, плюс один шар візуальних доказів.

## Модель доказів

Кожен запуск записує стабільний каталог артефактів:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` має бути машиночитним джерелом істини. Markdown-звіт
призначений для коментарів до PR і перегляду людьми.

Зведення має містити:

- перевірені refs і SHA
- транспорт та id сценарію
- постачальника машини й id машини або id оренди
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи відтворилася помилка на baseline
- чи candidate виправив її
- шляхи артефактів
- очищені проблеми налаштування або очищення

Знімки екрана є доказами, а не секретами. Вони все одно потребують дисципліни
редагування: можуть з'являтися назви приватних каналів, імена користувачів або
вміст повідомлень. Для публічних PR віддавайте перевагу посиланням на артефакти
GitHub Actions замість вбудованих зображень, доки історія редагування не стане
надійнішою.

## Браузер і VNC

Браузерна лінія має два режими:

- **Headless автоматизація**: типовий режим для CI. Chrome запускається з увімкненим CDP, а
  Playwright або керування браузером OpenClaw захоплює знімки екрана.
- **VNC-рятування**: вмикається на тій самій VM, коли вхід, MFA, антиавтоматизація Discord
  або візуальне налагодження потребує людини.

Профіль браузера-спостерігача Discord має бути достатньо постійним, щоб уникати
входу під час кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення в Discord з:

- id запуску
- id сценарію
- постачальником машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал, а пізніше перейти до виділеного каналу Mantis.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, відстеження оренд, hydration, журнали, результати й
очищення. Якщо потужності AWS надто повільні або недоступні, додайте постачальника
Hetzner за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux із встановленим Chrome або Chromium, придатним для desktop
- доступ CDP для автоматизації браузера
- VNC або noVNC для рятування
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU та пам'яті для одного OpenClaw Gateway, одного браузера й одного модельного запуску
- вихідний доступ до Discord, GitHub, постачальників моделей і брокера облікових даних

VM не має зберігати довгоживучі сирі секрети поза очікуваними сховищами облікових
даних або профілів браузера.

## Секрети

Секрети зберігаються в секретах організації або репозиторію GitHub для віддалених запусків і в
локальному файлі секретів під контролем оператора для локальних запусків.

Рекомендовані назви секретів:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для публічних завантажень артефактів GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

У довгостроковій перспективі пул облікових даних Convex має лишатися звичайним джерелом для живих
транспортних облікових даних. Секрети GitHub bootstrap брокер і резервні лінії.
Workflow реакцій статусу Discord зіставляє секрети Mantis Crabbox назад із
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
яких очікує Crabbox CLI. Прості назви секретів GitHub `CRABBOX_*` лишаються
прийнятими як резервна сумісність.

Runner Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі постачальників
- cookies браузера
- вміст профілів автентифікації
- паролі VNC
- сирі payload облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані Discord, як-от id бота,
гільдії, каналу й повідомлення. Workflow GitHub smoke вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, ротуй його
після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Workflow Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт
Actions. Коли workflow запускається для звіту про помилку або PR з виправленням, він також має
публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і upsert
коментар до цієї помилки або PR з виправленням із вбудованими знімками до/після. Не публікуйте
основний доказ лише в generic PR автоматизації QA. Сирі журнали, спостережувані
повідомлення та інші об'ємні докази залишаються в артефакті Actions.

Виробничі workflow мають публікувати ці коментарі через GitHub App Mantis, а не
через `github-actions[bot]`. Зберігайте app id і приватний ключ як секрети GitHub Actions
`MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow використовує
прихований marker як ключ upsert, оновлює цей коментар, коли токен може його редагувати,
і створює новий коментар від імені Mantis, коли старіший marker, яким володіє бот,
не можна редагувати.

Коментар PR має бути коротким і візуальним:

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Коли запуск завершується невдало через збій harness, коментар має казати саме це,
а не створювати враження, що candidate не пройшов.

## Нотатки приватного розгортання

Приватне розгортання вже може мати застосунок Mantis Discord. Повторно використайте цей
застосунок замість створення іншого app, коли він має правильні дозволи бота
і його можна безпечно ротувати.

Задайте початковий операторський канал сповіщень через секрети або конфігурацію
розгортання. Спершу він може вказувати на наявний канал maintainers або operations,
а потім перейти до виділеного каналу Mantis, щойно такий з'явиться.

Не додавайте guild ids, channel ids, bot tokens, browser cookies або VNC passwords
у цей документ. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і заголовок
- транспорт
- необхідні облікові дані
- політику baseline ref
- політику candidate ref
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний оракул baseline
- очікуваний оракул candidate
- цілі візуального захоплення
- бюджет timeout
- кроки очищення

Сценарії мають віддавати перевагу малим typed оракулам:

- стан реакції Discord для помилок реакцій
- посилання на повідомлення Discord для помилок тредів
- thread ts Slack і стан API реакцій для помилок Slack
- id повідомлень email і заголовки для помилок email
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Vision-перевірки мають бути додатковими. Якщо API платформи може довести помилку, використовуйте
API як оракул pass/fail і залишайте знімки екрана для впевненості людини.

## Розширення постачальників

Після Discord той самий runner може додати:

- Slack: реакції, треди, згадки app, модальні вікна, завантаження файлів.
- Email: автентифікацію Gmail і threading повідомлень із використанням `gog`, де connectors недостатньо.
- WhatsApp: QR-вхід, повторну ідентифікацію, доставку повідомлень, media, реакції.
- Telegram: gating згадок у групі, команди, реакції, де доступні.
- Matrix: зашифровані кімнати, зв'язки тредів або відповідей, resume після restart.

Кожен транспорт має мати один дешевий smoke-сценарій і один або більше сценаріїв класу помилок.
Дорогі візуальні сценарії мають лишатися opt-in.

## Відкриті питання

- Який бот Discord має бути драйвером, а який SUT, коли наявний бот Mantis
  використовується повторно?
- Чи має вхід браузера-спостерігача використовувати людський акаунт Discord, тестовий акаунт
  або лише REST-докази, доступні ботам, для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди maintainer?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
