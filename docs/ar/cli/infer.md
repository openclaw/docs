---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة مستقرة للقدرات بلا واجهة رسومية
summary: CLI مبنية على الاستدلال أولًا لسير عمل النماذج والصور والصوت وTTS والفيديو والويب والتضمين المدعومة بالمزوّدين
title: CLI الاستدلال
x-i18n:
    generated_at: "2026-05-10T19:31:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05496c5278650c30e5a52dceba105b703258040765f0a3f75268bb514270f15d
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` هو السطح القياسي بلا واجهة رسومية لسير عمل الاستدلال المدعومة بالمزوّدين.

يعرض عمدًا عائلات القدرات، وليس أسماء Gateway RPC الخام ولا معرّفات أدوات الوكيل الخام.

## حوّل infer إلى skill

انسخ هذا والصقه في وكيل:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

ينبغي أن يقوم skill جيد قائم على infer بما يلي:

- ربط مقاصد المستخدم الشائعة بالأمر الفرعي الصحيح في infer
- تضمين بضعة أمثلة قياسية على infer لسير العمل التي يغطيها
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنّب إعادة توثيق سطح infer بأكمله داخل متن skill

التغطية المعتادة للـ skill المركّز على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفر `openclaw infer` واجهة CLI واحدة ومتسقة لمهام الاستدلال المدعومة بالمزوّدين داخل OpenClaw.

الفوائد:

- استخدم المزوّدين والنماذج المكوّنة بالفعل في OpenClaw بدلًا من إنشاء أغلفة مخصصة لمرة واحدة لكل واجهة خلفية.
- أبقِ سير عمل النماذج والصور ونسخ الصوت وTTS والفيديو والويب والتضمينات ضمن شجرة أوامر واحدة.
- استخدم بنية خرج مستقرة مع `--json` للسكربتات والأتمتة وسير العمل المدفوعة بالوكلاء.
- فضّل سطح OpenClaw من الطرف الأول عندما تكون المهمة أساسًا "تشغيل استدلال".
- استخدم المسار المحلي العادي دون الحاجة إلى Gateway لمعظم أوامر infer.

لفحوصات المزوّدين من البداية إلى النهاية، فضّل `openclaw infer ...` بعد أن تصبح اختبارات المزوّد ذات المستوى الأدنى خضراء. فهو يمرّن CLI المشحونة، وتحميل الإعدادات، وحلّ الوكيل الافتراضي، وتفعيل Plugin المضمّن، ووقت تشغيل القدرات المشترك قبل إجراء طلب المزوّد.

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

يربط هذا الجدول مهام الاستدلال الشائعة بأمر infer المقابل.

| المهمة                         | الأمر                                                                                       | الملاحظات                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| تشغيل مطالبة نصية/نموذج      | `openclaw infer model run --prompt "..." --json`                                              | يستخدم المسار المحلي العادي افتراضيًا                 |
| تشغيل مطالبة نموذج على صور | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | كرر `--file` لإدخالات صور متعددة             |
| توليد صورة            | `openclaw infer image generate --prompt "..." --json`                                         | استخدم `image edit` عند البدء من ملف موجود  |
| وصف ملف صورة       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | يجب أن يكون `--model` نموذجًا قادرًا على الصور بصيغة `<provider/model>` |
| نسخ الصوت             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| تركيب الكلام            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` موجّه إلى Gateway                      |
| توليد فيديو             | `openclaw infer video generate --prompt "..." --json`                                         | يدعم تلميحات المزوّد مثل `--resolution`        |
| وصف ملف فيديو        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| البحث في الويب               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| جلب صفحة ويب             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| إنشاء التضمينات            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## السلوك

