---
read_when:
    - تريد استخدام Cohere مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح Cohere API أو خيار مصادقة CLI
summary: إعداد Cohere (المصادقة + اختيار النموذج)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:23:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

يوفر [Cohere](https://cohere.com) الاستدلال المتوافق مع OpenAI عبر Compatibility API. يشحن OpenClaw مزود Cohere أثناء انتقاله إلى الإخراج الخارجي، وينشره أيضًا كـ Plugin خارجي رسمي مع كتالوج نماذج Command A.

| الخاصية        | القيمة                                                |
| --------------- | ---------------------------------------------------- |
| معرف المزود     | `cohere`                                             |
| Plugin          | مضمّن أثناء الانتقال؛ حزمة خارجية رسمية |
| متغير بيئة المصادقة    | `COHERE_API_KEY`                                     |
| علم الإعداد الأولي | `--auth-choice cohere-api-key`                       |
| علم CLI المباشر | `--cohere-api-key <key>`                             |
| API             | متوافق مع OpenAI (`openai-completions`)             |
| عنوان URL الأساسي        | `https://api.cohere.ai/compatibility/v1`             |
| النموذج الافتراضي   | `cohere/command-a-03-2025`                           |

## ابدأ

1. Cohere مضمن في حزم OpenClaw الحالية. إذا لم يكن متاحًا، فثبّت الحزمة الخارجية وأعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. أنشئ مفتاح Cohere API.
3. شغّل الإعداد الأولي:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. تأكد من توفر الكتالوج:

```bash
openclaw models list --provider cohere
```

يتم تعيين النموذج الافتراضي فقط عندما لا يكون هناك نموذج أساسي مكوّن بالفعل.

## الإعداد باستخدام البيئة فقط

اجعل `COHERE_API_KEY` متاحًا لعملية Gateway، ثم اختر نموذج Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
إذا كان Gateway يعمل كخدمة daemon أو داخل Docker، فكوّن `COHERE_API_KEY` لتلك الخدمة. تصديره في shell تفاعلي فقط لا يجعله متاحًا لـ Gateway يعمل بالفعل.
</Note>

## ذات صلة

- [مزودو النماذج](/ar/concepts/model-providers)
- [Models CLI](/ar/cli/models)
- [دليل المزودين](/ar/providers)
