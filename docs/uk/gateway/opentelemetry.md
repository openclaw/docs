---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви підключаєте трасування, метрики або журнали до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого бекенда OTLP
    - Вам потрібні точні назви метрик, назви span або форми атрибутів, щоб створювати панелі моніторингу чи сповіщення
summary: Експортуйте діагностику OpenClaw до колекторів OpenTelemetry або stdout JSONL через Plugin diagnostics-otel
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T08:31:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностику через офіційний Plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Журнали також можна записувати як stdout JSONL для
контейнерних і sandbox-конвеєрів журналів. Будь-який collector або backend, що приймає
OTLP/HTTP, працює без змін у коді. Про локальні файлові журнали та як їх читати
див. [Журналювання](/uk/logging).

## Як це працює разом

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які створюють
  Gateway і вбудовані Plugin-и для запусків моделей, потоку повідомлень, сеансів, черг
  і exec.
- **Plugin `diagnostics-otel`** підписується на ці події та експортує їх як
  OpenTelemetry **метрики**, **трейси** і **журнали** через OTLP/HTTP. Він також може
  дублювати діагностичні записи журналу в stdout JSONL.
- **Виклики провайдера** отримують W3C-заголовок `traceparent` від довіреного
  контексту span виклику моделі OpenClaw, коли транспорт провайдера приймає власні
  заголовки. Контекст трасування, створений Plugin-ом, не поширюється.
- Exporter-и підключаються лише тоді, коли ввімкнені і діагностична поверхня, і Plugin,
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

