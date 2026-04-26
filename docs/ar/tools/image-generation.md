---
read_when:
    - إنشاء الصور أو تعديلها عبر الوكيل
    - تكوين موفري إنشاء الصور والنماذج
    - فهم معلمات أداة `image_generate`
sidebarTitle: Image generation
summary: أنشئ الصور وعدّلها عبر image_generate باستخدام OpenAI وGoogle وfal وMiniMax وComfyUI وOpenRouter وLiteLLM وxAI وVydra
title: إنشاء الصور
x-i18n:
    generated_at: "2026-04-26T11:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

تتيح أداة `image_generate` للوكيل إنشاء الصور وتعديلها باستخدام الموفّرين
الذين قمت بتكوينهم. يتم تسليم الصور المُنشأة تلقائيًا كمرفقات وسائط
في رد الوكيل.

<Note>
لا تظهر الأداة إلا عندما يكون هناك موفّر واحد على الأقل
متاحًا لإنشاء الصور. إذا كنت لا ترى `image_generate` ضمن أدوات وكيلك،
فقم بتكوين `agents.defaults.imageGenerationModel`، وإعداد مفتاح API للموفّر،
أو سجّل الدخول باستخدام OpenAI Codex OAuth.
</Note>

## البدء السريع

<Steps>
  <Step title="تكوين المصادقة">
    عيّن مفتاح API لموفّر واحد على الأقل (مثل `OPENAI_API_KEY`،
    أو `GEMINI_API_KEY`، أو `OPENROUTER_API_KEY`) أو سجّل الدخول باستخدام OpenAI Codex OAuth.
  </Step>
  <Step title="اختر نموذجًا افتراضيًا (اختياري)">
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

    يستخدم Codex OAuth مرجع النموذج نفسه `openai/gpt-image-2`. عندما يكون
    ملف تعريف OAuth من `openai-codex` مكوّنًا، يوجّه OpenClaw طلبات
    الصور عبر ملف تعريف OAuth هذا بدلًا من محاولة استخدام
    `OPENAI_API_KEY` أولًا. يؤدّي تكوين `models.providers.openai` الصريح (مفتاح API،
    أو `baseUrl` مخصّص/Azure) إلى العودة لاستخدام
    المسار المباشر لـ OpenAI Images API.

  </Step>
  <Step title="اطلب من الوكيل">
    _"أنشئ صورة لتميمة روبوت ودودة."_

    يستدعي الوكيل `image_generate` تلقائيًا. لا حاجة إلى
    قائمة سماح للأداة — فهي مفعّلة افتراضيًا عندما يكون الموفّر متاحًا.

  </Step>
</Steps>

<Warning>
بالنسبة إلى نقاط نهاية LAN المتوافقة مع OpenAI مثل LocalAI، احتفظ
بـ `models.providers.openai.baseUrl` المخصّص وقم بالاشتراك صراحةً عبر
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. تظل نقاط
نهاية الصور الخاصة والداخلية محظورة افتراضيًا.
</Warning>

## المسارات الشائعة

| الهدف | مرجع النموذج | المصادقة |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| إنشاء الصور عبر OpenAI مع احتساب الفوترة عبر API | `openai/gpt-image-2` | `OPENAI_API_KEY` |
| إنشاء الصور عبر OpenAI باستخدام مصادقة اشتراك Codex | `openai/gpt-image-2` | OpenAI Codex OAuth |
| صور OpenAI PNG/WebP بخلفية شفافة | `openai/gpt-image-1.5` | `OPENAI_API_KEY` أو OpenAI Codex OAuth |
| إنشاء الصور عبر OpenRouter | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY` |
| إنشاء الصور عبر LiteLLM | `litellm/gpt-image-2` | `LITELLM_API_KEY` |
| إنشاء الصور عبر Google Gemini | `google/gemini-3.1-flash-image-preview` | `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

تعالج أداة `image_generate` نفسها كلًا من تحويل النص إلى صورة
وتعديل الصور المرجعية. استخدم `image` لمرجع واحد أو `images` لمراجع متعددة.
تُمرَّر تلميحات الإخراج المدعومة من الموفّر مثل `quality` و`outputFormat` و`background`
عند توفّرها، ويُبلّغ عنها على أنها متجاهلة عندما لا يدعمها الموفّر.
يقتصر الدعم المضمّن للخلفية الشفافة على OpenAI؛ وقد تحتفظ موفّرات أخرى
بقناة ألفا في PNG إذا كانت الواجهة الخلفية الخاصة بها تُنتج ذلك.

## الموفّرون المدعومون

