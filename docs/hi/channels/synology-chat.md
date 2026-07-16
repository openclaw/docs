---
read_when:
    - OpenClaw के साथ Synology Chat सेट अप करना
    - Synology Chat Webhook रूटिंग की डीबगिंग
summary: Synology Chat Webhook सेटअप और OpenClaw कॉन्फ़िगरेशन
title: Synology Chat
x-i18n:
    generated_at: "2026-07-16T13:35:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat एक Webhook जोड़ी के माध्यम से OpenClaw से जुड़ता है: एक Synology Chat आउटगोइंग Webhook आने वाले डायरेक्ट मैसेज Gateway पर पोस्ट करता है, और जवाब Synology Chat इनकमिंग Webhook के माध्यम से वापस जाते हैं।

स्थिति: आधिकारिक Plugin, अलग से इंस्टॉल किया जाता है। केवल डायरेक्ट मैसेज; टेक्स्ट और URL-आधारित फ़ाइल भेजना समर्थित है।

## इंस्टॉल करें

```bash
openclaw plugins install @openclaw/synology-chat
```

स्थानीय चेकआउट (git रेपो से चलाते समय):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

विवरण: [Plugins](/hi/tools/plugin)

## त्वरित सेटअप

1. Plugin इंस्टॉल करें (ऊपर)।
2. Synology Chat इंटीग्रेशन में:
   - एक इनकमिंग Webhook बनाएँ और उसका URL कॉपी करें।
   - अपने सीक्रेट टोकन के साथ एक आउटगोइंग Webhook बनाएँ।
3. आउटगोइंग Webhook URL को अपने OpenClaw Gateway की ओर इंगित करें:
   - `https://gateway-host/webhook/synology` डिफ़ॉल्ट रूप से।
   - या आपका कस्टम `channels.synology-chat.webhookPath`।
4. OpenClaw में सेटअप पूरा करें। दोनों प्रवाहों में Synology Chat समान चैनल सेटअप सूची में दिखाई देता है:
   - निर्देशित: `openclaw onboard` या `openclaw channels add`
   - प्रत्यक्ष: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway पुनः आरंभ करें और Synology Chat बॉट को एक DM भेजें।

Webhook प्रमाणीकरण विवरण:

- OpenClaw आउटगोइंग Webhook टोकन पहले `body.token`, फिर
  `?token=...`, और फिर हेडर से स्वीकार करता है।
- स्वीकृत हेडर प्रारूप:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- खाली या अनुपस्थित टोकन बंद अवस्था में विफल होते हैं।
- पेलोड `application/x-www-form-urlencoded` या `application/json` हो सकते हैं; `token`, `user_id`, और `text` आवश्यक हैं।

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

## एनवायरनमेंट वेरिएबल

डिफ़ॉल्ट अकाउंट के लिए, आप एनवायरनमेंट वेरिएबल का उपयोग कर सकते हैं:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (कॉमा से अलग किए गए)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

कॉन्फ़िगरेशन मान एनवायरनमेंट वेरिएबल को ओवरराइड करते हैं।

