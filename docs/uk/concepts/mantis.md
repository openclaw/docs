---
read_when:
    - Створення або запуск візуального контролю якості в реальному часі для помилок OpenClaw
    - Додавання перевірки до і після для запиту на злиття
    - Додавання сценаріїв Discord, Slack, WhatsApp або інших реальних транспортів
    - Налагодження запусків QA, яким потрібні знімки екрана, автоматизація браузера або доступ VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на реальних транспортах, фіксації доказів до й після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-04T00:59:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42161d802c8601e58af1abef69277b5b3eac37750480326e1f56b2898a6af3fb
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні реальний
runtime, реальний транспорт і видимий доказ. Вона запускає сценарій проти відомого
поганого ref, збирає докази, запускає той самий сценарій проти candidate ref і
публікує порівняння як артефакти, які maintainer може перевірити з PR або
з локальної команди.

Mantis починає з Discord, тому що Discord дає нам першу lane з високою цінністю:
реальна автентифікація бота, реальні канали guild, реакції, threads, нативні команди та
браузерний UI, де люди можуть візуально підтвердити те, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Захопити артефакт **before** на baseline ref до застосування виправлення.
- Захопити артефакт **after** на candidate ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад читання реакції
  через Discord REST або перевірку transcript каналу.
- Захоплювати скриншоти, коли помилка має видиму UI-поверхню.
- Запускати локально з CLI, керованого агентом, і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-рятування, коли login, браузерна автоматизація або
  автентифікація provider зависають.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблокований,
  потребує ручної VNC-допомоги або завершується.

## Нецілі

- Mantis не є заміною unit tests. Запуск Mantis зазвичай має перетворитися
  на менший regression test після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI gate. Він повільніший, використовує live credentials і
  призначений для помилок, де live environment має значення.
- Mantis не має вимагати участі людини для нормальної роботи. Ручний VNC — це шлях
  рятування, а не happy path.
- Mantis не зберігає сирі secrets в артефактах, логах, скриншотах, Markdown
  звітах або PR-коментарях.

## Відповідальність

Mantis належить до QA-стеку OpenClaw.

- OpenClaw відповідає за runtime сценаріїв, transport adapters, схему доказів і
  локальний CLI під `pnpm openclaw qa mantis`.
- QA Lab відповідає за компоненти live transport harness, helper-и для browser capture і
  artifact writers.
- Crabbox відповідає за прогріті Linux-машини, коли потрібна віддалена VM.
- GitHub Actions відповідає за entrypoint віддаленого workflow і зберігання артефактів.
- ClawSweeper відповідає за маршрутизацію GitHub-коментарів: parsing maintainer commands,
  dispatching the workflow і публікацію фінального PR-коментаря.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні agentic setup,
  debugging або stuck-state reporting.

Ця межа зберігає знання про транспорт в OpenClaw, планування машин у
Crabbox, а maintainer workflow glue у ClawSweeper.

## Форма команд

Перша локальна команда перевіряє Discord-бота, guild, канал, надсилання повідомлення,
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

Runner створює від'єднані baseline і candidate worktrees під output
directory, встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка
означає, що baseline status — `fail`, а candidate status — `pass`.

