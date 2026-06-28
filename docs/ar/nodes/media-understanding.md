---
read_when:
    - تصميم فهم الوسائط أو إعادة هيكلته
    - ضبط المعالجة المسبقة الواردة للصوت/الفيديو/الصور
sidebarTitle: Media understanding
summary: فهم الصور/الصوت/الفيديو الوارد (اختياري) مع بدائل المزوّد + CLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-06-28T06:05:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

يمكن لـ OpenClaw **تلخيص الوسائط الواردة** (الصورة/الصوت/الفيديو) قبل تشغيل مسار الرد. يكتشف تلقائيًا متى تكون الأدوات المحلية أو مفاتيح المزوّد متاحة، ويمكن تعطيله أو تخصيصه. إذا كان الفهم متوقفًا، فستظل النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

تُسجَّل سلوكيات الوسائط الخاصة بالمورّدين بواسطة Plugins المورّدين، بينما يملك نواة OpenClaw إعداد `tools.media` المشترك، وترتيب الرجوع الاحتياطي، وتكامل مسار الرد.

## الأهداف

- اختياري: هضم الوسائط الواردة مسبقًا إلى نص قصير لتسريع التوجيه وتحسين تحليل الأوامر.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات API للمزوّدين** و**بدائل CLI الاحتياطية**.
- السماح بعدة نماذج مع رجوع احتياطي مرتب (خطأ/حجم/مهلة).

## السلوك عالي المستوى

<Steps>
  <Step title="جمع المرفقات">
    اجمع المرفقات الواردة (`MediaPaths`، `MediaUrls`، `MediaTypes`).
  </Step>
  <Step title="اختيار لكل قدرة">
    لكل قدرة مفعّلة (صورة/صوت/فيديو)، اختر المرفقات وفق السياسة (الافتراضي: **الأول**).
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
    - يعيّن الصوت `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص التسمية التوضيحية عند وجوده، وإلا فيستخدم النص المنسوخ.
    - تُحفَظ التسميات التوضيحية كـ `User text:` داخل الكتلة.

  </Step>
</Steps>

إذا فشل الفهم أو كان معطلًا، **يستمر تدفق الرد** مع المتن الأصلي + المرفقات.

## نظرة عامة على الإعدادات

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل قدرة:

<AccordionGroup>
  <Accordion title="مفاتيح المستوى الأعلى">
    - `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للتقييد).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - الافتراضات (`prompt`، `maxChars`، `maxBytes`، `timeoutSeconds`، `language`)
      - تجاوزات المزوّد (`baseUrl`، `headers`، `providerOptions`)
      - خيارات صوت Deepgram عبر `tools.media.audio.providerOptions.deepgram`
      - عناصر التحكم في صدى نص الصوت (`echoTranscript`، الافتراضي `false`؛ `echoFormat`)
      - **قائمة `models` لكل قدرة** اختيارية (مفضلة قبل النماذج المشتركة)
      - سياسة `attachments` (`mode`، `maxAttachments`، `prefer`)
      - `scope` (تقييد اختياري حسب القناة/نوع الدردشة/مفتاح الجلسة)
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

### إدخالات النماذج

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

    - `{{MediaDir}}` (الدليل الذي يحتوي على ملف الوسائط)
    - `{{OutputDir}}` (دليل مؤقت يُنشأ لهذا التشغيل)
    - `{{OutputBase}}` (مسار أساس الملف المؤقت، بلا امتداد)

  </Tab>
</Tabs>

### بيانات اعتماد المزوّد (`apiKey`)

يستخدم فهم الوسائط عبر المزوّدين آلية حل مصادقة المزوّد نفسها المستخدمة في استدعاءات
النماذج العادية: ملفات تعريف المصادقة، ثم متغيرات البيئة، ثم
`models.providers.<providerId>.apiKey`.

لا تقبل إدخالات `tools.media.*.models[]` حقل `apiKey` مضمنًا. يجب أن تكون
قيمة `provider` في إدخال نموذج الوسائط، مثل `openai` أو `moonshot`، لديها
بيانات اعتماد متاحة عبر أحد مصادر مصادقة المزوّد القياسية.

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

## الافتراضات والحدود

الافتراضات الموصى بها:

- `maxChars`: **500** للصورة/الفيديو (قصير ومناسب للأوامر)
- `maxChars`: **غير معيّن** للصوت (النص المنسوخ الكامل ما لم تضبط حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

<AccordionGroup>
  <Accordion title="القواعد">
    - إذا تجاوزت الوسائط `maxBytes`، يُتخطى ذلك النموذج و**تُجرَّب النماذج التالية**.
    - تُعامل ملفات الصوت الأصغر من **1024 بايت** كفارغة/تالفة وتُتخطى قبل النسخ عبر المزوّد/CLI؛ ويتلقى سياق الرد الوارد نصًا منسوخًا بديلًا حتميًا حتى يعرف الوكيل أن الملاحظة كانت صغيرة جدًا.
    - إذا أعاد النموذج أكثر من `maxChars`، يُقص الناتج.
    - يكون `prompt` افتراضيًا على عبارة بسيطة "Describe the {media}." بالإضافة إلى إرشاد `maxChars` (للصور/الفيديو فقط).
    - إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلاً، يتخطى OpenClaw كتلة ملخص `[Image]` ويمرر الصورة الأصلية إلى النموذج بدلًا من ذلك.
    - إذا كان نموذج Gateway/WebChat الأساسي نصيًا فقط، تُحفظ مرفقات الصور كمراجع `media://inbound/*` مُرحّلة بحيث تظل أدوات الصورة/PDF أو نموذج الصورة المضبوط قادرة على فحصها بدل فقدان المرفق.
    - تختلف طلبات `openclaw infer image describe --model <provider/model>` الصريحة: فهي تشغّل ذلك المزوّد/النموذج القادر على الصور مباشرة، بما في ذلك مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
    - إذا كان `<capability>.enabled: true` لكن لم تُضبط أي نماذج، يحاول OpenClaw استخدام **نموذج الرد النشط** عندما يدعم مزوّده القدرة.

  </Accordion>
</AccordionGroup>

### الاكتشاف التلقائي لفهم الوسائط (افتراضي)

إذا لم يُضبط `tools.media.<capability>.enabled` على `false` وكنت لم تضبط نماذج، يكتشف OpenClaw تلقائيًا بهذا الترتيب و**يتوقف عند أول خيار يعمل**:

<Steps>
  <Step title="نموذج الرد النشط">
    نموذج الرد النشط عندما يدعم مزوّده القدرة.
  </Step>
  <Step title="agents.defaults.imageModel">
    مراجع `agents.defaults.imageModel` الأساسية/الاحتياطية (للصور فقط).
    فضّل مراجع `provider/model`. تُؤهَّل المراجع المجردة من إدخالات نماذج المزوّدين القادرة على الصور المضبوطة فقط عندما تكون المطابقة فريدة.
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
    - تُجرَّب إدخالات `models.providers.*` المضبوطة التي تدعم القدرة قبل ترتيب الرجوع الاحتياطي المضمّن.
    - يسجل مزوّدو الإعدادات المخصصون للصور فقط الذين لديهم نموذج قادر على الصور أنفسهم تلقائيًا لفهم الوسائط حتى عندما لا يكونوا Plugin مورّدًا مضمّنًا.
    - يتوفر فهم الصور عبر Ollama عند اختياره صراحة، على سبيل المثال عبر `agents.defaults.imageModel` أو `openclaw infer image describe --model ollama/<vision-model>`.

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
اكتشاف الملفات التنفيذية يعمل بأفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود على `PATH` (نوسّع `~`)، أو اضبط نموذج CLI صريحًا بمسار أمر كامل.
</Note>

### دعم بيئة الوكيل (نماذج المزوّدين)

عند تفعيل فهم الوسائط المعتمد على المزوّدين لكل من **الصوت** و**الفيديو**، يحترم OpenClaw متغيرات بيئة الوكيل القياسية الصادرة لاستدعاءات HTTP الخاصة بالمزوّدين:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم تُضبط أي متغيرات بيئة وكيل، يستخدم فهم الوسائط الخروج المباشر. إذا كانت قيمة الوكيل غير صالحة، يسجل OpenClaw تحذيرًا ويرجع إلى الجلب المباشر.

## القدرات (اختياري)

إذا ضبطت `capabilities`، يعمل الإدخال فقط لأنواع الوسائط تلك. بالنسبة إلى القوائم المشتركة، يمكن لـ OpenClaw استنتاج الافتراضات:

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
- أي كتالوج `models.providers.<id>.models[]` يحتوي على نموذج قادر على الصور: **صورة**

بالنسبة إلى إدخالات CLI، **اضبط `capabilities` صراحة** لتجنب المطابقات المفاجئة. إذا حذفت `capabilities`، يكون الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّدين (تكاملات OpenClaw)

| القدرة | تكامل المزوّد                                                                                                         | ملاحظات                                                                                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة      | OpenAI، OpenAI Codex OAuth، Codex app-server، OpenRouter، Anthropic، Google، MiniMax، Moonshot، Qwen، Z.AI، مزوّدو الإعدادات | تسجل Plugins المورّدين دعم الصور؛ يمكن لـ `openai/*` استخدام مفتاح API أو توجيه Codex OAuth؛ يستخدم `codex/*` دورة Codex app-server محدودة؛ يستخدم MiniMax وMiniMax OAuth كلاهما `MiniMax-VL-01`؛ ويسجل مزوّدو الإعدادات القادرون على الصور أنفسهم تلقائيًا. |
| الصوت      | OpenAI، Groq، xAI، Deepgram، OpenRouter، Google، SenseAudio، ElevenLabs، Mistral                                             | نسخ عبر المزوّد (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                         |
| الفيديو      | Google، Qwen، Moonshot                                                                                                       | فهم الفيديو عبر المزوّد من خلال Plugins المورّدين؛ يستخدم فهم الفيديو في Qwen نقاط نهاية Standard DashScope.                                                                                                                            |

<Note>
**ملاحظة MiniMax**

- يأتي فهم الصور في `minimax` و`minimax-cn` و`minimax-portal` و`minimax-portal-cn` من موفّر الوسائط `MiniMax-VL-01` المملوك للـPlugin.
- يواصل توجيه الصور التلقائي استخدام `MiniMax-VL-01` حتى إذا كانت بيانات تعريف دردشة MiniMax M2.x القديمة تدّعي دعم إدخال الصور.

</Note>

## إرشادات اختيار النموذج

- فضّل أقوى نموذج متاح من أحدث جيل لكل قدرة وسائط عندما تكون الجودة والسلامة مهمتين.
- بالنسبة إلى الوكلاء المفعّلين بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنّب نماذج الوسائط الأقدم أو الأضعف.
- احتفظ بخيار احتياطي واحد على الأقل لكل قدرة لضمان التوافر (نموذج جودة + نموذج أسرع/أرخص).
- تكون بدائل CLI الاحتياطية (`whisper-cli` و`whisper` و`gemini`) مفيدة عندما لا تكون واجهات API الخاصة بالموفّرين متاحة.
- ملاحظة `parakeet-mlx`: مع `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الإخراج `txt` (أو غير محدد)؛ وتعود التنسيقات غير `txt` إلى stdout.

## سياسة المرفقات

تتحكم `attachments` لكل قدرة في المرفقات التي تتم معالجتها:

<ParamField path="mode" type='"first" | "all"' default="first">
  ما إذا كان ستتم معالجة أول مرفق محدد أم جميعها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  حدّ عدد العناصر التي تتم معالجتها.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  تفضيل الاختيار بين المرفقات المرشحة.
</ParamField>

عند `mode: "all"`، تُوسم المخرجات مثل `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

<AccordionGroup>
  <Accordion title="سلوك استخراج مرفقات الملفات">
    - يُغلّف نص الملف المستخرج باعتباره **محتوى خارجيًا غير موثوق** قبل إلحاقه بموجّه الوسائط.
    - تستخدم الكتلة المُحقنة علامات حدود صريحة مثل `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات تعريف `Source: External`.
    - يتعمّد مسار استخراج المرفقات هذا حذف لافتة `SECURITY NOTICE:` الطويلة لتجنّب تضخيم موجّه الوسائط؛ وتبقى علامات الحدود والبيانات التعريفية موجودة.
    - إذا لم يكن في الملف نص قابل للاستخراج، يحقن OpenClaw العبارة `[No extractable text]`.
    - إذا عاد ملف PDF إلى صور صفحات مُصيّرة في هذا المسار، يمرّر OpenClaw صور الصفحات تلك إلى نماذج الرد القادرة على الرؤية ويبقي العنصر النائب `[PDF content rendered to images]` في كتلة الملف.

  </Accordion>
</AccordionGroup>

## أمثلة التكوين

<Tabs>
  <Tab title="النماذج المشتركة + التجاوزات">
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

يعرض هذا النتائج لكل قدرة والموفّر/النموذج المختار عند الاقتضاء.

## ملاحظات

- الفهم يجري **حسب أفضل جهد**. لا تمنع الأخطاء الردود.
- لا تزال المرفقات تُمرَّر إلى النماذج حتى عندما يكون الفهم معطّلًا.
- استخدم `scope` لتحديد مواضع تشغيل الفهم (مثل الرسائل المباشرة فقط).

## ذات صلة

- [التكوين](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
