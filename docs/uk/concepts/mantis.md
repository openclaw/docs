---
read_when:
    - Створення або виконання візуального тестування якості в реальному середовищі для помилок OpenClaw
    - Додавання перевірки до та після для запиту на злиття
    - Додавання сценаріїв із Discord, Slack, WhatsApp або іншими транспортами в реальному часі
    - Виконання цільової браузерної перевірки інтерфейсу керування для референсу-кандидата
    - Налагодження запусків QA, яким потрібні знімки екрана, автоматизація браузера або доступ через VNC
summary: Mantis збирає візуальні наскрізні докази для порівняння транспортів у реальному середовищі та цільових браузерних перевірок лише для кандидатів, а потім прикріплює артефакти до PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-12T13:09:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis публікує візуальні докази CI та коментар до PR щодо поведінки OpenClaw.
Сценарії з реальним транспортом порівнюють завідомо несправну базову версію з версією-кандидатом;
натомість цільові браузерні лінії можуть перевіряти одного кандидата на детермінованому
імітаційному транспорті. Першим було реалізовано Discord зі справжньою автентифікацією бота, каналами серверів,
реакціями, гілками та браузерним спостерігачем. Також існують лінії для Slack, Telegram і цільового чату
інтерфейсу керування; WhatsApp і Matrix не реалізовано.

## Відповідальність

- OpenClaw (`extensions/qa-lab/src/mantis/*`): середовище виконання сценаріїв, CLI `pnpm openclaw qa mantis <command>`, схема доказів.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): інфраструктура реального транспорту, боти драйвера та тестованої системи, засоби запису звітів і доказів.
- Crabbox (`openclaw/crabbox`): прогріті машини Linux, оренди, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): віддалені точки входу, зберігання артефактів.
- ClawSweeper: аналізує команди супровідників у PR, запускає робочі процеси, публікує підсумковий коментар до PR.

## Команди CLI

Усі команди мають вигляд `pnpm openclaw qa mantis <command>` і визначені у
`extensions/qa-lab/src/mantis/cli.ts`. Під час збирання та запуску потрібна змінна `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
(вбудовані робочі процеси перед збиранням установлюють `OPENCLAW_BUILD_PRIVATE_QA=1` і
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`).

| Команда                         | Призначення                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Перевірити, чи бот Mantis для Discord бачить сервер і канал, може опублікувати повідомлення та додати реакцію.                                                                                 |
| `run`                           | Виконати сценарій «до/після» для базової версії та версії-кандидата (лише Discord).                                                                           |
| `desktop-browser-smoke`         | Орендувати або повторно використати робочий стіл Crabbox, відкрити видимий браузер, зробити знімок екрана та відео.                                                                        |
| `slack-desktop-smoke`           | Орендувати або повторно використати робочий стіл Crabbox, виконати в ньому перевірку Slack QA, відкрити Slack Web і зібрати докази.                                                                  |
| `telegram-desktop-builder`      | Орендувати або повторно використати робочий стіл Crabbox, установити Telegram Desktop і за потреби налаштувати Gateway OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Універсальне захоплення робочого столу Crabbox із необов’язковими перевірками розуміння зображень; `visual-driver` — частина драйвера, що запускається через `crabbox record --while`. |

Кожна команда приймає `--repo-root <path>` і `--output-dir <path>`; команди Crabbox
також приймають `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` і `--keep-lease`. Типові локальні значення CLI
для постачальника та класу — `hetzner`/`beast`, якщо не зазначено інше; робочі процеси CI
зазвичай перевизначають обидва значення.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Викликає REST API Discord (`https://discord.com/api/v10`), щоб отримати користувача
бота, сервер, канали сервера та цільовий канал, перевіряє належність
каналу до сервера, після чого (якщо не вказано `--skip-post`) публікує повідомлення та
додає реакцію `👀`. Записує `mantis-discord-smoke-summary.json` і
`mantis-discord-smoke-report.md`.

