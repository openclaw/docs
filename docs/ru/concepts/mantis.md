---
read_when:
    - Создание или запуск живого визуального QA для ошибок OpenClaw
    - Добавление проверки до и после для запроса на включение изменений
    - Добавление сценариев Discord, Slack, WhatsApp или других живых транспортов
    - Отладка прогонов QA, которым нужны скриншоты, автоматизация браузера или доступ через VNC
summary: Mantis — это система визуальной сквозной проверки для воспроизведения ошибок OpenClaw на живых транспортах, сбора доказательств до и после изменений и прикрепления артефактов к PR.
title: Богомол
x-i18n:
    generated_at: "2026-06-28T22:50:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis — это система сквозной верификации OpenClaw для ошибок, которым нужны реальная
среда выполнения, реальный транспорт и видимое доказательство. Она запускает сценарий на известном
плохом ref, собирает доказательства, запускает тот же сценарий на кандидатном ref и
публикует сравнение как артефакты, которые сопровождающий может проверить из PR или
из локальной команды.

Mantis начинается с Discord, потому что Discord дает нам первую высокоценную линию:
реальную аутентификацию бота, реальные каналы гильдий, реакции, треды, нативные команды и
браузерный UI, где люди могут визуально подтвердить, что показал транспорт.

## Цели

- Воспроизвести ошибку из GitHub issue или PR с той же формой транспорта, которую видят
  пользователи.
- Зафиксировать артефакт **до** на базовом ref перед применением исправления.
- Зафиксировать артефакт **после** на кандидатном ref после применения исправления.
- По возможности использовать детерминированный оракул, например чтение реакции через Discord REST
  или проверку транскрипта канала.
- Делать снимки экрана, когда ошибка имеет видимую поверхность UI.
- Запускать локально из CLI под управлением агента и удаленно из GitHub.
- Сохранять достаточно машинного состояния для восстановления через VNC, когда вход, браузерная автоматизация или
  аутентификация провайдера застревают.
- Отправлять краткий статус в операторский канал Discord, когда запуск заблокирован,
  требует ручной помощи через VNC или завершается.

## Не цели

- Mantis не заменяет модульные тесты. Запуск Mantis обычно должен превращаться
  в меньший регрессионный тест после того, как исправление понято.
- Mantis не является обычным быстрым CI-гейтом. Он медленнее, использует живые учетные данные и
  предназначен для ошибок, где важна живая среда.
- Mantis не должен требовать человека для обычной работы. Ручной VNC — это путь восстановления,
  а не штатный путь.
- Mantis не сохраняет необработанные секреты в артефактах, логах, снимках экрана, Markdown
  отчетах или комментариях PR.

## Владение

Mantis находится в QA-стеке OpenClaw.

- OpenClaw владеет средой выполнения сценариев, транспортными адаптерами, схемой доказательств и
  локальным CLI в `pnpm openclaw qa mantis`.
- QA Lab владеет частями harness для живого транспорта, помощниками захвата браузера и
  писателями артефактов.
- Crabbox владеет прогретыми Linux-машинами, когда нужна удаленная VM.
- GitHub Actions владеет удаленной точкой входа workflow и хранением артефактов.
- ClawSweeper владеет маршрутизацией комментариев GitHub: разбором команд сопровождающих,
  запуском workflow и публикацией итогового комментария PR.
- Агенты OpenClaw управляют Mantis через Codex, когда сценарию нужны агентная настройка,
  отладка или отчет о застрявшем состоянии.

Эта граница сохраняет знания о транспорте в OpenClaw, планирование машин в
Crabbox, а связующий слой workflow сопровождающих — в ClawSweeper.

## Форма команды

Первая локальная команда проверяет бота Discord, гильдию, канал, отправку сообщения,
отправку реакции и путь артефактов:

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Локальный runner для до и после принимает такую форму:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

