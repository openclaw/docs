---
read_when:
    - आप ऑडियो अटैचमेंट के लिए Deepgram स्पीच-टू-टेक्स्ट चाहते हैं
    - आप Voice Call के लिए Deepgram स्ट्रीमिंग ट्रांसक्रिप्शन चाहते हैं
    - आपको Deepgram कॉन्फ़िगरेशन का एक त्वरित उदाहरण चाहिए
summary: आने वाले वॉइस नोट्स के लिए Deepgram ट्रांसक्रिप्शन
title: Deepgram
x-i18n:
    generated_at: "2026-06-28T23:57:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram एक speech-to-text API है। OpenClaw में इसका उपयोग `tools.media.audio` के माध्यम से आने वाले
ऑडियो/voice-note ट्रांसक्रिप्शन और `plugins.entries.voice-call.config.streaming` के माध्यम से Voice Call
स्ट्रीमिंग STT के लिए किया जाता है।

बैच ट्रांसक्रिप्शन के लिए, OpenClaw पूरी ऑडियो फ़ाइल को Deepgram पर अपलोड करता है
और ट्रांसक्रिप्ट को उत्तर पाइपलाइन (`{{Transcript}}` +
`[Audio]` ब्लॉक) में इंजेक्ट करता है। Voice Call स्ट्रीमिंग के लिए, OpenClaw लाइव G.711
u-law फ़्रेम को Deepgram के WebSocket `listen` endpoint पर फ़ॉरवर्ड करता है और Deepgram द्वारा लौटाए जाने पर आंशिक या
अंतिम ट्रांसक्रिप्ट उत्सर्जित करता है।

| विवरण        | मान                                                        |
| ------------- | ---------------------------------------------------------- |
| वेबसाइट       | [deepgram.com](https://deepgram.com)                       |
| दस्तावेज़          | [developers.deepgram.com](https://developers.deepgram.com) |
| प्रमाणीकरण          | `DEEPGRAM_API_KEY`                                         |
| डिफ़ॉल्ट मॉडल | `nova-3`                                                   |

## शुरू करना

<Steps>
  <Step title="Set your API key">
    अपनी Deepgram API key को environment में जोड़ें:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    किसी भी जुड़े हुए channel के माध्यम से एक ऑडियो संदेश भेजें। OpenClaw इसे
    Deepgram के माध्यम से ट्रांसक्राइब करता है और ट्रांसक्रिप्ट को उत्तर पाइपलाइन में इंजेक्ट करता है।
  </Step>
</Steps>

## कॉन्फ़िगरेशन विकल्प

| विकल्प            | पथ                                                         | विवरण                           |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram model id (डिफ़ॉल्ट: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | भाषा संकेत (वैकल्पिक)              |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | भाषा पहचान सक्षम करें (वैकल्पिक)  |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | विराम चिह्न सक्षम करें (वैकल्पिक)         |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | smart formatting सक्षम करें (वैकल्पिक)    |

<Tabs>
  <Tab title="With language hint">
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
  <Tab title="With Deepgram options">
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

बंडल किया गया `deepgram` Plugin, Voice Call Plugin के लिए एक realtime transcription provider भी पंजीकृत करता है।

| सेटिंग         | कॉन्फ़िग पथ                                                             | डिफ़ॉल्ट                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| API key         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | `DEEPGRAM_API_KEY` पर fallback करता है |
| मॉडल           | `...deepgram.model`                                                     | `nova-3`                         |
| भाषा        | `...deepgram.language`                                                  | (सेट नहीं)                          |
| एन्कोडिंग        | `...deepgram.encoding`                                                  | `mulaw`                          |
| सैंपल दर     | `...deepgram.sampleRate`                                                | `8000`                           |
| Endpointing     | `...deepgram.endpointingMs`                                             | `800`                            |
| Interim results | `...deepgram.interimResults`                                            | `true`                           |

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

<Note>
Voice Call को telephony audio 8 kHz G.711 u-law के रूप में प्राप्त होता है। Deepgram
streaming provider डिफ़ॉल्ट रूप से `encoding: "mulaw"` और `sampleRate: 8000` का उपयोग करता है, इसलिए
Twilio media frames सीधे फ़ॉरवर्ड किए जा सकते हैं।
</Note>

## नोट्स

<AccordionGroup>
  <Accordion title="Authentication">
    प्रमाणीकरण मानक provider auth order का पालन करता है। `DEEPGRAM_API_KEY`
    सबसे सरल path है।
  </Accordion>
  <Accordion title="Proxy and custom endpoints">
    proxy का उपयोग करते समय `tools.media.audio.baseUrl` और
    `tools.media.audio.headers` के साथ endpoints या headers को override करें।
  </Accordion>
  <Accordion title="Output behavior">
    आउटपुट अन्य providers जैसे ही audio rules का पालन करता है (size caps, timeouts,
    transcript injection)।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Media tools" href="/hi/tools/media-overview" icon="photo-film">
    ऑडियो, इमेज, और वीडियो प्रोसेसिंग पाइपलाइन का अवलोकन।
  </Card>
  <Card title="Configuration" href="/hi/gateway/configuration" icon="gear">
    media tool settings सहित पूरा config reference।
  </Card>
  <Card title="Troubleshooting" href="/hi/help/troubleshooting" icon="wrench">
    सामान्य समस्याएँ और debugging steps।
  </Card>
  <Card title="FAQ" href="/hi/help/faq" icon="circle-question">
    OpenClaw setup के बारे में अक्सर पूछे जाने वाले प्रश्न।
  </Card>
</CardGroup>
