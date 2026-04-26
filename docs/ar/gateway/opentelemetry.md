---
read_when:
    - تريد إرسال استخدام النماذج أو تدفق الرسائل أو مقاييس الجلسات في OpenClaw إلى مجمّع OpenTelemetry
    - أنت تقوم بتوصيل التتبعات أو المقاييس أو السجلات إلى Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو خلفية OTLP أخرى
    - تحتاج إلى أسماء المقاييس الدقيقة أو أسماء Span أو أشكال السمات لبناء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى أي مجمّع OpenTelemetry عبر Plugin ‏diagnostics-otel ‏(OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-04-26T11:30:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63fe66de2d046255a0e5b0eee8bbead2c9d278b8911bdc09bfee1e9c59294418
    source_path: gateway/opentelemetry.md
    workflow: 15
---

يصدر OpenClaw التشخيصات عبر Plugin المضمّن `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. أي مجمّع أو خلفية تقبل OTLP/HTTP
تعمل دون تغييرات في الشيفرة. وبالنسبة إلى سجلات الملفات المحلية وكيفية قراءتها، راجع
[السجلات](/ar/logging).

## كيف يترابط هذا معًا

- **أحداث التشخيصات** هي سجلات منظمة داخل العملية تصدرها
  Gateway وPlugins المضمّنة لعمليات تشغيل النموذج وتدفق الرسائل والجلسات
  والطوابير وexec.
- يشترك Plugin **`diagnostics-otel`** في تلك الأحداث ويصدرها على هيئة
  OpenTelemetry **metrics** و**traces** و**logs** عبر OTLP/HTTP.
- تتلقى **استدعاءات المزوّد** ترويسة W3C `traceparent` من سياق Span الموثوق
  الخاص باستدعاء النموذج في OpenClaw عندما يقبل نقل المزوّد
  الترويسات المخصصة. ولا يتم نشر سياق التتبع الصادر عن Plugin.
- لا يتم إرفاق المصدّرات إلا عندما يكون كل من سطح التشخيصات وPlugin
  مفعّلين، بحيث تبقى الكلفة داخل العملية قريبة من الصفر افتراضيًا.

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
يدعم `protocol` حاليًا `http/protobuf` فقط. ويتم تجاهل `grpc`.
</Note>

## الإشارات المُصدّرة

| الإشارة      | ما الذي يدخل فيها                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metrics**  | Counters وhistograms لاستخدام الرموز والكلفة ومدة التشغيل وتدفق الرسائل ومسارات الطابور وحالة الجلسة وexec وضغط الذاكرة.                    |
| **Traces**   | Spans لاستخدام النموذج واستدعاءات النموذج ودورة حياة harness وتنفيذ الأدوات وexec ومعالجة webhook/الرسائل وتجميع السياق وحلقات الأدوات. |
| **Logs**     | سجلات `logging.file` المنظمة والمُصدّرة عبر OTLP عندما تكون `diagnostics.otel.logs` مفعّلة.                                                |

بدّل `traces` و`metrics` و`logs` بشكل مستقل. وتكون الثلاثة مفعّلة افتراضيًا
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

| المتغير                                                                                                            | الغرض                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                                                                                      | تجاوز `diagnostics.otel.endpoint`. إذا كانت القيمة تتضمن أصلًا `/v1/traces` أو `/v1/metrics` أو `/v1/logs`، فسيتم استخدامها كما هي.                                                                                                       |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقاط نهاية خاصة بكل إشارة تُستخدم عندما يكون مفتاح الإعداد المطابق `diagnostics.otel.*Endpoint` غير مضبوط. ويفوز الإعداد الخاص بالإشارة على متغير البيئة الخاص بالإشارة، والذي يفوز بدوره على نقطة النهاية المشتركة.             |
| `OTEL_SERVICE_NAME`                                                                                                | تجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                      | تجاوز بروتوكول النقل (لا يتم اعتماد سوى `http/protobuf` حاليًا).                                                                                                                                                                            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                    | اضبطه على `gen_ai_latest_experimental` لإخراج أحدث سمة Span تجريبية لـ GenAI (`gen_ai.provider.name`) بدلًا من `gen_ai.system` القديم. وتستخدم Metrics الخاصة بـ GenAI دائمًا سمات دلالية محدودة ومنخفضة الكاردينالية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                          | اضبطه على `1` عندما يكون preload آخر أو عملية مضيف أخرى قد سجلت بالفعل OpenTelemetry SDK العام. عندها يتخطى Plugin دورة حياة NodeSDK الخاصة به لكنه يظل يوصّل مستمعي التشخيصات ويحترم `traces`/`metrics`/`logs`.                         |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيًا**. وتحمل Spans
معرّفات محدودة (القناة والمزوّد والنموذج وفئة الخطأ ومعرّفات الطلبات المعتمدة على التجزئة فقط)
ولا تتضمن أبدًا نص المطالبة أو نص الاستجابة أو مدخلات الأدوات أو مخرجات الأدوات أو
مفاتيح الجلسات.

قد تتضمن طلبات النموذج الصادرة ترويسة W3C `traceparent`. ويتم إنشاء هذه
الترويسة فقط من سياق تتبع التشخيصات المملوك لـ OpenClaw لاستدعاء النموذج النشط.
ويتم استبدال أي ترويسات `traceparent` يوفّرها المستدعي مسبقًا، بحيث لا تستطيع Plugins أو
خيارات المزوّد المخصصة انتحال نسب تتبع عابر للخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما تكون
سياسة المجمّع والاحتفاظ لديك معتمدة لنصوص المطالبات أو الاستجابات أو الأدوات أو
system-prompt. وكل مفتاح فرعي يتطلب اشتراكًا مستقلاً:

- `inputMessages` — محتوى مطالبة المستخدم.
- `outputMessages` — محتوى استجابة النموذج.
- `toolInputs` — حمولات وسائط الأدوات.
- `toolOutputs` — حمولات نتائج الأدوات.
- `systemPrompt` — مطالبة النظام/المطوّر المجمعة.

عند تفعيل أي مفتاح فرعي، تحصل Spans الخاصة بالنماذج والأدوات على
سمات `openclaw.content.*` محدودة ومنقّحة لذلك الصنف فقط.

## أخذ العينات والتفريغ

- **Traces:** ‏`diagnostics.otel.sampleRate` (لنطاق الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **Metrics:** ‏`diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **Logs:** تحترم سجلات OTLP قيمة `logging.level` (مستوى سجل الملف). ولا
  ينطبق تنقيح وحدة التحكم على سجلات OTLP. ويجب على التثبيتات كبيرة الحجم
  أن تفضّل أخذ العينات/التصفية في مجمّع OTLP بدلًا من أخذ العينات محليًا.

## المقاييس المُصدّرة

### استخدام النموذج

- `openclaw.tokens` ‏(counter، السمات: `openclaw.token` و`openclaw.channel` و`openclaw.provider` و`openclaw.model` و`openclaw.agent`)
- `openclaw.cost.usd` ‏(counter، السمات: `openclaw.channel` و`openclaw.provider` و`openclaw.model`)
- `openclaw.run.duration_ms` ‏(histogram، السمات: `openclaw.channel` و`openclaw.provider` و`openclaw.model`)
- `openclaw.context.tokens` ‏(histogram، السمات: `openclaw.context` و`openclaw.channel` و`openclaw.provider` و`openclaw.model`)
- `gen_ai.client.token.usage` ‏(histogram، مقياس semantic-conventions لـ GenAI، السمات: `gen_ai.token.type` = `input`/`output` و`gen_ai.provider.name` و`gen_ai.operation.name` و`gen_ai.request.model`)
- `gen_ai.client.operation.duration` ‏(histogram، بالثواني، مقياس semantic-conventions لـ GenAI، السمات: `gen_ai.provider.name` و`gen_ai.operation.name` و`gen_ai.request.model` و`error.type` الاختيارية)

### تدفق الرسائل

- `openclaw.webhook.received` ‏(counter، السمات: `openclaw.channel` و`openclaw.webhook`)
- `openclaw.webhook.error` ‏(counter، السمات: `openclaw.channel` و`openclaw.webhook`)
- `openclaw.webhook.duration_ms` ‏(histogram، السمات: `openclaw.channel` و`openclaw.webhook`)
- `openclaw.message.queued` ‏(counter، السمات: `openclaw.channel` و`openclaw.source`)
- `openclaw.message.processed` ‏(counter، السمات: `openclaw.channel` و`openclaw.outcome`)
- `openclaw.message.duration_ms` ‏(histogram، السمات: `openclaw.channel` و`openclaw.outcome`)
- `openclaw.message.delivery.started` ‏(counter، السمات: `openclaw.channel` و`openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` ‏(histogram، السمات: `openclaw.channel` و`openclaw.delivery.kind` و`openclaw.outcome` و`openclaw.errorCategory`)

### الطوابير والجلسات

- `openclaw.queue.lane.enqueue` ‏(counter، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` ‏(counter، السمات: `openclaw.lane`)
- `openclaw.queue.depth` ‏(histogram، السمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` ‏(histogram، السمات: `openclaw.lane`)
- `openclaw.session.state` ‏(counter، السمات: `openclaw.state` و`openclaw.reason`)
- `openclaw.session.stuck` ‏(counter، السمات: `openclaw.state`)
- `openclaw.session.stuck_age_ms` ‏(histogram، السمات: `openclaw.state`)
- `openclaw.run.attempt` ‏(counter، السمات: `openclaw.attempt`)

### دورة حياة Harness

- `openclaw.harness.duration_ms` ‏(histogram، السمات: `openclaw.harness.id` و`openclaw.harness.plugin` و`openclaw.outcome` و`openclaw.harness.phase` عند الأخطاء)

### Exec

- `openclaw.exec.duration_ms` ‏(histogram، السمات: `openclaw.exec.target` و`openclaw.exec.mode` و`openclaw.outcome` و`openclaw.failureKind`)

### باطن التشخيصات (الذاكرة وحلقة الأداة)

- `openclaw.memory.heap_used_bytes` ‏(histogram، السمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` ‏(histogram)
- `openclaw.memory.pressure` ‏(counter، السمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` ‏(counter، السمات: `openclaw.toolName` و`openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` ‏(histogram، السمات: `openclaw.toolName` و`openclaw.outcome`)

## Spans المُصدّرة

- `openclaw.model.usage`
  - `openclaw.channel` و`openclaw.provider` و`openclaw.model`
  - `openclaw.tokens.*` ‏(`input`/`output`/`cache_read`/`cache_write`/`total`)
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث semantic conventions الخاصة بـ GenAI
  - `gen_ai.request.model` و`gen_ai.operation.name` و`gen_ai.usage.*`
- `openclaw.run`
  - `openclaw.outcome` و`openclaw.channel` و`openclaw.provider` و`openclaw.model` و`openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system` افتراضيًا، أو `gen_ai.provider.name` عند الاشتراك في أحدث semantic conventions الخاصة بـ GenAI
  - `gen_ai.request.model` و`gen_ai.operation.name` و`openclaw.provider` و`openclaw.model` و`openclaw.api` و`openclaw.transport`
  - `openclaw.provider.request_id_hash` ‏(تجزئة محدودة قائمة على SHA لمعرّف طلب المزوّد في upstream؛ ولا يتم تصدير المعرّفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id` و`openclaw.harness.plugin` و`openclaw.outcome` و`openclaw.provider` و`openclaw.model` و`openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification` و`openclaw.harness.yield_detected` و`openclaw.harness.items.started` و`openclaw.harness.items.completed` و`openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase` و`openclaw.errorCategory` و`openclaw.harness.cleanup_failed` الاختيارية
- `openclaw.tool.execution`
  - `gen_ai.tool.name` و`openclaw.toolName` و`openclaw.errorCategory` و`openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target` و`openclaw.exec.mode` و`openclaw.outcome` و`openclaw.failureKind` و`openclaw.exec.command_length` و`openclaw.exec.exit_code` و`openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel` و`openclaw.webhook` و`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel` و`openclaw.webhook` و`openclaw.chatId` و`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel` و`openclaw.outcome` و`openclaw.chatId` و`openclaw.messageId` و`openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel` و`openclaw.delivery.kind` و`openclaw.outcome` و`openclaw.errorCategory` و`openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state` و`openclaw.ageMs` و`openclaw.queueDepth`
- `openclaw.context.assembled`
  - `openclaw.prompt.size` و`openclaw.history.size` و`openclaw.context.tokens` و`openclaw.errorCategory` (من دون محتوى المطالبة أو السجل أو الاستجابة أو مفتاح الجلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName` و`openclaw.outcome` و`openclaw.iterations` و`openclaw.errorCategory` (من دون رسائل الحلقة أو الوسائط أو مخرجات الأداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level` و`openclaw.memory.heap_used_bytes` و`openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن أن تتضمن Spans الخاصة بالنماذج والأدوات أيضًا
سمات `openclaw.content.*` محدودة ومنقّحة لفئات المحتوى المحددة
التي اشتركت فيها.

## كتالوج أحداث التشخيصات

تدعم الأحداث أدناه المقاييس وSpans المذكورة أعلاه. ويمكن لـ Plugins أيضًا الاشتراك
بها مباشرةً من دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` — الرموز والكلفة والمدة والسياق والمزوّد/النموذج/القناة
  ومعرّفات الجلسات. تمثل `usage` محاسبة المزوّد/الدور للكلفة والقياس؛
  بينما تمثل `context.used` اللقطة الحالية للمطالبة/السياق وقد تكون أقل من
  قيمة `usage.total` لدى المزوّد عندما تكون هناك مدخلات مخزنة مؤقتًا أو
  استدعاءات ضمن حلقة الأدوات.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**الطابور والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.stuck`
- `run.attempt`
- `diagnostic.heartbeat` ‏(عدادات مجمعة: webhooks/queue/session)

**دورة حياة Harness**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  دورة الحياة لكل تشغيل لـ agent harness. وتتضمن `harnessId` و`pluginId`
  اختياريًا، إضافة إلى المزوّد/النموذج/القناة ومعرّف التشغيل. ويضيف الاكتمال
  `durationMs` و`outcome` و`resultClassification` اختياريًا و`yieldDetected`
  وعدّادات `itemLifecycle`. وتضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`) و`errorCategory` و
  `cleanupFailed` الاختيارية.

**Exec**

- `exec.process.completed` — النتيجة النهائية والمدة والهدف والوضع ورمز
  الخروج ونوع الفشل. ولا يتم تضمين نص الأمر ولا أدلة العمل.

## بدون مُصدِّر

يمكنك إبقاء أحداث التشخيصات متاحة لـ Plugins أو لمصارف مخصصة من دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

للحصول على مخرجات تصحيح أخطاء مستهدفة دون رفع `logging.level`، استخدم
علامات التشخيصات. العلامات غير حساسة لحالة الأحرف وتدعم أحرف البدل (مثل `telegram.*` أو
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

تذهب مخرجات العلامات إلى ملف السجل القياسي (`logging.file`) وما تزال
تخضع للتنقيح بواسطة `logging.redactSensitive`. الدليل الكامل:
[علامات التشخيصات](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضًا عدم تضمين `diagnostics-otel` ضمن `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذو صلة

- [السجلات](/ar/logging) — ملفات السجلات ومخرجات وحدة التحكم وتتبع CLI وتبويب Logs في Control UI
- [الداخلية الخاصة بسجلات Gateway](/ar/gateway/logging) — أنماط سجل WS وبادئات الأنظمة الفرعية والتقاط وحدة التحكم
- [علامات التشخيصات](/ar/diagnostics/flags) — علامات سجلات تصحيح الأخطاء المستهدفة
- [تصدير التشخيصات](/ar/gateway/diagnostics) — أداة المشغّل الخاصة بحزمة الدعم (منفصلة عن تصدير OTEL)
- [مرجع الإعدادات](/ar/gateway/configuration-reference#diagnostics) — المرجع الكامل لحقول `diagnostics.*`
