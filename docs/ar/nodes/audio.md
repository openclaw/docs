---
read_when:
    - تغيير نسخ الصوت أو معالجة الوسائط
summary: كيفية تنزيل الصوت/الملاحظات الصوتية الواردة وتفريغها نصيًا وإدراجها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
    generated_at: "2026-04-30T08:09:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# الصوت / الملاحظات الصوتية (2026-01-17)

## ما يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت مفعلا (أو تم اكتشافه تلقائيا)، فإن OpenClaw:
  1. يحدد أول مرفق صوتي (مسار محلي أو URL) وينزله إذا لزم الأمر.
  2. يفرض `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغل أول إدخال نموذج مؤهل بالترتيب (موفر أو CLI).
  4. إذا فشل أو تم تخطيه (الحجم/المهلة)، فإنه يجرب الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويضبط `{{Transcript}}`.
- **تحليل الأوامر**: عند نجاح النسخ، يتم ضبط `CommandBody`/`RawBody` على النص المنسوخ لكي تظل أوامر الشرطة المائلة تعمل.
- **التسجيل التفصيلي**: في `--verbose`، نسجل عند تشغيل النسخ وعند استبداله للمتن.

## الاكتشاف التلقائي (الافتراضي)

إذا **لم تقم بتكوين النماذج** ولم يتم ضبط `tools.media.audio.enabled` على **`false`**،
يكتشف OpenClaw تلقائيا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم موفره فهم الصوت.
2. **واجهات CLI المحلية** (إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (من `whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمن)
   - `whisper` (Python CLI؛ ينزل النماذج تلقائيا)
3. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
4. **مصادقة الموفر**
   - تتم تجربة إدخالات `models.providers.*` المكونة التي تدعم الصوت أولا
   - ترتيب الاحتياط المضمن: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

لتعطيل الاكتشاف التلقائي، اضبط `tools.media.audio.enabled: false`.
للتخصيص، اضبط `tools.media.audio.models`.
ملاحظة: اكتشاف الثنائيات هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود في `PATH` (نوسع `~`)، أو اضبط نموذج CLI صريحا بمسار أمر كامل.

## أمثلة التكوين

### موفر + احتياط CLI (OpenAI + Whisper CLI)

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

### موفر فقط مع بوابة النطاق

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

### موفر فقط (Deepgram)

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

### موفر فقط (Mistral Voxtral)

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

### موفر فقط (SenseAudio)

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

### تكرار النص المنسوخ إلى الدردشة (اشتراك اختياري)

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

- تتبع مصادقة الموفر ترتيب مصادقة النموذج القياسي (ملفات تعريف المصادقة، متغيرات البيئة، `models.providers.*.apiKey`).
- تفاصيل إعداد Groq: [Groq](/ar/providers/groq).
- يلتقط Deepgram قيمة `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: [Deepgram (نسخ الصوت)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: [Mistral](/ar/providers/mistral).
- يلتقط SenseAudio قيمة `SENSEAUDIO_API_KEY` عند استخدام `provider: "senseaudio"`.
- تفاصيل إعداد SenseAudio: [SenseAudio](/ar/providers/senseaudio).
- يمكن لموفري الصوت تجاوز `baseUrl` و`headers` و`providerOptions` عبر `tools.media.audio`.
- حد الحجم الافتراضي هو 20MB (`tools.media.audio.maxBytes`). يتم تخطي الصوت الزائد الحجم لذلك النموذج وتجربة الإدخال التالي.
- يتم تخطي ملفات الصوت الصغيرة جدا/الفارغة الأقل من 1024 بايت قبل النسخ عبر الموفر/CLI.
- قيمة `maxChars` الافتراضية للصوت **غير مضبوطة** (النص المنسوخ الكامل). اضبط `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لاقتطاع الإخراج.
- القيمة التلقائية الافتراضية لـ OpenAI هي `gpt-4o-mini-transcribe`؛ اضبط `model: "gpt-4o-transcribe"` لدقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة عدة ملاحظات صوتية (`mode: "all"` + `maxAttachments`).
- يتوفر النص المنسوخ للقوالب على هيئة `{{Transcript}}`.
- `tools.media.audio.echoTranscript` متوقف افتراضيا؛ فعله لإرسال تأكيد النص المنسوخ إلى الدردشة الأصلية قبل معالجة الوكيل.
- يخصص `tools.media.audio.echoFormat` نص التكرار (العنصر النائب: `{transcript}`).
- يتم تقييد stdout الخاص بـ CLI (5MB)؛ اجعل إخراج CLI موجزا.
- يجب أن تستخدم `args` الخاصة بـ CLI قيمة `{{MediaPath}}` لمسار ملف الصوت المحلي. شغل `openclaw doctor --fix` لترحيل عناصر `{input}` النائبة المهملة من تكوينات `audio.transcription.command` الأقدم.

