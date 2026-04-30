---
read_when:
    - تصميم فهم الوسائط أو إعادة هيكلته
    - ضبط المعالجة المسبقة للصوت/الفيديو/الصور الواردة
sidebarTitle: Media understanding
summary: فهم الصور/الصوت/الفيديو الوارد (اختياري) مع بدائل احتياطية عبر المزوّد وCLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-04-30T08:10:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 907cb0c84f7f0ab916ec07f65dcdffcf4f3c280a5c84ae1bc6fdf758d57545dd
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw يمكنه **تلخيص الوسائط الواردة** (صور/صوت/فيديو) قبل تشغيل مسار الرد. يكتشف تلقائيا عندما تكون الأدوات المحلية أو مفاتيح المزوّدين متاحة، ويمكن تعطيله أو تخصيصه. إذا كان الفهم متوقفا، فستظل النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

يتم تسجيل سلوك الوسائط الخاص بكل مورّد بواسطة Plugins الموردين، بينما يمتلك نواة OpenClaw إعدادات `tools.media` المشتركة، وترتيب الرجوع الاحتياطي، والتكامل مع مسار الرد.

## الأهداف

- اختياري: تلخيص الوسائط الواردة مسبقا إلى نص قصير لتوجيه أسرع + تحليل أوامر أفضل.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائما).
- دعم **واجهات API للمزوّدين** و**بدائل CLI**.
- السماح بنماذج متعددة مع رجوع احتياطي مرتّب (خطأ/حجم/مهلة).

## السلوك عالي المستوى

