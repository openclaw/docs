---
read_when:
    - إنشاء الصور عبر agent
    - إعداد موفّري ونماذج إنشاء الصور
    - فهم معلمات أداة `image_generate`
summary: أنشئ الصور وحرّرها باستخدام الموفّرين المُعدّين (OpenAI، وOpenAI Codex OAuth، وGoogle Gemini، وOpenRouter، وLiteLLM، وfal، وMiniMax، وComfyUI، وVydra، وxAI)
title: إنشاء الصور
x-i18n:
    generated_at: "2026-04-25T18:23:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40ec0e9a004e769b3db8b98b1a687097cb4bc6aa78dc903e4f6a17c3731156c0
    source_path: tools/image-generation.md
    workflow: 15
---

تتيح أداة `image_generate` للـ agent إنشاء الصور وتحريرها باستخدام الموفّرين المُعدّين لديك. ويتم تسليم الصور المُنشأة تلقائيًا كمرفقات وسائط في رد agent.

<Note>
لا تظهر الأداة إلا عند توفر موفّر واحد على الأقل لإنشاء الصور. إذا لم ترَ `image_generate` ضمن أدوات agent لديك، فقم بإعداد `agents.defaults.imageGenerationModel`، أو اضبط مفتاح API للموفّر، أو سجّل الدخول باستخدام OpenAI Codex OAuth.
</Note>

## البدء السريع

1. اضبط مفتاح API لموفّر واحد على الأقل (على سبيل المثال `OPENAI_API_KEY` أو `GEMINI_API_KEY` أو `OPENROUTER_API_KEY`) أو سجّل الدخول باستخدام OpenAI Codex OAuth.
2. اضبط نموذجك المفضل اختياريًا:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // مهلة الطلب الافتراضية الاختيارية للموفّر بالنسبة إلى image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

يستخدم Codex OAuth مرجع النموذج نفسه `openai/gpt-image-2`. فعندما يكون
ملف تعريف OAuth لـ `openai-codex` مُعدًا، يوجّه OpenClaw طلبات الصور
عبر ملف تعريف OAuth نفسه بدلًا من محاولة `OPENAI_API_KEY` أولًا.
ويؤدي إعداد صورة صريح ومخصص في `models.providers.openai`، مثل مفتاح API أو
`baseUrl` مخصص/Azure، إلى إعادة الاشتراك في مسار OpenAI Images API المباشر.
وبالنسبة إلى نقاط النهاية المتوافقة مع OpenAI على شبكة LAN مثل LocalAI، احتفظ بـ
`models.providers.openai.baseUrl` المخصص واشترك صراحةً عبر
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`؛ إذ تظل
نقاط نهاية الصور الخاصة/الداخلية محجوبة افتراضيًا.

3. اطلب من agent: _"أنشئ صورة لتميمة روبوت ودود."_

يستدعي agent `image_generate` تلقائيًا. ولا حاجة إلى قائمة سماح للأدوات — فهي مفعلة افتراضيًا عند توفر موفّر.

## المسارات الشائعة

| الهدف                                                 | مرجع النموذج                                       | المصادقة                            |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| إنشاء صور OpenAI مع الفوترة عبر API                  | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| إنشاء صور OpenAI مع مصادقة اشتراك Codex             | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| إنشاء صور OpenRouter                                 | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| إنشاء صور LiteLLM                                    | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                    |
| إنشاء صور Google Gemini                              | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

تتولى الأداة نفسها `image_generate` كلاً من إنشاء الصور من النص وتحرير الصور
المرجعية. استخدم `image` لمرجع واحد أو `images` لمراجع متعددة.
وتُمرَّر تلميحات الإخراج المدعومة من الموفّر مثل `quality` و`outputFormat` و
`background` الخاص بـ OpenAI عند توفرها، ويُبلَّغ عنها على أنها
تم تجاهلها عندما لا يدعمها الموفّر.

## الموفّرون المدعومون

| الموفّر   | النموذج الافتراضي                         | دعم التحرير                        | المصادقة                                               |
| ---------- | ----------------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI     | `gpt-image-2`                             | نعم (حتى 4 صور)                    | `OPENAI_API_KEY` أو OpenAI Codex OAuth                 |
| OpenRouter | `google/gemini-3.1-flash-image-preview`   | نعم (حتى 5 صور إدخال)              | `OPENROUTER_API_KEY`                                   |
| LiteLLM    | `gpt-image-2`                             | نعم (حتى 5 صور إدخال)              | `LITELLM_API_KEY`                                      |
| Google     | `gemini-3.1-flash-image-preview`          | نعم                                | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                   |
| fal        | `fal-ai/flux/dev`                         | نعم                                | `FAL_KEY`                                              |
| MiniMax    | `image-01`                                | نعم (مرجع موضوع)                   | `MINIMAX_API_KEY` أو MiniMax OAuth (`minimax-portal`)  |
| ComfyUI    | `workflow`                                | نعم (صورة واحدة، وفق إعداد workflow) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة     |
| Vydra      | `grok-imagine`                            | لا                                 | `VYDRA_API_KEY`                                        |
| xAI        | `grok-imagine-image`                      | نعم (حتى 5 صور)                    | `XAI_API_KEY`                                          |

استخدم `action: "list"` لفحص الموفّرين والنماذج المتاحة في وقت التشغيل:

```
/tool image_generate action=list
```

## معلمات الأداة

<ParamField path="prompt" type="string" required>
مطالبة إنشاء الصورة. مطلوبة لـ `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
استخدم `"list"` لفحص الموفّرين والنماذج المتاحة في وقت التشغيل.
</ParamField>

