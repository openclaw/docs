---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API وOAuth، وتوليد الصور، وفهم الوسائط، وتحويل النص إلى كلام، والبحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T06:27:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

يوفّر Plugin الخاص بـ Google إمكانية الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى توليد الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- واجهة API: Google Gemini API
- خيار وقت التشغيل: يعيد `agentRuntime.id: "google-gemini-cli"` استخدام OAuth الخاص بـ Gemini CLI مع إبقاء مراجع النماذج بالصيغة القياسية `google/*`.

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API">
    **الأنسب لـ:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

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
    يُقبل كل من `GEMINI_API_KEY` و`GOOGLE_API_KEY`. استخدم أيهما أعددته بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأنسب لـ:** إعادة استخدام تسجيل دخول حالي إلى Gemini CLI عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    يُعد مزوّد `google-gemini-cli` تكاملًا غير رسمي. أبلغ بعض المستخدمين
    عن فرض قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="تثبيت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحًا ضمن `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw عمليات التثبيت عبر Homebrew وعمليات التثبيت العامة عبر npm، بما في ذلك
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

    معرّف نموذج Gemini API الخاص بـ Gemini 3.1 Pro هو `gemini-3.1-pro-preview`. يقبل OpenClaw الصيغة الأقصر `google/gemini-3.1-pro` كاسم بديل للتسهيل، ويحوّلها إلى الصيغة القياسية قبل استدعاءات المزوّد.

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    إذا فشلت طلبات OAuth الخاصة بـ Gemini CLI بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء مسار المتصفح، فتأكد من تثبيت الأمر المحلي `gemini`
    ووجوده ضمن `PATH`.
    </Note>

    تُعد مراجع النماذج `google-gemini-cli/*` أسماءً بديلة قديمة للتوافق. ينبغي أن تستخدم
    الإعدادات الجديدة مراجع النماذج `google/*` مع وقت التشغيل `google-gemini-cli`
    عندما تريد تنفيذ Gemini CLI محليًا.

  </Tab>
</Tabs>

<Note>
أُوقف `google/gemini-3-pro-preview` في 2026-03-09؛ استخدم `google/gemini-3.1-pro-preview` بدلًا منه. تؤدي إعادة تشغيل إعداد مفتاح Gemini API ‏(`openclaw onboard --auth-choice gemini-api-key` أو `openclaw models auth login --provider google`) إلى استبدال النموذج الافتراضي القديم المضبوط بالنموذج الحالي.
</Note>

## الإمكانات

| الإمكانية                    | مدعومة                           |
| ---------------------------- | -------------------------------- |
| إكمالات المحادثة             | نعم                              |
| توليد الصور                  | نعم                              |
| توليد الموسيقى               | نعم                              |
| تحويل النص إلى كلام          | نعم                              |
| الصوت في الوقت الفعلي        | نعم (Google Live API)            |
| فهم الصور                    | نعم                              |
| نسخ الصوت                    | نعم                              |
| فهم الفيديو                  | نعم                              |
| البحث على الويب (Grounding)  | نعم                              |
| التفكير/الاستدلال            | نعم (Gemini 2.5+ / Gemini 3+)    |
| نماذج Gemma 4                | نعم                              |

## البحث على الويب

يستخدم مزوّد البحث على الويب `gemini` المضمّن إسناد Gemini Google Search.
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
ثم `models.providers.google.apiKey`. الحقل `webSearch.baseUrl` اختياري
ومخصص لوكلاء المشغّلين أو نقاط نهاية Gemini API المتوافقة؛ وعند حذفه،
يعيد بحث Gemini على الويب استخدام `models.providers.google.baseUrl`. راجع
[بحث Gemini](/ar/tools/gemini-search) لمعرفة سلوك الأداة الخاص بالمزوّد.

<Tip>
تستخدم نماذج Gemini 3 ‏`thinkingLevel` بدلًا من `thinkingBudget`. يربط OpenClaw
عناصر التحكم في الاستدلال الخاصة بـ Gemini 3 وGemini 3.1 والأسماء البديلة `gemini-*-latest`
بـ `thinkingLevel`، لكي لا ترسل عمليات التشغيل الافتراضية/منخفضة زمن الاستجابة
قيم `thinkingBudget` معطّلة.

يحافظ `/think adaptive` على دلالات التفكير الديناميكي في Google بدلًا من اختيار
مستوى ثابت في OpenClaw. يحذف Gemini 3 وGemini 3.1 قيمة `thinkingLevel` الثابتة لكي
تتمكن Google من اختيار المستوى؛ بينما يرسل Gemini 2.5 قيمة Google الدالة على الوضع الديناميكي
`thinkingBudget: -1`.

