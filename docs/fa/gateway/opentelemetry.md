---
read_when:
    - می‌خواهید میزان استفاده از مدل، جریان پیام یا سنجه‌های نشست OpenClaw را به یک گردآورنده OpenTelemetry ارسال کنید
    - در حال اتصال ردیابی‌ها، سنجه‌ها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo، یا یک پشتانه OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها، به نام‌های دقیق سنجه‌ها، نام‌های اسپن‌ها یا ساختار ویژگی‌ها نیاز دارید
summary: داده‌های تشخیصی OpenClaw را از طریق Plugin diagnostics-otel (OTLP/HTTP) به هر گردآورندهٔ OpenTelemetry صادر کنید
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-05-03T21:34:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw تشخیص‌ها را از طریق Plugin رسمی `diagnostics-otel` با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر collector یا backend که OTLP/HTTP را بپذیرد بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و روش خواندن آن‌ها، [ثبت لاگ](/fa/logging) را ببینید.

## اجزا چگونه کنار هم کار می‌کنند

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها،
  و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** در این رویدادها مشترک می‌شود و آن‌ها را به‌صورت
  **metric**‌ها، **trace**‌ها، و **log**‌های OpenTelemetry از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های provider** وقتی transport provider هدرهای سفارشی را بپذیرد، از context بازه فراخوانی مدل مورد اعتماد OpenClaw یک هدر W3C `traceparent` دریافت می‌کنند. context ردیابی منتشرشده توسط Plugin منتشر نمی‌شود.
- exporterها فقط زمانی متصل می‌شوند که هم سطح تشخیص و هم Plugin
  فعال باشند؛ بنابراین هزینه درون‌فرایندی به‌صورت پیش‌فرض نزدیک به صفر می‌ماند.

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

| سیگنال      | محتوای آن                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metricها** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، جریان پیام، laneهای صف، وضعیت نشست، exec، و فشار حافظه.          |
| **Traceها**  | بازه‌ها برای مصرف مدل، فراخوانی‌های مدل، چرخه عمر harness، اجرای ابزار، exec، پردازش Webhook/پیام، مونتاژ context، و حلقه‌های ابزار. |
| **Logها**    | رکوردهای ساختاریافته `logging.file` که وقتی `diagnostics.otel.logs` فعال باشد از طریق OTLP صادر می‌شوند.                                              |

`traces`، `metrics`، و `logs` را مستقل از هم روشن یا خاموش کنید. وقتی
`diagnostics.otel.enabled` برابر true باشد، هر سه به‌صورت پیش‌فرض روشن هستند.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی endpoint مخصوص سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شود. پیکربندی مخصوص سیگنال بر env مخصوص سیگنال اولویت دارد، و آن هم بر endpoint مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` را بازنویسی می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل wire را بازنویسی می‌کند؛ امروز فقط `http/protobuf` اعمال می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | روی `gen_ai_latest_experimental` تنظیم کنید تا به‌جای `gen_ai.system` قدیمی، آخرین attribute آزمایشی بازه GenAI یعنی `gen_ai.provider.name` منتشر شود. metricهای GenAI در هر حال از attributeهای معنایی محدود و کم‌کاردینالیتی استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرایند میزبان دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند، اما همچنان listenerهای تشخیصی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ثبت محتوا

محتوای خام مدل/ابزار به‌صورت پیش‌فرض صادر **نمی‌شود**. بازه‌ها شناسه‌های محدود
(channel، provider، model، دسته خطا، شناسه‌های درخواست فقط-hash) را حمل می‌کنند
و هرگز شامل متن prompt، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، یا
کلیدهای نشست نیستند.

درخواست‌های خروجی مدل ممکن است شامل هدر W3C `traceparent` باشند. این هدر
فقط از context ردیابی تشخیصی متعلق به OpenClaw برای فراخوانی مدل فعال
تولید می‌شود. هدرهای `traceparent` موجود و ارسال‌شده توسط فراخواننده جایگزین می‌شوند؛ بنابراین Pluginها یا گزینه‌های provider سفارشی نمی‌توانند تبار ردیابی بین‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط زمانی روی `true` تنظیم کنید که collector و
سیاست نگهداری شما برای متن prompt، پاسخ، ابزار، یا system-prompt
تأیید شده باشند. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` — محتوای prompt کاربر.
- `outputMessages` — محتوای پاسخ مدل.
- `toolInputs` — payload آرگومان‌های ابزار.
- `toolOutputs` — payload نتیجه‌های ابزار.
- `systemPrompt` — prompt سیستم/developer مونتاژشده.

