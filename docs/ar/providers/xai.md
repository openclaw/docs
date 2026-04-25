---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تقوم بتكوين مصادقة xAI أو معرّفات النماذج
summary: استخدام نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-25T18:22:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

يتضمن OpenClaw Plugin موفّرًا مضمّنًا باسم `xai` لنماذج Grok.

## البدء

<Steps>
  <Step title="أنشئ مفتاح API">
    أنشئ مفتاح API في [xAI console](https://console.x.ai/).
  </Step>
  <Step title="اضبط مفتاح API الخاص بك">
    اضبط `XAI_API_KEY`، أو شغّل:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="اختر نموذجًا">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
يستخدم OpenClaw واجهة xAI Responses API كوسيلة النقل المضمّنة لـ xAI. ويمكن
لـ `XAI_API_KEY` نفسه أيضًا تشغيل `web_search` المعتمد على Grok و`x_search`
الأصلي والتنفيذ البعيد لـ `code_execution`.
وإذا خزّنت مفتاح xAI ضمن `plugins.entries.xai.config.webSearch.apiKey`,
فإن موفّر نماذج xAI المضمّن يعيد استخدام ذلك المفتاح كخيار احتياطي أيضًا.
وتوجد إعدادات ضبط `code_execution` ضمن `plugins.entries.xai.config.codeExecution`.
</Note>

## الكتالوج المضمّن

يتضمن OpenClaw عائلات نماذج xAI التالية بشكل جاهز:

| العائلة         | معرّفات النماذج                                                           |
| --------------- | ------------------------------------------------------------------------- |
| Grok 3          | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                |
| Grok 4          | `grok-4`, `grok-4-0709`                                                   |
| Grok 4 Fast     | `grok-4-fast`, `grok-4-fast-non-reasoning`                                |
| Grok 4.1 Fast   | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                            |
| Grok 4.20 Beta  | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`  |
| Grok Code       | `grok-code-fast-1`                                                        |

كما يقوم Plugin أيضًا بحل معرّفات `grok-4*` و`grok-code-fast*` الأحدث بشكل
تمريري عندما تتبع شكل API نفسه.

<Tip>
تُعد `grok-4-fast` و`grok-4-1-fast` ومتغيرات `grok-4.20-beta-*`
مراجع Grok الحالية القادرة على التعامل مع الصور في الكتالوج المضمّن.
</Tip>

## تغطية ميزات OpenClaw

يربط Plugin المضمّن سطح API العام الحالي لـ xAI بعقود الموفّر والأدوات
المشتركة في OpenClaw. أما الإمكانات التي لا تتناسب مع العقد المشترك
(مثل TTS المتدفق والصوت الفوري) فلا يتم كشفها — راجع الجدول
أدناه.

| قدرة xAI                   | سطح OpenClaw                            | الحالة                                                              |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Chat / Responses           | موفّر النماذج `xai/<model>`             | نعم                                                                 |
| Server-side web search     | موفّر `web_search` ‏`grok`              | نعم                                                                 |
| Server-side X search       | أداة `x_search`                         | نعم                                                                 |
| Server-side code execution | أداة `code_execution`                   | نعم                                                                 |
| الصور                      | `image_generate`                        | نعم                                                                 |
| الفيديو                    | `video_generate`                        | نعم                                                                 |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`  | نعم                                                                 |
| Streaming TTS              | —                                       | غير مكشوف؛ يعيد عقد TTS في OpenClaw مخازن صوت مكتملة               |
| Batch speech-to-text       | `tools.media.audio` / فهم media         | نعم                                                                 |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`  | نعم                                                                 |
| Realtime voice             | —                                       | غير مكشوف بعد؛ عقد مختلف للجلسة/WebSocket                           |
| Files / batches            | توافق Generic model API فقط             | ليست أداة OpenClaw من الدرجة الأولى                                |

<Note>
يستخدم OpenClaw واجهات REST الخاصة بـ xAI للصور/الفيديو/TTS/STT لتوليد media
والكلام والنسخ الدفعية، كما يستخدم WebSocket الخاص بـ STT المتدفق من xAI
لنسخ الصوت الحي في المكالمات الصوتية، ويستخدم Responses API لأدوات
النموذج والبحث وتنفيذ الكود. أما الميزات التي تحتاج إلى عقود OpenClaw مختلفة، مثل
جلسات Realtime voice، فتُوثَّق هنا على أنها قدرات من المصدر upstream بدلًا
من كونها سلوك Plugin مخفيًا.
</Note>

### تعيينات الوضع السريع

يعمل `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
على إعادة كتابة طلبات xAI الأصلية كما يلي:

| النموذج المصدر | هدف الوضع السريع   |
| -------------- | ------------------ |
| `grok-3`       | `grok-3-fast`      |
| `grok-3-mini`  | `grok-3-mini-fast` |
| `grok-4`       | `grok-4-fast`      |
| `grok-4-0709`  | `grok-4-fast`      |

### الأسماء المستعارة القديمة المتوافقة

تظل الأسماء المستعارة القديمة تُطبَّع إلى المعرّفات المضمّنة القياسية:

| الاسم المستعار القديم      | المعرّف القياسي                         |
| -------------------------- | -------------------------------------- |
| `grok-4-fast-reasoning`    | `grok-4-fast`                          |
| `grok-4-1-fast-reasoning`  | `grok-4-1-fast`                        |
| `grok-4.20-reasoning`      | `grok-4.20-beta-latest-reasoning`      |
| `grok-4.20-non-reasoning`  | `grok-4.20-beta-latest-non-reasoning`  |

## الميزات

<AccordionGroup>
  <Accordion title="البحث على الويب">
    يستخدم موفّر البحث على الويب المضمّن `grok` القيمة `XAI_API_KEY` أيضًا:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="توليد الفيديو">
    يسجّل Plugin ‏`xai` المضمّن توليد الفيديو عبر الأداة المشتركة
    `video_generate`.

    - نموذج الفيديو الافتراضي: `xai/grok-imagine-video`
    - الأوضاع: text-to-video وimage-to-video وتوليد الصور المرجعية والتحرير
      البعيد للفيديو وتمديد الفيديو البعيد
    - نسب الأبعاد: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - الدقات: `480P`, `720P`
    - المدة: من 1 إلى 15 ثانية للتوليد/image-to-video، ومن 1 إلى 10 ثوانٍ عند
      استخدام أدوار `reference_image`، ومن 2 إلى 10 ثوانٍ للتمديد
    - توليد الصور المرجعية: اضبط `imageRoles` على `reference_image` لكل
      صورة مقدمة؛ وتقبل xAI حتى 7 صور من هذا النوع

    <Warning>
    لا تُقبل مخازن الفيديو المحلية. استخدم عناوين URL بعيدة من نوع `http(s)` من أجل
    مدخلات تحرير/تمديد الفيديو. أما image-to-video فيقبل مخازن الصور المحلية لأن
    OpenClaw يمكنه ترميزها كعناوين data URL لـ xAI.
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
    راجع [Video Generation](/ar/tools/video-generation) لمعلمات الأداة المشتركة
    وتحديد الموفّر وسلوك التحويل الاحتياطي.
    </Note>

  </Accordion>

  <Accordion title="توليد الصور">
    يسجّل Plugin ‏`xai` المضمّن توليد الصور عبر الأداة المشتركة
    `image_generate`.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-pro`
    - الأوضاع: text-to-image وتحرير الصور المرجعية
    - المدخلات المرجعية: `image` واحدة أو حتى خمس `images`
    - نسب الأبعاد: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - الدقات: `1K`, `2K`
    - العدد: حتى 4 صور

    يطلب OpenClaw من xAI استجابات صور من نوع `b64_json` حتى يمكن
    تخزين media المُولّدة وتسليمها عبر مسار مرفقات القناة العادي. ويتم تحويل
    الصور المرجعية المحلية إلى data URLs؛ بينما تمر المراجع البعيدة `http(s)`
    كما هي.

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
    توثق xAI أيضًا `quality` و`mask` و`user` ونِسبًا أصلية إضافية
    مثل `1:2` و`2:1` و`9:20` و`20:9`. ولا يمرر OpenClaw اليوم إلا
    عناصر التحكم المشتركة بين الموفّرين في الصور؛ أما الخيارات الأصلية فقط غير المدعومة
    فلا يتم كشفها عمدًا عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجّل Plugin ‏`xai` المضمّن تحويل النص إلى كلام عبر سطح الموفّر
    المشترك `tts`.

    - الأصوات: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - الصوت الافتراضي: `eve`
    - التنسيقات: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز سرعة أصلي خاص بالموفّر
    - لا يتم دعم تنسيق Opus الأصلي للملاحظات الصوتية

    لاستخدام xAI كموفّر TTS الافتراضي:

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
    يستخدم OpenClaw نقطة النهاية الدفعية `/v1/tts` الخاصة بـ xAI. كما توفر xAI
    أيضًا TTS متدفقًا عبر WebSocket، لكن عقد موفّر الكلام في OpenClaw يتوقع حاليًا
    مخزن صوت مكتملًا قبل تسليم الرد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin ‏`xai` المضمّن تحويل الكلام إلى نص على دفعات عبر سطح
    النسخ الخاص بفهم media في OpenClaw.

    - النموذج الافتراضي: `grok-stt`
    - نقطة النهاية: xAI REST ‏`/v1/stt`
    - مسار الإدخال: رفع ملف صوت متعدد الأجزاء
    - مدعوم في OpenClaw أينما كان نسخ الصوت الوارد يستخدم
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية
      ومرفقات الصوت في القنوات

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
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    يمكن تمرير اللغة عبر إعداد audio media المشترك أو عبر طلب
    النسخ لكل استدعاء. وتُقبل تلميحات الـ prompt عبر سطح OpenClaw المشترك،
    لكن تكامل xAI REST STT لا يمرر إلا الملف والنموذج واللغة لأن هذه العناصر
    تتوافق بوضوح مع نقطة نهاية xAI العامة الحالية.

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص بشكل متدفق">
    يسجّل Plugin ‏`xai` المضمّن أيضًا موفّر نسخ فوريًا
    للصوت الحي في المكالمات الصوتية.

    - نقطة النهاية: xAI WebSocket ‏`wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل العيّنة الافتراضي: `8000`
    - تحديد نقطة النهاية الافتراضي: `800ms`
    - تكون النسخ الوسيطة مفعلة افتراضيًا

    يرسل تدفق media الخاص بـ Twilio في Voice Call إطارات صوت G.711 µ-law، لذا يمكن
    لموفّر xAI تمرير هذه الإطارات مباشرة من دون تحويل ترميز:

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

    يوجد الإعداد الخاص بالموفّر ضمن
    `plugins.entries.voice-call.config.streaming.providers.xai`. والمفاتيح
    المدعومة هي `apiKey` و`baseUrl` و`sampleRate` و`encoding` ‏(`pcm` أو `mulaw` أو
    `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    موفّر البث هذا مخصص لمسار النسخ الفوري في Voice Call.
    أما الصوت في Discord فيسجّل حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك
    مسار النسخ الدفعي `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="إعداد x_search">
    يكشف Plugin ‏xAI المضمّن `x_search` كأداة OpenClaw للبحث في
    محتوى X ‏(المعروف سابقًا باسم Twitter) عبر Grok.

    مسار الإعداد: `plugins.entries.xai.config.xSearch`

    | المفتاح            | النوع   | الافتراضي         | الوصف                                 |
    | ------------------ | ------- | ----------------- | ------------------------------------- |
    | `enabled`          | boolean | —                 | تمكين أو تعطيل x_search              |
    | `model`            | string  | `grok-4-1-fast`   | النموذج المستخدم لطلبات x_search     |
    | `inlineCitations`  | boolean | —                 | تضمين الاستشهادات المضمنة في النتائج  |
    | `maxTurns`         | number  | —                 | الحد الأقصى لمرات المحادثة            |
    | `timeoutSeconds`   | number  | —                 | مهلة الطلب بالثواني                   |
    | `cacheTtlMinutes`  | number  | —                 | مدة بقاء ذاكرة التخزين المؤقت بالدقائق |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="إعداد تنفيذ الكود">
    يكشف Plugin ‏xAI المضمّن `code_execution` كأداة OpenClaw من أجل
    التنفيذ البعيد للكود داخل بيئة sandbox الخاصة بـ xAI.

    مسار الإعداد: `plugins.entries.xai.config.codeExecution`

    | المفتاح            | النوع   | الافتراضي                  | الوصف                                      |
    | ------------------ | ------- | -------------------------- | ------------------------------------------ |
    | `enabled`          | boolean | `true` (عند توفر المفتاح)  | تمكين أو تعطيل تنفيذ الكود                 |
    | `model`            | string  | `grok-4-1-fast`            | النموذج المستخدم لطلبات تنفيذ الكود        |
    | `maxTurns`         | number  | —                          | الحد الأقصى لمرات المحادثة                 |
    | `timeoutSeconds`   | number  | —                          | مهلة الطلب بالثواني                        |

    <Note>
    هذا تنفيذ بعيد داخل sandbox الخاصة بـ xAI، وليس [`exec`](/ar/tools/exec) محليًا.
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

  <Accordion title="القيود المعروفة">
    - المصادقة اليوم تعتمد على مفتاح API فقط. ولا يوجد بعد في OpenClaw تدفق xAI OAuth أو device-code.
    - لا يتم دعم `grok-4.20-multi-agent-experimental-beta-0304` على
      مسار موفّر xAI العادي لأنه يتطلب سطح API مختلفًا في المصدر upstream
      عن وسيلة النقل القياسية لـ xAI في OpenClaw.
    - لم يتم بعد تسجيل xAI Realtime voice كموفّر في OpenClaw. فهو
      يحتاج إلى عقد مختلف لجلسة صوت ثنائية الاتجاه عن STT الدفعي أو
      النسخ المتدفق.
    - لا يتم كشف `quality` للصور في xAI و`mask` للصور ونِسب الأبعاد الإضافية
      الأصلية فقط إلى أن تحتوي الأداة المشتركة `image_generate` على عناصر
      تحكم مقابلة مشتركة بين الموفّرين.
  </Accordion>

  <Accordion title="ملاحظات متقدمة">
    - يطبق OpenClaw إصلاحات التوافق الخاصة بـ xAI على مخطط الأدوات واستدعاءات الأدوات
      تلقائيًا على مسار المشغّل المشترك.
    - تكون طلبات xAI الأصلية مضبوطة افتراضيًا على `tool_stream: true`. اضبط
      `agents.defaults.models["xai/<model>"].params.tool_stream` على `false` من أجل
      تعطيله.
    - يزيل الغلاف المضمّن لـ xAI علامات مخطط الأدوات الصارمة غير المدعومة ومفاتيح حمولات
      reasoning قبل إرسال طلبات xAI الأصلية.
    - يتم كشف `web_search` و`x_search` و`code_execution` كأدوات OpenClaw.
      ويفعّل OpenClaw المكوّن الأصلي المحدد الذي يحتاجه من xAI داخل كل طلب أداة
      بدلًا من إرفاق كل الأدوات الأصلية بكل دور دردشة.
    - يتولى Plugin ‏xAI المضمّن ملكية `x_search` و`code_execution`
      بدلًا من تضمينهما بشكل hardcoded في وقت تشغيل النموذج الأساسي.
    - إن `code_execution` هو تنفيذ بعيد داخل sandbox الخاصة بـ xAI، وليس
      [`exec`](/ar/tools/exec) محليًا.
  </Accordion>
</AccordionGroup>

## الاختبار الحي

تغطي الاختبارات الوحدوية وأجنحة الاختبار الحية الاختيارية مسارات xAI الخاصة بـ media. وتقوم
الأوامر الحية بتحميل الأسرار من shell تسجيل الدخول لديك، بما في ذلك `~/.profile`، قبل
التحقق من `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

يقوم الملف الحي الخاص بالموفّر بتجميع TTS عادي وTTS
بتنسيق PCM مناسب للاتصالات الهاتفية، ونسخ الصوت عبر STT الدفعي من xAI، وبث PCM نفسه عبر STT
الفوري من xAI، وتوليد مخرجات text-to-image، وتحرير صورة مرجعية. كما يتحقق
ملف الصور الحي المشترك من موفّر xAI نفسه عبر اختيار وقت التشغيل في OpenClaw
والتحويل الاحتياطي والتطبيع ومسار إرفاق media.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك التحويل الاحتياطي.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة وتحديد الموفّر.
  </Card>
  <Card title="كل الموفّرين" href="/ar/providers/index" icon="grid-2">
    النظرة العامة الأوسع على الموفّرين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة والإصلاحات.
  </Card>
</CardGroup>
