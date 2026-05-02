---
read_when:
    - می‌خواهید میزان استفاده از مدل OpenClaw، جریان پیام، یا سنجه‌های نشست را به یک گردآورنده OpenTelemetry ارسال کنید
    - در حال متصل کردن ردیابی‌ها، سنجه‌ها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک سامانهٔ پشتیبان OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها، به نام‌های دقیق متریک‌ها، نام‌های اسپن‌ها، یا ساختار ویژگی‌ها نیاز دارید
summary: داده‌های تشخیصی OpenClaw را از طریق Plugin diagnostics-otel (OTLP/HTTP) به هر گردآورندهٔ OpenTelemetry صادر کنید
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T20:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw تشخیص‌ها را از طریق Plugin رسمی `diagnostics-otel` با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر collector یا backend که OTLP/HTTP را بپذیرد، بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و نحوه خواندن آن‌ها، [لاگ‌گیری](/fa/logging) را ببینید.

## نحوه قرار گرفتن اجزا کنار هم

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** به این رویدادها subscribe می‌کند و آن‌ها را به‌صورت **معیارها**، **traceها** و **لاگ‌ها** از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های provider** وقتی transport مربوط به provider هدرهای سفارشی را بپذیرد، یک هدر W3C `traceparent` را از context span معتبر فراخوانی مدل OpenClaw دریافت می‌کنند. context مربوط به trace که توسط Plugin منتشر شده باشد، منتشر نمی‌شود.
- صادرکننده‌ها فقط زمانی متصل می‌شوند که هم سطح تشخیص و هم Plugin فعال باشند، بنابراین هزینه درون‌فرایندی به‌طور پیش‌فرض نزدیک به صفر می‌ماند.

## شروع سریع

برای نصب‌های بسته‌بندی‌شده، ابتدا Plugin را نصب کنید:

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

همچنین می‌توانید Plugin را از CLI فعال کنید:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
`protocol` در حال حاضر فقط از `http/protobuf` پشتیبانی می‌کند. `grpc` نادیده گرفته می‌شود.
</Note>

## سیگنال‌های صادرشده

| سیگنال      | آنچه در آن قرار می‌گیرد                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **معیارها** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، جریان پیام، laneهای صف، وضعیت نشست، exec و فشار حافظه.          |
| **Traceها**  | Spanها برای مصرف مدل، فراخوانی‌های مدل، چرخه‌عمر harness، اجرای ابزار، exec، پردازش webhook/پیام، ساخت context و loopهای ابزار. |
| **لاگ‌ها**    | رکوردهای ساختاریافته `logging.file` که وقتی `diagnostics.otel.logs` فعال باشد، از طریق OTLP صادر می‌شوند.                                              |

`traces`، `metrics` و `logs` را به‌صورت مستقل تغییر دهید. وقتی `diagnostics.otel.enabled` برابر true باشد، هر سه به‌طور پیش‌فرض روشن هستند.

## مرجع پیکربندی

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

### متغیرهای محیطی

| متغیر                                                                                                          | هدف                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | مقدار `diagnostics.otel.endpoint` را override می‌کند. اگر مقدار از قبل شامل `/v1/traces`، `/v1/metrics` یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | overrideهای endpoint ویژه سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی ویژه سیگنال بر env ویژه سیگنال اولویت دارد، و آن نیز بر endpoint مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | مقدار `diagnostics.otel.serviceName` را override می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل wire را override می‌کند؛ امروز فقط `http/protobuf` رعایت می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | روی `gen_ai_latest_experimental` تنظیم کنید تا به‌جای `gen_ai.system` قدیمی، تازه‌ترین ویژگی آزمایشی span مربوط به GenAI (`gen_ai.provider.name`) منتشر شود. معیارهای GenAI همیشه صرف‌نظر از این، از ویژگی‌های معنایی محدود و کم‌کاردینالیتی استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرایند host دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه‌عمر NodeSDK خودش را رد می‌کند، اما همچنان listenerهای تشخیصی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ضبط محتوا

محتوای خام مدل/ابزار به‌طور پیش‌فرض صادر **نمی‌شود**. Spanها شناسه‌های محدودشده را حمل می‌کنند (channel، provider، model، دسته خطا، شناسه‌های درخواست فقط-hash) و هرگز شامل متن prompt، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار یا کلیدهای نشست نیستند.

درخواست‌های خروجی مدل ممکن است شامل هدر W3C `traceparent` باشند. این هدر فقط از context مربوط به trace تشخیصی تحت مالکیت OpenClaw برای فراخوانی فعال مدل تولید می‌شود. هدرهای `traceparent` ارائه‌شده توسط caller موجود جایگزین می‌شوند، بنابراین Pluginها یا گزینه‌های provider سفارشی نمی‌توانند ancestry trace بین‌سرویسی را جعل کنند.

