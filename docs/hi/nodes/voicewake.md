---
read_when:
    - वॉइस वेक वर्ड के व्यवहार या डिफ़ॉल्ट को बदलना
    - वेक वर्ड सिंक की आवश्यकता वाले नए Node प्लेटफ़ॉर्म जोड़ना
summary: वैश्विक वॉइस वेक शब्द (Gateway के स्वामित्व वाले) और वे नोड्स के बीच कैसे सिंक होते हैं
title: वॉइस वेक
x-i18n:
    generated_at: "2026-07-19T09:34:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

वेक वर्ड्स **Gateway के स्वामित्व वाली एक वैश्विक सूची** हैं — प्रत्येक Node के लिए अलग कस्टम सूचियाँ नहीं हैं। कोई भी Node या ऐप UI सूची को संपादित कर सकता है; Gateway परिवर्तन को सहेजता है और प्रत्येक कनेक्टेड क्लाइंट को प्रसारित करता है।

- **macOS**: स्थानीय Voice Wake सक्षम/अक्षम टॉगल। macOS 26+ आवश्यक है; रनटाइम/PTT विवरण के लिए [वॉइस वेक (macOS)](/hi/platforms/mac/voicewake) देखें।
- **iOS**: Settings में स्थानीय Voice Wake सक्षम/अक्षम टॉगल।
- **Android**: Settings → Voice में स्थानीय Voice Wake सक्षम/अक्षम टॉगल और वेक-वर्ड संपादक। Android की ऑन-डिवाइस वाक् पहचान आवश्यक है।

## संग्रहण

वेक वर्ड्स और रूटिंग नियम Gateway की स्टेट डेटाबेस में रहते हैं, डिफ़ॉल्ट रूप से `~/.openclaw/state/openclaw.sqlite` (इसे `OPENCLAW_STATE_DIR` से ओवरराइड करें), तालिकाएँ `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`। पुराने `settings/voicewake.json` और `settings/voicewake-routing.json` केवल `openclaw doctor --fix` माइग्रेशन इनपुट हैं — रनटाइम उन्हें कभी नहीं पढ़ता।

## प्रोटोकॉल

### ट्रिगर सूची

| विधि          | पैरामीटर                   | परिणाम                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | कोई नहीं                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` इनपुट को सामान्यीकृत करता है: रिक्त स्थान ट्रिम करता है, खाली प्रविष्टियाँ हटाता है, अधिकतम 32 ट्रिगर रखता है और सरोगेट युग्मों को विभाजित किए बिना प्रत्येक को 64 UTF-16 कोड इकाइयों तक छोटा करता है। खाली परिणाम होने पर अंतर्निहित डिफ़ॉल्ट (`openclaw`, `claude`, `computer`) उपयोग किए जाते हैं।

### रूटिंग (ट्रिगर से लक्ष्य तक)

| विधि                  | पैरामीटर                               | परिणाम                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | कोई नहीं                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

प्रत्येक रूट `target` निम्न में से ठीक एक का समर्थन करता है:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

सीमाएँ: अधिकतम 32 रूट, ट्रिगर टेक्स्ट अधिकतम 64 वर्ण। मिलान और डुप्लिकेट पहचान के लिए रूट ट्रिगर को लोअरकेस करके, प्रत्येक शब्द से आरंभिक/अंतिम विराम-चिह्न हटाकर और रिक्त स्थानों को समेटकर सामान्यीकृत किया जाता है (`"Hey, Bot!!"` और `"hey bot"` मेल खाते हैं और डुप्लिकेट माने जाते हैं) — यह ऊपर दी गई वैश्विक ट्रिगर सूची के लिए उपयोग किए गए सामान्य ट्रिम से अधिक सख्त सामान्यीकरण है।

### इवेंट

| इवेंट                       | पेलोड                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

दोनों को रीड स्कोप वाले प्रत्येक WebSocket क्लाइंट (macOS ऐप, WebChat और इसी तरह के क्लाइंट) तथा प्रत्येक कनेक्टेड Node को प्रसारित किया जाता है। कनेक्ट होने के तुरंत बाद Node को आरंभिक स्नैपशॉट पुश के रूप में भी दोनों मिलते हैं।

## क्लाइंट व्यवहार

- **macOS**: `voicewake.set`/`voicewake.get` को कॉल करता है और अन्य क्लाइंट के साथ सिंक बनाए रखने के लिए `voicewake.changed` को सुनता है।
- **iOS**: `voicewake.set`/`voicewake.get` को कॉल करता है और स्थानीय वेक-वर्ड पहचान को प्रतिक्रियाशील बनाए रखने के लिए `voicewake.changed` को सुनता है।
- **Android**: `voicewake.set`/`voicewake.get` को कॉल करता है, `voicewake.changed` को सुनता है और सक्षम रहने पर `voiceWake` को विज्ञापित करता है। पहचान ऑन-डिवाइस और केवल फ़ोरग्राउंड में रहती है; जब Talk, मैन्युअल डिक्टेशन, वॉइस-नोट कैप्चर या संदेश वाक् ऑडियो का नियंत्रण लेता है, तब यह रुक जाती है।

## संबंधित

- [Talk मोड](/hi/nodes/talk)
- [ऑडियो और वॉइस नोट्स](/hi/nodes/audio)
- [मीडिया की समझ](/hi/nodes/media-understanding)
