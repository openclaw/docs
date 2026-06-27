---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تقوم بتكوين مصادقة xAI أو معرفات النماذج
summary: استخدام نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw يشحن Plugin موفّر `xai` مضمّناً لنماذج Grok. بالنسبة لمعظم
المستخدمين، المسار الموصى به هو OAuth الخاص بـ Grok مع اشتراك SuperGrok أو X Premium
مؤهل. يظل OpenClaw محلياً أولاً: يعمل Gateway والإعداد والتوجيه
والأدوات على جهازك، بينما تتم مصادقة طلبات نموذج Grok عبر xAI
وتُرسل إلى API الخاصة بـ xAI.

لا يتطلب OAuth مفتاح API من xAI، ولا يتطلب تطبيق Grok Build.
قد تظل xAI تعرض Grok Build على شاشة الموافقة لأن OpenClaw يستخدم
عميل OAuth المشترك لدى xAI.

## اختر مسار الإعداد

استخدم المسار الذي يطابق حالة تثبيت OpenClaw لديك:

<Steps>
  <Step title="تثبيت OpenClaw جديد">
    شغّل الإعداد الأولي مع تثبيت الخادم الخفي عندما تجهّز Gateway محلياً
    جديداً، ثم اختر خيار OAuth الخاص بـ xAI/Grok في خطوة النموذج/المصادقة:

    ```bash
    openclaw onboard --install-daemon
    ```

    على VPS أو عبر SSH، اختر xAI OAuth مباشرة؛ يستخدم OpenClaw التحقق
    برمز الجهاز ولا يتطلب رد نداء إلى localhost:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    لا يتطلب OAuth مفتاح API من xAI. لا يتطلب OpenClaw تطبيق Grok
    Build. قد تظل xAI تسمّي تطبيق الموافقة Grok Build لأن
    OpenClaw يستخدم عميل OAuth المشترك لدى xAI.

  </Step>
  <Step title="تثبيت OpenClaw موجود">
    إذا كان OpenClaw مضبوطاً بالفعل، فسجّل الدخول إلى xAI فقط. لا تُعِد تشغيل
    الإعداد الأولي الكامل أو إعادة تثبيت الخادم الخفي لمجرد توصيل Grok:

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    لجعل Grok النموذج الافتراضي بعد تسجيل الدخول، طبّقه بشكل منفصل:

    ```bash
    openclaw models set xai/grok-4.3
    ```

    أعد تشغيل الإعداد الأولي الكامل فقط إذا كنت تريد عمداً تغيير Gateway
    أو الخادم الخفي أو القناة أو مساحة العمل أو خيارات إعداد أخرى.

  </Step>
  <Step title="مسار مفتاح API">
    لا يزال إعداد مفتاح API يعمل مع مفاتيح xAI Console ولأسطح الوسائط التي
    تتطلب إعداد موفّر مدعوماً بمفتاح:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="اختر نموذجاً">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
يستخدم OpenClaw واجهة xAI Responses API بوصفها نقل xAI المضمّن. يمكن للاعتماد نفسه
من `openclaw models auth login --provider xai --method oauth` أو
`openclaw models auth login --provider xai --method api-key` أيضاً تشغيل
`web_search` و`x_search` و`code_execution` البعيد وتوليد الصور/الفيديو من xAI
كدعم من الدرجة الأولى. يتطلب الكلام والنسخ حالياً `XAI_API_KEY` أو إعداد الموفّر.
يفضّل `web_search` المدعوم بـ Grok استخدام xAI OAuth، ويرجع إلى `XAI_API_KEY` أو
إعداد بحث الويب في Plugin.
إذا خزّنت مفتاح xAI تحت `plugins.entries.xai.config.webSearch.apiKey`،
فإن موفّر نموذج xAI المضمّن يعيد استخدام ذلك المفتاح كخيار رجوع أيضاً.
اضبط `plugins.entries.xai.config.webSearch.baseUrl` لتوجيه `web_search` الخاص بـ Grok
وبشكل افتراضي `x_search` عبر وكيل xAI Responses تابع للمشغّل.
توجد إعدادات ضبط `code_execution` تحت `plugins.entries.xai.config.codeExecution`.
</Note>

## استكشاف أخطاء OAuth وإصلاحها

