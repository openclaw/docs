---
read_when:
    - می‌خواهید معیارهای استفاده از مدل، جریان پیام یا نشست OpenClaw را به یک گردآورنده OpenTelemetry ارسال کنید
    - شما در حال اتصال ردگیری‌ها، سنجه‌ها یا گزارش‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا یک بک‌اند OTLP دیگر هستید
    - برای ساخت داشبوردها یا هشدارها، به نام‌های دقیق سنجه‌ها، نام‌های spanها یا ساختار ویژگی‌ها نیاز دارید
summary: خروجی‌گرفتن از داده‌های تشخیصی OpenClaw به گردآورنده‌های OpenTelemetry یا JSONL در stdout از طریق Plugin diagnostics-otel
title: خروجی‌گیری OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T10:04:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw داده‌های تشخیصی را از طریق Plugin رسمی `diagnostics-otel` با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. همچنین می‌توان لاگ‌ها را به‌صورت JSONL در stdout برای خط لوله‌های لاگ کانتینر و سندباکس نوشت. هر گردآورنده یا بک‌اندی که OTLP/HTTP را بپذیرد، بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی، به
[لاگ‌گیری](/fa/logging) مراجعه کنید.

- **رویدادهای تشخیصی** رکوردهای ساخت‌یافته و درون‌پردازه‌ای هستند که Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها و exec منتشر می‌کنند.
- **`diagnostics-otel`** در آن رویدادها مشترک می‌شود و آن‌ها را به‌صورت **سنجه‌ها**، **ردیابی‌ها** و **لاگ‌های** OpenTelemetry از طریق OTLP/HTTP صادر می‌کند و می‌تواند رکوردهای لاگ را به‌صورت JSONL در stdout نیز بازتاب دهد.
- **فراخوانی‌های ارائه‌دهنده** هنگامی که انتقال ارائه‌دهنده سرآیندهای سفارشی را می‌پذیرد، یک سرآیند W3C به نام `traceparent` را از زمینه span مورد اعتماد فراخوانی مدل OpenClaw دریافت می‌کنند. زمینه ردیابی منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط زمانی متصل می‌شوند که هم سطح تشخیص و هم Plugin فعال باشند؛ بنابراین هزینه درون‌پردازه‌ای به‌طور پیش‌فرض نزدیک به صفر باقی می‌ماند.

## شروع سریع

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

یا Plugin را از طریق CLI فعال کنید: `openclaw plugins enable diagnostics-otel`.

<Note>
`protocol` فقط از `http/protobuf` پشتیبانی می‌کند. از آنجا که `traces` و `metrics` به‌طور پیش‌فرض فعال هستند، هر مقدار دیگری (از جمله `grpc`) کل اشتراک diagnostics-otel را با هشدار `unsupported protocol` متوقف می‌کند؛ این کار صدور لاگ به stdout را نیز متوقف می‌کند. اگر فقط `logsExporter: "stdout"` را همراه با یک مقدار پروتکل غیر OTLP می‌خواهید، `traces: false` و `metrics: false` را صریحاً تنظیم کنید.
</Note>

## سیگنال‌های صادرشده

| سیگنال      | محتوای آن                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **سنجه‌ها** | شمارنده‌ها/هیستوگرام‌هایی برای مصرف توکن، هزینه، مدت اجرا، جایگزینی هنگام خرابی، استفاده از skill، جریان پیام، رویدادهای گفت‌وگو، مسیرهای صف، وضعیت/بازیابی نشست، اجرای ابزار، exec، حافظه، زنده‌بودن و سلامت صادرکننده. |
| **ردیابی‌ها**  | spanهایی برای استفاده از مدل، فراخوانی‌های مدل، چرخه عمر هارنس، استفاده از skill، اجرای ابزار، exec، پردازش webhook/پیام، مونتاژ زمینه و حلقه‌های ابزار.                                                      |
| **لاگ‌ها**    | رکوردهای ساخت‌یافته `logging.file` که هنگام فعال بودن `diagnostics.otel.logs` از طریق OTLP یا JSONL در stdout صادر می‌شوند؛ بدنه لاگ‌ها ارائه نمی‌شود، مگر اینکه ضبط محتوا صریحاً فعال شده باشد.                          |