Порядок визначення токена: значення `--token-file`, потім `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(перевизначається через `--token-env`), а потім файл, указаний у `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(перевизначається через `--token-file-env`). Ідентифікатори сервера та каналу беруться з
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (перевизначаються через
`--guild-id` / `--channel-id`) і мають бути 17–20-значними сніжинками Discord. Установіть
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, щоб замінити ідентифікатори
й назви бота, сервера, каналу та повідомлення на `<redacted>` в опублікованих зведенні та звіті.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Наразі `--transport` приймає лише `discord`. `--scenario` — один із двох
вбудованих ідентифікаторів, кожен із власним типовим посиланням на базову версію та очікуваними
мітками «до/після» (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Сценарій                                   | Типова базова версія                           | Очікування для базової версії                         | Очікування для кандидата            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | у відповіді в гілці немає вкладення `filePath` | відповідь у гілці містить його     |

Типове значення `--candidate` — `HEAD`. Інші прапорці: `--credential-source`
(типово `convex`), `--credential-role` (типово `ci`), `--provider-mode`
(типово `live-frontier`), `--fast` (типово ввімкнено), `--skip-install`, `--skip-build`.

Засіб запуску створює від'єднані робочі дерева `git worktree` для базової версії та
кандидата в `<output-dir>/worktrees/`, виконує `pnpm install`/`pnpm build` у
кожному з них (якщо їх не пропущено), а потім запускає
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
для кожного робочого дерева. Кожна лінія записує `discord-qa-reaction-timelines.json`
разом із парою `<scenario-id>-timeline.html`/`.png`; засіб запуску копіює ці
докази до `baseline/`/`candidate/`, записує `comparison.json`,
`mantis-report.md` і `mantis-evidence.json` у вихідний каталог та
завершується з ненульовим кодом, якщо порівняння не пройдено (базова версія — `fail`, а кандидат —
`pass`).

Другий сценарій Discord (`discord-thread-reply-filepath-attachment`) публікує
батьківське повідомлення за допомогою бота-драйвера, створює справжню гілку, викликає дію
`message.thread-reply` тестованої системи з локальним для репозиторію `filePath`, а потім опитує
гілку щодо наявності відповіді та імені файла вкладення. Очікується вкладення
з назвою `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Орендує або повторно використовує робочий стіл Crabbox, запускає браузер у сеансі VNC,
спрямований на `--browser-url` (типово `https://openclaw.ai`) або відтворений
`--html-file`, очікує, робить знімок екрана за допомогою `scrot`, за потреби записує MP4 через
`ffmpeg` і синхронізує `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
назад до `--output-dir` за допомогою rsync.

Прапорці:

- `--lease-id <cbx_...>` повторно використовує прогрітий робочий стіл замість створення нового.
- `--browser-profile-dir <remote-path>` повторно використовує віддалений каталог даних користувача Chrome, щоб постійний робочий стіл залишався авторизованим між запусками (використовується для довготривалого профілю переглядача Discord Web).
- `--browser-profile-archive-env <name>` відновлює архів профілю Chrome `.tgz` у форматі base64 зі вказаної змінної середовища перед запуском (типово `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); використовується для авторизованих спостерігачів, як-от Discord Web.
- `--video-duration <seconds>` керує тривалістю запису MP4 (типово 10 с).
- `--keep-lease` (або `OPENCLAW_MANTIS_KEEP_VM=1`) залишає відкритою створену цим запуском оренду для перевірки через VNC; невдалі запуски, що створили оренду, також типово залишають її відкритою.

Для доказів Discord Web Mantis використовує окремий обліковий запис переглядача, а не токен
бота. Джерелом істини залишається оракул REST Discord (через `qa discord`); коли
встановлено `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарій також записує артефакт
URL Discord Web, а `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` залишає
гілку відкритою достатньо довго, щоб браузер міг її відкрити.

Робочий процес GitHub віддає перевагу постійному профілю переглядача через
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (повні архіви профілів можуть перевищувати
обмеження GitHub на розмір секрету); для малих або початкових профілів натомість можна відновити
`.tgz` у форматі base64 з `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Якщо
не налаштовано жодне джерело, робочий процес усе одно публікує детерміновані
знімки екрана базової версії та кандидата й записує в журнал, що авторизованого спостерігача
було пропущено.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Орендує або повторно використовує робочий стіл Crabbox, синхронізує робочу копію з віртуальною машиною, запускає
в ній `pnpm openclaw qa slack`, відкриває Slack Web у браузері VNC,
захоплює робочий стіл і копіює локально як артефакти Slack QA (`slack-qa/`), так і
знімок екрана та відео VNC. Це єдина конфігурація Mantis, у якій
Gateway тестованої системи та браузер працюють в одній віртуальній машині.

