---
read_when:
    - تريد إرسال استخدام نموذج OpenClaw، أو تدفق الرسائل، أو مقاييس الجلسات إلى مُجمِّع OpenTelemetry
    - تقوم بتوصيل التتبعات أو المقاييس أو السجلات إلى Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى لـ OTLP
    - تحتاج إلى أسماء المقاييس الدقيقة، أو أسماء الامتدادات، أو أشكال السمات لإنشاء لوحات معلومات أو تنبيهات
summary: تصدير تشخيصات OpenClaw إلى أي مجمِّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-05-03T21:34:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8091aa633a3e10593681f94913a858587a5dc69d9947e0c0d4132f6e897b00b
    source_path: gateway/opentelemetry.md
    workflow: 16
---

يصدّر OpenClaw التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يعمل أي جامع أو خلفية تقبل OTLP/HTTP
من دون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تتكامل الأجزاء معًا

- **أحداث التشخيصات** هي سجلات منظمة داخل العملية يصدرها
  Gateway وPlugins المضمنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والطوابير،
  وexec.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدرها على هيئة
  **مقاييس** و**آثار** و**سجلات** OpenTelemetry عبر OTLP/HTTP.
- تتلقى **استدعاءات المزوّد** ترويسة W3C `traceparent` من سياق مقطع استدعاء النموذج
  الموثوق المملوك لـ OpenClaw عندما يقبل نقل المزوّد الترويسات المخصصة.
  لا يتم نشر سياق التتبع الصادر من Plugin.
- لا يتم إرفاق المصدّرات إلا عندما يكون كل من سطح التشخيصات وPlugin
  مفعّلين، لذلك تبقى تكلفة التنفيذ داخل العملية قريبة من الصفر افتراضيًا.

## البدء السريع

للتثبيتات المعبأة، ثبّت Plugin أولًا:

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

يمكنك أيضًا تفعيل Plugin من CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
يدعم `protocol` حاليًا `http/protobuf` فقط. يتم تجاهل `grpc`.
</Note>

## الإشارات المصدّرة

| الإشارة     | ما يدخل فيها                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتدفق الرسائل، ومسارات الطوابير، وحالة الجلسة، وexec، وضغط الذاكرة.          |
| **الآثار**  | مقاطع لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة الحاضنة، وتنفيذ الأدوات، وexec، ومعالجة Webhook/الرسائل، وتجميع السياق، وحلقات الأدوات. |
| **السجلات**    | سجلات `logging.file` المنظمة التي يتم تصديرها عبر OTLP عند تفعيل `diagnostics.otel.logs`.                                              |

فعّل أو عطّل `traces` و`metrics` و`logs` كلًا على حدة. تكون الثلاثة كلها مفعّلة افتراضيًا
عندما تكون `diagnostics.otel.enabled` صحيحة.

## مرجع الإعدادات

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

### متغيرات البيئة

