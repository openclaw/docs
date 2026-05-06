---
read_when:
    - إنشاء الصور أو تعديلها عبر الوكيل
    - تكوين مزوّدي توليد الصور ونماذجه
    - فهم معلمات أداة image_generate
sidebarTitle: Image generation
summary: إنشاء الصور وتحريرها عبر image_generate باستخدام OpenAI وGoogle وfal وMiniMax وComfyUI وDeepInfra وOpenRouter وLiteLLM وxAI وVydra
title: توليد الصور
x-i18n:
    generated_at: "2026-05-06T08:17:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8036e8846c38e9bfce4e618caac13fa35e89ae183f81e5a496a29feeb9656369
    source_path: tools/image-generation.md
    workflow: 16
---

تتيح أداة `image_generate` للوكيل إنشاء الصور وتحريرها باستخدام
المزوّدين الذين قمت بتكوينهم. تُسلَّم الصور المُنشأة تلقائيًا كمرفقات وسائط
في رد الوكيل.

<Note>
لا تظهر الأداة إلا عند توفر مزوّد واحد على الأقل لإنشاء الصور.
إذا كنت لا ترى `image_generate` ضمن أدوات وكيلك،
فكوّن `agents.defaults.imageGenerationModel`، أو أعدّ مفتاح API لمزوّد،
أو سجّل الدخول باستخدام OpenAI Codex OAuth.
</Note>

## البدء السريع

