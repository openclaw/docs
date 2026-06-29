---
read_when:
    - आप OpenClaw को LINE से कनेक्ट करना चाहते हैं
    - आपको LINE Webhook + क्रेडेंशियल सेटअप की आवश्यकता है
    - आप LINE-विशिष्ट संदेश विकल्प चाहते हैं
summary: LINE Messaging API Plugin सेटअप, कॉन्फ़िगरेशन, और उपयोग
title: LINE
x-i18n:
    generated_at: "2026-06-28T23:18:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE, LINE Messaging API के जरिए OpenClaw से जुड़ता है। Plugin, Gateway पर Webhook
रिसीवर के रूप में चलता है और प्रमाणीकरण के लिए आपके channel access token + channel secret का
उपयोग करता है।

स्थिति: डाउनलोड करने योग्य Plugin। डायरेक्ट मैसेज, ग्रुप चैट, मीडिया, लोकेशन, Flex
मैसेज, टेम्पलेट मैसेज, और क्विक रिप्लाई समर्थित हैं। प्रतिक्रियाएं और थ्रेड
समर्थित नहीं हैं।

## इंस्टॉल करें

channel कॉन्फ़िगर करने से पहले LINE इंस्टॉल करें:

```bash
openclaw plugins install @openclaw/line
```

लोकल चेकआउट (जब git repo से चला रहे हों):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## सेटअप

1. LINE Developers account बनाएं और Console खोलें:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. एक Provider बनाएं (या चुनें) और **Messaging API** channel जोड़ें।
3. channel settings से **Channel access token** और **Channel secret** कॉपी करें।
4. Messaging API settings में **Use webhook** सक्षम करें।
5. Webhook URL को अपने Gateway endpoint पर सेट करें (HTTPS आवश्यक है):

```
https://gateway-host/line/webhook
```

Gateway, LINE के Webhook verification (GET) का जवाब देता है और signature तथा payload validation के तुरंत बाद signed
inbound events (POST) को स्वीकार करता है; agent
processing असिंक्रोनस रूप से जारी रहती है।
यदि आपको custom path चाहिए, तो `channels.line.webhookPath` या
`channels.line.accounts.<id>.webhookPath` सेट करें और URL को उसी अनुसार अपडेट करें।

सुरक्षा नोट:

- LINE signature verification body-dependent है (raw body पर HMAC), इसलिए OpenClaw verification से पहले strict pre-auth body limits और timeout लागू करता है।
- OpenClaw verified raw request bytes से Webhook events process करता है। signature-integrity safety के लिए upstream middleware-transformed `req.body` values को अनदेखा किया जाता है।

## कॉन्फ़िगर करें

न्यूनतम config:

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

Public DM config:

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

Env vars (केवल default account):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret files:

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

`tokenFile` और `secretFile` को regular files की ओर point करना चाहिए। Symlinks अस्वीकार किए जाते हैं।

कई accounts:

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

डायरेक्ट मैसेज default रूप से pairing पर होते हैं। अज्ञात senders को pairing code मिलता है और उनके
messages approved होने तक अनदेखे किए जाते हैं।

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists और policies:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DMs के लिए allowlisted LINE user IDs; `dmPolicy: "open"` के लिए `["*"]` आवश्यक है
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: groups के लिए allowlisted LINE user IDs
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups को `allowFrom`, `groupAllowFrom`, और per-group `allowFrom` से `accessGroup:<name>` के साथ reference किया जा सकता है।
- Runtime note: यदि `channels.line` पूरी तरह missing है, तो runtime group checks के लिए `groupPolicy="allowlist"` पर fallback करता है (भले ही `channels.defaults.groupPolicy` सेट हो)।

LINE IDs case-sensitive हैं। Valid IDs ऐसे दिखते हैं:

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## मैसेज व्यवहार

- Text को 5000 characters पर chunks में बांटा जाता है।
- Markdown formatting हटाई जाती है; code blocks और tables को संभव होने पर Flex
  cards में बदला जाता है।
- Streaming responses buffered होते हैं; agent के काम करते समय LINE को loading
  animation के साथ पूरे chunks मिलते हैं।
- Media downloads `channels.line.mediaMaxMb` (default 10) से capped हैं।
- Inbound media को agent तक pass किए जाने से पहले `~/.openclaw/media/inbound/` के अंतर्गत save किया जाता है,
  जो अन्य bundled channel
  plugins द्वारा उपयोग किए जाने वाले shared media store से मेल खाता है।

## Channel data (रिच मैसेज)

quick replies, locations, Flex cards, या template
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

LINE Plugin Flex message presets के लिए `/card` command भी ship करता है:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP समर्थन

LINE ACP (Agent Communication Protocol) conversation bindings को support करता है:

- `/acp spawn <agent> --bind here` child thread बनाए बिना current LINE chat को ACP session से bind करता है।
- Configured ACP bindings और active conversation-bound ACP sessions, LINE पर अन्य conversation channels की तरह काम करते हैं।

विवरण के लिए [ACP agents](/hi/tools/acp-agents) देखें।

## Outbound media

LINE Plugin agent message tool के जरिए images, videos, और audio files भेजने का समर्थन करता है। Media appropriate preview और tracking handling के साथ LINE-specific delivery path के जरिए भेजा जाता है:

- **Images**: automatic preview generation के साथ LINE image messages के रूप में भेजी जाती हैं।
- **Videos**: explicit preview और content-type handling के साथ भेजे जाते हैं।
- **Audio**: LINE audio messages के रूप में भेजा जाता है।

Outbound media URLs public HTTPS URLs होने चाहिए। OpenClaw URL को LINE को सौंपने से पहले target hostname validate करता है और loopback, link-local, और private-network targets को अस्वीकार करता है।

Generic media sends, LINE-specific path उपलब्ध न होने पर existing image-only route पर fallback करते हैं।

## समस्या निवारण

- **Webhook verification fails:** सुनिश्चित करें कि Webhook URL HTTPS है और
  `channelSecret` LINE console से मेल खाता है।
- **No inbound events:** पुष्टि करें कि Webhook path `channels.line.webhookPath` से मेल खाता है
  और Gateway LINE से reachable है।
- **Media download errors:** यदि media default limit से अधिक है, तो `channels.line.mediaMaxMb` बढ़ाएं।

## संबंधित

- [Channels Overview](/hi/channels) — सभी समर्थित channels
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
