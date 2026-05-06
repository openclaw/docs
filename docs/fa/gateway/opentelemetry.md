---
read_when:
    - می‌خواهید میزان استفاده از مدل‌های OpenClaw، جریان پیام‌ها، یا معیارهای نشست را به یک گردآورنده OpenTelemetry ارسال کنید
    - شما در حال اتصال ردیابی‌ها، سنجه‌ها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک بک‌اند OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها، به نام‌های دقیق معیارها، نام‌های اسپن‌ها، یا ساختار ویژگی‌ها نیاز دارید.
summary: داده‌های عیب‌یابی OpenClaw را از طریق Plugin diagnostics-otel (OTLP/HTTP) به هر گردآورنده OpenTelemetry صادر کنید
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T11:59:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw تشخیص‌ها را از طریق Plugin رسمی `diagnostics-otel`
با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر گردآورنده یا پشتیبانی که OTLP/HTTP را بپذیرد
بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و نحوه خواندن آن‌ها، [لاگ‌گیری](/fa/logging) را ببینید.

## نحوه کنار هم قرار گرفتن اجزا

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها،
  و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** مشترک آن رویدادها می‌شود و آن‌ها را به‌صورت
  **معیارها**، **ردها**، و **لاگ‌ها**ی OpenTelemetry از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های ارائه‌دهنده** وقتی انتقال‌دهنده ارائه‌دهنده سربرگ‌های سفارشی را بپذیرد، یک سربرگ W3C `traceparent` را از زمینه span مورد اعتماد فراخوانی مدل OpenClaw دریافت می‌کنند. زمینه رد منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط وقتی هم سطح تشخیص و هم Plugin فعال باشند متصل می‌شوند، بنابراین هزینه درون‌فرایندی به‌طور پیش‌فرض نزدیک به صفر می‌ماند.

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

| سیگنال      | محتویات آن                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **معیارها** | شمارنده‌ها و هیستوگرام‌هایی برای مصرف توکن، هزینه، مدت اجرای run، جریان پیام، رویدادهای Talk، مسیرهای صف، وضعیت/بازیابی نشست، exec، و فشار حافظه. |
| **ردها**  | Spanهایی برای استفاده از مدل، فراخوانی‌های مدل، چرخه عمر harness، اجرای ابزار، exec، پردازش webhook/پیام، مونتاژ زمینه، و حلقه‌های ابزار.              |
| **لاگ‌ها**    | رکوردهای ساختاریافته `logging.file` که وقتی `diagnostics.otel.logs` فعال باشد از طریق OTLP صادر می‌شوند.                                                           |

`traces`، `metrics`، و `logs` را مستقل از هم تغییر وضعیت دهید. هر سه وقتی
`diagnostics.otel.enabled` برابر true باشد به‌طور پیش‌فرض روشن هستند.

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های endpoint ویژه سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی ویژه سیگنال بر env ویژه سیگنال اولویت دارد، و آن نیز بر endpoint مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` را بازنویسی می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل سیمی را بازنویسی می‌کند؛ امروز فقط `http/protobuf` پذیرفته می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | برای انتشار آخرین ویژگی آزمایشی span در GenAI (`gen_ai.provider.name`) به‌جای `gen_ai.system` قدیمی، روی `gen_ai_latest_experimental` تنظیم کنید. معیارهای GenAI همیشه بدون توجه به این مورد از ویژگی‌های معنایی محدود و کم‌کاردینالیتی استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرایند میزبان دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند، اما همچنان شنونده‌های تشخیصی را متصل می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ضبط محتوا

محتوای خام مدل/ابزار به‌طور پیش‌فرض صادر **نمی‌شود**. Spanها شناسه‌های محدود
را حمل می‌کنند؛ مانند کانال، ارائه‌دهنده، مدل، دسته خطا، و شناسه‌های درخواست فقط-هش؛
و هرگز شامل متن prompt، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، یا
کلیدهای نشست نمی‌شوند.
معیارهای Talk فقط فراداده رویداد محدود مانند حالت، انتقال،
ارائه‌دهنده، و نوع رویداد را صادر می‌کنند. آن‌ها شامل transcriptها، payloadهای صوتی،
شناسه‌های نشست، شناسه‌های turn، شناسه‌های call، شناسه‌های room، یا توکن‌های handoff نمی‌شوند.

درخواست‌های خروجی مدل ممکن است شامل سربرگ W3C `traceparent` باشند. آن سربرگ
فقط از زمینه رد تشخیصی متعلق به OpenClaw برای فراخوانی مدل فعال تولید می‌شود.
سربرگ‌های `traceparent` ارائه‌شده توسط فراخواننده موجود جایگزین می‌شوند، بنابراین Pluginها یا
گزینه‌های سفارشی ارائه‌دهنده نمی‌توانند تبار رد میان‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط وقتی روی `true` تنظیم کنید که گردآورنده و
سیاست نگهداری شما برای متن prompt، پاسخ، ابزار، یا system-prompt
تأیید شده باشند. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` - محتوای prompt کاربر.
- `outputMessages` - محتوای پاسخ مدل.
- `toolInputs` - payloadهای آرگومان ابزار.
- `toolOutputs` - payloadهای نتیجه ابزار.
- `systemPrompt` - prompt سیستم/توسعه‌دهنده مونتاژشده.

