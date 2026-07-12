---
read_when:
    - Ви хочете надсилати дані про використання моделей OpenClaw, потік повідомлень або метрики сеансів до колектора OpenTelemetry
    - Ви налаштовуєте передавання трасувань, метрик або журналів до Grafana, Datadog, Honeycomb, New Relic, Tempo чи іншого серверного сервісу OTLP
    - Для створення інформаційних панелей або сповіщень вам потрібні точні назви метрик, назви інтервалів або структура атрибутів
summary: Експортуйте діагностичні дані OpenClaw до колекторів OpenTelemetry або у форматі JSONL до стандартного виводу за допомогою плагіна diagnostics-otel
title: Експорт OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T13:14:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw експортує діагностичні дані через офіційний Plugin `diagnostics-otel`
за допомогою **OTLP/HTTP (protobuf)**. Журнали також можна записувати у форматі JSONL до stdout для
конвеєрів журналювання контейнерів і пісочниць. Будь-який збирач або серверна система, що приймає
OTLP/HTTP, працює без змін у коді. Про локальні файлові журнали див.
[Журналювання](/uk/logging).

- **Діагностичні події** — це структуровані внутрішньопроцесні записи, які створюють
  Gateway і вбудовані плагіни для запусків моделей, потоків повідомлень, сеансів, черг
  і exec.
- **`diagnostics-otel`** підписується на ці події та експортує їх як
  **метрики**, **трасування** й **журнали** OpenTelemetry через OTLP/HTTP, а також може
  дублювати записи журналу у форматі JSONL до stdout.
- **Виклики постачальників** отримують заголовок W3C `traceparent` із
  довіреного контексту сегмента виклику моделі OpenClaw, якщо транспорт постачальника підтримує власні
  заголовки. Контекст трасування, створений Plugin, не поширюється.
- Експортери підключаються лише тоді, коли ввімкнено і діагностичну поверхню, і Plugin,
  тому за замовчуванням внутрішньопроцесні витрати залишаються майже нульовими.

## Швидкий початок

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

Або ввімкніть Plugin через CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` підтримує лише `http/protobuf`. Оскільки `traces` і `metrics` за замовчуванням увімкнені, будь-яке інше значення (зокрема `grpc`) перериває всю підписку diagnostics-otel із попередженням `unsupported protocol` — це також припиняє експорт журналів до stdout. Явно встановіть `traces: false` і `metrics: false`, якщо вам потрібен лише `logsExporter: "stdout"` зі значенням протоколу, відмінним від OTLP.
</Note>

## Експортовані сигнали

| Сигнал      | Що до нього входить                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Метрики** | Лічильники й гістограми використання токенів, вартості, тривалості запусків, перемикання після відмови, використання навичок, потоків повідомлень, подій Talk, смуг черг, стану/відновлення сеансів, виконання інструментів, exec, пам’яті, працездатності та стану експортерів. |
| **Трасування**  | Сегменти використання моделей, викликів моделей, життєвого циклу середовища виконання, використання навичок, виконання інструментів, exec, обробки Webhook/повідомлень, складання контексту та циклів інструментів.                                                      |
| **Журнали**    | Структуровані записи `logging.file`, що експортуються через OTLP або у форматі JSONL до stdout, коли ввімкнено `diagnostics.otel.logs`; тіла журналів не передаються, якщо явно не ввімкнено захоплення вмісту.                          |

Вмикайте й вимикайте `traces`, `metrics` і `logs` незалежно. Трасування та метрики
за замовчуванням увімкнені, коли `diagnostics.otel.enabled` має значення `true`; журнали за замовчуванням вимкнені
й експортуються лише тоді, коли `diagnostics.otel.logs` явно має значення `true`. За замовчуванням журнали
експортуються через OTLP; установіть `diagnostics.otel.logsExporter` у `stdout` для JSONL у
stdout або в `both` для обох варіантів.

## Довідник із конфігурації

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
      protocol: "http/protobuf", // grpc вимикає експорт OTLP
      serviceName: "openclaw-gateway", // якщо не задано, використовується OTEL_SERVICE_NAME, а потім "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | обидва
      sampleRate: 0.2, // засіб вибірки кореневих сегментів, 0.0..1.0
      flushIntervalMs: 60000, // інтервал експорту метрик (мін. 1000 мс)
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

| Змінна                                                                                                          | Призначення                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | Резервне значення для `diagnostics.otel.endpoint`, коли ключ конфігурації не задано.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Резервні кінцеві точки для окремих сигналів, які використовуються, коли відповідний ключ конфігурації `diagnostics.otel.*Endpoint` не задано. Конфігурація для конкретного сигналу має пріоритет над змінною середовища для цього сигналу, а вона — над спільною кінцевою точкою.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | Резервне значення для `diagnostics.otel.serviceName`, коли ключ конфігурації не задано. Назва служби за замовчуванням — `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | Резервне значення для протоколу передавання, коли `diagnostics.otel.protocol` не задано. Експорт вмикає лише `http/protobuf`.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | Установіть значення `gen_ai_latest_experimental`, щоб створювати найновішу структуру сегмента виведення GenAI: назви сегментів `{gen_ai.operation.name} {gen_ai.request.model}`, тип сегмента `CLIENT` і `gen_ai.provider.name` замість застарілого `gen_ai.system`. Метрики GenAI у будь-якому разі використовують обмежені атрибути з низькою кардинальністю. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | Установіть значення `1`, якщо інший модуль попереднього завантаження або процес хоста вже зареєстрував глобальний SDK OpenTelemetry. Тоді Plugin пропускає власний життєвий цикл NodeSDK, але все одно підключає діагностичні слухачі та враховує `traces`/`metrics`/`logs`.                                                                                    |

