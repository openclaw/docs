---
read_when:
    - Створення або запуск живого візуального QA для помилок OpenClaw
    - Додавання перевірки до і після для запиту на злиття
    - Додавання сценаріїв для Discord, Slack, WhatsApp або інших транспортів у реальному часі
    - Налагодження QA-прогонів, які потребують знімків екрана, автоматизації браузера або доступу VNC
summary: Mantis — це система візуальної наскрізної верифікації для відтворення помилок OpenClaw на реальних транспортах, збирання доказів до й після та додавання артефактів до запитів на злиття.
title: Богомол
x-i18n:
    generated_at: "2026-05-06T04:53:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні реальне середовище виконання, реальний транспорт і видимий доказ. Вона запускає сценарій на відомому проблемному ref, збирає докази, запускає той самий сценарій на кандидатному ref і публікує порівняння як артефакти, які мейнтейнер може перевірити з PR або з локальної команди.

Mantis починає з Discord, тому що Discord дає нам першу високоцінну смугу: реальну авторизацію бота, реальні канали гільдії, реакції, потоки, нативні команди та браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Використовувати детермінований оракул, коли це можливо, наприклад читання реакції Discord через REST або перевірку стенограми каналу.
- Збирати знімки екрана, коли помилка має видиму поверхню UI.
- Запускати локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для порятунку через VNC, коли вхід, браузерна автоматизація або авторизація провайдера застрягає.
- Публікувати стислий статус у канал оператора Discord, коли запуск заблоковано, потрібна ручна допомога через VNC або запуск завершено.

## Нецілі

- Mantis не є заміною модульних тестів. Запуск Mantis зазвичай має перетворитися на менший регресійний тест після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI-гейтом. Він повільніший, використовує живі облікові дані й призначений для помилок, де важливе живе середовище.
- Mantis не має вимагати людини для нормальної роботи. Ручний VNC — це шлях порятунку, а не штатний сценарій.
- Mantis не зберігає сирі секрети в артефактах, логах, знімках екрана, Markdown-звітах або PR-коментарях.

## Власність

Mantis живе в QA-стеку OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними адаптерами, схемою доказів і локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами живого транспортного стенда, помічниками захоплення браузера та записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow і зберіганням артефактів.
- ClawSweeper володіє маршрутизацією GitHub-коментарів: розбором команд мейнтейнерів, запуском workflow і публікацією фінального PR-коментаря.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні агентне налаштування, налагодження або звітування про застряглий стан.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у Crabbox, а клей мейнтейнерського workflow у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє бота Discord, гільдію, канал, надсилання повідомлення, надсилання реакції та шлях артефактів:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний runner для до і після приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює від’єднані baseline- і candidate-worktree під вихідним каталогом, встановлює залежності, збирає кожен ref, запускає сценарій з `--allow-failures`, а потім записує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md`. Для першого сценарію Discord успішна перевірка означає, що статус baseline — `fail`, а статус candidate — `pass`.

Другий Discord-зонд до/після націлений на вкладення в потоках:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Цей сценарій публікує батьківське повідомлення за допомогою бота-драйвера, створює реальний потік Discord, викликає дію OpenClaw `message.thread-reply` з repo-local `filePath`, а потім опитує потік на відповідь SUT і назву файлу вкладення. Знімок екрана baseline показує відповідь без вкладення; знімок екрана candidate показує очікуване вкладення `mantis-thread-report.md`.

Перший примітив VM/браузера — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер усередині VNC-сесії, захоплює робочий стіл, витягує артефакти назад у локальний вихідний каталог і записує команду повторного підключення у звіт. Команда за замовчуванням використовує провайдера Hetzner, бо це перший провайдер із робочим покриттям desktop/VNC у смузі Mantis. Перевизначте його через `--provider`, `--crabbox-bin` або `OPENCLAW_MANTIS_CRABBOX_PROVIDER`, коли запускаєте проти іншого флоту Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` відтворює repo-local HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенеровану часову шкалу статус-реакцій Discord через реальний desktop Crabbox.
- `--browser-profile-dir <remote-path>` повторно використовує віддалений Chrome user-data-dir, щоб постійний desktop Mantis міг залишатися залогіненим між запусками. Використовуйте це для довгоживучого профілю переглядача Discord Web.
- `--browser-profile-archive-env <name>` відновлює base64-архів `.tgz` Chrome user-data-dir з названої змінної середовища перед запуском браузера. Використовуйте це для залогінених свідків, таких як Discord Web. Стандартна env var — `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` керує тривалістю MP4-захоплення. Використовуйте довшу тривалість для повільних залогінених вебзастосунків, яким потрібен час, щоб стабілізуватися.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну оренду відкритою для VNC-інспекції. Невдалі запуски за замовчуванням зберігають оренду, якщо її було створено, щоб оператор міг повторно підключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та строк життя оренди.

