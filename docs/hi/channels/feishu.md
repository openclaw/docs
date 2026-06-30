---
read_when:
    - आप Feishu/Lark बॉट कनेक्ट करना चाहते हैं
    - आप Feishu चैनल कॉन्फ़िगर कर रहे हैं
summary: Feishu बॉट का अवलोकन, सुविधाएँ, और कॉन्फ़िगरेशन
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:00:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark एक ऑल-इन-वन सहयोग प्लेटफ़ॉर्म है जहाँ टीमें चैट करती हैं, दस्तावेज़ साझा करती हैं, कैलेंडर प्रबंधित करती हैं, और साथ मिलकर काम पूरा करती हैं।

**स्थिति:** bot DMs + समूह चैट के लिए उत्पादन-तैयार। WebSocket डिफ़ॉल्ट मोड है; webhook मोड वैकल्पिक है।

---

## त्वरित शुरुआत

<Note>
OpenClaw 2026.5.29 या उससे ऊपर आवश्यक है। जाँचने के लिए `openclaw --version` चलाएँ। `openclaw update` से अपग्रेड करें।
</Note>

<Steps>
  <Step title="चैनल सेटअप विज़ार्ड चलाएँ">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu Open Platform से App ID और App Secret चिपकाने के लिए मैनुअल सेटअप चुनें, या अपने-आप bot बनाने के लिए QR सेटअप चुनें। यदि घरेलू Feishu मोबाइल ऐप QR कोड पर प्रतिक्रिया नहीं देता है, तो सेटअप फिर से चलाएँ और मैनुअल सेटअप चुनें।
  </Step>
  
  <Step title="सेटअप पूरा होने के बाद, बदलाव लागू करने के लिए gateway को पुनः आरंभ करें">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## एक्सेस नियंत्रण

### प्रत्यक्ष संदेश

कौन bot को DM कर सकता है, इसे नियंत्रित करने के लिए `dmPolicy` कॉन्फ़िगर करें:

- `"pairing"` - अज्ञात उपयोगकर्ताओं को pairing कोड मिलता है; CLI के ज़रिए मंज़ूरी दें
- `"allowlist"` - केवल `allowFrom` में सूचीबद्ध उपयोगकर्ता चैट कर सकते हैं
- `"open"` - सार्वजनिक DMs की अनुमति केवल तब दें जब `allowFrom` में `"*"` शामिल हो; प्रतिबंधात्मक प्रविष्टियों के साथ, केवल मेल खाने वाले उपयोगकर्ता चैट कर सकते हैं

**pairing अनुरोध मंज़ूर करें:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### समूह चैट

**समूह नीति** (`channels.feishu.groupPolicy`):

| मान           | व्यवहार                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `"open"`      | समूहों में सभी संदेशों का जवाब दें                                                                     |
| `"allowlist"` | केवल `groupAllowFrom` में या `groups.<chat_id>` के अंतर्गत स्पष्ट रूप से कॉन्फ़िगर किए गए समूहों को जवाब दें |
| `"disabled"`  | सभी समूह संदेश अक्षम करें; स्पष्ट `groups.<chat_id>` प्रविष्टियाँ इसे ओवरराइड नहीं करतीं              |

डिफ़ॉल्ट: `allowlist`

**मेंशन आवश्यकता** (`channels.feishu.requireMention`):

- `true` - @mention आवश्यक है (डिफ़ॉल्ट)
- `false` - @mention के बिना जवाब दें
- प्रति-समूह ओवरराइड: `channels.feishu.groups.<chat_id>.requireMention`
- केवल-ब्रॉडकास्ट `@all` और `@_all` को bot मेंशन नहीं माना जाता। ऐसा संदेश जिसमें `@all` और सीधे bot दोनों का मेंशन हो, फिर भी bot मेंशन के रूप में गिना जाता है।

---

## समूह कॉन्फ़िगरेशन उदाहरण

