---
read_when:
    - आप messaging channel plugin का receive path बना या refactor कर रहे हैं
    - आपको साझा इनबाउंड संदर्भ निर्माण, सत्र रिकॉर्डिंग, या तैयार उत्तर प्रेषण की आवश्यकता है
    - आप पुराने चैनल टर्न हेल्पर्स को इनबाउंड/मैसेज APIs में माइग्रेट कर रहे हैं
summary: 'चैनल Plugin के लिए इनबाउंड इवेंट हेल्पर: संदर्भ निर्माण, साझा रनर ऑर्केस्ट्रेशन, सेशन रिकॉर्ड, और तैयार जवाब डिस्पैच'
title: चैनल इनबाउंड API
x-i18n:
    generated_at: "2026-06-28T23:51:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Channel Plugin को प्राप्ति पथों को आगत और संदेश संज्ञाओं के साथ मॉडल करना चाहिए:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

आगत इवेंट सामान्यीकरण, स्वरूपण, रूट्स और ऑर्केस्ट्रेशन के लिए `openclaw/plugin-sdk/channel-inbound` का उपयोग करें।
नेटिव भेजने, रसीद, टिकाऊ डिलीवरी और लाइव पूर्वावलोकन व्यवहार के लिए
`openclaw/plugin-sdk/channel-outbound` का उपयोग करें।

## मुख्य सहायक

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: सामान्यीकृत चैनल तथ्यों को
  प्रॉम्प्ट/सेशन संदर्भ में प्रोजेक्ट करें। चैनल-स्वामित्व वाले
  प्रेषक/चैट मेटाडेटा को Plugin हुक `ctx.channelContext` तक पास करने के लिए
  `channelContext` का उपयोग करें; चैनल-विशिष्ट फ़ील्ड के लिए इस सबपाथ से
  `PluginHookChannelSenderContext` या `PluginHookChannelChatContext` को बढ़ाएँ।
- `runChannelInboundEvent(...)`: एक आगत प्लेटफ़ॉर्म इवेंट के लिए इंजेस्ट,
  वर्गीकरण, प्रीफ़्लाइट, रिज़ॉल्व, रिकॉर्ड, डिस्पैच और फ़ाइनलाइज़ चलाएँ।
- `dispatchChannelInboundReply(...)`: डिलीवरी एडैप्टर के साथ पहले से असेंबल किए गए
  आगत उत्तर को रिकॉर्ड और डिस्पैच करें।

इंजेक्ट किया गया Plugin रनटाइम उन बंडल्ड/नेटिव चैनलों के लिए
`runtime.channel.inbound.*` के अंतर्गत वही उच्च-स्तरीय सहायक उजागर करता है
जिन्हें पहले से रनटाइम ऑब्जेक्ट मिलता है।

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

संगतता डिस्पैचर को `dispatchChannelInboundReply(...)` इनपुट असेंबल करने चाहिए
और प्लेटफ़ॉर्म डिलीवरी को डिलीवरी एडैप्टर में रखना चाहिए। नए भेजने वाले पथों को
संदेश एडैप्टर और टिकाऊ संदेश सहायकों को प्राथमिकता देनी चाहिए।

## माइग्रेशन

पुराने `runtime.channel.turn.*` रनटाइम एलियस हटा दिए गए थे। उपयोग करें:

- कच्चे आगत इवेंट के लिए `runtime.channel.inbound.run(...)`।
- असेंबल किए गए उत्तर संदर्भों के लिए `runtime.channel.inbound.dispatchReply(...)`।
- आगत संदर्भ पेलोड के लिए `runtime.channel.inbound.buildContext(...)`।
- `runtime.channel.inbound.runPreparedReply(...)` केवल चैनल-स्वामित्व वाले तैयार
  डिस्पैच पथों के लिए जो पहले से अपना डिस्पैच क्लोज़र असेंबल करते हैं।

नए Plugin कोड को `turn`-नाम वाले चैनल API नहीं जोड़ने चाहिए। मॉडल या
एजेंट turn शब्दावली को एजेंट/प्रोवाइडर कोड के अंदर रखें; चैनल Plugin आगत,
संदेश, डिलीवरी और उत्तर शब्दों का उपयोग करते हैं।
