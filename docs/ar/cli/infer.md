---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة مستقرة للقدرات بلا واجهة
summary: واجهة CLI تركّز أولاً على الاستدلال لسير عمل النماذج والصور والصوت وتحويل النص إلى كلام والفيديو والويب والتضمين المدعومة بمزوّدين
title: CLI الاستدلال
x-i18n:
    generated_at: "2026-04-30T07:48:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a154cf11a09f6c60117740f42937da3a0e6942931dde6eee6d902fb6e0ba461
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` هو السطح القياسي عديم الواجهة لسير عمل الاستدلال المدعوم بالمزوّدين.

وهو يعرض عمدًا عائلات القدرات، وليس أسماء Gateway RPC الخام ولا معرّفات أدوات الوكيل الخام.

## حوِّل infer إلى مهارة

انسخ هذا والصقه في وكيل:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

ينبغي أن تقوم المهارة الجيدة المستندة إلى infer بما يلي:

- ربط مقاصد المستخدم الشائعة بأمر infer الفرعي الصحيح
- تضمين بضعة أمثلة قياسية من infer لسير العمل التي تغطيها
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنّب إعادة توثيق سطح infer كاملًا داخل نص المهارة

تغطية المهارة النموذجية المركّزة على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفّر `openclaw infer` واجهة CLI واحدة ومتّسقة لمهام الاستدلال المدعومة بالمزوّدين داخل OpenClaw.

الفوائد:

- استخدم المزوّدين والنماذج المهيّأة مسبقًا في OpenClaw بدلًا من توصيل أغلفة مخصّصة لكل واجهة خلفية.
- أبقِ سير عمل النماذج والصور ونسخ الصوت وTTS والفيديو والويب والتضمينات ضمن شجرة أوامر واحدة.
- استخدم شكل خرج `--json` ثابتًا للسكربتات والأتمتة وسير العمل التي تقودها الوكلاء.
- فضّل سطح OpenClaw من الطرف الأول عندما تكون المهمة في جوهرها "تشغيل استدلال".
- استخدم المسار المحلي المعتاد دون الحاجة إلى Gateway لمعظم أوامر infer.

لفحوصات المزوّد الشاملة، فضّل `openclaw infer ...` بعد أن تصبح اختبارات
المزوّد ذات المستوى الأدنى خضراء. فهو يمرّن CLI المشحون، وتحميل الإعدادات،
وحلّ الوكيل الافتراضي، وتفعيل Plugin المضمّن، وإصلاح اعتماديات وقت التشغيل،
ووقت تشغيل القدرات المشترك قبل إرسال طلب المزوّد.

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

| المهمة                         | الأمر                                                                                       | ملاحظات                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| تشغيل موجّه نصي/نموذج      | `openclaw infer model run --prompt "..." --json`                                              | يستخدم المسار المحلي المعتاد افتراضيًا                 |
| تشغيل موجّه نموذج على صور | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | كرّر `--file` لمدخلات صور متعددة             |
| إنشاء صورة            | `openclaw infer image generate --prompt "..." --json`                                         | استخدم `image edit` عند البدء من ملف موجود  |
| وصف ملف صورة       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | يجب أن يكون `--model` نموذج صور بصيغة `<provider/model>` |
| نسخ الصوت             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| تركيب الكلام            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` موجّه إلى Gateway                      |
| إنشاء فيديو             | `openclaw infer video generate --prompt "..." --json`                                         | يدعم تلميحات المزوّد مثل `--resolution`        |
| وصف ملف فيديو        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| البحث في الويب               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| جلب صفحة ويب             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| إنشاء تضمينات            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## السلوك

