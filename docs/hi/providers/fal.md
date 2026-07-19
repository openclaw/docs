---
read_when:
    - आप OpenClaw में fal इमेज जनरेशन का उपयोग करना चाहते हैं
    - आपको FAL_KEY प्रमाणीकरण प्रवाह की आवश्यकता है
    - आप `image_generate`, `video_generate`, या `music_generate` के लिए fal डिफ़ॉल्ट चाहते हैं
summary: OpenClaw में fal इमेज, वीडियो और संगीत जनरेशन सेटअप
title: Fal
x-i18n:
    generated_at: "2026-07-19T09:13:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw होस्ट की गई छवि, वीडियो और संगीत जनरेशन के लिए एक बंडल किया गया `fal` प्रोवाइडर उपलब्ध कराता है।

| प्रॉपर्टी | मान                                                                           |
| -------- | ------------------------------------------------------------------------------- |
| प्रोवाइडर | `fal`                                                                           |
| प्रमाणीकरण     | `FAL_KEY` (मानक; `FAL_API_KEY` फ़ॉलबैक के रूप में भी काम करता है)                   |
| API      | fal मॉडल एंडपॉइंट (`https://fal.run`; वीडियो जॉब `https://queue.fal.run` का उपयोग करते हैं) |
| बेस URL | `models.providers.fal.baseUrl` से ओवरराइड करें                                    |

## आरंभ करना

<Steps>
  <Step title="API कुंजी सेट करें">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    गैर-इंटरैक्टिव सेटअप `--fal-api-key <key>` पास कर सकते हैं या `FAL_KEY` एक्सपोर्ट कर सकते हैं।
    यदि कोई डिफ़ॉल्ट छवि मॉडल कॉन्फ़िगर नहीं किया गया है, तो ऑनबोर्डिंग
    `fal/fal-ai/flux/dev` को डिफ़ॉल्ट छवि मॉडल के रूप में भी सेट करती है।

  </Step>
  <Step title="डिफ़ॉल्ट छवि मॉडल सेट करें">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## छवि जनरेशन

बंडल किया गया `fal` छवि-जनरेशन प्रोवाइडर डिफ़ॉल्ट रूप से
`fal/fal-ai/flux/dev` का उपयोग करता है।

