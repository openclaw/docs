---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви підключаєте трейси, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви спанів або структури атрибутів, щоб створювати панелі моніторингу чи сповіщення.
summary: Експортуйте діагностику OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-05-03T17:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний Plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, що приймає OTLP/HTTP,
працює без змін коду. Про локальні файлові журнали та як їх читати див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Події діагностики** — це структуровані внутрішньопроцесні записи, які
  Gateway і вбудовані plugins генерують для запусків моделей, потоку повідомлень, сеансів, черг
  та exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** та **журнали** через OTLP/HTTP.
- **Виклики провайдерів** отримують W3C-заголовок `traceparent` від довіреного
  контексту span виклику моделі OpenClaw, коли транспорт провайдера приймає власні
  заголовки. Контекст трасування, згенерований plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнені і діагностична поверхня, і plugin,
  тому внутрішньопроцесна вартість за замовчуванням залишається майже нульовою.

## Швидкий старт

Для пакетних інсталяцій спочатку встановіть plugin:

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

Ви також можете ввімкнути plugin з CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, ліній черг, стану сеансів, exec і навантаження на пам’ять.          |
| **Трейси**  | Spans для використання моделі, викликів моделі, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, складання контексту та циклів інструментів. |
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення endpoint для окремих сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація окремого сигналу має пріоритет над env окремого сигналу, а той має пріоритет над спільним endpoint.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає мережевий протокол (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб генерувати найновіший експериментальний атрибут GenAI span (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інший preload або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                |

## Приватність і захоплення вмісту

Сирий вміст моделі/інструменту **не** експортується за замовчуванням. Spans містять обмежені
ідентифікатори (канал, провайдер, модель, категорію помилки, ідентифікатори запитів лише як хеш)
і ніколи не містять текст prompt, текст відповіді, вхідні дані інструментів, вихідні дані інструментів або
ключі сеансів.

Вихідні запити до моделі можуть містити W3C-заголовок `traceparent`. Цей заголовок
генерується лише з діагностичного контексту трасування, що належить OpenClaw, для активного
виклику моделі. Наявні заголовки `traceparent`, надані викликачем, замінюються, тому plugins або
власні параметри провайдера не можуть підробити походження міжсервісного трейсу.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш колектор і
політика зберігання схвалені для тексту prompt, відповіді, інструменту або системного prompt.
Кожен підключ є незалежним opt-in:

- `inputMessages` — вміст prompt користувача.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — payload аргументів інструменту.
- `toolOutputs` — payload результатів інструменту.
- `systemPrompt` — зібраний системний/developer prompt.

Коли ввімкнено будь-який підключ, spans моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трейси:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** OTLP-журнали враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних log-record, а не форматування консолі. Інсталяціям із великим обсягом
  слід надавати перевагу семплюванню/фільтрації в OTLP collector над локальним семплюванням.
- **Кореляція файлових журналів:** JSONL-файлові журнали містять верхньорівневі `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналу має дійсний
  діагностичний контекст трасування, що дає змогу обробникам журналів поєднувати локальні рядки журналів з
  експортованими spans.
- **Кореляція запитів:** HTTP-запити Gateway і WebSocket-фрейми створюють
  внутрішню область трасування запиту. Журнали та діагностичні події всередині цієї області
  за замовчуванням успадковують трасування запиту, тоді як spans запуску агента та виклику моделі
  створюються як дочірні, щоб заголовки `traceparent` провайдера залишалися в тому самому трейсі.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, плюс `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір у байтах UTF-8 фінального payload запиту моделі; без сирого вмісту payload)
- `openclaw.model_call.response_bytes` (гістограма, розмір у байтах UTF-8 подій потокової відповіді моделі; без сирого вмісту відповіді)
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
- `openclaw.session.stuck` (лічильник, attrs: `openclaw.state`; генерується лише для обліку застарілих сеансів без активної роботи)
- `openclaw.session.stuck_age_ms` (гістограма, attrs: `openclaw.state`; генерується лише для обліку застарілих сеансів без активної роботи)
- `openclaw.run.attempt` (лічильник, attrs: `openclaw.attempt`)

### Телеметрія активності сеансу

`diagnostics.stuckSessionWarnMs` — це поріг віку без прогресу для діагностики
активності сеансів. Сеанс `processing` не наближається до цього порогу,
поки OpenClaw спостерігає прогрес відповіді, інструменту, статусу, блоку або середовища виконання ACP.
Typing keepalives не зараховуються як прогрес, тому беззвучну модель або harness
все ще можна виявити.

OpenClaw класифікує сеанси за роботою, яку він ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів
  усе ще просуваються.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв
  про нещодавній прогрес. Застряглі вбудовані запуски спершу залишаються лише для спостереження, а потім
  виконують abort-drain після щонайменше 10 хвилин і 5x `diagnostics.stuckSessionWarnMs`
  без прогресу, щоб чергові ходи за цим lane могли відновитися.
- `session.stuck`: застарілий облік сесії без активної роботи. Це негайно звільняє
  відповідний lane сесії.

Лише `session.stuck` емітує лічильник `openclaw.session.stuck`,
гістограму `openclaw.session.stuck_age_ms` і span `openclaw.session.stuck`.
Повторні діагностичні події `session.stuck` застосовують backoff, доки сесія залишається
незмінною, тому dashboards мають сповіщати про стійке зростання, а не про кожен
тік Heartbeat. Про параметр конфігурації та значення за замовчуванням див.
[Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics).

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` для помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, attrs: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` і необов’язковий `openclaw.failureKind` для помилок
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (обмежений SHA-хеш id запиту до upstream-провайдера; raw ids не експортуються)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без prompt, history, response або вмісту session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, params або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, spans моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог діагностичних подій

Події нижче підтримують наведені вище метрики та spans. Plugins також можуть підписуватися
на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` — tokens, cost, duration, context, provider/model/channel,
  ids сесій. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — поточний знімок prompt/context і може бути нижчим за
  provider `usage.total`, коли задіяно cached input або виклики tool-loop.

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
  життєвий цикл кожного запуску для agent harness. Містить `harnessId`, необов’язковий
  `pluginId`, provider/model/channel і run id. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`,
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — кінцевий результат, тривалість, target, mode, exit
  code і failure kind. Текст команди та робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для Plugins або власних sinks без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового debug-виводу без підвищення `logging.level` використовуйте діагностичні
flags. Flags не чутливі до регістру та підтримують wildcards (наприклад, `telegram.*` або
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

Вивід flags потрапляє у стандартний файл журналу (`logging.file`) і все одно
редагується через `logging.redactSensitive`. Повний посібник:
[Діагностичні flags](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не додавати `diagnostics-otel` до `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, CLI tailing і вкладка Logs у Control UI
- [Внутрішня логіка журналювання Gateway](/uk/gateway/logging) — стилі WS-логів, префікси підсистем і захоплення консолі
- [Діагностичні flags](/uk/diagnostics/flags) — цільові flags debug-log
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент support-bundle для операторів (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
