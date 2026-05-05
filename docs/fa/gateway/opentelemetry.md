---
read_when:
    - می‌خواهید میزان استفاده از مدل OpenClaw، جریان پیام‌ها، یا معیارهای جلسه را به یک گردآورندهٔ OpenTelemetry ارسال کنید
    - تریس‌ها، متریک‌ها یا لاگ‌ها را به Grafana، Datadog، Honeycomb، New Relic، Tempo یا بک‌اند OTLP دیگری متصل می‌کنید
    - برای ساخت داشبوردها یا هشدارها، به نام‌های دقیق معیارها، نام‌های بازه‌ها یا ساختار ویژگی‌ها نیاز دارید
summary: داده‌های تشخیصی OpenClaw را از طریق Plugin diagnostics-otel (OTLP/HTTP) به هر گردآورنده OpenTelemetry صادر کنید
title: صدور OpenTelemetry
x-i18n:
    generated_at: "2026-05-05T06:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw تشخیص‌ها را از طریق Plugin رسمی `diagnostics-otel`
با استفاده از **OTLP/HTTP (protobuf)** صادر می‌کند. هر collector یا backend که OTLP/HTTP را بپذیرد
بدون تغییر در کد کار می‌کند. برای گزارش‌های فایل محلی و نحوه خواندن آن‌ها، به
[گزارش‌گیری](/fa/logging) مراجعه کنید.

## نحوه قرارگیری اجزا کنار هم

- **رویدادهای تشخیصی** رکوردهای ساختاریافته و درون‌فرایندی هستند که توسط
  Gateway و Pluginهای همراه برای اجرای مدل، جریان پیام، نشست‌ها، صف‌ها،
  و exec منتشر می‌شوند.
- **Plugin `diagnostics-otel`** مشترک این رویدادها می‌شود و آن‌ها را به‌صورت
  OpenTelemetry **سنجه‌ها**، **traceها**، و **گزارش‌ها** از طریق OTLP/HTTP صادر می‌کند.
- **فراخوانی‌های provider** زمانی که transport provider سرآیندهای سفارشی را بپذیرد، یک سرآیند W3C `traceparent` از زمینه span فراخوانی مدل مورد اعتماد OpenClaw دریافت می‌کنند. زمینه trace منتشرشده توسط Plugin منتشر نمی‌شود.
- صادرکننده‌ها فقط زمانی متصل می‌شوند که هم سطح تشخیص‌ها و هم Plugin فعال باشند،
  بنابراین هزینه درون‌فرایندی به‌صورت پیش‌فرض نزدیک به صفر می‌ماند.

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

| سیگنال      | آنچه وارد آن می‌شود                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **سنجه‌ها** | شمارنده‌ها و histogramها برای مصرف token، هزینه، مدت اجرای run، جریان پیام، laneهای صف، وضعیت نشست، exec، و فشار حافظه.          |
| **Traceها**  | Spanها برای مصرف مدل، فراخوانی‌های مدل، چرخه عمر harness، اجرای ابزار، exec، پردازش webhook/پیام، ساخت context، و حلقه‌های ابزار. |
| **گزارش‌ها**    | رکوردهای ساختاریافته `logging.file` که وقتی `diagnostics.otel.logs` فعال باشد از طریق OTLP صادر می‌شوند.                                              |

`traces`، `metrics`، و `logs` را مستقل از هم تغییر دهید. وقتی
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | `diagnostics.otel.endpoint` را override می‌کند. اگر مقدار از قبل شامل `/v1/traces`، `/v1/metrics`، یا `/v1/logs` باشد، همان‌طور که هست استفاده می‌شود.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | overrideهای endpoint مخصوص سیگنال که وقتی کلید پیکربندی متناظر `diagnostics.otel.*Endpoint` تنظیم نشده باشد استفاده می‌شوند. پیکربندی مخصوص سیگنال بر env مخصوص سیگنال اولویت دارد، و آن نیز بر endpoint مشترک اولویت دارد.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | `diagnostics.otel.serviceName` را override می‌کند.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | پروتکل سیمی را override می‌کند؛ امروز فقط `http/protobuf` رعایت می‌شود.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | روی `gen_ai_latest_experimental` تنظیم کنید تا به‌جای `gen_ai.system` قدیمی، تازه‌ترین attribute آزمایشی span مربوط به GenAI (`gen_ai.provider.name`) منتشر شود. سنجه‌های GenAI همیشه، فارغ از این مقدار، از attributeهای معنایی محدود و کم-cardinality استفاده می‌کنند. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | وقتی preload یا فرایند میزبان دیگری از قبل SDK سراسری OpenTelemetry را ثبت کرده است، روی `1` تنظیم کنید. سپس Plugin چرخه عمر NodeSDK خودش را رد می‌کند اما همچنان listenerهای تشخیصی را سیم‌کشی می‌کند و `traces`/`metrics`/`logs` را رعایت می‌کند.                |

