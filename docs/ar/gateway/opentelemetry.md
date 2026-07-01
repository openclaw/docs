---
read_when:
    - تريد إرسال استخدام نماذج OpenClaw أو تدفق الرسائل أو مقاييس الجلسات إلى جامع OpenTelemetry
    - أنت توصل التتبعات أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى تدعم OTLP
    - تحتاج إلى أسماء المقاييس الدقيقة، أو أسماء الامتدادات، أو بُنى السمات لإنشاء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى مجمّعات OpenTelemetry أو stdout JSONL عبر Plugin diagnostics-otel
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-07-01T05:44:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2e23876db9446a97545f01436326d08aadf222ec41a326749fd084779a7259f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw يصدّر التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يمكن أيضًا كتابة السجلات كـ stdout JSONL من أجل
مسارات سجلات الحاويات والبيئات المعزولة. أي جامع أو خلفية تقبل
OTLP/HTTP تعمل دون تغييرات في الكود. لمعرفة سجلات الملفات المحلية وكيفية قراءتها،
راجع [التسجيل](/ar/logging).

## كيف تعمل المكونات معًا

- **أحداث التشخيص** هي سجلات منظّمة داخل العملية يصدرها
  Gateway والـ plugins المضمّنة لعمليات تشغيل النماذج، وتدفق الرسائل، والجلسات، والطوابير،
  وexec.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدّرها على شكل
  OpenTelemetry **مقاييس** و**تتبعات** و**سجلات** عبر OTLP/HTTP. ويمكنه
  أيضًا عكس سجلات التشخيص إلى stdout JSONL.
- **استدعاءات المزوّد** تتلقى ترويسة W3C `traceparent` من سياق امتداد
  استدعاء النموذج الموثوق المملوك لـ OpenClaw عندما يقبل نقل المزوّد ترويسات مخصصة.
  لا يتم تمرير سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عند تفعيل كل من سطح التشخيص والـ Plugin،
  لذلك تبقى كلفة التنفيذ داخل العملية قريبة من الصفر افتراضيًا.

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

| الإشارة      | ما الذي يدخل فيها                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدّادات ومخططات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتجاوز الفشل، واستخدام Skills، وتدفق الرسائل، وأحداث Talk، ومسارات الطوابير، وحالة/استرداد الجلسات، وتنفيذ الأدوات، والحمولات كبيرة الحجم، وexec، وضغط الذاكرة. |
| **التتبعات**  | امتدادات لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة الحاضنة، واستخدام Skills، وتنفيذ الأدوات، وexec، ومعالجة webhook/الرسائل، وتجميع السياق، وحلقات الأدوات.                                                            |
| **السجلات**    | سجلات `logging.file` منظّمة تُصدّر عبر OTLP أو stdout JSONL عندما يكون `diagnostics.otel.logs` مفعّلًا؛ تُحجب أجسام السجلات ما لم يتم تفعيل التقاط المحتوى صراحةً.                                |

فعّل `traces` و`metrics` و`logs` بشكل مستقل. تكون التتبعات والمقاييس
مفعّلة افتراضيًا عندما يكون `diagnostics.otel.enabled` true. تكون السجلات متوقفة افتراضيًا
ولا تُصدّر إلا عندما تكون `diagnostics.otel.logs` صراحةً `true`. يصدّر السجل
إلى OTLP افتراضيًا؛ اضبط `diagnostics.otel.logsExporter` على `stdout` للحصول على JSONL على
stdout، أو `both` لإرسال كل سجل تشخيص إلى OTLP وstdout.

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

### متغيرات البيئة

