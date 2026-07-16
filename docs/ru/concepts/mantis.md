---
read_when:
    - Создание или запуск визуального тестирования в реальном окружении для ошибок OpenClaw
    - Добавление проверки до и после для запроса на включение изменений
    - Добавление сценариев с передачей данных в реальном времени через Discord, Slack, WhatsApp или другие каналы
    - Запуск целевой браузерной проверки Control UI для кандидатной ссылки на версию
    - Отладка прогонов QA, требующих снимков экрана, автоматизации браузера или доступа по VNC
summary: Mantis собирает визуальные сквозные доказательства для сравнений транспортов в реальных условиях и целевых проверок в браузере только для кандидата, а затем прикрепляет артефакты к PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-16T16:21:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis публикует визуальные свидетельства CI и комментарий к PR о поведении OpenClaw.
Сценарии с реальными транспортами сравнивают заведомо некорректный базовый вариант с проверяемой ссылкой;
специализированные браузерные потоки могут вместо этого проверять один вариант с помощью детерминированного
имитируемого транспорта. Первым был выпущен Discord с реальной аутентификацией бота, каналами сервера,
реакциями, ветками и визуальным подтверждением в браузере. Также существуют потоки для Slack, Telegram и специализированного чата Control
UI; WhatsApp и Matrix не реализованы.

## Зоны ответственности

- OpenClaw (`extensions/qa-lab/src/mantis/*`): среда выполнения сценариев, CLI `pnpm openclaw qa mantis <command>`, схема свидетельств.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): среда тестирования реальных транспортов, боты драйвера/SUT, средства записи отчётов и свидетельств.
- Crabbox (`openclaw/crabbox`): прогретые машины Linux, аренда, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): удалённые точки входа, хранение артефактов.
- ClawSweeper: анализирует команды сопровождающих в PR, запускает рабочие процессы, публикует итоговый комментарий к PR.

## Команды CLI

Все команды определены в `pnpm openclaw qa mantis <command>`,
`extensions/qa-lab/src/mantis/cli.ts`. Во время сборки/запуска требуется `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
(встроенные рабочие процессы задают `OPENCLAW_BUILD_PRIVATE_QA=1` и
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` перед сборкой).

| Команда                         | Назначение                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Проверить, что бот Mantis для Discord видит сервер/канал, может публиковать сообщения и добавлять реакции.                                                                                 |
| `run`                           | Выполнить сценарий «до/после» для базовой и проверяемой ссылок (только Discord).                                                                           |
| `desktop-browser-smoke`         | Арендовать/повторно использовать рабочий стол Crabbox, открыть видимый браузер, записать снимок экрана и видео.                                                                        |
| `slack-desktop-smoke`           | Арендовать/повторно использовать рабочий стол Crabbox, запустить в нём QA для Slack, открыть Slack Web, записать свидетельства.                                                                  |
| `telegram-desktop-builder`      | Арендовать/повторно использовать рабочий стол Crabbox, установить Telegram Desktop, при необходимости настроить Gateway OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Универсальная запись рабочего стола Crabbox с необязательными проверками на основе распознавания изображений; `visual-driver` — часть драйвера, запускаемая в `crabbox record --while`. |

Каждая команда принимает `--repo-root <path>` и `--output-dir <path>`; команды Crabbox
также принимают `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` и `--keep-lease`. Локальные значения CLI по умолчанию
для провайдера/класса — `hetzner`/`beast`, если не указано иное; рабочие процессы CI
обычно переопределяют оба значения.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Вызывает REST API Discord (`https://discord.com/api/v10`), чтобы получить данные
пользователя-бота, сервера, каналов сервера и целевого канала, проверяет,
что канал принадлежит серверу, затем (если не указан `--skip-post`) публикует сообщение и
добавляет реакцию `👀`. Записывает `mantis-discord-smoke-summary.json` и
`mantis-discord-smoke-report.md`.

