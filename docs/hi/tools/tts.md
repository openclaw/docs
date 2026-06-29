---
read_when:
    - जवाबों के लिए टेक्स्ट-टू-स्पीच सक्षम करना
    - TTS प्रदाता, फ़ॉलबैक श्रृंखला या व्यक्तित्व को कॉन्फ़िगर करना
    - /tts आदेशों या निर्देशों का उपयोग करना
sidebarTitle: Text to speech (TTS)
summary: भेजे जाने वाले उत्तरों के लिए पाठ-से-वाणी — प्रदाता, पर्सोना, स्लैश कमांड, और प्रति-चैनल आउटपुट
title: टेक्स्ट-टू-स्पीच
x-i18n:
    generated_at: "2026-06-29T00:25:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw आउटबाउंड उत्तरों को **14 स्पीच प्रदाताओं** में ऑडियो में बदल सकता है
और Feishu, Matrix, Telegram, और WhatsApp पर नेटिव वॉइस संदेश,
बाकी सभी जगह ऑडियो अटैचमेंट, और टेलीफोनी तथा Talk के लिए PCM/Ulaw स्ट्रीम डिलीवर कर सकता है।

TTS, Talk के `stt-tts` मोड का स्पीच-आउटपुट हिस्सा है। प्रदाता-नेटिव
`realtime` Talk सत्र इस TTS पथ को कॉल करने के बजाय रियलटाइम प्रदाता के अंदर
स्पीच सिंथेसाइज़ करते हैं, जबकि `transcription` सत्र सहायक की
वॉइस प्रतिक्रिया सिंथेसाइज़ नहीं करते।

## त्वरित शुरुआत

