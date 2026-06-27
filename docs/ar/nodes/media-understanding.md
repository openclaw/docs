---
read_when:
    - تصميم أو إعادة هيكلة فهم الوسائط
    - ضبط المعالجة المسبقة للصوت والفيديو والصور الواردة
sidebarTitle: Media understanding
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع بدائل الموفّر + CLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-06-27T17:55:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4724578632b0210290d1b32077d2c0ccf7fdfa6b96160f76bf3eff591df7b92e
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw يمكنه **تلخيص الوسائط الواردة** (صور/صوت/فيديو) قبل تشغيل مسار الرد. يكتشف تلقائياً متى تكون الأدوات المحلية أو مفاتيح المزوّد متاحة، ويمكن تعطيله أو تخصيصه. إذا كان الفهم متوقفاً، فستظل النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

يتم تسجيل سلوك الوسائط الخاص بالمورّدين بواسطة Plugins المورّدين، بينما يمتلك قلب OpenClaw إعداد `tools.media` المشترك، وترتيب الرجوع الاحتياطي، وتكامل مسار الرد.

## الأهداف

- اختياري: هضم الوسائط الواردة مسبقاً إلى نص قصير لتوجيه أسرع + تحليل أفضل للأوامر.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائماً).
- دعم **واجهات API للمزوّدين** و**بدائل CLI الاحتياطية**.
- السماح بعدة نماذج مع رجوع احتياطي مرتب (خطأ/حجم/مهلة).

## السلوك عالي المستوى