- بالنسبة إلى SSH أو Docker أو VPS أو الإعدادات البعيدة الأخرى، استخدم
  `openclaw models auth login --provider xai --method oauth`؛ يستخدم xAI OAuth
  التحقق برمز الجهاز بدلاً من رد نداء إلى localhost.
- إذا نجح تسجيل الدخول لكن Grok ليس النموذج الافتراضي، شغّل
  `openclaw models set xai/grok-4.3`.
- لفحص ملفات تعريف مصادقة xAI المحفوظة، شغّل:

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- تحدد xAI الحسابات التي يمكنها تلقي رموز API عبر OAuth. إذا لم يكن الحساب
  مؤهلاً، فجرّب مسار مفتاح API أو تحقق من الاشتراك من جهة xAI.

<Tip>
استخدم `xai-oauth` عند تسجيل الدخول من SSH أو Docker أو VPS. يطبع OpenClaw
عنوان URL من xAI ورمزاً قصيراً؛ أكمل تسجيل الدخول في أي متصفح محلي بينما
تستطلع العملية البعيدة xAI لاكتمال تبادل الرمز.
</Tip>

## الفهرس المضمّن

يتضمن OpenClaw نماذج محادثة xAI الحالية مباشرة، مرتبة من الأحدث
أولاً في أدوات اختيار النماذج:

| العائلة       | معرّفات النماذج                                                           |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

لا يزال Plugin يحلّ موجهاً أسماء Grok 3 وGrok 4 وGrok 4 Fast وGrok 4.1
Fast وGrok Code الأقدم للإعدادات الموجودة. تُطبّع الأسماء البديلة الرسمية لـ Grok Code Fast
إلى `grok-build-0.1`؛ لم يعد OpenClaw يعرض أسماء upstream الأخرى المتقاعدة
في الفهرس القابل للاختيار.

<Tip>
استخدم `grok-4.3` للمحادثة العامة و`grok-build-0.1` لأعباء العمل المركّزة
على البناء/الترميز ما لم تكن تحتاج صراحة إلى اسم بديل تجريبي لـ Grok 4.20.
</Tip>

## تغطية ميزات OpenClaw

يربط Plugin المضمّن سطح API العام الحالي لـ xAI بعقود الموفّر
والأدوات المشتركة في OpenClaw. القدرات التي لا تلائم العقد المشترك
(مثل TTS المتدفق والصوت الفوري) غير مكشوفة - انظر الجدول
أدناه.

| قدرة xAI                   | سطح OpenClaw                             | الحالة                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| المحادثة / Responses       | موفّر نموذج `xai/<model>`                 | نعم                                                                 |
| بحث الويب من جهة الخادم    | موفّر `web_search` باسم `grok`            | نعم                                                                 |
| بحث X من جهة الخادم        | أداة `x_search`                           | نعم                                                                 |
| تنفيذ الكود من جهة الخادم  | أداة `code_execution`                     | نعم                                                                 |
| الصور                      | `image_generate`                          | نعم                                                                 |
| الفيديوهات                 | `video_generate`                          | نعم                                                                 |
| تحويل النص إلى كلام دفعي   | `messages.tts.provider: "xai"` / `tts`    | نعم                                                                 |
| TTS المتدفق                | -                                         | غير مكشوف؛ يعيد عقد TTS في OpenClaw مخازن صوتية كاملة              |
| تحويل الكلام إلى نص دفعي   | `tools.media.audio` / فهم الوسائط         | نعم                                                                 |
| تحويل الكلام إلى نص متدفق  | Voice Call `streaming.provider: "xai"`    | نعم                                                                 |
| الصوت الفوري               | -                                         | غير مكشوف بعد؛ عقد جلسة/WebSocket مختلف                             |
| الملفات / الدفعات          | توافق API النموذج العام فقط              | ليست أداة OpenClaw من الدرجة الأولى                                |

<Note>
يستخدم OpenClaw واجهات REST من xAI للصور/الفيديو/TTS/STT لتوليد الوسائط
والكلام والنسخ الدفعي، وWebSocket STT المتدفق من xAI لنسخ
المكالمات الصوتية الحية، وResponses API لأدوات النموذج والبحث
وتنفيذ الكود. الميزات التي تحتاج إلى عقود OpenClaw مختلفة، مثل
جلسات الصوت الفورية، موثقة هنا بوصفها قدرات upstream بدلاً من
سلوك Plugin مخفي.
</Note>

### تعيينات الوضع السريع

