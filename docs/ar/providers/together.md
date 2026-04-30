---
read_when:
    - تريد استخدام Together AI مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح واجهة برمجة التطبيقات أو خيار مصادقة CLI
summary: إعداد Together AI (المصادقة + اختيار النموذج)
title: Together AI
x-i18n:
    generated_at: "2026-04-30T08:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) يوفّر وصولًا إلى نماذج مفتوحة المصدر رائدة، بما في ذلك Llama وDeepSeek وKimi والمزيد، عبر API موحّد.

| الخاصية | القيمة                        |
| -------- | ----------------------------- |
| المزوّد | `together`                    |
| المصادقة | `TOGETHER_API_KEY`            |
| API      | متوافق مع OpenAI              |
| عنوان URL الأساسي | `https://api.together.xyz/v1` |

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
    أنشئ مفتاح API في
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="عيّن نموذجًا افتراضيًا">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### مثال غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
يضبط إعداد الإعداد الأولي المسبق `together/moonshotai/Kimi-K2.5` بوصفه النموذج الافتراضي.
</Note>

## الكتالوج المضمّن

يشحن OpenClaw كتالوج Together المضمّن هذا:

| مرجع النموذج                                                 | الاسم                                  | الإدخال     | السياق    | الملاحظات                       |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | نص، صورة    | 262,144    | النموذج الافتراضي؛ الاستدلال مفعّل |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | نص          | 202,752    | نموذج نصوص عام الغرض             |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | نص          | 131,072    | نموذج تعليمات سريع              |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | نص، صورة    | 10,000,000 | متعدد الوسائط                   |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | نص، صورة    | 20,000,000 | متعدد الوسائط                   |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | نص          | 131,072    | نموذج نصوص عام                  |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | نص          | 131,072    | نموذج استدلال                   |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | نص          | 262,144    | نموذج نصوص Kimi ثانوي           |

## إنشاء الفيديو

يسجّل Plugin `together` المضمّن أيضًا إنشاء الفيديو من خلال أداة `video_generate` المشتركة.

| الخاصية             | القيمة                                |
| -------------------- | ------------------------------------- |
| نموذج الفيديو الافتراضي | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| الأوضاع              | تحويل النص إلى فيديو، مرجع صورة واحدة |
| المعلمات المدعومة    | `aspectRatio`, `resolution`           |

لاستخدام Together كمزوّد الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Tip>

<AccordionGroup>
  <Accordion title="ملاحظة حول البيئة">
    إذا كان Gateway يعمل كبرنامج خفي (launchd/systemd)، فتأكد من إتاحة
    `TOGETHER_API_KEY` لتلك العملية (على سبيل المثال، في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المضبوطة فقط في الصدفة التفاعلية لديك لا تكون مرئية لعمليات Gateway المُدارة كبرامج خفية. استخدم إعداد `~/.openclaw/.env` أو `env.shellEnv` للإتاحة المستمرة.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - تحقق من أن مفتاحك يعمل: `openclaw models list --provider together`
    - إذا لم تظهر النماذج، فتأكد من ضبط مفتاح API في البيئة الصحيحة لعملية Gateway لديك.
    - تستخدم مراجع النماذج الصيغة `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّد، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة إنشاء الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل، بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Together AI، ووثائق API، والأسعار.
  </Card>
</CardGroup>
