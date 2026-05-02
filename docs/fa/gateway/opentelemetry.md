---
read_when:
    - می‌خواهید میزان استفاده از مدل OpenClaw، جریان پیام، یا معیارهای نشست را به یک گردآورنده OpenTelemetry ارسال کنید
    - در حال اتصال ردپاها، سنجه‌ها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک بک‌اند OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها، به نام‌های دقیق معیارها، نام‌های اسپن یا ساختار ویژگی‌ها نیاز دارید
summary: داده‌های تشخیصی OpenClaw را از طریق Plugin diagnostics-otel (OTLP/HTTP) به هر گردآورنده OpenTelemetry صادر کنید
title: صادرسازی OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T11:47:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0aed4ca8818d3bd1f5461fb58fbbe5c0d3ed1262cac506c60ee326800d98e1b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw داده‌های عیب‌یابی را از طریق Plugin رسمی `diagnostics-otel`
با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر کلکتور یا بک‌اندی که OTLP/HTTP را بپذیرد
بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و نحوه خواندن آن‌ها، به
[ثبت وقایع](/fa/logging) مراجعه کنید.

## این اجزا چگونه کنار هم کار می‌کنند

- **رویدادهای عیب‌یابی** رکوردهای ساختاریافته و درون‌پردازشی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها،
  و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** در آن رویدادها مشترک می‌شود و آن‌ها را به‌صورت
  **metrics**، **traces**، و **logs** مربوط به OpenTelemetry از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های ارائه‌دهنده** وقتی ترابری ارائه‌دهنده headerهای سفارشی را بپذیرد،
  یک header‏ W3C با نام `traceparent` را از زمینه span فراخوانی مدل مورد اعتماد OpenClaw
  دریافت می‌کنند. زمینه trace منتشرشده توسط Plugin منتقل نمی‌شود.
- صادرکننده‌ها فقط وقتی وصل می‌شوند که هم سطح عیب‌یابی و هم Plugin
  فعال باشند، بنابراین هزینه درون‌پردازشی به‌طور پیش‌فرض نزدیک به صفر می‌ماند.

## شروع سریع

برای نصب‌های بسته‌بندی‌شده، ابتدا Plugin را نصب کنید:

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
| **Metrics** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، جریان پیام، laneهای صف، وضعیت نشست، exec، و فشار حافظه.          |
| **Traces**  | spanها برای مصرف مدل، فراخوانی‌های مدل، چرخه عمر harness، اجرای ابزار، exec، پردازش webhook/پیام، مونتاژ زمینه، و حلقه‌های ابزار. |
| **Logs**    | رکوردهای ساختاریافته `logging.file` که وقتی `diagnostics.otel.logs` فعال باشد از طریق OTLP صادر می‌شوند.                                              |

`traces`، `metrics`، و `logs` را مستقل از هم تغییر دهید. وقتی
`diagnostics.otel.enabled` برابر true باشد، هر سه به‌طور پیش‌فرض روشن هستند.

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` را بازنویسی می‌کند. اگر مقدار از قبل شامل `/v1/traces`، `/v1/metrics`، یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های endpoint مختص سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی مختص سیگنال بر env مختص سیگنال اولویت دارد، و آن هم بر endpoint مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` را بازنویسی می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل سیمی را بازنویسی می‌کند؛ امروز فقط `http/protobuf` رعایت می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | روی `gen_ai_latest_experimental` تنظیم کنید تا به‌جای `gen_ai.system` قدیمی، جدیدترین ویژگی آزمایشی span مربوط به GenAI (`gen_ai.provider.name`) منتشر شود. metricsهای GenAI در هر صورت همیشه از ویژگی‌های معنایی محدود و با cardinality پایین استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا پردازش میزبان دیگری قبلا OpenTelemetry SDK سراسری را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند، اما همچنان listenerهای عیب‌یابی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ضبط محتوا

محتوای خام مدل/ابزار به‌طور پیش‌فرض صادر **نمی‌شود**. spanها شناسه‌های محدود
(channel، provider، model، دسته خطا، شناسه‌های درخواست فقط-hash)
را حمل می‌کنند و هرگز شامل متن prompt، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، یا
کلیدهای نشست نیستند.

