---
read_when:
    - تريد إرسال استخدام نماذج OpenClaw أو تدفق الرسائل أو مقاييس الجلسات إلى مُجمِّع OpenTelemetry
    - تقوم بربط التتبعات أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى لـ OTLP
    - تحتاج إلى أسماء المقاييس الدقيقة، أو أسماء النطاقات، أو بُنى السمات لإنشاء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى أي مجمّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-05-05T06:17:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b5030b8b16624f114e31838d3a055c24e8a23a6c77d63495a445cb9f2e227b6a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

تُصدّر OpenClaw التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يعمل أي مجمّع أو واجهة خلفية تقبل OTLP/HTTP
دون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تعمل المكونات معًا

- **أحداث التشخيص** هي سجلات منظمة داخل العملية يصدرها
  Gateway والـ plugins المضمّنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والصفوف،
  والتنفيذ.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدرها على هيئة
  **مقاييس**، و**تتبعات**، و**سجلات** OpenTelemetry عبر OTLP/HTTP.
- **استدعاءات المزودين** تتلقى ترويسة W3C `traceparent` من سياق امتداد
  استدعاء النموذج الموثوق الخاص بـ OpenClaw عندما يقبل نقل المزود الترويسات
  المخصصة. لا يتم نشر سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عندما يكون سطح التشخيص والـ Plugin
  مفعّلين، لذلك تبقى تكلفة التشغيل داخل العملية قريبة من الصفر افتراضيًا.

## البدء السريع

للتثبيتات المعبأة، ثبّت الـ Plugin أولًا:

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

يمكنك أيضًا تفعيل الـ Plugin من CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
يدعم `protocol` حاليًا `http/protobuf` فقط. يتم تجاهل `grpc`.
</Note>

## الإشارات المصدّرة

| الإشارة      | ما الذي يتضمنه                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتدفق الرسائل، ومسارات الصفوف، وحالة الجلسة، والتنفيذ، وضغط الذاكرة.          |
| **التتبعات**  | امتدادات لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة الحاضنة، وتنفيذ الأدوات، والتنفيذ، ومعالجة Webhook/الرسائل، وتجميع السياق، وحلقات الأدوات. |
| **السجلات**    | سجلات `logging.file` المنظمة المصدّرة عبر OTLP عند تفعيل `diagnostics.otel.logs`.                                              |

