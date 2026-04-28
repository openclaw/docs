---
read_when:
    - تغيير تفريغ الصوت إلى نص أو معالجة الوسائط
summary: كيف يتم تنزيل الصوت/الملاحظات الصوتية الواردة، وتفريغها إلى نص، وحقنها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-25T13:50:44Z"
  model: gpt-5.4
  provider: openai
  source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
  source_path: nodes/audio.md
  workflow: 15
---

# الصوت / الملاحظات الصوتية (2026-01-17)

## ما الذي يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت مفعّلًا (أو تم اكتشافه تلقائيًا)، فإن OpenClaw:
  1. يحدد أول مرفق صوتي (مسار محلي أو URL) ويقوم بتنزيله إذا لزم الأمر.
  2. يفرض `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغّل أول إدخال نموذج مؤهل بالترتيب (موفّر أو CLI).
  4. إذا فشل أو تم تجاوزه (الحجم/المهلة)، فإنه يجرّب الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويضبط `{{Transcript}}`.
- **تحليل الأوامر**: عندما ينجح التفريغ إلى نص، يتم ضبط `CommandBody`/`RawBody` على النص المفرغ بحيث تستمر أوامر الشرطة المائلة في العمل.
- **التسجيل المطوّل**: في وضع `--verbose`، نسجل وقت تشغيل التفريغ إلى نص ووقت استبداله للنص الأساسي.

## الاكتشاف التلقائي (الافتراضي)

إذا **لم تقم بتهيئة نماذج** ولم يتم ضبط `tools.media.audio.enabled` على **`false`**،
فإن OpenClaw يكتشف تلقائيًا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم موفّره فهم الصوت.
2. **واجهات CLI المحلية** (إذا كانت مثبتة)
   - `sherpa-onnx-offline` (يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` (من `whisper-cpp`؛ يستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمن)
   - `whisper` (واجهة Python CLI؛ تنزّل النماذج تلقائيًا)
3. **Gemini CLI** ‏(`gemini`) باستخدام `read_many_files`
4. **مصادقة الموفّر**
   - تتم تجربة إدخالات `models.providers.*` المهيأة التي تدعم الصوت أولًا
   - ترتيب التراجع المضمن: OpenAI ← Groq ← xAI ← Deepgram ← Google ← SenseAudio ← ElevenLabs ← Mistral

لتعطيل الاكتشاف التلقائي، اضبط `tools.media.audio.enabled: false`.
وللتخصيص، اضبط `tools.media.audio.models`.
ملاحظة: اكتشاف الملفات الثنائية هو أفضل جهد عبر macOS/Linux/Windows؛ تأكد من أن CLI موجود على `PATH` (نقوم بتوسيع `~`) أو اضبط نموذج CLI صريحًا مع مسار أمر كامل.

## أمثلة الإعداد

### موفّر + تراجع إلى CLI ‏(OpenAI + Whisper CLI)

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

### موفّر فقط مع تقييد النطاق

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

### موفّر فقط (Deepgram)

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

### موفّر فقط (Mistral Voxtral)

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

### موفّر فقط (SenseAudio)

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

### إعادة نص التفريغ إلى الدردشة (اختياري)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // الافتراضي هو false
        echoFormat: '📝 "{transcript}"', // اختياري، يدعم {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## ملاحظات وحدود

- تتبع مصادقة الموفّر ترتيب مصادقة النموذج القياسي (ملفات تعريف المصادقة، ومتغيرات البيئة، و`models.providers.*.apiKey`).
- تفاصيل إعداد Groq: [Groq](/ar/providers/groq).
- يلتقط Deepgram المتغير `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: [Deepgram (audio transcription)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: [Mistral](/ar/providers/mistral).
- يلتقط SenseAudio المتغير `SENSEAUDIO_API_KEY` عند استخدام `provider: "senseaudio"`.
- تفاصيل إعداد SenseAudio: [SenseAudio](/ar/providers/senseaudio).
- يمكن لموفري الصوت تجاوز `baseUrl` و`headers` و`providerOptions` عبر `tools.media.audio`.
- الحد الافتراضي للحجم هو 20MB ‏(`tools.media.audio.maxBytes`). يتم تجاوز الصوت كبير الحجم لهذا النموذج وتجربة الإدخال التالي.
- يتم تجاوز ملفات الصوت الصغيرة جدًا/الفارغة التي يقل حجمها عن 1024 بايت قبل التفريغ عبر الموفّر/CLI.
- تكون القيمة الافتراضية لـ `maxChars` للصوت **غير مضبوطة** (التفريغ الكامل). اضبط `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لاقتطاع الخرج.
- القيمة الافتراضية التلقائية في OpenAI هي `gpt-4o-mini-transcribe`؛ اضبط `model: "gpt-4o-transcribe"` للحصول على دقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة عدة ملاحظات صوتية (`mode: "all"` + `maxAttachments`).
- يتوفر transcript للقوالب على شكل `{{Transcript}}`.
- يكون `tools.media.audio.echoTranscript` معطلًا افتراضيًا؛ فعّله لإرسال تأكيد transcript إلى الدردشة الأصلية قبل معالجة الوكيل.
- يخصص `tools.media.audio.echoFormat` نص الإعادة (العنصر النائب: `{transcript}`).
- يتم تقييد stdout الخاص بـ CLI ‏(5MB)؛ حافظ على خرج CLI موجزًا.

