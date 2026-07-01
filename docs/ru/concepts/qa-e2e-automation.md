---
read_when:
    - Понимание того, как устроен стек QA
    - Расширение qa-lab, qa-channel или транспортного адаптера
    - Добавление QA-сценариев на основе репозитория
    - Создание более реалистичной автоматизации QA вокруг панели Gateway
summary: 'Обзор стека QA: qa-lab, qa-channel, сценарии на базе репозитория, live-ветки транспорта, транспортные адаптеры и отчетность.'
title: Обзор QA
x-i18n:
    generated_at: "2026-07-01T08:22:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Частный стек QA предназначен для проверки OpenClaw более реалистичным,
канально-ориентированным способом, чем это может сделать один модульный тест.

Текущие компоненты:

- `extensions/qa-channel`: синтетический канал сообщений с поверхностями личных сообщений, каналов, тредов,
  реакций, редактирования и удаления.
- `extensions/qa-lab`: отладочный UI и шина QA для наблюдения за транскриптом,
  внедрения входящих сообщений и экспорта Markdown-отчета.
- `extensions/qa-matrix`, будущие Plugin раннеров: адаптеры живых транспортов, которые
  управляют реальным каналом внутри дочернего QA gateway.
- `qa/`: seed-ресурсы из репозитория для стартовой задачи и базовых
  QA-сценариев.
- [Mantis](/ru/concepts/mantis): проверка до и после вживую для ошибок, которым
  нужны реальные транспорты, скриншоты браузера, состояние VM и доказательства для PR.

## Поверхность команд

Каждый QA-поток выполняется через `pnpm openclaw qa <subcommand>`. У многих есть
алиасы скриптов `pnpm qa:*`; поддерживаются обе формы.

