---
read_when:
    - एक ही allowlist को कई संदेश चैनलों में कॉन्फ़िगर करना
    - DM और समूह प्रेषक एक्सेस नियम
    - संदेश-चैनल अभिगम नियंत्रण की समीक्षा करना
summary: 'संदेश चैनलों के लिए पुन: प्रयोज्य प्रेषक अनुमति-सूचियाँ'
title: पहुँच समूह
x-i18n:
    generated_at: "2026-06-28T22:33:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

एक्सेस समूह नामित प्रेषक सूचियाँ हैं जिन्हें आप एक बार परिभाषित करते हैं और चैनल अनुमत-सूचियों से `accessGroup:<name>` के साथ संदर्भित करते हैं।

इनका उपयोग तब करें जब वही लोग कई संदेश चैनलों में अनुमति प्राप्त होने चाहिए, या जब एक भरोसेमंद सेट डीएम और समूह प्रेषक प्राधिकरण दोनों पर लागू होना चाहिए।

एक्सेस समूह अपने आप एक्सेस नहीं देते। कोई समूह केवल तब मायने रखता है जब कोई अनुमत-सूची फ़ील्ड उसे संदर्भित करता है।

## स्थिर संदेश प्रेषक समूह

स्थिर प्रेषक समूह `type: "message.senders"` का उपयोग करते हैं।

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

सदस्य सूचियाँ संदेश-चैनल id के आधार पर कुंजीबद्ध होती हैं:

| कुंजी        | अर्थ                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | साझा प्रविष्टियाँ जिन्हें समूह संदर्भित करने वाले हर संदेश चैनल के लिए जाँचा जाता है। |
| `discord`  | केवल Discord अनुमत-सूची मिलान के लिए जाँची जाने वाली प्रविष्टियाँ।                    |
| `telegram` | केवल Telegram अनुमत-सूची मिलान के लिए जाँची जाने वाली प्रविष्टियाँ।                   |
| `whatsapp` | केवल WhatsApp अनुमत-सूची मिलान के लिए जाँची जाने वाली प्रविष्टियाँ।                   |

प्रविष्टियों का मिलान गंतव्य चैनल के सामान्य `allowFrom` नियमों से किया जाता है। OpenClaw चैनलों के बीच प्रेषक ids का अनुवाद नहीं करता। अगर Alice के पास Telegram id और Discord id है, तो दोनों ids को उपयुक्त कुंजियों के अंतर्गत सूचीबद्ध करें।

## अनुमत-सूचियों से समूहों का संदर्भ दें

जहाँ भी संदेश चैनल पथ प्रेषक अनुमत-सूचियों का समर्थन करता है, वहाँ `accessGroup:<name>` के साथ समूह का संदर्भ दें।

डीएम अनुमत-सूची उदाहरण:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

समूह प्रेषक अनुमत-सूची उदाहरण:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

आप समूहों और सीधे प्रविष्टियों को मिला सकते हैं:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## समर्थित संदेश-चैनल पथ

एक्सेस समूह साझा संदेश-चैनल प्राधिकरण पथों में उपलब्ध हैं, जिनमें शामिल हैं:

- डीएम प्रेषक अनुमत-सूचियाँ, जैसे `channels.<channel>.allowFrom`
- समूह प्रेषक अनुमत-सूचियाँ, जैसे `channels.<channel>.groupAllowFrom`
- चैनल-विशिष्ट प्रति-कक्ष प्रेषक अनुमत-सूचियाँ, जो वही प्रेषक मिलान नियम उपयोग करती हैं
- आदेश प्राधिकरण पथ, जो संदेश-चैनल प्रेषक अनुमत-सूचियों का पुनः उपयोग करते हैं

चैनल समर्थन इस बात पर निर्भर करता है कि वह चैनल साझा OpenClaw प्रेषक-प्राधिकरण हेल्परों के माध्यम से जुड़ा है या नहीं। मौजूदा बंडल समर्थन में Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo, और Zalo Personal शामिल हैं। स्थिर `message.senders` समूह चैनल-निरपेक्ष होने के लिए डिज़ाइन किए गए हैं, इसलिए नए संदेश चैनलों को कस्टम अनुमत-सूची विस्तार के बजाय साझा plugin SDK हेल्परों का उपयोग करके उनका समर्थन करना चाहिए।

