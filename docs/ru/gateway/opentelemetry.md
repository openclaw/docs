---
read_when:
    - Вы хотите отправлять данные об использовании моделей OpenClaw, потоке сообщений или метрики сеансов в коллектор OpenTelemetry
    - Вы подключаете трассировки, метрики или журналы к Grafana, Datadog, Honeycomb, New Relic, Tempo или другому серверу OTLP
    - Для создания панелей мониторинга или оповещений вам нужны точные имена метрик, имена спанов или структуры атрибутов.
summary: Экспортируйте диагностические данные OpenClaw в коллекторы OpenTelemetry или в формате JSONL в стандартный вывод с помощью плагина diagnostics-otel
title: Экспорт OpenTelemetry
x-i18n:
    generated_at: "2026-07-13T19:49:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw экспортирует диагностические данные через официальный плагин `diagnostics-otel`,
используя **OTLP/HTTP (protobuf)**. Журналы также можно записывать в формате JSONL в stdout для
конвейеров журналирования контейнеров и песочниц. Любой сборщик или бэкенд, принимающий
OTLP/HTTP, работает без изменений кода. Локальное журналирование в файлы описано в разделе
[Журналирование](/ru/logging).

- **Диагностические события** — это структурированные внутрипроцессные записи, создаваемые
  Gateway и встроенными плагинами для запусков моделей, потоков сообщений, сессий, очередей
  и выполнения команд.
- **`diagnostics-otel`** подписывается на эти события и экспортирует их как
  **метрики**, **трассировки** и **журналы** OpenTelemetry по протоколу OTLP/HTTP, а также может
  дублировать записи журналов в формате JSONL в stdout.
- **Вызовы провайдеров** получают заголовок W3C `traceparent` из контекста
  доверенного диапазона вызова модели OpenClaw, если транспорт провайдера принимает пользовательские
  заголовки. Контекст трассировки, созданный плагином, не распространяется.
- Экспортёры подключаются только тогда, когда включены и диагностическая подсистема, и плагин,
  поэтому по умолчанию внутрипроцессные накладные расходы остаются практически нулевыми.

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

Также плагин можно включить из CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` поддерживает только `http/protobuf`. Поскольку `traces` и `metrics` включены по умолчанию, любое другое значение (включая `grpc`) прерывает всю подписку diagnostics-otel с предупреждением `unsupported protocol` — при этом экспорт журналов в stdout также прекращается. Явно задайте `traces: false` и `metrics: false`, если вам нужен только `logsExporter: "stdout"` со значением протокола, отличным от OTLP.
</Note>

## Экспортируемые сигналы

| Сигнал      | Содержимое                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Счётчики и гистограммы для использования токенов, стоимости, длительности запусков, переключения при сбое, использования навыков, потоков сообщений, событий Talk, полос очередей, состояния и восстановления сессий, выполнения инструментов и команд, памяти, работоспособности и состояния экспортёров. |
| **Трассировки**  | Диапазоны для использования моделей, вызовов моделей, жизненного цикла среды выполнения, использования навыков, выполнения инструментов и команд, обработки Webhook и сообщений, формирования контекста и циклов инструментов.                                                      |
| **Журналы**    | Структурированные записи `logging.file`, экспортируемые по OTLP или в формате JSONL в stdout, когда включён `diagnostics.otel.logs`; тела журналов не передаются, если сбор содержимого явно не включён.                          |

Включайте и отключайте `traces`, `metrics` и `logs` независимо. Трассировки и метрики
по умолчанию включены, когда `diagnostics.otel.enabled` имеет значение true; журналы по умолчанию отключены
и экспортируются только тогда, когда `diagnostics.otel.logs` явно имеет значение `true`. По умолчанию журналы
экспортируются через OTLP; задайте для `diagnostics.otel.logsExporter` значение `stdout`, чтобы выводить JSONL
в stdout, или `both`, чтобы использовать оба варианта.

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
      sampleRate: 0.2, // сэмплер корневых диапазонов, 0.0..1.0
      flushIntervalMs: 60000, // интервал экспорта метрик (минимум 1000ms)
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

| Переменная                                                                                                          | Назначение                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Резервное значение для `diagnostics.otel.endpoint`, когда ключ конфигурации не задан.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Резервные конечные точки для отдельных сигналов, используемые, когда соответствующий ключ конфигурации `diagnostics.otel.*Endpoint` не задан. Конфигурация конкретного сигнала имеет приоритет над переменной окружения конкретного сигнала, которая, в свою очередь, имеет приоритет над общей конечной точкой.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Резервное значение для `diagnostics.otel.serviceName`, когда ключ конфигурации не задан. Имя службы по умолчанию — `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Резервное значение для сетевого протокола, когда `diagnostics.otel.protocol` не задан. Экспорт включает только `http/protobuf`.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установите значение `gen_ai_latest_experimental`, чтобы создавать диапазоны вывода GenAI новейшего формата: имена диапазонов `{gen_ai.operation.name} {gen_ai.request.model}`, тип диапазона `CLIENT` и `gen_ai.provider.name` вместо устаревшего `gen_ai.system`. Метрики GenAI всегда используют ограниченные атрибуты с низкой кардинальностью. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установите значение `1`, если другая предварительная загрузка или процесс хоста уже зарегистрировали глобальный SDK OpenTelemetry. В этом случае плагин пропускает собственный жизненный цикл NodeSDK, но по-прежнему подключает слушатели диагностики и учитывает `traces`/`metrics`/`logs`.                                                                                    |

