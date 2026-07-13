---
read_when:
    - Создание или выполнение визуального QA в реальной среде для ошибок OpenClaw
    - Добавление проверки до и после для запроса на включение изменений
    - Добавление сценариев с использованием Discord, Slack, WhatsApp или других каналов обмена сообщениями в реальном времени
    - Запуск целевой проверки Control UI в браузере для ссылки на версию-кандидат
    - Отладка прогонов QA, для которых требуются снимки экрана, автоматизация браузера или доступ по VNC
summary: Mantis собирает визуальные сквозные доказательства для сравнений транспортов в реальной среде и целевых браузерных проверок только для кандидатов, а затем прикрепляет артефакты к PR.
title: Mantis
x-i18n:
    generated_at: "2026-07-13T19:42:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: b4003d4a60c5a50be7cb11909328fa84e27dcf39f2e81228c09f641acbc644bb
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis публикует визуальные подтверждения CI и комментарий к PR о поведении OpenClaw.
Сценарии с реальными транспортами сравнивают заведомо некорректную базовую версию с проверяемым ref;
специализированные браузерные ветки вместо этого могут проверять одну версию на детерминированном
имитируемом транспорте. Первым был выпущен Discord с реальной аутентификацией бота, каналами сервера,
реакциями, ветками и браузерным наблюдателем. Также существуют ветки для Slack, Telegram и специализированного чата Control
UI; WhatsApp и Matrix не реализованы.

## Владение

- OpenClaw (`extensions/qa-lab/src/mantis/*`): среда выполнения сценариев, `pnpm openclaw qa mantis <command>` CLI, схема подтверждений.
- QA Lab (`extensions/qa-lab/src/live-transports/*`): стенд для реальных транспортов, боты драйвера/SUT, средства записи отчётов/подтверждений.
- Crabbox (`openclaw/crabbox`): прогретые машины Linux, аренды, VNC, `crabbox media preview`.
- GitHub Actions (`.github/workflows/mantis-*.yml`): удалённые точки входа, хранение артефактов.
- ClawSweeper: разбирает команды сопровождающих в PR, запускает рабочие процессы, публикует итоговый комментарий к PR.

## Команды CLI

Все команды имеют вид `pnpm openclaw qa mantis <command>` и определены в
`extensions/qa-lab/src/mantis/cli.ts`. Во время сборки/запуска требуется `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
(встроенные рабочие процессы задают `OPENCLAW_BUILD_PRIVATE_QA=1` и
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` перед сборкой).

| Команда                         | Назначение                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Проверяет, что Discord-бот Mantis видит сервер/канал, может публиковать сообщения и добавлять реакции.                                                                                 |
| `run`                           | Запускает сценарий «до/после» для базового и проверяемого ref (только Discord).                                                                           |
| `desktop-browser-smoke`         | Арендует/повторно использует рабочий стол Crabbox, открывает видимый браузер, записывает снимок экрана и видео.                                                                        |
| `slack-desktop-smoke`           | Арендует/повторно использует рабочий стол Crabbox, запускает в нём QA Slack, открывает Slack Web, записывает подтверждения.                                                                  |
| `telegram-desktop-builder`      | Арендует/повторно использует рабочий стол Crabbox, устанавливает Telegram Desktop и при необходимости настраивает Gateway OpenClaw.                                                        |
| `visual-task` / `visual-driver` | Универсальная запись рабочего стола Crabbox с необязательными проверками распознавания изображений; `visual-driver` — драйверная часть, запускаемая через `crabbox record --while`. |

