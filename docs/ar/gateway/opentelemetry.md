---
read_when:
    - تريد إرسال مقاييس استخدام نماذج OpenClaw أو تدفق الرسائل أو الجلسات إلى مُجمِّع OpenTelemetry
    - أنت تربط بيانات التتبّع أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة OTLP خلفية أخرى
    - تحتاج إلى الأسماء الدقيقة للمقاييس أو الامتدادات أو بُنى السمات لإنشاء لوحات المعلومات أو التنبيهات
summary: تصدير بيانات تشخيص OpenClaw إلى مجمّعات OpenTelemetry أو إلى stdout بتنسيق JSONL عبر Plugin diagnostics-otel
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-07-12T05:54:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3f8a1b9e253000272def0fbd361cd311f6645b1aac5a6f06cff014b45e82388
    source_path: gateway/opentelemetry.md
    workflow: 16
---

يُصدّر OpenClaw بيانات التشخيص عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. ويمكن أيضًا كتابة السجلات بصيغة JSONL إلى stdout من أجل
مسارات معالجة سجلات الحاويات وصناديق العزل. يعمل أي مُجمّع أو نظام خلفي يقبل
OTLP/HTTP من دون تغييرات في الشيفرة. للاطلاع على سجلات الملفات المحلية، راجع
[التسجيل](/ar/logging).

- **أحداث التشخيص** هي سجلات منظّمة داخل العملية يُصدرها
  Gateway والـ Plugins المضمّنة لعمليات تشغيل النماذج، وتدفق الرسائل، والجلسات، وقوائم الانتظار،
  والتنفيذ.
- يشترك **`diagnostics-otel`** في تلك الأحداث ويُصدّرها على هيئة
  **مقاييس** و**آثار تتبّع** و**سجلات** في OpenTelemetry عبر OTLP/HTTP، ويمكنه
  نسخ سجلات التسجيل بصيغة JSONL إلى stdout.
- تتلقى **استدعاءات المزوّد** ترويسة W3C باسم `traceparent` من سياق
  نطاق استدعاء النموذج الموثوق في OpenClaw عندما يقبل نقل المزوّد ترويسات
  مخصّصة. ولا يُمرَّر سياق التتبّع الصادر من Plugin.
- لا تُرفق أدوات التصدير إلا عند تمكين كلٍّ من واجهة التشخيص والـ Plugin،
  لذا تظل الكلفة داخل العملية قريبة من الصفر افتراضيًا.

## البدء السريع

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

أو مكّن الـ Plugin من CLI: `openclaw plugins enable diagnostics-otel`.

<Note>
يدعم `protocol` القيمة `http/protobuf` فقط. ونظرًا إلى أن `traces` و`metrics` مفعّلان افتراضيًا، فإن أي قيمة أخرى (بما فيها `grpc`) تُلغي اشتراك diagnostics-otel بالكامل مع تحذير `unsupported protocol`، ويؤدي ذلك أيضًا إلى إيقاف تصدير السجلات إلى stdout. اضبط `traces: false` و`metrics: false` صراحةً إذا كنت تريد `logsExporter: "stdout"` فقط مع قيمة بروتوكول غير OTLP.
</Note>

## الإشارات المُصدَّرة

| الإشارة      | محتواها                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدّادات ومدرّجات تكرارية لاستخدام الرموز المميزة، والتكلفة، ومدة التشغيل، والتحويل الاحتياطي، واستخدام Skills، وتدفق الرسائل، وأحداث المحادثة، ومسارات قوائم الانتظار، وحالة الجلسة واستعادتها، وتنفيذ الأدوات، والتنفيذ، والذاكرة، والحيوية، وسلامة أداة التصدير. |
| **آثار التتبّع**  | نطاقات لاستخدام النموذج، واستدعاءات النموذج، ودورة حياة بيئة التشغيل، واستخدام Skills، وتنفيذ الأدوات، والتنفيذ، ومعالجة Webhook والرسائل، وتجميع السياق، وحلقات الأدوات.                                                      |
| **السجلات**    | سجلات `logging.file` منظّمة تُصدَّر عبر OTLP أو بصيغة JSONL إلى stdout عند تمكين `diagnostics.otel.logs`؛ وتُحجب محتويات السجلات ما لم يُمكَّن التقاط المحتوى صراحةً.                          |