Runner создает отделенные worktree для baseline и candidate в выходном
каталоге, устанавливает зависимости, собирает каждый ref, запускает сценарий с
`--allow-failures`, затем записывает `baseline/`, `candidate/`, `comparison.json`
и `mantis-report.md`. Для первого сценария Discord успешная верификация
означает, что статус baseline — `fail`, а статус candidate — `pass`.

Второй Discord-зонд до/после нацелен на вложения в тредах:

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

Этот сценарий публикует родительское сообщение с driver-ботом, создает реальный тред Discord,
вызывает действие OpenClaw `message.thread-reply` с repo-local
`filePath`, затем опрашивает тред на наличие ответа SUT и имени файла вложения. Снимок экрана
baseline показывает ответ без вложения; снимок экрана candidate
показывает ожидаемое вложение `mantis-thread-report.md`.

Первая примитивная VM/browser-проверка — desktop smoke:

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Она арендует или повторно использует desktop-машину Crabbox, запускает видимый браузер внутри
VNC-сессии, захватывает рабочий стол, подтягивает артефакты обратно в локальный выходной
каталог и записывает команду повторного подключения в отчет. По умолчанию команда использует
провайдера Hetzner, потому что это первый провайдер с рабочим покрытием desktop/VNC
в линии Mantis. Переопределите его через `--provider`, `--crabbox-bin` или
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` при запуске на другом парке Crabbox.

Полезные флаги desktop smoke:

- `--lease-id <cbx_...>` или `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` повторно использует прогретый desktop.
- `--browser-url <url>` меняет страницу, открытую в видимом браузере.
- `--html-file <path>` отображает repo-local HTML-артефакт в видимом браузере. Mantis использует это для захвата сгенерированной временной шкалы реакций статуса Discord через реальный desktop Crabbox.
- `--browser-profile-dir <remote-path>` повторно использует удаленный Chrome user-data-dir, чтобы постоянный desktop Mantis мог оставаться залогиненным между запусками. Используйте это для долгоживущего профиля просмотрщика Discord Web.
- `--browser-profile-archive-env <name>` восстанавливает base64 `.tgz` архив Chrome user-data-dir из указанной переменной окружения перед запуском браузера. Используйте это для залогиненных свидетелей, таких как Discord Web. Переменная окружения по умолчанию — `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`.
- `--video-duration <seconds>` управляет длительностью MP4-захвата. Используйте большую длительность для медленных залогиненных веб-приложений, которым нужно время стабилизироваться.
- `--keep-lease` или `OPENCLAW_MANTIS_KEEP_VM=1` оставляет новый успешно созданный lease открытым для проверки через VNC. Неуспешные запуски по умолчанию оставляют lease, если он был создан, чтобы оператор мог переподключиться.
- `--class`, `--idle-timeout` и `--ttl` настраивают размер машины и срок жизни lease.

Для доказательств Discord Web Mantis использует выделенную учетную запись просмотрщика вместо
токена бота. Живой сценарий Discord API остается оракулом: он создает реальный
тред, отправляет SUT `thread-reply` и проверяет вложение через Discord
REST. Когда задан `OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1`, сценарий также
записывает артефакт URL Discord Web. Когда задан `OPENCLAW_QA_DISCORD_KEEP_THREADS=1`, он
оставляет этот тред доступным достаточно долго, чтобы залогиненный браузер мог открыть
и записать его.

GitHub workflow открывает URL треда candidate в Discord Web, делает
снимок экрана, записывает MP4 и генерирует обрезанный GIF-превью с движением, когда доступен
медиа-инструментарий Crabbox. Предпочитайте постоянный путь профиля просмотрщика, настроенный
через `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR`, потому что полные архивы профиля Chrome
могут превысить лимит размера секретов GitHub. Для небольших/bootstrap-профилей
workflow также может восстановить base64 `.tgz` архив из
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64`. Если не настроен ни один источник профиля,
workflow все равно публикует детерминированные снимки вложений baseline/candidate
и логирует уведомление, что залогиненный свидетель Discord Web был пропущен.

