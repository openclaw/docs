---
read_when:
    - आप OpenClaw को LINE से कनेक्ट करना चाहते हैं
    - आपको LINE Webhook और क्रेडेंशियल सेटअप की आवश्यकता है
    - आप LINE-विशिष्ट संदेश विकल्प चाहते हैं
summary: LINE Messaging API Plugin का सेटअप, कॉन्फ़िगरेशन और उपयोग
title: LINE
x-i18n:
    generated_at: "2026-07-16T13:19:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31004467bc227b3a4e18168d1aa8b7f60d59e58994aeb890ac257beb2dbe8449
    source_path: channels/line.md
    workflow: 16
---

LINE, LINE Messaging API के माध्यम से OpenClaw से जुड़ता है। Plugin, Gateway पर Webhook
रिसीवर के रूप में चलता है और प्रमाणीकरण के लिए आपके चैनल ऐक्सेस टोकन + चैनल सीक्रेट का
उपयोग करता है।

स्थिति: आधिकारिक Plugin, अलग से इंस्टॉल किया जाता है। सीधे संदेश, समूह चैट, मीडिया,
स्थान, Flex संदेश, टेम्पलेट संदेश और त्वरित उत्तर समर्थित हैं।
प्रतिक्रियाएँ और थ्रेड समर्थित नहीं हैं।

## इंस्टॉल करें

