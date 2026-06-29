---
read_when:
    - OpenClaw के साथ Synology Chat सेट अप करना
    - Synology Chat Webhook रूटिंग की डिबगिंग
summary: Synology Chat webhook सेटअप और OpenClaw कॉन्फ़िगरेशन
title: Synology Chat
x-i18n:
    generated_at: "2026-06-28T22:40:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

स्थिति: Synology Chat Webhook का उपयोग करने वाला बंडल किया गया Plugin सीधे संदेश वाला चैनल।
Plugin Synology Chat के बाहर जाने वाले Webhook से आने वाले संदेश स्वीकार करता है और
Synology Chat के आने वाले Webhook के ज़रिए जवाब भेजता है।

## बंडल किया गया Plugin

Synology Chat मौजूदा OpenClaw रिलीज़ में बंडल किए गए Plugin के रूप में शिप होता है, इसलिए सामान्य
पैकेज किए गए बिल्ड को अलग इंस्टॉल की ज़रूरत नहीं होती।

यदि आप पुराने बिल्ड पर हैं या किसी ऐसे कस्टम इंस्टॉल पर हैं जिसमें Synology Chat शामिल नहीं है,
तो इसे मैन्युअल रूप से इंस्टॉल करें:

स्थानीय चेकआउट से इंस्टॉल करें:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

विवरण: [Plugin](/hi/tools/plugin)

## त्वरित सेटअप

1. सुनिश्चित करें कि Synology Chat Plugin उपलब्ध है।
   - मौजूदा पैकेज किए गए OpenClaw रिलीज़ इसे पहले से बंडल करते हैं।
   - पुराने/कस्टम इंस्टॉल ऊपर दिए गए कमांड से इसे स्रोत चेकआउट से मैन्युअल रूप से जोड़ सकते हैं।
   - `openclaw onboard` अब Synology Chat को उसी चैनल सेटअप सूची में दिखाता है जिसमें `openclaw channels add` है।
   - गैर-इंटरैक्टिव सेटअप: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat इंटीग्रेशन में:
   - एक आने वाला Webhook बनाएँ और उसका URL कॉपी करें।
   - अपने गुप्त टोकन के साथ एक बाहर जाने वाला Webhook बनाएँ।
3. बाहर जाने वाले Webhook URL को अपने OpenClaw Gateway की ओर पॉइंट करें:
   - डिफ़ॉल्ट रूप से `https://gateway-host/webhook/synology`।
   - या आपका कस्टम `channels.synology-chat.webhookPath`।
4. OpenClaw में सेटअप पूरा करें।
   - निर्देशित: `openclaw onboard`
   - सीधे: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway रीस्टार्ट करें और Synology Chat बॉट को DM भेजें।

Webhook प्रमाणीकरण विवरण:

- OpenClaw बाहर जाने वाले Webhook टोकन को पहले `body.token` से, फिर
  `?token=...` से, और फिर हेडर से स्वीकार करता है।
- स्वीकार किए गए हेडर रूप:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- खाली या अनुपस्थित टोकन fail closed करते हैं।

न्यूनतम कॉन्फ़िग:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## एनवायरनमेंट वेरिएबल

डिफ़ॉल्ट खाते के लिए, आप env vars का उपयोग कर सकते हैं:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (कॉमा से अलग)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

कॉन्फ़िग मान env vars को ओवरराइड करते हैं।

`SYNOLOGY_CHAT_INCOMING_URL` को वर्कस्पेस `.env` से सेट नहीं किया जा सकता; [वर्कस्पेस `.env` फ़ाइलें](/hi/gateway/security) देखें।

## DM नीति और एक्सेस नियंत्रण

- `dmPolicy: "allowlist"` अनुशंसित डिफ़ॉल्ट है।
- `allowedUserIds` Synology यूज़र ID की सूची (या कॉमा से अलग स्ट्रिंग) स्वीकार करता है।
- `allowlist` मोड में, खाली `allowedUserIds` सूची को गलत कॉन्फ़िगरेशन माना जाता है और Webhook रूट शुरू नहीं होगा (सबको अनुमति देने के लिए `allowedUserIds: ["*"]` के साथ `dmPolicy: "open"` का उपयोग करें)।
- `dmPolicy: "open"` सार्वजनिक DM को केवल तब अनुमति देता है जब `allowedUserIds` में `"*"` शामिल हो; प्रतिबंधात्मक एंट्री के साथ, केवल मेल खाने वाले यूज़र चैट कर सकते हैं।
- `dmPolicy: "disabled"` DM को ब्लॉक करता है।
- जवाब प्राप्तकर्ता बाइंडिंग डिफ़ॉल्ट रूप से स्थिर संख्यात्मक `user_id` पर रहती है। `channels.synology-chat.dangerouslyAllowNameMatching: true` break-glass संगतता मोड है जो जवाब डिलीवरी के लिए बदल सकने वाले यूज़रनेम/निकनेम लुकअप को फिर से सक्षम करता है।
- पेयरिंग अनुमोदन इनके साथ काम करते हैं:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## आउटबाउंड डिलीवरी

