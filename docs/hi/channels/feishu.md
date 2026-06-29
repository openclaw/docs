---
read_when:
    - आप Feishu/Lark बॉट को कनेक्ट करना चाहते हैं
    - आप Feishu चैनल कॉन्फ़िगर कर रहे हैं
summary: Feishu बॉट का अवलोकन, सुविधाएँ और कॉन्फ़िगरेशन
title: Feishu
x-i18n:
    generated_at: "2026-06-28T22:34:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark एक ऑल-इन-वन सहयोग प्लेटफ़ॉर्म है जहाँ टीमें चैट करती हैं, दस्तावेज़ साझा करती हैं, कैलेंडर प्रबंधित करती हैं, और साथ मिलकर काम पूरा करती हैं।

**स्थिति:** bot DM + समूह चैट के लिए उत्पादन-तैयार। WebSocket डिफ़ॉल्ट मोड है; webhook मोड वैकल्पिक है।

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
  Feishu Open Platform से App ID और App Secret चिपकाने के लिए मैनुअल सेटअप चुनें, या स्वचालित रूप से bot बनाने के लिए QR सेटअप चुनें। यदि घरेलू Feishu मोबाइल ऐप QR कोड पर प्रतिक्रिया नहीं देता है, तो सेटअप फिर से चलाएँ और मैनुअल सेटअप चुनें।
  </Step>
  
  <Step title="सेटअप पूरा होने के बाद, बदलाव लागू करने के लिए gateway को रीस्टार्ट करें">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## पहुँच नियंत्रण

### डायरेक्ट संदेश

कौन bot को DM कर सकता है, इसे नियंत्रित करने के लिए `dmPolicy` कॉन्फ़िगर करें:

- `"pairing"` - अज्ञात उपयोगकर्ताओं को pairing कोड मिलता है; CLI के माध्यम से स्वीकृत करें
- `"allowlist"` - केवल `allowFrom` में सूचीबद्ध उपयोगकर्ता चैट कर सकते हैं
- `"open"` - सार्वजनिक DM केवल तब अनुमति दें जब `allowFrom` में `"*"` शामिल हो; प्रतिबंधात्मक प्रविष्टियों के साथ, केवल मेल खाने वाले उपयोगकर्ता चैट कर सकते हैं
- `"disabled"` - सभी DM अक्षम करें

**pairing अनुरोध स्वीकृत करें:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### समूह चैट

**समूह नीति** (`channels.feishu.groupPolicy`):

| मान           | व्यवहार                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `"open"`      | समूहों में सभी संदेशों का उत्तर दें                                                               |
| `"allowlist"` | केवल `groupAllowFrom` में मौजूद या `groups.<chat_id>` के अंतर्गत स्पष्ट रूप से कॉन्फ़िगर किए गए समूहों को उत्तर दें |
| `"disabled"`  | सभी समूह संदेश अक्षम करें; स्पष्ट `groups.<chat_id>` प्रविष्टियाँ इसे ओवरराइड नहीं करतीं         |

डिफ़ॉल्ट: `allowlist`

**mention आवश्यकता** (`channels.feishu.requireMention`):

- `true` - @mention आवश्यक है (डिफ़ॉल्ट)
- `false` - @mention के बिना उत्तर दें
- प्रति-समूह ओवरराइड: `channels.feishu.groups.<chat_id>.requireMention`
- केवल-ब्रॉडकास्ट `@all` और `@_all` को bot mention नहीं माना जाता। ऐसा संदेश जिसमें `@all` और सीधे bot, दोनों का mention हो, फिर भी bot mention के रूप में गिना जाता है।

---

## समूह कॉन्फ़िगरेशन उदाहरण

### सभी समूहों को अनुमति दें, @mention आवश्यक नहीं

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### सभी समूहों को अनुमति दें, फिर भी @mention आवश्यक रखें

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

### केवल विशिष्ट समूहों को अनुमति दें

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

