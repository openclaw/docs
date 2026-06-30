---
read_when:
    - Вы хотите отправлять метрики использования моделей OpenClaw, потока сообщений или сеансов в коллектор OpenTelemetry
    - Вы подключаете трассировки, метрики или журналы к Grafana, Datadog, Honeycomb, New Relic, Tempo или другому backend OTLP
    - Вам нужны точные названия метрик, названия span или формы атрибутов для создания панелей мониторинга или оповещений
summary: Экспортируйте диагностические данные OpenClaw в коллекторы OpenTelemetry или stdout JSONL через Plugin diagnostics-otel
title: Экспорт OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:18:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw экспортирует диагностику через официальный Plugin `diagnostics-otel`
с использованием **OTLP/HTTP (protobuf)**. Логи также могут записываться как stdout JSONL для
контейнерных и sandbox-конвейеров логов. Любой коллектор или бэкенд, принимающий
OTLP/HTTP, работает без изменений кода. О локальных файловых логах и о том, как их читать,
см. [Ведение логов](/ru/logging).

## Как это устроено

- **События диагностики** — это структурированные внутрипроцессные записи, создаваемые
  Gateway и встроенными plugins для запусков моделей, потока сообщений, сессий, очередей
  и exec.
- **Plugin `diagnostics-otel`** подписывается на эти события и экспортирует их как
  OpenTelemetry **метрики**, **трейсы** и **логи** через OTLP/HTTP. Он также может
  зеркалировать диагностические записи логов в stdout JSONL.
- **Вызовы провайдеров** получают заголовок W3C `traceparent` из доверенного контекста
  span вызова модели OpenClaw, когда транспорт провайдера принимает пользовательские
  заголовки. Контекст трейса, созданный plugin, не распространяется.
- Экспортеры подключаются только когда включены и поверхность диагностики, и plugin,
  поэтому внутрипроцессные издержки по умолчанию остаются близкими к нулю.

## Быстрый старт

Для пакетных установок сначала установите plugin:

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

