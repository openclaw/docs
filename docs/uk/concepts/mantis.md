---
read_when:
    - Збирання або запуск візуального контролю якості в реальному часі для помилок OpenClaw
    - Додавання перевірки до та після для запиту на внесення змін
    - Додавання сценаріїв для Discord, Slack, WhatsApp або інших реальних транспортів
    - Налагодження QA-прогонів, яким потрібні знімки екрана, автоматизація браузера або доступ VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на живих транспортах, фіксації доказів до та після, а також прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-05T10:24:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f845ad3f19b88a9a398b43bd8bdfda8c7c2043733e30e7fcef1bf6ee0343c65
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для помилок, яким потрібні справжнє
середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій для відомого
несправного ref, збирає докази, запускає той самий сценарій для кандидатного ref і
публікує порівняння як артефакти, які супровідник може перевірити з PR або
з локальної команди.

Mantis починає з Discord, бо Discord дає нам першу лінію високої цінності:
справжню автентифікацію бота, справжні канали guild, реакції, треди, нативні команди та
браузерний UI, де люди можуть візуально підтвердити те, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Використовувати детермінований оракул, коли це можливо, наприклад читання реакції через Discord REST
  або перевірку транскрипту каналу.
- Збирати скриншоти, коли помилка має видиму поверхню UI.
- Запускати локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для аварійного відновлення через VNC, коли вхід, автоматизація браузера або
  автентифікація провайдера застрягає.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблокований,
  потребує ручної допомоги через VNC або завершується.

## Нецілі

- Mantis не замінює модульні тести. Запуск Mantis зазвичай має стати
  меншим регресійним тестом після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI-гейтом. Він повільніший, використовує живі облікові дані та
  призначений для помилок, де важливе живе середовище.
- Mantis не повинен вимагати людини для звичайної роботи. Ручний VNC — це шлях
  аварійного відновлення, а не штатний сценарій.
- Mantis не зберігає необроблені секрети в артефактах, логах, скриншотах, Markdown
  звітах або коментарях PR.

## Власність

Mantis живе в стеку QA OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними адаптерами, схемою доказів і
  локальним CLI у `pnpm openclaw qa mantis`.
- QA Lab володіє частинами живого транспортного harness, допоміжними засобами захоплення браузера та
  записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow і зберіганням артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: розбором команд супровідників,
  запуском workflow і публікацією фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні агентне налаштування,
  налагодження або звітування про застряглий стан.

Ця межа тримає транспортні знання в OpenClaw, планування машин у
Crabbox, а клей workflow супровідників у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє бота Discord, guild, канал, надсилання повідомлення,
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

Runner створює від'єднані базовий і кандидатний worktree у вихідному
каталозі, встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, а потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка
означає, що статус baseline — `fail`, а статус candidate — `pass`.

Перший примітив VM/браузера — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер усередині
сесії VNC, захоплює desktop, завантажує артефакти назад у локальний вихідний
каталог і записує команду повторного підключення у звіт. Команда за замовчуванням
використовує провайдера Hetzner, бо це перший провайдер із робочим desktop/VNC
покриттям у лінії Mantis. Перевизначте його через `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` під час запуску проти іншого fleet Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенерований timeline статус-реакцій Discord через справжній desktop Crabbox.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну оренду відкритою для перевірки через VNC. Невдалі запуски за замовчуванням залишають оренду, коли її було створено, щоб оператор міг повторно підключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та час життя оренди.

Перший повний примітив desktop-транспорту — Slack desktop smoke:

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
VNC-скриншот назад у локальний вихідний каталог. Це перша форма Mantis,
де SUT Gateway OpenClaw і браузер обидва живуть усередині однієї
Linux desktop VM.

З `--gateway-setup` команда готує постійний одноразовий home OpenClaw
у `$HOME/.openclaw-mantis/slack-openclaw`, виправляє конфігурацію Slack Socket Mode
для вибраного каналу, запускає `openclaw gateway run` на порту
`38973` і залишає Chrome запущеним у сесії VNC. Це режим "залиш мені
Linux desktop зі Slack і запущеним claw"; лінія Slack QA бот-до-бота
лишається типовою, коли `--gateway-setup` пропущено.

