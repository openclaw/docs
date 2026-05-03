---
read_when:
    - Створення або запуск візуального контролю якості в реальному часі для помилок OpenClaw
    - Додавання перевірки «до» та «після» для запиту на злиття
    - Додавання сценаріїв Discord, Slack, WhatsApp або інших живих транспортів
    - Налагодження QA-запусків, які потребують знімків екрана, автоматизації браузера або доступу через VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на живих транспортах, фіксації доказів до та після і прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-03T20:32:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cbacc20df4439d579556a1a807682e08d1c3d56294ec42b324c298599ebe4bb
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для багів, яким потрібні справжнє
середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій для відомого
поганого ref, збирає докази, запускає той самий сценарій для candidate ref і
публікує порівняння як артефакти, які мейнтейнер може перевірити з PR або
з локальної команди.

Mantis починає з Discord, тому що Discord дає нам цінну першу доріжку:
справжню автентифікацію бота, справжні канали guild, реакції, threads, нативні команди та
браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити баг з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **before** на baseline ref перед застосуванням виправлення.
- Зібрати артефакт **after** на candidate ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад читання реакції через Discord REST
  або перевірку транскрипту каналу.
- Збирати знімки екрана, коли баг має видиму поверхню UI.
- Запускати локально з CLI, керованого агентом, і віддалено з GitHub.
- Зберігати достатньо стану машини для порятунку через VNC, коли login, автоматизація браузера або
  auth provider застрягає.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблокований,
  потребує ручної допомоги VNC або завершується.

## Нецілі

- Mantis не є заміною unit tests. Запуск Mantis зазвичай має ставати
  меншим regression test після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI gate. Він повільніший, використовує live credentials і
  призначений для багів, де live-середовище має значення.
- Mantis не має вимагати людину для нормальної роботи. Ручний VNC — це шлях
  порятунку, а не happy path.
- Mantis не зберігає raw secrets в артефактах, logs, screenshots, Markdown
  reports або PR comments.

## Власність

Mantis живе в QA stack OpenClaw.

- OpenClaw володіє scenario runtime, transport adapters, evidence schema та
  локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live transport harness, browser capture helpers і
  artifact writers.
- Crabbox володіє прогрітими Linux machines, коли потрібна remote VM.
- GitHub Actions володіє remote workflow entrypoint і artifact retention.
- ClawSweeper володіє маршрутизацією GitHub comments: parsing maintainer commands,
  dispatching the workflow і posting the final PR comment.
- Агенти OpenClaw керують Mantis через Codex, коли scenario потребує agentic setup,
  debugging або stuck-state reporting.

Ця межа тримає знання про transport в OpenClaw, планування машин у
Crabbox, а workflow glue для мейнтейнерів у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє Discord bot, guild, channel, message send,
reaction send і artifact path:

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

