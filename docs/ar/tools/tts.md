---
read_when:
    - تمكين تحويل النص إلى كلام للردود
    - تهيئة مزوّد TTS، أو سلسلة الرجوع الاحتياطي، أو الشخصية
    - استخدام أوامر أو توجيهات `/tts`
sidebarTitle: Text to speech (TTS)
summary: تحويل النص إلى كلام للردود الصادرة — المزوّدون، والشخصيات، وأوامر الشرطة المائلة، والإخراج لكل قناة
title: تحويل النص إلى كلام
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:42:39Z"
  model: gpt-5.4
  provider: openai
  source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
  source_path: tools/tts.md
  workflow: 15
---

يمكن لـ OpenClaw تحويل الردود الصادرة إلى صوت عبر **13 مزوّدًا للكلام**
وإرسال رسائل صوتية أصلية على Feishu وMatrix وTelegram وWhatsApp،
ومرفقات صوتية في كل مكان آخر، وتدفقات PCM/Ulaw للهاتف وTalk.

## البدء السريع

<Steps>
  <Step title="اختر مزوّدًا">
    يُعد OpenAI وElevenLabs الخيارين المستضافين الأكثر موثوقية. يعمل Microsoft و
    Local CLI من دون مفتاح API. راجع [مصفوفة المزوّدين](#supported-providers)
    للاطلاع على القائمة الكاملة.
  </Step>
  <Step title="عيّن مفتاح API">
    صدّر متغير البيئة الخاص بمزوّدك (على سبيل المثال `OPENAI_API_KEY`،
    أو `ELEVENLABS_API_KEY`). لا يحتاج Microsoft وLocal CLI إلى مفتاح.
  </Step>
  <Step title="فعّله في الإعدادات">
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
    يعرض `/tts status` الحالة الحالية. ويرسل `/tts audio Hello from OpenClaw`
    ردًا صوتيًا لمرة واحدة.
  </Step>
</Steps>

<Note>
يكون Auto-TTS **معطّلًا** افتراضيًا. وعندما لا يكون `messages.tts.provider` معيّنًا،
يختار OpenClaw أول مزوّد مُهيّأ وفق ترتيب الاختيار التلقائي في السجل.
</Note>

## المزوّدون المدعومون

| المزوّد            | المصادقة                                                                                                            | ملاحظات                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Azure Speech**   | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (وأيضًا `AZURE_SPEECH_API_KEY` و`SPEECH_KEY` و`SPEECH_REGION`)           | إخراج مذكرات صوتية أصلية بصيغة Ogg/Opus والهاتف.                         |
| **ElevenLabs**     | `ELEVENLABS_API_KEY` أو `XI_API_KEY`                                                                                 | استنساخ الأصوات، ومتعدد اللغات، وحتمي عبر `seed`.                        |
| **Google Gemini**  | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                                                                                 | TTS لـ Gemini API؛ يدعم الشخصيات عبر `promptTemplate: "audio-profile-v1"`. |
| **Gradium**        | `GRADIUM_API_KEY`                                                                                                    | إخراج مذكرات صوتية والهاتف.                                              |
| **Inworld**        | `INWORLD_API_KEY`                                                                                                    | Streaming TTS API. إخراج مذكرات صوتية أصلية Opus وهاتف PCM.              |
| **Local CLI**      | لا شيء                                                                                                               | يشغّل أمر TTS محليًا مضبوطًا.                                            |
| **Microsoft**      | لا شيء                                                                                                               | Edge neural TTS العام عبر `node-edge-tts`. أفضل جهد، بلا SLA.            |
| **MiniMax**        | `MINIMAX_API_KEY` (أو Token Plan: `MINIMAX_OAUTH_TOKEN` و`MINIMAX_CODE_PLAN_KEY` و`MINIMAX_CODING_API_KEY`)         | API ‏T2A v2. القيمة الافتراضية `speech-2.8-hd`.                          |
| **OpenAI**         | `OPENAI_API_KEY`                                                                                                     | يُستخدم أيضًا للتلخيص التلقائي؛ ويدعم `instructions` للشخصية.            |
| **OpenRouter**     | `OPENROUTER_API_KEY` (يمكنه إعادة استخدام `models.providers.openrouter.apiKey`)                                      | النموذج الافتراضي `hexgrad/kokoro-82m`.                                  |
| **Volcengine**     | `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token قديمان: `VOLCENGINE_TTS_APPID`/`_TOKEN`)    | BytePlus Seed Speech HTTP API.                                            |
| **Vydra**          | `VYDRA_API_KEY`                                                                                                      | مزوّد مشترك للصور والفيديو والكلام.                                       |
| **xAI**            | `XAI_API_KEY`                                                                                                        | TTS دفعي من xAI. لا يدعم مذكرة صوتية أصلية Opus **غير** مدعوم.           |
| **Xiaomi MiMo**    | `XIAOMI_API_KEY`                                                                                                     | MiMo TTS عبر Xiaomi chat completions.                                     |

إذا جرى تهيئة عدة مزوّدين، فسيُستخدم المزوّد المحدد أولًا وتكون
البقية خيارات رجوع احتياطي. يستخدم التلخيص التلقائي `summaryModel` (أو
`agents.defaults.model.primary`)، لذا يجب أيضًا أن يكون ذلك المزوّد موثَّقًا
إذا أبقيت التلخيصات مفعّلة.

<Warning>
يستخدم مزوّد **Microsoft** المضمّن خدمة neural TTS عبر الإنترنت من Microsoft Edge
عبر `node-edge-tts`. وهي خدمة ويب عامة بلا
SLA أو حصة منشورة — لذا تعامل معها على أنها خدمة بأفضل جهد. يُطبَّع
معرّف المزوّد القديم `edge` إلى `microsoft` ويعيد `openclaw doctor --fix` كتابة
الإعدادات المخزنة؛ ويجب أن تستخدم الإعدادات الجديدة دائمًا `microsoft`.
</Warning>

## الإعدادات

توجد إعدادات TTS تحت `messages.tts` في `~/.openclaw/openclaw.json`. اختر
إعدادًا مسبقًا وكيّف كتلة المزوّد:

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
          // مطالبات أسلوبية اختيارية بلغة طبيعية:
          // audioProfile: "تحدث بنبرة هادئة مثل مقدّم بودكاست.",
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
  <Tab title="Microsoft (من دون مفتاح)">
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

استخدم `agents.list[].tts` عندما يجب أن يتكلم وكيل واحد بمزوّد مختلف،
أو صوت مختلف، أو نموذج مختلف، أو شخصية مختلفة، أو وضع Auto-TTS مختلف. تقوم كتلة الوكيل
بدمج عميق فوق `messages.tts`، لذا يمكن أن تبقى بيانات اعتماد المزوّد
في إعدادات المزوّد العامة:

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

لتثبيت شخصية لكل وكيل، اضبط `agents.list[].tts.persona` إلى جانب إعدادات المزوّد
— فهي تتجاوز `messages.tts.persona` العامة لذلك الوكيل فقط.

ترتيب الأولوية للردود التلقائية، و`/tts audio`، و`/tts status`، وأداة الوكيل `tts` هو:

1. `messages.tts`
2. القيمة النشطة `agents.list[].tts`
3. تجاوز القناة، عندما تدعم القناة `channels.<channel>.tts`
4. تجاوز الحساب، عندما تمرر القناة `channels.<channel>.accounts.<id>.tts`
5. تفضيلات `/tts` المحلية لهذا المضيف
6. توجيهات `[[tts:...]]` المضمنة عندما تكون [تجاوزات النموذج](#model-driven-directives) مفعّلة

تستخدم تجاوزات القناة والحساب البنية نفسها المستخدمة في `messages.tts` وتُدمَج
بشكل عميق فوق الطبقات السابقة، لذلك يمكن أن تبقى بيانات اعتماد المزوّد المشتركة في
`messages.tts` بينما تغيّر القناة أو حساب البوت الصوت فقط، أو النموذج، أو الشخصية،
أو وضع التشغيل التلقائي:

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

**الشخصية** هي هوية صوتية ثابتة يمكن تطبيقها بشكل حتمي
عبر المزوّدين. ويمكنها تفضيل مزوّد واحد، وتعريف نية prompt محايدة للمزوّد،
وحمل روابط خاصة بالمزوّد للأصوات، والنماذج، وقوالب prompt،
والبذور، وإعدادات الصوت.

### شخصية دنيا

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

### شخصية كاملة (prompt محايد للمزوّد)

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

تُحدَّد الشخصية النشطة بشكل حتمي:

1. التفضيل المحلي `/tts persona <id>`، إذا كان معيّنًا.
2. `messages.tts.persona`، إذا كانت معيّنة.
3. بدون شخصية.

يعمل اختيار المزوّد وفق مبدأ الصريح أولًا:

1. التجاوزات المباشرة (CLI، وGateway، وTalk، وتوجيهات TTS المسموح بها).
2. التفضيل المحلي `/tts provider <id>`.
3. `provider` في الشخصية النشطة.
4. `messages.tts.provider`.
5. الاختيار التلقائي من السجل.

لكل محاولة مزوّد، يدمج OpenClaw الإعدادات بهذا الترتيب:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. تجاوزات الطلب الموثوق
4. تجاوزات توجيهات TTS الصادرة من النموذج والمسموح بها

### كيف يستخدم المزوّدون مطالبات الشخصية

حقول prompt الخاصة بالشخصية (`profile`، و`scene`، و`sampleContext`، و`style`، و`accent`،
و`pacing`، و`constraints`) **محايدة بالنسبة إلى المزوّد**. يقرّر كل مزوّد كيف
يستخدمها:

<AccordionGroup>
  <Accordion title="Google Gemini">
    يغلّف حقول prompt الخاصة بالشخصية داخل بنية prompt لـ Gemini TTS **فقط عندما**
    يعيّن إعداد مزوّد Google الفعّال `promptTemplate: "audio-profile-v1"`
    أو `personaPrompt`. وما تزال الحقول الأقدم `audioProfile` و`speakerName`
    تُسبق كنص prompt خاص بـ Google. وتحافظ وسوم الصوت المضمنة مثل
    `[whispers]` أو `[laughs]` داخل كتلة `[[tts:text]]` على وجودها
    داخل نص Gemini المنسوخ؛ ولا يولّد OpenClaw هذه الوسوم.
  </Accordion>
  <Accordion title="OpenAI">
    يربط حقول prompt الخاصة بالشخصية بحقل `instructions` في الطلب **فقط عندما**
    لا تكون `instructions` صريحة لـ OpenAI مهيأة. تفوز `instructions`
    الصريحة دائمًا.
  </Accordion>
  <Accordion title="مزودون آخرون">
    يستخدمون فقط الروابط الخاصة بالمزوّد ضمن
    `personas.<id>.providers.<provider>`. وتُتجاهل حقول prompt الخاصة بالشخصية
    ما لم يطبّق المزوّد ربط prompt الشخصية الخاص به.
  </Accordion>
</AccordionGroup>

### سياسة الرجوع الاحتياطي

تتحكم `fallbackPolicy` في السلوك عندما لا تكون للشخصية **أي رابطة** مع
المزوّد الجاري تجربته:

| السياسة              | السلوك                                                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **الافتراضي.** تبقى حقول prompt المحايدة للمزوّد متاحة؛ وقد يستخدمها المزوّد أو يتجاهلها.                                                     |
| `provider-defaults` | تُحذف الشخصية من إعداد prompt لتلك المحاولة؛ ويستخدم المزوّد إعداداته المحايدة الافتراضية بينما يستمر الرجوع الاحتياطي إلى مزوّدين آخرين.       |
| `fail`              | يتجاوز تلك المحاولة للمزوّد مع `reasonCode: "not_configured"` و`personaBinding: "missing"`. وما تزال مزوّدات الرجوع الاحتياطي الأخرى تُجرَّب.     |

لا يفشل طلب TTS كاملًا إلا عندما تُتجاوز **كل** محاولات المزوّدين
أو تفشل.

## التوجيهات المعتمدة على النموذج

افتراضيًا، **يمكن** للمساعد إصدار توجيهات `[[tts:...]]` لتجاوز
الصوت، أو النموذج، أو السرعة في رد واحد فقط، بالإضافة إلى
كتلة اختيارية `[[tts:text]]...[[/tts:text]]` للتلميحات التعبيرية التي
يجب أن تظهر في الصوت فقط:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

عندما تكون قيمة `messages.tts.auto` هي `"tagged"`، تكون **التوجيهات مطلوبة**
لتفعيل الصوت. ويؤدي تسليم الكتل المتدفقة إلى إزالة التوجيهات من النص المرئي قبل أن تراها القناة، حتى عندما تكون موزعة على كتل متجاورة.

يُتجاهل `provider=...` ما لم تكن `modelOverrides.allowProvider: true`. وعندما
يصرّح الرد بـ `provider=...`، تُحلَّل المفاتيح الأخرى في ذلك التوجيه
بواسطة ذلك المزوّد فقط؛ وتُزال المفاتيح غير المدعومة ويُبلَّغ عنها كتحذيرات
لتوجيهات TTS.

**مفاتيح التوجيه المتاحة:**

- `provider` (معرّف مزوّد مسجّل؛ يتطلب `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`، و`similarityBoost`، و`style`، و`speed`، و`useSpeakerBoost`
- `vol` / `volume` (مستوى صوت MiniMax، من 0 إلى 10)
- `pitch` (درجة MiniMax الصحيحة، من −12 إلى 12؛ وتُقتطع القيم الكسرية)
- `emotion` (وسم العاطفة في Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**تعطيل تجاوزات النموذج بالكامل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**السماح بتبديل المزوّد مع إبقاء المقابض الأخرى قابلة للتهيئة:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## أوامر الشرطة المائلة

أمر واحد: `/tts`. وعلى Discord، يسجّل OpenClaw أيضًا `/voice` لأن
`/tts` هو أمر Discord مضمّن — وما يزال النص `/tts ...` يعمل.

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
تتطلب الأوامر مرسلًا مصرّحًا له (تنطبق قواعد allowlist/المالك) ويجب أيضًا
أن تكون `commands.text` أو تسجيل الأوامر الأصلية مفعّلًا.
</Note>

ملاحظات السلوك:

- يكتب `/tts on` تفضيل TTS المحلي بالقيمة `always`؛ ويكتب `/tts off` القيمة `off`.
- يكتب `/tts chat on|off|default` تجاوز Auto-TTS على مستوى الجلسة للدردشة الحالية.
- يكتب `/tts persona <id>` تفضيل الشخصية المحلي؛ ويمسح `/tts persona off` هذا التفضيل.
- يقرأ `/tts latest` أحدث رد للمساعد من نص الجلسة المنسوخ الحالي ويرسله صوتًا مرة واحدة. ولا يخزن إلا hash لذلك الرد في إدخال الجلسة لمنع الإرسال الصوتي المكرر.
- يولّد `/tts audio` ردًا صوتيًا لمرة واحدة (ولا **يفعّل** TTS).
- تُخزَّن `limit` و`summary` في **التفضيلات المحلية**، وليس في الإعدادات الرئيسية.
- يتضمن `/tts status` تشخيصات الرجوع الاحتياطي لأحدث محاولة — `Fallback: <primary> -> <used>`، و`Attempts: ...`، وتفاصيل كل محاولة (`provider:outcome(reasonCode) latency`).
- يعرض `/status` وضع TTS النشط بالإضافة إلى المزوّد، والنموذج، والصوت، وبيانات تعريف نقطة النهاية المخصصة المنقّحة عندما يكون TTS مفعّلًا.

## التفضيلات لكل مستخدم

تكتب أوامر الشرطة المائلة التجاوزات المحلية إلى `prefsPath`. والقيمة الافتراضية هي
`~/.openclaw/settings/tts.json`؛ ويمكن تجاوزها عبر متغير البيئة `OPENCLAW_TTS_PREFS`
أو `messages.tts.prefsPath`.

| الحقل المخزن | التأثير                                      |
| ------------ | -------------------------------------------- |
| `auto`       | تجاوز Auto-TTS المحلي (`always`، `off`، …)   |
| `provider`   | تجاوز المزوّد الأساسي المحلي                 |
| `persona`    | تجاوز الشخصية المحلي                         |
| `maxLength`  | عتبة التلخيص (الافتراضي `1500` حرفًا)        |
| `summarize`  | مفتاح التلخيص (الافتراضي `true`)             |

تتجاوز هذه القيم الإعدادات الفعّالة من `messages.tts` بالإضافة إلى
كتلة `agents.list[].tts` النشطة لذلك المضيف.

## تنسيقات الإخراج (ثابتة)

يعتمد تسليم صوت TTS على قدرات القناة. تعلن Plugins القنوات
ما إذا كان TTS بأسلوب الصوت يجب أن يطلب من المزوّدين هدف `voice-note` أصليًا أو
أن يحتفظ بتوليد `audio-file` العادي ويكتفي بوسم الإخراج المتوافق لتسليم
الصوت.

- **القنوات القادرة على voice-note**: تفضّل ردود voice-note تنسيق Opus (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI).
  - يُعد 48 كيلوهرتز / 64 كيلوبت/ثانية توازنًا جيدًا لرسائل الصوت.
- **Feishu / WhatsApp**: عندما يُنتج رد voice-note بصيغة MP3/WebM/WAV/M4A
  أو أي ملف صوتي محتمل آخر، يقوم Plugin القناة بتحويله ترميزيًا إلى 48 كيلوهرتز
  Ogg/Opus باستخدام `ffmpeg` قبل إرسال الرسالة الصوتية الأصلية. يرسل WhatsApp
  النتيجة عبر حمولة `audio` في Baileys مع `ptt: true` و
  `audio/ogg; codecs=opus`. وإذا فشل التحويل، يتلقى Feishu
  الملف الأصلي كمرفق؛ أما إرسال WhatsApp فيفشل بدلًا من نشر
  حمولة PTT غير متوافقة.
- **BlueBubbles**: يُبقي توليد المزوّد على مسار audio-file العادي؛ وتُوسم
  مخرجات MP3 وCAF لتسليم مذكرات iMessage الصوتية.
- **القنوات الأخرى**: MP3 (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI).
  - يُعد 44.1 كيلوهرتز / 128 كيلوبت/ثانية التوازن الافتراضي لوضوح الكلام.
- **MiniMax**: MP3 (نموذج `speech-2.8-hd`، بمعدل عيّنة 32 كيلوهرتز) لمرفقات الصوت العادية. وبالنسبة إلى أهداف voice-note التي تعلن عنها القناة، يحوّل OpenClaw ملف MP3 من MiniMax إلى 48 كيلوهرتز Opus باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم التحويل الترميزي.
- **Xiaomi MiMo**: MP3 افتراضيًا، أو WAV عند التهيئة. وبالنسبة إلى أهداف voice-note التي تعلن عنها القناة، يحوّل OpenClaw خرج Xiaomi إلى 48 كيلوهرتز Opus باستخدام `ffmpeg` قبل التسليم عندما تعلن القناة دعم التحويل الترميزي.
- **Local CLI**: يستخدم `outputFormat` المهيأ. وتُحوَّل أهداف voice-note
  إلى Ogg/Opus، ويُحوَّل خرج الهاتف إلى PCM خام أحادي القناة 16 كيلوهرتز
  باستخدام `ffmpeg`.
- **Google Gemini**: يُرجع Gemini API TTS بيانات PCM خام بتردد 24 كيلوهرتز. يغلّفها OpenClaw بصيغة WAV لمرفقات الصوت، ويحوّلها ترميزيًا إلى 48 كيلوهرتز Opus لأهداف voice-note، ويُرجع PCM مباشرةً لـ Talk/الهاتف.
- **Gradium**: WAV لمرفقات الصوت، وOpus لأهداف voice-note، و`ulaw_8000` عند 8 كيلوهرتز للهاتف.
- **Inworld**: MP3 لمرفقات الصوت العادية، و`OGG_OPUS` أصلي لأهداف voice-note، و`PCM` خام بتردد 22050 هرتز لـ Talk/الهاتف.
- **xAI**: MP3 افتراضيًا؛ ويمكن أن يكون `responseFormat` هو `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw`. يستخدم OpenClaw نقطة نهاية REST الدفعية لـ TTS من xAI ويُرجع مرفقًا صوتيًا كاملًا؛ ولا يُستخدم WebSocket الخاص بـ TTS المتدفق من xAI في مسار هذا المزوّد. لا يدعم هذا المسار تنسيق Opus الأصلي لـ voice-note.
- **Microsoft**: يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - يقبل النقل المضمّن قيمة `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الخرج تنسيقات خرج Microsoft Speech (بما في ذلك Ogg/WebM Opus).
  - يقبل `sendVoice` في Telegram تنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت
    تحتاج إلى رسائل صوتية Opus مضمونة.
  - إذا فشل تنسيق خرج Microsoft المهيأ، يعيد OpenClaw المحاولة باستخدام MP3.

تكون تنسيقات خرج OpenAI/ElevenLabs ثابتة لكل قناة (انظر أعلاه).

## سلوك Auto-TTS

عند تفعيل `messages.tts.auto`، يقوم OpenClaw بما يلي:

- يتجاوز TTS إذا كان الرد يحتوي بالفعل على وسائط أو على توجيه `MEDIA:`.
- يتجاوز الردود القصيرة جدًا (أقل من 10 أحرف).
- يلخّص الردود الطويلة عندما تكون التلخيصات مفعّلة، باستخدام
  `summaryModel` (أو `agents.defaults.model.primary`).
- يرفق الصوت المُولَّد بالرد.
- في `mode: "final"`، ما يزال يرسل TTS صوتي فقط للردود النهائية المتدفقة
  بعد اكتمال تدفق النص؛ وتمر الوسائط المُولَّدة عبر التسوية نفسها لوسائط
  القناة مثل مرفقات الرد العادية.

إذا تجاوز الرد `maxLength` وكان التلخيص معطّلًا (أو لم يوجد مفتاح API لـ
نموذج التلخيص)، فسيُتجاوز الصوت ويُرسل الرد النصي العادي.

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
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Feishu / Matrix / Telegram / WhatsApp | تفضّل ردود voice-note تنسيق **Opus** (`opus_48000_64` من ElevenLabs، و`opus` من OpenAI). يوازن 48 كيلوهرتز / 64 كيلوبت/ثانية بين الوضوح والحجم. |
| القنوات الأخرى                        | **MP3** (`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI). الافتراضي 44.1 كيلوهرتز / 128 كيلوبت/ثانية للكلام.                       |
| Talk / الهاتف                         | **PCM** أصلي من المزوّد (Inworld ‏22050 هرتز، Google ‏24 كيلوهرتز)، أو `ulaw_8000` من Gradium للهاتف.                               |

ملاحظات لكل مزوّد:

- **التحويل الترميزي لـ Feishu / WhatsApp:** عندما يصل رد voice-note بصيغة MP3/WebM/WAV/M4A، يقوم Plugin القناة بتحويله ترميزيًا إلى 48 كيلوهرتز Ogg/Opus باستخدام `ffmpeg`. يرسل WhatsApp عبر Baileys باستخدام `ptt: true` و`audio/ogg; codecs=opus`. وإذا فشل التحويل: يعود Feishu إلى إرفاق الملف الأصلي؛ ويفشل إرسال WhatsApp بدلًا من نشر حمولة PTT غير متوافقة.
- **MiniMax / Xiaomi MiMo:** MP3 افتراضيًا (32 كيلوهرتز لـ MiniMax `speech-2.8-hd`)؛ ويُحوَّل ترميزيًا إلى 48 كيلوهرتز Opus لأهداف voice-note عبر `ffmpeg`.
- **Local CLI:** يستخدم `outputFormat` المهيأ. وتُحوَّل أهداف voice-note إلى Ogg/Opus، ويُحوَّل خرج الهاتف إلى PCM خام أحادي القناة 16 كيلوهرتز.
- **Google Gemini:** يُرجع PCM خامًا بتردد 24 كيلوهرتز. يغلّفه OpenClaw بصيغة WAV للمرفقات، ويحوّله ترميزيًا إلى 48 كيلوهرتز Opus لأهداف voice-note، ويُرجع PCM مباشرةً لـ Talk/الهاتف.
- **Inworld:** مرفقات MP3، وvoice-note أصلية `OGG_OPUS`، و`PCM` خام بتردد 22050 هرتز لـ Talk/الهاتف.
- **xAI:** MP3 افتراضيًا؛ ويمكن أن يكون `responseFormat` هو `mp3|wav|pcm|mulaw|alaw`. يستخدم نقطة النهاية الدفعية من xAI — ولا يُستخدم WebSocket المتدفق لـ TTS **مطلقًا**. تنسيق Opus الأصلي لـ voice-note **غير** مدعوم.
- **Microsoft:** يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`). يقبل `sendVoice` في Telegram تنسيقات OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج إلى رسائل صوتية Opus مضمونة. وإذا فشل تنسيق Microsoft المهيأ، يعيد OpenClaw المحاولة باستخدام MP3.

تكون تنسيقات خرج OpenAI وElevenLabs ثابتة لكل قناة كما هو مذكور أعلاه.

## مرجع الحقول

<AccordionGroup>
  <Accordion title="حقول messages.tts.* على المستوى الأعلى">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      وضع Auto-TTS. يرسل `inbound` الصوت فقط بعد رسالة صوتية واردة؛ ويرسل `tagged` الصوت فقط عندما يتضمن الرد توجيهات `[[tts:...]]` أو كتلة `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      مفتاح قديم. يقوم `openclaw doctor --fix` بترحيله إلى `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      تتضمن `"all"` ردود الأدوات/الكتل بالإضافة إلى الردود النهائية.
    </ParamField>
    <ParamField path="provider" type="string">
      معرّف مزوّد الكلام. عند عدم تعيينه، يستخدم OpenClaw أول مزوّد مهيأ وفق ترتيب الاختيار التلقائي في السجل. يعيد `openclaw doctor --fix` كتابة القيمة القديمة `provider: "edge"` إلى `"microsoft"`.
    </ParamField>
    <ParamField path="persona" type="string">
      معرّف الشخصية النشطة من `personas`. يُطبَّع إلى أحرف صغيرة.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هوية صوتية ثابتة. الحقول: `label`، و`description`، و`provider`، و`fallbackPolicy`، و`prompt`، و`providers.<provider>`. راجع [الشخصيات](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      نموذج منخفض التكلفة للتلخيص التلقائي؛ والإعداد الافتراضي هو `agents.defaults.model.primary`. يقبل `provider/model` أو اسمًا مستعارًا مهيأً لنموذج.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      يسمح للنموذج بإصدار توجيهات TTS. القيمة الافتراضية لـ `enabled` هي `true`؛ والقيمة الافتراضية لـ `allowProvider` هي `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      إعدادات مملوكة للمزوّد ومفهرسة بمعرّف مزوّد الكلام. تعيد `openclaw doctor --fix` كتابة الكتل المباشرة القديمة (`messages.tts.openai`، و`.elevenlabs`، و`.microsoft`، و`.edge`)؛ ويجب تثبيت `messages.tts.providers.<id>` فقط.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      حد صارم لأحرف إدخال TTS. يفشل `/tts audio` إذا تم تجاوزه.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      مهلة الطلب بالمللي ثانية.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      تجاوز مسار JSON للتفضيلات المحلية (المزوّد/الحد/التلخيص). الافتراضي `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">متغير البيئة: `AZURE_SPEECH_KEY` أو `AZURE_SPEECH_API_KEY` أو `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقة Azure Speech (مثل `eastus`). متغير البيئة: `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">تجاوز اختياري لنقطة نهاية Azure Speech (الاسم المستعار `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure voice ShortName. الافتراضي `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">رمز لغة SSML. الافتراضي `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">قيمة Azure `X-Microsoft-OutputFormat` للصوت القياسي. الافتراضي `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">قيمة Azure `X-Microsoft-OutputFormat` لخرج voice-note. الافتراضي `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">يرجع احتياطيًا إلى `ELEVENLABS_API_KEY` أو `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف النموذج (مثل `eleven_multilingual_v2` أو `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">معرّف صوت ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، و`similarityBoost`، و`style` (كل منها `0..1`)، و`useSpeakerBoost` (`true|false`)، و`speed` (`0.5..2.0`، و`1.0` = عادي).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>وضع تطبيع النص.</ParamField>
    <ParamField path="languageCode" type="string">رمز ISO 639-1 من حرفين (مثل `en` أو `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحيح `0..4294967295` من أجل حتمية بأفضل جهد.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز `base URL` الخاص بـ ElevenLabs API.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">يرجع احتياطيًا إلى `GEMINI_API_KEY` / `GOOGLE_API_KEY`. وإذا حُذف، يمكن لـ TTS إعادة استخدام `models.providers.google.apiKey` قبل الرجوع إلى متغيرات البيئة.</ParamField>
    <ParamField path="model" type="string">نموذج Gemini TTS. الافتراضي `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">اسم الصوت الجاهز مسبقًا في Gemini. الافتراضي `Kore`. الاسم المستعار: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">مطالبة أسلوبية بلغة طبيعية تُسبق قبل النص المنطوق.</ParamField>
    <ParamField path="speakerName" type="string">تسمية متحدث اختيارية تُسبق قبل النص المنطوق عندما يستخدم prompt متحدثًا مسمّى.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>اضبطه على `audio-profile-v1` لتغليف حقول prompt الخاصة بالشخصية النشطة داخل بنية Gemini TTS prompt حتمية.</ParamField>
    <ParamField path="personaPrompt" type="string">نص prompt شخصية إضافي خاص بـ Google يُضاف إلى Director's Notes في القالب.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة المقبولة الوحيدة هي `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">متغير البيئة: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">متغير البيئة: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">الافتراضي `inworld-tts-1.5-max`. ويدعم أيضًا: `inworld-tts-1.5-mini`، و`inworld-tts-1-max`، و`inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">درجة حرارة أخذ العينات `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">الملف التنفيذي المحلي أو سلسلة الأوامر لـ CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">وسائط الأمر. تدعم العناصر النائبة `{{Text}}`، و`{{OutputPath}}`، و`{{OutputDir}}`، و`{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>تنسيق خرج CLI المتوقع. الافتراضي `mp3` لمرفقات الصوت.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلة الأمر بالمللي ثانية. الافتراضي `120000`.</ParamField>
    <ParamField path="cwd" type="string">دليل العمل الاختياري للأمر.</ParamField>
    <ParamField path="env" type="Record<string, string>">تجاوزات بيئة اختيارية للأمر.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (من دون مفتاح API)">
    <ParamField path="enabled" type="boolean" default="true">السماح باستخدام Microsoft speech.</ParamField>
    <ParamField path="voice" type="string">اسم الصوت العصبي من Microsoft (مثل `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">رمز اللغة (مثل `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">تنسيق خرج Microsoft. الافتراضي `audio-24khz-48kbitrate-mono-mp3`. لا تدعم وسيلة النقل المضمّنة المعتمدة على Edge كل التنسيقات.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">سلاسل نسب مئوية (مثل `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">كتابة ترجمات JSON إلى جانب ملف الصوت.</ParamField>
    <ParamField path="proxy" type="string">عنوان URL للبروكسي لطلبات Microsoft speech.</ParamField>
    <ParamField path="timeoutMs" type="number">تجاوز مهلة الطلب (مللي ثانية).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>اسم مستعار قديم. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المخزنة إلى `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">يرجع احتياطيًا إلى `MINIMAX_API_KEY`. مصادقة Token Plan عبر `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.minimax.io`. متغير البيئة: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `speech-2.8-hd`. متغير البيئة: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `English_expressive_narrator`. متغير البيئة: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. الافتراضي `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. الافتراضي `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحيح `-12..12`. الافتراضي `0`. تُقتطع القيم الكسرية قبل الطلب.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">يرجع احتياطيًا إلى `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف نموذج OpenAI TTS (مثل `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">اسم الصوت (مثل `alloy`، أو `cedar`).</ParamField>
    <ParamField path="instructions" type="string">حقل `instructions` صريح لـ OpenAI. عند تعيينه، **لا** تُربط حقول prompt الخاصة بالشخصية تلقائيًا.</ParamField>
    <ParamField path="baseUrl" type="string">
      تجاوز نقطة نهاية OpenAI TTS. ترتيب الحل: الإعدادات → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. تُعامل القيم غير الافتراضية على أنها نقاط نهاية TTS متوافقة مع OpenAI، لذا تُقبل أسماء النماذج والأصوات المخصصة.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">متغير البيئة: `OPENROUTER_API_KEY`. ويمكنه إعادة استخدام `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://openrouter.ai/api/v1`. تُطبَّع القيمة القديمة `https://openrouter.ai/v1`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `hexgrad/kokoro-82m`. الاسم المستعار: `modelId`.</ParamField>
    <ParamField path="voice" type="string">الافتراضي `af_alloy`. الاسم المستعار: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>الافتراضي `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي للمزوّد.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">متغير البيئة: `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">الافتراضي `seed-tts-1.0`. متغير البيئة: `VOLCENGINE_TTS_RESOURCE_ID`. استخدم `seed-tts-2.0` عندما يكون مشروعك يملك صلاحية TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ترويسة app key. الافتراضي `aGjiRDfUWi`. متغير البيئة: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز نقطة نهاية HTTP الخاصة بـ Seed Speech TTS. متغير البيئة: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">نوع الصوت. الافتراضي `en_female_anna_mars_bigtts`. متغير البيئة: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبة السرعة الأصلية للمزوّد.</ParamField>
    <ParamField path="emotion" type="string">وسم العاطفة الأصلي للمزوّد.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>حقول قديمة لـ Volcengine Speech Console. متغيرات البيئة: `VOLCENGINE_TTS_APPID`، و`VOLCENGINE_TTS_TOKEN`، و`VOLCENGINE_TTS_CLUSTER` (الافتراضي `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">متغير البيئة: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.x.ai/v1`. متغير البيئة: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">الافتراضي `eve`. الأصوات الحية: `ara`، و`eve`، و`leo`، و`rex`، و`sal`، و`una`.</ParamField>
    <ParamField path="language" type="string">رمز لغة BCP-47 أو `auto`. الافتراضي `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>الافتراضي `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي للمزوّد.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">متغير البيئة: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">الافتراضي `https://api.xiaomimimo.com/v1`. متغير البيئة: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">الافتراضي `mimo-v2.5-tts`. متغير البيئة: `XIAOMI_TTS_MODEL`. ويدعم أيضًا `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">الافتراضي `mimo_default`. متغير البيئة: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>الافتراضي `mp3`. متغير البيئة: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">تعليمة أسلوبية اختيارية بلغة طبيعية تُرسل كرسالة مستخدم؛ ولا تُنطق.</ParamField>
  </Accordion>
</AccordionGroup>

## أداة الوكيل

تحوّل أداة `tts` النص إلى كلام وتُرجع مرفقًا صوتيًا من أجل
تسليم الرد. وفي Feishu وMatrix وTelegram وWhatsApp، يُسلَّم الصوت
كرسالة صوتية بدلًا من مرفق ملف. ويمكن لـ Feishu و
WhatsApp تحويل خرج TTS غير Opus ترميزيًا في هذا المسار عندما يكون `ffmpeg`
متاحًا.

يرسل WhatsApp الصوت عبر Baileys بوصفه مذكرة صوتية PTT (`audio` مع
`ptt: true`) ويرسل النص المرئي **بشكل منفصل** عن صوت PTT لأن
العملاء لا يعرضون التسميات التوضيحية على المذكرات الصوتية بشكل متسق.

تقبل الأداة حقلي `channel` و`timeoutMs` الاختياريين؛ و`timeoutMs` هو
مهلة طلب المزوّد لكل استدعاء بالمللي ثانية.

## Gateway RPC

| الطريقة          | الغرض                                  |
| ---------------- | -------------------------------------- |
| `tts.status`     | قراءة حالة TTS الحالية وآخر محاولة.    |
| `tts.enable`     | ضبط تفضيل التشغيل التلقائي المحلي إلى `always`. |
| `tts.disable`    | ضبط تفضيل التشغيل التلقائي المحلي إلى `off`. |
| `tts.convert`    | تحويل نص → صوت لمرة واحدة.            |
| `tts.setProvider`| ضبط تفضيل المزوّد المحلي.             |
| `tts.setPersona` | ضبط تفضيل الشخصية المحلي.             |
| `tts.providers`  | سرد المزوّدين المهيئين وحالتهم.       |

## روابط الخدمات

- [دليل OpenAI لتحويل النص إلى كلام](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [مزوّد Azure Speech](/ar/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ar/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/ar/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/ar/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات خرج Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## ذو صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
