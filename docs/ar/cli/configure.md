---
read_when:
    - تريد تعديل بيانات الاعتماد أو الأجهزة أو الإعدادات الافتراضية للوكيل تفاعليًا
summary: مرجع CLI لـ `openclaw configure` (مطالبات التكوين التفاعلية)
title: إعداد
x-i18n:
    generated_at: "2026-05-02T07:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

موجّه تفاعلي لإعداد بيانات الاعتماد والأجهزة وافتراضيات الوكيل.

<Note>
يتضمن قسم **النموذج** تحديدًا متعددًا لقائمة السماح `agents.defaults.models` (ما يظهر في `/model` ومنتقي النماذج). تدمج خيارات الإعداد المحددة بنطاق المزوّد النماذج المحددة في قائمة السماح الحالية بدلًا من استبدال المزوّدين غير المرتبطين الموجودين مسبقًا في التهيئة.

إعادة تشغيل مصادقة المزوّد من configure تحافظ على `agents.defaults.model.primary` موجود، حتى عندما تعيد خطوة مصادقة المزوّد تصحيح تهيئة يتضمن نموذجه الافتراضي الموصى به. يعني ذلك أن إضافة xAI أو OpenRouter أو مزوّد آخر أو إعادة مصادقته يجب أن تجعل النموذج الجديد متاحًا دون أن يستحوذ على النموذج الأساسي الحالي لديك. استخدم `openclaw models auth login --provider <id> --set-default` أو `openclaw models set <model>` عندما تريد عمدًا تغيير النموذج الافتراضي.
</Note>

عندما يبدأ configure من خيار مصادقة مزوّد، يفضّل منتقيا النموذج الافتراضي وقائمة السماح ذلك المزوّد تلقائيًا. بالنسبة إلى المزوّدين المقترنين مثل Volcengine وBytePlus، يطابق التفضيل نفسه أيضًا متغيرات خطة البرمجة الخاصة بهم (`volcengine-plan/*`، `byteplus-plan/*`). إذا كان مرشح المزوّد المفضّل سينتج قائمة فارغة، يعود configure إلى الكتالوج غير المفلتر بدلًا من عرض منتقي فارغ.

<Tip>
يفتح `openclaw config` بدون أمر فرعي المعالج نفسه. استخدم `openclaw config get|set|unset` لإجراء تعديلات غير تفاعلية.
</Tip>

للبحث على الويب، يتيح لك `openclaw configure --section web` اختيار مزوّد
وتهيئة بيانات اعتماده. يعرض بعض المزوّدين أيضًا موجّهات متابعة خاصة
بالمزوّد:

- يمكن لـ **Grok** أن يقدّم إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه وأن
  يتيح لك اختيار نموذج `x_search`.
- يمكن لـ **Kimi** أن يطلب منطقة Moonshot API (`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج بحث الويب الافتراضي من Kimi.

ذات صلة:

- مرجع تهيئة Gateway: [التهيئة](/ar/gateway/configuration)
- CLI التهيئة: [التهيئة](/ar/cli/config)

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

- يؤدي اختيار مكان تشغيل Gateway دائمًا إلى تحديث `gateway.mode`. يمكنك اختيار "متابعة" بدون أقسام أخرى إذا كان ذلك كل ما تحتاجه.
- بعد كتابة التهيئة المحلية، يثبّت configure الـPlugins القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار. لا تثبّت تهيئة Gateway البعيد حزم Plugin المحلية.
- تطلب الخدمات الموجّهة للقنوات (Slack/Discord/Matrix/Microsoft Teams) قوائم سماح للقنوات/الغرف أثناء الإعداد. يمكنك إدخال أسماء أو معرّفات؛ يحلّ المعالج الأسماء إلى معرّفات عندما يكون ذلك ممكنًا.
- إذا شغّلت خطوة تثبيت الخفي، وكانت مصادقة الرمز تتطلب رمزًا، وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، فإن configure يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات بيئة خدمة المشرف الوصفية.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المهيأ غير محلول، يحظر configure تثبيت الخفي مع إرشادات معالجة قابلة للتنفيذ.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير مضبوط، يحظر configure تثبيت الخفي حتى يتم ضبط الوضع صراحةً.

## أمثلة

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [التهيئة](/ar/gateway/configuration)
