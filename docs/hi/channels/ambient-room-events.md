---
read_when:
    - हमेशा सक्रिय समूह या चैनल कक्ष कॉन्फ़िगर करना
    - आप चाहते हैं कि एजेंट अंतिम टेक्स्ट को अपने-आप पोस्ट किए बिना रूम की बातचीत पर नज़र रखे
    - बिना किसी दृश्यमान रूम संदेश के टाइपिंग और टोकन उपयोग की डीबगिंग
sidebarTitle: Ambient room events
summary: समर्थित समूह कक्षों को शांत संदर्भ प्रदान करने दें, जब तक कि एजेंट संदेश टूल से संदेश न भेजे
title: परिवेशीय कक्ष घटनाएँ
x-i18n:
    generated_at: "2026-07-16T13:13:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

परिवेशी कक्ष ईवेंट OpenClaw को बिना उल्लेख वाली समूह या चैनल बातचीत को शांत संदर्भ के रूप में संसाधित करने देते हैं। एजेंट मेमोरी और सत्र स्थिति अपडेट कर सकता है, लेकिन जब तक एजेंट स्पष्ट रूप से `message` टूल को कॉल नहीं करता, कक्ष मौन रहता है।

हमेशा सक्रिय समूह चैट के लिए, `messages.groupChat.unmentionedInbound: "room_event"` को `messages.groupChat.visibleReplies: "message_tool"` के साथ संयोजित करें। एजेंट सुनता है, तय करता है कि उत्तर कब उपयोगी है, और उसे `NO_REPLY` से उत्तर देने वाले पुराने प्रॉम्प्ट पैटर्न की कभी आवश्यकता नहीं होती।

वर्तमान में समर्थित: Discord गिल्ड चैनल, Slack चैनल और निजी चैनल, Slack के बहु-व्यक्ति DM, तथा Telegram समूह या सुपरग्रुप। अन्य समूह चैनल अपना मौजूदा समूह व्यवहार बनाए रखते हैं, जब तक कि उनके चैनल पृष्ठ पर यह न कहा गया हो कि वे परिवेशी कक्ष ईवेंट का समर्थन करते हैं।

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

फिर उस कक्ष के लिए उल्लेख गेटिंग अक्षम करके उसे हमेशा सक्रिय बनाएँ। कक्ष को फिर भी अपनी सामान्य `groupPolicy`, कक्ष अनुमति-सूची और प्रेषक अनुमति-सूची से गुजरना आवश्यक है।

कॉन्फ़िग सहेजने के बाद, Gateway `messages` सेटिंग को हॉट-अप्लाई करता है। केवल तभी पुनः आरंभ करें जब फ़ाइल निगरानी या कॉन्फ़िग पुनः लोड करना अक्षम हो (`gateway.reload.mode: "off"`)।

## क्या बदलता है

`messages.groupChat.unmentionedInbound: "room_event"` के साथ:

- अनुमत समूह या चैनल के बिना उल्लेख वाले संदेश शांत कक्ष ईवेंट बन जाते हैं
- उल्लेख वाले संदेश उपयोगकर्ता अनुरोध बने रहते हैं
- टेक्स्ट नियंत्रण कमांड और नेटिव कमांड उपयोगकर्ता अनुरोध बने रहते हैं
- निरस्त करने या रोकने के अनुरोध उपयोगकर्ता अनुरोध बने रहते हैं
- प्रत्यक्ष संदेश उपयोगकर्ता अनुरोध बने रहते हैं

कक्ष ईवेंट सख्त दृश्यमान डिलीवरी का उपयोग करते हैं। सहायक का अंतिम टेक्स्ट निजी रहता है। कक्ष में पोस्ट करने के लिए एजेंट को `message(action=send)` कॉल करना आवश्यक है।

कक्ष ईवेंट के लिए टाइपिंग और जीवनचक्र स्थिति प्रतिक्रियाएँ दबाई रहती हैं। एक स्पष्ट प्राप्ति अपवाद `messages.ackReactionScope: "all"` है, जो कॉन्फ़िगर की गई अभिस्वीकृति प्रतिक्रिया भेजता है; जब कक्ष को पूरी तरह मौन रहना आवश्यक हो, तब कोई अधिक सीमित दायरा या `"off"` उपयोग करें।

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

जब केवल एक चैनल परिवेशी होना चाहिए, तब प्रति-चैनल Discord कॉन्फ़िग उपयोग करें। `groupPolicy: "allowlist"` के अंतर्गत चैनल को सूचीबद्ध करने से ही उसे अनुमति मिलती है (`enabled: false` किसी प्रविष्टि को अक्षम करता है):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
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

Slack चैनल अनुमति-सूचियाँ पहले ID का उपयोग करती हैं। `#channel-name` के बजाय `C12345678` जैसे चैनल ID उपयोग करें। `channels.slack.channels` के अंतर्गत चैनल को सूचीबद्ध करने से ही उसे अनुमति मिलती है (`enabled: false` किसी प्रविष्टि को अक्षम करता है):

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
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram उदाहरण

Telegram समूहों के लिए, बॉट को सामान्य समूह संदेश दिखाई देने चाहिए। यदि `requireMention: false`, तो BotFather का गोपनीयता मोड अक्षम करें या किसी अन्य Telegram सेटअप का उपयोग करें जो समूह का पूरा ट्रैफ़िक बॉट तक पहुँचाता हो।

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

