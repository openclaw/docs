---
read_when:
    - تريد تعديل بيانات الاعتماد أو الأجهزة أو الإعدادات الافتراضية للوكيل بشكل تفاعلي
summary: مرجع CLI لـ `openclaw configure` (مطالبات التكوين التفاعلية)
title: إعداد
x-i18n:
    generated_at: "2026-06-30T22:17:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

مطالبة تفاعلية لإجراء تغييرات موجّهة على إعداد قائم: بيانات الاعتماد، والأجهزة، وافتراضيات الوكيل، وGateway، والقنوات، وPlugin، وSkills، وفحوصات الصحة.

استخدم `openclaw onboard` أو `openclaw setup` لرحلة التشغيل الأول الكاملة الموجّهة، و`openclaw setup --baseline` لإعدادات الأساس/مساحة العمل فقط، و`openclaw channels add` عندما تحتاج فقط إلى إعداد حساب قناة.

<Note>
يتضمن قسم **النموذج** تحديدًا متعددًا لقائمة السماح `agents.defaults.models` (ما يظهر في `/model` ومنتقي النموذج). تدمج اختيارات الإعداد المقيّدة بموفر نماذجها المحددة في قائمة السماح الحالية بدلًا من استبدال الموفرين غير المرتبطين الموجودين مسبقًا في الإعدادات.

إعادة تشغيل مصادقة الموفر من configure تحافظ على `agents.defaults.model.primary` قائم، حتى عندما تُرجع خطوة مصادقة الموفر رقعة إعدادات بنموذج افتراضي موصى به خاص بها. يعني ذلك أن إضافة xAI أو OpenRouter أو موفر آخر أو إعادة مصادقته يجب أن تجعل النموذج الجديد متاحًا دون أن يتولى مكان النموذج الأساسي الحالي لديك. استخدم `openclaw models auth login --provider <id> --set-default` أو `openclaw models set <model>` عندما تريد عمدًا تغيير النموذج الافتراضي.
</Note>

عندما يبدأ configure من اختيار مصادقة موفر، فإن منتقيات النموذج الافتراضي وقائمة السماح تفضّل ذلك الموفر تلقائيًا. بالنسبة للموفرين المقترنين مثل Volcengine وBytePlus، يطابق التفضيل نفسه أيضًا متغيرات خطة الترميز الخاصة بهم (`volcengine-plan/*`، `byteplus-plan/*`). إذا كان مرشح الموفر المفضل سيُنتج قائمة فارغة، يعود configure إلى الكتالوج غير المرشح بدلًا من عرض منتقي فارغ.

<Tip>
يفتح `openclaw config` من دون أمر فرعي المعالج نفسه. استخدم `openclaw config get|set|unset` لإجراء تعديلات غير تفاعلية.
</Tip>

لبحث الويب، يتيح لك `openclaw configure --section web` اختيار موفر
وتهيئة بيانات اعتماده. تعرض بعض الموفرات أيضًا مطالبات متابعة خاصة بالموفر:

- يمكن لـ **Grok** أن يعرض إعداد `x_search` اختياريًا باستخدام ملف xAI OAuth
  نفسه أو مفتاح API ويتيح لك اختيار نموذج `x_search`.
- يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج بحث الويب الافتراضي من Kimi.

ذات صلة:

- مرجع إعدادات Gateway: [الإعدادات](/ar/gateway/configuration)
- CLI للإعدادات: [الإعدادات](/ar/cli/config)

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

- يسأل المعالج الكامل والأقسام المتعلقة بـ Gateway عن مكان تشغيل Gateway ويحدثان `gateway.mode`. مرشحات الأقسام التي لا تتضمن `gateway` أو `daemon` أو `health` تنتقل مباشرة إلى الإعداد المطلوب.
- بعد كتابة الإعدادات المحلية، يثبّت configure الـ Plugin القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار. لا تثبّت إعدادات Gateway البعيدة حزم Plugin المحلية.
- تطلب الخدمات الموجهة للقنوات (Slack/Discord/Matrix/Microsoft Teams) قوائم سماح للقنوات/الغرف أثناء الإعداد. يمكنك إدخال الأسماء أو المعرّفات؛ يحل المعالج الأسماء إلى معرّفات عندما يكون ذلك ممكنًا.
- إذا شغّلت خطوة تثبيت daemon، وكانت مصادقة الرمز تتطلب رمزًا، وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق configure من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المهيأ غير محلول، يمنع configure تثبيت daemon مع إرشادات معالجة قابلة للتنفيذ.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يمنع configure تثبيت daemon حتى يتم ضبط الوضع صراحةً.

## أمثلة

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [الإعدادات](/ar/gateway/configuration)
