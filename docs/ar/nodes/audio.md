---
read_when:
    - تغيير تفريغ الصوت أو معالجة الوسائط
summary: كيفية تنزيل الملاحظات الصوتية الواردة ونسخها وإدراجها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
    generated_at: "2026-05-02T23:39:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91cd6951f80c6137061a7d4e82415b0872bc92c6d6ad136273a2e9ad7ec00ac1
    source_path: nodes/audio.md
    workflow: 16
---

# الصوت / الملاحظات الصوتية (2026-01-17)

## ما يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت مفعّلًا (أو مكتشفًا تلقائيًا)، فإن OpenClaw:
  1. يحدد أول مرفق صوتي (مسار محلي أو URL) وينزّله عند الحاجة.
  2. يفرض `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغّل أول إدخال نموذج مؤهل بالترتيب (مزود أو CLI).
  4. إذا فشل أو تم تخطيه (الحجم/المهلة)، فإنه يجرّب الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويعيّن `{{Transcript}}`.
- **تحليل الأوامر**: عند نجاح النسخ، يتم تعيين `CommandBody`/`RawBody` إلى النص المنسوخ لكي تظل أوامر الشرطة المائلة تعمل.
- **تسجيل مفصل**: في `--verbose`، نسجل متى يعمل النسخ ومتى يستبدل النص الأساسي.
- **إملاء واجهة التحكم**: يستطيع مؤلف الدردشة إرسال مقطع ميكروفون مسجل من المتصفح إلى `chat.transcribeAudio`. يكتب استدعاء Gateway RPC هذا المقطع إلى ملف محلي مؤقت، ويشغّل مسار نسخ الصوت نفسه، ويعيد نص مسودة إلى المتصفح، ثم يحذف الملف المؤقت. لا ينشئ تشغيلًا للوكيل بذاته.

## الاكتشاف التلقائي (الافتراضي)

إذا كنت **لا تضبط النماذج** وكان `tools.media.audio.enabled` **غير** مضبوط على `false`،
فإن OpenClaw يكتشف تلقائيًا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم مزوده فهم الصوت.
2. **واجهات CLI المحلية** (إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (من `whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمّن)
   - `whisper` (CLI بلغة Python؛ ينزّل النماذج تلقائيًا)
3. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
4. **مصادقة المزود**
   - تتم تجربة إدخالات `models.providers.*` المضبوطة التي تدعم الصوت أولًا
   - ترتيب الرجوع المضمّن: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

لتعطيل الاكتشاف التلقائي، اضبط `tools.media.audio.enabled: false`.
للتخصيص، اضبط `tools.media.audio.models`.
ملاحظة: اكتشاف الثنائيات هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجودة على `PATH` (نوسّع `~`)، أو عيّن نموذج CLI صريحًا مع مسار أمر كامل.

## أمثلة الضبط

### مزود + رجوع CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### مزود فقط مع بوابة النطاق

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### مزود فقط (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### مزود فقط (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### مزود فقط (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### صدى النص المنسوخ إلى الدردشة (اختياري)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## ملاحظات وحدود

- تتبع مصادقة المزود ترتيب مصادقة النماذج القياسي (ملفات تعريف المصادقة، متغيرات البيئة، `models.providers.*.apiKey`).
- تفاصيل إعداد Groq: [Groq](/ar/providers/groq).
- يلتقط Deepgram قيمة `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: [Deepgram (نسخ الصوت)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: [Mistral](/ar/providers/mistral).
- يلتقط SenseAudio قيمة `SENSEAUDIO_API_KEY` عند استخدام `provider: "senseaudio"`.
- تفاصيل إعداد SenseAudio: [SenseAudio](/ar/providers/senseaudio).
- يمكن لمزودي الصوت تجاوز `baseUrl` و`headers` و`providerOptions` عبر `tools.media.audio`.
- حد الحجم الافتراضي هو 20MB (`tools.media.audio.maxBytes`). يتم تخطي الصوت زائد الحجم لذلك النموذج وتجربة الإدخال التالي.
- يتم تخطي ملفات الصوت الصغيرة جدًا/الفارغة التي تقل عن 1024 بايت قبل النسخ عبر المزود/CLI.
- قيمة `maxChars` الافتراضية للصوت **غير مضبوطة** (النص المنسوخ الكامل). اضبط `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لقص الناتج.
- افتراضي OpenAI التلقائي هو `gpt-4o-mini-transcribe`؛ اضبط `model: "gpt-4o-transcribe"` لدقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة عدة ملاحظات صوتية (`mode: "all"` + `maxAttachments`).
- النص المنسوخ متاح للقوالب كـ `{{Transcript}}`.
- `tools.media.audio.echoTranscript` متوقف افتراضيًا؛ فعّله لإرسال تأكيد النص المنسوخ إلى الدردشة الأصلية قبل معالجة الوكيل.
- يخصص `tools.media.audio.echoFormat` نص الصدى (العنصر النائب: `{transcript}`).
- خرج stdout في CLI محدود (5MB)؛ اجعل خرج CLI موجزًا.
- يجب أن تستخدم `args` في CLI قيمة `{{MediaPath}}` لمسار ملف الصوت المحلي. شغّل `openclaw doctor --fix` لترحيل عناصر `{input}` النائبة المهملة من إعدادات `audio.transcription.command` الأقدم.