Каждая команда принимает `--repo-root <path>` и `--output-dir <path>`; команды Crabbox
также принимают `--crabbox-bin`, `--provider`, `--machine-class`/`--class`,
`--lease-id`, `--idle-timeout`, `--ttl` и `--keep-lease`. Если не указано иное, локальные значения CLI по умолчанию
для провайдера/класса — `hetzner`/`beast`; рабочие процессы CI
обычно переопределяют оба.

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Вызывает REST API Discord (`https://discord.com/api/v10`), чтобы получить пользователя-бота,
сервер, каналы сервера и целевой канал, проверяет принадлежность
канала серверу, затем (если не задан `--skip-post`) публикует сообщение и
добавляет реакцию `👀`. Записывает `mantis-discord-smoke-summary.json` и
`mantis-discord-smoke-report.md`.

Порядок получения токена: значение `--token-file`, затем `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
(переопределяется через `--token-env`), затем файл, указанный в `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
(переопределяется через `--token-file-env`). Идентификаторы сервера/канала берутся из
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` (переопределяются через
`--guild-id` / `--channel-id`) и должны быть 17–20-значными snowflake-идентификаторами Discord. Задайте
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`, чтобы заменить идентификаторы и имена бота/сервера/канала/сообщения
на `<redacted>` в публикуемой сводке и отчёте.

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
встроенных идентификаторов, каждый со своим базовым ref по умолчанию и ожидаемыми метками
«до/после» (`extensions/qa-lab/src/mantis/run.runtime.ts`):

| Сценарий                                   | Базовая версия по умолчанию                           | Ожидается от базовой версии                         | Ожидается от проверяемой версии            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | ответ в ветке не содержит вложение `filePath` | ответ в ветке содержит его     |

Значение `--candidate` по умолчанию — `HEAD`. Другие флаги: `--credential-source`
(по умолчанию `convex`), `--credential-role` (по умолчанию `ci`), `--provider-mode`
(по умолчанию `live-frontier`), `--fast` (по умолчанию включён), `--skip-install`, `--skip-build`.

Средство запуска создаёт отсоединённые рабочие копии `git worktree` для базовой и
проверяемой версий в `<output-dir>/worktrees/`, запускает `pnpm install`/`pnpm build` в
каждой из них (если не пропущено), а затем запускает
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
для каждой рабочей копии. Каждая ветка записывает `discord-qa-reaction-timelines.json`
и пару `<scenario-id>-timeline.html`/`.png`; средство запуска копирует эти
подтверждения обратно в `baseline/`/`candidate/`, записывает `comparison.json`,
`mantis-report.md` и `mantis-evidence.json` в выходной каталог и
завершается с ненулевым кодом, если сравнение не пройдено (базовая версия `fail`, проверяемая версия
`pass`).

Второй сценарий Discord (`discord-thread-reply-filepath-attachment`) публикует
родительское сообщение с помощью бота-драйвера, создаёт настоящую ветку, вызывает действие SUT
`message.thread-reply` с локальным для репозитория `filePath`, затем опрашивает
ветку в ожидании ответа и имени файла вложения. Ожидается вложение
с именем `mantis-thread-report.md`.

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Арендует или повторно использует рабочий стол Crabbox, запускает браузер внутри сеанса VNC,
направленный на `--browser-url` (по умолчанию `https://openclaw.ai`) или отрисованный
`--html-file`, ожидает, делает снимок экрана с помощью `scrot`, при необходимости записывает MP4 с помощью
`ffmpeg` и синхронизирует через rsync `desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
обратно в `--output-dir`.

Флаги:

- `--lease-id <cbx_...>` повторно использует прогретый рабочий стол вместо создания нового.
- `--browser-profile-dir <remote-path>` повторно использует удалённый каталог пользовательских данных Chrome, чтобы постоянный рабочий стол сохранял вход между запусками (используется для долгоживущего профиля наблюдателя Discord Web).
- `--browser-profile-archive-env <name>` перед запуском восстанавливает из этой переменной окружения архив профиля Chrome `.tgz` в кодировке base64 (по умолчанию `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`); используется для наблюдателей с выполненным входом, например Discord Web.
- `--video-duration <seconds>` задаёт длительность записи MP4 (по умолчанию 10 с).
- `--keep-lease` (или `OPENCLAW_MANTIS_KEEP_VM=1`) оставляет созданную в этом запуске аренду открытой для проверки через VNC; неудачные запуски, создавшие аренду, также по умолчанию оставляют её открытой.

Для подтверждений Discord Web Mantis использует отдельную учётную запись наблюдателя, а не токен
бота. REST-оракул Discord (через `qa discord`) остаётся авторитетным источником; когда
задан `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарий также записывает
артефакт URL Discord Web, а `OPENCLAW_QA_DISCORD_KEEP_THREADS=1` оставляет
ветку открытой достаточно долго, чтобы браузер успел открыть её.

