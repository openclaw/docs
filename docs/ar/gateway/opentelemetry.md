---
read_when:
    - تريد إرسال استخدام نموذج OpenClaw، أو تدفق الرسائل، أو مقاييس الجلسة إلى مُجمِّع OpenTelemetry
    - تقوم بتوصيل آثار التتبع أو المقاييس أو السجلات إلى Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى لـ OTLP
    - تحتاج إلى أسماء المقاييس الدقيقة، أو أسماء المقاطع، أو بُنى السمات لإنشاء لوحات معلومات أو تنبيهات
summary: تصدير تشخيصات OpenClaw إلى أي مُجمِّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-05-02T07:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: be58bb48f06e72b5b08d21bf37c0dcc218be8e4c0030b074523794be01f2611a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

يصدّر OpenClaw التشخيصات عبر Plugin `diagnostics-otel` المضمّن
باستخدام **OTLP/HTTP (protobuf)**. يعمل أي مجمّع أو خلفية تقبل OTLP/HTTP
من دون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تعمل الأجزاء معًا

- **أحداث التشخيص** هي سجلات منظّمة داخل العملية يصدرها
  Gateway وPlugins المضمّنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والطوابير،
  وexec.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدّرها على هيئة
  OpenTelemetry **مقاييس** و**آثار** و**سجلات** عبر OTLP/HTTP.
- **استدعاءات المزوّد** تتلقى رأس W3C `traceparent` من سياق امتداد استدعاء النموذج
  الموثوق الخاص بـ OpenClaw عندما يقبل نقل المزوّد رؤوسًا مخصصة.
  لا يتم تمرير سياق الأثر الصادر عن Plugin.
- لا تُرفق المصدّرات إلا عندما يكون سطح التشخيص وPlugin
  مفعّلين معًا، لذلك تبقى تكلفة التنفيذ داخل العملية قريبة من الصفر افتراضيًا.

## البدء السريع

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

| الإشارة      | ما يدخل فيها                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدّادات ومدرّجات لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتدفق الرسائل، ومسارات الطوابير، وحالة الجلسة، وexec، وضغط الذاكرة.          |
| **الآثار**  | امتدادات لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة harness، وتنفيذ الأدوات، وexec، ومعالجة webhook/الرسائل، وتجميع السياق، وحلقات الأدوات. |
| **السجلات**    | سجلات `logging.file` منظّمة تُصدّر عبر OTLP عند تفعيل `diagnostics.otel.logs`.                                              |

بدّل `traces` و`metrics` و`logs` بشكل مستقل. تكون الثلاثة كلها مفعّلة افتراضيًا
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي مسبقًا على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، تُستخدم كما هي.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح الإعداد المطابق `diagnostics.otel.*Endpoint` مضبوطًا. الإعداد الخاص بالإشارة يتغلب على متغير البيئة الخاص بالإشارة، والذي يتغلب بدوره على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي (يُحترم اليوم `http/protobuf` فقط).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث سمة امتداد تجريبية لـ GenAI (`gen_ai.provider.name`) بدلًا من `gen_ai.system` القديمة. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة التعدد بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجّلت بالفعل OpenTelemetry SDK العام. عندها يتخطى Plugin دورة حياة NodeSDK الخاصة به لكنه يظل يربط مستمعي التشخيص ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل الامتدادات معرّفات
محدودة (القناة، والمزوّد، والنموذج، وفئة الخطأ، ومعرّفات الطلبات المعتمدة على التجزئة فقط)
ولا تتضمن أبدًا نص الموجّه، أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو
مفاتيح الجلسات.

قد تتضمن طلبات النماذج الصادرة رأس W3C `traceparent`. يُنشأ هذا الرأس
فقط من سياق أثر التشخيص المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل رؤوس `traceparent` التي يقدّمها المستدعي مسبقًا، لذلك لا تستطيع Plugins أو
خيارات المزوّد المخصصة انتحال نسب الأثر عبر الخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما تكون سياسة المجمّع
والاحتفاظ لديك معتمدة لنصوص الموجّه، أو الاستجابة، أو الأداة، أو موجّه النظام.
كل مفتاح فرعي يحتاج إلى تفعيل مستقل:

