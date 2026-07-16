---
read_when:
    - أنت تثبّت Plugin ‏microsoft-foundry أو تهيّئه أو تدقّق فيه
summary: يضيف دعم موفّر نماذج Microsoft Foundry إلى OpenClaw.
title: Plugin ‏Microsoft Foundry
x-i18n:
    generated_at: "2026-07-16T14:51:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

يضيف دعم موفّر نماذج Microsoft Foundry إلى OpenClaw.

## التوزيع

- الحزمة: `@openclaw/microsoft-foundry`
- مسار التثبيت: مضمّن في OpenClaw

## السطح

الموفّرون: `microsoft-foundry`؛ العقود: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- موفّر توليد الصور: `microsoft-foundry`

## المتطلبات

- مورد Microsoft Foundry أو Azure AI Foundry يحتوي على عمليات نشر.
- مصادقة بمفتاح API عبر `AZURE_OPENAI_API_KEY` أو مفتاح API مُهيّأ للموفّر.
- لمصادقة Entra ID، ثبّت Azure CLI وشغّل `az login` قبل
  الإعداد الأولي. يجدّد OpenClaw رموز وقت تشغيل Microsoft Foundry عبر
  `az account get-access-token`.

## نماذج المحادثة

تستخدم عمليات نشر المحادثة في Microsoft Foundry مرجع نموذج الموفّر
`microsoft-foundry/<deployment-name>`. يكتشف الإعداد الأولي موارد Foundry
وعمليات النشر باستخدام Azure CLI، ثم يكتب اسم عملية النشر المحددة في
إعدادات النموذج.

يستخدم OpenClaw نقطة نهاية Foundry ‏`/openai/v1` لواجهات API المدعومة
للمحادثة والمتوافقة مع OpenAI:

- تستخدم عائلات نماذج GPT و`o*` و`computer-use-preview` وDeepSeek-V4 افتراضيًا
  `openai-responses`.
- تستخدم عمليات نشر MAI-DS-R1 وغيرها من عمليات نشر إكمال المحادثة `openai-completions`
  ما لم تُهيّأ واجهة API مدعومة صراحةً.
- يُسجَّل MAI-DS-R1 على أنه قادر على الاستدلال من خلال محتوى الاستدلال، لا
  من خلال `reasoning_effort`. وتبلغ بياناته الوصفية لرموز السياق والإخراج
  163,840 رمزًا.

تستخدم عمليات نشر Anthropic Claude في Microsoft Foundry بنية واجهة
Anthropic Messages API، وليس بنية `/openai/v1` المتوافقة مع OpenAI. هيّئها
كموفّر `anthropic-messages` مخصص إلى أن يضيف Plugin Microsoft Foundry
وقت تشغيل Anthropic أصليًا. عندما يختلف اسم عملية نشر Foundry عن
معرّف نموذج Claude، عيّن `params.canonicalModelId` في إدخال النموذج كي يتمكن OpenClaw
من تطبيق عقود النقل الخاصة بالنموذج، وتعيين `/think off` بصورة صحيحة،
والحفاظ على التفكير الموقّع بأمان.

## توليد صور MAI

يسجّل Plugin ‏`microsoft-foundry` لـ `image_generate` مع نماذج
صور Microsoft AI الحالية:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

استخدم اسم عملية نشر صور MAI منشورة بوصفه مرجع النموذج. لا يعلن الموفّر
عن نموذج صور افتراضي لأن واجهة MAI API تتطلب اسم عملية النشر الخاصة بك
في حقل الطلب `model`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

تستدعي عملية التوليد باستخدام الموجّه فقط نقطة نهاية عمليات توليد MAI في Microsoft Foundry:
`/mai/v1/images/generations`. وتستدعي تعديلات الصور المرجعية
`/mai/v1/images/edits`، وهي مقتصرة على عمليتي نشر `MAI-Image-2.5-Flash`
و`MAI-Image-2.5`.

يمكن لعملية التوليد باستخدام الموجّه فقط استخدام اسم عملية نشر مخصص مع تهيئة نقطة نهاية
Foundry وحدها. ولتعديلات الصور باستخدام اسم عملية نشر مخصص، حدّد
عملية النشر من خلال الإعداد الأولي أو ضمّن البيانات الوصفية للنموذج كي يتمكن OpenClaw من التحقق
من أن عملية النشر مدعومة بواسطة `MAI-Image-2.5-Flash` أو `MAI-Image-2.5`.

قيود صور MAI:

- الإخراج: صورة PNG واحدة لكل طلب.
- الحجم: القيمة الافتراضية `1024x1024`؛ يجب ألا يقل كل من العرض والارتفاع عن 768 px.
- إجمالي وحدات البكسل: يجب ألا يتجاوز العرض × الارتفاع 1,048,576.
- التعديلات: صورة إدخال واحدة بتنسيق PNG أو JPEG.
- لا تُرسَل إلى Microsoft Foundry التلميحات المشتركة غير المدعومة، مثل `aspectRatio` و`resolution` و`quality`
  و`background`، وكذلك `outputFormat` غير المنسّق بتنسيق PNG.

## استكشاف الأخطاء وإصلاحها

- `az: command not found`: ثبّت Azure CLI أو استخدم المصادقة بمفتاح API.
- `Microsoft Foundry endpoint missing for MAI image generation`: حدّد
  عملية نشر Foundry من خلال الإعداد الأولي أو أضف `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: يشير نموذج الصور المحدد إلى
  عملية نشر ليست من MAI. استخدم نموذج صور MAI منشورًا لـ `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
