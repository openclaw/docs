---
read_when:
    - تصميم فهم الوسائط أو إعادة هيكلته
    - ضبط المعالجة المسبقة للصوت/الفيديو/الصور الواردة
sidebarTitle: Media understanding
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع بدائل احتياطية للمزوّد + CLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-05-12T08:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d58141ac1591890a4eb2c5cdcbc1bf19727fb0c3a1d4d0a912c6bb19d3f3592
    source_path: nodes/media-understanding.md
    workflow: 16
---

يمكن لـ OpenClaw **تلخيص الوسائط الواردة** (الصور/الصوت/الفيديو) قبل تشغيل مسار الرد. يكتشف تلقائيًا متى تكون الأدوات المحلية أو مفاتيح المزوّدين متاحة، ويمكن تعطيله أو تخصيصه. إذا كان الفهم متوقفًا، فستظل النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

تُسجَّل سلوكيات الوسائط الخاصة بالمورّدين بواسطة Plugins المورّدين، بينما يمتلك قلب OpenClaw إعداد `tools.media` المشترك، وترتيب الرجوع الاحتياطي، والتكامل مع مسار الرد.

## الأهداف

- اختياري: تلخيص الوسائط الواردة مسبقًا إلى نص قصير لتوجيه أسرع + تحليل أوامر أفضل.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات API للمزوّدين** و**بدائل CLI**.
- السماح بنماذج متعددة مع رجوع احتياطي مرتب (خطأ/حجم/مهلة).

## السلوك عالي المستوى

