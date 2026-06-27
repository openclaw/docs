---
read_when:
    - Створення або запуск live візуального QA для помилок OpenClaw
    - Додавання перевірки до й після для pull request
    - Додавання сценаріїв Discord, Slack, WhatsApp або інших live-транспортів
    - Налагодження запусків QA, яким потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на реальних транспортах, збирання доказів до й після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-06-27T17:26:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної верифікації OpenClaw для помилок, яким потрібні справжнє
середовище виконання, справжній транспорт і видимий доказ. Вона запускає сценарій на відомому
поганому ref, збирає докази, запускає той самий сценарій на кандидатному ref і
публікує порівняння як артефакти, які супровідник може переглянути з PR або
з локальної команди.

Mantis починає з Discord, тому що Discord дає нам цінну першу лінію:
справжню автентифікацію бота, справжні канали guild, реакції, треди, нативні команди та
браузерний UI, де люди можуть візуально підтвердити, що показав транспорт.

## Цілі

- Відтворити помилку з GitHub issue або PR з тією самою формою транспорту, яку бачать
  користувачі.
- Зібрати артефакт **до** на базовому ref перед застосуванням виправлення.
- Зібрати артефакт **після** на кандидатному ref після застосування виправлення.
- Використовувати детермінований oracle, коли це можливо, наприклад читання реакції через Discord REST
  або перевірку стенограми каналу.
- Збирати знімки екрана, коли помилка має видиму поверхню UI.
- Запускати локально з керованого агентом CLI і віддалено з GitHub.
- Зберігати достатньо машинного стану для порятунку через VNC, коли вхід, браузерна автоматизація або
  автентифікація провайдера застрягають.
- Публікувати стислий статус в операторський канал Discord, коли запуск заблокований,
  потребує ручної допомоги VNC або завершується.

## Нецілі

- Mantis не є заміною модульних тестів. Запуск Mantis зазвичай має стати
  меншим регресійним тестом після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким шлюзом CI. Він повільніший, використовує live-облікові дані та
  призначений для помилок, де live-середовище має значення.
- Mantis не має вимагати участі людини для нормальної роботи. Ручний VNC — це шлях
  порятунку, а не щасливий шлях.
- Mantis не зберігає необроблені секрети в артефактах, логах, знімках екрана, Markdown
  звітах або коментарях PR.

## Власність

Mantis живе в стеку QA OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними адаптерами, схемою доказів і
  локальним CLI у `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live-транспортного harness, допоміжними засобами захоплення браузера та
  записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє точкою входу віддаленого workflow і збереженням артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: розбором команд супровідників,
  диспетчеризацією workflow і публікацією фінального коментаря PR.
- Агенти OpenClaw керують Mantis через Codex, коли сценарію потрібні агентне налаштування,
  налагодження або звітування про застряглий стан.

Ця межа залишає транспортні знання в OpenClaw, планування машин у
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

Runner створює відокремлені worktree baseline і candidate у вихідному
каталозі, встановлює залежності, збирає кожен ref, запускає сценарій з
`--allow-failures`, потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого сценарію Discord успішна верифікація
означає, що статус baseline — `fail`, а статус candidate — `pass`.

Другий probe до/після для Discord націлений на вкладення в тредах:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Цей сценарій публікує батьківське повідомлення через driver bot, створює справжній тред Discord,
викликає дію OpenClaw `message.thread-reply` з repo-local
`filePath`, потім опитує тред щодо відповіді SUT і імені файлу вкладення. Знімок екрана
baseline показує відповідь без вкладення; знімок екрана candidate
показує очікуване вкладення `mantis-thread-report.md`.

Перший примітив VM/browser — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Він орендує або повторно використовує desktop-машину Crabbox, запускає видимий браузер усередині
сеансу VNC, захоплює робочий стіл, витягує артефакти назад до локального вихідного
каталогу та записує команду повторного підключення у звіт. Команда за замовчуванням
використовує провайдера Hetzner, тому що це перший провайдер із робочим desktop/VNC
покриттям у лінії Mantis. Перевизначайте це за допомогою `--provider`, `--crabbox-bin` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` під час запуску проти іншого fleet Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенеровану часову шкалу статус-реакцій Discord через справжній desktop Crabbox.
- `--browser-profile-dir <remote-path>` повторно використовує віддалений Chrome user-data-dir, щоб постійний desktop Mantis міг залишатися залогіненим між запусками. Використовуйте це для довготривалого профілю переглядача Discord Web.
- `--browser-profile-archive-env <name>` відновлює base64 `.tgz` архів Chrome user-data-dir із названої змінної середовища перед запуском браузера. Використовуйте це для залогінених свідків, таких як Discord Web. Типова env var — `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` керує тривалістю захоплення MP4. Використовуйте довшу тривалість для повільних залогінених вебзастосунків, яким потрібен час для стабілізації.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну оренду відкритою для інспекції через VNC. Невдалі запуски за замовчуванням залишають оренду, коли її було створено, щоб оператор міг повторно підключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та строк життя оренди.

