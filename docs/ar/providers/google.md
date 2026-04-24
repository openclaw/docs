---
read_when:
    - تريد استخدام نماذج Google Gemini مع OpenClaw
    - تحتاج إلى تدفق مصادقة مفتاح API أو OAuth
summary: إعداد Google Gemini ‏(مفتاح API وOAuth، وتوليد الصور، وفهم الوسائط، وTTS، والبحث على الويب)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T07:58:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

يوفّر Google plugin الوصول إلى نماذج Gemini عبر Google AI Studio، بالإضافة إلى
توليد الصور، وفهم الوسائط (الصورة/الصوت/الفيديو)، وتحويل النص إلى كلام، والبحث على الويب عبر
Gemini Grounding.

- الموفّر: `google`
- المصادقة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- API: ‏Google Gemini API
- موفّر بديل: `google-gemini-cli` ‏(OAuth)

## البدء

اختر طريقة المصادقة المفضلة لديك واتبع خطوات الإعداد.

<Tabs>
  <Tab title="مفتاح API">
    **الأفضل من أجل:** الوصول القياسي إلى Gemini API عبر Google AI Studio.

    <Steps>
      <Step title="شغّل الإعداد الأولي">
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
      <Step title="اضبط نموذجًا افتراضيًا">
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
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    متغيرا البيئة `GEMINI_API_KEY` و`GOOGLE_API_KEY` مقبولان كلاهما. استخدم أيًّا منهما إذا كان مضبوطًا لديك بالفعل.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI ‏(OAuth)">
    **الأفضل من أجل:** إعادة استخدام تسجيل دخول Gemini CLI موجود عبر PKCE OAuth بدلًا من مفتاح API منفصل.

    <Warning>
    الموفّر `google-gemini-cli` تكامل غير رسمي. يفيد بعض المستخدمين
    بوجود قيود على الحساب عند استخدام OAuth بهذه الطريقة. استخدمه على مسؤوليتك الخاصة.
    </Warning>

    <Steps>
      <Step title="ثبّت Gemini CLI">
        يجب أن يكون الأمر المحلي `gemini` متاحًا على `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        يدعم OpenClaw كلًا من تثبيتات Homebrew وتثبيتات npm العامة، بما في ذلك
        تخطيطات Windows/npm الشائعة.
      </Step>
      <Step title="سجّل الدخول عبر OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="تحقق من توفر النموذج">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
    - الاسم البديل: `gemini-cli`

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

    يمثّل الموفّر `google-gemini-cli` المعتمد على OAuth فقط سطحًا منفصلًا
    للاستدلال النصي. بينما تظل ميزات توليد الصور وفهم الوسائط وGemini Grounding على
    معرّف الموفّر `google`.

  </Tab>
</Tabs>

## الإمكانيات

| الإمكانية             | مدعومة                          |
| --------------------- | ------------------------------- |
| إكمالات الدردشة       | نعم                             |
| توليد الصور           | نعم                             |
| توليد الموسيقى        | نعم                             |
| تحويل النص إلى كلام   | نعم                             |
| فهم الصور             | نعم                             |
| نسخ الصوت             | نعم                             |
| فهم الفيديو           | نعم                             |
| البحث على الويب (Grounding) | نعم                       |
| التفكير/الاستدلال     | نعم (Gemini 2.5+ / Gemini 3+)   |
| نماذج Gemma 4         | نعم                             |

<Tip>
تستخدم نماذج Gemini 3 القيمة `thinkingLevel` بدلًا من `thinkingBudget`. يقوم OpenClaw
بربط عناصر التحكم في الاستدلال الخاصة بـ Gemini 3 وGemini 3.1 والاسم البديل
`gemini-*-latest` إلى `thinkingLevel` حتى لا ترسل عمليات التشغيل
الافتراضية/منخفضة الكمون قيم `thinkingBudget` معطّلة.

وتدعم نماذج Gemma 4 (على سبيل المثال `gemma-4-26b-a4b-it`) وضع التفكير. ويقوم OpenClaw
بإعادة كتابة `thinkingBudget` إلى قيمة Google `thinkingLevel` مدعومة في Gemma 4.
ويؤدي ضبط التفكير على `off` إلى إبقاء التفكير معطّلًا بدلًا من ربطه بالقيمة
`MINIMAL`.
</Tip>

## توليد الصور

يستخدم موفّر توليد الصور المضمّن `google` افتراضيًا
`google/gemini-3.1-flash-image-preview`.

- ويدعم أيضًا `google/gemini-3-pro-image-preview`
- التوليد: حتى 4 صور لكل طلب
- وضع التحرير: مفعّل، وحتى 5 صور إدخال
- عناصر التحكم الهندسية: `size` و`aspectRatio` و`resolution`

لاستخدام Google بوصفه موفّر الصور الافتراضي:

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
راجع [Image Generation](/ar/tools/image-generation) للاطلاع على معلمات الأداة المشتركة، واختيار الموفّر، وسلوك التبديل الاحتياطي.
</Note>

## توليد الفيديو

يسجّل Google plugin المضمّن أيضًا توليد الفيديو عبر الأداة المشتركة
`video_generate`.

- نموذج الفيديو الافتراضي: `google/veo-3.1-fast-generate-preview`
- الأوضاع: نص إلى فيديو، وصورة إلى فيديو، وتدفقات مرجعية لفيديو واحد
- يدعم `aspectRatio` و`resolution` و`audio`
- القيد الحالي للمدة: **من 4 إلى 8 ثوانٍ**

لاستخدام Google بوصفه موفّر الفيديو الافتراضي:

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
راجع [Video Generation](/ar/tools/video-generation) للاطلاع على معلمات الأداة المشتركة، واختيار الموفّر، وسلوك التبديل الاحتياطي.
</Note>

## توليد الموسيقى

يسجّل Google plugin المضمّن أيضًا توليد الموسيقى عبر الأداة المشتركة
`music_generate`.

- نموذج الموسيقى الافتراضي: `google/lyria-3-clip-preview`
- ويدعم أيضًا `google/lyria-3-pro-preview`
- عناصر التحكم في المطالبة: `lyrics` و`instrumental`
- تنسيق الإخراج: `mp3` افتراضيًا، بالإضافة إلى `wav` على `google/lyria-3-pro-preview`
- مدخلات مرجعية: حتى 10 صور
- تفصل عمليات التشغيل المعتمدة على الجلسة عبر تدفق المهمة/الحالة المشترك، بما في ذلك `action: "status"`

لاستخدام Google بوصفه موفّر الموسيقى الافتراضي:

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
راجع [Music Generation](/ar/tools/music-generation) للاطلاع على معلمات الأداة المشتركة، واختيار الموفّر، وسلوك التبديل الاحتياطي.
</Note>

## تحويل النص إلى كلام

يستخدم موفّر الكلام المضمّن `google` مسار Gemini API الخاص بتحويل النص إلى كلام مع
`gemini-3.1-flash-tts-preview`.

- الصوت الافتراضي: `Kore`
- المصادقة: `messages.tts.providers.google.apiKey` أو `models.providers.google.apiKey` أو `GEMINI_API_KEY` أو `GOOGLE_API_KEY`
- الإخراج: WAV لمرفقات TTS العادية، وPCM لـ Talk/الهاتف
- إخراج الملاحظات الصوتية الأصلي: غير مدعوم على مسار Gemini API هذا لأن API يعيد PCM بدلًا من Opus

لاستخدام Google بوصفه موفّر TTS الافتراضي:

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

يقبل Gemini API TTS وسومًا صوتية تعبيرية بين أقواس مربعة في النص، مثل
`[whispers]` أو `[laughs]`. ولإبقاء الوسوم خارج رد الدردشة المرئي مع
إرسالها إلى TTS، ضعها داخل كتلة `[[tts:text]]...[[/tts:text]]`:

```text
إليك نص الرد النظيف.

