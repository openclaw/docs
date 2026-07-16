---
read_when:
    - आप OpenClaw में ElevenLabs टेक्स्ट-टू-स्पीच चाहते हैं
    - आप ऑडियो अटैचमेंट के लिए ElevenLabs Scribe स्पीच-टू-टेक्स्ट चाहते हैं
    - आप Voice Call या Google Meet के लिए ElevenLabs का रीयल-टाइम ट्रांसक्रिप्शन चाहते हैं
summary: OpenClaw के साथ ElevenLabs स्पीच, Scribe STT और रीयल-टाइम ट्रांसक्रिप्शन का उपयोग करें
title: ElevenLabs
x-i18n:
    generated_at: "2026-07-16T16:53:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c11b727bb0b1d645c424821dd1bc54c7109d50bd31e3853d04dfa25916bc66c7
    source_path: providers/elevenlabs.md
    workflow: 16
---

OpenClaw टेक्स्ट-टू-स्पीच के लिए ElevenLabs, Scribe v2 के साथ बैच स्पीच-टू-टेक्स्ट
और Scribe v2 Realtime के साथ स्ट्रीमिंग STT का उपयोग करता है। Plugin बंडल किया हुआ है और
डिफ़ॉल्ट रूप से सक्षम है; किसी `plugins install` चरण की आवश्यकता नहीं है।

| क्षमता                   | OpenClaw सतह                                                          | डिफ़ॉल्ट                 |
| ------------------------ | -------------------------------------------------------------------- | ------------------------ |
| टेक्स्ट-टू-स्पीच         | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| बैच स्पीच-टू-टेक्स्ट     | `tools.media.audio`                                                  | `scribe_v2`              |
| स्ट्रीमिंग स्पीच-टू-टेक्स्ट | Voice Call स्ट्रीमिंग या Google Meet `realtime.transcriptionProvider` | `scribe_v2_realtime`     |

## प्रमाणीकरण

परिवेश में `ELEVENLABS_API_KEY` सेट करें। मौजूदा ElevenLabs टूलिंग के साथ
संगतता के लिए `XI_API_KEY` भी स्वीकार किया जाता है।

```bash
export ELEVENLABS_API_KEY="..."
```

## टेक्स्ट-टू-स्पीच

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

ElevenLabs v3 TTS का उपयोग करने के लिए `modelId` को `eleven_v3` पर सेट करें। OpenClaw मौजूदा
इंस्टॉलेशन के लिए `eleven_multilingual_v2` को डिफ़ॉल्ट रखता है।

जब ElevenLabs चयनित `voice.tts`/`messages.tts` प्रदाता होता है, तब Discord वॉइस चैनल
ElevenLabs के स्ट्रीमिंग TTS एंडपॉइंट का उपयोग करते हैं: OpenClaw द्वारा पहले पूरी
ऑडियो फ़ाइल डाउनलोड किए जाने की प्रतीक्षा करने के बजाय, लौटाई गई ऑडियो स्ट्रीम से
प्लेबैक शुरू हो जाता है। इसे स्वीकार करने वाले मॉडल के लिए `latencyTier`, ElevenLabs के `optimize_streaming_latency`
क्वेरी पैरामीटर से मैप होता है; OpenClaw `eleven_v3` के लिए उस पैरामीटर को
हटा देता है, क्योंकि वह इसे अस्वीकार करता है।

## स्पीच-टू-टेक्स्ट

इनबाउंड ऑडियो अटैचमेंट और रिकॉर्ड किए गए छोटे वॉइस खंडों के लिए Scribe v2 का उपयोग करें:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw, `model_id: "scribe_v2"` के साथ ElevenLabs `/v1/speech-to-text` को
मल्टीपार्ट ऑडियो भेजता है। उपलब्ध होने पर भाषा संकेत `language_code` से मैप होते हैं।

## स्ट्रीमिंग STT

बंडल किया गया `elevenlabs` Plugin, Voice Call और
Google Meet एजेंट-मोड स्ट्रीमिंग ट्रांसक्रिप्शन के लिए Scribe v2 Realtime पंजीकृत करता है।

| सेटिंग          | कॉन्फ़िगरेशन पथ                                                          | डिफ़ॉल्ट                                          |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API कुंजी       | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | `ELEVENLABS_API_KEY` / `XI_API_KEY` पर फ़ॉलबैक करता है |
| मॉडल            | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| ऑडियो प्रारूप   | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| सैंपल दर        | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| कमिट रणनीति     | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| भाषा            | `...elevenlabs.languageCode`                                              | (सेट नहीं)                                        |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call को Twilio मीडिया 8 kHz G.711 u-law के रूप में प्राप्त होता है। ElevenLabs रीयलटाइम
प्रदाता का डिफ़ॉल्ट `ulaw_8000` है, इसलिए टेलीफ़ोनी फ़्रेम को ट्रांसकोडिंग के बिना
अग्रेषित किया जा सकता है।
</Note>

Google Meet एजेंट मोड के लिए,
`plugins.entries.google-meet.config.realtime.transcriptionProvider` को
`"elevenlabs"` पर सेट करें और
`plugins.entries.google-meet.config.realtime.providers.elevenlabs` के अंतर्गत वही प्रदाता ब्लॉक कॉन्फ़िगर करें।

## संबंधित

- [टेक्स्ट-टू-स्पीच](/hi/tools/tts)
- [Google Meet](/hi/plugins/google-meet)
- [मॉडल चयन](/hi/concepts/model-providers)