## حریم خصوصی و ثبت محتوا

محتوای خام مدل/ابزار به‌صورت پیش‌فرض صادر **نمی‌شود**. Spanها شناسه‌های محدود
(channel، provider، model، دسته خطا، شناسه‌های درخواست فقط-hash) را حمل می‌کنند
و هرگز شامل متن prompt، متن response، ورودی‌های ابزار، خروجی‌های ابزار، یا
کلیدهای نشست نیستند.

درخواست‌های خروجی مدل ممکن است شامل یک سرآیند W3C `traceparent` باشند. آن سرآیند
فقط از زمینه trace تشخیصی متعلق به OpenClaw برای فراخوانی فعال مدل تولید می‌شود.
سرآیندهای `traceparent` ارائه‌شده توسط caller جایگزین می‌شوند، بنابراین Pluginها یا
گزینه‌های سفارشی provider نمی‌توانند تبار trace میان‌سرویسی را جعل کنند.

`diagnostics.otel.captureContent.*` را فقط زمانی روی `true` تنظیم کنید که collector و
سیاست نگهداری شما برای متن prompt، response، ابزار، یا system-prompt
تأیید شده باشند. هر زیرکلید مستقل opt-in می‌شود:

- `inputMessages` — محتوای prompt کاربر.
- `outputMessages` — محتوای response مدل.
- `toolInputs` — payloadهای argument ابزار.
- `toolOutputs` — payloadهای نتیجه ابزار.
- `systemPrompt` — prompt ساخته‌شده system/developer.

وقتی هر زیرکلید فعال باشد، spanهای مدل و ابزار فقط برای همان کلاس، attributeهای محدود و redacted
`openclaw.content.*` دریافت می‌کنند.

## Sampling و flushing

- **Traceها:** `diagnostics.otel.sampleRate` (فقط root-span، `0.0` همه را کنار می‌گذارد،
  `1.0` همه را نگه می‌دارد).
- **سنجه‌ها:** `diagnostics.otel.flushIntervalMs` (حداقل `1000`).
- **گزارش‌ها:** گزارش‌های OTLP به `logging.level` (سطح گزارش فایل) احترام می‌گذارند. آن‌ها از مسیر redaction رکورد گزارش تشخیصی استفاده می‌کنند، نه قالب‌بندی console. نصب‌های پرترافیک باید sampling/filtering در collector OTLP را به sampling محلی ترجیح دهند.
- **همبستگی گزارش فایل:** گزارش‌های فایل JSONL وقتی فراخوانی گزارش یک context trace تشخیصی معتبر داشته باشد، `traceId`،
  `spanId`، `parentSpanId`، و `traceFlags` را در سطح top-level شامل می‌شوند، که به پردازشگرهای گزارش اجازه می‌دهد خط‌های گزارش محلی را با
  spanهای صادرشده join کنند.
- **همبستگی درخواست:** درخواست‌های HTTP در Gateway و frameهای WebSocket یک
  scope trace داخلی درخواست ایجاد می‌کنند. گزارش‌ها و رویدادهای تشخیصی داخل آن scope
  به‌صورت پیش‌فرض trace درخواست را به ارث می‌برند، در حالی که spanهای اجرای agent و فراخوانی مدل
  به‌عنوان فرزند ساخته می‌شوند تا سرآیندهای `traceparent` provider روی همان trace بمانند.

## سنجه‌های صادرشده

### مصرف مدل

- `openclaw.tokens` (counter، attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram، attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram، سنجه semantic-conventions مربوط به GenAI، attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram، ثانیه، سنجه semantic-conventions مربوط به GenAI، attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختیاری `error.type`)
- `openclaw.model_call.duration_ms` (histogram، attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, به‌علاوه `openclaw.errorCategory` و `openclaw.failureKind` روی خطاهای دسته‌بندی‌شده)
- `openclaw.model_call.request_bytes` (histogram، اندازه بایت UTF-8 در payload نهایی درخواست مدل؛ بدون محتوای خام payload)
- `openclaw.model_call.response_bytes` (histogram، اندازه بایت UTF-8 رویدادهای response استریم‌شده مدل؛ بدون محتوای خام response)
- `openclaw.model_call.time_to_first_byte_ms` (histogram، زمان سپری‌شده پیش از نخستین رویداد response استریم‌شده)

