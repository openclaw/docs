---
read_when:
    - Tlon/Urbit चैनल सुविधाओं पर काम
summary: Tlon/Urbit समर्थन स्थिति, क्षमताएँ, और कॉन्फ़िगरेशन
title: Tlon
x-i18n:
    generated_at: "2026-06-28T22:40:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
---

Tlon, Urbit पर बना एक विकेंद्रीकृत मैसेंजर है। OpenClaw आपके Urbit ship से जुड़ता है और
DMs और group chat संदेशों का जवाब दे सकता है। Group replies के लिए डिफ़ॉल्ट रूप से @ mention आवश्यक है और उन्हें
allowlists के ज़रिए और सीमित किया जा सकता है।

स्थिति: bundled Plugin। DMs, group mentions, thread replies, rich text formatting, और
image uploads समर्थित हैं। Reactions और polls अभी समर्थित नहीं हैं।

## Bundled Plugin

Tlon मौजूदा OpenClaw releases में bundled Plugin के रूप में आता है, इसलिए सामान्य packaged
builds को अलग install की आवश्यकता नहीं होती।

यदि आप किसी पुराने build पर हैं या ऐसे custom install पर हैं जिसमें Tlon शामिल नहीं है, तो
मौजूदा npm package install करें:

CLI के ज़रिए install करें (npm registry):

```bash
openclaw plugins install @openclaw/tlon
```

मौजूदा आधिकारिक release tag का पालन करने के लिए bare package का उपयोग करें। exact
version केवल तभी pin करें जब आपको reproducible install चाहिए।

Local checkout (git repo से चलाते समय):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

विवरण: [Plugins](/hi/tools/plugin)

## Setup

1. सुनिश्चित करें कि Tlon Plugin उपलब्ध है।
   - मौजूदा packaged OpenClaw releases में यह पहले से bundled है।
   - पुराने/custom installs इसे ऊपर दिए गए commands से manually जोड़ सकते हैं।
2. अपना ship URL और login code इकट्ठा करें।
3. `channels.tlon` configure करें।
4. gateway restart करें।
5. bot को DM करें या group channel में mention करें।

न्यूनतम config (single account):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Private/LAN ships

डिफ़ॉल्ट रूप से, OpenClaw SSRF protection के लिए private/internal hostnames और IP ranges को block करता है।
यदि आपका ship किसी private network (localhost, LAN IP, या internal hostname) पर चल रहा है,
तो आपको स्पष्ट रूप से opt in करना होगा:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

यह इन जैसे URLs पर लागू होता है:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ इसे केवल तभी enable करें जब आप अपने local network पर भरोसा करते हों। यह setting आपके ship URL पर requests के लिए
SSRF protections disable करती है।

## Group channels

Auto-discovery डिफ़ॉल्ट रूप से enabled है। आप channels को manually pin भी कर सकते हैं:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Auto-discovery disable करें:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Access control

DM allowlist (empty = कोई DMs allowed नहीं, approval flow के लिए `ownerShip` का उपयोग करें):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Group authorization (डिफ़ॉल्ट रूप से restricted):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Owner और approval system

जब unauthorized users interact करने की कोशिश करें, तो approval requests प्राप्त करने के लिए owner ship set करें:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

owner ship **हर जगह automatically authorized** होता है — DM invites auto-accepted होते हैं और
channel messages हमेशा allowed होते हैं। आपको owner को `dmAllowlist` या
`defaultAuthorizedShips` में जोड़ने की आवश्यकता नहीं है।

Set होने पर, owner को इनके लिए DM notifications मिलते हैं:

- allowlist में नहीं मौजूद ships से DM requests
- authorization के बिना channels में mentions
- Group invite requests

## Auto-accept settings

DM invites auto-accept करें (`dmAllowlist` में मौजूद ships के लिए):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

trusted ships से group invites auto-accept करें:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

`groupInviteAllowlist` खाली होने पर `autoAcceptGroupInvites` fails closed होता है। allowlist को
उन ships पर set करें जिनके group invites automatically accepted होने चाहिए।

## Delivery targets (CLI/Cron)

इन्हें `openclaw message send` या Cron delivery के साथ उपयोग करें:

