---
read_when:
    - می‌خواهید معیارهای استفاده از مدل، جریان پیام، یا نشست OpenClaw را به یک گردآورنده OpenTelemetry ارسال کنید
    - در حال اتصال traceها، metricها یا logها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک backend دیگر OTLP هستید
    - برای ساخت داشبوردها یا هشدارها به نام‌های دقیق معیارها، نام‌های span، یا شکل‌های attribute نیاز دارید
summary: خروجی گرفتن از عیب‌یابی‌های OpenClaw به گردآورنده‌های OpenTelemetry یا JSONL در stdout از طریق Plugin diagnostics-otel
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:46:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw تشخیص‌ها را از طریق Plugin رسمی `diagnostics-otel` با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. لاگ‌ها همچنین می‌توانند برای خط لوله‌های لاگ کانتینر و سندباکس به‌صورت stdout JSONL نوشته شوند. هر گردآورنده یا بک‌اندی که OTLP/HTTP را بپذیرد، بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و روش خواندن آن‌ها، [لاگ‌برداری](/fa/logging) را ببینید.

## این اجزا چگونه کنار هم قرار می‌گیرند

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط Gateway و Pluginهای همراه برای اجرای مدل‌ها، جریان پیام، نشست‌ها، صف‌ها و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** در آن رویدادها مشترک می‌شود و آن‌ها را به‌صورت **معیارها**، **ردیابی‌ها** و **لاگ‌ها**ی OpenTelemetry از طریق OTLP/HTTP صادر می‌کند. همچنین می‌تواند رکوردهای لاگ تشخیصی را به stdout JSONL آینه کند.
- **فراخوانی‌های ارائه‌دهنده** زمانی که انتقال ارائه‌دهنده هدرهای سفارشی را می‌پذیرد، یک هدر W3C `traceparent` را از زمینه span فراخوانی مدل مورداعتماد OpenClaw دریافت می‌کنند. زمینه ردیابی منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط وقتی متصل می‌شوند که هم سطح تشخیص و هم Plugin فعال باشند، بنابراین هزینه درون‌فرایندی به‌طور پیش‌فرض نزدیک به صفر می‌ماند.

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

| سیگنال | آنچه در آن قرار می‌گیرد |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **معیارها** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، failover، استفاده از skill، جریان پیام، رویدادهای Talk، laneهای صف، وضعیت/بازیابی نشست، اجرای ابزار، payloadهای بیش‌ازحد بزرگ، exec و فشار حافظه. |
| **ردیابی‌ها** | spanها برای استفاده از مدل، فراخوانی‌های مدل، چرخه عمر harness، استفاده از skill، اجرای ابزار، exec، پردازش webhook/پیام، مونتاژ زمینه و حلقه‌های ابزار. |
| **لاگ‌ها** | رکوردهای ساختاریافته `logging.file` که هنگام فعال بودن `diagnostics.otel.logs` از طریق OTLP یا stdout JSONL صادر می‌شوند؛ بدنه‌های لاگ نگه داشته می‌شوند مگر اینکه ثبت محتوا صراحتا فعال شده باشد. |

`traces`، `metrics` و `logs` را مستقل از هم روشن یا خاموش کنید. وقتی `diagnostics.otel.enabled` درست باشد، ردیابی‌ها و معیارها به‌طور پیش‌فرض روشن هستند. لاگ‌ها به‌طور پیش‌فرض خاموش‌اند و فقط وقتی صادر می‌شوند که `diagnostics.otel.logs` صراحتا `true` باشد. صدور لاگ به‌طور پیش‌فرض OTLP است؛ برای JSONL روی stdout، `diagnostics.otel.logsExporter` را روی `stdout` تنظیم کنید، یا برای ارسال هر رکورد لاگ تشخیصی به OTLP و stdout، آن را روی `both` بگذارید.

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

