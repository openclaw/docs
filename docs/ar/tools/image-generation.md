---
read_when:
    - إنشاء الصور أو تحريرها عبر الوكيل
    - تكوين موفّري ونماذج توليد الصور
    - فهم معلمات أداة image_generate
sidebarTitle: Image generation
summary: إنشاء الصور وتحريرها عبر image_generate باستخدام OpenAI وGoogle وfal وMicrosoft Foundry وMiniMax وComfyUI وDeepInfra وOpenRouter وLiteLLM وxAI وVydra
title: توليد الصور
x-i18n:
    generated_at: "2026-06-27T18:43:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

تتيح أداة `image_generate` للوكيل إنشاء الصور وتحريرها باستخدام
الموفّرين الذين ضبطتهم. في جلسات الدردشة، يعمل إنشاء الصور بشكل غير متزامن:
يسجل OpenClaw مهمة في الخلفية، ويعيد معرّف المهمة فورًا، ويوقظ
الوكيل عندما ينتهي الموفّر. يتبع وكيل الإكمال وضع الرد المرئي العادي
للجلسة: تسليم الرد النهائي تلقائيًا عند ضبطه، أو `message(action="send")`
عندما تتطلب الجلسة أداة الرسائل. إذا كانت جلسة الطالب غير نشطة أو فشل
إيقاظها النشط، وكانت بعض الصور المنشأة لا تزال مفقودة من رد الإكمال، يرسل
OpenClaw رجوعًا مباشرًا متطابقًا لا يتكرر يحتوي على الصور المفقودة فقط.

<Note>
لا تظهر الأداة إلا عند توفر موفّر واحد على الأقل لإنشاء الصور.
إذا لم ترَ `image_generate` ضمن أدوات وكيلك، فاضبط
`agents.defaults.imageGenerationModel`، أو أعدّ مفتاح API لموفّر،
أو سجّل الدخول باستخدام OpenAI ChatGPT/Codex OAuth.
</Note>

## البدء السريع

<Steps>
  <Step title="ضبط المصادقة">
    عيّن مفتاح API لموفّر واحد على الأقل (مثل `OPENAI_API_KEY`،
    `GEMINI_API_KEY`، `OPENROUTER_API_KEY`) أو سجّل الدخول باستخدام OpenAI Codex OAuth.
  </Step>
  <Step title="اختيار نموذج افتراضي (اختياري)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    يستخدم ChatGPT/Codex OAuth مرجع النموذج نفسه `openai/gpt-image-2`. عند
    ضبط ملف تعريف OAuth باسم `openai`، يوجّه OpenClaw طلبات الصور
    عبر ملف تعريف OAuth ذلك بدلًا من تجربة
    `OPENAI_API_KEY` أولًا. يؤدي ضبط `models.providers.openai` الصريح (مفتاح API،
    عنوان URL أساسي مخصص/Azure) إلى العودة إلى مسار OpenAI Images API
    المباشر.

  </Step>
  <Step title="اسأل الوكيل">
    _"أنشئ صورة لتميمة روبوت ودودة."_

    يستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى إدراج الأداة في قائمة السماح
    - فهي مفعلة افتراضيًا عند توفر موفّر. تعيد الأداة
    معرّف مهمة في الخلفية، ثم يرسل وكيل الإكمال المرفق المنشأ
    عبر أداة `message` عندما يصبح جاهزًا.

  </Step>
</Steps>

<Warning>
بالنسبة إلى نقاط نهاية LAN المتوافقة مع OpenAI مثل LocalAI، احتفظ بعنوان
`models.providers.openai.baseUrl` المخصص واشترك صراحة باستخدام
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. تظل نقاط نهاية الصور
الخاصة والداخلية محظورة افتراضيًا.
</Warning>

## المسارات الشائعة

