---
read_when:
    - تحتاج إلى سجلات تصحيح أخطاء مستهدفة دون رفع مستويات التسجيل العامة
    - تحتاج إلى التقاط سجلات خاصة بنظام فرعي محدد لأغراض الدعم
summary: علامات التشخيص لسجلات تصحيح الأخطاء المستهدفة
title: علامات التشخيص
x-i18n:
    generated_at: "2026-04-24T07:39:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7e5ec9c5e28ef51f1e617baf62412897df8096f227a74d86a0824e269aafd9d
    source_path: diagnostics/flags.md
    workflow: 15
---

تتيح لك علامات التشخيص تفعيل سجلات تصحيح أخطاء مستهدفة من دون تشغيل التسجيل التفصيلي في كل مكان. وتكون العلامات اختيارية ولا تؤثر إلا إذا كان نظام فرعي ما يتحقق منها.

## كيف يعمل ذلك

- العلامات عبارة عن سلاسل نصية (غير حساسة لحالة الأحرف).
- يمكنك تفعيل العلامات في التهيئة أو عبر تجاوز باستخدام متغير بيئة.
- تُدعَم الرموز الشاملة:
  - `telegram.*` يطابق `telegram.http`
  - `*` يفعّل جميع العلامات

## التفعيل عبر التهيئة

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
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

أعد تشغيل Gateway بعد تغيير العلامات.

## تجاوز عبر متغير البيئة (لمرة واحدة)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

تعطيل جميع العلامات:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## أين تذهب السجلات

تُصدِر العلامات السجلات إلى ملف سجلات التشخيص القياسي. افتراضيًا:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

إذا قمت بضبط `logging.file`، فاستخدم ذلك المسار بدلًا من ذلك. تكون السجلات بصيغة JSONL ‏(كائن JSON واحد في كل سطر). وما زال إخفاء البيانات الحساسة مطبقًا وفق `logging.redactSensitive`.

## استخراج السجلات

اختر أحدث ملف سجل:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

صفِّ السجلات الخاصة بتشخيصات Telegram HTTP:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

أو راقبها أثناء إعادة إنتاج المشكلة:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

وبالنسبة إلى Gateways البعيدة، يمكنك أيضًا استخدام `openclaw logs --follow` ‏(راجع [/cli/logs](/ar/cli/logs)).

## ملاحظات

- إذا كانت قيمة `logging.level` أعلى من `warn`، فقد يتم كبت هذه السجلات. والقيمة الافتراضية `info` مناسبة.
- من الآمن إبقاء العلامات مفعّلة؛ فهي تؤثر فقط في حجم السجلات الخاصة بالنظام الفرعي المحدد.
- استخدم [/logging](/ar/logging) لتغيير وجهات السجلات، والمستويات، وإخفاء البيانات الحساسة.

## ذو صلة

- [تشخيصات Gateway](/ar/gateway/diagnostics)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting)
