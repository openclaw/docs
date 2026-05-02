---
read_when:
    - تريد إرسال استخدام نماذج OpenClaw أو تدفق الرسائل أو مقاييس الجلسات إلى جامع OpenTelemetry
    - أنت تربط التتبعات أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى لـ OTLP
    - تحتاج إلى أسماء المقاييس الدقيقة، أو أسماء المقاطع، أو بُنى السمات لإنشاء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى أي مُجمّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T20:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3287540a32b9b8400f227ab9400073e8145af89e5246e6af06945a96b751826f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw يصدّر التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يعمل أي جامع أو خلفية تقبل OTLP/HTTP
من دون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تترابط المكونات

- **أحداث التشخيصات** هي سجلات منظمة داخل العملية يصدرها
  Gateway والـ plugins المضمنة لتشغيلات النموذج، وتدفق الرسائل، والجلسات، والطوابير،
  والتنفيذ.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدرها كـ
  OpenTelemetry **مقاييس**، و**تتبعات**، و**سجلات** عبر OTLP/HTTP.
- **استدعاءات المزوّد** تتلقى ترويسة W3C `traceparent` من OpenClaw
  من سياق مدى استدعاء النموذج الموثوق عندما يقبل نقل المزوّد الترويسات
  المخصصة. لا يتم نشر سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عند تفعيل سطح التشخيصات والـ Plugin معاً،
  لذلك تبقى الكلفة داخل العملية قريبة من الصفر افتراضياً.

## البدء السريع

للتثبيتات المعبأة، ثبّت الـ Plugin أولاً:

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

يمكنك أيضاً تفعيل الـ Plugin من CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
يدعم `protocol` حالياً `http/protobuf` فقط. يتم تجاهل `grpc`.
</Note>

## الإشارات المصدّرة

| الإشارة      | ما الذي يدخل فيها                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والكلفة، ومدة التشغيل، وتدفق الرسائل، ومسارات الطوابير، وحالة الجلسة، والتنفيذ، وضغط الذاكرة.          |
| **التتبعات**  | أمداء لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة الحزام، وتنفيذ الأدوات، والتنفيذ، ومعالجة webhook/الرسائل، وتجميع السياق، وحلقات الأدوات. |
| **السجلات**    | سجلات `logging.file` منظمة تُصدّر عبر OTLP عند تفعيل `diagnostics.otel.logs`.                                              |

