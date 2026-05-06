---
read_when:
    - می‌خواهید میزان استفاده از مدل OpenClaw، جریان پیام‌ها، یا معیارهای نشست را به یک گردآورنده OpenTelemetry ارسال کنید
    - در حال اتصال ردیابی‌ها، معیارها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا پشتانهٔ OTLP دیگری هستید
    - برای ساخت داشبوردها یا هشدارها به نام‌های دقیق متریک‌ها، نام‌های اسپن یا ساختار ویژگی‌ها نیاز دارید
summary: داده‌های عیب‌یابی OpenClaw را از طریق Plugin diagnostics-otel ‏(OTLP/HTTP) به هر گردآورندهٔ OpenTelemetry صادر کنید
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T09:19:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw رویدادهای عیب‌یابی را از طریق Plugin رسمی `diagnostics-otel`
با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر گردآورنده یا بک‌اندی که OTLP/HTTP
را بپذیرد، بدون تغییر کد کار می‌کند. برای گزارش‌های فایل محلی و نحوه خواندن آن‌ها، به
[گزارش‌گیری](/fa/logging) مراجعه کنید.

## این اجزا چگونه کنار هم کار می‌کنند

- **رویدادهای عیب‌یابی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها
  و اجرا منتشر می‌شوند.
- **Plugin `diagnostics-otel`** در این رویدادها مشترک می‌شود و آن‌ها را به‌صورت
  **معیارها**، **ردگیری‌ها** و **گزارش‌ها**ی OpenTelemetry از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های ارائه‌دهنده** وقتی انتقال ارائه‌دهنده سرآیندهای سفارشی را بپذیرد،
  یک سرآیند W3C `traceparent` را از زمینه span فراخوانی مدل مورد اعتماد OpenClaw
  دریافت می‌کنند. زمینه ردگیری منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط زمانی متصل می‌شوند که هم سطح عیب‌یابی و هم Plugin
  فعال باشند، بنابراین هزینه درون‌فرایندی به‌صورت پیش‌فرض نزدیک به صفر می‌ماند.

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

| سیگنال      | چه چیزی در آن قرار می‌گیرد                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **معیارها** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، جریان پیام، laneهای صف، وضعیت نشست، exec و فشار حافظه.          |
| **ردگیری‌ها**  | spanها برای مصرف مدل، فراخوانی‌های مدل، چرخه حیات harness، اجرای ابزار، exec، پردازش webhook/پیام، گردآوری زمینه و حلقه‌های ابزار. |
| **گزارش‌ها**    | رکوردهای ساختاریافته `logging.file` که هنگام فعال بودن `diagnostics.otel.logs` از طریق OTLP صادر می‌شوند.                                              |

`traces`، `metrics` و `logs` را به‌صورت مستقل روشن یا خاموش کنید. وقتی
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` را بازنویسی می‌کند. اگر مقدار از قبل شامل `/v1/traces`، `/v1/metrics` یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های endpoint ویژه سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی ویژه سیگنال بر env ویژه سیگنال اولویت دارد، و env ویژه سیگنال بر endpoint مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` را بازنویسی می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل سیمی را بازنویسی می‌کند؛ امروز فقط `http/protobuf` رعایت می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | روی `gen_ai_latest_experimental` تنظیم کنید تا به‌جای `gen_ai.system` قدیمی، تازه‌ترین ویژگی آزمایشی span مربوط به GenAI (`gen_ai.provider.name`) منتشر شود. معیارهای GenAI همیشه، صرف‌نظر از این مورد، از ویژگی‌های معنایی کران‌دار و با کاردینالیتی پایین استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرایند میزبان دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه حیات NodeSDK خودش را رد می‌کند، اما همچنان شنونده‌های عیب‌یابی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ضبط محتوا

محتوای خام مدل/ابزار به‌صورت پیش‌فرض صادر **نمی‌شود**. spanها شناسه‌های
کران‌دار را حمل می‌کنند؛ مانند کانال، ارائه‌دهنده، مدل، دسته خطا و شناسه‌های درخواست فقط-هش؛
و هرگز متن prompt، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار یا
کلیدهای نشست را شامل نمی‌شوند.