<Steps>
  <Step title="جمع المرفقات">
    اجمع المرفقات الواردة (`MediaPaths`، `MediaUrls`، `MediaTypes`).
  </Step>
  <Step title="التحديد لكل قدرة">
    لكل قدرة مفعّلة (صورة/صوت/فيديو)، حدّد المرفقات حسب السياسة (الافتراضي: **الأول**).
  </Step>
  <Step title="اختيار النموذج">
    اختر أول إدخال نموذج مؤهل (الحجم + القدرة + المصادقة).
  </Step>
  <Step title="الرجوع الاحتياطي عند الفشل">
    إذا فشل نموذج أو كانت الوسائط كبيرة جداً، **فارجع إلى الإدخال التالي**.
  </Step>
  <Step title="تطبيق كتلة النجاح">
    عند النجاح:

    - يصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
    - يعيّن الصوت `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص التعليق عند وجوده، وإلا فيستخدم النص المنسوخ.
    - يتم الحفاظ على التعليقات كـ `User text:` داخل الكتلة.

  </Step>
</Steps>

إذا فشل الفهم أو كان معطلاً، **يستمر تدفق الرد** مع المتن الأصلي + المرفقات.

## نظرة عامة على الإعدادات

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل قدرة:

<AccordionGroup>
  <Accordion title="مفاتيح المستوى الأعلى">
    - `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للتقييد).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - الافتراضيات (`prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`)
      - تجاوزات المزوّد (`baseUrl`، `headers`، `providerOptions`)
      - خيارات صوت Deepgram عبر `tools.media.audio.providerOptions.deepgram`
      - عناصر التحكم في صدى النص الصوتي (`echoTranscript`، الافتراضي `false`؛ `echoFormat`)
      - **قائمة `models` اختيارية لكل قدرة** (مفضلة قبل النماذج المشتركة)
      - سياسة `attachments` (`mode`، `maxAttachments`، `prefer`)
      - `scope` (تقييد اختياري حسب القناة/chatType/مفتاح الجلسة)
    - `tools.media.concurrency`: الحد الأقصى لتشغيل القدرات بالتوازي (الافتراضي **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### إدخالات النموذج

يمكن أن يكون كل إدخال `models[]` **مزوّداً** أو **CLI**:

<Tabs>
  <Tab title="إدخال المزوّد">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="إدخال CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    يمكن لقوالب CLI أيضاً استخدام:

    - `{{MediaDir}}` (الدليل الذي يحتوي على ملف الوسائط)
    - `{{OutputDir}}` (دليل مؤقت يُنشأ لهذا التشغيل)
    - `{{OutputBase}}` (مسار أساس الملف المؤقت، بلا امتداد)

  </Tab>
</Tabs>

### بيانات اعتماد المزوّد (`apiKey`)

يستخدم فهم الوسائط عبر المزوّد نفس حل مصادقة المزوّد مثل استدعاءات
النموذج العادية: ملفات تعريف المصادقة، ومتغيرات البيئة، ثم
`models.providers.<providerId>.apiKey`.

لا تقبل إدخالات `tools.media.*.models[]` حقلاً مضمنًا باسم `apiKey`. يجب أن تكون
قيمة `provider` في إدخال نموذج وسائط، مثل `openai` أو `moonshot`،
لها بيانات اعتماد متاحة عبر أحد مصادر مصادقة المزوّد القياسية.

مثال بسيط:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

للمرجع الكامل لمصادقة المزوّد، بما في ذلك ملفات التعريف ومتغيرات البيئة
وعناوين URL الأساسية المخصصة، راجع [الأدوات والمزوّدون المخصصون](/ar/gateway/config-tools).

## الافتراضيات والحدود

الافتراضيات الموصى بها:

- `maxChars`: **500** للصور/الفيديو (قصير ومناسب للأوامر)
- `maxChars`: **غير مضبوط** للصوت (نص منسوخ كامل ما لم تضع حداً)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

<AccordionGroup>
  <Accordion title="القواعد">
    - إذا تجاوزت الوسائط `maxBytes`، يتم تخطي ذلك النموذج و**تجربة النموذج التالي**.
    - تُعامل ملفات الصوت الأصغر من **1024 بايت** كفارغة/تالفة ويتم تخطيها قبل النسخ عبر المزوّد/CLI؛ ويتلقى سياق الرد الوارد نصاً منسوخاً نائباً حتمياً حتى يعرف الوكيل أن الملاحظة كانت صغيرة جداً.
    - إذا أعاد النموذج أكثر من `maxChars`، يتم اقتطاع المخرجات.
    - يكون `prompt` افتراضياً عبارة بسيطة "Describe the {media}." بالإضافة إلى إرشادات `maxChars` (للصور/الفيديو فقط).
    - إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلاً، يتخطى OpenClaw كتلة ملخص `[Image]` ويمرر الصورة الأصلية إلى النموذج بدلاً من ذلك.
    - إذا كان النموذج الأساسي في Gateway/WebChat نصياً فقط، يتم الحفاظ على مرفقات الصور كمراجع `media://inbound/*` منفّذة خارجياً بحيث لا تزال أدوات الصور/PDF أو نموذج الصورة المضبوط قادرة على فحصها بدلاً من فقدان المرفق.
    - تختلف طلبات `openclaw infer image describe --model <provider/model>` الصريحة: فهي تشغّل ذلك المزوّد/النموذج القادر على الصور مباشرة، بما في ذلك مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
    - إذا كانت `<capability>.enabled: true` لكن لا توجد نماذج مضبوطة، يحاول OpenClaw استخدام **نموذج الرد النشط** عندما يدعم مزوّده القدرة.

  </Accordion>
</AccordionGroup>

### الاكتشاف التلقائي لفهم الوسائط (افتراضي)

إذا لم يتم تعيين `tools.media.<capability>.enabled` إلى `false` وكنت لم تضبط نماذج، يكتشف OpenClaw تلقائياً بهذا الترتيب و**يتوقف عند أول خيار يعمل**:

<Steps>
  <Step title="نموذج الرد النشط">
    نموذج الرد النشط عندما يدعم مزوّده القدرة.
  </Step>
  <Step title="agents.defaults.imageModel">
    مراجع `agents.defaults.imageModel` الأساسية/الاحتياطية (للصور فقط).
    فضّل مراجع `provider/model`. تُؤهّل المراجع العارية من إدخالات نماذج المزوّدين المضبوطة والقادرة على الصور فقط عندما تكون المطابقة فريدة.
  </Step>
  <Step title="واجهات CLI المحلية (للصوت فقط)">
    واجهات CLI المحلية (إذا كانت مثبتة):

    - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمّن)
    - `whisper` (واجهة CLI بلغة Python؛ تنزّل النماذج تلقائياً)

  </Step>
  <Step title="Gemini CLI">
    `gemini` باستخدام `read_many_files`.
  </Step>
  <Step title="مصادقة المزوّد">
    - تتم تجربة إدخالات `models.providers.*` المضبوطة التي تدعم القدرة قبل ترتيب الرجوع الاحتياطي المضمّن.
    - مزوّدو الإعدادات الخاصون بالصور فقط الذين لديهم نموذج قادر على الصور يسجلون أنفسهم تلقائياً لفهم الوسائط حتى عندما لا يكونوا Plugin مورّد مضمّناً.
    - يتوفر فهم الصور في Ollama عند اختياره صراحةً، على سبيل المثال عبر `agents.defaults.imageModel` أو `openclaw infer image describe --model ollama/<vision-model>`.

    ترتيب الرجوع الاحتياطي المضمّن:

    - الصوت: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - الصور: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - الفيديو: Google → Qwen → Moonshot

  </Step>
