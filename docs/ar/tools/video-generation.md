---
read_when:
    - توليد مقاطع الفيديو عبر الوكيل
    - تهيئة مزوّدي ونماذج توليد الفيديو
    - فهم معاملات أداة video_generate
sidebarTitle: Video generation
summary: أنشئ مقاطع فيديو عبر video_generate من مراجع نصية أو صورية أو مرئية عبر 16 واجهة خلفية لمزوّدي الخدمة
title: توليد الفيديو
x-i18n:
    generated_at: "2026-04-30T08:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91409057210af560d389513c2049d643c3e1602df51aa9825ceb01571626cdf
    source_path: tools/video-generation.md
    workflow: 16
---

يمكن لوكلاء OpenClaw إنشاء مقاطع فيديو من مطالبات نصية أو صور مرجعية أو
مقاطع فيديو موجودة. تُدعَم ست عشرة خلفية لمزوّدين، ولكل منها
خيارات نماذج وأوضاع إدخال ومجموعات ميزات مختلفة. يختار الوكيل
المزوّد المناسب تلقائيًا بناءً على إعداداتك ومفاتيح API المتاحة.

<Note>
لا تظهر أداة `video_generate` إلا عند توفر مزوّد واحد على الأقل لتوليد
الفيديو. إذا لم ترها ضمن أدوات وكيلك، فاضبط مفتاح API لمزوّد أو هيّئ
`agents.defaults.videoGenerationModel`.
</Note>

يتعامل OpenClaw مع توليد الفيديو على أنه ثلاثة أوضاع تشغيل:

- `generate` — طلبات تحويل النص إلى فيديو دون وسائط مرجعية.
- `imageToVideo` — يتضمن الطلب صورة مرجعية واحدة أو أكثر.
- `videoToVideo` — يتضمن الطلب مقطع فيديو مرجعيًا واحدًا أو أكثر.

يمكن للمزوّدين دعم أي مجموعة فرعية من هذه الأوضاع. تتحقق الأداة من
الوضع النشط قبل الإرسال وتعرض الأوضاع المدعومة في `action=list`.

## البدء السريع

<Steps>
  <Step title="إعداد المصادقة">
    اضبط مفتاح API لأي مزوّد مدعوم:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="اختيار نموذج افتراضي (اختياري)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="اطلب من الوكيل">
    > أنشئ فيديو سينمائيًا مدته 5 ثوانٍ لكركند ودود يتزلج على الأمواج عند الغروب.

    يستدعي الوكيل `video_generate` تلقائيًا. لا حاجة إلى إدراج الأداة
    في قائمة السماح.

  </Step>
</Steps>

## كيف يعمل التوليد غير المتزامن

توليد الفيديو غير متزامن. عندما يستدعي الوكيل `video_generate` في
جلسة:

1. يرسل OpenClaw الطلب إلى المزوّد ويعيد فورًا معرّف مهمة.
2. يعالج المزوّد المهمة في الخلفية (عادةً من 30 ثانية إلى 5 دقائق بحسب المزوّد والدقة).
3. عندما يصبح الفيديو جاهزًا، يوقظ OpenClaw الجلسة نفسها بحدث إكمال داخلي.
4. ينشر الوكيل الفيديو النهائي مرة أخرى في المحادثة الأصلية.

أثناء تنفيذ مهمة، تعيد استدعاءات `video_generate` المكررة في الجلسة
نفسها حالة المهمة الحالية بدلًا من بدء توليد آخر. استخدم `openclaw tasks list` أو `openclaw tasks show <taskId>` للتحقق من التقدم من
CLI.

خارج تشغيلات الوكيل المدعومة بجلسة (على سبيل المثال، استدعاءات الأداة المباشرة)،
تعود الأداة إلى التوليد المضمّن وتعيد مسار الوسائط النهائي
في نفس الدور.

