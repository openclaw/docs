---
read_when:
    - تغيير النسخ النصي للصوت أو معالجة الوسائط
summary: كيف يتم تنزيل الصوت/الملاحظات الصوتية الواردة، ونسخها نصيًا، وحقنها في الردود
title: الصوت والملاحظات الصوتية
x-i18n:
    generated_at: "2026-04-24T07:50:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# الصوت / الملاحظات الصوتية (2026-01-17)

## ما الذي يعمل

- **فهم الوسائط (الصوت)**: إذا كان فهم الصوت مفعّلًا (أو تم اكتشافه تلقائيًا)، فإن OpenClaw:
  1. يحدد أول مرفق صوتي (مسار محلي أو URL) وينزله عند الحاجة.
  2. يفرض `maxBytes` قبل الإرسال إلى كل إدخال نموذج.
  3. يشغّل أول إدخال نموذج مؤهل بالترتيب (مزوّد أو CLI).
  4. إذا فشل أو تم تخطيه (بسبب الحجم/المهلة)، فإنه يجرّب الإدخال التالي.
  5. عند النجاح، يستبدل `Body` بكتلة `[Audio]` ويضبط `{{Transcript}}`.
- **تحليل الأوامر**: عندما ينجح النسخ النصي، تُضبط `CommandBody`/`RawBody` على النص المنسوخ بحيث تظل أوامر الشرطة المائلة تعمل.
- **التسجيل التفصيلي**: في وضع `--verbose`, نسجّل وقت تشغيل النسخ النصي وعند استبداله للنص.

## الاكتشاف التلقائي (افتراضيًا)

إذا **لم تُهيّئ نماذج** وكانت `tools.media.audio.enabled` **ليست** مضبوطة على `false`,
فإن OpenClaw يكتشف تلقائيًا بهذا الترتيب ويتوقف عند أول خيار يعمل:

1. **نموذج الرد النشط** عندما يدعم مزوّده فهم الصوت.
2. **واجهات CLI المحلية** ‏(إذا كانت مثبتة)
   - `sherpa-onnx-offline` ‏(يتطلب `SHERPA_ONNX_MODEL_DIR` مع encoder/decoder/joiner/tokens)
   - `whisper-cli` ‏(من `whisper-cpp`; ويستخدم `WHISPER_CPP_MODEL` أو النموذج الصغير المضمّن)
   - `whisper` ‏(Python CLI; وينزّل النماذج تلقائيًا)
3. **Gemini CLI** ‏(`gemini`) باستخدام `read_many_files`
4. **مصادقة المزوّد**
   - تُجرَّب أولًا إدخالات `models.providers.*` المهيأة التي تدعم الصوت
   - ترتيب الرجوع الاحتياطي المضمّن: OpenAI → Groq → Deepgram → Google → Mistral

لتعطيل الاكتشاف التلقائي، اضبط `tools.media.audio.enabled: false`.
وللتخصيص، اضبط `tools.media.audio.models`.
ملاحظة: يكون اكتشاف الملفات الثنائية بأفضل جهد عبر macOS/Linux/Windows; تأكد من أن CLI موجودة على `PATH` ‏(نحن نوسّع `~`)، أو اضبط نموذج CLI صريحًا مع مسار أمر كامل.

## أمثلة على التهيئة

### مزوّد + رجوع احتياطي CLI ‏(OpenAI + Whisper CLI)

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

### مزوّد فقط مع تقييد بالنطاق

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

### إعادة النص المنسوخ إلى الدردشة (اشتراك اختياري)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // الافتراضي false
        echoFormat: '📝 "{transcript}"', // اختياري، ويدعم {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## ملاحظات وحدود

- تتبع مصادقة المزوّد ترتيب مصادقة النموذج القياسي (ملفات تعريف auth، ومتغيرات env، و`models.providers.*.apiKey`).
- تفاصيل إعداد Groq: ‏[Groq](/ar/providers/groq).
- يلتقط Deepgram المتغير `DEEPGRAM_API_KEY` عند استخدام `provider: "deepgram"`.
- تفاصيل إعداد Deepgram: ‏[Deepgram (النسخ النصي للصوت)](/ar/providers/deepgram).
- تفاصيل إعداد Mistral: ‏[Mistral](/ar/providers/mistral).
- يمكن لمزوّدي الصوت تجاوز `baseUrl`, و`headers`, و`providerOptions` عبر `tools.media.audio`.
- الحد الافتراضي للحجم هو 20MB ‏(`tools.media.audio.maxBytes`). ويُتخطى الصوت كبير الحجم لذلك النموذج ويُجرَّب الإدخال التالي.
- تُتخطى الملفات الصوتية الصغيرة جدًا/الفارغة التي يقل حجمها عن 1024 بايت قبل النسخ النصي عبر المزوّد/CLI.
- تكون قيمة `maxChars` الافتراضية للصوت **غير مضبوطة** ‏(النص المنسوخ الكامل). اضبط `tools.media.audio.maxChars` أو `maxChars` لكل إدخال لتقليص المخرجات.
- القيمة الافتراضية التلقائية لـ OpenAI هي `gpt-4o-mini-transcribe`; واضبط `model: "gpt-4o-transcribe"` لدقة أعلى.
- استخدم `tools.media.audio.attachments` لمعالجة عدة ملاحظات صوتية (`mode: "all"` + `maxAttachments`).
- يتوفر النص المنسوخ للقوالب بوصفه `{{Transcript}}`.
- تكون `tools.media.audio.echoTranscript` معطلة افتراضيًا؛ فعّلها لإرسال تأكيد بالنص المنسوخ مرة أخرى إلى الدردشة الأصلية قبل معالجة الوكيل.
- تخصّص `tools.media.audio.echoFormat` نص الإعادة (العنصر النائب: `{transcript}`).
- تُحد مخرجات CLI القياسية stdout ‏(5MB); فأبقِ مخرجات CLI موجزة.