Обов'язкові вхідні дані для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленої модельної лінії. Якщо локально встановлено лише
  `OPENAI_API_KEY`, Mantis зіставляє його з `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб перенаправлення env `OPENCLAW_*` у Crabbox могло передати його
  у VM.

З `--gateway-setup --credential-source convex` Mantis орендує облікові дані Slack SUT
із спільного пулу перед створенням VM і передає орендований id каналу,
app token Socket Mode і bot token як runtime env `OPENCLAW_MANTIS_SLACK_*`
усередині desktop. Це тримає workflow GitHub тонкими: їм потрібен лише
секрет Convex broker, а не необроблені bot token або app token Slack.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже увійшов у Slack Web через VNC.
- `--gateway-setup` запускає постійний Slack Gateway OpenClaw у VM замість запуску лише лінії QA бот-до-бота.
- `--keep-lease` залишає Gateway VM відкритою для перевірки через VNC після успіху; `--no-keep-lease` зупиняє її після збирання артефактів.
- `--slack-url <url>` відкриває конкретний URL Slack Web. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний bot token SUT.
- `--slack-channel-id <id>` керує allowlist каналу Slack, який використовується налаштуванням Gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome усередині VM. Типове значення — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тож ручний вхід у Slack Web зберігається між повторними запусками на тій самій оренді.
- `--credential-source convex --credential-role ci` використовує спільний пул облікових даних замість прямих env token Slack.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються в живу лінію Slack.

GitHub smoke workflow — це `Mantis Discord Smoke`. GitHub workflow до і після
для першого справжнього сценарію — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворити поведінку лише queued.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checkout-ить ref harness workflow, збирає окремі базовий і кандидатний
worktree, запускає `discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
артефакти Actions. Він також рендерить timeline HTML кожної лінії у desktop-браузері
Crabbox і публікує ці VNC-скриншоти поруч із детермінованими
PNG timeline у коментарі PR. Той самий коментар PR вбудовує легкі
GIF-прев'ю з обрізанням руху, згенеровані `crabbox media preview`, посилається на
відповідні MP4-кліпи з обрізанням руху та зберігає повні MP4-файли desktop для глибокої
перевірки. Скриншоти лишаються inline для швидкого перегляду. Workflow збирає
Crabbox CLI з
`openclaw/crabbox` main, щоб використовувати поточні прапорці оренди desktop/browser
до випуску наступного бінарного релізу Crabbox.

`Mantis Scenario` — це загальна ручна точка входу. Вона приймає `scenario_id`,
`candidate_ref`, необов'язковий `baseline_ref` і необов'язковий `pr_number`, а потім
запускає workflow, власником якого є сценарій. Обгортка навмисно тонка:
workflow сценаріїв усе ще володіють своїм транспортним налаштуванням, обліковими даними, класом VM,
очікуваним оракулом і маніфестом артефактів.

`Mantis Slack Desktop Smoke` — це перший Slack VM workflow. Він checkout-ить
довірений candidate ref в окремий worktree, орендує Linux desktop Crabbox,
запускає `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` проти цього
candidate, відкриває Slack Web у VNC браузері, записує desktop, генерує
прев'ю з обрізанням руху через `crabbox media preview`, завантажує повний каталог
артефактів і, за потреби, публікує inline-коментар доказів у цільовому PR.
За замовчуванням він використовує AWS для desktop-оренди і надає ручний input провайдера, щоб
оператори могли перемкнутися на Hetzner, коли потужність AWS повільна або недоступна. Використовуйте
цю лінію, коли потрібен "Linux desktop зі Slack і запущеним claw" замість
лише Slack-транскрипту бот-до-бота.

Кожен сценарій, що публікується в PR, записує `mantis-evidence.json` поруч зі своїм звітом.
Ця схема є передачею між кодом сценарію і коментарями GitHub:

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
є відносними шляхами під каталогом публікації гілки `qa-artifacts`.
Publisher відхиляє path traversal і пропускає записи, позначені
`"required": false`, коли необов'язкові прев'ю або відео недоступні.

Підтримувані типи артефактів:

- `timeline`: детермінований скриншот сценарію, зазвичай до/після.
- `desktopScreenshot`: скриншот VNC/browser desktop.
- `motionPreview`: inline-анімований GIF, згенерований із запису desktop.
- `motionClip`: MP4 з обрізанням руху, який видаляє статичний початок і хвіст.
- `fullVideo`: повний MP4-запис для глибокої перевірки.
- `metadata`: JSON/log sidecar.
- `report`: Markdown-звіт.

Багаторазовий публікатор — `scripts/mantis/publish-pr-evidence.mjs`. Робочі процеси
викликають його з маніфестом, цільовим PR, цільовим коренем `qa-artifacts`,
маркером коментаря, URL артефакту Actions, URL запуску та джерелом запиту. Він
копіює оголошені артефакти до гілки `qa-artifacts`, формує PR-коментар зі
зведенням на початку, вбудованими зображеннями/попередніми переглядами та
посиланнями на відео, а потім оновлює наявний коментар із маркером або створює
новий.