| المتغير                                                                                                          | الغرض                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي بالفعل على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، فتُستخدم كما هي.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقطة النهاية الخاصة بالإشارة المستخدمة عندما لا يكون مفتاح إعدادات `diagnostics.otel.*Endpoint` المطابق مضبوطًا. تتقدم الإعدادات الخاصة بالإشارة على متغير البيئة الخاص بالإشارة، والذي يتقدم على نقطة النهاية المشتركة.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول السلك (يُحترم حاليًا `http/protobuf` فقط).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث شكل تجريبي لامتداد استدلال GenAI، بما في ذلك أسماء الامتدادات `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع الامتداد `CLIENT`، و`gen_ai.provider.name` بدلًا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة التعدد بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجلت بالفعل OpenTelemetry SDK العام. عندها يتجاوز الـ Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يوصّل مستمعي التشخيص ويحترم `traces`/`metrics`/`logs`.                                                                                                                    |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل الامتدادات
معرّفات محدودة (القناة، والمزوّد، والنموذج، وفئة الخطأ، ومعرّفات الطلب المعتمدة على التجزئة فقط،
ومصدر الأداة، ومالك الأداة، واسم/مصدر Skill) ولا تتضمن أبدًا نص الموجّه،
أو نص الاستجابة، أو مدخلات الأداة، أو مخرجات الأداة، أو مسارات ملفات Skill، أو مفاتيح الجلسات.
تحافظ سجلات OTLP افتراضيًا على الشدة، والمسجّل، وموقع الكود، وسياق التتبع الموثوق،
والسمات المنقّاة، لكن جسم رسالة السجل الخام لا يُصدّر
إلا عندما يتم ضبط `diagnostics.otel.captureContent` على القيمة المنطقية `true`. المفاتيح الفرعية التفصيلية
`captureContent.*` لا تفعّل أجسام السجلات. تُستبدل التسميات التي تبدو مثل
مفاتيح جلسات وكيل محددة النطاق بـ `unknown`.
تصدّر مقاييس Talk بيانات تعريف أحداث محدودة فقط مثل الوضع، والنقل،
والمزوّد، ونوع الحدث. ولا تتضمن النصوص، أو حمولات الصوت،
أو معرّفات الجلسات، أو معرّفات الدور، أو معرّفات المكالمات، أو معرّفات الغرف، أو رموز التسليم.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُنشأ هذه الترويسة
فقط من سياق تتبع التشخيص المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` الموجودة والمقدمة من المستدعي، لذلك لا يمكن للـ plugins أو
خيارات المزوّد المخصصة تزوير أصل التتبع عبر الخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون جامعك
وسياسة الاحتفاظ لديك معتمدين لنص الموجّه أو الاستجابة أو الأداة أو موجّه النظام.
كل مفتاح فرعي اختياري بشكل مستقل:

- `inputMessages` - محتوى موجّه المستخدم.
- `outputMessages` - محتوى استجابة النموذج.
- `toolInputs` - حمولات وسيطات الأداة.
- `toolOutputs` - حمولات نتائج الأداة.
- `systemPrompt` - موجّه النظام/المطور المجمّع.
- `toolDefinitions` - أسماء أدوات النموذج وأوصافها ومخططاتها.

عند تفعيل أي مفتاح فرعي، تحصل امتدادات النموذج والأداة على سمات
`openclaw.content.*` محدودة ومنقّحة لتلك الفئة فقط. استخدم القيمة المنطقية
`captureContent: true` فقط لالتقاطات التشخيص الواسعة التي تكون فيها أجسام رسائل سجلات OTLP
معتمدة أيضًا للتصدير.

