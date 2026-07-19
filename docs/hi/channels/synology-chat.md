---
read_when:
    - OpenClaw के साथ Synology Chat सेट अप करना
    - Synology Chat Webhook रूटिंग की डीबगिंग
summary: Synology Chat Webhook सेटअप और OpenClaw कॉन्फ़िगरेशन
title: Synology Chat
x-i18n:
    generated_at: "2026-07-19T08:54:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3c03379944ee4187260a7287f6d2aed1ad8fdd1c22b5581c8a5d55515bbb6ad5
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat एक Webhook युग्म के माध्यम से OpenClaw से जुड़ता है: Synology Chat का एक आउटगोइंग Webhook आने वाले सीधे संदेशों को Gateway पर पोस्ट करता है, और उत्तर Synology Chat के एक इनकमिंग Webhook के माध्यम से वापस जाते हैं।

स्थिति: आधिकारिक Plugin, अलग से इंस्टॉल किया जाता है। केवल सीधे संदेश; टेक्स्ट और URL-आधारित फ़ाइल प्रेषण समर्थित हैं।

## इंस्टॉल करें

```bash
openclaw plugins install @openclaw/synology-chat
```

स्थानीय चेकआउट (git रिपॉज़िटरी से चलाते समय):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप

1. Plugin इंस्टॉल करें (ऊपर)।
2. Synology Chat इंटीग्रेशन में:
   - एक इनकमिंग Webhook बनाएँ और उसका URL कॉपी करें।
   - अपने गुप्त टोकन के साथ एक आउटगोइंग Webhook बनाएँ।
3. आउटगोइंग Webhook URL को अपने OpenClaw Gateway पर इंगित करें:
   - डिफ़ॉल्ट रूप से `https://gateway-host/webhook/synology`।
   - या आपका कस्टम `channels.synology-chat.webhookPath`।
4. OpenClaw में सेटअप पूरा करें। दोनों प्रवाहों में Synology Chat समान चैनल सेटअप सूची में दिखाई देता है:
   - मार्गदर्शित: `openclaw onboard` या `openclaw channels add`
   - प्रत्यक्ष: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway पुनः आरंभ करें और Synology Chat बॉट को एक DM भेजें।

Webhook प्रमाणीकरण विवरण:

- OpenClaw आउटगोइंग Webhook टोकन को पहले `body.token` से, फिर
  `?token=...` से, और फिर हेडर से स्वीकार करता है।
- स्वीकृत हेडर प्रारूप:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- खाली या अनुपस्थित टोकन सुरक्षित रूप से विफल होते हैं।
- पेलोड `application/x-www-form-urlencoded` या `application/json` हो सकते हैं; `token`, `user_id`, और `text` आवश्यक हैं।

## इनबाउंड स्थायित्व

टोकन, प्रेषक-नीति और दर-सीमा जाँच सफल होने के बाद, OpenClaw संग्रहीत एनवलप से Webhook टोकन हटा देता है और उसकी अभिस्वीकृति देने से पहले इवेंट को स्थायी रूप से कतारबद्ध करता है। रूट केवल उस परिशिष्ट के सफल होने के बाद `204` लौटाता है; स्थायित्व की विफलता पर `503` लौटाया जाता है, ताकि Synology Chat संदेश को चुपचाप खोने के बजाय पुनः प्रयास कर सके।

लंबित या पुनः प्रयास योग्य इवेंट Gateway के पुनः आरंभ होने के बाद भी बने रहते हैं। संबंधित सक्रिय या प्रतिधारित पूर्णता रिकॉर्ड मौजूद रहने तक Synology का स्थिर `post_id` डुप्लिकेट कतार प्रविष्टियों को रोकता है। कतार से एजेंट को सौंपने के दौरान डिलीवरी कम-से-कम एक बार बनी रहती है, इसलिए उस सीमा पर क्रैश होने से कोई टर्न फिर भी दोबारा चल सकता है।

न्यूनतम कॉन्फ़िगरेशन:

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

## पर्यावरण चर

