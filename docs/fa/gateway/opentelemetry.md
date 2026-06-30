---
read_when:
    - می‌خواهید معیارهای مصرف مدل OpenClaw، جریان پیام، یا نشست را به یک گردآورنده OpenTelemetry ارسال کنید
    - شما در حال اتصال ردیابی‌ها، معیارها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک بک‌اند OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها به نام‌های دقیق معیارها، نام‌های span یا شکل ویژگی‌ها نیاز دارید
summary: صدور عیب‌یابی‌های OpenClaw به گردآورنده‌های OpenTelemetry یا stdout JSONL از طریق Plugin diagnostics-otel
title: خروجی‌گیری OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:18:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw تشخیص‌ها را از طریق Plugin رسمی `diagnostics-otel`
با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. گزارش‌ها همچنین می‌توانند به‌صورت stdout JSONL برای
خط لوله‌های گزارش کانتینر و سندباکس نوشته شوند. هر گردآورنده یا بک‌اندی که
OTLP/HTTP را بپذیرد، بدون تغییر کد کار می‌کند. برای گزارش‌های فایل محلی و روش خواندن آن‌ها،
[گزارش‌گیری](/fa/logging) را ببینید.

## چگونگی کنار هم قرار گرفتن اجزا

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها،
  و اجرا منتشر می‌شوند.
- **Plugin `diagnostics-otel`** در آن رویدادها مشترک می‌شود و آن‌ها را به‌صورت
  **معیارها**، **ردیابی‌ها**، و **گزارش‌ها**ی OpenTelemetry از طریق OTLP/HTTP صادر می‌کند. همچنین می‌تواند
  رکوردهای گزارش تشخیصی را به stdout JSONL آینه کند.
- **فراخوانی‌های ارائه‌دهنده** وقتی انتقال ارائه‌دهنده سرآیندهای سفارشی را بپذیرد، یک سرآیند W3C `traceparent` را از
  زمینه span فراخوانی مدل مورد اعتماد OpenClaw دریافت می‌کنند. زمینه ردیابی منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط وقتی وصل می‌شوند که هم سطح تشخیص و هم Plugin
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

| سیگنال      | آنچه در آن قرار می‌گیرد                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **معیارها** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، جابه‌جایی خرابی، استفاده از skill، جریان پیام، رویدادهای Talk، مسیرهای صف، وضعیت/بازیابی نشست، اجرای ابزار، payloadهای بیش‌ازحد بزرگ، exec، و فشار حافظه. |
| **ردیابی‌ها**  | Spanها برای استفاده از مدل، فراخوانی‌های مدل، چرخه عمر harness، استفاده از skill، اجرای ابزار، exec، پردازش webhook/پیام، مونتاژ زمینه، و حلقه‌های ابزار.                                                            |
| **گزارش‌ها**    | رکوردهای ساختاریافته `logging.file` که از طریق OTLP یا stdout JSONL هنگام فعال بودن `diagnostics.otel.logs` صادر می‌شوند؛ بدنه‌های گزارش پنهان نگه داشته می‌شوند مگر اینکه ضبط محتوا صراحتا فعال شده باشد.                                |

`traces`، `metrics`، و `logs` را به‌صورت مستقل تغییر دهید. ردیابی‌ها و معیارها
وقتی `diagnostics.otel.enabled` برابر true باشد، به‌صورت پیش‌فرض روشن هستند. گزارش‌ها به‌صورت پیش‌فرض خاموش هستند و
فقط وقتی صادر می‌شوند که `diagnostics.otel.logs` صراحتا `true` باشد. صدور گزارش
به‌صورت پیش‌فرض OTLP است؛ برای JSONL روی stdout مقدار `diagnostics.otel.logsExporter` را روی `stdout` تنظیم کنید،
یا برای ارسال هر رکورد گزارش تشخیصی به OTLP و stdout مقدار `both` را تنظیم کنید.

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

### متغیرهای محیطی

| متغیر                                                                                                          | هدف                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | بازنویسی `diagnostics.otel.endpoint`. اگر مقدار از قبل شامل `/v1/traces`، `/v1/metrics`، یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های نقطه پایانی مخصوص سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی مخصوص سیگنال بر env مخصوص سیگنال اولویت دارد، و آن نیز بر نقطه پایانی مشترک اولویت دارد.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | بازنویسی `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | بازنویسی پروتکل سیمی (امروز فقط `http/protobuf` رعایت می‌شود).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | برای انتشار جدیدترین شکل span استنتاج GenAI آزمایشی، از جمله نام‌های span به‌صورت `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span به‌صورت `CLIENT`، و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی، روی `gen_ai_latest_experimental` تنظیم کنید. معیارهای GenAI همیشه، صرف‌نظر از این تنظیم، از ویژگی‌های معنایی محدود و با کاردینالیتی پایین استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرایند میزبان دیگری از قبل SDK جهانی OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند اما همچنان شنونده‌های تشخیصی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                                                                                                                    |

