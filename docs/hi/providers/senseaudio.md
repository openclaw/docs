---
read_when:
    - आप ऑडियो संलग्नकों के लिए SenseAudio का वाक्-से-पाठ चाहते हैं
    - आपको SenseAudio API कुंजी env var या ऑडियो config path की आवश्यकता है
summary: आने वाले वॉइस नोट्स के लिए SenseAudio बैच वाक्-से-पाठ
title: SenseAudio
x-i18n:
    generated_at: "2026-06-29T00:02:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio OpenClaw की साझा `tools.media.audio` पाइपलाइन के माध्यम से आने वाले ऑडियो और वॉइस-नोट अटैचमेंट को ट्रांसक्राइब कर सकता है। OpenClaw मल्टीपार्ट ऑडियो को OpenAI-संगत ट्रांसक्रिप्शन एंडपॉइंट पर पोस्ट करता है और लौटाए गए टेक्स्ट को `{{Transcript}}` के साथ एक `[Audio]` ब्लॉक के रूप में इंजेक्ट करता है।

| प्रॉपर्टी       | मान                                              |
| ------------- | ------------------------------------------------ |
| प्रोवाइडर आईडी | `senseaudio`                                     |
| Plugin        | बंडल किया गया, `enabledByDefault: true`          |
| कॉन्ट्रैक्ट    | `mediaUnderstandingProviders` (ऑडियो)            |
| Auth env var  | `SENSEAUDIO_API_KEY`                             |
| डिफॉल्ट मॉडल   | `senseaudio-asr-pro-1.5-260319`                  |
| डिफॉल्ट URL    | `https://api.senseaudio.cn/v1`                   |
| वेबसाइट        | [senseaudio.cn](https://senseaudio.cn)           |
| दस्तावेज़       | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## शुरू करना

<Steps>
  <Step title="Set your API key">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="Enable the audio provider">
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
  <Step title="Send a voice note">
    किसी भी कनेक्टेड चैनल के माध्यम से ऑडियो संदेश भेजें। OpenClaw ऑडियो को
    SenseAudio पर अपलोड करता है और जवाब पाइपलाइन में ट्रांसक्रिप्ट का उपयोग करता है।
  </Step>
</Steps>

## विकल्प

| विकल्प      | पाथ                                  | विवरण                                |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR मॉडल आईडी             |
| `language` | `tools.media.audio.models[].language` | वैकल्पिक भाषा संकेत                  |
| `prompt`   | `tools.media.audio.prompt`            | वैकल्पिक ट्रांसक्रिप्शन प्रॉम्प्ट     |
| `baseUrl`  | `tools.media.audio.baseUrl` या मॉडल   | OpenAI-संगत बेस को ओवरराइड करें     |
| `headers`  | `tools.media.audio.request.headers`   | अतिरिक्त रिक्वेस्ट हेडर              |

<Note>
OpenClaw में SenseAudio केवल बैच STT है। Voice Call रियलटाइम ट्रांसक्रिप्शन
स्ट्रीमिंग STT समर्थन वाले प्रोवाइडर का उपयोग जारी रखता है।
</Note>

## संबंधित

- [मीडिया अंडरस्टैंडिंग (ऑडियो)](/hi/nodes/audio)
- [मॉडल प्रोवाइडर](/hi/concepts/model-providers)