Для доказів Discord Web Mantis використовує окремий обліковий запис переглядача замість токена бота. Живий сценарій Discord API залишається оракулом: він створює реальний потік, надсилає SUT `thread-reply` і перевіряє вкладення через Discord REST. Коли встановлено `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарій також записує артефакт URL Discord Web. Коли встановлено `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, він залишає цей потік доступним достатньо довго, щоб залогінений браузер міг відкрити й записати його.

GitHub workflow відкриває URL потоку candidate у Discord Web, захоплює знімок екрана, записує MP4 і генерує обрізаний GIF-попередній перегляд, коли доступні медіаінструменти Crabbox. Надавайте перевагу постійному шляху профілю переглядача, налаштованому через `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, бо повні архіви профілю Chrome можуть перевищити ліміт розміру секретів GitHub. Для малих/bootstrap-профілів workflow також може відновити base64-архів `.tgz` з `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Якщо жодне джерело профілю не налаштоване, workflow усе одно публікує детерміновані знімки екрана вкладень baseline/candidate і логує повідомлення, що залогіненого свідка Discord Web пропущено.

Перший повний примітив desktop-транспорту — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Він орендує або повторно використовує desktop-машину Crabbox, синхронізує поточний checkout у VM, запускає `pnpm openclaw qa slack` усередині цієї VM, відкриває Slack Web у VNC-браузері, захоплює видимий робочий стіл і копіює як артефакти Slack QA, так і VNC-знімок екрана назад у локальний вихідний каталог. Це перша форма Mantis, де SUT OpenClaw Gateway і браузер обидва живуть усередині однієї Linux desktop VM.

З `--gateway-setup` команда готує постійний одноразовий OpenClaw home у `$HOME/.openclaw-mantis/slack-openclaw`, патчить конфігурацію Slack Socket Mode для вибраного каналу, запускає `openclaw gateway run` на порту `38973` і залишає Chrome запущеним у VNC-сесії. Це режим «залиши мені Linux desktop зі Slack і запущеним claw»; bot-to-bot смуга Slack QA залишається стандартною, коли `--gateway-setup` опущено.

Обов’язкові вхідні дані для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленої модельної смуги. Якщо локально встановлено лише `OPENAI_API_KEY`, Mantis мапить його на `OPENCLAW_LIVE_OPENAI_KEY` перед викликом Crabbox, щоб форвардинг env `OPENCLAW_*` у Crabbox міг передати його у VM.

З `--gateway-setup --credential-source convex` Mantis орендує облікові дані Slack SUT зі спільного пулу перед створенням VM і передає орендований channel id, Socket Mode app token і bot token як runtime env `OPENCLAW_MANTIS_SLACK_*` усередині desktop. Це тримає GitHub workflows тонкими: їм потрібен лише секрет брокера Convex, а не сирі Slack bot або app tokens.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже залогінився в Slack Web через VNC.
- `--gateway-setup` запускає постійний OpenClaw Slack Gateway у VM замість лише bot-to-bot смуги QA.
- `--keep-lease` залишає gateway VM відкритою для VNC-інспекції після успіху; `--no-keep-lease` зупиняє її після збирання артефактів.
- `--slack-url <url>` відкриває конкретний URL Slack Web. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний SUT bot token.
- `--slack-channel-id <id>` керує allowlist каналу Slack, який використовується gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome усередині VM. Типове значення — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний вхід у Slack Web зберігається для повторних запусків на тій самій оренді.
- `--credential-source convex --credential-role ci` використовує спільний пул облікових даних замість прямих Slack env tokens.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються до живої смуги Slack.

GitHub smoke workflow — `Mantis Discord Smoke`. GitHub workflow до і після для першого реального сценарію — `Mantis Discord Status Reactions`. Він приймає:

