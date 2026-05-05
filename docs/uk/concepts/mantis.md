---
read_when:
    - Створення або запуск живого візуального контролю якості для помилок OpenClaw
    - Додавання перевірки «до» й «після» для запиту на злиття
    - Додавання сценаріїв для Discord, Slack, WhatsApp або інших живих транспортів
    - Налагодження запусків QA, яким потрібні знімки екрана, автоматизація браузера або доступ VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на діючих транспортах, збору доказів до й після та прикріплення артефактів до запитів на злиття.
title: Богомол
x-i18n:
    generated_at: "2026-05-05T08:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6b287e2832e3e49de6b3cb65aeb1d381a36fc30ce9c94dc5b6b4d7e928c2706c
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної верифікації OpenClaw для помилок, яким потрібні справжнє середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій для відомого поганого ref, збирає докази, запускає той самий сценарій для кандидатного ref і публікує порівняння як артефакти, які мейнтейнер може переглянути з PR або з локальної команди.

Mantis починає з Discord, тому що Discord дає нам першу lane з високою цінністю: справжню автентифікацію бота, справжні канали guild, реакції, треди, нативні команди та браузерний UI, де люди можуть візуально підтвердити те, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать користувачі.
- Захопити артефакт **before** на baseline ref перед застосуванням виправлення.
- Захопити артефакт **after** на candidate ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад читання реакції через Discord REST або перевірку transcript каналу.
- Захоплювати знімки екрана, коли помилка має видиму UI-поверхню.
- Запускати локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-рятування, коли вхід, браузерна автоматизація або автентифікація provider застрягає.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблоковано, потрібна ручна VNC-допомога або запуск завершено.

## Нецілі

- Mantis не є заміною unit tests. Запуск Mantis зазвичай має перетворитися на менший регресійний тест після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI gate. Він повільніший, використовує live credentials і зарезервований для помилок, де живе середовище має значення.
- Mantis не має вимагати участі людини для нормальної роботи. Ручний VNC — це шлях рятування, а не штатний шлях.
- Mantis не зберігає raw secrets в артефактах, логах, знімках екрана, Markdown-звітах або PR-коментарях.

## Власність

Mantis живе в QA-стеку OpenClaw.

- OpenClaw володіє runtime сценаріїв, транспортними адаптерами, схемою доказів і локальним CLI у `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live transport harness, помічниками захоплення браузера та записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow і збереженням артефактів.
- ClawSweeper володіє маршрутизацією GitHub-коментарів: розбором команд мейнтейнерів, dispatch workflow і публікацією фінального PR-коментаря.
- Агенти OpenClaw керують Mantis через Codex, коли сценарій потребує агентного налаштування, налагодження або звітування про застряглий стан.

Ця межа тримає знання про транспорт в OpenClaw, планування машин у Crabbox, а workflow-зв’язку для мейнтейнерів у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє Discord-бота, guild, канал, надсилання повідомлення, надсилання реакції та шлях артефактів:

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

Runner створює від’єднані baseline і candidate worktrees у каталозі виводу, встановлює залежності, збирає кожен ref, запускає сценарій з `--allow-failures`, а потім записує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md`. Для першого Discord-сценарію успішна верифікація означає, що baseline status має `fail`, а candidate status має `pass`.

Перша VM/browser primitive — це desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Вона орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер у VNC-сесії, захоплює desktop, витягує артефакти назад у локальний каталог виводу і записує команду повторного підключення у звіт. Команда за замовчуванням використовує Hetzner provider, тому що це перший provider з робочим desktop/VNC-покриттям у Mantis lane. Перевизначте його за допомогою `--provider`, `--crabbox-bin` або `OPENCLAW_MANTIS_CRABBOX_PROVIDER` під час запуску проти іншого Crabbox fleet.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить локальний HTML-артефакт repo у видимому браузері. Mantis використовує це, щоб захопити згенеровану часову шкалу Discord status-reaction через справжній Crabbox desktop.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену passing lease відкритою для VNC-інспекції. Failed runs за замовчуванням залишають lease, коли її було створено, щоб оператор міг перепідключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та час життя lease.

Перша повна desktop transport primitive — це Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Вона орендує або повторно використовує desktop-машину Crabbox, синхронізує поточний checkout у VM, запускає `pnpm openclaw qa slack` усередині цієї VM, відкриває Slack Web у VNC-браузері, захоплює видимий desktop і копіює як артефакти Slack QA, так і VNC-знімок екрана назад у локальний каталог виводу. Це перша форма Mantis, де SUT OpenClaw Gateway і браузер обидва живуть в одній Linux desktop VM.

