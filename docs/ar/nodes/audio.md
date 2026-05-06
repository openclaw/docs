---
read_when:
    - تغيير تفريغ الصوت أو معالجة الوسائط
summary: كيفية تنزيل المقاطع الصوتية/الملاحظات الصوتية الواردة، ونسخها نصيًا، وإدراجها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
    generated_at: "2026-05-06T08:02:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520620da5a643bb8e17318d7304ae4be3bd2586b0866614ad741685de5b8ef05
    source_path: nodes/audio.md
    workflow: 16
---

# الصوت / الملاحظات الصوتية (2026-01-17)

## ما يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت مفعّلًا (أو تم اكتشافه تلقائيًا)، فإن OpenClaw:
  1. يحدد أول مرفق صوتي (مسار محلي أو URL) وينزّله عند الحاجة.
  2. يفرض `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغّل أول إدخال نموذج مؤهل بالترتيب (مزوّد أو CLI).
  4. إذا فشل أو تم تخطيه (الحجم/المهلة)، يجرب الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويعيّن `{{Transcript}}`.
- **تحليل الأوامر**: عند نجاح التفريغ النصي، يتم تعيين `CommandBody`/`RawBody` إلى النص المفرغ بحيث تظل أوامر الشرطة المائلة تعمل.
- **التسجيل التفصيلي**: في `--verbose`، نسجل عند تشغيل التفريغ النصي وعند استبداله للمتن.

## الاكتشاف التلقائي (الافتراضي)

إذا **لم تقم بتكوين النماذج** ولم يتم تعيين `tools.media.audio.enabled` إلى `false`،
يفحص OpenClaw تلقائيًا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم مزوّده فهم الصوت.
2. **أدوات CLI المحلية** (إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (من `whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمّن)
   - `whisper` (Python CLI؛ ينزّل النماذج تلقائيًا)
3. **Gemini CLI** (`gemini`) باستخدام `read_many_files`
4. **مصادقة المزوّد**
   - تتم تجربة إدخالات `models.providers.*` المكوّنة التي تدعم الصوت أولًا
   - ترتيب الرجوع المضمّن: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

لتعطيل الاكتشاف التلقائي، عيّن `tools.media.audio.enabled: false`.
للتخصيص، عيّن `tools.media.audio.models`.
ملاحظة: اكتشاف الثنائيات يتم بأفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود على `PATH` (نوسّع `~`)، أو عيّن نموذج CLI صريحًا مع مسار أمر كامل.

## أمثلة التكوين

### مزوّد + رجوع CLI (OpenAI + Whisper CLI)

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

### مزوّد فقط مع ضبط النطاق

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

### ترديد النص المفرغ إلى الدردشة (اختياري)

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

- تتبع مصادقة المزوّد ترتيب مصادقة النموذج القياسي (ملفات تعريف المصادقة، متغيرات البيئة، `models.providers.*.apiKey`).
- تفاصيل إعداد Groq: [Groq](/ar/providers/groq).
- يلتقط Deepgram المتغير `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: [Deepgram (تفريغ الصوت نصيًا)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: [Mistral](/ar/providers/mistral).
- يلتقط SenseAudio المتغير `SENSEAUDIO_API_KEY` عند استخدام `provider: "senseaudio"`.
- تفاصيل إعداد SenseAudio: [SenseAudio](/ar/providers/senseaudio).
- يمكن لمزوّدي الصوت تجاوز `baseUrl` و`headers` و`providerOptions` عبر `tools.media.audio`.
- حد الحجم الافتراضي هو 20MB (`tools.media.audio.maxBytes`). يتم تخطي الصوت كبير الحجم لذلك النموذج وتجربة الإدخال التالي.
- يتم تخطي ملفات الصوت الصغيرة جدًا/الفارغة التي تقل عن 1024 بايت قبل التفريغ النصي عبر المزوّد/CLI.
- قيمة `maxChars` الافتراضية للصوت **غير معيّنة** (النص المفرغ الكامل). عيّن `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لتقصير الإخراج.
- الافتراضي التلقائي لـ OpenAI هو `gpt-4o-mini-transcribe`؛ عيّن `model: "gpt-4o-transcribe"` لدقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة عدة ملاحظات صوتية (`mode: "all"` + `maxAttachments`).
- يتوفر النص المفرغ للقوالب باسم `{{Transcript}}`.
- يكون `tools.media.audio.echoTranscript` متوقفًا افتراضيًا؛ فعّله لإرسال تأكيد النص المفرغ إلى الدردشة الأصلية قبل معالجة الوكيل.
- يخصص `tools.media.audio.echoFormat` نص الترديد (العنصر النائب: `{transcript}`).
- إخراج stdout في CLI محدود (5MB)؛ اجعل إخراج CLI موجزًا.
- يجب أن تستخدم `args` في CLI الرمز `{{MediaPath}}` لمسار ملف الصوت المحلي. شغّل `openclaw doctor --fix` لترحيل عناصر `{input}` النائبة المهملة من تكوينات `audio.transcription.command` الأقدم.

