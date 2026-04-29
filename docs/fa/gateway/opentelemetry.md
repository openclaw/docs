---
read_when:
    - می‌خواهید استفاده از مدل، جریان پیام، یا سنجه‌های نشست OpenClaw را به یک گردآورنده OpenTelemetry ارسال کنید
    - شما در حال اتصال ردیابی‌ها، معیارها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک بک‌اند OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها به نام‌های دقیق متریک‌ها، نام‌های اسپن‌ها، یا شکل‌های ویژگی‌ها نیاز دارید
summary: صدور داده‌های عیب‌یابی OpenClaw به هر جمع‌آورندهٔ OpenTelemetry از طریق Plugin diagnostics-otel (OTLP/HTTP)
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-04-29T22:54:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw رخدادهای عیب‌یابی را از طریق Plugin همراه `diagnostics-otel`
با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر گردآورنده یا بک‌اندی که OTLP/HTTP
را بپذیرد، بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و نحوه خواندن آن‌ها، به
[لاگ‌گیری](/fa/logging) مراجعه کنید.

## چگونگی کنار هم قرار گرفتن اجزا

- **رخدادهای عیب‌یابی** رکوردهای ساختاریافته و درون‌فرآیندی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها،
  و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** در آن رخدادها مشترک می‌شود و آن‌ها را به‌صورت
  **متریک‌ها**، **ردیابی‌ها**، و **لاگ‌ها** از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های ارائه‌دهنده** وقتی انتقال ارائه‌دهنده سربرگ‌های سفارشی را بپذیرد،
  یک سربرگ W3C `traceparent` از زمینه span فراخوانی مدل مورد اعتماد OpenClaw
  دریافت می‌کنند. زمینه ردیابی منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط وقتی متصل می‌شوند که هم سطح عیب‌یابی و هم Plugin
  فعال باشند، بنابراین هزینه درون‌فرآیندی به‌صورت پیش‌فرض نزدیک به صفر می‌ماند.

## شروع سریع

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
| **متریک‌ها** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، جریان پیام، مسیرهای صف، وضعیت نشست، exec، و فشار حافظه.          |
| **ردیابی‌ها**  | spanها برای مصرف مدل، فراخوانی‌های مدل، چرخه عمر harness، اجرای ابزار، exec، پردازش webhook/پیام، مونتاژ زمینه، و حلقه‌های ابزار. |
| **لاگ‌ها**    | رکوردهای ساختاریافته `logging.file` که وقتی `diagnostics.otel.logs` فعال باشد از طریق OTLP صادر می‌شوند.                                              |

`traces`، `metrics`، و `logs` را به‌صورت مستقل تغییر دهید. وقتی
`diagnostics.otel.enabled` درست باشد، هر سه به‌صورت پیش‌فرض فعال هستند.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های نقطه پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی مخصوص سیگنال بر env مخصوص سیگنال اولویت دارد، و آن نیز بر نقطه پایانی مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` را بازنویسی می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل سیمی را بازنویسی می‌کند؛ امروز فقط `http/protobuf` رعایت می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | روی `gen_ai_latest_experimental` تنظیم کنید تا به‌جای `gen_ai.system` قدیمی، تازه‌ترین ویژگی span آزمایشی GenAI (`gen_ai.provider.name`) منتشر شود. متریک‌های GenAI در هر صورت همیشه از ویژگی‌های معنایی محدود و کم‌کاردینالیته استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرآیند میزبان دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند اما همچنان شنونده‌های عیب‌یابی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ثبت محتوا

محتوای خام مدل/ابزار به‌صورت پیش‌فرض صادر **نمی‌شود**. spanها شناسه‌های محدود
(کانال، ارائه‌دهنده، مدل، دسته خطا، شناسه‌های درخواست فقط-هش)
را حمل می‌کنند و هرگز شامل متن prompt، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، یا
کلیدهای نشست نیستند.

درخواست‌های خروجی مدل ممکن است شامل سربرگ W3C `traceparent` باشند. این سربرگ
فقط از زمینه ردیابی عیب‌یابی متعلق به OpenClaw برای فراخوانی مدل فعال
تولید می‌شود. سربرگ‌های `traceparent` موجود که توسط فراخواننده ارائه شده‌اند جایگزین می‌شوند، بنابراین Pluginها یا
گزینه‌های سفارشی ارائه‌دهنده نمی‌توانند تبار ردیابی بین‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط وقتی روی `true` تنظیم کنید که گردآورنده و
سیاست نگه‌داری شما برای متن prompt، پاسخ، ابزار، یا system-prompt
تأیید شده باشند. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` — محتوای prompt کاربر.
- `outputMessages` — محتوای پاسخ مدل.
- `toolInputs` — payloadهای آرگومان ابزار.
- `toolOutputs` — payloadهای نتیجه ابزار.
- `systemPrompt` — prompt سیستم/توسعه‌دهنده مونتاژشده.

وقتی هر زیرکلید فعال باشد، spanهای مدل و ابزار ویژگی‌های محدود و ویرایش‌شده
`openclaw.content.*` را فقط برای همان کلاس دریافت می‌کنند.

## نمونه‌برداری و flush

- **ردیابی‌ها:** `diagnostics.otel.sampleRate` (فقط root-span، `0.0` همه را حذف می‌کند،
  `1.0` همه را نگه می‌دارد).
