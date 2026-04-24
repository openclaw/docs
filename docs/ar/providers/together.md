---
read_when:
    - تريد استخدام Together AI مع OpenClaw
    - تحتاج إلى متغير بيئة مفتاح API أو خيار المصادقة في CLI
summary: إعداد Together AI ‏(المصادقة + اختيار النموذج)
title: Together AI
x-i18n:
    generated_at: "2026-04-24T08:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6a11f212fbef79e399d4a50cec88150bf0b7abf80ad765f0a617786bb051c8e
    source_path: providers/together.md
    workflow: 15
---

توفّر [Together AI](https://together.ai) وصولًا إلى نماذج مفتوحة المصدر رائدة
بما في ذلك Llama وDeepSeek وKimi وغيرها عبر واجهة API موحدة.

| الخاصية | القيمة                        |
| -------- | ----------------------------- |
| المزوّد | `together`                    |
| المصادقة | `TOGETHER_API_KEY`           |
| API      | متوافقة مع OpenAI             |
| Base URL | `https://api.together.xyz/v1` |

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
    أنشئ مفتاح API على
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="شغّل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="اضبط نموذجًا افتراضيًا">
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
يضبط الإعداد الأولي القيمة `together/moonshotai/Kimi-K2.5` كنموذج
افتراضي.
</Note>

## الكتالوج المضمّن

يشحن OpenClaw كتالوج Together المضمّن التالي:

| مرجع النموذج                                                 | الاسم                                   | الإدخال       | السياق     | ملاحظات                           |
| ------------------------------------------------------------ | -------------------------------------- | ------------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | نص، صورة      | 262,144    | النموذج الافتراضي؛ التفكير مفعّل |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | نص            | 202,752    | نموذج نصي عام الاستخدام          |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | نص            | 131,072    | نموذج تعليمات سريع               |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | نص، صورة      | 10,000,000 | متعدد الوسائط                    |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | نص، صورة      | 20,000,000 | متعدد الوسائط                    |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | نص            | 131,072    | نموذج نصي عام                    |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | نص            | 131,072    | نموذج استدلال                    |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | نص            | 262,144    | نموذج نصي ثانوي من Kimi          |

## توليد الفيديو

كما تسجّل Plugin المضمّنة `together` توليد الفيديو عبر
الأداة المشتركة `video_generate`.

| الخاصية             | القيمة                                 |
| -------------------- | ------------------------------------- |
| نموذج الفيديو الافتراضي | `together/Wan-AI/Wan2.2-T2V-A14B`    |
| الأوضاع              | تحويل النص إلى فيديو، ومرجع صورة واحدة |
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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة،
واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Tip>

<AccordionGroup>
  <Accordion title="ملاحظة حول البيئة">
    إذا كانت Gateway تعمل كخدمة daemon ‏(launchd/systemd)، فتأكد من أن
    `TOGETHER_API_KEY` متاح لتلك العملية (مثلًا في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Warning>
    المفاتيح المضبوطة فقط في shell التفاعلية لديك لا تكون مرئية لعمليات
    gateway المُدارة كخدمة daemon. استخدم `~/.openclaw/.env` أو تهيئة `env.shellEnv`
    لتوفير دائم.
    </Warning>

  </Accordion>

  <Accordion title="استكشاف الأخطاء وإصلاحها">
    - تحقّق من أن مفتاحك يعمل: `openclaw models list --provider together`
    - إذا لم تكن النماذج تظهر، فتأكد من أن مفتاح API مضبوط في البيئة
      الصحيحة لعملية Gateway الخاصة بك.
    - تستخدم مراجع النماذج الشكل `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    قواعد المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة توليد الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    schema التهيئة الكاملة بما في ذلك إعدادات المزوّد.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    لوحة تحكم Together AI, ووثائق API, والأسعار.
  </Card>
</CardGroup>
