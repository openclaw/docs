---
read_when:
    - आप OpenClaw में fal इमेज जनरेशन का उपयोग करना चाहते हैं
    - आपको FAL_KEY प्रमाणीकरण प्रवाह की आवश्यकता है
    - आप image_generate, video_generate, या music_generate के लिए fal डिफ़ॉल्ट चाहते हैं
summary: OpenClaw में fal इमेज, वीडियो, और संगीत जनरेशन सेटअप
title: Fal
x-i18n:
    generated_at: "2026-06-28T23:58:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw होस्टेड इमेज, वीडियो और संगीत जनरेशन के लिए एक बंडल किया हुआ `fal` प्रदाता शिप करता है।

| गुण | मान                                                         |
| -------- | ------------------------------------------------------------- |
| प्रदाता | `fal`                                                         |
| प्रमाणीकरण     | `FAL_KEY` (कैननिकल; `FAL_API_KEY` fallback के रूप में भी काम करता है) |
| API      | fal मॉडल एंडपॉइंट                                           |

## शुरू करना

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
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

## इमेज जनरेशन

बंडल किया हुआ `fal` इमेज-जनरेशन प्रदाता डिफ़ॉल्ट रूप से
`fal/fal-ai/flux/dev` का उपयोग करता है।

| क्षमता     | मान                                                              |
| -------------- | ------------------------------------------------------------------ |
| अधिकतम इमेज     | प्रति अनुरोध 4; Krea 2: प्रति अनुरोध 1                               |
| संपादन मोड      | Flux: 1 संदर्भ इमेज; GPT Image 2: 10; Nano Banana 2: 14        |
| स्टाइल संदर्भ     | Krea 2: `image` / `images` के माध्यम से अधिकतम 10 स्टाइल संदर्भ           |
| आकार ओवरराइड | समर्थित                                                          |
| आस्पेक्ट रेशियो   | generate, Krea 2, और GPT Image 2/Nano Banana 2 edit के लिए समर्थित |
| रिज़ॉल्यूशन     | समर्थित                                                          |
| आउटपुट फ़ॉर्मैट  | `png` या `jpeg`                                                    |

<Warning>
Flux इमेज-टू-इमेज अनुरोध `aspectRatio` ओवरराइड का समर्थन **नहीं** करते। GPT
Image 2 और Nano Banana 2 edit अनुरोध fal के `/edit` एंडपॉइंट का उपयोग करते हैं और
आस्पेक्ट-रेशियो संकेत स्वीकार करते हैं। Nano Banana 2 अतिरिक्त-नेटिव चौड़े/लंबे अनुपात भी स्वीकार करता है,
जैसे `4:1`, `1:4`, `8:1`, और `1:8`; Krea 2 अपने छोटे
आस्पेक्ट-रेशियो उपसमूह को मान्य करता है।
</Warning>

Krea 2 मॉडल fal के नेटिव Krea पेलोड स्कीमा का उपयोग करते हैं। OpenClaw
Flux द्वारा उपयोग किए जाने वाले जेनेरिक `image_size` / edit-endpoint पेलोड के बजाय
`aspect_ratio`, `creativity`, और `image_style_references` भेजता है। मॉडल संदर्भ हैं:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

तेज़ अभिव्यंजक इलस्ट्रेशन, ऐनिमे, पेंटिंग और कलात्मक
स्टाइल के लिए Medium का उपयोग करें। धीमे फोटोरियल, कच्चे टेक्सचर, फिल्म ग्रेन और विस्तृत
लुक के लिए Large का उपयोग करें। Krea का डिफ़ॉल्ट `fal.creativity: "medium"` है; समर्थित मान हैं
`raw`, `low`, `medium`, और `high`.

Krea 2 fal के अनुरोध स्कीमा में `image_size` नहीं, बल्कि आस्पेक्ट रेशियो उजागर करता है। `aspectRatio` को प्राथमिकता दें; OpenClaw `size` को निकटतम समर्थित Krea आस्पेक्ट रेशियो पर मैप करता है
और Krea के लिए `resolution` को चुपचाप छोड़ने के बजाय अस्वीकार करता है।

जब आप `output_format` उजागर करने वाले fal मॉडल से PNG आउटपुट चाहते हैं, तब `outputFormat: "png"` का उपयोग करें। fal OpenClaw में पारदर्शी-background
नियंत्रण स्पष्ट रूप से घोषित नहीं करता, इसलिए fal मॉडल के लिए `background: "transparent"` को अनदेखा किए गए
ओवरराइड के रूप में रिपोर्ट किया जाता है।
Krea 2 एंडपॉइंट fal के माध्यम से `output_format` अनुरोध फ़ील्ड उजागर नहीं करते, इसलिए
OpenClaw Krea अनुरोधों के लिए `outputFormat` ओवरराइड अस्वीकार करता है।

fal को डिफ़ॉल्ट इमेज प्रदाता के रूप में उपयोग करने के लिए:

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

बंडल किया हुआ `fal` वीडियो-जनरेशन प्रदाता डिफ़ॉल्ट रूप से
`fal/fal-ai/minimax/video-01-live` का उपयोग करता है।

| क्षमता | मान                                                              |
| ---------- | ------------------------------------------------------------------ |
| मोड      | टेक्स्ट-टू-वीडियो, सिंगल-इमेज संदर्भ, Seedance संदर्भ-टू-वीडियो |
| रनटाइम    | लंबे समय तक चलने वाले जॉब के लिए Queue-समर्थित submit/status/result फ़्लो       |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
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

  <Accordion title="Seedance 2.0 reference-to-video config example">
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

    Reference-to-video साझा `video_generate` `images`, `videos`, और `audioRefs`
    पैरामीटर के माध्यम से अधिकतम 9 इमेज, 3 वीडियो और 3 ऑडियो संदर्भ स्वीकार करता है,
    और कुल संदर्भ फ़ाइलें अधिकतम 12 हो सकती हैं।

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
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

बंडल किया हुआ `fal` Plugin साझा `music_generate` टूल के लिए एक संगीत-जनरेशन प्रदाता भी रजिस्टर करता है।

| क्षमता    | मान                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| डिफ़ॉल्ट मॉडल | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| मॉडल        | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| रनटाइम       | सिंक्रोनस अनुरोध और जनरेट किए गए ऑडियो का डाउनलोड                                                      |

fal को डिफ़ॉल्ट संगीत प्रदाता के रूप में उपयोग करें:

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

`fal-ai/minimax-music/v2.6` स्पष्ट गीत और इंस्ट्रुमेंटल मोड का समर्थन करता है।
ACE-Step और Stable Audio prompt-to-audio एंडपॉइंट हैं; जब आप उन
मॉडल परिवारों को चाहते हों, तो उन्हें `model` ओवरराइड के साथ चुनें।

<Tip>
हाल में जोड़ी गई प्रविष्टियों सहित उपलब्ध fal
मॉडल की पूरी सूची देखने के लिए `openclaw models list --provider fal` का उपयोग करें।
</Tip>

## संबंधित

<CardGroup cols={2}>
  <Card title="Image generation" href="/hi/tools/image-generation" icon="image">
    साझा इमेज टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="Video generation" href="/hi/tools/video-generation" icon="video">
    साझा वीडियो टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="Music generation" href="/hi/tools/music-generation" icon="music">
    साझा संगीत टूल पैरामीटर और प्रदाता चयन।
  </Card>
  <Card title="Configuration reference" href="/hi/gateway/config-agents#agent-defaults" icon="gear">
    इमेज, वीडियो और संगीत मॉडल चयन सहित एजेंट डिफ़ॉल्ट।
  </Card>
</CardGroup>
