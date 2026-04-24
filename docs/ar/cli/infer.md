---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة ثابتة للإمكانات من دون واجهة تفاعلية
summary: CLI بنهج الاستدلال أولًا لسير العمل المدعوم من المزوّد للنموذج، والصورة، والصوت، وTTS، والفيديو، والويب، وعمليات التضمين
title: CLI للاستدلال
x-i18n:
    generated_at: "2026-04-24T07:34:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a5a2ca9da4b5c26fbd61c271801d50a3d533bd4cc8430aa71f65e2cdc4fdee6
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` هو السطح القياسي غير التفاعلي لسير عمل الاستدلال المدعوم من المزوّد.

وهو يكشف عمدًا عن عائلات الإمكانات، وليس أسماء Gateway RPC الخام ولا معرّفات أدوات الوكيل الخام.

## حوّل infer إلى Skill

انسخ هذا والصقه إلى وكيل:

```text
اقرأ https://docs.openclaw.ai/cli/infer، ثم أنشئ Skill توجّه سير العمل الشائع لدي إلى `openclaw infer`.
ركّز على تشغيلات النماذج، وتوليد الصور، وتوليد الفيديو، ونسخ الصوت، وTTS، والبحث على الويب، وعمليات التضمين.
```

يجب أن تقوم Skill جيدة مبنية على infer بما يلي:

- ربط نوايا المستخدم الشائعة بالأمر الفرعي الصحيح من infer
- تضمين بعض أمثلة infer القياسية لسير العمل التي تغطيها
- تفضيل `openclaw infer ...` في الأمثلة والاقتراحات
- تجنب إعادة توثيق سطح infer بالكامل داخل متن Skill

التغطية المعتادة لـ Skill مركّزة على infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## لماذا تستخدم infer

يوفر `openclaw infer` CLI موحدًا واحدًا لمهام الاستدلال المدعومة من المزوّد داخل OpenClaw.

الفوائد:

- استخدم المزوّدين والنماذج المكوّنة بالفعل في OpenClaw بدلًا من إعداد مغلفات مخصصة منفصلة لكل واجهة خلفية.
- حافظ على سير عمل النموذج، والصورة، ونسخ الصوت، وTTS، والفيديو، والويب، وعمليات التضمين تحت شجرة أوامر واحدة.
- استخدم شكل خرج `--json` ثابتًا للسكربتات، والأتمتة، وسير العمل القائم على الوكلاء.
- فضّل سطح OpenClaw رسميًا عندما تكون المهمة في جوهرها "تشغيل استدلال".
- استخدم المسار المحلي العادي من دون الحاجة إلى Gateway لمعظم أوامر infer.

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

## مهام شائعة

يربط هذا الجدول مهام الاستدلال الشائعة بأمر infer المقابل.

| المهمة                  | الأمر                                                                  | ملاحظات                                               |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| تشغيل مطالبة نص/نموذج   | `openclaw infer model run --prompt "..." --json`                       | يستخدم المسار المحلي العادي افتراضيًا                |
| توليد صورة              | `openclaw infer image generate --prompt "..." --json`                  | استخدم `image edit` عند البدء من ملف موجود           |
| وصف ملف صورة            | `openclaw infer image describe --file ./image.png --json`              | يجب أن يكون `--model` بالشكل `<provider/model>` ويدعم الصور |
| نسخ صوت                 | `openclaw infer audio transcribe --file ./memo.m4a --json`             | يجب أن يكون `--model` بالشكل `<provider/model>`      |
| توليد كلام              | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` موجّه إلى Gateway                       |
| توليد فيديو             | `openclaw infer video generate --prompt "..." --json`                  |                                                       |
| وصف ملف فيديو           | `openclaw infer video describe --file ./clip.mp4 --json`               | يجب أن يكون `--model` بالشكل `<provider/model>`      |
| البحث على الويب         | `openclaw infer web search --query "..." --json`                       |                                                       |
| جلب صفحة ويب            | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| إنشاء تضمينات           | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## السلوك

- `openclaw infer ...` هو سطح CLI الأساسي لهذه الأنواع من سير العمل.
- استخدم `--json` عندما سيستهلك أمر أو سكربت آخر المخرجات.
- استخدم `--provider` أو `--model provider/model` عندما تكون هناك حاجة إلى واجهة خلفية محددة.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يؤدي استخدام `--model` صريح إلى تشغيل ذلك المزوّد/النموذج مباشرة. يجب أن يكون النموذج قادرًا على التعامل مع الصور في فهرس النماذج أو تكوين المزوّد. يؤدي `codex/<model>` إلى تشغيل دور محدود لفهم الصور عبر خادم تطبيق Codex؛ ويستخدم `openai-codex/<model>` مسار مزوّد OpenAI Codex OAuth.
- أوامر التنفيذ عديمة الحالة تكون محلية افتراضيًا.
- أوامر الحالة المُدارة من Gateway تكون عبر Gateway افتراضيًا.
- لا يتطلب المسار المحلي العادي أن يكون Gateway قيد التشغيل.

## Model

استخدم `model` للاستدلال النصي المدعوم من المزوّد وفحص النموذج/المزوّد.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

ملاحظات:

- يعيد `model run` استخدام وقت تشغيل الوكيل بحيث تتصرف تجاوزات المزوّد/النموذج مثل تنفيذ الوكيل العادي.
- تدير `model auth login` و`model auth logout` و`model auth status` حالة مصادقة المزوّد المحفوظة.

## Image

استخدم `image` للتوليد، والتحرير، والوصف.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

ملاحظات:

- استخدم `image edit` عند البدء من ملفات إدخال موجودة.
- بالنسبة إلى `image describe`، يجب أن يكون `--model` بالشكل `<provider/model>` ويدعم الصور.
- بالنسبة إلى نماذج الرؤية المحلية من Ollama، اسحب النموذج أولًا واضبط `OLLAMA_API_KEY` على أي قيمة بديلة، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

## Audio

استخدم `audio` لنسخ الملفات الصوتية.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

ملاحظات:

- `audio transcribe` مخصص لنسخ الملفات، وليس لإدارة الجلسات الفورية.
- يجب أن يكون `--model` بالشكل `<provider/model>`.

## TTS

استخدم `tts` لتخليق الكلام وحالة مزوّد TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

ملاحظات:

- يكون `tts status` عبر Gateway افتراضيًا لأنه يعكس حالة TTS المُدارة من Gateway.
- استخدم `tts providers` و`tts voices` و`tts set-provider` لفحص سلوك TTS وتكوينه.

## Video

استخدم `video` للتوليد والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

ملاحظات:

- يجب أن يكون `--model` بالشكل `<provider/model>` بالنسبة إلى `video describe`.

## Web

استخدم `web` لسير عمل البحث والجلب على الويب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

ملاحظات:

- استخدم `web providers` لفحص المزوّدين المتاحين والمكوّنين والمحددين.

## Embedding

استخدم `embedding` لإنشاء المتجهات وفحص مزوّدات التضمين.

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

الحقول ذات المستوى الأعلى ثابتة:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

## أخطاء شائعة

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

- `openclaw capability ...` هو اسم مستعار لـ `openclaw infer ...`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [النماذج](/ar/concepts/models)