## Конфіденційність і захоплення вмісту

Необроблений вміст моделей та інструментів за замовчуванням **не** експортується. Сегменти містять обмежені
ідентифікатори (канал, постачальник, модель, категорія помилки, лише хешовані ідентифікатори запитів,
джерело інструмента, власник інструмента, назва/джерело навички) і ніколи не містять тексту запиту,
тексту відповіді, вхідних даних інструментів, результатів інструментів, шляхів до файлів навичок або ключів сеансів.
Значення, схожі на ключі сеансів агентів з областю дії (наприклад, ті, що починаються з
`agent:`), замінюються на `unknown` в атрибутах із низькою кардинальністю. Записи журналу OTLP
за замовчуванням зберігають серйозність, засіб журналювання, розташування в коді, довірений контекст трасування та
очищені атрибути; необроблене тіло повідомлення журналу експортується лише
тоді, коли `diagnostics.otel.captureContent` має логічне значення `true`. Деталізовані
підключі `captureContent.*` ніколи не вмикають тіла журналів. Метрики Talk експортують лише
обмежені метадані подій (режим, транспорт, постачальник, тип події) — без
транскриптів, аудіоданих, ідентифікаторів сеансів, ходів, викликів і кімнат або
токенів передавання.

Вихідні запити до моделей можуть містити заголовок W3C `traceparent`, створений лише
з діагностичного контексту трасування, що належить OpenClaw, для активного виклику моделі.
Наявні заголовки `traceparent`, надані викликачем, замінюються, тому плагіни або
власні параметри постачальника не можуть підробити міжсервісну ієрархію трасування.

Установлюйте `diagnostics.otel.captureContent.*` у `true`, лише якщо ваш збирач
і політика зберігання схвалені для тексту запитів, відповідей, інструментів або
системних запитів. Кожен підключ незалежний:

- `inputMessages` — вміст запиту користувача.
- `outputMessages` — вміст відповіді моделі.
- `toolInputs` — дані аргументів інструмента.
- `toolOutputs` — дані результатів інструмента.
- `systemPrompt` — складений системний запит або запит розробника.
- `toolDefinitions` — назви, описи та схеми інструментів моделі.