`SYNOLOGY_CHAT_INCOMING_URL` और `SYNOLOGY_NAS_HOST` को वर्कस्पेस `.env` से सेट नहीं किया जा सकता; [वर्कस्पेस `.env` फ़ाइलें](/hi/gateway/security#workspace-env-files) देखें।

## DM नीति और एक्सेस नियंत्रण

- समर्थित `dmPolicy` मान: `allowlist` (डिफ़ॉल्ट), `open`, और `disabled`। Synology Chat में पेयरिंग प्रवाह नहीं है; प्रेषकों को स्वीकृति देने के लिए उनके संख्यात्मक Synology यूज़र ID को `allowedUserIds` में जोड़ें।
- `allowedUserIds` Synology यूज़र ID की सूची (या कॉमा से अलग की गई स्ट्रिंग) स्वीकार करता है।
- `allowlist` मोड में, खाली `allowedUserIds` सूची को गलत कॉन्फ़िगरेशन माना जाता है और Webhook रूट शुरू नहीं होगा।
- `dmPolicy: "open"` सार्वजनिक DM की अनुमति केवल तभी देता है जब `allowedUserIds` में `"*"` शामिल हो; प्रतिबंधात्मक प्रविष्टियों के साथ केवल मेल खाने वाले यूज़र चैट कर सकते हैं। खाली `allowedUserIds` सूची के साथ `open` भी रूट शुरू करने से मना करता है।
- `dmPolicy: "disabled"` DM को ब्लॉक करता है।
- जवाब के प्राप्तकर्ता की बाइंडिंग डिफ़ॉल्ट रूप से स्थिर संख्यात्मक `user_id` पर बनी रहती है। `channels.synology-chat.dangerouslyAllowNameMatching: true` आपातकालीन संगतता मोड है, जो जवाब डिलीवरी के लिए परिवर्तनशील यूज़रनेम/निकनेम लुकअप को फिर से सक्षम करता है।

## आउटबाउंड डिलीवरी

लक्ष्य के रूप में संख्यात्मक Synology Chat यूज़र ID का उपयोग करें। `synology-chat:`, `synology_chat:`, और `synology:` प्रीफ़िक्स स्वीकार किए जाते हैं।

उदाहरण:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

आउटबाउंड टेक्स्ट को 2000 वर्णों पर खंडित किया जाता है। URL-आधारित फ़ाइल डिलीवरी के माध्यम से मीडिया भेजना समर्थित है: NAS फ़ाइल डाउनलोड करके संलग्न करता है (अधिकतम 32 MB)। आउटबाउंड फ़ाइल URL में `http` या `https` का उपयोग होना आवश्यक है, और OpenClaw द्वारा URL को NAS Webhook पर अग्रेषित करने से पहले निजी या अन्यथा ब्लॉक किए गए नेटवर्क लक्ष्यों को अस्वीकार कर दिया जाता है।

## एकाधिक अकाउंट

`channels.synology-chat.accounts` के अंतर्गत एकाधिक Synology Chat अकाउंट समर्थित हैं।
प्रत्येक अकाउंट टोकन, इनकमिंग URL, Webhook पथ, DM नीति और सीमाओं को ओवरराइड कर सकता है।
डायरेक्ट-मैसेज सेशन प्रत्येक अकाउंट और यूज़र के अनुसार अलग रखे जाते हैं, इसलिए दो अलग-अलग Synology अकाउंट पर समान संख्यात्मक `user_id`
ट्रांसक्रिप्ट स्थिति साझा नहीं करता।
प्रत्येक सक्षम अकाउंट को एक विशिष्ट `webhookPath` दें। OpenClaw समान सटीक पथों को अस्वीकार करता है
और एकाधिक-अकाउंट सेटअप में केवल साझा Webhook पथ इनहेरिट करने वाले नामित अकाउंट को शुरू करने से मना करता है।
यदि आपको किसी नामित अकाउंट के लिए जानबूझकर विरासती इनहेरिटेंस चाहिए, तो उस अकाउंट पर या `channels.synology-chat` पर
`dangerouslyAllowInheritedWebhookPath: true` सेट करें,
लेकिन समान सटीक पथ फिर भी बंद अवस्था में अस्वीकार किए जाते हैं। प्रत्येक अकाउंट के लिए स्पष्ट पथ को प्राथमिकता दें।

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

- `token` को गोपनीय रखें और लीक होने पर उसे बदलें।
- जब तक आप किसी स्व-हस्ताक्षरित स्थानीय NAS प्रमाणपत्र पर स्पष्ट रूप से भरोसा नहीं करते, `allowInsecureSsl: false` बनाए रखें।
- इनबाउंड Webhook अनुरोधों के टोकन सत्यापित किए जाते हैं और प्रत्येक प्रेषक के अनुसार दर सीमित की जाती है (`rateLimitPerMinute`, डिफ़ॉल्ट 30)।
- अमान्य टोकन जाँच निरंतर-समय सीक्रेट तुलना का उपयोग करती है और बंद अवस्था में विफल होती है; बार-बार अमान्य टोकन प्रयास स्रोत IP को अस्थायी रूप से लॉक कर देते हैं।
- इनबाउंड मैसेज टेक्स्ट को ज्ञात प्रॉम्प्ट-इंजेक्शन पैटर्न से सुरक्षित करने के लिए स्वच्छ किया जाता है और 4000 वर्णों पर छोटा कर दिया जाता है।
- प्रोडक्शन के लिए `dmPolicy: "allowlist"` को प्राथमिकता दें।
- जब तक आपको स्पष्ट रूप से विरासती यूज़रनेम-आधारित जवाब डिलीवरी की आवश्यकता न हो, `dangerouslyAllowNameMatching` को बंद रखें।
- जब तक आप एकाधिक-अकाउंट सेटअप में साझा-पथ रूटिंग जोखिम को स्पष्ट रूप से स्वीकार न करें, `dangerouslyAllowInheritedWebhookPath` को बंद रखें।

## समस्या निवारण

- `Missing required fields (token, user_id, text)`:
  - आउटगोइंग Webhook पेलोड में आवश्यक फ़ील्ड में से कोई एक अनुपस्थित है
  - यदि Synology टोकन को हेडर में भेजता है, तो सुनिश्चित करें कि Gateway/प्रॉक्सी उन हेडर को सुरक्षित रखता है
- `Invalid token`:
  - आउटगोइंग Webhook सीक्रेट `channels.synology-chat.token` से मेल नहीं खाता
  - अनुरोध गलत अकाउंट/Webhook पथ पर पहुँच रहा है
  - OpenClaw तक अनुरोध पहुँचने से पहले रिवर्स प्रॉक्सी ने टोकन हेडर हटा दिया
- `Rate limit exceeded`:
  - एक ही स्रोत से बहुत अधिक अमान्य टोकन प्रयास उस स्रोत को अस्थायी रूप से लॉक कर सकते हैं
  - प्रमाणित प्रेषकों के लिए भी अलग प्रति-यूज़र मैसेज दर सीमा होती है
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` सक्षम है लेकिन कोई यूज़र कॉन्फ़िगर नहीं किया गया है
- `User not authorized`:
  - प्रेषक का संख्यात्मक `user_id`, `allowedUserIds` में नहीं है

## संबंधित

- [चैनल का अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और मेंशन गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) — मैसेज के लिए सेशन रूटिंग
- [सुरक्षा](/hi/gateway/security) — एक्सेस मॉडल और सुदृढ़ीकरण
