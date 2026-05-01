---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви підключаєте трейси, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo або іншого OTLP-бекенда
    - Вам потрібні точні назви метрик, назви спанів або структури атрибутів, щоб створювати дашборди чи сповіщення
summary: Експортуйте діагностичні дані OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-05-01T23:18:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6afa805f9212571b325e00badff15d58fdc16be1b60c3f41dc7801e4241ed092
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через вбудований Plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, що приймає OTLP/HTTP,
працює без змін у коді. Про локальні файлові журнали та як їх читати див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які випускають
  Gateway і вбудовані plugins для запусків моделей, потоку повідомлень, сеансів, черг,
  та exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** та **журнали** через OTLP/HTTP.
- **Виклики провайдерів** отримують заголовок W3C `traceparent` від належного OpenClaw
  контексту span для виклику моделі, коли транспорт провайдера приймає користувацькі
  заголовки. Контекст трасування, випущений Plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнені і поверхня діагностики, і Plugin,
  тому внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

## Швидкий старт

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

| Сигнал      | Що до нього входить                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черг, стану сеансу, exec і тиску пам’яті.          |
| **Трейси**  | Spans для використання моделей, викликів моделей, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, складання контексту та циклів інструментів. |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP, коли ввімкнено `diagnostics.otel.logs`.                                              |

Перемикайте `traces`, `metrics` і `logs` незалежно. Усі три за замовчуванням увімкнені,
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

| Змінна                                                                                                          | Призначення                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення кінцевих точок для окремих сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для окремого сигналу має пріоритет над env для окремого сигналу, а той має пріоритет над спільною кінцевою точкою.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає мережевий протокол (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб випускати найновіший експериментальний атрибут span GenAI (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інший preload або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                |

## Приватність і захоплення вмісту

Сирий вміст моделі/інструментів **не** експортується за замовчуванням. Spans містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, ідентифікатори запитів лише як хеш)
і ніколи не містять текст prompt, текст відповіді, входи інструментів, виходи інструментів або
ключі сеансів.

Вихідні запити до моделей можуть містити заголовок W3C `traceparent`. Цей заголовок
генерується лише з діагностичного контексту трасування, що належить OpenClaw, для активного
виклику моделі. Наявні заголовки `traceparent`, надані викликачем, замінюються, тому plugins або
користувацькі параметри провайдера не можуть підробити міжсервісне походження трасування.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш колектор і
політика зберігання схвалені для тексту prompt, відповіді, інструменту або системного prompt.
Кожен підключ окремо вмикається явно:

- `inputMessages` — вміст prompt користувача.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — payload аргументів інструменту.
- `toolOutputs` — payload результатів інструменту.
- `systemPrompt` — зібраний системний/developer prompt.

Коли ввімкнено будь-який підключ, spans моделі й інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трейси:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних записів журналу, а не форматування консолі. Інсталяціям із великим обсягом
  слід надавати перевагу семплюванню/фільтруванню колектора OTLP замість локального семплювання.
- **Кореляція файлових журналів:** JSONL-файлові журнали містять верхньорівневі `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналювання несе чинний
  діагностичний контекст трасування, що дає змогу обробникам журналів поєднувати локальні рядки журналу з
  експортованими spans.
- **Кореляція запитів:** HTTP-запити Gateway і кадри WebSocket створюють
  внутрішню область трасування запиту. Журнали й діагностичні події всередині цієї області
  за замовчуванням успадковують трасування запиту, тоді як spans запусків агентів і викликів моделей
  створюються як дочірні, щоб заголовки `traceparent` провайдера залишалися в тому самому трасуванні.

## Експортовані метрики

### Використання моделей

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а також `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір фінального payload запиту до моделі у байтах UTF-8; без сирого вмісту payload)
- `openclaw.model_call.response_bytes` (гістограма, розмір подій потокової відповіді моделі у байтах UTF-8; без сирого вмісту відповіді)
- `openclaw.model_call.time_to_first_byte_ms` (гістограма, час, що минув до першої події потокової відповіді)

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
- `openclaw.session.stuck` (лічильник, attrs: `openclaw.state`; випускається лише для обліку застарілих сеансів без активної роботи)
- `openclaw.session.stuck_age_ms` (гістограма, attrs: `openclaw.state`; випускається лише для обліку застарілих сеансів без активної роботи)
- `openclaw.run.attempt` (лічильник, attrs: `openclaw.attempt`)

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` для помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані спани

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли увімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли увімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` і необов’язковий `openclaw.failureKind` для помилок
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (обмежений хеш на основі SHA для ідентифікатора запиту upstream-провайдера; необроблені ідентифікатори не експортуються)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Після завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - У разі помилки: `openclaw.harness.phase`, `openclaw.errorCategory`, необов’язковий `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту промпта, історії, відповіді або session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, спани моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви вибрали.

## Каталог діагностичних подій

Наведені нижче події забезпечують метрики та спани вище. Plugins також можуть підписуватися
на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` — токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сесій. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — це поточний знімок промпта/контексту, і він може бути нижчим за
  провайдерський `usage.total`, коли задіяно кешований ввід або виклики tool-loop.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сесія**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: webhooks/queue/session)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  життєвий цикл для кожного запуску agent harness. Містить `harnessId`, необов’язковий
  `pluginId`, провайдер/модель/канал і ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — кінцевий результат термінала, тривалість, ціль, режим, код
  виходу та тип відмови. Текст команди й робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для Plugins або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового налагоджувального виводу без підвищення `logging.level` використовуйте діагностичні
прапорці. Прапорці не чутливі до регістру й підтримують символи узагальнення (наприклад, `telegram.*` або
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Або як одноразове перевизначення env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вивід прапорців потрапляє у стандартний файл журналу (`logging.file`) і все одно
редагується через `logging.redactSensitive`. Повний посібник:
[Діагностичні прапорці](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не додавати `diagnostics-otel` до `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, відстеження через CLI та вкладка Logs у Control UI
- [Внутрішні механізми журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) — цільові прапорці налагоджувального журналу
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент support-bundle для операторів (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
