---
read_when:
    - إنشاء مقاطع فيديو عبر الوكيل
    - تهيئة موفّري ونماذج إنشاء الفيديو
    - فهم معاملات أداة video_generate
sidebarTitle: Video generation
summary: أنشئ مقاطع فيديو عبر video_generate من مراجع نصية أو صورية أو مرئية باستخدام 16 واجهة خلفية لمزودي الخدمة
title: توليد الفيديو
x-i18n:
    generated_at: "2026-07-12T06:45:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd34232a3b1a340fcd7dd51a8c5517f976b2300d86a87b56b86a35102ac2d502
    source_path: tools/video-generation.md
    workflow: 16
---

تُنشئ وكلاء OpenClaw مقاطع فيديو من مطالبات نصية أو صور مرجعية أو
مقاطع فيديو موجودة باستخدام `video_generate`. تُدعَم ست عشرة واجهة خلفية
لموفّري الخدمة؛ ويختار الوكيل الواجهة المناسبة تلقائيًا بناءً على الإعدادات
ومفاتيح API المتاحة.

<Note>
لا يظهر `video_generate` إلا عند توفر موفّر واحد على الأقل لإنشاء الفيديو.
إذا لم تجده ضمن أدوات وكيلك، فعيّن مفتاح API لموفّر أو
اضبط `agents.defaults.videoGenerationModel`.
</Note>

لدى `video_generate` ثلاثة أوضاع تشغيل، تُحدَّد من المدخلات المرجعية
في الاستدعاء:

- `generate` - بلا وسائط مرجعية (تحويل النص إلى فيديو).
- `imageToVideo` - صورة مرجعية واحدة أو أكثر.
- `videoToVideo` - فيديو مرجعي واحد أو أكثر.

يمكن للموفّرين دعم أي مجموعة فرعية من هذه الأوضاع. تتحقق الأداة من
الوضع النشط قبل الإرسال، وتعرض الأوضاع المدعومة في `action=list`.

## البدء السريع

<Steps>
  <Step title="إعداد المصادقة">
    عيّن مفتاح API لأي موفّر مدعوم:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="اختيار نموذج افتراضي (اختياري)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="طلب المهمة من الوكيل">
    > أنشئ فيديو سينمائيًا مدته 5 ثوانٍ لكركند ودود يركب الأمواج عند غروب الشمس.

    يستدعي الوكيل `video_generate` تلقائيًا. ولا حاجة إلى إدراج الأداة
    في قائمة السماح.

  </Step>
</Steps>

## آلية الإنشاء غير المتزامن

إنشاء الفيديو غير متزامن:

1. يرسل OpenClaw الطلب إلى الموفّر ويعيد معرّف المهمة فورًا.
2. يعالج الموفّر المهمة في الخلفية (عادةً من 30 ثانية إلى عدة دقائق حسب الموفّر والدقة؛ وقد تستغرق الموفّرات البطيئة المعتمدة على قوائم الانتظار حتى المهلة الزمنية المضبوطة).
3. عندما يصبح الفيديو جاهزًا، يوقظ OpenClaw الجلسة نفسها بحدث إكمال داخلي.
4. يبلّغ الوكيل عنه عبر وضع الرد المرئي المعتاد للجلسة:
   إما رد نهائي تلقائي، أو `message(action="send")` عندما تتطلب الجلسة
   أداة الرسائل. إذا كانت جلسة مقدم الطلب غير نشطة، أو فشلت عملية إيقاظها
   وظلت الوسائط المُنشأة غير موجودة في رد الإكمال، يرسل OpenClaw
   ردًا احتياطيًا مباشرًا قابلًا للتكرار بأمان يتضمن الوسائط.

أثناء تنفيذ مهمة، تعيد استدعاءات `video_generate` المكررة في الجلسة نفسها
حالة المهمة الحالية بدلًا من بدء عملية إنشاء أخرى.
استخدم `action: "status"` للتحقق دون تشغيل عملية إنشاء جديدة،
أو `openclaw tasks list` / `openclaw tasks show <lookup>` من
CLI (راجع [المهام الخلفية](/ar/automation/tasks)).

خارج عمليات تشغيل الوكيل المدعومة بجلسة (مثل استدعاءات الأدوات المباشرة)،
تعود الأداة إلى الإنشاء المضمّن وتعيد مسار الوسائط النهائي
في الدورة نفسها.

