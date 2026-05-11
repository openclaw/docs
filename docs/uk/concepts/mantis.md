---
read_when:
    - Створення або запуск живої візуальної перевірки якості для помилок OpenClaw
    - Додавання перевірки до та після для запиту на злиття
    - Додавання сценаріїв транспорту в реальному часі для Discord, Slack, WhatsApp або інших
    - Налагодження запусків QA, що потребують знімків екрана, автоматизації браузера або доступу через VNC
summary: Mantis — це система візуальної наскрізної перевірки для відтворення помилок OpenClaw на робочих транспортних каналах, фіксації доказів до і після та прикріплення артефактів до PR.
title: Богомол
x-i18n:
    generated_at: "2026-05-11T20:31:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — це система наскрізної перевірки OpenClaw для багів, яким потрібні реальне
середовище виконання, реальний транспорт і видимий доказ. Вона запускає сценарій
проти відомого проблемного рефа, збирає докази, запускає той самий сценарій проти
кандидатного рефа й публікує порівняння як артефакти, які мейнтейнер може
переглянути з PR або з локальної команди.

Mantis починає з Discord, бо Discord дає нам високоцінний перший напрям:
реальну автентифікацію бота, реальні канали гільдії, реакції, треди, нативні
команди й браузерний UI, де люди можуть візуально підтвердити те, що показав
транспорт.

## Цілі

- Відтворити баг із GitHub issue або PR з тією самою формою транспорту, яку
  бачать користувачі.
- Захопити артефакт **до** на базовому рефі перед застосуванням виправлення.
- Захопити артефакт **після** на кандидатному рефі після застосування виправлення.
- Використовувати детермінований оракул, коли це можливо, наприклад читання
  реакції через Discord REST або перевірку транскрипту каналу.
- Захоплювати знімки екрана, коли баг має видиму поверхню UI.
- Запускатися локально з CLI під керуванням агента й віддалено з GitHub.
- Зберігати достатньо стану машини для порятунку через VNC, коли вхід,
  браузерна автоматизація або автентифікація провайдера застрягають.
- Публікувати стислий статус у операторський канал Discord, коли запуск
  заблокований, потребує ручної допомоги через VNC або завершується.

## Нецілі

- Mantis не є заміною модульних тестів. Запуск Mantis зазвичай має перетворитися
  на менший регресійний тест після того, як виправлення зрозуміле.
- Mantis не є звичайним швидким CI-гейтом. Він повільніший, використовує живі
  облікові дані й призначений для багів, де живе середовище має значення.
- Mantis не має вимагати людини для нормальної роботи. Ручний VNC — це шлях
  порятунку, а не штатний сценарій.
- Mantis не зберігає сирі секрети в артефактах, логах, знімках екрана,
  Markdown-звітах або коментарях PR.

## Власність

Mantis живе в стеку QA OpenClaw.

- OpenClaw володіє середовищем виконання сценаріїв, транспортними адаптерами,
  схемою доказів і локальним CLI у `pnpm openclaw qa mantis`.
- QA Lab володіє частинами live-транспортного стенда, помічниками захоплення
  браузера й записувачами артефактів.
- Crabbox володіє прогрітими Linux-машинами, коли потрібна віддалена VM.
- GitHub Actions володіє віддаленою точкою входу workflow і зберіганням артефактів.
- ClawSweeper володіє маршрутизацією коментарів GitHub: розбором команд
  мейнтейнерів, dispatch workflow і публікацією фінального коментаря PR.
- Агенти OpenClaw запускають Mantis через Codex, коли сценарію потрібні агентне
  налаштування, debugging або звітування про застряглий стан.

Ця межа тримає знання транспорту в OpenClaw, планування машин у Crabbox, а клей
workflow мейнтейнерів у ClawSweeper.

## Форма команди

Перша локальна команда перевіряє бота Discord, гільдію, канал, надсилання
повідомлення, надсилання реакції та шлях артефактів:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальний runner для до й після приймає таку форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner створює відокремлені базове й кандидатне робочі дерева в директорії
виводу, встановлює залежності, будує кожен реф, запускає сценарій з
`--allow-failures`, а потім записує `baseline/`, `candidate/`, `comparison.json`
і `mantis-report.md`. Для першого сценарію Discord успішна перевірка означає,
що базовий статус — `fail`, а кандидатний статус — `pass`.

