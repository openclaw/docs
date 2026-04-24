---
read_when:
    - تحتاج إلى نظرة عامة سهلة للمبتدئين حول السجلات
    - تريد ضبط مستويات السجل أو تنسيقاته
    - أنت تستكشف مشكلة وتحتاج إلى العثور على السجلات بسرعة
summary: 'نظرة عامة على السجلات: سجلات الملفات، ومخرجات الطرفية، وتتبع CLI، وواجهة Control UI'
title: نظرة عامة على السجلات
x-i18n:
    generated_at: "2026-04-24T07:50:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# السجلات

يحتوي OpenClaw على سطحين رئيسيين للسجلات:

- **سجلات الملفات** (أسطر JSON) التي يكتبها Gateway.
- **مخرجات الطرفية** المعروضة في الطرفيات وفي واجهة Gateway Debug UI.

يقوم تبويب **Logs** في Control UI بمتابعة ملف سجل gateway. تشرح هذه الصفحة مكان وجود
السجلات، وكيفية قراءتها، وكيفية ضبط مستويات السجل وتنسيقاته.

## مكان وجود السجلات

افتراضيًا، يكتب Gateway ملف سجل دوّارًا تحت:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

يستخدم التاريخ المنطقة الزمنية المحلية لمضيف gateway.

يمكنك تجاوز ذلك في `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## كيفية قراءة السجلات

### CLI: متابعة مباشرة (موصى به)

استخدم CLI لمتابعة ملف سجل gateway عبر RPC:

```bash
openclaw logs --follow
```

الخيارات المفيدة الحالية:

- `--local-time`: عرض الطوابع الزمنية وفق منطقتك الزمنية المحلية
- `--url <url>` / `--token <token>` / `--timeout <ms>`: علامات Gateway RPC القياسية
- `--expect-final`: علامة انتظار الاستجابة النهائية في RPC المدعوم بالوكيل (مقبولة هنا عبر طبقة العميل المشتركة)

أوضاع الإخراج:

- **جلسات TTY**: أسطر سجل منسقة، وملونة، ومنظمة.
- **جلسات غير TTY**: نص عادي.
- `--json`: JSON مفصول بأسطر (حدث سجل واحد في كل سطر).
- `--plain`: فرض النص العادي في جلسات TTY.
- `--no-color`: تعطيل ألوان ANSI.

عندما تمرر `--url` صريحًا، لا يطبّق CLI تلقائيًا بيانات الاعتماد من الإعدادات أو
البيئة؛ لذا ضمّن `--token` بنفسك إذا كان Gateway المستهدف
يتطلب المصادقة.

في وضع JSON، يصدر CLI كائنات موسومة بـ `type`:

- `meta`: بيانات تعريف التدفق (الملف، والمؤشر، والحجم)
- `log`: إدخال سجل محلل
- `notice`: تلميحات القطع / التدوير
- `raw`: سطر سجل غير محلل

إذا طلب Gateway المحلي عبر loopback الاقتران، يعود `openclaw logs` إلى
ملف السجل المحلي المضبوط تلقائيًا. أما الأهداف الصريحة عبر `--url` فلا
تستخدم هذا الرجوع الاحتياطي.

إذا تعذر الوصول إلى Gateway، يطبع CLI تلميحًا قصيرًا لتشغيل:

```bash
openclaw doctor
```

### Control UI ‏(الويب)

يقوم تبويب **Logs** في Control UI بمتابعة الملف نفسه باستخدام `logs.tail`.
راجع [/web/control-ui](/ar/web/control-ui) لمعرفة كيفية فتحه.

### سجلات القنوات فقط

لتصفية نشاط القنوات (WhatsApp/Telegram/إلخ)، استخدم:

```bash
openclaw channels logs --channel whatsapp
```

## تنسيقات السجلات

### سجلات الملفات (JSONL)

كل سطر في ملف السجل هو كائن JSON. ويقوم كل من CLI وControl UI بتحليل هذه
الإدخالات لعرض مخرجات منظمة (الوقت، والمستوى، والنظام الفرعي، والرسالة).

### مخرجات الطرفية

تكون سجلات الطرفية **مدركة لـ TTY** ومنسقة من أجل سهولة القراءة:

- بادئات الأنظمة الفرعية (مثل `gateway/channels/whatsapp`)
- تلوين المستويات (`info`/`warn`/`error`)
- وضع مضغوط أو JSON اختياري

يتم التحكم في تنسيق الطرفية عبر `logging.consoleStyle`.

### سجلات Gateway WebSocket

يمتلك `openclaw gateway` أيضًا تسجيل WebSocket للبروتوكول لحركة RPC:

- الوضع العادي: النتائج المهمة فقط (الأخطاء، وأخطاء التحليل، والاستدعاءات البطيئة)
- `--verbose`: كل حركة الطلب/الاستجابة
- `--ws-log auto|compact|full`: اختيار نمط العرض المفصل
- `--compact`: اسم مستعار لـ `--ws-log compact`

أمثلة:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## تهيئة السجلات

توجد كل إعدادات السجلات تحت `logging` في `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### مستويات السجل

