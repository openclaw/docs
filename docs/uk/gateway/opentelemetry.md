---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви підключаєте трейси, метрики або логи до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого бекенду OTLP
    - Вам потрібні точні назви метрик, назви спанів або структури атрибутів, щоб створювати інформаційні панелі чи сповіщення
summary: Експортуйте діагностику OpenClaw до будь-якого колектора OpenTelemetry через plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T03:40:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний Plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Будь-який збирач або бекенд, що приймає OTLP/HTTP,
працює без змін у коді. Про локальні журнальні файли та як їх читати дивіться
[Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які
  Gateway і вбудовані plugins створюють для запусків моделей, потоку повідомлень, сеансів, черг
  і exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** та **журнали** через OTLP/HTTP.
- **Виклики провайдерів** отримують заголовок W3C `traceparent` від
  довіреного контексту span виклику моделі OpenClaw, коли транспорт провайдера приймає користувацькі
  заголовки. Контекст трасування, створений Plugin, не поширюється.
- Експортери підключаються лише тоді, коли увімкнені і діагностична поверхня, і Plugin,
  тому внутрішньопроцесні витрати за замовчуванням залишаються близькими до нуля.

## Швидкий старт

Для пакетних установок спочатку встановіть Plugin:

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

Ви також можете увімкнути Plugin із CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черг, стану сеансів, exec і тиску на пам’ять.          |
| **Трейси**  | Spans для використання моделей, викликів моделей, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, збирання контексту та циклів інструментів. |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP, коли увімкнено `diagnostics.otel.logs`.                                              |

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення endpoint для окремих сигналів, що використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для окремого сигналу має пріоритет над env для окремого сигналу, а та має пріоритет над спільним endpoint.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає протокол передавання (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб створювати найновіший експериментальний атрибут span GenAI (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інший preload або процес-хост уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                |

## Приватність і захоплення вмісту

Сирий вміст моделі/інструменту **не** експортується за замовчуванням. Spans несуть обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, ідентифікатори запитів лише у вигляді хешу)
і ніколи не містять текст підказки, текст відповіді, входи інструментів, виходи інструментів або
ключі сеансів.

Вихідні запити до моделі можуть містити заголовок W3C `traceparent`. Цей заголовок
створюється лише з діагностичного контексту трасування, що належить OpenClaw, для активного виклику моделі.
Наявні заголовки `traceparent`, надані викликачем, замінюються, тому plugins або
користувацькі параметри провайдера не можуть підробити походження трасування між сервісами.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш збирач і
політика зберігання схвалені для тексту підказок, відповідей, інструментів або системних підказок.
Кожен підключ є opt-in незалежно:

- `inputMessages` - вміст користувацької підказки.
- `outputMessages` - вміст відповіді моделі.
- `toolInputs` - корисне навантаження аргументів інструменту.
- `toolOutputs` - корисне навантаження результатів інструменту.
- `systemPrompt` - зібрана системна/developer підказка.

Коли будь-який підключ увімкнено, spans моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Вибірка та скидання

- **Трейси:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає все,
  `1.0` зберігає все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень журнального файлу). Вони використовують
  шлях редагування діагностичних записів журналу, а не форматування консолі. Установки з великим обсягом
  мають надавати перевагу вибірці/фільтрації збирача OTLP над локальною вибіркою.
- **Кореляція файлових журналів:** журнали JSONL містять поля верхнього рівня `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналювання має валідний
  діагностичний контекст трасування, що дає змогу обробникам журналів поєднувати локальні рядки журналу з
  експортованими spans.
- **Кореляція запитів:** HTTP-запити Gateway і WebSocket-кадри створюють
  внутрішню область трасування запиту. Журнали та діагностичні події всередині цієї області
  за замовчуванням успадковують трасування запиту, тоді як spans запуску агента та виклику моделі
  створюються як дочірні, щоб заголовки `traceparent` провайдера залишалися в тому самому трасуванні.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, атрибути: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, плюс `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір у байтах UTF-8 фінального корисного навантаження запиту до моделі; без сирого вмісту корисного навантаження)
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
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`; створюється лише для обліку застарілих сеансів без активної роботи)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`; створюється лише для обліку застарілих сеансів без активної роботи)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Телеметрія активності сеансів

