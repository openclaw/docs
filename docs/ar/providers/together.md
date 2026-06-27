---
read_when:
    - تريد استخدام Together AI مع OpenClaw
    - تحتاج إلى متغير بيئة مفتاح API أو خيار مصادقة CLI
summary: إعداد Together AI (المصادقة + اختيار النموذج)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:28:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) يوفّر وصولًا إلى نماذج مفتوحة المصدر رائدة، بما في ذلك Llama وDeepSeek وKimi والمزيد عبر API موحّد.

| الخاصية | القيمة                         |
| -------- | ----------------------------- |
| المزوّد | `together`                    |
| المصادقة     | `TOGETHER_API_KEY`            |
| API      | متوافق مع OpenAI             |
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
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
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
يضبط الإعداد الأولي المسبق
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` كنموذج افتراضي.
</Note>

## الفهرس المضمّن

يشحن OpenClaw فهرس Together المضمّن هذا:

| مرجع النموذج                                          | الاسم                         | الإدخال       | السياق | الملاحظات                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | نص        | 131,072 | النموذج الافتراضي        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | نص، صورة | 262,144 | نموذج Kimi للاستدلال |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | نص        | 512,000 | نموذج نصي للاستدلال |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | نص        | 32,768  | نموذج نصي سريع      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | نص        | 202,752 | نموذج نصي للاستدلال |

## توليد الفيديو

يسجّل Plugin المضمّن `together` أيضًا توليد الفيديو عبر أداة
`video_generate` المشتركة.

| الخاصية             | القيمة                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| نموذج الفيديو الافتراضي  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| الأوضاع                | تحويل النص إلى فيديو؛ مرجع صورة واحدة فقط مع `Wan-AI/Wan2.2-I2V-A14B` |
| المعاملات المدعومة | `aspectRatio`, `resolution`                                              |

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
راجع [توليد الفيديو](/ar/tools/video-generation) للاطلاع على معاملات الأداة المشتركة،
واختيار المزوّد، وسلوك تجاوز الفشل.
</Tip>

<AccordionGroup>
  <Accordion title="ملاحظة البيئة">
    إذا كان Gateway يعمل كخدمة daemon (launchd/systemd)، فتأكد من أن
    `TOGETHER_API_KEY` متاح لتلك العملية (على سبيل المثال، في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المضبوطة فقط في الصدفة التفاعلية لديك لا تكون مرئية لعمليات
    Gateway المُدارة بواسطة daemon. استخدم تهيئة `~/.openclaw/.env` أو
    `env.shellEnv` لضمان الإتاحة المستمرة.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - تحقق من أن مفتاحك يعمل: `openclaw models list --provider together`
    - إذا لم تظهر النماذج، فتأكد من ضبط مفتاح API في البيئة الصحيحة
      لعملية Gateway لديك.
    - تستخدم مراجع النماذج الصيغة `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّد، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة توليد الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التهيئة الكامل، بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Together AI، ووثائق API، والأسعار.
  </Card>
</CardGroup>