Runner створює відокремлені baseline і candidate worktrees під output
directory, installs dependencies, builds each ref, runs the scenario with
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`,
і `mantis-report.md`. Для першого Discord scenario успішна verification
означає, що baseline status — `fail`, а candidate status — `pass`.

GitHub smoke workflow — `Mantis Discord Smoke`. Workflow before і after GitHub
для першого справжнього scenario — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворити queued-only behavior.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checks out workflow harness ref, builds separate baseline and candidate
worktrees, runs `discord-status-reactions-tool-only` against each worktree, and
uploads `baseline/`, `candidate/`, `comparison.json`, and `mantis-report.md` as
Actions artifacts.

Також можна запустити status-reactions run напряму з PR comment:

```text
@Mantis discord status reactions
```

Comment trigger навмисно вузький. Він запускається лише для pull request
comments від користувачів із write, maintain або admin access і розпізнає лише
Discord status-reaction requests. За замовчуванням він використовує відомий поганий baseline ref
і поточний PR head SHA як candidate. Maintainers можуть override будь-який
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на scenario. Друга згодом може зіставляти PR
або issue з рекомендованими Mantis scenarios на основі labels, changed files і
ClawSweeper review findings.

## Життєвий цикл запуску

1. Отримати credentials.
2. Виділити або повторно використати VM.
3. Підготувати чистий checkout для baseline ref.
4. Install dependencies і build лише те, що потрібно scenario.
5. Запустити child OpenClaw Gateway з isolated state directory.
6. Налаштувати live transport, provider, model і browser profile.
7. Запустити scenario і зібрати baseline evidence.
8. Зупинити gateway і зберегти logs.
9. Підготувати candidate ref у тій самій VM.
10. Запустити той самий scenario і зібрати candidate evidence.
11. Порівняти oracle results і visual evidence.
12. Записати Markdown, JSON, logs, screenshots і optional trace artifacts.
13. Upload GitHub Actions artifacts.
14. Опублікувати стислий PR або Discord status message.

Scenario має вміти завершуватися невдало двома різними способами:

- **Баг відтворено**: baseline failed in the expected way.
- **Збій harness**: environment setup, credentials, Discord API, browser або
  provider failed before the bug oracle was meaningful.

Final report має розділяти ці випадки, щоб maintainers не плутали flaky
environment із product behavior.

## Discord MVP

Перший scenario має цілитися в Discord status reactions у guild channels, де
source reply delivery mode — `message_tool_only`.

Чому це добрий початковий Mantis seed:

- Це видно в Discord як reactions на triggering message.
- Він має strong REST oracle через Discord message reaction state.
- Він проходить через справжній OpenClaw Gateway, Discord bot auth, message dispatch,
  source reply delivery mode, status reaction state і model turn lifecycle.
- Він достатньо вузький, щоб перша реалізація залишалася чесною.

Очікувана форма scenario:

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

Baseline evidence має показувати queued acknowledgement reaction, але без
lifecycle transition у tool-only mode. Candidate evidence має показувати lifecycle
status reactions, які виконуються, коли `messages.statusReactions.enabled` явно
true.

Виконуваний перший зріз — opt-in Discord live QA scenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Він налаштовує SUT з always-on guild handling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` і explicit status reactions. Oracle
polls the real Discord triggering message і очікує observed sequence
`👀 -> 🤔 -> 👍`. Artifacts include `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html`, and
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному private QA stack, а не починати з
нуля:

- `pnpm openclaw qa discord` уже запускає live Discord lane з driver і
  SUT bots.
- Live transport runner уже записує reports і observed-message
  artifacts під `.artifacts/qa-e2e/`.
- Convex credential leases уже надають exclusive access to shared live
  transport credentials.
- Browser control service уже підтримує screenshots, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus for transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner над цими
частинами, плюс один visual evidence layer.

## Модель доказів

Кожен run записує стабільний artifact directory:

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

`mantis-summary.json` має бути machine-readable source of truth. Markdown
report призначений для PR comments і human review.

Summary має включати:

- refs і SHAs tested
- transport and scenario id
- machine provider and machine id або lease id
- credential source without secret values
- baseline result
- candidate result
- whether the bug reproduced on baseline
- whether the candidate fixed it
- artifact paths
- sanitized setup or cleanup issues

Screenshots — це evidence, не secrets. Вони все одно потребують redaction discipline:
private channel names, user names або message content можуть з’являтися. Для public PRs
надавайте перевагу GitHub Actions artifact links, а не inline images, доки redaction story
не стане сильнішою.

## Browser і VNC

Browser lane має два modes:

- **Headless automation**: default для CI. Chrome runs with CDP enabled, and
  Playwright або OpenClaw browser control captures screenshots.
- **VNC rescue**: enabled on the same VM, коли login, MFA, Discord anti-automation
  або visual debugging потребує людину.

Discord observer browser profile має бути достатньо persistent, щоб уникати
logging in for every run, але isolated from personal browser state. Profile
belongs to the Mantis machine pool, not to a developer laptop.

Коли Mantis застрягає, він публікує Discord status message з:

- run id
- scenario id
- machine provider
- artifact directory
- VNC або noVNC connection instructions, якщо доступні
- short blocker text

Перший private deployment може публікувати ці messages в existing operator
channel і пізніше перейти до dedicated Mantis channel.

## Машини

Mantis має надавати перевагу AWS через Crabbox для першої remote implementation.
Crabbox дає нам warmed machines, lease tracking, hydration, logs, results і
cleanup. Якщо AWS capacity надто повільна або недоступна, додайте Hetzner provider
behind the same machine interface.

