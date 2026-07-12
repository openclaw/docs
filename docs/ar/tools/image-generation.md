---
read_when:
    - إنشاء الصور أو تحريرها عبر الوكيل
    - تكوين موفّري ونماذج توليد الصور
    - فهم معاملات أداة image_generate
sidebarTitle: Image generation
summary: أنشئ الصور وحرّرها عبر image_generate باستخدام OpenAI وGoogle وfal وMicrosoft Foundry وMiniMax وComfyUI وDeepInfra وOpenRouter وLiteLLM وxAI وVydra
title: توليد الصور
x-i18n:
    generated_at: "2026-07-12T06:35:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

تنشئ أداة `image_generate` الصور وتحررها عبر المزوّدين الذين أعددتهم.
وتعمل بصورة غير متزامنة في جلسات الدردشة: يسجل OpenClaw مهمة في
الخلفية، ويعيد معرّف المهمة فورًا، وينبّه الوكيل عند انتهاء
المزوّد. يتبع وكيل الإكمال وضع الرد المرئي المعتاد للجلسة: تسليم
الرد النهائي تلقائيًا عند إعداده، أو استخدام `message(action="send")` عندما
تتطلب الجلسة أداة الرسائل. إذا كانت جلسة مقدم الطلب غير نشطة أو فشل تنبيهها
النشط، يرسل OpenClaw رسالة احتياطية مباشرة قابلة للتنفيذ المتكرر بأمان تتضمن
الصور المُنشأة، كي لا تضيع النتيجة.

<Note>
لا تظهر الأداة إلا عند توفر مزوّد واحد على الأقل لتوليد الصور.
إذا لم تظهر `image_generate` ضمن أدوات وكيلك،
فاضبط `agents.defaults.imageGenerationModel`، أو أعدّ مفتاح API لأحد المزوّدين،
أو سجّل الدخول باستخدام OpenAI ChatGPT/Codex OAuth.
</Note>

## البدء السريع

<Steps>
  <Step title="إعداد المصادقة">
    عيّن مفتاح API لمزوّد واحد على الأقل (مثل `OPENAI_API_KEY`،
    أو `GEMINI_API_KEY`، أو `OPENROUTER_API_KEY`) أو سجّل الدخول باستخدام OpenAI Codex OAuth.
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

    يستخدم ChatGPT/Codex OAuth مرجع النموذج نفسه `openai/gpt-image-2`. عند إعداد
    ملف تعريف OAuth من نوع `openai`، يوجّه OpenClaw طلبات الصور
    عبر ملف تعريف OAuth هذا بدلًا من تجربة `OPENAI_API_KEY` أولًا.
    ويؤدي إعداد `models.providers.openai` صراحةً (مفتاح API، أو عنوان URL أساسي
    مخصص/Azure) إلى إعادة استخدام مسار OpenAI Images API المباشر.

  </Step>
  <Step title="اطلب من الوكيل">
    _"أنشئ صورة لتميمة روبوت ودودة."_

    يستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى إدراج الأداة في قائمة
    السماح، فهي مفعّلة افتراضيًا عند توفر مزوّد. تعيد الأداة
    معرّف مهمة في الخلفية، ثم يرسل وكيل الإكمال المرفق
    المُنشأ عبر أداة `message` عندما يصبح جاهزًا.

  </Step>
</Steps>

<Warning>
بالنسبة إلى نقاط نهاية LAN المتوافقة مع OpenAI مثل LocalAI، احتفظ بعنوان
`models.providers.openai.baseUrl` المخصص وفعّل صراحةً
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. تظل نقاط نهاية
الصور الخاصة والداخلية محظورة افتراضيًا.
</Warning>

## المسارات الشائعة

