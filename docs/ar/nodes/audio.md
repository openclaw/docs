---
read_when:
    - تغيير النسخ الصوتي أو معالجة الوسائط
summary: كيفية تنزيل الصوت/الرسائل الصوتية الواردة، وتفريغها نصيًا، وإدراجها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
    generated_at: "2026-05-06T18:00:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: baa96453ce279d05933281eafe930e3573c5cbe694cec8704b1d064f4b0de242
    source_path: nodes/audio.md
    workflow: 16
---

## ما الذي يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت ممكّنًا (أو تم اكتشافه تلقائيًا)، فإن OpenClaw:
  1. يحدد موقع أول مرفق صوتي (مسار محلي أو URL) وينزّله إذا لزم الأمر.
  2. يفرض `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغّل أول إدخال نموذج مؤهل بالترتيب (المزوّد أو CLI).
  4. إذا فشل أو تم تخطيه (الحجم/المهلة)، فإنه يجرّب الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويعيّن `{{Transcript}}`.
- **تحليل الأوامر**: عند نجاح النسخ، يتم تعيين `CommandBody`/`RawBody` إلى النص المنسوخ بحيث تظل أوامر الشرطة المائلة تعمل.
- **التسجيل التفصيلي**: في `--verbose`، نسجّل عند تشغيل النسخ وعند استبداله للمتن.

## الاكتشاف التلقائي (الافتراضي)

إذا **لم تضبط النماذج** ولم يتم تعيين `tools.media.audio.enabled` إلى `false`،
فإن OpenClaw يكتشف تلقائيًا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم مزوّده فهم الصوت.
2. **واجهات CLI المحلية** (إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (من `whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمّن)
   - `whisper` (واجهة CLI من Python؛ تنزّل النماذج تلقائيًا)
3. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
4. **مصادقة المزوّد**
   - تتم تجربة إدخالات `models.providers.*` المضبوطة التي تدعم الصوت أولًا
   - ترتيب الاحتياطي المضمّن: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

لتعطيل الاكتشاف التلقائي، عيّن `tools.media.audio.enabled: false`.
للتخصيص، عيّن `tools.media.audio.models`.
ملاحظة: اكتشاف الملفات الثنائية يتم بأفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجودة على `PATH` (نوسّع `~`)، أو عيّن نموذج CLI صريحًا بمسار أمر كامل.

## أمثلة التكوين

### مزوّد + احتياطي CLI (OpenAI + Whisper CLI)

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

### مزوّد فقط مع تقييد النطاق

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

### مزوّد فقط (Deepgram)

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

### مزوّد فقط (Mistral Voxtral)

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

### مزوّد فقط (SenseAudio)

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

### تكرار النص المنسوخ إلى الدردشة (اختياري)

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

- تتبع مصادقة المزوّد ترتيب مصادقة النموذج القياسي (ملفات تعريف المصادقة، ومتغيرات البيئة، و`models.providers.*.apiKey`).
- تفاصيل إعداد Groq: [Groq](/ar/providers/groq).
- يلتقط Deepgram قيمة `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: [Deepgram (نسخ الصوت)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: [Mistral](/ar/providers/mistral).
- يلتقط SenseAudio قيمة `SENSEAUDIO_API_KEY` عند استخدام `provider: "senseaudio"`.
- تفاصيل إعداد SenseAudio: [SenseAudio](/ar/providers/senseaudio).
- يمكن لمزوّدي الصوت تجاوز `baseUrl` و`headers` و`providerOptions` عبر `tools.media.audio`.
- حد الحجم الافتراضي هو 20MB (`tools.media.audio.maxBytes`). يتم تخطي الصوت الذي يتجاوز الحجم لذلك النموذج، ثم تتم تجربة الإدخال التالي.
- يتم تخطي ملفات الصوت الصغيرة جدًا/الفارغة التي يقل حجمها عن 1024 بايت قبل نسخ المزوّد/CLI.
- قيمة `maxChars` الافتراضية للصوت **غير معيّنة** (النص المنسوخ كامل). عيّن `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لاقتطاع المخرجات.
- الافتراضي التلقائي لـ OpenAI هو `gpt-4o-mini-transcribe`؛ عيّن `model: "gpt-4o-transcribe"` لدقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة ملاحظات صوتية متعددة (`mode: "all"` + `maxAttachments`).
- النص المنسوخ متاح للقوالب باسم `{{Transcript}}`.
- يكون `tools.media.audio.echoTranscript` متوقفًا افتراضيًا؛ مكّنه لإرسال تأكيد النص المنسوخ مرة أخرى إلى الدردشة الأصلية قبل معالجة الوكيل.
- يخصص `tools.media.audio.echoFormat` نص التكرار (العنصر النائب: `{transcript}`).
- يتم تقييد stdout الخاص بـ CLI (5MB)؛ اجعل مخرجات CLI موجزة.
- يجب أن تستخدم `args` الخاصة بـ CLI قيمة `{{MediaPath}}` لمسار ملف الصوت المحلي. شغّل `openclaw doctor --fix` لترحيل عناصر `{input}` النائبة المهملة من تكوينات `audio.transcription.command` الأقدم.

