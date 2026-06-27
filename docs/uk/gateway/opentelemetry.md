---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до збирача OpenTelemetry
    - Ви підключаєте трасування, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви span або форми атрибутів, щоб створювати дашборди чи сповіщення
summary: Експортуйте діагностику OpenClaw до колекторів OpenTelemetry або stdout JSONL через Plugin diagnostics-otel
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:34:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний Plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Журнали також можна записувати як stdout JSONL для
конвеєрів журналів контейнерів і sandbox. Будь-який колектор або backend, що приймає
OTLP/HTTP, працює без змін у коді. Про локальні файлові журнали та як їх читати
див. [Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які
  Gateway і вбудовані Plugin генерують для запусків моделей, потоку повідомлень, сесій, черг
  і exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** і **журнали** через OTLP/HTTP. Він також може
  дублювати діагностичні записи журналів у stdout JSONL.
- **Виклики провайдерів** отримують W3C-заголовок `traceparent` із контексту
  довіреного span виклику моделі OpenClaw, коли транспорт провайдера приймає власні
  заголовки. Контекст трасування, згенерований Plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнено і діагностичну поверхню, і Plugin,
  тому внутрішньопроцесна вартість за замовчуванням залишається майже нульовою.

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

Ви також можете ввімкнути Plugin з CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, failover, використання Skills, потоку повідомлень, подій Talk, lanes черг, стану/відновлення сесій, виконання інструментів, завеликих payload, exec і тиску на пам’ять. |
| **Трейси**  | Spans для використання моделей, викликів моделей, життєвого циклу harness, використання Skills, виконання інструментів, exec, обробки webhook/повідомлень, складання контексту та циклів інструментів.                                                            |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP або stdout JSONL, коли `diagnostics.otel.logs` увімкнено; тіла журналів приховуються, якщо захоплення вмісту явно не ввімкнено.                                |

Перемикайте `traces`, `metrics` і `logs` незалежно. Трейси та метрики
за замовчуванням увімкнені, коли `diagnostics.otel.enabled` має значення true. Журнали за замовчуванням вимкнені та
експортуються лише тоді, коли `diagnostics.otel.logs` явно дорівнює `true`. Експорт журналів
за замовчуванням використовує OTLP; установіть `diagnostics.otel.logsExporter` у `stdout` для JSONL у
stdout або `both`, щоб надсилати кожен діагностичний запис журналу до OTLP і stdout.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення endpoints для конкретних сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для конкретного сигналу має пріоритет над env для конкретного сигналу, а той має пріоритет над спільним endpoint.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає wire-протокол (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб генерувати найновішу експериментальну форму GenAI inference span, зокрема назви spans `{gen_ai.operation.name} {gen_ai.request.model}`, тип span `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю незалежно від цього. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інший preload або host-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно під’єднує діагностичні listeners і враховує `traces`/`metrics`/`logs`.                                                                                                                    |

## Приватність і захоплення вмісту

Сирий вміст моделі/інструментів **не** експортується за замовчуванням. Spans несуть обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, request ids лише як hashes,
джерело інструмента, власник інструмента та назва/джерело Skills) і ніколи не містять текст prompt,
текст відповіді, inputs інструментів, outputs інструментів, шляхи до файлів Skills або ключі сесій.
Записи журналів OTLP за замовчуванням зберігають severity, logger, розташування в коді, довірений trace context
і очищені атрибути, але сире тіло повідомлення журналу експортується
лише коли `diagnostics.otel.captureContent` встановлено в boolean `true`. Деталізовані
підключі `captureContent.*` не вмикають тіла журналів. Labels, схожі на
scoped ключі сесій agent, замінюються на `unknown`.
Метрики Talk експортують лише обмежені метадані подій, як-от режим, транспорт,
провайдер і тип події. Вони не містять transcripts, audio payloads,
session ids, turn ids, call ids, room ids або handoff tokens.

Вихідні запити до моделей можуть містити W3C-заголовок `traceparent`. Цей заголовок
генерується лише з діагностичного контексту трасування, що належить OpenClaw, для активного виклику моделі.
Наявні `traceparent`-заголовки, надані caller, замінюються, тому Plugin або
власні опції провайдера не можуть підробити міжсервісне походження trace.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише коли ваш collector і
політика зберігання затверджені для тексту prompt, response, tool або system-prompt.
Кожен підключ вмикається незалежно:

- `inputMessages` - вміст prompt користувача.
- `outputMessages` - вміст відповіді моделі.
- `toolInputs` - payload аргументів інструментів.
- `toolOutputs` - payload результатів інструментів.
- `systemPrompt` - зібраний system/developer prompt.
- `toolDefinitions` - назви, описи та schemas інструментів моделі.

Коли будь-який підключ увімкнено, spans моделі та інструментів отримують обмежені, редаговані
атрибути `openclaw.content.*` лише для цього класу. Використовуйте boolean
`captureContent: true` лише для широких діагностичних захоплень, де тіла повідомлень журналів OTLP
також затверджені для експорту.

Вміст `toolInputs`/`toolOutputs` захоплюється для виконань інструментів
вбудованого agent runtime (`openclaw.content.tool_input` на completed/error spans,
`openclaw.content.tool_output` на completed spans). Зовнішні виклики інструментів harness
(Codex, Claude CLI) генерують spans `tool.execution.*` без payloads вмісту.
Захоплений вміст проходить довіреним каналом лише для listeners і ніколи не розміщується
на публічній шині діагностичних подій.

## Sampling і flushing

- **Трейси:** `diagnostics.otel.sampleRate` (лише root-span, `0.0` відкидає все,
  `1.0` зберігає все).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних log-records, а не форматування консолі. Інсталяціям із великим обсягом
  слід надавати перевагу sampling/filtering у колекторі OTLP замість локального sampling.
  Установіть `diagnostics.otel.logsExporter: "stdout"`, коли ваша платформа вже
  надсилає stdout/stderr до log processor і у вас немає collector журналів OTLP.
  Записи stdout — це один JSON-об’єкт на рядок із `ts`, `signal`,
  `service.name`, severity, body, редагованими атрибутами та довіреними полями trace,
  коли вони доступні.
- **Кореляція файлових журналів:** JSONL файлові журнали містять top-level `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналу має дійсний
  діагностичний trace context, що дає змогу log processors об’єднувати локальні рядки журналів з
  експортованими spans.
- **Кореляція запитів:** HTTP-запити Gateway і WebSocket frames створюють
  внутрішню request trace scope. Журнали та діагностичні події в цій scope
  за замовчуванням успадковують trace запиту, тоді як spans запуску agent і виклику моделі
  створюються як дочірні, щоб `traceparent`-заголовки провайдера залишалися в тому самому trace.

## Експортовані метрики

### Використання моделей

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, атрибути: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а також `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір фінального корисного навантаження запиту до моделі в байтах UTF-8; без необробленого вмісту корисного навантаження)
- `openclaw.model_call.response_bytes` (гістограма, розмір корисного навантаження фрагментів потокової відповіді в байтах UTF-8; високочастотний текст, роздуми та дельти викликів інструментів рахують лише інкрементні байти `delta`; без необробленого вмісту відповіді)
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
- `openclaw.talk.event.duration_ms` (гістограма, атрибути: ті самі, що й у `openclaw.talk.event`; випромінюється, коли подія розмови повідомляє тривалість)
- `openclaw.talk.audio.bytes` (гістограма, атрибути: ті самі, що й у `openclaw.talk.event`; випромінюється для подій аудіокадрів розмови, які повідомляють довжину в байтах)

### Черги та сеанси

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`; випромінюється для відновлюваного застарілого обліку сеансів)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`; випромінюється для відновлюваного застарілого обліку сеансів)
- `openclaw.session.turn.created` (лічильник, атрибути: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гістограма, атрибути: ті самі, що й у відповідного лічильника відновлення)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Телеметрія активності сеансу

`diagnostics.stuckSessionWarnMs` — це поріг віку без прогресу для діагностики
активності сеансу. Сеанс `processing` не наближається до цього порога,
доки OpenClaw спостерігає прогрес відповіді, інструмента, статусу, блока або середовища виконання ACP.
Підтримувальні сигнали набору тексту не вважаються прогресом, тому мовчазну модель або середовище запуску
все ще можна виявити.

OpenClaw класифікує сеанси за роботою, яку він ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів
  усе ще просуваються. Власні виклики моделі, які мовчать довше за
  `diagnostics.stuckSessionWarnMs`, також повідомляються як тривалі перед
  `diagnostics.stuckSessionAbortMs`, щоб повільні або непотокові постачальники моделей
  не виглядали як завислі сеанси Gateway, доки вони залишаються спостережуваними для переривання.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв
  нещодавнього прогресу. Власні виклики моделі перемикаються з `session.long_running` на
  `session.stalled` на або після `diagnostics.stuckSessionAbortMs`; застаріла
  активність моделі/інструментів без власника не вважається нешкідливою тривалою роботою.
  Завислі вбудовані запуски спершу залишаються лише спостережуваними, а потім перериваються й осушуються після
  `diagnostics.stuckSessionAbortMs` без прогресу, щоб поставлені в чергу ходи позаду цієї
  смуги могли відновитися. Якщо не задано, поріг переривання за замовчуванням отримує безпечніше
  розширене вікно щонайменше 5 хвилин і 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: застарілий облік сеансу без активної роботи або неактивний
  сеанс у черзі із застарілою активністю моделі/інструментів без власника. Це звільняє
  уражену смугу сеансу одразу після проходження шлюзів відновлення.

Відновлення випромінює структуровані події `session.recovery.requested` і
`session.recovery.completed`. Діагностичний стан сеансу позначається як неактивний
лише після мутаційного результату відновлення (`aborted` або `released`) і лише якщо
те саме покоління обробки все ще поточне.

Лише `session.stuck` випромінює лічильник `openclaw.session.stuck`,
гістограму `openclaw.session.stuck_age_ms` і проміжок `openclaw.session.stuck`.
Повторні діагностики `session.stuck` застосовують відступ, доки сеанс залишається
незмінним, тому панелі моніторингу мають сповіщати про сталі збільшення, а не про кожен
такт Heartbeat. Щодо параметра конфігурації та значень за замовчуванням див.
[Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics).

Попередження активності також випромінюють:

- `openclaw.liveness.warning` (лічильник, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гістограма, атрибути: `openclaw.liveness.reason`)

### Життєвий цикл середовища виконання

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` для помилок)

