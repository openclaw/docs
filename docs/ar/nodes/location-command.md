---
read_when:
    - إضافة دعم عقدة الموقع أو واجهة مستخدم الأذونات
    - تصميم أذونات الموقع أو سلوك التشغيل في المقدمة على Android
summary: أمر الموقع للعُقد (location.get)، وأوضاع الأذونات، وسلوك العمل في المقدمة على Android
title: أمر الموقع
x-i18n:
    generated_at: "2026-05-06T08:03:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## الخلاصة

- `location.get` هو أمر عقدة (عبر `node.invoke`).
- معطّل افتراضيًا.
- تستخدم إعدادات تطبيق Android محددًا: إيقاف / أثناء الاستخدام.
- مفتاح تبديل منفصل: الموقع الدقيق.

## لماذا محدد (وليس مجرد مفتاح تبديل)

أذونات نظام التشغيل متعددة المستويات. يمكننا عرض محدد داخل التطبيق، لكن نظام التشغيل يظل هو من يقرر المنح الفعلي.

- قد يعرض iOS/macOS خيار **أثناء الاستخدام** أو **دائمًا** في مطالبات/إعدادات النظام.
- يدعم تطبيق Android حاليًا موقع الواجهة الأمامية فقط.
- الموقع الدقيق هو منح منفصل (iOS 14+ "دقيق"، وAndroid "fine" مقابل "coarse").

يقود المحدد في واجهة المستخدم الوضع المطلوب من جانبنا؛ أما المنح الفعلي فيوجد في إعدادات نظام التشغيل.

## نموذج الإعدادات

لكل جهاز عقدة:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

سلوك واجهة المستخدم:

- يؤدي تحديد `whileUsing` إلى طلب إذن الواجهة الأمامية.
- إذا رفض نظام التشغيل المستوى المطلوب، فارجع إلى أعلى مستوى ممنوح واعرض الحالة.

## تعيين الأذونات (`node.permissions`)

اختياري. تبلّغ عقدة macOS عن `location` عبر خريطة الأذونات؛ وقد يحذفه iOS/Android.

## الأمر: `location.get`

يُستدعى عبر `node.invoke`.

المعلمات (مقترحة):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

حمولة الاستجابة:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

الأخطاء (رموز مستقرة):

- `LOCATION_DISABLED`: المحدد في وضع الإيقاف.
- `LOCATION_PERMISSION_REQUIRED`: الإذن مفقود للوضع المطلوب.
- `LOCATION_BACKGROUND_UNAVAILABLE`: التطبيق في الخلفية لكن المسموح به هو أثناء الاستخدام فقط.
- `LOCATION_TIMEOUT`: لم يتم الحصول على تحديد في الوقت المحدد.
- `LOCATION_UNAVAILABLE`: فشل في النظام / لا توجد موفّرات.

## سلوك الخلفية

- يرفض تطبيق Android الأمر `location.get` أثناء وجوده في الخلفية.
- أبقِ OpenClaw مفتوحًا عند طلب الموقع على Android.
- قد تختلف منصات العقد الأخرى.

## تكامل النماذج/الأدوات

- سطح الأداة: تضيف أداة `nodes` إجراء `location_get` (العقدة مطلوبة).
- CLI: `openclaw nodes location get --node <id>`.
- إرشادات الوكيل: لا تستدعِها إلا عندما يكون المستخدم قد فعّل الموقع ويفهم النطاق.

## نصوص تجربة المستخدم (مقترحة)

- إيقاف: "مشاركة الموقع معطلة."
- أثناء الاستخدام: "فقط عندما يكون OpenClaw مفتوحًا."
- دقيق: "استخدم موقع GPS الدقيق. أوقف التبديل لمشاركة موقع تقريبي."

## ذو صلة

- [تحليل موقع القناة](/ar/channels/location)
- [التقاط الكاميرا](/ar/nodes/camera)
- [وضع التحدث](/ar/nodes/talk)