### دعم بيئة الوكيل

يحترم التفريغ الصوتي المعتمد على الموفّر متغيرات بيئة الوكيل الصادرة القياسية:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

إذا لم يتم ضبط أي متغيرات بيئة للوكيل، يتم استخدام الخروج المباشر. وإذا كان إعداد الوكيل غير صحيح، يسجل OpenClaw تحذيرًا ويعود إلى الجلب المباشر.

## اكتشاف الإشارات في المجموعات

عندما يتم ضبط `requireMention: true` لدردشة جماعية، يقوم OpenClaw الآن بتفريغ الصوت إلى نص **قبل** التحقق من الإشارات. يتيح هذا معالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيف يعمل:**

1. إذا لم يكن للرسالة الصوتية نص أساسي وكان grupo يتطلب إشارات، يجري OpenClaw تفريغًا إلى نص "تمهيديًا".
2. يتم فحص transcript بحثًا عن أنماط الإشارة (مثل `@BotName` أو مشغلات emoji).
3. إذا تم العثور على إشارة، تنتقل الرسالة عبر مسار الرد الكامل.
4. يُستخدم transcript لاكتشاف الإشارات بحيث يمكن للملاحظات الصوتية اجتياز بوابة الإشارة.

**سلوك التراجع:**

- إذا فشل التفريغ إلى نص أثناء المرحلة التمهيدية (مهلة، خطأ API، إلخ)، تتم معالجة الرسالة استنادًا إلى اكتشاف الإشارات النصية فقط.
- وهذا يضمن عدم إسقاط الرسائل المختلطة (نص + صوت) بشكل غير صحيح أبدًا.

**إلغاء الاشتراك لكل مجموعة/موضوع في Telegram:**

- اضبط `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات الإشارة في transcript التمهيدي لتلك المجموعة.
- اضبط `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` للفرض).
- القيمة الافتراضية هي `false` (المرحلة التمهيدية مفعلة عندما تتطابق شروط تقييد الإشارة).

**مثال:** يرسل مستخدم ملاحظة صوتية يقول فيها "Hey @Claude, what's the weather?" في مجموعة Telegram مع `requireMention: true`. يتم تفريغ الملاحظة الصوتية إلى نص، واكتشاف الإشارة، ويرد الوكيل.

## أمور يجب الانتباه لها

- تستخدم قواعد النطاق مبدأ أول تطابق يفوز. يتم توحيد `chatType` إلى `direct` أو `group` أو `room`.
- تأكد من أن CLI يخرج بالرمز 0 ويطبع نصًا عاديًا؛ يحتاج JSON إلى معالجة عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`، إذا مررت `--output-dir`، فإن OpenClaw يقرأ `<output-dir>/<media-basename>.txt` عندما يكون `--output-format` هو `txt` (أو غير مذكور)؛ أما تنسيقات الخرج غير `txt` فتعود إلى تحليل stdout.
- اجعل المهلات معقولة (`timeoutSeconds`، الافتراضي 60 ثانية) لتجنب حظر قائمة انتظار الردود.
- لا تعالج المرحلة التمهيدية للتفريغ إلى نص إلا **أول** مرفق صوتي لاكتشاف الإشارات. تتم معالجة الصوت الإضافي أثناء مرحلة فهم الوسائط الرئيسية.

## ذو صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع Talk](/ar/nodes/talk)
- [Voice wake](/ar/nodes/voicewake)
