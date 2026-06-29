---
read_when:
    - आप OpenClaw में PixVerse वीडियो जनरेशन का उपयोग करना चाहते हैं
    - आपको PixVerse API कुंजी/env सेटअप की आवश्यकता है
    - आप PixVerse को डिफ़ॉल्ट वीडियो प्रदाता बनाना चाहते हैं
summary: OpenClaw में PixVerse वीडियो जनरेशन सेटअप
title: PixVerse
x-i18n:
    generated_at: "2026-06-29T00:02:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw होस्टेड PixVerse वीडियो जनरेशन के लिए आधिकारिक बाहरी Plugin के रूप में `pixverse` प्रदान करता है। Plugin `videoGenerationProviders` कॉन्ट्रैक्ट के विरुद्ध `pixverse` प्रदाता रजिस्टर करता है।

| गुण                | मान                                                                  |
| ------------------ | -------------------------------------------------------------------- |
| प्रदाता id         | `pixverse`                                                           |
| Plugin पैकेज       | `@openclaw/pixverse-provider`                                        |
| Auth env var       | `PIXVERSE_API_KEY`                                                   |
| ऑनबोर्डिंग फ्लैग   | `--auth-choice pixverse-api-key`                                     |
| डायरेक्ट CLI फ्लैग | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2 (`video_id` सबमिशन और परिणाम पोलिंग)        |
| डिफॉल्ट मॉडल       | `pixverse/v6`                                                        |
| डिफॉल्ट API क्षेत्र | अंतरराष्ट्रीय                                                         |

## शुरू करना

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API key सेट करें">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    विजार्ड `region` और `baseUrl` को प्रदाता कॉन्फिग में लिखने से पहले पूछता है कि
    अंतरराष्ट्रीय एंडपॉइंट (`https://app-api.pixverse.ai/openapi/v2`) या CN एंडपॉइंट
    (`https://app-api.pixverseai.cn/openapi/v2`) का उपयोग करना है।

  </Step>
  <Step title="PixVerse को डिफॉल्ट वीडियो प्रदाता के रूप में सेट करें">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="वीडियो जनरेट करें">
    एजेंट से वीडियो जनरेट करने के लिए कहें। PixVerse अपने आप उपयोग किया जाएगा।
  </Step>
</Steps>

## समर्थित मोड और मॉडल

प्रदाता OpenClaw के साझा वीडियो टूल के माध्यम से PixVerse जनरेशन मॉडल उपलब्ध कराता है।

| मोड            | मॉडल                 | संदर्भ इनपुट              |
| -------------- | -------------------- | ------------------------- |
| टेक्स्ट-से-वीडियो | `v6` (डिफॉल्ट), `c1` | कोई नहीं                  |
| इमेज-से-वीडियो | `v6` (डिफॉल्ट), `c1` | 1 स्थानीय या रिमोट इमेज |

इमेज-से-वीडियो अनुरोध से पहले स्थानीय इमेज संदर्भ PixVerse पर अपलोड किए जाते हैं। रिमोट इमेज URL को PixVerse इमेज अपलोड एंडपॉइंट से `image_url` के रूप में पास किया जाता है।

| विकल्प          | समर्थित मान                                                                  |
| --------------- | ----------------------------------------------------------------------------- |
| अवधि            | 1-15 सेकंड                                                                    |
| रिजॉल्यूशन      | `360P`, `540P`, `720P`, `1080P`                                               |
| आस्पेक्ट रेशियो | टेक्स्ट-से-वीडियो के लिए `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` |
| जनरेटेड ऑडियो   | `audio: true`                                                                 |

<Note>
PixVerse इमेज टेम्पलेट जनरेशन अभी `image_generate` के माध्यम से उपलब्ध नहीं है। वह API template-id द्वारा संचालित है, जबकि OpenClaw के साझा इमेज-जनरेशन कॉन्ट्रैक्ट में अभी PixVerse-विशिष्ट typed option bag नहीं है।
</Note>

## प्रदाता विकल्प

वीडियो प्रदाता ये वैकल्पिक प्रदाता-विशिष्ट कुंजियां स्वीकार करता है:

| विकल्प                              | प्रकार | प्रभाव                              |
| ------------------------------------ | ------ | ----------------------------------- |
| `seed`                               | number | समर्थित होने पर नियतात्मक seed      |
| `negativePrompt` / `negative_prompt` | string | Negative prompt                     |
| `quality`                            | string | PixVerse गुणवत्ता, जैसे `720p`      |
| `motionMode` / `motion_mode`         | string | इमेज-से-वीडियो मोशन मोड             |
| `cameraMovement` / `camera_movement` | string | PixVerse कैमरा मूवमेंट प्रीसेट       |
| `templateId` / `template_id`         | number | सक्रिय PixVerse template id         |

## कॉन्फिगरेशन

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## उन्नत कॉन्फिगरेशन

<AccordionGroup>
  <Accordion title="API क्षेत्र">
    OpenClaw डिफॉल्ट रूप से अंतरराष्ट्रीय PixVerse API का उपयोग करता है। जब आपकी key किसी विशिष्ट PixVerse प्लेटफॉर्म क्षेत्र से संबंधित हो, तो `models.providers.pixverse.region`
    मैन्युअल रूप से सेट करें, या सेटअप विजार्ड में एक चुनने के लिए
    `openclaw onboard --auth-choice pixverse-api-key` का उपयोग करें:

    | क्षेत्र मान       | PixVerse API बेस URL                         |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="कस्टम बेस URL">
    भरोसेमंद संगत प्रॉक्सी के माध्यम से रूट करते समय ही `models.providers.pixverse.baseUrl` सेट करें।
    `baseUrl` को `region` पर प्राथमिकता मिलती है।

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="कार्य पोलिंग">
    PixVerse जनरेशन अनुरोध से एक `video_id` लौटाता है। OpenClaw
    `/openapi/v2/video/result/{video_id}` को तब तक poll करता है जब तक कार्य सफल नहीं हो जाता, विफल नहीं हो जाता,
    या समय समाप्त नहीं हो जाता।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा टूल पैरामीटर, प्रदाता चयन, और async व्यवहार।
  </Card>
  <Card title="कॉन्फिगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    वीडियो जनरेशन मॉडल सहित एजेंट डिफॉल्ट सेटिंग्स।
  </Card>
</CardGroup>