<Steps>
  <Step title="جمع المرفقات">
    اجمع المرفقات الواردة (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="الاختيار لكل قدرة">
    لكل قدرة مفعّلة (صورة/صوت/فيديو)، اختر المرفقات حسب السياسة (الافتراضي: **الأول**).
  </Step>
  <Step title="اختيار النموذج">
    اختر أول إدخال نموذج مؤهل (الحجم + القدرة + المصادقة).
  </Step>
  <Step title="الرجوع الاحتياطي عند الفشل">
    إذا فشل نموذج أو كانت الوسائط كبيرة جدًا، **ارجع إلى الإدخال التالي**.
  </Step>
  <Step title="تطبيق كتلة النجاح">
    عند النجاح:

    - يصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
    - يضبط الصوت `{{Transcript}}`؛ يستخدم تحليل الأوامر نص التعليق عند وجوده، وإلا يستخدم النص المنسوخ.
    - تُحفَظ التعليقات كـ `User text:` داخل الكتلة.

  </Step>
</Steps>

إذا فشل الفهم أو كان معطّلًا، **يستمر تدفق الرد** مع النص الأصلي + المرفقات.

## نظرة عامة على الإعدادات

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل قدرة:

<AccordionGroup>
  <Accordion title="مفاتيح المستوى الأعلى">
    - `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للتقييد).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - القيم الافتراضية (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - تجاوزات المزوّد (`baseUrl`, `headers`, `providerOptions`)
      - خيارات صوت Deepgram عبر `tools.media.audio.providerOptions.deepgram`
      - عناصر التحكم في صدى النص المنسوخ للصوت (`echoTranscript`، الافتراضي `false`؛ `echoFormat`)
      - **قائمة `models` لكل قدرة** اختيارية (مفضلة قبل النماذج المشتركة)
      - سياسة `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (تقييد اختياري حسب القناة/نوع المحادثة/مفتاح الجلسة)
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

    يمكن لقوالب CLI أيضًا استخدام:

    - `{{MediaDir}}` (الدليل الذي يحتوي ملف الوسائط)
    - `{{OutputDir}}` (دليل مؤقت يُنشأ لهذا التشغيل)
    - `{{OutputBase}}` (مسار أساس الملف المؤقت، من دون امتداد)

  </Tab>
</Tabs>

## القيم الافتراضية والحدود

القيم الافتراضية الموصى بها:

- `maxChars`: **500** للصورة/الفيديو (قصير ومناسب للأوامر)
- `maxChars`: **غير مضبوط** للصوت (النص المنسوخ كاملًا ما لم تضبط حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

<AccordionGroup>
  <Accordion title="القواعد">
    - إذا تجاوزت الوسائط `maxBytes`، يتم تخطي ذلك النموذج وتجربة **النموذج التالي**.
    - تُعامل ملفات الصوت الأصغر من **1024 بايت** على أنها فارغة/تالفة ويتم تخطيها قبل النسخ عبر المزوّد/CLI؛ ويتلقى سياق الرد الوارد نصًا منسوخًا بديلًا حتميًا حتى يعرف الوكيل أن الملاحظة كانت صغيرة جدًا.
    - إذا أعاد النموذج أكثر من `maxChars`، يتم اقتطاع الناتج.
    - تكون قيمة `prompt` الافتراضية عبارة بسيطة مثل "Describe the {media}." بالإضافة إلى إرشاد `maxChars` (للصور/الفيديو فقط).
    - إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلاً، يتخطى OpenClaw كتلة ملخص `[Image]` ويمرر الصورة الأصلية إلى النموذج بدلًا من ذلك.
    - إذا كان نموذج Gateway/WebChat الأساسي نصيًا فقط، تُحفَظ مرفقات الصور كمراجع `media://inbound/*` مُفرغة بحيث لا تزال أدوات الصور/PDF أو نموذج الصور المكوَّن قادرة على فحصها بدلًا من فقدان المرفق.
    - تختلف طلبات `openclaw infer image describe --model <provider/model>` الصريحة: فهي تشغّل ذلك المزوّد/النموذج القادر على الصور مباشرة، بما في ذلك مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
    - إذا كان `<capability>.enabled: true` ولكن لم تُكوَّن أي نماذج، يحاول OpenClaw استخدام **نموذج الرد النشط** عندما يدعم مزوّده القدرة.

  </Accordion>
</AccordionGroup>

### الاكتشاف التلقائي لفهم الوسائط (افتراضي)

إذا لم يتم ضبط `tools.media.<capability>.enabled` على `false` ولم تكن قد كوّنت نماذج، يكتشف OpenClaw تلقائيًا بهذا الترتيب و**يتوقف عند أول خيار عامل**:

<Steps>
  <Step title="نموذج الرد النشط">
    نموذج الرد النشط عندما يدعم مزوّده القدرة.
  </Step>
  <Step title="agents.defaults.imageModel">
    مراجع `agents.defaults.imageModel` الأساسية/الاحتياطية (للصور فقط).
    فضّل مراجع `provider/model`. تُؤهَّل المراجع المجردة من إدخالات نماذج المزوّدين القادرة على الصور والمكوَّنة فقط عندما تكون المطابقة فريدة.
  </Step>
  <Step title="واجهات CLI المحلية (للصوت فقط)">
    واجهات CLI المحلية (إذا كانت مثبتة):

    - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمّن)
    - `whisper` (Python CLI؛ يحمّل النماذج تلقائيًا)

  </Step>
  <Step title="Gemini CLI">
    `gemini` باستخدام `read_many_files`.
  </Step>
  <Step title="مصادقة المزوّد">
    - تُجرَّب إدخالات `models.providers.*` المكوَّنة التي تدعم القدرة قبل ترتيب الرجوع الاحتياطي المضمّن.
    - مزوّدو الإعدادات المخصصون للصور فقط الذين لديهم نموذج قادر على الصور يسجلون تلقائيًا لفهم الوسائط حتى عندما لا يكونون Plugin مورّدًا مضمنًا.
    - يتوفر فهم الصور في Ollama عند اختياره صراحة، على سبيل المثال عبر `agents.defaults.imageModel` أو `openclaw infer image describe --model ollama/<vision-model>`.

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
الاكتشاف الثنائي هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود على `PATH` (نوسّع `~`)، أو اضبط نموذج CLI صريحًا بمسار أمر كامل.
</Note>

### دعم بيئة الوكيل (نماذج المزوّدين)

عند تفعيل فهم وسائط **الصوت** و**الفيديو** المستند إلى المزوّد، يحترم OpenClaw متغيرات بيئة الوكيل الصادرة القياسية لاستدعاءات HTTP الخاصة بالمزوّد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم تُضبط أي متغيرات بيئة للوكيل، يستخدم فهم الوسائط خروجًا مباشرًا. إذا كانت قيمة الوكيل غير صالحة، يسجل OpenClaw تحذيرًا ويرجع إلى الجلب المباشر.

## القدرات (اختياري)

إذا ضبطت `capabilities`، يعمل الإدخال فقط لأنواع الوسائط تلك. بالنسبة إلى القوائم المشتركة، يمكن لـ OpenClaw استنتاج القيم الافتراضية:

- `openai`, `anthropic`, `minimax`: **صورة**
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
- أي كتالوج `models.providers.<id>.models[]` يحتوي نموذجًا قادرًا على الصور: **صورة**

بالنسبة إلى إدخالات CLI، **اضبط `capabilities` صراحة** لتجنب المطابقات المفاجئة. إذا حذفت `capabilities`، يكون الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّدين (تكاملات OpenClaw)

| القدرة | تكامل المزوّد                                                                                                         | ملاحظات                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | تسجّل Plugins المورّدين دعم الصور؛ يستخدم `openai-codex/*` بنية مزوّد OAuth؛ يستخدم `codex/*` دورة محدودة من Codex app-server؛ يستخدم كل من MiniMax وMiniMax OAuth `MiniMax-VL-01`؛ مزوّدو الإعدادات القادرون على الصور يسجلون تلقائيًا. |
| الصوت      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | نسخ عبر المزوّد (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                     |
| الفيديو      | Google, Qwen, Moonshot                                                                                                       | فهم الفيديو عبر المزوّد من خلال Plugins المورّدين؛ يستخدم فهم الفيديو في Qwen نقاط نهاية Standard DashScope.                                                                                                                        |

<Note>
**ملاحظة MiniMax**

- يأتي فهم الصور في `minimax` و`minimax-portal` من مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
- لا يزال كتالوج النصوص المضمّن في MiniMax يبدأ كنصي فقط؛ إدخالات `models.providers.minimax` الصريحة تنشئ مراجع دردشة M2.7 قادرة على الصور.

</Note>

## إرشادات اختيار النموذج

- فضّل أقوى نموذج متاح من أحدث جيل لكل قدرة وسائط عندما تهم الجودة والسلامة.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم/الأضعف.
- احتفظ ببديل احتياطي واحد على الأقل لكل قدرة لضمان التوفر (نموذج جودة + نموذج أسرع/أرخص).
- بدائل CLI (`whisper-cli`, `whisper`, `gemini`) مفيدة عندما لا تكون واجهات API للمزوّدين متاحة.
- ملاحظة `parakeet-mlx`: مع `--output-dir`، يقرأ OpenClaw `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الخرج `txt` (أو غير محدد)؛ أما التنسيقات غير `txt` فتعود إلى stdout.

## سياسة المرفقات

تتحكم `attachments` لكل قدرة في المرفقات التي تتم معالجتها:

<ParamField path="mode" type='"first" | "all"' default="first">
  ما إذا كان سيتمت معالجة أول مرفق محدد أو جميعها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  يحدد الحد الأقصى لعدد العناصر المعالجة.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  تفضيل الاختيار بين المرفقات المرشحة.
</ParamField>

عند استخدام `mode: "all"`، تُوسم المخرجات مثل `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - يُغلَّف نص الملف المستخرج بوصفه **محتوى خارجيًا غير موثوق** قبل إلحاقه بمطالبة الوسائط.
    - تستخدم الكتلة المُدرجة علامات حدود صريحة مثل `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات وصفية `Source: External`.
    - يحذف مسار استخراج المرفقات هذا عمدًا شريط `SECURITY NOTICE:` الطويل لتجنب تضخيم مطالبة الوسائط؛ وتظل علامات الحدود والبيانات الوصفية موجودة.
    - إذا لم يكن في الملف نص قابل للاستخراج، يُدرج OpenClaw العبارة `[No extractable text]`.
    - إذا عاد ملف PDF احتياطيًا إلى صور صفحات معروضة في هذا المسار، تُبقي مطالبة الوسائط العنصر النائب `[PDF content rendered to images; images not forwarded to model]` لأن خطوة استخراج المرفقات هذه تمرر كتلًا نصية، لا صور PDF المعروضة.

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

## مخرجات الحالة

عند تشغيل فهم الوسائط، يتضمن `/status` سطر ملخص قصيرًا:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

يعرض ذلك نتائج كل قدرة والموفر/النموذج المختار عند انطباق ذلك.

## ملاحظات

- الفهم يتم وفق **أفضل جهد ممكن**. لا تمنع الأخطاء الردود.
- تظل المرفقات تُمرر إلى النماذج حتى عندما يكون الفهم معطلًا.
- استخدم `scope` للحد من الأماكن التي يعمل فيها الفهم (مثل الرسائل المباشرة فقط).

## ذو صلة

- [التكوين](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
