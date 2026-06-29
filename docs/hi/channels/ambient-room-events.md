---
read_when:
    - हमेशा चालू रहने वाले समूह या चैनल रूम कॉन्फ़िगर करना
    - आप चाहते हैं कि एजेंट अंतिम पाठ स्वचालित रूप से पोस्ट किए बिना कमरे की बातचीत पर नज़र रखे
    - दिखाई देने वाले रूम संदेश के बिना टाइपिंग और टोकन उपयोग को डीबग करना
sidebarTitle: Ambient room events
summary: समर्थित समूह रूम को शांत संदर्भ प्रदान करने दें, जब तक कि एजेंट संदेश टूल से न भेजे
title: परिवेशी कक्ष ईवेंट
x-i18n:
    generated_at: "2026-06-28T22:33:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

एम्बिएंट रूम इवेंट OpenClaw को उल्लेख न किए गए समूह या चैनल की बातचीत को शांत संदर्भ के रूप में संसाधित करने देते हैं। एजेंट मेमोरी और सत्र स्थिति अपडेट कर सकता है, लेकिन रूम तब तक मौन रहता है जब तक एजेंट स्पष्ट रूप से `message` टूल को कॉल नहीं करता।

हमेशा चालू रहने वाली समूह चैट के लिए, यह अनुशंसित मोड है: `messages.groupChat.unmentionedInbound: "room_event"` को `messages.groupChat.visibleReplies: "message_tool"` के साथ मिलाएं। इसका उपयोग तब करें जब एजेंट को सुनना चाहिए, तय करना चाहिए कि उत्तर कब उपयोगी है, और `NO_REPLY` का उत्तर देने वाले पुराने प्रॉम्प्ट पैटर्न से बचना चाहिए।

आज समर्थित: Discord गिल्ड चैनल, Slack चैनल और निजी चैनल, Slack मल्टी-पर्सन DM, और Telegram समूह या सुपरग्रुप। अन्य समूह चैनल अपना मौजूदा समूह व्यवहार बनाए रखते हैं, जब तक कि उनके चैनल पेज पर यह न कहा गया हो कि वे एम्बिएंट रूम इवेंट का समर्थन करते हैं।

## अनुशंसित सेटअप

वैश्विक समूह-चैट व्यवहार सेट करें:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

फिर उस रूम के लिए mention gating अक्षम करके रूम को हमेशा चालू के रूप में कॉन्फ़िगर करें। चैनल को फिर भी उसकी सामान्य `groupPolicy`, रूम allowlist, और sender allowlist द्वारा अनुमति मिलनी चाहिए।

कॉन्फ़िग सहेजने के बाद, Gateway `messages` सेटिंग्स को hot-reload करता है। केवल तब restart करें जब file watching या config reload अक्षम हो।

## क्या बदलता है

`messages.groupChat.unmentionedInbound: "room_event"` के साथ:

- उल्लेख न किए गए, अनुमति प्राप्त समूह या चैनल संदेश शांत रूम इवेंट बन जाते हैं
- उल्लेखित संदेश उपयोगकर्ता अनुरोध बने रहते हैं
- टेक्स्ट कमांड और नेटिव कमांड उपयोगकर्ता अनुरोध बने रहते हैं
- abort या stop अनुरोध उपयोगकर्ता अनुरोध बने रहते हैं
- direct messages उपयोगकर्ता अनुरोध बने रहते हैं

रूम इवेंट strict visible delivery का उपयोग करते हैं। अंतिम assistant टेक्स्ट private होता है। एजेंट को रूम में पोस्ट करने के लिए `message(action=send)` कॉल करना होगा।

## Discord उदाहरण

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

जब केवल एक चैनल को एम्बिएंट होना चाहिए, तब per-channel Discord कॉन्फ़िग का उपयोग करें:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack उदाहरण

Slack चैनल allowlist ID-first होते हैं। `#channel-name` नहीं, बल्कि `C12345678` जैसे चैनल ID का उपयोग करें।

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram उदाहरण

Telegram समूहों के लिए, bot को सामान्य समूह संदेश देखने में सक्षम होना चाहिए। यदि `requireMention: false` है, तो BotFather privacy mode अक्षम करें या कोई दूसरा Telegram सेटअप उपयोग करें जो पूरा समूह traffic bot तक पहुंचाता हो।

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram समूह ID आमतौर पर `-1001234567890` जैसी negative संख्याएं होती हैं। `openclaw logs --follow` से `chat.id` पढ़ें, किसी समूह संदेश को ID helper bot पर forward करें, या Bot API `getUpdates` जांचें।