يمكن تبديل `traces` و`metrics` و`logs` كلٌّ على حدة. تُفعَّل آثار التتبّع والمقاييس
افتراضيًا عندما تكون `diagnostics.otel.enabled` بالقيمة `true`، بينما تُعطَّل السجلات افتراضيًا
ولا تُصدَّر إلا عندما تكون `diagnostics.otel.logs` مضبوطة صراحةً على `true`. يستخدم تصدير السجلات
OTLP افتراضيًا؛ اضبط `diagnostics.otel.logsExporter` على `stdout` للحصول على JSONL على
stdout، أو على `both` لكليهما.

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
      protocol: "http/protobuf", // يعطّل grpc التصدير عبر OTLP
      serviceName: "openclaw-gateway", // عند عدم الضبط، يرجع إلى OTEL_SERVICE_NAME، ثم "openclaw"
      headers: { "x-collector-token": "..." },
      traces: true,
      metrics: true,
      logs: true,
      logsExporter: "otlp", // otlp | stdout | both
      sampleRate: 0.2, // عيّنة النطاق الجذر، 0.0..1.0
      flushIntervalMs: 60000, // الفاصل الزمني لتصدير المقاييس (الحد الأدنى 1000ms)
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

| المتغير                                                                                                          | الغرض                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | قيمة احتياطية لـ `diagnostics.otel.endpoint` عندما لا يكون مفتاح الإعداد مضبوطًا.                                                                                                                                                                                                                                         |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | قيم احتياطية لنقاط النهاية الخاصة بكل إشارة، تُستخدم عندما لا يكون مفتاح الإعداد المطابق `diagnostics.otel.*Endpoint` مضبوطًا. يتقدّم الإعداد الخاص بالإشارة على متغير البيئة الخاص بها، والذي يتقدّم بدوره على نقطة النهاية المشتركة.                                                                                                         |
| `OTEL_SERVICE_NAME`                                                                                               | قيمة احتياطية لـ `diagnostics.otel.serviceName` عندما لا يكون مفتاح الإعداد مضبوطًا. اسم الخدمة الافتراضي هو `openclaw`.                                                                                                                                                                                                  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | قيمة احتياطية لبروتوكول النقل عندما لا يكون `diagnostics.otel.protocol` مضبوطًا. لا تُمكّن التصدير سوى القيمة `http/protobuf`.                                                                                                                                                                                                 |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث بنية لنطاق استدلال GenAI: أسماء النطاقات `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع النطاق `CLIENT`، و`gen_ai.provider.name` بدلًا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائمًا سمات محدودة ومنخفضة التنوّع بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما يكون تحميل مسبق آخر أو عملية مضيفة قد سجّل بالفعل حزمة OpenTelemetry SDK العامة. عندئذٍ يتجاوز الـ Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يربط مستمعي التشخيص ويحترم `traces` و`metrics` و`logs`.                                                                                    |

## الخصوصية والتقاط المحتوى

لا يُصدَّر محتوى النموذج أو الأداة الخام **افتراضيًا**. تحمل النطاقات معرّفات
محدودة (القناة، والمزوّد، والنموذج، وفئة الخطأ، ومعرّفات الطلبات الممثلة بالتجزئة فقط،
ومصدر الأداة، ومالك الأداة، واسم Skills ومصدرها)، ولا تتضمن مطلقًا نص المطالبة،
أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو مسارات ملفات Skills، أو مفاتيح الجلسات.
تُستبدل القيم التي تبدو كمفاتيح جلسات وكيل محددة النطاق (مثل التي تبدأ بـ
`agent:`) بالقيمة `unknown` في السمات منخفضة التنوّع. تحتفظ سجلات OTLP
بدرجة الخطورة، والمسجّل، وموقع الشيفرة، وسياق التتبّع الموثوق، والسمات
المنقّحة افتراضيًا؛ ولا يُصدَّر نص رسالة السجل الخام إلا
عندما تكون `diagnostics.otel.captureContent` قيمة منطقية `true`. لا تؤدي المفاتيح الفرعية
الدقيقة `captureContent.*` مطلقًا إلى تمكين محتويات السجلات. لا تُصدّر مقاييس المحادثة سوى
بيانات وصفية محدودة للحدث (الوضع، والنقل، والمزوّد، ونوع الحدث)، من دون
نصوص مفرّغة، أو حمولات صوتية، أو معرّفات جلسات، أو معرّفات أدوار، أو معرّفات مكالمات، أو معرّفات غرف، أو
رموز تسليم.

قد تتضمن طلبات النموذج الصادرة ترويسة W3C باسم `traceparent` تُنشأ فقط
من سياق تتبّع التشخيص المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` الحالية المقدمة من المستدعي، لذلك لا يمكن للـ Plugins أو
خيارات المزوّد المخصّصة انتحال تسلسل نسب التتبّع بين الخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون المُجمّع
وسياسة الاحتفاظ لديك معتمدين لنص المطالبة أو الاستجابة أو الأداة أو
مطالبة النظام. كل مفتاح فرعي مستقل:

- `inputMessages` - محتوى مطالبة المستخدم.
- `outputMessages` - محتوى استجابة النموذج.
- `toolInputs` - حمولات وسيطات الأداة.
- `toolOutputs` - حمولات نتائج الأداة.
- `systemPrompt` - مطالبة النظام/المطوّر المجمّعة.
- `toolDefinitions` - أسماء أدوات النموذج وأوصافها ومخططاتها.

عند تمكين أي مفتاح فرعي، تحصل نطاقات النموذج والأداة على سمات
`openclaw.content.*` محدودة ومنقّحة لتلك الفئة فقط.

<Note>
تُمكّن القيمة المنطقية `captureContent: true` كلًا من `inputMessages` و`outputMessages` و`toolInputs` و`toolOutputs` و`toolDefinitions` ومحتويات سجلات OTLP معًا، لكنها **لا** تُمكّن `systemPrompt`؛ اضبط `captureContent.systemPrompt: true` صراحةً إذا كنت تحتاج أيضًا إلى مطالبة النظام المجمّعة.
</Note>

يُلتقط محتوى `toolInputs`/`toolOutputs` لعمليات تنفيذ الأدوات في
وقت تشغيل الوكيل المضمّن (`openclaw.content.tool_input` و
`gen_ai.tool.call.arguments` في نطاقات الاكتمال/الخطأ؛
و`openclaw.content.tool_output` و`gen_ai.tool.call.result` في نطاقات
الاكتمال). تظل أسماء `openclaw.content.*` أسماء سمات OpenClaw
المستقرة؛ وتعكسها نُسخ `gen_ai.tool.call.*` لبرامج العرض الأصلية المتوافقة مع الاصطلاحات الدلالية.
تُصدر استدعاءات أدوات بيئات التشغيل الخارجية (Codex وClaude CLI)
نطاقات `tool.execution.*` من دون حمولات محتوى. ينتقل المحتوى الملتقط عبر
قناة موثوقة مخصّصة للمستمعين فقط، ولا يوضع مطلقًا على ناقل أحداث التشخيص
العام.

## أخذ العينات والتفريغ

- **التتبعات:** يضبط `diagnostics.otel.sampleRate` أداة `TraceIdRatioBasedSampler`
  على المقطع الجذري فقط (`0.0` يُسقط الكل، و`1.0` يحتفظ بالكل). عند عدم ضبطه، يُستخدم
  الإعداد الافتراضي لـ OpenTelemetry SDK (مفعّل دائمًا).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (مع فرض حد أدنى قدره
  `1000`)؛ وعند عدم ضبطه، يُستخدم الإعداد الافتراضي للتصدير الدوري في SDK.
