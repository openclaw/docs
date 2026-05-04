---
read_when:
    - تريد إرسال بيانات استخدام النماذج في OpenClaw، أو تدفق الرسائل، أو مقاييس الجلسات إلى جامع OpenTelemetry
    - أنت تربط آثار التتبع أو المقاييس أو السجلات بـ Grafana أو Datadog أو Honeycomb أو New Relic أو Tempo أو خلفية OTLP أخرى
    - تحتاج إلى أسماء المقاييس الدقيقة، أو أسماء النطاقات، أو بُنى السمات لإنشاء لوحات معلومات أو تنبيهات
summary: صدّر تشخيصات OpenClaw إلى أي مجمّع OpenTelemetry عبر Plugin diagnostics-otel (OTLP/HTTP)
title: تصدير OpenTelemetry
x-i18n:
    generated_at: "2026-05-04T07:07:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b5be99b29fe5f13132b03cfeaf3ce978ee16f29e307aa76769bc414b5ca35f
    source_path: gateway/opentelemetry.md
    workflow: 16
---

OpenClaw يصدر التشخيصات عبر Plugin الرسمي `diagnostics-otel`
باستخدام **OTLP/HTTP (protobuf)**. يعمل أي مجمّع أو واجهة خلفية تقبل OTLP/HTTP
من دون تغييرات في الكود. لسجلات الملفات المحلية وكيفية قراءتها، راجع
[التسجيل](/ar/logging).

## كيف تعمل المكونات معا

- **أحداث التشخيصات** هي سجلات منظمة داخل العملية يصدرها
  Gateway والـ plugins المضمنة لتشغيلات النماذج، وتدفق الرسائل، والجلسات، والطوابير،
  و exec.
- **Plugin `diagnostics-otel`** يشترك في تلك الأحداث ويصدرها على هيئة
  **مقاييس** و**تتبعات** و**سجلات** OpenTelemetry عبر OTLP/HTTP.
- **استدعاءات المزوّدين** تتلقى ترويسة W3C `traceparent` من سياق امتداد استدعاء النموذج الموثوق في OpenClaw
  عندما يقبل نقل المزوّد الترويسات المخصصة. لا يتم تمرير سياق التتبع الصادر من Plugin.
- لا تُرفق المصدّرات إلا عندما يكون كل من سطح التشخيصات والـ Plugin
  مفعّلين، لذلك تبقى تكلفة التشغيل داخل العملية قريبة من الصفر افتراضيا.

## بدء سريع

لعمليات التثبيت المعبأة، ثبّت الـ Plugin أولا:

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

يمكنك أيضا تفعيل الـ Plugin من CLI:

```bash
openclaw plugins enable diagnostics-otel
```

<Note>
يدعم `protocol` حاليا `http/protobuf` فقط. يتم تجاهل `grpc`.
</Note>

## الإشارات المصدّرة

| الإشارة      | ما الذي يدخل فيها                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **المقاييس** | عدادات ومدرجات تكرارية لاستخدام الرموز، والتكلفة، ومدة التشغيل، وتدفق الرسائل، ومسارات الطوابير، وحالة الجلسة، و exec، وضغط الذاكرة.          |
| **التتبعات**  | امتدادات لاستخدام النماذج، واستدعاءات النماذج، ودورة حياة الحاضنة، وتنفيذ الأدوات، و exec، ومعالجة Webhook/الرسائل، وتجميع السياق، وحلقات الأدوات. |
| **السجلات**    | سجلات `logging.file` منظمة تُصدّر عبر OTLP عند تفعيل `diagnostics.otel.logs`.                                              |

