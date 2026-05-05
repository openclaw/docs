---
read_when:
    - Створення або запуск візуальної QA-перевірки в реальному часі для помилок OpenClaw
    - Додавання перевірки до й після для запиту на злиття
    - Додавання сценаріїв реального транспорту для Discord, Slack, WhatsApp або інших
    - Налагодження QA-запусків, для яких потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це візуальна система наскрізної перевірки для відтворення помилок OpenClaw на живих транспортних каналах, збирання доказів до й після та додавання артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-05T09:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2db0e0ba75da831f29cc5312e9468db7d3a91d97f0b7a8c8f30c51bd128d148c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для багів, яким потрібні реальне
середовище виконання, реальний транспорт і видимий доказ. Вона запускає сценарій
на відомому поганому ref, збирає докази, запускає той самий сценарій на
кандидатному ref і публікує порівняння як артефакти, які мейнтейнер може
переглянути з PR або з локальної команди.

Mantis починає з Discord, тому що Discord дає нам перший цінний напрям:
реальну автентифікацію бота, реальні канали guild, реакції, треди, нативні команди
та браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити баг із GitHub issue або PR з тією самою формою транспорту, яку
  бачать користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Використовувати детермінований оракул, коли це можливо, наприклад читання
  реакції Discord REST або перевірку transcript каналу.
- Збирати знімки екрана, коли баг має видиму UI-поверхню.
- Запускатися локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-відновлення, коли вхід, браузерна автоматизація або
  автентифікація провайдера застрягають.
- Публікувати стислий статус в операторський Discord-канал, коли запуск заблокований,
  потребує ручної допомоги через VNC або завершується.

## Поза цілями

- Mantis не є заміною для модульних тестів. Запуск Mantis зазвичай має ставати
  меншим регресійним тестом після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI gate. Він повільніший, використовує live-облікові дані та
  призначений для багів, де live-середовище має значення.
- Mantis не має вимагати участі людини для звичайної роботи. Ручний VNC — це шлях
  відновлення, а не основний шлях.
- Mantis не зберігає сирі секрети в артефактах, логах, знімках екрана, Markdown-звітах
  або коментарях PR.

## Власність

Mantis живе в стеку OpenClaw QA.

- OpenClaw володіє runtime сценаріїв, транспортними адаптерами, схемою доказів і
  локальним CLI у `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live-транспортного harness, помічниками браузерного capture і
  записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою workflow-точкою входу та retention артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: парсингом команд мейнтейнерів,
  dispatch workflow і публікацією фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні агентне налаштування,
  debugging або звітування про застряглий стан.

Ця межа зберігає знання про транспорт в OpenClaw, планування машин у
Crabbox, а glue для workflow мейнтейнерів у ClawSweeper.

## Форма команди

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

Runner створює від’єднані baseline і candidate worktree у вихідному
каталозі, встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, а потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого Discord-сценарію успішна перевірка
означає, що baseline status має значення `fail`, а candidate status має значення `pass`.

Перший VM/браузерний primitive — це desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер всередині
VNC-сесії, захоплює робочий стіл, витягує артефакти назад у локальний вихідний
каталог і записує команду reconnect у звіт. Команда за замовчуванням використовує
провайдера Hetzner, тому що це перший провайдер із робочим desktop/VNC
покриттям у lane Mantis. Перевизначте його за допомогою `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER`, коли запускаєте проти іншого флоту Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенеровану timeline Discord status-reaction через реальний Crabbox desktop.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну lease відкритою для VNC-інспекції. Невдалі запуски за замовчуванням залишають lease, коли її було створено, щоб оператор міг reconnect.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та lifetime lease.

Перший повний primitive desktop transport — це Slack desktop smoke:

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
де SUT OpenClaw gateway і браузер обидва живуть всередині тієї самої
Linux desktop VM.

З `--gateway-setup` команда готує постійний одноразовий OpenClaw
home у `$HOME/.openclaw-mantis/slack-openclaw`, patch Slack Socket Mode
configuration для вибраного каналу, запускає `openclaw gateway run` на port
`38973` і залишає Chrome запущеним у VNC-сесії. Це режим "залиш мені
Linux desktop зі Slack і запущеним claw"; bot-to-bot Slack QA lane
залишається типовим, коли `--gateway-setup` пропущено.

Обов’язкові inputs для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для remote model lane. Якщо локально встановлено лише
  `OPENAI_API_KEY`, Mantis мапить його на `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб forwarding env `OPENCLAW_*` у Crabbox міг перенести його
  у VM.

