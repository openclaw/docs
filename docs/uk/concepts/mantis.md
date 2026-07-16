---
read_when:
    - Створення або запуск візуального QA в реальному середовищі для помилок OpenClaw
    - Додавання перевірки до та після для запиту на злиття
    - Додавання сценаріїв із Discord, Slack, WhatsApp або іншими транспортами реального часу
    - Запуск цільової перевірки Control UI у браузері для референсу-кандидата
    - Налагодження запусків QA, які потребують знімків екрана, автоматизації браузера або доступу через VNC
summary: Mantis збирає візуальні наскрізні докази для порівняння транспортів у реальному середовищі та цільових браузерних перевірок лише для кандидата, а потім долучає артефакти до PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T17:43:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis публікує візуальні докази CI та коментар до PR щодо поведінки OpenClaw.
Сценарії з реальним транспортом порівнюють завідомо несправну базову версію з посиланням на версію-кандидат;
натомість сфокусовані браузерні лінії можуть перевіряти одного кандидата за допомогою детермінованого
імітаційного транспорту. Спочатку було випущено Discord із реальною автентифікацією бота, каналами сервера,
реакціями, гілками та браузерним засвідченням. Також існують лінії для Slack, Telegram і сфокусованого чату Control
UI; WhatsApp і Matrix не реалізовано.

## Відповідальність

- OpenClaw (`extensions/qa-lab/src/mantis/*`): середовище виконання сценаріїв, `pnpm openclaw qa mantis <command>` CLI, схема доказів.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): середовище перевірки реального транспорту, боти драйвера/SUT, засоби запису звітів/доказів.
- Crabbox (`openclaw/crabbox`): прогріті машини Linux, оренди, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): віддалені точки входу, зберігання артефактів.
- ClawSweeper: аналізує команди супровідників у PR, запускає робочі процеси, публікує підсумковий коментар до PR.

## Команди CLI

Усі команди є `pnpm openclaw qa mantis <command>` і визначені в
`extensions/qa-lab/src/mantis/cli.ts`. Під час збирання/виконання потрібен `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
(вбудовані робочі процеси задають `OPENCLAW_BUILD_PRIVATE_QA=1` і
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` перед збиранням).

| Команда                         | Призначення                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Перевіряє, чи може Discord-бот Mantis бачити сервер/канал, публікувати повідомлення та додавати реакції.                                                                                 |
| `run`                           | Виконує сценарій «до/після» для базового посилання та посилання на кандидата (лише Discord).                                                                           |
| `desktop-browser-smoke`         | Орендує/повторно використовує робочий стіл Crabbox, відкриває видимий браузер, робить знімок екрана та відео.                                                                        |
| `slack-desktop-smoke`           | Орендує/повторно використовує робочий стіл Crabbox, запускає в ньому QA Slack, відкриває Slack Web, збирає докази.                                                                  |
| `telegram-desktop-builder`      | Орендує/повторно використовує робочий стіл Crabbox, установлює Telegram Desktop, за потреби налаштовує Gateway OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Загальне захоплення робочого столу Crabbox із необов’язковими перевірками розуміння зображень; `visual-driver` — частина драйвера, запущена під `crabbox record --while`. |

Кожна команда приймає `--repo-root <path>` і `--output-dir <path>`; команди Crabbox
також приймають `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` і `--keep-lease`. Якщо не зазначено інше, локальними типовими значеннями CLI
для постачальника/класу є `hetzner`/`beast`; робочі процеси CI
зазвичай перевизначають обидва.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Викликає Discord REST API (`https://discord.com/api/v10`), щоб отримати користувача
бота, сервер, канали сервера й цільовий канал, перевіряє, що
канал належить серверу, а потім (якщо не вказано `--skip-post`) публікує повідомлення та
додає реакцію `👀`. Записує `mantis-discord-smoke-summary.json` і
`mantis-discord-smoke-report.md`.

