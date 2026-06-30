---
read_when:
    - تريد إرسال استخدام نماذج OpenClaw، أو تدفق الرسائل، أو مقاييس الجلسات إلى جامع OpenTelemetry
    - أنت تربط التتبعات أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى تدعم OTLP
    - تحتاج إلى أسماء المقاييس أو أسماء المقاطع أو أشكال السمات الدقيقة لبناء لوحات معلومات أو تنبيهات.
summary: صدّر تشخيصات OpenClaw إلى مجمّعات OpenTelemetry أو stdout JSONL عبر Plugin diagnostics-otel
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-06-30T14:06:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9cdac72cb4a2910e6ef52e60a5f2266a2667c53cf003d63908f04d284e427b0
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw يصدّر التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يمكن أيضًا كتابة السجلات كـ stdout JSONL
لخطوط أنابيب سجلات الحاويات وصناديق الرمل. أي مجمّع أو خلفية تقبل
OTLP/HTTP تعمل من دون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها،
راجع [التسجيل](/ar/logging).

## كيف يترابط ذلك

- **أحداث التشخيصات** هي سجلات منظمة داخل العملية يصدرها
  Gateway وPlugins المضمنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والطوابير،
  وexec.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدّرها كـ
  OpenTelemetry **مقاييس**، و**تتبعات**، و**سجلات** عبر OTLP/HTTP. ويمكنه
  أيضًا عكس سجلات التشخيص إلى stdout JSONL.
- **استدعاءات المزوّد** تتلقى ترويسة W3C `traceparent` من OpenClaw
  لسياق امتداد استدعاء النموذج الموثوق عندما يقبل نقل المزوّد الترويسات
  المخصصة. لا يتم نشر سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عندما يكون سطح التشخيصات وPlugin كلاهما
  مفعّلين، لذلك تبقى تكلفة التنفيذ داخل العملية قريبة من الصفر افتراضيًا.

## البدء السريع

لعمليات التثبيت المعبأة، ثبّت Plugin أولًا:

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

| الإشارة      | ما الذي يدخل فيها                                                                                                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، والتحويل عند الفشل، واستخدام Skills، وتدفق الرسائل، وأحداث Talk، ومسارات الطوابير، وحالة الجلسة/استعادتها، وتنفيذ الأدوات، والحمولات كبيرة الحجم، وexec، وضغط الذاكرة. |
| **التتبعات**  | امتدادات لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة الحاضنة، واستخدام Skills، وتنفيذ الأدوات، وexec، ومعالجة Webhook/الرسائل، وتجميع السياق، وحلقات الأدوات.                                                            |
| **السجلات**    | سجلات `logging.file` منظمة تُصدّر عبر OTLP أو stdout JSONL عندما يكون `diagnostics.otel.logs` مفعّلًا؛ يتم حجب أجسام السجلات ما لم يتم تفعيل التقاط المحتوى صراحةً.                                |

بدّل `traces`، و`metrics`، و`logs` كلًا على حدة. تكون التتبعات والمقاييس
مفعّلة افتراضيًا عندما يكون `diagnostics.otel.enabled` بقيمة true. تكون السجلات
معطّلة افتراضيًا ولا تُصدّر إلا عندما يكون `diagnostics.otel.logs` صراحةً `true`. يكون تصدير السجلات
افتراضيًا إلى OTLP؛ اضبط `diagnostics.otel.logsExporter` على `stdout` من أجل JSONL على
stdout، أو `both` لإرسال كل سجل تشخيص إلى OTLP وstdout.

