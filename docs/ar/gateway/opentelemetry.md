---
read_when:
    - تريد إرسال مقاييس استخدام نموذج OpenClaw أو تدفق الرسائل أو الجلسات إلى مجمّع OpenTelemetry
    - أنت تربط التتبعات أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى لـ OTLP
    - تحتاج إلى أسماء المقاييس أو أسماء spans أو أشكال السمات الدقيقة لإنشاء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى مجمّعات OpenTelemetry أو stdout JSONL عبر Plugin diagnostics-otel
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-06-27T17:41:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 551de723eec13f73ee7a8614a9c0faa64dae52c5f5749fccfca8a347b3307355
    source_path: gateway/opentelemetry.md
    workflow: 16
---

يُصدّر OpenClaw التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يمكن أيضًا كتابة السجلات كـ JSONL إلى stdout
لخطوط معالجة سجلات الحاويات وبيئات sandbox. يعمل أي جامع أو خلفية تقبل
OTLP/HTTP بدون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها،
راجع [التسجيل](/ar/logging).

## كيف تتكامل الأجزاء معًا

- **أحداث التشخيص** هي سجلات مهيكلة داخل العملية يصدرها
  Gateway والـ Plugins المجمعة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والطوابير،
  وexec.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدّرها كـ
  **مقاييس** و**تتبعات** و**سجلات** OpenTelemetry عبر OTLP/HTTP. ويمكنه
  أيضًا عكس سجلات التشخيص إلى JSONL على stdout.
- **استدعاءات المزوّدين** تتلقى ترويسة W3C `traceparent` من سياق امتداد
  استدعاء النموذج الموثوق المملوك لـ OpenClaw عندما يقبل نقل المزوّد
  ترويسات مخصصة. لا يتم نشر سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عندما تكون واجهة التشخيص والـ Plugin مفعّلين معًا،
  لذلك تبقى تكلفة التنفيذ داخل العملية قريبة من الصفر افتراضيًا.

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

| الإشارة      | ما الذي تحتويه                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتجاوز الفشل، واستخدام Skills، وتدفق الرسائل، وأحداث Talk، ومسارات الطوابير، وحالة/استعادة الجلسات، وتنفيذ الأدوات، والحمولات كبيرة الحجم، وexec، وضغط الذاكرة. |
| **التتبعات**  | امتدادات لاستخدام النماذج، واستدعاءات النماذج، ودورة حياة الحاضنة، واستخدام Skills، وتنفيذ الأدوات، وexec، ومعالجة Webhook/الرسائل، وتجميع السياق، وحلقات الأدوات.                                                            |
| **السجلات**    | سجلات `logging.file` مهيكلة تُصدّر عبر OTLP أو JSONL إلى stdout عندما يكون `diagnostics.otel.logs` مفعّلًا؛ يتم حجب أجسام السجلات ما لم يتم تفعيل التقاط المحتوى صراحةً.                                |

