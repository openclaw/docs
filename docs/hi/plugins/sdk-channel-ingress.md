---
read_when:
    - मैसेजिंग चैनल Plugin बनाना या माइग्रेट करना
    - DM या समूह allowlists, route gates, command auth, event auth, या mention activation बदलना
    - चैनल इनग्रेस रिडैक्शन या SDK संगतता सीमाओं की समीक्षा करना
sidebarTitle: Channel Ingress
summary: इनबाउंड संदेश प्राधिकरण के लिए प्रायोगिक चैनल ingress API
title: चैनल इनग्रेस API
x-i18n:
    generated_at: "2026-06-28T23:51:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# चैनल इनग्रेस API

चैनल इनग्रेस इनबाउंड चैनल इवेंट्स के लिए प्रयोगात्मक एक्सेस-कंट्रोल सीमा है। रिसीव पाथ के लिए `openclaw/plugin-sdk/channel-ingress-runtime` का उपयोग करें। पुराना `openclaw/plugin-sdk/channel-ingress` सबपाथ तृतीय-पक्ष Plugin के लिए डिप्रिकेटेड संगतता फसाड के रूप में एक्सपोर्टेड रहता है।

Plugin प्लेटफ़ॉर्म तथ्यों और साइड इफेक्ट्स के स्वामी होते हैं। मुख्य भाग सामान्य नीति का स्वामी होता है: DM/समूह अनुमति-सूचियाँ, पेयरिंग-स्टोर DM प्रविष्टियाँ, रूट गेट्स, कमांड गेट्स, इवेंट प्रमाणीकरण, मेंशन सक्रियण, रिडैक्टेड निदान, और प्रवेश।

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

प्रभावी अनुमति-सूचियाँ, कमांड स्वामी, या कमांड समूह पहले से गणना न करें। रिज़ॉल्वर इन्हें कच्ची अनुमति-सूचियों, स्टोर कॉलबैक, रूट डिस्क्रिप्टर, एक्सेस समूहों, नीति, और वार्तालाप प्रकार से निकालता है।

## परिणाम

बंडल किए गए Plugin को आधुनिक प्रोजेक्शन सीधे उपयोग करने चाहिए:

- `ingress`: क्रमबद्ध गेट निर्णय और प्रवेश
- `senderAccess`: केवल प्रेषक/वार्तालाप प्राधिकरण
- `routeAccess`: रूट और रूट-प्रेषक प्रोजेक्शन
- `commandAccess`: कमांड प्राधिकरण; जब कोई कमांड गेट नहीं चला हो तो false
- `activationAccess`: मेंशन/सक्रियण परिणाम

इवेंट प्राधिकरण क्रमबद्ध `ingress.graph` और निर्णायक `ingress.reasonCode` पर उपलब्ध रहता है; कोई अलग इवेंट प्रोजेक्शन उत्सर्जित नहीं किया जाता।

डिप्रिकेटेड तृतीय-पक्ष SDK हेल्पर पुराने आकारों को आंतरिक रूप से फिर से बना सकते हैं। नए बंडल किए गए रिसीव पाथ को आधुनिक परिणामों को वापस स्थानीय DTO में अनुवादित नहीं करना चाहिए।

## एक्सेस समूह

`accessGroup:<name>` प्रविष्टियाँ रिडैक्टेड रहती हैं। मुख्य भाग स्थिर `message.senders` समूहों को स्वयं रिज़ॉल्व करता है और `resolveAccessGroupMembership` को केवल उन डायनेमिक समूहों के लिए कॉल करता है जिन्हें प्लेटफ़ॉर्म लुकअप चाहिए। अनुपस्थित, असमर्थित, और विफल समूह बंद स्थिति में विफल होते हैं।

## इवेंट मोड

| `authMode`       | अर्थ                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | सामान्य इनबाउंड प्रेषक गेट्स                    |
| `command`        | कॉलबैक या स्कोप्ड बटन के लिए कमांड गेट्स        |
| `origin-subject` | अभिनेता को मूल संदेश विषय से मेल खाना चाहिए    |
| `route-only`     | रूट-स्कोप्ड विश्वसनीय इवेंट्स के लिए केवल रूट गेट्स |
| `none`           | Plugin-स्वामित्व वाले आंतरिक इवेंट साझा auth को बायपास करते हैं |

प्रतिक्रियाओं, बटनों, कॉलबैक, और नेटिव कमांड के लिए `mayPair: false` का उपयोग करें।

## रूट और सक्रियण

रूम, टॉपिक, गिल्ड, थ्रेड, या नेस्टेड रूट नीति के लिए रूट डिस्क्रिप्टर का उपयोग करें:

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

जब किसी Plugin में कई वैकल्पिक रूट डिस्क्रिप्टर हों, तो `channelIngressRoutes(...)` का उपयोग करें; यह अक्षम शाखाओं को फ़िल्टर करता है, जबकि रूट तथ्यों को सामान्य और प्रत्येक डिस्क्रिप्टर की `precedence` के अनुसार क्रमबद्ध रखता है।

मेंशन गेटिंग एक सक्रियण गेट है। मेंशन चूक होने पर `admission: "skip"` लौटता है ताकि टर्न कर्नेल केवल-निरीक्षण टर्न को प्रोसेस न करे। अधिकांश चैनलों को सक्रियण को प्रेषक और कमांड गेट्स के बाद छोड़ना चाहिए। ऐसे सार्वजनिक चैट सतह, जिन्हें प्रेषक अनुमति-सूची शोर से पहले बिना-मेंशन ट्रैफ़िक को शांत करना हो, टेक्स्ट-कमांड बायपास अक्षम होने पर `activation.order: "before-sender"` अपना सकते हैं। निहित सक्रियण वाले चैनल, जैसे बॉट थ्रेड्स में उत्तर, `activation.allowedImplicitMentionKinds` पास कर सकते हैं; प्रोजेक्टेड `activationAccess.shouldBypassMention` तब रिपोर्ट करता है कि कमांड या निहित सक्रियण ने स्पष्ट मेंशन को कब बायपास किया।

## रिडैक्शन

कच्चे प्रेषक मान और कच्ची अनुमति-सूची प्रविष्टियाँ केवल रिज़ॉल्वर इनपुट हैं। वे रिज़ॉल्व की गई स्थिति, निर्णयों, निदान, स्नैपशॉट, या संगतता तथ्यों में दिखाई नहीं देने चाहिए। अपारदर्शी विषय आईडी, प्रविष्टि आईडी, रूट आईडी, और निदान आईडी का उपयोग करें।

## सत्यापन

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