### सभी समूहों की अनुमति दें, @mention आवश्यक नहीं

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### सभी समूहों की अनुमति दें, फिर भी @mention आवश्यक हो

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### केवल विशिष्ट समूहों की अनुमति दें

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` मोड में, आप स्पष्ट `groups.<chat_id>` प्रविष्टि जोड़कर भी किसी समूह को अनुमति दे सकते हैं। स्पष्ट प्रविष्टियाँ `groupPolicy: "disabled"` को ओवरराइड नहीं करतीं। `groups.*` के अंतर्गत वाइल्डकार्ड डिफ़ॉल्ट मेल खाने वाले समूहों को कॉन्फ़िगर करते हैं, लेकिन वे अपने-आप समूहों को अनुमति नहीं देते।

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### समूह के भीतर भेजने वालों को सीमित करें

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## समूह/उपयोगकर्ता IDs प्राप्त करें

### समूह IDs (`chat_id`, फ़ॉर्मैट: `oc_xxx`)

Feishu/Lark में समूह खोलें, ऊपर-दाएँ कोने में मेन्यू आइकन पर क्लिक करें, और **Settings** पर जाएँ। समूह ID (`chat_id`) सेटिंग पेज पर सूचीबद्ध होती है।

![समूह ID प्राप्त करें](/images/feishu-get-group-id.png)

### उपयोगकर्ता IDs (`open_id`, फ़ॉर्मैट: `ou_xxx`)

gateway शुरू करें, bot को DM भेजें, फिर लॉग जाँचें:

```bash
openclaw logs --follow
```

लॉग आउटपुट में `open_id` खोजें। आप लंबित pairing अनुरोध भी जाँच सकते हैं:

```bash
openclaw pairing list feishu
```

---

## सामान्य कमांड

| कमांड    | विवरण                    |
| -------- | ------------------------ |
| `/status` | bot की स्थिति दिखाएँ     |
| `/reset`  | वर्तमान सत्र रीसेट करें  |
| `/model`  | AI मॉडल दिखाएँ या बदलें |

<Note>
Feishu/Lark मूल slash-command मेन्यू का समर्थन नहीं करता, इसलिए इन्हें सादे टेक्स्ट संदेशों के रूप में भेजें।
</Note>

---

## समस्या निवारण

### bot समूह चैट में जवाब नहीं देता

1. सुनिश्चित करें कि bot समूह में जोड़ा गया है
2. सुनिश्चित करें कि आप bot को @mention करते हैं (डिफ़ॉल्ट रूप से आवश्यक)
3. सत्यापित करें कि `groupPolicy` `"disabled"` नहीं है
4. लॉग जाँचें: `openclaw logs --follow`

### bot को संदेश प्राप्त नहीं होते

1. सुनिश्चित करें कि bot Feishu Open Platform / Lark Developer में प्रकाशित और स्वीकृत है
2. सुनिश्चित करें कि इवेंट सब्सक्रिप्शन में `im.message.receive_v1` शामिल है
3. सुनिश्चित करें कि **persistent connection** (WebSocket) चुना गया है
4. सुनिश्चित करें कि सभी आवश्यक permission scopes दिए गए हैं
5. सुनिश्चित करें कि gateway चल रहा है: `openclaw gateway status`
6. लॉग जाँचें: `openclaw logs --follow`

### QR सेटअप Feishu मोबाइल ऐप में प्रतिक्रिया नहीं देता

1. सेटअप फिर से चलाएँ: `openclaw channels login --channel feishu`
2. मैनुअल सेटअप चुनें
3. Feishu Open Platform में, self-built ऐप बनाएँ और उसका App ID और App Secret कॉपी करें
4. वे credentials सेटअप विज़ार्ड में चिपकाएँ

### App Secret लीक हो गया

1. Feishu Open Platform / Lark Developer में App Secret रीसेट करें
2. अपनी config में मान अपडेट करें
3. gateway पुनः आरंभ करें: `openclaw gateway restart`

---

## उन्नत कॉन्फ़िगरेशन

### कई खाते

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` नियंत्रित करता है कि outbound APIs जब कोई `accountId` निर्दिष्ट नहीं करते, तब कौन सा खाता उपयोग हो।
`accounts.<id>.tts` `messages.tts` जैसी ही आकृति का उपयोग करता है और वैश्विक TTS config पर deep-merge होता है, इसलिए multi-bot Feishu सेटअप shared provider credentials को वैश्विक रूप से रख सकते हैं जबकि प्रति खाते केवल voice, model, persona, या auto mode को ओवरराइड कर सकते हैं।

### संदेश सीमाएँ

- `textChunkLimit` - outbound टेक्स्ट chunk आकार (डिफ़ॉल्ट: `2000` अक्षर)
- `mediaMaxMb` - मीडिया upload/download सीमा (डिफ़ॉल्ट: `30` MB)

### Streaming

Feishu/Lark interactive cards के ज़रिए streaming replies का समर्थन करता है। सक्षम होने पर, bot टेक्स्ट जनरेट करते समय card को वास्तविक समय में अपडेट करता है।

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

