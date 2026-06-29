---
read_when:
    - आप टेक्स्ट-टू-स्पीच के लिए Gradium चाहते हैं
    - आपको Gradium API कुंजी, वॉइस या डायरेक्टिव टोकन कॉन्फ़िगरेशन की आवश्यकता है
summary: OpenClaw में Gradium टेक्स्ट-टू-स्पीच का उपयोग करें
title: Gradium
x-i18n:
    generated_at: "2026-06-28T23:59:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) OpenClaw के लिए एक टेक्स्ट-टू-स्पीच प्रदाता है। Plugin सामान्य ऑडियो जवाब (WAV), वॉइस-नोट-संगत Opus आउटपुट, और टेलीफोनी सतहों के लिए 8 kHz u-law ऑडियो रेंडर कर सकता है।

| गुण           | मान                                  |
| ------------- | ------------------------------------ |
| प्रदाता id    | `gradium`                            |
| प्रमाणीकरण    | `GRADIUM_API_KEY` या config `apiKey` |
| बेस URL       | `https://api.gradium.ai` (डिफ़ॉल्ट)  |
| डिफ़ॉल्ट आवाज़ | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway रीस्टार्ट करें:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## सेटअप

Gradium API कुंजी बनाएं, फिर उसे env var या config कुंजी के साथ OpenClaw के लिए उपलब्ध कराएं।

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Plugin पहले resolved `apiKey` जांचता है और फिर `GRADIUM_API_KEY` environment variable पर fallback करता है।

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| कुंजी                                           | प्रकार | विवरण                                                                                         |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | Resolved API कुंजी। `${ENV}` और secret refs का समर्थन करती है।                                |
| `messages.tts.providers.gradium.baseUrl`        | string | API origin को override करें। trailing slashes हटा दिए जाते हैं। डिफ़ॉल्ट `https://api.gradium.ai` है। |
| `messages.tts.providers.gradium.speakerVoiceId` | string | जब कोई directive override मौजूद न हो, तब उपयोग की जाने वाली डिफ़ॉल्ट voice id।                 |

आउटपुट ऑडियो फ़ॉर्मैट runtime द्वारा target surface के आधार पर अपने-आप चुना जाता है और `openclaw.json` से configurable नहीं है। नीचे [आउटपुट](#output) देखें।

## आवाज़ें

| नाम       | Voice ID           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

डिफ़ॉल्ट आवाज़: Emma।

### प्रति-संदेश voice override

जब सक्रिय speech policy voice overrides की अनुमति देती है, तो आप directive token का उपयोग करके inline आवाज़ें बदल सकते हैं। प्रदाता-native voice ids के लिए `speakerVoiceId` का उपयोग करें।

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

अगर speech policy voice overrides को disabled करती है, तो directive consume किया जाता है लेकिन ignore किया जाता है।

## आउटपुट

runtime target surface से आउटपुट फ़ॉर्मैट चुनता है। प्रदाता आज अन्य फ़ॉर्मैट synthesize नहीं करता।

| Target         | फ़ॉर्मैट    | File ext | Sample rate | Voice-compatible flag |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| मानक ऑडियो     | `wav`       | `.wav`   | provider    | नहीं                  |
| Voice note     | `opus`      | `.opus`  | provider    | हाँ                   |
| Telephony      | `ulaw_8000` | n/a      | 8 kHz       | n/a                   |

## Auto-select order

configured TTS providers में, Gradium का auto-select order `30` है। जब `messages.tts.provider` pinned नहीं होता, तब OpenClaw सक्रिय प्रदाता कैसे चुनता है, इसके लिए [Text-to-Speech](/hi/tools/tts) देखें।

## संबंधित

- [Text-to-Speech](/hi/tools/tts)
- [Media Overview](/hi/tools/media-overview)
