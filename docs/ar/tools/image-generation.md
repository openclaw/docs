---
read_when:
    - إنشاء الصور عبر الوكيل
    - تهيئة مزوّدي ونماذج توليد الصور
    - فهم معلمات أداة `image_generate`
summary: إنشاء الصور وتحريرها باستخدام المزوّدين المهيّئين (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: توليد الصور
x-i18n:
    generated_at: "2026-04-24T08:09:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51ffc32165c5e25925460f95f3a6e674a004e6640b7a4b9e88d025eb40943b4b
    source_path: tools/image-generation.md
    workflow: 15
---

تتيح أداة `image_generate` للوكيل إنشاء الصور وتحريرها باستخدام المزوّدين المهيّئين لديك. تُسلَّم الصور المُنشأة تلقائيًا كمرفقات وسائط في رد الوكيل.

<Note>
لا تظهر الأداة إلا عندما يكون مزوّد واحد على الأقل لتوليد الصور متاحًا. إذا لم ترَ `image_generate` ضمن أدوات وكيلك، فقم بتهيئة `agents.defaults.imageGenerationModel`، أو أعد إعداد مفتاح API لمزوّد، أو سجّل الدخول باستخدام OpenAI Codex OAuth.
</Note>

## البدء السريع

1. اضبط مفتاح API لمزوّد واحد على الأقل (مثل `OPENAI_API_KEY` أو `GEMINI_API_KEY` أو `OPENROUTER_API_KEY`) أو سجّل الدخول باستخدام OpenAI Codex OAuth.
2. اختياريًا، اضبط النموذج المفضل لديك:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

يستخدم Codex OAuth مرجع النموذج نفسه `openai/gpt-image-2`. وعندما يكون
ملف تعريف OAuth من `openai-codex` مهيأً، يوجّه OpenClaw طلبات الصور
عبر ملف تعريف OAuth نفسه بدلًا من محاولة `OPENAI_API_KEY` أولًا.
ويؤدي إعداد صورة مخصص صريح ضمن `models.providers.openai`، مثل مفتاح API أو
عنوان `baseUrl` مخصص/Azure، إلى إعادة التفعيل لمسار OpenAI Images API المباشر.
وبالنسبة إلى نقاط نهاية LAN المتوافقة مع OpenAI مثل LocalAI، أبقِ
`models.providers.openai.baseUrl` المخصص وفعّل صراحةً
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; وتظل نقاط
نهاية الصور الخاصة/الداخلية محظورة افتراضيًا.

3. اطلب من الوكيل: _"أنشئ صورة لتميمة روبوت ودود."_

سيستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى قائمة سماح للأداة — فهي مفعلة افتراضيًا عندما يكون المزوّد متاحًا.

## المزوّدون المدعومون

| المزوّد    | النموذج الافتراضي                        | دعم التحرير                         | المصادقة                                              |
| ---------- | ---------------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                            | نعم (حتى 4 صور)                     | `OPENAI_API_KEY` أو OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview`  | نعم (حتى 5 صور إدخال)               | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`         | نعم                                 | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                  |
| fal        | `fal-ai/flux/dev`                        | نعم                                 | `FAL_KEY`                                             |
| MiniMax    | `image-01`                               | نعم (مرجع موضوع)                    | `MINIMAX_API_KEY` أو MiniMax OAuth ‏(`minimax-portal`) |
| ComfyUI    | `workflow`                               | نعم (صورة واحدة، بحسب تهيئة workflow) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة    |
| Vydra      | `grok-imagine`                           | لا                                  | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                     | نعم (حتى 5 صور)                     | `XAI_API_KEY`                                         |

استخدم `action: "list"` لفحص المزوّدين والنماذج المتاحة أثناء runtime:

```
/tool image_generate action=list
```

## معلمات الأداة

<ParamField path="prompt" type="string" required>
Prompt توليد الصورة. مطلوب لـ `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
استخدم `"list"` لفحص المزوّدين والنماذج المتاحة أثناء runtime.
</ParamField>

<ParamField path="model" type="string">
تجاوز المزوّد/النموذج، مثل `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
مسار أو URL لصورة مرجعية واحدة لوضع التحرير.
</ParamField>

<ParamField path="images" type="string[]">
صور مرجعية متعددة لوضع التحرير (حتى 5).
</ParamField>

<ParamField path="size" type="string">
تلميح الحجم: `1024x1024` أو `1536x1024` أو `1024x1536` أو `2048x2048` أو `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
نسبة العرض إلى الارتفاع: `1:1` أو `2:3` أو `3:2` أو `3:4` أو `4:3` أو `4:5` أو `5:4` أو `9:16` أو `16:9` أو `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
تلميح الدقة.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
تلميح الجودة عندما يدعمه المزوّد.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
تلميح تنسيق الإخراج عندما يدعمه المزوّد.
</ParamField>

<ParamField path="count" type="number">
عدد الصور المطلوب إنشاؤها (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
مهلة اختيارية لطلب المزوّد بالمللي ثانية.
</ParamField>

<ParamField path="filename" type="string">
تلميح اسم ملف الإخراج.
</ParamField>

<ParamField path="openai" type="object">
تلميحات خاصة بـ OpenAI: ‏`background` و`moderation` و`outputCompression` و`user`.
</ParamField>

لا تدعم جميع المزوّدات كل المعلمات. عندما يدعم مزوّد fallback خيارًا قريبًا للهندسة بدلًا من الخيار المطلوب تمامًا، يعيد OpenClaw تعيينه إلى أقرب حجم أو نسبة عرض إلى ارتفاع أو دقة مدعومة قبل الإرسال. وتُسقط تلميحات الإخراج غير المدعومة مثل `quality` أو `outputFormat` للمزوّدين الذين لا يعلنون دعمها، ويُبلّغ عنها في نتيجة الأداة.

تبلّغ نتائج الأداة عن الإعدادات المطبقة. وعندما يعيد OpenClaw تعيين الهندسة أثناء fallback بين المزوّدين، تعكس القيم المرجعة `size` و`aspectRatio` و`resolution` ما أُرسل فعليًا، وتلتقط `details.normalization` التحويل من المطلوب إلى المطبق.

## التهيئة

### اختيار النموذج

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
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

عند إنشاء صورة، يحاول OpenClaw المزوّدين بهذا الترتيب:

1. معلمة **`model`** من استدعاء الأداة (إذا حدّدها الوكيل)
2. **`imageGenerationModel.primary`** من التهيئة
3. **`imageGenerationModel.fallbacks`** بالترتيب
4. **الاكتشاف التلقائي** — يستخدم افتراضيات المزوّد المدعومة بالمصادقة فقط:
   - المزوّد الافتراضي الحالي أولًا
   - مزوّدو توليد الصور المسجّلون الباقون بترتيب معرّف المزوّد

إذا فشل مزوّد ما (خطأ مصادقة، أو حد معدل، إلخ)، تُجرَّب المرشحات التالية تلقائيًا. وإذا فشل الجميع، يتضمن الخطأ تفاصيل من كل محاولة.

ملاحظات:

- الاكتشاف التلقائي مدرك للمصادقة. لا يدخل افتراضي المزوّد قائمة المرشحين
  إلا عندما يتمكن OpenClaw فعليًا من مصادقة ذلك المزوّد.
- يكون الاكتشاف التلقائي مفعّلًا افتراضيًا. اضبط
  `agents.defaults.mediaGenerationAutoProviderFallback: false` إذا كنت تريد أن يستخدم
  توليد الصور فقط إدخالات `model` و`primary` و`fallbacks`
  الصريحة.
- استخدم `action: "list"` لفحص المزوّدين المسجلين حاليًا، و
  النماذج الافتراضية الخاصة بهم، وتلميحات متغيرات البيئة الخاصة بالمصادقة.

### تحرير الصور

تدعم OpenAI وOpenRouter وGoogle وfal وMiniMax وComfyUI وxAI تحرير الصور المرجعية. مرّر مسار صورة مرجعية أو URL:

```
"أنشئ نسخة بالألوان المائية من هذه الصورة" + image: "/path/to/photo.jpg"
```

تدعم OpenAI وOpenRouter وGoogle وxAI حتى 5 صور مرجعية عبر المعلمة `images`. بينما تدعم fal وMiniMax وComfyUI صورة واحدة.

### نماذج صور OpenRouter

يستخدم توليد الصور في OpenRouter نفس `OPENROUTER_API_KEY` ويوجَّه عبر OpenRouter's chat completions image API. اختر نماذج صور OpenRouter باستخدام البادئة `openrouter/`:

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

يمرّر OpenClaw كلًا من `prompt` و`count` والصور المرجعية وتلميحات `aspectRatio` / `resolution` المتوافقة مع Gemini إلى OpenRouter. وتشمل اختصارات نماذج صور OpenRouter المضمنة حاليًا `google/gemini-3.1-flash-image-preview` و`google/gemini-3-pro-image-preview` و`openai/gpt-5.4-image-2`; استخدم `action: "list"` لمعرفة ما يكشفه Plugin المهيأ لديك.

### OpenAI `gpt-image-2`

يفترض OpenAI image generation النموذج `openai/gpt-image-2`. وإذا كان
ملف تعريف OAuth من `openai-codex` مهيأً، يعيد OpenClaw استخدام ملف تعريف OAuth
نفسه المستخدم من قبل نماذج محادثة اشتراك Codex ويرسل طلب الصورة
عبر Codex Responses backend؛ ولا يعود بصمت إلى
`OPENAI_API_KEY` لهذا الطلب. ولإجبار التوجيه المباشر إلى OpenAI Images API،
قم بتهيئة `models.providers.openai` صراحةً بمفتاح API أو `baseUrl` مخصص،
أو نقطة نهاية Azure. وما يزال النموذج الأقدم
`openai/gpt-image-1` قابلًا للاختيار صراحةً، لكن طلبات OpenAI الجديدة
لتوليد الصور وتحريرها ينبغي أن تستخدم `gpt-image-2`.

يدعم `gpt-image-2` كلًا من التوليد النصي إلى صورة وتحرير الصور المرجعية
عبر أداة `image_generate` نفسها. ويمرّر OpenClaw كلًا من `prompt` و
`count` و`size` و`quality` و`outputFormat` والصور المرجعية إلى OpenAI.
ولا تتلقى OpenAI المعلمتين `aspectRatio` أو `resolution` مباشرةً؛ وعندما يكون ذلك ممكنًا
يقوم OpenClaw بربطهما إلى `size` مدعوم، وإلا فتُبلّغ الأداة عنهما
كتجاوزات تم تجاهلها.

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

يقبل `openai.background` القيم `transparent` أو `opaque` أو `auto`; وتتطلب
المخرجات الشفافة أن يكون `outputFormat` هو `png` أو `webp`. وتُطبَّق
`openai.outputCompression` على مخرجات JPEG/WebP.

أنشئ صورة أفقية واحدة بدقة 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

أنشئ صورتين مربعتين:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

حرّر صورة مرجعية محلية واحدة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

حرّر باستخدام مراجع متعددة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

لتوجيه توليد الصور في OpenAI عبر Azure OpenAI deployment بدلًا
من `api.openai.com`، راجع [Azure OpenAI endpoints](/ar/providers/openai#azure-openai-endpoints)
في توثيق مزوّد OpenAI.

يتوفر توليد الصور في MiniMax عبر مساري المصادقة المضمّنين لـ MiniMax:

- `minimax/image-01` لإعدادات مفتاح API
- `minimax-portal/image-01` لإعدادات OAuth

## إمكانات المزوّد

| الإمكانية            | OpenAI               | Google               | fal                 | MiniMax                      | ComfyUI                              | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | ---------------------------- | ------------------------------------ | ------- | -------------------- |
| الإنشاء              | نعم (حتى 4)          | نعم (حتى 4)          | نعم (حتى 4)         | نعم (حتى 9)                  | نعم (مخرجات يحددها workflow)         | نعم (1) | نعم (حتى 4)          |
| التحرير/المرجع       | نعم (حتى 5 صور)      | نعم (حتى 5 صور)      | نعم (صورة واحدة)    | نعم (صورة واحدة، مرجع موضوع) | نعم (صورة واحدة، وفق تهيئة workflow) | لا      | نعم (حتى 5 صور)      |
| التحكم في الحجم      | نعم (حتى 4K)         | نعم                  | نعم                 | لا                           | لا                                   | لا      | لا                   |
| نسبة العرض إلى الارتفاع | لا                 | نعم                  | نعم (للإنشاء فقط)   | نعم                          | لا                                   | لا      | نعم                  |
| الدقة (`1K`/`2K`/`4K`) | لا                | نعم                  | نعم                 | لا                           | لا                                   | لا      | نعم (`1K`/`2K`)      |

### xAI `grok-imagine-image`

يستخدم مزوّد xAI المضمّن `/v1/images/generations` للطلبات المعتمدة على prompt فقط
و`/v1/images/edits` عندما تكون `image` أو `images` موجودة.

- النماذج: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- العدد: حتى 4
- المراجع: `image` واحدة أو حتى خمس `images`
- نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- الدقات: `1K`, `2K`
- المخرجات: تُعاد كمرفقات صور يديرها OpenClaw

يتعمد OpenClaw عدم كشف `quality` أو `mask` أو `user` الأصلية الخاصة بـ xAI، أو
نِسَب العرض إلى الارتفاع الإضافية الخاصة بها فقط، إلى أن تصبح هذه العناصر موجودة في عقد
`image_generate` المشترك بين المزوّدين.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [fal](/ar/providers/fal) — إعداد مزوّد الصور والفيديو fal
- [ComfyUI](/ar/providers/comfy) — إعداد workflow لـ ComfyUI المحلي وComfy Cloud
- [Google (Gemini)](/ar/providers/google) — إعداد مزوّد الصور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد مزوّد الصور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد مزوّد OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) — إعداد صور وفيديو وبحث وتنفيذ شيفرة وTTS في Grok
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults) — تهيئة `imageGenerationModel`
- [النماذج](/ar/concepts/models) — تهيئة النماذج والتبديل عند الفشل
