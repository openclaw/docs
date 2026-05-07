---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، توليد الصور، فهم الوسائط، TTS، البحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-07T13:28:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9344307c0f20bf09d330ed82b8ffbd4dfa2592c869eb049c46191caa3ca141e
    source_path: providers/google.md
    workflow: 16
---

يوفر Plugin Google وصولًا إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث عبر الويب من خلال
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: Google Gemini API
- خيار وقت التشغيل: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  يعيد استخدام Gemini CLI OAuth مع إبقاء مراجع النماذج معيارية بصيغة `google/*`.

## بدء الاستخدام

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل لـ:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

    <Steps>
      <Step title="تشغيل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        أو مرّر المفتاح مباشرة:

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
    يُقبل كل من متغيرَي البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY`. استخدم أيهما سبق أن أعددته.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI قائم عبر PKCE OAuth بدلًا من مفتاح API منفصل.

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

        يدعم OpenClaw كلًا من تثبيتات Homebrew والتثبيتات العامة عبر npm، بما في ذلك
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

    معرّف نموذج Gemini 3.1 Pro في Gemini API هو `gemini-3.1-pro-preview`. يقبل OpenClaw الصيغة الأقصر `google/gemini-3.1-pro` كاسم مستعار لتسهيل الاستخدام، ويطبّعها قبل استدعاءات المزوّد.

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو صيغ `GEMINI_CLI_*`.)

    <Note>
    إذا فشلت طلبات Gemini CLI OAuth بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من تثبيت الأمر المحلي `gemini`
    ووجوده على `PATH`.
    </Note>

    مراجع نماذج `google-gemini-cli/*` هي أسماء مستعارة للتوافق القديم. يجب أن تستخدم
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
| الصوت في الوقت الفعلي  | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| نسخ الصوت              | نعم                           |
| فهم الفيديو            | نعم                           |
| البحث عبر الويب (Grounding) | نعم                      |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

## البحث عبر الويب

يستخدم مزوّد البحث عبر الويب `gemini` المضمّن إرساء Gemini Google Search.
اضبط مفتاح بحث مخصصًا تحت `plugins.entries.google.config.webSearch`،
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
وهو موجود لوكلاء المشغّلين أو نقاط نهاية Gemini API المتوافقة؛ وعند حذفه،
يعيد بحث الويب في Gemini استخدام `models.providers.google.baseUrl`. راجع
[بحث Gemini](/ar/tools/gemini-search) لمعرفة سلوك الأداة الخاص بالمزوّد.

<Tip>
تستخدم نماذج Gemini 3 `thinkingLevel` بدلًا من `thinkingBudget`. يربط OpenClaw
عناصر تحكم الاستدلال في Gemini 3 وGemini 3.1 والأسماء المستعارة `gemini-*-latest` إلى
`thinkingLevel` حتى لا ترسل عمليات التشغيل الافتراضية/منخفضة زمن الاستجابة قيم
`thinkingBudget` معطّلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي من Google بدلًا من اختيار
مستوى OpenClaw ثابت. يحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` ثابتة حتى
تتمكن Google من اختيار المستوى؛ ويرسل Gemini 2.5 علامة Google الديناميكية الخاصة
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google لـ Gemma 4.
يحافظ تعيين التفكير إلى `off` على تعطيل التفكير بدلًا من ربطه بـ
`MINIMAL`.
</Tip>

## توليد الصور

يضبط مزوّد توليد الصور `google` المضمّن القيمة الافتراضية إلى
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

يسجّل Plugin `google` المضمّن أيضًا توليد الفيديو عبر أداة
`video_generate` المشتركة.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: من نص إلى فيديو، ومن صورة إلى فيديو، وتدفقات مرجع فيديو واحد
- يدعم `aspectRatio` و`resolution` و`audio`
- حد المدة الحالي: **من 4 إلى 8 ثوانٍ**

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

يسجّل Plugin `google` المضمّن أيضًا توليد الموسيقى عبر أداة
`music_generate` المشتركة.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر تحكم الموجه: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- إدخالات المرجع: حتى 10 صور
- تنفصل عمليات التشغيل المدعومة بجلسة عبر تدفق المهام/الحالة المشترك، بما في ذلك `action: "status"`

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

يستخدم مزوّد الكلام `google` المضمّن مسار Gemini API TTS مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لأهداف الملاحظات الصوتية، وPCM للمحادثة/الهاتف
- إخراج الملاحظات الصوتية: يُغلّف Google PCM كـ WAV ويُحوّل ترميزه إلى Opus بتردد 48 kHz باستخدام `ffmpeg`

يعيد مسار Gemini TTS الدفعي من Google الصوت المولّد في استجابة
`generateContent` المكتملة. لأقل زمن استجابة في المحادثات المنطوقة، استخدم
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

يستخدم Gemini API TTS التوجيه باللغة الطبيعية للتحكم في الأسلوب. عيّن
`audioProfile` لإضافة موجه أسلوب قابل لإعادة الاستخدام قبل النص المنطوق. عيّن
`speakerName` عندما يشير نص الموجه إلى متحدث مسمّى.

يقبل Gemini API TTS أيضًا وسومًا صوتية تعبيرية بين أقواس مربعة في النص،
مثل `[whispers]` أو `[laughs]`. لإبقاء الوسوم خارج رد المحادثة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
مفتاح Google Cloud Console API المقيّد بـ Gemini API صالح لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت في الوقت الفعلي

يسجّل Plugin `google` المضمّن مزوّد صوت في الوقت الفعلي مدعومًا بـ
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار التكوين                                                         | الافتراضي                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| النموذج                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                                |
| درجة الحرارة           | `...google.temperature`                                             | (غير معيّن)                                                                               |
| حساسية بدء VAD | `...google.startSensitivity`                                        | (غير معيّن)                                                                               |
| حساسية انتهاء VAD   | `...google.endSensitivity`                                          | (غير معيّن)                                                                               |
| مدة الصمت      | `...google.silenceDurationMs`                                       | (غير معيّن)                                                                               |
| معالجة النشاط     | `...google.activityHandling`                                        | افتراضي Google، `start-of-activity-interrupts`                                        |
| تغطية الدور         | `...google.turnCoverage`                                            | افتراضي Google، `only-activity`                                                       |
| تعطيل VAD التلقائي      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| استئناف الجلسة    | `...google.sessionResumption`                                       | `true`                                                                                |
| ضغط السياق   | `...google.contextWindowCompression`                                | `true`                                                                                |
| مفتاح API               | `...google.apiKey`                                                  | يرجع احتياطيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على تكوين المكالمات الصوتية الآنية:

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
تستخدم Google Live API الصوت ثنائي الاتجاه واستدعاء الدوال عبر WebSocket.
يوائم OpenClaw صوت جسر الهاتف/Meet مع تدفق PCM Live API في Gemini ويحافظ
على استدعاءات الأدوات ضمن عقد الصوت الآني المشترك. اترك `temperature`
غير معيّن ما لم تكن بحاجة إلى تغييرات في أخذ العينات؛ يحذف OpenClaw القيم غير الموجبة
لأن Google Live يمكن أن يعيد نصوصًا منسوخة دون صوت عند `temperature: 0`.
يتم تمكين النسخ في Gemini API دون `languageCodes`؛ يرفض SDK الحالي من Google
تلميحات رموز اللغة في مسار API هذا.
</Note>

<Note>
يدعم Control UI Talk جلسات متصفح Google Live باستخدام رموز مقيّدة صالحة لاستخدام واحد.
ويمكن لمزوّدي الصوت الآني المخصصين للواجهة الخلفية فقط أن يعملوا أيضًا عبر نقل الترحيل العام في
Gateway، مما يبقي بيانات اعتماد المزوّد على Gateway.
</Note>

للتحقق الحي من جانب المشرف، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
ينشئ مسار Google نفس شكل رمز Live API المقيّد المستخدم من Control
UI Talk، ويفتح نقطة نهاية WebSocket في المتصفح، ويرسل حمولة الإعداد الأولية،
وينتظر `setupComplete`.

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة Gemini المؤقتة مباشرة">
    عند تشغيل Gemini API مباشرة (`api: "google-generative-ai"`)، يمرر OpenClaw
    مقبض `cachedContent` المكوّن إلى طلبات Gemini.

    - كوّن المعاملات لكل نموذج أو عالميًا باستخدام إما
      `cachedContent` أو `cached_content` القديم
    - إذا وُجدا معًا، يفوز `cachedContent`
    - قيمة مثال: `cachedContents/prebuilt-context`
    - يتم توحيد استخدام إصابة ذاكرة Gemini المؤقتة في OpenClaw `cacheRead` من
      `cachedContentTokenCount` الصادر من المنبع

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

  <Accordion title="ملاحظات استخدام JSON في Gemini CLI">
    عند استخدام مزوّد OAuth `google-gemini-cli`، يطبّع OpenClaw
    مخرجات JSON الخاصة بـ CLI كما يلي:

    - يأتي نص الرد من حقل JSON في CLI المسمى `response`.
    - يرجع الاستخدام احتياطيًا إلى `stats` عندما يترك CLI حقل `usage` فارغًا.
    - يتم توحيد `stats.cached` في OpenClaw `cacheRead`.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة الخفية">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لذلك المسار (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك الانتقال عند الفشل.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الموسيقى" href="/ar/tools/music-generation" icon="music">
    معاملات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
</CardGroup>
