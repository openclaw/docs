---
read_when:
    - تمكين تحويل النص إلى كلام للردود
    - إعداد موفّري TTS أو الحدود
    - استخدام أوامر /tts
summary: تحويل النص إلى كلام (TTS) للردود الصادرة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-04-08T06:02:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e0fbcaf61282733c134f682e05a71f94d2169c03a85131ce9ad233c71a1e533
    source_path: tools/tts.md
    workflow: 15
---

# تحويل النص إلى كلام (TTS)

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت باستخدام ElevenLabs أو Microsoft أو MiniMax أو OpenAI.
وهو يعمل في أي مكان يستطيع OpenClaw إرسال الصوت إليه.

## الخدمات المدعومة

- **ElevenLabs** (موفّر أساسي أو احتياطي)
- **Microsoft** (موفّر أساسي أو احتياطي؛ يستخدم التنفيذ المضمّن الحالي `node-edge-tts`)
- **MiniMax** (موفّر أساسي أو احتياطي؛ يستخدم واجهة T2A v2 API)
- **OpenAI** (موفّر أساسي أو احتياطي؛ ويُستخدم أيضًا للملخصات)

### ملاحظات Microsoft Speech

يستخدم موفّر Microsoft speech المضمّن حاليًا خدمة TTS العصبية عبر الإنترنت من Microsoft Edge
من خلال مكتبة `node-edge-tts`. وهي خدمة مستضافة (وليست
محلية)، وتستخدم نقاط نهاية Microsoft، ولا تتطلب مفتاح API.
يوفّر `node-edge-tts` خيارات إعداد للكلام وتنسيقات إخراج، لكن
ليست كل الخيارات مدعومة من الخدمة. لا يزال إدخال الإعدادات والتوجيهات القديم
باستخدام `edge` يعمل ويجري تطبيعه إلى `microsoft`.

ولأن هذا المسار يعتمد على خدمة ويب عامة من دون SLA أو حصة منشورة،
فتعامل معه على أنه أفضل جهد. إذا كنت تحتاج إلى حدود مضمونة ودعم، فاستخدم OpenAI
أو ElevenLabs.

## المفاتيح الاختيارية

إذا كنت تريد OpenAI أو ElevenLabs أو MiniMax:

- `ELEVENLABS_API_KEY` (أو `XI_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

لا يتطلب Microsoft speech **مفتاح API**.

إذا جرى إعداد عدة موفّرين، فسيُستخدم الموفّر المحدد أولًا وسيكون الآخرون خيارات احتياطية.
ويستخدم التلخيص التلقائي `summaryModel` المُعدّ (أو `agents.defaults.model.primary`)،
لذلك يجب أيضًا أن يكون هذا الموفّر موثّقًا إذا فعّلت الملخصات.

## روابط الخدمات

- [دليل OpenAI لتحويل النص إلى كلام](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام في ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [المصادقة في ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [واجهة MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات إخراج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## هل هو مفعّل افتراضيًا؟

لا. التحويل التلقائي إلى كلام **معطّل** افتراضيًا. فعّله في الإعدادات عبر
`messages.tts.auto` أو محليًا باستخدام `/tts on`.

عندما لا تكون `messages.tts.provider` معيّنة، يختار OpenClaw أول
موفّر كلام مُعدّ وفق ترتيب الاختيار التلقائي في السجل.

## الإعدادات

توجد إعدادات TTS تحت `messages.tts` في `openclaw.json`.
والمخطط الكامل موجود في [إعدادات Gateway](/ar/gateway/configuration).

### إعدادات دنيا (تمكين + موفّر)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI أساسي مع ElevenLabs احتياطي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft أساسي (من دون مفتاح API)

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```

### تعطيل Microsoft speech

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### حدود مخصصة + مسار التفضيلات

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### الرد بالصوت فقط بعد رسالة صوتية واردة

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### تعطيل التلخيص التلقائي للردود الطويلة

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

ثم شغّل:

```
/tts summary off
```

### ملاحظات حول الحقول

- `auto`: وضع التحويل التلقائي إلى كلام (`off`, `always`, `inbound`, `tagged`).
  - يرسل `inbound` الصوت فقط بعد رسالة صوتية واردة.
  - يرسل `tagged` الصوت فقط عندما يتضمن الرد وسوم `[[tts]]`.
- `enabled`: مفتاح تبديل قديم (يقوم doctor بترحيله إلى `auto`).
- `mode`: `"final"` (افتراضي) أو `"all"` (يشمل ردود الأدوات/الكتل).
- `provider`: معرّف موفّر الكلام مثل `"elevenlabs"` أو `"microsoft"` أو `"minimax"` أو `"openai"` (الاحتياطي تلقائي).
- إذا كانت `provider` **غير معيّنة**، يستخدم OpenClaw أول موفّر كلام مُعدّ وفق ترتيب الاختيار التلقائي في السجل.
- لا يزال `provider: "edge"` القديم يعمل ويجري تطبيعه إلى `microsoft`.
- `summaryModel`: نموذج منخفض التكلفة اختياري للتلخيص التلقائي؛ والافتراضي هو `agents.defaults.model.primary`.
  - يقبل `provider/model` أو اسمًا مستعارًا لنموذج مُعدّ.
- `modelOverrides`: يسمح للنموذج بإخراج توجيهات TTS (مفعّل افتراضيًا).
  - تكون القيمة الافتراضية لـ `allowProvider` هي `false` (تبديل الموفّر يتم بالاشتراك الاختياري).
- `providers.<id>`: إعدادات يملكها الموفّر ومفاتيحها هي معرّفات موفّري الكلام.
- كتل الموفّر المباشرة القديمة (`messages.tts.openai` و`messages.tts.elevenlabs` و`messages.tts.microsoft` و`messages.tts.edge`) تُرحّل تلقائيًا إلى `messages.tts.providers.<id>` عند التحميل.
- `maxTextLength`: حد صارم لإدخال TTS (أحرف). يفشل `/tts audio` إذا تم تجاوزه.
- `timeoutMs`: مهلة الطلب (مللي ثانية).
- `prefsPath`: تجاوز مسار JSON المحلي للتفضيلات (الموفّر/الحد/الملخص).
- ترجع قيم `apiKey` إلى متغيرات البيئة (`ELEVENLABS_API_KEY`/`XI_API_KEY` و`MINIMAX_API_KEY` و`OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: تجاوز عنوان URL الأساسي لـ ElevenLabs API.
- `providers.openai.baseUrl`: تجاوز نقطة نهاية OpenAI TTS.
  - ترتيب الحل: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - تُعامل القيم غير الافتراضية على أنها نقاط نهاية TTS متوافقة مع OpenAI، لذلك تُقبل أسماء النماذج والأصوات المخصصة.
- `providers.elevenlabs.voiceSettings`:
  - `stability` و`similarityBoost` و`style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = عادي)
- `providers.elevenlabs.applyTextNormalization`: ‏`auto|on|off`
- `providers.elevenlabs.languageCode`: معيار ISO 639-1 من حرفين (مثل `en` و`de`)
- `providers.elevenlabs.seed`: عدد صحيح `0..4294967295` (حتمية بأفضل جهد)
- `providers.minimax.baseUrl`: تجاوز عنوان URL الأساسي لـ MiniMax API (الافتراضي `https://api.minimax.io`، ومتغير البيئة: `MINIMAX_API_HOST`).
- `providers.minimax.model`: نموذج TTS (الافتراضي `speech-2.8-hd`، ومتغير البيئة: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: معرّف الصوت (الافتراضي `English_expressive_narrator`، ومتغير البيئة: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: سرعة التشغيل `0.5..2.0` (الافتراضي 1.0).
- `providers.minimax.vol`: مستوى الصوت `(0, 10]` (الافتراضي 1.0؛ ويجب أن يكون أكبر من 0).
- `providers.minimax.pitch`: تغيير الحدة `-12..12` (الافتراضي 0).
- `providers.microsoft.enabled`: السماح باستخدام Microsoft speech (الافتراضي `true`؛ من دون مفتاح API).
- `providers.microsoft.voice`: اسم الصوت العصبي لـ Microsoft (مثل `en-US-MichelleNeural`).
- `providers.microsoft.lang`: رمز اللغة (مثل `en-US`).
- `providers.microsoft.outputFormat`: تنسيق إخراج Microsoft (مثل `audio-24khz-48kbitrate-mono-mp3`).
  - راجع تنسيقات إخراج Microsoft Speech لمعرفة القيم الصحيحة؛ فليست كل التنسيقات مدعومة بواسطة النقل المضمّن المعتمد على Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: سلاسل نسب مئوية (مثل `+10%` و`-5%`).
- `providers.microsoft.saveSubtitles`: كتابة ترجمات JSON إلى جانب ملف الصوت.
- `providers.microsoft.proxy`: عنوان URL للوكيل لطلبات Microsoft speech.
- `providers.microsoft.timeoutMs`: تجاوز مهلة الطلب (مللي ثانية).
- `edge.*`: اسم مستعار قديم لإعدادات Microsoft نفسها.

## تجاوزات يقودها النموذج (مفعّلة افتراضيًا)

افتراضيًا، **يمكن** للنموذج إخراج توجيهات TTS لرد واحد.
عندما تكون `messages.tts.auto` هي `tagged`، تكون هذه التوجيهات مطلوبة لتفعيل الصوت.

عند التمكين، يمكن للنموذج إخراج توجيهات `[[tts:...]]` لتجاوز الصوت
لرد واحد، بالإضافة إلى كتلة `[[tts:text]]...[[/tts:text]]` اختيارية
لتوفير وسوم تعبيرية (ضحك، إشارات غناء، وغير ذلك) ينبغي أن تظهر فقط في
الصوت.

يتم تجاهل توجيهات `provider=...` ما لم تكن `modelOverrides.allowProvider: true`.

مثال على حمولة الرد:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

مفاتيح التوجيه المتاحة (عند التمكين):

- `provider` (معرّف موفّر كلام مسجّل، مثل `openai` أو `elevenlabs` أو `minimax` أو `microsoft`؛ يتطلب `allowProvider: true`)
- `voice` (صوت OpenAI) أو `voiceId` (ElevenLabs / MiniMax)
- `model` (نموذج OpenAI TTS أو معرّف نموذج ElevenLabs أو نموذج MiniMax)
- `stability` و`similarityBoost` و`style` و`speed` و`useSpeakerBoost`
- `vol` / `volume` (مستوى صوت MiniMax، من 0 إلى 10)
- `pitch` (حدة MiniMax، من -12 إلى 12)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

تعطيل جميع تجاوزات النموذج:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

قائمة سماح اختيارية (تمكين تبديل الموفّر مع إبقاء بقية الخيارات قابلة للضبط):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## تفضيلات لكل مستخدم

تكتب أوامر الشرطة المائلة التجاوزات المحلية إلى `prefsPath` (الافتراضي:
`~/.openclaw/settings/tts.json`، ويمكن تجاوزه بواسطة `OPENCLAW_TTS_PREFS` أو
`messages.tts.prefsPath`).

الحقول المخزنة:

- `enabled`
- `provider`
- `maxLength` (عتبة التلخيص؛ الافتراضي 1500 حرفًا)
- `summarize` (الافتراضي `true`)

وتتجاوز هذه القيم `messages.tts.*` لهذا المضيف.

## تنسيقات الإخراج (ثابتة)

- **Feishu / Matrix / Telegram / WhatsApp**: رسالة صوتية Opus (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - يمثل 48kHz / 64kbps توازنًا جيدًا للرسائل الصوتية.
- **القنوات الأخرى**: MP3 (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - يمثل 44.1kHz / 128kbps التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: ‏MP3 (نموذج `speech-2.8-hd`، ومعدل عينات 32kHz). تنسيق الملاحظات الصوتية غير مدعوم أصلاً؛ استخدم OpenAI أو ElevenLabs للحصول على رسائل صوتية Opus مضمونة.
- **Microsoft**: يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل النقل المضمّن `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الإخراج تنسيقات إخراج Microsoft Speech (بما في ذلك Ogg/WebM Opus).
  - يقبل `sendVoice` في Telegram تنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق إخراج Microsoft المُعدّ، يعيد OpenClaw المحاولة باستخدام MP3.

تنسيقات إخراج OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك التحويل التلقائي إلى كلام

عند التمكين، يقوم OpenClaw بما يلي:

- يتجاوز TTS إذا كان الرد يحتوي بالفعل على وسائط أو توجيه `MEDIA:`.
- يتجاوز الردود القصيرة جدًا (< 10 أحرف).
- يلخّص الردود الطويلة عند التمكين باستخدام `agents.defaults.model.primary` (أو `summaryModel`).
- يرفق الصوت المُنشأ بالرد.

إذا تجاوز الرد `maxLength` وكان التلخيص معطّلًا (أو لم يوجد مفتاح API لـ
نموذج التلخيص)، فسيتم
تجاوز الصوت وإرسال الرد النصي العادي.

## مخطط التدفق

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## استخدام أوامر الشرطة المائلة

يوجد أمر واحد فقط: `/tts`.
راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) لمعرفة تفاصيل التمكين.

ملاحظة Discord: إن `/tts` هو أمر مضمّن في Discord، لذلك يسجّل OpenClaw
`/voice` هناك بوصفه الأمر الأصلي. ولا يزال النص `/tts ...` يعمل.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

ملاحظات:

- تتطلب الأوامر مرسلًا مخولًا (ما تزال قواعد allowlist/owner تنطبق).
- يجب أن يكون `commands.text` أو تسجيل الأمر الأصلي مفعّلًا.
- تقبل الإعدادات `messages.tts.auto` القيم `off|always|inbound|tagged`.
- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتب `/tts off` إلى `off`.
- استخدم الإعدادات عندما تريد قيمًا افتراضية من نوع `inbound` أو `tagged`.
- يتم تخزين `limit` و`summary` في التفضيلات المحلية، وليس في الإعدادات الرئيسية.
- يولد `/tts audio` ردًا صوتيًا لمرة واحدة (ولا يفعّل TTS).
- يتضمن `/tts status` رؤية للاحتياطي عند أحدث محاولة:
  - نجاح احتياطي: `Fallback: <primary> -> <used>` بالإضافة إلى `Attempts: ...`
  - فشل: `Error: ...` بالإضافة إلى `Attempts: ...`
  - تشخيصات مفصلة: `Attempt details: provider:outcome(reasonCode) latency`
- تتضمن إخفاقات OpenAI وElevenLabs في API الآن تفاصيل الخطأ المحللة ومعرّف الطلب (عند إرجاعه من الموفّر)، ويظهر ذلك في أخطاء/سجلات TTS.

## أداة الوكيل

تقوم أداة `tts` بتحويل النص إلى كلام وتعيد مرفقًا صوتيًا من أجل
تسليم الرد. وعندما تكون القناة هي Feishu أو Matrix أو Telegram أو WhatsApp،
يتم تسليم الصوت بوصفه رسالة صوتية بدلًا من مرفق ملف.

## Gateway RPC

طرائق Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