Для доказів Discord Web Mantis використовує спеціальний обліковий запис переглядача замість
токена бота. Live-сценарій Discord API залишається oracle: він створює справжній
тред, надсилає `thread-reply` SUT і перевіряє вкладення через Discord
REST. Коли встановлено `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарій також
записує артефакт URL Discord Web. Коли встановлено `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`,
він залишає цей тред доступним достатньо довго, щоб залогінений браузер міг відкрити
й записати його.

Workflow GitHub відкриває URL треда candidate у Discord Web, захоплює
знімок екрана, записує MP4 і генерує обрізаний GIF-перегляд, коли доступні
медіаінструменти Crabbox. Надавайте перевагу постійному шляху профілю переглядача, налаштованому
через `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, тому що повні архіви профілю Chrome
можуть перевищити обмеження GitHub на розмір секрету. Для малих/bootstrap профілів
workflow також може відновити base64 `.tgz` архів із
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Якщо жодне джерело профілю не
налаштоване, workflow усе одно публікує детерміновані знімки екрана вкладень baseline/candidate
і логує сповіщення, що залогінений свідок Discord Web
був пропущений.

Перший повний desktop-транспортний примітив — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Він орендує або повторно використовує desktop-машину Crabbox, синхронізує поточний checkout у
VM, запускає `pnpm openclaw qa slack` усередині цієї VM, відкриває Slack Web у браузері
VNC, захоплює видимий робочий стіл і копіює як артефакти Slack QA, так і
знімок екрана VNC назад до локального вихідного каталогу. Це перша форма Mantis,
де SUT OpenClaw gateway і браузер обидва живуть усередині тієї самої
Linux desktop VM.

З `--gateway-setup` команда готує постійний одноразовий home OpenClaw
у `$HOME/.openclaw-mantis/slack-openclaw`, патчить конфігурацію Slack Socket Mode
для вибраного каналу, запускає `openclaw gateway run` на порту
`38973` і залишає Chrome працювати в сеансі VNC. Це режим «залиш мені
Linux desktop зі Slack і запущеним claw»; лінія Slack QA bot-to-bot
залишається типовою, коли `--gateway-setup` не вказано.

Обов’язкові вхідні дані для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленої модельної лінії. Якщо локально встановлено лише
  `OPENAI_API_KEY`, Mantis відображає його на `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб пересилання env `OPENCLAW_*` у Crabbox могло перенести його
  у VM.

З `--gateway-setup --credential-source convex` Mantis орендує облікові дані Slack SUT
зі спільного pool перед створенням VM і пересилає орендовані
channel id, Socket Mode app token і bot token як runtime env `OPENCLAW_MANTIS_SLACK_*`
усередині desktop. Це робить workflow GitHub тонкими: їм потрібен лише
секрет брокера Convex, а не необроблені токени Slack bot або app.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже увійшов у Slack Web через VNC.
- `--gateway-setup` запускає постійний OpenClaw Slack gateway у VM замість лише запуску лінії bot-to-bot QA.
- `--keep-lease` залишає gateway VM відкритою для інспекції через VNC після успіху; `--no-keep-lease` зупиняє її після збирання артефактів.
- `--slack-url <url>` відкриває конкретний URL Slack Web. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` із Slack `auth.test`, коли доступний bot token SUT.
- `--slack-channel-id <id>` керує allowlist каналів Slack, яку використовує gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome усередині VM. Типове значення — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний вхід у Slack Web переживає повторні запуски на тій самій оренді.
- `--credential-source convex --credential-role ci` використовує спільний pool облікових даних замість прямих Slack env tokens.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються в Slack live lane.

