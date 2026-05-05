---
read_when:
    - توليد مقاطع الفيديو عبر الوكيل
    - تكوين موفري إنشاء الفيديو ونماذجه
    - فهم معلمات أداة video_generate
sidebarTitle: Video generation
summary: إنشاء مقاطع فيديو عبر video_generate من مراجع نصية أو صورية أو مرئية عبر 16 واجهة خلفية لموفري الخدمات
title: توليد الفيديو
x-i18n:
    generated_at: "2026-05-05T06:20:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a86a820cc9f27baf4b17954d7ded7c2b7ff9eb456e7e75c3b2e7a7653cd675fd
    source_path: tools/video-generation.md
    workflow: 16
---

يمكن لوكلاء OpenClaw إنشاء مقاطع فيديو من مطالبات نصية، أو صور مرجعية، أو
مقاطع فيديو موجودة. يتم دعم ستة عشر مزوّدًا خلفيًا، ولكل منها
خيارات نماذج مختلفة، وأنماط إدخال، ومجموعات ميزات. يختار الوكيل
المزوّد المناسب تلقائيًا بناءً على إعداداتك ومفاتيح API المتاحة.

<Note>
لا تظهر أداة `video_generate` إلا عند توفر مزوّد واحد على الأقل
لإنشاء الفيديو. إذا لم ترها ضمن أدوات وكيلك، فاضبط مفتاح API
لمزوّد أو قم بتكوين `agents.defaults.videoGenerationModel`.
</Note>

يتعامل OpenClaw مع إنشاء الفيديو كثلاثة أوضاع وقت تشغيل:

- `generate` — طلبات تحويل النص إلى فيديو بلا وسائط مرجعية.
- `imageToVideo` — يتضمن الطلب صورة مرجعية واحدة أو أكثر.
- `videoToVideo` — يتضمن الطلب فيديو مرجعيًا واحدًا أو أكثر.

يمكن للمزوّدين دعم أي مجموعة فرعية من هذه الأوضاع. تتحقق الأداة من
الوضع النشط قبل الإرسال وتعرض الأوضاع المدعومة في `action=list`.

## البدء السريع

<Steps>
  <Step title="Configure auth">
    اضبط مفتاح API لأي مزوّد مدعوم:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="Pick a default model (optional)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="Ask the agent">
    > أنشئ مقطع فيديو سينمائيًا مدته 5 ثوانٍ لكركند ودود يتزلج على الأمواج عند الغروب.

    يستدعي الوكيل `video_generate` تلقائيًا. لا حاجة إلى إدراج الأداة
    في قائمة السماح.

  </Step>
</Steps>

## كيف يعمل الإنشاء غير المتزامن

إنشاء الفيديو غير متزامن. عندما يستدعي الوكيل `video_generate` في
جلسة:

1. يرسل OpenClaw الطلب إلى المزوّد ويعيد معرّف مهمة فورًا.
2. يعالج المزوّد المهمة في الخلفية (عادةً من 30 ثانية إلى عدة دقائق حسب المزوّد والدقة؛ ويمكن للمزوّدين البطيئين المدعومين بطابور تشغيل المهمة حتى مهلة الانتظار المكوّنة).
3. عندما يصبح الفيديو جاهزًا، يوقظ OpenClaw الجلسة نفسها بحدث اكتمال داخلي.
4. يخبر الوكيل المستخدم ويرفق الفيديو النهائي. في محادثات المجموعات/القنوات
   التي تستخدم تسليمًا مرئيًا عبر أداة الرسائل فقط، ينقل الوكيل
   النتيجة عبر أداة الرسائل بدلًا من أن ينشرها OpenClaw مباشرة.

أثناء تنفيذ مهمة، تعيد استدعاءات `video_generate` المكررة في الجلسة
نفسها حالة المهمة الحالية بدلًا من بدء عملية إنشاء أخرى. استخدم
`openclaw tasks list` أو `openclaw tasks show <taskId>` للتحقق من
التقدم من CLI.

خارج عمليات تشغيل الوكيل المدعومة بجلسة (على سبيل المثال، استدعاءات
الأدوات المباشرة)، تعود الأداة إلى الإنشاء المضمّن وتعيد مسار الوسائط
النهائي في الدور نفسه.

