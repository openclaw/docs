---
read_when:
    - تفعيل تحويل النص إلى كلام للردود
    - تكوين موفّر TTS، أو سلسلة الرجوع الاحتياطي، أو الشخصية
    - استخدام أوامر /tts أو التوجيهات
sidebarTitle: Text to speech (TTS)
summary: تحويل النص إلى كلام للردود الصادرة — المزوّدون، والشخصيات، وأوامر الشرطة المائلة، والمخرجات لكل قناة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-05-02T22:24:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: daf4d7bc86afe14f7c181eee56e2bc77906ed78b4aaabb2fc855847f5a4366f9
    source_path: tools/tts.md
    workflow: 16
---

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت عبر **14 مزوّد كلام**
وتسليم رسائل صوتية أصلية على Feishu وMatrix وTelegram وWhatsApp،
ومرفقات صوتية في كل مكان آخر، وتدفقات PCM/Ulaw للاتصالات الهاتفية وTalk.

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    OpenAI وElevenLabs هما أكثر الخيارات المستضافة موثوقية. تعمل Microsoft و
    Local CLI دون مفتاح API. راجع [مصفوفة المزوّدين](#supported-providers)
    للاطلاع على القائمة الكاملة.
  </Step>
  <Step title="عيّن مفتاح API">
    صدّر متغير البيئة الخاص بالمزوّد لديك (مثلًا `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`). لا تحتاج Microsoft وLocal CLI إلى مفتاح.
  </Step>
  <Step title="فعّل في الإعدادات">
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
  <Step title="جرّبه في الدردشة">
    يعرض `/tts status` الحالة الحالية. يرسل `/tts audio Hello from OpenClaw`
    ردًا صوتيًا لمرة واحدة.
  </Step>
</Steps>

<Note>
تحويل النص إلى كلام تلقائيًا **متوقف** افتراضيًا. عندما لا يكون `messages.tts.provider` معيّنًا،
يختار OpenClaw أول مزوّد مهيأ وفق ترتيب التحديد التلقائي في السجل.
أداة وكيل `tts` المضمّنة مخصصة للنية الصريحة فقط: تبقى الدردشة العادية
نصية ما لم يطلب المستخدم صوتًا، أو يستخدم `/tts`، أو يفعّل كلام Auto-TTS/التوجيه.
</Note>

## المزوّدون المدعومون

| المزوّد          | المصادقة                                                                                                             | ملاحظات                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (وأيضًا `AZURE_SPEECH_API_KEY`، `SPEECH_KEY`، `SPEECH_REGION`)          | إخراج ملاحظات صوتية أصلي Ogg/Opus والاتصالات الهاتفية.                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | تحويل نص إلى كلام متوافق مع OpenAI. الافتراضي هو `hexgrad/Kokoro-82M`.                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` أو `XI_API_KEY`                                                                             | استنساخ الصوت، متعدد اللغات، حتمي عبر `seed`.                  |
| **Google Gemini** | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                                                                             | تحويل النص إلى كلام عبر Gemini API؛ مدرك للشخصية عبر `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | إخراج ملاحظات صوتية واتصالات هاتفية.                                        |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API تحويل نص إلى كلام متدفق. ملاحظات صوتية Opus أصلية واتصالات هاتفية PCM.            |
| **Local CLI**     | لا شيء                                                                                                             | يشغّل أمر TTS محليًا مهيأ.                                    |
| **Microsoft**     | لا شيء                                                                                                             | TTS عصبي عام من Edge عبر `node-edge-tts`. بأفضل جهد، بلا SLA.        |
| **MiniMax**       | `MINIMAX_API_KEY` (أو خطة الرمز: `MINIMAX_OAUTH_TOKEN`، `MINIMAX_CODE_PLAN_KEY`، `MINIMAX_CODING_API_KEY`)      | API T2A v2. الافتراضي هو `speech-2.8-hd`.                                |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | يُستخدم أيضًا للتلخيص التلقائي؛ يدعم `instructions` الخاصة بالشخصية.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (يمكن إعادة استخدام `models.providers.openrouter.apiKey`)                                            | النموذج الافتراضي `hexgrad/kokoro-82m`.                                     |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/رمز قديمان: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | مزوّد مشترك للصور والفيديو والكلام.                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دفعي من xAI. الملاحظات الصوتية Opus الأصلية **غير** مدعومة.             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS عبر إكمالات دردشة Xiaomi.                               |

إذا كانت هناك عدة مزوّدين مهيأة، يُستخدم المزوّد المحدد أولًا وتكون
المزوّدات الأخرى خيارات احتياطية. يستخدم التلخيص التلقائي `summaryModel` (أو
`agents.defaults.model.primary`)، لذلك يجب أن تكون مصادقة ذلك المزوّد مهيأة أيضًا
إذا أبقيت الملخصات مفعّلة.

<Warning>
يستخدم مزوّد **Microsoft** المضمّن خدمة TTS العصبية عبر الإنترنت من Microsoft Edge
من خلال `node-edge-tts`. إنها خدمة ويب عامة بلا
SLA أو حصة منشورة — تعامل معها كخدمة بأفضل جهد. يتم تطبيع معرف المزوّد القديم `edge` إلى
`microsoft` ويعيد `openclaw doctor --fix` كتابة
الإعدادات المحفوظة؛ يجب أن تستخدم الإعدادات الجديدة دائمًا `microsoft`.
</Warning>

## الإعدادات

توجد إعدادات TTS ضمن `messages.tts` في `~/.openclaw/openclaw.json`. اختر
إعدادًا مسبقًا وعدّل كتلة المزوّد:

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

استخدم `agents.list[].tts` عندما ينبغي أن يتحدث وكيل واحد بمزوّد
أو صوت أو نموذج أو شخصية أو وضع Auto-TTS مختلف. تندمج كتلة الوكيل بعمق فوق
`messages.tts`، لذلك يمكن أن تبقى بيانات اعتماد المزوّد في إعدادات المزوّد العامة:

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

لتثبيت شخصية لكل وكيل، عيّن `agents.list[].tts.persona` إلى جانب إعدادات
المزوّد — فهي تتجاوز `messages.tts.persona` العامة لذلك الوكيل فقط.

ترتيب الأولوية للردود التلقائية، و`/tts audio`، و`/tts status`، وأداة وكيل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` النشط
3. تجاوز القناة، عندما تدعم القناة `channels.<channel>.tts`
4. تجاوز الحساب، عندما تمرر القناة `channels.<channel>.accounts.<id>.tts`
5. تفضيلات `/tts` المحلية لهذا المضيف
6. توجيهات `[[tts:...]]` المضمنة عند تفعيل [تجاوزات النموذج](#model-driven-directives)

تستخدم تجاوزات القناة والحساب البنية نفسها مثل `messages.tts` وتدمج دمجا
عميقا فوق الطبقات السابقة، بحيث يمكن أن تبقى بيانات اعتماد المزوّد المشتركة في
`messages.tts` بينما تغيّر قناة أو حساب روبوت الصوت أو النموذج أو الشخصية أو
الوضع التلقائي فقط:

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

**الشخصية** هي هوية منطوقة مستقرة يمكن تطبيقها بشكل حتمي
عبر المزوّدين. يمكنها تفضيل مزوّد واحد، وتعريف قصد مطالبة محايد تجاه المزوّد،
وحمل ارتباطات خاصة بالمزوّد للأصوات والنماذج وقوالب المطالبات والبذور وإعدادات
الصوت.

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

### شخصية كاملة (مطالبة محايدة تجاه المزوّد)

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

### حل الشخصية

تحدد الشخصية النشطة بشكل حتمي:

1. تفضيل `/tts persona <id>` المحلي، إذا كان معينا.
2. `messages.tts.persona`، إذا كان معينا.
3. بلا شخصية.

يعمل اختيار المزوّد بأسلوب الصريح أولا:

1. التجاوزات المباشرة (CLI، Gateway، Talk، توجيهات TTS المسموح بها).
2. تفضيل `/tts provider <id>` المحلي.
3. `provider` الخاص بالشخصية النشطة.
4. `messages.tts.provider`.
5. الاختيار التلقائي من السجل.

في كل محاولة مزوّد، يدمج OpenClaw الإعدادات بهذا الترتيب:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. تجاوزات الطلب الموثوق بها
4. تجاوزات توجيه TTS الصادر من النموذج والمسموح بها

### كيف تستخدم المزوّدات مطالبات الشخصية

حقول مطالبة الشخصية (`profile`، `scene`، `sampleContext`، `style`، `accent`،
`pacing`، `constraints`) **محايدة تجاه المزوّد**. يقرر كل مزوّد كيف
يستخدمها:

<AccordionGroup>
  <Accordion title="Google Gemini">
    يلف حقول مطالبة الشخصية في بنية مطالبة Gemini TTS **فقط عندما**
    يضبط إعداد مزوّد Google الفعلي `promptTemplate: "audio-profile-v1"`
    أو `personaPrompt`. لا تزال حقول `audioProfile` و`speakerName` الأقدم
    تسبق النص كنص مطالبة خاص بـ Google. يتم الحفاظ على وسوم الصوت المضمنة مثل
    `[whispers]` أو `[laughs]` داخل كتلة `[[tts:text]]`
    داخل نص Gemini؛ لا يولّد OpenClaw هذه الوسوم.
  </Accordion>
  <Accordion title="OpenAI">
    يربط حقول مطالبة الشخصية بحقل الطلب `instructions` **فقط عندما**
    لا تكون هناك `instructions` صريحة معدة لـ OpenAI. تكون الأولوية دائما لـ `instructions`
    الصريحة.
  </Accordion>
  <Accordion title="المزوّدون الآخرون">
    يستخدمون فقط ارتباطات الشخصية الخاصة بالمزوّد تحت
    `personas.<id>.providers.<provider>`. يتم تجاهل حقول مطالبة الشخصية
    ما لم يطبق المزوّد ربط مطالبة شخصية خاصا به.
  </Accordion>
</AccordionGroup>

### سياسة الرجوع الاحتياطي

يتحكم `fallbackPolicy` في السلوك عندما لا يكون لدى الشخصية **أي ارتباط** للمزوّد
الذي تمت محاولته:

| السياسة              | السلوك                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **الافتراضي.** تبقى حقول المطالبة المحايدة تجاه المزوّد متاحة؛ قد يستخدمها المزوّد أو يتجاهلها.                                            |
| `provider-defaults` | تحذف الشخصية من تحضير المطالبة لتلك المحاولة؛ يستخدم المزوّد افتراضاته المحايدة بينما يستمر الرجوع الاحتياطي إلى مزوّدين آخرين. |
| `fail`              | تخطى محاولة ذلك المزوّد مع `reasonCode: "not_configured"` و`personaBinding: "missing"`. لا تزال مزوّدات الرجوع الاحتياطي تجرب.              |

لا يفشل طلب TTS بالكامل إلا عندما يتم تخطي **كل** المزوّدين الذين تمت محاولتهم
أو يفشلون.

## التوجيهات المعتمدة على النموذج

افتراضيا، **يمكن** للمساعد إصدار توجيهات `[[tts:...]]` لتجاوز
الصوت أو النموذج أو السرعة لرد واحد، إضافة إلى كتلة
`[[tts:text]]...[[/tts:text]]` اختيارية للإشارات التعبيرية التي ينبغي أن تظهر في
الصوت فقط:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

عندما تكون `messages.tts.auto` هي `"tagged"`، تكون **التوجيهات مطلوبة** لتشغيل
الصوت. يزيل تسليم كتل البث التوجيهات من النص المرئي قبل أن تراها
القناة، حتى عند تقسيمها عبر كتل متجاورة.

يتم تجاهل `provider=...` ما لم تكن `modelOverrides.allowProvider: true`. عندما
يعلن رد `provider=...`، يتم تحليل المفاتيح الأخرى في ذلك التوجيه
بواسطة ذلك المزوّد فقط؛ وتزال المفاتيح غير المدعومة ويبلغ عنها كتحذيرات
توجيه TTS.

**مفاتيح التوجيه المتاحة:**

- `provider` (معرّف المزوّد المسجل؛ يتطلب `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (مستوى صوت MiniMax، 0–10)
- `pitch` (درجة صوت MiniMax كعدد صحيح، −12 إلى 12؛ يتم اقتطاع القيم الكسرية)
- `emotion` (وسم عاطفة Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**تعطيل تجاوزات النموذج بالكامل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**السماح بتبديل المزوّد مع إبقاء عناصر التحكم الأخرى قابلة للضبط:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## أوامر الشرطة المائلة

أمر واحد هو `/tts`. على Discord، يسجل OpenClaw أيضا `/voice` لأن
`/tts` أمر مدمج في Discord — لا يزال نص `/tts ...` يعمل.

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
تتطلب الأوامر مرسلا مخولا (تنطبق قواعد قائمة السماح/المالك)، ويجب أن يكون
`commands.text` أو تسجيل الأوامر الأصلي مفعلا.
</Note>

ملاحظات السلوك:

- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتبه `/tts off` إلى `off`.
- يكتب `/tts chat on|off|default` تجاوز TTS تلقائيا بنطاق الجلسة للدردشة الحالية.
- يكتب `/tts persona <id>` تفضيل الشخصية المحلي؛ ويمسحه `/tts persona off`.
- يقرأ `/tts latest` أحدث رد من المساعد من نص الجلسة الحالية ويرسله كصوت مرة واحدة. يخزن فقط تجزئة ذلك الرد في إدخال الجلسة لمنع إرسال الصوت المكرر.
- يولّد `/tts audio` ردا صوتيا لمرة واحدة (ولا **يفعل** TTS).
- يتم تخزين `limit` و`summary` في **التفضيلات المحلية**، وليس في الإعداد الرئيسي.
- يتضمن `/tts status` تشخيصات الرجوع الاحتياطي للمحاولة الأخيرة — `Fallback: <primary> -> <used>`، و`Attempts: ...`، وتفاصيل لكل محاولة (`provider:outcome(reasonCode) latency`).
- يعرض `/status` وضع TTS النشط إضافة إلى المزوّد والنموذج والصوت وبيانات تعريف نقطة النهاية المخصصة المنقحة عند تفعيل TTS.

## التفضيلات لكل مستخدم

تكتب أوامر الشرطة المائلة التجاوزات المحلية إلى `prefsPath`. الافتراضي هو
`~/.openclaw/settings/tts.json`؛ تجاوزه باستخدام متغير البيئة `OPENCLAW_TTS_PREFS`
أو `messages.tts.prefsPath`.

| الحقل المخزن | التأثير                                       |
| ------------ | -------------------------------------------- |
| `auto`       | تجاوز TTS التلقائي المحلي (`always`, `off`, …) |
| `provider`   | تجاوز المزوّد الأساسي المحلي              |
| `persona`    | تجاوز الشخصية المحلي                       |
| `maxLength`  | حد الملخص (الافتراضي `1500` حرف)     |
| `summarize`  | مفتاح تبديل الملخص (الافتراضي `true`)              |

تتجاوز هذه الإعدادات التكوين الفعلي من `messages.tts` إضافة إلى كتلة
`agents.list[].tts` النشطة لذلك المضيف.

## صيغ الإخراج (ثابتة)

يعتمد تسليم صوت TTS على إمكانات القناة. تعلن Plugins القناة
ما إذا كان ينبغي أن تطلب TTS بنمط الصوت من المزوّدين هدف `voice-note` أصليا أو
تبقي على توليف `audio-file` العادي وتعلّم فقط الإخراج المتوافق للتسليم
الصوتي.

- **القنوات القادرة على الملاحظات الصوتية**: تفضّل ردود الملاحظات الصوتية Opus (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - 48 كيلوهرتز / 64 كيلوبت/ثانية توازن جيد لرسائل الصوت.
- **Feishu / WhatsApp**: عندما يُنتَج رد الملاحظة الصوتية كملف MP3/WebM/WAV/M4A
  أو ملف صوتي محتمل آخر، يحوّله channel plugin إلى Ogg/Opus بتردد 48 كيلوهرتز
  باستخدام `ffmpeg` قبل إرسال رسالة الصوت الأصلية. يرسل WhatsApp
  النتيجة عبر حمولة Baileys `audio` مع `ptt: true` و
  `audio/ogg; codecs=opus`. إذا فشل التحويل، يتلقى Feishu الملف الأصلي
  كمرفق؛ ويفشل إرسال WhatsApp بدلاً من نشر حمولة PTT غير متوافقة.
- **BlueBubbles**: يُبقي تركيب المزوّد على مسار ملف الصوت العادي؛ وتُعلَّم مخرجات MP3
  وCAF للتسليم كمذكرة صوتية في iMessage.
- **القنوات الأخرى**: MP3 (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - 44.1 كيلوهرتز / 128 كيلوبت/ثانية هو التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: MP3 (نموذج `speech-2.8-hd`، ومعدل عينة 32 كيلوهرتز) لمرفقات الصوت العادية. لأهداف الملاحظات الصوتية التي تعلنها القناة، يحوّل OpenClaw ملف MiniMax MP3 إلى Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم التحويل.
- **Xiaomi MiMo**: MP3 افتراضياً، أو WAV عند تهيئته. لأهداف الملاحظات الصوتية التي تعلنها القناة، يحوّل OpenClaw مخرجات Xiaomi إلى Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم التحويل.
- **CLI المحلي**: يستخدم `outputFormat` المهيأ. تُحوَّل أهداف الملاحظات الصوتية
  إلى Ogg/Opus ويُحوَّل خرج الهاتف إلى PCM أحادي خام بتردد 16 كيلوهرتز
  باستخدام `ffmpeg`.
- **Google Gemini**: تُرجع واجهة Gemini API TTS بيانات PCM خام بتردد 24 كيلوهرتز. يغلّفها OpenClaw كملف WAV لمرفقات الصوت، ويحوّلها إلى Opus بتردد 48 كيلوهرتز لأهداف الملاحظات الصوتية، ويُرجع PCM مباشرةً لـ Talk/الهاتف.
- **Gradium**: WAV لمرفقات الصوت، وOpus لأهداف الملاحظات الصوتية، و`ulaw_8000` بتردد 8 كيلوهرتز للهاتف.
- **Inworld**: MP3 لمرفقات الصوت العادية، و`OGG_OPUS` أصلي لأهداف الملاحظات الصوتية، و`PCM` خام بتردد 22050 هرتز لـ Talk/الهاتف.
- **xAI**: MP3 افتراضياً؛ يمكن أن يكون `responseFormat` هو `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. يستخدم OpenClaw نقطة نهاية TTS الدفعية عبر REST في xAI ويُرجع مرفق صوت كاملاً؛ ولا يستخدم مسار هذا المزوّد WebSocket TTS للبث في xAI. لا يدعم هذا المسار تنسيق Opus الأصلي للملاحظات الصوتية.
- **Microsoft**: يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل النقل المضمّن `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الخرج تنسيقات خرج Microsoft Speech (بما في ذلك Ogg/WebM Opus).
  - يقبل Telegram `sendVoice` تنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق خرج Microsoft المهيأ، يعيد OpenClaw المحاولة باستخدام MP3.

تنسيقات خرج OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك Auto-TTS

عند تمكين `messages.tts.auto`، يقوم OpenClaw بما يلي:

- يتجاوز TTS إذا كان الرد يحتوي بالفعل على وسائط أو توجيه `MEDIA:`.
- يتجاوز الردود القصيرة جداً (أقل من 10 أحرف).
- يلخص الردود الطويلة عند تمكين الملخصات، باستخدام
  `summaryModel` (أو `agents.defaults.model.primary`).
- يرفق الصوت المُنشأ بالرد.
- في `mode: "final"`، يظل يرسل TTS صوتياً فقط للردود النهائية المبثوثة
  بعد اكتمال بث النص؛ تمر الوسائط المُنشأة عبر تطبيع وسائط القناة نفسه
  مثل مرفقات الرد العادية.

إذا تجاوز الرد `maxLength` وكان التلخيص متوقفاً (أو لا يوجد مفتاح API لنموذج
التلخيص)، يُتجاوز الصوت ويُرسل الرد النصي العادي.

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

## تنسيقات الخرج حسب القناة

| الهدف                                 | التنسيق                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | تفضّل ردود الملاحظات الصوتية **Opus** (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI). يوازن 48 كيلوهرتز / 64 كيلوبت/ثانية بين الوضوح والحجم. |
| القنوات الأخرى                        | **MP3** (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI). 44.1 كيلوهرتز / 128 كيلوبت/ثانية افتراضي للكلام.                                 |
| Talk / الهاتف                         | **PCM** أصلي من المزوّد (Inworld 22050 هرتز، Google 24 كيلوهرتز)، أو `ulaw_8000` من Gradium للهاتف.                                 |

ملاحظات حسب المزوّد:

- **تحويل Feishu / WhatsApp:** عندما يصل رد ملاحظة صوتية كـ MP3/WebM/WAV/M4A، يحوّله channel plugin إلى Ogg/Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg`. يرسل WhatsApp عبر Baileys مع `ptt: true` و`audio/ogg; codecs=opus`. إذا فشل التحويل: يعود Feishu إلى إرفاق الملف الأصلي؛ ويفشل إرسال WhatsApp بدلاً من نشر حمولة PTT غير متوافقة.
- **MiniMax / Xiaomi MiMo:** MP3 افتراضي (32 كيلوهرتز لـ MiniMax `speech-2.8-hd`)؛ يُحوَّل إلى Opus بتردد 48 كيلوهرتز لأهداف الملاحظات الصوتية عبر `ffmpeg`.
- **CLI المحلي:** يستخدم `outputFormat` المهيأ. تُحوَّل أهداف الملاحظات الصوتية إلى Ogg/Opus وخرج الهاتف إلى PCM أحادي خام بتردد 16 كيلوهرتز.
- **Google Gemini:** يُرجع PCM خام بتردد 24 كيلوهرتز. يغلّفه OpenClaw كـ WAV للمرفقات، ويحوّله إلى Opus بتردد 48 كيلوهرتز لأهداف الملاحظات الصوتية، ويُرجع PCM مباشرةً لـ Talk/الهاتف.
- **Inworld:** مرفقات MP3، وملاحظة صوتية أصلية `OGG_OPUS`، و`PCM` خام بتردد 22050 هرتز لـ Talk/الهاتف.
- **xAI:** MP3 افتراضياً؛ يمكن أن يكون `responseFormat` هو `mp3|wav|pcm|mulaw|alaw`. يستخدم نقطة نهاية REST الدفعية في xAI — ولا يُستخدم WebSocket TTS للبث. تنسيق Opus الأصلي للملاحظات الصوتية **غير** مدعوم.
- **Microsoft:** يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`). يقبل Telegram `sendVoice` تنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج إلى رسائل صوتية Opus مضمونة. إذا فشل تنسيق Microsoft المهيأ، يعيد OpenClaw المحاولة باستخدام MP3.

تنسيقات خرج OpenAI وElevenLabs ثابتة لكل قناة كما هو مذكور أعلاه.

## مرجع الحقول

<AccordionGroup>
  <Accordion title="messages.tts.* على المستوى الأعلى">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      وضع Auto-TTS. يرسل `inbound` الصوت فقط بعد رسالة صوتية واردة؛ ويرسل `tagged` الصوت فقط عندما يتضمن الرد توجيهات `[[tts:...]]` أو كتلة `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      مفتاح تبديل قديم. ينقله `openclaw doctor --fix` إلى `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      يتضمن `"all"` ردود الأدوات/الكتل بالإضافة إلى الردود النهائية.
    </ParamField>
    <ParamField path="provider" type="string">
      معرّف مزوّد الكلام. عند عدم ضبطه، يستخدم OpenClaw أول مزوّد مهيأ في ترتيب الاختيار التلقائي للسجل. يُعاد كتابة `provider: "edge"` القديم إلى `"microsoft"` بواسطة `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      معرّف الشخصية النشطة من `personas`. يُطبّع إلى أحرف صغيرة.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هوية منطوقة ثابتة. الحقول: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. راجع [الشخصيات](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      نموذج رخيص للتلخيص التلقائي؛ القيمة الافتراضية هي `agents.defaults.model.primary`. يقبل `provider/model` أو اسماً مستعاراً لنموذج مهيأ.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      يسمح للنموذج بإصدار توجيهات TTS. القيمة الافتراضية لـ `enabled` هي `true`؛ والقيمة الافتراضية لـ `allowProvider` هي `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      إعدادات يملكها المزوّد ومفهرسة بمعرّف مزوّد الكلام. يُعاد كتابة الكتل المباشرة القديمة (`messages.tts.openai`، و`.elevenlabs`، و`.microsoft`، و`.edge`) بواسطة `openclaw doctor --fix`؛ ثبّت فقط `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      حد صارم لأحرف إدخال TTS. يفشل `/tts audio` إذا تم تجاوزه.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      مهلة الطلب بالمللي ثانية.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      يتجاوز مسار JSON المحلي للتفضيلات (المزوّد/الحد/التلخيص). الافتراضي `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY` أو `AZURE_SPEECH_API_KEY` أو `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقة Azure Speech (مثلاً `eastus`). Env: `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">تجاوز اختياري لنقطة نهاية Azure Speech (الاسم المستعار `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName لصوت Azure. الافتراضي `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">رمز لغة SSML. الافتراضي `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` في Azure للصوت القياسي. الافتراضي `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` في Azure لخرج الملاحظات الصوتية. الافتراضي `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">يعود إلى `ELEVENLABS_API_KEY` أو `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف النموذج (مثلاً `eleven_multilingual_v2`، `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">معرّف صوت ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، و`similarityBoost`، و`style` (كل منها `0..1`)، و`useSpeakerBoost` (`true|false`)، و`speed` (`0.5..2.0`، `1.0` = عادي).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>وضع تطبيع النص.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 من حرفين (مثلاً `en`، `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحيح `0..4294967295` لحتمية بأفضل جهد.</ParamField>
    <ParamField path="baseUrl" type="string">يتجاوز عنوان URL الأساسي لواجهة ElevenLabs API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">يعود إلى `GEMINI_API_KEY` / `GOOGLE_API_KEY`. إذا حُذف، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل الرجوع إلى env.</ParamField>
    <ParamField path="model" type="string">نموذج Gemini TTS. الافتراضي `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">اسم صوت Gemini الجاهز. الافتراضي `Kore`. الاسم المستعار: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">موجّه نمط بلغة طبيعية يُضاف قبل النص المنطوق.</ParamField>
    <ParamField path="speakerName" type="string">تسمية متحدث اختيارية تُضاف قبل النص المنطوق عندما يستخدم الموجّه متحدثاً مسمى.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>اضبطه على `audio-profile-v1` لتغليف حقول موجّه الشخصية النشطة في بنية موجّه Gemini TTS حتمية.</ParamField>
    <ParamField path="personaPrompt" type="string">نص موجّه شخصية إضافي خاص بـ Google يُضاف إلى ملاحظات المخرج في القالب.</ParamField>
    <ParamField path="baseUrl" type="string">يُقبل فقط `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">متغير البيئة: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld الأساسي

    <ParamField path="apiKey" type="string">متغير البيئة: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">الافتراضي `inworld-tts-1.5-max`. أيضًا: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">درجة حرارة أخذ العينات `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">ملف تنفيذي محلي أو سلسلة أمر لـ CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">وسائط الأمر. يدعم عناصر نائبة `{{Text}}`، `{{OutputPath}}`، `{{OutputDir}}`، `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>تنسيق خرج CLI المتوقع. الافتراضي `mp3` لمرفقات الصوت.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلة الأمر بالمللي ثانية. الافتراضي `120000`.</ParamField>
    <ParamField path="cwd" type="string">دليل العمل الاختياري للأمر.</ParamField>
    <ParamField path="env" type="Record<string, string>">تجاوزات بيئة اختيارية للأمر.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">السماح باستخدام كلام Microsoft.</ParamField>
    <ParamField path="voice" type="string">اسم صوت Microsoft العصبي (مثل `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">رمز اللغة (مثل `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">تنسيق خرج Microsoft. الافتراضي `audio-24khz-48kbitrate-mono-mp3`. لا يدعم النقل المضمن المدعوم من Edge كل التنسيقات.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">سلاسل نسب مئوية (مثل `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">كتابة ترجمات JSON بجانب ملف الصوت.</ParamField>
    <ParamField path="proxy" type="string">عنوان URL للوكيل لطلبات كلام Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">تجاوز مهلة الطلب (مللي ثانية).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>اسم بديل قديم. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المستمرة إلى `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">يرجع إلى `MINIMAX_API_KEY`. مصادقة Token Plan عبر `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.minimax.io`. متغير البيئة: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `speech-2.8-hd`. متغير البيئة: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `English_expressive_narrator`. متغير البيئة: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. الافتراضي `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. الافتراضي `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحيح `-12..12`. الافتراضي `0`. تُقتطع القيم الكسرية قبل الطلب.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">يرجع إلى `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف نموذج OpenAI TTS (مثل `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">اسم الصوت (مثل `alloy`، `cedar`).</ParamField>
    <ParamField path="instructions" type="string">حقل OpenAI `instructions` الصريح. عند ضبطه، لا تُطابق حقول مطالبة الشخصية **تلقائيًا**.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">حقول JSON إضافية تُدمج في أجسام طلبات `/audio/speech` بعد حقول OpenAI TTS المُنشأة. استخدم هذا لنقاط النهاية المتوافقة مع OpenAI مثل Kokoro التي تتطلب مفاتيح خاصة بالمزوّد مثل `lang`؛ يتم تجاهل مفاتيح النماذج الأولية غير الآمنة.</ParamField>
    <ParamField path="baseUrl" type="string">
      تجاوز نقطة نهاية OpenAI TTS. ترتيب الحل: الإعدادات → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. تُعامل القيم غير الافتراضية كنقاط نهاية TTS متوافقة مع OpenAI، لذلك تُقبل أسماء النماذج والأصوات المخصصة.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">متغير البيئة: `OPENROUTER_API_KEY`. يمكنه إعادة استخدام `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://openrouter.ai/api/v1`. يُطبّع العنوان القديم `https://openrouter.ai/v1`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `hexgrad/kokoro-82m`. الاسم البديل: `modelId`.</ParamField>
    <ParamField path="voice" type="string">الافتراضي `af_alloy`. الاسم البديل: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>الافتراضي `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي لدى المزوّد.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">متغير البيئة: `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">الافتراضي `seed-tts-1.0`. متغير البيئة: `VOLCENGINE_TTS_RESOURCE_ID`. استخدم `seed-tts-2.0` عندما يكون مشروعك مخولًا لاستخدام TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ترويسة مفتاح التطبيق. الافتراضي `aGjiRDfUWi`. متغير البيئة: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز نقطة نهاية HTTP الخاصة بـ Seed Speech TTS. متغير البيئة: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع الصوت. الافتراضي `en_female_anna_mars_bigtts`. متغير البيئة: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبة السرعة الأصلية لدى المزوّد.</ParamField>
    <ParamField path="emotion" type="string">وسم الانفعال الأصلي لدى المزوّد.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>حقول Volcengine Speech Console القديمة. متغيرات البيئة: `VOLCENGINE_TTS_APPID`، `VOLCENGINE_TTS_TOKEN`، `VOLCENGINE_TTS_CLUSTER` (الافتراضي `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">متغير البيئة: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.x.ai/v1`. متغير البيئة: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `eve`. الأصوات الحية: `ara`، `eve`، `leo`، `rex`، `sal`، `una`.</ParamField>
    <ParamField path="language" type="string">رمز لغة BCP-47 أو `auto`. الافتراضي `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>الافتراضي `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي لدى المزوّد.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">متغير البيئة: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.xiaomimimo.com/v1`. متغير البيئة: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `mimo-v2.5-tts`. متغير البيئة: `XIAOMI_TTS_MODEL`. يدعم أيضًا `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">الافتراضي `mimo_default`. متغير البيئة: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>الافتراضي `mp3`. متغير البيئة: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">تعليمة أسلوب اختيارية بلغة طبيعية تُرسل كرسالة المستخدم؛ ولا تُنطق.</ParamField>
  </Accordion>
</AccordionGroup>

## أداة الوكيل

تحوّل أداة `tts` النص إلى كلام وتُرجع مرفقًا صوتيًا لتسليم
الرد. في Feishu وMatrix وTelegram وWhatsApp، يُسلّم الصوت
كرسالة صوتية بدلًا من مرفق ملف. يمكن لـ Feishu وWhatsApp
تحويل ترميز خرج TTS غير Opus في هذا المسار عندما يكون `ffmpeg`
متاحًا.

يرسل WhatsApp الصوت عبر Baileys كملاحظة صوتية PTT (`audio` مع
`ptt: true`) ويرسل النص المرئي **منفصلًا** عن صوت PTT لأن
العملاء لا يعرضون التسميات التوضيحية على الملاحظات الصوتية بشكل متسق.

تقبل الأداة حقلي `channel` و`timeoutMs` الاختياريين؛ و`timeoutMs` هو
مهلة طلب المزوّد لكل استدعاء بالمللي ثانية.

## RPC الخاص بـ Gateway

| الطريقة            | الغرض                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | قراءة حالة TTS الحالية وآخر محاولة. |
| `tts.enable`      | ضبط تفضيل التشغيل التلقائي المحلي إلى `always`.   |
| `tts.disable`     | ضبط تفضيل التشغيل التلقائي المحلي إلى `off`.      |
| `tts.convert`     | تحويل نص لمرة واحدة → صوت.                    |
| `tts.setProvider` | ضبط تفضيل المزوّد المحلي.           |
| `tts.setPersona`  | ضبط تفضيل الشخصية المحلي.            |
| `tts.providers`   | سرد المزوّدين المُهيّئين وحالتهم.    |

## روابط الخدمة

- [دليل تحويل النص إلى كلام في OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع Audio API في OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام عبر REST في Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [مزوّد Azure Speech](/ar/providers/azure-speech)
- [تحويل النص إلى كلام في ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [مصادقة ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ar/providers/gradium)
- [واجهة Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [واجهة MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [واجهة Volcengine TTS HTTP API](/ar/providers/volcengine#text-to-speech)
- [توليف الكلام في Xiaomi MiMo](/ar/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات خرج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تحويل النص إلى كلام في xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ذات صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
- [أوامر Slash](/ar/tools/slash-commands)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
