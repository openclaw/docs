---
read_when:
    - تريد استخدام Together AI مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API أو خيار المصادقة عبر CLI
summary: إعداد Together AI (المصادقة + اختيار النموذج)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T06:32:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) تتيح الوصول إلى نماذج رائدة مفتوحة المصدر، بما فيها Llama وDeepSeek وKimi وغيرها، من خلال API موحّدة.
تتضمنها OpenClaw بوصفها المزوّد `together`.

| الخاصية | القيمة                         |
| -------- | ----------------------------- |
| المزوّد | `together`                    |
| المصادقة | `TOGETHER_API_KEY`            |
| API      | متوافقة مع OpenAI             |
| عنوان URL الأساسي | `https://api.together.xyz/v1` |

## بدء الاستخدام

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API في
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="تعيين نموذج افتراضي">
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
يعيّن الإعداد الأولي `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` بوصفه
النموذج الافتراضي.
</Note>

## الكتالوج المضمّن

التكلفة بالدولار الأمريكي لكل مليون رمز.

| مرجع النموذج                                      | الاسم                         | الإدخال       | السياق | الحد الأقصى للإخراج | التكلفة (إدخال/إخراج) | ملاحظات               |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | نص        | 131,072 | 8,192      | 0.88 / 0.88   | النموذج الافتراضي       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | نص، صورة | 262,144 | 32,768     | 1.20 / 4.50   | نموذج استدلال     |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | نص        | 512,000 | 8,192      | 2.10 / 4.40   | نموذج استدلال     |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | نص        | 32,768  | 8,192      | 0.30 / 0.30   | سريع، من دون استدلال |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | نص        | 202,752 | 8,192      | 1.40 / 4.40   | نموذج استدلال     |

## توليد الفيديو

يسجّل Plugin `together` المضمّن أيضًا إمكانية توليد الفيديو من خلال
الأداة المشتركة `video_generate`.

| الخاصية             | القيمة                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| نموذج الفيديو الافتراضي  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| النماذج الأخرى         | `Wan-AI/Wan2.2-I2V-A14B`، `minimax/Hailuo-02`، `Kwai/Kling-2.1-Master`                    |
| الأوضاع                | تحويل النص إلى فيديو؛ وتحويل الصورة إلى فيديو فقط باستخدام `Wan-AI/Wan2.2-I2V-A14B` (صورة مرجعية واحدة) |
| المدة             | من ثانية واحدة إلى 10 ثوانٍ                                                                              |
| المعلمات المدعومة | `size` (تُحلّل بالتنسيق `<width>x<height>`)؛ لا تُقرأ `aspectRatio` و`resolution`            |

لاستخدام Together بوصفه مزوّد الفيديو الافتراضي:

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة،
واختيار المزوّد، وسلوك الانتقال عند التعطل.
</Tip>

<AccordionGroup>
  <Accordion title="ملاحظة حول البيئة">
    إذا كان Gateway يعمل بوصفه خدمة خلفية (launchd/systemd)، فتأكد من أن
    `TOGETHER_API_KEY` متاح لتلك العملية (على سبيل المثال، في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المعيّنة في الصدفة التفاعلية فقط لا تكون مرئية لعمليات
    Gateway المُدارة بوصفها خدمة خلفية. استخدم `~/.openclaw/.env` أو إعداد
    `env.shellEnv` لضمان الإتاحة الدائمة.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - تحقّق من أن مفتاحك يعمل: `openclaw models list --provider together`
    - إذا لم تظهر النماذج، فتأكد من تعيين مفتاح API في البيئة الصحيحة
      لعملية Gateway.
    - تستخدم مراجع النماذج الصيغة `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## مواضيع ذات صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّد، ومراجع النماذج، وسلوك الانتقال عند التعطل.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة توليد الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل، بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    لوحة معلومات Together AI، ووثائق API، والأسعار.
  </Card>
</CardGroup>