- `openclaw infer ...` هو سطح CLI الأساسي لسير العمل هذه.
- استخدم `--json` عندما سيُستهلك الخرج بواسطة أمر أو سكربت آخر.
- استخدم `--provider` أو `--model provider/model` عندما تكون هناك حاجة إلى واجهة خلفية محددة.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يشغّل `--model` الصريح ذلك المزوّد/النموذج مباشرة. يجب أن يكون النموذج قادرًا على الصور في كتالوج النماذج أو إعدادات المزوّد. يشغّل `codex/<model>` دورة محدودة لفهم الصور عبر خادم تطبيق Codex؛ ويستخدم `openai-codex/<model>` مسار مزوّد OpenAI Codex OAuth.
- أوامر التنفيذ عديمة الحالة تكون محلية افتراضيًا.
- أوامر الحالة المدارة بواسطة Gateway تستخدم Gateway افتراضيًا.
- لا يتطلب المسار المحلي المعتاد أن يكون Gateway قيد التشغيل.
- `model run` المحلي هو إكمال مزوّد مباشر وخفيف لمرة واحدة. وهو يحل نموذج الوكيل والمصادقة المهيّئين، لكنه لا يبدأ دورة وكيل محادثة، ولا يحمّل الأدوات، ولا يفتح خوادم MCP المضمّنة.
- يقبل `model run --file` ملفات الصور، ويكتشف نوع MIME الخاص بها، ويرسلها مع الموجّه المقدّم إلى النموذج المحدد. كرّر `--file` لصور متعددة.
- يرفض `model run --file` المدخلات غير الصورية. استخدم `infer audio transcribe` لملفات الصوت و`infer video describe` لملفات الفيديو.
- يمرّن `model run --gateway` توجيه Gateway، والمصادقة المحفوظة، واختيار المزوّد، ووقت التشغيل المضمّن، لكنه يظل يعمل كمسبار نموذج خام: يرسل الموجّه المقدّم وأي مرفقات صور دون سجل جلسة سابق، أو سياق bootstrap/AGENTS، أو تجميع محرك السياق، أو أدوات، أو خوادم MCP مضمّنة.
- يتطلب `model run --gateway --model <provider/model>` اعتماد Gateway لمشغّل موثوق لأن الطلب يطلب من Gateway تشغيل تجاوز مزوّد/نموذج لمرة واحدة.

## النموذج

استخدم `model` للاستدلال النصي المدعوم بالمزوّد وفحص النموذج/المزوّد.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

استخدم مراجع `<provider/model>` الكاملة لإجراء اختبار دخان لمزوّد محدد دون
بدء Gateway أو تحميل سطح أدوات الوكيل كاملًا:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-4.1 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

ملاحظات:

- `model run` المحلي هو أضيق اختبار دخان عبر CLI لصحة المزوّد/النموذج/المصادقة لأنه لا يرسل إلا الموجّه المقدّم إلى النموذج المحدد.
- يحافظ `model run --file` المحلي على ذلك المسار الخفيف ويرفق محتوى الصورة مباشرة برسالة المستخدم الواحدة. تعمل ملفات الصور الشائعة مثل PNG وJPEG وWebP عندما يُكتشف نوع MIME الخاص بها كـ `image/*`؛ أما الملفات غير المدعومة أو غير المتعرّف عليها فتفشل قبل استدعاء المزوّد.
- يكون `model run --file` هو الأفضل عندما تريد اختبار نموذج النص متعدد الوسائط المحدد مباشرة. استخدم `infer image describe` عندما تريد اختيار مزوّد فهم الصور في OpenClaw وتوجيه نموذج الصور الافتراضي.
- يجب أن يدعم النموذج المحدد إدخال الصور؛ قد ترفض نماذج النص فقط الطلب عند طبقة المزوّد.
- يجب أن يحتوي `model run --prompt` على نص غير مكوّن من مسافات بيضاء فقط؛ تُرفض الموجّهات الفارغة قبل استدعاء المزوّدين المحليين أو Gateway.
- يخرج `model run` المحلي بقيمة غير صفرية عندما لا يعيد المزوّد أي خرج نصي، لذلك لا تبدو المزوّدات المحلية غير القابلة للوصول والإكمالات الفارغة كمسبارات ناجحة.
- استخدم `model run --gateway` عندما تحتاج إلى اختبار توجيه Gateway، أو إعداد وقت تشغيل الوكيل، أو حالة المزوّد المدارة بواسطة Gateway مع إبقاء إدخال النموذج خامًا. استخدم `openclaw agent` أو أسطح المحادثة عندما تريد سياق الوكيل الكامل، والأدوات، والذاكرة، وسجل الجلسة.
- تدير `model auth login` و`model auth logout` و`model auth status` حالة مصادقة المزوّد المحفوظة.