- `openclaw infer ...` هو سطح CLI الأساسي لسير العمل هذه.
- استخدم `--json` عندما يستهلك أمر آخر أو سكربت الخرج.
- استخدم `--provider` أو `--model provider/model` عندما تكون واجهة خلفية محددة مطلوبة.
- استخدم `model run --thinking <level>` لتمرير مستوى تفكير/استدلال لمرة واحدة (`off` أو `minimal` أو `low` أو `medium` أو `high` أو `adaptive` أو `xhigh` أو `max`) مع إبقاء التشغيل خامًا.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يشغّل `--model` الصريح ذلك المزوّد/النموذج مباشرةً. يجب أن يكون النموذج قادرًا على الصور في كتالوج النماذج أو إعدادات المزوّد. يشغّل `codex/<model>` دورة فهم صور محدودة عبر خادم تطبيق Codex؛ ويستخدم `openai-codex/<model>` مسار مزوّد OpenAI Codex OAuth.
- أوامر التنفيذ عديمة الحالة يكون الإعداد الافتراضي لها محليًا.
- أوامر الحالة المُدارة عبر Gateway يكون الإعداد الافتراضي لها Gateway.
- لا يتطلب المسار المحلي العادي تشغيل Gateway.
- `model run` المحلي هو إكمال مزوّد خفيف لمرة واحدة. يحل نموذج الوكيل والإذن المكوّنين، لكنه لا يبدأ دورة وكيل دردشة، ولا يحمّل أدوات، ولا يفتح خوادم MCP المضمّنة.
- يقبل `model run --file` ملفات الصور، ويكتشف نوع MIME الخاص بها، ويرسلها مع المطالبة المزوّدة إلى النموذج المحدد. كرر `--file` لصور متعددة.
- يرفض `model run --file` الإدخالات غير الصورية. استخدم `infer audio transcribe` لملفات الصوت و`infer video describe` لملفات الفيديو.
- يمرّن `model run --gateway` توجيه Gateway، والإذن المحفوظ، واختيار المزوّد، ووقت التشغيل المضمّن، لكنه يظل يعمل كمسبار نموذج خام: فهو يرسل المطالبة المزوّدة وأي مرفقات صور دون سجل جلسة سابق، أو سياق تمهيد/AGENTS، أو تجميع محرك السياق، أو أدوات، أو خوادم MCP مضمّنة.
- يتطلب `model run --gateway --model <provider/model>` اعتماد Gateway موثوقًا للمشغّل لأن الطلب يطلب من Gateway تشغيل تجاوز مزوّد/نموذج لمرة واحدة.
- يستخدم `model run --thinking` المحلي مسار إكمال المزوّد الخفيف؛ وتُطابَق المستويات الخاصة بالمزوّد مثل `adaptive` و`max` إلى أقرب مستوى إكمال بسيط قابل للنقل.

## النموذج

استخدم `model` للاستدلال النصي المدعوم بالمزوّدين وفحص النماذج/المزوّدين.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

استخدم مراجع `<provider/model>` الكاملة لإجراء اختبار دخان لمزوّد محدد دون بدء Gateway أو تحميل سطح أدوات الوكيل الكامل:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

ملاحظات:

- `model run` المحلي هو أضيق اختبار دخان عبر CLI لصحة المزوّد/النموذج/الإذن لأنه، بالنسبة إلى المزوّدين غير Codex، يرسل فقط المطالبة المزوّدة إلى النموذج المحدد.
- يمكن لـ `model run --model <provider/model>` المحلي استخدام صفوف الكتالوج الثابت المضمّنة الدقيقة من `models list --all` قبل كتابة ذلك المزوّد إلى الإعدادات. لا يزال إذن المزوّد مطلوبًا؛ تفشل بيانات الاعتماد المفقودة كأخطاء إذن، وليس `Unknown model`.
- لمسابير الاستدلال في Mistral Medium 3.5، اترك درجة الحرارة غير مضبوطة/افتراضية. يرفض Mistral `reasoning_effort="high"` مع `temperature: 0`؛ استخدم `mistral/mistral-medium-3-5` مع درجة الحرارة الافتراضية أو قيمة وضع استدلال غير صفرية مثل `0.7`.
- المسابير المحلية `openai-codex/*` هي الاستثناء الضيق: يضيف OpenClaw تعليمة نظامية دنيا حتى يتمكن نقل Codex Responses من ملء حقل `instructions` المطلوب، دون إضافة سياق الوكيل الكامل، أو الأدوات، أو الذاكرة، أو سجل الجلسة.
- يحافظ `model run --file` المحلي على ذلك المسار الخفيف ويرفق محتوى الصورة مباشرةً برسالة المستخدم الواحدة. تعمل ملفات الصور الشائعة مثل PNG وJPEG وWebP عندما يُكتشف نوع MIME الخاص بها على أنه `image/*`؛ تفشل الملفات غير المدعومة أو غير المعروفة قبل استدعاء المزوّد.
- يكون `model run --file` هو الأفضل عندما تريد اختبار نموذج النص متعدد الوسائط المحدد مباشرةً. استخدم `infer image describe` عندما تريد اختيار مزوّد فهم الصور في OpenClaw وتوجيه نموذج الصور الافتراضي.
- يجب أن يدعم النموذج المحدد إدخال الصور؛ قد ترفض النماذج النصية فقط الطلب عند طبقة المزوّد.
- يجب أن يحتوي `model run --prompt` على نص غير فارغ؛ تُرفض المطالبات الفارغة قبل استدعاء المزوّدين المحليين أو Gateway.
- يخرج `model run` المحلي بقيمة غير صفرية عندما لا يعيد المزوّد خرجًا نصيًا، لذلك لا تبدو المزوّدات المحلية غير القابلة للوصول والإكمالات الفارغة كمسابير ناجحة.
- استخدم `model run --gateway` عندما تحتاج إلى اختبار توجيه Gateway، أو إعداد وقت تشغيل الوكيل، أو حالة المزوّد المُدارة عبر Gateway مع إبقاء إدخال النموذج خامًا. استخدم `openclaw agent` أو أسطح الدردشة عندما تريد سياق الوكيل الكامل، والأدوات، والذاكرة، وسجل الجلسة.
- يدير `model auth login` و`model auth logout` و`model auth status` حالة إذن المزوّد المحفوظة.

