---
read_when:
    - Как устроен стек QA
    - Расширение qa-lab, qa-channel или транспортного адаптера
    - Добавление QA-сценариев на базе репозитория
    - Создание более реалистичной автоматизации QA вокруг панели управления Gateway
summary: 'Обзор QA-стека: qa-lab, qa-channel, сценарии на основе репозитория, линии проверки реального транспорта, транспортные адаптеры и отчетность.'
title: Обзор QA
x-i18n:
    generated_at: "2026-06-30T14:15:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Стек приватного QA предназначен для проверки OpenClaw более реалистичным,
похожим на каналы способом, чем это возможно в одном модульном тесте.

Текущие компоненты:

- `extensions/qa-channel`: синтетический канал сообщений с поверхностями DM, канала, треда,
  реакции, редактирования и удаления.
- `extensions/qa-lab`: UI отладчика и QA-шина для наблюдения за транскриптом,
  внедрения входящих сообщений и экспорта Markdown-отчета.
- `extensions/qa-matrix`, будущие runner-плагины: адаптеры живых транспортов, которые
  управляют реальным каналом внутри дочернего QA gateway.
- `qa/`: seed-ресурсы из репозитория для стартовой задачи и базовых QA
  сценариев.
- [Mantis](/ru/concepts/mantis): проверка до и после вживую для ошибок, которым
  нужны реальные транспорты, скриншоты браузера, состояние VM и доказательства PR.

## Поверхность команд

Каждый QA-поток запускается через `pnpm openclaw qa <subcommand>`. У многих есть
алиасы скриптов `pnpm qa:*`; поддерживаются обе формы.

| Команда                                             | Назначение                                                                                                                                                                                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Встроенная самопроверка QA без `--qa-profile`; runner профиля зрелости на основе таксономии с `--qa-profile smoke-ci`, `--qa-profile release` или `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Запускает сценарии из репозитория против QA gateway lane. Алиасы: `pnpm openclaw qa suite --runner multipass` для одноразовой Linux VM.                                                                                                                                 |
| `qa coverage`                                       | Печатает инвентарь покрытия YAML-сценариев (`--json` для машинного вывода).                                                                                                                                                                                            |
| `qa parity-report`                                  | Сравнивает два файла `qa-suite-summary.json` и записывает agentic-отчет о паритете либо использует `--runtime-axis --token-efficiency`, чтобы записать отчеты о паритете рантаймов Codex-vs-OpenClaw и эффективности токенов из одной сводки пары рантаймов.             |
| `qa character-eval`                                 | Запускает character QA-сценарий на нескольких живых моделях с оцениваемым отчетом. См. [Отчетность](#reporting).                                                                                                                                                       |
| `qa manual`                                         | Запускает разовый prompt против выбранной lane провайдера/модели.                                                                                                                                                                                                      |
| `qa ui`                                             | Запускает UI QA-отладчика и локальную QA-шину (алиас: `pnpm qa:lab:ui`).                                                                                                                                                                                               |
| `qa docker-build-image`                             | Собирает предварительно подготовленный QA Docker-образ.                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Записывает docker-compose scaffold для QA dashboard + gateway lane.                                                                                                                                                                                                     |
| `qa up`                                             | Собирает QA-сайт, запускает стек на Docker и печатает URL (алиас: `pnpm qa:lab:up`; вариант `:fast` добавляет `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Запускает только сервер провайдера AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Запускает только учитывающий сценарии сервер провайдера `mock-openai`.                                                                                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Управляет общим пулом учетных данных Convex.                                                                                                                                                                                                                            |
| `qa matrix`                                         | Lane живого транспорта против одноразового homeserver Tuwunel. См. [Matrix QA](/ru/concepts/qa-matrix).                                                                                                                                                                   |
| `qa telegram`                                       | Lane живого транспорта против реальной приватной группы Telegram.                                                                                                                                                                                                      |
| `qa discord`                                        | Lane живого транспорта против реального приватного канала Discord guild.                                                                                                                                                                                               |
| `qa slack`                                          | Lane живого транспорта против реального приватного канала Slack.                                                                                                                                                                                                       |
| `qa whatsapp`                                       | Lane живого транспорта против реальных аккаунтов WhatsApp Web.                                                                                                                                                                                                         |
| `qa mantis`                                         | Runner проверки до и после для ошибок живого транспорта, с доказательствами в виде статус-реакций Discord, desktop/browser smoke в Crabbox и Slack-in-VNC smoke. См. [Mantis](/ru/concepts/mantis) и [Mantis Slack Desktop Runbook](/ru/concepts/mantis-slack-desktop-runbook). |

`qa run` на основе профиля читает состав из `taxonomy.yaml`, затем отправляет
разрешенные сценарии через `qa suite`. `--surface` и
`--category` фильтруют выбранный профиль, а не определяют отдельные lanes.
Полученный `qa-evidence.json` включает сводку scorecard профиля с
количеством выбранных категорий и ID отсутствующего покрытия; отдельные записи
доказательств остаются источником истины для тестов, ролей покрытия и результатов.
ID покрытия функций таксономии являются точными целями доказательства, а не алиасами. Основное
покрытие сценариев выполняет совпадающие ID; вторичное покрытие остается рекомендательным.
ID покрытия используют точечную форму `namespace.behavior` со строчными
буквенно-цифровыми сегментами и дефисами; ID профиля, поверхности и категории все еще могут использовать
существующие дефисные или точечные ID таксономии.
Slim-доказательства опускают `execution` для каждой записи и задают `evidenceMode: "slim"`;
`smoke-ci` по умолчанию использует slim, а `--evidence-mode full` восстанавливает полные записи:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Используйте `smoke-ci` для детерминированного доказательства профиля с mock-провайдерами моделей и
локальными серверами провайдеров Crabline. Используйте `release` для доказательства Stable/LTS против живых
каналов. Используйте `all` только для явных полных прогонов доказательств таксономии; он выбирает
каждую активную категорию зрелости и может быть отправлен через workflow `QA Profile
Evidence` с `qa_profile=all`. Когда команде также нужен корневой профиль OpenClaw,
поместите корневой профиль перед QA-командой:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Поток оператора

