---
read_when:
    - إنشاء مقاطع فيديو عبر الوكيل
    - تكوين موفّري ونماذج إنشاء الفيديو
    - فهم معلمات أداة video_generate
sidebarTitle: Video generation
summary: إنشاء مقاطع فيديو عبر `video_generate` من مراجع نصية أو صورية أو فيديو عبر 16 واجهة خلفية لمزوّدي الخدمة
title: إنشاء الفيديو
x-i18n:
    generated_at: "2026-06-27T18:47:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64c8a3191262613a1acf684496570a6dd8893ebb3a2a7e5ae41337d58555c401
    source_path: tools/video-generation.md
    workflow: 16
---

يمكن لوكلاء OpenClaw إنشاء مقاطع فيديو من مطالبات نصية أو صور مرجعية أو
مقاطع فيديو موجودة. تُدعَم ست عشرة واجهة خلفية لمزوّدي الخدمة، ولكل منها
خيارات نماذج وأوضاع إدخال ومجموعات ميزات مختلفة. يختار الوكيل المزوّد
المناسب تلقائيًا بناءً على إعداداتك ومفاتيح API المتاحة.

<Note>
لا تظهر أداة `video_generate` إلا عند توفر مزوّد واحد على الأقل لإنشاء
الفيديو. إذا لم ترها ضمن أدوات الوكيل، فعيّن مفتاح API لمزوّد أو اضبط
`agents.defaults.videoGenerationModel`.
</Note>

يتعامل OpenClaw مع إنشاء الفيديو كثلاثة أوضاع وقت تشغيل:

- `generate` - طلبات تحويل النص إلى فيديو من دون وسائط مرجعية.
- `imageToVideo` - يتضمن الطلب صورة مرجعية واحدة أو أكثر.
- `videoToVideo` - يتضمن الطلب فيديو مرجعيًا واحدًا أو أكثر.

يمكن للمزوّدين دعم أي مجموعة فرعية من تلك الأوضاع. تتحقق الأداة من
الوضع النشط قبل الإرسال وتعرض الأوضاع المدعومة في `action=list`.

## البدء السريع

<Steps>
  <Step title="ضبط المصادقة">
    عيّن مفتاح API لأي مزوّد مدعوم:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="اختيار نموذج افتراضي (اختياري)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="اسأل الوكيل">
    > أنشئ فيديو سينمائيًا مدته 5 ثوان لكركند ودود يركب الأمواج عند الغروب.

    يستدعي الوكيل `video_generate` تلقائيًا. لا حاجة إلى إدراج الأداة
    في قائمة السماح.

  </Step>
</Steps>

## كيف يعمل الإنشاء غير المتزامن

إنشاء الفيديو غير متزامن. عندما يستدعي الوكيل `video_generate` في
جلسة:

1. يرسل OpenClaw الطلب إلى المزوّد ويعيد فورًا معرّف مهمة.
2. يعالج المزوّد المهمة في الخلفية (عادةً من 30 ثانية إلى عدة دقائق بحسب المزوّد والدقة؛ ويمكن للمزوّدين البطيئين المعتمدين على قوائم الانتظار أن يعملوا حتى انتهاء المهلة المضبوطة).
3. عندما يصبح الفيديو جاهزًا، يوقظ OpenClaw الجلسة نفسها بحدث إكمال داخلي.
4. يخبر الوكيل المستخدم عبر وضع الرد المرئي العادي للجلسة:
   تسليم الرد النهائي عند كونه تلقائيًا، أو `message(action="send")` عندما
   تتطلب الجلسة أداة الرسائل. إذا كانت جلسة الطالب غير نشطة أو فشل
   إيقاظها النشط، وكان بعض الفيديو المولّد لا يزال غير مضمّن في
   رد الإكمال، يرسل OpenClaw نسخة احتياطية مباشرة ثابتة التأثير تحتوي فقط على
   الفيديو المفقود.

أثناء تنفيذ مهمة، تعيد استدعاءات `video_generate` المكررة في الجلسة نفسها
حالة المهمة الحالية بدلًا من بدء إنشاء آخر. استخدم `openclaw tasks list` أو `openclaw tasks show <taskId>` للتحقق من التقدم من
CLI.

خارج عمليات تشغيل الوكيل المدعومة بجلسة (مثلًا، استدعاءات الأداة المباشرة)،
تعود الأداة إلى الإنشاء المضمن وتعيد مسار الوسائط النهائي
في الدور نفسه.

