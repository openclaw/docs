---
read_when:
    - Понимание того, как компоненты QA-стека связаны между собой
    - Расширение qa-lab, qa-channel или транспортного адаптера
    - Добавление QA-сценариев, поддерживаемых репозиторием
    - Создание QA-автоматизации с повышенной реалистичностью вокруг панели Gateway
summary: 'Обзор стека QA: qa-lab, qa-channel, сценарии на основе репозитория, live transport lanes, транспортные адаптеры и отчетность.'
title: Обзор QA
x-i18n:
    generated_at: "2026-06-28T22:52:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Приватный стек QA предназначен для проверки OpenClaw более реалистичным,
похожим на каналы способом, чем это возможно в одном модульном тесте.

Текущие компоненты:

- `extensions/qa-channel`: синтетический канал сообщений с поверхностями DM, канала, темы,
  реакции, редактирования и удаления.
- `extensions/qa-lab`: UI отладчика и шина QA для наблюдения за транскриптом,
  внедрения входящих сообщений и экспорта Markdown-отчета.
- `extensions/qa-matrix`, будущие Plugin раннеров: адаптеры живых транспортов,
  которые управляют реальным каналом внутри дочернего QA gateway.
- `qa/`: seed-ресурсы из репозитория для стартовой задачи и базовых
  QA-сценариев.
- [Mantis](/ru/concepts/mantis): проверка до и после live-верификации для ошибок,
  которым нужны реальные транспорты, скриншоты браузера, состояние VM и доказательства PR.

## Поверхность команд

Каждый QA-поток выполняется через `pnpm openclaw qa <subcommand>`. У многих есть
алиасы скриптов `pnpm qa:*`; поддерживаются обе формы.