З `--gateway-setup --credential-source convex` Mantis орендує Slack SUT
credential зі shared pool перед створенням VM і forwarding орендованого
channel id, Socket Mode app token і bot token як runtime env `OPENCLAW_MANTIS_SLACK_*`
всередині desktop. Це залишає workflows GitHub тонкими: їм потрібен лише
секрет Convex broker, а не сирі Slack bot або app tokens.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже увійшов у Slack Web через VNC.
- `--gateway-setup` запускає persistent OpenClaw Slack gateway у VM замість лише запуску bot-to-bot QA lane.
- `--slack-url <url>` відкриває конкретний Slack Web URL. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний SUT bot token.
- `--slack-channel-id <id>` керує allowlist Slack-каналів, який використовує gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує persistent Chrome profile всередині VM. Типове значення — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний Slack Web login переживає rerun на тій самій lease.
- `--credential-source convex --credential-role ci` використовує shared credential pool замість прямих Slack env tokens.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються далі в Slack live lane.

GitHub smoke workflow — це `Mantis Discord Smoke`. Before and after GitHub
workflow для першого реального сценарію — це `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворити поведінку queued-only.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checkout workflow harness ref, збирає окремі baseline і candidate
worktree, запускає `discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
артефакти Actions. Він також рендерить timeline HTML кожного lane у Crabbox
desktop browser і публікує ці VNC-знімки екрана поруч із детермінованими
timeline PNG у коментарі PR. Той самий коментар PR вбудовує легкі
motion-trimmed GIF-прев’ю, згенеровані `crabbox media preview`, посилається на
відповідні motion-trimmed MP4-кліпи та зберігає повні desktop MP4-файли для глибокої
інспекції. Знімки екрана залишаються inline для швидкого review. Workflow збирає
Crabbox CLI з
`openclaw/crabbox` main, щоб він міг використовувати поточні desktop/browser lease flags
до того, як буде випущений наступний Crabbox binary release.

`Mantis Scenario` — це generic manual entrypoint. Він приймає `scenario_id`,
`candidate_ref`, необов’язковий `baseline_ref` і необов’язковий `pr_number`, а потім
dispatch scenario-owned workflow. Wrapper навмисно тонкий:
scenario workflows усе ще володіють своїми transport setup, credentials, VM class,
expected oracle і artifact manifest.

`Mantis Slack Desktop Smoke` — це перший Slack VM workflow. Він checkout
trusted candidate ref в окремому worktree, орендує Crabbox Linux desktop,
запускає `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` проти цього
candidate, відкриває Slack Web у VNC browser, записує desktop, генерує
motion-trimmed preview за допомогою `crabbox media preview`, завантажує повний artifact
directory і за потреби публікує inline evidence comment у цільовому PR.
Використовуйте цей lane, коли потрібен "Linux desktop зі Slack і запущеним claw"
замість лише bot-to-bot Slack transcript.

Кожен PR-publishing scenario записує `mantis-evidence.json` поруч зі своїм report.
Ця schema є handoff між scenario code і GitHub comments:

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

Значення artifact `path` є відносними до каталогу manifest. Значення `targetPath`
є відносними шляхами під publish directory гілки `qa-artifacts`.
Publisher відхиляє path traversal і пропускає entries, позначені
`"required": false`, коли необов’язкові previews або videos недоступні.

Підтримувані види артефактів:

- `timeline`: детермінований знімок екрана сценарію, зазвичай before/after.
- `desktopScreenshot`: VNC/browser desktop screenshot.
- `motionPreview`: inline animated GIF, згенерований із desktop recording.
- `motionClip`: motion-trimmed MP4, що прибирає статичні lead-in і tail.
- `fullVideo`: повний MP4 recording для глибокої інспекції.
- `metadata`: JSON/log sidecar.
- `report`: Markdown report.

Reusable publisher — це `scripts/mantis/publish-pr-evidence.mjs`. Workflows
викликають його з manifest, target PR, target root `qa-artifacts`, comment marker,
Actions artifact URL, run URL і request source. Він копіює declared artifacts
у гілку `qa-artifacts`, будує summary-first PR comment з inline
images/previews і linked videos, а потім оновлює наявний marker comment або
створює новий.

