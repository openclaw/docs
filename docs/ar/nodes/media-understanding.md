---
read_when:
    - تصميم أو إعادة هيكلة فهم الوسائط
    - ضبط المعالجة المسبقة للصوت/الفيديو/الصور الواردة
sidebarTitle: Media understanding
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع بدائل المزوّد + CLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-06-28T05:08:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw يمكنه **تلخيص الوسائط الواردة** (الصورة/الصوت/الفيديو) قبل تشغيل مسار الرد. يكتشف تلقائيًا متى تكون الأدوات المحلية أو مفاتيح المزوّدين متاحة، ويمكن تعطيله أو تخصيصه. إذا كان الفهم متوقفًا، فستظل النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

تُسجَّل سلوكيات الوسائط الخاصة بالمورّدين بواسطة Plugin المورّدين، بينما يملك قلب OpenClaw إعداد `tools.media` المشترك، وترتيب الرجوع الاحتياطي، وتكامل مسار الرد.

## الأهداف

- اختياري: هضم الوسائط الواردة مسبقًا وتحويلها إلى نص قصير لتوجيه أسرع + تحليل أفضل للأوامر.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات API للمزوّدين** و**بدائل CLI الاحتياطية**.
- السماح بنماذج متعددة مع رجوع احتياطي مرتب (خطأ/حجم/مهلة).

## السلوك عالي المستوى

<Steps>
  <Step title="جمع المرفقات">
    اجمع المرفقات الواردة (`MediaPaths`، `MediaUrls`، `MediaTypes`).
  </Step>
  <Step title="الاختيار لكل قدرة">
    لكل قدرة مفعّلة (صورة/صوت/فيديو)، اختر المرفقات حسب السياسة (الافتراضي: **الأول**).
  </Step>
  <Step title="اختيار النموذج">
    اختر أول إدخال نموذج مؤهل (الحجم + القدرة + المصادقة).
  </Step>
  <Step title="الرجوع الاحتياطي عند الفشل">
    إذا فشل نموذج أو كانت الوسائط كبيرة جدًا، **فارجع احتياطيًا إلى الإدخال التالي**.
  </Step>
  <Step title="تطبيق كتلة النجاح">
    عند النجاح:

    - يصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
    - يضبط الصوت `{{Transcript}}`؛ يستخدم تحليل الأوامر نص التعليق عند وجوده، وإلا فيستخدم النص المنسوخ.
    - تُحفَظ التعليقات بوصفها `User text:` داخل الكتلة.

  </Step>
</Steps>

إذا فشل الفهم أو كان معطلًا، **يستمر مسار الرد** باستخدام المتن الأصلي + المرفقات.

## نظرة عامة على الإعداد

يدعم `tools.media` **نماذج مشتركة** إضافة إلى تجاوزات لكل قدرة:

