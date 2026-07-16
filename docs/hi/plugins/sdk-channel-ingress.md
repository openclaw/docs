---
read_when:
    - मैसेजिंग चैनल Plugin बनाना या माइग्रेट करना
    - DM या समूह की अनुमतिसूचियों, रूट गेट्स, कमांड प्रमाणीकरण, इवेंट प्रमाणीकरण या मेंशन सक्रियण को बदलना
    - चैनल इनग्रेस रिडैक्शन या SDK संगतता सीमाओं की समीक्षा करना
sidebarTitle: Channel Ingress
summary: इनबाउंड संदेश प्राधिकरण के लिए प्रयोगात्मक चैनल इनग्रेस API
title: चैनल इनग्रेस API
x-i18n:
    generated_at: "2026-07-16T16:35:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

चैनल इनग्रेस इनबाउंड चैनल इवेंट के लिए प्रायोगिक एक्सेस-कंट्रोल सीमा है। प्लेटफ़ॉर्म संबंधी तथ्य और साइड इफ़ेक्ट Plugins के स्वामित्व में होते हैं; सामान्य नीति core के स्वामित्व में होती है: DM/ग्रुप अलाउलिस्ट, पेयरिंग-स्टोर DM प्रविष्टियाँ, रूट गेट, कमांड गेट, इवेंट प्रमाणीकरण, मेंशन सक्रियण, संशोधित डायग्नोस्टिक्स और प्रवेश।

रिसीव पाथ के लिए `openclaw/plugin-sdk/channel-ingress-runtime` का उपयोग करें।

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

प्रभावी अलाउलिस्ट, कमांड स्वामी या कमांड ग्रुप की पूर्व-गणना न करें। रिज़ॉल्वर उन्हें रॉ अलाउलिस्ट, स्टोर कॉलबैक, रूट डिस्क्रिप्टर, एक्सेस ग्रुप, नीति और वार्तालाप के प्रकार से प्राप्त करता है।

## परिणाम

बंडल किए गए Plugins को आधुनिक प्रोजेक्शन का सीधे उपयोग करना चाहिए:

| फ़ील्ड              | अर्थ                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | क्रमबद्ध गेट निर्णय और प्रवेश                                |
| `senderAccess`     | केवल प्रेषक/वार्तालाप प्राधिकरण                             |
| `routeAccess`      | रूट और रूट-प्रेषक प्रोजेक्शन                                  |
| `commandAccess`    | कमांड प्राधिकरण; जब कोई कमांड गेट नहीं चला हो, तब `requested: false` |
| `activationAccess` | मेंशन/सक्रियण परिणाम                                          |

इवेंट प्राधिकरण क्रमबद्ध `ingress.graph` और निर्णायक `ingress.reasonCode` पर उपलब्ध रहता है; कोई अलग इवेंट प्रोजेक्शन उत्सर्जित नहीं होता।

बहिष्कृत तृतीय-पक्ष SDK हेल्पर आंतरिक रूप से पुराने आकारों का पुनर्निर्माण कर सकते हैं। नए बंडल किए गए रिसीव पाथ को आधुनिक परिणामों को वापस स्थानीय DTO में रूपांतरित नहीं करना चाहिए।

## एक्सेस ग्रुप

`accessGroup:<name>` प्रविष्टियाँ संशोधित रहती हैं। core स्थिर `message.senders` ग्रुप को स्वयं रिज़ॉल्व करता है और केवल उन डायनेमिक ग्रुप के लिए `resolveAccessGroupMembership` को कॉल करता है जिन्हें प्लेटफ़ॉर्म लुकअप की आवश्यकता होती है। अनुपलब्ध, असमर्थित और विफल ग्रुप फ़ेल-क्लोज़ होते हैं।

## इवेंट मोड

| `authMode`       | अर्थ                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | सामान्य इनबाउंड प्रेषक गेट                      |
| `command`        | कॉलबैक या सीमित-स्कोप बटन के लिए कमांड गेट    |
| `origin-subject` | अभिनेता का मूल संदेश विषय से मेल खाना आवश्यक है    |
| `route-only`     | केवल रूट-स्कोप वाले विश्वसनीय इवेंट के लिए रूट गेट |
| `none`           | Plugin-स्वामित्व वाले आंतरिक इवेंट साझा प्रमाणीकरण को बायपास करते हैं  |

रिएक्शन, बटन, कॉलबैक और नेटिव कमांड के लिए `mayPair: false` का उपयोग करें।

## रूट और सक्रियण

रूम, टॉपिक, गिल्ड, थ्रेड या नेस्टेड रूट नीति के लिए रूट डिस्क्रिप्टर का उपयोग करें:

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

जब किसी Plugin में कई वैकल्पिक रूट डिस्क्रिप्टर हों, तब `channelIngressRoutes(...)` का उपयोग करें; यह रूट तथ्यों को सामान्य रखते हुए अक्षम शाखाओं को फ़िल्टर करता है और उन्हें प्रत्येक डिस्क्रिप्टर के `precedence` के अनुसार क्रमबद्ध रखता है।

मेंशन गेटिंग एक सक्रियण गेट है। मेंशन न मिलने पर `admission: "skip"` लौटाया जाता है, ताकि टर्न कर्नेल केवल-अवलोकन वाले टर्न को प्रोसेस न करे। अधिकांश चैनलों में सक्रियण को प्रेषक और कमांड गेट के बाद रखना चाहिए। सार्वजनिक चैट सतहें, जिन्हें प्रेषक अलाउलिस्ट के शोर से पहले बिना मेंशन वाले ट्रैफ़िक को शांत करना आवश्यक है, टेक्स्ट-कमांड बायपास अक्षम होने पर `activation.order: "before-sender"` चुन सकती हैं। अप्रत्यक्ष सक्रियण वाले चैनल, जैसे बॉट थ्रेड में उत्तर, `activation.allowedImplicitMentionKinds` पास कर सकते हैं; इसके बाद प्रोजेक्ट किया गया `activationAccess.shouldBypassMention` बताता है कि कमांड या अप्रत्यक्ष सक्रियण ने स्पष्ट मेंशन को कब बायपास किया।

## संशोधन

रॉ प्रेषक मान और रॉ अलाउलिस्ट प्रविष्टियाँ केवल रिज़ॉल्वर इनपुट हैं। वे रिज़ॉल्व की गई स्थिति, निर्णयों, डायग्नोस्टिक्स, स्नैपशॉट या संगतता तथ्यों में दिखाई नहीं देनी चाहिए। अपारदर्शी विषय आईडी, प्रविष्टि आईडी, रूट आईडी और डायग्नोस्टिक आईडी का उपयोग करें।

## सत्यापन

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
