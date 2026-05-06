---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة مستقرة للقدرات بدون واجهة رسومية
summary: واجهة CLI تضع الاستدلال أولاً لسير عمل مدعومة بالمزوّدين تشمل النماذج والصور والصوت وTTS والفيديو والويب والتضمينات
title: واجهة CLI للاستدلال
x-i18n:
    generated_at: "2026-05-06T09:02:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 232bf8165ff74b19aaf84431519d9f9f99f20831420b73935f73ffd9412bd04a
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` هو السطح القياسي عديم الواجهة لسير عمل الاستدلال المدعوم بالمزودين.

وهو يعرض عمدا عائلات القدرات، وليس أسماء RPC الخام الخاصة بـ Gateway ولا معرّفات أدوات الوكيل الخام.

## حوّل infer إلى مهارة

انسخ هذا والصقه في وكيل:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

ينبغي أن تقوم المهارة الجيدة المستندة إلى infer بما يلي:

- ربط نوايا المستخدم الشائعة بأمر infer الفرعي الصحيح
- تضمين بعض أمثلة infer القياسية لسير العمل التي تغطيها
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنب إعادة توثيق سطح infer بالكامل داخل متن المهارة

تغطية المهارات المعتادة التي تركز على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفر `openclaw infer` واجهة CLI واحدة ومتسقة لمهام الاستدلال المدعومة بالمزودين داخل OpenClaw.

الفوائد:

- استخدام المزودين والنماذج المكوّنة بالفعل في OpenClaw بدلا من إعداد أغلفة مخصصة لكل خلفية.
- إبقاء سير عمل النماذج والصور ونسخ الصوت وTTS والفيديو والويب والتضمينات ضمن شجرة أوامر واحدة.
- استخدام شكل مخرجات `--json` ثابت للسكربتات والأتمتة وسير العمل المدفوع بالوكلاء.
- تفضيل سطح OpenClaw رسمي عندما تكون المهمة في جوهرها "تشغيل الاستدلال".
- استخدام المسار المحلي العادي دون الحاجة إلى Gateway لمعظم أوامر infer.

لعمليات التحقق الشاملة من المزودين، فضّل `openclaw infer ...` بعد نجاح اختبارات
المزودين ذات المستوى الأدنى. فهو يمرّن CLI المشحون، وتحميل الإعدادات،
وحل الوكيل الافتراضي، وتفعيل Plugin المضمّن، ووقت تشغيل القدرة المشتركة
قبل إرسال طلب المزود.

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
| تشغيل مطالبة نص/نموذج      | `openclaw infer model run --prompt "..." --json`                                              | يستخدم المسار المحلي العادي افتراضيا                 |
| تشغيل مطالبة نموذج على صور | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | كرر `--file` لمدخلات صور متعددة             |
| إنشاء صورة            | `openclaw infer image generate --prompt "..." --json`                                         | استخدم `image edit` عند البدء من ملف موجود  |
| وصف ملف صورة       | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | يجب أن يكون `--model` نموذجا قادرا على الصور بصيغة `<provider/model>` |
| نسخ صوت             | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| توليد كلام            | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` موجّه إلى Gateway                      |
| إنشاء فيديو             | `openclaw infer video generate --prompt "..." --json`                                         | يدعم تلميحات المزود مثل `--resolution`        |
| وصف ملف فيديو        | `openclaw infer video describe --file ./clip.mp4 --json`                                      | يجب أن يكون `--model` بصيغة `<provider/model>`                  |
| البحث في الويب               | `openclaw infer web search --query "..." --json`                                              |                                                       |
| جلب صفحة ويب             | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| إنشاء تضمينات            | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## السلوك

- `openclaw infer ...` هو سطح CLI الأساسي لسير العمل هذه.
- استخدم `--json` عندما ستستهلك المخرجات بواسطة أمر أو سكربت آخر.
- استخدم `--provider` أو `--model provider/model` عند الحاجة إلى خلفية محددة.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يشغّل `--model` الصريح ذلك المزود/النموذج مباشرة. يجب أن يكون النموذج قادرا على الصور في كتالوج النماذج أو إعدادات المزود. يشغّل `codex/<model>` دورة فهم صور محدودة عبر خادم تطبيق Codex؛ ويستخدم `openai-codex/<model>` مسار مزود OpenAI Codex OAuth.
- أوامر التنفيذ عديمة الحالة تكون محلية افتراضيا.
- أوامر الحالة المُدارة بواسطة Gateway تستخدم Gateway افتراضيا.
- لا يتطلب المسار المحلي العادي تشغيل Gateway.
- `model run` المحلي هو إكمال مزود لمرة واحدة وخفيف. فهو يحل نموذج الوكيل والمصادقة المكوّنين، لكنه لا يبدأ دورة وكيل دردشة، ولا يحمّل الأدوات، ولا يفتح خوادم MCP المضمّنة.
- يقبل `model run --file` ملفات الصور، ويكتشف نوع MIME الخاص بها، ويرسلها مع المطالبة المقدمة إلى النموذج المحدد. كرر `--file` لصور متعددة.
- يرفض `model run --file` المدخلات غير الصورية. استخدم `infer audio transcribe` لملفات الصوت و`infer video describe` لملفات الفيديو.
- يمرّن `model run --gateway` توجيه Gateway والمصادقة المحفوظة واختيار المزود ووقت التشغيل المضمّن، لكنه ما يزال يعمل كمسبار نموذج خام: فهو يرسل المطالبة المقدمة وأي مرفقات صور دون نص جلسة سابق، أو سياق bootstrap/AGENTS، أو تجميع محرك السياق، أو أدوات، أو خوادم MCP مضمّنة.
- يتطلب `model run --gateway --model <provider/model>` اعتماد Gateway لمشغل موثوق لأن الطلب يطلب من Gateway تشغيل تجاوز مزود/نموذج لمرة واحدة.

