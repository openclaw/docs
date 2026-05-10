---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - تقوم بتكوين مصادقة xAI أو معرّفات النماذج
summary: استخدام نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-05-10T19:59:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f11c31e7ff39e7e13465b48d819db3921a32ed624676a57dc38f97c0dbd21e46
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw يوفّر Plugin مزوّد `xai` مضمّناً لنماذج Grok.

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
يستخدم OpenClaw واجهة xAI Responses API باعتبارها وسيلة نقل xAI المضمّنة. يمكن لمفتاح API نفسه من `openclaw onboard --auth-choice xai-api-key` تشغيل `x_search` من الدرجة الأولى و`code_execution` البعيد أيضاً؛ كما يمكن لـ `XAI_API_KEY` أو إعداد بحث الويب في Plugin تشغيل `web_search` المدعوم من Grok أيضاً.
إذا خزّنت مفتاح xAI ضمن `plugins.entries.xai.config.webSearch.apiKey`،
فسيعيد مزوّد نماذج xAI المضمّن استخدام ذلك المفتاح كخيار احتياطي أيضاً.
عيّن `plugins.entries.xai.config.webSearch.baseUrl` لتوجيه `web_search` من Grok
وكذلك، افتراضياً، `x_search` عبر وكيل xAI Responses خاص بالمشغّل.
توجد إعدادات ضبط `code_execution` ضمن `plugins.entries.xai.config.codeExecution`.
</Note>

## الكتالوج المضمّن

يتضمّن OpenClaw عائلات نماذج xAI هذه مباشرة:

| العائلة        | معرّفات النماذج                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

كما يحلّ Plugin معرّفات `grok-4*` و`grok-code-fast*` الأحدث إلى الأمام عندما
تتبع شكل API نفسه.

<Tip>
`grok-4.3` و`grok-4-fast` و`grok-4-1-fast` ومتغيرات `grok-4.20-beta-*`
هي مراجع Grok الحالية القادرة على معالجة الصور في الكتالوج المضمّن.
</Tip>

## تغطية ميزات OpenClaw

يربط Plugin المضمّن سطح API العام الحالي لـ xAI بعقود المزوّد والأدوات
المشتركة في OpenClaw. لا تُعرَض القدرات التي لا تلائم العقد المشترك
(مثل بث TTS والصوت في الوقت الفعلي) - راجع الجدول أدناه.

| قدرة xAI                   | سطح OpenClaw                              | الحالة                                                              |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| المحادثة / Responses       | مزوّد نموذج `xai/<model>`                 | نعم                                                                 |
| بحث الويب من جهة الخادم    | مزوّد `web_search` باسم `grok`            | نعم                                                                 |
| بحث X من جهة الخادم        | أداة `x_search`                           | نعم                                                                 |
| تنفيذ الكود من جهة الخادم  | أداة `code_execution`                     | نعم                                                                 |
| الصور                      | `image_generate`                          | نعم                                                                 |
| الفيديوهات                 | `video_generate`                          | نعم                                                                 |
| تحويل النص إلى كلام دفعي   | `messages.tts.provider: "xai"` / `tts`    | نعم                                                                 |
| بث TTS                     | -                                         | غير معروض؛ يعيد عقد TTS في OpenClaw مخازن صوتية كاملة              |
| تحويل الكلام إلى نص دفعي   | `tools.media.audio` / فهم الوسائط         | نعم                                                                 |
| بث تحويل الكلام إلى نص     | Voice Call `streaming.provider: "xai"`    | نعم                                                                 |
| الصوت في الوقت الفعلي      | -                                         | غير معروض بعد؛ عقد جلسة/WebSocket مختلف                            |
| الملفات / الدُفعات         | توافق API النماذج العام فقط               | ليست أداة OpenClaw من الدرجة الأولى                                |

<Note>
يستخدم OpenClaw واجهات REST الخاصة بـ xAI للصور/الفيديو/TTS/STT لتوليد الوسائط
والكلام والنسخ الدفعي، ويستخدم WebSocket الخاص ببث STT من xAI لنسخ مكالمات
الصوت الحية، ويستخدم Responses API للنماذج والبحث وأدوات تنفيذ الكود. الميزات
التي تحتاج إلى عقود مختلفة في OpenClaw، مثل جلسات الصوت في الوقت الفعلي،
موثّقة هنا كقدرات من المنبع بدلاً من كونها سلوكاً مخفياً في Plugin.
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