| الهدف                                                 | مرجع النموذج                                          | المصادقة                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| إنشاء صور OpenAI مع فوترة API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| إنشاء صور OpenAI باستخدام مصادقة اشتراك Codex | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| PNG/WebP بخلفية شفافة من OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` أو OpenAI Codex OAuth |
| إنشاء صور DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| إنشاء fal Krea 2 تعبيري/موجّه بالأسلوب      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| إنشاء صور OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| إنشاء صور LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| إنشاء صور Microsoft Foundry MAI               | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` أو Entra ID     |
| إنشاء صور Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`   |

تتعامل أداة `image_generate` نفسها مع التحويل من نص إلى صورة وتحرير الصور
المرجعية. استخدم `image` لمرجع واحد أو `images` لعدة مراجع.
بالنسبة إلى نماذج Krea 2 على fal، تُرسل تلك المراجع كمراجع أسلوب
بدلًا من مدخلات تحرير.
تُمرر تلميحات الإخراج المدعومة من الموفّر مثل `quality` و`outputFormat` و
`background` عند توفرها، ويُبلّغ عنها كمتجاهلة عندما لا يدعمها
الموفّر. دعم الخلفية الشفافة المضمّن
خاص بـ OpenAI؛ وقد يحافظ موفّرون آخرون على شفافية PNG إذا كان
نظامهم الخلفي يصدرها.

## الموفّرون المدعومون

| الموفّر          | النموذج الافتراضي                           | دعم التحرير                       | المصادقة                                                  |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | نعم (صورة واحدة، مضبوطة في سير العمل) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة    |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | نعم (صورة واحدة)                      | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | نعم (حدود خاصة بالنموذج)        | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | نعم                                | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | نعم (حتى 5 صور إدخال)         | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | نعم (نماذج MAI-Image-2.5 فقط)    | `AZURE_OPENAI_API_KEY` أو Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | نعم (مرجع موضوع)            | `MINIMAX_API_KEY` أو MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | نعم (حتى 4 صور)               | `OPENAI_API_KEY` أو OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | نعم (حتى 5 صور إدخال)         | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | لا                                 | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | نعم (حتى 5 صور)               | `XAI_API_KEY`                                         |

استخدم `action: "list"` لفحص الموفّرين والنماذج المتاحة وقت التشغيل:

```text
/tool image_generate action=list
```

استخدم `action: "status"` لفحص مهمة إنشاء الصور النشطة للجلسة
الحالية:

```text
/tool image_generate action=status
```

## قدرات الموفّرين

| القدرة            | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| الإنشاء (العدد الأقصى)  | محدد في سير العمل   | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| التحرير / المرجع      | صورة واحدة (سير العمل) | صورة واحدة   | Flux: 1؛ GPT: 10؛ مراجع أسلوب Krea: 10؛ NB2: 14 | حتى 5 صور | صورة واحدة           | صورة واحدة (مرجع موضوع) | حتى 5 صور | -     | حتى 5 صور |
| التحكم في الحجم          | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | حتى 4K       | -     | -              |
| نسبة العرض إلى الارتفاع          | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| الدقة (1K/2K/4K) | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## معلمات الأداة

<ParamField path="prompt" type="string" required>
  موجه إنشاء الصور. مطلوب لـ `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  استخدم `"status"` لفحص مهمة الجلسة النشطة أو `"list"` لفحص
  الموفّرين والنماذج المتاحة وقت التشغيل.
</ParamField>
<ParamField path="model" type="string">
  تجاوز الموفّر/النموذج (مثل `openai/gpt-image-2`). استخدم
  `openai/gpt-image-1.5` لخلفيات OpenAI الشفافة.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحد أو URL واحد لوضع التحرير.
</ParamField>
<ParamField path="images" type="string[]">
  عدة صور مرجعية لوضع التحرير أو نماذج مراجع الأسلوب (حتى 10
  عبر الأداة المشتركة؛ تظل الحدود الخاصة بالموفّر سارية).