Текущий операторский QA-поток — это двухпанельный QA-сайт:

- Слева: Gateway dashboard (Control UI) с агентом.
- Справа: QA Lab, показывающий Slack-подобный транскрипт и план сценария.

Запустите его с помощью:

```bash
pnpm qa:lab:up
```

Это собирает QA-сайт, запускает gateway lane на Docker и открывает страницу
QA Lab, где оператор или цикл автоматизации может дать агенту QA-миссию,
наблюдать реальное поведение канала и записывать, что сработало, что не удалось или
что осталось заблокированным.

Для более быстрой итерации UI QA Lab без пересборки Docker-образа каждый раз
запустите стек с bind-mounted bundle QA Lab:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` держит Docker-сервисы на предварительно собранном образе и bind-mount
`extensions/qa-lab/web/dist` в контейнер `qa-lab`. `qa:lab:watch`
пересобирает этот bundle при изменениях, а браузер автоматически перезагружается, когда меняется hash asset QA Lab.

Для локального smoke сигнала OpenTelemetry выполните:

```bash
pnpm qa:otel:smoke
```

Этот скрипт запускает локальный приемник OTLP/HTTP, выполняет QA-сценарий `otel-trace-smoke`
с включенным plugin `diagnostics-otel`, затем проверяет экспорт traces,
metrics и logs. Он декодирует экспортированные protobuf trace spans
и проверяет критичную для релиза форму:
`openclaw.run`, `openclaw.harness.run`, span вызова модели с последней semantic convention GenAI,
`openclaw.context.assembled` и `openclaw.message.delivery`
должны присутствовать. Smoke принудительно задает
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, поэтому span вызова модели
должен использовать имя `{gen_ai.operation.name} {gen_ai.request.model}`;
вызовы модели не должны экспортировать `StreamAbandoned` при успешных turns; raw diagnostic IDs и
атрибуты `openclaw.content.*` не должны попадать в trace. Raw OTLP
payloads не должны содержать prompt sentinel, response sentinel или ключ QA-сессии.
Он записывает `otel-smoke-summary.json` рядом с артефактами QA suite.

Для smoke OpenTelemetry с collector выполните:

```bash
pnpm qa:otel:collector-smoke
```

Эта lane ставит реальный Docker-контейнер OpenTelemetry Collector перед тем же
локальным приемником. Используйте ее при изменении wiring endpoint, совместимости collector
или поведения экспорта OTLP, которое встроенный приемник мог бы замаскировать.

Для защищенного Prometheus scrape smoke выполните:

```bash
pnpm qa:prometheus:smoke
```

Этот псевдоним запускает QA-сценарий `docker-prometheus-smoke` с включенным
`diagnostics-prometheus`, проверяет, что неаутентифицированные scrape-запросы отклоняются,
а затем проверяет, что аутентифицированный scrape включает критически важные для релиза семейства метрик
без содержимого prompt, содержимого ответов, необработанных диагностических идентификаторов, токенов
аутентификации или локальных путей.

Чтобы запустить обе проверки observability подряд, используйте:

```bash
pnpm qa:observability:smoke
```

Для OpenTelemetry-ветки с collector и защищенной проверки Prometheus scrape
используйте:

```bash
pnpm qa:observability:collector-smoke
```

QA для observability остается доступным только из исходного checkout. npm-tarball намеренно не включает
QA Lab, поэтому Docker-ветки пакетного релиза не запускают команды `qa`. Используйте
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` или
`pnpm qa:observability:smoke` из собранного исходного checkout при изменении
инструментирования диагностики.

Для transport-real Matrix smoke-ветки, которой не требуются учетные данные model-provider,
запустите быстрый профиль с детерминированным mock-провайдером OpenAI:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Для ветки live-frontier provider явно передайте OpenAI-совместимые учетные данные:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Полный справочник CLI, каталог профилей/сценариев, переменные env и структура артефактов для этой ветки находятся в [Matrix QA](/ru/concepts/qa-matrix). Кратко: она поднимает одноразовый homeserver Tuwunel в Docker, регистрирует временных пользователей driver/SUT/observer, запускает настоящий Matrix plugin внутри дочернего QA gateway, ограниченного этим транспортом (без `qa-channel`), а затем записывает Markdown-отчет, JSON-сводку, артефакт observed-events и объединенный журнал вывода в `.artifacts/qa-e2e/matrix-<timestamp>/`.

Сценарии покрывают поведение транспорта, которое unit-тесты не могут доказать end to end: mention gating, политики allow-bot, allowlists, ответы верхнего уровня и в тредах, маршрутизацию DM, обработку реакций, подавление входящих правок, дедупликацию replay после перезапуска, восстановление после прерывания homeserver, доставку метаданных approval, обработку медиа и потоки bootstrap/recovery/verification Matrix E2EE. Профиль E2EE CLI также прогоняет `openclaw matrix encryption setup` и команды verification через тот же одноразовый homeserver перед проверкой ответов gateway.

