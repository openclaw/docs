---
read_when:
    - जवाबों के लिए टेक्स्ट-टू-स्पीच सक्षम करना
    - TTS प्रदाता, फ़ॉलबैक शृंखला या व्यक्तित्व को कॉन्फ़िगर करना
    - /tts कमांड या निर्देशों का उपयोग करना
sidebarTitle: Text to speech (TTS)
summary: आउटबाउंड उत्तरों के लिए टेक्स्ट-टू-स्पीच — प्रदाता, व्यक्तित्व, स्लैश कमांड और प्रति-चैनल आउटपुट
title: टेक्स्ट-टू-स्पीच
x-i18n:
    generated_at: "2026-07-19T10:00:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0f4bc2832eab2579960c4afaa7ec1ed91b6eb452d0f268914a383c2a5c03157e
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw आउटबाउंड उत्तरों को **14 वाक् प्रदाताओं** के माध्यम से ऑडियो में बदलता है:
Feishu, Matrix, Telegram और WhatsApp पर मूल वॉइस संदेश; अन्य सभी जगहों पर ऑडियो
अटैचमेंट; और टेलीफ़ोनी तथा Talk के लिए PCM/Ulaw स्ट्रीम।

TTS, Talk के `stt-tts` मोड का वाक्-आउटपुट भाग है (`talk.speak` भी इसी
संश्लेषण पथ को कॉल करता है)। प्रदाता-मूल `realtime` Talk सत्र रियलटाइम
प्रदाता के भीतर वाक् संश्लेषित करते हैं; `transcription` सत्र कभी भी
सहायक का वॉइस उत्तर संश्लेषित नहीं करते।

## त्वरित शुरुआत