### دعم بيئة الوكيل

يحترم نسخ الصوت المعتمد على المزود متغيرات بيئة الوكيل الصادر القياسية:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم تكن متغيرات بيئة الوكيل مضبوطة، يتم استخدام الخروج المباشر. إذا كان ضبط الوكيل مشوهًا، يسجل OpenClaw تحذيرًا ويرجع إلى الجلب المباشر.

## اكتشاف الإشارة في المجموعات

عند ضبط `requireMention: true` لدردشة جماعية، ينسخ OpenClaw الصوت الآن **قبل** التحقق من الإشارات. يتيح هذا معالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيفية عمله:**

1. إذا لم تكن للرسالة الصوتية هيئة نصية وكانت المجموعة تتطلب إشارات، ينفذ OpenClaw نسخًا "تمهيديًا".
2. يتم فحص النص المنسوخ بحثًا عن أنماط الإشارة (مثل `@BotName` ومشغلات الرموز التعبيرية).
3. إذا تم العثور على إشارة، تتابع الرسالة عبر مسار الرد الكامل.
4. يُستخدم النص المنسوخ لاكتشاف الإشارات لكي تتمكن الملاحظات الصوتية من اجتياز بوابة الإشارة.

**سلوك الرجوع:**

- إذا فشل النسخ أثناء التمهيد (مهلة، خطأ API، إلخ)، تتم معالجة الرسالة بناءً على اكتشاف الإشارات النصية فقط.
- يضمن ذلك عدم إسقاط الرسائل المختلطة (نص + صوت) بشكل غير صحيح أبدًا.

**إلغاء الاشتراك لكل مجموعة/موضوع في Telegram:**

- اضبط `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات إشارة النص المنسوخ التمهيدية لتلك المجموعة.
- اضبط `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` لفرض التفعيل).
- الافتراضي هو `false` (التمهيد مفعّل عندما تطابق شروط بوابة الإشارة).

**مثال:** يرسل مستخدم ملاحظة صوتية تقول "مرحبًا @Claude، كيف الطقس؟" في مجموعة Telegram مع `requireMention: true`. تُنسخ الملاحظة الصوتية، وتُكتشف الإشارة، ويرد الوكيل.

## أمور يجب الانتباه لها

- تستخدم قواعد النطاق أول تطابق فائز. يتم تطبيع `chatType` إلى `direct` أو `group` أو `room`.
- تأكد من أن CLI يخرج بالرمز 0 ويطبع نصًا عاديًا؛ يحتاج JSON إلى معالجة عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`، إذا مررت `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون `--output-format` هو `txt` (أو محذوفًا)؛ صيغ الإخراج غير `txt` ترجع إلى تحليل stdout.
- اجعل المهل معقولة (`timeoutSeconds`، الافتراضي 60 ثانية) لتجنب حظر طابور الرد.
- يعالج النسخ التمهيدي **أول** مرفق صوتي فقط لاكتشاف الإشارات. تتم معالجة الصوت الإضافي أثناء مرحلة فهم الوسائط الرئيسية.

## ذو صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع التحدث](/ar/nodes/talk)
- [تنبيه الصوت](/ar/nodes/voicewake)
