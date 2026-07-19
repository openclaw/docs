---
read_when:
    - एकाधिक संदेश चैनलों में समान अनुमति-सूची कॉन्फ़िगर करना
    - DM और समूह प्रेषक पहुँच नियम साझा करना
    - मैसेज चैनल एक्सेस कंट्रोल की समीक्षा करना
summary: 'संदेश चैनलों के लिए पुन: प्रयोज्य प्रेषक अनुमति-सूचियाँ'
title: पहुँच समूह
x-i18n:
    generated_at: "2026-07-19T08:06:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

एक्सेस समूह नामित प्रेषक सूचियाँ हैं, जिन्हें आप `accessGroups` के अंतर्गत एक बार परिभाषित करते हैं और `accessGroup:<name>` के साथ चैनल की अनुमति-सूचियों से संदर्भित करते हैं।

इनका उपयोग तब करें, जब कई संदेश चैनलों पर समान लोगों को अनुमति देनी हो या जब एक ही विश्वसनीय समूह को DM और समूह प्रेषक प्राधिकरण—दोनों पर लागू करना हो।

समूह अपने आप कोई अनुमति नहीं देता। इसका महत्व केवल वहाँ होता है, जहाँ कोई अनुमति-सूची फ़ील्ड इसे संदर्भित करता है।

## स्थिर संदेश प्रेषक समूह

स्थिर प्रेषक समूह `type: "message.senders"` का उपयोग करते हैं। `members` को संदेश-चैनल आईडी के आधार पर कुंजीबद्ध किया जाता है, साथ ही प्रत्येक चैनल द्वारा साझा की जाने वाली प्रविष्टियों के लिए `"*"` होता है:

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

| कुंजी                        | अर्थ                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| `"*"`                      | समूह को संदर्भित करने वाले प्रत्येक संदेश चैनल के लिए जाँची जाने वाली साझा प्रविष्टियाँ। |
| `discord`, `telegram`, ... | केवल उस चैनल की अनुमति-सूची के मिलान के लिए जाँची जाने वाली प्रविष्टियाँ।                 |

प्रविष्टियों का मिलान गंतव्य चैनल के सामान्य `allowFrom` नियमों से किया जाता है। OpenClaw चैनलों के बीच प्रेषक आईडी को रूपांतरित नहीं करता: यदि Alice की एक Telegram आईडी और एक Discord आईडी है, तो दोनों आईडी को संबंधित चैनल कुंजियों के अंतर्गत सूचीबद्ध करें।

## अनुमति-सूचियों से समूहों को संदर्भित करना

संदेश चैनल पथ में जहाँ भी प्रेषक अनुमति-सूचियाँ समर्थित हों, वहाँ `accessGroup:<name>` के साथ किसी समूह को संदर्भित करें।

DM अनुमति-सूची का उदाहरण:

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

समूह प्रेषक अनुमति-सूची का उदाहरण:

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
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

आप समूहों और प्रत्यक्ष प्रविष्टियों को मिला सकते हैं:

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

एक्सेस समूह साझा संदेश-चैनल प्राधिकरण पथों में काम करते हैं:

- DM प्रेषक अनुमति-सूचियाँ, जैसे `channels.<channel>.allowFrom`
- समूह प्रेषक अनुमति-सूचियाँ, जैसे `channels.<channel>.groupAllowFrom`
- चैनल-विशिष्ट, प्रति-कक्ष प्रेषक अनुमति-सूचियाँ, जो समान प्रेषक मिलान नियमों का उपयोग करती हैं (उदाहरण के लिए Google Chat `groups.<space>.users`)
- कमांड प्राधिकरण पथ, जो संदेश-चैनल प्रेषक अनुमति-सूचियों का पुनः उपयोग करते हैं

चैनल समर्थन इस बात पर निर्भर करता है कि वह चैनल साझा OpenClaw प्रेषक-प्राधिकरण सहायकों के माध्यम से जुड़ा है या नहीं। वर्तमान बंडल समर्थन में ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo और Zalo Personal शामिल हैं। स्थिर `message.senders` समूह चैनल-निरपेक्ष होते हैं, इसलिए नए संदेश चैनल कस्टम अनुमति-सूची विस्तार के बजाय साझा Plugin SDK इनग्रेस सहायकों का उपयोग करके इन्हें प्राप्त करते हैं।

