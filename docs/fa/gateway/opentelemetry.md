---
read_when:
    - می‌خواهید میزان استفاده از مدل OpenClaw، جریان پیام، یا معیارهای نشست را به یک جمع‌آورنده OpenTelemetry ارسال کنید
    - شما در حال اتصال تریس‌ها، متریک‌ها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک بک‌اند OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها به نام‌های دقیق معیارها، نام‌های بازه‌ها، یا ساختار ویژگی‌ها نیاز دارید
summary: صدور داده‌های تشخیصی OpenClaw به هر گردآورنده OpenTelemetry از طریق Plugin diagnostics-otel (OTLP/HTTP)
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-05-04T02:25:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b5be99b29fe5f13132b03cfeaf3ce978ee16f29e307aa76769bc414b5ca35f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw داده‌های تشخیصی را از طریق Plugin رسمی `diagnostics-otel` با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر گردآورنده یا بک‌اندی که OTLP/HTTP را بپذیرد، بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و شیوه خواندن آن‌ها، [لاگ‌گیری](/fa/logging) را ببینید.

## این‌ها چگونه کنار هم کار می‌کنند

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها و اجرا منتشر می‌شوند.
- **Plugin `diagnostics-otel`** در آن رویدادها مشترک می‌شود و آن‌ها را به‌صورت **سنجه‌ها**، **ردیابی‌ها** و **لاگ‌ها**ی OpenTelemetry از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های ارائه‌دهنده** زمانی که انتقال ارائه‌دهنده سربرگ‌های سفارشی را بپذیرد، یک سربرگ W3C `traceparent` را از زمینه اسپن مورداعتماد فراخوانی مدل OpenClaw دریافت می‌کنند. زمینه ردیابی منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط زمانی متصل می‌شوند که هم سطح تشخیصی و هم Plugin فعال باشند، بنابراین هزینه درون‌فرایندی به‌طور پیش‌فرض نزدیک به صفر می‌ماند.

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
| **سنجه‌ها** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای ران، جریان پیام، مسیرهای صف، وضعیت نشست، اجرا و فشار حافظه.          |
| **ردیابی‌ها**  | اسپن‌ها برای استفاده از مدل، فراخوانی‌های مدل، چرخه حیات هارنس، اجرای ابزار، اجرا، پردازش webhook/پیام، سرهم‌بندی زمینه و حلقه‌های ابزار. |
| **لاگ‌ها**    | رکوردهای ساختاریافته `logging.file` که هنگام فعال بودن `diagnostics.otel.logs` از طریق OTLP صادر می‌شوند.                                              |

`traces`، `metrics` و `logs` را مستقل از هم روشن یا خاموش کنید. وقتی `diagnostics.otel.enabled` برابر true باشد، هر سه به‌طور پیش‌فرض روشن هستند.

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` را بازنویسی می‌کند. اگر مقدار از پیش شامل `/v1/traces`، `/v1/metrics` یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های نقطه پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی مخصوص سیگنال بر env مخصوص سیگنال اولویت دارد و آن نیز بر نقطه پایانی مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` را بازنویسی می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل سیمی را بازنویسی می‌کند؛ امروز فقط `http/protobuf` رعایت می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | روی `gen_ai_latest_experimental` تنظیم کنید تا به‌جای `gen_ai.system` قدیمی، جدیدترین ویژگی آزمایشی اسپن GenAI یعنی `gen_ai.provider.name` منتشر شود. سنجه‌های GenAI همیشه بدون توجه به این مورد از ویژگی‌های معنایی محدود و کم‌کاردینالیتی استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی یک preload دیگر یا فرایند میزبان از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه حیات NodeSDK خودش را رد می‌کند، اما همچنان شنونده‌های تشخیصی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ثبت محتوا

محتوای خام مدل/ابزار به‌طور پیش‌فرض صادر **نمی‌شود**. اسپن‌ها شناسه‌های محدودشده را حمل می‌کنند (کانال، ارائه‌دهنده، مدل، دسته خطا، شناسه‌های درخواست فقط-هش) و هرگز متن پرامپت، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار یا کلیدهای نشست را شامل نمی‌شوند.