Запуски approval checkpoint рендерять знімки повідомлень Slack API у PNG checkpoint
для CI-безпечного візуального доказу. `slack-desktop-smoke.png` є доказом Slack Web
лише тоді, коли оренда використовує теплий профіль браузера, який уже залогінений.

Workflow GitHub smoke — `Mantis Discord Smoke`. Workflow GitHub до і після
для першого справжнього сценарію — `Mantis Discord Status Reactions`. Він
приймає:

- `baseline_ref`: ref, який має відтворити поведінку only queued.
- `candidate_ref`: ref, який має показати `queued -> thinking -> done`.

Він checkout-ить ref workflow harness, збирає окремі worktree baseline і candidate, запускає
`discord-status-reactions-tool-only` проти кожного worktree і
завантажує `baseline/`, `candidate/`, `comparison.json` і `mantis-report.md` як
артефакти Actions. Він також рендерить HTML часової шкали кожної лінії в desktop-браузері
Crabbox і публікує ці знімки екрана VNC поряд із детермінованими
PNG часової шкали в коментарі PR. Той самий коментар PR вбудовує легкі
обрізані за рухом GIF-перегляди, згенеровані `crabbox media preview`, посилається на
відповідні обрізані за рухом MP4-кліпи та зберігає повні desktop MP4 файли для глибокої
інспекції. Знімки екрана залишаються inline для швидкого перегляду. Workflow збирає
Crabbox CLI з
`openclaw/crabbox` main, щоб він міг використовувати поточні прапорці desktop/browser lease
до виходу наступного бінарного релізу Crabbox.

`Mantis Scenario` — це універсальна ручна точка входу. Вона приймає `scenario_id`,
`candidate_ref`, необов’язковий `baseline_ref` і необов’язковий `pr_number`, а потім
передає керування робочому процесу, що належить сценарію. Обгортка навмисно тонка:
робочі процеси сценаріїв і далі самі керують налаштуванням транспорту, обліковими даними, класом VM,
очікуваним оракулом і маніфестом артефактів.

`Mantis Slack Desktop Smoke` — це перший Slack VM workflow. Він вивантажує
довірений кандидатний ref в окремий worktree, орендує Crabbox Linux desktop,
запускає `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` для цього
кандидата, відкриває Slack Web у VNC-браузері, записує desktop, генерує
попередній перегляд із обрізанням руху за допомогою `crabbox media preview`, завантажує повний каталог
артефактів і за потреби публікує inline-коментар із доказами в цільовому PR.
За замовчуванням для desktop-оренди використовується AWS, а також доступний ручний ввід провайдера, щоб
оператори могли перемкнутися на Hetzner, коли потужності AWS повільні або недоступні. Використовуйте
цей lane, коли вам потрібен «Linux desktop зі Slack і запущеним claw», а не
лише bot-to-bot Slack transcript.