فقط زمانی `diagnostics.otel.captureContent.*` را روی `true` تنظیم کنید که collector و سیاست نگه‌داری شما برای متن prompt، پاسخ، ابزار یا system-prompt تأیید شده باشد. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` — محتوای prompt کاربر.
- `outputMessages` — محتوای پاسخ مدل.
- `toolInputs` — payloadهای آرگومان ابزار.
- `toolOutputs` — payloadهای نتیجه ابزار.
- `systemPrompt` — prompt سیستم/توسعه‌دهنده assembled شده.

وقتی هر زیرکلید فعال باشد، spanهای مدل و ابزار فقط برای همان class ویژگی‌های محدود و redacted مربوط به `openclaw.content.*` را دریافت می‌کنند.

## نمونه‌برداری و flush

- **Traceها:** `diagnostics.otel.sampleRate` (فقط root-span، `0.0` همه را حذف می‌کند، `1.0` همه را نگه می‌دارد).
- **معیارها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **لاگ‌ها:** لاگ‌های OTLP از `logging.level` (سطح لاگ فایل) پیروی می‌کنند. آن‌ها از مسیر redaction رکورد لاگ تشخیصی استفاده می‌کنند، نه قالب‌بندی console. نصب‌های پرترافیک باید sampling/filtering در collector مربوط به OTLP را به نمونه‌برداری محلی ترجیح دهند.
- **هم‌بستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک context معتبر trace تشخیصی را حمل کند، شامل `traceId`، `spanId`، `parentSpanId` و `traceFlags` در سطح بالا هستند، که به پردازشگرهای لاگ امکان می‌دهد خطوط لاگ محلی را با spanهای صادرشده join کنند.
- **هم‌بستگی درخواست:** درخواست‌های HTTP Gateway و frameهای WebSocket یک scope داخلی trace درخواست ایجاد می‌کنند. لاگ‌ها و رویدادهای تشخیصی داخل آن scope به‌طور پیش‌فرض trace درخواست را inherit می‌کنند، در حالی که spanهای اجرای agent و فراخوانی مدل به‌عنوان child ساخته می‌شوند تا هدرهای `traceparent` مربوط به provider روی همان trace باقی بمانند.

## معیارهای صادرشده

### مصرف مدل

- `openclaw.tokens` (counter، attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram، attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram، معیار semantic-conventions مربوط به GenAI، attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram، ثانیه، معیار semantic-conventions مربوط به GenAI، attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختیاری `error.type`)
- `openclaw.model_call.duration_ms` (histogram، attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (histogram، اندازه بایتی UTF-8 مربوط به payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (histogram، اندازه بایتی UTF-8 مربوط به رویدادهای پاسخ مدل streamed؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram، زمان سپری‌شده پیش از اولین رویداد پاسخ streamed)

### جریان پیام

- `openclaw.webhook.received` (counter، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter، attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter، attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (counter، attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter، attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram، attrs: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram، attrs: `openclaw.lane`)
- `openclaw.session.state` (counter، attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter، attrs: `openclaw.state`؛ فقط برای bookkeeping نشست stale بدون کار فعال منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (histogram، attrs: `openclaw.state`؛ فقط برای bookkeeping نشست stale بدون کار فعال منتشر می‌شود)
- `openclaw.run.attempt` (counter، attrs: `openclaw.attempt`)

### telemetry زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای تشخیص‌های زنده‌بودن نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت runtime مربوط به پاسخ، ابزار، وضعیت، block یا ACP را مشاهده کند، به سمت این آستانه پیر نمی‌شود. keepaliveهای typing به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین یک مدل یا harness ساکت همچنان قابل تشخیص است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شدهٔ فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار
  همچنان در حال پیشرفت هستند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر را گزارش
  نکرده است.
- `session.stuck`: ثبت‌ودفتر نشست کهنه بدون کار فعال. این تنها دسته‌بندی سرزندگی
  است که مسیر نشست تحت تأثیر را آزاد می‌کند.

فقط `session.stuck` شمارندهٔ `openclaw.session.stuck`، هیستوگرام
`openclaw.session.stuck_age_ms`، و span مربوط به `openclaw.session.stuck` را
منتشر می‌کند. تشخیص‌های تکراری `session.stuck` تا زمانی که نشست بدون تغییر
بماند، با عقب‌نشینی انجام می‌شوند؛ بنابراین داشبوردها باید به افزایش‌های پایدار
هشدار دهند، نه به هر تیک Heartbeat. برای گزینهٔ پیکربندی و پیش‌فرض‌ها، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics).

### چرخهٔ عمر هارنس

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` هنگام خطاها)

