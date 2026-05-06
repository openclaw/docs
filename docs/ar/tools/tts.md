---
read_when:
    - تمكين تحويل النص إلى كلام للردود
    - تكوين موفّر TTS أو سلسلة الرجوع الاحتياطي أو الشخصية
    - استخدام أوامر /tts أو توجيهاته
sidebarTitle: Text to speech (TTS)
summary: تحويل النص إلى كلام للردود الصادرة — المزوّدون، والشخصيات، وأوامر الشرطة المائلة، والإخراج لكل قناة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-05-06T08:19:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac6fce14c5597938949d1e3bb8547106707b234e9b1c7a33fd49d23bae27da6e
    source_path: tools/tts.md
    workflow: 16
---

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت عبر **14 مزود كلام**
وتسليم رسائل صوتية أصلية على Feishu وMatrix وTelegram وWhatsApp،
ومرفقات صوتية في كل مكان آخر، وتدفقات PCM/Ulaw للاتصالات الهاتفية وTalk.

TTS هو نصف إخراج الكلام في وضع `stt-tts` الخاص بـ Talk. جلسات Talk
`realtime` الأصلية للمزود تولد الكلام داخل مزود الوقت الحقيقي بدلا من
استدعاء مسار TTS هذا، بينما لا تولد جلسات `transcription` ردا صوتيا
للمساعد.

## البدء السريع