`traces`، `metrics` و `logs` را مستقل از یکدیگر تغییر دهید. هنگامی که `diagnostics.otel.enabled` برابر با `true` است، ردیابی‌ها و سنجه‌ها به‌طور پیش‌فرض روشن‌اند؛ لاگ‌ها به‌طور پیش‌فرض خاموش‌اند و فقط هنگامی صادر می‌شوند که `diagnostics.otel.logs` صریحاً `true` باشد. صدور لاگ به‌طور پیش‌فرض از OTLP استفاده می‌کند؛ برای JSONL در stdout، مقدار `diagnostics.otel.logsExporter` را روی `stdout` و برای هر دو روی `both` تنظیم کنید.

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
      protocol: "http/protobuf", // grpc صدور OTLP را غیرفعال می‌کند
      serviceName: "openclaw-gateway", // در صورت تنظیم‌نبودن، ابتدا از OTEL_SERVICE_NAME و سپس "openclaw" استفاده می‌شود
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // نمونه‌بردار span ریشه، 0.0..1.0
      flushIntervalMs: 60000, // بازه صدور سنجه (حداقل 1000ms)
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

| متغیر                                                                                                          | هدف                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | مقدار جایگزین برای `diagnostics.otel.endpoint` هنگامی که کلید پیکربندی تنظیم نشده است.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | مقادیر جایگزین نقطه پایانی ویژه هر سیگنال که هنگام تنظیم‌نبودن کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` استفاده می‌شوند. پیکربندی ویژه سیگنال بر متغیر محیطی ویژه سیگنال اولویت دارد و آن نیز بر نقطه پایانی مشترک اولویت دارد.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | مقدار جایگزین برای `diagnostics.otel.serviceName` هنگامی که کلید پیکربندی تنظیم نشده است. نام پیش‌فرض سرویس `openclaw` است.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | مقدار جایگزین برای پروتکل انتقال هنگامی که `diagnostics.otel.protocol` تنظیم نشده است. فقط `http/protobuf` صدور را فعال می‌کند.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | برای انتشار جدیدترین ساختار span استنتاج GenAI، آن را روی `gen_ai_latest_experimental` تنظیم کنید: نام spanهای `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span برابر با `CLIENT` و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی. سنجه‌های GenAI در هر صورت همیشه از ویژگی‌های محدود و کم‌کاردینالیتی استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | هنگامی که پیش‌بارگذاری یا پردازش میزبان دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، آن را روی `1` تنظیم کنید. در این حالت Plugin چرخه عمر NodeSDK خود را نادیده می‌گیرد، اما همچنان شنونده‌های تشخیصی را متصل می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                                                                                    |

## حریم خصوصی و ضبط محتوا

محتوای خام مدل/ابزار به‌طور پیش‌فرض صادر **نمی‌شود**. spanها شناسه‌های محدودشده (کانال، ارائه‌دهنده، مدل، دسته خطا، شناسه‌های درخواست فقط به‌صورت هش، منبع ابزار، مالک ابزار، نام/منبع skill) را حمل می‌کنند و هرگز شامل متن پرامپت، متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، مسیر فایل‌های skill یا کلیدهای نشست نیستند. مقادیری که شبیه کلیدهای نشست عامل با دامنه مشخص هستند (برای مثال با `agent:` شروع می‌شوند)، در ویژگی‌های کم‌کاردینالیتی با `unknown` جایگزین می‌شوند. رکوردهای لاگ OTLP به‌طور پیش‌فرض شدت، لاگر، مکان کد، زمینه ردیابی مورد اعتماد و ویژگی‌های پاک‌سازی‌شده را نگه می‌دارند؛ بدنه پیام خام لاگ فقط زمانی صادر می‌شود که `diagnostics.otel.captureContent` مقدار بولی `true` داشته باشد. زیرکلیدهای جزئی `captureContent.*` هرگز بدنه لاگ‌ها را فعال نمی‌کنند. سنجه‌های گفت‌وگو فقط فراداده محدودشده رویداد (حالت، انتقال، ارائه‌دهنده، نوع رویداد) را صادر می‌کنند؛ نه رونوشت‌ها، محموله‌های صوتی، شناسه‌های نشست، شناسه‌های نوبت، شناسه‌های تماس، شناسه‌های اتاق یا توکن‌های واگذاری.