- `baseline_ref`: ref, який очікувано відтворює queued-only поведінку.
- `candidate_ref`: ref, який очікувано показує `queued -> thinking -> done`.

Він checkout-ить ref harness workflow, збирає окремі baseline- і candidate-worktree, запускає `discord-status-reactions-tool-only` проти кожного worktree і завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як артефакти Actions. Він також відтворює HTML часової шкали кожної смуги в desktop-браузері Crabbox і публікує ці VNC-знімки екрана поруч із детермінованими PNG часової шкали в PR-коментарі. Той самий PR-коментар вбудовує легкі GIF-попередні перегляди з обрізаним рухом, згенеровані `crabbox media preview`, посилається на відповідні MP4-кліпи з обрізаним рухом і зберігає повні desktop MP4-файли для глибокої інспекції. Знімки екрана залишаються inline для швидкого перегляду. Workflow збирає Crabbox CLI з main `openclaw/crabbox`, щоб мати змогу використовувати поточні прапорці desktop/browser lease до наступного релізу бінарника Crabbox.

`Mantis Scenario` — це універсальна ручна точка входу. Вона приймає `scenario_id`, `candidate_ref`, необов’язковий `baseline_ref` і необов’язковий `pr_number`, а потім dispatch-ить workflow, яким володіє сценарій. Обгортка навмисно тонка: сценарні workflows усе ще володіють своїм налаштуванням транспорту, обліковими даними, класом VM, очікуваним оракулом і маніфестом артефактів.

`Mantis Slack Desktop Smoke` — це перший workflow Slack VM. Він перевіряє
довірений ref кандидатної версії в окремому робочому дереві, орендує робочий
стіл Linux у Crabbox, запускає `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` для цієї
кандидатної версії, відкриває Slack Web у браузері VNC, записує робочий стіл,
генерує обрізаний за рухом попередній перегляд за допомогою `crabbox media preview`, завантажує повний каталог артефактів
і, за потреби, публікує вбудований коментар із доказами в цільовому PR.
За замовчуванням для оренди робочого стола використовується AWS, а також доступний ручний ввід провайдера, щоб
оператори могли перейти на Hetzner, коли ресурси AWS повільні або недоступні. Використовуйте
цей lane, коли вам потрібен «робочий стіл Linux зі Slack і запущеним claw», а не
лише transcript Slack між ботами.

Кожен сценарій публікації PR записує `mantis-evidence.json` поруч зі своїм звітом.
Ця схема є передаванням між кодом сценарію та коментарями GitHub:

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

Значення `path` артефактів є відносними до каталогу маніфесту. Значення `targetPath`
є відносними шляхами в каталозі публікації гілки `qa-artifacts`.
Публікатор відхиляє обхід шляхів і пропускає записи, позначені
`"required": false`, коли необов’язкові попередні перегляди або відео недоступні.

Підтримувані типи артефактів:

- `timeline`: детермінований screenshot сценарію, зазвичай до/після.
- `desktopScreenshot`: screenshot робочого стола VNC/браузера.
- `motionPreview`: вбудований анімований GIF, згенерований із запису робочого стола.
- `motionClip`: обрізаний за рухом MP4, який видаляє статичний початок і кінець.
- `fullVideo`: повний запис MP4 для глибокої перевірки.
- `metadata`: супровідний JSON/лог.
- `report`: звіт Markdown.

Багаторазовий публікатор — `scripts/mantis/publish-pr-evidence.mjs`. Workflows
викликають його з маніфестом, цільовим PR, цільовим коренем `qa-artifacts`, маркером коментаря,
URL артефакта Actions, URL запуску та джерелом запиту. Він копіює оголошені артефакти
до гілки `qa-artifacts`, будує PR-коментар із підсумком на початку, вбудованими
зображеннями/попередніми переглядами та пов’язаними відео, а потім оновлює наявний коментар із маркером або
створює новий.

Ви також можете запустити status-reactions безпосередньо з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише для коментарів до pull request
від користувачів із доступом write, maintain або admin, і розпізнає
лише запити Discord status-reaction. За замовчуванням він використовує відомий поганий baseline ref
і поточний SHA голови PR як кандидатну версію. Maintainers можуть перевизначити будь-який
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
висновків review ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати профіль робочого стола/браузера, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності та зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати live transport, провайдера, model і профіль браузера.
8. Запустити сценарій і зібрати baseline-докази.
9. Зупинити Gateway і зберегти логи.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і зібрати candidate-докази.
12. Порівняти результати oracle і візуальні докази.
13. Записати Markdown, JSON, логи, screenshots і необов’язкові trace-артефакти.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статусний message у PR або Discord.