`allowlist` मोड में, आप स्पष्ट `groups.<chat_id>` प्रविष्टि जोड़कर भी किसी समूह को प्रवेश दे सकते हैं। स्पष्ट प्रविष्टियाँ `groupPolicy: "disabled"` को ओवरराइड नहीं करतीं। `groups.*` के अंतर्गत wildcard डिफ़ॉल्ट मेल खाने वाले समूहों को कॉन्फ़िगर करते हैं, लेकिन वे स्वयं समूहों को प्रवेश नहीं देते।

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

### समूह के भीतर भेजने वालों को प्रतिबंधित करें

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

## समूह/उपयोगकर्ता ID प्राप्त करें

### समूह ID (`chat_id`, प्रारूप: `oc_xxx`)

Feishu/Lark में समूह खोलें, ऊपर-दाएँ कोने में मेनू आइकन पर क्लिक करें, और **सेटिंग्स** पर जाएँ। समूह ID (`chat_id`) सेटिंग्स पेज पर सूचीबद्ध होता है।

![समूह ID प्राप्त करें](/images/feishu-get-group-id.png)

### उपयोगकर्ता ID (`open_id`, प्रारूप: `ou_xxx`)

gateway शुरू करें, bot को DM भेजें, फिर लॉग जाँचें:

```bash
openclaw logs --follow
```

लॉग आउटपुट में `open_id` देखें। आप लंबित pairing अनुरोध भी जाँच सकते हैं:

```bash
openclaw pairing list feishu
```

---

## सामान्य कमांड

| कमांड    | विवरण                         |
| -------- | ----------------------------- |
| `/status` | bot की स्थिति दिखाएँ          |
| `/reset`  | वर्तमान session रीसेट करें    |
| `/model`  | AI model दिखाएँ या बदलें      |

<Note>
Feishu/Lark native slash-command menus का समर्थन नहीं करता, इसलिए इन्हें plain text संदेशों के रूप में भेजें।
</Note>

---

## समस्या निवारण

### bot समूह चैट में उत्तर नहीं देता

1. सुनिश्चित करें कि bot समूह में जोड़ा गया है
2. सुनिश्चित करें कि आप bot को @mention करते हैं (डिफ़ॉल्ट रूप से आवश्यक)
3. सत्यापित करें कि `groupPolicy` `"disabled"` नहीं है
4. लॉग जाँचें: `openclaw logs --follow`

### bot संदेश प्राप्त नहीं करता

1. सुनिश्चित करें कि bot Feishu Open Platform / Lark Developer में प्रकाशित और स्वीकृत है
2. सुनिश्चित करें कि event subscription में `im.message.receive_v1` शामिल है
3. सुनिश्चित करें कि **persistent connection** (WebSocket) चुना गया है
4. सुनिश्चित करें कि सभी आवश्यक permission scopes दिए गए हैं
5. सुनिश्चित करें कि gateway चल रहा है: `openclaw gateway status`
6. लॉग जाँचें: `openclaw logs --follow`

### QR सेटअप Feishu मोबाइल ऐप में प्रतिक्रिया नहीं देता

1. सेटअप फिर से चलाएँ: `openclaw channels login --channel feishu`
2. मैनुअल सेटअप चुनें
3. Feishu Open Platform में, self-built app बनाएँ और उसका App ID और App Secret कॉपी करें
4. वे credentials सेटअप विज़ार्ड में चिपकाएँ

### App Secret लीक हो गया

1. Feishu Open Platform / Lark Developer में App Secret रीसेट करें
2. अपनी config में value अपडेट करें
3. gateway रीस्टार्ट करें: `openclaw gateway restart`

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

`defaultAccount` नियंत्रित करता है कि outbound APIs में `accountId` निर्दिष्ट न होने पर कौन-सा खाता उपयोग किया जाता है।
`accounts.<id>.tts` `messages.tts` जैसा ही shape उपयोग करता है और global TTS config पर deep-merge करता है, इसलिए multi-bot Feishu सेटअप shared provider credentials को global रख सकते हैं और प्रति खाते केवल voice, model, persona, या auto mode को ओवरराइड कर सकते हैं।

