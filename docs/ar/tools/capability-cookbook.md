---
read_when:
    - إضافة capability أساسية جديدة وسطح تسجيل Plugin
    - تقرير ما إذا كانت الشيفرة تنتمي إلى النواة أو إلى Plugin مورّد أو Plugin ميزة
    - توصيل مساعد runtime جديد للقنوات أو الأدوات
sidebarTitle: Adding Capabilities
summary: دليل المساهمين لإضافة capability مشتركة جديدة إلى نظام Plugin في OpenClaw
title: إضافة capabilities ‏(دليل المساهمين)
x-i18n:
    generated_at: "2026-04-24T08:08:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1e3251b9150c9744d967e91f531dfce01435b13aea3a17088ccd54f2145d14f
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  هذا **دليل مساهمين** لمطوري نواة OpenClaw. إذا كنت
  تبني Plugin خارجيًا، فراجع [بناء Plugins](/ar/plugins/building-plugins)
  بدلًا من ذلك.
</Info>

استخدم هذا عندما يحتاج OpenClaw إلى مجال جديد مثل توليد الصور، أو
توليد الفيديو، أو أي مساحة ميزات مستقبلية مدعومة من مورّد.

القاعدة:

- Plugin = حد الملكية
- capability = عقد أساسي مشترك

وهذا يعني أنه لا ينبغي أن تبدأ بتوصيل مورّد مباشرةً إلى قناة أو
أداة. ابدأ بتعريف capability.

## متى تنشئ capability

أنشئ capability جديدة عندما تكون كل هذه الشروط صحيحة:

1. يمكن منطقيًا لأكثر من مورّد واحد تنفيذها
2. ينبغي أن تستهلكها القنوات أو الأدوات أو Plugins الميزات من دون
   الاهتمام بالمورّد
3. تحتاج النواة إلى امتلاك سلوك fallback أو السياسة أو التهيئة أو التسليم

إذا كان العمل خاصًا بمورّد فقط ولا يوجد بعد عقد مشترك، فتوقف وعرّف
العقد أولًا.

## التسلسل القياسي

1. عرّف العقد الأساسي المكتوب Typing.
2. أضف تسجيل Plugin لهذا العقد.
3. أضف مساعد runtime مشتركًا.
4. وصّل Plugin مورّد حقيقيًا واحدًا كإثبات.
5. انقل مستهلكي الميزة/القناة إلى مساعد runtime.
6. أضف اختبارات العقد.
7. وثّق التهيئة المواجهة للمشغّل ونموذج الملكية.

## ما الذي يذهب إلى أين

النواة:

- أنواع الطلب/الاستجابة
- سجل المزوّد + التحليل
- سلوك fallback
- مخطط التهيئة بالإضافة إلى بيانات توثيق `title` / `description` المنقولة على عقد الكائنات المتداخلة، وwildcard، وعناصر المصفوفة، وعقد التركيب
- سطح مساعد runtime

Plugin المورّد:

- استدعاءات API الخاصة بالمورّد
- معالجة المصادقة الخاصة بالمورّد
- تطبيع الطلبات الخاصة بالمورّد
- تسجيل تنفيذ capability

Plugin الميزة/القناة:

- يستدعي `api.runtime.*` أو مساعد `plugin-sdk/*-runtime` المطابق
- لا يستدعي تنفيذ مورّد مباشرةً أبدًا

## قائمة الملفات المرجعية

بالنسبة إلى capability جديدة، توقّع تعديل هذه المناطق:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- حزمة Plugin مضمّنة واحدة أو أكثر
- التهيئة/التوثيق/الاختبارات

## مثال: توليد الصور

يتبع توليد الصور الشكل القياسي:

1. تعرّف النواة `ImageGenerationProvider`
2. تكشف النواة `registerImageGenerationProvider(...)`
3. تكشف النواة `runtime.imageGeneration.generate(...)`
4. تسجّل Plugins ‏`openai` و`google` و`fal` و`minimax` تنفيذات مدعومة من المورّد
5. يمكن للمورّدين المستقبليين تسجيل العقد نفسه من دون تغيير القنوات/الأدوات

مفتاح التهيئة منفصل عن توجيه تحليل الرؤية:

- `agents.defaults.imageModel` = تحليل الصور
- `agents.defaults.imageGenerationModel` = توليد الصور

أبقِ هذين منفصلين حتى يظل fallback والسياسة صريحين.

## قائمة مراجعة

قبل شحن capability جديدة، تحقّق من:

- لا توجد قناة/أداة تستورد شيفرة مورّد مباشرةً
- مساعد runtime هو المسار المشترك
- يوجد اختبار عقد واحد على الأقل يثبت الملكية المضمّنة
- توثيق التهيئة يسمّي مفتاح النموذج/التهيئة الجديد
- توثيق Plugin يشرح حد الملكية

إذا كان PR يتجاوز طبقة capability ويضع سلوك المورّد مباشرةً داخل
قناة/أداة، فأعِده وعرّف العقد أولًا.

## ذو صلة

- [Plugin](/ar/tools/plugin)
- [إنشاء Skills](/ar/tools/creating-skills)
- [الأدوات وPlugins](/ar/tools)
