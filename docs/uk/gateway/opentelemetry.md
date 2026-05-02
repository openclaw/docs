---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви підключаєте трейси, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo або іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви спанів або структури атрибутів, щоб створювати панелі моніторингу чи оповіщення
summary: Експортуйте діагностичні дані OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T07:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0aed4ca8818d3bd1f5461fb58fbbe5c0d3ed1262cac506c60ee326800d98e1b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний Plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, який приймає OTLP/HTTP,
працює без змін у коді. Про локальні файлові журнали та як їх читати див.
[Журналювання](/uk/logging).

## Як це поєднується

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які
  Gateway і вбудовані Plugin-и створюють для запусків моделей, потоку повідомлень, сеансів, черг
  і exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** і **журнали** через OTLP/HTTP.
- **Виклики провайдера** отримують W3C-заголовок `traceparent` з належного OpenClaw
  контексту span для виклику моделі, коли транспорт провайдера приймає користувацькі
  заголовки. Контекст трасування, створений Plugin-ом, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнено і діагностичну поверхню, і Plugin,
  тож внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

## Швидкий старт

Для пакетних інсталяцій спочатку встановіть Plugin:

```bash
openclaw plugins install @openclaw/diagnostics-otel
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

Також можна ввімкнути Plugin з CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` зараз підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього потрапляє                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники й гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черг, стану сеансів, exec і тиску на пам’ять.          |
| **Трейси**  | Span-и для використання моделі, викликів моделі, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, складання контексту та циклів інструментів. |
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Сигнально-специфічні перевизначення endpoint, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Сигнально-специфічна конфігурація має пріоритет над сигнально-специфічним env, а той має пріоритет над спільним endpoint.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає протокол передавання (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб створювати найновіший експериментальний атрибут GenAI span (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інший preload або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                |

## Приватність і захоплення вмісту

Сирий вміст моделі/інструмента **не** експортується за замовчуванням. Span-и містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, ідентифікатори запитів лише як хеші)
і ніколи не включають текст prompt, текст відповіді, вхідні дані інструмента, вихідні дані інструмента або
ключі сеансів.

Вихідні запити до моделі можуть містити W3C-заголовок `traceparent`. Цей заголовок
створюється лише з діагностичного контексту трасування, який належить OpenClaw, для активного виклику моделі.
Наявні заголовки `traceparent`, надані викликачем, замінюються, тож Plugin-и або
користувацькі параметри провайдера не можуть підробити міжсервісне походження трасування.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш колектор і
політика зберігання схвалені для тексту prompt, відповіді, інструмента або системного prompt.
Кожен підключ є opt-in незалежно:

- `inputMessages` — вміст prompt користувача.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — payload-и аргументів інструмента.
- `toolOutputs` — payload-и результатів інструмента.
- `systemPrompt` — зібраний системний/developer prompt.

Коли ввімкнено будь-який підключ, span-и моделі та інструмента отримують обмежені, редаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплінг і flush

- **Трейси:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає все,
  `1.0` зберігає все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** OTLP-журнали враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичного log-record, а не форматування консолі. Інсталяціям з великим обсягом
  варто надавати перевагу семплінгу/фільтрації OTLP-колектора, а не локальному семплінгу.
- **Кореляція файлових журналів:** JSONL-файлові журнали містять верхньорівневі `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналювання містить чинний
  діагностичний контекст трасування, що дає змогу процесорам журналів поєднувати локальні рядки журналів з
  експортованими span-ами.
- **Кореляція запитів:** HTTP-запити Gateway і WebSocket-фрейми створюють
  внутрішню область трасування запиту. Журнали та діагностичні події всередині цієї області
  за замовчуванням успадковують трасування запиту, тоді як span-и agent run і model-call
  створюються як дочірні, щоб заголовки `traceparent` провайдера залишалися в тому самому trace.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язково `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, атрибути: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, плюс `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір у байтах UTF-8 фінального payload запиту до моделі; без сирого вмісту payload)
- `openclaw.model_call.response_bytes` (гістограма, розмір у байтах UTF-8 подій потокової відповіді моделі; без сирого вмісту відповіді)
- `openclaw.model_call.time_to_first_byte_ms` (гістограма, час, що минув до першої події потокової відповіді)

### Потік повідомлень

- `openclaw.webhook.received` (лічильник, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, атрибути: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (лічильник, атрибути: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (лічильник, атрибути: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Черги та сеанси

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`; створюється лише для bookkeeping застарілого сеансу без активної роботи)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`; створюється лише для bookkeeping застарілого сеансу без активної роботи)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Телеметрія життєздатності сеансу

`diagnostics.stuckSessionWarnMs` — це поріг віку без прогресу для діагностики
життєздатності сеансу. Сеанс `processing` не старіє до цього порога,
поки OpenClaw спостерігає прогрес відповіді, інструмента, статусу, блока або ACP runtime.
Typing keepalive-и не зараховуються як прогрес, тож безмовну модель або harness
усе одно можна виявити.

OpenClaw класифікує сеанси за роботою, яку ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів
  усе ще просуваються.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв
  про нещодавній прогрес.
- `session.stuck`: застарілий облік сеансу без активної роботи. Це єдина
  класифікація працездатності, яка звільняє відповідну смугу сеансу.

Лише `session.stuck` генерує лічильник `openclaw.session.stuck`,
гістограму `openclaw.session.stuck_age_ms` і span `openclaw.session.stuck`.
Повторні діагностичні події `session.stuck` відступають, доки сеанс залишається
незміненим, тому панелі моніторингу мають сповіщати про сталі збільшення, а не про кожен
тік Heartbeat. Ручку конфігурації та значення за замовчуванням див.
у [довіднику конфігурації](/uk/gateway/configuration-reference#diagnostics).

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` у разі помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішні механізми діагностики (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.errorCategory` і необов’язковий `openclaw.failureKind` у разі помилок
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (обмежений хеш на основі SHA ідентифікатора запиту до вищого провайдера; сирі ідентифікатори не експортуються)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без промпта, історії, відповіді або вмісту ключа сеансу)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, spans моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог діагностичних подій

Наведені нижче події підтримують метрики й spans вище. Plugins також можуть підписуватися
на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` — токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сеансу. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — це поточний знімок промпта/контексту, і він може бути меншим за
  `usage.total` провайдера, коли задіяні кешований вхід або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: webhooks/черга/сеанс)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  життєвий цикл кожного запуску для harness агента. Містить `harnessId`, необов’язковий
  `pluginId`, провайдер/модель/канал і ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`,
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — кінцевий результат термінала, тривалість, ціль, режим, код виходу
  і тип збою. Текст команди та робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для plugins або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового налагоджувального виводу без підвищення `logging.level` використовуйте діагностичні
прапорці. Прапорці нечутливі до регістру та підтримують шаблони (наприклад, `telegram.*` або
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

Вивід прапорців потрапляє до стандартного файлу журналу (`logging.file`) і все одно
редагується через `logging.redactSensitive`. Повний посібник:
[Діагностичні прапорці](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не включати `diagnostics-otel` у `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, відстеження через CLI і вкладка журналів Control UI
- [Внутрішні механізми журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) — цільові прапорці налагоджувального журналу
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент оператора для support-bundle (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) — повна довідка полів `diagnostics.*`
