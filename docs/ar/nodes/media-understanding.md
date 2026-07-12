---
read_when:
    - تصميم فهم الوسائط أو إعادة هيكلته
    - ضبط المعالجة المسبقة للصوت والفيديو والصور الواردة
sidebarTitle: Media understanding
summary: فهم الصور/الصوت/الفيديو الواردة (اختياري) مع بدائل احتياطية عبر المزوّد وCLI
title: فهم الوسائط
x-i18n:
    generated_at: "2026-07-12T06:07:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ea61063948ed7d058c3f11f53f7afd443bbb970b0c0cb050f35cfba210ea81b
    source_path: nodes/media-understanding.md
    workflow: 16
---

يمكن لـ OpenClaw تلخيص الوسائط الواردة (الصور/الصوت/الفيديو) قبل تشغيل مسار معالجة الرد، بحيث يعمل تحليل الأوامر وتوجيهها على نص قصير بدلًا من وحدات البايت الخام. يكتشف نظام الفهم تلقائيًا الأدوات المحلية أو مفاتيح المزوّدين، ويمكنك أيضًا تكوين نماذج صريحة. تُسلَّم الوسائط الأصلية دائمًا إلى النموذج كالمعتاد؛ وعند فشل الفهم أو تعطيله، يستمر تدفق الرد دون تغيير.

تسجّل Plugins الخاصة بالمورّدين بيانات تعريف القدرات (أي مزوّد يدعم أي نوع وسائط، والنموذج الافتراضي، والأولوية). تتولى نواة OpenClaw ملكية تكوين `tools.media` المشترك، وترتيب البدائل، والتكامل مع مسار معالجة الرد.

## آلية العمل

<Steps>
  <Step title="جمع المرفقات">
    اجمع المرفقات الواردة (`MediaPaths` و`MediaUrls` و`MediaTypes`).
  </Step>
  <Step title="الاختيار لكل قدرة">
    لكل قدرة مفعّلة (الصور/الصوت/الفيديو)، حدّد المرفقات وفق سياسة `attachments` (الافتراضي: المرفق الأول فقط).
  </Step>
  <Step title="اختيار نموذج">
    اختر أول إدخال نموذج مؤهل (الحجم + القدرة + توفر المصادقة).
  </Step>
  <Step title="الرجوع إلى البديل عند الفشل">
    إذا أعاد نموذج خطأ، أو انتهت مهلته، أو تجاوزت الوسائط `maxBytes`، فجرّب الإدخال التالي.
  </Step>
  <Step title="التطبيق عند النجاح">
    تصبح `Body` كتلة `[Image]` أو `[Audio]` أو `[Video]`. يعيّن الصوت أيضًا `{{Transcript}}`؛ ويستخدم تحليل الأوامر نص التعليق التوضيحي عند توفره، وإلا فيستخدم النص المنسوخ. تُحفظ التعليقات التوضيحية بصيغة `User text:` داخل الكتلة.
  </Step>
</Steps>

## التكوين

يحتوي `tools.media` على قائمة نماذج مشتركة بالإضافة إلى تجاوزات لكل قدرة:

```json5
{
  tools: {
    media: {
      concurrency: 2, // max concurrent capability runs (default)
      models: [/* shared list, gate with capabilities */],
      image: {/* optional overrides */},
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {/* optional overrides */},
    },
  },
}
```

مفاتيح كل قدرة (`image`/`audio`/`video`):

