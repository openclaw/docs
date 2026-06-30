---
read_when:
    - Ви хочете надсилати метрики використання моделей OpenClaw, потоку повідомлень або сеансів до колектора OpenTelemetry
    - Ви підключаєте трейси, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви span або форми атрибутів, щоб створювати панелі моніторингу чи сповіщення
summary: Експортуйте діагностику OpenClaw до колекторів OpenTelemetry або stdout JSONL через diagnostics-otel Plugin
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:26:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний Plugin `diagnostics-otel`
із використанням **OTLP/HTTP (protobuf)**. Журнали також можна записувати як stdout JSONL для
конвеєрів журналів контейнерів і пісочниць. Будь-який колектор або бекенд, що приймає
OTLP/HTTP, працює без змін у коді. Про локальні файлові журнали та як їх читати
див. [Ведення журналів](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які створюють
  Gateway і вбудовані plugins для запусків моделей, потоку повідомлень, сеансів, черг
  та exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** та **журнали** через OTLP/HTTP. Він також може
  дублювати діагностичні журнальні записи у stdout JSONL.
- **Виклики провайдерів** отримують W3C-заголовок `traceparent` із контексту
  довіреного span виклику моделі OpenClaw, коли транспорт провайдера приймає користувацькі
  заголовки. Контекст трасування, створений plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнено і діагностичну поверхню, і plugin,
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

| Сигнал      | Що до нього входить                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, failover, використання skill, потоку повідомлень, подій Talk, смуг черг, стану/відновлення сеансу, виконання інструментів, завеликих payload, exec і тиску на пам’ять. |
| **Трейси**  | Span для використання моделі, викликів моделі, життєвого циклу harness, використання skill, виконання інструментів, exec, обробки webhook/повідомлень, складання контексту та циклів інструментів.                                                            |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP або stdout JSONL, коли ввімкнено `diagnostics.otel.logs`; тіла журналів приховуються, якщо захоплення вмісту не ввімкнено явно.                                |

Перемикайте `traces`, `metrics` і `logs` незалежно. Трейси та метрики
вмикаються за замовчуванням, коли `diagnostics.otel.enabled` має значення true. Журнали за замовчуванням вимкнені та
експортуються лише коли `diagnostics.otel.logs` явно має значення `true`. Експорт журналів
за замовчуванням використовує OTLP; встановіть `diagnostics.otel.logsExporter` у `stdout` для JSONL у
stdout або `both`, щоб надсилати кожен діагностичний журнальний запис до OTLP і stdout.

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

### Змінні середовища

| Змінна                                                                                                          | Призначення                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Перевизначає `diagnostics.otel.endpoint`. Якщо значення вже містить `/v1/traces`, `/v1/metrics` або `/v1/logs`, воно використовується як є.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення кінцевих точок для конкретних сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для конкретного сигналу має пріоритет над env для конкретного сигналу, а той має пріоритет над спільною кінцевою точкою.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає дротовий протокол (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Встановіть `gen_ai_latest_experimental`, щоб створювати найновішу експериментальну форму span для GenAI inference, включно з назвами span `{gen_ai.operation.name} {gen_ai.request.model}`, видом span `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Встановіть `1`, коли інший preload або процес-хост уже зареєстрував глобальний OpenTelemetry SDK. Тоді plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                                                                                                                    |

## Приватність і захоплення вмісту

Сирий вміст моделі/інструменту **не** експортується за замовчуванням. Span містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, request ids лише у вигляді хешів,
джерело інструмента, власник інструмента та назва/джерело skill) і ніколи не включають текст prompt,
текст відповіді, вхідні дані інструментів, вихідні дані інструментів, шляхи файлів skill або ключі сеансів.
Журнальні записи OTLP за замовчуванням зберігають severity, logger, розташування в коді, довірений контекст трасування
та санітизовані атрибути, але сире тіло журнального повідомлення експортується
лише коли `diagnostics.otel.captureContent` встановлено у булеве `true`. Детальні
підключі `captureContent.*` не вмикають тіла журналів. Мітки, схожі на
scoped ключі сеансів агентів, замінюються на `unknown`.
Метрики Talk експортують лише обмежені метадані подій, як-от режим, transport,
provider і тип події. Вони не включають транскрипти, audio payloads,
session ids, turn ids, call ids, room ids або handoff tokens.

Вихідні запити до моделей можуть містити W3C-заголовок `traceparent`. Цей заголовок
створюється лише з діагностичного контексту трасування, що належить OpenClaw, для активного виклику моделі.
Наявні надані викликачем заголовки `traceparent` замінюються, тому plugins або
користувацькі параметри провайдера не можуть підробити міжсервісне походження трасування.

Встановлюйте `diagnostics.otel.captureContent.*` у `true` лише коли ваш колектор і
політика зберігання схвалені для тексту prompt, відповіді, інструменту або системного prompt.
Кожен підключ вмикається незалежно:

- `inputMessages` - вміст user prompt.
- `outputMessages` - вміст відповіді моделі.
- `toolInputs` - payload аргументів інструмента.
- `toolOutputs` - payload результатів інструмента.
- `systemPrompt` - зібраний system/developer prompt.
- `toolDefinitions` - назви, описи та схеми інструментів моделі.

Коли ввімкнено будь-який підключ, span моделей та інструментів отримують обмежені, редаговані
атрибути `openclaw.content.*` лише для цього класу. Використовуйте булеве
`captureContent: true` лише для широких діагностичних захоплень, де тіла журнальних
повідомлень OTLP також схвалені для експорту.

Вміст `toolInputs`/`toolOutputs` захоплюється для виконань інструментів вбудованого runtime агента
(`openclaw.content.tool_input` на завершених/error span,
`openclaw.content.tool_output` на завершених span). Виклики інструментів зовнішніх harness
(Codex, Claude CLI) створюють span `tool.execution.*` без payload вмісту.
Захоплений вміст передається довіреним каналом лише для слухачів і ніколи не розміщується
на публічній шині діагностичних подій.

## Семплінг і скидання

- **Трейси:** `diagnostics.otel.sampleRate` (лише кореневий span, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** OTLP-журнали враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних записів журналу, а не консольне форматування. Встановлення з великим обсягом
  мають віддавати перевагу семплінгу/фільтруванню в OTLP collector замість локального семплінгу.
  Установіть `diagnostics.otel.logsExporter: "stdout"`, коли ваша платформа вже
  надсилає stdout/stderr до обробника журналів і у вас немає OTLP logs
  collector. Записи stdout — це один JSON-об’єкт на рядок із `ts`, `signal`,
  `service.name`, severity, body, відредагованими атрибутами та довіреними полями трейсу,
  коли вони доступні.
- **Кореляція файлових журналів:** файлові журнали JSONL містять верхньорівневі `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналювання має дійсний
  діагностичний контекст трейсу, що дає змогу обробникам журналів поєднувати локальні рядки журналу з
  експортованими span.
- **Кореляція запитів:** HTTP-запити Gateway і WebSocket-фрейми створюють
  внутрішню область трейсу запиту. Журнали й діагностичні події в цій області
  типово успадковують трейс запиту, а span запуску агента й викликів моделі
  створюються як дочірні, щоб заголовки `traceparent` провайдера залишалися в тому самому трейсі.
- **Кореляція викликів моделі:** span `openclaw.model.call` типово містять безпечні розміри
  компонентів промпта й містять атрибути токенів для кожного виклику, коли
  результат провайдера надає usage. `openclaw.model.usage` залишається span обліку
  на рівні запуску для агрегованої вартості, контексту й панелей каналів; він залишається
  на тому самому діагностичному трейсі, коли середовище виконання, що його емітує, має довірений контекст
  трейсу.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, атрибути: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а також `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір у байтах UTF-8 фінального payload запиту моделі; без вмісту сирого payload)
- `openclaw.model_call.response_bytes` (гістограма, розмір у байтах UTF-8 payload фрагментів потокової відповіді; високочастотний текст, мислення та дельти викликів інструментів рахують лише інкрементальні байти `delta`; без вмісту сирої відповіді)
- `openclaw.model_call.time_to_first_byte_ms` (гістограма, час, що минув до першої події потокової відповіді)
- `openclaw.model.failover` (лічильник, атрибути: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (лічильник, атрибути: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, необов’язковий `openclaw.agent`, необов’язковий `openclaw.toolName`)

### Потік повідомлень

- `openclaw.webhook.received` (лічильник, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (лічильник, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (лічильник, атрибути: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (лічильник, атрибути: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (лічильник, атрибути: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (лічильник, атрибути: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (лічильник, атрибути: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (лічильник, атрибути: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Розмова

- `openclaw.talk.event` (лічильник, атрибути: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (гістограма, атрибути: ті самі, що й у `openclaw.talk.event`; емітується, коли подія Розмови повідомляє тривалість)
- `openclaw.talk.audio.bytes` (гістограма, атрибути: ті самі, що й у `openclaw.talk.event`; емітується для подій аудіофреймів Розмови, які повідомляють довжину в байтах)

### Черги й сеанси

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`; емітується для відновлюваного застарілого обліку сеансів)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`; емітується для відновлюваного застарілого обліку сеансів)
- `openclaw.session.turn.created` (лічильник, атрибути: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гістограма, атрибути: ті самі, що й у відповідному лічильнику відновлення)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Телеметрія активності сеансу

`diagnostics.stuckSessionWarnMs` — це поріг віку без прогресу для діагностики
активності сеансу. Сеанс `processing` не наближається до цього порогу,
поки OpenClaw спостерігає прогрес відповіді, інструмента, статусу, блока або середовища виконання ACP.
Typing keepalives не рахуються як прогрес, тому мовчазну модель або harness
усе ще можна виявити.

OpenClaw класифікує сеанси за роботою, яку він ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів
  усе ще просуваються. Власні виклики моделі, які мовчать довше за
  `diagnostics.stuckSessionWarnMs`, також повідомляються як довготривалі до
  `diagnostics.stuckSessionAbortMs`, щоб повільні або непотокові провайдери моделей не
  виглядали як завислі сеанси Gateway, поки для них усе ще можна спостерігати abort.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв
  про недавній прогрес. Власні виклики моделі перемикаються з `session.long_running` на
  `session.stalled` на рівні або після `diagnostics.stuckSessionAbortMs`; безвласна
  застаріла активність моделі/інструмента не розглядається як нешкідлива довготривала робота.
  Завислі вбудовані запуски спочатку залишаються лише для спостереження, а потім abort-drain після
  `diagnostics.stuckSessionAbortMs` без прогресу, щоб поставлені в чергу turns позаду
  lane могли відновитися. Якщо не задано, поріг abort типово дорівнює безпечнішому
  розширеному вікну щонайменше 5 хвилин і 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: застарілий облік сеансу без активної роботи або неактивний
  поставлений у чергу сеанс із застарілою безвласною активністю моделі/інструмента. Це звільняє
  відповідну lane сеансу одразу після проходження gate відновлення.

Відновлення емітує структуровані події `session.recovery.requested` і
`session.recovery.completed`. Діагностичний стан сеансу позначається як idle
лише після мутаційного результату відновлення (`aborted` або `released`) і лише якщо
та сама processing generation усе ще актуальна.

Лише `session.stuck` емітує лічильник `openclaw.session.stuck`,
гістограму `openclaw.session.stuck_age_ms` і span `openclaw.session.stuck`.
Повторні діагностики `session.stuck` мають backoff, поки сеанс залишається
незмінним, тому панелі мають сповіщати про сталі збільшення, а не про кожен
тик Heartbeat. Для параметра конфігурації та типових значень див.
[Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics).

Попередження активності також емітують:

- `openclaw.liveness.warning` (лічильник, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гістограма, атрибути: `openclaw.liveness.reason`)

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` у разі помилок)