| الهدف                                                 | مرجع النموذج                                       | المصادقة                               |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| توليد صور OpenAI مع الفوترة عبر API                   | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| توليد صور OpenAI بمصادقة اشتراك Codex                | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| صور OpenAI بصيغة PNG/WebP وخلفية شفافة               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` أو OpenAI Codex OAuth |
| توليد الصور عبر DeepInfra                            | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| توليد تعبيري/موجّه بالأسلوب عبر fal Krea 2           | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| توليد الصور عبر OpenRouter                           | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| توليد الصور عبر LiteLLM                              | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| توليد الصور عبر Microsoft Foundry MAI                | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` أو Entra ID     |
| توليد الصور عبر Google Gemini                        | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`   |

تتعامل الأداة نفسها مع تحويل النص إلى صورة وتحرير الصور المرجعية. استخدم `image`
لمرجع واحد أو `images` لعدة مراجع. بالنسبة إلى نماذج Krea 2 على fal، تُرسل هذه
المراجع كمراجع أسلوب بدلًا من مدخلات التحرير.
تُمرر تلميحات الإخراج التي يدعمها المزوّد، مثل `quality` و`outputFormat`
و`background`، عند توفرها، ويُبلّغ عن تجاهلها عندما لا يعلن
المزوّد دعمه لها. يختص دعم الخلفية الشفافة المضمّن
بـ OpenAI؛ وقد يحافظ مزوّدون آخرون مع ذلك على قناة ألفا في PNG إذا كانت
خلفيتهم البرمجية تُخرجها.

## المزوّدون المدعومون

| المزوّد           | النموذج الافتراضي                       | دعم التحرير                         | المصادقة                                              |
| ----------------- | --------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | نعم (صورة واحدة، وفق إعداد سير العمل) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة      |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | نعم (صورة واحدة)                    | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | نعم (حدود خاصة بالنموذج)            | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | نعم (حتى 5 صور)                     | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | نعم (حتى 5 صور إدخال)               | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | نعم (نماذج MAI-Image-2.5 فقط)       | `AZURE_OPENAI_API_KEY` أو Entra ID ‏(`az login`)      |
| MiniMax           | `image-01`                              | نعم (مرجع للعنصر)                   | `MINIMAX_API_KEY` أو MiniMax OAuth ‏(`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | نعم (حتى 5 صور)                     | `OPENAI_API_KEY` أو OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | نعم (حتى 5 صور إدخال)               | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | لا                                  | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | نعم (حتى 3 صور)                     | `XAI_API_KEY`                                         |

استخدم `action: "list"` لفحص المزوّدين والنماذج المتاحة في وقت التشغيل:

```text
/tool image_generate action=list
```

استخدم `action: "status"` لفحص مهمة توليد الصور النشطة للجلسة
الحالية:

```text
/tool image_generate action=status
```

## إمكانات المزوّدين

| الإمكانية              | ComfyUI                | DeepInfra  | fal                                              | Google      | Microsoft Foundry | MiniMax                  | OpenAI      | Vydra | xAI         |
| --------------------- | ---------------------- | ---------- | ------------------------------------------------ | ----------- | ----------------- | ------------------------ | ----------- | ----- | ----------- |
| التوليد (الحد الأقصى) | 1                      | 4          | 4                                                | 4           | 1                 | 9                        | 4           | 1     | 4           |
| التحرير / المرجع      | صورة واحدة (سير العمل) | صورة واحدة | Flux: ‏1؛ GPT: ‏10؛ مراجع أسلوب Krea: ‏10؛ NB2: ‏14 | حتى 5 صور   | صورة واحدة        | صورة واحدة (مرجع للعنصر) | حتى 5 صور   | -     | حتى 3 صور   |
| التحكم في الحجم       | -                      | ✓          | ✓                                                | ✓           | ✓                 | -                        | حتى 4K      | -     | -           |
| نسبة العرض إلى الارتفاع | -                    | -          | ✓                                                | ✓           | -                 | ✓                        | -           | -     | ✓           |
| الدقة (1K/2K/4K)      | -                      | -          | ✓                                                | ✓           | -                 | -                        | -           | -     | 1K، 2K      |

## معلمات الأداة

