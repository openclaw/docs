---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تهيّئ مصادقة xAI أو معرّفات النماذج
summary: استخدام نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-07-16T15:00:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

يأتي OpenClaw مزودًا بـ Plugin موفر `xai` مضمّن لنماذج Grok. والمسار
الموصى به هو Grok OAuth مع اشتراك SuperGrok أو X Premium
مؤهل. تظل Gateway والإعدادات والتوجيه والأدوات محلية؛ ولا تُرسل سوى طلبات Grok
إلى واجهة API الخاصة بـ xAI.

لا يتطلب OAuth مفتاح xAI API أو تطبيق Grok Build. ومع ذلك، قد تعرض xAI
تطبيق Grok Build على شاشة الموافقة لأن OpenClaw يستخدم عميل OAuth
المشترك الخاص بـ xAI.

## الإعداد

<Steps>
  <Step title="تثبيت جديد">
    شغّل الإعداد الأولي مع تثبيت البرنامج الخفي، ثم اختر xAI/Grok OAuth في
    خطوة النموذج/المصادقة:

    ```bash
    openclaw onboard --install-daemon
    ```

    على VPS أو عبر SSH، اختر xAI OAuth مباشرةً؛ فهو يستخدم التحقق
    برمز الجهاز ولا يحتاج إلى رد اتصال على localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="تثبيت موجود">
    سجّل الدخول إلى xAI فقط؛ ولا تُعِد تشغيل الإعداد الأولي الكامل لمجرد ربط Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    عيّن Grok كنموذج افتراضي بشكل منفصل:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    لا تُعِد تشغيل الإعداد الأولي الكامل إلا إذا كنت تريد عمدًا تغيير Gateway
    أو البرنامج الخفي أو القناة أو مساحة العمل أو خيارات إعداد أخرى.

  </Step>
  <Step title="مسار مفتاح API">
    لا يزال الإعداد بمفتاح API يعمل مع مفاتيح xAI Console ومع أسطح الوسائط
    التي تحتاج إلى إعداد موفر مدعوم بمفتاح:

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
يستخدم OpenClaw واجهة xAI Responses API بوصفها وسيلة نقل xAI المضمّنة. بيانات
الاعتماد نفسها من `openclaw models auth login --provider xai --method oauth` أو
`--method api-key` تشغّل أيضًا `web_search` (معرّف الموفر `grok`) و`x_search`
و`code_execution`، والكلام/النسخ، وتوليد الصور/الفيديو عبر xAI. إذا
خزّنت مفتاح xAI ضمن `plugins.entries.xai.config.webSearch.apiKey`، فسيعيد
موفر نماذج xAI المضمّن استخدامه أيضًا كخيار احتياطي.
</Note>

## استكشاف أخطاء OAuth وإصلاحها

- بالنسبة إلى SSH أو Docker أو VPS أو الإعدادات البعيدة الأخرى، استخدم
  `openclaw models auth login --provider xai --method oauth`؛ فهو يستخدم
  التحقق برمز الجهاز، وليس رد اتصال على localhost.
- إذا نجح تسجيل الدخول لكن Grok ليس النموذج الافتراضي، فشغّل
  `openclaw models set xai/grok-4.3`.
- افحص ملفات تعريف مصادقة xAI المحفوظة:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- تقرر xAI الحسابات التي يمكنها تلقي رموز OAuth لواجهة API. إذا كان الحساب
  غير مؤهل، فاستخدم مسار مفتاح API أو تحقق من الاشتراك لدى xAI.

<Tip>
استخدم `xai-oauth` عند تسجيل الدخول من SSH أو Docker أو VPS. يطبع OpenClaw
عنوان URL ورمزًا قصيرًا؛ وأكمل تسجيل الدخول في أي متصفح محلي بينما تتحقق
العملية البعيدة دوريًا من xAI لإتمام تبادل الرمز.
</Tip>

## الكتالوج المضمّن