`Mantis Telegram Live` обгортає наявний Telegram live QA lane у той самий PR
evidence pipeline. Він вивантажує довірений кандидатний ref в окремий
worktree, запускає `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, записує маніфест `mantis-evidence.json` із
Telegram QA summary, `qa-evidence.json` і report artifacts, рендерить
редагований evidence HTML через Crabbox desktop browser, генерує
GIF з обрізанням руху за допомогою `crabbox media preview` і публікує inline PR
evidence comment, коли доступний номер PR. Цей lane є візуальним QA-evidence,
а не proof із залогіненим Telegram Web: Telegram Bot API дає стабільні live
message evidence, але стан входу в Telegram Web не потрібен для звичайної Mantis
automation.

`Mantis Telegram Desktop Proof` — це агентна native Telegram Desktop
before/after обгортка. Maintainer може запустити її з PR-коментаря за допомогою
`@openclaw-mantis telegram desktop proof`, з Actions UI з довільними
інструкціями або через універсальний dispatcher `Mantis Scenario`. Workflow
передає PR, baseline ref, candidate ref і maintainer instructions до Codex.
Агент читає PR, вирішує, яка Telegram-visible поведінка доводить зміну,
запускає real-user Crabbox Telegram Desktop proof lane для baseline і
candidate, ітерує, доки native GIFs не стануть корисними, записує парні
артефакти `motionPreview` у `mantis-evidence.json`, завантажує bundle і
публікує 2-column PR evidence table, коли доступний номер PR.

Для human-in-the-loop налаштування Telegram desktop використовуйте scenario builder:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder орендує або повторно використовує Crabbox desktop, встановлює native Linux
Telegram Desktop binary, за потреби відновлює user-session archive, налаштовує
OpenClaw з орендованим Telegram SUT bot token, запускає `openclaw gateway run`
на порту `38974`, публікує driver-bot readiness message в орендовану приватну
групу, а потім знімає screenshot і MP4 з видимого VNC desktop. Bot
token ніколи не входить у Telegram Desktop; він лише налаштовує OpenClaw. Desktop
viewer — це окрема Telegram user session, відновлена з
`--telegram-profile-archive-env <name>` або створена вручну через VNC і підтримувана
активною за допомогою `--keep-lease`.

Корисні прапорці Telegram desktop builder:

- `--lease-id <cbx_...>` повторно запускає сценарій на VM, де оператор уже ввійшов у Telegram Desktop.
- `--telegram-profile-archive-env <name>` читає base64 `.tgz` Telegram Desktop profile archive з цієї env var і відновлює його перед запуском.
- `--telegram-profile-dir <remote-path>` керує remote Telegram Desktop profile directory. Типове значення — `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` встановлює й відкриває Telegram Desktop без налаштування OpenClaw.
- `--credential-source convex --credential-role ci` використовує shared credential broker замість прямих Telegram env tokens.

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

Значення artifact `path` є відносними до каталогу маніфесту. Значення `targetPath`
є відносними шляхами під налаштованим Mantis R2/S3 artifact prefix. Publisher
відхиляє path traversal і пропускає entries, позначені `"required": false`,
коли необов’язкові previews або videos недоступні.

Підтримувані artifact kinds:

- `timeline`: детермінований screenshot сценарію, зазвичай before/after.
- `desktopScreenshot`: VNC/browser desktop screenshot.
- `motionPreview`: inline animated GIF, згенерований із desktop recording.
- `motionClip`: MP4 з обрізанням руху, який видаляє статичний початок і кінець.
- `fullVideo`: повний MP4 recording для глибокої перевірки.
- `metadata`: JSON/log sidecar.
- `report`: Markdown report.

Reusable publisher — це `scripts/mantis/publish-pr-evidence.mjs`. Workflows
викликають його з manifest, target PR, artifact target root, comment marker,
Actions artifact URL, run URL і request source. Він завантажує оголошені artifacts
до налаштованого Mantis R2/S3 bucket, будує PR-коментар із summary на початку,
inline images/previews і linked videos, а потім оновлює наявний marker
comment або створює новий. Workflows публікують у `openclaw-crabbox-artifacts`
з public URLs під `https://artifacts.openclaw.ai`. Вони передають bucket,
region і public URL values напряму. Reusable publisher потребує:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Ви також можете запустити status-reactions run напряму з PR-коментаря:

```text
@openclaw-mantis discord status reactions
```

Comment trigger навмисно вузький. Він запускається лише для pull request
comments від користувачів із write, maintain або admin access, і розпізнає
лише Discord status-reaction requests. За замовчуванням він використовує відомий bad baseline ref
і поточний PR head SHA як candidate. Maintainers можуть перевизначити будь-який
ref:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA також можна запустити з PR-коментаря:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

За замовчуванням він використовує поточний PR head SHA як candidate і запускає
`telegram-status-command`. Maintainers можуть перевизначити `candidate=...`,
`provider=aws|hetzner` і `lease=<cbx_...>`, коли їм потрібен конкретний ref або
попередньо прогрітий Crabbox desktop.

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими Mantis scenarios на основі labels, changed files і
ClawSweeper review findings.

## Життєвий цикл запуску

