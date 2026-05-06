---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تُهيئ مصادقة xAI أو معرّفات النماذج
summary: استخدام نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-06T08:11:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

يشحن OpenClaw Plugin مزود `xai` مضمنا لنماذج Grok.

## البدء

<Steps>
  <Step title="إنشاء مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم xAI](https://console.x.ai/).
  </Step>
  <Step title="تعيين مفتاح API الخاص بك">
    عيّن `XAI_API_KEY`، أو شغّل:

    ```bash
    openclaw onboard --auth-choice xai-api-key
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
يستخدم OpenClaw واجهة xAI Responses API بصفتها وسيلة نقل xAI المضمنة. يمكن لمفتاح
`XAI_API_KEY` نفسه أيضا تشغيل `web_search` المدعوم من Grok، و`x_search` كميزة أصلية،
و`code_execution` البعيد.
إذا خزنت مفتاح xAI ضمن `plugins.entries.xai.config.webSearch.apiKey`،
فإن مزود نماذج xAI المضمن يعيد استخدام ذلك المفتاح كخيار احتياطي أيضا.
عيّن `plugins.entries.xai.config.webSearch.baseUrl` لتوجيه `web_search` الخاص بـ Grok
وكذلك، افتراضيا، `x_search` عبر وكيل xAI Responses خاص بالمشغل.
توجد إعدادات ضبط `code_execution` ضمن `plugins.entries.xai.config.codeExecution`.
</Note>

## الكتالوج المدمج

يتضمن OpenClaw عائلات نماذج xAI هذه جاهزة للاستخدام:

| العائلة        | معرفات النماذج                                                           |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

يعالج Plugin أيضا معرفات `grok-4*` و`grok-code-fast*` الأحدث توجيهيا عندما
تتبع شكل API نفسه.

<Tip>
`grok-4.3` و`grok-4-fast` و`grok-4-1-fast` ومتغيرات `grok-4.20-beta-*`
هي مراجع Grok الحالية القادرة على التعامل مع الصور في الكتالوج المضمن.
</Tip>

## تغطية ميزات OpenClaw

يربط Plugin المضمن سطح API العام الحالي لدى xAI بعقود المزود والأدوات المشتركة
في OpenClaw. القدرات التي لا تلائم العقد المشترك
(مثل TTS المتدفق والصوت في الوقت الحقيقي) لا تعرض - انظر الجدول
أدناه.

| قدرة xAI                    | سطح OpenClaw                              | الحالة                                                             |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| المحادثة / Responses        | مزود نموذج `xai/<model>`                  | نعم                                                                |
| البحث في الويب من جهة الخادم | مزود `web_search` ‏`grok`                 | نعم                                                                |
| بحث X من جهة الخادم          | أداة `x_search`                           | نعم                                                                |
| تنفيذ الكود من جهة الخادم    | أداة `code_execution`                     | نعم                                                                |
| الصور                       | `image_generate`                          | نعم                                                                |
| مقاطع الفيديو               | `video_generate`                          | نعم                                                                |
| تحويل النص إلى كلام دفعي    | `messages.tts.provider: "xai"` / `tts`    | نعم                                                                |
| TTS متدفق                   | -                                         | غير معروض؛ يعيد عقد TTS في OpenClaw مخازن صوتية مؤقتة كاملة       |
| تحويل الكلام إلى نص دفعي    | `tools.media.audio` / فهم الوسائط         | نعم                                                                |
| تحويل الكلام إلى نص متدفق   | Voice Call ‏`streaming.provider: "xai"`   | نعم                                                                |
| الصوت في الوقت الحقيقي      | -                                         | غير معروض بعد؛ عقد جلسة/WebSocket مختلف                            |
| الملفات / الدفعات           | توافق API النماذج العام فقط              | ليست أداة OpenClaw من الدرجة الأولى                               |

<Note>
يستخدم OpenClaw واجهات xAI REST للصور/الفيديو/TTS/STT لإنشاء الوسائط،
والكلام، والنسخ الدفعي، كما يستخدم WebSocket الخاص بـ STT المتدفق من xAI للنسخ الحي
لمكالمات الصوت، وResponses API لأدوات النماذج والبحث
وتنفيذ الكود. الميزات التي تحتاج إلى عقود OpenClaw مختلفة، مثل
جلسات الصوت في الوقت الحقيقي، موثقة هنا كقدرات من المنبع
لا كسلوك Plugin مخفي.
</Note>

### تعيينات الوضع السريع

يعيد `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
كتابة طلبات xAI الأصلية كما يلي:

| النموذج المصدر | هدف الوضع السريع |
| -------------- | ---------------- |
| `grok-3`       | `grok-3-fast`    |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`    |
| `grok-4-0709`  | `grok-4-fast`    |

### أسماء التوافق القديمة

ما تزال الأسماء المستعارة القديمة تطبع إلى المعرفات المضمنة الأساسية:

| الاسم المستعار القديم       | المعرف الأساسي                         |
| --------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`     | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning`   | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`       | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning`   | `grok-4.20-beta-latest-non-reasoning`  |

## الميزات

<AccordionGroup>
  <Accordion title="البحث في الويب">
    يستخدم مزود بحث الويب `grok` المضمن `XAI_API_KEY` أيضا:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="إنشاء الفيديو">
    يسجل Plugin ‏`xai` المضمن إنشاء الفيديو عبر أداة
    `video_generate` المشتركة.

    - نموذج الفيديو الافتراضي: `xai/grok-imagine-video`
    - الأوضاع: تحويل النص إلى فيديو، تحويل الصورة إلى فيديو، إنشاء صورة مرجعية، تحرير فيديو بعيد، وتمديد فيديو بعيد
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - الدقات: `480P`, `720P`
    - المدة: من 1 إلى 15 ثانية للإنشاء/تحويل الصورة إلى فيديو، ومن 1 إلى 10 ثوان عند
      استخدام أدوار `reference_image`، ومن 2 إلى 10 ثوان للتمديد
    - إنشاء الصورة المرجعية: عيّن `imageRoles` إلى `reference_image` لكل
      صورة مقدمة؛ تقبل xAI ما يصل إلى 7 صور من هذا النوع

    <Warning>
    لا تقبل مخازن الفيديو المحلية. استخدم عناوين URL بعيدة `http(s)` لمدخلات
    تحرير/تمديد الفيديو. يقبل تحويل الصورة إلى فيديو مخازن صور محلية لأن
    OpenClaw يستطيع ترميزها كعناوين URL بيانات لـ xAI.
    </Warning>

    لاستخدام xAI كمزود الفيديو الافتراضي:

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
    راجع [إنشاء الفيديو](/ar/tools/video-generation) للاطلاع على معاملات الأداة المشتركة،
    واختيار المزود، وسلوك الانتقال الاحتياطي.
    </Note>

  </Accordion>

  <Accordion title="إنشاء الصور">
    يسجل Plugin ‏`xai` المضمن إنشاء الصور عبر أداة
    `image_generate` المشتركة.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-pro`
    - الأوضاع: تحويل النص إلى صورة وتحرير الصورة المرجعية
    - مدخلات المرجع: `image` واحدة أو ما يصل إلى خمس `images`
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - الدقات: `1K`, `2K`
    - العدد: ما يصل إلى 4 صور

    يطلب OpenClaw من xAI استجابات صور `b64_json` كي يمكن
    تخزين الوسائط المنشأة وتسليمها عبر مسار مرفقات القنوات المعتاد. تحول
    الصور المرجعية المحلية إلى عناوين URL بيانات؛ وتمرر مراجع `http(s)` البعيدة
    كما هي.

    لاستخدام xAI كمزود الصور الافتراضي:

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
    توثق xAI أيضا `quality` و`mask` و`user` ونسبا أصلية إضافية
    مثل `1:2` و`2:1` و`9:20` و`20:9`. يمرر OpenClaw فقط
    عناصر التحكم المشتركة بين المزودين للصور اليوم؛ والمقابض الأصلية غير المدعومة
    والمحلية للمزود عمدا لا تعرض عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجل Plugin ‏`xai` المضمن تحويل النص إلى كلام عبر سطح مزود `tts`
    المشترك.

    - الأصوات: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - الصوت الافتراضي: `eve`
    - التنسيقات: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز سرعة أصلي للمزود
    - تنسيق ملاحظات Opus الصوتية الأصلي غير مدعوم

    لاستخدام xAI كمزود TTS الافتراضي:

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
    يستخدم OpenClaw نقطة النهاية الدفعي `/v1/tts` لدى xAI. توفر xAI أيضا TTS متدفقا
    عبر WebSocket، لكن عقد مزود الكلام في OpenClaw يتوقع حاليا
    مخزنا صوتيا مؤقتا كاملا قبل تسليم الرد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجل Plugin ‏`xai` المضمن تحويل الكلام إلى نص دفعي عبر سطح
    نسخ فهم الوسائط في OpenClaw.

    - النموذج الافتراضي: `grok-stt`
    - نقطة النهاية: xAI REST ‏`/v1/stt`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw أينما يستخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية
      ومرفقات الصوت في القنوات

    لفرض xAI لنسخ الصوت الوارد:

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

    يمكن توفير اللغة عبر إعدادات وسائط الصوت المشتركة أو طلب
    النسخ لكل استدعاء. يقبل سطح OpenClaw المشترك تلميحات الموجه،
    لكن تكامل xAI REST STT لا يمرر إلا الملف، والنموذج، واللغة
    لأن هذه العناصر تطابق نقطة نهاية xAI العامة الحالية بوضوح.

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص متدفق">
    يسجل Plugin ‏`xai` المضمن أيضا مزود نسخ في الوقت الحقيقي
    لصوت مكالمات الصوت الحية.

    - نقطة النهاية: xAI WebSocket ‏`wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل العينة الافتراضي: `8000`
    - تقطيع النهاية الافتراضي: `800ms`
    - النصوص المؤقتة: مفعلة افتراضيا

    يرسل تدفق وسائط Twilio في Voice Call إطارات صوت G.711 µ-law، لذا يستطيع
    مزود xAI تمرير تلك الإطارات مباشرة دون إعادة ترميز:

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

    يتبع التكوين المملوك للموفّر المسار
    `plugins.entries.voice-call.config.streaming.providers.xai`. المفاتيح المدعومة
    هي `apiKey` و`baseUrl` و`sampleRate` و`encoding` (`pcm` أو `mulaw` أو
    `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    هذا موفّر البث لمسار النسخ الفوري في Voice Call.
    يسجّل صوت Discord حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار النسخ الدفعي
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    يوفّر Plugin xAI المضمّن `x_search` كأداة OpenClaw للبحث في محتوى
    X (المعروف سابقًا باسم Twitter) عبر Grok.

    مسار التكوين: `plugins.entries.xai.config.xSearch`

    | المفتاح           | النوع   | الافتراضي         | الوصف                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | تمكين أو تعطيل x_search              |
    | `model`            | string  | `grok-4-1-fast`    | النموذج المستخدم لطلبات x_search     |
    | `baseUrl`          | string  | -                  | تجاوز عنوان URL الأساسي لـ xAI Responses |
    | `inlineCitations`  | boolean | -                  | تضمين الاستشهادات المضمنة في النتائج |
    | `maxTurns`         | number  | -                  | الحد الأقصى لأدوار المحادثة          |
    | `timeoutSeconds`   | number  | -                  | مهلة الطلب بالثواني                  |
    | `cacheTtlMinutes`  | number  | -                  | مدة بقاء ذاكرة التخزين المؤقت بالدقائق |

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

  <Accordion title="Code execution configuration">
    يوفّر Plugin xAI المضمّن `code_execution` كأداة OpenClaw لتنفيذ التعليمات
    البرمجية عن بُعد في بيئة صندوق عزل xAI.

    مسار التكوين: `plugins.entries.xai.config.codeExecution`

    | المفتاح          | النوع   | الافتراضي              | الوصف                                  |
    | ----------------- | ------- | ---------------------- | -------------------------------------- |
    | `enabled`         | boolean | `true` (إذا كان المفتاح متاحًا) | تمكين أو تعطيل تنفيذ التعليمات البرمجية |
    | `model`           | string  | `grok-4-1-fast`        | النموذج المستخدم لطلبات تنفيذ التعليمات البرمجية |
    | `maxTurns`        | number  | -                      | الحد الأقصى لأدوار المحادثة            |
    | `timeoutSeconds`  | number  | -                      | مهلة الطلب بالثواني                    |

    <Note>
    هذا تنفيذ عن بُعد في صندوق عزل xAI، وليس [`exec`](/ar/tools/exec) المحلي.
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

  <Accordion title="Known limits">
    - المصادقة اليوم بمفتاح API فقط. لا يوجد بعد تدفق xAI OAuth أو رمز جهاز في
      OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` غير مدعوم في مسار موفّر xAI
      العادي لأنه يتطلب سطح API علويًا مختلفًا عن نقل xAI القياسي في OpenClaw.
    - صوت xAI Realtime غير مسجل بعد كموفّر OpenClaw. فهو يحتاج إلى عقد جلسة صوتية
      ثنائية الاتجاه مختلف عن STT الدفعي أو النسخ بالبث.
    - لا تُعرض `quality` الخاصة بصورة xAI، ولا `mask` الخاصة بالصورة، ولا نسب
      الأبعاد الإضافية الأصلية فقط حتى تمتلك أداة `image_generate` المشتركة عناصر
      تحكم مقابلة عابرة للموفّرين.
  </Accordion>

  <Accordion title="Advanced notes">
    - يطبّق OpenClaw تلقائيًا إصلاحات توافق مخطط الأدوات واستدعاءات الأدوات
      الخاصة بـ xAI في مسار المشغّل المشترك.
    - تستخدم طلبات xAI الأصلية افتراضيًا `tool_stream: true`. اضبط
      `agents.defaults.models["xai/<model>"].params.tool_stream` على `false`
      لتعطيله.
    - يزيل مغلّف xAI المضمّن علامات مخطط الأدوات الصارمة غير المدعومة ومفاتيح
      حمولة الاستدلال قبل إرسال طلبات xAI الأصلية.
    - تُعرض `web_search` و`x_search` و`code_execution` كأدوات OpenClaw. يمكّن
      OpenClaw المكوّن المضمّن المحدد من xAI الذي يحتاجه داخل كل طلب أداة بدلًا
      من إرفاق كل الأدوات الأصلية بكل دور دردشة.
    - يقرأ Grok `web_search` من `plugins.entries.xai.config.webSearch.baseUrl`.
      يقرأ `x_search` من `plugins.entries.xai.config.xSearch.baseUrl`، ثم
      يرجع إلى عنوان URL الأساسي لبحث الويب في Grok.
    - يملك Plugin xAI المضمّن `x_search` و`code_execution` بدلًا من ترميزهما
      مباشرة في وقت تشغيل النموذج الأساسي.
    - `code_execution` هو تنفيذ عن بُعد في صندوق عزل xAI، وليس
      [`exec`](/ar/tools/exec) المحلي.
  </Accordion>
</AccordionGroup>

## الاختبار المباشر

تغطي اختبارات الوحدة ومجموعات الاختبار المباشر الاختيارية مسارات وسائط xAI. تحمّل
الأوامر المباشرة الأسرار من صدفة تسجيل الدخول الخاصة بك، بما في ذلك `~/.profile`،
قبل فحص `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ينشئ ملف الاختبار المباشر الخاص بالموفّر TTS عاديًا، وTTS بصيغة PCM مناسبة
للاتصالات الهاتفية، وينسخ الصوت عبر STT الدفعي من xAI، ويبث PCM نفسه عبر STT
الفوري من xAI، وينشئ مخرجات تحويل النص إلى صورة، ويعدّل صورة مرجعية. يتحقق ملف
الاختبار المباشر المشترك للصور من موفّر xAI نفسه عبر مسار اختيار وقت التشغيل
والرجوع والتطبيع وإرفاق الوسائط في OpenClaw.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="All providers" href="/ar/providers/index" icon="grid-2">
    النظرة العامة الأوسع على الموفّرين.
  </Card>
  <Card title="Troubleshooting" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وإصلاحاتها.
  </Card>
</CardGroup>
