---
read_when:
    - تريد استخدام Hugging Face Inference مع OpenClaw
    - تحتاج إلى متغير البيئة لرمز HF أو خيار المصادقة عبر CLI
summary: إعداد Hugging Face Inference (المصادقة + اختيار النموذج)
title: Hugging Face (الاستدلال)
x-i18n:
    generated_at: "2026-07-12T06:27:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

توفّر [Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) موجّهًا لإكمالات المحادثة متوافقًا مع OpenAI أمام العديد من النماذج المستضافة (DeepSeek وLlama وغيرها) باستخدام رمز مميز واحد. يتواصل OpenClaw مع **نقطة نهاية إكمالات المحادثة فقط**؛ ولتحويل النص إلى صورة أو إنشاء التضمينات أو معالجة الكلام، استخدم [عملاء استدلال HF](https://huggingface.co/docs/api-inference/quicktour) مباشرةً.

| الخاصية                    | القيمة                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| معرّف المزوّد             | `huggingface`                                                                                                                    |
| Plugin                    | مضمّن (مفعّل افتراضيًا، ولا يتطلب خطوة تثبيت)                                                                                    |
| متغير بيئة المصادقة       | `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN` (رمز مميز دقيق الصلاحيات)                                                                  |
| API                       | متوافقة مع OpenAI (`https://router.huggingface.co/v1`)                                                                           |
| الفوترة                    | رمز HF مميز واحد؛ يتبع [التسعير](https://huggingface.co/docs/inference-providers/pricing) أسعار المزوّد مع فئة مجانية |

## بدء الاستخدام

<Steps>
  <Step title="إنشاء رمز مميز دقيق الصلاحيات">
    انتقل إلى [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) وأنشئ رمزًا مميزًا جديدًا دقيق الصلاحيات.

    <Warning>
    يجب تمكين صلاحية **Make calls to Inference Providers** للرمز المميز، وإلا فستُرفض طلبات API.
    </Warning>

  </Step>
  <Step title="تشغيل الإعداد الأولي">
    اختر **Hugging Face** من القائمة المنسدلة للمزوّد، ثم أدخل مفتاح API عند مطالبتك بذلك:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="اختيار نموذج افتراضي">
    من القائمة المنسدلة **نموذج Hugging Face الافتراضي**، اختر نموذجًا. تُحمّل القائمة من API الاستدلال عندما يكون رمزك المميز صالحًا؛ وإلا يعرض OpenClaw الكتالوج المضمّن أدناه. يُحفظ اختيارك في `agents.defaults.model.primary`:

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
  <Step title="التحقق من توفر النموذج">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### الإعداد غير التفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

يضبط `huggingface/deepseek-ai/DeepSeek-R1` بوصفه النموذج الافتراضي.

## معرّفات النماذج

تستخدم مراجع النماذج الصيغة `huggingface/<org>/<model>` (معرّفات بنمط Hub). كتالوج OpenClaw المضمّن:

| النموذج                      | المرجع (مع إضافة السابقة `huggingface/`)     |
| ---------------------------- | -------------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                    |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                  |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                        |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`    |

<Tip>
عندما يكون رمزك المميز صالحًا، يكتشف OpenClaw أيضًا أي نموذج آخر عبر **GET** `https://router.huggingface.co/v1/models` أثناء الإعداد الأولي وعند بدء تشغيل Gateway، ولذلك يمكن أن يتضمن كتالوجك عددًا أكبر بكثير من النماذج الأربعة المذكورة أعلاه. يمكنك إلحاق `:fastest` أو `:cheapest` بأي معرّف نموذج؛ ويوجّه موجّه HF الطلب إلى مزوّد الاستدلال المطابق. اضبط ترتيب المزوّدين الافتراضي في [إعدادات مزوّدي الاستدلال](https://hf.co/settings/inference-providers).
</Tip>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="اكتشاف النماذج والقائمة المنسدلة للإعداد الأولي">
    يكتشف OpenClaw النماذج باستخدام:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    تأتي الاستجابة بنمط OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    عند وجود مفتاح مُعدّ (من الإعداد الأولي أو `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`)، تُملأ القائمة المنسدلة **نموذج Hugging Face الافتراضي** أثناء الإعداد التفاعلي من نقطة النهاية هذه. يكرر بدء تشغيل Gateway الاستدعاء نفسه لتحديث الكتالوج. تُدمج النماذج المكتشفة مع الكتالوج المضمّن أعلاه (الذي يُستخدم للبيانات الوصفية مثل نافذة السياق والتكلفة عند تطابق المعرّف). إذا فشل الطلب أو لم يُرجع بيانات أو لم يُضبط مفتاح، يعود OpenClaw إلى الكتالوج المضمّن فقط.

    عطّل الاكتشاف دون إزالة المزوّد:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="أسماء النماذج والأسماء المستعارة ولواحق السياسات">
    - **الاسم من API:** تستخدم النماذج المكتشفة قيم `name` أو `title` أو `display_name` من API عند توفرها؛ وإلا يشتق OpenClaw اسمًا من معرّف النموذج (مثلًا، يتحول `deepseek-ai/DeepSeek-R1` إلى "DeepSeek R1").
    - **تجاوز اسم العرض:** اضبط تسمية مخصصة لكل نموذج في الإعداد:

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

    - **لواحق السياسات:** تمثل `:fastest` و`:cheapest` اصطلاحات لموجّه HF، وليستا شيئًا يعيد OpenClaw كتابته: تُرسل اللاحقة حرفيًا كجزء من معرّف النموذج، ويختار موجّه HF مزوّد الاستدلال المطابق. أضف كل متغير بوصفه إدخالًا مستقلًا ضمن `models.providers.huggingface.models` (أو في `model.primary`) إذا كنت تريد اسمًا مستعارًا مميزًا لكل لاحقة.
    - **دمج الإعداد:** يُحتفظ بالإدخالات الموجودة في `models.providers.huggingface.models` (مثلًا في `models.json`) عند دمج الإعداد، ولذلك تستمر أي قيم مخصصة لـ`name` أو `alias` أو خيارات النموذج التي تضبطها هناك بعد إعادة التشغيل.

  </Accordion>

  <Accordion title="إعداد البيئة والبرنامج الخدمي">
    إذا كان Gateway يعمل بوصفه برنامجًا خدميًا (launchd/systemd)، فتأكد من إتاحة `HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN` لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر `env.shellEnv`).

    <Note>
    يقبل OpenClaw كلًا من `HUGGINGFACE_HUB_TOKEN` و`HF_TOKEN`. إذا ضُبط كلاهما، تكون الأولوية لـ`HUGGINGFACE_HUB_TOKEN`.
    </Note>

  </Accordion>

  <Accordion title="الإعداد: DeepSeek R1 مع نموذج احتياطي">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="الإعداد: DeepSeek بمتغيرَي الأقل تكلفة والأسرع">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="الإعداد: DeepSeek وLlama وGPT-OSS بأسماء مستعارة">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
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
    نظرة عامة على جميع المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="وثائق مزوّدي الاستدلال" href="https://huggingface.co/docs/inference-providers" icon="book">
    الوثائق الرسمية لـHugging Face Inference Providers.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل.
  </Card>
</CardGroup>
