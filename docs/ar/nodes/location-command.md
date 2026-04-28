---
read_when:
- Adding location node support or permissions UI
- تصميم أذونات الموقع أو سلوك التشغيل في المقدمة على Android
summary: أمر الموقع لـ nodes ‏(`location.get`)، وأوضاع الأذونات، وسلوك Android في
  المقدمة
title: أمر الموقع
x-i18n:
  generated_at: '2026-04-24T07:50:34Z'
  refreshed_at: '2026-04-28T05:14:37Z'
  model: gpt-5.4
  provider: openai
  source_hash: fcd7ae3bf411be4331d62494a5d5263e8cda345475c5f849913122c029377f06
  source_path: nodes/location-command.md
  workflow: 15
---

## ملخص سريع

- `location.get` هو أمر Node ‏(عبر `node.invoke`).
- يكون معطّلًا افتراضيًا.
- تستخدم إعدادات تطبيق Android محددًا: إيقاف / أثناء الاستخدام.
- يوجد مفتاح منفصل: الموقع الدقيق.

## لماذا نستخدم محددًا (وليس مجرد مفتاح)

أذونات نظام التشغيل متعددة المستويات. يمكننا عرض محدد داخل التطبيق، لكن نظام التشغيل هو الذي يقرر الإذن الفعلي.

- قد يعرض iOS/macOS خيار **أثناء الاستخدام** أو **دائمًا** في مطالبات النظام/الإعدادات.
- يدعم تطبيق Android حاليًا الموقع في المقدمة فقط.
- يعد الموقع الدقيق إذنًا منفصلًا (في iOS 14+ باسم “Precise”، وفي Android باسم “fine” مقابل “coarse”).

يقود المحدد في واجهة المستخدم الوضع الذي نطلبه؛ أما الإذن الفعلي فيعيش داخل إعدادات نظام التشغيل.

## نموذج الإعدادات

لكل جهاز Node:

- `location.enabledMode`: ‏`off | whileUsing`
- `location.preciseEnabled`: قيمة منطقية

سلوك واجهة المستخدم:

- يؤدي اختيار `whileUsing` إلى طلب إذن الموقع في المقدمة.
- إذا رفض نظام التشغيل المستوى المطلوب، فارجع إلى أعلى مستوى تم منحه وأظهر الحالة.

## ربط الأذونات (`node.permissions`)

اختياري. يبلغ Node على macOS عن `location` عبر خريطة الأذونات؛ وقد لا يبلّغ iOS/Android عنها.

## الأمر: `location.get`

يُستدعى عبر `node.invoke`.

المعاملات (مقترحة):

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

الأخطاء (رموز ثابتة):

- `LOCATION_DISABLED`: المحدد على وضع الإيقاف.
- `LOCATION_PERMISSION_REQUIRED`: الإذن مفقود للوضع المطلوب.
- `LOCATION_BACKGROUND_UNAVAILABLE`: التطبيق في الخلفية لكن المسموح فقط هو أثناء الاستخدام.
- `LOCATION_TIMEOUT`: لم يتم الحصول على fix في الوقت المحدد.
- `LOCATION_UNAVAILABLE`: فشل في النظام / لا توجد مزودات.

## السلوك في الخلفية

- يرفض تطبيق Android استدعاء `location.get` أثناء وجوده في الخلفية.
- أبقِ OpenClaw مفتوحًا عند طلب الموقع على Android.
- قد تختلف منصات Node الأخرى.

## تكامل النموذج/الأدوات

- سطح الأداة: تضيف أداة `nodes` الإجراء `location_get` ‏(Node مطلوب).
- CLI: ‏`openclaw nodes location get --node <id>`.
- إرشادات الوكيل: لا تستدعِها إلا عندما يكون المستخدم قد فعّل الموقع ويفهم النطاق.

## نصوص واجهة المستخدم (مقترحة)

- إيقاف: “مشاركة الموقع معطّلة.”
- أثناء الاستخدام: “فقط عندما يكون OpenClaw مفتوحًا.”
- دقيق: “استخدم موقع GPS دقيقًا. عطّل المفتاح لمشاركة موقع تقريبي.”

## ذو صلة

- [تحليل الموقع في القنوات](/ar/channels/location)
- [التقاط الكاميرا](/ar/nodes/camera)
- [وضع Talk](/ar/nodes/talk)