1. Отримати облікові дані.
2. Виділити або повторно використати VM.
3. Підготувати desktop/browser profile, коли сценарію потрібні UI evidence.
4. Підготувати чистий checkout для baseline ref.
5. Встановити dependencies і зібрати лише те, що потрібно сценарію.
6. Запустити child OpenClaw Gateway з ізольованим state directory.
7. Налаштувати live transport, provider, model і browser profile.
8. Запустити сценарій і зібрати baseline evidence.
9. Зупинити gateway і зберегти logs.
10. Підготувати candidate ref у тій самій VM.
11. Запустити той самий сценарій і зібрати candidate evidence.
12. Порівняти oracle results і visual evidence.
13. Записати Markdown, JSON, logs, screenshots і необов’язкові trace artifacts.
14. Завантажити GitHub Actions artifacts.
15. Опублікувати стислий PR або Discord status message.

Сценарій має вміти завершуватися помилкою двома різними способами:

- **Bug reproduced**: baseline failed in the expected way.
- **Harness failure**: environment setup, credentials, Discord API, browser або
  provider failed before the bug oracle was meaningful.

Фінальний report має розділяти ці випадки, щоб maintainers не плутали flaky
environment із product behavior.

## Discord MVP

Перший сценарій має цілити в Discord status reactions у guild channels, де
source reply delivery mode — `message_tool_only`.

Чому це добрий Mantis seed:

- Це видно в Discord як reactions на triggering message.
- Має сильний REST oracle через Discord message reaction state.
- Перевіряє реальний OpenClaw Gateway, Discord bot auth, message dispatch,
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
status reactions запускаються, коли `messages.statusReactions.enabled` явно
дорівнює true.

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
"message_tool"`, `ackReaction: "👀"` і явними status reactions. Oracle
опитує реальне Discord triggering message і очікує observed sequence
`👀 -> 🤔 -> 👍`. Artifacts містять `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні QA components

Mantis має будуватися на наявному private QA stack, а не починати з
нуля:

- `pnpm openclaw qa discord` уже запускає live Discord lane з driver і
  SUT bots.
- Live transport runner уже записує reports, QA evidence і
  transport-specific artifacts у `.artifacts/qa-e2e/`.
- Convex credential leases уже надають exclusive access до shared live
  transport credentials.
- Browser control service уже підтримує screenshots, snapshots,
  headless managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus для transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner поверх цих
компонентів плюс один visual evidence layer.

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

`mantis-summary.json` має бути машинозчитуваним джерелом істини. Звіт Markdown призначений для коментарів у PR і людського перегляду.

Зведення має містити:

- перевірені посилання й SHA
- transport і id сценарію
- постачальника машини та id машини або id оренди
- джерело облікових даних без секретних значень
- результат baseline
- результат candidate
- чи відтворилася помилка на baseline
- чи candidate її виправив
- шляхи до артефактів
- очищені проблеми налаштування або очищення

Знімки екрана є доказами, а не секретами. Вони все одно потребують дисципліни редагування: можуть з’явитися назви приватних каналів, імена користувачів або вміст повідомлень. Для публічних PR віддавайте перевагу посиланням на артефакти GitHub Actions замість вбудованих зображень, доки підхід до редагування не стане надійнішим.

## Браузер і VNC

Браузерний lane має два режими:

- **Headless-автоматизація**: стандартно для CI. Chrome працює з увімкненим CDP, а Playwright або браузерне керування OpenClaw захоплює знімки екрана.
- **VNC-порятунок**: увімкнений на тій самій VM, коли вхід, MFA, антиавтоматизація Discord або візуальне налагодження потребують людини.

Профіль браузера спостерігача Discord має бути достатньо сталим, щоб уникати входу під час кожного запуску, але ізольованим від особистого стану браузера. Профіль належить пулу машин Mantis, а не ноутбуку розробника.

Коли Mantis застрягає, він публікує статусне повідомлення в Discord із:

- id запуску
- id сценарію
- постачальником машини
- каталогом артефактів
- інструкціями з підключення через VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський канал і пізніше перейти до виділеного каналу Mantis.

## Машини

Mantis має віддавати перевагу AWS через Crabbox для першої віддаленої реалізації. Crabbox дає нам прогріті машини, відстеження оренди, hydration, журнали, результати й очищення. Якщо місткість AWS занадто повільна або недоступна, додайте постачальника Hetzner за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux із установленим Chrome або Chromium, придатним для desktop
- доступ CDP для браузерної автоматизації
- VNC або noVNC для порятунку
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU та пам’яті для одного OpenClaw Gateway, одного браузера й одного model run
- вихідний доступ до Discord, GitHub, постачальників моделей і брокера облікових даних

