---
read_when:
    - تريد تعديل بيانات الاعتماد أو الأجهزة أو الإعدادات الافتراضية للوكيل بشكل تفاعلي
summary: مرجع CLI لـ `openclaw configure` (مطالبات التكوين التفاعلية)
title: تكوين
x-i18n:
    generated_at: "2026-04-30T07:47:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

موجّه تفاعلي لإعداد بيانات الاعتماد والأجهزة وافتراضات الوكيل.

<Note>
يتضمن قسم **النموذج** تحديدًا متعددًا لقائمة السماح `agents.defaults.models` (ما يظهر في `/model` ومنتقي النموذج). تدمج اختيارات الإعداد المحددة بنطاق المزوّد نماذجها المحددة في قائمة السماح الحالية بدلًا من استبدال المزوّدين غير المرتبطين الموجودين بالفعل في الإعداد. تحافظ إعادة تشغيل مصادقة المزوّد من الإعداد على `agents.defaults.model.primary` موجود. استخدم `openclaw models auth login --provider <id> --set-default` أو `openclaw models set <model>` عندما تريد عمدًا تغيير النموذج الافتراضي.
</Note>

عندما يبدأ الإعداد من اختيار مصادقة مزوّد، يفضّل منتقيا النموذج الافتراضي وقائمة السماح ذلك المزوّد تلقائيًا. بالنسبة إلى المزوّدين المقترنين مثل Volcengine وBytePlus، يطابق التفضيل نفسه أيضًا متغيرات خطة البرمجة الخاصة بهما (`volcengine-plan/*` و`byteplus-plan/*`). إذا كان عامل تصفية المزوّد المفضّل سينتج قائمة فارغة، يعود الإعداد إلى الكتالوج غير المصفّى بدلًا من إظهار منتقٍ فارغ.

<Tip>
يفتح `openclaw config` من دون أمر فرعي المعالج نفسه. استخدم `openclaw config get|set|unset` للتعديلات غير التفاعلية.
</Tip>

بالنسبة إلى بحث الويب، يتيح لك `openclaw configure --section web` اختيار مزوّد
وإعداد بيانات اعتماده. تعرض بعض المزوّدات أيضًا مطالبات متابعة خاصة بالمزوّد:

- يمكن أن يقدّم **Grok** إعداد `x_search` اختياريًا باستخدام `XAI_API_KEY` نفسه وأن
  يتيح لك اختيار نموذج `x_search`.
- يمكن أن يطلب **Kimi** منطقة Moonshot API (`api.moonshot.ai` مقابل
  `api.moonshot.cn`) ونموذج بحث الويب الافتراضي من Kimi.

ذو صلة:

- مرجع إعداد Gateway: [الإعداد](/ar/gateway/configuration)
- CLI للإعداد: [الإعداد](/ar/cli/config)

## الخيارات

- `--section <section>`: عامل تصفية قسم قابل للتكرار

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

- يؤدي اختيار مكان تشغيل Gateway دائمًا إلى تحديث `gateway.mode`. يمكنك تحديد "متابعة" من دون أقسام أخرى إذا كان ذلك كل ما تحتاج إليه.
- تطلب الخدمات الموجهة نحو القنوات (Slack/Discord/Matrix/Microsoft Teams) قوائم سماح للقنوات/الغرف أثناء الإعداد. يمكنك إدخال أسماء أو معرّفات؛ ويحوّل المعالج الأسماء إلى معرّفات عندما يكون ذلك ممكنًا.
- إذا شغّلت خطوة تثبيت الخدمة الخفية، وكانت مصادقة الرمز تتطلب رمزًا، وكان `gateway.auth.token` مُدارًا بواسطة SecretRef، يتحقق الإعداد من SecretRef لكنه لا يحفظ قيم الرمز النصية الصريحة التي تم حلها في بيانات تعريف بيئة خدمة المشرف.
- إذا كانت مصادقة الرمز تتطلب رمزًا وكان SecretRef للرمز المهيأ غير محلول، يمنع الإعداد تثبيت الخدمة الخفية مع إرشادات معالجة قابلة للتنفيذ.
- إذا كان كل من `gateway.auth.token` و`gateway.auth.password` مهيأين وكان `gateway.auth.mode` غير معيّن، يمنع الإعداد تثبيت الخدمة الخفية حتى يتم تعيين الوضع صراحةً.

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