Коли ввімкнено будь-який підключ, сегменти моделі та інструментів отримують обмежені й редаговані
атрибути `openclaw.content.*` лише для цього класу.

<Note>
Логічне значення `captureContent: true` одночасно вмикає `inputMessages`, `outputMessages`, `toolInputs`, `toolOutputs`, `toolDefinitions` і тіла журналів OTLP, але **не** `systemPrompt` — явно встановіть `captureContent.systemPrompt: true`, якщо вам також потрібен складений системний запит.
</Note>

Вміст `toolInputs`/`toolOutputs` захоплюється для виконання інструментів
вбудованого середовища виконання агента (`openclaw.content.tool_input` і
`gen_ai.tool.call.arguments` у завершених сегментах або сегментах із помилкою;
`openclaw.content.tool_output` і `gen_ai.tool.call.result` у завершених
сегментах). Назви `openclaw.content.*` залишаються стабільними назвами атрибутів
OpenClaw; копії `gen_ai.tool.call.*` дублюють їх для засобів перегляду, що підтримують semconv.
Виклики інструментів із зовнішніх середовищ виконання (Codex, Claude CLI) створюють
сегменти `tool.execution.*` без вмісту. Захоплений вміст передається через
довірений канал, доступний лише слухачам, і ніколи не потрапляє до загальнодоступної шини
діагностичних подій.

## Вибірка та скидання

- **Трасування:** `diagnostics.otel.sampleRate` установлює `TraceIdRatioBasedSampler`
  лише для кореневого спану (`0.0` відкидає все, `1.0` зберігає все). Якщо значення
  не задано, використовується стандартне налаштування OpenTelemetry SDK
  (завжди ввімкнено).
- **Метрики:** `diagnostics.otel.flushIntervalMs` (обмежується мінімальним
  значенням `1000`); якщо значення не задано, використовується стандартний
  інтервал періодичного експорту SDK.
- **Журнали:** журнали OTLP враховують `logging.level` (рівень файлового журналу)
  та використовують шлях редагування діагностичних записів журналу, а не
  форматування консолі. Для інсталяцій із великим обсягом даних варто віддавати
  перевагу вибірці та фільтруванню колектора OTLP замість локальної вибірки.
  Установіть `diagnostics.otel.logsExporter: "stdout"`, якщо ваша платформа вже
  передає stdout/stderr обробнику журналів і у вас немає колектора журналів
  OTLP. Записи stdout — це по одному об’єкту JSON у кожному рядку з `ts`,
  `signal`, `service.name`, рівнем серйозності, тілом, відредагованими
  атрибутами та довіреними полями трасування, якщо вони доступні.
- **Кореляція файлових журналів:** файлові журнали JSONL містять на верхньому
  рівні `traceId`, `spanId`, `parentSpanId` і `traceFlags`, коли виклик
  журналювання має дійсний контекст діагностичного трасування, що дає змогу
  обробникам журналів пов’язувати локальні рядки журналу з експортованими
  спанами.
- **Кореляція запитів:** HTTP-запити Gateway і кадри WebSocket створюють
  внутрішню область трасування запиту. Журнали та діагностичні події в цій
  області за замовчуванням успадковують трасування запиту, а спани запуску
  агента й виклику моделі створюються як дочірні, тому заголовки `traceparent`
  постачальника залишаються в тому самому трасуванні.
- **Кореляція викликів моделі:** спани `openclaw.model.call` за замовчуванням
  містять безпечні розміри компонентів запиту та атрибути токенів для кожного
  виклику, якщо результат постачальника надає дані про використання.
  `openclaw.model.usage` залишається спаном обліку на рівні запуску для
  агрегованої вартості, контексту й панелей каналів і залишається в тому самому
  діагностичному трасуванні, коли середовище виконання, що його створює, має
  довірений контекст трасування.

## Експортовані метрики

### Використання моделі

