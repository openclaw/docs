---
read_when:
    - تريد إرسال استخدام نموذج OpenClaw، أو تدفق الرسائل، أو مقاييس الجلسة إلى مجمّع OpenTelemetry
    - تقوم بربط التتبعات أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو واجهة خلفية أخرى تدعم OTLP
    - تحتاج إلى أسماء المقاييس الدقيقة أو أسماء النطاقات الدقيقة أو بُنى السمات الدقيقة لبناء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى أي مجمّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-04-30T08:01:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9d06589d281223ebb57e76f6f19441d30c138b9f7b0636198ab7bae5fad3c8a
    source_path: gateway/opentelemetry.md
    workflow: 16
---

يصدّر OpenClaw التشخيصات عبر Plugin `diagnostics-otel` المضمّن
باستخدام **OTLP/HTTP (protobuf)**. يعمل أي مجمّع أو واجهة خلفية تقبل OTLP/HTTP
دون تغييرات في الشيفرة. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تترابط المكونات

- **أحداث التشخيصات** هي سجلات منظّمة داخل العملية يصدرها
  Gateway وPlugins المضمّنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والصفوف،
  وexec.
- يشترك **Plugin `diagnostics-otel`** في تلك الأحداث ويصدّرها على هيئة
  **مقاييس** و**تتبعات** و**سجلات** من OpenTelemetry عبر OTLP/HTTP.
- تتلقى **استدعاءات المزوّدين** ترويسة W3C `traceparent` من سياق مقطع استدعاء النموذج
  الموثوق الخاص بـ OpenClaw عندما يقبل نقل المزوّد الترويسات المخصّصة.
  لا يُمرَّر سياق التتبع الصادر عن Plugin.
- لا تُرفَق المصدّرات إلا عندما يكون كل من سطح التشخيصات وPlugin
  مفعّلين، لذلك تبقى تكلفة التنفيذ داخل العملية قريبة من الصفر افتراضيًا.

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

## الإشارات المصدَّرة

| الإشارة      | ما الذي يدخل فيها                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتدفق الرسائل، ومسارات الصفوف، وحالة الجلسات، وexec، وضغط الذاكرة.          |
| **التتبعات**  | مقاطع لاستخدام النماذج، واستدعاءات النماذج، ودورة حياة الحزمة، وتنفيذ الأدوات، وexec، ومعالجة webhook/الرسائل، وتجميع السياق، وحلقات الأدوات. |
| **السجلات**    | سجلات `logging.file` منظّمة تُصدَّر عبر OTLP عند تفعيل `diagnostics.otel.logs`.                                              |

بدّل `traces` و`metrics` و`logs` بشكل مستقل. تكون الثلاثة جميعًا مفعّلة افتراضيًا
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
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                     | يتجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تحتوي بالفعل على `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، فستُستخدم كما هي.                                                                                                          |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات لنقاط نهاية خاصة بالإشارة تُستخدم عندما يكون مفتاح الإعداد المطابق `diagnostics.otel.*Endpoint` غير مضبوط. يفوز الإعداد الخاص بالإشارة على متغير البيئة الخاص بالإشارة، والذي يفوز بدوره على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل السلكي (لا يُحترم اليوم إلا `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث سمة تجريبية لمقطع GenAI (`gen_ai.provider.name`) بدلًا من `gen_ai.system` القديمة. تستخدم مقاييس GenAI دائمًا سمات دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما تكون عملية تحميل مسبق أو عملية مضيفة أخرى قد سجّلت SDK العام لـ OpenTelemetry بالفعل. عندها يتجاوز Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يربط مستمعي التشخيصات ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يُصدَّر محتوى النموذج/الأداة الخام **افتراضيًا**. تحمل المقاطع
معرّفات محدودة (القناة، والمزوّد، والنموذج، وفئة الخطأ، ومعرّفات الطلبات كهاش فقط)
ولا تتضمن أبدًا نص المطالبة، أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو
مفاتيح الجلسة.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُولَّد تلك الترويسة
فقط من سياق تتبع التشخيصات المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` المقدّمة من المستدعي، لذلك لا يمكن لـ Plugins أو
خيارات المزوّد المخصّصة انتحال نسب تتبع عبر الخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون المجمّع وسياسة
الاحتفاظ لديك معتمدين لنص المطالبة أو الاستجابة أو الأداة أو مطالبة النظام.
كل مفتاح فرعي اختياري بشكل مستقل:

- `inputMessages` — محتوى مطالبة المستخدم.
- `outputMessages` — محتوى استجابة النموذج.
- `toolInputs` — حمولات وسيطات الأداة.
- `toolOutputs` — حمولات نتائج الأداة.
- `systemPrompt` — مطالبة النظام/المطوّر المجمّعة.

عند تفعيل أي مفتاح فرعي، تحصل مقاطع النماذج والأدوات على سمات
`openclaw.content.*` محدودة ومنقّحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (للمقطع الجذري فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP `logging.level` (مستوى سجل الملف). تستخدم مسار
  تنقيح سجل التشخيصات، وليس تنسيق وحدة التحكم. يجب أن تفضّل التثبيتات عالية الحجم
  أخذ العينات/الترشيح في مجمّع OTLP على أخذ العينات المحلي.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL `traceId` و`spanId` و`parentSpanId` و`traceFlags` في المستوى الأعلى عندما يحمل استدعاء السجل سياق تتبع تشخيصات صالحًا، مما يتيح لمعالجات السجلات ربط أسطر السجل المحلية بالمقاطع المصدَّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP الخاصة بـ Gateway وإطارات WebSocket نطاق تتبع طلب داخليًا. ترث السجلات وأحداث التشخيصات داخل ذلك النطاق تتبع الطلب افتراضيًا، بينما تُنشأ مقاطع تشغيل الوكيل واستدعاء النموذج كأبناء بحيث تبقى ترويسات `traceparent` الخاصة بالمزوّد على التتبع نفسه.

## المقاييس المصدَّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، سمات: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عداد، سمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، سمات: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اتفاقيات GenAI الدلالية، سمات: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، بالثواني، مقياس اتفاقيات GenAI الدلالية، سمات: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختياري `error.type`)
- `openclaw.model_call.duration_ms` (مدرج تكراري، سمات: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`، إضافةً إلى `openclaw.errorCategory` و`openclaw.failureKind` عند الأخطاء المصنّفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم حمولة طلب النموذج النهائي ببايتات UTF-8؛ دون محتوى الحمولة الخام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم أحداث استجابة النموذج المتدفقة ببايتات UTF-8؛ دون محتوى الاستجابة الخام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الوقت المنقضي قبل أول حدث استجابة متدفقة)

