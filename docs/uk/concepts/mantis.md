---
read_when:
    - Створення або запуск візуальної перевірки якості наживо для помилок OpenClaw
    - Додавання перевірки до і після для запиту на злиття
    - Додавання сценаріїв для Discord, Slack, WhatsApp або інших транспортів у реальному часі
    - Налагодження QA-запусків, яким потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це візуальна система наскрізної перевірки для відтворення помилок OpenClaw на активних транспортних каналах, збирання доказів до й після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-06T00:26:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e16fcbbcdf6514f87b5dc3369c3194784f586732e223d9cf530dc5911c5a57eb
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для багів, яким потрібні справжнє
середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які мейнтейнер може переглянути з PR або
з локальної команди.

Mantis починає з Discord, тому що Discord дає нам цінну першу лінію:
справжню авторизацію бота, справжні канали guild, реакції, threads, нативні команди та
браузерний UI, де люди можуть візуально підтвердити те, що показав транспорт.

## Цілі

- Відтворити баг із GitHub issue або PR з тією самою формою транспорту, яку
  бачать користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад зчитування
  реакції через Discord REST або перевірку transcript каналу.
- Знімати screenshots, коли баг має видиму поверхню UI.
- Запускатися локально з CLI, керованого agent, і віддалено з GitHub.
- Зберігати достатньо стану машини для VNC-рятування, коли login, автоматизація браузера або
  авторизація provider застрягає.
- Публікувати стислий статус в операторський Discord-канал, коли запуск заблокований,
  потребує ручної допомоги VNC або завершується.

## Нецілі

- Mantis не є заміною unit tests. Запуск Mantis зазвичай має перетворитися
  на менший regression test після того, як виправлення стало зрозумілим.
- Mantis не є звичайним швидким gate CI. Він повільніший, використовує живі облікові дані та
  призначений для багів, де живе середовище має значення.
- Mantis не повинен вимагати людини для нормальної роботи. Ручний VNC — це шлях
  рятування, а не happy path.
- Mantis не зберігає необроблені secrets в artifacts, logs, screenshots, Markdown
  reports або PR comments.

## Власність

Mantis живе у стеку QA OpenClaw.

- OpenClaw володіє runtime сценаріїв, transport adapters, evidence schema та
  локальним CLI під `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live transport harness, browser capture helpers і
  artifact writers.
- Crabbox володіє розігрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє remote workflow entrypoint і artifact retention.
- ClawSweeper володіє маршрутизацією GitHub comments: parsing maintainer commands,
  dispatching the workflow і posting the final PR comment.
- OpenClaw agents керують Mantis через Codex, коли сценарію потрібні agentic setup,
  debugging або stuck-state reporting.

Ця межа утримує знання про transport в OpenClaw, планування машин у
Crabbox, а glue для maintainer workflow — у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє Discord bot, guild, channel, message send,
reaction send і шлях artifact:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний runner до/після приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює detached baseline і candidate worktrees під вихідним
каталогом, installs dependencies, builds each ref, runs the scenario with
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`,
і `mantis-report.md`. Для першого Discord scenario успішна verification
означає, що baseline status — `fail`, а candidate status — `pass`.

Другий Discord probe до/після націлений на thread attachments:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Цей scenario публікує parent message через driver bot, створює справжній Discord
thread, викликає дію OpenClaw `message.thread-reply` з repo-local
`filePath`, потім опитує thread щодо SUT reply і attachment filename. Baseline
screenshot показує reply без attachment; candidate screenshot
показує очікуваний attachment `mantis-thread-report.md`.