Перший примітив VM/browser — це desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер всередині
VNC-сесії, захоплює desktop, витягує артефакти назад у локальний output
directory і записує команду перепідключення у звіт. Команда за замовчуванням
використовує Hetzner provider, тому що це перший provider з робочим desktop/VNC
coverage у Mantis lane. Перевизначте це через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, коли запускаєте проти іншого Crabbox fleet.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить локальний для repo HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенерований Discord status-reaction timeline через реальний Crabbox desktop.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` зберігає новостворений успішний lease відкритим для VNC-перевірки. Невдалі запуски за замовчуванням зберігають lease, якщо його було створено, щоб оператор міг перепідключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та lifetime lease.

GitHub smoke workflow — це `Mantis Discord Smoke`. GitHub workflow before і after
для першого реального сценарію — це `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворювати queued-only behavior.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checkout-ить workflow harness ref, збирає окремі baseline і candidate
worktrees, запускає `discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
Actions artifacts. Він також рендерить timeline HTML кожної lane у desktop-браузері
Crabbox і публікує ці VNC-скриншоти поруч із детермінованими
timeline PNG у PR-коментарі.

Також можна запустити status-reactions run напряму з PR-коментаря:

```text
@Mantis discord status reactions
```

Comment trigger навмисно вузький. Він запускається лише на pull request
comments від користувачів із write, maintain або admin access і розпізнає лише
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

Перша команда явна та зосереджена на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis на основі labels, changed files і
ClawSweeper review findings.

## Життєвий цикл запуску

1. Отримати credentials.
2. Виділити або повторно використати VM.
3. Підготувати desktop/browser profile, коли сценарію потрібні UI-докази.
4. Підготувати clean checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим state directory.
7. Налаштувати live transport, provider, model і browser profile.
8. Запустити сценарій і захопити baseline evidence.
9. Зупинити gateway і зберегти logs.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і захопити candidate evidence.
12. Порівняти oracle results і visual evidence.
13. Записати Markdown, JSON, logs, screenshots і optional trace artifacts.
14. Завантажити GitHub Actions artifacts.
15. Опублікувати стислий PR або Discord status message.

Сценарій має мати змогу завершитися невдало двома різними способами:

- **Помилку відтворено**: baseline завершився невдало очікуваним способом.
- **Збій harness**: environment setup, credentials, Discord API, browser або
  provider завершилися невдало до того, як bug oracle став meaningful.

Фінальний звіт має розділяти ці випадки, щоб maintainers не плутали flaky
environment із product behavior.

## Discord MVP

Перший сценарій має націлюватися на Discord status reactions у guild channels, де
source reply delivery mode — `message_tool_only`.

Чому це хороший seed для Mantis:

- Це видно в Discord як reactions на triggering message.
- Він має сильний REST oracle через Discord message reaction state.
- Він перевіряє реальний OpenClaw Gateway, автентифікацію Discord-бота, message dispatch,
  source reply delivery mode, status reaction state і model turn lifecycle.
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

Baseline evidence має показувати queued acknowledgement reaction, але без
lifecycle transition у tool-only mode. Candidate evidence має показувати, що lifecycle
status reactions працюють, коли `messages.statusReactions.enabled` явно
true.

Перший executable slice — це opt-in Discord live QA scenario:

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
опитує реальне Discord triggering message і очікує observed sequence
`👀 -> 🤔 -> 👍`. Артефакти включають `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні компоненти QA

Mantis має спиратися на наявний private QA stack замість того, щоб починати з
нуля:

- `pnpm openclaw qa discord` уже запускає live Discord lane з driver і
  SUT bots.
- Live transport runner уже записує reports і observed-message
  artifacts під `.artifacts/qa-e2e/`.
- Convex credential leases уже надають exclusive access до shared live
  transport credentials.
- Browser control service уже підтримує screenshots, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus для transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner поверх цих
компонентів плюс один шар visual evidence.

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

Screenshots — це докази, а не secrets. Вони все одно потребують redaction discipline:
private channel names, user names або message content можуть з'явитися. Для public PRs
віддавайте перевагу GitHub Actions artifact links над inline images, доки redaction story
не стане сильнішою.

## Браузер і VNC

Browser lane має два режими:

- **Headless automation**: за замовчуванням для CI. Chrome запускається з увімкненим CDP, а
  Playwright або OpenClaw browser control захоплює screenshots.
- **VNC rescue**: увімкнено на тій самій VM, коли login, MFA, Discord anti-automation
  або visual debugging потребують людини.

Профіль браузера спостерігача Discord має бути достатньо постійним, щоб уникати
входу під час кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord із:

- id запуску
- id сценарію
- постачальником машини
- каталогом артефактів
- інструкціями з підключення через VNC або noVNC, якщо доступно
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний канал
операторів, а пізніше перейти до окремого каналу Mantis.

## Машини