تُحفَظ ملفات الفيديو المولّدة ضمن تخزين الوسائط المُدار من OpenClaw عندما
يعيد المزوّد بايتات. يتبع حد الحفظ الافتراضي للفيديو المولّد
حد وسائط الفيديو، ويرفعه `agents.defaults.mediaMaxMb` لعمليات التصيير
الأكبر. عندما يعيد مزوّد أيضًا عنوان URL لمخرجات مستضافة، يمكن لـ OpenClaw
تسليم ذلك العنوان بدلًا من إفشال المهمة إذا رفض التخزين المحلي
ملفًا يتجاوز الحجم المسموح.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `queued`    | أُنشئت المهمة، وتنتظر قبول المزوّد لها.                                                   |
| `running`   | يعالجها المزوّد (عادةً من 30 ثانية إلى عدة دقائق بحسب المزوّد والدقة). |
| `succeeded` | الفيديو جاهز؛ يستيقظ الوكيل وينشره في المحادثة.                                         |
| `failed`    | خطأ من المزوّد أو انتهاء المهلة؛ يستيقظ الوكيل مع تفاصيل الخطأ.                                         |

تحقق من الحالة من CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

إذا كانت مهمة فيديو بالفعل في حالة `queued` أو `running` للجلسة الحالية،
فإن `video_generate` يعيد حالة المهمة الموجودة بدلًا من بدء مهمة جديدة.
استخدم `action: "status"` للتحقق صراحةً من دون تشغيل إنشاء جديد.

## المزوّدون المدعومون

| المزوّد              | النموذج الافتراضي                   | النص | مرجع صورة                                            | مرجع فيديو                                       | المصادقة                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | حتى صورتين (نماذج I2V فقط؛ الإطار الأول + الأخير) | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | حتى صورتين (الإطار الأول + الأخير عبر الدور)         | -                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | حتى 9 صور مرجعية                             | حتى 3 مقاطع فيديو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | صورة واحدة                                              | -                                               | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                    | -                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | صورة واحدة؛ حتى 9 مع مرجع Seedance إلى فيديو    | حتى 3 مقاطع فيديو مع مرجع Seedance إلى فيديو | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | صورة واحدة                                              | -                                               | `MINIMAX_API_KEY` أو MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | حتى 4 صور (الإطار الأول/الأخير أو مراجع)      | -                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | نعم (عنوان URL بعيد)                                     | نعم (عنوان URL بعيد)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | `Wan-AI/Wan2.2-I2V-A14B` فقط                        | -                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | صورة واحدة (`kling`)                                    | -                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | صورة إطار أول واحدة أو حتى 7 `reference_image`s    | فيديو واحد                                         | `XAI_API_KEY`                            |

