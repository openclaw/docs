---
read_when:
    - Створення або запуск візуальної QA-перевірки наживо для помилок OpenClaw
    - Додавання перевірки до та після для запиту на злиття
    - Додавання сценаріїв Discord, Slack, WhatsApp або інших реальних транспортів
    - Налагодження QA-запусків, які потребують знімків екрана, автоматизації браузера або доступу через VNC
summary: Mantis — це візуальна система наскрізної перевірки для відтворення помилок OpenClaw на живих транспортах, збирання доказів до та після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-04T01:25:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні реальне
середовище виконання, реальний транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які мейнтейнер може переглянути з PR або
з локальної команди.

Mantis починає з Discord, бо Discord дає нам цінну першу лінію:
реальну автентифікацію бота, реальні канали guild, реакції, threads, нативні команди та
браузерний інтерфейс, у якому люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **before** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **after** на кандидатному ref після застосування виправлення.
- Використовувати детермінований оракул, коли це можливо, наприклад читання реакції через Discord REST
  або перевірку transcript каналу.
- Збирати скриншоти, коли помилка має видиму поверхню UI.
- Запускати локально з CLI, керованого агентом, і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-рятування, коли вхід, браузерна автоматизація або
  автентифікація провайдера зависає.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблоковано,
  потребує ручної допомоги через VNC або завершується.

## Нецілі

- Mantis не замінює модульні тести. Запуск Mantis зазвичай має перетворитися на
  менший регресійний тест після того, як виправлення стане зрозумілим.
- Mantis не є звичайним швидким CI-гейтом. Він повільніший, використовує живі облікові дані та
  призначений для помилок, де живе середовище має значення.
- Mantis не повинен вимагати людини для нормальної роботи. Ручний VNC — це шлях
  відновлення, а не основний сценарій.
- Mantis не зберігає сирі секрети в артефактах, логах, скриншотах, Markdown
  звітах або коментарях PR.

## Відповідальність

Mantis живе у QA-стеку OpenClaw.

- OpenClaw відповідає за середовище виконання сценаріїв, транспортні адаптери, схему доказів і
  локальний CLI у `pnpm openclaw qa mantis`.
- QA Lab відповідає за компоненти live transport harness, помічники браузерного захоплення та
  записувачі артефактів.
- Crabbox відповідає за прогріті Linux-машини, коли потрібна віддалена VM.
- GitHub Actions відповідає за віддалену точку входу workflow і збереження артефактів.
- ClawSweeper відповідає за маршрутизацію коментарів GitHub: розбір команд мейнтейнерів,
  запуск workflow і публікацію фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні агентне налаштування,
  налагодження або повідомлення про застряглий стан.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у
Crabbox, а клей мейнтейнерського workflow у ClawSweeper.

## Форма команд

Перша локальна команда перевіряє Discord-бота, guild, канал, надсилання повідомлення,
надсилання реакції та шлях артефактів:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний runner для before і after приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює від’єднані worktree для baseline і candidate у каталозі output,
встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, а потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка
означає, що статус baseline — `fail`, а статус candidate — `pass`.

Перша VM/браузерна примітива — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Вона орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер усередині
VNC-сесії, захоплює desktop, забирає артефакти назад у локальний output
каталог і записує команду перепідключення у звіт. Команда за замовчуванням
використовує провайдера Hetzner, бо це перший провайдер із робочим desktop/VNC
покриттям у лінії Mantis. Перевизначте це через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, коли запускаєте проти іншого fleet Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, що відкривається у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенерований timeline status-reaction Discord через реальний Crabbox desktop.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворений успішний lease відкритим для VNC-інспекції. Невдалі запуски за замовчуванням залишають lease, коли він був створений, щоб оператор міг перепідключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та час життя lease.

GitHub smoke workflow — `Mantis Discord Smoke`. GitHub workflow before і after
для першого реального сценарію — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворювати поведінку queued-only.
- `candidate_ref`: ref, який має показувати `queued -> thinking -> done`.

Він checkout-ить ref workflow harness, збирає окремі worktree baseline і candidate,
запускає `discord-status-reactions-tool-only` для кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
артефакти Actions. Він також рендерить HTML timeline кожної лінії у Crabbox
desktop browser і публікує ці VNC-скриншоти поруч із детермінованими
timeline PNG у коментарі PR. Workflow збирає Crabbox CLI з
`openclaw/crabbox` main, щоб він міг використовувати поточні прапорці desktop/browser lease
до наступного випуску бінарника Crabbox.

