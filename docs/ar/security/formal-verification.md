---
permalink: /security/formal-verification/
read_when:
    - مراجعة ضمانات أو حدود نموذج الأمان الرسمي
    - إعادة إنتاج أو تحديث عمليات التحقق من نموذج أمان TLA+/TLC
summary: نماذج أمنية متحقَّق منها آليًا للمسارات الأعلى خطورة في OpenClaw.
title: التحقق الشكلي (نماذج الأمان)
x-i18n:
    generated_at: "2026-05-06T08:13:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 298b92f27abb8321be807fe4d95c7cd568a0fb8f543d168863b2adb9b3ddcde4
    source_path: security/formal-verification.md
    workflow: 16
---

تتتبع هذه الصفحة **نماذج الأمان الرسمية** في OpenClaw (TLA+/TLC حاليًا؛ والمزيد حسب الحاجة).

> ملاحظة: قد تشير بعض الروابط الأقدم إلى اسم المشروع السابق.

**الهدف (النجم الهادي):** تقديم حجة متحقَّق منها آليًا بأن OpenClaw يفرض
سياسة الأمان المقصودة لديه (التفويض، وعزل الجلسات، وتقييد الأدوات،
والسلامة في حالات سوء التهيئة)، ضمن افتراضات صريحة.

**ما هذا (اليوم):** **مجموعة انحدار أمني** قابلة للتنفيذ وموجَّهة بالمهاجم:

- لكل ادعاء فحص نموذج قابل للتشغيل على فضاء حالات محدود.
- لدى العديد من الادعاءات **نموذج سلبي** مقترن ينتج أثر مثال مضاد لفئة أخطاء واقعية.

**ما ليس عليه هذا (بعد):** ليس إثباتًا بأن "OpenClaw آمن من جميع النواحي" أو بأن تنفيذ TypeScript الكامل صحيح.

## أين توجد النماذج

تُصان النماذج في مستودع منفصل: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models).

## تنبيهات مهمة

- هذه **نماذج**، وليست تنفيذ TypeScript الكامل. الانحراف بين النموذج والكود ممكن.
- النتائج محدودة بفضاء الحالات الذي يستكشفه TLC؛ اللون "الأخضر" لا يعني أمانًا يتجاوز الافتراضات والحدود المُمثَّلة في النموذج.
- تعتمد بعض الادعاءات على افتراضات بيئية صريحة (مثل النشر الصحيح، ومدخلات التهيئة الصحيحة).

## إعادة إنتاج النتائج

حاليًا، تُعاد إنتاج النتائج عبر استنساخ مستودع النماذج محليًا وتشغيل TLC (انظر أدناه). يمكن لإصدار لاحق أن يوفّر:

- نماذج تُشغَّل في CI مع آثار عامة (آثار الأمثلة المضادة، وسجلات التشغيل)
- سير عمل مستضاف "شغّل هذا النموذج" للفحوص الصغيرة والمحدودة

البدء:

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# Java 11+ required (TLC runs on the JVM).
# The repo vendors a pinned `tla2tools.jar` (TLA+ tools) and provides `bin/tlc` + Make targets.