<AccordionGroup>
  <Accordion title="مفاتيح المستوى الأعلى">
    - `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للتقييد).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - الافتراضيات (`prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`)
      - تجاوزات المزوّد (`baseUrl`، `headers`، `providerOptions`)
      - خيارات صوت Deepgram عبر `tools.media.audio.providerOptions.deepgram`
      - عناصر التحكم في صدى النص المنسوخ الصوتي (`echoTranscript`، الافتراضي `false`؛ `echoFormat`)
      - **قائمة `models` لكل قدرة** اختيارية (مفضّلة قبل النماذج المشتركة)
      - سياسة `attachments` (`mode`، `maxAttachments`، `prefer`)
      - `scope` (تقييد اختياري حسب القناة/نوع الدردشة/مفتاح الجلسة)
    - `tools.media.concurrency`: الحد الأقصى لتشغيل القدرات المتزامنة (الافتراضي **2**).

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

يمكن أن يكون كل إدخال `models[]` **مزوّدًا** أو **CLI**:

<Tabs>
  <Tab title="إدخال مزوّد">
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

    يمكن لقوالب CLI أيضًا استخدام:

    - `{{MediaDir}}` (الدليل الذي يحتوي ملف الوسائط)
    - `{{OutputDir}}` (دليل مؤقت يُنشأ لهذا التشغيل)
    - `{{OutputBase}}` (مسار أساس الملف المؤقت، بلا امتداد)

  </Tab>
</Tabs>

### بيانات اعتماد المزوّد (`apiKey`)

يستخدم فهم الوسائط عبر المزوّد طريقة حل مصادقة المزوّد نفسها المستخدمة في
استدعاءات النماذج العادية: ملفات تعريف المصادقة، ومتغيرات البيئة، ثم
`models.providers.<providerId>.apiKey`.

لا تقبل إدخالات `tools.media.*.models[]` حقل `apiKey` مضمّنًا. يجب أن تكون
بيانات الاعتماد لقيمة `provider` في إدخال نموذج الوسائط، مثل `openai` أو `moonshot`،
متاحة عبر أحد مصادر مصادقة المزوّد القياسية.

مثال أدنى:

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

- `maxChars`: **500** للصورة/الفيديو (قصير ومناسب للأوامر)
- `maxChars`: **غير مضبوط** للصوت (النص المنسوخ الكامل ما لم تضبط حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

<AccordionGroup>
  <Accordion title="القواعد">
    - إذا تجاوزت الوسائط `maxBytes`، يتم تخطي ذلك النموذج و**تُجرَّب النماذج التالية**.
    - تُعامَل ملفات الصوت الأصغر من **1024 بايت** كفارغة/تالفة وتُتخطى قبل النسخ عبر المزوّد/CLI؛ يتلقى سياق الرد الوارد نصًا منسوخًا بديلًا حتميًا كي يعرف الوكيل أن الملاحظة كانت صغيرة جدًا.
    - إذا أعاد النموذج أكثر من `maxChars`، يتم اقتطاع المخرجات.
    - يكون `prompt` افتراضيًا بصيغة بسيطة "Describe the {media}." بالإضافة إلى إرشاد `maxChars` (للصورة/الفيديو فقط).
    - إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلاً، يتخطى OpenClaw كتلة ملخص `[Image]` ويمرر الصورة الأصلية إلى النموذج بدلًا من ذلك.
    - إذا كان نموذج Gateway/WebChat الأساسي نصيًا فقط، تُحفَظ مرفقات الصور كمراجع `media://inbound/*` مُحمَّلة خارجيًا حتى تتمكن أدوات الصور/PDF أو نموذج الصور المكوَّن من فحصها بدلًا من فقدان المرفق.
    - طلبات `openclaw infer image describe --model <provider/model>` الصريحة مختلفة: فهي تشغّل ذلك المزوّد/النموذج القادر على الصور مباشرة، بما في ذلك مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
    - إذا كانت `<capability>.enabled: true` ولكن لم تُكوَّن أي نماذج، يحاول OpenClaw استخدام **نموذج الرد النشط** عندما يدعم مزوّده القدرة.

  </Accordion>
</AccordionGroup>

### الاكتشاف التلقائي لفهم الوسائط (افتراضي)

إذا لم تُضبط `tools.media.<capability>.enabled` على `false` وكنت لم تكوّن نماذج، يكتشف OpenClaw تلقائيًا بهذا الترتيب و**يتوقف عند أول خيار يعمل**:

<Steps>
  <Step title="نموذج الرد النشط">
    نموذج الرد النشط عندما يدعم مزوّده القدرة.
  </Step>
  <Step title="agents.defaults.imageModel">
    مراجع `agents.defaults.imageModel` الأساسية/الاحتياطية (للصورة فقط).
    فضّل مراجع `provider/model`. تُؤهَّل المراجع العارية من إدخالات نماذج المزوّدين القادرين على الصور والمكوّنة فقط عندما تكون المطابقة فريدة.
  </Step>
  <Step title="واجهات CLI المحلية (للصوت فقط)">
    واجهات CLI المحلية (إذا كانت مثبتة):

    - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج tiny المضمّن)
    - `whisper` (Python CLI؛ ينزّل النماذج تلقائيًا)

  </Step>
  <Step title="Gemini CLI">
    `gemini` باستخدام `read_many_files`.
  </Step>
  <Step title="مصادقة المزوّد">
    - تُجرَّب إدخالات `models.providers.*` المكوّنة التي تدعم القدرة قبل ترتيب الرجوع الاحتياطي المضمّن.
    - مزوّدو الإعداد الخاصون بالصور فقط الذين لديهم نموذج قادر على الصور يسجلون أنفسهم تلقائيًا لفهم الوسائط حتى عندما لا يكونوا Plugin مورّدًا مضمّنًا.
    - يتوفر فهم الصور في Ollama عند اختياره صراحةً، مثلًا عبر `agents.defaults.imageModel` أو `openclaw infer image describe --model ollama/<vision-model>`.

    ترتيب الرجوع الاحتياطي المضمّن:

    - الصوت: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - الصورة: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - الفيديو: Google → Qwen → Moonshot

  </Step>
</Steps>

لتعطيل الاكتشاف التلقائي، اضبط:

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
اكتشاف الثنائيات هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجودة على `PATH` (نوسّع `~`)، أو اضبط نموذج CLI صريحًا بمسار أمر كامل.
</Note>

### دعم بيئة الوكيل (نماذج المزوّد)

عند تمكين فهم وسائط **الصوت** و**الفيديو** المستند إلى المزوّد، يحترم OpenClaw متغيرات بيئة الوكيل الصادر القياسية لاستدعاءات HTTP الخاصة بالمزوّد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم تُضبط متغيرات بيئة الوكيل، يستخدم فهم الوسائط خروجًا مباشرًا. إذا كانت قيمة الوكيل مشوّهة، يسجل OpenClaw تحذيرًا ويرجع إلى الجلب المباشر.

## القدرات (اختياري)

إذا ضبطت `capabilities`، يعمل الإدخال فقط لتلك أنواع الوسائط. بالنسبة إلى القوائم المشتركة، يمكن لـ OpenClaw استنتاج الافتراضيات:

- `openai`، `anthropic`، `minimax`: **صورة**
- `minimax-portal`: **صورة**
- `moonshot`: **صورة + فيديو**
- `openrouter`: **صورة + صوت**
- `google` (Gemini API): **صورة + صوت + فيديو**
- `qwen`: **صورة + فيديو**
- `mistral`: **صوت**
- `zai`: **صورة**
- `groq`: **صوت**
- `xai`: **صوت**
- `deepgram`: **صوت**
- أي فهرس `models.providers.<id>.models[]` يتضمن نموذجًا قادرًا على الصور: **صورة**

بالنسبة إلى إدخالات CLI، **اضبط `capabilities` صراحةً** لتجنب المطابقات المفاجئة. إذا حذفت `capabilities`، يصبح الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّدين (تكاملات OpenClaw)

