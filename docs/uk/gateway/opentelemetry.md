---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви підключаєте трасування, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo або іншого OTLP-бекенду
    - Вам потрібні точні назви метрик, назви спанів або структури атрибутів, щоб створювати дашборди чи сповіщення
summary: Експортуйте діагностику OpenClaw до будь-якого колектора OpenTelemetry через Plugin diagnostics-otel (OTLP/HTTP)
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T09:06:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Будь-який collector або backend, що приймає OTLP/HTTP,
працює без змін у коді. Про локальні файлові журнали та те, як їх читати, див.
[Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** - це структуровані внутрішньопроцесні записи, які
  Gateway і вбудовані plugins генерують для запусків моделі, потоку повідомлень, сеансів, черг
  і exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** і **журнали** через OTLP/HTTP.
- **Виклики провайдера** отримують W3C-заголовок `traceparent` від довіреного
  контексту span виклику моделі OpenClaw, коли транспорт провайдера приймає
  користувацькі заголовки. Контекст трасування, згенерований plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнені і діагностична поверхня, і plugin,
  тому внутрішньопроцесні витрати за замовчуванням залишаються майже нульовими.

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

| Сигнал      | Що до нього входить                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, потоку повідомлень, подій Talk, смуг черг, стану/відновлення сеансів, exec і тиску пам'яті. |
| **Трейси**  | Spans для використання моделі, викликів моделі, життєвого циклу harness, виконання інструментів, exec, обробки webhook/повідомлень, складання контексту та циклів інструментів.              |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP, коли ввімкнено `diagnostics.otel.logs`.                                                           |

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення endpoint для окремих сигналів, які використовуються, коли відповідний конфігураційний ключ `diagnostics.otel.*Endpoint` не задано. Конфігурація для окремого сигналу має пріоритет над env для окремого сигналу, а той має пріоритет над спільним endpoint.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає протокол передавання (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб генерувати найновіший експериментальний атрибут GenAI span (`gen_ai.provider.name`) замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інший preload або процес host уже зареєстрував глобальний OpenTelemetry SDK. Тоді plugin пропускає власний життєвий цикл NodeSDK, але все одно під'єднує діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                |

## Конфіденційність і захоплення вмісту

Сирий вміст моделі/інструментів **не** експортується за замовчуванням. Spans містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, request ids лише як хеші)
і ніколи не включають текст prompt, текст відповіді, входи інструментів, виходи інструментів або
ключі сеансу.
Метрики Talk експортують лише обмежені метадані подій, такі як режим, транспорт,
провайдер і тип події. Вони не включають транскрипти, аудіо payloads,
session ids, turn ids, call ids, room ids або handoff tokens.

Вихідні запити до моделі можуть містити W3C-заголовок `traceparent`. Цей заголовок
генерується лише з діагностичного контексту трасування, що належить OpenClaw, для активного виклику
моделі. Наявні заголовки `traceparent`, надані викликачем, замінюються, тож plugins або
користувацькі параметри провайдера не можуть підробити походження міжсервісного трасування.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш collector і
політика зберігання схвалені для тексту prompt, відповіді, інструмента або системного prompt.
Кожен підключ вмикається окремо:

- `inputMessages` - вміст prompt користувача.
- `outputMessages` - вміст відповіді моделі.
- `toolInputs` - payloads аргументів інструменту.
- `toolOutputs` - payloads результатів інструменту.
- `systemPrompt` - зібраний системний/developer prompt.

Коли будь-який підключ увімкнено, spans моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу.

## Семплювання та скидання

- **Трейси:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** OTLP-журнали враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних записів журналу, а не форматування консолі. Інсталяціям із великим обсягом
  слід віддавати перевагу семплюванню/фільтрації в OTLP collector замість локального семплювання.
- **Кореляція файлових журналів:** файлові JSONL-журнали містять верхньорівневі `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналу містить чинний
  діагностичний контекст трасування, що дає змогу процесорам журналів поєднувати локальні рядки журналу з
  експортованими spans.
- **Кореляція запитів:** HTTP-запити Gateway і WebSocket-кадри створюють
  внутрішню область трасування запиту. Журнали та діагностичні події всередині цієї області
  за замовчуванням успадковують трасування запиту, тоді як spans запуску агента та виклику моделі
  створюються як дочірні, щоб заголовки провайдера `traceparent` залишалися в тому самому трасуванні.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
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

### Talk

- `openclaw.talk.event` (лічильник, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (гістограма, attrs: same as `openclaw.talk.event`; генерується, коли подія Talk повідомляє тривалість)
- `openclaw.talk.audio.bytes` (гістограма, attrs: same as `openclaw.talk.event`; генерується для подій аудіокадрів Talk, які повідомляють довжину в байтах)

### Черги та сеанси

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`; створюється лише для обліку застарілих сеансів без активної роботи)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`; створюється лише для обліку застарілих сеансів без активної роботи)
- `openclaw.session.recovery.requested` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гістограма, атрибути: ті самі, що й у відповідного лічильника відновлення)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Телеметрія активності сеансів

`diagnostics.stuckSessionWarnMs` — це віковий поріг відсутності прогресу для діагностики активності сеансу. Сеанс `processing` не наближається до цього порогу, доки OpenClaw спостерігає прогрес відповіді, інструмента, статусу, блока або середовища виконання ACP. Сигнали підтримання активності під час введення не зараховуються як прогрес, тому мовчазну модель або тестове середовище все одно можна виявити.

OpenClaw класифікує сеанси за роботою, яку він усе ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів усе ще прогресують.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв про нещодавній прогрес. Завислі вбудовані запуски спочатку залишаються лише під спостереженням, а потім виконують abort-drain після `diagnostics.stuckSessionAbortMs` без прогресу, щоб ходи в черзі за цією lane могли продовжитися. Якщо не задано, поріг переривання за замовчуванням використовує безпечніше розширене вікно щонайменше 10 хвилин і 5x `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: облік застарілого сеансу без активної роботи. Це негайно звільняє відповідну lane сеансу.

