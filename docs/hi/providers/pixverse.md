---
read_when:
    - आप OpenClaw में PixVerse वीडियो जनरेशन का उपयोग करना चाहते हैं
    - आपको PixVerse API कुंजी/एनवायरनमेंट सेटअप की आवश्यकता है
    - आप PixVerse को डिफ़ॉल्ट वीडियो प्रदाता बनाना चाहते हैं
summary: OpenClaw में PixVerse वीडियो जनरेशन सेटअप
title: PixVerse
x-i18n:
    generated_at: "2026-07-19T09:46:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw होस्टेड PixVerse वीडियो निर्माण के लिए आधिकारिक बाहरी plugin के रूप में `pixverse` प्रदान करता है। यह plugin, `videoGenerationProviders` अनुबंध के लिए `pixverse` प्रदाता पंजीकृत करता है।

| गुण                | मान                                                                  |
| ------------------ | -------------------------------------------------------------------- |
| प्रदाता आईडी       | `pixverse`                                                   |
| Plugin पैकेज       | `@openclaw/pixverse-provider`                                                   |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल | `PIXVERSE_API_KEY`                                      |
| ऑनबोर्डिंग फ़्लैग  | `--auth-choice pixverse-api-key`                                                   |
| प्रत्यक्ष CLI फ़्लैग | `--pixverse-api-key <key>`                                                  |
| API                | PixVerse Platform API v2 (`video_id` सबमिशन और परिणाम पोलिंग) |
| डिफ़ॉल्ट मॉडल      | `pixverse/v6`                                                   |
| डिफ़ॉल्ट API क्षेत्र | अंतरराष्ट्रीय                                                       |

## आरंभ करना

<Steps>
  <Step title="Plugin इंस्टॉल करें">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="API कुंजी सेट करें">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    विज़ार्ड प्रदाता कॉन्फ़िगरेशन में `region` और `baseUrl` लिखने से पहले अंतरराष्ट्रीय या CN एंडपॉइंट के लिए संकेत देता है (नीचे API क्षेत्र देखें)।
    गैर-इंटरैक्टिव रन (`--pixverse-api-key` या `PIXVERSE_API_KEY` से कुंजी)
    डिफ़ॉल्ट रूप से अंतरराष्ट्रीय क्षेत्र का उपयोग करते हैं।

    यदि अभी तक कोई डिफ़ॉल्ट वीडियो मॉडल कॉन्फ़िगर नहीं है, तो ऑनबोर्डिंग
    `agents.defaults.videoGenerationModel.primary` को `pixverse/v6` पर भी सेट करती है।

  </Step>
  <Step title="मौजूदा डिफ़ॉल्ट वीडियो प्रदाता बदलें (वैकल्पिक)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="वीडियो बनाएँ">
    एजेंट से वीडियो बनाने के लिए कहें। PixVerse का उपयोग स्वचालित रूप से किया जाएगा।
  </Step>
</Steps>

## समर्थित मोड और मॉडल

प्रदाता, OpenClaw के साझा वीडियो टूल के माध्यम से PixVerse निर्माण मॉडल उपलब्ध कराता है।

| मोड             | मॉडल                 | संदर्भ इनपुट            |
| --------------- | -------------------- | ----------------------- |
| टेक्स्ट-से-वीडियो | `v6` (डिफ़ॉल्ट), `c1` | कोई नहीं |
| इमेज-से-वीडियो | `v6` (डिफ़ॉल्ट), `c1` | 1 स्थानीय या रिमोट इमेज |

इमेज-से-वीडियो अनुरोध से पहले स्थानीय इमेज संदर्भ PixVerse पर अपलोड किए जाते हैं। रिमोट इमेज URL को `image_url` के रूप में PixVerse इमेज अपलोड एंडपॉइंट से भेजा जाता है।

| विकल्प          | समर्थित मान                                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| अवधि            | 1-15 सेकंड (डिफ़ॉल्ट 5)                                                                                                         |
| रिज़ॉल्यूशन      | `360P`, `540P`, `720P`, `1080P` (डिफ़ॉल्ट `540P`; `480P` अनुरोध `540P` पर मैप होते हैं) |
| आस्पेक्ट रेशियो | `16:9` (डिफ़ॉल्ट), `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9`; केवल टेक्स्ट-से-वीडियो, इमेज-से-वीडियो स्रोत इमेज का अनुसरण करता है |
| निर्मित ऑडियो   | `audio: true`                                                                                                               |

<Note>
PixVerse इमेज टेम्पलेट निर्माण अभी `image_generate` के माध्यम से उपलब्ध नहीं है। वह API टेम्पलेट आईडी द्वारा संचालित होती है, जबकि OpenClaw के साझा इमेज-निर्माण अनुबंध में वर्तमान में PixVerse-विशिष्ट टाइप किया हुआ विकल्प समूह नहीं है।
</Note>

## प्रदाता विकल्प

वीडियो प्रदाता ये वैकल्पिक प्रदाता-विशिष्ट कुंजियाँ स्वीकार करता है:

| विकल्प                               | प्रकार  | प्रभाव                                        |
| ------------------------------------ | ------ | --------------------------------------------- |
| `seed`                   | संख्या | नियतात्मक सीड, 0 से 2147483647               |
| `negativePrompt` / `negative_prompt` | स्ट्रिंग | नकारात्मक प्रॉम्प्ट                        |
| `quality`                   | स्ट्रिंग | `720p` जैसी PixVerse गुणवत्ता  |
| `motionMode` / `motion_mode` | स्ट्रिंग | इमेज-से-वीडियो मोशन मोड (डिफ़ॉल्ट `normal`) |
| `cameraMovement` / `camera_movement` | स्ट्रिंग | PixVerse कैमरा मूवमेंट प्रीसेट             |
| `templateId` / `template_id` | संख्या | सक्रिय PixVerse टेम्पलेट आईडी               |

## कॉन्फ़िगरेशन

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

## उन्नत कॉन्फ़िगरेशन

<AccordionGroup>
  <Accordion title="API क्षेत्र">
    | क्षेत्र का मान      | PixVerse API बेस URL                         |
    | ------------------ | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`                            |
    | `cn` | `https://app-api.pixverseai.cn/openapi/v2`                            |

    यदि आपकी कुंजी किसी विशिष्ट PixVerse प्लेटफ़ॉर्म क्षेत्र से संबंधित है, तो
    `models.providers.pixverse.region` को मैन्युअल रूप से सेट करें, या सेटअप विज़ार्ड में
    किसी क्षेत्र को चुनने के लिए `openclaw onboard --auth-choice pixverse-api-key`
    चलाएँ:

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
    `models.providers.pixverse.baseUrl` को केवल किसी विश्वसनीय संगत प्रॉक्सी के माध्यम से रूट करते समय सेट करें।
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
    PixVerse निर्माण अनुरोध से एक `video_id` लौटाता है। OpenClaw कार्य के
    सफल होने, विफल होने या टाइमआउट तक पहुँचने तक प्रत्येक 5 सेकंड में
    `/openapi/v2/video/result/{video_id}` को पोल करता है (डिफ़ॉल्ट 5 मिनट; इसे
    `agents.defaults.videoGenerationModel.timeoutMs` से ओवरराइड करें)।
  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="वीडियो निर्माण" href="/hi/tools/video-generation" icon="video">
    साझा टूल पैरामीटर, प्रदाता चयन और एसिंक्रोनस व्यवहार।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    वीडियो निर्माण मॉडल सहित एजेंट की डिफ़ॉल्ट सेटिंग।
  </Card>
</CardGroup>
