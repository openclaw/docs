---
read_when:
    - DM पहुँच नियंत्रण सेट अप करना
    - नए iOS/Android नोड को पेयर करना
    - OpenClaw की सुरक्षा स्थिति की समीक्षा
summary: 'पेयरिंग अवलोकन: स्वीकृत करें कि कौन आपको DM कर सकता है + कौन से नोड जुड़ सकते हैं'
title: पेयरिंग
x-i18n:
    generated_at: "2026-07-04T17:58:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" OpenClaw का स्पष्ट एक्सेस अनुमोदन चरण है।
इसका उपयोग दो जगहों पर किया जाता है:

1. **DM pairing** (किसे bot से बात करने की अनुमति है)
2. **Node pairing** (कौन-से devices/nodes gateway network में शामिल हो सकते हैं)

सुरक्षा संदर्भ: [सुरक्षा](/hi/gateway/security)

## 1) DM pairing (इनबाउंड चैट एक्सेस)

जब कोई channel DM policy `pairing` के साथ कॉन्फ़िगर किया जाता है, तो अज्ञात senders को एक छोटा code मिलता है और उनका message तब तक **प्रोसेस नहीं किया जाता** जब तक आप अनुमोदन नहीं करते।

डिफ़ॉल्ट DM policies यहां दस्तावेज़ित हैं: [सुरक्षा](/hi/gateway/security)

`dmPolicy: "open"` केवल तब public होता है जब प्रभावी DM allowlist में `"*"` शामिल हो।
Setup और validation को public-open configs के लिए उस wildcard की आवश्यकता होती है। यदि मौजूदा
state में concrete `allowFrom` entries के साथ `open` है, तो runtime फिर भी
केवल उन्हीं senders को प्रवेश देता है, और pairing-store approvals `open` access को विस्तृत नहीं करते।

Pairing codes:

- 8 characters, uppercase, कोई ambiguous chars नहीं (`0O1I`)।
- **1 घंटे बाद expire होते हैं**। bot pairing message केवल तब भेजता है जब नया request बनाया जाता है (लगभग प्रति sender प्रति घंटे एक बार)।
- Pending DM pairing requests डिफ़ॉल्ट रूप से **प्रति channel 3** तक सीमित हैं; अतिरिक्त requests तब तक अनदेखी की जाती हैं जब तक कोई expire या approve न हो जाए।

### किसी sender को approve करें

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

यदि अभी तक कोई command owner configured नहीं है, तो DM pairing code approve करने से
`commands.ownerAllowFrom` approved sender पर bootstrap भी हो जाता है, जैसे `telegram:123456789`।
यह first-time setups को privileged commands और exec approval prompts के लिए एक स्पष्ट owner देता है।
owner मौजूद होने के बाद, बाद की pairing approvals केवल DM access देती हैं; वे और owners नहीं जोड़तीं।

Supported channels: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Reusable sender groups

जब समान trusted sender set को कई message channels या DM और group allowlists दोनों पर लागू करना हो, तो top-level `accessGroups` का उपयोग करें।

Static groups `type: "message.senders"` का उपयोग करते हैं और channel allowlists से
`accessGroup:<name>` के साथ reference किए जाते हैं:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Access groups का विस्तृत दस्तावेज़ यहां है: [Access groups](/hi/channels/access-groups)

### State कहां रहता है

`~/.openclaw/credentials/` के अंतर्गत stored:

- Pending requests: `<channel>-pairing.json`
- Approved allowlist store:
  - Default account: `<channel>-allowFrom.json`
  - Non-default account: `<channel>-<accountId>-allowFrom.json`

Account scoping behavior:

- Non-default accounts केवल अपनी scoped allowlist file read/write करते हैं।
- Default account channel-scoped unscoped allowlist file का उपयोग करता है।

इन्हें sensitive मानें (ये आपके assistant तक access gate करते हैं)।

<Note>
pairing allowlist store DM access के लिए है। Group authorization अलग है।
DM pairing code approve करने से वह sender group commands चलाने या groups में bot control करने के लिए अपने-आप allow नहीं होता।
First-owner bootstrap अलग config state है
`commands.ownerAllowFrom` में, और group chat delivery अभी भी channel की group allowlists का अनुसरण करती है
(उदाहरण के लिए `groupAllowFrom`, `groups`, या channel के आधार पर per-group
या per-topic overrides)।
</Note>

## 2) Node device pairing (iOS/Android/macOS/headless nodes)

Nodes Gateway से **devices** के रूप में `role: node` के साथ connect करते हैं। Gateway
एक device pairing request बनाता है जिसे approve करना आवश्यक है।

### Control UI से pair करें (recommended)

`operator.admin` access वाले पहले से connected Control UI session का उपयोग करें:

1. Control UI खोलें और **Nodes** select करें।
2. **Devices** में, **Pair mobile device** पर click करें।
3. अपने phone पर, OpenClaw app खोलें → **Settings** → **Gateway**।
4. QR code scan करें या setup code paste करें, फिर connect करें।

Official OpenClaw iOS और Android apps तब automatically approve हो जाते हैं जब उनका
setup-code metadata match करता है। यदि **Devices** में pending request दिखता है (उदाहरण के लिए,
non-official client या mismatched metadata के लिए), तो approve करने से पहले उसकी role और
scopes review करें।