### جریان پیام

- `openclaw.webhook.received` (counter، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter، attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter، attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram، attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### صف‌ها و نشست‌ها

- `openclaw.queue.lane.enqueue` (counter، attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (counter، attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histogram، attrs: `openclaw.lane` یا `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histogram، attrs: `openclaw.lane`)
- `openclaw.session.state` (counter، attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (counter، attrs: `openclaw.state`؛ فقط برای ثبت وضعیت نشست stale بدون کار فعال منتشر می‌شود)
- `openclaw.session.stuck_age_ms` (histogram، attrs: `openclaw.state`؛ فقط برای ثبت وضعیت نشست stale بدون کار فعال منتشر می‌شود)
- `openclaw.run.attempt` (counter، attrs: `openclaw.attempt`)

### تله‌متری زنده‌بودن نشست

`diagnostics.stuckSessionWarnMs` آستانه سن بدون پیشرفت برای تشخیص‌های زنده‌بودن نشست است. یک نشست `processing` تا زمانی که OpenClaw پیشرفت runtime مربوط به reply، tool، status، block، یا ACP را مشاهده می‌کند، به سمت این آستانه پیر نمی‌شود.
keepaliveهای typing به‌عنوان پیشرفت شمرده نمی‌شوند، بنابراین یک مدل یا harness خاموش همچنان قابل تشخیص است.

OpenClaw نشست‌ها را بر اساس کاری که هنوز می‌تواند مشاهده کند دسته‌بندی می‌کند:

- `session.long_running`: کارهای تعبیه‌شدهٔ فعال، فراخوانی‌های مدل، یا فراخوانی‌های ابزار
  همچنان در حال پیشرفت هستند.
- `session.stalled`: کار فعال وجود دارد، اما اجرای فعال پیشرفت اخیر را گزارش نکرده
  است. اجراهای تعبیه‌شدهٔ متوقف‌مانده در ابتدا فقط در حالت مشاهده باقی می‌مانند،
  سپس پس از `diagnostics.stuckSessionAbortMs` بدون پیشرفت وارد abort-drain می‌شوند
  تا نوبت‌های صف‌شده پشت آن مسیر بتوانند از سر گرفته شوند. وقتی تنظیم نشده باشد،
  آستانهٔ لغو به‌طور پیش‌فرض روی بازهٔ طولانی‌تر و ایمن‌ترِ حداقل ۱۰ دقیقه و ۵ برابر
  `diagnostics.stuckSessionWarnMs` قرار می‌گیرد.
- `session.stuck`: ثبت وضعیت جلسهٔ کهنه بدون کار فعال. این مورد مسیر جلسهٔ متاثر را
  بلافاصله آزاد می‌کند.

بازیابی رویدادهای ساختاریافتهٔ `session.recovery.requested` و
`session.recovery.completed` را منتشر می‌کند. وضعیت جلسهٔ تشخیصی فقط پس از یک
نتیجهٔ بازیابی تغییردهنده (`aborted` یا `released`) و فقط اگر همان نسل پردازش
هنوز جاری باشد، به‌عنوان بیکار علامت‌گذاری می‌شود.

فقط `session.stuck` شمارندهٔ `openclaw.session.stuck`، هیستوگرام
`openclaw.session.stuck_age_ms`، و span با نام `openclaw.session.stuck` را منتشر
می‌کند. تشخیص‌های تکراری `session.stuck` تا زمانی که جلسه بدون تغییر بماند
عقب‌نشینی می‌کنند، بنابراین داشبوردها باید به افزایش‌های پایدار هشدار دهند، نه به
هر تیک Heartbeat. برای گزینهٔ پیکربندی و پیش‌فرض‌ها، [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics)
را ببینید.

### چرخهٔ حیات harness

- `openclaw.harness.duration_ms` (هیستوگرام، ویژگی‌ها: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` هنگام خطاها)

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
  - `gen_ai.system` به‌طور پیش‌فرض، یا `gen_ai.provider.name` وقتی جدیدترین قراردادهای معنایی GenAI فعال شده باشند
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` به‌طور پیش‌فرض، یا `gen_ai.provider.name` وقتی جدیدترین قراردادهای معنایی GenAI فعال شده باشند
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` و `openclaw.failureKind` اختیاری هنگام خطاها
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (هش محدود مبتنی بر SHA از شناسهٔ درخواست provider بالادستی؛ شناسه‌های خام صادر نمی‌شوند)
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بدون محتوای prompt، تاریخچه، پاسخ، یا کلید جلسه)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بدون پیام‌های حلقه، پارامترها، یا خروجی ابزار)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

