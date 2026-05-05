---
read_when:
    - Створення або запуск живої візуальної перевірки якості для помилок OpenClaw
    - Додавання перевірок до й після для запиту на злиття
    - Додавання сценаріїв транспорту в реальному часі для Discord, Slack, WhatsApp або інших сервісів
    - Налагодження запусків QA, для яких потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це візуальна система наскрізної верифікації для відтворення помилок OpenClaw на живих транспортах, збирання доказів до й після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-05T06:58:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00f2be92845fb13e410af7188f348010140914514d739b930f97b43abaa66a0c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні реальне
середовище виконання, реальний транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які мейнтейнер може переглянути з PR або
з локальної команди.

Mantis починається з Discord, тому що Discord дає нам цінний перший напрям:
реальну автентифікацію бота, реальні канали гільдії, реакції, треди, нативні команди та
браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку
  бачать користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Використовувати детермінований оракул, коли це можливо, наприклад читання реакції
  через Discord REST або перевірку транскрипту каналу.
- Збирати знімки екрана, коли помилка має видиму UI-поверхню.
- Запускати локально з CLI, керованого агентом, і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-відновлення, коли вхід, браузерна автоматизація або
  автентифікація провайдера застрягає.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблокований,
  потребує ручної допомоги через VNC або завершується.

## Поза цілями

- Mantis не є заміною модульних тестів. Запуск Mantis зазвичай має перетворитися
  на менший регресійний тест після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI-шлюзом. Він повільніший, використовує live-облікові дані та
  призначений для помилок, де live-середовище має значення.
- Mantis не повинен потребувати людини для нормальної роботи. Ручний VNC — це шлях
  відновлення, а не штатний шлях.
- Mantis не зберігає необроблені секрети в артефактах, логах, знімках екрана, Markdown
  звітах або коментарях PR.

## Зони відповідальності

Mantis живе в стеку QA OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними адаптерами, схемою доказів і
  локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live-транспортного harness, допоміжними засобами браузерного захоплення та
  записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow та зберіганням артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: розбором команд мейнтейнерів,
  dispatch workflow і публікацією фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні агентне налаштування,
  налагодження або звітування про застряглий стан.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у
Crabbox, а клей workflow мейнтейнерів у ClawSweeper.

## Формат команд

Перша локальна команда перевіряє Discord-бота, гільдію, канал, надсилання повідомлення,
надсилання реакції та шлях артефактів:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний runner до і після приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює від'єднані baseline і candidate worktree у вихідному
каталозі, встановлює залежності, збирає кожен ref, запускає сценарій із
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`,
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка
означає, що статус baseline — `fail`, а статус candidate — `pass`.

Перший примітив VM/browser — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер усередині
VNC-сеансу, захоплює робочий стіл, витягує артефакти назад у локальний вихідний
каталог і записує команду повторного підключення у звіт. Команда за замовчуванням
використовує провайдера Hetzner, тому що це перший провайдер із робочим desktop/VNC
покриттям у напрямі Mantis. Перевизначте його через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` під час запуску проти іншого флоту Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML-артефакт у видимому браузері. Mantis використовує це для захоплення згенерованої timeline реакцій статусу Discord через реальний desktop Crabbox.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну оренду відкритою для VNC-перегляду. Невдалі запуски за замовчуванням залишають оренду, якщо її було створено, щоб оператор міг повторно підключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та час життя оренди.

Перший повний desktop-транспортний примітив — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Він орендує або повторно використовує desktop-машину Crabbox, синхронізує поточний checkout у
VM, запускає `pnpm openclaw qa slack` всередині цієї VM, відкриває Slack Web у VNC
браузері, захоплює видимий робочий стіл і копіює як артефакти Slack QA, так і
VNC-знімок екрана назад у локальний вихідний каталог. Це перша форма Mantis,
де SUT OpenClaw Gateway і браузер живуть усередині однієї
Linux desktop VM.

З `--gateway-setup` команда готує сталий одноразовий дім OpenClaw
у `$HOME/.openclaw-mantis/slack-openclaw`, патчить конфігурацію Slack Socket Mode
для вибраного каналу, запускає `openclaw gateway run` на порту
`38973` і залишає Chrome запущеним у VNC-сеансі. Це режим "залиш мені
Linux desktop зі Slack і запущеним claw"; напрям bot-to-bot Slack QA
залишається типовим, коли `--gateway-setup` пропущено.

Обов'язкові вхідні дані для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для напряму віддаленої моделі. Якщо локально встановлено лише
  `OPENAI_API_KEY`, Mantis відображає його в `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб пересилання env `OPENCLAW_*` у Crabbox могло передати його
  у VM.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже увійшов у Slack Web через VNC.
- `--gateway-setup` запускає сталий Slack Gateway OpenClaw у VM замість запуску лише напряму bot-to-bot QA.
- `--slack-url <url>` відкриває конкретний URL Slack Web. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний token SUT-бота.
- `--slack-channel-id <id>` керує allowlist каналу Slack, яку використовує налаштування gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує сталим профілем Chrome усередині VM. За замовчуванням це `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний вхід у Slack Web переживає повторні запуски на тій самій оренді.
- `--credential-source convex --credential-role ci` використовує спільний пул облікових даних замість прямих Slack env tokens.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються в live-напрям Slack.