درخواست‌های خروجی مدل ممکن است شامل یک header‏ W3C با نام `traceparent` باشند. آن header
فقط از زمینه trace عیب‌یابی متعلق به OpenClaw برای فراخوانی مدل فعال
تولید می‌شود. headerهای `traceparent` موجود که توسط فراخواننده فراهم شده‌اند جایگزین می‌شوند، بنابراین Pluginها یا
گزینه‌های سفارشی ارائه‌دهنده نمی‌توانند نیای trace میان‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط وقتی روی `true` تنظیم کنید که کلکتور و
سیاست نگهداری شما برای متن prompt، پاسخ، ابزار، یا system-prompt
تأیید شده باشد. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` — محتوای prompt کاربر.
- `outputMessages` — محتوای پاسخ مدل.
- `toolInputs` — payloadهای آرگومان ابزار.
- `toolOutputs` — payloadهای نتیجه ابزار.
- `systemPrompt` — prompt مونتاژشده سیستم/توسعه‌دهنده.

وقتی هر زیرکلیدی فعال باشد، spanهای مدل و ابزار ویژگی‌های محدود و ویرایش‌شده
`openclaw.content.*` را فقط برای همان کلاس دریافت می‌کنند.

## نمونه‌برداری و flush

- **Traces:** `diagnostics.otel.sampleRate` (فقط root-span؛ `0.0` همه را حذف می‌کند،
  `1.0` همه را نگه می‌دارد).
- **Metrics:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **Logs:** لاگ‌های OTLP به `logging.level` (سطح لاگ فایل) احترام می‌گذارند. آن‌ها از
  مسیر ویرایش رکورد لاگ عیب‌یابی استفاده می‌کنند، نه قالب‌بندی کنسول. نصب‌های پرترافیک
  باید نمونه‌برداری/فیلترکردن کلکتور OTLP را بر نمونه‌برداری محلی ترجیح دهند.
- **همبستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک زمینه trace عیب‌یابی معتبر
  داشته باشد، شامل `traceId`،
  `spanId`، `parentSpanId`، و `traceFlags` در سطح بالا هستند؛ این به پردازشگرهای لاگ اجازه می‌دهد خطوط لاگ محلی را با
  spanهای صادرشده join کنند.
- **همبستگی درخواست:** درخواست‌های HTTP مربوط به Gateway و فریم‌های WebSocket یک
  دامنه trace درخواست داخلی ایجاد می‌کنند. لاگ‌ها و رویدادهای عیب‌یابی داخل آن دامنه
  به‌طور پیش‌فرض trace درخواست را به ارث می‌برند، در حالی که spanهای اجرای agent و فراخوانی مدل
  به‌عنوان فرزند ایجاد می‌شوند تا headerهای `traceparent` ارائه‌دهنده روی همان trace بمانند.

## metrics صادرشده

### مصرف مدل

- `openclaw.tokens` (counter، attrs: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (counter، attrs: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (histogram، attrs: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (histogram، attrs: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (histogram، metric مربوط به قراردادهای معنایی GenAI، attrs: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram، ثانیه، metric مربوط به قراردادهای معنایی GenAI، attrs: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، اختیاری `error.type`)
- `openclaw.model_call.duration_ms` (histogram، attrs: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (histogram، اندازه بایتی UTF-8 مربوط به payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (histogram، اندازه بایتی UTF-8 مربوط به رویدادهای پاسخ مدل stream‌شده؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (histogram، زمان سپری‌شده پیش از اولین رویداد پاسخ stream‌شده)

### جریان پیام

- `openclaw.webhook.received` (counter، attrs: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.error` (counter، attrs: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram، attrs: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.message.queued` (counter، attrs: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.processed` (counter، attrs: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram، attrs: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter، attrs: `openclaw.channel`، `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram، attrs: `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (counter، attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter، attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram، attrs: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram، attrs: `openclaw.lane`)
- `openclaw.session.state` (counter، attrs: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (counter، attrs: `openclaw.state`؛ فقط برای حسابداری نشست‌های stale بدون کار فعال منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (histogram، attrs: `openclaw.state`؛ فقط برای حسابداری نشست‌های stale بدون کار فعال منتشر می‌شود)
- `openclaw.run.attempt` (counter، attrs: `openclaw.attempt`)

### تله‌متری زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای عیب‌یابی زنده‌بودن نشست است.
یک نشست `processing` تا زمانی که OpenClaw پیشرفت پاسخ، ابزار، وضعیت، block، یا runtime مربوط به ACP را مشاهده کند
به سمت این آستانه پیر نمی‌شود.
keepaliveهای تایپ‌کردن به‌عنوان پیشرفت حساب نمی‌شوند، بنابراین یک مدل یا harness خاموش
همچنان قابل تشخیص است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شده فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار
  هنوز در حال پیشرفت هستند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر
  گزارش نکرده است.
- `session.stuck`: دفترداری کهنه جلسه بدون کار فعال. این تنها
  رده‌بندی زنده‌بودن است که مسیر جلسه تحت تأثیر را آزاد می‌کند.

فقط `session.stuck` شمارنده `openclaw.session.stuck`،
هیستوگرام `openclaw.session.stuck_age_ms` و span
`openclaw.session.stuck` را منتشر می‌کند. عیب‌یابی‌های تکراری `session.stuck`
تا زمانی که جلسه بدون تغییر بماند با عقب‌نشینی تدریجی انجام می‌شوند، بنابراین داشبوردها باید به افزایش‌های پایدار هشدار دهند نه به هر تیک
Heartbeat. برای گزینه پیکربندی و پیش‌فرض‌ها، به
[مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) مراجعه کنید.

### چرخه حیات Harness

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` در خطاها)

### Exec

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### اجزای داخلی عیب‌یابی (حافظه و حلقه ابزار)

- `openclaw.memory.heap_used_bytes` (هیستوگرام، ویژگی‌ها: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، ویژگی‌ها: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.toolName`, `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی آخرین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی آخرین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری در خطاها
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسه درخواست ارائه‌دهنده بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - هنگام تکمیل: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - هنگام خطا: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` اختیاری
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بدون محتوای prompt، history، response یا session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بدون پیام‌های حلقه، پارامترها یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

وقتی ضبط محتوا به‌صورت صریح فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند
ویژگی‌های محدود و ویرایش‌شده `openclaw.content.*` را برای کلاس‌های محتوای مشخصی
که انتخاب کرده‌اید شامل شوند.

## فهرست رویدادهای عیب‌یابی

رویدادهای زیر پشتوانه معیارها و spanهای بالا هستند. Pluginها همچنین می‌توانند بدون
صدور OTLP مستقیماً مشترک آن‌ها شوند.

**استفاده مدل**

- `model.usage` — توکن‌ها، هزینه، مدت، context، ارائه‌دهنده/مدل/کانال،
  شناسه‌های جلسه. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و تله‌متری است؛
  `context.used` تصویر لحظه‌ای prompt/context فعلی است و وقتی ورودی کش‌شده یا فراخوانی‌های حلقه ابزار درگیر باشند می‌تواند کمتر از
  `usage.total` ارائه‌دهنده باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و جلسه**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: Webhookها/صف/جلسه)

**چرخه حیات Harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  چرخه حیات هر اجرا برای agent harness. شامل `harnessId`، `pluginId` اختیاری،
  ارائه‌دهنده/مدل/کانال و شناسه اجرا است. تکمیل، `durationMs`، `outcome`، `resultClassification` اختیاری، `yieldDetected`
  و شمارش‌های `itemLifecycle` را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory` و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**Exec**

- `exec.process.completed` — نتیجه نهایی ترمینال، مدت، هدف، حالت، کد خروج
  و نوع شکست. متن فرمان و دایرکتوری‌های کاری
  شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای عیب‌یابی را بدون اجرای `diagnostics-otel` برای Pluginها یا خروجی‌های سفارشی
در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی عیب‌یابی هدفمند بدون افزایش `logging.level`، از پرچم‌های عیب‌یابی
استفاده کنید. پرچم‌ها به بزرگی و کوچکی حروف حساس نیستند و از wildcardها پشتیبانی می‌کنند (مثلاً `telegram.*` یا
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان یک override یک‌باره محیطی:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی پرچم به فایل گزارش استاندارد (`logging.file`) می‌رود و همچنان
توسط `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[پرچم‌های عیب‌یابی](/fa/diagnostics/flags).

## غیرفعال کردن

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` حذف کنید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [Logging](/fa/logging) — گزارش‌های فایل، خروجی کنسول، دنبال‌کردن از CLI، و زبانه گزارش‌های Control UI
- [اجزای داخلی گزارش‌گیری Gateway](/fa/gateway/logging) — سبک‌های گزارش WS، پیشوندهای زیرسیستم، و ضبط کنسول
- [پرچم‌های عیب‌یابی](/fa/diagnostics/flags) — پرچم‌های هدفمند گزارش عیب‌یابی
- [صدور عیب‌یابی](/fa/gateway/diagnostics) — ابزار support-bundle برای اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) — مرجع کامل فیلدهای `diagnostics.*`