بدّل `traces`، و`metrics`، و`logs` بشكل مستقل. تكون الثلاثة كلها مفعّلة افتراضيًا
عندما تكون `diagnostics.otel.enabled` مضبوطة على true.

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي بالفعل على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، فستُستخدم كما هي.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقاط نهاية خاصة بالإشارة تُستخدم عندما يكون مفتاح الإعداد المطابق `diagnostics.otel.*Endpoint` غير مضبوط. يتغلب إعداد الإشارة المحدد على متغير بيئة الإشارة المحدد، والذي يتغلب بدوره على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي (لا يُعتمد اليوم إلا `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث سمة تجريبية لامتداد GenAI (`gen_ai.provider.name`) بدلًا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجلت OpenTelemetry SDK العام بالفعل. عندها يتخطى الـ Plugin دورة حياة NodeSDK الخاصة به، لكنه لا يزال يربط مستمعي التشخيص ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل الامتدادات
معرّفات محدودة (القناة، المزود، النموذج، فئة الخطأ، معرّفات طلبات بالتجزئة فقط)
ولا تتضمن أبدًا نص الموجه، أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو
مفاتيح الجلسات.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُنشأ هذه الترويسة
فقط من سياق تتبع التشخيص المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` المقدمة من المستدعي، لذلك لا يمكن للـ plugins أو
خيارات المزود المخصصة انتحال أصل تتبع عابر للخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون المجمّع
وسياسة الاحتفاظ لديك معتمدين لنص الموجه أو الاستجابة أو الأداة أو موجه النظام.
كل مفتاح فرعي يتطلب اختيارًا مستقلًا:

- `inputMessages` — محتوى موجه المستخدم.
- `outputMessages` — محتوى استجابة النموذج.
- `toolInputs` — حمولات وسيطات الأدوات.
- `toolOutputs` — حمولات نتائج الأدوات.
- `systemPrompt` — موجه النظام/المطور المجمّع.

عند تفعيل أي مفتاح فرعي، تحصل امتدادات النموذج والأدوات على سمات
`openclaw.content.*` محدودة ومنقحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (امتداد الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP قيمة `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجل التشخيص، وليس تنسيق وحدة التحكم. ينبغي للتثبيتات عالية الحجم
  تفضيل أخذ العينات/التصفية في مجمّع OTLP بدلًا من أخذ العينات محليًا.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL حقولًا علوية `traceId`،
  و`spanId`، و`parentSpanId`، و`traceFlags` عندما يحمل استدعاء السجل سياق تتبع
  تشخيص صالحًا، مما يتيح لمعالجات السجلات ربط أسطر السجل المحلية بالامتدادات
  المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP الخاصة بـ Gateway وإطارات WebSocket نطاق
  تتبع طلب داخليًا. ترث السجلات وأحداث التشخيص داخل ذلك النطاق تتبع الطلب
  افتراضيًا، بينما تُنشأ امتدادات تشغيل الوكيل واستدعاء النموذج كأبناء بحيث
  تبقى ترويسات `traceparent` الخاصة بالمزود على التتبع نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، السمات: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (عداد، السمات: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، السمات: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اتفاقيات دلالية لـ GenAI، السمات: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، ثوانٍ، مقياس اتفاقيات دلالية لـ GenAI، السمات: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، اختياريًا `error.type`)
- `openclaw.model_call.duration_ms` (مدرج تكراري، السمات: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، بالإضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم بايت UTF-8 لحمولة طلب النموذج النهائية؛ بلا محتوى حمولة خام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم بايت UTF-8 لأحداث استجابة النموذج المتدفقة؛ بلا محتوى استجابة خام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الوقت المنقضي قبل أول حدث استجابة متدفق)

### تدفق الرسائل

- `openclaw.webhook.received` (عداد، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.message.queued` (عداد، السمات: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.processed` (عداد، السمات: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، السمات: `openclaw.channel`، `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`)

### الصفوف والجلسات

- `openclaw.queue.lane.enqueue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، السمات: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`؛ يصدر فقط لمسك دفاتر الجلسات القديمة بلا عمل نشط)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يصدر فقط لمسك دفاتر الجلسات القديمة بلا عمل نشط)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد عمر عدم التقدم لتشخيصات حيوية الجلسة.
لا تتقدم جلسة `processing` في العمر باتجاه هذا الحد بينما ترصد OpenClaw تقدمًا
في الرد أو الأداة أو الحالة أو الكتلة أو وقت تشغيل ACP.
لا تُحتسب إشارات استمرار الكتابة كتقدم، لذلك لا يزال من الممكن اكتشاف نموذج أو حاضنة صامتة.

تصنف OpenClaw الجلسات حسب العمل الذي لا يزال بإمكانها رصده:

- `session.long_running`: عمل مضمن نشط، أو استدعاءات نموذج، أو استدعاءات أدوات
  لا تزال تحرز تقدمًا.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلغ عن
  تقدم حديث. تبقى عمليات التشغيل المضمنة المتوقفة للمراقبة فقط في البداية، ثم
  تنتقل إلى إجهاض التصريف بعد `diagnostics.stuckSessionAbortMs` بلا تقدم كي تتمكن
  الأدوار الموضوعة في قائمة الانتظار خلف المسار من الاستئناف. عند عدم الضبط، تكون عتبة الإجهاض افتراضيًا
  نافذة ممتدة أكثر أمانًا لا تقل عن 10 دقائق و5 أضعاف
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: تسجيل حالة جلسة متقادم بلا عمل نشط. يحرر هذا
  مسار الجلسة المتأثر فورًا.

تصدر الاستعادة أحداث `session.recovery.requested` و
`session.recovery.completed` مهيكلة. تُعلّم حالة جلسة التشخيص كخامدة
فقط بعد نتيجة استعادة معدّلة (`aborted` أو `released`) وفقط إذا كان
جيل المعالجة نفسه لا يزال الحالي.

فقط `session.stuck` يصدر عداد `openclaw.session.stuck`،
ومدرج `openclaw.session.stuck_age_ms` التكراري، وامتداد `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة ما دامت الجلسة
بلا تغيير، لذا ينبغي أن تنبه لوحات المعلومات عند الزيادات المستمرة بدلًا من كل
نبضة Heartbeat. للاطلاع على خيار الضبط والافتراضيات، راجع
[مرجع التكوين](/ar/gateway/configuration-reference#diagnostics).

### دورة حياة المسخّر

- `openclaw.harness.duration_ms` (مدرج تكراري، السمات: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` عند الأخطاء)

### التنفيذ

- `openclaw.exec.duration_ms` (مدرج تكراري، السمات: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### داخليات التشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مدرج تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عداد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، السمات: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، السمات: `openclaw.toolName`، `openclaw.outcome`)

## الامتدادات المصدّرة

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث اتفاقيات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث اتفاقيات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و`openclaw.failureKind` الاختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مبنية على SHA لمعرف طلب المزوّد العلوي؛ لا تُصدّر المعرفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.provider`، `openclaw.model`، `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`، `openclaw.harness.yield_detected`، `openclaw.harness.items.started`، `openclaw.harness.items.completed`، `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`، `openclaw.errorCategory`، `openclaw.harness.cleanup_failed` الاختياري
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بلا محتوى مطالبة، أو سجل، أو استجابة، أو مفتاح جلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بلا رسائل حلقة، أو معاملات، أو خرج أداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن لامتدادات النموذج والأداة أيضًا
تضمين سمات `openclaw.content.*` محدودة ومنقحة لفئات
المحتوى المحددة التي اشتركت فيها.

## كتالوج أحداث التشخيص

تدعم الأحداث أدناه المقاييس والامتدادات أعلاه. يمكن للـ Plugins أيضًا الاشتراك
فيها مباشرةً دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` — الرموز، التكلفة، المدة، السياق، المزوّد/النموذج/القناة،
  معرفات الجلسات. `usage` هي محاسبة المزوّد/الدور للتكلفة والقياسات؛
  `context.used` هي لقطة المطالبة/السياق الحالية ويمكن أن تكون أقل من
  `usage.total` لدى المزوّد عند وجود إدخال مخزّن مؤقتًا أو استدعاءات حلقة أدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمعة: Webhooks/قائمة الانتظار/الجلسة)

**دورة حياة المسخّر**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  دورة حياة لكل تشغيل لمسخّر الوكيل. تشمل `harnessId`، و
  `pluginId` الاختياري، والمزوّد/النموذج/القناة، ومعرف التشغيل. يضيف الاكتمال
  `durationMs`، و`outcome`، و`resultClassification` الاختياري، و`yieldDetected`،
  وأعداد `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، و`errorCategory`، و
  `cleanupFailed` الاختياري.

**التنفيذ**

- `exec.process.completed` — النتيجة الطرفية، والمدة، والهدف، والوضع، ورمز الخروج،
  ونوع الفشل. لا يُضمّن نص الأمر ولا أدلة العمل.

## بدون مصدّر

يمكنك إبقاء أحداث التشخيص متاحة للـ Plugins أو المصارف المخصصة دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

لإخراج تصحيح موجه دون رفع `logging.level`، استخدم أعلام التشخيص.
الأعلام غير حساسة لحالة الأحرف وتدعم أحرف البدل (مثل `telegram.*` أو
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

أو كتجاوز env لمرة واحدة:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

ينتقل خرج الأعلام إلى ملف السجل القياسي (`logging.file`) ويظل
منقحًا بواسطة `logging.redactSensitive`. الدليل الكامل:
[أعلام التشخيص](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضًا ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذات صلة

- [التسجيل](/ar/logging) — سجلات الملفات، وخرج وحدة التحكم، وتتبع CLI، وعلامة تبويب السجلات في Control UI
- [داخليات تسجيل Gateway](/ar/gateway/logging) — أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) — أعلام سجلات تصحيح موجهة
- [تصدير التشخيصات](/ar/gateway/diagnostics) — أداة حزمة دعم المشغل (منفصلة عن تصدير OTEL)
- [مرجع التكوين](/ar/gateway/configuration-reference#diagnostics) — مرجع كامل لحقل `diagnostics.*`
