---
read_when:
    - हमेशा सक्रिय समूह या चैनल रूम कॉन्फ़िगर करना
    - आप चाहते हैं कि एजेंट अंतिम टेक्स्ट अपने-आप पोस्ट किए बिना रूम की बातचीत पर नज़र रखे
    - दिखाई देने वाले रूम संदेश के बिना टाइपिंग और टोकन उपयोग की डिबगिंग
sidebarTitle: Ambient room events
summary: समर्थित समूह कक्षों को शांत संदर्भ प्रदान करने दें, जब तक एजेंट संदेश टूल से न भेजे
title: परिवेशी कमरे की घटनाएँ
x-i18n:
    generated_at: "2026-07-02T17:37:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

एम्बिएंट रूम इवेंट OpenClaw को बिना उल्लेख किए गए समूह या चैनल चैटर को शांत संदर्भ के रूप में प्रोसेस करने देते हैं। एजेंट मेमोरी और सेशन स्थिति अपडेट कर सकता है, लेकिन रूम तब तक शांत रहता है जब तक एजेंट स्पष्ट रूप से `message` टूल को कॉल नहीं करता।

हमेशा-चालू समूह चैट के लिए, यह अनुशंसित मोड है: `messages.groupChat.unmentionedInbound: "room_event"` को `messages.groupChat.visibleReplies: "message_tool"` के साथ मिलाएं। इसका उपयोग तब करें जब एजेंट को सुनना चाहिए, तय करना चाहिए कि जवाब कब उपयोगी है, और `NO_REPLY` का जवाब देने वाले पुराने प्रॉम्प्ट पैटर्न से बचना चाहिए।

आज समर्थित: Discord गिल्ड चैनल, Slack चैनल और निजी चैनल, Slack मल्टी-पर्सन DMs, और Telegram समूह या सुपरग्रुप। अन्य समूह चैनल अपना मौजूदा समूह व्यवहार बनाए रखते हैं, जब तक उनकी चैनल पेज यह न कहे कि वे एम्बिएंट रूम इवेंट का समर्थन करते हैं।

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

फिर उस रूम के लिए मेंशन गेटिंग बंद करके रूम को हमेशा-चालू के रूप में कॉन्फ़िगर करें। चैनल को फिर भी अपनी सामान्य `groupPolicy`, रूम allowlist, और sender allowlist द्वारा अनुमति प्राप्त होनी चाहिए।

कॉन्फ़िग सेव करने के बाद, Gateway `messages` सेटिंग्स को हॉट-रीलोड करता है। केवल तब रीस्टार्ट करें जब फ़ाइल वॉचिंग या कॉन्फ़िग रीलोड अक्षम हो।

## क्या बदलता है

`messages.groupChat.unmentionedInbound: "room_event"` के साथ:

- बिना उल्लेख वाले अनुमत समूह या चैनल संदेश शांत रूम इवेंट बन जाते हैं
- उल्लेखित संदेश उपयोगकर्ता अनुरोध बने रहते हैं
- टेक्स्ट कमांड और नेटिव कमांड उपयोगकर्ता अनुरोध बने रहते हैं
- abort या stop अनुरोध उपयोगकर्ता अनुरोध बने रहते हैं
- डायरेक्ट संदेश उपयोगकर्ता अनुरोध बने रहते हैं

रूम इवेंट सख्त दृश्य डिलीवरी का उपयोग करते हैं। अंतिम असिस्टेंट टेक्स्ट निजी होता है। एजेंट को रूम में पोस्ट करने के लिए `message(action=send)` कॉल करना होगा।

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

जब केवल एक चैनल को एम्बिएंट होना चाहिए, तब प्रति-चैनल Discord कॉन्फ़िग का उपयोग करें:

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

Slack चैनल allowlists ID-प्रथम होते हैं। `#channel-name` नहीं, बल्कि `C12345678` जैसे चैनल IDs का उपयोग करें।

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

Telegram समूहों के लिए, बॉट को सामान्य समूह संदेश देखने में सक्षम होना चाहिए। यदि `requireMention: false` है, तो BotFather privacy mode बंद करें या कोई अन्य Telegram सेटअप उपयोग करें जो पूरे समूह ट्रैफ़िक को बॉट तक पहुंचाता हो।

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

Telegram समूह IDs आमतौर पर `-1001234567890` जैसे ऋणात्मक नंबर होते हैं। `openclaw logs --follow` से `chat.id` पढ़ें, किसी समूह संदेश को ID हेल्पर बॉट पर फ़ॉरवर्ड करें, या Bot API `getUpdates` देखें।

## एजेंट-विशिष्ट नीति

जब कई एजेंट एक ही रूम साझा करते हों लेकिन केवल एक को बिना उल्लेख वाले चैटर को एम्बिएंट संदर्भ के रूप में लेना चाहिए, तब एजेंट ओवरराइड का उपयोग करें:

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