## Конфиденциальность и сбор содержимого

Исходное содержимое моделей и инструментов по умолчанию **не** экспортируется. Диапазоны содержат ограниченные
идентификаторы (канал, провайдер, модель, категория ошибки, идентификаторы запросов только в виде хешей,
источник инструмента, владелец инструмента, имя и источник навыка) и никогда не включают текст запроса,
текст ответа, входные или выходные данные инструментов, пути к файлам навыков или ключи сессий.
Значения, похожие на ключи сессий агентов с областью действия (например, начинающиеся с
`agent:`), заменяются на `unknown` в атрибутах с низкой кардинальностью. Записи журналов OTLP
по умолчанию сохраняют уровень серьёзности, журнал, расположение в коде, доверенный контекст трассировки и
очищенные атрибуты; исходное тело сообщения журнала экспортируется только
тогда, когда `diagnostics.otel.captureContent` является логическим значением `true`. Детализированные
подключи `captureContent.*` никогда не включают тела журналов. Метрики Talk экспортируют только
ограниченные метаданные событий (режим, транспорт, провайдер, тип события) — без
расшифровок, звуковых данных, идентификаторов сессий, ходов, вызовов и комнат, а также
токенов передачи.

Исходящие запросы к моделям могут содержать заголовок W3C `traceparent`, созданный только
из принадлежащего OpenClaw контекста диагностической трассировки активного вызова модели.
Существующие заголовки `traceparent`, предоставленные вызывающей стороной, заменяются, поэтому плагины или
пользовательские параметры провайдеров не могут подделать межсервисное происхождение трассировки.

Устанавливайте для `diagnostics.otel.captureContent.*` значение `true` только в том случае, если ваш сборщик
и политика хранения одобрены для текста запросов, ответов, инструментов или
системных запросов. Каждый подключ независим:

- `inputMessages` — содержимое пользовательского запроса.
- `outputMessages` — содержимое ответа модели.
- `toolInputs` — данные аргументов инструмента.
- `toolOutputs` — данные результата инструмента.
- `systemPrompt` — сформированный системный запрос или запрос разработчика.
- `toolDefinitions` — имена, описания и схемы инструментов модели.

Когда включён любой подключ, диапазоны моделей и инструментов получают ограниченные, отредактированные
атрибуты `openclaw.content.*` только для соответствующего класса.

<Note>
Логическое значение `captureContent: true` одновременно включает `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` и тела журналов OTLP, но **не** `systemPrompt` — явно задайте `captureContent.systemPrompt: true`, если вам также нужен сформированный системный запрос.
</Note>

Содержимое `toolInputs`/`toolOutputs` собирается при выполнении инструментов встроенной
средой выполнения агента (`openclaw.content.tool_input` и
`gen_ai.tool.call.arguments` в диапазонах завершения и ошибки;
`openclaw.content.tool_output` и `gen_ai.tool.call.result` в диапазонах
завершения). Имена `openclaw.content.*` остаются стабильными именами атрибутов
OpenClaw; копии `gen_ai.tool.call.*` дублируют их для средств просмотра с нативной поддержкой семантических соглашений.
Вызовы инструментов внешней среды выполнения (Codex, Claude CLI) создают
диапазоны `tool.execution.*` без содержимого. Собранное содержимое передаётся по
доверенному каналу только для слушателей и никогда не помещается в общедоступную шину
диагностических событий.