Первая полноценная примитивная проверка desktop-транспорта — Slack desktop smoke:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Она арендует или повторно использует desktop-машину Crabbox, синхронизирует текущий checkout в
VM, запускает `pnpm openclaw qa slack` внутри этой VM, открывает Slack Web в VNC
браузере, захватывает видимый рабочий стол и копирует как артефакты Slack QA, так и
VNC-снимок экрана обратно в локальный выходной каталог. Это первая форма Mantis,
где SUT OpenClaw gateway и браузер находятся внутри одной и той же
Linux desktop VM.

С `--gateway-setup` команда подготавливает постоянный одноразовый OpenClaw
home в `$HOME/.openclaw-mantis/slack-openclaw`, патчит конфигурацию Slack Socket Mode
для выбранного канала, запускает `openclaw gateway run` на порту
`38973` и оставляет Chrome запущенным в VNC-сессии. Это режим «оставь мне
Linux desktop со Slack и запущенным claw»; bot-to-bot линия Slack QA
остается режимом по умолчанию, когда `--gateway-setup` опущен.

Обязательные входные данные для `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- `OPENCLAW_LIVE_OPENAI_KEY` для удаленной модельной линии. Если локально задан только
  `OPENAI_API_KEY`, Mantis сопоставляет его с `OPENCLAW_LIVE_OPENAI_KEY`
  перед вызовом Crabbox, чтобы проброс env `OPENCLAW_*` в Crabbox мог доставить его
  в VM.

С `--gateway-setup --credential-source convex` Mantis арендует учетные данные Slack SUT
из общего пула перед созданием VM и передает арендованные
id канала, app token Socket Mode и bot token как runtime env `OPENCLAW_MANTIS_SLACK_*`
внутри desktop. Это сохраняет GitHub workflows тонкими: им нужен только
секрет брокера Convex, а не необработанные Slack bot или app tokens.

Полезные флаги Slack desktop:

- `--lease-id <cbx_...>` повторно запускает проверку на машине, где оператор уже вошел в Slack Web через VNC.
- `--gateway-setup` запускает постоянный OpenClaw Slack gateway в VM вместо запуска только bot-to-bot линии QA.
- `--keep-lease` оставляет VM с gateway открытой для проверки через VNC после успеха; `--no-keep-lease` останавливает ее после сбора артефактов.
- `--slack-url <url>` открывает конкретный URL Slack Web. Без него Mantis выводит `https://app.slack.com/client/<team>/<channel>` из Slack `auth.test`, когда доступен bot token SUT.
- `--slack-channel-id <id>` управляет allowlist канала Slack, используемым настройкой gateway.
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` управляет постоянным профилем Chrome внутри VM. Значение по умолчанию — `$HOME/.config/openclaw-mantis/slack-chrome-profile`, поэтому ручной вход в Slack Web переживает повторные запуски на том же lease.
- `--credential-source convex --credential-role ci` использует общий пул учетных данных вместо прямых env-токенов Slack.
- `--provider-mode`, `--model`, `--alt-model` и `--fast` передаются в живую линию Slack.

Запуски approval checkpoint отображают снимки сообщений Slack API в checkpoint PNG
для CI-безопасного визуального доказательства. `slack-desktop-smoke.png` является доказательством Slack Web
только когда lease использует теплый профиль браузера, который уже залогинен.

GitHub smoke workflow — `Mantis Discord Smoke`. GitHub workflow до и после
для первого реального сценария — `Mantis Discord Status Reactions`. Он
принимает:

- `baseline_ref`: ref, который должен воспроизводить поведение только queued.
- `candidate_ref`: ref, который должен показывать `queued -> thinking -> done`.

Он делает checkout ref workflow harness, собирает отдельные worktree baseline и candidate,
запускает `discord-status-reactions-tool-only` против каждого worktree и
загружает `baseline/`, `candidate/`, `comparison.json` и `mantis-report.md` как
артефакты Actions. Он также отображает timeline HTML каждой линии в desktop-браузере Crabbox
и публикует эти VNC-снимки экрана рядом с детерминированными
timeline PNG в комментарии PR. Тот же комментарий PR встраивает легкие
обрезанные GIF-превью с движением, сгенерированные `crabbox media preview`, ссылается на
соответствующие обрезанные MP4-клипы с движением и сохраняет полные desktop MP4-файлы для глубокого
анализа. Снимки экрана остаются встроенными для быстрого review. Workflow собирает
Crabbox CLI из
`openclaw/crabbox` main, чтобы использовать текущие флаги desktop/browser lease
до выхода следующего бинарного релиза Crabbox.

`Mantis Scenario` — это универсальная ручная точка входа. Она принимает `scenario_id`,
`candidate_ref`, необязательный `baseline_ref` и необязательный `pr_number`, затем
запускает workflow, принадлежащий сценарию. Обертка намеренно тонкая:
workflow сценариев по-прежнему сами отвечают за настройку транспорта, учетные данные,
класс VM, ожидаемый oracle и манифест артефактов.

`Mantis Slack Desktop Smoke` — первый workflow Slack VM. Он извлекает
доверенный candidate ref в отдельный worktree, арендует рабочий стол Crabbox Linux,
запускает `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` для этого
candidate, открывает Slack Web в браузере VNC, записывает рабочий стол, создает
предпросмотр с обрезкой по движению через `crabbox media preview`, загружает весь
каталог артефактов и при необходимости публикует встроенный комментарий с evidence в целевом PR.
По умолчанию для аренды рабочего стола используется AWS, а также доступен ручной ввод provider,
чтобы операторы могли переключиться на Hetzner, когда емкость AWS медленная или недоступна. Используйте
этот lane, когда нужен «рабочий стол Linux со Slack и запущенным claw», а не
только Slack-транскрипт bot-to-bot.

`Mantis Telegram Live` оборачивает существующий lane live QA для Telegram в тот же PR
pipeline evidence. Он извлекает доверенный candidate ref в отдельный
worktree, запускает `pnpm openclaw qa telegram --credential-source convex
--credential-role ci`, записывает манифест `mantis-evidence.json` из
сводки Telegram QA, `qa-evidence.json` и артефактов отчета, рендерит
редактированный HTML evidence через браузер рабочего стола Crabbox, создает
GIF с обрезкой по движению через `crabbox media preview` и публикует встроенный PR
комментарий с evidence, когда доступен номер PR. Этот lane является визуальным QA-evidence,
а не proof с авторизованным Telegram Web: Telegram Bot API дает стабильное live
evidence сообщений, но состояние входа в Telegram Web не требуется для обычной автоматизации Mantis.

`Mantis Telegram Desktop Proof` — это agentic native Telegram Desktop
обертка before/after. Maintainer может запустить ее из комментария PR с
`@openclaw-mantis telegram desktop proof`, из UI Actions с произвольными
инструкциями или через универсальный диспетчер `Mantis Scenario`. Workflow
передает PR, baseline ref, candidate ref и инструкции maintainer в Codex.
Агент читает PR, решает, какое Telegram-visible поведение доказывает
изменение, запускает real-user Crabbox Telegram Desktop proof lane для baseline и
candidate, повторяет до тех пор, пока native GIF не станут полезными, записывает парные
артефакты `motionPreview` в `mantis-evidence.json`, загружает bundle и
публикует двухколоночную таблицу PR evidence, когда доступен номер PR.

Для настройки Telegram desktop с участием человека используйте builder сценария:

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Builder арендует или переиспользует рабочий стол Crabbox, устанавливает native Linux
бинарник Telegram Desktop, при необходимости восстанавливает архив пользовательской сессии, настраивает
OpenClaw с арендованным токеном Telegram SUT bot, запускает `openclaw gateway run`
на порту `38974`, публикует сообщение готовности driver-bot в арендованную private
group, затем делает screenshot и MP4 с видимого рабочего стола VNC. Bot
token никогда не выполняет вход в Telegram Desktop; он только настраивает OpenClaw. Просмотрщик
desktop — это отдельная пользовательская сессия Telegram, восстановленная из
`--telegram-profile-archive-env <name>` или созданная вручную через VNC и сохраняемая
активной с `--keep-lease`.

Полезные флаги Telegram desktop builder:

- `--lease-id <cbx_...>` повторно запускает against VM, где оператор уже вошел в Telegram Desktop.
- `--telegram-profile-archive-env <name>` читает base64 `.tgz` архив профиля Telegram Desktop из этой env var и восстанавливает его перед запуском.
- `--telegram-profile-dir <remote-path>` управляет удаленным каталогом профиля Telegram Desktop. Значение по умолчанию — `$HOME/.local/share/TelegramDesktop`.
- `--no-gateway-setup` устанавливает и открывает Telegram Desktop без настройки OpenClaw.
- `--credential-source convex --credential-role ci` использует общий credential broker вместо прямых Telegram env tokens.

Каждый сценарий, публикующий в PR, записывает `mantis-evidence.json` рядом со своим отчетом.
Эта схема является handoff между кодом сценария и комментариями GitHub:

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

Значения `path` артефактов задаются относительно каталога манифеста. Значения `targetPath`
являются относительными путями внутри настроенного префикса артефактов Mantis R2/S3. Publisher
отклоняет path traversal и пропускает записи с `"required": false`,
когда необязательные previews или videos недоступны.

Поддерживаемые виды артефактов:

- `timeline`: детерминированный screenshot сценария, обычно before/after.
- `desktopScreenshot`: screenshot рабочего стола VNC/browser.
- `motionPreview`: inline animated GIF, созданный из записи рабочего стола.
- `motionClip`: MP4 с обрезкой по движению, удаляющий статический lead-in и tail.
- `fullVideo`: полная MP4-запись для глубокого анализа.
- `metadata`: JSON/log sidecar.
- `report`: Markdown-отчет.

Переиспользуемый publisher — `scripts/mantis/publish-pr-evidence.mjs`. Workflows
вызывают его с манифестом, целевым PR, корнем назначения артефактов, marker комментария,
URL артефакта Actions, run URL и источником запроса. Он загружает объявленные артефакты
в настроенный bucket Mantis R2/S3, строит PR-комментарий в формате summary-first со
встроенными images/previews и linked videos, затем обновляет существующий marker
comment или создает новый. Workflows публикуют в `openclaw-crabbox-artifacts`
с публичными URL под `https://artifacts.openclaw.ai`. Они передают значения bucket,
region и public URL напрямую. Переиспользуемому publisher требуются:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

