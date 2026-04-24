---
read_when:
    - تصميم فهم الوسائط أو إعادة هيكلته
    - ضبط المعالجة المسبقة للصور/الصوت/الفيديو الواردة
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع بدائل احتياطية عبر المزوّد وCLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-04-24T07:50:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9eb9449fbc1bed170bbef213aa43d71d4146edbc0dd626ef50af9e044a8e299
    source_path: nodes/media-understanding.md
    workflow: 15
---

# فهم الوسائط - الواردة (2026-01-17)

يمكن لـ OpenClaw **تلخيص الوسائط الواردة** (الصور/الصوت/الفيديو) قبل تشغيل خط أنابيب الرد. وهو يكتشف تلقائيًا متى تكون الأدوات المحلية أو مفاتيح المزوّد متاحة، ويمكن تعطيله أو تخصيصه. وإذا كان الفهم معطّلًا، فستظل النماذج تستقبل الملفات/عناوين URL الأصلية كالمعتاد.

يتم تسجيل سلوك الوسائط الخاص بكل مزوّد بواسطة plugins الخاصة بالمزوّد، بينما
تتولى نواة OpenClaw إعداد `tools.media` المشترك، وترتيب البدائل الاحتياطية،
والتكامل مع خط أنابيب الرد.

## الأهداف

- اختياري: هضم الوسائط الواردة مسبقًا إلى نص قصير من أجل توجيه أسرع + تحليل أوامر أفضل.
- الحفاظ على تسليم الوسائط الأصلية إلى النموذج (دائمًا).
- دعم **واجهات API الخاصة بالمزوّد** و**بدائل CLI الاحتياطية**.
- السماح بعدة نماذج مع بديل احتياطي مرتب (حسب الخطأ/الحجم/المهلة).

## السلوك العام

