---
read_when:
    - تريد استخدام نماذج مفتوحة في OpenClaw مجانًا
    - تحتاج إلى إعداد NVIDIA_API_KEY
    - تريد استخدام Nemotron 3 Ultra عبر NVIDIA
summary: استخدام واجهة API المتوافقة مع OpenAI من NVIDIA في OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T06:30:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

توفّر NVIDIA النماذج المفتوحة مجانًا من خلال واجهة API متوافقة مع OpenAI على
`https://integrate.api.nvidia.com/v1`، مع المصادقة باستخدام مفتاح API من
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). يضبط OpenClaw
موفّر NVIDIA افتراضيًا على Nemotron 3 Ultra، وهو نموذج الاستدلال من NVIDIA الذي يضم
550 مليار مُعامل إجمالًا و55 مليار مُعامل نشط، والمخصص للعمل الوكيلي ذي السياق الطويل.

## بدء الاستخدام

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API على [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="تصدير المفتاح وتشغيل الإعداد الأولي">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="تعيين نموذج NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

للإعداد غير التفاعلي، مرّر المفتاح مباشرةً:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
يؤدي استخدام `--nvidia-api-key` إلى تسجيل المفتاح في سجل الصدفة ومخرجات `ps`. يُفضّل استخدام
متغير البيئة `NVIDIA_API_KEY` متى أمكن.
</Warning>

## مثال على الإعداد

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## الكتالوج المميّز

عند إعداد مفتاح API لـ NVIDIA، تجلب مسارات الإعداد واختيار النموذج
كتالوج النماذج المميّزة العام من NVIDIA من
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json`
وتخزّن النتيجة مؤقتًا لمدة 24 ساعة (أول 32 إدخالًا، تُستورد كصفوف لإدخال النص
المجاني). وبذلك تظهر النماذج المميّزة الجديدة من build.nvidia.com في واجهات الإعداد
واختيار النموذج من دون انتظار إصدار جديد من OpenClaw. عندما تكون الخلاصة المباشرة
متاحة، يكون أول نموذج مُعاد هو الخيار المحدد مسبقًا أثناء إعداد NVIDIA.

يستخدم الجلب سياسة مضيف HTTPS ثابتة لـ `assets.ngc.nvidia.com`. إذا لم يكن
مفتاح API لـ NVIDIA مُعدًا، أو إذا كانت الخلاصة غير متاحة أو غير صالحة،
يرجع OpenClaw إلى الكتالوج المضمّن والقيمة الافتراضية المضمّنة أدناه.

## Nemotron 3 Ultra

Nemotron 3 Ultra هو نموذج NVIDIA الافتراضي في OpenClaw. تسرد صفحة البناء لدى NVIDIA للنموذج
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
النموذج كنقطة نهاية مجانية متاحة بمواصفات سياق يبلغ مليون رمز مميز.

يرسل صف Ultra المضمّن
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
افتراضيًا، بحيث تبقى مخرجات المحادثة العادية في الإجابة المرئية بدلًا من
إظهار نص الاستدلال.

استخدم Ultra بوصفه خيار NVIDIA الافتراضي الأعلى قدرة. أبقِ Super محددًا عندما
تريد خيار Nemotron 3 الأصغر، أو اختر أحد نماذج الجهات الخارجية
المستضافة في كتالوج NVIDIA عندما يكون سياقها أو زمن استجابتها أو سلوكها أنسب.

## كتالوج الرجوع المضمّن

تمثل الصفوف المضمّنة القابلة للاختيار لقطة من كتالوج النماذج المميّزة لدى NVIDIA. تظل
صفوف التوافق المهملة قابلة للحل باستخدام المرجع الدقيق، لكنها لا تظهر في أدوات
اختيار النماذج.

| مرجع النموذج                              | الاسم                  | السياق    | الحد الأقصى للمخرجات |
| ------------------------------------------ | --------------------- | --------- | ---------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192      |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192      |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192      |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192      |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192      |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384     |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384     |

يحتفظ كتالوج التوافق الكامل أيضًا بهذه المراجع المنشورة للإعدادات
الحالية: `nvidia/moonshotai/kimi-k2.5` و`nvidia/z-ai/glm-5.1`
و`nvidia/minimaxai/minimax-m2.5` و`nvidia/z-ai/glm5` و
`nvidia/minimaxai/minimax-m2.7`. تظل متاحة باستخدام المرجع الدقيق، لكنها
لا تظهر مطلقًا في الإعداد الأولي أو أدوات اختيار النماذج.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="سلوك التفعيل التلقائي">
    يُفعّل الموفّر تلقائيًا عند تعيين متغير البيئة `NVIDIA_API_KEY`
    أو عند تخزين مفتاح أثناء الإعداد الأولي. لا يلزم إعداد صريح للموفّر
    بخلاف المفتاح.
  </Accordion>

  <Accordion title="الكتالوج والتسعير">
    يفضّل OpenClaw كتالوج النماذج المميّزة العام لدى NVIDIA عند إعداد مصادقة NVIDIA،
    ويخزّنه مؤقتًا لمدة 24 ساعة. خيار الرجوع المضمّن القابل للاختيار هو
    لقطة ثابتة من كتالوج النماذج المميّزة لدى NVIDIA؛ وتُخفى صفوف التوافق المهملة
    ذات المراجعها الدقيقة من أدوات اختيار النماذج. تكون التكاليف افتراضيًا `0` في
    المصدر، لأن NVIDIA توفّر حاليًا وصولًا مجانيًا عبر API للنماذج المدرجة.
  </Accordion>

  <Accordion title="نقطة نهاية متوافقة مع OpenAI">
    يتواصل OpenClaw مع NVIDIA باستخدام محوّل `openai-completions` عبر
    مسار إكمال المحادثات القياسي `/v1`. يُفترض أن تعمل أي أداة متوافقة مع OpenAI
    مباشرةً باستخدام عنوان URL الأساسي لـ NVIDIA.
  </Accordion>

  <Accordion title="معلمات استدلال Nemotron 3 Ultra">
    يستخدم نموذج الطلب الخاص بـ Ultra من NVIDIA الحقلين `chat_template_kwargs.enable_thinking`
    و`reasoning_budget` لمخرجات الاستدلال. يعطّل صف Ultra المضمّن في OpenClaw
    التفكير في القالب افتراضيًا لاستخدام المحادثة العادي. إذا كنت بحاجة إلى
    تفعيل مخرجات الاستدلال من NVIDIA أو فرض حقول طلب أخرى خاصة بـ NVIDIA،
    فعيّن معلمات لكل نموذج، واحصر التجاوزات الخاصة بالموفّر في
    نموذج NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    يدمج `params.chat_template_kwargs` محتواه في أي `chat_template_kwargs`
    موجودة مسبقًا في الطلب بدلًا من استبدال الكائن بالكامل.
    يمثّل `params.extra_body` التجاوز النهائي لجسم الطلب المتوافق مع OpenAI،
    ويستبدل مفاتيح الحمولة المتعارضة، لذا استخدمه فقط للحقول التي توثّقها NVIDIA
    لنقطة النهاية المحددة.

  </Accordion>

  <Accordion title="بطء استجابات الموفّر المخصص">
    قد تستغرق بعض النماذج المخصصة المستضافة لدى NVIDIA وقتًا أطول من مهلة
    مراقبة خمول النموذج الافتراضية البالغة نحو 120 ثانية قبل إصدار أول جزء من الاستجابة.
    بالنسبة إلى إدخالات موفّر NVIDIA المخصص، ارفع مهلة الموفّر بدلًا من مهلة
    وقت تشغيل الوكيل بالكامل؛ يغطي `timeoutSeconds` طلبات HTTP الخاصة بالموفّر
    ويرفع الحد الأقصى لمراقبة الخمول/البث لذلك الموفّر:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
نماذج NVIDIA مجانية الاستخدام حاليًا. راجع
[build.nvidia.com](https://build.nvidia.com/) للاطلاع على أحدث تفاصيل التوفر
وحدود المعدّل.
</Tip>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مرجع الإعداد الكامل للوكلاء والنماذج والموفّرين.
  </Card>
</CardGroup>