درخواست‌های خروجی مدل ممکن است شامل یک سرآیند W3C به نام `traceparent` باشند که فقط از زمینه ردیابی تشخیصی متعلق به OpenClaw برای فراخوانی فعال مدل تولید می‌شود. سرآیندهای `traceparent` موجود که فراخواننده ارائه کرده است جایگزین می‌شوند؛ بنابراین Pluginها یا گزینه‌های سفارشی ارائه‌دهنده نمی‌توانند تبار ردیابی میان‌سرویسی را جعل کنند.

فقط هنگامی `diagnostics.otel.captureContent.*` را روی `true` تنظیم کنید که گردآورنده و سیاست نگهداری شما برای متن پرامپت، پاسخ، ابزار یا پرامپت سیستم تأیید شده باشند. هر زیرکلید مستقل است:

- `inputMessages` - محتوای پرامپت کاربر.
- `outputMessages` - محتوای پاسخ مدل.
- `toolInputs` - محموله آرگومان‌های ابزار.
- `toolOutputs` - محموله نتایج ابزار.
- `systemPrompt` - پرامپت مونتاژشده سیستم/توسعه‌دهنده.
- `toolDefinitions` - نام‌ها، توضیحات و شِماهای ابزار مدل.

هنگامی که هر زیرکلیدی فعال باشد، spanهای مدل و ابزار فقط ویژگی‌های محدودشده و ویرایش‌شده `openclaw.content.*` را برای همان دسته دریافت می‌کنند.

<Note>
مقدار بولی `captureContent: true`، گزینه‌های `inputMessages`، `outputMessages`، `toolInputs`، `toolOutputs`، `toolDefinitions` و بدنه لاگ‌های OTLP را با هم فعال می‌کند، اما `systemPrompt` را فعال **نمی‌کند**؛ اگر پرامپت مونتاژشده سیستم را نیز نیاز دارید، `captureContent.systemPrompt: true` را صریحاً تنظیم کنید.
</Note>

محتوای `toolInputs`/`toolOutputs` برای اجرای ابزار در زمان اجرای عامل داخلی ضبط می‌شود (`openclaw.content.tool_input` و `gen_ai.tool.call.arguments` در spanهای تکمیل‌شده/خطادار؛ `openclaw.content.tool_output` و `gen_ai.tool.call.result` در spanهای تکمیل‌شده). نام‌های `openclaw.content.*` همچنان نام‌های پایدار ویژگی OpenClaw باقی می‌مانند؛ نسخه‌های `gen_ai.tool.call.*` برای نمایشگرهای بومی semconv آن‌ها را بازتاب می‌دهند. فراخوانی‌های ابزار هارنس خارجی (Codex، Claude CLI)، spanهای `tool.execution.*` را بدون محموله محتوا منتشر می‌کنند. محتوای ضبط‌شده در یک کانال مورد اعتماد و مختص شنونده جابه‌جا می‌شود و هرگز روی گذرگاه عمومی رویدادهای تشخیصی قرار نمی‌گیرد.

## نمونه‌برداری و تخلیه

- **ردیابی‌ها:** `diagnostics.otel.sampleRate` یک `TraceIdRatioBasedSampler`
  را فقط روی span ریشه تنظیم می‌کند (`0.0` همه را حذف می‌کند، `1.0` همه را نگه می‌دارد). در صورت تنظیم‌نبودن، از
  پیش‌فرض SDK مربوط به OpenTelemetry استفاده می‌شود (همیشه فعال).
- **متریک‌ها:** `diagnostics.otel.flushIntervalMs` (با حداقل مقدار
  `1000` محدود می‌شود)؛ در صورت تنظیم‌نبودن، از پیش‌فرض صدور دوره‌ای SDK استفاده می‌شود.
- **لاگ‌ها:** لاگ‌های OTLP از `logging.level` (سطح لاگ فایل) پیروی می‌کنند و به‌جای
  قالب‌بندی کنسول، از مسیر حذف اطلاعات حساس رکوردهای لاگ تشخیصی استفاده می‌کنند. نصب‌های
  پرترافیک باید نمونه‌برداری/فیلترکردن گردآورنده OTLP را به نمونه‌برداری
  محلی ترجیح دهند. وقتی پلتفرم شما از قبل stdout/stderr را به یک پردازشگر لاگ
  ارسال می‌کند و گردآورنده لاگ OTLP ندارید، `diagnostics.otel.logsExporter: "stdout"` را تنظیم کنید.
  رکوردهای stdout در هر خط یک شیء JSON هستند که شامل `ts`، `signal`،
  `service.name`، شدت، بدنه، ویژگی‌های حذف‌شده از اطلاعات حساس و در صورت وجود،
  فیلدهای ردیابی مورداعتماد است.
