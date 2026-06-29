---
read_when:
    - आप OpenClaw में Vydra मीडिया जनरेशन चाहते हैं
    - आपको Vydra API key सेटअप मार्गदर्शन चाहिए
summary: OpenClaw में Vydra इमेज, वीडियो और स्पीच का उपयोग करें
title: Vydra
x-i18n:
    generated_at: "2026-06-29T00:04:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

बंडल किया गया Vydra Plugin जोड़ता है:

- `vydra/grok-imagine` के ज़रिए इमेज जनरेशन
- `vydra/veo3` और `vydra/kling` के ज़रिए वीडियो जनरेशन
- Vydra के ElevenLabs-समर्थित TTS रूट के ज़रिए स्पीच सिंथेसिस

OpenClaw तीनों क्षमताओं के लिए वही `VYDRA_API_KEY` उपयोग करता है।

| गुण             | मान                                                                       |
| --------------- | ------------------------------------------------------------------------- |
| प्रदाता आईडी    | `vydra`                                                                   |
| Plugin          | बंडल किया गया, `enabledByDefault: true`                                   |
| ऑथ env var      | `VYDRA_API_KEY`                                                           |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice vydra-api-key`                                             |
| डायरेक्ट CLI फ़्लैग | `--vydra-api-key <key>`                                                   |
| कॉन्ट्रैक्ट     | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| बेस URL         | `https://www.vydra.ai/api/v1` (`www` होस्ट का उपयोग करें)                 |

<Warning>
  बेस URL के रूप में `https://www.vydra.ai/api/v1` का उपयोग करें। Vydra का apex होस्ट (`https://vydra.ai/api/v1`) फ़िलहाल `www` पर रीडायरेक्ट करता है। कुछ HTTP क्लाइंट उस cross-host रीडायरेक्ट पर `Authorization` हटा देते हैं, जिससे वैध API कुंजी भ्रामक ऑथ विफलता में बदल जाती है। बंडल किया गया Plugin इससे बचने के लिए सीधे `www` बेस URL का उपयोग करता है।
</Warning>

## सेटअप

<Steps>
  <Step title="इंटरैक्टिव ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    या env var सीधे सेट करें:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="डिफ़ॉल्ट क्षमता चुनें">
    नीचे दी गई क्षमताओं (इमेज, वीडियो, या स्पीच) में से एक या अधिक चुनें और मिलती-जुलती कॉन्फ़िगरेशन लागू करें।
  </Step>
</Steps>

## क्षमताएँ

<AccordionGroup>
  <Accordion title="इमेज जनरेशन">
    डिफ़ॉल्ट इमेज मॉडल:

    - `vydra/grok-imagine`

    इसे डिफ़ॉल्ट इमेज प्रदाता के रूप में सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    मौजूदा बंडल समर्थन केवल text-to-image है। Vydra के होस्ट किए गए edit routes दूरस्थ इमेज URL की अपेक्षा करते हैं, और OpenClaw अभी बंडल किए गए Plugin में Vydra-विशिष्ट upload bridge नहीं जोड़ता।

    <Note>
    साझा टूल पैरामीटर, प्रदाता चयन, और failover व्यवहार के लिए [इमेज जनरेशन](/hi/tools/image-generation) देखें।
    </Note>

  </Accordion>

  <Accordion title="वीडियो जनरेशन">
    पंजीकृत वीडियो मॉडल:

    - text-to-video के लिए `vydra/veo3`
    - image-to-video के लिए `vydra/kling`

    Vydra को डिफ़ॉल्ट वीडियो प्रदाता के रूप में सेट करें:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    नोट्स:

    - `vydra/veo3` केवल text-to-video के रूप में बंडल किया गया है।
    - `vydra/kling` को फ़िलहाल दूरस्थ इमेज URL संदर्भ की आवश्यकता होती है। स्थानीय फ़ाइल अपलोड शुरुआत में ही अस्वीकार कर दिए जाते हैं।
    - Vydra का मौजूदा `kling` HTTP रूट इस बारे में असंगत रहा है कि उसे `image_url` चाहिए या `video_url`; बंडल किया गया प्रदाता उसी दूरस्थ इमेज URL को दोनों फ़ील्ड में मैप करता है।
    - बंडल किया गया Plugin संयमित रहता है और aspect ratio, resolution, watermark, या generated audio जैसे undocumented style knobs आगे नहीं भेजता।

    <Note>
    साझा टूल पैरामीटर, प्रदाता चयन, और failover व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
    </Note>

  </Accordion>

  <Accordion title="वीडियो लाइव टेस्ट">
    प्रदाता-विशिष्ट लाइव कवरेज:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    बंडल की गई Vydra लाइव फ़ाइल अब कवर करती है:

    - `vydra/veo3` text-to-video
    - दूरस्थ इमेज URL का उपयोग करके `vydra/kling` image-to-video

    ज़रूरत होने पर दूरस्थ इमेज fixture को override करें:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="स्पीच सिंथेसिस">
    Vydra को स्पीच प्रदाता के रूप में सेट करें:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    डिफ़ॉल्ट:

    - मॉडल: `elevenlabs/tts`
    - वॉइस आईडी: `21m00Tcm4TlvDq8ikWAM`

    बंडल किया गया Plugin फ़िलहाल एक known-good डिफ़ॉल्ट वॉइस उजागर करता है और MP3 ऑडियो फ़ाइलें लौटाता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="प्रदाता डायरेक्टरी" href="/hi/providers/index" icon="list">
    सभी उपलब्ध प्रदाताओं को ब्राउज़ करें।
  </Card>
  <Card title="इमेज जनरेशन" href="/hi/tools/image-generation" icon="image">
    साझा इमेज टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    एजेंट डिफ़ॉल्ट और मॉडल कॉन्फ़िगरेशन।
  </Card>
</CardGroup>
