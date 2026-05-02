---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، إنشاء الصور، فهم الوسائط، TTS، بحث الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-02T07:39:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14605b88f0d1d7e01796d429113a73b2b52a48fde6443565dcb3db47653be5e7
    source_path: providers/google.md
    workflow: 16
---

يوفّر Plugin Google وصولًا إلى نماذج Gemini عبر Google AI Studio، إضافةً إلى
توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، وبحث الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: Google Gemini API
- خيار وقت التشغيل: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  يعيد استخدام OAuth الخاص بـ Gemini CLI مع إبقاء مراجع النماذج معيارية بصيغة `google/*`.

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
    يتم قبول متغيري البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY`. استخدم أيهما مهيأ لديك بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI موجود عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    مزوّد `google-gemini-cli` هو تكامل غير رسمي. يبلغ بعض المستخدمين
    عن قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك.
    </Warning>

    <Steps>
      <Step title="تثبيت Gemini CLI">
        يجب أن يكون أمر `gemini` المحلي متاحًا على `PATH`.

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
    - الاسم البديل: `gemini-cli`

    معرّف نموذج Gemini API الخاص بـ Gemini 3.1 Pro هو `gemini-3.1-pro-preview`. يقبل OpenClaw الصيغة الأقصر `google/gemini-3.1-pro` كاسم بديل للتسهيل ويطبّعها قبل استدعاءات المزوّد.

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو صيغ `GEMINI_CLI_*`.)

    <Note>
    إذا فشلت طلبات OAuth الخاصة بـ Gemini CLI بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من تثبيت أمر `gemini`
    المحلي ومن وجوده على `PATH`.
    </Note>

    مراجع نماذج `google-gemini-cli/*` هي أسماء بديلة للتوافق القديم. يجب أن تستخدم
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
| بحث الويب (Grounding)  | نعم                           |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

## بحث الويب

يستخدم مزوّد بحث الويب `gemini` المضمّن إسناد Gemini Google Search.
هيّئ مفتاح بحث مخصصًا ضمن `plugins.entries.google.config.webSearch`،
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

أسبقية بيانات الاعتماد هي `webSearch.apiKey` المخصص، ثم `GEMINI_API_KEY`،
ثم `models.providers.google.apiKey`. الحقل `webSearch.baseUrl` اختياري و
موجود لوكلاء المشغّلين أو نقاط نهاية Gemini API المتوافقة؛ عند حذفه،
يعيد بحث الويب في Gemini استخدام `models.providers.google.baseUrl`. راجع
[بحث Gemini](/ar/tools/gemini-search) لمعرفة سلوك الأداة الخاص بالمزوّد.

<Tip>
تستخدم نماذج Gemini 3 `thinkingLevel` بدلًا من `thinkingBudget`. يربط OpenClaw
عناصر التحكم في الاستدلال للنماذج Gemini 3 وGemini 3.1 وأسماء `gemini-*-latest`
البديلة إلى `thinkingLevel` حتى لا ترسل عمليات التشغيل الافتراضية/منخفضة الكمون
قيم `thinkingBudget` معطلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي في Google بدلًا من اختيار
مستوى OpenClaw ثابت. يحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` ثابتة حتى
تتمكن Google من اختيار المستوى؛ يرسل Gemini 2.5 قيمة Google الديناميكية الخاصة
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google لـ Gemma 4.
يحافظ تعيين التفكير إلى `off` على تعطيل التفكير بدلًا من ربطه إلى
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
- الأوضاع: من النص إلى الفيديو، ومن الصورة إلى الفيديو، وتدفقات مرجع فيديو واحد
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
- عناصر التحكم في الموجه: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- مدخلات مرجعية: حتى 10 صور
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

يستخدم مزوّد الكلام `google` المضمّن مسار TTS الخاص بـ Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لأهداف الملاحظات الصوتية، وPCM لـ Talk/الاتصالات الهاتفية
- إخراج الملاحظات الصوتية: يتم تغليف Google PCM كـ WAV وتحويل ترميزه إلى Opus بتردد 48 kHz باستخدام `ffmpeg`

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
مثل `[whispers]` أو `[laughs]`. لإبقاء الوسوم خارج رد الدردشة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
يكون مفتاح Google Cloud Console API المقيد بـ Gemini API صالحًا لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت الفوري

يسجّل Plugin `google` المضمّن مزوّد صوت فوري مدعومًا من
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار التكوين                                                        | القيمة الافتراضية                                                                    |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| النموذج               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                                |
| درجة الحرارة          | `...google.temperature`                                             | (غير معيّن)                                                                           |
| حساسية بدء VAD        | `...google.startSensitivity`                                        | (غير معيّن)                                                                           |
| حساسية انتهاء VAD     | `...google.endSensitivity`                                          | (غير معيّن)                                                                           |
| مدة الصمت             | `...google.silenceDurationMs`                                       | (غير معيّن)                                                                           |
| معالجة النشاط         | `...google.activityHandling`                                        | القيمة الافتراضية من Google، `start-of-activity-interrupts`                           |
| تغطية الدور           | `...google.turnCoverage`                                            | القيمة الافتراضية من Google، `only-activity`                                          |
| تعطيل VAD التلقائي    | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| مفتاح API             | `...google.apiKey`                                                  | يرجع احتياطيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على تكوين Voice Call للوقت الحقيقي:

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
يكيف OpenClaw صوت جسر الاتصالات الهاتفية/Meet مع تدفق Gemini PCM Live API
ويبقي استدعاءات الأدوات ضمن عقد الصوت المشترك للوقت الحقيقي. اترك `temperature`
غير معيّن ما لم تكن بحاجة إلى تغييرات في أخذ العينات؛ إذ يحذف OpenClaw القيم غير الموجبة
لأن Google Live يمكن أن يعيد نصوصًا مكتوبة بدون صوت عند `temperature: 0`.
يتم تفعيل النسخ النصي عبر Gemini API بدون `languageCodes`؛ ترفض
SDK الحالية من Google تلميحات رموز اللغة في مسار API هذا.
</Note>

<Note>
يدعم Control UI Talk جلسات متصفح Google Live برموز مقيّدة للاستخدام مرة واحدة.
يمكن أيضًا لمزوّدي الصوت للوقت الحقيقي المخصصين للخلفية فقط العمل عبر نقل الترحيل العام في
Gateway، والذي يبقي بيانات اعتماد المزوّد على Gateway.
</Note>

للتحقق الحي من قِبل المشرف، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
ينشئ مسار Google نفس شكل رمز Live API المقيّد المستخدم بواسطة Control
UI Talk، ويفتح نقطة نهاية WebSocket في المتصفح، ويرسل حمولة الإعداد الأولية،
وينتظر `setupComplete`.

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة Gemini المؤقتة المباشرة">
    عند تشغيل Gemini API مباشرةً (`api: "google-generative-ai"`)، يمرر OpenClaw
    مقبض `cachedContent` المكوّن إلى طلبات Gemini.

    - كوّن معاملات خاصة بكل نموذج أو عامة باستخدام إما
      `cachedContent` أو `cached_content` القديم
    - إذا كان كلاهما موجودًا، فإن `cachedContent` تكون لها الأولوية
    - قيمة مثال: `cachedContents/prebuilt-context`
    - يتم تطبيع استخدام إصابة ذاكرة Gemini المؤقتة إلى `cacheRead` في OpenClaw من
      `cachedContentTokenCount` الصادر من المصدر upstream

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
    مخرجات CLI بصيغة JSON كما يلي:

    - يأتي نص الرد من حقل `response` في JSON الخاص بـ CLI.
    - يرجع الاستخدام احتياطيًا إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - يتم تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والبرنامج الخفي">
    إذا كان Gateway يعمل كبرنامج خفي (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
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
