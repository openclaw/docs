---
read_when:
    - إنشاء مقاطع الفيديو عبر الوكيل
    - تكوين موفّري ونماذج توليد الفيديو
    - فهم معلمات أداة video_generate
sidebarTitle: Video generation
summary: أنشئ مقاطع فيديو عبر `video_generate` من مراجع نصية أو صورية أو فيديو عبر 16 واجهة خلفية لمزوّدي الخدمة
title: توليد الفيديو
x-i18n:
    generated_at: "2026-05-05T01:52:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6edce39c3006b748d512fec935b81566ae1a121c280248e9e9439edd1f052d83
    source_path: tools/video-generation.md
    workflow: 16
---

يمكن لوكلاء OpenClaw إنشاء مقاطع فيديو من مطالبات نصية، أو صور مرجعية، أو
مقاطع فيديو موجودة. يتم دعم ست عشرة واجهة خلفية لموفرين، ولكل منها
خيارات نماذج وأوضاع إدخال ومجموعات ميزات مختلفة. يختار الوكيل
الموفر المناسب تلقائيًا بناءً على إعداداتك ومفاتيح API المتاحة.

<Note>
لا تظهر أداة `video_generate` إلا عند توفر موفر واحد على الأقل لإنشاء
الفيديو. إذا لم ترها ضمن أدوات وكيلك، فاضبط مفتاح API لموفر
أو قم بتكوين `agents.defaults.videoGenerationModel`.
</Note>

يتعامل OpenClaw مع إنشاء الفيديو بثلاثة أوضاع تشغيل:

- `generate` — طلبات تحويل النص إلى فيديو من دون وسائط مرجعية.
- `imageToVideo` — يتضمن الطلب صورة مرجعية واحدة أو أكثر.
- `videoToVideo` — يتضمن الطلب مقطع فيديو مرجعيًا واحدًا أو أكثر.

يمكن للموفرين دعم أي مجموعة فرعية من هذه الأوضاع. تتحقق الأداة من
الوضع النشط قبل الإرسال وتعرض الأوضاع المدعومة في `action=list`.

## البدء السريع

<Steps>
  <Step title="Configure auth">
    عيّن مفتاح API لأي موفر مدعوم:

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
    > أنشئ مقطع فيديو سينمائيًا مدته 5 ثوانٍ لسرطان بحر ودود يتزلج على الأمواج عند الغروب.

    يستدعي الوكيل `video_generate` تلقائيًا. لا يلزم إدراج الأداة في
    قائمة السماح.

  </Step>
</Steps>

## آلية عمل الإنشاء غير المتزامن

إنشاء الفيديو عملية غير متزامنة. عندما يستدعي الوكيل `video_generate` في
جلسة:

1. يرسل OpenClaw الطلب إلى الموفر ويعيد فورًا معرّف مهمة.
2. يعالج الموفر المهمة في الخلفية (عادةً من 30 ثانية إلى 5 دقائق حسب الموفر والدقة).
3. عندما يصبح الفيديو جاهزًا، يوقظ OpenClaw الجلسة نفسها بحدث إكمال داخلي.
4. يخبر الوكيل المستخدم ويرفق الفيديو النهائي. في محادثات المجموعات/القنوات
   التي تستخدم تسليمًا مرئيًا عبر أداة الرسائل فقط، يمرر الوكيل
   النتيجة عبر أداة الرسائل بدلًا من أن ينشرها OpenClaw مباشرة.

أثناء تنفيذ مهمة، تعيد استدعاءات `video_generate` المكررة في الجلسة نفسها
حالة المهمة الحالية بدلًا من بدء عملية إنشاء أخرى. استخدم `openclaw tasks list` أو `openclaw tasks show <taskId>` من أجل
التحقق من التقدم من CLI.

خارج عمليات تشغيل الوكيل المدعومة بجلسة (على سبيل المثال، استدعاءات الأدوات المباشرة)،
تعود الأداة إلى الإنشاء المضمن وتعيد مسار الوسائط النهائي
في الدور نفسه.

