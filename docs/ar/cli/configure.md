---
read_when:
    - تريد تعديل بيانات الاعتماد أو الأجهزة أو الإعدادات الافتراضية للوكيل تفاعليًا
summary: مرجع CLI لـ `openclaw configure` (مطالبات التكوين التفاعلية)
title: التكوين
x-i18n:
    generated_at: "2026-05-10T19:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

مطالبة تفاعلية لإجراء تغييرات موجّهة على إعداد موجود: بيانات الاعتماد، والأجهزة، وافتراضيات الوكيل، وGateway، والقنوات، وPlugins، وSkills، وفحوصات الصحة.

استخدم `openclaw onboard` لرحلة التشغيل الأول الكاملة والموجّهة، و`openclaw setup` للإعداد الأساسي/مساحة العمل فقط، و`openclaw channels add` عندما تحتاج فقط إلى إعداد حساب قناة.

<Note>
يتضمن قسم **النموذج** اختيارًا متعددًا لقائمة السماح `agents.defaults.models` (ما يظهر في `/model` ومنتقي النماذج). تدمج خيارات الإعداد المقيّدة بمزوّد النماذج المحددة في قائمة السماح الموجودة بدلًا من استبدال مزوّدين غير ذوي صلة موجودين بالفعل في الإعداد.

إعادة تشغيل مصادقة المزوّد من configure تحافظ على `agents.defaults.model.primary` موجود، حتى عندما تعيد خطوة مصادقة المزوّد تصحيح إعداد يحتوي على نموذجه الافتراضي الموصى به. هذا يعني أن إضافة xAI أو OpenRouter أو مزوّد آخر أو إعادة المصادقة معه يجب أن تجعل النموذج الجديد متاحًا دون أن يحل محل نموذجك الأساسي الحالي. استخدم `openclaw models auth login --provider <id> --set-default` أو `openclaw models set <model>` عندما تريد تغيير النموذج الافتراضي عمدًا.
</Note>

عندما يبدأ configure من خيار مصادقة مزوّد، فإن منتقيات النموذج الافتراضي وقائمة السماح تفضّل ذلك المزوّد تلقائيًا. وبالنسبة إلى المزوّدين المقترنين مثل Volcengine وBytePlus، يطابق التفضيل نفسه أيضًا متغيرات خطط البرمجة الخاصة بهم (`volcengine-plan/*`، `byteplus-plan/*`). إذا كان مرشح المزوّد المفضل سينتج قائمة فارغة، يعود configure إلى الكتالوج غير المرشح بدلًا من عرض منتقي فارغ.

<Tip>
يفتح `openclaw config` بدون أمر فرعي المعالج نفسه. استخدم `openclaw config get|set|unset` للتعديلات غير التفاعلية.
</Tip>

للبحث على الويب، يتيح لك `openclaw configure --section web` اختيار مزوّد
وإعداد بيانات اعتماده. يعرض بعض المزوّدين أيضًا مطالبات متابعة خاصة بالمزوّد:

- يمكن أن يوفّر **Grok** إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه وأن
  يتيح لك اختيار نموذج `x_search`.
- يمكن أن يطلب **Kimi** منطقة Moonshot API (`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج البحث على الويب الافتراضي من Kimi.

ذات صلة:

- مرجع إعداد Gateway: [الإعداد](/ar/gateway/configuration)
- CLI للإعداد: [الإعداد](/ar/cli/config)

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

- اختيار مكان تشغيل Gateway يحدّث دائمًا `gateway.mode`. يمكنك تحديد "متابعة" دون أقسام أخرى إذا كان هذا كل ما تحتاجه.
- بعد عمليات كتابة الإعداد المحلي، يثبّت configure الـPlugins القابلة للتنزيل المحددة عندما يتطلبها مسار الإعداد المختار. لا يثبّت إعداد Gateway البعيد حزم Plugin المحلية.
- الخدمات الموجّهة إلى القنوات (Slack/Discord/Matrix/Microsoft Teams) تطالب بقوائم سماح للقنوات/الغرف أثناء الإعداد. يمكنك إدخال أسماء أو معرّفات؛ ويحوّل المعالج الأسماء إلى معرّفات عندما يكون ذلك ممكنًا.
- إذا شغّلت خطوة تثبيت الخفي، وكانت مصادقة الرمز تتطلب رمزًا، وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، فإن configure يتحقق من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة المحلولة في بيانات تعريف بيئة خدمة المشرف.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المُعد غير محلول، يحظر configure تثبيت الخفي مع إرشادات معالجة قابلة للتنفيذ.
- إذا تم إعداد كل من `gateway.auth.token` و`gateway.auth.password` وكان `gateway.auth.mode` غير معيّن، يحظر configure تثبيت الخفي حتى يتم تعيين الوضع صراحة.

## أمثلة

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## ذات صلة

- [مرجع CLI](/ar/cli)
- [الإعداد](/ar/gateway/configuration)