وقتی ثبت محتوا صریحاً فعال شده باشد، spanهای مدل و ابزار همچنین می‌توانند
ویژگی‌های محدود و ویرایش‌شدهٔ `openclaw.content.*` را برای کلاس‌های محتوای مشخصی
که فعال کرده‌اید شامل شوند.

## کاتالوگ رویدادهای تشخیصی

رویدادهای زیر پشتوانهٔ معیارها و spanهای بالا هستند. Pluginها نیز می‌توانند
بدون صدور OTLP مستقیماً در آن‌ها مشترک شوند.

**استفاده از مدل**

- `model.usage` — توکن‌ها، هزینه، مدت‌زمان، context، provider/model/channel،
  شناسه‌های جلسه. `usage` حسابداری provider/نوبت برای هزینه و telemetry است؛
  `context.used` snapshot فعلی prompt/context است و وقتی ورودی کش‌شده یا فراخوانی‌های
  حلقهٔ ابزار درگیر باشند، می‌تواند کمتر از `usage.total` متعلق به provider باشد.

**جریان پیام**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**صف و جلسه**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (شمارنده‌های تجمیعی: webhooks/queue/session)

**چرخهٔ حیات harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  چرخهٔ حیات هر اجرا برای harness عامل. شامل `harnessId`، `pluginId` اختیاری،
  provider/model/channel، و شناسهٔ اجرا است. تکمیل، `durationMs`، `outcome`،
  `resultClassification` اختیاری، `yieldDetected`، و شمارش‌های `itemLifecycle` را
  اضافه می‌کند. خطاها `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`)،
  `errorCategory`، و `cleanupFailed` اختیاری را اضافه می‌کنند.

**Exec**

- `exec.process.completed` — نتیجهٔ پایانه، مدت‌زمان، هدف، حالت، کد خروج، و نوع
  شکست. متن فرمان و دایرکتوری‌های کاری شامل نمی‌شوند.

## بدون صادرکننده

می‌توانید رویدادهای diagnostics را بدون اجرای `diagnostics-otel` در دسترس Pluginها
یا sinkهای سفارشی نگه دارید:

```json5
{
  diagnostics: { enabled: true },
}
```

برای خروجی debug هدفمند بدون افزایش `logging.level`، از پرچم‌های diagnostics
استفاده کنید. پرچم‌ها به بزرگی و کوچکی حروف حساس نیستند و از wildcard پشتیبانی
می‌کنند (مثلاً `telegram.*` یا `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

یا به‌عنوان override یک‌بارهٔ env:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

خروجی پرچم به فایل log استاندارد (`logging.file`) می‌رود و همچنان توسط
`logging.redactSensitive` ویرایش می‌شود. راهنمای کامل:
[پرچم‌های diagnostics](/fa/diagnostics/flags).

## غیرفعال کردن

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

همچنین می‌توانید `diagnostics-otel` را از `plugins.allow` کنار بگذارید، یا
`openclaw plugins disable diagnostics-otel` را اجرا کنید.

## مرتبط

- [لاگ‌گیری](/fa/logging) — لاگ‌های فایل، خروجی کنسول، دنبال‌کردن از CLI، و زبانهٔ Logs در Control UI
- [جزئیات داخلی لاگ‌گیری Gateway](/fa/gateway/logging) — سبک‌های لاگ WS، پیشوندهای زیرسامانه، و ثبت کنسول
- [پرچم‌های diagnostics](/fa/diagnostics/flags) — پرچم‌های هدفمند debug-log
- [صدور diagnostics](/fa/gateway/diagnostics) — ابزار support-bundle برای اپراتور (جدا از صدور OTEL)
- [مرجع پیکربندی](/fa/gateway/configuration-reference#diagnostics) — مرجع کامل فیلدهای `diagnostics.*`
