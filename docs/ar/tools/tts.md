---
read_when:
    - تمكين تحويل النص إلى كلام للردود
    - تهيئة موفّري TTS أو الحدود
    - استخدام أوامر /tts
summary: تحويل النص إلى كلام (TTS) للردود الصادرة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-04-25T18:23:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c56c42f201139a7277153a6a1409ef9a288264e0702d2940b74b08ece385718
    source_path: tools/tts.md
    workflow: 15
---

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت باستخدام ElevenLabs أو Google Gemini أو Gradium أو Local CLI أو Microsoft أو MiniMax أو OpenAI أو Vydra أو xAI أو Xiaomi MiMo.
ويعمل ذلك في أي مكان يستطيع فيه OpenClaw إرسال صوت.

## الخدمات المدعومة

- **ElevenLabs** ‏(موفّر أساسي أو احتياطي)
- **Google Gemini** ‏(موفّر أساسي أو احتياطي؛ يستخدم Gemini API TTS)
- **Gradium** ‏(موفّر أساسي أو احتياطي؛ يدعم مخرجات المذكرات الصوتية والاتصالات الهاتفية)
- **Local CLI** ‏(موفّر أساسي أو احتياطي؛ يشغّل أمر TTS محليًا وفق التهيئة)
- **Microsoft** ‏(موفّر أساسي أو احتياطي؛ يستخدم التنفيذ المجمّع الحالي `node-edge-tts`)
- **MiniMax** ‏(موفّر أساسي أو احتياطي؛ يستخدم API ‏T2A v2)
- **OpenAI** ‏(موفّر أساسي أو احتياطي؛ ويُستخدم أيضًا للملخصات)
- **Vydra** ‏(موفّر أساسي أو احتياطي؛ موفّر مشترك للصور والفيديو والكلام)
- **xAI** ‏(موفّر أساسي أو احتياطي؛ يستخدم xAI TTS API)
- **Xiaomi MiMo** ‏(موفّر أساسي أو احتياطي؛ يستخدم MiMo TTS عبر Xiaomi chat completions)

### ملاحظات حول كلام Microsoft

يستخدم موفّر كلام Microsoft المجمّع حاليًا خدمة TTS العصبية عبر الإنترنت الخاصة بـ Microsoft Edge
من خلال مكتبة `node-edge-tts`. وهي خدمة مستضافة (وليست
محلية)، وتستخدم نقاط نهاية Microsoft، ولا تتطلب مفتاح API.
تكشف `node-edge-tts` خيارات لتهيئة الكلام وتنسيقات الإخراج، لكن
ليست كل الخيارات مدعومة من الخدمة. وما تزال التهيئة القديمة ومدخلات التوجيه
التي تستخدم `edge` تعمل ويجري تطبيعها إلى `microsoft`.

ولأن هذا المسار خدمة ويب عامة من دون SLA أو حصة منشورة،
فتعامل معه على أنه أفضل جهد. وإذا كنت تحتاج إلى حدود ودعم مضمونين، فاستخدم OpenAI
أو ElevenLabs.

## المفاتيح الاختيارية

إذا كنت تريد OpenAI أو ElevenLabs أو Google Gemini أو Gradium أو MiniMax أو Vydra أو xAI أو Xiaomi MiMo:

- `ELEVENLABS_API_KEY` ‏(أو `XI_API_KEY`)
- `GEMINI_API_KEY` ‏(أو `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`؛ كما يقبل MiniMax TTS أيضًا مصادقة Token Plan عبر
  `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_CODE_PLAN_KEY` أو
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

لا يتطلب Local CLI وكلام Microsoft **مفتاح API**.

إذا جرى ضبط عدة موفّرين، فسيُستخدم الموفّر المحدد أولًا ويكون الآخرون خيارات احتياطية.
يستخدم الملخص التلقائي `summaryModel` المضبوط (أو `agents.defaults.model.primary`)،
لذلك يجب أيضًا مصادقة ذلك الموفّر إذا فعّلت الملخصات.

## روابط الخدمة

- [دليل OpenAI لتحويل النص إلى كلام](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام في ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [المصادقة في ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ar/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [تركيب الكلام في Xiaomi MiMo](/ar/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات إخراج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تحويل النص إلى كلام في xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## هل هو مفعّل افتراضيًا؟

لا. يكون Auto‑TTS **معطّلًا** افتراضيًا. فعّله في التهيئة باستخدام
`messages.tts.auto` أو محليًا باستخدام `/tts on`.

عندما لا يكون `messages.tts.provider` معيّنًا، يختار OpenClaw أول
موفّر كلام مضبوط وفق ترتيب الاختيار التلقائي في السجل.

## التهيئة

توجد تهيئة TTS تحت `messages.tts` في `openclaw.json`.
ويظهر المخطط الكامل في [تهيئة Gateway](/ar/gateway/configuration).

### الحد الأدنى من التهيئة (تمكين + موفّر)

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

### OpenAI كموفّر أساسي مع ElevenLabs كاحتياطي

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

### Microsoft كموفّر أساسي (من دون مفتاح API)

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

### MiniMax كموفّر أساسي

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

يكون حل مصادقة MiniMax TTS عبر `messages.tts.providers.minimax.apiKey`، ثم
ملفات تعريف OAuth/token المخزنة لـ `minimax-portal`، ثم مفاتيح بيئة Token Plan
(`MINIMAX_OAUTH_TOKEN` و`MINIMAX_CODE_PLAN_KEY` و
`MINIMAX_CODING_API_KEY`)، ثم `MINIMAX_API_KEY`. وعندما لا يتم تعيين
`baseUrl` صريح لـ TTS، يستطيع OpenClaw إعادة استخدام مضيف OAuth
المضبوط لـ `minimax-portal` من أجل كلام Token Plan.

### Google Gemini كموفّر أساسي

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
المقيَّد بـ Gemini API صالحًا هنا، وهو النمط نفسه من المفاتيح المستخدم
من قبل موفّر توليد الصور المجمّع الخاص بـ Google. وترتيب الحل هو
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`.

### xAI كموفّر أساسي

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

يستخدم xAI TTS مسار `XAI_API_KEY` نفسه الذي يستخدمه موفّر نماذج Grok المجمّع.
وترتيب الحل هو `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`.
الأصوات الحية الحالية هي `ara` و`eve` و`leo` و`rex` و`sal` و`una`؛ ويكون `eve`
هو الافتراضي. ويقبل `language` وسم BCP-47 أو القيمة `auto`.

### Xiaomi MiMo كموفّر أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

يستخدم Xiaomi MiMo TTS مسار `XIAOMI_API_KEY` نفسه الذي يستخدمه موفّر نماذج Xiaomi
المجمّع. ومعرّف موفّر الكلام هو `xiaomi`؛ ويُقبل `mimo` كاسم بديل.
ويُرسَل النص الهدف كرسالة assistant، بما يتوافق مع عقد TTS الخاص بـ Xiaomi.
ويُرسَل `style` الاختياري كتعليمة مستخدم ولا يُنطق.

### OpenRouter كموفّر أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

يستخدم OpenRouter TTS مسار `OPENROUTER_API_KEY` نفسه الذي يستخدمه
موفّر نماذج OpenRouter المجمّع. وترتيب الحل هو
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`.

### Local CLI كموفّر أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```

يشغّل Local CLI TTS الأمر المضبوط على مضيف Gateway. وتُوسَّع العناصر النائبة
`{{Text}}` و`{{OutputPath}}` و`{{OutputDir}}` و`{{OutputBase}}`
داخل `args`؛ وإذا لم توجد العنصر النائب `{{Text}}`، يكتب OpenClaw
النص المنطوق إلى stdin. ويقبل `outputFormat` القيم `mp3` أو `opus` أو `wav`.
وتُحوَّل أهداف المذكرات الصوتية إلى Ogg/Opus، كما
يُحوَّل الإخراج الهاتفي إلى PCM أحادي خام بتردد 16 kHz باستخدام `ffmpeg`. وما يزال الاسم البديل القديم للموفّر
`cli` يعمل، لكن يجب أن تستخدم التهيئة الجديدة `tts-local-cli`.

### Gradium كموفّر أساسي

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

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

### حدود مخصصة + مسار prefs

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

### تعطيل الملخص التلقائي للردود الطويلة

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
  - لا يرسل `inbound` الصوت إلا بعد رسالة صوتية واردة.
  - لا يرسل `tagged` الصوت إلا عندما يتضمن الرد توجيهات `[[tts:key=value]]` أو كتلة `[[tts:text]]...[[/tts:text]]`.
- `enabled`: مفتاح تبديل قديم (يحوّل `doctor` هذا إلى `auto`).
- `mode`: ‏`"final"` ‏(الافتراضي) أو `"all"` ‏(يشمل ردود الأدوات/الحظر).
- `provider`: معرّف موفّر الكلام مثل `"elevenlabs"` أو `"google"` أو `"gradium"` أو `"microsoft"` أو `"minimax"` أو `"openai"` أو `"vydra"` أو `"xai"` أو `"xiaomi"` ‏(ويكون الرجوع الاحتياطي تلقائيًا).
- إذا كان `provider` **غير معيّن**، يستخدم OpenClaw أول موفّر كلام مضبوط وفق ترتيب الاختيار التلقائي في السجل.
- تُصلَح التهيئة القديمة `provider: "edge"` بواسطة `openclaw doctor --fix` ويُعاد
  كتابتها إلى `provider: "microsoft"`.
- `summaryModel`: نموذج اقتصادي اختياري للملخص التلقائي؛ والافتراضي هو `agents.defaults.model.primary`.
  - يقبل `provider/model` أو اسمًا بديلًا مضبوطًا للنموذج.
- `modelOverrides`: يسمح للنموذج بإصدار توجيهات TTS ‏(مفعّل افتراضيًا).
  - تكون القيمة الافتراضية لـ `allowProvider` هي `false` ‏(وتبديل الموفّر اختياري).
- `providers.<id>`: إعدادات يملكها الموفّر ومفهرسة بحسب معرّف موفّر الكلام.
- تُصلَح كتل الموفّر المباشرة القديمة (`messages.tts.openai` و`messages.tts.elevenlabs` و`messages.tts.microsoft` و`messages.tts.edge`) بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم التهيئة الملتزم بها `messages.tts.providers.<id>`.
- يُصلَح أيضًا `messages.tts.providers.edge` القديم بواسطة `openclaw doctor --fix`؛ ويجب أن تستخدم التهيئة الملتزم بها `messages.tts.providers.microsoft`.
- `maxTextLength`: حد صارم لإدخال TTS ‏(عدد الأحرف). يفشل `/tts audio` إذا جرى تجاوزه.
- `timeoutMs`: مهلة الطلب ‏(بالمللي ثانية).
- `prefsPath`: تجاوز لمسار JSON الخاص بالتفضيلات المحلية (الموفّر/الحد/الملخص).
- تعود قيم `apiKey` إلى متغيرات البيئة (`ELEVENLABS_API_KEY`/`XI_API_KEY` و`GEMINI_API_KEY`/`GOOGLE_API_KEY` و`GRADIUM_API_KEY` و`MINIMAX_API_KEY` و`OPENAI_API_KEY` و`VYDRA_API_KEY` و`XAI_API_KEY` و`XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: تجاوز عنوان URL الأساسي لـ ElevenLabs API.
- `providers.openai.baseUrl`: تجاوز نقطة نهاية OpenAI TTS.
  - ترتيب الحل: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - تُعامَل القيم غير الافتراضية على أنها نقاط نهاية TTS متوافقة مع OpenAI، لذا تُقبل أسماء النماذج والأصوات المخصصة.
- `providers.elevenlabs.voiceSettings`:
  - `stability` و`similarityBoost` و`style`: ‏`0..1`
  - `useSpeakerBoost`: ‏`true|false`
  - `speed`: ‏`0.5..2.0` ‏(`1.0` = عادي)
- `providers.elevenlabs.applyTextNormalization`: ‏`auto|on|off`
- `providers.elevenlabs.languageCode`: ‏ISO 639-1 من حرفين (مثل `en` أو `de`)
- `providers.elevenlabs.seed`: عدد صحيح `0..4294967295` ‏(حتمية بأفضل جهد)
- `providers.minimax.baseUrl`: تجاوز عنوان URL الأساسي لـ MiniMax API ‏(الافتراضي `https://api.minimax.io`، ومتغير البيئة: `MINIMAX_API_HOST`).
- `providers.minimax.model`: نموذج TTS ‏(الافتراضي `speech-2.8-hd`، ومتغير البيئة: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: معرّف الصوت ‏(الافتراضي `English_expressive_narrator`، ومتغير البيئة: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: سرعة التشغيل `0.5..2.0` ‏(الافتراضي 1.0).
- `providers.minimax.vol`: مستوى الصوت `(0, 10]` ‏(الافتراضي 1.0؛ ويجب أن يكون أكبر من 0).
- `providers.minimax.pitch`: إزاحة طبقة صوتية بعدد صحيح `-12..12` ‏(الافتراضي 0). وتُقتطع القيم الكسرية قبل استدعاء MiniMax T2A لأن API ترفض قيم الطبقة غير الصحيحة.
- `providers.tts-local-cli.command`: الملف التنفيذي المحلي أو سلسلة الأمر الخاصة بـ CLI TTS.
- `providers.tts-local-cli.args`: وسائط الأمر؛ وتدعم العناصر النائبة `{{Text}}` و`{{OutputPath}}` و`{{OutputDir}}` و`{{OutputBase}}`.
- `providers.tts-local-cli.outputFormat`: تنسيق الإخراج المتوقع من CLI ‏(`mp3` أو `opus` أو `wav`؛ والافتراضي `mp3` لمرفقات الصوت).
- `providers.tts-local-cli.timeoutMs`: مهلة الأمر بالمللي ثانية ‏(الافتراضي `120000`).
- `providers.tts-local-cli.cwd`: دليل العمل الاختياري للأمر.
- `providers.tts-local-cli.env`: تجاوزات اختيارية لمتغيرات البيئة كسلاسل نصية للأمر.
- `providers.google.model`: نموذج Gemini TTS ‏(الافتراضي `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: اسم الصوت المدمج مسبقًا في Gemini ‏(الافتراضي `Kore`؛ كما يُقبل `voice` أيضًا).
- `providers.google.audioProfile`: مطالبة بنمط لغة طبيعية تُسبق بها النصوص المنطوقة.
- `providers.google.speakerName`: تسمية متحدث اختيارية تُسبق بها النصوص المنطوقة عندما تستخدم مطالبة TTS لديك متحدثًا مسمّى.
- `providers.google.baseUrl`: تجاوز عنوان URL الأساسي لـ Gemini API. ولا يُقبل إلا `https://generativelanguage.googleapis.com`.
  - إذا تم حذف `messages.tts.providers.google.apiKey`، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل الرجوع إلى متغيرات البيئة.
- `providers.gradium.baseUrl`: تجاوز عنوان URL الأساسي لـ Gradium API ‏(الافتراضي `https://api.gradium.ai`).
- `providers.gradium.voiceId`: معرّف صوت Gradium ‏(الافتراضي Emma، ‏`YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: مفتاح xAI TTS API ‏(متغير البيئة: `XAI_API_KEY`).
- `providers.xai.baseUrl`: تجاوز عنوان URL الأساسي لـ xAI TTS ‏(الافتراضي `https://api.x.ai/v1`، ومتغير البيئة: `XAI_BASE_URL`).
- `providers.xai.voiceId`: معرّف صوت xAI ‏(الافتراضي `eve`؛ والأصوات الحية الحالية: `ara` و`eve` و`leo` و`rex` و`sal` و`una`).
- `providers.xai.language`: رمز لغة BCP-47 أو `auto` ‏(الافتراضي `en`).
- `providers.xai.responseFormat`: ‏`mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw` ‏(الافتراضي `mp3`).
- `providers.xai.speed`: تجاوز سرعة أصلي للموفّر.
- `providers.xiaomi.apiKey`: مفتاح Xiaomi MiMo API ‏(متغير البيئة: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: تجاوز عنوان URL الأساسي لـ Xiaomi MiMo API ‏(الافتراضي `https://api.xiaomimimo.com/v1`، ومتغير البيئة: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: نموذج TTS ‏(الافتراضي `mimo-v2.5-tts`، ومتغير البيئة: `XIAOMI_TTS_MODEL`؛ كما أن `mimo-v2-tts` مدعوم أيضًا).
- `providers.xiaomi.voice`: معرّف صوت MiMo ‏(الافتراضي `mimo_default`، ومتغير البيئة: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: ‏`mp3` أو `wav` ‏(الافتراضي `mp3`، ومتغير البيئة: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: تعليمة نمط لغة طبيعية اختيارية تُرسل كرسالة مستخدم؛ ولا تُنطق.
- `providers.openrouter.apiKey`: مفتاح OpenRouter API ‏(متغير البيئة: `OPENROUTER_API_KEY`؛ ويمكنه إعادة استخدام `models.providers.openrouter.apiKey`).
- `providers.openrouter.baseUrl`: تجاوز عنوان URL الأساسي لـ OpenRouter TTS ‏(الافتراضي `https://openrouter.ai/api/v1`؛ ويُطبَّع `https://openrouter.ai/v1` القديم).
- `providers.openrouter.model`: معرّف نموذج OpenRouter TTS ‏(الافتراضي `hexgrad/kokoro-82m`؛ كما يُقبل `modelId` أيضًا).
- `providers.openrouter.voice`: معرّف صوت خاص بالموفّر ‏(الافتراضي `af_alloy`؛ كما يُقبل `voiceId` أيضًا).
- `providers.openrouter.responseFormat`: ‏`mp3` أو `pcm` ‏(الافتراضي `mp3`).
- `providers.openrouter.speed`: تجاوز سرعة أصلي للموفّر.
- `providers.microsoft.enabled`: السماح باستخدام كلام Microsoft ‏(الافتراضي `true`؛ ولا يتطلب مفتاح API).
- `providers.microsoft.voice`: اسم الصوت العصبي في Microsoft ‏(مثل `en-US-MichelleNeural`).
- `providers.microsoft.lang`: رمز اللغة ‏(مثل `en-US`).
- `providers.microsoft.outputFormat`: تنسيق إخراج Microsoft ‏(مثل `audio-24khz-48kbitrate-mono-mp3`).
  - راجع تنسيقات إخراج Microsoft Speech للحصول على القيم الصالحة؛ فليست كل التنسيقات مدعومة من النقل المجمّع المعتمد على Edge.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: سلاسل نسب مئوية ‏(مثل `+10%` أو `-5%`).
- `providers.microsoft.saveSubtitles`: يكتب ترجمات JSON بجانب ملف الصوت.
- `providers.microsoft.proxy`: عنوان URL للوكيل لطلبات Microsoft speech.
- `providers.microsoft.timeoutMs`: تجاوز مهلة الطلب ‏(بالمللي ثانية).
- `edge.*`: اسم بديل قديم لإعدادات Microsoft نفسها. شغّل
  `openclaw doctor --fix` لإعادة كتابة التهيئة المحفوظة إلى `providers.microsoft`.

## تجاوزات يقودها النموذج (مفعّلة افتراضيًا)

افتراضيًا، **يمكن** للنموذج إصدار توجيهات TTS لرد واحد.
وعندما يكون `messages.tts.auto` هو `tagged`، تصبح هذه التوجيهات مطلوبة لتشغيل الصوت.

عند التفعيل، يمكن للنموذج إصدار توجيهات `[[tts:...]]` لتجاوز الصوت
لرد واحد، بالإضافة إلى كتلة اختيارية `[[tts:text]]...[[/tts:text]]`
لتقديم وسوم تعبيرية (ضحك، وإشارات غناء، وما إلى ذلك) يجب أن تظهر في
الصوت فقط.

تُتجاهل توجيهات `provider=...` ما لم تكن `modelOverrides.allowProvider: true`.

مثال على حمولة الرد:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

مفاتيح التوجيه المتاحة (عند التفعيل):

- `provider` ‏(معرّف موفّر كلام مسجل، مثل `openai` أو `elevenlabs` أو `google` أو `gradium` أو `minimax` أو `microsoft` أو `vydra` أو `xai` أو `xiaomi`؛ ويتطلب `allowProvider: true`)
- `voice` ‏(صوت OpenAI أو Gradium أو Xiaomi)، أو `voiceName` / `voice_name` / `google_voice` ‏(صوت Google)، أو `voiceId` ‏(ElevenLabs / Gradium / MiniMax / xAI)
- `model` ‏(نموذج OpenAI TTS، أو معرّف نموذج ElevenLabs، أو نموذج MiniMax، أو نموذج Xiaomi MiMo TTS) أو `google_model` ‏(نموذج Google TTS)
- `stability` و`similarityBoost` و`style` و`speed` و`useSpeakerBoost`
- `vol` / `volume` ‏(مستوى صوت MiniMax، ‏0-10)
- `pitch` ‏(طبقة صوت MiniMax الصحيحة، ‏-12 إلى 12؛ وتُقتطع القيم الكسرية قبل طلب MiniMax)
- `applyTextNormalization` ‏(`auto|on|off`)
- `languageCode` ‏(ISO 639-1)
- `seed`

عطّل جميع تجاوزات النموذج:

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

قائمة سماح اختيارية (تمكين تبديل الموفّر مع إبقاء المقابض الأخرى قابلة للتهيئة):

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

## التفضيلات لكل مستخدم

تكتب أوامر الشرطة المائلة تجاوزات محلية إلى `prefsPath` ‏(الافتراضي:
`~/.openclaw/settings/tts.json`، ويمكن تجاوزه باستخدام `OPENCLAW_TTS_PREFS` أو
`messages.tts.prefsPath`).

الحقول المخزنة:

- `enabled`
- `provider`
- `maxLength` ‏(حد الملخص؛ الافتراضي 1500 حرف)
- `summarize` ‏(الافتراضي `true`)

وتتجاوز هذه القيم `messages.tts.*` لهذا المضيف.

## تنسيقات الإخراج (ثابتة)

- **Feishu / Matrix / Telegram / WhatsApp**: تفضّل الردود على شكل مذكرات صوتية تنسيق Opus ‏(`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - يُعد 48kHz / 64kbps توازنًا جيدًا للرسائل الصوتية.
- **Feishu**: عندما يُنتَج رد مذكرة صوتية بتنسيق MP3/WAV/M4A أو بتنسيق آخر
  يُرجَّح أن يكون ملفًا صوتيًا، يقوم Plugin الخاص بـ Feishu بتحويله إلى 48kHz Ogg/Opus باستخدام
  `ffmpeg` قبل إرسال فقاعة `audio` الأصلية. وإذا فشل التحويل، يتلقى Feishu
  الملف الأصلي كمرفق.
- **القنوات الأخرى**: ‏MP3 ‏(`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - يُعد 44.1kHz / 128kbps التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: ‏MP3 ‏(نموذج `speech-2.8-hd`، بمعدل عينات 32kHz) لمرفقات الصوت العادية. وبالنسبة إلى أهداف المذكرات الصوتية مثل Feishu وTelegram، يحوّل OpenClaw ملف MP3 الصادر من MiniMax إلى 48kHz Opus باستخدام `ffmpeg` قبل التسليم.
- **Xiaomi MiMo**: ‏MP3 افتراضيًا، أو WAV عند ضبطه. وبالنسبة إلى أهداف المذكرات الصوتية مثل Feishu وTelegram، يحوّل OpenClaw خرج Xiaomi إلى 48kHz Opus باستخدام `ffmpeg` قبل التسليم.
- **Local CLI**: يستخدم `outputFormat` المضبوط. وتُحوَّل أهداف المذكرات الصوتية
  إلى Ogg/Opus، كما يُحوَّل الإخراج الهاتفي إلى PCM أحادي خام بتردد 16 kHz
  باستخدام `ffmpeg`.
- **Google Gemini**: يعيد Gemini API TTS ‏PCM خامًا بتردد 24kHz. ويغلفه OpenClaw بصيغة WAV لمرفقات الصوت ويعيد PCM مباشرةً للاتصالات/الهاتف. ولا يدعم هذا المسار تنسيق المذكرات الصوتية الأصلي Opus.
- **Gradium**: ‏WAV لمرفقات الصوت، وOpus لأهداف المذكرات الصوتية، و`ulaw_8000` عند 8 kHz للاتصالات الهاتفية.
- **xAI**: ‏MP3 افتراضيًا؛ ويمكن أن يكون `responseFormat` ‏`mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. يستخدم OpenClaw نقطة نهاية TTS ‏REST الدفعية الخاصة بـ xAI ويعيد مرفقًا صوتيًا كاملًا؛ ولا يُستخدم WebSocket الخاص بالبث لـ xAI TTS في هذا المسار الخاص بالموفّر. ولا يدعم هذا المسار تنسيق المذكرات الصوتية الأصلي Opus.
- **Microsoft**: يستخدم `microsoft.outputFormat` ‏(الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل النقل المجمّع قيمة `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الإخراج تنسيقات إخراج Microsoft Speech ‏(بما في ذلك Ogg/WebM Opus).
  - يقبل `sendVoice` في Telegram التنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق إخراج Microsoft المضبوط، يعيد OpenClaw المحاولة باستخدام MP3.

تكون تنسيقات إخراج OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك Auto-TTS

عند التفعيل، يقوم OpenClaw بما يلي:

- يتخطى TTS إذا كان الرد يحتوي بالفعل على وسائط أو توجيه `MEDIA:`.
- يتخطى الردود القصيرة جدًا (< 10 أحرف).
- يلخّص الردود الطويلة عند التفعيل باستخدام `agents.defaults.model.primary` ‏(أو `summaryModel`).
- يرفق الصوت الذي تم إنشاؤه بالرد.

إذا تجاوز الرد `maxLength` وكان التلخيص معطلًا (أو لا يوجد مفتاح API لـ
نموذج التلخيص)،
فسيتم تخطي الصوت ويُرسَل الرد النصي العادي.

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

## استخدام أمر الشرطة المائلة

يوجد أمر واحد فقط: `/tts`.
راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للحصول على تفاصيل التمكين.

ملاحظة Discord: ‏`/tts` هو أمر مدمج في Discord، لذا يسجّل OpenClaw
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

- تتطلب الأوامر مرسلًا مخولًا (وما تزال قواعد قائمة السماح/المالك سارية).
- يجب تمكين `commands.text` أو تسجيل الأوامر الأصلية.
- تقبل التهيئة `messages.tts.auto` القيم `off|always|inbound|tagged`.
- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتب `/tts off` إلى `off`.
- استخدم التهيئة عندما تريد القيم الافتراضية `inbound` أو `tagged`.
- تُخزَّن `limit` و`summary` في التفضيلات المحلية، وليس في التهيئة الرئيسية.
- ينشئ `/tts audio` ردًا صوتيًا لمرة واحدة (ولا يفعّل TTS).
- يتضمن `/tts status` إظهارًا للرجوع الاحتياطي لأحدث محاولة:
  - رجوع احتياطي ناجح: `Fallback: <primary> -> <used>` بالإضافة إلى `Attempts: ...`
  - فشل: `Error: ...` بالإضافة إلى `Attempts: ...`
  - تشخيصات مفصلة: `Attempt details: provider:outcome(reasonCode) latency`
- تتضمن الآن إخفاقات OpenAI وElevenLabs API تفاصيل خطأ الموفّر المحللة ومعرّف الطلب (عند إرجاعه من الموفّر)، ويظهر ذلك في أخطاء/سجلات TTS.

## أداة الوكيل

تحوّل أداة `tts` النص إلى كلام وتعيد مرفقًا صوتيًا من أجل
تسليمه في الرد. وعندما تكون القناة هي Feishu أو Matrix أو Telegram أو WhatsApp،
يُسلَّم الصوت كرسالة صوتية بدلًا من مرفق ملف.
يمكن لـ Feishu تحويل خرج TTS غير Opus على هذا المسار عندما يكون `ffmpeg`
متاحًا.
ويرسل WhatsApp النص المرئي بشكل منفصل عن صوت المذكرات الصوتية PTT لأن العملاء
لا يعرضون التعليقات التوضيحية على المذكرات الصوتية بشكل متسق.
وتقبل الحقول الاختيارية `channel` و`timeoutMs`؛ وتمثل `timeoutMs`
مهلة طلب الموفّر لكل استدعاء بالمللي ثانية.

## Gateway RPC

أساليب Gateway:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## ذي صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