- `openclaw.tokens` (лічильник, атрибути: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (лічильник, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (гістограма, атрибути: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (гістограма, атрибути: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (гістограма, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (гістограма, секунди, метрика семантичних конвенцій GenAI, атрибути: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, необов’язковий `error.type`)
- `openclaw.model_call.duration_ms` (гістограма, атрибути: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, а також `openclaw.errorCategory` і `openclaw.failureKind` для класифікованих помилок)
- `openclaw.model_call.request_bytes` (гістограма, розмір у байтах UTF-8 остаточного корисного навантаження запиту до моделі; без необробленого вмісту корисного навантаження)
- `openclaw.model_call.response_bytes` (гістограма, розмір у байтах UTF-8 корисного навантаження потокових фрагментів відповіді; для високочастотних дельт тексту, міркувань і викликів інструментів враховуються лише додаткові байти `delta`; без необробленого вмісту відповіді)
- `openclaw.model_call.time_to_first_byte_ms` (гістограма, час до першої події потокової відповіді)
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
- `openclaw.talk.event.duration_ms` (гістограма, атрибути: такі самі, як у `openclaw.talk.event`; створюється, коли подія розмови повідомляє тривалість)
- `openclaw.talk.audio.bytes` (гістограма, атрибути: такі самі, як у `openclaw.talk.event`; створюється для подій аудіокадрів розмови, що повідомляють довжину в байтах)

### Черги та сеанси

- `openclaw.queue.lane.enqueue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (лічильник, атрибути: `openclaw.lane`)
- `openclaw.queue.depth` (гістограма, атрибути: `openclaw.lane` або `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (гістограма, атрибути: `openclaw.lane`)
- `openclaw.session.state` (лічильник, атрибути: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (лічильник, атрибути: `openclaw.state`; створюється для застарілого облікового стану сеансу, який можна відновити)
- `openclaw.session.stuck_age_ms` (гістограма, атрибути: `openclaw.state`; створюється для застарілого облікового стану сеансу, який можна відновити)
- `openclaw.session.turn.created` (лічильник, атрибути: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (лічильник, атрибути: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (гістограма, атрибути: такі самі, як у відповідного лічильника відновлення)
- `openclaw.run.attempt` (лічильник, атрибути: `openclaw.attempt`)

### Телеметрія активності сеансів

`diagnostics.stuckSessionWarnMs` — це пороговий вік відсутності прогресу для
діагностики активності сеансу. Вік сеансу `processing` не наближається до цього
порога, поки OpenClaw спостерігає прогрес відповіді, інструмента, стану,
блоку або середовища виконання ACP. Сигнали підтримання індикації набору тексту
не вважаються прогресом, тому модель або тестове середовище, що не відповідають,
усе одно можна виявити.

OpenClaw класифікує сеанси за роботою, яку ще може спостерігати:

- `session.long_running`: активна вбудована робота, виклики моделі або виклики
  інструментів усе ще виконуються. Належні власнику виклики моделі, які не
  надають сигналів довше за `diagnostics.stuckSessionWarnMs`, також
  позначаються як довготривалі до `diagnostics.stuckSessionAbortMs`, щоб
  повільні або непотокові постачальники моделей не виглядали як завислі сеанси
  Gateway, доки можливе спостереження за перериванням.
- `session.stalled`: активна робота існує, але активний запуск останнім часом
  не повідомляв про прогрес. Належні власнику виклики моделі переходять із
  `session.long_running` до `session.stalled` після досягнення
  `diagnostics.stuckSessionAbortMs`; застаріла активність моделі чи інструмента
  без власника не вважається нешкідливою довготривалою роботою. Спочатку
  завислі вбудовані запуски лише спостерігаються, а потім після
  `diagnostics.stuckSessionAbortMs` без прогресу перериваються з очікуванням
  завершення, щоб наступні ходи в черзі смуги могли відновитися. Якщо значення
  не задано, поріг переривання за замовчуванням дорівнює безпечнішому
  розширеному вікну: щонайменше 5 хвилин і трикратне значення
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: застарілий обліковий стан сеансу без активної роботи або
  неактивний сеанс у черзі із застарілою активністю моделі чи інструмента без
  власника. Це негайно звільняє відповідну смугу сеансу після проходження
  перевірок відновлення.

Відновлення створює структуровані події `session.recovery.requested` і
`session.recovery.completed`. Діагностичний стан сеансу позначається як
неактивний лише після результату відновлення, що змінює стан (`aborted` або
`released`), і лише якщо те саме покоління обробки все ще є поточним.

Лише `session.stuck` створює лічильник `openclaw.session.stuck`, гістограму
`openclaw.session.stuck_age_ms` і спан `openclaw.session.stuck`. Частота
повторних діагностичних подій `session.stuck` поступово зменшується, доки сеанс
залишається незмінним, тому панелі мають сповіщати про тривале зростання, а не
про кожен такт Heartbeat. Параметр конфігурації та стандартні значення див. у
[довіднику з конфігурації](/uk/gateway/configuration-reference#diagnostics).

Попередження про активність також створюють:

- `openclaw.liveness.warning` (лічильник, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (гістограма, атрибути: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (гістограма, атрибути: `openclaw.liveness.reason`)

### Життєвий цикл тестового середовища

- `openclaw.harness.duration_ms` (гістограма, атрибути: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` у разі помилок)

### Виконання інструментів і виявлення циклів

- `openclaw.tool.execution.duration_ms` (гістограма, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, а також `openclaw.errorCategory` у разі помилок)
- `openclaw.tool.execution.blocked` (лічильник, атрибути: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)
- `openclaw.tool.loop` (лічильник, атрибути: `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, необов’язковий `openclaw.loop.paired_tool`; створюється, коли виявлено повторюваний цикл викликів інструмента)

### Виконання команд

- `openclaw.exec.duration_ms` (гістограма, атрибути: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Внутрішня діагностика (пам’ять, корисні навантаження, стан експортерів)

- `openclaw.payload.large` (лічильник, атрибути: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (гістограма, атрибути: такі самі, як у `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (гістограми, без атрибутів; зразки пам’яті процесу)
- `openclaw.memory.pressure` (лічильник, атрибути: `openclaw.memory.level`, `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (лічильник, атрибути: `openclaw.diagnostic.async_queue.drop_class`; відкидання через зворотний тиск внутрішньої діагностичної черги)
- `openclaw.telemetry.exporter.events` (лічильник, атрибути: `openclaw.exporter`, `openclaw.signal`, `openclaw.status`, необов’язковий `openclaw.reason`, необов’язковий `openclaw.errorCategory`; власна телеметрія життєвого циклу та збоїв експортера)

## Експортовані спани

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
  - `openclaw.errorCategory`, `error.type` і необов’язковий `openclaw.failureKind` у разі помилок
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (лише безпечні розміри компонентів, без тексту запиту)
  - `openclaw.model_call.usage.*` і `gen_ai.usage.*`, коли результат виклику моделі містить дані про використання від постачальника для цього окремого виклику
  - Подія проміжку `openclaw.provider.request` з атрибутом `openclaw.upstreamRequestIdHash` (обмеженим, на основі хешу), коли результат від зовнішнього постачальника містить ідентифікатор запиту; необроблені ідентифікатори ніколи не експортуються
  - З `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` проміжки викликів моделі використовують найновішу назву проміжку логічного висновку GenAI `{gen_ai.operation.name} {gen_ai.request.model}` і тип проміжку `CLIENT` замість `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - Після завершення: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - У разі помилки: `openclaw.harness.phase`, `openclaw.errorCategory`, необов’язковий `openclaw.harness.cleanup_failed`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `gen_ai.operation.name` (`execute_tool`), `openclaw.toolName`, `openclaw.tool.source`, необов’язкові `gen_ai.tool.call.id`, `openclaw.tool.owner`, `openclaw.tool.params.*`
  - Необов’язкові `openclaw.errorCategory`/`openclaw.errorCode` у разі помилок, `openclaw.deniedReason` і `openclaw.outcome=blocked`, коли виконання заборонено політикою або пісочницею
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`, `openclaw.exec.command_length`, `openclaw.exec.exit_code`, `openclaw.exec.exit_signal`, `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (без вмісту запиту, історії, відповіді або ключа сеансу)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.loop.level`, `openclaw.loop.action`, `openclaw.loop.detector`, `openclaw.loop.count`, необов’язковий `openclaw.loop.paired_tool` (без повідомлень циклу, параметрів або результатів інструмента)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.reason`, `openclaw.memory.rss_bytes`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.heap_total_bytes`, `openclaw.memory.external_bytes`, `openclaw.memory.array_buffers_bytes`, необов’язкові `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms`

Коли захоплення вмісту явно ввімкнено, проміжки моделі та інструментів також можуть
містити обмежені й відредаговані атрибути `openclaw.content.*` для конкретних
класів вмісту, які ви ввімкнули.

## Каталог діагностичних подій

Наведені нижче події забезпечують роботу описаних вище метрик і проміжків. Plugins також можуть
підписуватися на них безпосередньо без експорту OTLP.

**Використання моделі**

- `model.usage` — токени, вартість, тривалість, контекст, постачальник/модель/канал,
  ідентифікатори сеансів. `usage` — облік постачальника/ходу для вартості й телеметрії;
  `context.used` — поточний знімок запиту/контексту, який може бути меншим за
  `usage.total` постачальника, якщо використовуються кешовані вхідні дані або виклики циклу інструментів.

**Потік повідомлень**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**Черга та сеанс**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (агреговані лічильники: вебхуки/черга/сеанс)

**Життєвий цикл середовища виконання**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  життєвий цикл кожного запуску середовища виконання агента. Містить `harnessId`, необов’язковий
  `pluginId`, постачальника/модель/канал та ідентифікатор запуску. Після завершення додаються
  `durationMs`, `outcome`, необов’язкові `resultClassification`, `yieldDetected`
  і лічильники `itemLifecycle`. У разі помилки додаються `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`), `errorCategory` і
  необов’язковий `cleanupFailed`.

**Виконання**

- `exec.process.completed` — кінцевий результат, тривалість, ціль, режим, код
  виходу та тип помилки. Текст команди й робочі каталоги не
  включаються.
- `exec.approval.followup_suppressed` — застаріле подальше повідомлення про схвалення відкинуто
  після переприв’язування сеансу. Містить `approvalId`, `reason`
  (`session_rebound`), `phase` (`direct_delivery` або `gateway_preflight`)
  і часову позначку диспетчера. Ключі сеансів, маршрути й текст команди не
  включаються.

## Без експортера

Залишайте діагностичні події доступними для Plugins або власних приймачів без запуску
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

Для цільового налагоджувального виводу без підвищення `logging.level` використовуйте діагностичні
прапорці. Прапорці не залежать від регістру й підтримують символи підстановки (`telegram.*` або
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

Або як одноразове перевизначення змінної середовища:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

Вивід прапорців надходить до стандартного файлу журналу (`logging.file`) і все одно
редагується відповідно до `logging.redactSensitive`. Повний посібник:
[Діагностичні прапорці](/uk/diagnostics/flags).

## Вимкнення

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

Або не додавайте `diagnostics-otel` до `plugins.allow`, чи виконайте
`openclaw plugins disable diagnostics-otel`.

## Пов’язані матеріали

- [Журналювання](/uk/logging) — файлові журнали, консольний вивід, перегляд журналів через CLI та вкладка журналів в інтерфейсі керування
- [Внутрішня реалізація журналювання Gateway](/uk/gateway/logging) — стилі журналів WS, префікси підсистем і захоплення консолі
- [Діагностичні прапорці](/uk/diagnostics/flags) — прапорці цільового налагоджувального журналювання
- [Експорт діагностики](/uk/gateway/diagnostics) — інструмент пакета підтримки для оператора (окремо від експорту OTEL)
- [Довідник із конфігурації](/uk/gateway/configuration-reference#diagnostics) — повний довідник полів `diagnostics.*`