Другий Discord-зонд до/після націлений на вкладення в тредах:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Цей сценарій публікує батьківське повідомлення через driver-бота, створює
реальний тред Discord, викликає дію OpenClaw `message.thread-reply` з
repo-local `filePath`, а потім опитує тред щодо відповіді SUT і імені файла
вкладення. Базовий знімок екрана показує відповідь без вкладення; кандидатний
знімок екрана показує очікуване вкладення `mantis-thread-report.md`.

Перша примітива VM/браузера — це desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Вона орендує або повторно використовує desktop-машину Crabbox, запускає видимий
браузер усередині VNC-сесії, захоплює desktop, витягує артефакти назад до
локальної директорії виводу й записує команду повторного підключення у звіт.
Команда за замовчуванням використовує провайдера Hetzner, бо це перший
провайдер із робочим desktop/VNC-покриттям у напрямі Mantis. Перевизначте його
через `--provider`, `--crabbox-bin` або `OPENCLAW_MANTIS_CRABBOX_PROVIDER`, коли
запускаєте проти іншого флоту Crabbox.

Корисні прапорці desktop smoke:

- `--lease-id <cbx_...>` або `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно використовує прогрітий desktop.
- `--browser-url <url>` змінює сторінку, відкриту у видимому браузері.
- `--html-file <path>` рендерить repo-local HTML-артефакт у видимому браузері. Mantis використовує це, щоб захопити згенеровану timeline статусних реакцій Discord через реальний desktop Crabbox.
- `--browser-profile-dir <remote-path>` повторно використовує віддалений Chrome user-data-dir, щоб постійний desktop Mantis міг залишатися залогіненим між запусками. Використовуйте це для довгоживучого профілю переглядача Discord Web.
- `--browser-profile-archive-env <name>` відновлює base64 `.tgz` архів Chrome user-data-dir з іменованої змінної середовища перед запуском браузера. Використовуйте це для залогінених свідків, таких як Discord Web. Стандартна env var — `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` керує тривалістю MP4-захоплення. Використовуйте довшу тривалість для повільних залогінених вебзастосунків, яким потрібен час, щоб стабілізуватися.
- `--keep-lease` або `OPENCLAW_MANTIS_KEEP_VM=1` залишає новостворену успішну оренду відкритою для інспекції через VNC. Невдалі запуски за замовчуванням залишають оренду, якщо її було створено, щоб оператор міг повторно підключитися.
- `--class`, `--idle-timeout` і `--ttl` налаштовують розмір машини та час життя оренди.

Для доказів Discord Web Mantis використовує окремий обліковий запис переглядача
замість токена бота. Live-сценарій Discord API залишається оракулом: він створює
реальний тред, надсилає `thread-reply` SUT і перевіряє вкладення через Discord
REST. Коли встановлено `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарій
також записує артефакт URL Discord Web. Коли встановлено
`OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, він залишає цей тред доступним достатньо
довго, щоб залогінений браузер міг відкрити й записати його.

GitHub workflow відкриває URL кандидатного треда в Discord Web, захоплює знімок
екрана, записує MP4 і генерує обрізаний за рухом GIF-перегляд, коли доступні
media-інструменти Crabbox. Віддавайте перевагу постійному шляху профілю
переглядача, налаштованому через `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, бо
повні профілі Chrome можуть перевищити ліміт розміру секретів GitHub. Для малих
або bootstrap-профілів workflow також може відновити base64 `.tgz` архів з
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Якщо не налаштовано жодне
джерело профілю, workflow все одно публікує детерміновані базові/кандидатні
знімки екрана вкладення й логує повідомлення, що залогінений свідок Discord Web
був пропущений.

Перша повна desktop-примітива транспорту — це Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Вона орендує або повторно використовує desktop-машину Crabbox, синхронізує
поточний checkout у VM, запускає `pnpm openclaw qa slack` усередині цієї VM,
відкриває Slack Web у VNC-браузері, захоплює видимий desktop і копіює як
артефакти Slack QA, так і знімок екрана VNC назад до локальної директорії
виводу. Це перша форма Mantis, де Gateway OpenClaw SUT і браузер живуть
усередині тієї самої Linux desktop VM.

