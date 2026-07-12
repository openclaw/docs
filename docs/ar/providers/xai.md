---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تهيّئ مصادقة xAI أو معرّفات النماذج
summary: استخدام نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-12T06:32:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eba797fbb2f4f2a47c8e07daabe93ef4f6e5a8077d3c739b0f6b9c99283995e1
    source_path: providers/xai.md
    workflow: 16
---

يأتي OpenClaw مزودًا بمكوّن `xai` إضافي مضمّن لنماذج Grok. المسار
الموصى به هو استخدام OAuth الخاص بـ Grok مع اشتراك SuperGrok أو X Premium
مؤهل. تظل Gateway والإعداد والتوجيه والأدوات محلية؛ ولا تُرسل سوى طلبات Grok
إلى واجهة API الخاصة بـ xAI.

لا يتطلب OAuth مفتاح API لـ xAI أو تطبيق Grok Build. ومع ذلك، قد تعرض xAI
تطبيق Grok Build في شاشة الموافقة لأن OpenClaw يستخدم عميل OAuth المشترك
الخاص بـ xAI.

## الإعداد

<Steps>
  <Step title="تثبيت جديد">
    شغّل الإعداد الأولي مع تثبيت الخدمة الخفية، ثم اختر OAuth الخاص بـ xAI/Grok في
    خطوة النموذج/المصادقة:

    ```bash
    openclaw onboard --install-daemon
    ```

    على خادم VPS أو عبر SSH، اختر OAuth الخاص بـ xAI مباشرةً؛ فهو يستخدم التحقق
    برمز الجهاز ولا يحتاج إلى رد نداء على المضيف المحلي:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="تثبيت موجود">
    سجّل الدخول إلى xAI فقط؛ لا تُعد تشغيل الإعداد الأولي الكامل لمجرد ربط Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    عيّن Grok كنموذج افتراضي بشكل منفصل:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    لا تُعد تشغيل الإعداد الأولي الكامل إلا إذا كنت تريد عمدًا تغيير Gateway أو
    الخدمة الخفية أو القناة أو مساحة العمل أو خيارات إعداد أخرى.

  </Step>
  <Step title="مسار مفتاح API">
    لا يزال الإعداد باستخدام مفتاح API يعمل مع مفاتيح xAI Console ومع واجهات الوسائط
    التي تحتاج إلى إعداد موفّر مستند إلى مفتاح:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="اختيار نموذج">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
يستخدم OpenClaw واجهة Responses API الخاصة بـ xAI كوسيلة نقل xAI المضمّنة. بيانات
الاعتماد نفسها الناتجة عن `openclaw models auth login --provider xai --method oauth` أو
`--method api-key` تشغّل أيضًا `web_search` (معرّف الموفّر `grok`) و`x_search`
و`code_execution` وتحويل الكلام/النسخ وتوليد الصور/الفيديو عبر xAI. إذا خزّنت
مفتاح xAI ضمن `plugins.entries.xai.config.webSearch.apiKey`، فسيعيد موفّر
نماذج xAI المضمّن استخدامه أيضًا كخيار احتياطي.
</Note>

## استكشاف أخطاء OAuth وإصلاحها

- لاستخدام SSH أو Docker أو VPS أو إعدادات بعيدة أخرى، استخدم
  `openclaw models auth login --provider xai --method oauth`؛ فهو يستخدم
  التحقق برمز الجهاز، وليس رد نداء على المضيف المحلي.
- إذا نجح تسجيل الدخول لكن Grok لم يصبح النموذج الافتراضي، فشغّل
  `openclaw models set xai/grok-4.3`.
- افحص ملفات تعريف مصادقة xAI المحفوظة:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- تحدد xAI الحسابات التي يمكنها تلقي رموز API عبر OAuth. إذا لم يكن الحساب
  مؤهلًا، فاستخدم مسار مفتاح API أو تحقق من الاشتراك لدى xAI.

<Tip>
استخدم `xai-oauth` عند تسجيل الدخول من SSH أو Docker أو VPS. يطبع OpenClaw
عنوان URL ورمزًا قصيرًا؛ أكمل تسجيل الدخول في أي متصفح محلي بينما تستعلم
العملية البعيدة دوريًا من xAI عن اكتمال تبادل الرمز.
</Tip>

## الكتالوج المضمّن