Ви також можете запустити status-reactions run напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише для коментарів pull request
від користувачів із доступом write, maintain або admin, і розпізнає лише
запити status-reaction Discord. За замовчуванням він використовує відомий поганий baseline ref
і поточний SHA head PR як candidate. Мейнтейнери можуть перевизначити будь-який
ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й сфокусована на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis на основі labels, змінених файлів і
результатів review ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати профіль desktop/browser, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати live transport, провайдера, модель і профіль браузера.
8. Запустити сценарій і зібрати baseline-докази.
9. Зупинити gateway і зберегти логи.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і зібрати candidate-докази.
12. Порівняти результати оракула та візуальні докази.
13. Записати Markdown, JSON, логи, скриншоти та необов’язкові trace-артефакти.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статус у PR або Discord.

Сценарій має вміти падати двома різними способами:

- **Помилку відтворено**: baseline впав очікуваним способом.
- **Помилка harness**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер впали до того, як оракул помилки став значущим.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## MVP Discord

Перший сценарій має націлюватися на status reactions Discord у guild channels, де
режим доставки source reply — `message_tool_only`.

Чому це добрий початковий сценарій для Mantis:

- Це видно в Discord як реакції на повідомленні, яке запустило дію.
- Він має сильний REST-оракул через стан реакцій повідомлення Discord.
- Він перевіряє реальний OpenClaw Gateway, автентифікацію Discord-бота, dispatch повідомлень,
  режим доставки source reply, стан status reaction і життєвий цикл model turn.
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

Baseline-докази мають показувати queued acknowledgement reaction, але без
lifecycle transition у режимі tool-only. Candidate-докази мають показувати, що lifecycle
status reactions працюють, коли `messages.statusReactions.enabled` явно
дорівнює true.

Виконуваний перший зріз — opt-in live QA сценарій Discord:

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
"message_tool"`, `ackReaction: "👀"` і явними status reactions. Оракул
опитує реальне Discord-повідомлення, що запустило дію, і очікує спостережену послідовність
`👀 -> 🤔 -> 👍`. Артефакти включають `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні компоненти QA

Mantis має будуватися на наявному приватному QA-стеку, а не починати з
нуля:

- `pnpm openclaw qa discord` уже запускає live Discord line з driver і
  SUT bots.
- Live transport runner уже записує звіти та observed-message
  артефакти в `.artifacts/qa-e2e/`.
- Credential leases Convex уже надають ексклюзивний доступ до спільних live
  transport credentials.
- Browser control service уже підтримує скриншоти, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus для transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner поверх цих
компонентів плюс один шар візуальних доказів.

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

`mantis-summary.json` має бути машинозчитуваним джерелом істини. Markdown
звіт призначений для коментарів PR і людського review.

Summary має включати:

- перевірені refs і SHAs
- transport і scenario id
- machine provider і machine id або lease id
- credential source без secret values
- baseline result
- candidate result
- чи помилка відтворилася на baseline
- чи candidate виправив її
- artifact paths
- санітизовані setup або cleanup issues

Скриншоти — це докази, а не секрети. Однак вони все одно потребують дисципліни редагування:
можуть з’являтися приватні назви каналів, імена користувачів або вміст повідомлень. Для публічних PR
віддавайте перевагу посиланням на артефакти GitHub Actions замість inline images, доки історія редагування
не стане сильнішою.

## Браузер і VNC

Browser lane має два режими:

- **Headless automation**: стандартний для CI. Chrome запускається з увімкненим CDP, а
  Playwright або browser control OpenClaw збирає скриншоти.
- **VNC rescue**: вмикається на тій самій VM, коли вхід, MFA, Discord anti-automation
  або візуальне налагодження потребує людини.

Профіль браузера спостерігача Discord має бути достатньо сталим, щоб не
входити в систему під час кожного запуску, але ізольованим від особистого стану
браузера. Профіль належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord із:

- id запуску
- id сценарію
- постачальником машин
- каталогом артефактів
- інструкціями підключення через VNC або noVNC, якщо доступно
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний канал
операторів, а пізніше перейти до окремого каналу Mantis.

## Машини

Mantis має надавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox надає нам прогріті машини, відстеження оренди, гідратацію, логи,
результати та очищення. Якщо потужності AWS надто повільні або недоступні,
додайте постачальника Hetzner за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux з інсталяцією Chrome або Chromium, придатною для робочого столу
- доступ CDP для автоматизації браузера
- VNC або noVNC для відновлення
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU та пам’яті для одного OpenClaw Gateway, одного браузера й одного модельного запуску
- вихідний доступ до Discord, GitHub, постачальників моделей і брокера облікових даних