### संदेश सीमाएँ

- `textChunkLimit` - outbound text chunk आकार (डिफ़ॉल्ट: `2000` अक्षर)
- `mediaMaxMb` - media upload/download सीमा (डिफ़ॉल्ट: `30` MB)

### Streaming

Feishu/Lark interactive cards के माध्यम से streaming replies का समर्थन करता है। सक्षम होने पर, bot text जनरेट करते समय card को real time में अपडेट करता है।

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

पूरा reply एक संदेश में भेजने के लिए `streaming: false` सेट करें। `blockStreaming` डिफ़ॉल्ट रूप से off है; इसे केवल तब सक्षम करें जब आप final reply से पहले completed assistant blocks flush करना चाहते हों।

### Quota optimization

दो वैकल्पिक flags से Feishu/Lark API calls की संख्या कम करें:

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

### ACP sessions

Feishu/Lark DM और समूह thread messages के लिए ACP का समर्थन करता है। Feishu/Lark ACP text-command driven है - कोई native slash-command menus नहीं हैं, इसलिए conversation में सीधे `/acp ...` messages का उपयोग करें।

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

`--thread here` DM और Feishu/Lark thread messages के लिए काम करता है। bound conversation में follow-up messages सीधे उस ACP session को route होते हैं।

### Multi-agent routing

Feishu/Lark DM या समूहों को अलग-अलग agents पर route करने के लिए `bindings` का उपयोग करें।

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

Routing fields:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) या `"group"` (समूह चैट)
- `match.peer.id`: उपयोगकर्ता Open ID (`ou_xxx`) या समूह ID (`oc_xxx`)