З `--gateway-setup` команда створює постійний одноразовий домашній каталог OpenClaw
у `$HOME/.openclaw-mantis/slack-openclaw` у віртуальній машині, змінює конфігурацію Slack
Socket Mode для цільового каналу, запускає
`openclaw gateway run --dev --allow-unconfigured --port 38973` і залишає
Chrome запущеним у сеансі VNC; без `--gateway-setup` натомість запускається звичайна
лінія Slack QA між ботами.

Обов'язкові змінні середовища для `--credential-source env` (локальне типове значення — `env`; типова
роль — `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для віддаленої лінії моделі (якщо локально встановлено лише `OPENAI_API_KEY`,
  Mantis копіює її до `OPENCLAW_LIVE_OPENAI_KEY` перед
  викликом Crabbox)

З `--credential-source convex` Mantis орендує облікові дані тестованої системи Slack зі
спільного пулу перед створенням віртуальної машини та передає ідентифікатор каналу, токен застосунку й
токен бота у віртуальну машину як змінні середовища `OPENCLAW_MANTIS_SLACK_*`, тому робочим процесам GitHub
потрібен лише секрет брокера Convex, а не необроблені токени Slack.

Інші прапорці: `--slack-url <url>` відкриває певну URL-адресу (інакше Mantis формує
`https://app.slack.com/client/<team>/<channel>` на основі `auth.test`);
`--slack-channel-id <id>` задає дозволений канал Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` керує постійним профілем Chrome
у віртуальній машині (типово `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` запускає нативні сценарії затвердження Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) і відтворює
знімки екрана контрольних точок зі станами очікування та завершення замість налаштування Gateway (несумісний
із `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` і `--fast` передаються до
реальної лінії Slack.

Знімки екрана контрольних точок затвердження відтворюються з повідомлення API Slack, яке
спостерігав сценарій, а не з реального інтерфейсу Slack; `slack-desktop-smoke.png` є лише
доказом роботи самого Slack Web, якщо профіль браузера орендованої машини вже був
авторизований.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Орендує або повторно використовує робочий стіл Crabbox, установлює нативний Telegram Desktop для Linux,
за потреби відновлює архів сеансу користувача, налаштовує OpenClaw за допомогою
токена бота SUT Telegram, наданого в оренду, запускає
`openclaw gateway run --dev --allow-unconfigured --port 38974`, публікує
повідомлення бота-драйвера про готовність у наданій приватній групі, а потім робить
знімок екрана та запис MP4. Токен бота лише налаштовує OpenClaw; він ніколи не
виконує вхід у Telegram Desktop. Засіб перегляду робочого столу — це окремий сеанс
користувача Telegram, відновлений із `--telegram-profile-archive-env <name>` або
авторизований вручну через VNC і підтримуваний активним за допомогою `--keep-lease`.

Прапорці: `--lease-id <cbx_...>` повторно запускає сценарій на віртуальній машині, де вже виконано вхід у
Telegram Desktop; `--telegram-profile-archive-env <name>` відновлює архів профілю
`.tgz` у кодуванні base64 перед запуском; `--telegram-profile-dir <remote-path>`
задає віддалений каталог профілю (типово `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` лише встановлює та відкриває Telegram Desktop;
`--credential-source`/`--credential-role` типово мають значення `convex`/`maintainer`.

## Маніфест доказів

Кожен сценарій, який публікує дані в PR, записує `mantis-evidence.json` поруч
зі своїм звітом:

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

`path` артефакту вказується відносно каталогу маніфесту; `targetPath` —
відносно налаштованого префікса артефактів R2/S3. `scripts/mantis/publish-pr-evidence.mjs`
відхиляє обхід каталогів і пропускає записи з `"required": false`, якщо
файл відсутній.

Типи артефактів: `timeline` (детермінований знімок екрана до/після),
`desktopScreenshot` (знімок екрана VNC/браузера), `motionPreview` (вбудований анімований
GIF із запису), `motionClip` (MP4, обрізаний до ділянок із рухом), `fullVideo` (повний
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
на них можуть з’явитися назви приватних каналів, імена користувачів або вміст повідомлень. Установіть
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для загальнодоступних завантажень артефактів; цей параметр
типово ввімкнено в робочих процесах GitHub для Discord/Slack/Telegram.

## Автоматизація GitHub

`scripts/mantis/publish-pr-evidence.mjs` — багаторазово використовуваний засіб публікації. Робочі процеси
викликають його з маніфестом, цільовим PR, коренем цільового розташування артефактів, маркером коментаря,
URL-адресою артефактів, URL-адресою запуску та джерелом запиту. Він завантажує оголошені артефакти до
кошика Mantis R2, формує коментар до PR, що починається з підсумку та містить вбудовані
зображення/попередні перегляди й посилання на відео, а потім оновлює наявний коментар із маркером або
створює новий. Необхідні змінні середовища:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (робочі процеси задають `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (робочі процеси задають `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (робочі процеси задають `https://artifacts.openclaw.ai`)

Коментарі публікуються через застосунок Mantis GitHub (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), а не `github-actions[bot]`; прихований
коментар-маркер використовується як ключ оновлення або вставлення.

| Робочий процес                    | Тригер                                                                                     | Що він робить                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | ручний запуск                                                                              | Запускає `discord-smoke` для вибраного посилання.                                                                                                                                                                                                                                                                 |
| `Mantis Discord Status Reactions` | коментар до PR або ручний запуск                                                           | Створює окремі робочі дерева базової та кандидатної версій, запускає `discord-status-reactions-tool-only` для кожної, відтворює часову шкалу кожної гілки в браузері робочого столу Crabbox, створює попередні перегляди GIF/MP4, обрізані до ділянок із рухом, за допомогою `crabbox media preview`, завантажує артефакти та публікує вбудовані докази в PR. |
| `Mantis Scenario`                 | ручний запуск                                                                              | Універсальний диспетчер: приймає `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` і передає їх відповідному робочому процесу сценарію. |
| `Mantis Slack Desktop Smoke`      | ручний запуск                                                                              | Орендує робочий стіл Crabbox Linux (типово `aws`, можна вибрати `hetzner`), запускає `slack-desktop-smoke --gateway-setup` для кандидата, записує робочий стіл, створює попередній перегляд руху, завантажує артефакти та публікує докази в PR, якщо вказано номер PR. |
| `Mantis Telegram Live`            | коментар до PR або ручний запуск                                                           | Запускає канал перевірки Telegram наживо через API бота (`openclaw qa telegram`), записує `mantis-evidence.json` із підсумку QA, відтворює HTML із відредагованими доказами через браузер робочого столу Crabbox, створює анімований GIF із рухом і публікує докази в PR. Для цього каналу вхід у Telegram Web не потрібен. |
| `Mantis Telegram Desktop Proof`   | мітка PR від супровідника (`mantis: telegram-visible-proof`) разом із коментарем до PR або ручний запуск | Агентний нативний доказ до/після в Telegram Desktop. Передає PR, посилання на базову/кандидатну версії та інструкції супровідника до Codex, який запускає канал доказів для реального користувача Telegram Desktop у Crabbox для обох версій і публікує таблицю доказів у PR із двома стовпцями. |
| `Mantis Web UI Chat Proof`        | коментар до PR або ручний запуск                                                           | Запускає цільову перевірку чату OpenClaw Control UI за допомогою Playwright для кандидата, перевіряє, що браузер надсилає дані через імітований Gateway, створює артефакти знімків екрана/відео та публікує докази в PR. Цей канал перевіряє лише вебчат, а не WinUI/нативний застосунок чи довільні візуальні елементи. |

`Mantis Discord Status Reactions` і `Mantis Telegram Live` приймають
`baseline_ref`/`candidate_ref` (або `baseline=`/`candidate=` у коментарі до PR)
і перед запуском з обліковими даними, що містять секрети, перевіряють, що визначений SHA є або предком `origin/main`, або
тегом випуску (`v*`), або вершиною відкритого PR.

Тригери в коментарях до PR із доступом write/maintain/admin:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Тригери Telegram у коментарях типово використовують SHA вершини PR як кандидата та
`telegram-status-command` як сценарій; вони приймають `provider=aws|hetzner` і
`lease=<cbx_...>` для вибору конкретного постачальника Crabbox або попередньо прогрітого
робочого столу. `Mantis Telegram Desktop Proof` відповідає на коментар до PR лише тоді, коли
PR уже має мітку `mantis: telegram-visible-proof`.

Тригери чату вебінтерфейсу в коментарях типово використовують SHA вершини PR як кандидата. Вони запускають
перевірку чату Control UI з імітованим Gateway і публікують артефакти браузера; для
інших вебсторінок і поверхонь нативного застосунку використовуйте звичайну перевірку Playwright/браузера, знімки екрана від супровідника, Crabbox або локальні
артефакти.

ClawSweeper також може запустити сценарій безпосередньо:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Машини та секрети

Типові параметри Crabbox для локального CLI: `--provider hetzner --class beast`; їх можна перевизначити
за допомогою `--provider`, `--class`/`--machine-class` або
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Робочі процеси GitHub
зазвичай перевизначають обидва параметри (наприклад, `--class standard`, а також поле вибору постачальника
`aws`/`hetzner` у робочому процесі Slack). Якщо постачальник працює надто повільно або недоступний,
додайте його через той самий інтерфейс Crabbox, а не жорстко задавайте резервний варіант.

Базова конфігурація VM: Linux із Chrome/Chromium, придатним для робочого столу, доступом CDP, VNC/
noVNC, Node 22+ і pnpm, робочою копією OpenClaw та вихідним доступом до
цільового транспорту, GitHub, постачальників моделей і брокера облікових даних.

Назви секретів, що використовуються в робочих процесах Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для загальнодоступних завантажень артефактів
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (робочі процеси також приймають
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` як резервний варіант і зіставляють
  їх зі звичайними назвами перед викликом Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Засіб запуску Mantis ніколи не повинен виводити токени ботів Discord/Slack/Telegram,
ключі API постачальників, файли cookie браузера, вміст профілів автентифікації, паролі VNC або
необроблені дані облікових даних. Якщо токен потрапив у задачу, PR, чат або журнал,
замініть його після збереження нового секрету.

## Результати запуску

Транспортні сценарії до/після розрізняють наведені нижче результати, щоб нестабільне
середовище не сприймалося як регресія продукту:

- **Помилку відтворено**: базова версія завершилася невдало саме так, як очікує сценарій.
- **Збій тестового контуру**: налаштування середовища, облікові дані, API транспорту, браузер
  або постачальник завершилися невдало до того, як оракул набув сенсу.

Перевірка лише кандидата в браузері повідомляє, чи пройшов кандидат перевірки імітованого
Gateway і видимого інтерфейсу; вона не стверджує, що базову помилку відтворено.

## Додавання сценарію

Транспортні сценарії наживо визначаються в TypeScript окремо для кожного транспорту (див.
`MANTIS_SCENARIO_CONFIGS` у `extensions/qa-lab/src/mantis/run.runtime.ts` щодо
структури Discord до/після), а не в окремому декларативному форматі файлу.
Кожен сценарій потребує: ідентифікатора та назви, транспорту, необхідних облікових даних, політики
посилання на базову версію, політики посилання на кандидата, виправлення конфігурації OpenClaw, кроків налаштування/стимулу,
очікуваного оракула для базової та кандидатної версій, цілей візуального захоплення, бюджету
часу очікування та кроків очищення.

Цілеспрямоване браузерне підтвердження лише для кандидата може використовувати окремий детермінований E2E-тест і робочий процес. Чітко визначайте його область дії, перевіряйте посилання на кандидата перед виконанням, ізолюйте публікацію з використанням секретів і формуйте той самий контракт маніфесту доказів.

Надавайте перевагу невеликим типізованим оракулам, а не перевіркам комп’ютерного зору: стану реакцій або посиланням на повідомлення в Discord, `ts` ланцюжка Slack чи стану реакцій через API, ідентифікаторам і заголовкам електронних листів. Використовуйте знімки екрана браузера, коли інтерфейс є єдиним надійним джерелом спостережень, і застосовуйте перевірки комп’ютерного зору як доповнення до оракула API платформи, якщо він існує.

Після Discord, Slack і Telegram таку саму структуру засобу запуску можна розширити на WhatsApp (вхід за QR-кодом, повторна ідентифікація, доставка, медіафайли, реакції) і Matrix (зашифровані кімнати, зв’язки ланцюжків і відповідей, відновлення після перезапуску); наразі жодне з цих розширень не реалізовано.

## Відкриті питання

- Який бот Discord має бути драйвером, а який — тестованою системою (SUT), коли повторно використовується наявний бот Mantis?
- Як довго GitHub має зберігати артефакти Mantis для PR?
- Коли ClawSweeper має автоматично рекомендувати сценарій Mantis замість очікування команди супроводжувача?
- Чи слід редагувати або обрізати знімки екрана перед завантаженням до публічних PR?
