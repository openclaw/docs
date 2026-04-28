---
read_when:
- تريد استخدام Hugging Face Inference مع OpenClaw
- You need the HF token env var or CLI auth choice
summary: إعداد Hugging Face Inference ‏(المصادقة + اختيار النموذج)
title: Hugging Face ‏(inference)
x-i18n:
  generated_at: '2026-04-24T07:59:09Z'
  refreshed_at: '2026-04-28T05:23:26Z'
  model: gpt-5.4
  provider: openai
  source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
  source_path: providers/huggingface.md
  workflow: 15
---

[موفرو Hugging Face Inference](https://huggingface.co/docs/inference-providers) يوفّرون إكمالات دردشة متوافقة مع OpenAI عبر API موجهة واحدة. وتحصل على وصول إلى العديد من النماذج (DeepSeek وLlama وغير ذلك) باستخدام رمز واحد. يستخدم OpenClaw **نقطة النهاية المتوافقة مع OpenAI** ‏(إكمالات الدردشة فقط)؛ أما بالنسبة إلى text-to-image أو embeddings أو speech فاستخدم [عملاء HF inference](https://huggingface.co/docs/api-inference/quicktour) مباشرة.

- الموفّر: `huggingface`
- المصادقة: `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN` ‏(رمز دقيق الصلاحيات مع **Make calls to Inference Providers**)
- API: متوافقة مع OpenAI ‏(`https://router.huggingface.co/v1`)
- الفوترة: رمز HF واحد؛ وتتبع [الأسعار](https://huggingface.co/docs/inference-providers/pricing) أسعار الموفّرين مع مستوى مجاني.

## البدء

<Steps>
  <Step title="إنشاء رمز دقيق الصلاحيات">
    انتقل إلى [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) وأنشئ رمزًا جديدًا دقيق الصلاحيات.

    <Warning>
    يجب أن يكون لدى الرمز إذن **Make calls to Inference Providers** مفعّلًا، وإلا فسيتم رفض طلبات API.
    </Warning>

  </Step>
  <Step title="تشغيل onboarding">
    اختر **Hugging Face** في القائمة المنسدلة الخاصة بالموفّر، ثم أدخل مفتاح API عند المطالبة:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="اختيار نموذج افتراضي">
    في القائمة المنسدلة **Default Hugging Face model**، اختر النموذج الذي تريده. يتم تحميل القائمة من Inference API عندما يكون لديك رمز صالح؛ وإلا فسيتم عرض قائمة مضمّنة. ويتم حفظ اختيارك بوصفه النموذج الافتراضي.

    يمكنك أيضًا ضبط النموذج الافتراضي أو تغييره لاحقًا في الإعدادات:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="التحقق من أن النموذج متاح">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### إعداد غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

سيؤدي هذا إلى ضبط `huggingface/deepseek-ai/DeepSeek-R1` كنموذج افتراضي.

## معرّفات النماذج

تستخدم مراجع النماذج الصيغة `huggingface/<org>/<model>` ‏(معرّفات على نمط Hub). والقائمة أدناه مأخوذة من **GET** ‏`https://router.huggingface.co/v1/models`؛ وقد يتضمن كتالوجك المزيد.

| النموذج                 | المرجع (أضف إليه البادئة `huggingface/`) |
| ---------------------- | ---------------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`                |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`              |
| Qwen3 8B               | `Qwen/Qwen3-8B`                          |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`               |
| Qwen3 32B              | `Qwen/Qwen3-32B`                         |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct`      |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`       |
| GPT-OSS 120B           | `openai/gpt-oss-120b`                    |
| GLM 4.7                | `zai-org/GLM-4.7`                        |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`                   |

<Tip>
يمكنك إلحاق `:fastest` أو `:cheapest` بأي معرّف نموذج. اضبط ترتيبك الافتراضي في [إعدادات Inference Provider](https://hf.co/settings/inference-providers)؛ وراجع [Inference Providers](https://huggingface.co/docs/inference-providers) و**GET** ‏`https://router.huggingface.co/v1/models` للحصول على القائمة الكاملة.
</Tip>

## إعداد متقدم

<AccordionGroup>
  <Accordion title="اكتشاف النماذج والقائمة المنسدلة في onboarding">
    يكتشف OpenClaw النماذج عبر استدعاء **نقطة نهاية Inference مباشرة**:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    ‏(اختياري: أرسل `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` أو `$HF_TOKEN` للحصول على القائمة الكاملة؛ إذ تعيد بعض النقاط مجموعة فرعية بدون مصادقة.) تكون الاستجابة بأسلوب OpenAI على شكل `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    عندما تضبط مفتاح Hugging Face API ‏(عبر onboarding أو `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`)، يستخدم OpenClaw طلب GET هذا لاكتشاف نماذج chat-completion المتاحة. وأثناء **الإعداد التفاعلي**، بعد إدخال الرمز تظهر لك قائمة منسدلة باسم **Default Hugging Face model** يتم ملؤها من تلك القائمة (أو من الكتالوج المضمّن إذا فشل الطلب). وفي وقت التشغيل (مثل بدء Gateway)، عندما يكون هناك مفتاح حاضر، يستدعي OpenClaw مرة أخرى **GET** ‏`https://router.huggingface.co/v1/models` لتحديث الكتالوج. ويتم دمج القائمة مع كتالوج مضمّن (للبيانات الوصفية مثل نافذة السياق والتكلفة). وإذا فشل الطلب أو لم يتم ضبط مفتاح، فسيُستخدم الكتالوج المضمّن فقط.

  </Accordion>

  <Accordion title="أسماء النماذج والأسماء المستعارة ولاحقات السياسة">
    - **الاسم من API:** يتم **إغناء** اسم عرض النموذج من **GET /v1/models** عندما تعيد API القيم `name` أو `title` أو `display_name`؛ وإلا فيُشتق من معرّف النموذج (على سبيل المثال يصبح `deepseek-ai/DeepSeek-R1` هو "DeepSeek R1").
    - **تجاوز اسم العرض:** يمكنك ضبط تسمية مخصصة لكل نموذج في الإعدادات بحيث يظهر بالطريقة التي تريدها في CLI وواجهة المستخدم:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **لاحقات السياسة:** تتعامل وثائق ومساعدات Hugging Face المضمّنة في OpenClaw حاليًا مع هاتين اللاحقتين بوصفهما متغيري السياسة المضمّنين:
      - **`:fastest`** — أعلى معدل إنتاجية.
      - **`:cheapest`** — أقل تكلفة لكل رمز خرج.

      يمكنك إضافتهما كإدخالات منفصلة في `models.providers.huggingface.models` أو ضبط `model.primary` مع اللاحقة. ويمكنك أيضًا ضبط ترتيب الموفّر الافتراضي في [إعدادات Inference Provider](https://hf.co/settings/inference-providers) ‏(من دون لاحقة = استخدام ذلك الترتيب).

    - **دمج الإعدادات:** يتم الاحتفاظ بالإدخالات الموجودة في `models.providers.huggingface.models` ‏(مثل الموجودة في `models.json`) عند دمج الإعدادات. ولذلك يتم الحفاظ على أي `name` أو `alias` أو خيارات نموذج مخصصة تضبطها هناك.

  </Accordion>

  <Accordion title="البيئة وإعداد daemon">
    إذا كانت Gateway تعمل بوصفها daemon ‏(launchd/systemd)، فتأكد من أن `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN` متاح للعملية (على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Note>
    يقبل OpenClaw كلًا من `HUGGINGFACE_HUB_TOKEN` و`HF_TOKEN` كأسماء مستعارة لمتغير البيئة. يعمل أيٌّ منهما؛ وإذا تم ضبط كليهما، فإن `HUGGINGFACE_HUB_TOKEN` له الأولوية.
    </Note>

  </Accordion>

  <Accordion title="الإعداد: DeepSeek R1 مع Qwen احتياطيًا">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="الإعداد: Qwen مع متغيري cheapest وfastest">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="الإعداد: DeepSeek + Llama + GPT-OSS مع أسماء مستعارة">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="الإعداد: عدة نماذج Qwen وDeepSeek مع لاحقات السياسة">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين ومراجع النماذج وسلوك failover.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="وثائق Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    الوثائق الرسمية لـ Hugging Face Inference Providers.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعدادات الكامل.
  </Card>
</CardGroup>
