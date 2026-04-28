---
read_when:
    - أنت تريد استخدام نماذج Google Gemini مع OpenClaw
    - أنت بحاجة إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، إنشاء الصور، فهم الوسائط، TTS، البحث على الويب)
title: Google (Gemini)
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:38:47Z"
  model: gpt-5.4
  provider: openai
  source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
  source_path: providers/google.md
  workflow: 15
---

توفر إضافة Google الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
إنشاء الصور، وفهم الوسائط (الصورة/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: Google Gemini API
- خيار وقت التشغيل: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  يعيد استخدام Gemini CLI OAuth مع إبقاء مراجع النماذج بصيغة معيارية `google/*`.

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
      <Step title="التحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    يُقبل كل من متغيري البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY`. استخدم أيًّا منهما لديك مُعدًا بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI موجود عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    إن المزوّد `google-gemini-cli` تكامل غير رسمي. يفيد بعض المستخدمين
    بوجود قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
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

        يدعم OpenClaw كلاً من تثبيتات Homebrew وتثبيتات npm العامة، بما في ذلك
        تخطيطات Windows/npm الشائعة.
      </Step>
      <Step title="تسجيل الدخول عبر OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="التحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - النموذج الافتراضي: `google/gemini-3.1-pro-preview`
    - وقت التشغيل: `google-gemini-cli`
    - الاسم البديل: `gemini-cli`

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو الصيغ `GEMINI_CLI_*`.)

    <Note>
    إذا فشلت طلبات Gemini CLI OAuth بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من أن الأمر المحلي `gemini`
    مثبت وموجود على `PATH`.
    </Note>

    إن مراجع النماذج `google-gemini-cli/*` هي أسماء توافقية قديمة. يجب أن تستخدم
    الإعدادات الجديدة مراجع النماذج `google/*` مع وقت التشغيل `google-gemini-cli`
    عندما تريد تنفيذ Gemini CLI محليًا.

  </Tab>
</Tabs>

## الإمكانات

| الإمكانية             | مدعوم                     |
| --------------------- | ------------------------- |
| إكمالات الدردشة       | نعم                       |
| إنشاء الصور           | نعم                       |
| إنشاء الموسيقى        | نعم                       |
| تحويل النص إلى كلام   | نعم                       |
| الصوت في الوقت الفعلي | نعم (Google Live API)     |
| فهم الصور             | نعم                       |
| نسخ الصوت             | نعم                       |
| فهم الفيديو           | نعم                       |
| البحث على الويب (Grounding) | نعم                 |
| التفكير/الاستدلال     | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4         | نعم                       |

<Tip>
تستخدم نماذج Gemini 3 `thinkingLevel` بدلًا من `thinkingBudget`. يقوم OpenClaw بربط
عناصر التحكم في الاستدلال الخاصة بـ Gemini 3 وGemini 3.1 والأسماء البديلة
`gemini-*-latest` إلى `thinkingLevel` حتى لا ترسل التشغيلات الافتراضية/منخفضة
زمن الانتقال قيم `thinkingBudget` المعطلة.

يبقي `/think adaptive` دلالات التفكير الديناميكي الخاصة بـ Google بدلًا من اختيار
مستوى ثابت من OpenClaw. تحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` الثابتة حتى
تختار Google المستوى؛ بينما ترسل Gemini 2.5 قيمة Google الديناميكية الحارسة
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يقوم OpenClaw
بإعادة كتابة `thinkingBudget` إلى `thinkingLevel` مدعوم من Google في Gemma 4.
يحافظ ضبط التفكير على `off` على تعطيل التفكير بدلًا من ربطه إلى
`MINIMAL`.
</Tip>

## إنشاء الصور

يستخدم موفّر إنشاء الصور المضمّن `google` افتراضيًا
`google/gemini-3.1-flash-image-preview`.

- يدعم أيضًا `google/gemini-3-pro-image-preview`
- الإنشاء: حتى 4 صور لكل طلب
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
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

## إنشاء الفيديو

تسجّل إضافة `google` المضمّنة أيضًا إنشاء الفيديو عبر أداة
`video_generate` المشتركة.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: من نص إلى فيديو، ومن صورة إلى فيديو، وتدفقات مرجعية لفيديو واحد
- تدعم `aspectRatio` و`resolution` و`audio`
- الحد الحالي للمدة: **من 4 إلى 8 ثوانٍ**

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
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

## إنشاء الموسيقى

تسجّل إضافة `google` المضمّنة أيضًا إنشاء الموسيقى عبر أداة
`music_generate` المشتركة.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في المطالبة: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- مدخلات مرجعية: حتى 10 صور
- تُفصل التشغيلات المدعومة بجلسة عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

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
راجع [إنشاء الموسيقى](/ar/tools/music-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك الرجوع الاحتياطي.
</Note>

## تحويل النص إلى كلام

يستخدم موفّر الكلام المضمّن `google` مسار TTS الخاص بـ Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وOpus لأهداف الملاحظات الصوتية، وPCM لـ Talk/الاتصالات الهاتفية
- خرج الملاحظات الصوتية: يُغلَّف Google PCM كـ WAV ويُحوَّل ترميزيًا إلى 48 kHz Opus باستخدام `ffmpeg`

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
          audioProfile: "تحدث باحترافية وبنبرة هادئة.",
        },
      },
    },
  },
}
```

