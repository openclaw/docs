---
read_when:
    - تريد إرسال بيانات استخدام نماذج OpenClaw أو تدفق الرسائل أو مقاييس الجلسات إلى جامع OpenTelemetry
    - تقوم بربط التتبعات أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى تدعم OTLP
    - تحتاج إلى أسماء المقاييس الدقيقة، وأسماء النطاقات، أو أشكال السمات لإنشاء لوحات المعلومات أو التنبيهات
summary: صدِّر تشخيصات OpenClaw إلى أي مجمّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T07:55:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d52e5072fcdb097a3dce36a13d9470cea8c169d2af49998cd727814013c411e
    source_path: gateway/opentelemetry.md
    workflow: 16
---

تصدّر OpenClaw التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يعمل أي مجمّع أو خلفية تقبل OTLP/HTTP
دون تغييرات في الشيفرة. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تعمل المكونات معًا

- **أحداث التشخيصات** هي سجلات منظّمة داخل العملية يصدرها
  Gateway وPlugins المضمّنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والصفوف،
  والتنفيذ.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدّرها كـ
  OpenTelemetry **مقاييس** و**تتبعات** و**سجلات** عبر OTLP/HTTP.
- **استدعاءات المزوّدين** تتلقى ترويسة W3C باسم `traceparent` من سياق span
  الموثوق لاستدعاء النموذج في OpenClaw عندما يقبل نقل المزوّد الترويسات
  المخصّصة. لا يُمرَّر سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عندما تكون واجهة التشخيصات وPlugin مفعّلين معًا،
  لذلك تبقى تكلفة التشغيل داخل العملية قريبة من الصفر افتراضيًا.

## البدء السريع

لعمليات التثبيت المعبّأة، ثبّت Plugin أولًا:

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

| الإشارة     | ما الذي يدخل فيها                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومخططات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتدفق الرسائل، ومسارات الصفوف، وحالة الجلسة، والتنفيذ، وضغط الذاكرة.          |
| **التتبعات**  | Spans لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة الحاضنة، وتنفيذ الأدوات، والتنفيذ، ومعالجة webhook/الرسائل، وتجميع السياق، وحلقات الأدوات. |
| **السجلات**    | سجلات `logging.file` منظّمة تُصدَّر عبر OTLP عند تفعيل `diagnostics.otel.logs`.                                              |