بدّل `traces` و`metrics` و`logs` بشكل مستقل. تكون الثلاثة مفعّلة افتراضيا
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
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` / `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | تجاوزات نقاط نهاية خاصة بالإشارة تُستخدم عندما لا يكون مفتاح الإعداد المطابق `diagnostics.otel.*Endpoint` مضبوطا. الإعداد الخاص بالإشارة يتغلب على متغير البيئة الخاص بالإشارة، والذي يتغلب بدوره على نقطة النهاية المشتركة.                                     |
| `OTEL_SERVICE_NAME`                                                                                               | يتجاوز `diagnostics.otel.serviceName`.                                                                                                                                                                                                   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                                                                                     | يتجاوز بروتوكول النقل عبر الشبكة (لا يُعتد حاليا إلا بـ `http/protobuf`).                                                                                                                                                                        |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                                                                                   | اضبطه على `gen_ai_latest_experimental` لإصدار أحدث سمة تجريبية لامتداد GenAI (`gen_ai.provider.name`) بدلا من `gen_ai.system` القديم. تستخدم مقاييس GenAI دائما سمات دلالية محدودة ومنخفضة التعددية بغض النظر عن ذلك. |
| `OPENCLAW_OTEL_PRELOADED`                                                                                         | اضبطه على `1` عندما يكون تحميل مسبق آخر أو عملية مضيفة قد سجّل بالفعل OpenTelemetry SDK العام. عندها يتجاوز الـ Plugin دورة حياة NodeSDK الخاصة به، لكنه يظل يوصّل مستمعي التشخيصات ويحترم `traces`/`metrics`/`logs`.                |

## الخصوصية والتقاط المحتوى

لا يتم تصدير محتوى النموذج/الأداة الخام **افتراضيا**. تحمل الامتدادات
معرّفات محدودة (القناة، المزوّد، النموذج، فئة الخطأ، معرّفات الطلبات على هيئة تجزئة فقط)
ولا تتضمن أبدا نص المطالبة، أو نص الاستجابة، أو مدخلات الأدوات، أو مخرجات الأدوات، أو
مفاتيح الجلسات.

قد تتضمن طلبات النماذج الصادرة ترويسة W3C `traceparent`. تُنشأ تلك الترويسة
فقط من سياق التتبع التشخيصي المملوك لـ OpenClaw لاستدعاء النموذج النشط.
تُستبدل ترويسات `traceparent` المقدمة من المستدعي إن وجدت، لذلك لا تستطيع plugins أو
خيارات المزوّد المخصصة انتحال أصل تتبع عابر للخدمات.

اضبط `diagnostics.otel.captureContent.*` على `true` فقط عندما يكون المجمّع وسياسة
الاحتفاظ لديك معتمدين لنص المطالبة، أو الاستجابة، أو الأداة، أو مطالبة النظام.
كل مفتاح فرعي اختياري بشكل مستقل:

- `inputMessages` — محتوى مطالبة المستخدم.
- `outputMessages` — محتوى استجابة النموذج.
- `toolInputs` — حمولات وسائط الأدوات.
- `toolOutputs` — حمولات نتائج الأدوات.
- `systemPrompt` — مطالبة النظام/المطور المجمّعة.

عند تفعيل أي مفتاح فرعي، تحصل امتدادات النماذج والأدوات على سمات
`openclaw.content.*` محدودة ومنقحة لتلك الفئة فقط.

## أخذ العينات والتفريغ

- **التتبعات:** `diagnostics.otel.sampleRate` (امتداد الجذر فقط، `0.0` يسقط الكل،
  و`1.0` يحتفظ بالكل).
- **المقاييس:** `diagnostics.otel.flushIntervalMs` (الحد الأدنى `1000`).
- **السجلات:** تحترم سجلات OTLP قيمة `logging.level` (مستوى سجل الملف). تستخدم
  مسار تنقيح سجل التشخيصات، وليس تنسيق وحدة التحكم. ينبغي لعمليات التثبيت كثيفة الحجم
  تفضيل أخذ العينات/الترشيح في مجمّع OTLP على أخذ العينات المحلي.
- **ربط سجلات الملفات:** تتضمن سجلات ملفات JSONL القيم العليا `traceId`
  و`spanId` و`parentSpanId` و`traceFlags` عندما يحمل استدعاء التسجيل سياق
  تتبع تشخيصي صالحا، مما يتيح لمعالجات السجلات ربط أسطر السجلات المحلية
  بالامتدادات المصدّرة.
