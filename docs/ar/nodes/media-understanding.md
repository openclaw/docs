---
read_when:
    - تصميم أو إعادة هيكلة فهم الوسائط
    - ضبط المعالجة المسبقة للصوت/الفيديو/الصور الواردة
sidebarTitle: Media understanding
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع آليات fallback للمزوّد وCLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-04-26T11:34:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

يمكن لـ OpenClaw **تلخيص الوسائط الواردة** (الصورة/الصوت/الفيديو) قبل تشغيل مسار الرد. فهو يكتشف تلقائيًا عند توفر الأدوات المحلية أو مفاتيح المزوّدين، ويمكن تعطيله أو تخصيصه. وإذا كان الفهم معطّلًا، تظل النماذج تتلقى الملفات/عناوين URL الأصلية كالمعتاد.

يتم تسجيل سلوك الوسائط الخاص بكل مزوّد بواسطة Plugins الخاصة بالمزوّد، بينما يملك OpenClaw core التهيئة المشتركة `tools.media`، وترتيب fallback، والتكامل مع مسار الرد.

## الأهداف

- اختياري: هضم الوسائط الواردة مسبقًا إلى نص قصير لتوجيه أسرع + تحليل أوامر أفضل.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات API الخاصة بالمزوّدين** و**آليات fallback عبر CLI**.
- السماح بنماذج متعددة مع fallback مرتّب (خطأ/حجم/مهلة).

## السلوك عالي المستوى

