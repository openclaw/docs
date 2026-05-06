---
read_when:
    - Створення або запуск візуальної перевірки якості в реальному середовищі для помилок OpenClaw
    - Додавання перевірки «до» та «після» для запиту на злиття
    - Додавання сценаріїв живого транспорту для Discord, Slack, WhatsApp або інших сервісів
    - Налагодження QA-запусків, яким потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це візуальна система наскрізної перевірки для відтворення помилок OpenClaw на реальних транспортах, фіксації доказів до й після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-06T01:51:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bba09cf1c3b4e16fc1e8ca84ce0d9c8284969c82e56f1f7083fc54f238924e9
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні реальне
середовище виконання, реальний транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які супровідник може перевірити з PR або
з локальної команди.

Mantis починає з Discord, бо Discord дає нам першу lane з високою цінністю:
справжня автентифікація бота, справжні канали guild, реакції, threads, нативні команди та
браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Коли можливо, використовувати детермінований oracle, наприклад зчитування реакції через Discord REST
  або перевірку transcript каналу.
- Збирати знімки екрана, коли помилка має видиму UI-поверхню.
- Запускати локально з CLI, керованого агентом, і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-порятунку, коли вхід, автоматизація браузера або
  автентифікація provider застрягають.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблокований,
  потребує ручної допомоги через VNC або завершується.

## Нецілі

- Mantis не є заміною unit tests. Запуск Mantis зазвичай має перетворитися
  на менший regression test після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI gate. Він повільніший, використовує живі облікові дані й
  призначений для помилок, де живе середовище має значення.
- Mantis не має вимагати участі людини для нормальної роботи. Ручний VNC — це шлях
  порятунку, а не штатний сценарій.
- Mantis не зберігає сирі secrets в артефактах, logs, screenshots, Markdown
  reports або PR comments.

## Володіння

Mantis живе в QA-стеку OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними adapters, схемою доказів і
  локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live transport harness, helpers для захоплення браузера та
  artifact writers.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow і зберіганням артефактів.
- ClawSweeper володіє маршрутизацією GitHub comments: парсингом команд супровідників,
  запуском workflow і публікацією фінального PR comment.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні agentic налаштування,
  налагодження або звітування про застряглий стан.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у
Crabbox, а склейку workflow супровідників у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє бота Discord, guild, канал, надсилання повідомлення,
надсилання реакції та шлях артефакта:

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

Runner створює від’єднані baseline і candidate worktrees під output
directory, встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`,
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка
означає, що baseline status — `fail`, а candidate status — `pass`.

Другий Discord before/after probe націлений на вкладення в threads:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Цей сценарій публікує батьківське повідомлення через driver bot, створює справжній Discord
thread, викликає action OpenClaw `message.thread-reply` з repo-local
`filePath`, потім опитує thread на відповідь SUT і filename вкладення. Baseline screenshot
показує відповідь без вкладення; candidate screenshot
показує очікуване вкладення `mantis-thread-report.md`.

Перший примітив VM/browser — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop machine Crabbox, запускає видимий browser у
VNC session, захоплює desktop, витягує артефакти назад у локальний output
directory і записує команду повторного підключення у report. Команда за замовчуванням
використовує Hetzner provider, бо це перший provider з робочим desktop/VNC
coverage у Mantis lane. Перевизначте його через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` під час запуску проти іншого Crabbox fleet.

Корисні desktop smoke flags:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому browser.
- `--html-file <path>` рендерить repo-local HTML artifact у видимому browser. Mantis використовує це, щоб захопити згенерований Discord status-reaction timeline через справжній Crabbox desktop.
- `--browser-profile-dir <remote-path>` повторно використовує віддалений Chrome user-data-dir, щоб постійний Mantis desktop міг залишатися залогіненим між запусками. Використовуйте це для довгоживучого профілю переглядача Discord Web.
- `--browser-profile-archive-env <name>` відновлює base64 `.tgz` архів Chrome user-data-dir з названої environment variable перед запуском browser. Використовуйте це для залогінених witnesses, таких як Discord Web. Env var за замовчуванням — `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` керує тривалістю MP4 capture. Використовуйте довшу тривалість для повільних залогінених web apps, яким потрібен час стабілізуватися.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну lease відкритою для VNC inspection. Невдалі запуски за замовчуванням зберігають lease, коли її було створено, щоб оператор міг підключитися повторно.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та lifetime lease.

