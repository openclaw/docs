---
read_when:
    - إنشاء الصور أو تحريرها عبر الوكيل
    - تكوين مزوّدي ونماذج توليد الصور
    - فهم معلمات أداة image_generate
sidebarTitle: Image generation
summary: إنشاء الصور وتحريرها باستخدام image_generate عبر OpenAI، Google، fal، MiniMax، ComfyUI، DeepInfra، OpenRouter، LiteLLM، xAI، Vydra
title: توليد الصور
x-i18n:
    generated_at: "2026-04-30T08:29:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2237ad82279d8daf28d70a550727a5900d7a820a0c9ba09de8b7bae5b6575401
    source_path: tools/image-generation.md
    workflow: 16
---

تتيح أداة `image_generate` للوكيل إنشاء الصور وتحريرها باستخدام المزوّدين
الذين قمت بتكوينهم. تُرسل الصور المُنشأة تلقائيًا كمرفقات وسائط
في رد الوكيل.

<Note>
لا تظهر الأداة إلا عند توفر مزوّد واحد على الأقل لإنشاء الصور.
إذا لم ترَ `image_generate` ضمن أدوات وكيلك،
فقم بتكوين `agents.defaults.imageGenerationModel`، أو إعداد مفتاح API لمزوّد،
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
    ملف OAuth باسم `openai-codex`، يوجّه OpenClaw طلبات الصور
    عبر ملف OAuth ذلك بدلًا من محاولة استخدام
    `OPENAI_API_KEY` أولًا. يؤدي تكوين `models.providers.openai` الصريح (مفتاح API،
    أو عنوان URL أساسي مخصص/Azure) إلى العودة إلى مسار OpenAI Images API
    المباشر.

  </Step>
  <Step title="اسأل الوكيل">
    _"أنشئ صورة لتميمة روبوت ودودة."_

    يستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى قائمة سماح للأدوات
    — فهي مفعّلة افتراضيًا عند توفر مزوّد.

  </Step>
</Steps>

<Warning>
بالنسبة إلى نقاط نهاية LAN المتوافقة مع OpenAI مثل LocalAI، احتفظ بعنوان
`models.providers.openai.baseUrl` المخصص واشترك صراحةً باستخدام
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. تظل نقاط نهاية الصور الخاصة
والداخلية محظورة افتراضيًا.
</Warning>

## المسارات الشائعة

| الهدف                                                 | مرجع النموذج                                          | المصادقة                                   |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| إنشاء صور OpenAI مع فوترة API             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| إنشاء صور OpenAI باستخدام مصادقة اشتراك Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| PNG/WebP بخلفية شفافة من OpenAI               | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` أو OpenAI Codex OAuth |
| إنشاء صور DeepInfra                           | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| إنشاء صور OpenRouter                          | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| إنشاء صور LiteLLM                             | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| إنشاء صور Google Gemini                       | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`   |

تتعامل أداة `image_generate` نفسها مع تحويل النص إلى صورة وتحرير الصور المرجعية.
استخدم `image` لمرجع واحد أو `images` لعدة مراجع.
تُمرّر تلميحات الإخراج التي يدعمها المزوّد مثل `quality` و`outputFormat` و
`background` عند توفرها، ويُبلّغ عنها على أنها متجاهَلة عندما لا يدعمها
المزوّد. دعم الخلفية الشفافة المضمّن
خاص بـ OpenAI؛ وقد يستمر مزوّدون آخرون في الحفاظ على شفافية PNG إذا
أصدرها نظامهم الخلفي.

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

استخدم `action: "list"` لفحص المزوّدين والنماذج المتاحة وقت التشغيل:

```text
/tool image_generate action=list
```

## قدرات المزوّدين

| القدرة            | ComfyUI            | DeepInfra | fal               | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| الإنشاء (أقصى عدد)  | محدد بسير العمل   | 4         | 4                 | 4              | 9                     | 4              | 1     | 4              |
| التحرير / المرجع      | صورة واحدة (سير العمل) | صورة واحدة   | صورة واحدة           | حتى 5 صور | صورة واحدة (مرجع الموضوع) | حتى 5 صور | —     | حتى 5 صور |
| التحكم بالحجم          | —                  | ✓         | ✓                 | ✓              | —                     | حتى 4K       | —     | —              |
| نسبة العرض إلى الارتفاع          | —                  | —         | ✓ (للإنشاء فقط) | ✓              | ✓                     | —              | —     | ✓              |
| الدقة (1K/2K/4K) | —                  | —         | ✓                 | ✓              | —                     | —              | —     | 1K, 2K         |

## معلمات الأداة