<Steps>
  <Step title="جمع المرفقات">
    جمع المرفقات الواردة (`MediaPaths` و`MediaUrls` و`MediaTypes`).
  </Step>
  <Step title="الاختيار لكل قدرة">
    لكل قدرة مفعّلة (صورة/صوت/فيديو)، اختر المرفقات وفق السياسة (الافتراضي: **الأول**).
  </Step>
  <Step title="اختيار النموذج">
    اختر أول إدخال نموذج مؤهل (الحجم + القدرة + المصادقة).
  </Step>
  <Step title="Fallback عند الفشل">
    إذا فشل نموذج أو كانت الوسائط كبيرة جدًا، **فانتقل إلى الإدخال التالي**.
  </Step>
  <Step title="تطبيق كتلة النجاح">
    عند النجاح:

    - تصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
    - يقوم الصوت بتعيين `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص التعليق عند وجوده، وإلا فيستخدم النص المنسوخ.
    - يتم الاحتفاظ بالتعليقات باعتبارها `User text:` داخل الكتلة.

  </Step>
</Steps>

إذا فشل الفهم أو كان معطّلًا، **فإن تدفق الرد يستمر** مع body + المرفقات الأصلية.

## نظرة عامة على التهيئة

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل قدرة:

<AccordionGroup>
  <Accordion title="المفاتيح ذات المستوى الأعلى">
    - `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للضبط).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - الإعدادات الافتراضية (`prompt` و`maxChars` و`maxBytes` و`timeoutSeconds` و`language`)
      - تجاوزات المزوّد (`baseUrl` و`headers` و`providerOptions`)
      - خيارات Deepgram الصوتية عبر `tools.media.audio.providerOptions.deepgram`
      - عناصر التحكم في تكرار النص الصوتي (`echoTranscript`، الافتراضي `false`؛ و`echoFormat`)
      - قائمة `models` **اختيارية لكل قدرة** (مفضلة قبل النماذج المشتركة)
      - سياسة `attachments` ‏(`mode` و`maxAttachments` و`prefer`)
      - `scope` (اختياري للضبط حسب القناة/نوع الدردشة/مفتاح الجلسة)
    - `tools.media.concurrency`: الحد الأقصى للتشغيلات المتزامنة لكل قدرة (الافتراضي **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* قائمة مشتركة */
      ],
      image: {
        /* تجاوزات اختيارية */
      },
      audio: {
        /* تجاوزات اختيارية */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* تجاوزات اختيارية */
      },
    },
  },
}
```

### إدخالات النماذج

يمكن أن يكون كل إدخال `models[]` إما **مزوّدًا** أو **CLI**:

<Tabs>
  <Tab title="إدخال مزوّد">
    ```json5
    {
      type: "provider", // الافتراضي إذا حُذف
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // اختياري، يُستخدم للإدخالات متعددة الوسائط
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
    - `{{OutputDir}}` (دليل مؤقت أُنشئ لهذا التشغيل)
    - `{{OutputBase}}` (المسار الأساسي للملف المؤقت، من دون امتداد)

  </Tab>
</Tabs>

## الإعدادات الافتراضية والحدود

الإعدادات الافتراضية الموصى بها:

- `maxChars`: **500** للصورة/الفيديو (قصير ومناسب للأوامر)
- `maxChars`: **غير معيّن** للصوت (النص الكامل ما لم تعيّن حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

<AccordionGroup>
  <Accordion title="القواعد">
    - إذا تجاوزت الوسائط `maxBytes`، يتم تخطي ذلك النموذج وتجربة **النموذج التالي**.
    - تُعامل الملفات الصوتية الأصغر من **1024 بايت** على أنها فارغة/تالفة ويتم تخطيها قبل النسخ بواسطة المزوّد/CLI؛ ويتلقى سياق الرد الوارد عنصرًا نائبًا محددًا للنص المنسوخ حتى يعلم الوكيل أن الملاحظة كانت صغيرة جدًا.
    - إذا أعاد النموذج أكثر من `maxChars`، يتم اقتطاع الخرج.
    - يكون `prompt` افتراضيًا هو "Describe the {media}." البسيطة مع إرشادات `maxChars` (للصورة/الفيديو فقط).
    - إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلًا، فإن OpenClaw يتخطى كتلة الملخص `[Image]` ويمرر الصورة الأصلية إلى النموذج بدلًا من ذلك.
    - إذا كان النموذج الأساسي في Gateway/WebChat نصيًا فقط، يتم الاحتفاظ بمرفقات الصور بوصفها مراجع `media://inbound/*` منقولة حتى تتمكن أدوات الصورة/PDF أو نموذج الصورة المهيأ من فحصها بدلًا من فقدان المرفق.
    - تختلف طلبات `openclaw infer image describe --model <provider/model>` الصريحة: فهي تشغّل ذلك المزوّد/النموذج القادر على الصور مباشرة، بما في ذلك مراجع Ollama مثل `ollama/qwen2.5vl:7b`.
    - إذا كانت قيمة `<capability>.enabled: true` لكن لم يتم تهيئة أي نماذج، فيحاول OpenClaw استخدام **نموذج الرد النشط** عندما يدعم مزوّده تلك القدرة.

  </Accordion>
</AccordionGroup>

### الاكتشاف التلقائي لفهم الوسائط (الافتراضي)

إذا لم يتم تعيين `tools.media.<capability>.enabled` إلى **`false`** ولم تكن قد هيأت نماذج، يكتشف OpenClaw تلقائيًا بالترتيب التالي و**يتوقف عند أول خيار يعمل**:

<Steps>
  <Step title="نموذج الرد النشط">
    نموذج الرد النشط عندما يدعم مزوّده تلك القدرة.
  </Step>
  <Step title="agents.defaults.imageModel">
    مراجع `agents.defaults.imageModel` الأساسية/الاحتياطية (للصورة فقط).
  </Step>
  <Step title="واجهات CLI المحلية (للصوت فقط)">
    واجهات CLI المحلية (إذا كانت مثبتة):

    - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
    - `whisper-cli` ‏(`whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمّن)
    - `whisper` ‏(Python CLI؛ ينزّل النماذج تلقائيًا)

  </Step>
  <Step title="Gemini CLI">
    `gemini` باستخدام `read_many_files`.
  </Step>
  <Step title="مصادقة المزوّد">
    - تتم تجربة إدخالات `models.providers.*` المهيأة التي تدعم القدرة قبل ترتيب fallback المضمّن.
    - يتم تسجيل المزوّدين المهيئين للصور فقط والذين يملكون نموذجًا قادرًا على الصور تلقائيًا من أجل فهم الوسائط حتى عندما لا يكونون Plugin مضمّنًا للمزوّد.
    - يتوفر فهم الصور في Ollama عند اختياره صراحة، مثلًا عبر `agents.defaults.imageModel` أو `openclaw infer image describe --model ollama/<vision-model>`.

    ترتيب fallback المضمّن:

    - الصوت: OpenAI ← Groq ← xAI ← Deepgram ← Google ← SenseAudio ← ElevenLabs ← Mistral
    - الصورة: OpenAI ← Anthropic ← Google ← MiniMax ← MiniMax Portal ← Z.AI
    - الفيديو: Google ← Qwen ← Moonshot

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
إن اكتشاف الملفات الثنائية يتم بأفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجودة في `PATH` (نقوم بتوسيع `~`)، أو عيّن نموذج CLI صريحًا بمسار أمر كامل.
</Note>

### دعم بيئة proxy (نماذج المزوّد)

عندما يكون فهم الوسائط **الصوتية** و**الفيديو** المعتمد على المزوّد مفعّلًا، يحترم OpenClaw متغيرات بيئة proxy الصادرة القياسية لاستدعاءات HTTP الخاصة بالمزوّد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

إذا لم يتم تعيين أي متغيرات بيئة proxy، يستخدم فهم الوسائط خروجًا مباشرًا. وإذا كانت قيمة proxy غير صحيحة البنية، يسجل OpenClaw تحذيرًا ويعود إلى الجلب المباشر.

## القدرات (اختياري)

إذا عيّنت `capabilities`، فلن يعمل الإدخال إلا لتلك الأنواع من الوسائط. وبالنسبة إلى القوائم المشتركة، يمكن لـ OpenClaw استنتاج الإعدادات الافتراضية:

- `openai` و`anthropic` و`minimax`: **صورة**
- `minimax-portal`: **صورة**
- `moonshot`: **صورة + فيديو**
- `openrouter`: **صورة**
- `google` ‏(Gemini API): **صورة + صوت + فيديو**
- `qwen`: **صورة + فيديو**
- `mistral`: **صوت**
- `zai`: **صورة**
- `groq`: **صوت**
- `xai`: **صوت**
- `deepgram`: **صوت**
- أي فهرس `models.providers.<id>.models[]` يحتوي على نموذج قادر على الصور: **صورة**

بالنسبة إلى إدخالات CLI، **عيّن `capabilities` صراحة** لتجنب المطابقات المفاجئة. وإذا حذفت `capabilities`، يكون الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّدين (تكاملات OpenClaw)

| القدرة   | تكامل المزوّد                                                                                                          | ملاحظات                                                                                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة   | OpenAI، OpenAI Codex OAuth، Codex app-server، OpenRouter، Anthropic، Google، MiniMax، Moonshot، Qwen، Z.AI، ومزوّدو التهيئة | تسجل Plugins الخاصة بالمزوّدين دعم الصور؛ ويستخدم `openai-codex/*` بنية مزوّد OAuth؛ بينما يستخدم `codex/*` دورة محدودة في Codex app-server؛ ويستخدم كل من MiniMax وMiniMax OAuth القيمة `MiniMax-VL-01`؛ كما يتم تسجيل مزوّدي التهيئة القادرين على الصور تلقائيًا. |
| الصوت    | OpenAI، Groq، xAI، Deepgram، Google، SenseAudio، ElevenLabs، Mistral                                                  | نسخ بواسطة المزوّد (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                          |
| الفيديو  | Google، Qwen، Moonshot                                                                                                 | فهم الفيديو عبر المزوّد بواسطة Plugins الخاصة بالمزوّد؛ ويستخدم فهم الفيديو في Qwen نقاط نهاية Standard DashScope.                                                                                                                        |

<Note>
**ملاحظة MiniMax**

- يأتي فهم الصور في `minimax` و`minimax-portal` من مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin.
- لا يزال فهرس النص المضمّن في MiniMax يبدأ كنصي فقط؛ بينما تؤدي إدخالات `models.providers.minimax` الصريحة إلى إظهار مراجع دردشة M2.7 القادرة على الصور.

</Note>

## إرشادات اختيار النموذج

- فضّل أقوى نموذج من أحدث الأجيال متاح لكل قدرة وسائط عندما تكون الجودة والأمان مهمين.
- بالنسبة إلى الوكلاء المفعّلة بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم/الأضعف.
- احتفظ على الأقل بواحد fallback لكل قدرة من أجل التوافر (نموذج جودة + نموذج أسرع/أرخص).
- تُعد آليات fallback عبر CLI ‏(`whisper-cli` و`whisper` و`gemini`) مفيدة عندما لا تكون واجهات API الخاصة بالمزوّدين متاحة.
- ملاحظة `parakeet-mlx`: عند استخدام `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الخرج `txt` (أو غير محدد)؛ أما التنسيقات غير `txt` فتعود إلى stdout.

## سياسة المرفقات

يتحكم `attachments` لكل قدرة في المرفقات التي تتم معالجتها:

<ParamField path="mode" type='"first" | "all"' default="first">
  ما إذا كان يجب معالجة أول مرفق محدد أو جميعها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  يحدّ العدد الذي تتم معالجته.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  تفضيل الاختيار بين المرفقات المرشحة.
</ParamField>

عند استخدام `mode: "all"`، تُوسم المخرجات على النحو `[Image 1/2]` و`[Audio 2/2]` وما إلى ذلك.

<AccordionGroup>
  <Accordion title="سلوك استخراج مرفقات الملفات">
    - يُغلَّف النص المستخرج من الملف على أنه **محتوى خارجي غير موثوق** قبل إضافته إلى مطالبة الوسائط.
    - تستخدم الكتلة المُدخلة علامات حدود صريحة مثل `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات وصفية `Source: External`.
    - يتعمد مسار استخراج المرفقات هذا عدم تضمين الشريط الطويل `SECURITY NOTICE:` لتجنّب تضخيم مطالبة الوسائط؛ ومع ذلك تبقى علامات الحدود والبيانات الوصفية موجودة.
    - إذا لم يكن لدى الملف نص قابل للاستخراج، فإن OpenClaw يدرج `[No extractable text]`.
    - إذا عاد ملف PDF في هذا المسار إلى صور صفحات مُصيَّرة، فإن مطالبة الوسائط تحتفظ بالعنصر النائب `[PDF content rendered to images; images not forwarded to model]` لأن خطوة استخراج المرفقات هذه تمرّر كتلًا نصية، لا صور PDF المُصيَّرة.

  </Accordion>
</AccordionGroup>

## أمثلة الإعداد

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

يوضح هذا النتائج لكل قدرة على حدة، ومزوّد الخدمة/النموذج المختار عند الاقتضاء.

## ملاحظات

- الفهم يتم على أساس **أفضل جهد ممكن**. ولا تمنع الأخطاء الردود.
- لا تزال المرفقات تُمرَّر إلى النماذج حتى عند تعطيل الفهم.
- استخدم `scope` لتقييد المواضع التي يعمل فيها الفهم (مثلًا في الرسائل الخاصة فقط).

## ذو صلة

- [الإعداد](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
