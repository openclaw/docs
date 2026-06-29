---
read_when:
    - Вы хотите отправлять метрики использования моделей OpenClaw, потока сообщений или сеансов в коллектор OpenTelemetry
    - Вы подключаете трассировки, метрики или журналы к Grafana, Datadog, Honeycomb, New Relic, Tempo или другому бэкенду OTLP
    - Вам нужны точные названия метрик, имена спанов или формы атрибутов, чтобы создавать панели мониторинга или оповещения.
summary: Экспорт диагностики OpenClaw в коллекторы OpenTelemetry или stdout JSONL через Plugin diagnostics-otel
title: Экспорт OpenTelemetry
x-i18n:
    generated_at: "2026-06-28T22:59:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw экспортирует диагностические данные через официальный плагин `diagnostics-otel`
с использованием **OTLP/HTTP (protobuf)**. Журналы также можно записывать как stdout JSONL для
конвейеров журналов контейнеров и песочниц. Любой коллектор или backend, принимающий
OTLP/HTTP, работает без изменений кода. О локальных файловых журналах и о том, как их читать,
см. [Журналирование](/ru/logging).

## Как это устроено

- **Диагностические события** — это структурированные внутрипроцессные записи, которые
  Gateway и встроенные плагины создают для запусков моделей, потока сообщений, сессий, очередей
  и exec.
- **Плагин `diagnostics-otel`** подписывается на эти события и экспортирует их как
  OpenTelemetry **метрики**, **трассировки** и **журналы** через OTLP/HTTP. Он также может
  дублировать диагностические журнальные записи в stdout JSONL.
- **Вызовы провайдера** получают заголовок W3C `traceparent` из доверенного контекста span
  вызова модели OpenClaw, когда транспорт провайдера принимает пользовательские заголовки.
  Контекст трассировки, созданный плагином, не распространяется.
- Экспортеры подключаются только когда включены и диагностическая поверхность, и плагин,
  поэтому внутрипроцессные затраты по умолчанию остаются почти нулевыми.

## Быстрый старт

Для пакетных установок сначала установите плагин:

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

