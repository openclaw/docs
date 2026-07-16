---
read_when:
    - वॉइस ओवरले के व्यवहार को समायोजित करना
summary: वेक-वर्ड और पुश-टू-टॉक के ओवरलैप होने पर वॉइस ओवरले का जीवनचक्र
title: वॉइस ओवरले
x-i18n:
    generated_at: "2026-07-16T15:55:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eef571c3e8d41a97779537b1b373fab25b08f63575b50e5019f6c5fbcb782c52
    source_path: platforms/mac/voice-overlay.md
    workflow: 16
---

# वॉइस ओवरले जीवनचक्र (macOS)

पाठक: macOS ऐप के योगदानकर्ता। लक्ष्य: वेक-वर्ड और पुश-टू-टॉक के ओवरलैप होने पर वॉइस ओवरले का व्यवहार पूर्वानुमेय बनाए रखना।

## व्यवहार

- यदि ओवरले वेक-वर्ड के कारण पहले से दिखाई दे रहा है और उपयोगकर्ता हॉटकी दबाता है, तो हॉटकी सत्र मौजूदा टेक्स्ट को रीसेट करने के बजाय अपना लेता है। हॉटकी दबाए रखने तक ओवरले दिखाई देता रहता है। छोड़ने पर: यदि ट्रिम किया हुआ टेक्स्ट मौजूद है, तो भेजें; अन्यथा खारिज करें।
- केवल वेक-वर्ड अब भी मौन होने पर स्वतः भेजता है; पुश-टू-टॉक छोड़ते ही तुरंत भेजता है।

## कार्यान्वयन

- `VoiceSessionCoordinator` (`apps/macos/Sources/OpenClaw/VoiceSessionCoordinator.swift`) सक्रिय वॉइस सत्र का एकमात्र स्वामी है। यह एक `@MainActor @Observable` सिंगलटन है, ऐक्टर नहीं। API: `startSession`, `updatePartial`, `finalize`, `sendNow`, `dismiss`, `updateLevel`, `snapshot`। प्रत्येक सत्र में एक `UUID` टोकन होता है; पुराने या बेमेल टोकन वाली कॉल हटा दी जाती हैं।
- `VoiceWakeOverlayController` (`VoiceWakeOverlayController+Session.swift`) ओवरले को रेंडर करता है और उपयोगकर्ता क्रियाओं (`requestSend`, `dismiss`) को सत्र टोकन के माध्यम से समन्वयक को वापस भेजता है। यह कभी भी स्वयं सत्र की स्थिति का स्वामी नहीं होता।
- पुश-टू-टॉक (`VoicePushToTalk.begin()`) किसी भी दिखाई दे रहे ओवरले टेक्स्ट को `adoptedPrefix` के रूप में अपना लेता है (`VoiceSessionCoordinator.shared.snapshot()` के माध्यम से), ताकि वेक ओवरले दिखाई देते समय हॉटकी दबाने पर टेक्स्ट बना रहे और उसमें नया भाषण जुड़ जाए। छोड़ने पर, यह मौजूदा टेक्स्ट का उपयोग करने से पहले अंतिम ट्रांसक्रिप्ट के लिए अधिकतम 1.5s प्रतीक्षा करता है।
- `dismiss` पर, ओवरले `VoiceSessionCoordinator.overlayDidDismiss` को कॉल करता है, जो `VoiceWakeRuntime.refresh(state:)` को ट्रिगर करता है, ताकि X से मैन्युअल रूप से खारिज करने, खाली टेक्स्ट के कारण खारिज करने और भेजने के बाद खारिज करने—तीनों स्थितियों में वेक-वर्ड सुनना फिर से शुरू हो जाए।
- एकीकृत प्रेषण पथ: यदि ट्रिम किया हुआ टेक्स्ट खाली है, तो खारिज करें; अन्यथा `sendNow` प्रेषण की घंटी एक बार बजाता है, `VoiceWakeForwarder` के माध्यम से अग्रेषित करता है और फिर खारिज कर देता है।

## लॉगिंग

वॉइस उपतंत्र `ai.openclaw` है; प्रत्येक घटक अपनी श्रेणी के अंतर्गत लॉग करता है:

| श्रेणी                | घटक                                       |
| ----------------------- | ----------------------------------------------- |
| `voicewake.coordinator` | `VoiceSessionCoordinator`                       |
| `voicewake.overlay`     | `VoiceWakeOverlayController`/`VoiceWakeOverlay` |
| `voicewake.ptt`         | पुश-टू-टॉक हॉटकी और कैप्चर                 |
| `voicewake.runtime`     | वेक-वर्ड रनटाइम                               |
| `voicewake.chime`       | घंटी प्लेबैक                                  |
| `voicewake.sync`        | वैश्विक सेटिंग सिंक                            |
| `voicewake.forward`     | ट्रांसक्रिप्ट अग्रेषण                           |
| `voicewake.meter`       | माइक स्तर मॉनिटर                               |

## डीबगिंग चेकलिस्ट

- अटके हुए ओवरले को पुनरुत्पादित करते समय लॉग स्ट्रीम करें:

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- सत्यापित करें कि केवल एक सक्रिय सत्र टोकन है; पुराने कॉलबैक समन्वयक द्वारा हटा दिए जाते हैं।
- पुष्टि करें कि पुश-टू-टॉक छोड़ने पर सक्रिय टोकन के साथ हमेशा `end()` कॉल होता है; यदि टेक्स्ट खाली है, तो घंटी बजाए या भेजे बिना खारिज होने की अपेक्षा करें।

## संबंधित

- [macOS ऐप](/hi/platforms/macos)
- [वॉइस वेक (macOS)](/hi/platforms/mac/voicewake)
- [टॉक मोड](/hi/nodes/talk)