## الصورة

استخدم `image` للإنشاء، والتحرير، والوصف.

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
  المزوّدين/النماذج التي تدعم تلميحات الهندسة على تعديلات الصور المرجعية.
- استخدم `--output-format png --background transparent` مع
  `--model openai/gpt-image-1.5` لخرج PNG بخلفية شفافة من OpenAI؛
  يظل `--openai-background` متاحًا كاسم مستعار خاص بـ OpenAI. المزوّدون
  الذين لا يعلنون دعم الخلفية يبلغون عن التلميح كتجاوز تم تجاهله.
- استخدم `image providers --json` للتحقق من مزوّدي الصور المضمّنين
  القابلين للاكتشاف والمهيّئين والمحددين، وما قدرات الإنشاء/التحرير
  التي يعرضها كل مزوّد.
- استخدم `image generate --model <provider/model> --json` كأضيق اختبار دخان حي
  عبر CLI لتغييرات إنشاء الصور. مثال:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  يُبلّغ رد JSON عن `ok` و`provider` و`model` و`attempts` ومسارات
  الإخراج المكتوبة. عند تعيين `--output`، قد يتبع الامتداد النهائي
  نوع MIME الذي يعيده الموفّر.

- بالنسبة إلى `image describe` و`image describe-many`، استخدم `--prompt` لإعطاء نموذج الرؤية تعليمة خاصة بالمهمة مثل OCR أو المقارنة أو فحص واجهة المستخدم أو إنشاء وصف موجز.
- استخدم `--timeout-ms` مع نماذج الرؤية المحلية البطيئة أو بدايات Ollama الباردة.
- بالنسبة إلى `image describe`، يجب أن يكون `--model` نموذجًا يدعم الصور بصيغة `<provider/model>`.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة عنصر نائب، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

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

## تحويل النص إلى كلام

استخدم `tts` لتركيب الكلام وحالة موفّر تحويل النص إلى كلام.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

ملاحظات:

- `tts status` يستخدم Gateway افتراضيًا لأنه يعكس حالة تحويل النص إلى كلام التي يديرها Gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لفحص سلوك تحويل النص إلى كلام وتكوينه.

## الفيديو

استخدم `video` للإنشاء والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

ملاحظات:

- يقبل `video generate` الخيارات `--size` و`--aspect-ratio` و`--resolution` و`--duration` و`--audio` و`--watermark` و`--timeout-ms` ويمررها إلى وقت تشغيل إنشاء الفيديو.
- يجب أن يكون `--model` بصيغة `<provider/model>` بالنسبة إلى `video describe`.

## الويب

استخدم `web` لسير عمل البحث والجلب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لفحص المزودين المتاحين والمكوّنين والمحددين.

## التضمين

استخدم `embedding` لإنشاء المتجهات وفحص مزودي التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## مخرجات JSON

توحّد أوامر infer مخرجات JSON ضمن غلاف مشترك:

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

حقول المستوى الأعلى مستقرة:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

بالنسبة إلى أوامر الوسائط المُنشأة، يحتوي `outputs` على الملفات التي كتبها OpenClaw. استخدم
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

- `openclaw capability ...` هو اسم مستعار لـ `openclaw infer ...`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [النماذج](/ar/concepts/models)