## एजेंट-विशिष्ट नीति

जब कई एजेंट एक ही रूम साझा करते हैं लेकिन केवल एक को उल्लेख न की गई बातचीत को एम्बिएंट संदर्भ के रूप में लेना चाहिए, तब agent override का उपयोग करें:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

एजेंट-विशिष्ट `agents.list[].groupChat.unmentionedInbound` मान उस एजेंट के लिए `messages.groupChat.unmentionedInbound` को override करता है।

## दिखने वाले उत्तर मोड

सामान्य समूह/चैनल उपयोगकर्ता अनुरोधों के लिए `messages.groupChat.visibleReplies` का default `"automatic"` होता है। जब आप चाहते हैं कि अंतिम assistant टेक्स्ट स्पष्ट message-tool कॉल की आवश्यकता के बिना दिखाई देता हुआ पोस्ट हो, तब वह default रखें।

एम्बिएंट हमेशा चालू रूम के लिए, `messages.groupChat.visibleReplies: "message_tool"` अभी भी अनुशंसित है, खासकर GPT 5.5 जैसे नवीनतम पीढ़ी के, tool-reliable models के साथ। यह एजेंट को message tool कॉल करके तय करने देता है कि कब बोलना है। यदि model tool कॉल किए बिना अंतिम टेक्स्ट लौटाता है, तो OpenClaw उस अंतिम टेक्स्ट को private रखता है और suppressed delivery metadata लॉग करता है।

जब अन्य समूह अनुरोध automatic replies का उपयोग करते हैं, तब भी रूम इवेंट strict रहते हैं। उल्लेख न किए गए एम्बिएंट रूम इवेंट को visible output के लिए फिर भी `message(action=send)` की आवश्यकता होती है।

## इतिहास

`messages.groupChat.historyLimit` वैश्विक समूह history default नियंत्रित करता है। चैनल इसे `channels.<channel>.historyLimit` के साथ override कर सकते हैं, और कुछ चैनल per-account history limits का भी समर्थन करते हैं।

समूह history context अक्षम करने के लिए `historyLimit: 0` सेट करें।

समर्थित room-event चैनल हाल के एम्बिएंट रूम संदेशों को संदर्भ के रूप में रखते हैं। Discord room-event history को तब तक रखता है जब तक कोई visible Discord send सफल न हो जाए, इसलिए message-tool delivery से पहले शांत संदर्भ खोता नहीं है।

## समस्या निवारण

यदि रूम typing या token usage दिखाता है लेकिन कोई visible message नहीं है:

1. पुष्टि करें कि रूम को channel allowlist और sender allowlist द्वारा अनुमति दी गई है।
2. पुष्टि करें कि अपेक्षित रूम स्तर पर `requireMention: false` सेट है।
3. जांचें कि `messages.groupChat.unmentionedInbound` या agent override `"room_event"` है या नहीं।
4. suppressed final payload metadata या `didSendViaMessagingTool: false` के लिए logs देखें।
5. सामान्य समूह अनुरोधों के लिए, यदि आप चाहते हैं कि अंतिम replies अपने आप पोस्ट हों, तो `messages.groupChat.visibleReplies: "automatic"` रखें या restore करें। `message_tool` का उपयोग करने वाले एम्बिएंट रूम के लिए, ऐसा model/runtime उपयोग करें जो विश्वसनीय रूप से tools कॉल करता हो।

यदि Telegram एम्बिएंट रूम बिल्कुल trigger नहीं होते, तो BotFather privacy mode जांचें और सत्यापित करें कि Gateway सामान्य समूह संदेश प्राप्त कर रहा है।

यदि Slack एम्बिएंट रूम trigger नहीं होते, तो सत्यापित करें कि channel key Slack channel ID है और app के पास उस room type के लिए आवश्यक `channels:history` या `groups:history` scope है।

## संबंधित

- [समूह](/hi/channels/groups)
- [Discord](/hi/channels/discord)
- [Slack](/hi/channels/slack)
- [Telegram](/hi/channels/telegram)
- [चैनल समस्या निवारण](/hi/channels/troubleshooting)
- [चैनल कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-channels)