وقتی هر زیرکلیدی فعال باشد، بازه‌های مدل و ابزار فقط برای همان کلاس attributeهای
محدود و redactشده `openclaw.content.*` دریافت می‌کنند.

## نمونه‌برداری و flush

- **Traceها:** `diagnostics.otel.sampleRate` (فقط بازه ریشه، `0.0` همه را حذف می‌کند،
  `1.0` همه را نگه می‌دارد).
- **Metricها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **Logها:** لاگ‌های OTLP از `logging.level` پیروی می‌کنند (سطح لاگ فایل). آن‌ها از
  مسیر redact رکورد لاگ تشخیصی استفاده می‌کنند، نه قالب‌بندی console. نصب‌های
  پرترافیک باید نمونه‌برداری/فیلترگذاری collector مربوط به OTLP را به نمونه‌برداری محلی ترجیح دهند.
- **همبستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک context ردیابی
  تشخیصی معتبر داشته باشد، شامل `traceId`،
  `spanId`، `parentSpanId`، و `traceFlags` در سطح بالا هستند؛ این امکان را می‌دهد که پردازشگرهای لاگ خطوط لاگ محلی را با
  بازه‌های صادرشده پیوند دهند.
- **همبستگی درخواست:** درخواست‌های HTTP Gateway و frameهای WebSocket یک
  scope ردیابی درخواست داخلی ایجاد می‌کنند. لاگ‌ها و رویدادهای تشخیصی داخل آن scope
  به‌صورت پیش‌فرض ردیابی درخواست را به ارث می‌برند، در حالی که بازه‌های agent run و فراخوانی مدل
  به‌عنوان فرزند ساخته می‌شوند تا هدرهای provider `traceparent` روی همان trace بمانند.

## metricهای صادرشده

### مصرف مدل

- `openclaw.tokens` (شمارنده، attributeها: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، attributeها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، attributeها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، attributeها: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، metric قراردادهای معنایی GenAI، attributeها: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، metric قراردادهای معنایی GenAI، attributeها: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، `error.type` اختیاری)
- `openclaw.model_call.duration_ms` (هیستوگرام، attributeها: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای دسته‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 برای payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 برای رویدادهای پاسخ مدل streamشده؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده پیش از نخستین رویداد پاسخ streamشده)

### جریان پیام

