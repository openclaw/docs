---
read_when:
    - Створення або запуск живої візуальної перевірки якості для помилок OpenClaw
    - Додавання перевірки «до» та «після» для запиту на злиття
    - Додавання сценаріїв живого транспорту для Discord, Slack, WhatsApp або інших сервісів
    - Налагодження QA-запусків, яким потрібні знімки екрана, автоматизація браузера або доступ VNC
summary: Mantis — це візуальна система наскрізної перевірки для відтворення помилок OpenClaw на реальних транспортних каналах, збирання доказів до і після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-04T01:17:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b32fdfed4ebf75083b4ca24fd41a800924c67918d2c969fa108639583284d84
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні справжнє
середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які maintainer може переглянути з PR або
з локальної команди.

Mantis починається з Discord, бо Discord дає нам першу lane з високою цінністю:
справжню автентифікацію бота, справжні канали guild, реакції, threads, нативні команди та
інтерфейс браузера, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку
  бачать користувачі.
- Зібрати артефакт **before** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **after** на кандидатному ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад читання реакції через Discord REST
  або перевірку transcript каналу.
- Збирати знімки екрана, коли помилка має видиму UI-поверхню.
- Запускати локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-порятунку, коли вхід, автоматизація браузера або
  автентифікація провайдера застрягає.
- Надсилати стислий статус в операторський Discord-канал, коли запуск заблокований,
  потребує ручної допомоги через VNC або завершується.

## Нецілі

- Mantis не є заміною unit tests. Запуск Mantis зазвичай має перетворитися на
  менший regression test після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI gate. Він повільніший, використовує live credentials і
  зарезервований для помилок, де live-середовище має значення.
- Mantis не повинен вимагати людини для нормальної роботи. Ручний VNC — це шлях
  порятунку, а не happy path.
- Mantis не зберігає raw secrets в артефактах, логах, знімках екрана, Markdown
  звітах або коментарях PR.

## Власність

Mantis живе в QA-стеку OpenClaw.

- OpenClaw володіє runtime сценаріїв, transport adapters, evidence schema і
  локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live transport harness, browser capture helpers і
  artifact writers.
- Crabbox володіє warmed Linux machines, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow і збереженням артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: parsing maintainer commands,
  dispatching workflow і posting final PR comment.
- Агенти OpenClaw керують Mantis через Codex, коли сценарій потребує agentic setup,
  debugging або stuck-state reporting.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у
Crabbox, а клей maintainer workflow — у ClawSweeper.

## Форма команд

Перша локальна команда перевіряє Discord-бота, guild, channel, надсилання повідомлення,
надсилання реакції та шлях артефакту:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний before and after runner приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює detached baseline і candidate worktrees у вихідному
каталозі, встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого Discord-сценарію успішна перевірка
означає, що baseline status — `fail`, а candidate status — `pass`.

Перший VM/browser primitive — це desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop machine Crabbox, запускає видимий браузер усередині
VNC-сесії, захоплює desktop, витягує артефакти назад у локальний вихідний
каталог і записує команду повторного підключення у звіт. Команда за замовчуванням
використовує Hetzner provider, бо це перший provider із робочим desktop/VNC
покриттям у Mantis lane. Перевизначте його через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, коли запускаєте проти іншого Crabbox fleet.

Корисні desktop smoke flags:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує warmed desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML artifact у видимому браузері. Mantis використовує це, щоб захопити згенеровану Discord status-reaction timeline через справжній Crabbox desktop.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворений passing lease відкритим для VNC inspection. Failed runs залишають lease за замовчуванням, коли його було створено, щоб оператор міг повторно підключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та lifetime lease.

GitHub smoke workflow — `Mantis Discord Smoke`. Before and after GitHub
workflow для першого справжнього сценарію — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворити queued-only behavior.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checkout workflow harness ref, збирає окремі baseline і candidate
worktrees, запускає `discord-status-reactions-tool-only` для кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
Actions artifacts. Він також рендерить timeline HTML кожної lane у Crabbox
desktop browser і публікує ці VNC screenshots поруч із deterministic
timeline PNGs у коментарі PR.