Ви також можете ввімкнути Plugin із CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` наразі підтримує лише `http/protobuf`. `grpc` ігнорується.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники та гістограми для використання токенів, вартості, тривалості запуску, failover, використання Skills, потоку повідомлень, подій Talk, смуг черг, стану/відновлення сеансу, виконання інструментів, завеликих payload-ів, exec і тиску на пам’ять. |
| **Трейси**  | Span-и для використання моделей, викликів моделей, життєвого циклу harness, використання Skills, виконання інструментів, exec, обробки webhook/повідомлень, складання контексту та циклів інструментів.                                                            |
| **Журнали**    | Структуровані записи `logging.file`, експортовані через OTLP або stdout JSONL, коли ввімкнено `diagnostics.otel.logs`; тіла журналів не передаються, якщо захоплення вмісту явно не ввімкнено.                                |

Перемикайте `traces`, `metrics` і `logs` незалежно. Трейси та метрики
за замовчуванням увімкнені, коли `diagnostics.otel.enabled` має значення true. Журнали
за замовчуванням вимкнені й експортуються лише тоді, коли `diagnostics.otel.logs` явно має значення `true`. Експорт журналів
за замовчуванням іде в OTLP; встановіть `diagnostics.otel.logsExporter` у `stdout` для JSONL у
stdout або `both`, щоб надсилати кожен діагностичний запис журналу в OTLP і stdout.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Перевизначення endpoint для конкретних сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для конкретного сигналу має пріоритет над env для конкретного сигналу, а та має пріоритет над спільним endpoint.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Перевизначає `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Перевизначає мережевий протокол (сьогодні враховується лише `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть `gen_ai_latest_experimental`, щоб створювати найновішу експериментальну форму span GenAI inference, зокрема назви span `{gen_ai.operation.name} {gen_ai.request.model}`, тип span `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Метрики GenAI завжди використовують обмежені семантичні атрибути з низькою кардинальністю. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть `1`, коли інший preload або host-процес уже зареєстрував глобальний OpenTelemetry SDK. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні listener-и та враховує `traces`/`metrics`/`logs`.                                                                                                                    |

## Приватність і захоплення вмісту

Сирий вміст моделі/інструментів **не** експортується за замовчуванням. Span-и містять обмежені
ідентифікатори (канал, провайдер, модель, категорія помилки, ідентифікатори запитів лише як hash,
джерело інструмента, власник інструмента та назва/джерело Skills) і ніколи не містять текст prompt,
текст відповіді, inputs інструментів, outputs інструментів, шляхи до файлів Skills або ключі сеансів.
Записи журналу OTLP за замовчуванням зберігають severity, logger, розташування коду, довірений контекст трасування
і санітизовані атрибути, але сире тіло повідомлення журналу експортується
лише коли `diagnostics.otel.captureContent` встановлено в boolean `true`. Деталізовані
підключі `captureContent.*` не вмикають тіла журналів. Мітки, що виглядають як
ключі scoped agent session, замінюються на `unknown`.
Метрики Talk експортують лише обмежені метадані подій, як-от mode, transport,
provider і event type. Вони не містять transcripts, audio payloads,
session ids, turn ids, call ids, room ids або handoff tokens.

Вихідні запити моделі можуть містити W3C-заголовок `traceparent`. Цей заголовок
створюється лише з діагностичного контексту трасування, що належить OpenClaw, для активного виклику моделі.
Наявні заголовки `traceparent`, надані викликачем, замінюються, тому Plugin-и або
власні опції провайдера не можуть підробити походження трасування між сервісами.

Установлюйте `diagnostics.otel.captureContent.*` у `true` лише тоді, коли ваш collector і
політика зберігання схвалені для тексту prompt, відповіді, інструмента або system-prompt.
Кожен підключ вмикається незалежно:

- `inputMessages` - вміст prompt користувача.
- `outputMessages` - вміст відповіді моделі.
- `toolInputs` - payload-и аргументів інструмента.
- `toolOutputs` - payload-и результатів інструмента.
- `systemPrompt` - зібраний system/developer prompt.
- `toolDefinitions` - назви, описи та схеми інструментів моделі.

Коли будь-який підключ увімкнено, span-и моделі та інструментів отримують обмежені, відредаговані
атрибути `openclaw.content.*` лише для цього класу. Використовуйте boolean
`captureContent: true` лише для широких діагностичних захоплень, де тіла повідомлень журналів OTLP
також схвалені для експорту.

Вміст `toolInputs`/`toolOutputs` захоплюється для виконань інструментів вбудованого агентного runtime
(`openclaw.content.tool_input` на completed/error span-ах,
`openclaw.content.tool_output` на completed span-ах). Виклики інструментів зовнішніх harness-ів
(Codex, Claude CLI) створюють span-и `tool.execution.*` без content payloads.
Захоплений вміст передається довіреним каналом лише для listener-ів і ніколи не потрапляє
в публічну шину діагностичних подій.

## Семплінг і скидання

- **Траси:** `diagnostics.otel.sampleRate` (лише кореневий span, `0.0` відкидає всі,
  `1.0` зберігає всі).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (мінімум `1000`).
- **Логи:** логи OTLP враховують `logging.level` (рівень файлового журналу). Вони використовують
  шлях редагування діагностичних записів журналу, а не форматування консолі. Інсталяціям із великим
  обсягом даних варто надавати перевагу семплінгу/фільтруванню в колекторі OTLP замість локального семплінгу.
  Установіть `diagnostics.otel.logsExporter: "stdout"`, коли ваша платформа вже
  надсилає stdout/stderr до обробника логів і у вас немає колектора логів OTLP.
  Записи stdout — це один об’єкт JSON на рядок із `ts`, `signal`,
  `service.name`, серйозністю, тілом, відредагованими атрибутами та довіреними полями траси,
  коли вони доступні.
- **Кореляція файлових логів:** файлові логи JSONL містять поля верхнього рівня `traceId`,
  `spanId`, `parentSpanId` і `traceFlags`, коли виклик журналювання передає чинний
  діагностичний контекст траси, що дає змогу обробникам логів поєднувати локальні рядки журналу з
  експортованими spans.
- **Кореляція запитів:** HTTP-запити Gateway і WebSocket-кадри створюють
  внутрішню область траси запиту. Логи й діагностичні події в цій області
  типово успадковують трасу запиту, а spans запуску агента й виклику моделі
  створюються як дочірні, щоб заголовки `traceparent` провайдера залишалися в тій самій трасі.
- **Кореляція викликів моделі:** spans `openclaw.model.call` типово містять безпечні розміри
  компонентів промпта й містять атрибути токенів для кожного виклику, коли
  результат провайдера надає дані використання. `openclaw.model.usage` залишається span обліку на рівні запуску
  для агрегованої вартості, контексту й панелей каналу; він залишається
  в тій самій діагностичній трасі, коли середовище виконання, що його створює, має довірений контекст траси.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, атрибути: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а також `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір остаточного payload запиту до моделі в байтах UTF-8; без вмісту сирого payload)
- `openclaw.model_call.response_bytes` (гістограма, розмір payload фрагментів потокової відповіді в байтах UTF-8; високочастотний текст, міркування й дельти викликів інструментів рахують лише інкрементні байти `delta`; без вмісту сирої відповіді)
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
- `openclaw.talk.event.duration_ms` (гістограма, атрибути: ті самі, що й у `openclaw.talk.event`; створюється, коли подія розмови повідомляє тривалість)
- `openclaw.talk.audio.bytes` (гістограма, атрибути: ті самі, що й у `openclaw.talk.event`; створюється для подій аудіокадрів розмови, які повідомляють довжину в байтах)

### Черги та сеанси

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`; створюється для відновлюваного застарілого обліку сеансів)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`; створюється для відновлюваного застарілого обліку сеансів)
- `openclaw.session.turn.created` (лічильник, атрибути: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гістограма, атрибути: ті самі, що й у відповідного лічильника відновлення)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Телеметрія життєздатності сеансу

`diagnostics.stuckSessionWarnMs` — це поріг віку без прогресу для діагностики
життєздатності сеансу. Сеанс `processing` не наближається до цього порога,
поки OpenClaw спостерігає прогрес відповіді, інструмента, статусу, блока або середовища виконання ACP.
Keepalive-події введення не рахуються як прогрес, тому мовчазну модель або harness
все одно можна виявити.

OpenClaw класифікує сеанси за роботою, яку він ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики інструментів
  усе ще прогресують. Власні виклики моделі, які мовчать довше за
  `diagnostics.stuckSessionWarnMs`, також повідомляються як довготривалі перед
  `diagnostics.stuckSessionAbortMs`, щоб повільні або непотокові провайдери моделей
  не виглядали як завислі сеанси Gateway, доки для них усе ще можна спостерігати скасування.
- `session.stalled`: активна робота існує, але активний запуск не повідомляв
  нещодавнього прогресу. Власні виклики моделі переходять із `session.long_running` до
  `session.stalled` на або після `diagnostics.stuckSessionAbortMs`; застаріла активність моделі/інструмента
  без власника не вважається нешкідливою довготривалою роботою.
  Завислі вбудовані запуски спершу залишаються лише для спостереження, а потім abort-drain після
  `diagnostics.stuckSessionAbortMs` без прогресу, щоб ходи в черзі позаду цього lane
  могли відновитися. Якщо не задано, поріг скасування типово дорівнює безпечнішому
  розширеному вікну щонайменше 5 хвилин і 3x
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: застарілий облік сеансів без активної роботи або простоюючий
  сеанс у черзі із застарілою активністю моделі/інструмента без власника. Це звільняє
  відповідний lane сеансу одразу після проходження шлюзів відновлення.

Відновлення створює структуровані події `session.recovery.requested` і
`session.recovery.completed`. Діагностичний стан сеансу позначається як idle
лише після мутувального результату відновлення (`aborted` або `released`) і лише якщо
та сама generation обробки все ще є поточною.

Лише `session.stuck` створює лічильник `openclaw.session.stuck`,
гістограму `openclaw.session.stuck_age_ms` і span `openclaw.session.stuck`.
Повторні діагностики `session.stuck` відступають, поки сеанс залишається
незмінним, тому панелі мають сигналізувати про сталі зростання, а не про кожен
тик Heartbeat. Для параметра конфігурації та типових значень див.
[Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics).

Попередження життєздатності також створюють:

- `openclaw.liveness.warning` (лічильник, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гістограма, атрибути: `openclaw.liveness.reason`)

### Життєвий цикл harness

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` для помилок)