فعّل أو عطّل `traces` و`metrics` و`logs` كلًا على حدة. تكون التتبعات والمقاييس
مفعّلة افتراضيًا عندما يكون `diagnostics.otel.enabled` هو true. تكون السجلات
معطّلة افتراضيًا ولا تُصدّر إلا عندما تكون `diagnostics.otel.logs` مضبوطة صراحةً على `true`. يوجّه تصدير السجلات افتراضيًا إلى OTLP؛ اضبط `diagnostics.otel.logsExporter` على `stdout` للحصول على JSONL على
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي بالفعل على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، تُستخدم كما هي.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقطة النهاية الخاصة بكل إشارة، وتُستخدم عندما يكون مفتاح إعدادات `diagnostics.otel.*Endpoint` المطابق غير مضبوط. تتغلب إعدادات الإشارة المحددة على بيئة الإشارة المحددة، والتي تتغلب بدورها على نقطة النهاية المشتركة.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي (لا يُعتد اليوم إلا بـ `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث شكل تجريبي لامتدادات استدلال GenAI، بما في ذلك أسماء الامتدادات `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع الامتداد `CLIENT`، و`gen_ai.provider.name` بدلًا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة التعدد بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجّلت بالفعل OpenTelemetry SDK العام. عندها يتجاوز الـ Plugin دورة حياة NodeSDK الخاصة به، لكنه يستمر في توصيل مستمعي التشخيص واحترام `traces`/`metrics`/`logs`.                                                                                                                    |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل الامتدادات
معرّفات محدودة (القناة، والمزوّد، والنموذج، وفئة الخطأ، ومعرّفات طلبات على شكل تجزئة فقط،
ومصدر الأداة، ومالك الأداة، واسم/مصدر Skill) ولا تتضمن أبدًا نص المطالبة،
أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو مسارات ملفات Skills، أو مفاتيح الجلسات.
تحتفظ سجلات OTLP افتراضيًا بالخطورة، والمسجّل، وموقع الكود، وسياق التتبع الموثوق،
والسمات المنقحة، لكن جسم رسالة السجل الخام لا يُصدّر
إلا عندما يتم ضبط `diagnostics.otel.captureContent` على القيمة المنطقية `true`. لا تفعّل
المفاتيح الفرعية التفصيلية `captureContent.*` أجسام السجلات. يتم استبدال التسميات التي تبدو مثل
مفاتيح جلسات وكلاء محددة النطاق بـ `unknown`.
تصدّر مقاييس Talk بيانات وصفية محدودة للأحداث فقط مثل الوضع، والنقل،
والمزوّد، ونوع الحدث. ولا تتضمن النصوص، أو حمولات الصوت،
أو معرّفات الجلسات، أو معرّفات الأدوار، أو معرّفات المكالمات، أو معرّفات الغرف، أو رموز التسليم.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُنشأ تلك الترويسة
فقط من سياق تتبع التشخيص المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` الموجودة المقدمة من المستدعي، لذلك لا يمكن للـ Plugins أو
خيارات المزوّد المخصصة انتحال أصل تتبع عابر للخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما تكون سياسات جامعك
والاحتفاظ لديك معتمدة لنصوص المطالبات أو الاستجابات أو الأدوات أو مطالبات النظام.
كل مفتاح فرعي اختياري بشكل مستقل:

- `inputMessages` - محتوى مطالبة المستخدم.
- `outputMessages` - محتوى استجابة النموذج.
- `toolInputs` - حمولات وسيطات الأدوات.
- `toolOutputs` - حمولات نتائج الأدوات.
- `systemPrompt` - مطالبة النظام/المطور المجمعة.
- `toolDefinitions` - أسماء أدوات النموذج وأوصافها ومخططاتها.

عند تفعيل أي مفتاح فرعي، تحصل امتدادات النموذج والأدوات على سمات
`openclaw.content.*` محدودة ومنقحة لتلك الفئة فقط. استخدم القيمة المنطقية
`captureContent: true` فقط لالتقاطات التشخيص الواسعة حيث تكون أجسام رسائل سجلات OTLP
معتمدة أيضًا للتصدير.

يتم التقاط محتوى `toolInputs`/`toolOutputs` لتنفيذات الأدوات في وقت تشغيل الوكيل المدمج
(`openclaw.content.tool_input` على امتدادات الاكتمال/الخطأ،
و`openclaw.content.tool_output` على امتدادات الاكتمال). تصدر استدعاءات أدوات الحاضنات الخارجية
(Codex, Claude CLI) امتدادات `tool.execution.*` بدون حمولات محتوى.
ينتقل المحتوى الملتقط عبر قناة موثوقة مخصصة للمستمعين فقط ولا يوضع أبدًا
على ناقل أحداث التشخيص العام.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (امتداد الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP قيمة `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجلات التشخيص، وليس تنسيق وحدة التحكم. يجب على التثبيتات
  ذات الحجم العالي تفضيل أخذ العينات/الترشيح في جامع OTLP على أخذ العينات المحلي.
  اضبط `diagnostics.otel.logsExporter: "stdout"` عندما تكون منصتك ترسل بالفعل
  stdout/stderr إلى معالج سجلات ولا تملك جامع سجلات OTLP. تكون سجلات stdout
  كائن JSON واحدًا في كل سطر مع `ts` و`signal`
  و`service.name` والخطورة والجسم والسمات المنقحة وحقول التتبع الموثوقة
  عند توفرها.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL الحقول العليا `traceId`
  و`spanId` و`parentSpanId` و`traceFlags` عندما يحمل استدعاء السجل سياق
  تتبع تشخيص صالحًا، مما يتيح لمعالجات السجلات ربط أسطر السجلات المحلية
  بالامتدادات المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP في Gateway وإطارات WebSocket نطاق تتبع طلب
  داخليًا. ترث السجلات وأحداث التشخيص داخل ذلك النطاق تتبع الطلب
  افتراضيًا، بينما تُنشأ امتدادات تشغيل الوكيل واستدعاءات النموذج كأبناء بحيث تبقى ترويسات
  `traceparent` الخاصة بالمزوّد على التتبع نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عدّاد، السمات: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (عدّاد، السمات: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، السمات: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، ثوانٍ، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، اختياري `error.type`)
- `openclaw.model_call.duration_ms` (مدرج تكراري، السمات: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، إضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم حمولة طلب النموذج النهائي ببايتات UTF-8؛ بلا محتوى حمولة خام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم حمولات أجزاء الاستجابة المتدفقة ببايتات UTF-8؛ لا تحتسب دلتا النص عالي التكرار والتفكير واستدعاءات الأدوات إلا بايتات `delta` التزايدية؛ بلا محتوى استجابة خام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الوقت المنقضي قبل أول حدث استجابة متدفقة)
- `openclaw.model.failover` (عدّاد، السمات: `openclaw.provider`، `openclaw.model`، `openclaw.failover.to_provider`، `openclaw.failover.to_model`، `openclaw.failover.reason`، `openclaw.failover.suspended`، `openclaw.lane`)
- `openclaw.skill.used` (عدّاد، السمات: `openclaw.skill.name`، `openclaw.skill.source`، `openclaw.skill.activation`، اختياري `openclaw.agent`، اختياري `openclaw.toolName`)

### تدفق الرسائل

- `openclaw.webhook.received` (عدّاد، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.error` (عدّاد، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.message.queued` (عدّاد، السمات: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.received` (عدّاد، السمات: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.dispatch.started` (عدّاد، السمات: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.dispatch.completed` (عدّاد، السمات: `openclaw.channel`، `openclaw.outcome`، `openclaw.reason`، `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.outcome`، `openclaw.reason`، `openclaw.source`)
- `openclaw.message.processed` (عدّاد، السمات: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.delivery.started` (عدّاد، السمات: `openclaw.channel`، `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`)

### التحدث

- `openclaw.talk.event` (عدّاد، السمات: `openclaw.talk.event_type`، `openclaw.talk.mode`، `openclaw.talk.transport`، `openclaw.talk.brain`، `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (مدرج تكراري، السمات: مثل `openclaw.talk.event`؛ يُصدر عندما يبلغ حدث التحدث عن مدة)
- `openclaw.talk.audio.bytes` (مدرج تكراري، السمات: مثل `openclaw.talk.event`؛ يُصدر لأحداث إطارات صوت التحدث التي تبلغ عن طول بالبايت)

### قوائم الانتظار والجلسات

- `openclaw.queue.lane.enqueue` (عدّاد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عدّاد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عدّاد، السمات: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (عدّاد، السمات: `openclaw.state`؛ يُصدر لمسك دفاتر الجلسات القديمة القابلة للاسترداد)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يُصدر لمسك دفاتر الجلسات القديمة القابلة للاسترداد)
- `openclaw.session.turn.created` (عدّاد، السمات: `openclaw.agent`، `openclaw.channel`، `openclaw.trigger`)
- `openclaw.session.recovery.requested` (عدّاد، السمات: `openclaw.state`، `openclaw.action`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.completed` (عدّاد، السمات: `openclaw.state`، `openclaw.action`، `openclaw.status`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (مدرج تكراري، السمات: مثل عدّاد الاسترداد المطابق)
- `openclaw.run.attempt` (عدّاد، السمات: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد عمر عدم التقدم لتشخيصات حيوية
الجلسة. لا تتقدم جلسة `processing` في العمر باتجاه هذا الحد
بينما يلاحظ OpenClaw تقدماً في الرد أو الأداة أو الحالة أو الكتلة أو وقت تشغيل ACP.
لا تُحتسب إشارات إبقاء الكتابة حية كتقدم، لذلك يظل من الممكن
اكتشاف نموذج أو حاضنة صامتة.

يصنف OpenClaw الجلسات حسب العمل الذي لا يزال بإمكانه ملاحظته:

- `session.long_running`: العمل المضمن النشط أو استدعاءات النماذج أو استدعاءات الأدوات
  لا تزال تحقق تقدماً. استدعاءات النماذج المملوكة التي تبقى صامتة بعد
  `diagnostics.stuckSessionWarnMs` تُبلغ أيضاً كطويلة التشغيل قبل
  `diagnostics.stuckSessionAbortMs` حتى لا تبدو موفّرات النماذج البطيئة أو غير المتدفقة
  كجلسات Gateway متوقفة ما دامت قابلة للملاحظة من ناحية الإجهاض.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلغ عن
  تقدم حديث. تنتقل استدعاءات النماذج المملوكة من `session.long_running` إلى
  `session.stalled` عند `diagnostics.stuckSessionAbortMs` أو بعده؛ ولا
  يُعامل نشاط النماذج/الأدوات القديم بلا مالك كعمل طويل التشغيل غير ضار.
  تبقى عمليات التشغيل المضمنة المتوقفة في وضع المراقبة فقط في البداية، ثم تُجهض وتُصرّف بعد
  `diagnostics.stuckSessionAbortMs` بلا تقدم حتى تتمكن الأدوار المصطفة خلف
  المسار من الاستئناف. عند عدم الضبط، يكون حد الإجهاض افتراضياً هو نافذة
  ممتدة أكثر أماناً لا تقل عن 5 دقائق و3 أضعاف
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: مسك دفاتر جلسة قديم بلا عمل نشط، أو جلسة خاملة
  في قائمة الانتظار مع نشاط نموذج/أداة قديم بلا مالك. يحرر هذا
  مسار الجلسة المتأثر فوراً بعد اجتياز بوابات الاسترداد.

يصدر الاسترداد أحداث `session.recovery.requested` و
`session.recovery.completed` منظمة. تُعلَّم حالة الجلسة التشخيصية كخاملة
فقط بعد نتيجة استرداد تغييرية (`aborted` أو `released`) وفقط إذا كان
جيل المعالجة نفسه لا يزال هو الحالي.

وحدها `session.stuck` تصدر عدّاد `openclaw.session.stuck`،
ومدرج `openclaw.session.stuck_age_ms` التكراري، ونطاق `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة بينما تبقى الجلسة
دون تغيير، لذلك ينبغي أن تنبه لوحات المعلومات على الزيادات المستمرة بدلاً من كل
نبضة Heartbeat. لمفتاح الضبط والافتراضيات، راجع
[مرجع التكوين](/ar/gateway/configuration-reference#diagnostics).

تصدر تحذيرات الحيوية أيضاً:

- `openclaw.liveness.warning` (عدّاد، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (مدرج تكراري، السمات: `openclaw.liveness.reason`)

### دورة حياة الحاضنة

- `openclaw.harness.duration_ms` (مدرج تكراري، السمات: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.harness.phase` عند الأخطاء)

### تنفيذ الأدوات

- `openclaw.tool.execution.duration_ms` (مدرج تكراري، السمات: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، إضافة إلى `openclaw.errorCategory` عند الأخطاء)
- `openclaw.tool.execution.blocked` (عدّاد، السمات: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، `openclaw.deniedReason`)

### التنفيذ

- `openclaw.exec.duration_ms` (مدرج تكراري، السمات: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### داخليات التشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.payload.large` (عدّاد، السمات: `openclaw.payload.surface`، `openclaw.payload.action`، `openclaw.channel`، `openclaw.plugin`، `openclaw.reason`)
- `openclaw.payload.large_bytes` (مدرج تكراري، السمات: مثل `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (مدرج تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عدّاد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عدّاد، السمات: `openclaw.toolName`، `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، السمات: `openclaw.toolName`، `openclaw.outcome`)

## النطاقات المصدرة

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory` و`openclaw.failureKind` الاختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرّف طلب المزوّد العلوي؛ لا تُصدَّر المعرّفات الخام)
  - مع `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، تستخدم امتدادات استدعاء النموذج أحدث اسم امتداد استدلال GenAI وهو `{gen_ai.operation.name} {gen_ai.request.model}` ونوع الامتداد `CLIENT` بدلًا من `openclaw.model.call`.
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (لا يتضمن أي محتوى للمطالبة أو السجل أو الاستجابة أو مفتاح الجلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.outcome`، `openclaw.iterations`، `openclaw.errorCategory` (لا يتضمن رسائل الحلقة أو المعاملات أو خرج الأداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن أن تتضمن امتدادات النموذج والأداة أيضًا
سمات `openclaw.content.*` محدودة ومنقّحة لفئات المحتوى المحددة
التي اخترت تفعيلها.

## كتالوج أحداث التشخيص

تدعم الأحداث أدناه المقاييس والامتدادات أعلاه. يمكن للإضافات أيضًا الاشتراك
فيها مباشرةً دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` - الرموز، التكلفة، المدة، السياق، المزوّد/النموذج/القناة،
  معرّفات الجلسات. `usage` هو حساب المزوّد/الدورة للتكلفة والقياس عن بُعد؛
  أما `context.used` فهو لقطة المطالبة/السياق الحالية وقد يكون أقل من
  `usage.total` لدى المزوّد عند وجود إدخال مخبأ أو استدعاءات حلقة أدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمّعة: webhooks/queue/session)

**دورة حياة الحزمة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  دورة حياة لكل تشغيل لحزمة الوكيل. تتضمن `harnessId`، و`pluginId` الاختياري،
  والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الاكتمال
  `durationMs`، و`outcome`، و`resultClassification` الاختياري، و`yieldDetected`،
  وأعداد `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`)، و`errorCategory`، و
  `cleanupFailed` الاختياري.

**Exec**

- `exec.process.completed` - النتيجة النهائية، المدة، الهدف، الوضع، رمز الخروج،
  ونوع الفشل. لا يتم تضمين نص الأمر ولا أدلة العمل.

## بدون مُصدِّر

يمكنك إبقاء أحداث التشخيص متاحة للإضافات أو المصارف المخصصة دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

لإخراج تصحيح موجّه دون رفع `logging.level`، استخدم أعلام التشخيص.
الأعلام غير حساسة لحالة الأحرف وتدعم أحرف البدل (مثل `telegram.*` أو
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

أو كتجاوز مؤقت عبر متغير بيئة:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

ينتقل خرج الأعلام إلى ملف السجل القياسي (`logging.file`) ويظل
منقّحًا بواسطة `logging.redactSensitive`. الدليل الكامل:
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

- [التسجيل](/ar/logging) - سجلات الملفات، خرج وحدة التحكم، تتبع CLI، وعلامة تبويب سجلات Control UI
- [تفاصيل تسجيل Gateway الداخلية](/ar/gateway/logging) - أنماط سجل WS، بادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) - أعلام سجل التصحيح الموجّه
- [تصدير التشخيص](/ar/gateway/diagnostics) - أداة حزمة دعم المشغّل (منفصلة عن تصدير OTEL)
- [مرجع التكوين](/ar/gateway/configuration-reference#diagnostics) - مرجع كامل لحقول `diagnostics.*`
