---
read_when:
    - أنت تثبّت Plugin ‏microsoft-foundry أو تهيّئه أو تدقّق فيه
summary: يضيف دعم موفّر نماذج Microsoft Foundry إلى OpenClaw.
title: Plugin ‏Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T06:21:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

يضيف دعم موفّر نماذج Microsoft Foundry إلى OpenClaw.

## التوزيع

- الحزمة: `@openclaw/microsoft-foundry`
- مسار التثبيت: مضمّن في OpenClaw

## الواجهات

الموفّرون: microsoft-foundry؛ العقود: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- موفّر توليد الصور: `microsoft-foundry`

## المتطلبات

- مورد Microsoft Foundry أو Azure AI Foundry يحتوي على عمليات نشر.
- مصادقة بمفتاح API عبر `AZURE_OPENAI_API_KEY` أو مفتاح API مُهيّأ للموفّر.
- لمصادقة Entra ID، ثبّت Azure CLI وشغّل `az login` قبل
  الإعداد الأولي. يحدّث OpenClaw رموز تشغيل Microsoft Foundry من خلال
  `az account get-access-token`.

## نماذج المحادثة

تستخدم عمليات نشر المحادثة في Microsoft Foundry مرجع نموذج الموفّر
`microsoft-foundry/<deployment-name>`. يكتشف الإعداد الأولي موارد Foundry
وعمليات النشر باستخدام Azure CLI، ثم يكتب اسم عملية النشر المحددة في
إعدادات النموذج.

يستخدم OpenClaw نقطة نهاية Foundry المسماة `/openai/v1` لواجهات API المتوافقة
مع OpenAI والمدعومة للمحادثة:

- تستخدم عائلات نماذج GPT و`o*` و`computer-use-preview` وDeepSeek-V4 افتراضيًا
  `openai-responses`.
- تستخدم عمليات نشر MAI-DS-R1 وغيرها من عمليات نشر إكمال المحادثة
  `openai-completions` ما لم تُهيّأ واجهة API مدعومة صراحةً.
- يُسجَّل MAI-DS-R1 بوصفه قادرًا على الاستدلال من خلال محتوى الاستدلال، وليس
  من خلال `reasoning_effort`. وتبلغ بياناته الوصفية لرموز السياق والإخراج
  163,840 رمزًا.

تستخدم عمليات نشر Anthropic Claude في Microsoft Foundry بنية واجهة API
المسماة Anthropic Messages، وليس البنية المتوافقة مع OpenAI المسماة
`/openai/v1`. هيّئها كموفّر `anthropic-messages` مخصص إلى أن يضيف Plugin
Microsoft Foundry بيئة تشغيل أصلية لـ Anthropic. عندما يختلف اسم عملية نشر
Foundry عن معرّف نموذج Claude، عيّن `params.canonicalModelId` في إدخال النموذج
حتى يتمكن OpenClaw من تطبيق عقود الاتصال الخاصة بالنموذج، وربط `/think off`
بشكل صحيح، والحفاظ على التفكير الموقّع بأمان.

## توليد الصور باستخدام MAI

يسجّل Plugin الموفّر `microsoft-foundry` للأداة `image_generate` مع نماذج صور
Microsoft AI الحالية:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

استخدم اسم عملية نشر صور MAI منشورة كمرجع للنموذج. لا يصرّح الموفّر بنموذج
صور افتراضي لأن واجهة API الخاصة بـ MAI تتطلب اسم عملية النشر في حقل `model`
ضمن الطلب:

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

تستدعي عملية التوليد المعتمدة على الموجّه فقط نقطة نهاية توليد MAI في
Microsoft Foundry: `/mai/v1/images/generations`. وتستدعي عمليات التحرير
باستخدام صورة مرجعية `/mai/v1/images/edits`، وهي مقتصرة على عمليات نشر
`MAI-Image-2.5-Flash` و`MAI-Image-2.5`.

يمكن لعملية التوليد المعتمدة على الموجّه فقط استخدام اسم عملية نشر مخصص مع
تهيئة نقطة نهاية Foundry وحدها. لتحرير الصور باستخدام اسم عملية نشر مخصص،
حدّد عملية النشر من خلال الإعداد الأولي أو أدرج البيانات الوصفية للنموذج حتى
يتمكن OpenClaw من التحقق من أن عملية النشر مدعومة بواسطة
`MAI-Image-2.5-Flash` أو `MAI-Image-2.5`.

قيود صور MAI:

- الإخراج: صورة PNG واحدة لكل طلب.
- الحجم: القيمة الافتراضية `1024x1024`؛ يجب ألا يقل العرض أو الارتفاع عن 768 بكسل.
- إجمالي وحدات البكسل: يجب ألا يتجاوز حاصل العرض × الارتفاع 1,048,576.
- عمليات التحرير: صورة إدخال واحدة بتنسيق PNG أو JPEG.
- لا تُرسل التلميحات المشتركة غير المدعومة، مثل `aspectRatio` و`resolution`
  و`quality` و`background`، ولا قيم `outputFormat` غير PNG، إلى Microsoft Foundry.

## استكشاف الأخطاء وإصلاحها

- `az: command not found`: ثبّت Azure CLI أو استخدم المصادقة بمفتاح API.
- `Microsoft Foundry endpoint missing for MAI image generation`: حدّد عملية نشر
  Foundry من خلال الإعداد الأولي أو أضف `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: يشير نموذج الصور المحدد إلى عملية نشر
  لا تستخدم MAI. استخدم نموذج صور MAI منشورًا مع `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
