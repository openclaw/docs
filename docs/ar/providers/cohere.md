---
read_when:
    - تريد استخدام Cohere مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح Cohere API أو خيار المصادقة عبر CLI
summary: إعداد Cohere (المصادقة + اختيار النموذج)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T06:26:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) يوفّر استدلالًا متوافقًا مع OpenAI عبر واجهة Compatibility API الخاصة به. يضم OpenClaw موفّر Cohere أثناء انتقاله إلى حزمة خارجية، وينشره أيضًا بوصفه Plugin خارجيًا رسميًا.

| الخاصية          | القيمة                                                |
| ---------------- | ----------------------------------------------------- |
| معرّف الموفّر    | `cohere`                                              |
| Plugin           | مضمّن أثناء الانتقال؛ حزمة خارجية رسمية              |
| متغير بيئة المصادقة | `COHERE_API_KEY`                                   |
| خيار الإعداد الأولي | `--auth-choice cohere-api-key`                     |
| خيار CLI المباشر | `--cohere-api-key <key>`                              |
| واجهة API        | متوافقة مع OpenAI ‏(`openai-completions`)             |
| عنوان URL الأساسي | `https://api.cohere.ai/compatibility/v1`            |
| النموذج الافتراضي | `cohere/command-a-plus-05-2026`                      |
| نافذة السياق     | 128,000 رمز                                           |

## الكتالوج المضمّن

| مرجع النموذج                         | الإدخال     | السياق | الحد الأقصى للإخراج | ملاحظات                                      |
| ------------------------------------ | ----------- | ------- | ------------------- | -------------------------------------------- |
| `cohere/command-a-plus-05-2026`      | نص، صورة    | 128,000 | 64,000              | الافتراضي؛ النموذج الرائد للمهام الوكيلة والاستدلال |
| `cohere/command-a-03-2025`           | نص          | 256,000 | 8,000               | نموذج Command A السابق                       |
| `cohere/command-a-reasoning-08-2025` | نص          | 256,000 | 32,000              | الاستدلال الوكيلي واستخدام الأدوات            |
| `cohere/command-a-vision-07-2025`    | نص، صورة    | 128,000 | 8,000               | تحليل الصور والمستندات؛ من دون استخدام الأدوات |
| `cohere/north-mini-code-1-0`         | نص، صورة    | 256,000 | 64,000              | برمجة وكيلة؛ استدلال؛ حدود مجانية             |

تدعم نماذج Cohere القادرة على الاستدلال وضعين للاستدلال في Compatibility API. يربط OpenClaw الخيار **إيقاف** بالقيمة `none`، ويربط كل مستوى تفكير مفعّل بالقيمة `high`. لا يدعم Command A Vision استخدام الأدوات، لذا يُبقي OpenClaw أدوات الوكيل معطّلة لهذا النموذج.

## البدء

1. يأتي Cohere مضمّنًا مع حزم OpenClaw الحالية. إذا كان مفقودًا، فثبّت الحزمة الخارجية وأعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. أنشئ مفتاح API لـ Cohere.
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

لا يعيّن الإعداد الأولي Cohere بوصفه النموذج الأساسي إلا عند عدم تهيئة نموذج أساسي مسبقًا.

## الإعداد باستخدام البيئة فقط

اجعل `COHERE_API_KEY` متاحًا لعملية Gateway، ثم اختر نموذج Cohere:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
إذا كان Gateway يعمل كخدمة خلفية أو داخل Docker، فاضبط `COHERE_API_KEY` لتلك الخدمة. إن تصديره في صدفة تفاعلية فقط لا يجعله متاحًا لعملية Gateway قيد التشغيل بالفعل.
</Note>

## ذو صلة

- [موفّرو النماذج](/ar/concepts/model-providers)
- [CLI للنماذج](/ar/cli/models)
- [دليل الموفّرين](/ar/providers/index)