Вы также можете включить plugin из CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` сейчас поддерживает только `http/protobuf`. `grpc` игнорируется.
</Note>

## Экспортируемые сигналы

| Сигнал      | Что в него входит                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Счетчики и гистограммы для использования токенов, стоимости, длительности запусков, failover, использования skill, потока сообщений, событий Talk, дорожек очередей, состояния/восстановления сессий, выполнения инструментов, слишком больших полезных нагрузок, exec и давления памяти. |
| **Трейсы**  | Spans для использования моделей, вызовов моделей, жизненного цикла harness, использования skill, выполнения инструментов, exec, обработки webhook/сообщений, сборки контекста и циклов инструментов.                                                            |
| **Логи**    | Структурированные записи `logging.file`, экспортируемые через OTLP или stdout JSONL, когда включено `diagnostics.otel.logs`; тела логов скрываются, если захват содержимого явно не включен.                                |

Переключайте `traces`, `metrics` и `logs` независимо. Трейсы и метрики
по умолчанию включены, когда `diagnostics.otel.enabled` равно true. Логи по умолчанию выключены и
экспортируются только когда `diagnostics.otel.logs` явно равно `true`. Экспорт логов
по умолчанию использует OTLP; задайте `diagnostics.otel.logsExporter` как `stdout` для JSONL в
stdout или `both`, чтобы отправлять каждую диагностическую запись лога и в OTLP, и в stdout.

## Справочник конфигурации

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
      protocol: "http/protobuf", // grpc is ignored
      serviceName: "openclaw-gateway",
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
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

### Переменные окружения

| Переменная                                                                                                          | Назначение                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Переопределяет `diagnostics.otel.endpoint`. Если значение уже содержит `/v1/traces`, `/v1/metrics` или `/v1/logs`, оно используется как есть.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Переопределения endpoint для конкретных сигналов, используемые, когда соответствующий ключ конфигурации `diagnostics.otel.*Endpoint` не задан. Конфигурация для конкретного сигнала имеет приоритет над env для конкретного сигнала, а она имеет приоритет над общим endpoint.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Переопределяет `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Переопределяет проводной протокол (сегодня учитывается только `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установите в `gen_ai_latest_experimental`, чтобы выдавать новейшую экспериментальную форму span GenAI inference, включая имена span `{gen_ai.operation.name} {gen_ai.request.model}`, вид span `CLIENT` и `gen_ai.provider.name` вместо устаревшего `gen_ai.system`. Метрики GenAI всегда используют ограниченные семантические атрибуты с низкой кардинальностью независимо от этого. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установите в `1`, когда другой preload или хост-процесс уже зарегистрировал глобальный OpenTelemetry SDK. Тогда plugin пропускает собственный жизненный цикл NodeSDK, но все равно подключает слушатели диагностики и учитывает `traces`/`metrics`/`logs`.                                                                                                                    |

## Конфиденциальность и захват содержимого

Сырые данные модели/инструментов по умолчанию **не** экспортируются. Spans несут ограниченные
идентификаторы (канал, провайдер, модель, категория ошибки, request ids только в виде хеша,
источник инструмента, владелец инструмента и имя/источник skill) и никогда не включают текст prompt,
текст ответа, входные данные инструментов, выходные данные инструментов, пути к файлам skill или ключи сессий.
Записи логов OTLP по умолчанию сохраняют серьезность, логгер, расположение в коде, доверенный контекст трейса
и очищенные атрибуты, но сырое тело сообщения лога экспортируется
только когда `diagnostics.otel.captureContent` задано как boolean `true`. Гранулярные
подключи `captureContent.*` не включают тела логов. Метки, похожие на
scoped ключи сессий агентов, заменяются на `unknown`.
Метрики Talk экспортируют только ограниченные метаданные событий, такие как режим, транспорт,
провайдер и тип события. Они не включают транскрипты, аудиополезные нагрузки,
session ids, turn ids, call ids, room ids или handoff tokens.

Исходящие запросы к моделям могут включать заголовок W3C `traceparent`. Этот заголовок
создается только из диагностического контекста трейса, принадлежащего OpenClaw, для активного вызова модели.
Существующие заголовки `traceparent`, переданные вызывающей стороной, заменяются, поэтому plugins или
пользовательские параметры провайдера не могут подделать межсервисное происхождение трейса.

Устанавливайте `diagnostics.otel.captureContent.*` в `true` только когда ваш коллектор и
политика хранения одобрены для текста prompt, ответа, инструмента или system-prompt.
Каждый подключ включается независимо:

- `inputMessages` - содержимое prompt пользователя.
- `outputMessages` - содержимое ответа модели.
- `toolInputs` - payloads аргументов инструмента.
- `toolOutputs` - payloads результатов инструмента.
- `systemPrompt` - собранный system/developer prompt.
- `toolDefinitions` - имена, описания и схемы инструментов модели.

Когда включен любой подключ, spans модели и инструмента получают ограниченные, отредактированные
атрибуты `openclaw.content.*` только для этого класса. Используйте boolean
`captureContent: true` только для широких диагностических захватов, где тела сообщений логов OTLP
также одобрены для экспорта.

Содержимое `toolInputs`/`toolOutputs` захватывается для выполнений инструментов встроенного agent runtime
(`openclaw.content.tool_input` на spans завершения/ошибки,
`openclaw.content.tool_output` на завершенных spans). Вызовы инструментов внешнего harness
(Codex, Claude CLI) создают spans `tool.execution.*` без payloads содержимого.
Захваченное содержимое передается по доверенному каналу только для слушателей и никогда не помещается
в публичную шину диагностических событий.

## Sampling и flushing

- **Трассировки:** `diagnostics.otel.sampleRate` (только корневой span, `0.0` отбрасывает все,
  `1.0` сохраняет все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (минимум `1000`).
- **Логи:** логи OTLP учитывают `logging.level` (уровень файлового лога). Они используют
  путь редактирования диагностических записей лога, а не форматирование консоли. Установкам
  с большим объемом данных следует предпочитать выборку/фильтрацию в коллекторе OTLP
  вместо локальной выборки. Задайте `diagnostics.otel.logsExporter: "stdout"`, когда ваша платформа уже
  отправляет stdout/stderr в обработчик логов и у вас нет коллектора логов OTLP.
  Записи stdout представляют собой по одному объекту JSON на строку с `ts`, `signal`,
  `service.name`, уровнем важности, телом, отредактированными атрибутами и доверенными полями трассировки,
  когда они доступны.
- **Корреляция файловых логов:** файловые логи JSONL включают верхнеуровневые `traceId`,
  `spanId`, `parentSpanId` и `traceFlags`, когда вызов логирования несет действительный
  диагностический контекст трассировки, что позволяет обработчикам логов связывать локальные строки логов с
  экспортированными spans.
- **Корреляция запросов:** HTTP-запросы Gateway и кадры WebSocket создают
  внутреннюю область трассировки запроса. Логи и диагностические события внутри этой области
  по умолчанию наследуют трассировку запроса, а spans запусков агента и вызовов модели
  создаются как дочерние, чтобы заголовки `traceparent` провайдера оставались в той же трассировке.
- **Корреляция вызовов модели:** spans `openclaw.model.call` по умолчанию включают безопасные размеры
  компонентов prompt и включают атрибуты токенов для каждого вызова, когда результат
  провайдера предоставляет данные об использовании. `openclaw.model.usage` остается span уровня запуска
  для учета совокупной стоимости, контекста и панелей каналов; он остается
  в той же диагностической трассировке, когда испускающая среда выполнения имеет доверенный контекст
  трассировки.

## Экспортируемые метрики

### Использование модели

- `openclaw.tokens` (счетчик, атрибуты: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (счетчик, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гистограмма, атрибуты: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гистограмма, метрика семантических соглашений GenAI, атрибуты: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гистограмма, секунды, метрика семантических соглашений GenAI, атрибуты: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необязательный `error.type`)
- `openclaw.model_call.duration_ms` (гистограмма, атрибуты: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, плюс `openclaw.errorCategory` и `openclaw.failureKind` для классифицированных ошибок)
- `openclaw.model_call.request_bytes` (гистограмма, размер в байтах UTF-8 итоговой полезной нагрузки запроса к модели; без сырого содержимого полезной нагрузки)
- `openclaw.model_call.response_bytes` (гистограмма, размер в байтах UTF-8 полезных нагрузок фрагментов потокового ответа; высокочастотные дельты текста, размышлений и вызовов инструментов учитывают только добавочные байты `delta`; без сырого содержимого ответа)
- `openclaw.model_call.time_to_first_byte_ms` (гистограмма, прошедшее время до первого события потокового ответа)
- `openclaw.model.failover` (счетчик, атрибуты: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (счетчик, атрибуты: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, необязательный `openclaw.agent`, необязательный `openclaw.toolName`)

### Поток сообщений

- `openclaw.webhook.received` (счетчик, атрибуты: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (счетчик, атрибуты: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (счетчик, атрибуты: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (счетчик, атрибуты: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (счетчик, атрибуты: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (счетчик, атрибуты: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (счетчик, атрибуты: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (счетчик, атрибуты: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Разговор

- `openclaw.talk.event` (счетчик, атрибуты: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; испускается, когда событие Разговора сообщает длительность)
- `openclaw.talk.audio.bytes` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; испускается для событий аудиокадров Разговора, которые сообщают длину в байтах)

### Очереди и сеансы

- `openclaw.queue.lane.enqueue` (счетчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (счетчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.depth` (гистограмма, атрибуты: `openclaw.lane` или `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гистограмма, атрибуты: `openclaw.lane`)
- `openclaw.session.state` (счетчик, атрибуты: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (счетчик, атрибуты: `openclaw.state`; испускается для восстанавливаемого устаревшего учета сеанса)
- `openclaw.session.stuck_age_ms` (гистограмма, атрибуты: `openclaw.state`; испускается для восстанавливаемого устаревшего учета сеанса)
- `openclaw.session.turn.created` (счетчик, атрибуты: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (счетчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (счетчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гистограмма, атрибуты: те же, что у соответствующего счетчика восстановления)
- `openclaw.run.attempt` (счетчик, атрибуты: `openclaw.attempt`)

### Телеметрия активности сеанса

`diagnostics.stuckSessionWarnMs` — это порог возраста без прогресса для диагностики
активности сеанса. Сеанс `processing` не приближается к этому порогу,
пока OpenClaw наблюдает прогресс ответа, инструмента, статуса, блока или среды выполнения ACP.
Keepalive-сообщения о наборе текста не считаются прогрессом, поэтому молчащую модель или harness
все равно можно обнаружить.

OpenClaw классифицирует сеансы по работе, которую он все еще может наблюдать:

- `session.long_running`: активная встроенная работа, вызовы модели или вызовы инструментов
  все еще продвигаются. Собственные вызовы модели, которые молчат дольше
  `diagnostics.stuckSessionWarnMs`, также сообщаются как длительные перед
  `diagnostics.stuckSessionAbortMs`, чтобы медленные или непотоковые провайдеры моделей
  не выглядели как зависшие сеансы Gateway, пока они остаются наблюдаемыми для прерывания.
- `session.stalled`: активная работа существует, но активный запуск не сообщал
  недавнего прогресса. Собственные вызовы модели переключаются с `session.long_running` на
  `session.stalled` в момент или после `diagnostics.stuckSessionAbortMs`; бесхозная
  устаревшая активность модели/инструмента не считается безвредной длительной работой.
  Зависшие встроенные запуски сначала остаются только наблюдаемыми, затем выполняют прерывание и очистку после
  `diagnostics.stuckSessionAbortMs` без прогресса, чтобы поставленные в очередь ходы за этим
  lane могли возобновиться. Если значение не задано, порог прерывания по умолчанию использует более безопасное
  расширенное окно не менее 5 минут и 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: устаревший учет сеанса без активной работы или бездействующий
  сеанс в очереди с устаревшей бесхозной активностью модели/инструмента. Это освобождает
  затронутый lane сеанса сразу после прохождения ограничителей восстановления.

Восстановление испускает структурированные события `session.recovery.requested` и
`session.recovery.completed`. Диагностическое состояние сеанса помечается как бездействующее
только после изменяющего результата восстановления (`aborted` или `released`) и только если
то же поколение обработки все еще актуально.

Только `session.stuck` испускает счетчик `openclaw.session.stuck`,
гистограмму `openclaw.session.stuck_age_ms` и span `openclaw.session.stuck`.
Повторяющиеся диагностики `session.stuck` используют задержку, пока сеанс остается
неизменным, поэтому панели должны оповещать об устойчивом росте, а не о каждом
тике Heartbeat. Параметр конфигурации и значения по умолчанию см. в
[справочнике по конфигурации](/ru/gateway/configuration-reference#diagnostics).

Предупреждения активности также испускают:

- `openclaw.liveness.warning` (счетчик, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гистограмма, атрибуты: `openclaw.liveness.reason`)

### Жизненный цикл harness

- `openclaw.harness.duration_ms` (гистограмма, атрибуты: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` для ошибок)

### Выполнение инструментов

- `openclaw.tool.execution.duration_ms` (гистограмма, атрибуты: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, плюс `openclaw.errorCategory` для ошибок)
- `openclaw.tool.execution.blocked` (счетчик, атрибуты: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (гистограмма, атрибуты: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутренние компоненты диагностики (память и цикл инструментов)

- `openclaw.payload.large` (счетчик, атрибуты: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (гистограмма, атрибуты: те же, что у `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (гистограмма, атрибуты: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гистограмма)
- `openclaw.memory.pressure` (счетчик, атрибуты: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (счетчик, атрибуты: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гистограмма, атрибуты: `openclaw.toolName`, `openclaw.outcome`)

## Экспортируемые spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` по умолчанию или `gen_ai.provider.name`, когда включены новейшие семантические соглашения GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` по умолчанию или `gen_ai.provider.name`, когда включены новейшие семантические соглашения GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` и необязательный `openclaw.failureKind` при ошибках
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (только безопасные размеры компонентов, без текста запроса)
  - `openclaw.model_call.usage.*` и `gen_ai.usage.*`, когда результат вызова модели содержит данные об использовании от провайдера для этого отдельного вызова
  - `openclaw.provider.request_id_hash` (ограниченный хеш на основе SHA идентификатора запроса вышестоящего провайдера; исходные идентификаторы не экспортируются)
  - С `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` спаны вызовов модели используют новейшее имя спана вывода GenAI `{gen_ai.operation.name} {gen_ai.request.model}` и тип спана `CLIENT` вместо `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - При завершении: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - При ошибке: `openclaw.harness.phase`, `openclaw.errorCategory`, необязательный `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без содержимого запроса, истории, ответа или ключа сессии)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без сообщений цикла, параметров или вывода инструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Когда захват содержимого явно включен, спаны модели и инструмента также могут
включать ограниченные, отредактированные атрибуты `openclaw.content.*` для конкретных
классов содержимого, на которые вы подписались.

## Каталог диагностических событий

События ниже лежат в основе указанных выше метрик и спанов. Plugins также могут подписываться
на них напрямую без экспорта OTLP.

**Использование модели**

- `model.usage` - токены, стоимость, длительность, контекст, провайдер/модель/канал,
  идентификаторы сессий. `usage` — это учет провайдера/хода для стоимости и телеметрии;
  `context.used` — текущий снимок запроса/контекста и может быть ниже, чем
  `usage.total` провайдера, когда задействованы кешированный ввод или вызовы цикла инструментов.

**Поток сообщений**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Очередь и сессия**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агрегированные счетчики: Webhook/очередь/сессия)

**Жизненный цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  жизненный цикл каждого запуска для harness агента. Включает `harnessId`, необязательный
  `pluginId`, провайдер/модель/канал и идентификатор запуска. Завершение добавляет
  `durationMs`, `outcome`, необязательные `resultClassification`, `yieldDetected`
  и счетчики `itemLifecycle`. Ошибки добавляют `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` и
  необязательный `cleanupFailed`.

**Exec**

- `exec.process.completed` - терминальный результат, длительность, цель, режим, код выхода
  и тип сбоя. Текст команды и рабочие каталоги не
  включаются.

## Без экспортера

Вы можете оставить диагностические события доступными для Plugins или пользовательских приемников без
запуска `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для целевого отладочного вывода без повышения `logging.level` используйте диагностические
флаги. Флаги не чувствительны к регистру и поддерживают подстановочные символы (например, `telegram.*` или
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Или как одноразовое переопределение через env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вывод флагов идет в стандартный файл журнала (`logging.file`) и все равно
редактируется `logging.redactSensitive`. Полное руководство:
[Диагностические флаги](/ru/diagnostics/flags).

## Отключение

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Вы также можете не включать `diagnostics-otel` в `plugins.allow` или выполнить
`openclaw plugins disable diagnostics-otel`.

## См. также

- [Журналирование](/ru/logging) - файловые журналы, вывод в консоль, отслеживание через CLI и вкладка журналов в Control UI
- [Внутреннее устройство журналирования Gateway](/ru/gateway/logging) - стили журналов WS, префиксы подсистем и захват консоли
- [Диагностические флаги](/ru/diagnostics/flags) - целевые флаги отладочного журнала
- [Экспорт диагностики](/ru/gateway/diagnostics) - инструмент support-bundle оператора (отдельно от экспорта OTEL)
- [Справочник по конфигурации](/ru/gateway/configuration-reference#diagnostics) - полный справочник полей `diagnostics.*`