يتم التقاط محتوى `toolInputs`/`toolOutputs` لعمليات تنفيذ أدوات وقت تشغيل الوكيل المدمج
(`openclaw.content.tool_input` على امتدادات الاكتمال/الخطأ،
و`openclaw.content.tool_output` على امتدادات الاكتمال). تصدر استدعاءات أدوات الحاضنات الخارجية
(Codex, Claude CLI) امتدادات `tool.execution.*` دون حمولات محتوى.
ينتقل المحتوى الملتقط عبر قناة موثوقة ومخصصة للمستمعين فقط، ولا يوضع أبدًا
على ناقل أحداث التشخيص العام.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (نطاق الجذر فقط، `0.0` يُسقط الكل،
  و`1.0` يُبقي الكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP إعداد `logging.level` (مستوى سجل الملف). وهي تستخدم
  مسار تنقيح سجلات التشخيص، لا تنسيق وحدة التحكم. ينبغي للتثبيتات عالية الحجم
  تفضيل أخذ العينات/الترشيح عبر جامع OTLP بدلا من أخذ العينات المحلي.
  عيّن `diagnostics.otel.logsExporter: "stdout"` عندما يكون نظامك الأساسي يرسل
  stdout/stderr بالفعل إلى معالج سجلات ولا يوجد لديك جامع سجلات OTLP.
  سجلات stdout هي كائن JSON واحد لكل سطر يحتوي على `ts` و`signal`
  و`service.name` والخطورة والنص والسمات المنقحة وحقول التتبع الموثوقة
  عند توفرها.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL حقول `traceId` و`spanId`
  و`parentSpanId` و`traceFlags` في المستوى الأعلى عندما تحمل استدعاءة السجل
  سياق تتبع تشخيصيا صالحا، ما يتيح لمعالجات السجلات ربط أسطر السجل المحلية
  بالنطاقات المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP في Gateway وإطارات WebSocket نطاق تتبع طلب
  داخليا. ترث السجلات وأحداث التشخيص داخل ذلك النطاق تتبع الطلب افتراضيا، بينما
  تُنشأ نطاقات تشغيل الوكيل واستدعاء النموذج كأبناء كي تبقى ترويسات `traceparent`
  الخاصة بالمزوّد على التتبع نفسه.
- **ربط استدعاءات النموذج:** تتضمن نطاقات `openclaw.model.call` أحجام مكوّنات
  المطالبة الآمنة افتراضيا، وتتضمن سمات الرموز لكل استدعاء عندما تعرض نتيجة
  المزوّد بيانات الاستخدام. يظل `openclaw.model.usage` نطاق المحاسبة على مستوى
  التشغيل للتكلفة والسياق ولوحات معلومات القنوات المجمّعة؛ ويبقى على تتبع التشخيص
  نفسه عندما يمتلك وقت التشغيل المصدِر سياق تتبع موثوقا.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، السمات: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عداد، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، السمات: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، بالثواني، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختياري `error.type`)