تُحفَظ ملفات الفيديو المُنشأة ضمن تخزين الوسائط الذي يديره OpenClaw عندما
يعيد الموفّر البيانات الثنائية. الحد الافتراضي هو 16 ميغابايت (حد وسائط
الفيديو المشترك)؛ ويرفعه `agents.defaults.mediaMaxMb` لعمليات التصيير الأكبر.
عندما يعيد الموفّر أيضًا عنوان URL مستضافًا للمخرجات، يرسل OpenClaw عنوان URL
هذا بدلًا من إفشال المهمة إذا رفض التخزين المحلي ملفًا يتجاوز الحجم المسموح.

### دورة حياة المهمة

| الحالة     | المعنى                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `queued`    | أُنشئت المهمة وهي تنتظر أن يقبلها الموفّر.                                                        |
| `running`   | يعالج الموفّر المهمة (عادةً من 30 ثانية إلى عدة دقائق حسب الموفّر والدقة).                         |
| `succeeded` | أصبح الفيديو جاهزًا؛ يستيقظ الوكيل وينشره في المحادثة.                                            |
| `failed`    | حدث خطأ لدى الموفّر أو انتهت المهلة؛ يستيقظ الوكيل مع تفاصيل الخطأ.                               |

تحقق من الحالة عبر CLI:

```bash
openclaw tasks list
openclaw tasks show <lookup>
openclaw tasks cancel <lookup>
```

## الموفّرون المدعومون

| الموفّر               | النموذج الافتراضي                | نص | مرجع صورة                                            | مرجع فيديو                                      | المصادقة                                |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                 | نعم (عنوان URL بعيد)                            | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | حتى صورتين (لنماذج I2V فقط؛ الإطار الأول + الأخير)  | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | حتى صورتين (الإطار الأول + الأخير عبر الدور)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | حتى 9 صور مرجعية                                     | حتى 3 مقاطع فيديو                               | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | صورة واحدة                                           | -                                               | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | صورة واحدة؛ وحتى 9 مع تحويل المرجع إلى فيديو في Seedance | حتى 3 مقاطع فيديو مع تحويل المرجع إلى فيديو في Seedance | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | صورة واحدة                                           | فيديو واحد                                      | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | صورة واحدة                                           | -                                               | `MINIMAX_API_KEY` أو MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | صورة واحدة                                           | فيديو واحد                                      | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | حتى 4 صور (الإطار الأول/الأخير أو المراجع)           | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                 | نعم (عنوان URL بعيد)                            | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | صورة واحدة                                           | فيديو واحد                                      | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | `Wan-AI/Wan2.2-I2V-A14B` فقط                         | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | صورة واحدة (`kling`)                                 | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | الكلاسيكي: إطار أول واحد أو 7 مراجع؛ 1.5: إطار واحد | الكلاسيكي: فيديو واحد                           | `XAI_API_KEY`                            |