## مرجع التهيئة

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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي مسبقًا على `/v1/traces`، أو `/v1/metrics`، أو `/v1/logs`، فتُستخدم كما هي.                                                                                                                                                                                                              |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات لنقاط النهاية الخاصة بالإشارة تُستخدم عندما يكون مفتاح التهيئة المطابق `diagnostics.otel.*Endpoint` غير مضبوط. تهيئة الإشارة الخاصة تتغلب على متغير البيئة الخاص بالإشارة، والذي يتغلب بدوره على نقطة النهاية المشتركة.                                                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل عبر السلك (لا يُحترم اليوم إلا `http/protobuf`).                                                                                                                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث شكل تجريبي لامتداد استدلال GenAI، بما في ذلك أسماء الامتدادات `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع الامتداد `CLIENT`، و`gen_ai.provider.name` بدلًا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أخرى أو عملية مضيفة قد سجّلت OpenTelemetry SDK العام بالفعل. عندها يتخطى Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يربط مستمعي التشخيص ويحترم `traces`/`metrics`/`logs`.                                                                                                                    |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل الامتدادات
معرّفات محدودة (القناة، والمزوّد، والنموذج، وفئة الخطأ، ومعرّفات الطلبات التي هي تجزئة فقط،
ومصدر الأداة، ومالك الأداة، واسم/مصدر Skill) ولا تتضمن أبدًا نص الموجه،
أو نص الاستجابة، أو مدخلات الأداة، أو مخرجات الأداة، أو مسارات ملفات Skill، أو مفاتيح الجلسات.
تحتفظ سجلات OTLP افتراضيًا بالخطورة، والمسجّل، وموقع الكود، وسياق التتبع الموثوق،
والسمات المنقّاة، لكن جسم رسالة السجل الخام لا يُصدّر
إلا عندما يتم ضبط `diagnostics.otel.captureContent` على القيمة المنطقية `true`. لا تفعّل المفاتيح الفرعية التفصيلية
`captureContent.*` أجسام السجلات. تُستبدل التسميات التي تبدو مثل
مفاتيح جلسات وكيل ذات نطاق بـ `unknown`.
تصدّر مقاييس Talk بيانات وصفية محدودة للأحداث فقط، مثل الوضع، والنقل،
والمزوّد، ونوع الحدث. ولا تتضمن النصوص التفريغية، أو حمولات الصوت،
أو معرّفات الجلسات، أو معرّفات الدورات، أو معرّفات المكالمات، أو معرّفات الغرف، أو رموز التسليم.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُنشأ تلك الترويسة
فقط من سياق تتبع التشخيصات المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` الموجودة والمقدمة من المستدعي، لذلك لا يمكن لـPlugins أو
خيارات المزوّد المخصصة انتحال نسب تتبع عابر للخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون المجمّع لديك
وسياسة الاحتفاظ معتمدين لنص الموجه، أو الاستجابة، أو الأداة، أو موجه النظام.
كل مفتاح فرعي اختياري بشكل مستقل:

- `inputMessages` - محتوى موجه المستخدم.
- `outputMessages` - محتوى استجابة النموذج.
- `toolInputs` - حمولات وسيطات الأداة.
- `toolOutputs` - حمولات نتائج الأداة.
- `systemPrompt` - موجه النظام/المطور المجمّع.
- `toolDefinitions` - أسماء أدوات النموذج، وأوصافها، ومخططاتها.

عندما يتم تفعيل أي مفتاح فرعي، تحصل امتدادات النموذج والأداة على سمات
`openclaw.content.*` محدودة ومنقّاة لتلك الفئة فقط. استخدم القيمة المنطقية
`captureContent: true` فقط لالتقاطات تشخيصية واسعة حيث تكون أجسام رسائل سجلات OTLP
معتمدة أيضًا للتصدير.

