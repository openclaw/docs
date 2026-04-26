---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة مستقرة لقدرات العمل دون واجهة رسومية
summary: CLI بنهج infer-first لسير عمل النماذج والصور والصوت وTTS والفيديو والويب والتضمين المعتمدة على المزوّدين
title: Inference CLI
x-i18n:
    generated_at: "2026-04-26T11:26:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

يُعد `openclaw infer` الواجهة headless الأساسية لسير عمل الاستدلال المعتمدة على المزوّدين.

وهو يعرض عمدًا عائلات القدرات، وليس أسماء RPC الخام الخاصة بـ Gateway ولا معرّفات أدوات الوكيل الخام.

## حوّل infer إلى مهارة

انسخ هذا والصقه إلى وكيل:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

يجب أن تقوم المهارة الجيدة المبنية على infer بما يلي:

- ربط نوايا المستخدم الشائعة بالأمر الفرعي الصحيح في infer
- تضمين بعض أمثلة infer الأساسية لسير العمل التي تغطيها
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنب إعادة توثيق كامل سطح infer داخل متن المهارة

التغطية المعتادة للمهارات المركزة على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفر `openclaw infer` واجهة CLI موحدة لمهام الاستدلال المعتمدة على المزوّدين داخل OpenClaw.

الفوائد:

- استخدم المزوّدين والنماذج المهيأة بالفعل في OpenClaw بدلًا من توصيل أغلفة مخصصة لكل واجهة خلفية.
- احتفظ بسير عمل النماذج والصور والنسخ الصوتي وTTS والفيديو والويب والتضمين ضمن شجرة أوامر واحدة.
- استخدم بنية خرج `--json` مستقرة للبرامج النصية والأتمتة وسير العمل المعتمدة على الوكلاء.
- فضّل واجهة OpenClaw أصلية عندما تكون المهمة في جوهرها هي "تشغيل استدلال".
- استخدم المسار المحلي المعتاد دون الحاجة إلى Gateway في معظم أوامر infer.

لفحوصات المزوّدين الشاملة من البداية إلى النهاية، فضّل `openclaw infer ...` بمجرد أن تصبح
اختبارات المزوّد ذات المستوى الأدنى ناجحة. فهو يختبر CLI المشحون، وتحميل التهيئة،
وحل الوكيل الافتراضي، وتفعيل Plugin المضمّن، وإصلاح التبعيات وقت التشغيل،
وبيئة القدرات المشتركة قبل تنفيذ طلب المزوّد.

## شجرة الأوامر

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## المهام الشائعة

يربط هذا الجدول بين مهام الاستدلال الشائعة وأمر infer المقابل.

| المهمة                  | الأمر                                                                  | ملاحظات                                              |
| ----------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------- |
| تشغيل مطالبة نصية/نموذج | `openclaw infer model run --prompt "..." --json`                       | يستخدم المسار المحلي المعتاد افتراضيًا               |
| إنشاء صورة              | `openclaw infer image generate --prompt "..." --json`                  | استخدم `image edit` عند البدء من ملف موجود           |
| وصف ملف صورة            | `openclaw infer image describe --file ./image.png --json`              | يجب أن يكون `--model` على شكل `<provider/model>` قادرًا على الصور |
| نسخ صوتي                | `openclaw infer audio transcribe --file ./memo.m4a --json`             | يجب أن يكون `--model` على شكل `<provider/model>`     |
| تركيب كلام              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | إن `tts status` موجّه نحو Gateway                    |
| إنشاء فيديو             | `openclaw infer video generate --prompt "..." --json`                  | يدعم تلميحات المزوّد مثل `--resolution`              |
| وصف ملف فيديو           | `openclaw infer video describe --file ./clip.mp4 --json`               | يجب أن يكون `--model` على شكل `<provider/model>`     |
| البحث في الويب          | `openclaw infer web search --query "..." --json`                       |                                                      |
| جلب صفحة ويب            | `openclaw infer web fetch --url https://example.com --json`            |                                                      |
| إنشاء تضمينات           | `openclaw infer embedding create --text "..." --json`                  |                                                      |

## السلوك

- يُعد `openclaw infer ...` الواجهة الأساسية في CLI لهذه التدفقات.
- استخدم `--json` عندما يكون الخرج سيُستهلك بواسطة أمر أو برنامج نصي آخر.
- استخدم `--provider` أو `--model provider/model` عندما تكون هناك حاجة إلى واجهة خلفية محددة.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- في `image describe`، يؤدي تحديد `--model` صراحة إلى تشغيل ذلك المزوّد/النموذج مباشرة. ويجب أن يكون النموذج قادرًا على التعامل مع الصور في فهرس النماذج أو تهيئة المزوّد. يؤدي `codex/<model>` إلى تشغيل دورة فهم صور محدودة في خادم تطبيق Codex؛ بينما يستخدم `openai-codex/<model>` مسار مزوّد OAuth الخاص بـ OpenAI Codex.
- أوامر التنفيذ عديم الحالة تستخدم المسار المحلي افتراضيًا.
- أوامر الحالة التي يديرها Gateway تستخدم Gateway افتراضيًا.
- لا يتطلب المسار المحلي المعتاد أن يكون Gateway قيد التشغيل.
- `model run` تشغيل لمرة واحدة. يتم إنهاء خوادم MCP التي تُفتح عبر بيئة الوكيل لذلك الأمر بعد الرد سواءً في التنفيذ المحلي أو `--gateway`، لذلك لا تُبقي الاستدعاءات النصية المتكررة عمليات MCP الابنة عبر stdio حيّة.

