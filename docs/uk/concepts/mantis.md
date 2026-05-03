---
read_when:
    - Створення або запуск візуального контролю якості в реальному часі для помилок OpenClaw
    - Додавання перевірки «до» та «після» для запиту на злиття
    - Додавання сценаріїв Discord, Slack, WhatsApp або інших транспортів у реальному часі
    - Налагодження QA-запусків, яким потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на реальних транспортах, фіксації доказів до й після та прикріплення артефактів до запитів на злиття.
title: Богомол
x-i18n:
    generated_at: "2026-05-03T20:39:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної верифікації OpenClaw для помилок, яким потрібні справжній
runtime, справжній транспорт і видимий доказ. Вона запускає сценарій проти відомого
поганого ref, збирає докази, запускає той самий сценарій проти кандидатного ref і
публікує порівняння як артефакти, які maintainer може перевірити з PR або
з локальної команди.

Mantis починає з Discord, тому що Discord дає нам високовартісну першу лінію:
справжню автентифікацію бота, справжні канали guild, реакції, threads, нативні команди та
браузерний UI, де люди можуть візуально підтвердити те, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **before** на baseline ref перед застосуванням виправлення.
- Зібрати артефакт **after** на candidate ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад читання реакції через Discord REST
  або перевірку transcript каналу.
- Збирати screenshots, коли помилка має видиму UI-поверхню.
- Запускати локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-відновлення, коли вхід, браузерна автоматизація або
  автентифікація provider застрягає.
- Публікувати стислий статус в operator Discord channel, коли запуск заблоковано,
  потрібна ручна VNC-допомога або запуск завершено.

## Нецілі

- Mantis не є заміною для unit tests. Запуск Mantis зазвичай має ставати
  меншим regression test після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI gate. Він повільніший, використовує live credentials і
  зарезервований для помилок, де live environment має значення.
- Mantis не має вимагати участі людини для звичайної роботи. Ручний VNC — це шлях відновлення,
  а не happy path.
- Mantis не зберігає raw secrets в artifacts, logs, screenshots, Markdown
  reports або PR comments.

## Власність

Mantis живе в OpenClaw QA stack.

- OpenClaw володіє scenario runtime, transport adapters, evidence schema і
  локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live transport harness, browser capture helpers і
  artifact writers.
- Crabbox володіє прогрітими Linux machines, коли потрібна remote VM.
- GitHub Actions володіє remote workflow entrypoint і artifact retention.
- ClawSweeper володіє GitHub comment routing: розбором maintainer commands,
  dispatch workflow і публікацією фінального PR comment.
- OpenClaw agents керують Mantis через Codex, коли сценарію потрібні agentic setup,
  debugging або stuck-state reporting.

Ця межа утримує знання про транспорт в OpenClaw, планування машин у
Crabbox, а maintainer workflow glue — у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє Discord bot, guild, channel, message send,
reaction send і artifact path:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний before і after runner приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює detached baseline і candidate worktrees під output
directory, встановлює dependencies, збирає кожен ref, запускає scenario з
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого Discord scenario успішна верифікація
означає, що baseline status — `fail`, а candidate status — `pass`.

GitHub smoke workflow — це `Mantis Discord Smoke`. Before і after GitHub
workflow для першого справжнього scenario — це `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, від якого очікується відтворення queued-only behavior.
- `candidate_ref`: ref, від якого очікується показ `queued -> thinking -> done`.

Він checkout workflow harness ref, збирає окремі baseline і candidate
worktrees, запускає `discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
Actions artifacts.

Ви також можете запустити status-reactions run напряму з PR comment:

```text
@Mantis discord status reactions
```

Comment trigger навмисно вузький. Він запускається лише на pull request
comments від користувачів із write, maintain або admin access, і розпізнає лише
Discord status-reaction requests. За замовчуванням він використовує відомий поганий baseline ref
і поточний PR head SHA як candidate. Maintainers можуть перевизначити будь-який
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на scenario. Друга пізніше може зіставляти PR
або issue з рекомендованими Mantis scenarios на основі labels, changed files і
ClawSweeper review findings.

## Життєвий цикл запуску