- **هم‌بستگی لاگ فایل:** لاگ‌های فایل JSONL هنگامی که فراخوانی لاگ دارای
  زمینه ردیابی تشخیصی معتبر باشد، `traceId`، `spanId`، `parentSpanId` و
  `traceFlags` را در سطح بالا شامل می‌شوند؛ بنابراین پردازشگرهای لاگ می‌توانند خطوط
  لاگ محلی را به spanهای صادرشده متصل کنند.
- **هم‌بستگی درخواست:** درخواست‌های HTTP و فریم‌های WebSocket در Gateway
  یک دامنه ردیابی درخواست داخلی ایجاد می‌کنند. لاگ‌ها و رویدادهای تشخیصی درون آن
  دامنه به‌طور پیش‌فرض ردیابی درخواست را به ارث می‌برند، درحالی‌که spanهای اجرای عامل
  و فراخوانی مدل به‌عنوان فرزند ایجاد می‌شوند تا سرآیندهای `traceparent` ارائه‌دهنده
  روی همان ردیابی باقی بمانند.
- **هم‌بستگی فراخوانی مدل:** spanهای `openclaw.model.call` به‌طور پیش‌فرض
  اندازه‌های امن مؤلفه‌های پرامپت و، هنگامی که نتیجه ارائه‌دهنده اطلاعات مصرف را ارائه کند،
  ویژگی‌های توکن هر فراخوانی را شامل می‌شوند. `openclaw.model.usage` همچنان span
  حسابداری سطح اجرا برای هزینه تجمیعی، زمینه و داشبوردهای کانال است و هنگامی که
  محیط اجرای صادرکننده دارای زمینه ردیابی مورداعتماد باشد، روی همان ردیابی تشخیصی
  باقی می‌ماند.

## متریک‌های صادرشده

### مصرف مدل

