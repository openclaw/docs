---
read_when:
    - Ви хочете надсилати дані про використання моделі OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви підключаєте трейси, метрики або логи до Grafana, Datadog, Honeycomb, New Relic, Tempo або іншого OTLP-бекенду
    - Вам потрібні точні назви метрик, назви спанів або структури атрибутів, щоб створювати панелі моніторингу чи сповіщення.
summary: Експортуйте діагностику OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-05-05T03:06:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний `diagnostics-otel` Plugin
за допомогою **OTLP/HTTP (protobuf)**. Будь-який колектор або бекенд, що приймає OTLP/HTTP,
працює без змін у коді. Про локальні файлові журнали та те, як їх читати, див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які
  Gateway і вбудовані plugins створюють для запусків моделей, потоку повідомлень, сесій, черг
  і exec.
- **`diagnostics-otel` Plugin** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** і **журнали** через OTLP/HTTP.
- **Виклики провайдера** отримують W3C-заголовок `traceparent` із довіреного
  контексту span виклику моделі OpenClaw, коли транспорт провайдера приймає власні
  заголовки. Контекст трасування, створений Plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнено і діагностичну поверхню, і Plugin,
  тому внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

## Швидкий старт

Для пакетних інсталяцій спочатку встановіть Plugin:

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

Ви також можете ввімкнути Plugin із CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, смуг черг, стану сесії, exec і тиску на пам’ять.          |
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення кінцевих точок для окремих сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для окремого сигналу має пріоритет над env для окремого сигналу, а той має пріоритет над спільною кінцевою точкою.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає мережевий протокол (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб надсилати найновіший експериментальний атрибут span GenAI (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інше попереднє завантаження або хост-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                |

## Приватність і захоплення вмісту

Необроблений вміст моделі/інструменту **не** експортується за замовчуванням. Spans містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, ідентифікатори запитів лише у вигляді хешів)
і ніколи не містять текст запиту, текст відповіді, вхідні дані інструменту, вихідні дані інструменту або
ключі сесії.

Вихідні запити до моделі можуть містити W3C-заголовок `traceparent`. Цей заголовок
створюється лише з діагностичного контексту трасування, що належить OpenClaw, для активного виклику моделі.
Наявні заголовки `traceparent`, передані викликачем, замінюються, тому plugins або
власні параметри провайдера не можуть підробити походження міжсервісного трасування.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш колектор і
політика зберігання схвалені для тексту запитів, відповідей, інструментів або системних запитів.
Кожен підключ є окремим opt-in:

- `inputMessages` — вміст запиту користувача.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — payload аргументів інструменту.
- `toolOutputs` — payload результатів інструменту.
- `systemPrompt` — зібраний системний/developer-запит.

Коли ввімкнено будь-який підключ, spans моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трейси:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних log-record, а не форматування консолі. Інсталяціям із великим обсягом
  варто віддавати перевагу семплюванню/фільтрації в OTLP-колекторі замість локального семплювання.
- **Кореляція файлових журналів:** файлові журнали JSONL містять поля верхнього рівня `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналу несе валідний
  діагностичний контекст трасування, що дає змогу обробникам журналів поєднувати локальні рядки журналу з
  експортованими spans.
- **Кореляція запитів:** HTTP-запити Gateway і кадри WebSocket створюють
  внутрішню область трасування запиту. Журнали та діагностичні події в цій області
  за замовчуванням успадковують трасування запиту, тоді як spans запуску агента та виклику моделі
  створюються як дочірні, щоб заголовки `traceparent` провайдера залишалися в тому самому trace.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язково `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а також `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір у байтах UTF-8 фінального payload запиту до моделі; без необробленого вмісту payload)
- `openclaw.model_call.response_bytes` (гістограма, розмір у байтах UTF-8 потокових подій відповіді моделі; без необробленого вмісту відповіді)
- `openclaw.model_call.time_to_first_byte_ms` (гістограма, час, що минув до першої потокової події відповіді)

### Потік повідомлень

- `openclaw.webhook.received` (лічильник, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (лічильник, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (лічильник, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Черги та сесії

- `openclaw.queue.lane.enqueue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, attrs: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, attrs: `openclaw.lane`)
- `openclaw.session.state` (лічильник, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, attrs: `openclaw.state`; надсилається лише для обліку застарілих сесій без активної роботи)
- `openclaw.session.stuck_age_ms` (гістограма, attrs: `openclaw.state`; надсилається лише для обліку застарілих сесій без активної роботи)
- `openclaw.run.attempt` (лічильник, attrs: `openclaw.attempt`)