بدّل `traces` و`metrics` و`logs` بشكل مستقل. تكون الثلاثة كلها مفعلة افتراضياً
عندما تكون `diagnostics.otel.enabled` تساوي true.

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي مسبقاً على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، فتُستخدم كما هي.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح إعدادات `diagnostics.otel.*Endpoint` المطابق مضبوطاً. تفوز الإعدادات الخاصة بالإشارة على متغير البيئة الخاص بالإشارة، والذي يفوز على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي (لا يُحترم اليوم إلا `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث سمة مدى تجريبية لـ GenAI (`gen_ai.provider.name`) بدلاً من `gen_ai.system` القديمة. تستخدم مقاييس GenAI دائماً سمات دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجلت OpenTelemetry SDK العام بالفعل. عندها يتخطى الـ Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يوصل مستمعي التشخيصات ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضياً**. تحمل الأمداء
معرّفات محدودة (القناة، المزوّد، النموذج، فئة الخطأ، معرّفات الطلبات كتجزئة فقط)
ولا تتضمن أبداً نص الموجه، أو نص الاستجابة، أو مدخلات الأداة، أو مخرجات الأداة، أو
مفاتيح الجلسة.

قد تتضمن طلبات النموذج الصادرة ترويسة W3C `traceparent`. يتم إنشاء تلك الترويسة
فقط من سياق تتبع تشخيصي مملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` الموجودة والمقدمة من المستدعي، لذلك لا يمكن للـ plugins أو
خيارات المزوّد المخصصة انتحال أصل تتبع عابر للخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون جامعك
وسياسة الاحتفاظ لديك معتمدين لنصوص الموجهات، أو الاستجابات، أو الأدوات، أو موجهات النظام.
كل مفتاح فرعي اختياري بشكل مستقل:

- `inputMessages` — محتوى موجه المستخدم.
- `outputMessages` — محتوى استجابة النموذج.
- `toolInputs` — حمولات وسائط الأداة.
- `toolOutputs` — حمولات نتائج الأداة.
- `systemPrompt` — موجه النظام/المطور المجمّع.

عند تفعيل أي مفتاح فرعي، تحصل أمداء النموذج والأداة على سمات
`openclaw.content.*` محدودة ومنقحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (مدى الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجل التشخيصات، وليس تنسيق وحدة التحكم. يجب أن تفضل
  التثبيتات عالية الحجم أخذ العينات/الترشيح في جامع OTLP بدلاً من أخذ العينات المحلي.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL حقول `traceId` و
  `spanId` و`parentSpanId` و`traceFlags` على المستوى الأعلى عندما يحمل استدعاء السجل
  سياق تتبع تشخيصياً صالحاً، ما يتيح لمعالجات السجلات ربط أسطر السجل المحلية
  بالأمداء المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP في Gateway وإطارات WebSocket
  نطاق تتبع طلب داخلياً. ترث السجلات والأحداث التشخيصية داخل ذلك النطاق
  تتبع الطلب افتراضياً، بينما تُنشأ أمداء تشغيل الوكيل واستدعاء النموذج
  كأبناء بحيث تبقى ترويسات `traceparent` الخاصة بالمزوّد على التتبع نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، السمات: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عداد، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، السمات: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اصطلاحات دلالية لـ GenAI، السمات: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، بالثواني، مقياس اصطلاحات دلالية لـ GenAI، السمات: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختياري `error.type`)
- `openclaw.model_call.duration_ms` (مدرج تكراري، السمات: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`، بالإضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم حمولة طلب النموذج النهائي بالبايتات UTF-8؛ بلا محتوى حمولة خام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم أحداث استجابة النموذج المتدفقة بالبايتات UTF-8؛ بلا محتوى استجابة خام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الوقت المنقضي قبل أول حدث استجابة متدفق)

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
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`؛ يُصدر فقط لمسك دفاتر الجلسات المتقادمة من دون عمل نشط)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يُصدر فقط لمسك دفاتر الجلسات المتقادمة من دون عمل نشط)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد العمر بلا تقدم لتشخيصات حيوية الجلسة.
لا تتقدم جلسة `processing` نحو هذا الحد بينما يلاحظ OpenClaw تقدماً في الرد أو الأداة أو الحالة أو الكتلة أو وقت تشغيل ACP.
لا تُحتسب إشارات إبقاء الكتابة نشطة كتقدم، لذلك يمكن مع ذلك اكتشاف نموذج أو حزام صامت.

يصنف OpenClaw الجلسات حسب العمل الذي لا يزال بإمكانه ملاحظته:

- `session.long_running`: عمل مضمن نشط، أو استدعاءات نموذج، أو استدعاءات أدوات ما زالت
  تحرز تقدماً.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلّغ عن
  تقدم حديث.
- `session.stuck`: سجلات جلسة متقادمة بلا عمل نشط. هذا هو
  تصنيف الحيوية الوحيد الذي يحرر مسار الجلسة المتأثر.

يبث `session.stuck` فقط عداد `openclaw.session.stuck`، والمدرج التكراري
`openclaw.session.stuck_age_ms`، والنطاق `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة بينما تبقى الجلسة
بلا تغيير، لذلك ينبغي أن تطلق لوحات المعلومات تنبيهاً عند الزيادات المستمرة بدلاً من كل
نبضة Heartbeat. لمعرفة مفتاح الإعداد والقيم الافتراضية، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics).

### دورة حياة الحاضنة

- `openclaw.harness.duration_ms` (مدرج تكراري، سمات: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` عند الأخطاء)