| المتغير                                                                                                          | الغرض                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي مسبقًا على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، فتُستخدم كما هي.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقاط نهاية خاصة بالإشارة تُستخدم عندما يكون مفتاح إعدادات `diagnostics.otel.*Endpoint` المطابق غير مضبوط. تتغلب الإعدادات الخاصة بالإشارة على متغير البيئة الخاص بالإشارة، والذي يتغلب بدوره على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي (لا يُعتمد اليوم إلا `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث سمة تجريبية لمقطع GenAI (`gen_ai.provider.name`) بدلًا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجلت مسبقًا OpenTelemetry SDK العام. عندها يتخطى Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يوصّل مستمعي التشخيصات ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النماذج/الأدوات الخام **افتراضيًا**. تحمل المقاطع
معرّفات محدودة (القناة، والمزوّد، والنموذج، وفئة الخطأ، ومعرّفات طلبات بالتجزئة فقط)
ولا تتضمن أبدًا نص المطالبة، أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو
مفاتيح الجلسات.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُنشأ تلك الترويسة
فقط من سياق تتبع التشخيصات المملوك لـ OpenClaw لاستدعاء النموذج النشط.
يتم استبدال ترويسات `traceparent` المقدمة من المستدعي إن وجدت، لذلك لا تستطيع Plugins أو
خيارات المزوّد المخصصة تزوير نسب التتبع عبر الخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون الجامع
وسياسة الاحتفاظ معتمدين لنص المطالبة، أو الاستجابة، أو الأداة، أو مطالبة النظام.
كل مفتاح فرعي اختياري بشكل مستقل:

- `inputMessages` — محتوى مطالبة المستخدم.
- `outputMessages` — محتوى استجابة النموذج.
- `toolInputs` — حمولات وسائط الأداة.
- `toolOutputs` — حمولات نتائج الأداة.
- `systemPrompt` — مطالبة النظام/المطور المجمّعة.

عند تفعيل أي مفتاح فرعي، تحصل مقاطع النموذج والأداة على سمات
`openclaw.content.*` محدودة ومنقحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **الآثار:** `diagnostics.otel.sampleRate` (مقطع الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يبقي الكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجل التشخيصات، وليس تنسيق وحدة التحكم. ينبغي للتثبيتات عالية الحجم
  تفضيل أخذ العينات/الترشيح في جامع OTLP على أخذ العينات محليًا.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL حقول المستوى الأعلى `traceId`
  و`spanId` و`parentSpanId` و`traceFlags` عندما يحمل استدعاء السجل سياق تتبع
  تشخيصات صالحًا، مما يتيح لمعالجات السجلات ضم أسطر السجلات المحلية إلى
  المقاطع المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP الخاصة بـ Gateway وإطارات WebSocket نطاق تتبع طلب
  داخليًا. ترث السجلات وأحداث التشخيصات داخل ذلك النطاق تتبع الطلب افتراضيًا،
  بينما تُنشأ مقاطع تشغيل الوكيل واستدعاء النموذج كأبناء كي تبقى ترويسات `traceparent`
  الخاصة بالمزوّد على التتبع نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، السمات: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عداد، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، السمات: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، بالثواني، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, و`error.type` اختياريًا)
- `openclaw.model_call.duration_ms` (مدرج تكراري، السمات: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`، إضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم حمولات طلب النموذج النهائية ببايتات UTF-8؛ بلا محتوى حمولة خام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم أحداث استجابة النموذج المتدفقة ببايتات UTF-8؛ بلا محتوى استجابة خام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الزمن المنقضي قبل أول حدث استجابة متدفق)

### تدفق الرسائل

- `openclaw.webhook.received` (عداد، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (عداد، السمات: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (عداد، السمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، السمات: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### الطوابير والجلسات

- `openclaw.queue.lane.enqueue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، السمات: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`؛ يصدر فقط لمحاسبة الجلسات القديمة من دون عمل نشط)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يصدر فقط لمحاسبة الجلسات القديمة من دون عمل نشط)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

### قياس حيوية الجلسة عن بُعد

`diagnostics.stuckSessionWarnMs` هو حد عمر انعدام التقدم لتشخيصات
حيوية الجلسة. لا تتقدم جلسة `processing` نحو هذا الحد
ما دام OpenClaw يرصد تقدمًا في الرد، أو الأداة، أو الحالة، أو الكتلة، أو وقت تشغيل ACP.
لا تُحتسب إشارات بقاء الكتابة كتقدم، لذلك يمكن
اكتشاف النموذج أو الحاضنة الصامتة مع ذلك.

يصنّف OpenClaw الجلسات بحسب العمل الذي لا يزال قادرًا على رصده:

- `session.long_running`: عمل مضمّن نشط، أو استدعاءات نموذج، أو استدعاءات أدوات لا تزال
  تحقق تقدمًا.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلّغ عن
  تقدم حديث. تبقى عمليات التشغيل المضمّنة المتوقفة مؤقتًا في وضع المراقبة فقط في البداية، ثم
  تُجهض مع التصريف بعد 10 دقائق على الأقل و5 أضعاف `diagnostics.stuckSessionWarnMs`
  بلا تقدم حتى يمكن استئناف الأدوار المصطفة خلف المسار.
- `session.stuck`: تدوين قديم لحالة الجلسة بلا عمل نشط. يحرر هذا
  مسار الجلسة المتأثر فورًا.

وحده `session.stuck` يصدر عداد `openclaw.session.stuck`،
ومدرج `openclaw.session.stuck_age_ms`، ونطاق `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة ما دامت الجلسة بلا تغيير،
لذلك ينبغي أن تنبّه لوحات المعلومات عند الزيادات المستمرة بدلًا من كل
نبضة Heartbeat. لمعرفة مقبض الإعداد والقيم الافتراضية، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics).

### دورة حياة الحاضنة

- `openclaw.harness.duration_ms` (مدرج، سمات: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` عند الأخطاء)