Вы также можете запустить status-reactions run напрямую из комментария PR:

```text
@openclaw-mantis discord status reactions
```

Comment trigger намеренно узкий. Он запускается только для pull request
comments от пользователей с write, maintain или admin access, и распознает
только запросы Discord status-reaction. По умолчанию он использует известный плохой baseline ref
и текущий PR head SHA как candidate. Maintainers могут переопределить любой
ref:

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA также можно запустить из комментария PR:

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

По умолчанию он использует текущий PR head SHA как candidate и запускает
`telegram-status-command`. Maintainers могут переопределить `candidate=...`,
`provider=aws|hetzner` и `lease=<cbx_...>`, когда им нужен конкретный ref или
предварительно прогретый рабочий стол Crabbox.

Примеры команд ClawSweeper:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

Первая команда явная и сфокусирована на сценарии. Вторая позже сможет сопоставлять PR
или issue с рекомендуемыми сценариями Mantis на основе labels, changed files и
review findings ClawSweeper.

## Жизненный цикл run

1. Получить credentials.
2. Выделить или переиспользовать VM.
3. Подготовить профиль desktop/browser, когда сценарию требуется UI evidence.
4. Подготовить чистый checkout для baseline ref.
5. Установить dependencies и собрать только то, что нужно сценарию.
6. Запустить дочерний OpenClaw Gateway с изолированным state directory.
7. Настроить live transport, provider, model и browser profile.
8. Запустить сценарий и собрать baseline evidence.
9. Остановить gateway и сохранить logs.
10. Подготовить candidate ref в той же VM.
11. Запустить тот же сценарий и собрать candidate evidence.
12. Сравнить oracle results и visual evidence.
13. Записать Markdown, JSON, logs, screenshots и необязательные trace artifacts.
14. Загрузить GitHub Actions artifacts.
15. Опубликовать краткий status message в PR или Discord.

