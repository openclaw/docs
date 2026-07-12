---
read_when:
    - Вы хотите отправлять данные об использовании моделей OpenClaw, потоке сообщений или метрики сеансов в коллектор OpenTelemetry
    - Вы подключаете трассировки, метрики или журналы к Grafana, Datadog, Honeycomb, New Relic, Tempo или другой серверной системе OTLP
    - Для создания панелей мониторинга или оповещений вам необходимы точные имена метрик, имена спанов или структуры атрибутов
summary: Экспортируйте диагностические данные OpenClaw в коллекторы OpenTelemetry или в JSONL через стандартный вывод с помощью плагина diagnostics-otel
title: Экспорт OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T11:25:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw экспортирует диагностические данные через официальный Plugin `diagnostics-otel`,
используя **OTLP/HTTP (protobuf)**. Журналы также можно записывать в формате JSONL
в стандартный вывод для конвейеров обработки журналов контейнеров и песочниц.
Любой сборщик или серверная система, принимающие OTLP/HTTP, работают без изменений
кода. О локальных файловых журналах см. в разделе [Ведение журналов](/ru/logging).

- **Диагностические события** — это структурированные внутрипроцессные записи,
  создаваемые Gateway и встроенными плагинами для запусков моделей, потоков
  сообщений, сеансов, очередей и выполнения команд.
- **`diagnostics-otel`** подписывается на эти события и экспортирует их как
  **метрики**, **трассировки** и **журналы** OpenTelemetry по протоколу OTLP/HTTP,
  а также может дублировать записи журналов в формате JSONL в стандартный вывод.
- **Вызовы поставщиков** получают заголовок W3C `traceparent` из доверенного
  контекста интервала вызова модели OpenClaw, если транспорт поставщика допускает
  пользовательские заголовки. Контекст трассировки, созданный плагинами, не
  распространяется.
- Экспортеры подключаются только тогда, когда включены и диагностическая
  подсистема, и Plugin, поэтому по умолчанию внутрипроцессные накладные расходы
  остаются практически нулевыми.

## Быстрый старт

```bash
openclaw plugins install clawhub:@openclaw/diagnostics-otel
```

```json5
{
  plugins: {
    allow: ["diagnostics-otel"],
    entries: {
      "diagnostics-otel": { enabled: true },
    },
  },
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      protocol: "http/protobuf",
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: true,
      sampleRate: 0.2,
      flushIntervalMs: 60000,
    },
  },
}
```