</Steps>

لتعطيل الاكتشاف التلقائي، عيّن:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
اكتشاف الثنائيات هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجودة على `PATH` (نوسّع `~`)، أو عيّن نموذج CLI صريحاً مع مسار أمر كامل.
</Note>

### دعم بيئة الوكيل (نماذج المزوّد)

عند تمكين فهم وسائط **الصوت** و**الفيديو** المعتمد على المزوّد، يحترم OpenClaw متغيرات بيئة الوكيل الصادر القياسية لاستدعاءات HTTP الخاصة بالمزوّد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم يتم تعيين متغيرات بيئة وكيل، يستخدم فهم الوسائط خروجاً مباشراً. إذا كانت قيمة الوكيل مشوهة، يسجل OpenClaw تحذيراً ويعود إلى الجلب المباشر.

## القدرات (اختياري)

إذا عيّنت `capabilities`، فإن الإدخال يعمل فقط لأنواع الوسائط تلك. بالنسبة للقوائم المشتركة، يمكن لـ OpenClaw استنتاج الافتراضيات:

- `openai`، `anthropic`، `minimax`: **صور**
- `minimax-portal`: **صور**
- `moonshot`: **صور + فيديو**
- `openrouter`: **صور + صوت**
- `google` (Gemini API): **صور + صوت + فيديو**
- `qwen`: **صور + فيديو**
- `mistral`: **صوت**
- `zai`: **صور**
- `groq`: **صوت**
- `xai`: **صوت**
- `deepgram`: **صوت**
- أي فهرس `models.providers.<id>.models[]` يحتوي على نموذج قادر على الصور: **صور**

بالنسبة لإدخالات CLI، **عيّن `capabilities` صراحةً** لتجنب المطابقات المفاجئة. إذا حذفت `capabilities`، يكون الإدخال مؤهلاً للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّدين (تكاملات OpenClaw)