<ParamField path="prompt" type="string" required>
  مطالبة إنشاء الصورة. مطلوبة لـ `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  استخدم `"list"` لفحص المزوّدين والنماذج المتاحة وقت التشغيل.
</ParamField>
<ParamField path="model" type="string">
  تجاوز المزوّد/النموذج (مثل `openai/gpt-image-2`). استخدم
  `openai/gpt-image-1.5` لخلفيات OpenAI الشفافة.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحدة أو عنوان URL لوضع التحرير.
</ParamField>
<ParamField path="images" type="string[]">
  صور مرجعية متعددة لوضع التحرير (حتى 5 لدى المزوّدين الداعمين).
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
<ParamField path="count" type="number">عدد الصور المراد إنشاؤها (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">مهلة طلب المزوّد الاختيارية بالمللي ثانية.</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="openai" type="object">
  تلميحات خاصة بـ OpenAI فقط: `background` و`moderation` و`outputCompression` و`user`.
</ParamField>

<Note>
لا يدعم كل المزوّدين جميع المعلمات. عندما يدعم مزوّد احتياطي خيار هندسة
قريبًا بدلًا من الخيار المطلوب تحديدًا، يعيد OpenClaw تعيينه إلى
أقرب حجم أو نسبة عرض إلى ارتفاع أو دقة مدعومة قبل الإرسال.
تُسقَط تلميحات الإخراج غير المدعومة لدى المزوّدين الذين لا يعلنون
الدعم، ويُبلّغ عنها في نتيجة الأداة. تعرض نتائج الأداة الإعدادات
المطبقة؛ ويلتقط `details.normalization` أي ترجمة من المطلوب إلى المطبق.
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

### ترتيب اختيار المزوّد

يحاول OpenClaw المزوّدين بهذا الترتيب:

1. معلمة **`model`** من استدعاء الأداة (إذا حدد الوكيل واحدة).
2. **`imageGenerationModel.primary`** من التكوين.
3. **`imageGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** — افتراضيات المزوّدين المدعومة بالمصادقة فقط:
   - المزوّد الافتراضي الحالي أولًا؛
   - بقية مزوّدي إنشاء الصور المسجلين بترتيب معرّف المزوّد.

إذا فشل مزوّد (خطأ مصادقة، أو حد معدل، إلخ)، تتم تجربة المرشح
المكوّن التالي تلقائيًا. إذا فشل الجميع، يتضمن الخطأ تفاصيل
من كل محاولة.

