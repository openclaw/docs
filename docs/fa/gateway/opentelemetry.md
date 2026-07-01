---
read_when:
    - می‌خواهید میزان استفاده از مدل، جریان پیام، یا معیارهای نشست OpenClaw را به یک گردآورنده OpenTelemetry ارسال کنید
    - در حال اتصال ردیابی‌ها، معیارها یا لاگ‌ها به Grafana، Datadog، Honeycomb، New Relic، Tempo یا بک‌اند OTLP دیگری هستید
    - برای ساخت داشبوردها یا هشدارها به نام‌های دقیق معیارها، نام‌های span یا ساختارهای ویژگی نیاز دارید
summary: خروجی گرفتن از عیب‌یابی‌های OpenClaw به گردآورنده‌های OpenTelemetry یا stdout JSONL از طریق افزونه diagnostics-otel
title: صادرسازی OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T08:22:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw تشخیص‌ها را از طریق Plugin رسمی `diagnostics-otel`
با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. لاگ‌ها همچنین می‌توانند برای
خطوط لوله لاگ کانتینر و sandbox به‌صورت stdout JSONL نوشته شوند. هر collector یا backend که
OTLP/HTTP را بپذیرد، بدون تغییر کد کار می‌کند. برای لاگ‌های فایل محلی و نحوه خواندن آن‌ها،
[لاگ‌گیری](/fa/logging) را ببینید.

## اجزا چگونه کنار هم کار می‌کنند

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها،
  و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** مشترک آن رویدادها می‌شود و آن‌ها را به‌صورت
  **metrics**، **traces** و **logs** در بستر OTLP/HTTP صادر می‌کند. همچنین می‌تواند
  رکوردهای لاگ تشخیصی را به stdout JSONL نیز منعکس کند.
- **فراخوانی‌های ارائه‌دهنده** وقتی transport ارائه‌دهنده headerهای سفارشی را بپذیرد،
  یک header با نام W3C `traceparent` را از context span فراخوانی مدل مورد اعتماد OpenClaw
  دریافت می‌کنند. context ردیابیِ منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط زمانی متصل می‌شوند که هم سطح تشخیص و هم Plugin
  فعال باشند، بنابراین هزینه درون‌فرایندی به‌طور پیش‌فرض نزدیک به صفر می‌ماند.

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

| سیگنال      | چه چیزی در آن قرار می‌گیرد                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Metrics** | شمارنده‌ها و هیستوگرام‌ها برای مصرف توکن، هزینه، مدت اجرای run، failover، استفاده از skill، جریان پیام، رویدادهای Talk، laneهای صف، وضعیت/بازیابی نشست، اجرای ابزار، payloadهای بیش‌ازحد بزرگ، exec، و فشار حافظه. |
| **Traces**  | Spanها برای استفاده از مدل، فراخوانی‌های مدل، چرخه عمر harness، استفاده از skill، اجرای ابزار، exec، پردازش webhook/پیام، ساخت context، و loopهای ابزار.                                                            |
| **Logs**    | رکوردهای ساختاریافته `logging.file` که وقتی `diagnostics.otel.logs` فعال باشد از طریق OTLP یا stdout JSONL صادر می‌شوند؛ بدنه‌های لاگ نگه داشته می‌شوند مگر اینکه capture محتوا صراحتا فعال شده باشد.                                |

`traces`، `metrics` و `logs` را مستقل از هم تغییر دهید. وقتی
`diagnostics.otel.enabled` برابر true باشد، traces و metrics به‌طور پیش‌فرض فعال هستند. Logs به‌طور پیش‌فرض غیرفعال است و
فقط زمانی صادر می‌شود که `diagnostics.otel.logs` صراحتا `true` باشد. صدور لاگ
به‌طور پیش‌فرض OTLP است؛ برای JSONL روی stdout مقدار `diagnostics.otel.logsExporter` را به `stdout` تنظیم کنید،
یا برای ارسال هر رکورد لاگ تشخیصی به OTLP و stdout مقدار `both` را قرار دهید.

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | مقدار `diagnostics.otel.endpoint` را بازنویسی می‌کند. اگر مقدار از قبل شامل `/v1/traces`، `/v1/metrics` یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | بازنویسی‌های endpoint ویژه سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی ویژه سیگنال بر env ویژه سیگنال اولویت دارد، و آن نیز بر endpoint مشترک اولویت دارد.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | مقدار `diagnostics.otel.serviceName` را بازنویسی می‌کند.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل wire را بازنویسی می‌کند (امروز فقط `http/protobuf` رعایت می‌شود).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | برای انتشار تازه‌ترین شکل آزمایشی span استنتاج GenAI، شامل نام‌های span به‌شکل `{gen_ai.operation.name} {gen_ai.request.model}`، نوع span برابر `CLIENT`، و `gen_ai.provider.name` به‌جای `gen_ai.system` قدیمی، روی `gen_ai_latest_experimental` تنظیم کنید. metricsهای GenAI همیشه، مستقل از این مقدار، از attributeهای معنایی محدود و کم-cardinality استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرایند میزبان دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند اما همچنان listenerهای تشخیصی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                                                                                                                    |

