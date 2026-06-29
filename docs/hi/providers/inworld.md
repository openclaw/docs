---
read_when:
    - आप आउटबाउंड जवाबों के लिए Inworld स्पीच सिंथेसिस चाहते हैं
    - आपको Inworld से PCM टेलीफोनी या OGG_OPUS वॉइस-नोट आउटपुट चाहिए
summary: OpenClaw उत्तरों के लिए Inworld स्ट्रीमिंग टेक्स्ट-टू-स्पीच
title: Inworld
x-i18n:
    generated_at: "2026-06-28T23:59:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld एक स्ट्रीमिंग टेक्स्ट-टू-स्पीच (TTS) प्रदाता है। OpenClaw में यह
आउटबाउंड उत्तर ऑडियो (डिफ़ॉल्ट रूप से MP3, वॉइस नोट्स के लिए OGG_OPUS)
और Voice Call जैसे टेलीफोनी चैनलों के लिए PCM ऑडियो सिंथेसाइज़ करता है।

OpenClaw Inworld के स्ट्रीमिंग TTS एंडपॉइंट पर पोस्ट करता है, लौटाए गए
base64 ऑडियो चंक्स को एक ही बफ़र में जोड़ता है, और परिणाम को मानक
उत्तर-ऑडियो पाइपलाइन को सौंपता है।

| गुण      | मान                                                           |
| ------------- | --------------------------------------------------------------- |
| प्रदाता id   | `inworld`                                                       |
| Plugin        | आधिकारिक बाहरी पैकेज                                       |
| अनुबंध      | `speechProviders` (केवल TTS)                                    |
| Auth env var  | `INWORLD_API_KEY` (HTTP Basic, Base64 डैशबोर्ड क्रेडेंशियल)     |
| बेस URL      | `https://api.inworld.ai`                                        |
| डिफ़ॉल्ट वॉइस | `Sarah`                                                         |
| डिफ़ॉल्ट मॉडल | `inworld-tts-1.5-max`                                           |
| आउटपुट        | MP3 (डिफ़ॉल्ट), OGG_OPUS (वॉइस नोट्स), PCM 22050 Hz (टेलीफोनी) |
| वेबसाइट       | [inworld.ai](https://inworld.ai)                                |
| Docs          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Plugin इंस्टॉल करें

आधिकारिक Plugin इंस्टॉल करें, फिर Gateway पुनः आरंभ करें:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## शुरू करना

<Steps>
  <Step title="अपनी API key सेट करें">
    अपने Inworld डैशबोर्ड (Workspace > API Keys) से क्रेडेंशियल कॉपी करें
    और उसे env var के रूप में सेट करें। मान HTTP Basic क्रेडेंशियल के रूप में
    जस का तस भेजा जाता है, इसलिए इसे फिर से Base64-encode न करें या इसे bearer
    token में परिवर्तित न करें।

    ```
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
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="संदेश भेजें">
    किसी भी कनेक्टेड चैनल के माध्यम से उत्तर भेजें। OpenClaw Inworld के साथ
    ऑडियो सिंथेसाइज़ करता है और उसे MP3 के रूप में डिलीवर करता है (या जब चैनल
    वॉइस नोट की अपेक्षा करता है तब OGG_OPUS के रूप में)।
  </Step>
</Steps>

## कॉन्फ़िगरेशन विकल्प

| विकल्प           | पाथ                                            | विवरण                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Base64 डैशबोर्ड क्रेडेंशियल। `INWORLD_API_KEY` पर फ़ॉलबैक करता है।     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Inworld API बेस URL ओवरराइड करें (डिफ़ॉल्ट `https://api.inworld.ai`)। |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | वॉइस आइडेंटिफ़ायर (डिफ़ॉल्ट `Sarah`)।                               |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | TTS मॉडल id (डिफ़ॉल्ट `inworld-tts-1.5-max`)।                     |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | सैंपलिंग तापमान `0..2` (वैकल्पिक)।                           |

## नोट्स

<AccordionGroup>
  <Accordion title="प्रमाणीकरण">
    Inworld एकल Base64-encoded क्रेडेंशियल स्ट्रिंग के साथ HTTP Basic auth
    का उपयोग करता है। इसे Inworld डैशबोर्ड से जस का तस कॉपी करें। प्रदाता
    इसे बिना किसी और एन्कोडिंग के `Authorization: Basic <apiKey>` के रूप में
    भेजता है, इसलिए इसे स्वयं Base64-encode न करें और bearer-style token पास न करें।
    इसी कॉलआउट के लिए [TTS auth notes](/hi/tools/tts#inworld-primary) देखें।
  </Accordion>
  <Accordion title="मॉडल">
    समर्थित मॉडल ids: `inworld-tts-1.5-max` (डिफ़ॉल्ट),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`।
  </Accordion>
  <Accordion title="ऑडियो आउटपुट">
    उत्तर डिफ़ॉल्ट रूप से MP3 का उपयोग करते हैं। जब चैनल लक्ष्य `voice-note`
    होता है, OpenClaw Inworld से `OGG_OPUS` मांगता है ताकि ऑडियो मूल
    वॉइस बबल की तरह चले। टेलीफोनी सिंथेसिस टेलीफोनी ब्रिज को फ़ीड करने के लिए
    22050 Hz पर raw `PCM` का उपयोग करता है।
  </Accordion>
  <Accordion title="कस्टम एंडपॉइंट्स">
    API होस्ट को `messages.tts.providers.inworld.baseUrl` से ओवरराइड करें।
    अनुरोध भेजे जाने से पहले trailing slashes हटा दिए जाते हैं।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="टेक्स्ट-टू-स्पीच" href="/hi/tools/tts" icon="waveform-lines">
    TTS अवलोकन, प्रदाता, और `messages.tts` कॉन्फ़िगरेशन।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    `messages.tts` सेटिंग्स सहित पूरा कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="प्रदाता" href="/hi/providers" icon="grid">
    सभी समर्थित OpenClaw प्रदाता।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएं और डिबगिंग चरण।
  </Card>
</CardGroup>