درخواست‌های خروجی مدل ممکن است شامل یک سربرگ W3C `traceparent` باشند. آن سربرگ فقط از زمینه ردیابی تشخیصی متعلق به OpenClaw برای فراخوانی فعال مدل تولید می‌شود. سربرگ‌های `traceparent` موجود که توسط فراخواننده ارائه شده‌اند جایگزین می‌شوند، بنابراین Pluginها یا گزینه‌های سفارشی ارائه‌دهنده نمی‌توانند تبار ردیابی بین‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط زمانی روی `true` تنظیم کنید که گردآورنده و سیاست نگهداشت شما برای متن پرامپت، پاسخ، ابزار یا سیستم‌پرامپت تأیید شده باشند. هر زیرکلید مستقل از بقیه opt-in است:

- `inputMessages` — محتوای پرامپت کاربر.
- `outputMessages` — محتوای پاسخ مدل.
- `toolInputs` — payloadهای آرگومان ابزار.
- `toolOutputs` — payloadهای نتیجه ابزار.
- `systemPrompt` — پرامپت سیستم/توسعه‌دهنده سرهم‌بندی‌شده.

وقتی هر زیرکلیدی فعال باشد، اسپن‌های مدل و ابزار فقط برای همان کلاس ویژگی‌های محدودشده و ویرایش‌شده `openclaw.content.*` را دریافت می‌کنند.

## نمونه‌برداری و flush کردن

- **ردیابی‌ها:** `diagnostics.otel.sampleRate` (فقط اسپن ریشه، `0.0` همه را حذف می‌کند، `1.0` همه را نگه می‌دارد).
- **سنجه‌ها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **لاگ‌ها:** لاگ‌های OTLP به `logging.level` (سطح لاگ فایل) احترام می‌گذارند. آن‌ها از مسیر ویرایش رکورد لاگ تشخیصی استفاده می‌کنند، نه قالب‌بندی کنسول. نصب‌های پرترافیک باید نمونه‌برداری/فیلتر کردن گردآورنده OTLP را به نمونه‌برداری محلی ترجیح دهند.
- **همبستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک زمینه ردیابی تشخیصی معتبر داشته باشد، شامل `traceId`، `spanId`، `parentSpanId` و `traceFlags` در سطح بالا هستند؛ این امکان را می‌دهد که پردازشگرهای لاگ خطوط لاگ محلی را با اسپن‌های صادرشده متصل کنند.
- **همبستگی درخواست:** درخواست‌های HTTP Gateway و فریم‌های WebSocket یک دامنه ردیابی درخواست داخلی ایجاد می‌کنند. لاگ‌ها و رویدادهای تشخیصی داخل آن دامنه به‌طور پیش‌فرض ردیابی درخواست را به ارث می‌برند، در حالی که اسپن‌های اجرای عامل و فراخوانی مدل به‌عنوان فرزند ساخته می‌شوند تا سربرگ‌های `traceparent` ارائه‌دهنده روی همان ردیابی باقی بمانند.

## سنجه‌های صادرشده

### استفاده از مدل