Либо включите Plugin через CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` поддерживает только `http/protobuf`. Поскольку `traces` и `metrics` включены по умолчанию, любое другое значение (включая `grpc`) прерывает всю подписку diagnostics-otel с предупреждением `unsupported protocol` — при этом также прекращается экспорт журналов в стандартный вывод. Явно задайте `traces: false` и `metrics: false`, если вам нужен только `logsExporter: "stdout"` со значением протокола, отличным от OTLP.
</Note>

## Экспортируемые сигналы

| Сигнал      | Содержимое                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Счётчики и гистограммы использования токенов, стоимости, длительности запусков, переключения при сбое, использования Skills, потоков сообщений, событий Talk, полос очередей, состояния и восстановления сеансов, выполнения инструментов и команд, памяти, работоспособности и состояния экспортера. |
| **Трассировки**  | Интервалы использования и вызовов моделей, жизненного цикла среды выполнения, использования Skills, выполнения инструментов и команд, обработки Webhook и сообщений, сборки контекста и циклов инструментов.                                                      |
| **Журналы**    | Структурированные записи `logging.file`, экспортируемые через OTLP или в формате JSONL в стандартный вывод, когда включён параметр `diagnostics.otel.logs`; тела записей журнала не передаются, если сбор содержимого не включён явно.                          |

Параметры `traces`, `metrics` и `logs` можно переключать независимо. Трассировки
и метрики по умолчанию включены, когда `diagnostics.otel.enabled` имеет значение
`true`; журналы по умолчанию отключены и экспортируются только тогда, когда
`diagnostics.otel.logs` явно имеет значение `true`. По умолчанию журналы
экспортируются через OTLP; задайте для `diagnostics.otel.logsExporter` значение
`stdout`, чтобы выводить JSONL в стандартный вывод, или `both`, чтобы использовать
оба способа.

## Справочник по конфигурации

```json5
{
  diagnostics: {
    enabled: true,
    otel: {
      enabled: true,
      endpoint: "http://otel-collector:4318",
      tracesEndpoint: "http://otel-collector:4318/v1/traces",
      metricsEndpoint: "http://otel-collector:4318/v1/metrics",
      logsEndpoint: "http://otel-collector:4318/v1/logs",
      protocol: "http/protobuf", // grpc отключает экспорт OTLP
      serviceName: "openclaw-gateway", // если не задано, используется OTEL_SERVICE_NAME, затем "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // выборка корневых интервалов, 0.0..1.0
      flushIntervalMs: 60000, // интервал экспорта метрик (минимум 1000 мс)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
        toolDefinitions: false,
      },
    },
  },
}
```

### Переменные среды

| Переменная                                                                                                          | Назначение                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Резервное значение для `diagnostics.otel.endpoint`, если ключ конфигурации не задан.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Резервные конечные точки для отдельных сигналов, используемые, когда соответствующий ключ конфигурации `diagnostics.otel.*Endpoint` не задан. Конфигурация для конкретного сигнала имеет приоритет над переменной среды для этого сигнала, а та — над общей конечной точкой.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Резервное значение для `diagnostics.otel.serviceName`, если ключ конфигурации не задан. Имя службы по умолчанию — `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Резервное значение сетевого протокола, если `diagnostics.otel.protocol` не задан. Экспорт включается только при значении `http/protobuf`.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Задайте значение `gen_ai_latest_experimental`, чтобы использовать новейшую структуру интервалов логического вывода GenAI: имена интервалов `{gen_ai.operation.name} {gen_ai.request.model}`, тип интервала `CLIENT` и `gen_ai.provider.name` вместо устаревшего `gen_ai.system`. Метрики GenAI всегда используют ограниченный набор атрибутов с низкой кардинальностью. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Задайте значение `1`, если другой модуль предварительной загрузки или процесс хоста уже зарегистрировал глобальный SDK OpenTelemetry. В этом случае Plugin пропускает управление собственным жизненным циклом NodeSDK, но по-прежнему подключает диагностические обработчики и учитывает параметры `traces`/`metrics`/`logs`.                                                                                    |

## Конфиденциальность и сбор содержимого

Необработанное содержимое модели и инструментов по умолчанию **не**
экспортируется. Интервалы содержат ограниченный набор идентификаторов (канал,
поставщик, модель, категория ошибки, идентификаторы запросов только в виде хешей,
источник инструмента, владелец инструмента, имя и источник Skills) и никогда не
включают текст запроса, текст ответа, входные или выходные данные инструментов,
пути к файлам Skills или ключи сеансов. Значения, похожие на ключи сеансов
агентов с областью действия (например, начинающиеся с `agent:`), заменяются на
`unknown` в атрибутах с низкой кардинальностью. По умолчанию записи журналов OTLP
сохраняют уровень важности, регистратор, расположение в коде, доверенный контекст
трассировки и очищенные атрибуты; необработанное тело сообщения журнала
экспортируется только тогда, когда `diagnostics.otel.captureContent` имеет
логическое значение `true`. Отдельные вложенные ключи `captureContent.*` никогда
не включают тела журналов. Метрики Talk экспортируют только ограниченные
метаданные событий (режим, транспорт, поставщик и тип события) — без расшифровок,
звуковых данных, идентификаторов сеансов, реплик, вызовов и комнат, а также
токенов передачи управления.

Исходящие запросы к модели могут включать заголовок W3C `traceparent`, созданный
только из принадлежащего OpenClaw диагностического контекста трассировки активного
вызова модели. Существующие заголовки `traceparent`, переданные вызывающей
стороной, заменяются, поэтому плагины или пользовательские параметры поставщика
не могут подделать происхождение межсервисной трассировки.