- `inputMessages` — محتوى موجّه المستخدم.
- `outputMessages` — محتوى استجابة النموذج.
- `toolInputs` — حمولات وسائط الأداة.
- `toolOutputs` — حمولات نتائج الأداة.
- `systemPrompt` — موجّه النظام/المطور المجمّع.

عند تفعيل أي مفتاح فرعي، تحصل امتدادات النموذج والأداة على سمات
`openclaw.content.*` محدودة ومنقّحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **الآثار:** `diagnostics.otel.sampleRate` (امتداد الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP قيمة `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجلات التشخيص، وليس تنسيق وحدة التحكم. يجب أن تفضّل
  التثبيتات عالية الحجم أخذ العينات/التصفية في مجمّع OTLP على أخذ العينات محليًا.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL الحقول العليا `traceId`
  و`spanId` و`parentSpanId` و`traceFlags` عندما يحمل استدعاء السجل سياق أثر
  تشخيص صالحًا، ما يتيح لمعالجات السجلات ربط أسطر السجل المحلية بالامتدادات
  المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP الخاصة بـ Gateway وإطارات WebSocket نطاق أثر
  طلب داخليًا. ترث السجلات وأحداث التشخيص داخل ذلك النطاق أثر الطلب
  افتراضيًا، بينما تُنشأ امتدادات تشغيل الوكيل واستدعاء النموذج كأبناء بحيث تبقى
  رؤوس `traceparent` الخاصة بالمزوّد على الأثر نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عدّاد، السمات: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عدّاد، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مدرّج، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مدرّج، السمات: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مدرّج، مقياس اتفاقيات GenAI الدلالية، السمات: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرّج، بالثواني، مقياس اتفاقيات GenAI الدلالية، السمات: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختياريًا `error.type`)
- `openclaw.model_call.duration_ms` (مدرّج، السمات: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, بالإضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنّفة)
- `openclaw.model_call.request_bytes` (مدرّج، حجم حمولة طلب النموذج النهائي بالبايت وفق UTF-8؛ لا يوجد محتوى حمولة خام)
- `openclaw.model_call.response_bytes` (مدرّج، حجم أحداث استجابة النموذج المتدفقة بالبايت وفق UTF-8؛ لا يوجد محتوى استجابة خام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرّج، الوقت المنقضي قبل أول حدث استجابة متدفقة)

### تدفق الرسائل

- `openclaw.webhook.received` (عدّاد، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (عدّاد، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرّج، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (عدّاد، السمات: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (عدّاد، السمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرّج، السمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (عدّاد، السمات: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرّج، السمات: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### الطوابير والجلسات

- `openclaw.queue.lane.enqueue` (عدّاد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عدّاد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرّج، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرّج، السمات: `openclaw.lane`)
- `openclaw.session.state` (عدّاد، السمات: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عدّاد، السمات: `openclaw.state`؛ يصدر فقط لمسك دفاتر الجلسات القديمة بلا عمل نشط)
- `openclaw.session.stuck_age_ms` (مدرّج، السمات: `openclaw.state`؛ يصدر فقط لمسك دفاتر الجلسات القديمة بلا عمل نشط)
- `openclaw.run.attempt` (عدّاد، السمات: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد عمر عدم التقدم لتشخيصات حيوية الجلسة.
لا تتقدم جلسة `processing` في العمر نحو هذا الحد
بينما يلاحظ OpenClaw تقدمًا في الرد، أو الأداة، أو الحالة، أو الكتلة، أو وقت تشغيل ACP.
لا تُحتسب إشارات إبقاء الكتابة كأمر تقدم، لذلك لا يزال من الممكن
اكتشاف نموذج أو harness صامت.

يصنّف OpenClaw الجلسات حسب العمل الذي لا يزال قادرًا على ملاحظته:

- `session.long_running`: عمل مضمّن نشط، أو استدعاءات نموذج، أو استدعاءات أدوات
  ما زالت تحقق تقدمًا.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلّغ عن
  تقدم حديث.
- `session.stuck`: سجلات جلسة قديمة بلا عمل نشط. هذا هو
  تصنيف الحيوية الوحيد الذي يحرر مسار الجلسة المتأثر.

فقط `session.stuck` يصدر عداد `openclaw.session.stuck`،
والمدرج التكراري `openclaw.session.stuck_age_ms`، والنطاق `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة بينما تبقى الجلسة
بلا تغيير، لذلك ينبغي للوحات المعلومات التنبيه عند الزيادات المستمرة بدلًا من كل
نبضة Heartbeat. لمفتاح الإعدادات والقيم الافتراضية، راجع
[مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics).

### دورة حياة الحاضنة

- `openclaw.harness.duration_ms` (مدرج تكراري، السمات: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` عند الأخطاء)

### Exec

- `openclaw.exec.duration_ms` (مدرج تكراري، السمات: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### الأجزاء الداخلية للتشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مدرج تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عداد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، السمات: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، السمات: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.errorCategory` و`openclaw.failureKind` الاختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة قائمة على SHA لمعرّف طلب المزوّد العلوي؛ لا تُصدّر المعرّفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`, `openclaw.errorCategory`, و`openclaw.harness.cleanup_failed` الاختياري
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (لا يوجد محتوى مطالبة أو سجل أو استجابة أو مفتاح جلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (لا توجد رسائل حلقة أو معاملات أو مخرجات أدوات)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

عند تمكين التقاط المحتوى صراحةً، يمكن لنطاقات النموذج والأدوات أيضًا
تضمين سمات `openclaw.content.*` محدودة ومنقحة لفئات
المحتوى المحددة التي اخترت تفعيلها.

## فهرس أحداث التشخيصات

تدعم الأحداث أدناه المقاييس والنطاقات أعلاه. يمكن لـ Plugins أيضًا الاشتراك
فيها مباشرةً من دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` — الرموز، والتكلفة، والمدة، والسياق، والمزوّد/النموذج/القناة،
  ومعرّفات الجلسات. `usage` هو احتساب المزوّد/الدورة للتكلفة والقياس عن بُعد؛
  و`context.used` هو لقطة المطالبة/السياق الحالية ويمكن أن يكون أقل من
  `usage.total` لدى المزوّد عند وجود إدخال مخزّن مؤقتًا أو استدعاءات حلقة أدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**الطابور والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمّعة: webhooks/queue/session)

**دورة حياة الحاضنة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  دورة حياة لكل تشغيل لحاضنة الوكيل. تشمل `harnessId`، و`pluginId` اختياريًا،
  والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الاكتمال
  `durationMs`، و`outcome`، و`resultClassification` الاختياري، و`yieldDetected`،
  وأعداد `itemLifecycle`. وتضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، و`errorCategory`، و
  `cleanupFailed` الاختياري.

**Exec**

- `exec.process.completed` — نتيجة الطرفية، والمدة، والهدف، والوضع، ورمز الخروج،
  ونوع الفشل. لا يتم تضمين نص الأمر ومجلدات العمل.

## بدون مصدّر

يمكنك إبقاء أحداث التشخيصات متاحة لـ Plugins أو المصارف المخصصة من دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

للحصول على مخرجات تصحيح أخطاء موجهة من دون رفع `logging.level`، استخدم أعلام التشخيصات.
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
[أعلام التشخيصات](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضًا ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذات صلة

- [التسجيل](/ar/logging) — سجلات الملفات، ومخرجات وحدة التحكم، وتتبع CLI، وتبويب سجلات واجهة التحكم
- [الأجزاء الداخلية لتسجيل Gateway](/ar/gateway/logging) — أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيصات](/ar/diagnostics/flags) — أعلام سجلات تصحيح أخطاء موجهة
- [تصدير التشخيصات](/ar/gateway/diagnostics) — أداة حزمة دعم المشغّل (منفصلة عن تصدير OTEL)
- [مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics) — المرجع الكامل لحقول `diagnostics.*`