### Виконання інструментів

- `openclaw.tool.execution.duration_ms` (гістограма, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, а також `openclaw.errorCategory` для помилок)
- `openclaw.tool.execution.blocked` (лічильник, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Виконання

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять і цикл інструментів)

- `openclaw.payload.large` (лічильник, атрибути: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (гістограма, атрибути: ті самі, що й у `openclaw.payload.large`)
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
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (лише безпечні розміри компонентів, без тексту prompt)
  - `openclaw.model_call.usage.*` і `gen_ai.usage.*`, коли результат виклику моделі містить дані використання провайдера для цього окремого виклику
  - `openclaw.provider.request_id_hash` (обмежений SHA-хеш ідентифікатора запиту до upstream-провайдера; необроблені ідентифікатори не експортуються)
  - З `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` spans викликів моделі використовують найновішу назву inference span GenAI `{gen_ai.operation.name} {gen_ai.request.model}` і span kind `CLIENT` замість `openclaw.model.call`.
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту prompt, історії, відповіді або ключа сесії)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (без повідомлень циклу, параметрів або виводу інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

Коли захоплення вмісту явно ввімкнено, spans моделі та інструментів також можуть
містити обмежені, відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог діагностичних подій

Наведені нижче події підтримують метрики та spans вище. Plugins також можуть
підписуватися на них безпосередньо без експорту OTLP.

**Використання моделі**

- `model.usage` - токени, вартість, тривалість, контекст, провайдер/модель/канал,
  ідентифікатори сесії. `usage` — це облік провайдера/turn для вартості й телеметрії;
  `context.used` — це поточний знімок prompt/контексту, і він може бути нижчим за
  `usage.total` провайдера, коли залучено кешований ввід або виклики tool-loop.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сесія**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: webhooks/черга/сесія)