- DM: `~sampel-palnet` या `dm/~sampel-palnet`
- Group: `chat/~host-ship/channel` या `group:~host-ship/channel`

## Bundled skill

Tlon Plugin में bundled skill ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
शामिल है, जो Tlon operations के लिए CLI access देता है:

- **Contacts**: profiles get/update करें, contacts list करें
- **Channels**: list करें, create करें, messages post करें, history fetch करें
- **Groups**: list करें, create करें, members manage करें
- **DMs**: messages भेजें, messages पर react करें
- **Reactions**: posts और DMs में emoji reactions add/remove करें
- **Settings**: slash commands के ज़रिए Plugin permissions manage करें

Plugin install होने पर skill automatically available होता है।

## Capabilities

| Feature         | Status                                  |
| --------------- | --------------------------------------- |
| Direct messages | ✅ समर्थित                              |
| Groups/channels | ✅ समर्थित (डिफ़ॉल्ट रूप से mention-gated) |
| Threads         | ✅ समर्थित (thread में auto-replies)    |
| Rich text       | ✅ Markdown को Tlon format में converted किया गया |
| Images          | ✅ Tlon storage पर uploaded             |
| Reactions       | ✅ [bundled skill](#bundled-skill) के ज़रिए |
| Polls           | ❌ अभी समर्थित नहीं                    |
| Native commands | ✅ समर्थित (डिफ़ॉल्ट रूप से केवल owner) |

## Troubleshooting

पहले यह ladder चलाएँ:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

सामान्य failures:

- **DMs ignored**: sender `dmAllowlist` में नहीं है और approval flow के लिए कोई `ownerShip` configured नहीं है।
- **Group messages ignored**: channel discovered नहीं हुआ या sender authorized नहीं है।
- **Connection errors**: जाँचें कि ship URL reachable है; local ships के लिए `allowPrivateNetwork` enable करें।
- **Auth errors**: verify करें कि login code current है (codes rotate होते हैं)।

## Configuration reference

पूर्ण configuration: [Configuration](/hi/gateway/configuration)

Provider options:

- `channels.tlon.enabled`: channel startup enable/disable करें।
- `channels.tlon.ship`: bot का Urbit ship name (जैसे `~sampel-palnet`)।
- `channels.tlon.url`: ship URL (जैसे `https://sampel-palnet.tlon.network`)।
- `channels.tlon.code`: ship login code।
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URLs allow करें (SSRF bypass)।
- `channels.tlon.ownerShip`: approval system के लिए owner ship (हमेशा authorized)।
- `channels.tlon.dmAllowlist`: DM करने के लिए allowed ships (empty = कोई नहीं)।
- `channels.tlon.autoAcceptDmInvites`: allowlisted ships से DMs auto-accept करें।
- `channels.tlon.autoAcceptGroupInvites`: allowlisted ships से group invites auto-accept करें।
- `channels.tlon.groupInviteAllowlist`: वे ships जिनके group invites auto-accepted हो सकते हैं।
- `channels.tlon.autoDiscoverChannels`: group channels auto-discover करें (default: true)।
- `channels.tlon.groupChannels`: manually pinned channel nests।
- `channels.tlon.defaultAuthorizedShips`: सभी channels के लिए authorized ships।
- `channels.tlon.authorization.channelRules`: per-channel auth rules।
- `channels.tlon.showModelSignature`: messages में model name append करें।

## Notes

- Group replies के लिए respond करने हेतु mention (जैसे `~your-bot-ship`) आवश्यक है।
- Thread replies: यदि inbound message किसी thread में है, तो OpenClaw in-thread reply करता है।
- Rich text: Markdown formatting (bold, italic, code, headers, lists) Tlon के native format में converted होती है।
- Images: URLs Tlon storage पर uploaded होते हैं और image blocks के रूप में embedded होते हैं।

## Related

- [Channels Overview](/hi/channels) — सभी supported channels
- [Pairing](/hi/channels/pairing) — DM authentication और pairing flow
- [Groups](/hi/channels/groups) — group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) — messages के लिए session routing
- [Security](/hi/gateway/security) — access model और hardening