يستخدم TTS الخاص بـ Gemini API المطالبات باللغة الطبيعية للتحكم في الأسلوب. اضبط
`audioProfile` لإضافة مطالبة أسلوب قابلة لإعادة الاستخدام قبل النص المنطوق. واضبط
`speakerName` عندما يشير نص مطالبتك إلى متحدث مسمّى.

يقبل TTS الخاص بـ Gemini API أيضًا وسومًا صوتية تعبيرية بين أقواس مربعة في النص،
مثل `[whispers]` أو `[laughs]`. لإبقاء الوسوم خارج رد الدردشة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
إليك نص الرد النظيف.

[[tts:text]][whispers] إليك النسخة المنطوقة.[[/tts:text]]
```

<Note>
يُعد مفتاح API من Google Cloud Console مقيّدًا بـ Gemini API صالحًا لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت في الوقت الفعلي

تسجّل إضافة `google` المضمّنة مزوّد صوت في الوقت الفعلي مدعومًا بواسطة
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد               | مسار التكوين                                                         | الافتراضي                                                                            |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| النموذج               | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| الصوت                 | `...google.voice`                                                    | `Kore`                                                                               |
| درجة الحرارة          | `...google.temperature`                                              | (غير معيّن)                                                                          |
| حساسية بدء VAD        | `...google.startSensitivity`                                         | (غير معيّن)                                                                          |
| حساسية إنهاء VAD      | `...google.endSensitivity`                                           | (غير معيّن)                                                                          |
| مدة الصمت             | `...google.silenceDurationMs`                                        | (غير معيّن)                                                                          |
| مفتاح API             | `...google.apiKey`                                                   | يرجع احتياطيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على تكوين Voice Call في الوقت الفعلي:

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
يستخدم Google Live API صوتًا ثنائي الاتجاه واستدعاء دوال عبر WebSocket.
يقوم OpenClaw بمواءمة صوت الجسر الهاتفي/Meet مع تدفق Gemini PCM Live API
ويُبقي استدعاءات الأدوات على عقد الصوت المشترك في الوقت الفعلي. اترك `temperature`
غير معيّن ما لم تكن بحاجة إلى تغييرات في أخذ العينات؛ إذ يحذف OpenClaw القيم غير الموجبة
لأن Google Live قد يعيد نصوصًا مفرغة من دون صوت عند `temperature: 0`.
يُفعّل نسخ Gemini API من دون `languageCodes`؛ إذ ترفض Google SDK الحالية
تلميحات رمز اللغة في هذا المسار من API.
</Note>

<Note>
ما تزال جلسات المتصفح Talk في Control UI تتطلب مزوّد صوت في الوقت الفعلي مع
تنفيذ جلسة WebRTC للمتصفح. واليوم يكون هذا المسار هو OpenAI Realtime؛ أما
مزوّد Google فهو لجسور الوقت الفعلي الخلفية.
</Note>

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة التخزين المؤقت المباشرة في Gemini">
    بالنسبة إلى التشغيلات المباشرة لـ Gemini API (`api: "google-generative-ai"`)، يقوم OpenClaw
    بتمرير معرّف `cachedContent` مُكوَّن إلى طلبات Gemini.

    - اضبط المعلمات لكل نموذج أو بشكل عام باستخدام
      `cachedContent` أو الاسم القديم `cached_content`
    - إذا وُجد الاثنان، فإن `cachedContent` له الأولوية
    - مثال على القيمة: `cachedContents/prebuilt-context`
    - يُطبَّع استخدام إصابة ذاكرة التخزين المؤقت في Gemini إلى `cacheRead` في OpenClaw انطلاقًا من
      القيمة المصدرية `cachedContentTokenCount`

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
    عند استخدام مزوّد OAuth `google-gemini-cli`، يقوم OpenClaw بتطبيع
    خرج JSON الخاص بـ CLI على النحو التالي:

    - يأتي نص الرد من الحقل `response` في JSON الخاص بـ CLI.
    - يرجع الاستخدام احتياطيًا إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - تُطبَّع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كانت `stats.input` مفقودة، فإن OpenClaw يشتق رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والبرنامج الخدمي">
    إذا كان Gateway يعمل كبرنامج خدمي (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="إنشاء الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار المزوّد.
  </Card>
  <Card title="إنشاء الموسيقى" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار المزوّد.
  </Card>
</CardGroup>