| متغیر | هدف |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | بازنویسی `diagnostics.otel.endpoint`. اگر مقدار از قبل شامل `/v1/traces`، `/v1/metrics` یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود. |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های endpoint ویژه سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی ویژه سیگنال بر env ویژه سیگنال غالب است، و آن نیز بر endpoint مشترک غالب است. |
| `OTEL_SERVICE_NAME` | بازنویسی `diagnostics.otel.serviceName`. |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | بازنویسی پروتکل روی سیم؛ امروز فقط `http/protobuf` رعایت می‌شود. |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | برای انتشار جدیدترین شکل span آزمایشی استنتاج GenAI، شامل نام‌های span به‌شکل `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span با مقدار `CLIENT` و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی، روی `gen_ai_latest_experimental` تنظیم کنید. معیارهای GenAI همیشه، در هر صورت، از ویژگی‌های معنایی محدود و با کاردینالیتی پایین استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED` | وقتی یک preload یا فرایند میزبان دیگر قبلا SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند اما همچنان listenerهای تشخیصی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند. |

## حریم خصوصی و ثبت محتوا

محتوای خام مدل/ابزار به‌طور پیش‌فرض صادر **نمی‌شود**. spanها شناسه‌های محدود را حمل می‌کنند (کانال، ارائه‌دهنده، مدل، دسته خطا، شناسه‌های درخواست فقط-هش، منبع ابزار، مالک ابزار و نام/منبع skill) و هرگز شامل متن prompt، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، مسیرهای فایل skill یا کلیدهای نشست نیستند. رکوردهای لاگ OTLP به‌طور پیش‌فرض شدت، logger، محل کد، زمینه ردیابی مورداعتماد و ویژگی‌های پاک‌سازی‌شده را نگه می‌دارند، اما بدنه پیام خام لاگ فقط زمانی صادر می‌شود که `diagnostics.otel.captureContent` روی بولی `true` تنظیم شده باشد. زیرکلیدهای جزئی `captureContent.*` بدنه‌های لاگ را فعال نمی‌کنند. برچسب‌هایی که شبیه کلیدهای نشست عامل دامنه‌دار هستند با `unknown` جایگزین می‌شوند.
معیارهای Talk فقط فراداده محدود رویداد مانند mode، transport، ارائه‌دهنده و نوع رویداد را صادر می‌کنند. آن‌ها شامل رونوشت‌ها، payloadهای صوتی، شناسه‌های نشست، شناسه‌های نوبت، شناسه‌های تماس، شناسه‌های اتاق یا توکن‌های handoff نمی‌شوند.