З `--gateway-setup` команда готує постійний disposable OpenClaw home у
`$HOME/.openclaw-mantis/slack-openclaw`, патчить конфігурацію Slack Socket Mode
для вибраного каналу, запускає `openclaw gateway run` на порту `38973` і
залишає Chrome запущеним у VNC-сесії. Це режим "залиш мені Linux desktop зі
Slack і запущеним claw"; bot-to-bot напрям Slack QA залишається стандартним,
коли `--gateway-setup` пропущено.

Обов’язкові входи для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленого модельного напряму. Якщо локально
  встановлено лише `OPENAI_API_KEY`, Mantis мапить його на `OPENCLAW_LIVE_OPENAI_KEY`
  перед викликом Crabbox, щоб forwarding env `OPENCLAW_*` у Crabbox міг перенести
  його у VM.

З `--gateway-setup --credential-source convex` Mantis орендує облікові дані
Slack SUT зі спільного пулу перед створенням VM і передає орендований channel id,
Socket Mode app token і bot token як runtime env `OPENCLAW_MANTIS_SLACK_*`
усередині desktop. Це тримає GitHub workflows тонкими: їм потрібен лише секрет
брокера Convex, а не сирі Slack bot або app tokens.

Корисні прапорці Slack desktop:

- `--lease-id <cbx_...>` повторно запускає проти машини, де оператор уже залогінився в Slack Web через VNC.
- `--gateway-setup` запускає постійний OpenClaw Slack Gateway у VM замість лише запуску bot-to-bot напряму QA.
- `--keep-lease` залишає Gateway VM відкритою для інспекції через VNC після успіху; `--no-keep-lease` зупиняє її після збору артефактів.
- `--slack-url <url>` відкриває конкретний URL Slack Web. Без нього Mantis виводить `https://app.slack.com/client/<team>/<channel>` зі Slack `auth.test`, коли доступний bot token SUT.
- `--slack-channel-id <id>` керує allowlist каналу Slack, який використовує gateway setup.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome усередині VM. Стандартне значення — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, тому ручний вхід у Slack Web переживає повторні запуски на тій самій оренді.
- `--credential-source convex --credential-role ci` використовує спільний пул облікових даних замість прямих env-токенів Slack.
- `--provider-mode`, `--model`, `--alt-model` і `--fast` передаються далі в Slack live lane.

GitHub smoke workflow — `Mantis Discord Smoke`. GitHub workflow до й після для
першого реального сценарію — `Mantis Discord Status Reactions`. Він приймає:

- `baseline_ref`: реф, який має відтворити queued-only поведінку.
- `candidate_ref`: реф, який має показати `queued -> thinking -> done`.

Він checkout workflow harness ref, будує окремі базове й кандидатне робочі
дерева, запускає `discord-status-reactions-tool-only` проти кожного робочого
дерева й завантажує `baseline/`, `candidate/`, `comparison.json` і
`mantis-report.md` як артефакти Actions. Він також рендерить timeline HTML
кожного напряму в desktop-браузері Crabbox і публікує ці знімки екрана VNC поруч
із детермінованими PNG timeline у коментарі PR. Той самий коментар вбудовує легкі
обрізані за рухом GIF-перегляди, згенеровані `crabbox media preview`, посилається
на відповідні обрізані за рухом MP4-кліпи й зберігає повні desktop MP4-файли для
глибокої інспекції. Знімки екрана залишаються inline для швидкого перегляду.
Workflow збирає Crabbox CLI з `openclaw/crabbox` main, щоб використовувати
поточні прапорці оренди desktop/браузера до того, як буде випущено наступний
binary release Crabbox.

`Mantis Scenario` — це універсальна ручна точка входу. Вона приймає
`scenario_id`, `candidate_ref`, необов’язковий `baseline_ref` і необов’язковий
`pr_number`, а потім dispatch workflow, яким володіє сценарій. Wrapper навмисно
тонкий: scenario workflows усе ще володіють своїм налаштуванням транспорту,
обліковими даними, класом VM, очікуваним оракулом і маніфестом артефактів.