## حریم خصوصی و capture محتوا

محتوای خام مدل/ابزار به‌طور پیش‌فرض صادر **نمی‌شود**. Spanها شناسه‌های محدود
(channel، provider، model، دسته خطا، شناسه‌های درخواست فقط-hash،
منبع ابزار، مالک ابزار، و نام/منبع skill) را حمل می‌کنند و هرگز شامل متن prompt،
متن پاسخ، ورودی‌های ابزار، خروجی‌های ابزار، مسیرهای فایل skill، یا کلیدهای نشست نمی‌شوند.
رکوردهای لاگ OTLP به‌طور پیش‌فرض severity، logger، محل کد، context ردیابی مورد اعتماد،
و attributeهای پاک‌سازی‌شده را نگه می‌دارند، اما بدنه خام پیام لاگ
فقط زمانی صادر می‌شود که `diagnostics.otel.captureContent` روی boolean `true` تنظیم شده باشد. زیرکلیدهای جزئی
`captureContent.*` بدنه‌های لاگ را فعال نمی‌کنند. labelهایی که شبیه
کلیدهای نشست عامل scoped باشند با `unknown` جایگزین می‌شوند.
metricsهای Talk فقط metadata محدود رویداد مانند mode، transport،
provider و نوع رویداد را صادر می‌کنند. آن‌ها شامل transcriptها، payloadهای صوتی،
شناسه‌های نشست، شناسه‌های turn، شناسه‌های call، شناسه‌های room، یا tokenهای handoff نمی‌شوند.

درخواست‌های خروجی مدل ممکن است شامل header با نام W3C `traceparent` باشند. این header
فقط از context ردیابی تشخیصی متعلق به OpenClaw برای فراخوانی مدل فعال
تولید می‌شود. headerهای `traceparent` موجود که توسط caller ارائه شده‌اند جایگزین می‌شوند، بنابراین Pluginها یا
گزینه‌های سفارشی provider نمی‌توانند تبار ردیابی بین‌سرویسی را جعل کنند.

فقط زمانی `diagnostics.otel.captureContent.*` را روی `true` تنظیم کنید که collector و
سیاست نگهداری شما برای متن prompt، پاسخ، ابزار، یا system-prompt
تایید شده باشند. هر زیرکلید به‌صورت مستقل opt-in است:

- `inputMessages` - محتوای prompt کاربر.
- `outputMessages` - محتوای پاسخ مدل.
- `toolInputs` - payloadهای آرگومان ابزار.
- `toolOutputs` - payloadهای نتیجه ابزار.
- `systemPrompt` - prompt سیستم/توسعه‌دهنده مونتاژشده.
- `toolDefinitions` - نام‌ها، توضیحات، و schemaهای ابزار مدل.

وقتی هر زیرکلید فعال باشد، spanهای مدل و ابزار فقط برای همان class،
attributeهای محدود و redacted با نام `openclaw.content.*` دریافت می‌کنند. از boolean
`captureContent: true` فقط برای captureهای تشخیصی گسترده استفاده کنید که در آن‌ها بدنه‌های پیام لاگ OTLP نیز برای export تایید شده‌اند.

محتوای `toolInputs`/`toolOutputs` برای اجرای ابزارهای runtime داخلی عامل
capture می‌شود (`openclaw.content.tool_input` روی spanهای completed/error،
`openclaw.content.tool_output` روی spanهای completed). فراخوانی‌های ابزار harness خارجی
(Codex، Claude CLI) spanهای `tool.execution.*` را بدون payloadهای محتوا منتشر می‌کنند.
محتوای captureشده روی یک کانال مورد اعتماد و فقط-listener جابه‌جا می‌شود و هرگز
روی bus عمومی رویداد تشخیصی قرار نمی‌گیرد.

## نمونه‌برداری و flush کردن

- **ردیابی‌ها:** `diagnostics.otel.sampleRate` (فقط root-span، مقدار `0.0` همه را حذف می‌کند،
  مقدار `1.0` همه را نگه می‌دارد).
