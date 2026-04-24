---
read_when:
    - إضافة أو تعديل تحليل موقع القناة
    - استخدام حقول سياق الموقع في مطالبات الوكيل أو الأدوات
summary: تحليل موقع القناة الواردة (Telegram/WhatsApp/Matrix) وحقول السياق
title: تحليل موقع القناة
x-i18n:
    generated_at: "2026-04-24T07:30:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
---

يقوم OpenClaw بتوحيد المواقع المشتركة الواردة من قنوات الدردشة إلى:

- نص موجز للإحداثيات يُلحَق بنص الرسالة الواردة، و
- حقول منظَّمة في حمولة سياق الرد التلقائي. يتم عرض التسميات والعناوين والتعليقات/الأوصاف التي توفرها القناة داخل المطالبة عبر كتلة JSON مشتركة للبيانات الوصفية غير الموثوقة، وليس بشكل مضمَّن داخل نص المستخدم.

المدعوم حاليًا:

- **Telegram** (دبابيس المواقع + الأماكن + المواقع المباشرة)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`m.location` مع `geo_uri`)

## تنسيق النص

تُعرَض المواقع كسطور واضحة من دون أقواس:

- دبوس:
  - `📍 48.858844, 2.294351 ±12m`
- مكان مُسمّى:
  - `📍 48.858844, 2.294351 ±12m`
- مشاركة مباشرة:
  - `🛰 الموقع المباشر: 48.858844, 2.294351 ±12m`

إذا تضمنت القناة تسمية أو عنوانًا أو تعليقًا/وصفًا، فسيتم الاحتفاظ به في حمولة السياق وسيظهر في المطالبة على شكل JSON غير موثوق داخل كتلة مسوَّرة:

````text
الموقع (بيانات وصفية غير موثوقة):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## حقول السياق

عند وجود موقع، تتم إضافة هذه الحقول إلى `ctx`:

- `LocationLat` (رقم)
- `LocationLon` (رقم)
- `LocationAccuracy` (رقم، بالأمتار؛ اختياري)
- `LocationName` (سلسلة نصية؛ اختياري)
- `LocationAddress` (سلسلة نصية؛ اختياري)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (قيمة منطقية)
- `LocationCaption` (سلسلة نصية؛ اختياري)

يتعامل عارض المطالبة مع `LocationName` و`LocationAddress` و`LocationCaption` على أنها بيانات وصفية غير موثوقة ويحوّلها إلى JSON عبر نفس المسار المقيّد المستخدم لسياقات القنوات الأخرى.

## ملاحظات القناة

- **Telegram**: تُربَط الأماكن بالقيمتين `LocationName/LocationAddress`؛ وتستخدم المواقع المباشرة `live_period`.
- **WhatsApp**: تملأ `locationMessage.comment` و`liveLocationMessage.caption` الحقل `LocationCaption`.
- **Matrix**: يتم تحليل `geo_uri` كموقع دبوس؛ ويتم تجاهل الارتفاع وتكون `LocationIsLive` دائمًا false.

## ذو صلة

- [أمر الموقع (العُقد)](/ar/nodes/location-command)
- [التقاط الكاميرا](/ar/nodes/camera)
- [فهم الوسائط](/ar/nodes/media-understanding)