| Команда                                             | Назначение                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Встроенная QA самопроверка без `--qa-profile`; раннер профиля зрелости на основе таксономии с `--qa-profile smoke-ci`, `--qa-profile release` или `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Запускает сценарии из репозитория в QA gateway lane. Алиасы: `pnpm openclaw qa suite --runner multipass` для одноразовой Linux VM.                                                                                                                                  |
| `qa coverage`                                       | Выводит YAML-инвентарь покрытия сценариев (`--json` для машинного вывода).                                                                                                                                                                                               |
| `qa parity-report`                                  | Сравнивает два файла `qa-suite-summary.json` и записывает agentic-отчет о паритете либо использует `--runtime-axis --token-efficiency`, чтобы записать отчеты о паритете runtime Codex-vs-OpenClaw и эффективности токенов из одной сводки пары runtime.                                         |
| `qa character-eval`                                 | Запускает character QA-сценарий на нескольких live-моделях с оцененным отчетом. См. [Отчетность](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Запускает разовый prompt в выбранной provider/model lane.                                                                                                                                                                                                          |
| `qa ui`                                             | Запускает UI QA отладчика и локальную QA-шину (алиас: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Собирает предварительно подготовленный Docker-образ QA.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Записывает docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                    |
| `qa up`                                             | Собирает QA-сайт, запускает стек на Docker и выводит URL (алиас: `pnpm qa:lab:up`; вариант `:fast` добавляет `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запускает только сервер провайдера AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Запускает только сервер провайдера `mock-openai`, учитывающий сценарии.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Управляет общим пулом учетных данных Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Live transport lane против одноразового Tuwunel homeserver. См. [Matrix QA](/ru/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Live transport lane против реальной приватной группы Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Live transport lane против реального приватного канала гильдии Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Live transport lane против реального приватного канала Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Live transport lane против реальных аккаунтов WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Раннер проверки до и после для ошибок live transport, с доказательствами Discord status-reactions, Crabbox desktop/browser smoke и Slack-in-VNC smoke. См. [Mantis](/ru/concepts/mantis) и [Runbook Mantis Slack Desktop](/ru/concepts/mantis-slack-desktop-runbook). |

`qa run` с профилями читает состав из `taxonomy.yaml`, затем отправляет
разрешенные сценарии через `qa suite`. `--surface` и
`--category` фильтруют выбранный профиль, а не определяют отдельные lane.
Полученный `qa-evidence.json` включает сводку scorecard профиля с
количеством выбранных категорий и ID отсутствующего покрытия; отдельные записи
доказательств остаются источником истины для тестов, ролей покрытия и результатов.
ID покрытия функций таксономии являются точными целями доказательства, а не псевдонимами. Основное
покрытие сценариев выполняет совпадающие ID; вторичное покрытие остается рекомендационным.
ID покрытия используют dotted-форму `namespace.behavior` со строчными
буквенно-цифровыми сегментами или сегментами с дефисом; ID профилей, поверхностей и категорий могут по-прежнему использовать
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
Crabline fake provider servers. Используйте `release` для доказательства Stable/LTS на live
channels. Используйте `all` только для явных полных прогонов доказательств по всей таксономии; он выбирает
каждую активную категорию зрелости и может запускаться через workflow `QA Profile
Evidence` с `qa_profile=all`. Когда команде также нужен корневой профиль OpenClaw,
поместите корневой профиль перед командой QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Поток оператора

Текущий поток QA-оператора — это двухпанельный QA-сайт:

- Слева: Gateway dashboard (Control UI) с агентом.
- Справа: QA Lab, показывающий Slack-подобный транскрипт и план сценария.

Запустите его так:

```bash
pnpm qa:lab:up
```

Это собирает QA-сайт, запускает gateway lane на Docker и открывает страницу
QA Lab, где оператор или цикл автоматизации может дать агенту QA-миссию,
наблюдать реальное поведение канала и записывать, что сработало, что не удалось
или что осталось заблокированным.

Для более быстрой итерации UI QA Lab без пересборки Docker-образа каждый раз
запустите стек с bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` оставляет Docker-сервисы на предварительно собранном образе и bind-mount
`extensions/qa-lab/web/dist` в контейнер `qa-lab`. `qa:lab:watch`
пересобирает этот bundle при изменениях, а браузер автоматически перезагружается при изменении
asset hash QA Lab.

Для локального OpenTelemetry signal smoke выполните:

```bash
pnpm qa:otel:smoke
```

Этот скрипт запускает локальный OTLP/HTTP receiver, выполняет QA-сценарий `otel-trace-smoke`
с включенным Plugin `diagnostics-otel`, затем проверяет, что traces,
metrics и logs экспортированы. Он декодирует экспортированные protobuf trace spans
и проверяет критичную для релиза форму:
`openclaw.run`, `openclaw.harness.run`, latest GenAI semantic-convention
model-call span, `openclaw.context.assembled` и `openclaw.message.delivery`
должны присутствовать. Smoke принудительно задает
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, поэтому model-call
span должен использовать имя `{gen_ai.operation.name} {gen_ai.request.model}`;
model calls не должны экспортировать `StreamAbandoned` при успешных turns; raw diagnostic IDs и
атрибуты `openclaw.content.*` не должны попадать в trace. Raw OTLP
payloads не должны содержать prompt sentinel, response sentinel или QA session
key. Он записывает `otel-smoke-summary.json` рядом с артефактами QA suite.

Для OpenTelemetry smoke через collector выполните:

```bash
pnpm qa:otel:collector-smoke
```

Этот lane ставит реальный Docker-контейнер OpenTelemetry Collector перед тем же
локальным receiver. Используйте его при изменении проводки endpoint, совместимости collector
или поведения экспорта OTLP, которое in-process receiver мог бы скрыть.

Для защищенного Prometheus scrape smoke выполните:

```bash
pnpm qa:prometheus:smoke
```

Этот псевдоним запускает QA-сценарий `docker-prometheus-smoke` с включенным
`diagnostics-prometheus`, проверяет, что неаутентифицированные scrape-запросы отклоняются,
а затем проверяет, что аутентифицированный scrape включает критически важные для релиза семейства метрик
без содержимого промптов, содержимого ответов, необработанных диагностических идентификаторов, токенов
аутентификации или локальных путей.

Чтобы запустить оба smoke-теста наблюдаемости подряд, используйте:

```bash
pnpm qa:observability:smoke
```

Для OpenTelemetry-пути с коллектором и smoke-теста защищенного Prometheus scrape
используйте:

```bash
pnpm qa:observability:collector-smoke
```

QA наблюдаемости остается доступным только из рабочей копии исходного кода. npm tarball намеренно не включает
QA Lab, поэтому Docker-пути пакетного релиза не запускают команды `qa`. Используйте
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` или
`pnpm qa:observability:smoke` из собранной рабочей копии исходного кода при изменении
диагностической инструментализации.

Для Matrix smoke-пути с реальным транспортом, которому не требуются учетные данные
провайдера моделей, запустите быстрый профиль с детерминированным mock-провайдером OpenAI:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Для пути live-frontier провайдера явно передайте OpenAI-совместимые учетные данные:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Полный справочник CLI, каталог профилей и сценариев, env vars и структура артефактов для этого пути находятся в [Matrix QA](/ru/concepts/qa-matrix). Кратко: он поднимает одноразовый homeserver Tuwunel в Docker, регистрирует временных пользователей driver/SUT/observer, запускает реальный Plugin Matrix внутри дочернего QA Gateway, ограниченного этим транспортом (без `qa-channel`), затем записывает Markdown-отчет, JSON-сводку, артефакт наблюдаемых событий и объединенный лог вывода в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарии покрывают поведение транспорта, которое unit-тесты не могут доказать сквозным образом: фильтрацию по упоминаниям, политики allow-bot, allowlist, ответы верхнего уровня и в тредах, маршрутизацию DM, обработку реакций, подавление входящих правок, дедупликацию воспроизведения после перезапуска, восстановление после прерывания homeserver, доставку метаданных approval, обработку медиа и потоки начальной настройки, восстановления и проверки Matrix E2EE. Профиль CLI для E2EE также прогоняет `openclaw matrix encryption setup` и команды проверки через тот же одноразовый homeserver перед проверкой ответов Gateway.

У Discord также есть opt-in сценарии только для Mantis для воспроизведения багов. Используйте
`--scenario discord-status-reactions-tool-only` для явной временной шкалы реакций статуса
или `--scenario discord-thread-reply-filepath-attachment`, чтобы создать реальный тред Discord
и проверить, что `message.thread-reply` сохраняет вложение `filePath`. Эти сценарии не входят в
стандартный live-путь Discord, потому что это пробы воспроизведения до/после, а не широкое smoke-покрытие.
Mantis workflow для вложения в треде также может добавить witness-видео из Discord Web с выполненным входом,
когда `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` или
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` настроен в QA-окружении. Этот viewer profile предназначен
только для визуального захвата; решение pass/fail по-прежнему поступает от Discord REST oracle.

CI использует ту же командную поверхность в `.github/workflows/qa-live-transports-convex.yml`.
Запуски по расписанию и стандартные ручные запуски выполняют быстрый профиль Matrix с
live-frontier учетными данными, предоставленными QA, `--fast` и
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручной `matrix_profile=all` разворачивается
в пять шардов профилей.

Для smoke-путей Telegram, Discord, Slack и WhatsApp с реальным транспортом:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Они нацелены на заранее существующий реальный канал с двумя ботами или аккаунтами (driver + SUT). Обязательные env vars, списки сценариев, выходные артефакты и пул учетных данных Convex описаны ниже в [справочнике QA для Telegram, Discord, Slack и WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference).

Для полного запуска Slack desktop VM с VNC rescue выполните:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Эта команда арендует desktop/browser машину Crabbox, запускает live-путь Slack
внутри VM, открывает Slack Web в браузере VNC, захватывает desktop и копирует
`slack-qa/`, `slack-desktop-smoke.png` и `slack-desktop-smoke.mp4`,
когда доступен видеозахват, обратно в каталог артефактов Mantis. Аренды Crabbox
desktop/browser заранее предоставляют инструменты захвата и helper-пакеты для browser/native-build,
поэтому сценарий должен устанавливать fallback-зависимости только на старых арендах.
Mantis сообщает общие тайминги и тайминги по фазам в
`mantis-slack-desktop-smoke-report.md`, чтобы медленные запуски показывали, ушло ли время на
прогрев аренды, получение учетных данных, удаленную настройку или копирование артефактов. Повторно используйте
`--lease-id <cbx_...>` после ручного входа в Slack Web через VNC;
повторно используемые аренды также сохраняют теплым pnpm store cache Crabbox. Стандартный
`--hydrate-mode source` проверяет из рабочей копии исходного кода и запускает install/build
внутри VM. Используйте `--hydrate-mode prehydrated` только когда повторно используемое удаленное
workspace уже содержит `node_modules` и собранный `dist/`; этот режим пропускает
дорогой шаг install/build и fail-closed, если workspace не готово.
С `--gateway-setup` Mantis оставляет постоянный OpenClaw Slack Gateway,
работающий внутри VM на порту `38973`; без него команда запускает обычный
bot-to-bot Slack QA путь и завершается после захвата артефактов.

Чтобы доказать нативный Slack approval UI с desktop-доказательствами, запустите checkpoint-режим Mantis approval:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Этот режим взаимоисключается с `--gateway-setup`. Он запускает сценарии Slack
approval, отклоняет id сценариев не для approval, ожидает в каждом pending и
resolved состоянии approval, рендерит наблюдаемое сообщение Slack API в
`approval-checkpoints/<scenario>-pending.png` и
`approval-checkpoints/<scenario>-resolved.png`, затем завершается с ошибкой, если какой-либо checkpoint,
доказательство сообщения, acknowledgement или отрендеренный screenshot отсутствует или пуст.
Холодные CI-аренды все еще могут показывать вход в Slack в `slack-desktop-smoke.png`;
изображения approval checkpoint являются визуальным доказательством для этого пути.

Чеклист оператора, команда GitHub workflow dispatch, контракт evidence-comment,
таблица решений hydrate-mode, интерпретация таймингов и шаги обработки сбоев находятся в [Mantis Slack Desktop Runbook](/ru/concepts/mantis-slack-desktop-runbook).

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
для screenshot, когда выбран `--vision-mode image-describe`, и
записывает `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` и `mantis-visual-task-report.md`.
Когда задан `--expect-text`, vision prompt запрашивает структурированный JSON
вердикт и проходит только тогда, когда модель сообщает о положительном видимом доказательстве; отрицательный
ответ, который лишь цитирует целевой текст, не проходит assertion.
Используйте `--vision-mode metadata` для no-model smoke, который доказывает работу desktop,
browser, screenshot и video plumbing без вызова провайдера распознавания изображений.
Запись является обязательным артефактом для `visual-task`; если Crabbox не записывает
непустой `visual-task.mp4`, задача завершается с ошибкой, даже если visual driver
прошел. При сбое Mantis сохраняет аренду для VNC, если только задача уже не
прошла и `--keep-lease` не был задан.

Перед использованием pooled live credentials выполните:

```bash
pnpm openclaw qa credentials doctor
```

Doctor проверяет env брокера Convex, валидирует настройки endpoint и проверяет доступность admin/list, когда присутствует maintainer secret. Для секретов он сообщает только статус set/missing.

## Покрытие реальных транспортов

Live transport пути используют один контракт вместо того, чтобы каждый изобретал собственную форму списка сценариев. `qa-channel` — это широкий синтетический набор для поведения продукта, и он не является частью матрицы покрытия live transport.

Live transport runners должны импортировать общие scenario ids, helpers базового
покрытия и helper выбора сценариев из
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Путь     | Canary | Фильтрация по упоминаниям | Bot-to-bot | Блокировка allowlist | Ответ верхнего уровня | Ответ с цитатой | Возобновление после перезапуска | Продолжение треда | Изоляция треда | Наблюдение реакций | Help command | Регистрация нативной команды |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

Это сохраняет `qa-channel` как широкий набор для поведения продукта, тогда как Matrix,
Telegram и другие live transports используют один явный чеклист транспортного контракта.

Для одноразового Linux VM пути без включения Docker в QA-путь выполните:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Это загружает свежий guest Multipass, устанавливает зависимости, собирает OpenClaw
внутри guest, запускает `qa suite`, затем копирует обычный QA-отчет и
сводку обратно в `.artifacts/qa-e2e/...` на host.
Он повторно использует то же поведение выбора сценариев, что и `qa suite` на host.
Запуски suite на host и Multipass по умолчанию выполняют несколько выбранных сценариев параллельно
с изолированными gateway workers. `qa-channel` по умолчанию использует concurrency
4, ограниченную количеством выбранных сценариев. Используйте `--concurrency <count>`, чтобы настроить
число workers, или `--concurrency 1` для последовательного выполнения.
Используйте `--pack personal-agent`, чтобы запустить benchmark pack персонального помощника. Селектор
pack является additive с повторяющимися флагами `--scenario`: явные сценарии
запускаются первыми, затем сценарии pack запускаются в порядке pack с удалением дубликатов.
Используйте `--pack observability`, когда пользовательский QA runner уже предоставляет настройку
OpenTelemetry collector и хочет выбрать smoke-сценарии диагностики OpenTelemetry и Prometheus
вместе.
Команда завершается с ненулевым кодом, когда любой сценарий завершается с ошибкой. Используйте `--allow-failures`, когда
нужны артефакты без ошибочного exit code.
Live-запуски пробрасывают поддерживаемые QA auth inputs, практичные для
guest: provider keys на основе env, путь к QA live provider config и
`CODEX_HOME`, когда он присутствует. Держите `--output-dir` под корнем репозитория, чтобы guest
мог записывать обратно через смонтированное workspace.

## Справочник QA для Telegram, Discord, Slack и WhatsApp

Matrix имеет [отдельную страницу](/ru/concepts/qa-matrix) из-за количества сценариев и подготовки homeserver на базе Docker. Telegram, Discord, Slack и WhatsApp запускаются с уже существующими реальными транспортами, поэтому их справочник находится здесь.

### Общие флаги CLI

Эти направления регистрируются через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` и принимают одинаковые флаги:

| Флаг                                  | По умолчанию                                      | Описание                                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | -                                                | Запустить только этот сценарий. Можно повторять.                                                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Куда записываются отчеты, сводки, доказательства, артефакты конкретного транспорта и выходной лог. Относительные пути разрешаются относительно `--repo-root`.       |
| `--repo-root <path>`                  | `process.cwd()`                                  | Корень репозитория при вызове из нейтрального текущего каталога.                                                                                                    |
| `--sut-account <id>`                  | `sut`                                            | Временный идентификатор учетной записи внутри конфигурации QA gateway.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                  | `mock-openai` или `live-frontier` (устаревший `live-openai` все еще работает).                                                                                      |
| `--model <ref>` / `--alt-model <ref>` | значение провайдера по умолчанию                 | Ссылки на основную/альтернативную модель.                                                                                                                          |
| `--fast`                              | выключено                                        | Быстрый режим провайдера, где он поддерживается.                                                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                            | См. [пул учетных данных Convex](#convex-credential-pool).                                                                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` в CI, иначе `maintainer`                    | Роль, используемая при `--credential-source convex`.                                                                                                                |

Каждое направление завершается с ненулевым кодом при любом неуспешном сценарии. `--allow-failures` записывает артефакты без установки кода выхода с ошибкой.

### QA для Telegram

```bash
pnpm openclaw qa telegram
```

Нацелено на одну реальную приватную группу Telegram с двумя разными ботами (драйвер + SUT). У бота SUT должно быть имя пользователя Telegram; наблюдение bot-to-bot лучше всего работает, когда у обоих ботов включен **Bot-to-Bot Communication Mode** в `@BotFather`.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - числовой идентификатор чата (строка).
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

Неявный набор по умолчанию всегда покрывает canary, gating упоминаний, ответы на нативные команды, адресацию команд и групповые ответы bot-to-bot. Значения по умолчанию `mock-openai` также включают детерминированные проверки цепочек ответов и потоковой передачи финального сообщения. `telegram-current-session-status-tool` остается опциональным, потому что он стабилен только при запуске сразу после canary, а не после произвольных ответов на нативные команды. Используйте `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, чтобы вывести текущий раздел сценариев по умолчанию/опциональных сценариев со ссылками на регрессии.

Выходные артефакты:

- `telegram-qa-report.md`
- `qa-evidence.json` - записи доказательств для проверок живого транспорта, включая поля профиля, покрытия, провайдера, канала, артефактов, результата и RTT.

Пакетные запуски Telegram используют тот же контракт учетных данных Telegram. Повторное измерение RTT входит в обычное пакетное живое направление Telegram; распределение RTT включается в `qa-evidence.json` в `result.timing` для выбранной проверки RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Когда задано `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, пакетная живая обертка арендует учетные данные `kind: "telegram"`, экспортирует env арендованной группы/драйвера/бота SUT в запуск установленного пакета, отправляет Heartbeat аренды и освобождает ее при завершении. Пакетная обертка по умолчанию использует 20 проверок RTT для `telegram-mentioned-message-reply`, таймаут RTT 30 с и роль Convex `maintainer` вне CI, когда выбран Convex. Переопределите `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` или `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, чтобы настроить измерение RTT без создания отдельной команды RTT или специфичного для Telegram формата сводки.

### QA для Discord

```bash
pnpm openclaw qa discord
```

Нацелено на один реальный приватный канал гильдии Discord с двумя ботами: ботом-драйвером, управляемым harness, и ботом SUT, запускаемым дочерним OpenClaw gateway через встроенный Plugin Discord. Проверяет обработку упоминаний канала, что бот SUT зарегистрировал нативную команду `/help` в Discord, а также опциональные сценарии доказательств Mantis.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - должен совпадать с идентификатором пользователя бота SUT, возвращенным Discord (иначе направление быстро завершится ошибкой).

Опционально:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` сохраняет тела сообщений в артефактах наблюдаемых сообщений.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` выбирает голосовой/сценический канал для `discord-voice-autojoin`; без него сценарий выбирает первый видимый голосовой/сценический канал для бота SUT.

Сценарии (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - опциональный голосовой сценарий. Запускается отдельно, включает `channels.discord.voice.autoJoin` и проверяет, что текущее голосовое состояние Discord бота SUT соответствует целевому голосовому/сценическому каналу. Учетные данные Convex Discord могут включать необязательный `voiceChannelId`; иначе runner обнаруживает первый видимый голосовой/сценический канал в гильдии.
- `discord-status-reactions-tool-only` - опциональный сценарий Mantis. Запускается отдельно, потому что переключает SUT на постоянные ответы гильдии только через инструменты с `messages.statusReactions.enabled=true`, затем захватывает временную шкалу реакций REST и визуальные артефакты HTML/PNG. Отчеты Mantis до/после также сохраняют предоставленные сценарием артефакты MP4 как `baseline.mp4` и `candidate.mp4`.

Запустите сценарий автоматического подключения к голосовому каналу Discord явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Запустите сценарий Mantis для статусных реакций явно:

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
- `qa-evidence.json` - записи доказательств для проверок живого транспорта.
- `discord-qa-observed-messages.json` - тела редактируются, если не задано `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` и `discord-status-reactions-tool-only-timeline.png`, когда запускается сценарий статусных реакций.

### QA для Slack

```bash
pnpm openclaw qa slack
```

Нацелено на один реальный приватный канал Slack с двумя разными ботами: ботом-драйвером, управляемым harness, и ботом SUT, запускаемым дочерним OpenClaw gateway через встроенный Plugin Slack.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Опционально:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` сохраняет тела сообщений в артефактах наблюдаемых сообщений.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` включает контрольные точки визуального подтверждения для Mantis. Runner записывает `<scenario>.pending.json` и `<scenario>.resolved.json`, затем ждет соответствующие файлы `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` переопределяет таймаут подтверждения контрольной точки. Значение по умолчанию: `120000`.

Сценарии (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - опциональный сценарий нативного подтверждения exec в Slack. Запрашивает подтверждение exec через gateway, проверяет, что сообщение Slack содержит нативные кнопки подтверждения, разрешает его и проверяет обновление Slack после разрешения.
- `slack-approval-plugin-native` - опциональный сценарий нативного подтверждения Plugin в Slack. Включает совместную пересылку подтверждений exec и Plugin, чтобы события Plugin не подавлялись маршрутизацией подтверждений exec, затем проверяет тот же путь нативного UI Slack для pending/resolved.

Выходные артефакты:

- `slack-qa-report.md`
- `qa-evidence.json` - записи доказательств для проверок живого транспорта.
- `slack-qa-observed-messages.json` - тела редактируются, если не задано `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - только когда Mantis задает `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; содержит JSON контрольных точек, JSON подтверждений и скриншоты pending/resolved.

#### Настройка рабочей области Slack

Направлению нужны два разных приложения Slack в одной рабочей области, а также канал, участниками которого являются оба бота:

- `channelId` - идентификатор `Cxxxxxxxxxx` канала, куда приглашены оба бота. Используйте выделенный канал; направление публикует сообщения при каждом запуске.
- `driverBotToken` - токен бота (`xoxb-...`) приложения **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) приложения **SUT**, которое должно быть отдельным приложением Slack от драйвера, чтобы идентификатор пользователя его бота был другим.
- `sutAppToken` - токен уровня приложения (`xapp-...`) приложения SUT с `connections:write`, используемый Socket Mode, чтобы приложение SUT могло получать события.

Предпочитайте рабочую область Slack, выделенную для QA, вместо повторного использования производственной рабочей области.

Приведенный ниже манифест SUT намеренно сужает производственную установку встроенного Plugin Slack (`extensions/slack/src/setup-shared.ts:10`) до разрешений и событий, покрытых живым набором QA для Slack. Настройку производственного канала, как ее видят пользователи, см. в [быстрой настройке канала Slack](/ru/channels/slack#quick-setup); пара QA Driver/SUT намеренно отделена, потому что направлению нужны два разных идентификатора пользователей-ботов в одной рабочей области.

**1. Создайте приложение Driver**

Перейдите на [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → выберите рабочую область QA, вставьте следующий манифест, затем нажмите _Install to Workspace_:

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

Скопируйте _Bot User OAuth Token_ (`xoxb-...`) - он станет `driverBotToken`. Драйверу нужно только публиковать сообщения и идентифицировать себя; события и Socket Mode не нужны.  

**2. Создайте приложение SUT**

Повторите _Create New App → From a manifest_ в той же рабочей области. Это QA-приложение намеренно использует более узкую версию production-манифеста встроенного Slack plugin (`extensions/slack/src/setup-shared.ts:10`): scopes и события для реакций опущены, потому что live-набор Slack QA пока не покрывает обработку реакций.

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

После того как Slack создаст приложение, сделайте две вещи на странице его настроек:

- _Install to Workspace_ → скопируйте _Bot User OAuth Token_ → он станет `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → добавьте scope `connections:write` → сохраните → скопируйте значение `xapp-...` → оно станет `sutAppToken`.

Проверьте, что у двух ботов разные идентификаторы пользователей, вызвав `auth.test` для каждого токена. Runtime различает драйвер и SUT по идентификатору пользователя; повторное использование одного приложения для обоих сразу приведет к сбою gating по упоминаниям.

**3. Создайте канал**

В рабочей области QA создайте канал (например, `#openclaw-qa`) и пригласите обоих ботов изнутри канала:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопируйте идентификатор `Cxxxxxxxxxx` из _channel info → About → Channel ID_ - он станет `channelId`. Подойдет публичный канал; если вы используете приватный канал, у обоих приложений уже есть `groups:history`, поэтому чтение истории в harness все равно будет успешным.

**4. Зарегистрируйте учетные данные**

Есть два варианта. Используйте переменные окружения для отладки на одной машине (задайте четыре переменные `OPENCLAW_QA_SLACK_*` и передайте `--credential-source env`) или заполните общий пул Convex, чтобы CI и другие сопровождающие могли арендовать их.

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

**5. Проверьте end to end**

Запустите lane локально, чтобы подтвердить, что оба бота могут общаться друг с другом через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успешный запуск завершается значительно быстрее чем за 30 секунд, а `slack-qa-report.md` показывает статусы `pass` для `slack-canary` и `slack-mention-gating`. Если lane зависает примерно на 90 секунд и завершается с `Convex credential pool exhausted for kind "slack"`, значит пул пуст или все строки арендованы - `qa credentials list --kind slack --status all --json` покажет, какой именно случай.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Целевые объекты - две выделенные учетные записи WhatsApp Web: учетная запись драйвера, управляемая
harness, и учетная запись SUT, запущенная дочерним OpenClaw gateway через
встроенный WhatsApp plugin.

Обязательные переменные окружения при `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Необязательно:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` включает групповые сценарии, такие как
  `whatsapp-mention-gating` и `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` сохраняет тела сообщений в
  артефактах observed-message.

Каталог сценариев (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Базовые проверки и групповой gating: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Нативные команды: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Поведение ответов и финального вывода: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Входящие медиа и структурированные сообщения: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Они отправляют реальные события WhatsApp для изображений, аудио,
  документов, местоположений, контактов и стикеров через драйвер.
- Покрытие исходящего Gateway и действий с сообщениями:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Покрытие контроля доступа: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Нативные подтверждения: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Реакции статуса: `whatsapp-status-reactions`.

Сейчас каталог содержит 36 сценариев. Стандартный lane `live-frontier`
оставлен небольшим - 10 сценариев для быстрого smoke-покрытия. Стандартный
lane `mock-openai` запускает 31 детерминированный сценарий через реальный транспорт WhatsApp,
мокируя только вывод модели. Сценарии подтверждений и несколько более тяжелых/блокирующих проверок
остаются явными по идентификатору сценария.

Драйвер WhatsApp QA наблюдает структурированные live-события (`text`, `media`,
`location`, `reaction` и `poll`) и может активно отправлять медиа, опросы,
контакты, местоположения и стикеры. QA Lab импортирует этот драйвер через
поверхность пакета `@openclaw/whatsapp/api.js`, а не обращается к приватным
runtime-файлам WhatsApp. Содержимое сообщений по умолчанию редактируется. Покрытие исходящих
опросов и загрузки файлов проходит через детерминированные gateway-вызовы `poll` и
`message.action`, а не только через вызов инструмента из model prompt.

Выходные артефакты:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - evidence-записи для проверок live-транспорта.
- `whatsapp-qa-observed-messages.json` - тела редактируются, если не задано `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Пул учетных данных Convex

Lane для Telegram, Discord, Slack и WhatsApp могут арендовать учетные данные из общего пула Convex вместо чтения переменных окружения выше. Передайте `--credential-source convex` (или задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab получает эксклюзивную аренду, отправляет для нее Heartbeat в течение всего запуска и освобождает ее при завершении. Виды пула: `"telegram"`, `"discord"`, `"slack"` и `"whatsapp"`.

Формы payload, которые брокер проверяет на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` должен быть числовой строкой chat-id.
- Реальный пользователь Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - только для proof Mantis Telegram Desktop. Обычные lane QA Lab не должны получать этот вид.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - номера телефонов должны быть разными строками E.164.

Workflow proof Mantis Telegram Desktop удерживает одну эксклюзивную аренду Convex
`telegram-user` и для драйвера TDLib CLI, и для свидетеля Telegram Desktop,
затем освобождает ее после публикации proof.

Когда PR требует детерминированного визуального diff, Mantis может использовать один и тот же mock-ответ модели
на `main` и на head PR, пока меняется formatter или слой доставки Telegram.
Настройки захвата по умолчанию адаптированы для комментариев PR: стандартный класс Crabbox,
запись рабочего стола 24 fps, motion GIF 24 fps и ширина preview 1920 px.
Комментарии before/after должны публиковать чистый bundle, содержащий только
нужные GIF.

Slack lanes также могут использовать пул. Проверки формы Slack payload сейчас находятся в Slack QA runner, а не в брокере; используйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` с идентификатором Slack-канала вроде `Cxxxxxxxxxx`. См. [Настройка рабочей области Slack](#setting-up-the-slack-workspace) для подготовки приложений и scope.

Операционные переменные окружения и контракт endpoint брокера Convex описаны в [Тестирование → Общие учетные данные Telegram через Convex](/ru/help/testing#shared-telegram-credentials-via-convex-v1) (название раздела появилось до многоканального пула; семантика аренды общая для всех видов).

## Seeds из репозитория

Seed-ресурсы находятся в `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Они намеренно хранятся в git, чтобы план QA был виден и людям, и
агенту.

`qa-lab` должен оставаться универсальным runner YAML-сценариев. Каждый YAML-файл сценария является
источником истины для одного тестового запуска и должен определять:

- верхнеуровневый `title`
- метаданные `scenario`
- необязательные метаданные категории, capability, lane и risk в `scenario`
- ссылки на docs и code refs в `scenario`
- необязательные требования к plugin в `scenario`
- необязательный patch конфигурации gateway в `scenario`
- исполняемый верхнеуровневый `flow` для flow-сценариев или `scenario.execution.kind` /
  `scenario.execution.path` для сценариев Vitest и Playwright

Многоразовая поверхность runtime, на которой основан `flow`, может оставаться обобщенной
и сквозной. Например, YAML-сценарии могут сочетать помощники транспортной стороны
с помощниками браузерной стороны, которые управляют встроенным Control UI через
стык Gateway `browser.request`, не добавляя специальный runner.

Файлы сценариев следует группировать по продуктовой возможности, а не по папке
дерева исходного кода. Сохраняйте стабильные идентификаторы сценариев при перемещении файлов; используйте `docsRefs` и `codeRefs`
для отслеживаемости реализации.

Базовый список должен оставаться достаточно широким, чтобы покрывать:

- чаты DM и каналов
- поведение веток
- жизненный цикл действий с сообщениями
- обратные вызовы cron
- воспоминание памяти
- переключение модели
- передачу subagent
- чтение репозитория и документации
- одну небольшую задачу сборки, например Lobster Invaders

## Локальные ветки моков провайдеров

У `qa suite` есть две локальные ветки моков провайдеров:

- `mock-openai` — сценарно-ориентированный мок OpenClaw. Он остается стандартной
  детерминированной веткой моков для QA с привязкой к репозиторию и проверок паритета.
- `aimock` запускает сервер провайдера на базе AIMock для экспериментального покрытия
  протокола, фикстур, записи/воспроизведения и chaos. Он является добавочным и не
  заменяет диспетчер сценариев `mock-openai`.

Реализация веток провайдеров находится в `extensions/qa-lab/src/providers/`.
Каждый провайдер владеет своими значениями по умолчанию, запуском локального сервера, конфигурацией модели Gateway,
потребностями подготовки auth-профиля и флагами возможностей live/mock. Общий код suite и
gateway должен маршрутизироваться через реестр провайдеров вместо ветвления по
именам провайдеров.

## Транспортные адаптеры

`qa-lab` владеет обобщенным транспортным стыком для YAML-сценариев QA. `qa-channel` —
синтетическое значение по умолчанию. `crabline` запускает локальные серверы в форме провайдеров и выполняет
обычные Plugin каналов OpenClaw против них. `live` зарезервирован для реальных
учетных данных провайдеров и внешних каналов.

На архитектурном уровне разделение такое:

- `qa-lab` владеет обобщенным выполнением сценариев, параллелизмом worker, записью артефактов и отчетностью.
- Транспортный адаптер владеет конфигурацией gateway, готовностью, наблюдением входящих и исходящих сообщений, транспортными действиями и нормализованным транспортным состоянием.
- YAML-файлы сценариев в `qa/scenarios/` определяют тестовый прогон; `qa-lab` предоставляет многоразовую поверхность runtime, которая их выполняет.

### Добавление канала

Добавление канала в систему YAML QA требует реализации канала плюс
пакета сценариев, который проверяет контракт канала. Для smoke-покрытия в CI добавьте
соответствующий фейковый провайдер Crabline и откройте его через драйвер `crabline`.

Не добавляйте новый корень команды QA верхнего уровня, когда общий хост `qa-lab` может владеть flow.

`qa-lab` владеет общими механизмами хоста:

- корнем команды `openclaw qa`
- запуском и завершением suite
- параллелизмом worker
- записью артефактов
- генерацией отчетов
- выполнением сценариев
- алиасами совместимости для старых сценариев `qa-channel`

Plugin runner владеют транспортным контрактом:

- как `openclaw qa <runner>` монтируется под общим корнем `qa`
- как gateway настраивается для этого транспорта
- как проверяется готовность
- как внедряются входящие события
- как наблюдаются исходящие сообщения
- как предоставляются transcripts и нормализованное транспортное состояние
- как выполняются действия, поддерживаемые транспортом
- как выполняется сброс или очистка, специфичная для транспорта

Минимальная планка внедрения нового канала:

1. Сохраняйте `qa-lab` владельцем общего корня `qa`.
2. Реализуйте транспортный runner на общем стыке хоста `qa-lab`.
3. Держите механизмы, специфичные для транспорта, внутри Plugin runner или harness канала.
4. Монтируйте runner как `openclaw qa <runner>`, а не регистрируйте конкурирующую корневую команду. Plugin runner должны объявлять `qaRunners` в `openclaw.plugin.json` и экспортировать соответствующий массив `qaRunnerCliRegistrations` из `runtime-api.ts`. Держите `runtime-api.ts` легким; ленивое выполнение CLI и runner должно оставаться за отдельными entrypoint.
5. Создайте или адаптируйте YAML-сценарии в тематических каталогах `qa/scenarios/`.
6. Используйте обобщенные помощники сценариев для новых сценариев.
7. Сохраняйте работу существующих алиасов совместимости, если репозиторий не выполняет намеренную миграцию.

Правило принятия решения строгое:

- Если поведение можно выразить один раз в `qa-lab`, поместите его в `qa-lab`.
- Если поведение зависит от транспорта одного канала, держите его в этом Plugin runner или harness Plugin.
- Если сценарию нужна новая возможность, которую может использовать более чем один канал, добавьте обобщенный помощник вместо ветки, специфичной для канала, в `suite.ts`.
- Если поведение имеет смысл только для одного транспорта, оставьте сценарий специфичным для транспорта и явно укажите это в контракте сценария.

### Имена помощников сценариев

Предпочтительные обобщенные помощники для новых сценариев:

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

Алиасы совместимости остаются доступными для существующих сценариев: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`, но при создании новых сценариев следует использовать обобщенные имена. Алиасы существуют, чтобы избежать одномоментной миграции, а не как модель на будущее.

## Отчетность

`qa-lab` экспортирует Markdown-отчет протокола из наблюдаемой временной шкалы bus.
Отчет должен отвечать:

- Что сработало
- Что не сработало
- Что осталось заблокированным
- Какие последующие сценарии стоит добавить

Для инвентаризации доступных сценариев, полезной при оценке последующей работы или подключении нового транспорта, выполните `pnpm openclaw qa coverage` (добавьте `--json` для машиночитаемого вывода).
При выборе сфокусированного доказательства для затронутого поведения или пути файла выполните `pnpm openclaw qa coverage --match <query>`.
Отчет match ищет по метаданным сценариев, ссылкам docs, ссылкам code, идентификаторам покрытия, Plugin и требованиям провайдеров, затем печатает подходящие цели `qa suite --scenario ...`.
Каждый прогон `qa suite` записывает артефакты верхнего уровня `qa-evidence.json`,
`qa-suite-summary.json` и `qa-suite-report.md` для выбранного
набора сценариев. Сценарии, объявляющие `execution.kind: vitest` или
`execution.kind: playwright`, запускают соответствующий путь теста и также записывают
логи для каждого сценария. Сценарии, объявляющие `execution.kind: script`, запускают
производитель evidence по `execution.path` через `node --import tsx` (с
подстановкой `${outputDir}` и `${scenarioId}` в `execution.args`); производитель
записывает собственный `qa-evidence.json`, записи которого импортируются в вывод
suite, а пути артефактов разрешаются относительно этого `qa-evidence.json`
производителя. Когда `qa suite` достигается через
`qa run --qa-profile`, тот же `qa-evidence.json` также включает сводку
scorecard профиля для выбранных категорий таксономии.
Считайте это помощником обнаружения, а не заменой gate; выбранному сценарию все еще нужен правильный режим провайдера, live-транспорт, Multipass, Testbox или release-ветка для проверяемого поведения.
Контекст scorecard см. в [Scorecard зрелости](/ru/maturity/scorecard).

Для проверок характера и стиля выполните один и тот же сценарий по нескольким live-ссылкам моделей
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

Команда запускает локальные дочерние процессы QA gateway, а не Docker. Сценарии character eval
должны задавать персону через `SOUL.md`, затем выполнять обычные пользовательские ходы,
такие как чат, помощь с workspace и небольшие файловые задачи. Кандидатной модели
не следует сообщать, что ее оценивают. Команда сохраняет каждый полный
transcript, записывает базовую статистику прогона, затем просит модели-судьи в fast mode с
рассуждением `xhigh`, где оно поддерживается, ранжировать прогоны по естественности, вайбу и юмору.
Используйте `--blind-judge-models` при сравнении провайдеров: prompt судьи все равно получает
каждый transcript и статус прогона, но ссылки кандидатов заменяются нейтральными
метками, такими как `candidate-01`; отчет сопоставляет ранжирования с реальными ссылками после
парсинга.
Кандидатные прогоны по умолчанию используют thinking `high`, с `medium` для GPT-5.5 и `xhigh`
для старых ссылок eval OpenAI, которые это поддерживают. Переопределите конкретного кандидата inline через
`--model provider/model,thinking=<level>`. `--thinking <level>` по-прежнему задает
глобальный fallback, а старая форма `--model-thinking <provider/model=level>`
сохранена для совместимости.
Кандидатные ссылки OpenAI по умолчанию используют fast mode, чтобы priority processing применялся там,
где провайдер это поддерживает. Добавьте inline `,fast`, `,no-fast` или `,fast=false`, когда
одному кандидату или судье требуется переопределение. Передавайте `--fast` только когда хотите
принудительно включить fast mode для каждой кандидатной модели. Длительности кандидатов и судей
записываются в отчет для анализа бенчмарков, но prompts судей явно говорят
не ранжировать по скорости.
Прогоны кандидатных моделей и моделей-судей оба по умолчанию используют параллелизм 16. Уменьшите
`--concurrency` или `--judge-concurrency`, когда лимиты провайдера или нагрузка на локальный gateway
делают прогон слишком шумным.
Когда кандидатный `--model` не передан, character eval по умолчанию использует
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` и
`google/gemini-3.1-pro-preview`, когда `--model` не передан.
Когда `--judge-model` не передан, судьи по умолчанию:
`openai/gpt-5.5,thinking=xhigh,fast` и
`anthropic/claude-opus-4-8,thinking=high`.

## Связанная документация

- [Матричная QA](/ru/concepts/qa-matrix)
- [Scorecard зрелости](/ru/maturity/scorecard)
- [Пакет бенчмарков личного агента](/ru/concepts/personal-agent-benchmark-pack)
- [Канал QA](/ru/channels/qa-channel)
- [Тестирование](/ru/help/testing)
- [Dashboard](/ru/web/dashboard)
