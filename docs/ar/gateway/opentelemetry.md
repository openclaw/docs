---
read_when:
    - تريد إرسال استخدام نموذج OpenClaw أو تدفق الرسائل أو مقاييس الجلسات إلى مُجمِّع OpenTelemetry
    - أنت توصّل التتبعات أو المقاييس أو السجلات إلى Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو خلفية OTLP أخرى
    - تحتاج إلى أسماء المقاييس الدقيقة، أو أسماء النطاقات، أو بُنى السمات لإنشاء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى أي مجمّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-05-06T17:57:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: b09453a4a1592d2698de6340e5f006ef16edfd8e86132285c48865d468d20ab6
    source_path: gateway/opentelemetry.md
    workflow: 16
---

يصدّر OpenClaw التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. أي مجمّع أو خلفية تقبل OTLP/HTTP
تعمل من دون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تترابط الأجزاء

- **أحداث التشخيصات** هي سجلات منظمة داخل العملية يصدرها
  Gateway والـ plugins المضمّنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والصفوف،
  وexec.
- يشترك **Plugin `diagnostics-otel`** في تلك الأحداث ويصدّرها كـ
  **مقاييس** و**تتبعات** و**سجلات** OpenTelemetry عبر OTLP/HTTP.
- تتلقى **استدعاءات المزوّد** ترويسة W3C `traceparent` من سياق مقطع استدعاء النموذج
  الموثوق الخاص بـ OpenClaw عندما يقبل نقل المزوّد ترويسات مخصصة.
  لا يتم نشر سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عند تمكين سطح التشخيصات والـ Plugin معًا،
  لذلك تبقى تكلفة التنفيذ داخل العملية قريبة من الصفر افتراضيًا.

## البدء السريع

في التثبيتات المعبأة، ثبّت الـ Plugin أولًا:

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

يمكنك أيضًا تمكين الـ Plugin من CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
يدعم `protocol` حاليًا `http/protobuf` فقط. يتم تجاهل `grpc`.
</Note>

## الإشارات المصدّرة

| الإشارة     | ما الذي يدخل فيها                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتدفق الرسائل، وأحداث Talk، ومسارات الصفوف، وحالة الجلسة/استردادها، وexec، وضغط الذاكرة. |
| **التتبعات** | مقاطع لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة الحاضنة، وتنفيذ الأدوات، وexec، ومعالجة webhook/الرسائل، وتجميع السياق، وحلقات الأدوات.              |
| **السجلات**  | سجلات `logging.file` منظمة يتم تصديرها عبر OTLP عند تمكين `diagnostics.otel.logs`.                                                           |

بدّل `traces` و`metrics` و`logs` كلًا على حدة. تكون الثلاثة كلها مفعّلة افتراضيًا
عندما تكون `diagnostics.otel.enabled` مساوية لـ true.

## مرجع التكوين

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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات لنقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح التكوين المطابق `diagnostics.otel.*Endpoint` معيّنًا. يتغلب التكوين الخاص بالإشارة على متغير البيئة الخاص بالإشارة، والذي يتغلب بدوره على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي؛ لا يُعتد اليوم إلا بـ `http/protobuf`.                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث سمة تجريبية لمقطع GenAI (`gen_ai.provider.name`) بدلًا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجّلت بالفعل OpenTelemetry SDK العام. عندها يتخطى الـ Plugin دورة حياة NodeSDK الخاصة به، لكنه لا يزال يربط مستمعي التشخيصات ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل المقاطع
معرّفات محدودة (القناة، المزوّد، النموذج، فئة الخطأ، ومعرّفات الطلبات بنمط hash فقط)
ولا تتضمن أبدًا نص الموجّه، أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو
مفاتيح الجلسات.
تصدّر مقاييس Talk فقط بيانات وصفية محدودة للأحداث مثل الوضع، والنقل،
والمزوّد، ونوع الحدث. ولا تتضمن النصوص المنسوخة، أو حمولات الصوت،
أو معرّفات الجلسات، أو معرّفات الأدوار، أو معرّفات المكالمات، أو معرّفات الغرف، أو رموز التسليم.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُنشأ تلك الترويسة
فقط من سياق تتبع التشخيصات المملوك لـ OpenClaw لاستدعاء النموذج النشط.
يتم استبدال ترويسات `traceparent` التي يقدّمها المستدعي مسبقًا، لذلك لا يمكن للـ plugins أو
خيارات المزوّد المخصصة انتحال أصل التتبع عبر الخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون مجمّعك
وسياسة الاحتفاظ لديك معتمدين لنصوص الموجّهات، أو الاستجابات، أو الأدوات، أو موجّه النظام.
كل مفتاح فرعي يتطلب اشتراكًا مستقلًا:

- `inputMessages` - محتوى موجّه المستخدم.
- `outputMessages` - محتوى استجابة النموذج.
- `toolInputs` - حمولات وسيطات الأداة.
- `toolOutputs` - حمولات نتائج الأداة.
- `systemPrompt` - موجّه النظام/المطوّر المجمّع.

عند تمكين أي مفتاح فرعي، تحصل مقاطع النماذج والأدوات على سمات
`openclaw.content.*` محدودة ومنقحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (مقطع الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP قيمة `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجل التشخيصات، وليس تنسيق وحدة التحكم. يجب أن تفضّل
  التثبيتات عالية الحجم أخذ العينات/التصفية في مجمّع OTLP على أخذ العينات المحلي.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL حقولًا علوية `traceId`
  و`spanId` و`parentSpanId` و`traceFlags` عندما يحمل استدعاء السجل
  سياق تتبع تشخيصات صالحًا، ما يتيح لمعالجات السجلات وصل أسطر السجلات المحلية
  بالمقاطع المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP الخاصة بـ Gateway وإطارات WebSocket نطاق تتبع
  طلب داخليًا. ترث السجلات وأحداث التشخيصات داخل ذلك النطاق
  تتبع الطلب افتراضيًا، بينما تُنشأ مقاطع تشغيل الوكيل واستدعاء النموذج
  كأبناء، بحيث تبقى ترويسات `traceparent` الخاصة بالمزوّد على التتبع نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (counter, attrs: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (counter, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histogram, attrs: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (histogram, GenAI semantic-conventions metric, attrs: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (histogram, seconds, GenAI semantic-conventions metric, attrs: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, optional `error.type`)
- `openclaw.model_call.duration_ms` (histogram, attrs: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, plus `openclaw.errorCategory` and `openclaw.failureKind` on classified errors)
- `openclaw.model_call.request_bytes` (histogram, حجم حمولة طلب النموذج النهائي بالبايت وفق UTF-8؛ لا يوجد محتوى حمولة خام)
- `openclaw.model_call.response_bytes` (histogram, حجم أحداث استجابة النموذج المتدفقة بالبايت وفق UTF-8؛ لا يوجد محتوى استجابة خام)
- `openclaw.model_call.time_to_first_byte_ms` (histogram, الوقت المنقضي قبل أول حدث استجابة متدفق)

### تدفق الرسائل

- `openclaw.webhook.received` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (counter, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (counter, attrs: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (counter, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (counter, attrs: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histogram, attrs: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### Talk

- `openclaw.talk.event` (counter, attrs: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (histogram, attrs: same as `openclaw.talk.event`; emitted when a Talk event reports duration)
- `openclaw.talk.audio.bytes` (histogram, attrs: same as `openclaw.talk.event`; emitted for Talk audio frame events that report byte length)

### الصفوف والجلسات

- `openclaw.queue.lane.enqueue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، السمات: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`؛ يصدر فقط لمسك سجلات الجلسات القديمة بلا عمل نشط)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يصدر فقط لمسك سجلات الجلسات القديمة بلا عمل نشط)
- `openclaw.session.recovery.requested` (عداد، السمات: `openclaw.state`، `openclaw.action`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.completed` (عداد، السمات: `openclaw.state`، `openclaw.action`، `openclaw.status`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (مدرج تكراري، السمات: مثل عداد الاسترداد المطابق)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

### بيانات قياس حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد عمر عدم التقدم لتشخيصات حيوية الجلسة. لا تتقدم جلسة `processing` في العمر نحو هذا الحد بينما يرصد OpenClaw تقدم الرد أو الأداة أو الحالة أو الكتلة أو وقت تشغيل ACP. لا تُحتسب إشارات إبقاء الكتابة حية كتقدم، لذلك لا يزال بالإمكان اكتشاف نموذج أو حزمة اختبار صامتة.

يصنف OpenClaw الجلسات حسب العمل الذي لا يزال بإمكانه رصده:

- `session.long_running`: لا يزال العمل المضمن النشط أو استدعاءات النموذج أو استدعاءات الأدوات يحقق تقدما.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلغ عن تقدم حديث. تبقى عمليات التشغيل المضمنة المتوقفة في وضع المراقبة فقط أولا، ثم تنتقل إلى إجهاض وتصريف بعد `diagnostics.stuckSessionAbortMs` بلا تقدم لكي يمكن للأدوار المصطفة خلف المسار أن تستأنف. عند عدم ضبطه، يكون حد الإجهاض افتراضيا هو النافذة الممتدة الأكثر أمانا التي لا تقل عن 10 دقائق و5 أضعاف `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: مسك سجلات جلسة قديمة بلا عمل نشط. يحرر هذا مسار الجلسة المتأثر فورا.

يصدر الاسترداد أحداث `session.recovery.requested` و`session.recovery.completed` مهيكلة. تُعلَّم حالة جلسة التشخيص كخاملة فقط بعد نتيجة استرداد مغيِّرة (`aborted` أو `released`) وفقط إذا كان جيل المعالجة نفسه لا يزال جاريا.

فقط `session.stuck` يصدر عداد `openclaw.session.stuck`، ومدرج `openclaw.session.stuck_age_ms` التكراري، ونطاق `openclaw.session.stuck`. تتراجع تشخيصات `session.stuck` المتكررة بينما تبقى الجلسة بلا تغيير، لذلك ينبغي أن تنبه لوحات المعلومات عند الزيادات المستمرة لا عند كل نبضة Heartbeat. لمعرفة مفتاح الإعدادات والافتراضات، راجع [مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics).

### دورة حياة حزمة الاختبار

- `openclaw.harness.duration_ms` (مدرج تكراري، السمات: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` عند الأخطاء)

### التنفيذ

- `openclaw.exec.duration_ms` (مدرج تكراري، السمات: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### تفاصيل التشخيص الداخلية (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مدرج تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عداد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، السمات: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، السمات: `openclaw.toolName`، `openclaw.outcome`)

## النطاقات المصدرة

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` افتراضيا، أو `gen_ai.provider.name` عند الاشتراك في أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضيا، أو `gen_ai.provider.name` عند الاشتراك في أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و`openclaw.failureKind` الاختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرف طلب الموفر المنبع؛ لا تُصدَّر المعرفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.provider`، `openclaw.model`، `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`، `openclaw.harness.yield_detected`، `openclaw.harness.items.started`، `openclaw.harness.items.completed`، `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`، `openclaw.errorCategory`، و`openclaw.harness.cleanup_failed` الاختياري
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (بلا محتوى الموجه أو السجل أو الاستجابة أو مفتاح الجلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (بلا رسائل الحلقة أو المعاملات أو مخرجات الأداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

عند تمكين التقاط المحتوى صراحة، يمكن أن تتضمن نطاقات النموذج والأداة أيضا سمات `openclaw.content.*` محدودة ومنقحة لفئات المحتوى المحددة التي اشتركت فيها.

## فهرس أحداث التشخيص

تدعم الأحداث أدناه المقاييس والنطاقات أعلاه. يمكن أن تشترك Plugins فيها مباشرة أيضا بلا تصدير OTLP.

**استخدام النموذج**

- `model.usage` - الرموز، التكلفة، المدة، السياق، الموفر/النموذج/القناة، معرفات الجلسات. `usage` هو احتساب الموفر/الدور للتكلفة وبيانات القياس؛ `context.used` هي لقطة الموجه/السياق الحالية وقد تكون أقل من `usage.total` لدى الموفر عند وجود إدخال مخزن مؤقتا أو استدعاءات حلقة أدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**الطابور والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمعة: Webhook/الطابور/الجلسة)

**دورة حياة حزمة الاختبار**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` - دورة حياة لكل تشغيل لحزمة اختبار الوكيل. تتضمن `harnessId`، و`pluginId` الاختياري، والموفر/النموذج/القناة، ومعرف التشغيل. يضيف الاكتمال `durationMs`، و`outcome`، و`resultClassification` الاختياري، و`yieldDetected`، وأعداد `itemLifecycle`. تضيف الأخطاء `phase` (`prepare`/`start`/`send`/`resolve`/`cleanup`)، و`errorCategory`، و`cleanupFailed` الاختياري.

**التنفيذ**

- `exec.process.completed` - نتيجة الطرفية، والمدة، والهدف، والوضع، ورمز الخروج، ونوع الفشل. لا يتم تضمين نص الأمر ومجلدات العمل.

## بلا مُصدِّر

يمكنك إبقاء أحداث التشخيص متاحة لـ Plugins أو المصارف المخصصة بلا تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

للمخرجات الموجهة الخاصة بتصحيح الأخطاء بلا رفع `logging.level`، استخدم أعلام التشخيص. الأعلام غير حساسة لحالة الأحرف وتدعم أحرف البدل (مثل `telegram.*` أو `*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

أو كتجاوز بيئة لمرة واحدة:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

تذهب مخرجات الأعلام إلى ملف السجل القياسي (`logging.file`) وتظل منقحة بواسطة `logging.redactSensitive`. الدليل الكامل:
[أعلام التشخيص](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضا ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل `openclaw plugins disable diagnostics-otel`.

## ذات صلة

- [التسجيل](/ar/logging) - سجلات الملفات، ومخرجات وحدة التحكم، وتتبع CLI، وتبويب سجلات واجهة تحكم Control UI
- [تفاصيل تسجيل Gateway الداخلية](/ar/gateway/logging) - أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) - أعلام سجل تصحيح الأخطاء الموجهة
- [تصدير التشخيص](/ar/gateway/diagnostics) - أداة حزمة دعم المشغل (منفصلة عن تصدير OTEL)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics) - مرجع كامل لحقول `diagnostics.*`