المعرّفات القابلة للاختيار في منتقيات النماذج. لا يزال المكوّن الإضافي يحل معرّفات
Grok 3 وGrok 4 وGrok 4 Fast وGrok 4.1 Fast وGrok Code القديمة للإعدادات الحالية؛
راجع [التوافق القديم والأسماء البديلة المتغيرة](#legacy-compatibility-and-moving-aliases).

| العائلة         | معرّفات النماذج                                              |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (الأسماء البديلة: `grok-4.5-latest`، `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (الأسماء البديلة: `grok-4.3-latest`، `grok-latest`) |
| Grok 4.20      | `grok-4.20-0309-reasoning`، `grok-4.20-0309-non-reasoning`   |

<Tip>
استخدم `grok-4.5` للدردشة العامة والبرمجة والعمل الوكيلي حيثما كان متاحًا.
يظل Grok 4.3 خيار الإعداد الافتراضي الآمن إقليميًا؛ ويظل `grok-build-0.1`
وكلا إصدارَي Grok 4.20 المؤرخين قابلين للاختيار.
</Tip>

## تغطية الميزات

يربط المكوّن الإضافي المضمّن واجهات API المدعومة من xAI بعقود الموفّرين والأدوات
المشتركة في OpenClaw. تُدرج الإمكانات التي لا تلائم العقد المشترك أدناه أو ضمن
القيود المعروفة.

| إمكانية xAI                | واجهة OpenClaw                           | الحالة                                                        |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| الدردشة / Responses        | موفّر النموذج `xai/<model>`             | نعم                                                           |
| بحث الويب من جانب الخادم   | موفّر `web_search` بالقيمة `grok`       | نعم                                                           |
| بحث X من جانب الخادم       | أداة `x_search`                         | نعم                                                           |
| تنفيذ التعليمات البرمجية من جانب الخادم | أداة `code_execution`                   | نعم                                                           |
| الصور                      | `image_generate`                        | نعم                                                           |
| الفيديوهات                 | `video_generate`                        | سير العمل الكلاسيكي الكامل؛ تحويل الصورة إلى فيديو عبر Video 1.5 |
| تحويل النص إلى كلام على دفعات | `messages.tts.provider: "xai"` / `tts`  | نعم                                                           |
| البث المتدفق لتحويل النص إلى كلام | -                                       | لم ينفّذه موفّر xAI بعد                                       |
| تحويل الكلام إلى نص على دفعات | فهم الوسائط عبر `tools.media.audio`     | نعم                                                           |
| البث المتدفق لتحويل الكلام إلى نص | مكالمة صوتية عبر `streaming.provider: "xai"` | نعم                                                      |
| الصوت في الوقت الفعلي      | -                                       | غير متاح بعد؛ يحتاج إلى عقد جلسة/WebSocket مختلف              |
| الملفات / الدُفعات         | توافق عام مع واجهة API للنماذج فقط      | ليست أداة من الدرجة الأولى في OpenClaw                        |

<Note>
يستخدم OpenClaw واجهات REST الخاصة بـ xAI للصور والفيديو وتحويل النص إلى كلام
وتحويل الكلام إلى نص، وذلك لتوليد الوسائط والنسخ على دفعات، ويستخدم WebSocket
للبث المتدفق لتحويل الكلام إلى نص من xAI لنسخ المكالمات الصوتية المباشرة،
ويستخدم Responses API للدردشة والبحث وأدوات تنفيذ التعليمات البرمجية.
</Note>

### توافق الوضع السريع القديم

لا يزال `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
يعيد كتابة إعدادات xAI القديمة كما يلي. يُحتفظ بهذه المعرّفات المستهدفة
للتوافق فقط؛ استخدم النماذج الحالية القابلة للاختيار للإعدادات الجديدة.

| النموذج المصدر | هدف الوضع السريع  |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### التوافق القديم والأسماء البديلة المتغيرة

تُطبّع الأسماء البديلة القديمة كما يلي:

| الاسم البديل القديم                                           | المعرّف المطبّع   |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

معرّفات 0309 المؤرخة هي إدخالات الكتالوج القابلة للاختيار. يرسل OpenClaw جميع
الأسماء البديلة الحالية الأخرى لـ Grok 4.20 حرفيًا لكي تحتفظ xAI بالتحكم في
دلالات الأسماء البديلة المستقرة والأحدث والتجريبية والمؤرخة. كما يُحتفظ بالاسم
البديل العام `grok-latest` حرفيًا.

أوقفت xAI المعرّفات الدقيقة التالية. يحتفظ بها OpenClaw كصفوف توافق مخفية
للإعدادات التي تم إصدارها، مع حدود وأسعار أهداف إعادة التوجيه الحالية:

| المعرّفات المتوقفة                                                   | السلوك الحالي                    |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | Grok 4.3 مع مستوى استدلال `low`  |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | Grok 4.3 مع تعطيل الاستدلال      |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine Image Quality       |

يحدّث `openclaw doctor --fix` الإعدادات الافتراضية المحفوظة لأدوات خادم xAI
ومعرّف صورة الجودة المتوقف، ويزيل صفوف الكتالوج المُنشأة القديمة، ويصلح
بيانات السياق الوصفية القديمة في صفوف 4.20 النشطة. ولا يثبّت الأسماء البديلة
النشطة `beta-latest` لـ 4.20 على لقطة مؤرخة.

## الميزات

<Warning>
  تعمل `x_search` و`code_execution` على خوادم xAI. تفرض xAI رسومًا قدرها 5 دولارات
  لكل 1,000 استدعاء أداة، بالإضافة إلى رموز الإدخال والإخراج الخاصة بالنموذج.
  عند حذف إعداد `enabled` لكل أداة، لا يعرضها OpenClaw إلا لنموذج xAI نشط.
  يتطلب موفّر نموذج معروف غير تابع لـ xAI تعيين `enabled: true` صراحةً لكل أداة؛
  ويؤدي غياب الموفّر أو تعذر حله إلى الإخفاق المغلق. تكون مصادقة xAI مطلوبة دائمًا،
  ويعطّل `enabled: false` الأداة لكل موفّر.
</Warning>

<AccordionGroup>
  <Accordion title="بحث الويب">
    يفضّل موفّر بحث الويب `grok` المضمّن OAuth الخاص بـ xAI، ثم يعود احتياطيًا
    إلى `XAI_API_KEY` أو مفتاح بحث ويب خاص بالمكوّن الإضافي:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="توليد الفيديو">
    يسجّل المكوّن الإضافي `xai` المضمّن توليد الفيديو من خلال أداة
    `video_generate` المشتركة.

    - النموذج الافتراضي: `xai/grok-imagine-video`
    - نموذج إضافي: `xai/grok-imagine-video-1.5`
    - الأوضاع الكلاسيكية: تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، والتوليد
      من صورة مرجعية، وتحرير فيديو بعيد، وتمديد فيديو بعيد
    - وضع Video 1.5: تحويل الصورة إلى فيديو فقط، باستخدام صورة واحدة بالضبط للإطار الأول
    - نسب العرض إلى الارتفاع: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`؛
      يرث تحويل الصورة إلى فيديو في الوضع الكلاسيكي وVideo 1.5 نسبة الصورة المصدر عند
      حذفها
    - درجات الدقة: الوضع الكلاسيكي `480P`/`720P`؛ ويدعم Video 1.5 أيضًا `1080P`؛
      وتكون القيمة الافتراضية لجميع أوضاع التوليد `480P`
    - المدة: من 1 إلى 15 ثانية للتوليد/تحويل الصورة إلى فيديو، ومن 1 إلى 10 ثوانٍ عند
      استخدام أدوار `reference_image` الكلاسيكية، ومن 2 إلى 10 ثوانٍ للتمديد الكلاسيكي
    - التوليد من صورة مرجعية: عيّن `imageRoles` إلى `reference_image` لكل
      صورة مقدّمة؛ تقبل xAI ما يصل إلى 7 صور من هذا النوع
    - يرث تحرير/تمديد الفيديو نسبة العرض إلى الارتفاع ودقة الفيديو المُدخل؛
      ولا تقبل هذه العمليات تجاوز إعدادات الأبعاد
    - المهلة الافتراضية للعملية: 600 ثانية ما لم يُعيّن `video_generate.timeoutMs`
      أو `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    لا تُقبل مخازن الفيديو المؤقتة المحلية. استخدم عناوين URL بعيدة من نوع `http(s)`
    لمدخلات تحرير/تمديد الفيديو. يقبل تحويل الصورة إلى فيديو مخازن الصور المؤقتة
    المحلية لأن OpenClaw يرمّزها كعناوين URL للبيانات لصالح xAI.
    </Warning>

    يتعرف Video 1.5 أيضًا على معرّفَي xAI وهما `grok-imagine-video-1.5-preview`
    و`grok-imagine-video-1.5-2026-05-30`. يمرّر OpenClaw المعرّف المحدد
    دون تغيير، لكنه يطبق التحقق نفسه الذي يسمح بالصور فقط.

    لاستخدام xAI كموفّر الفيديو الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة
    واختيار الموفّر وسلوك التحويل الاحتياطي.
    </Note>

  </Accordion>

  <Accordion title="توليد الصور">
    يسجّل المكوّن الإضافي `xai` المضمّن توليد الصور من خلال أداة
    `image_generate` المشتركة.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-quality`
    - الأوضاع: تحويل النص إلى صورة وتحرير الصورة المرجعية
    - المدخلات المرجعية: حقل `image` واحد أو ما يصل إلى ثلاثة حقول `images`
    - نسب العرض إلى الارتفاع: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`، `2:1`،
      `1:2`، `19.5:9`، `9:19.5`، `20:9`، `9:20`
    - درجات الدقة: `1K`، `2K`
    - العدد: ما يصل إلى 4 صور
    - المهلة الافتراضية للعملية: 600 ثانية ما لم يُضبط `image_generate.timeoutMs`
      أو `agents.defaults.imageGenerationModel.timeoutMs`

    يطلب OpenClaw من xAI استجابات صور بصيغة `b64_json` كي يمكن تخزين الوسائط
    المُنشأة وتسليمها عبر مسار مرفقات القنوات المعتاد. تُحوَّل الصور المرجعية
    المحلية إلى عناوين URL للبيانات؛ أما المراجع البعيدة عبر `http(s)` فتمر
    من دون تغيير.

    لاستخدام xAI بوصفه موفّر الصور الافتراضي:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    توثّق xAI أيضًا `quality` و`mask` و`user` ونسبة العرض إلى الارتفاع `auto`.
    لا يمرّر OpenClaw حاليًا سوى عناصر التحكم المشتركة بين موفّري الصور؛
    ولا تتوفر هذه الإعدادات الأصلية الحصرية عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجّل Plugin `xai` المضمّن ميزة تحويل النص إلى كلام عبر واجهة موفّر `tts`
    المشتركة.

    - الأصوات: كتالوج مباشر موثّق من xAI؛ اعرضه باستخدام
      `openclaw infer tts voices --provider xai`
    - أصوات الرجوع الاحتياطي دون اتصال: `ara`، `eve`، `leo`، `rex`، `sal`
    - الصوت الافتراضي: `eve`
    - تُمرّر معرّفات الأصوات المخصّصة للحساب حتى إن لم تكن موجودة في استجابة
      الكتالوج المضمّن
    - التنسيقات: `mp3`، `wav`، `pcm`، `mulaw`، `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز أصلي للسرعة لدى الموفّر
    - تنسيق ملاحظات Opus الصوتية الأصلي غير مدعوم

    لاستخدام xAI بوصفه موفّر TTS الافتراضي:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    يستخدم OpenClaw نقطة النهاية الدفعية `/v1/tts` والكتالوج الموثّق
    `/v1/tts/voices` من xAI. توفر xAI أيضًا بث TTS عبر WebSocket، لكن
    موفّر xAI المضمّن لا ينفّذ نقطة ربط البث هذه بعد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin `xai` المضمّن تحويل الكلام إلى نص على دفعات عبر واجهة النسخ
    الخاصة بفهم الوسائط في OpenClaw.

    - نقطة النهاية: واجهة REST من xAI‏ `/v1/stt`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - اختيار النموذج: تختار xAI نموذج النسخ داخليًا؛ ولا تحتوي نقطة النهاية
      على محدّد للنموذج
    - يُستخدم حيثما يقرأ نسخ الصوت الوارد `tools.media.audio`، بما في ذلك
      مقاطع القنوات الصوتية في Discord ومرفقات القنوات الصوتية

    لفرض استخدام xAI في نسخ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    يمكن توفير اللغة عبر إعداد الوسائط الصوتية المشترك أو طلب النسخ الخاص
    بكل استدعاء. تقبل واجهة OpenClaw المشتركة تلميحات المطالبة، لكن تكامل
    STT عبر REST من xAI لا يمرّر سوى الملف واللغة لأنهما يتوافقان مع نقطة
    النهاية العامة الحالية لدى xAI.

  </Accordion>

  <Accordion title="البث لتحويل الكلام إلى نص">
    يسجّل Plugin `xai` المضمّن أيضًا موفّر نسخ في الوقت الفعلي لصوت
    المكالمات الصوتية المباشرة.

    - نقطة النهاية: WebSocket من xAI‏ `wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل أخذ العينات الافتراضي: `8000`
    - تحديد نهاية الكلام الافتراضي: `800ms`
    - النصوص المؤقتة: مفعّلة افتراضيًا

    يرسل تدفق وسائط Twilio الخاص بـ Voice Call إطارات صوت G.711 mu-law،
    لذا يمرّر موفّر xAI هذه الإطارات مباشرةً من دون تحويل ترميز:

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    توجد الإعدادات المملوكة للموفّر ضمن
    `plugins.entries.voice-call.config.streaming.providers.xai`. المفاتيح
    المدعومة هي `apiKey` و`baseUrl` و`sampleRate` و`encoding` ‏(`pcm` أو `mulaw`
    أو `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    هذا الموفّر المتدفق مخصّص لمسار النسخ في الوقت الفعلي لدى Voice Call.
    يسجّل Discord مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="إعداد x_search">
    يوفّر Plugin xAI المضمّن الأداة `x_search` ضمن OpenClaw للبحث في محتوى
    X ‏(المعروف سابقًا باسم Twitter) عبر Grok.

    مسار الإعداد: `plugins.entries.xai.config.xSearch`

    | المفتاح           | النوع   | الافتراضي                 | الوصف                                             |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------- |
    | `enabled`         | منطقي   | تلقائي لنماذج xAI         | عطّله، أو فعّله لموفّر معروف غير تابع لـ xAI     |
    | `model`           | سلسلة   | `grok-4.3`                | النموذج المستخدم لطلبات `x_search`               |
    | `baseUrl`         | سلسلة   | -                         | تجاوز عنوان URL الأساسي لاستجابات xAI            |
    | `inlineCitations` | منطقي   | -                         | تضمين الاستشهادات المضمّنة في النتائج            |
    | `maxTurns`        | رقم     | -                         | الحد الأقصى لجولات المحادثة                       |
    | `timeoutSeconds`  | رقم     | `30`                      | مهلة الطلب بالثواني                               |
    | `cacheTtlMinutes` | رقم     | `15`                      | مدة بقاء ذاكرة التخزين المؤقت بالدقائق            |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="إعداد تنفيذ التعليمات البرمجية">
    يوفّر Plugin xAI المضمّن الأداة `code_execution` ضمن OpenClaw لتنفيذ
    التعليمات البرمجية عن بُعد في بيئة xAI المعزولة.

    مسار الإعداد: `plugins.entries.xai.config.codeExecution`

    | المفتاح          | النوع   | الافتراضي                | الوصف                                         |
    | ---------------- | ------- | ------------------------ | --------------------------------------------- |
    | `enabled`        | منطقي   | تلقائي لنماذج xAI       | عطّله، أو فعّله لموفّر معروف غير تابع لـ xAI |
    | `model`          | سلسلة   | `grok-4.3`               | النموذج المستخدم لطلبات تنفيذ التعليمات البرمجية |
    | `maxTurns`       | رقم     | -                        | الحد الأقصى لجولات المحادثة                  |
    | `timeoutSeconds` | رقم     | `30`                     | مهلة الطلب بالثواني                          |

    <Note>
    هذا تنفيذ عن بُعد في بيئة xAI المعزولة، وليس [`exec`](/ar/tools/exec) المحلي.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="القيود المعروفة">
    - يمكن لمصادقة xAI استخدام مفتاح API أو متغير بيئة أو رجوع احتياطي إلى
      إعداد Plugin أو OAuth مع حساب xAI مؤهّل. يستخدم OAuth التحقق برمز الجهاز
      من دون استدعاء عكسي إلى localhost. تحدد xAI الحسابات التي يمكنها تلقي
      رموز OAuth لواجهة API، وقد تعرض صفحة الموافقة Grok Build رغم أن
      OpenClaw لا يتطلب تطبيق Grok Build.
    - لا يوفّر OpenClaw حاليًا عائلة نماذج الوكلاء المتعددين من xAI. تقدّم xAI
      هذه النماذج عبر واجهة Responses API، لكنها لا تقبل أدوات جهة العميل أو
      الأدوات المخصّصة التي تستخدمها حلقة الوكيل المشتركة في OpenClaw.
      راجع
      [قيود الوكلاء المتعددين في xAI](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - لم يُسجّل صوت xAI Realtime بعد بوصفه موفّرًا في OpenClaw. فهو يحتاج إلى
      عقد جلسة صوتية ثنائية الاتجاه يختلف عن STT الدفعي أو النسخ المتدفق.
    - لا تتوفر `quality` للصور و`mask` للصور ونسبة العرض إلى الارتفاع الأصلية
      `auto` في xAI حتى تحتوي أداة `image_generate` المشتركة على عناصر تحكم
      مقابلة مشتركة بين الموفّرين.
  </Accordion>

  <Accordion title="ملاحظات متقدمة">
    - يطبّق OpenClaw تلقائيًا إصلاحات التوافق الخاصة بـ xAI لمخطط الأدوات
      واستدعاءات الأدوات ضمن مسار المشغّل المشترك.
    - تستخدم طلبات xAI الأصلية القيمة `tool_stream: true` افتراضيًا. اضبط
      `agents.defaults.models["xai/<model>"].params.tool_stream` على `false`
      لتعطيلها.
    - يزيل غلاف xAI المضمّن حدود عدد الاحتواء غير المدعومة في المخطط ومفاتيح
      حمولة *جهد* الاستدلال غير المدعومة قبل إرسال طلبات xAI الأصلية. يدعم
      Grok 4.5 الجهد المنخفض والمتوسط والعالي (الافتراضي: عالٍ). يدعم Grok 4.3
      عدم استخدام الجهد والجهد المنخفض والمتوسط والعالي (الافتراضي: منخفض).
      لا تتيح نماذج xAI الأخرى القادرة على الاستدلال التحكم في الجهد القابل
      للإعداد، لكنها تظل تطلب
      `include: ["reasoning.encrypted_content"]` كي يمكن إعادة تشغيل الاستدلال
      المشفّر السابق في الجولات اللاحقة.
    - تتوفر `web_search` و`x_search` و`code_execution` كأدوات OpenClaw.
      يرفق OpenClaw بكل طلب أداة الوظيفة المضمّنة المحددة من xAI التي تحتاجها
      تلك الأداة فقط، بدلًا من إرفاق كل الأدوات الأصلية بكل جولة محادثة.
    - يقرأ `web_search` في Grok القيمة
      `plugins.entries.xai.config.webSearch.baseUrl`.
      ويقرأ `x_search` القيمة `plugins.entries.xai.config.xSearch.baseUrl`، ثم
      يرجع احتياطيًا إلى عنوان URL الأساسي لبحث Grok على الويب.
    - يملك Plugin xAI المضمّن `x_search` و`code_execution` بدلًا من ترميزهما
      مباشرةً في وقت تشغيل النموذج الأساسي.
    - `code_execution` هو تنفيذ عن بُعد في بيئة xAI المعزولة، وليس
      [`exec`](/ar/tools/exec) المحلي.
  </Accordion>
</AccordionGroup>

## الاختبار المباشر

تغطي اختبارات الوحدات وحزم الاختبارات المباشرة الاختيارية مسارات الوسائط في
xAI. صدّر `XAI_API_KEY` في بيئة العملية قبل تشغيل عمليات الفحص المباشر.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

يُنشئ ملف الاختبار المباشر الخاص بالمزوّد تحويلًا عاديًا من النص إلى كلام (TTS)، وتحويلًا إلى كلام بصيغة PCM ملائمة للاتصالات الهاتفية، وينسخ الصوت عبر التحويل الدفعي من الكلام إلى نص (STT) من xAI، ويبث صيغة PCM نفسها عبر التحويل الفوري من الكلام إلى نص من xAI، ويُنشئ مخرجات من النص إلى صورة، ويُحرّر صورة مرجعية.
يتحقق ملف الاختبار المباشر المشترك للصور من مزوّد xAI نفسه عبر مسار اختيار وقت التشغيل في OpenClaw، والتبديل الاحتياطي، والتطبيع، وإرفاق الوسائط. ترسل حالة Video 1.5 الاختيارية صورة واحدة مُنشأة للإطار الأول بدقة 1080P، وتتحقق من تنزيل الفيديو المكتمل.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="جميع المزوّدين" href="/ar/providers/index" icon="grid-2">
    نظرة عامة أوسع على المزوّدين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وإصلاحاتها.
  </Card>
</CardGroup>