जब current Control UI session में administrator access नहीं होता, तो button disabled रहता है।
उस स्थिति में Gateway host से नीचे दिया गया CLI approval flow उपयोग करें।

### Telegram के ज़रिए pair करें

यदि आप `device-pair` Plugin उपयोग करते हैं, तो आप first-time device pairing पूरी तरह Telegram से कर सकते हैं:

1. Telegram में, अपने bot को message करें: `/pair`
2. bot दो messages के साथ reply करता है: एक instruction message और एक अलग **setup code** message (Telegram में copy/paste करना आसान)।
3. अपने phone पर, OpenClaw iOS app खोलें → Settings → Gateway।
4. QR code scan करें या setup code paste करें और connect करें।
5. official mobile app automatically connect होता है। यदि `/pair pending` कोई
   request दिखाता है, तो approve करने से पहले उसकी role और scopes review करें।

setup code एक base64-encoded JSON payload है जिसमें शामिल है:

- `url`: Gateway WebSocket URL (`ws://...` या `wss://...`)
- `bootstrapToken`: initial pairing handshake के लिए उपयोग किया गया short-lived single-device bootstrap token

वह bootstrap token built-in pairing bootstrap profile carry करता है:

- built-in setup profile केवल fresh QR/setup-code baseline allow करता है:
  `node` plus bounded `operator` handoff
- handed-off `node` token `scopes: []` ही रहता है
- handed-off `operator` token `operator.approvals`,
  `operator.read`, `operator.talk.secrets`, और `operator.write` तक सीमित है
- `operator.admin` QR/setup-code bootstrap से grant नहीं होता; इसके लिए
  अलग approved operator pairing या token flow की आवश्यकता होती है
- बाद की token rotation/revocation device के approved
  role contract और caller session के operator scopes दोनों से bounded रहती है

setup code को valid रहते समय password की तरह treat करें।

Tailscale, public, या अन्य remote mobile pairing के लिए, Tailscale Serve/Funnel
या कोई अन्य `wss://` Gateway URL उपयोग करें। Plaintext `ws://` setup codes केवल
loopback, private LAN addresses, `.local` Bonjour hosts, और Android
emulator host के लिए accepted हैं। Tailnet CGNAT addresses, `.ts.net` names, और public hosts अभी भी
QR/setup-code जारी करने से पहले fail closed होते हैं।

### Node device approve करें

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

जब explicit approval इसलिए denied होता है क्योंकि approving paired-device session
pairing-only scope के साथ खोला गया था, तो CLI उसी request को
`operator.admin` के साथ retry करता है। इससे existing admin-capable paired device नया
Control UI/browser pairing `devices/paired.json` हाथ से edit किए बिना recover कर सकता है।
Gateway फिर भी retried connection validate करता है; ऐसे tokens जो
`operator.admin` के साथ authenticate नहीं कर सकते, blocked रहते हैं।

यदि वही device अलग auth details (उदाहरण के लिए अलग
role/scopes/public key) के साथ retry करता है, तो previous pending request supersede हो जाता है और नया
`requestId` बनाया जाता है।

<Note>
पहले से paired device को चुपचाप broader access नहीं मिलता। यदि वह अधिक scopes या broader role मांगते हुए reconnect करता है, तो OpenClaw existing approval को जैसा है वैसा रखता है और fresh pending upgrade request बनाता है। approve करने से पहले current approved access को newly requested access से compare करने के लिए `openclaw devices list` उपयोग करें।
</Note>

### Optional trusted-CIDR node auto-approve

Device pairing default रूप से manual रहता है। tightly controlled node networks के लिए,
आप explicit CIDRs या exact IPs के साथ first-time node auto-approval में opt in कर सकते हैं:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

यह केवल fresh `role: node` pairing requests पर लागू होता है जिनमें कोई requested
scopes नहीं हैं। Operator, browser, Control UI, और WebChat clients को अभी भी manual
approval की आवश्यकता होती है। Role, scope, metadata, और public-key changes को अभी भी manual
approval की आवश्यकता होती है।

### Node pairing state storage

`~/.openclaw/devices/` के अंतर्गत stored:

- `pending.json` (short-lived; pending requests expire)
- `paired.json` (paired devices + tokens)

### Notes

- legacy `node.pair.*` API (CLI: `openclaw nodes pending|approve|reject|remove|rename`) एक
  अलग gateway-owned pairing store है। WS nodes को अभी भी device pairing की आवश्यकता होती है।
- pairing record approved roles के लिए durable source of truth है। Active
  device tokens उस approved role set तक bounded रहते हैं; approved roles के बाहर कोई stray token entry
  नया access create नहीं करती।

## Related docs

- Security model + prompt injection: [सुरक्षा](/hi/gateway/security)
- Safely update करना (doctor चलाएं): [Updating](/hi/install/updating)
- Channel configs:
  - Telegram: [Telegram](/hi/channels/telegram)
  - WhatsApp: [WhatsApp](/hi/channels/whatsapp)
  - Signal: [Signal](/hi/channels/signal)
  - iMessage: [iMessage](/hi/channels/imessage)
  - Discord: [Discord](/hi/channels/discord)
  - Slack: [Slack](/hi/channels/slack)