درخواست‌های خروجی مدل ممکن است شامل سرآیند W3C `traceparent` باشند. این سرآیند
فقط از زمینه ردگیری عیب‌یابی متعلق به OpenClaw برای فراخوانی مدل فعال
تولید می‌شود. سرآیندهای `traceparent` موجود که از سوی فراخواننده ارائه شده‌اند جایگزین می‌شوند، بنابراین Pluginها یا
گزینه‌های سفارشی ارائه‌دهنده نمی‌توانند تبار ردگیری میان‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط زمانی روی `true` تنظیم کنید که گردآورنده و
سیاست نگهداری شما برای متن prompt، پاسخ، ابزار یا system-prompt
تایید شده باشند. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` - محتوای prompt کاربر.
- `outputMessages` - محتوای پاسخ مدل.
- `toolInputs` - payloadهای آرگومان ابزار.
- `toolOutputs` - payloadهای نتیجه ابزار.
- `systemPrompt` - prompt سیستم/توسعه‌دهنده گردآوری‌شده.

وقتی هر زیرکلید فعال باشد، spanهای مدل و ابزار فقط برای همان کلاس،
ویژگی‌های کران‌دار و حذف‌سازی‌شده `openclaw.content.*` دریافت می‌کنند.

## نمونه‌برداری و flush

- **ردگیری‌ها:** `diagnostics.otel.sampleRate` (فقط root-span، `0.0` همه را حذف می‌کند،
  `1.0` همه را نگه می‌دارد).
- **معیارها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **گزارش‌ها:** گزارش‌های OTLP از `logging.level` (سطح گزارش فایل) تبعیت می‌کنند. آن‌ها از
  مسیر حذف‌سازی رکورد گزارش عیب‌یابی استفاده می‌کنند، نه قالب‌بندی console. نصب‌های پرترافیک
  باید نمونه‌برداری/فیلترگذاری گردآورنده OTLP را به نمونه‌برداری محلی ترجیح دهند.
- **هم‌بستگی گزارش فایل:** گزارش‌های فایل JSONL وقتی فراخوانی گزارش یک
  زمینه ردگیری عیب‌یابی معتبر داشته باشد، شامل `traceId`،
  `spanId`، `parentSpanId` و `traceFlags` در سطح بالا هستند؛ این به پردازشگرهای گزارش اجازه می‌دهد خطوط گزارش محلی را با
  spanهای صادرشده پیوند دهند.
- **هم‌بستگی درخواست:** درخواست‌های HTTP در Gateway و frameهای WebSocket یک
  دامنه ردگیری درخواست داخلی ایجاد می‌کنند. گزارش‌ها و رویدادهای عیب‌یابی داخل آن دامنه
  به‌صورت پیش‌فرض ردگیری درخواست را به ارث می‌برند، در حالی که spanهای اجرای agent و فراخوانی مدل
  به‌عنوان فرزند ساخته می‌شوند تا سرآیندهای `traceparent` ارائه‌دهنده روی همان ردگیری باقی بمانند.

## معیارهای صادرشده

### مصرف مدل

- `openclaw.tokens` (شمارنده، ویژگی‌ها: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، ویژگی‌ها: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، معیار قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، معیار قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، `error.type` اختیاری)
- `openclaw.model_call.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 مربوط به payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 مربوط به رویدادهای پاسخ مدل streamشده؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده پیش از نخستین رویداد پاسخ streamشده)

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
- `openclaw.session.stuck` (شمارنده، ویژگی‌ها: `openclaw.state`؛ فقط برای ثبت وضعیت نشست‌های stale بدون کار فعال منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، ویژگی‌ها: `openclaw.state`؛ فقط برای ثبت وضعیت نشست‌های stale بدون کار فعال منتشر می‌شود)
- `openclaw.run.attempt` (شمارنده، ویژگی‌ها: `openclaw.attempt`)

### telemetry زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای عیب‌یابی زنده‌بودن نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت پاسخ، ابزار، وضعیت، بلوک یا runtime مربوط به ACP را مشاهده کند، به سمت این آستانه پیر نمی‌شود.
keepaliveهای تایپ به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین مدل یا harness خاموش
همچنان قابل شناسایی است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار جاسازی‌شدهٔ فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار هنوز در حال پیشرفت هستند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر گزارش نکرده است. اجراهای جاسازی‌شدهٔ متوقف‌شده ابتدا فقط در حالت مشاهده می‌مانند، سپس پس از `diagnostics.stuckSessionAbortMs` بدون پیشرفت، abort-drain می‌شوند تا نوبت‌های صف‌شده پشت lane بتوانند از سر گرفته شوند. وقتی تنظیم نشده باشد، آستانهٔ abort به‌طور پیش‌فرض روی پنجرهٔ امن‌ترِ طولانی‌تر، یعنی حداقل ۱۰ دقیقه و ۵ برابر `diagnostics.stuckSessionWarnMs` قرار می‌گیرد.
- `session.stuck`: حسابداری نشست کهنه بدون کار فعال. این مورد lane نشستِ تحت‌تأثیر را بلافاصله آزاد می‌کند.

