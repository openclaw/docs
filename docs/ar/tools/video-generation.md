---
read_when:
    - توليد مقاطع الفيديو عبر الوكيل
    - إعداد مزوّدي ونماذج توليد الفيديو
    - فهم معلمات أداة video_generate
sidebarTitle: Video generation
summary: أنشئ مقاطع فيديو عبر video_generate من مراجع نصية أو صورية أو مرئية عبر 16 واجهة خلفية لمزوّدين
title: توليد الفيديو
x-i18n:
    generated_at: "2026-05-06T08:19:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ebc8b61785f69c1354951be2d6b3e7b437c99994513f13e19faf3a9e420263fb
    source_path: tools/video-generation.md
    workflow: 16
---

يمكن لوكلاء OpenClaw إنشاء مقاطع فيديو من مطالبات نصية، أو صور مرجعية، أو
مقاطع فيديو موجودة. تُدعَم ستة عشر واجهة خلفية للموفرين، ولكل منها
خيارات نماذج وأوضاع إدخال ومجموعات ميزات مختلفة. يختار الوكيل
الموفر المناسب تلقائيًا بناءً على إعداداتك ومفاتيح API المتاحة.

<Note>
لا تظهر أداة `video_generate` إلا عند توفر موفر واحد على الأقل لإنشاء
الفيديو. إذا لم ترها ضمن أدوات الوكيل، فعيّن مفتاح API لأحد الموفرين
أو اضبط `agents.defaults.videoGenerationModel`.
</Note>

يتعامل OpenClaw مع إنشاء الفيديو كثلاثة أوضاع تشغيل:

- `generate` - طلبات تحويل النص إلى فيديو من دون وسائط مرجعية.
- `imageToVideo` - يتضمن الطلب صورة مرجعية واحدة أو أكثر.
- `videoToVideo` - يتضمن الطلب فيديو مرجعيًا واحدًا أو أكثر.

يمكن للموفرين دعم أي مجموعة فرعية من هذه الأوضاع. تتحقق الأداة من
الوضع النشط قبل الإرسال وتعرض الأوضاع المدعومة في `action=list`.

## البدء السريع

<Steps>
  <Step title="إعداد المصادقة">
    عيّن مفتاح API لأي موفر مدعوم:

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
    > أنشئ فيديو سينمائيًا مدته 5 ثوانٍ لجراد بحر ودود يركب الأمواج عند الغروب.

    يستدعي الوكيل `video_generate` تلقائيًا. لا حاجة إلى إدراج الأداة
    في قائمة السماح.

  </Step>
</Steps>

## كيف يعمل الإنشاء غير المتزامن

إنشاء الفيديو غير متزامن. عندما يستدعي الوكيل `video_generate` في
جلسة:

1. يرسل OpenClaw الطلب إلى الموفر ويعيد معرّف مهمة فورًا.
2. يعالج الموفر المهمة في الخلفية (عادةً من 30 ثانية إلى عدة دقائق حسب الموفر والدقة؛ ويمكن للموفرين البطيئين المعتمدين على قوائم الانتظار العمل حتى انتهاء المهلة المضبوطة).
3. عندما يصبح الفيديو جاهزًا، يوقظ OpenClaw الجلسة نفسها بحدث إكمال داخلي.
4. يخبر الوكيل المستخدم ويرفق الفيديو النهائي. في محادثات المجموعات/القنوات
   التي تستخدم تسليمًا مرئيًا عبر أداة الرسائل فقط، يمرر الوكيل
   النتيجة عبر أداة الرسائل بدلًا من أن ينشرها OpenClaw مباشرةً.

أثناء تنفيذ مهمة، تعيد استدعاءات `video_generate` المكررة في الجلسة
نفسها حالة المهمة الحالية بدلًا من بدء عملية إنشاء أخرى. استخدم
`openclaw tasks list` أو `openclaw tasks show <taskId>` للتحقق من
التقدم من CLI.

خارج تشغيلات الوكيل المدعومة بجلسة (على سبيل المثال، استدعاءات الأدوات
المباشرة)، تعود الأداة إلى الإنشاء المضمّن وتعيد مسار الوسائط النهائي
في الدور نفسه.