## Discord चैनल ऑडियंस

Discord एक डायनेमिक एक्सेस समूह प्रकार का भी समर्थन करता है:

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

`discord.channelAudience` का अर्थ है, "उन Discord DM प्रेषकों को अनुमति दें, जो वर्तमान में इस गिल्ड चैनल को देख सकते हैं।" OpenClaw प्राधिकरण के समय Discord के माध्यम से प्रेषक का समाधान करता है और Discord के `ViewChannel` अनुमति नियम लागू करता है। `membership` वैकल्पिक है और डिफ़ॉल्ट रूप से `canViewChannel` होता है।

इसका उपयोग तब करें, जब कोई Discord चैनल पहले से ही किसी टीम के लिए सत्य का स्रोत हो, जैसे `#maintainers` या `#on-call`।

आवश्यकताएँ और विफलता व्यवहार:

- बॉट को गिल्ड और चैनल तक पहुँच चाहिए।
- बॉट को Discord Developer Portal के **Server Members Intent** की आवश्यकता है।
- जब Discord `Missing Access` लौटाता है, प्रेषक को गिल्ड सदस्य के रूप में हल नहीं किया जा सकता या चैनल किसी अन्य गिल्ड से संबंधित होता है, तब एक्सेस समूह अनुमति देने के बजाय बंद हो जाता है।

Discord से संबंधित और उदाहरण: [Discord एक्सेस नियंत्रण](/hi/channels/discord#access-control-and-routing)

## Plugin निदान

Plugin लेखक संरचित एक्सेस-समूह स्थिति को वापस सपाट अनुमति-सूची में विस्तारित किए बिना उसका निरीक्षण कर सकते हैं:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

परिणाम संदर्भित, मेल खाने वाले, अनुपस्थित, असमर्थित और विफल समूहों की जानकारी देता है। इसका उपयोग निदान या अनुरूपता परीक्षणों के लिए करें। `expandAllowFromWithAccessGroups(...)` का उपयोग केवल उन संगतता पथों के लिए करें, जो अब भी सपाट `allowFrom` सरणी की अपेक्षा करते हैं।

## सुरक्षा संबंधी टिप्पणियाँ

- एक्सेस समूह अनुमति-सूची उपनाम हैं, भूमिकाएँ नहीं। वे अपने आप स्वामी नहीं बनाते, पेयरिंग अनुरोधों को स्वीकृत नहीं करते या टूल अनुमतियाँ प्रदान नहीं करते।
- `dmPolicy: "open"` के लिए प्रभावी DM अनुमति-सूची में अब भी `"*"` आवश्यक है। किसी एक्सेस समूह को संदर्भित करना सार्वजनिक पहुँच के समान नहीं है।
- अनुपस्थित समूह नाम अनुमति देने के बजाय बंद हो जाते हैं। यदि `allowFrom` में `accessGroup:operators` मौजूद है और `accessGroups.operators` अनुपस्थित है, तो वह प्रविष्टि किसी को भी अधिकृत नहीं करती।
- चैनल आईडी को स्थिर रखें। जब चैनल दोनों का समर्थन करता हो, तो प्रदर्शन नामों की तुलना में संख्यात्मक/उपयोगकर्ता आईडी को प्राथमिकता दें।

## समस्या निवारण

यदि किसी प्रेषक का मिलान होना चाहिए, लेकिन उसे अवरुद्ध किया गया है:

1. पुष्टि करें कि अनुमति-सूची फ़ील्ड में सटीक `accessGroup:<name>` संदर्भ मौजूद है।
2. पुष्टि करें कि `accessGroups.<name>.type` सही है।
3. पुष्टि करें कि प्रेषक आईडी संबंधित चैनल कुंजी के अंतर्गत या `"*"` के अंतर्गत सूचीबद्ध है।
4. पुष्टि करें कि प्रविष्टि उस चैनल के सामान्य अनुमति-सूची सिंटैक्स का उपयोग करती है।
5. Discord चैनल ऑडियंस के लिए पुष्टि करें कि बॉट गिल्ड चैनल देख सकता है और Server Members Intent सक्षम है।

एक्सेस-नियंत्रण कॉन्फ़िगरेशन संपादित करने के बाद `openclaw doctor` चलाएँ। यह रनटाइम से पहले कई अमान्य अनुमति-सूची और नीति संयोजनों का पता लगा लेता है।