Задавайте значение `true` для параметров `diagnostics.otel.captureContent.*`,
только если ваш сборщик и политика хранения одобрены для текста запросов,
ответов, данных инструментов или системных запросов. Каждый вложенный ключ
независим:

- `inputMessages` — содержимое пользовательского запроса.
- `outputMessages` — содержимое ответа модели.
- `toolInputs` — данные аргументов инструмента.
- `toolOutputs` — данные результата инструмента.
- `systemPrompt` — собранный системный запрос или запрос разработчика.
- `toolDefinitions` — имена, описания и схемы инструментов модели.

Когда включён любой вложенный ключ, интервалы модели и инструментов получают
ограниченные и отредактированные атрибуты `openclaw.content.*` только для
соответствующего класса.

<Note>
Логическое значение `captureContent: true` одновременно включает `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` и тела журналов OTLP, но **не** `systemPrompt` — явно задайте `captureContent.systemPrompt: true`, если вам также нужен собранный системный запрос.
</Note>

Содержимое `toolInputs`/`toolOutputs` собирается при выполнении инструментов во
встроенной среде выполнения агента (`openclaw.content.tool_input` и
`gen_ai.tool.call.arguments` в завершённых интервалах и интервалах с ошибками;
`openclaw.content.tool_output` и `gen_ai.tool.call.result` в завершённых
интервалах). Имена `openclaw.content.*` остаются стабильными именами атрибутов
OpenClaw; копии `gen_ai.tool.call.*` дублируют их для средств просмотра,
использующих семантические соглашения. Вызовы инструментов во внешних средах
выполнения (Codex, Claude CLI) создают интервалы `tool.execution.*` без полезной
нагрузки содержимого. Собранное содержимое передаётся по доверенному каналу,
доступному только обработчикам, и никогда не помещается в общедоступную шину
диагностических событий.

## Выборка и сброс данных

- **Трассировки:** `diagnostics.otel.sampleRate` задаёт `TraceIdRatioBasedSampler`
  только для корневого спана (`0.0` отбрасывает все, `1.0` сохраняет все). Если
  параметр не задан, используется значение по умолчанию из OpenTelemetry SDK
  (всегда включено).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (минимальное значение
  ограничено `1000`); если параметр не задан, используется стандартный интервал
  периодического экспорта SDK.
- **Журналы:** журналы OTLP учитывают `logging.level` (уровень файлового журнала)
  и используют механизм редактирования диагностических записей журнала, а не
  консольное форматирование. В установках с большим объёмом данных следует
  предпочитать выборку и фильтрацию в сборщике OTLP локальной выборке. Задайте
  `diagnostics.otel.logsExporter: "stdout"`, если ваша платформа уже отправляет
  stdout/stderr обработчику журналов и у вас нет сборщика журналов OTLP. Записи
  stdout представляют собой по одному объекту JSON на строку с полями `ts`,
  `signal`, `service.name`, уровнем серьёзности, телом, отредактированными
  атрибутами и доверенными полями трассировки, если они доступны.
- **Корреляция с файловыми журналами:** файловые журналы JSONL содержат поля
  верхнего уровня `traceId`, `spanId`, `parentSpanId` и `traceFlags`, когда вызов
  журналирования несёт допустимый контекст диагностической трассировки. Это
  позволяет обработчикам журналов связывать локальные строки журнала с
  экспортированными спанами.
- **Корреляция запросов:** HTTP-запросы Gateway и кадры WebSocket создают
  внутреннюю область трассировки запроса. Журналы и диагностические события
  внутри этой области по умолчанию наследуют трассировку запроса, а спаны
  выполнения агента и вызовов модели создаются как дочерние, поэтому заголовки
  провайдера `traceparent` остаются в той же трассировке.
- **Корреляция вызовов модели:** спаны `openclaw.model.call` по умолчанию
  содержат безопасные размеры компонентов промпта и атрибуты токенов для
  каждого вызова, если результат провайдера содержит сведения об использовании.
  `openclaw.model.usage` остаётся спаном учёта на уровне выполнения для
  агрегированной стоимости, контекста и панелей мониторинга каналов и остаётся
  в той же диагностической трассировке, если среда выполнения, создавшая его,
  имеет доверенный контекст трассировки.

