---
read_when:
    - आप OpenClaw को LINE से कनेक्ट करना चाहते हैं
    - आपको LINE Webhook और क्रेडेंशियल सेटअप की आवश्यकता है
    - आपको LINE-विशिष्ट संदेश विकल्प चाहिए
summary: LINE Messaging API Plugin का सेटअप, कॉन्फ़िगरेशन और उपयोग
title: LINE
x-i18n:
    generated_at: "2026-07-19T08:50:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aa160970278e0899637307136139f7d2fc83bf57defc30771d77649060f77274
    source_path: channels/line.md
    workflow: 16
---

LINE, LINE Messaging API के माध्यम से OpenClaw से जुड़ता है। Plugin, Gateway पर Webhook
रिसीवर के रूप में चलता है और प्रमाणीकरण के लिए आपके चैनल एक्सेस टोकन + चैनल सीक्रेट का
उपयोग करता है।

स्थिति: आधिकारिक Plugin, अलग से इंस्टॉल किया जाता है। डायरेक्ट मैसेज, ग्रुप चैट, मीडिया,
स्थान, Flex मैसेज, टेम्पलेट मैसेज और क्विक रिप्लाई समर्थित हैं।
रिएक्शन और थ्रेड समर्थित नहीं हैं।

## इंस्टॉल करें

चैनल कॉन्फ़िगर करने से पहले LINE इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/line
```

लोकल चेकआउट (git रिपॉज़िटरी से चलाते समय):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## सेटअप

1. LINE Developers खाता बनाएँ और Console खोलें:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. एक Provider बनाएँ (या चुनें) और एक **Messaging API** चैनल जोड़ें।
3. चैनल सेटिंग से **Channel access token** और **Channel secret** कॉपी करें।
4. Messaging API सेटिंग में **Use webhook** सक्षम करें।
5. Webhook URL को अपने Gateway एंडपॉइंट पर सेट करें (HTTPS आवश्यक है):

```text
https://gateway-host/line/webhook
```

Gateway, LINE के Webhook सत्यापन (GET) का उत्तर देता है। हस्ताक्षरित इनबाउंड इवेंट
(POST) के लिए, यह `200` लौटाने से पहले प्रत्येक इवेंट को टिकाऊ इनग्रेस कतार में लिखता है;
एजेंट प्रोसेसिंग अतुल्यकालिक रूप से जारी रहती है। विफल डिलीवरी का कतार से पुनः प्रयास किया जाता है,
जिसमें Gateway के पुनरारंभ के बाद का समय भी शामिल है, और सीमित पुनः प्रयासों के बाद दूषित इवेंट
विफल कतार रिकॉर्ड बन जाते हैं। यदि टिकाऊ संग्रहण विफल होता है, तो अनुरोध किसी ऐसे इवेंट की
पावती देने के बजाय `500` लौटाता है जो खो सकता है।
कतार-से-एजेंट सीमा पर डिलीवरी कम-से-कम एक बार होती है: सक्रिय डिलीवरी के दौरान Gateway के बंद
होने या क्रैश होने से टर्न दोबारा चल सकता है। मैसेज इवेंट LINE मैसेज ID के आधार पर डुप्लिकेट हटाते हैं;
अन्य इवेंट प्रकार `webhookEventId` का उपयोग करते हैं। सुरक्षित रखे गए पूर्णता रिकॉर्ड
सामान्य डुप्लिकेट Webhook को रोकते हैं, लेकिन बाहरी साइड इफ़ेक्ट करने वाले हैंडलर
फिर भी आइडेम्पोटेंट होने चाहिए।
यदि आपको कस्टम पथ चाहिए, तो `channels.line.webhookPath` या
`channels.line.accounts.<id>.webhookPath` सेट करें और URL को उसी के अनुसार अपडेट करें।

सुरक्षा संबंधी टिप्पणियाँ:

- LINE हस्ताक्षर सत्यापन बॉडी पर निर्भर करता है (रॉ बॉडी पर HMAC), इसलिए OpenClaw सत्यापन से पहले सख्त प्री-ऑथ बॉडी सीमा (64 KB) और रीड टाइमआउट लागू करता है।
- OpenClaw सत्यापित रॉ अनुरोध बाइट्स से Webhook इवेंट प्रोसेस करता है। हस्ताक्षर-अखंडता सुरक्षा के लिए अपस्ट्रीम मिडलवेयर द्वारा बदले गए `req.body` मान अनदेखे किए जाते हैं।

## कॉन्फ़िगर करें

न्यूनतम कॉन्फ़िगरेशन:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

सार्वजनिक DM कॉन्फ़िगरेशन:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

पर्यावरण चर (केवल डिफ़ॉल्ट खाता):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

टोकन/सीक्रेट फ़ाइलें:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` और `secretFile` को नियमित फ़ाइलों की ओर संकेत करना चाहिए। सिमलिंक अस्वीकार किए जाते हैं।
इनलाइन कॉन्फ़िगरेशन मान फ़ाइलों पर प्राथमिकता लेते हैं; डिफ़ॉल्ट खाते के लिए पर्यावरण चर अंतिम फ़ॉलबैक हैं।