| القدرة | تكامل المزوّد                                                                                                         | ملاحظات                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصور      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | تسجل Plugins المورّدين دعم الصور؛ يمكن لـ `openai/*` استخدام التوجيه بمفتاح API أو Codex OAuth؛ يستخدم `codex/*` دورة Codex app-server محدودة؛ يستخدم كل من MiniMax وMiniMax OAuth `MiniMax-VL-01`؛ يسجل مزوّدو الإعدادات القادرون على الصور أنفسهم تلقائياً. |
| الصوت      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | نسخ عبر المزوّد (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| الفيديو      | Google, Qwen, Moonshot                                                                                                       | فهم الفيديو عبر المزوّد من خلال Plugins المورّدين؛ يستخدم فهم الفيديو في Qwen نقاط نهاية Standard DashScope.                                                                                                                            |

<Note>
**ملاحظة MiniMax**

- يأتي فهم الصور في `minimax` و`minimax-cn` و`minimax-portal` و`minimax-portal-cn` من موفّر الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
- يواصل توجيه الصور التلقائي استخدام `MiniMax-VL-01` حتى إذا ادّعت بيانات تعريف دردشة MiniMax M2.x القديمة دعم إدخال الصور.

</Note>

## إرشادات اختيار النموذج

- فضّل أقوى نموذج من أحدث جيل متاح لكل قدرة وسائط عندما تكون الجودة والسلامة مهمتين.
- للوكلاء المزوّدين بالأدوات الذين يتعاملون مع مُدخلات غير موثوقة، تجنّب نماذج الوسائط الأقدم أو الأضعف.
- احتفظ ببديل واحد على الأقل لكل قدرة لضمان التوافر (نموذج جودة + نموذج أسرع/أرخص).
- بدائل CLI (`whisper-cli` و`whisper` و`gemini`) مفيدة عندما تكون واجهات API الخاصة بالموفّرين غير متاحة.
- ملاحظة `parakeet-mlx`: مع `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الإخراج `txt` (أو غير محدد)؛ أما التنسيقات غير `txt` فتعود إلى stdout.

## سياسة المرفقات

تتحكم `attachments` لكل قدرة في المرفقات التي تتم معالجتها:

<ParamField path="mode" type='"first" | "all"' default="first">
  ما إذا كان ستتم معالجة أول مرفق محدد أم كلها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  يحدّ عدد العناصر التي تتم معالجتها.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  تفضيل الاختيار بين المرفقات المرشحة.
</ParamField>

عندما تكون `mode: "all"`، تُوسم المخرجات كـ `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

<AccordionGroup>
  <Accordion title="سلوك استخراج مرفقات الملفات">
    - يُغلّف نص الملف المستخرج باعتباره **محتوى خارجيًا غير موثوق** قبل إلحاقه بموجّه الوسائط.
    - تستخدم الكتلة المحقونة علامات حدود صريحة مثل `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات تعريف `Source: External`.
    - يحذف مسار استخراج المرفقات هذا عن قصد لافتة `SECURITY NOTICE:` الطويلة لتجنّب تضخيم موجّه الوسائط؛ وتظل علامات الحدود والبيانات التعريفية موجودة.
    - إذا لم يتضمن الملف أي نص قابل للاستخراج، يحقن OpenClaw العبارة `[No extractable text]`.
    - إذا عاد ملف PDF إلى صور صفحات مُصيّرة في هذا المسار، يُبقي موجّه الوسائط العنصر النائب `[PDF content rendered to images; images not forwarded to model]` لأن خطوة استخراج المرفقات هذه تمرّر كتل النص، لا صور PDF المُصيّرة.

  </Accordion>
</AccordionGroup>

## أمثلة التكوين

<Tabs>
  <Tab title="نماذج مشتركة + تجاوزات">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="الصوت + الفيديو فقط">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="الصور فقط">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="إدخال واحد متعدد الوسائط">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## مخرجات الحالة

عند تشغيل فهم الوسائط، يتضمن `/status` سطر ملخص قصيرًا:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

يعرض هذا نتائج كل قدرة والموفّر/النموذج المختار عند الاقتضاء.

## ملاحظات

- الفهم هو **أفضل جهد ممكن**. لا تمنع الأخطاء الردود.
- لا تزال المرفقات تُمرّر إلى النماذج حتى عندما يكون الفهم معطّلًا.
- استخدم `scope` لتحديد الأماكن التي يعمل فيها الفهم (مثل الرسائل المباشرة فقط).

## ذات صلة

- [التكوين](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