<Steps>
  <Step title="اختر مزودا">
    OpenAI وElevenLabs هما الخياران المستضافان الأكثر موثوقية. يعمل Microsoft و
    Local CLI دون مفتاح API. راجع [مصفوفة المزودين](#supported-providers)
    للاطلاع على القائمة الكاملة.
  </Step>
  <Step title="عيّن مفتاح API">
    صدّر متغير البيئة الخاص بمزودك (على سبيل المثال `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`). لا يحتاج Microsoft وLocal CLI إلى مفتاح.
  </Step>
  <Step title="فعّل في التكوين">
    عيّن `messages.tts.auto: "always"` و`messages.tts.provider`:

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

  </Step>
  <Step title="جرّبه في المحادثة">
    يعرض `/tts status` الحالة الحالية. يرسل `/tts audio Hello from OpenClaw`
    ردا صوتيا لمرة واحدة.
  </Step>
</Steps>

<Note>
Auto-TTS **متوقف** افتراضيا. عندما لا يكون `messages.tts.provider` معينا،
يختار OpenClaw أول مزود مكوّن حسب ترتيب الاختيار التلقائي في السجل.
أداة الوكيل المضمنة `tts` مخصصة للنية الصريحة فقط: تظل المحادثة العادية
نصا ما لم يطلب المستخدم الصوت، أو يستخدم `/tts`، أو يفعّل كلام Auto-TTS/التوجيه.
</Note>

## المزودون المدعومون

| المزود          | المصادقة                                                                                                             | ملاحظات                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (أيضا `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | إخراج ملاحظات صوتية Ogg/Opus أصلي واتصالات هاتفية.                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS متوافق مع OpenAI. الافتراضي هو `hexgrad/Kokoro-82M`.                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` أو `XI_API_KEY`                                                                             | استنساخ الصوت، متعدد اللغات، وحتمي عبر `seed`.                  |
| **Google Gemini** | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                                                                             | TTS عبر Gemini API؛ واع بالشخصية عبر `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | إخراج ملاحظات صوتية واتصالات هاتفية.                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | واجهة TTS API للبث. ملاحظات صوتية Opus أصلية واتصالات هاتفية PCM.            |
| **Local CLI**     | لا شيء                                                                                                             | يشغل أمر TTS محليا مكوّنا.                                    |
| **Microsoft**     | لا شيء                                                                                                             | TTS عصبي عام من Edge عبر `node-edge-tts`. أفضل جهد، بلا SLA.        |
| **MiniMax**       | `MINIMAX_API_KEY` (أو خطة Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | واجهة T2A v2 API. الافتراضي هو `speech-2.8-hd`.                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | يستخدم أيضا للتلخيص التلقائي؛ يدعم `instructions` للشخصية.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (يمكن إعادة استخدام `models.providers.openrouter.apiKey`)                                            | النموذج الافتراضي `hexgrad/kokoro-82m`.                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token القديمة: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | واجهة BytePlus Seed Speech HTTP API.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | مزود مشترك للصور والفيديو والكلام.                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دفعي من xAI. الملاحظات الصوتية Opus الأصلية **غير** مدعومة.             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS عبر إكمالات محادثة Xiaomi.                               |

إذا كان عدة مزودين مكوّنين، فسيُستخدم المزود المحدد أولا وتكون
المزودات الأخرى خيارات احتياطية. يستخدم التلخيص التلقائي `summaryModel` (أو
`agents.defaults.model.primary`)، لذلك يجب أيضا مصادقة ذلك المزود
إذا أبقيت الملخصات مفعّلة.

<Warning>
يستخدم مزود **Microsoft** المضمن خدمة TTS العصبية عبر الإنترنت من Microsoft Edge
من خلال `node-edge-tts`. إنها خدمة ويب عامة دون SLA أو حصة منشورة —
تعامل معها كأفضل جهد. يتم تطبيع معرّف المزود القديم `edge` إلى
`microsoft` ويعيد `openclaw doctor --fix` كتابة التكوين المحفوظ؛
يجب أن تستخدم التكوينات الجديدة دائما `microsoft`.
</Warning>

## التكوين

يوجد تكوين TTS ضمن `messages.tts` في `~/.openclaw/openclaw.json`. اختر
إعدادا مسبقا وعدّل كتلة المزود:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
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
  </Tab>
  <Tab title="Microsoft (بلا مفتاح)">
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
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
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
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### تجاوزات الصوت لكل وكيل

استخدم `agents.list[].tts` عندما ينبغي لوكيل واحد أن يتحدث بمزود أو
صوت أو نموذج أو شخصية أو وضع Auto-TTS مختلف. تدمج كتلة الوكيل بعمق فوق
`messages.tts`، لذلك يمكن أن تبقى بيانات اعتماد المزود في تكوين المزود العام:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

لتثبيت شخصية لكل وكيل، عيّن `agents.list[].tts.persona` إلى جانب تكوين
المزود — فهو يتجاوز `messages.tts.persona` العام لذلك الوكيل فقط.

ترتيب الأولوية للردود التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` النشط
3. تجاوز القناة، عندما تدعم القناة `channels.<channel>.tts`
4. تجاوز الحساب، عندما تمرر القناة `channels.<channel>.accounts.<id>.tts`
5. تفضيلات `/tts` المحلية لهذا المضيف
6. توجيهات `[[tts:...]]` المضمنة عندما تكون [تجاوزات النموذج](#model-driven-directives) مفعلة

تستخدم تجاوزات القنوات والحسابات الشكل نفسه مثل `messages.tts` ويتم
دمجها بعمق فوق الطبقات السابقة، لذلك يمكن أن تبقى بيانات اعتماد المزوّد
المشتركة في `messages.tts` بينما تغيّر قناة أو حساب بوت الصوت أو النموذج أو الشخصية
أو الوضع التلقائي فقط:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## الشخصيات

**الشخصية** هي هوية نطق ثابتة يمكن تطبيقها بشكل حتمي عبر المزوّدين. يمكنها تفضيل مزوّد واحد، وتعريف نية مطالبة محايدة بين المزوّدين، وحمل ارتباطات خاصة بالمزوّد للأصوات والنماذج وقوالب المطالبات والبذور وإعدادات الصوت.

### شخصية بسيطة

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### شخصية كاملة (مطالبة محايدة بين المزوّدين)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### حلّ الشخصية

يتم اختيار الشخصية النشطة بشكل حتمي:

1. تفضيل `/tts persona <id>` المحلي، إذا كان مضبوطًا.
2. `messages.tts.persona`، إذا كان مضبوطًا.
3. لا توجد شخصية.

يعمل اختيار المزوّد وفق نهج الصريح أولًا:

1. التجاوزات المباشرة (CLI، وGateway، وTalk، وتوجيهات TTS المسموح بها).
2. تفضيل `/tts provider <id>` المحلي.
3. `provider` الخاص بالشخصية النشطة.
4. `messages.tts.provider`.
5. الاختيار التلقائي من السجل.

لكل محاولة مزوّد، يدمج OpenClaw الإعدادات بهذا الترتيب:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. تجاوزات الطلب الموثوقة
4. تجاوزات توجيهات TTS الصادرة من النموذج والمسموح بها

### كيف تستخدم المزوّدات مطالبات الشخصية

حقول مطالبة الشخصية (`profile`، و`scene`، و`sampleContext`، و`style`، و`accent`،
و`pacing`، و`constraints`) **محايدة بين المزوّدين**. يقرر كل مزوّد كيف
يستخدمها:

<AccordionGroup>
  <Accordion title="Google Gemini">
    يلف حقول مطالبة الشخصية في بنية مطالبة Gemini TTS **فقط عندما**
    يضبط تكوين مزوّد Google الفعلي `promptTemplate: "audio-profile-v1"`
    أو `personaPrompt`. لا تزال الحقول الأقدم `audioProfile` و`speakerName`
    تُضاف في البداية كنص مطالبة خاص بـ Google. تُحفظ وسوم الصوت المضمنة مثل
    `[whispers]` أو `[laughs]` داخل كتلة `[[tts:text]]`
    داخل نص Gemini؛ لا يولد OpenClaw هذه الوسوم.
  </Accordion>
  <Accordion title="OpenAI">
    يربط حقول مطالبة الشخصية بحقل الطلب `instructions` **فقط عندما**
    لا تكون هناك `instructions` صريحة مكوّنة لـ OpenAI. تفوز `instructions`
    الصريحة دائمًا.
  </Accordion>
  <Accordion title="المزوّدون الآخرون">
    يستخدمون فقط ارتباطات الشخصية الخاصة بالمزوّد تحت
    `personas.<id>.providers.<provider>`. يتم تجاهل حقول مطالبة الشخصية
    ما لم ينفّذ المزوّد تعيينه الخاص لمطالبة الشخصية.
  </Accordion>
</AccordionGroup>

### سياسة الرجوع الاحتياطي

يتحكم `fallbackPolicy` في السلوك عندما لا يكون لدى الشخصية **أي ارتباط** للمزوّد
الذي تجري محاولته:

| السياسة              | السلوك                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **الافتراضي.** تبقى حقول المطالبة المحايدة بين المزوّدين متاحة؛ قد يستخدمها المزوّد أو يتجاهلها.                                            |
| `provider-defaults` | تُحذف الشخصية من إعداد المطالبة لتلك المحاولة؛ يستخدم المزوّد افتراضاته المحايدة بينما يستمر الرجوع إلى مزوّدين آخرين. |
| `fail`              | تخطَّ محاولة ذلك المزوّد مع `reasonCode: "not_configured"` و`personaBinding: "missing"`. لا تزال مزوّدات الرجوع الاحتياطي تُجرّب.              |

يفشل طلب TTS بالكامل فقط عندما يتم تخطي **كل** المزوّدين الذين جرت محاولتهم
أو يفشلون.

اختيار مزوّد جلسة Talk محدود بنطاق الجلسة. يجب أن يختار عميل Talk
معرفات المزوّدين، ومعرفات النماذج، ومعرفات الأصوات، واللغات المحلية من `talk.catalog` ويمررها
عبر جلسة Talk أو طلب التسليم. يجب ألا يؤدي فتح جلسة صوت إلى تعديل
`messages.tts` أو افتراضات مزوّد Talk العامة.

## التوجيهات المدفوعة بالنموذج

افتراضيًا، **يمكن** للمساعد إصدار توجيهات `[[tts:...]]` لتجاوز
الصوت أو النموذج أو السرعة لرد واحد، بالإضافة إلى كتلة اختيارية
`[[tts:text]]...[[/tts:text]]` للإشارات التعبيرية التي ينبغي أن تظهر في
الصوت فقط:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

عندما تكون `messages.tts.auto` هي `"tagged"`، تكون **التوجيهات مطلوبة** لتشغيل
الصوت. يزيل تسليم كتل البث التوجيهات من النص المرئي قبل أن تراها
القناة، حتى عندما تكون مقسمة عبر كتل متجاورة.

يتم تجاهل `provider=...` ما لم تكن `modelOverrides.allowProvider: true`. عندما
يعلن رد عن `provider=...`، يتم تحليل المفاتيح الأخرى في ذلك التوجيه
فقط بواسطة ذلك المزوّد؛ تتم إزالة المفاتيح غير المدعومة والإبلاغ عنها كتحذيرات
توجيه TTS.

**مفاتيح التوجيه المتاحة:**

- `provider` (معرف مزوّد مسجل؛ يتطلب `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (حجم MiniMax، 0–10)
- `pitch` (طبقة صوت MiniMax بعدد صحيح، −12 إلى 12؛ تُقتطع القيم الكسرية)
- `emotion` (وسم عاطفة Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**تعطيل تجاوزات النموذج بالكامل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**السماح بتبديل المزوّد مع إبقاء أدوات الضبط الأخرى قابلة للتكوين:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## أوامر الشرطة المائلة

الأمر الواحد `/tts`. على Discord، يسجل OpenClaw أيضًا `/voice` لأن
`/tts` أمر مدمج في Discord — لا يزال النص `/tts ...` يعمل.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
تتطلب الأوامر مرسلًا مخولًا (تنطبق قواعد قائمة السماح/المالك) ويجب أن يكون إما
`commands.text` أو تسجيل الأوامر الأصلي مفعّلًا.
</Note>

ملاحظات السلوك:

- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتبه `/tts off` إلى `off`.
- يكتب `/tts chat on|off|default` تجاوز TTS تلقائيًا محدودًا بنطاق الجلسة للدردشة الحالية.
- يكتب `/tts persona <id>` تفضيل الشخصية المحلي؛ ويمسحه `/tts persona off`.
- يقرأ `/tts latest` أحدث رد للمساعد من نص الجلسة الحالية ويرسله كصوت مرة واحدة. يخزن فقط تجزئة ذلك الرد في إدخال الجلسة لمنع الإرسال الصوتي المكرر.
- ينشئ `/tts audio` ردًا صوتيًا لمرة واحدة (لا يبدّل TTS إلى وضع التشغيل).
- يتم تخزين `limit` و`summary` في **التفضيلات المحلية**، وليس في التكوين الرئيسي.
- يتضمن `/tts status` تشخيصات الرجوع الاحتياطي لأحدث محاولة — `Fallback: <primary> -> <used>`، و`Attempts: ...`، وتفاصيل كل محاولة (`provider:outcome(reasonCode) latency`).
- يعرض `/status` وضع TTS النشط بالإضافة إلى المزوّد والنموذج والصوت المكوّنة وبيانات تعريف نقطة النهاية المخصصة المنقّاة عندما يكون TTS مفعّلًا.

## تفضيلات لكل مستخدم

تكتب أوامر الشرطة المائلة التجاوزات المحلية إلى `prefsPath`. الافتراضي هو
`~/.openclaw/settings/tts.json`؛ تجاوزه باستخدام متغير البيئة `OPENCLAW_TTS_PREFS`
أو `messages.tts.prefsPath`.

| الحقل المخزن | التأثير                                       |
| ------------ | -------------------------------------------- |
| `auto`       | تجاوز TTS التلقائي المحلي (`always`, `off`, …) |
| `provider`   | تجاوز المزوّد الأساسي المحلي              |
| `persona`    | تجاوز الشخصية المحلي                       |
| `maxLength`  | عتبة التلخيص (الافتراضي `1500` حرف)     |
| `summarize`  | تبديل التلخيص (الافتراضي `true`)              |

تتجاوز هذه القيم التكوين الفعلي من `messages.tts` بالإضافة إلى كتلة
`agents.list[].tts` النشطة لذلك المضيف.

## تنسيقات الإخراج (ثابتة)

يُدار تسليم صوت TTS وفق قدرات القناة. تعلن Plugins القنوات
ما إذا كان TTS بنمط الصوت يجب أن يطلب من المزوّدين هدفًا أصليًا `voice-note` أو
يبقي تركيب `audio-file` العادي ويضع فقط علامة على الإخراج المتوافق لتسليم
الصوت.

- **القنوات القادرة على الملاحظات الصوتية**: تفضّل ردود الملاحظات الصوتية Opus (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - 48kHz / 64kbps هو توازن جيد للرسائل الصوتية.
- **Feishu / WhatsApp**: عندما يُنتج رد الملاحظة الصوتية كملف MP3/WebM/WAV/M4A
  أو ملف صوتي آخر محتمل، يحوّله Plugin القناة إلى Ogg/Opus بتردد 48kHz
  باستخدام `ffmpeg` قبل إرسال الرسالة الصوتية الأصلية. يرسل WhatsApp
  النتيجة عبر حمولة Baileys `audio` مع `ptt: true` و
  `audio/ogg; codecs=opus`. إذا فشل التحويل، يتلقى Feishu الملف الأصلي
  كمرفق؛ ويفشل إرسال WhatsApp بدلًا من نشر حمولة PTT غير متوافقة.
- **BlueBubbles**: يُبقي توليف المزوّد على مسار ملف الصوت العادي؛ وتُعلَّم
  مخرجات MP3 وCAF للتسليم كمذكرة صوتية عبر iMessage.
- **القنوات الأخرى**: MP3 (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - 44.1kHz / 128kbps هو التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: MP3 (نموذج `speech-2.8-hd`، ومعدل عينة 32kHz) لمرفقات الصوت العادية. بالنسبة لأهداف الملاحظات الصوتية التي تعلنها القناة، يحوّل OpenClaw ملف MiniMax MP3 إلى Opus بتردد 48kHz باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم التحويل.
- **Xiaomi MiMo**: MP3 افتراضيًا، أو WAV عند تكوينه. بالنسبة لأهداف الملاحظات الصوتية التي تعلنها القناة، يحوّل OpenClaw مخرجات Xiaomi إلى Opus بتردد 48kHz باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم التحويل.
- **CLI المحلي**: يستخدم `outputFormat` المُكوَّن. تُحوَّل أهداف الملاحظات الصوتية
  إلى Ogg/Opus، وتُحوَّل مخرجات الاتصالات الهاتفية إلى PCM خام أحادي القناة
  بتردد 16 kHz باستخدام `ffmpeg`.
- **Google Gemini**: يعيد TTS في Gemini API ملف PCM خام بتردد 24kHz. يغلّفه OpenClaw كملف WAV لمرفقات الصوت، ويحوّله إلى Opus بتردد 48kHz لأهداف الملاحظات الصوتية، ويعيد PCM مباشرةً لـ Talk/الاتصالات الهاتفية.
- **Gradium**: WAV لمرفقات الصوت، وOpus لأهداف الملاحظات الصوتية، و`ulaw_8000` بتردد 8 kHz للاتصالات الهاتفية.
- **Inworld**: MP3 لمرفقات الصوت العادية، و`OGG_OPUS` أصلي لأهداف الملاحظات الصوتية، و`PCM` خام بتردد 22050 Hz لـ Talk/الاتصالات الهاتفية.
- **xAI**: MP3 افتراضيًا؛ يمكن أن يكون `responseFormat` هو `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. يستخدم OpenClaw نقطة نهاية xAI لتوليف الكلام TTS عبر REST الدفعي ويعيد مرفقًا صوتيًا كاملًا؛ ولا يستخدم مسار هذا المزوّد WebSocket الخاص بتدفق TTS من xAI. لا يدعم هذا المسار تنسيق Opus الأصلي للملاحظات الصوتية.
- **Microsoft**: يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل النقل المضمّن `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الإخراج تنسيقات إخراج Microsoft Speech (بما في ذلك Ogg/WebM Opus).
  - يقبل Telegram `sendVoice` صيغ OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق إخراج Microsoft المُكوَّن، يعيد OpenClaw المحاولة باستخدام MP3.

تنسيقات إخراج OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك TTS التلقائي

عند تمكين `messages.tts.auto`، يقوم OpenClaw بما يلي:

- يتخطى TTS إذا كان الرد يحتوي بالفعل على وسائط أو توجيه `MEDIA:`.
- يتخطى الردود القصيرة جدًا (أقل من 10 أحرف).
- يلخّص الردود الطويلة عند تمكين الملخصات، باستخدام
  `summaryModel` (أو `agents.defaults.model.primary`).
- يرفق الصوت المُنشأ بالرد.
- في `mode: "final"`، يظل يرسل TTS صوتيًا فقط للردود النهائية المتدفقة
  بعد اكتمال تدفق النص؛ تمر الوسائط المُنشأة عبر تطبيع وسائط القناة نفسه
  مثل مرفقات الرد العادية.

إذا تجاوز الرد `maxLength` وكان التلخيص متوقفًا (أو لا يوجد مفتاح API لنموذج
التلخيص)، يتم تخطي الصوت وإرسال الرد النصي العادي.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## تنسيقات الإخراج حسب القناة

  | الهدف                                 | التنسيق                                                                                                                               |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | تفضّل ردود الملاحظات الصوتية **Opus** (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI). يوازن 48 kHz / 64 kbps بين الوضوح والحجم. |
  | القنوات الأخرى                        | **MP3** (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI). الافتراضي للكلام هو 44.1 kHz / 128 kbps.                                 |
  | التحدث / الاتصال الهاتفي              | **PCM** أصلي من المزوّد (Inworld 22050 Hz، Google 24 kHz)، أو `ulaw_8000` من Gradium للاتصال الهاتفي.                                |

  ملاحظات حسب المزوّد:

  - **تحويل ترميز Feishu / WhatsApp:** عندما يصل رد ملاحظة صوتية بصيغة MP3/WebM/WAV/M4A، يحوّل Plugin القناة الترميز إلى 48 kHz Ogg/Opus باستخدام `ffmpeg`. يرسل WhatsApp عبر Baileys مع `ptt: true` و`audio/ogg; codecs=opus`. إذا فشل التحويل: يعود Feishu إلى إرفاق الملف الأصلي؛ ويفشل إرسال WhatsApp بدلا من نشر حمولة PTT غير متوافقة.
  - **MiniMax / Xiaomi MiMo:** MP3 افتراضي (32 kHz لـ MiniMax `speech-2.8-hd`)؛ يجري تحويله إلى 48 kHz Opus لأهداف الملاحظات الصوتية عبر `ffmpeg`.
  - **CLI المحلي:** يستخدم `outputFormat` المضبوط. تحوّل أهداف الملاحظات الصوتية إلى Ogg/Opus ومخرجات الاتصال الهاتفي إلى PCM أحادي خام بتردد 16 kHz.
  - **Google Gemini:** يرجع PCM خاما بتردد 24 kHz. يغلّفه OpenClaw كـ WAV للمرفقات، ويحوّله إلى 48 kHz Opus لأهداف الملاحظات الصوتية، ويرجع PCM مباشرة للتحدث/الاتصال الهاتفي.
  - **Inworld:** مرفقات MP3، وملاحظات صوتية أصلية `OGG_OPUS`، و`PCM` خام بتردد 22050 Hz للتحدث/الاتصال الهاتفي.
  - **xAI:** MP3 افتراضيا؛ يمكن أن يكون `responseFormat` هو `mp3|wav|pcm|mulaw|alaw`. يستخدم نقطة نهاية REST الدفعية في xAI — لا يُستخدم TTS عبر WebSocket المتدفق. صيغة الملاحظات الصوتية الأصلية Opus **غير** مدعومة.
  - **Microsoft:** يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`). يقبل `sendVoice` في Telegram صيغ OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج إلى رسائل صوتية Opus مضمونة. إذا فشلت صيغة Microsoft المضبوطة، يعيد OpenClaw المحاولة باستخدام MP3.

  صيغ مخرجات OpenAI وElevenLabs ثابتة لكل قناة كما هو مذكور أعلاه.

  ## مرجع الحقول

  <AccordionGroup>
  <Accordion title="رسائل المستوى الأعلى messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      وضع TTS التلقائي. لا يرسل `inbound` الصوت إلا بعد رسالة صوتية واردة؛ ولا يرسل `tagged` الصوت إلا عندما يتضمن الرد توجيهات `[[tts:...]]` أو كتلة `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      مفتاح تبديل قديم. يرحّل `openclaw doctor --fix` هذا إلى `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      يتضمن `"all"` ردود الأدوات/الكتل إضافة إلى الردود النهائية.
    </ParamField>
    <ParamField path="provider" type="string">
      معرّف مزوّد الكلام. عند عدم ضبطه، يستخدم OpenClaw أول مزوّد مضبوط وفق ترتيب الاختيار التلقائي في السجل. يعيد `openclaw doctor --fix` كتابة `provider: "edge"` القديم إلى `"microsoft"`.
    </ParamField>
    <ParamField path="persona" type="string">
      معرّف الشخصية النشطة من `personas`. يطبّع إلى أحرف صغيرة.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هوية كلامية مستقرة. الحقول: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. راجع [الشخصيات](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      نموذج رخيص للتلخيص التلقائي؛ الافتراضي هو `agents.defaults.model.primary`. يقبل `provider/model` أو اسما مستعارا مضبوطا لنموذج.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      السماح للنموذج بإصدار توجيهات TTS. القيمة الافتراضية لـ `enabled` هي `true`؛ والقيمة الافتراضية لـ `allowProvider` هي `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      إعدادات يملكها المزوّد ومفهرسة حسب معرّف مزوّد الكلام. يعيد `openclaw doctor --fix` كتابة الكتل المباشرة القديمة (`messages.tts.openai`، و`.elevenlabs`، و`.microsoft`، و`.edge`)؛ لا تثبت إلا `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      حد صارم لعدد أحرف إدخال TTS. يفشل `/tts audio` إذا جرى تجاوزه.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      مهلة الطلب بالمللي ثانية.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      تجاوز مسار JSON المحلي للتفضيلات (المزوّد/الحد/الملخص). الافتراضي `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">متغيرات البيئة: `AZURE_SPEECH_KEY`، أو `AZURE_SPEECH_API_KEY`، أو `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقة Azure Speech (مثلا `eastus`). متغيرات البيئة: `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">تجاوز اختياري لنقطة نهاية Azure Speech (الاسم البديل `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName لصوت Azure. الافتراضي `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">رمز لغة SSML. الافتراضي `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` من Azure للصوت القياسي. الافتراضي `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` من Azure لمخرجات الملاحظات الصوتية. الافتراضي `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">يرجع احتياطيا إلى `ELEVENLABS_API_KEY` أو `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف النموذج (مثلا `eleven_multilingual_v2`، و`eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">معرّف صوت ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، و`similarityBoost`، و`style` (كل منها `0..1`)، و`useSpeakerBoost` (`true|false`)، و`speed` (`0.5..2.0`، `1.0` = عادي).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>وضع تطبيع النص.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 من حرفين (مثلا `en`، و`de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحيح `0..4294967295` للحتمية بأفضل جهد.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز عنوان URL الأساسي لواجهة ElevenLabs API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">يرجع احتياطيا إلى `GEMINI_API_KEY` / `GOOGLE_API_KEY`. إذا حُذف، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل الرجوع الاحتياطي إلى متغيرات البيئة.</ParamField>
    <ParamField path="model" type="string">نموذج TTS من Gemini. الافتراضي `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">اسم صوت Gemini مسبق البناء. الافتراضي `Kore`. الاسم البديل: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">موجه نمط بلغة طبيعية يضاف قبل النص المنطوق.</ParamField>
    <ParamField path="speakerName" type="string">تسمية متحدث اختيارية تضاف قبل النص المنطوق عندما يستخدم الموجه متحدثا مسمى.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>اضبطه إلى `audio-profile-v1` لتغليف حقول موجه الشخصية النشطة في بنية موجه Gemini TTS حتمية.</ParamField>
    <ParamField path="personaPrompt" type="string">نص موجه شخصية إضافي خاص بـ Google يلحق بملاحظات المدير في القالب.</ParamField>
    <ParamField path="baseUrl" type="string">يقبل فقط `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">متغير البيئة: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">القيمة الافتراضية Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### إعداد Inworld الأساسي

    <ParamField path="apiKey" type="string">متغير البيئة: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">القيمة الافتراضية `inworld-tts-1.5-max`. كذلك: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">القيمة الافتراضية `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">درجة حرارة العينة `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">ملف تنفيذي محلي أو سلسلة أمر لتحويل النص إلى كلام عبر CLI.</ParamField>
    <ParamField path="args" type="string[]">وسائط الأمر. تدعم العناصر النائبة `{{Text}}`، و`{{OutputPath}}`، و`{{OutputDir}}`، و`{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>تنسيق خرج CLI المتوقع. القيمة الافتراضية `mp3` لمرفقات الصوت.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلة الأمر بالمللي ثانية. القيمة الافتراضية `120000`.</ParamField>
    <ParamField path="cwd" type="string">دليل العمل الاختياري للأمر.</ParamField>
    <ParamField path="env" type="Record<string, string>">تجاوزات بيئة اختيارية للأمر.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">السماح باستخدام الكلام من Microsoft.</ParamField>
    <ParamField path="voice" type="string">اسم الصوت العصبي من Microsoft (مثل `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">رمز اللغة (مثل `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">تنسيق الخرج من Microsoft. القيمة الافتراضية `audio-24khz-48kbitrate-mono-mp3`. ليست كل التنسيقات مدعومة عبر وسيلة النقل المضمّنة المعتمدة على Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">سلاسل نسب مئوية (مثل `+10%`، و`-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">كتابة ترجمات JSON بجانب ملف الصوت.</ParamField>
    <ParamField path="proxy" type="string">عنوان URL للوكيل لطلبات الكلام من Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">تجاوز مهلة الطلب (بالمللي ثانية).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>اسم بديل قديم. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المستمرة إلى `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">يتراجع إلى `MINIMAX_API_KEY`. مصادقة خطة الرموز عبر `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.minimax.io`. متغير البيئة: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">القيمة الافتراضية `speech-2.8-hd`. متغير البيئة: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">القيمة الافتراضية `English_expressive_narrator`. متغير البيئة: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. القيمة الافتراضية `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. القيمة الافتراضية `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحيح `-12..12`. القيمة الافتراضية `0`. تُقتطع القيم الكسرية قبل الطلب.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">يتراجع إلى `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف نموذج تحويل النص إلى كلام في OpenAI (مثل `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">اسم الصوت (مثل `alloy`، و`cedar`).</ParamField>
    <ParamField path="instructions" type="string">حقل OpenAI `instructions` الصريح. عند ضبطه، لا تُعيَّن حقول مطالبة الشخصية تلقائيا.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">حقول JSON إضافية تُدمج في أجسام طلبات `/audio/speech` بعد حقول تحويل النص إلى كلام المولدة من OpenAI. استخدم هذا لنقاط النهاية المتوافقة مع OpenAI مثل Kokoro التي تتطلب مفاتيح خاصة بالمزوّد مثل `lang`؛ ويتم تجاهل مفاتيح النموذج الأولي غير الآمنة.</ParamField>
    <ParamField path="baseUrl" type="string">
      تجاوز نقطة نهاية تحويل النص إلى كلام في OpenAI. ترتيب الحل: الإعدادات ← `OPENAI_TTS_BASE_URL` ← `https://api.openai.com/v1`. تُعامل القيم غير الافتراضية كنقاط نهاية تحويل نص إلى كلام متوافقة مع OpenAI، لذلك تُقبل أسماء النماذج والأصوات المخصصة.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">متغير البيئة: `OPENROUTER_API_KEY`. يمكن إعادة استخدام `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://openrouter.ai/api/v1`. يجري تطبيع العنوان القديم `https://openrouter.ai/v1`.</ParamField>
    <ParamField path="model" type="string">القيمة الافتراضية `hexgrad/kokoro-82m`. الاسم البديل: `modelId`.</ParamField>
    <ParamField path="voice" type="string">القيمة الافتراضية `af_alloy`. الاسم البديل: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>القيمة الافتراضية `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي لدى المزوّد.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">متغير البيئة: `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">القيمة الافتراضية `seed-tts-1.0`. متغير البيئة: `VOLCENGINE_TTS_RESOURCE_ID`. استخدم `seed-tts-2.0` عندما يتضمن مشروعك استحقاق TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ترويسة مفتاح التطبيق. القيمة الافتراضية `aGjiRDfUWi`. متغير البيئة: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز نقطة نهاية HTTP لتحويل النص إلى كلام في Seed Speech. متغير البيئة: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع الصوت. القيمة الافتراضية `en_female_anna_mars_bigtts`. متغير البيئة: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبة السرعة الأصلية لدى المزوّد.</ParamField>
    <ParamField path="emotion" type="string">وسم الشعور الأصلي لدى المزوّد.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>حقول Volcengine Speech Console القديمة. متغيرات البيئة: `VOLCENGINE_TTS_APPID`، و`VOLCENGINE_TTS_TOKEN`، و`VOLCENGINE_TTS_CLUSTER` (القيمة الافتراضية `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">متغير البيئة: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.x.ai/v1`. متغير البيئة: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">القيمة الافتراضية `eve`. الأصوات الحية: `ara`، و`eve`، و`leo`، و`rex`، و`sal`، و`una`.</ParamField>
    <ParamField path="language" type="string">رمز لغة BCP-47 أو `auto`. القيمة الافتراضية `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>القيمة الافتراضية `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي لدى المزوّد.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">متغير البيئة: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.xiaomimimo.com/v1`. متغير البيئة: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">القيمة الافتراضية `mimo-v2.5-tts`. متغير البيئة: `XIAOMI_TTS_MODEL`. يدعم أيضا `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">القيمة الافتراضية `mimo_default`. متغير البيئة: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>القيمة الافتراضية `mp3`. متغير البيئة: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">تعليمة أسلوب اختيارية باللغة الطبيعية تُرسل كرسالة المستخدم؛ ولا تُنطق.</ParamField>
  </Accordion>
</AccordionGroup>

## أداة الوكيل

تحوّل أداة `tts` النص إلى كلام وتعيد مرفقا صوتيا لتسليم الرد. في Feishu وMatrix وTelegram وWhatsApp، يُسلَّم الصوت كرسالة صوتية بدلا من مرفق ملف. يمكن لـ Feishu وWhatsApp تحويل ترميز خرج تحويل النص إلى كلام غير Opus في هذا المسار عندما يكون `ffmpeg` متاحا.

يرسل WhatsApp الصوت عبر Baileys كملاحظة صوتية PTT (`audio` مع `ptt: true`) ويرسل النص المرئي **بشكل منفصل** عن صوت PTT لأن العملاء لا يعرضون التسميات التوضيحية على الملاحظات الصوتية بشكل متسق.

تقبل الأداة حقلي `channel` و`timeoutMs` الاختياريين؛ و`timeoutMs` هو مهلة طلب مزوّد لكل استدعاء بالمللي ثانية.

## Gateway RPC

| الطريقة            | الغرض                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | قراءة حالة TTS الحالية وآخر محاولة. |
| `tts.enable`      | ضبط التفضيل التلقائي المحلي إلى `always`.   |
| `tts.disable`     | ضبط التفضيل التلقائي المحلي إلى `off`.      |
| `tts.convert`     | تحويل نص لمرة واحدة ← صوت.                    |
| `tts.setProvider` | ضبط تفضيل المزوّد المحلي.           |
| `tts.setPersona`  | ضبط تفضيل الشخصية المحلية.            |
| `tts.providers`   | سرد المزوّدين المكوّنين وحالتهم.    |

## روابط الخدمة

- [دليل OpenAI لتحويل النص إلى كلام](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع واجهة برمجة تطبيقات الصوت في OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام عبر REST في Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [مزوّد Azure Speech](/ar/providers/azure-speech)
- [تحويل النص إلى كلام في ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [مصادقة ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ar/providers/gradium)
- [واجهة برمجة تطبيقات Inworld TTS](https://docs.inworld.ai/tts/tts)
- [واجهة برمجة تطبيقات MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [واجهة برمجة تطبيقات HTTP لتحويل النص إلى كلام في Volcengine](/ar/providers/volcengine#text-to-speech)
- [توليف الكلام في Xiaomi MiMo](/ar/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات خرج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تحويل النص إلى كلام في xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ذو صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
- [أوامر Slash](/ar/tools/slash-commands)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