وقتی هر زیرکلید فعال باشد، spanهای مدل و ابزار فقط برای همان کلاس
ویژگی‌های محدود و ویرایش‌شده `openclaw.content.*` را دریافت می‌کنند.

## نمونه‌برداری و flush

- **ردها:** `diagnostics.otel.sampleRate` (فقط root-span؛ `0.0` همه را حذف می‌کند،
  `1.0` همه را نگه می‌دارد).
- **معیارها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **لاگ‌ها:** لاگ‌های OTLP از `logging.level` (سطح لاگ فایل) پیروی می‌کنند. آن‌ها از
  مسیر ویرایش رکورد لاگ تشخیصی استفاده می‌کنند، نه قالب‌بندی کنسول. نصب‌های پرترافیک
  باید نمونه‌برداری/فیلترگذاری گردآورنده OTLP را به نمونه‌برداری محلی ترجیح دهند.
- **همبستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ دارای زمینه رد تشخیصی معتبر باشد، شامل `traceId`،
  `spanId`، `parentSpanId`، و `traceFlags` در سطح بالا هستند؛ این به پردازشگرهای لاگ اجازه می‌دهد خطوط لاگ محلی را با
  spanهای صادرشده پیوند دهند.
- **همبستگی درخواست:** درخواست‌های HTTP Gateway و فریم‌های WebSocket یک
  محدوده رد درخواست داخلی ایجاد می‌کنند. لاگ‌ها و رویدادهای تشخیصی داخل آن محدوده
  به‌طور پیش‌فرض رد درخواست را به ارث می‌برند، در حالی که runهای agent و spanهای فراخوانی مدل
  به‌عنوان فرزند ساخته می‌شوند تا سربرگ‌های `traceparent` ارائه‌دهنده روی همان رد بمانند.

## معیارهای صادرشده

### استفاده از مدل