| المفتاح                                         | النوع     | القيمة الافتراضية                                    | ملاحظات                                                                                     |
| ----------------------------------------------- | --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `enabled`                                       | `boolean` | تلقائي (`false` يعطّلها)                             | اضبطه على `false` لإيقاف الاكتشاف التلقائي لهذه القدرة                                      |
| `models`                                        | مصفوفة    | لا شيء                                               | لها الأولوية على قائمة `tools.media.models` المشتركة                                        |
| `prompt`                                        | `string`  | `"Describe the {media}."` (+ إرشادات maxChars)       | للصور/الفيديو فقط افتراضيًا                                                                 |
| `maxChars`                                      | `number`  | `500` (للصور/الفيديو)، غير معيّن (للصوت)             | يُقتطع الناتج إذا أعاد النموذج نصًا أطول                                                     |
| `maxBytes`                                      | `number`  | الصور `10485760`، الصوت `20971520`، الفيديو `52428800` | تتجاوز الوسائط كبيرة الحجم هذا النموذج وتنتقل إلى النموذج التالي                            |
| `timeoutSeconds`                                | `number`  | `60` (للصور/الصوت)، `120` (للفيديو)                  |                                                                                             |
| `language`                                      | `string`  | غير معيّن                                            | تلميح للنسخ الصوتي                                                                          |
| `baseUrl`/`headers`/`providerOptions`/`request` | -         | -                                                    | تجاوزات طلب المزوّد؛ راجع [الأدوات والمزوّدين المخصصين](/ar/gateway/config-tools)              |
| `attachments`                                   | كائن      | `{ mode: "first", maxAttachments: 1 }`               | راجع [سياسة المرفقات](#attachment-policy)                                                    |
| `scope`                                         | كائن      | غير معيّن                                            | التقييد بحسب channel/chatType/keyPrefix                                                      |
| `echoTranscript`                                | `boolean` | `false`                                              | للصوت فقط: إعادة النص المنسوخ إلى المحادثة قبل معالجة الوكيل                                |
| `echoFormat`                                    | `string`  | `'📝 "{transcript}"'`                                | للصوت فقط: العنصر النائب `{transcript}`                                                      |

توضع الخيارات الخاصة بـ Deepgram ضمن `providerOptions.deepgram` (الحقل ذو المستوى الأعلى `deepgram: { detectLanguage, punctuate, smartFormat }` مهمل، لكنه لا يزال مقروءًا).

### إدخالات النماذج

كل إدخال في `models[]` هو إدخال **مزوّد** (افتراضيًا) أو إدخال **CLI**:

<Tabs>
  <Tab title="إدخال مزوّد">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.6-sol",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, for multi-modal shared entries
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

    يمكن لقوالب CLI أيضًا استخدام `{{MediaDir}}` (الدليل الذي يحتوي على ملف الوسائط)، و`{{OutputDir}}` (دليل مؤقت يُنشأ لهذا التشغيل)، و`{{OutputBase}}` (المسار الأساسي للملف المؤقت، دون امتداد).

  </Tab>
</Tabs>

### بيانات اعتماد المزوّد

يستخدم فهم الوسائط عبر المزوّد آلية حل المصادقة نفسها المستخدمة في استدعاءات النماذج العادية: ملفات تعريف المصادقة، ثم متغيرات البيئة، ثم `models.providers.<providerId>.apiKey`. لا تقبل إدخالات `tools.media.*.models[]` حقل `apiKey` مضمنًا.

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

راجع [الأدوات والمزوّدين المخصصين](/ar/gateway/config-tools) للاطلاع على ملفات التعريف، ومتغيرات البيئة، وعناوين URL الأساسية المخصصة.

## القواعد والسلوك

- تتجاوز الوسائط التي تتخطى `maxBytes` ذلك النموذج وتجرّب النموذج التالي.
- تُعامل الملفات الصوتية التي يقل حجمها عن 1024 بايت على أنها فارغة/تالفة، ويجري تخطيها قبل النسخ؛ ويحصل الوكيل بدلًا منها على نص نائب حتمي.
- إذا كان نموذج الصور الأساسي النشط يدعم الرؤية أصلًا، يتخطى OpenClaw كتلة ملخص `[Image]` ويمرر الصورة الأصلية مباشرةً إلى النموذج. يُعد MiniMax استثناءً: توجّه `minimax` و`minimax-cn` و`minimax-portal` و`minimax-portal-cn` دائمًا فهم الصور عبر مزوّد الوسائط `MiniMax-VL-01` المملوك للـPlugin، حتى إذا ادّعت بيانات تعريف محادثة MiniMax M2.x القديمة دعم إدخال الصور (لا تُعامل إلا `MiniMax-M3` والإصدارات اللاحقة على أنها تدعم الرؤية أصلًا).
- إذا كان نموذج Gateway/WebChat الأساسي نصيًا فقط، تُحفظ مرفقات الصور كمراجع `media://inbound/*` مُرحّلة، بحيث تظل أدوات الصور/PDF أو نموذج صور مكوّن قادرة على فحصها بدلًا من فقدان المرفق.
- يشغّل الأمر الصريح `openclaw infer image describe --file <path> --model <provider/model>` (الاسم البديل: `openclaw capability image describe`) ذلك المزوّد/النموذج الداعم للصور مباشرةً، بما في ذلك مراجع Ollama مثل `ollama/qwen2.5vl:7b` عند تكوين نموذج مطابق يدعم الصور ضمن `models.providers.ollama.models[]`.
- إذا لم تكن `<capability>.enabled` مساوية لـ`false` ولم تُكوّن أي نماذج، يجرّب OpenClaw نموذج الرد النشط عندما يدعم مزوّده القدرة.

### الاكتشاف التلقائي (افتراضي)

عندما لا تكون `tools.media.<capability>.enabled` مساوية لـ`false` ولم تُكوّن أي نماذج، يجرّب OpenClaw الخيارات التالية بالترتيب ويتوقف عند أول خيار يعمل:

<Steps>
  <Step title="نموذج الصور المكوّن (للصور فقط)">
    مراجع النموذج الأساسي/البديل في `agents.defaults.imageModel`، ما لم يكن نموذج الرد النشط يدعم الرؤية أصلًا. فضّل مراجع `provider/model`؛ ولا تُؤهّل المراجع المجردة إلا من إدخالات نماذج المزوّد المكوّنة والداعمة للصور عندما تكون المطابقة فريدة.
  </Step>
  <Step title="نموذج الرد النشط">
    نموذج الرد النشط، عندما يدعم مزوّده القدرة.
  </Step>
  <Step title="مصادقة المزوّد (للصوت فقط، قبل أدوات CLI المحلية)">
    تُجرّب إدخالات `models.providers.*` المكوّنة التي تدعم الصوت قبل أدوات CLI المحلية. ترتيب أولوية المزوّدين المضمّنين (تُحسم حالات التعادل أبجديًا بحسب معرّف المزوّد): Groq/OpenAI &rarr; xAI &rarr; Deepgram &rarr; OpenRouter &rarr; Google/SenseAudio &rarr; Deepinfra/ElevenLabs &rarr; Mistral.
  </Step>
  <Step title="أدوات CLI المحلية (للصوت فقط)">
    تصبح الملفات التنفيذية المحلية الجاهزة قائمة بدائل مرتبة:
    - يأتي `whisper-cli` أولًا فقط بعد أن يلاحظ استدعاء نموذج سابق في العملية الحالية استخدام Metal أو CUDA
    - `sherpa-onnx-offline` الافتراضي لوحدة المعالجة المركزية (يتطلب `SHERPA_ONNX_MODEL_DIR` مع `tokens.txt`/`encoder.onnx`/`decoder.onnx`/`joiner.onnx`)
    - `whisper-cli` عندما يكون التسريع ممكنًا في البناء فحسب أو لم يُلاحظ
    - `parakeet-mlx` على Apple Silicon (يدعم MLX، مع عدم ملاحظة استخدام الجهاز)
    - `whisper` (واجهة CLI بلغة Python؛ تستخدم نموذج `turbo` افتراضيًا، وتُنزّله تلقائيًا)

    يُخزّن فحص قدرة الواجهة الخلفية مؤقتًا ولا يحمّل نموذجًا. تظل قدرة البناء، ورايات الواجهة الخلفية المطلوبة، والواجهة الخلفية المرصودة من استدعاء حقيقي منفصلة. يترك whisper.cpp المكتشف تلقائيًا سجلات تشغيل النموذج مفعّلة حتى يمكن تسجيل سطر الواجهة الخلفية المحددة من المنبع. تحتفظ إدخالات CLI الصريحة بترتيبها المكوّن، ورايات الواجهة الخلفية، ورايات الإخراج.

  </Step>
  <Step title="مصادقة المزوّد (للصور/الفيديو)">
    تُجرّب إدخالات `models.providers.*` المكوّنة التي تدعم القدرة قبل ترتيب البدائل المضمّن. يسجّل مزوّدو التكوين المخصصون للصور فقط، والذين لديهم نموذج يدعم الصور، أنفسهم تلقائيًا لفهم الوسائط حتى عندما لا يكونوا Plugin مورّد مضمّنًا.

    ترتيب أولوية المزوّدين المضمّنين (تُحسم حالات التعادل أبجديًا بحسب معرّف المزوّد):
    - الصور: Anthropic/OpenAI &rarr; Google &rarr; MiniMax &rarr; Deepinfra &rarr; MiniMax Portal &rarr; Z.AI
    - الفيديو: Google &rarr; Qwen &rarr; Moonshot

  </Step>
  <Step title="واجهة Antigravity CLI (للصور/الفيديو فقط)">
    أول ملف تنفيذي مثبت من `agy` أو `antigravity` (يمكن التجاوز باستخدام `OPENCLAW_ANTIGRAVITY_CLI`)، ويُشغّل في بيئة معزولة مقيدة بدليل الوسائط.
  </Step>
</Steps>

لتعطيل الاكتشاف التلقائي لقدرة ما:

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
يُنفّذ اكتشاف الملفات التنفيذية بأفضل جهد عبر macOS/Linux/Windows؛ تأكد من وجود CLI ضمن `PATH` (يُوسّع `~`)، أو عيّن إدخال نموذج CLI صريحًا بمسار أمر كامل.
</Note>

### دعم الوكيل (استدعاءات مزوّدي الصوت/الفيديو)

يحترم فهم **الصوت** و**الفيديو** المستند إلى المزوّد متغيرات بيئة الوكيل القياسية للاتصالات الصادرة، بما في ذلك قواعد التجاوز `NO_PROXY`/`no_proxy`:‏ `HTTPS_PROXY` و`HTTP_PROXY` و`ALL_PROXY` و`https_proxy` و`http_proxy` و`all_proxy`. تكون للمتغيرات ذات الأحرف الصغيرة أولوية على نظيراتها ذات الأحرف الكبيرة. إذا لم يُعيّن أي منها، يستخدم فهم الوسائط اتصالًا صادرًا مباشرًا؛ وإذا كانت قيمة الوكيل غير صالحة، يسجّل OpenClaw تحذيرًا ويعود إلى الجلب المباشر. لا يمر فهم الصور عبر مسار الوكيل هذا.

## القدرات

عيّن `capabilities` في إدخال `models[]` لتقييده بأنواع وسائط محددة. بالنسبة إلى القوائم المشتركة، يستنتج OpenClaw القيم الافتراضية لكل مزوّد مضمّن:

| المزوّد                                                                  | الإمكانات                 |
| ------------------------------------------------------------------------ | ------------------------- |
| `openai`, `anthropic`, `minimax`                                         | صورة                      |
| `minimax-portal`                                                         | صورة                      |
| `moonshot`                                                               | صورة + فيديو              |
| `openrouter`                                                             | صورة + صوت                |
| `google` (واجهة Gemini البرمجية)                                         | صورة + صوت + فيديو        |
| `qwen`                                                                   | صورة + فيديو              |
| `deepinfra`                                                              | صورة + صوت                |
| `mistral`                                                                | صوت                       |
| `zai`                                                                    | صورة                      |
| `groq`, `xai`, `deepgram`, `senseaudio`                                  | صوت                       |
| أي كتالوج `models.providers.<id>.models[]` يتضمن نموذجًا يدعم الصور      | صورة                      |

بالنسبة إلى إدخالات CLI، عيّن `capabilities` صراحةً لتجنب المطابقات غير المتوقعة؛ وإذا حُذفت، يصبح الإدخال مؤهلًا لكل قائمة إمكانات يظهر فيها.

## مصفوفة دعم المزوّدين

| الإمكانية | المزوّدون                                                                                                                                               | ملاحظات                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الصورة     | Anthropic، وخادم تطبيق Codex، وDeepinfra، وGoogle، وMiniMax، وMiniMax Portal، وMoonshot، وOpenAI، وOpenAI Codex OAuth، وOpenRouter، وQwen، وZ.AI، ومزوّدو الإعدادات | تسجّل Plugins الخاصة بالمورّدين دعم الصور؛ ويمكن لـ `openai/*` استخدام مفتاح API أو توجيه Codex OAuth؛ ويستخدم `codex/*` دورة محدودة لخادم تطبيق Codex؛ ويُسجَّل تلقائيًا مزوّدو الإعدادات الذين يدعمون الصور. |
| الصوت      | Deepgram، وDeepinfra، وElevenLabs، وGoogle، وGroq، وMistral، وOpenAI، وOpenRouter، وSenseAudio، وxAI                                                             | النسخ الصوتي عبر المزوّد (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                   |
| الفيديو    | Google، وMoonshot، وQwen                                                                                                                                  | فهم الفيديو عبر Plugins الخاصة بالمورّدين؛ ويستخدم فهم الفيديو في Qwen نقاط نهاية DashScope القياسية.                                                                                                  |

<Note>
**ملاحظة MiniMax**: يأتي فهم الصور في `minimax` و`minimax-cn` و`minimax-portal` و`minimax-portal-cn` دائمًا من مزوّد الوسائط `MiniMax-VL-01` المملوك للـ Plugin، حتى إذا زعمت بيانات دردشة MiniMax M2.x القديمة دعم إدخال الصور.
</Note>

## إرشادات اختيار النموذج

- فضّل أقوى نموذج من الجيل الحالي لكل إمكانية وسائط عندما تكون الجودة والسلامة مهمتين.
- بالنسبة إلى الوكلاء المزوّدين بأدوات والذين يتعاملون مع مدخلات غير موثوقة، تجنب نماذج الوسائط الأقدم أو الأضعف.
- احتفظ بخيار احتياطي واحد على الأقل لكل إمكانية لضمان التوافر (نموذج عالي الجودة + نموذج أسرع أو أقل تكلفة).
- تساعد خيارات CLI الاحتياطية (`whisper-cli` و`whisper` و`gemini`) عندما تكون واجهات المزوّدين البرمجية غير متاحة.
- أوضاع إخراج الملفات المعروفة هي المرجع الحاسم: إذا كان ملف النص المنسوخ المستنتج فارغًا أو مفقودًا، فلن يُنتج أي نص منسوخ بدلًا من الرجوع إلى مخرجات تقدم CLI.
- `parakeet-mlx`: استخدم `--output-format txt` (أو `all`) مع `--output-dir` وقالب الإخراج الافتراضي `{filename}`. تُحترم أيضًا متغيرات البيئة `PARAKEET_OUTPUT_FORMAT` و`PARAKEET_OUTPUT_TEMPLATE` الخاصة بالمشروع الأصلي. يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt`؛ ويستمر تنسيق `srt` الافتراضي والتنسيقات الأخرى وقوالب الإخراج المخصصة في استخدام stdout.

## سياسة المرفقات

يتحكم `attachments` الخاص بكل إمكانية في المرفقات التي تتم معالجتها:

<ParamField path="mode" type='"first" | "all"' default="first">
  عالج أول مرفق محدد فقط، أو عالجها كلها.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  حدد الحد الأقصى لعدد المرفقات التي تتم معالجتها.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  تفضيل الاختيار بين المرفقات المرشحة.
</ParamField>

عندما تكون `mode: "all"`، تُوسم المخرجات بـ `[الصورة 1/2]` و`[الصوت 2/2]` وما إلى ذلك.

### استخراج مرفقات الملفات

- يُغلَّف نص الملف المستخرج بوصفه محتوى خارجيًا غير موثوق قبل إلحاقه بموجّه الوسائط، باستخدام علامات حدود مثل `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` إضافةً إلى سطر البيانات الوصفية `Source: External`.
- يحذف هذا المسار عمدًا لافتة `SECURITY NOTICE:` الطويلة للحفاظ على قِصر موجّه الوسائط؛ وتظل علامات الحدود والبيانات الوصفية مطبقة.
- يحصل الملف الذي لا يحتوي على نص قابل للاستخراج على `[لا يوجد نص قابل للاستخراج]`.
- إذا لجأ ملف PDF إلى صور الصفحات المعروضة، يمرر OpenClaw تلك الصور إلى نماذج الرد التي تدعم الرؤية، ويُبقي العنصر النائب `[تم عرض محتوى PDF على هيئة صور]` في كتلة الملف.

## أمثلة الإعداد

<Tabs>
  <Tab title="النماذج المشتركة + التجاوزات">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.6-sol", capabilities: ["image"] },
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
  <Tab title="الصورة فقط">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.6-sol" },
              { provider: "anthropic", model: "claude-opus-4-8" },
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

عند تشغيل فهم الوسائط، يتضمن `/status` سطر ملخص لكل إمكانية:

```
📎 Media: image ok (openai/gpt-5.6-sol) · audio ok (whisper-cli observed=metal)
```

لجرد الفحص التمهيدي، شغّل `openclaw capability audio providers`. تعرض الصفوف المحلية الفائز الاحتياطي المحلي بصورة منفصلة عن اختيار المزوّد العام، والجاهزية، وحقول الخلفية المنفصلة التي توضح القادر والمطلوب والمُلاحظ. يتوفر الاختيار المحلي نفسه أيضًا بوصفه نتيجة معلوماتية من doctor:

```bash
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

## ملاحظات

- يتم الفهم وفق أفضل جهد ممكن. ولا تمنع الأخطاء إرسال الردود.
- تظل المرفقات تُمرَّر إلى النماذج حتى عندما يكون الفهم معطلًا.
- استخدم `scope` لتقييد مواضع تشغيل الفهم (على سبيل المثال، في الرسائل المباشرة فقط).

## ذو صلة

- [الإعداد](/ar/gateway/configuration)
- [دعم الصور والوسائط](/ar/nodes/images)