<ParamField path="prompt" type="string" required>
  مطالبة توليد الصورة. مطلوبة مع `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  استخدم `"status"` لفحص مهمة الجلسة النشطة أو `"list"` لفحص
  المزوّدين والنماذج المتاحة في وقت التشغيل.
</ParamField>
<ParamField path="model" type="string">
  تجاوز المزوّد/النموذج (مثل `openai/gpt-image-2`). استخدم
  `openai/gpt-image-1.5` للحصول على خلفيات OpenAI شفافة.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحدة أو عنوان URL لوضع التحرير.
</ParamField>
<ParamField path="images" type="string[]">
  عدة صور مرجعية لوضع التحرير أو نماذج مراجع الأسلوب (حتى 14
  عبر الأداة المشتركة؛ وتظل الحدود الخاصة بكل مزوّد سارية).
</ParamField>
<ParamField path="size" type="string">
  تلميح الحجم: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  نسبة العرض إلى الارتفاع: `1:1`، `2:1`، `20:9`، `19.5:9`، `2:3`، `3:2`، `2.35:1`، `3:4`،
  `4:3`، `4:5`، `5:4`، `9:16`، `9:19.5`، `9:20`، `16:9`، `21:9`، `1:2`، `4:1`،
  `1:4`، `8:1`، `1:8`. يتحقق المزوّدون من المجموعة الفرعية الخاصة بكل نموذج.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>تلميح الدقة.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  تلميح الجودة عندما يدعمه المزوّد.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  تلميح تنسيق الإخراج عندما يدعمه المزوّد.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  تلميح الخلفية عندما يدعمه المزوّد. استخدم `transparent` مع
  `outputFormat: "png"` أو `"webp"` للمزوّدين القادرين على دعم الشفافية.
</ParamField>
<ParamField path="count" type="number">عدد الصور المطلوب توليدها (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  مهلة اختيارية لطلب المزوّد بالمللي ثانية. عندما يستدعي Codex
  أداة `image_generate` عبر الأدوات الديناميكية، تظل هذه القيمة الخاصة بكل استدعاء متجاوزةً
  للقيمة الافتراضية المضبوطة، ويكون حدها الأقصى 600000 مللي ثانية.
</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="openai" type="object">
  تلميحات خاصة بـ OpenAI: ‏`background` و`moderation` و`outputCompression` و`user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  التحكم في إبداع fal Krea 2. القيمة الافتراضية هي `medium`.
</ParamField>

<Note>
لا يدعم جميع المزوّدين جميع المعلمات. عندما يدعم مزوّد احتياطي
خيارًا هندسيًا قريبًا بدلًا من الخيار المطلوب بالضبط، يعيد OpenClaw تعيينه إلى
أقرب حجم أو نسبة عرض إلى ارتفاع أو دقة مدعومة قبل الإرسال.
تُحذف تلميحات الإخراج غير المدعومة لدى المزوّدين الذين لا يعلنون
دعمها، ويُبلّغ عنها في نتيجة الأداة. تعرض نتائج الأداة الإعدادات
المطبقة؛ ويسجل `details.normalization` أي تحويل من القيمة المطلوبة إلى
القيمة المطبقة.
</Note>

## الإعداد

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

### ترتيب اختيار المزوّدين

يجرّب OpenClaw المزوّدين بالترتيب التالي:

1. معامل **`model`** من استدعاء الأداة (إذا حدّد الوكيل واحدًا).
2. **`imageGenerationModel.primary`** من الإعدادات.
3. **`imageGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** - الإعدادات الافتراضية لموفّري الخدمة المدعومين بالمصادقة فقط:
   - موفّر الخدمة الافتراضي الحالي أولًا؛
   - ثم بقية موفّري توليد الصور المسجّلين مرتّبين حسب معرّف موفّر الخدمة.

إذا فشل موفّر خدمة (بسبب خطأ في المصادقة أو حدّ المعدل أو غير ذلك)، تُجرَّب تلقائيًا
الجهة المرشحة التالية التي جرى إعدادها. وإذا فشلت جميع الجهات، يتضمن الخطأ تفاصيل
كل محاولة.

<AccordionGroup>
  <Accordion title="تجاوزات النموذج لكل استدعاء دقيقة">
    لا يجرّب تجاوز `model` لكل استدعاء سوى موفّر الخدمة/النموذج المحدّد، ولا
    ينتقل إلى النموذج الأساسي أو الاحتياطيات التي جرى إعدادها ولا إلى موفّري الخدمة المكتشفين تلقائيًا.
  </Accordion>
  <Accordion title="الاكتشاف التلقائي واعٍ بالمصادقة">
    لا يدخل الإعداد الافتراضي لموفّر الخدمة في قائمة الجهات المرشحة إلا عندما يستطيع OpenClaw
    مصادقة موفّر الخدمة هذا فعليًا. اضبط
    `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
    إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.
  </Accordion>
  <Accordion title="المهل الزمنية">
    اضبط `agents.defaults.imageGenerationModel.timeoutMs` للواجهات الخلفية البطيئة
    للصور. يتجاوز معامل الأداة `timeoutMs` لكل استدعاء القيمة الافتراضية المضبوطة،
    وتتجاوز القيم الافتراضية المضبوطة القيم الافتراضية لموفّر الخدمة التي يحددها Plugin.
    تستخدم جهات استضافة الصور لدى Google وOpenRouter قيمًا افتراضية قدرها 180 ثانية؛
    بينما يستخدم توليد الصور في Microsoft Foundry MAI وxAI وAzure OpenAI مدة
    600 ثانية. تستخدم استدعاءات الأدوات الديناميكية في Codex قيمة افتراضية قدرها 120 ثانية
    لجسر `image_generate`، وتلتزم بميزانية المهلة الزمنية نفسها عند ضبطها، ضمن
    الحد الأقصى البالغ 600000 مللي ثانية لجسر الأدوات الديناميكية في OpenClaw.
  </Accordion>
  <Accordion title="الفحص في وقت التشغيل">
    استخدم `action: "list"` لفحص موفّري الخدمة المسجّلين حاليًا،
    ونماذجهم الافتراضية، وتلميحات متغيرات البيئة الخاصة بالمصادقة.
  </Accordion>
