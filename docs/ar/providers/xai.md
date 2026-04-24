---
read_when:
    - تريد استخدام نماذج Grok في OpenClaw
    - أنت تضبط مصادقة xAI أو معرّفات النماذج
summary: استخدم نماذج xAI Grok في OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-24T08:01:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf125767e3123d6fbf000825323dc736712feea65582c1db9f7ffccc2bc20bb4
    source_path: providers/xai.md
    workflow: 15
---

يشحن OpenClaw Plugin مضمّنة باسم `xai` لنماذج Grok.

## البدء

<Steps>
  <Step title="أنشئ مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم xAI](https://console.x.ai/).
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
يستخدم OpenClaw واجهة xAI Responses API كناقل xAI المضمّن. ويمكن للمفتاح نفسه
`XAI_API_KEY` أيضًا تشغيل `web_search` المعتمد على Grok، و`x_search`
الأصلي، و`code_execution` البعيد.
إذا خزّنت مفتاح xAI تحت `plugins.entries.xai.config.webSearch.apiKey`,
فإن مزود نموذج xAI المضمّن يعيد استخدام ذلك المفتاح كرجوع احتياطي أيضًا.
توجد إعدادات `code_execution` تحت `plugins.entries.xai.config.codeExecution`.
</Note>

## الفهرس المضمّن

يتضمن OpenClaw عائلات نماذج xAI التالية بشكل افتراضي:

| العائلة | معرّفات النماذج |
| ------- | ---------------- |
| Grok 3 | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast` |
| Grok 4 | `grok-4`, `grok-4-0709` |
| Grok 4 Fast | `grok-4-fast`, `grok-4-fast-non-reasoning` |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning` |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code | `grok-code-fast-1` |

كما تقوم Plugin أيضًا بحلّ معرّفات `grok-4*` و`grok-code-fast*` الأحدث
تمريريًا عندما تتبع شكل API نفسه.

<Tip>
تُعد `grok-4-fast` و`grok-4-1-fast` ومتغيرات `grok-4.20-beta-*`
مراجع Grok الحالية القادرة على التعامل مع الصور في الفهرس المضمّن.
</Tip>

## تغطية ميزات OpenClaw

تقوم Plugin المضمّنة بربط سطح API العام الحالي لـ xAI بعقود
المزودات والأدوات المشتركة في OpenClaw. أما القدرات التي لا تلائم العقد المشترك
(مثل TTS المتدفق والصوت الفوري) فلا يتم كشفها — راجع الجدول
أدناه.

| قدرة xAI | سطح OpenClaw | الحالة |
| -------- | ------------- | ------ |
| Chat / Responses | مزود النموذج `xai/<model>` | نعم |
| البحث على الويب من جهة الخادم | مزود `web_search` باسم `grok` | نعم |
| X search من جهة الخادم | أداة `x_search` | نعم |
| تنفيذ الكود من جهة الخادم | أداة `code_execution` | نعم |
| الصور | `image_generate` | نعم |
| الفيديو | `video_generate` | نعم |
| تحويل النص إلى كلام دفعيًا | `messages.tts.provider: "xai"` / `tts` | نعم |
| TTS متدفق | — | غير مكشوف؛ إذ يعيد عقد TTS في OpenClaw مخازن صوتية كاملة |
| تحويل الكلام إلى نص دفعيًا | `tools.media.audio` / media understanding | نعم |
| تحويل الكلام إلى نص متدفق | Voice Call ‏`streaming.provider: "xai"` | نعم |
| الصوت الفوري | — | غير مكشوف بعد؛ إذ يستخدم عقد جلسة/WebSocket مختلفًا |
| الملفات / الدُفعات | توافق Generic model API فقط | ليست أداة أصلية من الدرجة الأولى في OpenClaw |

<Note>
يستخدم OpenClaw واجهات REST الخاصة بـ xAI للصور/الفيديو/TTS/STT من أجل توليد الوسائط،
والكلام، والتحويل الدفعي إلى نص، كما يستخدم WebSocket الخاصة بـ STT المتدفق في xAI
لتحويل Voice Call المباشر إلى نص، ويستخدم Responses API للنموذج والبحث
وأدوات تنفيذ الكود. أما الميزات التي تحتاج إلى عقود مختلفة في OpenClaw، مثل
جلسات الصوت الفوري، فتوثَّق هنا كقدرات upstream بدلًا من إخفائها
كسلوك خاص بالـ Plugin.
</Note>