Також можна запустити перевірку реакцій статусу напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментарем навмисно вузький. Він запускається лише для коментарів до pull
request від користувачів із доступом write, maintain або admin і розпізнає лише
запити реакцій статусу Discord. Типово він використовує відомий поганий baseline
ref і поточний SHA голови PR як candidate. Мейнтейнери можуть перевизначити
будь-який ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis на основі міток, змінених файлів і
знахідок ревʼю ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати профіль робочого столу/браузера, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для baseline ref.
5. Встановити залежності й зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованою директорією стану.
7. Налаштувати живий транспорт, провайдера, модель і профіль браузера.
8. Запустити сценарій і зібрати докази baseline.
9. Зупинити Gateway і зберегти журнали.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і зібрати докази candidate.
12. Порівняти результати оракула та візуальні докази.
13. Записати Markdown, JSON, журнали, знімки екрана й необовʼязкові trace-артефакти.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статусний допис у PR або Discord.

Сценарій має вміти завершуватися з помилкою двома різними способами:

- **Баг відтворено**: baseline впав очікуваним способом.
- **Збій harness**: налаштування середовища, облікові дані, Discord API, браузер
  або провайдер впали до того, як оракул бага мав зміст.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## Discord MVP

Перший сценарій має бути спрямований на реакції статусу Discord у каналах guild,
де режим доставки відповіді джерела — `message_tool_only`.

Чому це хороший початковий сценарій Mantis:

- Він видимий у Discord як реакції на повідомленні, що запускає сценарій.
- Він має сильний REST-оракул через стан реакцій повідомлення Discord.
- Він перевіряє реальний OpenClaw Gateway, автентифікацію бота Discord,
  надсилання повідомлень, режим доставки відповіді джерела, стан реакцій статусу
  та життєвий цикл ходу моделі.
- Він достатньо вузький, щоб перша реалізація лишалася чесною.

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

Докази baseline мають показувати поставлену в чергу реакцію підтвердження, але
без переходу життєвого циклу в режимі лише tool. Докази candidate мають
показувати, що реакції статусу життєвого циклу запускаються, коли
`messages.statusReactions.enabled` явно дорівнює true.

Перший виконуваний зріз — opt-in живий QA-сценарій Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Він налаштовує SUT із постійно ввімкненою обробкою guild,
`visibleReplies: "message_tool"`, `ackReaction: "👀"` і явними реакціями
статусу. Оракул опитує реальне повідомлення Discord, що запускає сценарій, і
очікує спостережувану послідовність `👀 -> 🤔 -> 👍`. Артефакти містять
`discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному приватному стеку QA, а не починати з нуля:

- `pnpm openclaw qa discord` уже запускає живий Discord lane з driver і SUT
  ботами.
- Живий transport runner уже записує звіти й артефакти спостережених повідомлень
  у `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних
  живих transport credentials.
- Сервіс керування браузером уже підтримує знімки екрана, snapshots, керовані
  headless-профілі та віддалені CDP-профілі.
- QA Lab уже має debugger UI і bus для тестування у формі транспорту.

Перша реалізація Mantis може бути тонким runner до/після поверх цих частин плюс
один шар візуальних доказів.

## Модель доказів

Кожен запуск записує стабільну директорію артефактів:

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
призначений для коментарів PR і людського ревʼю.

Зведення має містити:

- перевірені refs і SHA
- транспорт і scenario id
- провайдера машини та machine id або lease id
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи баг відтворився на baseline
- чи candidate виправив його
- шляхи артефактів
- санітизовані проблеми налаштування або cleanup

Знімки екрана — це докази, а не секрети. Вони все одно потребують дисципліни
редагування: можуть зʼявлятися назви приватних каналів, імена користувачів або
вміст повідомлень. Для публічних PR віддавайте перевагу посиланням на артефакти
GitHub Actions замість вбудованих зображень, доки історія редагування не стане
міцнішою.

## Браузер і VNC

Браузерний lane має два режими:

- **Headless-автоматизація**: типовий режим для CI. Chrome запускається з
  увімкненим CDP, а Playwright або керування браузером OpenClaw збирає знімки
  екрана.
- **VNC-рятування**: вмикається на тій самій VM, коли login, MFA,
  антиавтоматизація Discord або візуальне налагодження потребує людини.

Профіль браузера-спостерігача Discord має бути достатньо сталим, щоб не
виконувати вхід для кожного запуску, але ізольованим від особистого стану
браузера. Профіль належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord із:

- run id
- scenario id
- провайдером машини
- директорією артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний канал
операторів і згодом перейти до виділеного каналу Mantis.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, відстеження оренд, hydration, журнали,
результати й cleanup. Якщо потужності AWS надто повільні або недоступні, додайте
провайдера Hetzner за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux із Chrome або Chromium, придатним для робочого столу
- доступ CDP для браузерної автоматизації
- VNC або noVNC для рятування
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU й памʼяті для одного OpenClaw Gateway, одного браузера та одного
  запуску моделі