المعرّفات القابلة للاختيار في منتقيات النماذج. لا يزال Plugin يحل معرّفات Grok 3
وGrok 4 وGrok 4 Fast وGrok 4.1 Fast وGrok Code القديمة للإعدادات الحالية؛
راجع [التوافق القديم والأسماء المستعارة المتغيرة](#legacy-compatibility-and-moving-aliases).

| العائلة         | معرّفات النماذج                                                    |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (الأسماء المستعارة: `grok-4.5-latest`، `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (الأسماء المستعارة: `grok-4.3-latest`، `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`، `grok-4.20-0309-non-reasoning`   |

<Tip>
استخدم `grok-4.5` للدردشة العامة والبرمجة والعمل الوكيلي حيثما كان متاحًا.
يظل Grok 4.3 الإعداد الافتراضي الآمن إقليميًا؛ وتظل `grok-build-0.1` وكلا
إصداري Grok 4.20 المؤرخين قابلين للاختيار.
</Tip>

## تغطية الميزات

يربط Plugin المضمّن واجهات xAI API المدعومة بعقود الموفر والأدوات
المشتركة في OpenClaw. وترد أدناه، أو ضمن القيود المعروفة، الإمكانات التي
لا تتوافق مع العقد المشترك.

| إمكانية xAI             | سطح OpenClaw                        | الحالة                                               |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| الدردشة / الاستجابات           | موفر النموذج `xai/<model>`            | نعم                                                  |
| البحث على الويب من جانب الخادم     | موفر `web_search` ‏`grok`            | نعم                                                  |
| البحث في X من جانب الخادم       | أداة `x_search`                         | نعم                                                  |
| تنفيذ التعليمات البرمجية من جانب الخادم | أداة `code_execution`                   | نعم                                                  |
| الصور                     | `image_generate`                        | نعم                                                  |
| مقاطع الفيديو                     | `video_generate`                        | نعم                                                  |
| تحويل النص إلى كلام على دفعات       | `messages.tts.provider: "xai"` / `tts`  | نعم                                                  |
| تحويل النص إلى كلام بالتدفق              | `textToSpeechStream`                    | نعم عبر `wss://api.x.ai/v1/tts` (ليس صوتًا فوريًا) |
| تحويل الكلام إلى نص على دفعات       | فهم الوسائط `tools.media.audio` | نعم                                                  |
| تحويل الكلام إلى نص بالتدفق   | Voice Call ‏`streaming.provider: "xai"`  | نعم                                                  |
| الصوت الفوري             | Talk ‏`talk.realtime.provider: "xai"`    | نعم؛ ترحيل عبر Gateway لعُقد Talk الأصلية             |
| الملفات / الدُفعات            | توافق عام مع واجهة API للنماذج فقط    | ليست أداة OpenClaw من الدرجة الأولى                      |

<Note>
يستخدم OpenClaw واجهات REST API الخاصة بـ xAI للصور/الفيديو/تحويل النص إلى كلام/تحويل الكلام إلى نص لتوليد الوسائط
والنسخ على دفعات، وWebSocket المتدفق لتحويل الكلام إلى نص من xAI لنسخ المكالمات الصوتية
مباشرةً، وWebSocket الخاص بـ Grok Voice Agent من xAI لجلسات Talk الفورية،
وواجهة Responses API للدردشة والبحث وأدوات تنفيذ التعليمات البرمجية.
</Note>

### توافق الوضع السريع القديم

لا يزال `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
يعيد كتابة إعدادات xAI القديمة كما يلي. لا يُحتفظ بهذه المعرّفات المستهدفة
إلا للتوافق؛ استخدم النماذج الحالية القابلة للاختيار للإعدادات
الجديدة.

| النموذج المصدر  | هدف الوضع السريع   |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### التوافق القديم والأسماء المستعارة المتغيرة

تُطبّع الأسماء المستعارة القديمة كما يلي:

| الاسم المستعار القديم                                                  | المعرّف المُطبّع    |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`، `grok-code-fast`، `grok-code-fast-1-0825` | `grok-build-0.1` |

تُعد معرّفات 0309 المؤرخة إدخالات الكتالوج القابلة للاختيار. يرسل OpenClaw جميع
الأسماء المستعارة الحالية الأخرى لـ Grok 4.20 كما هي حتى تظل xAI متحكمة في دلالات
الأسماء المستعارة المستقرة والأحدث والتجريبية والأولية والمؤرخة. ويُحتفظ أيضًا بالاسم
المستعار العام `grok-latest` كما هو.

أوقفت xAI المعرّفات الدقيقة التالية. ويحتفظ بها OpenClaw كصفوف توافق مخفية
للإعدادات المشحونة، مع حدود وأثمان أهداف إعادة التوجيه
الحالية:

| المعرّفات المتوقفة                                                          | السلوك الحالي                 |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`، `grok-4-fast-reasoning`، `grok-4-0709`    | Grok 4.3 مع استدلال `low`    |
| `grok-4-1-fast-non-reasoning`، `grok-4-fast-non-reasoning`، `grok-3` | Grok 4.3 مع تعطيل الاستدلال |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | جودة صور Grok Imagine       |

يحدّث `openclaw doctor --fix` الإعدادات الافتراضية المحفوظة لأدوات خادم xAI
ومعرّف الصورة القديمة للجودة، ويزيل صفوف الكتالوج المُنشأة القديمة، ويصلح
بيانات سياق التعريف القديمة في صفوف 4.20 النشطة. ولا يثبّت الأسماء المستعارة
النشطة `beta-latest` لـ 4.20 على لقطة مؤرخة.

## الميزات

<Warning>
  يعمل `x_search` و`code_execution` على خوادم xAI. تفرض xAI رسومًا قدرها $5 لكل 1,000
  استدعاء أداة، إضافةً إلى رموز الإدخال والإخراج للنموذج. عند حذف إعداد
  `enabled` لكل أداة، لا يعرضها OpenClaw إلا لنموذج xAI نشط.
  يتطلب موفر نموذج معروف غير تابع لـ xAI قيمة `enabled: true` صريحة لكل أداة؛
  ويؤدي غياب الموفر أو تعذر حله إلى الإخفاق المغلق. وتكون مصادقة xAI مطلوبة دائمًا،
  ويعطّل `enabled: false` الأداة لكل موفر.
</Warning>

<AccordionGroup>
  <Accordion title="البحث على الويب">
    يفضّل موفر البحث على الويب `grok` المضمّن xAI OAuth، ثم يعود احتياطيًا
    إلى `XAI_API_KEY` أو مفتاح بحث ويب خاص بـ Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="توليد الفيديو">
    يسجّل Plugin ‏`xai` المضمّن توليد الفيديو من خلال أداة
    `video_generate` المشتركة.

    - النموذج الافتراضي: `xai/grok-imagine-video`
    - نموذج إضافي: `xai/grok-imagine-video-1.5`
    - الأوضاع الكلاسيكية: تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، والتوليد من صورة مرجعية،
      وتحرير فيديو بعيد، وتمديد فيديو بعيد
    - وضع Video 1.5: تحويل الصورة إلى فيديو فقط، مع صورة واحدة بالضبط للإطار الأول
    - نِسب العرض إلى الارتفاع: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`؛
      يرث تحويل الصورة إلى فيديو في الوضع الكلاسيكي وVideo 1.5 نسبة الصورة المصدر عند
      حذفها
    - الدقات: الكلاسيكية `480P`/`720P`؛ ويدعم Video 1.5 أيضًا `1080P`؛ وتكون
      القيمة الافتراضية لجميع أوضاع التوليد `480P`
    - المدة: 1-15 ثانية للتوليد/تحويل الصورة إلى فيديو، و1-10 ثوانٍ عند
      استخدام أدوار `reference_image` الكلاسيكية، و2-10 ثوانٍ للتمديد الكلاسيكي
    - التوليد من صورة مرجعية: اضبط `imageRoles` على `reference_image` لكل
      صورة مقدمة؛ تقبل xAI ما يصل إلى 7 صور من هذا النوع
    - يرث تحرير/تمديد الفيديو نسبة العرض إلى الارتفاع ودقة فيديو الإدخال؛
      ولا تقبل هذه العمليات تجاوزات هندسية
    - المهلة الافتراضية للعملية: 600 ثانية ما لم يُضبط `video_generate.timeoutMs`
      أو `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    لا تُقبل مخازن الفيديو المؤقتة المحلية. استخدم عناوين URL بعيدة من النوع `http(s)` لمدخلات
    تحرير/تمديد الفيديو. يقبل تحويل الصورة إلى فيديو مخازن الصور المؤقتة المحلية لأن
    OpenClaw يرمّزها كعناوين URL للبيانات من أجل xAI.
    </Warning>

    يتعرف Video 1.5 أيضًا على معرّفي xAI ‏`grok-imagine-video-1.5-preview` و
    `grok-imagine-video-1.5-2026-05-30`. يمرر OpenClaw
    المعرّف المحدد دون تغيير، لكنه يطبق التحقق نفسه الخاص بالصور فقط.

    لاستخدام xAI كموفر الفيديو الافتراضي:

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
    واختيار الموفر وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="توليد الصور">
    يسجّل Plugin ‏`xai` المضمّن توليد الصور من خلال أداة
    `image_generate` المشتركة.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-quality`
    - الأوضاع: تحويل النص إلى صورة وتحرير الصورة المرجعية
    - المدخلات المرجعية: `image` واحد أو ما يصل إلى ثلاثة `images`
    - نسب العرض إلى الارتفاع: `1:1`، `16:9`، `9:16`، `4:3`، `3:4`، `3:2`، `2:3`، `2:1`،
      `1:2`، `19.5:9`، `9:19.5`، `20:9`، `9:20`
    - الدقات: `1K`، `2K`
    - العدد: ما يصل إلى 4 صور
    - المهلة الافتراضية للعملية: 600 ثانية ما لم يُضبط `image_generate.timeoutMs`
      أو `agents.defaults.imageGenerationModel.timeoutMs`

    يطلب OpenClaw من xAI استجابات صور `b64_json` حتى يمكن تخزين الوسائط
    المُنشأة وتسليمها عبر مسار مرفقات القناة المعتاد. تُحوَّل الصور المرجعية
    المحلية إلى عناوين URL للبيانات؛ بينما تمر مراجع `http(s)` البعيدة
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
    توثّق xAI أيضًا `quality` و`mask` و`user` ونسبة عرض إلى ارتفاع `auto`.
    يمرّر OpenClaw حاليًا عناصر التحكم المشتركة في الصور بين الموفّرين فقط؛
    ولا تُعرض هذه الخيارات الخاصة بالموفّر الأصلي عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجّل Plugin ‏`xai` المضمّن تحويل النص إلى كلام عبر واجهة
    الموفّر المشتركة `tts`.

    - الأصوات: كتالوج مباشر موثّق المصادقة من xAI؛ اعرضه باستخدام
      `openclaw infer tts voices --provider xai`
    - الأصوات الاحتياطية في وضع عدم الاتصال: `ara`، `eve`، `leo`، `rex`، `sal`
    - الصوت الافتراضي: `eve`
    - تُمرَّر معرّفات الأصوات المخصصة للحساب حتى عندما لا تكون موجودة في
      استجابة الكتالوج المضمّن
    - التنسيقات: `mp3`، `wav`، `pcm`، `mulaw`، `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز سرعة خاص بالموفّر
    - تنسيق الملاحظات الصوتية الأصلي Opus غير مدعوم

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
    يستخدم OpenClaw نقطة نهاية الدُفعات `/v1/tts` الخاصة بـ xAI للتوليف المخزّن مؤقتًا،
    واكتشاف الكتالوج `/v1/tts/voices` الموثّق المصادقة، وواجهة
    `wss://api.x.ai/v1/tts` الأصلية للتوليف المتدفق. يقتصر التدفق على
    مضيف `api.x.ai` الأصلي، لذلك تُرفض قيم `baseUrl` المخصصة في هذا
    المسار. ويستخدم عناصر التحكم الحالية في اللغة والصوت وبرنامج الترميز والسرعة؛
    وتُطبّق إعدادات xAI الافتراضية على معدل أخذ العينات ومعدل البت. يحترم توليف
    الملفات الصوتية جميع برامج الترميز المضبوطة. تستخدم أهداف الملاحظات الصوتية
    MP3 للتدفق وللخيار الاحتياطي المخزّن مؤقتًا لأن برامج الترميز الأولية لدى xAI
    لا تحمل بيانات وصفية لبرنامج الترميز أو المعدل. يرسل التدفق `text.delta` ثم
    `text.done`، ويتلقى `audio.delta` أو `audio.done` أو `error`، ويطبّق
    `timeoutMs` للخمول يتجدد مع كل مقطع صوتي. وهو منفصل عن
    جلسات الصوت في الوقت الفعلي. راجع عقد [واجهة TTS المتدفقة](https://docs.x.ai/developers/rest-api-reference/inference/voice) لدى xAI.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin ‏`xai` المضمّن تحويل الكلام إلى نص على دفعات عبر
    واجهة نسخ فهم الوسائط في OpenClaw.

    - نقطة النهاية: REST ‏`/v1/stt` لدى xAI
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - اختيار النموذج: تختار xAI نموذج النسخ داخليًا؛ ولا تحتوي
      نقطة النهاية على محدد للنموذج
    - يُستخدم حيثما يقرأ نسخ الصوت الوارد `tools.media.audio`،
      بما في ذلك مقاطع القنوات الصوتية في Discord ومرفقات القنوات الصوتية

    لفرض استخدام xAI لنسخ الصوت الوارد:

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

    يمكن توفير اللغة عبر إعدادات الوسائط الصوتية المشتركة أو طلب النسخ لكل
    استدعاء. تقبل واجهة OpenClaw المشتركة تلميحات المطالبات، لكن تكامل STT
    عبر REST لدى xAI يمرّر الملف واللغة فقط لأنهما يتوافقان مع نقطة نهاية xAI
    العامة الحالية.

  </Accordion>

  <Accordion title="تحويل الكلام المتدفق إلى نص">
    يسجّل Plugin ‏`xai` المضمّن أيضًا موفّر نسخ في الوقت الفعلي
    لصوت المكالمات الصوتية المباشرة.

    - نقطة النهاية: WebSocket ‏`wss://api.x.ai/v1/stt` لدى xAI
    - الترميز الافتراضي: `mulaw`
    - معدل أخذ العينات الافتراضي: `8000`
    - تحديد نقطة النهاية الافتراضي: `800ms`
    - النصوص المؤقتة: مفعّلة افتراضيًا

    يرسل تدفق وسائط Twilio الخاص بـ Voice Call إطارات صوت G.711 mu-law، لذا
    يمرّر موفّر xAI تلك الإطارات مباشرة من دون تحويل الترميز:

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

    توجد الإعدادات التي يملكها الموفّر ضمن
    `plugins.entries.voice-call.config.streaming.providers.xai`. والمفاتيح
    المدعومة هي `apiKey` و`baseUrl` و`sampleRate` و`encoding` ‏(`pcm` أو `mulaw` أو
    `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    هذا الموفّر المتدفق مخصص لمسار النسخ في الوقت الفعلي لدى Voice Call.
    يسجّل Discord مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ على دفعات
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="الصوت في الوقت الفعلي (Talk)">
    يسجّل Plugin ‏`xai` المضمّن جلسات Grok Voice Agent في الوقت الفعلي
    لوضع Talk من خلال عقد `registerRealtimeVoiceProvider` المشترك.

    - نقطة النهاية: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - النموذج الافتراضي: `grok-voice-latest`
    - الصوت الافتراضي: `eve`
    - النقل: `gateway-relay` (مسارات ترحيل iOS وAndroid وControl UI)
    - الصوت: PCM16 بتردد 24 kHz أو G.711 µ-law بتردد 8 kHz
    - المقاطعة: يقاطع VAD في خادم xAI الاستجابة؛ ويمسح OpenClaw التشغيل المصطف
      ويقتطع سجل الموفّر الذي لم يُشغّل

    اضبط Talk على Gateway:

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // اشترك فقط إذا كانت إعادة تشغيل الجلسة من جانب الموفّر مقبولة.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    تُحل أيضًا الإعدادات التي يملكها الموفّر من
    `plugins.entries.voice-call.config.realtime.providers.xai` عندما تعيد Voice Call
    أو محددات الوقت الفعلي المشتركة استخدام خريطة الموفّر نفسها. المفاتيح المدعومة هي
    `apiKey` و`baseUrl` و`model` و`voice` و`vadThreshold` و`silenceDurationMs`،
    و`prefixPaddingMs` و`reasoningEffort` و`sessionResumption`.
    يقبل `reasoningEffort` فقط `high` أو `none`، بما يتوافق مع واجهة xAI Voice Agent API.

    ينشئ VAD في خادم xAI الاستجابات دائمًا ويتعامل مع مقاطعة الصوت.
    استخدم `consultRouting: "provider-direct"`؛ ولا يدعم بروتوكول xAI Voice Agent
    توجيه النص الإجباري أو تعطيل مقاطعة صوت الإدخال.

    <Note>
    يمكن لـ xAI OAuth أو `XAI_API_KEY` مصادقة الصوت في الوقت الفعلي. لا يندرج
    WebRTC الذي يديره المتصفح ضمن واجهة هذا الموفّر بعد؛ استخدم Talk عبر
    gateway-relay على العُقد الأصلية أو مسار ترحيل Control UI.
    </Note>

    <Note>
    القيمة الافتراضية لـ `sessionResumption` هي `false`. عند ضبطها على `true`، يطلب OpenClaw
    من xAI الاحتفاظ بحالة جلسة كافية لاستئناف المحادثة نفسها بعد إعادة
    الاتصال، ثم يعيد الاتصال باستخدام معرّف المحادثة المُعاد. اتركها
    معطّلة عندما تكون إعادة التشغيل أو الاحتفاظ من جانب الموفّر غير مقبولين؛
    عندئذٍ تفشل المقابس المنقطعة بشكل مغلق بدلًا من بدء محادثة جديدة بصمت.
    </Note>

  </Accordion>

  <Accordion title="إعداد x_search">
    يعرض Plugin ‏xAI المضمّن `x_search` بوصفه أداة OpenClaw
    للبحث في محتوى X (المعروف سابقًا باسم Twitter) عبر Grok.

    مسار الإعدادات: `plugins.entries.xai.config.xSearch`

    | المفتاح               | النوع    | القيمة الافتراضية                   | الوصف                                      |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | منطقي | تلقائي لنماذج xAI  | عطّله، أو فعّله لموفّر معروف غير xAI |
    | `model`           | سلسلة نصية  | `grok-4.3`                | النموذج المستخدم لطلبات x_search                 |
    | `baseUrl`         | سلسلة نصية  | -                         | تجاوز عنوان URL الأساسي لاستجابات xAI                  |
    | `inlineCitations` | منطقي | -                         | تضمين الاستشهادات المضمّنة في النتائج              |
    | `maxTurns`        | رقم  | -                         | الحد الأقصى لأدوار المحادثة                       |
    | `timeoutSeconds`  | رقم  | `30`                      | مهلة الطلب بالثواني                       |
    | `cacheTtlMinutes` | رقم  | `15`                      | مدة بقاء ذاكرة التخزين المؤقت بالدقائق                    |

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
    يعرض Plugin ‏xAI المضمّن `code_execution` بوصفه أداة OpenClaw
    لتنفيذ التعليمات البرمجية عن بُعد في بيئة الحماية الخاصة بـ xAI.

    مسار الإعدادات: `plugins.entries.xai.config.codeExecution`

    | المفتاح              | النوع    | القيمة الافتراضية                  | الوصف                                      |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | منطقي | تلقائي لنماذج xAI | عطّله، أو فعّله لموفّر معروف غير xAI |
    | `model`          | سلسلة نصية  | `grok-4.3`               | النموذج المستخدم لطلبات تنفيذ التعليمات البرمجية           |
    | `maxTurns`       | رقم  | -                        | الحد الأقصى لأدوار المحادثة                       |
    | `timeoutSeconds` | رقم  | `30`                     | مهلة الطلب بالثواني                       |

    <Note>
    هذا تنفيذ عن بُعد في بيئة حماية xAI، وليس [`exec`](/ar/tools/exec) محليًا.
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
    - يمكن لمصادقة xAI استخدام مفتاح API، أو متغير بيئة، أو إعدادات Plugin
      كخيار احتياطي، أو OAuth مع حساب xAI مؤهل. يستخدم OAuth التحقق
      برمز الجهاز من دون استدعاء رجوع إلى localhost. تقرر xAI الحسابات
      التي يمكنها تلقي رموز API مميزة عبر OAuth، وقد تعرض صفحة الموافقة Grok Build
      رغم أن OpenClaw لا يتطلب تطبيق Grok Build.
    - لا يتيح OpenClaw حاليًا عائلة نماذج xAI متعددة الوكلاء. تقدم xAI
      هذه النماذج عبر Responses API، لكنها لا تقبل
      الأدوات المخصصة أو الأدوات من جانب العميل التي تستخدمها حلقة الوكيل المشتركة في OpenClaw.
      راجع
      [قيود xAI متعددة الوكلاء](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - يتيح الصوت الفوري من xAI حاليًا نقل Talk عبر ترحيل Gateway فقط.
      ولم تُوصّل بعد جلسات WebSocket الخاصة بالموفر والتي يديرها المتصفح
      في واجهة التحكم.
    - لا تُتاح صورة xAI ‏`quality`، وصورة `mask`، ونسب الأبعاد الإضافية الأصلية فقط
      حتى تتوفر في أداة `image_generate` المشتركة عناصر التحكم المقابلة
      عبر الموفّرين.
  </Accordion>

  <Accordion title="ملاحظات متقدمة">
    - يطبق OpenClaw تلقائيًا إصلاحات التوافق الخاصة بـ xAI
      لمخطط الأدوات واستدعاءات الأدوات ضمن مسار المشغّل المشترك.
    - تستخدم طلبات xAI الأصلية القيمة الافتراضية `tool_stream: true`. عيّن
      `agents.defaults.models["xai/<model>"].params.tool_stream` إلى `false`
      لتعطيلها.
    - يزيل مغلّف xAI المضمّن حدود مخطط عدد الاحتواء غير المدعومة
      ومفاتيح حمولة *جهد* الاستدلال غير المدعومة قبل إرسال طلبات
      xAI الأصلية. يدعم Grok 4.5 الجهد المنخفض والمتوسط
      والعالي (الافتراضي: عالٍ). يدعم Grok 4.3 الجهد المعدوم والمنخفض والمتوسط والعالي
      (الافتراضي: منخفض). لا تتيح نماذج xAI الأخرى القادرة على الاستدلال
      عنصر تحكم قابلًا للتهيئة في الجهد، لكنها تظل تطلب
      `include: ["reasoning.encrypted_content"]` حتى يمكن إعادة تشغيل الاستدلال المشفر السابق
      في التفاعلات اللاحقة.
    - تُتاح `web_search` و`x_search` و`code_execution` كأدوات في OpenClaw.
      لا يرفق OpenClaw بكل طلب أداة سوى أداة xAI المضمّنة المحددة التي تحتاج إليها
      تلك الأداة، بدلًا من إرفاق كل الأدوات الأصلية بكل
      تفاعل محادثة.
    - يقرأ Grok ‏`web_search` من `plugins.entries.xai.config.webSearch.baseUrl`.
      ويقرأ `x_search` من `plugins.entries.xai.config.xSearch.baseUrl`، ثم
      يرجع إلى عنوان URL الأساسي للبحث على الويب في Grok كخيار احتياطي.
    - تكون ملكية `x_search` و`code_execution` لـ Plugin ‏xAI المضمّن
      بدلًا من ترميزهما مباشرة في وقت تشغيل النموذج الأساسي.
    - يمثل `code_execution` تنفيذًا عن بُعد في بيئة xAI المعزولة، وليس
      [`exec`](/ar/tools/exec) محليًا.
  </Accordion>
</AccordionGroup>

## الاختبار المباشر

تغطي اختبارات الوحدات وحزم الاختبارات المباشرة الاختيارية مسارات الوسائط في xAI. صدّر
`XAI_API_KEY` في بيئة العملية قبل تشغيل عمليات الفحص المباشر.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ينشئ ملف الاختبار المباشر الخاص بالموفّر مخرجات TTS عادية، ومخرجات TTS بتنسيق PCM
ملائم للاتصالات الهاتفية، وينسخ الصوت عبر STT الدفعي من xAI، ويبث PCM نفسه عبر STT
الفوري من xAI، وينشئ مخرجات تحويل النص إلى صورة، ويحرر صورة مرجعية.
يتحقق ملف الصور المباشر المشترك من موفّر xAI نفسه عبر مسار اختيار وقت التشغيل
والخيار الاحتياطي والتطبيع وإرفاق الوسائط في OpenClaw. ترسل حالة Video 1.5
الاختيارية صورة واحدة مولّدة للإطار الأول بدقة 1080P
وتتحقق من تنزيل الفيديو المكتمل.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="جميع الموفّرين" href="/ar/providers/index" icon="grid-2">
    نظرة عامة أوسع على الموفّرين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وإصلاحاتها.
  </Card>
</CardGroup>