Рабочий процесс GitHub предпочитает постоянный профиль наблюдателя через
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` (полные архивы профилей могут превышать
ограничение GitHub на размер секрета); для небольших/начальных профилей вместо этого можно восстановить
`.tgz` в кодировке base64 из `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Если
не настроен ни один источник, рабочий процесс всё равно публикует детерминированные
снимки экрана базовой и проверяемой версий и сообщает в журнале, что наблюдатель с выполненным входом
был пропущен.

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Арендует или повторно использует рабочий стол Crabbox, синхронизирует рабочую копию с ВМ, запускает
`pnpm openclaw qa slack` внутри неё, открывает Slack Web в браузере VNC,
записывает рабочий стол и копирует локально как артефакты QA Slack (`slack-qa/`), так и
снимок экрана/видео VNC. Это единственная конфигурация Mantis, в которой
Gateway SUT и браузер работают внутри одной ВМ.

При наличии `--gateway-setup` команда создаёт постоянный одноразовый домашний каталог OpenClaw
в `$HOME/.openclaw-mantis/slack-openclaw` внутри ВМ, изменяет конфигурацию Slack
Socket Mode для целевого канала, запускает
`openclaw gateway run --dev --allow-unconfigured --port 38973` и оставляет
Chrome работающим в сеансе VNC; без `--gateway-setup` вместо этого запускается обычная
ветка QA Slack «бот-бот».

Обязательные переменные окружения для `--credential-source env` (локальное значение по умолчанию — `env`; значение роли
по умолчанию — `maintainer`):

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для удалённой ветки модели (если локально задан только `OPENAI_API_KEY`,
  Mantis копирует его в `OPENCLAW_LIVE_OPENAI_KEY` перед
  вызовом Crabbox)

При наличии `--credential-source convex` Mantis арендует учётные данные SUT Slack из
общего пула перед созданием ВМ и передаёт идентификатор канала, токен приложения и
токен бота в ВМ как переменные окружения `OPENCLAW_MANTIS_SLACK_*`, поэтому рабочим процессам GitHub
нужен только секрет брокера Convex, а не необработанные токены Slack.