- `openclaw.webhook.received` (شمارنده، attributeها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.error` (شمارنده، attributeها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (هیستوگرام، attributeها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.message.queued` (شمارنده، attributeها: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.processed` (شمارنده، attributeها: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.duration_ms` (هیستوگرام، attributeها: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.delivery.started` (شمارنده، attributeها: `openclaw.channel`، `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (هیستوگرام، attributeها: `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (شمارنده، attributeها: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (شمارنده، attributeها: `openclaw.lane`)
- `openclaw.queue.depth` (هیستوگرام، attributeها: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (هیستوگرام، attributeها: `openclaw.lane`)
- `openclaw.session.state` (شمارنده، attributeها: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (شمارنده، attributeها: `openclaw.state`؛ فقط برای ثبت حسابداری نشست stale بدون کار فعال منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، attributeها: `openclaw.state`؛ فقط برای ثبت حسابداری نشست stale بدون کار فعال منتشر می‌شود)
- `openclaw.run.attempt` (شمارنده، attributeها: `openclaw.attempt`)

### telemetry زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای تشخیص‌های
زنده‌بودن نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت runtime در پاسخ، ابزار، وضعیت، block، یا ACP را مشاهده کند، به سمت این آستانه پیر نمی‌شود.
keepaliveهای typing به‌عنوان پیشرفت شمرده نمی‌شوند؛ بنابراین مدل یا harness خاموش
همچنان قابل تشخیص است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند دسته‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شده فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار
  هنوز در حال پیشرفت هستند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت
  اخیر گزارش نکرده است. اجراهای تعبیه‌شده متوقف‌شده ابتدا فقط در حالت مشاهده می‌مانند، سپس
  پس از حداقل ۱۰ دقیقه و ۵ برابر `diagnostics.stuckSessionWarnMs`
  بدون پیشرفت، `abort-drain` می‌شوند تا نوبت‌های صف‌شده پشت آن مسیر بتوانند ادامه پیدا کنند.
- `session.stuck`: ثبت‌وضعیت نشست کهنه بدون کار فعال. این مورد
  مسیر نشست تحت تأثیر را بلافاصله آزاد می‌کند.

فقط `session.stuck` شمارنده `openclaw.session.stuck`،
هیستوگرام `openclaw.session.stuck_age_ms`، و span با نام `openclaw.session.stuck`
را منتشر می‌کند. تشخیص‌های تکراری `session.stuck` تا وقتی نشست بدون تغییر باقی بماند
با عقب‌نشینی زمانی انجام می‌شوند، بنابراین داشبوردها باید به افزایش‌های پایدار هشدار دهند، نه به هر
تیک Heartbeat. برای گزینه پیکربندی و پیش‌فرض‌ها، ببینید
[مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics).

### چرخه عمر هارنس

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` در خطاها)

### اجرای فرمان

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### جزئیات داخلی تشخیص‌ها (حافظه و حلقه ابزار)

- `openclaw.memory.heap_used_bytes` (هیستوگرام، ویژگی‌ها: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، ویژگی‌ها: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.toolName`, `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (ورودی/خروجی/خواندن کش/نوشتن کش/کل)
  - `gen_ai.system` به‌صورت پیش‌فرض، یا `gen_ai.provider.name` وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` به‌صورت پیش‌فرض، یا `gen_ai.provider.name` وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بدون محتوای پرامپت، تاریخچه، پاسخ، یا کلید نشست)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بدون پیام‌های حلقه، پارامترها، یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

وقتی ضبط محتوا صراحتاً فعال شده باشد، spanهای مدل و ابزار می‌توانند
ویژگی‌های محدود و ویرایش‌شده `openclaw.content.*` را نیز برای کلاس‌های محتوای مشخصی
که فعال کرده‌اید شامل شوند.

## کاتالوگ رویدادهای تشخیصی

رویدادهای زیر پشتوانه سنجه‌ها و spanهای بالا هستند. Pluginها همچنین می‌توانند
بدون صدور OTLP مستقیماً در آن‌ها مشترک شوند.

**مصرف مدل**

- `model.usage` — توکن‌ها، هزینه، مدت، زمینه، ارائه‌دهنده/مدل/کانال،
  شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و تله‌متری است؛
  `context.used` نمای فوری پرامپت/زمینه فعلی است و می‌تواند وقتی ورودی کش‌شده یا فراخوانی‌های حلقه ابزار دخیل هستند
  کمتر از `usage.total` ارائه‌دهنده باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و نشست**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: Webhookها/صف/نشست)

**چرخه عمر هارنس**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  چرخه عمر هر اجرا برای هارنس عامل. شامل `harnessId`، `pluginId` اختیاری،
  ارائه‌دهنده/مدل/کانال، و شناسه اجرا است. تکمیل، `durationMs`، `outcome`، `resultClassification` اختیاری، `yieldDetected`،
  و شمارش‌های `itemLifecycle` را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**اجرای فرمان**

- `exec.process.completed` — نتیجه ترمینال، مدت، هدف، حالت، کد خروج،
  و نوع شکست. متن فرمان و دایرکتوری‌های کاری
  گنجانده نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای تشخیصی را بدون اجرای `diagnostics-otel` برای Pluginها یا مقصدهای سفارشی
در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی اشکال‌زدایی هدفمند بدون افزایش `logging.level`، از پرچم‌های تشخیصی
استفاده کنید. پرچم‌ها به بزرگی و کوچکی حروف حساس نیستند و از wildcard پشتیبانی می‌کنند (مثلاً `telegram.*` یا
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
با `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
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

- [گزارش‌گیری](/fa/logging) — گزارش‌های فایل، خروجی کنسول، دنبال‌کردن از CLI، و زبانه گزارش‌های Control UI
- [جزئیات داخلی گزارش‌گیری Gateway](/fa/gateway/logging) — سبک‌های گزارش WS، پیشوندهای زیرسیستم، و ضبط کنسول
- [پرچم‌های تشخیصی](/fa/diagnostics/flags) — پرچم‌های گزارش اشکال‌زدایی هدفمند
- [صدور تشخیص‌ها](/fa/gateway/diagnostics) — ابزار بسته پشتیبانی اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) — مرجع کامل فیلدهای `diagnostics.*`