**Життєвий цикл harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  життєвий цикл кожного запуску для agent harness. Містить `harnessId`, необов’язковий
  `pluginId`, провайдер/модель/канал і ідентифікатор запуску. Завершення додає
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`,
  і лічильники `itemLifecycle`. Помилки додають `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Exec**

- `exec.process.completed` - термінальний результат, тривалість, ціль, режим, код
  виходу та тип збою. Текст команди й робочі каталоги не
  включаються.
- `exec.approval.followup_suppressed` - застарілий подальший запит на схвалення відкинуто після
  відновлення сесії. Містить `approvalId`, `reason` (`session_rebound`),
  `phase` (`direct_delivery` або `gateway_preflight`) і timestamp диспетчера.
  Ключі сесії, маршрути й текст команди не включаються.

## Без експортера

Ви можете залишити діагностичні події доступними для plugins або власних приймачів без
запуску `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового debug-виводу без підвищення `logging.level` використовуйте діагностичні
прапорці. Прапорці не чутливі до регістру та підтримують wildcards (наприклад, `telegram.*` або
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

Вивід прапорців надходить до стандартного log-файлу (`logging.file`) і все одно
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

- [Логування](/uk/logging) - файлові логи, консольний вивід, перегляд CLI tail і вкладка Logs у Control UI
- [Внутрішні механізми логування Gateway](/uk/gateway/logging) - стилі WS-логів, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) - цільові прапорці debug-логів
- [Експорт діагностики](/uk/gateway/diagnostics) - інструмент support-bundle для операторів (окремо від експорту OTEL)
- [Довідник конфігурації](/uk/gateway/configuration-reference#diagnostics) - повний довідник полів `diagnostics.*`
