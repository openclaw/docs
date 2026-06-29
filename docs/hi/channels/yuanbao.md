---
read_when:
    - आप Yuanbao बॉट को कनेक्ट करना चाहते हैं
    - आप Yuanbao चैनल कॉन्फ़िगर कर रहे हैं
summary: Yuanbao बॉट का अवलोकन, सुविधाएँ और कॉन्फ़िगरेशन
title: युआनबाओ
x-i18n:
    generated_at: "2026-06-28T22:41:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao Tencent का AI असिस्टेंट प्लेटफ़ॉर्म है। OpenClaw channel Plugin
Yuanbao बॉट्स को WebSocket के ज़रिए OpenClaw से जोड़ता है ताकि वे उपयोगकर्ताओं के साथ
प्रत्यक्ष संदेशों और समूह चैट के माध्यम से इंटरैक्ट कर सकें।

**स्थिति:** बॉट DMs + समूह चैट के लिए उत्पादन-तैयार। WebSocket ही एकमात्र समर्थित कनेक्शन मोड है।

---

## त्वरित शुरुआत

> **OpenClaw 2026.4.10 या उससे ऊपर आवश्यक है।** जाँचने के लिए `openclaw --version` चलाएँ। `openclaw update` से अपग्रेड करें।

<Steps>
  <Step title="अपने क्रेडेंशियल्स के साथ Yuanbao channel जोड़ें">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` मान colon-separated `appKey:appSecret` फ़ॉर्मैट का उपयोग करता है। आप इन्हें अपनी एप्लिकेशन सेटिंग्स में robot बनाकर Yuanbao ऐप से प्राप्त कर सकते हैं।
  </Step>

  <Step title="सेटअप पूरा होने के बाद, बदलाव लागू करने के लिए Gateway रीस्टार्ट करें">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### इंटरैक्टिव सेटअप (वैकल्पिक)

आप इंटरैक्टिव विज़ार्ड का भी उपयोग कर सकते हैं:

```bash
openclaw channels login --channel yuanbao
```

अपना App ID और App Secret दर्ज करने के लिए prompts का पालन करें।

---

## एक्सेस नियंत्रण

### प्रत्यक्ष संदेश

कौन बॉट को DM कर सकता है, इसे नियंत्रित करने के लिए `dmPolicy` कॉन्फ़िगर करें:

- `"pairing"` - अज्ञात उपयोगकर्ताओं को pairing code मिलता है; CLI के ज़रिए अनुमोदित करें
- `"allowlist"` - केवल `allowFrom` में सूचीबद्ध उपयोगकर्ता चैट कर सकते हैं
- `"open"` - सभी उपयोगकर्ताओं को अनुमति दें (डिफ़ॉल्ट)
- `"disabled"` - सभी DMs अक्षम करें

**pairing अनुरोध अनुमोदित करें:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### समूह चैट

**Mention आवश्यकता** (`channels.yuanbao.requireMention`):

- `true` - @mention आवश्यक है (डिफ़ॉल्ट)
- `false` - @mention के बिना उत्तर दें

समूह चैट में बॉट के संदेश का जवाब देना implicit mention माना जाता है।

---

## कॉन्फ़िगरेशन उदाहरण

### open DM नीति के साथ बुनियादी सेटअप

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### DMs को विशिष्ट उपयोगकर्ताओं तक सीमित करें

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### समूहों में @mention आवश्यकता अक्षम करें

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### outbound संदेश डिलीवरी अनुकूलित करें

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### merge-text रणनीति ट्यून करें

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## सामान्य कमांड

| कमांड     | विवरण                       |
| ---------- | --------------------------- |
| `/help`    | उपलब्ध कमांड दिखाएँ         |
| `/status`  | बॉट स्थिति दिखाएँ           |
| `/new`     | नया session शुरू करें       |
| `/stop`    | मौजूदा run रोकें            |
| `/restart` | OpenClaw रीस्टार्ट करें     |
| `/compact` | session context compact करें |

> Yuanbao native slash-command menus का समर्थन करता है। Gateway शुरू होने पर commands अपने आप प्लेटफ़ॉर्म से sync हो जाते हैं।

---

## समस्या निवारण

### बॉट समूह चैट में उत्तर नहीं देता

1. सुनिश्चित करें कि बॉट समूह में जोड़ा गया है
2. सुनिश्चित करें कि आप बॉट को @mention करते हैं (डिफ़ॉल्ट रूप से आवश्यक)
3. लॉग जाँचें: `openclaw logs --follow`

### बॉट संदेश प्राप्त नहीं करता

1. सुनिश्चित करें कि बॉट Yuanbao ऐप में बनाया और अनुमोदित किया गया है
2. सुनिश्चित करें कि `appKey` और `appSecret` सही ढंग से कॉन्फ़िगर हैं
3. सुनिश्चित करें कि Gateway चल रहा है: `openclaw gateway status`
4. लॉग जाँचें: `openclaw logs --follow`

### बॉट खाली या fallback उत्तर भेजता है

1. जाँचें कि AI model वैध content लौटा रहा है या नहीं
2. डिफ़ॉल्ट fallback उत्तर है: "暂时无法解答，你可以换个问题问问我哦"
3. इसे `channels.yuanbao.fallbackReply` के ज़रिए अनुकूलित करें

### App Secret लीक हो गया

1. YuanBao APP में App Secret रीसेट करें
2. अपनी config में मान अपडेट करें
3. Gateway रीस्टार्ट करें: `openclaw gateway restart`

---

## उन्नत कॉन्फ़िगरेशन

### कई खाते

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

जब outbound APIs कोई `accountId` निर्दिष्ट नहीं करतीं, तब कौन सा account उपयोग होगा, इसे `defaultAccount` नियंत्रित करता है।

### संदेश सीमाएँ

- `maxChars` - एक संदेश की अधिकतम वर्ण संख्या (डिफ़ॉल्ट: `3000` वर्ण)
- `mediaMaxMb` - media upload/download सीमा (डिफ़ॉल्ट: `20` MB)
- `overflowPolicy` - संदेश सीमा से अधिक होने पर व्यवहार: `"split"` (डिफ़ॉल्ट) या `"stop"`

### Streaming

Yuanbao block-level streaming output का समर्थन करता है। सक्षम होने पर, बॉट generate करते समय text को chunks में भेजता है।

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

पूरा उत्तर एक संदेश में भेजने के लिए `disableBlockStreaming: true` सेट करें।

### समूह चैट इतिहास context

नियंत्रित करें कि समूह चैट के लिए AI context में कितने ऐतिहासिक संदेश शामिल किए जाएँ:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Reply-to मोड

नियंत्रित करें कि समूह चैट में उत्तर देते समय बॉट messages को कैसे quote करता है:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| मान       | व्यवहार                                                  |
| --------- | -------------------------------------------------------- |
| `"off"`   | कोई quote reply नहीं                                    |
| `"first"` | प्रति inbound message केवल पहला reply quote करें (डिफ़ॉल्ट) |
| `"all"`   | हर reply quote करें                                     |

### Markdown hint injection

डिफ़ॉल्ट रूप से, बॉट system prompt में निर्देश inject करता है ताकि AI model पूरे उत्तर को markdown code blocks में wrap न करे।

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Debug मोड

विशिष्ट bot IDs के लिए unsanitized log output सक्षम करें:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Multi-agent routing

Yuanbao DMs या groups को अलग-अलग agents तक route करने के लिए `bindings` का उपयोग करें।

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Routing fields:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) या `"group"` (समूह चैट)
- `match.peer.id`: user ID या group code

---

## कॉन्फ़िगरेशन संदर्भ

पूरा कॉन्फ़िगरेशन: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

| सेटिंग                                    | विवरण                                             | डिफ़ॉल्ट                               |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | channel सक्षम/अक्षम करें                         | `true`                                 |
| `channels.yuanbao.defaultAccount`          | outbound routing के लिए डिफ़ॉल्ट account          | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (signing और ticket generation के लिए उपयोग) | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (signing के लिए उपयोग)                 | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Pre-signed token (automatic ticket signing छोड़ता है) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | Account display name                              | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | किसी विशिष्ट account को सक्षम/अक्षम करें          | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM नीति                                           | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM allowlist (user ID सूची)                       | -                                      |
| `channels.yuanbao.requireMention`          | groups में @mention आवश्यक करें                   | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | लंबे message handling (`split` या `stop`)         | `split`                                |
| `channels.yuanbao.replyToMode`             | Group reply-to strategy (`off`, `first`, `all`)   | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Outbound strategy (`merge-text` या `immediate`)   | `merge-text`                           |
| `channels.yuanbao.minChars`                | Merge-text: send trigger करने के लिए min chars    | `2800`                                 |
| `channels.yuanbao.maxChars`                | Merge-text: प्रति message max chars               | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Merge-text: auto-flush से पहले idle timeout (ms)  | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Media size limit (MB)                             | `20`                                   |
| `channels.yuanbao.historyLimit`            | Group chat history context entries                | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | block-level streaming output अक्षम करें           | `false`                                |
| `channels.yuanbao.fallbackReply`           | AI के no content लौटाने पर fallback reply         | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | markdown anti-wrapping instructions inject करें   | `true`                                 |
| `channels.yuanbao.debugBotIds`             | Debug whitelist bot IDs (unsanitized logs)        | `[]`                                   |

---

## समर्थित message types

### Receive

- ✅ Text
- ✅ Images
- ✅ Files
- ✅ Audio / Voice
- ✅ Video
- ✅ Stickers / Custom emoji
- ✅ Custom elements (link cards, etc.)

### Send

- ✅ Text (markdown support के साथ)
- ✅ Images
- ✅ Files
- ✅ Audio
- ✅ Video
- ✅ Stickers

### Threads और replies

- ✅ Quote replies (`replyToMode` के ज़रिए कॉन्फ़िगर योग्य)
- ❌ Thread replies (platform द्वारा समर्थित नहीं)

---

## संबंधित

- [Channels Overview](/hi/channels) - सभी समर्थित channels
- [Pairing](/hi/channels/pairing) - DM authentication और pairing flow
- [Groups](/hi/channels/groups) - group chat behavior और mention gating
- [Channel Routing](/hi/channels/channel-routing) - messages के लिए session routing
- [Security](/hi/gateway/security) - access model और hardening