<Steps>
  <Step title="جمع المرفقات">
    اجمع المرفقات الواردة (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="التحديد لكل قدرة">
    لكل قدرة مفعّلة (صورة/صوت/فيديو)، حدّد المرفقات حسب السياسة (الافتراضي: **الأول**).
  </Step>
  <Step title="اختيار النموذج">
    اختر أول إدخال نموذج مؤهل (الحجم + القدرة + المصادقة).
  </Step>
  <Step title="الرجوع الاحتياطي عند الفشل">
    إذا فشل نموذج أو كانت الوسائط كبيرة جدا، **ارجع احتياطيا إلى الإدخال التالي**.
  </Step>
  <Step title="تطبيق كتلة النجاح">
    عند النجاح:

    - يصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
    - يضبط الصوت `{{Transcript}}`؛ يستخدم تحليل الأوامر نص التسمية التوضيحية عند وجوده، وإلا فيستخدم النص المنسوخ.
    - يتم الحفاظ على التسميات التوضيحية كـ `User text:` داخل الكتلة.

  </Step>
</Steps>

إذا فشل الفهم أو كان معطلا، **يستمر تدفق الرد** بالنص الأصلي + المرفقات الأصلية.

## نظرة عامة على الإعدادات

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل قدرة:

<AccordionGroup>
  <Accordion title="مفاتيح المستوى الأعلى">
    - `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للتقييد).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - الإعدادات الافتراضية (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - تجاوزات المزوّد (`baseUrl`, `headers`, `providerOptions`)
      - خيارات صوت Deepgram عبر `tools.media.audio.providerOptions.deepgram`
      - عناصر التحكم في صدى النص المنسوخ للصوت (`echoTranscript`، الافتراضي `false`؛ `echoFormat`)
      - **قائمة `models` لكل قدرة** اختيارية (مفضّلة قبل النماذج المشتركة)
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

يمكن أن يكون كل إدخال `models[]` **مزوّدا** أو **CLI**:

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

    يمكن لقوالب CLI أيضا استخدام:

    - `{{MediaDir}}` (الدليل الذي يحتوي ملف الوسائط)
    - `{{OutputDir}}` (دليل مؤقت يتم إنشاؤه لهذا التشغيل)
    - `{{OutputBase}}` (مسار قاعدة الملف المؤقتة، بلا امتداد)

  </Tab>
</Tabs>

## الإعدادات الافتراضية والحدود

الإعدادات الافتراضية الموصى بها:

- `maxChars`: **500** للصورة/الفيديو (قصير ومناسب للأوامر)
- `maxChars`: **غير معيّن** للصوت (نص منسوخ كامل ما لم تضبط حدا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

<AccordionGroup>
  <Accordion title="القواعد">
    - إذا تجاوزت الوسائط `maxBytes`، يتم تخطي ذلك النموذج وتتم **محاولة النموذج التالي**.
    - تُعامل ملفات الصوت الأصغر من **1024 بايت** كفارغة/تالفة ويتم تخطيها قبل النسخ عبر المزوّد/CLI؛ يتلقى سياق الرد الوارد نصا منسوخا نائبا حتميا حتى يعرف الوكيل أن الملاحظة كانت صغيرة جدا.
    - إذا أعاد النموذج أكثر من `maxChars`، يتم اقتطاع المخرجات.
    - تكون القيمة الافتراضية لـ `prompt` عبارة "Describe the {media}." بسيطة بالإضافة إلى إرشاد `maxChars` (للصورة/الفيديو فقط).
    - إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلا، يتخطى OpenClaw كتلة ملخص `[Image]` ويمرر الصورة الأصلية إلى النموذج بدلا من ذلك.
    - إذا كان نموذج Gateway/WebChat الأساسي نصيا فقط، يتم الحفاظ على مرفقات الصور كمراجع `media://inbound/*` مرحّلة بحيث يمكن لأدوات الصورة/PDF أو نموذج الصورة المضبوط فحصها بدلا من فقدان المرفق.
    - تختلف طلبات `openclaw infer image describe --model <provider/model>` الصريحة: فهي تشغّل ذلك المزوّد/النموذج القادر على الصور مباشرة، بما في ذلك مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
    - إذا كان `<capability>.enabled: true` ولكن لم يتم ضبط أي نماذج، يحاول OpenClaw استخدام **نموذج الرد النشط** عندما يدعم مزوّده القدرة.

  </Accordion>
</AccordionGroup>

### الاكتشاف التلقائي لفهم الوسائط (افتراضي)

إذا لم يتم ضبط `tools.media.<capability>.enabled` على `false` ولم تقم بضبط نماذج، يكتشف OpenClaw تلقائيا بهذا الترتيب و**يتوقف عند أول خيار يعمل**:

<Steps>
  <Step title="نموذج الرد النشط">
    نموذج الرد النشط عندما يدعم مزوّده القدرة.
  </Step>
  <Step title="agents.defaults.imageModel">
    مراجع `agents.defaults.imageModel` الأساسية/الاحتياطية (للصور فقط).
    فضّل مراجع `provider/model`. يتم تأهيل المراجع العارية من إدخالات نماذج المزوّد المضبوطة والقادرة على الصور فقط عندما تكون المطابقة فريدة.
  </Step>
  <Step title="واجهات CLI المحلية (للصوت فقط)">
    واجهات CLI المحلية (إذا كانت مثبتة):

    - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج tiny المضمّن)
    - `whisper` (واجهة Python CLI؛ تنزّل النماذج تلقائيا)

  </Step>
  <Step title="Gemini CLI">
    `gemini` باستخدام `read_many_files`.
  </Step>
  <Step title="مصادقة المزوّد">
    - تتم تجربة إدخالات `models.providers.*` المضبوطة التي تدعم القدرة قبل ترتيب الرجوع الاحتياطي المضمّن.
    - مزوّدو الإعدادات المخصصون للصور فقط مع نموذج قادر على الصور يسجلون تلقائيا لفهم الوسائط حتى عندما لا يكونوا Plugin مورّد مضمّنا.
    - فهم الصور في Ollama متاح عند اختياره صراحة، على سبيل المثال عبر `agents.defaults.imageModel` أو `openclaw infer image describe --model ollama/<vision-model>`.

    ترتيب الرجوع الاحتياطي المضمّن:

    - الصوت: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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
اكتشاف الملفات الثنائية هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود على `PATH` (نوسّع `~`)، أو اضبط نموذج CLI صريحا بمسار أمر كامل.
</Note>

### دعم بيئة الوكيل (نماذج المزوّدين)

عند تمكين فهم وسائط **الصوت** و**الفيديو** المستند إلى المزوّد، يحترم OpenClaw متغيرات بيئة الوكيل الصادر القياسية لاستدعاءات HTTP الخاصة بالمزوّد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم يتم ضبط أي متغيرات بيئة للوكيل، يستخدم فهم الوسائط خروجا مباشرا. إذا كانت قيمة الوكيل مشوّهة، يسجّل OpenClaw تحذيرا ويعود إلى الجلب المباشر.

## القدرات (اختياري)

إذا ضبطت `capabilities`، فلن يعمل الإدخال إلا لأنواع الوسائط تلك. بالنسبة إلى القوائم المشتركة، يمكن لـ OpenClaw استنتاج القيم الافتراضية:

- `openai`, `anthropic`, `minimax`: **صورة**
- `minimax-portal`: **صورة**
- `moonshot`: **صورة + فيديو**
- `openrouter`: **صورة**
- `google` (Gemini API): **صورة + صوت + فيديو**
- `qwen`: **صورة + فيديو**
- `mistral`: **صوت**
- `zai`: **صورة**
- `groq`: **صوت**
- `xai`: **صوت**
- `deepgram`: **صوت**
- أي كتالوج `models.providers.<id>.models[]` مع نموذج قادر على الصور: **صورة**