Вы также можете включить плагин из CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` сейчас поддерживает только `http/protobuf`. `grpc` игнорируется.
</Note>

## Экспортируемые сигналы

| Сигнал      | Что в него входит                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Счетчики и гистограммы для использования токенов, стоимости, длительности запусков, failover, использования Skills, потока сообщений, событий Talk, полос очередей, состояния/восстановления сессий, выполнения инструментов, слишком больших полезных нагрузок, exec и давления на память. |
| **Трассировки**  | Spans для использования моделей, вызовов моделей, жизненного цикла harness, использования Skills, выполнения инструментов, exec, обработки webhook/сообщений, сборки контекста и циклов инструментов.                                                            |
| **Журналы**    | Структурированные записи `logging.file`, экспортируемые через OTLP или stdout JSONL, когда включено `diagnostics.otel.logs`; тела журналов не передаются, если захват содержимого не включен явно.                                |

Переключайте `traces`, `metrics` и `logs` независимо. Трассировки и метрики
по умолчанию включены, когда `diagnostics.otel.enabled` равно true. Журналы по умолчанию
выключены и экспортируются только когда `diagnostics.otel.logs` явно задано как `true`. Экспорт журналов
по умолчанию использует OTLP; задайте `diagnostics.otel.logsExporter` как `stdout` для JSONL в
stdout или `both`, чтобы отправлять каждую диагностическую журнальную запись в OTLP и stdout.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Переопределения endpoint для конкретных сигналов, используемые, когда соответствующий ключ конфигурации `diagnostics.otel.*Endpoint` не задан. Конфигурация для конкретного сигнала имеет приоритет над переменной окружения для конкретного сигнала, а та имеет приоритет над общим endpoint.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Переопределяет `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Переопределяет wire protocol (сейчас учитывается только `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Задайте `gen_ai_latest_experimental`, чтобы создавать новейшую экспериментальную форму span вывода GenAI, включая имена span `{gen_ai.operation.name} {gen_ai.request.model}`, вид span `CLIENT` и `gen_ai.provider.name` вместо устаревшего `gen_ai.system`. Метрики GenAI всегда используют ограниченные семантические атрибуты с низкой кардинальностью. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Задайте `1`, когда другой preload или процесс-хост уже зарегистрировал глобальный OpenTelemetry SDK. В этом случае плагин пропускает собственный жизненный цикл NodeSDK, но все равно подключает диагностических слушателей и учитывает `traces`/`metrics`/`logs`.                                                                                                                    |

## Конфиденциальность и захват содержимого

Необработанное содержимое модели/инструмента **не** экспортируется по умолчанию. Spans несут ограниченные
идентификаторы (канал, провайдер, модель, категория ошибки, идентификаторы запросов только в виде хеша,
источник инструмента, владелец инструмента и имя/источник Skills) и никогда не включают текст prompt,
текст ответа, входные данные инструментов, выходные данные инструментов, пути к файлам Skills или ключи сессий.
Журнальные записи OTLP по умолчанию сохраняют severity, logger, расположение в коде, доверенный контекст трассировки
и санитизированные атрибуты, но необработанное тело журнального сообщения экспортируется
только когда `diagnostics.otel.captureContent` задано как булево `true`. Детальные
подключи `captureContent.*` не включают тела журналов. Метки, похожие на
scoped ключи сессий агентов, заменяются на `unknown`.
Метрики Talk экспортируют только ограниченные метаданные событий, такие как режим, транспорт,
провайдер и тип события. Они не включают расшифровки, аудио-полезные нагрузки,
идентификаторы сессий, turn ids, call ids, room ids или токены handoff.

Исходящие запросы модели могут включать заголовок W3C `traceparent`. Этот заголовок
создается только из принадлежащего OpenClaw диагностического контекста трассировки для активного вызова модели.
Существующие предоставленные вызывающей стороной заголовки `traceparent` заменяются, поэтому плагины или
пользовательские параметры провайдера не могут подделать происхождение трассировки между сервисами.

Задавайте `diagnostics.otel.captureContent.*` как `true` только когда ваш коллектор и
политика хранения одобрены для текста prompt, ответа, инструмента или системного prompt.
Каждый подключ включается независимо:

- `inputMessages` - содержимое пользовательского prompt.
- `outputMessages` - содержимое ответа модели.
- `toolInputs` - полезные нагрузки аргументов инструмента.
- `toolOutputs` - полезные нагрузки результатов инструмента.
- `systemPrompt` - собранный системный/разработческий prompt.
- `toolDefinitions` - имена, описания и схемы инструментов модели.

Когда включен любой подключ, spans модели и инструмента получают ограниченные, отредактированные
атрибуты `openclaw.content.*` только для этого класса. Используйте булево
`captureContent: true` только для широких диагностических захватов, где тела
сообщений журналов OTLP также одобрены для экспорта.

Содержимое `toolInputs`/`toolOutputs` захватывается для выполнений инструментов встроенного агентского runtime
(`openclaw.content.tool_input` на завершенных/error spans,
`openclaw.content.tool_output` на завершенных spans). Вызовы инструментов внешних harness
(Codex, Claude CLI) создают spans `tool.execution.*` без полезных нагрузок содержимого.
Захваченное содержимое передается по доверенному каналу только для слушателей и никогда не помещается
в публичную шину диагностических событий.

## Сэмплирование и сброс

- **Трассировки:** `diagnostics.otel.sampleRate` (только root-span, `0.0` отбрасывает все,
  `1.0` сохраняет все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (минимум `1000`).
- **Журналы:** журналы OTLP учитывают `logging.level` (уровень файлового журнала). Они используют
  путь редактирования диагностических журнальных записей, а не форматирование консоли. Установкам с большим объемом
  следует предпочитать сэмплирование/фильтрацию в OTLP-коллекторе вместо локального сэмплирования.
  Задайте `diagnostics.otel.logsExporter: "stdout"`, когда ваша платформа уже
  отправляет stdout/stderr в обработчик журналов и у вас нет коллектора журналов OTLP.
  Записи stdout — это один JSON-объект на строку с `ts`, `signal`,
  `service.name`, severity, body, отредактированными атрибутами и доверенными полями трассировки,
  когда они доступны.
- **Корреляция файловых журналов:** файловые журналы JSONL включают верхнеуровневые `traceId`,
  `spanId`, `parentSpanId` и `traceFlags`, когда вызов журнала несет действительный
  диагностический контекст трассировки, что позволяет обработчикам журналов связывать локальные строки журналов с
  экспортированными spans.
- **Корреляция запросов:** HTTP-запросы Gateway и WebSocket-фреймы создают
  внутреннюю область трассировки запроса. Журналы и диагностические события внутри этой области
  по умолчанию наследуют трассировку запроса, а spans запуска агента и вызова модели
  создаются как дочерние, чтобы заголовки провайдера `traceparent` оставались в той же трассировке.

## Экспортируемые метрики

### Использование модели

- `openclaw.tokens` (счетчик, атрибуты: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (счетчик, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гистограмма, атрибуты: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гистограмма, метрика семантических соглашений GenAI, атрибуты: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гистограмма, секунды, метрика семантических соглашений GenAI, атрибуты: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необязательный `error.type`)
- `openclaw.model_call.duration_ms` (гистограмма, атрибуты: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а также `openclaw.errorCategory` и `openclaw.failureKind` для классифицированных ошибок)
- `openclaw.model_call.request_bytes` (гистограмма, размер финальной полезной нагрузки запроса к модели в байтах UTF-8; без содержимого исходной полезной нагрузки)
- `openclaw.model_call.response_bytes` (гистограмма, размер полезных нагрузок фрагментов потокового ответа в байтах UTF-8; высокочастотные дельты текста, размышлений и вызовов инструментов учитывают только инкрементальные байты `delta`; без содержимого исходного ответа)
- `openclaw.model_call.time_to_first_byte_ms` (гистограмма, истекшее время до первого события потокового ответа)
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

### Talk

- `openclaw.talk.event` (счетчик, атрибуты: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; отправляется, когда событие Talk сообщает длительность)
- `openclaw.talk.audio.bytes` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; отправляется для событий аудиокадров Talk, которые сообщают длину в байтах)

### Очереди и сеансы

- `openclaw.queue.lane.enqueue` (счетчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (счетчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.depth` (гистограмма, атрибуты: `openclaw.lane` или `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гистограмма, атрибуты: `openclaw.lane`)
- `openclaw.session.state` (счетчик, атрибуты: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (счетчик, атрибуты: `openclaw.state`; отправляется для восстанавливаемого устаревшего учета сеансов)
- `openclaw.session.stuck_age_ms` (гистограмма, атрибуты: `openclaw.state`; отправляется для восстанавливаемого устаревшего учета сеансов)
- `openclaw.session.turn.created` (счетчик, атрибуты: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (счетчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (счетчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гистограмма, атрибуты: те же, что у соответствующего счетчика восстановления)
- `openclaw.run.attempt` (счетчик, атрибуты: `openclaw.attempt`)

### Телеметрия активности сеанса

`diagnostics.stuckSessionWarnMs` — это порог возраста без прогресса для диагностики
активности сеансов. Сеанс `processing` не приближается к этому порогу,
пока OpenClaw наблюдает прогресс ответа, инструмента, статуса, блока или среды выполнения ACP.
Сигналы поддержания ввода не считаются прогрессом, поэтому молчащая модель или harness
все равно могут быть обнаружены.

OpenClaw классифицирует сеансы по работе, которую он все еще может наблюдать:

- `session.long_running`: активная встроенная работа, вызовы модели или вызовы инструментов
  все еще прогрессируют. Собственные вызовы модели, которые молчат дольше
  `diagnostics.stuckSessionWarnMs`, также сообщаются как длительно выполняющиеся до
  `diagnostics.stuckSessionAbortMs`, чтобы медленные или непотоковые поставщики моделей
  не выглядели как зависшие сеансы Gateway, пока их все еще можно наблюдаемо прервать.
- `session.stalled`: активная работа существует, но активный запуск не сообщал
  недавний прогресс. Собственные вызовы модели переключаются с `session.long_running` на
  `session.stalled` в момент или после `diagnostics.stuckSessionAbortMs`; устаревшая
  активность модели/инструмента без владельца не считается безвредной длительно выполняющейся работой.
  Зависшие встроенные запуски сначала остаются только наблюдаемыми, затем после
  `diagnostics.stuckSessionAbortMs` без прогресса выполняется прерывание-сброс,
  чтобы ожидающие в очереди за lane ходы могли продолжиться. Если значение не задано,
  порог прерывания по умолчанию использует более безопасное расширенное окно не менее
  5 минут и 3x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: устаревший учет сеанса без активной работы или простаивающий
  сеанс в очереди с устаревшей активностью модели/инструмента без владельца. Это освобождает
  затронутую lane сеанса сразу после прохождения шлюзов восстановления.

Восстановление отправляет структурированные события `session.recovery.requested` и
`session.recovery.completed`. Диагностическое состояние сеанса помечается как бездействующее
только после изменяющего результата восстановления (`aborted` или `released`) и только если
то же поколение обработки все еще актуально.

Только `session.stuck` отправляет счетчик `openclaw.session.stuck`,
гистограмму `openclaw.session.stuck_age_ms` и span `openclaw.session.stuck`.
Повторяющиеся диагностики `session.stuck` используют задержку, пока сеанс остается
неизменным, поэтому дашборды должны оповещать об устойчивом росте, а не о каждом
тике Heartbeat. Сведения о параметре конфигурации и значениях по умолчанию см. в
[Справочнике по конфигурации](/ru/gateway/configuration-reference#diagnostics).

Предупреждения активности также отправляют:

- `openclaw.liveness.warning` (счетчик, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гистограмма, атрибуты: `openclaw.liveness.reason`)

### Жизненный цикл harness

- `openclaw.harness.duration_ms` (гистограмма, атрибуты: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` при ошибках)

### Выполнение инструментов

- `openclaw.tool.execution.duration_ms` (гистограмма, атрибуты: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, а также `openclaw.errorCategory` при ошибках)
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

## Экспортируемые span

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
  - `openclaw.provider.request_id_hash` (ограниченный хеш на основе SHA идентификатора запроса вышестоящего провайдера; исходные идентификаторы не экспортируются)
  - При `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` спаны вызовов модели используют новейшее имя спана вывода GenAI `{gen_ai.operation.name} {gen_ai.request.model}` и тип спана `CLIENT` вместо `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без содержимого промпта, истории, ответа или ключа сессии)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без сообщений цикла, параметров или вывода инструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Когда захват содержимого явно включен, спаны моделей и инструментов также могут
включать ограниченные, отредактированные атрибуты `openclaw.content.*` для конкретных
классов содержимого, которые вы выбрали.

## Каталог диагностических событий

События ниже поддерживают приведенные выше метрики и спаны. Plugins также могут подписываться
на них напрямую без экспорта OTLP.

**Использование модели**

- `model.usage` - токены, стоимость, длительность, контекст, провайдер/модель/канал,
  идентификаторы сессий. `usage` — это учет провайдера/хода для стоимости и телеметрии;
  `context.used` — текущий снимок промпта/контекста и может быть ниже, чем
  `usage.total` провайдера, когда задействованы кэшированный ввод или вызовы цикла инструментов.

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
  жизненный цикл каждого запуска для agent harness. Включает `harnessId`, необязательный
  `pluginId`, провайдер/модель/канал и идентификатор запуска. Завершение добавляет
  `durationMs`, `outcome`, необязательный `resultClassification`, `yieldDetected`
  и счетчики `itemLifecycle`. Ошибки добавляют `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` и
  необязательный `cleanupFailed`.

**Exec**

- `exec.process.completed` - конечный результат, длительность, цель, режим, код
  выхода и вид сбоя. Текст команды и рабочие каталоги не
  включаются.

## Без экспортера

Можно сохранять диагностические события доступными для plugins или пользовательских приемников без
запуска `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для целевого отладочного вывода без повышения `logging.level` используйте диагностические
флаги. Флаги не зависят от регистра и поддерживают подстановочные знаки (например, `telegram.*` или
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Или как одноразовое переопределение через переменную окружения:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вывод флагов попадает в стандартный файл журнала (`logging.file`) и по-прежнему
редактируется `logging.redactSensitive`. Полное руководство:
[Диагностические флаги](/ru/diagnostics/flags).

## Отключение

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Также можно не включать `diagnostics-otel` в `plugins.allow` или выполнить
`openclaw plugins disable diagnostics-otel`.

## Связанные материалы

- [Журналирование](/ru/logging) - файловые журналы, консольный вывод, отслеживание через CLI и вкладка журналов Control UI
- [Внутреннее устройство журналирования Gateway](/ru/gateway/logging) - стили журналов WS, префиксы подсистем и захват консоли
- [Диагностические флаги](/ru/diagnostics/flags) - целевые флаги отладочных журналов
- [Экспорт диагностики](/ru/gateway/diagnostics) - инструмент оператора для support bundle (отдельно от экспорта OTEL)
- [Справочник по конфигурации](/ru/gateway/configuration-reference#diagnostics) - полный справочник полей `diagnostics.*`