درخواست‌های خروجی مدل ممکن است شامل هدر W3C `traceparent` باشند. آن هدر فقط از زمینه ردیابی تشخیصی متعلق به OpenClaw برای فراخوانی مدل فعال تولید می‌شود. هدرهای `traceparent` موجود که توسط فراخوان ارائه شده‌اند جایگزین می‌شوند، بنابراین Pluginها یا گزینه‌های سفارشی ارائه‌دهنده نمی‌توانند تبار ردیابی بین‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط زمانی روی `true` تنظیم کنید که گردآورنده و سیاست نگهداشت شما برای متن prompt، پاسخ، ابزار یا system-prompt تایید شده باشد. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` - محتوای prompt کاربر.
- `outputMessages` - محتوای پاسخ مدل.
- `toolInputs` - payloadهای آرگومان ابزار.
- `toolOutputs` - payloadهای نتیجه ابزار.
- `systemPrompt` - prompt سیستم/توسعه‌دهنده مونتاژشده.
- `toolDefinitions` - نام‌ها، توضیحات و schemaهای ابزار مدل.

وقتی هر زیرکلید فعال باشد، spanهای مدل و ابزار فقط برای همان class ویژگی‌های محدود و پاک‌سازی‌شده `openclaw.content.*` را دریافت می‌کنند. از بولی `captureContent: true` فقط برای ثبت‌های تشخیصی گسترده‌ای استفاده کنید که در آن‌ها بدنه‌های پیام لاگ OTLP نیز برای صدور تایید شده‌اند.

محتوای `toolInputs`/`toolOutputs` برای اجرای ابزارهای runtime عامل داخلی ثبت می‌شود (`openclaw.content.tool_input` روی spanهای completed/error، و `openclaw.content.tool_output` روی spanهای completed). فراخوانی‌های ابزار harness خارجی (Codex، Claude CLI) spanهای `tool.execution.*` را بدون payloadهای محتوا منتشر می‌کنند. محتوای ثبت‌شده روی کانالی مورداعتماد و فقط listener حرکت می‌کند و هرگز روی گذرگاه عمومی رویداد تشخیصی قرار نمی‌گیرد.

## نمونه‌برداری و flush

- **ردیابی‌ها:** `diagnostics.otel.sampleRate` (فقط root-span، `0.0` همه را حذف می‌کند، `1.0` همه را نگه می‌دارد).
- **معیارها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **لاگ‌ها:** لاگ‌های OTLP به `logging.level` (سطح لاگ فایل) احترام می‌گذارند. آن‌ها از مسیر پاک‌سازی رکورد لاگ تشخیصی استفاده می‌کنند، نه قالب‌بندی کنسول. نصب‌های پرترافیک باید نمونه‌برداری/فیلترکردن گردآورنده OTLP را به نمونه‌برداری محلی ترجیح دهند. وقتی پلتفرم شما از قبل stdout/stderr را به پردازشگر لاگ ارسال می‌کند و گردآورنده لاگ OTLP ندارید، `diagnostics.otel.logsExporter: "stdout"` را تنظیم کنید. رکوردهای stdout در هر خط یک شیء JSON با `ts`، `signal`، `service.name`، severity، body، ویژگی‌های پاک‌سازی‌شده و فیلدهای ردیابی مورداعتماد، در صورت وجود، هستند.
- **همبستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک زمینه ردیابی تشخیصی معتبر داشته باشد، شامل `traceId`، `spanId`، `parentSpanId` و `traceFlags` در سطح بالا هستند، که به پردازشگرهای لاگ اجازه می‌دهد خط‌های لاگ محلی را با spanهای صادرشده پیوند دهند.
- **همبستگی درخواست:** درخواست‌های HTTP Gateway و frameهای WebSocket یک دامنه ردیابی درخواست داخلی می‌سازند. لاگ‌ها و رویدادهای تشخیصی داخل آن دامنه به‌طور پیش‌فرض ردیابی درخواست را به ارث می‌برند، در حالی که spanهای اجرای عامل و فراخوانی مدل به‌عنوان فرزند ساخته می‌شوند تا هدرهای `traceparent` ارائه‌دهنده روی همان trace بمانند.

## معیارهای صادرشده

### استفاده از مدل

- `openclaw.tokens` (شمارنده، ویژگی‌ها: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، ویژگی‌ها: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، معیار قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، معیار قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، `error.type` اختیاری)
- `openclaw.model_call.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` در خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 محتوای نهایی درخواست مدل؛ بدون محتوای خام بار درخواست)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 محتوای قطعه‌های پاسخ جریانی؛ دلتاهای پرتکرار متن، تفکر و فراخوانی ابزار فقط بایت‌های افزایشی `delta` را می‌شمارند؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده پیش از نخستین رویداد پاسخ جریانی)
- `openclaw.model.failover` (شمارنده، ویژگی‌ها: `openclaw.provider`، `openclaw.model`، `openclaw.failover.to_provider`، `openclaw.failover.to_model`، `openclaw.failover.reason`، `openclaw.failover.suspended`، `openclaw.lane`)
- `openclaw.skill.used` (شمارنده، ویژگی‌ها: `openclaw.skill.name`، `openclaw.skill.source`، `openclaw.skill.activation`، `openclaw.agent` اختیاری، `openclaw.toolName` اختیاری)

### جریان پیام

- `openclaw.webhook.received` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.error` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.message.queued` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.received` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.dispatch.started` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.dispatch.completed` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.outcome`، `openclaw.reason`، `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.outcome`، `openclaw.reason`، `openclaw.source`)
- `openclaw.message.processed` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.delivery.started` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`)

### گفت‌وگو

- `openclaw.talk.event` (شمارنده، ویژگی‌ها: `openclaw.talk.event_type`، `openclaw.talk.mode`، `openclaw.talk.transport`، `openclaw.talk.brain`، `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (هیستوگرام، ویژگی‌ها: همانند `openclaw.talk.event`؛ وقتی یک رویداد گفت‌وگو مدت‌زمان را گزارش کند منتشر می‌شود)
- `openclaw.talk.audio.bytes` (هیستوگرام، ویژگی‌ها: همانند `openclaw.talk.event`؛ برای رویدادهای فریم صوتی گفت‌وگو که طول بایت را گزارش می‌کنند منتشر می‌شود)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.depth` (هیستوگرام، ویژگی‌ها: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (هیستوگرام، ویژگی‌ها: `openclaw.lane`)
- `openclaw.session.state` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (شمارنده، ویژگی‌ها: `openclaw.state`؛ برای حسابداری نشست کهنه و قابل بازیابی منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، ویژگی‌ها: `openclaw.state`؛ برای حسابداری نشست کهنه و قابل بازیابی منتشر می‌شود)
- `openclaw.session.turn.created` (شمارنده، ویژگی‌ها: `openclaw.agent`، `openclaw.channel`، `openclaw.trigger`)
- `openclaw.session.recovery.requested` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.completed` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.status`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (هیستوگرام، ویژگی‌ها: همانند شمارنده بازیابی متناظر)
- `openclaw.run.attempt` (شمارنده، ویژگی‌ها: `openclaw.attempt`)

### تله‌متری زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای عیب‌یابی زنده‌بودن نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت پاسخ، ابزار، وضعیت، بلوک یا زمان اجرای ACP را مشاهده کند، به سمت این آستانه پیر نمی‌شود. پیام‌های زنده‌نگهدارنده تایپ‌کردن به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین همچنان می‌توان یک مدل یا harness خاموش را تشخیص داد.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شده فعال، فراخوانی‌های مدل یا فراخوانی‌های ابزار هنوز در حال پیشرفت هستند. فراخوانی‌های مدل تحت مالکیت که پس از `diagnostics.stuckSessionWarnMs` همچنان خاموش بمانند نیز پیش از `diagnostics.stuckSessionAbortMs` به‌عنوان طولانی‌اجرا گزارش می‌شوند، تا ارائه‌دهندگان مدل کند یا غیرجریانی تا وقتی همچنان قابل مشاهده برای لغو هستند، شبیه نشست‌های Gateway متوقف‌شده به نظر نرسند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر گزارش نکرده است. فراخوانی‌های مدل تحت مالکیت در زمان `diagnostics.stuckSessionAbortMs` یا پس از آن از `session.long_running` به `session.stalled` تغییر می‌کنند؛ فعالیت کهنه مدل/ابزار بدون مالک به‌عنوان کار طولانی‌اجرای بی‌ضرر تلقی نمی‌شود. اجراهای تعبیه‌شده متوقف‌شده ابتدا فقط در حالت مشاهده باقی می‌مانند، سپس پس از `diagnostics.stuckSessionAbortMs` بدون پیشرفت لغو و تخلیه می‌شوند تا نوبت‌های صف‌شده پشت lane بتوانند از سر گرفته شوند. وقتی تنظیم نشده باشد، آستانه لغو به‌طور پیش‌فرض روی پنجره گسترده‌تر و ایمن‌ترِ حداقل ۵ دقیقه و ۳ برابر `diagnostics.stuckSessionWarnMs` قرار می‌گیرد.
- `session.stuck`: حسابداری نشست کهنه بدون کار فعال، یا یک نشست صف‌شده بی‌کار با فعالیت کهنه مدل/ابزار بدون مالک. این مورد پس از عبور گیت‌های بازیابی، lane نشست تحت‌تأثیر را فوراً آزاد می‌کند.

بازیابی رویدادهای ساختاریافته `session.recovery.requested` و `session.recovery.completed` را منتشر می‌کند. وضعیت نشست عیب‌یابی فقط پس از یک نتیجه بازیابی تغییردهنده (`aborted` یا `released`) و فقط اگر همان نسل پردازش هنوز جاری باشد، بی‌کار علامت‌گذاری می‌شود.

فقط `session.stuck` شمارنده `openclaw.session.stuck`، هیستوگرام `openclaw.session.stuck_age_ms` و span‏ `openclaw.session.stuck` را منتشر می‌کند. عیب‌یابی‌های تکراری `session.stuck` تا وقتی نشست بدون تغییر باقی بماند با عقب‌نشینی انجام می‌شوند، بنابراین داشبوردها باید بر افزایش‌های پایدار هشدار دهند، نه هر تیک Heartbeat. برای کلید تنظیمات و پیش‌فرض‌ها، به [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) مراجعه کنید.

هشدارهای زنده‌بودن همچنین منتشر می‌کنند:

- `openclaw.liveness.warning` (شمارنده، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)

### چرخه حیات harness

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` در خطاها)