Порядок визначення токена: значення `--token-file`, потім `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(перевизначається через `--token-env`), потім файл, названий у `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(перевизначається через `--token-file-env`). Ідентифікатори сервера/каналу надходять із
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (перевизначаються через
`--guild-id` / `--channel-id`) і мають бути 17–20-значними snowflake-ідентифікаторами Discord. Задайте
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, щоб замінити ідентифікатори
й назви бота/сервера/каналу/повідомлення на `<redacted>` в опублікованому підсумку та звіті.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` наразі приймає лише `discord`. `--scenario` — один із двох
вбудованих ідентифікаторів, кожен із власним типовим базовим посиланням та очікуваними позначками «до/після»
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Сценарій                                   | Типова базова версія                           | Очікування для базової версії                         | Очікування для кандидата            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | відповідь у гілці не містить вкладення `filePath` | відповідь у гілці містить його     |

Типовим значенням `--candidate` є `HEAD`. Інші прапорці: `--credential-source`
(типове значення `convex`), `--credential-role` (типове значення `ci`), `--provider-mode`
(типове значення `live-frontier`), `--fast` (типово ввімкнено), `--skip-install`, `--skip-build`.

Засіб запуску створює відокремлені робочі копії `git worktree` для базової версії та
кандидата в `<output-dir>/worktrees/`, запускає `pnpm install`/`pnpm build` у
кожній із них (якщо не пропущено), а потім запускає
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
для кожного робочого дерева. Кожна лінія записує `discord-qa-reaction-timelines.json`
разом із парою `<scenario-id>-timeline.html`/`.png`; засіб запуску копіює ці
докази назад у `baseline/`/`candidate/`, записує `comparison.json`,
`mantis-report.md` і `mantis-evidence.json` у каталог виводу та
завершується з ненульовим кодом, якщо порівняння не пройдено (базова версія `fail` і кандидат
`pass`).

Другий сценарій Discord (`discord-thread-reply-filepath-attachment`) публікує
батьківське повідомлення за допомогою бота-драйвера, створює реальну гілку, викликає дію SUT
`message.thread-reply` із локальним для репозиторію `filePath`, а потім опитує
гілку щодо відповіді та назви файла вкладення. Очікується вкладення
з назвою `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Орендує або повторно використовує робочий стіл Crabbox, запускає браузер у сеансі VNC,
спрямований на `--browser-url` (типове значення `https://openclaw.ai`) або відтворений
`--html-file`, очікує, робить знімок екрана за допомогою `scrot`, за потреби записує MP4 за допомогою
`ffmpeg` і синхронізує через rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
назад до `--output-dir`.

Прапорці:

- `--lease-id <cbx_...>` повторно використовує прогрітий робочий стіл замість створення нового.
- `--browser-profile-dir <remote-path>` повторно використовує віддалений каталог даних користувача Chrome, щоб постійний робочий стіл залишався авторизованим між запусками (використовується для довготривалого профілю переглядача Discord Web).
- `--browser-profile-archive-env <name>` перед запуском відновлює з цієї змінної середовища закодований у base64 архів профілю Chrome `.tgz` (типове значення `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); використовується для авторизованих засвідчень, як-от Discord Web.
- `--video-duration <seconds>` керує тривалістю запису MP4 (типове значення 10 с).
- `--keep-lease` (або `OPENCLAW_MANTIS_KEEP_VM=1`) залишає створену цим запуском оренду відкритою для перевірки через VNC; невдалі запуски, що створили оренду, також типово залишають її відкритою.

Для доказів Discord Web Mantis використовує окремий обліковий запис переглядача, а не токен
бота. Оракул Discord REST (через `qa discord`) залишається авторитетним джерелом; коли
задано `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарій також записує
артефакт URL Discord Web, а `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` залишає
гілку відкритою достатньо довго, щоб браузер міг її відкрити.

Робочий процес GitHub надає перевагу постійному профілю переглядача через
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (повні архіви профілів можуть перевищувати
обмеження GitHub на розмір секрету); для малих/початкових профілів натомість можна відновити
закодований у base64 `.tgz` із `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Якщо
жодне джерело не налаштовано, робочий процес однаково публікує детерміновані
знімки екрана базової версії/кандидата та записує в журнал, що авторизоване засвідчення
пропущено.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Орендує або повторно використовує робочий стіл Crabbox, синхронізує робочу копію з віртуальною машиною, запускає
`pnpm openclaw qa slack` у ній, відкриває Slack Web у браузері VNC,
захоплює робочий стіл і копіює локально як артефакти QA Slack (`slack-qa/`), так і
знімок екрана/відео VNC. Це єдиний варіант Mantis, у якому
Gateway SUT і браузер працюють в одній віртуальній машині.

З `--gateway-setup` команда створює постійний одноразовий домашній каталог OpenClaw
у `$HOME/.openclaw-mantis/slack-openclaw` у віртуальній машині, виправляє конфігурацію Slack
Socket Mode для цільового каналу, запускає
`openclaw gateway run --dev --allow-unconfigured --port 38973` і залишає
Chrome запущеним у сеансі VNC; без `--gateway-setup` натомість запускається звичайна
лінія QA Slack «бот-до-бота».

Обов’язкові змінні середовища для `--credential-source env` (локальне типове значення — `env`; типове значення
ролі — `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленої лінії моделі (якщо локально задано лише `OPENAI_API_KEY`,
  Mantis копіює його до `OPENCLAW_LIVE_OPENAI_KEY` перед
  викликом Crabbox)

З `--credential-source convex` Mantis орендує облікові дані SUT Slack зі
спільного пулу перед створенням віртуальної машини та передає ідентифікатор каналу, токен застосунку й
токен бота до віртуальної машини як змінні середовища `OPENCLAW_MANTIS_SLACK_*`, тому робочим процесам GitHub
потрібен лише секрет брокера Convex, а не необроблені токени Slack.

Інші прапорці: `--slack-url <url>` відкриває конкретний URL (інакше Mantis виводить
`https://app.slack.com/client/<team>/<channel>` із `auth.test`);
`--slack-channel-id <id>` задає канал списку дозволених Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome
у віртуальній машині (типове значення `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` запускає нативні сценарії схвалення Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) і створює
знімки екрана контрольних точок в очікуванні/після виконання замість налаштування Gateway (взаємно
виключається з `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` і `--fast` передаються до
реальної лінії Slack.

Знімки екрана контрольних точок схвалення створюються з повідомлення Slack API, яке
спостерігав сценарій, а не з реального інтерфейсу Slack; `slack-desktop-smoke.png` є лише
доказом самого Slack Web, коли профіль браузера оренди вже був авторизований.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Орендує або повторно використовує робочий стіл Crabbox, установлює нативний Telegram Desktop для Linux,
за потреби відновлює архів сеансу користувача, налаштовує OpenClaw з
орендованим токеном бота SUT Telegram, запускає
`openclaw gateway run --dev --allow-unconfigured --port 38974`, публікує
повідомлення про готовність бота-драйвера в орендованій приватній групі, а потім робить
знімок екрана та запис MP4. Токен бота лише налаштовує OpenClaw; він ніколи не
авторизує Telegram Desktop. Переглядач на робочому столі — це окремий сеанс користувача Telegram,
відновлений із `--telegram-profile-archive-env <name>` або авторизований вручну
через VNC і збережений активним за допомогою `--keep-lease`.

Прапорці: `--lease-id <cbx_...>` повторно запускає перевірку у віртуальній машині, уже авторизованій у
Telegram Desktop; `--telegram-profile-archive-env <name>` перед запуском відновлює закодований у base64
архів профілю `.tgz`; `--telegram-profile-dir <remote-path>`
задає віддалений каталог профілю (типове значення `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` лише встановлює та відкриває Telegram Desktop;
типовими значеннями `--credential-source`/`--credential-role` є `convex`/`maintainer`.

## Маніфест доказів

Кожен сценарій, що публікує дані в PR, записує `mantis-evidence.json` поруч зі
своїм звітом:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "QA реакцій статусу Mantis у Discord",
  "summary": "Зрозуміле для людини верхнє зведення для коментаря до PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "лише в черзі" },
    "candidate": { "sha": "...", "status": "pass", "expected": "у черзі -> обмірковування -> завершено" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Базовий варіант: лише в черзі",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Базова часова шкала Discord",
      "width": 420
    }
  ]
}
```

Шлях артефакту `path` указується відносно каталогу маніфесту; `targetPath` —
відносно налаштованого префікса артефактів R2/S3. `scripts/mantis/publish-pr-evidence.mjs`
відхиляє обхід шляху та пропускає записи з `"required": false`, якщо
файл відсутній.

Типи артефактів: `timeline` (детермінований знімок екрана до/після),
`desktopScreenshot` (знімок екрана VNC/браузера), `motionPreview` (вбудований анімований
GIF із запису), `motionClip` (MP4 з обрізанням нерухомих фрагментів), `fullVideo` (повний
запис), `metadata` (супровідний файл JSON/журналу), `report` (звіт Markdown).

Структура артефактів запуску на диску:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Знімки екрана є доказами, а не секретами, але все одно потребують ретельного редагування:
на них можуть з'явитися назви приватних каналів, імена користувачів або вміст повідомлень. Установіть
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для загальнодоступного завантаження артефактів; це
типово ввімкнено в робочих процесах GitHub для Discord/Slack/Telegram.

## Автоматизація GitHub

`scripts/mantis/publish-pr-evidence.mjs` — повторно використовуваний засіб публікації. Робочі процеси
викликають його з маніфестом, цільовим PR, коренем призначення артефактів, маркером коментаря,
URL-адресою артефактів, URL-адресою запуску та джерелом запиту. Він завантажує оголошені артефакти до
кошика Mantis R2, формує коментар до PR зі зведенням на початку, вбудованими
зображеннями/попередніми переглядами та посиланнями на відео, а потім оновлює наявний коментар із маркером або
створює новий. Обов'язкові змінні середовища:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (робочі процеси встановлюють `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (робочі процеси встановлюють `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (робочі процеси встановлюють `https://artifacts.openclaw.ai`)

Коментарі публікуються через застосунок Mantis GitHub (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), а не через `github-actions[bot]`, із використанням прихованого
коментаря-маркера як ключа для вставлення або оновлення.

| Робочий процес                    | Тригер                                                                                     | Що він робить                                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | ручний запуск                                                                              | Запускає `discord-smoke` для вибраного посилання.                                                                                                                                                                                                                                                                |
| `Mantis Discord Status Reactions` | коментар до PR або ручний запуск                                                           | Створює окремі робочі дерева базового й кандидатного варіантів, запускає `discord-status-reactions-tool-only` для кожного, візуалізує часову шкалу кожної гілки в настільному браузері Crabbox, створює попередні перегляди GIF/MP4 з обрізанням нерухомих фрагментів за допомогою `crabbox media preview`, завантажує артефакти й публікує вбудовані докази в PR. |
| `Mantis Scenario`                 | ручний запуск                                                                              | Універсальний диспетчер: приймає `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` і передає їх відповідному робочому процесу сценарію. |
| `Mantis Slack Desktop Smoke`      | ручний запуск                                                                              | Орендує настільне середовище Crabbox Linux (типово `aws`, на вибір `hetzner`), запускає `slack-desktop-smoke --gateway-setup` для кандидата, записує робочий стіл, створює попередній перегляд руху, завантажує артефакти й публікує докази в PR, якщо вказано номер PR.                                                      |
| `Mantis Telegram Live`            | коментар до PR або ручний запуск                                                           | Запускає канал перевірки Telegram у реальному середовищі через API бота (`openclaw qa telegram`), записує `mantis-evidence.json` зі зведення QA, візуалізує відредагований HTML із доказами через настільний браузер Crabbox, створює GIF із рухом і публікує докази в PR. Для цього каналу не потрібен вхід у Telegram Web.              |
| `Mantis Telegram Desktop Proof`   | мітка PR від супровідника (`mantis: telegram-visible-proof`) разом із коментарем до PR або ручний запуск | Агентний нативний доказ до/після в Telegram Desktop. Передає PR, посилання базового/кандидатного варіантів та інструкції супровідника до Codex, який запускає канал доказу Crabbox Telegram Desktop із реальним користувачем для обох посилань і публікує таблицю доказів PR із 2 стовпцями.                                 |
| `Mantis Web UI Chat Proof`        | коментар до PR або ручний запуск                                                           | Запускає цільову перевірку чату OpenClaw Control UI за допомогою Playwright для кандидата, перевіряє, що браузер надсилає дані через імітований Gateway, захоплює артефакти знімків екрана/відео й публікує докази в PR. Цей канал перевіряє лише вебчат, а не WinUI/нативний застосунок чи довільне візуальне відображення.     |

`Mantis Discord Status Reactions` і `Mantis Telegram Live` приймають
`baseline_ref`/`candidate_ref` (або `baseline=`/`candidate=` у коментарі до PR)
і перевіряють, що визначений SHA є або предком `origin/main`, або
тегом випуску (`v*`), або вершиною відкритого PR, перш ніж запускати
з обліковими даними, що містять секрети.

Тригери коментарів із PR із доступом write/maintain/admin:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Тригери коментарів Telegram типово використовують SHA вершини PR як кандидата та
`telegram-status-command` як сценарій; вони приймають `provider=aws|hetzner` і
`lease=<cbx_...>`, щоб указати конкретного постачальника Crabbox або попередньо прогріте
настільне середовище. `Mantis Telegram Desktop Proof` відповідає на коментар до PR лише тоді, коли
PR уже має мітку `mantis: telegram-visible-proof`.

Тригери коментарів для чату вебінтерфейсу типово використовують SHA вершини PR як кандидата. Вони запускають
перевірку чату Control UI з імітованим Gateway і публікують артефакти браузера; для
інших вебсторінок і поверхонь нативного застосунку використовуйте звичайну перевірку Playwright/браузера,
знімки екрана від супровідника, Crabbox або локальні артефакти.

ClawSweeper також може безпосередньо запускати сценарій:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Машини та секрети

Типове значення Crabbox для локального CLI — `--provider hetzner --class beast`; перевизначте його
за допомогою `--provider`, `--class`/`--machine-class` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Робочі процеси GitHub
зазвичай перевизначають обидва значення (наприклад, `--class standard`, а також
вхідний параметр вибору постачальника `aws`/`hetzner` у робочому процесі Slack). Якщо постачальник
надто повільний або недоступний, додайте його через той самий інтерфейс Crabbox, а не
жорстко задавайте резервний варіант.

Базові вимоги до VM: Linux із Chrome/Chromium, придатним для настільного середовища, доступом CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ або 25.9+ і pnpm, робочою копією OpenClaw та
вихідним доступом до цільового транспорту, GitHub, постачальників моделей і
брокера облікових даних.

Назви облікових даних і змінних середовища, що використовуються в командах і робочих процесах Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Локальний `qa mantis run --credential-source env` також потребує
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  та `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. Робочі процеси GitHub зазвичай використовують
  `--credential-source convex` і наведені нижче облікові дані брокера замість необроблених
  токенів бота Discord.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для загальнодоступного завантаження артефактів
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (або специфічний для перевірки Telegram Desktop
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (робочі процеси також приймають
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` як резервний варіант і зіставляють
  їх зі звичайними назвами перед викликом Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Засіб запуску Mantis ніколи не повинен виводити токени ботів Discord/Slack/Telegram,
ключі API постачальників, файли cookie браузера, вміст профілів автентифікації, паролі VNC або
необроблені корисні навантаження облікових даних. Якщо токен потрапив до проблеми, PR, чату або журналу,
замініть його після збереження нового секрету.

## Результати запуску

Транспортні сценарії до/після розрізняють наведені нижче результати, щоб нестабільне
середовище не сприймалося як регресія продукту:

- **Помилку відтворено**: базовий варіант завершився невдало саме так, як очікує сценарій.
- **Збій випробувального середовища**: налаштування середовища, облікові дані, API транспорту, браузер
  або постачальник дали збій до того, як перевірка результату стала змістовною.

Перевірка лише кандидата в браузері повідомляє, чи пройшов кандидат перевірки імітованого
Gateway і видимого інтерфейсу; вона не стверджує, що базовий варіант відтворено.

## Додавання сценарію

Транспортні сценарії для реального середовища визначаються в TypeScript окремо для кожного транспорту (див.
`MANTIS_SCENARIO_CONFIGS` у `extensions/qa-lab/src/mantis/run.runtime.ts` для
форми Discord до/після), а не в окремому декларативному форматі файлів.
Кожен сценарій потребує: ідентифікатора й назви, транспорту, необхідних облікових даних, політики
посилання базового варіанта, політики посилання кандидата, виправлення конфігурації OpenClaw, кроків налаштування/стимулу,
очікуваної перевірки результату базового варіанта й кандидата, цілей візуального захоплення, бюджету
часу очікування та кроків очищення.

Цільова перевірка лише кандидата в браузері може використовувати спеціалізований детермінований E2E-тест
і робочий процес. Чітко визначайте її область, перевіряйте посилання кандидата перед
виконанням, ізолюйте публікацію із секретами та створюйте той самий контракт
маніфесту доказів.

Надавайте перевагу невеликим типізованим перевіркам результату замість перевірок комп'ютерним зором: стану реакцій Discord або
посиланням на повідомлення, стану API `ts`/реакцій у гілці Slack, ідентифікаторам
і заголовкам електронних листів. Використовуйте знімки екрана браузера, коли інтерфейс є єдиним надійним спостережуваним результатом,
і залишайте перевірки комп'ютерним зором доповненням до перевірки через API платформи, якщо така існує.

Після Discord, Slack і Telegram ту саму структуру засобу запуску можна поширити на WhatsApp
(вхід через QR-код, повторна ідентифікація, доставка, медіафайли, реакції) і Matrix
(зашифровані кімнати, зв'язки гілок/відповідей, відновлення після перезапуску); жоден із них
ще не реалізовано.

## Відкриті питання

- Який бот Discord має бути драйвером, а який — SUT у разі повторного використання наявного бота Mantis?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати сценарій Mantis, а не чекати на команду супровідника?
- Чи потрібно редагувати або обрізати знімки екрана перед завантаженням до загальнодоступних PR?