## Сэмплирование и сброс

- **Трассировки:** `diagnostics.otel.sampleRate` задаёт `TraceIdRatioBasedSampler`
  только для корневого спана (`0.0` отбрасывает все, `1.0` сохраняет все). Если значение не задано, используется значение по умолчанию
  из OpenTelemetry SDK (всегда включено).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (ограничивается снизу значением
  `1000`); если значение не задано, используется заданный в SDK интервал периодического экспорта по умолчанию.
- **Журналы:** журналы OTLP учитывают `logging.level` (уровень файлового журнала) и используют
  механизм редактирования диагностических записей журнала, а не консольное форматирование. В установках
  с большим объёмом данных следует предпочесть выборку и фильтрацию в коллекторе OTLP локальной
  выборке. Задайте `diagnostics.otel.logsExporter: "stdout"`, если ваша платформа
  уже отправляет stdout/stderr обработчику журналов и у вас нет коллектора журналов
  OTLP. Записи stdout представляют собой по одному объекту JSON на строку с `ts`, `signal`,
  `service.name`, уровнем важности, телом, отредактированными атрибутами и доверенными полями трассировки,
  если они доступны.
- **Корреляция с файловым журналом:** файловые журналы JSONL включают поля верхнего уровня `traceId`,
  `spanId`, `parentSpanId` и `traceFlags`, когда вызов журналирования содержит допустимый
  контекст диагностической трассировки, что позволяет обработчикам журналов связывать локальные строки журнала с
  экспортированными спанами.
- **Корреляция запросов:** HTTP-запросы Gateway и кадры WebSocket создают
  внутреннюю область трассировки запроса. Журналы и диагностические события внутри этой
  области по умолчанию наследуют трассировку запроса, а спаны запуска агента и вызова модели
  создаются как дочерние, поэтому заголовки провайдера `traceparent` остаются в той же
  трассировке.
- **Корреляция вызовов модели:** спаны `openclaw.model.call` по умолчанию включают безопасные размеры
  компонентов запроса и атрибуты токенов для каждого вызова, когда результат провайдера
  содержит сведения об использовании. `openclaw.model.usage` остаётся спаном
  учёта на уровне запуска для панелей совокупной стоимости, контекста и каналов и
  остаётся в той же диагностической трассировке, когда среда выполнения, создающая событие, имеет доверенный
  контекст трассировки.

## Экспортируемые метрики

### Использование модели

