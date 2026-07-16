---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو مسار مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API وOAuth، وتوليد الصور، وفهم الوسائط، وتحويل النص إلى كلام، والبحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-16T14:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

يوفّر Plugin Google إمكانية الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى إنشاء الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- واجهة API: Google Gemini API
- خيار وقت التشغيل: يعيد `agentRuntime.id: "google-gemini-cli"` استخدام OAuth الخاص بـ Gemini CLI مع إبقاء مراجع النماذج بالصيغة القياسية `google/*`.

## البدء

اختر طريقة المصادقة المفضلة واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API">
    **الأنسب لـ:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

    <Steps>
      <Step title="الحصول على مفتاح API">
        أنشئ مفتاحًا مجانيًا في [Google AI Studio](https://aistudio.google.com/apikey).
      </Step>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        أو مرّر المفتاح مباشرةً:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="تعيين نموذج افتراضي">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="التحقق من توفر النموذج">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    يُقبل كل من `GEMINI_API_KEY` و`GOOGLE_API_KEY`. استخدم ما سبق أن أعددته منهما.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأنسب لـ:** تسجيل الدخول باستخدام حساب Google عبر OAuth الخاص بـ Gemini CLI بدلًا من استخدام مفتاح API منفصل.

    <Warning>
    يُعدّ المزوّد `google-gemini-cli` تكاملًا غير رسمي. يفيد بعض المستخدمين
    بفرض قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="تثبيت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحًا ضمن `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # أو npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw عمليات التثبيت عبر Homebrew وعمليات التثبيت العامة عبر npm، بما في ذلك
        التخطيطات الشائعة في Windows/npm.
      </Step>
      <Step title="تسجيل الدخول عبر OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="التحقق من توفر النموذج">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - النموذج الافتراضي: `google/gemini-3.1-pro-preview`
    - وقت التشغيل: `google-gemini-cli`
    - الاسم البديل: `gemini-cli`

    معرّف نموذج Gemini API الخاص بـ Gemini 3.1 Pro هو `gemini-3.1-pro-preview`. يقبل OpenClaw الصيغة الأقصر `google/gemini-3.1-pro` كاسم بديل تسهيلي ويوحّدها قبل استدعاءات المزوّد.

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    إذا فشلت طلبات OAuth الخاصة بـ Gemini CLI بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من تثبيت الأمر المحلي `gemini`
    ووجوده ضمن `PATH`.
    </Note>

    يعرض الاكتشاف التلقائي أثناء الإعداد الأولي تسجيل دخول موجودًا إلى Gemini CLI، لكنه لا
    يختبره تلقائيًا مطلقًا لأن Gemini CLI لا يوفّر فحصًا بلا أدوات. اختر OAuth الخاص بـ Gemini CLI
    أو مفتاح Gemini API للمتابعة.

    مراجع النماذج `google-gemini-cli/*` هي أسماء بديلة للتوافق القديم. ينبغي أن تستخدم
    الإعدادات الجديدة مراجع النماذج `google/*` مع وقت التشغيل `google-gemini-cli`
    عندما تريد تنفيذ Gemini CLI محليًا.

  </Tab>
</Tabs>

<Note>
أُوقف `google/gemini-3-pro-preview` في 2026-03-09؛ استخدم `google/gemini-3.1-pro-preview` بدلًا منه. تؤدي إعادة تشغيل إعداد مفتاح Gemini API ‏(`openclaw onboard --auth-choice gemini-api-key` أو `openclaw models auth login --provider google`) إلى إعادة كتابة نموذج افتراضي قديم مُعدّ مسبقًا ليصبح النموذج الحالي.
</Note>

## الإمكانات

| الإمكانية              | مدعومة                        |
| ---------------------- | ----------------------------- |
| إكمالات المحادثة       | نعم                           |
| إنشاء الصور            | نعم                           |
| إنشاء الموسيقى         | نعم                           |
| تحويل النص إلى كلام    | نعم                           |
| الصوت في الوقت الفعلي  | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| نسخ الصوت              | نعم                           |
| فهم الفيديو            | نعم                           |
| البحث على الويب (Grounding) | نعم                      |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

## البحث على الويب

يستخدم مزوّد البحث على الويب المضمّن `gemini` ميزة إسناد Google Search في Gemini.
اضبط مفتاح بحث مخصصًا ضمن `plugins.entries.google.config.webSearch`،
أو دعه يعيد استخدام `models.providers.google.apiKey` بعد `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // اختياري إذا كان GEMINI_API_KEY أو models.providers.google.apiKey معينًا
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // يعود إلى models.providers.google.baseUrl كخيار احتياطي
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

ترتيب أولوية بيانات الاعتماد هو `webSearch.apiKey` المخصص، ثم `GEMINI_API_KEY`،
ثم `models.providers.google.apiKey`. الحقل `webSearch.baseUrl` اختياري
ومخصص لوكلاء المشغّلين أو نقاط نهاية Gemini API المتوافقة؛ وعند حذفه،
يعيد بحث Gemini على الويب استخدام `models.providers.google.baseUrl`. راجع
[بحث Gemini](/ar/tools/gemini-search) لمعرفة سلوك الأداة الخاص بالمزوّد.

<Tip>
تستخدم نماذج Gemini 3 ‏`thinkingLevel` بدلًا من `thinkingBudget`. يعيّن OpenClaw
عناصر التحكم في الاستدلال الخاصة بـ Gemini 3 وGemini 3.1 والاسم البديل `gemini-*-latest`
إلى `thinkingLevel`، كي لا ترسل عمليات التشغيل الافتراضية/منخفضة زمن الاستجابة
قيم `thinkingBudget` المعطّلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي لدى Google بدلًا من اختيار
مستوى ثابت في OpenClaw. تحذف Gemini 3 وGemini 3.1 القيمة الثابتة `thinkingLevel` كي
تتمكن Google من اختيار المستوى؛ وترسل Gemini 2.5 القيمة الحارسة الديناميكية لدى Google
‏`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google في Gemma 4.
يؤدي تعيين التفكير إلى `off` إلى إبقائه معطّلًا بدلًا من تعيينه إلى
`MINIMAL`.

لا يعمل Gemini 2.5 Pro إلا في وضع التفكير ويرفض القيمة الصريحة
`thinkingBudget: 0`؛ يزيل OpenClaw هذه القيمة من طلبات Gemini 2.5 Pro
بدلًا من إرسالها.
</Tip>

## إنشاء الصور

يستخدم مزوّد إنشاء الصور المضمّن `google` القيمة
`google/gemini-3.1-flash-image-preview` افتراضيًا.

- يدعم أيضًا `google/gemini-3-pro-image-preview`
- الإنشاء: ما يصل إلى 4 صور لكل طلب
- وضع التحرير: مفعّل، وما يصل إلى 5 صور إدخال
- عناصر التحكم الهندسية: `size` و`aspectRatio` و`resolution`

لاستخدام Google كمزوّد الصور الافتراضي:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
راجع [إنشاء الصور](/ar/tools/image-generation) لمعرفة معاملات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

## إنشاء الفيديو

يسجّل Plugin المضمّن `google` أيضًا إنشاء الفيديو عبر الأداة المشتركة
`video_generate`.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتدفقات مرجع الفيديو الواحد
- يدعم `aspectRatio` ‏(`16:9`، `9:16`) و`resolution` ‏(`720P`، `1080P`)؛ لا يدعم Veo إخراج الصوت حاليًا
- المدد المدعومة: **4 أو 6 أو 8 ثوانٍ** (تُضبط القيم الأخرى إلى أقرب قيمة مسموح بها)

لاستخدام Google كمزوّد الفيديو الافتراضي:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعرفة معاملات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

## إنشاء الموسيقى

يسجّل Plugin المضمّن `google` أيضًا إنشاء الموسيقى عبر الأداة المشتركة
`music_generate`.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في الموجّه: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- مدخلات المراجع: ما يصل إلى 10 صور
- تنفصل عمليات التشغيل المدعومة بجلسة عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام Google كمزوّد الموسيقى الافتراضي:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
راجع [إنشاء الموسيقى](/ar/tools/music-generation) لمعرفة معاملات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام المضمّن `google` مسار TTS في Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لوجهات الملاحظات الصوتية، وPCM للمحادثة/الاتصالات الهاتفية
- إخراج الملاحظات الصوتية: يُغلّف PCM من Google بتنسيق WAV ويُحوّل إلى Opus بتردد 48 kHz باستخدام `ffmpeg`

يعيد مسار Gemini TTS الدفعي من Google الصوت المُنشأ في استجابة
`generateContent` المكتملة. للحصول على أقل زمن استجابة في المحادثات المنطوقة، استخدم
مزوّد الصوت في الوقت الفعلي من Google والمدعوم بـ Gemini Live API بدلًا من
TTS الدفعي.

لاستخدام Google كمزوّد TTS الافتراضي:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "تحدث باحترافية وبنبرة هادئة.",
        },
      },
    },
  },
}
```

يستخدم Gemini API TTS توجيهًا باللغة الطبيعية للتحكم في الأسلوب. عيّن
`audioProfile` لإضافة موجّه أسلوب قابل لإعادة الاستخدام قبل النص المنطوق. عيّن
`speakerName` عندما يشير نص الموجّه إلى متحدث مسمّى.

يقبل Gemini API TTS أيضًا وسومًا صوتية تعبيرية بين أقواس مربعة في النص،
مثل `[whispers]` أو `[laughs]`. لإبعاد الوسوم عن رد المحادثة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
إليك نص الرد الواضح.

[[tts:text]][whispers] إليك النسخة المنطوقة.[[/tts:text]]
```