### التنفيذ

- `openclaw.exec.duration_ms` (مدرج، سمات: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### مكونات التشخيص الداخلية (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مدرج، سمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج)
- `openclaw.memory.pressure` (عداد، سمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، سمات: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج، سمات: `openclaw.toolName`, `openclaw.outcome`)

## النطاقات المصدّرة

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` و`openclaw.failureKind` اختياريًا عند الأخطاء
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرّف طلب مزود المنبع؛ لا تُصدَّر المعرّفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`, `openclaw.errorCategory`, و`openclaw.harness.cleanup_failed` اختياريًا
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بلا محتوى مطالبة أو سجل أو استجابة أو مفتاح جلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بلا رسائل حلقة أو معاملات أو مخرجات أداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن لنطاقات النموذج والأدوات أيضًا
أن تتضمن سمات `openclaw.content.*` محدودة ومنقحة لفئات
المحتوى المحددة التي اخترت تفعيلها.

## كتالوج أحداث التشخيص

تدعم الأحداث أدناه المقاييس والنطاقات أعلاه. يمكن للـ Plugins أيضًا الاشتراك
فيها مباشرةً دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` — الرموز، التكلفة، المدة، السياق، المزود/النموذج/القناة،
  معرّفات الجلسة. `usage` هو احتساب المزود/الدور للتكلفة والقياس عن بُعد؛
  و`context.used` هو لقطة المطالبة/السياق الحالية ويمكن أن يكون أقل من
  `usage.total` لدى المزود عند وجود إدخال مخزّن مؤقتًا أو استدعاءات حلقة أدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**الصف والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمعة: webhooks/queue/session)

**دورة حياة الحاضنة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  دورة حياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId`، و`pluginId`
  اختياريًا، والمزود/النموذج/القناة، ومعرّف التشغيل. يضيف الاكتمال
  `durationMs` و`outcome` و`resultClassification` اختياريًا و`yieldDetected`
  وعدّادات `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`) و`errorCategory` و
  `cleanupFailed` اختياريًا.

**التنفيذ**

- `exec.process.completed` — النتيجة النهائية، والمدة، والهدف، والوضع، ورمز الخروج،
  ونوع الفشل. لا تُضمَّن نصوص الأوامر ولا أدلة العمل.

## دون مصدّر

يمكنك إبقاء أحداث التشخيص متاحة للـ Plugins أو للمصارف المخصصة دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

للحصول على مخرجات تصحيح محددة دون رفع `logging.level`، استخدم أعلام التشخيص.
الأعلام غير حساسة لحالة الأحرف وتدعم أحرف البدل (مثل `telegram.*` أو
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

أو كتجاوز بيئي لمرة واحدة:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

تذهب مخرجات الأعلام إلى ملف السجل القياسي (`logging.file`) وتظل
منقحة بواسطة `logging.redactSensitive`. الدليل الكامل:
[أعلام التشخيص](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضًا ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذو صلة

- [التسجيل](/ar/logging) — سجلات الملفات، ومخرجات وحدة التحكم، وتتبع CLI، وتبويب سجلات واجهة Control UI
- [مكونات تسجيل Gateway الداخلية](/ar/gateway/logging) — أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) — أعلام سجل تصحيح محددة
- [تصدير التشخيصات](/ar/gateway/diagnostics) — أداة حزمة دعم المشغل (منفصلة عن تصدير OTEL)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics) — مرجع كامل لحقول `diagnostics.*`