Сценарий должен уметь завершаться с ошибкой двумя разными способами:

- **Bug reproduced**: baseline упал ожидаемым образом.
- **Harness failure**: environment setup, credentials, Discord API, browser или
  provider упали до того, как bug oracle стал осмысленным.

Финальный отчет должен разделять эти случаи, чтобы maintainers не путали нестабильную
environment с поведением продукта.

## Discord MVP

Первый сценарий должен быть нацелен на Discord status reactions в guild channels, где
режим доставки source reply — `message_tool_only`.

Почему это хороший начальный Mantis seed:

- Он видим в Discord как reactions на triggering message.
- У него сильный REST oracle через состояние reaction сообщения Discord.
- Он задействует реальный OpenClaw Gateway, auth Discord bot, message dispatch,
  source reply delivery mode, status reaction state и жизненный цикл model turn.
- Он достаточно узкий, чтобы первый implementation оставался честным.

Ожидаемая форма сценария:

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

Baseline evidence должен показывать queued acknowledgement reaction, но без
lifecycle transition в tool-only mode. Candidate evidence должен показывать lifecycle
status reactions, работающие при явно включенном `messages.statusReactions.enabled`.

Первый executable slice — это opt-in Discord live QA scenario:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

Он настраивает SUT с always-on guild handling, `visibleReplies:
"message_tool"`, `ackReaction: "👀"` и явными status reactions. Oracle
опрашивает реальное triggering message в Discord и ожидает наблюдаемую sequence
`👀 -> 🤔 -> 👍`. Артефакты включают `discord-qa-reaction-timelines.json`,
`discord-status-reactions-tool-only-timeline.html` и
`discord-status-reactions-tool-only-timeline.png`.