- **متریک‌ها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **لاگ‌ها:** لاگ‌های OTLP از `logging.level` (سطح لاگ فایل) پیروی می‌کنند. آن‌ها از
  مسیر ویرایش رکورد لاگ عیب‌یابی استفاده می‌کنند، نه قالب‌بندی کنسول. نصب‌های پرترافیک
  باید نمونه‌برداری/فیلترگذاری گردآورنده OTLP را به نمونه‌برداری محلی ترجیح دهند.
- **هم‌بستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک زمینه ردیابی عیب‌یابی معتبر
  حمل کند، شامل `traceId`،
  `spanId`، `parentSpanId`، و `traceFlags` در سطح بالا هستند، که به پردازنده‌های لاگ امکان می‌دهد خط‌های لاگ محلی را با
  spanهای صادرشده پیوند دهند.
- **هم‌بستگی درخواست:** درخواست‌های HTTP Gateway و فریم‌های WebSocket یک
  محدوده ردیابی درخواست داخلی می‌سازند. لاگ‌ها و رخدادهای عیب‌یابی داخل آن محدوده
  به‌صورت پیش‌فرض ردیابی درخواست را به ارث می‌برند، در حالی که spanهای agent run و فراخوانی مدل
  به‌عنوان فرزند ساخته می‌شوند تا سربرگ‌های `traceparent` ارائه‌دهنده روی همان ردیابی بمانند.

## متریک‌های صادرشده

### مصرف مدل

- `openclaw.tokens` (شمارنده، ویژگی‌ها: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، ویژگی‌ها: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، متریک قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، متریک قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، `error.type` اختیاری)
- `openclaw.model_call.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 مربوط به payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 مربوط به رخدادهای پاسخ مدل streamشده؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده پیش از نخستین رخداد پاسخ streamشده)

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
- `openclaw.session.stuck` (شمارنده، ویژگی‌ها: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (هیستوگرام، ویژگی‌ها: `openclaw.state`)
- `openclaw.run.attempt` (شمارنده، ویژگی‌ها: `openclaw.attempt`)

### چرخه عمر harness

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` روی خطاها)

### Exec

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### درونی‌های عیب‌یابی (حافظه و حلقه ابزار)

- `openclaw.memory.heap_used_bytes` (هیستوگرام، ویژگی‌ها: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - به‌صورت پیش‌فرض `gen_ai.system`، یا وقتی جدیدترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌صورت پیش‌فرض `gen_ai.system`، یا وقتی جدیدترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری هنگام خطاها
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (هش محدودشده مبتنی بر SHA از شناسه درخواست provider بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بدون محتوای prompt، history، response یا کلید session)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بدون پیام‌های حلقه، params یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

وقتی ضبط محتوا به‌صراحت فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند
ویژگی‌های محدودشده و ویرایش‌شده `openclaw.content.*` را برای کلاس‌های محتوایی مشخصی
که انتخاب کرده‌اید شامل شوند.

## کاتالوگ رویدادهای تشخیصی

رویدادهای زیر پشتیبان metricها و spanهای بالا هستند. Pluginها همچنین می‌توانند
بدون OTLP export مستقیما در آن‌ها subscribe کنند.

**مصرف مدل**

- `model.usage` — توکن‌ها، هزینه، مدت‌زمان، context، provider/model/channel،
  شناسه‌های session. `usage` حسابداری provider/turn برای هزینه و telemetry است؛
  `context.used` snapshot فعلی prompt/context است و وقتی ورودی cacheشده یا فراخوانی‌های tool-loop درگیر باشند می‌تواند از
  `usage.total` مربوط به provider کمتر باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: webhookها/queue/session)

**چرخه عمر harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  چرخه عمر هر اجرا برای harness عامل. شامل `harnessId`، `pluginId` اختیاری،
  provider/model/channel، و شناسه اجرا است. تکمیل، `durationMs`، `outcome`، `resultClassification` اختیاری، `yieldDetected`،
  و شمارش‌های `itemLifecycle` را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**Exec**

- `exec.process.completed` — نتیجه terminal، مدت‌زمان، هدف، حالت، کد خروج،
  و نوع شکست. متن command و دایرکتوری‌های کاری
  شامل نمی‌شوند.

## بدون exporter

می‌توانید رویدادهای diagnostics را بدون اجرای `diagnostics-otel` برای Pluginها یا sinkهای سفارشی
در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی debug هدفمند بدون افزایش `logging.level`، از flagهای diagnostics
استفاده کنید. flagها به بزرگی و کوچکی حروف حساس نیستند و از wildcardها پشتیبانی می‌کنند (برای مثال `telegram.*` یا
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان override یک‌باره env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی flag به فایل log استاندارد (`logging.file`) می‌رود و همچنان
توسط `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[flagهای Diagnostics](/fa/diagnostics/flags).

## غیرفعال‌سازی

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` کنار بگذارید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [Logging](/fa/logging) — logهای فایل، خروجی کنسول، دنبال‌کردن CLI، و زبانه Logs در Control UI
- [جزئیات داخلی logging در Gateway](/fa/gateway/logging) — سبک‌های log در WS، پیشوندهای زیرسیستم، و ضبط کنسول
- [flagهای Diagnostics](/fa/diagnostics/flags) — flagهای debug-log هدفمند
- [خروجی Diagnostics](/fa/gateway/diagnostics) — ابزار support-bundle برای operator (جدا از OTEL export)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) — مرجع کامل فیلدهای `diagnostics.*`
