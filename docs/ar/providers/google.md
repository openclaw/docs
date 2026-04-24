---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى مفتاح API أو تدفق مصادقة OAuth
summary: إعداد Google Gemini (مفتاح API + OAuth، إنشاء الصور، فهم الوسائط، تحويل النص إلى كلام، البحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:01:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

يوفر Plugin Google إمكانية الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
إنشاء الصور، وفهم الوسائط (الصور/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- المزوّد: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: Google Gemini API
- المزوّد البديل: `google-gemini-cli` (OAuth)

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
      <Step title="التحقق من أن النموذج متاح">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    يتم قبول متغيري البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY` كليهما. استخدم أيًّا منهما إذا كان لديك أحدهما مضبوطًا بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **الأفضل لـ:** إعادة استخدام تسجيل دخول Gemini CLI الحالي عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    المزوّد `google-gemini-cli` هو تكامل غير رسمي. أفاد بعض المستخدمين
    بوجود قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="تثبيت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحًا على `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # أو npm
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
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
    - الاسم المستعار: `gemini-cli`

    **متغيرات البيئة:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (أو صيغ `GEMINI_CLI_*`.)

    <Note>
    إذا فشلت طلبات Gemini CLI OAuth بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو
    `GOOGLE_CLOUD_PROJECT_ID` على مضيف Gateway ثم أعد المحاولة.
    </Note>

    <Note>
    إذا فشل تسجيل الدخول قبل بدء تدفق المتصفح، فتأكد من أن الأمر المحلي `gemini`
    مثبت وموجود على `PATH`.
    </Note>

    المزوّد `google-gemini-cli` المعتمد على OAuth فقط هو واجهة منفصلة
    للاستدلال النصي. يبقى إنشاء الصور، وفهم الوسائط، وGemini Grounding على
    معرّف المزوّد `google`.

  </Tab>
</Tabs>

## الإمكانات

| الإمكانية              | مدعومة                        |
| ---------------------- | ----------------------------- |
| إكمالات الدردشة        | نعم                           |
| إنشاء الصور            | نعم                           |
| إنشاء الموسيقى         | نعم                           |
| تحويل النص إلى كلام    | نعم                           |
| الصوت الفوري           | نعم (Google Live API)         |
| فهم الصور              | نعم                           |
| نسخ الصوت              | نعم                           |
| فهم الفيديو            | نعم                           |
| البحث على الويب (Grounding) | نعم                     |
| التفكير/الاستدلال      | نعم (Gemini 2.5+ / Gemini 3+) |
| نماذج Gemma 4          | نعم                           |

<Tip>
تستخدم نماذج Gemini 3 القيمة `thinkingLevel` بدلًا من `thinkingBudget`. يقوم OpenClaw
بربط عناصر التحكم في الاستدلال الخاصة بـ Gemini 3 وGemini 3.1 والاسم المستعار `gemini-*-latest` إلى
`thinkingLevel` حتى لا ترسل عمليات التشغيل الافتراضية/منخفضة الكمون
قيم `thinkingBudget` المعطلة.

تدعم نماذج Gemma 4 (على سبيل المثال `gemma-4-26b-a4b-it`) وضع التفكير. يقوم OpenClaw
بإعادة كتابة `thinkingBudget` إلى قيمة Google `thinkingLevel` مدعومة لنماذج Gemma 4.
ويؤدي ضبط التفكير على `off` إلى إبقاء التفكير معطّلًا بدلًا من تعيينه إلى
`MINIMAL`.
</Tip>

## إنشاء الصور

يستخدم مزوّد إنشاء الصور `google` المضمّن افتراضيًا
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
راجع [إنشاء الصور](/ar/tools/image-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## إنشاء الفيديو

يسجّل Plugin `google` المضمّن أيضًا إنشاء الفيديو عبر الأداة المشتركة
`video_generate`.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: نص إلى فيديو، وصورة إلى فيديو، وتدفّقات مرجعية لفيديو واحد
- يدعم `aspectRatio` و`resolution` و`audio`
- القيد الحالي على المدة: **من 4 إلى 8 ثوانٍ**

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
راجع [إنشاء الفيديو](/ar/tools/video-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## إنشاء الموسيقى

يسجّل Plugin `google` المضمّن أيضًا إنشاء الموسيقى عبر الأداة المشتركة
`music_generate`.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- يدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في المطالبة: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- مدخلات مرجعية: حتى 10 صور
- تُفصل العمليات المعتمدة على الجلسة عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

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
راجع [إنشاء الموسيقى](/ar/tools/music-generation) لمعلمات الأداة المشتركة، واختيار المزوّد، وسلوك التبديل الاحتياطي.
</Note>

## تحويل النص إلى كلام

يستخدم مزوّد الكلام `google` المضمّن مسار TTS في Gemini API مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وPCM لـ Talk/الهاتف
- إخراج الملاحظات الصوتية الأصلي: غير مدعوم على مسار Gemini API هذا لأن API يعيد PCM بدلًا من Opus

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
        },
      },
    },
  },
}
```

يقبل TTS في Gemini API وسومًا صوتية تعبيرية بين أقواس مربعة في النص، مثل
`[whispers]` أو `[laughs]`. ولإبقاء الوسوم خارج الرد المرئي في الدردشة مع
إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
إليك نص الرد النظيف.

[[tts:text]][whispers] هذه هي النسخة المنطوقة.[[/tts:text]]
```