पूरा जवाब एक संदेश में भेजने के लिए `streaming: false` सेट करें। `blockStreaming` डिफ़ॉल्ट रूप से बंद है; इसे केवल तब सक्षम करें जब आप अंतिम जवाब से पहले पूर्ण assistant blocks को flush करना चाहते हों।

### कोटा अनुकूलन

दो वैकल्पिक flags के साथ Feishu/Lark API calls की संख्या घटाएँ:

- `typingIndicator` (डिफ़ॉल्ट `true`): typing reaction calls छोड़ने के लिए `false` सेट करें
- `resolveSenderNames` (डिफ़ॉल्ट `true`): sender profile lookups छोड़ने के लिए `false` सेट करें

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACP सत्र

Feishu/Lark DMs और समूह thread संदेशों के लिए ACP का समर्थन करता है। Feishu/Lark ACP text-command driven है - कोई मूल slash-command मेन्यू नहीं हैं, इसलिए बातचीत में सीधे `/acp ...` संदेशों का उपयोग करें।

#### Persistent ACP binding

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### चैट से ACP spawn करें

Feishu/Lark DM या thread में:

```text
/acp spawn codex --thread here
```

`--thread here` DMs और Feishu/Lark thread संदेशों के लिए काम करता है। bound बातचीत में follow-up संदेश सीधे उस ACP सत्र को route होते हैं।

### Multi-agent routing

Feishu/Lark DMs या समूहों को अलग-अलग agents तक route करने के लिए `bindings` का उपयोग करें।

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
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Routing फ़ील्ड:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) या `"group"` (समूह चैट)
- `match.peer.id`: उपयोगकर्ता Open ID (`ou_xxx`) या समूह ID (`oc_xxx`)

