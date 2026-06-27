---
read_when:
    - تغيير تفريغ الصوت أو معالجة الوسائط
summary: كيفية تنزيل الملاحظات الصوتية/الرسائل الصوتية الواردة ونسخها وإدراجها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
    generated_at: "2026-06-27T17:54:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## ما يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت مفعلا (أو مكتشفا تلقائيا)، فإن OpenClaw:
  1. يحدد أول مرفق صوتي (مسار محلي أو URL) وينزله عند الحاجة.
  2. يفرض `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغل أول إدخال نموذج مؤهل بالترتيب (مزود أو CLI).
  4. إذا فشل أو تم تخطيه (الحجم/المهلة)، يجرب الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويضبط `{{Transcript}}`.
- **تحليل الأوامر**: عند نجاح النسخ، يتم ضبط `CommandBody`/`RawBody` إلى النص المنسوخ كي تظل أوامر الشرطة المائلة تعمل.
- **التسجيل المفصل**: في `--verbose`، نسجل وقت تشغيل النسخ ووقت استبداله للمتن.

## الاكتشاف التلقائي (الافتراضي)

إذا **لم تضبط النماذج** ولم يتم ضبط `tools.media.audio.enabled` على `false`،
فإن OpenClaw يكتشف تلقائيا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم مزوده فهم الصوت.
2. **واجهات CLI المحلية** (إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (من `whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمن)
   - `whisper` (Python CLI؛ ينزل النماذج تلقائيا)
3. **مصادقة المزود**
   - تتم تجربة إدخالات `models.providers.*` المضبوطة التي تدعم الصوت أولا
   - ترتيب الرجوع إلى المزودين: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

اعتبارا من 2026-05-22، لم يعد الاكتشاف التلقائي لـ Gemini CLI مدعوما لفهم الوسائط. تنقل Google مستخدمي Gemini CLI إلى Antigravity CLI؛ يجب أن يستخدم الصوت النسخ المحلي أو نسخ المزود، بينما يجب نقل رجوع CLI للصور/الفيديو إلى Antigravity CLI (`agy`).

لتعطيل الاكتشاف التلقائي، اضبط `tools.media.audio.enabled: false`.
للتخصيص، اضبط `tools.media.audio.models`.
ملاحظة: اكتشاف الملفات الثنائية هو أفضل محاولة عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود في `PATH` (نوسع `~`)، أو اضبط نموذج CLI صريحا بمسار أمر كامل.

## أمثلة الإعداد

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

### مزود فقط مع تقييد النطاق

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

- تتبع مصادقة المزود ترتيب مصادقة النماذج القياسي (ملفات المصادقة، متغيرات البيئة، `models.providers.*.apiKey`).
- تفاصيل إعداد Groq: [Groq](/ar/providers/groq).
- يلتقط Deepgram قيمة `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: [Deepgram (نسخ الصوت)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: [Mistral](/ar/providers/mistral).
- يلتقط SenseAudio قيمة `SENSEAUDIO_API_KEY` عند استخدام `provider: "senseaudio"`.
- تفاصيل إعداد SenseAudio: [SenseAudio](/ar/providers/senseaudio).
- يمكن لمزودي الصوت تجاوز `baseUrl` و`headers` و`providerOptions` عبر `tools.media.audio`.
- حد الحجم الافتراضي هو 20MB (`tools.media.audio.maxBytes`). يتم تخطي الصوت زائد الحجم لذلك النموذج وتجربة الإدخال التالي.
- يتم تخطي ملفات الصوت الصغيرة/الفارغة التي تقل عن 1024 بايت قبل النسخ عبر المزود/CLI.
- القيمة الافتراضية لـ `maxChars` للصوت **غير مضبوطة** (النص المنسوخ الكامل). اضبط `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لاقتطاع المخرجات.
- القيمة التلقائية الافتراضية لـ OpenAI هي `gpt-4o-mini-transcribe`؛ اضبط `model: "gpt-4o-transcribe"` للحصول على دقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة عدة ملاحظات صوتية (`mode: "all"` + `maxAttachments`).
- يتوفر النص المنسوخ للقوالب باسم `{{Transcript}}`.
- يكون `tools.media.audio.echoTranscript` معطلا افتراضيا؛ فعله لإرسال تأكيد النص المنسوخ إلى الدردشة الأصلية قبل معالجة الوكيل.
- يخصص `tools.media.audio.echoFormat` نص التكرار (العنصر النائب: `{transcript}`).
- مخرجات stdout الخاصة بـ CLI محددة (5MB)؛ أبق مخرجات CLI موجزة.
- يجب أن تستخدم `args` الخاصة بـ CLI القيمة `{{MediaPath}}` لمسار ملف الصوت المحلي. شغل `openclaw doctor --fix` لترحيل عناصر `{input}` النائبة المهملة من إعدادات `audio.transcription.command` الأقدم.