З `--gateway-setup` команда готує постійний одноразовий OpenClaw home у `$HOME/.openclaw-mantis/slack-openclaw`, патчить конфігурацію Slack Socket Mode для вибраного каналу, запускає `openclaw gateway run` на порту `38973` і залишає Chrome запущеним у VNC-сесії. Це режим "залиш мені Linux desktop зі Slack і запущеним claw"; bot-to-bot Slack QA lane залишається типовою, коли `--gateway-setup` опущено.

Обов’язкові вхідні дані для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для remote model lane. Якщо локально встановлено лише `OPENAI_API_KEY`, Mantis мапить його на `OPENCLAW_LIVE_OPENAI_KEY` перед викликом Crabbox, щоб forwarding env `OPENCLAW_*` у Crabbox міг передати його у VM.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає на машині, де оператор уже увійшов у Slack Web через VNC.
- `--gateway-setup` запускає постійний OpenClaw Slack Gateway у VM замість запуску лише bot-to-bot QA lane.
- `--slack-url <url>` відкриває конкретний Slack Web URL. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний SUT bot token.
- `--slack-channel-id <id>` керує allowlist Slack-каналів, яку використовує gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome усередині VM. Типове значення — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний вхід у Slack Web зберігається для повторних запусків на тій самій lease.
- `--credential-source convex --credential-role ci` використовує спільний credential pool замість прямих Slack env tokens.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються у Slack live lane.

GitHub smoke workflow — це `Mantis Discord Smoke`. Before і after GitHub workflow для першого справжнього сценарію — це `Mantis Discord Status Reactions`. Він приймає:

- `baseline_ref`: ref, який має відтворити поведінку queued-only.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він робить checkout workflow harness ref, збирає окремі baseline і candidate worktrees, запускає `discord-status-reactions-tool-only` проти кожного worktree і завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як Actions artifacts. Він також рендерить timeline HTML кожної lane у Crabbox desktop browser і публікує ці VNC-знімки екрана поруч із детермінованими timeline PNG у PR-коментарі. Той самий PR-коментар вбудовує легкі motion-trimmed GIF previews, згенеровані `crabbox media preview`, посилається на відповідні motion-trimmed MP4 clips і зберігає повні desktop MP4 files для глибокої інспекції. Знімки екрана залишаються inline для швидкого review. Workflow збирає Crabbox CLI з main `openclaw/crabbox`, щоб використовувати поточні desktop/browser lease flags до того, як буде зрізано наступний Crabbox binary release.

`Mantis Scenario` — це generic manual entrypoint. Він приймає `scenario_id`, `candidate_ref`, необов’язковий `baseline_ref` і необов’язковий `pr_number`, а потім dispatch scenario-owned workflow. Wrapper навмисно тонкий: scenario workflows усе ще володіють своїм transport setup, credentials, VM class, expected oracle і artifact manifest.

`Mantis Slack Desktop Smoke` — це перший Slack VM workflow. Він робить checkout trusted candidate ref в окремому worktree, орендує Crabbox Linux desktop, запускає `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` проти цього candidate, відкриває Slack Web у VNC-браузері, записує desktop, генерує motion-trimmed preview за допомогою `crabbox media preview`, завантажує повний каталог артефактів і необов’язково публікує inline evidence comment у цільовому PR. Використовуйте цю lane, коли вам потрібен "Linux desktop зі Slack і запущеним claw" замість лише bot-to-bot Slack transcript.

Кожен PR-publishing scenario записує `mantis-evidence.json` поруч зі своїм звітом. Ця схема є handoff між scenario code і GitHub comments:

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

Значення artifact `path` є відносними до каталогу manifest. Значення `targetPath` є відносними шляхами під publish directory гілки `qa-artifacts`. Publisher відхиляє path traversal і пропускає entries, позначені `"required": false`, коли optional previews або videos недоступні.

Підтримувані artifact kinds:

- `timeline`: детермінований знімок екрана сценарію, зазвичай before/after.
- `desktopScreenshot`: знімок екрана VNC/browser desktop.
- `motionPreview`: inline animated GIF, згенерований із desktop recording.
- `motionClip`: motion-trimmed MP4, який видаляє статичні lead-in і tail.
- `fullVideo`: повний MP4 recording для глибокої інспекції.
- `metadata`: JSON/log sidecar.
- `report`: Markdown-звіт.

Reusable publisher — це `scripts/mantis/publish-pr-evidence.mjs`. Workflows викликають його з manifest, target PR, `qa-artifacts` target root, comment marker, Actions artifact URL, run URL і request source. Він копіює declared artifacts у гілку `qa-artifacts`, створює summary-first PR comment з inline images/previews і linked videos, а потім оновлює наявний marker comment або створює новий.