Для доказів Discord Web Mantis використовує окремий viewer account замість
bot token. Live Discord API scenario залишається oracle: він створює справжній
thread, надсилає SUT `thread-reply` і перевіряє вкладення через Discord
REST. Коли встановлено `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарій також
записує артефакт Discord Web URL. Коли встановлено `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`,
він залишає цей thread доступним достатньо довго, щоб залогінений browser міг відкрити
і записати його.

GitHub workflow відкриває candidate thread URL у Discord Web, захоплює
screenshot, записує MP4 і генерує обрізаний GIF preview, коли Crabbox
media tooling доступний. Надавайте перевагу постійному шляху профілю viewer, налаштованому
через `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, бо повні Chrome profile
archives можуть перевищити secret-size limit GitHub. Для small/bootstrap profiles
workflow також може відновити base64 `.tgz` archive з
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Якщо жодне джерело профілю не
налаштоване, workflow все одно публікує детерміновані baseline/candidate
attachment screenshots і логує notice, що залогінений Discord Web witness
було пропущено.

Перший повний desktop transport primitive — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Він орендує або повторно використовує Crabbox desktop machine, синхронізує поточний checkout у
VM, запускає `pnpm openclaw qa slack` всередині цієї VM, відкриває Slack Web у VNC
browser, захоплює видимий desktop і копіює як Slack QA artifacts, так і
VNC screenshot назад у локальний output directory. Це перша форма Mantis,
де SUT OpenClaw gateway і browser обидва живуть в одній Linux desktop VM.

З `--gateway-setup` команда готує постійний disposable OpenClaw
home у `$HOME/.openclaw-mantis/slack-openclaw`, patch-ить конфігурацію Slack Socket Mode
для вибраного каналу, запускає `openclaw gateway run` на port
`38973` і залишає Chrome запущеним у VNC session. Це режим "залиш мені
Linux desktop зі Slack і запущеним екземпляром OpenClaw"; bot-to-bot Slack QA lane
залишається режимом за замовчуванням, коли `--gateway-setup` не вказано.

Обов’язкові inputs для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для remote model lane. Якщо локально встановлено лише
  `OPENAI_API_KEY`, Mantis мапить його на `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб Crabbox `OPENCLAW_*` env forwarding міг перенести його
  у VM.

З `--gateway-setup --credential-source convex` Mantis орендує Slack SUT
credential зі shared pool перед створенням VM і передає орендовані
channel id, Socket Mode app token і bot token як runtime env `OPENCLAW_MANTIS_SLACK_*`
всередину desktop. Це зберігає GitHub workflows тонкими: їм потрібен лише
Convex broker secret, а не raw Slack bot або app tokens.

Корисні Slack desktop flags:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже залогінився в Slack Web через VNC.
- `--gateway-setup` запускає постійний OpenClaw Slack gateway у VM замість запуску лише bot-to-bot QA lane.
- `--keep-lease` залишає gateway VM відкритою для VNC inspection після успіху; `--no-keep-lease` зупиняє її після збирання артефактів.
- `--slack-url <url>` відкриває конкретний Slack Web URL. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли SUT bot token доступний.
- `--slack-channel-id <id>` керує allowlist Slack channel, який використовується gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним Chrome profile всередині VM. За замовчуванням це `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тож ручний login у Slack Web переживає повторні запуски на тій самій lease.
- `--credential-source convex --credential-role ci` використовує shared credential pool замість прямих Slack env tokens.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються у Slack live lane.