### اجرا

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### جزئیات داخلی تشخیص‌ها (حافظه و حلقهٔ ابزار)

- `openclaw.memory.heap_used_bytes` (هیستوگرام، ویژگی‌ها: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - به‌صورت پیش‌فرض `gen_ai.system`، یا زمانی که تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌صورت پیش‌فرض `gen_ai.system`، یا زمانی که تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری هنگام خطاها
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسهٔ درخواست ارائه‌دهندهٔ بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
- `openclaw.harness.run`
  - `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.provider`، `openclaw.model`، `openclaw.channel`
  - هنگام تکمیل: `openclaw.harness.result_classification`، `openclaw.harness.yield_detected`، `openclaw.harness.items.started`، `openclaw.harness.items.completed`، `openclaw.harness.items.active`
  - هنگام خطا: `openclaw.harness.phase`، `openclaw.errorCategory`، `openclaw.harness.cleanup_failed` اختیاری
- `openclaw.tool.execution`
  - `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.errorCategory`، `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`، `openclaw.exec.command_length`، `openclaw.exec.exit_code`، `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`، `openclaw.webhook`، `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`، `openclaw.webhook`، `openclaw.chatId`، `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`، `openclaw.outcome`، `openclaw.chatId`، `openclaw.messageId`، `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`، `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`، `openclaw.ageMs`، `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بدون محتوای prompt، تاریخچه، پاسخ، یا کلید نشست)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بدون پیام‌های حلقه، پارامترها، یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

وقتی ضبط محتوا به‌صراحت فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند
ویژگی‌های محدود و ویرایش‌شدهٔ `openclaw.content.*` را برای کلاس‌های محتوایی
مشخصی که فعال کرده‌اید، شامل شوند.

## کاتالوگ رویدادهای تشخیصی

رویدادهای زیر زیربنای معیارها و spanهای بالا هستند. Pluginها همچنین می‌توانند
بدون صدور OTLP مستقیماً در آن‌ها مشترک شوند.

**مصرف مدل**

- `model.usage` — توکن‌ها، هزینه، مدت‌زمان، زمینه، ارائه‌دهنده/مدل/کانال،
  شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و تله‌متری است؛
  `context.used` نمای فعلی prompt/زمینه است و وقتی ورودی کش‌شده یا فراخوانی‌های
  حلقهٔ ابزار دخیل باشند، می‌تواند از `usage.total` ارائه‌دهنده کمتر باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و نشست**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: Webhookها/صف/نشست)

**چرخهٔ عمر هارنس**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  چرخهٔ عمر هر اجرا برای هارنس عامل. شامل `harnessId`، `pluginId` اختیاری،
  ارائه‌دهنده/مدل/کانال، و شناسهٔ اجرا است. تکمیل، `durationMs`، `outcome`،
  `resultClassification` اختیاری، `yieldDetected`، و شمارش‌های `itemLifecycle`
  را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**اجرا**

- `exec.process.completed` — نتیجهٔ ترمینال، مدت‌زمان، هدف، حالت، کد خروج،
  و نوع شکست. متن دستور و دایرکتوری‌های کاری شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای تشخیصی را بدون اجرای `diagnostics-otel` برای Pluginها یا
گیرنده‌های سفارشی در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی اشکال‌زدایی هدفمند بدون افزایش `logging.level`، از پرچم‌های تشخیصی
استفاده کنید. پرچم‌ها به بزرگی و کوچکی حروف حساس نیستند و از wildcard پشتیبانی
می‌کنند (مثلاً `telegram.*` یا `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان بازنویسی یک‌بارهٔ env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی پرچم به فایل لاگ استاندارد (`logging.file`) می‌رود و همچنان توسط
`logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[پرچم‌های تشخیصی](/fa/diagnostics/flags).

## غیرفعال‌سازی

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` بیرون بگذارید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [لاگ‌گیری](/fa/logging) — لاگ‌های فایل، خروجی کنسول، دنبال‌کردن با CLI، و زبانهٔ Logs در Control UI
- [جزئیات داخلی لاگ‌گیری Gateway](/fa/gateway/logging) — سبک‌های لاگ WS، پیشوندهای زیرسیستم، و ضبط کنسول
- [پرچم‌های تشخیصی](/fa/diagnostics/flags) — پرچم‌های هدفمند لاگ اشکال‌زدایی
- [صدور تشخیص‌ها](/fa/gateway/diagnostics) — ابزار بستهٔ پشتیبانی اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) — مرجع کامل فیلدهای `diagnostics.*`
