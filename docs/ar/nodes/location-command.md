---
read_when:
    - إضافة دعم عقدة الموقع أو واجهة مستخدم للأذونات
    - تصميم أذونات الموقع أو سلوك التشغيل في المقدمة على Android
summary: أمر الموقع للعُقد، وأوضاع أذونات المنصة، وإعداد GeoClue على Linux
title: أمر الموقع
x-i18n:
    generated_at: "2026-07-16T14:23:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## الخلاصة

- `location.get` هو أمر Node، ويُستدعى عبر `node.invoke` أو `openclaw nodes location get`.
- معطّل افتراضيًا.
- تستخدم إصدارات Android التابعة لجهات خارجية محددًا: إيقاف / أثناء الاستخدام / دائمًا. تظل إصدارات Play على إيقاف / أثناء الاستخدام.
- الموقع الدقيق مفتاح تبديل منفصل.

## لماذا محدد (وليس مجرد مفتاح تبديل)

أذونات الموقع في نظام التشغيل متعددة المستويات. والموقع الدقيق منحة منفصلة من نظام التشغيل أيضًا (في iOS 14+ ‏"Precise"، وفي Android ‏"fine" مقابل "coarse"). يحدد المحدد داخل التطبيق الوضع المطلوب، لكن نظام التشغيل يظل صاحب القرار في المنحة الفعلية.

## نموذج الإعدادات

لكل جهاز Node:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

سلوك واجهة المستخدم:

- يؤدي تحديد `whileUsing` إلى طلب إذن الاستخدام في المقدمة.
- يؤدي تحديد `always` في إصدار Android التابع لجهة خارجية أولًا إلى طلب إذن الاستخدام في المقدمة، ثم توضيح الوصول في الخلفية، ثم فتح إعدادات تطبيق Android لمنح إذن **Allow all the time** المنفصل.
- لا تصرّح إصدارات Android Play بإذن الموقع في الخلفية ولا تعرض `always`.
- إذا رفض نظام التشغيل المستوى المطلوب، يعود التطبيق إلى أعلى مستوى ممنوح ويعرض الحالة.

## تعيين الأذونات (node.permissions)

اختياري. تُبلغ Node في macOS عن `location` عبر خريطة `permissions` في `node.list`/`node.describe`؛ وقد يحذفه iOS/Android.

## الأمر: `location.get`

يُستدعى عبر `node.invoke`، أو مساعد CLI:

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

تُعيَّن علامات CLI مباشرةً: `--location-timeout` -> `timeoutMs`، و`--max-age` -> `maxAgeMs`، و`--accuracy` -> `desiredAccuracy`.

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

- `LOCATION_DISABLED`: المحدد متوقف.
- `LOCATION_PERMISSION_REQUIRED`: الإذن المطلوب للوضع المحدد مفقود.
- `LOCATION_BACKGROUND_UNAVAILABLE`: التطبيق في الخلفية، لكن الممنوح هو أثناء الاستخدام فقط.
- `LOCATION_TIMEOUT`: لم يتوفر تحديد للموقع في الوقت المحدد.
- `LOCATION_UNAVAILABLE`: فشل في النظام أو لا يوجد مزودون.

## السلوك في الخلفية

- لا تقبل إصدارات Android التابعة لجهات خارجية `location.get` في الخلفية إلا عندما يحدد المستخدم `Always` ويمنح Android إذن الموقع في الخلفية. تضيف خدمة Node المستمرة الحالية نوع الخدمة `location` وتُظهر `Location: Always` أثناء نشاطها.
- ترفض إصدارات Android Play ووضع `While Using` ‏`location.get` أثناء العمل في الخلفية.
- قد تختلف منصات Node الأخرى.

## مضيف Node على Linux

يضيف Plugin ‏Node المضمّن لنظام Linux ‏`location.get` إلى خدمة CLI ‏`openclaw node`، بما في ذلك المضيفون بلا واجهة رسومية الذين لا يستخدمون تطبيق سطح المكتب لنظام Linux. يكون الموقع معطّلًا افتراضيًا. فعّله ضمن إدخال Plugin، ثم أعد تشغيل خدمة Node:

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

ثبّت GeoClue2 والعرض التوضيحي `where-am-i` الخاص به (`geoclue-2-demo` على Debian وUbuntu). يجب أن تسمح سياسة GeoClue الخاصة بالمضيف ووكيل التخويل لمستخدم خدمة Node.

يستخدم Plugin ‏`where-am-i` بدلًا من سلسلة من استدعاءات `busctl`. يربط GeoClue إنشاء العميل وخصائصه وبدءه وتحديثاته وإيقافه باتصال عميل D-Bus واحد؛ ويحافظ العرض التوضيحي على دورة الحياة هذه مجتمعة، بينما لا تفعل ذلك عمليات `busctl` الفرعية المنفصلة. لا تُضاف أي تبعية npm.

يعيّن Linux ‏`coarse` و`balanced` و`precise` إلى مستويات دقة GeoClue ‏`4` و`6` و`8`. ويتحقق من `maxAgeMs` مقارنةً بالطابع الزمني المُعاد. لا يعرض العرض التوضيحي لـ GeoClue المزود المحدد، لذا تكون `source` هي `unknown`؛ وتكون `isPrecise` صحيحة فقط عندما تكون الدقة المُبلغ عنها 100 متر أو أفضل.

يستخدم Linux الأخطاء الثابتة نفسها: `LOCATION_DISABLED` و`LOCATION_TIMEOUT` و`LOCATION_UNAVAILABLE`.

## تكامل النموذج والأدوات

- أداة الوكيل: إجراء `location_get` الخاص بأداة `nodes` (يلزم وجود Node).
- CLI: ‏`openclaw nodes location get --node <id>`.
- إرشادات الوكيل: لا يُستدعى إلا عندما يفعّل المستخدم الموقع ويفهم نطاقه.

## نصوص تجربة المستخدم (مقترحة)

- إيقاف: "مشاركة الموقع معطّلة."
- أثناء الاستخدام: "فقط عندما يكون OpenClaw مفتوحًا."
- دائمًا: "السماح بعمليات التحقق من الموقع المطلوبة أثناء وجود OpenClaw في الخلفية."
- دقيق: "استخدام موقع GPS الدقيق. عطّل مفتاح التبديل لمشاركة الموقع التقريبي."

## ذو صلة

- [نظرة عامة على أجهزة Node](/ar/nodes)
- [تحليل موقع القناة](/ar/channels/location)
- [التقاط الصور بالكاميرا](/ar/nodes/camera)
- [وضع التحدث](/ar/nodes/talk)