Перший примітив VM/browser — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він leases або reuses Crabbox desktop machine, starts a visible browser inside the
VNC session, captures the desktop, pulls artifacts back to the local output
directory і записує команду reconnect у report. Команда за замовчуванням
використовує Hetzner provider, тому що це перший provider із робочим desktop/VNC
coverage у Mantis lane. Override it with `--provider`, `--crabbox-bin`, or
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` when running against another Crabbox fleet.

Корисні flags desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` reuses a warmed desktop.
- `--browser-url <url>` змінює сторінку, відкриту у visible browser.
- `--html-file <path>` renders a repo-local HTML artifact in the visible browser. Mantis uses this to capture the generated Discord status-reaction timeline through a real Crabbox desktop.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` keeps a newly created passing lease open for VNC inspection. Failed runs keep the lease by default when one was created so an operator can reconnect.
- `--class`, `--idle-timeout`, і `--ttl` tune machine size and lease lifetime.

Перший повний примітив desktop transport — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Він leases або reuses Crabbox desktop machine, syncs the current checkout into
the VM, runs `pnpm openclaw qa slack` inside that VM, opens Slack Web in the VNC
browser, captures the visible desktop, і copies both the Slack QA artifacts and
the VNC screenshot back to the local output directory. Це перша форма Mantis,
де SUT OpenClaw gateway і browser обидва живуть в одній Linux desktop VM.

З `--gateway-setup` команда prepares a persistent disposable OpenClaw
home at `$HOME/.openclaw-mantis/slack-openclaw`, patches Slack Socket Mode
configuration for the selected channel, starts `openclaw gateway run` on port
`38973`, and keeps Chrome running in the VNC session. Це режим "залиш мені
Linux desktop зі Slack і запущеним claw"; bot-to-bot Slack QA lane
залишається типовою, коли `--gateway-setup` omitted.

Обов’язкові inputs для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для remote model lane. Якщо локально задано лише
  `OPENAI_API_KEY`, Mantis maps it to `OPENCLAW_LIVE_OPENAI_KEY`
  before invoking Crabbox so Crabbox's `OPENCLAW_*` env forwarding can carry it
  into the VM.

З `--gateway-setup --credential-source convex` Mantis leases the Slack SUT
credential from the shared pool before creating the VM and forwards the leased
channel id, Socket Mode app token, and bot token as the `OPENCLAW_MANTIS_SLACK_*`
runtime env inside the desktop. Це зберігає GitHub workflows thin: їм потрібен лише
Convex broker secret, а не raw Slack bot або app tokens.

Корисні Slack desktop flags:

- `--lease-id <cbx_...>` reruns against a machine where an operator already logged in to Slack Web through VNC.
- `--gateway-setup` starts a persistent OpenClaw Slack gateway in the VM instead of only running the bot-to-bot QA lane.
- `--keep-lease` keeps the gateway VM open for VNC inspection after success; `--no-keep-lease` stops it after collecting artifacts.
- `--slack-url <url>` opens a specific Slack Web URL. Without it, Mantis derives `https://app.slack.com/client/<team>/<channel>` from Slack `auth.test` when the SUT bot token is available.
- `--slack-channel-id <id>` controls the Slack channel allowlist used by gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` controls the persistent Chrome profile inside the VM. The default is `$HOME/.config/openclaw-mantis/slack-chrome-profile`, so a manual Slack Web login survives reruns on the same lease.
- `--credential-source convex --credential-role ci` uses the shared credential pool instead of direct Slack env tokens.
- `--provider-mode`, `--model`, `--alt-model`, and `--fast` pass through to the Slack live lane.

GitHub smoke workflow — `Mantis Discord Smoke`. GitHub workflow до/після
для першого справжнього scenario — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який очікувано відтворює queued-only behavior.
- `candidate_ref`: ref, який очікувано показує `queued -> thinking -> done`.

Він checks out workflow harness ref, builds separate baseline and candidate
worktrees, runs `discord-status-reactions-tool-only` against each worktree, and
uploads `baseline/`, `candidate/`, `comparison.json`, and `mantis-report.md` as
Actions artifacts. Він також renders each lane's timeline HTML in a Crabbox
desktop browser and publishes those VNC screenshots beside the deterministic
timeline PNGs in the PR comment. Той самий PR comment embeds lightweight
motion-trimmed GIF previews generated by `crabbox media preview`, links to the
matching motion-trimmed MP4 clips, and keeps the full desktop MP4 files for deep
inspection. Screenshots stay inline for quick review. Workflow builds the
Crabbox CLI from
`openclaw/crabbox` main so it can use the current desktop/browser lease flags
before the next Crabbox binary release is cut.

`Mantis Scenario` — це generic manual entrypoint. Він takes a `scenario_id`,
`candidate_ref`, optional `baseline_ref`, and optional `pr_number`, then
dispatches the scenario-owned workflow. Wrapper intentionally thin:
scenario workflows still own their transport setup, credentials, VM class,
expected oracle, and artifact manifest.

`Mantis Slack Desktop Smoke` — це перший Slack VM workflow. Він checks out the
trusted candidate ref in a separate worktree, leases a Crabbox Linux desktop,
runs `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` against that
candidate, opens Slack Web in the VNC browser, records the desktop, generates a
motion-trimmed preview with `crabbox media preview`, uploads the full artifact
directory, and optionally posts the inline evidence comment on the target PR.
Він defaults to AWS for the desktop lease and exposes a manual provider input so
operators can switch to Hetzner when AWS capacity is slow or unavailable. Use
this lane when you want "Linux desktop зі Slack і запущеним claw" instead
of only a bot-to-bot Slack transcript.

Кожен PR-publishing scenario writes `mantis-evidence.json` next to its report.
This schema is the handoff between scenario code and GitHub comments:

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

Artifact `path` values are relative to the manifest directory. `targetPath`
values are relative paths under the `qa-artifacts` branch publish directory.
Publisher rejects path traversal and skips entries marked
`"required": false` when optional previews or videos are unavailable.

Підтримувані artifact kinds:

- `timeline`: детермінований знімок екрана сценарію, зазвичай до/після.
- `desktopScreenshot`: знімок екрана робочого столу VNC/браузера.
- `motionPreview`: вбудований анімований GIF, згенерований із запису робочого столу.
- `motionClip`: MP4 з обрізаним рухом, що видаляє статичний початок і кінець.
- `fullVideo`: повний запис MP4 для детального перегляду.
- `metadata`: супровідний JSON/лог.
- `report`: звіт Markdown.

Повторно використовуваний публікатор — `scripts/mantis/publish-pr-evidence.mjs`. Робочі процеси
викликають його з маніфестом, цільовим PR, цільовим коренем `qa-artifacts`, маркером коментаря,
URL артефакта Actions, URL запуску та джерелом запиту. Він копіює оголошені артефакти
до гілки `qa-artifacts`, створює коментар PR, що починається зі зведення, з вбудованими
зображеннями/попередніми переглядами та посиланнями на відео, а потім оновлює наявний коментар із маркером або
створює новий.

Ви також можете запустити виконання реакцій статусу напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Тригер коментаря навмисно вузький. Він запускається лише для коментарів до pull request
від користувачів із доступом на запис, підтримку або адміністрування, і розпізнає лише
запити реакцій статусу Discord. За замовчуванням він використовує відомий несправний базовий ref
і поточний SHA голови PR як кандидата. Супровідники можуть перевизначити будь-який із
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
9. Зупинити Gateway і зберегти логи.
10. Підготувати ref кандидата в тій самій VM.
11. Запустити той самий сценарій і зібрати докази кандидата.
12. Порівняти результати оракула та візуальні докази.
13. Записати Markdown, JSON, логи, знімки екрана й необов’язкові артефакти трасування.
14. Завантажити артефакти GitHub Actions.
15. Опублікувати стислий статусний допис у PR або Discord.

Сценарій має вміти завершуватися невдачею двома різними способами:

- **Баг відтворено**: базова версія завершилася невдачею очікуваним способом.
- **Збій стенда**: налаштування середовища, облікові дані, Discord API, браузер або
  провайдер зазнали збою до того, як оракул бага став змістовним.

Фінальний звіт має розділяти ці випадки, щоб супровідники не плутали нестабільне
середовище з поведінкою продукту.

## Discord MVP

Перший сценарій має бути націлений на реакції статусу Discord у каналах гільдії, де
режим доставки відповіді джерела — `message_tool_only`.

Чому це хороший початковий сценарій Mantis:

- Він видимий у Discord як реакції на повідомленні, що запустило сценарій.
- Він має сильний REST-оракул через стан реакцій повідомлення Discord.
- Він перевіряє реальний OpenClaw Gateway, автентифікацію бота Discord, надсилання повідомлень,
  режим доставки відповіді джерела, стан реакцій статусу та життєвий цикл ходу моделі.
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

Перший виконуваний зріз — opt-in live QA сценарій Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Він налаштовує SUT із постійно ввімкненою обробкою гільдії, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` та явними реакціями статусу. Оракул
опитує реальне повідомлення Discord, що запустило сценарій, і очікує спостережену послідовність
`👀 -> 🤔 -> 👍`. Артефакти містять `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному приватному стеку QA, а не починати
з нуля:

- `pnpm openclaw qa discord` уже запускає live-лінію Discord із ботами драйвера та
  SUT.
- Live-ранер транспорту вже записує звіти й артефакти спостережених повідомлень
  у `.artifacts/qa-e2e/`.
- Оренди облікових даних Convex уже надають ексклюзивний доступ до спільних live
  облікових даних транспорту.
- Сервіс керування браузером уже підтримує знімки екрана, snapshots,
  headless керовані профілі та віддалені CDP-профілі.
- QA Lab уже має UI відлагоджувача та шину для тестування у формі транспорту.

Перша реалізація Mantis може бути тонким раннером до/після поверх цих
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
Markdown призначений для коментарів PR і людського перегляду.

Зведення має містити:

- протестовані refs і SHA
- транспорт та id сценарію
- провайдера машини та id машини або id оренди
- джерело облікових даних без секретних значень
- результат базової версії
- результат кандидата
- чи відтворився баг на базовій версії
- чи кандидат виправив його
- шляхи артефактів
- санітизовані проблеми налаштування або очищення

Знімки екрана — це докази, а не секрети. Вони все одно потребують дисципліни редагування:
можуть з’явитися приватні назви каналів, імена користувачів або вміст повідомлень. Для публічних PR
віддавайте перевагу посиланням на артефакти GitHub Actions замість вбудованих зображень, доки історія
редагування не стане сильнішою.

## Браузер і VNC

Браузерна лінія має два режими:

- **Headless автоматизація**: стандартно для CI. Chrome працює з увімкненим CDP, а
  Playwright або керування браузером OpenClaw збирає знімки екрана.
- **VNC-рятування**: вмикається на тій самій VM, коли вхід, MFA, антиавтоматизація Discord
  або візуальне відлагодження потребує людини.

Профіль браузера спостерігача Discord має бути достатньо постійним, щоб уникнути
входу для кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord з:

- id запуску
- id сценарію
- провайдером машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал і пізніше перейти до окремого каналу Mantis.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox дає нам прогріті машини, відстеження оренди, гідратацію, логи, результати та
очищення. Якщо місткість AWS надто повільна або недоступна, додайте провайдера Hetzner
за тим самим інтерфейсом машини.

Мінімальні вимоги до VM:

- Linux із придатним для робочого столу встановленням Chrome або Chromium
- доступ CDP для автоматизації браузера
- VNC або noVNC для рятування
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU та пам’яті для одного OpenClaw Gateway, одного браузера та одного запуску моделі
- вихідний доступ до Discord, GitHub, провайдерів моделей і брокера облікових даних

VM не має зберігати довготривалі необроблені секрети поза очікуваними сховищами облікових даних або
профілів браузера.

## Секрети

Секрети зберігаються в секретах організації або репозиторію GitHub для віддалених запусків і в
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
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом для live
облікових даних транспорту. Секрети GitHub ініціалізують брокер і fallback-лінії.
Робочий процес реакцій статусу Discord зіставляє секрети Mantis Crabbox назад із
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
які очікує CLI Crabbox. Звичайні назви секретів GitHub `CRABBOX_*` залишаються
прийнятими як fallback для сумісності.

Раннер Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі провайдера
- cookies браузера
- вміст профілів автентифікації
- паролі VNC
- необроблені payloads облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані Discord, як-от id бота,
гільдії, каналу та повідомлення. GitHub smoke-робочий процес вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` із цієї причини.