Мінімальні вимоги до VM:

- Linux із desktop-capable Chrome або Chromium install
- CDP access for browser automation
- VNC або noVNC для rescue
- Node 22 і pnpm
- OpenClaw checkout і dependency cache
- Playwright Chromium browser cache, коли використовується Playwright
- достатньо CPU і memory для одного OpenClaw Gateway, одного browser і одного model run
- outbound access to Discord, GitHub, model providers і credential broker

VM не має зберігати long-lived raw secrets поза expected credential або
browser profile stores.

## Secrets

Secrets живуть у GitHub organization або repository secrets для remote runs і в
local operator-controlled secret file для local runs.

Рекомендовані secret names:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для завантажень публічних артефактів GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом облікових даних для live-транспортів. Секрети GitHub початково налаштовують брокер і резервні лінії.

Запускач Mantis ніколи не повинен друкувати:

- токени ботів Discord
- API-ключі провайдерів
- cookie браузера
- вміст профілів автентифікації
- паролі VNC
- сирі payload-и облікових даних

Завантаження публічних артефактів також мають редагувати цільові метадані Discord, як-от ідентифікатори бота, guild, каналу та повідомлення. GitHub smoke workflow вмикає `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставили в issue, PR, чат або журнал, ротуй його після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Workflow-и Mantis мають завантажувати повний пакет доказів як короткостроковий артефакт Actions. Коли workflow запускається для звіту про bug або fix PR, він також має публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і оновлювати або створювати коментар у цьому bug або fix PR з inline-знімками до/після. Не публікуй основний доказ лише в generic PR автоматизації QA. Сирі журнали, спостережені повідомлення та інші об’ємні докази залишаються в артефакті Actions.

Production workflow-и мають публікувати ці коментарі через Mantis GitHub App, а не через `github-actions[bot]`. Збережи app id і private key як секрети GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow визначає login бота з токена GitHub App, оновлює наявний коментар, власником якого є Mantis, якщо він існує, і створює новий коментар від імені Mantis замість переписування старіших коментарів `github-actions[bot]`.

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

Коли запуск не вдається через збій harness, коментар має вказувати саме це, а не натякати, що кандидат не пройшов.

## Нотатки щодо приватного розгортання

У приватному розгортанні вже може бути застосунок Mantis Discord. Використовуй цей застосунок повторно замість створення іншого app, якщо він має потрібні дозволи бота і його можна безпечно ротувати.

Задай початковий канал сповіщень оператора через секрети або конфігурацію розгортання. Спочатку він може вказувати на наявний канал maintainers або operations, а потім перейти на виділений канал Mantis, коли він з’явиться.

Не розміщуй guild ids, channel ids, bot tokens, browser cookies або VNC passwords у цьому документі. Зберігай їх у секретах GitHub, брокері облікових даних або локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і title
- transport
- required credentials
- baseline ref policy
- candidate ref policy
- OpenClaw config patch
- кроки налаштування
- стимул
- очікуваний baseline oracle
- очікуваний candidate oracle
- цілі візуального захоплення
- бюджет timeout
- кроки очищення

Сценаріям варто віддавати перевагу невеликим typed oracle:

- стан реакції Discord для bug-ів реакцій
- посилання на повідомлення Discord для bug-ів threading
- Slack thread ts і стан API реакцій для bug-ів Slack
- ідентифікатори повідомлень email і заголовки для bug-ів email
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Перевірки vision мають бути додатковими. Якщо API платформи може довести bug, використовуй API як pass/fail oracle і залишай знімки екрана для людської впевненості.

## Розширення провайдерів

Після Discord той самий запускач може додати:

- Slack: реакції, threads, app mentions, modals, file uploads.
- Email: автентифікація Gmail і threading повідомлень за допомогою `gog`, коли connectors недостатньо.
- WhatsApp: QR-вхід, повторна ідентифікація, доставка повідомлень, медіа, реакції.
- Telegram: gating згадок у групі, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, зв’язки thread або reply, відновлення після перезапуску.

Кожен transport має мати один дешевий smoke scenario і один або більше bug-class scenarios. Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли наявний бот Mantis використовується повторно?
- Чи має browser login спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис або лише bot-readable REST evidence для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування команди maintainer?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
