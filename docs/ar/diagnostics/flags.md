---
read_when:
    - تحتاج إلى سجلات تصحيح أخطاء موجّهة دون رفع مستويات التسجيل العامة
    - تحتاج إلى جمع السجلات الخاصة بالنظام الفرعي لفريق الدعم
summary: علامات التشخيص لسجلات تصحيح أخطاء محددة
title: علامات التشخيص
x-i18n:
    generated_at: "2026-05-02T07:26:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1d0ff92d45cf1c5a12a7103ba5b97d656a55a13a7a4f2e86e26ba3a9cfae7687
    source_path: diagnostics/flags.md
    workflow: 16
---

تتيح لك علامات التشخيص تمكين سجلات تصحيح أخطاء موجّهة دون تشغيل التسجيل المطوّل في كل مكان. العلامات اختيارية ولا يكون لها أي تأثير إلا إذا تحقّق منها نظام فرعي.

## كيفية العمل

- العلامات سلاسل نصية (غير حساسة لحالة الأحرف).
- يمكنك تمكين العلامات في التكوين أو عبر تجاوز متغير بيئة.
- أحرف البدل مدعومة:
  - `telegram.*` يطابق `telegram.http`
  - `*` يمكّن كل العلامات

## التمكين عبر التكوين

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

## آثار المخطط الزمني

تكتب علامة `timeline` أحداث توقيت منظمة لبدء التشغيل ووقت التشغيل من أجل
حزم اختبار QA الخارجية:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

يمكنك أيضًا تمكينها في التكوين:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

لا يزال مسار ملف المخطط الزمني يأتي من
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH`. عند تمكين `timeline` من
التكوين فقط، لا تُصدر أقدم نطاقات تحميل التكوين لأن OpenClaw لم يكن قد
قرأ التكوين بعد؛ وتستخدم نطاقات بدء التشغيل اللاحقة علامة التكوين.

تؤدي `OPENCLAW_DIAGNOSTICS=1` و`OPENCLAW_DIAGNOSTICS=all` و
`OPENCLAW_DIAGNOSTICS=*` أيضًا إلى تمكين المخطط الزمني لأنها تمكّن كل
علامات التشخيص. فضّل `timeline` عندما لا تريد إلا أثر توقيت JSONL.

تستخدم سجلات المخطط الزمني غلاف `openclaw.diagnostics.v1`. يمكن أن تتضمن الأحداث
معرّفات العمليات، وأسماء المراحل، وأسماء النطاقات، والمدد، ومعرّفات plugins، وأعداد التبعيات،
وعينات تأخير حلقة الأحداث، وأسماء عمليات المزوّدين، وحالة خروج العمليات الفرعية،
وأسماء/رسائل أخطاء بدء التشغيل. تعامل مع ملفات المخطط الزمني باعتبارها
آثار تشخيص محلية؛ راجعها قبل مشاركتها خارج جهازك.

## أين تذهب السجلات

تُصدر العلامات السجلات إلى ملف سجل التشخيص القياسي. افتراضيًا:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

إذا عيّنت `logging.file`، فاستخدم ذلك المسار بدلًا من ذلك. السجلات بتنسيق JSONL (كائن JSON واحد في كل سطر). لا يزال التنقيح مطبّقًا بناءً على `logging.redactSensitive`.

## استخراج السجلات

اختر أحدث ملف سجل:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

صفِّ تشخيصات HTTP الخاصة بـTelegram:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

صفِّ تشخيصات HTTP الخاصة بـBrave Search:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

أو تابع السجل أثناء إعادة الإنتاج:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

بالنسبة إلى حالات Gateway البعيدة، يمكنك أيضًا استخدام `openclaw logs --follow` (راجع [/cli/logs](/ar/cli/logs)).

## ملاحظات

- إذا كان `logging.level` مضبوطًا على مستوى أعلى من `warn`، فقد تُحجب هذه السجلات. القيمة الافتراضية `info` مناسبة.
- تسجّل `brave.http` عناوين URL/معلمات الاستعلام لطلبات Brave Search، وحالة/توقيت الاستجابة، وأحداث إصابة/إخفاق/كتابة ذاكرة التخزين المؤقت. لا تسجّل مفاتيح API أو أجسام الاستجابات، لكن استعلامات البحث قد تكون حساسة.
- من الآمن ترك العلامات ممكّنة؛ فهي تؤثر فقط في حجم السجلات للنظام الفرعي المحدد.
- استخدم [/logging](/ar/logging) لتغيير وجهات السجلات ومستوياتها والتنقيح.

## ذو صلة

- [تشخيصات Gateway](/ar/gateway/diagnostics)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