## Существующие части QA

Mantis должен строиться на существующем private QA stack, а не начинаться с
нуля:

- `pnpm openclaw qa discord` уже запускает live Discord lane с driver и
  SUT bots.
- Live transport runner уже записывает reports, QA evidence и
  transport-specific artifacts в `.artifacts/qa-e2e/`.
- Convex credential leases уже предоставляют exclusive access к shared live
  transport credentials.
- Browser control service уже поддерживает screenshots, snapshots,
  headless managed profiles и remote CDP profiles.
- QA Lab уже имеет debugger UI и bus для transport-shaped testing.

Первая реализация Mantis может быть тонким before/after runner поверх этих
частей плюс один слой visual evidence.

## Модель evidence

Каждый run записывает стабильный каталог артефактов:

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

`mantis-summary.json` должен быть машиночитаемым источником истины. Отчет
Markdown предназначен для комментариев к PR и ручной проверки.

Сводка должна включать:

- проверенные refs и SHA
- транспорт и идентификатор сценария
- поставщика машины и идентификатор машины или идентификатор аренды
- источник учетных данных без секретных значений
- результат baseline
- результат candidate
- воспроизвелась ли ошибка на baseline
- исправил ли ее candidate
- пути к артефактам
- очищенные сведения о проблемах настройки или очистки