<Steps>
  <Step title="प्रदाता चुनें">
    OpenAI और ElevenLabs सबसे विश्वसनीय होस्टेड विकल्प हैं। Microsoft और
    Local CLI बिना API कुंजी के काम करते हैं। पूरी सूची के लिए
    [प्रदाता मैट्रिक्स](#supported-providers) देखें।
  </Step>
  <Step title="API कुंजी सेट करें">
    अपने प्रदाता के लिए एनवायरनमेंट वेरिएबल एक्सपोर्ट करें (उदाहरण के लिए `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`)। Microsoft और Local CLI को कुंजी की आवश्यकता नहीं है।
  </Step>
  <Step title="कॉन्फ़िगरेशन में सक्षम करें">
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
  <Step title="चैट में आज़माएँ">
    `/tts status` वर्तमान स्थिति दिखाता है। `/tts audio Hello from OpenClaw`
    एक बार का ऑडियो उत्तर भेजता है।
  </Step>
</Steps>

<Note>
Auto-TTS डिफ़ॉल्ट रूप से **बंद** है। जब `messages.tts.provider` सेट नहीं होता,
OpenClaw रजिस्ट्री के स्वतः-चयन क्रम में पहला कॉन्फ़िगर किया गया प्रदाता चुनता है।
अंतर्निहित `tts` एजेंट टूल केवल स्पष्ट अभिप्राय के लिए है: सामान्य चैट
टेक्स्ट में रहती है, जब तक उपयोगकर्ता ऑडियो न माँगे, `/tts` का उपयोग न करे,
या Auto-TTS/डायरेक्टिव वाक् सक्षम न करे।
</Note>

## समर्थित प्रदाता

| प्रदाता           | प्रमाणीकरण                                                                                                      | टिप्पणियाँ                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (साथ ही `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | मूल Ogg/Opus वॉइस-नोट आउटपुट और टेलीफ़ोनी।                                                        |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI-संगत TTS। डिफ़ॉल्ट `hexgrad/Kokoro-82M` है।                                                  |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` या `XI_API_KEY`                                                                         | वॉइस क्लोनिंग, बहुभाषी, `seed` के माध्यम से निर्धारक; Discord वॉइस प्लेबैक के लिए स्ट्रीम किया जाता है। |
| **Google Gemini** | `GEMINI_API_KEY` या `GOOGLE_API_KEY`                                                                         | Gemini API बैच TTS; `promptTemplate: "audio-profile-v1"` के माध्यम से पर्सोना-जागरूक।                               |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | वॉइस-नोट और टेलीफ़ोनी आउटपुट।                                                                     |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | स्ट्रीमिंग TTS API। मूल Opus वॉइस-नोट और PCM टेलीफ़ोनी।                                           |
| **Local CLI**     | कोई नहीं                                                                                                         | कॉन्फ़िगर किया गया स्थानीय TTS कमांड चलाता है।                                                    |
| **Microsoft**     | कोई नहीं                                                                                                         | `node-edge-tts` के माध्यम से सार्वजनिक Edge न्यूरल TTS। सर्वोत्तम-प्रयास, कोई SLA नहीं।         |
| **MiniMax**       | `MINIMAX_API_KEY` (या Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                   | T2A v2 API। डिफ़ॉल्ट `speech-2.8-hd` है।                                                       |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                | स्वतः-सारांश के लिए भी उपयोग किया जाता है; पर्सोना `instructions` का समर्थन करता है।          |
| **OpenRouter**    | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey` का पुनः उपयोग कर सकता है)                                                 | डिफ़ॉल्ट मॉडल `hexgrad/kokoro-82m`।                                                                 |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` या `BYTEPLUS_SEED_SPEECH_API_KEY` (लेगेसी AppID/टोकन: `VOLCENGINE_TTS_APPID`/`_TOKEN`)              | BytePlus Seed Speech HTTP API।                                                                    |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                | साझा छवि, वीडियो और वाक् प्रदाता।                                                                 |
| **xAI**           | `XAI_API_KEY`                                                                                                | xAI बैच TTS। मूल Opus वॉइस-नोट **समर्थित नहीं** है।                                               |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                | Xiaomi चैट कम्प्लीशन के माध्यम से MiMo TTS।                                                       |

यदि कई प्रदाता कॉन्फ़िगर किए गए हैं, तो चयनित प्रदाता का पहले उपयोग होता है और
अन्य फ़ॉलबैक विकल्प होते हैं। स्वतः-सारांश `summaryModel` (या
`agents.defaults.model.primary`) का उपयोग करता है, इसलिए यदि आप सारांश सक्षम रखते हैं,
तो उस प्रदाता का भी प्रमाणीकरण होना आवश्यक है।

<Warning>
बंडल किया गया **Microsoft** प्रदाता `node-edge-tts` के माध्यम से Microsoft Edge की
ऑनलाइन न्यूरल TTS सेवा का उपयोग करता है। यह बिना प्रकाशित SLA या कोटा वाली सार्वजनिक
वेब सेवा है—इसे सर्वोत्तम-प्रयास मानें। लेगेसी प्रदाता आईडी `edge` को
`microsoft` में सामान्यीकृत किया जाता है और `openclaw doctor --fix` स्थायी
कॉन्फ़िगरेशन को पुनर्लिखता है; नए कॉन्फ़िगरेशन को हमेशा `microsoft` का उपयोग करना चाहिए।
</Warning>

## कॉन्फ़िगरेशन

TTS कॉन्फ़िगरेशन `~/.openclaw/openclaw.json` में `messages.tts` के अंतर्गत रहता है। कोई
प्रीसेट चुनें और प्रदाता ब्लॉक को अनुकूलित करें। नीचे दिखाए गए `speakerVoice`/`speakerVoiceId`
फ़ील्ड कैनोनिकल हैं; प्रत्येक प्रदाता के अपने `voice`/`voiceId`/
`voiceName` फ़ील्ड नाम अब भी लेगेसी उपनाम के रूप में काम करते हैं।

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
          // वैकल्पिक प्राकृतिक-भाषा शैली संकेत:
          // audioProfile: "शांत, पॉडकास्ट-होस्ट के लहजे में बोलें।",
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
  <Tab title="Microsoft (कुंजी नहीं)">
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

Xiaomi `mimo-v2.5-tts-voicedesign` के लिए, `speakerVoice` को छोड़ दें और `style` को
वॉइस-डिज़ाइन प्रॉम्प्ट पर सेट करें। OpenClaw उस प्रॉम्प्ट को TTS `user` संदेश के
रूप में भेजता है और voicedesign मॉडल के लिए `audio.voice` नहीं भेजता।

### प्रति-एजेंट आवाज़ ओवरराइड

जब किसी एक एजेंट को किसी अलग प्रदाता, आवाज़, मॉडल, व्यक्तित्व या ऑटो-TTS मोड के साथ बोलना हो, तब `agents.list[].tts` का उपयोग करें। एजेंट ब्लॉक `messages.tts` के ऊपर डीप-मर्ज होता है, इसलिए प्रदाता क्रेडेंशियल वैश्विक प्रदाता कॉन्फ़िगरेशन में रह सकते हैं:

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

प्रति-एजेंट व्यक्तित्व को निश्चित करने के लिए, प्रदाता कॉन्फ़िगरेशन के साथ `agents.list[].tts.persona` सेट करें — यह केवल उस एजेंट के लिए वैश्विक `messages.tts.persona` को ओवरराइड करता है।

स्वचालित उत्तरों, `/tts audio`, `/tts status` और `tts` एजेंट टूल के लिए प्राथमिकता क्रम:

1. `messages.tts`
2. सक्रिय `agents.list[].tts`
3. चैनल ओवरराइड, जब चैनल `channels.<channel>.tts` का समर्थन करता हो
4. अकाउंट ओवरराइड, जब चैनल `channels.<channel>.accounts.<id>.tts` पास करता हो
5. इस होस्ट के लिए स्थानीय `/tts` प्राथमिकताएँ
6. जब [मॉडल-संचालित निर्देश](#model-driven-directives) सक्षम हों, तब इनलाइन `[[tts:...]]` निर्देश

चैनल और अकाउंट ओवरराइड का आकार `messages.tts` के समान होता है और वे पिछली परतों के ऊपर डीप-मर्ज होते हैं, इसलिए साझा प्रदाता क्रेडेंशियल `messages.tts` में रह सकते हैं, जबकि कोई चैनल या बॉट अकाउंट केवल वक्ता की आवाज़, मॉडल, व्यक्तित्व या ऑटो मोड बदलता है:

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

## व्यक्तित्व

**व्यक्तित्व** एक स्थिर मौखिक पहचान है, जिसे विभिन्न प्रदाताओं में नियतात्मक रूप से लागू किया जा सकता है। यह किसी एक प्रदाता को प्राथमिकता दे सकता है, प्रदाता-निरपेक्ष प्रॉम्प्ट अभिप्राय परिभाषित कर सकता है और आवाज़ों, मॉडलों, प्रॉम्प्ट टेम्पलेटों, सीड तथा आवाज़ सेटिंग के लिए प्रदाता-विशिष्ट बाइंडिंग रख सकता है।

### न्यूनतम व्यक्तित्व

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "वाचक",
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

### पूर्ण व्यक्तित्व (प्रदाता-निरपेक्ष प्रॉम्प्ट)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "अल्फ़्रेड",
          description: "शुष्क हास्य वाला, आत्मीय ब्रिटिश बटलर वाचक।",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "एक प्रतिभाशाली ब्रिटिश बटलर। शुष्क हास्य वाला, हाज़िरजवाब, आत्मीय, आकर्षक, भावनात्मक रूप से अभिव्यंजक और कभी भी साधारण नहीं।",
            scene: "देर रात का एक शांत अध्ययन-कक्ष। किसी विश्वसनीय ऑपरेटर के लिए निकट-माइक वाचन।",
            sampleContext: "वक्ता संक्षिप्त आत्मविश्वास और शुष्क आत्मीयता के साथ एक निजी तकनीकी अनुरोध का उत्तर दे रहा है।",
            style: "परिष्कृत, संयत, हल्का प्रसन्न।",
            accent: "ब्रिटिश अंग्रेज़ी।",
            pacing: "नपी-तुली, छोटे नाटकीय विरामों के साथ।",
            constraints: ["कॉन्फ़िगरेशन मानों को बोलकर न पढ़ें।", "व्यक्तित्व की व्याख्या न करें।"],
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

### व्यक्तित्व निर्धारण

सक्रिय व्यक्तित्व को नियतात्मक रूप से चुना जाता है:

1. `/tts persona <id>` स्थानीय प्राथमिकता, यदि सेट हो।
2. `messages.tts.persona`, यदि सेट हो।
3. कोई व्यक्तित्व नहीं।

प्रदाता चयन में स्पष्ट विकल्पों को पहले लिया जाता है:

1. प्रत्यक्ष ओवरराइड (CLI, gateway, Talk, अनुमत TTS निर्देश)।
2. `/tts provider <id>` स्थानीय प्राथमिकता।
3. सक्रिय व्यक्तित्व का `provider`।
4. `messages.tts.provider`।
5. रजिस्ट्री द्वारा स्वतः चयन।

प्रत्येक प्रदाता प्रयास के लिए, OpenClaw इस क्रम में कॉन्फ़िगरेशन मर्ज करता है:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. विश्वसनीय अनुरोध ओवरराइड
4. अनुमत मॉडल-उत्सर्जित TTS निर्देश ओवरराइड

### प्रदाता व्यक्तित्व प्रॉम्प्ट का उपयोग कैसे करते हैं

व्यक्तित्व प्रॉम्प्ट फ़ील्ड (`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`) **प्रदाता-निरपेक्ष** हैं। प्रत्येक प्रदाता तय करता है कि उनका उपयोग कैसे करना है:

<AccordionGroup>
  <Accordion title="Google Gemini">
    व्यक्तित्व प्रॉम्प्ट फ़ील्ड को Gemini TTS प्रॉम्प्ट संरचना में **केवल तभी** लपेटता है, जब प्रभावी Google प्रदाता कॉन्फ़िगरेशन में `promptTemplate: "audio-profile-v1"` या `personaPrompt` सेट हो। पुराने `audioProfile` और `speakerName` फ़ील्ड अब भी Google-विशिष्ट प्रॉम्प्ट टेक्स्ट के रूप में पहले जोड़े जाते हैं। `[[tts:text]]` ब्लॉक के भीतर `[whispers]` या `[laughs]` जैसे इनलाइन ऑडियो टैग Gemini प्रतिलेख के भीतर संरक्षित रहते हैं; OpenClaw इन टैग को जनरेट नहीं करता।
  </Accordion>
  <Accordion title="OpenAI">
    व्यक्तित्व प्रॉम्प्ट फ़ील्ड को अनुरोध के `instructions` फ़ील्ड में **केवल तभी** मैप करता है, जब कोई स्पष्ट OpenAI `instructions` कॉन्फ़िगर न हो। स्पष्ट `instructions` को हमेशा प्राथमिकता मिलती है।
  </Accordion>
  <Accordion title="अन्य प्रदाता">
    केवल `personas.<id>.providers.<provider>` के अंतर्गत प्रदाता-विशिष्ट व्यक्तित्व बाइंडिंग का उपयोग करते हैं। जब तक प्रदाता अपना व्यक्तित्व-प्रॉम्प्ट मैपिंग लागू नहीं करता, व्यक्तित्व प्रॉम्प्ट फ़ील्ड को अनदेखा किया जाता है।
  </Accordion>
</AccordionGroup>

### फ़ॉलबैक नीति

जब किसी व्यक्तित्व में प्रयास किए जा रहे प्रदाता के लिए **कोई बाइंडिंग नहीं** होती, तब व्यवहार को `fallbackPolicy` नियंत्रित करता है:

| नीति                | व्यवहार                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **डिफ़ॉल्ट।** प्रदाता-निरपेक्ष प्रॉम्प्ट फ़ील्ड उपलब्ध रहते हैं; प्रदाता उनका उपयोग कर सकता है या उन्हें अनदेखा कर सकता है।                                                               |
| `provider-defaults` | उस प्रयास के लिए प्रॉम्प्ट तैयार करने से व्यक्तित्व हटा दिया जाता है; अन्य प्रदाताओं पर फ़ॉलबैक जारी रहते हुए प्रदाता अपने निरपेक्ष डिफ़ॉल्ट का उपयोग करता है।                             |
| `fail`              | `reasonCode: "not_configured"` और `personaBinding: "missing"` के साथ उस प्रदाता प्रयास को छोड़ दें। फ़ॉलबैक प्रदाताओं को फिर भी आज़माया जाता है।                                           |

पूरा TTS अनुरोध केवल तभी विफल होता है, जब प्रयास किए गए **सभी** प्रदाताओं को छोड़ दिया जाए या वे विफल हो जाएँ।

Talk सत्र का प्रदाता चयन सत्र-सीमित होता है। Talk क्लाइंट को `talk.catalog` से प्रदाता आईडी, मॉडल आईडी, आवाज़ आईडी और लोकेल चुनकर उन्हें Talk सत्र या हैंडऑफ़ अनुरोध के माध्यम से पास करना चाहिए। आवाज़ सत्र खोलने से `messages.tts` या वैश्विक Talk प्रदाता डिफ़ॉल्ट में बदलाव नहीं होना चाहिए।

## मॉडल-संचालित निर्देश

डिफ़ॉल्ट रूप से, सहायक किसी एक उत्तर के लिए आवाज़, मॉडल या गति को ओवरराइड करने हेतु `[[tts:...]]` निर्देश उत्सर्जित **कर सकता है**, साथ ही उन अभिव्यंजक संकेतों के लिए एक वैकल्पिक `[[tts:text]]...[[/tts:text]]` ब्लॉक दे सकता है जो केवल ऑडियो में दिखाई देने चाहिए:

```text
यह लीजिए।

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](हँसते हुए) गीत को एक बार फिर पढ़ें।[[/tts:text]]
```

जब `messages.tts.auto`, `"tagged"` हो, तो ऑडियो ट्रिगर करने के लिए **निर्देश आवश्यक होते हैं**। स्ट्रीमिंग ब्लॉक वितरण निर्देशों को चैनल तक पहुँचने से पहले दृश्यमान टेक्स्ट से हटा देता है, भले ही वे पास-पास के ब्लॉकों में विभाजित हों।

जब तक `modelOverrides.allowProvider: true` न हो, `provider=...` को अनदेखा किया जाता है। जब कोई उत्तर `provider=...` घोषित करता है, तो उस निर्देश की अन्य कुंजियों को केवल वही प्रदाता पार्स करता है; असमर्थित कुंजियाँ हटा दी जाती हैं और TTS निर्देश चेतावनियों के रूप में रिपोर्ट की जाती हैं।

**उपलब्ध निर्देश कुंजियाँ:**

- `provider` (पंजीकृत प्रदाता आईडी; `allowProvider: true` आवश्यक)
- `speakerVoice` / `speakerVoiceId` (पुराने उपनाम: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax वॉल्यूम, `(0, 10]`)
- `pitch` (MiniMax पूर्णांक पिच, −12 से 12; भिन्नात्मक मानों को काट दिया जाता है)
- `emotion` (Volcengine भावना टैग)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**मॉडल ओवरराइड को पूरी तरह अक्षम करें:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**अन्य नियंत्रणों को कॉन्फ़िगर करने योग्य रखते हुए प्रदाता बदलने की अनुमति दें:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## स्लैश कमांड

एकल कमांड `/tts`। Discord पर, OpenClaw `/voice` को भी पंजीकृत करता है, क्योंकि `/tts` एक अंतर्निहित Discord कमांड है — टेक्स्ट `/tts ...` अब भी काम करता है।

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
कमांड के लिए अधिकृत प्रेषक आवश्यक है (अनुमति-सूची/स्वामी नियम लागू होते हैं) और या तो `commands.text` या नेटिव कमांड पंजीकरण सक्षम होना चाहिए।
</Note>

व्यवहार संबंधी टिप्पणियाँ:

- `/tts on` स्थानीय TTS प्राथमिकता को `always` में लिखता है; `/tts off` इसे `off` में लिखता है।
- `/tts chat on|off|default` वर्तमान चैट के लिए सत्र-सीमित ऑटो-TTS ओवरराइड लिखता है।
- `/tts persona <id>` स्थानीय व्यक्तित्व प्राथमिकता लिखता है; `/tts persona off` इसे साफ़ करता है।
- `/tts latest` वर्तमान सत्र प्रतिलेख से सहायक का नवीनतम उत्तर पढ़ता है और उसे एक बार ऑडियो के रूप में भेजता है। डुप्लिकेट आवाज़ प्रेषण रोकने के लिए यह सत्र प्रविष्टि पर उस उत्तर का केवल एक हैश संग्रहीत करता है।
- `/tts audio` एकबारगी ऑडियो उत्तर जनरेट करता है (TTS को चालू **नहीं** करता)।
- `/tts limit <chars>` **100–4096** स्वीकार करता है (4096 Telegram कैप्शन/संदेश की अधिकतम सीमा है); इस सीमा से बाहर के मान अस्वीकार कर दिए जाते हैं।
- `limit` और `summary` मुख्य कॉन्फ़िगरेशन में नहीं, बल्कि **स्थानीय प्राथमिकताओं** में संग्रहीत होते हैं।
- `/tts status` में नवीनतम प्रयास के लिए फ़ॉलबैक निदान शामिल होते हैं — `Fallback: <primary> -> <used>`, `Attempts: ...` और प्रत्येक प्रयास का विवरण (`provider:outcome(reasonCode) latency`)।
- TTS सक्षम होने पर `/status` सक्रिय TTS मोड के साथ कॉन्फ़िगर किया गया प्रदाता, मॉडल, आवाज़ और स्वच्छ किए गए कस्टम एंडपॉइंट मेटाडेटा दिखाता है।

## प्रति-उपयोगकर्ता प्राथमिकताएँ

स्लैश कमांड स्थानीय ओवरराइड को `prefsPath` में लिखते हैं। डिफ़ॉल्ट `~/.openclaw/settings/tts.json` है; इसे `OPENCLAW_TTS_PREFS` पर्यावरण चर या `messages.tts.prefsPath` से ओवरराइड करें।

| संग्रहीत फ़ील्ड | प्रभाव                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | स्थानीय ऑटो-TTS ओवरराइड (`always`, `off`, …)                                     |
| `provider`   | स्थानीय प्राथमिक प्रदाता ओवरराइड                                                  |
| `persona`    | स्थानीय पर्सोना ओवरराइड                                                           |
| `maxLength`  | सारांश/ट्रंकेशन सीमा (डिफ़ॉल्ट `1500` वर्ण, `/tts limit` सीमा 100–4096) |
| `summarize`  | सारांश टॉगल (डिफ़ॉल्ट `true`)                                                  |

ये उस होस्ट के लिए `messages.tts` और सक्रिय
`agents.list[].tts` ब्लॉक से प्रभावी कॉन्फ़िगरेशन को ओवरराइड करते हैं।

## आउटपुट प्रारूप

TTS वॉइस डिलीवरी चैनल की क्षमता से संचालित होती है। चैनल Plugin यह बताते हैं
कि वॉइस-शैली TTS को प्रदाताओं से मूल `voice-note` लक्ष्य माँगना चाहिए या
सामान्य `audio-file` सिंथेसिस बनाए रखना चाहिए, और क्या चैनल भेजने से पहले
गैर-मूल आउटपुट को ट्रांसकोड करता है।

| लक्ष्य                                | प्रारूप                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | वॉइस-नोट उत्तर **Opus** को प्राथमिकता देते हैं (ElevenLabs से `opus_48000_64`, OpenAI से `opus`)। 48 kHz / 64 kbps स्पष्टता और आकार को संतुलित करता है। |
| अन्य चैनल                        | **MP3** (ElevenLabs से `mp3_44100_128`, OpenAI से `mp3`)। वाणी के लिए 44.1 kHz / 128 kbps डिफ़ॉल्ट संतुलन है।                  |
| Talk / टेलीफ़ोनी                      | प्रदाता-मूल **PCM** (Inworld 22050 Hz, Google 24 kHz), या टेलीफ़ोनी के लिए Gradium से `ulaw_8000`।                                 |

प्रत्येक प्रदाता के लिए टिप्पणियाँ:

- **Feishu / WhatsApp ट्रांसकोडिंग:** जब कोई वॉइस-नोट उत्तर MP3/WebM/WAV/M4A या किसी अन्य संभावित ऑडियो फ़ाइल के रूप में आता है, तो चैनल Plugin मूल वॉइस संदेश भेजने से पहले उसे `ffmpeg` (`libopus`, 64 kbps) से 48 kHz Ogg/Opus में ट्रांसकोड करता है। WhatsApp परिणाम को Baileys `audio` पेलोड के माध्यम से `ptt: true` और `audio/ogg; codecs=opus` के साथ भेजता है। ट्रांसकोड विफल होने पर: Feishu त्रुटि को संभालता है और मूल फ़ाइल को साधारण अटैचमेंट के रूप में भेजता है; WhatsApp में कोई फ़ॉलबैक नहीं है, इसलिए असंगत PTT पेलोड पोस्ट करने के बजाय भेजना ही विफल हो जाता है।
- **MiniMax:** सामान्य ऑडियो अटैचमेंट के लिए MP3 (`speech-2.8-hd` मॉडल, 32 kHz सैंपल दर); चैनल द्वारा घोषित वॉइस-नोट लक्ष्यों के लिए `ffmpeg` से 48 kHz Opus में ट्रांसकोड किया जाता है।
- **Xiaomi MiMo:** डिफ़ॉल्ट रूप से MP3, या कॉन्फ़िगर होने पर WAV; चैनल द्वारा घोषित वॉइस-नोट लक्ष्यों के लिए `ffmpeg` से 48 kHz Opus में ट्रांसकोड किया जाता है।
- **स्थानीय CLI:** कॉन्फ़िगर किया गया `outputFormat` उपयोग करता है। वॉइस-नोट लक्ष्यों को Ogg/Opus में और टेलीफ़ोनी आउटपुट को `ffmpeg` से रॉ 16 kHz मोनो PCM में बदला जाता है।
- **Google Gemini:** रॉ 24 kHz PCM लौटाता है। OpenClaw इसे ऑडियो अटैचमेंट के लिए WAV में रैप करता है, वॉइस-नोट लक्ष्यों के लिए 48 kHz Opus में ट्रांसकोड करता है, और Talk/टेलीफ़ोनी के लिए सीधे PCM लौटाता है।
- **Gradium:** ऑडियो अटैचमेंट के लिए WAV, वॉइस-नोट लक्ष्यों के लिए Opus, और टेलीफ़ोनी के लिए 8 kHz पर `ulaw_8000`।
- **Inworld:** सामान्य ऑडियो अटैचमेंट के लिए MP3, वॉइस-नोट लक्ष्यों के लिए मूल `OGG_OPUS`, और Talk/टेलीफ़ोनी के लिए 22050 Hz पर रॉ `PCM`।
- **xAI:** डिफ़ॉल्ट रूप से MP3; ऑडियो-फ़ाइल सिंथेसिस बफ़र्ड और स्ट्रीमिंग दोनों आउटपुट के लिए `mp3`, `wav`, `pcm`, `mulaw`, या `alaw` का उपयोग कर सकता है। वॉइस-नोट लक्ष्य स्ट्रीमिंग और बफ़र्ड फ़ॉलबैक के लिए MP3 उपयोग करते हैं, क्योंकि xAI के `pcm`, `mulaw`, और `alaw` आउटपुट हेडर-रहित रॉ ऑडियो हैं। बफ़र्ड सिंथेसिस xAI के बैच REST `/v1/tts` एंडपॉइंट का उपयोग करता है; `textToSpeechStream` मूल `wss://api.x.ai/v1/tts` का उपयोग करता है। यह रीयलटाइम वॉइस अनुबंध नहीं है। मूल Opus वॉइस-नोट प्रारूप समर्थित नहीं है।
- **Microsoft:** `microsoft.outputFormat` (डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`) का उपयोग करता है।
  - बंडल किया गया ट्रांसपोर्ट एक `outputFormat` स्वीकार करता है, लेकिन सेवा से सभी प्रारूप उपलब्ध नहीं हैं।
  - आउटपुट प्रारूप के मान Microsoft Speech आउटपुट प्रारूपों (Ogg/WebM Opus सहित) का अनुसरण करते हैं।
  - Telegram `sendVoice` OGG/MP3/M4A स्वीकार करता है; यदि सुनिश्चित Opus वॉइस संदेश चाहिए, तो OpenAI/ElevenLabs का उपयोग करें।
  - यदि कॉन्फ़िगर किया गया Microsoft आउटपुट प्रारूप विफल होता है, तो OpenClaw MP3 के साथ पुनः प्रयास करता है।
  - जब कोई स्पष्ट वॉइस ओवरराइड सेट नहीं होता और डिफ़ॉल्ट अंग्रेज़ी वॉइस उपयोग की जाती है, तो उत्तर का टेक्स्ट CJK-प्रधान होने पर OpenClaw स्वचालित रूप से चीनी न्यूरल वॉइस (`zh-CN-XiaoxiaoNeural`, `zh-CN` लोकेल) पर स्विच करता है।

OpenAI और ElevenLabs के आउटपुट प्रारूप ऊपर दी गई सूची के अनुसार प्रत्येक चैनल के लिए निश्चित हैं।

## ऑटो-TTS व्यवहार

जब `messages.tts.auto` सक्षम होता है, OpenClaw:

- यदि उत्तर में पहले से संरचित मीडिया है, तो TTS छोड़ देता है।
- बहुत छोटे उत्तर (10 वर्णों से कम) छोड़ देता है।
- सारांश सक्षम होने पर लंबे उत्तरों का
  `summaryModel` (या `agents.defaults.model.primary`) का उपयोग करके सारांश बनाता है।
- जनरेट किया गया ऑडियो उत्तर में संलग्न करता है।
- `mode: "final"` में, टेक्स्ट स्ट्रीम पूर्ण होने के बाद भी स्ट्रीम किए गए अंतिम उत्तरों के लिए केवल-ऑडियो TTS भेजता है; जनरेट किया गया मीडिया सामान्य उत्तर अटैचमेंट के समान चैनल मीडिया सामान्यीकरण से गुजरता है।

यदि उत्तर `maxLength` से अधिक हो जाता है, तो OpenClaw ऑडियो को कभी पूरी तरह नहीं छोड़ता:

- **सारांश चालू** (डिफ़ॉल्ट) और सारांश मॉडल उपलब्ध है: टेक्स्ट का लगभग `maxLength` वर्णों में सारांश बनाता है, फिर सारांश का सिंथेसिस करता है।
- **सारांश बंद**, सारांश बनाना विफल होता है, या सारांश मॉडल के लिए कोई API कुंजी उपलब्ध नहीं है: टेक्स्ट को `maxLength` वर्णों तक ट्रंकेट करता है और ट्रंकेट किए गए टेक्स्ट का सिंथेसिस करता है।

```text
उत्तर -> TTS सक्षम है?
  नहीं  -> टेक्स्ट भेजें
  हाँ -> मीडिया मौजूद है / छोटा है?
          हाँ -> टेक्स्ट भेजें
          नहीं  -> लंबाई > सीमा?
                   नहीं  -> TTS -> ऑडियो संलग्न करें
                   हाँ -> सारांश सक्षम और उपलब्ध है?
                            नहीं  -> ट्रंकेट करें -> TTS -> ऑडियो संलग्न करें
                            हाँ -> सारांश बनाएँ -> TTS -> ऑडियो संलग्न करें
```

## फ़ील्ड संदर्भ

<AccordionGroup>
  <Accordion title="शीर्ष-स्तरीय messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      ऑटो-TTS मोड। `inbound` केवल आने वाले वॉइस संदेश के बाद ऑडियो भेजता है; `tagged` केवल तभी ऑडियो भेजता है जब उत्तर में `[[tts:...]]` निर्देश या `[[tts:text]]` ब्लॉक शामिल हो।
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      पुराना टॉगल। `openclaw doctor --fix` इसे `auto` में माइग्रेट करता है।
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` अंतिम उत्तरों के अतिरिक्त टूल/ब्लॉक उत्तरों को शामिल करता है।
    </ParamField>
    <ParamField path="provider" type="string">
      स्पीच प्रदाता आईडी। सेट न होने पर, OpenClaw रजिस्ट्री ऑटो-सेलेक्ट क्रम में पहले कॉन्फ़िगर किए गए प्रदाता का उपयोग करता है। पुराने `provider: "edge"` को `openclaw doctor --fix` द्वारा `"microsoft"` में दोबारा लिखा जाता है।
    </ParamField>
    <ParamField path="persona" type="string">
      `personas` से सक्रिय पर्सोना आईडी। लोअरकेस में सामान्यीकृत।
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      स्थिर मौखिक पहचान। फ़ील्ड: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`। [पर्सोना](#personas) देखें।
    </ParamField>
    <ParamField path="summaryModel" type="string">
      ऑटो-सारांश के लिए कम लागत वाला मॉडल; डिफ़ॉल्ट `agents.defaults.model.primary`। `provider/model` या कॉन्फ़िगर किया गया मॉडल उपनाम स्वीकार करता है।
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      मॉडल को TTS निर्देश उत्सर्जित करने की अनुमति दें। `enabled` का डिफ़ॉल्ट `true` है; `allowProvider` का डिफ़ॉल्ट `false` है।
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      स्पीच प्रदाता आईडी द्वारा कुंजीबद्ध प्रदाता-स्वामित्व वाली सेटिंग। पुराने प्रत्यक्ष ब्लॉक (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) को `openclaw doctor --fix` द्वारा दोबारा लिखा जाता है; केवल `messages.tts.providers.<id>` कमिट करें।
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS इनपुट वर्णों की कठोर सीमा। सीमा पार होने पर `/tts audio`, `tts.convert`, और `tts.speak` विफल हो जाते हैं।
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      मिलीसेकंड में अनुरोध टाइमआउट। सेट होने पर प्रति-कॉल `timeoutMs` (एजेंट टूल, Gateway) को प्राथमिकता मिलती है; अन्यथा स्पष्ट रूप से कॉन्फ़िगर किए गए `messages.tts.timeoutMs` को Plugin द्वारा निर्धारित किसी भी प्रदाता डिफ़ॉल्ट पर प्राथमिकता मिलती है।
    </ParamField>
    <ParamField path="prefsPath" type="string">
      स्थानीय प्राथमिकता JSON पथ (प्रदाता/सीमा/सारांश) को ओवरराइड करें। डिफ़ॉल्ट `~/.openclaw/settings/tts.json`।
    </ParamField>
  </Accordion>

प्रदाता के `apiKey` फ़ील्ड रॉ स्ट्रिंग या SecretRefs हो सकते हैं। Gateway के कोल्ड
स्टार्टअप के दौरान, अनुपलब्ध TTS SecretRef Gateway को रोकने के बजाय अंतर्निहित TTS क्षमता को
कॉन्फ़िगर-अनुपलब्ध चिह्नित करता है। इसके बाद `tts.speak`
`SECRET_SURFACE_UNAVAILABLE` कारण के साथ `UNAVAILABLE` लौटाता है, और कोई प्रदाता अनुरोध
नहीं भेजा जाता। स्थिति और डॉक्टर अवक्रमित TTS स्वामी और उसके कॉन्फ़िगरेशन पथ सूचीबद्ध करते हैं। स्पष्ट रेफ़रेंस रनटाइम स्नैपशॉट में बने रहते हैं, इसलिए एनवायरनमेंट या प्रोफ़ाइल
क्रेडेंशियल गुप्त रूप से कोई अलग अकाउंट नहीं चुन सकते। रीलोड और कॉन्फ़िगरेशन-लेखन
प्रीफ़्लाइट स्वामी-जागरूक अवक्रमण नीति लागू करते हैं: कोई अपरिवर्तित योग्य TTS
स्वामी अपने अंतिम-ज्ञात-सही क्रेडेंशियल को पुराने रूप में बनाए रख सकता है, जबकि नई या बदली हुई
विफलता स्वस्थ स्वामियों को अवरुद्ध किए बिना कोल्ड हो जाती है। संरचनात्मक रूप से अमान्य रेफ़रेंस
और रिज़ॉल्व किए गए मान अब भी स्टार्टअप को विफल करते हैं या अपडेट को अस्वीकार करते हैं।

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">एनवायरनमेंट: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, या `SPEECH_KEY`।</ParamField>
    <ParamField path="region" type="string">Azure Speech क्षेत्र (जैसे `eastus`)। एनवायरनमेंट: `AZURE_SPEECH_REGION` या `SPEECH_REGION`।</ParamField>
    <ParamField path="endpoint" type="string">वैकल्पिक Azure Speech एंडपॉइंट ओवरराइड (उपनाम `baseUrl`)।</ParamField>
    <ParamField path="speakerVoice" type="string">Azure वॉइस ShortName। डिफ़ॉल्ट `en-US-JennyNeural`। पुराना उपनाम: `voice`।</ParamField>
    <ParamField path="lang" type="string">SSML भाषा कोड। डिफ़ॉल्ट `en-US`।</ParamField>
    <ParamField path="outputFormat" type="string">मानक ऑडियो के लिए Azure `X-Microsoft-OutputFormat`। डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`।</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">वॉइस-नोट आउटपुट के लिए Azure `X-Microsoft-OutputFormat`। डिफ़ॉल्ट `ogg-24khz-16bit-mono-opus`।</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` या `XI_API_KEY` का फ़ॉलबैक के रूप में उपयोग करता है।</ParamField>
    <ParamField path="model" type="string">मॉडल आईडी। डिफ़ॉल्ट `eleven_multilingual_v2`। पुराने आईडी `eleven_turbo_v2_5`/`eleven_turbo_v2` को संबंधित `flash` मॉडल में सामान्यीकृत किया जाता है।</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs वॉइस आईडी। डिफ़ॉल्ट `pMsXgVXv3BLzUgSXRplE`। पुराना उपनाम: `voiceId`।</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (प्रत्येक `0..1`, डिफ़ॉल्ट `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, डिफ़ॉल्ट `true`), `speed` (`0.5..2.0`, डिफ़ॉल्ट `1.0`)।
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>टेक्स्ट सामान्यीकरण मोड।</ParamField>
    <ParamField path="languageCode" type="string">2-अक्षरीय ISO 639-1 (उदा. `en`, `de`)।</ParamField>
    <ParamField path="seed" type="number">यथासंभव नियतात्मकता के लिए पूर्णांक `0..4294967295`।</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API के आधार URL को ओवरराइड करता है।</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY` का फ़ॉलबैक के रूप में उपयोग करता है। छोड़ दिए जाने पर, TTS एनवायरनमेंट फ़ॉलबैक से पहले `models.providers.google.apiKey` का पुनः उपयोग कर सकता है।</ParamField>
    <ParamField path="model" type="string">Gemini TTS मॉडल। डिफ़ॉल्ट `gemini-3.1-flash-tts-preview`।</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini की पूर्वनिर्मित वॉइस का नाम। डिफ़ॉल्ट `Kore`। पुराने उपनाम: `voiceName`, `voice`।</ParamField>
    <ParamField path="audioProfile" type="string">बोले जाने वाले टेक्स्ट से पहले जोड़ा गया प्राकृतिक-भाषा शैली प्रॉम्प्ट।</ParamField>
    <ParamField path="speakerName" type="string">जब आपका प्रॉम्प्ट किसी नामित वक्ता का उपयोग करता है, तब बोले जाने वाले टेक्स्ट से पहले जोड़ा गया वैकल्पिक वक्ता लेबल।</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>सक्रिय पर्सोना प्रॉम्प्ट फ़ील्ड को नियतात्मक Gemini TTS प्रॉम्प्ट संरचना में लपेटने के लिए इसे `audio-profile-v1` पर सेट करें।</ParamField>
    <ParamField path="personaPrompt" type="string">टेम्पलेट के Director's Notes में जोड़ा गया Google-विशिष्ट अतिरिक्त पर्सोना प्रॉम्प्ट टेक्स्ट।</ParamField>
    <ParamField path="baseUrl" type="string">केवल `https://generativelanguage.googleapis.com` स्वीकार किया जाता है।</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">एनवायरनमेंट: `GRADIUM_API_KEY`।</ParamField>
    <ParamField path="baseUrl" type="string">`api.gradium.ai` पर HTTPS Gradium API URL। डिफ़ॉल्ट `https://api.gradium.ai`।</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट Emma (`YTpq7expH9539ERJ`)। पुराना उपनाम: `voiceId`।</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### प्राथमिक Inworld

    <ParamField path="apiKey" type="string">एनवायरनमेंट: `INWORLD_API_KEY`।</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.inworld.ai`।</ParamField>
    <ParamField path="modelId" type="string">डिफ़ॉल्ट `inworld-tts-1.5-max`। अन्य विकल्प: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`।</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट `Sarah`। पुराना उपनाम: `voiceId`।</ParamField>
    <ParamField path="temperature" type="number">सैंपलिंग तापमान `0..2` (0 को छोड़कर)।</ParamField>

  </Accordion>

  <Accordion title="स्थानीय CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS के लिए स्थानीय एक्ज़िक्यूटेबल या कमांड स्ट्रिंग।</ParamField>
    <ParamField path="args" type="string[]">कमांड आर्ग्युमेंट। `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` प्लेसहोल्डर समर्थित हैं।</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>अपेक्षित CLI आउटपुट फ़ॉर्मैट। ऑडियो अटैचमेंट के लिए डिफ़ॉल्ट `mp3`।</ParamField>
    <ParamField path="timeoutMs" type="number">मिलीसेकंड में कमांड टाइमआउट। डिफ़ॉल्ट `120000`।</ParamField>
    <ParamField path="cwd" type="string">वैकल्पिक कमांड कार्यशील डायरेक्टरी।</ParamField>
    <ParamField path="env" type="Record<string, string>">कमांड के लिए वैकल्पिक एनवायरनमेंट ओवरराइड।</ParamField>

    कमांड stdout और जनरेट या रूपांतरित ऑडियो की सीमा 50 MiB है। डायग्नोस्टिक stderr की सीमा 1 MiB है। कोई भी सीमा पार होने पर OpenClaw कमांड को समाप्त कर देता है और संश्लेषण विफल हो जाता है।

  </Accordion>

  <Accordion title="Microsoft (API कुंजी के बिना)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft स्पीच के उपयोग की अनुमति देता है।</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft न्यूरल वॉइस का नाम (उदा. `en-US-MichelleNeural`)। पुराना उपनाम: `voice`। यदि डिफ़ॉल्ट अंग्रेज़ी वॉइस प्रभावी है और उत्तर का टेक्स्ट मुख्यतः CJK है, तो OpenClaw अपने-आप `zh-CN-XiaoxiaoNeural` पर स्विच हो जाता है।</ParamField>
    <ParamField path="lang" type="string">भाषा कोड (उदा. `en-US`)।</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft आउटपुट फ़ॉर्मैट। डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`। बंडल किए गए Edge-आधारित ट्रांसपोर्ट द्वारा सभी फ़ॉर्मैट समर्थित नहीं हैं।</ParamField>
    <ParamField path="rate / pitch / volume" type="string">प्रतिशत स्ट्रिंग (उदा. `+10%`, `-5%`)।</ParamField>
    <ParamField path="saveSubtitles" type="boolean">ऑडियो फ़ाइल के साथ JSON उपशीर्षक लिखता है।</ParamField>
    <ParamField path="proxy" type="string">Microsoft स्पीच अनुरोधों के लिए प्रॉक्सी URL।</ParamField>
    <ParamField path="timeoutMs" type="number">अनुरोध टाइमआउट ओवरराइड (ms)।</ParamField>
    <ParamField path="edge.*" type="object" deprecated>पुराना उपनाम। स्थायी कॉन्फ़िगरेशन को `providers.microsoft` में दोबारा लिखने के लिए `openclaw doctor --fix` चलाएँ।</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY` का फ़ॉलबैक के रूप में उपयोग करता है। `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, या `MINIMAX_CODING_API_KEY` के माध्यम से Token Plan प्रमाणीकरण।</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.minimax.io`। एनवायरनमेंट: `MINIMAX_API_HOST`।</ParamField>
    <ParamField path="model" type="string">डिफ़ॉल्ट `speech-2.8-hd`। एनवायरनमेंट: `MINIMAX_TTS_MODEL`।</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट `English_expressive_narrator`। एनवायरनमेंट: `MINIMAX_TTS_VOICE_ID`। पुराना उपनाम: `voiceId`।</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`। डिफ़ॉल्ट `1.0`।</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`। डिफ़ॉल्ट `1.0`।</ParamField>
    <ParamField path="pitch" type="number">पूर्णांक `-12..12`। डिफ़ॉल्ट `0`। अनुरोध से पहले भिन्नात्मक मानों का दशमलव भाग हटा दिया जाता है।</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY` का फ़ॉलबैक के रूप में उपयोग करता है।</ParamField>
    <ParamField path="model" type="string">OpenAI TTS मॉडल आईडी। डिफ़ॉल्ट `gpt-4o-mini-tts`।</ParamField>
    <ParamField path="speakerVoice" type="string">वॉइस का नाम (उदा. `alloy`, `cedar`)। डिफ़ॉल्ट `coral`। पुराना उपनाम: `voice`।</ParamField>
    <ParamField path="instructions" type="string">स्पष्ट OpenAI `instructions` फ़ील्ड। सेट किए जाने पर, पर्सोना प्रॉम्प्ट फ़ील्ड अपने-आप मैप **नहीं** किए जाते।</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">जनरेट किए गए OpenAI TTS फ़ील्ड के बाद `/audio/speech` अनुरोध बॉडी में मिलाए गए अतिरिक्त JSON फ़ील्ड। इसका उपयोग Kokoro जैसे OpenAI-संगत एंडपॉइंट के लिए करें, जिन्हें `lang` जैसी प्रदाता-विशिष्ट कुंजियों की आवश्यकता होती है; असुरक्षित प्रोटोटाइप कुंजियों को अनदेखा किया जाता है।</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS एंडपॉइंट को ओवरराइड करता है। समाधान क्रम: कॉन्फ़िगरेशन → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`। गैर-डिफ़ॉल्ट मानों को OpenAI-संगत TTS एंडपॉइंट माना जाता है, इसलिए कस्टम मॉडल और वॉइस नाम स्वीकार किए जाते हैं, और `speed` की `0.25..4.0` रेंज जाँच लागू नहीं होती।
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">एनवायरनमेंट: `OPENROUTER_API_KEY`। `models.providers.openrouter.apiKey` का पुनः उपयोग कर सकता है।</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://openrouter.ai/api/v1`। पुराने `https://openrouter.ai/v1` को सामान्यीकृत किया जाता है।</ParamField>
    <ParamField path="model" type="string">डिफ़ॉल्ट `hexgrad/kokoro-82m`। उपनाम: `modelId`।</ParamField>
    <ParamField path="speakerVoice" type="string">डिफ़ॉल्ट `af_alloy`। पुराने उपनाम: `voice`, `voiceId`।</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>डिफ़ॉल्ट `mp3`।</ParamField>
    <ParamField path="speed" type="number">प्रदाता-मूल गति ओवरराइड।</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">एनवायरनमेंट: `VOLCENGINE_TTS_API_KEY` या `BYTEPLUS_SEED_SPEECH_API_KEY`।</ParamField>
    <ParamField path="resourceId" type="string">डिफ़ॉल्ट `seed-tts-1.0`। एनवायरनमेंट: `VOLCENGINE_TTS_RESOURCE_ID`। जब आपके प्रोजेक्ट को TTS 2.0 की पात्रता प्राप्त हो, तब `seed-tts-2.0` का उपयोग करें।</ParamField>
    <ParamField path="appKey" type="string">ऐप कुंजी हेडर। डिफ़ॉल्ट `aGjiRDfUWi`। एनवायरनमेंट: `VOLCENGINE_TTS_APP_KEY`।</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP एंडपॉइंट को ओवरराइड करता है। एनवायरनमेंट: `VOLCENGINE_TTS_BASE_URL`।</ParamField>
    <ParamField path="speakerVoice" type="string">वॉइस प्रकार। डिफ़ॉल्ट `en_female_anna_mars_bigtts`। एनवायरनमेंट: `VOLCENGINE_TTS_VOICE`। पुराना उपनाम: `voice`।</ParamField>
    <ParamField path="speedRatio" type="number">प्रदाता-मूल गति अनुपात, `0.2..3`।</ParamField>
    <ParamField path="emotion" type="string">प्रदाता-मूल भाव टैग।</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>पुराने Volcengine Speech Console फ़ील्ड। एनवायरनमेंट: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (डिफ़ॉल्ट `volcano_tts`)।</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">एनवायरनमेंट: `XAI_API_KEY`।</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.x.ai/v1`। एनवायरनमेंट: `XAI_BASE_URL`।</ParamField>
    <ParamField path="speakerVoiceId" type="string">डिफ़ॉल्ट `eve`। प्रमाणीकरण के साथ, `openclaw infer tts voices --provider xai` वर्तमान अंतर्निहित कैटलॉग प्राप्त करता है; प्रमाणीकरण के बिना यह ऑफ़लाइन फ़ॉलबैक `ara`, `eve`, `leo`, `rex`, और `sal` सूचीबद्ध करता है। खाते की कस्टम वॉइस आईडी अंतर्निहित सूची में अनुपस्थित होने पर भी अग्रेषित की जाती हैं। पुराना उपनाम: `voiceId`।</ParamField>
    <ParamField path="language" type="string">BCP-47 भाषा कोड या `auto`। डिफ़ॉल्ट `en`।</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>डिफ़ॉल्ट `mp3`।</ParamField>
    <ParamField path="speed" type="number">प्रदाता-मूल गति ओवरराइड, `0.7..1.5`।</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">परिवेश चर: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">डिफ़ॉल्ट `https://api.xiaomimimo.com/v1`. परिवेश चर: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">डिफ़ॉल्ट `mimo-v2.5-tts`. परिवेश चर: `XIAOMI_TTS_MODEL`. `mimo-v2.5-tts-voicedesign` का भी समर्थन करता है.</ParamField>
    <ParamField path="speakerVoice" type="string">पूर्वनिर्धारित-वॉइस मॉडल के लिए डिफ़ॉल्ट `mimo_default`. परिवेश चर: `XIAOMI_TTS_VOICE`. पुराना उपनाम: `voice`. `mimo-v2.5-tts-voicedesign` के लिए नहीं भेजा जाता.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>डिफ़ॉल्ट `mp3`. परिवेश चर: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">वैकल्पिक स्वाभाविक-भाषा शैली निर्देश, जो उपयोगकर्ता संदेश के रूप में भेजा जाता है; इसे बोला नहीं जाता. `mimo-v2.5-tts-voicedesign` के लिए, यह वॉइस-डिज़ाइन प्रॉम्प्ट है; इसे न देने पर OpenClaw एक डिफ़ॉल्ट प्रदान करता है.</ParamField>
  </Accordion>
</AccordionGroup>

## एजेंट टूल

`tts` टूल टेक्स्ट को वाणी में बदलता है और
उत्तर भेजने के लिए एक ऑडियो अटैचमेंट लौटाता है. Feishu, Matrix, Telegram और WhatsApp पर, ऑडियो
फ़ाइल अटैचमेंट के बजाय वॉइस संदेश के रूप में
भेजा जाता है. इस पथ पर `ffmpeg` उपलब्ध होने पर Feishu और
WhatsApp गैर-Opus TTS आउटपुट को ट्रांसकोड कर सकते हैं.

WhatsApp, Baileys के माध्यम से ऑडियो को PTT वॉइस नोट (`audio` के साथ
`ptt: true`) के रूप में भेजता है और दृश्यमान टेक्स्ट को PTT ऑडियो से **अलग**
भेजता है, क्योंकि क्लाइंट वॉइस नोट पर कैप्शन को सुसंगत रूप से रेंडर नहीं करते.

टूल वैकल्पिक `channel` और `timeoutMs` फ़ील्ड स्वीकार करता है; `timeoutMs`
प्रति-कॉल प्रदाता अनुरोध की समय-सीमा मिलीसेकंड में है. प्रति-कॉल मान
`messages.tts.timeoutMs` को ओवरराइड करते हैं; कॉन्फ़िगर की गई TTS समय-सीमाएँ Plugin द्वारा निर्धारित
किसी भी प्रदाता डिफ़ॉल्ट को ओवरराइड करती हैं.

## Gateway RPC

| विधि              | उद्देश्य                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | वर्तमान TTS स्थिति और पिछला प्रयास पढ़ें.     |
| `tts.enable`      | स्थानीय स्वचालित प्राथमिकता को `always` पर सेट करें.       |
| `tts.disable`     | स्थानीय स्वचालित प्राथमिकता को `off` पर सेट करें.          |
| `tts.convert`     | एकबारगी टेक्स्ट → ऑडियो.                        |
| `tts.setProvider` | स्थानीय प्रदाता प्राथमिकता सेट करें.               |
| `tts.personas`    | कॉन्फ़िगर किए गए व्यक्तित्व और सक्रिय व्यक्तित्व सूचीबद्ध करें. |
| `tts.setPersona`  | स्थानीय व्यक्तित्व प्राथमिकता सेट करें.                |
| `tts.providers`   | कॉन्फ़िगर किए गए प्रदाता और उनकी स्थिति सूचीबद्ध करें.        |

## सेवा लिंक

- [OpenAI टेक्स्ट-टू-स्पीच मार्गदर्शिका](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API संदर्भ](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST टेक्स्ट-टू-स्पीच](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech प्रदाता](/hi/providers/azure-speech)
- [ElevenLabs टेक्स्ट टू स्पीच](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs प्रमाणीकरण](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/hi/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/hi/providers/volcengine#text-to-speech)
- [Xiaomi MiMo वाणी संश्लेषण](/hi/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech आउटपुट प्रारूप](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI टेक्स्ट टू स्पीच](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## संबंधित

- [मीडिया अवलोकन](/hi/tools/media-overview)
- [संगीत निर्माण](/hi/tools/music-generation)
- [वीडियो निर्माण](/hi/tools/video-generation)
- [स्लैश कमांड](/hi/tools/slash-commands)
- [वॉइस कॉल Plugin](/hi/plugins/voice-call)