<Steps>
  <Step title="Pick a provider">
    OpenAI और ElevenLabs सबसे भरोसेमंद होस्टेड विकल्प हैं। Microsoft और
    Local CLI बिना API कुंजी के काम करते हैं। पूरी सूची के लिए [प्रदाता मैट्रिक्स](#supported-providers)
    देखें।
  </Step>
  <Step title="Set the API key">
    अपने प्रदाता के लिए env var निर्यात करें (उदाहरण के लिए `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`)। Microsoft और Local CLI को किसी कुंजी की ज़रूरत नहीं है।
  </Step>
  <Step title="Enable in config">
    `messages.tts.auto: "always"` और `messages.tts.provider` सेट करें:

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
  <Step title="Try it in chat">
    `/tts status` वर्तमान स्थिति दिखाता है। `/tts audio Hello from OpenClaw`
    एक बार का ऑडियो उत्तर भेजता है।
  </Step>
</Steps>

<Note>
Auto-TTS डिफ़ॉल्ट रूप से **बंद** है। जब `messages.tts.provider` सेट नहीं होता,
OpenClaw रजिस्ट्री ऑटो-सेलेक्ट क्रम में पहले कॉन्फ़िगर किए गए प्रदाता को चुनता है।
बिल्ट-इन `tts` एजेंट टूल केवल स्पष्ट-इरादा है: सामान्य चैट
टेक्स्ट ही रहती है, जब तक उपयोगकर्ता ऑडियो न मांगे, `/tts` का उपयोग न करे, या Auto-TTS/directive
स्पीच सक्षम न करे।
</Note>

## समर्थित प्रदाता

| प्रदाता          | प्रमाणीकरण                                                                                                             | नोट्स                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (साथ ही `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)          | नेटिव Ogg/Opus वॉइस-नोट आउटपुट और टेलीफोनी।                                            |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-संगत TTS। डिफ़ॉल्ट `hexgrad/Kokoro-82M` है।                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` या `XI_API_KEY`                                                                             | वॉइस क्लोनिंग, बहुभाषी, `seed` के माध्यम से निर्धारक; Discord वॉइस प्लेबैक के लिए स्ट्रीम किया गया। |
| **Google Gemini** | `GEMINI_API_KEY` या `GOOGLE_API_KEY`                                                                             | Gemini API बैच TTS; `promptTemplate: "audio-profile-v1"` के माध्यम से persona-aware।               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | वॉइस-नोट और टेलीफोनी आउटपुट।                                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | स्ट्रीमिंग TTS API। नेटिव Opus वॉइस-नोट और PCM टेलीफोनी।                                |
| **Local CLI**     | कोई नहीं                                                                                                             | कॉन्फ़िगर किया गया स्थानीय TTS कमांड चलाता है।                                                        |
| **Microsoft**     | कोई नहीं                                                                                                             | `node-edge-tts` के माध्यम से सार्वजनिक Edge न्यूरल TTS। सर्वोत्तम-प्रयास, कोई SLA नहीं।                            |
| **MiniMax**       | `MINIMAX_API_KEY` (या Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API। डिफ़ॉल्ट `speech-2.8-hd` है।                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | ऑटो-सारांश के लिए भी उपयोग किया जाता है; persona `instructions` का समर्थन करता है।                                |
| **OpenRouter**    | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey` का पुनः उपयोग कर सकता है)                                            | डिफ़ॉल्ट मॉडल `hexgrad/kokoro-82m`।                                                         |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` या `BYTEPLUS_SEED_SPEECH_API_KEY` (लेगेसी AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API।                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | साझा इमेज, वीडियो, और स्पीच प्रदाता।                                                   |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI बैच TTS। नेटिव Opus वॉइस-नोट समर्थित **नहीं** है।                                 |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi चैट completions के माध्यम से MiMo TTS।                                                   |

यदि कई प्रदाता कॉन्फ़िगर किए गए हैं, तो चयनित प्रदाता पहले उपयोग किया जाता है और
बाकी fallback विकल्प होते हैं। ऑटो-सारांश `summaryModel` (या
`agents.defaults.model.primary`) का उपयोग करता है, इसलिए यदि आप सारांश सक्षम रखते हैं
तो उस प्रदाता का भी प्रमाणीकरण होना चाहिए।

<Warning>
बंडल किया गया **Microsoft** प्रदाता `node-edge-tts` के माध्यम से Microsoft Edge की ऑनलाइन न्यूरल TTS
सेवा का उपयोग करता है। यह प्रकाशित SLA या quota के बिना एक सार्वजनिक वेब सेवा है —
इसे सर्वोत्तम-प्रयास मानें। लेगेसी प्रदाता id `edge` को
`microsoft` में normalize किया जाता है और `openclaw doctor --fix` persisted
कॉन्फ़िग को फिर से लिखता है; नए कॉन्फ़िग हमेशा `microsoft` का उपयोग करें।
</Warning>

## कॉन्फ़िगरेशन

TTS कॉन्फ़िग `~/.openclaw/openclaw.json` में `messages.tts` के अंतर्गत रहता है। एक
preset चुनें और प्रदाता ब्लॉक को अनुकूलित करें:

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

Xiaomi `mimo-v2.5-tts-voicedesign` के लिए, `speakerVoice` छोड़ दें और `style` को
वॉइस-डिज़ाइन prompt पर सेट करें। OpenClaw उस prompt को TTS `user` संदेश के रूप में भेजता है
और voicedesign मॉडल के लिए `audio.voice` नहीं भेजता।

### प्रति-एजेंट वॉइस ओवरराइड्स

जब एक एजेंट को अलग प्रदाता, आवाज़, मॉडल, पर्सोना, या ऑटो-TTS मोड के साथ बोलना चाहिए, तो `agents.list[].tts` का उपयोग करें। एजेंट ब्लॉक `messages.tts` के ऊपर डीप-मर्ज होता है, इसलिए प्रदाता क्रेडेंशियल वैश्विक प्रदाता कॉन्फिग में रह सकते हैं:

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

प्रति-एजेंट पर्सोना पिन करने के लिए, प्रदाता कॉन्फिग के साथ `agents.list[].tts.persona` सेट करें — यह केवल उस एजेंट के लिए वैश्विक `messages.tts.persona` को ओवरराइड करता है।

स्वचालित उत्तरों, `/tts audio`, `/tts status`, और `tts` एजेंट टूल के लिए प्राथमिकता क्रम:

1. `messages.tts`
2. सक्रिय `agents.list[].tts`
3. चैनल ओवरराइड, जब चैनल `channels.<channel>.tts` का समर्थन करता है
4. खाता ओवरराइड, जब चैनल `channels.<channel>.accounts.<id>.tts` पास करता है
5. इस होस्ट के लिए स्थानीय `/tts` प्राथमिकताएं
6. इनलाइन `[[tts:...]]` निर्देश, जब [मॉडल ओवरराइड](#model-driven-directives) सक्षम हों

चैनल और खाता ओवरराइड `messages.tts` जैसी ही संरचना का उपयोग करते हैं और पहले की परतों के ऊपर डीप-मर्ज होते हैं, इसलिए साझा प्रदाता क्रेडेंशियल `messages.tts` में रह सकते हैं, जबकि कोई चैनल या bot खाता केवल स्पीकर आवाज़, मॉडल, पर्सोना, या ऑटो मोड बदलता है:

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

## पर्सोना

एक **पर्सोना** एक स्थिर बोली जाने वाली पहचान है जिसे प्रदाताओं में नियतात्मक रूप से लागू किया जा सकता है। यह एक प्रदाता को प्राथमिकता दे सकता है, प्रदाता-निरपेक्ष प्रॉम्प्ट आशय परिभाषित कर सकता है, और आवाज़ों, मॉडलों, प्रॉम्प्ट टेम्पलेटों, seeds, और voice settings के लिए प्रदाता-विशिष्ट bindings रख सकता है।

### न्यूनतम पर्सोना

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

### पूर्ण पर्सोना (प्रदाता-निरपेक्ष प्रॉम्प्ट)

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

### पर्सोना समाधान

सक्रिय पर्सोना नियतात्मक रूप से चुना जाता है:

1. `/tts persona <id>` स्थानीय प्राथमिकता, यदि सेट हो।
2. `messages.tts.persona`, यदि सेट हो।
3. कोई पर्सोना नहीं।

प्रदाता चयन explicit-first चलता है:

1. प्रत्यक्ष ओवरराइड (CLI, gateway, Talk, अनुमत TTS निर्देश)।
2. `/tts provider <id>` स्थानीय प्राथमिकता।
3. सक्रिय पर्सोना का `provider`।
4. `messages.tts.provider`।
5. रजिस्ट्री ऑटो-चयन।

हर प्रदाता प्रयास के लिए, OpenClaw इस क्रम में कॉन्फिग मर्ज करता है:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. विश्वसनीय अनुरोध ओवरराइड
4. अनुमत मॉडल-उत्सर्जित TTS निर्देश ओवरराइड

### प्रदाता पर्सोना प्रॉम्प्ट का उपयोग कैसे करते हैं

पर्सोना प्रॉम्प्ट फ़ील्ड (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`) **प्रदाता-निरपेक्ष** हैं। हर प्रदाता तय करता है कि उनका उपयोग कैसे करना है:

<AccordionGroup>
  <Accordion title="Google Gemini">
    पर्सोना प्रॉम्प्ट फ़ील्ड को Gemini TTS प्रॉम्प्ट संरचना में **केवल तब** लपेटता है जब प्रभावी Google प्रदाता कॉन्फिग `promptTemplate: "audio-profile-v1"` या `personaPrompt` सेट करता है। पुराने `audioProfile` और `speakerName` फ़ील्ड अब भी Google-विशिष्ट प्रॉम्प्ट टेक्स्ट के रूप में आगे जोड़े जाते हैं। `[[tts:text]]` ब्लॉक के अंदर `[whispers]` या `[laughs]` जैसे इनलाइन ऑडियो टैग Gemini transcript के अंदर संरक्षित रहते हैं; OpenClaw ये टैग जनरेट नहीं करता।
  </Accordion>
  <Accordion title="OpenAI">
    पर्सोना प्रॉम्प्ट फ़ील्ड को अनुरोध के `instructions` फ़ील्ड में **केवल तब** मैप करता है जब कोई स्पष्ट OpenAI `instructions` कॉन्फिग न किया गया हो। स्पष्ट `instructions` हमेशा प्राथमिक रहता है।
  </Accordion>
  <Accordion title="Other providers">
    केवल `personas.<id>.providers.<provider>` के अंतर्गत प्रदाता-विशिष्ट पर्सोना bindings का उपयोग करें। पर्सोना प्रॉम्प्ट फ़ील्ड तब तक अनदेखे किए जाते हैं जब तक प्रदाता अपना पर्सोना-प्रॉम्प्ट मैपिंग लागू न करे।
  </Accordion>
</AccordionGroup>

### फ़ॉलबैक नीति

`fallbackPolicy` तब व्यवहार नियंत्रित करता है जब किसी पर्सोना के पास प्रयास किए गए प्रदाता के लिए **कोई binding नहीं** होता:

| नीति                | व्यवहार                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **डिफ़ॉल्ट।** प्रदाता-निरपेक्ष प्रॉम्प्ट फ़ील्ड उपलब्ध रहते हैं; प्रदाता उनका उपयोग कर सकता है या उन्हें अनदेखा कर सकता है।                   |
| `provider-defaults` | उस प्रयास के लिए पर्सोना को प्रॉम्प्ट तैयारी से हटा दिया जाता है; अन्य प्रदाताओं पर फ़ॉलबैक जारी रहते हुए प्रदाता अपने neutral defaults उपयोग करता है। |
| `fail`              | उस प्रदाता प्रयास को `reasonCode: "not_configured"` और `personaBinding: "missing"` के साथ छोड़ दें। फ़ॉलबैक प्रदाता अब भी आजमाए जाते हैं।        |

पूरा TTS अनुरोध केवल तब विफल होता है जब **हर** प्रयास किया गया प्रदाता छोड़ा जाता है या विफल होता है।

Talk सत्र प्रदाता चयन सत्र-स्कोप्ड है। Talk क्लाइंट को `talk.catalog` से प्रदाता ids, मॉडल ids, voice ids, और locales चुनने चाहिए और उन्हें Talk सत्र या handoff अनुरोध के माध्यम से पास करना चाहिए। voice सत्र खोलने से `messages.tts` या वैश्विक Talk प्रदाता defaults बदलने नहीं चाहिए।

## मॉडल-संचालित निर्देश

डिफ़ॉल्ट रूप से, सहायक एक ही उत्तर के लिए आवाज़, मॉडल, या गति ओवरराइड करने के लिए `[[tts:...]]` निर्देश उत्सर्जित **कर सकता है**, साथ ही expressive cues के लिए एक वैकल्पिक `[[tts:text]]...[[/tts:text]]` ब्लॉक, जो केवल ऑडियो में दिखाई देना चाहिए:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

जब `messages.tts.auto` `"tagged"` होता है, ऑडियो ट्रिगर करने के लिए **निर्देश आवश्यक** होते हैं। Streaming block delivery चैनल के देखने से पहले visible text से निर्देश हटा देता है, भले ही वे adjacent blocks में विभाजित हों।

`provider=...` तब तक अनदेखा किया जाता है जब तक `modelOverrides.allowProvider: true` न हो। जब कोई उत्तर `provider=...` घोषित करता है, तो उस निर्देश की अन्य keys केवल उसी प्रदाता द्वारा parse की जाती हैं; unsupported keys हटा दी जाती हैं और TTS निर्देश warnings के रूप में रिपोर्ट की जाती हैं।

**उपलब्ध निर्देश keys:**

- `provider` (registered provider id; `allowProvider: true` आवश्यक)
- `speakerVoice` / `speakerVoiceId` (legacy aliases: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax volume, 0–10)
- `pitch` (MiniMax integer pitch, −12 से 12; fractional values काटे जाते हैं)
- `emotion` (Volcengine emotion tag)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**मॉडल ओवरराइड पूरी तरह अक्षम करें:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**अन्य knobs configurable रखते हुए प्रदाता switching की अनुमति दें:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Slash commands

एकल कमांड `/tts`। Discord पर, OpenClaw `/voice` भी register करता है क्योंकि `/tts` एक built-in Discord कमांड है — text `/tts ...` अब भी काम करता है।

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
कमांड के लिए authorized sender आवश्यक है (allowlist/owner नियम लागू होते हैं) और या तो `commands.text` या native command registration सक्षम होना चाहिए।
</Note>

व्यवहार नोट्स:

- `/tts on` स्थानीय TTS प्राथमिकता को `always` में लिखता है; `/tts off` इसे `off` में लिखता है।
- `/tts chat on|off|default` वर्तमान chat के लिए session-scoped auto-TTS override लिखता है।
- `/tts persona <id>` स्थानीय पर्सोना प्राथमिकता लिखता है; `/tts persona off` इसे साफ़ करता है।
- `/tts latest` वर्तमान session transcript से नवीनतम assistant reply पढ़ता है और उसे एक बार audio के रूप में भेजता है। यह duplicate voice sends दबाने के लिए उस reply का केवल hash session entry पर store करता है।
- `/tts audio` एक one-off audio reply generate करता है (TTS को on **नहीं** करता)।
- `limit` और `summary` **local prefs** में store होते हैं, main config में नहीं।
- `/tts status` में नवीनतम प्रयास के लिए fallback diagnostics शामिल होते हैं — `Fallback: <primary> -> <used>`, `Attempts: ...`, और प्रति-प्रयास detail (`provider:outcome(reasonCode) latency`)।
- `/status` सक्रिय TTS mode के साथ configured provider, model, voice, और sanitized custom endpoint metadata दिखाता है जब TTS enabled हो।

## प्रति-यूज़र प्राथमिकताएं

Slash commands स्थानीय ओवरराइड `prefsPath` में लिखते हैं। डिफ़ॉल्ट `~/.openclaw/settings/tts.json` है; इसे `OPENCLAW_TTS_PREFS` env var या `messages.tts.prefsPath` से override करें।

| Stored field | प्रभाव                                      |
| ------------ | ------------------------------------------ |
| `auto`       | स्थानीय auto-TTS override (`always`, `off`, …) |
| `provider`   | स्थानीय primary provider override          |
| `persona`    | स्थानीय persona override                   |
| `maxLength`  | Summary threshold (डिफ़ॉल्ट `1500` chars)  |
| `summarize`  | Summary toggle (डिफ़ॉल्ट `true`)           |

ये उस host के लिए `messages.tts` और सक्रिय `agents.list[].tts` ब्लॉक से प्रभावी config को override करते हैं।

## आउटपुट फ़ॉर्मैट (fixed)

TTS voice delivery channel-capability driven है। Channel plugins विज्ञापित करते हैं कि voice-style TTS को native `voice-note` target के लिए providers से पूछना चाहिए या सामान्य `audio-file` synthesis रखना चाहिए और केवल compatible output को voice delivery के लिए mark करना चाहिए।

- **वॉइस-नोट सक्षम चैनल**: वॉइस-नोट उत्तर Opus को प्राथमिकता देते हैं (ElevenLabs से `opus_48000_64`, OpenAI से `opus`)।
  - 48kHz / 64kbps वॉइस संदेश के लिए स्पष्टता और आकार का अच्छा संतुलन है।
- **Feishu / WhatsApp**: जब कोई वॉइस-नोट उत्तर MP3/WebM/WAV/M4A
  या किसी अन्य संभावित ऑडियो फ़ाइल के रूप में बनता है, तो channel plugin नेटिव वॉइस संदेश भेजने से पहले
  `ffmpeg` के साथ उसे 48kHz Ogg/Opus में ट्रांसकोड करता है। WhatsApp
  परिणाम को Baileys `audio` पेलोड के माध्यम से `ptt: true` और
  `audio/ogg; codecs=opus` के साथ भेजता है। यदि रूपांतरण विफल होता है, तो Feishu को मूल
  फ़ाइल अटैचमेंट के रूप में मिलती है; WhatsApp असंगत
  PTT पेलोड पोस्ट करने के बजाय भेजने में विफल होता है।
- **अन्य चैनल**: MP3 (ElevenLabs से `mp3_44100_128`, OpenAI से `mp3`)।
  - 44.1kHz / 128kbps वाणी की स्पष्टता के लिए डिफ़ॉल्ट संतुलन है।
- **MiniMax**: सामान्य ऑडियो अटैचमेंट के लिए MP3 (`speech-2.8-hd` मॉडल, 32kHz सैंपल दर)। चैनल-द्वारा-घोषित वॉइस-नोट लक्ष्यों के लिए, जब चैनल ट्रांसकोडिंग घोषित करता है, OpenClaw डिलीवरी से पहले `ffmpeg` के साथ MiniMax MP3 को 48kHz Opus में ट्रांसकोड करता है।
- **Xiaomi MiMo**: डिफ़ॉल्ट रूप से MP3, या कॉन्फ़िगर होने पर WAV। चैनल-द्वारा-घोषित वॉइस-नोट लक्ष्यों के लिए, जब चैनल ट्रांसकोडिंग घोषित करता है, OpenClaw डिलीवरी से पहले `ffmpeg` के साथ Xiaomi आउटपुट को 48kHz Opus में ट्रांसकोड करता है।
- **स्थानीय CLI**: कॉन्फ़िगर किए गए `outputFormat` का उपयोग करता है। वॉइस-नोट लक्ष्यों को
  Ogg/Opus में बदला जाता है और टेलीफोनी आउटपुट को `ffmpeg` के साथ
  कच्चे 16 kHz मोनो PCM में बदला जाता है।
- **Google Gemini**: Gemini API TTS कच्चा 24kHz PCM लौटाता है। OpenClaw उसे ऑडियो अटैचमेंट के लिए WAV के रूप में लपेटता है, वॉइस-नोट लक्ष्यों के लिए 48kHz Opus में ट्रांसकोड करता है, और Talk/टेलीफोनी के लिए सीधे PCM लौटाता है।
- **Gradium**: ऑडियो अटैचमेंट के लिए WAV, वॉइस-नोट लक्ष्यों के लिए Opus, और टेलीफोनी के लिए 8 kHz पर `ulaw_8000`।
- **Inworld**: सामान्य ऑडियो अटैचमेंट के लिए MP3, वॉइस-नोट लक्ष्यों के लिए नेटिव `OGG_OPUS`, और Talk/टेलीफोनी के लिए 22050 Hz पर कच्चा `PCM`।
- **xAI**: डिफ़ॉल्ट रूप से MP3; `responseFormat` `mp3`, `wav`, `pcm`, `mulaw`, या `alaw` हो सकता है। OpenClaw xAI के बैच REST TTS एंडपॉइंट का उपयोग करता है और पूरा ऑडियो अटैचमेंट लौटाता है; इस प्रदाता पथ द्वारा xAI का स्ट्रीमिंग TTS WebSocket उपयोग नहीं किया जाता। इस पथ द्वारा नेटिव Opus वॉइस-नोट फ़ॉर्मैट समर्थित नहीं है।
- **Microsoft**: `microsoft.outputFormat` का उपयोग करता है (डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`)।
  - बंडल किया गया ट्रांसपोर्ट `outputFormat` स्वीकार करता है, लेकिन सेवा से सभी फ़ॉर्मैट उपलब्ध नहीं होते।
  - आउटपुट फ़ॉर्मैट मान Microsoft Speech आउटपुट फ़ॉर्मैट का पालन करते हैं (Ogg/WebM Opus सहित)।
  - Telegram `sendVoice` OGG/MP3/M4A स्वीकार करता है; यदि आपको
    सुनिश्चित Opus वॉइस संदेश चाहिए, तो OpenAI/ElevenLabs का उपयोग करें।
  - यदि कॉन्फ़िगर किया गया Microsoft आउटपुट फ़ॉर्मैट विफल होता है, तो OpenClaw MP3 के साथ पुनः प्रयास करता है।

OpenAI/ElevenLabs आउटपुट फ़ॉर्मैट प्रति चैनल निश्चित हैं (ऊपर देखें)।

## ऑटो-TTS व्यवहार

जब `messages.tts.auto` सक्षम होता है, OpenClaw:

- यदि उत्तर में पहले से संरचित मीडिया है, तो TTS छोड़ देता है।
- बहुत छोटे उत्तर (10 वर्णों से कम) छोड़ देता है।
- जब सारांश सक्षम होते हैं, तो लंबे उत्तरों का सारांश बनाता है,
  `summaryModel` (या `agents.defaults.model.primary`) का उपयोग करके।
- उत्पन्न ऑडियो को उत्तर से अटैच करता है।
- `mode: "final"` में, टेक्स्ट स्ट्रीम पूरी होने के बाद भी स्ट्रीम किए गए अंतिम उत्तरों के लिए
  केवल-ऑडियो TTS भेजता है; उत्पन्न मीडिया सामान्य उत्तर अटैचमेंट की तरह उसी
  चैनल मीडिया सामान्यीकरण से गुजरता है।

यदि उत्तर `maxLength` से अधिक है और सारांश बंद है (या
सारांश मॉडल के लिए कोई API कुंजी नहीं है), तो ऑडियो छोड़ दिया जाता है और सामान्य टेक्स्ट उत्तर भेजा जाता है।

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## चैनल के अनुसार आउटपुट फ़ॉर्मैट

| लक्ष्य                                | फ़ॉर्मैट                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | वॉइस-नोट उत्तर **Opus** को प्राथमिकता देते हैं (ElevenLabs से `opus_48000_64`, OpenAI से `opus`)। 48 kHz / 64 kbps स्पष्टता और आकार का संतुलन रखता है। |
| अन्य चैनल                        | **MP3** (ElevenLabs से `mp3_44100_128`, OpenAI से `mp3`)। वाणी के लिए 44.1 kHz / 128 kbps डिफ़ॉल्ट।                                 |
| Talk / टेलीफोनी                      | प्रदाता-नेटिव **PCM** (Inworld 22050 Hz, Google 24 kHz), या टेलीफोनी के लिए Gradium से `ulaw_8000`।                                 |

प्रति-प्रदाता नोट्स:

- **Feishu / WhatsApp ट्रांसकोडिंग:** जब कोई वॉइस-नोट उत्तर MP3/WebM/WAV/M4A के रूप में आता है, तो channel plugin `ffmpeg` के साथ उसे 48 kHz Ogg/Opus में ट्रांसकोड करता है। WhatsApp Baileys के माध्यम से `ptt: true` और `audio/ogg; codecs=opus` के साथ भेजता है। यदि रूपांतरण विफल होता है: Feishu मूल फ़ाइल अटैच करने पर वापस जाता है; WhatsApp असंगत PTT पेलोड पोस्ट करने के बजाय भेजने में विफल होता है।
- **MiniMax / Xiaomi MiMo:** डिफ़ॉल्ट MP3 (MiniMax `speech-2.8-hd` के लिए 32 kHz); `ffmpeg` के ज़रिए वॉइस-नोट लक्ष्यों के लिए 48 kHz Opus में ट्रांसकोड किया जाता है।
- **स्थानीय CLI:** कॉन्फ़िगर किए गए `outputFormat` का उपयोग करता है। वॉइस-नोट लक्ष्यों को Ogg/Opus में और टेलीफोनी आउटपुट को कच्चे 16 kHz मोनो PCM में बदला जाता है।
- **Google Gemini:** कच्चा 24 kHz PCM लौटाता है। OpenClaw अटैचमेंट के लिए WAV के रूप में लपेटता है, वॉइस-नोट लक्ष्यों के लिए 48 kHz Opus में ट्रांसकोड करता है, Talk/टेलीफोनी के लिए सीधे PCM लौटाता है।
- **Inworld:** MP3 अटैचमेंट, नेटिव `OGG_OPUS` वॉइस-नोट, Talk/टेलीफोनी के लिए कच्चा `PCM` 22050 Hz।
- **xAI:** डिफ़ॉल्ट रूप से MP3; `responseFormat` `mp3|wav|pcm|mulaw|alaw` हो सकता है। xAI के बैच REST एंडपॉइंट का उपयोग करता है — स्ट्रीमिंग WebSocket TTS का उपयोग **नहीं** किया जाता। नेटिव Opus वॉइस-नोट फ़ॉर्मैट समर्थित **नहीं** है।
- **Microsoft:** `microsoft.outputFormat` का उपयोग करता है (डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`)। Telegram `sendVoice` OGG/MP3/M4A स्वीकार करता है; यदि आपको सुनिश्चित Opus वॉइस संदेश चाहिए, तो OpenAI/ElevenLabs का उपयोग करें। यदि कॉन्फ़िगर किया गया Microsoft फ़ॉर्मैट विफल होता है, तो OpenClaw MP3 के साथ पुनः प्रयास करता है।

OpenAI और ElevenLabs आउटपुट फ़ॉर्मैट ऊपर सूचीबद्ध अनुसार प्रति चैनल निश्चित हैं।

## फ़ील्ड संदर्भ

<AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      ऑटो-TTS मोड। `inbound` केवल इनबाउंड वॉइस संदेश के बाद ऑडियो भेजता है; `tagged` केवल तब ऑडियो भेजता है जब उत्तर में `[[tts:...]]` निर्देश या `[[tts:text]]` ब्लॉक शामिल हो।
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      लेगेसी टॉगल। `openclaw doctor --fix` इसे `auto` में माइग्रेट करता है।
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` अंतिम उत्तरों के अतिरिक्त टूल/ब्लॉक उत्तर भी शामिल करता है।
    </ParamField>
    <ParamField path="provider" type="string">
      स्पीच प्रदाता id। सेट न होने पर, OpenClaw रजिस्ट्री ऑटो-सेलेक्ट क्रम में पहले कॉन्फ़िगर किए गए प्रदाता का उपयोग करता है। लेगेसी `provider: "edge"` को `openclaw doctor --fix` द्वारा `"microsoft"` में फिर से लिखा जाता है।
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` से सक्रिय persona id। लोअरकेस में सामान्यीकृत।
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      स्थिर बोली जाने वाली पहचान। फ़ील्ड: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`। [Personas](#personas) देखें।
    </ParamField>
    <ParamField path="summaryModel" type="string">
      ऑटो-सारांश के लिए सस्ता मॉडल; डिफ़ॉल्ट `agents.defaults.model.primary`। `provider/model` या कॉन्फ़िगर किया गया मॉडल alias स्वीकार करता है।
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      मॉडल को TTS निर्देश उत्सर्जित करने दें। `enabled` का डिफ़ॉल्ट `true` है; `allowProvider` का डिफ़ॉल्ट `false` है।
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      स्पीच प्रदाता id से keyed प्रदाता-स्वामित्व वाली सेटिंग्स। लेगेसी डायरेक्ट ब्लॉक (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) `openclaw doctor --fix` द्वारा फिर से लिखे जाते हैं; केवल `messages.tts.providers.<id>` कमिट करें।
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS इनपुट वर्णों के लिए कठोर सीमा। अधिक होने पर `/tts audio` विफल होता है।
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      अनुरोध timeout मिलीसेकंड में।
    </ParamField>
    <ParamField path="prefsPath" type="string">
      स्थानीय prefs JSON पथ (प्रदाता/सीमा/सारांश) को override करें। डिफ़ॉल्ट `~/.openclaw/settings/tts.json`।
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, या `SPEECH_KEY`।</ParamField>
    <ParamField path="region" type="string">Azure Speech क्षेत्र (जैसे `eastus`)। Env: `AZURE_SPEECH_REGION` या `SPEECH_REGION`।</ParamField>
    <ParamField path="endpoint" type="string">वैकल्पिक Azure Speech एंडपॉइंट override (alias `baseUrl`)।</ParamField>
    <ParamField path="speakerVoice" type="string">Azure voice ShortName। डिफ़ॉल्ट `en-US-JennyNeural`। लेगेसी alias: `voice`।</ParamField>
    <ParamField path="lang" type="string">SSML भाषा कोड। डिफ़ॉल्ट `en-US`।</ParamField>
    <ParamField path="outputFormat" type="string">मानक ऑडियो के लिए Azure `X-Microsoft-OutputFormat`। डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`।</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">वॉइस-नोट आउटपुट के लिए Azure `X-Microsoft-OutputFormat`। डिफ़ॉल्ट `ogg-24khz-16bit-mono-opus`।</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` या `XI_API_KEY` पर वापस जाता है।</ParamField>
    <ParamField path="model" type="string">मॉडल id (जैसे `eleven_multilingual_v2`, `eleven_v3`)।</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs voice id। लेगेसी alias: `voiceId`।</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (प्रत्येक `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = सामान्य)।
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>टेक्स्ट सामान्यीकरण मोड।</ParamField>
    <ParamField path="languageCode" type="string">2-अक्षर ISO 639-1 (जैसे `en`, `de`)।</ParamField>
    <ParamField path="seed" type="number">best-effort determinism के लिए पूर्णांक `0..4294967295`।</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API base URL को override करें।</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` पर वापस जाता है। यदि छोड़ा गया है, तो TTS env fallback से पहले `models.providers.google.apiKey` का पुनः उपयोग कर सकता है।</ParamField>
    <ParamField path="model" type="string">Gemini TTS मॉडल। डिफ़ॉल्ट `gemini-3.1-flash-tts-preview`।</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini prebuilt voice नाम। डिफ़ॉल्ट `Kore`। लेगेसी aliases: `voiceName`, `voice`।</ParamField>
    <ParamField path="audioProfile" type="string">बोले गए टेक्स्ट से पहले जोड़ा गया प्राकृतिक-भाषा शैली prompt।</ParamField>
    <ParamField path="speakerName" type="string">जब आपका prompt नामित speaker का उपयोग करता है, तो बोले गए टेक्स्ट से पहले जोड़ा गया वैकल्पिक speaker label।</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>सक्रिय persona prompt फ़ील्ड को deterministic Gemini TTS prompt संरचना में लपेटने के लिए `audio-profile-v1` पर सेट करें।</ParamField>
    <ParamField path="personaPrompt" type="string">टेम्पलेट के Director's Notes में जोड़ा गया Google-विशिष्ट अतिरिक्त persona prompt टेक्स्ट।</ParamField>
    <ParamField path="baseUrl" type="string">केवल `https://generativelanguage.googleapis.com` स्वीकार किया जाता है।</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">पर्यावरण: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट Emma (`YTpq7expH9539ERJ`). पुराना उपनाम: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld प्राथमिक

    <ParamField path="apiKey" type="string">पर्यावरण: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">डिफ़ॉल्ट `inworld-tts-1.5-max`. यह भी: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट `Sarah`. पुराना उपनाम: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">सैंपलिंग तापमान `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS के लिए स्थानीय executable या command string.</ParamField>
    <ParamField path="args" type="string[]">कमांड arguments. `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` placeholders का समर्थन करता है.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>अपेक्षित CLI आउटपुट फ़ॉर्मैट. ऑडियो attachments के लिए डिफ़ॉल्ट `mp3`.</ParamField>
    <ParamField path="timeoutMs" type="number">कमांड timeout मिलीसेकंड में. डिफ़ॉल्ट `120000`.</ParamField>
    <ParamField path="cwd" type="string">वैकल्पिक command working directory.</ParamField>
    <ParamField path="env" type="Record<string, string>">कमांड के लिए वैकल्पिक environment overrides.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft speech उपयोग की अनुमति दें.</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft neural voice नाम (जैसे `en-US-MichelleNeural`). पुराना उपनाम: `voice`.</ParamField>
    <ParamField path="lang" type="string">भाषा कोड (जैसे `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft आउटपुट फ़ॉर्मैट. डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`. bundled Edge-backed transport सभी फ़ॉर्मैट का समर्थन नहीं करता.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">प्रतिशत strings (जैसे `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">ऑडियो फ़ाइल के साथ JSON subtitles लिखें.</ParamField>
    <ParamField path="proxy" type="string">Microsoft speech requests के लिए proxy URL.</ParamField>
    <ParamField path="timeoutMs" type="number">Request timeout override (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>पुराना उपनाम. persisted config को `providers.microsoft` में फिर से लिखने के लिए `openclaw doctor --fix` चलाएँ.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` पर fallback करता है. Token Plan auth `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, या `MINIMAX_CODING_API_KEY` के ज़रिए.</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.minimax.io`. पर्यावरण: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">डिफ़ॉल्ट `speech-2.8-hd`. पर्यावरण: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट `English_expressive_narrator`. पर्यावरण: `MINIMAX_TTS_VOICE_ID`. पुराना उपनाम: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. डिफ़ॉल्ट `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. डिफ़ॉल्ट `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Integer `-12..12`. डिफ़ॉल्ट `0`. अनुरोध से पहले fractional values को truncate किया जाता है.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` पर fallback करता है.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS model id (जैसे `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">Voice नाम (जैसे `alloy`, `cedar`). पुराना उपनाम: `voice`.</ParamField>
    <ParamField path="instructions" type="string">स्पष्ट OpenAI `instructions` फ़ील्ड. सेट होने पर, persona prompt फ़ील्ड अपने-आप map **नहीं** किए जाते.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Generated OpenAI TTS फ़ील्ड के बाद `/audio/speech` request bodies में merge किए जाने वाले अतिरिक्त JSON फ़ील्ड. इसका उपयोग Kokoro जैसे OpenAI-compatible endpoints के लिए करें जिन्हें `lang` जैसी provider-specific keys चाहिए; unsafe prototype keys को अनदेखा किया जाता है.</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS endpoint override करें. Resolution order: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. Non-default values को OpenAI-compatible TTS endpoints माना जाता है, इसलिए custom model और voice names स्वीकार किए जाते हैं.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">पर्यावरण: `OPENROUTER_API_KEY`. `models.providers.openrouter.apiKey` को फिर से उपयोग कर सकता है.</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://openrouter.ai/api/v1`. पुराने `https://openrouter.ai/v1` को normalize किया जाता है.</ParamField>
    <ParamField path="model" type="string">डिफ़ॉल्ट `hexgrad/kokoro-82m`. उपनाम: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">डिफ़ॉल्ट `af_alloy`. पुराने उपनाम: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>डिफ़ॉल्ट `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native speed override.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">पर्यावरण: `VOLCENGINE_TTS_API_KEY` या `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">डिफ़ॉल्ट `seed-tts-1.0`. पर्यावरण: `VOLCENGINE_TTS_RESOURCE_ID`. जब आपके project के पास TTS 2.0 entitlement हो, तो `seed-tts-2.0` का उपयोग करें.</ParamField>
    <ParamField path="appKey" type="string">App key header. डिफ़ॉल्ट `aGjiRDfUWi`. पर्यावरण: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP endpoint override करें. पर्यावरण: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Voice type. डिफ़ॉल्ट `en_female_anna_mars_bigtts`. पर्यावरण: `VOLCENGINE_TTS_VOICE`. पुराना उपनाम: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Provider-native speed ratio.</ParamField>
    <ParamField path="emotion" type="string">Provider-native emotion tag.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>पुराने Volcengine Speech Console फ़ील्ड. पर्यावरण: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (डिफ़ॉल्ट `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">पर्यावरण: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.x.ai/v1`. पर्यावरण: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट `eve`. Live voices: `ara`, `eve`, `leo`, `rex`, `sal`, `una`. पुराना उपनाम: `voiceId`.</ParamField>
    <ParamField path="language" type="string">BCP-47 भाषा कोड या `auto`. डिफ़ॉल्ट `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>डिफ़ॉल्ट `mp3`.</ParamField>
    <ParamField path="speed" type="number">Provider-native speed override.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">पर्यावरण: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.xiaomimimo.com/v1`. पर्यावरण: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">डिफ़ॉल्ट `mimo-v2.5-tts`. पर्यावरण: `XIAOMI_TTS_MODEL`. `mimo-v2-tts` और `mimo-v2.5-tts-voicedesign` का भी समर्थन करता है.</ParamField>
    <ParamField path="speakerVoice" type="string">preset-voice models के लिए डिफ़ॉल्ट `mimo_default`. पर्यावरण: `XIAOMI_TTS_VOICE`. पुराना उपनाम: `voice`. `mimo-v2.5-tts-voicedesign` के लिए नहीं भेजा जाता.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>डिफ़ॉल्ट `mp3`. पर्यावरण: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">User message के रूप में भेजा गया वैकल्पिक natural-language style instruction; बोला नहीं जाता. `mimo-v2.5-tts-voicedesign` के लिए, यह voice-design prompt है; छूटने पर OpenClaw डिफ़ॉल्ट देता है.</ParamField>
  </Accordion>
</AccordionGroup>

## Agent tool

`tts` tool text को speech में बदलता है और reply delivery के लिए audio attachment लौटाता है. Feishu, Matrix, Telegram, और WhatsApp पर, audio को file attachment के बजाय voice message के रूप में deliver किया जाता है. इस path पर `ffmpeg` उपलब्ध होने पर Feishu और WhatsApp non-Opus TTS output को transcode कर सकते हैं.

WhatsApp, Baileys के ज़रिए audio को PTT voice note (`audio` with `ptt: true`) के रूप में भेजता है और visible text को PTT audio से **अलग से** भेजता है, क्योंकि clients voice notes पर captions को consistently render नहीं करते.

Tool वैकल्पिक `channel` और `timeoutMs` फ़ील्ड स्वीकार करता है; `timeoutMs` मिलीसेकंड में per-call provider request timeout है. Per-call values `messages.tts.timeoutMs` को override करती हैं; configured TTS timeouts किसी भी plugin-authored provider default को override करते हैं.

## Gateway RPC

| विधि              | उद्देश्य                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | वर्तमान TTS state और पिछला attempt पढ़ें. |
| `tts.enable`      | local auto preference को `always` पर सेट करें. |
| `tts.disable`     | local auto preference को `off` पर सेट करें. |
| `tts.convert`     | एकबारगी text → audio.                    |
| `tts.setProvider` | local provider preference सेट करें.      |
| `tts.setPersona`  | local persona preference सेट करें.       |
| `tts.providers`   | configured providers और status सूचीबद्ध करें. |

## Service links

- [OpenAI text-to-speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/hi/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/hi/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/hi/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/hi/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## संबंधित

- [Media overview](/hi/tools/media-overview)
- [Music generation](/hi/tools/music-generation)
- [Video generation](/hi/tools/video-generation)
- [Slash commands](/hi/tools/slash-commands)
- [Voice call plugin](/hi/plugins/voice-call)