| الموفّر | النموذج الافتراضي | دعم التعديل | المصادقة |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | نعم (صورة واحدة، وفق إعداد سير العمل) | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` للسحابة |
| fal        | `fal-ai/flux/dev`                       | نعم | `FAL_KEY` |
| Google     | `gemini-3.1-flash-image-preview`        | نعم | `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |
| LiteLLM    | `gpt-image-2`                           | نعم (حتى 5 صور إدخال) | `LITELLM_API_KEY` |
| MiniMax    | `image-01`                              | نعم (مرجع موضوع) | `MINIMAX_API_KEY` أو MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | نعم (حتى 4 صور) | `OPENAI_API_KEY` أو OpenAI Codex OAuth |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | نعم (حتى 5 صور إدخال) | `OPENROUTER_API_KEY` |
| Vydra      | `grok-imagine`                          | لا | `VYDRA_API_KEY` |
| xAI        | `grok-imagine-image`                    | نعم (حتى 5 صور) | `XAI_API_KEY` |

استخدم `action: "list"` لفحص الموفّرين والنماذج المتاحة أثناء التشغيل:

```text
/tool image_generate action=list
```

## إمكانات الموفّر

| الإمكانية | ComfyUI | fal | Google | MiniMax | OpenAI | Vydra | xAI |
| --------------------- | ------------------ | ----------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| الإنشاء (العدد الأقصى) | يحدده سير العمل | 4 | 4 | 9 | 4 | 1 | 4 |
| التعديل / المرجع | صورة واحدة (سير العمل) | صورة واحدة | حتى 5 صور | صورة واحدة (مرجع موضوع) | حتى 5 صور | — | حتى 5 صور |
| التحكم في الحجم | — | ✓ | ✓ | — | حتى 4K | — | — |
| نسبة الأبعاد | — | ✓ (للإنشاء فقط) | ✓ | ✓ | — | — | ✓ |
| الدقة (1K/2K/4K) | — | ✓ | ✓ | — | — | — | 1K، 2K |

## معلمات الأداة

<ParamField path="prompt" type="string" required>
  موجّه إنشاء الصورة. مطلوب لـ `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  استخدم `"list"` لفحص الموفّرين والنماذج المتاحة أثناء التشغيل.
</ParamField>
<ParamField path="model" type="string">
  تجاوز الموفّر/النموذج (مثل `openai/gpt-image-2`). استخدم
  `openai/gpt-image-1.5` لخلفيات OpenAI الشفافة.
</ParamField>
<ParamField path="image" type="string">
  مسار صورة مرجعية واحدة أو عنوان URL لوضع التعديل.
</ParamField>
<ParamField path="images" type="string[]">
  صور مرجعية متعددة لوضع التعديل (حتى 5 لدى الموفّرين الداعمين).
</ParamField>
<ParamField path="size" type="string">
  تلميح الحجم: `1024x1024`، `1536x1024`، `1024x1536`، `2048x2048`، `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  نسبة الأبعاد: `1:1`، `2:3`، `3:2`، `3:4`، `4:3`، `4:5`، `5:4`، `9:16`، `16:9`، `21:9`.
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
  `outputFormat: "png"` أو `"webp"` مع الموفّرين القادرين على الشفافية.
