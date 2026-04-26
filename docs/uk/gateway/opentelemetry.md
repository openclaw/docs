---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви налаштовуєте передавання трасувань, метрик або журналів до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назв спанів або форми атрибутів, щоб створювати інформаційні панелі чи сповіщення
summary: Експортуйте діагностичні дані OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T19:56:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 379e0cada90888a3703785147d62ebe418f48216169577443cc8c95dc2a9fff8
    source_path: gateway/opentelemetry.md
    workflow: 15
---

OpenClaw експортує діагностичні дані через вбудований Plugin `diagnostics-otel`
з використанням **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, що приймає OTLP/HTTP,
працює без змін у коді. Про локальні файлові журнали та способи їх читання див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які створюються
  Gateway і вбудованими plugins для запусків моделей, потоку повідомлень, сеансів, черг
  та exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трасування** і **журнали** через OTLP/HTTP.
- **Виклики провайдера** отримують заголовок W3C `traceparent` із
  контексту довіреного span виклику моделі OpenClaw, коли транспорт провайдера приймає користувацькі
  заголовки. Контекст трасування, створений Plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнено і діагностичну поверхню, і Plugin,
  тому внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

## Швидкий початок

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

Ви також можете ввімкнути Plugin з CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черги, стану сеансів, exec і тиску пам’яті. |
| **Трасування**  | Spans для використання моделей, викликів моделей, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, збирання контексту та циклів інструментів. |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP, коли ввімкнено `diagnostics.otel.logs`.                                   |

Перемикайте `traces`, `metrics` і `logs` незалежно. Усі три параметри за замовчуванням увімкнені,
коли `diagnostics.otel.enabled` має значення true.

## Довідник конфігурації

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
      sampleRate: 0.2, // root-span sampler, 0.0..1.0
      flushIntervalMs: 60000, // metric export interval (min 1000ms)
      captureContent: {
        enabled: false,
        inputMessages: false,
        outputMessages: false,
        toolInputs: false,
        toolOutputs: false,
        systemPrompt: false,
      },
    },
  },
}
```

### Змінні середовища

| Змінна                                                                                                           | Призначення                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                    | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                           |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення кінцевих точок для окремих сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для конкретного сигналу має пріоритет над env для конкретного сигналу, а env для конкретного сигналу — над спільною кінцевою точкою. |
| `OTEL_SERVICE_NAME`                                                                                              | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                    | Перевизначає wire protocol (наразі враховується лише `http/protobuf`).                                                                                                                                                                   |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                  | Установіть значення `gen_ai_latest_experimental`, щоб виводити найновіший експериментальний атрибут span GenAI (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                        | Установіть значення `1`, якщо інший preload або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`. |

## Конфіденційність і захоплення вмісту

Необроблений вміст моделі/інструментів **не** експортується за замовчуванням. Spans містять обмежені
ідентифікатори (канал, провайдер, модель, категорію помилки, ідентифікатори запитів лише у вигляді хешів)
і ніколи не включають текст промпта, текст відповіді, вхідні дані інструментів, вихідні дані інструментів
або ключі сеансів.

Вихідні запити до моделі можуть містити заголовок W3C `traceparent`. Цей заголовок
генерується лише з контексту діагностичного трасування, що належить OpenClaw, для активного виклику
моделі. Наявні заголовки `traceparent`, передані викликачем, замінюються, тому plugins або
користувацькі параметри провайдера не можуть підробити походження трасування між сервісами.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш колектор і
політика зберігання дозволяють текст промптів, відповідей, інструментів або системних промптів.
Кожен підключ є окремо opt-in:

- `inputMessages` — вміст користувацького промпта.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — корисне навантаження аргументів інструментів.
- `toolOutputs` — корисне навантаження результатів інструментів.
- `systemPrompt` — зібраний системний/розробницький промпт.

Коли ввімкнено будь-який підключ, spans моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трасування:** `diagnostics.otel.sampleRate` (лише для root-span, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних записів журналу, а не форматування консолі. Для інсталяцій із великим обсягом
  даних варто віддавати перевагу семплюванню/фільтрації в колекторі OTLP замість локального семплювання.
- **Кореляція файлових журналів:** журнали JSONL включають поля верхнього рівня `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналу містить дійсний контекст
  діагностичного трасування, що дає змогу процесорам журналів пов’язувати локальні рядки журналу з
  експортованими spans.

## Експортовані метрики

### Використання моделей

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних угод GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних угод GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язково `error.type`)

### Потік повідомлень

- `openclaw.webhook.received` (лічильник, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (лічильник, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (лічильник, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Черги та сеанси

- `openclaw.queue.lane.enqueue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, attrs: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, attrs: `openclaw.lane`)
- `openclaw.session.state` (лічильник, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (гістограма, attrs: `openclaw.state`)
- `openclaw.run.attempt` (лічильник, attrs: `openclaw.attempt`)

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` у разі помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішні діагностичні показники (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, якщо ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, якщо ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.provider.request_id_hash` (обмежений SHA-хеш ідентифікатора запиту до висхідного провайдера; сирі ідентифікатори не експортуються)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Після завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - У разі помилки: `openclaw.harness.phase`, `openclaw.errorCategory`, необов’язково `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`, `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`, `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`, `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту промпта, історії, відповіді або ключа сеансу)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли явно ввімкнено захоплення вмісту, spans моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, на які ви погодилися.

## Каталог діагностичних подій

Наведені нижче події лежать в основі метрик і spans вище. Plugins також можуть
підписуватися на них безпосередньо без експорту OTLP.

**Використання моделей**

- `model.usage` — токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сеансу. `usage` — це облік провайдера/ходу для вартості та телеметрії;
  `context.used` — це поточний знімок промпта/контексту і він може бути меншим за
  `usage.total` провайдера, коли задіяно кешоване введення або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (агреговані лічильники: webhook/черга/сеанс)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  життєвий цикл кожного запуску для agent harness. Містить `harnessId`, необов’язковий
  `pluginId`, провайдера/модель/канал та ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` та
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — фінальний результат, тривалість, ціль, режим, код
  виходу та тип збою. Текст команди й робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для plugins або користувацьких приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте
діагностичні прапорці. Прапорці нечутливі до регістру та підтримують шаблони (наприклад, `telegram.*` або
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Або як одноразове перевизначення через env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вивід прапорців потрапляє до стандартного файла журналу (`logging.file`) і, як і раніше,
редагується через `logging.redactSensitive`. Повний посібник:
[Діагностичні прапорці](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не включати `diagnostics-otel` до `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) — файлові журнали, вивід у консоль, tailing у CLI та вкладка Logs у Control UI
- [Внутрішні механізми журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) — цільові прапорці журналів налагодження
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент операторського support bundle (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