Скриншоты являются доказательством, а не секретами. При этом они все равно
требуют дисциплины редактирования: на них могут быть видны названия приватных
каналов, имена пользователей или содержимое сообщений. Для публичных PR
предпочитайте ссылки на артефакты GitHub Actions вместо встроенных изображений,
пока история с редактированием не станет надежнее.

## Браузер и VNC

Браузерный путь имеет два режима:

- **Автоматизация без интерфейса**: режим по умолчанию для CI. Chrome запускается
  с включенным CDP, а Playwright или браузерное управление OpenClaw делает
  скриншоты.
- **Аварийный доступ через VNC**: включается на той же VM, когда вход в систему,
  MFA, защита Discord от автоматизации или визуальная отладка требуют участия
  человека.

Профиль браузера наблюдателя Discord должен быть достаточно постоянным, чтобы не
выполнять вход при каждом запуске, но изолированным от личного состояния
браузера. Профиль относится к пулу машин Mantis, а не к ноутбуку разработчика.

Когда Mantis застревает, он публикует статусное сообщение в Discord со
следующими данными:

- идентификатор запуска
- идентификатор сценария
- поставщик машины
- каталог артефактов
- инструкции по подключению VNC или noVNC, если доступны
- короткий текст блокера

Первая приватная развертка может публиковать эти сообщения в существующий канал
операторов, а позже перейти в выделенный канал Mantis.

## Машины

Для первой удаленной реализации Mantis должен предпочитать AWS через Crabbox.
Crabbox предоставляет прогретые машины, отслеживание аренды, гидрацию, логи,
результаты и очистку. Если емкость AWS слишком медленная или недоступна, добавьте
поставщика Hetzner за тем же интерфейсом машин.

Минимальные требования к VM:

- Linux с установленным Chrome или Chromium, пригодным для рабочего стола
- доступ CDP для автоматизации браузера
- VNC или noVNC для аварийного доступа
- Node 22 и pnpm
- checkout OpenClaw и кэш зависимостей
- кэш браузера Playwright Chromium, когда используется Playwright
- достаточно CPU и памяти для одного OpenClaw Gateway, одного браузера и одного запуска модели
- исходящий доступ к Discord, GitHub, поставщикам моделей и брокеру учетных данных

VM не должна хранить долгоживущие необработанные секреты вне ожидаемых хранилищ
учетных данных или профилей браузера.

## Секреты

Секреты хранятся в секретах организации или репозитория GitHub для удаленных
запусков и в локальном, контролируемом оператором файле секретов для локальных
запусков.