<Note>
يصلح مفتاح API من Google Cloud Console مقيّد بـ Gemini API لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت في الوقت الفعلي

يسجّل Plugin المضمّن `google` مزوّد صوت في الوقت الفعلي مدعومًا بـ
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار الإعداد                                                         | القيمة الافتراضية                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| النموذج                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                                |
| درجة الحرارة           | `...google.temperature`                                             | (غير معيّن)                                                                               |
| حساسية بدء VAD | `...google.startSensitivity`                                        | (غير معيّن)                                                                               |
| حساسية انتهاء VAD   | `...google.endSensitivity`                                          | (غير معيّن)                                                                               |
| مدة الصمت      | `...google.silenceDurationMs`                                       | (غير معيّن)                                                                               |
| معالجة النشاط     | `...google.activityHandling`                                        | القيمة الافتراضية من Google، `start-of-activity-interrupts`                                        |
| تغطية الدور         | `...google.turnCoverage`                                            | القيمة الافتراضية من Google، `audio-activity-and-all-video`                                        |
| تعطيل VAD التلقائي      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| استئناف الجلسة    | `...google.sessionResumption`                                       | `true`                                                                                |
| ضغط السياق   | `...google.contextWindowCompression`                                | `true`                                                                                |
| مفتاح API               | `...google.apiKey`                                                  | يعود احتياطيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على إعداد المكالمات الصوتية في الوقت الفعلي:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
تستخدم Google Live API صوتًا ثنائي الاتجاه واستدعاء الدوال عبر WebSocket.
يكيّف OpenClaw صوت جسر الاتصالات الهاتفية/Meet مع تدفق PCM Live API الخاص بـ Gemini،
ويُبقي استدعاءات الأدوات ضمن عقد الصوت المشترك في الوقت الفعلي. اترك `temperature`
غير معيّن ما لم تكن بحاجة إلى تغييرات في أخذ العينات؛ يحذف OpenClaw القيم غير الموجبة
لأن Google Live قد يعيد نصوصًا مفرغة من دون صوت للقيمة `temperature: 0`.
يُفعّل النسخ في Gemini API من دون `languageCodes`؛ إذ ترفض حزمة SDK الحالية من Google
تلميحات رمز اللغة في مسار API هذا.
</Note>