تُحفظ ملفات الفيديو المُنشأة ضمن مساحة تخزين الوسائط التي يديرها OpenClaw عندما
يعيد الموفر بايتات. يتبع حد الحفظ الافتراضي للفيديو المُنشأ
حد وسائط الفيديو، ويرفعه `agents.defaults.mediaMaxMb` للتصييرات
الأكبر. عندما يعيد الموفر أيضًا عنوان URL لمخرَج مستضاف، يمكن لـ OpenClaw
تسليم ذلك العنوان بدلًا من إفشال المهمة إذا رفض الحفظ المحلي
ملفًا زائد الحجم.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | تم إنشاء المهمة وهي تنتظر قبول الموفر لها.                                                   |
| `running`   | يعالج الموفر المهمة (عادةً من 30 ثانية إلى عدة دقائق حسب الموفر والدقة). |
| `succeeded` | الفيديو جاهز؛ يوقظ الوكيل وينشره في المحادثة.                                         |
| `failed`    | خطأ من الموفر أو انتهاء المهلة؛ يوقظ الوكيل مع تفاصيل الخطأ.                                         |

تحقق من الحالة من CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

إذا كانت مهمة فيديو بالفعل في حالة `queued` أو `running` للجلسة الحالية،
فإن `video_generate` يعيد حالة المهمة الحالية بدلًا من بدء مهمة جديدة.
استخدم `action: "status"` للتحقق صراحةً من دون تشغيل إنشاء جديد.

## الموفرون المدعومون