Порядок получения токена: значение `--token-file`, затем `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(переопределяется через `--token-env`), затем файл, указанный в `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(переопределяется через `--token-file-env`). Идентификаторы сервера/канала берутся из
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (переопределяются через
`--guild-id` / `--channel-id`) и должны быть 17–20-значными snowflake-идентификаторами Discord. Задайте
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, чтобы заменить идентификаторы
и имена бота/сервера/канала/сообщения на `<redacted>` в публикуемой сводке и отчёте.

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` сейчас принимает только `discord`. `--scenario` — один из двух
встроенных идентификаторов, каждый со своей базовой ссылкой по умолчанию и ожидаемыми метками «до/после»
(`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Сценарий                                   | Базовый вариант по умолчанию                           | Ожидается в базовом варианте                         | Ожидается в проверяемом варианте            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | ответ в ветке не содержит вложение `filePath` | ответ в ветке содержит его     |

Значение `--candidate` по умолчанию — `HEAD`. Другие флаги: `--credential-source`
(по умолчанию `convex`), `--credential-role` (по умолчанию `ci`), `--provider-mode`
(по умолчанию `live-frontier`), `--fast` (по умолчанию включён), `--skip-install`, `--skip-build`.

Средство запуска создаёт отсоединённые рабочие деревья `git worktree` для базового
и проверяемого вариантов в `<output-dir>/worktrees/`, выполняет `pnpm install`/`pnpm build` в
каждом из них (если этап не пропущен), а затем запускает
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
для каждого рабочего дерева. Каждый поток записывает `discord-qa-reaction-timelines.json`
и пару `<scenario-id>-timeline.html`/`.png`; средство запуска копирует эти
свидетельства обратно в `baseline/`/`candidate/`, записывает `comparison.json`,
`mantis-report.md` и `mantis-evidence.json` в выходной каталог и
завершается с ненулевым кодом, если сравнение не пройдено (базовый вариант `fail`, а проверяемый —
`pass`).

Второй сценарий Discord (`discord-thread-reply-filepath-attachment`) публикует
родительское сообщение с помощью бота-драйвера, создаёт реальную ветку, вызывает действие SUT
`message.thread-reply` с локальным для репозитория `filePath`, а затем опрашивает
ветку в ожидании ответа и имени файла вложения. Ожидается вложение
с именем `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Арендует или повторно использует рабочий стол Crabbox, запускает браузер внутри сеанса VNC,
открывая `--browser-url` (по умолчанию `https://openclaw.ai`) или отрисованный
`--html-file`, ожидает, делает снимок экрана с помощью `scrot`, при необходимости записывает MP4 с помощью
`ffmpeg` и синхронизирует через rsync файлы `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
обратно в `--output-dir`.

Флаги:

- `--lease-id <cbx_...>` повторно использует прогретый рабочий стол вместо создания нового.
- `--browser-profile-dir <remote-path>` повторно использует удалённый каталог пользовательских данных Chrome, чтобы постоянный рабочий стол сохранял авторизацию между запусками (используется для долгоживущего профиля просмотра Discord Web).
- `--browser-profile-archive-env <name>` перед запуском восстанавливает из этой переменной среды закодированный в base64 архив профиля Chrome `.tgz` (по умолчанию `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); используется для авторизованных средств визуального подтверждения, таких как Discord Web.
- `--video-duration <seconds>` управляет длительностью записи MP4 (по умолчанию 10s).
- `--keep-lease` (или `OPENCLAW_MANTIS_KEEP_VM=1`) оставляет аренду, созданную во время этого запуска, открытой для проверки через VNC; неудачные запуски, создавшие аренду, также по умолчанию оставляют её открытой.