- **السجلات:** تراعي سجلات OTLP الإعداد `logging.level` (مستوى سجل الملف)، وتستخدم
  مسار تنقيح سجلات التشخيص بدلًا من تنسيق وحدة التحكم. ينبغي للتثبيتات
  ذات الحجم الكبير تفضيل أخذ العينات/التصفية في مجمّع OTLP على أخذ العينات
  محليًا. اضبط `diagnostics.otel.logsExporter: "stdout"` عندما ترسل منصتك
  أصلًا stdout/stderr إلى معالج سجلات ولا يتوفر لديك مجمّع سجلات OTLP.
  تكون سجلات stdout كائن JSON واحدًا في كل سطر، ويحتوي على `ts` و`signal`
  و`service.name` ومستوى الخطورة والنص والسمات المنقّحة وحقول التتبع
  الموثوقة عند توفرها.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL في المستوى الأعلى `traceId`
  و`spanId` و`parentSpanId` و`traceFlags` عندما يحمل استدعاء التسجيل سياق
  تتبع تشخيصي صالحًا، ما يتيح لمعالجات السجلات ربط أسطر السجل المحلية
  بالمقاطع المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP وإطارات WebSocket في Gateway
  نطاق تتبع داخليًا للطلب. ترث السجلات وأحداث التشخيص داخل ذلك
  النطاق تتبع الطلب افتراضيًا، بينما تُنشأ مقاطع تشغيل الوكيل واستدعاء
  النموذج كعناصر فرعية كي تبقى ترويسات `traceparent` الخاصة بموفّر الخدمة
  ضمن التتبع نفسه.
