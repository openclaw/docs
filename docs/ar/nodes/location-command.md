---
read_when:
    - إضافة دعم موقع Node أو واجهة مستخدم للأذونات
    - تصميم أذونات الموقع أو سلوك التشغيل في المقدمة على Android
summary: أمر الموقع لعُقد Node ‏(`location.get`)، وأوضاع الأذونات، وسلوك Android في المقدمة
title: أمر الموقع
x-i18n:
    generated_at: "2026-07-12T06:11:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## الخلاصة

- `location.get` هو أمر Node، ويُستدعى عبر `node.invoke` أو `openclaw nodes location get`.
- معطّل افتراضيًا.
- تستخدم إصدارات Android التابعة لجهات خارجية محدِّدًا: إيقاف / أثناء الاستخدام / دائمًا. تظل إصدارات Play مقتصرة على إيقاف / أثناء الاستخدام.
- الموقع الدقيق مفتاح تبديل منفصل.

## لماذا محدِّد (وليس مجرد مفتاح تبديل)

أذونات الموقع في نظام التشغيل متعددة المستويات. والموقع الدقيق هو أيضًا إذن منفصل من نظام التشغيل (في iOS 14 والإصدارات الأحدث: "Precise"، وفي Android: "fine" مقابل "coarse"). يتحكم المحدِّد داخل التطبيق في الوضع المطلوب، لكن نظام التشغيل يظل هو من يقرر الإذن الفعلي.

## نموذج الإعدادات

لكل جهاز Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

سلوك واجهة المستخدم:

- يؤدي تحديد `whileUsing` إلى طلب إذن الاستخدام في المقدمة.
- يؤدي تحديد `always` في إصدار Android التابع لجهة خارجية إلى طلب إذن الاستخدام في المقدمة أولًا، ثم توضيح الوصول في الخلفية، ثم فتح إعدادات تطبيق Android لمنح الإذن المنفصل **Allow all the time**.
- لا تعلن إصدارات Android Play عن إذن الموقع في الخلفية ولا تعرض `always`.
- إذا رفض نظام التشغيل المستوى المطلوب، يعود التطبيق إلى أعلى مستوى ممنوح ويعرض الحالة.

## تعيين الأذونات (node.permissions)

اختياري. تبلغ Node في macOS عن `location` عبر خريطة `permissions` في `node.list`/`node.describe`؛ وقد لا يورده iOS/Android.

## الأمر: `location.get`

يُستدعى عبر `node.invoke`، أو أداة CLI المساعدة:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

المعاملات:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

تُعيَّن أعلام CLI مباشرةً: `--location-timeout` -> `timeoutMs`، و`--max-age` -> `maxAgeMs`، و`--accuracy` -> `desiredAccuracy`.

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

- `LOCATION_DISABLED`: المحدِّد في وضع الإيقاف.
- `LOCATION_PERMISSION_REQUIRED`: الإذن المطلوب للوضع المحدد مفقود.
- `LOCATION_BACKGROUND_UNAVAILABLE`: التطبيق في الخلفية، لكن الممنوح هو أثناء الاستخدام فقط.
- `LOCATION_TIMEOUT`: لم يُحدَّد الموقع في الوقت المحدد.
- `LOCATION_UNAVAILABLE`: فشل في النظام أو عدم توفر مزوّدي الموقع.

## السلوك في الخلفية

- لا تقبل إصدارات Android التابعة لجهات خارجية أمر `location.get` في الخلفية إلا عندما يحدد المستخدم `Always` ويمنح Android إذن الموقع في الخلفية. تضيف خدمة Node الدائمة الحالية نوع الخدمة `location` وتعرض `Location: Always` أثناء نشاطها.
- ترفض إصدارات Android Play ووضع `While Using` أمر `location.get` عندما يكون التطبيق في الخلفية.
- قد تختلف منصات Node الأخرى.

## التكامل مع النموذج والأدوات

- أداة الوكيل: الإجراء `location_get` في أداة `nodes` (تتطلب Node).
- CLI:‏ `openclaw nodes location get --node <id>`.
- إرشادات الوكيل: لا تستدعِه إلا عندما يكون المستخدم قد فعّل الموقع ويفهم نطاق المشاركة.

## نصوص تجربة المستخدم (مقترحة)

- إيقاف: "مشاركة الموقع معطّلة."
- أثناء الاستخدام: "فقط عندما يكون OpenClaw مفتوحًا."
- دائمًا: "السماح بعمليات التحقق المطلوبة من الموقع أثناء عمل OpenClaw في الخلفية."
- دقيق: "استخدام موقع GPS الدقيق. عطّل هذا الخيار لمشاركة الموقع التقريبي."

## ذات صلة

- [نظرة عامة على وحدات Node](/ar/nodes)
- [تحليل الموقع في القنوات](/ar/channels/location)
- [التقاط الصور بالكاميرا](/ar/nodes/camera)
- [وضع التحدث](/ar/nodes/talk)