Для свидетельств из Discord Web Mantis использует выделенную учётную запись
просмотра, а не токен бота. Оракул REST Discord (через `qa discord`) остаётся авторитетным источником; когда
задан `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарий также записывает
артефакт с URL Discord Web, а `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` оставляет
ветку открытой достаточно долго, чтобы браузер успел её открыть.

Рабочий процесс GitHub предпочитает постоянный профиль просмотра через
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (полные архивы профилей могут превышать
ограничение GitHub на размер секрета); для небольших/начальных профилей вместо этого можно восстановить
закодированный в base64 `.tgz` из `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Если
не настроен ни один источник, рабочий процесс всё равно публикует детерминированные
снимки экрана базового и проверяемого вариантов и записывает в журнал, что авторизованное визуальное подтверждение
пропущено.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Арендует или повторно использует рабочий стол Crabbox, синхронизирует рабочую копию с ВМ, запускает
в ней `pnpm openclaw qa slack`, открывает Slack Web в браузере VNC,
записывает рабочий стол и копирует локально как артефакты QA Slack (`slack-qa/`), так и
снимок экрана/видео VNC. Это единственная конфигурация Mantis, в которой
Gateway SUT и браузер работают внутри одной ВМ.

При использовании `--gateway-setup` команда создаёт постоянный одноразовый домашний каталог OpenClaw
в `$HOME/.openclaw-mantis/slack-openclaw` внутри ВМ, изменяет конфигурацию Slack
Socket Mode для целевого канала, запускает
`openclaw gateway run --dev --allow-unconfigured --port 38973` и оставляет
Chrome запущенным в сеансе VNC; если `--gateway-setup` не указан, вместо этого запускается обычный
поток QA Slack «бот-бот».

