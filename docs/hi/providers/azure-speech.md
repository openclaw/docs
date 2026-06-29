---
read_when:
    - आप आउटबाउंड उत्तरों के लिए Azure Speech संश्लेषण चाहते हैं
    - आपको Azure Speech से नेटिव Ogg Opus वॉइस-नोट आउटपुट चाहिए
summary: OpenClaw उत्तरों के लिए Azure AI Speech टेक्स्ट-टू-स्पीच
title: Azure Speech
x-i18n:
    generated_at: "2026-06-28T23:56:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech एक Azure AI Speech टेक्स्ट-टू-स्पीच प्रदाता है। OpenClaw में यह
आउटबाउंड उत्तर ऑडियो को डिफ़ॉल्ट रूप से MP3, वॉइस नोट्स के लिए मूल Ogg/Opus,
और Voice Call जैसे टेलीफोनी चैनलों के लिए 8 kHz mulaw ऑडियो के रूप में संश्लेषित करता है।

OpenClaw SSML के साथ सीधे Azure Speech REST API का उपयोग करता है और
प्रदाता-स्वामित्व वाला आउटपुट फ़ॉर्मैट `X-Microsoft-OutputFormat` के माध्यम से भेजता है।

| विवरण                  | मान                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| वेबसाइट                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| दस्तावेज़                    | [Speech REST टेक्स्ट-टू-स्पीच](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| प्रमाणीकरण                    | `AZURE_SPEECH_KEY` और `AZURE_SPEECH_REGION`                                                                  |
| डिफ़ॉल्ट वॉइस           | `en-US-JennyNeural`                                                                                            |
| डिफ़ॉल्ट फ़ाइल आउटपुट     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| डिफ़ॉल्ट वॉइस-नोट फ़ाइल | `ogg-24khz-16bit-mono-opus`                                                                                    |

## शुरू करना

<Steps>
  <Step title="Azure Speech संसाधन बनाएँ">
    Azure पोर्टल में, Speech संसाधन बनाएँ। Resource Management > Keys and Endpoint से **KEY 1** कॉपी करें,
    और संसाधन स्थान कॉपी करें
    जैसे `eastus`।

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="messages.tts में Azure Speech चुनें">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="संदेश भेजें">
    किसी भी जुड़े हुए चैनल के माध्यम से उत्तर भेजें। OpenClaw Azure Speech
    के साथ ऑडियो संश्लेषित करता है और मानक ऑडियो के लिए MP3 डिलीवर करता है, या
    जब चैनल वॉइस नोट की अपेक्षा करता है तो Ogg/Opus।
  </Step>
</Steps>

## कॉन्फ़िगरेशन विकल्प

| विकल्प                  | पथ                                                        | विवरण                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech संसाधन कुंजी। `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, या `SPEECH_KEY` पर फ़ॉलबैक करता है। |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech संसाधन क्षेत्र। `AZURE_SPEECH_REGION` या `SPEECH_REGION` पर फ़ॉलबैक करता है।                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | वैकल्पिक Azure Speech एंडपॉइंट/बेस URL ओवरराइड।                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | वैकल्पिक Azure Speech बेस URL ओवरराइड।                                                              |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | Azure वॉइस ShortName (डिफ़ॉल्ट `en-US-JennyNeural`)। लेगेसी उपनाम: `voice`।                           |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML भाषा कोड (डिफ़ॉल्ट `en-US`)।                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | ऑडियो-फ़ाइल आउटपुट फ़ॉर्मैट (डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`)।                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | वॉइस-नोट आउटपुट फ़ॉर्मैट (डिफ़ॉल्ट `ogg-24khz-16bit-mono-opus`)।                                       |

## नोट्स

<AccordionGroup>
  <Accordion title="प्रमाणीकरण">
    Azure Speech, Azure OpenAI कुंजी नहीं, बल्कि Speech संसाधन कुंजी का उपयोग करता है। कुंजी
    `Ocp-Apim-Subscription-Key` के रूप में भेजी जाती है; OpenClaw `region` से
    `https://<region>.tts.speech.microsoft.com` निकालता है, जब तक कि आप
    `endpoint` या `baseUrl` प्रदान नहीं करते।
  </Accordion>
  <Accordion title="वॉइस नाम">
    Azure Speech वॉइस `ShortName` मान का उपयोग करें, उदाहरण के लिए
    `en-US-JennyNeural`। बंडल किया गया प्रदाता उसी
    Speech संसाधन के माध्यम से वॉइसों की सूची दे सकता है और deprecated या retired चिह्नित वॉइसों को फ़िल्टर करता है।
  </Accordion>
  <Accordion title="ऑडियो आउटपुट">
    Azure `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus`, और `riff-24khz-16bit-mono-pcm` जैसे आउटपुट फ़ॉर्मैट स्वीकार करता है। OpenClaw
    `voice-note` लक्ष्यों के लिए Ogg/Opus का अनुरोध करता है, ताकि चैनल अतिरिक्त MP3 रूपांतरण के बिना मूल
    वॉइस बबल भेज सकें।
  </Accordion>
  <Accordion title="उपनाम">
    मौजूदा PRs और उपयोगकर्ता कॉन्फ़िग के लिए `azure` को प्रदाता उपनाम के रूप में स्वीकार किया जाता है,
    लेकिन नए कॉन्फ़िग में Azure
    OpenAI मॉडल प्रदाताओं के साथ भ्रम से बचने के लिए `azure-speech` का उपयोग करना चाहिए।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="टेक्स्ट-टू-स्पीच" href="/hi/tools/tts" icon="waveform-lines">
    TTS अवलोकन, प्रदाता, और `messages.tts` कॉन्फ़िग।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    `messages.tts` सेटिंग्स सहित पूर्ण कॉन्फ़िग संदर्भ।
  </Card>
  <Card title="प्रदाता" href="/hi/providers" icon="grid">
    सभी बंडल किए गए OpenClaw प्रदाता।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और डीबगिंग चरण।
  </Card>
</CardGroup>
