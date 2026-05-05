---
read_when:
    - Створення або запуск оперативної візуальної перевірки якості щодо помилок OpenClaw
    - Додавання перевірки до та після для запиту на злиття
    - Додавання сценаріїв для Discord, Slack, WhatsApp або інших транспортів у реальному часі
    - Налагодження запусків контролю якості, які потребують знімків екрана, автоматизації браузера або доступу через VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на реальних транспортних каналах, збирання доказів до й після та прикріплення артефактів до запитів на злиття.
title: Богомол
x-i18n:
    generated_at: "2026-05-05T06:28:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c84a09037d1edab88548eeb35a2d1b4066741511297423fe6c6fff656b95c27a
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні справжнє
середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які мейнтейнер може перевірити з PR або
з локальної команди.

Mantis починається з Discord, тому що Discord дає нам цінну першу смугу:
справжню авторизацію бота, справжні канали гільдії, реакції, треди, нативні команди та
браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад читання реакції через Discord REST
  або перевірку транскрипту каналу.
- Збирати знімки екрана, коли помилка має видиму UI-поверхню.
- Запускати локально з CLI, керованого агентом, і віддалено з GitHub.
- Зберігати достатньо машинного стану для відновлення через VNC, коли вхід, автоматизація браузера або
  авторизація провайдера застрягає.
- Публікувати стислий статус у операторський канал Discord, коли запуск заблокований,
  потребує ручної допомоги через VNC або завершується.

## Нецілі

- Mantis не є заміною модульних тестів. Запуск Mantis зазвичай має перетворитися
  на менший регресійний тест після того, як виправлення буде зрозуміле.
- Mantis не є звичайним швидким CI-гейтом. Він повільніший, використовує живі облікові дані та
  призначений для помилок, де має значення живе середовище.
- Mantis не має вимагати участі людини для нормальної роботи. Ручний VNC — це шлях
  відновлення, а не штатний шлях.
- Mantis не зберігає сирі секрети в артефактах, журналах, знімках екрана, Markdown
  звітах або коментарях PR.

## Власність

Mantis живе у QA-стеку OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними адаптерами, схемою доказів і
  локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами живого транспортного стенда, помічниками захоплення браузера та
  записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow та зберіганням артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: розбором команд мейнтейнерів,
  dispatch workflow та публікацією фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарій потребує агентного налаштування,
  налагодження або звітування про застряглий стан.

Ця межа тримає транспортні знання в OpenClaw, планування машин у
Crabbox, а клей робочого процесу мейнтейнерів у ClawSweeper.

## Форма команди

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

Runner створює від'єднані baseline і candidate worktree в каталозі output,
встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка
означає, що статус baseline — `fail`, а статус candidate — `pass`.

Перша VM/браузерна примітива — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Вона орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер у
VNC-сеансі, захоплює desktop, витягує артефакти назад у локальний output
каталог і записує команду повторного підключення у звіт. Команда за замовчуванням
використовує провайдера Hetzner, тому що він є першим провайдером з робочим desktop/VNC
покриттям у смузі Mantis. Перевизначте його через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` під час запуску проти іншого флоту Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенеровану часову шкалу реакцій статусу Discord через справжній Crabbox desktop.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну оренду відкритою для перевірки через VNC. Невдалі запуски за замовчуванням зберігають оренду, якщо вона була створена, щоб оператор міг підключитися повторно.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та час життя оренди.

Перша повна desktop-транспортна примітива — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Вона орендує або повторно використовує desktop-машину Crabbox, синхронізує поточний checkout у
VM, запускає `pnpm openclaw qa slack` всередині цієї VM, відкриває Slack Web у VNC
браузері, захоплює видимий desktop і копіює як Slack QA артефакти, так і
VNC-знімок екрана назад у локальний output каталог. Це перша форма Mantis,
де SUT OpenClaw Gateway і браузер одночасно живуть у тій самій
Linux desktop VM.

З `--gateway-setup` команда готує постійний одноразовий OpenClaw
home у `$HOME/.openclaw-mantis/slack-openclaw`, патчить конфігурацію Slack Socket Mode
для вибраного каналу, запускає `openclaw gateway run` на порту
`38973` і залишає Chrome запущеним у VNC-сеансі. Це режим "залиш мені
Linux desktop зі Slack і запущеним claw"; bot-to-bot смуга Slack QA
лишається типовою, коли `--gateway-setup` пропущено.

Обов'язкові вхідні дані для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленої модельної смуги. Якщо локально задано лише
  `OPENAI_API_KEY`, Mantis відображає його в `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб форвардинг env `OPENCLAW_*` у Crabbox міг перенести його
  у VM.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає на машині, де оператор уже увійшов у Slack Web через VNC.