lookup सुझावों के लिए [समूह/उपयोगकर्ता ID प्राप्त करें](#get-groupuser-ids) देखें।

---

## प्रति-उपयोगकर्ता agent isolation (Dynamic Agent Creation)

प्रत्येक DM उपयोगकर्ता के लिए स्वचालित रूप से **isolated agent instances** बनाने के लिए `dynamicAgentCreation` सक्षम करें। प्रत्येक उपयोगकर्ता को अपना मिलता है:

- स्वतंत्र workspace directory
- अलग `USER.md` / `SOUL.md` / `MEMORY.md`
- निजी conversation history
- isolated skills और state

यह public bots के लिए आवश्यक है जहाँ आप चाहते हैं कि प्रत्येक उपयोगकर्ता को अपना निजी AI assistant अनुभव मिले।

<Note>
Dynamic bindings में normalized Feishu `accountId` शामिल होता है, इसलिए default और named accounts प्रत्येक sender को सही dynamic agent पर route करते हैं।

यदि किसी named account ने older release पर unscoped dynamic agent बनाया था, तो वह legacy agent अभी भी `maxAgents` में गिना जाता है। उसे हटाने से पहले पुष्टि करें कि default account उसका उपयोग नहीं करता, या अस्थायी रूप से `maxAgents` बढ़ाएँ; OpenClaw सुरक्षित रूप से अनुमान नहीं लगा सकता कि ambiguous legacy state का स्वामी कौन-सा account है।
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

1. चैनल एक unique `agentId` जनरेट करता है: default account के लिए `feishu-{user_open_id}`, या named account के लिए bounded account-prefixed identity digest
2. `workspaceTemplate` path पर नया workspace बनाता है
3. agent को register करता है और इस उपयोगकर्ता के लिए binding बनाता है
4. workspace helper पहली access पर bootstrap files (`AGENTS.md`, `SOUL.md`, `USER.md`, आदि) सुनिश्चित करता है
5. इस उपयोगकर्ता के सभी भविष्य के messages को उनके dedicated agent पर route करता है

### कॉन्फ़िगरेशन विकल्प

| सेटिंग                                                  | विवरण                                | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | प्रति-उपयोगकर्ता एजेंट निर्माण अपने-आप सक्षम करें   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनेमिक एजेंट वर्कस्पेस के लिए पाथ टेम्पलेट | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | एजेंट डायरेक्टरी नाम टेम्पलेट              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले डायनेमिक एजेंटों की अधिकतम संख्या | असीमित                            |

टेम्पलेट चर:

- `{agentId}` - जनरेट की गई एजेंट आईडी (उदा., `feishu-ou_xxxxxx` या `feishu-support-<identity_digest>`)
- `{userId}` - भेजने वाले का Feishu open_id (उदा., `ou_xxxxxx`)

### सत्र दायरा

`session.dmScope` नियंत्रित करता है कि प्रत्यक्ष संदेशों को एजेंट सत्रों से कैसे मैप किया जाता है। यह एक **वैश्विक सेटिंग** है जो सभी चैनलों को प्रभावित करती है।

| मान                        | व्यवहार                                                            | इनके लिए सबसे अच्छा                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | हर उपयोगकर्ता का DM उसके एजेंट के मुख्य सत्र से मैप होता है                   | एकल-उपयोगकर्ता बॉट जहां आप चाहते हैं कि `USER.md` / `SOUL.md` अपने-आप लोड हों |
| `"per-channel-peer"`         | हर (चैनल + उपयोगकर्ता) संयोजन को अलग सत्र मिलता है           | सार्वजनिक बहु-उपयोगकर्ता बॉट जिन्हें अधिक मजबूत अलगाव चाहिए                  |
| `"per-account-channel-peer"` | हर (खाता + चैनल + उपयोगकर्ता) संयोजन को अलग सत्र मिलता है | बहु-खाता बॉट जिन्हें खाता-स्तर का सत्र अलगाव चाहिए         |

**समझौता**: `"main"` का उपयोग अपने-आप बूटस्ट्रैप फ़ाइल लोडिंग (`USER.md`, `SOUL.md`, `MEMORY.md`) सक्षम करता है, लेकिन इसका मतलब है कि सभी चैनलों के सभी DM समान सत्र कुंजी पैटर्न साझा करते हैं। सार्वजनिक बहु-उपयोगकर्ता बॉट के लिए, जहां अलगाव बूटस्ट्रैप अपने-आप लोडिंग से अधिक महत्वपूर्ण है, `"per-channel-peer"` पर विचार करें और बूटस्ट्रैप फ़ाइलों को मैन्युअल रूप से प्रबंधित करें।

<Note>
`"per-account-channel-peer"` का उपयोग तब करें जब नामित Feishu खातों को उसी भेजने वाले के लिए अलग सत्र रखने चाहिए। डायनेमिक बाइंडिंग खाता दायरा बनाए रखती हैं।
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

### सामान्य बहु-उपयोगकर्ता डिप्लॉयमेंट

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

यह पुष्टि करने के लिए Gateway लॉग जांचें कि डायनेमिक निर्माण काम कर रहा है:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

बनाए गए सभी वर्कस्पेस सूचीबद्ध करें:

```bash
ls -la ~/.openclaw/workspace-*
```

### नोट्स

- **वर्कस्पेस अलगाव**: हर उपयोगकर्ता को अपनी वर्कस्पेस डायरेक्टरी और एजेंट इंस्टेंस मिलता है। सामान्य मैसेजिंग फ्लो के भीतर उपयोगकर्ता एक-दूसरे का बातचीत इतिहास या फ़ाइलें नहीं देख सकते।
- **सुरक्षा सीमा**: यह मैसेजिंग-संदर्भ अलगाव तंत्र है, शत्रुतापूर्ण सह-किरायेदार सुरक्षा सीमा नहीं। एजेंट प्रक्रिया और होस्ट वातावरण साझा हैं।
- **`bindings` खाली होना चाहिए**: डायनेमिक एजेंट अपनी बाइंडिंग अपने-आप रजिस्टर करते हैं
- **अपग्रेड पाथ**: मौजूदा मैन्युअल बाइंडिंग डायनेमिक एजेंटों के साथ काम करती रहती हैं
- **`session.dmScope` वैश्विक है**: यह केवल Feishu ही नहीं, सभी चैनलों को प्रभावित करता है

---

## कॉन्फ़िगरेशन संदर्भ

पूरा कॉन्फ़िगरेशन: [Gateway कॉन्फ़िगरेशन](/hi/gateway/configuration)

| सेटिंग                                                  | विवरण                                                                      | डिफ़ॉल्ट                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | चैनल सक्षम/अक्षम करें                                                       | `true`                               |
| `channels.feishu.domain`                                 | API डोमेन (`feishu` या `lark`)                                                  | `feishu`                             |
| `channels.feishu.connectionMode`                         | इवेंट ट्रांसपोर्ट (`websocket` या `webhook`)                                       | `websocket`                          |
| `channels.feishu.defaultAccount`                         | आउटबाउंड रूटिंग के लिए डिफ़ॉल्ट खाता                                             | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook मोड के लिए आवश्यक                                                        | -                                    |
| `channels.feishu.encryptKey`                             | Webhook मोड के लिए आवश्यक                                                        | -                                    |
| `channels.feishu.webhookPath`                            | Webhook रूट पाथ                                                               | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook बाइंड होस्ट                                                                | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook बाइंड पोर्ट                                                                | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | ऐप आईडी                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | ऐप सीक्रेट                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | प्रति-खाता डोमेन ओवरराइड                                                      | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | प्रति-खाता TTS ओवरराइड                                                         | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM नीति                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM अनुमति सूची (open_id सूची)                                                      | -                                    |
| `channels.feishu.groupPolicy`                            | समूह नीति                                                                     | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | समूह अनुमति सूची                                                                  | -                                    |
| `channels.feishu.requireMention`                         | समूहों में @mention आवश्यक करें                                                       | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | प्रति-समूह @mention ओवरराइड; स्पष्ट आईडी अनुमति सूची मोड में समूह को भी स्वीकार करती हैं | इनहेरिटेड                            |
| `channels.feishu.groups.<chat_id>.enabled`               | किसी विशिष्ट समूह को सक्षम/अक्षम करें                                                  | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | प्रति-उपयोगकर्ता एजेंट निर्माण अपने-आप सक्षम करें                                         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | डायनेमिक एजेंट वर्कस्पेस के लिए पाथ टेम्पलेट                                       | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | एजेंट डायरेक्टरी नाम टेम्पलेट                                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | बनाए जाने वाले डायनेमिक एजेंटों की अधिकतम संख्या                                       | असीमित                            |
| `channels.feishu.textChunkLimit`                         | संदेश खंड आकार                                                               | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | मीडिया आकार सीमा                                                                 | `30`                                 |
| `channels.feishu.streaming`                              | स्ट्रीमिंग कार्ड आउटपुट                                                            | `true`                               |
| `channels.feishu.blockStreaming`                         | पूर्ण-ब्लॉक उत्तर स्ट्रीमिंग                                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | टाइपिंग प्रतिक्रियाएं भेजें                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | भेजने वाले के डिस्प्ले नाम रिज़ॉल्व करें                                                     | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base टूल सक्षम करें                                                        | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` के लिए उपनाम; दोनों सेट होने पर स्पष्ट `bitable` जीतता है | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | प्रति-खाता Bitable/Base टूल गेट                                               | इनहेरिटेड                            |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` के लिए प्रति-खाता उपनाम                                            | इनहेरिटेड                            |

---

## समर्थित संदेश प्रकार

### प्राप्त करें

- ✅ टेक्स्ट
- ✅ रिच टेक्स्ट (post)
- ✅ इमेज
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/मीडिया
- ✅ स्टिकर

इनबाउंड Feishu/Lark ऑडियो संदेशों को कच्चे `file_key` JSON के बजाय मीडिया प्लेसहोल्डर के रूप में सामान्यीकृत किया जाता है। जब `tools.media.audio` कॉन्फ़िगर किया जाता है, OpenClaw वॉइस-नोट संसाधन डाउनलोड करता है और एजेंट टर्न से पहले साझा ऑडियो ट्रांसक्रिप्शन चलाता है, ताकि एजेंट को बोला गया ट्रांसक्रिप्ट मिले। अगर Feishu ऑडियो पेलोड में सीधे ट्रांसक्रिप्ट टेक्स्ट शामिल करता है, तो उसी टेक्स्ट का उपयोग किसी और ASR कॉल के बिना किया जाता है। ऑडियो ट्रांसक्रिप्शन प्रदाता के बिना भी, एजेंट को कच्चे Feishu संसाधन पेलोड के बजाय सहेजा गया अटैचमेंट और एक `<media:audio>` प्लेसहोल्डर मिलता है।

### भेजें

- ✅ पाठ
- ✅ छवियां
- ✅ फ़ाइलें
- ✅ ऑडियो
- ✅ वीडियो/मीडिया
- ✅ इंटरैक्टिव कार्ड (स्ट्रीमिंग अपडेट सहित)
- ⚠️ रिच टेक्स्ट (पोस्ट-शैली फ़ॉर्मैटिंग; पूर्ण Feishu/Lark लेखन क्षमताओं का समर्थन नहीं करता)

नेटिव Feishu/Lark ऑडियो बबल Feishu `audio` संदेश प्रकार का उपयोग करते हैं और
Ogg/Opus अपलोड मीडिया (`file_type: "opus"`) की आवश्यकता होती है। मौजूदा `.opus` और `.ogg` मीडिया
सीधे नेटिव ऑडियो के रूप में भेजा जाता है। MP3/WAV/M4A और अन्य संभावित ऑडियो फ़ॉर्मैट
केवल तब `ffmpeg` के साथ 48kHz Ogg/Opus में ट्रांसकोड किए जाते हैं जब उत्तर वॉइस
डिलीवरी (`audioAsVoice` / संदेश टूल `asVoice`, TTS वॉइस-नोट
उत्तर सहित) का अनुरोध करता है। सामान्य MP3 अटैचमेंट नियमित फ़ाइलें ही रहती हैं। यदि `ffmpeg` अनुपलब्ध है या
रूपांतरण विफल होता है, तो OpenClaw फ़ाइल अटैचमेंट पर वापस चला जाता है और कारण लॉग करता है।

### थ्रेड और उत्तर

- ✅ इनलाइन उत्तर
- ✅ थ्रेड उत्तर
- ✅ किसी थ्रेड संदेश का उत्तर देते समय मीडिया उत्तर थ्रेड-अवेयर रहते हैं

`groupSessionScope: "group_topic"` और `"group_topic_sender"` के लिए, नेटिव
Feishu/Lark विषय समूह इवेंट `thread_id` (`omt_*`) को कैनोनिकल
विषय सत्र कुंजी के रूप में उपयोग करते हैं। यदि कोई नेटिव विषय प्रारंभकर्ता इवेंट `thread_id` छोड़ देता है, तो OpenClaw
टर्न को रूट करने से पहले उसे Feishu से हाइड्रेट करता है। सामान्य समूह उत्तर जिन्हें
OpenClaw थ्रेड में बदलता है, वे उत्तर रूट संदेश ID (`om_*`) का उपयोग जारी रखते हैं ताकि
पहला टर्न और फ़ॉलो-अप टर्न उसी सत्र में रहें।

---

## संबंधित

- [चैनल अवलोकन](/hi/channels) - सभी समर्थित चैनल
- [पेयरिंग](/hi/channels/pairing) - DM प्रमाणीकरण और पेयरिंग फ़्लो
- [समूह](/hi/channels/groups) - समूह चैट व्यवहार और मेंशन गेटिंग
- [चैनल रूटिंग](/hi/channels/channel-routing) - संदेशों के लिए सत्र रूटिंग
- [सुरक्षा](/hi/gateway/security) - एक्सेस मॉडल और हार्डनिंग
