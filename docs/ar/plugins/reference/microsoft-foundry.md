---
read_when:
    - أنت بصدد تثبيت Plugin microsoft-foundry أو تهيئته أو تدقيقه
summary: يضيف دعم موفّر نماذج Microsoft Foundry إلى OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T18:13:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Microsoft Foundry Plugin

يضيف دعم موفر نماذج Microsoft Foundry إلى OpenClaw.

## التوزيع

- الحزمة: `@openclaw/microsoft-foundry`
- مسار التثبيت: مضمّن في OpenClaw

## الواجهة

providers: microsoft-foundry; contracts: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- موفر إنشاء الصور: `microsoft-foundry`

## المتطلبات

- مورد Microsoft Foundry أو Azure AI Foundry مع عمليات نشر.
- مصادقة بمفتاح API عبر `AZURE_OPENAI_API_KEY` أو مفتاح API مهيأ للموفر.
- لمصادقة Entra ID، ثبّت Azure CLI وشغّل `az login` قبل
  الإعداد. يحدّث OpenClaw رموز تشغيل Microsoft Foundry عبر
  `az account get-access-token`.

## نماذج المحادثة

تستخدم عمليات نشر محادثة Microsoft Foundry مرجع نموذج الموفر
`microsoft-foundry/<deployment-name>`. يكتشف الإعداد موارد Foundry
وعمليات النشر باستخدام Azure CLI، ثم يكتب اسم النشر المحدد إلى
تهيئة النموذج.

يستخدم OpenClaw نقطة نهاية Foundry `/openai/v1` لواجهات API المحادثة
المتوافقة مع OpenAI والمدعومة:

- عائلات نماذج GPT و`o*` و`computer-use-preview` وDeepSeek-V4 تستخدم
  `openai-responses` افتراضيًا.
- تستخدم عمليات نشر MAI-DS-R1 وغيرها من عمليات نشر إكمالات المحادثة
  `openai-completions` ما لم تُهيّأ واجهة API مدعومة صراحةً.
- يُسجَّل MAI-DS-R1 على أنه قادر على الاستدلال عبر محتوى الاستدلال، وليس
  عبر `reasoning_effort`. تبلغ بيانات تعريف رموز السياق والإخراج الخاصة به
  163,840 رمزًا.

تستخدم عمليات نشر Anthropic Claude في Microsoft Foundry شكل واجهة API
Anthropic Messages، وليس الشكل المتوافق مع OpenAI عبر `/openai/v1`. هيّئها
كموفر `anthropic-messages` مخصص إلى أن يضيف Microsoft Foundry Plugin
تشغيلًا أصليًا لـ Anthropic. عندما يختلف اسم نشر Foundry عن معرف نموذج
Claude، اضبط `params.canonicalModelId` في إدخال النموذج حتى يتمكن OpenClaw
من تطبيق عقود الاتصال الخاصة بالنموذج، وربط `/think off` بشكل صحيح،
والحفاظ على التفكير الموقّع بأمان.

## إنشاء صور MAI

يسجّل Plugin `microsoft-foundry` لـ `image_generate` مع نماذج صور
Microsoft AI الحالية:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

استخدم اسم نشر صور MAI منشورًا كمرجع النموذج. لا يعلن الموفر عن نموذج صور
افتراضي لأن واجهة API الخاصة بـ MAI تتطلب اسم النشر في حقل `model` في الطلب:

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

تستدعي عمليات الإنشاء المعتمدة على الموجه فقط نقطة نهاية عمليات إنشاء MAI
في Microsoft Foundry:
`/mai/v1/images/generations`. وتستدعي تعديلات الصور المرجعية
`/mai/v1/images/edits` وتقتصر على عمليات نشر `MAI-Image-2.5-Flash` و
`MAI-Image-2.5`.

يمكن لعمليات الإنشاء المعتمدة على الموجه فقط استخدام اسم نشر مخصص مع تهيئة
نقطة نهاية Foundry فقط. لتعديلات الصور باسم نشر مخصص، حدد النشر عبر الإعداد
أو أدرج بيانات تعريف النموذج حتى يتمكن OpenClaw من التحقق من أن النشر مدعوم
بـ `MAI-Image-2.5-Flash` أو `MAI-Image-2.5`.

قيود صور MAI:

- الإخراج: صورة PNG واحدة لكل طلب.
- الحجم: الافتراضي `1024x1024`؛ يجب أن يكون كل من العرض والارتفاع 768 بكسل على الأقل.
- إجمالي البكسلات: يجب ألا يتجاوز العرض × الارتفاع 1,048,576.
- التعديلات: صورة إدخال واحدة بتنسيق PNG أو JPEG.
- لا تُرسل التلميحات المشتركة غير المدعومة مثل `aspectRatio` و`resolution` و`quality`
  و`background` و`outputFormat` غير PNG إلى Microsoft Foundry.

## استكشاف الأخطاء وإصلاحها

- `az: command not found`: ثبّت Azure CLI أو استخدم مصادقة مفتاح API.
- `Microsoft Foundry endpoint missing for MAI image generation`: حدد نشر
  Foundry عبر الإعداد أو أضف `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: يشير نموذج الصور المحدد إلى نشر غير
  MAI. استخدم نموذج صور MAI منشورًا لـ `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->
