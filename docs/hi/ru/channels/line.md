---
read_when:
    - आप OpenClaw को LINE से जोड़ना चाहते हैं
    - आपको LINE Webhook और क्रेडेंशियल कॉन्फ़िगर करने होंगे
    - आपको LINE-विशिष्ट संदेश पैरामीटर चाहिए
summary: Plugin LINE Messaging API की सेटअप, कॉन्फ़िगरेशन और उपयोग
title: LINE
x-i18n:
    generated_at: "2026-06-29T00:11:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE, LINE Messaging API के माध्यम से OpenClaw से जुड़ता है। Plugin, gateway पर Webhook रिसीवर के रूप में
काम करता है और प्रमाणीकरण के लिए आपके channel access token + channel secret का उपयोग करता है।

स्थिति: लोड किया जा सकने वाला Plugin। निजी संदेश, समूह चैट, मीडिया, स्थान, Flex
messages, template messages और त्वरित उत्तर समर्थित हैं। प्रतिक्रियाएं और थ्रेड
समर्थित नहीं हैं।

## इंस्टॉलेशन

चैनल सेट करने से पहले LINE इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/line
```

स्थानीय वर्किंग कॉपी (git रिपॉजिटरी से चलाते समय):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## सेटअप

1. LINE Developers खाता बनाएं और Console खोलें:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Provider बनाएं (या चुनें) और **Messaging API** चैनल जोड़ें।
3. चैनल सेटिंग से **Channel access token** और **Channel secret** कॉपी करें।
4. Messaging API सेटिंग में **Use webhook** सक्षम करें।
5. अपने gateway endpoint के लिए Webhook URL सेट करें (HTTPS आवश्यक है):

```
https://gateway-host/line/webhook
```

Gateway, LINE की Webhook जांच (GET) का जवाब देता है और हस्ताक्षर व payload की जांच के तुरंत बाद
हस्ताक्षरित इनबाउंड events (POST) की पुष्टि करता है; एजेंट द्वारा प्रसंस्करण
असिंक्रोनस रूप से जारी रहता है।
यदि कस्टम पथ चाहिए, तो `channels.line.webhookPath` या
`channels.line.accounts.<id>.webhookPath` सेट करें और URL को उसी के अनुसार अपडेट करें।

सुरक्षा नोट:

- LINE हस्ताक्षर जांच request body पर निर्भर करती है (कच्चे body पर HMAC), इसलिए OpenClaw प्रमाणीकरण से पहले जांच के लिए सख्त body size सीमाएं और timeout लागू करता है।
- OpenClaw सत्यापित कच्चे request bytes से Webhook events संसाधित करता है। upstream middleware द्वारा बदले गए `req.body` values को हस्ताक्षर की अखंडता बनाए रखने के लिए अनदेखा किया जाता है।

## कॉन्फ़िगरेशन

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

खुले निजी संदेशों की कॉन्फ़िगरेशन:

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

टोकन/secret फ़ाइलें:

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

`tokenFile` और `secretFile` सामान्य फ़ाइलों की ओर संकेत करने चाहिए। symbolic links अस्वीकार किए जाते हैं।

कई खाते:

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

निजी संदेशों के लिए डिफ़ॉल्ट रूप से pairing आवश्यक है। अज्ञात प्रेषकों को pairing code मिलता है, और उनके
संदेश approval तक अनदेखे किए जाते हैं।

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

allow lists और policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: निजी संदेशों के लिए अनुमत LINE user IDs; `dmPolicy: "open"` के लिए `["*"]` आवश्यक है
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: समूहों के लिए अनुमत LINE user IDs
- अलग-अलग समूहों के लिए overrides: `channels.line.groups.<groupId>.allowFrom`
- static sender access groups को `allowFrom`, `groupAllowFrom` और group `allowFrom` से `accessGroup:<name>` के माध्यम से संदर्भित किया जा सकता है।
- runtime नोट: यदि `channels.line` पूरी तरह अनुपस्थित है, तो runtime group checks के लिए `groupPolicy="allowlist"` पर वापस जाता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

LINE IDs case-sensitive हैं। मान्य IDs ऐसे दिखते हैं:

- उपयोगकर्ता: `U` + 32 hexadecimal characters
- समूह: `C` + 32 hexadecimal characters
- कक्ष: `R` + 32 hexadecimal characters

## संदेश व्यवहार

- टेक्स्ट को 5000 characters के chunks में बांटा जाता है।
- Markdown formatting हटाई जाती है; code blocks और tables को जहां संभव हो Flex
  cards में बदला जाता है।
- streaming responses buffered होते हैं; जब तक एजेंट काम कर रहा होता है,
  LINE को loading animation के साथ पूरे chunks मिलते हैं।
- मीडिया डाउनलोड `channels.line.mediaMaxMb` तक सीमित है (डिफ़ॉल्ट 10)।
- इनबाउंड मीडिया एजेंट को सौंपे जाने से पहले `~/.openclaw/media/inbound/` में सहेजा जाता है,
  जो अन्य built-in channel Plugins द्वारा उपयोग किए जाने वाले common media store से मेल खाता है।

## चैनल डेटा (विस्तारित संदेश)

त्वरित उत्तर, स्थान, Flex cards या template
messages भेजने के लिए `channelData.line` का उपयोग करें।

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin, Flex messages presets के लिए `/card` command के साथ भी आता है:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP समर्थन

LINE, ACP (Agent Communication Protocol) conversation bindings का समर्थन करता है:

- `/acp spawn <agent> --bind here` मौजूदा LINE chat को child thread बनाए बिना ACP session से bind करता है।
- configured ACP bindings और conversation से bound active ACP sessions, LINE में अन्य conversation channels की तरह ही काम करते हैं।

विवरण के लिए [ACP agents](/hi/tools/acp-agents) देखें।

## आउटबाउंड मीडिया

LINE Plugin एजेंट messaging tool के माध्यम से images, videos और audio files भेजने का समर्थन करता है। मीडिया LINE-specific delivery path से उपयुक्त preview handling और tracking के साथ भेजा जाता है:

- **Images**: automatic preview generation के साथ LINE image messages के रूप में भेजे जाते हैं।
- **Videos**: explicit preview और content type handling के साथ भेजे जाते हैं।
- **Audio**: LINE audio messages के रूप में भेजा जाता है।

आउटबाउंड मीडिया URLs सार्वजनिक HTTPS URLs होने चाहिए। OpenClaw, URL को LINE को भेजने से पहले target hostname की जांच करता है और local loopback, link-local और private network targets को अस्वीकार करता है।

जब LINE-specific path उपलब्ध नहीं होता, तो सामान्य media sends केवल images के लिए मौजूदा route पर वापस जाते हैं।

## समस्या निवारण

- **Webhook जांच विफल होती है:** सुनिश्चित करें कि Webhook URL HTTPS का उपयोग करता है और
  `channelSecret`, LINE console से मेल खाता है।
- **कोई इनबाउंड events नहीं:** पुष्टि करें कि Webhook path `channels.line.webhookPath` से मेल खाता है
  और gateway LINE से पहुंच योग्य है।
- **मीडिया डाउनलोड errors:** यदि मीडिया डिफ़ॉल्ट सीमा से अधिक है, तो `channels.line.mediaMaxMb` बढ़ाएं।

## यह भी देखें

- [चैनल overview](/hi/channels) — सभी समर्थित channels
- [Pairing](/hi/channels/pairing) — निजी संदेश प्रमाणीकरण और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mentions तक limitation
- [Channel routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