يتم التقاط محتوى `toolInputs`/`toolOutputs` لتنفيذات أدوات وقت تشغيل الوكيل المضمنة
(`openclaw.content.tool_input` على امتدادات الاكتمال/الخطأ،
و`openclaw.content.tool_output` على امتدادات الاكتمال). تصدر استدعاءات أدوات الحاضنات الخارجية
(Codex, Claude CLI) امتدادات `tool.execution.*` من دون حمولات محتوى.
ينتقل المحتوى الملتقط عبر قناة موثوقة مخصصة للمستمعين فقط ولا يوضع أبدًا
على ناقل أحداث التشخيص العام.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (امتداد الجذر فقط، تؤدي `0.0` إلى إسقاط الكل،
  وتبقي `1.0` على الكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تراعي سجلات OTLP قيمة `logging.level` (مستوى سجل الملف). وهي تستخدم
  مسار تنقيح سجل التشخيص، وليس تنسيق وحدة التحكم. ينبغي للتثبيتات عالية الحجم
  تفضيل أخذ العينات/التصفية عبر مجمّع OTLP على أخذ العينات المحلي.
  عيّن `diagnostics.otel.logsExporter: "stdout"` عندما تكون منصتك تشحن بالفعل
  stdout/stderr إلى معالج سجلات ولا يتوفر لديك مجمّع سجلات OTLP.
  تكون سجلات Stdout كائناً JSON واحداً في كل سطر يتضمن `ts` و`signal`
  و`service.name` والخطورة والمتن والسمات المنقحة وحقول التتبع الموثوقة
  عند توفرها.
- **ارتباط سجل الملف:** تتضمن سجلات ملفات JSONL حقولاً علوية هي `traceId`
  و`spanId` و`parentSpanId` و`traceFlags` عندما يحمل استدعاء السجل سياق تتبع
  تشخيصياً صالحاً، ما يتيح لمعالجات السجلات ربط أسطر السجل المحلية بالامتدادات
  المصدّرة.
- **ارتباط الطلب:** تنشئ طلبات HTTP الخاصة بـ Gateway وإطارات WebSocket نطاق
  تتبع طلب داخلياً. ترث السجلات والأحداث التشخيصية داخل ذلك النطاق تتبع الطلب
  افتراضياً، بينما تُنشأ امتدادات تشغيل الوكيل واستدعاء النموذج كأبناء بحيث تبقى
  ترويسات `traceparent` الخاصة بالمزوّد على التتبع نفسه.
- **ارتباط استدعاء النموذج:** تتضمن امتدادات `openclaw.model.call` أحجام
  مكونات الموجه الآمنة افتراضياً، وتتضمن سمات الرموز المميزة لكل استدعاء عندما
  تكشف نتيجة المزوّد عن الاستخدام. يبقى `openclaw.model.usage` امتداد المحاسبة
  على مستوى التشغيل للتكلفة والسياق ولوحات معلومات القناة المجمّعة؛ ويبقى على
  التتبع التشخيصي نفسه عندما يمتلك وقت التشغيل المُصدر سياق تتبع موثوقاً.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، السمات: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عداد، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، السمات: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اتفاقيات GenAI الدلالية، السمات: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، بالثواني، مقياس اتفاقيات GenAI الدلالية، السمات: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختياري `error.type`)
- `openclaw.model_call.duration_ms` (مدرج تكراري، السمات: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`، إضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` في الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم طلب النموذج النهائي بالبايت وفق UTF-8؛ بلا محتوى حمولة خام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم حمولات مقاطع الاستجابة المتدفقة بالبايت وفق UTF-8؛ تحتسب دلتا النصوص والتفكير واستدعاءات الأدوات عالية التكرار بايتات `delta` التزايدية فقط؛ بلا محتوى استجابة خام)
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

### التحدث