lookup सुझावों के लिए [समूह/उपयोगकर्ता IDs प्राप्त करें](#get-groupuser-ids) देखें।

---

## प्रति-उपयोगकर्ता agent isolation (Dynamic Agent Creation)

प्रत्येक DM उपयोगकर्ता के लिए अपने-आप **isolated agent instances** बनाने के लिए `dynamicAgentCreation` सक्षम करें। प्रत्येक उपयोगकर्ता को अपना मिलता है:

- स्वतंत्र workspace directory
- अलग `USER.md` / `SOUL.md` / `MEMORY.md`
- निजी conversation history
- अलग-थलग skills और state

यह सार्वजनिक bots के लिए आवश्यक है जहाँ आप चाहते हैं कि प्रत्येक उपयोगकर्ता को अपना निजी AI assistant अनुभव मिले।

<Note>
Dynamic bindings में normalized Feishu `accountId` शामिल होता है, इसलिए default और named accounts प्रत्येक sender को सही dynamic agent तक route करते हैं।

यदि किसी named account ने पुराने release पर unscoped dynamic agent बनाया था, तो वह legacy agent अभी भी `maxAgents` में गिना जाता है। उसे हटाने से पहले पुष्टि करें कि default account उसका उपयोग नहीं कर रहा है, या अस्थायी रूप से `maxAgents` बढ़ाएँ; OpenClaw सुरक्षित रूप से यह अनुमान नहीं लगा सकता कि ambiguous legacy state किस account की है।
</Note>

### त्वरित सेटअप

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### यह कैसे काम करता है

जब कोई नया उपयोगकर्ता अपना पहला DM भेजता है:

1. चैनल एक unique `agentId` जनरेट करता है: डिफ़ॉल्ट account के लिए `feishu-{user_open_id}`, या named account के लिए bounded account-prefixed identity digest
2. `workspaceTemplate` path पर नया workspace बनाता है
3. agent को register करता है और इस उपयोगकर्ता के लिए binding बनाता है
4. workspace helper पहली access पर bootstrap files (`AGENTS.md`, `SOUL.md`, `USER.md`, आदि) सुनिश्चित करता है
5. इस उपयोगकर्ता के सभी भविष्य के संदेश उनके dedicated agent तक route करता है

### कॉन्फ़िगरेशन विकल्प

| सेटिंग                                                  | विवरण                                | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | प्रति-उपयोगकर्ता agent का स्वचालित निर्माण सक्षम करें   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनामिक agent workspace के लिए पाथ टेम्पलेट | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Agent डायरेक्टरी नाम टेम्पलेट              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले डायनामिक agents की अधिकतम संख्या | असीमित                            |

टेम्पलेट वैरिएबल:

- `{agentId}` - जनरेट किया गया agent ID (उदाहरण, `feishu-ou_xxxxxx` या `feishu-support-<identity_digest>`)
- `{userId}` - भेजने वाले का Feishu open_id (उदाहरण, `ou_xxxxxx`)

### सेशन स्कोप

`session.dmScope` नियंत्रित करता है कि direct messages को agent sessions से कैसे मैप किया जाता है। यह एक **ग्लोबल सेटिंग** है जो सभी channels को प्रभावित करती है।

| मान                        | व्यवहार                                                            | इनके लिए सर्वोत्तम                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | प्रत्येक उपयोगकर्ता का DM उनके agent के main session से मैप होता है                   | एकल-उपयोगकर्ता bots जहां आप चाहते हैं कि `USER.md` / `SOUL.md` अपने-आप लोड हों |
| `"per-channel-peer"`         | प्रत्येक (channel + user) संयोजन को एक अलग session मिलता है           | सार्वजनिक multi-user bots जिन्हें अधिक मजबूत isolation चाहिए                  |
| `"per-account-channel-peer"` | प्रत्येक (account + channel + user) संयोजन को एक अलग session मिलता है | Multi-account bots जिन्हें account-level session isolation चाहिए         |

**ट्रेडऑफ़**: `"main"` का उपयोग automatic bootstrap file loading (`USER.md`, `SOUL.md`, `MEMORY.md`) सक्षम करता है, लेकिन इसका मतलब है कि सभी channels में सभी DMs समान session key pattern साझा करते हैं। सार्वजनिक multi-user bots के लिए, जहां isolation bootstrap auto-loading से अधिक महत्वपूर्ण है, `"per-channel-peer"` पर विचार करें और bootstrap files को मैन्युअली प्रबंधित करें।

<Note>
जब named Feishu accounts को उसी sender के लिए अलग sessions रखने चाहिए, तो `"per-account-channel-peer"` का उपयोग करें। Dynamic bindings account scope को सुरक्षित रखते हैं।
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

### सामान्य multi-user deployment

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### सत्यापन

यह पुष्टि करने के लिए gateway logs जांचें कि dynamic creation काम कर रहा है:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

बनाए गए सभी workspaces की सूची देखें:

```bash
ls -la ~/.openclaw/workspace-*
```

### नोट्स

- **Workspace isolation**: प्रत्येक उपयोगकर्ता को अपनी workspace directory और agent instance मिलता है। सामान्य messaging flow में उपयोगकर्ता एक-दूसरे का conversation history या files नहीं देख सकते।
- **Security boundary**: यह एक messaging-context isolation mechanism है, hostile co-tenant security boundary नहीं। Agent process और host environment साझा होते हैं।
- **`bindings` खाली होना चाहिए**: Dynamic agents अपने bindings अपने-आप register करते हैं
- **Upgrade path**: मौजूदा manual bindings, dynamic agents के साथ काम करना जारी रखते हैं
- **`session.dmScope` ग्लोबल है**: यह केवल Feishu नहीं, सभी channels को प्रभावित करता है

---

## कॉन्फ़िगरेशन संदर्भ

पूर्ण कॉन्फ़िगरेशन: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

| सेटिंग                                                  | विवरण                                                                      | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | Channel सक्षम/अक्षम करें                                                       | `true`                               |
| `channels.feishu.domain`                                 | API domain (`feishu` या `lark`)                                                  | `feishu`                             |
| `channels.feishu.connectionMode`                         | Event transport (`websocket` या `webhook`)                                       | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Outbound routing के लिए default account                                             | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook mode के लिए आवश्यक                                                        | -                                    |
| `channels.feishu.encryptKey`                             | Webhook mode के लिए आवश्यक                                                        | -                                    |
| `channels.feishu.webhookPath`                            | Webhook route path                                                               | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook bind host                                                                | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook bind port                                                                | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | App ID                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | App Secret                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | प्रति-account domain override                                                      | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | प्रति-account TTS override                                                         | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM policy                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM allowlist (open_id सूची)                                                      | -                                    |
| `channels.feishu.groupPolicy`                            | Group policy                                                                     | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Group allowlist                                                                  | -                                    |
| `channels.feishu.requireMention`                         | Groups में @mention आवश्यक करें                                                       | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | प्रति-group @mention override; explicit IDs allowlist mode में group को भी अनुमति देते हैं | विरासत में मिला                            |
| `channels.feishu.groups.<chat_id>.enabled`               | किसी विशिष्ट group को सक्षम/अक्षम करें                                                  | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | प्रति-उपयोगकर्ता agent का स्वचालित निर्माण सक्षम करें                                         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनामिक agent workspaces के लिए पाथ टेम्पलेट                                       | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Agent directory name template                                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले dynamic agents की अधिकतम संख्या                                       | असीमित                            |
| `channels.feishu.textChunkLimit`                         | Message chunk size                                                               | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | Media size limit                                                                 | `30`                                 |
| `channels.feishu.streaming`                              | Streaming card output                                                            | `true`                               |
| `channels.feishu.blockStreaming`                         | Completed-block reply streaming                                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | Typing reactions भेजें                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Sender display names resolve करें                                                     | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base tools सक्षम करें                                                        | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` के लिए alias; दोनों set होने पर explicit `bitable` जीतता है | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | प्रति-account Bitable/Base tool gate                                               | विरासत में मिला                            |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` के लिए प्रति-account alias                                            | विरासत में मिला                            |

---

## समर्थित message types

### प्राप्त करें

- ✅ टेक्स्ट
- ✅ Rich text (post)
- ✅ चित्र
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/media
- ✅ Stickers

Inbound Feishu/Lark audio messages को raw `file_key` JSON के बजाय media placeholders के रूप में normalize किया जाता है। जब `tools.media.audio` configured होता है, OpenClaw voice-note resource डाउनलोड करता है और agent turn से पहले shared audio transcription चलाता है, ताकि agent को बोले गए शब्दों का transcript मिले। यदि Feishu audio payload में सीधे transcript text शामिल करता है, तो वही text किसी दूसरी ASR call के बिना उपयोग किया जाता है। Audio transcription provider के बिना भी, agent को raw Feishu resource payload नहीं, बल्कि `<media:audio>` placeholder और saved attachment मिलता है।

### भेजें

- ✅ टेक्स्ट
- ✅ इमेज
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/मीडिया
- ✅ इंटरैक्टिव कार्ड (स्ट्रीमिंग अपडेट सहित)
- ⚠️ रिच टेक्स्ट (पोस्ट-शैली फ़ॉर्मैटिंग; पूरी Feishu/Lark लेखन क्षमताओं का समर्थन नहीं करता)

नेटिव Feishu/Lark ऑडियो बबल Feishu `audio` संदेश प्रकार का उपयोग करते हैं और
Ogg/Opus अपलोड मीडिया (`file_type: "opus"`) की आवश्यकता होती है। मौजूदा `.opus` और `.ogg` मीडिया
सीधे नेटिव ऑडियो के रूप में भेजा जाता है। MP3/WAV/M4A और अन्य संभावित ऑडियो फ़ॉर्मैट केवल तब
`ffmpeg` के साथ 48kHz Ogg/Opus में ट्रांसकोड किए जाते हैं जब उत्तर वॉयस
डिलीवरी (`audioAsVoice` / संदेश टूल `asVoice`, TTS वॉइस-नोट
उत्तर सहित) का अनुरोध करता है। सामान्य MP3 अटैचमेंट नियमित फ़ाइलें ही रहते हैं। यदि `ffmpeg` अनुपस्थित है या
कन्वर्ज़न विफल हो जाता है, तो OpenClaw फ़ाइल अटैचमेंट पर वापस चला जाता है और कारण लॉग करता है।

### थ्रेड और उत्तर

- ✅ इनलाइन उत्तर
- ✅ थ्रेड उत्तर
- ✅ किसी थ्रेड संदेश का उत्तर देते समय मीडिया उत्तर थ्रेड-अवेयर रहते हैं

`groupSessionScope: "group_topic"` और `"group_topic_sender"` के लिए, नेटिव
Feishu/Lark टॉपिक समूह इवेंट `thread_id` (`omt_*`) को कैनोनिकल
टॉपिक सेशन कुंजी के रूप में उपयोग करते हैं। यदि कोई नेटिव टॉपिक स्टार्टर इवेंट `thread_id` छोड़ देता है, तो OpenClaw
टर्न रूट करने से पहले इसे Feishu से हाइड्रेट करता है। सामान्य समूह उत्तर जिन्हें
OpenClaw थ्रेड में बदलता है, वे रिप्लाई रूट संदेश ID (`om_*`) का उपयोग करते रहते हैं ताकि
पहला टर्न और फ़ॉलो-अप टर्न उसी सेशन में रहें।

---

## संबंधित

- [चैनल अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग फ़्लो
- [समूह](/hi/channels/groups) - समूह चैट व्यवहार और मेंशन गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सेशन रूटिंग
- [सुरक्षा](/hi/gateway/security) - एक्सेस मॉडल और हार्डनिंग