- `openclaw.tokens` (شمارنده، ویژگی‌ها: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، ویژگی‌ها: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، سنجه قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، سنجه قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، اختیاری `error.type`)
- `openclaw.model_call.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 رویدادهای پاسخ مدل استریم‌شده؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده پیش از نخستین رویداد پاسخ استریم‌شده)

### جریان پیام

- `openclaw.webhook.received` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.error` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.message.queued` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.processed` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.delivery.started` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.depth` (هیستوگرام، ویژگی‌ها: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (هیستوگرام، ویژگی‌ها: `openclaw.lane`)
- `openclaw.session.state` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (شمارنده، ویژگی‌ها: `openclaw.state`؛ فقط برای حسابداری نشست مانده بدون کار فعال منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، ویژگی‌ها: `openclaw.state`؛ فقط برای حسابداری نشست مانده بدون کار فعال منتشر می‌شود)
- `openclaw.run.attempt` (شمارنده، ویژگی‌ها: `openclaw.attempt`)

### تله‌متری زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای داده‌های تشخیصی زنده‌بودن نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت پاسخ، ابزار، وضعیت، بلوک یا زمان اجرای ACP را مشاهده کند، به سمت این آستانه پیر نمی‌شود. keepaliveهای تایپ به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین یک مدل یا هارنس خاموش همچنان قابل تشخیص است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شدهٔ فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار
  هنوز در حال پیشرفت هستند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر را گزارش نکرده است.
  اجراهای تعبیه‌شدهٔ متوقف‌شده در ابتدا فقط در حالت مشاهده باقی می‌مانند، سپس
  پس از دست‌کم 10 دقیقه و 5 برابر `diagnostics.stuckSessionWarnMs`
  بدون پیشرفت، abort-drain می‌شوند تا نوبت‌های در صف پشت آن lane بتوانند از سر گرفته شوند.
- `session.stuck`: حسابداری نشست کهنه بدون کار فعال. این مورد lane نشست متأثر را
  بلافاصله آزاد می‌کند.

فقط `session.stuck` شمارندهٔ `openclaw.session.stuck`،
هیستوگرام `openclaw.session.stuck_age_ms` و span
`openclaw.session.stuck` را منتشر می‌کند. تشخیص‌های تکراری `session.stuck`
تا زمانی که نشست بدون تغییر بماند عقب‌نشینی می‌کنند، بنابراین داشبوردها باید
به‌جای هر تیک Heartbeat، روی افزایش‌های پایدار هشدار دهند. برای knob پیکربندی
و پیش‌فرض‌ها، [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) را ببینید.

### چرخهٔ حیات هارنس

- `openclaw.harness.duration_ms` (هیستوگرام، attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` در خطاها)

### اجرا

- `openclaw.exec.duration_ms` (هیستوگرام، attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### جزئیات داخلی تشخیص‌ها (حافظه و حلقهٔ ابزار)

- `openclaw.memory.heap_used_bytes` (هیستوگرام، attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، attrs: `openclaw.toolName`, `openclaw.outcome`)

## Spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - به‌طور پیش‌فرض `gen_ai.system`، یا هنگامی که جدیدترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌طور پیش‌فرض `gen_ai.system`، یا هنگامی که جدیدترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری در خطاها
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسهٔ درخواست ارائه‌دهندهٔ بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - هنگام تکمیل: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - هنگام خطا: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` اختیاری
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بدون محتوای prompt، تاریخچه، پاسخ، یا کلید نشست)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بدون پیام‌های حلقه، params، یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

وقتی ضبط محتوا صراحتاً فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند
ویژگی‌های محدود و ویرایش‌شدهٔ `openclaw.content.*` را برای کلاس‌های محتوایی
مشخصی که انتخاب کرده‌اید شامل شوند.

## کاتالوگ رویدادهای تشخیصی

رویدادهای زیر پشتوانهٔ متریک‌ها و spanهای بالا هستند. Pluginها همچنین می‌توانند
بدون صدور OTLP مستقیماً مشترک آن‌ها شوند.

**مصرف مدل**

- `model.usage` — توکن‌ها، هزینه، مدت‌زمان، زمینه، ارائه‌دهنده/مدل/کانال،
  شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/turn برای هزینه و telemetry است؛
  `context.used` snapshot فعلی prompt/context است و هنگامی که ورودی cache‌شده یا
  فراخوانی‌های tool-loop دخیل باشند، می‌تواند کمتر از `usage.total` ارائه‌دهنده باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و نشست**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: Webhookها/صف/نشست)

**چرخهٔ حیات هارنس**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  چرخهٔ حیات هر اجرا برای هارنس عامل. شامل `harnessId`، `pluginId` اختیاری،
  ارائه‌دهنده/مدل/کانال، و شناسهٔ اجرا است. تکمیل، `durationMs`، `outcome`،
  `resultClassification` اختیاری، `yieldDetected`، و شمارش‌های `itemLifecycle`
  را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**اجرا**

- `exec.process.completed` — نتیجهٔ terminal، مدت‌زمان، هدف، mode، exit
  code، و نوع شکست. متن فرمان و working directoryها
  شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای تشخیصی را بدون اجرای `diagnostics-otel` برای Pluginها یا
sinkهای سفارشی در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی debug هدفمند بدون افزایش `logging.level`، از flagهای تشخیصی استفاده کنید.
Flagها به بزرگی و کوچکی حروف حساس نیستند و از wildcardها پشتیبانی می‌کنند
(مثلاً `telegram.*` یا `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان override یک‌بارهٔ env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی flag به فایل log استاندارد (`logging.file`) می‌رود و همچنان توسط
`logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[Flagهای تشخیصی](/fa/diagnostics/flags).

## غیرفعال‌سازی

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` خارج کنید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [Logging](/fa/logging) — logهای فایل، خروجی کنسول، tail کردن CLI، و زبانهٔ Logs در Control UI
- [جزئیات داخلی logging در Gateway](/fa/gateway/logging) — سبک‌های log WS، پیشوندهای زیرسیستم، و ضبط کنسول
- [Flagهای تشخیصی](/fa/diagnostics/flags) — flagهای debug-log هدفمند
- [صدور تشخیص‌ها](/fa/gateway/diagnostics) — ابزار support-bundle برای اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) — مرجع کامل فیلدهای `diagnostics.*`
