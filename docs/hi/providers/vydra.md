---
read_when:
    - आप OpenClaw में Vydra मीडिया जनरेशन चाहते हैं
    - आपको Vydra API कुंजी सेटअप संबंधी मार्गदर्शन चाहिए
summary: OpenClaw में Vydra इमेज, वीडियो और स्पीच का उपयोग करें
title: Vydra
x-i18n:
    generated_at: "2026-07-19T09:51:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

बंडल किया गया Vydra Plugin यह जोड़ता है:

- `vydra/grok-imagine` के माध्यम से इमेज जनरेशन
- `vydra/veo3` (टेक्स्ट-से-वीडियो) और `vydra/kling` (इमेज-से-वीडियो) के माध्यम से वीडियो जनरेशन
- Vydra के ElevenLabs-समर्थित TTS रूट के माध्यम से वाक् संश्लेषण

OpenClaw तीनों क्षमताओं के लिए समान `VYDRA_API_KEY` का उपयोग करता है।

| प्रॉपर्टी        | मान                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| प्रदाता आईडी     | `vydra`                                                                   |
| Plugin          | बंडल किया गया, `enabledByDefault: true`                                         |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल    | `VYDRA_API_KEY`                                                           |
| ऑनबोर्डिंग फ़्लैग | `--auth-choice vydra-api-key`                                             |
| प्रत्यक्ष CLI फ़्लैग | `--vydra-api-key <key>`                                                   |
| अनुबंध       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| बेस URL        | `https://www.vydra.ai/api/v1` (`www` होस्ट का उपयोग करें)                        |

<Warning>
बेस URL के रूप में `https://www.vydra.ai/api/v1` का उपयोग करें। Vydra का शीर्ष-स्तरीय होस्ट (`https://vydra.ai/api/v1`) वर्तमान में `www` पर रीडायरेक्ट करता है। कुछ HTTP क्लाइंट उस क्रॉस-होस्ट रीडायरेक्ट पर `Authorization` को हटा देते हैं, जिससे मान्य API कुंजी के लिए भ्रामक प्रमाणीकरण विफलता दिखाई देती है। इससे बचने के लिए बंडल किया गया Plugin कॉन्फ़िगर किए गए किसी भी `vydra.ai` बेस URL को `www.vydra.ai` में सामान्यीकृत करता है।
</Warning>

## सेटअप

<Steps>
  <Step title="इंटरैक्टिव ऑनबोर्डिंग चलाएँ">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    या एनवायरनमेंट वेरिएबल सीधे सेट करें:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="डिफ़ॉल्ट क्षमता चुनें">
    नीचे दी गई क्षमताओं (इमेज, वीडियो या वाक्) में से एक या अधिक चुनें और उनसे मेल खाने वाला कॉन्फ़िगरेशन लागू करें।
  </Step>
</Steps>

## क्षमताएँ

<AccordionGroup>
  <Accordion title="इमेज जनरेशन">
    डिफ़ॉल्ट और एकमात्र बंडल किया गया इमेज मॉडल:

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

    बंडल किया गया समर्थन केवल टेक्स्ट-से-इमेज के लिए है और प्रत्येक अनुरोध में अधिकतम एक इमेज बनाई जा सकती है। Vydra के होस्ट किए गए संपादन रूट दूरस्थ इमेज URL की अपेक्षा करते हैं और बंडल किया गया Plugin Vydra-विशिष्ट अपलोड ब्रिज नहीं जोड़ता।

    <Note>
    साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए [इमेज जनरेशन](/hi/tools/image-generation) देखें।
    </Note>

  </Accordion>

  <Accordion title="वीडियो जनरेशन">
    पंजीकृत वीडियो मॉडल:

    - `vydra/veo3` टेक्स्ट-से-वीडियो के लिए (इमेज संदर्भ इनपुट अस्वीकार करता है)
    - `vydra/kling` इमेज-से-वीडियो के लिए (ठीक एक दूरस्थ इमेज URL आवश्यक है)

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

    टिप्पणियाँ:

    - `vydra/kling` स्थानीय फ़ाइल अपलोड को शुरुआत में ही अस्वीकार कर देता है; केवल दूरस्थ इमेज URL संदर्भ काम करता है।
    - Vydra का `kling` HTTP रूट इस बारे में असंगत रहा है कि उसे `image_url` चाहिए या `video_url`; बंडल किया गया प्रदाता दोनों फ़ील्ड में समान दूरस्थ इमेज URL भेजता है।
    - बंडल किया गया Plugin सतर्क रुख अपनाता है और आस्पेक्ट रेशियो, रिज़ॉल्यूशन, वॉटरमार्क या जनरेट किया गया ऑडियो जैसे गैर-दस्तावेज़ित स्टाइल विकल्पों को अग्रेषित नहीं करता।

    <Note>
    साझा टूल पैरामीटर, प्रदाता चयन और फ़ेलओवर व्यवहार के लिए [वीडियो जनरेशन](/hi/tools/video-generation) देखें।
    </Note>

  </Accordion>

  <Accordion title="वीडियो लाइव परीक्षण">
    प्रदाता-विशिष्ट लाइव कवरेज:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    बंडल की गई Vydra लाइव फ़ाइल में ये शामिल हैं:

    - `vydra/veo3` टेक्स्ट-से-वीडियो
    - दूरस्थ इमेज URL का उपयोग करके `vydra/kling` इमेज-से-वीडियो

    आवश्यकता होने पर दूरस्थ इमेज फ़िक्स्चर को ओवरराइड करें:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="वाक् संश्लेषण">
    Vydra को वाक् प्रदाता के रूप में सेट करें:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    डिफ़ॉल्ट:

    - मॉडल: `elevenlabs/tts`
    - वॉइस आईडी: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    बंडल किया गया Plugin यह एक ज्ञात रूप से विश्वसनीय डिफ़ॉल्ट वॉइस उपलब्ध कराता है और MP3 ऑडियो फ़ाइलें लौटाता है।

  </Accordion>
</AccordionGroup>

## संबंधित

<CardGroup cols={2}>
  <Card title="प्रदाता निर्देशिका" href="/hi/providers/index" icon="list">
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