Сценарій має бути здатним завершитися невдачею двома різними способами:

- **Баг відтворено**: baseline завершився невдачею очікуваним способом.
- **Збій harness**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер завершилися невдачею до того, як bug oracle став змістовним.

Фінальний звіт має розділяти ці випадки, щоб maintainers не плутали нестабільне
середовище з поведінкою product.

## Discord MVP

Перший сценарій має бути націлений на реакції status у Discord в каналах guild, де
режим доставлення source reply — `message_tool_only`.

Чому це хороший початковий Mantis:

- Це видно в Discord як reactions на повідомленні, що запустило сценарій.
- Він має сильний REST oracle через стан reactions повідомлення Discord.
- Він перевіряє реальний OpenClaw Gateway, Discord bot auth, dispatch повідомлень,
  режим доставлення source reply, стан status reaction і життєвий цикл model turn.
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

Baseline-докази мають показувати reaction підтвердження queued, але без
переходу життєвого циклу в режимі tool-only. Candidate-докази мають показувати, що lifecycle
status reactions запускаються, коли `messages.statusReactions.enabled` явно
має значення true.

Виконуваний перший зріз — це opt-in live QA scenario Discord:

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
опитує реальне повідомлення Discord, що запустило сценарій, і очікує спостережувану послідовність
`👀 -> 🤔 -> 👍`. Артефакти включають `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному приватному стеку QA, а не починати
з нуля:

- `pnpm openclaw qa discord` вже запускає live Discord lane з driver і
  SUT bots.
- Наявний live transport runner вже записує звіти та артефакти observed-message
  у `.artifacts/qa-e2e/`.
- Convex credential leases вже надають ексклюзивний доступ до спільних live
  transport credentials.
- Browser control service вже підтримує screenshots, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus для transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner над цими
частинами плюс один шар візуальних доказів.

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
Markdown призначений для PR-коментарів і людського review.

Підсумок має включати:

- протестовані refs і SHAs
- transport і scenario id
- machine provider і machine id або lease id
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи баг відтворився на baseline
- чи candidate його виправив
- шляхи артефактів
- санітизовані проблеми налаштування або cleanup

Screenshots — це докази, а не секрети. Вони все одно потребують дисципліни редагування:
можуть з’явитися приватні назви каналів, імена користувачів або вміст повідомлень. Для публічних PR
надавайте перевагу посиланням на артефакти GitHub Actions замість вбудованих images, доки історія редагування
не стане міцнішою.

## Браузер і VNC

Browser lane має два режими:

- **Headless automation**: стандартно для CI. Chrome запускається з увімкненим CDP, а
  Playwright або OpenClaw browser control збирає screenshots.
- **VNC rescue**: увімкнено на тій самій VM, коли login, MFA, Discord anti-automation
  або visual debugging потребує людини.

Профіль observer browser Discord має бути достатньо persistent, щоб уникати
login для кожного запуску, але ізольованим від особистого стану browser. Профіль
належить до machine pool Mantis, а не до laptop розробника.

Коли Mantis застрягає, він публікує status message у Discord з:

- run id
- scenario id
- machine provider
- artifact directory
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким blocker text

Перше приватне розгортання може публікувати ці повідомлення в наявний operator
channel і пізніше перейти до окремого Mantis channel.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, lease tracking, hydration, logs, results і
cleanup. Якщо ресурси AWS занадто повільні або недоступні, додайте Hetzner provider
за тим самим machine interface.

Мінімальні вимоги до VM:

- Linux з desktop-capable інсталяцією Chrome або Chromium
- CDP access для browser automation
- VNC або noVNC для rescue
- Node 22 і pnpm
- OpenClaw checkout і dependency cache
- Playwright Chromium browser cache, коли використовується Playwright
- достатньо CPU і memory для одного OpenClaw Gateway, одного browser і одного model run
- outbound access до Discord, GitHub, model providers і credential broker

VM не має зберігати довготривалі raw secrets поза очікуваними сховищами credential або
browser profile.

## Секрети

Секрети живуть у GitHub organization або repository secrets для віддалених запусків і в
локальному файлі секретів під контролем оператора для локальних запусків.

Рекомендовані назви секретів:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для публічних завантажень GitHub artifact
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

У довгостроковій перспективі Convex credential pool має залишатися звичайним джерелом для live
transport credentials. GitHub secrets bootstrap broker і fallback lanes.
Workflow Discord status-reactions зіставляє Mantis Crabbox secrets назад із
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
яких очікує Crabbox CLI. Звичайні назви GitHub secrets `CRABBOX_*` залишаються
прийнятими як compatibility fallback.

Mantis runner ніколи не має друкувати:

- Discord bot tokens
- provider API keys
- browser cookies
- вміст auth profile
- VNC passwords
- raw credential payloads

Публічні завантаження артефактів також мають редагувати metadata цілей Discord, як-от bot,
guild, channel і message ids. GitHub smoke workflow вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо token випадково вставлено в issue, PR, chat або log, rotate його
після збереження нового secret.

## GitHub artifacts і PR comments

Робочі процеси Mantis мають завантажувати повний пакет доказів як короткостроковий артефакт Actions. Коли робочий процес запускається для звіту про помилку або PR з виправленням, він також має публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і додавати або оновлювати коментар у цьому звіті про помилку чи PR з виправленням із вбудованими знімками екрана до/після. Не публікуйте основний доказ лише в загальному PR автоматизації QA. Сирі журнали, спостережені повідомлення та інші об'ємні докази залишаються в артефакті Actions.

Виробничі робочі процеси мають публікувати ці коментарі через Mantis GitHub App, а не через `github-actions[bot]`. Зберігайте id застосунку та приватний ключ як секрети GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`. Робочий процес використовує прихований маркер як ключ додавання або оновлення, оновлює цей коментар, коли токен може його редагувати, і створює новий коментар від імені Mantis, коли старіший маркер, створений ботом, не можна відредагувати.