Mantis має надавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox надає нам попередньо прогріті машини, відстеження оренди, гідратацію, журнали, результати та
очищення. Якщо місткість AWS надто повільна або недоступна, додайте постачальника Hetzner
за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux з інсталяцією Chrome або Chromium, здатною працювати з робочим столом
- доступ CDP для автоматизації браузера
- VNC або noVNC для аварійного доступу
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU та пам’яті для одного OpenClaw Gateway, одного браузера й одного запуску моделі
- вихідний доступ до Discord, GitHub, постачальників моделей і брокера облікових даних

VM не має зберігати довготривалі необроблені секрети поза очікуваними сховищами облікових даних або
профілів браузера.

## Секрети

Секрети зберігаються в секретах організації або репозиторію GitHub для віддалених запусків, а також у
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

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом для живих
облікових даних транспорту. Секрети GitHub початково завантажують брокер і резервні лінії.

Runner Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі постачальників
- cookies браузера
- вміст профілю автентифікації
- паролі VNC
- необроблені payloads облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані Discord, як-от id бота,
guild, каналу й повідомлення. Smoke workflow GitHub вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, поверніть його
після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Workflow Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт Actions.
Коли workflow запускається для звіту про bug або PR з виправленням, він також має
публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і upsert-коментар
до цього bug або PR з виправленням із вбудованими знімками до/після. Не публікуйте
основний доказ лише в загальному PR автоматизації QA. Необроблені журнали, спостережені
повідомлення та інші об’ємні докази залишаються в артефакті Actions.

Production workflows мають публікувати ці коментарі через Mantis GitHub App, а не
через `github-actions[bot]`. Зберігайте app id і приватний ключ як секрети GitHub Actions
`MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow використовує прихований маркер як ключ upsert,
оновлює цей коментар, коли токен може його редагувати, і створює новий коментар від імені Mantis,
коли старіший маркер, що належить боту, не можна редагувати.

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

Коли запуск завершується невдало через збій harness, у коментарі має бути сказано саме це,
а не створюватися враження, що candidate не пройшов.

## Нотатки щодо приватного розгортання

Приватне розгортання вже може мати застосунок Discord Mantis. Повторно використовуйте цей
застосунок замість створення іншого app, якщо він має правильні дозволи бота
і його можна безпечно ротувати.

Задайте початковий канал сповіщень операторів через секрети або конфігурацію розгортання.
Спершу він може вказувати на наявний канал maintainer або operations,
а потім перейти до окремого каналу Mantis, коли він з’явиться.

Не додавайте guild ids, channel ids, токени ботів, cookies браузера або паролі VNC
до цього документа. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і назву
- транспорт
- необхідні облікові дані
- політику baseline ref
- політику candidate ref
- patch конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний oracle baseline
- очікуваний oracle candidate
- цілі візуального захоплення
- бюджет часу очікування
- кроки очищення

Сценарії мають надавати перевагу невеликим типізованим oracles:

- стан реакцій Discord для bugs реакцій
- посилання на повідомлення Discord для bugs тредингу
- thread ts Slack і стан API реакцій для bugs Slack
- ids повідомлень електронної пошти та заголовки для bugs електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Перевірки зору мають бути додатковими. Якщо API платформи може довести bug, використовуйте
API як oracle pass/fail і залишайте знімки екрана для впевненості людини.

## Розширення постачальників

Після Discord той самий runner може додати:

- Slack: реакції, треди, згадки app, модальні вікна, завантаження файлів.
- Email: автентифікація Gmail і трединг повідомлень із використанням `gog`, коли connectors недостатньо.
- WhatsApp: QR-вхід, повторна ідентифікація, доставка повідомлень, медіа, реакції.
- Telegram: gating групових згадок, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, зв’язки тредів або відповідей, resume після рестарту.

Кожен транспорт має мати один дешевий smoke-сценарій і один або більше сценаріїв класу bug.
Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли
  наявний бот Mantis використовується повторно?
- Чи має вхід браузера спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис
  або лише bot-readable REST-докази для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PRs?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди maintainer?
- Чи слід редагувати або обрізати знімки екрана перед завантаженням для публічних PRs?
