---
read_when:
    - تفعيل تحويل النص إلى كلام للردود
    - إعداد موفّر تحويل النص إلى كلام أو سلسلة احتياطية أو شخصية
    - استخدام أوامر /tts أو توجيهاته
sidebarTitle: Text to speech (TTS)
summary: تحويل النص إلى كلام للردود الصادرة — المزوّدون، والشخصيات، وأوامر الشرطة المائلة، والإخراج حسب القناة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-04-30T08:32:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 16
---

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت عبر **14 مزوّد كلام**
وتسليم رسائل صوتية أصلية على Feishu وMatrix وTelegram وWhatsApp،
ومرفقات صوتية في كل مكان آخر، وتدفقات PCM/Ulaw للمهاتفة وTalk.

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    OpenAI وElevenLabs هما أكثر الخيارات المستضافة موثوقية. يعمل Microsoft و
    Local CLI دون مفتاح API. راجع [مصفوفة المزوّدين](#supported-providers)
    للاطلاع على القائمة الكاملة.
  </Step>
  <Step title="اضبط مفتاح API">
    صدّر متغير البيئة الخاص بمزوّدك (على سبيل المثال `OPENAI_API_KEY`،
    `ELEVENLABS_API_KEY`). لا يحتاج Microsoft وLocal CLI إلى مفتاح.
  </Step>
  <Step title="فعّله في الإعدادات">
    اضبط `messages.tts.auto: "always"` و`messages.tts.provider`:

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
    ردًا صوتيًا لمرة واحدة.
  </Step>
</Steps>

<Note>
ميزة Auto-TTS **متوقفة** افتراضيًا. عندما لا يكون `messages.tts.provider` مضبوطًا،
يختار OpenClaw أول مزوّد مهيأ حسب ترتيب الاختيار التلقائي في السجل.
</Note>

## المزوّدون المدعومون

| المزوّد           | المصادقة                                                                                                         | ملاحظات                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (أيضًا `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | إخراج ملاحظات صوتية أصلية بصيغة Ogg/Opus والمهاتفة.                    |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS متوافق مع OpenAI. الافتراضي هو `hexgrad/Kokoro-82M`.                |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` أو `XI_API_KEY`                                                                             | استنساخ الصوت، متعدد اللغات، وحتمي عبر `seed`.                         |
| **Google Gemini** | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                                                                             | TTS عبر Gemini API؛ مدرك للشخصية عبر `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | إخراج ملاحظات صوتية ومهاتفة.                                           |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | واجهة API لبث TTS. ملاحظة صوتية أصلية بصيغة Opus ومهاتفة PCM.          |
| **Local CLI**     | لا شيء                                                                                                           | يشغّل أمر TTS محليًا مهيأً.                                            |
| **Microsoft**     | لا شيء                                                                                                           | TTS عصبي عام من Edge عبر `node-edge-tts`. أفضل جهد، دون SLA.           |
| **MiniMax**       | `MINIMAX_API_KEY` (أو خطة الرمز: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)       | واجهة API لـ T2A v2. الافتراضي هو `speech-2.8-hd`.                     |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | يُستخدم أيضًا للملخص التلقائي؛ يدعم شخصية `instructions`.              |
| **OpenRouter**    | `OPENROUTER_API_KEY` (يمكن إعادة استخدام `models.providers.openrouter.apiKey`)                                  | النموذج الافتراضي `hexgrad/kokoro-82m`.                                |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/رمز قديم: `VOLCENGINE_TTS_APPID`/`_TOKEN`)     | واجهة BytePlus Seed Speech HTTP API.                                   |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | مزوّد مشترك للصور والفيديو والكلام.                                    |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS دفعي من xAI. الملاحظة الصوتية الأصلية بصيغة Opus **غير** مدعومة.   |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS عبر إكمالات محادثة Xiaomi.                                    |

إذا تم تكوين عدة مزوّدين، فسيُستخدم المزوّد المحدد أولًا وتكون
المزوّدات الأخرى خيارات احتياطية. يستخدم الملخص التلقائي `summaryModel` (أو
`agents.defaults.model.primary`)، لذا يجب أيضًا مصادقة ذلك المزوّد
إذا أبقيت الملخصات مفعّلة.

<Warning>
يستخدم مزوّد **Microsoft** المضمّن خدمة TTS العصبية عبر الإنترنت الخاصة بـ Microsoft Edge
من خلال `node-edge-tts`. إنها خدمة ويب عامة بلا
اتفاقية مستوى خدمة أو حصة منشورة — تعامل معها على أساس أفضل جهد. معرّف المزوّد القديم `edge`
يُطبّع إلى `microsoft` ويعيد `openclaw doctor --fix` كتابة
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
  <Tab title="Microsoft (no key)">
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

استخدم `agents.list[].tts` عندما يجب أن يتحدث وكيل واحد بمزوّد أو
صوت أو نموذج أو شخصية أو وضع TTS تلقائي مختلف. تُدمج كتلة الوكيل بعمق فوق
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

ترتيب الأولوية للردود التلقائية و`/tts audio` و`/tts status` وأداة الوكيل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` النشطة
3. تجاوز القناة، عندما تدعم القناة `channels.<channel>.tts`
4. تجاوز الحساب، عندما تمرّر القناة `channels.<channel>.accounts.<id>.tts`
5. تفضيلات `/tts` المحلية لهذا المضيف
6. توجيهات `[[tts:...]]` المضمنة عندما تكون [تجاوزات النموذج](#model-driven-directives) مفعّلة

تستخدم تجاوزات القنوات والحسابات الشكل نفسه مثل `messages.tts` ويتم
دمجها بعمق فوق الطبقات السابقة، لذا يمكن أن تبقى بيانات اعتماد المزوّد
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

**الشخصية** هي هوية صوتية ثابتة يمكن تطبيقها بصورة حتمية
عبر المزوّدين. يمكنها تفضيل مزوّد واحد، وتعريف قصد موجّه محايد للمزوّد،
وحمل ارتباطات خاصة بالمزوّد للأصوات والنماذج وقوالب الموجّهات والبذور وإعدادات الصوت.

### شخصية حدّية

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

### شخصية كاملة (موجّه محايد للمزوّد)

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

تُختار الشخصية النشطة بصورة حتمية:

1. تفضيل محلي `/tts persona <id>`، إن كان مضبوطًا.
2. `messages.tts.persona`، إن كان مضبوطًا.
3. لا توجد شخصية.

يعمل اختيار المزوّد بأسلوب الصريح أولًا:

1. التجاوزات المباشرة (CLI وGateway وTalk وتوجيهات TTS المسموح بها).
2. تفضيل محلي `/tts provider <id>`.
3. `provider` الخاص بالشخصية النشطة.
4. `messages.tts.provider`.
5. اختيار تلقائي من السجل.

لكل محاولة مزوّد، يدمج OpenClaw الإعدادات بهذا الترتيب:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. تجاوزات الطلب الموثوق بها
4. تجاوزات توجيه TTS المسموح بها والصادرة من النموذج

### كيف تستخدم المزوّدات موجّهات الشخصية

حقول موجّه الشخصية (`profile` و`scene` و`sampleContext` و`style` و`accent`
و`pacing` و`constraints`) **محايدة للمزوّد**. يقرر كل مزوّد كيف
يستخدمها:

<AccordionGroup>
  <Accordion title="Google Gemini">
    يغلّف حقول موجّه الشخصية داخل بنية موجّه Gemini TTS **فقط عندما**
    يضبط تكوين مزوّد Google الفعلي `promptTemplate: "audio-profile-v1"`
    أو `personaPrompt`. لا تزال الحقول الأقدم `audioProfile` و`speakerName`
    تُضاف في البداية كنص موجّه خاص بـ Google. تُحفَظ وسوم الصوت المضمّنة مثل
    `[whispers]` أو `[laughs]` داخل كتلة `[[tts:text]]`
    داخل نص Gemini؛ ولا يولّد OpenClaw هذه الوسوم.
  </Accordion>
  <Accordion title="OpenAI">
    يطابق حقول موجّه الشخصية مع حقل الطلب `instructions` **فقط عندما**
    لا تكون هناك `instructions` صريحة مضبوطة لـ OpenAI. تتغلب `instructions`
    الصريحة دائمًا.
  </Accordion>
  <Accordion title="Other providers">
    استخدم فقط ارتباطات الشخصية الخاصة بالمزوّد تحت
    `personas.<id>.providers.<provider>`. يتم تجاهل حقول موجّه الشخصية
    ما لم ينفّذ المزوّد ربط موجّه الشخصية الخاص به.
  </Accordion>
</AccordionGroup>

### سياسة الرجوع الاحتياطي

يتحكم `fallbackPolicy` في السلوك عندما لا يكون لدى الشخصية **أي ارتباط** للمزوّد
الذي تتم محاولته:

| السياسة             | السلوك                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **الافتراضي.** تبقى حقول الموجّه المحايدة للمزوّد متاحة؛ وقد يستخدمها المزوّد أو يتجاهلها.                                                |
| `provider-defaults` | تُحذف الشخصية من إعداد الموجّه لتلك المحاولة؛ يستخدم المزوّد افتراضاته المحايدة بينما يستمر الرجوع الاحتياطي إلى مزوّدين آخرين.          |
| `fail`              | تخطَّ محاولة ذلك المزوّد مع `reasonCode: "not_configured"` و`personaBinding: "missing"`. لا تزال مزوّدات الرجوع الاحتياطي تُجرّب.          |

يفشل طلب TTS الكامل فقط عندما يتم تخطي **كل** مزوّد تمت محاولته
أو يفشل.

## توجيهات يقودها النموذج

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
الصوت. يزيل تسليم الكتل المتدفقة التوجيهات من النص المرئي قبل أن
تراها القناة، حتى عند تقسيمها عبر كتل متجاورة.

يتم تجاهل `provider=...` ما لم تكن `modelOverrides.allowProvider: true`. عندما
يعلن رد `provider=...`، يتم تحليل المفاتيح الأخرى في ذلك التوجيه
بواسطة ذلك المزوّد فقط؛ وتُزال المفاتيح غير المدعومة ويُبلّغ عنها كتحذيرات
توجيه TTS.

**مفاتيح التوجيه المتاحة:**

- `provider` (معرّف مزوّد مسجّل؛ يتطلب `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (حجم MiniMax، من 0 إلى 10)
- `pitch` (درجة MiniMax كعدد صحيح، من −12 إلى 12؛ تُقتطع القيم الكسرية)
- `emotion` (وسم العاطفة في Volcengine)
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

أمر واحد `/tts`. على Discord، يسجّل OpenClaw أيضًا `/voice` لأن
`/tts` أمر Discord مدمج — ويظل النص `/tts ...` يعمل.

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
تتطلب الأوامر مرسلًا مخولًا (تنطبق قواعد قائمة السماح/المالك) وإما
تمكين `commands.text` أو تسجيل الأوامر الأصلية.
</Note>

ملاحظات السلوك:

- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتبه `/tts off` إلى `off`.
- يكتب `/tts chat on|off|default` تجاوز TTS تلقائيًا مقيّدًا بالجلسة للدردشة الحالية.
- يكتب `/tts persona <id>` تفضيل الشخصية المحلي؛ ويمسحه `/tts persona off`.
- يقرأ `/tts latest` أحدث رد من المساعد من نص الجلسة الحالية ويرسله كصوت مرة واحدة. يخزن فقط تجزئة ذلك الرد في إدخال الجلسة لمنع إرسال صوت مكرر.
- ينشئ `/tts audio` ردًا صوتيًا لمرة واحدة (لا يفعّل TTS).
- يُخزّن `limit` و`summary` في **التفضيلات المحلية**، وليس في التكوين الرئيسي.
- يتضمن `/tts status` تشخيصات الرجوع الاحتياطي لأحدث محاولة — `Fallback: <primary> -> <used>`، و`Attempts: ...`، وتفاصيل كل محاولة (`provider:outcome(reasonCode) latency`).
- يعرض `/status` وضع TTS النشط بالإضافة إلى المزوّد والنموذج والصوت وبيانات تعريف نقطة النهاية المخصصة بعد تنقيتها عندما يكون TTS مفعّلًا.

## تفضيلات لكل مستخدم

تكتب أوامر الشرطة المائلة التجاوزات المحلية إلى `prefsPath`. الافتراضي هو
`~/.openclaw/settings/tts.json`؛ ويمكن تجاوزه بمتغير البيئة `OPENCLAW_TTS_PREFS`
أو `messages.tts.prefsPath`.

| الحقل المخزّن | التأثير                                      |
| ------------ | -------------------------------------------- |
| `auto`       | تجاوز TTS التلقائي المحلي (`always`, `off`, …) |
| `provider`   | تجاوز المزوّد الأساسي المحلي                 |
| `persona`    | تجاوز الشخصية المحلي                         |
| `maxLength`  | عتبة الملخص (الافتراضي `1500` حرفًا)         |
| `summarize`  | مفتاح تشغيل الملخص (الافتراضي `true`)        |

تتجاوز هذه التكوين الفعلي من `messages.tts` بالإضافة إلى كتلة
`agents.list[].tts` النشطة لذلك المضيف.

## صيغ الإخراج (ثابتة)

يعتمد تسليم صوت TTS على إمكانات القناة. تعلن Plugins القنوات
ما إذا كان ينبغي لـ TTS بنمط الصوت أن يطلب من المزوّدين هدف `voice-note` أصليًا أو
يبقي توليف `audio-file` العادي ويضع علامة فقط على الإخراج المتوافق للتسليم
الصوتي.

- **القنوات الداعمة للملاحظات الصوتية**: تفضّل ردود الملاحظات الصوتية Opus (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - 48kHz / 64kbps هو توازن جيد للرسائل الصوتية.
- **Feishu / WhatsApp**: عندما يُنتج رد ملاحظة صوتية بصيغة MP3/WebM/WAV/M4A
  أو ملف صوتي آخر محتمل، يحوّل Plugin القناة ترميزه إلى Ogg/Opus بتردد 48kHz
  باستخدام `ffmpeg` قبل إرسال الرسالة الصوتية الأصلية. يرسل WhatsApp
  الناتج عبر حمولة Baileys `audio` مع `ptt: true` و
  `audio/ogg; codecs=opus`. إذا فشل التحويل، يتلقى Feishu الملف الأصلي
  كمرفق؛ ويفشل إرسال WhatsApp بدلا من نشر حمولة PTT غير متوافقة.
- **BlueBubbles**: يُبقي توليف المزوّد على مسار ملف الصوت العادي؛ وتُوسم مخرجات MP3
  وCAF لتسليمها كمذكرة صوتية في iMessage.
- **القنوات الأخرى**: MP3 (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - 44.1kHz / 128kbps هو التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: MP3 (نموذج `speech-2.8-hd`، ومعدل عينة 32kHz) لمرفقات الصوت العادية. بالنسبة إلى أهداف الملاحظات الصوتية التي تعلنها القناة، يحوّل OpenClaw ملف MiniMax MP3 إلى Opus بتردد 48kHz باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم تحويل الترميز.
- **Xiaomi MiMo**: MP3 افتراضيا، أو WAV عند تهيئته. بالنسبة إلى أهداف الملاحظات الصوتية التي تعلنها القناة، يحوّل OpenClaw مخرجات Xiaomi إلى Opus بتردد 48kHz باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم تحويل الترميز.
- **CLI المحلي**: يستخدم `outputFormat` المهيأ. تُحوّل أهداف الملاحظات الصوتية
  إلى Ogg/Opus، وتُحوّل مخرجات الهاتفية إلى PCM أحادي خام بتردد 16 kHz
  باستخدام `ffmpeg`.
- **Google Gemini**: تعيد Gemini API TTS بيانات PCM خام بتردد 24kHz. يغلّفها OpenClaw بصيغة WAV لمرفقات الصوت، ويحوّل ترميزها إلى Opus بتردد 48kHz لأهداف الملاحظات الصوتية، ويعيد PCM مباشرة لـ Talk/الهاتفية.
- **Gradium**: WAV لمرفقات الصوت، وOpus لأهداف الملاحظات الصوتية، و`ulaw_8000` بتردد 8 kHz للهاتفية.
- **Inworld**: MP3 لمرفقات الصوت العادية، و`OGG_OPUS` أصلي لأهداف الملاحظات الصوتية، و`PCM` خام بتردد 22050 Hz لـ Talk/الهاتفية.
- **xAI**: MP3 افتراضيا؛ يمكن أن يكون `responseFormat` هو `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. يستخدم OpenClaw نقطة نهاية xAI المجمّعة REST TTS ويعيد مرفق صوت كاملا؛ ولا يستخدم مسار المزوّد هذا WebSocket الخاص ببث TTS من xAI. لا يدعم هذا المسار صيغة Opus الأصلية للملاحظات الصوتية.
- **Microsoft**: يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل النقل المضمّن `outputFormat`، لكن ليست كل الصيغ متاحة من الخدمة.
  - تتبع قيم صيغة الإخراج صيغ إخراج Microsoft Speech (بما في ذلك Ogg/WebM Opus).
  - يقبل Telegram `sendVoice` OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج
    إلى رسائل صوتية مضمونة بصيغة Opus.
  - إذا فشلت صيغة إخراج Microsoft المهيأة، يعيد OpenClaw المحاولة باستخدام MP3.

صيغ إخراج OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك TTS التلقائي

عند تفعيل `messages.tts.auto`، يقوم OpenClaw بما يلي:

- يتخطى TTS إذا كان الرد يحتوي بالفعل على وسائط أو توجيه `MEDIA:`.
- يتخطى الردود القصيرة جدا (أقل من 10 أحرف).
- يلخص الردود الطويلة عند تفعيل الملخصات، باستخدام
  `summaryModel` (أو `agents.defaults.model.primary`).
- يرفق الصوت المولّد بالرد.
- في `mode: "final"`، يظل يرسل TTS صوتيا فقط للردود النهائية المتدفقة
  بعد اكتمال تدفق النص؛ تمر الوسائط المولّدة عبر تسوية وسائط القناة نفسها
  مثل مرفقات الرد العادية.

إذا تجاوز الرد `maxLength` وكان الملخص متوقفا (أو لا يوجد مفتاح API لنموذج
الملخص)، يُتخطى الصوت ويُرسل الرد النصي العادي.

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

## صيغ الإخراج حسب القناة

  | الهدف                                 | التنسيق                                                                                                                               |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | تفضّل ردود الملاحظات الصوتية **Opus** (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI). يوازن 48 kHz / 64 kbps بين الوضوح والحجم. |
  | القنوات الأخرى                        | **MP3** (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI). الإعداد الافتراضي للكلام هو 44.1 kHz / 128 kbps.                           |
  | Talk / الاتصالات الهاتفية             | **PCM** أصلي من المزوّد (Inworld 22050 Hz، وGoogle 24 kHz)، أو `ulaw_8000` من Gradium للاتصالات الهاتفية.                             |

  ملاحظات حسب المزوّد:

  - **تحويل ترميز Feishu / WhatsApp:** عندما يصل رد ملاحظة صوتية بتنسيق MP3/WebM/WAV/M4A، يحوّل Plugin القناة الترميز إلى 48 kHz Ogg/Opus باستخدام `ffmpeg`. يرسل WhatsApp عبر Baileys مع `ptt: true` و`audio/ogg; codecs=opus`. إذا فشل التحويل: يعود Feishu إلى إرفاق الملف الأصلي؛ ويفشل إرسال WhatsApp بدلا من نشر حمولة PTT غير متوافقة.
  - **MiniMax / Xiaomi MiMo:** MP3 افتراضي (32 kHz لـ MiniMax `speech-2.8-hd`)؛ يحوّل إلى 48 kHz Opus لأهداف الملاحظات الصوتية عبر `ffmpeg`.
  - **CLI المحلية:** تستخدم `outputFormat` المكوّن. تُحوّل أهداف الملاحظات الصوتية إلى Ogg/Opus ومخرجات الاتصالات الهاتفية إلى PCM أحادي خام بتردد 16 kHz.
  - **Google Gemini:** يعيد PCM خاما بتردد 24 kHz. يغلّفه OpenClaw كـ WAV للمرفقات، ويحوّله إلى 48 kHz Opus لأهداف الملاحظات الصوتية، ويعيد PCM مباشرة لـ Talk/الاتصالات الهاتفية.
  - **Inworld:** مرفقات MP3، وملاحظة صوتية أصلية `OGG_OPUS`، و`PCM` خام بتردد 22050 Hz لـ Talk/الاتصالات الهاتفية.
  - **xAI:** MP3 افتراضيا؛ يمكن أن يكون `responseFormat` هو `mp3|wav|pcm|mulaw|alaw`. يستخدم نقطة نهاية REST الدفعية الخاصة بـ xAI — لا يُستخدم TTS المتدفق عبر WebSocket. تنسيق ملاحظات صوتية Opus الأصلي **غير** مدعوم.
  - **Microsoft:** يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`). يقبل `sendVoice` في Telegram تنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج إلى رسائل صوتية Opus مضمونة. إذا فشل تنسيق Microsoft المكوّن، يعيد OpenClaw المحاولة باستخدام MP3.

  تنسيقات مخرجات OpenAI وElevenLabs ثابتة لكل قناة كما هو مذكور أعلاه.

  ## مرجع الحقول

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      وضع Auto-TTS. يرسل `inbound` الصوت فقط بعد رسالة صوتية واردة؛ ويرسل `tagged` الصوت فقط عندما يتضمن الرد توجيهات `[[tts:...]]` أو كتلة `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      مفتاح تبديل قديم. يرحّل `openclaw doctor --fix` هذا إلى `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      يتضمن `"all"` ردود الأدوات/الكتل إضافة إلى الردود النهائية.
    </ParamField>
    <ParamField path="provider" type="string">
      معرّف مزوّد الكلام. عند عدم ضبطه، يستخدم OpenClaw أول مزوّد مكوّن في ترتيب الاختيار التلقائي للسجل. يعاد كتابة `provider: "edge"` القديم إلى `"microsoft"` بواسطة `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      معرّف الشخصية النشطة من `personas`. يُطبّع إلى أحرف صغيرة.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هوية منطوقة ثابتة. الحقول: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. راجع [الشخصيات](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      نموذج رخيص للملخص التلقائي؛ القيمة الافتراضية هي `agents.defaults.model.primary`. يقبل `provider/model` أو اسما مستعارا لنموذج مكوّن.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      اسمح للنموذج بإصدار توجيهات TTS. القيمة الافتراضية لـ `enabled` هي `true`؛ والقيمة الافتراضية لـ `allowProvider` هي `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      إعدادات مملوكة للمزوّد ومفهرسة حسب معرّف مزوّد الكلام. يعاد كتابة الكتل المباشرة القديمة (`messages.tts.openai`، و`.elevenlabs`، و`.microsoft`، و`.edge`) بواسطة `openclaw doctor --fix`؛ لا تلتزم إلا بـ `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      حد أقصى صارم لأحرف إدخال TTS. يفشل `/tts audio` إذا تم تجاوزه.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      مهلة الطلب بالمللي ثانية.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      تجاوز مسار JSON للتفضيلات المحلية (المزوّد/الحد/الملخص). الافتراضي `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`، أو `AZURE_SPEECH_API_KEY`، أو `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقة Azure Speech (مثلا `eastus`). Env: `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">تجاوز اختياري لنقطة نهاية Azure Speech (الاسم المستعار `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName لصوت Azure. الافتراضي `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">رمز لغة SSML. الافتراضي `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` من Azure للصوت القياسي. الافتراضي `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` من Azure لمخرجات الملاحظات الصوتية. الافتراضي `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">يعود إلى `ELEVENLABS_API_KEY` أو `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف النموذج (مثلا `eleven_multilingual_v2`، و`eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">معرّف صوت ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، و`similarityBoost`، و`style` (كل منها `0..1`)، و`useSpeakerBoost` (`true|false`)، و`speed` (`0.5..2.0`، و`1.0` = عادي).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>وضع تطبيع النص.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 من حرفين (مثلا `en`، و`de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحيح `0..4294967295` لحتمية بأفضل جهد.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز عنوان URL الأساسي لـ ElevenLabs API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">يعود إلى `GEMINI_API_KEY` / `GOOGLE_API_KEY`. إذا حُذف، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل الرجوع إلى Env.</ParamField>
    <ParamField path="model" type="string">نموذج Gemini TTS. الافتراضي `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">اسم صوت Gemini الجاهز. الافتراضي `Kore`. الاسم المستعار: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">مطالبة بأسلوب لغة طبيعية تُضاف قبل النص المنطوق.</ParamField>
    <ParamField path="speakerName" type="string">تسمية اختيارية للمتحدث تُضاف قبل النص المنطوق عندما تستخدم مطالبتك متحدثا مسمى.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>اضبطه على `audio-profile-v1` لتغليف حقول مطالبة الشخصية النشطة في بنية مطالبة Gemini TTS حتمية.</ParamField>
    <ParamField path="personaPrompt" type="string">نص مطالبة شخصية إضافي خاص بـ Google يُلحق بملاحظات المخرج في القالب.</ParamField>
    <ParamField path="baseUrl" type="string">لا يُقبل إلا `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">متغير البيئة: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">متغير البيئة: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">الافتراضي `inworld-tts-1.5-max`. أيضًا: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">درجة حرارة أخذ العينات `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">ملف تنفيذي محلي أو سلسلة أمر لـ TTS عبر CLI.</ParamField>
    <ParamField path="args" type="string[]">وسيطات الأمر. تدعم العناصر النائبة `{{Text}}` و`{{OutputPath}}` و`{{OutputDir}}` و`{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>تنسيق خرج CLI المتوقع. الافتراضي `mp3` لمرفقات الصوت.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلة الأمر بالمللي ثانية. الافتراضي `120000`.</ParamField>
    <ParamField path="cwd" type="string">دليل العمل الاختياري للأمر.</ParamField>
    <ParamField path="env" type="Record<string, string>">تجاوزات البيئة الاختيارية للأمر.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">السماح باستخدام كلام Microsoft.</ParamField>
    <ParamField path="voice" type="string">اسم الصوت العصبي من Microsoft (مثل `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">رمز اللغة (مثل `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">تنسيق خرج Microsoft. الافتراضي `audio-24khz-48kbitrate-mono-mp3`. لا تدعم وسيلة النقل المضمنة المدعومة من Edge كل التنسيقات.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">سلاسل نسب مئوية (مثل `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">اكتب ترجمات JSON بجانب ملف الصوت.</ParamField>
    <ParamField path="proxy" type="string">عنوان URL للوكيل لطلبات كلام Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">تجاوز مهلة الطلب (مللي ثانية).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>اسم مستعار قديم. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">يستخدم احتياطيًا `MINIMAX_API_KEY`. مصادقة Token Plan عبر `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.minimax.io`. متغير البيئة: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `speech-2.8-hd`. متغير البيئة: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `English_expressive_narrator`. متغير البيئة: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. الافتراضي `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. الافتراضي `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحيح `-12..12`. الافتراضي `0`. تُقتطع القيم الكسرية قبل الطلب.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">يستخدم احتياطيًا `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف نموذج TTS من OpenAI (مثل `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">اسم الصوت (مثل `alloy`، `cedar`).</ParamField>
    <ParamField path="instructions" type="string">حقل OpenAI `instructions` الصريح. عند ضبطه، لا تُربط حقول مطالبة الشخصية تلقائيًا.</ParamField>
    <ParamField path="baseUrl" type="string">
      تجاوز نقطة نهاية TTS الخاصة بـ OpenAI. ترتيب الحل: الإعدادات → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. تُعامل القيم غير الافتراضية كنقاط نهاية TTS متوافقة مع OpenAI، لذلك تُقبل أسماء النماذج والأصوات المخصصة.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">متغير البيئة: `OPENROUTER_API_KEY`. يمكن إعادة استخدام `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://openrouter.ai/api/v1`. يُطبّع العنوان القديم `https://openrouter.ai/v1`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `hexgrad/kokoro-82m`. الاسم المستعار: `modelId`.</ParamField>
    <ParamField path="voice" type="string">الافتراضي `af_alloy`. الاسم المستعار: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>الافتراضي `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي لدى المزوّد.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">متغير البيئة: `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">الافتراضي `seed-tts-1.0`. متغير البيئة: `VOLCENGINE_TTS_RESOURCE_ID`. استخدم `seed-tts-2.0` عندما يكون لمشروعك استحقاق TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ترويسة مفتاح التطبيق. الافتراضي `aGjiRDfUWi`. متغير البيئة: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز نقطة نهاية HTTP لـ Seed Speech TTS. متغير البيئة: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع الصوت. الافتراضي `en_female_anna_mars_bigtts`. متغير البيئة: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبة السرعة الأصلية لدى المزوّد.</ParamField>
    <ParamField path="emotion" type="string">وسم العاطفة الأصلي لدى المزوّد.</ParamField>
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
    <ParamField path="style" type="string">تعليمة اختيارية للأسلوب باللغة الطبيعية تُرسل كرسالة المستخدم؛ لا تُنطق.</ParamField>
  </Accordion>
</AccordionGroup>

## أداة الوكيل

تحوّل أداة `tts` النص إلى كلام وتُرجع مرفقًا صوتيًا لتسليم
الرد. على Feishu وMatrix وTelegram وWhatsApp، يُسلَّم الصوت
كرسالة صوتية بدلًا من مرفق ملف. يستطيع Feishu وWhatsApp
تحويل خرج TTS غير Opus على هذا المسار عندما يكون `ffmpeg`
متاحًا.

يرسل WhatsApp الصوت عبر Baileys كملاحظة صوتية PTT (`audio` مع
`ptt: true`) ويرسل النص المرئي **بشكل منفصل** عن صوت PTT لأن
العملاء لا يعرضون التسميات التوضيحية على الملاحظات الصوتية بشكل متسق.

تقبل الأداة الحقلين الاختياريين `channel` و`timeoutMs`؛ ويكون `timeoutMs`
مهلة طلب المزوّد لكل استدعاء بالمللي ثانية.

## Gateway RPC

| الطريقة            | الغرض                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | قراءة حالة TTS الحالية وآخر محاولة. |
| `tts.enable`      | ضبط تفضيل التشغيل التلقائي المحلي إلى `always`.   |
| `tts.disable`     | ضبط تفضيل التشغيل التلقائي المحلي إلى `off`.      |
| `tts.convert`     | تحويل نص لمرة واحدة → صوت.                    |
| `tts.setProvider` | ضبط تفضيل المزوّد المحلي.           |
| `tts.setPersona`  | ضبط تفضيل الشخصية المحلي.            |
| `tts.providers`   | سرد المزوّدين المهيّئين والحالة.    |

## روابط الخدمة

- [دليل تحويل النص إلى كلام في OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع واجهة Audio API في OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام عبر Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [مزوّد Azure Speech](/ar/providers/azure-speech)
- [تحويل النص إلى كلام في ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [المصادقة في ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ar/providers/gradium)
- [واجهة Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [واجهة MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [واجهة Volcengine TTS HTTP API](/ar/providers/volcengine#text-to-speech)
- [تركيب الكلام في Xiaomi MiMo](/ar/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات خرج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تحويل النص إلى كلام في xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ذات صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
- [أوامر Slash](/ar/tools/slash-commands)
- [Plugin المكالمة الصوتية](/ar/plugins/voice-call)