<ParamField path="model" type="string">
تجاوز موفّر/نموذج، مثل `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
مسار صورة مرجعية واحدة أو URL لوضع التحرير.
</ParamField>

<ParamField path="images" type="string[]">
صور مرجعية متعددة لوضع التحرير (حتى 5).
</ParamField>

<ParamField path="size" type="string">
تلميح الحجم: `1024x1024` أو `1536x1024` أو `1024x1536` أو `2048x2048` أو `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
نسبة الأبعاد: `1:1` أو `2:3` أو `3:2` أو `3:4` أو `4:3` أو `4:5` أو `5:4` أو `9:16` أو `16:9` أو `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
تلميح الدقة.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
تلميح الجودة عندما يدعمه الموفّر.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
تلميح تنسيق الإخراج عندما يدعمه الموفّر.
</ParamField>

<ParamField path="count" type="number">
عدد الصور المطلوب إنشاؤها (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
مهلة طلب الموفّر الاختيارية بالمللي ثانية.
</ParamField>

<ParamField path="filename" type="string">
تلميح اسم ملف الإخراج.
</ParamField>

<ParamField path="openai" type="object">
تلميحات OpenAI فقط: `background` و`moderation` و`outputCompression` و`user`.
</ParamField>

لا تدعم كل الموفّرين جميع المعلمات. وعندما يدعم موفّر رجوع احتياطي خيار هندسة قريبًا بدلًا من الخيار المطلوب تمامًا، يعيد OpenClaw تعيينه إلى أقرب حجم أو نسبة أبعاد أو دقة مدعومة قبل الإرسال. وتُحذف تلميحات الإخراج غير المدعومة مثل `quality` أو `outputFormat` بالنسبة إلى الموفّرين الذين لا يعلنون دعمها، ويُبلَّغ عنها في نتيجة الأداة.

تُبلّغ نتائج الأداة عن الإعدادات المطبقة. وعندما يعيد OpenClaw تعيين الهندسة أثناء الرجوع الاحتياطي للموفّر، تعكس القيم المعادة `size` و`aspectRatio` و`resolution` ما تم إرساله فعليًا، وتلتقط `details.normalization` عملية التحويل من المطلوب إلى المطبق.

## الإعدادات

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

عند إنشاء صورة، يجرّب OpenClaw الموفّرين بهذا الترتيب:

1. معلمة **`model`** من استدعاء الأداة (إذا حدّدها agent)
2. القيمة **`imageGenerationModel.primary`** من الإعدادات
3. القيم **`imageGenerationModel.fallbacks`** بالترتيب
4. **الاكتشاف التلقائي** — يستخدم افتراضيات الموفّر المدعومة بالمصادقة فقط:
   - الموفّر الافتراضي الحالي أولًا
   - بقية موفّري إنشاء الصور المسجلين بترتيب معرّف الموفّر

إذا فشل موفّر (خطأ مصادقة، أو حد معدل، أو غير ذلك)، تتم تجربة المرشح المُعد التالي تلقائيًا. وإذا فشل الجميع، يتضمن الخطأ تفاصيل من كل محاولة.

ملاحظات:

- يكون تجاوز `model` لكل استدعاء دقيقًا: يجرّب OpenClaw فقط ذلك الموفّر/النموذج
  ولا يواصل إلى المرشحين المُعدّين primary/fallback أو الموفّرين
  المكتشفين تلقائيًا.
- الاكتشاف التلقائي واعٍ بالمصادقة. ولا يدخل افتراضي الموفّر إلى قائمة المرشحين
  إلا عندما يستطيع OpenClaw بالفعل مصادقة ذلك الموفّر.
- يكون الاكتشاف التلقائي مفعّلًا افتراضيًا. اضبط
  `agents.defaults.mediaGenerationAutoProviderFallback: false` إذا كنت تريد أن يستخدم
  إنشاء الصور فقط إدخالات `model` و`primary` و`fallbacks`
  الصريحة.
- اضبط `agents.defaults.imageGenerationModel.timeoutMs` لواجهات الصور الخلفية البطيئة.
  وتؤدي معلمة الأداة `timeoutMs` لكل استدعاء إلى تجاوز القيمة الافتراضية المُعدة.
- استخدم `action: "list"` لفحص الموفّرين المسجلين حاليًا، و
  نماذجهم الافتراضية، وتلميحات متغيرات البيئة الخاصة بالمصادقة.

### تحرير الصور

يدعم OpenAI وOpenRouter وGoogle وfal وMiniMax وComfyUI وxAI تحرير الصور المرجعية. مرّر مسار صورة مرجعية أو URL:

```
"أنشئ نسخة مائية من هذه الصورة" + image: "/path/to/photo.jpg"
```

يدعم OpenAI وOpenRouter وGoogle وxAI ما يصل إلى 5 صور مرجعية عبر المعلمة `images`. أما fal وMiniMax وComfyUI فتدعم صورة واحدة.

### نماذج صور OpenRouter

يستخدم إنشاء الصور في OpenRouter مفتاح `OPENROUTER_API_KEY` نفسه ويتم توجيهه عبر واجهة API الخاصة بالصور في chat completions لدى OpenRouter. اختر نماذج صور OpenRouter باستخدام البادئة `openrouter/`:

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

يمرر OpenClaw `prompt` و`count` والصور المرجعية وتلميحات `aspectRatio` / `resolution` المتوافقة مع Gemini إلى OpenRouter. وتتضمن اختصارات نماذج صور OpenRouter المضمنة الحالية `google/gemini-3.1-flash-image-preview` و`google/gemini-3-pro-image-preview` و`openai/gpt-5.4-image-2`؛ استخدم `action: "list"` لرؤية ما الذي يعرضه Plugin المُعد لديك.

### OpenAI `gpt-image-2`

يفترض إنشاء الصور في OpenAI افتراضيًا استخدام `openai/gpt-image-2`. وإذا كان
ملف تعريف OAuth لـ `openai-codex` مُعدًا، يعيد OpenClaw استخدام ملف تعريف OAuth نفسه
المستخدم مع نماذج Chat ذات اشتراك Codex ويرسل طلب الصورة
عبر الواجهة الخلفية Codex Responses. كما تُحوَّل Base URL القديمة الخاصة بـ Codex مثل
`https://chatgpt.com/backend-api` إلى الصيغة القياسية
`https://chatgpt.com/backend-api/codex` لطلبات الصور. وهو لا
يعود بصمت إلى `OPENAI_API_KEY` لهذا الطلب. ولإجبار توجيه OpenAI
Images API المباشر، قم بإعداد `models.providers.openai` صراحةً باستخدام مفتاح API،
أو `baseUrl` مخصص، أو نقطة نهاية Azure. وما يزال يمكن اختيار النموذج الأقدم
`openai/gpt-image-1` صراحةً، لكن الطلبات الجديدة الخاصة بإنشاء الصور
وتحريرها في OpenAI يجب أن تستخدم `gpt-image-2`.

