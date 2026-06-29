---
read_when:
    - आप OpenClaw में Runway वीडियो जनरेशन का उपयोग करना चाहते हैं
    - आपको Runway API कुंजी/env सेटअप की आवश्यकता है
    - आप Runway को डिफ़ॉल्ट वीडियो प्रदाता बनाना चाहते हैं
summary: OpenClaw में Runway वीडियो जनरेशन सेटअप
title: रनवे
x-i18n:
    generated_at: "2026-06-29T00:02:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw होस्टेड वीडियो जनरेशन के लिए एक बंडल किया हुआ `runway` प्रदाता शिप करता है। Plugin डिफ़ॉल्ट रूप से सक्षम होता है और `videoGenerationProviders` कॉन्ट्रैक्ट के विरुद्ध `runway` प्रदाता रजिस्टर करता है।

| गुण             | मान                                                               |
| --------------- | ----------------------------------------------------------------- |
| प्रदाता आईडी    | `runway`                                                          |
| Plugin          | बंडल किया हुआ, `enabledByDefault: true`                           |
| प्रमाणीकरण env vars | `RUNWAYML_API_SECRET` (कैनोनिकल) या `RUNWAY_API_KEY`              |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice runway-api-key`                                    |
| प्रत्यक्ष CLI फ़्लैग | `--runway-api-key <key>`                                          |
| API             | Runway टास्क-आधारित वीडियो जनरेशन (`GET /v1/tasks/{id}` पोलिंग) |
| डिफ़ॉल्ट मॉडल   | `runway/gen4.5`                                                   |

## शुरू करना

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Set Runway as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Generate a video">
    एजेंट से वीडियो जनरेट करने के लिए कहें। Runway अपने आप उपयोग किया जाएगा।
  </Step>
</Steps>

## समर्थित मोड और मॉडल

प्रदाता तीन मोड में विभाजित सात Runway मॉडल उपलब्ध कराता है। वही मॉडल आईडी एक से अधिक मोड में काम कर सकती है (उदाहरण के लिए `gen4.5` टेक्स्ट-से-वीडियो और इमेज-से-वीडियो, दोनों के लिए काम करता है)।

| मोड              | मॉडल                                                                  | संदर्भ इनपुट              |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| टेक्स्ट-से-वीडियो  | `gen4.5` (डिफ़ॉल्ट), `veo3.1`, `veo3.1_fast`, `veo3`                    | कोई नहीं                 |
| इमेज-से-वीडियो | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 स्थानीय या रिमोट इमेज |
| वीडियो-से-वीडियो | `gen4_aleph`                                                           | 1 स्थानीय या रिमोट वीडियो |

स्थानीय इमेज और वीडियो संदर्भ data URIs के माध्यम से समर्थित हैं।

| आस्पेक्ट रेशियो       | अनुमत मान                                    |
| --------------------- | ------------------------------------------- |
| टेक्स्ट-से-वीडियो      | `16:9`, `9:16`                              |
| इमेज और वीडियो एडिट | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  वीडियो-से-वीडियो के लिए वर्तमान में `runway/gen4_aleph` आवश्यक है। अन्य Runway मॉडल आईडी वीडियो संदर्भ इनपुट अस्वीकार करती हैं।
</Warning>

<Note>
  गलत कॉलम से Runway मॉडल आईडी चुनने पर API अनुरोध OpenClaw से बाहर जाने से पहले एक स्पष्ट त्रुटि मिलती है। प्रदाता `extensions/runway/video-generation-provider.ts` में मोड की अनुमति-सूची (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) के विरुद्ध `model` को वैलिडेट करता है।
</Note>

## कॉन्फ़िगरेशन

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="Environment variable aliases">
    OpenClaw `RUNWAYML_API_SECRET` (कैनोनिकल) और `RUNWAY_API_KEY`, दोनों को पहचानता है।
    इनमें से कोई भी वैरिएबल Runway प्रदाता को प्रमाणित करेगा।
  </Accordion>

  <Accordion title="Task polling">
    Runway टास्क-आधारित API का उपयोग करता है। जनरेशन अनुरोध सबमिट करने के बाद, OpenClaw
    वीडियो तैयार होने तक `GET /v1/tasks/{id}` पोल करता है। पोलिंग व्यवहार के लिए कोई अतिरिक्त
    कॉन्फ़िगरेशन आवश्यक नहीं है।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="Video generation" href="/hi/tools/video-generation" icon="video">
    साझा टूल पैरामीटर, प्रदाता चयन, और async व्यवहार।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    वीडियो जनरेशन मॉडल सहित एजेंट डिफ़ॉल्ट सेटिंग्स।
  </Card>
</CardGroup>