### دعم بيئة الوكيل

يحترم تفريغ الصوت النصي المعتمد على المزوّد متغيرات بيئة وكيل الخروج القياسية:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

إذا لم يتم تعيين أي متغيرات بيئة وكيل، يُستخدم الخروج المباشر. إذا كان تكوين الوكيل غير صحيح، يسجل OpenClaw تحذيرًا ويعود إلى الجلب المباشر.

## اكتشاف الإشارات في المجموعات

عند تعيين `requireMention: true` لدردشة جماعية، يقوم OpenClaw الآن بتفريغ الصوت نصيًا **قبل** التحقق من الإشارات. يتيح ذلك معالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيف يعمل:**

1. إذا لم تكن لرسالة صوتية أي متن نصي وكانت المجموعة تتطلب إشارات، ينفذ OpenClaw تفريغًا نصيًا "تمهيديًا".
2. يتم فحص النص المفرغ بحثًا عن أنماط الإشارة (مثل `@BotName` ومشغلات الرموز التعبيرية).
3. إذا تم العثور على إشارة، تنتقل الرسالة عبر مسار الرد الكامل.
4. يُستخدم النص المفرغ لاكتشاف الإشارات بحيث يمكن للملاحظات الصوتية اجتياز بوابة الإشارة.

**سلوك الرجوع:**

- إذا فشل التفريغ النصي أثناء التمهيد (مهلة، خطأ API، إلخ)، تتم معالجة الرسالة استنادًا إلى اكتشاف الإشارة النصي فقط.
- يضمن ذلك عدم إسقاط الرسائل المختلطة (نص + صوت) بشكل غير صحيح أبدًا.

**تعطيل لكل مجموعة/موضوع في Telegram:**

- عيّن `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات إشارات النص المفرغ التمهيدية لتلك المجموعة.
- عيّن `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` لفرض التفعيل).
- الافتراضي هو `false` (يكون التمهيد مفعّلًا عندما تتطابق شروط بوابة الإشارة).

**مثال:** يرسل مستخدم ملاحظة صوتية تقول "Hey @Claude, what's the weather?" في مجموعة Telegram مع `requireMention: true`. يتم تفريغ الملاحظة الصوتية نصيًا، واكتشاف الإشارة، ويرد الوكيل.

## ملاحظات مهمة

- تستخدم قواعد النطاق أول تطابق فائز. يتم تطبيع `chatType` إلى `direct` أو `group` أو `room`.
- تأكد من أن CLI يخرج بالحالة 0 ويطبع نصًا عاديًا؛ يحتاج JSON إلى المعالجة عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`، إذا مررت `--output-dir`، يقرأ OpenClaw الملف `<output-dir>/<media-basename>.txt` عندما يكون `--output-format` هو `txt` (أو غير مذكور)؛ تعود تنسيقات الإخراج غير `txt` إلى تحليل stdout.
- أبقِ المهل معقولة (`timeoutSeconds`، الافتراضي 60 ثانية) لتجنب حظر قائمة انتظار الرد.
- يعالج التفريغ النصي التمهيدي **أول** مرفق صوتي فقط لاكتشاف الإشارات. تتم معالجة الصوت الإضافي أثناء مرحلة فهم الوسائط الرئيسية.

## ذات صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع التحدث](/ar/nodes/talk)
- [التنبيه الصوتي](/ar/nodes/voicewake)