تقبل بعض الجهات الموفّرة متغيرات بيئة إضافية أو بديلة لمفاتيح API. راجع
[صفحات الموفّرين](#related) الفردية للاطلاع على التفاصيل.

شغّل `video_generate action=list` لفحص الموفّرين والنماذج وأوضاع
التشغيل المتاحة أثناء التشغيل.

### مصفوفة الإمكانات

عقد الأوضاع الصريح الذي يستخدمه `video_generate` واختبارات العقود
والفحص المباشر المشترك:

| الموفّر    | `generate` | `imageToVideo` | `videoToVideo` | مسارات الاختبار المباشر المشتركة حاليًا                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يُتخطى `videoToVideo` لأن هذا الموفّر يحتاج إلى عناوين URL بعيدة للفيديو ببروتوكول `http(s)`                  |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | غير مشمول في الفحص المشترك؛ تغطية سير العمل المحددة موجودة ضمن اختبارات Comfy                                                            |
| DeepInfra  |     ✓      |       -        |       -        | `generate`؛ مخططات الفيديو الأصلية في DeepInfra مخصصة لتحويل النص إلى فيديو ضمن عقد Plugin                                               |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يتوفر `videoToVideo` فقط عند استخدام تحويل المرجع إلى فيديو في Seedance                                     |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يُتخطى `videoToVideo` المشترك لأن فحص Gemini/Veo الحالي المعتمد على المخزن المؤقت لا يقبل هذا الإدخال          |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يُتخطى `videoToVideo` المشترك لأن مسار المؤسسة/الإدخال هذا يحتاج حاليًا إلى صلاحية تحرير الفيديو لدى الموفّر |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يُتخطى `videoToVideo` لأن هذا الموفّر يحتاج إلى عناوين URL بعيدة للفيديو ببروتوكول `http(s)`                  |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ لا يعمل `videoToVideo` إلا عندما يكون النموذج المحدد هو `runway/gen4_aleph`                                  |
| Together   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`؛ يُتخطى `imageToVideo` المشترك لأن `veo3` المضمّن يدعم النص فقط، بينما يتطلب `kling` المضمّن عنوان URL بعيدًا للصورة           |
| xAI        |     ✓      |       ✓        |       ✓        | الإصدار الكلاسيكي يدعم جميع الأوضاع؛ وVideo 1.5 يدعم تحويل الصورة إلى فيديو فقط؛ ويؤدي إدخال MP4 بعيد إلى استبعاد `videoToVideo` من الفحص المشترك |

## معاملات الأداة

### مطلوبة

<ParamField path="prompt" type="string" required>
  وصف نصي للفيديو المراد إنشاؤه. مطلوب عند `action: "generate"`.
</ParamField>

### مدخلات المحتوى

<ParamField path="image" type="string">صورة مرجعية واحدة (مسار أو عنوان URL).</ParamField>
<ParamField path="images" type="string[]">صور مرجعية متعددة (حتى 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
تلميحات اختيارية للأدوار حسب الموضع، موازية لقائمة الصور المجمعة.
القيم القياسية: `first_frame`، و`last_frame`، و`reference_image`.
</ParamField>
<ParamField path="video" type="string">فيديو مرجعي واحد (مسار أو عنوان URL).</ParamField>
<ParamField path="videos" type="string[]">مقاطع فيديو مرجعية متعددة (حتى 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
تلميحات اختيارية للأدوار حسب الموضع، موازية لقائمة مقاطع الفيديو المجمعة.
القيمة القياسية: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
مقطع صوتي مرجعي واحد (مسار أو عنوان URL). يُستخدم للموسيقى الخلفية أو كمرجع
صوتي عندما يدعم الموفّر مدخلات الصوت.
</ParamField>
<ParamField path="audioRefs" type="string[]">مقاطع صوتية مرجعية متعددة (حتى 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
تلميحات اختيارية للأدوار حسب الموضع، موازية لقائمة المقاطع الصوتية المجمعة.
القيمة القياسية: `reference_audio`.
</ParamField>

<Note>
تُمرَّر تلميحات الأدوار إلى الموفّر كما هي. تأتي القيم القياسية من
اتحاد `VideoGenerationAssetRole`، لكن قد تقبل الموفّرات سلاسل أدوار إضافية.
يجب ألا تحتوي مصفوفات `*Roles` على إدخالات أكثر من القائمة المرجعية
المقابلة؛ إذ تؤدي أخطاء الزيادة أو النقصان بمقدار واحد إلى فشل مصحوب بخطأ واضح.
استخدم سلسلة فارغة لترك خانة دون تعيين. بالنسبة إلى xAI، عيّن دور كل صورة إلى
`reference_image` لاستخدام وضع التوليد `reference_images`؛ احذف الدور
أو استخدم `first_frame` لتحويل صورة واحدة إلى فيديو.
</Note>

### عناصر التحكم في النمط

<ParamField path="aspectRatio" type="string">
  تلميح لنسبة العرض إلى الارتفاع مثل `1:1`، أو `16:9`، أو `9:16`، أو `adaptive`، أو قيمة خاصة بالموفّر. يطبّع OpenClaw القيم غير المدعومة أو يتجاهلها بحسب الموفّر.
</ParamField>
<ParamField path="resolution" type="string">تلميح للدقة مثل `360P`، أو `480P`، أو `540P`، أو `720P`، أو `768P`، أو `1080P`، أو `4K`، أو قيمة خاصة بالموفّر. يطبّع OpenClaw القيم غير المدعومة أو يتجاهلها بحسب الموفّر.</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني (مقربة إلى أقرب قيمة يدعمها الموفّر).
</ParamField>
<ParamField path="size" type="string">تلميح للحجم عندما يدعمه الموفّر.</ParamField>
<ParamField path="audio" type="boolean">
  تمكين الصوت المولّد في المخرجات عند دعمه. يختلف عن `audioRef*` (المدخلات).
</ParamField>
<ParamField path="watermark" type="boolean">تبديل العلامة المائية للموفّر عند دعمها.</ParamField>

`adaptive` قيمة إشارة خاصة بالموفّر: تُمرَّر كما هي إلى
الموفّرين الذين يعلنون `adaptive` ضمن إمكاناتهم (على سبيل المثال، يستخدمها
BytePlus Seedance لاكتشاف النسبة تلقائيًا من أبعاد الصورة المدخلة).
تعرض الموفّرات التي لا تعلن دعمها القيمة عبر
`details.ignoredOverrides` في نتيجة الأداة، بحيث يكون إسقاطها ظاهرًا.

### متقدم

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` الموفّرين.
</ParamField>
<ParamField path="model" type="string">تجاوز الموفّر/النموذج (مثل `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">تلميح لاسم ملف المخرجات.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لعملية الموفّر بالمللي ثانية. عند حذفها، يستخدم OpenClaw القيمة `agents.defaults.videoGenerationModel.timeoutMs` إذا كانت مضبوطة، وإلا يستخدم القيمة الافتراضية التي حددها مؤلف Plugin للموفّر عند توفرها.</ParamField>
<ParamField path="providerOptions" type="object">
  خيارات خاصة بالموفّر في صورة كائن JSON (مثل `{"seed": 42, "draft": true}`).
  تتحقق الموفّرات التي تعلن مخططًا ذا أنواع محددة من المفاتيح والأنواع؛ وتتجاوز
  المفاتيح المجهولة أو حالات عدم التطابق المرشح أثناء الرجوع الاحتياطي. تتلقى الموفّرات التي لا
  تعلن مخططًا الخيارات كما هي. شغّل `video_generate action=list`
  لمعرفة ما يقبله كل موفّر.
</ParamField>

<Note>
لا تدعم جميع الموفّرات جميع المعلمات. يطبّع OpenClaw المدة إلى
أقرب قيمة يدعمها الموفّر، ويعيد تعيين تلميحات الأبعاد المحوّلة،
مثل تحويل الحجم إلى نسبة العرض إلى الارتفاع، عندما يوفّر موفّر الرجوع الاحتياطي
واجهة تحكم مختلفة. تُتجاهل التجاوزات غير المدعومة فعليًا على أساس بذل
أفضل جهد، ويُبلّغ عنها كتحذيرات في نتيجة الأداة. تفشل حدود الإمكانات
الصارمة (مثل العدد الزائد من المدخلات المرجعية) قبل الإرسال. تعرض نتائج الأداة
الإعدادات المطبقة؛ ويسجل `details.normalization` أي
تحويل من القيمة المطلوبة إلى القيمة المطبقة.
</Note>

تحدد المدخلات المرجعية وضع وقت التشغيل:

- عدم وجود وسائط مرجعية -> `generate`
- وجود أي مرجع صوري -> `imageToVideo`
- وجود أي مرجع فيديو -> `videoToVideo`
- مدخلات الصوت المرجعية **لا** تغيّر الوضع المحسوم؛ بل تُطبّق فوق
  أي وضع تحدده مراجع الصور/الفيديو، ولا تعمل إلا
  مع الموفّرين الذين يعلنون `maxInputAudios`.

لا يُعد خلط مراجع الصور والفيديو واجهة إمكانات مشتركة مستقرة.
يُفضّل استخدام نوع مرجعي واحد لكل طلب.

#### الرجوع الاحتياطي والخيارات ذات الأنواع المحددة

تُطبّق بعض عمليات التحقق من الإمكانات في طبقة الرجوع الاحتياطي بدلًا من حدود
الأداة، لذا يمكن لطلب يتجاوز حدود الموفّر الأساسي أن يعمل مع موفّر
رجوع احتياطي قادر:

- يُتجاوز المرشح النشط الذي لا يعلن `maxInputAudios` (أو يعلن `0`) عندما
  يحتوي الطلب على مراجع صوتية؛ ثم تُجرّب المرشح التالي. ينطبق التحقق نفسه
  على أعداد مراجع الصور والفيديو مقارنةً بـ
  `maxInputImages`/`maxInputVideos`.
- إذا كانت قيمة `maxDurationSeconds` للمرشح النشط أقل من `durationSeconds`
  المطلوبة، من دون قائمة `supportedDurationSeconds` معلنة، فيُتجاوز.
- إذا كان الطلب يحتوي على `providerOptions` وكان المرشح النشط يعلن صراحةً
  مخطط `providerOptions` ذا أنواع محددة، فيُتجاوز إذا لم تكن المفاتيح المقدمة
  موجودة في المخطط أو لم تتطابق أنواع القيم. تتلقى الموفّرات التي لا
  تعلن مخططًا الخيارات كما هي (تمرير مباشر متوافق مع الإصدارات
  السابقة). يمكن للموفّر رفض جميع خيارات الموفّر من خلال
  إعلان مخطط فارغ (`capabilities.providerOptions: {}`)، ما
  يؤدي إلى التجاوز نفسه الناتج عن عدم تطابق النوع.

يُسجّل سبب التجاوز الأول في الطلب بالمستوى `warn` حتى يرى المشغّلون
متى جرى تجاوز موفّرهم الأساسي؛ وتُسجّل التجاوزات اللاحقة بالمستوى `debug`
لإبقاء سلاسل الرجوع الاحتياطي الطويلة هادئة. إذا جرى تجاوز كل المرشحين،
يتضمن الخطأ المجمّع سبب تجاوز كل واحد منهم.

## الإجراءات

| الإجراء    | ما يفعله                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | الإجراء الافتراضي. ينشئ فيديو من الموجّه المحدد والمدخلات المرجعية الاختيارية.                          |
| `status`   | يتحقق من حالة مهمة الفيديو الجارية للجلسة الحالية من دون بدء عملية توليد أخرى.                           |
| `list`     | يعرض الموفّرين والنماذج المتاحة وإمكاناتها.                                                               |

## اختيار النموذج

يحدد OpenClaw النموذج بالترتيب التالي:

1. **معلمة الأداة `model`** - إذا حدد الوكيل واحدة في الاستدعاء.
2. **`videoGenerationModel.primary`** من الإعدادات.
3. **`videoGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** - الموفّرون الذين لديهم مصادقة صالحة، بدءًا من
   الموفّر الافتراضي الحالي، ثم بقية الموفّرين بالترتيب
   الأبجدي.

إذا فشل موفّر، تُجرّب المرشح التالي تلقائيًا. وإذا فشل جميع
المرشحين، يتضمن الخطأ تفاصيل كل محاولة.

عيّن `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model` و`primary` و`fallbacks` الصريحة فقط.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
        timeoutMs: 180000, // تجاوز اختياري لمهلة طلب الموفّر لكل أداة
      },
    },
  },
}
```

## ملاحظات الموفّرين

<AccordionGroup>
  <Accordion title="Alibaba">
    يستخدم نقطة نهاية DashScope / Model Studio غير المتزامنة. يجب أن تكون الصور
    ومقاطع الفيديو المرجعية عناوين URL بعيدة من نوع `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    معرّف الموفّر: `byteplus`.

    النماذج: `seedance-1-0-pro-250528` (الافتراضي)،
    `seedance-1-0-pro-t2v-250528`، و`seedance-1-0-pro-fast-251015`،
    و`seedance-1-0-lite-t2v-250428`، و`seedance-1-0-lite-i2v-250428`.

    لا تقبل نماذج T2V (`*-t2v-*`) مدخلات الصور؛ بينما تدعم نماذج I2V
    ونماذج `*-pro-*` العامة صورة مرجعية واحدة (الإطار
    الأول). مرّر الصورة حسب الموضع أو عيّن `role: "first_frame"`.
    تُحوّل معرّفات نماذج T2V تلقائيًا إلى إصدار I2V
    المقابل عند تقديم صورة.

    مفاتيح `providerOptions` المدعومة: `seed` (عدد)، و`draft` (قيمة منطقية -
    تفرض 480p)، و`camera_fixed` (قيمة منطقية).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    يتطلب Plugin ‏[`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (خارجي وغير مضمّن). معرّف الموفّر: `byteplus-seedance15`. النموذج:
    `seedance-1-5-pro-251215`.

    يستخدم واجهة API الموحدة `content[]`. يدعم صورتين مدخلتين كحد أقصى
    (`first_frame` + `last_frame`). يجب أن تكون جميع المدخلات عناوين URL بعيدة
    من نوع `https://`. عيّن `role: "first_frame"` / `"last_frame"` لكل صورة، أو
    مرّر الصور حسب الموضع.

    تكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من الصورة المدخلة.
    تُربط `audio: true` بـ `generate_audio`. وتُمرّر `providerOptions.seed`
    (عدد).

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    يتطلب Plugin ‏[`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark)
    (خارجي وغير مضمّن). معرّف الموفّر: `byteplus-seedance2`. النماذج:
    `dreamina-seedance-2-0-260128`،
    و`dreamina-seedance-2-0-fast-260128`.

    يستخدم واجهة API الموحدة `content[]`. يدعم ما يصل إلى 9 صور مرجعية،
    و3 مقاطع فيديو مرجعية، و3 مقاطع صوتية مرجعية. يجب أن تكون جميع المدخلات عناوين URL بعيدة
    من نوع `https://`. عيّن `role` لكل أصل؛ القيم المدعومة:
    `"first_frame"`، و`"last_frame"`، و`"reference_image"`،
    و`"reference_video"`، و`"reference_audio"`.

    تكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من الصورة المدخلة.
    تُربط `audio: true` بـ `generate_audio`. وتُمرّر `providerOptions.seed`
    (عدد).

  </Accordion>
  <Accordion title="ComfyUI">
    تنفيذ محلي أو سحابي قائم على سير العمل. يدعم تحويل النص إلى فيديو
    وتحويل الصورة إلى فيديو عبر الرسم البياني المُهيأ.
  </Accordion>
  <Accordion title="fal">
    يستخدم تدفقًا مدعومًا بقائمة انتظار للمهام طويلة التشغيل. ينتظر OpenClaw مدة تصل إلى 20
    دقيقة افتراضيًا قبل اعتبار مهمة قائمة انتظار fal قيد التنفيذ قد انتهت
    مهلتها. تقبل معظم نماذج الفيديو في fal
    مرجع صورة واحدًا. تقبل نماذج Seedance 2.0 لتحويل المراجع إلى فيديو
    ما يصل إلى 9 صور و3 مقاطع فيديو و3 مراجع صوتية، بحد
    أقصى يبلغ 12 ملفًا مرجعيًا إجمالًا.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    يدعم مرجع صورة واحدًا أو مرجع فيديو واحدًا. تُتجاهل طلبات الصوت المُولَّد
    مع تحذير في مسار Gemini API لأن واجهة API هذه ترفض
    المعامل `generateAudio` لتوليد فيديو Veo الحالي.
  </Accordion>
  <Accordion title="MiniMax">
    مرجع صورة واحد فقط. يقبل MiniMax الدقتين `768P` و`1080P`؛
    وتُطبَّع الطلبات مثل `720P` إلى أقرب قيمة
    مدعومة قبل الإرسال.
  </Accordion>
  <Accordion title="OpenAI">
    لا يُمرَّر سوى تجاوز `size`. أما تجاوزات النمط الأخرى
    (`aspectRatio` و`resolution` و`audio` و`watermark`) فتُتجاهل
    مع تحذير.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم واجهة API غير المتزامنة `/videos` في OpenRouter. يرسل OpenClaw
    المهمة، ويستطلع `polling_url`، ثم ينزّل إما `unsigned_urls` أو
    نقطة نهاية محتوى المهمة الموثقة. يعلن الإعداد الافتراضي المضمّن `google/veo-3.1-fast`
    عن مدد تبلغ 4/6/8 ثوانٍ، ودقتي `720P`/`1080P`،
    ونسبتي أبعاد `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    يستخدم الواجهة الخلفية DashScope نفسها التي تستخدمها Alibaba. يجب أن تكون مُدخلات المراجع عناوين URL بعيدة
    من نوع `http(s)`؛ وتُرفض الملفات المحلية مسبقًا.
  </Accordion>
  <Accordion title="Runway">
    يدعم الملفات المحلية عبر معرّفات URI للبيانات. يتطلب تحويل الفيديو إلى فيديو
    `runway/gen4_aleph`. تتيح عمليات التشغيل النصية فقط نسبتي
    الأبعاد `16:9` و`9:16`.
  </Accordion>
  <Accordion title="Together">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="Vydra">
    يستخدم `https://www.vydra.ai/api/v1` مباشرةً لتجنب عمليات إعادة التوجيه
    التي تُسقط المصادقة. يُضمَّن `veo3` لتحويل النص إلى فيديو فقط؛ ويتطلب `kling`
    عنوان URL بعيدًا لصورة.
  </Accordion>
  <Accordion title="xAI">
    يدعم النموذج الافتراضي `grok-imagine-video` تحويل النص إلى فيديو، وتحويل
    صورة إطار أول واحدة إلى فيديو، وما يصل إلى 7 مُدخلات `reference_image` عبر
    `reference_images` في xAI، ومسارات تحرير/تمديد الفيديو البعيد. تكون دقة التوليد
    الافتراضية `480P`؛ ويرث تحويل صورة واحدة إلى فيديو نسبة أبعاد المصدر عند
    حذف `aspectRatio`. يرث تحرير/تمديد الفيديو أبعاد المُدخل
    ولا يقبل تجاوزات نسبة الأبعاد أو الدقة. يقبل التمديد مدة من 2 إلى 10
    ثوانٍ.

    يقتصر `grok-imagine-video-1.5` على تحويل الصورة إلى فيديو: قدّم صورة واحدة بالضبط.
    وهو يدعم مدة من 1 إلى 15 ثانية ودقات `480P` أو `720P` أو `1080P`، مع اعتماد
    `480P` افتراضيًا؛ احذف `aspectRatio` لوراثة نسبة أبعاد صورة المصدر. تخضع معرّفات
    المعاينة والمعرّفات المؤرخة للإصدار 1.5 للتحقق نفسه وتُمرَّر
    دون تغيير.

  </Accordion>
</AccordionGroup>

## أوضاع إمكانات المزوّد

يدعم العقد المشترك لتوليد الفيديو إمكانات خاصة بكل وضع
بدلًا من الاقتصار على حدود إجمالية مسطحة. ينبغي لتنفيذات المزوّدين الجديدة
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
**ليست** كافية للإعلان عن دعم أوضاع التحويل. ينبغي للمزوّدين
التصريح صراحةً عن `generate` و`imageToVideo` و`videoToVideo` حتى تتمكن
الاختبارات الحية واختبارات العقد وأداة `video_generate` المشتركة من التحقق
من دعم الأوضاع بصورة حتمية.

عندما يدعم نموذج واحد لدى مزوّد نطاقًا أوسع من مُدخلات المراجع مقارنةً
ببقية النماذج، استخدم `maxInputImagesByModel` أو `maxInputVideosByModel` أو
`maxInputAudiosByModel` بدلًا من رفع الحد على مستوى الوضع بالكامل.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المشتركين المضمّنين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

مغلّف المستودع:

```bash
pnpm test:live:media video
```

يستخدم ملف الاختبار الحي هذا متغيرات بيئة المزوّد المُصدَّرة مسبقًا قبل ملفات تعريف المصادقة
المخزنة افتراضيًا، ويشغّل اختبارًا تمهيديًا آمنًا للإصدار افتراضيًا:

- `generate` لكل مزوّد غير FAL في عملية الفحص.
- موجّه كركند مدته ثانية واحدة.
- حد زمني لكل عملية مزوّد من
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (قيمته الافتراضية `180000`).

يكون FAL اختياريًا لأن زمن انتقال قائمة الانتظار لدى المزوّد قد يهيمن على وقت
الإصدار:

```bash
pnpm test:live:media video --video-providers fal
```

عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع
التحويل المعلنة أيضًا، والتي يمكن لعملية الفحص المشتركة تنفيذها بأمان باستخدام وسائط محلية:

- `imageToVideo` عندما تكون `capabilities.imageToVideo.enabled`.
- `videoToVideo` عندما تكون `capabilities.videoToVideo.enabled` ويقبل
  المزوّد/النموذج مُدخل فيديو محليًا مدعومًا بمخزن مؤقت ضمن عملية
  الفحص المشتركة.

حاليًا، يغطي مسار الاختبار الحي المشترك `videoToVideo` المزوّد `runway` فقط عند
اختيار `runway/gen4_aleph`.

## الإعداد

عيّن نموذج توليد الفيديو الافتراضي في إعداد OpenClaw لديك:

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
- [المهام الخلفية](/ar/automation/tasks) - تتبّع المهام لتوليد الفيديو غير المتزامن
- [BytePlus](/ar/concepts/model-providers#byteplus-international)
- [ComfyUI](/ar/providers/comfy)
- [مرجع الإعداد](/ar/gateway/config-agents#agent-defaults)
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