1. Отримати credentials.
2. Виділити або повторно використати VM.
3. Підготувати clean checkout для baseline ref.
4. Встановити dependencies і зібрати лише те, що потрібно scenario.
5. Запустити дочірній OpenClaw Gateway з ізольованим state directory.
6. Налаштувати live transport, provider, model і browser profile.
7. Запустити scenario і зібрати baseline evidence.
8. Зупинити gateway і зберегти logs.
9. Підготувати candidate ref у тій самій VM.
10. Запустити той самий scenario і зібрати candidate evidence.
11. Порівняти oracle results і visual evidence.
12. Записати Markdown, JSON, logs, screenshots і optional trace artifacts.
13. Завантажити GitHub Actions artifacts.
14. Опублікувати стислий PR або Discord status message.

Scenario має вміти завершуватися невдачею двома різними способами:

- **Помилку відтворено**: baseline failed очікуваним способом.
- **Помилка harness**: environment setup, credentials, Discord API, browser або
  provider failed до того, як bug oracle став meaningful.

Фінальний report має розділяти ці випадки, щоб maintainers не плутали flaky
environment із product behavior.

## Discord MVP

Перший scenario має таргетувати Discord status reactions у guild channels, де
source reply delivery mode — `message_tool_only`.

Чому це хороший seed для Mantis:

- Це видно в Discord як reactions на triggering message.
- Він має сильний REST oracle через Discord message reaction state.
- Він вправляє справжній OpenClaw Gateway, Discord bot auth, message dispatch,
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
status reactions, що виконуються, коли `messages.statusReactions.enabled` явно
true.

Виконуваний перший slice — це opt-in Discord live QA scenario:

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
"message_tool"`, `ackReaction: "👀"` і явними status reactions. Oracle
опитує справжній Discord triggering message і очікує observed sequence
`👀 -> 🤔 -> 👍`. Artifacts включають `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному private QA stack, а не починати з
нуля:

- `pnpm openclaw qa discord` вже запускає live Discord lane з driver і
  SUT bots.
- Live transport runner уже записує reports і observed-message
  artifacts під `.artifacts/qa-e2e/`.
- Convex credential leases уже надають ексклюзивний доступ до shared live
  transport credentials.
- Browser control service уже підтримує screenshots, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus для transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner поверх цих
частин, плюс один шар visual evidence.

## Модель доказів

Кожен запуск записує стабільний artifact directory:

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

- refs і SHAs, які тестувалися
- transport і scenario id
- machine provider і machine id або lease id
- credential source без secret values
- baseline result
- candidate result
- чи помилка відтворилася на baseline
- чи candidate її виправив
- artifact paths
- sanitized setup або cleanup issues

Screenshots — це evidence, а не secrets. Вони все одно потребують дисципліни redaction:
private channel names, user names або message content можуть з’явитися. Для public PRs
віддавайте перевагу GitHub Actions artifact links замість inline images, доки redaction story
не стане сильнішою.

## Browser і VNC

Browser lane має два modes:

- **Headless automation**: за замовчуванням для CI. Chrome запускається з увімкненим CDP, а
  Playwright або OpenClaw browser control збирає screenshots.
- **VNC rescue**: увімкнено на тій самій VM, коли login, MFA, Discord anti-automation
  або visual debugging потребує людини.

Discord observer browser profile має бути достатньо persistent, щоб уникати
login для кожного run, але ізольованим від personal browser state. Profile
належить Mantis machine pool, а не developer laptop.

Коли Mantis застрягає, він публікує Discord status message з:

- run id
- scenario id
- machine provider
- artifact directory
- VNC або noVNC connection instructions, якщо доступні
- короткий blocker text

Перше private deployment може публікувати ці messages в наявний operator
channel і пізніше перейти до dedicated Mantis channel.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої remote implementation.
Crabbox дає нам warmed machines, lease tracking, hydration, logs, results і
cleanup. Якщо AWS capacity занадто повільна або недоступна, додайте Hetzner provider
за тим самим machine interface.

Мінімальні вимоги до VM:

- Linux із desktop-capable Chrome або Chromium install
- CDP access для browser automation
- VNC або noVNC для rescue
- Node 22 і pnpm
- OpenClaw checkout і dependency cache
- Playwright Chromium browser cache, коли використовується Playwright
- достатньо CPU і memory для одного OpenClaw Gateway, одного browser і одного model run
- outbound access до Discord, GitHub, model providers і credential broker

VM не має зберігати long-lived raw secrets поза очікуваними credential або
browser profile stores.

## Secrets

Secrets живуть у GitHub organization або repository secrets для remote runs, а в
local operator-controlled secret file — для local runs.