- `openclaw.tokens` (شمارنده، ویژگی‌ها: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، ویژگی‌ها: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، متریک قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، متریک قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، `error.type` اختیاری)
- `openclaw.model_call.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` برای خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 بار درخواست نهایی مدل؛ بدون محتوای خام بار)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 بار قطعه‌های پاسخ جریانی؛ متن پرتکرار، تفکر و تغییرات فراخوانی ابزار فقط بایت‌های افزایشی `delta` را می‌شمارند؛ بدون محتوای خام پاسخ)
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
- `openclaw.talk.event.duration_ms` (هیستوگرام، ویژگی‌ها: همانند `openclaw.talk.event`؛ هنگامی صادر می‌شود که یک رویداد گفت‌وگو مدت‌زمان را گزارش کند)
- `openclaw.talk.audio.bytes` (هیستوگرام، ویژگی‌ها: همانند `openclaw.talk.event`؛ برای رویدادهای فریم صوتی گفت‌وگو که طول بایتی را گزارش می‌کنند صادر می‌شود)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.depth` (هیستوگرام، ویژگی‌ها: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (هیستوگرام، ویژگی‌ها: `openclaw.lane`)
- `openclaw.session.state` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (شمارنده، ویژگی‌ها: `openclaw.state`؛ برای ثبت وضعیت منقضی‌شده اما قابل‌بازیابی نشست صادر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، ویژگی‌ها: `openclaw.state`؛ برای ثبت وضعیت منقضی‌شده اما قابل‌بازیابی نشست صادر می‌شود)
- `openclaw.session.turn.created` (شمارنده، ویژگی‌ها: `openclaw.agent`، `openclaw.channel`، `openclaw.trigger`)
- `openclaw.session.recovery.requested` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.completed` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.status`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (هیستوگرام، ویژگی‌ها: همانند شمارنده بازیابی متناظر)
- `openclaw.run.attempt` (شمارنده، ویژگی‌ها: `openclaw.attempt`)

### تله‌متری زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سنِ بدون پیشرفت برای تشخیص
زنده‌بودن نشست است. تا زمانی که OpenClaw پیشرفت پاسخ، ابزار، وضعیت، بلوک یا
محیط اجرای ACP را مشاهده کند، سن یک نشست `processing` به‌سمت این
آستانه افزایش نمی‌یابد. سیگنال‌های زنده‌نگه‌داشتن تایپ به‌عنوان پیشرفت محسوب نمی‌شوند،
بنابراین همچنان می‌توان یک مدل یا چارچوب اجرایی ساکت را تشخیص داد.

OpenClaw نشست‌ها را بر اساس کاری که همچنان می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار تعبیه‌شده فعال، فراخوانی‌های مدل یا فراخوانی‌های ابزار
  همچنان در حال پیشرفت‌اند. فراخوانی‌های مدل تحت مالکیت که پس از
  `diagnostics.stuckSessionWarnMs` ساکت می‌مانند نیز پیش از
  `diagnostics.stuckSessionAbortMs` به‌صورت طولانی‌مدت گزارش می‌شوند تا
  ارائه‌دهندگان مدل کند یا غیرجریانی، تا زمانی که امکان مشاهده لغو وجود دارد،
  شبیه نشست‌های متوقف‌شده Gateway به نظر نرسند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت
  اخیر را گزارش نکرده است. فراخوانی‌های مدل تحت مالکیت در
  `diagnostics.stuckSessionAbortMs` یا پس از آن از `session.long_running` به
  `session.stalled` تغییر می‌کنند؛ فعالیت منقضی‌شده مدل/ابزار بدون مالک
  به‌عنوان کار طولانی‌مدت بی‌ضرر تلقی نمی‌شود. اجراهای تعبیه‌شده متوقف‌شده در ابتدا
  فقط تحت مشاهده باقی می‌مانند، سپس پس از `diagnostics.stuckSessionAbortMs`
  بدون پیشرفت، فرایند لغو و تخلیه را انجام می‌دهند تا نوبت‌های صف‌شده پشت
  مسیر بتوانند از سر گرفته شوند. در صورت تنظیم‌نبودن، آستانه لغو به‌طور پیش‌فرض
  پنجره امن‌تر و طولانی‌تری برابر با حداقل ۵ دقیقه و ۳ برابر
  `diagnostics.stuckSessionWarnMs` دارد.
- `session.stuck`: ثبت وضعیت منقضی‌شده نشست بدون کار فعال، یا یک نشست
  صف‌شده بیکار با فعالیت منقضی‌شده مدل/ابزار بدون مالک. پس از عبور از
  دروازه‌های بازیابی، مسیر نشست متأثر بلافاصله آزاد می‌شود.

بازیابی رویدادهای ساختاریافته `session.recovery.requested` و
`session.recovery.completed` را صادر می‌کند. وضعیت تشخیصی نشست فقط پس از
یک نتیجه بازیابی تغییردهنده (`aborted` یا `released`) و تنها در صورتی
بیکار علامت‌گذاری می‌شود که همان نسل پردازش همچنان جاری باشد.

فقط `session.stuck` شمارنده `openclaw.session.stuck`، هیستوگرام
`openclaw.session.stuck_age_ms` و span‏ `openclaw.session.stuck` را صادر می‌کند.
تا زمانی که نشست بدون تغییر باقی بماند، تشخیص‌های تکراری `session.stuck`
با فاصله افزایشی انجام می‌شوند؛ بنابراین داشبوردها باید به‌جای هر تیک Heartbeat،
روی افزایش‌های پایدار هشدار دهند. برای گزینه پیکربندی و مقادیر پیش‌فرض، به
[مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) مراجعه کنید.

هشدارهای زنده‌بودن همچنین موارد زیر را صادر می‌کنند:

- `openclaw.liveness.warning` (شمارنده، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)

### چرخه عمر چارچوب اجرایی

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، و هنگام خطا `openclaw.harness.phase`)

### اجرای ابزار و تشخیص حلقه

- `openclaw.tool.execution.duration_ms` (هیستوگرام، ویژگی‌ها: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، به‌علاوه `openclaw.errorCategory` هنگام خطا)
- `openclaw.tool.execution.blocked` (شمارنده، ویژگی‌ها: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، `openclaw.deniedReason`)
- `openclaw.tool.loop` (شمارنده، ویژگی‌ها: `openclaw.toolName`، `openclaw.loop.level`، `openclaw.loop.action`، `openclaw.loop.detector`، `openclaw.loop.count`، `openclaw.loop.paired_tool` اختیاری؛ هنگامی صادر می‌شود که یک حلقه تکراری فراخوانی ابزار تشخیص داده شود)

### اجرا

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### جزئیات داخلی تشخیص (حافظه، بارها، سلامت صادرکننده)

- `openclaw.payload.large` (شمارنده، ویژگی‌ها: `openclaw.payload.surface`، `openclaw.payload.action`، `openclaw.channel`، `openclaw.plugin`، `openclaw.reason`)
- `openclaw.payload.large_bytes` (هیستوگرام، ویژگی‌ها: همانند `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (هیستوگرام‌ها، بدون ویژگی؛ نمونه‌های حافظه فرایند)
- `openclaw.memory.pressure` (شمارنده، ویژگی‌ها: `openclaw.memory.level`، `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (شمارنده، ویژگی‌ها: `openclaw.diagnostic.async_queue.drop_class`؛ حذف‌های ناشی از پس‌فشار صف تشخیصی داخلی)
- `openclaw.telemetry.exporter.events` (شمارنده، ویژگی‌ها: `openclaw.exporter`، `openclaw.signal`، `openclaw.status`، `openclaw.reason` اختیاری، `openclaw.errorCategory` اختیاری؛ خودتله‌متری چرخه عمر/خرابی صادرکننده)

## spanهای صادرشده

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - به‌طور پیش‌فرض `gen_ai.system`، یا هنگامی که جدیدترین قراردادهای معنایی GenAI فعال شده‌اند، `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌طور پیش‌فرض `gen_ai.system`، یا هنگامی که جدیدترین قراردادهای معنایی GenAI فعال شده‌اند، `gen_ai.provider.name`
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - در صورت بروز خطا، `openclaw.errorCategory`، `error.type` و `openclaw.failureKind` اختیاری
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`، `openclaw.model_call.prompt.input_messages_chars`، `openclaw.model_call.prompt.system_prompt_chars`، `openclaw.model_call.prompt.tool_definitions_count`، `openclaw.model_call.prompt.tool_definitions_chars`، `openclaw.model_call.prompt.total_chars` (فقط اندازه‌های امن مؤلفه‌ها، بدون متن پرامپت)
  - هنگامی که نتیجه فراخوانی مدل شامل مصرف ارائه‌دهنده برای همان فراخوانی منفرد باشد، `openclaw.model_call.usage.*` و `gen_ai.usage.*`
  - هنگامی که نتیجه ارائه‌دهنده بالادستی یک شناسه درخواست ارائه کند، رویداد Span با نام `openclaw.provider.request` و ویژگی `openclaw.upstreamRequestIdHash` (محدودشده و مبتنی بر هش)؛ شناسه‌های خام هرگز صادر نمی‌شوند
  - با `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، Spanهای فراخوانی مدل به‌جای `openclaw.model.call` از جدیدترین نام Span استنتاج GenAI، یعنی `{gen_ai.operation.name} {gen_ai.request.model}`، و نوع Span برابر با `CLIENT` استفاده می‌کنند.
- `openclaw.harness.run`
  - `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.provider`، `openclaw.model`، `openclaw.channel`
  - هنگام تکمیل: `openclaw.harness.result_classification`، `openclaw.harness.yield_detected`، `openclaw.harness.items.started`، `openclaw.harness.items.completed`، `openclaw.harness.items.active`
  - هنگام خطا: `openclaw.harness.phase`، `openclaw.errorCategory`، و `openclaw.harness.cleanup_failed` اختیاری
- `openclaw.tool.execution`
  - `gen_ai.tool.name`، `gen_ai.operation.name` (`execute_tool`)، `openclaw.toolName`، `openclaw.tool.source`، `gen_ai.tool.call.id` اختیاری، `openclaw.tool.owner`، `openclaw.tool.params.*`
  - در صورت بروز خطا، `openclaw.errorCategory`/`openclaw.errorCode` اختیاری؛ و هنگامی که سیاست یا محیط ایزوله دسترسی را رد کند، `openclaw.deniedReason` و `openclaw.outcome=blocked`
- `openclaw.exec`
  - `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`، `openclaw.exec.command_length`، `openclaw.exec.exit_code`، `openclaw.exec.exit_signal`، `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بدون محتوای پرامپت، تاریخچه، پاسخ یا کلید نشست)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.loop.level`، `openclaw.loop.action`، `openclaw.loop.detector`، `openclaw.loop.count`، و `openclaw.loop.paired_tool` اختیاری (بدون پیام‌های حلقه، پارامترها یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.reason`، `openclaw.memory.rss_bytes`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.heap_total_bytes`، `openclaw.memory.external_bytes`، `openclaw.memory.array_buffers_bytes`، و `openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` اختیاری

هنگامی که ثبت محتوا به‌صراحت فعال باشد، Spanهای مدل و ابزار می‌توانند
برای کلاس‌های محتوایی مشخصی که فعال کرده‌اید، شامل ویژگی‌های محدودشده و
ویرایش‌شده `openclaw.content.*` نیز باشند.

## فهرست رویدادهای تشخیصی

رویدادهای زیر پشتوانه معیارها و Spanهای بالا هستند. Pluginها همچنین می‌توانند
بدون صدور OTLP مستقیماً مشترک آن‌ها شوند.

**مصرف مدل**

- `model.usage` - توکن‌ها، هزینه، مدت‌زمان، زمینه، ارائه‌دهنده/مدل/کانال و
  شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و تله‌متری است؛
  `context.used` تصویر لحظه‌ای پرامپت/زمینه فعلی است و هنگامی که ورودی
  ذخیره‌شده در حافظه نهان یا فراخوانی‌های حلقه ابزار دخیل باشند، می‌تواند از
  `usage.total` ارائه‌دهنده کمتر باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و نشست**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: Webhookها/صف/نشست)

**چرخه حیات مهار**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  چرخه حیات هر اجرا برای مهار عامل. شامل `harnessId`، `pluginId` اختیاری،
  ارائه‌دهنده/مدل/کانال و شناسه اجرا است. تکمیل، `durationMs`، `outcome`،
  `resultClassification` اختیاری، `yieldDetected` و شمارش‌های `itemLifecycle`
  را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory` و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**اجرا**

- `exec.process.completed` - نتیجه نهایی ترمینال، مدت‌زمان، مقصد، حالت، کد
  خروج و نوع خرابی. متن فرمان و پوشه‌های کاری درج نمی‌شوند.
- `exec.approval.followup_suppressed` - پیگیری تأیید منقضی‌شده که پس از
  اتصال مجدد نشست کنار گذاشته شده است. شامل `approvalId`، `reason`
  (`session_rebound`)، `phase` (`direct_delivery` یا `gateway_preflight`)
  و مُهر زمانی توزیع‌کننده است. کلیدهای نشست، مسیرها و متن فرمان درج
  نمی‌شوند.

## بدون صادرکننده

بدون اجرای `diagnostics-otel`، رویدادهای تشخیصی را برای Pluginها یا مقصدهای
سفارشی در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی اشکال‌زدایی هدفمند بدون افزایش `logging.level`، از پرچم‌های
تشخیصی استفاده کنید. پرچم‌ها به بزرگی و کوچکی حروف حساس نیستند و از
نویسه‌های عام (`telegram.*` یا `*`) پشتیبانی می‌کنند:

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان بازنویسی یک‌باره متغیر محیطی:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی پرچم در فایل گزارش استاندارد (`logging.file`) نوشته می‌شود و همچنان
توسط `logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[پرچم‌های تشخیصی](/fa/diagnostics/flags).

## غیرفعال‌سازی

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

یا `diagnostics-otel` را از `plugins.allow` حذف کنید، یا فرمان
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [گزارش‌گیری](/fa/logging) - گزارش‌های فایل، خروجی کنسول، دنبال‌کردن با CLI و زبانه گزارش‌های رابط کنترل
- [جزئیات داخلی گزارش‌گیری Gateway](/fa/gateway/logging) - سبک‌های گزارش WS، پیشوندهای زیرسامانه و ثبت کنسول
- [پرچم‌های تشخیصی](/fa/diagnostics/flags) - پرچم‌های هدفمند گزارش اشکال‌زدایی
- [صدور داده‌های تشخیصی](/fa/gateway/diagnostics) - ابزار بسته پشتیبانی اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) - مرجع کامل فیلدهای `diagnostics.*`
