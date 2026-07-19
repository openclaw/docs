---
read_when:
    - मैसेजिंग चैनल Plugin बनाना या माइग्रेट करना
    - DM या समूह की अनुमति-सूचियाँ, रूट गेट, कमांड प्रमाणीकरण, इवेंट प्रमाणीकरण या उल्लेख सक्रियण बदलना
    - चैनल इनग्रेस रिडैक्शन या SDK संगतता सीमाओं की समीक्षा करना
sidebarTitle: Channel Ingress
summary: इनबाउंड संदेश प्राधिकरण के लिए प्रायोगिक चैनल इनग्रेस API
title: चैनल इनग्रेस API
x-i18n:
    generated_at: "2026-07-19T09:41:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 60feecb7bcf203cf37d2543a7855e89b5bfb2eb9d8263d804219e140facb8fc6
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

चैनल इनग्रेस, आने वाले चैनल इवेंट के लिए प्रयोगात्मक एक्सेस-कंट्रोल सीमा है। Plugins प्लेटफ़ॉर्म तथ्यों और साइड इफ़ेक्ट के स्वामी होते हैं; कोर सामान्य नीति का स्वामी होता है: DM/समूह अनुमत-सूचियाँ, पेयरिंग-स्टोर DM प्रविष्टियाँ, रूट गेट, कमांड गेट, इवेंट प्रमाणीकरण, उल्लेख सक्रियण, संपादित निदान और प्रवेश।

प्राप्ति पथों के लिए `openclaw/plugin-sdk/channel-ingress-runtime` का उपयोग करें।

## रनटाइम रिज़ॉल्वर

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

प्रभावी अनुमत-सूचियों, कमांड स्वामियों या कमांड समूहों की पूर्व-गणना न करें।
रिज़ॉल्वर उन्हें अपरिष्कृत अनुमत-सूचियों, स्टोर कॉलबैक, रूट
डिस्क्रिप्टर, एक्सेस समूहों, नीति और वार्तालाप के प्रकार से व्युत्पन्न करता है।

## परिणाम

बंडल किए गए Plugins को आधुनिक प्रोजेक्शन का सीधे उपयोग करना चाहिए:

| फ़ील्ड              | अर्थ                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | क्रमबद्ध गेट निर्णय और प्रवेश                                |
| `senderAccess`     | केवल प्रेषक/वार्तालाप प्राधिकरण                             |
| `routeAccess`      | रूट और रूट-प्रेषक प्रोजेक्शन                                  |
| `commandAccess`    | कमांड प्राधिकरण; जब कोई कमांड गेट नहीं चला हो तब `requested: false` |
| `activationAccess` | उल्लेख/सक्रियण परिणाम                                          |

इवेंट प्राधिकरण क्रमबद्ध `ingress.graph` और निर्णायक
`ingress.reasonCode` पर उपलब्ध रहता है; कोई अलग इवेंट प्रोजेक्शन उत्सर्जित नहीं होता।

अप्रचलित तृतीय-पक्ष SDK सहायक आंतरिक रूप से पुराने आकारों का पुनर्निर्माण कर सकते हैं। नए
बंडल किए गए प्राप्ति पथों को आधुनिक परिणामों का वापस स्थानीय
DTO में रूपांतरण नहीं करना चाहिए।

## एक्सेस समूह

`accessGroup:<name>` प्रविष्टियाँ संपादित रहती हैं। कोर स्थिर
`message.senders` समूहों को स्वयं रिज़ॉल्व करता है और `resolveAccessGroupMembership` को केवल
उन डायनेमिक समूहों के लिए कॉल करता है जिन्हें प्लेटफ़ॉर्म लुकअप की आवश्यकता होती है। अनुपलब्ध, असमर्थित और
विफल समूह फ़ेल-क्लोज़ होते हैं।

## इवेंट मोड

| `authMode`       | अर्थ                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | सामान्य इनबाउंड प्रेषक गेट                      |
| `command`        | कॉलबैक या दायरा-बद्ध बटनों के कमांड गेट    |
| `origin-subject` | कर्ता का मूल संदेश विषय से मेल खाना आवश्यक है    |
| `route-only`     | केवल रूट-दायरा-बद्ध विश्वसनीय इवेंट के लिए रूट गेट |
| `none`           | Plugin-स्वामित्व वाले आंतरिक इवेंट साझा प्रमाणीकरण को बायपास करते हैं  |

प्रतिक्रियाओं, बटनों, कॉलबैक और नेटिव कमांड के लिए `mayPair: false` का उपयोग करें।

## रूट और सक्रियण

कक्ष, विषय, गिल्ड, थ्रेड या नेस्टेड रूट नीति के लिए रूट डिस्क्रिप्टर का उपयोग करें:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

जब किसी Plugin में कई वैकल्पिक रूट
डिस्क्रिप्टर हों, तब `channelIngressRoutes(...)` का उपयोग करें; यह रूट तथ्यों को सामान्य रखते हुए अक्षम शाखाओं को फ़िल्टर करता है
और प्रत्येक डिस्क्रिप्टर के `precedence` के अनुसार उन्हें क्रमबद्ध रखता है।

उल्लेख गेटिंग एक सक्रियण गेट है। उल्लेख न मिलने पर
`admission: "skip"` लौटता है, ताकि टर्न कर्नेल केवल-अवलोकन टर्न को संसाधित न करे।
अधिकांश चैनलों को सक्रियण को प्रेषक और कमांड गेट के बाद रखना चाहिए। सार्वजनिक
चैट सतहें, जिन्हें प्रेषक अनुमत-सूची
के शोर से पहले उल्लेख-रहित ट्रैफ़िक को शांत करना आवश्यक है, टेक्स्ट-कमांड
बायपास अक्षम होने पर `activation.order: "before-sender"` को चुन सकती हैं। अप्रत्यक्ष सक्रियण वाले चैनल, जैसे बॉट
थ्रेड में उत्तर, `channels.defaults.implicitMentions` के साथ चैनल और अकाउंट
ओवरराइड को `resolveChannelImplicitMentions(...)` द्वारा रिज़ॉल्व करते हैं, फिर परिणाम को
`activation.implicitMentions` के रूप में पास करते हैं। प्रोजेक्ट किया गया
`activationAccess.shouldBypassMention` बताता है कि कमांड या अप्रत्यक्ष
सक्रियण ने स्पष्ट उल्लेख को कब बायपास किया।

## संपादन

अपरिष्कृत प्रेषक मान और अपरिष्कृत अनुमत-सूची प्रविष्टियाँ केवल रिज़ॉल्वर इनपुट हैं। वे
रिज़ॉल्व की गई स्थिति, निर्णयों, निदान, स्नैपशॉट या
संगतता तथ्यों में दिखाई नहीं देने चाहिए। अपारदर्शी विषय आईडी, प्रविष्टि आईडी, रूट आईडी और
निदान आईडी का उपयोग करें।

## सत्यापन

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