## حریم خصوصی و ضبط محتوا

محتوای خام مدل/ابزار به‌صورت پیش‌فرض صادر **نمی‌شود**. Spanها شناسه‌های محدود
(کانال، ارائه‌دهنده، مدل، دسته خطا، شناسه‌های درخواست فقط هش،
منبع ابزار، مالک ابزار، و نام/منبع skill) را حمل می‌کنند و هرگز شامل متن prompt،
متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، مسیرهای فایل skill، یا کلیدهای نشست نیستند.
رکوردهای گزارش OTLP به‌صورت پیش‌فرض شدت، logger، محل کد، زمینه ردیابی مورد اعتماد،
و ویژگی‌های پاک‌سازی‌شده را نگه می‌دارند، اما بدنه پیام خام گزارش
فقط وقتی صادر می‌شود که `diagnostics.otel.captureContent` روی boolean `true` تنظیم شده باشد. زیرکلیدهای جزئی
`captureContent.*` بدنه‌های گزارش را فعال نمی‌کنند. برچسب‌هایی که شبیه
کلیدهای نشست عامل scoped هستند با `unknown` جایگزین می‌شوند.
معیارهای Talk فقط فراداده رویداد محدود مانند حالت، انتقال،
ارائه‌دهنده، و نوع رویداد را صادر می‌کنند. آن‌ها شامل رونوشت‌ها، payloadهای صوتی،
شناسه‌های نشست، شناسه‌های turn، شناسه‌های call، شناسه‌های room، یا توکن‌های handoff نیستند.

درخواست‌های خروجی مدل ممکن است شامل یک سرآیند W3C `traceparent` باشند. آن سرآیند
فقط از زمینه ردیابی تشخیصی متعلق به OpenClaw برای فراخوانی مدل فعال
تولید می‌شود. سرآیندهای `traceparent` ارائه‌شده توسط فراخواننده موجود جایگزین می‌شوند، بنابراین Pluginها یا
گزینه‌های ارائه‌دهنده سفارشی نمی‌توانند تبار ردیابی میان‌سرویسی را جعل کنند.

