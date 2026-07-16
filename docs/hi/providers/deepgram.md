---
read_when:
    - आप ऑडियो अटैचमेंट के लिए Deepgram स्पीच-टू-टेक्स्ट चाहते हैं
    - आप Voice Call के लिए Deepgram स्ट्रीमिंग ट्रांसक्रिप्शन चाहते हैं
    - आपको Deepgram कॉन्फ़िगरेशन का एक त्वरित उदाहरण चाहिए
summary: इनबाउंड वॉइस नोट्स के लिए Deepgram ट्रांसक्रिप्शन
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T16:39:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram एक स्पीच-टू-टेक्स्ट API है। OpenClaw इसका उपयोग `tools.media.audio` के माध्यम से आने वाले ऑडियो/वॉइस-नोट
ट्रांसक्रिप्शन के लिए और `plugins.entries.voice-call.config.streaming` के माध्यम से Voice Call स्ट्रीमिंग STT
के लिए करता है।

बैच ट्रांसक्रिप्शन पूरी ऑडियो फ़ाइल को Deepgram पर अपलोड करता है और
ट्रांसक्रिप्ट को उत्तर पाइपलाइन (`{{Transcript}}` + `[Audio]` ब्लॉक) में सम्मिलित करता है।
Voice Call स्ट्रीमिंग, लाइव G.711 u-law फ़्रेम को Deepgram के
WebSocket `listen` एंडपॉइंट पर अग्रेषित करती है और Deepgram से प्राप्त होते ही
आंशिक/अंतिम ट्रांसक्रिप्ट जारी करती है।

| विवरण        | मान                                                      |
| ------------- | ---------------------------------------------------------- |
| वेबसाइट       | [deepgram.com](https://deepgram.com)                       |
| दस्तावेज़          | [developers.deepgram.com](https://developers.deepgram.com) |
| प्रमाणीकरण          | `DEEPGRAM_API_KEY`                                         |
| डिफ़ॉल्ट मॉडल | `nova-3`                                                   |

## आरंभ करना

<Steps>
  <Step title="अपनी API कुंजी सेट करें">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="ऑडियो प्रदाता सक्षम करें">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="वॉइस नोट भेजें">
    किसी भी कनेक्टेड चैनल के माध्यम से ऑडियो संदेश भेजें। OpenClaw, Deepgram
    के माध्यम से उसका ट्रांसक्रिप्शन करता है और ट्रांसक्रिप्ट को उत्तर पाइपलाइन में सम्मिलित करता है।
  </Step>
</Steps>

## कॉन्फ़िगरेशन विकल्प

| विकल्प     | पथ                                  | विवरण                           |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Deepgram मॉडल आईडी (डिफ़ॉल्ट: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | भाषा संकेत (वैकल्पिक)              |

`providerOptions.deepgram`, अतिरिक्त क्वेरी पैरामीटर को सीधे
Deepgram `/listen` अनुरोध में मर्ज करता है, इसलिए Deepgram द्वारा समर्थित कोई भी पैरामीटर नाम काम करता है
(उदाहरण के लिए `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="भाषा संकेत के साथ">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Deepgram विकल्पों के साथ">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call स्ट्रीमिंग STT

बंडल किया गया `deepgram` Plugin, Voice Call Plugin के लिए
रीयल-टाइम ट्रांसक्रिप्शन प्रदाता भी पंजीकृत करता है।

| सेटिंग         | कॉन्फ़िगरेशन पथ                                                             | डिफ़ॉल्ट                                      |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| API कुंजी         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY` पर फ़ॉलबैक करता है             |
| बेस URL        | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` या Deepgram का सार्वजनिक API |
| मॉडल           | `...deepgram.model`                                                     | `nova-3`                                     |
| भाषा        | `...deepgram.language`                                                  | (सेट नहीं)                                      |
| एन्कोडिंग        | `...deepgram.encoding`                                                  | `mulaw`                                      |
| सैंपल दर     | `...deepgram.sampleRate`                                                | `8000`                                       |
| एंडपॉइंटिंग     | `...deepgram.endpointingMs`                                             | `800`                                        |
| अंतरिम परिणाम | `...deepgram.interimResults`                                            | `true`                                       |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

[Deepgram कस्टम एंडपॉइंट](https://developers.deepgram.com/reference/custom-endpoints) के लिए,
`baseUrl` को एंडपॉइंट रूट पर सेट करें, जिसमें कोई भी बेस पथ शामिल हो, लेकिन `/listen` नहीं।
रीयल-टाइम एंडपॉइंट `http://`, `https://`, `ws://`, और `wss://` स्वीकार करते हैं। HTTP
को WS में मैप किया जाता है, HTTPS को WSS में मैप किया जाता है और स्पष्ट WebSocket स्कीम अपरिवर्तित रहती हैं।
विकृत URL और अन्य स्कीम के कारण सत्र सेटअप के दौरान विफलता होती है।

<Note>
Voice Call को टेलीफ़ोनी ऑडियो 8 kHz G.711 u-law के रूप में प्राप्त होता है। Deepgram
स्ट्रीमिंग प्रदाता डिफ़ॉल्ट रूप से `encoding: "mulaw"` और `sampleRate: 8000` का उपयोग करता है, इसलिए
Twilio मीडिया फ़्रेम सीधे अग्रेषित किए जा सकते हैं।
</Note>

## टिप्पणियाँ

<AccordionGroup>
  <Accordion title="प्रमाणीकरण">
    प्रमाणीकरण मानक प्रदाता प्रमाणीकरण क्रम का पालन करता है। `DEEPGRAM_API_KEY`
    सबसे सरल मार्ग है।
  </Accordion>
  <Accordion title="प्रॉक्सी और कस्टम एंडपॉइंट">
    प्रॉक्सी का उपयोग करते समय `tools.media.audio.baseUrl` और
    `tools.media.audio.headers` से एंडपॉइंट या हेडर ओवरराइड करें।
  </Accordion>
  <Accordion title="आउटपुट व्यवहार">
    आउटपुट अन्य प्रदाताओं के समान ऑडियो नियमों का पालन करता है (आकार सीमाएँ, टाइमआउट,
    ट्रांसक्रिप्ट सम्मिलन)।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="मीडिया टूल" href="/hi/tools/media-overview" icon="photo-film">
    ऑडियो, छवि और वीडियो प्रोसेसिंग पाइपलाइन का अवलोकन।
  </Card>
  <Card title="कॉन्फ़िगरेशन" href="/hi/gateway/configuration" icon="gear">
    मीडिया टूल सेटिंग सहित पूर्ण कॉन्फ़िगरेशन संदर्भ।
  </Card>
  <Card title="समस्या निवारण" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और डीबगिंग चरण।
  </Card>
  <Card title="अक्सर पूछे जाने वाले प्रश्न" href="/hi/help/faq" icon="circle-question">
    OpenClaw सेटअप के बारे में अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