## Plugin निदान

Plugin लेखक संरचित एक्सेस-समूह स्थिति को वापस एक सपाट अनुमत-सूची में विस्तारित किए बिना निरीक्षण कर सकते हैं:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

परिणाम संदर्भित, मिलान हुए, अनुपस्थित, असमर्थित, और विफल समूहों की रिपोर्ट करता है। इसका उपयोग तब करें जब आपको निदान या अनुरूपता परीक्षणों की आवश्यकता हो। `expandAllowFromWithAccessGroups(...)` का उपयोग केवल उन संगतता पथों के लिए करें जिन्हें अभी भी सपाट `allowFrom` array की अपेक्षा है।

## Discord चैनल दर्शक

Discord एक गतिशील एक्सेस समूह प्रकार का भी समर्थन करता है:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` का अर्थ है "उन Discord डीएम प्रेषकों को अनुमति दें जो वर्तमान में इस guild चैनल को देख सकते हैं।" OpenClaw प्राधिकरण समय पर Discord के माध्यम से प्रेषक को हल करता है और Discord `ViewChannel` अनुमति नियम लागू करता है।

इसका उपयोग तब करें जब कोई Discord चैनल पहले से ही किसी टीम के लिए सत्य का स्रोत हो, जैसे `#maintainers` या `#on-call`।

आवश्यकताएँ और विफलता व्यवहार:

- bot को guild और चैनल तक एक्सेस चाहिए।
- bot को Discord Developer Portal **Server Members Intent** चाहिए।
- जब Discord `Missing Access` लौटाता है, प्रेषक को guild सदस्य के रूप में हल नहीं किया जा सकता, या चैनल किसी अन्य guild से संबंधित होता है, तो एक्सेस समूह बंद होकर विफल होता है।

और Discord-विशिष्ट उदाहरण: [Discord एक्सेस नियंत्रण](/hi/channels/discord#access-control-and-routing)

## सुरक्षा नोट्स

- एक्सेस समूह अनुमत-सूची उपनाम हैं, भूमिकाएँ नहीं। वे अपने आप मालिक नहीं बनाते, पेयरिंग अनुरोधों को मंज़ूर नहीं करते, या tool अनुमतियाँ नहीं देते।
- `dmPolicy: "open"` के लिए प्रभावी डीएम अनुमत-सूची में अभी भी `"*"` आवश्यक है। किसी एक्सेस समूह का संदर्भ देना सार्वजनिक एक्सेस के समान नहीं है।
- अनुपस्थित समूह नाम बंद होकर विफल होते हैं। अगर `allowFrom` में `accessGroup:operators` है और `accessGroups.operators` अनुपस्थित है, तो वह प्रविष्टि किसी को भी अधिकृत नहीं करती।
- चैनल ids को स्थिर रखें। जब चैनल दोनों का समर्थन करता हो, तो प्रदर्शन नामों के बजाय संख्यात्मक/user ids को प्राथमिकता दें।

## समस्या निवारण

अगर किसी प्रेषक का मिलान होना चाहिए लेकिन वह अवरुद्ध है:

1. पुष्टि करें कि अनुमत-सूची फ़ील्ड में सटीक `accessGroup:<name>` संदर्भ है।
2. पुष्टि करें कि `accessGroups.<name>.type` सही है।
3. पुष्टि करें कि प्रेषक id मिलान वाले चैनल कुंजी के अंतर्गत, या `"*"` के अंतर्गत सूचीबद्ध है।
4. पुष्टि करें कि प्रविष्टि उस चैनल की सामान्य अनुमत-सूची सिंटैक्स का उपयोग करती है।
5. Discord चैनल दर्शकों के लिए, पुष्टि करें कि bot guild चैनल देख सकता है और Server Members Intent सक्षम है।

एक्सेस-नियंत्रण config संपादित करने के बाद `openclaw doctor` चलाएँ। यह runtime से पहले कई अमान्य अनुमत-सूची और नीति संयोजनों को पकड़ लेता है।