1. جمع المرفقات الواردة (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. لكل قدرة مفعّلة (صورة/صوت/فيديو)، اختيار المرفقات وفق السياسة (الافتراضي: **الأول**).
3. اختيار أول إدخال نموذج مؤهل (الحجم + القدرة + المصادقة).
4. إذا فشل نموذج أو كانت الوسائط كبيرة جدًا، **يتم الرجوع إلى الإدخال التالي**.
5. عند النجاح:
   - تصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`.
   - يضبط الصوت `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص العنوان التوضيحي عند وجوده،
     وإلا يستخدم transcript.
   - يتم الحفاظ على العناوين التوضيحية كـ `User text:` داخل الكتلة.

إذا فشل الفهم أو كان معطّلًا، **يستمر تدفق الرد** مع body + المرفقات الأصلية.

## نظرة عامة على الإعداد

يدعم `tools.media` **نماذج مشتركة** بالإضافة إلى تجاوزات لكل قدرة:

- `tools.media.models`: قائمة النماذج المشتركة (استخدم `capabilities` للضبط).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - القيم الافتراضية (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - تجاوزات المزوّد (`baseUrl`, `headers`, `providerOptions`)
  - خيارات Deepgram الصوتية عبر `tools.media.audio.providerOptions.deepgram`
  - عناصر التحكم في إظهار transcript للصوت (`echoTranscript`، والافتراضي `false`؛ و`echoFormat`)
  - قائمة `models` **اختيارية لكل قدرة** (تُفضَّل قبل النماذج المشتركة)
  - سياسة `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (ضبط اختياري حسب القناة/نوع الدردشة/مفتاح الجلسة)
- `tools.media.concurrency`: الحد الأقصى للتشغيلات المتزامنة لكل قدرة (الافتراضي **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* القائمة المشتركة */
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

### إدخالات النموذج

يمكن أن يكون كل إدخال في `models[]` من نوع **provider** أو **CLI**:

```json5
{
  type: "provider", // الافتراضي إذا تم حذفه
  provider: "openai",
  model: "gpt-5.5",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // اختياري، يستخدم للإدخالات متعددة الوسائط
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

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
- `{{OutputBase}}` (مسار أساس الملف المؤقت، من دون امتداد)

## القيم الافتراضية والحدود

القيم الافتراضية الموصى بها:

- `maxChars`: **500** للصورة/الفيديو (قصيرة، وملائمة للأوامر)
- `maxChars`: **غير مضبوط** للصوت (transcript كاملة ما لم تضبط حدًا)
- `maxBytes`:
  - الصورة: **10MB**
  - الصوت: **20MB**
  - الفيديو: **50MB**

القواعد:

- إذا تجاوزت الوسائط `maxBytes`، فسيتم تخطي ذلك النموذج وتجربة **النموذج التالي**.
- تُعامل الملفات الصوتية الأصغر من **1024 بايت** على أنها فارغة/معطوبة ويتم تخطيها قبل النسخ عبر المزوّد/CLI.
- إذا أعاد النموذج أكثر من `maxChars`، فسيتم اقتطاع الخرج.
- تكون القيمة الافتراضية لـ `prompt` وصفًا بسيطًا مثل “Describe the {media}.” بالإضافة إلى إرشادات `maxChars` (للصورة/الفيديو فقط).
- إذا كان نموذج الصورة الأساسي النشط يدعم الرؤية أصلاً، فإن OpenClaw
  يتخطى كتلة الملخص `[Image]` ويمرر الصورة الأصلية مباشرة إلى
  النموذج بدلًا من ذلك.
- إذا كان نموذج Gateway/WebChat الأساسي نصيًا فقط، فيتم
  الحفاظ على مرفقات الصور كمرجعيات offloaded من نوع `media://inbound/*` حتى تتمكن أداة الصور أو
  نموذج الصور المُعدّ من فحصها بدل فقدان المرفق.
- أما طلبات `openclaw infer image describe --model <provider/model>` الصريحة
  فهي مختلفة: إذ تشغّل ذلك الـ provider/model القادر على الصور مباشرة،
  بما في ذلك مرجعيات Ollama مثل `ollama/qwen2.5vl:7b`.
- إذا كانت قيمة `<capability>.enabled: true` لكن لم يتم إعداد أي نماذج، فسيحاول OpenClaw
  استخدام **نموذج الرد النشط** عندما يدعم مزوّده تلك القدرة.

### الاكتشاف التلقائي لفهم الوسائط (الافتراضي)

إذا لم تكن قيمة `tools.media.<capability>.enabled` مضبوطة على `false` ولم تكن قد
أعددت نماذج، فإن OpenClaw يكتشف تلقائيًا بهذا الترتيب و**يتوقف عند أول
خيار عامل**:

1. **نموذج الرد النشط** عندما يدعم مزوّده تلك القدرة.
2. مراجع `agents.defaults.imageModel` الأساسية/البديلة (للصور فقط).
3. **واجهات CLI المحلية** (للصوت فقط؛ إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; يستخدم `WHISPER_CPP_MODEL` أو النموذج tiny المضمّن)
   - `whisper` (واجهة Python CLI؛ تنزّل النماذج تلقائيًا)
4. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
5. **مصادقة المزوّد**
   - تتم تجربة إدخالات `models.providers.*` المُعدّة التي تدعم القدرة
     قبل ترتيب البدائل الاحتياطية المضمّنة.
   - يتم تسجيل مزوّدي الإعداد الذين يدعمون الصور فقط ولديهم نموذج قادر على الصور تلقائيًا من أجل
     فهم الوسائط حتى عندما لا يكونون plugin مضمّنة لمزوّد.
   - يصبح فهم الصور عبر Ollama متاحًا عند اختياره صراحةً، على سبيل المثال عبر
     `agents.defaults.imageModel` أو
     `openclaw infer image describe --model ollama/<vision-model>`.
   - ترتيب البدائل الاحتياطية المضمّنة:
     - الصوت: OpenAI → Groq → xAI → Deepgram → Google → Mistral
     - الصورة: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - الفيديو: Google → Qwen → Moonshot

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

ملاحظة: اكتشاف الملفات التنفيذية هو جهد أفضل عبر macOS/Linux/Windows؛ تأكد من وجود CLI على `PATH` (نقوم بتوسيع `~`)، أو اضبط نموذج CLI صريحًا مع المسار الكامل للأمر.

### دعم بيئة proxy (نماذج المزوّد)

عند تفعيل فهم الوسائط **الصوتية** و**الفيديو** المعتمد على المزوّد، يحترم OpenClaw
متغيرات بيئة الـ proxy القياسية الخاصة بخروج HTTP لطلبات المزوّد:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

إذا لم يتم ضبط أي متغيرات proxy env، فسيستخدم فهم الوسائط اتصالًا مباشرًا.
وإذا كانت قيمة proxy غير صالحة، فسيسجل OpenClaw تحذيرًا ويعود إلى الجلب المباشر.

## القدرات (اختيارية)

إذا ضبطت `capabilities`، فلن يعمل الإدخال إلا مع أنواع الوسائط تلك. وفيما يخص القوائم المشتركة،
يمكن لـ OpenClaw استنتاج القيم الافتراضية:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (Gemini API): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- أي كتالوج `models.providers.<id>.models[]` يحتوي على نموذج قادر على الصور:
  **image**

بالنسبة إلى إدخالات CLI، **اضبط `capabilities` صراحةً** لتجنب التطابقات غير المتوقعة.
إذا حذفت `capabilities`، فسيكون الإدخال مؤهلًا للقائمة التي يظهر فيها.

## مصفوفة دعم المزوّد (تكاملات OpenClaw)

| القدرة   | تكامل المزوّد                                                                                                             | الملاحظات                                                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| الصورة   | OpenAI، OpenAI Codex OAuth، Codex app-server، OpenRouter، Anthropic، Google، MiniMax، Moonshot، Qwen، Z.AI، مزوّدو الإعداد | تقوم plugins الخاصة بالمزوّد بتسجيل دعم الصور؛ يستخدم `openai-codex/*` البنية الخاصة بمزوّد OAuth؛ ويستخدم `codex/*` دور Codex app-server محدودًا؛ ويستخدم كل من MiniMax وMiniMax OAuth القيمة `MiniMax-VL-01`؛ كما يتم تسجيل مزوّدي الإعداد القادرين على الصور تلقائيًا. |
| الصوت    | OpenAI، Groq، Deepgram، Google، Mistral                                                                                   | النسخ عبر المزوّد (Whisper/Deepgram/Gemini/Voxtral).                                                                                                                                                                                      |
| الفيديو  | Google، Qwen، Moonshot                                                                                                    | فهم الفيديو عبر المزوّد بواسطة plugins الخاصة بالمزوّد؛ ويستخدم فهم الفيديو في Qwen نقاط نهاية DashScope القياسية.                                                                                                                       |

ملاحظة MiniMax:

- يأتي فهم الصور في `minimax` و`minimax-portal` من
  مزوّد الوسائط `MiniMax-VL-01` المملوك للـ plugin.
- بينما يبدأ كتالوج النصوص المضمّن في MiniMax بنماذج نصية فقط؛ فإن
  إدخالات `models.providers.minimax` الصريحة تُظهِر مراجع دردشة M2.7 القادرة على الصور.

## إرشادات اختيار النموذج

- فضّل أقوى نموذج متاح من أحدث جيل لكل قدرة وسائط عندما تكون الجودة والأمان مهمين.
- بالنسبة إلى الوكلاء المزودين بالأدوات الذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم/الأضعف.
- احتفظ ببديل احتياطي واحد على الأقل لكل قدرة من أجل التوفر (نموذج عالي الجودة + نموذج أسرع/أرخص).
- البدائل الاحتياطية عبر CLI (`whisper-cli`، و`whisper`، و`gemini`) مفيدة عندما لا تكون واجهات API الخاصة بالمزوّد متاحة.
- ملاحظة `parakeet-mlx`: عند استخدام `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون تنسيق الخرج `txt` (أو غير مضبوط)؛ أما التنسيقات غير `txt` فتعود احتياطيًا إلى stdout.

## سياسة المرفقات

تتحكم `attachments` لكل قدرة في المرفقات التي تتم معالجتها:

- `mode`: `first` (الافتراضي) أو `all`
- `maxAttachments`: الحد الأقصى لعدد المرفقات المعالجة (الافتراضي **1**)
- `prefer`: `first`، `last`، `path`، `url`

عند `mode: "all"`، يتم وضع وسوم على المخرجات بالشكل `[Image 1/2]`، و`[Audio 2/2]`، وهكذا.

سلوك استخراج مرفقات الملفات:

- يُغلّف نص الملفات المستخرجة بوصفه **محتوى خارجيًا غير موثوق** قبل
  إلحاقه بمطالبة الوسائط.
- تستخدم الكتلة المحقونة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن
  سطر بيانات وصفية من نوع `Source: External`.
- يتعمد مسار استخراج المرفقات هذا حذف شعار
  `SECURITY NOTICE:` الطويل لتجنب تضخيم مطالبة الوسائط؛ بينما تبقى علامات
  الحدود والبيانات الوصفية موجودة.
- إذا لم يكن للملف نص قابل للاستخراج، فسيحقن OpenClaw القيمة `[No extractable text]`.
- إذا عاد PDF في هذا المسار إلى صور الصفحات المرسومة، فستحتفظ مطالبة الوسائط
  بالعنصر النائب `[PDF content rendered to images; images not forwarded to model]`
  لأن خطوة استخراج المرفقات هذه تمرر كتلًا نصية، وليس صور PDF المرسومة.

## أمثلة الإعداد

### 1) قائمة نماذج مشتركة + تجاوزات

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

### 2) الصوت + الفيديو فقط (الصورة معطلة)

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

### 3) فهم الصورة الاختياري

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

### 4) إدخال واحد متعدد الوسائط (قدرات صريحة)

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

## خرج الحالة

عندما يعمل فهم الوسائط، يتضمن `/status` سطر ملخص قصيرًا:

```text
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

يعرض هذا النتائج لكل قدرة والمزوّد/النموذج المختارين عند الاقتضاء.

## ملاحظات

- الفهم هو **أفضل جهد**. لا تؤدي الأخطاء إلى حجب الردود.
- تستمر المرفقات في المرور إلى النماذج حتى عندما يكون الفهم معطّلًا.
- استخدم `scope` لتقييد الأماكن التي يعمل فيها الفهم (مثل الرسائل الخاصة فقط).

## مستندات ذات صلة

- [الإعداد](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