يعيد `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
كتابة طلبات xAI الأصلية كما يلي:

| النموذج المصدر | هدف الوضع السريع |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### أسماء التوافق القديمة البديلة

لا تزال الأسماء البديلة القديمة تُطبّع إلى المعرّفات المضمّنة القياسية:

| الاسم البديل القديم       | المعرّف القياسي                       |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## الميزات

<AccordionGroup>
  <Accordion title="بحث الويب">
    يفضّل موفّر بحث الويب `grok` المضمّن xAI OAuth، ثم يرجع
    إلى `XAI_API_KEY` أو مفتاح بحث ويب خاص بـ Plugin:

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="توليد الفيديو">
    يسجّل Plugin `xai` المضمّن توليد الفيديو عبر أداة
    `video_generate` المشتركة.

    - نموذج الفيديو الافتراضي: `xai/grok-imagine-video`
    - الأوضاع: تحويل النص إلى فيديو، تحويل الصورة إلى فيديو، توليد بصورة
      مرجعية، تحرير فيديو بعيد، وتمديد فيديو بعيد
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - الدقات: `480P`, `720P`
    - المدة: 1-15 ثانية للتوليد/تحويل الصورة إلى فيديو، 1-10 ثوانٍ عند
      استخدام أدوار `reference_image`، و2-10 ثوانٍ للتمديد
    - توليد الصورة المرجعية: اضبط `imageRoles` إلى `reference_image` لكل
      صورة مقدمة؛ تقبل xAI حتى 7 صور من هذا النوع
    - مهلة العملية الافتراضية: 600 ثانية ما لم يتم ضبط `video_generate.timeoutMs`
      أو `agents.defaults.videoGenerationModel.timeoutMs`

    <Warning>
    لا تُقبل مخازن الفيديو المحلية. استخدم عناوين URL بعيدة بصيغة `http(s)` لمدخلات
    تحرير/تمديد الفيديو. يقبل تحويل الصورة إلى فيديو مخازن الصور المحلية لأن
    OpenClaw يستطيع ترميزها كعناوين URL بيانات لـ xAI.
    </Warning>

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
    واختيار الموفّر وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="توليد الصور">
    يسجّل Plugin `xai` المضمّن توليد الصور عبر أداة
    `image_generate` المشتركة.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-quality`
    - الأوضاع: تحويل النص إلى صورة وتحرير بصورة مرجعية
    - مدخلات المرجع: `image` واحدة أو حتى خمس `images`
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - الدقات: `1K`, `2K`
    - العدد: حتى 4 صور
    - مهلة العملية الافتراضية: 600 ثانية ما لم يتم ضبط `image_generate.timeoutMs`
      أو `agents.defaults.imageGenerationModel.timeoutMs`

    يطلب OpenClaw من xAI استجابات صور `b64_json` حتى يمكن
    تخزين الوسائط المولدة وتسليمها عبر مسار مرفقات القناة المعتاد. تُحوَّل
    الصور المرجعية المحلية إلى عناوين URL بيانات؛ أما مراجع `http(s)` البعيدة
    فتُمرر كما هي.

    لاستخدام xAI كموفّر الصور الافتراضي:

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
    توثق xAI أيضًا `quality` و`mask` و`user` ونسبًا أصلية إضافية
    مثل `1:2` و`2:1` و`9:20` و`20:9`. يمرر OpenClaw حاليًا عناصر التحكم
    المشتركة بين الموفرين للصور فقط؛ ولا تُكشف عناصر التحكم الأصلية غير المدعومة
    عمدًا عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجل Plugin المضمن `xai` تحويل النص إلى كلام عبر سطح موفر `tts`
    المشترك.

    - الأصوات: `eve`، `ara`، `rex`، `sal`، `leo`، `una`
    - الصوت الافتراضي: `eve`
    - التنسيقات: `mp3`، `wav`، `pcm`، `mulaw`، `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز سرعة أصلي للموفر
    - تنسيق ملاحظات Opus الصوتية الأصلي غير مدعوم

    لاستخدام xAI كموفر TTS الافتراضي:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    يستخدم OpenClaw نقطة نهاية الدُفعات `/v1/tts` من xAI. توفر xAI أيضًا TTS
    متدفقًا عبر WebSocket، لكن عقد موفر الكلام في OpenClaw يتوقع حاليًا
    مخزنًا صوتيًا مكتملًا قبل تسليم الرد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin المضمن `xai` تحويل الكلام إلى نص بنمط الدُفعات عبر سطح
    التفريغ النصي لفهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `grok-stt`
    - نقطة النهاية: xAI REST `/v1/stt`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم من OpenClaw في كل موضع يستخدم فيه تفريغ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية ومرفقات
      الصوت في القنوات

    لفرض استخدام xAI لتفريغ الصوت الوارد:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    يمكن توفير اللغة عبر إعداد وسائط الصوت المشتركة أو طلب التفريغ النصي
    لكل استدعاء. تقبل واجهة OpenClaw المشتركة تلميحات المطالبات، لكن تكامل
    xAI REST STT يمرر الملف والنموذج واللغة فقط لأنها تطابق نقطة نهاية xAI
    العامة الحالية بوضوح.

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص بالتدفق">
    يسجل Plugin المضمن `xai` أيضًا موفر تفريغ نصي آنيًا لصوت المكالمات
    الصوتية الحية.

    - نقطة النهاية: xAI WebSocket `wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل العينات الافتراضي: `8000`
    - التقسيم الافتراضي لنهاية الكلام: `800ms`
    - النصوص المؤقتة: مفعلة افتراضيًا

    يرسل تدفق وسائط Twilio في Voice Call إطارات صوت G.711 µ-law، لذلك يمكن
    لموفر xAI تمرير تلك الإطارات مباشرة دون تحويل ترميز:

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

    توجد الإعدادات المملوكة للموفر ضمن
    `plugins.entries.voice-call.config.streaming.providers.xai`. المفاتيح
    المدعومة هي `apiKey` و`baseUrl` و`sampleRate` و`encoding` (`pcm` أو
    `mulaw` أو `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    هذا الموفر المتدفق مخصص لمسار التفريغ النصي الآني في Voice Call.
    يسجل Discord الصوت حاليًا في مقاطع قصيرة ويستخدم بدلًا من ذلك مسار
    التفريغ النصي للدُفعات `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="إعداد x_search">
    يكشف Plugin المضمن من xAI عن `x_search` كأداة OpenClaw للبحث في محتوى
    X (Twitter سابقًا) عبر Grok.

    مسار الإعداد: `plugins.entries.xai.config.xSearch`

    | المفتاح           | النوع   | الافتراضي          | الوصف                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | تفعيل أو تعطيل x_search             |
    | `model`            | string  | `grok-4-1-fast`    | النموذج المستخدم لطلبات x_search    |
    | `baseUrl`          | string  | -                  | تجاوز عنوان URL الأساسي لاستجابات xAI |
    | `inlineCitations`  | boolean | -                  | تضمين الاستشهادات المضمنة في النتائج |
    | `maxTurns`         | number  | -                  | الحد الأقصى لأدوار المحادثة          |
    | `timeoutSeconds`   | number  | -                  | مهلة الطلب بالثواني                  |
    | `cacheTtlMinutes`  | number  | -                  | مدة بقاء التخزين المؤقت بالدقائق     |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    يكشف Plugin المضمن من xAI عن `code_execution` كأداة OpenClaw لتنفيذ
    التعليمات البرمجية عن بُعد في بيئة sandbox الخاصة بـ xAI.

    مسار الإعداد: `plugins.entries.xai.config.codeExecution`

    | المفتاح          | النوع   | الافتراضي          | الوصف                                  |
    | ----------------- | ------- | ------------------ | -------------------------------------- |
    | `enabled`         | boolean | `true` (إذا كان المفتاح متاحًا) | تفعيل أو تعطيل تنفيذ التعليمات البرمجية |
    | `model`           | string  | `grok-4-1-fast`    | النموذج المستخدم لطلبات تنفيذ التعليمات البرمجية |
    | `maxTurns`        | number  | -                  | الحد الأقصى لأدوار المحادثة            |
    | `timeoutSeconds`  | number  | -                  | مهلة الطلب بالثواني                    |

    <Note>
    هذا تنفيذ بعيد في sandbox من xAI، وليس [`exec`](/ar/tools/exec) محليًا.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="الحدود المعروفة">
    - يمكن لمصادقة xAI استخدام مفتاح API أو متغير بيئة أو رجوعًا إلى إعداد
      Plugin أو OAuth مع حساب xAI مؤهل. يستخدم OAuth التحقق برمز الجهاز
      دون استدعاء رجوع إلى localhost. تقرر xAI الحسابات التي يمكنها تلقي
      رموز OAuth الخاصة بـ API، وقد تعرض صفحة الموافقة Grok Build رغم أن
      OpenClaw لا يتطلب تطبيق Grok Build.
    - لا يكشف OpenClaw حاليًا عن عائلة نماذج xAI متعددة الوكلاء. تقدم xAI
      هذه النماذج عبر Responses API، لكنها لا تقبل الأدوات من جانب العميل
      أو الأدوات المخصصة التي تستخدمها حلقة الوكيل المشتركة في OpenClaw. راجع
      [قيود xAI متعددة الوكلاء](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations).
    - لم يُسجل صوت xAI Realtime كموفر OpenClaw بعد. فهو يحتاج إلى عقد جلسة
      صوتية ثنائية الاتجاه مختلف عن STT بنمط الدُفعات أو التفريغ النصي
      المتدفق.
    - لا تُكشف `quality` للصور و`mask` للصور ونسب الأبعاد الإضافية الأصلية
      فقط في xAI حتى تمتلك أداة `image_generate` المشتركة عناصر تحكم مقابلة
      عابرة للموفرين.
  </Accordion>

  <Accordion title="ملاحظات متقدمة">
    - يطبق OpenClaw تلقائيًا إصلاحات التوافق الخاصة بـ xAI لمخطط الأدوات
      واستدعاءات الأدوات على مسار المشغل المشترك.
    - تستخدم طلبات xAI الأصلية افتراضيًا `tool_stream: true`. اضبط
      `agents.defaults.models["xai/<model>"].params.tool_stream` على `false`
      لتعطيله.
    - يزيل غلاف xAI المضمن أعلام مخطط الأدوات الصارمة غير المدعومة ومفاتيح
      حمولة *جهد* الاستدلال قبل إرسال طلبات xAI الأصلية. تعلن فقط
      `grok-4.3` / `grok-4.3-*` عن جهد استدلال قابل للإعداد؛ أما جميع نماذج
      xAI الأخرى القادرة على الاستدلال فما زالت تطلب
      `include: ["reasoning.encrypted_content"]` حتى يمكن إعادة تشغيل
      الاستدلال المشفر السابق في الأدوار اللاحقة.
    - تُكشف `web_search` و`x_search` و`code_execution` كأدوات OpenClaw.
      يفعّل OpenClaw الميزة المضمنة المحددة من xAI التي يحتاجها داخل كل طلب
      أداة بدلًا من إرفاق كل الأدوات الأصلية بكل دور دردشة.
    - يقرأ Grok `web_search` القيمة `plugins.entries.xai.config.webSearch.baseUrl`.
      يقرأ `x_search` القيمة `plugins.entries.xai.config.xSearch.baseUrl`، ثم
      يرجع إلى عنوان URL الأساسي لبحث الويب في Grok.
    - يملك Plugin xAI المضمن `x_search` و`code_execution` بدلًا من ترميزهما
      مباشرة داخل وقت تشغيل النموذج الأساسي.
    - `code_execution` هو تنفيذ بعيد في sandbox من xAI، وليس
      [`exec`](/ar/tools/exec) محليًا.
  </Accordion>
</AccordionGroup>

## الاختبار الحي

تغطي اختبارات الوحدة والمسارات الحية الاختيارية مسارات وسائط xAI. صدّر
`XAI_API_KEY` في بيئة العملية قبل تشغيل عمليات الفحص الحية.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ينشئ الملف الحي الخاص بالموفر TTS عاديًا، وTTS بصيغة PCM مناسبة للاتصالات
الهاتفية، ويفرغ الصوت نصيًا عبر xAI STT بنمط الدُفعات، ويدفق نفس PCM عبر
xAI STT الآني، وينشئ مخرجات تحويل النص إلى صورة، ويعدل صورة مرجعية. يتحقق
ملف الصور الحي المشترك من موفر xAI نفسه عبر مسار اختيار وقت التشغيل والرجوع
والتطبيع ومرفقات الوسائط في OpenClaw.

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفر.
  </Card>
  <Card title="كل الموفرين" href="/ar/providers/index" icon="grid-2">
    نظرة عامة أوسع على الموفرين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وإصلاحاتها.
  </Card>
</CardGroup>