`Mantis Slack Desktop Smoke` є першим workflow для VM зі Slack. Він перевіряє
довірений candidate ref в окремому worktree, орендує робочий стіл Linux у
Crabbox, запускає `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup`
для цього кандидата, відкриває Slack Web у браузері VNC, записує робочий стіл,
генерує обрізаний за рухом preview через `crabbox media preview`, завантажує
повний каталог артефактів і, за потреби, публікує inline-коментар із доказами в
цільовому PR. За замовчуванням для оренди робочого столу використовується AWS, а
також доступний ручний вхід provider, щоб оператори могли перемкнутися на
Hetzner, коли ємність AWS повільна або недоступна. Використовуйте цю лінію, коли
потрібен «робочий стіл Linux зі Slack і запущеним OpenClaw», а не лише
транскрипт Slack між ботами.

`Mantis Telegram Live` обгортає наявну live QA-лінію Telegram у той самий
pipeline доказів для PR. Він перевіряє довірений candidate ref в окремому
worktree, запускає `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, записує маніфест `mantis-evidence.json` із підсумку
Telegram QA та артефакта спостереженого повідомлення, рендерить відредагований
HTML транскрипту через браузер на робочому столі Crabbox, генерує обрізаний за
рухом GIF через `crabbox media preview` і публікує inline-коментар із доказами в
PR, коли доступний номер PR. Ця лінія є візуалізацією транскрипту, а не доказом
Telegram Web із виконаним входом: Telegram Bot API дає стабільні докази live
повідомлень, але стан входу в Telegram Web не потрібен для звичайної
автоматизації Mantis.

`Mantis Telegram Desktop Proof` — це agentic-обгортка before/after для нативного
Telegram Desktop. Maintainer може запустити її з коментаря PR через
`@Mantis telegram desktop proof`, з UI Actions із довільними інструкціями або
через загальний dispatcher `Mantis Scenario`. Workflow передає PR, baseline ref,
candidate ref та інструкції maintainer до Codex. Агент читає PR, вирішує, яка
видима в Telegram поведінка доводить зміну, запускає лінію доказів Crabbox
Telegram Desktop з реальним користувачем для baseline і candidate, ітерує, доки
нативні GIF не стануть корисними, записує парні артефакти `motionPreview` у
`mantis-evidence.json`, завантажує bundle і публікує таблицю доказів PR у 2
колонки, коли доступний номер PR.

Для Telegram desktop setup за участі людини використовуйте builder сценаріїв:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder орендує або повторно використовує робочий стіл Crabbox, встановлює
нативний Linux-бінарник Telegram Desktop, за потреби відновлює архів user
session, налаштовує OpenClaw з орендованим токеном Telegram SUT bot, запускає
`openclaw gateway run` на порту `38974`, публікує повідомлення готовності driver
bot в орендовану приватну групу, а потім захоплює screenshot і MP4 з видимого
робочого столу VNC. Bot token ніколи не входить у Telegram Desktop; він лише
налаштовує OpenClaw. Desktop viewer — це окрема user session Telegram, відновлена
з `--telegram-profile-archive-env <name>` або створена вручну через VNC і
підтримувана активною через `--keep-lease`.

Корисні прапорці Telegram desktop builder:

- `--lease-id <cbx_...>` повторно запускає сценарій на VM, де оператор уже увійшов у Telegram Desktop.
- `--telegram-profile-archive-env <name>` читає base64-архів `.tgz` профілю Telegram Desktop із цієї env var і відновлює його перед запуском.
- `--telegram-profile-dir <remote-path>` керує віддаленим каталогом профілю Telegram Desktop. За замовчуванням використовується `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` встановлює й відкриває Telegram Desktop без налаштування OpenClaw.
- `--credential-source convex --credential-role ci` використовує спільний credential broker замість прямих Telegram env tokens.

Кожен сценарій, що публікує PR, записує `mantis-evidence.json` поруч зі своїм
звітом. Ця schema є handoff між кодом сценарію та коментарями GitHub:

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

Значення artifact `path` є відносними до каталогу маніфесту. Значення
`targetPath` є відносними шляхами під publish-каталогом гілки `qa-artifacts`.
Publisher відхиляє path traversal і пропускає записи з позначкою
`"required": false`, коли optional previews або videos недоступні.

Підтримувані види артефактів:

- `timeline`: детермінований screenshot сценарію, зазвичай before/after.
- `desktopScreenshot`: screenshot робочого столу VNC/browser.
- `motionPreview`: inline animated GIF, згенерований із запису робочого столу.
- `motionClip`: обрізаний за рухом MP4, що прибирає статичний lead-in і tail.
- `fullVideo`: повний MP4-запис для глибокої перевірки.
- `metadata`: JSON/log sidecar.
- `report`: Markdown-звіт.

Reusable publisher — це `scripts/mantis/publish-pr-evidence.mjs`. Workflows
викликають його з маніфестом, цільовим PR, target root `qa-artifacts`, comment
marker, Actions artifact URL, run URL і request source. Він копіює оголошені
артефакти до гілки `qa-artifacts`, будує PR-коментар із summary на початку,
inline images/previews і пов’язаними videos, а потім оновлює наявний marker
comment або створює новий.

Ви також можете запустити status-reactions run напряму з коментаря PR:

```text
@Mantis discord status reactions
```

Comment trigger навмисно вузький. Він запускається лише на коментарях pull
request від користувачів із доступом write, maintain або admin і розпізнає лише
запити Discord status-reaction. За замовчуванням він використовує відомий
поганий baseline ref і поточний PR head SHA як candidate. Maintainers можуть
перевизначити будь-який ref:

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA також можна запустити з коментаря PR:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

За замовчуванням він використовує поточний PR head SHA як candidate і запускає
`telegram-status-command`. Maintainers можуть перевизначити `candidate=...`,
`provider=aws|hetzner` і `lease=<cbx_...>`, коли їм потрібен конкретний ref або
заздалегідь прогрітий робочий стіл Crabbox.

Приклади команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Перша команда явна й зосереджена на сценарії. Друга згодом може зіставляти PR
або issue з рекомендованими сценаріями Mantis за labels, зміненими файлами та
findings review від ClawSweeper.

## Життєвий цикл запуску

1. Отримати credentials.
2. Виділити або повторно використати VM.
3. Підготувати desktop/browser profile, коли сценарію потрібні UI-докази.
4. Підготувати чистий checkout для baseline ref.
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
15. Опублікувати стислий status message у PR або Discord.

Сценарій має вміти зазнавати failure двома різними способами:

- **Баг відтворено**: baseline failed очікуваним способом.
- **Failure harness**: environment setup, credentials, Discord API, browser або
  provider failed до того, як bug oracle став значущим.

Фінальний звіт має розділяти ці випадки, щоб maintainers не плутали flaky
environment із поведінкою продукту.

## Discord MVP

Перший сценарій має бути спрямований на Discord status reactions у guild
channels, де source reply delivery mode дорівнює `message_tool_only`.

Чому це добрий seed для Mantis:

- Це видно в Discord як reactions на triggering message.
- Він має сильний REST oracle через Discord message reaction state.
- Він перевіряє реальний OpenClaw Gateway, Discord bot auth, message dispatch,
  source reply delivery mode, status reaction state і model turn lifecycle.
- Він достатньо вузький, щоб перша реалізація залишалась чесною.

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
lifecycle transition у tool-only mode. Candidate evidence має показувати, що
lifecycle status reactions запускаються, коли `messages.statusReactions.enabled`
явно дорівнює true.

Executable first slice — це opt-in Discord live QA scenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Він налаштовує SUT із always-on guild handling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` і явними status reactions. Oracle опитує
реальне triggering message у Discord і очікує спостережену послідовність
`👀 -> 🤔 -> 👍`. Артефакти містять `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` і
`discord-status-reactions-tool-only-timeline.png`.