### دعم بيئة الوكيل

يحترم نسخ الصوت المعتمد على الموفر متغيرات بيئة وكيل الخروج القياسية:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم يتم ضبط متغيرات بيئة الوكيل، يتم استخدام خروج مباشر. إذا كان تكوين الوكيل مشوها، يسجل OpenClaw تحذيرا ويعود إلى الجلب المباشر.

## اكتشاف الإشارات في المجموعات

عند ضبط `requireMention: true` لدردشة جماعية، ينسخ OpenClaw الآن الصوت **قبل** التحقق من الإشارات. يتيح هذا معالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيف يعمل:**

1. إذا لم تكن للرسالة الصوتية متن نصي وكانت المجموعة تتطلب إشارات، ينفذ OpenClaw نسخة "تمهيدية".
2. يتم فحص النص المنسوخ بحثا عن أنماط الإشارة (مثل `@BotName`، ومشغلات الرموز التعبيرية).
3. إذا تم العثور على إشارة، تتابع الرسالة عبر مسار الرد الكامل.
4. يتم استخدام النص المنسوخ لاكتشاف الإشارات حتى تتمكن الملاحظات الصوتية من اجتياز بوابة الإشارات.

**سلوك الاحتياط:**

- إذا فشل النسخ أثناء التمهيد (مهلة، خطأ API، وما إلى ذلك)، تتم معالجة الرسالة بناء على اكتشاف الإشارات النصية فقط.
- يضمن هذا أن الرسائل المختلطة (نص + صوت) لا يتم إسقاطها بشكل غير صحيح أبدا.

**إلغاء الاشتراك لكل مجموعة/موضوع في Telegram:**

- اضبط `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات إشارة النص المنسوخ التمهيدية لتلك المجموعة.
- اضبط `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` لفرض التفعيل).
- الافتراضي هو `false` (التمهيد مفعل عندما تتطابق شروط بوابة الإشارات).

**مثال:** يرسل مستخدم ملاحظة صوتية تقول "Hey @Claude, what's the weather?" في مجموعة Telegram مع `requireMention: true`. يتم نسخ الملاحظة الصوتية، ويتم اكتشاف الإشارة، ويرد الوكيل.

## أمور يجب الانتباه لها

- تستخدم قواعد النطاق أول تطابق رابح. تتم تسوية `chatType` إلى `direct` أو `group` أو `room`.
- تأكد من أن CLI يخرج 0 ويطبع نصا عاديا؛ يحتاج JSON إلى معالجة عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`، إذا مررت `--output-dir`، يقرأ OpenClaw `<output-dir>/<media-basename>.txt` عندما يكون `--output-format` هو `txt` (أو محذوفا)؛ تعود تنسيقات الإخراج غير `txt` إلى تحليل stdout.
- اجعل المهل معقولة (`timeoutSeconds`، الافتراضي 60s) لتجنب حظر طابور الرد.
- يعالج النسخ التمهيدي **أول** مرفق صوتي فقط لاكتشاف الإشارات. تتم معالجة الصوت الإضافي أثناء مرحلة فهم الوسائط الرئيسية.

## ذو صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع التحدث](/ar/nodes/talk)
- [إيقاظ الصوت](/ar/nodes/voicewake)
