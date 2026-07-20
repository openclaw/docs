---
read_when:
    - आप किसी मैसेजिंग चैनल Plugin के प्राप्ति पथ का निर्माण या पुनर्संरचना कर रहे हैं
    - आपको साझा इनबाउंड संदर्भ निर्माण, सत्र रिकॉर्डिंग या तैयार उत्तर प्रेषण की आवश्यकता है
    - आप पुराने चैनल टर्न हेल्पर्स को इनबाउंड/मैसेज API में माइग्रेट कर रहे हैं
summary: 'चैनल plugins के लिए इनबाउंड इवेंट सहायक: कॉन्टेक्स्ट निर्माण, साझा रनर ऑर्केस्ट्रेशन, सेशन रिकॉर्ड और तैयार उत्तर प्रेषण'
title: चैनल इनबाउंड API
x-i18n:
    generated_at: "2026-07-20T07:32:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f702019b0ee35055edd6fdbccc190eee66f35419d918c50076a005072d3f8ec
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

चैनल प्राप्ति पथ एक ही प्रवाह का पालन करते हैं:

```text
प्लेटफ़ॉर्म इवेंट -> इनबाउंड तथ्य/संदर्भ -> एजेंट उत्तर -> संदेश डिलीवरी
```

इनबाउंड इवेंट सामान्यीकरण, फ़ॉर्मैटिंग, रूट्स और ऑर्केस्ट्रेशन के लिए `openclaw/plugin-sdk/channel-inbound` का उपयोग करें।
नेटिव प्रेषण, प्राप्ति, टिकाऊ डिलीवरी और लाइव प्रीव्यू व्यवहार के लिए
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
  प्रॉम्प्ट/सेशन संदर्भ में प्रक्षेपित करता है। चैनल-स्वामित्व वाला प्रेषक/चैट मेटाडेटा
  `channelContext` के माध्यम से पास करें, जिसे Plugin हुक `ctx.channelContext` के रूप में देखते हैं।
  चैनल-विशिष्ट फ़ील्ड के लिए इस उपपथ से `PluginHookChannelSenderContext` या
  `PluginHookChannelChatContext` को विस्तारित करें।
- `runChannelInboundEvent(...)`: एक इनबाउंड प्लेटफ़ॉर्म इवेंट के लिए इनजेस्ट, वर्गीकरण, प्रीफ़्लाइट, समाधान,
  रिकॉर्डिंग, डिस्पैच और अंतिम रूप देने की प्रक्रिया चलाता है।
- `dispatchChannelInboundReply(...)`: डिलीवरी अडैप्टर के साथ पहले से
  संयोजित इनबाउंड उत्तर को रिकॉर्ड और डिस्पैच करता है।

केवल-मीडिया इनबाउंड इवेंट के लिए, संदेश का मुख्य भाग और कमांड टेक्स्ट खाली रखें और
प्रत्येक नेटिव अटैचमेंट के लिए एक `ChannelInboundMediaInput` तथ्य पास करें। जब किसी परिवेशी
इतिहास पंक्ति या किसी अन्य केवल-टेक्स्ट वाहक में उन तथ्यों का वर्णन करना आवश्यक हो, तो
`formatMediaPlaceholderText(media)` का उपयोग करें। यह प्रत्येक तथ्य को `kind`, MIME
प्रकार, फिर पथ या URL एक्सटेंशन के आधार पर वर्गीकृत करता है; डाउनलोड न किए गए नेटिव अटैचमेंट को भी
प्रत्येक के लिए एक केवल-प्रकार तथ्य देना चाहिए। प्राथमिक इनबाउंड मुख्य भाग को संश्लेषित करने के लिए
फ़ॉर्मैटर का उपयोग न करें।

वे बंडल किए गए/नेटिव चैनल, जिन्हें पहले से इंजेक्ट किया गया Plugin रनटाइम
ऑब्जेक्ट मिलता है, इस उपपथ को सीधे इम्पोर्ट करने के बजाय
`runtime.channel.inbound.*` के अंतर्गत उन्हीं सहायकों को कॉल कर सकते हैं:

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

उन संगतता डिस्पैचरों के लिए `dispatchChannelInboundReply(...)` इनपुट संयोजित करें,
जो प्लेटफ़ॉर्म डिलीवरी को डिलीवरी अडैप्टर में रखते हैं। नए प्रेषण
पथों को इसके बजाय `channel-outbound` के संदेश अडैप्टर और टिकाऊ संदेश सहायकों का उपयोग करना चाहिए।

## माइग्रेशन

`runtime.channel.turn.*` रनटाइम उपनाम हटा दिए गए हैं। इनका उपयोग करें:

- `runtime.channel.inbound.run(...)` अपरिष्कृत इनबाउंड इवेंट के लिए।
- `runtime.channel.inbound.dispatchReply(...)` संयोजित उत्तर संदर्भों के लिए।
- `runtime.channel.inbound.buildContext(...)` इनबाउंड संदर्भ पेलोड के लिए।
- `runtime.channel.inbound.runPreparedReply(...)`, अप्रचलित, केवल
  चैनल-स्वामित्व वाले तैयार डिस्पैच पथों के लिए, जो पहले से अपना
  डिस्पैच क्लोज़र संयोजित करते हैं।

नए Plugin कोड में `turn`-नाम वाले चैनल API प्रस्तुत नहीं किए जाने चाहिए। मॉडल या
एजेंट टर्न शब्दावली को एजेंट/प्रदाता कोड के भीतर रखें; चैनल Plugin इनबाउंड,
संदेश, डिलीवरी और उत्तर शब्दों का उपयोग करते हैं।