GitHub smoke workflow — `Mantis Discord Smoke`. GitHub workflow до і після
для першого реального сценарію — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворити поведінку лише queued.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checkout ref harness workflow, збирає окремі baseline і candidate
worktree, запускає `discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
артефакти Actions. Він також рендерить HTML timeline кожного напряму в desktop-браузері
Crabbox і публікує ці VNC-знімки екрана поряд із детермінованими
PNG timeline у коментарі PR. Той самий коментар PR вбудовує легкі
GIF-перегляди з обрізанням руху, згенеровані `crabbox media preview`, посилається на
відповідні MP4-кліпи з обрізанням руху та зберігає повні desktop MP4-файли для глибокого
перегляду. Знімки екрана залишаються inline для швидкого перегляду. Workflow збирає
Crabbox CLI з
`openclaw/crabbox` main, щоб він міг використовувати поточні прапорці desktop/browser lease
до виходу наступного бінарного релізу Crabbox.

Ви також можете запустити status-reactions run напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише на коментарях pull request
від користувачів із доступом write, maintain або admin, і розпізнає лише
запити реакцій статусу Discord. За замовчуванням він використовує відомий поганий baseline ref
і поточний SHA голови PR як candidate. Мейнтейнери можуть перевизначити будь-який
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
результатів review ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати desktop/browser профіль, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати live-транспорт, провайдера, модель і browser profile.
8. Запустити сценарій і зібрати baseline evidence.
9. Зупинити gateway і зберегти логи.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і зібрати candidate evidence.
12. Порівняти результати oracle і візуальні докази.
13. Записати Markdown, JSON, логи, знімки екрана та необов'язкові trace artifacts.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статусний PR або Discord-повідомлення.

Сценарій повинен мати змогу завершуватися невдачею двома різними способами:

- **Помилку відтворено**: baseline завершився невдачею очікуваним способом.
- **Збій harness**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер завершилися невдачею до того, як bug oracle став змістовним.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## Discord MVP

Перший сценарій має бути спрямований на реакції статусу Discord у каналах гільдії, де
режим доставки відповіді джерела — `message_tool_only`.

Чому це хороший початковий сценарій Mantis:

- Він видимий у Discord як реакції на тригерне повідомлення.
- Він має сильний REST-оракул через стан реакцій повідомлення Discord.
- Він перевіряє реальний OpenClaw Gateway, автентифікацію Discord-бота, dispatch повідомлень,
  режим доставки відповіді джерела, стан реакцій статусу та життєвий цикл model turn.
- Він достатньо вузький, щоб перша реалізація залишалася чесною.

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

Baseline evidence має показувати queued acknowledgement reaction, але не
lifecycle transition у tool-only mode. Candidate evidence має показувати, що lifecycle
status reactions запускаються, коли `messages.statusReactions.enabled` явно
дорівнює true.

Перший виконуваний зріз — opt-in Discord live QA scenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Це налаштовує SUT із постійно ввімкненою обробкою guild, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` і явними статусними реакціями. Оракул
опитує реальне повідомлення-тригер у Discord і очікує спостережувану послідовність
`👀 -> 🤔 -> 👍`. Артефакти містять `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні складові QA

Mantis має спиратися на наявний приватний стек QA, а не починати з
нуля:

- `pnpm openclaw qa discord` вже запускає живу Discord-смугу з driver-ботом і
  SUT-ботом.
- Наявний runner живого транспорту вже записує звіти й артефакти спостережених повідомлень
  у `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних живих
  облікових даних транспорту.
- Сервіс керування браузером уже підтримує знімки екрана, snapshots,
  керовані headless-профілі та віддалені CDP-профілі.
- QA Lab уже має UI debugger і bus для тестування у формі транспорту.

Перша реалізація Mantis може бути тонким runner до/після поверх цих
складових плюс один шар візуальних доказів.

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

`mantis-summary.json` має бути машиночитним джерелом істини. Звіт
Markdown призначений для коментарів PR і людського перегляду.

Summary має містити:

- перевірені refs і SHAs
- transport і scenario id
- постачальника машини та machine id або lease id
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи відтворилася помилка на baseline
- чи candidate її виправив
- шляхи до артефактів
- санітизовані проблеми setup або cleanup

Знімки екрана є доказами, а не секретами. Вони все одно потребують дисципліни редагування:
можуть з’являтися назви приватних каналів, імена користувачів або вміст повідомлень. Для публічних PR
надавайте перевагу посиланням на артефакти GitHub Actions замість inline-зображень, доки історія редагування
не стане надійнішою.

## Браузер і VNC

Браузерна смуга має два режими:

- **Headless-автоматизація**: типово для CI. Chrome запускається з увімкненим CDP, а
  Playwright або керування браузером OpenClaw захоплює знімки екрана.