- **معیارها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **لاگ‌ها:** لاگ‌های OTLP از `logging.level` (سطح لاگ فایل) پیروی می‌کنند. آن‌ها از
  مسیر پوشاندن داده‌های حساس در diagnostic log-record استفاده می‌کنند، نه قالب‌بندی کنسول. نصب‌های
  پرترافیک باید sampling/filtering در OTLP collector را به نمونه‌برداری محلی ترجیح دهند.
  وقتی پلتفرم شما از قبل stdout/stderr را به یک پردازشگر لاگ ارسال می‌کند و OTLP logs
  collector ندارید، `diagnostics.otel.logsExporter: "stdout"` را تنظیم کنید.
  رکوردهای Stdout در هر خط یک شیء JSON هستند و شامل `ts`، `signal`،
  `service.name`، شدت، بدنه، ویژگی‌های پوشانده‌شده، و فیلدهای ردیابی قابل‌اعتماد
  در صورت وجود می‌شوند.
- **هم‌بستگی لاگ فایل:** لاگ‌های فایل JSONL وقتی فراخوانی لاگ یک
  زمینه ردیابی diagnostic معتبر داشته باشد، `traceId`،
  `spanId`، `parentSpanId` و `traceFlags` را در سطح بالا شامل می‌شوند، که به
  پردازشگرهای لاگ اجازه می‌دهد خطوط لاگ محلی را با spanهای صادرشده پیوند دهند.
- **هم‌بستگی درخواست:** درخواست‌های HTTP در Gateway و فریم‌های WebSocket یک
  محدوده ردیابی درخواست داخلی ایجاد می‌کنند. لاگ‌ها و رویدادهای diagnostic درون آن محدوده
  به‌صورت پیش‌فرض ردیابی درخواست را به ارث می‌برند، در حالی که agent run و spanهای model-call
  به‌عنوان فرزند ایجاد می‌شوند تا headerهای `traceparent` ارائه‌دهنده روی همان ردیابی بمانند.
- **هم‌بستگی model-call:** spanهای `openclaw.model.call` به‌صورت پیش‌فرض اندازه‌های امن
  مؤلفه‌های پرامپت را شامل می‌شوند و وقتی نتیجه ارائه‌دهنده usage را نمایش دهد، ویژگی‌های توکن
  هر فراخوانی را هم شامل می‌شوند. `openclaw.model.usage` همچنان span حسابداری سطح run
  برای هزینه تجمیعی، زمینه، و داشبوردهای کانال باقی می‌ماند؛ وقتی runtime صادرکننده
  زمینه ردیابی قابل‌اعتماد داشته باشد، روی همان ردیابی diagnostic می‌ماند.

## معیارهای صادرشده

### مصرف مدل

