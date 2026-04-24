---
read_when:
    - تمكين تحويل النص إلى كلام للردود
    - تهيئة مزوّدي TTS أو الحدود
    - استخدام أوامر `/tts`
summary: تحويل النص إلى كلام (TTS) للردود الصادرة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-04-24T08:11:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 935fec2325a08da6f4ecd8ba5a9b889cd265025c5c7ee43bc4e0da36c1003d8f
    source_path: tools/tts.md
    workflow: 15
---

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت باستخدام ElevenLabs أو Google Gemini أو Microsoft أو MiniMax أو OpenAI أو xAI.
ويعمل ذلك في أي مكان يستطيع فيه OpenClaw إرسال الصوت.

## الخدمات المدعومة

- **ElevenLabs** ‏(كمزوّد أساسي أو fallback)
- **Google Gemini** ‏(كمزوّد أساسي أو fallback؛ يستخدم Gemini API TTS)
- **Microsoft** ‏(كمزوّد أساسي أو fallback؛ يستخدم التنفيذ المضمّن الحالي `node-edge-tts`)
- **MiniMax** ‏(كمزوّد أساسي أو fallback؛ يستخدم واجهة T2A v2 API)
- **OpenAI** ‏(كمزوّد أساسي أو fallback؛ ويُستخدم أيضًا للملخصات)
- **xAI** ‏(كمزوّد أساسي أو fallback؛ يستخدم xAI TTS API)

### ملاحظات كلام Microsoft

يستخدم مزوّد الكلام Microsoft المضمّن حاليًا خدمة TTS العصبية
عبر الإنترنت الخاصة بـ Microsoft Edge من خلال مكتبة `node-edge-tts`. وهي خدمة مستضافة (وليست
محلية)، وتستخدم نقاط نهاية Microsoft، ولا تتطلب مفتاح API.
تكشف `node-edge-tts` خيارات تهيئة الكلام وتنسيقات الإخراج، لكن
ليست كل الخيارات مدعومة من الخدمة. وما تزال التهيئة القديمة ومدخلات التوجيه
باستخدام `edge` تعمل وتُطبَّع إلى `microsoft`.

ولأن هذا المسار خدمة ويب عامة من دون SLA أو حصة منشورة،
فتعامل معه على أنه best-effort. وإذا كنت تحتاج إلى حدود مضمونة ودعم، فاستخدم OpenAI
أو ElevenLabs.

## المفاتيح الاختيارية

إذا كنت تريد OpenAI أو ElevenLabs أو Google Gemini أو MiniMax أو xAI:

- `ELEVENLABS_API_KEY` ‏(أو `XI_API_KEY`)
- `GEMINI_API_KEY` ‏(أو `GOOGLE_API_KEY`)
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

كلام Microsoft **لا** يتطلب مفتاح API.

إذا تم تهيئة عدة مزوّدين، فسيُستخدم المزوّد المحدد أولًا وتكون المزوّدات الأخرى خيارات fallback.
ويستخدم التلخيص التلقائي `summaryModel` المهيأ (أو `agents.defaults.model.primary`)،
لذا يجب أيضًا مصادقة ذلك المزوّد إذا فعّلت الملخصات.

## روابط الخدمات

