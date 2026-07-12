---
read_when:
    - إضافة أو تعديل أوامر `openclaw infer`
    - تصميم أتمتة مستقرة للقدرات دون واجهة رسومية
summary: واجهة CLI تعتمد على الاستدلال أولًا لسير عمل النماذج والصور والصوت وتحويل النص إلى كلام والفيديو والويب والتضمينات المدعومة من موفّري الخدمات
title: واجهة سطر أوامر الاستدلال
x-i18n:
    generated_at: "2026-07-12T05:41:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ec90377d3fb6049e63f5eb1dddfb085562982152b1b2ba7bd4e4d2535ab3c06f
    source_path: cli/infer.md
    workflow: 16
---

`openclaw infer` هو السطح القياسي غير التفاعلي للاستدلال المدعوم بموفّري الخدمة. وهو يعرض عائلات القدرات (`model` و`image` و`audio` و`tts` و`video` و`web` و`embedding`)، وليس أسماء RPC الأولية لـ Gateway أو معرّفات أدوات الوكيل. ويُعد `openclaw capability ...` اسمًا مستعارًا لشجرة الأوامر نفسها.

أسباب تفضيله على غلاف مخصّص لموفّر خدمة بعينه:

- يعيد استخدام موفّري الخدمة والنماذج المُعدّة مسبقًا في OpenClaw.
- يوفّر غلاف `--json` مستقرًا للنصوص البرمجية وعمليات الأتمتة التي تقودها الوكلاء (راجع [مخرجات JSON](#json-output)).
- يشغّل المسار المحلي المعتاد من دون Gateway لمعظم الأوامر الفرعية.
- في فحوصات موفّر الخدمة الشاملة من البداية إلى النهاية، يختبر CLI الموزّع، وتحميل الإعدادات، وتحديد الوكيل الافتراضي، وتفعيل Plugin المضمّنة، وبيئة تشغيل القدرات المشتركة قبل إرسال الطلب إلى موفّر الخدمة.

## تحويل infer إلى مهارة

انسخ هذا والصقه في وكيل:

```text
اقرأ https://docs.openclaw.ai/cli/infer، ثم أنشئ مهارة توجّه مسارات عملي الشائعة إلى `openclaw infer`.
ركّز على تشغيل النماذج، وتوليد الصور، وتوليد الفيديو، ونسخ الصوت، وتحويل النص إلى كلام، والبحث على الويب، والتضمينات.
```

تربط المهارة الجيدة المستندة إلى infer مقاصد المستخدم الشائعة بالأمر الفرعي المناسب، وتتضمن بضعة أمثلة قياسية لكل مسار عمل، وتفضّل `openclaw infer ...` على البدائل منخفضة المستوى، ولا تعيد توثيق سطح infer بالكامل في متن المهارة.

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
    personas
    status
    enable
    disable
    set-provider
    set-persona

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

يعرض `infer list` و`infer inspect --name <capability>` هذه الشجرة في صورة بيانات (معرّف القدرة، ووسائط النقل، والوصف).

## المهام الشائعة

| المهمة                          | الأمر                                                                                         | ملاحظات                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| تشغيل مطالبة نصية/لنموذج       | `openclaw infer model run --prompt "..." --json`                                              | محلي افتراضيًا                                               |
| تشغيل مطالبة نموذج على صور     | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | كرّر `--file` لصور متعددة                                    |
| توليد صورة                     | `openclaw infer image generate --prompt "..." --json`                                         | استخدم `image edit` عند البدء من ملف موجود                   |
| وصف ملف صورة أو عنوان URL      | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | يجب أن يكون `--model` نموذجًا قادرًا على معالجة الصور بالصيغة `<provider/model>` |
| نسخ مقطع صوتي                  | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | يجب أن يكون `--model` بالصيغة `<provider/model>`             |
| تركيب الكلام                   | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | لا يعمل `tts status` إلا عبر Gateway                         |
| توليد فيديو                    | `openclaw infer video generate --prompt "..." --json`                                         | يدعم تلميحات موفّر الخدمة مثل `--resolution`                 |
| وصف ملف فيديو                  | `openclaw infer video describe --file ./clip.mp4 --json`                                      | يجب أن يكون `--model` بالصيغة `<provider/model>`             |
| البحث على الويب                | `openclaw infer web search --query "..." --json`                                              |                                                              |
| جلب صفحة ويب                   | `openclaw infer web fetch --url https://example.com --json`                                   |                                                              |
| إنشاء تضمينات                  | `openclaw infer embedding create --text "..." --json`                                         |                                                              |

## السلوك

- استخدم `--json` عندما تُمرَّر المخرجات إلى أمر أو نص برمجي آخر؛ واستخدم المخرجات النصية في الحالات الأخرى.
- استخدم `--provider` أو `--model provider/model` لتثبيت واجهة خلفية محددة.
- استخدم `model run --thinking <level>` لتجاوز مستوى التفكير/الاستدلال لمرة واحدة: `off` أو `minimal` أو `low` أو `medium` أو `high` أو `adaptive` أو `xhigh` أو `max`.
- بالنسبة إلى `image describe` و`audio transcribe` و`video describe`، يجب أن يستخدم `--model` الصيغة `<provider/model>`.
- بالنسبة إلى `image describe`، يقبل `--file` المسارات المحلية وعناوين HTTP(S) URL؛ وتخضع عناوين URL البعيدة لسياسة SSRF المعتادة لجلب الوسائط.
- تستخدم أوامر التنفيذ عديمة الحالة (`model run` و`image *` و`audio *` و`video *` و`web *` و`embedding *`) الوضع المحلي افتراضيًا. أما أوامر الحالة التي يديرها Gateway (`tts status`) فتستخدم Gateway افتراضيًا.
- لا يتطلب المسار المحلي تشغيل Gateway مطلقًا.
- يُعد `model run` المحلي إكمالًا مختصرًا لمرة واحدة عبر موفّر الخدمة: فهو يحدّد نموذج الوكيل والمصادقة المُعدّين، لكنه لا يبدأ دورة وكيل محادثة، ولا يحمّل الأدوات، ولا يفتح خوادم MCP المضمّنة.
- يرفق `model run --file` ملفات الصور (مع الكشف التلقائي عن نوع MIME) بالمطالبة؛ كرّر `--file` لصور متعددة. تُرفض الملفات غير الصورية — استخدم بدلًا من ذلك `infer audio transcribe` أو `infer video describe`.
- يختبر `model run --gateway` توجيه Gateway، والمصادقة المحفوظة، واختيار موفّر الخدمة، وبيئة التشغيل المضمّنة، لكنه يظل مسبارًا أوليًا للنموذج: لا يحتوي على نص جلسة سابقة، أو سياق bootstrap/AGENTS، أو أدوات، أو خوادم MCP مضمّنة.
- يتطلب `model run --gateway --model <provider/model>` بيانات اعتماد Gateway لمشغّل موثوق، لأنه يطلب من Gateway تنفيذ تجاوز مؤقت لموفّر الخدمة/النموذج.

## النموذج

الاستدلال النصي وفحص النموذج/موفّر الخدمة.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --model gpt-5.6-sol --json
```

استخدم مراجع `<provider/model>` الكاملة مع `--local` لإجراء اختبار دخاني لموفّر خدمة واحد دون تشغيل Gateway أو تحميل سطح أدوات الوكيل:

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.6-luna --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

ملاحظات:

- يُعد `model run` المحلي أضيق اختبار دخاني عبر CLI لسلامة موفّر الخدمة/النموذج/المصادقة: بالنسبة إلى موفّري الخدمة غير ChatGPT-Codex، لا يرسل سوى المطالبة المقدّمة.
- يستطيع `model run --model <provider/model>` المحلي تحديد صفوف الكتالوج الثابتة المضمّنة بدقة (وهي الصفوف نفسها التي يعرضها `openclaw models list --all`) قبل كتابة موفّر الخدمة هذا في الإعدادات. تظل مصادقة موفّر الخدمة مطلوبة؛ ويؤدي غياب بيانات الاعتماد إلى أخطاء مصادقة، وليس `Unknown model`.
- في مسابير الاستدلال لـ Mistral Medium 3.5، اترك درجة الحرارة غير مضبوطة/افتراضية. يرفض Mistral القيمة `reasoning_effort="high"` مع `temperature: 0`؛ استخدم درجة الحرارة الافتراضية أو قيمة غير صفرية مثل `0.7`.
- تضيف المسابير المحلية لـ OAuth الخاص بـ OpenAI ChatGPT/Codex (واجهة API ‏`openai-chatgpt-responses`) تعليمة نظام بسيطة كي يتمكن وسيط النقل من ملء حقل `instructions` المطلوب — من دون سياق وكيل كامل أو أدوات أو ذاكرة أو نص جلسة.
- يرفق `model run --file` محتوى الصورة مباشرة برسالة المستخدم الوحيدة. تعمل التنسيقات الشائعة (PNG وJPEG وWebP) عندما يُكتشف نوع MIME على أنه `image/*`؛ وتفشل الملفات غير المدعومة أو غير المعروفة قبل استدعاء موفّر الخدمة. استخدم بدلًا من ذلك `infer image describe` عندما تريد توجيه OpenClaw لنماذج الصور وآليات الرجوع الاحتياطي، بدلًا من مسبار مباشر لنموذج متعدد الوسائط.
- يجب أن يدعم النموذج المحدد إدخال الصور؛ وقد ترفض النماذج النصية فقط الطلب على مستوى موفّر الخدمة.
- يجب أن يحتوي `model run --prompt` على نص يتجاوز المسافات البيضاء؛ وتُرفض المطالبات الفارغة قبل أي استدعاء لموفّر الخدمة أو Gateway.
- ينتهي `model run` المحلي برمز غير صفري عندما لا يعيد موفّر الخدمة أي مخرجات نصية، حتى لا تبدو موفّرات الخدمة التي يتعذر الوصول إليها وعمليات الإكمال الفارغة كأنها مسابير ناجحة.
- استخدم `model run --gateway` لاختبار توجيه Gateway أو إعداد بيئة تشغيل الوكيل مع إبقاء إدخال النموذج أوليًا. استخدم `openclaw agent` أو سطح محادثة للحصول على سياق الوكيل الكامل، والأدوات، والذاكرة، ونص الجلسة.
- ترتبط `--thinking adaptive` بمستوى `medium` في بيئة تشغيل الإكمال؛ وترتبط `--thinking max` بالمستوى `max` لنماذج OpenAI التي تدعم أقصى جهد أصلي، وإلا فبالمستوى `xhigh`.
- تدير `model auth login` و`model auth logout` و`model auth status` حالة مصادقة موفّر الخدمة المحفوظة.

## الصورة

التوليد والتحرير والوصف.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --model openai/gpt-image-2 --quality low --openai-moderation low --prompt "low-cost draft poster" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

ملاحظات:

- استخدم `image edit` عند البدء من ملفات إدخال موجودة؛ تضيف `--size` أو `--aspect-ratio` أو `--resolution` تلميحات هندسية لدى المزوّدين/النماذج التي تدعمها.
- يؤدي استخدام `--output-format png --background transparent` مع `--model openai/gpt-image-1.5` إلى إخراج PNG من OpenAI بخلفية شفافة؛ ويُعد `--openai-background` اسمًا مستعارًا خاصًا بـ OpenAI للتلميح نفسه. تُبلغ المزوّدات التي لا تُعلن دعم الخلفية عنه بوصفه تجاوزًا متجاهلًا (راجع `ignoredOverrides` في [غلاف JSON](#json-output)).
- يعمل `--quality low|medium|high|auto` مع المزوّدين الذين يدعمون تلميحات جودة الصور، بما في ذلك OpenAI. تقبل OpenAI أيضًا `--openai-moderation low|auto`.
- يسرد `image providers --json` مزوّدي الصور المضمّنين القابلين للاكتشاف، والمُعدّين، والمحدّدين، وقدرات التوليد/التحرير التي يوفّرها كل منهم.
- يُعد `image generate --model <provider/model> --json` أضيق اختبار دخاني مباشر لتغييرات توليد الصور:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  تُبلغ الاستجابة عن `ok` و`provider` و`model` و`attempts` ومسارات الإخراج المكتوبة. عند تعيين `--output`، قد يتبع الامتداد النهائي نوع MIME الذي أعاده المزوّد.

- بالنسبة إلى `image describe` و`image describe-many`، استخدم `--prompt` لتقديم تعليمة خاصة بالمهمة (التعرّف الضوئي على الحروف، أو المقارنة، أو فحص واجهة المستخدم، أو إنشاء وصف موجز).
- استخدم `--timeout-ms` لنماذج الرؤية المحلية البطيئة أو عمليات البدء البارد لـ Ollama.
- بالنسبة إلى `image describe`، يُشغّل `--model` الصريح (ويجب أن يكون `<provider/model>` قادرًا على معالجة الصور) أولًا، ثم تُجرَّب القيم الاحتياطية المُعدّة في `agents.defaults.imageModel.fallbacks` إذا فشلت تلك الاستدعاء. تفشل أخطاء إعداد الإدخال (ملف مفقود أو عنوان URL غير مدعوم) قبل أي محاولة احتياطية، ويجب أن يكون النموذج قادرًا على معالجة الصور في دليل النماذج أو إعدادات المزوّد.
- بالنسبة إلى نماذج الرؤية المحلية في Ollama، نزّل النموذج أولًا وعيّن `OLLAMA_API_KEY` إلى أي قيمة نائبة، مثل `ollama-local`. راجع [Ollama](/ar/providers/ollama#vision-and-image-description).

## الصوت

نسخ الملفات صوتيًا (وليس إدارة الجلسات في الوقت الفعلي).

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

يجب أن يكون `--model` بالصيغة `<provider/model>`.

## تحويل النص إلى كلام

تركيب الكلام وحالة مزوّد/شخصية تحويل النص إلى كلام.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts personas --json
openclaw infer tts status --json
```

ملاحظات:

- لا يدعم `tts status` سوى `--gateway` (إذ يعكس حالة تحويل النص إلى كلام التي يديرها Gateway).
- استخدم `tts providers` و`tts voices` و`tts personas` و`tts set-provider` و`tts set-persona` لفحص سلوك تحويل النص إلى كلام وإعداده.

## الفيديو

التوليد والوصف.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

ملاحظات:

- يقبل `video generate` الخيارات `--size` و`--aspect-ratio` و`--resolution` و`--duration` و`--audio` و`--watermark` و`--timeout-ms`، وتُمرَّر إلى بيئة تشغيل توليد الفيديو.
- يجب أن يكون `--model` بالصيغة `<provider/model>` مع `video describe`.

## الويب

البحث والجلب.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

يسرد `web providers` المزوّدين المتاحين والمُعدّين والمحدّدين للبحث والجلب.

## التضمين

إنشاء المتجهات وفحص مزوّد التضمين.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## إخراج JSON

توحّد أوامر الاستدلال إخراج JSON ضمن غلاف مشترك:

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

الحقول المستقرة في المستوى الأعلى:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `inputs` (مرفقات الصور المرسلة مع الطلب، عند انطباق ذلك)
- `outputs`
- `ignoredOverrides` (مفاتيح التلميحات التي لا يدعمها المزوّد، عند انطباق ذلك)
- `error`

بالنسبة إلى أوامر الوسائط المُولَّدة، يحتوي `outputs` على الملفات التي كتبها OpenClaw. استخدم `path` و`mimeType` و`size` وأي أبعاد خاصة بالوسائط في تلك المصفوفة للأتمتة بدلًا من تحليل المخرجات القياسية المقروءة للبشر.

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

## ذو صلة

- [مرجع CLI](/ar/cli)
- [النماذج](/ar/concepts/models)