- `openclaw.tokens` (شمارنده، ویژگی‌ها: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (شمارنده، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (هیستوگرام، ویژگی‌ها: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (هیستوگرام، معیار قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (هیستوگرام، ثانیه، معیار قراردادهای معنایی GenAI، ویژگی‌ها: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، `error.type` اختیاری)
- `openclaw.model_call.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای طبقه‌بندی‌شده)
- `openclaw.model_call.request_bytes` (هیستوگرام، اندازه بایتی UTF-8 برای payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (هیستوگرام، اندازه بایتی UTF-8 برای payloadهای قطعه‌های پاسخ stream‌شده؛ دلتاهای پرتکرار متن، thinking، و tool-call فقط بایت‌های افزایشی `delta` را می‌شمارند؛ بدون محتوای خام پاسخ)
- `openclaw.model_call.time_to_first_byte_ms` (هیستوگرام، زمان سپری‌شده پیش از اولین رویداد پاسخ stream‌شده)
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
- `openclaw.talk.event.duration_ms` (هیستوگرام، ویژگی‌ها: همانند `openclaw.talk.event`؛ وقتی یک رویداد Talk مدت‌زمان را گزارش کند صادر می‌شود)
- `openclaw.talk.audio.bytes` (هیستوگرام، ویژگی‌ها: همانند `openclaw.talk.event`؛ برای رویدادهای فریم صوتی Talk که طول بایت را گزارش می‌کنند صادر می‌شود)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (شمارنده، ویژگی‌ها: `openclaw.lane`)
- `openclaw.queue.depth` (هیستوگرام، ویژگی‌ها: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (هیستوگرام، ویژگی‌ها: `openclaw.lane`)
- `openclaw.session.state` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (شمارنده، ویژگی‌ها: `openclaw.state`؛ برای دفتر ثبت نشست‌های stale قابل‌بازیابی صادر می‌شود)
- `openclaw.session.stuck_age_ms` (هیستوگرام، ویژگی‌ها: `openclaw.state`؛ برای دفتر ثبت نشست‌های stale قابل‌بازیابی صادر می‌شود)
- `openclaw.session.turn.created` (شمارنده، ویژگی‌ها: `openclaw.agent`، `openclaw.channel`، `openclaw.trigger`)
- `openclaw.session.recovery.requested` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.completed` (شمارنده، ویژگی‌ها: `openclaw.state`، `openclaw.action`، `openclaw.status`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (هیستوگرام، ویژگی‌ها: همانند شمارنده recovery متناظر)
- `openclaw.run.attempt` (شمارنده، ویژگی‌ها: `openclaw.attempt`)

### تله‌متری زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای diagnosticهای
زنده‌بودن نشست است. یک نشست `processing` تا وقتی OpenClaw پیشرفت پاسخ، ابزار،
وضعیت، بلوک، یا runtime مربوط به ACP را مشاهده می‌کند، به سمت این آستانه پیر نمی‌شود.
Typing keepaliveها به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین مدل یا harness خاموش
همچنان قابل‌شناسایی است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند طبقه‌بندی می‌کند:

- `session.long_running`: کار embedded فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار
  هنوز در حال پیشرفت هستند. فراخوانی‌های مدل دارای مالک که بیش از
  `diagnostics.stuckSessionWarnMs` خاموش بمانند نیز پیش از
  `diagnostics.stuckSessionAbortMs` به‌صورت long-running گزارش می‌شوند تا ارائه‌دهندگان مدل
  کند یا غیرstreaming تا وقتی همچنان قابل abort مشاهده می‌شوند، شبیه نشست‌های Gateway متوقف‌شده
  به نظر نرسند.
- `session.stalled`: کار فعال وجود دارد، اما run فعال پیشرفت اخیر گزارش نکرده است.
  فراخوانی‌های مدل دارای مالک در زمان یا پس از `diagnostics.stuckSessionAbortMs` از
  `session.long_running` به `session.stalled` تغییر می‌کنند؛ فعالیت stale مدل/ابزار بدون مالک
  به‌عنوان کار long-running بی‌ضرر در نظر گرفته نمی‌شود.
  runهای embedded متوقف‌شده ابتدا فقط observe-only می‌مانند، سپس پس از
  `diagnostics.stuckSessionAbortMs` بدون پیشرفت، abort-drain می‌شوند تا turnهای صف‌شده پشت
  lane بتوانند از سر گرفته شوند. وقتی تنظیم نشده باشد، آستانه abort به‌صورت پیش‌فرض برابر
  با پنجره توسعه‌یافته امن‌ترِ حداقل ۵ دقیقه و ۳ برابر
  `diagnostics.stuckSessionWarnMs` است.
- `session.stuck`: دفتر ثبت نشست stale بدون کار فعال، یا نشست صف‌شده idle
  با فعالیت stale مدل/ابزار بدون مالک. این حالت پس از عبور gateهای recovery،
  lane نشست متأثر را بلافاصله آزاد می‌کند.

Recovery رویدادهای ساختاریافته `session.recovery.requested` و
`session.recovery.completed` را صادر می‌کند. وضعیت نشست diagnostic فقط پس از یک
نتیجه recovery تغییردهنده (`aborted` یا `released`) و فقط وقتی همان نسل processing
هنوز جاری باشد، idle علامت‌گذاری می‌شود.

فقط `session.stuck` شمارنده `openclaw.session.stuck`،
هیستوگرام `openclaw.session.stuck_age_ms`، و span `openclaw.session.stuck`
را صادر می‌کند. diagnosticهای تکراری `session.stuck` تا وقتی نشست بدون تغییر بماند
back off می‌کنند، بنابراین داشبوردها باید به افزایش‌های پایدار هشدار دهند نه به هر
تیک Heartbeat. برای گزینه پیکربندی و پیش‌فرض‌ها، به
[مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) مراجعه کنید.

هشدارهای زنده‌بودن همچنین صادر می‌کنند:

- `openclaw.liveness.warning` (شمارنده، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (هیستوگرام، ویژگی‌ها: `openclaw.liveness.reason`)

### چرخه عمر harness

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` روی خطاها)

### اجرای ابزار

- `openclaw.tool.execution.duration_ms` (هیستوگرام، ویژگی‌ها: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، به‌علاوه `openclaw.errorCategory` روی خطاها)
- `openclaw.tool.execution.blocked` (شمارنده، ویژگی‌ها: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### اجزای داخلی diagnosticها (حافظه و حلقه ابزار)

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
  - به‌طور پیش‌فرض `gen_ai.system`، یا `gen_ai.provider.name` وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - به‌طور پیش‌فرض `gen_ai.system`، یا `gen_ai.provider.name` وقتی تازه‌ترین قراردادهای معنایی GenAI فعال شده باشند
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری هنگام خطاها
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`، `openclaw.model_call.prompt.input_messages_chars`، `openclaw.model_call.prompt.system_prompt_chars`، `openclaw.model_call.prompt.tool_definitions_count`، `openclaw.model_call.prompt.tool_definitions_chars`، `openclaw.model_call.prompt.total_chars` (فقط اندازه‌های امن مؤلفه‌ها، بدون متن پرامپت)
  - `openclaw.model_call.usage.*` و `gen_ai.usage.*` وقتی نتیجه فراخوانی مدل، مصرف ارائه‌دهنده را برای همان فراخوانی جداگانه داشته باشد
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسه درخواست ارائه‌دهنده بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
  - با `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، spanهای فراخوانی مدل از تازه‌ترین نام span استنتاج GenAI یعنی `{gen_ai.operation.name} {gen_ai.request.model}` و نوع span `CLIENT` به‌جای `openclaw.model.call` استفاده می‌کنند.
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

وقتی ضبط محتوا به‌صراحت فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند
ویژگی‌های محدود و ویرایش‌شده `openclaw.content.*` را برای کلاس‌های محتوای مشخصی
که فعال کرده‌اید شامل شوند.

## کاتالوگ رویدادهای تشخیصی

رویدادهای زیر پشتوانه metricها و spanهای بالا هستند. Pluginها نیز می‌توانند
بدون صدور OTLP مستقیماً مشترک آن‌ها شوند.

**مصرف مدل**

- `model.usage` - توکن‌ها، هزینه، مدت‌زمان، context، ارائه‌دهنده/مدل/کانال،
  شناسه‌های نشست. `usage` حسابداری ارائه‌دهنده/نوبت برای هزینه و تله‌متری است؛
  `context.used` نمایه فعلی پرامپت/context است و وقتی ورودی cacheشده یا
  فراخوانی‌های حلقه ابزار درگیر باشند می‌تواند از `usage.total` ارائه‌دهنده
  کمتر باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و نشست**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: Webhookها/صف/نشست)

**چرخه عمر harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  چرخه عمر هر اجرا برای harness عامل. شامل `harnessId`، `pluginId` اختیاری،
  ارائه‌دهنده/مدل/کانال، و شناسه اجرا است. تکمیل، `durationMs`، `outcome`،
  `resultClassification` اختیاری، `yieldDetected`، و شمارش‌های `itemLifecycle`
  را اضافه می‌کند. خطاها `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، `errorCategory`، و
  `cleanupFailed` اختیاری را اضافه می‌کنند.

**Exec**

- `exec.process.completed` - نتیجه پایانی، مدت‌زمان، هدف، حالت، کد خروج،
  و نوع شکست. متن دستور و دایرکتوری‌های کاری شامل نمی‌شوند.
- `exec.approval.followup_suppressed` - پیگیری تأیید منقضی پس از بازگشت نشست
  حذف شد. شامل `approvalId`، `reason` (`session_rebound`)،
  `phase` (`direct_delivery` یا `gateway_preflight`)، و مُهر زمانی dispatcher
  است. کلیدهای نشست، مسیرها، و متن دستور شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای تشخیصی را بدون اجرای `diagnostics-otel` برای Pluginها یا
sinkهای سفارشی در دسترس نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی اشکال‌زدایی هدفمند بدون افزایش `logging.level`، از flagهای تشخیصی
استفاده کنید. flagها به بزرگی و کوچکی حروف حساس نیستند و از wildcard پشتیبانی
می‌کنند (مثلاً `telegram.*` یا `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان یک override یک‌باره env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی flag به فایل log استاندارد (`logging.file`) می‌رود و همچنان توسط
`logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[flagهای تشخیصی](/fa/diagnostics/flags).

## غیرفعال کردن

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` خارج کنید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [Logging](/fa/logging) - logهای فایل، خروجی کنسول، دنبال‌کردن CLI، و زبانه logهای Control UI
- [جزئیات داخلی logging Gateway](/fa/gateway/logging) - سبک‌های log در WS، پیشوندهای زیرسامانه، و ضبط کنسول
- [flagهای تشخیصی](/fa/diagnostics/flags) - flagهای هدفمند debug-log
- [صدور diagnostics](/fa/gateway/diagnostics) - ابزار support-bundle اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) - مرجع کامل فیلد `diagnostics.*`