- `--gateway-setup` запускає постійний Slack Gateway OpenClaw у VM замість запуску лише bot-to-bot QA смуги.
- `--slack-url <url>` відкриває конкретний Slack Web URL. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний токен SUT-бота.
- `--slack-channel-id <id>` керує allowlist каналів Slack, який використовує налаштування Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome всередині VM. Типове значення — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний вхід у Slack Web переживає повторні запуски на тій самій оренді.
- `--credential-source convex --credential-role ci` використовує спільний пул облікових даних замість прямих Slack env токенів.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються у живу смугу Slack.

GitHub smoke workflow — `Mantis Discord Smoke`. Workflow до і після GitHub
для першого справжнього сценарію — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, на якому очікується відтворення поведінки лише queued.
- `candidate_ref`: ref, на якому очікується показ `queued -> thinking -> done`.

Він checkout-ить ref harness workflow, збирає окремі baseline і candidate
worktree, запускає `discord-status-reactions-tool-only` проти кожного worktree та
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
артефакти Actions. Він також рендерить HTML часової шкали кожної смуги в Crabbox
desktop браузері та публікує ці VNC-знімки екрана поряд із детермінованими
PNG часової шкали в коментарі PR. Той самий коментар PR вбудовує легкі анімовані
GIF-прев'ю, згенеровані з VNC desktop записів, і посилається на повні
desktop MP4 файли, тоді як знімки екрана лишаються inline для швидкого перегляду. Workflow
збирає Crabbox CLI з
`openclaw/crabbox` main, щоб він міг використовувати поточні desktop/browser прапорці оренди
до того, як буде випущено наступний бінарний реліз Crabbox.

Ви також можете запустити status-reactions run напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише на коментарях pull request
від користувачів з доступом write, maintain або admin, і розпізнає лише
запити Discord status-reaction. За замовчуванням він використовує відомий поганий baseline ref
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

Перша команда явна й сфокусована на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis на основі міток, змінених файлів і
знахідок рев'ю ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати desktop/браузерний профіль, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати живий транспорт, провайдера, модель і браузерний профіль.
8. Запустити сценарій і зібрати baseline докази.
9. Зупинити Gateway і зберегти журнали.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і зібрати candidate докази.
12. Порівняти результати oracle і візуальні докази.
13. Записати Markdown, JSON, журнали, знімки екрана та необов'язкові trace-артефакти.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статусний коментар PR або повідомлення Discord.

Сценарій має бути здатний завершитися невдало двома різними способами:

- **Помилку відтворено**: baseline завершився невдало очікуваним способом.
- **Збій harness**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер завершилися невдало до того, як bug oracle став змістовним.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## Discord MVP

Перший сценарій має таргетити реакції статусу Discord у каналах гільдій, де
режим доставки вихідної відповіді — `message_tool_only`.

Чому це хороше зерно Mantis:

- Це видно в Discord як реакції на тригерне повідомлення.
- Воно має сильний REST oracle через стан реакцій повідомлення Discord.
- Воно перевіряє справжній OpenClaw Gateway, авторизацію Discord-бота, dispatch повідомлень,
  режим доставки вихідної відповіді, стан реакцій статусу та життєвий цикл ходу моделі.