<AccordionGroup>
  <Accordion title="تجاوزات النموذج لكل استدعاء دقيقة">
    يحاول تجاوز `model` لكل استدعاء ذلك المزوّد/النموذج فقط ولا
    يواصل إلى المزوّد الأساسي/الاحتياطي المكوّن أو المزوّدين المكتشفين تلقائيًا.
  </Accordion>
  <Accordion title="الاكتشاف التلقائي واعٍ بالمصادقة">
    لا يدخل افتراضي المزوّد إلى قائمة المرشحين إلا عندما يستطيع OpenClaw
    مصادقة ذلك المزوّد فعليًا. عيّن
    `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام إدخالات
    `model` و`primary` و`fallbacks` الصريحة فقط.
  </Accordion>
  <Accordion title="المهل">
    عيّن `agents.defaults.imageGenerationModel.timeoutMs` للأنظمة الخلفية البطيئة للصور.
    تتجاوز معلمة الأداة `timeoutMs` لكل استدعاء الافتراضي
    المكوّن.
  </Accordion>
  <Accordion title="الفحص وقت التشغيل">
    استخدم `action: "list"` لفحص المزوّدين المسجلين حاليًا،
    ونماذجهم الافتراضية، وتلميحات متغيرات بيئة المصادقة.
  </Accordion>
</AccordionGroup>

### تحرير الصور

يدعم OpenAI وOpenRouter وGoogle وDeepInfra وfal وMiniMax وComfyUI وxAI تحرير
الصور المرجعية. مرّر مسار صورة مرجعية أو عنوان URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

يدعم OpenAI وOpenRouter وGoogle وxAI حتى 5 صور مرجعية عبر معلمة
`images`. يدعم fal وMiniMax وComfyUI صورة واحدة.

## تفاصيل المزوّدين

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (وgpt-image-1.5)">
    يعتمد إنشاء الصور في OpenAI افتراضيًا على `openai/gpt-image-2`. إذا تم
    تكوين ملف تعريف OAuth باسم `openai-codex`، يعيد OpenClaw استخدام ملف تعريف
    OAuth نفسه المستخدم بواسطة نماذج دردشة اشتراك Codex ويرسل طلب
    الصورة عبر الواجهة الخلفية Codex Responses. يتم تحويل عناوين URL الأساسية
    القديمة الخاصة بـ Codex مثل `https://chatgpt.com/backend-api` إلى الصيغة المعيارية
    `https://chatgpt.com/backend-api/codex` لطلبات الصور. لا يعود OpenClaw
    **ضمنيًا** إلى `OPENAI_API_KEY` لذلك الطلب —
    لفرض التوجيه المباشر عبر OpenAI Images API، كوّن
    `models.providers.openai` صراحةً باستخدام مفتاح API أو عنوان URL أساسي مخصص
    أو نقطة نهاية Azure.

    لا يزال من الممكن اختيار نماذج `openai/gpt-image-1.5` و`openai/gpt-image-1` و
    `openai/gpt-image-1-mini` صراحةً. استخدم
    `gpt-image-1.5` لإخراج PNG/WebP بخلفية شفافة؛ إذ ترفض واجهة API الحالية
    `gpt-image-2` القيمة `background: "transparent"`.

    يدعم `gpt-image-2` كلاً من إنشاء الصور من النص
    وتحرير الصور المرجعية من خلال أداة `image_generate` نفسها.
    يمرر OpenClaw `prompt` و`count` و`size` و`quality` و`outputFormat`
    والصور المرجعية إلى OpenAI. لا تتلقى OpenAI
    `aspectRatio` أو `resolution` مباشرةً؛ وعندما يكون ذلك ممكنًا، يطابق OpenClaw
    هذه القيم مع `size` مدعوم، وإلا فتبلغ الأداة عنها
    كتجاوزات متجاهلة.

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
    وتتطلب المخرجات الشفافة `outputFormat` بقيمة `png` أو `webp` ونموذج صور
    OpenAI يدعم الشفافية. يوجه OpenClaw طلبات الخلفية الشفافة الافتراضية
    `gpt-image-2` إلى `gpt-image-1.5`.
    ينطبق `openai.outputCompression` على مخرجات JPEG/WebP.

    تلميح `background` ذي المستوى الأعلى محايد بالنسبة إلى المزود ويُطابق حاليًا
    حقل طلب OpenAI `background` نفسه عند اختيار مزود OpenAI.
    المزودون الذين لا يعلنون دعم الخلفية يعيدونه
    في `ignoredOverrides` بدلًا من تلقي المعامل غير المدعوم.

    لتوجيه إنشاء صور OpenAI عبر نشر Azure OpenAI
    بدلًا من `api.openai.com`، راجع
    [نقاط نهاية Azure OpenAI](/ar/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="نماذج صور OpenRouter">
    يستخدم إنشاء الصور في OpenRouter مفتاح `OPENROUTER_API_KEY` نفسه ويتم
    التوجيه عبر واجهة API لصور إكمالات الدردشة في OpenRouter. اختر
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
    `action: "list"` لمعرفة ما يعرضه Plugin الذي قمت بتكوينه.

  </Accordion>
  <Accordion title="مصادقة MiniMax المزدوجة">
    يتوفر إنشاء الصور في MiniMax من خلال مساري مصادقة MiniMax المدمجين:

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

    لا يعرض OpenClaw عمدًا `quality` أو`mask` أو`user` الأصلية في xAI،
    ولا نسب العرض إلى الارتفاع الإضافية الأصلية فقط، حتى تتوفر هذه عناصر التحكم
    في عقد `image_generate` المشترك عبر المزودين.

  </Accordion>
</AccordionGroup>

## أمثلة

<Tabs>
  <Tab title="إنشاء (منظر طبيعي 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="إنشاء (PNG شفاف)">
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
  <Tab title="إنشاء (صورتان مربعتان)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="تحرير (مرجع واحد)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="تحرير (مراجع متعددة)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

تتوفر علامتا `--output-format` و`--background` نفسيهما على
`openclaw infer image edit`؛ وتبقى `--openai-background` اسمًا بديلًا
خاصًا بـ OpenAI. لا يعلن المزودون المدمجون الآخرون غير OpenAI
تحكمًا صريحًا في الخلفية اليوم، لذلك يتم الإبلاغ عن `background: "transparent"`
على أنه متجاهل لهم.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [ComfyUI](/ar/providers/comfy) — إعداد سير عمل ComfyUI المحلي وComfy Cloud
- [fal](/ar/providers/fal) — إعداد مزود الصور والفيديو fal
- [Google (Gemini)](/ar/providers/google) — إعداد مزود صور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد مزود صور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد مزود OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) — إعداد صور وفيديو وبحث وتنفيذ كود وTTS في Grok
- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — تكوين `imageGenerationModel`
- [النماذج](/ar/concepts/models) — تكوين النماذج والتجاوز عند الفشل