- **ربط استدعاءات النموذج:** تتضمن مقاطع `openclaw.model.call` افتراضيًا
  أحجامًا آمنة لمكونات الموجّه، وسمات الرموز المميزة لكل استدعاء عندما
  تعرض نتيجة موفّر الخدمة بيانات الاستخدام. يظل `openclaw.model.usage`
  مقطع المحاسبة على مستوى التشغيل للتكلفة الإجمالية والسياق ولوحات معلومات
  القنوات، ويبقى ضمن التتبع التشخيصي نفسه عندما تكون لبيئة التشغيل المُصدِرة
  معلومات سياق تتبع موثوقة.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، السمات: `openclaw.token`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.agent`)
- `openclaw.cost.usd` (عداد، السمات: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، السمات: `openclaw.context`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.token.type` = `input`/`output`، `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، بالثواني، مقياس اصطلاحات GenAI الدلالية، السمات: `gen_ai.provider.name`، `gen_ai.operation.name`، `gen_ai.request.model`، و`error.type` اختياري)
- `openclaw.model_call.duration_ms` (مدرج تكراري، السمات: `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`، بالإضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم حمولة طلب النموذج النهائي بالبايت وفق UTF-8؛ من دون محتوى الحمولة الخام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم حمولات أجزاء الاستجابة المتدفقة بالبايت وفق UTF-8؛ لا تُحتسب في تحديثات النص والتفكير واستدعاءات الأدوات عالية التكرار سوى بايتات `delta` التزايدية؛ من دون محتوى الاستجابة الخام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الزمن المنقضي قبل أول حدث استجابة متدفقة)
- `openclaw.model.failover` (عداد، السمات: `openclaw.provider`، `openclaw.model`، `openclaw.failover.to_provider`، `openclaw.failover.to_model`، `openclaw.failover.reason`، `openclaw.failover.suspended`، `openclaw.lane`)
- `openclaw.skill.used` (عداد، السمات: `openclaw.skill.name`، `openclaw.skill.source`، `openclaw.skill.activation`، و`openclaw.agent` اختياري، و`openclaw.toolName` اختياري)

### تدفق الرسائل

- `openclaw.webhook.received` (عداد، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.webhook`)
- `openclaw.message.queued` (عداد، السمات: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.received` (عداد، السمات: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.dispatch.started` (عداد، السمات: `openclaw.channel`، `openclaw.source`)
- `openclaw.message.dispatch.completed` (عداد، السمات: `openclaw.channel`، `openclaw.outcome`، `openclaw.reason`، `openclaw.source`)
- `openclaw.message.dispatch.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.outcome`، `openclaw.reason`، `openclaw.source`)
- `openclaw.message.processed` (عداد، السمات: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، السمات: `openclaw.channel`، `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرج تكراري، السمات: `openclaw.channel`، `openclaw.delivery.kind`، `openclaw.outcome`، `openclaw.errorCategory`)

### المحادثة

- `openclaw.talk.event` (عداد، السمات: `openclaw.talk.event_type`، `openclaw.talk.mode`، `openclaw.talk.transport`، `openclaw.talk.brain`، `openclaw.talk.provider`)
- `openclaw.talk.event.duration_ms` (مدرج تكراري، السمات: نفسها في `openclaw.talk.event`؛ يُصدَّر عندما يُبلغ حدث محادثة عن مدة)
- `openclaw.talk.audio.bytes` (مدرج تكراري، السمات: نفسها في `openclaw.talk.event`؛ يُصدَّر لأحداث إطارات صوت المحادثة التي تُبلغ عن طول بالبايت)

### قوائم الانتظار والجلسات

- `openclaw.queue.lane.enqueue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، السمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، السمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، السمات: `openclaw.state`، `openclaw.reason`)
- `openclaw.session.stuck` (عداد، السمات: `openclaw.state`؛ يُصدَّر عند وجود بيانات محاسبية قديمة للجلسة قابلة للاسترداد)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، السمات: `openclaw.state`؛ يُصدَّر عند وجود بيانات محاسبية قديمة للجلسة قابلة للاسترداد)
- `openclaw.session.turn.created` (عداد، السمات: `openclaw.agent`، `openclaw.channel`، `openclaw.trigger`)
- `openclaw.session.recovery.requested` (عداد، السمات: `openclaw.state`، `openclaw.action`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.completed` (عداد، السمات: `openclaw.state`، `openclaw.action`، `openclaw.status`، `openclaw.active_work_kind`، `openclaw.reason`)
- `openclaw.session.recovery.age_ms` (مدرج تكراري، السمات: نفسها في عداد الاسترداد المطابق)
- `openclaw.run.attempt` (عداد، السمات: `openclaw.attempt`)

### بيانات قياس حيوية الجلسة

يمثل `diagnostics.stuckSessionWarnMs` عتبة عمر عدم إحراز تقدم لتشخيصات
حيوية الجلسة. لا تتقدم جلسة `processing` في العمر نحو هذه
العتبة ما دام OpenClaw يرصد تقدمًا في الرد أو الأداة أو الحالة أو الكتلة أو
بيئة تشغيل ACP. لا تُحتسب إشارات إبقاء الكتابة نشطة كتقدم، لذلك يظل بالإمكان
اكتشاف النموذج أو حاضنة التنفيذ إذا ظلا صامتين.

يصنّف OpenClaw الجلسات وفق العمل الذي لا يزال قادرًا على رصده:

- `session.long_running`: لا يزال العمل المضمّن النشط أو استدعاءات النموذج أو الأدوات
  يحرز تقدمًا. كما تُبلَّغ استدعاءات النموذج المملوكة التي تظل صامتة بعد
  `diagnostics.stuckSessionWarnMs` على أنها طويلة التشغيل قبل
  `diagnostics.stuckSessionAbortMs`، بحيث لا تبدو موفّرات النماذج البطيئة أو
  غير المتدفقة كجلسات Gateway متوقفة ما دام الإلغاء قابلًا للرصد.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يُبلغ عن
  تقدم حديث. تنتقل استدعاءات النموذج المملوكة من `session.long_running` إلى
  `session.stalled` عند بلوغ `diagnostics.stuckSessionAbortMs` أو تجاوزه؛ ولا
  يُتعامل مع نشاط النموذج/الأداة القديم غير المملوك على أنه عمل طويل التشغيل
  غير ضار. تظل عمليات التشغيل المضمّنة المتوقفة في وضع المراقبة فقط أولًا، ثم
  تبدأ الإلغاء والتصريف بعد `diagnostics.stuckSessionAbortMs` من دون تقدم كي
  تتمكن الأدوار المصطفة خلف المسار من الاستئناف. عند عدم ضبط عتبة الإلغاء،
  تكون قيمتها الافتراضية النافذة الممتدة الأكثر أمانًا، بما لا يقل عن 5 دقائق
  و3 أضعاف `diagnostics.stuckSessionWarnMs`.
- `session.stuck`: بيانات محاسبية قديمة للجلسة من دون عمل نشط، أو جلسة خاملة
  في قائمة الانتظار تتضمن نشاط نموذج/أداة قديمًا غير مملوك. يؤدي هذا إلى تحرير
  مسار الجلسة المتأثر فورًا بعد اجتياز بوابات الاسترداد.

يُصدر الاسترداد حدثي `session.recovery.requested` و
`session.recovery.completed` المنظّمين. لا تُعلَّم حالة الجلسة التشخيصية كخاملة
إلا بعد نتيجة استرداد مُعدِّلة (`aborted` أو `released`)، وفقط إذا
ظل جيل المعالجة نفسه هو الحالي.

لا يُصدر سوى `session.stuck` عداد `openclaw.session.stuck` ومدرج
`openclaw.session.stuck_age_ms` التكراري ومقطع `openclaw.session.stuck`.
تتراجع وتيرة تشخيصات `session.stuck` المتكررة ما دامت الجلسة بلا تغيير،
لذا ينبغي للوحات المعلومات التنبيه عند الزيادات المستمرة بدلًا من كل نبضة
Heartbeat. للاطلاع على خيار الإعداد والقيم الافتراضية، راجع
[مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics).

تُصدر تحذيرات الحيوية أيضًا:

- `openclaw.liveness.warning` (عداد، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_p99_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_delay_max_ms` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.event_loop_utilization` (مدرج تكراري، السمات: `openclaw.liveness.reason`)
- `openclaw.liveness.cpu_core_ratio` (مدرج تكراري، السمات: `openclaw.liveness.reason`)

### دورة حياة حاضنة التنفيذ

- `openclaw.harness.duration_ms` (مدرج تكراري، السمات: `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، و`openclaw.harness.phase` عند الأخطاء)