make <target>
```

### تعريض Gateway وسوء تهيئة Gateway المفتوح

**الادعاء:** الربط بما يتجاوز loopback من دون مصادقة يمكن أن يجعل الاختراق البعيد ممكنًا / يزيد التعرض؛ الرمز المميز/كلمة المرور يحظران المهاجمين غير المصادقين (وفق افتراضات النموذج).

- تشغيلات خضراء:
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- أحمر (متوقع):
  - `make gateway-exposure-v2-negative`

انظر أيضًا: `docs/gateway-exposure-matrix.md` في مستودع النماذج.

### خط أنابيب تنفيذ Node (القدرة الأعلى خطورة)

**الادعاء:** يتطلب `exec host=node` (أ) قائمة سماح لأوامر Node مع الأوامر المعلنة و(ب) موافقة حية عند تهيئتها؛ تُرمَّز الموافقات برموز مميزة لمنع إعادة التشغيل (في النموذج).

- تشغيلات خضراء:
  - `make nodes-pipeline`
  - `make approvals-token`
- أحمر (متوقع):
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### مخزن الاقتران (تقييد الرسائل المباشرة)

**الادعاء:** تحترم طلبات الاقتران TTL وحدود الطلبات المعلّقة.

- تشغيلات خضراء:
  - `make pairing`
  - `make pairing-cap`
- أحمر (متوقع):
  - `make pairing-negative`
  - `make pairing-cap-negative`

### تقييد الإدخال (الإشارات + تجاوز أوامر التحكم)

**الادعاء:** في سياقات المجموعات التي تتطلب إشارة، لا يمكن لـ"أمر تحكم" غير مصرّح به تجاوز تقييد الإشارة.

- أخضر:
  - `make ingress-gating`
- أحمر (متوقع):
  - `make ingress-gating-negative`

### عزل التوجيه/مفتاح الجلسة

**الادعاء:** لا تنهار الرسائل المباشرة من أقران مختلفين إلى الجلسة نفسها ما لم تُربط/تُهيأ صراحة.

- أخضر:
  - `make routing-isolation`
- أحمر (متوقع):
  - `make routing-isolation-negative`

## v1++: نماذج محدودة إضافية (التزامن، وإعادة المحاولات، وصحة الأثر)

هذه نماذج لاحقة تشدّد الدقة حول أوضاع الفشل الواقعية (التحديثات غير الذرية، وإعادة المحاولات، وتشعّب الرسائل).

### تزامن مخزن الاقتران / التكرارية الآمنة

**الادعاء:** ينبغي لمخزن الاقتران فرض `MaxPending` والتكرارية الآمنة حتى تحت التداخلات (أي يجب أن تكون `check-then-write` ذرية / مقفلة؛ ويجب ألا ينشئ التحديث نُسخًا مكررة).

ما يعنيه ذلك:

- تحت الطلبات المتزامنة، لا يمكنك تجاوز `MaxPending` لقناة.
- يجب ألا تنشئ الطلبات/التحديثات المتكررة لنفس `(channel, sender)` صفوفًا معلّقة حية مكررة.

- تشغيلات خضراء:
  - `make pairing-race` (فحص حد ذري/مقفَل)
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- أحمر (متوقع):
  - `make pairing-race-negative` (سباق حد begin/commit غير ذري)
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### ترابط أثر الإدخال / التكرارية الآمنة

**الادعاء:** ينبغي للاستيعاب الحفاظ على ترابط الأثر عبر التشعّب وأن يكون تكراريًا آمنًا تحت إعادة محاولات المزوّد.

ما يعنيه ذلك:

- عندما يصبح حدث خارجي واحد رسائل داخلية متعددة، يحتفظ كل جزء بهوية الأثر/الحدث نفسها.
- لا تؤدي إعادة المحاولات إلى معالجة مزدوجة.
- إذا كانت معرّفات أحداث المزوّد مفقودة، يعود إلغاء التكرار إلى مفتاح آمن (مثل معرّف الأثر) لتجنب إسقاط أحداث متميزة.

- أخضر:
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- أحمر (متوقع):
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### أسبقية routing dmScope + identityLinks

**الادعاء:** يجب أن يُبقي التوجيه جلسات الرسائل المباشرة معزولة افتراضيًا، وألا يدمج الجلسات إلا عند التهيئة الصريحة (أسبقية القناة + روابط الهوية).

ما يعنيه ذلك:

- يجب أن تتغلب تجاوزات dmScope الخاصة بالقناة على الافتراضات العامة.
- يجب أن تدمج identityLinks فقط داخل المجموعات المرتبطة صراحة، لا عبر أقران غير مرتبطين.

- أخضر:
  - `make routing-precedence`
  - `make routing-identitylinks`
- أحمر (متوقع):
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## ذات صلة

- [نموذج التهديد](/ar/security/THREAT-MODEL-ATLAS)
- [المساهمة في نموذج التهديد](/ar/security/CONTRIBUTING-THREAT-MODEL)