### تدفق الرسائل

- `openclaw.webhook.received` (عداد، سمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، سمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (عداد، سمات: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (عداد، سمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، سمات: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### الصفوف والجلسات

- `openclaw.queue.lane.enqueue` (عداد، سمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، سمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، سمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، سمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، سمات: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عداد، سمات: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، سمات: `openclaw.state`)
- `openclaw.run.attempt` (عداد، سمات: `openclaw.attempt`)

### دورة حياة الحزمة

- `openclaw.harness.duration_ms` (مدرج تكراري، سمات: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, و`openclaw.harness.phase` عند الأخطاء)

### Exec

- `openclaw.exec.duration_ms` (مدرج تكراري، سمات: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### الأجزاء الداخلية للتشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مدرج تكراري، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مدرج تكراري)
- `openclaw.memory.pressure` (عداد، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عداد، السمات: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مدرج تكراري، السمات: `openclaw.toolName`, `openclaw.outcome`)

## النطاقات المصدَّرة

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (الإدخال/الإخراج/قراءة_التخزين_المؤقت/كتابة_التخزين_المؤقت/الإجمالي)
  - `gen_ai.system` افتراضياً، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`, `gen_ai.operation.name`, `gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضياً، أو `gen_ai.provider.name` عند تفعيل أحدث اصطلاحات GenAI الدلالية
  - `gen_ai.request.model`, `gen_ai.operation.name`, `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`
  - `openclaw.errorCategory` و`openclaw.failureKind` الاختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرّف طلب المزوّد العلوي؛ لا تُصدَّر المعرّفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`, `openclaw.errorCategory`, `openclaw.harness.cleanup_failed` الاختياري
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (لا توجد مطالبة أو سجل أو استجابة أو محتوى مفتاح جلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (لا توجد رسائل حلقة أو معاملات أو مخرجات أداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن أن تتضمن نطاقات النموذج والأداة أيضاً
سمات `openclaw.content.*` محدودة ومنقّحة لفئات المحتوى المحددة
التي اخترت تفعيلها.

## كتالوج أحداث التشخيص

تدعم الأحداث أدناه المقاييس والنطاقات أعلاه. يمكن أيضاً للـ Plugins الاشتراك
فيها مباشرةً دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` — الرموز، التكلفة، المدة، السياق، المزوّد/النموذج/القناة،
  معرّفات الجلسة. `usage` هو حساب المزوّد/الدورة للتكلفة والقياس عن بُعد؛
  `context.used` هو لقطة المطالبة/السياق الحالية ويمكن أن يكون أقل من
  `usage.total` لدى المزوّد عند وجود إدخال مخزّن مؤقتاً أو استدعاءات حلقة الأدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` (عدادات مجمّعة: Webhook/قائمة الانتظار/الجلسة)

**دورة حياة الحاضنة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  دورة حياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId`، و`pluginId` اختيارياً،
  والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الاكتمال
  `durationMs` و`outcome`، و`resultClassification` اختيارياً، و`yieldDetected`،
  وأعداد `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`) و`errorCategory` و
  `cleanupFailed` الاختياري.

**التنفيذ**

- `exec.process.completed` — النتيجة النهائية للطرفية، والمدة، والهدف، والوضع، ورمز الخروج، ونوع الفشل. لا يتم تضمين نص الأمر وأدلة العمل.

## بدون مُصدّر

يمكنك إبقاء أحداث التشخيص متاحة للـ Plugins أو المصارف المخصصة دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

لإخراج تصحيح أخطاء موجّه دون رفع `logging.level`، استخدم أعلام التشخيص.
الأعلام غير حساسة لحالة الأحرف وتدعم أحرف البدل (مثلاً `telegram.*` أو
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

ينتقل إخراج الأعلام إلى ملف السجل القياسي (`logging.file`) ويظل
منقّحاً بواسطة `logging.redactSensitive`. الدليل الكامل:
[أعلام التشخيص](/ar/diagnostics/flags).

## تعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضاً ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذات صلة

- [التسجيل](/ar/logging) — سجلات الملفات، ومخرجات وحدة التحكم، وتتبع CLI، وتبويب سجلات واجهة Control UI
- [الآليات الداخلية لتسجيل Gateway](/ar/gateway/logging) — أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيص](/ar/diagnostics/flags) — أعلام سجلات تصحيح أخطاء موجّهة
- [تصدير التشخيص](/ar/gateway/diagnostics) — أداة حزمة دعم المشغّل (منفصلة عن تصدير OTEL)
- [مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics) — مرجع كامل لحقول `diagnostics.*`