<Steps>
  <Step title="تكوين المصادقة">
    عيّن مفتاح API لمزوّد واحد على الأقل (على سبيل المثال `OPENAI_API_KEY`،
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

    يستخدم Codex OAuth مرجع النموذج نفسه `openai/gpt-image-2`. عند تكوين
    ملف OAuth شخصي من نوع `openai-codex`، يوجّه OpenClaw طلبات الصور عبر
    ملف OAuth الشخصي ذلك بدلًا من محاولة استخدام `OPENAI_API_KEY` أولًا.
    يؤدي تكوين `models.providers.openai` الصريح (مفتاح API،
    عنوان URL أساسي مخصص/Azure) إلى العودة إلى مسار OpenAI Images API
    المباشر.

  </Step>
  <Step title="اسأل الوكيل">
    _"أنشئ صورة لروبوت ودود يمثل العلامة."_

    يستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى قائمة سماح للأدوات
    - فهي مفعّلة افتراضيًا عند توفر مزوّد.

  </Step>
</Steps>

<Warning>
بالنسبة إلى نقاط نهاية LAN المتوافقة مع OpenAI مثل LocalAI، احتفظ بعنوان
`models.providers.openai.baseUrl` المخصص وفعّلها صراحة باستخدام
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. تظل نقاط نهاية
الصور الخاصة والداخلية محظورة افتراضيًا.
</Warning>

## المسارات الشائعة

| الهدف                                                 | مرجع النموذج                                          | المصادقة                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| إنشاء الصور عبر OpenAI مع فوترة API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| إنشاء الصور عبر OpenAI بمصادقة اشتراك Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP بخلفية شفافة عبر OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` أو OpenAI Codex OAuth |
| إنشاء الصور عبر DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| إنشاء الصور عبر OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| إنشاء الصور عبر LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| إنشاء الصور عبر Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`   |

تتعامل أداة `image_generate` نفسها مع تحويل النص إلى صورة وتحرير الصور
المرجعية. استخدم `image` لمرجع واحد أو `images` لعدة مراجع. تُمرَّر
تلميحات الإخراج التي يدعمها المزوّد، مثل `quality` و`outputFormat` و
`background`، عندما تكون متاحة، ويُبلَّغ عنها كمتجاهلة عندما لا يدعمها
المزوّد. دعم الخلفية الشفافة المضمّن خاص بـ OpenAI؛ قد يظل مزوّدون آخرون
يحافظون على قناة ألفا في PNG إذا أخرجتها الواجهة الخلفية لديهم.

## المزوّدون المدعومون

| المزوّد   | النموذج الافتراضي                           | دعم التحرير                       | المصادقة                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | نعم (صورة واحدة، مكوّنة عبر سير العمل) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة    |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | نعم (صورة واحدة)                      | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | نعم                                | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | نعم                                | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | نعم (حتى 5 صور إدخال)         | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | نعم (مرجع الموضوع)            | `MINIMAX_API_KEY` أو MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | نعم (حتى 4 صور)               | `OPENAI_API_KEY` أو OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | نعم (حتى 5 صور إدخال)         | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | لا                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | نعم (حتى 5 صور)               | `XAI_API_KEY`                                         |

استخدم `action: "list"` لفحص المزوّدين والنماذج المتاحة أثناء التشغيل:

```text
/tool image_generate action=list
```

## قدرات المزوّدين

| القدرة            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| الإنشاء (الحد الأقصى للعدد)  | محدد بسير العمل   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| التحرير / المرجع      | صورة واحدة (سير العمل) | صورة واحدة   | صورة واحدة           | حتى 5 صور | صورة واحدة (مرجع الموضوع) | حتى 5 صور | -     | حتى 5 صور |
| التحكم في الحجم          | -                  | ✓         | ✓                 | ✓              | -                     | حتى 4K       | -     | -              |
| نسبة العرض إلى الارتفاع          | -                  | -         | ✓ (الإنشاء فقط) | ✓              | ✓                     | -              | -     | ✓              |
| الدقة (1K/2K/4K) | -                  | -         | ✓                 | ✓              | -                     | -              | -     | 1K, 2K         |

## معلمات الأداة

<ParamField path="prompt" type="string" required>
  مطالبة إنشاء الصورة. مطلوبة لـ `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  استخدم `"list"` لفحص المزوّدين والنماذج المتاحة أثناء التشغيل.
</ParamField>
<ParamField path="model" type="string">
  تجاوز المزوّد/النموذج (مثل `openai/gpt-image-2`). استخدم
  `openai/gpt-image-1.5` للخلفيات الشفافة في OpenAI.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحد أو URL لوضع التحرير.
</ParamField>
<ParamField path="images" type="string[]">
  عدة صور مرجعية لوضع التحرير (حتى 5 لدى المزوّدين الداعمين).
</ParamField>
<ParamField path="size" type="string">
  تلميح الحجم: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  نسبة العرض إلى الارتفاع: `1:1`، `2:3`، `3:2`، `3:4`، `4:3`، `4:5`، `5:4`، `9:16`، `16:9`، `21:9`.
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
  `outputFormat: "png"` أو `"webp"` للمزوّدين القادرين على الشفافية.
</ParamField>
<ParamField path="count" type="number">عدد الصور المراد إنشاؤها (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لطلب المزوّد بالمللي ثانية.</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="openai" type="object">
  تلميحات خاصة بـ OpenAI فقط: `background` و`moderation` و`outputCompression` و`user`.
</ParamField>

<Note>
لا يدعم جميع المزوّدين كل المعلمات. عندما يدعم مزوّد احتياطي خيارًا هندسيًا
قريبًا بدلًا من الخيار المطلوب بدقة، يعيد OpenClaw تعيينه إلى أقرب حجم أو
نسبة عرض إلى ارتفاع أو دقة مدعومة قبل الإرسال. تُسقَط تلميحات الإخراج غير
المدعومة للمزوّدين الذين لا يعلنون الدعم، ويُبلَّغ عنها في نتيجة الأداة.
تُبلغ نتائج الأداة عن الإعدادات المطبقة؛ يلتقط `details.normalization` أي
ترجمة من المطلوب إلى المطبق.
</Note>

## التكوين

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

يحاول OpenClaw استخدام المزوّدين بهذا الترتيب:

1. معلمة **`model`** من استدعاء الأداة (إذا حدد الوكيل واحدة).
2. **`imageGenerationModel.primary`** من التكوين.
3. **`imageGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** - افتراضيات المزوّدين المدعومة بالمصادقة فقط:
   - المزوّد الافتراضي الحالي أولًا؛
   - بقية مزوّدي إنشاء الصور المسجلين بترتيب معرّف المزوّد.

إذا فشل مزوّد (خطأ مصادقة، حد معدل، وما إلى ذلك)، تُجرَّب المرشحة التالية
المكوّنة تلقائيًا. إذا فشلت كلها، يتضمن الخطأ تفاصيل من كل محاولة.

<AccordionGroup>
  <Accordion title="تجاوزات النموذج لكل استدعاء دقيقة">
    يحاول تجاوز `model` لكل استدعاء ذلك المزوّد/النموذج فقط ولا
    يتابع إلى المزوّدين الأساسي/الاحتياطي المكوّنين أو المكتشفين تلقائيًا.
  </Accordion>
  <Accordion title="الاكتشاف التلقائي يراعي المصادقة">
    لا يدخل افتراضي المزوّد إلى قائمة المرشحين إلا عندما يستطيع OpenClaw
    مصادقة ذلك المزوّد فعليًا. عيّن
    `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
    إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.
  </Accordion>
  <Accordion title="المهل الزمنية">
    عيّن `agents.defaults.imageGenerationModel.timeoutMs` لواجهات إنشاء الصور
    الخلفية البطيئة. تتجاوز معلمة الأداة `timeoutMs` لكل استدعاء القيمة
    الافتراضية المكوّنة.
  </Accordion>
  <Accordion title="الفحص أثناء التشغيل">
    استخدم `action: "list"` لفحص المزوّدين المسجلين حاليًا،
    ونماذجهم الافتراضية، وتلميحات متغيرات بيئة المصادقة.
  </Accordion>
</AccordionGroup>

### تحرير الصور

يدعم OpenAI وOpenRouter وGoogle وDeepInfra وfal وMiniMax وComfyUI وxAI تحرير
الصور المرجعية. مرّر مسار صورة مرجعية أو URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

يدعم OpenAI وOpenRouter وGoogle وxAI ما يصل إلى 5 صور مرجعية عبر معلمة
`images`. يدعم fal وMiniMax وComfyUI صورة واحدة.

## تعمقات المزوّدين

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    يعتمد توليد الصور في OpenAI افتراضيًا على `openai/gpt-image-2`. إذا كان
    ملف تعريف OAuth باسم `openai-codex` مهيأً، يعيد OpenClaw استخدام ملف
    تعريف OAuth نفسه المستخدم من نماذج محادثة اشتراك Codex ويرسل طلب
    الصورة عبر واجهة Codex Responses الخلفية. تتم مواءمة عناوين URL الأساسية القديمة
    الخاصة بـ Codex مثل `https://chatgpt.com/backend-api` إلى
    `https://chatgpt.com/backend-api/codex` لطلبات الصور. لا يعود OpenClaw
    **تلقائيًا** إلى `OPENAI_API_KEY` لذلك الطلب - لفرض التوجيه المباشر عبر OpenAI Images API،
    هيّئ `models.providers.openai` صراحةً باستخدام مفتاح API أو عنوان URL أساسي مخصص
    أو نقطة نهاية Azure.

    لا يزال بالإمكان تحديد نماذج `openai/gpt-image-1.5` و`openai/gpt-image-1` و
    `openai/gpt-image-1-mini` صراحةً. استخدم
    `gpt-image-1.5` لمخرجات PNG/WebP بخلفية شفافة؛ إذ ترفض واجهة API الحالية
    الخاصة بـ `gpt-image-2` القيمة `background: "transparent"`.

    يدعم `gpt-image-2` كلاً من توليد الصور من النص
    وتحرير الصور المرجعية عبر أداة `image_generate` نفسها.
    يمرر OpenClaw `prompt` و`count` و`size` و`quality` و`outputFormat`
    والصور المرجعية إلى OpenAI. لا تتلقى OpenAI
    `aspectRatio` أو `resolution` مباشرةً؛ عندما يكون ذلك ممكنًا، يحولهما OpenClaw
    إلى `size` مدعوم، وإلا تُبلغ الأداة عنهما باعتبارهما
    تجاوزات تم تجاهلها.

    توجد خيارات OpenAI الخاصة ضمن كائن `openai`:

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
    تتطلب المخرجات الشفافة `outputFormat` بالقيمة `png` أو `webp` ونموذج صور
    OpenAI قادرًا على الشفافية. يوجه OpenClaw طلبات الخلفية الشفافة الافتراضية
    الخاصة بـ `gpt-image-2` إلى `gpt-image-1.5`.
    ينطبق `openai.outputCompression` على مخرجات JPEG/WebP.

    تلميح `background` على المستوى الأعلى محايد للمزوّد، ويُعيَّن حاليًا
    إلى حقل طلب OpenAI `background` نفسه عند اختيار مزود OpenAI.
    أما المزودون الذين لا يعلنون دعم الخلفية فيعيدونه
    في `ignoredOverrides` بدلاً من تلقي المعامل غير المدعوم.

    لتوجيه توليد صور OpenAI عبر نشر Azure OpenAI
    بدلاً من `api.openai.com`، راجع
    [نقاط نهاية Azure OpenAI](/ar/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="OpenRouter image models">
    يستخدم توليد الصور في OpenRouter قيمة `OPENROUTER_API_KEY` نفسها
    ويُوجَّه عبر واجهة API لصور إكمالات المحادثة في OpenRouter. حدّد
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

    يمرر OpenClaw `prompt` و`count` والصور المرجعية وتلميحات
    `aspectRatio` / `resolution` المتوافقة مع Gemini إلى OpenRouter.
    تشمل اختصارات نماذج صور OpenRouter المدمجة الحالية
    `google/gemini-3.1-flash-image-preview` و
    `google/gemini-3-pro-image-preview` و`openai/gpt-5.4-image-2`. استخدم
    `action: "list"` لمعرفة ما يكشفه Plugin المهيأ لديك.

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    يتوفر توليد الصور في MiniMax عبر مساري مصادقة MiniMax المدمجين:

    - `minimax/image-01` لإعدادات مفتاح API
    - `minimax-portal/image-01` لإعدادات OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    يستخدم مزود xAI المدمج `/v1/images/generations` للطلبات التي تحتوي على مطالبة فقط
    و`/v1/images/edits` عند وجود `image` أو `images`.

    - النماذج: `xai/grok-imagine-image`، `xai/grok-imagine-image-pro`
    - العدد: حتى 4
    - المراجع: `image` واحدة أو ما يصل إلى خمس `images`
    - نسب العرض إلى الارتفاع: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
    - الدقات: `1K`، `2K`
    - المخرجات: تُعاد كمرفقات صور يديرها OpenClaw

    لا يعرّض OpenClaw عمدًا عناصر التحكم الأصلية الخاصة بـ xAI مثل `quality` أو `mask`
    أو `user` أو نسب العرض إلى الارتفاع الإضافية الأصلية فقط إلى أن توجد هذه
    العناصر في عقد `image_generate` المشترك بين المزودين.

  </Accordion>
</AccordionGroup>

## أمثلة

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
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
</Tabs>

تتوفر أعلام `--output-format` و`--background` نفسها في
`openclaw infer image edit`؛ ويبقى `--openai-background` اسمًا مستعارًا
خاصًا بـ OpenAI. لا يعلن المزودون المدمجون غير OpenAI
عن تحكم صريح في الخلفية حاليًا، لذلك يُبلَّغ عن `background: "transparent"`
على أنه متجاهل لهم.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [ComfyUI](/ar/providers/comfy) - إعداد سير عمل ComfyUI المحلي وComfy Cloud
- [fal](/ar/providers/fal) - إعداد مزود الصور والفيديو fal
- [Google (Gemini)](/ar/providers/google) - إعداد مزود صور Gemini
- [MiniMax](/ar/providers/minimax) - إعداد مزود صور MiniMax
- [OpenAI](/ar/providers/openai) - إعداد مزود OpenAI Images
- [Vydra](/ar/providers/vydra) - إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) - إعداد صور وفيديو وبحث وتنفيذ كود وTTS في Grok
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) - تهيئة `imageGenerationModel`
- [النماذج](/ar/concepts/models) - تهيئة النماذج والتبديل عند الفشل
