---
read_when:
    - आप OpenClaw को WeChat या Weixin से कनेक्ट करना चाहते हैं
    - आप openclaw-weixin चैनल Plugin इंस्टॉल कर रहे हैं या उसकी समस्या निवारण कर रहे हैं
    - आपको यह समझना होगा कि बाहरी चैनल plugins Gateway के साथ कैसे चलते हैं
summary: बाहरी openclaw-weixin Plugin के माध्यम से WeChat चैनल सेटअप
title: WeChat
x-i18n:
    generated_at: "2026-06-28T22:41:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 803557a4fc92056c63053a3388100a451b2d85d4e892877707b3c2e3a677c0b0
    source_path: channels/wechat.md
    workflow: 16
---

OpenClaw Tencent के बाहरी
`@tencent-weixin/openclaw-weixin` चैनल Plugin के माध्यम से WeChat से जुड़ता है.

स्थिति: बाहरी Plugin. सीधे चैट और मीडिया समर्थित हैं. समूह चैट को मौजूदा Plugin क्षमता metadata द्वारा
विज्ञापित नहीं किया गया है.

## नामकरण

- **WeChat** इन docs में उपयोगकर्ता-समक्ष नाम है.
- **Weixin** Tencent के package और Plugin id द्वारा उपयोग किया गया नाम है.
- `openclaw-weixin` OpenClaw चैनल id है.
- `@tencent-weixin/openclaw-weixin` npm package है.

CLI commands और config paths में `openclaw-weixin` का उपयोग करें.

## यह कैसे काम करता है

WeChat code OpenClaw core repo में नहीं रहता. OpenClaw सामान्य चैनल Plugin contract प्रदान करता है, और बाहरी Plugin
WeChat-विशिष्ट runtime प्रदान करता है:

1. `openclaw plugins install` `@tencent-weixin/openclaw-weixin` इंस्टॉल करता है.
2. Gateway Plugin manifest खोजता है और Plugin entrypoint लोड करता है.
3. Plugin चैनल id `openclaw-weixin` register करता है.
4. `openclaw channels login --channel openclaw-weixin` QR login शुरू करता है.
5. Plugin OpenClaw state directory के अंतर्गत account credentials संग्रहित करता है.
6. Gateway शुरू होने पर, Plugin हर configured account के लिए अपना Weixin monitor शुरू करता है.
7. आने वाले WeChat messages चैनल contract के माध्यम से normalized होते हैं, selected OpenClaw agent तक route किए जाते हैं, और Plugin outbound path के माध्यम से वापस भेजे जाते हैं.

यह separation महत्वपूर्ण है: OpenClaw core को channel-agnostic रहना चाहिए. WeChat login,
Tencent iLink API calls, media upload/download, context tokens, और account
monitoring बाहरी Plugin के स्वामित्व में हैं.

## इंस्टॉल करें

त्वरित install:

```bash
npx -y @tencent-weixin/openclaw-weixin-cli install
```

Manual install:

```bash
openclaw plugins install "@tencent-weixin/openclaw-weixin"
openclaw config set plugins.entries.openclaw-weixin.enabled true
```

Install के बाद Gateway restart करें:

```bash
openclaw gateway restart
```

## Login

Gateway चलाने वाली उसी machine पर QR login चलाएं:

```bash
openclaw channels login --channel openclaw-weixin
```

अपने phone पर WeChat से QR code scan करें और login confirm करें. सफल scan के बाद Plugin
account token को locally save करता है.

दूसरा WeChat account जोड़ने के लिए, वही login command फिर से चलाएं. कई accounts के लिए,
direct-message sessions को account, channel, और sender के अनुसार isolate करें:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

## Access control

Direct messages चैनल Plugins के लिए सामान्य OpenClaw pairing और allowlist model का उपयोग करते हैं.

नए senders approve करें:

```bash
openclaw pairing list openclaw-weixin
openclaw pairing approve openclaw-weixin <CODE>
```

पूर्ण access-control model के लिए, [Pairing](/hi/channels/pairing) देखें.

## Compatibility

Plugin startup पर host OpenClaw version check करता है.

| Plugin लाइन | OpenClaw version        | npm tag  |
| ----------- | ----------------------- | -------- |
| `2.x`       | `>=2026.3.22`           | `latest` |
| `1.x`       | `>=2026.1.0 <2026.3.22` | `legacy` |

अगर Plugin रिपोर्ट करता है कि आपका OpenClaw version बहुत पुराना है, तो या तो
OpenClaw update करें या legacy Plugin line install करें:

```bash
openclaw plugins install @tencent-weixin/openclaw-weixin@legacy
```

## Sidecar process

WeChat Plugin Gateway के साथ helper work चला सकता है, जबकि वह
Tencent iLink API को monitor करता है. issue #68451 में, उस helper path ने OpenClaw के
generic stale-Gateway cleanup में bug उजागर किया: child process parent
Gateway process को clean up करने की कोशिश कर सकता था, जिससे systemd जैसे process managers के अंतर्गत restart loops हो रहे थे.

मौजूदा OpenClaw startup cleanup current process और उसके ancestors को exclude करता है,
इसलिए channel helper को उसे launch करने वाले Gateway को kill नहीं करना चाहिए. यह fix
generic है; यह core में WeChat-specific path नहीं है.

## Troubleshooting

Install और status check करें:

```bash
openclaw plugins list
openclaw channels status --probe
openclaw --version
```

अगर channel installed दिखता है लेकिन connect नहीं होता, तो confirm करें कि Plugin
enabled है और restart करें:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

अगर WeChat enable करने के बाद Gateway बार-बार restart होता है, तो OpenClaw और
Plugin दोनों update करें:

```bash
npm view @tencent-weixin/openclaw-weixin version
openclaw plugins install "@tencent-weixin/openclaw-weixin" --force
openclaw gateway restart
```

अगर startup रिपोर्ट करता है कि installed Plugin package `requires compiled runtime
output for TypeScript entry`, तो npm package compiled
JavaScript runtime files के बिना publish किया गया था, जिनकी OpenClaw को जरूरत है. Plugin
publisher द्वारा fixed package ship करने के बाद update/reinstall करें, या अस्थायी रूप से Plugin disable/uninstall करें.

अस्थायी disable:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled false
openclaw gateway restart
```

## संबंधित docs

- Channel overview: [Chat Channels](/hi/channels)
- Pairing: [Pairing](/hi/channels/pairing)
- Channel routing: [Channel Routing](/hi/channels/channel-routing)
- Plugin architecture: [Plugin Architecture](/hi/plugins/architecture)
- Channel Plugin SDK: [Channel Plugin SDK](/hi/plugins/sdk-channel-plugins)
- बाहरी package: [@tencent-weixin/openclaw-weixin](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin)