## Наявні частини QA

Mantis має будуватися на наявному private QA stack, а не починатися з нуля:

- `pnpm openclaw qa discord` уже запускає live Discord lane з driver і SUT bots.
- Live transport runner уже записує reports і observed-message artifacts у `.artifacts/qa-e2e/`.
- Convex credential leases уже надають ексклюзивний доступ до shared live transport credentials.
- Browser control service уже підтримує screenshots, snapshots, headless managed profiles і remote CDP profiles.
- QA Lab уже має debugger UI і bus для transport-shaped testing.

Перша реалізація Mantis може бути тонким before/after runner поверх цих частин
плюс один visual evidence layer.

## Модель доказів

Кожен run записує стабільний каталог artifact:

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

`mantis-summary.json` має бути machine-readable source of truth. Markdown-звіт
призначений для PR comments і human review.

Підсумок має містити:

- refs і SHAs, які тестувалися
- transport і scenario id
- machine provider і machine id або lease id
- credential source без secret values
- baseline result
- candidate result
- чи баг відтворився на baseline
- чи candidate виправив його
- artifact paths
- sanitized setup або cleanup issues

Знімки екрана є доказами, а не секретами. Вони все одно потребують дисципліни редагування:
можуть з’явитися назви приватних каналів, імена користувачів або вміст повідомлень. Для публічних PR
віддавайте перевагу посиланням на артефакти GitHub Actions замість вбудованих зображень, доки підхід до редагування
не стане надійнішим.