Telegram समूह ID सामान्यतः `-1001234567890` जैसी ऋणात्मक संख्याएँ होती हैं। `openclaw logs --follow` से `chat.id` पढ़ें, किसी समूह संदेश को ID सहायक बॉट को अग्रेषित करें, या Bot API `getUpdates` का निरीक्षण करें।

## एजेंट-विशिष्ट नीति

जब कई एजेंट एक ही कक्ष साझा करते हों, लेकिन केवल एक एजेंट को बिना उल्लेख वाली बातचीत को परिवेशी संदर्भ मानना चाहिए, तब एजेंट ओवरराइड उपयोग करें:

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

## दृश्यमान उत्तर मोड

सामान्य समूह/चैनल उपयोगकर्ता अनुरोधों के लिए `messages.groupChat.visibleReplies` का डिफ़ॉल्ट `"automatic"` होता है। जब सहायक का अंतिम टेक्स्ट स्पष्ट संदेश-टूल कॉल के बिना दृश्यमान रूप से पोस्ट होना चाहिए, तब यह डिफ़ॉल्ट बनाए रखें।

परिवेशी हमेशा सक्रिय कक्षों के लिए, `messages.groupChat.visibleReplies: "message_tool"` अब भी अनुशंसित है, विशेष रूप से GPT-5.6 Sol जैसे नवीनतम पीढ़ी के विश्वसनीय रूप से टूल उपयोग करने वाले मॉडल के साथ। यह एजेंट को संदेश टूल कॉल करके तय करने देता है कि कब बोलना है। यदि मॉडल टूल कॉल किए बिना अंतिम टेक्स्ट लौटाता है, तो OpenClaw उस अंतिम टेक्स्ट को निजी रखता है और दबाई गई डिलीवरी का मेटाडेटा लॉग करता है।

कक्ष ईवेंट तब भी सख्त रहते हैं, जब अन्य समूह अनुरोध स्वचालित उत्तरों का उपयोग करते हों। बिना उल्लेख वाले परिवेशी कक्ष ईवेंट के दृश्यमान आउटपुट के लिए हमेशा `message(action=send)` आवश्यक होता है।

## इतिहास

`messages.groupChat.historyLimit` वैश्विक समूह इतिहास का डिफ़ॉल्ट सेट करता है (सेट न होने पर 50; धनात्मक पूर्णांक होना आवश्यक है)। चैनल इसे `channels.<channel>.historyLimit` से ओवरराइड कर सकते हैं, और कुछ चैनल प्रति-खाता इतिहास सीमाओं का भी समर्थन करते हैं। उस चैनल के लिए समूह इतिहास संदर्भ अक्षम करने हेतु चैनल-स्तरीय `historyLimit: 0` सेट करें।

समर्थित कक्ष-ईवेंट चैनल हाल के परिवेशी कक्ष संदेशों को संदर्भ के रूप में रखते हैं। Telegram `historyLimit` द्वारा सीमित, हमेशा सक्रिय प्रति-समूह रोलिंग विंडो रखता है; उपयोगकर्ता-अनुरोध टर्न बॉट के अंतिम दर्ज उत्तर के बाद की प्रविष्टियाँ चुनते हैं, जबकि कक्ष-ईवेंट टर्न को पूरी हालिया विंडो मिलती है ताकि मॉडल अपनी हाल की पोस्ट देख सके। अप्रचलित Telegram `includeGroupHistoryContext` मोड कुंजी को `openclaw doctor --fix` द्वारा हटा दिया जाता है।

## समस्या निवारण

यदि कक्ष टाइपिंग या टोकन उपयोग दिखाता है, लेकिन कोई दृश्यमान संदेश नहीं दिखता:

1. पुष्टि करें कि कक्ष को चैनल अनुमति-सूची और प्रेषक अनुमति-सूची द्वारा अनुमति प्राप्त है।
2. पुष्टि करें कि `requireMention: false` आपके अपेक्षित कक्ष स्तर पर सेट है।
3. जाँचें कि `messages.groupChat.unmentionedInbound` या एजेंट ओवरराइड `"room_event"` है या नहीं।
4. दबाए गए अंतिम पेलोड के मेटाडेटा या `didSendViaMessagingTool: false` के लिए लॉग का निरीक्षण करें।
5. सामान्य समूह अनुरोधों के अंतिम उत्तर स्वचालित रूप से पोस्ट कराने के लिए `messages.groupChat.visibleReplies: "automatic"` बनाए रखें या पुनर्स्थापित करें। `message_tool` उपयोग करने वाले परिवेशी कक्षों के लिए ऐसे मॉडल/रनटाइम का उपयोग करें जो विश्वसनीय रूप से टूल कॉल करता हो।

यदि Telegram परिवेशी कक्ष बिल्कुल ट्रिगर नहीं होते, तो BotFather गोपनीयता मोड जाँचें और सत्यापित करें कि Gateway सामान्य समूह संदेश प्राप्त कर रहा है।

यदि Slack परिवेशी कक्ष ट्रिगर नहीं होते, तो सत्यापित करें कि चैनल कुंजी Slack चैनल ID है और ऐप के पास उस कक्ष प्रकार के लिए इतिहास स्कोप है: `channels:history` (सार्वजनिक), `groups:history` (निजी), या `mpim:history` (बहु-व्यक्ति DM)।

## संबंधित

- [समूह](/hi/channels/groups)
- [Discord](/hi/channels/discord)
- [Slack](/hi/channels/slack)
- [Telegram](/hi/channels/telegram)
- [चैनल समस्या निवारण](/hi/channels/troubleshooting)
- [चैनल कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-channels)