تدعم نماذج Gemma 4 (مثل `gemma-4-26b-a4b-it`) وضع التفكير. يعيد OpenClaw
كتابة `thinkingBudget` إلى قيمة `thinkingLevel` مدعومة من Google لنماذج Gemma 4.
ويؤدي تعيين التفكير إلى `off` إلى إبقائه معطّلًا بدلًا من تحويله إلى
`MINIMAL`.

لا يعمل Gemini 2.5 Pro إلا في وضع التفكير، ويرفض القيمة الصريحة
`thinkingBudget: 0`؛ لذا يزيل OpenClaw هذه القيمة من طلبات Gemini 2.5 Pro
بدلًا من إرسالها.
</Tip>

## توليد الصور

يستخدم مزوّد توليد الصور `google` المضمّن افتراضيًا
`google/gemini-3.1-flash-image-preview`.

- يدعم أيضًا `google/gemini-3-pro-image-preview`
- التوليد: ما يصل إلى 4 صور لكل طلب
- وضع التحرير: مفعّل، مع ما يصل إلى 5 صور إدخال
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
راجع [توليد الصور](/ar/tools/image-generation) لمعرفة معلمات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

## توليد الفيديو

يسجّل Plugin ‏`google` المضمّن أيضًا توليد الفيديو عبر الأداة المشتركة
`video_generate`.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: تحويل النص إلى فيديو، وتحويل الصورة إلى فيديو، ومسارات مرجع الفيديو الواحد
- يدعم `aspectRatio` ‏(`16:9`، `9:16`) و`resolution` ‏(`720P`، `1080P`)؛ ولا يدعم Veo حاليًا إخراج الصوت
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
راجع [توليد الفيديو](/ar/tools/video-generation) لمعرفة معلمات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

## توليد الموسيقى

يسجّل Plugin ‏`google` المضمّن أيضًا توليد الموسيقى عبر الأداة المشتركة
`music_generate`.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في الموجّه: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` مع `google/lyria-3-pro-preview`
- المدخلات المرجعية: ما يصل إلى 10 صور
- تُفصل عمليات التشغيل المدعومة بجلسة عبر مسار المهمة/الحالة المشترك، بما في ذلك `action: "status"`

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
راجع [توليد الموسيقى](/ar/tools/music-generation) لمعرفة معلمات الأداة المشتركة واختيار المزوّد وسلوك تجاوز الفشل.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام `google` المضمّن مسار تحويل النص إلى كلام في Gemini API باستخدام
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات تحويل النص إلى كلام العادية، وOpus لوجهات الملاحظات الصوتية، وPCM للمحادثة/الاتصالات الهاتفية
- إخراج الملاحظات الصوتية: يُغلّف PCM الخاص بـ Google بتنسيق WAV ثم يُحوّل إلى Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg`

يعيد مسار Gemini TTS الدفعي في Google الصوت المولّد ضمن استجابة
`generateContent` المكتملة. للحصول على أقل زمن استجابة في المحادثات المنطوقة، استخدم
مزوّد الصوت في الوقت الفعلي من Google والمدعوم بـ Gemini Live API بدلًا من
تحويل النص إلى كلام الدفعي.

لاستخدام Google كمزوّد تحويل النص إلى كلام الافتراضي:

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

يستخدم Gemini API TTS توجيهات باللغة الطبيعية للتحكم في الأسلوب. عيّن
`audioProfile` لإضافة موجّه أسلوب قابل لإعادة الاستخدام قبل النص المنطوق. وعيّن
`speakerName` عندما يشير نص الموجّه إلى متحدث محدد بالاسم.

يقبل Gemini API TTS أيضًا وسومًا صوتية تعبيرية بين أقواس مربعة داخل النص،
مثل `[whispers]` أو `[laughs]`. لإخفاء الوسوم من رد المحادثة المرئي
مع إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
يصلح مفتاح Google Cloud Console API المقيّد بـ Gemini API لهذا
المزوّد. وهذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت في الوقت الفعلي