## Браузер і VNC

Браузерний напрям має два режими:

- **Headless-автоматизація**: типовий режим для CI. Chrome працює з увімкненим CDP, а
  Playwright або браузерне керування OpenClaw захоплює знімки екрана.
- **VNC-рятування**: вмикається на тій самій VM, коли вхід, MFA, антиавтоматизація Discord
  або візуальне налагодження потребують людини.

Профіль браузера спостерігача Discord має бути достатньо сталим, щоб не
входити в систему під час кожного запуску, але ізольованим від особистого стану браузера. Профіль
належить до пулу машин Mantis, а не до ноутбука розробника.

Коли Mantis застрягає, він публікує статусне повідомлення Discord з:

- ідентифікатором запуску
- ідентифікатором сценарію
- провайдером машини
- каталогом артефактів
- інструкціями підключення VNC або noVNC, якщо доступні
- коротким текстом блокера

Перше приватне розгортання може публікувати ці повідомлення в наявний операторський
канал і пізніше перейти до виділеного каналу Mantis.

## Машини

Mantis має надавати перевагу AWS через Crabbox для першої віддаленої реалізації.
Crabbox надає нам прогріті машини, відстеження оренди, гідратацію, журнали, результати та
очищення. Якщо потужності AWS надто повільні або недоступні, додайте провайдера Hetzner
за тим самим інтерфейсом машин.

Мінімальні вимоги до VM:

- Linux з інсталяцією Chrome або Chromium, здатною працювати з робочим столом
- доступ CDP для браузерної автоматизації
- VNC або noVNC для рятування
- Node 22 і pnpm
- checkout OpenClaw і кеш залежностей
- кеш браузера Playwright Chromium, коли використовується Playwright
- достатньо CPU і пам’яті для одного OpenClaw Gateway, одного браузера й одного запуску моделі
- вихідний доступ до Discord, GitHub, провайдерів моделей і брокера облікових даних

VM не має зберігати довгоживучі сирі секрети поза очікуваними сховищами облікових даних або
профілю браузера.

## Секрети

Секрети зберігаються в секретах організації або репозиторію GitHub для віддалених запусків і в
локальному файлі секретів під керуванням оператора для локальних запусків.

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

У довгостроковій перспективі пул облікових даних Convex має залишатися звичайним джерелом живих
транспортних облікових даних. Секрети GitHub завантажують брокер і резервні напрями.
Робочий процес статусних реакцій Discord зіставляє секрети Mantis Crabbox назад із
змінними середовища `CRABBOX_COORDINATOR` і `CRABBOX_COORDINATOR_TOKEN`,
які очікує CLI Crabbox. Звичайні назви секретів GitHub `CRABBOX_*` залишаються
прийнятними як резерв для сумісності.

Runner Mantis ніколи не має друкувати:

- токени ботів Discord
- API-ключі провайдерів
- cookies браузера
- вміст профілів автентифікації
- паролі VNC
- сирі payload-и облікових даних

Публічні завантаження артефактів також мають редагувати цільові метадані Discord, як-от ідентифікатори бота,
guild, каналу та повідомлення. Робочий процес GitHub smoke вмикає
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` саме з цієї причини.

Якщо токен випадково вставлено в issue, PR, чат або журнал, ротируйте його
після збереження нового секрету.

## Артефакти GitHub і коментарі PR

Робочі процеси Mantis мають завантажувати повний пакет доказів як короткоживучий артефакт Actions.
Коли робочий процес запускається для звіту про баг або PR із виправленням, він також має
публікувати відредаговані PNG-знімки екрана в гілку `qa-artifacts` і оновлювати або створювати
коментар у цьому багу чи PR із виправленням із вбудованими знімками екрана до/після. Не публікуйте
основний доказ лише в загальному PR QA-автоматизації. Сирі журнали, спостережені
повідомлення та інші об’ємні докази залишаються в артефакті Actions.

Виробничі робочі процеси мають публікувати ці коментарі через Mantis GitHub App, а не
через `github-actions[bot]`. Зберігайте app id і приватний ключ як секрети GitHub Actions
`MANTIS_GITHUB_APP_ID` і `MANTIS_GITHUB_APP_PRIVATE_KEY`.
Робочий процес використовує прихований маркер як ключ upsert, оновлює цей
коментар, коли токен може його редагувати, і створює новий коментар від імені Mantis, коли
старіший маркер, що належить боту, неможливо відредагувати.

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

Коли запуск завершується невдачею через збій harness, коментар має прямо це сказати,
а не натякати, що candidate не пройшов.

## Нотатки приватного розгортання

Приватне розгортання може вже мати застосунок Mantis Discord. Повторно використайте цей
застосунок замість створення ще одного, якщо він має потрібні дозволи бота
і його можна безпечно ротувати.

Задайте початковий канал сповіщень оператора через секрети або конфігурацію розгортання.
Спочатку він може вказувати на наявний канал мейнтейнерів або операційний канал,
а потім перейти до виділеного каналу Mantis, коли такий з’явиться.

Не розміщуйте guild ids, channel ids, токени ботів, cookies браузера або паролі VNC
у цьому документі. Зберігайте їх у секретах GitHub, брокері облікових даних або
локальному сховищі секретів оператора.

## Додавання сценарію

Сценарій Mantis має оголошувати:

- ідентифікатор і назву
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
- бюджет timeout
- кроки очищення

Сценарії мають надавати перевагу малим типізованим оракулам:

- стан реакцій Discord для багів реакцій
- посилання на повідомлення Discord для багів потоків
- Slack thread ts і стан API реакцій для багів Slack
- ідентифікатори й заголовки email-повідомлень для email-багів
- знімки екрана браузера, коли UI є єдиним надійним спостережуваним сигналом

Перевірки зору мають бути додатковими. Якщо API платформи може довести баг, використовуйте
API як оракул pass/fail і залишайте знімки екрана для впевненості людини.

## Розширення провайдерів

Після Discord той самий runner може додати:

- Slack: реакції, потоки, згадки застосунку, модальні вікна, завантаження файлів.
- Email: автентифікацію Gmail і потоки повідомлень із використанням `gog`, коли connector-и недостатні.
- WhatsApp: QR-вхід, повторну ідентифікацію, доставку повідомлень, медіа, реакції.
- Telegram: gating групових згадок, команди, реакції, де доступно.
- Matrix: зашифровані кімнати, відносини thread або reply, відновлення після перезапуску.

Кожен транспорт має мати один дешевий smoke-сценарій і один або більше сценаріїв класів багів.
Дорогі візуальні сценарії мають залишатися opt-in.

## Відкриті питання

- Який бот Discord має бути driver, а який SUT, коли
  наявний бот Mantis використовується повторно?
- Чи має вхід браузера спостерігача використовувати людський обліковий запис Discord, тестовий обліковий запис
  або лише доступні для бота REST-докази для першої фази?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати Mantis замість очікування
  команди мейнтейнера?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням для публічних PR?