### تنفيذ الأدوات واكتشاف الحلقات

- `openclaw.tool.execution.duration_ms` (مدرج تكراري، السمات: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، بالإضافة إلى `openclaw.errorCategory` عند الأخطاء)
- `openclaw.tool.execution.blocked` (عداد، السمات: `gen_ai.tool.name`، `openclaw.toolName`، `openclaw.tool.source`، `openclaw.tool.owner`، `openclaw.tool.params.kind`، `openclaw.deniedReason`)
- `openclaw.tool.loop` (عداد، السمات: `openclaw.toolName`، `openclaw.loop.level`، `openclaw.loop.action`، `openclaw.loop.detector`، `openclaw.loop.count`، و`openclaw.loop.paired_tool` اختياري؛ يُصدَّر عند اكتشاف حلقة متكررة من استدعاءات الأدوات)

### التنفيذ

- `openclaw.exec.duration_ms` (مدرج تكراري، السمات: `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`)

### المكونات الداخلية للتشخيص (الذاكرة والحمولات وسلامة المُصدِّر)

- `openclaw.payload.large` (عداد، السمات: `openclaw.payload.surface`، `openclaw.payload.action`، `openclaw.channel`، `openclaw.plugin`، `openclaw.reason`)
- `openclaw.payload.large_bytes` (مدرج تكراري، السمات: نفسها في `openclaw.payload.large`)
- `openclaw.memory.rss_bytes` / `openclaw.memory.heap_used_bytes` / `openclaw.memory.heap_total_bytes` / `openclaw.memory.external_bytes` / `openclaw.memory.array_buffers_bytes` (مدرجات تكرارية، بلا سمات؛ عينات ذاكرة العملية)
- `openclaw.memory.pressure` (عداد، السمات: `openclaw.memory.level`، `openclaw.memory.reason`)
- `openclaw.diagnostic.async_queue.dropped` (عداد، السمات: `openclaw.diagnostic.async_queue.drop_class`؛ عمليات إسقاط داخلية بسبب الضغط العكسي في قائمة انتظار التشخيص)
- `openclaw.telemetry.exporter.events` (عداد، السمات: `openclaw.exporter`، `openclaw.signal`، `openclaw.status`، و`openclaw.reason` اختياري، و`openclaw.errorCategory` اختياري؛ قياس ذاتي لدورة حياة المُصدِّر وإخفاقاته)