يدعم `gpt-image-2` كلاً من إنشاء الصور من النص وتحرير الصور المرجعية
من خلال الأداة نفسها `image_generate`. ويمرر OpenClaw `prompt`،
و`count`، و`size`، و`quality`، و`outputFormat`، والصور المرجعية إلى OpenAI.
ولا تتلقى OpenAI قيم `aspectRatio` أو `resolution` مباشرة؛ وعندما يكون ذلك ممكنًا
يحوّلها OpenClaw إلى `size` مدعوم، وإلا تبلغ الأداة عنها على أنها
تجاوزات تم تجاهلها.

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

تقبل `openai.background` القيم `transparent` أو `opaque` أو `auto`؛ وتتطلب
المخرجات الشفافة أن يكون `outputFormat` هو `png` أو `webp`. وتنطبق
`openai.outputCompression` على مخرجات JPEG/WebP.

أنشئ صورة أفقية واحدة بدقة 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="ملصق تحريري نظيف لإنشاء الصور في OpenClaw" size=3840x2160 count=1
```

أنشئ صورتين مربعتين:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="اتجاهان بصريان لأيقونة تطبيق إنتاجية هادئة" size=1024x1024 count=2
```

حرّر صورة مرجعية محلية واحدة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="حافظ على العنصر الأساسي، واستبدل الخلفية بإعداد استوديو ساطع" image=/path/to/reference.png size=1024x1536
```

حرّر باستخدام مراجع متعددة:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="ادمج هوية الشخصية من الصورة الأولى مع لوحة الألوان من الصورة الثانية" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

لتوجيه إنشاء الصور في OpenAI عبر deployment في Azure OpenAI بدلًا من
`api.openai.com`، راجع [نقاط نهاية Azure OpenAI](/ar/providers/openai#azure-openai-endpoints)
في مستندات موفّر OpenAI.

يتوفر إنشاء الصور في MiniMax عبر مساري مصادقة MiniMax المضمّنين كليهما:

- `minimax/image-01` لإعدادات مفتاح API
- `minimax-portal/image-01` لإعدادات OAuth

## إمكانات الموفّر

| الإمكانة             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| -------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| الإنشاء              | نعم (حتى 4)          | نعم (حتى 4)          | نعم (حتى 4)         | نعم (حتى 9)                | نعم (مخرجات يحددها workflow)       | نعم (1) | نعم (حتى 4)          |
| التحرير/المرجع       | نعم (حتى 5 صور)      | نعم (حتى 5 صور)      | نعم (صورة واحدة)    | نعم (صورة واحدة، مرجع موضوع) | نعم (صورة واحدة، وفق إعداد workflow) | لا      | نعم (حتى 5 صور)      |
| التحكم في الحجم      | نعم (حتى 4K)         | نعم                  | نعم                 | لا                         | لا                                 | لا      | لا                   |
| نسبة الأبعاد         | لا                   | نعم                  | نعم (للإنشاء فقط)   | نعم                        | لا                                 | لا      | نعم                  |
| الدقة (1K/2K/4K)     | لا                   | نعم                  | نعم                 | لا                         | لا                                 | لا      | نعم (1K/2K)          |

### xAI `grok-imagine-image`

يستخدم موفّر xAI المضمّن `/v1/images/generations` للطلبات المعتمدة على المطالبة فقط،
ويستخدم `/v1/images/edits` عندما تكون `image` أو `images` موجودة.

- النماذج: `xai/grok-imagine-image` و`xai/grok-imagine-image-pro`
- العدد: حتى 4
- المراجع: `image` واحدة أو حتى خمس `images`
- نسب الأبعاد: `1:1` و`16:9` و`9:16` و`4:3` و`3:4` و`2:3` و`3:2`
- الدقات: `1K` و`2K`
- المخرجات: تُعاد كمرفقات صور مُدارة بواسطة OpenClaw

لا يعرّض OpenClaw عمدًا القيم الأصلية الخاصة بـ xAI مثل `quality` أو `mask` أو `user` أو
نسب الأبعاد الإضافية الخاصة بها فقط إلى أن تتوفر هذه الضوابط في عقد
`image_generate` المشترك عبر الموفّرين.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات agent المتاحة
- [fal](/ar/providers/fal) — إعداد موفّر الصور والفيديو fal
- [ComfyUI](/ar/providers/comfy) — إعداد ComfyUI المحلي وComfy Cloud workflow
- [Google (Gemini)](/ar/providers/google) — إعداد موفّر صور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد موفّر صور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد موفّر OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) — إعداد صور Grok والفيديو والبحث وتنفيذ الشيفرة وTTS
- [مرجع الإعدادات](/ar/gateway/config-agents#agent-defaults) — إعداد `imageGenerationModel`
- [النماذج](/ar/concepts/models) — إعداد النماذج وسلوك الرجوع الاحتياطي