[[tts:text]][whispers] إليك النسخة المنطوقة.[[/tts:text]]
```

<Note>
يعد مفتاح API من Google Cloud Console المقيّد بـ Gemini API صالحًا لهذا
الموفّر. وليس هذا هو المسار المنفصل لـ Cloud Text-to-Speech API.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="إعادة استخدام ذاكرة Gemini المؤقتة مباشرة">
    بالنسبة إلى عمليات Gemini API المباشرة (`api: "google-generative-ai"`)، يقوم OpenClaw
    بتمرير مقبض `cachedContent` مضبوط إلى طلبات Gemini.

    - اضبط المعلمات لكل نموذج أو المعلمات العامة باستخدام
      `cachedContent` أو `cached_content` القديم
    - إذا وُجدا معًا، تكون الأولوية لـ `cachedContent`
    - مثال على القيمة: `cachedContents/prebuilt-context`
    - يتم تطبيع استخدام إصابة ذاكرة Gemini المؤقتة إلى `cacheRead` في OpenClaw من
      `cachedContentTokenCount` الصادر من المصدر

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
    عند استخدام موفّر OAuth ‏`google-gemini-cli`، يقوم OpenClaw بتطبيع
    مخرجات JSON الخاصة بـ CLI كما يلي:

    - يأتي نص الرد من الحقل `response` في JSON الخاص بـ CLI.
    - يعود الاستخدام إلى `stats` عندما يترك CLI الحقل `usage` فارغًا.
    - يتم تطبيع `stats.cached` إلى `cacheRead` في OpenClaw.
    - إذا كان `stats.input` مفقودًا، يشتق OpenClaw رموز الإدخال من
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="إعداد البيئة والخدمة daemon">
    إذا كان Gateway يعمل كخدمة daemon ‏(`launchd`/`systemd`)، فتأكد من أن `GEMINI_API_KEY`
    متاح لتلك العملية (على سبيل المثال في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين، ومراجع النماذج، وسلوك التبديل الاحتياطي.
  </Card>
  <Card title="توليد الصور" href="/ar/tools/image-generation" icon="image">
    معلمات أداة الصور المشتركة واختيار الموفّر.
  </Card>
  <Card title="توليد الفيديو" href="/ar/tools/video-generation" icon="video">
    معلمات أداة الفيديو المشتركة واختيار الموفّر.
  </Card>
  <Card title="توليد الموسيقى" href="/ar/tools/music-generation" icon="music">
    معلمات أداة الموسيقى المشتركة واختيار الموفّر.
  </Card>
</CardGroup>