### دعم بيئة الوكيل

يحترم نسخ الصوت المستند إلى المزود متغيرات بيئة الوكيل الصادر القياسية:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم يتم ضبط أي متغيرات بيئة للوكيل، يتم استخدام الخروج المباشر. إذا كان إعداد الوكيل مشوها، يسجل OpenClaw تحذيرا ويرجع إلى الجلب المباشر.

## اكتشاف الإشارات في المجموعات

عند ضبط `requireMention: true` لدردشة جماعية، ينسخ OpenClaw الصوت الآن **قبل** التحقق من الإشارات. يتيح ذلك معالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيف يعمل:**

1. إذا لم تكن للرسالة الصوتية متن نصي وكانت المجموعة تتطلب إشارات، يجري OpenClaw نسخا "تمهيديا".
2. يتم فحص النص المنسوخ بحثا عن أنماط الإشارة (مثل `@BotName` ومشغلات الرموز التعبيرية).
3. إذا عثر على إشارة، تتابع الرسالة مسار الرد الكامل.
4. يستخدم النص المنسوخ لاكتشاف الإشارات كي تتمكن الملاحظات الصوتية من اجتياز بوابة الإشارة.

**سلوك الرجوع:**

- إذا فشل النسخ أثناء التمهيد (مهلة، خطأ API، وما إلى ذلك)، تتم معالجة الرسالة بناء على اكتشاف الإشارات النصية فقط.
- يضمن هذا ألا يتم إسقاط الرسائل المختلطة (نص + صوت) بشكل غير صحيح أبدا.

**إلغاء الاشتراك لكل مجموعة/موضوع Telegram:**

- اضبط `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات إشارة النص المنسوخ التمهيدية لتلك المجموعة.
- اضبط `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` لفرض التفعيل).
- القيمة الافتراضية هي `false` (التمهيد مفعل عندما تتطابق شروط بوابة الإشارة).

**مثال:** يرسل مستخدم ملاحظة صوتية تقول "Hey @Claude, what's the weather?" في مجموعة Telegram مع `requireMention: true`. يتم نسخ الملاحظة الصوتية، وتكتشف الإشارة، ويرد الوكيل.

## محاذير

- تستخدم قواعد النطاق أول تطابق يفوز. يتم تطبيع `chatType` إلى `direct` أو `group` أو `room`.
- تأكد من أن CLI لديك يخرج بالرمز 0 ويطبع نصا عاديا؛ يحتاج JSON إلى المعالجة عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`، إذا مررت `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون `--output-format` هو `txt` (أو محذوفا)؛ تنسيقات المخرجات غير `txt` ترجع إلى تحليل stdout.
- أبق المهل معقولة (`timeoutSeconds`، الافتراضي 60s) لتجنب حظر طابور الرد.
- يعالج النسخ التمهيدي **أول** مرفق صوتي فقط لاكتشاف الإشارات. تتم معالجة الصوت الإضافي أثناء مرحلة فهم الوسائط الرئيسية.

## ذو صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع الحديث](/ar/nodes/talk)
- [التنبيه الصوتي](/ar/nodes/voicewake)