`diagnostics.stuckSessionWarnMs` — це поріг віку без прогресу для діагностики
активності сеансів. Сеанс `processing` не наближається до цього порогу,
поки OpenClaw спостерігає прогрес відповіді, інструменту, статусу, блоку або ACP runtime.
Typing keepalives не враховуються як прогрес, тому мовчазну модель або harness
все одно можна виявити.

OpenClaw класифікує сеанси за роботою, яку він ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів
  досі просуваються.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв
  про нещодавній прогрес. Завислі вбудовані запуски спочатку залишаються лише для спостереження, а потім
  виконують abort-drain після `diagnostics.stuckSessionAbortMs` без прогресу, щоб поставлені в чергу
  звернення позаду цієї смуги могли відновитися. Якщо не задано, поріг переривання типово
  використовує безпечніше розширене вікно щонайменше 10 хвилин і 5x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: застарілий облік сесії без активної роботи. Це негайно
  звільняє відповідну смугу сесії.

Відновлення створює структуровані події `session.recovery.requested` і
`session.recovery.completed`. Діагностичний стан сесії позначається як неактивний
лише після мутувального результату відновлення (`aborted` або `released`) і лише якщо
те саме покоління обробки досі є поточним.

Лише `session.stuck` створює лічильник `openclaw.session.stuck`,
гістограму `openclaw.session.stuck_age_ms` і span `openclaw.session.stuck`.
Повторні діагностики `session.stuck` відступають, доки сесія залишається
незмінною, тому dashboard-и мають сповіщати про тривалі зростання, а не про кожен
тік Heartbeat. Для параметра конфігурації та стандартних значень див.
[Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics).

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` у разі помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішні діагностики (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані span-и

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` типово або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` типово або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні конвенції GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` і необов’язковий `openclaw.failureKind` у разі помилок
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (обмежений SHA-хеш ідентифікатора запиту upstream-провайдера; сирі ідентифікатори не експортуються)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Після завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - У разі помилки: `openclaw.harness.phase`, `openclaw.errorCategory`, необов’язковий `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без prompt, історії, відповіді або вмісту ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, span-и моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви вибрали.

## Каталог діагностичних подій

Наведені нижче події підтримують метрики та span-и вище. Plugin-и також можуть підписуватися
на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` - токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сесій. `usage` — це облік провайдера/звернення для вартості й телеметрії;
  `context.used` — поточний знімок prompt/контексту, який може бути нижчим за
  provider `usage.total`, коли задіяні кешований ввід або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сесія**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: Webhook-и/черга/сесія)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  життєвий цикл кожного запуску для harness агента. Містить `harnessId`, необов’язковий
  `pluginId`, провайдер/модель/канал і ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язковий `resultClassification`, `yieldDetected`,
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` - кінцевий результат, тривалість, ціль, режим, код виходу
  і тип збою. Текст команди та робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для Plugin-ів або користувацьких приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового debug-виводу без підвищення `logging.level` використовуйте діагностичні
прапорці. Прапорці не чутливі до регістру та підтримують wildcard-и (наприклад, `telegram.*` або
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

Вивід прапорців потрапляє до стандартного файлу журналу (`logging.file`) і все одно
редагується `logging.redactSensitive`. Повний посібник:
[Діагностичні прапорці](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не додавати `diagnostics-otel` до `plugins.allow` або запустити
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) - файлові журнали, консольний вивід, відстеження CLI та вкладка Logs у Control UI
- [Внутрішнє журналювання Gateway](/uk/gateway/logging) - стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) - цільові прапорці debug-журналів
- [Експорт діагностики](/uk/gateway/diagnostics) - інструмент support-bundle для операторів (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) - повний довідник полів `diagnostics.*`