### Exec

- `openclaw.exec.duration_ms` (مدرج تكراري، سمات: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### الأجزاء الداخلية للتشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مدرج تكراري، سمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عداد، سمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، سمات: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، سمات: `openclaw.toolName`، `openclaw.outcome`)

## النطاقات المصدّرة

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (الإدخال/الإخراج/قراءة التخزين المؤقت/كتابة التخزين المؤقت/الإجمالي)
  - `gen_ai.system` افتراضياً، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضياً، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و`openclaw.failureKind` الاختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرّف طلب المزوّد العلوي؛ لا تُصدّر المعرّفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.provider`، `openclaw.model`، `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`، `openclaw.harness.yield_detected`، `openclaw.harness.items.started`، `openclaw.harness.items.completed`، `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`، `openclaw.errorCategory`، `openclaw.harness.cleanup_failed` الاختياري
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بلا محتوى موجه أو سجل أو استجابة أو مفتاح جلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بلا رسائل حلقة أو معاملات أو مخرجات أدوات)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن أن تتضمن نطاقات النموذج والأدوات أيضاً
سمات `openclaw.content.*` محدودة ومنقحة لفئات المحتوى المحددة
التي اخترت تفعيلها.

## كتالوج أحداث التشخيص

تدعم الأحداث أدناه المقاييس والنطاقات أعلاه. يمكن لـ Plugins أيضاً الاشتراك
فيها مباشرةً من دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` — الرموز، التكلفة، المدة، السياق، المزوّد/النموذج/القناة،
  معرّفات الجلسات. `usage` هي محاسبة المزوّد/الدورة للتكلفة والقياس عن بُعد؛
  و`context.used` هي لقطة الموجه/السياق الحالية ويمكن أن تكون أقل من
  `usage.total` لدى المزوّد عند وجود إدخال مخزّن مؤقتاً أو استدعاءات حلقة أدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمّعة: Webhook/قائمة الانتظار/الجلسة)

**دورة حياة الحاضنة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  دورة حياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId` و`pluginId` الاختياري
  والمزوّد/النموذج/القناة ومعرّف التشغيل. يضيف الاكتمال
  `durationMs` و`outcome` و`resultClassification` الاختياري و`yieldDetected`
  وأعداد `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`) و`errorCategory` و
  `cleanupFailed` الاختياري.

**Exec**

- `exec.process.completed` — النتيجة الطرفية، والمدة، والهدف، والوضع، ورمز الخروج،
  ونوع الفشل. لا يتم تضمين نص الأمر ومجلدات العمل.

## من دون مصدّر

يمكنك إبقاء أحداث التشخيص متاحة لـ Plugins أو منافذ مخصصة من دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

لإخراج تصحيح أخطاء موجّه من دون رفع `logging.level`، استخدم أعلام التشخيص.
الأعلام غير حساسة لحالة الأحرف وتدعم أحرف البدل (مثل `telegram.*` أو
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

أو كتجاوز بيئة لمرة واحدة:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

ينتقل إخراج العلم إلى ملف السجل القياسي (`logging.file`) ويظل
منقحاً بواسطة `logging.redactSensitive`. الدليل الكامل:
[أعلام التشخيص](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضاً ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذات صلة

- [التسجيل](/ar/logging) — سجلات الملفات، وإخراج وحدة التحكم، والمتابعة عبر CLI، وتبويب سجلات واجهة التحكم
- [الأجزاء الداخلية لتسجيل Gateway](/ar/gateway/logging) — أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) — أعلام سجلات تصحيح الأخطاء الموجهة
- [تصدير التشخيصات](/ar/gateway/diagnostics) — أداة حزمة دعم المشغّل (منفصلة عن تصدير OTEL)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics) — مرجع كامل لحقول `diagnostics.*`
