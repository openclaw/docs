---
read_when:
    - आप आउटबाउंड उत्तरों के लिए Azure Speech संश्लेषण चाहते हैं
    - आपको Azure Speech से नेटिव Ogg Opus वॉइस-नोट आउटपुट चाहिए
summary: OpenClaw के जवाबों के लिए Azure AI Speech टेक्स्ट-टू-स्पीच
title: Azure स्पीच
x-i18n:
    generated_at: "2026-07-19T09:11:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech एक बंडल किया गया Azure AI Speech टेक्स्ट-टू-स्पीच प्रदाता है। OpenClaw
SSML के साथ Azure Speech REST API को सीधे कॉल करता है और
मानक उत्तरों के लिए MP3, वॉइस नोट्स के लिए नेटिव Ogg/Opus तथा
Voice Call जैसे टेलीफ़ोनी चैनलों के लिए 8 kHz mulaw संश्लेषित करता है। अनुरोध, प्रदाता के स्वामित्व वाला
आउटपुट प्रारूप `X-Microsoft-OutputFormat` हेडर के माध्यम से भेजता है।

| विवरण                  | मान                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| प्रदाता ID             | `azure-speech` (उपनाम: `azure`)                                                                                |
| वेबसाइट                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| दस्तावेज़                    | [Speech REST टेक्स्ट-टू-स्पीच](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| प्रमाणीकरण                    | `AZURE_SPEECH_KEY` और `AZURE_SPEECH_REGION`                                                                  |
| डिफ़ॉल्ट वॉइस           | `en-US-JennyNeural`                                                                                            |
| डिफ़ॉल्ट फ़ाइल आउटपुट     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| डिफ़ॉल्ट वॉइस-नोट फ़ाइल | `ogg-24khz-16bit-mono-opus`                                                                                    |

## आरंभ करना

<Steps>
  <Step title="Azure Speech संसाधन बनाएँ">
    Azure पोर्टल में एक Speech संसाधन बनाएँ। Resource Management > Keys and Endpoint से **KEY 1**
    कॉपी करें और संसाधन स्थान भी कॉपी करें,
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
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="संदेश भेजें">
    किसी भी कनेक्टेड चैनल के माध्यम से उत्तर भेजें। OpenClaw, Azure Speech से ऑडियो
    संश्लेषित करता है और मानक ऑडियो के लिए MP3 या चैनल द्वारा वॉइस नोट
    अपेक्षित होने पर Ogg/Opus वितरित करता है।
  </Step>
</Steps>

## कॉन्फ़िगरेशन विकल्प

सभी विकल्प `messages.tts.providers["azure-speech"]` के अंतर्गत होते हैं।

| विकल्प                  | विवरण                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Azure Speech संसाधन कुंजी। फ़ॉलबैक के रूप में `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, या `SPEECH_KEY` का उपयोग होता है। |
| `region`                | Azure Speech संसाधन क्षेत्र। फ़ॉलबैक के रूप में `AZURE_SPEECH_REGION` या `SPEECH_REGION` का उपयोग होता है।                 |
| `endpoint`              | वैकल्पिक Azure Speech एंडपॉइंट ओवरराइड। फ़ॉलबैक के रूप में विश्वसनीय `AZURE_SPEECH_ENDPOINT` का उपयोग होता है।               |
| `baseUrl`               | वैकल्पिक Azure Speech आधार URL ओवरराइड।                                                              |
| `voice`                 | Azure वॉइस ShortName (डिफ़ॉल्ट `en-US-JennyNeural`)। लीगेसी उपनाम: `voiceId`।                         |
| `lang`                  | SSML भाषा कोड (डिफ़ॉल्ट `en-US`)।                                                                 |
| `outputFormat`          | ऑडियो-फ़ाइल आउटपुट प्रारूप (डिफ़ॉल्ट `audio-24khz-48kbitrate-mono-mp3`)।                                 |
| `voiceNoteOutputFormat` | वॉइस-नोट आउटपुट प्रारूप (डिफ़ॉल्ट `ogg-24khz-16bit-mono-opus`)।                                       |
| `timeoutMs`             | अनुरोध टाइमआउट ओवरराइड, मिलीसेकंड में। फ़ॉलबैक के रूप में वैश्विक `messages.tts.timeoutMs` का उपयोग होता है।          |

`apiKey` और `region`, `endpoint`, या
`baseUrl` में से कोई एक सेट होने पर प्रदाता को कॉन्फ़िगर किया हुआ माना जाता है। एनवायरनमेंट वेरिएबल केवल
उन कॉन्फ़िगरेशन कुंजियों के लिए फ़ॉलबैक के रूप में जाँचे जाते हैं जिन्हें सेट नहीं किया गया है। वर्कस्पेस की `.env` फ़ाइलें
`AZURE_SPEECH_ENDPOINT` सेट नहीं कर सकतीं; एंडपॉइंट रूटिंग के लिए प्रोसेस एनवायरनमेंट, वैश्विक रनटाइम dotenv
या स्पष्ट कॉन्फ़िगरेशन का उपयोग करें।

## टिप्पणियाँ

<AccordionGroup>
  <Accordion title="प्रमाणीकरण">
    Azure Speech, Azure OpenAI कुंजी के बजाय Speech संसाधन कुंजी का उपयोग करता है। कुंजी
    `Ocp-Apim-Subscription-Key` के रूप में भेजी जाती है; जब तक आप
    `endpoint` या `baseUrl` प्रदान नहीं करते, OpenClaw
    `region` से `https://<region>.tts.speech.microsoft.com` व्युत्पन्न करता है।
  </Accordion>
  <Accordion title="वॉइस नाम">
    Azure Speech वॉइस के `ShortName` मान का उपयोग करें, उदाहरण के लिए
    `en-US-JennyNeural`। बंडल किया गया प्रदाता उसी Speech संसाधन के माध्यम से
    वॉइस सूचीबद्ध कर सकता है और अप्रचलित, सेवानिवृत्त या अक्षम चिह्नित वॉइस को
    फ़िल्टर कर देता है।
  </Accordion>
  <Accordion title="ऑडियो आउटपुट">
    Azure, `audio-24khz-48kbitrate-mono-mp3`, `ogg-24khz-16bit-mono-opus`, और
    `riff-24khz-16bit-mono-pcm` जैसे आउटपुट प्रारूप स्वीकार करता है। OpenClaw
    `voice-note` लक्ष्यों के लिए Ogg/Opus का अनुरोध करता है, ताकि चैनल अतिरिक्त MP3 रूपांतरण के बिना
    नेटिव वॉइस बबल भेज सकें, और टेलीफ़ोनी लक्ष्यों के लिए
    `raw-8khz-8bit-mono-mulaw` को अनिवार्य करता है।
  </Accordion>
  <Accordion title="उपनाम">
    मौजूदा कॉन्फ़िगरेशन के लिए `azure` को प्रदाता उपनाम के रूप में स्वीकार किया जाता है, लेकिन नए
    कॉन्फ़िगरेशन में Azure OpenAI मॉडल प्रदाताओं के साथ भ्रम से बचने के लिए
    `azure-speech` का उपयोग करना चाहिए।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="टेक्स्ट-टू-स्पीच" href="/hi/tools/tts" icon="waveform-lines">
    TTS का अवलोकन, प्रदाता और `messages.tts` कॉन्फ़िगरेशन।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    `messages.tts` सेटिंग्स सहित संपूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="प्रदाता" href="/hi/providers" icon="grid">
    OpenClaw के सभी बंडल किए गए प्रदाता।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और डीबगिंग चरण।
  </Card>
</CardGroup>