<Note>
يكون مفتاح API من Google Cloud Console والمقيّد على Gemini API صالحًا لهذا
المزوّد. هذا ليس مسار Cloud Text-to-Speech API المنفصل.
</Note>

## الصوت الفوري

يسجّل Plugin `google` المضمّن مزوّد صوت فوري مدعومًا بواسطة
Gemini Live API لجسور الصوت الخلفية مثل Voice Call وGoogle Meet.

| الإعداد                | مسار الإعداد                                                         | الافتراضي                                                                            |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| النموذج               | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| الصوت                 | `...google.voice`                                                    | `Kore`                                                                               |
| Temperature           | `...google.temperature`                                              | (غير مضبوط)                                                                          |
| حساسية بدء VAD        | `...google.startSensitivity`                                         | (غير مضبوط)                                                                          |
| حساسية إنهاء VAD      | `...google.endSensitivity`                                           | (غير مضبوط)                                                                          |
| مدة الصمت             | `...google.silenceDurationMs`                                        | (غير مضبوط)                                                                          |
| مفتاح API             | `...google.apiKey`                                                   | يعود افتراضيًا إلى `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY` |

مثال على إعداد الصوت الفوري لـ Voice Call:

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
تستخدم Google Live API الصوت ثنائي الاتجاه واستدعاء الدوال عبر WebSocket.
يقوم OpenClaw بمواءمة صوت جسور الهاتف/Meet مع تدفق PCM Live API الخاص بـ Gemini
ويُبقي استدعاءات الأدوات على عقد الصوت الفوري المشترك. اترك `temperature`
غير مضبوط ما لم تكن بحاجة إلى تغييرات في أخذ العينات؛ يتجاهل OpenClaw القيم غير الموجبة
لأن Google Live قد يعيد نصوصًا منسوخة بدون صوت عند `temperature: 0`.
يتم تمكين النسخ في Gemini API بدون `languageCodes`؛ إذ يرفض Google SDK الحالي
تلميحات رموز اللغة على مسار API هذا.
</Note>

<Note>
ما تزال جلسات Talk في واجهة المستخدم ضمن المتصفح تتطلب مزوّد صوت فوريًا مع
تنفيذ جلسة WebRTC في المتصفح. اليوم يكون هذا المسار هو OpenAI Realtime؛
أما مزوّد Google فهو مخصّص لجسور الصوت الفوري الخلفية.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة التخزين المؤقت المباشرة في Gemini">
    في عمليات Gemini API المباشرة (`api: "google-generative-ai"`)، يقوم OpenClaw
    بتمرير مقبض `cachedContent` المُعدّ مباشرة إلى طلبات Gemini.

    - اضبط معلمات لكل نموذج أو معلمات عامة باستخدام
      `cachedContent` أو `cached_content` القديم
    - إذا كان كلاهما موجودًا، تكون الأولوية لـ `cachedContent`
    - مثال على القيمة: `cachedContents/prebuilt-context`
    - تتم مواءمة استخدام نجاح ذاكرة التخزين المؤقت في Gemini إلى `cacheRead` في OpenClaw انطلاقًا من
      `cachedContentTokenCount` في المصدر

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
    عند استخدام مزوّد OAuth `google-gemini-cli`، يقوم OpenClaw بمواءمة
    خرج JSON الخاص بـ CLI على النحو التالي:

    - يأتي نص الرد من الحقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - تتم مواءمة `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة">
    إذا كان Gateway يعمل كخدمة (launchd/systemd)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
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