Обязательные переменные среды для `--credential-source env` (локальное значение по умолчанию — `env`; роль
по умолчанию — `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для удалённого потока модели (если локально задан только `OPENAI_API_KEY`,
  Mantis копирует его в `OPENCLAW_LIVE_OPENAI_KEY` перед
  вызовом Crabbox)

При использовании `--credential-source convex` Mantis арендует учётные данные SUT Slack из
общего пула перед созданием ВМ и передаёт идентификатор канала, токен приложения и
токен бота в ВМ как переменные среды `OPENCLAW_MANTIS_SLACK_*`, поэтому рабочим процессам GitHub
нужен только секрет брокера Convex, а не необработанные токены Slack.

Другие флаги: `--slack-url <url>` открывает указанный URL (иначе Mantis получает
`https://app.slack.com/client/<team>/<channel>` из `auth.test`);
`--slack-channel-id <id>` задаёт разрешённый канал Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` управляет постоянным профилем Chrome
внутри ВМ (по умолчанию `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` запускает нативные сценарии подтверждения Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) и отрисовывает
снимки экрана контрольных точек в состояниях ожидания/завершения вместо настройки Gateway (взаимоисключающий
с `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` и `--fast` передаются в
реальный поток Slack.

Снимки экрана контрольных точек подтверждения отрисовываются из сообщения Slack API, которое
наблюдал сценарий, а не из реального интерфейса Slack; `slack-desktop-smoke.png` служит только
подтверждением самого Slack Web, если в профиле браузера арендованной машины уже выполнен вход.

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Арендует или повторно использует рабочий стол Crabbox, устанавливает нативный Telegram Desktop для Linux,
при необходимости восстанавливает архив пользовательского сеанса, настраивает OpenClaw с
арендованным токеном SUT-бота Telegram, запускает
`openclaw gateway run --dev --allow-unconfigured --port 38974`, публикует
сообщение бота-драйвера о готовности в арендованной закрытой группе, а затем записывает
снимок экрана и MP4. Токен бота только настраивает OpenClaw; он никогда не выполняет вход
в Telegram Desktop. Средство просмотра на рабочем столе использует отдельный пользовательский сеанс Telegram,
восстановленный из `--telegram-profile-archive-env <name>` или созданный вручную
через VNC и сохраняемый с помощью `--keep-lease`.

Флаги: `--lease-id <cbx_...>` повторно запускает сценарий в ВМ, где уже выполнен вход в
Telegram Desktop; `--telegram-profile-archive-env <name>` перед запуском восстанавливает закодированный в base64
архив профиля `.tgz`; `--telegram-profile-dir <remote-path>`
задаёт удалённый каталог профиля (по умолчанию `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` только устанавливает и открывает Telegram Desktop;
значения `--credential-source`/`--credential-role` по умолчанию — `convex`/`maintainer`.

## Манифест свидетельств

Каждый сценарий, публикующий результаты в PR, записывает `mantis-evidence.json` рядом со
своим отчётом:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Контроль качества реакций статуса Discord в Mantis",
  "summary": "Понятная человеку краткая сводка для комментария к PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "только в очереди" },
    "candidate": { "sha": "...", "status": "pass", "expected": "в очереди -> обдумывание -> завершено" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Базовый вариант: только в очереди",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Временная шкала базового варианта Discord",
      "width": 420
    }
  ]
}
```

Путь артефакта `path` задаётся относительно каталога манифеста; `targetPath` —
относительно настроенного префикса артефактов R2/S3. `scripts/mantis/publish-pr-evidence.mjs`
отклоняет обход каталогов и пропускает записи с `"required": false`, если
файл отсутствует.

Виды артефактов: `timeline` (детерминированный снимок экрана до/после),
`desktopScreenshot` (снимок экрана VNC/браузера), `motionPreview` (встроенный анимированный
GIF из записи), `motionClip` (MP4 с удалёнными фрагментами без движения), `fullVideo` (полная
запись), `metadata` (сопутствующий файл JSON/журнала), `report` (отчёт Markdown).

Структура артефактов запуска на диске:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

Снимки экрана служат доказательствами, а не секретами, но всё равно требуют
внимательного редактирования: на них могут присутствовать названия закрытых каналов,
имена пользователей или содержимое сообщений. Задайте `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
для общедоступной загрузки артефактов; этот параметр по умолчанию
включён в рабочих процессах GitHub для Discord/Slack/Telegram.

## Автоматизация GitHub

`scripts/mantis/publish-pr-evidence.mjs` — переиспользуемый инструмент публикации. Рабочие процессы
вызывают его с манифестом, целевым PR, корневым целевым каталогом артефактов, маркером
комментария, URL артефакта, URL запуска и источником запроса. Он загружает объявленные
артефакты в бакет Mantis R2, формирует комментарий к PR, начинающийся со сводки, со встроенными
изображениями/предпросмотрами и ссылками на видео, а затем обновляет существующий комментарий
с маркером или создаёт новый. Обязательные переменные окружения:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (рабочие процессы задают `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (рабочие процессы задают `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (рабочие процессы задают `https://artifacts.openclaw.ai`)

Комментарии публикуются через GitHub App Mantis (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), а не через `github-actions[bot]`; в качестве ключа
обновления или вставки используется скрытый комментарий-маркер.

| Рабочий процесс                    | Триггер                                                                                    | Выполняемые действия                                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | запуск вручную                                                                            | Запускает `discord-smoke` для выбранной ссылки.                                                                                                                                                                                                                                                                    |
| `Mantis Discord Status Reactions` | комментарий к PR или запуск вручную                                                       | Создаёт отдельные рабочие деревья базового и проверяемого вариантов, запускает `discord-status-reactions-tool-only` в каждом, визуализирует временную шкалу каждого варианта в браузере рабочего стола Crabbox, создаёт предпросмотры GIF/MP4 с удалёнными фрагментами без движения с помощью `crabbox media preview`, загружает артефакты и публикует встроенные доказательства в PR. |
| `Mantis Scenario`                 | запуск вручную                                                                            | Универсальный диспетчер: принимает `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` и перенаправляет их соответствующему рабочему процессу сценария. |
| `Mantis Slack Desktop Smoke`      | запуск вручную                                                                            | Арендует рабочий стол Crabbox Linux (по умолчанию `aws`, можно выбрать `hetzner`), запускает `slack-desktop-smoke --gateway-setup` для проверяемого варианта, записывает рабочий стол, создаёт предпросмотр движения, загружает артефакты и публикует доказательства в PR, если указан номер PR.                                               |
| `Mantis Telegram Live`            | комментарий к PR или запуск вручную                                                       | Запускает канал оперативного контроля качества Telegram через API бота (`openclaw qa telegram`), записывает `mantis-evidence.json` из сводки контроля качества, визуализирует отредактированный HTML с доказательствами через браузер рабочего стола Crabbox, создаёт GIF с движением и публикует доказательства в PR. Для этого канала вход в Telegram Web не требуется. |
| `Mantis Telegram Desktop Proof`   | метка PR от сопровождающего (`mantis: telegram-visible-proof`) и комментарий к PR либо запуск вручную | Агентская проверка до/после в нативном Telegram Desktop. Передаёт PR, ссылки на базовый/проверяемый варианты и инструкции сопровождающего в Codex, который запускает канал проверки Telegram Desktop в Crabbox от имени реального пользователя для обеих ссылок и публикует таблицу доказательств PR из 2 столбцов.                         |
| `Mantis Web UI Chat Proof`        | комментарий к PR или запуск вручную                                                       | Запускает целевую проверку чата OpenClaw Control UI с помощью Playwright для проверяемого варианта, подтверждает отправку данных браузером через имитированный Gateway, сохраняет снимки экрана и видео и публикует доказательства в PR. Этот канал проверяет только веб-чат, но не WinUI/нативное приложение или произвольное визуальное представление. |

`Mantis Discord Status Reactions` и `Mantis Telegram Live` принимают
`baseline_ref`/`candidate_ref` (либо `baseline=`/`candidate=` в комментарии к PR)
и перед запуском с учётными данными, содержащими секреты, проверяют, что разрешённый SHA
является либо предком `origin/main`, либо тегом выпуска (`v*`),
либо вершиной открытого PR.

Триггеры в комментариях к PR с доступом на запись, сопровождение или администрирование:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Триггеры Telegram в комментариях по умолчанию используют SHA вершины PR как проверяемый
вариант и `telegram-status-command` как сценарий; они принимают `provider=aws|hetzner` и
`lease=<cbx_...>`, чтобы выбрать конкретного поставщика Crabbox или предварительно
прогретый рабочий стол. `Mantis Telegram Desktop Proof` отвечает на комментарий к PR, только если
у PR уже есть метка `mantis: telegram-visible-proof`.

Триггеры чата веб-интерфейса в комментариях по умолчанию используют SHA вершины PR как
проверяемый вариант. Они запускают проверку чата Control UI с имитированным Gateway и
публикуют браузерные артефакты; для других веб-страниц и поверхностей нативного приложения
используйте обычную проверку Playwright/браузера, снимки экрана от сопровождающего, Crabbox
или локальные артефакты.

ClawSweeper также может запустить сценарий напрямую:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Машины и секреты

По умолчанию локальный CLI Crabbox использует `--provider hetzner --class beast`; это можно переопределить
с помощью `--provider`, `--class`/`--machine-class` или
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Рабочие процессы GitHub
часто переопределяют оба параметра (например, `--class standard`, а также входной параметр
выбора поставщика `aws`/`hetzner` в рабочем процессе Slack). Если
поставщик работает слишком медленно или недоступен, добавьте его через тот же интерфейс
Crabbox вместо жёстко заданного резервного варианта.

Базовая конфигурация виртуальной машины: Linux с поддерживающим рабочий стол Chrome/Chromium,
доступом CDP, VNC/noVNC, Node 22.22.3+, 24.15+ или 25.9+ и pnpm, рабочей копией OpenClaw,
а также исходящим доступом к целевому транспорту, GitHub, поставщикам моделей и брокеру
учётных данных.

Имена учётных данных и переменных окружения, используемые командами и рабочими процессами Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- Локальному `qa mantis run --credential-source env` также требуются
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
  и `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID`. Рабочие процессы GitHub обычно используют
  `--credential-source convex` и приведённые ниже учётные данные брокера вместо необработанных
  токенов бота Discord.
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для общедоступной загрузки артефактов
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY` (либо предназначенный для проверки Telegram Desktop
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`)
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (рабочие процессы также принимают
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` как резервный вариант и сопоставляют
  их с обычными именами перед вызовом Crabbox)
- `CRABBOX_ACCESS_CLIENT_ID`, `CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Средство запуска Mantis никогда не должно выводить токены ботов Discord/Slack/Telegram,
ключи API поставщиков, файлы cookie браузера, содержимое профилей аутентификации, пароли
VNC или необработанные данные учётных записей. Если токен попал в задачу, PR, чат или журнал,
замените его после сохранения нового секрета.

## Результаты запусков

Сценарии транспорта до/после различают следующие результаты, чтобы нестабильность
окружения не воспринималась как регрессия продукта:

- **Ошибка воспроизведена**: базовый вариант завершился сбоем ожидаемым сценарием образом.
- **Сбой тестовой системы**: произошёл сбой настройки окружения, учётных данных, API транспорта, браузера
  или поставщика до того, как критерий проверки получил значимый результат.

Проверка только проверяемого варианта в браузере сообщает, прошёл ли он проверки
имитированного Gateway и видимого интерфейса; она не утверждает, что ошибка была
воспроизведена на базовом варианте.

## Добавление сценария

Оперативные транспортные сценарии определяются на TypeScript отдельно для каждого транспорта
(пример структуры до/после для Discord см. в `MANTIS_SCENARIO_CONFIGS` в `extensions/qa-lab/src/mantis/run.runtime.ts`),
а не в отдельном декларативном формате файлов. Для каждого сценария требуются:
идентификатор и название, транспорт, необходимые учётные данные, политика ссылки на базовый
вариант, политика ссылки на проверяемый вариант, исправление конфигурации OpenClaw, этапы
настройки и воздействия, ожидаемые критерии проверки базового и проверяемого вариантов,
цели визуального захвата, лимит времени и этапы очистки.

Для целевой проверки в браузере только проверяемого варианта можно использовать отдельный
детерминированный тест E2E и рабочий процесс. Явно ограничьте его область, проверяйте ссылку
на проверяемый вариант перед выполнением, изолируйте публикацию с секретами и создавайте
манифест доказательств по тому же контракту.

Предпочитайте небольшие типизированные критерии проверки визуальному анализу: состояние
реакций или ссылки на сообщения Discord, состояние API реакции/`ts` цепочки Slack,
идентификаторы и заголовки сообщений электронной почты. Используйте снимки экрана браузера,
когда интерфейс — единственный надёжно наблюдаемый источник, а визуальные проверки делайте
дополнительными к критерию на основе API платформы, если такой критерий существует.

После Discord, Slack и Telegram ту же структуру средства запуска можно распространить на
WhatsApp (вход по QR-коду, повторная идентификация, доставка, медиафайлы, реакции) и Matrix
(зашифрованные комнаты, связи цепочек/ответов, возобновление после перезапуска); ни один из
этих вариантов пока не реализован.

## Открытые вопросы

- Какой бот Discord должен быть драйвером, а какой — SUT при повторном использовании существующего бота Mantis?
- Как долго GitHub должен хранить артефакты Mantis для PR?
- Когда ClawSweeper должен автоматически рекомендовать сценарий Mantis, а не ждать команды сопровождающего?
- Следует ли ретушировать или обрезать снимки экрана перед загрузкой в публичные PR?
