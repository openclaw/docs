---
read_when:
    - تريد تعديل بيانات الاعتماد أو الأجهزة أو الإعدادات الافتراضية للوكيل تفاعليًا
summary: مرجع CLI لـ `openclaw configure` (مطالبات الإعداد التفاعلية)
title: اضبط
x-i18n:
    generated_at: "2026-06-27T17:20:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

مطالبة تفاعلية لإجراء تغييرات موجّهة على إعداد موجود: بيانات الاعتماد، والأجهزة، وافتراضيات الوكيل، وGateway، والقنوات، وPlugins، وSkills، وفحوصات السلامة.

استخدم `openclaw onboard` لرحلة التشغيل الأول الكاملة والموجّهة، و`openclaw setup` للتكوين الأساسي/مساحة العمل فقط، و`openclaw channels add` عندما تحتاج فقط إلى إعداد حساب القناة.

<Note>
يتضمن قسم **النموذج** اختيارًا متعددًا لقائمة السماح `agents.defaults.models` (ما يظهر في `/model` ومنتقي النماذج). تدمج اختيارات الإعداد المحددة النطاق حسب المزوّد نماذجها المحددة في قائمة السماح الحالية بدلًا من استبدال المزوّدين غير المرتبطين الموجودين بالفعل في التكوين.

تؤدي إعادة تشغيل مصادقة المزوّد من configure إلى الحفاظ على `agents.defaults.model.primary` موجود، حتى عندما تُرجع خطوة مصادقة المزوّد تصحيح تكوين يتضمن نموذجًا افتراضيًا موصى به خاصًا بها. يعني ذلك أن إضافة xAI أو OpenRouter أو مزوّد آخر أو إعادة مصادقته يجب أن تجعل النموذج الجديد متاحًا دون أن يستولي على مكان نموذجك الأساسي الحالي. استخدم `openclaw models auth login --provider <id> --set-default` أو `openclaw models set <model>` عندما تريد تغيير النموذج الافتراضي عمدًا.
</Note>

عندما يبدأ configure من اختيار مصادقة مزوّد، يفضّل منتقيا النموذج الافتراضي وقائمة السماح ذلك المزوّد تلقائيًا. بالنسبة إلى المزوّدين المقترنين مثل Volcengine وBytePlus، يطابق التفضيل نفسه أيضًا متغيرات خطة الترميز الخاصة بهما (`volcengine-plan/*`، `byteplus-plan/*`). إذا كان مرشح المزوّد المفضّل سينتج قائمة فارغة، يعود configure إلى الكتالوج غير المرشح بدلًا من عرض منتقٍ فارغ.

<Tip>
يفتح `openclaw config` دون أمر فرعي المعالج نفسه. استخدم `openclaw config get|set|unset` للتعديلات غير التفاعلية.
</Tip>

بالنسبة إلى بحث الويب، يتيح لك `openclaw configure --section web` اختيار مزوّد
وتكوين بيانات اعتماده. تعرض بعض المزوّدات أيضًا مطالبات متابعة خاصة بالمزوّد:

- يمكن لـ **Grok** أن يقدم إعداد `x_search` اختياريًا باستخدام ملف تعريف xAI OAuth نفسه
  أو مفتاح API، ويتيح لك اختيار نموذج `x_search`.
- يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج بحث الويب الافتراضي من Kimi.

ذات صلة:

- مرجع تكوين Gateway: [التكوين](/ar/gateway/configuration)
- CLI للتكوين: [التكوين](/ar/cli/config)

## الخيارات

- `--section <section>`: مرشح قسم قابل للتكرار

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

- يسأل المعالج الكامل والأقسام المتعلقة بـ Gateway عن مكان تشغيل Gateway ويحدّثان `gateway.mode`. تنتقل مرشحات الأقسام التي لا تتضمن `gateway` أو `daemon` أو `health` مباشرة إلى الإعداد المطلوب.
- بعد كتابة التكوين المحلي، يثبّت configure المكونات الإضافية القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار. لا يثبّت تكوين Gateway البعيد حزم Plugin المحلية.
- تطالب الخدمات الموجهة للقنوات (Slack/Discord/Matrix/Microsoft Teams) بقوائم السماح للقنوات/الغرف أثناء الإعداد. يمكنك إدخال أسماء أو معرّفات؛ ويحل المعالج الأسماء إلى معرّفات عندما يكون ذلك ممكنًا.
- إذا شغّلت خطوة تثبيت البرنامج الخفي، وكانت مصادقة الرمز المميز تتطلب رمزًا مميزًا، وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق configure من SecretRef لكنه لا يحفظ قيم الرمز المميز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
- إذا كانت مصادقة الرمز المميز تتطلب رمزًا مميزًا وكان SecretRef للرمز المميز المكوّن غير محلول، يمنع configure تثبيت البرنامج الخفي مع إرشادات معالجة قابلة للتنفيذ.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مكوّنين وكان `gateway.auth.mode` غير معيّن، يمنع configure تثبيت البرنامج الخفي حتى يتم تعيين الوضع صراحة.

## أمثلة

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [التكوين](/ar/gateway/configuration)
