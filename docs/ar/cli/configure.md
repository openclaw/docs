---
read_when:
    - تريد تعديل بيانات الاعتماد أو الأجهزة أو الإعدادات الافتراضية للوكيل بشكل تفاعلي
summary: مرجع CLI لـ `openclaw configure` (مطالبات الإعداد التفاعلية)
title: التهيئة
x-i18n:
    generated_at: "2026-04-24T07:34:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 822c01f8c0fe9dc4c170f3418bc836b1d18b4713551355b0a18de9e613754dd0
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

مطالبة تفاعلية لإعداد بيانات الاعتماد والأجهزة والإعدادات الافتراضية للوكيل.

ملاحظة: يتضمن قسم **النموذج** الآن تحديدًا متعددًا لقائمة السماح `agents.defaults.models`
(ما يظهر في `/model` وفي منتقي النماذج).
تقوم اختيارات الإعداد ضمن نطاق الموفر بدمج نماذجها المحددة في
قائمة السماح الحالية بدلًا من استبدال الموفرين غير المرتبطين الموجودين بالفعل في الإعدادات.

عندما يبدأ configure من اختيار مصادقة موفر، فإن منتقيات النموذج الافتراضي
وقائمة السماح تفضل ذلك الموفر تلقائيًا. وبالنسبة إلى الموفرين المقترنين مثل
Volcengine/BytePlus، فإن التفضيل نفسه يطابق أيضًا
متغيرات خطة الترميز الخاصة بهما (`volcengine-plan/*`, `byteplus-plan/*`). وإذا كان فلتر
الموفر المفضل سينتج قائمة فارغة، فإن configure يرجع إلى الكتالوج غير المفلتر
بدلًا من عرض منتقٍ فارغ.

نصيحة: يؤدي `openclaw config` من دون أمر فرعي إلى فتح المعالج نفسه. استخدم
`openclaw config get|set|unset` لإجراء تعديلات غير تفاعلية.

بالنسبة إلى البحث على الويب، يتيح لك `openclaw configure --section web` اختيار موفر
وتهيئة بيانات اعتماده. وتعرض بعض الموفرات أيضًا مطالبات متابعة خاصة بالموفر:

- يمكن لـ **Grok** أن يوفّر إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه
  ويتيح لك اختيار نموذج `x_search`.
- يمكن لـ **Kimi** أن يطلب منطقة Moonshot API ‏(`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج البحث على الويب الافتراضي لـ Kimi.

ذو صلة:

- مرجع إعداد Gateway: [الإعداد](/ar/gateway/configuration)
- CLI الخاص بالإعداد: [Config](/ar/cli/config)

## الخيارات

- `--section <section>`: فلتر قسم قابل للتكرار

الأقسام المتاحة:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

ملاحظات:

- يؤدي اختيار مكان تشغيل Gateway دائمًا إلى تحديث `gateway.mode`. يمكنك اختيار "متابعة" من دون أقسام أخرى إذا كان هذا كل ما تحتاجه.
- تطلب الخدمات الموجهة إلى القنوات (Slack/Discord/Matrix/Microsoft Teams) قوائم سماح القنوات/الغرف أثناء الإعداد. يمكنك إدخال الأسماء أو المعرّفات؛ ويقوم المعالج بحل الأسماء إلى معرّفات عندما يكون ذلك ممكنًا.
- إذا شغّلت خطوة تثبيت daemon، وكانت مصادقة الرمز المميز تتطلب رمزًا مميزًا، وكانت `gateway.auth.token` مُدارة عبر SecretRef، فإن configure يتحقق من SecretRef لكنه لا يحفظ قيم الرموز المميزة النصية الصريحة المحلولة في بيانات البيئة الوصفية لخدمة supervisor.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكان SecretRef للرمز المميز المضبوط غير محلول، فإن configure يمنع تثبيت daemon مع إرشادات معالجة قابلة للتنفيذ.
- إذا كانت كل من `gateway.auth.token` و`gateway.auth.password` مضبوطتين وكانت `gateway.auth.mode` غير مضبوطة، فإن configure يمنع تثبيت daemon حتى يتم ضبط الوضع صراحةً.

## أمثلة

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الإعداد](/ar/gateway/configuration)