- `openclaw.tokens` (شمارنده، attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، معیار قراردادهای معنایی GenAI، attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، معیار قراردادهای معنایی GenAI، attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختیاری `error.type`)
- `openclaw.model_call.duration_ms` (هیستوگرام، attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` برای خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایت UTF-8 در payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایت UTF-8 رویدادهای پاسخ مدل stream شده؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده تا پیش از نخستین رویداد پاسخ stream شده)

### جریان پیام

- `openclaw.webhook.received` (شمارنده، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (شمارنده، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (شمارنده، attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (شمارنده، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (شمارنده، attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (شمارنده، attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (هیستوگرام، attrs: همانند `openclaw.talk.event`؛ وقتی رویداد Talk مدت را گزارش کند منتشر می‌شود)
- `openclaw.talk.audio.bytes` (هیستوگرام، attrs: همانند `openclaw.talk.event`؛ برای رویدادهای فریم صوتی Talk که طول بایت را گزارش می‌کنند منتشر می‌شود)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.depth` (هیستوگرام، ویژگی‌ها: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (هیستوگرام، ویژگی‌ها: `openclaw.lane`)
- `openclaw.session.state` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (شمارنده، ویژگی‌ها: `openclaw.state`؛ فقط برای حسابداری نشست‌های کهنه بدون کار فعال منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، ویژگی‌ها: `openclaw.state`؛ فقط برای حسابداری نشست‌های کهنه بدون کار فعال منتشر می‌شود)
- `openclaw.session.recovery.requested` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.completed` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.status`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (هیستوگرام، ویژگی‌ها: همان شمارنده بازیابی متناظر)
- `openclaw.run.attempt` (شمارنده، ویژگی‌ها: `openclaw.attempt`)

### دورسنجی زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای عیب‌یابی زنده‌بودن نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت پاسخ، ابزار، وضعیت، بلوک یا اجرای ACP را مشاهده می‌کند، به سمت این آستانه پیر نمی‌شود. keepaliveهای تایپ به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین همچنان می‌توان یک مدل یا هارنس خاموش را تشخیص داد.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند دسته‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شده فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار همچنان در حال پیشرفت هستند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر گزارش نکرده است. اجراهای تعبیه‌شده متوقف‌شده در ابتدا فقط مشاهده می‌شوند، سپس پس از `diagnostics.stuckSessionAbortMs` بدون پیشرفت، abort-drain می‌شوند تا نوبت‌های صف‌شده پشت lane بتوانند از سر گرفته شوند. وقتی تنظیم نشده باشد، آستانه توقف به‌طور پیش‌فرض به پنجره توسعه‌یافته امن‌ترِ دست‌کم ۱۰ دقیقه و ۵ برابر `diagnostics.stuckSessionWarnMs` تنظیم می‌شود.
- `session.stuck`: حسابداری نشست کهنه بدون کار فعال. این مورد lane نشست تحت‌تأثیر را بلافاصله آزاد می‌کند.

بازیابی رویدادهای ساخت‌یافته `session.recovery.requested` و `session.recovery.completed` را منتشر می‌کند. وضعیت نشست عیب‌یابی فقط پس از نتیجه بازیابی تغییردهنده (`aborted` یا `released`) و فقط در صورتی که همان نسل پردازش هنوز جاری باشد، idle علامت‌گذاری می‌شود.

فقط `session.stuck` شمارنده `openclaw.session.stuck`، هیستوگرام `openclaw.session.stuck_age_ms` و span‏ `openclaw.session.stuck` را منتشر می‌کند. عیب‌یابی‌های تکراری `session.stuck` تا زمانی که نشست بدون تغییر بماند عقب‌نشینی می‌کنند، بنابراین داشبوردها باید به افزایش‌های پایدار هشدار دهند، نه به هر tick‏ Heartbeat. برای دستگیره پیکربندی و مقدارهای پیش‌فرض، [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) را ببینید.

### چرخه عمر هارنس

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` هنگام خطاها)

### اجرا

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### بخش‌های داخلی عیب‌یابی (حافظه و حلقه ابزار)

- `openclaw.memory.heap_used_bytes` (هیستوگرام، ویژگی‌ها: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (ورودی/خروجی/خواندن کش/نوشتن کش/کل)
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی جدیدترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی جدیدترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری هنگام خطاها
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسه درخواست ارائه‌دهنده بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
- `openclaw.harness.run`
  - `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.provider`، `openclaw.model`، `openclaw.channel`
  - هنگام تکمیل: `openclaw.harness.result_classification`، `openclaw.harness.yield_detected`، `openclaw.harness.items.started`، `openclaw.harness.items.completed`، `openclaw.harness.items.active`
  - هنگام خطا: `openclaw.harness.phase`، `openclaw.errorCategory`، `openclaw.harness.cleanup_failed` اختیاری
- `openclaw.tool.execution`
  - `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.errorCategory`، `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`، `openclaw.exec.command_length`، `openclaw.exec.exit_code`، `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`، `openclaw.webhook`
- `openclaw.webhook.error`
  - `openclaw.channel`، `openclaw.webhook`، `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`، `openclaw.outcome`، `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`، `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`، `openclaw.ageMs`، `openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بدون محتوای prompt، history، response، یا session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بدون پیام‌های حلقه، پارامترها، یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

وقتی ضبط محتوا به‌صراحت فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند ویژگی‌های محدود و ویرایش‌شده `openclaw.content.*` را برای کلاس‌های محتوای مشخصی که در آن‌ها opt in کرده‌اید شامل شوند.

## کاتالوگ رویدادهای عیب‌یابی

رویدادهای زیر پشتیبان معیارها و spanهای بالا هستند. Pluginها همچنین می‌توانند بدون صدور OTLP مستقیماً در آن‌ها مشترک شوند.

**مصرف مدل**

- `model.usage` - توکن‌ها، هزینه، مدت، context، ارائه‌دهنده/مدل/کانال، شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و دورسنجی است؛ `context.used` تصویر لحظه‌ای prompt/context فعلی است و وقتی ورودی کش‌شده یا فراخوانی‌های حلقه ابزار دخیل باشند، می‌تواند کمتر از `usage.total` ارائه‌دهنده باشد.

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

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - چرخه عمر هر اجرا برای هارنس عامل. شامل `harnessId`، `pluginId` اختیاری، ارائه‌دهنده/مدل/کانال، و شناسه اجرا است. تکمیل، `durationMs`، `outcome`، `resultClassification` اختیاری، `yieldDetected`، و شمارش‌های `itemLifecycle` را اضافه می‌کند. خطاها `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و `cleanupFailed` اختیاری را اضافه می‌کنند.

**اجرا**

- `exec.process.completed` - نتیجه پایانه، مدت، هدف، حالت، کد خروج، و نوع خرابی. متن فرمان و دایرکتوری‌های کاری شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای عیب‌یابی را بدون اجرای `diagnostics-otel` برای Pluginها یا sinkهای سفارشی در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی اشکال‌زدایی هدفمند بدون بالا بردن `logging.level`، از flagهای عیب‌یابی استفاده کنید. flagها به بزرگی و کوچکی حروف حساس نیستند و از wildcardها پشتیبانی می‌کنند (برای مثال `telegram.*` یا `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان یک بازنویسی env یک‌باره:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی flag به فایل لاگ استاندارد (`logging.file`) می‌رود و همچنان توسط `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل: [flagهای عیب‌یابی](/fa/diagnostics/flags).

## غیرفعال‌سازی

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` خارج کنید، یا `openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [لاگ‌گیری](/fa/logging) - لاگ‌های فایل، خروجی کنسول، tail کردن با CLI، و تب لاگ‌های Control UI
- [بخش‌های داخلی لاگ‌گیری Gateway](/fa/gateway/logging) - سبک‌های لاگ WS، پیشوندهای زیرسیستم، و ضبط کنسول
- [flagهای عیب‌یابی](/fa/diagnostics/flags) - flagهای هدفمند لاگ اشکال‌زدایی
- [صدور عیب‌یابی](/fa/gateway/diagnostics) - ابزار support-bundle اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) - مرجع کامل فیلد `diagnostics.*`