فقط زمانی `diagnostics.otel.captureContent.*` را روی `true` تنظیم کنید که گردآورنده و
سیاست نگهداری شما برای متن prompt، پاسخ، ابزار، یا system-prompt
تایید شده باشند. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` - محتوای prompt کاربر.
- `outputMessages` - محتوای پاسخ مدل.
- `toolInputs` - payloadهای آرگومان ابزار.
- `toolOutputs` - payloadهای نتیجه ابزار.
- `systemPrompt` - prompt سیستم/توسعه‌دهنده مونتاژشده.
- `toolDefinitions` - نام‌ها، توضیحات، و schemaهای ابزار مدل.

وقتی هر زیرکلیدی فعال باشد، spanهای مدل و ابزار ویژگی‌های محدود و ویرایش‌شده
`openclaw.content.*` را فقط برای همان کلاس دریافت می‌کنند. از boolean
`captureContent: true` فقط برای ضبط‌های تشخیصی گسترده استفاده کنید که در آن‌ها بدنه‌های پیام گزارش OTLP
نیز برای صدور تایید شده‌اند.

محتوای `toolInputs`/`toolOutputs` برای اجراهای ابزار runtime عامل داخلی
ضبط می‌شود (`openclaw.content.tool_input` روی spanهای تکمیل‌شده/خطادار،
`openclaw.content.tool_output` روی spanهای تکمیل‌شده). فراخوانی‌های ابزار harness خارجی
(Codex, Claude CLI) spanهای `tool.execution.*` را بدون payloadهای محتوا منتشر می‌کنند.
محتوای ضبط‌شده روی یک کانال مورد اعتماد و فقط شنونده جابه‌جا می‌شود و هرگز
روی bus رویداد تشخیصی عمومی قرار نمی‌گیرد.

## نمونه‌برداری و تخلیه

- **ردیابی‌ها:** `diagnostics.otel.sampleRate` (فقط root-span، مقدار `0.0` همه را حذف می‌کند،
  مقدار `1.0` همه را نگه می‌دارد).
- **معیارها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **لاگ‌ها:** لاگ‌های OTLP از `logging.level` (سطح لاگ فایل) پیروی می‌کنند. آن‌ها از مسیر
  ویرایش لاگ‌-رکورد تشخیصی استفاده می‌کنند، نه قالب‌بندی کنسول. نصب‌های پرترافیک
  باید نمونه‌برداری/فیلترگذاری کلکتور OTLP را به نمونه‌برداری محلی ترجیح دهند.
  وقتی پلتفرم شما از قبل stdout/stderr را به پردازشگر لاگ ارسال می‌کند و کلکتور
  لاگ OTLP ندارید، `diagnostics.otel.logsExporter: "stdout"` را تنظیم کنید.
  رکوردهای stdout در هر خط یک شیء JSON هستند و شامل `ts`، `signal`،
  `service.name`، شدت، بدنه، ویژگی‌های ویرایش‌شده، و فیلدهای ردیابی مورد اعتماد
  در صورت وجود هستند.
- **هم‌بستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک زمینه ردیابی
  تشخیصی معتبر داشته باشد، شامل `traceId`، `spanId`، `parentSpanId` و
  `traceFlags` در سطح بالا هستند؛ این امکان را می‌دهد که پردازشگرهای لاگ خطوط
  لاگ محلی را با spanهای صادرشده پیوند دهند.
- **هم‌بستگی درخواست:** درخواست‌های HTTP Gateway و فریم‌های WebSocket یک محدوده
  ردیابی درخواست داخلی ایجاد می‌کنند. لاگ‌ها و رویدادهای تشخیصی داخل آن محدوده
  به‌طور پیش‌فرض ردیابی درخواست را به ارث می‌برند، در حالی که spanهای اجرای عامل
  و فراخوانی مدل به‌عنوان فرزند ساخته می‌شوند تا سرآیندهای `traceparent` ارائه‌دهنده
  روی همان ردیابی باقی بمانند.
- **هم‌بستگی فراخوانی مدل:** spanهای `openclaw.model.call` به‌طور پیش‌فرض شامل
  اندازه‌های امن مؤلفه‌های پرامپت هستند و وقتی نتیجه ارائه‌دهنده usage را آشکار کند،
  ویژگی‌های توکن هر فراخوانی را نیز شامل می‌شوند. `openclaw.model.usage` همچنان
  span حسابداری سطح اجرا برای هزینه تجمیعی، زمینه و داشبوردهای کانال است؛ وقتی
  runtime منتشرکننده زمینه ردیابی مورد اعتماد داشته باشد، روی همان ردیابی تشخیصی
  باقی می‌ماند.

## معیارهای صادرشده

### مصرف مدل

- `openclaw.tokens` (شمارنده، attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، معیار قراردادهای معنایی GenAI، attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، معیار قراردادهای معنایی GenAI، attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختیاری `error.type`)
- `openclaw.model_call.duration_ms` (هیستوگرام، attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` در خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 محتوای نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 محتوای chunkهای پاسخ جریانی؛ دلتاهای پرتکرار متن، تفکر، و tool-call فقط بایت‌های افزایشی `delta` را می‌شمارند؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده پیش از نخستین رویداد پاسخ جریانی)
- `openclaw.model.failover` (شمارنده، attrs: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (شمارنده، attrs: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, اختیاری `openclaw.agent`, اختیاری `openclaw.toolName`)

### جریان پیام

- `openclaw.webhook.received` (شمارنده، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (شمارنده، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (شمارنده، attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (شمارنده، attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (شمارنده، attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (شمارنده، attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (شمارنده، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (شمارنده، attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (هیستوگرام، attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### گفت‌وگو

- `openclaw.talk.event` (شمارنده، attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (هیستوگرام، attrs: همان `openclaw.talk.event`؛ وقتی رویداد گفت‌وگو duration گزارش کند منتشر می‌شود)
- `openclaw.talk.audio.bytes` (هیستوگرام، attrs: همان `openclaw.talk.event`؛ برای رویدادهای فریم صوتی گفت‌وگو که طول بایت را گزارش می‌کنند منتشر می‌شود)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (شمارنده، attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (شمارنده، attrs: `openclaw.lane`)
- `openclaw.queue.depth` (هیستوگرام، attrs: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (هیستوگرام، attrs: `openclaw.lane`)
- `openclaw.session.state` (شمارنده، attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (شمارنده، attrs: `openclaw.state`؛ برای ثبت وضعیت نشست کهنه قابل بازیابی منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، attrs: `openclaw.state`؛ برای ثبت وضعیت نشست کهنه قابل بازیابی منتشر می‌شود)
- `openclaw.session.turn.created` (شمارنده، attrs: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (شمارنده، attrs: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (شمارنده، attrs: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (هیستوگرام، attrs: همان شمارنده بازیابی متناظر)
- `openclaw.run.attempt` (شمارنده، attrs: `openclaw.attempt`)

### تله‌متری زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای تشخیص‌های زنده‌بودن
نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت پاسخ، ابزار، وضعیت،
بلاک، یا runtime متعلق به ACP را مشاهده می‌کند، به سمت این آستانه پیر نمی‌شود.
keepaliveهای تایپ به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین یک مدل یا harness
ساکت همچنان قابل تشخیص است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شده فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار
  همچنان در حال پیشرفت هستند. فراخوانی‌های مدلِ دارای مالک که پس از
  `diagnostics.stuckSessionWarnMs` ساکت بمانند نیز پیش از
  `diagnostics.stuckSessionAbortMs` به‌عنوان طولانی‌اجرا گزارش می‌شوند تا
  ارائه‌دهندگان مدل کند یا غیرجریانی، تا وقتی همچنان قابل مشاهده برای لغو هستند،
  مانند نشست‌های متوقف‌شده gateway به نظر نرسند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر گزارش نکرده
  است. فراخوانی‌های مدل دارای مالک در زمان `diagnostics.stuckSessionAbortMs`
  یا پس از آن از `session.long_running` به `session.stalled` تغییر می‌کنند؛
  فعالیت کهنه مدل/ابزار بدون مالک به‌عنوان کار طولانی‌اجرای بی‌ضرر در نظر گرفته
  نمی‌شود. اجراهای تعبیه‌شده متوقف‌شده ابتدا فقط-مشاهده می‌مانند، سپس پس از
  `diagnostics.stuckSessionAbortMs` بدون پیشرفت، abort-drain می‌شوند تا نوبت‌های
  صف‌شده پشت lane بتوانند ادامه پیدا کنند. وقتی تنظیم نشده باشد، آستانه لغو به
  پنجره گسترده امن‌ترِ حداقل ۵ دقیقه و ۳ برابر `diagnostics.stuckSessionWarnMs`
  پیش‌فرض می‌شود.
- `session.stuck`: ثبت وضعیت نشست کهنه بدون کار فعال، یا نشست صف‌شده بیکار با
  فعالیت کهنه مدل/ابزار بدون مالک. این مورد پس از عبور گیت‌های بازیابی، lane
  نشست تحت تأثیر را بلافاصله آزاد می‌کند.

بازیابی رویدادهای ساختاریافته `session.recovery.requested` و
`session.recovery.completed` را منتشر می‌کند. وضعیت نشست تشخیصی فقط پس از یک
نتیجه بازیابی تغییردهنده (`aborted` یا `released`) و فقط اگر همان نسل processing
هنوز جاری باشد، idle علامت‌گذاری می‌شود.

فقط `session.stuck` شمارنده `openclaw.session.stuck`، هیستوگرام
`openclaw.session.stuck_age_ms`، و span `openclaw.session.stuck` را منتشر می‌کند.
تشخیص‌های تکراری `session.stuck` تا زمانی که نشست بدون تغییر بماند با backoff
منتشر می‌شوند، بنابراین داشبوردها باید به افزایش‌های پایدار هشدار دهند، نه به هر
تیک heartbeat. برای پیچ تنظیم پیکربندی و پیش‌فرض‌ها، به
[مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) مراجعه کنید.

هشدارهای زنده‌بودن همچنین منتشر می‌کنند:

- `openclaw.liveness.warning` (شمارنده، attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (هیستوگرام، attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (هیستوگرام، attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (هیستوگرام، attrs: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (هیستوگرام، attrs: `openclaw.liveness.reason`)

### چرخه عمر harness

- `openclaw.harness.duration_ms` (هیستوگرام، attrs: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` در خطاها)

### اجرای ابزار

- `openclaw.tool.execution.duration_ms` (هیستوگرام، attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, به‌علاوه `openclaw.errorCategory` در خطاها)
- `openclaw.tool.execution.blocked` (شمارنده، attrs: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (هیستوگرام، attrs: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### درون‌ساخت‌های تشخیص (حافظه و حلقه ابزار)

- `openclaw.payload.large` (شمارنده، attrs: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (هیستوگرام، attrs: همان `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (هیستوگرام، attrs: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، attrs: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، attrs: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، attrs: `openclaw.toolName`, `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری هنگام خطاها
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`، `openclaw.model_call.prompt.input_messages_chars`، `openclaw.model_call.prompt.system_prompt_chars`، `openclaw.model_call.prompt.tool_definitions_count`، `openclaw.model_call.prompt.tool_definitions_chars`، `openclaw.model_call.prompt.total_chars` (فقط اندازه‌های امن مؤلفه‌ها، بدون متن پرامپت)
  - `openclaw.model_call.usage.*` و `gen_ai.usage.*` وقتی نتیجه فراخوانی مدل، مصرف ارائه‌دهنده را برای همان فراخوانی منفرد داشته باشد
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسه درخواست ارائه‌دهنده بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
  - با `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، spanهای فراخوانی مدل به‌جای `openclaw.model.call` از تازه‌ترین نام span استنتاج GenAI یعنی `{gen_ai.operation.name} {gen_ai.request.model}` و نوع span `CLIENT` استفاده می‌کنند.
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بدون محتوای پرامپت، تاریخچه، پاسخ، یا کلید نشست)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بدون پیام‌های حلقه، پارامترها، یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

وقتی ضبط محتوا به‌صراحت فعال شود، spanهای مدل و ابزار می‌توانند
برای کلاس‌های محتوای مشخصی که فعال کرده‌اید، ویژگی‌های محدود و ویرایش‌شده‌ی `openclaw.content.*` را نیز
شامل شوند.

## فهرست رویدادهای تشخیصی

رویدادهای زیر پشتوانه سنجه‌ها و spanهای بالا هستند. Pluginها همچنین می‌توانند بدون صدور OTLP
مستقیماً در آن‌ها مشترک شوند.

**مصرف مدل**

- `model.usage` - توکن‌ها، هزینه، مدت‌زمان، زمینه، ارائه‌دهنده/مدل/کانال،
  شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و تله‌متری است؛
  `context.used` اسنپ‌شات فعلی پرامپت/زمینه است و وقتی ورودی کش‌شده یا فراخوانی‌های حلقه ابزار در میان باشند، می‌تواند از
  `usage.total` ارائه‌دهنده کمتر باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و نشست**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: وب‌هوک‌ها/صف/نشست)

**چرخه عمر هارنس**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  چرخه عمر هر اجرا برای هارنس عامل. شامل `harnessId`، `pluginId` اختیاری،
  ارائه‌دهنده/مدل/کانال، و شناسه اجرا است. تکمیل، `durationMs`، `outcome`، `resultClassification` اختیاری، `yieldDetected`
  و شمارش‌های `itemLifecycle` را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**Exec**

- `exec.process.completed` - نتیجه پایانی، مدت‌زمان، هدف، حالت، کد خروج،
  و نوع خرابی. متن فرمان و پوشه‌های کاری
  شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای تشخیصی را بدون اجرای `diagnostics-otel` برای Pluginها یا مقصدهای سفارشی
در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی اشکال‌زدایی هدفمند بدون افزایش `logging.level`، از پرچم‌های تشخیصی
استفاده کنید. پرچم‌ها به بزرگی و کوچکی حروف حساس نیستند و از wildcardها پشتیبانی می‌کنند (مثلاً `telegram.*` یا
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

خروجی پرچم به فایل گزارش استاندارد (`logging.file`) می‌رود و همچنان
با `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[پرچم‌های تشخیصی](/fa/diagnostics/flags).

## غیرفعال کردن

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` بیرون بگذارید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [گزارش‌گیری](/fa/logging) - گزارش‌های فایل، خروجی کنسول، دنبال‌کردن CLI، و زبانه گزارش‌های Control UI
- [جزئیات داخلی گزارش‌گیری Gateway](/fa/gateway/logging) - سبک‌های گزارش WS، پیشوندهای زیرسامانه، و ضبط کنسول
- [پرچم‌های تشخیصی](/fa/diagnostics/flags) - پرچم‌های هدفمند گزارش اشکال‌زدایی
- [صدور تشخیص‌ها](/fa/gateway/diagnostics) - ابزار بسته پشتیبانی اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) - مرجع کامل فیلد `diagnostics.*`
