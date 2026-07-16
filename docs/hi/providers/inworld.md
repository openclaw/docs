---
read_when:
    - आप आउटबाउंड जवाबों के लिए Inworld वाक् संश्लेषण चाहते हैं
    - आपको Inworld से PCM टेलीफ़ोनी या OGG_OPUS वॉइस-नोट आउटपुट चाहिए
summary: OpenClaw के उत्तरों के लिए Inworld स्ट्रीमिंग टेक्स्ट-टू-स्पीच
title: Inworld
x-i18n:
    generated_at: "2026-07-16T16:56:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld एक स्ट्रीमिंग टेक्स्ट-टू-स्पीच (TTS) प्रदाता है। OpenClaw में यह बाहर भेजे जाने वाले उत्तरों के ऑडियो (डिफ़ॉल्ट रूप से MP3, वॉइस नोट्स के लिए OGG_OPUS) और Voice Call जैसे टेलीफ़ोनी चैनलों के लिए रॉ PCM ऑडियो को संश्लेषित करता है।

OpenClaw, Inworld के स्ट्रीमिंग TTS एंडपॉइंट पर अनुरोध भेजता है, लौटाए गए base64 ऑडियो खंडों को एकल बफ़र में जोड़ता है और परिणाम को मानक उत्तर-ऑडियो पाइपलाइन को सौंप देता है।

| गुण           | मान                                                             |
| ------------- | --------------------------------------------------------------- |
| प्रदाता आईडी  | `inworld`                                                       |
| Plugin        | आधिकारिक बाहरी पैकेज (`@openclaw/inworld-speech`)          |
| अनुबंध        | `speechProviders` (केवल TTS)                                    |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल | `INWORLD_API_KEY` (HTTP Basic, Base64 डैशबोर्ड क्रेडेंशियल)     |
| बेस URL       | `https://api.inworld.ai`                                        |
| डिफ़ॉल्ट वॉइस | `Sarah`                                                         |
| डिफ़ॉल्ट मॉडल | `inworld-tts-1.5-max`                                           |
| आउटपुट        | MP3 (डिफ़ॉल्ट), OGG_OPUS (वॉइस नोट्स), PCM 22050 Hz (टेलीफ़ोनी) |
| वेबसाइट       | [inworld.ai](https://inworld.ai)                                |
| दस्तावेज़     | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin इंस्टॉल करें

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## आरंभ करना

<Steps>
  <Step title="अपनी API कुंजी सेट करें">
    अपने Inworld डैशबोर्ड (Workspace > API Keys) से क्रेडेंशियल कॉपी करें और उसे एनवायरनमेंट वेरिएबल के रूप में सेट करें। मान को HTTP Basic क्रेडेंशियल के रूप में ज्यों का त्यों भेजा जाता है, इसलिए उसे फिर से Base64-एन्कोड न करें या bearer टोकन में न बदलें।

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="messages.tts में Inworld चुनें">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="संदेश भेजें">
    किसी भी कनेक्ट किए गए चैनल के माध्यम से उत्तर भेजें। OpenClaw, Inworld से ऑडियो संश्लेषित करता है और उसे MP3 के रूप में डिलीवर करता है (या जब चैनल वॉइस नोट की अपेक्षा करता है, तब OGG_OPUS के रूप में)।
  </Step>
</Steps>

## कॉन्फ़िगरेशन विकल्प

| विकल्प        | पथ                                           | विवरण                                                               |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 डैशबोर्ड क्रेडेंशियल। उपलब्ध न होने पर `INWORLD_API_KEY` का उपयोग करता है।       |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Inworld API के बेस URL को ओवरराइड करें (डिफ़ॉल्ट `https://api.inworld.ai`)।   |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | वॉइस पहचानकर्ता (डिफ़ॉल्ट `Sarah`)। पुराना उपनाम: `speakerVoiceId`। |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS मॉडल आईडी (डिफ़ॉल्ट `inworld-tts-1.5-max`)।                       |
| `temperature` | `messages.tts.providers.inworld.temperature` | सैंपलिंग तापमान, `0` (अपवर्जित) से `2` (वैकल्पिक)।            |

## टिप्पणियाँ

<AccordionGroup>
  <Accordion title="प्रमाणीकरण">
    Inworld एक Base64-एन्कोडेड क्रेडेंशियल स्ट्रिंग के साथ HTTP Basic प्रमाणीकरण का उपयोग करता है। इसे Inworld डैशबोर्ड से ज्यों का त्यों कॉपी करें। प्रदाता इसे बिना किसी अतिरिक्त एन्कोडिंग के `Authorization: Basic <apiKey>` के रूप में भेजता है, इसलिए इसे स्वयं Base64-एन्कोड न करें और bearer-शैली का टोकन न दें। इसी चेतावनी के लिए [TTS प्रमाणीकरण टिप्पणियाँ](/hi/tools/tts#inworld-primary) देखें।
  </Accordion>
  <Accordion title="मॉडल">
    समर्थित मॉडल आईडी: `inworld-tts-1.5-max` (डिफ़ॉल्ट), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`।
  </Accordion>
  <Accordion title="ऑडियो आउटपुट">
    उत्तर डिफ़ॉल्ट रूप से MP3 का उपयोग करते हैं। जब चैनल लक्ष्य `voice-note` होता है, तब OpenClaw, Inworld से `OGG_OPUS` का अनुरोध करता है, ताकि ऑडियो मूल वॉइस बबल के रूप में चले। टेलीफ़ोनी संश्लेषण, टेलीफ़ोनी ब्रिज को इनपुट देने के लिए 22050 Hz पर रॉ `PCM` का उपयोग करता है।
  </Accordion>
  <Accordion title="कस्टम एंडपॉइंट">
    `messages.tts.providers.inworld.baseUrl` से API होस्ट को ओवरराइड करें। अनुरोध भेजे जाने से पहले अंत में आने वाले स्लैश हटा दिए जाते हैं।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="टेक्स्ट-टू-स्पीच" href="/hi/tools/tts" icon="waveform-lines">
    TTS का अवलोकन, प्रदाता और `messages.tts` कॉन्फ़िगरेशन।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    `messages.tts` सेटिंग सहित पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="प्रदाता" href="/hi/providers" icon="grid">
    OpenClaw के सभी समर्थित प्रदाता।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और डीबगिंग के चरण।
  </Card>
</CardGroup>