Ви також можете запустити status-reactions run напряму з PR-коментаря:

```text
@Mantis discord status reactions
```

Comment trigger навмисно вузький. Він запускається лише на pull request comments від користувачів із доступом write, maintain або admin і розпізнає лише Discord status-reaction requests. За замовчуванням він використовує відомий поганий baseline ref і поточний PR head SHA як candidate. Мейнтейнери можуть перевизначити будь-який ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда є явною та сфокусованою на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis на основі міток, змінених файлів і
висновків ревʼю ClawSweeper.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати профіль робочого стола/браузера, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для базового ref.
5. Встановити залежності й зібрати лише те, що потрібно сценарію.
6. Запустити дочірній OpenClaw Gateway з ізольованим каталогом стану.
7. Налаштувати live-транспорт, провайдер, модель і профіль браузера.
8. Запустити сценарій і зібрати базові докази.
9. Зупинити Gateway і зберегти журнали.
10. Підготувати кандидатний ref у тій самій VM.
11. Запустити той самий сценарій і зібрати докази кандидата.
12. Порівняти результати oracle та візуальні докази.
13. Записати Markdown, JSON, журнали, знімки екрана та необовʼязкові артефакти trace.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статус у PR або Discord.

Сценарій має вміти завершуватися з помилкою двома різними способами:

- **Баг відтворено**: базовий варіант завершився з очікуваною помилкою.
- **Помилка harness**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер завершилися з помилкою до того, як oracle бага став змістовним.

Фінальний звіт має розділяти ці випадки, щоб мейнтейнери не плутали нестабільне
середовище з поведінкою продукту.

## MVP для Discord

Перший сценарій має бути націлений на реакції статусу Discord у каналах guild, де
режим доставки вихідної відповіді — `message_tool_only`.

Чому це добре початкове завдання для Mantis:

- Це видно в Discord як реакції на повідомлення-тригер.
- Є сильний REST oracle через стан реакцій повідомлення Discord.
- Це перевіряє реальний OpenClaw Gateway, автентифікацію бота Discord, диспетчеризацію повідомлень,
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

Базові докази мають показувати поставлену в чергу реакцію підтвердження, але без
переходу життєвого циклу в режимі лише для інструментів. Докази кандидата мають показувати, що реакції
статусу життєвого циклу виконуються, коли `messages.statusReactions.enabled` явно
має значення true.

Перший виконуваний зріз — opt-in live QA-сценарій Discord:

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
"message_tool"`, `ackReaction: "👀"` та явними реакціями статусу. Oracle
опитує реальне повідомлення-тригер у Discord і очікує спостережувану послідовність
`👀 -> 🤔 -> 👍`. Артефакти містять `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному приватному QA-стеку, а не починати з
нуля:

- `pnpm openclaw qa discord` уже запускає live-лінію Discord із driver і
  SUT-ботами.
