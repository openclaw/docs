---
read_when:
    - توليد الفيديوهات عبر الوكيل
    - تهيئة مزوّدي ونماذج توليد الفيديو
    - فهم معاملات الأداة `video_generate`
sidebarTitle: Video generation
summary: ولّد الفيديوهات عبر `video_generate` من نص أو صورة أو مراجع فيديو عبر 14 واجهة مزوّد خلفية.
title: توليد الفيديو
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:43:24Z"
  model: gpt-5.4
  provider: openai
  source_hash: b70f4d47318c822f06d979308a0e1fce87de40be9c213f64b4c815dcedba944b
  source_path: tools/video-generation.md
  workflow: 15
---

يمكن لوكلاء OpenClaw توليد فيديوهات من prompts نصية، أو صور مرجعية، أو
فيديوهات موجودة. ويتم دعم أربع عشرة واجهة مزوّد خلفية، ولكل منها
خيارات نماذج مختلفة، وأوضاع إدخال مختلفة، ومجموعات ميزات مختلفة. ويختار الوكيل
المزوّد المناسب تلقائيًا بناءً على إعداداتك ومفاتيح API المتاحة.

<Note>
لا تظهر الأداة `video_generate` إلا عندما يتوفر مزوّد واحد على الأقل
لتوليد الفيديو. وإذا لم ترها ضمن أدوات الوكيل لديك، فاضبط
مفتاح API لمزوّد أو هيّئ `agents.defaults.videoGenerationModel`.
</Note>

يتعامل OpenClaw مع توليد الفيديو على أنه ثلاثة أوضاع runtime:

- `generate` — طلبات نص إلى فيديو من دون وسائط مرجعية.
- `imageToVideo` — يتضمن الطلب صورة مرجعية واحدة أو أكثر.
- `videoToVideo` — يتضمن الطلب فيديو مرجعيًا واحدًا أو أكثر.

يمكن للمزوّدين دعم أي مجموعة فرعية من هذه الأوضاع. وتتحقق الأداة من
الوضع النشط قبل الإرسال وتبلغ عن الأوضاع المدعومة في `action=list`.

## البدء السريع

<Steps>
  <Step title="هيّئ المصادقة">
    اضبط مفتاح API لأي مزوّد مدعوم:

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="اختر نموذجًا افتراضيًا (اختياري)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="اطلب من الوكيل">
    > أنشئ فيديو سينمائيًا مدته 5 ثوانٍ لكركند ودود يتزلج على الأمواج عند الغروب.

    يستدعي الوكيل `video_generate` تلقائيًا. ولا حاجة
    إلى قائمة سماح للأداة.

  </Step>
</Steps>

## كيف يعمل التوليد غير المتزامن

توليد الفيديو غير متزامن. عندما يستدعي الوكيل `video_generate` في
جلسة:

1. يرسل OpenClaw الطلب إلى المزوّد ويعيد معرّف مهمة فورًا.
2. يعالج المزوّد المهمة في الخلفية (عادةً من 30 ثانية إلى 5 دقائق حسب المزوّد والدقة).
3. عندما يصبح الفيديو جاهزًا، يوقظ OpenClaw الجلسة نفسها بحدث إكمال داخلي.
4. ينشر الوكيل الفيديو النهائي مرة أخرى في المحادثة الأصلية.

أثناء وجود مهمة قيد التنفيذ، فإن استدعاءات `video_generate` المكررة في الجلسة
نفسها تعيد حالة المهمة الحالية بدلًا من بدء
عملية توليد أخرى. استخدم `openclaw tasks list` أو `openclaw tasks show <taskId>` من أجل
التحقق من التقدم من CLI.

خارج تشغيلات الوكيل المدعومة بالجلسات (مثل استدعاءات الأدوات المباشرة)،
تعود الأداة إلى التوليد inline وتعيد مسار الوسائط النهائي
في الدورة نفسها.