- вихідний доступ до Discord, GitHub, провайдерів моделей і брокера облікових
  даних

VM не має зберігати довготривалі сирі секрети поза очікуваними сховищами
облікових даних або профілів браузера.

## Секрети

Секрети зберігаються в секретах організації або репозиторію GitHub для
віддалених запусків і в локальному файлі секретів під контролем оператора для
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

У довгостроковій перспективі пул облікових даних Convex має залишатися звичним
джерелом для живих transport credentials. Секрети GitHub bootstrap-лять брокер і
fallback lanes. Робочий процес реакцій статусу Discord зіставляє секрети Mantis
Crabbox назад зі змінними середовища `CRABBOX_COORDINATOR` і
`CRABBOX_COORDINATOR_TOKEN`, яких очікує Crabbox CLI. Звичайні назви секретів
GitHub `CRABBOX_*` залишаються прийнятими як fallback сумісності.

Mantis runner ніколи не має друкувати:

- токени ботів Discord
- API-ключі провайдерів
- cookies браузера
- вміст auth profile
- паролі VNC
- сирі payload облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані Discord,
такі як id бота, guild, каналу й повідомлення. GitHub smoke workflow вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, поверніть його після
того, як новий секрет буде збережено.

## Артефакти GitHub і коментарі PR

Робочі процеси Mantis мають завантажувати повний набір доказів як короткоживучий
артефакт Actions. Коли робочий процес запускається для звіту про баг або PR з
виправленням, він також має публікувати відредаговані PNG-знімки екрана до гілки
`qa-artifacts` і upsert-коментар у цьому багу або PR з виправленням із
вбудованими знімками до/після. Не публікуйте основний доказ лише в загальному PR
автоматизації QA. Сирі журнали, спостережені повідомлення та інші обʼємні докази
залишаються в артефакті Actions.

Production workflows мають публікувати ці коментарі через Mantis GitHub App, а
не через `github-actions[bot]`. Збережіть app id і приватний ключ як секрети
GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`. Робочий
процес використовує прихований маркер як ключ upsert, оновлює цей коментар, коли
токен може його редагувати, і створює новий коментар, що належить Mantis, коли
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

Коли запуск падає через збій harness, коментар має сказати саме це, а не
натякати, що candidate впав.

## Нотатки приватного розгортання

Приватне розгортання може вже мати застосунок Discord для Mantis. Повторно
використайте цей застосунок замість створення іншого, якщо він має правильні
дозволи бота і його можна безпечно ротувати.

Налаштуйте початковий канал сповіщень оператора через секрети або конфігурацію
розгортання. Спочатку він може вказувати на наявний канал мейнтейнерів або
операцій, а потім перейти до виділеного каналу Mantis, коли такий зʼявиться.

Не додавайте guild ids, channel ids, токени ботів, cookies браузера або паролі
VNC до цього документа. Зберігайте їх у секретах GitHub, брокері облікових даних
або локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і заголовок
- транспорт
- облікові дані, що вимагаються
- політика базового ref
- політика кандидатного ref
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний базовий оракул
- очікуваний кандидатний оракул
- цілі візуального захоплення
- бюджет тайм-ауту
- кроки очищення

Сценарії мають віддавати перевагу невеликим типізованим оракулам:

- стан реакцій Discord для помилок реакцій
- посилання на повідомлення Discord для помилок потоків
- thread ts Slack і стан API реакцій для помилок Slack
- ідентифікатори повідомлень електронної пошти та заголовки для помилок електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним результатом

Перевірки зору мають бути додатковими. Якщо API платформи може довести помилку, використовуйте
API як оракул проходження/непроходження, а знімки екрана залишайте для впевненості людини.

## Розширення провайдерів

Після Discord той самий runner може додати:

- Slack: реакції, потоки, згадки застосунку, модальні вікна, завантаження файлів.
- Електронна пошта: автентифікація Gmail і потоки повідомлень за допомогою `gog`, коли конекторів
  недостатньо.
- WhatsApp: вхід через QR, повторна ідентифікація, доставлення повідомлень, медіа, реакції.
- Telegram: обмеження згадок у групах, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, зв’язки потоків або відповідей, відновлення після перезапуску.

Кожен транспорт повинен мати один дешевий smoke-сценарій і один або кілька сценаріїв
класів помилок. Дорогі візуальні сценарії мають залишатися опційними.

## Відкриті питання

- Який бот Discord має бути драйвером, а який має бути SUT, коли повторно
  використовується наявний бот Mantis?
- Чи має вхід браузера спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис
  або лише доступні для читання ботом REST-докази для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди від супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