Ви також можете запустити status-reactions run безпосередньо з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише для коментарів до pull request
від користувачів із доступом write, maintain або admin, і розпізнає лише
запити реакцій статусу Discord. За замовчуванням він використовує відомий поганий базовий ref
і поточний SHA голови PR як кандидата. Мейнтейнери можуть перевизначити будь-який
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
знахідок рев’ю ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати профіль робочого столу/браузера, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для базового ref.
5. Установити залежності й зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати live-транспорт, провайдера, модель і профіль браузера.
8. Запустити сценарій і зібрати базові докази.
9. Зупинити Gateway і зберегти журнали.
10. Підготувати ref кандидата в тій самій VM.
11. Запустити той самий сценарій і зібрати докази кандидата.
12. Порівняти результати оракула й візуальні докази.
13. Записати Markdown, JSON, журнали, знімки екрана й необов’язкові артефакти trace.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статусний допис у PR або Discord.

Сценарій має вміти падати двома різними способами:

- **Баг відтворено**: базова версія впала очікуваним способом.
- **Збій harness**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер впали до того, як оракул бага мав сенс.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## MVP Discord

Перший сценарій має націлюватися на реакції статусу Discord у каналах guild, де
режим доставки вихідної відповіді — `message_tool_only`.

Чому це хороший seed для Mantis:

- Це видно в Discord як реакції на повідомлення, що запустило сценарій.
- Він має сильний REST-оракул через стан реакцій повідомлення Discord.
- Він перевіряє реальний OpenClaw Gateway, автентифікацію бота Discord, dispatch повідомлення,
  режим доставки вихідної відповіді, стан реакцій статусу й життєвий цикл ходу моделі.
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

Базові докази мають показувати поставлену в чергу реакцію підтвердження, але без
переходу життєвого циклу в режимі лише інструмента. Докази кандидата мають показувати, що реакції
статусу життєвого циклу виконуються, коли `messages.statusReactions.enabled` явно
дорівнює true.

Перший виконуваний slice — opt-in live QA-сценарій Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Він налаштовує SUT з постійно ввімкненою обробкою guild, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` і явними реакціями статусу. Оракул
опитує справжнє повідомлення Discord, що запустило сценарій, і очікує спостережувану послідовність
`👀 -> 🤔 -> 👍`. Артефакти містять `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні компоненти QA

Mantis має будуватися на наявному приватному стеку QA, а не починати з
нуля:

- `pnpm openclaw qa discord` вже запускає live-лан Discord із driver і
  SUT-ботами.