### اجرای ابزار

- `openclaw.tool.execution.duration_ms` (هیستوگرام، ویژگی‌ها: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، به‌علاوه `openclaw.errorCategory` در خطاها)
- `openclaw.tool.execution.blocked` (شمارنده، ویژگی‌ها: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### جزئیات داخلی عیب‌یابی (حافظه و حلقه ابزار)

- `openclaw.payload.large` (شمارنده، ویژگی‌ها: `openclaw.payload.surface`، `openclaw.payload.action`، `openclaw.channel`، `openclaw.plugin`، `openclaw.reason`)
- `openclaw.payload.large_bytes` (هیستوگرام، ویژگی‌ها: همانند `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (هیستوگرام، ویژگی‌ها: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (هیستوگرام)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (شمارنده، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.toolName`، `openclaw.outcome`)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی آخرین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌طور پیش‌فرض `gen_ai.system`، یا وقتی آخرین قراردادهای معنایی GenAI فعال شده باشند `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و در خطاها `openclaw.failureKind` اختیاری
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسه درخواست provider بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
  - با `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، spanهای فراخوانی مدل از آخرین نام span استنتاج GenAI یعنی `{gen_ai.operation.name} {gen_ai.request.model}` و نوع span `CLIENT` به‌جای `openclaw.model.call` استفاده می‌کنند.
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بدون محتوای prompt، تاریخچه، پاسخ، یا کلید session)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بدون پیام‌های حلقه، پارامترها، یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