Ви також можете запустити status-reactions run напряму з коментаря PR:

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

Перша команда явна і сфокусована на сценарії. Друга пізніше може зіставляти PR
або issue з рекомендованими Mantis scenarios на основі labels, changed files і
ClawSweeper review findings.

## Життєвий цикл запуску

1. Отримати credentials.
2. Виділити або повторно використати VM.
3. Підготувати desktop/browser profile, коли сценарій потребує UI evidence.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим state directory.
7. Налаштувати live transport, provider, model і browser profile.
8. Запустити сценарій і зібрати baseline evidence.
9. Зупинити gateway і зберегти logs.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і зібрати candidate evidence.
12. Порівняти oracle results і visual evidence.
13. Записати Markdown, JSON, logs, screenshots і optional trace artifacts.
14. Завантажити GitHub Actions artifacts.
15. Опублікувати стислий PR або Discord status message.

Сценарій має вміти падати двома різними способами:

- **Помилку відтворено**: baseline впав очікуваним способом.
- **Harness failure**: environment setup, credentials, Discord API, browser або
  provider впав до того, як bug oracle став meaningful.

Фінальний звіт має розділяти ці випадки, щоб maintainers не плутали flaky
environment із product behavior.

## Discord MVP

Перший сценарій має націлюватися на Discord status reactions у guild channels, де
source reply delivery mode — `message_tool_only`.

Чому це хороший seed для Mantis:

- Це видно в Discord як reactions на triggering message.
- Він має strong REST oracle через Discord message reaction state.
- Він навантажує справжній OpenClaw Gateway, Discord bot auth, message dispatch,
  source reply delivery mode, status reaction state і model turn lifecycle.