## النموذج

استخدم `model` للاستدلال النصي المدعوم من المزوّدين وفحص النموذج/المزوّد.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ملاحظات:

- يعيد `model run` استخدام بيئة الوكيل، لذلك تتصرف تجاوزات المزوّد/النموذج كما في تنفيذ الوكيل العادي.
- ولأن `model run` مخصص للأتمتة headless، فهو لا يحتفظ ببيئات MCP المضمّنة الخاصة بكل جلسة بعد انتهاء الأمر.
- تدير الأوامر `model auth login` و`model auth logout` و`model auth status` حالة مصادقة المزوّد المحفوظة.

## الصور

استخدم `image` للإنشاء والتحرير والوصف.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

ملاحظات:

- استخدم `image edit` عند البدء من ملفات إدخال موجودة.
- استخدم `--size` أو `--aspect-ratio` أو `--resolution` مع `image edit` من أجل
  المزوّدين/النماذج التي تدعم تلميحات الأبعاد في عمليات التحرير المعتمدة على الصور المرجعية.
- استخدم `--output-format png --background transparent` مع
  `--model openai/gpt-image-1.5` للحصول على خرج OpenAI PNG بخلفية شفافة؛
  وما يزال `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI. أما المزوّدون
  الذين لا يعلنون دعم الخلفية فيبلغون عن هذا التلميح على أنه تجاوز تم تجاهله.
- استخدم `image providers --json` للتحقق من أي مزوّدي الصور المضمّنين
  يمكن اكتشافهم وتهيئتهم واختيارهم، وما القدرات التي يعرضها كل مزوّد
  في الإنشاء/التحرير.
- استخدم `image generate --model <provider/model> --json` كأضيق
  اختبار حي في CLI لتغييرات إنشاء الصور. مثال:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  يبلّغ رد JSON عن `ok` و`provider` و`model` و`attempts` ومسارات
  الخرج المكتوبة. وعند تعيين `--output`، قد يتبع الامتداد النهائي
  نوع MIME الذي أعاده المزوّد.

- بالنسبة إلى `image describe`، يجب أن يكون `--model` على شكل `<provider/model>` قادرًا على الصور.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة بديلة، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

## الصوت

استخدم `audio` لنسخ الملفات صوتيًا.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

ملاحظات:

- إن `audio transcribe` مخصص لنسخ الملفات صوتيًا، وليس لإدارة الجلسات في الوقت الفعلي.
- يجب أن يكون `--model` على شكل `<provider/model>`.

## TTS

استخدم `tts` لتركيب الكلام وحالة مزوّد TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

ملاحظات:

- يستخدم `tts status` Gateway افتراضيًا لأنه يعكس حالة TTS التي يديرها Gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لفحص سلوك TTS وتهيئته.

## الفيديو

استخدم `video` للإنشاء والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

ملاحظات:

- يقبل `video generate` الوسيطات `--size` و`--aspect-ratio` و`--resolution` و`--duration` و`--audio` و`--watermark` و`--timeout-ms` ويمررها إلى بيئة إنشاء الفيديو.
- يجب أن يكون `--model` على شكل `<provider/model>` في `video describe`.

## الويب

استخدم `web` لسير عمل البحث والجلب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لفحص المزوّدين المتاحين والمهيئين والمحددين.

## التضمين

استخدم `embedding` لإنشاء المتجهات وفحص مزوّدي التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## خرج JSON

تقوم أوامر infer بتوحيد خرج JSON ضمن غلاف مشترك:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

الحقول العليا مستقرة:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

بالنسبة إلى أوامر إنشاء الوسائط، يحتوي `outputs` على الملفات التي كتبها OpenClaw. استخدم
`path` و`mimeType` و`size` وأي أبعاد خاصة بالوسائط داخل هذه المصفوفة
للأتمتة بدلًا من تحليل stdout المقروء بشريًا.

## الأخطاء الشائعة

```bash
# سيئ
openclaw infer media image generate --prompt "friendly lobster"

# جيد
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# سيئ
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# جيد
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## ملاحظات

- `openclaw capability ...` هو اسم بديل لـ `openclaw infer ...`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [النماذج](/ar/concepts/models)