Discord также имеет Mantis-only opt-in сценарии для воспроизведения ошибок. Используйте
`--scenario discord-status-reactions-tool-only` для явной временной шкалы статусных реакций
или `--scenario discord-thread-reply-filepath-attachment`, чтобы создать
настоящий тред Discord и проверить, что `message.thread-reply` сохраняет вложение
`filePath`. Эти сценарии не входят в стандартную live-ветку Discord,
потому что это before/after repro probes, а не широкое smoke-покрытие.
Mantis workflow для thread-attachment также может добавить видео-свидетельство
из вошедшего в систему Discord Web, когда `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` или
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` настроены в QA-окружении.
Этот профиль viewer предназначен только для визуальной записи; решение pass/fail
по-прежнему поступает от Discord REST oracle.

CI использует ту же командную поверхность в `.github/workflows/qa-live-transports-convex.yml`.
Запуски по расписанию и стандартные ручные запуски выполняют быстрый профиль Matrix с
предоставленными QA учетными данными live-frontier, `--fast` и
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Ручной запуск `matrix_profile=all` разворачивается
в пять profile shards.

Для transport-real smoke-веток Telegram, Discord, Slack и WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Они нацелены на заранее существующий реальный канал с двумя ботами или учетными записями (driver + SUT). Обязательные переменные env, списки сценариев, выходные артефакты и пул учетных данных Convex документированы в [справочнике QA для Telegram, Discord, Slack и WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) ниже.

Для полного запуска Slack desktop VM с VNC rescue выполните:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Эта команда арендует настольную/браузерную машину Crabbox, запускает Slack live-направление
внутри виртуальной машины, открывает Slack Web в браузере VNC, захватывает рабочий стол и
копирует `slack-qa/`, `slack-desktop-smoke.png` и `slack-desktop-smoke.mp4`,
когда доступна запись видео, обратно в каталог артефактов Mantis. Аренды
настольных/браузерных машин Crabbox заранее предоставляют инструменты захвата и
вспомогательные пакеты для браузера/нативной сборки, поэтому сценарий должен
устанавливать резервные варианты только на более старых арендах. Mantis сообщает
общие и пофазные тайминги в `mantis-slack-desktop-smoke-report.md`, чтобы
медленные запуски показывали, куда ушло время: на прогрев аренды, получение
учетных данных, удаленную настройку или копирование артефактов. Повторно
используйте `--lease-id <cbx_...>` после ручного входа в Slack Web через VNC;
повторно используемые аренды также сохраняют прогретым кеш pnpm store Crabbox.
Режим по умолчанию `--hydrate-mode source` проверяет из исходного checkout и
запускает install/build внутри виртуальной машины. Используйте
`--hydrate-mode prehydrated` только когда повторно используемое удаленное
рабочее пространство уже содержит `node_modules` и собранный `dist/`; этот режим
пропускает дорогой шаг install/build и завершается ошибкой, если рабочее
пространство не готово. С `--gateway-setup` Mantis оставляет постоянный
OpenClaw Slack Gateway запущенным внутри виртуальной машины на порту `38973`;
без него команда запускает обычное Slack QA-направление бот-к-боту и выходит
после захвата артефактов.

Чтобы доказать нативный Slack UI подтверждения с настольными доказательствами, запустите режим контрольных точек подтверждения Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Этот режим взаимоисключается с `--gateway-setup`. Он запускает сценарии
подтверждения Slack, отклоняет идентификаторы сценариев, не относящихся к
подтверждению, ожидает на каждом ожидающем и разрешенном состоянии подтверждения,
рендерит наблюдаемое сообщение Slack API в
`approval-checkpoints/<scenario>-pending.png` и
`approval-checkpoints/<scenario>-resolved.png`, затем завершается ошибкой, если
любая контрольная точка, доказательство сообщения, подтверждение получения или
отрендеренный снимок экрана отсутствует либо пуст. Холодные аренды CI все еще
могут показывать вход в Slack в `slack-desktop-smoke.png`; изображения
контрольных точек подтверждения являются визуальным доказательством для этого
направления.

Операторский чеклист, команда запуска GitHub workflow dispatch, контракт
комментария с доказательствами, таблица принятия решений по hydrate-mode,
интерпретация таймингов и шаги обработки сбоев находятся в [руководстве по запуску Mantis Slack Desktop](/ru/concepts/mantis-slack-desktop-runbook).

Для настольной задачи в стиле агента/CV выполните:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` арендует или повторно использует настольную/браузерную машину
Crabbox, запускает `crabbox record --while`, управляет видимым браузером через
вложенный `visual-driver`, захватывает `visual-task.png`, запускает
`openclaw infer image describe` для снимка экрана, когда выбран
`--vision-mode image-describe`, и записывает `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` и
`mantis-visual-task-report.md`. Когда задан `--expect-text`, vision-подсказка
запрашивает структурированный JSON-вердикт и проходит только тогда, когда модель
сообщает о положительном видимом доказательстве; отрицательный ответ, который
лишь цитирует целевой текст, не проходит проверку. Используйте
`--vision-mode metadata` для smoke-проверки без модели, которая доказывает
работу настольной среды, браузера, снимка экрана и видеоконвейера без вызова
провайдера понимания изображений. Запись является обязательным артефактом для
`visual-task`; если Crabbox не записывает непустой `visual-task.mp4`, задача
завершается ошибкой, даже когда визуальный драйвер прошел. При сбое Mantis
сохраняет аренду для VNC, если задача еще не прошла и `--keep-lease` не был задан.

Перед использованием общих боевых учетных данных выполните:

```bash
pnpm openclaw qa credentials doctor
```

Doctor проверяет env брокера Convex, валидирует настройки endpoint и проверяет доступность admin/list, когда присутствует секрет сопровождающего. Для секретов он сообщает только состояние задано/отсутствует.

## Покрытие реальных транспортов

