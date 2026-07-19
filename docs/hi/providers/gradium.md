---
read_when:
    - आप टेक्स्ट-टू-स्पीच के लिए Gradium चाहते हैं
    - आपको Gradium API कुंजी, वॉइस या डायरेक्टिव टोकन कॉन्फ़िगरेशन की आवश्यकता है
summary: OpenClaw में Gradium टेक्स्ट-टू-स्पीच का उपयोग करें
title: ग्रेडियम
x-i18n:
    generated_at: "2026-07-19T09:15:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) OpenClaw के लिए टेक्स्ट-टू-स्पीच प्रदाता है। यह मानक ऑडियो उत्तर (WAV), वॉइस-नोट-संगत Opus आउटपुट और टेलीफ़ोनी सतहों के लिए 8 kHz u-law ऑडियो रेंडर करता है।

| गुण      | मान                                |
| ------------- | ------------------------------------ |
| प्रदाता आईडी   | `gradium`                            |
| प्रमाणीकरण          | `GRADIUM_API_KEY` या कॉन्फ़िगरेशन `apiKey` |
| बेस URL      | `https://api.gradium.ai` (डिफ़ॉल्ट)   |
| डिफ़ॉल्ट वॉइस | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin इंस्टॉल करें

Gradium एक आधिकारिक बाहरी Plugin है। इसे इंस्टॉल करें, फिर Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## सेटअप

Gradium API कुंजी बनाएँ, फिर इसे किसी एनवायरनमेंट वेरिएबल या कॉन्फ़िगरेशन कुंजी के माध्यम से उपलब्ध कराएँ। कॉन्फ़िगरेशन को एनवायरनमेंट वेरिएबल पर प्राथमिकता मिलती है।

<Tabs>
  <Tab title="एनवायरनमेंट वेरिएबल">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="कॉन्फ़िगरेशन कुंजी">
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

## कॉन्फ़िगरेशन

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

| कुंजी                                             | प्रकार   | विवरण                                                                                             |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | स्ट्रिंग | हल की गई API कुंजी। `${ENV}` और सीक्रेट संदर्भों का समर्थन करती है।                                                    |
| `messages.tts.providers.gradium.baseUrl`        | स्ट्रिंग | `api.gradium.ai` पर HTTPS Gradium API URL। अंतिम स्लैश हटा दिए जाते हैं। डिफ़ॉल्ट `https://api.gradium.ai`। |
| `messages.tts.providers.gradium.speakerVoiceId` | स्ट्रिंग | जब कोई डायरेक्टिव ओवरराइड मौजूद न हो, तब उपयोग की जाने वाली डिफ़ॉल्ट वॉइस आईडी।                                            |

आउटपुट प्रारूप लक्ष्य सतह के अनुसार अपने-आप चुना जाता है ([आउटपुट](#output) देखें) और इसे `openclaw.json` में कॉन्फ़िगर नहीं किया जा सकता।

## वॉइस

| नाम               | वॉइस आईडी           |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(डिफ़ॉल्ट)** | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### प्रति-संदेश वॉइस ओवरराइड

जब सक्रिय स्पीच नीति वॉइस ओवरराइड की अनुमति देती है, तो डायरेक्टिव टोकन से इनलाइन वॉइस बदलें (इनमें से कोई भी समान है और सभी प्रदाता-नेटिव वॉइस आईडी लेते हैं):

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

यदि स्पीच नीति वॉइस ओवरराइड अक्षम करती है, तो डायरेक्टिव का उपभोग किया जाता है, लेकिन उसे अनदेखा कर दिया जाता है।

## आउटपुट

आउटपुट प्रारूप लक्ष्य सतह के अनुसार चुना जाता है; प्रदाता अन्य प्रारूपों को सिंथेसाइज़ नहीं करता।

| लक्ष्य         | प्रारूप      | फ़ाइल एक्सटेंशन | सैंपल दर | वॉइस-संगत फ़्लैग |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| मानक ऑडियो | `wav`       | `.wav`   | प्रदाता    | नहीं                    |
| वॉइस नोट     | `opus`      | `.opus`  | प्रदाता    | हाँ                   |
| टेलीफ़ोनी      | `ulaw_8000` | लागू नहीं      | 8 kHz       | लागू नहीं                   |

## स्वतः-चयन क्रम

कॉन्फ़िगर किए गए TTS प्रदाताओं में Gradium का स्वतः-चयन क्रम `30` है। जब `messages.tts.provider` पिन नहीं किया गया हो, तब OpenClaw सक्रिय प्रदाता कैसे चुनता है, इसके लिए [टेक्स्ट-टू-स्पीच](/hi/tools/tts) देखें।

## संबंधित

- [टेक्स्ट-टू-स्पीच](/hi/tools/tts)
- [मीडिया का अवलोकन](/hi/tools/media-overview)