تُحفظ ملفات الفيديو المُنشأة ضمن تخزين الوسائط المُدار بواسطة OpenClaw عندما
يعيد المزوّد بايتات. يتبع حد الحفظ الافتراضي للفيديو المُنشأ
حد وسائط الفيديو، ويرفع `agents.defaults.mediaMaxMb` هذا الحد
لعمليات التصيير الأكبر. عندما يعيد المزوّد أيضًا عنوان URL لمخرج مستضاف، يستطيع OpenClaw
تسليم ذلك العنوان بدلًا من فشل المهمة إذا رفض التخزين المحلي
ملفًا زائد الحجم.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | تم إنشاء المهمة، وهي تنتظر قبول المزوّد لها.                                                   |
| `running`   | يعالج المزوّد المهمة (عادةً من 30 ثانية إلى عدة دقائق حسب المزوّد والدقة). |
| `succeeded` | الفيديو جاهز؛ يوقظ الوكيل وينشره في المحادثة.                                         |
| `failed`    | خطأ من المزوّد أو انتهاء مهلة؛ يوقظ الوكيل مع تفاصيل الخطأ.                                         |

تحقق من الحالة من CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

إذا كانت مهمة فيديو بالفعل في حالة `queued` أو `running` للجلسة الحالية،
فإن `video_generate` يعيد حالة المهمة الموجودة بدلًا من بدء مهمة
جديدة. استخدم `action: "status"` للتحقق صراحةً دون تشغيل إنشاء جديد.

## المزوّدون المدعومون