Направления реальных транспортов используют один общий контракт вместо того, чтобы каждое изобретало собственную форму списка сценариев. `qa-channel` — это широкий синтетический набор проверок продуктового поведения, и он не является частью матрицы покрытия реальных транспортов.

Раннеры реальных транспортов должны импортировать общие идентификаторы сценариев, помощники базового
покрытия и помощник выбора сценариев из
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Направление | Канареечная проверка | Ограничение по упоминанию | Бот-к-боту | Блокировка allowlist | Ответ верхнего уровня | Ответ с цитатой | Возобновление после перезапуска | Последующий ответ в треде | Изоляция треда | Наблюдение реакции | Команда справки | Регистрация нативной команды |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

Это сохраняет `qa-channel` как широкий набор проверок продуктового поведения, а Matrix,
Telegram и другие реальные транспорты используют один явный чеклист транспортного контракта.

Для одноразового направления Linux VM без включения Docker в путь QA выполните:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Это загружает свежий гостевой Multipass, устанавливает зависимости, собирает OpenClaw
внутри гостевой системы, запускает `qa suite`, затем копирует обычный QA-отчет и
сводку обратно в `.artifacts/qa-e2e/...` на хосте.
Он повторно использует то же поведение выбора сценариев, что и `qa suite` на хосте.
Запуски набора на хосте и в Multipass по умолчанию выполняют несколько выбранных сценариев параллельно
с изолированными Gateway-воркерами. Для `qa-channel` по умолчанию используется параллелизм
4, ограниченный числом выбранных сценариев. Используйте `--concurrency <count>` для настройки
числа воркеров или `--concurrency 1` для последовательного выполнения.
Используйте `--pack personal-agent`, чтобы запустить пакет бенчмарков персонального ассистента. Селектор
пакета является добавочным с повторяющимися флагами `--scenario`: сначала запускаются явные сценарии,
затем сценарии пакета выполняются в порядке пакета с удалением дубликатов.
Используйте `--pack observability`, когда пользовательский QA-раннер уже предоставляет настройку
коллектора OpenTelemetry и хочет выбрать вместе smoke-сценарии диагностики OpenTelemetry и Prometheus.
Команда завершается с ненулевым кодом, когда любой сценарий завершается ошибкой. Используйте `--allow-failures`, когда
вам нужны артефакты без ошибочного кода выхода.
Live-запуски передают поддерживаемые входные данные QA auth, практичные для гостевой
системы: provider keys на основе env, путь к конфигурации QA live provider и
`CODEX_HOME`, когда он присутствует. Держите `--output-dir` под корнем репозитория, чтобы гостевая
система могла записывать обратно через смонтированное рабочее пространство.

## Справочник QA для Telegram, Discord, Slack и WhatsApp

У Matrix есть [отдельная страница](/ru/concepts/qa-matrix) из-за количества сценариев и подготовки homeserver на базе Docker. Telegram, Discord, Slack и WhatsApp запускаются с уже существующими реальными транспортами, поэтому их справочник находится здесь.

### Общие флаги CLI

Эти прогоны регистрируются через `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` и принимают одинаковые флаги:

| Флаг                                  | Значение по умолчанию                             | Описание                                                                                                                                        |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Запустить только этот сценарий. Можно указывать несколько раз.                                                                                  |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Куда записываются отчеты, сводки, доказательства, артефакты конкретного транспорта и выходной лог. Относительные пути разрешаются от `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Корень репозитория при запуске из нейтрального cwd.                                                                                             |
| `--sut-account <id>`                  | `sut`                                              | Временный id аккаунта внутри конфигурации QA gateway.                                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` или `live-frontier` (устаревший `live-openai` все еще работает).                                                                  |
| `--model <ref>` / `--alt-model <ref>` | значение провайдера по умолчанию                  | Ссылки на основную/альтернативную модель.                                                                                                       |
| `--fast`                              | выключено                                          | Быстрый режим провайдера, где поддерживается.                                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                              | См. [пул учетных данных Convex](#convex-credential-pool).                                                                                       |
| `--credential-role <maintainer\|ci>`  | `ci` в CI, иначе `maintainer`                      | Роль, используемая при `--credential-source convex`.                                                                                            |

Каждый прогон завершается с ненулевым кодом при любом неуспешном сценарии. `--allow-failures` записывает артефакты, не выставляя код выхода с ошибкой.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Нацелен на одну реальную приватную группу Telegram с двумя разными ботами (driver + SUT). У SUT-бота должно быть имя пользователя Telegram; наблюдение bot-to-bot лучше всего работает, когда у обоих ботов включен **Bot-to-Bot Communication Mode** в `@BotFather`.

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

Неявный набор по умолчанию всегда покрывает canary, mention gating, ответы нативных команд, адресацию команд и групповые ответы bot-to-bot. Значения по умолчанию для `mock-openai` также включают детерминированные проверки цепочки ответов и потоковой передачи финального сообщения. `telegram-current-session-status-tool` остается опциональным, потому что стабилен только при прямом запуске после canary, а не после произвольных ответов нативных команд. Используйте `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`, чтобы вывести текущее разделение на сценарии по умолчанию/опциональные сценарии с regression refs.

Выходные артефакты:

- `telegram-qa-report.md`
- `qa-evidence.json` - записи доказательств для проверок live-транспорта, включая поля profile, coverage, provider, channel, artifacts, result и RTT.

Пакетные запуски Telegram используют тот же контракт учетных данных Telegram. Повторное измерение RTT входит в обычный пакетный live-прогон Telegram; распределение RTT включается в `qa-evidence.json` в `result.timing` для выбранной проверки RTT.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Когда задан `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, пакетная live-обертка арендует учетные данные `kind: "telegram"`, экспортирует env арендованной группы/driver-бота/SUT-бота в запуск установленного пакета, отправляет Heartbeat для аренды и освобождает ее при shutdown. По умолчанию пакетная обертка выполняет 20 проверок RTT для `telegram-mentioned-message-reply`, использует таймаут RTT 30 с и роль Convex `maintainer` вне CI, когда выбран Convex. Переопределите `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` или `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`, чтобы настроить измерение RTT без создания отдельной команды RTT или специфичного для Telegram формата сводки.

### QA Discord

```bash
pnpm openclaw qa discord
```

Нацелен на один реальный приватный канал Discord guild с двумя ботами: driver-ботом, управляемым harness, и SUT-ботом, запущенным дочерним OpenClaw gateway через встроенный Plugin Discord. Проверяет обработку упоминаний в канале, то, что SUT-бот зарегистрировал нативную команду `/help` в Discord, и опциональные сценарии доказательств Mantis.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - должен совпадать с id пользователя SUT-бота, возвращенным Discord (иначе прогон быстро завершается ошибкой).

Опционально:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` сохраняет тела сообщений в артефактах наблюдаемых сообщений.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` выбирает голосовой/stage-канал для `discord-voice-autojoin`; без него сценарий выбирает первый видимый голосовой/stage-канал для SUT-бота.

Сценарии (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - опциональный голосовой сценарий. Запускается самостоятельно, включает `channels.discord.voice.autoJoin` и проверяет, что текущее голосовое состояние SUT-бота в Discord соответствует целевому голосовому/stage-каналу. Учетные данные Convex Discord могут включать опциональный `voiceChannelId`; иначе runner обнаруживает первый видимый голосовой/stage-канал в guild.
- `discord-status-reactions-tool-only` - опциональный сценарий Mantis. Запускается самостоятельно, потому что переключает SUT на постоянные ответы guild только через tools с `messages.statusReactions.enabled=true`, затем захватывает REST-таймлайн реакций и визуальные артефакты HTML/PNG. Отчеты Mantis before/after также сохраняют предоставленные сценарием артефакты MP4 как `baseline.mp4` и `candidate.mp4`.

Запустите сценарий автоматического подключения Discord к голосовому каналу явно:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Запустите сценарий Mantis для status-reaction явно:

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
- `qa-evidence.json` - записи доказательств для проверок live-транспорта.
- `discord-qa-observed-messages.json` - тела редактируются, если не задан `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` и `discord-status-reactions-tool-only-timeline.png`, когда запускается сценарий status-reaction.

### QA Slack

```bash
pnpm openclaw qa slack
```

Нацелен на один реальный приватный канал Slack с двумя разными ботами: driver-ботом, управляемым harness, и SUT-ботом, запущенным дочерним OpenClaw gateway через встроенный Plugin Slack.

Обязательные env при `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Опционально:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` сохраняет тела сообщений в артефактах наблюдаемых сообщений.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` включает визуальные контрольные точки approval для Mantis. Runner записывает `<scenario>.pending.json` и `<scenario>.resolved.json`, затем ждет соответствующие файлы `.ack.json`.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` переопределяет таймаут подтверждения контрольной точки. Значение по умолчанию: `120000`.

Сценарии (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - опциональный сценарий нативного approval для exec в Slack.
  Запрашивает approval для exec через gateway, проверяет, что сообщение Slack содержит нативные кнопки approval, разрешает его и проверяет обновление resolved в Slack.
- `slack-approval-plugin-native` - опциональный сценарий нативного approval для Plugin в Slack.
  Включает пересылку approval для exec и Plugin вместе, чтобы события Plugin не подавлялись маршрутизацией approval для exec, затем проверяет тот же нативный путь Slack UI pending/resolved.

Выходные артефакты:

- `slack-qa-report.md`
- `qa-evidence.json` - записи доказательств для проверок live-транспорта.
- `slack-qa-observed-messages.json` - тела редактируются, если не задан `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - только когда Mantis задает `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; содержит JSON контрольных точек, JSON подтверждений и скриншоты pending/resolved.

#### Настройка рабочего пространства Slack

Для прогона нужны два разных приложения Slack в одном рабочем пространстве, а также канал, участниками которого являются оба бота:

- `channelId` - id `Cxxxxxxxxxx` канала, куда приглашены оба бота. Используйте выделенный канал; прогон публикует сообщения при каждом запуске.
- `driverBotToken` - токен бота (`xoxb-...`) приложения **Driver**.
- `sutBotToken` - токен бота (`xoxb-...`) приложения **SUT**, которое должно быть отдельным приложением Slack, отличным от driver, чтобы id пользователя его бота был отдельным.
- `sutAppToken` - токен уровня приложения (`xapp-...`) приложения SUT с `connections:write`, используемый Socket Mode, чтобы приложение SUT могло получать события.

Предпочитайте рабочее пространство Slack, выделенное для QA, вместо повторного использования production-рабочего пространства.

Приведенный ниже манифест SUT намеренно сужает production-установку встроенного Plugin Slack (`extensions/slack/src/setup-shared.ts:10`) до разрешений и событий, покрытых live-набором QA Slack. Для настройки production-канала в том виде, как ее видят пользователи, см. [быструю настройку канала Slack](/ru/channels/slack#quick-setup); пара QA Driver/SUT намеренно отделена, потому что прогону нужны два разных id пользователей ботов в одном рабочем пространстве.

**1. Создайте приложение Driver**

Перейдите на [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → выберите рабочую область QA, вставьте следующий манифест, затем _Install to Workspace_:

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

Повторите _Create New App → From a manifest_ в той же рабочей области. Это приложение QA намеренно использует более узкую версию производственного манифеста встроенного Plugin Slack (`extensions/slack/src/setup-shared.ts:10`): области доступа и события для реакций опущены, потому что набор live-тестов Slack QA пока не покрывает обработку реакций.

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

- _Install to Workspace_ → скопируйте _Bot User OAuth Token_ → он станет `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → добавьте область доступа `connections:write` → сохраните → скопируйте значение `xapp-...` → оно станет `sutAppToken`.

Проверьте, что у двух ботов разные идентификаторы пользователей, вызвав `auth.test` для каждого токена. Среда выполнения различает драйвер и SUT по идентификатору пользователя; повторное использование одного приложения для обоих сразу приведет к сбою проверки упоминаний.

**3. Создайте канал**

В рабочей области QA создайте канал (например, `#openclaw-qa`) и пригласите обоих ботов изнутри канала:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Скопируйте идентификатор `Cxxxxxxxxxx` из _channel info → About → Channel ID_ - он станет `channelId`. Подойдет публичный канал; если вы используете приватный канал, у обоих приложений уже есть `groups:history`, поэтому чтение истории harness все равно будет успешным.

**4. Зарегистрируйте учетные данные**

Есть два варианта. Используйте переменные окружения для отладки на одной машине (задайте четыре переменные `OPENCLAW_QA_SLACK_*` и передайте `--credential-source env`) или заполните общий пул Convex, чтобы CI и другие сопровождающие могли брать их в аренду.

Для пула Convex запишите четыре поля в JSON-файл:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Экспортировав `OPENCLAW_QA_CONVEX_SITE_URL` и `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` в своей оболочке, зарегистрируйте и проверьте:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Ожидается `count: 1`, `status: "active"`, без поля `lease`.

**5. Проверьте end to end**

Запустите lane локально, чтобы подтвердить, что оба бота могут общаться друг с другом через брокер:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Успешный запуск завершается значительно быстрее чем за 30 секунд, а `slack-qa-report.md` показывает статус `pass` для `slack-canary` и `slack-mention-gating`. Если lane зависает примерно на 90 секунд и завершается с `Convex credential pool exhausted for kind "slack"`, значит пул пуст или все строки арендованы - `qa credentials list --kind slack --status all --json` покажет, что именно.

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

Нацелен на две выделенные учетные записи WhatsApp Web: учетную запись драйвера,
которой управляет harness, и учетную запись SUT, запускаемую дочерним Gateway
OpenClaw через встроенный Plugin WhatsApp.

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

- Базовая проверка и проверка группового доступа: `whatsapp-canary`, `whatsapp-pairing-block`,
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
- Покрытие управления доступом: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Нативные подтверждения: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Реакции статуса: `whatsapp-status-reactions`.

Сейчас каталог содержит 36 сценариев. Lane по умолчанию `live-frontier`
оставлен небольшим: 10 сценариев для быстрого smoke-покрытия. Lane по умолчанию
`mock-openai` запускает 31 детерминированный сценарий через реальный транспорт WhatsApp,
мокируя только вывод модели. Сценарии подтверждений и несколько более тяжелых или блокирующих
проверок остаются явными по идентификатору сценария.

Драйвер WhatsApp QA наблюдает структурированные live-события (`text`, `media`,
`location`, `reaction` и `poll`) и может активно отправлять медиа, опросы,
контакты, местоположения и стикеры. QA Lab импортирует этот драйвер через
поверхность пакета `@openclaw/whatsapp/api.js`, а не обращается к приватным
файлам среды выполнения WhatsApp. Содержимое сообщений по умолчанию редактируется. Покрытие исходящих
опросов и загрузки файлов выполняется через детерминированные вызовы Gateway `poll` и
`message.action`, а не только через вызов инструментов из модельного промпта.

Артефакты вывода:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - записи доказательств для проверок live-транспорта.
- `whatsapp-qa-observed-messages.json` - тела редактируются, если не задано `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Пул учетных данных Convex

Lane для Telegram, Discord, Slack и WhatsApp могут арендовать учетные данные из общего пула Convex вместо чтения переменных окружения выше. Передайте `--credential-source convex` (или задайте `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab получает эксклюзивную аренду, отправляет Heartbeat на протяжении выполнения и освобождает аренду при завершении. Типы пула: `"telegram"`, `"discord"`, `"slack"` и `"whatsapp"`.

Формы payload, которые брокер проверяет на `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` должен быть числовой строкой идентификатора чата.
- Реальный пользователь Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - только для доказательства Mantis Telegram Desktop. Обычные lane QA Lab не должны получать этот тип.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - телефонные номера должны быть разными строками E.164.

Рабочий процесс доказательства Mantis Telegram Desktop удерживает одну эксклюзивную аренду Convex
`telegram-user` и для драйвера TDLib CLI, и для свидетеля Telegram Desktop,
а затем освобождает ее после публикации доказательства.

Когда PR нужен детерминированный визуальный diff, Mantis может использовать один и тот же mock-ответ модели
на `main` и на head PR, пока меняется форматтер Telegram или слой доставки.
Значения захвата по умолчанию настроены для комментариев PR: стандартный класс Crabbox,
запись рабочего стола 24fps, motion GIF 24fps и ширина предпросмотра 1920px.
Комментарии до/после должны публиковать чистый пакет, содержащий только
нужные GIF-файлы.

Lane Slack также могут использовать пул. Проверки формы payload Slack сейчас находятся в runner Slack QA, а не в брокере; используйте `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, с идентификатором канала Slack вроде `Cxxxxxxxxxx`. См. [Настройка рабочей области Slack](#setting-up-the-slack-workspace) для подготовки приложений и областей доступа.

Операционные переменные окружения и контракт endpoint брокера Convex находятся в разделе [Тестирование → Общие учетные данные Telegram через Convex](/ru/help/testing#shared-telegram-credentials-via-convex-v1) (название раздела появилось до многоканального пула; семантика аренды общая для всех типов).

## Seed-данные из репозитория

Seed-ресурсы находятся в `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Они намеренно хранятся в git, чтобы план QA был виден и людям, и
агенту.

`qa-lab` должен оставаться универсальным runner сценариев YAML. Каждый YAML-файл сценария
является источником истины для одного тестового запуска и должен определять:

- верхнеуровневый `title`
- метаданные `scenario`
- необязательные метаданные категории, возможности, lane и риска в `scenario`
- ссылки на docs и код в `scenario`
- необязательные требования Plugin в `scenario`
- необязательный patch конфигурации Gateway в `scenario`
- исполняемый верхнеуровневый `flow` для flow-сценариев или `scenario.execution.kind` /
  `scenario.execution.path` для сценариев Vitest и Playwright

Переиспользуемая поверхность runtime, на которой основан `flow`, может оставаться обобщенной
и сквозной. Например, YAML-сценарии могут сочетать вспомогательные средства на стороне транспорта
со вспомогательными средствами на стороне браузера, которые управляют встроенным Control UI через шов
Gateway `browser.request`, без добавления специального runner.

Файлы сценариев следует группировать по продуктовым возможностям, а не по папкам
дерева исходного кода. Сохраняйте стабильность идентификаторов сценариев при перемещении файлов; используйте `docsRefs` и `codeRefs`
для трассируемости реализации.

Базовый список должен оставаться достаточно широким, чтобы покрывать:

- чаты в DM и каналах
- поведение thread
- жизненный цикл действий с сообщениями
- обратные вызовы cron
- вызов памяти
- переключение модели
- передачу subagent
- чтение репозитория и документации
- одну небольшую задачу сборки, например Lobster Invaders

## Линии mock-провайдеров

У `qa suite` есть две локальные линии mock-провайдеров:

- `mock-openai` — сценарно-ориентированный mock OpenClaw. Он остается стандартной
  детерминированной mock-линией для QA с опорой на репозиторий и проверок паритета.
- `aimock` запускает сервер провайдера на базе AIMock для экспериментального покрытия протоколов,
  фикстур, записи/воспроизведения и chaos. Он является дополнительным и не
  заменяет диспетчер сценариев `mock-openai`.

Реализация provider-lane находится в `extensions/qa-lab/src/providers/`.
Каждый провайдер владеет своими значениями по умолчанию, запуском локального сервера, конфигурацией модели gateway,
потребностями staging для auth-profile и флагами live/mock-возможностей. Общий код suite и
gateway должен маршрутизироваться через реестр провайдеров, а не ветвиться по
именам провайдеров.

## Транспортные адаптеры

`qa-lab` владеет обобщенным транспортным швом для YAML-сценариев QA. `qa-channel` является
синтетическим вариантом по умолчанию. `crabline` запускает локальные серверы в форме провайдеров и выполняет
обычные channel plugins OpenClaw против них. `live` зарезервирован для настоящих
учетных данных провайдеров и внешних каналов.

На уровне архитектуры разделение такое:

- `qa-lab` владеет обобщенным выполнением сценариев, параллелизмом worker, записью артефактов и отчетностью.
- Транспортный адаптер владеет конфигурацией gateway, готовностью, наблюдением входящих и исходящих событий, транспортными действиями и нормализованным состоянием транспорта.
- YAML-файлы сценариев в `qa/scenarios/` определяют тестовый прогон; `qa-lab` предоставляет переиспользуемую поверхность runtime, которая их выполняет.

### Добавление канала

Добавление канала в YAML-систему QA требует реализации канала плюс
пакет сценариев, проверяющий контракт канала. Для smoke-покрытия в CI добавьте
соответствующий локальный provider server Crabline и предоставьте его через драйвер `crabline`.

Не добавляйте новый корневой раздел команд QA верхнего уровня, когда общий хост `qa-lab` может владеть flow.

`qa-lab` владеет общими механизмами хоста:

- корневой командой `openclaw qa`
- запуском и завершением suite
- параллелизмом worker
- записью артефактов
- генерацией отчетов
- выполнением сценариев
- алиасами совместимости для старых сценариев `qa-channel`

Runner plugins владеют транспортным контрактом:

- как `openclaw qa <runner>` монтируется под общим корнем `qa`
- как gateway настраивается для этого транспорта
- как проверяется готовность
- как внедряются входящие события
- как наблюдаются исходящие сообщения
- как предоставляются transcripts и нормализованное состояние транспорта
- как выполняются действия, подкрепленные транспортом
- как обрабатывается сброс или очистка, специфичная для транспорта

Минимальная планка внедрения для нового канала:

1. Сохраняйте `qa-lab` владельцем общего корня `qa`.
2. Реализуйте transport runner на общем шве хоста `qa-lab`.
3. Держите механизмы, специфичные для транспорта, внутри runner plugin или harness канала.
4. Монтируйте runner как `openclaw qa <runner>`, а не регистрируйте конкурирующую корневую команду. Runner plugins должны объявлять `qaRunners` в `openclaw.plugin.json` и экспортировать соответствующий массив `qaRunnerCliRegistrations` из `runtime-api.ts`. Держите `runtime-api.ts` легким; ленивое выполнение CLI и runner должно оставаться за отдельными entrypoints.
5. Создайте или адаптируйте YAML-сценарии в тематических каталогах `qa/scenarios/`.
6. Используйте обобщенные вспомогательные средства сценариев для новых сценариев.
7. Сохраняйте работу существующих алиасов совместимости, если репозиторий не выполняет намеренную миграцию.

Правило принятия решений строгое:

- Если поведение можно выразить один раз в `qa-lab`, поместите его в `qa-lab`.
- Если поведение зависит от одного транспорта канала, держите его в соответствующем runner plugin или plugin harness.
- Если сценарию нужна новая возможность, которую может использовать более одного канала, добавьте обобщенное вспомогательное средство вместо ветки, специфичной для канала, в `suite.ts`.
- Если поведение имеет смысл только для одного транспорта, оставьте сценарий специфичным для транспорта и явно укажите это в контракте сценария.

### Имена вспомогательных средств сценариев

Предпочтительные обобщенные вспомогательные средства для новых сценариев:

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

Алиасы совместимости остаются доступными для существующих сценариев: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`, но новые сценарии следует писать с использованием обобщенных имен. Алиасы существуют, чтобы избежать миграции за один день, а не как модель на будущее.

## Отчетность

`qa-lab` экспортирует Markdown-отчет о протоколе из наблюдаемой временной шкалы bus.
Отчет должен отвечать на вопросы:

- Что сработало
- Что не сработало
- Что осталось заблокированным
- Какие последующие сценарии стоит добавить

Для инвентаря доступных сценариев, полезного при оценке объема последующей работы или подключении нового транспорта, выполните `pnpm openclaw qa coverage` (добавьте `--json` для машиночитаемого вывода).
При выборе сфокусированного доказательства для затронутого поведения или пути к файлу выполните `pnpm openclaw qa coverage --match <query>`.
Отчет match ищет по метаданным сценариев, ссылкам на документацию, ссылкам на код, coverage IDs, plugins и требованиям провайдеров, затем печатает подходящие цели `qa suite --scenario ...`.
Каждый запуск `qa suite` записывает артефакты верхнего уровня `qa-evidence.json`,
`qa-suite-summary.json` и `qa-suite-report.md` для выбранного
набора сценариев. Сценарии, объявляющие `execution.kind: vitest` или
`execution.kind: playwright`, запускают соответствующий тестовый путь и также записывают
логи для каждого сценария. Сценарии, объявляющие `execution.kind: script`, запускают
производитель доказательств по `execution.path` через `node --import tsx` (с
развернутыми `${outputDir}` и `${scenarioId}` в `execution.args`); производитель
записывает собственный `qa-evidence.json`, записи которого импортируются в вывод
suite, а пути его артефактов разрешаются относительно этого producer
`qa-evidence.json`. Когда `qa suite` достигается через
`qa run --qa-profile`, тот же `qa-evidence.json` также включает сводку
scorecard профиля для выбранных категорий таксономии.
Считайте это средством обнаружения, а не заменой gate; выбранному сценарию все равно нужны правильный режим провайдера, live-транспорт, Multipass, Testbox или release lane для проверяемого поведения.
Контекст scorecard см. в [Maturity scorecard](/ru/maturity/scorecard).

Для проверок характера и стиля запустите один и тот же сценарий на нескольких live model
refs и запишите оцененный Markdown-отчет:

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
должны задавать persona через `SOUL.md`, затем выполнять обычные пользовательские turns,
такие как чат, помощь с workspace и небольшие файловые задачи. Candidate model не следует
сообщать, что ее оценивают. Команда сохраняет каждый полный
transcript, записывает базовую статистику прогона, затем просит judge models в fast mode с
reasoning `xhigh`, где это поддерживается, ранжировать прогоны по естественности, вайбу и юмору.
Используйте `--blind-judge-models` при сравнении провайдеров: judge prompt по-прежнему получает
каждый transcript и статус прогона, но candidate refs заменяются нейтральными
метками, такими как `candidate-01`; отчет сопоставляет ранжирования с реальными refs после
парсинга.
Candidate runs по умолчанию используют thinking `high`, с `medium` для GPT-5.5 и `xhigh`
для более старых eval refs OpenAI, которые это поддерживают. Переопределите конкретного candidate inline с
`--model provider/model,thinking=<level>`. `--thinking <level>` по-прежнему задает
глобальный fallback, а старая форма `--model-thinking <provider/model=level>` сохраняется
для совместимости.
OpenAI candidate refs по умолчанию используют fast mode, чтобы priority processing применялся там, где
провайдер это поддерживает. Добавьте `,fast`, `,no-fast` или `,fast=false` inline, когда
одному candidate или judge нужно переопределение. Передавайте `--fast` только когда хотите
принудительно включить fast mode для каждой candidate model. Длительности candidate и judge
записываются в отчет для benchmark-анализа, но judge prompts явно говорят
не ранжировать по скорости.
Прогоны candidate и judge model оба по умолчанию используют concurrency 16. Уменьшайте
`--concurrency` или `--judge-concurrency`, когда лимиты провайдера или нагрузка локального gateway
делают прогон слишком шумным.
Когда candidate `--model` не передан, character eval по умолчанию использует
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` и
`google/gemini-3.1-pro-preview`, если `--model` не передан.
Когда `--judge-model` не передан, judges по умолчанию используют
`openai/gpt-5.5,thinking=xhigh,fast` и
`anthropic/claude-opus-4-8,thinking=high`.

## Связанная документация

- [Matrix QA](/ru/concepts/qa-matrix)
- [Maturity scorecard](/ru/maturity/scorecard)
- [Personal agent benchmark pack](/ru/concepts/personal-agent-benchmark-pack)
- [QA Channel](/ru/channels/qa-channel)
- [Testing](/ru/help/testing)
- [Dashboard](/ru/web/dashboard)
