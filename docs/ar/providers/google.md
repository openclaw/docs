---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، توليد الصور، فهم الوسائط، TTS، بحث الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T08:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

يوفر Plugin الخاص بـ Google إمكانية الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- واجهة API: Google Gemini API
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
    متغيرا البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY` مقبولان كلاهما. استخدم أيهما مهيأ لديك بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI موجود عبر PKCE OAuth بدلا من مفتاح API منفصل.

    <Warning>
    مزوّد `google-gemini-cli` هو تكامل غير رسمي. يبلّغ بعض المستخدمين
    عن قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="تثبيت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحا في `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw تثبيتات Homebrew وتثبيتات npm العالمية، بما في ذلك
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

    معرّف نموذج Gemini API الخاص بـ Gemini 3.1 Pro هو `gemini-3.1-pro-preview`. يقبل OpenClaw الصيغة الأقصر `google/gemini-3.1-pro` كاسم مستعار للتيسير ويطبّعه قبل استدعاءات المزوّد.

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو متغيرات `GEMINI_CLI_*`.)

    <Note>
    إذا فشلت طلبات Gemini CLI OAuth بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء مسار المتصفح، فتأكد من تثبيت الأمر المحلي `gemini`
    ووجوده في `PATH`.
    </Note>

    مراجع نماذج `google-gemini-cli/*` هي أسماء مستعارة للتوافق القديم. ينبغي أن تستخدم
    الإعدادات الجديدة مراجع نماذج `google/*` بالإضافة إلى وقت التشغيل `google-gemini-cli`
    عندما تريد تنفيذ Gemini CLI محليا.

  </Tab>
</Tabs>

## الإمكانات

| الإمكانية              | مدعومة                         |
| ---------------------- | ----------------------------- |
| إكمالات الدردشة        | نعم                           |
| توليد الصور            | نعم                           |
| توليد الموسيقى         | نعم                           |
| تحويل النص إلى كلام    | نعم                           |
| الصوت في الوقت الفعلي  | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| نسخ الصوت              | نعم                           |
| فهم الفيديو            | نعم                           |
| البحث على الويب (Grounding) | نعم                           |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

<Tip>
تستخدم نماذج Gemini 3 `thinkingLevel` بدلا من `thinkingBudget`. يعيّن OpenClaw
عناصر التحكم في الاستدلال لأسماء Gemini 3 وGemini 3.1 و`gemini-*-latest` المستعارة إلى
`thinkingLevel` بحيث لا ترسل التشغيلات الافتراضية/منخفضة الكمون قيما معطلة لـ
`thinkingBudget`.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي الخاصة بـ Google بدلا من اختيار
مستوى OpenClaw ثابت. يحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` ثابتة حتى
تتمكن Google من اختيار المستوى؛ ويرسل Gemini 2.5 الرمز الديناميكي الخاص بـ Google
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (على سبيل المثال `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google لـ Gemma 4.
يحافظ ضبط التفكير على `off` على تعطيل التفكير بدلا من تعيينه إلى
`MINIMAL`.
</Tip>

## توليد الصور

يستخدم مزوّد توليد الصور المضمّن `google` افتراضيا
`google/gemini-3.1-flash-image-preview`.