VM не має зберігати довготривалі необроблені секрети поза очікуваними сховищами
облікових даних або профілю браузера.

## Секрети

Секрети зберігаються в секретах організації або репозиторію GitHub для
віддалених запусків, а для локальних запусків — у локальному файлі секретів під
контролем оператора.

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

У довгостроковій перспективі пул облікових даних Convex має залишатися
звичайним джерелом для живих транспортних облікових даних. Секрети GitHub
початково завантажують брокер і резервні лінії. Workflow статусних реакцій
Discord зіставляє секрети Mantis Crabbox назад зі змінними середовища
`CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`, яких очікує Crabbox CLI.
Прості назви секретів GitHub `CRABBOX_*` залишаються прийнятими як резервна
сумісність.

Runner Mantis ніколи не повинен друкувати:

- токени ботів Discord
- API-ключі постачальників
- cookie браузера
- вміст профілів автентифікації
- паролі VNC
- необроблені payload облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані
Discord, як-от id бота, guild, каналу та повідомлення. Workflow GitHub smoke
увімкнув `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставили в issue, PR, чат або лог, поверніть його після
збереження нового секрету.

## Артефакти GitHub і коментарі PR

Workflow Mantis мають завантажувати повний пакет доказів як короткоживучий
артефакт Actions. Коли workflow запускається для звіту про баг або PR із
виправленням, він також має публікувати відредаговані PNG-скріншоти в гілку
`qa-artifacts` і оновлювати або створювати коментар до цього бага чи PR із
виправленням із вбудованими скріншотами до/після. Не публікуйте основний доказ
лише в загальному PR автоматизації QA. Необроблені логи, спостережені
повідомлення та інші об’ємні докази залишаються в артефакті Actions.

Виробничі workflow мають публікувати ці коментарі через GitHub App Mantis, а не
через `github-actions[bot]`. Зберігайте id застосунку та приватний ключ як
секрети GitHub Actions `MANTIS_GITHUB_APP_ID` і
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow використовує прихований маркер як ключ
upsert, оновлює цей коментар, коли токен може його редагувати, і створює новий
коментар, що належить Mantis, коли старіший маркер, який належить боту, не можна
редагувати.

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

Коли запуск завершується невдало через збій harness, коментар має повідомляти
саме це, а не натякати, що кандидат не пройшов.

## Нотатки щодо приватного розгортання

Приватне розгортання вже може мати застосунок Discord для Mantis. Повторно
використовуйте цей застосунок замість створення іншого, якщо він має потрібні
дозволи бота й може бути безпечно ротований.

Налаштуйте початковий канал сповіщень оператора через секрети або конфігурацію
розгортання. Спочатку він може вказувати на наявний канал мейнтейнерів або
операцій, а потім перейти до окремого каналу Mantis, щойно він з’явиться.

Не вносьте guild ids, channel ids, токени ботів, cookie браузера або паролі VNC
у цей документ. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і назву
- транспорт
- потрібні облікові дані
- політику baseline ref
- політику candidate ref
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний baseline oracle
- очікуваний candidate oracle
- цілі візуального захоплення
- бюджет timeout
- кроки очищення

Сценарії мають надавати перевагу малим типізованим oracle:

- стан реакцій Discord для багів реакцій
- посилання на повідомлення Discord для багів тредингу
- thread ts Slack і стан API реакцій для багів Slack
- id повідомлень email і заголовки для багів email
- скріншоти браузера, коли UI є єдиним надійним спостережуваним сигналом

Vision-перевірки мають бути додатковими. Якщо API платформи може довести баг,
використовуйте API як oracle pass/fail, а скріншоти залишайте для впевненості
людей.

## Розширення постачальників

Після Discord той самий runner може додати:

- Slack: реакції, треди, згадки застосунку, модальні вікна, завантаження файлів.
- Email: автентифікацію Gmail і трединг повідомлень за допомогою `gog`, коли конекторів недостатньо.
- WhatsApp: вхід через QR, повторну ідентифікацію, доставку повідомлень, медіа, реакції.
- Telegram: gating згадок у групі, команди, реакції там, де доступно.
- Matrix: зашифровані кімнати, зв’язки тредів або відповідей, відновлення після перезапуску.

Кожен транспорт має мати один дешевий smoke-сценарій і один або більше сценаріїв
класу багів. Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли наявний бот Mantis використовується повторно?
- Чи має вхід браузера спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис або лише REST-докази, доступні для читання ботом, на першій фазі?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування команди мейнтейнера?
- Чи мають скріншоти редагуватися або обрізатися перед завантаженням для публічних PR?