चैनल कॉन्फ़िगर करने से पहले LINE इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/line
```

स्थानीय चेकआउट (git रेपो से चलाते समय):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## सेटअप

1. LINE Developers खाता बनाएँ और Console खोलें:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. एक Provider बनाएँ (या चुनें) और **Messaging API** चैनल जोड़ें।
3. चैनल सेटिंग्स से **Channel access token** और **Channel secret** कॉपी करें।
4. Messaging API सेटिंग्स में **Use webhook** सक्षम करें।
5. Webhook URL को अपने Gateway एंडपॉइंट पर सेट करें (HTTPS आवश्यक है):

```text
https://gateway-host/line/webhook
```

Gateway, LINE के Webhook सत्यापन (GET) का उत्तर देता है और हस्ताक्षर तथा पेलोड
सत्यापन के तुरंत बाद हस्ताक्षरित इनबाउंड इवेंट (POST) की अभिस्वीकृति देता है; एजेंट
प्रोसेसिंग अतुल्यकालिक रूप से जारी रहती है।
यदि कस्टम पथ चाहिए, तो `channels.line.webhookPath` या
`channels.line.accounts.<id>.webhookPath` सेट करें और URL को उसी के अनुसार अपडेट करें।

सुरक्षा संबंधी टिप्पणियाँ:

- LINE हस्ताक्षर सत्यापन बॉडी पर निर्भर है (रॉ बॉडी पर HMAC), इसलिए OpenClaw सत्यापन से पहले प्रमाणीकरण-पूर्व बॉडी की सख़्त सीमा (64 KB) और पढ़ने की समय-सीमा लागू करता है।
- OpenClaw सत्यापित रॉ अनुरोध बाइट्स से Webhook इवेंट प्रोसेस करता है। हस्ताक्षर की अखंडता सुरक्षित रखने के लिए अपस्ट्रीम मिडलवेयर द्वारा रूपांतरित `req.body` मानों को अनदेखा किया जाता है।

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

परिवेश चर (केवल डिफ़ॉल्ट खाते के लिए):

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

`tokenFile` और `secretFile` को सामान्य फ़ाइलों की ओर संकेत करना आवश्यक है। सिमलिंक अस्वीकार किए जाते हैं।
इनलाइन कॉन्फ़िगरेशन मान फ़ाइलों पर प्राथमिकता रखते हैं; डिफ़ॉल्ट खाते के लिए परिवेश चर अंतिम फ़ॉलबैक हैं।

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

## पहुँच नियंत्रण

सीधे संदेशों के लिए डिफ़ॉल्ट रूप से पेयरिंग उपयोग होती है। अज्ञात प्रेषकों को एक पेयरिंग कोड मिलता है और स्वीकृति मिलने तक उनके
संदेशों को अनदेखा किया जाता है:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

अनुमति-सूचियाँ और नीतियाँ:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (डिफ़ॉल्ट `pairing`)
- `channels.line.allowFrom`: DM के लिए अनुमति-सूचीबद्ध LINE उपयोगकर्ता ID; `dmPolicy: "open"` के लिए `["*"]` आवश्यक है
- `channels.line.groupPolicy`: `allowlist | open | disabled` (डिफ़ॉल्ट `allowlist`)
- `channels.line.groupAllowFrom`: समूहों के लिए अनुमति-सूचीबद्ध LINE उपयोगकर्ता ID; DM की `allowFrom` प्रविष्टियाँ समूह प्रेषकों को अनुमति नहीं देतीं
- प्रति-समूह ओवरराइड: `channels.line.groups.<groupId>.allowFrom` (साथ में `enabled`, `requireMention`, `systemPrompt`, `skills`)। जब
  `groupPolicy: "allowlist"` हो, तो `groupAllowFrom` या प्रति-समूह `allowFrom` सेट करें; रिक्त समूह अनुमति-सूची, DM खुले होने पर भी समूह संदेशों को अवरुद्ध करती है।
- स्थिर प्रेषक पहुँच समूहों को `allowFrom`, `groupAllowFrom` और प्रति-समूह `allowFrom` से `accessGroup:<name>` द्वारा संदर्भित किया जा सकता है; [पहुँच समूह](/hi/channels/access-groups) देखें।
- रनटाइम टिप्पणी: यदि `channels.line` पूरी तरह अनुपस्थित है, तो रनटाइम समूह जाँच के लिए `groupPolicy="allowlist"` पर फ़ॉलबैक करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

LINE ID केस-संवेदी हैं। मान्य ID इस प्रकार दिखाई देती हैं:

- उपयोगकर्ता: `U` + 32 हेक्स वर्ण
- समूह: `C` + 32 हेक्स वर्ण
- रूम: `R` + 32 हेक्स वर्ण

## संदेश व्यवहार

- टेक्स्ट को 5000 वर्णों के खंडों में बाँटा जाता है।
- Markdown फ़ॉर्मैटिंग हटा दी जाती है; जहाँ संभव हो, कोड ब्लॉक और तालिकाओं को Flex
  कार्ड में बदला जाता है।
- स्ट्रीमिंग प्रतिक्रियाएँ बफ़र की जाती हैं; एजेंट के काम करते समय LINE को लोडिंग
  ऐनिमेशन के साथ पूर्ण खंड मिलते हैं।
- मीडिया डाउनलोड की सीमा `channels.line.mediaMaxMb` (डिफ़ॉल्ट 10) द्वारा निर्धारित होती है।
- इनबाउंड मीडिया को एजेंट को भेजे जाने से पहले `~/.openclaw/media/inbound/` के अंतर्गत सहेजा जाता है,
  जो अन्य चैनल Plugin द्वारा उपयोग किए जाने वाले साझा मीडिया स्टोर के अनुरूप है।

## चैनल डेटा (समृद्ध संदेश)

त्वरित उत्तर, स्थान, Flex कार्ड या टेम्पलेट
संदेश भेजने के लिए `channelData.line` का उपयोग करें।

```json5
{
  text: "यह लीजिए",
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

LINE Plugin में Flex संदेश प्रीसेट के लिए `/card` कमांड भी शामिल है:

```text
/card info "स्वागत है" "जुड़ने के लिए धन्यवाद!"
```

## ACP समर्थन

LINE, ACP (एजेंट संचार प्रोटोकॉल) वार्तालाप बाइंडिंग का समर्थन करता है:

- `/acp spawn <agent> --bind here` किसी चाइल्ड थ्रेड को बनाए बिना वर्तमान LINE चैट को ACP सत्र से बाँधता है।
- कॉन्फ़िगर की गई ACP बाइंडिंग और सक्रिय वार्तालाप-बद्ध ACP सत्र, LINE पर अन्य वार्तालाप चैनलों की तरह काम करते हैं।

विवरण के लिए [ACP एजेंट](/hi/tools/acp-agents) देखें।

## आउटबाउंड मीडिया

LINE Plugin, एजेंट संदेश टूल के माध्यम से चित्र, वीडियो और ऑडियो भेजता है:

- **चित्र**: LINE चित्र संदेशों के रूप में भेजे जाते हैं; पूर्वावलोकन चित्र डिफ़ॉल्ट रूप से मीडिया URL होता है।
- **वीडियो**: पूर्वावलोकन चित्र आवश्यक है; `channelData.line.previewImageUrl` को किसी चित्र URL पर सेट करें।
- **ऑडियो**: LINE ऑडियो संदेशों के रूप में भेजे जाते हैं; यदि `channelData.line.durationMs` सेट न हो, तो अवधि डिफ़ॉल्ट रूप से 60 सेकंड होती है।

सेट होने पर मीडिया का प्रकार `channelData.line.mediaKind` से लिया जाता है, अन्यथा अन्य LINE विकल्पों
या URL फ़ाइल प्रत्यय से अनुमान लगाया जाता है और फ़ॉलबैक के रूप में चित्र का उपयोग होता है।

आउटबाउंड मीडिया URL सार्वजनिक HTTPS URL होने चाहिए और अधिकतम 2000 वर्णों के हो सकते हैं। OpenClaw
URL को LINE को सौंपने से पहले लक्ष्य होस्टनाम को सत्यापित करता है और लूपबैक,
लिंक-लोकल तथा निजी-नेटवर्क लक्ष्यों को अस्वीकार करता है।

LINE-विशिष्ट विकल्पों के बिना सामान्य मीडिया प्रेषण चित्र मार्ग का उपयोग करता है।

## समस्या निवारण

- **Webhook सत्यापन विफल होता है:** सुनिश्चित करें कि Webhook URL HTTPS है और
  `channelSecret`, LINE Console से मेल खाता है।
- **कोई इनबाउंड इवेंट नहीं:** पुष्टि करें कि Webhook पथ `channels.line.webhookPath` से मेल खाता है
  और Gateway, LINE से पहुँच योग्य है।
- **मीडिया डाउनलोड त्रुटियाँ:** यदि मीडिया डिफ़ॉल्ट सीमा से अधिक है, तो `channels.line.mediaMaxMb`
  बढ़ाएँ।

## संबंधित

- [चैनलों का अवलोकन](/hi/channels) — सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) — DM प्रमाणीकरण और पेयरिंग प्रवाह
- [समूह](/hi/channels/groups) — समूह चैट व्यवहार और उल्लेख नियंत्रण
- [चैनल रूटिंग](/hi/channels/channel-routing) — संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) — पहुँच मॉडल और सुदृढ़ीकरण