| Команда                                             | Назначение                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Встроенная самопроверка QA без `--qa-profile`; раннер профиля зрелости на основе таксономии с `--qa-profile smoke-ci`, `--qa-profile release` или `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Запустить сценарии из репозитория против линии QA gateway. Алиасы: `pnpm openclaw qa suite --runner multipass` для одноразовой Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Вывести YAML-инвентарь покрытия сценариев (`--json` для машинного вывода).                                                                                                                                                                                               |
| `qa parity-report`                                  | Сравнить два файла `qa-suite-summary.json` и записать agentic-отчет о паритете либо использовать `--runtime-axis --token-efficiency`, чтобы записать отчеты о паритете runtime Codex и OpenClaw и эффективности токенов из одной сводки пары runtime.                                         |
| `qa character-eval`                                 | Запустить QA-сценарий персонажа на нескольких живых моделях с отчетом, оцененным судьей. См. [Отчетность](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запустить одноразовый prompt против выбранной линии provider/model.                                                                                                                                                                                                          |
| `qa ui`                                             | Запустить отладочный UI QA и локальную шину QA (алиас: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Собрать предварительно подготовленный Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записать docker-compose scaffold для QA dashboard + линии gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Собрать сайт QA, запустить стек на базе Docker, вывести URL (алиас: `pnpm qa:lab:up`; вариант `:fast` добавляет `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запустить только сервер AIMock provider.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запустить только сервер provider `mock-openai`, учитывающий сценарии.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Управлять общим пулом учетных данных Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Линия живого транспорта против одноразового homeserver Tuwunel. См. [Matrix QA](/ru/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Линия живого транспорта против реальной частной группы Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Линия живого транспорта против реального канала частной Discord guild.                                                                                                                                                                                                       |
| `qa slack`                                          | Линия живого транспорта против реального частного канала Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Линия живого транспорта против реальных аккаунтов WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Раннер проверки до и после для ошибок живого транспорта, с доказательствами в виде статус-реакций Discord, desktop/browser smoke в Crabbox и Slack-in-VNC smoke. См. [Mantis](/ru/concepts/mantis) и [Runbook Mantis Slack Desktop](/ru/concepts/mantis-slack-desktop-runbook). |

`qa run` на основе профиля читает состав из `taxonomy.yaml`, затем отправляет
разрешенные сценарии через `qa suite`. `--surface` и
`--category` фильтруют выбранный профиль, а не определяют отдельные линии.
Итоговый `qa-evidence.json` включает сводку scorecard профиля с
количеством выбранных категорий и отсутствующими ID покрытия; отдельные записи
доказательств остаются источником истины для тестов, ролей покрытия и результатов.
ID покрытия возможностей таксономии являются точными целями доказательства, а не алиасами. Основное
покрытие сценариев выполняет совпадающие ID; вторичное покрытие остается рекомендационным.
ID покрытия используют dotted-форму `namespace.behavior` со строчными
буквенно-цифровыми сегментами или сегментами с дефисами; ID профиля, поверхности и категории могут по-прежнему использовать
существующие dashed или dotted ID таксономии.
Slim-доказательства опускают `execution` для каждой записи и задают `evidenceMode: "slim"`;
`smoke-ci` по умолчанию использует slim, а `--evidence-mode full` восстанавливает полные записи:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Используйте `smoke-ci` для детерминированного доказательства профиля с mock model providers и
локальными серверами provider Crabline. Используйте `release` для доказательства Stable/LTS против живых
каналов. Используйте `all` только для явных запусков доказательств по всей таксономии; он выбирает
каждую активную категорию зрелости и может быть отправлен через workflow `QA Profile
Evidence` с `qa_profile=all`. Когда команде также нужен корневой профиль OpenClaw,
поместите корневой профиль перед командой QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Поток оператора

Текущий операторский поток QA — это двухпанельный сайт QA:

- Слева: Gateway dashboard (Control UI) с агентом.
- Справа: QA Lab, показывающая похожий на Slack транскрипт и план сценария.

Запустите его так:

```bash
pnpm qa:lab:up
```

Это собирает сайт QA, запускает линию gateway на базе Docker и открывает
страницу QA Lab, где оператор или цикл автоматизации может выдать агенту QA-миссию,
наблюдать реальное поведение канала и записывать, что сработало, что не удалось или
осталось заблокированным.

Для более быстрой итерации UI QA Lab без пересборки Docker-образа каждый раз
запустите стек с bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` оставляет Docker-сервисы на предварительно собранном образе и монтирует через bind
`extensions/qa-lab/web/dist` в контейнер `qa-lab`. `qa:lab:watch`
пересобирает этот bundle при изменениях, а браузер автоматически перезагружается, когда меняется
asset hash QA Lab.

Для локального smoke сигнала OpenTelemetry выполните:

```bash
pnpm qa:otel:smoke
```

Этот скрипт запускает локальный OTLP/HTTP receiver, выполняет QA-сценарий `otel-trace-smoke`
с включенным Plugin `diagnostics-otel`, затем проверяет, что traces,
metrics и logs экспортированы. Он декодирует экспортированные protobuf trace spans
и проверяет критичную для релиза форму:
`openclaw.run`, `openclaw.harness.run`, span вызова модели по последней semantic convention GenAI,
`openclaw.context.assembled` и `openclaw.message.delivery`
должны присутствовать. Smoke принудительно задает
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, поэтому span вызова модели
должен использовать имя `{gen_ai.operation.name} {gen_ai.request.model}`;
вызовы модели не должны экспортировать `StreamAbandoned` при успешных turns; raw diagnostic IDs и
атрибуты `openclaw.content.*` не должны попадать в trace. Raw OTLP
payloads не должны содержать prompt sentinel, response sentinel или ключ QA-сессии.
Он записывает `otel-smoke-summary.json` рядом с артефактами QA suite.

Для smoke OpenTelemetry на базе collector выполните:

```bash
pnpm qa:otel:collector-smoke
```

Эта линия ставит реальный Docker-контейнер OpenTelemetry Collector перед тем же
локальным receiver. Используйте ее при изменении endpoint wiring, совместимости collector
или поведения OTLP export, которое in-process receiver мог бы скрыть.

Для protected Prometheus scrape smoke выполните:

```bash
pnpm qa:prometheus:smoke
```

Этот псевдоним запускает QA-сценарий `docker-prometheus-smoke` с включенным
`diagnostics-prometheus`, проверяет, что неаутентифицированные scrape-запросы отклоняются,
а затем проверяет, что аутентифицированный scrape включает критичные для релиза семейства метрик
без содержимого prompt, содержимого ответа, сырых диагностических идентификаторов, токенов
аутентификации или локальных путей.

Чтобы запустить обе дымовые проверки наблюдаемости подряд, используйте:

```bash
pnpm qa:observability:smoke
```

Для линии OpenTelemetry с коллектором и защищенной дымовой проверки Prometheus scrape
используйте:

```bash
pnpm qa:observability:collector-smoke
```

QA наблюдаемости остается доступным только из исходного checkout. npm-tarball намеренно не включает
QA Lab, поэтому Docker-линии пакетного релиза не запускают команды `qa`. Используйте
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` или
`pnpm qa:observability:smoke` из собранного исходного checkout при изменении
диагностической инструментации.

Для транспортно-реальной дымовой линии Matrix, которой не требуются учетные данные
провайдера модели, запустите быстрый профиль с детерминированным mock-провайдером OpenAI:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Для линии живого frontier-провайдера явно передайте OpenAI-совместимые учетные данные:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Полный справочник CLI, каталог профилей/сценариев, переменные окружения и схема артефактов для этой линии находятся в [Matrix QA](/ru/concepts/qa-matrix). Вкратце: она поднимает одноразовый homeserver Tuwunel в Docker, регистрирует временных пользователей driver/SUT/observer, запускает реальный Matrix Plugin внутри дочернего QA gateway, ограниченного этим транспортом (без `qa-channel`), затем записывает Markdown-отчет, JSON-сводку, артефакт наблюдаемых событий и объединенный журнал вывода в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарии покрывают поведение транспорта, которое модульные тесты не могут доказать от начала до конца: фильтрация по упоминаниям, политики allow-bot, списки разрешенных, ответы верхнего уровня и ответы в тредах, маршрутизацию DM, обработку реакций, подавление входящих правок, дедупликацию replay после перезапуска, восстановление после прерывания homeserver, доставку метаданных approval, обработку медиа и потоки bootstrap/recovery/verification для Matrix E2EE. Профиль CLI для E2EE также прогоняет команды `openclaw matrix encryption setup` и команды верификации через тот же одноразовый homeserver перед проверкой ответов Gateway.

У Discord также есть opt-in-сценарии только для Mantis для воспроизведения багов. Используйте
`--scenario discord-status-reactions-tool-only` для явной временной шкалы статусных реакций
или `--scenario discord-thread-reply-filepath-attachment`, чтобы создать реальный тред Discord
и проверить, что `message.thread-reply` сохраняет вложение `filePath`. Эти сценарии не входят
в стандартную живую линию Discord, потому что это probes для воспроизведения до/после, а не
широкое дымовое покрытие. Mantis workflow для вложений в тредах также может добавить видео
свидетеля из Discord Web с выполненным входом, когда `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` или
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` настроены в QA-окружении. Этот профиль viewer
используется только для визуального захвата; решение pass/fail по-прежнему приходит от
Discord REST-оракула.

CI использует ту же командную поверхность в `.github/workflows/qa-live-transports-convex.yml`.
Запуски по расписанию и стандартные ручные запуски выполняют быстрый профиль Matrix с
предоставленными QA учетными данными live-frontier, `--fast` и
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручной `matrix_profile=all` разворачивается
в пять profile shards.

Для транспортно-реальных дымовых линий Telegram, Discord, Slack и WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Они нацелены на заранее существующий реальный канал с двумя ботами или аккаунтами (driver + SUT). Обязательные переменные окружения, списки сценариев, выходные артефакты и пул учетных данных Convex документированы ниже в [справочнике QA для Telegram, Discord, Slack и WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Для полного запуска Slack desktop VM с VNC rescue выполните:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Эта команда арендует desktop/browser машину Crabbox, запускает живую линию Slack
внутри VM, открывает Slack Web в VNC-браузере, захватывает desktop и копирует
`slack-qa/`, `slack-desktop-smoke.png` и `slack-desktop-smoke.mp4`, когда видеозахват
доступен, обратно в каталог артефактов Mantis. Аренды Crabbox desktop/browser заранее
предоставляют инструменты захвата и вспомогательные пакеты browser/native-build, поэтому
сценарий должен устанавливать fallback-пакеты только на старых арендах. Mantis сообщает
общее время и время по фазам в `mantis-slack-desktop-smoke-report.md`, чтобы медленные
запуски показывали, куда ушло время: на прогрев аренды, получение учетных данных,
удаленную настройку или копирование артефактов. Повторно используйте `--lease-id <cbx_...>`
после ручного входа в Slack Web через VNC; повторно используемые аренды также сохраняют
теплым pnpm store cache Crabbox. Стандартный `--hydrate-mode source` проверяет из исходного
checkout и запускает install/build внутри VM. Используйте `--hydrate-mode prehydrated` только
когда повторно используемое удаленное рабочее пространство уже содержит `node_modules` и
собранный `dist/`; этот режим пропускает дорогой шаг install/build и fail-closed, если
рабочее пространство не готово. С `--gateway-setup` Mantis оставляет постоянный OpenClaw
Slack Gateway, работающий внутри VM на порту `38973`; без него команда запускает обычную
bot-to-bot линию Slack QA и выходит после захвата артефактов.

Чтобы доказать нативный UI approval в Slack с desktop-доказательствами, запустите checkpoint-режим approval в Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Этот режим взаимоисключающий с `--gateway-setup`. Он запускает сценарии approval в Slack,
отклоняет id сценариев не для approval, ожидает каждого pending и resolved состояния approval,
рендерит наблюдаемое сообщение Slack API в
`approval-checkpoints/<scenario>-pending.png` и
`approval-checkpoints/<scenario>-resolved.png`, затем падает, если любой checkpoint,
доказательство сообщения, acknowledgement или отрендеренный screenshot отсутствует или пуст.
Холодные CI-аренды все еще могут показывать вход в Slack в `slack-desktop-smoke.png`;
изображения approval checkpoint являются визуальным доказательством для этой линии.

Операторский checklist, команда GitHub workflow dispatch, контракт evidence-comment,
таблица принятия решений по hydrate-mode, интерпретация timing и шаги обработки ошибок
находятся в [runbook Mantis Slack Desktop](/ru/concepts/mantis-slack-desktop-runbook).

Для desktop-задачи в стиле agent/CV выполните:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` арендует или повторно использует desktop/browser машину Crabbox, запускает
`crabbox record --while`, управляет видимым браузером через вложенный
`visual-driver`, захватывает `visual-task.png`, запускает `openclaw infer image describe`
для screenshot, когда выбран `--vision-mode image-describe`, и записывает
`visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` и `mantis-visual-task-report.md`.
Когда задан `--expect-text`, vision prompt запрашивает структурированный JSON-вердикт
и проходит только когда модель сообщает положительное видимое доказательство; отрицательный
ответ, который лишь цитирует целевой текст, проваливает assertion.
Используйте `--vision-mode metadata` для дымовой проверки без модели, которая доказывает
связку desktop, browser, screenshot и video без вызова провайдера понимания изображений.
Recording является обязательным артефактом для `visual-task`; если Crabbox не записывает
непустой `visual-task.mp4`, задача падает, даже когда visual driver прошел. При ошибке
Mantis сохраняет аренду для VNC, если только задача уже не прошла и `--keep-lease` не был задан.

Перед использованием pooled live credentials выполните:

```bash
pnpm openclaw qa credentials doctor
```

Doctor проверяет env брокера Convex, валидирует настройки endpoint и проверяет доступность admin/list, когда присутствует maintainer secret. Для secrets он сообщает только статус set/missing.

## Покрытие живых транспортов

Линии живых транспортов используют один общий контракт, вместо того чтобы каждая изобретала собственную форму списка сценариев. `qa-channel` — это широкий синтетический набор продуктового поведения и не является частью матрицы покрытия живых транспортов.

Runners живого транспорта должны импортировать общие ids сценариев, helpers
baseline-покрытия и helper выбора сценариев из
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Линия    | Canary | Фильтрация по упоминаниям | Bot-to-bot | Блокировка списком разрешенных | Ответ верхнего уровня | Ответ с цитатой | Возобновление после перезапуска | Продолжение треда | Изоляция треда | Наблюдение реакций | Команда help | Регистрация нативных команд |
| -------- | ------ | ------------------------- | ---------- | ------------------------------ | --------------------- | --------------- | -------------------------------- | ----------------- | -------------- | ------------------ | ------------ | ---------------------------- |
| Matrix   | x      | x                         | x          | x                              | x                     |                 | x                                | x                 | x              | x                  |              |                              |
| Telegram | x      | x                         | x          |                                |                       |                 |                                  |                   |                |                    | x            |                              |
| Discord  | x      | x                         | x          |                                |                       |                 |                                  |                   |                |                    |              | x                            |
| Slack    | x      | x                         | x          | x                              | x                     |                 | x                                | x                 | x              |                    |              |                              |
| WhatsApp | x      | x                         |            | x                              | x                     | x               | x                                |                   |                | x                  | x            |                              |

Это сохраняет `qa-channel` как широкий набор продуктового поведения, пока Matrix,
Telegram и другие живые транспорты совместно используют один явный checklist транспортного контракта.

Для одноразовой линии Linux VM без добавления Docker в QA-путь выполните:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Это загружает свежий guest Multipass, устанавливает зависимости, собирает OpenClaw
внутри guest, запускает `qa suite`, затем копирует обычный QA-отчет и
сводку обратно в `.artifacts/qa-e2e/...` на host.
Она повторно использует то же поведение выбора сценариев, что и `qa suite` на host.
Запуски suite на host и Multipass по умолчанию выполняют несколько выбранных сценариев
параллельно с изолированными workers Gateway. `qa-channel` по умолчанию использует concurrency
4, ограниченную количеством выбранных сценариев. Используйте `--concurrency <count>` для настройки
количества workers или `--concurrency 1` для последовательного выполнения.
Используйте `--pack personal-agent`, чтобы запустить benchmark pack персонального ассистента. Селектор
pack является аддитивным с повторяющимися флагами `--scenario`: явные сценарии
запускаются первыми, затем сценарии pack запускаются в порядке pack с удалением дубликатов.
Используйте `--pack observability`, когда пользовательский QA runner уже предоставляет настройку
OpenTelemetry collector и хочет выбрать вместе дымовые диагностические сценарии OpenTelemetry и Prometheus.
Команда завершается с ненулевым кодом, когда любой сценарий падает. Используйте `--allow-failures`, когда
нужны артефакты без ошибочного exit code.
Живые запуски передают поддерживаемые входные данные QA auth, практичные для
guest: provider keys на основе env, путь к live provider config QA и
`CODEX_HOME`, когда он присутствует. Держите `--output-dir` внутри корня репозитория, чтобы guest
мог записывать обратно через смонтированное рабочее пространство.

## Справочник QA для Telegram, Discord, Slack и WhatsApp

У Matrix есть [отдельная страница](/ru/concepts/qa-matrix) из-за количества сценариев и подготовки homeserver на базе Docker. Telegram, Discord, Slack и WhatsApp запускаются на уже существующих реальных транспортах, поэтому их справочник находится здесь.

### Общие флаги CLI

Эти lanes регистрируются через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` и принимают одинаковые флаги:

| Флаг                                  | По умолчанию                                      | Описание                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                | Запустить только этот сценарий. Можно указывать несколько раз.                                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Куда записываются отчеты, сводки, evidence, артефакты конкретного транспорта и выходной журнал. Относительные пути разрешаются относительно `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                  | Корень репозитория при запуске из нейтрального cwd.                                                                                                         |
| `--sut-account <id>`                  | `sut`                                            | Временный id аккаунта в конфигурации QA Gateway.                                                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                  | `mock-openai` или `live-frontier` (устаревший `live-openai` все еще работает).                                                                              |
| `--model <ref>` / `--alt-model <ref>` | значение провайдера по умолчанию                 | Refs основной/альтернативной модели.                                                                                                                        |
| `--fast`                              | выкл.                                            | Быстрый режим провайдера, где он поддерживается.                                                                                                            |
| `--credential-source <env\|convex>`   | `env`                                            | См. [пул учетных данных Convex](#convex-credential-pool).                                                                                                   |
| `--credential-role <maintainer\|ci>`  | `ci` в CI, иначе `maintainer`                    | Роль, используемая при `--credential-source convex`.                                                                                                        |

Каждый lane завершается с ненулевым кодом при любом неуспешном сценарии. `--allow-failures` записывает артефакты, не выставляя код выхода с ошибкой.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Нацелен на одну реальную приватную группу Telegram с двумя разными ботами (driver + SUT). У SUT-бота должно быть имя пользователя Telegram; наблюдение bot-to-bot лучше всего работает, когда у обоих ботов включен **режим взаимодействия ботов** в `@BotFather`.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - числовой id чата (строка).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Сценарии (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Неявный набор по умолчанию всегда покрывает canary, mention gating, ответы нативных команд, адресацию команд и групповые ответы bot-to-bot. Значения по умолчанию для `mock-openai` также включают детерминированные проверки цепочки ответов и streaming финального сообщения. `telegram-current-session-status-tool` остается opt-in, потому что он стабилен только при непосредственном запуске после canary, а не после произвольных ответов нативных команд. Используйте `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, чтобы вывести текущий разрез default/optional с regression refs.

Выходные артефакты:

- `telegram-qa-report.md`
- `qa-evidence.json` - записи evidence для проверок live-транспорта, включая поля profile, coverage, provider, channel, artifacts, result и RTT.

Пакетные запуски Telegram используют тот же контракт учетных данных Telegram. Повторное
измерение RTT является частью обычного пакетного Telegram live lane; распределение RTT
включается в `qa-evidence.json` в `result.timing` для выбранной проверки RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Когда задан `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, пакетная live-обертка
арендует учетные данные `kind: "telegram"`, экспортирует env арендованной группы/driver/SUT-бота
в запуск установленного пакета, отправляет Heartbeat аренды и освобождает ее при
завершении. Пакетная обертка по умолчанию выполняет 20 проверок RTT для
`telegram-mentioned-message-reply`, использует таймаут RTT 30 с и роль Convex
`maintainer` вне CI, когда выбран Convex. Переопределите
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
или `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, чтобы настроить измерение RTT без
создания отдельной команды RTT или формата сводки, специфичного для Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Нацелен на один реальный приватный канал guild Discord с двумя ботами: driver-ботом, которым управляет harness, и SUT-ботом, запускаемым дочерним OpenClaw Gateway через встроенный Discord plugin. Проверяет обработку упоминаний канала, что SUT-бот зарегистрировал нативную команду `/help` в Discord, а также opt-in Mantis evidence-сценарии.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - должен совпадать с id пользователя SUT-бота, возвращенным Discord (иначе lane быстро завершится ошибкой).

Необязательно:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` сохраняет тела сообщений в артефактах observed-message.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` выбирает голосовой/stage-канал для `discord-voice-autojoin`; без него сценарий выбирает первый видимый для SUT-бота голосовой/stage-канал.

Сценарии (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in голосовой сценарий. Запускается отдельно, включает `channels.discord.voice.autoJoin` и проверяет, что текущее голосовое состояние SUT-бота в Discord соответствует целевому голосовому/stage-каналу. Учетные данные Convex Discord могут включать необязательный `voiceChannelId`; иначе runner обнаруживает первый видимый голосовой/stage-канал в guild.
- `discord-status-reactions-tool-only` - opt-in Mantis-сценарий. Запускается отдельно, потому что переводит SUT в always-on режим ответов guild только через tools с `messages.statusReactions.enabled=true`, затем захватывает REST timeline реакций и визуальные артефакты HTML/PNG. Отчеты Mantis before/after также сохраняют предоставленные сценарием MP4-артефакты как `baseline.mp4` и `candidate.mp4`.

Запустить сценарий автоподключения к голосовому каналу Discord явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Запустить сценарий Mantis для status-reaction явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Выходные артефакты:

- `discord-qa-report.md`
- `qa-evidence.json` - записи evidence для проверок live-транспорта.
- `discord-qa-observed-messages.json` - тела редактируются, если не задан `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` и `discord-status-reactions-tool-only-timeline.png`, когда запускается сценарий status-reaction.

### QA Slack

```bash
pnpm openclaw qa slack
```

Нацелен на один реальный приватный канал Slack с двумя разными ботами: driver-ботом, которым управляет harness, и SUT-ботом, запускаемым дочерним OpenClaw Gateway через встроенный Slack plugin.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Необязательно:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` сохраняет тела сообщений в артефактах observed-message.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` включает визуальные approval
  checkpoints для Mantis. Runner записывает `<scenario>.pending.json` и
  `<scenario>.resolved.json`, затем ждет соответствующие файлы `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` переопределяет таймаут
  подтверждения checkpoint. Значение по умолчанию: `120000`.

Сценарии (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in сценарий нативного Slack approval для exec.
  Запрашивает exec approval через Gateway, проверяет, что сообщение Slack содержит
  нативные кнопки approval, разрешает его и проверяет обновление Slack после разрешения.
- `slack-approval-plugin-native` - opt-in сценарий нативного Slack Plugin approval.
  Включает пересылку exec и Plugin approval вместе, чтобы Plugin events не
  подавлялись маршрутизацией exec approval, затем проверяет тот же pending/resolved
  путь нативного Slack UI.

Выходные артефакты:

- `slack-qa-report.md`
- `qa-evidence.json` - записи evidence для проверок live-транспорта.
- `slack-qa-observed-messages.json` - тела редактируются, если не задан `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - только когда Mantis задает
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; содержит checkpoint JSON,
  acknowledgement JSON и screenshots pending/resolved.

#### Настройка рабочего пространства Slack

Для lane нужны два разных приложения Slack в одном рабочем пространстве, а также канал, участниками которого являются оба бота:

- `channelId` - id `Cxxxxxxxxxx` канала, куда приглашены оба бота. Используйте выделенный канал; lane публикует сообщения при каждом запуске.
- `driverBotToken` - токен бота (`xoxb-...`) приложения **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) приложения **SUT**, которое должно быть отдельным приложением Slack, отличным от driver, чтобы id его bot user был уникальным.
- `sutAppToken` - app-level token (`xapp-...`) приложения SUT с `connections:write`, используемый Socket Mode, чтобы приложение SUT могло получать события.

Предпочитайте рабочее пространство Slack, выделенное для QA, вместо повторного использования production-рабочего пространства.

Манифест SUT ниже намеренно сужает production-установку встроенного Slack plugin (`extensions/slack/src/setup-shared.ts:10`) до разрешений и событий, покрываемых live Slack QA suite. Для настройки production-канала так, как ее видят пользователи, см. [быструю настройку канала Slack](/ru/channels/slack#quick-setup); пара QA Driver/SUT намеренно отделена, потому что lane нужны два разных bot user id в одном рабочем пространстве.

**1. Создайте приложение Driver**

Перейдите на [api.slack.com/apps](https://api.slack.com/apps) → _Создать новое приложение_ → _Из манифеста_ → выберите рабочее пространство QA, вставьте следующий манифест, затем _Установить в рабочее пространство_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Скопируйте _Bot User OAuth Token_ (`xoxb-...`) - он станет `driverBotToken`. Драйверу нужно только отправлять сообщения и идентифицировать себя; события и Socket Mode не нужны.

**2. Создайте приложение SUT**

Повторите _Создать новое приложение → Из манифеста_ в том же рабочем пространстве. Это QA-приложение намеренно использует более узкую версию production-манифеста встроенного Slack plugin (`extensions/slack/src/setup-shared.ts:10`): scopes и события реакций опущены, потому что live-набор QA для Slack пока не покрывает обработку реакций.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

После того как Slack создаст приложение, выполните два действия на странице его настроек:

- _Установить в рабочее пространство_ → скопируйте _Bot User OAuth Token_ → он станет `sutBotToken`.
- _Основная информация → Токены уровня приложения → Сгенерировать токен и scopes_ → добавьте scope `connections:write` → сохраните → скопируйте значение `xapp-...` → оно станет `sutAppToken`.

Убедитесь, что у двух ботов разные идентификаторы пользователей, вызвав `auth.test` для каждого токена. Runtime различает драйвер и SUT по идентификатору пользователя; повторное использование одного приложения для обоих сразу сломает фильтрацию упоминаний.

**3. Создайте канал**

В рабочем пространстве QA создайте канал (например, `#openclaw-qa`) и пригласите обоих ботов изнутри канала:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопируйте идентификатор `Cxxxxxxxxxx` из _информация о канале → О канале → ID канала_ - он станет `channelId`. Подойдет публичный канал; если вы используете приватный канал, у обоих приложений уже есть `groups:history`, поэтому чтение истории тестовой обвязкой все равно будет успешным.

**4. Зарегистрируйте учетные данные**

Есть два варианта. Используйте переменные окружения для отладки на одной машине (задайте четыре переменные `OPENCLAW_QA_SLACK_*` и передайте `--credential-source env`) или заполните общий пул Convex, чтобы CI и другие maintainers могли арендовать их.

Для пула Convex запишите четыре поля в JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Экспортировав `OPENCLAW_QA_CONVEX_SITE_URL` и `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` в вашей оболочке, зарегистрируйте и проверьте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Ожидайте `count: 1`, `status: "active"`, без поля `lease`.

**5. Проверьте end-to-end**

Запустите линию локально, чтобы подтвердить, что оба бота могут общаться друг с другом через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успешный запуск завершается значительно быстрее чем за 30 секунд, а `slack-qa-report.md` показывает статусы `pass` для `slack-canary` и `slack-mention-gating`. Если линия зависает примерно на 90 секунд и завершается с `Convex credential pool exhausted for kind "slack"`, значит пул пуст или все строки арендованы - `qa credentials list --kind slack --status all --json` покажет, что именно.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Нацелено на две выделенные учетные записи WhatsApp Web: учетную запись драйвера, управляемую тестовой обвязкой, и учетную запись SUT, запускаемую дочерним OpenClaw Gateway через встроенный WhatsApp plugin.

Обязательные переменные окружения при `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Необязательно:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` включает групповые сценарии, такие как
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, сценарии групповых действий, медиа и опросов, а также
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` сохраняет тела сообщений в
  артефактах observed-message.

Каталог сценариев (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Базовая проверка и фильтрация групп: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Нативные команды: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Поведение ответов и финального вывода: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Действия с сообщениями на пользовательском пути: `whatsapp-agent-message-action-react` начинается с реального DM от драйвера, позволяет модели вызвать инструмент `message` и наблюдает нативную реакцию WhatsApp. `whatsapp-agent-message-action-upload-file` использует тот же подход для `message(action=upload-file)` и наблюдает нативные медиа WhatsApp. `whatsapp-group-agent-message-action-react` и
  `whatsapp-group-agent-message-action-upload-file` доказывают те же видимые пользователю действия в реальной группе WhatsApp.
- Групповая рассылка: `whatsapp-broadcast-group-fanout` начинается с одного сообщения WhatsApp в группе с упоминанием и проверяет разные видимые ответы от `main` и
  `qa-second`.
- Активация в группе: `whatsapp-group-activation-always` меняет реальную групповую сессию на `/activation always`, доказывает, что групповое сообщение без упоминания будит агента, затем восстанавливает `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  создает ответ бота, отправляет на него нативный цитированный ответ без явного упоминания и проверяет, что агент просыпается из этого контекста ответа.
- Входящие медиа и структурированные сообщения: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Они отправляют через драйвер реальные события WhatsApp для изображений, аудио, документов, геолокаций, контактов, стикеров и реакций.
- Прямые проверки контракта Gateway:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Они намеренно обходят prompting модели и доказывают детерминированные контракты Gateway/канала `send`, `poll` и `message.action`.
- Покрытие контроля доступа: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Нативные подтверждения: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Реакции статуса: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Сейчас каталог содержит 50 сценариев. Стандартная линия `live-frontier`
оставлена небольшой: 10 сценариев для быстрого smoke-покрытия. Стандартная линия `mock-openai`
запускает 44 детерминированных сценария через настоящий транспорт WhatsApp, при этом мокается только вывод модели. Сценарии подтверждений и несколько более тяжелых или блокирующих проверок остаются явными по идентификатору сценария.

Драйвер WhatsApp QA наблюдает структурированные live-события (`text`, `media`,
`location`, `reaction` и `poll`) и может активно отправлять медиа, опросы, контакты, геолокации и стикеры. QA Lab импортирует этот драйвер через пакетную поверхность
`@openclaw/whatsapp/api.js`, а не обращается к приватным runtime-файлам WhatsApp. Для групповых наблюдений `fromJid` — это JID группы, а
`participantJid` и `fromPhoneE164` идентифицируют участника-отправителя. Содержимое сообщений по умолчанию редактируется. Прямые проверки Gateway для
опросов, upload-file, медиа, групповых опросов, групповых медиа и формы ответа являются проверками контракта транспорта/API; они не считаются доказательством того, что пользовательский prompt заставил агента выбрать то же действие. Доказательство действия на пользовательском пути берется из сценариев вроде
`whatsapp-agent-message-action-react` и
`whatsapp-group-agent-message-action-react`, где драйвер отправляет обычное сообщение WhatsApp, а QA Lab наблюдает получившийся нативный артефакт WhatsApp.
Отчеты WhatsApp включают posture каждого сценария (`user-path`, `direct-gateway`
или `native-approval`), чтобы доказательство нельзя было принять за более сильный контракт, чем оно действительно подтверждает.

Выходные артефакты:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - записи доказательств для live-проверок транспорта.
- `whatsapp-qa-observed-messages.json` - тела редактируются, если не задано `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Пул учетных данных Convex

Линии Telegram, Discord, Slack и WhatsApp могут арендовать учетные данные из общего пула Convex вместо чтения указанных выше переменных окружения. Передайте `--credential-source convex` (или задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab получает эксклюзивную аренду, отправляет для нее Heartbeat на протяжении запуска и освобождает ее при завершении. Типы пула: `"telegram"`, `"discord"`, `"slack"` и `"whatsapp"`.

Форматы payload, которые брокер проверяет на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` должен быть числовой строкой chat-id.
- Реальный пользователь Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - только подтверждение Mantis Telegram Desktop. Общие контуры QA Lab не должны получать этот тип.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - номера телефонов должны быть разными строками E.164.

Рабочий процесс подтверждения Mantis Telegram Desktop удерживает одну эксклюзивную аренду Convex
`telegram-user` одновременно для драйвера TDLib CLI и свидетеля Telegram Desktop,
а затем освобождает ее после публикации подтверждения.

Когда PR требует детерминированного визуального различия, Mantis может использовать один и тот же ответ mock-модели
на `main` и на голове PR, пока меняется форматтер Telegram или слой доставки.
Параметры захвата по умолчанию настроены для комментариев PR: стандартный класс Crabbox,
запись рабочего стола 24 кадра/с, GIF движения 24 кадра/с и ширина превью 1920px.
Комментарии «до/после» должны публиковать чистый пакет, содержащий только
предусмотренные GIF.

Контуры Slack также могут использовать пул. Проверки формы полезной нагрузки Slack сейчас находятся в раннере Slack QA, а не в брокере; используйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` с идентификатором канала Slack вроде `Cxxxxxxxxxx`. См. [Настройка рабочей области Slack](#setting-up-the-slack-workspace) для подготовки приложения и областей доступа.

Операционные переменные окружения и контракт конечной точки брокера Convex описаны в [Тестирование → Общие учетные данные Telegram через Convex](/ru/help/testing#shared-telegram-credentials-via-convex-v1) (название раздела появилось до многоканального пула; семантика аренды общая для всех типов).

## Сиды на основе репозитория

Ресурсы сидов находятся в `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Они намеренно хранятся в git, чтобы план QA был виден и людям, и
агенту.

`qa-lab` должен оставаться универсальным раннером YAML-сценариев. Каждый YAML-файл сценария
является источником истины для одного тестового запуска и должен определять:

- верхнеуровневый `title`
- метаданные `scenario`
- необязательные метаданные категории, возможности, контура и риска в `scenario`
- ссылки на документацию и код в `scenario`
- необязательные требования к plugin в `scenario`
- необязательный патч конфигурации Gateway в `scenario`
- исполняемый верхнеуровневый `flow` для flow-сценариев или `scenario.execution.kind` /
  `scenario.execution.path` для сценариев Vitest и Playwright

Повторно используемая runtime-поверхность, поддерживающая `flow`, может оставаться универсальной
и сквозной. Например, YAML-сценарии могут сочетать помощники на стороне транспорта
с помощниками на стороне браузера, которые управляют встроенным Control UI через
шов Gateway `browser.request` без добавления специального раннера.

Файлы сценариев следует группировать по продуктовой возможности, а не по папке
исходного дерева. Сохраняйте стабильность идентификаторов сценариев при перемещении файлов; используйте `docsRefs` и `codeRefs`
для трассируемости реализации.

Базовый список должен оставаться достаточно широким, чтобы покрывать:

- личные сообщения и чат канала
- поведение тредов
- жизненный цикл действий с сообщениями
- обратные вызовы cron
- воспоминание памяти
- переключение моделей
- передачу подагенту
- чтение репозитория и чтение документации
- одну небольшую задачу сборки, например Lobster Invaders

## Контуры mock-поставщиков

У `qa suite` есть два локальных контура mock-поставщиков:

- `mock-openai` — сценарно-осведомленный mock OpenClaw. Он остается контуром детерминированного mock по умолчанию
  для QA на основе репозитория и проверок паритета.
- `aimock` запускает сервер поставщика на базе AIMock для экспериментального протокола,
  фикстур, записи/воспроизведения и покрытия хаоса. Он является добавочным и не
  заменяет сценарный диспетчер `mock-openai`.

Реализация контуров поставщиков находится в `extensions/qa-lab/src/providers/`.
Каждый поставщик владеет своими значениями по умолчанию, запуском локального сервера, конфигурацией модели Gateway,
потребностями подготовки auth-профиля и флагами возможностей live/mock. Общий код suite и
Gateway должен маршрутизироваться через реестр поставщиков, а не ветвиться по
именам поставщиков.

## Транспортные адаптеры

`qa-lab` владеет универсальным транспортным швом для YAML-сценариев QA. `qa-channel` —
синтетический вариант по умолчанию. `crabline` запускает локальные серверы в форме поставщиков и выполняет
обычные channel plugins OpenClaw против них. `live` зарезервирован для реальных
учетных данных поставщиков и внешних каналов.

На уровне архитектуры разделение такое:

- `qa-lab` владеет универсальным выполнением сценариев, параллелизмом воркеров, записью артефактов и отчетностью.
- Транспортный адаптер владеет конфигурацией Gateway, готовностью, входящим и исходящим наблюдением, транспортными действиями и нормализованным состоянием транспорта.
- YAML-файлы сценариев в `qa/scenarios/` определяют тестовый запуск; `qa-lab` предоставляет повторно используемую runtime-поверхность, которая их выполняет.

### Добавление канала

Добавление канала в YAML-систему QA требует реализации канала плюс
пакет сценариев, проверяющий контракт канала. Для smoke-покрытия в CI добавьте
соответствующий локальный сервер поставщика Crabline и откройте его через драйвер `crabline`.

Не добавляйте новый верхнеуровневый корень команды QA, когда общий хост `qa-lab` может владеть потоком.

`qa-lab` владеет общей механикой хоста:

- корнем команды `openclaw qa`
- запуском и завершением suite
- параллелизмом воркеров
- записью артефактов
- генерацией отчетов
- выполнением сценариев
- алиасами совместимости для старых сценариев `qa-channel`

Plugins раннеров владеют транспортным контрактом:

- как `openclaw qa <runner>` монтируется под общим корнем `qa`
- как Gateway настраивается для этого транспорта
- как проверяется готовность
- как внедряются входящие события
- как наблюдаются исходящие сообщения
- как открываются транскрипты и нормализованное состояние транспорта
- как выполняются действия на базе транспорта
- как обрабатывается специфичный для транспорта сброс или очистка

Минимальный порог внедрения для нового канала:

1. Оставьте `qa-lab` владельцем общего корня `qa`.
2. Реализуйте транспортный раннер на общем шве хоста `qa-lab`.
3. Держите специфичную для транспорта механику внутри runner plugin или harness канала.
4. Монтируйте раннер как `openclaw qa <runner>` вместо регистрации конкурирующей корневой команды. Plugins раннеров должны объявлять `qaRunners` в `openclaw.plugin.json` и экспортировать соответствующий массив `qaRunnerCliRegistrations` из `runtime-api.ts`. Держите `runtime-api.ts` легким; ленивые CLI и выполнение раннера должны оставаться за отдельными точками входа.
5. Создайте или адаптируйте YAML-сценарии в тематических директориях `qa/scenarios/`.
6. Используйте универсальные помощники сценариев для новых сценариев.
7. Сохраняйте работу существующих алиасов совместимости, если репозиторий не выполняет намеренную миграцию.

Правило принятия решения строгое:

- Если поведение можно выразить один раз в `qa-lab`, поместите его в `qa-lab`.
- Если поведение зависит от одного транспорта канала, держите его в этом runner plugin или plugin harness.
- Если сценарию нужна новая возможность, которую может использовать более одного канала, добавьте универсальный помощник вместо ветки, специфичной для канала, в `suite.ts`.
- Если поведение имеет смысл только для одного транспорта, оставьте сценарий специфичным для транспорта и явно укажите это в контракте сценария.

### Имена помощников сценариев

Предпочтительные универсальные помощники для новых сценариев:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Алиасы совместимости остаются доступными для существующих сценариев - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - но при создании новых сценариев следует использовать универсальные имена. Алиасы существуют, чтобы избежать одномоментной миграции, а не как модель на будущее.

## Отчетность

`qa-lab` экспортирует Markdown-отчет протокола из наблюдаемой временной шкалы шины.
Отчет должен отвечать на вопросы:

- Что сработало
- Что не сработало
- Что осталось заблокированным
- Какие последующие сценарии стоит добавить

Для инвентаря доступных сценариев - полезного при оценке последующей работы или подключении нового транспорта - выполните `pnpm openclaw qa coverage` (добавьте `--json` для машиночитаемого вывода).
При выборе сфокусированного подтверждения для затронутого поведения или пути файла выполните `pnpm openclaw qa coverage --match <query>`.
Отчет сопоставления ищет в метаданных сценариев, ссылках на документацию, ссылках на код, идентификаторах покрытия, plugins и требованиях поставщиков, а затем печатает подходящие цели `qa suite --scenario ...`.
Каждый запуск `qa suite` записывает верхнеуровневые артефакты `qa-evidence.json`,
`qa-suite-summary.json` и `qa-suite-report.md` для выбранного
набора сценариев. Сценарии, объявляющие `execution.kind: vitest` или
`execution.kind: playwright`, запускают соответствующий путь теста и также записывают
логи по сценариям. Сценарии, объявляющие `execution.kind: script`, запускают
производитель подтверждений по `execution.path` через `node --import tsx` (с
развернутыми `${outputDir}` и `${scenarioId}` в `execution.args`); производитель
записывает собственный `qa-evidence.json`, записи которого импортируются в вывод
suite, а пути его артефактов разрешаются относительно этого
`qa-evidence.json` производителя. Когда `qa suite` достигается через
`qa run --qa-profile`, тот же `qa-evidence.json` также включает сводку scorecard профиля
для выбранных категорий таксономии.
Рассматривайте это как средство обнаружения, а не замену gate; выбранному сценарию все равно нужен правильный режим поставщика, live-транспорт, Multipass, Testbox или release-контур для проверяемого поведения.
Контекст scorecard см. в [Scorecard зрелости](/ru/maturity/scorecard).

Для проверок характера и стиля запустите один и тот же сценарий по нескольким live-ссылкам моделей
и запишите оцененный Markdown-отчет:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Команда запускает дочерние процессы локального QA Gateway, а не Docker. Сценарии
оценки персонажа должны задавать персону через `SOUL.md`, затем выполнять обычные
пользовательские ходы, такие как чат, помощь с рабочей областью и небольшие
задачи с файлами. Модели-кандидату не следует сообщать, что ее оценивают.
Команда сохраняет каждый полный транскрипт, записывает базовую статистику
запуска, а затем просит модели-судьи в быстром режиме с рассуждением `xhigh`,
где оно поддерживается, ранжировать запуски по естественности, атмосфере и юмору.
Используйте `--blind-judge-models` при сравнении провайдеров: подсказка судьи
по-прежнему получает каждый транскрипт и статус запуска, но ссылки на кандидатов
заменяются нейтральными метками, такими как `candidate-01`; после разбора отчет
сопоставляет ранжирование с реальными ссылками.
Запуски кандидатов по умолчанию используют мышление `high`, с `medium` для GPT-5.5
и `xhigh` для более старых оценочных ссылок OpenAI, которые его поддерживают.
Переопределите конкретного кандидата прямо в строке с помощью
`--model provider/model,thinking=<level>`. `--thinking <level>` по-прежнему задает
глобальный запасной вариант, а более старая форма
`--model-thinking <provider/model=level>` сохранена для совместимости.
Ссылки на кандидатов OpenAI по умолчанию используют быстрый режим, чтобы
приоритетная обработка применялась там, где провайдер ее поддерживает. Добавьте
`,fast`, `,no-fast` или `,fast=false` прямо в строке, когда отдельному кандидату
или судье нужно переопределение. Передавайте `--fast` только тогда, когда хотите
принудительно включить быстрый режим для каждой модели-кандидата. Длительности
запусков кандидатов и судей записываются в отчет для анализа бенчмарков, но
подсказки судей явно указывают не ранжировать по скорости.
Запуски моделей-кандидатов и моделей-судей по умолчанию используют concurrency
16. Уменьшайте `--concurrency` или `--judge-concurrency`, когда ограничения
провайдера или нагрузка на локальный Gateway делают запуск слишком шумным.
Если кандидат `--model` не передан, оценка персонажа по умолчанию использует
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` и
`google/gemini-3.1-pro-preview`, когда `--model` не передан.
Если `--judge-model` не передан, судьи по умолчанию используют
`openai/gpt-5.5,thinking=xhigh,fast` и
`anthropic/claude-opus-4-8,thinking=high`.

## Связанные документы

- [Матрица QA](/ru/concepts/qa-matrix)
- [Оценочная карта зрелости](/ru/maturity/scorecard)
- [Пакет бенчмарков персонального агента](/ru/concepts/personal-agent-benchmark-pack)
- [QA Channel](/ru/channels/qa-channel)
- [Тестирование](/ru/help/testing)
- [Панель мониторинга](/ru/web/dashboard)