يسجّل Plugin ‏`google` المضمّن مزوّد صوت في الوقت الفعلي مدعومًا بـ
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد                   | مسار الإعداد                                                        | القيمة الافتراضية                                                                       |
| ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| النموذج                   | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                         |
| الصوت                     | `...google.voice`                                                   | `Kore`                                                                                  |
| درجة الحرارة              | `...google.temperature`                                             | (غير معيّنة)                                                                            |
| حساسية بدء اكتشاف النشاط الصوتي | `...google.startSensitivity`                                        | (غير معيّنة)                                                                            |
| حساسية انتهاء اكتشاف النشاط الصوتي | `...google.endSensitivity`                                          | (غير معيّنة)                                                                            |
| مدة الصمت                 | `...google.silenceDurationMs`                                       | (غير معيّنة)                                                                            |
| معالجة النشاط             | `...google.activityHandling`                                        | القيمة الافتراضية من Google، `start-of-activity-interrupts`                              |
| تغطية الدور               | `...google.turnCoverage`                                            | القيمة الافتراضية من Google، `audio-activity-and-all-video`                              |
| تعطيل الاكتشاف التلقائي للنشاط الصوتي | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                                 |
| استئناف الجلسة            | `...google.sessionResumption`                                       | `true`                                                                                  |
| ضغط السياق                | `...google.contextWindowCompression`                                | `true`                                                                                  |
| مفتاح API                 | `...google.apiKey`                                                  | يرجع إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`        |

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
يكيّف OpenClaw صوت مهاتفة/جسر Meet مع تدفق PCM Live API الخاص بـ Gemini،
ويُبقي استدعاءات الأدوات ضمن عقد الصوت المشترك في الوقت الفعلي. اترك `temperature`
غير معيّنة ما لم تكن بحاجة إلى تغييرات في أخذ العينات؛ يحذف OpenClaw القيم غير الموجبة
لأن Google Live قد تعيد نصوصًا مفرّغة من دون صوت عند استخدام `temperature: 0`.
يُفعّل النسخ النصي في Gemini API من دون `languageCodes`؛ إذ ترفض حزمة SDK الحالية من Google
تلميحات رموز اللغات في مسار API هذا.
</Note>

<Note>
يقبل Gemini 3.1 Live النص الحواري عبر الإدخال في الوقت الفعلي ويستخدم
استدعاء الدوال المتسلسل. يحذف OpenClaw الحقول الأقدم `NON_BLOCKING` وجدولة
استجابات الدوال وحقول الحوار العاطفي لهذا النموذج. يُفضّل استخدام
`thinkingLevel`؛ وتُحوّل قيم `thinkingBudget` الموجبة المضبوطة إلى
أقرب مستوى مدعوم، بينما تُبقي `-1` القيمة الافتراضية من Google دون تغيير. راجع
[مقارنة إمكانات Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
تدعم ميزة المحادثة في واجهة التحكم جلسات Google Live في المتصفح باستخدام رموز
مقيّدة صالحة للاستخدام مرة واحدة. ويمكن أيضًا تشغيل موفّري الصوت في الوقت الفعلي
المخصّصين للواجهة الخلفية عبر نقل الترحيل العام في Gateway، ما يُبقي بيانات اعتماد
الموفّر على Gateway.
</Note>

للتحقق المباشر من قِبل المشرف، شغّل
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
يشمل اختبار التحقق السريع أيضًا مسارات الواجهة الخلفية/WebRTC الخاصة بـ OpenAI؛ وينشئ جزء Google
رمز Live API مقيّدًا بالشكل نفسه الذي تستخدمه ميزة المحادثة في واجهة التحكم، ثم يفتح
نقطة نهاية WebSocket في المتصفح ويرسل حمولة الإعداد الأولية وينتظر
`setupComplete`.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    بالنسبة إلى عمليات Gemini API المباشرة (`api: "google-generative-ai"`)، يمرّر OpenClaw
    معرّف `cachedContent` المضبوط إلى طلبات Gemini.

    - اضبط المعلمات لكل نموذج أو على المستوى العام باستخدام
      `cachedContent` أو `cached_content` القديم
    - تكون الأولوية دائمًا لمعلمات النطاق الأكثر تحديدًا (مستوى النموذج قبل المستوى العام).
      وضمن النطاق نفسه، إذا ضُبط المفتاحان، تكون الأولوية لـ `cached_content`.
      استخدم مفتاحًا واحدًا فقط لكل نطاق لتجنب النتائج غير المتوقعة.
    - مثال على القيمة: `cachedContents/prebuilt-context`
    - يُطبّع استخدام إصابة ذاكرة التخزين المؤقت في Gemini إلى `cacheRead` في OpenClaw
      انطلاقًا من `cachedContentTokenCount` الوارد من المصدر الأعلى

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
    عند استخدام موفّر OAuth المسمى `google-gemini-cli`، يستخدم OpenClaw مخرجات
    `stream-json` من Gemini CLI افتراضيًا ويُطبّع الاستخدام من حمولة
    `stats` النهائية. ولا تزال تجاوزات `--output-format json` القديمة تستخدم
    محلل JSON.

    - يأتي نص الرد المتدفق من أحداث `message` الخاصة بالمساعد.
    - بالنسبة إلى مخرجات JSON القديمة، يأتي نص الرد من الحقل `response` في JSON الخاص بـ CLI.
    - يرجع الاستخدام إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - يُطبّع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من إتاحة `GEMINI_API_KEY`
    لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="Image generation" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="Video generation" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="Music generation" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار الموفّر.
  </Card>
</CardGroup>