تُحفظ ملفات الفيديو المولدة ضمن تخزين الوسائط المُدار بواسطة OpenClaw عندما
يعيد المزوّد بايتات. يتبع حد الحفظ الافتراضي للفيديو المولد
حد وسائط الفيديو، ويرفعه `agents.defaults.mediaMaxMb` للتصييرات
الأكبر. عندما يعيد المزوّد أيضًا عنوان URL لمخرج مستضاف، يمكن لـ OpenClaw
تسليم ذلك العنوان بدلًا من فشل المهمة إذا رفضت الاستدامة المحلية
ملفًا زائد الحجم.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | أُنشئت المهمة، وتنتظر قبول المزوّد لها.                                             |
| `running`   | يعالج المزوّد المهمة (عادةً من 30 ثانية إلى 5 دقائق بحسب المزوّد والدقة). |
| `succeeded` | الفيديو جاهز؛ يستيقظ الوكيل وينشره في المحادثة.                                   |
| `failed`    | خطأ من المزوّد أو انتهاء مهلة؛ يستيقظ الوكيل مع تفاصيل الخطأ.                                   |

تحقق من الحالة من CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

إذا كانت مهمة فيديو بالفعل `queued` أو `running` للجلسة الحالية،
يعيد `video_generate` حالة المهمة الموجودة بدلًا من بدء مهمة جديدة.
استخدم `action: "status"` للتحقق صراحةً دون تشغيل توليد جديد.

## المزوّدون المدعومون