تُحفظ ملفات الفيديو المولدة ضمن تخزين الوسائط المُدار من OpenClaw عندما
يعيد المزوّد bytes. ويتبع الحد الافتراضي لحفظ الفيديو المولد
حد وسائط الفيديو، بينما يرفع `agents.defaults.mediaMaxMb` هذا الحد
لأعمال التصيير الأكبر. وعندما يعيد المزوّد أيضًا URL لإخراج مستضاف، يمكن لـ OpenClaw
تسليم ذلك URL بدلًا من فشل المهمة إذا رفض التخزين المحلي
ملفًا أكبر من الحد.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------ |
| `queued`     | تم إنشاء المهمة، وهي تنتظر أن يقبلها المزوّد.                                                   |
| `running`    | يعالج المزوّد الطلب (عادةً من 30 ثانية إلى 5 دقائق حسب المزوّد والدقة).                         |
| `succeeded`  | أصبح الفيديو جاهزًا؛ فيستيقظ الوكيل وينشره في المحادثة.                                          |
| `failed`     | حدث خطأ من المزوّد أو انتهت المهلة؛ فيستيقظ الوكيل مع تفاصيل الخطأ.                              |

تحقق من الحالة من CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

إذا كانت مهمة فيديو موجودة بالفعل في حالة `queued` أو `running` للجلسة الحالية،
فإن `video_generate` تعيد حالة المهمة الموجودة بدلًا من بدء مهمة
جديدة. استخدم `action: "status"` للتحقق صراحةً من دون تشغيل
عملية توليد جديدة.

## المزوّدون المدعومون

| المزوّد               | النموذج الافتراضي                | نص  | مرجع صورة                                           | مرجع فيديو                                      | المصادقة                                 |
| --------------------- | -------------------------------- | :-: | --------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                     |  ✓  | نعم (URL بعيد)                                      | نعم (URL بعيد)                                  | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`        |  ✓  | حتى صورتين (لنماذج I2V فقط؛ أول إطار + آخر إطار)   | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`        |  ✓  | حتى صورتين (أول وآخر إطار عبر الدور)               | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`   |  ✓  | حتى 9 صور مرجعية                                    | حتى 3 فيديوهات                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                       |  ✓  | صورة واحدة                                          | —                                               | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` |
| fal                   | `fal-ai/minimax/video-01-live`   |  ✓  | صورة واحدة؛ حتى 9 مع Seedance reference-to-video    | حتى 3 فيديوهات مع Seedance reference-to-video   | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview`  |  ✓  | صورة واحدة                                          | فيديو واحد                                      | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`             |  ✓  | صورة واحدة                                          | —                                               | `MINIMAX_API_KEY` أو MiniMax OAuth       |
| OpenAI                | `sora-2`                         |  ✓  | صورة واحدة                                          | فيديو واحد                                      | `OPENAI_API_KEY`                         |
| Qwen                  | `wan2.6-t2v`                     |  ✓  | نعم (URL بعيد)                                      | نعم (URL بعيد)                                  | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                         |  ✓  | صورة واحدة                                          | فيديو واحد                                      | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`         |  ✓  | صورة واحدة                                          | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                           |  ✓  | صورة واحدة (`kling`)                                | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`             |  ✓  | صورة أول إطار واحدة أو حتى 7 من `reference_image`s  | فيديو واحد                                      | `XAI_API_KEY`                            |