लक्ष्य के रूप में संख्यात्मक Synology Chat यूज़र ID का उपयोग करें।

उदाहरण:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

मीडिया भेजना URL-आधारित फ़ाइल डिलीवरी से समर्थित है।
आउटबाउंड फ़ाइल URL को `http` या `https` का उपयोग करना होगा, और निजी या अन्यथा ब्लॉक किए गए नेटवर्क लक्ष्य OpenClaw द्वारा URL को NAS Webhook पर फ़ॉरवर्ड करने से पहले अस्वीकार कर दिए जाते हैं।

## मल्टी-अकाउंट

`channels.synology-chat.accounts` के अंतर्गत कई Synology Chat खाते समर्थित हैं।
हर खाता टोकन, आने वाला URL, Webhook पाथ, DM नीति और सीमाएँ ओवरराइड कर सकता है।
सीधे संदेश वाले सेशन प्रति खाता और यूज़र अलग-थलग रहते हैं, इसलिए दो अलग-अलग Synology खातों पर वही संख्यात्मक `user_id`
ट्रांसक्रिप्ट स्थिति साझा नहीं करता।
हर सक्षम खाते को अलग `webhookPath` दें। OpenClaw अब डुप्लिकेट सटीक पाथ अस्वीकार करता है
और मल्टी-अकाउंट सेटअप में केवल साझा Webhook पाथ इनहेरिट करने वाले नामित खातों को शुरू करने से मना करता है।
यदि आपको किसी नामित खाते के लिए जानबूझकर लेगसी इनहेरिटेंस चाहिए, तो उस खाते पर या `channels.synology-chat` पर
`dangerouslyAllowInheritedWebhookPath: true` सेट करें,
लेकिन डुप्लिकेट सटीक पाथ अभी भी fail-closed अस्वीकार किए जाते हैं। प्रति-खाता स्पष्ट पाथ को प्राथमिकता दें।

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## सुरक्षा नोट

- `token` को गुप्त रखें और लीक होने पर उसे रोटेट करें।
- `allowInsecureSsl: false` रखें जब तक कि आप किसी सेल्फ-साइंड स्थानीय NAS प्रमाणपत्र पर स्पष्ट रूप से भरोसा न करते हों।
- इनबाउंड Webhook अनुरोध टोकन-सत्यापित होते हैं और प्रति प्रेषक रेट-लिमिटेड होते हैं।
- अमान्य टोकन जाँच constant-time गुप्त तुलना का उपयोग करती है और fail closed करती है।
- प्रोडक्शन के लिए `dmPolicy: "allowlist"` को प्राथमिकता दें।
- `dangerouslyAllowNameMatching` को बंद रखें जब तक कि आपको स्पष्ट रूप से लेगसी यूज़रनेम-आधारित जवाब डिलीवरी की ज़रूरत न हो।
- `dangerouslyAllowInheritedWebhookPath` को बंद रखें जब तक कि आप मल्टी-अकाउंट सेटअप में साझा-पाथ रूटिंग जोखिम को स्पष्ट रूप से स्वीकार न करते हों।

## समस्या निवारण

- `Missing required fields (token, user_id, text)`:
  - बाहर जाने वाले Webhook पेलोड में आवश्यक फ़ील्ड में से कोई एक अनुपस्थित है
  - यदि Synology टोकन हेडर में भेजता है, तो सुनिश्चित करें कि Gateway/प्रॉक्सी उन हेडर को संरक्षित रखता है
- `Invalid token`:
  - बाहर जाने वाला Webhook गुप्त `channels.synology-chat.token` से मेल नहीं खाता
  - अनुरोध गलत खाते/Webhook पाथ पर जा रहा है
  - रिवर्स प्रॉक्सी ने अनुरोध OpenClaw तक पहुँचने से पहले टोकन हेडर हटा दिया
- `Rate limit exceeded`:
  - एक ही स्रोत से बहुत अधिक अमान्य टोकन प्रयास उस स्रोत को अस्थायी रूप से लॉक आउट कर सकते हैं
  - प्रमाणित प्रेषकों के लिए अलग प्रति-यूज़र संदेश रेट लिमिट भी होती है
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` सक्षम है लेकिन कोई यूज़र कॉन्फ़िगर नहीं है
- `User not authorized`:
  - प्रेषक का संख्यात्मक `user_id` `allowedUserIds` में नहीं है

## संबंधित

- [चैनल अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और मेंशन गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सेशन रूटिंग
- [सुरक्षा](/hi/gateway/security) — एक्सेस मॉडल और हार्डनिंग