| الموفر              | النموذج الافتراضي                   | نص | مرجع الصورة                                            | مرجع الفيديو                                       | المصادقة                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | حتى صورتين (نماذج I2V فقط؛ الإطار الأول + الأخير) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | حتى صورتين (الإطار الأول + الأخير عبر الدور)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | حتى 9 صور مرجعية                             | حتى 3 مقاطع فيديو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | صورة واحدة                                              | -                                               | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | صورة واحدة؛ حتى 9 مع Seedance reference-to-video    | حتى 3 مقاطع فيديو مع Seedance reference-to-video | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | صورة واحدة                                              | -                                               | `MINIMAX_API_KEY` أو MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | حتى 4 صور (الإطار الأول/الأخير أو مراجع)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | صورة واحدة                                              | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | صورة واحدة (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | صورة إطار أول واحدة أو حتى 7 `reference_image`s    | فيديو واحد                                         | `XAI_API_KEY`                            |

يقبل بعض الموفرين متغيرات بيئة إضافية أو بديلة لمفاتيح API. راجع
[صفحات الموفرين](#related) الفردية لمزيد من التفاصيل.

شغّل `video_generate action=list` لفحص الموفرين والنماذج وأوضاع
التشغيل المتاحة وقت التشغيل.

### مصفوفة الإمكانات

عقد الوضع الصريح المستخدم بواسطة `video_generate`، واختبارات العقود،
والفحص الحي المشترك:

| الموفر   | `generate` | `imageToVideo` | `videoToVideo` | المسارات الحية المشتركة اليوم                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا الموفر يحتاج إلى عناوين URL فيديو بعيدة من نوع `http(s)`                               |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       -        | غير موجود في الفحص المشترك؛ توجد التغطية الخاصة بسير العمل مع اختبارات Comfy                                                               |
| DeepInfra  |     ✓      |       -        |       -        | `generate`؛ مخططات فيديو DeepInfra الأصلية هي تحويل النص إلى فيديو في العقد المضمّن                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يعمل `videoToVideo` فقط عند استخدام Seedance reference-to-video                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` المشترك لأن فحص Gemini/Veo الحالي المدعوم بالمخزن المؤقت لا يقبل ذلك الإدخال  |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` المشترك لأن مسار المؤسسة/الإدخال هذا يحتاج حاليًا إلى وصول inpaint/remix من جهة الموفر |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا الموفر يحتاج إلى عناوين URL فيديو بعيدة من نوع `http(s)`                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يعمل `videoToVideo` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       -        | `generate`؛ تم تخطي `imageToVideo` المشترك لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL بعيدًا للصورة            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا الموفر يحتاج حاليًا إلى عنوان URL بعيد لملف MP4                                |

## معلمات الأداة

### مطلوب

<ParamField path="prompt" type="string" required>
  وصف نصي للفيديو المراد إنشاؤه. مطلوب من أجل `action: "generate"`.
</ParamField>

### مدخلات المحتوى

<ParamField path="image" type="string">صورة مرجعية واحدة (مسار أو URL).</ParamField>
<ParamField path="images" type="string[]">صور مرجعية متعددة (حتى 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الصور المجمعة.
القيم القياسية: `first_frame`, `last_frame`, `reference_image`.
</ParamField>
<ParamField path="video" type="string">فيديو مرجعي واحد (مسار أو URL).</ParamField>
<ParamField path="videos" type="string[]">فيديوهات مرجعية متعددة (حتى 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الفيديوهات المجمعة.
القيمة القياسية: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
صوت مرجعي واحد (مسار أو URL). يُستخدم لموسيقى الخلفية أو مرجع الصوت
عندما يدعم المزوّد إدخالات الصوت.
</ParamField>
<ParamField path="audioRefs" type="string[]">ملفات صوتية مرجعية متعددة (حتى 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الصوت المجمعة.
القيمة القياسية: `reference_audio`.
</ParamField>

<Note>
تُمرَّر تلميحات الأدوار إلى المزوّد كما هي. تأتي القيم القياسية من
اتحاد `VideoGenerationAssetRole`، لكن قد تقبل المزوّدات سلاسل أدوار
إضافية. يجب ألا تحتوي مصفوفات `*Roles` على إدخالات أكثر من قائمة
المراجع المقابلة؛ إذ تفشل أخطاء الزيادة أو النقص بمقدار واحد برسالة خطأ واضحة.
استخدم سلسلة فارغة لترك خانة غير مضبوطة. بالنسبة إلى xAI، اضبط كل دور صورة على
`reference_image` لاستخدام وضع التوليد `reference_images` الخاص به؛ احذف
الدور أو استخدم `first_frame` لتحويل صورة واحدة إلى فيديو.
</Note>

### عناصر التحكم في النمط

<ParamField path="aspectRatio" type="string">
  تلميح نسبة العرض إلى الارتفاع مثل `1:1` أو `16:9` أو `9:16` أو `adaptive` أو قيمة خاصة بالمزوّد. يطبّع OpenClaw القيم غير المدعومة أو يتجاهلها حسب المزوّد.
</ParamField>
<ParamField path="resolution" type="string">تلميح الدقة مثل `480P` أو `720P` أو `768P` أو `1080P` أو `4K` أو قيمة خاصة بالمزوّد. يطبّع OpenClaw القيم غير المدعومة أو يتجاهلها حسب المزوّد.</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني (تُقرَّب إلى أقرب قيمة يدعمها المزوّد).
</ParamField>
<ParamField path="size" type="string">تلميح الحجم عندما يدعمه المزوّد.</ParamField>
<ParamField path="audio" type="boolean">
  فعّل الصوت المُولَّد في الناتج عندما يكون مدعومًا. يختلف هذا عن `audioRef*` (الإدخالات).
</ParamField>
<ParamField path="watermark" type="boolean">بدّل وضع العلامة المائية لدى المزوّد عندما تكون مدعومة.</ParamField>

`adaptive` قيمة حارسة خاصة بالمزوّد: تُمرَّر كما هي إلى
المزوّدات التي تعلن `adaptive` ضمن قدراتها (مثل BytePlus
Seedance الذي يستخدمها لاكتشاف النسبة تلقائيًا من أبعاد صورة الإدخال).
تعرض المزوّدات التي لا تعلنها القيمة عبر
`details.ignoredOverrides` في نتيجة الأداة بحيث يكون الإسقاط ظاهرًا.

### متقدم

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` المزوّدات.
</ParamField>
<ParamField path="model" type="string">تجاوز المزوّد/النموذج (مثل `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لعملية المزوّد بالمللي ثانية.</ParamField>
<ParamField path="providerOptions" type="object">
  خيارات خاصة بالمزوّد ككائن JSON (مثل `{"seed": 42, "draft": true}`).
  تتحقق المزوّدات التي تعلن مخططًا مكتوبًا من المفاتيح والأنواع؛ أما المفاتيح
  غير المعروفة أو عدم التطابق فتتسبب في تخطي المرشح أثناء الرجوع الاحتياطي. تتلقى المزوّدات التي لا
  تعلن مخططًا الخيارات كما هي. شغّل `video_generate action=list`
  لمعرفة ما يقبله كل مزوّد.
</ParamField>

<Note>
لا تدعم كل المزوّدات كل المعلمات. يطبّع OpenClaw المدة إلى
أقرب قيمة يدعمها المزوّد، ويعيد ربط تلميحات الهندسة المترجمة
مثل الحجم إلى نسبة العرض إلى الارتفاع عندما يعرض مزوّد احتياطي سطح
تحكم مختلفًا. تُتجاهل التجاوزات غير المدعومة فعليًا على أساس بذل أفضل جهد
وتُبلَّغ كتحذيرات في نتيجة الأداة. تفشل حدود القدرات الصارمة
(مثل عدد مراجع إدخال زائد) قبل الإرسال. تبلّغ نتائج الأداة
الإعدادات المطبقة؛ ويلتقط `details.normalization` أي
ترجمة من المطلوب إلى المطبق.
</Note>

تحدد إدخالات المراجع وضع وقت التشغيل:

- لا توجد وسائط مرجعية → `generate`
- أي مرجع صورة → `imageToVideo`
- أي مرجع فيديو → `videoToVideo`
- إدخالات الصوت المرجعية **لا** تغيّر الوضع المحسوم؛ فهي تُطبَّق
  فوق أي وضع تختاره مراجع الصورة/الفيديو، ولا تعمل إلا
  مع المزوّدات التي تعلن `maxInputAudios`.

لا تُعد مراجع الصور والفيديو المختلطة سطح قدرات مشتركة مستقرًا.
فضّل نوع مرجع واحدًا لكل طلب.

#### الرجوع الاحتياطي والخيارات المكتوبة

تُطبَّق بعض فحوصات القدرات في طبقة الرجوع الاحتياطي بدلًا من
حدود الأداة، لذلك يمكن لطلب يتجاوز حدود المزوّد الأساسي
أن يعمل رغم ذلك على مزوّد احتياطي قادر:

- يُتخطى المرشح النشط الذي لا يعلن `maxInputAudios` (أو يعلن `0`) عندما
  يحتوي الطلب على مراجع صوتية؛ ثم يُجرَّب المرشح التالي.
- `maxDurationSeconds` لدى المرشح النشط أقل من `durationSeconds`
  المطلوبة مع عدم وجود قائمة `supportedDurationSeconds` معلنة → يُتخطى.
- يحتوي الطلب على `providerOptions` ويعلن المرشح النشط صراحة
  مخطط `providerOptions` مكتوبًا → يُتخطى إذا كانت المفاتيح المقدمة
  غير موجودة في المخطط أو إذا لم تتطابق أنواع القيم. تتلقى المزوّدات التي لا
  تعلن مخططًا الخيارات كما هي (تمرير متوافق مع الإصدارات السابقة).
  يمكن للمزوّد إلغاء كل خيارات المزوّد بإعلان مخطط فارغ
  (`capabilities.providerOptions: {}`)، مما يتسبب في التخطي نفسه كما في حالة عدم تطابق النوع.

يُسجَّل أول سبب تخطٍ في الطلب عند `warn` حتى يرى المشغلون متى
تم تجاوز مزوّدهم الأساسي؛ وتُسجَّل حالات التخطي اللاحقة عند `debug` من أجل
إبقاء سلاسل الرجوع الاحتياطي الطويلة هادئة. إذا تم تخطي كل مرشح،
يتضمن الخطأ المجمّع سبب التخطي لكل واحد.

## الإجراءات

| الإجراء     | ما يفعله                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | الافتراضي. ينشئ فيديو من الموجه المعطى وإدخالات المراجع الاختيارية.                             |
| `status`   | يتحقق من حالة مهمة الفيديو الجارية للجلسة الحالية دون بدء توليد آخر. |
| `list`     | يعرض المزوّدات والنماذج المتاحة وقدراتها.                                                |

## اختيار النموذج

يحسم OpenClaw النموذج بهذا الترتيب:

1. **معلمة الأداة `model`** - إذا حدد الوكيل واحدة في الاستدعاء.
2. **`videoGenerationModel.primary`** من الإعدادات.
3. **`videoGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** - المزوّدات التي لديها مصادقة صالحة، بدءًا من
   المزوّد الافتراضي الحالي، ثم بقية المزوّدات بالترتيب
   الأبجدي.

إذا فشل مزوّد، يُجرَّب المرشح التالي تلقائيًا. إذا فشل جميع
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
    يستخدم نقطة النهاية غير المتزامنة في DashScope / Model Studio. يجب أن تكون الصور
    والفيديوهات المرجعية عناوين URL بعيدة من نوع `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    معرف المزوّد: `byteplus`.

    النماذج: `seedance-1-0-pro-250528` (الافتراضي)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    لا تقبل نماذج T2V (`*-t2v-*`) إدخالات الصور؛ تدعم نماذج I2V
    ونماذج `*-pro-*` العامة صورة مرجعية واحدة (الإطار الأول).
    مرّر الصورة موضعيًا أو اضبط `role: "first_frame"`.
    تُبدَّل معرفات نماذج T2V تلقائيًا إلى متغير I2V
    المقابل عند توفير صورة.

    مفاتيح `providerOptions` المدعومة: `seed` (رقم)، `draft` (منطقي -
    يفرض 480p)، `camera_fixed` (منطقي).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرف المزوّد: `byteplus-seedance15`. النموذج:
    `seedance-1-5-pro-251215`.

    يستخدم API الموحّد `content[]`. يدعم صورتَي إدخال على الأكثر
    (`first_frame` + `last_frame`). يجب أن تكون كل الإدخالات عناوين URL بعيدة من نوع `https://`.
    اضبط `role: "first_frame"` / `"last_frame"` على كل صورة، أو
    مرّر الصور موضعيًا.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُربط `audio: true` بـ `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرف المزوّد: `byteplus-seedance2`. النماذج:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    يستخدم API الموحّد `content[]`. يدعم حتى 9 صور مرجعية،
    و3 فيديوهات مرجعية، و3 ملفات صوتية مرجعية. يجب أن تكون كل الإدخالات عناوين URL بعيدة
    من نوع `https://`. اضبط `role` على كل أصل - القيم المدعومة:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُربط `audio: true` بـ `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="ComfyUI">
    تنفيذ محلي أو سحابي قائم على سير العمل. يدعم تحويل النص إلى فيديو
    وتحويل الصورة إلى فيديو عبر المخطط المكوّن.
  </Accordion>
  <Accordion title="fal">
    يستخدم تدفقًا مدعومًا بطابور للمهام طويلة التشغيل. ينتظر OpenClaw حتى 20
    دقيقة افتراضيًا قبل اعتبار مهمة طابور fal قيد التنفيذ منتهية المهلة.
    تقبل معظم نماذج فيديو fal مرجع صورة واحدًا. تقبل نماذج Seedance 2.0 من
    مرجع إلى فيديو حتى 9 صور و3 فيديوهات و3 مراجع صوتية، وبحد أقصى 12 ملفًا
    مرجعيًا إجمالًا.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    يدعم مرجع صورة واحدًا أو مرجع فيديو واحدًا. يتم تجاهل طلبات الصوت المولّد
    مع تحذير في مسار واجهة Gemini البرمجية لأن تلك الواجهة ترفض معامل
    `generateAudio` لتوليد فيديو Veo الحالي.
  </Accordion>
  <Accordion title="MiniMax">
    مرجع صورة واحد فقط. يقبل MiniMax دقتي `768P` و`1080P`؛ وتتم تسوية طلبات
    مثل `720P` إلى أقرب قيمة مدعومة قبل الإرسال.
  </Accordion>
  <Accordion title="OpenAI">
    يتم تمرير تجاوز `size` فقط. يتم تجاهل تجاوزات النمط الأخرى
    (`aspectRatio`، `resolution`، `audio`، `watermark`) مع تحذير.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم واجهة `/videos` غير المتزامنة الخاصة بـ OpenRouter. يرسل OpenClaw
    المهمة، ويستطلع `polling_url`، وينزّل إما `unsigned_urls` أو نقطة نهاية
    محتوى المهمة الموثّقة. يعلن الإعداد الافتراضي المضمّن `google/veo-3.1-fast`
    مددًا قدرها 4/6/8 ثوانٍ، ودقتي `720P`/`1080P`، ونسبتي عرض إلى ارتفاع
    `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    نفس خلفية DashScope مثل Alibaba. يجب أن تكون مدخلات المراجع عناوين URL
    بعيدة بصيغة `http(s)`؛ يتم رفض الملفات المحلية مسبقًا.
  </Accordion>
  <Accordion title="Runway">
    يدعم الملفات المحلية عبر معرّفات موارد البيانات. يتطلب تحويل الفيديو إلى
    فيديو `runway/gen4_aleph`. تعرض عمليات النص فقط نسبتي عرض إلى ارتفاع
    `16:9` و`9:16`.
  </Accordion>
  <Accordion title="Together">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="Vydra">
    يستخدم `https://www.vydra.ai/api/v1` مباشرة لتجنب عمليات إعادة التوجيه
    التي تسقط المصادقة. يتم تضمين `veo3` كتحويل نص إلى فيديو فقط؛ ويتطلب
    `kling` عنوان URL بعيدًا لصورة.
  </Accordion>
  <Accordion title="xAI">
    يدعم تحويل النص إلى فيديو، وتحويل صورة إطار أول واحدة إلى فيديو، وما يصل
    إلى 7 مدخلات `reference_image` عبر `reference_images` في xAI، وتدفقات
    تعديل/تمديد الفيديو البعيد.
  </Accordion>
</AccordionGroup>

## أوضاع قدرات المزوّد

يدعم عقد توليد الفيديو المشترك قدرات خاصة بالأوضاع بدلًا من حدود إجمالية
مسطحة فقط. ينبغي لتطبيقات المزوّدين الجديدة تفضيل كتل أوضاع صريحة:

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

الحقول الإجمالية المسطحة مثل `maxInputImages` و`maxInputVideos` **ليست**
كافية للإعلان عن دعم وضع التحويل. ينبغي للمزوّدين التصريح بـ `generate` و
`imageToVideo` و`videoToVideo` صراحة حتى تتمكن الاختبارات الحية واختبارات
العقد وأداة `video_generate` المشتركة من التحقق من دعم الوضع بشكل حتمي.

عندما يكون نموذج واحد لدى مزوّد ما ذا دعم أوسع لمدخلات المراجع من البقية،
استخدم `maxInputImagesByModel` أو `maxInputVideosByModel` أو
`maxInputAudiosByModel` بدلًا من رفع الحد على مستوى الوضع.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المضمّنين المشتركين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

غلاف المستودع:

```bash
pnpm test:live:media video
```

يحمّل هذا الملف الحي متغيرات بيئة المزوّدين الناقصة من `~/.profile`، ويفضّل
افتراضيًا مفاتيح واجهة برمجة التطبيقات الحية/البيئية على ملفات تعريف المصادقة
المخزنة، ويشغّل افتراضيًا اختبار دخان آمنًا للإصدار:

- `generate` لكل مزوّد غير FAL في المسح.
- موجه جراد بحر مدته ثانية واحدة.
- حد عمليات لكل مزوّد من
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضيًا).

FAL اختياري لأن زمن انتظار الطابور من جهة المزوّد قد يهيمن على وقت الإصدار:

```bash
pnpm test:live:media video --video-providers fal
```

اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل
المعلنة أيضًا التي يستطيع المسح المشترك تمرينها بأمان باستخدام وسائط محلية:

- `imageToVideo` عندما تكون `capabilities.imageToVideo.enabled`.
- `videoToVideo` عندما تكون `capabilities.videoToVideo.enabled` ويقبل
  المزوّد/النموذج إدخال فيديو محليًا مدعومًا بمخزن مؤقت في المسح المشترك.

اليوم يغطي مسار `videoToVideo` الحي المشترك `runway` فقط عندما تختار
`runway/gen4_aleph`.

## التكوين

اضبط نموذج توليد الفيديو الافتراضي في تكوين OpenClaw لديك:

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
- [المهام الخلفية](/ar/automation/tasks) - تتبع المهام لتوليد الفيديو غير المتزامن
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