بالنسبة إلى إدخالات CLI، **اضبط `capabilities` صراحة** لتجنب مطابقات مفاجئة. إذا حذفت `capabilities`، يكون الإدخال مؤهلا للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّدين (تكاملات OpenClaw)

| القدرة | تكامل المزوّد                                                                                                         | ملاحظات                                                                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة      | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, config providers | تسجّل Plugins الموردين دعم الصور؛ يستخدم `openai-codex/*` توصيلات مزوّد OAuth؛ يستخدم `codex/*` دورة Codex app-server محدودة؛ يستخدم كل من MiniMax وMiniMax OAuth `MiniMax-VL-01`؛ يسجل مزوّدو الإعدادات القادرون على الصور تلقائيا. |
| الصوت      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | نسخ المزوّد (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                    |
| الفيديو      | Google, Qwen, Moonshot                                                                                                       | فهم الفيديو عبر المزوّد من خلال Plugins الموردين؛ يستخدم فهم الفيديو في Qwen نقاط نهاية Standard DashScope.                                                                                                                        |

<Note>
**ملاحظة MiniMax**

- يأتي فهم الصور في `minimax` و`minimax-portal` من مزوّد وسائط `MiniMax-VL-01` المملوك لـ Plugin.
- لا يزال كتالوج نصوص MiniMax المضمّن يبدأ كنصي فقط؛ تؤدي إدخالات `models.providers.minimax` الصريحة إلى تفعيل مراجع محادثة M2.7 القادرة على الصور.

</Note>

## إرشادات اختيار النموذج

- فضّل أقوى نموذج من أحدث جيل متاح لكل قدرة وسائط عندما تكون الجودة والسلامة مهمتين.
- بالنسبة إلى الوكلاء الممكّنين بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم/الأضعف.
- احتفظ بخيار رجوع احتياطي واحد على الأقل لكل قدرة لضمان التوفر (نموذج جودة + نموذج أسرع/أرخص).
- بدائل CLI (`whisper-cli`, `whisper`, `gemini`) مفيدة عندما لا تكون واجهات API للمزوّدين متاحة.
- ملاحظة `parakeet-mlx`: مع `--output-dir`، يقرأ OpenClaw `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الإخراج `txt` (أو غير محدد)؛ وتعود التنسيقات غير `txt` إلى stdout.

## سياسة المرفقات

يتحكم `attachments` لكل قدرة في المرفقات التي تتم معالجتها:

<ParamField path="mode" type='"first" | "all"' default="first">
  ما إذا كان يجب معالجة أول مرفق محدد أو جميعها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  حد أقصى لعدد العناصر التي تتم معالجتها.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  تفضيل الاختيار بين المرفقات المرشحة.
</ParamField>

عند استخدام `mode: "all"`، تُوسم المخرجات مثل `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - يُغلَّف نص الملف المستخرج باعتباره **محتوى خارجيًا غير موثوق** قبل إلحاقه بموجّه الوسائط.
    - تستخدم الكتلة المُحقنة علامات حدود صريحة مثل `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات وصفية `Source: External`.
    - يحذف مسار استخراج المرفقات هذا عن قصد لافتة `SECURITY NOTICE:` الطويلة لتجنب تضخيم موجّه الوسائط؛ وتبقى علامات الحدود والبيانات الوصفية موجودة.
    - إذا لم يكن في الملف نص قابل للاستخراج، يحقن OpenClaw `[No extractable text]`.
    - إذا عاد ملف PDF إلى صور صفحات مُصيَّرة في هذا المسار، يحتفظ موجّه الوسائط بالعنصر النائب `[PDF content rendered to images; images not forwarded to model]` لأن خطوة استخراج المرفقات هذه تمرر كتل نصية، لا صور PDF المُصيَّرة.

  </Accordion>
</AccordionGroup>

## أمثلة الإعداد

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

يوضح هذا النتائج لكل قدرة وموفر/نموذج الاختيار عند انطباق ذلك.

## ملاحظات

- الفهم يعمل وفق **أفضل جهد**. لا تمنع الأخطاء إرسال الردود.
- ما زالت المرفقات تُمرر إلى النماذج حتى عند تعطيل الفهم.
- استخدم `scope` لتحديد مواضع تشغيل الفهم (مثلًا الرسائل المباشرة فقط).

## ذات صلة

- [الإعداد](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
