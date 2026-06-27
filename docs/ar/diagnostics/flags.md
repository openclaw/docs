---
read_when:
    - تحتاج إلى سجلات تصحيح أخطاء مستهدفة دون رفع مستويات التسجيل العامة
    - تحتاج إلى التقاط سجلات خاصة بالنظام الفرعي للدعم
summary: علامات التشخيص لسجلات التصحيح المستهدفة
title: علامات التشخيص
x-i18n:
    generated_at: "2026-06-27T17:34:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

تتيح لك علامات التشخيص تمكين سجلات تصحيح أخطاء موجهة دون تشغيل التسجيل المطوّل في كل مكان. العلامات اختيارية ولا يكون لها أي تأثير ما لم يتحقق منها نظام فرعي.

## كيف يعمل

- العلامات سلاسل نصية (غير حساسة لحالة الأحرف).
- يمكنك تمكين العلامات في الإعدادات أو عبر تجاوز من متغير بيئة.
- أحرف البدل مدعومة:
  - يطابق `telegram.*` القيمة `telegram.http`
  - يفعّل `*` كل العلامات

## التمكين عبر الإعدادات

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

علامات متعددة:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

أعد تشغيل Gateway بعد تغيير العلامات.

## تجاوز متغير البيئة (لمرة واحدة)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

تعطيل كل العلامات:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` هو تجاوز تعطيل على مستوى العملية: يعطّل
العلامات من كل من متغير البيئة والإعدادات لتلك العملية.

## علامات التحليل الزمني

تفعّل علامات المحلّل الزمني مقاطع توقيت موجهة دون رفع مستويات التسجيل
العامة. تكون معطلة افتراضيًا.

تمكين كل المقاطع المحكومة بالمحلّل الزمني لتشغيل Gateway واحد:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

تمكين مقاطع المحلّل الزمني لإرسال الردود فقط:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

تمكين مقاطع المحلّل الزمني لبدء تشغيل خادم تطبيق Codex/الأدوات/الخيوط فقط:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

تمكين علامات المحلّل الزمني من الإعدادات:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

أعد تشغيل Gateway بعد تغيير علامات الإعدادات. لتعطيل علامة محلّل زمني،
أزلها من `diagnostics.flags` ثم أعد التشغيل. لتعطيل كل علامات
التشخيص مؤقتًا حتى عندما تفعّل الإعدادات علامات المحلّل الزمني، ابدأ العملية باستخدام:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## عناصر الجدول الزمني

تكتب علامة `timeline` أحداث توقيت مهيكلة لبدء التشغيل ووقت التشغيل من أجل
حزم اختبار QA الخارجية:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

يمكنك أيضًا تمكينها في الإعدادات:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

ما يزال مسار ملف الجدول الزمني يأتي من
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. عند تمكين `timeline` من
الإعدادات فقط، لا تصدر أقدم مقاطع تحميل الإعدادات لأن OpenClaw لم
يقرأ الإعدادات بعد؛ وتستخدم مقاطع بدء التشغيل اللاحقة علامة الإعدادات.

`OPENCLAW_DIAGNOSTICS=1` و`OPENCLAW_DIAGNOSTICS=all` و
`OPENCLAW_DIAGNOSTICS=*` تفعّل الجدول الزمني أيضًا لأنها تفعّل كل
علامات التشخيص. فضّل `timeline` عندما تريد عنصر توقيت JSONL
فقط.

تستخدم سجلات الجدول الزمني غلاف `openclaw.diagnostics.v1`. يمكن أن تتضمن الأحداث
معرّفات العمليات، وأسماء المراحل، وأسماء المقاطع، والمدد، ومعرّفات Plugin، وأعداد التبعيات،
وعينات تأخر حلقة الأحداث، وأسماء عمليات المزوّد، وحالة خروج العملية الفرعية،
وأسماء/رسائل أخطاء بدء التشغيل. تعامل مع ملفات الجدول الزمني على أنها
عناصر تشخيص محلية؛ راجعها قبل مشاركتها خارج جهازك.

## أين تذهب السجلات

تصدر العلامات السجلات إلى ملف سجل التشخيص القياسي. افتراضيًا:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

إذا ضبطت `logging.file`، فاستخدم ذلك المسار بدلًا من ذلك. السجلات بصيغة JSONL (كائن JSON واحد في كل سطر). ما يزال التنقيح مطبقًا بناءً على `logging.redactSensitive`.

## استخراج السجلات

اختر أحدث ملف سجل:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

التصفية لتشخيصات Telegram HTTP:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

التصفية لتشخيصات Brave Search HTTP:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

أو تابع السجل أثناء إعادة إنتاج المشكلة:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

بالنسبة إلى Gateways البعيدة، يمكنك أيضًا استخدام `openclaw logs --follow` (راجع [/cli/logs](/ar/cli/logs)).

## ملاحظات

- إذا كان `logging.level` مضبوطًا على مستوى أعلى من `warn`، فقد تُحجب هذه السجلات. القيمة الافتراضية `info` مناسبة.
- تسجل `brave.http` عناوين URL/معلمات الاستعلام لطلبات Brave Search، وحالة/توقيت الاستجابة، وأحداث إصابة/فوات/كتابة الذاكرة المخبئية. لا تسجل مفاتيح API أو أجسام الاستجابات، لكن استعلامات البحث قد تكون حساسة.
- من الآمن ترك العلامات مفعّلة؛ فهي لا تؤثر إلا في حجم السجل للنظام الفرعي المحدد.
- استخدم [/logging](/ar/logging) لتغيير وجهات السجلات ومستوياتها والتنقيح.

## ذات صلة

- [تشخيصات Gateway](/ar/gateway/diagnostics)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