## المقاطع المصدّرة

- `openclaw.model.usage`
  - `openclaw.channel`، `openclaw.provider`، `openclaw.model`
  - `openclaw.tokens.*` ‏(input/output/cache_read/cache_write/total)
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث الاصطلاحات الدلالية لـ GenAI
  - `gen_ai.request.model`، `gen_ai.operation.name`، `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`، `openclaw.channel`، `openclaw.provider`، `openclaw.model`، `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث الاصطلاحات الدلالية لـ GenAI
  - `gen_ai.request.model`، `gen_ai.operation.name`، `openclaw.provider`، `openclaw.model`، `openclaw.api`، `openclaw.transport`
  - `openclaw.errorCategory`، و`error.type`، و`openclaw.failureKind` الاختياري عند حدوث أخطاء
  - `openclaw.model_call.request_bytes`، `openclaw.model_call.response_bytes`، `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.model_call.prompt.input_messages_count`، `openclaw.model_call.prompt.input_messages_chars`، `openclaw.model_call.prompt.system_prompt_chars`، `openclaw.model_call.prompt.tool_definitions_count`، `openclaw.model_call.prompt.tool_definitions_chars`، `openclaw.model_call.prompt.total_chars` (أحجام آمنة للمكوّنات فقط، من دون نص المطالبة)
  - `openclaw.model_call.usage.*` و`gen_ai.usage.*` عندما تحمل نتيجة استدعاء النموذج بيانات استخدام المزوّد لذلك الاستدعاء الفردي
  - حدث مقطع التتبّع `openclaw.provider.request` بالسمة `openclaw.upstreamRequestIdHash` (محدودة وقائمة على التجزئة) عندما تعرض نتيجة المزوّد الأعلى معرّف طلب؛ ولا تُصدَّر المعرّفات الخام مطلقًا
  - عند استخدام `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`، تستخدم مقاطع تتبّع استدعاء النموذج أحدث اسم لمقطع تتبّع استدلال GenAI، وهو `{gen_ai.operation.name} {gen_ai.request.model}`، ونوع مقطع التتبّع `CLIENT` بدلًا من `openclaw.model.call`.
- `openclaw.harness.run`
  - `openclaw.harness.id`، `openclaw.harness.plugin`، `openclaw.outcome`، `openclaw.provider`، `openclaw.model`، `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`، `openclaw.harness.yield_detected`، `openclaw.harness.items.started`، `openclaw.harness.items.completed`، `openclaw.harness.items.active`
  - عند حدوث خطأ: `openclaw.harness.phase`، `openclaw.errorCategory`، و`openclaw.harness.cleanup_failed` الاختياري
- `openclaw.tool.execution`
  - `gen_ai.tool.name`، `gen_ai.operation.name` ‏(`execute_tool`)، `openclaw.toolName`، `openclaw.tool.source`، و`gen_ai.tool.call.id` الاختياري، و`openclaw.tool.owner`، و`openclaw.tool.params.*`
  - `openclaw.errorCategory`/`openclaw.errorCode` اختياريان عند حدوث أخطاء، و`openclaw.deniedReason` و`openclaw.outcome=blocked` عند الرفض بموجب السياسة أو بيئة العزل
- `openclaw.exec`
  - `openclaw.exec.target`، `openclaw.exec.mode`، `openclaw.outcome`، `openclaw.failureKind`، `openclaw.exec.command_length`، `openclaw.exec.exit_code`، `openclaw.exec.exit_signal`، `openclaw.exec.timed_out`
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
  - `openclaw.prompt.size`، `openclaw.history.size`، `openclaw.context.tokens`، `openclaw.errorCategory` (من دون محتوى المطالبة أو السجل أو الاستجابة أو مفتاح الجلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`، `openclaw.loop.level`، `openclaw.loop.action`، `openclaw.loop.detector`، `openclaw.loop.count`، و`openclaw.loop.paired_tool` الاختياري (من دون رسائل الحلقة أو المعلمات أو مخرجات الأداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`، `openclaw.memory.reason`، `openclaw.memory.rss_bytes`، `openclaw.memory.heap_used_bytes`، `openclaw.memory.heap_total_bytes`، `openclaw.memory.external_bytes`، `openclaw.memory.array_buffers_bytes`، و`openclaw.memory.threshold_bytes`/`openclaw.memory.rss_growth_bytes`/`openclaw.memory.window_ms` الاختيارية

عند تمكين التقاط المحتوى صراحةً، يمكن أيضًا لمقاطع تتبّع النموذج والأداة
تضمين سمات `openclaw.content.*` محدودة ومنقّحة لفئات
المحتوى المحددة التي اشتركت فيها.

## دليل أحداث التشخيص

تدعم الأحداث أدناه المقاييس ومقاطع التتبّع المذكورة أعلاه. ويمكن للـ Plugins أيضًا
الاشتراك فيها مباشرةً من دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` - الرموز المميزة والتكلفة والمدة والسياق والمزوّد/النموذج/القناة
  ومعرّفات الجلسات. يمثّل `usage` حساب المزوّد/الدوران لأغراض التكلفة والقياس عن بُعد؛
  ويمثّل `context.used` اللقطة الحالية للمطالبة/السياق، وقد يكون أقل من
  `usage.total` لدى المزوّد عند تضمين مدخلات مخزّنة مؤقتًا أو استدعاءات حلقات الأدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدادات مجمّعة: Webhooks/قائمة الانتظار/الجلسة)