</ParamField>
<ParamField path="size" type="string">
  تلميح الحجم: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  نسبة العرض إلى الارتفاع: `1:1`، `2:3`، `3:2`، `2.35:1`، `3:4`، `4:3`، `4:5`،
  `5:4`، `9:16`، `16:9`، `21:9`، `4:1`، `1:4`، `8:1`، `1:8`. يتحقق الموفّرون
  من المجموعة الفرعية الخاصة بنموذجهم.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>تلميح الدقة.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  تلميح الجودة عندما يدعمه الموفّر.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  تلميح تنسيق الإخراج عندما يدعمه الموفّر.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  تلميح الخلفية عندما يدعمه الموفّر. استخدم `transparent` مع
  `outputFormat: "png"` أو `"webp"` للموفّرين القادرين على الشفافية.
</ParamField>
<ParamField path="count" type="number">عدد الصور المراد إنشاؤها (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  مهلة اختيارية لطلب الموفّر بالمللي ثانية. عندما يستدعي Codex
  `image_generate` عبر الأدوات الديناميكية، تظل هذه القيمة الخاصة بكل استدعاء تتجاوز
  الافتراضي المضبوط وتُحد عند 600000 مللي ثانية.
</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="openai" type="object">
  تلميحات خاصة بـ OpenAI فقط: `background` و`moderation` و`outputCompression` و`user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  التحكم في إبداع fal Krea 2. الافتراضي هو `medium`.
</ParamField>

<Note>
لا يدعم جميع الموفّرين كل المعلمات. عندما يدعم موفّر رجوع
خيار هندسة قريبًا بدلًا من الخيار المطلوب بالضبط، يعيد OpenClaw الربط إلى
أقرب حجم أو نسبة عرض إلى ارتفاع أو دقة مدعومة قبل الإرسال.
تُسقط تلميحات الإخراج غير المدعومة للموفّرين الذين لا يصرحون
بالدعم، ويُبلّغ عنها في نتيجة الأداة. تبلّغ نتائج الأداة عن الإعدادات
المطبقة؛ ويلتقط `details.normalization` أي ترجمة من المطلوب إلى المطبق.
</Note>

## الضبط

### اختيار النموذج

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### ترتيب اختيار الموفّر

يجرب OpenClaw الموفّرين بهذا الترتيب:

1. **معامل `model`** من استدعاء الأداة (إذا حدده الوكيل).
2. **`imageGenerationModel.primary`** من الإعدادات.
3. **`imageGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** - افتراضيات المزوّد المدعومة بالمصادقة فقط:
   - المزوّد الافتراضي الحالي أولاً؛
   - بقية مزوّدي توليد الصور المسجلين بترتيب معرف المزوّد.

إذا فشل مزوّد (خطأ مصادقة، حد معدل، وما إلى ذلك)، تتم تجربة المرشح
المكوّن التالي تلقائياً. إذا فشلت كلها، يتضمن الخطأ تفاصيل
كل محاولة.

<AccordionGroup>
  <Accordion title="تجاوزات النموذج لكل استدعاء دقيقة">
    يحاول تجاوز `model` لكل استدعاء ذلك المزوّد/النموذج فقط ولا
    يتابع إلى `primary`/`fallback` المكوّنة أو المزوّدين المكتشفين تلقائياً.
  </Accordion>
  <Accordion title="الاكتشاف التلقائي يراعي المصادقة">
    لا يدخل افتراضي المزوّد في قائمة المرشحين إلا عندما يستطيع OpenClaw
    مصادقة ذلك المزوّد فعلياً. اضبط
    `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
    إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.
  </Accordion>
  <Accordion title="المهل الزمنية">
    اضبط `agents.defaults.imageGenerationModel.timeoutMs` للواجهات الخلفية
    البطيئة للصور. يتجاوز معامل الأداة `timeoutMs` لكل استدعاء القيمة
    الافتراضية المكوّنة، وتتجاوز الافتراضيات المكوّنة افتراضيات المزوّد
    التي يحددها Plugin. تستخدم مزوّدات الصور المستضافة من Google وOpenRouter
    افتراضيات قدرها 180 ثانية؛ ويستخدم توليد الصور في Microsoft Foundry MAI
    وxAI وAzure OpenAI مدة 600 ثانية. تستخدم استدعاءات أدوات Codex الديناميكية
    افتراضياً جسراً `image_generate` مدته 120 ثانية وتحترم ميزانية المهلة نفسها
    عند تكوينها، ضمن الحد الأقصى لجسر الأدوات الديناميكية في OpenClaw وهو
    600000 مللي ثانية.
  </Accordion>
  <Accordion title="الفحص وقت التشغيل">
    استخدم `action: "list"` لفحص المزوّدين المسجلين حالياً،
    ونماذجهم الافتراضية، وتلميحات متغيرات بيئة المصادقة.
  </Accordion>
</AccordionGroup>

### تحرير الصور

يدعم OpenAI وOpenRouter وGoogle وDeepInfra وfal وMicrosoft Foundry وMiniMax
وComfyUI وxAI تحرير الصور المرجعية. تستخدم نماذج Krea 2 على fal حقول
`image` / `images` نفسها كمراجع أسلوب بدلاً من مدخلات التحرير. مرّر
مسار صورة مرجعية أو URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

يدعم OpenAI وOpenRouter وGoogle وxAI ما يصل إلى 5 صور مرجعية عبر معامل
`images`. يدعم fal صورة مرجعية واحدة لتحويل Flux من صورة إلى صورة، وما يصل
إلى 10 لتحريرات GPT Image 2، وما يصل إلى 10 مراجع أسلوب لـ Krea 2، وما يصل
إلى 14 لتحريرات Nano Banana 2. يدعم Microsoft Foundry وMiniMax وComfyUI صورة
واحدة.

## تعمقات المزوّدين

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (و gpt-image-1.5)">
    يتم توليد الصور في OpenAI افتراضياً عبر `openai/gpt-image-2`. إذا كان
    ملف تعريف OAuth لـ `openai` مكوّناً، يعيد OpenClaw استخدام ملف تعريف
    OAuth نفسه المستخدم من نماذج دردشة اشتراك Codex ويرسل طلب الصورة عبر
    الواجهة الخلفية Codex Responses. تتم صياغة URLs الأساسية القديمة لـ Codex
    مثل `https://chatgpt.com/backend-api` إلى الصيغة القياسية
    `https://chatgpt.com/backend-api/codex` لطلبات الصور. لا يرجع OpenClaw
    **ضمنياً** إلى `OPENAI_API_KEY` لذلك الطلب - لفرض التوجيه المباشر إلى
    OpenAI Images API، كوّن `models.providers.openai` صراحة باستخدام مفتاح API
    أو URL أساسي مخصص أو نقطة نهاية Azure.

    لا يزال يمكن اختيار نماذج `openai/gpt-image-1.5` و`openai/gpt-image-1`
    و`openai/gpt-image-1-mini` صراحة. استخدم `gpt-image-1.5` لإخراج PNG/WebP
    بخلفية شفافة؛ ترفض API الحالية لـ `gpt-image-2` القيمة
    `background: "transparent"`.

    يدعم `gpt-image-2` توليد الصور من النص وتحرير الصور المرجعية من خلال
    أداة `image_generate` نفسها. يمرر OpenClaw `prompt` و`count` و`size`
    و`quality` و`outputFormat` والصور المرجعية إلى OpenAI. لا يتلقى OpenAI
    `aspectRatio` أو `resolution` مباشرة؛ وعندما يكون ذلك ممكناً، يخرطهما
    OpenClaw إلى `size` مدعوم، وإلا تبلغ الأداة عنهما كتجاوزات متجاهلة.

    تعيش الخيارات الخاصة بـ OpenAI تحت كائن `openai`:

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    يقبل `openai.background` القيم `transparent` أو `opaque` أو `auto`؛
    تتطلب المخرجات الشفافة `outputFormat` بقيمة `png` أو `webp` ونموذج صور
    OpenAI قادراً على الشفافية. يوجه OpenClaw طلبات الخلفية الشفافة الافتراضية
    لـ `gpt-image-2` إلى `gpt-image-1.5`. ينطبق `openai.outputCompression` على
    مخرجات JPEG/WebP ويتم تجاهله لمخرجات PNG.

    تلميح `background` في المستوى الأعلى محايد تجاه المزوّد ويُخرط حالياً إلى
    حقل طلب `background` نفسه في OpenAI عند اختيار مزوّد OpenAI. تعيد المزوّدات
    التي لا تصرح بدعم الخلفية هذا التلميح في `ignoredOverrides` بدلاً من تلقي
    المعامل غير المدعوم.

    لتوجيه توليد صور OpenAI عبر نشر Azure OpenAI بدلاً من `api.openai.com`، راجع
    [نقاط نهاية Azure OpenAI](/ar/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="نماذج صور Microsoft Foundry MAI">
    يستخدم توليد الصور في Microsoft Foundry أسماء نشر صور MAI المنشورة تحت
    بادئة المزوّد `microsoft-foundry/`. لا يوجد نموذج افتراضي على مستوى المزوّد
    لأن MAI API تتوقع اسم النشر الخاص بك في حقل `model`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    يستخدم المزوّد MAI API من Microsoft Foundry، وليس OpenAI Images API:

    - نقطة نهاية التوليد: `/mai/v1/images/generations`
    - نقطة نهاية التحرير: `/mai/v1/images/edits`
    - المصادقة: `AZURE_OPENAI_API_KEY` / مفتاح API للمزوّد، أو Entra ID عبر `az login`
    - المخرج: صورة PNG واحدة
    - الحجم: الافتراضي `1024x1024`؛ يجب أن يكون العرض والارتفاع كلاً منهما 768 px على الأقل،
      ويجب ألا يتجاوز إجمالي البكسلات 1,048,576
    - التحريرات: صورة مرجعية PNG أو JPEG واحدة، مدعومة فقط بواسطة نشرات
      `MAI-Image-2.5-Flash` و`MAI-Image-2.5`

    يمكن أن يستخدم التوليد المعتمد على الموجّه فقط اسم نشر مخصصاً مع تكوين
    نقطة نهاية Foundry فقط. تحتاج التحريرات ذات أسماء النشر المخصصة إلى
    بيانات تعريف تهيئة/نموذج حتى يستطيع OpenClaw التحقق من أن النشر مدعوم
    بواسطة `MAI-Image-2.5-Flash` أو `MAI-Image-2.5`.

    نماذج صور MAI الحالية هي `MAI-Image-2.5-Flash` و`MAI-Image-2.5`
    و`MAI-Image-2e` و`MAI-Image-2`. راجع
    [Microsoft Foundry Plugin](/ar/plugins/reference/microsoft-foundry) للإعداد
    وسلوك نماذج الدردشة.

  </Accordion>
  <Accordion title="نماذج صور OpenRouter">
    يستخدم توليد الصور في OpenRouter مفتاح `OPENROUTER_API_KEY` نفسه
    ويوجه عبر API صور إكمالات الدردشة في OpenRouter. اختر نماذج صور
    OpenRouter باستخدام بادئة `openrouter/`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    يمرر OpenClaw `prompt` و`count` والصور المرجعية وتلميحات
    `aspectRatio` / `resolution` المتوافقة مع Gemini إلى OpenRouter.
    تشمل اختصارات نماذج صور OpenRouter المضمنة الحالية
    `google/gemini-3.1-flash-image-preview`،
    و`google/gemini-3-pro-image-preview`، و`openai/gpt-5.4-image-2`. استخدم
    `action: "list"` لمعرفة ما يكشفه Plugin المكوّن لديك.

  </Accordion>
  <Accordion title="fal Krea 2">
    تستخدم نماذج Krea 2 على fal مخطط Krea الأصلي في fal بدلاً من مخطط
    `image_size` العام المستخدم بواسطة Flux. يرسل OpenClaw:

    - `aspect_ratio` لتلميحات نسبة العرض إلى الارتفاع
    - `creativity`، بقيمة افتراضية `medium`
    - `image_style_references` عند توفير `image` أو `images`

    اختر Krea 2 Medium للرسوم التوضيحية التعبيرية الأسرع وKrea 2 Large
    للمظاهر الفوتوغرافية الواقعية والملمسية الأبطأ والأكثر تفصيلاً:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    يعيد Krea 2 حالياً صورة واحدة لكل طلب. فضّل `aspectRatio` مع Krea؛
    يخرط OpenClaw `size` إلى أقرب نسبة عرض إلى ارتفاع مدعومة في Krea ويرفض
    `resolution` مع Krea بدلاً من إسقاطه. استخدم `fal.creativity` عندما تريد
    مستوى إبداع Krea أصلياً:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="مصادقة MiniMax المزدوجة">
    يتوفر توليد الصور في MiniMax عبر مساري مصادقة MiniMax المضمنين:

    - `minimax/image-01` لإعدادات مفتاح API
    - `minimax-portal/image-01` لإعدادات OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    يستخدم مزوّد xAI المضمن `/v1/images/generations` للطلبات المعتمدة على
    الموجّه فقط و`/v1/images/edits` عند وجود `image` أو `images`.

    - النماذج: `xai/grok-imagine-image`، `xai/grok-imagine-image-quality`
    - العدد: حتى 4
    - المراجع: `image` واحدة أو ما يصل إلى خمس `images`
    - نسب العرض إلى الارتفاع: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
    - الدقات: `1K`، `2K`
    - المخرجات: تُعاد كمرفقات صور يديرها OpenClaw

    لا يكشف OpenClaw عمداً `quality` أو `mask` أو `user` الأصلية في xAI
    أو نسب العرض إلى الارتفاع الإضافية الأصلية فقط إلى أن توجد هذه عناصر التحكم
    في عقد `image_generate` المشترك عبر المزوّدين.

  </Accordion>
</AccordionGroup>

## أمثلة

<Tabs>
  <Tab title="توليد (منظر طبيعي 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="توليد (PNG شفافة)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

CLI المكافئ:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="توليد (جودة منخفضة من OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

CLI المكافئ:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea style references">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

تتوفر أعلام `--output-format` و`--background` و`--quality` و
`--openai-moderation` نفسها في `openclaw infer image edit`؛
ويبقى `--openai-background` اسمًا مستعارًا خاصًا بـ OpenAI. لا يعلن المزوّدون
المضمّنون غير OpenAI عن تحكم صريح في الخلفية حاليًا، لذلك يتم الإبلاغ عن
`background: "transparent"` بأنه متجاهل لديهم.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [ComfyUI](/ar/providers/comfy) - إعداد سير عمل ComfyUI المحلي وComfy Cloud
- [fal](/ar/providers/fal) - إعداد مزوّد الصور والفيديو fal
- [Google (Gemini)](/ar/providers/google) - إعداد مزوّد الصور Gemini
- [Plugin Microsoft Foundry](/ar/plugins/reference/microsoft-foundry) - إعداد دردشة Microsoft Foundry وصور MAI
- [MiniMax](/ar/providers/minimax) - إعداد مزوّد الصور MiniMax
- [OpenAI](/ar/providers/openai) - إعداد مزوّد OpenAI Images
- [Vydra](/ar/providers/vydra) - إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) - إعداد الصور والفيديو والبحث وتنفيذ التعليمات البرمجية وTTS في Grok
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) - إعداد `imageGenerationModel`
- [النماذج](/ar/concepts/models) - تهيئة النماذج وتجاوز الفشل