بدّل `traces` و`metrics` و`logs` بشكل مستقل. الثلاثة مفعّلة افتراضيًا
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي بالفعل على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، فتُستخدم كما هي.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات لنقاط النهاية الخاصة بالإشارة تُستخدم عندما يكون مفتاح الإعداد المطابق `diagnostics.otel.*Endpoint` غير معيّن. يتغلب الإعداد الخاص بالإشارة على متغير البيئة الخاص بالإشارة، والذي يتغلب بدوره على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي (لا يُعتد اليوم إلا بـ `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه إلى `gen_ai_latest_experimental` لإصدار أحدث خاصية span تجريبية لـ GenAI (`gen_ai.provider.name`) بدلًا من `gen_ai.system` القديمة. تستخدم مقاييس GenAI دائمًا خصائص دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه إلى `1` عندما يكون تحميل مسبق آخر أو عملية مضيفة قد سجّل بالفعل OpenTelemetry SDK العام. عندها يتخطى Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يوصّل مستمعي التشخيصات ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل Spans معرّفات
محدودة (القناة، المزوّد، النموذج، فئة الخطأ، معرّفات الطلبات المعتمدة على الهاش فقط)
ولا تتضمن أبدًا نص المطالبة، أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو
مفاتيح الجلسات.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C باسم `traceparent`. لا تُنشأ تلك الترويسة
إلا من سياق التتبع التشخيصي المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` الموجودة والمقدمة من المستدعي، لذلك لا يمكن لـ Plugins أو
خيارات المزوّد المخصّصة انتحال أصل التتبع عبر الخدمات.

اضبط `diagnostics.otel.captureContent.*` إلى `true` فقط عندما يكون المجمّع وسياسة
الاحتفاظ لديك معتمدين لنص المطالبة أو الاستجابة أو الأداة أو مطالبة النظام.
كل مفتاح فرعي يعتمد الاشتراك الصريح بشكل مستقل:

- `inputMessages` - محتوى مطالبة المستخدم.
- `outputMessages` - محتوى استجابة النموذج.
- `toolInputs` - حمولات وسيطات الأداة.
- `toolOutputs` - حمولات نتائج الأداة.
- `systemPrompt` - مطالبة النظام/المطوّر المجمّعة.

عند تفعيل أي مفتاح فرعي، تحصل spans النموذج والأداة على خصائص
`openclaw.content.*` محدودة ومنقّحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (لـ root-span فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP إعداد `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجل التشخيص، لا تنسيق وحدة التحكم. ينبغي لعمليات التثبيت عالية الحجم
  تفضيل أخذ العينات/الترشيح في مجمّع OTLP على أخذ العينات محليًا.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL في المستوى الأعلى `traceId`،
  و`spanId`، و`parentSpanId`، و`traceFlags` عندما يحمل استدعاء السجل سياق تتبع
  تشخيصي صالحًا، ما يتيح لمعالجات السجلات وصل أسطر السجل المحلية مع
  spans المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP في Gateway وإطارات WebSocket نطاق تتبع طلب
  داخليًا. ترث السجلات وأحداث التشخيص داخل ذلك النطاق تتبع الطلب افتراضيًا،
  بينما تُنشأ spans تشغيل الوكيل واستدعاء النموذج كأبناء حتى تبقى ترويسات
  `traceparent` الخاصة بالمزوّد على التتبع نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، الخصائص: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عداد، الخصائص: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مخطط تكراري، الخصائص: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مخطط تكراري، الخصائص: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مخطط تكراري، مقياس اتفاقيات GenAI الدلالية، الخصائص: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مخطط تكراري، ثوانٍ، مقياس اتفاقيات GenAI الدلالية، الخصائص: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختياريًا `error.type`)
- `openclaw.model_call.duration_ms` (مخطط تكراري، الخصائص: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`، بالإضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` في الأخطاء المصنّفة)
- `openclaw.model_call.request_bytes` (مخطط تكراري، حجم حمولات طلب النموذج النهائية بالبايت وفق UTF-8؛ دون محتوى الحمولة الخام)
- `openclaw.model_call.response_bytes` (مخطط تكراري، حجم أحداث استجابة النموذج المتدفقة بالبايت وفق UTF-8؛ دون محتوى الاستجابة الخام)
- `openclaw.model_call.time_to_first_byte_ms` (مخطط تكراري، الوقت المنقضي قبل أول حدث استجابة متدفق)

### تدفق الرسائل

- `openclaw.webhook.received` (عداد، الخصائص: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، الخصائص: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مخطط تكراري، الخصائص: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (عداد، الخصائص: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (عداد، الخصائص: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (مخطط تكراري، الخصائص: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، الخصائص: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مخطط تكراري، الخصائص: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### الصفوف والجلسات

- `openclaw.queue.lane.enqueue` (عداد، الخصائص: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، الخصائص: `openclaw.lane`)
- `openclaw.queue.depth` (مخطط تكراري، الخصائص: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مخطط تكراري، الخصائص: `openclaw.lane`)
- `openclaw.session.state` (عداد، الخصائص: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عداد، الخصائص: `openclaw.state`؛ يصدر فقط لمسك سجلات الجلسات القديمة دون عمل نشط)
- `openclaw.session.stuck_age_ms` (مخطط تكراري، الخصائص: `openclaw.state`؛ يصدر فقط لمسك سجلات الجلسات القديمة دون عمل نشط)
- `openclaw.run.attempt` (عداد، الخصائص: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد عمر عدم إحراز تقدم لتشخيصات حيوية الجلسة.
لا تتقدم جلسة `processing` في العمر نحو هذا الحد بينما تلاحظ OpenClaw تقدمًا في الرد
أو الأداة أو الحالة أو الكتلة أو وقت تشغيل ACP.
لا تُحتسب إشارات إبقاء الكتابة حية كتقدم، لذلك لا يزال من الممكن اكتشاف
نموذج أو حاضنة صامتة.

تصنّف OpenClaw الجلسات حسب العمل الذي لا يزال بإمكانها ملاحظته:

- `session.long_running`: عمل مضمن نشط أو استدعاءات نموذج أو استدعاءات أدوات لا تزال
  تحرز تقدمًا.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلّغ عن
  تقدم حديث. تبقى التشغيلات المضمنة المتوقفة في وضع المراقبة فقط أولًا، ثم
  يتم إجهاضها وتصريفها بعد `diagnostics.stuckSessionAbortMs` من دون تقدم كي تتمكن
  الأدوار المصطفة خلف المسار من الاستئناف. عند عدم ضبطها، تكون عتبة الإجهاض افتراضيًا
  هي النافذة الممتدة الأكثر أمانًا، أي 10 دقائق على الأقل و5 أضعاف
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: سجلات جلسة قديمة بلا عمل نشط. يحرر هذا
  مسار الجلسة المتأثرة فورًا.

تصدر الاستعادة أحداث `session.recovery.requested` و
`session.recovery.completed` المهيكلة. لا تُعلَّم حالة جلسة التشخيص كخاملة
إلا بعد نتيجة استعادة معدِّلة (`aborted` أو `released`) وفقط إذا كان
جيل المعالجة نفسه لا يزال هو الحالي.

لا يصدر إلا `session.stuck` عدّاد `openclaw.session.stuck`،
ومخطط `openclaw.session.stuck_age_ms` التكراري، ونطاق `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة ما دامت الجلسة
لم تتغير، لذلك ينبغي أن تنبّه لوحات المعلومات إلى الزيادات المستمرة بدلًا من كل
نبضة Heartbeat. لمفتاح الإعداد والافتراضيات، راجع
[مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics).

### دورة حياة الحاضنة

- `openclaw.harness.duration_ms` (مخطط تكراري، السمات: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` عند الأخطاء)

### التنفيذ

- `openclaw.exec.duration_ms` (مخطط تكراري، السمات: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### الأجزاء الداخلية للتشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مخطط تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مخطط تكراري)
- `openclaw.memory.pressure` (عدّاد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عدّاد، السمات: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مخطط تكراري، السمات: `openclaw.toolName`, `openclaw.outcome`)

## النطاقات المصدّرة

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` و`openclaw.failureKind` اختياريًا عند الأخطاء
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة قائمة على SHA لمعرّف طلب المزوّد العلوي؛ لا تُصدَّر المعرّفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - عند الإكمال: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`, `openclaw.errorCategory`, و`openclaw.harness.cleanup_failed` اختياريًا
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (لا يوجد محتوى للموجه أو السجل أو الاستجابة أو مفتاح الجلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (لا توجد رسائل حلقة أو معلمات أو مخرجات أدوات)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

عند تمكين التقاط المحتوى صراحةً، يمكن أن تتضمن نطاقات النموذج والأداة أيضًا
سمات `openclaw.content.*` محدودة ومنقحة لفئات المحتوى المحددة
التي اشتركت فيها.

## فهرس أحداث التشخيص

تدعم الأحداث أدناه المقاييس والنطاقات أعلاه. يمكن لـ Plugins أيضًا الاشتراك
فيها مباشرةً من دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` - الرموز، والتكلفة، والمدة، والسياق، والمزوّد/النموذج/القناة،
  ومعرّفات الجلسة. `usage` هو احتساب المزوّد/الدور للتكلفة والقياس عن بعد؛
  و`context.used` هو لقطة الموجه/السياق الحالية ويمكن أن يكون أقل من
  `usage.total` لدى المزوّد عند وجود إدخال مخزّن مؤقتًا أو استدعاءات حلقة أدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدّادات مجمّعة: Webhooks/قائمة الانتظار/الجلسة)

**دورة حياة الحاضنة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  دورة حياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId`،
  و`pluginId` اختياريًا، والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الإكمال
  `durationMs`، و`outcome`، و`resultClassification` اختياريًا، و`yieldDetected`،
  وأعداد `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، و`errorCategory`، و
  `cleanupFailed` اختياريًا.

**التنفيذ**

- `exec.process.completed` - نتيجة الطرفية، والمدة، والهدف، والوضع، ورمز الخروج،
  ونوع الفشل. لا يتم تضمين نص الأمر ومجلدات العمل.

## من دون مصدّر

يمكنك إبقاء أحداث التشخيص متاحة لـ Plugins أو للمصارف المخصصة من دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

للحصول على مخرجات تصحيح موجّهة من دون رفع `logging.level`، استخدم أعلام التشخيص.
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

- [التسجيل](/ar/logging) - سجلات الملفات، ومخرجات وحدة التحكم، وتتبع CLI، وتبويب سجلات واجهة التحكم
- [الأجزاء الداخلية لتسجيل Gateway](/ar/gateway/logging) - أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) - أعلام سجلات التصحيح الموجّهة
- [تصدير التشخيصات](/ar/gateway/diagnostics) - أداة حزمة دعم المشغّل (منفصلة عن تصدير OTEL)
- [مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics) - مرجع كامل لحقول `diagnostics.*`