- Він достатньо вузький, щоб тримати першу реалізацію чесною.

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
polls справжнє Discord triggering message і очікує observed sequence
`👀 -> 🤔 -> 👍`. Artifacts include `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному private QA stack, а не починати з
нуля:

- `pnpm openclaw qa discord` вже запускає live Discord lane з driver і
  SUT bots.
- Live transport runner вже записує reports і observed-message
  artifacts у `.artifacts/qa-e2e/`.
- Convex credential leases already provide exclusive access to shared live
  transport credentials.
- Browser control service вже підтримує screenshots, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab already has a debugger UI and bus for transport-shaped testing.

Перша реалізація Mantis може бути thin before/after runner поверх цих
частин, плюс один visual evidence layer.

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

Summary must include:

- refs and SHAs tested
- transport and scenario id
- machine provider and machine id or lease id
- credential source without secret values
- baseline result
- candidate result
- whether the bug reproduced on baseline
- whether the candidate fixed it
- artifact paths
- sanitized setup or cleanup issues

Screenshots are evidence, not secrets. They still need redaction discipline:
private channel names, user names, or message content may appear. For public PRs,
prefer GitHub Actions artifact links over inline images until the redaction story
is stronger.

## Browser And VNC

The browser lane has two modes:

- **Headless automation**: default for CI. Chrome runs with CDP enabled, and
  Playwright or OpenClaw browser control captures screenshots.
- **VNC rescue**: enabled on the same VM when login, MFA, Discord anti-automation,
  or visual debugging needs a human.

Профіль браузера-спостерігача Discord має бути достатньо постійним, щоб уникати
входу під час кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord із:

- id запуску
- id сценарію
- постачальником машин
- каталогом артефактів
- інструкціями для підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал і пізніше перейти до окремого каналу Mantis.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox надає нам прогріті машини, відстеження оренди, гідратацію, журнали, результати та
очищення. Якщо потужність AWS надто повільна або недоступна, додайте постачальника Hetzner
за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux з установленим Chrome або Chromium, придатним для робочого столу
- доступ CDP для автоматизації браузера
- VNC або noVNC для відновлення
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU й памʼяті для одного OpenClaw Gateway, одного браузера й одного запуску моделі
- вихідний доступ до Discord, GitHub, постачальників моделей і брокера облікових даних

VM не має зберігати довгоживучі сирі секрети поза очікуваними сховищами облікових даних або
профілю браузера.

## Секрети

Секрети живуть у секретах організації або репозиторію GitHub для віддалених запусків і в
локальному файлі секретів під керуванням оператора для локальних запусків.

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

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом
для облікових даних живого транспорту. Секрети GitHub завантажують брокер і резервні смуги.
Робочий процес статусних реакцій Discord зіставляє секрети Mantis Crabbox назад зі
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
яких очікує Crabbox CLI. Прості назви секретів GitHub `CRABBOX_*` залишаються
прийнятими як резервний варіант сумісності.

Ранер Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі постачальників
- cookies браузера
- вміст профілів автентифікації
- паролі VNC
- сирі payload-и облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані Discord, як-от id бота,
гільдії, каналу й повідомлення. Робочий процес smoke GitHub вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, оберніть його
після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Робочі процеси Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт
Actions. Коли робочий процес запускається для звіту про баг або PR із виправленням, він також має
публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і upsert-коментар
до цього бага або PR із виправленням із вбудованими знімками до/після. Не публікуйте
основний доказ лише в загальному PR автоматизації QA. Сирі журнали, спостережені
повідомлення та інші обʼємні докази залишаються в артефакті Actions.

Виробничі робочі процеси мають публікувати ці коментарі через Mantis GitHub App, а не
через `github-actions[bot]`. Зберігайте app id і приватний ключ як
секрети GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Робочий процес використовує прихований маркер як ключ upsert, оновлює цей
коментар, коли токен може його редагувати, і створює новий коментар від Mantis, коли
старіший маркер від бота не можна редагувати.

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

Коли запуск зазнає невдачі через збій harness, коментар має повідомляти саме це,
а не натякати, що кандидат зазнав невдачі.

## Примітки до приватного розгортання

Приватне розгортання вже може мати застосунок Mantis Discord. Повторно використайте цей
застосунок замість створення іншого, якщо він має правильні дозволи бота
і його можна безпечно обертати.

Задайте початковий канал сповіщень операторів через секрети або конфігурацію
розгортання. Спершу він може вказувати на наявний канал мейнтейнерів або операцій,
а потім перейти до окремого каналу Mantis, щойно він зʼявиться.

Не додавайте id гільдій, id каналів, токени ботів, cookies браузера або паролі VNC
до цього документа. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і назву
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
- бюджет тайм-ауту
- кроки очищення

Сценарії мають віддавати перевагу малим типізованим оракулам:

- стан реакції Discord для багів реакцій
- посилання на повідомлення Discord для багів тредингу
- thread ts Slack і стан API реакцій для багів Slack
- id повідомлень електронної пошти та заголовки для багів електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Перевірки зору мають бути додатковими. Якщо API платформи може довести баг, використовуйте
API як оракул pass/fail і зберігайте знімки екрана для впевненості людини.

## Розширення постачальників

Після Discord той самий ранер може додати:

- Slack: реакції, треди, згадки застосунку, модальні вікна, завантаження файлів.
- Електронна пошта: автентифікація Gmail і трединг повідомлень за допомогою `gog`, коли конекторів
  недостатньо.
- WhatsApp: QR-вхід, повторна ідентифікація, доставка повідомлень, медіа, реакції.
- Telegram: gating згадок групи, команди, реакції, де доступні.
- Matrix: зашифровані кімнати, звʼязки тредів або відповідей, відновлення після перезапуску.

Кожен транспорт має мати один дешевий smoke-сценарій і один або кілька сценаріїв
класу багів. Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли повторно використовується
  наявний бот Mantis?
- Чи має вхід браузера-спостерігача використовувати людський акаунт Discord, тестовий акаунт
  або лише REST-докази, доступні боту для читання, на першій фазі?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди мейнтейнера?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