بازیابی رویدادهای ساختاریافتهٔ `session.recovery.requested` و
`session.recovery.completed` را منتشر می‌کند. وضعیت تشخیصی نشست فقط پس از یک نتیجهٔ بازیابی تغییردهنده (`aborted` یا `released`) و فقط در صورتی که همان نسل پردازش همچنان جاری باشد، idle علامت‌گذاری می‌شود.

فقط `session.stuck` شمارندهٔ `openclaw.session.stuck`، هیستوگرام
`openclaw.session.stuck_age_ms`، و span
`openclaw.session.stuck` را منتشر می‌کند. تشخیص‌های تکراری `session.stuck` تا زمانی که نشست بدون تغییر بماند back off می‌کنند، بنابراین داشبوردها باید به افزایش‌های پایدار هشدار بدهند نه به هر تیک Heartbeat. برای گزینهٔ پیکربندی و پیش‌فرض‌ها، به
[مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) مراجعه کنید.

### چرخهٔ عمر harness

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` در خطاها)

### Exec

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### جزئیات داخلی diagnostics (حافظه و حلقهٔ ابزار)

- `openclaw.memory.heap_used_bytes` (هیستوگرام، ویژگی‌ها: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، ویژگی‌ها: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.toolName`, `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` به‌طور پیش‌فرض، یا `gen_ai.provider.name` وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` به‌طور پیش‌فرض، یا `gen_ai.provider.name` وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بدون محتوای prompt، history، response یا session-key)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بدون پیام‌های loop، پارامترها یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

وقتی ضبط محتوا به‌صراحت فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند ویژگی‌های محدود و ویرایش‌شدهٔ `openclaw.content.*` را برای کلاس‌های محتوای مشخصی که انتخاب کرده‌اید شامل شوند.

## کاتالوگ رویدادهای تشخیصی

رویدادهای زیر پشتیبان متریک‌ها و spanهای بالا هستند. Pluginها همچنین می‌توانند بدون صدور OTLP مستقیماً در آن‌ها مشترک شوند.

**مصرف مدل**

- `model.usage` - توکن‌ها، هزینه، مدت‌زمان، context، ارائه‌دهنده/مدل/کانال، شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و telemetry است؛ `context.used` snapshot فعلی prompt/context است و وقتی ورودی کش‌شده یا فراخوانی‌های tool-loop درگیر باشند، می‌تواند از `usage.total` ارائه‌دهنده کمتر باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و نشست**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: webhooks/queue/session)

**چرخهٔ عمر harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  چرخهٔ عمر به‌ازای هر اجرا برای harness عامل. شامل `harnessId`، `pluginId` اختیاری، ارائه‌دهنده/مدل/کانال، و شناسهٔ اجرا است. تکمیل، `durationMs`، `outcome`، `resultClassification` اختیاری، `yieldDetected`، و شمارش‌های `itemLifecycle` را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**Exec**

- `exec.process.completed` - نتیجهٔ پایانه، مدت‌زمان، هدف، حالت، کد خروج، و نوع شکست. متن فرمان و دایرکتوری‌های کاری شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای diagnostics را بدون اجرای `diagnostics-otel` برای Pluginها یا sinkهای سفارشی در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی اشکال‌زدایی هدفمند بدون افزایش `logging.level`، از پرچم‌های diagnostics استفاده کنید. پرچم‌ها به بزرگی/کوچکی حروف حساس نیستند و از wildcard پشتیبانی می‌کنند (مثلاً `telegram.*` یا
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان یک override یک‌بارهٔ env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی پرچم به فایل log استاندارد (`logging.file`) می‌رود و همچنان توسط `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[پرچم‌های diagnostics](/fa/diagnostics/flags).

## غیرفعال‌سازی

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` بیرون بگذارید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [Logging](/fa/logging) - logهای فایل، خروجی کنسول، دنبال‌کردن از CLI، و زبانهٔ Logs در Control UI
- [جزئیات داخلی logging در Gateway](/fa/gateway/logging) - سبک‌های log برای WS، پیشوندهای زیرسامانه، و ضبط کنسول
- [پرچم‌های diagnostics](/fa/diagnostics/flags) - پرچم‌های debug-log هدفمند
- [صدور diagnostics](/fa/gateway/diagnostics) - ابزار support-bundle برای اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) - مرجع کامل فیلدهای `diagnostics.*`