GitHub smoke workflow — `Mantis Discord Smoke`. GitHub workflow до і після
для першого справжнього сценарію — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворити queued-only behavior.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checkout-ить workflow harness ref, збирає окремі baseline і candidate
worktrees, запускає `discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
Actions artifacts. Він також рендерить timeline HTML кожної lane у Crabbox
desktop browser і публікує ці VNC screenshots поряд із детермінованими
timeline PNG у PR comment. Той самий PR comment вбудовує легкі
motion-trimmed GIF previews, згенеровані `crabbox media preview`, посилається на
відповідні motion-trimmed MP4 clips і зберігає повні desktop MP4 files для глибокої
перевірки. Screenshots залишаються inline для швидкого review. Workflow збирає
Crabbox CLI з
`openclaw/crabbox` main, щоб він міг використовувати поточні desktop/browser lease flags
до того, як буде створено наступний Crabbox binary release.

`Mantis Scenario` — це загальна ручна точка входу. Вона приймає `scenario_id`,
`candidate_ref`, необов’язковий `baseline_ref` і необов’язковий `pr_number`, потім
dispatch-ить scenario-owned workflow. Wrapper навмисно тонкий:
scenario workflows і далі володіють своїми transport setup, credentials, VM class,
expected oracle і artifact manifest.

`Mantis Slack Desktop Smoke` є першим workflow Slack VM. Він перевіряє
довірене candidate ref в окремому worktree, орендує Linux-десктоп Crabbox,
запускає `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` для цього
кандидата, відкриває Slack Web у VNC-браузері, записує десктоп, генерує
motion-trimmed попередній перегляд за допомогою `crabbox media preview`,
завантажує повний каталог артефактів і, за бажанням, публікує inline-коментар із
доказами в цільовому PR. За замовчуванням для оренди десктопа використовується
AWS, а також доступний ручний ввід провайдера, щоб оператори могли перемкнутися
на Hetzner, коли ємність AWS повільна або недоступна. Використовуйте цю lane,
коли вам потрібен "Linux-десктоп зі Slack і запущеним claw", а не лише Slack
транскрипт між ботами.

Кожен сценарій публікації PR записує `mantis-evidence.json` поруч зі своїм
звітом. Ця схема є handoff між кодом сценарію та коментарями GitHub:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

Значення `path` артефактів є відносними до каталогу маніфесту. Значення
`targetPath` є відносними шляхами в каталозі публікації гілки `qa-artifacts`.
Публікатор відхиляє path traversal і пропускає записи, позначені
`"required": false`, коли необов'язкові попередні перегляди або відео недоступні.

Підтримувані типи артефактів:

- `timeline`: детермінований скриншот сценарію, зазвичай до/після.
- `desktopScreenshot`: скриншот VNC/браузерного десктопа.
- `motionPreview`: inline-анімований GIF, згенерований із запису десктопа.
- `motionClip`: motion-trimmed MP4, що прибирає статичний початок і кінець.
- `fullVideo`: повний MP4-запис для глибокої перевірки.
- `metadata`: JSON/log sidecar.
- `report`: Markdown-звіт.

Багаторазовий публікатор — `scripts/mantis/publish-pr-evidence.mjs`. Workflow
викликають його з маніфестом, цільовим PR, цільовим коренем `qa-artifacts`,
маркером коментаря, URL артефакту Actions, URL запуску та джерелом запиту. Він
копіює оголошені артефакти до гілки `qa-artifacts`, будує PR-коментар зі
спершу підсумком, inline-зображеннями/попередніми переглядами та посиланнями на
відео, а потім оновлює наявний marker-коментар або створює новий.

Ви також можете запустити виконання status-reactions напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише для коментарів до pull
request від користувачів із доступом write, maintain або admin, і розпізнає лише
запити Discord status-reaction. За замовчуванням він використовує відомий поганий
baseline ref і поточний SHA голови PR як кандидата. Мейнтейнери можуть
перевизначити будь-який ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на сценарії. Друга згодом зможе зіставляти PR
або issue з рекомендованими сценаріями Mantis на основі міток, змінених файлів і
знахідок рев'ю ClawSweeper.

## Життєвий Цикл Запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати профіль десктопа/браузера, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати live-транспорт, провайдера, модель і профіль браузера.
8. Запустити сценарій і захопити baseline-докази.
9. Зупинити Gateway і зберегти логи.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і захопити candidate-докази.
12. Порівняти результати oracle та візуальні докази.
13. Записати Markdown, JSON, логи, скриншоти та необов'язкові артефакти trace.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статус у PR або Discord.

Сценарій має вміти завершуватися помилкою двома різними способами:

- **Помилку відтворено**: baseline завершився невдачею очікуваним способом.
- **Збій harness**: налаштування середовища, облікові дані, Discord API, браузер
  або провайдер дали збій до того, як bug oracle став змістовним.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## Discord MVP

Перший сценарій має бути націлений на реакції статусу Discord у каналах guild,
де режим доставки відповіді джерела — `message_tool_only`.

Чому це добрий початковий сценарій Mantis:

- Він видимий у Discord як реакції на повідомлення-тригер.
- Він має сильний REST oracle через стан реакцій повідомлення Discord.
- Він перевіряє реальний OpenClaw Gateway, авторизацію Discord-бота, dispatch
  повідомлень, режим доставки відповіді джерела, стан реакцій статусу та
  життєвий цикл model turn.
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

Baseline-докази мають показувати реакцію підтвердження в черзі, але без
переходу життєвого циклу в режимі tool-only. Candidate-докази мають показувати,
що реакції статусу життєвого циклу виконуються, коли
`messages.statusReactions.enabled` явно встановлено в true.

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

Він налаштовує SUT із постійно ввімкненою обробкою guild, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` і явними реакціями статусу. Oracle опитує
реальне повідомлення-тригер Discord і очікує спостережену послідовність
`👀 -> 🤔 -> 👍`. Артефакти включають `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні Компоненти QA

Mantis має будуватися на наявному приватному QA stack, а не починати з нуля:

- `pnpm openclaw qa discord` вже запускає live Discord lane з driver і SUT
  ботами.
- Live transport runner вже записує звіти та артефакти observed-message у
  `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних live
  transport credentials.