| القدرة | تكامل المزوّد                                                                                                         | ملاحظات                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة      | OpenAI، OpenAI Codex OAuth، Codex app-server، OpenRouter، Anthropic، Google، MiniMax، Moonshot، Qwen، Z.AI، مزوّدو الإعداد | تسجّل Plugin المورّدين دعم الصور؛ يمكن لـ `openai/*` استخدام مفتاح API أو توجيه Codex OAuth؛ يستخدم `codex/*` دورة Codex app-server محدودة؛ يستخدم MiniMax وMiniMax OAuth كلاهما `MiniMax-VL-01`؛ يسجّل مزوّدو الإعداد القادرون على الصور أنفسهم تلقائيًا. |
| الصوت      | OpenAI، Groq، xAI، Deepgram، OpenRouter، Google، SenseAudio، ElevenLabs، Mistral                                             | النسخ عبر المزوّد (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| الفيديو      | Google، Qwen، Moonshot                                                                                                       | فهم الفيديو عبر المزوّد من خلال Plugin المورّدين؛ يستخدم فهم الفيديو في Qwen نقاط نهاية Standard DashScope.                                                                                                                            |

<Note>
**ملاحظة MiniMax**

- يأتي فهم الصور في `minimax` و`minimax-cn` و`minimax-portal` و`minimax-portal-cn` من مزود وسائط `MiniMax-VL-01` المملوك للـ Plugin.
- يواصل التوجيه التلقائي للصور استخدام `MiniMax-VL-01` حتى إذا كانت بيانات وصف دردشة MiniMax M2.x القديمة تدّعي دعم إدخال الصور.

</Note>

## إرشادات اختيار النموذج

- فضّل أقوى نموذج من الجيل الأحدث متاح لكل قدرة وسائط عندما تكون الجودة والسلامة مهمتين.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنّب نماذج الوسائط الأقدم أو الأضعف.
- احتفظ بخيار احتياطي واحد على الأقل لكل قدرة لضمان التوفر (نموذج جودة + نموذج أسرع/أرخص).
- خيارات CLI الاحتياطية (`whisper-cli` و`whisper` و`gemini`) مفيدة عندما تكون واجهات API الخاصة بالمزودين غير متاحة.
- ملاحظة `parakeet-mlx`: مع `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الإخراج `txt` (أو غير محدد)؛ أما التنسيقات غير `txt` فتعود إلى stdout.

## سياسة المرفقات

يتحكم `attachments` لكل قدرة في المرفقات التي تُعالَج:

<ParamField path="mode" type='"first" | "all"' default="first">
  ما إذا كان سيُعالَج أول مرفق محدد أم جميعها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  يحدّ عدد العناصر المُعالَجة.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  تفضيل الاختيار بين المرفقات المرشحة.
</ParamField>

عند `mode: "all"`، تُوسَم المخرجات مثل `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - يُغلّف نص الملف المستخرج باعتباره **محتوى خارجيًا غير موثوق** قبل إلحاقه بموجّه الوسائط.
    - تستخدم الكتلة المُحقنة علامات حدود صريحة مثل `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات وصفية `Source: External`.
    - يحذف مسار استخراج المرفقات هذا عمدًا لافتة `SECURITY NOTICE:` الطويلة لتجنب تضخيم موجّه الوسائط؛ وتظل علامات الحدود والبيانات الوصفية موجودة.
    - إذا لم يتضمن الملف أي نص قابل للاستخراج، يحقن OpenClaw `[No extractable text]`.
    - إذا عاد PDF إلى صور صفحات معروضة في هذا المسار، يمرر OpenClaw صور الصفحات هذه إلى نماذج الرد القادرة على الرؤية، ويُبقي العنصر النائب `[PDF content rendered to images]` في كتلة الملف.

  </Accordion>
</AccordionGroup>

## أمثلة التكوين

<Tabs>
  <Tab title="Shared models + overrides">
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
  <Tab title="Audio + video only">
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
  <Tab title="Image-only">
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
  <Tab title="Multi-modal single entry">
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

## إخراج الحالة

عند تشغيل فهم الوسائط، يتضمن `/status` سطر ملخص قصيرًا:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

يعرض هذا النتائج لكل قدرة والمزود/النموذج المختار عند الاقتضاء.

## ملاحظات

- الفهم هو **أفضل جهد ممكن**. لا تمنع الأخطاء الردود.
- لا تزال المرفقات تُمرر إلى النماذج حتى عندما يكون الفهم معطلاً.
- استخدم `scope` لتقييد أماكن تشغيل الفهم (مثل الرسائل المباشرة فقط).

## ذات صلة

- [التكوين](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
