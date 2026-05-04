---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، إنشاء الصور، فهم الوسائط، TTS، البحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T07:09:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

يوفر Plugin الخاص بـ Google وصولًا إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: Google Gemini API
- خيار وقت التشغيل: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  يعيد استخدام Gemini CLI OAuth مع إبقاء مراجع النماذج قياسية بصيغة `google/*`.

## البدء

اختر طريقة المصادقة التي تفضلها واتبع خطوات الإعداد.

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
    يتم قبول متغيري البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY`. استخدم أيهما سبق أن أعددته.
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

        يدعم OpenClaw تثبيتات Homebrew وتثبيتات npm العامة، بما في ذلك
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
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من تثبيت الأمر المحلي `gemini`
    وأنه موجود على `PATH`.
    </Note>

    مراجع نماذج `google-gemini-cli/*` هي أسماء مستعارة قديمة للتوافق. ينبغي أن تستخدم
    الإعدادات الجديدة مراجع نماذج `google/*` مع وقت تشغيل `google-gemini-cli`
    عندما تريد تنفيذ Gemini CLI محليًا.

  </Tab>
</Tabs>

## القدرات

| القدرة                 | مدعومة                        |
| ---------------------- | ----------------------------- |
| إكمالات الدردشة        | نعم                           |
| توليد الصور            | نعم                           |
| توليد الموسيقى         | نعم                           |
| تحويل النص إلى كلام    | نعم                           |
| الصوت الآني            | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| نسخ الصوت              | نعم                           |
| فهم الفيديو            | نعم                           |
| البحث على الويب (Grounding) | نعم                      |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

## البحث على الويب

يستخدم مزوّد بحث الويب `gemini` المضمّن تأصيل Gemini Google Search.
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

أسبقية بيانات الاعتماد هي `webSearch.apiKey` المخصص، ثم `GEMINI_API_KEY`،
ثم `models.providers.google.apiKey`. الحقل `webSearch.baseUrl` اختياري
وموجود لوكلاء التشغيل أو نقاط نهاية Gemini API المتوافقة؛ عند حذفه،
يعيد بحث الويب في Gemini استخدام `models.providers.google.baseUrl`. راجع
[بحث Gemini](/ar/tools/gemini-search) لمعرفة سلوك الأداة الخاص بالمزوّد.

<Tip>
تستخدم نماذج Gemini 3 الحقل `thinkingLevel` بدلًا من `thinkingBudget`. يربط OpenClaw
عناصر التحكم في الاستدلال لأسماء Gemini 3 وGemini 3.1 والأسماء المستعارة `gemini-*-latest`
إلى `thinkingLevel` حتى لا ترسل عمليات التشغيل الافتراضية/منخفضة الكمون قيم
`thinkingBudget` معطلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي لدى Google بدلًا من اختيار
مستوى OpenClaw ثابت. يحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` ثابتة حتى
تستطيع Google اختيار المستوى؛ بينما يرسل Gemini 2.5 القيمة الديناميكية الخاصة بـ Google
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google لـ Gemma 4.
تعيين التفكير إلى `off` يبقي التفكير معطلًا بدلًا من ربطه إلى
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

يسجل Plugin `google` المضمّن أيضًا توليد الفيديو عبر أداة
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

يسجل Plugin `google` المضمّن أيضًا توليد الموسيقى عبر أداة
`music_generate` المشتركة.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في الموجه: `lyrics` و`instrumental`
- صيغة الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- مدخلات مرجعية: حتى 10 صور
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
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعرفة معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام `google` المضمّن مسار Gemini API TTS مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لأهداف الملاحظات الصوتية، وPCM لـ Talk/الاتصالات الهاتفية
- إخراج الملاحظة الصوتية: يتم تغليف Google PCM كـ WAV وتحويل ترميزه إلى Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg`

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
`speakerName` عندما يشير نص الموجه إلى متحدث مسمى.

يقبل Gemini API TTS أيضًا وسومًا صوتية تعبيرية بين أقواس مربعة داخل النص،
مثل `[whispers]` أو `[laughs]`. لإبقاء الوسوم خارج رد الدردشة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
مفتاح Google Cloud Console API المقيّد بـ Gemini API صالح لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت الآني

يسجل Plugin `google` المضمّن مزوّد صوت آنيًا مدعومًا من
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار التهيئة                                                         | القيمة الافتراضية                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| النموذج                 | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                                |
| درجة الحرارة           | `...google.temperature`                                             | (غير معيّنة)                                                                               |
| حساسية بدء VAD | `...google.startSensitivity`                                        | (غير معيّنة)                                                                               |
| حساسية انتهاء VAD   | `...google.endSensitivity`                                          | (غير معيّنة)                                                                               |
| مدة الصمت      | `...google.silenceDurationMs`                                       | (غير معيّنة)                                                                               |
| معالجة النشاط     | `...google.activityHandling`                                        | القيمة الافتراضية من Google، `start-of-activity-interrupts`                                        |
| تغطية الدور         | `...google.turnCoverage`                                            | القيمة الافتراضية من Google، `only-activity`                                                       |
| تعطيل VAD التلقائي      | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| استئناف الجلسة    | `...google.sessionResumption`                                       | `true`                                                                                |
| ضغط السياق   | `...google.contextWindowCompression`                                | `true`                                                                                |
| مفتاح API               | `...google.apiKey`                                                  | يعود احتياطيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على تهيئة Voice Call في الوقت الحقيقي:

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
يوائم OpenClaw صوت جسر الاتصالات الهاتفية/Meet مع تدفق Gemini PCM Live API
ويُبقي استدعاءات الأدوات على عقد الصوت المشترك في الوقت الحقيقي. اترك `temperature`
غير معيّن ما لم تكن تحتاج إلى تغييرات في أخذ العينات؛ إذ يحذف OpenClaw القيم غير الموجبة
لأن Google Live قد تُرجع نصوصًا منسوخة من دون صوت عند `temperature: 0`.
يتم تمكين النسخ في Gemini API من دون `languageCodes`؛ إذ ترفض حزمة SDK الحالية من Google
تلميحات رموز اللغة على مسار API هذا.
</Note>

<Note>
تدعم واجهة Control UI Talk جلسات Google Live في المتصفح باستخدام رموز مقيّدة صالحة للاستخدام مرة واحدة.
ويمكن أيضًا لمزوّدي الصوت في الوقت الحقيقي المخصصين للخلفية فقط العمل عبر
نقل الترحيل العام في Gateway، ما يُبقي بيانات اعتماد المزوّد على Gateway.
</Note>

للتحقق المباشر الخاص بالمشرفين، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
ينشئ مسار Google الشكل نفسه لرمز Live API المقيّد الذي تستخدمه Control
UI Talk، ويفتح نقطة نهاية WebSocket في المتصفح، ويرسل حمولة الإعداد الأولية،
وينتظر `setupComplete`.

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة التخزين المؤقت المباشرة في Gemini">
    عند تشغيل Gemini API مباشرة (`api: "google-generative-ai"`)، يمرّر OpenClaw
    معالج `cachedContent` المهيأ إلى طلبات Gemini.

    - هيّئ معاملات لكل نموذج أو معاملات عامة باستخدام
      `cachedContent` أو `cached_content` القديم
    - إذا كان كلاهما موجودًا، تكون الأولوية لـ `cachedContent`
    - قيمة مثال: `cachedContents/prebuilt-context`
    - يتم توحيد استخدام إصابات ذاكرة التخزين المؤقت في Gemini إلى `cacheRead` في OpenClaw من
      `cachedContentTokenCount` الصاعد

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
    عند استخدام موفّر OAuth `google-gemini-cli`، يطبّع OpenClaw
    مخرجات CLI بصيغة JSON كما يلي:

    - يأتي نص الرد من حقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام احتياطيًا إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - يتم توحيد `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والبرنامج الخفي">
    إذا كان Gateway يعمل كبرنامج خفي (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معاملات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معاملات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معاملات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
</CardGroup>