Другие флаги: `--slack-url <url>` открывает указанный URL (в противном случае Mantis формирует
`https://app.slack.com/client/<team>/<channel>` из `auth.test`);
`--slack-channel-id <id>` задаёт канал в списке разрешённых Gateway;
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` управляет постоянным профилем Chrome
внутри ВМ (по умолчанию `$HOME/.config/openclaw-mantis/slack-chrome-profile`);
`--approval-checkpoints` запускает нативные сценарии подтверждения Slack
(`slack-approval-exec-native`, `slack-approval-plugin-native`) и отрисовывает
снимки экрана контрольных точек в состояниях ожидания/завершения вместо настройки Gateway (несовместимо
с `--gateway-setup`); `--hydrate-mode source|prehydrated`,
`--provider-mode`, `--model`, `--alt-model` и `--fast` передаются в
ветку Slack с реальным транспортом.

Снимки экрана контрольных точек подтверждения отрисовываются из сообщения Slack API, которое
наблюдал сценарий, а не из реального интерфейса Slack; `slack-desktop-smoke.png` подтверждает только
сам Slack Web, если в профиле браузера аренды уже был выполнен вход.

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
сообщение о готовности от бота-драйвера в арендованной закрытой группе, затем делает
снимок экрана и записывает MP4. Токен бота только настраивает OpenClaw; он никогда не выполняет
вход в Telegram Desktop. Наблюдатель рабочего стола — это отдельный пользовательский сеанс Telegram,
восстановленный из `--telegram-profile-archive-env <name>` или авторизованный вручную
через VNC и сохраняемый активным с помощью `--keep-lease`.

Флаги: `--lease-id <cbx_...>` повторно запускает сценарий в ВМ, где уже выполнен вход в
Telegram Desktop; `--telegram-profile-archive-env <name>` перед запуском восстанавливает архив профиля
`.tgz` в кодировке base64; `--telegram-profile-dir <remote-path>`
задаёт удалённый каталог профиля (по умолчанию `$HOME/.local/share/TelegramDesktop`);
`--no-gateway-setup` только устанавливает и открывает Telegram Desktop;
значения `--credential-source`/`--credential-role` по умолчанию — `convex`/`maintainer`.

## Манифест подтверждений

Каждый сценарий, публикующий данные в PR, записывает `mantis-evidence.json` рядом со своим
отчётом:

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Контроль качества реакций статуса Discord в Mantis",
  "summary": "Понятная человеку сводка верхнего уровня для комментария к PR.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "только в очереди" },
    "candidate": { "sha": "...", "status": "pass", "expected": "в очереди -> обдумывание -> готово" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Базовый вариант: только в очереди",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Временная шкала базового варианта в Discord",
      "width": 420
    }
  ]
}
```

Артефакт `path` задаётся относительно каталога манифеста; `targetPath` —
относительно настроенного префикса артефактов R2/S3. `scripts/mantis/publish-pr-evidence.mjs`
отклоняет обход каталогов и пропускает записи с `"required": false`, если
файл отсутствует.