| المزوّد              | النموذج الافتراضي                   | النص | مرجع الصورة                                            | مرجع الفيديو                                       | المصادقة                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | حتى صورتين (نماذج I2V فقط؛ الإطار الأول + الأخير) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | حتى صورتين (الإطار الأول + الأخير عبر الدور)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | حتى 9 صور مرجعية                             | حتى 3 مقاطع فيديو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | صورة واحدة                                              | —                                               | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | صورة واحدة؛ حتى 9 مع تحويل مرجع Seedance إلى فيديو    | حتى 3 مقاطع فيديو مع تحويل مرجع Seedance إلى فيديو | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | صورة واحدة                                              | —                                               | `MINIMAX_API_KEY` أو MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | حتى 4 صور (الإطار الأول/الأخير أو مراجع)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | صورة واحدة                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | صورة واحدة (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | صورة إطار أولى واحدة أو حتى 7 `reference_image`s    | فيديو واحد                                         | `XAI_API_KEY`                            |

يقبل بعض المزوّدين متغيرات بيئة إضافية أو بديلة لمفاتيح API. راجع
[صفحات المزوّدين](#related) الفردية للتفاصيل.

شغّل `video_generate action=list` لفحص المزوّدين والنماذج وأوضاع
التشغيل المتاحة في وقت التشغيل.

### مصفوفة القدرات

عقد الأوضاع الصريح الذي تستخدمه `video_generate` واختبارات العقود
والمسح الحي المشترك:

| المزوّد   | `generate` | `imageToVideo` | `videoToVideo` | مسارات الاختبار الحية المشتركة اليوم                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`؛ يتم تخطي `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين URL بعيدة لفيديوهات `http(s)`                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | غير موجود في المسح المشترك؛ تغطية سير العمل المحددة تعيش مع اختبارات Comfy                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`؛ مخططات فيديو DeepInfra الأصلية هي تحويل نص إلى فيديو في العقد المضمّن                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`؛ `videoToVideo` فقط عند استخدام تحويل مرجع Seedance إلى فيديو                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`؛ يتم تخطي `videoToVideo` المشترك لأن مسح Gemini/Veo الحالي المدعوم بالمخزن المؤقت لا يقبل ذلك الإدخال  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`؛ يتم تخطي `videoToVideo` المشترك لأن مسار هذه المؤسسة/الإدخال يحتاج حاليًا إلى وصول inpaint/remix من جهة المزوّد |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`؛ يتم تخطي `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين URL بعيدة لفيديوهات `http(s)`                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`؛ يعمل `videoToVideo` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`, `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`؛ يتم تخطي `imageToVideo` المشترك لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`, `imageToVideo`؛ يتم تخطي `videoToVideo` لأن هذا المزوّد يحتاج حاليًا إلى عنوان URL بعيد لملف MP4                                |

## معلمات الأداة

### مطلوبة

<ParamField path="prompt" type="string" required>
  وصف نصي للفيديو المراد توليده. مطلوب لـ `action: "generate"`.
</ParamField>

### مدخلات المحتوى

<ParamField path="image" type="string">صورة مرجعية واحدة (مسار أو URL).</ParamField>
<ParamField path="images" type="string[]">صور مرجعية متعددة (حتى 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، بالتوازي مع قائمة الصور المدمجة.
القيم القياسية: `first_frame`، `last_frame`، `reference_image`.
</ParamField>
<ParamField path="video" type="string">فيديو مرجعي واحد (مسار أو URL).</ParamField>
<ParamField path="videos" type="string[]">فيديوهات مرجعية متعددة (حتى 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، بالتوازي مع قائمة الفيديو المدمجة.
القيمة القياسية: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
صوت مرجعي واحد (مسار أو URL). يُستخدم للموسيقى الخلفية أو كمرجع صوتي
عندما يدعم المزوّد مدخلات الصوت.
</ParamField>
<ParamField path="audioRefs" type="string[]">مقاطع صوت مرجعية متعددة (حتى 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، بالتوازي مع قائمة الصوت المدمجة.
القيمة القياسية: `reference_audio`.
</ParamField>

<Note>
تُمرَّر تلميحات الأدوار إلى المزوّد كما هي. تأتي القيم القياسية من
اتحاد `VideoGenerationAssetRole`، لكن قد تقبل المزوّدات سلاسل أدوار إضافية.
يجب ألا تحتوي مصفوفات `*Roles` على إدخالات أكثر من قائمة المراجع
المقابلة؛ تفشل أخطاء فرق الموضع الواحد برسالة واضحة.
استخدم سلسلة فارغة لترك خانة غير مضبوطة. بالنسبة إلى xAI، اضبط كل دور صورة على
`reference_image` لاستخدام وضع التوليد `reference_images` الخاص به؛ احذف
الدور أو استخدم `first_frame` لتحويل صورة واحدة إلى فيديو.
</Note>

### عناصر التحكم في النمط

<ParamField path="aspectRatio" type="string">
  `1:1`، `2:3`، `3:2`، `3:4`، `4:3`، `4:5`، `5:4`، `9:16`، `16:9`، `21:9`، أو `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`، `720P`، `768P`، أو `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني (تُقرَّب إلى أقرب قيمة يدعمها المزوّد).
</ParamField>
<ParamField path="size" type="string">تلميح الحجم عندما يدعمه المزوّد.</ParamField>
<ParamField path="audio" type="boolean">
  فعّل الصوت المولّد في المخرج عند دعمه. يختلف عن `audioRef*` (مدخلات).
</ParamField>
<ParamField path="watermark" type="boolean">بدّل وضع العلامة المائية للمزوّد عند دعمها.</ParamField>

`adaptive` قيمة حارسة خاصة بالمزوّد: تُمرَّر كما هي إلى
المزوّدات التي تعلن `adaptive` ضمن قدراتها (مثل BytePlus
Seedance التي تستخدمها لاكتشاف النسبة تلقائيًا من أبعاد صورة الإدخال).
المزوّدات التي لا تعلنها تعرض القيمة عبر
`details.ignoredOverrides` في نتيجة الأداة بحيث يكون إسقاطها مرئيًا.

### متقدم

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` المزوّدات.
</ParamField>
<ParamField path="model" type="string">تجاوز المزوّد/النموذج (مثل `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لطلب المزوّد بالمللي ثانية.</ParamField>
<ParamField path="providerOptions" type="object">
  خيارات خاصة بالمزوّد ككائن JSON (مثل `{"seed": 42, "draft": true}`).
  تتحقق المزوّدات التي تعلن مخططًا ذا أنواع من المفاتيح والأنواع؛ وتتسبب
  المفاتيح غير المعروفة أو حالات عدم التطابق في تخطي المرشح أثناء الرجوع الاحتياطي.
  تتلقى المزوّدات التي لا تعلن مخططًا الخيارات كما هي. شغّل `video_generate action=list`
  لمعرفة ما يقبله كل مزوّد.
</ParamField>

<Note>
لا تدعم كل المزوّدات جميع المعلمات. يطبّع OpenClaw المدة إلى
أقرب قيمة يدعمها المزوّد، ويعيد تعيين تلميحات الهندسة المترجمة
مثل الحجم إلى نسبة العرض إلى الارتفاع عندما يوفّر مزوّد احتياطي
سطح تحكم مختلفًا. تُتجاهل التجاوزات غير المدعومة فعليًا على أساس بذل أفضل جهد
وتُبلّغ كتحذيرات في نتيجة الأداة. تفشل حدود القدرات الصارمة
(مثل كثرة المدخلات المرجعية) قبل الإرسال. تبلّغ نتائج الأداة
الإعدادات المطبقة؛ ويلتقط `details.normalization` أي ترجمة
من المطلوب إلى المطبق.
</Note>

تحدد مدخلات المراجع وضع وقت التشغيل:

- لا توجد وسائط مرجعية → `generate`
- أي مرجع صورة → `imageToVideo`
- أي مرجع فيديو → `videoToVideo`
- مدخلات الصوت المرجعية **لا** تغيّر الوضع المحسوم؛ بل تُطبَّق فوق
  أي وضع تختاره مراجع الصور/الفيديو، ولا تعمل إلا
  مع المزوّدات التي تعلن `maxInputAudios`.

ليست مراجع الصور والفيديو المختلطة سطح قدرات مشتركة مستقرًا.
فضّل نوع مرجع واحدًا لكل طلب.

#### الرجوع الاحتياطي والخيارات ذات الأنواع

تُطبَّق بعض فحوصات القدرات في طبقة الرجوع الاحتياطي بدلًا من
حدود الأداة، لذلك يمكن لطلب يتجاوز حدود المزوّد الأساسي
أن يظل قابلًا للتشغيل على مزوّد احتياطي قادر:

- يُتخطى المرشح النشط الذي لا يعلن `maxInputAudios` (أو يعلن `0`) عندما
  يحتوي الطلب على مراجع صوتية؛ ثم يُجرّب المرشح التالي.
- يُتخطى إذا كانت قيمة `maxDurationSeconds` للمرشح النشط أقل من `durationSeconds`
  المطلوبة مع عدم وجود قائمة `supportedDurationSeconds` معلنة.
- إذا احتوى الطلب على `providerOptions` وكان المرشح النشط يعلن صراحة
  مخطط `providerOptions` ذا أنواع، يُتخطى إذا كانت المفاتيح المقدمة
  غير موجودة في المخطط أو كانت أنواع القيم غير مطابقة. تتلقى المزوّدات التي لا
  تعلن مخططًا الخيارات كما هي (تمرير متوافق مع الإصدارات السابقة).
  يمكن للمزوّد تعطيل كل خيارات المزوّد عبر
  إعلان مخطط فارغ (`capabilities.providerOptions: {}`)، مما
  يسبب التخطي نفسه كما في عدم تطابق النوع.

يُسجَّل سبب التخطي الأول في الطلب عند مستوى `warn` لكي يرى المشغّلون متى
تم تجاوز مزوّدهم الأساسي؛ وتُسجَّل حالات التخطي اللاحقة عند مستوى `debug`
لإبقاء سلاسل الرجوع الاحتياطي الطويلة هادئة. إذا تم تخطي كل مرشح،
يتضمن الخطأ المجمّع سبب التخطي لكل واحد.

## الإجراءات

| الإجراء    | ما يفعله                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | الافتراضي. أنشئ فيديو من الموجّه المحدد ومدخلات المراجع الاختيارية.                                      |
| `status`   | تحقق من حالة مهمة الفيديو الجارية للجلسة الحالية من دون بدء عملية توليد أخرى.                          |
| `list`     | اعرض المزوّدات والنماذج وقدراتها المتاحة.                                                               |

## اختيار النموذج

يحل OpenClaw النموذج بهذا الترتيب:

1. **معلمة الأداة `model`** — إذا حدد الوكيل واحدة في الاستدعاء.
2. **`videoGenerationModel.primary`** من الإعدادات.
3. **`videoGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** — المزوّدات التي لديها مصادقة صالحة، بدءًا من
   المزوّد الافتراضي الحالي، ثم المزوّدات المتبقية بالترتيب الأبجدي.

إذا فشل مزوّد، تُجرَّب المرشح التالي تلقائيًا. إذا فشل كل
المرشحين، يتضمن الخطأ تفاصيل من كل محاولة.

اضبط `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## ملاحظات المزوّدين

<AccordionGroup>
  <Accordion title="Alibaba">
    يستخدم نقطة نهاية DashScope / Model Studio غير المتزامنة. يجب أن تكون الصور
    والفيديوهات المرجعية عناوين URL بعيدة بصيغة `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    معرّف المزوّد: `byteplus`.

    النماذج: `seedance-1-0-pro-250528` (الافتراضي)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    لا تقبل نماذج T2V (`*-t2v-*`) مدخلات الصور؛ تدعم نماذج I2V
    ونماذج `*-pro-*` العامة صورة مرجعية واحدة (الإطار الأول).
    مرّر الصورة حسب الموضع أو اضبط `role: "first_frame"`.
    يتم تبديل معرّفات نماذج T2V تلقائيًا إلى متغير I2V
    المقابل عند توفير صورة.

    مفاتيح `providerOptions` المدعومة: `seed` (رقم)، و`draft` (قيمة منطقية —
    تفرض 480p)، و`camera_fixed` (قيمة منطقية).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance15`. النموذج:
    `seedance-1-5-pro-251215`.

    يستخدم API الموحد `content[]`. يدعم صورتين إدخاليتين كحد أقصى
    (`first_frame` + `last_frame`). يجب أن تكون كل المدخلات عناوين URL بعيدة
    بصيغة `https://`. اضبط `role: "first_frame"` / `"last_frame"` على كل صورة، أو
    مرّر الصور حسب الموضع.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُعيَّن `audio: true` إلى `generate_audio`. تُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance2`. النماذج:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    يستخدم API الموحد `content[]`. يدعم حتى 9 صور مرجعية،
    و3 فيديوهات مرجعية، و3 مقاطع صوت مرجعية. يجب أن تكون كل المدخلات عناوين URL بعيدة
    بصيغة `https://`. اضبط `role` على كل أصل — القيم المدعومة:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُعيَّن `audio: true` إلى `generate_audio`. تُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="ComfyUI">
    تنفيذ محلي أو سحابي مدفوع بسير عمل. يدعم تحويل النص إلى فيديو
    وتحويل الصورة إلى فيديو عبر الرسم البياني المكوّن.
  </Accordion>
  <Accordion title="fal">
    يستخدم تدفقًا مدعومًا بطابور للمهام طويلة التشغيل. تقبل معظم نماذج فيديو fal
    مرجع صورة واحدًا. تقبل نماذج Seedance 2.0 من المرجع إلى الفيديو
    حتى 9 صور، و3 فيديوهات، و3 مراجع صوتية، مع
    12 ملفًا مرجعيًا إجمالًا كحد أقصى.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    يدعم مرجع صورة واحدًا أو مرجع فيديو واحدًا.
  </Accordion>
  <Accordion title="MiniMax">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="OpenAI">
    يُمرَّر تجاوز `size` فقط. تُتجاهل تجاوزات النمط الأخرى
    (`aspectRatio`، `resolution`، `audio`، `watermark`) مع
    تحذير.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم API غير المتزامن `/videos` الخاص بـ OpenRouter. يرسل OpenClaw
    المهمة، ويستطلع `polling_url`، وينزّل إما `unsigned_urls` أو
    نقطة نهاية محتوى المهمة الموثقة. يعلن الافتراضي المضمن `google/veo-3.1-fast`
    مددًا قدرها 4/6/8 ثوانٍ، ودقات `720P`/`1080P`، ونسب عرض إلى ارتفاع
    `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    الواجهة الخلفية نفسها DashScope مثل Alibaba. يجب أن تكون مدخلات المراجع عناوين URL بعيدة
    بصيغة `http(s)`؛ تُرفض الملفات المحلية مسبقًا.
  </Accordion>
  <Accordion title="Runway">
    يدعم الملفات المحلية عبر عناوين URI للبيانات. يتطلب تحويل الفيديو إلى فيديو
    `runway/gen4_aleph`. تعرض عمليات النص فقط نسب عرض إلى ارتفاع
    `16:9` و`9:16`.
  </Accordion>
  <Accordion title="Together">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="Vydra">
    يستخدم `https://www.vydra.ai/api/v1` مباشرة لتجنب عمليات إعادة التوجيه
    التي تسقط المصادقة. يأتي `veo3` مضمنًا كتحويل نص إلى فيديو فقط؛ ويتطلب `kling`
    عنوان URL بعيدًا لصورة.
  </Accordion>
  <Accordion title="xAI">
    يدعم تحويل النص إلى فيديو، وتحويل صورة إطار أول واحدة إلى فيديو، وحتى 7
    مدخلات `reference_image` عبر `reference_images` في xAI، وتدفقات تعديل/تمديد
    الفيديو البعيد.
  </Accordion>
</AccordionGroup>

## أوضاع قدرات المزوّد

يدعم عقد إنشاء الفيديو المشترك قدرات خاصة بكل وضع
بدلاً من حدود تجميعية مسطّحة فقط. ينبغي لتنفيذات المزوّدين الجديدة
تفضيل كتل أوضاع صريحة:

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

حقول التجميع المسطّحة مثل `maxInputImages` و`maxInputVideos`
**ليست** كافية للإعلان عن دعم وضع التحويل. ينبغي للمزوّدين
إعلان `generate` و`imageToVideo` و`videoToVideo` صراحةً لكي تتمكن
الاختبارات الحية، واختبارات العقد، وأداة `video_generate` المشتركة من التحقق
من دعم الأوضاع بشكل حتمي.

عندما يكون لأحد النماذج في مزوّد ما دعم أوسع للإدخال المرجعي من
بقية النماذج، استخدم `maxInputImagesByModel` أو `maxInputVideosByModel` أو
`maxInputAudiosByModel` بدلاً من رفع حد الوضع بأكمله.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المضمّنين المشتركين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

غلاف المستودع:

```bash
pnpm test:live:media video
```

يحمّل هذا الملف الحي متغيرات بيئة المزوّدين المفقودة من `~/.profile`، ويفضّل
مفاتيح API الحية/من البيئة على ملفات تعريف المصادقة المخزنة افتراضياً، ويشغّل
فحصاً سريعاً آمناً للإصدار افتراضياً:

- `generate` لكل مزوّد غير FAL في المسح.
- مطالبة جراد بحر مدتها ثانية واحدة.
- حد العمليات لكل مزوّد من
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضياً).

FAL اختياري لأن زمن انتظار الطابور من جهة المزوّد يمكن أن يهيمن على
وقت الإصدار:

```bash
pnpm test:live:media video --video-providers fal
```

عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع
التحويل المعلنة أيضاً التي يستطيع المسح المشترك اختبارها بأمان باستخدام وسائط محلية:

- `imageToVideo` عندما تكون `capabilities.imageToVideo.enabled`.
- `videoToVideo` عندما تكون `capabilities.videoToVideo.enabled` ويقبل
  المزوّد/النموذج إدخال فيديو محلياً مدعوماً بالمخزن المؤقت في المسح المشترك.

اليوم يغطي مسار `videoToVideo` الحي المشترك `runway` فقط عندما
تختار `runway/gen4_aleph`.

## التهيئة

عيّن نموذج إنشاء الفيديو الافتراضي في تهيئة OpenClaw لديك:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

أو عبر CLI:

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## ذو صلة

- [Alibaba Model Studio](/ar/providers/alibaba)
- [المهام الخلفية](/ar/automation/tasks) — تتبع المهام لإنشاء الفيديو غير المتزامن
- [BytePlus](/ar/concepts/model-providers#byteplus-international)
- [ComfyUI](/ar/providers/comfy)
- [مرجع التهيئة](/ar/gateway/config-agents#agent-defaults)
- [fal](/ar/providers/fal)
- [Google (Gemini)](/ar/providers/google)
- [MiniMax](/ar/providers/minimax)
- [النماذج](/ar/concepts/models)
- [OpenAI](/ar/providers/openai)
- [Qwen](/ar/providers/qwen)
- [Runway](/ar/providers/runway)
- [Together AI](/ar/providers/together)
- [نظرة عامة على الأدوات](/ar/tools)
- [Vydra](/ar/providers/vydra)
- [xAI](/ar/providers/xai)
