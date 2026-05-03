---
read_when:
    - تغيير التفريغ الصوتي أو التعامل مع الوسائط
summary: كيفية تنزيل الصوت/الملاحظات الصوتية الواردة وتفريغها نصيًا وإدراجها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
    generated_at: "2026-05-03T07:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 35074d79104f767ee252064462202a8ec21ac26f6db25c39e67f31f6b40edeb7
    source_path: nodes/audio.md
    workflow: 16
---

# الملاحظات الصوتية / الصوت (2026-01-17)

## ما يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت مفعلا (أو تم اكتشافه تلقائيا)، فإن OpenClaw:
  1. يحدد أول مرفق صوتي (مسار محلي أو URL) وينزله عند الحاجة.
  2. يطبق `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغل أول إدخال نموذج مؤهل بالترتيب (موفر أو CLI).
  4. إذا فشل أو تم تخطيه (الحجم/المهلة)، يحاول الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويضبط `{{Transcript}}`.
- **تحليل الأوامر**: عند نجاح التفريغ النصي، يتم ضبط `CommandBody`/`RawBody` على التفريغ النصي حتى تظل أوامر الشرطة المائلة تعمل.
- **التسجيل المفصل**: في `--verbose`، نسجل وقت تشغيل التفريغ النصي ووقت استبداله للمتن.

## الاكتشاف التلقائي (الافتراضي)

إذا **لم تضبط النماذج** ولم يتم ضبط `tools.media.audio.enabled` على **`false`**،
يكتشف OpenClaw تلقائيا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم موفره فهم الصوت.
2. **واجهات CLI المحلية** (إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (من `whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج tiny المضمن)
   - `whisper` (Python CLI؛ ينزل النماذج تلقائيا)
3. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
4. **مصادقة الموفر**
   - تتم تجربة إدخالات `models.providers.*` المضبوطة التي تدعم الصوت أولا
   - ترتيب الرجوع المضمن: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

لتعطيل الاكتشاف التلقائي، اضبط `tools.media.audio.enabled: false`.
للتخصيص، اضبط `tools.media.audio.models`.
ملاحظة: اكتشاف الملفات الثنائية هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجودة على `PATH` (نوسع `~`)، أو اضبط نموذج CLI صريحا مع مسار أمر كامل.

## أمثلة الضبط

### موفر + رجوع إلى CLI (OpenAI + Whisper CLI)

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

### تكرار التفريغ النصي في الدردشة (اختياري)

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
- يلتقط Deepgram المفتاح `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: [Deepgram (تفريغ الصوت نصيا)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: [Mistral](/ar/providers/mistral).
- يلتقط SenseAudio المفتاح `SENSEAUDIO_API_KEY` عند استخدام `provider: "senseaudio"`.
- تفاصيل إعداد SenseAudio: [SenseAudio](/ar/providers/senseaudio).
- يمكن لموفري الصوت تجاوز `baseUrl` و`headers` و`providerOptions` عبر `tools.media.audio`.
- الحد الافتراضي للحجم هو 20MB (`tools.media.audio.maxBytes`). يتم تخطي الصوت زائد الحجم لذلك النموذج وتجربة الإدخال التالي.
- يتم تخطي ملفات الصوت الصغيرة جدا/الفارغة التي يقل حجمها عن 1024 بايت قبل التفريغ النصي عبر الموفر/CLI.
- قيمة `maxChars` الافتراضية للصوت **غير مضبوطة** (التفريغ النصي الكامل). اضبط `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لاقتطاع الإخراج.
- افتراضي OpenAI التلقائي هو `gpt-4o-mini-transcribe`؛ اضبط `model: "gpt-4o-transcribe"` لدقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة ملاحظات صوتية متعددة (`mode: "all"` + `maxAttachments`).
- يتوفر التفريغ النصي للقوالب باسم `{{Transcript}}`.
- يكون `tools.media.audio.echoTranscript` متوقفا افتراضيا؛ فعله لإرسال تأكيد التفريغ النصي إلى الدردشة الأصلية قبل معالجة الوكيل.
- يخصص `tools.media.audio.echoFormat` نص التكرار (العنصر النائب: `{transcript}`).
- إخراج stdout الخاص بـ CLI محدود (5MB)؛ أبق إخراج CLI موجزا.
- يجب أن تستخدم `args` الخاصة بـ CLI الرمز `{{MediaPath}}` لمسار ملف الصوت المحلي. شغل `openclaw doctor --fix` لترحيل العناصر النائبة المهملة `{input}` من إعدادات `audio.transcription.command` الأقدم.