एकाधिक खाते:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## एक्सेस नियंत्रण

डायरेक्ट मैसेज डिफ़ॉल्ट रूप से पेयरिंग का उपयोग करते हैं। अज्ञात प्रेषकों को पेयरिंग कोड मिलता है और स्वीकृति मिलने तक
उनके मैसेज अनदेखे किए जाते हैं:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

अनुमति-सूचियाँ और नीतियाँ:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट `pairing`)
- `channels.line.allowFrom`: DM के लिए अनुमति-सूचीबद्ध LINE उपयोगकर्ता ID; `dmPolicy: "open"` के लिए `["*"]` आवश्यक है
- `channels.line.groupPolicy`: `allowlist | open | disabled` (डिफ़ॉल्ट `allowlist`)
- `channels.line.groupAllowFrom`: ग्रुप के लिए अनुमति-सूचीबद्ध LINE उपयोगकर्ता ID; DM की `allowFrom` प्रविष्टियाँ ग्रुप प्रेषकों को अनुमति नहीं देतीं
- प्रति-ग्रुप ओवरराइड: `channels.line.groups.<groupId>.allowFrom` (साथ में `enabled`, `requireMention`, `systemPrompt`, `skills`)। `groupPolicy: "allowlist"` के साथ,
  `groupAllowFrom` या प्रति-ग्रुप `allowFrom` सेट करें; खाली ग्रुप अनुमति-सूची, DM खुले होने पर भी ग्रुप मैसेज को ब्लॉक करती है।
- स्थिर प्रेषक एक्सेस ग्रुप को `allowFrom`, `groupAllowFrom` और प्रति-ग्रुप `allowFrom` से `accessGroup:<name>` के साथ संदर्भित किया जा सकता है; [एक्सेस ग्रुप](/hi/channels/access-groups) देखें।
- रनटाइम टिप्पणी: यदि `channels.line` पूरी तरह अनुपस्थित है, तो रनटाइम ग्रुप जाँच के लिए `groupPolicy="allowlist"` पर फ़ॉलबैक करता है (`channels.defaults.groupPolicy` सेट होने पर भी)।

LINE ID केस-सेंसिटिव हैं। मान्य ID इस प्रकार दिखाई देती हैं:

- उपयोगकर्ता: `U` + 32 हेक्स वर्ण
- ग्रुप: `C` + 32 हेक्स वर्ण
- रूम: `R` + 32 हेक्स वर्ण

## मैसेज व्यवहार

- टेक्स्ट को 5000 वर्णों के खंडों में बाँटा जाता है।
- Markdown फ़ॉर्मैटिंग हटा दी जाती है; जहाँ संभव हो, कोड ब्लॉक और टेबल को Flex
  कार्ड में बदला जाता है।
- स्ट्रीमिंग प्रतिक्रियाएँ बफ़र की जाती हैं; एजेंट के काम करते समय LINE को लोडिंग
  ऐनिमेशन के साथ पूरे खंड मिलते हैं।
- मीडिया डाउनलोड `channels.line.mediaMaxMb` तक सीमित हैं (डिफ़ॉल्ट 10)।
- इनबाउंड मीडिया को एजेंट तक भेजने से पहले `~/.openclaw/media/inbound/` के अंतर्गत सहेजा जाता है,
  जो अन्य चैनल Plugin द्वारा उपयोग किए जाने वाले साझा मीडिया स्टोर के अनुरूप है।