### تعيينات الوضع السريع

يؤدي `/fast on` أو `agents.defaults.models["xai/<model>"].params.fastMode: true`
إلى إعادة كتابة طلبات xAI الأصلية على النحو التالي:

| النموذج المصدر | هدف الوضع السريع |
| -------------- | ---------------- |
| `grok-3` | `grok-3-fast` |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4` | `grok-4-fast` |
| `grok-4-0709` | `grok-4-fast` |

### الأسماء المستعارة القديمة المتوافقة

لا تزال الأسماء المستعارة القديمة تُطبَّع إلى المعرّفات القياسية المضمّنة:

| الاسم المستعار القديم | المعرّف القياسي |
| --------------------- | ---------------- |
| `grok-4-fast-reasoning` | `grok-4-fast` |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast` |
| `grok-4.20-reasoning` | `grok-4.20-beta-latest-reasoning` |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## الميزات

<AccordionGroup>
  <Accordion title="البحث على الويب">
    يستخدم مزود `grok` المضمّن للبحث على الويب المفتاح `XAI_API_KEY` أيضًا:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="توليد الفيديو">
    تسجل Plugin المضمّنة `xai` توليد الفيديو عبر الأداة المشتركة
    `video_generate`.

    - نموذج الفيديو الافتراضي: `xai/grok-imagine-video`
    - الأوضاع: text-to-video، وimage-to-video، وتحرير فيديو بعيد، وتمديد فيديو بعيد
    - نسب الأبعاد: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - الدقات: `480P`, `720P`
    - المدة: من 1 إلى 15 ثانية للتوليد/image-to-video، ومن 2 إلى 10 ثوانٍ
      للتمديد

    <Warning>
    لا تُقبل مخازن الفيديو المحلية. استخدم عناوين URL بعيدة من نوع
    `http(s)` لمدخلات تحرير/تمديد الفيديو. أما image-to-video فيقبل
    مخازن الصور المحلية لأن OpenClaw يستطيع ترميزها كعناوين data URL لـ xAI.
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
    راجع [توليد الفيديو](/ar/tools/video-generation) لمعرفة معلمات الأداة المشتركة،
    واختيار provider، وسلوك failover.
    </Note>

  </Accordion>

  <Accordion title="توليد الصور">
    تسجل Plugin المضمّنة `xai` توليد الصور عبر الأداة المشتركة
    `image_generate`.

    - نموذج الصور الافتراضي: `xai/grok-imagine-image`
    - نموذج إضافي: `xai/grok-imagine-image-pro`
    - الأوضاع: text-to-image وتحرير الصورة المرجعية
    - المدخلات المرجعية: `image` واحدة أو حتى خمس `images`
    - نسب الأبعاد: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - الدقات: `1K`, `2K`
    - العدد: حتى 4 صور

    يطلب OpenClaw من xAI استجابات صور من نوع `b64_json` حتى يمكن
    تخزين الوسائط المولدة وتسليمها عبر مسار المرفقات العادي في القنوات. ويتم
    تحويل الصور المرجعية المحلية إلى data URLs؛ أما المراجع البعيدة من نوع `http(s)` فتمرر كما هي.

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
    توثّق xAI أيضًا `quality` و`mask` و`user` ونسبًا أصلية إضافية
    مثل `1:2` و`2:1` و`9:20` و`20:9`. ولا يمرر OpenClaw اليوم سوى
    عناصر التحكم المشتركة بين المزودين الخاصة بالصور؛ أما العناصر الأصلية غير المدعومة
    فهي غير مكشوفة عمدًا عبر `image_generate`.
    </Note>

  </Accordion>

  <Accordion title="تحويل النص إلى كلام">
    تسجل Plugin المضمّنة `xai` تحويل النص إلى كلام عبر سطح مزود
    `tts` المشترك.

    - الأصوات: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - الصوت الافتراضي: `eve`
    - الصيغ: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - اللغة: رمز BCP-47 أو `auto`
    - السرعة: تجاوز السرعة الأصلي الخاص بالـ provider
    - صيغة ملاحظات الصوت الأصلية Opus غير مدعومة

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
    يستخدم OpenClaw نقطة النهاية الدفعية `/v1/tts` الخاصة بـ xAI. كما توفر xAI أيضًا TTS
    متدفقًا عبر WebSocket، لكن عقد مزود الكلام في OpenClaw يتوقع حاليًا
    مخزنًا صوتيًا كاملًا قبل تسليم الرد.
    </Note>

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص">
    تسجل Plugin المضمّنة `xai` تحويل الكلام إلى نص على دفعات عبر سطح
    media-understanding الخاص بالنسخ النصي في OpenClaw.

    - النموذج الافتراضي: `grok-stt`
    - نقطة النهاية: REST ‏`/v1/stt` الخاصة بـ xAI
    - مسار الإدخال: رفع ملف صوتي عبر multipart
    - مدعوم في OpenClaw أينما استخدم النسخ النصي للصوت الوارد
      `tools.media.audio`، بما في ذلك مقاطع قنوات Discord الصوتية و
      مرفقات الصوت في القنوات

    لفرض xAI لتحويل الصوت الوارد إلى نص:

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

    يمكن تمرير اللغة عبر إعدادات وسائط الصوت المشتركة أو عبر
    طلب النسخ النصي لكل استدعاء. وتُقبل تلميحات prompt عبر سطح OpenClaw
    المشترك، لكن تكامل REST STT الخاص بـ xAI لا يمرر إلا الملف، والنموذج،
    واللغة لأن هذه العناصر تتطابق بشكل نظيف مع نقطة نهاية xAI العامة الحالية.

  </Accordion>

  <Accordion title="تحويل الكلام إلى نص المتدفق">
    تسجل Plugin المضمّنة `xai` أيضًا مزودًا للنسخ الفوري
    لصوت Voice Call المباشر.

    - نقطة النهاية: WebSocket الخاصة بـ xAI ‏`wss://api.x.ai/v1/stt`
    - الترميز الافتراضي: `mulaw`
    - معدل العينة الافتراضي: `8000`
    - الضبط الافتراضي لنهاية الجملة: `800ms`
    - النتائج المرحلية: مفعلة افتراضيًا

    يرسل تدفق وسائط Twilio في Voice Call إطارات صوت G.711 µ-law، لذلك
    يمكن لمزود xAI تمرير هذه الإطارات مباشرة من دون تحويل ترميز:

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

    يوجد الإعداد المملوك للـ provider تحت
    `plugins.entries.voice-call.config.streaming.providers.xai`. والمفاتيح
    المدعومة هي `apiKey` و`baseUrl` و`sampleRate` و`encoding` ‏(`pcm` أو `mulaw` أو
    `alaw`) و`interimResults` و`endpointingMs` و`language`.

    <Note>
    هذا المزود المتدفق مخصص لمسار النسخ الفوري في Voice Call.
    أما صوت Discord فيسجل حاليًا مقاطع قصيرة ويستخدم مسار النسخ الدفعي
    `tools.media.audio` بدلًا من ذلك.
    </Note>

  </Accordion>

  <Accordion title="إعدادات x_search">
    تكشف Plugin xAI المضمّنة الأداة `x_search` كأداة في OpenClaw للبحث
    في محتوى X ‏(Twitter سابقًا) عبر Grok.

    مسار الإعدادات: `plugins.entries.xai.config.xSearch`

    | المفتاح | النوع | الافتراضي | الوصف |
    | -------- | ----- | ---------- | ------ |
    | `enabled` | boolean | — | تفعيل أو تعطيل `x_search` |
    | `model` | string | `grok-4-1-fast` | النموذج المستخدم لطلبات `x_search` |
    | `inlineCitations` | boolean | — | تضمين استشهادات مضمنة في النتائج |
    | `maxTurns` | number | — | الحد الأقصى لعدد أدوار المحادثة |
    | `timeoutSeconds` | number | — | مهلة الطلب بالثواني |
    | `cacheTtlMinutes` | number | — | مدة بقاء cache بالدقائق |

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

  <Accordion title="إعدادات تنفيذ الكود">
    تكشف Plugin المضمّنة xAI الأداة `code_execution` كأداة في OpenClaw من أجل
    تنفيذ الكود عن بُعد داخل بيئة sandbox الخاصة بـ xAI.

    مسار الإعدادات: `plugins.entries.xai.config.codeExecution`

    | المفتاح | النوع | الافتراضي | الوصف |
    | -------- | ----- | ---------- | ------ |
    | `enabled` | boolean | `true` ‏(إذا كان المفتاح متاحًا) | تفعيل أو تعطيل تنفيذ الكود |
    | `model` | string | `grok-4-1-fast` | النموذج المستخدم لطلبات تنفيذ الكود |
    | `maxTurns` | number | — | الحد الأقصى لعدد أدوار المحادثة |
    | `timeoutSeconds` | number | — | مهلة الطلب بالثواني |

    <Note>
    هذا تنفيذ بعيد داخل sandbox الخاصة بـ xAI، وليس [`exec`](/ar/tools/exec) المحلي.
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
    - المصادقة تعتمد على مفتاح API فقط حاليًا. لا يوجد تدفق xAI OAuth أو device-code في
      OpenClaw بعد.
    - لا يتم دعم `grok-4.20-multi-agent-experimental-beta-0304` على
      مسار xAI provider العادي لأنه يتطلب سطح API مختلفًا في upstream
      عن ناقل xAI القياسي في OpenClaw.
    - لم يتم تسجيل xAI Realtime voice بعد كمزوّد في OpenClaw. إذ
      يحتاج إلى عقد جلسة صوتية ثنائية الاتجاه تختلف عن STT الدفعي أو
      التحويل المتدفق إلى نص.
    - لا يتم كشف `quality` الخاصة بصور xAI، ولا `mask` الخاصة بالصور، ولا نسب الأبعاد الأصلية الإضافية
      إلى أن تكتسب الأداة المشتركة `image_generate` عناصر تحكم مقابلة
      بين مختلف providers.
  </Accordion>

  <Accordion title="ملاحظات متقدمة">
    - يطبق OpenClaw إصلاحات توافق مخطط الأدوات واستدعاءات الأدوات الخاصة بـ xAI
      تلقائيًا على مسار المشغّل المشترك.
    - تستخدم طلبات xAI الأصلية افتراضيًا `tool_stream: true`. اضبط
      `agents.defaults.models["xai/<model>"].params.tool_stream` إلى `false` من أجل
      تعطيله.
    - يقوم wrapper المضمّن الخاص بـ xAI بإزالة أعلام مخطط الأدوات الصارمة غير المدعومة
      ومفاتيح حمولة reasoning قبل إرسال طلبات xAI الأصلية.
    - يتم كشف `web_search` و`x_search` و`code_execution` كأدوات OpenClaw.
      ويقوم OpenClaw بتفعيل builtin الخاصة بـ xAI التي يحتاج إليها في كل
      طلب أداة بدلًا من إرفاق جميع الأدوات الأصلية بكل دور دردشة.
    - إن `x_search` و`code_execution` مملوكتان لـ Plugin المضمّنة xAI
      بدلًا من أن تكونا مدمجتين مباشرة في وقت تشغيل النموذج الأساسي.
    - إن `code_execution` تنفيذ بعيد داخل sandbox الخاصة بـ xAI، وليس
      [`exec`](/ar/tools/exec) المحلي.
  </Accordion>
</AccordionGroup>

## الاختبار المباشر

تغطي الاختبارات الوحدية ومسارات الاختبار المباشر الاختيارية مسارات وسائط xAI. وتحمل
أوامر الاختبار المباشر الأسرار من shell تسجيل الدخول لديك، بما في ذلك
`~/.profile`، قبل فحص `XAI_API_KEY`.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

يقوم الملف المباشر الخاص بالـ provider بتركيب TTS عادي، وTTS بصيغة PCM
الملائمة للاتصالات الهاتفية، وتحويل الصوت إلى نص عبر xAI batch STT، وبث
PCM نفسه عبر xAI realtime STT، وتوليد مخرجات text-to-image، وتحرير صورة
مرجعية. ويتحقق ملف الصور المباشر المشترك من مزود xAI نفسه عبر
اختيار وقت التشغيل، وfallback، والتطبيع، ومسار إرفاق الوسائط في OpenClaw.

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار providers، ومراجع النماذج، وسلوك failover.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار provider.
  </Card>
  <Card title="جميع providers" href="/ar/providers/index" icon="grid-2">
    النظرة العامة الأوسع على providers.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة والإصلاحات.
  </Card>
</CardGroup>