VM не має зберігати довгоживучі сирі секрети поза очікуваними сховищами облікових даних або профілів браузера.

## Секрети

Секрети зберігаються в секретах організації або репозиторію GitHub для віддалених запусків і в локальному файлі секретів під контролем оператора для локальних запусків.

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

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом для live transport credentials. Секрети GitHub завантажують брокер і fallback lanes. Workflow статусних реакцій Discord зіставляє секрети Mantis Crabbox назад зі змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`, яких очікує CLI Crabbox. Прості назви секретів GitHub `CRABBOX_*` лишаються прийнятими як fallback для сумісності.

Runner Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі постачальників
- cookies браузера
- вміст профілів автентифікації
- паролі VNC
- сирі payload облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані Discord, як-от id бота, guild, channel і message. Workflow GitHub smoke вмикає `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, поверніть його після того, як новий секрет буде збережено.

## Артефакти GitHub і коментарі PR

Workflow Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт Actions. Коли workflow запускається для звіту про помилку або fix PR, він також має публікувати відредаговані вбудовані медіа в налаштований bucket Mantis R2/S3 і upsert-коментар у цій помилці або fix PR із вбудованими знімками екрана до/після. Не публікуйте основний доказ лише в generic QA automation PR. Сирі журнали, спостережені повідомлення й інші об’ємні докази лишаються в артефакті Actions.

Production workflows мають публікувати ці коментарі через Mantis GitHub App, а не через `github-actions[bot]`. Зберігайте app id і private key як секрети GitHub Actions `MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow використовує прихований маркер як ключ upsert, оновлює цей коментар, коли токен може його редагувати, і створює новий коментар, що належить Mantis, коли старіший маркер, що належить боту, неможливо відредагувати.

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

Коли запуск завершується невдачею через збій harness, коментар має повідомляти саме це, а не натякати, що candidate зазнав невдачі.

## Примітки щодо приватного розгортання

Приватне розгортання вже може мати застосунок Mantis Discord. Повторно використайте цей застосунок замість створення ще одного, якщо він має правильні дозволи бота і його можна безпечно ротувати.

Задайте початковий канал сповіщень оператора через секрети або конфігурацію розгортання. Спершу він може вказувати на наявний канал maintainer або operations, а потім перейти до виділеного каналу Mantis, коли він з’явиться.

Не додавайте guild ids, channel ids, bot tokens, browser cookies або VNC passwords до цього документа. Зберігайте їх у секретах GitHub, брокері облікових даних або локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- id і заголовок
- transport
- required credentials
- baseline ref policy
- candidate ref policy
- патч конфігурації OpenClaw
- кроки налаштування
- stimulus
- expected baseline oracle
- expected candidate oracle
- цілі візуального захоплення
- timeout budget
- кроки очищення

Сценарії мають віддавати перевагу малим типізованим oracles:

- стан реакцій Discord для помилок реакцій
- посилання на повідомлення Discord для помилок тредингу
- thread ts Slack і стан reaction API для помилок Slack
- id повідомлень email і заголовки для помилок email
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Vision checks мають бути додатковими. Якщо API платформи може довести помилку, використовуйте API як oracle pass/fail і залишайте знімки екрана для людської впевненості.

## Розширення постачальників

Після Discord той самий runner може додати:

- Slack: реакції, треди, згадки застосунку, модальні вікна, завантаження файлів.
- Email: автентифікація Gmail і трединг повідомлень за допомогою `gog`, коли connectors недостатньо.
- WhatsApp: QR-вхід, повторна ідентифікація, доставка повідомлень, медіа, реакції.
- Telegram: gate для групових згадок, команди, реакції там, де доступні.
- Matrix: зашифровані кімнати, зв’язки тредів або відповідей, відновлення після перезапуску.

Кожен transport має мати один дешевий smoke-сценарій і один або більше сценаріїв класу помилок. Дорогі візуальні сценарії мають лишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли наявний бот Mantis використовується повторно?
- Чи має вхід браузера спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис або лише bot-readable REST evidence для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування команди maintainer?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