- `openclaw.model_call.duration_ms` (مدرج تكراري، السمات: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`، بالإضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم حمولة طلب النموذج النهائية بالبايت وفق UTF-8؛ من دون محتوى الحمولة الخام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم حمولات أجزاء الاستجابة المتدفقة بالبايت وفق UTF-8؛ لا تُحسب دلتا النصوص والتفكير واستدعاءات الأدوات عالية التكرار إلا كبايتات `delta` تزايدية؛ من دون محتوى الاستجابة الخام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الوقت المنقضي قبل أول حدث استجابة متدفقة)
- `openclaw.model.failover` (عداد، السمات: `openclaw.provider`, `openclaw.model`, `openclaw.failover.to_provider`, `openclaw.failover.to_model`, `openclaw.failover.reason`, `openclaw.failover.suspended`, `openclaw.lane`)
- `openclaw.skill.used` (عداد، السمات: `openclaw.skill.name`, `openclaw.skill.source`, `openclaw.skill.activation`, اختياري `openclaw.agent`, اختياري `openclaw.toolName`)

### تدفق الرسائل

- `openclaw.webhook.received` (عداد، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (عداد، السمات: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.received` (عداد، السمات: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.started` (عداد، السمات: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.dispatch.completed` (عداد، السمات: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.outcome`, `openclaw.reason`, `openclaw.source`)
- `openclaw.message.processed` (عداد، السمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، السمات: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### المحادثة

- `openclaw.talk.event` (عداد، السمات: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (مدرج تكراري، السمات: مثل `openclaw.talk.event`؛ يُصدَر عندما يبلّغ حدث المحادثة عن مدة)
- `openclaw.talk.audio.bytes` (مدرج تكراري، السمات: مثل `openclaw.talk.event`؛ يُصدَر لأحداث إطارات صوت المحادثة التي تبلّغ عن طول بالبايت)

### قوائم الانتظار والجلسات

- `openclaw.queue.lane.enqueue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، السمات: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`؛ يُصدَر لمحاسبة الجلسات القديمة القابلة للاسترداد)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يُصدَر لمحاسبة الجلسات القديمة القابلة للاسترداد)
- `openclaw.session.turn.created` (عداد، السمات: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (عداد، السمات: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (عداد، السمات: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (مدرج تكراري، السمات: مثل عداد الاسترداد المطابق)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد عمر عدم التقدم لتشخيصات حيوية الجلسة.
لا تتقادم جلسة `processing` نحو هذا الحد بينما يرصد OpenClaw تقدما في الرد
أو الأداة أو الحالة أو الكتلة أو وقت تشغيل ACP. لا تُحسب إشارات إبقاء الكتابة
حية كتقدم، لذلك لا يزال من الممكن اكتشاف نموذج أو حزمة تشغيل صامتة.

يصنّف OpenClaw الجلسات حسب العمل الذي لا يزال قادرا على رصده:

- `session.long_running`: لا يزال العمل المضمّن النشط أو استدعاءات النموذج أو
  استدعاءات الأدوات يحرز تقدما. استدعاءات النموذج المملوكة التي تبقى صامتة بعد
  `diagnostics.stuckSessionWarnMs` تُبلّغ أيضا كطويلة التشغيل قبل
  `diagnostics.stuckSessionAbortMs` كي لا تبدو مزوّدات النماذج البطيئة أو غير
  المتدفقة كجلسات Gateway متوقفة ما دامت قابلة للرصد عند الإجهاض.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلّغ عن تقدم حديث.
  تنتقل استدعاءات النموذج المملوكة من `session.long_running` إلى
  `session.stalled` عند `diagnostics.stuckSessionAbortMs` أو بعده؛ ولا يُعامل
  نشاط النموذج/الأداة القديم غير المملوك كعمل طويل التشغيل غير ضار.
  تبقى عمليات التشغيل المضمّنة المتوقفة للمتابعة فقط في البداية، ثم تُجهض وتُصرّف
  بعد `diagnostics.stuckSessionAbortMs` من دون تقدم حتى تتمكن الأدوار المصطفة
  خلف المسار من الاستئناف. عند عدم الضبط، يكون حد الإجهاض افتراضيا النافذة
  الممتدة الأكثر أمانا، وهي 5 دقائق على الأقل و3 أضعاف
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: محاسبة جلسة قديمة من دون عمل نشط، أو جلسة خاملة في قائمة
  الانتظار مع نشاط نموذج/أداة قديم غير مملوك. يؤدي ذلك إلى تحرير مسار الجلسة
  المتأثر فورا بعد اجتياز بوابات الاسترداد.

يصدر الاسترداد أحداث `session.recovery.requested` و
`session.recovery.completed` منظمة. تُعلَّم حالة الجلسة التشخيصية كخاملة فقط بعد
نتيجة استرداد معدِّلة (`aborted` أو `released`) وفقط إذا كان جيل المعالجة نفسه
لا يزال حاليا.

فقط `session.stuck` يصدر عداد `openclaw.session.stuck` ومدرج
`openclaw.session.stuck_age_ms` التكراري ونطاق `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة بينما تبقى الجلسة دون تغيير، لذلك ينبغي
للوحات المعلومات التنبيه على الزيادات المستمرة بدلا من كل نبضة Heartbeat. لمعرفة
مقبض الإعداد والافتراضات، راجع
[مرجع التكوين](/ar/gateway/configuration-reference#diagnostics).

تصدر تحذيرات الحيوية أيضا:

- `openclaw.liveness.warning` (عداد، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (مدرج تكراري، السمات: `openclaw.liveness.reason`)

### دورة حياة حزمة التشغيل

- `openclaw.harness.duration_ms` (مدرج تكراري، السمات: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` عند الأخطاء)

### تنفيذ الأدوات

- `openclaw.tool.execution.duration_ms` (مدرج تكراري، السمات: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`، بالإضافة إلى `openclaw.errorCategory` عند الأخطاء)
- `openclaw.tool.execution.blocked` (عداد، السمات: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### Exec

- `openclaw.exec.duration_ms` (مدرج تكراري، السمات: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### داخليات التشخيص (الذاكرة وحلقة الأدوات)

- `openclaw.payload.large` (عداد، السمات: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (مدرج تكراري، السمات: مثل `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (مدرج تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عداد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، السمات: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، السمات: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.errorCategory` و`openclaw.failureKind` الاختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (أحجام المكوّنات الآمنة فقط، بدون نص الموجه)
  - `openclaw.model_call.usage.*` و`gen_ai.usage.*` عندما تحمل نتيجة استدعاء النموذج استخدام المزوّد لذلك الاستدعاء الفردي
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرّف طلب المزوّد المصدر؛ لا تُصدَّر المعرّفات الأولية)
  - مع `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، تستخدم امتدادات استدعاء النموذج أحدث اسم امتداد استدلال GenAI وهو `{gen_ai.operation.name} {gen_ai.request.model}` ونوع الامتداد `CLIENT` بدلًا من `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - عند الإكمال: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` الاختياري
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بدون محتوى الموجه أو السجل أو الاستجابة أو مفتاح الجلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بدون رسائل الحلقة أو المعاملات أو مخرجات الأداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

عند تمكين التقاط المحتوى صراحةً، يمكن أن تتضمن امتدادات النموذج والأدوات أيضًا
سمات `openclaw.content.*` محدودة ومنقّحة لفئات المحتوى المحددة
التي اشتركت فيها.

## كتالوج أحداث التشخيص

تدعم الأحداث أدناه المقاييس والامتدادات أعلاه. يمكن للـ Plugins أيضًا الاشتراك
فيها مباشرةً دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` - الرموز، التكلفة، المدة، السياق، المزوّد/النموذج/القناة،
  ومعرّفات الجلسات. `usage` هو احتساب المزوّد/الدورة للتكلفة والقياس عن بُعد؛
  و`context.used` هو لقطة الموجه/السياق الحالية ويمكن أن يكون أقل من
  `usage.total` لدى المزوّد عندما تكون المدخلات المخزنة مؤقتًا أو استدعاءات حلقة الأدوات متضمنة.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمّعة: Webhooks/قائمة الانتظار/الجلسة)

**دورة حياة الحاضنة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  دورة الحياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId`، و`pluginId` اختياريًا،
  والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الإكمال
  `durationMs`، و`outcome`، و`resultClassification` الاختياري، و`yieldDetected`،
  وأعداد `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، و`errorCategory`، و
  `cleanupFailed` الاختياري.

**Exec**

- `exec.process.completed` - النتيجة النهائية، المدة، الهدف، الوضع، رمز الخروج،
  ونوع الفشل. لا يتم تضمين نص الأمر ومجلدات العمل.
- `exec.approval.followup_suppressed` - أُسقطت متابعة موافقة قديمة بعد
  ارتداد جلسة. يتضمن `approvalId`، و`reason` (`session_rebound`)،
  و`phase` (`direct_delivery` أو `gateway_preflight`)، والطابع الزمني للموزّع.
  لا يتم تضمين مفاتيح الجلسات أو المسارات أو نص الأمر.

## بدون مُصدِّر

يمكنك إبقاء أحداث التشخيص متاحة للـ Plugins أو المصارف المخصصة دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

للحصول على مخرجات تصحيح مستهدفة دون رفع `logging.level`، استخدم أعلام التشخيص.
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

تنتقل مخرجات الأعلام إلى ملف السجل القياسي (`logging.file`) وتظل
منقّحة بواسطة `logging.redactSensitive`. الدليل الكامل:
[أعلام التشخيص](/ar/diagnostics/flags).

## تعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضًا ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذات صلة

- [التسجيل](/ar/logging) - سجلات الملفات، مخرجات وحدة التحكم، تتبع CLI، وتبويب سجلات Control UI
- [تفاصيل تسجيل Gateway الداخلية](/ar/gateway/logging) - أنماط سجل WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) - أعلام سجلات التصحيح المستهدفة
- [تصدير التشخيصات](/ar/gateway/diagnostics) - أداة حزمة دعم المشغّل (منفصلة عن تصدير OTEL)
- [مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics) - مرجع حقول `diagnostics.*` الكامل