## Экспортируемые метрики

### Использование модели

- `openclaw.tokens` (счётчик, атрибуты: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (счётчик, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гистограмма, атрибуты: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гистограмма, метрика семантических соглашений GenAI, атрибуты: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гистограмма, секунды, метрика семантических соглашений GenAI, атрибуты: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необязательный `error.type`)
- `openclaw.model_call.duration_ms` (гистограмма, атрибуты: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а также `openclaw.errorCategory` и `openclaw.failureKind` для классифицированных ошибок)
- `openclaw.model_call.request_bytes` (гистограмма, размер в байтах UTF-8 окончательной полезной нагрузки запроса к модели; без необработанного содержимого полезной нагрузки)
- `openclaw.model_call.response_bytes` (гистограмма, размер в байтах UTF-8 полезной нагрузки потоковых фрагментов ответа; для часто поступающих изменений текста, рассуждений и вызовов инструментов учитываются только добавочные байты `delta`; без необработанного содержимого ответа)
- `openclaw.model_call.time_to_first_byte_ms` (гистограмма, время до первого события потокового ответа)
- `openclaw.model.failover` (счётчик, атрибуты: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (счётчик, атрибуты: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, необязательный `openclaw.agent`, необязательный `openclaw.toolName`)

### Поток сообщений

- `openclaw.webhook.received` (счётчик, атрибуты: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (счётчик, атрибуты: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (счётчик, атрибуты: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (счётчик, атрибуты: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (счётчик, атрибуты: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (счётчик, атрибуты: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (счётчик, атрибуты: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (счётчик, атрибуты: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Разговор

- `openclaw.talk.event` (счётчик, атрибуты: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; создаётся, когда событие разговора сообщает длительность)
- `openclaw.talk.audio.bytes` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; создаётся для событий аудиокадров разговора, сообщающих длину в байтах)

### Очереди и сеансы

- `openclaw.queue.lane.enqueue` (счётчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (счётчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.depth` (гистограмма, атрибуты: `openclaw.lane` или `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гистограмма, атрибуты: `openclaw.lane`)
- `openclaw.session.state` (счётчик, атрибуты: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (счётчик, атрибуты: `openclaw.state`; создаётся при восстанавливаемом устаревшем состоянии учёта сеанса)
- `openclaw.session.stuck_age_ms` (гистограмма, атрибуты: `openclaw.state`; создаётся при восстанавливаемом устаревшем состоянии учёта сеанса)
- `openclaw.session.turn.created` (счётчик, атрибуты: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (счётчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (счётчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гистограмма, атрибуты: те же, что у соответствующего счётчика восстановления)
- `openclaw.run.attempt` (счётчик, атрибуты: `openclaw.attempt`)

### Телеметрия активности сеансов

`diagnostics.stuckSessionWarnMs` — это порог времени отсутствия прогресса для
диагностики активности сеанса. Возраст сеанса `processing` не приближается к
этому порогу, пока OpenClaw наблюдает прогресс ответа, инструмента, состояния,
блока или среды выполнения ACP. Сигналы поддержания индикатора набора текста не
считаются прогрессом, поэтому бездействующую модель или среду исполнения всё
равно можно обнаружить.

OpenClaw классифицирует сеансы по работе, которую ещё можно наблюдать:

- `session.long_running`: активная встроенная работа, вызовы модели или вызовы
  инструментов продолжают выполняться. Принадлежащие сеансу вызовы модели,
  которые остаются без вывода дольше `diagnostics.stuckSessionWarnMs`, также
  считаются длительными до достижения `diagnostics.stuckSessionAbortMs`, чтобы
  медленные или непотоковые провайдеры моделей не выглядели как зависшие сеансы
  Gateway, пока остаётся возможность наблюдать за прерыванием.
- `session.stalled`: активная работа существует, но активное выполнение давно
  не сообщало о прогрессе. Принадлежащие сеансу вызовы модели переключаются из
  `session.long_running` в `session.stalled` при достижении
  `diagnostics.stuckSessionAbortMs` или позднее; устаревшая активность модели
  или инструмента без владельца не считается безвредной длительной работой.
  Зависшие встроенные выполнения сначала только наблюдаются, а затем, если
  после `diagnostics.stuckSessionAbortMs` прогресс отсутствует, прерываются с
  ожиданием завершения, чтобы стоящие за ними в полосе очереди ходы могли
  продолжиться. Если параметр не задан, порог прерывания по умолчанию равен
  более безопасному расширенному интервалу: не менее 5 минут и трёх значений
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: устаревшее состояние учёта сеанса без активной работы либо
  бездействующий сеанс в очереди с устаревшей активностью модели или инструмента
  без владельца. После прохождения условий восстановления затронутая полоса
  сеанса освобождается немедленно.

При восстановлении создаются структурированные события
`session.recovery.requested` и `session.recovery.completed`. Диагностическое
состояние сеанса помечается как бездействующее только после изменяющего
состояние результата восстановления (`aborted` или `released`) и только если
то же поколение обработки всё ещё актуально.

Только `session.stuck` создаёт счётчик `openclaw.session.stuck`, гистограмму
`openclaw.session.stuck_age_ms` и спан `openclaw.session.stuck`. Повторные
диагностические события `session.stuck` создаются с увеличивающимся интервалом,
пока сеанс остаётся неизменным, поэтому панели мониторинга должны оповещать об
устойчивом росте, а не о каждом такте Heartbeat. Параметр конфигурации и значения
по умолчанию описаны в [справочнике по конфигурации](/ru/gateway/configuration-reference#diagnostics).

Предупреждения об активности также создают:

- `openclaw.liveness.warning` (счётчик, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гистограмма, атрибуты: `openclaw.liveness.reason`)

### Жизненный цикл среды исполнения

- `openclaw.harness.duration_ms` (гистограмма, атрибуты: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` при ошибках)

### Выполнение инструментов и обнаружение циклов

- `openclaw.tool.execution.duration_ms` (гистограмма, атрибуты: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, а также `openclaw.errorCategory` при ошибках)
- `openclaw.tool.execution.blocked` (счётчик, атрибуты: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (счётчик, атрибуты: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, необязательный `openclaw.loop.paired_tool`; создаётся при обнаружении повторяющегося цикла вызовов инструментов)

### Exec

- `openclaw.exec.duration_ms` (гистограмма, атрибуты: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутренние механизмы диагностики (память, полезные нагрузки, состояние экспортёра)

- `openclaw.payload.large` (счётчик, атрибуты: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (гистограмма, атрибуты: те же, что у `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (гистограммы без атрибутов; образцы использования памяти процессом)
- `openclaw.memory.pressure` (счётчик, атрибуты: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (счётчик, атрибуты: `openclaw.diagnostic.async_queue.drop_class`; потери из-за противодавления во внутренней диагностической очереди)
- `openclaw.telemetry.exporter.events` (счётчик, атрибуты: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, необязательный `openclaw.reason`, необязательный `openclaw.errorCategory`; внутренняя телеметрия жизненного цикла и сбоев экспортёра)

## Экспортируемые спаны

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (ввод/вывод/чтение кэша/запись в кэш/всего)
  - `gen_ai.system` по умолчанию или `gen_ai.provider.name`, если включены новейшие семантические соглашения GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` по умолчанию или `gen_ai.provider.name`, если включены новейшие семантические соглашения GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` и необязательный `openclaw.failureKind` при ошибках
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (только безопасные размеры компонентов, без текста запроса)
  - `openclaw.model_call.usage.*` и `gen_ai.usage.*`, когда результат вызова модели содержит данные об использовании от провайдера для данного отдельного вызова
  - Событие диапазона `openclaw.provider.request` с атрибутом `openclaw.upstreamRequestIdHash` (ограниченным по размеру, на основе хеша), когда результат вышестоящего провайдера содержит идентификатор запроса; необработанные идентификаторы никогда не экспортируются
  - При `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` диапазоны вызовов модели используют новейшее имя диапазона вывода GenAI `{gen_ai.operation.name} {gen_ai.request.model}` и вид диапазона `CLIENT` вместо `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - При завершении: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - При ошибке: `openclaw.harness.phase`, `openclaw.errorCategory`, необязательный `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, необязательные `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Необязательные `openclaw.errorCategory`/`openclaw.errorCode` при ошибках, `openclaw.deniedReason` и `openclaw.outcome=blocked` при отклонении политикой или песочницей
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без содержимого запроса, истории, ответа или ключа сеанса)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, необязательный `openclaw.loop.paired_tool` (без сообщений цикла, параметров или вывода инструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, необязательные `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Когда захват содержимого явно включён, диапазоны модели и инструментов также могут
включать ограниченные по размеру, отредактированные атрибуты `openclaw.content.*`
для конкретных классов содержимого, которые вы выбрали.

## Каталог диагностических событий

Приведённые ниже события обеспечивают работу указанных выше метрик и диапазонов. Plugins также могут
подписываться на них напрямую без экспорта OTLP.

**Использование модели**

- `model.usage` — токены, стоимость, длительность, контекст, провайдер/модель/канал,
  идентификаторы сеансов. `usage` — учёт на стороне провайдера/хода для расчёта стоимости и телеметрии;
  `context.used` — текущий снимок запроса/контекста, который может быть меньше,
  чем `usage.total` провайдера, если задействованы кэшированный ввод или вызовы в цикле инструментов.

**Поток сообщений**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Очередь и сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (сводные счётчики: вебхуки/очередь/сеанс)

**Жизненный цикл среды выполнения**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  жизненный цикл каждого запуска среды выполнения агента. Включает `harnessId`, необязательный
  `pluginId`, провайдера/модель/канал и идентификатор запуска. При завершении добавляются
  `durationMs`, `outcome`, необязательные `resultClassification`, `yieldDetected`
  и счётчики `itemLifecycle`. При ошибках добавляются `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` и
  необязательный `cleanupFailed`.

**Выполнение команд**

- `exec.process.completed` — конечный результат, длительность, целевой объект, режим, код
  завершения и тип сбоя. Текст команды и рабочие каталоги не
  включаются.
- `exec.approval.followup_suppressed` — устаревшее последующее действие после одобрения отброшено
  после перепривязки сеанса. Включает `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` или `gateway_preflight`)
  и временную метку диспетчера. Ключи сеансов, маршруты и текст команды
  не включаются.

## Без экспортёра

Сохраняйте диагностические события доступными для Plugins или пользовательских приёмников без запуска
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для целевого отладочного вывода без повышения `logging.level` используйте диагностические
флаги. Флаги нечувствительны к регистру и поддерживают подстановочные знаки (`telegram.*` или
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Или как разовое переопределение через переменную окружения:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вывод флагов направляется в стандартный файл журнала (`logging.file`) и по-прежнему
редактируется с помощью `logging.redactSensitive`. Полное руководство:
[Диагностические флаги](/ru/diagnostics/flags).

## Отключение

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Либо исключите `diagnostics-otel` из `plugins.allow`, либо выполните
`openclaw plugins disable diagnostics-otel`.

## Связанные материалы

- [Ведение журналов](/ru/logging) — файловые журналы, вывод в консоль, просмотр через CLI и вкладка журналов в интерфейсе управления
- [Внутреннее устройство журналирования Gateway](/ru/gateway/logging) — стили журналов WS, префиксы подсистем и захват консоли
- [Диагностические флаги](/ru/diagnostics/flags) — флаги для целевого отладочного журналирования
- [Экспорт диагностики](/ru/gateway/diagnostics) — инструмент создания пакета поддержки для оператора (отдельно от экспорта OTEL)
- [Справочник по конфигурации](/ru/gateway/configuration-reference#diagnostics) — полный справочник по полям `diagnostics.*`