يقبل بعض المزوّدين متغيرات بيئة إضافية أو بديلة لمفاتيح API. راجع
[صفحات المزوّدين](#related) الفردية للحصول على التفاصيل.

شغّل `video_generate action=list` لفحص المزوّدين والنماذج وأوضاع
وقت التشغيل المتاحة أثناء التشغيل.

### مصفوفة القدرات

عقد الوضع الصريح الذي تستخدمه `video_generate`، واختبارات العقد، و
الفحص الحي المشترك:

| المزوّد   | `generate` | `imageToVideo` | `videoToVideo` | مسارات الاختبار الحية المشتركة اليوم                                                                                                                 |
| ---------- | :--------: | :------------: | :------------: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين URL فيديو بعيدة `http(s)`                              |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| ComfyUI    |     ✓      |       ✓        |       -        | ليس ضمن الفحص المشترك؛ تغطية سير العمل المحددة تعيش مع اختبارات Comfy                                                              |
| DeepInfra  |     ✓      |       -        |       -        | `generate`؛ مخططات الفيديو الأصلية في DeepInfra هي تحويل النص إلى فيديو في عقد Plugin                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط عند استخدام مرجع Seedance إلى فيديو                                                  |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` المشترك لأن فحص Gemini/Veo الحالي المدعوم بالمخزن المؤقت لا يقبل ذلك الإدخال |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` المشترك لأن مسار المؤسسة/الإدخال هذا يحتاج حاليًا إلى وصول تحرير الفيديو من جهة المزوّد   |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين URL فيديو بعيدة `http(s)`                              |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يعمل `videoToVideo` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`                                     |
| Together   |     ✓      |       ✓        |       -        | `generate`، `imageToVideo`                                                                                                              |
| Vydra      |     ✓      |       ✓        |       -        | `generate`؛ تم تخطي `imageToVideo` المشترك لأن `veo3` المضمّن نصي فقط و`kling` المضمّن يتطلب عنوان URL لصورة بعيدة           |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ تم تخطي `videoToVideo` لأن هذا المزوّد يحتاج حاليًا إلى عنوان URL بعيد بصيغة MP4                               |

## معلمات الأداة

### مطلوب

<ParamField path="prompt" type="string" required>
  وصف نصي للفيديو المراد إنشاؤه. مطلوب عند `action: "generate"`.
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
تلميحات أدوار اختيارية لكل موضع، بالتوازي مع قائمة الفيديوهات المدمجة.
القيمة القياسية: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
صوت مرجعي واحد (مسار أو URL). يُستخدم للموسيقى الخلفية أو مرجع الصوت
عندما يدعم الموفر مدخلات الصوت.
</ParamField>
<ParamField path="audioRefs" type="string[]">ملفات صوت مرجعية متعددة (حتى 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، بالتوازي مع قائمة الصوت المدمجة.
القيمة القياسية: `reference_audio`.
</ParamField>

<Note>
تُمرَّر تلميحات الأدوار إلى الموفر كما هي. تأتي القيم القياسية من
اتحاد `VideoGenerationAssetRole`، لكن قد يقبل الموفرون سلاسل أدوار
إضافية. يجب ألا تحتوي مصفوفات `*Roles` على إدخالات أكثر من قائمة المراجع
المقابلة؛ تفشل أخطاء الإزاحة بمقدار واحد مع خطأ واضح.
استخدم سلسلة فارغة لترك خانة غير مضبوطة. بالنسبة إلى xAI، عيّن كل دور صورة إلى
`reference_image` لاستخدام وضع الإنشاء `reference_images` الخاص به؛ احذف
الدور أو استخدم `first_frame` لتحويل صورة واحدة إلى فيديو.
</Note>

### عناصر التحكم في النمط

<ParamField path="aspectRatio" type="string">
  تلميح نسبة العرض إلى الارتفاع مثل `1:1` أو `16:9` أو `9:16` أو `adaptive` أو قيمة خاصة بالموفر. يطبّع OpenClaw القيم غير المدعومة أو يتجاهلها حسب الموفر.
</ParamField>
<ParamField path="resolution" type="string">تلميح الدقة مثل `480P` أو `720P` أو `768P` أو `1080P` أو `4K` أو قيمة خاصة بالموفر. يطبّع OpenClaw القيم غير المدعومة أو يتجاهلها حسب الموفر.</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني (مقرّبة إلى أقرب قيمة يدعمها الموفر).
</ParamField>
<ParamField path="size" type="string">تلميح الحجم عندما يدعمه الموفر.</ParamField>
<ParamField path="audio" type="boolean">
  تفعيل الصوت المُنشأ في المخرجات عند دعمه. يختلف عن `audioRef*` (المدخلات).
</ParamField>
<ParamField path="watermark" type="boolean">تبديل العلامة المائية للموفر عند دعمها.</ParamField>

`adaptive` هو محدد خاص بالموفر: يُمرَّر كما هو إلى
الموفرين الذين يعلنون `adaptive` ضمن إمكاناتهم (مثلًا يستخدمه BytePlus
Seedance لاكتشاف النسبة تلقائيًا من أبعاد صورة الإدخال).
الموفرون الذين لا يعلنونه يعرضون القيمة عبر
`details.ignoredOverrides` في نتيجة الأداة بحيث يكون الإسقاط مرئيًا.

### متقدم

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` الموفرين.
</ParamField>
<ParamField path="model" type="string">تجاوز الموفر/النموذج (مثل `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لعملية الموفر بالمللي ثانية. عند حذفها، يستخدم OpenClaw `agents.defaults.videoGenerationModel.timeoutMs` إذا كانت مهيأة، وإلا يستخدم القيمة الافتراضية للموفر التي ألّفها Plugin عند وجودها.</ParamField>
<ParamField path="providerOptions" type="object">
  خيارات خاصة بالموفر ككائن JSON (مثل `{"seed": 42, "draft": true}`).
  يتحقق الموفرون الذين يعلنون مخططًا ذا أنواع من المفاتيح والأنواع؛ وتؤدي
  المفاتيح غير المعروفة أو حالات عدم التطابق إلى تخطي المرشح أثناء الرجوع الاحتياطي. يتلقى الموفرون الذين لا
  يعلنون مخططًا الخيارات كما هي. شغّل `video_generate action=list`
  لمعرفة ما يقبله كل موفر.
</ParamField>

<Note>
لا يدعم جميع الموفرين كل المعلمات. يطبّع OpenClaw المدة إلى
أقرب قيمة يدعمها الموفر، ويعيد ربط تلميحات الهندسة المترجمة
مثل الحجم إلى نسبة العرض إلى الارتفاع عندما يعرض موفر احتياطي سطح تحكم
مختلفًا. تُتجاهل التجاوزات غير المدعومة فعليًا على أساس أفضل جهد
وتُبلّغ كتحذيرات في نتيجة الأداة. تفشل حدود الإمكانات الصارمة
(مثل وجود عدد زائد من مدخلات المراجع) قبل الإرسال. تُبلّغ نتائج الأداة
عن الإعدادات المطبّقة؛ ويلتقط `details.normalization` أي ترجمة
من المطلوب إلى المطبّق.
</Note>

تحدد مدخلات المراجع وضع وقت التشغيل:

- لا توجد وسائط مرجعية → `generate`
- أي مرجع صورة → `imageToVideo`
- أي مرجع فيديو → `videoToVideo`
- مدخلات الصوت المرجعية **لا** تغيّر الوضع المحلول؛ فهي تُطبّق
  فوق أي وضع تحدده مراجع الصورة/الفيديو، ولا تعمل إلا
  مع الموفرين الذين يعلنون `maxInputAudios`.

مزج مراجع الصور والفيديو ليس سطح إمكانات مشتركًا مستقرًا.
فضّل نوع مرجع واحدًا لكل طلب.

#### الرجوع الاحتياطي والخيارات ذات الأنواع

تُطبَّق بعض فحوصات الإمكانات في طبقة الرجوع الاحتياطي بدلًا من
حدود الأداة، لذلك يمكن لطلب يتجاوز حدود الموفر الأساسي
أن يعمل مع بديل قادر:

- يتم تخطي المرشح النشط الذي لا يعلن `maxInputAudios` (أو يعلن `0`) عندما
  يحتوي الطلب على مراجع صوتية؛ ثم يُجرَّب المرشح التالي.
- إذا كانت قيمة `maxDurationSeconds` للمرشح النشط أقل من `durationSeconds` المطلوبة
  مع عدم وجود قائمة `supportedDurationSeconds` معلنة → يتم التخطي.
- يحتوي الطلب على `providerOptions` ويعلن المرشح النشط صراحة
  مخطط `providerOptions` ذا أنواع → يتم التخطي إذا كانت المفاتيح المقدمة
  غير موجودة في المخطط أو كانت أنواع القيم غير متطابقة. يتلقى الموفرون الذين لا
  يعلنون مخططًا الخيارات كما هي (تمرير متوافق مع الإصدارات السابقة).
  يمكن للموفر إلغاء قبول كل خيارات الموفر بإعلان مخطط فارغ
  (`capabilities.providerOptions: {}`)، ما يسبب التخطي نفسه كما في حالة عدم تطابق النوع.

يُسجَّل سبب التخطي الأول في الطلب عند `warn` كي يرى المشغلون متى
تم تجاوز موفرهم الأساسي؛ وتُسجَّل التخطيّات اللاحقة عند `debug`
لإبقاء سلاسل الرجوع الاحتياطي الطويلة هادئة. إذا تم تخطي كل المرشحين،
يتضمن الخطأ المجمّع سبب التخطي لكل واحد منهم.

## الإجراءات

| الإجراء     | ما يفعله                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | الافتراضي. إنشاء فيديو من الموجّه المعطى ومدخلات المراجع الاختيارية.                             |
| `status`   | التحقق من حالة مهمة الفيديو الجارية للجلسة الحالية من دون بدء إنشاء آخر. |
| `list`     | عرض الموفرين والنماذج المتاحة وإمكاناتهم.                                                |

## اختيار النموذج

يحل OpenClaw النموذج بهذا الترتيب:

1. **معلمة الأداة `model`** - إذا حددها الوكيل في الاستدعاء.
2. **`videoGenerationModel.primary`** من التكوين.
3. **`videoGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** - الموفرون الذين لديهم مصادقة صالحة، بدءًا من
   الموفر الافتراضي الحالي، ثم بقية الموفرين بترتيب أبجدي.

إذا فشل موفر، يُجرَّب المرشح التالي تلقائيًا. إذا فشل جميع
المرشحين، يتضمن الخطأ تفاصيل من كل محاولة.

عيّن `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
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

## ملاحظات الموفرين

<AccordionGroup>
  <Accordion title="Alibaba">
    يستخدم نقطة نهاية DashScope / Model Studio غير المتزامنة. يجب أن تكون الصور
    والفيديوهات المرجعية عناوين URL بعيدة من نوع `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    معرّف الموفر: `byteplus`.

    النماذج: `seedance-1-0-pro-250528` (الافتراضي)،
    `seedance-1-0-pro-t2v-250528`، `seedance-1-0-pro-fast-251015`،
    `seedance-1-0-lite-t2v-250428`، `seedance-1-0-lite-i2v-250428`.

    لا تقبل نماذج T2V (`*-t2v-*`) مدخلات صور؛ وتدعم نماذج I2V
    والنماذج العامة `*-pro-*` صورة مرجعية واحدة (الإطار الأول).
    مرّر الصورة موضعيًا أو عيّن `role: "first_frame"`.
    يتم تبديل معرّفات نماذج T2V تلقائيًا إلى متغير I2V
    المقابل عند تقديم صورة.

    مفاتيح `providerOptions` المدعومة: `seed` (رقم)، `draft` (منطقي -
    يفرض 480p)، `camera_fixed` (منطقي).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف الموفر: `byteplus-seedance15`. النموذج:
    `seedance-1-5-pro-251215`.

    يستخدم واجهة API الموحدة `content[]`. يدعم صورتين إدخاليتين كحد أقصى
    (`first_frame` + `last_frame`). يجب أن تكون كل المدخلات عناوين URL
    بعيدة من نوع `https://`. عيّن `role: "first_frame"` / `"last_frame"` على كل صورة، أو
    مرّر الصور موضعيًا.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُربط `audio: true` إلى `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف الموفر: `byteplus-seedance2`. النماذج:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    يستخدم واجهة API الموحدة `content[]`. يدعم حتى 9 صور مرجعية،
    و3 فيديوهات مرجعية، و3 ملفات صوت مرجعية. يجب أن تكون كل المدخلات عناوين URL
    بعيدة من نوع `https://`. عيّن `role` على كل أصل - القيم المدعومة:
    `"first_frame"`، `"last_frame"`، `"reference_image"`،
    `"reference_video"`، `"reference_audio"`.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُربط `audio: true` إلى `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="ComfyUI">
    تنفيذ محلي أو سحابي قائم على سير العمل. يدعم تحويل النص إلى فيديو
    وتحويل الصورة إلى فيديو من خلال الرسم البياني المُعدّ.
  </Accordion>
  <Accordion title="fal">
    يستخدم تدفقاً مدعوماً بقائمة انتظار للمهام طويلة التشغيل. ينتظر OpenClaw ما يصل إلى 20
    دقيقة افتراضياً قبل اعتبار مهمة قائمة انتظار fal قيد التنفيذ قد انتهت مهلتها.
    تقبل معظم نماذج فيديو fal مرجع صورة واحداً. تقبل نماذج Seedance 2.0
    من المرجع إلى الفيديو ما يصل إلى 9 صور و3 فيديوهات و3 مراجع صوتية، وبحد أقصى
    12 ملفاً مرجعياً إجمالاً.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    يدعم مرجع صورة واحداً أو مرجع فيديو واحداً. يتم تجاهل طلبات الصوت المُولَّد
    مع تحذير في مسار Gemini API لأن تلك الواجهة ترفض
    المعامل `generateAudio` لتوليد فيديو Veo الحالي.
  </Accordion>
  <Accordion title="MiniMax">
    مرجع صورة واحد فقط. يقبل MiniMax دقتي `768P` و`1080P`؛ وتُطبَّع الطلبات
    مثل `720P` إلى أقرب قيمة مدعومة قبل الإرسال.
  </Accordion>
  <Accordion title="OpenAI">
    يتم تمرير تجاوز `size` فقط. يتم تجاهل تجاوزات النمط الأخرى
    (`aspectRatio` و`resolution` و`audio` و`watermark`) مع تحذير.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم واجهة `/videos` غير المتزامنة في OpenRouter. يرسل OpenClaw
    المهمة، ويستطلع `polling_url`، وينزّل إما `unsigned_urls` أو
    نقطة نهاية محتوى المهمة الموثقة. يعلن الافتراضي المضمّن `google/veo-3.1-fast`
    عن مدد 4/6/8 ثوانٍ، ودقات `720P`/`1080P`،
    ونسب عرض إلى ارتفاع `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    نفس خلفية DashScope مثل Alibaba. يجب أن تكون مُدخلات المراجع عناوين URL بعيدة
    بصيغة `http(s)`؛ وتُرفض الملفات المحلية مسبقاً.
  </Accordion>
  <Accordion title="Runway">
    يدعم الملفات المحلية عبر عناوين URI للبيانات. يتطلب تحويل الفيديو إلى فيديو
    `runway/gen4_aleph`. تعرض عمليات النص فقط نسب عرض إلى ارتفاع `16:9` و`9:16`.
  </Accordion>
  <Accordion title="Together">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="Vydra">
    يستخدم `https://www.vydra.ai/api/v1` مباشرة لتجنب عمليات إعادة التوجيه
    التي تُسقط المصادقة. يُضمَّن `veo3` كتحويل نص إلى فيديو فقط؛ ويتطلب `kling`
    عنوان URL بعيداً لصورة.
  </Accordion>
  <Accordion title="xAI">
    يدعم تحويل النص إلى فيديو، وتحويل صورة إطار أول واحدة إلى فيديو، وما يصل إلى 7
    مُدخلات `reference_image` عبر `reference_images` في xAI، وتدفقات تحرير/تمديد
    فيديو بعيدة.
  </Accordion>
</AccordionGroup>

## أوضاع قدرات المزوّد

يدعم عقد توليد الفيديو المشترك قدرات خاصة بالأوضاع
بدلاً من حدود إجمالية مسطحة فقط. يجب أن تفضل تطبيقات المزوّد الجديدة
كتلاً صريحة للأوضاع:

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
**ليست** كافية للإعلان عن دعم وضع التحويل. يجب أن يعلن المزوّدون
عن `generate` و`imageToVideo` و`videoToVideo` صراحة حتى تتمكن الاختبارات الحية،
واختبارات العقد، وأداة `video_generate` المشتركة من التحقق
من دعم الأوضاع بشكل حتمي.

عندما يكون لدى نموذج واحد في مزوّد دعم أوسع لمُدخلات المراجع من
البقية، استخدم `maxInputImagesByModel` أو `maxInputVideosByModel` أو
`maxInputAudiosByModel` بدلاً من رفع حد الوضع بأكمله.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المشتركين المضمّنين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

غلاف المستودع:

```bash
pnpm test:live:media video
```

يستخدم هذا الملف الحي متغيرات بيئة المزوّد المصدّرة بالفعل قبل ملفات تعريف المصادقة
المخزنة افتراضياً، ويشغّل فحص دخان آمناً للإصدار افتراضياً:

- `generate` لكل مزوّد غير FAL في المسح.
- مطالبة لوبستر لثانية واحدة.
- حد عمليات لكل مزوّد من
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضياً).

FAL اختياري لأن زمن انتظار قائمة الانتظار من جانب المزوّد يمكن أن يهيمن على وقت
الإصدار:

```bash
pnpm test:live:media video --video-providers fal
```

عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع
التحويل المعلنة أيضاً التي يستطيع المسح المشترك تنفيذها بأمان باستخدام وسائط محلية:

- `imageToVideo` عندما يكون `capabilities.imageToVideo.enabled`.
- `videoToVideo` عندما يكون `capabilities.videoToVideo.enabled` ويقبل
  المزوّد/النموذج إدخال فيديو محلياً مدعوماً بالمخزن المؤقت في المسح
  المشترك.

اليوم يغطي مسار `videoToVideo` الحي المشترك `runway` فقط عندما
تحدد `runway/gen4_aleph`.

## الإعداد

عيّن نموذج توليد الفيديو الافتراضي في إعداد OpenClaw الخاص بك:

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