</ParamField>
<ParamField path="count" type="number">عدد الصور المطلوب إنشاؤها (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">مهلة زمنية اختيارية لطلب الموفّر بالمللي ثانية.</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="openai" type="object">
  تلميحات خاصة بـ OpenAI: ‏`background` و`moderation` و`outputCompression` و`user`.
</ParamField>

<Note>
لا تدعم كل الموفّرات جميع المعلمات. عندما يدعم موفّر احتياطي
خيارًا هندسيًا قريبًا بدلًا من الخيار المطلوب حرفيًا، يعيد OpenClaw
تعيين الطلب إلى أقرب حجم أو نسبة أبعاد أو دقة مدعومة قبل الإرسال.
تُسقَط تلميحات الإخراج غير المدعومة لدى الموفّرين الذين لا يعلنون
دعمها ويُبلّغ عنها في نتيجة الأداة. تعرض نتائج الأداة
الإعدادات المُطبّقة؛ ويلتقط `details.normalization` أي
تحويل من المطلوب إلى المُطبّق.
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

### ترتيب اختيار الموفّر

يجرّب OpenClaw الموفّرين بهذا الترتيب:

1. **المعلمة `model`** من استدعاء الأداة (إذا حدّد الوكيل واحدة).
2. **`imageGenerationModel.primary`** من الإعدادات.
3. **`imageGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** — الإعدادات الافتراضية للموفّر المدعومة بالمصادقة فقط:
   - الموفّر الافتراضي الحالي أولًا؛
   - ثم بقية موفّري إنشاء الصور المسجّلين بترتيب معرّف الموفّر.

إذا فشل موفّر ما (خطأ مصادقة، أو حد معدل، إلخ)، تتم تجربة
المرشح التالي المكوَّن تلقائيًا. إذا فشل الجميع، يتضمن الخطأ تفاصيل
كل محاولة.

<AccordionGroup>
  <Accordion title="تجاوزات النموذج لكل استدعاء تكون دقيقة">
    تحاول قيمة `model` المتجاوزة لكل استدعاء هذا الموفّر/النموذج فقط
    ولا تتابع إلى الموفّرين الافتراضيين/الاحتياطيين المكوّنين أو الموفّرين المكتشفين تلقائيًا.
  </Accordion>
  <Accordion title="الاكتشاف التلقائي واعٍ بالمصادقة">
    لا يدخل الإعداد الافتراضي للموفّر إلى قائمة المرشحين إلا عندما يستطيع OpenClaw
    بالفعل مصادقة هذا الموفّر. عيّن
    `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
    إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.
  </Accordion>
  <Accordion title="المهل الزمنية">
    عيّن `agents.defaults.imageGenerationModel.timeoutMs` لواجهات
    إنشاء الصور البطيئة. تتجاوز معلمة الأداة `timeoutMs` لكل استدعاء
    القيمة الافتراضية المكوّنة.
  </Accordion>
  <Accordion title="الفحص أثناء التشغيل">
    استخدم `action: "list"` لفحص الموفّرين المسجّلين حاليًا،
    ونماذجهم الافتراضية، وتلميحات متغيّرات البيئة الخاصة بالمصادقة.
  </Accordion>
</AccordionGroup>

### تعديل الصور

تدعم OpenAI وOpenRouter وGoogle وfal وMiniMax وComfyUI وxAI
تعديل الصور المرجعية. مرّر مسار صورة مرجعية أو عنوان URL:

```text
"أنشئ نسخة بألوان مائية من هذه الصورة" + image: "/path/to/photo.jpg"
```

تدعم OpenAI وOpenRouter وGoogle وxAI حتى 5 صور مرجعية عبر
المعلمة `images`. بينما تدعم fal وMiniMax وComfyUI صورة واحدة.

## تفاصيل الموفّرين

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (و gpt-image-1.5)">
    يستخدم إنشاء الصور في OpenAI افتراضيًا `openai/gpt-image-2`. إذا كان
    ملف تعريف OAuth من `openai-codex` مكوّنًا، يعيد OpenClaw استخدام
    ملف تعريف OAuth نفسه الذي يستخدمه Codex في نماذج الدردشة بالاشتراك ويرسل
    طلب الصورة عبر الواجهة الخلفية Codex Responses. تُحوَّل عناوين
    Codex الأساسية القديمة مثل `https://chatgpt.com/backend-api` إلى
    `https://chatgpt.com/backend-api/codex` لطلبات الصور. لا يقوم OpenClaw
    **بأي** رجوع صامت إلى `OPENAI_API_KEY` لهذا الطلب —
    ولإجبار التوجيه المباشر إلى OpenAI Images API، قم بتكوين
    `models.providers.openai` صراحةً باستخدام مفتاح API أو عنوان أساسي مخصّص
    أو نقطة نهاية Azure.

    لا يزال بالإمكان اختيار النماذج `openai/gpt-image-1.5` و`openai/gpt-image-1` و
`openai/gpt-image-1-mini` صراحةً. استخدم
`gpt-image-1.5` لإخراج PNG/WebP بخلفية شفافة؛ إذ ترفض واجهة API الحالية لـ
`gpt-image-2` القيمة `background: "transparent"`.

يدعم `gpt-image-2` كلًا من إنشاء الصور من النص
وتعديل الصور المرجعية عبر أداة `image_generate` نفسها.
يمرّر OpenClaw القيم `prompt` و`count` و`size` و`quality` و`outputFormat`
والصور المرجعية إلى OpenAI. لا تستقبل OpenAI
`aspectRatio` أو `resolution` مباشرةً؛ وعند الإمكان يقوم OpenClaw
بربطهما بقيمة `size` مدعومة، وإلا تُبلّغ الأداة عنهما
كتجاوزات تم تجاهلها.

توجد الخيارات الخاصة بـ OpenAI تحت الكائن `openai`:

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

تقبل `openai.background` القيم `transparent` أو `opaque` أو `auto`؛
وتتطلب المخرجات الشفافة أن تكون قيمة `outputFormat` هي `png` أو `webp`
وأن يكون نموذج صور OpenAI قادرًا على الشفافية. يوجّه OpenClaw طلبات
الخلفية الشفافة الافتراضية لـ `gpt-image-2` إلى `gpt-image-1.5`.
وتنطبق `openai.outputCompression` على مخرجات JPEG/WebP.

يعدّ التلميح `background` على المستوى الأعلى محايدًا بالنسبة إلى الموفّر، ويُربط حاليًا
بحقل طلب OpenAI نفسه `background` عند اختيار موفّر OpenAI.
أما الموفّرون الذين لا يعلنون دعم الخلفية فيُعيدون هذه القيمة
ضمن `ignoredOverrides` بدلًا من استلام المعلمة غير المدعومة.

لتوجيه إنشاء الصور في OpenAI عبر عملية نشر Azure OpenAI
بدلًا من `api.openai.com`، راجع
[Azure OpenAI endpoints](/ar/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="نماذج الصور في OpenRouter">
    يستخدم إنشاء الصور في OpenRouter مفتاح `OPENROUTER_API_KEY` نفسه
    ويوجَّه عبر واجهة API الخاصة بالصور في chat completions لدى OpenRouter. اختر
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

    يمرّر OpenClaw القيم `prompt` و`count` والصور المرجعية
    وتلميحات `aspectRatio` / `resolution` المتوافقة مع Gemini إلى OpenRouter.
    تتضمن اختصارات نماذج الصور المضمّنة الحالية في OpenRouter
    `google/gemini-3.1-flash-image-preview`،
    و`google/gemini-3-pro-image-preview`، و`openai/gpt-5.4-image-2`. استخدم
    `action: "list"` لمعرفة ما الذي يوفّره الـ Plugin المكوَّن لديك.

  </Accordion>
  <Accordion title="المصادقة المزدوجة في MiniMax">
    يتوفر إنشاء الصور في MiniMax عبر مساري المصادقة المضمّنين
    في MiniMax:

    - `minimax/image-01` لإعدادات مفتاح API
    - `minimax-portal/image-01` لإعدادات OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    يستخدم موفّر xAI المضمّن المسار `/v1/images/generations` للطلبات
    المعتمدة على الموجّه فقط، ويستخدم `/v1/images/edits` عندما تكون
    `image` أو `images` موجودة.

    - النماذج: `xai/grok-imagine-image`، `xai/grok-imagine-image-pro`
    - العدد: حتى 4
    - المراجع: `image` واحدة أو حتى خمس `images`
    - نسب الأبعاد: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `2:3`، `3:2`
    - الدقات: `1K`، `2K`
    - المخرجات: تُعاد كمرفقات صور مُدارة من OpenClaw

    يتعمد OpenClaw عدم إظهار عناصر التحكم الأصلية الخاصة بـ xAI مثل `quality` و`mask` و
    `user` أو نسب الأبعاد الإضافية الأصلية فقط إلى أن تتوفر هذه العناصر
    في العقد المشترك بين الموفّرين لأداة `image_generate`.

  </Accordion>
</AccordionGroup>

## أمثلة

<Tabs>
  <Tab title="إنشاء (أفقي 4K)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="إنشاء (PNG شفاف)">
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
</Tabs>

تتوفر أيضًا العلامتان `--output-format` و`--background` على
`openclaw infer image edit`؛ وتبقى `--openai-background` كاسم مستعار
خاص بـ OpenAI. لا تعلن الموفّرات المضمّنة الأخرى غير OpenAI
عن دعم صريح للتحكم في الخلفية حاليًا، لذلك يتم الإبلاغ عن `background: "transparent"`
على أنه تم تجاهله بالنسبة لها.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [ComfyUI](/ar/providers/comfy) — إعداد سير عمل ComfyUI المحلي وComfy Cloud
- [fal](/ar/providers/fal) — إعداد موفّر الصور والفيديو fal
- [Google (Gemini)](/ar/providers/google) — إعداد موفّر الصور Gemini
- [MiniMax](/ar/providers/minimax) — إعداد موفّر الصور MiniMax
- [OpenAI](/ar/providers/openai) — إعداد موفّر OpenAI Images
- [Vydra](/ar/providers/vydra) — إعداد الصور والفيديو والكلام في Vydra
- [xAI](/ar/providers/xai) — إعداد صور وفيديو وبحث وتنفيذ كود وTTS في Grok
- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults) — إعداد `imageGenerationModel`
- [النماذج](/ar/concepts/models) — تكوين النماذج والتبديل الاحتياطي
