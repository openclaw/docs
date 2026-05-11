---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، إنشاء الصور، فهم الوسائط، TTS، بحث الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-11T20:39:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740ff99392d352e8c0f479af6002c52195b0c40e3ef688289d27dec583174847
    source_path: providers/google.md
    workflow: 16
---

يوفّر Google Plugin إمكانية الوصول إلى نماذج Gemini عبر Google AI Studio، إضافةً إلى
توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: Google Gemini API
- خيار وقت التشغيل: المزوّد/النموذج `agentRuntime.id: "google-gemini-cli"`
  يعيد استخدام Gemini CLI OAuth مع إبقاء مراجع النماذج معيارية بصيغة `google/*`.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

    <Steps>
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
    متغيرا البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY` مقبولان كلاهما. استخدم أيهما سبق أن أعددته.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI موجود عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    مزوّد `google-gemini-cli` هو تكامل غير رسمي. يبلّغ بعض المستخدمين
    عن قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="تثبيت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحًا على `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw عمليات التثبيت عبر Homebrew وعمليات التثبيت العالمية عبر npm، بما في ذلك
        تخطيطات Windows/npm الشائعة.
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
    - الاسم المستعار: `gemini-cli`

    معرّف نموذج Gemini API الخاص بـ Gemini 3.1 Pro هو `gemini-3.1-pro-preview`. يقبل OpenClaw الصيغة الأقصر `google/gemini-3.1-pro` كاسم مستعار للتيسير ويطبّعها قبل استدعاءات المزوّد.

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو متغيرات `GEMINI_CLI_*`.)

    <Note>
    إذا فشلت طلبات Gemini CLI OAuth بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من أن الأمر المحلي `gemini`
    مثبت وموجود على `PATH`.
    </Note>

    مراجع نماذج `google-gemini-cli/*` هي أسماء مستعارة للتوافق القديم. ينبغي أن تستخدم
    الإعدادات الجديدة مراجع نماذج `google/*` بالإضافة إلى وقت تشغيل `google-gemini-cli`
    عندما تريد تنفيذ Gemini CLI محليًا.

  </Tab>
</Tabs>

## القدرات

| القدرة                 | مدعومة                        |
| ---------------------- | ----------------------------- |
| إكمالات المحادثة       | نعم                           |
| توليد الصور            | نعم                           |
| توليد الموسيقى         | نعم                           |
| تحويل النص إلى كلام    | نعم                           |
| الصوت الفوري           | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| تفريغ الصوت            | نعم                           |
| فهم الفيديو            | نعم                           |
| البحث على الويب (Grounding) | نعم                      |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

## البحث على الويب

يستخدم مزوّد البحث على الويب `gemini` المضمّن تأريض Gemini Google Search.
اضبط مفتاح بحث مخصصًا ضمن `plugins.entries.google.config.webSearch`،
أو دعه يعيد استخدام `models.providers.google.apiKey` بعد `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

أولوية بيانات الاعتماد هي `webSearch.apiKey` المخصص، ثم `GEMINI_API_KEY`،
ثم `models.providers.google.apiKey`. يُعد `webSearch.baseUrl` اختياريًا
وموجودًا لوكلاء المشغلين أو نقاط نهاية Gemini API المتوافقة؛ وعند حذفه،
يعيد بحث الويب في Gemini استخدام `models.providers.google.baseUrl`. راجع
[بحث Gemini](/ar/tools/gemini-search) لمعرفة سلوك الأداة الخاص بالمزوّد.

<Tip>
تستخدم نماذج Gemini 3 `thinkingLevel` بدلًا من `thinkingBudget`. يربط OpenClaw
عناصر تحكم الاستدلال في أسماء Gemini 3 وGemini 3.1 و`gemini-*-latest` المستعارة بـ
`thinkingLevel` حتى لا ترسل عمليات التشغيل الافتراضية/منخفضة زمن الاستجابة قيم
`thinkingBudget` معطّلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي في Google بدلًا من اختيار
مستوى ثابت في OpenClaw. يحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` ثابتة كي
تتمكن Google من اختيار المستوى؛ ويرسل Gemini 2.5 قيمة الحارس الديناميكية من Google
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google لـ Gemma 4.
ضبط التفكير على `off` يبقي التفكير معطّلًا بدلًا من ربطه بـ
`MINIMAL`.
</Tip>

## توليد الصور

يعتمد مزوّد توليد الصور `google` المضمّن افتراضيًا على
`google/gemini-3.1-flash-image-preview`.

- يدعم أيضًا `google/gemini-3-pro-image-preview`
- التوليد: حتى 4 صور لكل طلب
- وضع التحرير: مفعّل، حتى 5 صور إدخال
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
راجع [توليد الصور](/ar/tools/image-generation) لمعرفة معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## توليد الفيديو

يسجّل Google Plugin المضمّن أيضًا توليد الفيديو عبر أداة
`video_generate` المشتركة.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتدفقات مرجع فيديو واحد
- يدعم `aspectRatio` (`16:9` و`9:16`) و`resolution` (`720P` و`1080P`)؛ لا يدعم Veo إخراج الصوت حاليًا
- المدد المدعومة: **4 أو 6 أو 8 ثوانٍ** (تُقرّب القيم الأخرى إلى أقرب قيمة مسموح بها)

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعرفة معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## توليد الموسيقى