- **VNC-порятунок**: увімкнено на тій самій VM, коли login, MFA, антиавтоматизація Discord
  або візуальне налагодження потребують участі людини.

Профіль браузера-спостерігача Discord має бути достатньо persistent, щоб уникати
входу в систему для кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить до пулу машин Mantis, а не до ноутбука розробника.

Коли Mantis застрягає, він публікує статусне повідомлення в Discord із:

- run id
- scenario id
- постачальником машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом blocker

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал і пізніше перейти до окремого каналу Mantis.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, відстеження оренд, hydration, журнали, результати та
cleanup. Якщо ємність AWS надто повільна або недоступна, додайте провайдера Hetzner
за тим самим інтерфейсом машини.

Мінімальні вимоги до VM:

- Linux зі встановленим Chrome або Chromium, придатним для desktop
- CDP-доступ для браузерної автоматизації
- VNC або noVNC для порятунку
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU і пам’яті для одного OpenClaw Gateway, одного браузера й одного model run
- вихідний доступ до Discord, GitHub, model providers і брокера облікових даних

VM не має зберігати довгоживучі raw secrets поза очікуваними сховищами облікових даних або
профілів браузера.

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

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом для живих
облікових даних транспорту. Секрети GitHub bootstrapping брокера та fallback-смуг.
Workflow статусних реакцій Discord зіставляє секрети Mantis Crabbox назад із
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
яких очікує Crabbox CLI. Прості назви секретів GitHub `CRABBOX_*` залишаються
прийнятими як fallback для сумісності.

Runner Mantis ніколи не повинен друкувати:

- токени ботів Discord
- API-ключі provider
- cookies браузера
- вміст auth profile
- паролі VNC
- raw payloads облікових даних

Публічні завантаження артефактів також мають редагувати цільові metadata Discord, як-от bot,
guild, channel і message ids. Workflow GitHub smoke вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` з цієї причини.

Якщо токен випадково вставлено в issue, PR, chat або log, ротувати його
після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Workflows Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт Actions.
Коли workflow запускається для звіту про помилку або PR із виправленням, він також має
публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і upsert
коментар до цієї помилки або PR із виправленням з inline-знімками до/після. Не публікуйте
основний доказ лише в generic PR автоматизації QA. Raw logs, спостережені
повідомлення та інші об’ємні докази залишаються в артефакті Actions.

Production workflows мають публікувати ці коментарі через Mantis GitHub App, а не
через `github-actions[bot]`. Зберігайте app id і private key як секрети GitHub Actions
`MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow використовує прихований marker як upsert key, оновлює цей
коментар, коли token може його редагувати, і створює новий коментар від імені Mantis, коли
старіший marker, що належить bot, неможливо редагувати.

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

Коли запуск не вдається через збій harness, у коментарі має бути сказано саме це,
а не створюватися враження, що candidate failed.

## Нотатки приватного розгортання

Приватне розгортання вже може мати застосунок Mantis Discord. Повторно використовуйте цей
застосунок замість створення іншого app, якщо він має правильні bot
permissions і його можна безпечно ротувати.

Задайте початковий канал операторських сповіщень через секрети або конфігурацію розгортання.
Він може спершу вказувати на наявний канал maintainers або operations,
а потім перейти до окремого каналу Mantis, коли такий існуватиме.

Не розміщуйте guild ids, channel ids, bot tokens, browser cookies або VNC passwords
у цьому документі. Зберігайте їх у GitHub secrets, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і title
- transport
- потрібні облікові дані
- baseline ref policy
- candidate ref policy
- config patch OpenClaw
- кроки setup
- stimulus
- очікуваний baseline oracle
- очікуваний candidate oracle
- visual capture targets
- timeout budget
- кроки cleanup

Scenarios мають віддавати перевагу невеликим typed oracles:

- стан реакцій Discord для помилок реакцій
- посилання на повідомлення Discord для threading bugs
- thread ts Slack і стан reaction API для помилок Slack
- email message ids і headers для email bugs
- знімки екрана браузера, коли UI є єдиним надійним observable

Vision checks мають бути додатковими. Якщо API платформи може довести помилку, використовуйте
API як pass/fail oracle і залишайте знімки екрана для людської впевненості.

## Розширення provider

Після Discord той самий runner може додати:

- Slack: reactions, threads, app mentions, modals, file uploads.
- Email: Gmail auth і message threading з використанням `gog`, де connectors недостатньо.
- WhatsApp: QR login, re-identification, message delivery, media, reactions.
- Telegram: group mention gating, commands, reactions where available.
- Matrix: encrypted rooms, thread або reply relations, restart resume.

Кожен transport має мати один дешевий smoke scenario і один або більше bug-class
scenarios. Дорогі visual scenarios мають залишатися opt-in.

## Відкриті питання

- Який Discord bot має бути driver, а який SUT, коли
  наявний Mantis bot використовується повторно?
- Чи observer browser login має використовувати людський обліковий запис Discord, test account
  або лише bot-readable REST evidence для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PRs?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди maintainer?
- Чи потрібно редагувати або обрізати знімки екрана перед upload для public PRs?