- `openclaw.talk.event` (عداد، السمات: `openclaw.talk.event_type`, `openclaw.talk.mode`, `openclaw.talk.transport`, `openclaw.talk.brain`, `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (مدرج تكراري، السمات: مثل `openclaw.talk.event`؛ يُصدر عندما يبلّغ حدث التحدث عن مدة)
- `openclaw.talk.audio.bytes` (مدرج تكراري، السمات: مثل `openclaw.talk.event`؛ يُصدر لأحداث إطارات صوت التحدث التي تبلّغ عن طول بالبايت)

### قوائم الانتظار والجلسات

- `openclaw.queue.lane.enqueue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، السمات: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`؛ يُصدر لمحاسبة جلسات قديمة قابلة للاسترداد)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يُصدر لمحاسبة جلسات قديمة قابلة للاسترداد)
- `openclaw.session.turn.created` (عداد، السمات: `openclaw.agent`, `openclaw.channel`, `openclaw.trigger`)
- `openclaw.session.recovery.requested` (عداد، السمات: `openclaw.state`, `openclaw.action`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.completed` (عداد، السمات: `openclaw.state`, `openclaw.action`, `openclaw.status`, `openclaw.active_work_kind`, `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (مدرج تكراري، السمات: مثل عداد الاسترداد المطابق)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو عتبة عمر عدم التقدم لتشخيصات حيوية
الجلسة. لا تتقدم جلسة `processing` في العمر نحو هذه العتبة بينما يلاحظ OpenClaw
تقدماً في الرد أو الأداة أو الحالة أو الكتلة أو وقت تشغيل ACP.
لا تُحتسب إشارات بقاء الكتابة كتقدم، لذلك لا يزال من الممكن اكتشاف نموذج أو
حزمة اختبار صامتة.

يصنف OpenClaw الجلسات حسب العمل الذي لا يزال يستطيع ملاحظته:

- `session.long_running`: لا يزال العمل المضمن النشط أو استدعاءات النموذج أو
  استدعاءات الأدوات تحقق تقدماً. كما تُبلّغ استدعاءات النموذج المملوكة التي تبقى
  صامتة بعد `diagnostics.stuckSessionWarnMs` على أنها طويلة التشغيل قبل
  `diagnostics.stuckSessionAbortMs` حتى لا تبدو مزودات النماذج البطيئة أو غير
  المتدفقة كجلسات Gateway متوقفة بينما تبقى قابلة للملاحظة من حيث الإلغاء.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلّغ عن تقدم حديث.
  تنتقل استدعاءات النموذج المملوكة من `session.long_running` إلى
  `session.stalled` عند `diagnostics.stuckSessionAbortMs` أو بعده؛ ولا يُعامل
  نشاط النموذج/الأداة القديم غير المملوك كعمل طويل التشغيل غير ضار.
  تبقى عمليات التشغيل المضمنة المتوقفة في وضع الملاحظة فقط أولاً، ثم تُلغى
  وتُفرغ بعد `diagnostics.stuckSessionAbortMs` بلا تقدم حتى تتمكن الأدوار
  المنتظرة خلف المسار من الاستئناف. عند عدم ضبطها، تكون عتبة الإلغاء افتراضياً
  نافذة ممتدة أكثر أماناً لا تقل عن 5 دقائق و3 أضعاف
  `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: محاسبة جلسات قديمة بلا عمل نشط، أو جلسة خاملة في قائمة
  الانتظار مع نشاط نموذج/أداة قديم غير مملوك. يؤدي هذا إلى تحرير مسار الجلسة
  المتأثر فوراً بعد اجتياز بوابات الاسترداد.

يصدر الاسترداد أحداث `session.recovery.requested` و
`session.recovery.completed` منظّمة. تُعلَّم حالة الجلسة التشخيصية كخاملة فقط
بعد نتيجة استرداد معدِّلة (`aborted` أو `released`) وفقط إذا كان جيل المعالجة
نفسه لا يزال هو الحالي.

وحده `session.stuck` يصدر عداد `openclaw.session.stuck`، ومدرج
`openclaw.session.stuck_age_ms` التكراري، وامتداد `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة بينما تبقى الجلسة بلا تغيير، لذلك ينبغي
أن تنبه لوحات المعلومات على الزيادات المستمرة بدلاً من كل نبضة Heartbeat.
للاطلاع على زر الإعدادات والافتراضيات، راجع
[مرجع التكوين](/ar/gateway/configuration-reference#diagnostics).

تصدر تحذيرات الحيوية أيضاً:

- `openclaw.liveness.warning` (عداد، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (مدرج تكراري، السمات: `openclaw.liveness.reason`)

### دورة حياة الحزمة

- `openclaw.harness.duration_ms` (مدرج تكراري، السمات: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` عند الأخطاء)

### تنفيذ الأدوات

- `openclaw.tool.execution.duration_ms` (مدرج تكراري، السمات: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`، إضافة إلى `openclaw.errorCategory` عند الأخطاء)
- `openclaw.tool.execution.blocked` (عداد، السمات: `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.tool.source`, `openclaw.tool.owner`, `openclaw.tool.params.kind`, `openclaw.deniedReason`)

### التنفيذ

- `openclaw.exec.duration_ms` (مدرج تكراري، السمات: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### داخليات التشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.payload.large` (عداد، السمات: `openclaw.payload.surface`, `openclaw.payload.action`, `openclaw.channel`, `openclaw.plugin`, `openclaw.reason`)
- `openclaw.payload.large_bytes` (مدرج تكراري، السمات: مثل `openclaw.payload.large`)
- `openclaw.memory.heap_used_bytes` (مدرج تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عداد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، السمات: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، السمات: `openclaw.toolName`, `openclaw.outcome`)

## الامتدادات المصدّرة

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
  - `openclaw.model_call.prompt.input_messages_count`, `openclaw.model_call.prompt.input_messages_chars`, `openclaw.model_call.prompt.system_prompt_chars`, `openclaw.model_call.prompt.tool_definitions_count`, `openclaw.model_call.prompt.tool_definitions_chars`, `openclaw.model_call.prompt.total_chars` (أحجام المكونات الآمنة فقط، من دون نص الموجه)
  - `openclaw.model_call.usage.*` و`gen_ai.usage.*` عندما تحمل نتيجة استدعاء النموذج استخدام المزوّد لذلك الاستدعاء الفردي
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرّف طلب المزوّد upstream؛ لا تُصدَّر المعرّفات الخام)
  - مع `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، تستخدم نطاقات استدعاء النموذج أحدث اسم نطاق استدلال GenAI `{gen_ai.operation.name} {gen_ai.request.model}` ونوع النطاق `CLIENT` بدلًا من `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (لا يتضمن الموجه أو السجل أو الاستجابة أو محتوى مفتاح الجلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (لا يتضمن رسائل الحلقة أو المعاملات أو مخرجات الأداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن أن تتضمن نطاقات النماذج والأدوات أيضًا
سمات `openclaw.content.*` محدودة ومنقحة لفئات المحتوى المحددة
التي فعّلتها.

## كتالوج أحداث التشخيص

تدعم الأحداث أدناه المقاييس والنطاقات المذكورة أعلاه. يمكن أن تشترك Plugins فيها
مباشرةً أيضًا من دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` - الرموز، التكلفة، المدة، السياق، المزوّد/النموذج/القناة،
  معرّفات الجلسات. `usage` هو احتساب المزوّد/الدورة للتكلفة والقياس عن بُعد؛
  و`context.used` هو لقطة الموجه/السياق الحالية، وقد يكون أقل من
  `usage.total` لدى المزوّد عند وجود إدخال مخزّن مؤقتًا أو استدعاءات حلقة الأدوات.

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
  دورة حياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId`، و`pluginId` اختياريًا،
  والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الاكتمال
  `durationMs` و`outcome` و`resultClassification` اختياريًا و`yieldDetected`
  وعدّادات `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`) و`errorCategory` و
  `cleanupFailed` اختياريًا.

**التنفيذ**

- `exec.process.completed` - النتيجة النهائية، والمدة، والهدف، والوضع، ورمز الخروج،
  ونوع الفشل. لا يُضمَّن نص الأمر ولا أدلة العمل.

## بدون مُصدِّر

يمكنك إبقاء أحداث التشخيص متاحة لـ Plugins أو المصارف المخصصة من دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

لإخراج تصحيح موجّه من دون رفع `logging.level`، استخدم أعلام التشخيص.
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

يذهب خرج الأعلام إلى ملف السجل القياسي (`logging.file`) ويظل
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

- [التسجيل](/ar/logging) - سجلات الملفات، وخرج وحدة التحكم، وتتبع CLI، وتبويب السجلات في واجهة التحكم
- [تفاصيل تسجيل Gateway الداخلية](/ar/gateway/logging) - أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) - أعلام سجل التصحيح الموجّهة
- [تصدير التشخيص](/ar/gateway/diagnostics) - أداة حزمة الدعم للمشغّل (منفصلة عن تصدير OTEL)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics) - مرجع كامل لحقول `diagnostics.*`
