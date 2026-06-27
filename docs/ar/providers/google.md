---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، توليد الصور، فهم الوسائط، TTS، البحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T18:25:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

يوفر Plugin Google إمكانية الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الواجهة البرمجية: Google Gemini API
- خيار التشغيل: المزوّد/النموذج `agentRuntime.id: "google-gemini-cli"`
  يعيد استخدام OAuth الخاص بـ Gemini CLI مع إبقاء مراجع النماذج معيارية بصيغة `google/*`.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="API key">
    **الأفضل لـ:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    كلا متغيري البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY` مقبولان. استخدم أيهما مهيأ لديك بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI قائم عبر OAuth باستخدام PKCE بدلًا من مفتاح API منفصل.

    <Warning>
    مزوّد `google-gemini-cli` تكامل غير رسمي. يبلّغ بعض المستخدمين
    عن قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        يجب أن يكون أمر `gemini` المحلي متاحًا على `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw تثبيتات Homebrew وتثبيتات npm العامة، بما في ذلك
        تخطيطات Windows/npm الشائعة.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - النموذج الافتراضي: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - الاسم البديل: `gemini-cli`

    معرّف نموذج Gemini 3.1 Pro في Gemini API هو `gemini-3.1-pro-preview`. يقبل OpenClaw الصيغة الأقصر `google/gemini-3.1-pro` كاسم بديل ملائم ويطبعها قبل استدعاءات المزوّد.

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
    المحلي ووجوده على `PATH`.
    </Note>

    مراجع نماذج `google-gemini-cli/*` أسماء بديلة للتوافق القديم. ينبغي أن تستخدم
    الإعدادات الجديدة مراجع نماذج `google/*` مع Runtime
    `google-gemini-cli` عندما تريد تنفيذ Gemini CLI محليًا.

  </Tab>
</Tabs>

## الإمكانات

| الإمكانية              | مدعومة                       |
| ---------------------- | ----------------------------- |
| إكمالات الدردشة        | نعم                           |
| توليد الصور            | نعم                           |
| توليد الموسيقى         | نعم                           |
| تحويل النص إلى كلام    | نعم                           |
| الصوت الفوري           | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| نسخ الصوت              | نعم                           |
| فهم الفيديو            | نعم                           |
| بحث الويب (Grounding)  | نعم                           |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

## بحث الويب

يستخدم مزوّد بحث الويب `gemini` المضمن تأريض Gemini Google Search.
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
ثم `models.providers.google.apiKey`. يُعد `webSearch.baseUrl` اختياريًا
وهو موجود لوكلاء المشغّل أو نقاط نهاية Gemini API المتوافقة؛ عند حذفه،
يعيد بحث الويب في Gemini استخدام `models.providers.google.baseUrl`. راجع
[بحث Gemini](/ar/tools/gemini-search) لمعرفة سلوك الأداة الخاص بالمزوّد.