- Live transport runner уже записує звіти й артефакти спостережуваних повідомлень
  у `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних live
  облікових даних транспорту.
- Сервіс керування браузером уже підтримує знімки екрана, snapshots,
  headless керовані профілі та віддалені CDP-профілі.
- QA Lab уже має UI налагоджувача та bus для тестування у формі transport.

Перша реалізація Mantis може бути тонким runner до/після поверх цих
частин, плюс один шар візуальних доказів.

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
Markdown призначений для коментарів у PR і людського ревʼю.

Підсумок має містити:

- перевірені refs і SHA
- transport і id сценарію
- провайдера машини та id машини або id оренди
- джерело облікових даних без секретних значень
- результат базового варіанта
- результат кандидата
- чи відтворився баг на базовому варіанті
- чи кандидат це виправив
- шляхи артефактів
- санітизовані проблеми налаштування або очищення

Знімки екрана — це докази, а не секрети. Вони все одно потребують дисципліни редагування:
можуть зʼявлятися приватні назви каналів, імена користувачів або вміст повідомлень. Для публічних PR
надавайте перевагу посиланням на артефакти GitHub Actions замість вбудованих зображень, доки історія
редагування не стане сильнішою.

## Браузер і VNC

Браузерна лінія має два режими:

- **Headless automation**: типовий для CI. Chrome запускається з увімкненим CDP, а
  Playwright або керування браузером OpenClaw збирає знімки екрана.
- **VNC rescue**: увімкнено на тій самій VM, коли вхід, MFA, Discord anti-automation
  або візуальне налагодження потребують людини.

Профіль браузера спостерігача Discord має бути достатньо постійним, щоб уникати
входу для кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статус у Discord з:

- id запуску
- id сценарію
- провайдером машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал, а пізніше перейти до виділеного каналу Mantis.

## Машини

Mantis має надавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, відстеження оренд, hydration, журнали, результати та
очищення. Якщо місткість AWS надто повільна або недоступна, додайте провайдера Hetzner
за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux із встановленим Chrome або Chromium, здатним працювати з робочим столом
- доступ CDP для автоматизації браузера
- VNC або noVNC для rescue
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU та памʼяті для одного OpenClaw Gateway, одного браузера й одного запуску моделі
- вихідний доступ до Discord, GitHub, провайдерів моделей і брокера облікових даних

VM не має зберігати довгоживучі сирі секрети поза очікуваними сховищами облікових даних або
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
облікових даних транспорту. Секрети GitHub початково запускають брокер і fallback-лінії.
Workflow реакцій статусу Discord зіставляє секрети Mantis Crabbox назад зі
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
які очікує Crabbox CLI. Прості назви секретів GitHub `CRABBOX_*` залишаються
прийнятими як fallback сумісності.

Runner Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі провайдерів
- cookies браузера
- вміст профілів автентифікації
- паролі VNC
- сирі payloads облікових даних

Завантаження публічних артефактів також мають редагувати цільові метадані Discord, такі як bot,
guild, channel і message ids. GitHub smoke workflow вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо token випадково вставлено в issue, PR, чат або журнал, замініть його
після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Workflows Mantis мають завантажувати повний bundle доказів як короткоживучий артефакт Actions.
Коли workflow запускається для звіту про баг або PR з виправленням, він також має
публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і upsert-коментар
до цього бага або PR з виправленням із вбудованими знімками до/після. Не публікуйте
основний доказ лише в загальному PR автоматизації QA. Сирі журнали, спостережувані
повідомлення та інші обʼємні докази залишаються в артефакті Actions.

Production workflows мають публікувати ці коментарі через Mantis GitHub App, а не
через `github-actions[bot]`. Зберігайте app id і приватний ключ як секрети
GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Workflow використовує прихований marker як ключ upsert, оновлює цей
коментар, коли token може його редагувати, і створює новий коментар від імені Mantis,
коли старіший marker, створений ботом, не можна редагувати.

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

Коли запуск завершується з помилкою через помилку harness, у коментарі має бути сказано саме це
замість натяку, що кандидат завершився з помилкою.

## Примітки щодо приватного розгортання

У приватному розгортанні вже може бути застосунок Mantis Discord. Повторно використайте цей
застосунок замість створення іншого, коли він має потрібні дозволи бота
і його можна безпечно ротувати.

Задайте початковий операторський канал сповіщень через секрети або конфігурацію
розгортання. Спершу він може вказувати на наявний канал мейнтейнерів або операцій,
а потім перейти до виділеного каналу Mantis, коли він зʼявиться.

Не додавайте guild ids, channel ids, bot tokens, browser cookies або VNC passwords
до цього документа. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і заголовок
- transport
- потрібні облікові дані
- політику базового ref
- політику кандидатного ref
- patch конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний oracle базового варіанта
- очікуваний oracle кандидата
- цілі візуального захоплення
- бюджет timeout
- кроки очищення

Сценарії мають надавати перевагу малим, типізованим oracles:

- стан реакцій Discord для багів реакцій
- посилання на повідомлення Discord для багів threading
- thread ts Slack і стан API реакцій для багів Slack
- ids повідомлень email і headers для багів email
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Vision-перевірки мають бути додатковими. Якщо platform API може довести баг, використовуйте
API як oracle pass/fail і зберігайте знімки екрана для людської впевненості.

## Розширення провайдера

Після Discord той самий runner може додати:

- Slack: реакції, гілки, згадки застосунку, модальні вікна, завантаження файлів.
- Email: автентифікація Gmail і групування повідомлень у ланцюжки за допомогою `gog`, коли конекторів недостатньо.
- WhatsApp: вхід через QR, повторна ідентифікація, доставлення повідомлень, медіа, реакції.
- Telegram: обмеження згадок у групах, команди, реакції там, де доступно.
- Matrix: зашифровані кімнати, зв’язки гілок або відповідей, відновлення після перезапуску.

Кожен транспорт повинен мати один дешевий smoke-сценарій і один або кілька сценаріїв класів помилок. Дорогі візуальні сценарії мають залишатися опційними.

## Відкриті питання

- Який Discord-бот має бути драйвером, а який SUT, коли повторно використовується наявний бот Mantis?
- Чи має вхід браузера-спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис або лише доступні боту REST-докази для першого етапу?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування команди від супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