Відновлення створює структуровані події `session.recovery.requested` і `session.recovery.completed`. Діагностичний стан сеансу позначається як неактивний лише після результату відновлення, що змінює стан (`aborted` або `released`), і лише якщо те саме покоління обробки досі є поточним.

Лише `session.stuck` створює лічильник `openclaw.session.stuck`, гістограму `openclaw.session.stuck_age_ms` і span `openclaw.session.stuck`. Повторні діагностики `session.stuck` виконують backoff, доки сеанс залишається незмінним, тому панелі моніторингу мають сповіщати про сталий приріст, а не про кожен tick Heartbeat. Про параметр конфігурації та значення за замовчуванням див. [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics).

### Життєвий цикл тестового середовища

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` у разі помилок)

### Виконання

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять і цикл інструментів)

- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані spans

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
  - `openclaw.errorCategory` і необов’язковий `openclaw.failureKind` у разі помилок
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (обмежений хеш на основі SHA ідентифікатора запиту upstream-провайдера; сирі ідентифікатори не експортуються)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту prompt, історії, відповіді або ключа сеансу)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно увімкнено, spans моделі й інструментів також можуть містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних класів вмісту, які ви увімкнули.

## Каталог діагностичних подій

Наведені нижче події підтримують метрики та spans вище. Плагіни також можуть підписуватися на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` - токени, вартість, тривалість, контекст, провайдер/модель/канал, ідентифікатори сеансів. `usage` — це облік провайдера/ходу для вартості й телеметрії; `context.used` — це поточний знімок prompt/контексту, який може бути нижчим за `usage.total` провайдера, коли використовується кешоване введення або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: Webhook-и/черга/сеанс)

**Життєвий цикл тестового середовища**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - життєвий цикл кожного запуску для тестового середовища агента. Містить `harnessId`, необов’язковий `pluginId`, провайдера/модель/канал і ідентифікатор запуску. Завершення додає `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected` і лічильники `itemLifecycle`. Помилки додають `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і необов’язковий `cleanupFailed`.

**Виконання**

- `exec.process.completed` - кінцевий результат термінала, тривалість, ціль, режим, код виходу та тип збою. Текст команди й робочі каталоги не включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для плагінів або власних приймачів без запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте прапорці діагностики. Прапорці не чутливі до регістру та підтримують wildcard-и (наприклад, `telegram.*` або `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Або як одноразове перевизначення env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вивід прапорців надходить до стандартного лог-файлу (`logging.file`) і все одно редагується `logging.redactSensitive`. Повний посібник: [Прапорці діагностики](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Ви також можете не додавати `diagnostics-otel` до `plugins.allow` або виконати `openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) - файлові логи, консольний вивід, відстеження через CLI та вкладка Logs у Control UI
- [Внутрішня робота журналювання Gateway](/uk/gateway/logging) - стилі логів WS, префікси підсистем і захоплення консолі
- [Прапорці діагностики](/uk/diagnostics/flags) - цільові прапорці debug-log
- [Експорт діагностики](/uk/gateway/diagnostics) - інструмент support-bundle для оператора (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) - повний довідник полів `diagnostics.*`