एजेंट-विशिष्ट `agents.list[].groupChat.unmentionedInbound` मान उस एजेंट के लिए `messages.groupChat.unmentionedInbound` को ओवरराइड करता है।

## दृश्य जवाब मोड

सामान्य समूह/चैनल उपयोगकर्ता अनुरोधों के लिए `messages.groupChat.visibleReplies` का डिफ़ॉल्ट `"automatic"` है। जब आप चाहते हैं कि अंतिम असिस्टेंट टेक्स्ट स्पष्ट message-tool कॉल के बिना दृश्य रूप से पोस्ट हो, तब वही डिफ़ॉल्ट रखें।

एम्बिएंट हमेशा-चालू रूम के लिए, `messages.groupChat.visibleReplies: "message_tool"` अभी भी अनुशंसित है, विशेष रूप से GPT 5.5 जैसे नवीनतम पीढ़ी के, टूल-विश्वसनीय मॉडलों के साथ। यह एजेंट को message टूल कॉल करके तय करने देता है कि कब बोलना है। यदि मॉडल टूल कॉल किए बिना अंतिम टेक्स्ट लौटाता है, तो OpenClaw उस अंतिम टेक्स्ट को निजी रखता है और दबाई गई डिलीवरी मेटाडेटा लॉग करता है।

रूम इवेंट सख्त बने रहते हैं, भले ही अन्य समूह अनुरोध automatic replies का उपयोग करें। बिना उल्लेख वाले एम्बिएंट रूम इवेंट को दृश्य आउटपुट के लिए फिर भी `message(action=send)` की आवश्यकता होती है।

## इतिहास

`messages.groupChat.historyLimit` वैश्विक समूह इतिहास डिफ़ॉल्ट को नियंत्रित करता है। चैनल इसे `channels.<channel>.historyLimit` से ओवरराइड कर सकते हैं, और कुछ चैनल प्रति-अकाउंट इतिहास सीमाओं का भी समर्थन करते हैं।

समूह इतिहास संदर्भ अक्षम करने के लिए `historyLimit: 0` सेट करें।

समर्थित room-event चैनल हाल के एम्बिएंट रूम संदेशों को संदर्भ के रूप में रखते हैं। Telegram `historyLimit` द्वारा सीमित हमेशा-चालू रोलिंग प्रति-समूह विंडो रखता है; user-request turns बॉट के अंतिम रिकॉर्ड किए गए जवाब के बाद की प्रविष्टियां चुनते हैं, जबकि room-event turns को पूरी हालिया विंडो मिलती है ताकि मॉडल अपनी हाल की पोस्ट देख सके। रिटायर्ड Telegram `includeGroupHistoryContext` मोड कुंजी `openclaw doctor --fix` द्वारा हटाई जाती है।

## समस्या निवारण

यदि रूम typing या token usage दिखाता है लेकिन कोई दृश्य संदेश नहीं दिखता:

1. पुष्टि करें कि रूम को चैनल allowlist और sender allowlist द्वारा अनुमति मिली है।
2. पुष्टि करें कि अपेक्षित रूम स्तर पर `requireMention: false` सेट है।
3. जांचें कि `messages.groupChat.unmentionedInbound` या एजेंट ओवरराइड `"room_event"` है या नहीं।
4. दबाए गए अंतिम payload metadata या `didSendViaMessagingTool: false` के लिए लॉग देखें।
5. सामान्य समूह अनुरोधों के लिए, यदि आप अंतिम जवाबों को स्वचालित रूप से पोस्ट कराना चाहते हैं, तो `messages.groupChat.visibleReplies: "automatic"` रखें या बहाल करें। `message_tool` का उपयोग करने वाले एम्बिएंट रूम के लिए, ऐसा मॉडल/runtime उपयोग करें जो भरोसेमंद तरीके से tools कॉल करता हो।

यदि Telegram एम्बिएंट रूम बिल्कुल ट्रिगर नहीं होते, तो BotFather privacy mode जांचें और सत्यापित करें कि Gateway सामान्य समूह संदेश प्राप्त कर रहा है।

यदि Slack एम्बिएंट रूम ट्रिगर नहीं होते, तो सत्यापित करें कि चैनल कुंजी Slack चैनल ID है और ऐप के पास उस रूम प्रकार के लिए आवश्यक `channels:history` या `groups:history` scope है।

## संबंधित

- [समूह](/hi/channels/groups)
- [Discord](/hi/channels/discord)
- [Slack](/hi/channels/slack)
- [Telegram](/hi/channels/telegram)
- [चैनल समस्या निवारण](/hi/channels/troubleshooting)
- [चैनल कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-channels)