## النموذج

استخدم `model` للاستدلال النصي المدعوم بالمزودين وفحص النموذج/المزود.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

استخدم مراجع `<provider/model>` الكاملة لاختبار smoke لمزود محدد دون
بدء Gateway أو تحميل سطح أدوات الوكيل الكامل:

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

- `model run` المحلي هو أضيق اختبار smoke عبر CLI لصحة المزود/النموذج/المصادقة لأنه، بالنسبة إلى مزودي غير Codex، يرسل فقط المطالبة المقدمة إلى النموذج المحدد.
- مسبارات `openai-codex/*` المحلية هي الاستثناء الضيق: يضيف OpenClaw تعليمة نظامية دنيا كي يتمكن نقل Codex Responses من تعبئة حقل `instructions` المطلوب، دون إضافة سياق وكيل كامل أو أدوات أو ذاكرة أو نص جلسة.
- يحافظ `model run --file` المحلي على ذلك المسار الخفيف ويرفق محتوى الصورة مباشرة برسالة المستخدم الواحدة. تعمل ملفات الصور الشائعة مثل PNG وJPEG وWebP عندما يُكتشف نوع MIME الخاص بها كـ `image/*`؛ وتفشل الملفات غير المدعومة أو غير المعروفة قبل استدعاء المزود.
- يكون `model run --file` أفضل عندما تريد اختبار نموذج النص متعدد الوسائط المحدد مباشرة. استخدم `infer image describe` عندما تريد اختيار مزود فهم الصور في OpenClaw وتوجيه نموذج الصور الافتراضي.
- يجب أن يدعم النموذج المحدد إدخال الصور؛ قد ترفض النماذج النصية فقط الطلب على طبقة المزود.
- يجب أن يحتوي `model run --prompt` على نص غير فارغ؛ تُرفض المطالبات الفارغة قبل استدعاء المزودين المحليين أو Gateway.
- يخرج `model run` المحلي بقيمة غير صفرية عندما لا يعيد المزود أي مخرجات نصية، بحيث لا تبدو المزودات المحلية غير القابلة للوصول والإكمالات الفارغة كمسبارات ناجحة.
- استخدم `model run --gateway` عندما تحتاج إلى اختبار توجيه Gateway، أو إعداد وقت تشغيل الوكيل، أو حالة المزود المُدارة بواسطة Gateway مع إبقاء إدخال النموذج خاما. استخدم `openclaw agent` أو أسطح الدردشة عندما تريد سياق الوكيل الكامل والأدوات والذاكرة ونص الجلسة.
- تدير `model auth login` و`model auth logout` و`model auth status` حالة مصادقة المزود المحفوظة.

## الصورة

استخدم `image` للإنشاء والتحرير والوصف.

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
  `--model openai/gpt-image-1.5` لمخرجات PNG من OpenAI بخلفية شفافة؛
  يظل `--openai-background` متاحًا كاسم بديل خاص بـ OpenAI. المزوّدون
  الذين لا يعلنون دعم الخلفية يبلّغون عن التلميح كتجاوز تم تجاهله.
- استخدم `image providers --json` للتحقق من مزوّدي الصور المضمّنين الذين
  يمكن اكتشافهم، وتكوينهم، واختيارهم، وإمكانات الإنشاء/التحرير التي
  يعرضها كل مزوّد.
- استخدم `image generate --model <provider/model> --json` كأضيق اختبار حي
  عبر CLI لتغييرات إنشاء الصور. مثال:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  يبلّغ رد JSON عن `ok` و`provider` و`model` و`attempts` ومسارات المخرجات
  المكتوبة. عند ضبط `--output`، قد يتبع الامتداد النهائي نوع MIME الذي
  أعاده المزوّد.

- بالنسبة إلى `image describe` و`image describe-many`، استخدم `--prompt` لإعطاء نموذج الرؤية تعليمات خاصة بالمهمة مثل OCR أو المقارنة أو فحص الواجهة أو إنشاء تسمية توضيحية موجزة.
- استخدم `--timeout-ms` مع نماذج الرؤية المحلية البطيئة أو بدايات Ollama الباردة.
- بالنسبة إلى `image describe`، يجب أن يكون `--model` نموذج `<provider/model>` يدعم الصور.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة عنصر نائب، على سبيل المثال `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

## الصوت

استخدم `audio` لتفريغ الملفات الصوتية.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

ملاحظات:

- `audio transcribe` مخصص لتفريغ الملفات، وليس لإدارة الجلسات في الوقت الفعلي.
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

- القيمة الافتراضية لـ `tts status` هي Gateway لأنها تعكس حالة TTS التي يديرها Gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لفحص سلوك TTS وتكوينه.

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
- يجب أن يكون `--model` بصيغة `<provider/model>` لـ `video describe`.

## الويب

استخدم `web` لسير عمل البحث والجلب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لفحص المزوّدين المتاحين والمكوّنين والمحددين.

## التضمين

استخدم `embedding` لإنشاء المتجهات وفحص مزوّد التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## مخرجات JSON

توحّد أوامر Infer مخرجات JSON ضمن غلاف مشترك:

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
للأتمتة بدلًا من تحليل stdout المقروء بشريًا.

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