يسجّل Google Plugin المضمّن أيضًا توليد الموسيقى عبر أداة
`music_generate` المشتركة.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في الموجه: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- مدخلات مرجعية: حتى 10 صور
- تنفصل عمليات التشغيل المدعومة بالجلسات عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

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
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعرفة معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام `google` المضمّن مسار TTS في Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لأهداف الملاحظات الصوتية، وPCM لـ Talk/الهاتف
- إخراج الملاحظات الصوتية: يُغلّف Google PCM كـ WAV ويُحوّل إلى Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg`

يعيد مسار Gemini TTS الدفعي من Google الصوت المولّد في استجابة
`generateContent` المكتملة. للحصول على محادثات منطوقة بأدنى زمن استجابة، استخدم
مزوّد الصوت الفوري من Google المدعوم بـ Gemini Live API بدلًا من TTS الدفعي.

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

يستخدم Gemini API TTS التوجيه باللغة الطبيعية للتحكم في الأسلوب. اضبط
`audioProfile` لإضافة موجه أسلوب قابل لإعادة الاستخدام قبل النص المنطوق. اضبط
`speakerName` عندما يشير نص الموجه إلى متحدث مسمّى.

يقبل Gemini API TTS أيضًا وسومًا صوتية تعبيرية بين أقواس مربعة في النص،
مثل `[whispers]` أو `[laughs]`. لإبقاء الوسوم خارج رد المحادثة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
يصلح مفتاح Google Cloud Console API المقيد بـ Gemini API لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت الفوري

يسجّل Google Plugin المضمّن مزوّد صوت فوري مدعومًا بـ
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار الإعدادات                                                       | الافتراضي                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| النموذج               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                                |
| درجة الحرارة          | `...google.temperature`                                             | (غير معيّن)                                                                          |
| حساسية بدء VAD        | `...google.startSensitivity`                                        | (غير معيّن)                                                                          |
| حساسية انتهاء VAD     | `...google.endSensitivity`                                          | (غير معيّن)                                                                          |
| مدة الصمت             | `...google.silenceDurationMs`                                       | (غير معيّن)                                                                          |
| معالجة النشاط         | `...google.activityHandling`                                        | افتراضي Google، `start-of-activity-interrupts`                                       |
| تغطية الدور           | `...google.turnCoverage`                                            | افتراضي Google، `only-activity`                                                       |
| تعطيل VAD التلقائي    | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| استئناف الجلسة        | `...google.sessionResumption`                                       | `true`                                                                                |
| ضغط السياق            | `...google.contextWindowCompression`                                | `true`                                                                                |
| مفتاح API             | `...google.apiKey`                                                  | يعود احتياطيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال لإعدادات الوقت الفعلي في Voice Call:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
يوائم OpenClaw صوت جسر الهاتف/Meet مع تدفق Gemini Live API بتنسيق PCM
ويبقي استدعاءات الأدوات على عقد الصوت المشترك في الوقت الفعلي. اترك `temperature`
غير معيّن ما لم تكن تحتاج إلى تغييرات في أخذ العينات؛ إذ يحذف OpenClaw القيم غير الموجبة
لأن Google Live يمكن أن يعيد نصوصًا منسوخة بلا صوت عند `temperature: 0`.
يتم تفعيل النسخ الصوتي في Gemini API بدون `languageCodes`؛ إذ ترفض حزمة SDK الحالية من Google
تلميحات رموز اللغة في مسار API هذا.
</Note>

<Note>
تدعم واجهة Control UI Talk جلسات Google Live في المتصفح باستخدام رموز مقيدة صالحة لاستخدام واحد.
يمكن لموفري الصوت في الوقت الفعلي الخاصين بالخلفية فقط العمل أيضًا عبر نقل الترحيل العام في
Gateway، مما يبقي بيانات اعتماد المزوّد على Gateway.
</Note>

للتحقق المباشر من قِبل المشرفين، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
يغطي اختبار الدخان أيضًا مسارات خلفية OpenAI وWebRTC؛ إذ ينشئ جزء Google شكل رمز Live API
المقيد نفسه الذي تستخدمه Control UI Talk، ويفتح نقطة نهاية WebSocket في المتصفح،
ويرسل حمولة الإعداد الأولية، وينتظر
`setupComplete`.

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    في عمليات تشغيل Gemini API المباشرة (`api: "google-generative-ai"`)، يمرر OpenClaw
    مقبض `cachedContent` المهيّأ إلى طلبات Gemini.

    - هيّئ معاملات على مستوى النموذج أو عالميًا باستخدام
      `cachedContent` أو `cached_content` القديم
    - إذا وُجدا معًا، تكون الأولوية لـ `cachedContent`
    - قيمة مثال: `cachedContents/prebuilt-context`
    - يتم توحيد استخدام إصابة ذاكرة التخزين المؤقت في Gemini إلى `cacheRead` في OpenClaw من
      `cachedContentTokenCount` في المصدر الأعلى

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

  <Accordion title="Gemini CLI JSON usage notes">
    عند استخدام موفّر OAuth ‏`google-gemini-cli`، يوحّد OpenClaw
    مخرجات CLI بصيغة JSON كما يلي:

    - يأتي نص الرد من حقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام احتياطيًا إلى `stats` عندما يترك CLI قيمة `usage` فارغة.
    - يتم توحيد `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    إذا كان Gateway يعمل كخدمة daemon (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Image generation" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Music generation" href="/ar/tools/music-generation" icon="music">
    معاملات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
</CardGroup>