- [دليل OpenAI Text-to-Speech](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [مصادقة ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات إخراج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## هل هو مفعّل افتراضيًا؟

لا. Auto‑TTS يكون **معطّلًا** افتراضيًا. فعّله في التهيئة باستخدام
`messages.tts.auto` أو محليًا باستخدام `/tts on`.

عندما لا يكون `messages.tts.provider` مضبوطًا، يختار OpenClaw أول
مزوّد كلام مهيأ بحسب ترتيب الاختيار التلقائي في السجل.

## التهيئة

توجد تهيئة TTS تحت `messages.tts` في `openclaw.json`.
المخطط الكامل موجود في [تهيئة Gateway](/ar/gateway/configuration).

### تهيئة دنيا (تمكين + مزوّد)

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

### OpenAI أساسي مع ElevenLabs كـ fallback

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

### Google Gemini أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

يستخدم Google Gemini TTS مسار مفتاح Gemini API. ويكون مفتاح API من Google Cloud Console
المقيّد على Gemini API صالحًا هنا، وهو النمط نفسه من المفاتيح المستخدم
من قبل مزوّد توليد الصور Google المضمّن. ويكون ترتيب التحليل:
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

يستخدم xAI TTS مسار `XAI_API_KEY` نفسه الذي يستخدمه مزوّد نماذج Grok المضمّن.
وترتيب التحليل هو `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
الأصوات الحية الحالية هي `ara` و`eve` و`leo` و`rex` و`sal` و`una`; و`eve` هو
الافتراضي. ويقبل `language` وسم BCP-47 أو `auto`.

### تعطيل كلام Microsoft

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

- `auto`: وضع Auto‑TTS ‏(`off` أو `always` أو `inbound` أو `tagged`).
  - يرسل `inbound` الصوت فقط بعد رسالة صوتية واردة.
  - يرسل `tagged` الصوت فقط عندما يتضمن الرد توجيهات `[[tts:key=value]]` أو كتلة `[[tts:text]]...[[/tts:text]]`.
- `enabled`: مفتاح تبديل قديم (يقوم doctor بترحيله إلى `auto`).
- `mode`: ‏`"final"` ‏(الافتراضي) أو `"all"` ‏(يتضمن ردود الأدوات/الكتل).
- `provider`: معرّف مزوّد الكلام مثل `"elevenlabs"` أو `"google"` أو `"microsoft"` أو `"minimax"` أو `"openai"` ‏(ويكون fallback تلقائيًا).
- إذا كان `provider` **غير مضبوط**، يستخدم OpenClaw أول مزوّد كلام مهيأ بحسب ترتيب الاختيار التلقائي في السجل.
- ما يزال `provider: "edge"` القديم يعمل ويُطبّع إلى `microsoft`.
- `summaryModel`: نموذج اقتصادي اختياري للتلخيص التلقائي؛ والافتراضي هو `agents.defaults.model.primary`.
  - يقبل `provider/model` أو اسمًا مستعارًا لنموذج مهيأ.
- `modelOverrides`: يسمح للنموذج بإصدار توجيهات TTS ‏(مفعّل افتراضيًا).
  - تكون قيمة `allowProvider` الافتراضية `false` ‏(تبديل المزوّد opt-in).
- `providers.<id>`: إعدادات يملكها المزوّد ومفهرسة بمعرّف مزوّد الكلام.
- تُرحَّل كتل المزوّد المباشرة القديمة (`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`) تلقائيًا إلى `messages.tts.providers.<id>` عند التحميل.
- `maxTextLength`: حد صارم لإدخال TTS ‏(محارف). يفشل `/tts audio` إذا تم تجاوزه.
- `timeoutMs`: مهلة الطلب (مللي ثانية).
- `prefsPath`: تجاوز لمسار JSON المحلي الخاص بالتفضيلات (المزوّد/الحد/الملخص).
- تعود قيم `apiKey` إلى متغيرات البيئة كـ fallback ‏(`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: تجاوز لعنوان ElevenLabs API الأساسي.
- `providers.openai.baseUrl`: تجاوز لنقطة نهاية OpenAI TTS.
  - ترتيب التحليل: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - تُعامل القيم غير الافتراضية على أنها نقاط نهاية TTS متوافقة مع OpenAI، ولذلك تُقبل أسماء النماذج والأصوات المخصصة.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: ‏`0..1`
  - `useSpeakerBoost`: ‏`true|false`
  - `speed`: ‏`0.5..2.0` ‏(1.0 = عادي)
- `providers.elevenlabs.applyTextNormalization`: ‏`auto|on|off`
- `providers.elevenlabs.languageCode`: رمز ISO 639-1 من حرفين (مثل `en`, `de`)
- `providers.elevenlabs.seed`: عدد صحيح `0..4294967295` ‏(حتمية best-effort)
- `providers.minimax.baseUrl`: تجاوز لعنوان MiniMax API الأساسي (الافتراضي `https://api.minimax.io`, ومتغير البيئة: `MINIMAX_API_HOST`).
- `providers.minimax.model`: نموذج TTS ‏(الافتراضي `speech-2.8-hd`, ومتغير البيئة: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: معرّف الصوت ‏(الافتراضي `English_expressive_narrator`, ومتغير البيئة: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: سرعة التشغيل `0.5..2.0` ‏(الافتراضي 1.0).
- `providers.minimax.vol`: مستوى الصوت `(0, 10]` ‏(الافتراضي 1.0؛ ويجب أن يكون أكبر من 0).
- `providers.minimax.pitch`: إزاحة الدرجة `-12..12` ‏(الافتراضي 0).
- `providers.google.model`: نموذج Gemini TTS ‏(الافتراضي `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: اسم صوت Gemini المضمّن مسبقًا ‏(الافتراضي `Kore`; كما تُقبل `voice` أيضًا).
- `providers.google.baseUrl`: تجاوز لعنوان Gemini API الأساسي. ولا يُقبل إلا `https://generativelanguage.googleapis.com`.
  - إذا حُذفت `messages.tts.providers.google.apiKey`، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل fallback البيئي.
- `providers.xai.apiKey`: مفتاح xAI TTS API ‏(متغير البيئة: `XAI_API_KEY`).
- `providers.xai.baseUrl`: تجاوز لعنوان xAI TTS الأساسي (الافتراضي `https://api.x.ai/v1`, ومتغير البيئة: `XAI_BASE_URL`).
- `providers.xai.voiceId`: معرّف صوت xAI ‏(الافتراضي `eve`; الأصوات الحية الحالية: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: رمز لغة BCP-47 أو `auto` ‏(الافتراضي `en`).
- `providers.xai.responseFormat`: ‏`mp3`, `wav`, `pcm`, `mulaw`, أو `alaw` ‏(الافتراضي `mp3`).
- `providers.xai.speed`: تجاوز سرعة أصلي خاص بالمزوّد.
- `providers.microsoft.enabled`: السماح باستخدام كلام Microsoft ‏(الافتراضي `true`; ومن دون مفتاح API).
- `providers.microsoft.voice`: اسم الصوت العصبي من Microsoft ‏(مثل `en-US-MichelleNeural`).
- `providers.microsoft.lang`: رمز اللغة ‏(مثل `en-US`).
- `providers.microsoft.outputFormat`: تنسيق إخراج Microsoft ‏(مثل `audio-24khz-48kbitrate-mono-mp3`).
  - راجع تنسيقات إخراج Microsoft Speech لمعرفة القيم الصالحة؛ ليست كل التنسيقات مدعومة من النقل المضمّن المعتمد على Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: سلاسل نسب مئوية (مثل `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: كتابة ترجمات JSON إلى جانب ملف الصوت.
- `providers.microsoft.proxy`: عنوان proxy URL لطلبات كلام Microsoft.
- `providers.microsoft.timeoutMs`: تجاوز مهلة الطلب (مللي ثانية).
- `edge.*`: اسم مستعار قديم لإعدادات Microsoft نفسها.

## تجاوزات يقودها النموذج (مفعّلة افتراضيًا)

افتراضيًا، **يمكن** للنموذج إصدار توجيهات TTS لرد واحد.
وعندما تكون `messages.tts.auto` هي `tagged`، تكون هذه التوجيهات مطلوبة لتشغيل الصوت.

عند التفعيل، يمكن للنموذج إصدار توجيهات `[[tts:...]]` لتجاوز الصوت
لرد واحد، بالإضافة إلى كتلة اختيارية `[[tts:text]]...[[/tts:text]]`
لتقديم وسوم تعبيرية (ضحك، وإشارات غناء، وما إلى ذلك) ينبغي أن تظهر
في الصوت فقط.

يتم تجاهل توجيهات `provider=...` ما لم يكن `modelOverrides.allowProvider: true`.

مثال على حمولة الرد:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

مفاتيح التوجيه المتاحة (عند التفعيل):

- `provider` ‏(معرّف مزوّد الكلام المسجل، مثل `openai` أو `elevenlabs` أو `google` أو `minimax` أو `microsoft`; ويتطلب `allowProvider: true`)
- `voice` ‏(صوت OpenAI)، أو `voiceName` / `voice_name` / `google_voice` ‏(صوت Google)، أو `voiceId` ‏(ElevenLabs / MiniMax / xAI)
- `model` ‏(نموذج OpenAI TTS، أو معرّف نموذج ElevenLabs، أو نموذج MiniMax) أو `google_model` ‏(نموذج Google TTS)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` ‏(مستوى صوت MiniMax، ‏0-10)
- `pitch` ‏(درجة MiniMax، من -12 إلى 12)
- `applyTextNormalization` ‏(`auto|on|off`)
- `languageCode` ‏(ISO 639-1)
- `seed`

عطّل كل تجاوزات النموذج:

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

قائمة سماح اختيارية (تفعيل تبديل المزوّد مع إبقاء المقابض الأخرى قابلة للتهيئة):

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

تكتب أوامر الشرطة المائلة تجاوزات محلية إلى `prefsPath` ‏(الافتراضي:
`~/.openclaw/settings/tts.json`، ويمكن تجاوزه عبر `OPENCLAW_TTS_PREFS` أو
`messages.tts.prefsPath`).

الحقول المخزنة:

- `enabled`
- `provider`
- `maxLength` ‏(عتبة التلخيص؛ الافتراضي 1500 محرف)
- `summarize` ‏(الافتراضي `true`)

تتجاوز هذه الحقول `messages.tts.*` لذلك المضيف.

## تنسيقات الإخراج (ثابتة)

- **Feishu / Matrix / Telegram / WhatsApp**: رسالة صوتية Opus ‏(`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - تُعد 48kHz / 64kbps توازنًا جيدًا لرسائل الصوت.
- **القنوات الأخرى**: MP3 ‏(`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - تمثل 44.1kHz / 128kbps التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: MP3 ‏(نموذج `speech-2.8-hd`، ومعدل عينة 32kHz). ولا يُدعم تنسيق الملاحظات الصوتية أصليًا؛ استخدم OpenAI أو ElevenLabs إذا كنت تحتاج إلى رسائل صوتية Opus مضمونة.
- **Google Gemini**: يعيد Gemini API TTS صوت PCM خامًا عند 24kHz. ويغلّفه OpenClaw كـ WAV لمرفقات الصوت ويعيد PCM مباشرةً لـ Talk/الهاتف. ولا يدعم هذا المسار تنسيق الملاحظات الصوتية Opus الأصلي.
- **xAI**: ‏MP3 افتراضيًا؛ ويمكن أن تكون `responseFormat` هي `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. ويستخدم OpenClaw نقطة نهاية REST الدفعية الخاصة بـ xAI TTS ويعيد مرفقًا صوتيًا كاملًا؛ ولا يُستخدم WebSocket الخاص بالبث TTS في xAI في مسار هذا المزوّد. ولا يدعم هذا المسار تنسيق الملاحظات الصوتية Opus الأصلي.
- **Microsoft**: يستخدم `microsoft.outputFormat` ‏(الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل النقل المضمّن `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الإخراج تنسيقات إخراج Microsoft Speech ‏(بما في ذلك Ogg/WebM Opus).
  - يقبل Telegram `sendVoice` تنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق الإخراج Microsoft المهيأ، يعيد OpenClaw المحاولة باستخدام MP3.

تكون تنسيقات إخراج OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك Auto-TTS

عند التفعيل، يقوم OpenClaw بما يلي:

- يتخطى TTS إذا كان الرد يحتوي بالفعل على وسائط أو توجيه `MEDIA:`.
- يتخطى الردود القصيرة جدًا (أقل من 10 محارف).
- يلخّص الردود الطويلة عند التفعيل باستخدام `agents.defaults.model.primary` ‏(أو `summaryModel`).
- يرفق الصوت المُنشأ بالرد.

إذا تجاوز الرد `maxLength` وكان التلخيص معطّلًا (أو لم يوجد مفتاح API لـ
نموذج التلخيص)، فيُتخطى الصوت
ويُرسل الرد النصي العادي.

## مخطط التدفق

```
الرد -> هل TTS مفعّل؟
  لا  -> إرسال النص
  نعم -> هل يحتوي على وسائط / MEDIA: / قصير؟
          نعم -> إرسال النص
          لا  -> هل الطول > الحد؟
                   لا  -> TTS -> إرفاق الصوت
                   نعم -> هل التلخيص مفعّل؟
                            لا  -> إرسال النص
                            نعم -> تلخيص (summaryModel أو agents.defaults.model.primary)
                                      -> TTS -> إرفاق الصوت
```

## استخدام أوامر الشرطة المائلة

يوجد أمر واحد فقط: `/tts`.
راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) لمعرفة تفاصيل التمكين.

ملاحظة Discord: ‏`/tts` هو أمر مدمج في Discord، لذلك يسجّل OpenClaw
الأمر `/voice` كأمر أصلي هناك. وما يزال النص `/tts ...` يعمل.

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

- تتطلب الأوامر مرسلًا مصرّحًا له (وما تزال قواعد allowlist/المالك تنطبق).
- يجب تفعيل `commands.text` أو تسجيل الأوامر الأصلية.
- تقبل التهيئة `messages.tts.auto` القيم `off|always|inbound|tagged`.
- تكتب `/tts on` تفضيل TTS المحلي إلى `always`; وتكتب `/tts off` إلى `off`.
- استخدم التهيئة عندما تريد الإعدادات الافتراضية `inbound` أو `tagged`.
- تُخزَّن `limit` و`summary` في التفضيلات المحلية، وليس في التهيئة الرئيسية.
- يُنشئ `/tts audio` ردًا صوتيًا لمرة واحدة (ولا يبدّل TTS إلى وضع التشغيل).
- يتضمن `/tts status` رؤية fallback لآخر محاولة:
  - fallback ناجح: `Fallback: <primary> -> <used>` بالإضافة إلى `Attempts: ...`
  - فشل: `Error: ...` بالإضافة إلى `Attempts: ...`
  - تشخيصات مفصلة: `Attempt details: provider:outcome(reasonCode) latency`
- تتضمن الآن إخفاقات OpenAI وElevenLabs API تفاصيل خطأ المزوّد المحللة ومعرّف الطلب (عند إرجاعه من المزوّد)، ويظهر ذلك في أخطاء/سجلات TTS.

## أداة الوكيل

تحوّل أداة `tts` النص إلى كلام وتعيد مرفقًا صوتيًا من أجل
تسليم الرد. وعندما تكون القناة هي Feishu أو Matrix أو Telegram أو WhatsApp،
يُسلَّم الصوت كرسالة صوتية بدلًا من مرفق ملف.
وهي تقبل حقلي `channel` و`timeoutMs` الاختياريين؛ ويكون `timeoutMs`
مهلة طلب لكل استدعاء إلى المزوّد بالمللي ثانية.

## Gateway RPC

طرائق Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## ذو صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