- يدعم أيضا `google/gemini-3-pro-image-preview`
- التوليد: حتى 4 صور لكل طلب
- وضع التحرير: مفعّل، حتى 5 صور إدخال
- عناصر التحكم في الهندسة: `size` و`aspectRatio` و`resolution`

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
راجع [توليد الصور](/ar/tools/image-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## توليد الفيديو

يسجل Plugin المضمّن `google` أيضا توليد الفيديو عبر أداة
`video_generate` المشتركة.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: نص إلى فيديو، وصورة إلى فيديو، وتدفقات مرجع فيديو واحد
- يدعم `aspectRatio` و`resolution` و`audio`
- حد المدة الحالي: **من 4 إلى 8 ثوان**

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
راجع [توليد الفيديو](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## توليد الموسيقى

يسجل Plugin المضمّن `google` أيضا توليد الموسيقى عبر أداة
`music_generate` المشتركة.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضا `google/lyria-3-pro-preview`
- عناصر التحكم في الطلب: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- إدخالات المرجع: حتى 10 صور
- التشغيلات المدعومة بجلسة تنفصل عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

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
راجع [توليد الموسيقى](/ar/tools/music-generation) للاطلاع على معلمات الأداة المشتركة، واختيار المزوّد، وسلوك تجاوز الفشل.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام المضمّن `google` مسار TTS في Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لأهداف الملاحظات الصوتية، وPCM لـ Talk/telephony
- إخراج الملاحظات الصوتية: يُغلّف Google PCM كـ WAV ويُحوّل ترميزه إلى Opus بتردد 48 kHz باستخدام `ffmpeg`

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

يستخدم Gemini API TTS المطالبات باللغة الطبيعية للتحكم في الأسلوب. اضبط
`audioProfile` لإضافة مطالبة أسلوب قابلة لإعادة الاستخدام قبل النص المنطوق. اضبط
`speakerName` عندما يشير نص المطالبة إلى متحدث مسمّى.

يقبل Gemini API TTS أيضا وسوم صوت تعبيرية بين أقواس مربعة في النص،
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

## الصوت في الوقت الفعلي

يسجل Plugin المضمّن `google` مزوّد صوت في الوقت الفعلي مدعوما بواسطة
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار الإعداد                                                         | الافتراضي                                                                               |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| النموذج               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| الصوت                 | `...google.voice`                                                   | `Kore`                                                                                |
| درجة الحرارة          | `...google.temperature`                                             | (غير مضبوط)                                                                               |
| حساسية بدء VAD        | `...google.startSensitivity`                                        | (غير مضبوط)                                                                               |
| حساسية انتهاء VAD     | `...google.endSensitivity`                                          | (غير مضبوط)                                                                               |
| مدة الصمت             | `...google.silenceDurationMs`                                       | (غير مضبوط)                                                                               |
| معالجة النشاط         | `...google.activityHandling`                                        | افتراضي Google، `start-of-activity-interrupts`                                        |
| تغطية الدور           | `...google.turnCoverage`                                            | افتراضي Google، `only-activity`                                                       |
| تعطيل VAD التلقائي    | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| مفتاح API             | `...google.apiKey`                                                  | يعود احتياطيا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على إعداد Voice Call في الوقت الفعلي:

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
يكيّف OpenClaw صوت جسر الاتصالات الهاتفية/Meet مع تدفق Gemini PCM Live API، ويحافظ
على استدعاءات الأدوات ضمن عقد الصوت الفوري المشترك. اترك `temperature`
غير معيّن ما لم تكن بحاجة إلى تغييرات في أخذ العينات؛ يحذف OpenClaw القيم غير الإيجابية
لأن Google Live قد تُرجع نُسخًا نصية دون صوت عند `temperature: 0`.
يتم تفعيل النسخ النصي في Gemini API دون `languageCodes`؛ إذ يرفض Google
SDK الحالي تلميحات رموز اللغة في مسار API هذا.
</Note>

<Note>
يدعم Control UI Talk جلسات Google Live في المتصفح باستخدام رموز مقيّدة صالحة
لاستخدام واحد. يمكن لمزوّدي الصوت الفوري العاملين في الخلفية فقط العمل أيضًا عبر
نقل ترحيل Gateway العام، والذي يُبقي بيانات اعتماد المزوّد على Gateway.
</Note>

للتحقق الحي الخاص بالمشرفين، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
ينشئ مسار Google شكل رمز Live API المقيّد نفسه المستخدم بواسطة Control
UI Talk، ويفتح نقطة نهاية WebSocket في المتصفح، ويرسل حمولة الإعداد الأولية،
وينتظر `setupComplete`.

## الإعدادات المتقدمة

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    بالنسبة إلى تشغيلات Gemini API المباشرة (`api: "google-generative-ai"`)، يمرّر OpenClaw
    مقبض `cachedContent` مضبوطًا إلى طلبات Gemini.

    - اضبط المعلمات لكل نموذج أو على مستوى عام باستخدام إما
      `cachedContent` أو `cached_content` القديم
    - إذا كان كلاهما موجودًا، تكون الأولوية لـ `cachedContent`
    - قيمة مثال: `cachedContents/prebuilt-context`
    - يتم تطبيع استخدام إصابة ذاكرة التخزين المؤقت في Gemini إلى `cacheRead` في OpenClaw من
      `cachedContentTokenCount` الصادر من المصدر الأعلى

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
    عند استخدام موفّر OAuth الخاص بـ `google-gemini-cli`، يطبّع OpenClaw
    خرج JSON الخاص بـ CLI كما يلي:

    - يأتي نص الرد من حقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - يتم تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يستنتج OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    إذا كان Gateway يعمل كعملية خفية (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Image generation" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="Music generation" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
</CardGroup>