- **ربط الطلبات:** تنشئ طلبات HTTP في Gateway وإطارات WebSocket نطاق تتبع طلب
  داخلي. ترث السجلات وأحداث التشخيصات داخل ذلك النطاق تتبع الطلب افتراضيا،
  بينما تُنشأ امتدادات تشغيل الوكيل واستدعاء النموذج كأبناء لكي تبقى ترويسات
  `traceparent` الخاصة بالمزوّد على التتبع نفسه.

## المقاييس المصدّرة

### استخدام النموذج

- `openclaw.tokens` (عداد، سمات: `openclaw.token`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`, `openclaw.agent`)
- `openclaw.cost.usd` (عداد، سمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.run.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (مدرج تكراري، سمات: `openclaw.context`, `openclaw.channel`, `openclaw.provider`, `openclaw.model`)
- `gen_ai.client.token.usage` (مدرج تكراري، مقياس اصطلاحات دلالية لـ GenAI، سمات: `gen_ai.token.type` = `input`/`output`, `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`)
- `gen_ai.client.operation.duration` (مدرج تكراري، بالثواني، مقياس اصطلاحات دلالية لـ GenAI، سمات: `gen_ai.provider.name`, `gen_ai.operation.name`, `gen_ai.request.model`, اختياري `error.type`)
- `openclaw.model_call.duration_ms` (مدرج تكراري، سمات: `openclaw.provider`, `openclaw.model`, `openclaw.api`, `openclaw.transport`, إضافة إلى `openclaw.errorCategory` و`openclaw.failureKind` في الأخطاء المصنفة)
- `openclaw.model_call.request_bytes` (مدرج تكراري، حجم حمولة طلب النموذج النهائية بالبايت وفق UTF-8؛ من دون محتوى الحمولة الخام)
- `openclaw.model_call.response_bytes` (مدرج تكراري، حجم أحداث استجابة النموذج المتدفقة بالبايت وفق UTF-8؛ من دون محتوى الاستجابة الخام)
- `openclaw.model_call.time_to_first_byte_ms` (مدرج تكراري، الزمن المنقضي قبل أول حدث استجابة متدفق)

### تدفق الرسائل

- `openclaw.webhook.received` (عداد، سمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.error` (عداد، سمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.webhook`)
- `openclaw.message.queued` (عداد، سمات: `openclaw.channel`, `openclaw.source`)
- `openclaw.message.processed` (عداد، سمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.outcome`)
- `openclaw.message.delivery.started` (عداد، سمات: `openclaw.channel`, `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (مدرج تكراري، سمات: `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`, `openclaw.errorCategory`)

### الطوابير والجلسات

- `openclaw.queue.lane.enqueue` (عداد، سمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (عداد، سمات: `openclaw.lane`)
- `openclaw.queue.depth` (مدرج تكراري، سمات: `openclaw.lane` أو `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (مدرج تكراري، سمات: `openclaw.lane`)
- `openclaw.session.state` (عداد، سمات: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (عداد، سمات: `openclaw.state`؛ يصدر فقط لمسك دفاتر الجلسات القديمة من دون عمل نشط)
- `openclaw.session.stuck_age_ms` (مدرج تكراري، سمات: `openclaw.state`؛ يصدر فقط لمسك دفاتر الجلسات القديمة من دون عمل نشط)
- `openclaw.run.attempt` (عداد، سمات: `openclaw.attempt`)

### قياسات حيوية الجلسة

`diagnostics.stuckSessionWarnMs` هو حد عمر عدم التقدم لتشخيصات
حيوية الجلسة. لا تتقدم جلسة `processing` نحو هذا الحد
ما دام OpenClaw يلاحظ تقدما في وقت التشغيل للرد، أو الأداة، أو الحالة، أو الكتلة، أو ACP.
لا تُحتسب إشارات إبقاء الكتابة حيّة كتقدم، لذلك لا يزال بالإمكان
اكتشاف نموذج أو حاضنة صامتة.

يصنّف OpenClaw الجلسات حسب العمل الذي لا يزال بإمكانه ملاحظته:

- `session.long_running`: عمل مضمّن نشط، أو استدعاءات نموذج، أو استدعاءات أدوات
  لا تزال تحرز تقدمًا.
- `session.stalled`: يوجد عمل نشط، لكن التشغيل النشط لم يبلغ عن
  تقدم حديث. تبقى عمليات التشغيل المضمّنة المتوقفة في وضع المراقبة فقط في البداية، ثم
  تُجهض وتُفرّغ بعد 10 دقائق على الأقل و5x `diagnostics.stuckSessionWarnMs`
  من دون تقدم كي تتمكن الأدوار المصطفة خلف المسار من الاستئناف.
- `session.stuck`: سجلات جلسة قديمة بلا عمل نشط. يؤدي هذا إلى تحرير
  مسار الجلسة المتأثر فورًا.

يبث `session.stuck` فقط عدّاد `openclaw.session.stuck`، ومخطط
`openclaw.session.stuck_age_ms` التكراري، وامتداد `openclaw.session.stuck`.
تتراجع تشخيصات `session.stuck` المتكررة بينما تبقى الجلسة
من دون تغيير، لذا ينبغي أن تنبّه لوحات المعلومات عند الزيادات المستمرة بدلًا من كل
نبضة Heartbeat. للمقبض الإعدادي والقيم الافتراضية، راجع
[مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics).

### دورة حياة الحاضنة

- `openclaw.harness.duration_ms` (مخطط تكراري، سمات: `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.harness.phase` عند الأخطاء)

### Exec

- `openclaw.exec.duration_ms` (مخطط تكراري، سمات: `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### التفاصيل الداخلية للتشخيصات (الذاكرة وحلقة الأدوات)

- `openclaw.memory.heap_used_bytes` (مخطط تكراري، سمات: `openclaw.memory.kind`)
- `openclaw.memory.rss_bytes` (مخطط تكراري)
- `openclaw.memory.pressure` (عدّاد، سمات: `openclaw.memory.level`)
- `openclaw.tool.loop.iterations` (عدّاد، سمات: `openclaw.toolName`, `openclaw.outcome`)
- `openclaw.tool.loop.duration_ms` (مخطط تكراري، سمات: `openclaw.toolName`, `openclaw.outcome`)

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
  - `openclaw.errorCategory` و`openclaw.failureKind` اختياري عند الأخطاء
  - `openclaw.model_call.request_bytes`, `openclaw.model_call.response_bytes`, `openclaw.model_call.time_to_first_byte_ms`
  - `openclaw.provider.request_id_hash` (تجزئة محدودة مستندة إلى SHA لمعرّف طلب المزوّد المنبع؛ لا تُصدّر المعرّفات الخام)
- `openclaw.harness.run`
  - `openclaw.harness.id`, `openclaw.harness.plugin`, `openclaw.outcome`, `openclaw.provider`, `openclaw.model`, `openclaw.channel`
  - عند الاكتمال: `openclaw.harness.result_classification`, `openclaw.harness.yield_detected`, `openclaw.harness.items.started`, `openclaw.harness.items.completed`, `openclaw.harness.items.active`
  - عند الخطأ: `openclaw.harness.phase`, `openclaw.errorCategory`, و`openclaw.harness.cleanup_failed` اختياري
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
  - `openclaw.prompt.size`, `openclaw.history.size`, `openclaw.context.tokens`, `openclaw.errorCategory` (بلا محتوى مطالبة أو سجل أو استجابة أو مفتاح جلسة)
- `openclaw.tool.loop`
  - `openclaw.toolName`, `openclaw.outcome`, `openclaw.iterations`, `openclaw.errorCategory` (بلا رسائل حلقة أو معاملات أو مخرجات أداة)
- `openclaw.memory.pressure`
  - `openclaw.memory.level`, `openclaw.memory.heap_used_bytes`, `openclaw.memory.rss_bytes`

عند تفعيل التقاط المحتوى صراحةً، يمكن أن تتضمن امتدادات النموذج والأداة أيضًا
سمات `openclaw.content.*` محدودة ومنقّحة لفئات المحتوى المحددة
التي اخترت الاشتراك فيها.

## فهرس أحداث التشخيص

تدعم الأحداث أدناه المقاييس والامتدادات أعلاه. يمكن لـ Plugins أيضًا الاشتراك
فيها مباشرة من دون تصدير OTLP.

**استخدام النموذج**

- `model.usage` — الرموز، التكلفة، المدة، السياق، المزوّد/النموذج/القناة،
  ومعرّفات الجلسات. `usage` هو احتساب المزوّد/الدور للتكلفة والقياس؛
  و`context.used` هو لقطة المطالبة/السياق الحالية ويمكن أن يكون أقل من
  `usage.total` الخاصة بالمزوّد عندما تكون مدخلات مخزنة مؤقتًا أو استدعاءات حلقة أدوات
  متضمنة.

**تدفق الرسائل**

- `webhook.received` / `webhook.processed` / `webhook.error`
- `message.queued` / `message.processed`
- `message.delivery.started` / `message.delivery.completed` / `message.delivery.error`

**قائمة الانتظار والجلسة**

- `queue.lane.enqueue` / `queue.lane.dequeue`
- `session.state` / `session.long_running` / `session.stalled` / `session.stuck`
- `run.attempt` / `run.progress`
- `diagnostic.heartbeat` (عدّادات مجمعة: webhooks/queue/session)

**دورة حياة الحاضنة**

- `harness.run.started` / `harness.run.completed` / `harness.run.error` —
  دورة حياة لكل تشغيل لحاضنة الوكيل. تتضمن `harnessId`، و`pluginId` اختياريًا،
  والمزوّد/النموذج/القناة، ومعرّف التشغيل. يضيف الاكتمال
  `durationMs` و`outcome` و`resultClassification` اختياريًا و`yieldDetected`
  وعدّادات `itemLifecycle`. تضيف الأخطاء `phase`
  (`prepare`/`start`/`send`/`resolve`/`cleanup`) و`errorCategory` و
  `cleanupFailed` اختياريًا.

**Exec**

- `exec.process.completed` — النتيجة النهائية، والمدة، والهدف، والوضع، ورمز الخروج،
  ونوع الفشل. لا يُضمّن نص الأمر ولا مجلدات العمل.

## من دون مصدّر

يمكنك إبقاء أحداث التشخيصات متاحة لـ Plugins أو مصارف مخصصة من دون
تشغيل `diagnostics-otel`:

```json5
{
  diagnostics: { enabled: true },
}
```

لمخرجات تصحيح مستهدفة من دون رفع `logging.level`، استخدم أعلام التشخيصات.
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
منقّحة بواسطة `logging.redactSensitive`. الدليل الكامل:
[أعلام التشخيصات](/ar/diagnostics/flags).

## التعطيل

```json5
{
  diagnostics: { otel: { enabled: false } },
}
```

يمكنك أيضًا ترك `diagnostics-otel` خارج `plugins.allow`، أو تشغيل
`openclaw plugins disable diagnostics-otel`.

## ذو صلة

- [التسجيل](/ar/logging) — سجلات الملفات، ومخرجات وحدة التحكم، ومتابعة CLI، وتبويب سجلات واجهة التحكم
- [التفاصيل الداخلية لتسجيل Gateway](/ar/gateway/logging) — أنماط سجلات WS، وبادئات الأنظمة الفرعية، والتقاط وحدة التحكم
- [أعلام التشخيصات](/ar/diagnostics/flags) — أعلام سجلات التصحيح المستهدفة
- [تصدير التشخيصات](/ar/gateway/diagnostics) — أداة حزمة دعم المشغّل (منفصلة عن تصدير OTEL)
- [مرجع التهيئة](/ar/gateway/configuration-reference#diagnostics) — مرجع كامل لحقول `diagnostics.*`