डिफ़ॉल्ट खाते के लिए आप पर्यावरण चर उपयोग कर सकते हैं:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (अल्पविराम से अलग)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

कॉन्फ़िगरेशन मान पर्यावरण चरों को ओवरराइड करते हैं।

`SYNOLOGY_CHAT_INCOMING_URL` और `SYNOLOGY_NAS_HOST` को किसी कार्यक्षेत्र `.env` से सेट नहीं किया जा सकता; [कार्यस्थान `.env` फ़ाइलें](/hi/gateway/security#workspace-env-files) देखें।

## DM नीति और अभिगम नियंत्रण

- समर्थित `dmPolicy` मान: `allowlist` (डिफ़ॉल्ट), `open`, और `disabled`। Synology Chat में पेयरिंग प्रवाह नहीं है; प्रेषकों के संख्यात्मक Synology उपयोगकर्ता ID को `allowedUserIds` में जोड़कर उन्हें स्वीकृति दें।
- `allowedUserIds` Synology उपयोगकर्ता ID की सूची (या अल्पविराम से अलग की गई स्ट्रिंग) स्वीकार करता है।
- `allowlist` मोड में, खाली `allowedUserIds` सूची को गलत कॉन्फ़िगरेशन माना जाता है और Webhook रूट आरंभ नहीं होगा।
- `dmPolicy: "open"` सार्वजनिक DM की अनुमति केवल तब देता है जब `allowedUserIds` में `"*"` शामिल हो; प्रतिबंधात्मक प्रविष्टियों के साथ केवल मेल खाने वाले उपयोगकर्ता चैट कर सकते हैं। खाली `allowedUserIds` सूची के साथ `open` भी रूट आरंभ करने से इनकार करता है।
- `dmPolicy: "disabled"` DM को अवरुद्ध करता है।
- उत्तर प्राप्तकर्ता बाइंडिंग डिफ़ॉल्ट रूप से स्थिर संख्यात्मक `user_id` पर बनी रहती है। `channels.synology-chat.dangerouslyAllowNameMatching: true` आपातकालीन संगतता मोड है, जो उत्तर डिलीवरी के लिए परिवर्तनशील उपयोगकर्ता नाम/उपनाम लुकअप को पुनः सक्षम करता है।

## आउटबाउंड डिलीवरी

लक्ष्य के रूप में संख्यात्मक Synology Chat उपयोगकर्ता ID का उपयोग करें। `synology-chat:`, `synology_chat:`, और `synology:` उपसर्ग स्वीकार किए जाते हैं।

उदाहरण:

```bash
openclaw message send --channel synology-chat --target 123456 --message "OpenClaw से नमस्ते"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "फिर से नमस्ते"
openclaw message send --channel synology-chat --target synology:123456 --message "संक्षिप्त उपसर्ग"
```

आउटबाउंड टेक्स्ट को 2000 वर्णों पर खंडित किया जाता है। URL-आधारित फ़ाइल डिलीवरी द्वारा मीडिया प्रेषण समर्थित है: NAS फ़ाइल डाउनलोड करके संलग्न करता है (अधिकतम 32 MB)। आउटबाउंड फ़ाइल URL में `http` या `https` का उपयोग होना चाहिए, और OpenClaw द्वारा URL को NAS Webhook पर अग्रेषित करने से पहले निजी या अन्यथा अवरुद्ध नेटवर्क लक्ष्यों को अस्वीकार कर दिया जाता है।

## एकाधिक खाते

`channels.synology-chat.accounts` के अंतर्गत एकाधिक Synology Chat खाते समर्थित हैं।
प्रत्येक खाता टोकन, इनकमिंग URL, Webhook पथ, DM नीति और सीमाओं को ओवरराइड कर सकता है।
सीधे-संदेश सत्र प्रत्येक खाते और उपयोगकर्ता के अनुसार अलग रहते हैं, इसलिए दो अलग Synology खातों पर समान संख्यात्मक `user_id`
ट्रांसक्रिप्ट स्थिति साझा नहीं करता।
प्रत्येक सक्षम खाते को एक अलग `webhookPath` दें। OpenClaw हूबहू डुप्लिकेट पथों को अस्वीकार करता है
और एकाधिक-खाता सेटअप में केवल साझा Webhook पथ विरासत में लेने वाले नामित खातों को आरंभ करने से इनकार करता है।
यदि किसी नामित खाते के लिए जानबूझकर विरासती इनहेरिटेंस आवश्यक है, तो उस खाते पर
`dangerouslyAllowInheritedWebhookPath: true` या `channels.synology-chat` पर सेट करें,
लेकिन हूबहू डुप्लिकेट पथ फिर भी सुरक्षित रूप से अस्वीकार किए जाते हैं। प्रत्येक खाते के लिए स्पष्ट पथों को प्राथमिकता दें।

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

## सुरक्षा संबंधी टिप्पणियाँ

- `token` को गुप्त रखें और लीक होने पर उसे बदलें।
- जब तक आप स्पष्ट रूप से किसी स्व-हस्ताक्षरित स्थानीय NAS प्रमाणपत्र पर भरोसा न करते हों, `allowInsecureSsl: false` बनाए रखें।
- इनबाउंड Webhook अनुरोधों का टोकन सत्यापित किया जाता है और प्रत्येक प्रेषक के लिए दर सीमित की जाती है (`rateLimitPerMinute`, डिफ़ॉल्ट 30)।
- अमान्य टोकन जाँच नियत-समय गुप्त तुलना का उपयोग करती है और सुरक्षित रूप से विफल होती है; बार-बार अमान्य टोकन के प्रयास स्रोत IP को अस्थायी रूप से लॉक कर देते हैं।
- इनबाउंड संदेश टेक्स्ट को ज्ञात प्रॉम्प्ट-इंजेक्शन पैटर्न से सुरक्षित किया जाता है और 4000 वर्णों पर काट दिया जाता है।
- उत्पादन के लिए `dmPolicy: "allowlist"` को प्राथमिकता दें।
- जब तक आपको स्पष्ट रूप से विरासती उपयोगकर्ता-नाम-आधारित उत्तर डिलीवरी की आवश्यकता न हो, `dangerouslyAllowNameMatching` को बंद रखें।
- जब तक आप एकाधिक-खाता सेटअप में साझा-पथ रूटिंग जोखिम को स्पष्ट रूप से स्वीकार न करें, `dangerouslyAllowInheritedWebhookPath` को बंद रखें।

## समस्या निवारण

- `Missing required fields (token, user_id, text)`:
  - आउटगोइंग Webhook पेलोड में आवश्यक फ़ील्ड में से कोई एक अनुपस्थित है
  - यदि Synology टोकन को हेडर में भेजता है, तो सुनिश्चित करें कि Gateway/प्रॉक्सी उन हेडर को बनाए रखता है
- `Invalid token`:
  - आउटगोइंग Webhook का गुप्त मान `channels.synology-chat.token` से मेल नहीं खाता
  - अनुरोध गलत खाते/Webhook पथ पर पहुँच रहा है
  - अनुरोध के OpenClaw तक पहुँचने से पहले किसी रिवर्स प्रॉक्सी ने टोकन हेडर हटा दिया
- `Rate limit exceeded`:
  - एक ही स्रोत से बहुत अधिक अमान्य टोकन प्रयास उस स्रोत को अस्थायी रूप से लॉक कर सकते हैं
  - प्रमाणित प्रेषकों के लिए भी प्रत्येक उपयोगकर्ता पर अलग संदेश दर सीमा होती है
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` सक्षम है, लेकिन कोई उपयोगकर्ता कॉन्फ़िगर नहीं किया गया है
- `User not authorized`:
  - प्रेषक का संख्यात्मक `user_id`, `allowedUserIds` में नहीं है

## संबंधित

- [चैनल अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और उल्लेख गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) — अभिगम मॉडल और सुदृढ़ीकरण
