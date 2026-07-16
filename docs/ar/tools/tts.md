---
read_when:
    - تمكين تحويل النص إلى كلام للردود
    - تهيئة موفّر لتحويل النص إلى كلام، أو سلسلة احتياطية، أو شخصية مخصّصة
    - استخدام أوامر أو توجيهات /tts
sidebarTitle: Text to speech (TTS)
summary: تحويل النص إلى كلام للردود الصادرة — المزوّدون، والشخصيات، والأوامر المائلة، والمخرجات الخاصة بكل قناة
title: تحويل النص إلى كلام
x-i18n:
    generated_at: "2026-07-16T15:02:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw يحوّل الردود الصادرة إلى صوت عبر **14 مزودًا لتحويل النص إلى كلام**:
رسائل صوتية أصلية على Feishu وMatrix وTelegram وWhatsApp؛ ومرفقات
صوتية في كل مكان آخر؛ وتدفقات PCM/Ulaw للاتصالات الهاتفية وTalk.

يمثّل تحويل النص إلى كلام نصف إخراج الكلام في وضع `stt-tts` الخاص بـ Talk (تستخدم `talk.speak` مسار
التوليف نفسه). أما جلسات Talk الأصلية للمزود `realtime` فتولّف
الكلام داخل مزود الوقت الفعلي؛ بينما لا تولّف جلسات `transcription`
ردًا صوتيًا للمساعد مطلقًا.

## البدء السريع