- Live transport runner уже записує звіти й артефакти спостережуваних повідомлень
  у `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних live
  облікових даних транспорту.
- Сервіс керування браузером уже підтримує знімки екрана, snapshots,
  headless керовані профілі й віддалені CDP-профілі.
- QA Lab уже має UI відладчика й bus для тестування у формі транспорту.

Перша реалізація Mantis може бути тонким runner до/після поверх цих
компонентів, плюс один шар візуальних доказів.

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

`mantis-summary.json` має бути машинно-читним джерелом істини. Звіт
Markdown призначений для коментарів PR і людського рев’ю.

Підсумок має містити:

- протестовані refs і SHA
- транспорт і id сценарію
- провайдера машини та id машини або id оренди
- джерело облікових даних без секретних значень
- результат базової версії
- результат кандидата
- чи було відтворено баг на базовій версії
- чи кандидат його виправив
- шляхи до артефактів
- санітизовані проблеми налаштування або очищення

Знімки екрана — це докази, а не секрети. Вони все одно потребують дисципліни редагування:
можуть з’явитися приватні назви каналів, імена користувачів або вміст повідомлень. Для публічних PR
віддавайте перевагу посиланням на артефакти GitHub Actions замість inline-зображень, доки історія
редагування не стане сильнішою.

## Браузер і VNC

Браузерний lane має два режими:

- **Headless-автоматизація**: стандартно для CI. Chrome запускається з увімкненим CDP, а
  Playwright або керування браузером OpenClaw збирає знімки екрана.
- **VNC rescue**: увімкнено на тій самій VM, коли вхід, MFA, антиавтоматизація Discord
  або візуальне відлагодження потребують людини.

Профіль браузера-спостерігача Discord має бути достатньо постійним, щоб уникати
входу під час кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord із:

- id запуску
- id сценарію
- провайдером машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал і пізніше перейти до виділеного каналу Mantis.

## Машини

Mantis має надавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, відстеження оренд, hydration, журнали, результати й
очищення. Якщо потужності AWS надто повільні або недоступні, додайте провайдера Hetzner
за тим самим інтерфейсом машини.

Мінімальні вимоги до VM:

- Linux з інсталяцією Chrome або Chromium, здатною працювати з робочим столом
- CDP-доступ для автоматизації браузера
- VNC або noVNC для rescue
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU й пам’яті для одного OpenClaw Gateway, одного браузера й одного запуску моделі
- вихідний доступ до Discord, GitHub, провайдерів моделей і брокера облікових даних

VM не має зберігати довготривалі raw-секрети поза очікуваними сховищами облікових даних або
профілю браузера.

## Секрети

Секрети живуть у секретах організації або репозиторію GitHub для віддалених запусків і в
локальному файлі секретів під контролем оператора для локальних запусків.

Рекомендовані назви секретів:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для завантажень публічних артефактів GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом для live
облікових даних транспорту. Секрети GitHub bootstrap-лять broker і fallback lanes.
Workflow реакцій статусу Discord зіставляє секрети Mantis Crabbox назад із
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
які очікує CLI Crabbox. Звичайні назви секретів GitHub `CRABBOX_*` залишаються
прийнятими як fallback сумісності.

Runner Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі провайдерів
- cookies браузера
- вміст auth-профілів
- паролі VNC
- raw payload облікових даних

Завантаження публічних артефактів також мають редагувати цільові метадані Discord, як-от id бота,
guild, каналу й повідомлення. GitHub smoke workflow вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, rotate його
після того, як новий секрет буде збережено.

## Артефакти GitHub і коментарі PR

Workflow Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт Actions.
Коли workflow запускається для звіту про баг або PR з виправленням, він також має
опублікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і upsert
коментар до цього бага або PR з виправленням з inline-знімками до/після. Не публікуйте
основний доказ лише в generic QA automation PR. Raw-журнали, спостережувані
повідомлення й інші об’ємні докази залишаються в артефакті Actions.

Production workflows мають публікувати ці коментарі через Mantis GitHub App, а не
через `github-actions[bot]`. Зберігайте app id і приватний ключ як секрети
GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow використовує прихований marker як ключ upsert, оновлює цей
коментар, коли token може його редагувати, і створює новий коментар від Mantis,
коли старіший marker від bot не можна редагувати.

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

Коли запуск падає через збій harness, коментар має сказати саме це,
а не натякати, що кандидат упав.

## Нотатки приватного розгортання

Приватне розгортання вже може мати застосунок Mantis Discord. Повторно використайте цей
застосунок замість створення ще одного app, коли він має правильні дозволи bot
і його можна безпечно rotate.

Встановіть початковий операторський канал сповіщень через секрети або конфігурацію
розгортання. Спершу він може вказувати на наявний канал мейнтейнерів або operations,
а потім перейти до виділеного каналу Mantis, коли він з’явиться.

Не розміщуйте guild ids, channel ids, bot tokens, browser cookies або VNC passwords
у цьому документі. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і title
- транспорт
- потрібні облікові дані
- політику базового ref
- політику ref кандидата
- patch конфігурації OpenClaw
- кроки налаштування
- stimulus
- очікуваний оракул базової версії
- очікуваний оракул кандидата
- цілі візуального захоплення
- бюджет timeout
- кроки очищення

Сценарії мають віддавати перевагу малим типізованим оракулам:

- стан реакцій Discord для багів реакцій
- посилання на повідомлення Discord для багів threading
- thread ts Slack і стан reaction API для багів Slack
- ids і headers email-повідомлень для багів email
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Візуальні перевірки мають бути додатковими. Якщо API платформи може довести помилку, використовуйте
API як критерій успіху/невдачі, а знімки екрана залишайте для впевненості людини.

## Розширення провайдерів

Після Discord той самий runner може додати:

- Slack: реакції, треди, згадки застосунку, модальні вікна, завантаження файлів.
- Email: автентифікація Gmail і трединг повідомлень за допомогою `gog`, коли конекторів
  недостатньо.
- WhatsApp: вхід через QR, повторна ідентифікація, доставлення повідомлень, медіа, реакції.
- Telegram: обмеження доступу за згадками в групі, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, зв’язки тредів або відповідей, відновлення після перезапуску.

Кожен транспорт має мати один дешевий smoke-сценарій і один або кілька сценаріїв
для класів помилок. Дорогі візуальні сценарії мають залишатися доступними лише за явним увімкненням.

## Відкриті питання

- Який Discord-бот має бути драйвером, а який має бути SUT, коли повторно використовується
  наявний бот Mantis?
- Чи має вхід спостерігача в браузері використовувати людський обліковий запис Discord, тестовий обліковий запис
  чи на першому етапі лише REST-докази, доступні для читання ботом?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди від maintainer?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