- Воно достатньо вузьке, щоб перша реалізація залишалася чесною.

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

Baseline докази мають показати реакцію queued acknowledgement, але без
переходу життєвого циклу в режимі tool-only. Candidate докази мають показати, що реакції
статусу життєвого циклу виконуються, коли `messages.statusReactions.enabled` явно
має значення true.

Перший виконуваний зріз — opt-in сценарій Discord live QA:

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
"message_tool"`, `ackReaction: "👀"` і явними реакціями статусу. Oracle
опитує справжнє повідомлення-тригер у Discord і очікує спостережувану
послідовність `👀 -> 🤔 -> 👍`. Артефакти включають
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має спиратися на наявний приватний стек QA, а не починати з нуля:

- `pnpm openclaw qa discord` вже запускає live-лінію Discord із ботами driver і
  SUT.
- Live transport runner уже записує звіти й артефакти спостережених повідомлень
  у `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних
  live transport облікових даних.
- Сервіс керування браузером уже підтримує скриншоти, знімки стану,
  керовані headless-профілі та віддалені CDP-профілі.
- QA Lab уже має UI відлагодження та bus для transport-подібного тестування.

Перша реалізація Mantis може бути тонким runner до/після поверх цих частин,
плюс один шар візуальних доказів.

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

`mantis-summary.json` має бути машинозчитуваним джерелом істини. Звіт
Markdown призначений для коментарів у PR і перегляду людьми.

Зведення має включати:

- refs і SHA, які тестувалися
- transport і id сценарію
- постачальника машини та id машини або id оренди
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи відтворилася помилка на baseline
- чи candidate її виправив
- шляхи до артефактів
- санітизовані проблеми налаштування або очищення

Скриншоти є доказами, а не секретами. Вони все одно потребують дисципліни
редагування: можуть з'явитися приватні назви каналів, імена користувачів або
вміст повідомлень. Для публічних PR надавайте перевагу посиланням на артефакти
GitHub Actions замість inline-зображень, доки історія з редагуванням не стане
надійнішою.

## Браузер і VNC

Браузерна лінія має два режими:

- **Headless automation**: типовий для CI. Chrome запускається з увімкненим CDP,
  а Playwright або керування браузером OpenClaw знімає скриншоти.
- **VNC rescue**: вмикається на тій самій VM, коли вхід, MFA,
  антиавтоматизація Discord або візуальне відлагодження потребує людини.

Профіль браузера-спостерігача Discord має бути достатньо постійним, щоб не
входити в систему під час кожного запуску, але ізольованим від особистого стану
браузера. Профіль належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення в Discord із:

- id запуску
- id сценарію
- постачальником машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перший приватний деплоймент може публікувати ці повідомлення в наявний канал
операторів і пізніше перейти в окремий канал Mantis.

## Машини

Для першої віддаленої реалізації Mantis має надавати перевагу AWS через
Crabbox. Crabbox дає нам прогріті машини, відстеження оренд, hydration, логи,
результати та очищення. Якщо потужності AWS надто повільні або недоступні,
додайте постачальника Hetzner за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux зі встановленим Chrome або Chromium, здатним працювати з desktop
- доступ CDP для автоматизації браузера
- VNC або noVNC для rescue
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU і пам'яті для одного OpenClaw Gateway, одного браузера та одного
  запуску моделі
- вихідний доступ до Discord, GitHub, постачальників моделей і брокера
  облікових даних

VM не має зберігати довгоживучі raw-секрети поза очікуваними сховищами
облікових даних або профілів браузера.

## Секрети

Секрети живуть у секретах організації або репозиторію GitHub для віддалених
запусків і в локальному файлі секретів, контрольованому оператором, для
локальних запусків.

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
звичайним джерелом для live transport облікових даних. Секрети GitHub
bootstrap-лять брокер і fallback-лінії. Workflow Discord status-reactions
мапить секрети Mantis Crabbox назад у змінні середовища `CRABBOX_COORDINATOR` і
`CRABBOX_COORDINATOR_TOKEN`, яких очікує Crabbox CLI. Звичайні назви секретів
GitHub `CRABBOX_*` залишаються прийнятними як compatibility fallback.