### Телеметрія життєздатності сесії

`diagnostics.stuckSessionWarnMs` — це поріг віку без прогресу для діагностики
життєздатності сесії. Сесія `processing` не наближається до цього порогу,
поки OpenClaw спостерігає прогрес відповіді, інструменту, статусу, блоку або виконання ACP.
Typing keepalives не враховуються як прогрес, тому мовчазну модель або harness
усе одно можна виявити.

OpenClaw класифікує сесії за роботою, яку все ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів
  досі виконуються.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв
  про нещодавній прогрес. Застряглі вбудовані запуски спочатку залишаються лише для спостереження, а потім
  виконують abort-drain після `diagnostics.stuckSessionAbortMs` без прогресу, щоб поставлені в чергу
  звернення за цією смугою могли відновитися. Якщо значення не задано, поріг переривання за замовчуванням
  становить безпечніше розширене вікно щонайменше 10 хвилин і 5x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: застарілий облік сеансу без активної роботи. Це негайно звільняє
  відповідну смугу сеансу.

Відновлення створює структуровані події `session.recovery.requested` і
`session.recovery.completed`. Діагностичний стан сеансу позначається як неактивний
лише після результату відновлення, що змінює стан (`aborted` або `released`), і лише якщо
те саме покоління обробки досі є поточним.

Лише `session.stuck` створює лічильник `openclaw.session.stuck`,
гістограму `openclaw.session.stuck_age_ms` і span `openclaw.session.stuck`.
Повторні діагностики `session.stuck` відступають, доки сеанс залишається
незмінним, тому dashboards мають сповіщати про стале зростання, а не про кожен
тик Heartbeat. Про параметр конфігурації та значення за замовчуванням див.
[Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics).

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` для помилок)

### Exec

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішні діагностичні дані (памʼять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані spans

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` за замовчуванням або `gen_ai.provider.name`, коли ввімкнено найновіші семантичні угоди GenAI
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` і необовʼязковий `openclaw.failureKind` для помилок
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (обмежений SHA-based hash ідентифікатора запиту до upstream provider; raw ids не експортуються)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Після завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - У разі помилки: `openclaw.harness.phase`, `openclaw.errorCategory`, необовʼязковий `openclaw.harness.cleanup_failed`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без prompt, history, response або вмісту session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, spans моделі та інструментів також можуть
містити обмежені, редаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог діагностичних подій

Події нижче забезпечують метрики та spans вище. Плагіни також можуть підписуватися
на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` — токени, вартість, тривалість, контекст, provider/model/channel,
  ідентифікатори сеансів. `usage` — це облік provider/turn для вартості й телеметрії;
  `context.used` — це поточний знімок prompt/context і може бути нижчим за
  provider `usage.total`, коли задіяні кешований вхід або виклики tool-loop.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: webhooks/queue/session)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  життєвий цикл кожного запуску для harness агента. Містить `harnessId`, необовʼязковий
  `pluginId`, provider/model/channel і run id. Завершення додає
  `durationMs`, `outcome`, необовʼязкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необовʼязковий `cleanupFailed`.

**Exec**

- `exec.process.completed` — кінцевий результат, тривалість, ціль, режим, код виходу
  і тип збою. Текст команди та робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для плагінів або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового debug output без підвищення `logging.level` використовуйте діагностичні
flags. Flags нечутливі до регістру та підтримують wildcards (наприклад, `telegram.*` або
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

Вивід flag надходить до стандартного файлу журналу (`logging.file`) і все одно
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

## Повʼязане

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, CLI tailing і вкладка журналів Control UI
- [Внутрішні механізми журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні flags](/uk/diagnostics/flags) — цільові flags debug-log
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент support-bundle для операторів (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