تُحفظ ملفات الفيديو المنشأة ضمن تخزين الوسائط المُدار بواسطة OpenClaw عندما
يعيد الموفر بايتات. يتبع الحد الأقصى الافتراضي لحفظ الفيديو المنشأ
حد وسائط الفيديو، ويرفعه `agents.defaults.mediaMaxMb` لعمليات التصيير
الأكبر. عندما يعيد الموفر أيضًا URL إخراج مستضافًا، يمكن لـ OpenClaw
تسليم ذلك URL بدلًا من فشل المهمة إذا رفض الحفظ المحلي
ملفًا كبير الحجم.

### دورة حياة المهمة

| الحالة       | المعنى                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------ |
| `queued`    | أُنشئت المهمة، وتنتظر قبول الموفر لها.                                             |
| `running`   | يعالجها الموفر (عادةً من 30 ثانية إلى 5 دقائق حسب الموفر والدقة). |
| `succeeded` | الفيديو جاهز؛ يوقظ الوكيل وينشره في المحادثة.                                   |
| `failed`    | خطأ أو انتهاء مهلة من الموفر؛ يوقظ الوكيل مع تفاصيل الخطأ.                                   |

تحقق من الحالة من CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

إذا كانت مهمة فيديو بالفعل في الحالة `queued` أو `running` للجلسة الحالية،
فإن `video_generate` يعيد حالة المهمة الحالية بدلًا من بدء مهمة جديدة.
استخدم `action: "status"` للتحقق صراحةً من دون تشغيل إنشاء جديد.

## الموفرون المدعومون

| الموفر              | النموذج الافتراضي                   | نص | مرجع صورة                                            | مرجع فيديو                                       | المصادقة                                     |
| --------------------- | ------------------------------- | :--: | ---------------------------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| Alibaba               | `wan2.6-t2v`                    |  ✓   | نعم (URL بعيد)                                     | نعم (URL بعيد)                                | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)        | `seedance-1-0-pro-250528`       |  ✓   | حتى صورتين (نماذج I2V فقط؛ الإطار الأول + الأخير) | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5 | `seedance-1-5-pro-251215`       |  ✓   | حتى صورتين (الإطار الأول + الأخير عبر الدور)         | —                                               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0 | `dreamina-seedance-2-0-260128`  |  ✓   | حتى 9 صور مرجعية                             | حتى 3 مقاطع فيديو                                  | `BYTEPLUS_API_KEY`                       |
| ComfyUI               | `workflow`                      |  ✓   | صورة واحدة                                              | —                                               | `COMFY_API_KEY` أو `COMFY_CLOUD_API_KEY` |
| DeepInfra             | `Pixverse/Pixverse-T2V`         |  ✓   | —                                                    | —                                               | `DEEPINFRA_API_KEY`                      |
| fal                   | `fal-ai/minimax/video-01-live`  |  ✓   | صورة واحدة؛ حتى 9 مع تحويل Seedance من مرجع إلى فيديو    | حتى 3 مقاطع فيديو مع تحويل Seedance من مرجع إلى فيديو | `FAL_KEY`                                |
| Google                | `veo-3.1-fast-generate-preview` |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `GEMINI_API_KEY`                         |
| MiniMax               | `MiniMax-Hailuo-2.3`            |  ✓   | صورة واحدة                                              | —                                               | `MINIMAX_API_KEY` أو MiniMax OAuth       |
| OpenAI                | `sora-2`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `OPENAI_API_KEY`                         |
| OpenRouter            | `google/veo-3.1-fast`           |  ✓   | حتى 4 صور (الإطار الأول/الأخير أو مراجع)      | —                                               | `OPENROUTER_API_KEY`                     |
| Qwen                  | `wan2.6-t2v`                    |  ✓   | نعم (URL بعيد)                                     | نعم (URL بعيد)                                | `QWEN_API_KEY`                           |
| Runway                | `gen4.5`                        |  ✓   | صورة واحدة                                              | فيديو واحد                                         | `RUNWAYML_API_SECRET`                    |
| Together              | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | صورة واحدة                                              | —                                               | `TOGETHER_API_KEY`                       |
| Vydra                 | `veo3`                          |  ✓   | صورة واحدة (`kling`)                                    | —                                               | `VYDRA_API_KEY`                          |
| xAI                   | `grok-imagine-video`            |  ✓   | صورة إطار أول واحدة أو حتى 7 `reference_image`s    | فيديو واحد                                         | `XAI_API_KEY`                            |

