---
read_when:
    - تحتاج إلى سجلات تصحيح أخطاء موجّهة دون رفع مستويات التسجيل العامة
    - تحتاج إلى جمع سجلات خاصة بالنظام الفرعي لأغراض الدعم
summary: أعلام التشخيص لسجلات تصحيح الأخطاء المستهدفة
title: علامات التشخيص
x-i18n:
    generated_at: "2026-04-30T07:55:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 486051e54c456dedcae5dce59e253add3554d8417660bfc97a75d21fa5fdd6f5
    source_path: diagnostics/flags.md
    workflow: 16
---

تتيح لك أعلام التشخيص تمكين سجلات تصحيح أخطاء موجّهة من دون تشغيل التسجيل المطوّل في كل مكان. الأعلام اختيارية ولا يكون لها أي تأثير ما لم يتحقق منها نظام فرعي.

## كيف يعمل ذلك

- الأعلام سلاسل نصية (غير حساسة لحالة الأحرف).
- يمكنك تمكين الأعلام في الإعدادات أو عبر تجاوز بمتغير بيئة.
- أحرف البدل مدعومة:
  - يطابق `telegram.*` القيمة `telegram.http`
  - يمكّن `*` جميع الأعلام

## التمكين عبر الإعدادات

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

أعلام متعددة:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

أعد تشغيل Gateway بعد تغيير الأعلام.

## تجاوز بمتغير بيئة (لمرة واحدة)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

تعطيل جميع الأعلام:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## مخرجات الخط الزمني

يكتب علم `timeline` أحداث توقيت منظمة لبدء التشغيل ووقت التشغيل من أجل
أدوات QA الخارجية:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

يمكنك أيضًا تمكينه في الإعدادات:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

لا يزال مسار ملف الخط الزمني يأتي من
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. عند تمكين `timeline` من
الإعدادات فقط، لا تُصدر مقاطع تحميل الإعدادات الأولى لأن OpenClaw لم
يقرأ الإعدادات بعد؛ وتستخدم مقاطع بدء التشغيل اللاحقة علم الإعدادات.

تعمل أيضًا `OPENCLAW_DIAGNOSTICS=1` و`OPENCLAW_DIAGNOSTICS=all` و
`OPENCLAW_DIAGNOSTICS=*` على تمكين الخط الزمني لأنها تمكّن كل
أعلام التشخيص. فضّل `timeline` عندما تريد فقط مخرج توقيت JSONL.

تستخدم سجلات الخط الزمني مغلف `openclaw.diagnostics.v1`. يمكن أن تتضمن
الأحداث معرّفات العمليات، وأسماء المراحل، وأسماء المقاطع، والمدد، ومعرّفات Plugin، وأعداد التبعيات،
وعينات تأخير حلقة الأحداث، وأسماء عمليات المزوّد، وحالة خروج العملية الفرعية،
وأسماء/رسائل أخطاء بدء التشغيل. تعامل مع ملفات الخط الزمني كمخرجات تشخيص
محلية؛ راجعها قبل مشاركتها خارج جهازك.

## مكان حفظ السجلات

تُصدر الأعلام السجلات إلى ملف سجل التشخيص القياسي. افتراضيًا:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

إذا عيّنت `logging.file`، فاستخدم ذلك المسار بدلًا من ذلك. السجلات بصيغة JSONL (كائن JSON واحد في كل سطر). لا يزال التنقيح مطبقًا بناءً على `logging.redactSensitive`.

## استخراج السجلات

اختر أحدث ملف سجل:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

رشّح تشخيصات HTTP الخاصة بـ Telegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

أو تابع السجل أثناء إعادة إنتاج المشكلة:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

بالنسبة إلى Gateways البعيدة، يمكنك أيضًا استخدام `openclaw logs --follow` (راجع [/cli/logs](/ar/cli/logs)).

## ملاحظات

- إذا عُيّن `logging.level` إلى قيمة أعلى من `warn`، فقد تُحجب هذه السجلات. القيمة الافتراضية `info` مناسبة.
- من الآمن ترك الأعلام ممكّنة؛ فهي تؤثر فقط في حجم السجل للنظام الفرعي المحدد.
- استخدم [/logging](/ar/logging) لتغيير وجهات السجل ومستوياته والتنقيح.

## ذات صلة

- [تشخيصات Gateway](/ar/gateway/diagnostics)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