### Виконання інструмента

- `openclaw.tool.execution.duration_ms` (гістограма, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, а також `openclaw.errorCategory` для помилок)
- `openclaw.tool.execution.blocked` (лічильник, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Виконання команд

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять і цикл інструментів)

- `openclaw.payload.large` (лічильник, атрибути: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (гістограма, атрибути: ті самі, що й у `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (гістограма, атрибути: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (гістограма)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (лічильник, атрибути: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (гістограма, атрибути: `openclaw.toolName`, `openclaw.outcome`)

## Експортовані проміжки

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
  - `openclaw.provider.request_id_hash` (обмежений хеш на основі SHA для ідентифікатора запиту до вищестоящого провайдера; необроблені ідентифікатори не експортуються)
  - З `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` спани викликів моделі використовують найновішу назву спана інференсу GenAI `{gen_ai.operation.name} {gen_ai.request.model}` і вид спана `CLIENT` замість `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту промпта, історії, відповіді або ключа сеансу)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, спани моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог діагностичних подій

Події нижче підтримують наведені вище метрики та спани. Plugins також можуть
підписуватися на них напряму без експорту OTLP.

**Використання моделі**

- `model.usage` - токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сеансів. `usage` — це облік провайдера/ходу для вартості й телеметрії;
  `context.used` — це поточний знімок промпта/контексту, і він може бути нижчим за
  `usage.total` провайдера, коли задіяно кешований ввід або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: Webhook/черга/сеанс)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  життєвий цикл кожного запуску для harness агента. Містить `harnessId`, необов’язковий
  `pluginId`, провайдер/модель/канал і ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` - термінальний результат, тривалість, ціль, режим, код
  виходу та тип збою. Текст команди й робочі каталоги не
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
прапорці. Прапорці не враховують регістр і підтримують символи підстановки (наприклад, `telegram.*` або
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Або як одноразове перевизначення через змінну середовища:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вивід прапорців записується до стандартного файлу журналу (`logging.file`) і все одно
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

- [Журналювання](/uk/logging) - файлові журнали, консольний вивід, стеження через CLI та вкладка Logs у Control UI
- [Внутрішні механізми журналювання Gateway](/uk/gateway/logging) - стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) - цільові прапорці налагоджувального журналу
- [Експорт діагностики](/uk/gateway/diagnostics) - інструмент оператора для пакета підтримки (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) - повний довідник полів `diagnostics.*`