### دعم بيئة الوكيل

يحترم نسخ الصوت المستند إلى المزوّد متغيرات بيئة الوكيل القياسية الصادرة:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم يتم تعيين أي متغيرات بيئة للوكيل، فسيتم استخدام الخروج المباشر. إذا كان تكوين الوكيل غير صحيح، يسجّل OpenClaw تحذيرًا ويعود إلى الجلب المباشر.

## اكتشاف الإشارات في المجموعات

عند تعيين `requireMention: true` لدردشة جماعية، يقوم OpenClaw الآن بنسخ الصوت **قبل** التحقق من الإشارات. يتيح ذلك معالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيف يعمل:**

1. إذا لم تكن للرسالة الصوتية متن نصي وكانت المجموعة تتطلب إشارات، ينفذ OpenClaw نسخًا "تمهيديًا".
2. يتم التحقق من النص المنسوخ بحثًا عن أنماط الإشارة (مثل `@BotName`، ومشغلات الرموز التعبيرية).
3. إذا تم العثور على إشارة، تتابع الرسالة عبر مسار الرد الكامل.
4. يُستخدم النص المنسوخ لاكتشاف الإشارات بحيث يمكن للملاحظات الصوتية اجتياز بوابة الإشارة.

**سلوك الاحتياطي:**

- إذا فشل النسخ أثناء التمهيد (مهلة، خطأ API، وما إلى ذلك)، تتم معالجة الرسالة بناءً على اكتشاف الإشارات النصي فقط.
- يضمن هذا عدم إسقاط الرسائل المختلطة (نص + صوت) بشكل غير صحيح أبدًا.

**إلغاء الاشتراك لكل مجموعة/موضوع في Telegram:**

- عيّن `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات إشارات النص المنسوخ التمهيدية لتلك المجموعة.
- عيّن `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` لفرض التمكين).
- الافتراضي هو `false` (التمهيد ممكّن عندما تتطابق شروط بوابة الإشارة).

**مثال:** يرسل مستخدم ملاحظة صوتية تقول "Hey @Claude, what's the weather?" في مجموعة Telegram مع `requireMention: true`. يتم نسخ الملاحظة الصوتية، واكتشاف الإشارة، ويرد الوكيل.

## تنبيهات

- تستخدم قواعد النطاق أسبقية أول تطابق. يتم تطبيع `chatType` إلى `direct` أو `group` أو `room`.
- تأكد من أن CLI تخرج بالرمز 0 وتطبع نصًا عاديًا؛ يحتاج JSON إلى المعالجة عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`، إذا مررت `--output-dir`، يقرأ OpenClaw من `<output-dir>/<media-basename>.txt` عندما تكون `--output-format` هي `txt` (أو محذوفة)؛ أما تنسيقات المخرجات غير `txt` فتعود إلى تحليل stdout.
- أبقِ المهل معقولة (`timeoutSeconds`، الافتراضي 60 ثانية) لتجنب حظر طابور الرد.
- لا يعالج النسخ التمهيدي إلا المرفق الصوتي **الأول** لاكتشاف الإشارات. تتم معالجة الصوت الإضافي أثناء مرحلة فهم الوسائط الرئيسية.

## ذات صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع التحدث](/ar/nodes/talk)
- [تنبيه الصوت](/ar/nodes/voicewake)