| क्षमता     | मान                                                              |
| -------------- | ------------------------------------------------------------------ |
| अधिकतम छवियाँ     | प्रति अनुरोध 4; Krea 2: प्रति अनुरोध 1                               |
| आकार ओवरराइड | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`    |
| अभिमुखता अनुपात   | Flux छवि-से-छवि को छोड़कर सभी जगह समर्थित                    |
| रिज़ॉल्यूशन     | `1K`, `2K`, `4K` (प्रति-मॉडल सीमाएँ नीचे दी गई हैं)                          |
| आउटपुट प्रारूप  | `png` (डिफ़ॉल्ट) या `jpeg`; Krea 2, `outputFormat` ओवरराइड अस्वीकार करता है |

संपादन अनुरोध (साझा `image` / `images` पैरामीटर के माध्यम से संदर्भ छवियाँ)
प्रति-मॉडल संदर्भ सीमाओं वाले प्रति-मॉडल संपादन एंडपॉइंट पर भेजे जाते हैं:

| मॉडल परिवार              | `fal/` के बाद मॉडल संदर्भ                 | संपादन एंडपॉइंट     | अधिकतम संदर्भ छवियाँ |
| ------------------------- | -------------------------------------- | ----------------- | -------------------- |
| Flux और अन्य fal मॉडल | `fal-ai/flux/dev` (डिफ़ॉल्ट)            | `/image-to-image` | 1                    |
| GPT Image                 | `openai/gpt-image-*`                   | `/edit`           | 10                   |
| Grok Imagine              | `xai/grok-imagine-image`               | `/edit`           | 3                    |
| Nano Banana (लीगेसी)      | `fal-ai/nano-banana`                   | `/edit`           | 3                    |
| Nano Banana 2             | `fal-ai/nano-banana-*`                 | `/edit`           | 14                   |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`            | `/edit`           | 14                   |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image` | कोई नहीं (शैली संदर्भ) | 10 शैली संदर्भ  |

<Warning>
Flux छवि-से-छवि अनुरोध `aspectRatio` ओवरराइड का समर्थन **नहीं** करते। GPT
Image और Nano Banana 2 संपादन अनुरोध fal के `/edit` एंडपॉइंट का उपयोग करते हैं और
अभिमुखता-अनुपात संकेत स्वीकार करते हैं। Nano Banana 2 अतिरिक्त-नेटिव चौड़े/लंबे अनुपात भी स्वीकार करता है,
जैसे `4:1`, `1:4`, `8:1`, और `1:8`; Krea 2 अपने छोटे
अभिमुखता-अनुपात उपसमुच्चय को सत्यापित करता है। Grok Imagine की अपनी अनुपात सूची है (जिसमें `2:1`,
`20:9`, `19.5:9`, और उनके व्युत्क्रम शामिल हैं) और यह केवल `1K`/`2K` रिज़ॉल्यूशन स्वीकार करता है;
लीगेसी Nano Banana और Nano Banana 2 Lite, `resolution` ओवरराइड अस्वीकार करते हैं।
</Warning>

Krea 2 मॉडल fal की नेटिव Krea पेलोड स्कीमा का उपयोग करते हैं। OpenClaw,
Flux द्वारा उपयोग किए जाने वाले सामान्य `image_size` / संपादन-एंडपॉइंट पेलोड के बजाय
`aspect_ratio`, `creativity`, और `image_style_references` भेजता है। मॉडल संदर्भ ये हैं:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

तेज़ अभिव्यंजक चित्रण, एनीमे, पेंटिंग और कलात्मक शैलियों के लिए Medium का उपयोग करें।
धीमे फ़ोटोरियल, कच्ची बनावट, फ़िल्म ग्रेन और विस्तृत रूप के लिए Large का उपयोग करें।
Krea डिफ़ॉल्ट रूप से `fal.creativity: "medium"` का उपयोग करता है; समर्थित मान
`raw`, `low`, `medium`, और `high` हैं।

fal की अनुरोध स्कीमा में Krea 2, `image_size` के बजाय अभिमुखता अनुपात उपलब्ध कराता है।
`aspectRatio` को प्राथमिकता दें; OpenClaw, `size` को निकटतम समर्थित Krea अभिमुखता अनुपात से मैप करता है
और Krea के लिए `resolution` को छोड़ने के बजाय अस्वीकार करता है।

जब ऐसे fal मॉडलों से PNG आउटपुट चाहिए जो `output_format` उपलब्ध कराते हैं, तो
`outputFormat: "png"` का उपयोग करें। fal, OpenClaw में पारदर्शी पृष्ठभूमि का
कोई स्पष्ट नियंत्रण घोषित नहीं करता, इसलिए fal मॉडलों के लिए `background: "transparent"` को अनदेखे
ओवरराइड के रूप में रिपोर्ट किया जाता है।
Krea 2 एंडपॉइंट fal के माध्यम से `output_format` अनुरोध फ़ील्ड उपलब्ध नहीं कराते, इसलिए
OpenClaw Krea अनुरोधों के लिए `outputFormat` ओवरराइड अस्वीकार करता है।

Krea 2 Medium का उपयोग करने के लिए:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## वीडियो जनरेशन

बंडल किया गया `fal` वीडियो-जनरेशन प्रोवाइडर डिफ़ॉल्ट रूप से
`fal/fal-ai/minimax/video-01-live` का उपयोग करता है।

| क्षमता | मान                                                              |
| ---------- | ------------------------------------------------------------------ |
| मोड      | टेक्स्ट-से-वीडियो, एकल-छवि संदर्भ, Seedance संदर्भ-से-वीडियो |
| रनटाइम    | लंबे समय तक चलने वाले जॉब के लिए कतार-समर्थित सबमिट/स्थिति/परिणाम प्रवाह       |
| टाइमआउट    | डिफ़ॉल्ट रूप से प्रति जॉब 20 मिनट; हर 5 सेकंड में स्थिति की जाँच       |

<AccordionGroup>
  <Accordion title="उपलब्ध वीडियो मॉडल">
    **MiniMax (डिफ़ॉल्ट):**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling और Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    MiniMax Live और HeyGen अनुरोध केवल प्रॉम्प्ट तथा एक वैकल्पिक
    एकल संदर्भ छवि भेजते हैं; अन्य ओवरराइड अग्रेषित नहीं किए जाते। Seedance मॉडल
    `aspectRatio`, `size`, `resolution`, 4-15 सेकंड की अवधियाँ और
    ऑडियो टॉगल स्वीकार करते हैं।

  </Accordion>

  <Accordion title="Seedance 2.0 कॉन्फ़िग उदाहरण">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Seedance 2.0 संदर्भ-से-वीडियो कॉन्फ़िग उदाहरण">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    संदर्भ-से-वीडियो, साझा `video_generate` `images`, `videos`, और `audioRefs`
    पैरामीटर के माध्यम से अधिकतम 9 छवियाँ, 3 वीडियो और 3 ऑडियो संदर्भ स्वीकार करता है,
    जिसमें कुल अधिकतम 12 संदर्भ फ़ाइलें हो सकती हैं। ऑडियो संदर्भों के लिए
    उसी अनुरोध में कम-से-कम एक छवि या वीडियो संदर्भ होना आवश्यक है।

  </Accordion>

  <Accordion title="HeyGen video-agent कॉन्फ़िग उदाहरण">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## संगीत जनरेशन

बंडल किया गया `fal` Plugin, साझा `music_generate` टूल के लिए एक संगीत-जनरेशन प्रोवाइडर भी पंजीकृत करता है।

| क्षमता    | मान                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| डिफ़ॉल्ट मॉडल | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| मॉडल        | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| अधिकतम अवधि  | 240 सेकंड                                                                                                              |
| रनटाइम       | सिंक्रोनस अनुरोध और जनरेट किए गए ऑडियो का डाउनलोड                                                                        |

fal को डिफ़ॉल्ट संगीत प्रोवाइडर के रूप में उपयोग करें:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` स्पष्ट गीत और वाद्य मोड का समर्थन करता है,
लेकिन एक ही अनुरोध में दोनों का नहीं। ACE-Step और Stable Audio
प्रॉम्प्ट-से-ऑडियो एंडपॉइंट हैं; जब उन मॉडल परिवारों का उपयोग करना हो, तो उन्हें `model` ओवरराइड से चुनें।
ACE-Step स्पष्ट गीत अस्वीकार करता है; Stable Audio गीत और वाद्य मोड,
दोनों को अस्वीकार करता है।

<Tip>
ऊपर दी गई तालिकाएँ और अकॉर्डियन उन मॉडल परिवारों को कवर करते हैं जिन्हें बंडल किया गया fal
प्रोवाइडर विशेष रूप से संभालता है। अन्य fal छवि एंडपॉइंट आईडी को अब भी
छवि मॉडल के रूप में चुना जा सकता है; उन्हें Flux की तरह माना जाता है (सामान्य `image_size` पेलोड,
`/image-to-image` के माध्यम से एक संदर्भ छवि)।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="छवि जनरेशन" href="/hi/tools/image-generation" icon="image">
    साझा छवि टूल पैरामीटर और प्रोवाइडर चयन।
  </Card>
  <Card title="वीडियो जनरेशन" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रोवाइडर चयन।
  </Card>
  <Card title="संगीत जनरेशन" href="/hi/tools/music-generation" icon="music">
    साझा संगीत टूल पैरामीटर और प्रोवाइडर चयन।
  </Card>
  <Card title="कॉन्फ़िगरेशन संदर्भ" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    छवि, वीडियो और संगीत मॉडल चयन सहित एजेंट डिफ़ॉल्ट।
  </Card>
</CardGroup>