Рекомендовані secret names:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для публічних завантажень артефактів GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом для live
облікових даних транспорту. Секрети GitHub початково налаштовують брокер і резервні лінії.

Запускач Mantis ніколи не повинен друкувати:

- токени ботів Discord
- API-ключі провайдерів
- cookies браузера
- вміст профілю автентифікації
- паролі VNC
- необроблені payload-и облікових даних

Публічні завантаження артефактів також мають редагувати метадані цілі Discord, як-от ідентифікатори ботів,
гільдій, каналів і повідомлень. Smoke workflow GitHub вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, змініть його
після того, як новий секрет буде збережено.

## Артефакти GitHub і коментарі PR

Workflow-и Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт Actions.
Коли workflow запускається для звіту про помилку або PR із виправленням, він також має
публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і upsert-ити
коментар до цієї помилки або PR із виправленням із вбудованими знімками до/після. Не публікуйте
основний доказ лише в загальному PR автоматизації QA. Необроблені журнали, спостережені
повідомлення та інші об’ємні докази залишаються в артефакті Actions.

Production workflow-и мають публікувати ці коментарі через Mantis GitHub App, а не
через `github-actions[bot]`. Збережіть ідентифікатор застосунку та приватний ключ як
секрети GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow використовує прихований маркер як ключ upsert, оновлює цей
коментар, коли токен може його редагувати, і створює новий коментар від імені Mantis, коли
старіший маркер, власником якого є бот, не можна відредагувати.

Коментар PR має бути коротким і візуальним:

```md
QA реакцій статусу Discord у Mantis

Підсумок: Mantis повторно запустив повідомлену помилку реакції статусу Discord на відомій
поганій базовій версії та кандидатному виправленні. Базова версія відтворила помилку, тоді як
кандидат показав очікувану послідовність у черзі -> думає -> виконано.

- Сценарій: `discord-status-reactions-tool-only`
- Запуск: <workflow run link>
- Артефакт: <artifact link>
- Базова версія: `<status>` на `<sha>`
- Кандидат: `<status>` на `<sha>`

| Базова версія       | Кандидат            |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

Коли запуск завершується невдало через збій harness, коментар має повідомляти саме це,
а не натякати, що кандидат не пройшов.

## Примітки щодо приватного розгортання

У приватному розгортанні вже може бути застосунок Mantis Discord. Повторно використовуйте цей
застосунок замість створення іншого, якщо він має правильні дозволи бота
і його можна безпечно ротувати.

Налаштуйте початковий канал сповіщень оператора через секрети або конфігурацію
розгортання. Спочатку він може вказувати на наявний канал супровідників або операційний канал,
а потім перейти до виділеного каналу Mantis, коли такий з’явиться.

Не додавайте ідентифікатори гільдій, ідентифікатори каналів, токени ботів, cookies браузера або паролі VNC
до цього документа. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і назву
- транспорт
- потрібні облікові дані
- політику ref для базової версії
- політику ref для кандидата
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний oracle базової версії
- очікуваний oracle кандидата
- цілі візуального захоплення
- бюджет таймауту
- кроки очищення

Сценарії мають надавати перевагу малим типізованим oracle:

- стан реакцій Discord для помилок реакцій
- посилання на повідомлення Discord для помилок потоків
- ts потоку Slack і стан API реакцій для помилок Slack
- ідентифікатори повідомлень електронної пошти та заголовки для помилок електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним джерелом

Перевірки зору мають бути додатковими. Якщо API платформи може довести помилку, використовуйте
API як oracle успіху/невдачі та залишайте знімки екрана для впевненості людини.

## Розширення провайдерів

Після Discord той самий запускач може додати:

- Slack: реакції, потоки, згадки застосунку, модальні вікна, завантаження файлів.
- Електронна пошта: автентифікація Gmail і потоки повідомлень за допомогою `gog`, коли конекторів
  недостатньо.
- WhatsApp: QR-вхід, повторна ідентифікація, доставка повідомлень, медіа, реакції.
- Telegram: обмеження згадок у групах, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, зв’язки потоків або відповідей, відновлення після перезапуску.

Кожен транспорт має мати один дешевий smoke-сценарій і один або кілька сценаріїв
класу помилок. Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути драйвером, а який SUT, коли повторно використовується
  наявний бот Mantis?
- Чи має вхід браузера спостерігача використовувати обліковий запис людини в Discord, тестовий обліковий запис
  або лише REST-докази, доступні боту, для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