Mantis runner ніколи не має друкувати:

- токени ботів Discord
- API-ключі постачальників
- cookies браузера
- вміст auth profile
- паролі VNC
- raw payload облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані
Discord, як-от id бота, guild, каналу та повідомлення. Smoke workflow GitHub
вмикає `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або лог, rotate його після
збереження нового секрету.

## Артефакти GitHub і коментарі PR

Workflow Mantis мають завантажувати повний пакет доказів як короткоживучий
артефакт Actions. Коли workflow запускається для звіту про помилку або PR з
виправленням, він також має публікувати відредаговані PNG-скриншоти в гілку
`qa-artifacts` і upsert-коментар у цей bug або fix PR з inline-скриншотами
до/після. Не публікуйте основний доказ лише в generic PR автоматизації QA.
Raw-логи, спостережені повідомлення та інші об'ємні докази залишаються в
артефакті Actions.

Production workflow мають публікувати ці коментарі через Mantis GitHub App, а
не через `github-actions[bot]`. Зберігайте app id і приватний ключ як секрети
GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow використовує прихований маркер як ключ upsert, оновлює цей коментар,
коли токен може його редагувати, і створює новий коментар від Mantis, коли
старіший маркер, що належить боту, не можна редагувати.

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

Коли запуск не вдається через збій harness, коментар має сказати саме це, а не
натякати, що candidate не пройшов.

## Нотатки щодо приватного деплойменту

Приватний деплоймент може вже мати застосунок Mantis Discord. Повторно
використайте цей застосунок замість створення ще одного app, якщо він має
потрібні дозволи бота і його можна безпечно rotate.

Задайте початковий канал сповіщень оператора через секрети або конфігурацію
деплойменту. Спершу він може вказувати на наявний канал maintainer або
operations, а потім перейти в окремий канал Mantis, коли такий з'явиться.

Не розміщуйте guild ids, channel ids, bot tokens, browser cookies або VNC
passwords у цьому документі. Зберігайте їх у секретах GitHub, брокері
облікових даних або локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і title
- transport
- потрібні облікові дані
- політику baseline ref
- політику candidate ref
- patch конфігурації OpenClaw
- кроки налаштування
- stimulus
- очікуваний oracle baseline
- очікуваний oracle candidate
- цілі візуального захоплення
- бюджет timeout
- кроки очищення

Сценарії мають надавати перевагу малим типізованим oracle:

- стан реакцій Discord для помилок реакцій
- посилання на повідомлення Discord для помилок threading
- ts thread Slack і стан reaction API для помилок Slack
- id повідомлень email і headers для помилок email
- скриншоти браузера, коли UI є єдиним надійним observable

Vision checks мають бути additive. Якщо API платформи може довести помилку,
використовуйте API як oracle pass/fail і залишайте скриншоти для впевненості
людини.

## Розширення постачальників

Після Discord той самий runner може додати:

- Slack: реакції, threads, app mentions, modals, file uploads.
- Email: auth Gmail і threading повідомлень із використанням `gog`, де
  connectors недостатньо.
- WhatsApp: QR-вхід, re-identification, доставка повідомлень, media, реакції.
- Telegram: group mention gating, commands, реакції, де доступні.
- Matrix: encrypted rooms, thread або reply relations, restart resume.

Кожен transport має мати один дешевий smoke-сценарій і один або кілька
сценаріїв класу помилок. Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли наявний бот Mantis
  використовується повторно?
- Чи має login браузера-спостерігача використовувати людський обліковий запис
  Discord, тестовий обліковий запис або лише bot-readable REST-докази для
  першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди maintainer?
- Чи потрібно редагувати або обрізати скриншоти перед завантаженням для
  публічних PR?