### أسماء التوافق المستعارة القديمة

لا تزال الأسماء المستعارة القديمة تُطبّع إلى المعرّفات المضمّنة القياسية:

| الاسم المستعار القديم     | المعرّف القياسي                         |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## الميزات

<AccordionGroup>
  <Accordion title="بحث الويب">
    يمكن لمزوّد بحث الويب `grok` المضمّن استخدام `XAI_API_KEY` أو مفتاح
    بحث ويب خاص بـ Plugin:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="توليد الفيديو">
    يسجّل Plugin `xai` المضمّن توليد الفيديو عبر أداة `video_generate`
    المشتركة.

    - نموذج الفيديو الافتراضي: `xai/grok-imagine-video`
    - الأوضاع: نص إلى فيديو، صورة إلى فيديو، توليد صورة مرجعية، تعديل فيديو
      بعيد، وتمديد فيديو بعيد
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - الدقات: `480P`, `720P`
    - المدة: 1-15 ثانية للتوليد/الصورة إلى فيديو، و1-10 ثوانٍ عند استخدام
      أدوار `reference_image`، و2-10 ثوانٍ للتمديد
    - توليد الصور المرجعية: عيّن `imageRoles` إلى `reference_image` لكل
      صورة مقدّمة؛ تقبل xAI ما يصل إلى 7 صور من هذا النوع

    <Warning>
    لا تُقبل مخازن الفيديو المحلية. استخدم عناوين URL بعيدة بصيغة `http(s)`
    لمدخلات تعديل/تمديد الفيديو. تقبل الصورة إلى فيديو مخازن الصور المحلية لأن
    OpenClaw يمكنه ترميزها كعناوين URL بيانات لـ xAI.
    </Warning>

    لاستخدام xAI كمزوّد الفيديو الافتراضي:

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
    راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة،
    واختيار المزوّد، وسلوك تجاوز الفشل.
    </Note>

  </Accordion>

  <Accordion title="توليد الصور">
    يسجّل Plugin `xai` المضمّن توليد الصور عبر أداة `image_generate`
    المشتركة.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-pro`
    - الأوضاع: نص إلى صورة وتعديل صورة مرجعية
    - المدخلات المرجعية: `image` واحدة أو ما يصل إلى خمس `images`
    - نسب العرض إلى الارتفاع: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - الدقات: `1K`, `2K`
    - العدد: ما يصل إلى 4 صور

    يطلب OpenClaw من xAI استجابات صور `b64_json` حتى يمكن تخزين الوسائط
    المُولّدة وتسليمها عبر مسار مرفقات القناة المعتاد. تُحوّل الصور المرجعية
    المحلية إلى عناوين URL بيانات؛ وتُمرّر مراجع `http(s)` البعيدة كما هي.

    لاستخدام xAI كمزوّد الصور الافتراضي:

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
    توثّق xAI أيضاً `quality` و`mask` و`user` ونسباً أصلية إضافية مثل
    `1:2` و`2:1` و`9:20` و`20:9`. يمرّر OpenClaw اليوم عناصر التحكم المشتركة
    بين المزوّدين للصور فقط؛ ولا تُعرَض مفاتيح التحكم الأصلية غير المدعومة
    الخاصة بمزوّد واحد عبر `image_generate` عمداً.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    يسجّل Plugin `xai` المضمّن تحويل النص إلى كلام عبر سطح مزوّد `tts`
    المشترك.

    - الأصوات: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - الصوت الافتراضي: `eve`
    - الصيغ: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز سرعة أصلي للمزوّد
    - صيغة ملاحظات Opus الصوتية الأصلية غير مدعومة

    لاستخدام xAI كمزوّد TTS الافتراضي:

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
    يستخدم OpenClaw نقطة نهاية xAI الدفعية `/v1/tts`. توفّر xAI أيضاً بث TTS
    عبر WebSocket، لكن عقد مزوّد الكلام في OpenClaw يتوقع حالياً مخزناً صوتياً
    كاملاً قبل تسليم الرد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    يسجّل Plugin `xai` المضمّن تحويل الكلام إلى نص دفعي عبر سطح نسخ فهم
    الوسائط في OpenClaw.

    - النموذج الافتراضي: `grok-stt`
    - نقطة النهاية: xAI REST `/v1/stt`
    - مسار الإدخال: رفع ملف صوتي متعدد الأجزاء
    - مدعوم في OpenClaw حيثما يستخدم نسخ الصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية ومرفقات
      الصوت في القنوات

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

    يمكن توفير اللغة عبر إعداد وسائط الصوت المشترك أو طلب نسخ لكل استدعاء.
    تُقبل تلميحات الموجّه بواسطة سطح OpenClaw المشترك، لكن تكامل xAI REST STT
    لا يمرّر إلا الملف والنموذج واللغة لأنها تطابق نقطة نهاية xAI العامة
    الحالية بوضوح.

  </Accordion>

  <Accordion title="بث تحويل الكلام إلى نص">
    يسجّل Plugin `xai` المضمّن أيضاً مزوّد نسخ في الوقت الفعلي لصوت مكالمات
    الصوت الحية.

    - نقطة النهاية: xAI WebSocket `wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل العينة الافتراضي: `8000`
    - تحديد نقطة النهاية الافتراضي: `800ms`
    - النصوص المؤقتة: مفعّلة افتراضياً

    يرسل تدفق وسائط Twilio في Voice Call إطارات صوت G.711 µ-law، لذلك يمكن
    لمزوّد xAI تمرير تلك الإطارات مباشرة دون تحويل ترميز:

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

    توجد الإعدادات التي يملكها المزوّد ضمن
    `plugins.entries.voice-call.config.streaming.providers.xai`. المفاتيح
    المدعومة هي `apiKey` و`baseUrl` و`sampleRate` و`encoding` (`pcm` أو `mulaw` أو
    `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    مزوّد البث هذا مخصص لمسار النسخ الفوري في Voice Call.
    يسجّل صوت Discord حاليًا مقاطع قصيرة ويستخدم بدلًا من ذلك مسار نسخ الدفعات
    `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="إعداد x_search">
    يوفّر Plugin المضمّن الخاص بـ xAI الأداة `x_search` كأداة OpenClaw للبحث في
    محتوى X (المعروف سابقًا باسم Twitter) عبر Grok.

    مسار الإعدادات: `plugins.entries.xai.config.xSearch`

    | المفتاح           | النوع   | الافتراضي         | الوصف                                |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | تفعيل x_search أو تعطيله            |
    | `model`            | string  | `grok-4-1-fast`    | النموذج المستخدم لطلبات x_search     |
    | `baseUrl`          | string  | -                  | تجاوز عنوان URL الأساسي لـ xAI Responses |
    | `inlineCitations`  | boolean | -                  | تضمين الاستشهادات المضمنة في النتائج |
    | `maxTurns`         | number  | -                  | الحد الأقصى لعدد أدوار المحادثة     |
    | `timeoutSeconds`   | number  | -                  | مهلة الطلب بالثواني                 |
    | `cacheTtlMinutes`  | number  | -                  | مدة بقاء التخزين المؤقت بالدقائق    |

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
    يوفّر Plugin المضمّن الخاص بـ xAI الأداة `code_execution` كأداة OpenClaw
    لتنفيذ التعليمات البرمجية عن بُعد في بيئة عزل xAI.

    مسار الإعدادات: `plugins.entries.xai.config.codeExecution`

    | المفتاح          | النوع   | الافتراضي              | الوصف                                  |
    | ----------------- | ------- | ---------------------- | -------------------------------------- |
    | `enabled`         | boolean | `true` (إذا كان المفتاح متاحًا) | تفعيل تنفيذ التعليمات البرمجية أو تعطيله |
    | `model`           | string  | `grok-4-1-fast`        | النموذج المستخدم لطلبات تنفيذ التعليمات البرمجية |
    | `maxTurns`        | number  | -                      | الحد الأقصى لعدد أدوار المحادثة       |
    | `timeoutSeconds`  | number  | -                      | مهلة الطلب بالثواني                   |

    <Note>
    هذا تنفيذ في بيئة عزل xAI عن بُعد، وليس [`exec`](/ar/tools/exec) المحلي.
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
    - المصادقة اليوم عبر مفتاح API فقط. يمكن تخزين مفتاح API في ملف تعريف مصادقة
      xAI أو متغير بيئة أو إعدادات Plugin؛ لا يوجد حتى الآن تدفق xAI OAuth أو
      رمز جهاز في OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` غير مدعوم على مسار مزوّد
      xAI العادي لأنه يتطلب سطح API علويًا مختلفًا عن نقل xAI القياسي في OpenClaw.
    - لم يُسجّل صوت xAI Realtime كمزوّد OpenClaw حتى الآن. يحتاج إلى عقد جلسة
      صوتية ثنائية الاتجاه يختلف عن STT الدفعي أو النسخ بالبث.
    - لا تُعرَض `quality` الخاصة بصور xAI، و`mask` الخاص بالصور، ونِسب الأبعاد
      الأصلية الإضافية الحصرية، إلى أن تتوفر لأداة `image_generate` المشتركة
      عناصر تحكم مقابلة عابرة للمزوّدين.
  </Accordion>

  <Accordion title="ملاحظات متقدمة">
    - يطبّق OpenClaw تلقائيًا إصلاحات توافق مخطط الأدوات واستدعاءات الأدوات
      الخاصة بـ xAI على مسار المشغّل المشترك.
    - تستخدم طلبات xAI الأصلية افتراضيًا `tool_stream: true`. اضبط
      `agents.defaults.models["xai/<model>"].params.tool_stream` على `false`
      لتعطيله.
    - يزيل الغلاف المضمّن الخاص بـ xAI أعلام مخطط الأدوات الصارمة غير المدعومة
      ومفاتيح حمولة الاستدلال قبل إرسال طلبات xAI الأصلية.
    - تُعرَض `web_search` و`x_search` و`code_execution` كأدوات OpenClaw. يفعّل
      OpenClaw الميزة المضمّنة المحددة من xAI التي يحتاجها داخل كل طلب أداة بدلًا
      من إرفاق كل الأدوات الأصلية بكل دور دردشة.
    - يقرأ Grok `web_search` القيمة `plugins.entries.xai.config.webSearch.baseUrl`.
      يقرأ `x_search` القيمة `plugins.entries.xai.config.xSearch.baseUrl`، ثم
      يعود احتياطيًا إلى عنوان URL الأساسي لبحث الويب في Grok.
    - يملك Plugin xAI المضمّن `x_search` و`code_execution` بدلًا من ترميزهما
      مباشرة في وقت تشغيل النموذج الأساسي.
    - `code_execution` هو تنفيذ في بيئة عزل xAI عن بُعد، وليس
      [`exec`](/ar/tools/exec) المحلي.
  </Accordion>
</AccordionGroup>

## الاختبار المباشر

تغطي اختبارات الوحدة ومجموعات الاختبار المباشر الاختيارية مسارات وسائط xAI. تحمّل
الأوامر المباشرة الأسرار من صدفة تسجيل الدخول لديك، بما في ذلك `~/.profile`، قبل
فحص `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

ينشئ ملف الاختبار المباشر الخاص بالمزوّد TTS عاديًا، وTTS بتنسيق PCM مناسبًا
للاتصالات الهاتفية، وينسخ الصوت عبر STT الدفعي في xAI، ويبث PCM نفسه عبر STT
الفوري في xAI، وينشئ مخرجات تحويل النص إلى صورة، ويحرر صورة مرجعية. يتحقق ملف
اختبار الصور المباشر المشترك من مزوّد xAI نفسه عبر مسار اختيار وقت التشغيل
والرجوع الاحتياطي والتطبيع وإرفاق الوسائط في OpenClaw.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك الانتقال عند الفشل.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="كل المزوّدين" href="/ar/providers/index" icon="grid-2">
    النظرة العامة الأوسع على المزوّدين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وإصلاحاتها.
  </Card>
</CardGroup>