**دورة حياة حاضنة الوكيل**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` -
  دورة الحياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId`، و`pluginId`
  الاختياري، والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الاكتمال
  `durationMs`، و`outcome`، و`resultClassification` الاختياري، و`yieldDetected`،
  وأعداد `itemLifecycle`. وتضيف الأخطاء `phase`
  ‏(`prepare`/`start`/`send`/`resolve`/`cleanup`)، و`errorCategory`،
  و`cleanupFailed` الاختياري.

**التنفيذ**

- `exec.process.completed` - النتيجة النهائية، والمدة، والهدف، والوضع، ورمز
  الخروج، ونوع الفشل. لا يُضمَّن نص الأمر ولا أدلة العمل.
- `exec.approval.followup_suppressed` - إسقاط متابعة موافقة قديمة
  بعد إعادة ربط الجلسة. يتضمن `approvalId`، و`reason`
  ‏(`session_rebound`)، و`phase` ‏(`direct_delivery` أو `gateway_preflight`)،
  والطابع الزمني للمرسِل. لا تُضمَّن مفاتيح الجلسات أو المسارات أو نص الأمر.

## من دون مُصدِّر

أبقِ أحداث التشخيص متاحة للـ Plugins أو لوجهات الاستقبال المخصصة من دون تشغيل
`diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

للحصول على مخرجات تصحيح مستهدفة من دون رفع `logging.level`، استخدم علامات
التشخيص. لا تتأثر العلامات بحالة الأحرف وتدعم أحرف البدل (`telegram.*` أو
`*`):

```json5
{
  diagnostics: { flags: ["telegram.http"] },
}
```

أو كتجاوز لمرة واحدة عبر متغير بيئة:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload openclaw gateway
```

تُرسل مخرجات العلامات إلى ملف السجل القياسي (`logging.file`)، وتظل
منقّحة بواسطة `logging.redactSensitive`. الدليل الكامل:
[علامات التشخيص](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

أو استبعد `diagnostics-otel` من `plugins.allow`، أو شغّل
`openclaw plugins disable diagnostics-otel`.

## ذو صلة

- [التسجيل](/ar/logging) - سجلات الملفات، ومخرجات وحدة التحكم، والمتابعة عبر CLI، وعلامة تبويب السجلات في واجهة التحكم
- [التفاصيل الداخلية لتسجيل Gateway](/ar/gateway/logging) - أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [علامات التشخيص](/ar/diagnostics/flags) - علامات سجلات تصحيح مستهدفة
- [تصدير التشخيص](/ar/gateway/diagnostics) - أداة حزمة دعم للمشغّل (منفصلة عن تصدير OTEL)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics) - المرجع الكامل لحقول `diagnostics.*`