Виды артефактов: `timeline` (детерминированный снимок экрана до/после),
`desktopScreenshot` (снимок экрана VNC/браузера), `motionPreview` (встроенный анимированный
GIF из записи), `motionClip` (MP4 с обрезанными участками без движения), `fullVideo` (полная
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

Снимки экрана являются доказательствами, а не секретами, но всё равно требуют
строгого редактирования конфиденциальных данных: на них могут присутствовать названия закрытых каналов,
имена пользователей или содержимое сообщений. Задайте `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
для общедоступной загрузки артефактов; по умолчанию этот параметр
включён в рабочих процессах GitHub для Discord/Slack/Telegram.

## Автоматизация GitHub

`scripts/mantis/publish-pr-evidence.mjs` — переиспользуемый издатель. Рабочие процессы
вызывают его с манифестом, целевым PR, корневым каталогом назначения артефактов, маркером комментария,
URL артефакта, URL запуска и источником запроса. Он загружает объявленные артефакты в
бакет Mantis R2, формирует комментарий к PR со сводкой в начале, встроенными
изображениями/предпросмотрами и ссылками на видео, а затем обновляет существующий комментарий с маркером или
создаёт новый. Обязательные переменные среды:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (рабочие процессы задают `openclaw-crabbox-artifacts`)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (рабочие процессы задают `auto`)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (рабочие процессы задают `https://artifacts.openclaw.ai`)

Комментарии публикуются через приложение Mantis для GitHub (`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`), а не через `github-actions[bot]`; скрытый
комментарий-маркер используется как ключ для добавления или обновления.

| Рабочий процесс                   | Триггер                                                                                    | Что он делает                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | ручной запуск                                                                              | Запускает `discord-smoke` для выбранной ссылки.                                                                                                                                                                                                                                                                  |
| `Mantis Discord Status Reactions` | комментарий к PR или ручной запуск                                                         | Создаёт отдельные рабочие деревья базового и кандидатного вариантов, запускает `discord-status-reactions-tool-only` для каждого, отображает временную шкалу каждого потока в настольном браузере Crabbox, создаёт обрезанные по движению предпросмотры GIF/MP4 с помощью `crabbox media preview`, загружает артефакты и публикует встроенные доказательства в PR. |
| `Mantis Scenario`                 | ручной запуск                                                                              | Универсальный диспетчер: принимает `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`, `web-ui-chat-proof`), `baseline_ref`, `candidate_ref`, `pr_number` и перенаправляет их соответствующему рабочему процессу сценария. |
| `Mantis Slack Desktop Smoke`      | ручной запуск                                                                              | Арендует настольную Linux-машину Crabbox (по умолчанию `aws`, с выбором `hetzner`), запускает `slack-desktop-smoke --gateway-setup` для кандидата, записывает рабочий стол, создаёт предпросмотр движения, загружает артефакты и публикует доказательства в PR, если указан номер PR. |
| `Mantis Telegram Live`            | комментарий к PR или ручной запуск                                                         | Запускает поток интерактивного контроля качества Telegram через API бота (`openclaw qa telegram`), записывает `mantis-evidence.json` из сводки контроля качества, отображает отредактированный HTML с доказательствами в настольном браузере Crabbox, создаёт GIF с движением и публикует доказательства в PR. Для этого потока вход в Telegram Web не требуется. |
| `Mantis Telegram Desktop Proof`   | метка PR от сопровождающего (`mantis: telegram-visible-proof`) вместе с комментарием к PR или ручной запуск | Агентское нативное доказательство Telegram Desktop до/после. Передаёт PR, ссылки базового/кандидатного вариантов и инструкции сопровождающего в Codex, который запускает для обеих ссылок поток доказательства Telegram Desktop с реальным пользователем в Crabbox и публикует в PR двухколоночную таблицу доказательств. |
| `Mantis Web UI Chat Proof`        | комментарий к PR или ручной запуск                                                         | Запускает для кандидата целевое доказательство чата OpenClaw Control UI в Playwright, проверяет, что браузер выполняет отправку через имитируемый Gateway, сохраняет снимки экрана и видео и публикует доказательства в PR. Этот поток доказывает работу только веб-чата, а не WinUI/нативного приложения или произвольного визуального интерфейса. |

`Mantis Discord Status Reactions` и `Mantis Telegram Live` принимают
`baseline_ref`/`candidate_ref` (или `baseline=`/`candidate=` в комментарии к PR)
и перед запуском с учётными данными, содержащими секреты, проверяют, что разрешённый SHA
либо является предком `origin/main`, либо соответствует тегу выпуска
(`v*`), либо является вершиной открытого PR.

Триггеры в комментариях из PR с уровнем доступа write/maintain/admin:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Триггеры Telegram в комментариях по умолчанию используют SHA вершины PR как кандидата и
`telegram-status-command` как сценарий; они принимают `provider=aws|hetzner` и
`lease=<cbx_...>`, чтобы указать конкретного провайдера Crabbox или заранее прогретую
настольную машину. `Mantis Telegram Desktop Proof` отвечает на комментарий к PR, только если
у PR уже есть метка `mantis: telegram-visible-proof`.

Триггеры веб-чата UI в комментариях по умолчанию используют SHA вершины PR как кандидата. Они запускают
доказательство чата Control UI с имитируемым Gateway и публикуют артефакты браузера; для
других веб-страниц и поверхностей нативного приложения используйте обычное доказательство
Playwright/браузера, снимки экрана от сопровождающего, Crabbox или локальные артефакты.

ClawSweeper также может запустить сценарий напрямую:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## Машины и секреты