- `openclaw.tokens` (счётчик, атрибуты: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (счётчик, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гистограмма, атрибуты: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гистограмма, атрибуты: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гистограмма, метрика семантических соглашений GenAI, атрибуты: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гистограмма, секунды, метрика семантических соглашений GenAI, атрибуты: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необязательный `error.type`)
- `openclaw.model_call.duration_ms` (гистограмма, атрибуты: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а также `openclaw.errorCategory` и `openclaw.failureKind` для классифицированных ошибок)
- `openclaw.model_call.request_bytes` (гистограмма, размер в байтах UTF-8 итоговой полезной нагрузки запроса к модели; без исходного содержимого полезной нагрузки)
- `openclaw.model_call.response_bytes` (гистограмма, размер в байтах UTF-8 полезной нагрузки передаваемых потоком фрагментов ответа; для высокочастотных приращений текста, рассуждений и вызовов инструментов учитываются только добавочные байты `delta`; без исходного содержимого ответа)
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

### Talk

- `openclaw.talk.event` (счётчик, атрибуты: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; создаётся, когда событие Talk сообщает длительность)
- `openclaw.talk.audio.bytes` (гистограмма, атрибуты: те же, что у `openclaw.talk.event`; создаётся для событий аудиокадров Talk, сообщающих длину в байтах)

### Очереди и сеансы

- `openclaw.queue.lane.enqueue` (счётчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (счётчик, атрибуты: `openclaw.lane`)
- `openclaw.queue.depth` (гистограмма, атрибуты: `openclaw.lane` или `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гистограмма, атрибуты: `openclaw.lane`)
- `openclaw.session.state` (счётчик, атрибуты: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (счётчик, атрибуты: `openclaw.state`; создаётся при устранимом устаревании служебного состояния сеанса)
- `openclaw.session.stuck_age_ms` (гистограмма, атрибуты: `openclaw.state`; создаётся при устранимом устаревании служебного состояния сеанса)
- `openclaw.session.turn.created` (счётчик, атрибуты: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (счётчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (счётчик, атрибуты: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гистограмма, атрибуты: те же, что у соответствующего счётчика восстановления)
- `openclaw.run.attempt` (счётчик, атрибуты: `openclaw.attempt`)

### Телеметрия активности сеансов

`diagnostics.stuckSessionWarnMs` — порог длительности отсутствия прогресса для диагностики
активности сеанса. Сеанс `processing` не приближается к этому
порогу, пока OpenClaw наблюдает прогресс ответа, инструмента, статуса, блока или среды выполнения
ACP. Сигналы поддержания индикатора набора текста не считаются прогрессом, поэтому модель или
среду выполнения, не выдающую данные, всё равно можно обнаружить.

OpenClaw классифицирует сеансы по работе, которую ещё может наблюдать:

- `session.long_running`: активная встроенная работа, вызовы модели или вызовы инструментов
  всё ещё выполняются с прогрессом. Собственные вызовы модели, которые не выдают данные дольше
  `diagnostics.stuckSessionWarnMs`, также отмечаются как длительные до
  `diagnostics.stuckSessionAbortMs`, поэтому медленные или непотоковые провайдеры моделей
  не выглядят как зависшие сеансы Gateway, пока за их прерыванием можно наблюдать.
- `session.stalled`: активная работа существует, но активный запуск в последнее время не сообщал
  о прогрессе. Собственные вызовы модели переходят из `session.long_running` в
  `session.stalled` при достижении `diagnostics.stuckSessionAbortMs` или позже; устаревшая
  активность модели или инструмента без владельца не считается безвредной длительной работой.
  Зависшие встроенные запуски сначала остаются только под наблюдением, а затем прерываются с ожиданием завершения после
  `diagnostics.stuckSessionAbortMs` без прогресса, чтобы находящиеся за ними в очереди проходы
  в этой линии могли продолжиться. Если значение не задано, порог прерывания по умолчанию равен более безопасному
  расширенному окну длительностью не менее 5 минут и в 3 раза больше
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: устаревшее служебное состояние сеанса без активной работы или неактивный
  сеанс в очереди с устаревшей активностью модели или инструмента без владельца. Это немедленно освобождает
  затронутую линию сеанса после прохождения проверок восстановления.

При восстановлении создаются структурированные события `session.recovery.requested` и
`session.recovery.completed`. Диагностическое состояние сеанса помечается как неактивное
только после изменяющего состояние результата восстановления (`aborted` или `released`) и только если
то же поколение обработки всё ещё актуально.

Только `session.stuck` создаёт счётчик `openclaw.session.stuck`,
гистограмму `openclaw.session.stuck_age_ms` и спан `openclaw.session.stuck`.
Повторяющиеся диагностические события `session.stuck` используют увеличивающуюся задержку, пока сеанс остаётся
неизменным, поэтому панели должны оповещать об устойчивом росте, а не о
каждом такте Heartbeat. Параметр конфигурации и значения по умолчанию см. в
[справочнике по конфигурации](/ru/gateway/configuration-reference#diagnostics).

Предупреждения об активности также создают:

- `openclaw.liveness.warning` (счётчик, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гистограмма, атрибуты: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гистограмма, атрибуты: `openclaw.liveness.reason`)

### Жизненный цикл среды выполнения

- `openclaw.harness.duration_ms` (гистограмма, атрибуты: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` при ошибках)

### Выполнение инструментов и обнаружение циклов

- `openclaw.tool.execution.duration_ms` (гистограмма, атрибуты: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, а также `openclaw.errorCategory` при ошибках)
- `openclaw.tool.execution.blocked` (счётчик, атрибуты: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (счётчик, атрибуты: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, необязательный `openclaw.loop.paired_tool`; создаётся при обнаружении повторяющегося цикла вызовов инструментов)

### Exec

- `openclaw.exec.duration_ms` (гистограмма, атрибуты: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутренние компоненты диагностики (память, полезные нагрузки, состояние экспортёра)

- `openclaw.payload.large` (счётчик, атрибуты: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (гистограмма, атрибуты: те же, что у `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (гистограммы, без атрибутов; образцы памяти процесса)
- `openclaw.memory.pressure` (счётчик, атрибуты: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (счётчик, атрибуты: `openclaw.diagnostic.async_queue.drop_class`; потери из-за обратного давления во внутренней диагностической очереди)
- `openclaw.telemetry.exporter.events` (счётчик, атрибуты: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, необязательный `openclaw.reason`, необязательный `openclaw.errorCategory`; внутренняя телеметрия жизненного цикла и сбоев экспортёра)

## Экспортируемые спаны

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (ввод/вывод/чтение из кеша/запись в кеш/всего)
  - `gen_ai.system` по умолчанию или `gen_ai.provider.name`, если включены новейшие семантические соглашения GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` по умолчанию или `gen_ai.provider.name`, если включены новейшие семантические соглашения GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory`, `error.type` и необязательный `openclaw.failureKind` при ошибках
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (только безопасные размеры компонентов, без текста запросов)
  - `openclaw.model_call.usage.*` и `gen_ai.usage.*`, когда результат вызова модели содержит данные об использовании провайдера для этого отдельного вызова
  - Событие спана `openclaw.provider.request` с атрибутом `openclaw.upstreamRequestIdHash` (ограниченным, на основе хеша), когда результат вышестоящего провайдера содержит идентификатор запроса; необработанные идентификаторы никогда не экспортируются
  - При `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` спаны вызовов модели используют новейшее имя спана вывода GenAI `{gen_ai.operation.name} {gen_ai.request.model}` и вид спана `CLIENT` вместо `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - При завершении: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - При ошибке: `openclaw.harness.phase`, `openclaw.errorCategory`, необязательный `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, необязательный `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Необязательные `openclaw.errorCategory`/`openclaw.errorCode` при ошибках, `openclaw.deniedReason` и `openclaw.outcome=blocked` при отказе из-за политики или песочницы
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

Когда сбор содержимого явно включён, спаны модели и инструментов также могут
включать ограниченные, отредактированные атрибуты `openclaw.content.*` для конкретных
классов содержимого, сбор которых вы включили.

## Каталог диагностических событий

Приведённые ниже события лежат в основе указанных выше метрик и спанов. Плагины также могут
подписываться на них напрямую без экспорта OTLP.

**Использование модели**

- `model.usage` — токены, стоимость, длительность, контекст, провайдер/модель/канал,
  идентификаторы сеансов. `usage` — учёт провайдера/хода для расчёта стоимости и телеметрии;
  `context.used` — текущий снимок запроса/контекста, который может быть меньше
  значения провайдера `usage.total`, если используются кешированный ввод или вызовы в цикле инструментов.

**Поток сообщений**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Очередь и сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агрегированные счётчики: вебхуки/очередь/сеанс)

**Жизненный цикл среды выполнения**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  жизненный цикл каждого запуска среды выполнения агента. Включает `harnessId`, необязательный
  `pluginId`, провайдера/модель/канал и идентификатор запуска. При завершении добавляются
  `durationMs`, `outcome`, необязательный `resultClassification`, `yieldDetected`
  и значения счётчиков `itemLifecycle`. При ошибках добавляются `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` и
  необязательный `cleanupFailed`.

**Выполнение команд**

- `exec.process.completed` — результат выполнения в терминале, длительность, целевой объект, режим, код
  завершения и вид сбоя. Текст команды и рабочие каталоги не
  включаются.
- `exec.approval.followup_suppressed` — устаревший последующий запрос на подтверждение, отброшенный
  после повторной привязки сеанса. Включает `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` или `gateway_preflight`)
  и временную метку диспетчера. Ключи сеансов, маршруты и текст команды
  не включаются.

## Без экспортёра

Сохраняйте диагностические события доступными для плагинов или пользовательских приёмников без запуска
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

Или в виде разового переопределения через переменную окружения:

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

Также можно не включать `diagnostics-otel` в `plugins.allow` или запустить
`openclaw plugins disable diagnostics-otel`.

## Связанные материалы

- [Журналирование](/ru/logging) — файловые журналы, вывод в консоль, просмотр через CLI и вкладка журналов в Control UI
- [Внутреннее устройство журналирования Gateway](/ru/gateway/logging) — стили журналов WS, префиксы подсистем и захват консольного вывода
- [Диагностические флаги](/ru/diagnostics/flags) — флаги целевого отладочного журналирования
- [Экспорт диагностики](/ru/gateway/diagnostics) — операторский инструмент создания пакета поддержки (отдельный от экспорта OTEL)
- [Справочник по конфигурации](/ru/gateway/configuration-reference#diagnostics) — полный справочник по полям `diagnostics.*`