### دعم بيئة الوكيل

تحترم عملية النسخ النصي للصوت المعتمدة على المزوّد متغيرات env القياسية الخاصة بالوكيل الصادر:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

إذا لم تُضبط أي متغيرات env للوكيل، فيُستخدم الخروج المباشر. وإذا كانت تهيئة الوكيل مشوّهة، فيسجل OpenClaw تحذيرًا ويعود إلى الجلب المباشر.

## اكتشاف الإشارة في المجموعات

عند ضبط `requireMention: true` لمحادثة جماعية، يقوم OpenClaw الآن بنسخ الصوت نصيًا **قبل** التحقق من الإشارات. وهذا يسمح بمعالجة الملاحظات الصوتية حتى عندما تحتوي على إشارات.

**كيف يعمل:**

1. إذا كانت الرسالة الصوتية بلا نص وكانت المجموعة تتطلب إشارات، ينفذ OpenClaw نسخًا نصيًا "تمهيديًا".
2. يُفحَص النص المنسوخ بحثًا عن أنماط الإشارة (مثل `@BotName` أو محفزات emoji).
3. إذا عُثر على إشارة، تنتقل الرسالة عبر خط أنابيب الرد الكامل.
4. يُستخدم النص المنسوخ لاكتشاف الإشارة حتى تتمكن الملاحظات الصوتية من اجتياز بوابة الإشارة.

**سلوك الرجوع الاحتياطي:**

- إذا فشل النسخ النصي أثناء التمهيد (مهلة، خطأ API، إلخ)، تُعالَج الرسالة بناءً على اكتشاف الإشارة النصي فقط.
- وهذا يضمن عدم إسقاط الرسائل المختلطة (نص + صوت) بشكل غير صحيح.

**إلغاء الاشتراك لكل مجموعة/موضوع في Telegram:**

- اضبط `channels.telegram.groups.<chatId>.disableAudioPreflight: true` لتخطي فحوصات الإشارة التمهيدية المعتمدة على النص المنسوخ لتلك المجموعة.
- اضبط `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` للتجاوز لكل موضوع (`true` للتخطي، و`false` للفرض الصريح للتفعيل).
- القيمة الافتراضية `false` ‏(التمهيد مفعّل عندما تتطابق شروط تقييد الإشارة).

**مثال:** يرسل مستخدم ملاحظة صوتية يقول فيها "Hey @Claude, what's the weather?" في مجموعة Telegram مع `requireMention: true`. فتُنسخ الملاحظة الصوتية نصيًا، وتُكتشف الإشارة، ويرد الوكيل.

## أمور ينبغي الانتباه لها

- تستخدم قواعد النطاق مبدأ أول تطابق يفوز. وتُطبَّع `chatType` إلى `direct`, أو `group`, أو `room`.
- تأكد من أن CLI لديك تخرج بالرمز 0 وتطبع نصًا عاديًا؛ أما JSON فتحتاج إلى معالجتها عبر `jq -r .text`.
- بالنسبة إلى `parakeet-mlx`, إذا مرّرت `--output-dir`, فإن OpenClaw يقرأ `<output-dir>/<media-basename>.txt` عندما تكون `--output-format` مساوية لـ `txt` ‏(أو محذوفة)؛ وتعود تنسيقات الإخراج غير `txt` إلى تحليل stdout.
- أبقِ المهلات معقولة (`timeoutSeconds`, والافتراضي 60s) لتجنب حظر طابور الردود.
- لا يعالج النسخ النصي التمهيدي إلا **أول** مرفق صوتي لاكتشاف الإشارة. أما الصوتيات الإضافية فتُعالَج أثناء مرحلة فهم الوسائط الرئيسية.

## ذو صلة

- [فهم الوسائط](/ar/nodes/media-understanding)
- [وضع Talk](/ar/nodes/talk)
- [الإيقاظ الصوتي](/ar/nodes/voicewake)