</AccordionGroup>

### تحرير الصور

تدعم OpenAI وOpenRouter وGoogle وDeepInfra وfal وMicrosoft Foundry وMiniMax
وComfyUI وxAI تحرير الصور المرجعية. تستخدم نماذج Krea 2 على fal حقلي
`image` / `images` نفسيهما كمراجع للأسلوب بدلًا من مدخلات
التحرير. مرّر مسار صورة مرجعية أو عنوان URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

تدعم OpenAI وOpenRouter وGoogle ما يصل إلى 5 صور مرجعية عبر
معامل `images`، بينما تدعم xAI ما يصل إلى 3 صور. تدعم fal صورة مرجعية واحدة
لتحويل صورة إلى صورة باستخدام Flux، وما يصل إلى 10 صور لتعديلات GPT Image 2،
وما يصل إلى 10 مراجع أسلوب لـ Krea 2، وما يصل إلى 14 صورة لتعديلات Nano Banana 2.
وتدعم Microsoft Foundry وMiniMax وComfyUI صورة واحدة.

## تفاصيل متعمقة عن موفّري الخدمة

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (وgpt-image-1.5)">
    يستخدم توليد الصور في OpenAI افتراضيًا `openai/gpt-image-2`. إذا جرى إعداد
    ملف تعريف OAuth لـ `openai`، يعيد OpenClaw استخدام ملف تعريف
    OAuth نفسه الذي تستخدمه نماذج محادثة اشتراك Codex، ويرسل
    طلب الصورة عبر الواجهة الخلفية Codex Responses. تُوحَّد عناوين URL الأساسية
    القديمة لـ Codex مثل `https://chatgpt.com/backend-api` إلى
    `https://chatgpt.com/backend-api/codex` لطلبات الصور. لا يعود OpenClaw
    **تلقائيًا** إلى `OPENAI_API_KEY` لذلك الطلب؛ ولإجبار التوجيه المباشر
    إلى OpenAI Images API، اضبط `models.providers.openai`
    صراحةً باستخدام مفتاح API أو عنوان URL أساسي مخصص أو نقطة نهاية Azure.

    لا يزال من الممكن تحديد النماذج `openai/gpt-image-1.5` و`openai/gpt-image-1`
    و`openai/gpt-image-1-mini` صراحةً. استخدم
    `gpt-image-1.5` لإخراج PNG/WebP بخلفية شفافة؛ إذ ترفض واجهة API الحالية
    لـ `gpt-image-2` القيمة `background: "transparent"`.

    يدعم `gpt-image-2` كلًا من توليد الصور من النص
    وتحرير الصور المرجعية عبر أداة `image_generate` نفسها.
    يمرّر OpenClaw القيم `prompt` و`count` و`size` و`quality` و`outputFormat`
    والصور المرجعية إلى OpenAI. لا تتلقى OpenAI
    `aspectRatio` أو `resolution` مباشرةً؛ وعندما يكون ذلك ممكنًا، يحوّل OpenClaw
    هاتين القيمتين إلى `size` مدعوم، وإلا تُبلّغ الأداة عنهما كتجاوزين
    متجاهلين.

    توجد الخيارات الخاصة بـ OpenAI ضمن الكائن `openai`:

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
    وتتطلب المخرجات الشفافة أن تكون قيمة `outputFormat` هي `png` أو `webp`
    وأن يكون نموذج الصور في OpenAI قادرًا على دعم الشفافية. يوجّه OpenClaw طلبات
    الخلفية الشفافة لنموذج `gpt-image-2` الافتراضي إلى `gpt-image-1.5`.
    ينطبق `openai.outputCompression` على مخرجات JPEG/WebP، ويُتجاهل
    مع مخرجات PNG.

    تلميح `background` في المستوى الأعلى محايد لموفّر الخدمة، ويُطابق حاليًا
    حقل طلب `background` نفسه في OpenAI عند تحديد موفّر OpenAI.
    تعيد الجهات التي لا تصرّح بدعم الخلفية هذا التلميح
    ضمن `ignoredOverrides` بدلًا من تلقي المعامل غير المدعوم.

    لتوجيه توليد الصور في OpenAI عبر عملية نشر Azure OpenAI
    بدلًا من `api.openai.com`، راجع
    [نقاط نهاية Azure OpenAI](/ar/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="نماذج صور Microsoft Foundry MAI">
    يستخدم توليد الصور في Microsoft Foundry أسماء عمليات نشر صور MAI المنشورة
    ضمن بادئة موفّر الخدمة `microsoft-foundry/`. لا يوجد نموذج افتراضي
    على مستوى موفّر الخدمة لأن واجهة MAI API تتوقع اسم عملية النشر في
    حقل `model`:

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

    يستخدم موفّر الخدمة واجهة MAI API الخاصة بـ Microsoft Foundry، وليس OpenAI Images API:

    - نقطة نهاية التوليد: `/mai/v1/images/generations`
    - نقطة نهاية التحرير: `/mai/v1/images/edits`
    - المصادقة: `AZURE_OPENAI_API_KEY` / مفتاح API لموفّر الخدمة، أو Entra ID عبر `az login`
    - المخرجات: صورة PNG واحدة
    - الحجم: القيمة الافتراضية `1024x1024`؛ يجب ألا يقل كل من العرض والارتفاع عن 768 بكسل،
      وألا يتجاوز إجمالي عدد البكسلات 1,048,576
    - التعديلات: صورة مرجعية واحدة بصيغة PNG أو JPEG، ولا تدعمها سوى
      عمليات نشر `MAI-Image-2.5-Flash` و`MAI-Image-2.5`

    يمكن للتوليد المعتمد على المطالبة فقط استخدام اسم عملية نشر مخصص مع ضبط
    نقطة نهاية Foundry وحدها. تحتاج التعديلات ذات أسماء عمليات النشر المخصصة
    إلى بيانات تعريف الإعداد الأولي/النموذج حتى يتمكن OpenClaw من التحقق من أن عملية النشر
    مدعومة بـ `MAI-Image-2.5-Flash` أو `MAI-Image-2.5`.

    نماذج صور MAI الحالية هي `MAI-Image-2.5-Flash` و`MAI-Image-2.5`
    و`MAI-Image-2e` و`MAI-Image-2`. راجع
    [Plugin Microsoft Foundry](/ar/plugins/reference/microsoft-foundry) لمعرفة خطوات الإعداد
    وسلوك نموذج المحادثة.

  </Accordion>
  <Accordion title="نماذج صور OpenRouter">
    يستخدم توليد الصور في OpenRouter قيمة `OPENROUTER_API_KEY` نفسها،
    ويوجّه الطلبات عبر واجهة صور إكمال المحادثة في OpenRouter. حدّد
    نماذج صور OpenRouter باستخدام البادئة `openrouter/`:

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

    يمرّر OpenClaw القيم `prompt` و`count` والصور المرجعية وتلميحات
    `aspectRatio` / `resolution` المتوافقة مع Gemini إلى OpenRouter.
    تتضمن الاختصارات المضمنة الحالية لنماذج صور OpenRouter
    `google/gemini-3.1-flash-image-preview`
    و`google/gemini-3-pro-image-preview` و`openai/gpt-5.4-image-2`. استخدم
    `action: "list"` لمعرفة ما يتيحه Plugin الذي أعددته.

  </Accordion>
  <Accordion title="fal Krea 2">
    تستخدم نماذج Krea 2 على fal مخطط Krea الأصلي في fal بدلًا من مخطط
    `image_size` العام الذي يستخدمه Flux. يرسل OpenClaw:

    - `aspect_ratio` لتلميحات نسبة العرض إلى الارتفاع
    - `creativity`، وقيمته الافتراضية `medium`
    - `image_style_references` عند توفير `image` أو `images`

    حدّد Krea 2 Medium للحصول على رسوم توضيحية تعبيرية أسرع، وKrea 2 Large
    للحصول على مظاهر واقعية فوتوغرافيًا وذات خامات أكثر تفصيلًا ولكن أبطأ:

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

    يعيد Krea 2 حاليًا صورة واحدة لكل طلب. يُفضَّل استخدام `aspectRatio`
    مع Krea؛ إذ يحوّل OpenClaw قيمة `size` إلى أقرب نسبة عرض إلى ارتفاع مدعومة في Krea،
    ويرفض `resolution` مع Krea بدلًا من إسقاطه. استخدم `fal.creativity`
    عندما تريد مستوى إبداع أصليًا من Krea:

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
  <Accordion title="المصادقة المزدوجة في MiniMax">
    يتوفر توليد الصور في MiniMax عبر مساري المصادقة المضمّنين
    في MiniMax:

    - `minimax/image-01` لعمليات الإعداد باستخدام مفتاح API
    - `minimax-portal/image-01` لعمليات الإعداد باستخدام OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    يستخدم موفّر xAI المضمّن `/v1/images/generations` للطلبات المعتمدة
    على المطالبة فقط، ويستخدم `/v1/images/edits` عند وجود `image` أو `images`.

    - النماذج: `xai/grok-imagine-image`، و`xai/grok-imagine-image-quality`
    - العدد: ما يصل إلى 4
    - المراجع: قيمة `image` واحدة أو ما يصل إلى ثلاث قيم `images`
    - نسب العرض إلى الارتفاع: `1:1`، و`16:9`، و`9:16`، و`4:3`، و`3:4`، و`3:2`، و`2:3`، و`2:1`،
      و`1:2`، و`19.5:9`، و`9:19.5`، و`20:9`، و`9:20`
    - درجات الدقة: `1K`، و`2K`
    - المخرجات: تُعاد كمرفقات صور يديرها OpenClaw

    لا يتيح OpenClaw عمدًا قيم xAI الأصلية `quality` أو`mask`
    أو`user` أو نسبة العرض إلى الارتفاع `auto` إلى أن تتوفر عناصر التحكم هذه في عقد
    `image_generate` المشترك بين موفّري الخدمة.

  </Accordion>
</AccordionGroup>

## أمثلة

<Tabs>
  <Tab title="التوليد (أفقي بدقة 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="التوليد (PNG شفاف)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

أمر CLI المكافئ:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="التوليد (جودة منخفضة في OpenAI)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

أمر CLI المكافئ:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="إنشاء (صورتان مربعتان)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="تعديل (مرجع واحد)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="تعديل (مراجع متعددة)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="مراجع أنماط Krea">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

تتوفر علامات `--output-format` و`--background` و`--quality` و
`--openai-moderation` نفسها في `openclaw infer image edit`؛
وتظل `--openai-background` اسمًا بديلًا خاصًا بـ OpenAI. لا تُعلن المزوّدات المضمّنة
الأخرى غير OpenAI حاليًا عن تحكم صريح في الخلفية، لذا يتم الإبلاغ عن تجاهل
`background: "transparent"` لديها.

## مواضيع ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [ComfyUI](/ar/providers/comfy) - إعداد سير عمل ComfyUI المحلي وComfy Cloud
- [fal](/ar/providers/fal) - إعداد مزوّد الصور والفيديو fal
- [Google (Gemini)](/ar/providers/google) - إعداد مزوّد الصور Gemini
- [Plugin ‏Microsoft Foundry](/ar/plugins/reference/microsoft-foundry) - إعداد محادثة Microsoft Foundry وصور MAI
- [MiniMax](/ar/providers/minimax) - إعداد مزوّد الصور MiniMax
- [OpenAI](/ar/providers/openai) - إعداد مزوّد OpenAI Images
- [Vydra](/ar/providers/vydra) - إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) - إعداد الصور والفيديو والبحث وتنفيذ التعليمات البرمجية وتحويل النص إلى كلام في Grok
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) - إعداد `imageGenerationModel`
- [النماذج](/ar/concepts/models) - إعداد النماذج والتحويل التلقائي عند التعطل