يقبل بعض الموفرين متغيرات بيئة إضافية أو بديلة لمفاتيح API. راجع
[صفحات الموفرين](#related) الفردية للتفاصيل.

شغّل `video_generate action=list` لفحص الموفرين والنماذج
وأوضاع التشغيل المتاحة أثناء التشغيل.

### مصفوفة القدرات

عقد الوضع الصريح المستخدم بواسطة `video_generate` واختبارات العقد
والفحص الحي المشترك:

| الموفر   | `generate` | `imageToVideo` | `videoToVideo` | مسارات الفحص الحي المشتركة اليوم                                                                                                                  |
| ---------- | :--------: | :------------: | :------------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يتم تخطي `videoToVideo` لأن هذا الموفر يحتاج إلى عناوين URL لفيديوهات `http(s)` بعيدة                               |
| BytePlus   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| ComfyUI    |     ✓      |       ✓        |       —        | غير موجود في الفحص المشترك؛ توجد التغطية الخاصة بسير العمل مع اختبارات Comfy                                                               |
| DeepInfra  |     ✓      |       —        |       —        | `generate`؛ مخططات فيديو DeepInfra الأصلية هي تحويل نص إلى فيديو في العقد المرفق                                                     |
| fal        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ `videoToVideo` فقط عند استخدام تحويل Seedance من مرجع إلى فيديو                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يتم تخطي `videoToVideo` المشترك لأن فحص Gemini/Veo الحالي المدعوم بالمخزن المؤقت لا يقبل هذا الإدخال  |
| MiniMax    |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يتم تخطي `videoToVideo` المشترك لأن مسار المؤسسة/الإدخال هذا يحتاج حاليًا إلى وصول inpaint/remix من جانب الموفر |
| OpenRouter |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يتم تخطي `videoToVideo` لأن هذا الموفر يحتاج إلى عناوين URL لفيديوهات `http(s)` بعيدة                               |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يعمل `videoToVideo` فقط عندما يكون النموذج المحدد هو `runway/gen4_aleph`                                      |
| Together   |     ✓      |       ✓        |       —        | `generate`، `imageToVideo`                                                                                                               |
| Vydra      |     ✓      |       ✓        |       —        | `generate`؛ يتم تخطي `imageToVideo` المشترك لأن `veo3` المرفق نصي فقط و`kling` المرفق يتطلب URL صورة بعيدًا            |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`، `imageToVideo`؛ يتم تخطي `videoToVideo` لأن هذا الموفر يحتاج حاليًا إلى URL بعيد لملف MP4                                |

## معلمات الأداة

### مطلوب

<ParamField path="prompt" type="string" required>
  وصف نصي للفيديو المطلوب إنشاؤه. مطلوب لـ `action: "generate"`.
</ParamField>

### إدخالات المحتوى

<ParamField path="image" type="string">صورة مرجعية واحدة (مسار أو URL).</ParamField>
<ParamField path="images" type="string[]">صور مرجعية متعددة (حتى 9).</ParamField>
<ParamField path="imageRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الصور المدمجة.
القيم القياسية: `first_frame`، و`last_frame`، و`reference_image`.
</ParamField>
<ParamField path="video" type="string">فيديو مرجعي واحد (مسار أو URL).</ParamField>
<ParamField path="videos" type="string[]">فيديوهات مرجعية متعددة (حتى 4).</ParamField>
<ParamField path="videoRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الفيديوهات المدمجة.
القيمة القياسية: `reference_video`.
</ParamField>
<ParamField path="audioRef" type="string">
صوت مرجعي واحد (مسار أو URL). يُستخدم للموسيقى الخلفية أو مرجع الصوت
عندما يدعم المزوّد مُدخلات الصوت.
</ParamField>
<ParamField path="audioRefs" type="string[]">تسجيلات صوتية مرجعية متعددة (حتى 3).</ParamField>
<ParamField path="audioRoles" type="string[]">
تلميحات أدوار اختيارية لكل موضع، موازية لقائمة الصوت المدمجة.
القيمة القياسية: `reference_audio`.
</ParamField>

<Note>
تُمرَّر تلميحات الأدوار إلى المزوّد كما هي. تأتي القيم القياسية من
اتحاد `VideoGenerationAssetRole`، لكن قد تقبل المزوّدات سلاسل أدوار إضافية.
يجب ألا تحتوي مصفوفات `*Roles` على إدخالات أكثر من قائمة المراجع
المقابلة؛ تفشل أخطاء الإزاحة بمقدار واحد مع رسالة خطأ واضحة.
استخدم سلسلة فارغة لترك خانة غير معيّنة. بالنسبة إلى xAI، اضبط كل دور صورة على
`reference_image` لاستخدام وضع التوليد `reference_images` لديه؛ احذف
الدور أو استخدم `first_frame` لتحويل صورة واحدة إلى فيديو.
</Note>

### عناصر التحكم في النمط

<ParamField path="aspectRatio" type="string">
  `1:1`، أو `2:3`، أو `3:2`، أو `3:4`، أو `4:3`، أو `4:5`، أو `5:4`، أو `9:16`، أو `16:9`، أو `21:9`، أو `adaptive`.
</ParamField>
<ParamField path="resolution" type="string">`480P`، أو `720P`، أو `768P`، أو `1080P`.</ParamField>
<ParamField path="durationSeconds" type="number">
  المدة المستهدفة بالثواني (تُقرَّب إلى أقرب قيمة يدعمها المزوّد).
</ParamField>
<ParamField path="size" type="string">تلميح الحجم عندما يدعمه المزوّد.</ParamField>
<ParamField path="audio" type="boolean">
  تفعيل الصوت المُولَّد في الناتج عندما يكون مدعومًا. يختلف عن `audioRef*` (المُدخلات).
</ParamField>
<ParamField path="watermark" type="boolean">تبديل إضافة العلامة المائية من المزوّد عندما تكون مدعومة.</ParamField>

`adaptive` قيمة حارسة خاصة بالمزوّد: تُمرَّر كما هي إلى
المزوّدات التي تعلن `adaptive` ضمن إمكاناتها (مثل BytePlus
Seedance التي تستخدمها لاكتشاف النسبة تلقائيًا من أبعاد صورة
الإدخال). المزوّدات التي لا تعلنها تعرض القيمة عبر
`details.ignoredOverrides` في نتيجة الأداة حتى يكون الإسقاط مرئيًا.

### متقدم

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  يعيد `"status"` مهمة الجلسة الحالية؛ ويفحص `"list"` المزوّدات.
</ParamField>
<ParamField path="model" type="string">تجاوز المزوّد/النموذج (مثل `runway/gen4.5`).</ParamField>
<ParamField path="filename" type="string">تلميح اسم ملف الإخراج.</ParamField>
<ParamField path="timeoutMs" type="number">مهلة اختيارية لطلب المزوّد بالميلي ثانية.</ParamField>
<ParamField path="providerOptions" type="object">
  خيارات خاصة بالمزوّد على هيئة كائن JSON (مثل `{"seed": 42, "draft": true}`).
  تتحقق المزوّدات التي تعلن مخططًا ذا أنواع من المفاتيح والأنواع؛ أما المفاتيح
  غير المعروفة أو حالات عدم التطابق فتتجاوز المرشح أثناء الرجوع الاحتياطي. وتتلقى المزوّدات التي لا
  تعلن مخططًا الخيارات كما هي. شغّل `video_generate action=list`
  لمعرفة ما يقبله كل مزوّد.
</ParamField>

<Note>
لا تدعم كل المزوّدات كل المعاملات. يطبّع OpenClaw المدة إلى
أقرب قيمة يدعمها المزوّد، ويعيد تعيين تلميحات الهندسة المترجمة
مثل الحجم إلى نسبة العرض إلى الارتفاع عندما يعرض مزوّد رجوع احتياطي سطح تحكم
مختلفًا. تُتجاهل التجاوزات غير المدعومة فعليًا بأفضل جهد
وتُبلّغ كتحذيرات في نتيجة الأداة. تفشل حدود الإمكانات الصارمة
(مثل كثرة مُدخلات المراجع) قبل الإرسال. تبلّغ نتائج الأداة
عن الإعدادات المطبقة؛ ويلتقط `details.normalization` أي ترجمة
من المطلوب إلى المطبق.
</Note>

تحدد مُدخلات المراجع وضع وقت التشغيل:

- لا توجد وسائط مرجعية → `generate`
- أي مرجع صورة → `imageToVideo`
- أي مرجع فيديو → `videoToVideo`
- مُدخلات الصوت المرجعية **لا** تغيّر الوضع المحلول؛ فهي تُطبّق فوق
  أي وضع تختاره مراجع الصور/الفيديو، ولا تعمل إلا
  مع المزوّدات التي تعلن `maxInputAudios`.

ليست مراجع الصور والفيديو المختلطة سطح إمكانات مشتركًا مستقرًا.
فضّل نوع مرجع واحدًا لكل طلب.

#### الرجوع الاحتياطي والخيارات ذات الأنواع

تُطبّق بعض فحوصات الإمكانات في طبقة الرجوع الاحتياطي بدلًا من
حدّ الأداة، لذلك يمكن لطلب يتجاوز حدود المزوّد الأساسي أن
يظل يعمل على مزوّد رجوع احتياطي قادر:

- يُتجاوز المرشح النشط الذي لا يعلن `maxInputAudios` (أو يعلن `0`) عندما
  يحتوي الطلب على مراجع صوتية؛ وتتم تجربة المرشح التالي.
- إذا كان `maxDurationSeconds` للمرشح النشط أقل من `durationSeconds` المطلوبة
  من دون قائمة `supportedDurationSeconds` معلنة → يُتجاوز.
- يحتوي الطلب على `providerOptions` ويعلن المرشح النشط صراحةً
  مخطط `providerOptions` ذا أنواع → يُتجاوز إذا كانت المفاتيح المقدمة
  غير موجودة في المخطط أو لا تتطابق أنواع القيم. تتلقى المزوّدات التي لا
  تعلن مخططًا الخيارات كما هي (تمرير متوافق
  مع الإصدارات السابقة). يمكن للمزوّد تعطيل كل خيارات المزوّد عبر
  إعلان مخطط فارغ (`capabilities.providerOptions: {}`)، مما
  يسبب التجاوز نفسه مثل عدم تطابق النوع.

يُسجَّل أول سبب تجاوز في الطلب عند مستوى `warn` حتى يرى المشغّلون متى
تم تخطي المزوّد الأساسي لديهم؛ وتُسجَّل التجاوزات اللاحقة عند مستوى `debug` للحفاظ
على هدوء سلاسل الرجوع الاحتياطي الطويلة. إذا تم تجاوز كل المرشحين، يتضمن
الخطأ المجمّع سبب التجاوز لكل واحد.

## الإجراءات

| الإجراء     | ما يفعله                                                                                             |
| ---------- | -------------------------------------------------------------------------------------------------------- |
| `generate` | الافتراضي. ينشئ فيديو من الموجّه المحدد ومُدخلات المراجع الاختيارية.                             |
| `status`   | يتحقق من حالة مهمة الفيديو الجارية للجلسة الحالية من دون بدء توليد آخر. |
| `list`     | يعرض المزوّدات والنماذج المتاحة وإمكاناتها.                                                |

## اختيار النموذج

يحل OpenClaw النموذج بهذا الترتيب:

1. **معامل الأداة `model`** — إذا حدده الوكيل في الاستدعاء.
2. **`videoGenerationModel.primary`** من الإعداد.
3. **`videoGenerationModel.fallbacks`** بالترتيب.
4. **الاكتشاف التلقائي** — المزوّدات التي لديها مصادقة صالحة، بدءًا من
   المزوّد الافتراضي الحالي، ثم المزوّدات المتبقية بالترتيب الأبجدي.

إذا فشل مزوّد، تتم تجربة المرشح التالي تلقائيًا. إذا فشل كل
المرشحين، يتضمن الخطأ تفاصيل من كل محاولة.

اضبط `agents.defaults.mediaGenerationAutoProviderFallback: false` لاستخدام
إدخالات `model`، و`primary`، و`fallbacks` الصريحة فقط.

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
    يستخدم نقطة نهاية غير متزامنة في DashScope / Model Studio. يجب أن تكون الصور
    والفيديوهات المرجعية عناوين URL بعيدة من نوع `http(s)`.
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    معرّف المزوّد: `byteplus`.

    النماذج: `seedance-1-0-pro-250528` (افتراضي)،
    `seedance-1-0-pro-t2v-250528`، و`seedance-1-0-pro-fast-251015`،
    و`seedance-1-0-lite-t2v-250428`، و`seedance-1-0-lite-i2v-250428`.

    لا تقبل نماذج T2V (`*-t2v-*`) مُدخلات الصور؛ تدعم نماذج I2V
    ونماذج `*-pro-*` العامة صورة مرجعية واحدة (الإطار
    الأول). مرر الصورة موضعيًا أو اضبط `role: "first_frame"`.
    تتحول معرّفات نماذج T2V تلقائيًا إلى متغير I2V
    المقابل عند تقديم صورة.

    مفاتيح `providerOptions` المدعومة: `seed` (رقم)، و`draft` (قيمة منطقية —
    تفرض 480p)، و`camera_fixed` (قيمة منطقية).

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance15`. النموذج:
    `seedance-1-5-pro-251215`.

    يستخدم API الموحّدة `content[]`. يدعم صورتَي إدخال كحد أقصى
    (`first_frame` + `last_frame`). يجب أن تكون كل المُدخلات عناوين URL بعيدة من نوع `https://`.
    اضبط `role: "first_frame"` / `"last_frame"` على كل صورة، أو
    مرر الصور موضعيًا.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُعيَّن `audio: true` إلى `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    يتطلب Plugin [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark).
    معرّف المزوّد: `byteplus-seedance2`. النماذج:
    `dreamina-seedance-2-0-260128`،
    `dreamina-seedance-2-0-fast-260128`.

    يستخدم API الموحّدة `content[]`. يدعم حتى 9 صور مرجعية،
    و3 فيديوهات مرجعية، و3 تسجيلات صوتية مرجعية. يجب أن تكون كل المُدخلات عناوين URL بعيدة
    من نوع `https://`. اضبط `role` على كل أصل — القيم المدعومة:
    `"first_frame"`، و`"last_frame"`، و`"reference_image"`،
    و`"reference_video"`، و`"reference_audio"`.

    يكتشف `aspectRatio: "adaptive"` النسبة تلقائيًا من صورة الإدخال.
    يُعيَّن `audio: true` إلى `generate_audio`. يُمرَّر `providerOptions.seed`
    (رقم).

  </Accordion>
  <Accordion title="ComfyUI">
    تنفيذ محلي أو سحابي قائم على سير العمل. يدعم تحويل النص إلى فيديو و
    الصورة إلى فيديو عبر الرسم البياني المكوّن.
  </Accordion>
  <Accordion title="fal">
    يستخدم تدفقًا مدعومًا بقائمة انتظار للمهام طويلة التشغيل. تقبل معظم نماذج فيديو fal
    مرجع صورة واحدًا. تقبل نماذج Seedance 2.0 من المرجع إلى الفيديو
    حتى 9 صور، و3 فيديوهات، و3 مراجع صوتية، مع
    ما لا يزيد على 12 ملفًا مرجعيًا إجمالًا.
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    يدعم مرجع صورة واحدًا أو مرجع فيديو واحدًا.
  </Accordion>
  <Accordion title="MiniMax">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="OpenAI">
    يُمرَّر تجاوز `size` فقط. تُتجاهل تجاوزات النمط الأخرى
    (`aspectRatio`، و`resolution`، و`audio`، و`watermark`) مع
    تحذير.
  </Accordion>
  <Accordion title="OpenRouter">
    يستخدم API `/videos` غير المتزامنة من OpenRouter. يرسل OpenClaw
    المهمة، ويستطلع `polling_url`، وينزّل إما `unsigned_urls` أو
    نقطة نهاية محتوى المهمة الموثقة. يعلن الافتراضي المضمّن `google/veo-3.1-fast`
    مددًا قدرها 4/6/8 ثوانٍ، ودقات `720P`/`1080P`، و
    نسب عرض إلى ارتفاع `16:9`/`9:16`.
  </Accordion>
  <Accordion title="Qwen">
    الواجهة الخلفية نفسها DashScope مثل Alibaba. يجب أن تكون مُدخلات المراجع عناوين URL بعيدة
    من نوع `http(s)`؛ تُرفض الملفات المحلية مسبقًا.
  </Accordion>
  <Accordion title="Runway">
    يدعم الملفات المحلية عبر معرّفات URI للبيانات. يتطلب تحويل الفيديو إلى فيديو
    `runway/gen4_aleph`. تعرض عمليات النص فقط نسب عرض إلى ارتفاع `16:9` و`9:16`.
  </Accordion>
  <Accordion title="Together">
    مرجع صورة واحد فقط.
  </Accordion>
  <Accordion title="Vydra">
    يستخدم `https://www.vydra.ai/api/v1` مباشرةً لتجنب عمليات إعادة التوجيه
    التي تسقط المصادقة. يُضمَّن `veo3` كتحويل نص إلى فيديو فقط؛ ويتطلب `kling`
    عنوان URL بعيدًا لصورة.
  </Accordion>
  <Accordion title="xAI">
    يدعم تحويل النص إلى فيديو، وتحويل صورة إطار أول واحدة إلى فيديو، وما يصل إلى 7
    مُدخلات `reference_image` عبر `reference_images` في xAI، وتدفقات تحرير/تمديد
    الفيديو عن بُعد.
  </Accordion>
</AccordionGroup>

## أوضاع إمكانات المزوّد

يدعم عقد توليد الفيديو المشترك قدرات خاصة بكل وضع بدلاً من حدود تجميعية مسطّحة فقط. ينبغي لتنفيذات المزوّدين الجديدة تفضيل كتل الأوضاع الصريحة:

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

الحقول التجميعية المسطّحة مثل `maxInputImages` و`maxInputVideos` **ليست** كافية للإعلان عن دعم وضع التحويل. ينبغي للمزوّدين التصريح بـ `generate` و`imageToVideo` و`videoToVideo` بشكل صريح حتى تتمكن الاختبارات الحية، واختبارات العقد، وأداة `video_generate` المشتركة من التحقق من دعم الوضع بصورة حتمية.

عندما يتمتع نموذج واحد لدى مزوّد بدعم أوسع لإدخال المراجع من البقية، استخدم `maxInputImagesByModel` أو `maxInputVideosByModel` أو `maxInputAudiosByModel` بدلاً من رفع الحد على مستوى الوضع كله.

## الاختبارات الحية

تغطية حية اختيارية التفعيل للمزوّدين المضمّنين المشتركين:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

غلاف المستودع:

```bash
pnpm test:live:media video
```

يحمّل هذا الملف الحي متغيرات بيئة المزوّد المفقودة من `~/.profile`، ويفضّل مفاتيح API الحية/من البيئة على ملفات تعريف المصادقة المخزنة افتراضياً، ويشغّل اختباراً دخانياً آمناً للإصدار افتراضياً:

- `generate` لكل مزوّد غير FAL في الجولة.
- مطالبة سرطان بحر مدتها ثانية واحدة.
- حد عمليات لكل مزوّد من
  `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` افتراضياً).

يكون FAL اختيارياً لأن زمن انتظار الطابور من جهة المزوّد قد يهيمن على وقت الإصدار:

```bash
pnpm test:live:media video --video-providers fal
```

عيّن `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` لتشغيل أوضاع التحويل المصرّح بها أيضاً والتي يمكن للجولة المشتركة اختبارها بأمان باستخدام وسائط محلية:

- `imageToVideo` عندما يكون `capabilities.imageToVideo.enabled`.
- `videoToVideo` عندما يكون `capabilities.videoToVideo.enabled` ويقبل
  المزوّد/النموذج إدخال فيديو محلياً مدعوماً بالمخزن المؤقت في الجولة المشتركة.

حالياً، يغطي مسار `videoToVideo` الحي المشترك `runway` فقط عندما تحدد `runway/gen4_aleph`.

## التكوين

عيّن نموذج توليد الفيديو الافتراضي في تكوين OpenClaw لديك:

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
- [المهام الخلفية](/ar/automation/tasks) — تتبع المهام لتوليد الفيديو غير المتزامن
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