<Note>
يقبل Gemini 3.1 Live النص الحواري عبر الإدخال في الوقت الفعلي ويستخدم
استدعاء الدوال المتسلسل. يحذف OpenClaw الحقل الأقدم `NON_BLOCKING` وجدولة
استجابات الدوال وحقول الحوار العاطفي لهذا النموذج. يُفضّل
`thinkingLevel`؛ وتُعيّن قيم `thinkingBudget` الموجبة المضبوطة إلى
أقرب مستوى مدعوم، بينما تُبقي `-1` القيمة الافتراضية من Google كما هي. راجع
[مقارنة إمكانات Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
تدعم ميزة Talk في واجهة التحكم جلسات Google Live في المتصفح باستخدام رموز مقيّدة
صالحة للاستخدام مرة واحدة. ويمكن أيضًا لموفّري الصوت في الوقت الفعلي المخصصين للخلفية
العمل عبر نقل الترحيل العام في Gateway، الذي يُبقي بيانات اعتماد الموفّر على Gateway.
</Note>

للتحقق المباشر من قِبل المشرف، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
يشمل اختبار الدخان أيضًا مسارات خلفية OpenAI وWebRTC؛ إذ ينشئ جزء Google الرمز المقيّد نفسه
لـ Live API والمستخدم في Talk بواجهة التحكم، ويفتح نقطة نهاية WebSocket في المتصفح،
ويرسل حمولة الإعداد الأولية، وينتظر
`setupComplete`.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة Gemini المؤقتة مباشرةً">
    في عمليات Gemini API المباشرة (`api: "google-generative-ai"`)، يمرّر OpenClaw
    معرّف `cachedContent` المضبوط إلى طلبات Gemini.

    - اضبط المعلمات لكل نموذج أو عموميًا باستخدام إما
      `cachedContent` أو `cached_content` القديم
    - تكون الأولوية دائمًا للمعلمات من النطاق الأكثر تحديدًا (مستوى النموذج على العمومي).
      وضمن النطاق نفسه، إذا ضُبط المفتاحان، تكون الأولوية لـ `cached_content`.
      استخدم مفتاحًا واحدًا فقط لكل نطاق لتجنب النتائج غير المتوقعة.
    - قيمة مثال: `cachedContents/prebuilt-context`
    - يُطبّع استخدام إصابة ذاكرة Gemini المؤقتة إلى `cacheRead` في OpenClaw من
      `cachedContentTokenCount` في المنبع

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="ملاحظات استخدام Gemini CLI">
    عند استخدام موفّر OAuth ‏`google-gemini-cli`، يستخدم OpenClaw مخرجات
    Gemini CLI ‏`stream-json` افتراضيًا ويُطبّع الاستخدام من حمولة
    `stats` النهائية. ولا تزال تجاوزات `--output-format json` القديمة تستخدم
    محلل JSON.

    - يأتي نص الرد المتدفق من أحداث المساعد `message`.
    - بالنسبة إلى مخرجات JSON القديمة، يأتي نص الرد من حقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام احتياطيًا إلى `stats` عندما تترك CLI الحقل `usage` فارغًا.
    - يُطبّع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة الخفية">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="إنشاء الموسيقى" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار الموفّر.
  </Card>
</CardGroup>