| المزوّد              | النموذج الافتراضي                   | نص | مرجع صورة                                            | مرجع فيديو                                       | المصادقة                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | حتى صورتين (نماذج I2V فقط؛ الإطار الأول + الأخير) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | حتى صورتين (الإطار الأول + الأخير عبر الدور)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | حتى 9 صور مرجعية                             | حتى 3 مقاطع فيديو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | صورة واحدة                                              | —                                               | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | صورة واحدة؛ حتى 9 مع Seedance reference-to-video    | حتى 3 مقاطع فيديو مع Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | صورة واحدة                                              | —                                               | `MINIMAX_API_KEY` أو MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | حتى 4 صور (الإطار الأول/الأخير أو مراجع)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | صورة واحدة                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | صورة واحدة (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | صورة إطار أول واحدة أو حتى 7 `reference_image`s    | فيديو واحد                                         | `XAI_API_KEY`                            |

يقبل بعض المزوّدين متغيرات بيئة إضافية أو بديلة لمفاتيح API. راجع
[صفحات المزوّدين](#related) الفردية للحصول على التفاصيل.

شغّل `video_generate action=list` لفحص المزوّدين والنماذج وأوضاع
وقت التشغيل المتاحة أثناء التشغيل.

### مصفوفة الإمكانات

عقد الوضع الصريح المستخدم بواسطة `video_generate`، واختبارات العقد، و
الفحص المباشر المشترك:

| المزوّد   | `generate` | `imageToVideo` | `videoToVideo` | مسارات الفحص المباشر المشتركة اليوم                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين URL لفيديوهات `http(s)` بعيدة                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | غير موجود في الفحص المشترك؛ تعيش التغطية الخاصة بسير العمل مع اختبارات Comfy                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`؛ مخططات فيديو DeepInfra الأصلية هي تحويل نص إلى فيديو في العقد المضمّن                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط عند استخدام Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` المشترك لأن فحص Gemini/Veo الحالي المدعوم بالمخزن المؤقت لا يقبل ذلك الإدخال  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` المشترك لأن هذا المسار للمؤسسة/الإدخال يحتاج حاليًا إلى وصول inpaint/remix من جانب المزوّد |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين URL لفيديوهات `http(s)` بعيدة                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يعمل `videoToVideo` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`؛ تم تخطي `imageToVideo` المشترك لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا المزوّد يحتاج حاليًا إلى عنوان URL بعيد لملف MP4                                |

## معلمات الأداة

### مطلوب

<ParamField path="prompt" type="string" required>
  وصف نصي للفيديو المراد إنشاؤه. مطلوب لـ `action: "generate"`.
</ParamField>

### مدخلات المحتوى

<ParamField path="image" type="string">صورة مرجعية واحدة (مسار أو URL).</ParamField>
<ParamField path="images" type="string[]">صور مرجعية متعددة (حتى 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الصور المدمجة.
القيم القياسية: `first_frame`، `last_frame`، `reference_image`.
</ParamField>
<ParamField path="video" type="string">فيديو مرجعي واحد (مسار أو URL).</ParamField>
<ParamField path="videos" type="string[]">فيديوهات مرجعية متعددة (حتى 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الفيديوهات المدمجة.
القيمة القياسية: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
صوت مرجعي واحد (مسار أو URL). يُستخدم لموسيقى الخلفية أو مرجع الصوت
عندما يدعم المزوّد إدخالات الصوت.
</ParamField>
<ParamField path="audioRefs" type="string[]">أصوات مرجعية متعددة (حتى 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الصوت المدمجة.
القيمة القياسية: `reference_audio`.
</ParamField>

<Note>
تُمرَّر تلميحات الأدوار إلى المزوّد كما هي. تأتي القيم القياسية من
اتحاد `VideoGenerationAssetRole`، لكن قد يقبل المزوّدون سلاسل أدوار إضافية.
يجب ألا تحتوي مصفوفات `*Roles` على إدخالات أكثر من قائمة المراجع
المقابلة؛ تفشل أخطاء الموضع الزائد أو الناقص بخطأ واضح.
استخدم سلسلة فارغة لترك خانة غير مضبوطة. بالنسبة إلى xAI، عيّن كل دور صورة إلى
`reference_image` لاستخدام وضع التوليد `reference_images` الخاص به؛ احذف
الدور أو استخدم `first_frame` لتحويل صورة واحدة إلى فيديو.
</Note>

### عناصر التحكم في النمط

<ParamField path="aspectRatio" type="string">
  تلميح نسبة العرض إلى الارتفاع مثل `1:1` أو `16:9` أو `9:16` أو `adaptive` أو قيمة خاصة بالمزوّد. يطبع OpenClaw القيم غير المدعومة أو يتجاهلها حسب المزوّد.
</ParamField>
<ParamField path="resolution" type="string">تلميح الدقة مثل `480P` أو `720P` أو `768P` أو `1080P` أو `4K` أو قيمة خاصة بالمزوّد. يطبع OpenClaw القيم غير المدعومة أو يتجاهلها حسب المزوّد.</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني (تُقرَّب إلى أقرب قيمة يدعمها المزوّد).
</ParamField>
<ParamField path="size" type="string">تلميح الحجم عندما يدعمه المزوّد.</ParamField>
<ParamField path="audio" type="boolean">
  فعّل الصوت المولّد في المخرج عندما يكون مدعومًا. يختلف هذا عن `audioRef*` (الإدخالات).
</ParamField>
<ParamField path="watermark" type="boolean">بدّل العلامة المائية الخاصة بالمزوّد عندما تكون مدعومة.</ParamField>

`adaptive` قيمة حارسة خاصة بالمزوّد: تُمرَّر كما هي إلى
المزوّدين الذين يصرّحون بـ `adaptive` في قدراتهم (مثل BytePlus
Seedance الذي يستخدمها لاكتشاف النسبة تلقائيًا من أبعاد صورة الإدخال).
المزوّدون الذين لا يصرّحون بها يعرضون القيمة عبر
`details.ignoredOverrides` في نتيجة الأداة حتى يكون الإسقاط مرئيًا.

### متقدم

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  تُرجع `"status"` مهمة الجلسة الحالية؛ وتفحص `"list"` المزوّدين.
</ParamField>
<ParamField path="model" type="string">تجاوز المزوّد/النموذج (مثل `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لعملية المزوّد بالميلي ثانية.</ParamField>
<ParamField path="providerOptions" type="object">
  خيارات خاصة بالمزوّد ككائن JSON (مثل `{"seed": 42, "draft": true}`).
  يتحقق المزوّدون الذين يصرّحون بمخطط مكتوب من المفاتيح والأنواع؛ تؤدي المفاتيح
  غير المعروفة أو عدم التطابق إلى تخطي المرشح أثناء الرجوع الاحتياطي. يتلقى المزوّدون الذين لا
  يصرّحون بمخطط الخيارات كما هي. شغّل `video_generate action=list`
  لمعرفة ما يقبله كل مزوّد.
</ParamField>

<Note>
لا يدعم كل المزوّدين كل المعلمات. يطبع OpenClaw المدة إلى
أقرب قيمة يدعمها المزوّد، ويعيد تعيين تلميحات الهندسة المترجمة
مثل الحجم إلى نسبة العرض إلى الارتفاع عندما يعرض مزوّد رجوع احتياطي
سطح تحكم مختلفًا. تُتجاهل التجاوزات غير المدعومة فعليًا على أساس أفضل جهد
وتُبلّغ كتحذيرات في نتيجة الأداة. تفشل حدود القدرات الصارمة
(مثل عدد كبير جدًا من إدخالات المراجع) قبل الإرسال. تُبلّغ نتائج الأداة
الإعدادات المطبقة؛ يلتقط `details.normalization` أي
ترجمة من المطلوب إلى المطبق.
</Note>

تحدد إدخالات المراجع وضع وقت التشغيل:

- لا توجد وسائط مرجعية → `generate`
- أي مرجع صورة → `imageToVideo`
- أي مرجع فيديو → `videoToVideo`
- إدخالات الصوت المرجعية **لا** تغيّر الوضع المحلول؛ تُطبَّق فوق
  أي وضع تختاره مراجع الصور/الفيديو، وتعمل فقط
  مع المزوّدين الذين يصرّحون بـ `maxInputAudios`.

ليست مراجع الصور والفيديو المختلطة سطح قدرات مشتركًا مستقرًا.
فضّل نوع مرجع واحدًا لكل طلب.

#### الرجوع الاحتياطي والخيارات المكتوبة

تُطبَّق بعض فحوصات القدرات في طبقة الرجوع الاحتياطي بدلًا من
حدود الأداة، لذلك يمكن لطلب يتجاوز حدود المزوّد الأساسي
أن يعمل على رجوع احتياطي قادر:

- يُتخطى المرشح النشط الذي لا يصرّح بـ `maxInputAudios` (أو يصرّح بـ `0`) عندما
  يحتوي الطلب على مراجع صوتية؛ ثم تُجرَّب المرشح التالي.
- إذا كان `maxDurationSeconds` للمرشح النشط أقل من `durationSeconds` المطلوبة
  ولا توجد قائمة `supportedDurationSeconds` مصرّح بها → يُتخطى.
- إذا احتوى الطلب على `providerOptions` وكان المرشح النشط يصرّح صراحةً
  بمخطط `providerOptions` مكتوب → يُتخطى إذا كانت المفاتيح المقدمة
  غير موجودة في المخطط أو إذا لم تتطابق أنواع القيم. يتلقى المزوّدون الذين لا يملكون
  مخططًا مصرّحًا به الخيارات كما هي (تمرير متوافق مع الإصدارات السابقة).
  يمكن للمزوّد إلغاء كل خيارات المزوّد بإعلانه
  مخططًا فارغًا (`capabilities.providerOptions: {}`)، ما
  يسبب التخطي نفسه كما في عدم تطابق النوع.

يُسجَّل أول سبب تخطٍ في الطلب عند `warn` حتى يرى المشغّلون متى
تم تجاوز مزوّدهم الأساسي؛ وتُسجَّل التخطيّات اللاحقة عند `debug` من أجل
إبقاء سلاسل الرجوع الاحتياطي الطويلة هادئة. إذا تم تخطي كل المرشحين، يتضمن
الخطأ المجمع سبب التخطي لكل واحد.

## الإجراءات

| الإجراء     | ما يفعله                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | الافتراضي. إنشاء فيديو من المطالبة المعطاة وإدخالات المراجع الاختيارية.                             |
| `status`   | التحقق من حالة مهمة الفيديو قيد التنفيذ للجلسة الحالية دون بدء توليد آخر. |
| `list`     | عرض المزوّدين والنماذج المتاحة وقدراتها.                                                |

## اختيار النموذج

يحل OpenClaw النموذج بهذا الترتيب:

1. **معلمة الأداة `model`** — إذا حدد الوكيل واحدة في الاستدعاء.
2. **`videoGenerationModel.primary`** من الإعدادات.
3. **`videoGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** — المزوّدون الذين لديهم مصادقة صالحة، بدءًا من
   المزوّد الافتراضي الحالي، ثم بقية المزوّدين بالترتيب الأبجدي.

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
    والفيديوهات المرجعية عناوين URL بعيدة `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    معرّف المزوّد: `byteplus`.

    النماذج: `seedance-1-0-pro-250528` (الافتراضي)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    لا تقبل نماذج T2V (`*-t2v-*`) إدخالات الصور؛ تدعم نماذج I2V
    ونماذج `*-pro-*` العامة صورة مرجعية واحدة (الإطار الأول).
    مرّر الصورة موضعيًا أو اضبط `role: "first_frame"`.
    يتم تبديل معرّفات نماذج T2V تلقائيًا إلى صيغة I2V المقابلة
    عند توفير صورة.

    مفاتيح `providerOptions` المدعومة: `seed` (رقم)، و`draft` (قيمة منطقية —
    يفرض 480p)، و`camera_fixed` (قيمة منطقية).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance15`. النموذج:
    `seedance-1-5-pro-251215`.

    يستخدم واجهة API الموحدة `content[]`. يدعم بحد أقصى صورتَي إدخال
    (`first_frame` + `last_frame`). يجب أن تكون كل الإدخالات عناوين URL بعيدة `https://`.
    اضبط `role: "first_frame"` / `"last_frame"` على كل صورة، أو
    مرّر الصور موضعيًا.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُعيَّن `audio: true` إلى `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance2`. النماذج:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    يستخدم واجهة API الموحدة `content[]`. يدعم حتى 9 صور مرجعية،
    و3 فيديوهات مرجعية، و3 أصوات مرجعية. يجب أن تكون كل الإدخالات عناوين URL بعيدة
    `https://`. اضبط `role` على كل أصل — القيم المدعومة:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُعيَّن `audio: true` إلى `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="ComfyUI">
    تنفيذ محلي أو سحابي موجَّه بسير العمل. يدعم تحويل النص إلى فيديو
    وتحويل الصورة إلى فيديو عبر الرسم البياني المُكوَّن.
  </Accordion>
  <Accordion title="fal">
    يستخدم تدفقًا مدعومًا بقائمة انتظار للمهام طويلة التشغيل. ينتظر OpenClaw مدة تصل إلى 20
    دقيقة افتراضيًا قبل التعامل مع مهمة قائمة انتظار fal قيد التنفيذ على أنها انتهت
    مهلتها. تقبل معظم نماذج فيديو fal
    مرجع صورة واحدًا. تقبل نماذج Seedance 2.0 لتحويل المرجع إلى فيديو
    ما يصل إلى 9 صور، و3 مقاطع فيديو، و3 مراجع صوتية، مع
    حد أقصى يبلغ 12 ملفًا مرجعيًا إجمالًا.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    يدعم مرجع صورة واحدًا أو مرجع فيديو واحدًا. يتم تجاهل طلبات الصوت المُولَّد
    مع تحذير في مسار Gemini API لأن واجهة API تلك ترفض
    المعامل `generateAudio` لتوليد فيديو Veo الحالي.
  </Accordion>
  <Accordion title="MiniMax">
    مرجع صورة واحد فقط. يقبل MiniMax دقتَي `768P` و`1080P`؛
    وتُطبَّع الطلبات مثل `720P` إلى أقرب
    قيمة مدعومة قبل الإرسال.
  </Accordion>
  <Accordion title="OpenAI">
    يتم تمرير تجاوز `size` فقط. يتم تجاهل تجاوزات النمط الأخرى
    (`aspectRatio` و`resolution` و`audio` و`watermark`) مع
    تحذير.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم واجهة API غير المتزامنة `/videos` الخاصة بـ OpenRouter. يرسل OpenClaw
    المهمة، ويستطلع `polling_url`، وينزّل إما `unsigned_urls` أو
    نقطة نهاية محتوى المهمة الموثَّقة. يعلن الإعداد الافتراضي المضمَّن `google/veo-3.1-fast`
    عن مدد 4/6/8 ثوانٍ، ودقات `720P`/`1080P`، ونسب عرض إلى ارتفاع
    `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    نفس واجهة DashScope الخلفية مثل Alibaba. يجب أن تكون مدخلات المراجع عناوين URL بعيدة
    من نوع `http(s)`؛ وتُرفض الملفات المحلية مسبقًا.
  </Accordion>
  <Accordion title="Runway">
    يدعم الملفات المحلية عبر معرّفات URI للبيانات. يتطلب تحويل الفيديو إلى فيديو
    `runway/gen4_aleph`. تعرض عمليات النص فقط نسبتَي عرض إلى ارتفاع `16:9` و`9:16`.
  </Accordion>
  <Accordion title="Together">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="Vydra">
    يستخدم `https://www.vydra.ai/api/v1` مباشرة لتجنب عمليات إعادة التوجيه
    التي تُسقط المصادقة. يُضمَّن `veo3` لتحويل النص إلى فيديو فقط؛ ويتطلب `kling`
    عنوان URL بعيدًا لصورة.
  </Accordion>
  <Accordion title="xAI">
    يدعم تحويل النص إلى فيديو، وتحويل صورة إطار أول واحدة إلى فيديو، وما يصل إلى 7
    مدخلات `reference_image` عبر `reference_images` في xAI، وتدفقات تعديل/تمديد
    الفيديو البعيد.
  </Accordion>
</AccordionGroup>

## أوضاع قدرات المزوّد

يدعم عقد توليد الفيديو المشترك قدرات مخصصة لكل وضع
بدلًا من حدود إجمالية مسطحة فقط. ينبغي لتطبيقات المزوّد الجديدة
تفضيل كتل الأوضاع الصريحة:

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

الحقول الإجمالية المسطحة مثل `maxInputImages` و`maxInputVideos`
**ليست** كافية للإعلان عن دعم وضع التحويل. ينبغي للمزوّدين
التصريح بـ `generate` و`imageToVideo` و`videoToVideo` صراحةً حتى تتمكن
الاختبارات الحية، واختبارات العقد، وأداة `video_generate` المشتركة من التحقق
من دعم الوضع بشكل حتمي.

عندما يكون لأحد النماذج ضمن مزوّد دعم أوسع لمدخلات المراجع من
البقية، استخدم `maxInputImagesByModel` أو `maxInputVideosByModel` أو
`maxInputAudiosByModel` بدلًا من رفع الحد على مستوى الوضع.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المشتركين المضمَّنين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

مُغلّف المستودع:

```bash
pnpm test:live:media video
```

يحمّل هذا الملف الحي متغيرات بيئة المزوّد الناقصة من `~/.profile`، ويفضل
مفاتيح API الحية/البيئية على ملفات تعريف المصادقة المخزنة افتراضيًا، ويشغّل
اختبار smoke آمنًا للإصدار افتراضيًا:

- `generate` لكل مزوّد غير FAL في الفحص.
- مطالبة lobster مدتها ثانية واحدة.
- حد عمليات لكل مزوّد من
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا).

FAL اختياري لأن زمن انتقال قائمة الانتظار من جانب المزوّد يمكن أن يهيمن على
وقت الإصدار:

```bash
pnpm test:live:media video --video-providers fal
```

عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل
المعلنة أيضًا، والتي يستطيع الفحص المشترك ممارستها بأمان مع وسائط محلية:

- `imageToVideo` عندما تكون `capabilities.imageToVideo.enabled`.
- `videoToVideo` عندما تكون `capabilities.videoToVideo.enabled` وكان
  المزوّد/النموذج يقبل إدخال فيديو محليًا مدعومًا بمخزن مؤقت في الفحص
  المشترك.

اليوم يغطي مسار `videoToVideo` الحي المشترك `runway` فقط عندما
تحدد `runway/gen4_aleph`.

## التكوين

عيّن نموذج توليد الفيديو الافتراضي في تكوين OpenClaw الخاص بك:

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

## ذات صلة

- [Alibaba Model Studio](/ar/providers/alibaba)
- [المهام الخلفية](/ar/automation/tasks) — تتبّع المهام لتوليد الفيديو غير المتزامن
- [BytePlus](/ar/concepts/model-providers#byteplus-international)
- [ComfyUI](/ar/providers/comfy)
- [مرجع التكوين](/ar/gateway/config-agents#agent-defaults)
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