- Сервіс керування браузером уже підтримує скриншоти, snapshots, headless
  managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus для transport-shaped тестування.

Перша реалізація Mantis може бути тонким before/after runner над цими
компонентами плюс один шар візуальних доказів.

## Модель Доказів

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

`mantis-summary.json` має бути машинно-читаним джерелом істини. Markdown-звіт
призначений для PR-коментарів і людського рев'ю.

Підсумок має включати:

- перевірені refs і SHA
- транспорт і scenario id
- провайдера машини та machine id або lease id
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи відтворилася помилка на baseline
- чи candidate її виправив
- шляхи артефактів
- очищені проблеми налаштування або cleanup

Скриншоти — це докази, а не секрети. Вони все одно потребують дисципліни
редагування: можуть з'являтися назви приватних каналів, імена користувачів або
вміст повідомлень. Для публічних PR надавайте перевагу посиланням на артефакти
GitHub Actions замість inline-зображень, доки історія редагування не стане
сильнішою.

## Браузер І VNC

Browser lane має два режими:

- **Headless automation**: типово для CI. Chrome запускається з увімкненим CDP, а
  Playwright або керування браузером OpenClaw захоплює скриншоти.
- **VNC rescue**: вмикається на тій самій VM, коли login, MFA, Discord
  anti-automation або візуальне налагодження потребує людини.

Профіль браузера спостерігача Discord має бути достатньо persistent, щоб не
входити в систему під час кожного запуску, але ізольованим від особистого стану
браузера. Профіль належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord із:

- run id
- scenario id
- провайдером машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний канал
операторів і пізніше перейти до окремого каналу Mantis.

## Машини

Для першої віддаленої реалізації Mantis має надавати перевагу AWS через
Crabbox. Crabbox дає нам прогріті машини, відстеження оренд, hydration, логи,
результати та cleanup. Якщо ємність AWS занадто повільна або недоступна, додайте
провайдера Hetzner за тим самим machine interface.

Мінімальні вимоги до VM:

- Linux із встановленим Chrome або Chromium, здатним працювати з десктопом
- CDP-доступ для автоматизації браузера
- VNC або noVNC для rescue
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU і пам'яті для одного OpenClaw Gateway, одного браузера та одного
  model run
- outbound-доступ до Discord, GitHub, model providers і credential broker

VM не має зберігати довготривалі сирі секрети поза очікуваними сховищами
облікових даних або профілю браузера.

## Секрети

Секрети зберігаються в secrets організації або репозиторію GitHub для віддалених
запусків і в локальному файлі секретів під контролем оператора для локальних
запусків.

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