Рекомендуемые имена секретов:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` для публичных загрузок артефактов GitHub
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

В долгосрочной перспективе пул учетных данных Convex должен оставаться обычным
источником учетных данных для live-транспортов. Секреты GitHub начально
загружают брокер и резервные пути. Рабочий процесс статусных реакций Discord
отображает секреты Mantis Crabbox обратно в переменные окружения
`CRABBOX_COORDINATOR` и `CRABBOX_COORDINATOR_TOKEN`, которые ожидает Crabbox CLI.
Простые имена секретов GitHub `CRABBOX_*` остаются допустимыми как резервная
совместимость.

Раннер Mantis никогда не должен печатать:

- токены ботов Discord
- API-ключи поставщиков
- cookie браузера
- содержимое профиля аутентификации
- пароли VNC
- необработанные payload учетных данных

Публичные загрузки артефактов также должны редактировать метаданные целей
Discord, такие как идентификаторы бота, гильдии, канала и сообщения. По этой
причине smoke workflow GitHub включает `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`.

Если токен случайно вставлен в issue, PR, чат или лог, ротируйте его после
сохранения нового секрета.

## Артефакты GitHub и комментарии к PR

Рабочие процессы Mantis должны загружать полный пакет доказательств как
краткоживущий артефакт Actions. Когда workflow запускается для отчета об ошибке
или PR с исправлением, он также должен публиковать очищенные встроенные медиа в
настроенный бакет Mantis R2/S3 и выполнять upsert комментария в этой ошибке или
PR с исправлением со встроенными скриншотами до/после. Не публикуйте основное
доказательство только в общем PR автоматизации QA. Необработанные логи,
наблюдаемые сообщения и другие объемные доказательства остаются в артефакте
Actions.

Production workflows должны публиковать эти комментарии через Mantis GitHub App,
а не через `github-actions[bot]`. Сохраните id приложения и приватный ключ как
секреты GitHub Actions `MANTIS_GITHUB_APP_ID` и
`MANTIS_GITHUB_APP_PRIVATE_KEY`. Workflow использует скрытый маркер как ключ
upsert, обновляет этот комментарий, когда токен может его редактировать, и
создает новый комментарий от имени Mantis, когда более старый маркер, созданный
ботом, нельзя отредактировать.

Комментарий к PR должен быть коротким и визуальным:

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

Когда запуск завершается неудачей из-за сбоя harness, комментарий должен говорить
именно это, а не подразумевать, что candidate не прошел проверку.

## Заметки о приватной развертке

В приватной развертке уже может быть приложение Mantis Discord. Переиспользуйте
это приложение вместо создания еще одного, если у него есть нужные разрешения
бота и его можно безопасно ротировать.

Задайте начальный канал уведомлений оператора через секреты или конфигурацию
развертки. Сначала он может указывать на существующий канал мейнтейнеров или
операций, а затем перейти в выделенный канал Mantis, когда он появится.

Не помещайте в этот документ идентификаторы гильдий, идентификаторы каналов,
токены ботов, cookie браузера или пароли VNC. Храните их в секретах GitHub,
брокере учетных данных или локальном хранилище секретов оператора.

## Добавление сценария

Сценарий Mantis должен объявлять:

- id и заголовок
- транспорт
- требуемые учетные данные
- политику baseline ref
- политику candidate ref
- patch конфигурации OpenClaw
- шаги настройки
- стимул
- ожидаемый oracle baseline
- ожидаемый oracle candidate
- цели визуального захвата
- бюджет timeout
- шаги очистки

Сценарии должны предпочитать небольшие типизированные oracle:

- состояние реакции Discord для ошибок реакций
- ссылки на сообщения Discord для ошибок threading
- ts треда Slack и состояние API реакций для ошибок Slack
- идентификаторы сообщений email и заголовки для ошибок email
- скриншоты браузера, когда UI является единственным надежным наблюдаемым признаком

Визуальные проверки должны быть добавочными. Если API платформы может доказать
ошибку, используйте API как pass/fail oracle, а скриншоты оставьте для
уверенности человека.

## Расширение поставщиков

После Discord тот же раннер может добавить:

- Slack: реакции, треды, упоминания приложения, модальные окна, загрузки файлов.
- Email: аутентификация Gmail и threading сообщений с использованием `gog`, когда коннекторов недостаточно.
- WhatsApp: вход по QR, повторная идентификация, доставка сообщений, медиа, реакции.
- Telegram: gating упоминаний в группе, команды, реакции, где доступны.
- Matrix: зашифрованные комнаты, связи тредов или ответов, возобновление после перезапуска.

У каждого транспорта должен быть один дешевый smoke-сценарий и один или несколько
сценариев класса ошибок. Дорогие визуальные сценарии должны оставаться
опциональными.

## Открытые вопросы

- Какой бот Discord должен быть driver, а какой SUT, когда существующий бот
  Mantis переиспользуется?
- Должен ли вход в браузер наблюдателя использовать человеческий аккаунт
  Discord, тестовый аккаунт или только читаемые ботом REST-доказательства на
  первом этапе?
- Как долго GitHub должен хранить артефакты Mantis для PR?
- Когда ClawSweeper должен автоматически рекомендовать Mantis вместо ожидания
  команды мейнтейнера?
- Следует ли редактировать или обрезать скриншоты перед загрузкой для публичных PR?