<Tip>
تستخدم نماذج Gemini 3 `thinkingLevel` بدلًا من `thinkingBudget`. يربط OpenClaw
عناصر تحكم الاستدلال في Gemini 3 وGemini 3.1 وأسماء `gemini-*-latest` البديلة
بـ `thinkingLevel` حتى لا ترسل التشغيلات الافتراضية/منخفضة التأخير
قيم `thinkingBudget` معطلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي في Google بدلًا من اختيار
مستوى OpenClaw ثابت. يحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` ثابتة حتى
تستطيع Google اختيار المستوى؛ ويرسل Gemini 2.5 sentinel الديناميكي من Google:
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google لـ Gemma 4.
يؤدي ضبط التفكير على `off` إلى إبقاء التفكير معطلًا بدلًا من ربطه بـ
`MINIMAL`.
</Tip>

## توليد الصور

يعتمد مزوّد توليد الصور `google` المضمن افتراضيًا على
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
راجع [توليد الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## توليد الفيديو

يسجل Plugin `google` المضمن أيضًا توليد الفيديو عبر أداة
`video_generate` المشتركة.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، وتدفقات مرجع الفيديو الواحد
- يدعم `aspectRatio` (`16:9`، `9:16`) و`resolution` (`720P`، `1080P`)؛ إخراج الصوت غير مدعوم في Veo حاليًا
- المدد المدعومة: **4 أو 6 أو 8 ثوانٍ** (تُقرَّب القيم الأخرى إلى أقرب قيمة مسموحة)

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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## توليد الموسيقى

يسجل Plugin `google` المضمن أيضًا توليد الموسيقى عبر أداة
`music_generate` المشتركة.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر تحكم المطالبة: `lyrics` و`instrumental`
- صيغة الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- إدخالات المراجع: حتى 10 صور
- تنفصل التشغيلات المدعومة بالجلسة عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

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
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام `google` المضمن مسار TTS في Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لأهداف الملاحظات الصوتية، وPCM لـ Talk/الاتصالات الهاتفية
- إخراج الملاحظات الصوتية: يُغلَّف Google PCM كـ WAV ويُحوَّل إلى Opus بتردد 48 kHz باستخدام `ffmpeg`

يعيد مسار Gemini TTS الدفعي في Google الصوت المولّد في استجابة
`generateContent` المكتملة. للمحادثات المنطوقة بأدنى زمن تأخير، استخدم
مزوّد الصوت الفوري في Google المدعوم بـ Gemini Live API بدلًا من TTS الدفعي.

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

يستخدم Gemini API TTS المطالبة باللغة الطبيعية للتحكم في الأسلوب. عيّن
`audioProfile` لإضافة مطالبة أسلوب قابلة لإعادة الاستخدام قبل النص المنطوق. عيّن
`speakerName` عندما يشير نص المطالبة إلى متحدث مسمّى.

يقبل Gemini API TTS أيضًا وسوم صوت تعبيرية بين أقواس مربعة في النص،
مثل `[whispers]` أو `[laughs]`. لإبقاء الوسوم خارج رد الدردشة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
مفتاح API من Google Cloud Console مقيّد بـ Gemini API صالح لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت الفوري

يسجل Plugin `google` المضمن مزوّد صوت فوري مدعومًا بـ
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار الإعداد                                                        | الافتراضي                                                                            |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| النموذج               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                                |
| درجة الحرارة          | `...google.temperature`                                             | (غير مضبوط)                                                                          |
| حساسية بدء VAD        | `...google.startSensitivity`                                        | (غير مضبوط)                                                                          |
| حساسية انتهاء VAD     | `...google.endSensitivity`                                          | (غير مضبوط)                                                                          |
| مدة الصمت             | `...google.silenceDurationMs`                                       | (غير مضبوط)                                                                          |
| معالجة النشاط         | `...google.activityHandling`                                        | إعداد Google الافتراضي، `start-of-activity-interrupts`                                |
| تغطية الدور           | `...google.turnCoverage`                                            | إعداد Google الافتراضي، `only-activity`                                               |
| تعطيل VAD التلقائي    | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| استئناف الجلسة        | `...google.sessionResumption`                                       | `true`                                                                                |
| ضغط السياق            | `...google.contextWindowCompression`                                | `true`                                                                                |
| مفتاح API             | `...google.apiKey`                                                  | يعود احتياطيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على إعداد مكالمة صوتية في الوقت الفعلي:

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
                speakerVoice: "Kore",
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
يكيّف OpenClaw صوت جسر الهاتف/Meet مع دفق PCM Live API الخاص بـ Gemini
ويُبقي استدعاءات الأدوات على عقد الصوت المشترك في الوقت الفعلي. اترك `temperature`
غير مضبوط ما لم تحتج إلى تغييرات في أخذ العينات؛ إذ يحذف OpenClaw القيم غير الموجبة
لأن Google Live قد يعيد نصوصًا منسوخة بدون صوت عند `temperature: 0`.
يُفعَّل النسخ عبر Gemini API بدون `languageCodes`؛ إذ يرفض Google
SDK الحالي تلميحات رموز اللغة على مسار API هذا.
</Note>

<Note>
يدعم Control UI Talk جلسات Google Live في المتصفح باستخدام رموز مقيدة صالحة للاستخدام مرة واحدة.
يمكن أيضًا لموفري الصوت في الوقت الفعلي الخاصين بالخلفية فقط العمل عبر نقل الترحيل العام في
Gateway، والذي يُبقي بيانات اعتماد الموفر على Gateway.
</Note>

للتحقق المباشر الخاص بالمشرفين، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
يغطي اختبار الدخان أيضًا مسارات خلفية OpenAI/WebRTC؛ وينشئ جزء Google شكل رمز Live API
المقيد نفسه المستخدم بواسطة Control UI Talk، ويفتح نقطة نهاية WebSocket في المتصفح،
ويرسل حمولة الإعداد الأولية، وينتظر
`setupComplete`.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    بالنسبة إلى تشغيلات Gemini API المباشرة (`api: "google-generative-ai"`)، يمرر OpenClaw
    مقبض `cachedContent` مضبوطًا إلى طلبات Gemini.

    - اضبط معلمات لكل نموذج أو عامة باستخدام إما
      `cachedContent` أو `cached_content` القديم
    - إذا وُجدا معًا، تكون الأولوية لـ `cachedContent`
    - قيمة مثال: `cachedContents/prebuilt-context`
    - يُطبَّع استخدام إصابة ذاكرة التخزين المؤقت في Gemini إلى `cacheRead` في OpenClaw من
      `cachedContentTokenCount` الوارد من المنبع

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

  <Accordion title="Gemini CLI usage notes">
    عند استخدام موفر OAuth `google-gemini-cli`، يستخدم OpenClaw مخرجات Gemini
    CLI `stream-json` افتراضيًا ويطبّع الاستخدام من حمولة `stats` النهائية.
    ما زالت تجاوزات `--output-format json` القديمة تستخدم محلل JSON.

    - يأتي نص الرد المتدفق من أحداث `message` الخاصة بالمساعد.
    - بالنسبة إلى مخرجات JSON القديمة، يأتي نص الرد من حقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام احتياطيًا إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - يُطبَّع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Image generation" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفر.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفر.
  </Card>
  <Card title="Music generation" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار الموفر.
  </Card>
</CardGroup>