У довгостроковій перспективі credential pool Convex має залишатися звичайним
джерелом live transport credentials. GitHub secrets bootstrap broker і fallback
lanes. Workflow Discord status-reactions зіставляє секрети Mantis Crabbox назад
із змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`, яких
очікує Crabbox CLI. Звичайні назви секретів GitHub `CRABBOX_*` залишаються
прийнятими як compatibility fallback.

Mantis runner ніколи не має друкувати:

- токени ботів Discord
- API-ключі провайдерів
- cookies браузера
- вміст auth profile
- паролі VNC
- сирі credential payloads

Публічні завантаження артефактів також мають редагувати цільові метадані
Discord, як-от bot, guild, channel і message ids. Workflow GitHub smoke вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або log, поверніть його після
збереження нового секрету.

## Артефакти GitHub І Коментарі PR

Робочі процеси Mantis мають завантажувати повний пакет доказів як короткочасний артефакт Actions. Коли робочий процес запускають для звіту про помилку або PR із виправленням, він також має публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і оновлювати або створювати коментар до цієї помилки чи PR із виправленням із вбудованими знімками екрана до/після. Не публікуйте основний доказ лише в загальному PR автоматизації QA. Сирі журнали, спостережені повідомлення та інші об'ємні докази залишаються в артефакті Actions.

Виробничі робочі процеси мають публікувати ці коментарі через GitHub App Mantis, а не через `github-actions[bot]`. Зберігайте ідентифікатор застосунку та приватний ключ як секрети GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`. Робочий процес використовує прихований маркер як ключ оновлення або створення, оновлює цей коментар, коли токен може його редагувати, і створює новий коментар від імені Mantis, коли старіший маркер, власником якого є бот, неможливо редагувати.

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

Коли запуск завершується невдало через збій інструментарію тестування, коментар має повідомляти саме це, а не натякати, що кандидат не пройшов.

## Нотатки щодо приватного розгортання

Приватне розгортання вже може мати Discord-застосунок Mantis. Повторно використайте цей застосунок замість створення ще одного, якщо він має правильні дозволи бота і його можна безпечно ротувати.

Задайте початковий канал сповіщень оператора через секрети або конфігурацію розгортання. Спочатку він може вказувати на наявний канал супровідників або операційний канал, а потім перейти до окремого каналу Mantis, коли такий з'явиться.

Не додавайте до цього документа ідентифікатори серверів, ідентифікатори каналів, токени ботів, браузерні cookies або паролі VNC. Зберігайте їх у секретах GitHub, брокері облікових даних або локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і title
- транспорт
- потрібні облікові дані
- політику baseline ref
- політику candidate ref
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний оракул baseline
- очікуваний оракул candidate
- цілі візуального захоплення
- бюджет часу очікування
- кроки очищення

Сценарії мають надавати перевагу малим типізованим оракулам:

- стан реакції Discord для помилок реакцій
- посилання на повідомлення Discord для помилок потоків
- thread ts Slack і стан API реакцій для помилок Slack
- ідентифікатори повідомлень електронної пошти та заголовки для помилок електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Перевірки за допомогою зору мають бути додатковими. Якщо API платформи може довести помилку, використовуйте API як оракул проходження/непроходження, а знімки екрана залишайте для людської впевненості.

## Розширення провайдерів

Після Discord той самий runner може додати:

- Slack: реакції, потоки, згадки застосунку, модальні вікна, завантаження файлів.
- Електронна пошта: автентифікація Gmail і потоки повідомлень за допомогою `gog`, коли конекторів недостатньо.
- WhatsApp: вхід через QR, повторна ідентифікація, доставлення повідомлень, медіа, реакції.
- Telegram: обмеження згадок у групах, команди, реакції там, де вони доступні.
- Matrix: зашифровані кімнати, зв'язки потоку або відповіді, відновлення після перезапуску.

Кожен транспорт повинен мати один дешевий smoke-сценарій і один або більше сценаріїв класу помилок. Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути драйвером, а який SUT, коли повторно використовується наявний бот Mantis?
- Чи має вхід у браузері спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис або лише доступні боту REST-докази для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування команди супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