## चैनल डेटा (रिच मैसेज)

क्विक रिप्लाई, स्थान, Flex कार्ड या टेम्पलेट मैसेज भेजने के लिए `channelData.line` का उपयोग करें।

```json5
{
  text: "यह रहा",
  channelData: {
    line: {
      quickReplies: ["स्थिति", "सहायता"],
      location: {
        title: "कार्यालय",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "स्थिति कार्ड",
        contents: {/* Flex पेलोड */},
      },
      templateMessage: {
        type: "confirm",
        text: "आगे बढ़ें?",
        confirmLabel: "हाँ",
        confirmData: "yes",
        cancelLabel: "नहीं",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin, Flex मैसेज प्रीसेट के लिए एक `/card` कमांड भी प्रदान करता है:

```text
/card info "स्वागत है" "शामिल होने के लिए धन्यवाद!"
```

## ACP समर्थन

LINE, ACP (एजेंट संचार प्रोटोकॉल) वार्तालाप बाइंडिंग का समर्थन करता है:

- `/acp spawn <agent> --bind here` चाइल्ड थ्रेड बनाए बिना वर्तमान LINE चैट को ACP सेशन से बाँधता है।
- कॉन्फ़िगर की गई ACP बाइंडिंग और सक्रिय वार्तालाप-बद्ध ACP सेशन, LINE पर अन्य वार्तालाप चैनलों की तरह काम करते हैं।

विवरण के लिए [ACP एजेंट](/hi/tools/acp-agents) देखें।

## आउटबाउंड मीडिया

LINE Plugin, एजेंट मैसेज टूल के माध्यम से इमेज, वीडियो और ऑडियो भेजता है:

- **इमेज**: LINE इमेज मैसेज के रूप में भेजी जाती हैं; प्रीव्यू इमेज डिफ़ॉल्ट रूप से मीडिया URL होती है।
- **वीडियो**: प्रीव्यू इमेज आवश्यक है; `channelData.line.previewImageUrl` को किसी इमेज URL पर सेट करें।
- **ऑडियो**: LINE ऑडियो मैसेज के रूप में भेजा जाता है; यदि `channelData.line.durationMs` सेट न हो, तो अवधि डिफ़ॉल्ट रूप से 60 सेकंड होती है।

सेट होने पर मीडिया प्रकार `channelData.line.mediaKind` से लिया जाता है, अन्यथा इसे
अन्य LINE विकल्पों या URL फ़ाइल प्रत्यय से अनुमानित किया जाता है, और इमेज फ़ॉलबैक होती है।

आउटबाउंड मीडिया URL सार्वजनिक HTTPS URL होने चाहिए जिनकी लंबाई अधिकतम 2000 वर्ण हो। OpenClaw
URL को LINE को सौंपने से पहले लक्ष्य होस्टनेम सत्यापित करता है और लूपबैक,
लिंक-लोकल तथा निजी-नेटवर्क लक्ष्यों को अस्वीकार करता है।

LINE-विशिष्ट विकल्पों के बिना सामान्य मीडिया प्रेषण इमेज रूट का उपयोग करता है।

## समस्या निवारण

- **Webhook सत्यापन विफल होता है:** सुनिश्चित करें कि Webhook URL HTTPS है और
  `channelSecret`, LINE Console से मेल खाता है।
- **कोई इनबाउंड इवेंट नहीं:** पुष्टि करें कि Webhook पथ `channels.line.webhookPath` से मेल खाता है
  और Gateway तक LINE की पहुँच है।
- **मीडिया डाउनलोड त्रुटियाँ:** यदि मीडिया डिफ़ॉल्ट सीमा से अधिक है, तो `channels.line.mediaMaxMb` बढ़ाएँ।

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग प्रवाह
- [ग्रुप](/hi/channels/groups) — ग्रुप चैट व्यवहार और उल्लेख नियंत्रण
- [चैनल रूटिंग](/hi/channels/channel-routing) — मैसेज के लिए सेशन रूटिंग
- [सुरक्षा](/hi/gateway/security) — एक्सेस मॉडल और सुदृढ़ीकरण