Локальные значения CLI Crabbox по умолчанию — `--provider hetzner --class beast`; переопределите их
с помощью `--provider`, `--class`/`--machine-class` или
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS`. Рабочие процессы GitHub
обычно переопределяют оба значения (например, `--class standard`, а также входной параметр
выбора провайдера `aws`/`hetzner` в рабочем процессе Slack). Если провайдер работает
слишком медленно или недоступен, добавьте его через тот же интерфейс Crabbox, а не
жёстко задавайте резервный вариант.

Базовые требования к виртуальной машине: Linux с поддерживающим рабочий стол Chrome/Chromium, доступом CDP, VNC/
noVNC, Node 22.22.3+, 24.15+ или 25.9+ и pnpm, рабочей копией OpenClaw, а также
исходящим доступом к целевому транспорту, GitHub, провайдерам моделей и
посреднику учётных данных.

Имена секретов, используемые в рабочих процессах Mantis:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для общедоступной загрузки артефактов
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (рабочие процессы также принимают
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` как резервный вариант и сопоставляют
  их с обычными именами перед вызовом Crabbox)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Средство запуска Mantis никогда не должно выводить токены ботов Discord/Slack/Telegram,
API-ключи провайдеров, файлы cookie браузера, содержимое профилей аутентификации, пароли VNC или
необработанные полезные данные учётных данных. Если токен попал в задачу, PR, чат или журнал,
замените его после сохранения нового секрета.

## Результаты запуска

Транспортные сценарии до/после различают следующие результаты, чтобы нестабильная
среда не воспринималась как регрессия продукта:

- **Ошибка воспроизведена**: базовый вариант завершился с ожидаемой сценарием ошибкой.
- **Сбой тестовой инфраструктуры**: настройка среды, учётные данные, API транспорта, браузер
  или провайдер дали сбой до того, как проверка результата стала содержательной.

Доказательство только для кандидата в браузере сообщает, прошёл ли кандидат проверки
имитируемого Gateway и видимого UI; оно не утверждает, что ошибка была воспроизведена
в базовом варианте.

## Добавление сценария

Интерактивные транспортные сценарии определяются на TypeScript отдельно для каждого транспорта (формат
до/после для Discord см. в `MANTIS_SCENARIO_CONFIGS` в `extensions/qa-lab/src/mantis/run.runtime.ts`),
а не в отдельном декларативном формате файлов.
Каждому сценарию необходимы: идентификатор и заголовок, транспорт, обязательные учётные данные, политика
ссылки базового варианта, политика ссылки кандидата, исправление конфигурации OpenClaw, шаги
настройки/воздействия, ожидаемая проверка результата для базового варианта и кандидата, цели визуального
захвата, бюджет времени ожидания и шаги очистки.

Целевое доказательство в браузере только для кандидата может использовать отдельный
детерминированный E2E-тест и рабочий процесс. Явно ограничивайте его область действия, проверяйте
ссылку кандидата перед выполнением, изолируйте публикацию с секретами и формируйте
тот же контракт манифеста доказательств.

Предпочитайте небольшие типизированные проверки результата визуальным проверкам: состояние реакций Discord или
ссылки на сообщения, идентификатор потока Slack `ts`/состояние API реакций, идентификаторы
и заголовки сообщений электронной почты. Используйте снимки экрана браузера, когда UI является единственным
надёжным наблюдаемым источником, и делайте визуальные проверки дополнением к проверке через API платформы,
если такой API существует.

После Discord, Slack и Telegram ту же структуру средства запуска можно расширить на WhatsApp
(вход по QR-коду, повторная идентификация, доставка, медиафайлы, реакции) и Matrix
(зашифрованные комнаты, связи потоков/ответов, возобновление после перезапуска); ни один из этих вариантов
пока не реализован.

## Открытые вопросы

- Какой бот Discord должен быть драйвером, а какой — тестируемой системой при повторном использовании
  существующего бота Mantis?
- Как долго GitHub должен хранить артефакты Mantis для PR?
- Когда ClawSweeper должен автоматически рекомендовать сценарий Mantis, а не
  ждать команды сопровождающего?
- Следует ли редактировать или обрезать снимки экрана перед загрузкой в общедоступные PR?