### دعم بيئة الوكيل

يحترم التفريغ النصي للصوت المستند إلى الموفر متغيرات بيئة الوكيل الصادر القياسية:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم يتم ضبط أي متغيرات بيئة للوكيل، يتم استخدام الخروج المباشر. إذا كان ضبط الوكيل غير صالح، يسجل OpenClaw تحذيرا ويعود إلى الجلب المباشر.

## اكتشاف الإشارات في المجموعات

عند ضبط `requireMention: true` لدردشة جماعية، يقوم OpenClaw الآن بتفريغ الصوت نصيا **قبل** التحقق من الإشارات. يتيح ذلك معالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيف يعمل:**

1. إذا لم تكن للرسالة الصوتية هيئة نصية وكانت المجموعة تتطلب إشارات، ينفذ OpenClaw تفريغا نصيا "تمهيديا".
2. يتم فحص التفريغ النصي بحثا عن أنماط الإشارة (مثل `@BotName` ومشغلات الرموز التعبيرية).
3. إذا تم العثور على إشارة، تتابع الرسالة عبر مسار الرد الكامل.
4. يتم استخدام التفريغ النصي لاكتشاف الإشارات حتى تتمكن الملاحظات الصوتية من اجتياز بوابة الإشارة.

**سلوك الرجوع:**

- إذا فشل التفريغ النصي أثناء الفحص التمهيدي (مهلة، خطأ API، وغير ذلك)، تتم معالجة الرسالة استنادا إلى اكتشاف الإشارة النصي فقط.
- يضمن ذلك عدم إسقاط الرسائل المختلطة (نص + صوت) بشكل غير صحيح أبدا.

**إلغاء الاشتراك لكل مجموعة/موضوع Telegram:**

- اضبط `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات إشارات التفريغ النصي التمهيدية لتلك المجموعة.
- اضبط `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` لفرض التفعيل).
- الافتراضي هو `false` (يكون الفحص التمهيدي مفعلا عندما تتطابق شروط بوابة الإشارة).

**مثال:** يرسل مستخدم ملاحظة صوتية تقول "Hey @Claude, what's the weather?" في مجموعة Telegram مع `requireMention: true`. يتم تفريغ الملاحظة الصوتية نصيا، ويتم اكتشاف الإشارة، ويرد الوكيل.

## أمور يجب الانتباه لها

- تستخدم قواعد النطاق أول تطابق رابحا. يتم تطبيع `chatType` إلى `direct` أو `group` أو `room`.
- تأكد من أن CLI يخرج بالرمز 0 ويطبع نصا عاديا؛ يحتاج JSON إلى المعالجة عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`، إذا مررت `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون `--output-format` هو `txt` (أو محذوفا)؛ تعود تنسيقات الإخراج غير `txt` إلى تحليل stdout.
- أبق المهل معقولة (`timeoutSeconds`، الافتراضي 60s) لتجنب حظر طابور الرد.
- يعالج التفريغ النصي التمهيدي **أول** مرفق صوتي فقط لاكتشاف الإشارات. تتم معالجة الصوت الإضافي أثناء مرحلة فهم الوسائط الرئيسية.

## ذو صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع المحادثة](/ar/nodes/talk)
- [التنبيه الصوتي](/ar/nodes/voicewake)