Коментар у PR має бути коротким і візуальним:

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

Коли запуск завершується невдало через збій стенда, коментар має повідомляти саме це, а не натякати, що кандидат завершився невдало.

## Примітки щодо приватного розгортання

У приватному розгортанні вже може бути застосунок Mantis Discord. Повторно використайте цей застосунок замість створення ще одного, якщо він має потрібні дозволи бота і його можна безпечно ротувати.

Задайте початковий канал сповіщень оператора через секрети або конфігурацію розгортання. Спочатку він може вказувати на наявний канал супровідників або операційний канал, а потім перейти до окремого каналу Mantis, коли такий з'явиться.

Не додавайте в цей документ id гільдій, id каналів, токени ботів, cookie браузера або паролі VNC. Зберігайте їх у секретах GitHub, брокері облікових даних або локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і назву
- транспорт
- необхідні облікові дані
- політику ref базової версії
- політику ref кандидата
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний оракул базової версії
- очікуваний оракул кандидата
- цілі візуального захоплення
- бюджет таймауту
- кроки очищення

Сценарії мають надавати перевагу малим типізованим оракулам:

- стан реакції Discord для помилок реакцій
- посилання на повідомлення Discord для помилок тредингу
- ts треду Slack і стан API реакцій для помилок Slack
- id повідомлень електронної пошти та заголовки для помилок електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Перевірки бачення мають бути додатковими. Якщо API платформи може довести помилку, використовуйте API як оракул успішності/невдачі, а знімки екрана залишайте для впевненості людини.

## Розширення провайдерів

Після Discord той самий runner може додати:

- Slack: реакції, треди, згадки застосунку, модальні вікна, завантаження файлів.
- Електронна пошта: автентифікація Gmail і трединг повідомлень за допомогою `gog`, коли конекторів недостатньо.
- WhatsApp: вхід через QR, повторна ідентифікація, доставлення повідомлень, медіа, реакції.
- Telegram: обмеження згадок у групах, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, зв'язки тредів або відповідей, відновлення після перезапуску.

Кожен транспорт має мати один дешевий smoke-сценарій і один або кілька сценаріїв класів помилок. Дорогі візуальні сценарії мають залишатися опціональними.

## Відкриті питання

- Який бот Discord має бути драйвером, а який SUT, коли наявний бот Mantis використовується повторно?
- Чи має вхід браузера спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис або лише доступні боту докази REST для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування команди супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
