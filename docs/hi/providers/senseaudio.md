---
read_when:
    - आप ऑडियो अटैचमेंट के लिए SenseAudio स्पीच-टू-टेक्स्ट चाहते हैं
    - आपको SenseAudio API कुंजी के एनवायरनमेंट वेरिएबल या ऑडियो कॉन्फ़िगरेशन पथ की आवश्यकता है
summary: इनकमिंग वॉइस नोट्स के लिए SenseAudio बैच स्पीच-टू-टेक्स्ट
title: SenseAudio
x-i18n:
    generated_at: "2026-07-16T17:02:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio, OpenClaw की साझा `tools.media.audio` पाइपलाइन के माध्यम से आने वाले ऑडियो और वॉइस-नोट अटैचमेंट का लिप्यंतरण करता है। OpenClaw मल्टीपार्ट ऑडियो को OpenAI-संगत लिप्यंतरण एंडपॉइंट पर पोस्ट करता है और लौटाए गए टेक्स्ट को `{{Transcript}}` तथा एक `[Audio]` ब्लॉक के रूप में सम्मिलित करता है।

| प्रॉपर्टी      | मान                                            |
| ------------- | ------------------------------------------------ |
| प्रोवाइडर आईडी   | `senseaudio`                                     |
| Plugin        | बंडल किया गया, `enabledByDefault: true`                |
| अनुबंध      | `mediaUnderstandingProviders` (ऑडियो)            |
| प्रमाणीकरण एनवायरनमेंट वेरिएबल  | `SENSEAUDIO_API_KEY`                             |
| डिफ़ॉल्ट मॉडल | `senseaudio-asr-pro-1.5-260319`                  |
| डिफ़ॉल्ट URL   | `https://api.senseaudio.cn/v1`                   |
| वेबसाइट       | [senseaudio.cn](https://senseaudio.cn)           |
| दस्तावेज़          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## आरंभ करना

<Steps>
  <Step title="अपनी API कुंजी सेट करें">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="ऑडियो प्रोवाइडर सक्षम करें">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="वॉइस नोट भेजें">
    किसी भी कनेक्ट किए गए चैनल के माध्यम से ऑडियो संदेश भेजें। OpenClaw
    ऑडियो को SenseAudio पर अपलोड करता है और उत्तर पाइपलाइन में लिप्यंतरण का उपयोग करता है।
  </Step>
</Steps>

## विकल्प

| विकल्प     | पथ                                  | विवरण                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR मॉडल आईडी             |
| `language` | `tools.media.audio.models[].language` | वैकल्पिक भाषा संकेत              |
| `prompt`   | `tools.media.audio.prompt`            | वैकल्पिक लिप्यंतरण प्रॉम्प्ट       |
| `baseUrl`  | `tools.media.audio.baseUrl` या मॉडल  | OpenAI-संगत बेस को ओवरराइड करें |
| `headers`  | `tools.media.audio.request.headers`   | अतिरिक्त अनुरोध हेडर               |

<Note>
OpenClaw में SenseAudio केवल बैच STT है। Voice Call का रीयलटाइम लिप्यंतरण
स्ट्रीमिंग STT समर्थन वाले प्रोवाइडर का उपयोग जारी रखता है।
</Note>

## संबंधित

- [मीडिया की समझ (ऑडियो)](/hi/nodes/audio)
- [मॉडल प्रोवाइडर](/hi/concepts/model-providers)
