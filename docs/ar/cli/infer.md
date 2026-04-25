---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة مستقرة للقدرات دون واجهة رسومية
summary: CLI يعتمد الاستدلال أولًا لسير عمل النماذج والصور والصوت وTTS والفيديو والويب والتضمين المدعومة من المزوّد
title: CLI للاستدلال
x-i18n:
    generated_at: "2026-04-25T18:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23242bfa8a354b949473322f47da90876e05a5e54d467ca134f2e59c3ae8bb02
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` هو السطح القياسي دون واجهة رسومية لسير عمل الاستدلال المدعومة من المزوّد.

وهو يعرّض عمدًا عائلات القدرات، وليس أسماء RPC الخام للـ Gateway وليس معرّفات أدوات الوكيل الخام.

## حوّل infer إلى Skill

انسخ هذا والصقه إلى وكيل:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

يجب أن تقوم Skill جيدة مبنية على infer بما يلي:

- ربط نوايا المستخدم الشائعة بالأمر الفرعي الصحيح في infer
- تضمين بعض أمثلة infer القياسية لسير العمل الذي تغطيه
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنّب إعادة توثيق سطح infer بالكامل داخل نص Skill

التغطية النموذجية لـ Skills المركّزة على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفّر `openclaw infer` واجهة CLI موحّدة لمهام الاستدلال المدعومة من المزوّد داخل OpenClaw.

الفوائد:

- استخدم المزوّدات والنماذج المضبوطة بالفعل في OpenClaw بدلًا من توصيل أغلفة مخصّصة منفصلة لكل خلفية.
- اجمع سير عمل النماذج والصور ونسخ الصوت وTTS والفيديو والويب والتضمين تحت شجرة أوامر واحدة.
- استخدم بنية مخرجات `--json` مستقرة للسكربتات والأتمتة وسير العمل المدفوعة بالوكلاء.
- فضّل سطح OpenClaw أصليًا عندما تكون المهمة في جوهرها هي "تشغيل الاستدلال".
- استخدم المسار المحلي المعتاد من دون الحاجة إلى Gateway لمعظم أوامر infer.

لفحوصات المزوّد الشاملة من البداية إلى النهاية، فَضِّل `openclaw infer ...` بمجرد أن تصبح
اختبارات المزوّد منخفضة المستوى خضراء. فهو يختبر CLI المشحون، وتحميل الإعدادات،
وحلّ الوكيل الافتراضي، وتفعيل Plugin المضمّنة، وإصلاح تبعيات وقت التشغيل،
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

| المهمة | الأمر | ملاحظات |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| تشغيل مطالبة نصية/نموذج | `openclaw infer model run --prompt "..." --json`                       | يستخدم المسار المحلي المعتاد افتراضيًا |
| إنشاء صورة | `openclaw infer image generate --prompt "..." --json`                  | استخدم `image edit` عند البدء من ملف موجود |
| وصف ملف صورة | `openclaw infer image describe --file ./image.png --json`              | يجب أن يكون `--model` بصيغة `<provider/model>` ويدعم الصور |
| نسخ الصوت | `openclaw infer audio transcribe --file ./memo.m4a --json`             | يجب أن يكون `--model` بصيغة `<provider/model>` |
| توليد الكلام | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` موجّه إلى Gateway |
| إنشاء فيديو | `openclaw infer video generate --prompt "..." --json`                  | يدعم تلميحات المزوّد مثل `--resolution` |
| وصف ملف فيديو | `openclaw infer video describe --file ./clip.mp4 --json`               | يجب أن يكون `--model` بصيغة `<provider/model>` |
| البحث في الويب | `openclaw infer web search --query "..." --json`                       |                                                       |
| جلب صفحة ويب | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| إنشاء تضمينات | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## السلوك