## الصورة

استخدم `image` للتوليد والتحرير والوصف.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

ملاحظات:

- استخدم `image edit` عند البدء من ملفات إدخال موجودة.
- استخدم `--size` أو `--aspect-ratio` أو `--resolution` مع `image edit` من أجل
  المزوّدين/النماذج التي تدعم تلميحات الهندسة في تعديلات الصور المرجعية.
- استخدم `--output-format png --background transparent` مع
  `--model openai/gpt-image-1.5` للحصول على مخرجات PNG بخلفية شفافة من OpenAI؛
  يبقى `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI. المزوّدون
  الذين لا يعلنون دعم الخلفية يبلّغون عن التلميح كتجاوز متجاهَل.
- استخدم `image providers --json` للتحقق من مزوّدي الصور المضمّنين
  القابلين للاكتشاف والمهيّئين والمحددين، ومن إمكانات التوليد/التحرير
  التي يوفّرها كل مزوّد.
- استخدم `image generate --model <provider/model> --json` كأضيق فحص مباشر عبر
  CLI لتغييرات توليد الصور. مثال:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  يبلّغ رد JSON عن `ok` و`provider` و`model` و`attempts` ومسارات المخرجات
  المكتوبة. عند تعيين `--output`، قد يتبع الامتداد النهائي نوع MIME
  الذي أعاده المزوّد.

- بالنسبة إلى `image describe` و`image describe-many`، استخدم `--prompt` لإعطاء نموذج الرؤية تعليمة خاصة بالمهمة مثل OCR أو المقارنة أو فحص واجهة المستخدم أو التعليق المختصر.
- استخدم `--timeout-ms` مع نماذج الرؤية المحلية البطيئة أو بدايات Ollama الباردة.
- بالنسبة إلى `image describe`، يجب أن يكون `--model` نموذجًا داعمًا للصور بصيغة `<provider/model>`.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة نائبة، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

## الصوت

استخدم `audio` لتفريغ الملفات صوتيًا.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

ملاحظات:

- `audio transcribe` مخصص لتفريغ الملفات صوتيًا، وليس لإدارة الجلسات في الوقت الحقيقي.
- يجب أن يكون `--model` بصيغة `<provider/model>`.

## TTS

استخدم `tts` لتركيب الكلام وحالة مزوّد TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

ملاحظات:

- يستخدم `tts status` قيمة Gateway افتراضيًا لأنه يعكس حالة TTS المُدارة بواسطة Gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لفحص سلوك TTS وتهيئته.

## الفيديو

استخدم `video` للتوليد والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

ملاحظات:

- يقبل `video generate` الخيارات `--size` و`--aspect-ratio` و`--resolution` و`--duration` و`--audio` و`--watermark` و`--timeout-ms` ويمررها إلى وقت تشغيل توليد الفيديو.
- يجب أن يكون `--model` بصيغة `<provider/model>` من أجل `video describe`.

## الويب

استخدم `web` لسير عمل البحث والجلب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لفحص المزوّدين المتاحين والمهيّئين والمحددين.

## التضمين

استخدم `embedding` لإنشاء المتجهات وفحص مزوّد التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## مخرجات JSON

تقوم أوامر Infer بتطبيع مخرجات JSON ضمن غلاف مشترك:

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

بالنسبة إلى أوامر الوسائط المولّدة، يحتوي `outputs` على الملفات التي كتبها OpenClaw. استخدم
`path` و`mimeType` و`size` وأي أبعاد خاصة بالوسائط في تلك المصفوفة
للأتمتة بدلًا من تحليل stdout المقروء للبشر.

## الأخطاء الشائعة

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## ملاحظات

- `openclaw capability ...` هو اسم بديل لـ `openclaw infer ...`.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [النماذج](/ar/concepts/models)