### Виконання інструментів

- `openclaw.tool.execution.duration_ms` (гістограма, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, а також `openclaw.errorCategory` у разі помилок)
- `openclaw.tool.execution.blocked` (лічильник, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять і цикл інструментів)

- `openclaw.payload.large` (лічильник, атрибути: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (гістограма, атрибути: ті самі, що й у `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані span

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
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (лише безпечні розміри компонентів, без тексту промпта)
  - `openclaw.model_call.usage.*` і `gen_ai.usage.*`, коли результат виклику моделі містить дані використання провайдера для цього окремого виклику
  - `openclaw.provider.request_id_hash` (обмежений SHA-хеш ідентифікатора запиту до вхідного провайдера; необроблені ідентифікатори не експортуються)
  - З `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` спани виклику моделі використовують найновішу назву спана інференсу GenAI `{gen_ai.operation.name} {gen_ai.request.model}` і тип спана `CLIENT` замість `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту промпта, історії, відповіді або ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, спани моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог діагностичних подій

Наведені нижче події підтримують зазначені вище метрики та спани. Plugins також можуть підписуватися
на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` - токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сесій. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — це поточний знімок промпта/контексту, і він може бути меншим за
  `usage.total` провайдера, коли задіяні кешований ввід або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сесія**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: вебхуки/черга/сесія)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  життєвий цикл окремого запуску для harness агента. Містить `harnessId`, необов’язковий
  `pluginId`, провайдера/модель/канал і ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` - термінальний результат, тривалість, ціль, режим, код виходу
  і тип збою. Текст команди та робочі каталоги не
  включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для Plugins або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового виводу налагодження без підвищення `logging.level` використовуйте діагностичні
прапорці. Прапорці нечутливі до регістру та підтримують символи узагальнення (наприклад, `telegram.*` або
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

Ви також можете не додавати `diagnostics-otel` до `plugins.allow` або виконати
`openclaw plugins disable diagnostics-otel`.

## Пов’язане

- [Журналювання](/uk/logging) - журнали у файлі, вивід у консоль, відстеження через CLI і вкладка Logs в інтерфейсі Control UI
- [Внутрішні механізми журналювання Gateway](/uk/gateway/logging) - стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) - цільові прапорці журналів налагодження
- [Експорт діагностики](/uk/gateway/diagnostics) - операторський інструмент support-bundle (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) - повний довідник полів `diagnostics.*`