<Steps>
  <Step title="اختر مزودًا">
    يُعد OpenAI وElevenLabs الخيارين المستضافين الأكثر موثوقية. يعمل Microsoft و
    CLI المحلي من دون مفتاح API. راجع [مصفوفة المزودين](#supported-providers)
    للاطلاع على القائمة الكاملة.
  </Step>
  <Step title="اضبط مفتاح API">
    صدّر متغير البيئة الخاص بمزودك (على سبيل المثال `OPENAI_API_KEY` و
    `ELEVENLABS_API_KEY`). لا يحتاج Microsoft وCLI المحلي إلى مفتاح.
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
  <Step title="جرّبه في الدردشة">
    يعرض `/tts status` الحالة الحالية. يرسل `/tts audio Hello from OpenClaw`
    ردًا صوتيًا لمرة واحدة.
  </Step>
</Steps>

<Note>
يكون التحويل التلقائي للنص إلى كلام **معطّلًا** افتراضيًا. عندما لا تكون `messages.tts.provider` مضبوطة،
يختار OpenClaw أول مزود مضبوط وفق ترتيب التحديد التلقائي في السجل.
أداة الوكيل المضمّنة `tts` مخصصة للطلب الصريح فقط: تظل الدردشة العادية
نصية ما لم يطلب المستخدم صوتًا، أو يستخدم `/tts`، أو يفعّل التحويل التلقائي للنص إلى كلام/الكلام
عبر التوجيه.
</Note>

## المزودون المدعومون

| المزود            | المصادقة                                                                                                         | ملاحظات                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (وكذلك `AZURE_SPEECH_API_KEY` و`SPEECH_KEY` و`SPEECH_REGION`)          | إخراج أصلي لملاحظات Ogg/Opus الصوتية وللاتصالات الهاتفية.                                   |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | تحويل نص إلى كلام متوافق مع OpenAI. القيمة الافتراضية هي `hexgrad/Kokoro-82M`.               |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` أو `XI_API_KEY`                                                                         | استنساخ الصوت، ودعم متعدد اللغات، ونتائج حتمية عبر `seed`؛ ويُبث لتشغيل الصوت في Discord. |
| **Google Gemini** | `GEMINI_API_KEY` أو `GOOGLE_API_KEY`                                                                         | تحويل دفعي للنص إلى كلام عبر Gemini API؛ مع مراعاة الشخصية عبر `promptTemplate: "audio-profile-v1"`.          |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | إخراج للملاحظات الصوتية والاتصالات الهاتفية.                                                |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | واجهة API لبث تحويل النص إلى كلام. ملاحظات صوتية أصلية بتنسيق Opus واتصالات هاتفية بتنسيق PCM. |
| **CLI المحلي**    | لا يوجد                                                                                                          | يشغّل أمرًا محليًا مضبوطًا لتحويل النص إلى كلام.                                            |
| **Microsoft**     | لا يوجد                                                                                                          | تحويل نص إلى كلام عصبي عام من Edge عبر `node-edge-tts`. يُقدَّم بأفضل جهد، من دون اتفاقية مستوى خدمة. |
| **MiniMax**       | `MINIMAX_API_KEY` (أو خطة الرموز: `MINIMAX_OAUTH_TOKEN` و`MINIMAX_CODE_PLAN_KEY` و`MINIMAX_CODING_API_KEY`)                   | واجهة API ‏T2A v2. القيمة الافتراضية هي `speech-2.8-hd`.                                 |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                | يُستخدم أيضًا للتلخيص التلقائي؛ ويدعم الشخصية `instructions`.                           |
| **OpenRouter**    | `OPENROUTER_API_KEY` (يمكن إعادة استخدام `models.providers.openrouter.apiKey`)                                                       | النموذج الافتراضي `hexgrad/kokoro-82m`.                                                       |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/رمز قديمان: `VOLCENGINE_TTS_APPID`/`_TOKEN`)              | واجهة BytePlus Seed Speech HTTP API.                                                        |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                | مزود مشترك للصور والفيديو والكلام.                                                           |
| **xAI**           | `XAI_API_KEY`                                                                                                | تحويل دفعي للنص إلى كلام من xAI. الملاحظات الصوتية الأصلية بتنسيق Opus **غير** مدعومة.       |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                | تحويل النص إلى كلام عبر MiMo من خلال إكمالات دردشة Xiaomi.                                  |

إذا ضُبط عدة مزودين، يُستخدم المزود المحدد أولًا وتكون المزودات
الأخرى خيارات احتياطية. يستخدم التلخيص التلقائي `summaryModel` (أو
`agents.defaults.model.primary`)، لذا يجب أيضًا مصادقة ذلك المزود
إذا أبقيت الملخصات مفعّلة.

<Warning>
يستخدم مزود **Microsoft** المضمّن خدمة Microsoft Edge الإلكترونية العصبية
لتحويل النص إلى كلام عبر `node-edge-tts`. وهي خدمة ويب عامة بلا
اتفاقية مستوى خدمة أو حصة منشورة — لذا تعامل معها على أساس أفضل جهد. يُطبّع معرّف المزود القديم `edge` إلى
`microsoft`، ويعيد `openclaw doctor --fix` كتابة الإعدادات
المحفوظة؛ ويجب أن تستخدم الإعدادات الجديدة دائمًا `microsoft`.
</Warning>

## الإعدادات

توجد إعدادات تحويل النص إلى كلام ضمن `messages.tts` في `~/.openclaw/openclaw.json`. اختر
إعدادًا مسبقًا وعدّل كتلة المزود. حقلا `speakerVoice`/`speakerVoiceId`
الموضحان أدناه هما الحقلان القياسيان؛ ولا تزال أسماء حقول `voice`/`voiceId`/
`voiceName` الخاصة بكل مزود تعمل كأسماء بديلة قديمة.

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // مطالبات اختيارية للنمط بلغة طبيعية:
          // audioProfile: "تحدّث بنبرة هادئة تشبه نبرة مقدّم بودكاست.",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="CLI المحلي">
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
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

بالنسبة إلى Xiaomi ‏`mimo-v2.5-tts-voicedesign`، احذف `speakerVoice` واضبط `style` على
مطالبة تصميم الصوت. يرسل OpenClaw تلك المطالبة بوصفها رسالة `user` الخاصة بتحويل النص إلى كلام،
ولا يرسل `audio.voice` لنموذج تصميم الصوت.

### تجاوزات الصوت الخاصة بكل وكيل

استخدم `agents.list[].tts` عندما ينبغي لأحد الوكلاء التحدث باستخدام مزود أو
صوت أو نموذج أو شخصية أو وضع TTS تلقائي مختلف. تُدمج كتلة الوكيل دمجًا عميقًا فوق
`messages.tts`، لذا يمكن أن تبقى بيانات اعتماد المزود في إعدادات المزود العامة:

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

لتثبيت شخصية خاصة بكل وكيل، عيّن `agents.list[].tts.persona` إلى جانب إعدادات
المزود — إذ يتجاوز `messages.tts.persona` العام لذلك الوكيل فقط.

ترتيب الأولوية للردود التلقائية و`/tts audio` و`/tts status` وأداة الوكيل
`tts`:

1. `messages.tts`
2. `agents.list[].tts` النشط
3. تجاوز القناة، عندما تدعم القناة `channels.<channel>.tts`
4. تجاوز الحساب، عندما تمرر القناة `channels.<channel>.accounts.<id>.tts`
5. تفضيلات `/tts` المحلية لهذا المضيف
6. توجيهات `[[tts:...]]` المضمّنة عند تمكين [تجاوزات النموذج](#model-driven-directives)

تستخدم تجاوزات القناة والحساب البنية نفسها التي يستخدمها `messages.tts`،
وتُدمج دمجًا عميقًا فوق الطبقات السابقة، لذا يمكن أن تبقى بيانات اعتماد المزود المشتركة في
`messages.tts` بينما يغيّر حساب قناة أو روبوت صوت المتحدث أو النموذج أو الشخصية
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
              openai: { speakerVoice: "shimmer" },
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
عبر المزودين. ويمكنها تفضيل مزود واحد، وتحديد مقصد مطالبة محايد تجاه المزود،
واحتواء ارتباطات خاصة بكل مزود للأصوات والنماذج وقوالب المطالبات
والبذور وإعدادات الصوت.

### شخصية بالحد الأدنى

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "الراوي",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### شخصية كاملة (مطالبة محايدة تجاه المزود)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "ألفريد",
          description: "راوٍ بريطاني بدور خادم شخصي، جاف الظرف ودافئ.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "خادم شخصي بريطاني لامع. جاف الظرف، ذكي، دافئ، ساحر، معبّر عاطفيًا، وغير نمطي أبدًا.",
            scene: "غرفة دراسة هادئة في وقت متأخر من الليل. سرد قريب من الميكروفون لمشغّل موثوق.",
            sampleContext: "يجيب المتحدث عن طلب تقني خاص بثقة موجزة ودفء جاف.",
            style: "راقٍ، متحفظ، ومرح بخفة.",
            accent: "الإنجليزية البريطانية.",
            pacing: "متأنٍ، مع وقفات درامية قصيرة.",
            constraints: ["لا تقرأ قيم الإعدادات بصوت عالٍ.", "لا تشرح الشخصية."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

### تحديد الشخصية

تُختار الشخصية النشطة بصورة حتمية:

1. تفضيل `/tts persona <id>` المحلي، إذا كان معيّنًا.
2. `messages.tts.persona`، إذا كان معيّنًا.
3. لا توجد شخصية.

يُنفّذ اختيار المزود مع تقديم الخيارات الصريحة أولًا:

1. التجاوزات المباشرة (CLI وGateway وTalk وتوجيهات TTS المسموح بها).
2. تفضيل `/tts provider <id>` المحلي.
3. `provider` الخاص بالشخصية النشطة.
4. `messages.tts.provider`.
5. الاختيار التلقائي من السجل.

في كل محاولة لمزود، يدمج OpenClaw الإعدادات بهذا الترتيب:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. تجاوزات الطلب الموثوق
4. تجاوزات توجيهات TTS المسموح بها والصادرة عن النموذج

### كيفية استخدام المزودين لمطالبات الشخصية

حقول مطالبة الشخصية (`profile` و`scene` و`sampleContext` و`style` و`accent`
و`pacing` و`constraints`) **محايدة تجاه المزود**. يقرر كل مزود كيفية
استخدامها:

<AccordionGroup>
  <Accordion title="Google Gemini">
    يغلّف حقول مطالبة الشخصية في بنية مطالبة TTS خاصة بـ Gemini **فقط عندما**
    تعيّن إعدادات مزود Google الفعلية `promptTemplate: "audio-profile-v1"`
    أو `personaPrompt`. ولا تزال الحقول الأقدم `audioProfile` و`speakerName`
    تُضاف في البداية كنص مطالبة خاص بـ Google. تُحفظ وسوم الصوت المضمّنة مثل
    `[whispers]` أو `[laughs]` داخل كتلة `[[tts:text]]`
    ضمن نص Gemini المنطوق؛ ولا ينشئ OpenClaw هذه الوسوم.
  </Accordion>
  <Accordion title="OpenAI">
    يربط حقول مطالبة الشخصية بحقل الطلب `instructions` **فقط عندما**
    لا يكون `instructions` صريحًا لـ OpenAI قد ضُبط. ويحظى `instructions`
    الصريح بالأولوية دائمًا.
  </Accordion>
  <Accordion title="المزودون الآخرون">
    يستخدمون فقط ارتباطات الشخصية الخاصة بالمزود ضمن
    `personas.<id>.providers.<provider>`. وتُتجاهل حقول مطالبة الشخصية
    ما لم ينفّذ المزود ربطه الخاص لمطالبة الشخصية.
  </Accordion>
</AccordionGroup>

### سياسة الرجوع الاحتياطي

يتحكم `fallbackPolicy` في السلوك عندما لا تحتوي الشخصية على **أي ارتباط** للمزود
الذي تجري محاولته:

| السياسة              | السلوك                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **الافتراضي.** تظل حقول المطالبة المحايدة تجاه المزود متاحة؛ ويمكن للمزود استخدامها أو تجاهلها.                                            |
| `provider-defaults` | تُحذف الشخصية من إعداد المطالبة لتلك المحاولة؛ ويستخدم المزود إعداداته الافتراضية المحايدة بينما يستمر الرجوع الاحتياطي إلى مزودين آخرين. |
| `fail`              | تخطَّ محاولة ذلك المزود مع `reasonCode: "not_configured"` و`personaBinding: "missing"`. وتظل مزودات الرجوع الاحتياطي قيد المحاولة.              |

لا يفشل طلب TTS بأكمله إلا عندما تُتخطى **كل** محاولات المزودين
أو تفشل.

يكون اختيار مزود جلسة Talk ضمن نطاق الجلسة. ينبغي لعميل Talk اختيار
معرّفات المزود والنموذج والصوت واللغات المحلية من `talk.catalog` وتمريرها
عبر طلب جلسة Talk أو التسليم. ولا ينبغي لفتح جلسة صوتية
تعديل `messages.tts` أو الإعدادات الافتراضية العامة لمزود Talk.

## التوجيهات المستندة إلى النموذج

افتراضيًا، **يمكن** للمساعد إصدار توجيهات `[[tts:...]]` لتجاوز
الصوت أو النموذج أو السرعة لرد واحد، بالإضافة إلى كتلة
`[[tts:text]]...[[/tts:text]]` اختيارية لإشارات تعبيرية ينبغي أن تظهر في
الصوت فقط:

```text
تفضل.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](يضحك) اقرأ الأغنية مرة أخرى.[[/tts:text]]
```

عندما تكون قيمة `messages.tts.auto` هي `"tagged"`، تكون **التوجيهات مطلوبة** لتشغيل
الصوت. ويزيل تسليم الكتل المتدفقة التوجيهات من النص المرئي قبل أن
تراها القناة، حتى عند تقسيمها عبر كتل متجاورة.

يُتجاهل `provider=...` ما لم يكن `modelOverrides.allowProvider: true`. عندما
يصرّح ردٌّ بـ `provider=...`، فلا تُحلَّل المفاتيح الأخرى في ذلك التوجيه
إلا بواسطة ذلك المزود؛ وتُزال المفاتيح غير المدعومة ويُبلّغ عنها كتحذيرات
لتوجيهات TTS.

**مفاتيح التوجيه المتاحة:**

- `provider` (معرّف مزود مسجل؛ يتطلب `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (الأسماء البديلة القديمة: `voice` و`voiceName` و`voice_name` و`google_voice` و`voiceId`)
- `model` / `google_model`
- `stability` و`similarityBoost` و`style` و`speed` و`useSpeakerBoost`
- `vol` / `volume` (مستوى صوت MiniMax، `(0, 10]`)
- `pitch` (حدة صوت MiniMax الصحيحة، من −12 إلى 12؛ تُحذف الأجزاء الكسرية)
- `emotion` (وسم المشاعر في Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**تعطيل تجاوزات النموذج بالكامل:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**السماح بتبديل المزود مع إبقاء عناصر التحكم الأخرى قابلة للإعداد:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## أوامر الشرطة المائلة

الأمر الوحيد هو `/tts`. وعلى Discord، يسجل OpenClaw أيضًا `/voice` لأن
`/tts` أمر مضمّن في Discord — ويظل النص `/tts ...` يعمل.

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
تتطلب الأوامر مرسِلًا مخولًا (تُطبّق قواعد قائمة السماح/المالك)، كما يجب تمكين
`commands.text` أو تسجيل الأوامر الأصلية.
</Note>

ملاحظات السلوك:

- يكتب `/tts on` تفضيل TTS المحلي إلى `always`؛ ويكتبه `/tts off` إلى `off`.
- يكتب `/tts chat on|off|default` تجاوزًا لـ TTS التلقائي ضمن نطاق الجلسة للمحادثة الحالية.
- يكتب `/tts persona <id>` تفضيل الشخصية المحلي؛ ويمسحه `/tts persona off`.
- يقرأ `/tts latest` أحدث رد للمساعد من نص الجلسة الحالية ويرسله صوتيًا مرة واحدة. ولا يخزن في إدخال الجلسة سوى تجزئة لذلك الرد لمنع الإرسال الصوتي المكرر.
- ينشئ `/tts audio` ردًا صوتيًا لمرة واحدة (ولا **يفعّل** TTS).
- يقبل `/tts limit <chars>` القيم **100–4096** (4096 هو الحد الأقصى للتسمية التوضيحية/الرسالة في Telegram)؛ وتُرفض القيم خارج هذا النطاق.
- يُخزّن `limit` و`summary` في **التفضيلات المحلية**، وليس في الإعدادات الرئيسية.
- يتضمن `/tts status` تشخيصات الرجوع الاحتياطي لأحدث محاولة — `Fallback: <primary> -> <used>` و`Attempts: ...` وتفاصيل كل محاولة (`provider:outcome(reasonCode) latency`).
- يعرض `/status` وضع TTS النشط، بالإضافة إلى المزود والنموذج والصوت وبيانات تعريف نقطة النهاية المخصصة المنقحة، عند تمكين TTS.

## تفضيلات كل مستخدم

تكتب أوامر الشرطة المائلة التجاوزات المحلية إلى `prefsPath`. القيمة الافتراضية هي
`~/.openclaw/settings/tts.json`؛ ويمكن تجاوزها باستخدام متغير البيئة `OPENCLAW_TTS_PREFS`
أو `messages.tts.prefsPath`.

| الحقل المخزّن | التأثير                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | تجاوز محلي للنطق التلقائي (`always`، `off`، …)                                     |
| `provider`   | تجاوز محلي لمزوّد الخدمة الأساسي                                                  |
| `persona`    | تجاوز محلي للشخصية                                                           |
| `maxLength`  | عتبة التلخيص/الاقتطاع (الافتراضي `1500` حرفًا، نطاق `/tts limit` من 100 إلى 4096) |
| `summarize`  | مفتاح تبديل التلخيص (الافتراضي `true`)                                                  |

تتجاوز هذه الإعدادات التكوين الفعلي الناتج من `messages.tts` بالإضافة إلى كتلة
`agents.list[].tts` النشطة لذلك المضيف.

## تنسيقات الإخراج

يعتمد تسليم صوت تحويل النص إلى كلام على إمكانات القناة. تعلن Plugins القنوات
ما إذا كان ينبغي لتحويل النص إلى كلام بأسلوب الرسائل الصوتية أن يطلب من مزوّدي الخدمة هدف `voice-note` أصليًا أو
أن يُبقي توليف `audio-file` العادي، وما إذا كانت القناة تعيد ترميز
الإخراج غير الأصلي قبل الإرسال.

| الهدف                                | التنسيق                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | تفضّل ردود الملاحظات الصوتية **Opus** ‏(`opus_48000_64` من ElevenLabs، و`opus` من OpenAI). يوازن 48 kHz / 64 kbps بين الوضوح والحجم. |
| القنوات الأخرى                        | **MP3** ‏(`mp3_44100_128` من ElevenLabs، و`mp3` من OpenAI). يُعد 44.1 kHz / 128 kbps التوازن الافتراضي للكلام.                  |
| المحادثة / الاتصالات الهاتفية                      | **PCM** الأصلي من مزوّد الخدمة (Inworld ‏22050 Hz، وGoogle ‏24 kHz)، أو `ulaw_8000` من Gradium للاتصالات الهاتفية.                                 |

ملاحظات خاصة بكل مزوّد خدمة:

- **إعادة ترميز Feishu / WhatsApp:** عندما يصل رد ملاحظة صوتية بصيغة MP3/WebM/WAV/M4A أو ملف صوتي آخر محتمل، يعيد Plugin القناة ترميزه إلى Ogg/Opus بتردد 48 kHz باستخدام `ffmpeg` ‏(`libopus`، ‏64 kbps) قبل إرسال الرسالة الصوتية الأصلية. يرسل WhatsApp النتيجة عبر حمولة Baileys ‏`audio` مع `ptt: true` و`audio/ogg; codecs=opus`. عند فشل إعادة الترميز: يلتقط Feishu الخطأ ويعود إلى إرسال الملف الأصلي كمرفق عادي؛ ولا يملك WhatsApp مسارًا احتياطيًا، لذا تفشل عملية الإرسال نفسها بدلًا من نشر حمولة PTT غير متوافقة.
- **MiniMax:** ‏MP3 (نموذج `speech-2.8-hd`، ومعدل أخذ عينات 32 kHz) لمرفقات الصوت العادية؛ ويُعاد ترميزه إلى Opus بتردد 48 kHz باستخدام `ffmpeg` لأهداف الملاحظات الصوتية التي تعلن عنها القناة.
- **Xiaomi MiMo:** ‏MP3 افتراضيًا، أو WAV عند تكوينه؛ ويُعاد ترميزه إلى Opus بتردد 48 kHz باستخدام `ffmpeg` لأهداف الملاحظات الصوتية التي تعلن عنها القناة.
- **CLI المحلي:** يستخدم `outputFormat` المكوّن. تُحوّل أهداف الملاحظات الصوتية إلى Ogg/Opus، ويُحوّل إخراج الاتصالات الهاتفية إلى PCM خام أحادي القناة بتردد 16 kHz باستخدام `ffmpeg`.
- **Google Gemini:** يعيد PCM خامًا بتردد 24 kHz. يغلّفه OpenClaw بصيغة WAV لمرفقات الصوت، ويعيد ترميزه إلى Opus بتردد 48 kHz لأهداف الملاحظات الصوتية، ويعيد PCM مباشرةً للمحادثة/الاتصالات الهاتفية.
- **Gradium:** ‏WAV لمرفقات الصوت، وOpus لأهداف الملاحظات الصوتية، و`ulaw_8000` بتردد 8 kHz للاتصالات الهاتفية.
- **Inworld:** ‏MP3 لمرفقات الصوت العادية، و`OGG_OPUS` الأصلي لأهداف الملاحظات الصوتية، و`PCM` الخام بتردد 22050 Hz للمحادثة/الاتصالات الهاتفية.
- **xAI:** ‏MP3 افتراضيًا؛ وقد يستخدم توليف الملفات الصوتية `mp3` أو `wav` أو `pcm` أو `mulaw` أو `alaw` لكل من الإخراج المخزّن مؤقتًا والمتدفق. تستخدم أهداف الملاحظات الصوتية MP3 للتدفق والمسار الاحتياطي المخزّن مؤقتًا لأن مخرجات xAI ‏`pcm` و`mulaw` و`alaw` هي صوت خام بلا ترويسات. يستخدم التوليف المخزّن مؤقتًا نقطة نهاية REST الدفعية `/v1/tts` الخاصة بـ xAI؛ ويستخدم `textToSpeechStream` ‏`wss://api.x.ai/v1/tts` الأصلي. هذا ليس عقد الصوت في الوقت الفعلي. تنسيق Opus الأصلي للملاحظات الصوتية غير مدعوم.
- **Microsoft:** يستخدم `microsoft.outputFormat` (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).
  - تقبل وسيلة النقل المضمّنة `outputFormat`، لكن ليست كل التنسيقات متاحة من الخدمة.
  - تتبع قيم تنسيق الإخراج تنسيقات إخراج Microsoft Speech (بما فيها Ogg/WebM Opus).
  - يقبل `sendVoice` في Telegram صيغ OGG/MP3/M4A؛ استخدم OpenAI/ElevenLabs إذا كنت تحتاج إلى رسائل صوتية مضمونة بصيغة Opus.
  - إذا فشل تنسيق إخراج Microsoft المكوّن، يعيد OpenClaw المحاولة باستخدام MP3.
  - عند عدم تعيين تجاوز صريح للصوت واستخدام الصوت الإنجليزي الافتراضي، يتحوّل OpenClaw تلقائيًا إلى صوت عصبي صيني (`zh-CN-XiaoxiaoNeural`، والإعداد المحلي `zh-CN`) إذا كان نص الرد تغلب عليه أحرف CJK.

تنسيقات إخراج OpenAI وElevenLabs ثابتة لكل قناة كما هو موضح أعلاه.

## سلوك النطق التلقائي

عند تمكين `messages.tts.auto`، يقوم OpenClaw بما يلي:

- يتخطى تحويل النص إلى كلام إذا كان الرد يحتوي بالفعل على وسائط منظّمة.
- يتخطى الردود القصيرة جدًا (أقل من 10 أحرف).
- يلخّص الردود الطويلة عند تمكين الملخصات، باستخدام
  `summaryModel` (أو `agents.defaults.model.primary`).
- يرفق الصوت المُنشأ بالرد.
- في `mode: "final"`، يظل يرسل تحويل النص إلى كلام صوتيًا فقط للردود النهائية المتدفقة
  بعد اكتمال تدفق النص؛ وتمر الوسائط المُنشأة بعملية تسوية وسائط القناة نفسها
  التي تمر بها مرفقات الرد العادية.

إذا تجاوز الرد `maxLength`، فلن يتخطى OpenClaw الصوت نهائيًا مطلقًا:

- **التلخيص مفعّل** (افتراضيًا) ويتوفر نموذج تلخيص: يلخّص
  النص إلى نحو `maxLength` حرفًا، ثم يولّف الملخص.
- **التلخيص معطّل**، أو فشل التلخيص، أو لا يتوفر مفتاح API
  لنموذج التلخيص: يقتطع النص إلى `maxLength` حرفًا ويولّف النص
  المقتطع.

```text
الرد -> هل تحويل النص إلى كلام مفعّل؟
  لا  -> إرسال النص
  نعم -> هل توجد وسائط / هل الرد قصير؟
          نعم -> إرسال النص
          لا  -> هل الطول > الحد؟
                   لا  -> تحويل النص إلى كلام -> إرفاق الصوت
                   نعم -> هل التلخيص مفعّل ومتاح؟
                            لا  -> اقتطاع -> تحويل النص إلى كلام -> إرفاق الصوت
                            نعم -> تلخيص -> تحويل النص إلى كلام -> إرفاق الصوت
```

## مرجع الحقول

<AccordionGroup>
  <Accordion title="messages.tts.* في المستوى الأعلى">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      وضع النطق التلقائي. لا يرسل `inbound` الصوت إلا بعد رسالة صوتية واردة؛ ولا يرسل `tagged` الصوت إلا عندما يتضمن الرد توجيهات `[[tts:...]]` أو كتلة `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      مفتاح تبديل قديم. ينقل `openclaw doctor --fix` هذا إلى `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      يتضمن `"all"` ردود الأدوات/الكتل بالإضافة إلى الردود النهائية.
    </ParamField>
    <ParamField path="provider" type="string">
      معرّف مزوّد الكلام. عند عدم تعيينه، يستخدم OpenClaw أول مزوّد مكوّن وفق ترتيب الاختيار التلقائي في السجل. يعيد `openclaw doctor --fix` كتابة `provider: "edge"` القديم إلى `"microsoft"`.
    </ParamField>
    <ParamField path="persona" type="string">
      معرّف الشخصية النشطة من `personas`. يُطبّع إلى أحرف صغيرة.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      هوية صوتية مستقرة. الحقول: `label`، `description`، `provider`، `fallbackPolicy`، `prompt`، `providers.<provider>`. راجع [الشخصيات](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      نموذج منخفض التكلفة للتلخيص التلقائي؛ الإعداد الافتراضي هو `agents.defaults.model.primary`. يقبل `provider/model` أو اسمًا مستعارًا لنموذج مكوّن.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      يسمح للنموذج بإصدار توجيهات تحويل النص إلى كلام. القيمة الافتراضية لـ `enabled` هي `true`؛ والقيمة الافتراضية لـ `allowProvider` هي `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      إعدادات يملكها مزوّد الخدمة ومفهرسة بمعرّف مزوّد الكلام. يعيد `openclaw doctor --fix` كتابة الكتل المباشرة القديمة (`messages.tts.openai`، `.elevenlabs`، `.microsoft`، `.edge`)؛ لا تعتمد إلا `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      حد أقصى صارم لعدد أحرف إدخال تحويل النص إلى كلام. تفشل `/tts audio` و`tts.convert` و`tts.speak` إذا تم تجاوزه.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      مهلة الطلب بالمللي ثانية. تكون الأولوية لـ `timeoutMs` الخاص بكل استدعاء (أداة الوكيل، Gateway) عند تعيينه؛ وإلا فتكون الأولوية لـ `messages.tts.timeoutMs` المكوّن صراحةً على أي قيمة افتراضية للمزوّد يحددها Plugin.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      تجاوز مسار JSON المحلي للتفضيلات (المزوّد/الحد/التلخيص). الافتراضي `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">متغير البيئة: `AZURE_SPEECH_KEY` أو `AZURE_SPEECH_API_KEY` أو `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">منطقة Azure Speech (مثل `eastus`). متغير البيئة: `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">تجاوز اختياري لنقطة نهاية Azure Speech (الاسم المستعار `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName لصوت Azure. الافتراضي `en-US-JennyNeural`. الاسم المستعار القديم: `voice`.</ParamField>
    <ParamField path="lang" type="string">رمز لغة SSML. الافتراضي `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">‏`X-Microsoft-OutputFormat` في Azure للصوت القياسي. الافتراضي `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">‏`X-Microsoft-OutputFormat` في Azure لإخراج الملاحظات الصوتية. الافتراضي `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">يعود إلى `ELEVENLABS_API_KEY` أو `XI_API_KEY` كخيار احتياطي.</ParamField>
    <ParamField path="model" type="string">معرّف النموذج. الافتراضي `eleven_multilingual_v2`. تُطبّع المعرّفات القديمة `eleven_turbo_v2_5`/`eleven_turbo_v2` إلى نموذج `flash` المطابق.</ParamField>
    <ParamField path="speakerVoiceId" type="string">معرّف صوت ElevenLabs. الافتراضي `pMsXgVXv3BLzUgSXRplE`. الاسم المستعار القديم: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`، `similarityBoost`، `style` (كل منها `0..1`، والقيم الافتراضية `0.5`/`0.75`/`0`)‏، `useSpeakerBoost` ‏(`true|false`، الافتراضي `true`)‏، `speed` ‏(`0.5..2.0`، الافتراضي `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>وضع تطبيع النص.</ParamField>
    <ParamField path="languageCode" type="string">رمز ISO 639-1 من حرفين (مثل `en`، `de`).</ParamField>
    <ParamField path="seed" type="number">عدد صحيح `0..4294967295` لتحقيق أفضل حتمية ممكنة.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز عنوان URL الأساسي لواجهة API الخاصة بـ ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">يعود احتياطيًا إلى `GEMINI_API_KEY` / `GOOGLE_API_KEY`. إذا أُغفل، فيمكن لتحويل النص إلى كلام إعادة استخدام `models.providers.google.apiKey` قبل الرجوع إلى متغيرات البيئة.</ParamField>
    <ParamField path="model" type="string">نموذج Gemini لتحويل النص إلى كلام. القيمة الافتراضية `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">اسم صوت Gemini المُعدّ مسبقًا. القيمة الافتراضية `Kore`. الأسماء البديلة القديمة: `voiceName`، `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">موجّه أسلوب بلغة طبيعية يُضاف قبل النص المنطوق.</ParamField>
    <ParamField path="speakerName" type="string">تسمية اختيارية للمتحدث تُضاف قبل النص المنطوق عندما يستخدم الموجّه متحدثًا مُسمّى.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>اضبطه على `audio-profile-v1` لتغليف حقول موجّه الشخصية النشطة ضمن بنية موجّه حتمية لتحويل النص إلى كلام في Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">نص إضافي خاص بـ Google لموجّه الشخصية، يُلحق بملاحظات المخرج في القالب.</ParamField>
    <ParamField path="baseUrl" type="string">لا يُقبل سوى `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">متغير البيئة: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">عنوان URL لواجهة Gradium API عبر HTTPS على `api.gradium.ai`. القيمة الافتراضية `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">القيمة الافتراضية Emma ‏(`YTpq7expH9539ERJ`). الاسم البديل القديم: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld الأساسي

    <ParamField path="apiKey" type="string">متغير البيئة: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">القيمة الافتراضية `inworld-tts-1.5-max`. وأيضًا: `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">القيمة الافتراضية `Sarah`. الاسم البديل القديم: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">درجة حرارة أخذ العينات `0..2` (باستثناء 0).</ParamField>

  </Accordion>

  <Accordion title="CLI المحلي (tts-local-cli)">
    <ParamField path="command" type="string">ملف تنفيذي محلي أو سلسلة أمر لتحويل النص إلى كلام عبر CLI.</ParamField>
    <ParamField path="args" type="string[]">وسائط الأمر. يدعم العناصر النائبة `{{Text}}`، `{{OutputPath}}`، `{{OutputDir}}`، `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>تنسيق خرج CLI المتوقع. القيمة الافتراضية `mp3` للمرفقات الصوتية.</ParamField>
    <ParamField path="timeoutMs" type="number">مهلة الأمر بالمللي ثانية. القيمة الافتراضية `120000`.</ParamField>
    <ParamField path="cwd" type="string">دليل العمل الاختياري للأمر.</ParamField>
    <ParamField path="env" type="Record<string, string>">تجاوزات اختيارية لمتغيرات بيئة الأمر.</ParamField>

    يقتصر الخرج القياسي للأمر والصوت المُنشأ أو المُحوّل على 50 MiB. ويقتصر خرج الأخطاء القياسي التشخيصي على 1 MiB. ينهي OpenClaw الأمر ويفشل إنشاء الصوت عند تجاوز أي من الحدين.

  </Accordion>

  <Accordion title="Microsoft (من دون مفتاح API)">
    <ParamField path="enabled" type="boolean" default="true">السماح باستخدام خدمة الكلام من Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">اسم الصوت العصبي من Microsoft (مثل `en-US-MichelleNeural`). الاسم البديل القديم: `voice`. إذا كان الصوت الإنجليزي الافتراضي مستخدمًا وكان نص الرد تهيمن عليه محارف CJK، يتحول OpenClaw تلقائيًا إلى `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">رمز اللغة (مثل `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">تنسيق خرج Microsoft. القيمة الافتراضية `audio-24khz-48kbitrate-mono-mp3`. لا يدعم النقل المضمّن المعتمد على Edge جميع التنسيقات.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">سلاسل نسب مئوية (مثل `+10%`، `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">كتابة ترجمات JSON إلى جانب الملف الصوتي.</ParamField>
    <ParamField path="proxy" type="string">عنوان URL للوكيل لطلبات الكلام من Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">تجاوز مهلة الطلب (بالمللي ثانية).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>اسم بديل قديم. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">يعود احتياطيًا إلى `MINIMAX_API_KEY`. مصادقة خطة الرموز عبر `MINIMAX_OAUTH_TOKEN` أو `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.minimax.io`. متغير البيئة: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">القيمة الافتراضية `speech-2.8-hd`. متغير البيئة: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">القيمة الافتراضية `English_expressive_narrator`. متغير البيئة: `MINIMAX_TTS_VOICE_ID`. الاسم البديل القديم: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. القيمة الافتراضية `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. القيمة الافتراضية `1.0`.</ParamField>
    <ParamField path="pitch" type="number">عدد صحيح `-12..12`. القيمة الافتراضية `0`. تُحذف الأجزاء الكسرية قبل الطلب.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">يعود احتياطيًا إلى `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">معرّف نموذج OpenAI لتحويل النص إلى كلام. القيمة الافتراضية `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">اسم الصوت (مثل `alloy`، `cedar`). القيمة الافتراضية `coral`. الاسم البديل القديم: `voice`.</ParamField>
    <ParamField path="instructions" type="string">حقل OpenAI الصريح `instructions`. عند ضبطه، **لا** تُطابق حقول موجّه الشخصية تلقائيًا.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">حقول JSON إضافية تُدمج في أجسام طلبات `/audio/speech` بعد حقول OpenAI المُنشأة لتحويل النص إلى كلام. استخدم هذا لنقاط النهاية المتوافقة مع OpenAI، مثل Kokoro، التي تتطلب مفاتيح خاصة بمقدم الخدمة مثل `lang`؛ وتُتجاهل مفاتيح النموذج الأولي غير الآمنة.</ParamField>
    <ParamField path="baseUrl" type="string">
      تجاوز نقطة نهاية OpenAI لتحويل النص إلى كلام. ترتيب الحل: الإعدادات ← `OPENAI_TTS_BASE_URL` ← `https://api.openai.com/v1`. تُعامل القيم غير الافتراضية كنقاط نهاية متوافقة مع OpenAI لتحويل النص إلى كلام، لذا تُقبل أسماء النماذج والأصوات المخصصة، ويفقد `speed` فحص النطاق `0.25..4.0` الخاص به.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">متغير البيئة: `OPENROUTER_API_KEY`. يمكن إعادة استخدام `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://openrouter.ai/api/v1`. يُطبّع `https://openrouter.ai/v1` القديم.</ParamField>
    <ParamField path="model" type="string">القيمة الافتراضية `hexgrad/kokoro-82m`. الاسم البديل: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">القيمة الافتراضية `af_alloy`. الأسماء البديلة القديمة: `voice`، `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>القيمة الافتراضية `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي لمقدم الخدمة.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">متغير البيئة: `VOLCENGINE_TTS_API_KEY` أو `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">القيمة الافتراضية `seed-tts-1.0`. متغير البيئة: `VOLCENGINE_TTS_RESOURCE_ID`. استخدم `seed-tts-2.0` عندما يكون مشروعك مخولًا لاستخدام TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">ترويسة مفتاح التطبيق. القيمة الافتراضية `aGjiRDfUWi`. متغير البيئة: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">تجاوز نقطة نهاية HTTP لتحويل النص إلى كلام في Seed Speech. متغير البيئة: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">نوع الصوت. القيمة الافتراضية `en_female_anna_mars_bigtts`. متغير البيئة: `VOLCENGINE_TTS_VOICE`. الاسم البديل القديم: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">نسبة السرعة الأصلية لمقدم الخدمة، `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">وسم العاطفة الأصلي لمقدم الخدمة.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>حقول Volcengine Speech Console القديمة. متغيرات البيئة: `VOLCENGINE_TTS_APPID`، `VOLCENGINE_TTS_TOKEN`، `VOLCENGINE_TTS_CLUSTER` (القيمة الافتراضية `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">متغير البيئة: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.x.ai/v1`. متغير البيئة: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">القيمة الافتراضية `eve`. مع المصادقة، يجلب `openclaw infer tts voices --provider xai` الكتالوج المضمّن الحالي؛ ومن دون مصادقة يسرد البدائل غير المتصلة `ara`، `eve`، `leo`، `rex`، و`sal`. تُمرّر معرّفات الأصوات المخصصة للحساب حتى عند غيابها عن القائمة المضمّنة. الاسم البديل القديم: `voiceId`.</ParamField>
    <ParamField path="language" type="string">رمز لغة BCP-47 أو `auto`. القيمة الافتراضية `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>القيمة الافتراضية `mp3`.</ParamField>
    <ParamField path="speed" type="number">تجاوز السرعة الأصلي لمقدم الخدمة، `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">متغير البيئة: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">القيمة الافتراضية `https://api.xiaomimimo.com/v1`. متغير البيئة: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">القيمة الافتراضية `mimo-v2.5-tts`. متغير البيئة: `XIAOMI_TTS_MODEL`. يدعم أيضًا `mimo-v2-tts` و`mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">القيمة الافتراضية `mimo_default` لنماذج الأصوات المُعدّة مسبقًا. متغير البيئة: `XIAOMI_TTS_VOICE`. الاسم البديل القديم: `voice`. لا يُرسل مع `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>القيمة الافتراضية `mp3`. متغير البيئة: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">تعليمة أسلوب اختيارية بلغة طبيعية تُرسل كرسالة المستخدم ولا تُنطق. بالنسبة إلى `mimo-v2.5-tts-voicedesign`، تكون هذه موجّه تصميم الصوت؛ ويوفر OpenClaw قيمة افتراضية عند إغفالها.</ParamField>
  </Accordion>
</AccordionGroup>

## أداة الوكيل

تحوّل أداة `tts` النص إلى كلام وتُرجع مرفقًا صوتيًا لتسليم
الرد. في Feishu وMatrix وTelegram وWhatsApp، يُسلّم الصوت
كرسالة صوتية بدلًا من مرفق ملف. ويمكن لـ Feishu و
WhatsApp تحويل ترميز خرج تحويل النص إلى كلام غير المشفّر بتنسيق Opus في هذا المسار عندما يكون `ffmpeg`
متاحًا.

يرسل WhatsApp الصوت عبر Baileys كملاحظة صوتية بنمط PTT ‏(`audio` مع
`ptt: true`) ويرسل النص المرئي **بشكل منفصل** عن صوت PTT لأن
العملاء لا يعرضون التسميات التوضيحية على الملاحظات الصوتية بصورة متسقة.

تقبل الأداة الحقلين الاختياريين `channel` و`timeoutMs`؛ ويمثل `timeoutMs`
مهلة طلب مقدم الخدمة لكل استدعاء بالمللي ثانية. تتجاوز القيم الخاصة بكل استدعاء
`messages.tts.timeoutMs`؛ وتتجاوز مهل تحويل النص إلى كلام المُعدّة أي قيمة افتراضية
لمقدم الخدمة يحددها Plugin.

## استدعاء Gateway عن بُعد

| الطريقة            | الغرض                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | قراءة حالة تحويل النص إلى كلام الحالية والمحاولة الأخيرة.     |
| `tts.enable`      | تعيين التفضيل التلقائي المحلي إلى `always`.       |
| `tts.disable`     | تعيين التفضيل التلقائي المحلي إلى `off`.          |
| `tts.convert`     | تحويل نص إلى صوت لمرة واحدة.                        |
| `tts.setProvider` | تعيين تفضيل المزوّد المحلي.               |
| `tts.personas`    | سرد الشخصيات المُعدّة والشخصية النشطة. |
| `tts.setPersona`  | تعيين تفضيل الشخصية المحلي.                |
| `tts.providers`   | سرد المزوّدين المُعدّين وحالاتهم.        |

## روابط الخدمات

- [دليل OpenAI لتحويل النص إلى كلام](https://platform.openai.com/docs/guides/text-to-speech)
- [مرجع واجهة OpenAI Audio API](https://platform.openai.com/docs/api-reference/audio)
- [تحويل النص إلى كلام عبر Azure Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [مزوّد Azure Speech](/ar/providers/azure-speech)
- [تحويل النص إلى كلام من ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [المصادقة في ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ar/providers/gradium)
- [واجهة Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [واجهة MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [واجهة Volcengine TTS HTTP API](/ar/providers/volcengine#text-to-speech)
- [تركيب الكلام من Xiaomi MiMo](/ar/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [تنسيقات إخراج الكلام من Microsoft](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [تحويل النص إلى كلام من xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## مواضيع ذات صلة

- [نظرة عامة على الوسائط](/ar/tools/media-overview)
- [توليد الموسيقى](/ar/tools/music-generation)
- [توليد الفيديو](/ar/tools/video-generation)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
- [Plugin المكالمات الصوتية](/ar/plugins/voice-call)