- `openclaw infer ...` هو سطح CLI الأساسي لهذه المسارات.
- استخدم `--json` عندما ستستهلك المخرجاتَ أداةٌ أو سكربت آخر.
- استخدم `--provider` أو `--model provider/model` عندما تكون هناك حاجة إلى خلفية محددة.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يؤدي تحديد `--model` صراحةً إلى تشغيل ذلك المزوّد/النموذج مباشرةً. يجب أن تكون للنموذج قدرة على الصور في فهرس النماذج أو إعدادات المزوّد. يشغّل `codex/<model>` دورة فهم صور محدودة لخادم تطبيقات Codex؛ ويستخدم `openai-codex/<model>` مسار مزوّد OpenAI Codex OAuth.
- أوامر التنفيذ عديمة الحالة تعمل محليًا افتراضيًا.
- أوامر الحالة المُدارة بواسطة Gateway تعمل عبر Gateway افتراضيًا.
- لا يتطلب المسار المحلي المعتاد أن تكون Gateway قيد التشغيل.
- `model run` تشغيل لمرة واحدة. تُحال خوادم MCP التي تُفتح عبر بيئة الوكيل لذلك الأمر إلى التقاعد بعد الرد سواء في التنفيذ المحلي أو `--gateway`، لذلك لا تُبقي الاستدعاءات البرمجية المتكررة عمليات MCP الفرعية عبر stdio قيد التشغيل.

## Model

استخدم `model` للاستدلال النصي المدعوم من المزوّد ولاستعراض النموذج/المزوّد.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ملاحظات:

- يعيد `model run` استخدام بيئة الوكيل، لذلك تتصرف تجاوزات المزوّد/النموذج كما في تنفيذ الوكيل المعتاد.
- لأن `model run` مخصص للأتمتة دون واجهة رسومية، فهو لا يحتفظ ببيئات MCP المضمّنة لكل جلسة بعد انتهاء الأمر.
- تدير `model auth login` و`model auth logout` و`model auth status` حالة مصادقة المزوّد المحفوظة.

## Image

استخدم `image` للإنشاء والتحرير والوصف.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

ملاحظات:

- استخدم `image edit` عند البدء من ملفات إدخال موجودة.
- استخدم `image providers --json` للتحقق من مزوّدي الصور المضمّنين الذين يمكن اكتشافهم، والمضبوطين، والمحددين، والقدرات التي يوفّرها كل مزوّد للإنشاء/التحرير.
- استخدم `image generate --model <provider/model> --json` كأضيق فحص حيّ للـ CLI لتغييرات إنشاء الصور. مثال:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  يبلّغ رد JSON عن `ok` و`provider` و`model` و`attempts` ومسارات المخرجات المكتوبة. عند ضبط `--output`، قد يتبع الامتداد النهائي نوع MIME الذي أعاده المزوّد.

- بالنسبة إلى `image describe`، يجب أن يكون `--model` بصيغة `<provider/model>` ويدعم الصور.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة بديلة، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

## Audio

استخدم `audio` لنسخ الملفات.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

ملاحظات:

- `audio transcribe` مخصص لنسخ الملفات، وليس لإدارة الجلسات الفورية.
- يجب أن يكون `--model` بصيغة `<provider/model>`.

## TTS

استخدم `tts` لتوليف الكلام وحالة مزوّد TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

ملاحظات:

- يعمل `tts status` عبر Gateway افتراضيًا لأنه يعكس حالة TTS المُدارة بواسطة Gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لاستعراض سلوك TTS وضبطه.

## Video

استخدم `video` للإنشاء والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

ملاحظات:

- يقبل `video generate` الخيارات `--size` و`--aspect-ratio` و`--resolution` و`--duration` و`--audio` و`--watermark` و`--timeout-ms` ويعيد توجيهها إلى بيئة إنشاء الفيديو.
- يجب أن يكون `--model` بصيغة `<provider/model>` بالنسبة إلى `video describe`.

## Web

استخدم `web` لسير عمل البحث والجلب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لاستعراض المزوّدات المتاحة والمضبوطة والمحددة.

## Embedding

استخدم `embedding` لإنشاء المتجهات واستعراض مزوّدات التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## مخرجات JSON

توحّد أوامر infer مخرجات JSON تحت غلاف مشترك:

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

الحقول ذات المستوى الأعلى مستقرة:

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

- `openclaw capability ...` هو اسم بديل لـ `openclaw infer ...`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [النماذج](/ar/concepts/models)
