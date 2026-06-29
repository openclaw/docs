---
read_when:
    - वॉइस वेक वर्ड्स के व्यवहार या डिफ़ॉल्ट बदलना
    - वेक वर्ड सिंक की आवश्यकता वाले नए नोड प्लेटफ़ॉर्म जोड़ना
summary: वैश्विक वॉइस वेक वर्ड्स (Gateway-स्वामित्व वाले) और वे नोड्स में कैसे सिंक होते हैं
title: आवाज़ से सक्रियण
x-i18n:
    generated_at: "2026-06-28T23:25:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw **वेक शब्दों को एक ही वैश्विक सूची** के रूप में मानता है, जिसका स्वामित्व **Gateway** के पास है।

- **प्रति-नोड कस्टम वेक शब्द नहीं हैं**।
- **कोई भी नोड/ऐप UI सूची संपादित कर सकता है**; बदलाव Gateway द्वारा स्थायी किए जाते हैं और सभी तक प्रसारित किए जाते हैं।
- macOS और iOS स्थानीय **वॉयस वेक सक्षम/अक्षम** टॉगल रखते हैं (स्थानीय UX + अनुमतियां अलग होती हैं)।
- Android फिलहाल वॉयस वेक बंद रखता है और वॉइस टैब में मैनुअल माइक फ्लो का उपयोग करता है।

## स्टोरेज (Gateway होस्ट)

वेक शब्द और रूटिंग नियम Gateway स्टेट डेटाबेस में संग्रहीत होते हैं:

- `~/.openclaw/state/openclaw.sqlite`

सक्रिय टेबल हैं:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

लेगेसी `settings/voicewake.json` और `settings/voicewake-routing.json` फाइलें
केवल doctor माइग्रेशन इनपुट हैं; रनटाइम SQLite टेबल पढ़ता और लिखता है।

## प्रोटोकॉल

### मेथड

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` पैरामीटर `{ triggers: string[] }` के साथ → `{ triggers: string[] }`

नोट्स:

- ट्रिगर सामान्यीकृत किए जाते हैं (trimmed, खाली हटाए गए)। खाली सूचियां डिफॉल्ट पर वापस जाती हैं।
- सुरक्षा के लिए सीमाएं लागू की जाती हैं (गिनती/लंबाई कैप)।

### रूटिंग मेथड (ट्रिगर → लक्ष्य)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` पैरामीटर `{ config: VoiceWakeRoutingConfig }` के साथ → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` आकार:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

रूट लक्ष्य इनमें से ठीक एक का समर्थन करते हैं:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### इवेंट

- `voicewake.changed` पेलोड `{ triggers: string[] }`
- `voicewake.routing.changed` पेलोड `{ config: VoiceWakeRoutingConfig }`

इसे कौन प्राप्त करता है:

- सभी WebSocket क्लाइंट (macOS ऐप, WebChat, आदि)
- सभी कनेक्टेड नोड (iOS/Android), और नोड कनेक्ट होने पर आरंभिक "वर्तमान स्थिति" पुश के रूप में भी।

## क्लाइंट व्यवहार

### macOS ऐप

- `VoiceWakeRuntime` ट्रिगर को गेट करने के लिए वैश्विक सूची का उपयोग करता है।
- वॉइस वेक सेटिंग्स में "ट्रिगर शब्द" संपादित करने पर `voicewake.set` कॉल होता है और फिर अन्य क्लाइंट को सिंक में रखने के लिए प्रसारण पर निर्भर करता है।

### iOS नोड

- `VoiceWakeManager` ट्रिगर डिटेक्शन के लिए वैश्विक सूची का उपयोग करता है।
- सेटिंग्स में वेक शब्द संपादित करने पर `voicewake.set` (Gateway WS पर) कॉल होता है और स्थानीय वेक-शब्द डिटेक्शन को भी रिस्पॉन्सिव रखता है।

### Android नोड

- वॉयस वेक फिलहाल Android रनटाइम/सेटिंग्स में अक्षम है।
- Android वॉइस वेक-शब्द ट्रिगर के बजाय वॉइस टैब में मैनुअल माइक कैप्चर का उपयोग करता है।

## संबंधित

- [टॉक मोड](/hi/nodes/talk)
- [ऑडियो और वॉइस नोट्स](/hi/nodes/audio)
- [मीडिया समझ](/hi/nodes/media-understanding)