تقبل بعض المزوّدات متغيرات بيئة إضافية أو بديلة لمفاتيح API. راجع
[صفحات المزوّدين](#related) الفردية لمعرفة التفاصيل.

شغّل `video_generate action=list` لفحص المزوّدين والنماذج وأوضاع
runtime المتاحة أثناء runtime.

### مصفوفة القدرات

عقد الأوضاع الصريحة المستخدمة بواسطة `video_generate` واختبارات العقد
والمسح الحي المشترك:

| المزوّد | `generate` | `imageToVideo` | `videoToVideo` | المسارات الحية المشتركة حاليًا                                                                                                            |
| ------- | :--------: | :------------: | :------------: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ ويتم تجاوز `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين فيديو بعيدة `http(s)`                             |
| BytePlus |    ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                                |
| ComfyUI |     ✓      |       ✓        |       —        | ليس في المسح المشترك؛ توجد التغطية الخاصة بسير العمل ضمن اختبارات Comfy                                                                 |
| fal     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ وتعمل `videoToVideo` فقط عند استخدام Seedance reference-to-video                                             |
| Google  |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ ويتم تجاوز `videoToVideo` المشتركة لأن مسح Gemini/Veo الحالي المعتمد على buffer لا يقبل هذا الإدخال        |
| MiniMax |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                                |
| OpenAI  |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ ويتم تجاوز `videoToVideo` المشتركة لأن هذا المسار التنظيمي/المدخلي يحتاج حاليًا إلى وصول inpaint/remix من جهة المزوّد |
| Qwen    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ ويتم تجاوز `videoToVideo` لأن هذا المزوّد يحتاج إلى عناوين فيديو بعيدة `http(s)`                             |
| Runway  |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ وتعمل `videoToVideo` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`                                   |
| Together |    ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                                |
| Vydra   |     ✓      |       ✓        |       —        | `generate`؛ ويتم تجاوز `imageToVideo` المشتركة لأن `veo3` المضمّنة نصية فقط و`kling` المضمّنة تتطلب URL صورة بعيدة                    |
| xAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ ويتم تجاوز `videoToVideo` لأن هذا المزوّد يحتاج حاليًا إلى URL بعيد لملف MP4                               |

## معاملات الأداة

### مطلوبة

<ParamField path="prompt" type="string" required>
  وصف نصي للفيديو المراد توليده. مطلوب لـ `action: "generate"`.
</ParamField>

### مدخلات المحتوى

<ParamField path="image" type="string">صورة مرجعية واحدة (مسار أو URL).</ParamField>
<ParamField path="images" type="string[]">صور مرجعية متعددة (حتى 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع بالتوازي مع قائمة الصور المجمعة.
القيم القياسية: `first_frame` و`last_frame` و`reference_image`.
</ParamField>
<ParamField path="video" type="string">فيديو مرجعي واحد (مسار أو URL).</ParamField>
<ParamField path="videos" type="string[]">فيديوهات مرجعية متعددة (حتى 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع بالتوازي مع قائمة الفيديوهات المجمعة.
القيمة القياسية: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
مرجع صوتي واحد (مسار أو URL). يُستخدم لموسيقى الخلفية أو مرجع الصوت
عندما يدعم المزوّد مدخلات الصوت.
</ParamField>
<ParamField path="audioRefs" type="string[]">مراجع صوتية متعددة (حتى 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع بالتوازي مع قائمة المقاطع الصوتية المجمعة.
القيمة القياسية: `reference_audio`.
</ParamField>

<Note>
تُمرَّر تلميحات الأدوار إلى المزوّد كما هي. وتأتي القيم القياسية من
اتحاد `VideoGenerationAssetRole` لكن قد تقبل المزوّدات سلاسل أدوار
إضافية. ويجب ألا تحتوي مصفوفات `*Roles` على عدد إدخالات أكبر من
قائمة المراجع المقابلة؛ وتفشل أخطاء off-by-one برسالة واضحة.
استخدم سلسلة فارغة لترك خانة غير مضبوطة. وبالنسبة إلى xAI، اضبط كل أدوار الصور على
`reference_image` لاستخدام وضع التوليد `reference_images` لديها؛ واحذف
الدور أو استخدم `first_frame` للصورة الواحدة في وضع image-to-video.
</Note>

### عناصر التحكم في النمط

<ParamField path="aspectRatio" type="string">
  `1:1` أو `2:3` أو `3:2` أو `3:4` أو `4:3` أو `4:5` أو `5:4` أو `9:16` أو `16:9` أو `21:9` أو `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P` أو `720P` أو `768P` أو `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني (تُقرَّب إلى أقرب قيمة يدعمها المزوّد).
</ParamField>
<ParamField path="size" type="string">تلميح الحجم عندما يدعم المزوّد ذلك.</ParamField>
<ParamField path="audio" type="boolean">
  تمكين الصوت المولّد في المخرجات عند الدعم. وهو يختلف عن `audioRef*` (المدخلات).
</ParamField>
<ParamField path="watermark" type="boolean">تبديل العلامة المائية الخاصة بالمزوّد عند الدعم.</ParamField>

تُعد `adaptive` قيمة sentinel خاصة بالمزوّد: إذ تُمرَّر كما هي إلى
المزوّدين الذين يعلنون `adaptive` ضمن قدراتهم (مثل BytePlus
Seedance التي تستخدمها لاكتشاف النسبة تلقائيًا من أبعاد
الصورة المدخلة). أما المزوّدون الذين لا يعلنونها فيُظهرون القيمة عبر
`details.ignoredOverrides` في نتيجة الأداة حتى يكون إسقاطها مرئيًا.

### متقدمة

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  تعيد `"status"` المهمة الحالية الخاصة بالجلسة؛ بينما تفحص `"list"` المزوّدين.
</ParamField>
<ParamField path="model" type="string">تجاوز provider/model (مثل `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لطلب المزوّد بالمللي ثانية.</ParamField>
<ParamField path="providerOptions" type="object">
  خيارات خاصة بالمزوّد على شكل كائن JSON (مثل `{"seed": 42, "draft": true}`).
  تتحقق المزوّدات التي تعلن schema typed من المفاتيح والأنواع؛ أما
  المفاتيح غير المعروفة أو عدم تطابق الأنواع فيؤدي إلى تجاوز هذا المرشح أثناء fallback. أما المزوّدات التي لا
  تعلن schema فتتلقى الخيارات كما هي. شغّل `video_generate action=list`
  لمعرفة ما يقبله كل مزوّد.
</ParamField>

<Note>
لا تدعم جميع المزوّدات كل المعاملات. ويقوم OpenClaw بتطبيع المدة إلى
أقرب قيمة يدعمها المزوّد، ويعيد ربط تلميحات الهندسة المترجمة
مثل التحويل من size إلى aspect-ratio عندما يكشف مزوّد fallback عن سطح تحكم
مختلف. أما التجاوزات غير المدعومة حقًا فتُتجاهل على أساس أفضل جهد
ويتم الإبلاغ عنها كتحذيرات في نتيجة الأداة. وتفشل حدود القدرات الصلبة
(مثل وجود عدد كبير جدًا من المدخلات المرجعية) قبل الإرسال. وتبلغ نتائج الأداة
عن الإعدادات المطبقة؛ وتلتقط `details.normalization` أي
ترجمة من المطلوب إلى المطبق.
</Note>

تحدد المدخلات المرجعية وضع runtime:

- عدم وجود وسائط مرجعية ← `generate`
- وجود أي مرجع صورة ← `imageToVideo`
- وجود أي مرجع فيديو ← `videoToVideo`
- **المراجع الصوتية** لا تغيّر الوضع المحلول؛ بل تُطبَّق
  فوق أي وضع تحدده مراجع الصور/الفيديو، ولا تعمل إلا
  مع المزوّدين الذين يعلنون `maxInputAudios`.

لا يُعد خلط مراجع الصور والفيديو سطح قدرة مشتركة مستقرًا.
فضّل نوع مرجع واحد لكل طلب.

#### fallback والخيارات typed

تُطبَّق بعض فحوصات القدرات على طبقة fallback بدل حدود
الأداة، بحيث يمكن للطلب الذي يتجاوز حدود المزوّد الأساسي
أن يعمل مع fallback قادرة:

- يتم تجاوز المرشح النشط الذي لا يعلن `maxInputAudios` (أو يضبطها على `0`) عندما
  يحتوي الطلب على مراجع صوتية؛ ويُجرَّب المرشح التالي.
- إذا كانت قيمة `maxDurationSeconds` في المرشح النشط أقل من `durationSeconds`
  المطلوبة من دون إعلان قائمة `supportedDurationSeconds` → يتم تجاوزه.
- إذا احتوى الطلب على `providerOptions` وكان المرشح النشط يعلن صراحةً
  schema typed لـ `providerOptions` → يتم تجاوزه إذا لم تكن المفاتيح المزوَّدة
  موجودة في schema أو لم تتطابق أنواع القيم. أما المزوّدون الذين لا يعلنون
  schema فيتلقون الخيارات كما هي (تمرير متوافق
  مع الإصدارات السابقة). ويمكن للمزوّد إلغاء جميع خيارات providerOptions
  بإعلان schema فارغة (`capabilities.providerOptions: {}`)، مما
  يؤدي إلى التجاوز نفسه كما في حالة عدم تطابق النوع.

يُسجَّل أول سبب للتجاوز في الطلب عند مستوى `warn` حتى يرى المشغّلون
وقت تجاوز مزوّدهم الأساسي؛ بينما تُسجَّل التجاوزات اللاحقة عند مستوى `debug` من أجل
إبقاء سلاسل fallback الطويلة هادئة. وإذا تم تجاوز كل المرشحين،
فإن الخطأ المجمع يتضمن سبب التجاوز لكل منهم.

## الإجراءات

| الإجراء     | ما الذي يفعله                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `generate`  | الافتراضي. إنشاء فيديو من prompt المعطاة ومن المدخلات المرجعية الاختيارية.                                |
| `status`    | التحقق من حالة مهمة الفيديو قيد التنفيذ للجلسة الحالية دون بدء عملية توليد أخرى.                          |
| `list`      | عرض المزوّدين والنماذج المتاحة وقدراتها.                                                                    |

## اختيار النموذج

يحل OpenClaw النموذج بهذا الترتيب:

1. **معامل الأداة `model`** — إذا حدده الوكيل في الاستدعاء.
2. **`videoGenerationModel.primary`** من الإعدادات.
3. **`videoGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** — المزوّدون الذين يملكون مصادقة صالحة، بدءًا من
   المزوّد الافتراضي الحالي، ثم بقية المزوّدين بالترتيب
   الأبجدي.

إذا فشل مزوّد، تتم تجربة المرشح التالي تلقائيًا. وإذا
فشل جميع المرشحين، فسيتضمن الخطأ تفاصيل من كل محاولة.

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

## ملاحظات حول المزوّدين

<AccordionGroup>
  <Accordion title="Alibaba">
    تستخدم نقطة نهاية DashScope / Model Studio غير المتزامنة. ويجب أن تكون الصور المرجعية
    والفيديوهات المرجعية عناوين URL بعيدة من نوع `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    معرّف المزوّد: `byteplus`.

    النماذج: `seedance-1-0-pro-250528` (الافتراضي)،
    و`seedance-1-0-pro-t2v-250528`، و`seedance-1-0-pro-fast-251015`،
    و`seedance-1-0-lite-t2v-250428`، و`seedance-1-0-lite-i2v-250428`.

    لا تقبل نماذج T2V ‏(`*-t2v-*`) مدخلات الصور؛ أما نماذج I2V والنماذج
    العامة `*-pro-*` فتدعم صورة مرجعية واحدة (الإطار
    الأول). مرّر الصورة موضعيًا أو اضبط `role: "first_frame"`.
    ويتم تحويل معرّفات نماذج T2V تلقائيًا إلى النسخة المقابلة من I2V
    عندما يتم توفير صورة.

    مفاتيح `providerOptions` المدعومة: `seed` (عدد)، و`draft` (منطقي —
    يفرض 480p)، و`camera_fixed` (منطقي).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    يتطلب Plugin ‏[`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance15`. والنموذج:
    `seedance-1-5-pro-251215`.

    يستخدم API الموحدة `content[]`. ويدعم حتى صورتين مدخلتين
    (`first_frame` + `last_frame`). ويجب أن تكون جميع المدخلات عناوين URL بعيدة من نوع `https://`.
    اضبط `role: "first_frame"` / `"last_frame"` على كل صورة، أو
    مرّر الصور موضعيًا.

    تكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من الصورة المدخلة.
    وتُربط `audio: true` إلى `generate_audio`. كما يتم تمرير
    `providerOptions.seed` (عدد).

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    يتطلب Plugin ‏[`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance2`. النماذج:
    `dreamina-seedance-2-0-260128`,
    `dreamina-seedance-2-0-fast-260128`.

    يستخدم API الموحدة `content[]`. ويدعم حتى 9 صور مرجعية،
    و3 فيديوهات مرجعية، و3 مراجع صوتية. ويجب أن تكون جميع المدخلات عناوين URL بعيدة
    من نوع `https://`. اضبط `role` على كل أصل — والقيم المدعومة هي:
    `"first_frame"` و`"last_frame"` و`"reference_image"`،
    و`"reference_video"` و`"reference_audio"`.

    تكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من الصورة المدخلة.
    وتُربط `audio: true` إلى `generate_audio`. كما يتم تمرير
    `providerOptions.seed` (عدد).

  </Accordion>
  <Accordion title="ComfyUI">
    تنفيذ محلي أو سحابي مدفوع بسير العمل. ويدعم النص إلى فيديو
    والصورة إلى فيديو عبر الرسم البياني المهيأ.
  </Accordion>
  <Accordion title="fal">
    يستخدم تدفقًا مدعومًا بطابور للمهام طويلة التنفيذ. تقبل معظم نماذج فيديو fal
    صورة مرجعية واحدة. أما نماذج Seedance 2.0 reference-to-video
    فتقبل حتى 9 صور و3 فيديوهات و3 مراجع صوتية، مع
    حد أقصى قدره 12 ملفًا مرجعيًا إجمالًا.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    تدعم صورة واحدة أو مرجع فيديو واحد.
  </Accordion>
  <Accordion title="MiniMax">
    مرجع صورة واحدة فقط.
  </Accordion>
  <Accordion title="OpenAI">
    لا يتم تمرير إلا تجاوز `size`. أما تجاوزات النمط الأخرى
    (`aspectRatio` و`resolution` و`audio` و`watermark`) فتُتجاهل مع
    تحذير.
  </Accordion>
  <Accordion title="Qwen">
    الواجهة الخلفية نفسها لـ DashScope مثل Alibaba. ويجب أن تكون المدخلات المرجعية
    عناوين URL بعيدة من نوع `http(s)`؛ وتُرفض الملفات المحلية مسبقًا.
  </Accordion>
  <Accordion title="Runway">
    تدعم الملفات المحلية عبر data URIs. ويتطلب video-to-video
    النموذج `runway/gen4_aleph`. وتعرض التشغيلات النصية فقط نسب
    أبعاد `16:9` و`9:16`.
  </Accordion>
  <Accordion title="Together">
    مرجع صورة واحدة فقط.
  </Accordion>
  <Accordion title="Vydra">
    تستخدم `https://www.vydra.ai/api/v1` مباشرة لتجنب عمليات إعادة التوجيه
    التي تُسقط المصادقة. ويأتي `veo3` مضمّنًا بوصفه نصًا إلى فيديو فقط؛ بينما يتطلب `kling`
    عنوان URL بعيدًا للصورة.
  </Accordion>
  <Accordion title="xAI">
    تدعم النص إلى فيديو، والصورة الواحدة كأول إطار في image-to-video، وحتى 7
    مدخلات `reference_image` عبر xAI `reference_images`، بالإضافة إلى تدفقات
    تعديل/تمديد الفيديو البعيدة.
  </Accordion>
</AccordionGroup>

## أوضاع قدرات المزوّد

تدعم عقدة توليد الفيديو المشتركة قدرات خاصة بالأوضاع
بدل الاعتماد فقط على حدود مجمعة مسطحة. ويجب أن تفضّل
تنفيذات المزوّدين الجديدة كتل الأوضاع الصريحة:

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

الحقول المجمعة المسطحة مثل `maxInputImages` و`maxInputVideos`
**لا تكفي** للإعلان عن دعم أوضاع التحويل. ويجب على المزوّدين
تعريف `generate` و`imageToVideo` و`videoToVideo` صراحةً حتى تتمكن
الاختبارات الحية واختبارات العقد وأداة `video_generate` المشتركة من التحقق
من دعم الأوضاع بشكل حتمي.

وعندما يملك نموذج واحد في مزوّد ما دعمًا أوسع للمدخلات المرجعية من
بقية النماذج، فاستخدم `maxInputImagesByModel` أو `maxInputVideosByModel` أو
`maxInputAudiosByModel` بدل رفع الحد على مستوى الوضع كله.

## الاختبارات الحية

تغطية حية اختيارية للمزوّدين المضمّنين المشتركين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

غلاف المستودع:

```bash
pnpm test:live:media video
```

يحمّل هذا الملف الحي متغيرات البيئة المفقودة الخاصة بالمزوّد من `~/.profile`، ويفضّل
مفاتيح API الحية/البيئية على ملفات auth التعريفية المخزنة افتراضيًا، ويشغّل
اختبار smoke آمنًا للإصدار افتراضيًا:

- `generate` لكل مزوّد غير FAL ضمن المسح.
- موجه كركند لمدة ثانية واحدة.
- حد زمني لكل عملية حسب المزوّد من
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (الافتراضي `180000`).

يُعد FAL اختياريًا لأن زمن الانتظار في طابور المزوّد قد يهيمن على وقت
الإصدار:

```bash
pnpm test:live:media video --video-providers fal
```

اضبط `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل
أوضاع التحويل المعلنة التي يستطيع المسح المشترك اختبارها بأمان مع وسائط محلية أيضًا:

- `imageToVideo` عندما تكون `capabilities.imageToVideo.enabled`.
- `videoToVideo` عندما تكون `capabilities.videoToVideo.enabled` ويكون
  المزوّد/النموذج يقبل إدخال فيديو محليًا مدعومًا بـ buffer في المسح
  المشترك.

حاليًا، يغطي المسار الحي المشترك `videoToVideo` مزوّد `runway` فقط عندما
تحدد `runway/gen4_aleph`.

## التهيئة

اضبط نموذج توليد الفيديو الافتراضي في إعدادات OpenClaw الخاصة بك:

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
- [مهام الخلفية](/ar/automation/tasks) — تتبع المهام لتوليد الفيديو غير المتزامن
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