وقتی ثبت محتوا به‌صراحت فعال شود، spanهای مدل و ابزار همچنین می‌توانند
ویژگی‌های محدود و ویرایش‌شده `openclaw.content.*` را برای کلاس‌های محتوای
مشخصی که فعال کرده‌اید شامل شوند.

## فهرست رویدادهای تشخیصی

رویدادهای زیر پشتوانه metricها و spanهای بالا هستند. Pluginها همچنین می‌توانند
بدون صدور OTLP مستقیماً مشترک آن‌ها شوند.

**استفاده از مدل**

- `model.usage` - توکن‌ها، هزینه، مدت‌زمان، context، provider/model/channel،
  شناسه‌های session. `usage` حسابداری provider/turn برای هزینه و telemetry است؛
  `context.used` snapshot فعلی prompt/context است و وقتی ورودی کش‌شده یا فراخوانی‌های tool-loop درگیر باشند، می‌تواند از
  `usage.total` provider کمتر باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و session**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: webhooks/queue/session)

**چرخه عمر harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  چرخه عمر به‌ازای هر اجرا برای harness عامل. شامل `harnessId`،
  `pluginId` اختیاری، provider/model/channel، و شناسه اجرا است. تکمیل،
  `durationMs`، `outcome`، `resultClassification` اختیاری، `yieldDetected`،
  و شمارش‌های `itemLifecycle` را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**اجرا**

- `exec.process.completed` - نتیجه نهایی، مدت‌زمان، هدف، حالت، کد خروج،
  و نوع شکست. متن فرمان و دایرکتوری‌های کاری
  گنجانده نمی‌شوند.

## بدون exporter

می‌توانید رویدادهای diagnostics را بدون اجرای `diagnostics-otel` برای Pluginها یا sinkهای سفارشی
در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی debug هدفمند بدون افزایش `logging.level`، از پرچم‌های diagnostics
استفاده کنید. پرچم‌ها به بزرگی و کوچکی حروف حساس نیستند و از wildcardها پشتیبانی می‌کنند (مثلاً `telegram.*` یا
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌صورت بازنویسی env یک‌باره:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی پرچم به فایل لاگ استاندارد (`logging.file`) می‌رود و همچنان
توسط `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[پرچم‌های diagnostics](/fa/diagnostics/flags).

## غیرفعال‌سازی

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` حذف کنید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [لاگ‌گیری](/fa/logging) - لاگ‌های فایل، خروجی کنسول، tail کردن از CLI، و زبانه لاگ‌های Control UI
- [جزئیات داخلی لاگ‌گیری Gateway](/fa/gateway/logging) - سبک‌های لاگ WS، پیشوندهای زیرسیستم، و ثبت کنسول
- [پرچم‌های diagnostics](/fa/diagnostics/flags) - پرچم‌های هدفمند debug-log
- [صدور diagnostics](/fa/gateway/diagnostics) - ابزار support-bundle اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) - مرجع کامل فیلد `diagnostics.*`