Якщо токен випадково вставили в issue, PR, чат або лог, ротируйте його
після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Робочі процеси Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт Actions.
Коли робочий процес запускається для звіту про баг або PR із виправленням, він також має
публікувати відредаговані знімки екрана PNG до гілки `qa-artifacts` і виконувати upsert
коментаря в тому багу або PR із виправленням з вбудованими знімками екрана до/після. Не публікуйте
основний доказ лише в загальному PR автоматизації QA. Необроблені логи, спостережені
повідомлення та інші громіздкі докази залишаються в артефакті Actions.

Виробничі робочі процеси мають публікувати ці коментарі через GitHub App Mantis, а не
через `github-actions[bot]`. Зберігайте app id і приватний ключ як секрети GitHub Actions
`MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Робочий процес використовує прихований маркер як ключ upsert, оновлює цей
коментар, коли токен може його редагувати, і створює новий коментар, що належить Mantis, коли
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

Коли запуск завершується невдачею через збій стенда, коментар має казати саме це
замість того, щоб натякати, що кандидат зазнав невдачі.

## Примітки щодо приватного розгортання

Приватне розгортання вже може мати Discord-застосунок Mantis. Повторно використовуйте цей
застосунок замість створення ще одного, якщо він має потрібні дозволи бота
і його можна безпечно ротирувати.

Встановіть початковий канал сповіщень оператора через secrets або конфігурацію розгортання. Спершу він може вказувати на наявний канал супровідників чи операційний канал, а потім перейти на виділений канал Mantis, коли такий з’явиться.

Не розміщуйте ідентифікатори гільдій, ідентифікатори каналів, токени ботів, cookie браузера або паролі VNC у цьому документі. Зберігайте їх у GitHub secrets, брокері облікових даних або локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- ідентифікатор і назву
- транспорт
- потрібні облікові дані
- політику ref базової версії
- політику ref кандидата
- патч конфігурації OpenClaw
- кроки налаштування
- стимул
- очікуваний оракул базової версії
- очікуваний оракул кандидата
- цілі візуального захоплення
- бюджет часу очікування
- кроки очищення

Сценарії мають надавати перевагу малим типізованим оракулам:

- стан реакцій Discord для помилок реакцій
- посилання на повідомлення Discord для помилок тредингу
- ts треду Slack і стан API реакцій для помилок Slack
- ідентифікатори повідомлень електронної пошти та заголовки для помилок електронної пошти
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Перевірки за допомогою зору мають бути додатковими. Якщо API платформи може довести помилку, використовуйте API як оракул проходження/помилки, а знімки екрана залишайте для впевненості людини.

## Розширення провайдерів

Після Discord той самий runner може додати:

- Slack: реакції, треди, згадки застосунку, модальні вікна, завантаження файлів.
- Електронна пошта: автентифікація Gmail і трединг повідомлень за допомогою `gog`, коли конекторів недостатньо.
- WhatsApp: вхід через QR, повторна ідентифікація, доставлення повідомлень, медіа, реакції.
- Telegram: обмеження групових згадок, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, зв’язки тредів або відповідей, відновлення після перезапуску.

Кожен транспорт має мати один дешевий smoke-сценарій і один або кілька сценаріїв для класів помилок. Дорогі візуальні сценарії мають залишатися опціональними.

## Відкриті питання

- Який бот Discord має бути драйвером, а який SUT, коли наявний бот Mantis використовується повторно?
- Чи має вхід браузера спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис або лише доступні боту докази REST на першому етапі?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування команди супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