- `logging.level`: مستوى **سجلات الملفات** (JSONL).
- `logging.consoleLevel`: مستوى تفصيل **الطرفية**.

يمكنك تجاوز كليهما عبر متغير البيئة **`OPENCLAW_LOG_LEVEL`** (مثلًا `OPENCLAW_LOG_LEVEL=debug`). تكون أولوية متغير البيئة أعلى من ملف الإعدادات، لذا يمكنك رفع مستوى التفصيل لتشغيل واحد من دون تعديل `openclaw.json`. ويمكنك أيضًا تمرير خيار CLI العام **`--log-level <level>`** (على سبيل المثال `openclaw --log-level debug gateway run`) الذي يتجاوز متغير البيئة لذلك الأمر.

يؤثر `--verbose` فقط في مخرجات الطرفية وفي تفصيل سجل WS؛ ولا يغيّر
مستويات سجل الملفات.

### أنماط الطرفية

`logging.consoleStyle`:

- `pretty`: سهل للبشر، وملون، مع طوابع زمنية.
- `compact`: مخرجات أكثر إحكامًا (الأفضل للجلسات الطويلة).
- `json`: JSON في كل سطر (لمعالجات السجل).

### التنقيح

يمكن أن تقوم ملخصات الأدوات بتنقيح الرموز الحساسة قبل وصولها إلى الطرفية:

- `logging.redactSensitive`: ‏`off` | `tools` ‏(الافتراضي: `tools`)
- `logging.redactPatterns`: قائمة سلاسل regex لتجاوز المجموعة الافتراضية

يؤثر التنقيح على **مخرجات الطرفية فقط** ولا يغيّر سجلات الملفات.

## التشخيصات + OpenTelemetry

التشخيصات هي أحداث منظمة وقابلة للقراءة آليًا لتشغيلات النماذج **وكذلك**
لقياس تدفق الرسائل (webhooks، والطوابير، وحالة الجلسة). وهي **لا** تحل محل السجلات؛ بل توجد لتغذية المقاييس، وtraces، والمصدّرات الأخرى.

تُصدَر أحداث التشخيص داخل العملية، لكن المصدّرات لا ترتبط إلا عند تفعيل
التشخيصات + Plugin الخاصة بالمصدّر.

### OpenTelemetry مقابل OTLP

- **OpenTelemetry (OTel)**: نموذج البيانات + SDKs لـ traces، والمقاييس، والسجلات.
- **OTLP**: بروتوكول النقل المستخدم لتصدير بيانات OTel إلى مجمّع/خلفية.
- يصدّر OpenClaw حاليًا عبر **OTLP/HTTP (protobuf)**.

### الإشارات المصدّرة

- **المقاييس**: عدادات + histograms ‏(استخدام الرموز، وتدفق الرسائل، والطوابير).
- **Traces**: spans لاستخدام النماذج + معالجة webhook/الرسائل.
- **السجلات**: تُصدَّر عبر OTLP عندما تكون `diagnostics.otel.logs` مفعلة. وقد يكون
  حجم السجلات كبيرًا؛ لذا ضع `logging.level` ومرشحات المصدّر في الحسبان.

### فهرس أحداث التشخيص

استخدام النموذج:

- `model.usage`: الرموز، والتكلفة، والمدة، والسياق، وprovider/model/channel، ومعرّفات الجلسة.

تدفق الرسائل:

- `webhook.received`: دخول webhook لكل قناة.
- `webhook.processed`: معالجة webhook + المدة.
- `webhook.error`: أخطاء معالج webhook.
- `message.queued`: وضع الرسالة في طابور المعالجة.
- `message.processed`: النتيجة + المدة + خطأ اختياري.

الطابور + الجلسة:

- `queue.lane.enqueue`: إدراج في مسار طابور الأوامر + العمق.
- `queue.lane.dequeue`: إزالة من مسار طابور الأوامر + زمن الانتظار.
- `session.state`: انتقال حالة الجلسة + السبب.
- `session.stuck`: تحذير تعطل الجلسة + العمر.
- `run.attempt`: بيانات تعريف إعادة المحاولة/المحاولة.
- `diagnostic.heartbeat`: عدادات مجمعة (webhooks/الطابور/الجلسة).

### تفعيل التشخيصات (من دون مصدّر)

استخدم هذا إذا كنت تريد إتاحة أحداث التشخيص لـ Plugins أو لمصارف مخصصة:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### علامات التشخيص (سجلات مستهدفة)

استخدم العلامات لتشغيل سجلات تصحيح إضافية ومستهدفة من دون رفع `logging.level`.
العلامات غير حساسة لحالة الأحرف وتدعم wildcards ‏(مثل `telegram.*` أو `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

تجاوز عبر البيئة (لمرة واحدة):

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

ملاحظات:

- تذهب سجلات العلامات إلى ملف السجل القياسي (نفس `logging.file`).
- يظل الإخراج مُنقحًا وفقًا لـ `logging.redactSensitive`.
- الدليل الكامل: [/diagnostics/flags](/ar/diagnostics/flags).

### التصدير إلى OpenTelemetry

يمكن تصدير التشخيصات عبر Plugin ‏`diagnostics-otel` ‏(OTLP/HTTP). ويعمل هذا
مع أي مجمّع/خلفية OpenTelemetry تقبل OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

ملاحظات:

- يمكنك أيضًا تفعيل Plugin باستخدام `openclaw plugins enable diagnostics-otel`.
- لا يدعم `protocol` حاليًا إلا `http/protobuf`. أما `grpc` فيتم تجاهله.
- تتضمن المقاييس استخدام الرموز، والتكلفة، وحجم السياق، ومدة التشغيل، وعدادات/هيستوغرامات
  تدفق الرسائل (webhooks، والطوابير، وحالة الجلسة، وعمق الطابور/الانتظار).
- يمكن تبديل traces/المقاييس باستخدام `traces` / `metrics` ‏(الافتراضي: مفعّل). وتتضمن traces
  spans استخدام النموذج بالإضافة إلى spans معالجة webhook/الرسائل عند التفعيل.
- اضبط `headers` عندما يتطلب مجمّعك المصادقة.
- متغيرات البيئة المدعومة: `OTEL_EXPORTER_OTLP_ENDPOINT`،
  و`OTEL_SERVICE_NAME`، و`OTEL_EXPORTER_OTLP_PROTOCOL`.

### المقاييس المصدّرة (الأسماء + الأنواع)

استخدام النموذج:

- `openclaw.tokens` ‏(counter، السمات: `openclaw.token` و`openclaw.channel`،
  و`openclaw.provider`، و`openclaw.model`)
- `openclaw.cost.usd` ‏(counter، السمات: `openclaw.channel` و`openclaw.provider`،
  و`openclaw.model`)
- `openclaw.run.duration_ms` ‏(histogram، السمات: `openclaw.channel`،
  و`openclaw.provider`، و`openclaw.model`)
- `openclaw.context.tokens` ‏(histogram، السمات: `openclaw.context`،
  و`openclaw.channel`، و`openclaw.provider`، و`openclaw.model`)

تدفق الرسائل:

- `openclaw.webhook.received` ‏(counter، السمات: `openclaw.channel`،
  و`openclaw.webhook`)
- `openclaw.webhook.error` ‏(counter، السمات: `openclaw.channel`،
  و`openclaw.webhook`)
- `openclaw.webhook.duration_ms` ‏(histogram، السمات: `openclaw.channel`،
  و`openclaw.webhook`)
- `openclaw.message.queued` ‏(counter، السمات: `openclaw.channel`،
  و`openclaw.source`)
- `openclaw.message.processed` ‏(counter، السمات: `openclaw.channel`،
  و`openclaw.outcome`)
- `openclaw.message.duration_ms` ‏(histogram، السمات: `openclaw.channel`،
  و`openclaw.outcome`)

الطوابير + الجلسات:

- `openclaw.queue.lane.enqueue` ‏(counter، السمات: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` ‏(counter، السمات: `openclaw.lane`)
- `openclaw.queue.depth` ‏(histogram، السمات: `openclaw.lane` أو
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` ‏(histogram، السمات: `openclaw.lane`)
- `openclaw.session.state` ‏(counter، السمات: `openclaw.state` و`openclaw.reason`)
- `openclaw.session.stuck` ‏(counter، السمات: `openclaw.state`)
- `openclaw.session.stuck_age_ms` ‏(histogram، السمات: `openclaw.state`)
- `openclaw.run.attempt` ‏(counter، السمات: `openclaw.attempt`)

### spans المصدّرة (الأسماء + السمات الأساسية)

- `openclaw.model.usage`
  - `openclaw.channel` و`openclaw.provider` و`openclaw.model`
  - `openclaw.sessionKey` و`openclaw.sessionId`
  - `openclaw.tokens.*` ‏(input/output/cache_read/cache_write/total)
- `openclaw.webhook.processed`
  - `openclaw.channel` و`openclaw.webhook` و`openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel` و`openclaw.webhook` و`openclaw.chatId`،
    و`openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel` و`openclaw.outcome` و`openclaw.chatId`،
    و`openclaw.messageId` و`openclaw.sessionKey` و`openclaw.sessionId`،
    و`openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state` و`openclaw.ageMs` و`openclaw.queueDepth`،
    و`openclaw.sessionKey` و`openclaw.sessionId`

### أخذ العينات والتفريغ

- أخذ عينات traces: ‏`diagnostics.otel.sampleRate` ‏(من 0.0 إلى 1.0، للجذور فقط).
- فترة تصدير المقاييس: ‏`diagnostics.otel.flushIntervalMs` ‏(الحد الأدنى 1000ms).

### ملاحظات البروتوكول

- يمكن ضبط نقاط نهاية OTLP/HTTP عبر `diagnostics.otel.endpoint` أو
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- إذا كانت نقطة النهاية تحتوي بالفعل على `/v1/traces` أو `/v1/metrics`، فسيتم استخدامها كما هي.
- إذا كانت نقطة النهاية تحتوي بالفعل على `/v1/logs`، فسيتم استخدامها كما هي للسجلات.
- تؤدي `diagnostics.otel.logs` إلى تفعيل تصدير سجلات OTLP لمخرجات المسجل الرئيسي.

### سلوك تصدير السجلات

- تستخدم سجلات OTLP السجلات المنظمة نفسها المكتوبة إلى `logging.file`.
- تحترم `logging.level` ‏(مستوى سجل الملفات). ولا ينطبق تنقيح الطرفية
  على سجلات OTLP.
- يجب على التثبيتات ذات الحجم المرتفع تفضيل أخذ العينات/التصفية في مجمع OTLP.

## نصائح لاستكشاف الأخطاء وإصلاحها

- **هل Gateway غير قابل للوصول؟** شغّل `openclaw doctor` أولًا.
- **هل السجلات فارغة؟** تحقق من أن Gateway يعمل ويكتب إلى مسار الملف
  الموجود في `logging.file`.
- **هل تحتاج إلى مزيد من التفاصيل؟** اضبط `logging.level` على `debug` أو `trace` وأعد المحاولة.

## ذو صلة

- [الآليات الداخلية لسجلات Gateway](/ar/gateway/logging) — أنماط سجل WS، وبادئات الأنظمة الفرعية، والتقاط الطرفية
- [التشخيصات](/ar/gateway/configuration-reference#diagnostics) — تصدير OpenTelemetry وإعدادات تتبع الذاكرة المؤقتة
